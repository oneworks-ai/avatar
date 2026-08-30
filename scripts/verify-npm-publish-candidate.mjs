const EXPECTED_REPOSITORY = 'oneworks-ai/avatar'
const EXPECTED_WORKFLOW_PATH = '.github/workflows/npm-publish.yml'
const EXPECTED_VALIDATE_JOB = 'test-pack-validate'

const fail = message => {
  throw new Error(`Unsafe npm publish candidate: ${message}`)
}

export const verifyNpmPublishCandidate = ({ artifacts, jobs, run, sourceSha, version, workflow }) => {
  if (!/^[0-9a-f]{40}$/u.test(sourceSha)) fail('source SHA is not exact')
  if (run?.repository?.full_name !== EXPECTED_REPOSITORY) fail('repository does not match')
  if (run?.head_sha !== sourceSha) fail('source SHA does not match')
  if (run?.status !== 'completed' || !['success', 'failure'].includes(run?.conclusion)) {
    fail('workflow run did not reach a reusable terminal state')
  }
  if (run?.event !== 'workflow_dispatch' || run?.head_branch !== 'main') {
    fail('workflow run was not dispatched from protected main')
  }
  if (workflow?.path !== EXPECTED_WORKFLOW_PATH || run?.workflow_id !== workflow?.id) {
    fail('workflow identity does not match')
  }
  if (!Array.isArray(jobs) || !jobs.some(job =>
    job?.name === EXPECTED_VALIDATE_JOB && job?.status === 'completed' && job?.conclusion === 'success'
  )) fail('validate job did not succeed')

  const expectedName = `avatar-sdk-${version}`
  const matchingArtifacts = Array.isArray(artifacts)
    ? artifacts.filter(artifact => artifact?.name === expectedName)
    : []
  if (matchingArtifacts.length !== 1) fail('artifact name and version are not unique')
  const [artifact] = matchingArtifacts
  if (artifact?.expired !== false || artifact?.workflow_run?.id !== run?.id) {
    fail('artifact is expired or does not belong to the candidate run')
  }
  return artifact
}

const readJson = async path => JSON.parse(await (await import('node:fs/promises')).readFile(path, 'utf8'))

if (process.argv[1] != null && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [runPath, jobsPath, artifactsPath, workflowPath] = process.argv.slice(2)
  const sourceSha = process.env.SOURCE_SHA?.trim() ?? ''
  const version = process.env.VERSION?.trim() ?? ''
  if ([runPath, jobsPath, artifactsPath, workflowPath].some(value => value == null) || version.length === 0) {
    fail('missing GitHub API evidence or release version')
  }
  verifyNpmPublishCandidate({
    artifacts: (await readJson(artifactsPath)).artifacts,
    jobs: (await readJson(jobsPath)).jobs,
    run: await readJson(runPath),
    sourceSha,
    version,
    workflow: await readJson(workflowPath)
  })
}
