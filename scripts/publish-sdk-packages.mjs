import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { verifyAvatarSdkAttestations } from './avatar-sdk-provenance.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const prepareOnly = process.argv.includes('--prepare-only')
const publishPrepared = process.argv.includes('--publish-prepared')
const verifyPrepared = process.argv.includes('--verify-prepared')
const shouldPack = !publishPrepared && !verifyPrepared
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
if ([prepareOnly, publishPrepared, verifyPrepared].filter(Boolean).length > 1) {
  throw new Error('--prepare-only, --publish-prepared, and --verify-prepared are mutually exclusive')
}
if ((publishPrepared || verifyPrepared) && process.env.NPM_PUBLISH_TARBALL_DIRECTORY == null) {
  throw new Error('--publish-prepared and --verify-prepared require NPM_PUBLISH_TARBALL_DIRECTORY')
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

const expectedTarballName = ({ name }, version) => `${name.slice(1).replace('/', '-')}-${version}.tgz`

const exactNames = (actual, expected, description) => {
  if (actual.length !== expected.length || actual.some((name, index) => name !== expected[index])) {
    throw new Error(`${description} must contain exactly: ${expected.join(', ')}`)
  }
}

const verifyArtifactDirectory = async ({ allowManifest, tarballDirectory, tarballNames }) => {
  const entries = await readdir(tarballDirectory, { withFileTypes: true })
  const expected = [...tarballNames, ...(allowManifest ? ['avatar-sdk-candidate.json'] : [])].sort()
  exactNames(entries.map(entry => entry.name).sort(), expected, 'Prepared npm tarball directory')
  for (const entry of entries) {
    if (!entry.isFile()) throw new Error(`Prepared npm tarball entry is not a regular file: ${entry.name}`)
  }
}

const verifyArtifactManifest = ({ manifest, releasePackages, sourceSha, version }) => {
  if (
    manifest?.schema !== 1 || !/^[0-9a-f]{40}$/u.test(sourceSha) ||
    manifest?.sourceSha !== sourceSha || manifest?.version !== version
  ) {
    throw new Error('Prepared npm tarball manifest does not match the exact source or version')
  }
  if (!Array.isArray(manifest.packages) || manifest.packages.length !== releasePackages.length) {
    throw new Error('Prepared npm tarball manifest does not list exactly four packages')
  }
  const expected = new Map(releasePackages.map(releasePackage => [releasePackage.name, releasePackage]))
  const seen = new Set()
  for (const item of manifest.packages) {
    const releasePackage = expected.get(item?.name)
    if (
      releasePackage == null || seen.has(item.name) ||
      item.tarball !== path.basename(releasePackage.tarballPath) ||
      item.integrity !== releasePackage.integrity
    ) {
      throw new Error('Prepared npm tarball manifest package identity or integrity does not match')
    }
    seen.add(item.name)
  }
  if (seen.size !== expected.size) throw new Error('Prepared npm tarball manifest is missing a package')
}

const npmView = (selector, field) => {
  const result = run('npm', ['view', selector, field, '--json'], { allowFailure: true })
  if (result.status !== 0) return undefined
  const output = result.stdout.trim()
  if (output.length === 0) return undefined
  const value = JSON.parse(output)
  return typeof value === 'string' ? value : undefined
}

const verifyRegistryAttestations = async ({ integrity, name, version }) => {
  const selector = `${name}@${version}`
  const attestationUrl = npmView(selector, 'dist.attestations.url')
  if (attestationUrl == null) {
    throw new Error(`${selector} has no npm attestation URL`)
  }
  const response = await fetch(attestationUrl)
  if (!response.ok) {
    throw new Error(`${selector} npm attestation request failed with ${response.status}`)
  }
  const body = await response.json()
  verifyAvatarSdkAttestations({
    attestations: body?.attestations,
    integrity,
    name,
    sourceSha: process.env.GITHUB_SHA?.trim() ?? '',
    version
  })
}

const verifyRegistryPackage = async ({ integrity, name, version }) => {
  const selector = `${name}@${version}`
  for (let attempt = 1; attempt <= 18; attempt += 1) {
    const registryIntegrity = npmView(selector, 'dist.integrity')
    const registryTag = npmView(name, `dist-tags.${publishTag}`)
    if (
      registryIntegrity === integrity &&
      registryTag === version
    ) {
      try {
        await verifyRegistryAttestations({ integrity, name, version })
        return
      } catch (error) {
        if (attempt === 18) throw error
      }
    }
    if (registryIntegrity != null && registryIntegrity !== integrity) {
      throw new Error(`${selector} exists with a different tarball integrity`)
    }
    if (attempt < 18) await sleep(5_000)
  }
  throw new Error(`${selector} did not converge in the npm registry with tag ${publishTag}`)
}

const temporaryRoot = (publishPrepared || verifyPrepared)
  ? undefined
  : await mkdtemp(path.join(tmpdir(), 'oneworks-avatar-publish-'))
const tarballDirectory = process.env.NPM_PUBLISH_TARBALL_DIRECTORY == null
  ? path.join(temporaryRoot, 'tarballs')
  : path.resolve(process.env.NPM_PUBLISH_TARBALL_DIRECTORY)

try {
  if (shouldPack) await mkdir(tarballDirectory, { recursive: true })

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

  if (shouldPack) {
    run('pnpm', ['build:sdk'])
    for (const { name } of packages) {
      run('pnpm', ['--filter', name, 'pack', '--pack-destination', tarballDirectory])
    }
  }

  const tarballNames = packages.map(packageInfo => expectedTarballName(packageInfo, version)).sort()
  await verifyArtifactDirectory({
    allowManifest: publishPrepared || verifyPrepared,
    tarballDirectory,
    tarballNames
  })
  const releasePackages = []
  for (const { directory, name } of packages) {
    const tarballName = expectedTarballName({ name }, version)
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

  const artifactManifest = {
    schema: 1,
    sourceSha: process.env.GITHUB_SHA?.trim() ?? '',
    version,
    packages: releasePackages.map(({ integrity, name, tarballPath }) => ({
      integrity,
      name,
      tarball: path.basename(tarballPath)
    }))
  }
  if (prepareOnly) {
    if (!/^[0-9a-f]{40}$/u.test(artifactManifest.sourceSha)) {
      throw new Error('Prepared npm tarballs require an exact GITHUB_SHA')
    }
    await writeFile(
      path.join(tarballDirectory, 'avatar-sdk-candidate.json'),
      `${JSON.stringify(artifactManifest, null, 2)}\n`
    )
  }
  if (publishPrepared || verifyPrepared) {
    const manifestPath = path.join(tarballDirectory, 'avatar-sdk-candidate.json')
    const preparedManifest = await readJson(manifestPath)
    verifyArtifactManifest({
      manifest: preparedManifest,
      releasePackages,
      sourceSha: artifactManifest.sourceSha,
      version
    })
  }
  if (verifyPrepared) {
    process.stdout.write(`Verified immutable OneWorks Avatar SDK tarballs for ${version}.\n`)
  }

  if (!verifyPrepared) {
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
      let existingValid = true
      if (registryTag !== version) {
        preflightFailures.push(`${selector} does not own npm dist-tag ${publishTag}`)
        existingValid = false
      }
      try {
        await verifyRegistryAttestations(releasePackage)
      } catch (error) {
        preflightFailures.push(error instanceof Error ? error.message : String(error))
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
  }
} finally {
  if (temporaryRoot != null) await rm(temporaryRoot, { force: true, recursive: true })
}
