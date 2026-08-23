import { describe, expect, it } from 'vitest'

import {
  anchorAvatarAnimationClip,
  applyAvatarScenePatch,
  createDefaultAvatarDefinition,
  createSeededAvatarDefinition,
  mergeAvatarAnimationLibraries,
  parseAvatarAnimationClip,
  parseAvatarDefinition,
  resolveAvatarAnimationClip,
  resolveAvatarAnimationFrame,
  serializeAvatarDefinition
} from '../src'
import type { AvatarAnimationClip, AvatarAnimationLibrary } from '../src'

const nod: AvatarAnimationClip = {
  anchor: 'relative',
  durationMs: 1000,
  keyframes: [
    { atMs: 0, patch: { view: { pitch: 0, yaw: 0 } } },
    { atMs: 1000, easing: 'linear', patch: { view: { pitch: .4, yaw: .6 } } }
  ],
  playback: 'once'
}

const supportLibrary: AvatarAnimationLibrary = {
  groups: {
    attention: {
      clips: { nod },
      defaultClip: 'nod'
    }
  },
  id: 'support'
}

describe('OneWorks Avatar public runtime contract', () => {
  it('creates deterministic valid 3D definitions from a seed', () => {
    const first = createSeededAvatarDefinition({ name: 'Support', seed: 'agent:support' })
    const second = createSeededAvatarDefinition({ name: 'Support', seed: 'agent:support' })
    const different = createSeededAvatarDefinition({ seed: 'agent:research' })

    expect(first).toEqual(second)
    expect(first).not.toEqual(different)
    expect(first.metadata?.name).toBe('Support')
    expect(parseAvatarDefinition(serializeAvatarDefinition(first))).toEqual(first)
  })

  it('round-trips a versioned definition', () => {
    const definition = createDefaultAvatarDefinition()
    expect(parseAvatarDefinition(serializeAvatarDefinition(definition))).toEqual(definition)
    expect(() => parseAvatarDefinition({ ...definition, version: 2 })).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: { ...definition.scene, face: { ...definition.scene.face, width: undefined } }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          effects: {
            ...definition.scene.effects,
            colorGrade: { ...definition.scene.effects.colorGrade, brightness: 2 }
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: { broken: { clips: { nope: { durationMs: 'fast' } } } },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 100,
        keyframes: [{ atMs: 0, patch: { colorGrade: { tintAmount: 1.1 } } }],
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 100,
        keyframes: [{ atMs: 0, patch: { colorGrade: { tintR: 256 } } }],
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 100,
        keyframes: [{
          atMs: 0,
          patch: {
            colorGrade: {
              brightness: .35,
              saturation: 2,
              tintAmount: 1,
              tintB: 0,
              tintG: 255,
              tintR: 255
            }
          }
        }],
        playback: 'once'
      }).keyframes
    ).toHaveLength(1)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: {
                nope: {
                  anchor: 'absolute',
                  durationMs: 100,
                  keyframes: [{ atMs: 101, patch: {} }],
                  playback: 'once'
                }
              }
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: {
                nope: {
                  anchor: 'absolute',
                  durationMs: 100,
                  keyframes: [{ atMs: 0, patch: { lighting: { enabled: true } } }],
                  playback: 'once'
                }
              }
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    const withFaceAnimation = {
      ...definition,
      animations: {
        groups: {
          valid: {
            clips: {
              expression: {
                anchor: 'absolute' as const,
                durationMs: 100,
                keyframes: [{
                  atMs: 0,
                  patch: { face: { eyeShape: 'rounded' as const, noseEnabled: false } }
                }],
                playback: 'once' as const
              }
            }
          }
        },
        id: 'valid'
      }
    }
    expect(parseAvatarDefinition(serializeAvatarDefinition(withFaceAnimation))).toEqual(withFaceAnimation)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: {
                nope: {
                  anchor: 'absolute',
                  durationMs: 100,
                  keyframes: [{ atMs: 0, patch: { face: { width: 'wide' } } }],
                  playback: 'once'
                }
              }
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: {
                nope: {
                  anchor: 'absolute',
                  durationMs: 100,
                  keyframes: [{ atMs: 0, patch: { view: { roll: 1 } } }],
                  playback: 'once'
                }
              }
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
  })

  it('resolves custom animation groups with deterministic library precedence', () => {
    const replacement = {
      ...supportLibrary,
      groups: {
        attention: {
          clips: { wave: { ...nod, label: 'Wave' } },
          defaultClip: 'wave'
        }
      }
    }
    const libraries = mergeAvatarAnimationLibraries([supportLibrary, replacement])
    expect(libraries).toHaveLength(1)
    expect(
      resolveAvatarAnimationClip(libraries, {
        clipId: 'wave',
        groupId: 'attention',
        libraryId: 'support'
      })?.label
    ).toBe('Wave')
  })

  it('anchors relative motion to the consumer definition and interpolates it', () => {
    const definition = applyAvatarScenePatch(createDefaultAvatarDefinition().scene, {
      view: { pitch: .2, positionX: 12, positionY: -8, yaw: -.3 }
    })
    const source = { ...createDefaultAvatarDefinition(), scene: definition }
    const anchored = anchorAvatarAnimationClip(source, nod)
    const middle = resolveAvatarAnimationFrame(source, anchored, 500)
    expect(middle.scene.view.pitch).toBeCloseTo(.4)
    expect(middle.scene.view.yaw).toBeCloseTo(0)
    expect(middle.scene.view.positionX).toBe(12)
    expect(middle.finished).toBe(false)
    expect(resolveAvatarAnimationFrame(source, anchored, 1000).finished).toBe(true)
  })

  it('anchors each sparse view dimension at its first authored keyframe', () => {
    const source = createDefaultAvatarDefinition()
    const definition = {
      ...source,
      scene: applyAvatarScenePatch(source.scene, { view: { yaw: -.3 } })
    }
    const clip: AvatarAnimationClip = {
      anchor: 'relative',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { face: { mouthEnabled: false } } },
        { atMs: 500, patch: { view: { yaw: .6 } } },
        { atMs: 1000, patch: { view: { yaw: 1 } } }
      ],
      playback: 'once'
    }
    const anchored = anchorAvatarAnimationClip(definition, clip)
    expect(resolveAvatarAnimationFrame(definition, anchored, 500).scene.view.yaw).toBeCloseTo(-.3)
    expect(resolveAvatarAnimationFrame(definition, anchored, 1000).scene.view.yaw).toBeCloseTo(.1)
  })

  it('interpolates from the base scene to a delayed first keyframe', () => {
    const definition = createDefaultAvatarDefinition()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [{ atMs: 500, easing: 'linear', patch: { view: { pitch: .6 } } }],
      playback: 'once'
    }
    expect(resolveAvatarAnimationFrame(definition, clip, 0).scene.view.pitch).toBe(0)
    expect(resolveAvatarAnimationFrame(definition, clip, 250).scene.view.pitch).toBeCloseTo(.3)
    expect(resolveAvatarAnimationFrame(definition, clip, 500).scene.view.pitch).toBeCloseTo(.6)
    const looping = { ...clip, playback: 'loop' as const }
    expect(resolveAvatarAnimationFrame(definition, looping, 750).scene.view.pitch).toBeCloseTo(.3)
    expect(resolveAvatarAnimationFrame(definition, looping, 1000).scene.view.pitch).toBe(0)
  })

  it('rejects timeline segments the editor cannot represent losslessly', () => {
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 50,
        keyframes: [
          { atMs: 0, patch: {} },
          { atMs: 50, patch: { view: { yaw: .1 } } }
        ],
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 9000,
        keyframes: [
          { atMs: 0, patch: {} },
          { atMs: 9000, patch: { view: { yaw: .1 } } }
        ],
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 800,
        keyframes: [
          { atMs: 0, patch: {} },
          { atMs: 800, patch: { view: { yaw: .1 } } }
        ],
        playback: 'loop'
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 500,
        keyframes: [{ atMs: 0, patch: { view: { yaw: .1 } } }],
        playback: 'loop'
      })
    ).toThrow(TypeError)
    expect(
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 900,
        keyframes: [
          { atMs: 0, patch: {} },
          { atMs: 300, patch: { view: { yaw: .1 } } }
        ],
        playback: 'loop'
      }).durationMs
    ).toBe(900)
  })
})
