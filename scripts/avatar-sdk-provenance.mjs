const PUBLISH_PREDICATE = 'https://github.com/npm/attestation/tree/main/specs/publish/v0.1'
const PROVENANCE_PREDICATE = 'https://slsa.dev/provenance/v1'
const EXPECTED_REPOSITORY = 'https://github.com/oneworks-ai/avatar'
const EXPECTED_REF = 'refs/heads/main'
const EXPECTED_WORKFLOW_PATH = '/.github/workflows/npm-publish.yml'

const decodePayload = (attestation) => {
  const encoded = attestation?.bundle?.dsseEnvelope?.payload
  if (typeof encoded !== 'string' || encoded.length === 0) {
    throw new Error('contains an attestation without a DSSE payload')
  }
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
}

const expectedSubject = (name, version, integrity) => ({
  digest: Buffer.from(integrity.slice('sha512-'.length), 'base64').toString('hex'),
  name: `pkg:npm/${name.replace(/^@/u, '%40')}@${version}`
})

const hasExpectedSubject = (payload, expected) =>
  Array.isArray(payload?.subject) &&
  payload.subject.some(subject =>
    subject?.name === expected.name && subject?.digest?.sha512 === expected.digest
  )

export const verifyAvatarSdkAttestations = ({ attestations, integrity, name, sourceSha, version }) => {
  if (!/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(integrity)) {
    throw new Error(`${name}@${version} has an invalid sha512 integrity`)
  }
  if (!/^[0-9a-f]{40}$/u.test(sourceSha)) {
    throw new Error(`${name}@${version} is missing an exact release source SHA`)
  }
  if (!Array.isArray(attestations)) {
    throw new Error(`${name}@${version} has no npm attestations`)
  }

  const expected = expectedSubject(name, version, integrity)
  const publish = attestations.find(item => item?.predicateType === PUBLISH_PREDICATE)
  const provenance = attestations.find(item => item?.predicateType === PROVENANCE_PREDICATE)
  if (publish == null || provenance == null) {
    throw new Error(`${name}@${version} is missing npm publish or SLSA provenance attestation`)
  }

  const publishPayload = decodePayload(publish)
  const provenancePayload = decodePayload(provenance)
  if (!hasExpectedSubject(publishPayload, expected) || !hasExpectedSubject(provenancePayload, expected)) {
    throw new Error(`${name}@${version} attestation subject or sha512 digest does not match`)
  }
  if (publishPayload?.predicate?.name !== name || publishPayload?.predicate?.version !== version) {
    throw new Error(`${name}@${version} npm publish attestation identity does not match`)
  }

  const build = provenancePayload?.predicate?.buildDefinition
  const workflow = build?.externalParameters?.workflow
  if (
    workflow?.repository !== EXPECTED_REPOSITORY ||
    workflow?.path !== EXPECTED_WORKFLOW_PATH ||
    workflow?.ref !== EXPECTED_REF
  ) {
    throw new Error(`${name}@${version} provenance workflow identity does not match`)
  }
  const expectedUri = `git+${EXPECTED_REPOSITORY}@${EXPECTED_REF}`
  const sourceMatches = Array.isArray(build?.resolvedDependencies) &&
    build.resolvedDependencies.some(dependency =>
      dependency?.uri === expectedUri && dependency?.digest?.gitCommit === sourceSha
    )
  if (!sourceMatches) {
    throw new Error(`${name}@${version} provenance source commit does not match`)
  }
  const invocationId = provenancePayload?.predicate?.runDetails?.metadata?.invocationId
  if (
    typeof invocationId !== 'string' ||
    !invocationId.startsWith(`${EXPECTED_REPOSITORY}/actions/runs/`)
  ) {
    throw new Error(`${name}@${version} provenance invocation does not match the Avatar repository`)
  }
}
