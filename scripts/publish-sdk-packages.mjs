import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const prepareOnly = process.argv.includes('--prepare-only')
const publishPrepared = process.argv.includes('--publish-prepared')
const dryRun = process.argv.includes('--dry-run') || prepareOnly
const publishTag = process.env.PUBLISH_TAG?.trim() || 'rc'
const packages = [
  { directory: 'packages/avatar', name: '@oneworks/avatar' },
  { directory: 'packages/react', name: '@oneworks/avatar-react' },
  { directory: 'packages/web', name: '@oneworks/avatar-web' },
  { directory: 'packages/vue', name: '@oneworks/avatar-vue' }
]

if (!/^[a-z0-9][a-z0-9._-]*$/u.test(publishTag)) {
  throw new Error(`Invalid npm publish tag: ${publishTag}`)
}
if (prepareOnly && publishPrepared) {
  throw new Error('--prepare-only and --publish-prepared are mutually exclusive')
}
if (publishPrepared && process.env.NPM_PUBLISH_TARBALL_DIRECTORY == null) {
  throw new Error('--publish-prepared requires NPM_PUBLISH_TARBALL_DIRECTORY')
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0', ...options.env },
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe']
  })
  if (result.status !== 0 && !options.allowFailure) {
    process.stderr.write(result.stdout)
    process.stderr.write(result.stderr)
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`)
  }
  return result
}

const readJson = async file => JSON.parse(await readFile(file, 'utf8'))
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const sha512Integrity = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`

const npmView = (selector, field) => {
  const result = run('npm', ['view', selector, field, '--json'], { allowFailure: true })
  if (result.status !== 0) return undefined
  const output = result.stdout.trim()
  if (output.length === 0) return undefined
  const value = JSON.parse(output)
  return typeof value === 'string' ? value : undefined
}

const verifyRegistryPackage = async ({ integrity, name, version }) => {
  const selector = `${name}@${version}`
  for (let attempt = 1; attempt <= 18; attempt += 1) {
    const registryIntegrity = npmView(selector, 'dist.integrity')
    const registryTag = npmView(name, `dist-tags.${publishTag}`)
    const provenancePredicate = npmView(
      selector,
      'dist.attestations.provenance.predicateType'
    )
    if (
      registryIntegrity === integrity &&
      registryTag === version &&
      provenancePredicate === 'https://slsa.dev/provenance/v1'
    ) return
    if (registryIntegrity != null && registryIntegrity !== integrity) {
      throw new Error(`${selector} exists with a different tarball integrity`)
    }
    if (attempt < 18) await sleep(5_000)
  }
  throw new Error(`${selector} did not converge in the npm registry with tag ${publishTag}`)
}

const temporaryRoot = publishPrepared
  ? undefined
  : await mkdtemp(path.join(tmpdir(), 'oneworks-avatar-publish-'))
const tarballDirectory = process.env.NPM_PUBLISH_TARBALL_DIRECTORY == null
  ? path.join(temporaryRoot, 'tarballs')
  : path.resolve(process.env.NPM_PUBLISH_TARBALL_DIRECTORY)

try {
  if (!publishPrepared) await mkdir(tarballDirectory, { recursive: true })

  const manifests = await Promise.all(
    packages.map(async packageInfo => ({
      ...packageInfo,
      manifest: await readJson(path.join(root, packageInfo.directory, 'package.json'))
    }))
  )
  const versions = new Set(manifests.map(item => item.manifest.version))
  if (versions.size !== 1) throw new Error('All Avatar SDK packages must use one release version')
  const [version] = versions
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
    throw new Error(`Invalid SDK package version: ${version}`)
  }

  for (const { directory, manifest, name } of manifests) {
    if (manifest.name !== name || manifest.private === true) {
      throw new Error(`Invalid public package identity for ${directory}`)
    }
    if (
      manifest.repository?.url !== 'https://github.com/oneworks-ai/avatar.git' ||
      manifest.repository?.directory !== directory
    ) {
      throw new Error(`Invalid repository metadata for ${name}`)
    }
  }

  if (!publishPrepared) {
    run('pnpm', ['build:sdk'])
    for (const { name } of packages) {
      run('pnpm', ['--filter', name, 'pack', '--pack-destination', tarballDirectory])
    }
  }

  const tarballNames = await readdir(tarballDirectory)
  const releasePackages = []
  for (const { directory, name } of packages) {
    const tarballName = `${name.slice(1).replace('/', '-')}-${version}.tgz`
    if (!tarballNames.includes(tarballName)) {
      throw new Error(`Missing exact packed tarball ${tarballName} for ${name}`)
    }
    const tarballPath = path.join(tarballDirectory, tarballName)
    const packedManifest = JSON.parse(run('tar', ['-xOf', tarballPath, 'package/package.json']).stdout)
    if (
      packedManifest.name !== name ||
      packedManifest.version !== version ||
      packedManifest.repository?.url !== 'https://github.com/oneworks-ai/avatar.git' ||
      packedManifest.repository?.directory !== directory
    ) {
      throw new Error(`Packed manifest mismatch for ${name}`)
    }
    for (const dependency of Object.values(packedManifest.dependencies ?? {})) {
      if (/^(?:link|workspace):/u.test(String(dependency))) {
        throw new Error(`Unresolved packed dependency for ${name}: ${dependency}`)
      }
    }
    const integrity = sha512Integrity(await readFile(tarballPath))
    releasePackages.push({ integrity, name, tarballPath, version })
  }

  const publicationPlan = []
  const preflightFailures = []
  for (const releasePackage of releasePackages) {
    const selector = `${releasePackage.name}@${version}`
    const registryIntegrity = npmView(selector, 'dist.integrity')
    if (registryIntegrity != null) {
      if (registryIntegrity !== releasePackage.integrity) {
        throw new Error(`${selector} already exists with a different tarball integrity`)
      }
      const registryTag = npmView(releasePackage.name, `dist-tags.${publishTag}`)
      const provenancePredicate = npmView(
        selector,
        'dist.attestations.provenance.predicateType'
      )
      let existingValid = true
      if (registryTag !== version) {
        preflightFailures.push(`${selector} does not own npm dist-tag ${publishTag}`)
        existingValid = false
      }
      if (provenancePredicate !== 'https://slsa.dev/provenance/v1') {
        preflightFailures.push(`${selector} has no npm SLSA provenance attestation`)
        existingValid = false
      }
      publicationPlan.push({
        releasePackage,
        status: existingValid ? 'existing' : 'invalid-existing'
      })
      continue
    }
    const identityExists = npmView(releasePackage.name, 'name') === releasePackage.name
    if (!identityExists) {
      const message = `${releasePackage.name} must be bootstrapped once and bound to this workflow before tokenless publishing`
      preflightFailures.push(message)
    }
    publicationPlan.push({ releasePackage, status: identityExists ? 'publish' : 'bootstrap' })
  }

  if (preflightFailures.length > 0 && !dryRun) {
    throw new Error(`Avatar SDK publish preflight failed before any package was published:\n- ${preflightFailures.join('\n- ')}`)
  }

  for (const { releasePackage, status } of publicationPlan) {
    const selector = `${releasePackage.name}@${version}`
    if (status === 'existing') {
      process.stdout.write(`Verified existing ${selector}; skipping immutable republish.\n`)
      continue
    }
    if (status === 'invalid-existing') {
      process.stdout.write(`Dry run: ${selector} failed dist-tag or provenance validation.\n`)
      continue
    }
    if (status === 'bootstrap') {
      process.stdout.write(`Dry run: ${preflightFailures.find(message => message.startsWith(releasePackage.name))}.\n`)
      continue
    }
    if (dryRun) {
      process.stdout.write(`Dry run: ${selector} is ready to publish with tag ${publishTag}.\n`)
      continue
    }
    run(
      'npm',
      [
        'publish',
        releasePackage.tarballPath,
        '--access',
        'public',
        '--tag',
        publishTag,
        '--provenance'
      ],
      { stdio: 'inherit' }
    )
  }

  if (!dryRun) {
    for (const releasePackage of releasePackages) await verifyRegistryPackage(releasePackage)
    for (const { name } of releasePackages) {
      run('npm', ['pack', `${name}@${version}`, '--dry-run', '--json'])
    }
    process.stdout.write(`Published and verified OneWorks Avatar SDK ${version}.\n`)
  }

  if (process.env.GITHUB_OUTPUT != null) {
    const fs = await import('node:fs/promises')
    await fs.appendFile(process.env.GITHUB_OUTPUT, `version=${version}\n`)
  }
} finally {
  if (temporaryRoot != null) await rm(temporaryRoot, { force: true, recursive: true })
}
