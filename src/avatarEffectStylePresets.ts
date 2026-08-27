import presetSource from './avatarEffectStylePresets.json'

export type AvatarEffectStylePresetId = keyof typeof presetSource

export interface AvatarEffectStylePreset {
  readonly label: string
  readonly samples: readonly string[]
  readonly cameraBackground: string
  readonly cameraFrame: 'circle' | 'rounded' | 'square'
  readonly cameraMode: boolean
  readonly showLight: boolean
  readonly lightAzimuth: number
  readonly lightElevation: number
  readonly lightDistance: number
  readonly showShadow: boolean
  readonly faceShadowStyle: {
    readonly direction: number
    readonly distance: number
    readonly opacity: number
    readonly softness: number
  }
  readonly showAvatarShadow: boolean
  readonly avatarShadowStyle: {
    readonly color: string
    readonly direction: number
    readonly distance: number
    readonly opacity: number
    readonly softness: number
  }
  readonly showOutline: boolean
  readonly avatarOutlineStyle: {
    readonly color: string
    readonly width: number
    readonly opacity: number
  }
  readonly pixelEffect: {
    readonly enabled: boolean
    readonly blockSize: number
    readonly paletteSize: 8 | 16 | 32 | 64
    readonly sampling: 'center' | 'dominant' | 'median' | 'slic'
    readonly dithering: 'none' | 'ordered'
  }
  readonly showFrameShadow: boolean
  readonly frameShadowStyle: {
    readonly direction: number
    readonly distance: number
    readonly opacity: number
    readonly softness: number
  }
}

export const AVATAR_EFFECT_STYLE_PRESETS = presetSource as Readonly<
  Record<AvatarEffectStylePresetId, AvatarEffectStylePreset>
>

export const getAvatarEffectStylePreset = (value: string | null) => {
  if (value == null || !Object.prototype.hasOwnProperty.call(AVATAR_EFFECT_STYLE_PRESETS, value)) return null
  return AVATAR_EFFECT_STYLE_PRESETS[value as AvatarEffectStylePresetId]
}
