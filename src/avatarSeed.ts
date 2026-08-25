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
  CAT_EAR_SCALE_RANGE,
  DOG_EAR_SCALE_RANGE,
  DOG_HEAD_SCALE_RANGE,
  BEAR_EAR_SCALE_RANGE,
  BEAR_HEAD_SCALE_RANGE,
  RABBIT_EAR_SCALE_RANGE,
  RABBIT_HEAD_SCALE_RANGE
} from './avatarEntityPresets'
import type { AvatarEntityPreset } from './avatarEntityPresets'
import { AVATAR_FACE_PRESETS, DEFAULT_AVATAR_FACE_PRESET } from './avatarFacePresets'
import type { AvatarFacePreset } from './avatarFacePresets'

export const AVATAR_ANIMAL_SPECIES_IDS = ['fox', 'hamster', 'capybara', 'otter', 'pig', 'deer', 'sheep'] as const
export type AvatarAnimalSpeciesId = (typeof AVATAR_ANIMAL_SPECIES_IDS)[number]

export const AVATAR_ANIMAL_SPECIES_SEED_FIELDS = {
  fox: {
    earHeight: 'scene.entity.foxEarHeight',
    earWidth: 'scene.entity.foxEarWidth',
    headHeight: 'scene.entity.foxHeadHeight',
    headWidth: 'scene.entity.foxHeadWidth'
  },
  hamster: {
    earHeight: 'scene.entity.hamsterEarHeight',
    earWidth: 'scene.entity.hamsterEarWidth',
    headHeight: 'scene.entity.hamsterHeadHeight',
    headWidth: 'scene.entity.hamsterHeadWidth'
  },
  capybara: {
    earHeight: 'scene.entity.capybaraEarHeight',
    earWidth: 'scene.entity.capybaraEarWidth',
    headHeight: 'scene.entity.capybaraHeadHeight',
    headWidth: 'scene.entity.capybaraHeadWidth'
  },
  otter: {
    earHeight: 'scene.entity.otterEarHeight',
    earWidth: 'scene.entity.otterEarWidth',
    headHeight: 'scene.entity.otterHeadHeight',
    headWidth: 'scene.entity.otterHeadWidth'
  },
  pig: {
    earHeight: 'scene.entity.pigEarHeight',
    earWidth: 'scene.entity.pigEarWidth',
    headHeight: 'scene.entity.pigHeadHeight',
    headWidth: 'scene.entity.pigHeadWidth'
  },
  deer: {
    earHeight: 'scene.entity.deerEarHeight',
    earWidth: 'scene.entity.deerEarWidth',
    headHeight: 'scene.entity.deerHeadHeight',
    headWidth: 'scene.entity.deerHeadWidth'
  },
  sheep: {
    earHeight: 'scene.entity.sheepEarHeight',
    earWidth: 'scene.entity.sheepEarWidth',
    headHeight: 'scene.entity.sheepHeadHeight',
    headWidth: 'scene.entity.sheepHeadWidth'
  }
} as const

type AvatarAnimalSpeciesSeedField =
  (typeof AVATAR_ANIMAL_SPECIES_SEED_FIELDS)[AvatarAnimalSpeciesId][keyof (typeof AVATAR_ANIMAL_SPECIES_SEED_FIELDS)[AvatarAnimalSpeciesId]]

const ANIMAL_SPECIES_SEED_FIELDS: readonly AvatarAnimalSpeciesSeedField[] =
  Object.values(AVATAR_ANIMAL_SPECIES_SEED_FIELDS).flatMap(fields => Object.values(fields))

export const AVATAR_SEED_FIELDS = [
  'scene.entity.preset',
  AVATAR_SEED_FIELD_PATHS.catEarWidth,
  AVATAR_SEED_FIELD_PATHS.catEarHeight,
  AVATAR_SEED_FIELD_PATHS.dogEarWidth,
  AVATAR_SEED_FIELD_PATHS.dogEarHeight,
  AVATAR_SEED_FIELD_PATHS.dogHeadWidth,
  AVATAR_SEED_FIELD_PATHS.dogHeadHeight,
  AVATAR_SEED_FIELD_PATHS.bearEarWidth,
  AVATAR_SEED_FIELD_PATHS.bearEarHeight,
  AVATAR_SEED_FIELD_PATHS.bearHeadWidth,
  AVATAR_SEED_FIELD_PATHS.bearHeadHeight,
  AVATAR_SEED_FIELD_PATHS.rabbitEarWidth,
  AVATAR_SEED_FIELD_PATHS.rabbitEarHeight,
  AVATAR_SEED_FIELD_PATHS.rabbitHeadWidth,
  AVATAR_SEED_FIELD_PATHS.rabbitHeadHeight,
  ...ANIMAL_SPECIES_SEED_FIELDS,
  'scene.entity.foxEarStyle',
  'scene.entity.foxHeadTaper',
  'scene.entity.deerAntlerSize',
  'scene.entity.sheepHornSize',
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
  dogEarHeight: AVATAR_SEED_FIELD_PATHS.dogEarHeight,
  dogEarWidth: AVATAR_SEED_FIELD_PATHS.dogEarWidth,
  dogHeadHeight: AVATAR_SEED_FIELD_PATHS.dogHeadHeight,
  dogHeadWidth: AVATAR_SEED_FIELD_PATHS.dogHeadWidth,
  bearEarHeight: AVATAR_SEED_FIELD_PATHS.bearEarHeight,
  bearEarWidth: AVATAR_SEED_FIELD_PATHS.bearEarWidth,
  bearHeadHeight: AVATAR_SEED_FIELD_PATHS.bearHeadHeight,
  bearHeadWidth: AVATAR_SEED_FIELD_PATHS.bearHeadWidth,
  rabbitEarHeight: AVATAR_SEED_FIELD_PATHS.rabbitEarHeight,
  rabbitEarWidth: AVATAR_SEED_FIELD_PATHS.rabbitEarWidth,
  rabbitHeadHeight: AVATAR_SEED_FIELD_PATHS.rabbitHeadHeight,
  rabbitHeadWidth: AVATAR_SEED_FIELD_PATHS.rabbitHeadWidth,
  foxEarHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.fox.earHeight,
  foxEarStyle: 'scene.entity.foxEarStyle',
  foxEarWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.fox.earWidth,
  foxHeadHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.fox.headHeight,
  foxHeadTaper: 'scene.entity.foxHeadTaper',
  foxHeadWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.fox.headWidth,
  hamsterEarHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.hamster.earHeight,
  hamsterEarWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.hamster.earWidth,
  hamsterHeadHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.hamster.headHeight,
  hamsterHeadWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.hamster.headWidth,
  capybaraEarHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.capybara.earHeight,
  capybaraEarWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.capybara.earWidth,
  capybaraHeadHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.capybara.headHeight,
  capybaraHeadWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.capybara.headWidth,
  otterEarHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.otter.earHeight,
  otterEarWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.otter.earWidth,
  otterHeadHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.otter.headHeight,
  otterHeadWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.otter.headWidth,
  pigEarHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.pig.earHeight,
  pigEarWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.pig.earWidth,
  pigHeadHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.pig.headHeight,
  pigHeadWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.pig.headWidth,
  deerAntlerSize: 'scene.entity.deerAntlerSize',
  deerEarHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.deer.earHeight,
  deerEarWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.deer.earWidth,
  deerHeadHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.deer.headHeight,
  deerHeadWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.deer.headWidth,
  sheepEarHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.sheep.earHeight,
  sheepEarWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.sheep.earWidth,
  sheepHeadHeight: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.sheep.headHeight,
  sheepHeadWidth: AVATAR_ANIMAL_SPECIES_SEED_FIELDS.sheep.headWidth,
  sheepHornSize: 'scene.entity.sheepHornSize',
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

export const isAvatarAnimalSpeciesId = (value: unknown): value is AvatarAnimalSpeciesId => (
  typeof value === 'string' && AVATAR_ANIMAL_SPECIES_IDS.some(species => species === value)
)

export const getAvatarSeedFieldEntityPreset = (field: string): string | null => {
  const matched = /^scene\.entity\.(cat|dog|rabbit|bear|fox|hamster|capybara|otter|pig|deer|sheep)(?:Ear|Head|Antler|Horn)/u.exec(field)
  return matched?.[1] ?? null
}

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

/** Resolves the virtual dog-ear controls without changing the concrete 3D parts. */
export const resolveSeededAvatarDogEarScale = (
  seed: string,
  field: 'height' | 'width',
  domain?: AvatarSeedDomain
) => {
  const path = field === 'width' ? AVATAR_SEED_FIELD.dogEarWidth : AVATAR_SEED_FIELD.dogEarHeight
  const range = domain?.ranges?.[path] ?? DOG_EAR_SCALE_RANGE
  return resolveAvatarSeededInteger(seed, path, range.min, range.max)
}

export const resolveSeededAvatarDogHeadScale = (
  seed: string,
  field: 'height' | 'width',
  domain?: AvatarSeedDomain
) => {
  const path = field === 'width' ? AVATAR_SEED_FIELD.dogHeadWidth : AVATAR_SEED_FIELD.dogHeadHeight
  const range = domain?.ranges?.[path] ?? DOG_HEAD_SCALE_RANGE
  return resolveAvatarSeededInteger(seed, path, range.min, range.max)
}

export const resolveSeededAvatarBearEarScale = (
  seed: string,
  field: 'height' | 'width',
  domain?: AvatarSeedDomain
) => {
  const path = field === 'width' ? AVATAR_SEED_FIELD.bearEarWidth : AVATAR_SEED_FIELD.bearEarHeight
  const range = domain?.ranges?.[path] ?? BEAR_EAR_SCALE_RANGE
  return resolveAvatarSeededInteger(seed, path, range.min, range.max)
}

export const resolveSeededAvatarBearHeadScale = (
  seed: string,
  field: 'height' | 'width',
  domain?: AvatarSeedDomain
) => {
  const path = field === 'width' ? AVATAR_SEED_FIELD.bearHeadWidth : AVATAR_SEED_FIELD.bearHeadHeight
  const range = domain?.ranges?.[path] ?? BEAR_HEAD_SCALE_RANGE
  return resolveAvatarSeededInteger(seed, path, range.min, range.max)
}

export const resolveSeededAvatarRabbitEarScale = (
  seed: string,
  field: 'height' | 'width',
  domain?: AvatarSeedDomain
) => {
  const path = field === 'width' ? AVATAR_SEED_FIELD.rabbitEarWidth : AVATAR_SEED_FIELD.rabbitEarHeight
  const range = domain?.ranges?.[path] ?? RABBIT_EAR_SCALE_RANGE
  return resolveAvatarSeededInteger(seed, path, range.min, range.max)
}

export const resolveSeededAvatarRabbitHeadScale = (
  seed: string,
  field: 'height' | 'width',
  domain?: AvatarSeedDomain
) => {
  const path = field === 'width' ? AVATAR_SEED_FIELD.rabbitHeadWidth : AVATAR_SEED_FIELD.rabbitHeadHeight
  const range = domain?.ranges?.[path] ?? RABBIT_HEAD_SCALE_RANGE
  return resolveAvatarSeededInteger(seed, path, range.min, range.max)
}

export const resolveSeededAvatarAnimalScale = (
  seed: string,
  field: AvatarSeedField,
  domain?: AvatarSeedDomain
) => {
  const range = domain?.ranges?.[field] ?? { max: 150, min: 60 }
  return resolveAvatarSeededInteger(seed, field, range.min, range.max)
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
