import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

const workflowPath = new URL('../.github/workflows/deploy-avatar.yml', import.meta.url)
const sdkCiWorkflowPath = new URL('../.github/workflows/sdk-ci.yml', import.meta.url)
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
  const match = workflow.match(/      - name: Verify immutable deployment sources\n        id: source-lock\n        shell: bash\n        env:\n          AVATAR_SHA: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}\n        run: \|\n([\s\S]*?)(?=\n      - name:)/u)
  expect(match?.[1]).toBeTruthy()
  return match![1].replace(/^          /gmu, '')
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { force: true, recursive: true })
})

describe('Avatar Pages deployment ownership', () => {
  it('keeps the exact CI-approved Avatar commit when protected main has advanced', () => {
    const root = temporaryDirectory()
    const avatar = join(root, 'avatar')
    const avatarRemote = join(root, 'avatar-remote.git')
    const app = join(root, 'app')
    const appRemote = join(root, 'app-remote.git')
    git(root, ['init', '-b', 'main', avatar])
    writeFileSync(join(avatar, 'approved.txt'), 'approved')
    const approvedAvatar = commit(avatar, 'CI-approved Avatar')
    writeFileSync(join(avatar, 'newer.txt'), 'newer')
    const newerAvatarMain = commit(avatar, 'newer Avatar main')
    git(root, ['clone', '--bare', avatar, avatarRemote])
    git(avatar, ['remote', 'add', 'origin', avatarRemote])
    git(avatar, ['checkout', '--detach', approvedAvatar])

    git(root, ['init', '-b', 'main', app])
    writeFileSync(join(app, 'README.md'), 'app')
    const appCommit = commit(app, 'shared app source')
    git(root, ['clone', '--bare', app, appRemote])
    const appSource = join(avatar, 'app-source')
    git(avatar, ['clone', appRemote, appSource])

    const output = join(root, 'github-output')
    const summary = join(root, 'github-summary')
    execFileSync('bash', ['-c', workflowShell()], {
      cwd: avatar,
      encoding: 'utf8',
      env: {
        ...process.env,
        AVATAR_SHA: approvedAvatar,
        GITHUB_EVENT_NAME: 'workflow_run',
        GITHUB_OUTPUT: output,
        GITHUB_REF: 'refs/heads/main',
        GITHUB_STEP_SUMMARY: summary
      }
    })

    expect(git(avatar, ['rev-parse', 'HEAD'])).toBe(approvedAvatar)
    expect(git(avatar, ['rev-parse', 'origin/main'])).toBe(newerAvatarMain)
    expect(git(appSource, ['rev-parse', 'HEAD'])).toBe(appCommit)
    expect(readFileSync(output, 'utf8')).toContain(`app_sha=${appCommit}`)
    expect(readFileSync(output, 'utf8')).toContain(`avatar_sha=${approvedAvatar}`)
    expect(readFileSync(summary, 'utf8')).toContain(`Avatar: \`${approvedAvatar}\``)
    expect(readFileSync(summary, 'utf8')).toContain(`App dependencies: \`${appCommit}\``)
  })

  it('rejects an Avatar commit that is not reachable from protected main', () => {
    const root = temporaryDirectory()
    const avatar = join(root, 'avatar')
    const avatarRemote = join(root, 'avatar-remote.git')
    const app = join(root, 'app')
    const appRemote = join(root, 'app-remote.git')
    git(root, ['init', '-b', 'main', avatar])
    writeFileSync(join(avatar, 'main.txt'), 'main')
    commit(avatar, 'Avatar main')
    git(root, ['clone', '--bare', avatar, avatarRemote])
    git(avatar, ['remote', 'add', 'origin', avatarRemote])
    git(avatar, ['switch', '-c', 'unprotected'])
    writeFileSync(join(avatar, 'unsafe.txt'), 'unsafe')
    const unsafeAvatar = commit(avatar, 'unsafe Avatar')

    git(root, ['init', '-b', 'main', app])
    writeFileSync(join(app, 'README.md'), 'app')
    commit(app, 'shared app source')
    git(root, ['clone', '--bare', app, appRemote])
    git(avatar, ['clone', appRemote, join(avatar, 'app-source')])

    expect(() => execFileSync('bash', ['-c', workflowShell()], {
      cwd: avatar,
      encoding: 'utf8',
      env: {
        ...process.env,
        AVATAR_SHA: unsafeAvatar,
        GITHUB_EVENT_NAME: 'workflow_run',
        GITHUB_OUTPUT: join(root, 'github-output'),
        GITHUB_REF: 'refs/heads/main',
        GITHUB_STEP_SUMMARY: join(root, 'github-summary')
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })).toThrow()
  })

  it('rejects a manual deployment dispatched from outside protected main', () => {
    expect(() => execFileSync('bash', ['-c', workflowShell()], {
      cwd: temporaryDirectory(),
      encoding: 'utf8',
      env: {
        ...process.env,
        AVATAR_SHA: '0'.repeat(40),
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_OUTPUT: join(temporaryDirectory(), 'github-output'),
        GITHUB_REF: 'refs/heads/recovery'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })).toThrow()
  })

  it('runs only after successful main CI or an explicit main dispatch', () => {
    const workflow = readFileSync(workflowPath, 'utf8')
    const sdkCiWorkflow = readFileSync(sdkCiWorkflowPath, 'utf8')
    expect(sdkCiWorkflow).toMatch(/push:\n\s+branches: \[main\]/u)
    expect(workflow).toContain('workflow_run:')
    expect(workflow).toContain('      - Avatar SDK CI')
    expect(workflow).toContain('      - completed')
    expect(workflow).toContain("if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'")
    expect(workflow).toContain("format('deploy-avatar-noop-{0}', github.run_id)")
    expect(workflow).toContain("cancel-in-progress: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}")
    expect(workflow).toContain('ref: ${{ github.event.workflow_run.head_sha || github.sha }}')
    expect(workflow).toContain('"$GITHUB_EVENT_NAME" == "workflow_dispatch" && "$GITHUB_REF" != "refs/heads/main"')
    expect(workflow).toContain('! "$AVATAR_SHA" =~ ^[0-9a-fA-F]{40}$')
    expect(workflow).toContain('merge-base --is-ancestor "$AVATAR_SHA" origin/main')
    expect(workflow).toContain('merge-base --is-ancestor "$APP_SHA" origin/main')
    expect(workflow).toContain('app_sha: ${{ steps.source-lock.outputs.app_sha }}')
    expect(workflow).toContain('avatar_sha: ${{ steps.source-lock.outputs.avatar_sha }}')
    expect(workflow).toContain('>> "$GITHUB_STEP_SUMMARY"')
    expect(workflow).not.toContain('assets/avatar gitlink')
    expect(workflow).not.toContain('git checkout --detach "$AVATAR_SHA"')
  })
})
