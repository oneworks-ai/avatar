import { describe, expect, it } from 'vitest'

import { createDefaultAvatarDefinition, parseAvatarDefinition } from '@oneworks/avatar'
import type { AvatarAnimationLibrary } from '@oneworks/avatar'

import { DEFAULT_AVATAR_VIEW_STATE } from '../src/InteractiveAvatar'
import {
  avatarAnimationClipToSavedAnimation,
  avatarDefinitionToSearchParams,
  avatarDefinitionToState,
  createAvatarDefinition,
  flattenAvatarAnimationLibraries
} from '../src/avatarDefinition'
import { createAvatarEntityParts, deserializeAvatarEntityParts } from '../src/avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'
describe('Avatar editor public definition bridge', () => {
  it('preserves a custom multipart scene in the editor query bridge', () => {
    const customParts = createAvatarEntityParts('dog')
    const definition = createAvatarDefinition({
      animation: null,
      avatarOutlineStyle: { color: '#000000', opacity: 80, width: 4 },
      avatarShadowStyle: { color: '#000000', direction: 45, distance: 12, opacity: 24, softness: 16 },
      backgroundStyle: 'solid',
      bodyShape: 'sphere',
      cameraBackground: 'transparent',
      cameraFrame: 'rounded',
      colorGrade: { brightness: 1, saturation: 1, tintAmount: 0, tintB: 0, tintG: 0, tintR: 0 },
      entityParts: customParts,
      entityPreset: 'custom',
      exportSize: 256,
      faceShadowStyle: { color: '#123456', direction: 50, distance: 4, opacity: 28, softness: 0 },
      faceStyle: { ...DEFAULT_AVATAR_FACE_STYLE, leftEyeHeight: 52, rightEyeHeight: 44 },
      frameShadowStyle: { color: '#654321', direction: 90, distance: 12, opacity: 22, softness: 24 },
      glyph: { leftEye: '0', linkEyes: true, mouth: 'w', rightEye: '0' },
      gridDensity: 100,
      interactionMode: 'rotate',
      lightAzimuth: -35,
      lightDistance: 0,
      lightElevation: 40,
      paletteId: 'white',
      showAvatarShadow: true,
      showFrameShadow: true,
      showLight: false,
      showOutline: true,
      showShadow: false,
      surfaceDecals: [{
        color: '#f29a93',
        height: 18,
        id: 'blush-left',
        label: 'Left blush',
        opacity: 90,
        rotation: -8,
        shape: 'ellipse',
        targetPartId: customParts.find(part => part.face)?.id ?? null,
        width: 30,
        x: -48,
        y: 30
      }],
      viewState: DEFAULT_AVATAR_VIEW_STATE
    })
    const params = avatarDefinitionToSearchParams(definition)
    expect(params.get('entity')).toBe('custom')
    expect(params.get('entityParts')).toContain('ear-left')
    expect(params.get('cameraBg')).toBe('transparent')
    expect(params.get('eyeLeftH')).toBe('52')
    expect(params.get('eyeRightH')).toBe('44')
    expect(params.get('shadowColor')).toBe('#123456')
    expect(params.get('frameShadowColor')).toBe('#654321')
    expect(params.get('eyeHighlight')).toBe('0')
    expect(params.get('decals')).toContain('blush-left')
    expect(deserializeAvatarEntityParts(params.get('entityParts'), 'custom')).toMatchObject(customParts)
    expect(createAvatarDefinition(avatarDefinitionToState(definition), definition)).toEqual(definition)
  })

  it('converts external animation groups into editable editor entries', () => {
    const definition = createAvatarDefinition({
      animation: null,
      avatarOutlineStyle: { color: '#000000', opacity: 80, width: 4 },
      avatarShadowStyle: { color: '#000000', direction: 45, distance: 12, opacity: 24, softness: 16 },
      backgroundStyle: 'solid',
      bodyShape: 'sphere',
      cameraBackground: '#111315',
      cameraFrame: 'rounded',
      colorGrade: { brightness: 1, saturation: 1, tintAmount: 0, tintB: 0, tintG: 0, tintR: 0 },
      entityParts: [],
      entityPreset: 'custom',
      exportSize: 256,
      faceShadowStyle: { direction: 50, distance: 4, opacity: 28, softness: 0 },
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      frameShadowStyle: { direction: 90, distance: 12, opacity: 22, softness: 24 },
      glyph: { leftEye: '0', linkEyes: true, mouth: 'w', rightEye: '0' },
      gridDensity: 100,
      interactionMode: 'rotate',
      lightAzimuth: -35,
      lightDistance: 0,
      lightElevation: 40,
      paletteId: 'signal',
      showAvatarShadow: true,
      showFrameShadow: true,
      showLight: false,
      showOutline: true,
      showShadow: false,
      viewState: DEFAULT_AVATAR_VIEW_STATE
    })
    const library: AvatarAnimationLibrary = {
      groups: {
        support: {
          clips: {
            listen: {
              anchor: 'relative',
              durationMs: 500,
              keyframes: [
                { atMs: 0, patch: { view: { yaw: 0 } } },
                { atMs: 400, patch: { view: { yaw: .2 } } }
              ],
              label: 'Listen',
              playback: 'loop'
            }
          }
        }
      },
      id: 'customer-support'
    }
    const [entry] = flattenAvatarAnimationLibraries([library], definition.scene)
    expect(entry?.animation.name).toBe('Listen')
    expect(entry?.animation.keyframes).toHaveLength(2)
    expect(entry?.animation.id).toBe('public:customer-support:support:listen')
  })

  it('uses the same later-library precedence as the public renderer', () => {
    const scene = createDefaultAvatarDefinition().scene
    const base: AvatarAnimationLibrary = {
      groups: {
        support: {
          clips: {
            listen: {
              anchor: 'absolute',
              durationMs: 100,
              keyframes: [{ atMs: 0, patch: { view: { yaw: 0 } } }],
              label: 'Definition',
              playback: 'once'
            }
          }
        }
      },
      id: 'support'
    }
    const external: AvatarAnimationLibrary = {
      ...base,
      groups: {
        support: {
          clips: {
            listen: {
              ...base.groups.support!.clips.listen!,
              label: 'External'
            }
          }
        }
      }
    }

    const entries = flattenAvatarAnimationLibraries([base, external], scene)
    expect(entries).toHaveLength(1)
    expect(entries[0]?.animation.name).toBe('External')
  })

  it('preserves animation libraries while previewing and editing one clip', () => {
    const base = createDefaultAvatarDefinition()
    const first = {
      anchor: 'absolute' as const,
      durationMs: 100,
      keyframes: [{ atMs: 0, patch: { view: { yaw: 0 } } }],
      playback: 'once' as const
    }
    const library: AvatarAnimationLibrary = {
      groups: {
        primary: {
          clips: { first, second: { ...first, label: 'Second' } },
          defaultClip: 'first'
        },
        secondary: { clips: { third: { ...first, label: 'Third' } } }
      },
      id: 'custom',
      label: 'Custom library'
    }
    const definition = { ...base, animations: library }
    const state = avatarDefinitionToState(definition)

    expect(createAvatarDefinition({ ...state, animation: null }, definition).animations).toEqual(library)

    const animation = avatarAnimationClipToSavedAnimation('edited', {
      ...first,
      label: 'Edited',
      keyframes: [{ atMs: 0, patch: { view: { yaw: .4 } } }]
    }, definition.scene)
    const edited = createAvatarDefinition({
      ...state,
      animation,
      animationTargetKey: 'public:custom:primary:first'
    }, definition)
    expect(edited.animations?.groups.primary.clips.first.label).toBe('Edited')
    expect(edited.animations?.groups.primary.clips.second.label).toBe('Second')
    expect(edited.animations?.groups.secondary.clips.third.label).toBe('Third')
    expect(edited.animations?.label).toBe('Custom library')

    const externalOverride = createAvatarDefinition({
      ...state,
      animation,
      animationLibraryIds: ['custom'],
      animationTargetKey: 'public:custom:primary:first'
    }, definition)
    expect(externalOverride.animations?.id).toBe('document')
    expect(externalOverride.animations?.groups.primary.clips.second.label).toBe('Second')
    expect(externalOverride.animations?.groups.document.clips.animation.label).toBe('Edited')
    expect(flattenAvatarAnimationLibraries([
      externalOverride.animations!,
      { ...library, groups: { primary: library.groups.primary! } }
    ], definition.scene).map(entry => entry.libraryId)).toEqual([
      'document',
      'document',
      'document',
      'document',
      'custom',
      'custom'
    ])
  })

  it('emits parseable animation definitions when optional eye heights are unset', () => {
    const base = createDefaultAvatarDefinition()
    const state = avatarDefinitionToState(base)
    const animation = avatarAnimationClipToSavedAnimation('default-face', {
      anchor: 'absolute',
      durationMs: 100,
      keyframes: [{ atMs: 0, patch: {} }],
      playback: 'once'
    }, base.scene)
    const definition = createAvatarDefinition({ ...state, animation }, base)
    const face = definition.animations?.groups.document?.clips.animation?.keyframes[0]?.patch.face

    expect(face).not.toHaveProperty('leftEyeHeight')
    expect(face).not.toHaveProperty('rightEyeHeight')
    expect(parseAvatarDefinition(definition)).toEqual(definition)
  })

  it('preserves a delayed first public keyframe in the editor timeline', () => {
    const saved = avatarAnimationClipToSavedAnimation(
      'delayed',
      {
        anchor: 'absolute',
        durationMs: 800,
        keyframes: [{ atMs: 300, easing: 'linear', patch: { view: { pitch: .4 } } }],
        playback: 'once'
      },
      createAvatarDefinition({
        animation: null,
        avatarOutlineStyle: { color: '#000000', opacity: 80, width: 4 },
        avatarShadowStyle: { color: '#000000', direction: 45, distance: 12, opacity: 24, softness: 16 },
        backgroundStyle: 'solid',
        bodyShape: 'sphere',
        cameraBackground: '#111315',
        cameraFrame: 'rounded',
        colorGrade: { brightness: 1, saturation: 1, tintAmount: 0, tintB: 0, tintG: 0, tintR: 0 },
        entityParts: [],
        entityPreset: 'custom',
        exportSize: 256,
        faceShadowStyle: { direction: 50, distance: 4, opacity: 28, softness: 0 },
        faceStyle: DEFAULT_AVATAR_FACE_STYLE,
        frameShadowStyle: { direction: 90, distance: 12, opacity: 22, softness: 24 },
        glyph: { leftEye: '0', linkEyes: true, mouth: 'w', rightEye: '0' },
        gridDensity: 100,
        interactionMode: 'rotate',
        lightAzimuth: -35,
        lightDistance: 0,
        lightElevation: 40,
        paletteId: 'signal',
        showAvatarShadow: true,
        showFrameShadow: true,
        showLight: false,
        showOutline: true,
        showShadow: false,
        viewState: DEFAULT_AVATAR_VIEW_STATE
      }).scene
    )
    expect(saved.keyframes).toHaveLength(3)
    expect(saved.keyframes[0]?.pitch).toBe(DEFAULT_AVATAR_VIEW_STATE.pitch)
    expect(saved.keyframes[1]?.durationMs).toBe(300)
    expect(saved.keyframes[1]?.pitch).toBe(.4)
    expect(saved.keyframes[2]?.durationMs).toBe(500)
    expect(saved.keyframes[2]?.pitch).toBe(.4)
  })

  it('preserves sparse relative view anchors when opening a public clip in the editor', () => {
    const scene = createAvatarDefinition({
      animation: null,
      avatarOutlineStyle: { color: '#000000', opacity: 80, width: 4 },
      avatarShadowStyle: { color: '#000000', direction: 45, distance: 12, opacity: 24, softness: 16 },
      backgroundStyle: 'solid',
      bodyShape: 'sphere',
      cameraBackground: '#111315',
      cameraFrame: 'rounded',
      colorGrade: { brightness: 1, saturation: 1, tintAmount: 0, tintB: 0, tintG: 0, tintR: 0 },
      entityParts: [],
      entityPreset: 'custom',
      exportSize: 256,
      faceShadowStyle: { direction: 50, distance: 4, opacity: 28, softness: 0 },
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      frameShadowStyle: { direction: 90, distance: 12, opacity: 22, softness: 24 },
      glyph: { leftEye: '0', linkEyes: true, mouth: 'w', rightEye: '0' },
      gridDensity: 100,
      interactionMode: 'rotate',
      lightAzimuth: -35,
      lightDistance: 0,
      lightElevation: 40,
      paletteId: 'signal',
      showAvatarShadow: true,
      showFrameShadow: true,
      showLight: false,
      showOutline: true,
      showShadow: false,
      viewState: { ...DEFAULT_AVATAR_VIEW_STATE, yaw: -.3 }
    }).scene
    const saved = avatarAnimationClipToSavedAnimation('sparse', {
      anchor: 'relative',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { face: { mouthEnabled: false } } },
        { atMs: 500, patch: { view: { yaw: .6 } } },
        { atMs: 1000, patch: { view: { yaw: 1 } } }
      ],
      playback: 'once'
    }, scene)
    expect(saved.lockStartPosition).toBe(true)
    expect(saved.keyframes[0]?.yaw).toBeCloseTo(-.3)
    expect(saved.keyframes[1]?.yaw).toBeCloseTo(-.3)
    expect(saved.keyframes[2]?.yaw).toBeCloseTo(.1)
  })
})
