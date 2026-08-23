import { describe, expect, it } from 'vitest'

import {
  avatarDefinitionToSearchParams,
  createAvatarDefinition,
  flattenAvatarAnimationLibraries
} from '../src/avatarDefinition'
import { createAvatarEntityParts } from '../src/avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'
import { DEFAULT_AVATAR_VIEW_STATE } from '../src/InteractiveAvatar'
import type { AvatarAnimationLibrary } from '@oneworks/avatar-core'

describe('Avatar editor public definition bridge', () => {
  it('preserves a custom multipart scene in the editor query bridge', () => {
    const definition = createAvatarDefinition({
      animation: null,
      avatarOutlineStyle: { color: '#000000', opacity: 80, width: 4 },
      avatarShadowStyle: { color: '#000000', direction: 45, distance: 12, opacity: 24, softness: 16 },
      backgroundStyle: 'solid',
      bodyShape: 'sphere',
      cameraBackground: 'transparent',
      cameraFrame: 'rounded',
      colorGrade: { brightness: 1, saturation: 1, tintAmount: 0, tintB: 0, tintG: 0, tintR: 0 },
      entityParts: createAvatarEntityParts('dog'),
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
      paletteId: 'white',
      showAvatarShadow: true,
      showFrameShadow: true,
      showLight: false,
      showOutline: true,
      showShadow: false,
      viewState: DEFAULT_AVATAR_VIEW_STATE
    })
    const params = avatarDefinitionToSearchParams(definition)
    expect(params.get('entity')).toBe('custom')
    expect(params.get('entityParts')).toContain('ear-left')
    expect(params.get('cameraBg')).toBe('transparent')
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
              durationMs: 400,
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
})
