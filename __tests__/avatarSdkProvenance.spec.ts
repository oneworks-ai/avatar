import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { verifyAvatarSdkAttestations } from '../scripts/avatar-sdk-provenance.mjs'

const name = '@oneworks/avatar'
const version = '1.0.0-rc.6'
const sourceSha = '0998f9d6266d71c757ab8956b8fba0b92c3226e2'
const bytes = Buffer.from('approved avatar sdk tarball')
const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`
const digest = createHash('sha512').update(bytes).digest('hex')
const subject = [{ name: 'pkg:npm/%40oneworks/avatar@1.0.0-rc.6', digest: { sha512: digest } }]

const encode = (payload: unknown) => Buffer.from(JSON.stringify(payload)).toString('base64')

const createAttestations = () => [
  {
    predicateType: 'https://github.com/npm/attestation/tree/main/specs/publish/v0.1',
    bundle: {
      dsseEnvelope: {
        payload: encode({
          subject,
          predicate: { name, version }
        })
      }
    }
  },
  {
    predicateType: 'https://slsa.dev/provenance/v1',
    bundle: {
      dsseEnvelope: {
        payload: encode({
          subject,
          predicate: {
            buildDefinition: {
              externalParameters: {
                workflow: {
                  ref: 'refs/heads/main',
                  repository: 'https://github.com/oneworks-ai/avatar',
                  path: '.github/workflows/npm-publish.yml'
                }
              },
              resolvedDependencies: [{
                uri: 'git+https://github.com/oneworks-ai/avatar@refs/heads/main',
                digest: { gitCommit: sourceSha }
              }]
            },
            runDetails: {
              metadata: {
                invocationId: 'https://github.com/oneworks-ai/avatar/actions/runs/123/attempts/1'
              }
            }
          }
        })
      }
    }
  }
]

describe('Avatar SDK npm provenance', () => {
  it('accepts the approved repository, workflow, source, package, and digest', () => {
    expect(() => verifyAvatarSdkAttestations({
      attestations: createAttestations(),
      integrity,
      name,
      sourceSha,
      version
    })).not.toThrow()
  })

  it.each([
    ['repository', 'https://github.com/oneworks-ai/app'],
    ['path', '.github/workflows/other.yml'],
    ['ref', 'refs/heads/recovery']
  ])('rejects a mismatched provenance workflow %s', (field, value) => {
    const attestations = createAttestations()
    const payload = JSON.parse(Buffer.from(
      attestations[1].bundle.dsseEnvelope.payload,
      'base64'
    ).toString('utf8'))
    payload.predicate.buildDefinition.externalParameters.workflow[field] = value
    attestations[1].bundle.dsseEnvelope.payload = encode(payload)
    expect(() => verifyAvatarSdkAttestations({
      attestations,
      integrity,
      name,
      sourceSha,
      version
    })).toThrow(/workflow identity/u)
  })

  it('rejects a mismatched source commit', () => {
    expect(() => verifyAvatarSdkAttestations({
      attestations: createAttestations(),
      integrity,
      name,
      sourceSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      version
    })).toThrow(/source commit/u)
  })

  it('rejects a mismatched package digest', () => {
    expect(() => verifyAvatarSdkAttestations({
      attestations: createAttestations(),
      integrity: `sha512-${Buffer.alloc(64).toString('base64')}`,
      name,
      sourceSha,
      version
    })).toThrow(/subject or sha512 digest/u)
  })
})
