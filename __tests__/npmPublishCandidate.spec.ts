import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { verifyNpmPublishCandidate } from '../scripts/verify-npm-publish-candidate.mjs'

const sourceSha = '0998f9d6266d71c757ab8956b8fba0b92c3226e2'
const version = '1.0.0-rc.7'

const shouldPublish = ({
  dryRun,
  preflight,
  reuseCandidate,
  validate
}: {
  dryRun: boolean
  preflight: string
  reuseCandidate: string
  validate: string
}) => !dryRun && preflight === 'success' && (
  (validate === 'success' && reuseCandidate === 'skipped') ||
  (validate === 'skipped' && reuseCandidate === 'success')
)

const workflowJobs = () => JSON.parse(execFileSync('ruby', [
  '-ryaml',
  '-rjson',
  '-e',
  'workflow = YAML.load_file(ARGV.fetch(0)); puts JSON.generate(workflow.fetch("jobs").transform_values { |job| job.slice("needs", "if", "permissions") })',
  new URL('../.github/workflows/npm-publish.yml', import.meta.url).pathname
], { encoding: 'utf8' }))

const evidence = () => ({
  artifacts: [{
    expired: false,
    name: `avatar-sdk-${version}`,
    workflow_run: { id: 123 }
  }],
  jobs: [{ conclusion: 'success', name: 'test-pack-validate', status: 'completed' }],
  run: {
    conclusion: 'success',
    event: 'workflow_dispatch',
    head_branch: 'main',
    head_sha: sourceSha,
    id: 123,
    repository: { full_name: 'oneworks-ai/avatar' },
    status: 'completed',
    workflow_id: 456
  },
  sourceSha,
  version,
  workflow: { id: 456, path: '.github/workflows/npm-publish.yml' }
})

describe('npm publish recovery candidate', () => {
  it('accepts an exact successful validation artifact even when a later publish job failed', () => {
    const value = evidence()
    value.run.conclusion = 'failure'
    expect(verifyNpmPublishCandidate(value).name).toBe(`avatar-sdk-${version}`)
  })

  it('accepts only the exact successful validation artifact', () => {
    expect(verifyNpmPublishCandidate(evidence()).name).toBe(`avatar-sdk-${version}`)
  })

  it.each([
    ['wrong repository', (value: any) => { value.run.repository.full_name = 'oneworks-ai/app' }],
    ['wrong SHA', (value: any) => { value.run.head_sha = 'a'.repeat(40) }],
    ['wrong workflow', (value: any) => { value.workflow.path = '.github/workflows/other.yml' }],
    ['non-dispatch event', (value: any) => { value.run.event = 'push' }],
    ['non-main head branch', (value: any) => { value.run.head_branch = 'recovery' }],
    ['cancelled workflow run', (value: any) => { value.run.conclusion = 'cancelled' }],
    ['timed out workflow run', (value: any) => { value.run.conclusion = 'timed_out' }],
    ['action-required workflow run', (value: any) => { value.run.conclusion = 'action_required' }],
    ['failed validation job', (value: any) => { value.jobs[0].conclusion = 'failure' }],
    ['expired artifact', (value: any) => { value.artifacts[0].expired = true }],
    ['artifact missing an expiration state', (value: any) => { delete value.artifacts[0].expired }],
    ['artifact with null expiration state', (value: any) => { value.artifacts[0].expired = null }],
    ['duplicate artifact', (value: any) => { value.artifacts.push({ ...value.artifacts[0] }) }],
    ['artifact from another run', (value: any) => { value.artifacts[0].workflow_run.id = 999 }],
    ['wrong artifact version', (value: any) => { value.artifacts[0].name = 'avatar-sdk-0.0.0' }]
  ])('fails closed for %s', (_name, mutate) => {
    const value = evidence()
    mutate(value)
    expect(() => verifyNpmPublishCandidate(value)).toThrow(/Unsafe npm publish candidate/u)
  })

  it('keeps dry runs on the full validation path and guards real publishing before it', () => {
    const jobs = workflowJobs()
    const workflow = readFileSync(new URL('../.github/workflows/npm-publish.yml', import.meta.url), 'utf8')
    expect(workflow).toContain('candidate_run_id:')
    expect(workflow).toContain('Require protected main and configured publishing authentication')
    expect(workflow).toContain("test \"$GITHUB_REF\" = 'refs/heads/main'")
    expect(workflow).toContain("test -n \"$NODE_AUTH_TOKEN\"")
    expect(workflow).toContain("test \"$TRUSTED_PUBLISHERS\" = '@oneworks/avatar")
    expect(workflow).toContain('node scripts/verify-npm-publish-candidate.mjs')
    expect(workflow).toContain('node scripts/publish-sdk-packages.mjs --verify-prepared')
    expect(workflow).toContain('retention-days: 7')
    expect(jobs.validate.needs).toBe('preflight')
    expect(jobs.validate.if).toContain('always()')
    expect(jobs.validate.if).toContain('inputs.dry_run')
    expect(jobs['reuse-candidate'].needs).toBe('preflight')
    expect(jobs['reuse-candidate'].if).toContain('always()')
    expect(jobs.publish.needs).toEqual(['preflight', 'validate', 'reuse-candidate'])
    expect(jobs.publish.if).toContain('always()')
    expect(jobs.publish.if).toContain("needs.validate.result == 'success'")
    expect(jobs.publish.if).toContain("needs['reuse-candidate'].result == 'success'")
    expect(jobs.publish.permissions).toMatchObject({ actions: 'read', contents: 'read', 'id-token': 'write' })
  })

  it.each([
    ['dry run after skipped preflight', { dryRun: true, preflight: 'skipped', reuseCandidate: 'skipped', validate: 'success' }, false],
    ['normal validation', { dryRun: false, preflight: 'success', reuseCandidate: 'skipped', validate: 'success' }, true],
    ['candidate validation', { dryRun: false, preflight: 'success', reuseCandidate: 'success', validate: 'skipped' }, true],
    ['both paths ran', { dryRun: false, preflight: 'success', reuseCandidate: 'success', validate: 'success' }, false],
    ['both paths skipped', { dryRun: false, preflight: 'success', reuseCandidate: 'skipped', validate: 'skipped' }, false],
    ['failed preflight', { dryRun: false, preflight: 'failure', reuseCandidate: 'skipped', validate: 'skipped' }, false],
    ['failed candidate verification', { dryRun: false, preflight: 'success', reuseCandidate: 'failure', validate: 'skipped' }, false]
  ])('publishes only for the complete needs contract: %s', (_name, state, expected) => {
    expect(shouldPublish(state)).toBe(expected)
  })
})
