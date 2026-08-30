import { execFileSync } from 'node:child_process'
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import jpeg from 'jpeg-js'
import { describe, expect, it } from 'vitest'

const workflowPath = new URL('../.github/workflows/sdk-ci.yml', import.meta.url)
const helperPath = new URL('../scripts/validate-readme-cover-assets.mjs', import.meta.url)
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
    writeFileSync(join(root, 'scripts', 'validate-readme-cover-assets.mjs'), 'base\n')
    writeFileSync(join(root, 'package.json'), '{}\n')
    writeFileSync(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
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
    const coverContract = make('complete cover contract', () => {
      writeFileSync(join(root, 'scripts', 'readme-cover.html'), '<!doctype html> changed\n')
      for (const cover of covers) writeFileSync(join(root, '.github', 'assets', cover), `new ${cover}\n`)
    })
    const docs = make('docs', () => writeFileSync(join(root, 'README.md'), 'docs\n'))
    const source = make('source', () => writeFileSync(join(root, 'src', 'code.ts'), 'source\n'))
    const packageJson = make('package manifest', () => writeFileSync(join(root, 'package.json'), '{"changed":true}\n'))
    const lockfile = make('package lockfile', () => writeFileSync(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9\nchanged: true\n'))
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

    for (const cover of coverHeads) expect(run('pull_request', cover, 'full')).toBe('full')
    expect(run('pull_request', coverContract, 'full')).toBe('docs-assets')
    expect(run('pull_request', docs, 'full')).toBe('docs-assets')
    expect(run('pull_request', source, 'full')).toBe('full')
    expect(run('pull_request', packageJson, 'reused-pr-ci')).toBe('full')
    expect(run('pull_request', lockfile, 'reused-pr-ci')).toBe('full')
    for (const cover of coverHeads) expect(run('push', cover)).toBe('full')
    expect(run('push', coverContract)).toBe('docs-assets')
    expect(run('push', source)).toBe('reused-pr-ci')
    expect(run('push', packageJson)).toBe('full')
    expect(run('push', lockfile)).toBe('full')
    expect(run('push', source, 'full')).toBe('full')
    expect(run('push', docs, 'full')).toBe('full')
    expect(run('workflow_dispatch', coverContract)).toBe('full')
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
    writeFileSync(join(root, 'scripts', 'validate-readme-cover-assets.mjs'), 'base\n')
    writeFileSync(join(root, 'package.json'), '{}\n')
    writeFileSync(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
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
    const validator = make('scripts/validate-readme-cover-assets.mjs')
    const packageJson = make('package.json')
    const lockfile = make('pnpm-lock.yaml')
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
    expect(run(validator)).toBe('false')
    expect(run(packageJson)).toBe('false')
    expect(run(lockfile)).toBe('false')
  })

  it('runs the real cover validator against structural and complete-decode fixtures', () => {
    const root = mkdtempSync(join(tmpdir(), 'avatar-cover-validator-'))
    git(root, ['init', '-b', 'main'])
    mkdirSync(join(root, 'scripts'), { recursive: true })
    mkdirSync(join(root, '.github', 'assets'), { recursive: true })
    symlinkSync(join(process.cwd(), 'node_modules'), join(root, 'node_modules'), 'dir')
    for (const path of ['README.md', 'README.zh-Hans.md', 'scripts/readme-cover.html']) cpSync(new URL(`../${path}`, import.meta.url), join(root, path))
    cpSync(helperPath, join(root, 'scripts', 'validate-readme-cover-assets.mjs'))
    const covers = ['avatar-cover-dark-en.jpg', 'avatar-cover-light-en.jpg', 'avatar-cover-dark-zh-Hans.jpg', 'avatar-cover-light-zh-Hans.jpg']
    for (const cover of covers) cpSync(new URL(`../.github/assets/${cover}`, import.meta.url), join(root, '.github', 'assets', cover))
    for (const [, source] of readFileSync(new URL('../scripts/readme-cover.html', import.meta.url), 'utf8').matchAll(/<img\s+[^>]*\bsrc="([^"]+)"[^>]*>/gu)) {
      const destination = join(root, source.slice(3))
      mkdirSync(dirname(destination), { recursive: true })
      cpSync(new URL(`../scripts/${source}`, import.meta.url), destination)
    }
    const base = commit(root, 'base')
    const execute = (head: string) => {
      git(root, ['checkout', '--detach', head])
      expect(git(root, ['rev-parse', 'HEAD'])).toBe(head)
      return execFileSync('node', ['scripts/validate-readme-cover-assets.mjs'], {
        cwd: root,
        env: { ...process.env, BASE_SHA: base, HEAD_SHA: head },
        stdio: 'pipe'
      })
    }
    writeFileSync(join(root, 'README.md'), `${readFileSync(join(root, 'README.md'), 'utf8')}\n`)
    const valid = commit(root, 'README-only update')
    expect(() => execute(valid)).not.toThrow()

    const make = (name: string, mutate: () => void) => {
      git(root, ['checkout', '--detach', base])
      mutate()
      return commit(root, name)
    }
    const completeContract = () => {
      for (const cover of covers) {
        const file = join(root, '.github', 'assets', cover)
        const data = readFileSync(file)
        writeFileSync(file, Buffer.concat([data.subarray(0, 2), Buffer.from([0xff, 0xe0, 0, 2]), data.subarray(2)]))
      }
    }
    const generatorInvalid = (name: string, mutation: (source: string) => string) => make(name, () => {
      const file = join(root, 'scripts', 'readme-cover.html')
      writeFileSync(file, mutation(readFileSync(file, 'utf8')))
      completeContract()
    })
    const generatorScriptAttribute = generatorInvalid('script attribute', source => source.replace('<script>', '<ScRiPt type="text/javascript">'))
    const multipleScript = generatorInvalid('multiple script', source => source.replace('</body>', '<script></script></body>'))
    const multipleStyle = generatorInvalid('multiple style', source => source.replace('</head>', '<style></style></head>'))
    const unsafeCss = generatorInvalid('unsafe css', source => source.replace('<style>', '<style>@import url(https://example.invalid);'))
    const unsafeTag = generatorInvalid('unsafe tag', source => source.replace('</main>', '<iframe src="https://example.invalid"></iframe></main>'))
    const eventAttribute = generatorInvalid('event attribute', source => source.replace('<main id="cover">', '<main id="cover" onload="alert(1)">'))
    const traversal = generatorInvalid('traversal', source => source.replace('../src/avatarPresetSnapshots/', '../src/avatarPresetSnapshots/../'))
    const fencedPicture = make('fenced picture', () => writeFileSync(join(root, 'README.md'), '```html\n<picture><source media="(prefers-color-scheme: dark)" srcset=".github/assets/avatar-cover-dark-en.jpg"><source media="(prefers-color-scheme: light)" srcset=".github/assets/avatar-cover-light-en.jpg"><img alt="OneWorks Avatar — a growing gallery of geometric 3D avatars and pixel styles" src=".github/assets/avatar-cover-light-en.jpg" width="1600"></picture>\n```'))
    const commentedPicture = make('commented picture', () => writeFileSync(join(root, 'README.md'), `<!-- ${readFileSync(join(root, 'README.md'), 'utf8')} -->`))
    const inlinePicture = make('inline picture', () => writeFileSync(join(root, 'README.md'), '`<picture><img src=".github/assets/avatar-cover-light-en.jpg"></picture>`'))
    const wrongOrder = make('wrong picture order', () => writeFileSync(join(root, 'README.md'), readFileSync(join(root, 'README.md'), 'utf8').replace('<source media="(prefers-color-scheme: dark)"', '<img alt="OneWorks Avatar — a growing gallery of geometric 3D avatars and pixel styles" src=".github/assets/avatar-cover-light-en.jpg" width="1600"><source media="(prefers-color-scheme: dark)"')))
    const duplicateMedia = make('duplicate cover media', () => writeFileSync(join(root, 'README.md'), `${readFileSync(join(root, 'README.md'), 'utf8')}\n<img src=".github/assets/avatar-cover-light-en.jpg">`))
    const srcset = make('unexpected srcset', () => writeFileSync(join(root, 'README.md'), readFileSync(join(root, 'README.md'), 'utf8').replace(' width="1600">', ' width="1600" srcset=".github/assets/avatar-cover-light-en.jpg">')))
    const symlink = make('cover symlink', () => { rmSync(join(root, '.github', 'assets', covers[0])); symlinkSync(covers[1], join(root, '.github', 'assets', covers[0])) })
    const reencoded = () => {
      completeContract()
      writeFileSync(join(root, 'scripts', 'readme-cover.html'), `${readFileSync(join(root, 'scripts', 'readme-cover.html'), 'utf8')}\n`)
    }
    const trailing = make('trailing JPEG data', () => { reencoded(); writeFileSync(join(root, '.github', 'assets', covers[0]), Buffer.concat([readFileSync(join(root, '.github', 'assets', covers[0])), Buffer.from('trailer')])) })
    const secondEoi = make('second JPEG EOI', () => { reencoded(); const file = join(root, '.github', 'assets', covers[0]); writeFileSync(file, Buffer.concat([readFileSync(file), Buffer.from([0xff, 0xd9])])) })
    const truncated = make('truncated JPEG data', () => { reencoded(); const file = join(root, '.github', 'assets', covers[0]); writeFileSync(file, readFileSync(file).subarray(0, -16)) })
    const corruptEntropy = make('corrupt JPEG entropy', () => {
      reencoded()
      const file = join(root, '.github', 'assets', covers[0])
      const data = readFileSync(file)
      const scan = data.indexOf(Buffer.from([0xff, 0xda]))
      const entropy = scan + 2 + data.readUInt16BE(scan + 2)
      data[entropy] = 0xff
      data[entropy + 1] = 0x01
      writeFileSync(file, data)
    })
    const wrongDimensions = make('wrong JPEG dimensions', () => {
      reencoded()
      const frame = Buffer.alloc(800 * 450 * 4)
      for (let pixel = 0; pixel < frame.length; pixel += 4) {
        frame[pixel] = (pixel * 17) & 255
        frame[pixel + 1] = (pixel * 29) & 255
        frame[pixel + 2] = (pixel * 43) & 255
        frame[pixel + 3] = 255
      }
      writeFileSync(join(root, '.github', 'assets', covers[0]), jpeg.encode({ data: frame, width: 800, height: 450 }, 50).data)
    })
    const invalid = [
      [generatorScriptAttribute, /unexpected type attribute/], [multipleScript, /head\/body\/cover structure/], [multipleStyle, /head\/body\/cover structure/], [unsafeCss, /stylesheet/], [unsafeTag, /disallowed/], [eventAttribute, /unexpected onload attribute/], [traversal, /invalid generator snapshot path/],
      [fencedPicture, /exactly one picture/], [commentedPicture, /exactly one picture/], [inlinePicture, /exactly one picture/], [wrongOrder, /dark source, light source/], [duplicateMedia, /duplicate, unexpected, or cross-language/], [srcset, /unexpected attributes/], [symlink, /unsupported changed entry T/],
      [trailing, /first JPEG EOI/], [secondEoi, /first JPEG EOI/], [truncated, /missing a terminal EOI|entropy stream is truncated/], [corruptEntropy, /JPEG marker stream is malformed/], [wrongDimensions, /1600x900/]
    ] as const
    for (const [head, reason] of invalid) expect(() => execute(head)).toThrow(reason)
  })

  it('keeps the repository READMEs linked to every required cover', () => {
    const english = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
    const chinese = readFileSync(new URL('../README.zh-Hans.md', import.meta.url), 'utf8')
    expect(english).toContain('.github/assets/avatar-cover-dark-en.jpg')
    expect(english).toContain('.github/assets/avatar-cover-light-en.jpg')
    expect(chinese).toContain('.github/assets/avatar-cover-dark-zh-Hans.jpg')
    expect(chinese).toContain('.github/assets/avatar-cover-light-zh-Hans.jpg')
    expect(() => readFileSync(new URL('../scripts/readme-cover-assets.json', import.meta.url), 'utf8')).toThrow()
  })
})
