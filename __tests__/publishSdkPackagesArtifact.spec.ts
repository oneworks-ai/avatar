import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url).pathname
const script = new URL('../scripts/publish-sdk-packages.mjs', import.meta.url).pathname
const directories: string[] = []
const sourceSha = '0998f9d6266d71c757ab8956b8fba0b92c3226e2'
const version = JSON.parse(readFileSync(join(root, 'packages/avatar/package.json'), 'utf8')).version

const temporaryDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), 'avatar-publish-artifact-'))
  directories.push(directory)
  return directory
}

const fingerprint = (directory: string) => Object.fromEntries(
  ['avatar-sdk-candidate.json', `oneworks-avatar-${version}.tgz`, `oneworks-avatar-react-${version}.tgz`, `oneworks-avatar-vue-${version}.tgz`, `oneworks-avatar-web-${version}.tgz`]
    .map(name => {
      const file = join(directory, name)
      return [name, {
        hash: createHash('sha512').update(readFileSync(file)).digest('hex'),
        mtimeMs: statSync(file).mtimeMs
      }]
    })
)

const createFakePackageTools = () => {
  const directory = temporaryDirectory()
  writeFileSync(join(directory, 'pnpm'), `#!/usr/bin/env node
const { execFileSync } = require('node:child_process')
const { mkdtempSync, readFileSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const args = process.argv.slice(2)
if (args[0] === 'build:sdk') process.exit(0)
const names = {
  '@oneworks/avatar': 'packages/avatar',
  '@oneworks/avatar-react': 'packages/react',
  '@oneworks/avatar-web': 'packages/web',
  '@oneworks/avatar-vue': 'packages/vue'
}
const name = args[args.indexOf('--filter') + 1]
const destination = args[args.indexOf('--pack-destination') + 1]
if (!names[name] || !destination) process.exit(2)
const manifest = JSON.parse(readFileSync(join(process.cwd(), names[name], 'package.json')))
delete manifest.dependencies
const staging = mkdtempSync(join(tmpdir(), 'avatar-fake-pack-'))
const packageDirectory = join(staging, 'package')
require('node:fs').mkdirSync(packageDirectory)
writeFileSync(join(packageDirectory, 'package.json'), JSON.stringify(manifest))
const tarball = name.slice(1).replace('/', '-') + '-' + manifest.version + '.tgz'
execFileSync('tar', ['-czf', join(destination, tarball), 'package'], { cwd: staging })
`)
  writeFileSync(join(directory, 'npm'), '#!/bin/sh\nexit 1\n')
  chmodSync(join(directory, 'pnpm'), 0o755)
  chmodSync(join(directory, 'npm'), 0o755)
  return directory
}

const run = (directory: string, args: string[]) => spawnSync(process.execPath, [script, ...args], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    GITHUB_SHA: sourceSha,
    NPM_PUBLISH_TARBALL_DIRECTORY: directory,
    PATH: `${createFakePackageTools()}:${process.env.PATH}`
  }
})

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { force: true, recursive: true })
})

describe('immutable npm publish artifacts', () => {
  it('prepares then verifies a real tarball fixture without modifying it', () => {
    const artifactDirectory = temporaryDirectory()
    expect(run(artifactDirectory, ['--prepare-only']).status).toBe(0)
    const before = fingerprint(artifactDirectory)
    expect(run(artifactDirectory, ['--verify-prepared']).status).toBe(0)
    expect(fingerprint(artifactDirectory)).toEqual(before)
  })

  it('fails verification after a tarball is tampered without touching the candidate files', () => {
    const artifactDirectory = temporaryDirectory()
    expect(run(artifactDirectory, ['--prepare-only']).status).toBe(0)
    const tarball = join(artifactDirectory, `oneworks-avatar-${version}.tgz`)
    writeFileSync(tarball, 'tampered')
    const before = fingerprint(artifactDirectory)
    expect(run(artifactDirectory, ['--verify-prepared']).status).not.toBe(0)
    expect(fingerprint(artifactDirectory)).toEqual(before)
  })

  it('fails verification when the artifact directory contains an extra tarball', () => {
    const artifactDirectory = temporaryDirectory()
    expect(run(artifactDirectory, ['--prepare-only']).status).toBe(0)
    writeFileSync(join(artifactDirectory, 'unexpected.tgz'), 'extra')
    expect(run(artifactDirectory, ['--verify-prepared']).status).not.toBe(0)
  })

  it('fails verification when a required tarball is missing', () => {
    const artifactDirectory = temporaryDirectory()
    expect(run(artifactDirectory, ['--prepare-only']).status).toBe(0)
    unlinkSync(join(artifactDirectory, `oneworks-avatar-vue-${version}.tgz`))
    expect(run(artifactDirectory, ['--verify-prepared']).status).not.toBe(0)
  })

  it('fails verification when the manifest attempts a tarball path traversal', () => {
    const artifactDirectory = temporaryDirectory()
    expect(run(artifactDirectory, ['--prepare-only']).status).toBe(0)
    const manifestPath = join(artifactDirectory, 'avatar-sdk-candidate.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.packages[0].tarball = '../outside.tgz'
    writeFileSync(manifestPath, JSON.stringify(manifest))
    expect(run(artifactDirectory, ['--verify-prepared']).status).not.toBe(0)
  })

  it.each([
    ['--prepare-only', '--publish-prepared'],
    ['--prepare-only', '--verify-prepared'],
    ['--publish-prepared', '--verify-prepared']
  ])('rejects mutually exclusive modes: %s %s', (first, second) => {
    const result = run(temporaryDirectory(), [first, second])
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('mutually exclusive')
  })
})
