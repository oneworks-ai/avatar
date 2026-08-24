import {
  AVATAR_BACKGROUND_STYLES,
  AVATAR_CAMERA_BACKGROUND_PRESETS,
  AVATAR_COAT_PATTERN_RANGES,
  AVATAR_PALETTES,
  AVATAR_SEED_FIELD_PATHS,
  AVATAR_TABBY_COMPATIBLE_PALETTE_IDS,
  isAvatarSeedFieldPath,
  normalizeAvatarSeed,
  resolveAvatarSeededInteger,
  resolveAvatarSeededOption,
  resolveSeededAvatarView
} from '@oneworks/avatar'
import type { AvatarCoatPattern, AvatarView } from '@oneworks/avatar'
import type { AvatarCoatPatternAlgorithm, AvatarCoatPatternLightPatchShape } from '@oneworks/avatar'

import {
  AVATAR_BUILT_IN_ENTITY_PRESETS,
  CAT_EAR_SCALE_RANGE
} from './avatarEntityPresets'
import type { AvatarEntityPreset } from './avatarEntityPresets'
import { AVATAR_FACE_PRESETS, DEFAULT_AVATAR_FACE_PRESET } from './avatarFacePresets'
import type { AvatarFacePreset } from './avatarFacePresets'
export const AVATAR_SEED_FIELDS = [
  'scene.entity.preset',
  AVATAR_SEED_FIELD_PATHS.catEarWidth,
  AVATAR_SEED_FIELD_PATHS.catEarHeight,
  'scene.face.preset',
  'scene.appearance.paletteId',
  AVATAR_SEED_FIELD_PATHS.coatPatternAlgorithm,
  AVATAR_SEED_FIELD_PATHS.coatPatternSeed,
  AVATAR_SEED_FIELD_PATHS.coatPatternDensity,
  AVATAR_SEED_FIELD_PATHS.coatPatternJitter,
  AVATAR_SEED_FIELD_PATHS.coatPatternLightPatchLength,
  AVATAR_SEED_FIELD_PATHS.coatPatternLightPatchOffsetY,
  AVATAR_SEED_FIELD_PATHS.coatPatternLightPatchWidth,
  AVATAR_SEED_FIELD_PATHS.coatPatternLightPatchShape,
  AVATAR_SEED_FIELD_PATHS.coatPatternThickness,
  AVATAR_SEED_FIELD_PATHS.coatPatternSymmetry,
  AVATAR_SEED_FIELD_PATHS.coatPatternContrast,
  AVATAR_SEED_FIELD_PATHS.coatPatternBreakup,
  'scene.appearance.backgroundStyle',
  'scene.camera.background',
  AVATAR_SEED_FIELD_PATHS.viewPose
] as const

export type AvatarSeedField = (typeof AVATAR_SEED_FIELDS)[number]

export interface AvatarSeedDomain {
  readonly coatAlgorithms?: readonly AvatarCoatPatternAlgorithm[]
  readonly lightPatchShapes?: readonly AvatarCoatPatternLightPatchShape[]
  readonly paletteIds?: readonly string[]
  readonly ranges?: Partial<Record<AvatarSeedField, { readonly max: number; readonly min: number }>>
}

export const AVATAR_COAT_PATTERN_SEED_FIELDS = AVATAR_SEED_FIELDS.filter(
  field => field.startsWith('scene.appearance.coatPattern.')
)

export const AVATAR_SEED_FIELD = {
  backgroundStyle: AVATAR_SEED_FIELD_PATHS.backgroundStyle,
  cameraBackground: AVATAR_SEED_FIELD_PATHS.cameraBackground,
  catEarHeight: AVATAR_SEED_FIELD_PATHS.catEarHeight,
  catEarWidth: AVATAR_SEED_FIELD_PATHS.catEarWidth,
  coatPatternAlgorithm: AVATAR_SEED_FIELD_PATHS.coatPatternAlgorithm,
  coatPatternBreakup: AVATAR_SEED_FIELD_PATHS.coatPatternBreakup,
  coatPatternContrast: AVATAR_SEED_FIELD_PATHS.coatPatternContrast,
  coatPatternDensity: AVATAR_SEED_FIELD_PATHS.coatPatternDensity,
  coatPatternJitter: AVATAR_SEED_FIELD_PATHS.coatPatternJitter,
  coatPatternLightPatchLength: AVATAR_SEED_FIELD_PATHS.coatPatternLightPatchLength,
  coatPatternLightPatchOffsetY: AVATAR_SEED_FIELD_PATHS.coatPatternLightPatchOffsetY,
  coatPatternLightPatchShape: AVATAR_SEED_FIELD_PATHS.coatPatternLightPatchShape,
  coatPatternLightPatchWidth: AVATAR_SEED_FIELD_PATHS.coatPatternLightPatchWidth,
  coatPatternSeed: AVATAR_SEED_FIELD_PATHS.coatPatternSeed,
  coatPatternSymmetry: AVATAR_SEED_FIELD_PATHS.coatPatternSymmetry,
  coatPatternThickness: AVATAR_SEED_FIELD_PATHS.coatPatternThickness,
  entityPreset: 'scene.entity.preset',
  facePreset: 'scene.face.preset',
  palette: AVATAR_SEED_FIELD_PATHS.palette,
  viewPose: AVATAR_SEED_FIELD_PATHS.viewPose
} as const satisfies Readonly<Record<string, AvatarSeedField>>

export { AVATAR_CAMERA_BACKGROUND_PRESETS }

export const createRandomAvatarSeed = () => {
  const values = new Uint32Array(3)
  if (globalThis.crypto?.getRandomValues != null) {
    globalThis.crypto.getRandomValues(values)
  } else {
    values[0] = Date.now() >>> 0
    values[1] = Math.floor(Math.random() * 0x1_0000_0000)
    values[2] = Math.floor(Math.random() * 0x1_0000_0000)
  }
  return `v1-${Array.from(values, value => value.toString(36).padStart(7, '0')).join('')}`
}

export const parseAvatarSeedFields = (value: string | null | undefined): readonly string[] => {
  if (value == null || value.trim() === '') return []
  return Array.from(new Set(value.split(',').map(field => field.trim()).filter(field => (
    field !== AVATAR_SEED_FIELD_PATHS.cameraFrame && isAvatarSeedFieldPath(field)
  ))))
}

export const serializeAvatarSeedFields = (fields: readonly string[]) => {
  const validFields = fields.filter(field => (
    field !== AVATAR_SEED_FIELD_PATHS.cameraFrame && isAvatarSeedFieldPath(field)
  ))
  const supported = AVATAR_SEED_FIELDS.filter(field => validFields.includes(field))
  const future = validFields.filter(field => !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField))
  return [...supported, ...Array.from(new Set(future))].join(',')
}

export const resolveSeededAvatarEntityPreset = (seed: string): AvatarEntityPreset => (
  resolveAvatarSeededOption(seed, AVATAR_SEED_FIELD.entityPreset, AVATAR_BUILT_IN_ENTITY_PRESETS)
)

export const resolveSeededAvatarCatEarScale = (
  seed: string,
  field: 'height' | 'width',
  domain?: AvatarSeedDomain
) => {
  const path = field === 'width' ? AVATAR_SEED_FIELD.catEarWidth : AVATAR_SEED_FIELD.catEarHeight
  const range = domain?.ranges?.[path] ?? CAT_EAR_SCALE_RANGE
  return resolveAvatarSeededInteger(seed, path, range.min, range.max)
}

const FACE_PRESETS: readonly AvatarFacePreset[] = [DEFAULT_AVATAR_FACE_PRESET, ...AVATAR_FACE_PRESETS]

export const resolveSeededAvatarFacePreset = (seed: string): AvatarFacePreset => {
  const id = resolveAvatarSeededOption(
    seed,
    AVATAR_SEED_FIELD.facePreset,
    FACE_PRESETS.map(preset => preset.id)
  )
  return FACE_PRESETS.find(preset => preset.id === id) ?? DEFAULT_AVATAR_FACE_PRESET
}

export const resolveSeededAvatarPaletteId = (
  seed: string,
  candidates: readonly string[] = AVATAR_PALETTES.map(palette => palette.id)
) => resolveAvatarSeededOption(
  seed,
  AVATAR_SEED_FIELD.palette,
  candidates
)

export const resolveSeededAvatarTabbyPaletteId = (seed: string) => resolveSeededAvatarPaletteId(
  seed,
  AVATAR_TABBY_COMPATIBLE_PALETTE_IDS
)

export const resolveSeededAvatarBackgroundStyle = (seed: string) => resolveAvatarSeededOption(
  seed,
  AVATAR_SEED_FIELD.backgroundStyle,
  AVATAR_BACKGROUND_STYLES
)

export const resolveSeededAvatarCameraBackground = (seed: string) => resolveAvatarSeededOption(
  seed,
  AVATAR_SEED_FIELD.cameraBackground,
  AVATAR_CAMERA_BACKGROUND_PRESETS
)

export { resolveSeededAvatarView }

const shortestAvatarAngleDelta = (from: number, to: number) => {
  const fullTurn = Math.PI * 2
  const normalized = (to - from + Math.PI) % fullTurn
  return (normalized + fullTurn) % fullTurn - Math.PI
}

/** Interpolates an editor view without taking the long route across an angle wrap. */
export const interpolateAvatarView = (
  from: AvatarView,
  to: AvatarView,
  progress: number
): AvatarView => {
  const amount = Math.min(Math.max(progress, 0), 1)
  if (amount === 1) return to
  const interpolate = (start: number, end: number) => start + (end - start) * amount
  const interpolateAngle = (start: number, end: number) => (
    start + shortestAvatarAngleDelta(start, end) * amount
  )
  return {
    pitch: interpolateAngle(from.pitch, to.pitch),
    positionX: interpolate(from.positionX, to.positionX),
    positionY: interpolate(from.positionY, to.positionY),
    roll: interpolateAngle(from.roll, to.roll),
    scale: interpolate(from.scale, to.scale),
    yaw: interpolateAngle(from.yaw, to.yaw)
  }
}

export const resolveSeededAvatarCoatPattern = (
  seed: string,
  current: AvatarCoatPattern,
  fields: readonly string[],
  domain?: AvatarSeedDomain
): AvatarCoatPattern => {
  const range = (field: AvatarSeedField, fallback: { readonly max: number; readonly min: number }) => (
    domain?.ranges?.[field] ?? fallback
  )
  const resolveInteger = (
    field: AvatarSeedField,
    fallback: { readonly max: number; readonly min: number }
  ) => {
    const bounds = range(field, fallback)
    return resolveAvatarSeededInteger(seed, field, bounds.min, bounds.max)
  }
  return ({
  ...current,
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternAlgorithm)
    ? {
      algorithm: domain?.coatAlgorithms == null
        ? 'random' as const
        : resolveAvatarSeededOption(seed, AVATAR_SEED_FIELD.coatPatternAlgorithm, domain.coatAlgorithms),
      algorithmSeed: normalizeAvatarSeed(seed)
    }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternSeed)
    ? { seed: normalizeAvatarSeed(seed) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternDensity)
    ? { density: resolveInteger(AVATAR_SEED_FIELD.coatPatternDensity, AVATAR_COAT_PATTERN_RANGES.density) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternJitter)
    ? { jitter: resolveInteger(AVATAR_SEED_FIELD.coatPatternJitter, AVATAR_COAT_PATTERN_RANGES.jitter) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternLightPatchLength)
    ? { lightPatchLength: resolveInteger(AVATAR_SEED_FIELD.coatPatternLightPatchLength, AVATAR_COAT_PATTERN_RANGES.lightPatchLength) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY)
    ? { lightPatchOffsetY: resolveInteger(AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY, AVATAR_COAT_PATTERN_RANGES.lightPatchOffsetY) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternLightPatchWidth)
    ? { lightPatchWidth: resolveInteger(AVATAR_SEED_FIELD.coatPatternLightPatchWidth, AVATAR_COAT_PATTERN_RANGES.lightPatchWidth) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternLightPatchShape)
    ? { lightPatchShape: resolveAvatarSeededOption(seed, AVATAR_SEED_FIELD.coatPatternLightPatchShape, domain?.lightPatchShapes ?? ['face-mask', 'ellipse', 'rounded'] as const) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternThickness)
    ? { thickness: resolveInteger(AVATAR_SEED_FIELD.coatPatternThickness, AVATAR_COAT_PATTERN_RANGES.thickness) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternSymmetry)
    ? { symmetry: resolveInteger(AVATAR_SEED_FIELD.coatPatternSymmetry, AVATAR_COAT_PATTERN_RANGES.symmetry) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternContrast)
    ? { contrast: resolveInteger(AVATAR_SEED_FIELD.coatPatternContrast, AVATAR_COAT_PATTERN_RANGES.contrast) }
    : {}),
  ...(fields.includes(AVATAR_SEED_FIELD.coatPatternBreakup)
    ? { breakup: resolveInteger(AVATAR_SEED_FIELD.coatPatternBreakup, AVATAR_COAT_PATTERN_RANGES.breakup) }
    : {})
  })
}

export const normalizeEditorAvatarSeed = (seed: string) => normalizeAvatarSeed(seed)
