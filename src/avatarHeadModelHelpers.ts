import { DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type { AvatarFaceStyle } from './avatarGeometry'
import type { AvatarEntityPresetScene } from './avatarEntityPresets'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

export interface AvatarHeadMaterial {
  readonly baseColor: string
  readonly foregroundColor: string
  readonly highlightColor: string
  readonly shadowColor: string
}

export const createAvatarHeadFaceStyle = (
  overrides: Partial<AvatarFaceStyle>
): AvatarFaceStyle => ({
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeShape: 'rounded',
  mouthEnabled: false,
  ...overrides
})

export const createAvatarHeadSurfaceMarking = (
  options: Pick<AvatarSurfaceDecal, 'color' | 'id' | 'label'> &
    Partial<Omit<AvatarSurfaceDecal, 'color' | 'id' | 'label'>>
): AvatarSurfaceDecal => ({
  height: 126,
  opacity: 100,
  rotation: 0,
  shape: 'face-mask',
  side: 'face',
  targetPartId: 'primary',
  width: 128,
  x: 0,
  y: 29,
  ...options
})

export const createAvatarHeadOnlyScene = ({
  cameraBackground,
  material,
  paletteId,
  surfaceDecals,
  viewState
}: {
  readonly cameraBackground: string
  readonly material: AvatarHeadMaterial
  readonly paletteId: string
  readonly surfaceDecals: readonly AvatarSurfaceDecal[]
  readonly viewState: AvatarEntityPresetScene['viewState']
}): AvatarEntityPresetScene => ({
  avatarOutlineStyle: { color: material.foregroundColor, opacity: 85, width: 4 },
  avatarShadowStyle: { color: material.shadowColor, direction: 128, distance: 11, opacity: 24, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground,
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  gridDensity: 100,
  interactionMode: 'rotate',
  lightAzimuth: -35,
  lightDistance: 0,
  lightElevation: 40,
  paletteId,
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals,
  viewState
})
