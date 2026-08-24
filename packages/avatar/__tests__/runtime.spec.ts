import { describe, expect, it } from 'vitest'

import {
  AVATAR_BACKGROUND_STYLES,
  AVATAR_CAMERA_BACKGROUND_PRESETS,
  DEFAULT_AVATAR_COAT_PATTERN,
  AVATAR_FACE_RANGES,
  AVATAR_PALETTES,
  AVATAR_SEED_FIELD_PATHS,
  anchorAvatarAnimationClip,
  applyAvatarScenePatch,
  createDefaultAvatarDefinition,
  createSeededAvatarDefinition,
  normalizeAvatarSeed,
  isAvatarDefinition,
  mergeAvatarAnimationLibraries,
  parseAvatarAnimationClip,
  parseAvatarDefinition,
  resolveAvatarAnimationClip,
  resolveAvatarAnimationFrame,
  resolveAvatarCoatPatternDecals,
  resolveAvatarSeededInteger,
  resolveAvatarSeededOption,
  resolveSeededAvatarView,
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
  it('validates and deterministically resolves first-class coat patterns', () => {
    const definition = createDefaultAvatarDefinition()
    const parts = [{
      baseColor: '#9a8267', face: true, foregroundColor: '#2f241c', highlightColor: '#c1ad8f',
      id: 'cat-head', label: 'Head', scaleX: .7, scaleY: .7, shadowColor: '#5b4635',
      shape: 'ellipse' as const, x: 0, y: 0, z: 0
    }]
    const pattern = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, seed: 'v1-core-tabby' }
    const decorated = {
      ...definition,
      scene: {
        ...definition.scene,
        appearance: { ...definition.scene.appearance, coatPattern: pattern, paletteId: 'tabby' },
        entity: { parts, preset: 'cat' as const }
      }
    }
    expect(isAvatarDefinition(decorated)).toBe(true)
    const first = resolveAvatarCoatPatternDecals({ entityParts: parts, entityPreset: 'cat', paletteId: 'tabby', pattern })
    expect(resolveAvatarCoatPatternDecals({ entityParts: parts, entityPreset: 'cat', paletteId: 'tabby', pattern })).toEqual(first)
    expect(first.length).toBeGreaterThan(0)
  })

  it('accepts old coat definitions while validating optional light coat patch fields', () => {
    const definition = createDefaultAvatarDefinition()
    const oldPattern = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true }
    delete (oldPattern as { lightPatchLength?: number }).lightPatchLength
    delete (oldPattern as { lightPatchOffsetY?: number }).lightPatchOffsetY
    delete (oldPattern as { lightPatchShape?: string }).lightPatchShape
    delete (oldPattern as { lightPatchWidth?: number }).lightPatchWidth
    const oldDefinition = {
      ...definition,
      scene: {
        ...definition.scene,
        appearance: { ...definition.scene.appearance, coatPattern: oldPattern }
      }
    }
    expect(isAvatarDefinition(oldDefinition)).toBe(true)
    expect(isAvatarDefinition({
      ...oldDefinition,
      scene: {
        ...oldDefinition.scene,
        appearance: {
          ...oldDefinition.scene.appearance,
          coatPattern: { ...oldPattern, lightPatchShape: 'rounded-triangle' }
        }
      }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...oldDefinition,
      scene: {
        ...oldDefinition.scene,
        appearance: {
          ...oldDefinition.scene.appearance,
          coatPattern: { ...oldPattern, lightPatchOffsetY: -51 }
        }
      }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...oldDefinition,
      scene: {
        ...oldDefinition.scene,
        appearance: {
          ...oldDefinition.scene.appearance,
          coatPattern: { ...oldPattern, lightPatchLength: 59 }
        }
      }
    })).toBe(false)
  })

  it('validates optional independent eye widths as strict bounded face fields', () => {
    const definition = createDefaultAvatarDefinition()
    const withIndependentWidths = {
      ...definition,
      scene: {
        ...definition.scene,
        face: { ...definition.scene.face, leftEyeWidth: 12, rightEyeWidth: 68 }
      }
    }

    expect(isAvatarDefinition(withIndependentWidths)).toBe(true)
    expect(isAvatarDefinition({
      ...withIndependentWidths,
      scene: {
        ...withIndependentWidths.scene,
        face: { ...withIndependentWidths.scene.face, leftEyeWidth: 0 }
      }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...withIndependentWidths,
      scene: {
        ...withIndependentWidths.scene,
        face: { ...withIndependentWidths.scene.face, rightEyeWidth: Number.NaN }
      }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...withIndependentWidths,
      scene: {
        ...withIndependentWidths.scene,
        face: { ...withIndependentWidths.scene.face, unknownEyeWidth: 24 }
      }
    })).toBe(false)
  })

  it('creates deterministic valid 3D definitions from a seed', () => {
    const first = createSeededAvatarDefinition({ name: 'Support', seed: 'agent:support' })
    const second = createSeededAvatarDefinition({ name: 'Support', seed: 'agent:support' })
    const different = createSeededAvatarDefinition({ seed: 'agent:research' })

    expect(first).toEqual(second)
    expect(first).not.toEqual(different)
    expect(first.metadata?.name).toBe('Support')
    expect(first.metadata?.generation).toEqual(expect.objectContaining({
      seed: 'v1-agent:support',
      version: 1
    }))
    expect(first.scene.appearance.backgroundStyle).toBe(resolveAvatarSeededOption(
      'v1-agent:support',
      AVATAR_SEED_FIELD_PATHS.backgroundStyle,
      AVATAR_BACKGROUND_STYLES
    ))
    expect(first.scene.appearance.paletteId).toBe(resolveAvatarSeededOption(
      'v1-agent:support',
      AVATAR_SEED_FIELD_PATHS.palette,
      AVATAR_PALETTES.map(palette => palette.id)
    ))
    expect(first.scene.camera.background).toBe(resolveAvatarSeededOption(
      'v1-agent:support',
      AVATAR_SEED_FIELD_PATHS.cameraBackground,
      AVATAR_CAMERA_BACKGROUND_PRESETS
    ))
    expect(first.scene.camera.frame).toBe(createDefaultAvatarDefinition().scene.camera.frame)
    expect(first.metadata?.generation?.fields).not.toContain(AVATAR_SEED_FIELD_PATHS.cameraFrame)
    expect(first.metadata?.generation?.fields).toContain(AVATAR_SEED_FIELD_PATHS.viewPose)
    expect(first.scene.view.scale).toBe(1.72)
    expect(Math.abs(first.scene.view.yaw - Math.atan2(-first.scene.view.positionX, 360)))
      .toBeLessThanOrEqual(Math.PI / 36)
    expect(first.scene.view.positionY).toBe(72)
    expect(Math.abs(first.scene.view.pitch - Math.atan2(-72, 360)))
      .toBeLessThanOrEqual(Math.PI / 36)
    expect(first.scene.view.roll).toBe(0)
    expect(parseAvatarDefinition(serializeAvatarDefinition(first))).toEqual(first)
  })

  it('keeps Seeded view poses upright in a consistent lower composition with restrained tilt', () => {
    const current = createDefaultAvatarDefinition().scene.view
    const views = Array.from({ length: 80 }, (_, index) => resolveSeededAvatarView(`v1-view-${index}`, current))
    expect(views.some(view => view.positionX < 0)).toBe(true)
    expect(views.some(view => view.positionX > 0)).toBe(true)
    expect(new Set(views.map(view => view.pitch.toFixed(4))).size).toBeGreaterThan(20)
    expect(new Set(views.map(view => view.yaw.toFixed(4))).size).toBeGreaterThan(20)
    for (const view of views) {
      expect(view.positionY).toBe(72)
      expect(Math.abs(view.pitch)).toBeLessThanOrEqual(Math.PI / 10)
      expect(view.roll).toBe(0)
      expect(Math.abs(view.yaw - Math.atan2(-view.positionX, 360))).toBeLessThanOrEqual(Math.PI / 36)
      expect(Math.abs(view.pitch - Math.atan2(-72, 360))).toBeLessThanOrEqual(Math.PI / 36)
      expect(view.scale).toBe(1.72)
    }
  })

  it('resolves seeded fields independently and remains stable when candidates are appended', () => {
    const seed = normalizeAvatarSeed('agent:support')
    expect(resolveAvatarSeededInteger(seed, 'face.gap', 32, 48)).toBe(
      resolveAvatarSeededInteger(seed, 'face.gap', 32, 48)
    )
    expect(resolveAvatarSeededInteger(seed, 'face.gap', 32, 48)).not.toBe(
      resolveAvatarSeededInteger(seed, 'camera.frame', 32, 48)
    )

    const original = resolveAvatarSeededOption(seed, 'entity.preset', ['cat', 'dog', 'rabbit'])
    const extended = resolveAvatarSeededOption(seed, 'entity.preset', ['cat', 'dog', 'rabbit', 'bun'])
    expect(['cat', 'dog', 'rabbit']).toContain(original)
    expect(extended === 'bun' || extended === original).toBe(true)
    expect(resolveAvatarSeededOption(seed, 'entity.preset', ['cat', 'dog', 'rabbit'])).toBe(original)
  })

  it('round-trips a versioned definition', () => {
    const definition = createDefaultAvatarDefinition()
    expect(parseAvatarDefinition(serializeAvatarDefinition(definition))).toEqual(definition)
    const profiled = {
      ...definition,
      metadata: {
        generation: {
          fields: ['scene.face.preset'],
          profileId: 'future-cat-profile',
          seed: 'v1-profiled',
          version: 1 as const
        }
      }
    }
    expect(parseAvatarDefinition(serializeAvatarDefinition(profiled))).toEqual(profiled)
    expect(() => parseAvatarDefinition({
      ...profiled,
      metadata: {
        generation: { ...profiled.metadata.generation, profileId: ' future-cat-profile' }
      }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({ ...definition, version: 2 })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({
      ...definition,
      metadata: { generation: { fields: ['scene.face', 'scene.face'], seed: 'v1-test', version: 1 } }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({
      ...definition,
      metadata: { generation: { fields: [' scene.face'], seed: 'v1-test', version: 1 } }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({
      ...definition,
      metadata: { generation: { fields: ['scene.face,scene.view'], seed: 'v1-test', version: 1 } }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition(Object.create(definition))).toThrow(TypeError)
    const revoked = Proxy.revocable(definition, {})
    revoked.revoke()
    expect(isAvatarDefinition(revoked.proxy)).toBe(false)
    expect(() => parseAvatarDefinition(revoked.proxy)).toThrow(TypeError)
    expect(() => parseAvatarAnimationClip(Object.create(nod))).toThrow(TypeError)
    const revokedClip = Proxy.revocable(nod, {})
    revokedClip.revoke()
    expect(() => parseAvatarAnimationClip(revokedClip.proxy)).toThrow(TypeError)
    const decorated = {
      ...definition,
      scene: {
        ...definition.scene,
        decals: [{
          color: '#f29a93',
          height: 18,
          id: 'blush-left',
          label: 'Left blush',
          opacity: 90,
          rotation: -8,
          shape: 'ellipse' as const,
          targetPartId: null,
          width: 30,
          x: -48,
          y: 30
        }],
        face: {
          ...definition.scene.face,
          eyeHighlight: {
            color: '#ffffff',
            enabled: true,
            offsetX: -18,
            offsetY: -20,
            opacity: 92,
            size: 28
          }
        }
      }
    }
    expect(parseAvatarDefinition(serializeAvatarDefinition(decorated))).toEqual(decorated)
    const withFaceMask = {
      ...decorated,
      scene: {
        ...decorated.scene,
        decals: [{
          ...decorated.scene.decals[0]!,
          height: 160,
          id: 'face-to-chin',
          rotation: 0,
          shape: 'face-mask' as const,
          side: 'face' as const,
          width: 108,
          x: 0,
          y: 70
        }]
      }
    }
    expect(parseAvatarDefinition(serializeAvatarDefinition(withFaceMask))).toEqual(withFaceMask)
    expect(() =>
      parseAvatarDefinition({
        ...decorated,
        scene: { ...decorated.scene, decals: [{ ...decorated.scene.decals[0]!, opacity: 101 }] }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...decorated,
        scene: {
          ...decorated.scene,
          face: { ...decorated.scene.face, eyeHighlight: { ...decorated.scene.face.eyeHighlight, size: 0 } }
        }
      })
    ).toThrow(TypeError)
    const invalidScenes = [
      { ...definition.scene, face: { ...definition.scene.face, width: -1 } },
      { ...definition.scene, view: { ...definition.scene.view, scale: -1 } },
      {
        ...definition.scene,
        effects: {
          ...definition.scene.effects,
          outline: { ...definition.scene.effects.outline, opacity: 1000 }
        }
      },
      {
        ...definition.scene,
        camera: {
          ...definition.scene.camera,
          frameShadow: { ...definition.scene.camera.frameShadow, distance: -20 }
        }
      },
      { ...definition.scene, lighting: { ...definition.scene.lighting, gridDensity: -1 } },
      { ...definition.scene, camera: { ...definition.scene.camera, background: 'bogus' } },
      {
        ...definition.scene,
        effects: {
          ...definition.scene.effects,
          outline: { ...definition.scene.effects.outline, color: 'bogus' }
        }
      }
    ]
    invalidScenes.forEach(scene => {
      expect(() => parseAvatarDefinition({ ...definition, scene })).toThrow(TypeError)
    })
    expect(
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          camera: {
            ...definition.scene.camera,
            frameShadow: { ...definition.scene.camera.frameShadow, distance: 40, softness: 48 }
          },
          effects: {
            ...definition.scene.effects,
            outline: { ...definition.scene.effects.outline, opacity: 100, width: 20 }
          },
          face: { ...definition.scene.face, width: 72 },
          lighting: { ...definition.scene.lighting, gridDensity: 400 },
          view: { ...definition.scene.view, positionX: -230, positionY: 230, scale: .35 }
        }
      }).scene.view.scale
    ).toBe(.35)
    const changing = { ...definition }
    let versionReads = 0
    Object.defineProperty(changing, 'version', {
      enumerable: true,
      get: () => ++versionReads === 1 ? 1 : 2
    })
    expect(() => parseAvatarDefinition(changing)).toThrow(TypeError)
    const polluted = { ...definition, scene: { ...definition.scene, view: { ...definition.scene.view } } }
    delete (polluted.scene.view as { yaw?: number }).yaw
    Object.defineProperty(Object.prototype, 'yaw', { configurable: true, value: 0 })
    try {
      expect(() => parseAvatarDefinition(polluted)).toThrow(TypeError)
    } finally {
      delete (Object.prototype as { yaw?: number }).yaw
    }
    const hiddenVersion = { ...definition }
    Object.defineProperty(hiddenVersion, 'version', { enumerable: false, value: 1 })
    expect(() => parseAvatarDefinition(hiddenVersion)).toThrow(TypeError)
    const hiddenExtra = { ...definition }
    Object.defineProperty(hiddenExtra, 'extra', { value: true })
    expect(() => parseAvatarDefinition(hiddenExtra)).toThrow(TypeError)
    const hiddenName = { ...definition, metadata: {} }
    Object.defineProperty(hiddenName.metadata, 'name', { value: 'Hidden' })
    expect(() => parseAvatarDefinition(hiddenName)).toThrow(TypeError)
    const missingHighlight = {
      ...definition,
      scene: { ...definition.scene, face: { ...definition.scene.face } }
    }
    delete (missingHighlight.scene.face as Partial<typeof missingHighlight.scene.face>).eyeHighlight
    expect(() => parseAvatarDefinition(missingHighlight)).toThrow(TypeError)
    const missingDecals = { ...definition, scene: { ...definition.scene } }
    delete (missingDecals.scene as Partial<typeof missingDecals.scene>).decals
    expect(() => parseAvatarDefinition(missingDecals)).toThrow(TypeError)
    const hiddenDecals = [] as typeof definition.scene.decals[number][]
    Object.defineProperty(hiddenDecals, '0', {
      configurable: true,
      enumerable: false,
      value: definition.scene.decals[0] ?? {
        color: '#ffffff',
        height: 20,
        id: 'hidden',
        label: 'Hidden',
        opacity: 100,
        rotation: 0,
        shape: 'ellipse',
        targetPartId: null,
        width: 20,
        x: 0,
        y: 0
      },
      writable: true
    })
    expect(isAvatarDefinition({ ...definition, scene: { ...definition.scene, decals: hiddenDecals } })).toBe(false)
    expect(() => parseAvatarDefinition({ ...definition, [Symbol('extra')]: true })).toThrow(TypeError)
    const invalidWidth = {
      ...definition,
      scene: { ...definition.scene, face: { ...definition.scene.face, width: 999 } }
    }
    expect(isAvatarDefinition(invalidWidth)).toBe(false)
    expect(() => {
      ;(AVATAR_FACE_RANGES.width as { max: number }).max = 1000
    }).toThrow(TypeError)
    expect(isAvatarDefinition(invalidWidth)).toBe(false)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          glyph: { leftEye: '0', linkEyes: true, mouth: 'w', rightEye: '0' }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          decals: [{
            color: '#f29a93',
            height: 18,
            id: 'missing-target',
            label: 'Missing target',
            opacity: 90,
            rotation: 0,
            shape: 'ellipse',
            targetPartId: 'missing-part',
            width: 30,
            x: 0,
            y: 0
          }]
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          decals: [{
            color: '#f29a93',
            height: 18,
            id: 'blank-target',
            label: 'Blank target',
            opacity: 90,
            rotation: 0,
            shape: 'ellipse',
            targetPartId: ' ',
            width: 30,
            x: 0,
            y: 0
          }]
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: Array(1), preset: 'custom' }
        }
      })
    ).toThrow(TypeError)
    const duplicatePart = {
      baseColor: '#111111',
      face: true,
      foregroundColor: '#ffffff',
      highlightColor: '#eeeeee',
      id: 'duplicate',
      label: 'Duplicate',
      scaleX: 1,
      scaleY: 1,
      shadowColor: '#000000',
      shape: 'sphere' as const,
      x: 0,
      y: 0,
      z: 0
    }
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: [{ ...duplicatePart, id: '' }], preset: 'custom' }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: [{ ...duplicatePart, baseColor: 'bogus' }], preset: 'custom' }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: [{ ...duplicatePart, scaleX: 0 }], preset: 'custom' }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: {
            parts: [{ ...duplicatePart, face: false }],
            preset: 'custom'
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: {
            parts: [duplicatePart, { ...duplicatePart, id: 'second' }],
            preset: 'custom'
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: {
            parts: [duplicatePart, { ...duplicatePart }],
            preset: 'custom'
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 100,
        keyframes: Array(1),
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(() => parseAvatarDefinition({ ...definition, extra: true })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({ ...definition, animations: null })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({ ...definition, metadata: null })).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: { ...definition.scene, extra: true }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: { ...definition.scene, view: { ...definition.scene.view, extra: true } }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: { ...definition.scene, face: { ...definition.scene.face, width: undefined } }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: { nod },
              defaultClip: 'missing'
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        extra: true
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ ...nod.keyframes[0], extra: true }]
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ atMs: 0, easing: null, patch: {} }]
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ atMs: 0, patch: { view: null } }]
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ atMs: 0, patch: { face: { width: -1 } } }]
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ atMs: 0, patch: { view: { positionX: Number.POSITIVE_INFINITY } } }]
      })
    ).toThrow(TypeError)
    const symbolicPatch = {
      ...nod,
      keyframes: [{ atMs: 0, patch: { face: { width: 28 } } }]
    }
    Object.defineProperty(symbolicPatch.keyframes[0]!.patch.face, Symbol('unknown'), {
      enumerable: true,
      value: 1
    })
    expect(() => parseAvatarAnimationClip(symbolicPatch)).toThrow(TypeError)
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

  it('validates the optional pixel effect and sampling algorithm', () => {
    const definition = createDefaultAvatarDefinition()
    const pixelated = {
      ...definition,
      scene: {
        ...definition.scene,
        effects: {
          ...definition.scene.effects,
          pixelate: {
            blockSize: 12,
            dithering: 'ordered' as const,
            enabled: true,
            paletteSize: 16 as const,
            sampling: 'slic' as const
          }
        }
      }
    }

    expect(parseAvatarDefinition(serializeAvatarDefinition(pixelated))).toEqual(pixelated)
    expect(() =>
      parseAvatarDefinition({
        ...pixelated,
        scene: {
          ...pixelated.scene,
          effects: {
            ...pixelated.scene.effects,
            pixelate: { ...pixelated.scene.effects.pixelate, sampling: 'bilinear' }
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...pixelated,
        scene: {
          ...pixelated.scene,
          effects: {
            ...pixelated.scene.effects,
            pixelate: { ...pixelated.scene.effects.pixelate, blockSize: 2.5 }
          }
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

  it('interpolates nested eye highlights consistently with the editor', () => {
    const definition = createDefaultAvatarDefinition()
    const fromHighlight = {
      ...definition.scene.face.eyeHighlight,
      enabled: true,
      offsetX: -20,
      offsetY: -16,
      opacity: 0,
      size: 8
    }
    const toHighlight = {
      ...fromHighlight,
      offsetX: 20,
      offsetY: 16,
      opacity: 100,
      size: 48
    }
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { face: { eyeHighlight: fromHighlight } } },
        { atMs: 1000, patch: { face: { eyeHighlight: toHighlight } } }
      ],
      playback: 'once'
    }

    const middle = resolveAvatarAnimationFrame(definition, clip, 500).scene.face.eyeHighlight
    expect(middle).toMatchObject({
      offsetX: 0,
      offsetY: 0,
      opacity: 50,
      size: 28
    })
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

  it('keeps relative motion unbounded by the editor drag range', () => {
    const base = createDefaultAvatarDefinition()
    const definition = {
      ...base,
      scene: applyAvatarScenePatch(base.scene, { view: { positionX: 230 } })
    }
    const clip: AvatarAnimationClip = {
      anchor: 'relative',
      durationMs: 100,
      keyframes: [
        { atMs: 0, patch: { view: { positionX: -230 } } },
        { atMs: 100, patch: { view: { positionX: 230 } } }
      ],
      playback: 'once'
    }
    const anchored = anchorAvatarAnimationClip(definition, clip)

    expect(anchored.keyframes.map(frame => frame.patch.view?.positionX)).toEqual([230, 690])
    expect(parseAvatarAnimationClip(anchored)).toEqual(anchored)
    const scene = resolveAvatarAnimationFrame(definition, anchored, 100).scene
    expect(parseAvatarDefinition({ ...definition, scene }).scene.view.positionX).toBe(690)
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
