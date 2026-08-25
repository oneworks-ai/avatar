import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

const workflowPath = new URL('../.github/workflows/deploy-avatar.yml', import.meta.url)
const temporaryDirectories: string[] = []

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

const temporaryDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), 'avatar-source-lock-'))
  temporaryDirectories.push(directory)
  return directory
}

const commit = (directory: string, message: string) => {
  git(directory, ['add', '.'])
  git(directory, ['-c', 'user.name=Avatar test', '-c', 'user.email=avatar@example.com', 'commit', '-m', message])
  return git(directory, ['rev-parse', 'HEAD'])
}

const workflowShell = () => {
  const workflow = readFileSync(workflowPath, 'utf8')
  const match = workflow.match(/      - name: Verify immutable app and avatar source\n        id: source-lock\n        shell: bash\n        env:\n          SOURCE_SHA: \$\{\{ inputs\.source_sha \}\}\n        run: \|\n((?:          .*\n?)*)/u)
  expect(match?.[1]).toBeTruthy()
  return match![1].replace(/^          /gmu, '')
}

const resolveShell = () => {
  const workflow = readFileSync(workflowPath, 'utf8')
  const match = workflow.match(/      - name: Resolve app ref\n        id: app-ref\n        shell: bash\n        env:\n          SOURCE_REF: \$\{\{ inputs\.source_ref \}\}\n          SOURCE_SHA: \$\{\{ inputs\.source_sha \}\}\n        run: \|\n((?:          .*\n?)*)/u)
  expect(match?.[1]).toBeTruthy()
  return match![1].replace(/^          /gmu, '')
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { force: true, recursive: true })
})

describe('Avatar Pages immutable app source lock', () => {
  it.each([
    ['refs/heads/recovery', 'main', ''],
    ['refs/heads/main', 'recovery', ''],
    ['refs/heads/main', 'main', 'not-a-sha']
  ])('rejects unsafe deployment input %s / %s / %s', (githubRef, sourceRef, sourceSha) => {
    const output = join(temporaryDirectory(), 'github-output')
    expect(() => execFileSync('bash', ['-c', resolveShell()], {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: output, GITHUB_REF: githubRef, SOURCE_REF: sourceRef, SOURCE_SHA: sourceSha },
      stdio: ['ignore', 'pipe', 'pipe']
    })).toThrow()
  })

  it('checks out the app-approved gitlink even when Avatar main has newer commits', () => {
    const root = temporaryDirectory()
    const avatar = join(root, 'avatar')
    const app = join(root, 'app')
    const appRemote = join(root, 'app-remote.git')
    git(root, ['init', '-b', 'main', avatar])
    writeFileSync(join(avatar, 'approved.txt'), 'approved')
    const approvedAvatar = commit(avatar, 'approved Avatar')
    writeFileSync(join(avatar, 'newer.txt'), 'newer')
    const avatarMain = commit(avatar, 'newer Avatar main')

    git(root, ['init', '-b', 'main', app])
    writeFileSync(join(app, 'README.md'), 'app')
    git(app, ['add', 'README.md'])
    git(app, ['update-index', '--add', '--cacheinfo', `160000,${approvedAvatar},assets/avatar`])
    git(app, ['-c', 'user.name=Avatar test', '-c', 'user.email=avatar@example.com', 'commit', '-m', 'pin approved Avatar'])
    const appCommit = git(app, ['rev-parse', 'HEAD'])
    git(root, ['clone', '--bare', app, appRemote])
    const appSource = join(avatar, 'app-source')
    git(avatar, ['clone', appRemote, appSource])

    const output = join(root, 'github-output')
    execFileSync('bash', ['-c', workflowShell()], {
      cwd: avatar,
      encoding: 'utf8',
      env: { ...process.env, APP_SHA: '', GITHUB_OUTPUT: output, GITHUB_SHA: avatarMain, SOURCE_SHA: appCommit }
    })

    expect(git(avatar, ['rev-parse', 'HEAD'])).toBe(approvedAvatar)
    expect(git(appSource, ['rev-parse', 'HEAD'])).toBe(appCommit)
    expect(readFileSync(output, 'utf8')).toContain(`app_sha=${appCommit}`)
    expect(readFileSync(output, 'utf8')).toContain(`avatar_sha=${approvedAvatar}`)
  })

  it('contains strict main-only input and immutable-source validation guards', () => {
    const workflow = readFileSync(workflowPath, 'utf8')
    expect(workflow).toContain('[[ "$GITHUB_REF" != "refs/heads/main" ]]')
    expect(workflow).toContain('[[ -n "$SOURCE_REF" && "$SOURCE_REF" != "main" ]]')
    expect(workflow).toContain('! "$SOURCE_SHA" =~ ^[0-9a-fA-F]{40}$')
    expect(workflow).toContain('merge-base --is-ancestor "$APP_SHA" origin/main')
    expect(workflow).toContain('^160000[[:space:]]commit[[:space:]]([0-9a-fA-F]{40})')
    expect(workflow).toContain('merge-base --is-ancestor "$AVATAR_SHA" "$GITHUB_SHA"')
    expect(workflow).toContain('git checkout --detach "$AVATAR_SHA"')
  })
})
