import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { collectPages, createApi, downloadEvidence, output, validateEvidence, verify } from '../scripts/verify-pr-ci-evidence.mjs'

const main = 'a'.repeat(40)
const head = 'b'.repeat(40)
const integration = 'c'.repeat(40)
const base = 'd'.repeat(40)
const tree = 'e'.repeat(40)
const repository = { id: 7, full_name: 'oneworks-ai/avatar' }
const now = Date.parse('2026-08-31T00:10:00Z')
const pullRequest = {
  number: 42,
  merged_at: '2026-08-31T00:05:00Z',
  merge_commit_sha: main,
  base: { ref: 'main', sha: 'f'.repeat(40), repo: repository },
  head: { sha: head, repo: repository }
}
const workflow = { id: 17, name: 'Avatar SDK CI', path: '.github/workflows/sdk-ci.yml' }
const run = {
  id: 99,
  run_attempt: 1,
  workflow_id: 17,
  name: 'Avatar SDK CI',
  path: '.github/workflows/sdk-ci.yml',
  event: 'pull_request',
  status: 'completed',
  conclusion: 'success',
  head_sha: head,
  repository,
  head_repository: repository,
  pull_requests: []
}
// The attempt-scoped jobs endpoint binds the attempt in its URL; live job
// payloads may omit run_attempt entirely.
const job = { id: 500, name: 'build-test-pack', status: 'completed', conclusion: 'success' }
const artifact = {
  id: 700,
  name: 'avatar-pr-ci-evidence-99-1',
  expired: false,
  created_at: '2026-08-31T00:06:00Z',
  expires_at: '2026-09-02T00:06:00Z',
  workflow_run: { id: 99, repository_id: 7, head_repository_id: 7, head_sha: head }
}
const mainCommit = { sha: main, commit: { tree: { sha: tree } }, parents: [{ sha: base }] }
const integrationCommit = { sha: integration, commit: { tree: { sha: tree } }, parents: [{ sha: base }, { sha: head }] }
const evidence = {
  schema_version: 1,
  generated_at: '2026-08-31T00:05:30Z',
  repository,
  workflow,
  run: { id: 99, attempt: 1, event: 'pull_request', head_sha: head },
  pull_request: {
    number: 42,
    base: { sha: base, repository },
    head: { sha: head, repository }
  },
  integration: { sha: integration, tree, parents: [base, head] }
}
const env = {
  GITHUB_EVENT_NAME: 'push',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_SHA: main,
  GITHUB_REPOSITORY: repository.full_name,
  GITHUB_REPOSITORY_ID: String(repository.id),
  GITHUB_TOKEN: 'token',
  GITHUB_API_URL: 'https://api.github.test'
}

type FixtureOverrides = {
  associated?: unknown
  workflows?: unknown[]
  runs?: unknown[]
  artifacts?: unknown[]
  jobs?: unknown[]
  mainCommit?: unknown
  integrationCommit?: unknown
  evidence?: unknown
  throwOnEvidence?: Error
}

const fixture = (overrides: FixtureOverrides = {}) => {
  const requested: string[] = []
  const values = {
    associated: overrides.associated ?? [pullRequest],
    workflows: overrides.workflows ?? [workflow],
    runs: overrides.runs ?? [run],
    artifacts: overrides.artifacts ?? [artifact],
    jobs: overrides.jobs ?? [job],
    mainCommit: overrides.mainCommit ?? mainCommit,
    integrationCommit: overrides.integrationCommit ?? integrationCommit
  }
  const requestJson = async (url: string) => {
    requested.push(url)
    if (url.includes(`/commits/${main}/pulls`)) return values.associated
    if (url.includes('/actions/workflows?')) return { total_count: values.workflows.length, workflows: values.workflows }
    if (url.endsWith(`/commits/${main}`)) return values.mainCommit
    if (url.includes('/actions/workflows/17/runs?')) return { total_count: values.runs.length, workflow_runs: values.runs }
    if (url.includes('/actions/runs/99/artifacts?')) return { total_count: values.artifacts.length, artifacts: values.artifacts }
    if (url.includes('/actions/runs/99/attempts/1/jobs?')) return { total_count: values.jobs.length, jobs: values.jobs }
    if (url.endsWith(`/commits/${integration}`)) return values.integrationCommit
    throw new Error(`Unexpected fixture request: ${url}`)
  }
  const readEvidence = async () => {
    if (overrides.throwOnEvidence) throw overrides.throwOnEvidence
    return overrides.evidence ?? evidence
  }
  return { requestJson, readEvidence, requested }
}

const execute = async (overrides: FixtureOverrides = {}) => {
  const testFixture = fixture(overrides)
  const result = await verify({ env, requestJson: testFixture.requestJson, readEvidence: testFixture.readEvidence, now })
  return { result, requested: testFixture.requested }
}

describe('post-merge PR CI evidence', () => {
  it('reaches the exact path with official head_sha=head and merged pull_requests=[]', async () => {
    const { result, requested } = await execute()
    expect(result).toMatchObject({ reuse: true, reason: 'exact-pr-ci-evidence', run: { id: 99, attempt: 1 }, artifact: { id: 700 } })
    expect(run.head_sha).toBe(head)
    expect(run.pull_requests).toEqual([])
    expect(requested.some(url => url.endsWith(`/commits/${integration}`))).toBe(true)
    expect(requested.length).toBeLessThanOrEqual(8)
  })

  it.each([
    ['old integration base', { evidence: { ...evidence, pull_request: { ...evidence.pull_request, base: { ...evidence.pull_request.base, sha: '1'.repeat(40) } } } }],
    ['wrong integration parents', { evidence: { ...evidence, integration: { ...evidence.integration, parents: ['1'.repeat(40), head] } } }],
    ['wrong integration tree', { evidence: { ...evidence, integration: { ...evidence.integration, tree: '1'.repeat(40) } } }],
    ['wrong main tree', { mainCommit: { ...mainCommit, commit: { tree: { sha: '1'.repeat(40) } } } }],
    ['wrong repository', { evidence: { ...evidence, repository: { id: 8, full_name: repository.full_name } } }],
    ['wrong workflow', { evidence: { ...evidence, workflow: { ...workflow, id: 18 } } }],
    ['wrong run', { evidence: { ...evidence, run: { ...evidence.run, id: 100 } } }],
    ['wrong PR', { evidence: { ...evidence, pull_request: { ...evidence.pull_request, number: 43 } } }],
    ['expired artifact', { artifacts: [{ ...artifact, expired: true }] }],
    ['stale artifact', { artifacts: [{ ...artifact, created_at: '2026-08-01T00:00:00Z', expires_at: '2026-09-02T00:06:00Z' }] }],
    ['wrong artifact repository', { artifacts: [{ ...artifact, workflow_run: { ...artifact.workflow_run, repository_id: 8 } }] }],
    ['wrong artifact head', { artifacts: [{ ...artifact, workflow_run: { ...artifact.workflow_run, head_sha: '1'.repeat(40) } }] }],
    ['failed required job', { jobs: [{ ...job, conclusion: 'failure' }] }],
    ['wrong job attempt', { jobs: [{ ...job, run_attempt: 2 }] }]
  ])('fails closed on %s', async (_label, overrides) => {
    expect((await execute(overrides as FixtureOverrides)).result.reuse).toBe(false)
  })

  it('rejects missing and duplicate exact artifacts', async () => {
    expect((await execute({ artifacts: [] })).result).toMatchObject({ reuse: false, reason: 'ambiguous-or-missing-evidence-artifact' })
    expect((await execute({ artifacts: [artifact, { ...artifact, id: 701 }] })).result).toMatchObject({ reuse: false, reason: 'ambiguous-or-missing-evidence-artifact' })
  })

  it('rejects multiple successful runs but accepts a latest rerun attempt with older attempt artifacts present', async () => {
    expect((await execute({ runs: [run, { ...run, id: 100 }] })).result).toMatchObject({ reuse: false, reason: 'ambiguous-or-missing-successful-run' })

    const rerun = { ...run, run_attempt: 2 }
    const rerunArtifact = {
      ...artifact,
      id: 702,
      name: 'avatar-pr-ci-evidence-99-2'
    }
    const rerunEvidence = {
      ...evidence,
      run: { ...evidence.run, attempt: 2 }
    }
    const rerunFixture = fixture({ runs: [rerun], artifacts: [artifact, rerunArtifact], jobs: [{ ...job, run_attempt: 2 }], evidence: rerunEvidence })
    const requestJson = async (url: string) => {
      if (url.includes('/attempts/2/jobs?')) return { total_count: 1, jobs: [{ ...job, run_attempt: 2 }] }
      return rerunFixture.requestJson(url)
    }
    await expect(verify({ env, requestJson, readEvidence: rerunFixture.readEvidence, now })).resolves.toMatchObject({ reuse: true, run: { attempt: 2 }, artifact: { id: 702 } })
  })

  it('filters old synchronize runs before ambiguity evaluation', async () => {
    const oldSynchronize = { ...run, id: 98, head_sha: '1'.repeat(40) }
    await expect(execute({ runs: [oldSynchronize, run] })).resolves.toMatchObject({ result: { reuse: true } })
  })

  it('fails closed for malformed JSON, zip/download failures, and API failures', async () => {
    expect((await execute({ evidence: { malformed: true } })).result).toMatchObject({ reuse: false, reason: 'invalid-evidence-json' })
    expect((await execute({ throwOnEvidence: new Error('invalid zip') })).result).toMatchObject({ reuse: false, reason: 'evidence-api-download-or-parse-failure' })
    await expect(verify({ env, requestJson: async () => { throw new Error('denied') }, readEvidence: async () => evidence, now })).resolves.toMatchObject({ reuse: false, reason: 'evidence-api-download-or-parse-failure' })
  })

  it('downloads one bounded evidence JSON file without forwarding the token to artifact storage', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'avatar-evidence-zip-'))
    writeFileSync(join(directory, 'pr-ci-evidence.json'), JSON.stringify(evidence))
    execFileSync('zip', ['-q', 'evidence.zip', 'pr-ci-evidence.json'], { cwd: directory })
    const archive = readFileSync(join(directory, 'evidence.zip'))
    const calls: Array<{ url: string, authorization?: string }> = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input, options) => {
      const url = String(input)
      const headers = options?.headers as Record<string, string> | undefined
      calls.push({ url, authorization: headers?.authorization })
      if (url.includes('/actions/artifacts/700/zip')) {
        return new Response(null, { status: 302, headers: { location: 'https://artifact-storage.test/signed' } })
      }
      return new Response(archive, { status: 200, headers: { 'content-length': String(archive.length) } })
    }) as typeof fetch
    try {
      await expect(downloadEvidence({ artifact, apiUrl: env.GITHUB_API_URL, repository: env.GITHUB_REPOSITORY, token: env.GITHUB_TOKEN })).resolves.toEqual(evidence)
      expect(calls).toEqual([
        { url: 'https://api.github.test/repos/oneworks-ai/avatar/actions/artifacts/700/zip', authorization: 'Bearer token' },
        { url: 'https://artifact-storage.test/signed', authorization: undefined }
      ])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it.each([
    ['workflow_runs', Array.from({ length: 100 }, (_, index) => ({ ...run, id: index + 1000, head_sha: '1'.repeat(40), conclusion: index % 2 ? 'failure' : 'cancelled' })), run],
    ['artifacts', Array.from({ length: 100 }, (_, index) => ({ ...artifact, id: index + 1000, name: `noise-${index}` })), artifact]
  ])('handles 100/101 pagination for %s', async (key, firstPage, finalItem) => {
    const pages: number[] = []
    const requestJson = async (url: string) => {
      const page = Number(new URL(url).searchParams.get('page'))
      pages.push(page)
      return { total_count: 101, [key]: page === 1 ? firstPage : [finalItem] }
    }
    await expect(collectPages({ url: 'https://api.github.test/items?filter=exact', key, requestJson, token: 'token' })).resolves.toHaveLength(101)
    expect(pages).toEqual([1, 2])
  })

  it('aborts timed-out API requests and writes a deterministic full output', async () => {
    const request = createApi({ timeoutMs: 1 })
    const originalFetch = globalThis.fetch
    globalThis.fetch = (_url, options) => new Promise((_, reject) => options?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))) as typeof fetch
    try {
      await expect(request('https://example.invalid', 'token')).rejects.toMatchObject({ name: 'AbortError' })
    } finally {
      globalThis.fetch = originalFetch
    }

    const target = join(mkdtempSync(join(tmpdir(), 'avatar-evidence-output-')), 'github-output')
    output({ reuse: false, reason: 'fixture' }, target)
    expect(readFileSync(target, 'utf8')).toBe('scope=full\nevidence_reason=fixture\n')
  })

  it('does not call the API for PR/manual events and treats a direct main push as full', async () => {
    const requestJson = async () => { throw new Error('must not request') }
    await expect(verify({ env: { ...env, GITHUB_EVENT_NAME: 'pull_request' }, requestJson })).resolves.toMatchObject({ reuse: false, reason: 'not-a-main-push' })
    await expect(verify({ env: { ...env, GITHUB_EVENT_NAME: 'workflow_dispatch' }, requestJson })).resolves.toMatchObject({ reuse: false, reason: 'not-a-main-push' })
    await expect(execute({ associated: [] })).resolves.toMatchObject({ result: { reuse: false, reason: 'ambiguous-or-no-associated-pr' } })
  })

  it('validates the pure evidence contract independently', () => {
    expect(validateEvidence({ evidence, repository, workflow, run, pullRequest, artifact, mainCommit, integrationCommit, now })).toBe(true)
  })
})
