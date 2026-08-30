#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SHA = /^[0-9a-f]{40}$/iu
const WORKFLOW_NAME = 'Avatar SDK CI'
const WORKFLOW_PATH = '.github/workflows/sdk-ci.yml'
const JOB_NAME = 'build-test-pack'
const ARTIFACT_PREFIX = 'avatar-pr-ci-evidence-'
const PAGE_SIZE = 100
const MAX_PAGES = 3
const MAX_REQUESTS = 30
const MAX_ARTIFACT_BYTES = 1024 * 1024
const MAX_EVIDENCE_AGE_MS = 7 * 24 * 60 * 60 * 1000

const isSha = value => typeof value === 'string' && SHA.test(value)
const isInteger = value => Number.isInteger(value) && value > 0
const sameRepository = (actual, expected) => actual?.id === expected?.id && actual?.full_name === expected?.full_name
const artifactName = run => `${ARTIFACT_PREFIX}${run.id}-${run.run_attempt}`

export const createApi = ({ timeoutMs = 10_000 } = {}) => async (url, token) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28'
      }
    })
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)
    return response.json()
  } finally {
    clearTimeout(timer)
  }
}

export const collectPages = async ({ url, key, requestJson, token, maxPages = MAX_PAGES }) => {
  const collected = []
  let expectedTotal
  for (let page = 1; page <= maxPages; page += 1) {
    const separator = url.includes('?') ? '&' : '?'
    const response = await requestJson(`${url}${separator}per_page=${PAGE_SIZE}&page=${page}`, token)
    const items = response?.[key]
    if (!Array.isArray(items) || !Number.isInteger(response.total_count) || response.total_count < 0) {
      throw new Error(`Invalid paginated ${key} response`)
    }
    if (expectedTotal === undefined) expectedTotal = response.total_count
    if (response.total_count !== expectedTotal || response.total_count > maxPages * PAGE_SIZE) {
      throw new Error(`Unbounded or changing ${key} pagination`)
    }
    collected.push(...items)
    if (collected.length >= expectedTotal || items.length < PAGE_SIZE) break
  }
  if (collected.length !== expectedTotal) throw new Error(`Incomplete ${key} pagination`)
  return collected
}

const fetchArchive = async ({ url, token, timeoutMs = 10_000 }) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const apiResponse = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28'
      }
    })
    if (apiResponse.status !== 302) throw new Error(`Artifact download API returned ${apiResponse.status}`)
    const location = apiResponse.headers.get('location')
    if (!location) throw new Error('Artifact download redirect was missing')

    const archiveResponse = await fetch(location, { signal: controller.signal })
    if (!archiveResponse.ok) throw new Error(`Artifact storage returned ${archiveResponse.status}`)
    const declaredLength = Number(archiveResponse.headers.get('content-length'))
    if (Number.isFinite(declaredLength) && declaredLength > MAX_ARTIFACT_BYTES) throw new Error('Artifact archive is too large')
    if (!archiveResponse.body) throw new Error('Artifact archive body is missing')
    const chunks = []
    let size = 0
    for await (const chunk of archiveResponse.body) {
      size += chunk.byteLength
      if (size > MAX_ARTIFACT_BYTES) throw new Error('Artifact archive is too large')
      chunks.push(Buffer.from(chunk))
    }
    if (size === 0) throw new Error('Artifact archive size is invalid')
    return Buffer.concat(chunks, size)
  } finally {
    clearTimeout(timer)
  }
}

export const downloadEvidence = async ({ artifact, apiUrl, repository, token }) => {
  const directory = mkdtempSync(join(tmpdir(), 'avatar-pr-ci-evidence-'))
  const archivePath = join(directory, 'evidence.zip')
  try {
    const bytes = await fetchArchive({
      url: `${apiUrl}/repos/${repository}/actions/artifacts/${artifact.id}/zip`,
      token
    })
    writeFileSync(archivePath, bytes, { flag: 'wx', mode: 0o600 })
    const files = execFileSync('unzip', ['-Z1', archivePath], {
      encoding: 'utf8',
      timeout: 5_000,
      maxBuffer: 64 * 1024
    }).trim().split('\n').filter(Boolean)
    if (files.length !== 1 || files[0] !== 'pr-ci-evidence.json') throw new Error('Artifact archive contents are invalid')
    const json = execFileSync('unzip', ['-p', archivePath, 'pr-ci-evidence.json'], {
      encoding: 'utf8',
      timeout: 5_000,
      maxBuffer: MAX_ARTIFACT_BYTES
    })
    return JSON.parse(json)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

export const officialRunCandidates = ({ runs, workflow, pullRequest, repository }) => runs.filter(run =>
  isInteger(run?.id) && isInteger(run?.run_attempt) &&
  run.workflow_id === workflow.id && run.name === WORKFLOW_NAME && run.path === WORKFLOW_PATH &&
  run.event === 'pull_request' && run.status === 'completed' && run.conclusion === 'success' &&
  run.head_sha === pullRequest.head.sha &&
  run.repository?.id === repository.id && run.repository?.full_name === repository.full_name &&
  run.head_repository?.id === pullRequest.head.repo.id && run.head_repository?.full_name === pullRequest.head.repo.full_name
)

export const validateEvidence = ({ evidence, repository, workflow, run, pullRequest, artifact, mainCommit, integrationCommit, now }) => {
  const generatedAt = Date.parse(evidence?.generated_at)
  const artifactCreatedAt = Date.parse(artifact?.created_at)
  const artifactExpiresAt = Date.parse(artifact?.expires_at)
  if (evidence?.schema_version !== 1 || !Number.isFinite(generatedAt) ||
      !Number.isFinite(artifactCreatedAt) || !Number.isFinite(artifactExpiresAt) ||
      artifact.expired !== false || artifactCreatedAt > now || artifactExpiresAt <= now ||
      now - artifactCreatedAt > MAX_EVIDENCE_AGE_MS || Math.abs(generatedAt - artifactCreatedAt) > 15 * 60 * 1000) return false

  if (!sameRepository(evidence.repository, repository) ||
      evidence.workflow?.id !== workflow.id || evidence.workflow?.name !== WORKFLOW_NAME || evidence.workflow?.path !== WORKFLOW_PATH ||
      evidence.run?.id !== run.id || evidence.run?.attempt !== run.run_attempt || evidence.run?.event !== 'pull_request' ||
      evidence.run?.head_sha !== run.head_sha ||
      evidence.pull_request?.number !== pullRequest.number ||
      evidence.pull_request?.base?.repository?.id !== repository.id || evidence.pull_request?.base?.repository?.full_name !== repository.full_name ||
      evidence.pull_request?.head?.repository?.id !== pullRequest.head.repo.id ||
      evidence.pull_request?.head?.repository?.full_name !== pullRequest.head.repo.full_name ||
      evidence.pull_request?.head?.sha !== pullRequest.head.sha || !isSha(evidence.pull_request?.base?.sha)) return false

  const integration = evidence.integration
  return isSha(integration?.sha) && isSha(integration?.tree) &&
    Array.isArray(integration.parents) && integration.parents.length === 2 &&
    integration.parents[0] === evidence.pull_request.base.sha && integration.parents[1] === evidence.pull_request.head.sha &&
    integrationCommit?.sha === integration.sha && integrationCommit?.commit?.tree?.sha === integration.tree &&
    Array.isArray(integrationCommit?.parents) && integrationCommit.parents.length === 2 &&
    integrationCommit.parents[0]?.sha === integration.parents[0] && integrationCommit.parents[1]?.sha === integration.parents[1] &&
    mainCommit?.sha != null && isSha(mainCommit.commit?.tree?.sha) && mainCommit.commit.tree.sha === integration.tree &&
    Array.isArray(mainCommit.parents) && mainCommit.parents.length >= 1 && mainCommit.parents[0]?.sha === integration.parents[0]
}

export const evaluateCandidate = async ({ repository, workflow, run, pullRequest, artifact, mainCommit, requestJson, readEvidence, root, token, now }) => {
  const jobs = await collectPages({
    url: `${root}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?filter=latest`,
    key: 'jobs',
    requestJson,
    token
  })
  const requiredJobs = jobs.filter(job => job?.name === JOB_NAME)
  if (requiredJobs.length !== 1 || requiredJobs[0].status !== 'completed' || requiredJobs[0].conclusion !== 'success' ||
      (requiredJobs[0].run_attempt != null && requiredJobs[0].run_attempt !== run.run_attempt)) {
    return { reuse: false, reason: 'required-job-not-successful' }
  }

  const expectedName = artifactName(run)
  const exactArtifacts = artifact.filter(item => item?.name === expectedName)
  if (exactArtifacts.length !== 1) return { reuse: false, reason: 'ambiguous-or-missing-evidence-artifact' }
  const selected = exactArtifacts[0]
  if (!isInteger(selected.id) || selected.workflow_run?.id !== run.id ||
      selected.workflow_run?.repository_id !== repository.id ||
      selected.workflow_run?.head_repository_id !== pullRequest.head.repo.id ||
      selected.workflow_run?.head_sha !== pullRequest.head.sha) {
    return { reuse: false, reason: 'artifact-official-identity-mismatch' }
  }

  const evidence = await readEvidence(selected)
  if (!isSha(evidence?.integration?.sha)) return { reuse: false, reason: 'invalid-evidence-json' }
  const integrationCommit = await requestJson(`${root}/commits/${evidence.integration.sha}`, token)
  if (!validateEvidence({ evidence, repository, workflow, run, pullRequest, artifact: selected, mainCommit, integrationCommit, now })) {
    return { reuse: false, reason: 'evidence-content-mismatch' }
  }
  return { reuse: true, reason: 'exact-pr-ci-evidence', run: { id: run.id, attempt: run.run_attempt }, artifact: { id: selected.id } }
}

export const verify = async ({
  env = process.env,
  requestJson: rawRequestJson = createApi(),
  readEvidence,
  now = Date.now()
} = {}) => {
  if (env.GITHUB_EVENT_NAME !== 'push' || env.GITHUB_REF !== 'refs/heads/main') return { reuse: false, reason: 'not-a-main-push' }
  if (!isSha(env.GITHUB_SHA) || !env.GITHUB_REPOSITORY || !env.GITHUB_TOKEN || !isInteger(Number(env.GITHUB_REPOSITORY_ID))) {
    return { reuse: false, reason: 'missing-trusted-context' }
  }

  let requestCount = 0
  const requestJson = async (...args) => {
    requestCount += 1
    if (requestCount > MAX_REQUESTS) throw new Error('GitHub API request budget exceeded')
    return rawRequestJson(...args)
  }
  const apiUrl = env.GITHUB_API_URL || 'https://api.github.com'
  const root = `${apiUrl}/repos/${env.GITHUB_REPOSITORY}`
  const repository = { id: Number(env.GITHUB_REPOSITORY_ID), full_name: env.GITHUB_REPOSITORY }
  const token = env.GITHUB_TOKEN

  try {
    const associated = await requestJson(`${root}/commits/${env.GITHUB_SHA}/pulls?per_page=100`, token)
    if (!Array.isArray(associated)) return { reuse: false, reason: 'invalid-associated-pr-response' }
    const exactPullRequests = associated.filter(pullRequest =>
      isInteger(pullRequest?.number) && pullRequest.merged_at && pullRequest.merge_commit_sha === env.GITHUB_SHA &&
      pullRequest.base?.ref === 'main' && sameRepository(pullRequest.base?.repo, repository) &&
      isSha(pullRequest.head?.sha) && isInteger(pullRequest.head?.repo?.id) && typeof pullRequest.head.repo.full_name === 'string'
    )
    if (exactPullRequests.length !== 1) return { reuse: false, reason: 'ambiguous-or-no-associated-pr' }
    const pullRequest = exactPullRequests[0]

    const [workflows, mainCommit] = await Promise.all([
      collectPages({ url: `${root}/actions/workflows`, key: 'workflows', requestJson, token }),
      requestJson(`${root}/commits/${env.GITHUB_SHA}`, token)
    ])
    const exactWorkflows = workflows.filter(item => item?.name === WORKFLOW_NAME && item?.path === WORKFLOW_PATH && isInteger(item.id))
    if (exactWorkflows.length !== 1) return { reuse: false, reason: 'workflow-identity-mismatch' }
    const workflow = exactWorkflows[0]

    const runs = await collectPages({
      url: `${root}/actions/workflows/${workflow.id}/runs?event=pull_request&head_sha=${pullRequest.head.sha}`,
      key: 'workflow_runs',
      requestJson,
      token
    })
    const candidates = officialRunCandidates({ runs, workflow, pullRequest, repository })
    if (candidates.length !== 1) return { reuse: false, reason: 'ambiguous-or-missing-successful-run' }
    const run = candidates[0]

    const artifacts = await collectPages({
      url: `${root}/actions/runs/${run.id}/artifacts`,
      key: 'artifacts',
      requestJson,
      token
    })
    const evidenceReader = readEvidence || (artifact => downloadEvidence({ artifact, apiUrl, repository: env.GITHUB_REPOSITORY, token }))
    return await evaluateCandidate({
      repository,
      workflow,
      run,
      pullRequest,
      artifact: artifacts,
      mainCommit,
      requestJson,
      readEvidence: evidenceReader,
      root,
      token,
      now
    })
  } catch (error) {
    const detail = error?.name === 'AbortError' ? 'request timed out' : String(error?.message || 'unknown failure').replace(/https?:\/\/\S+/gu, '<redacted-url>')
    console.warn(`Unable to establish reusable PR CI evidence: ${detail}`)
    return { reuse: false, reason: 'evidence-api-download-or-parse-failure' }
  }
}

export const output = (result, target = process.env.GITHUB_OUTPUT) => {
  if (target) appendFileSync(target, `scope=${result.reuse ? 'reused-pr-ci' : 'full'}\nevidence_reason=${result.reason}\n`)
  console.log(`PR CI evidence: ${result.reuse ? 'reused' : 'full fallback'} (${result.reason})`)
}

if (import.meta.url === `file://${process.argv[1]}`) verify().then(output)
