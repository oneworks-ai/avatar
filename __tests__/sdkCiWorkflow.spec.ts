import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const workflowPath = new URL('../.github/workflows/sdk-ci.yml', import.meta.url)
const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
const commit = (cwd: string, message: string) => {
  git(cwd, ['add', '-A'])
  git(cwd, ['-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-m', message])
  return git(cwd, ['rev-parse', 'HEAD'])
}

const workflowBlock = (name: string) => {
  const workflow = readFileSync(workflowPath, 'utf8')
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  const match = workflow.match(new RegExp(`      - name: ${escaped}\\n[\\s\\S]*?        run: \\|\\n([\\s\\S]*?)(?=\\n      - name:|\\n  sdk:)`, 'u'))
  expect(match?.[1]).toBeTruthy()
  return match![1].replace(/^          /gmu, '')
}

const classifier = () => workflowBlock('Classify validation scope')
  .replace("evidence_scope='${{ steps.evidence.outputs.scope }}'", 'evidence_scope="$EVIDENCE_SCOPE"')

const evidenceEligibility = () => workflowBlock('Guard reusable evidence trust boundary')

const docsValidator = () => {
  const workflow = readFileSync(workflowPath, 'utf8')
  const match = workflow.match(/          python3 - <<'PY'\n([\s\S]*?)\n          PY/u)
  expect(match?.[1]).toBeTruthy()
  return match![1].replace(/^          /gmu, '')
}

describe('Avatar SDK CI workflow', () => {
  it('keeps the required identity behind validation and produces evidence in an isolated job', () => {
    const workflow = readFileSync(workflowPath, 'utf8')

    expect(workflow).toMatch(/^name: Avatar SDK CI$/mu)
    expect(workflow).toMatch(/^  sdk:\n    name: build-test-pack\n    needs: validate\n    if: always\(\)/mu)
    expect(workflow).toContain("if [[ \"$VALIDATION_RESULT\" != success ]]")
    expect(workflow).toContain("run.name !== 'Avatar SDK CI'")
    expect(workflow).toContain("run.path !== '.github/workflows/sdk-ci.yml'")
    expect(workflow).toContain('run.head_sha !== headSha')
    expect(workflow).toContain('integration.parents[0]?.sha !== baseSha')
    expect(workflow).toContain('integration.parents[1]?.sha !== headSha')
    expect(workflow).toContain('uses: actions/upload-artifact@v4')
    expect(workflow).toContain('name: avatar-pr-ci-evidence-${{ github.run_id }}-${{ github.run_attempt }}')
    expect(workflow).toContain('retention-days: 2')
    expect(workflow).toContain('if-no-files-found: error')
    expect(workflow).toMatch(/^permissions:\n  actions: read\n  contents: read\n  pull-requests: read$/mu)

    const sdkJob = workflow.slice(workflow.indexOf('\n  sdk:'))
    expect(sdkJob).not.toContain('actions/checkout')
    expect(sdkJob).not.toContain('scripts/verify-pr-ci-evidence.mjs')
  })

  it('executes the classifier matrix with cover precedence and fail-closed events', () => {
    const root = mkdtempSync(join(tmpdir(), 'avatar-sdk-scope-'))
    git(root, ['init', '-b', 'main'])
    mkdirSync(join(root, 'src'))
    mkdirSync(join(root, 'scripts'))
    mkdirSync(join(root, '.github', 'assets'), { recursive: true })
    mkdirSync(join(root, '.github', 'workflows'), { recursive: true })
    const covers = [
      'avatar-cover-light-en.jpg',
      'avatar-cover-dark-en.jpg',
      'avatar-cover-light-zh-Hans.jpg',
      'avatar-cover-dark-zh-Hans.jpg'
    ]
    writeFileSync(join(root, 'README.md'), 'base\n')
    writeFileSync(join(root, 'src', 'code.ts'), 'base\n')
    writeFileSync(join(root, 'scripts', 'readme-cover.html'), '<!doctype html>\n')
    for (const cover of covers) writeFileSync(join(root, '.github', 'assets', cover), 'cover\n')
    writeFileSync(join(root, '.github', 'assets', 'bear-breed-profiles.png'), 'bear\n')
    writeFileSync(join(root, '.github', 'workflows', 'other.yml'), 'name: other\n')
    const base = commit(root, 'base')

    const make = (name: string, mutate: () => void) => {
      git(root, ['checkout', '--detach', base])
      mutate()
      return commit(root, name)
    }
    const coverHeads = covers.map(cover => make(cover, () => writeFileSync(join(root, '.github', 'assets', cover), `new ${cover}\n`)))
    const docs = make('docs', () => writeFileSync(join(root, 'README.md'), 'docs\n'))
    const source = make('source', () => writeFileSync(join(root, 'src', 'code.ts'), 'source\n'))
    const coverHtml = make('cover html', () => writeFileSync(join(root, 'scripts', 'readme-cover.html'), '<script>bad</script>\n'))
    const bear = make('bear', () => writeFileSync(join(root, '.github', 'assets', 'bear-breed-profiles.png'), 'changed\n'))
    const otherGithub = make('other github', () => writeFileSync(join(root, '.github', 'workflows', 'other.yml'), 'name: changed\n'))
    const unknown = make('unknown', () => writeFileSync(join(root, 'unknown.txt'), 'unknown\n'))
    const deletion = make('delete', () => rmSync(join(root, 'src', 'code.ts')))
    const rename = make('rename', () => git(root, ['mv', 'README.md', 'README-renamed.md']))
    const executable = make('mode', () => chmodSync(join(root, 'README.md'), 0o755))
    const symlink = make('symlink', () => {
      rmSync(join(root, 'README.md'))
      symlinkSync('src/code.ts', join(root, 'README.md'))
    })
    const mixed = make('mixed', () => {
      writeFileSync(join(root, 'README.md'), 'docs\n')
      writeFileSync(join(root, 'src', 'code.ts'), 'source\n')
    })

    const run = (event: string, head: string, evidence = 'reused-pr-ci') => {
      const output = join(root, `out-${event}-${head.slice(0, 8)}-${evidence}`)
      rmSync(output, { force: true })
      execFileSync('bash', ['-c', classifier()], {
        cwd: root,
        env: { ...process.env, EVENT_NAME: event, BASE_SHA: base, HEAD_SHA: head, EVIDENCE_SCOPE: evidence, GITHUB_OUTPUT: output },
        stdio: 'pipe'
      })
      return readFileSync(output, 'utf8').match(/^scope=(.*)$/m)?.[1]
    }

    for (const cover of coverHeads) expect(run('pull_request', cover, 'full')).toBe('docs-assets')
    expect(run('pull_request', docs, 'full')).toBe('docs-assets')
    expect(run('pull_request', source, 'full')).toBe('full')
    for (const cover of coverHeads) expect(run('push', cover)).toBe('docs-assets')
    expect(run('push', source)).toBe('reused-pr-ci')
    expect(run('push', source, 'full')).toBe('full')
    expect(run('push', docs, 'full')).toBe('full')
    expect(run('workflow_dispatch', coverHeads[0])).toBe('full')
    for (const head of [coverHtml, bear, otherGithub, unknown, deletion, rename, executable, symlink, mixed]) {
      expect(run('push', head)).toBe('full')
    }
  })

  it('forces full evidence eligibility when the workflow or consumer changes', () => {
    const root = mkdtempSync(join(tmpdir(), 'avatar-evidence-boundary-'))
    git(root, ['init', '-b', 'main'])
    mkdirSync(join(root, '.github', 'workflows'), { recursive: true })
    mkdirSync(join(root, 'scripts'))
    mkdirSync(join(root, 'src'))
    writeFileSync(join(root, '.github', 'workflows', 'sdk-ci.yml'), 'base\n')
    writeFileSync(join(root, 'scripts', 'verify-pr-ci-evidence.mjs'), 'base\n')
    writeFileSync(join(root, 'src', 'code.ts'), 'base\n')
    const base = commit(root, 'base')
    const make = (path: string) => {
      git(root, ['checkout', '--detach', base])
      writeFileSync(join(root, path), 'changed\n')
      return commit(root, path)
    }
    const source = make('src/code.ts')
    const workflow = make('.github/workflows/sdk-ci.yml')
    const helper = make('scripts/verify-pr-ci-evidence.mjs')
    const run = (head: string) => {
      const output = join(root, `eligibility-${head.slice(0, 8)}`)
      execFileSync('bash', ['-c', evidenceEligibility()], {
        cwd: root,
        env: { ...process.env, EVENT_NAME: 'push', BASE_SHA: base, HEAD_SHA: head, GITHUB_OUTPUT: output },
        stdio: 'pipe'
      })
      return readFileSync(output, 'utf8').match(/^allowed=(.*)$/m)?.[1]
    }
    expect(run(source)).toBe('true')
    expect(run(workflow)).toBe('false')
    expect(run(helper)).toBe('false')
  })

  it('validates all four real README cover links during a cover-only update', () => {
    const root = mkdtempSync(join(tmpdir(), 'avatar-cover-validator-'))
    git(root, ['init', '-b', 'main'])
    mkdirSync(join(root, '.github', 'assets'), { recursive: true })
    const en = ['.github/assets/avatar-cover-dark-en.jpg', '.github/assets/avatar-cover-light-en.jpg']
    const zh = ['.github/assets/avatar-cover-dark-zh-Hans.jpg', '.github/assets/avatar-cover-light-zh-Hans.jpg']
    writeFileSync(join(root, 'README.md'), en.map(path => `<img src="${path}">`).join('\n'))
    writeFileSync(join(root, 'README.zh-Hans.md'), zh.map(path => `<img src="${path}">`).join('\n'))
    for (const image of [...en, ...zh]) writeFileSync(join(root, image), Buffer.from([0xff, 0xd8, 0xff, 0xd9]))
    const base = commit(root, 'base')
    writeFileSync(join(root, en[0]), Buffer.from([0xff, 0xd8, 0xff, 0x00, 0xff, 0xd9]))
    const valid = commit(root, 'cover update')
    const execute = (head: string) => execFileSync('python3', ['-c', docsValidator()], {
      cwd: root,
      env: { ...process.env, BASE_SHA: base, HEAD_SHA: head },
      stdio: 'pipe'
    })
    expect(() => execute(valid)).not.toThrow()

    writeFileSync(join(root, 'README.md'), `<img src="${en[0]}">\n${en[1]}`)
    writeFileSync(join(root, en[1]), Buffer.from([0xff, 0xd8, 0xff, 0x01, 0xff, 0xd9]))
    const missingLink = commit(root, 'missing link')
    expect(() => execute(missingLink)).toThrow()
  })

  it('keeps the repository READMEs linked to every required cover', () => {
    const english = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
    const chinese = readFileSync(new URL('../README.zh-Hans.md', import.meta.url), 'utf8')
    expect(english).toContain('.github/assets/avatar-cover-dark-en.jpg')
    expect(english).toContain('.github/assets/avatar-cover-light-en.jpg')
    expect(chinese).toContain('.github/assets/avatar-cover-dark-zh-Hans.jpg')
    expect(chinese).toContain('.github/assets/avatar-cover-light-zh-Hans.jpg')
  })
})
