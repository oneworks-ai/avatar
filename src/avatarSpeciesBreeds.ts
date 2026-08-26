import { DEFAULT_AVATAR_COAT_PATTERN } from '@oneworks/avatar'
import type { AvatarCoatPattern } from '@oneworks/avatar'

import * as avatarEntityPresets from './avatarEntityPresets'
import {
  applyAvatarEntityPalette,
  createAvatarEntityParts,
  resolveAvatarEntityPresetFaceStyle
} from './avatarEntityPresets'
import type {
  AvatarEntityFaceStyleOverride,
  AvatarEntityPart,
  AvatarEntityPreset,
  AvatarFoxEarStyle,
  AvatarFoxSurfaceMarkingStyle
} from './avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type { AvatarFaceStyle } from './avatarGeometry'
import {
  applyAvatarBreedMarkingTone,
  getAvatarBreedToneJitterRange,
  resolveAvatarBreedPalette
} from './avatarBreedTone'
import {
  AVATAR_ANIMAL_SPECIES_IDS,
  AVATAR_ANIMAL_SPECIES_SEED_FIELDS,
  AVATAR_SEED_FIELD,
  getAvatarAnimalEarSeedFields,
  resolveSeededAvatarAnimalScale,
  resolveSeededAvatarCoatPattern,
  resolveSeededAvatarPaletteTone
} from './avatarSeed'
import type {
  AvatarAnimalSpeciesId,
  AvatarPaletteToneJitterRange,
  AvatarSeedDomain,
  AvatarSeedField
} from './avatarSeed'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

type AvatarAnimalDimension = 'earHeight' | 'earWidth' | 'headHeight' | 'headWidth'
type AvatarAnimalHornStyle = 'branched' | 'broad' | 'curled' | 'curved' | 'flat' | 'forked' | 'full' | 'highland' | 'hooked' | 'juvenile' | 'macaw' | 'none' | 'paired' | 'pointed' | 'reindeer' | 'short' | 'spike' | 'straight' | 'tapered'
type AvatarAnimalDetailStyle = 'comb' | 'fluffy' | 'none' | 'paired'
type AvatarAnimalForelockStyle = 'highland' | 'none' | 'soft'
type AvatarAnimalBreedSurfaceFaceMarkingStyle = {
  readonly color: string
  readonly beakColor?: string
  readonly billColor?: string
  readonly combColor?: string
  readonly eyeRingColor?: string
  readonly height: number
  readonly innerEarColor?: string
  readonly maskColor?: string
  readonly nostrilColor?: string
  readonly shape: 'ellipse' | 'face-mask' | 'rounded' | 'rounded-triangle'
  readonly width: number
  readonly y: number
  readonly tuftColor?: string
}

export interface AvatarAnimalDimensions {
  readonly detailSize?: number
  readonly earHeight?: number
  readonly earWidth?: number
  readonly headHeight: number
  readonly headWidth: number
  readonly hornSize?: number
}

interface AvatarAnimalBreedOptions {
  readonly coatPattern?: Partial<AvatarCoatPattern>
  readonly detailSize?: number
  readonly detailStyle?: AvatarAnimalDetailStyle
  readonly dimensionJitter?: Partial<Record<AvatarAnimalDimension | 'detailSize' | 'hornSize', number>>
  readonly ears?: readonly [number, number]
  readonly earStyle?: AvatarFoxEarStyle
  readonly faceStyle?: AvatarEntityFaceStyleOverride
  readonly forelockStyle?: AvatarAnimalForelockStyle
  readonly follow: readonly (AvatarAnimalDimension | 'density' | 'detailSize' | 'hornSize' | 'spots')[]
  readonly head: readonly [number, number]
  readonly headTaper?: number
  readonly hornSize?: number
  readonly hornStyle?: AvatarAnimalHornStyle
  readonly previewBackground?: string
  readonly surfaceFaceMarkings?: AvatarAnimalBreedSurfaceFaceMarkingStyle
  readonly surfaceMarkings?: AvatarFoxSurfaceMarkingStyle
  readonly toneJitter?: AvatarPaletteToneJitterRange
}

export interface AvatarAnimalBreedTemplate {
  readonly fixed: {
    readonly coatPattern: Partial<AvatarCoatPattern>
    readonly detailSize?: number
    readonly detailStyle?: AvatarAnimalDetailStyle
    readonly earHeight?: number
    readonly earStyle?: AvatarFoxEarStyle
    readonly earWidth?: number
    readonly faceStyle: AvatarEntityFaceStyleOverride
    readonly forelockStyle?: AvatarAnimalForelockStyle
    readonly headHeight: number
    readonly headTaper?: number
    readonly headWidth: number
    readonly hornSize?: number
    readonly hornStyle?: AvatarAnimalHornStyle
    readonly paletteId: string
    readonly surfaceFaceMarkings?: AvatarAnimalBreedSurfaceFaceMarkingStyle
    readonly surfaceMarkings?: AvatarFoxSurfaceMarkingStyle
  }
  readonly followByDefault: readonly AvatarSeedField[]
  readonly id: string
  readonly label: string
  readonly previewBackground?: string
  readonly seedDomain: AvatarSeedDomain
  readonly species: AvatarAnimalSpeciesId
  readonly toneJitter: AvatarPaletteToneJitterRange
}

export interface ResolvedAvatarAnimalBreedTemplate extends AvatarAnimalDimensions {
  readonly coatPattern: AvatarCoatPattern
  readonly detailStyle?: AvatarAnimalDetailStyle
  readonly entityParts: readonly AvatarEntityPart[]
  readonly faceStyle: AvatarFaceStyle
  readonly hornStyle?: AvatarAnimalHornStyle
  readonly paletteId: string
  readonly surfaceDecals?: readonly AvatarSurfaceDecal[]
}

const ENTITY_MODEL_EXPORTS = avatarEntityPresets as unknown as Readonly<Record<string, unknown>>

const speciesExportName = (species: AvatarAnimalSpeciesId) => (
  species.split('-').map(segment => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`).join('')
)

type AnimalScaleFunction = (
  entityParts: readonly AvatarEntityPart[],
  width?: number,
  height?: number
) => readonly AvatarEntityPart[]

type AnimalScaleReader = (entityParts: readonly AvatarEntityPart[]) => {
  readonly height: number
  readonly width: number
}

const getScaleFunction = (
  species: AvatarAnimalSpeciesId,
  part: 'Ear' | 'Head'
): AnimalScaleFunction | null => {
  const fn = ENTITY_MODEL_EXPORTS[`apply${speciesExportName(species)}${part}Scale`]
  return typeof fn === 'function' ? fn as AnimalScaleFunction : null
}

const getScaleReader = (
  species: AvatarAnimalSpeciesId,
  part: 'Ear' | 'Head'
): AnimalScaleReader | null => {
  const fn = ENTITY_MODEL_EXPORTS[`get${speciesExportName(species)}${part}Scale`]
  return typeof fn === 'function' ? fn as AnimalScaleReader : null
}

export const getAvatarAnimalHornSeedField = (
  species: AvatarAnimalSpeciesId
): AvatarSeedField | null => (
  species === 'deer'
    ? AVATAR_SEED_FIELD.deerAntlerSize
    : species === 'sheep'
      ? AVATAR_SEED_FIELD.sheepHornSize
      : species === 'cow'
        ? AVATAR_SEED_FIELD.cowHornSize
        : species === 'squirrel'
          ? AVATAR_SEED_FIELD.squirrelTailSize
          : species === 'lion'
            ? AVATAR_SEED_FIELD.lionManeSize
            : species === 'hedgehog'
              ? AVATAR_SEED_FIELD.hedgehogSpineSize
              : species === 'beaver'
                ? AVATAR_SEED_FIELD.beaverToothSize
                : species === 'chick'
                ? AVATAR_SEED_FIELD.chickBeakSize
                : species === 'duck'
                  ? AVATAR_SEED_FIELD.duckBillSize
                  : species === 'penguin'
                    ? AVATAR_SEED_FIELD.penguinBeakSize
                    : species === 'owl'
                      ? AVATAR_SEED_FIELD.owlBeakSize
                      : species === 'parrot'
                        ? AVATAR_SEED_FIELD.parrotBeakSize
                        : species === 'goose'
                          ? AVATAR_SEED_FIELD.gooseBillSize
              : null
)

export const getAvatarAnimalDetailSeedField = (
  species: AvatarAnimalSpeciesId
): AvatarSeedField | null => (
  species === 'chick'
    ? AVATAR_SEED_FIELD.chickCrestSize
    : species === 'owl'
      ? AVATAR_SEED_FIELD.owlTuftSize
      : null
)

export const getAvatarAnimalScaleRange = (
  species: AvatarAnimalSpeciesId,
  part: 'detail' | 'ear' | 'head' | 'horn'
): { readonly max: number; readonly min: number } => {
  const rangeName = part === 'detail'
    ? species === 'chick'
      ? 'CHICK_CREST_SIZE_RANGE'
      : species === 'owl'
        ? 'OWL_TUFT_SIZE_RANGE'
        : ''
    : part === 'horn'
    ? species === 'deer'
      ? 'DEER_ANTLER_SIZE_RANGE'
      : species === 'cow'
        ? 'COW_HORN_SIZE_RANGE'
        : species === 'squirrel'
          ? 'SQUIRREL_TAIL_SIZE_RANGE'
          : species === 'lion'
            ? 'LION_MANE_SIZE_RANGE'
          : species === 'hedgehog'
            ? 'HEDGEHOG_SPINE_SIZE_RANGE'
            : species === 'beaver'
              ? 'BEAVER_TOOTH_SIZE_RANGE'
              : species === 'chick'
                ? 'CHICK_BEAK_SIZE_RANGE'
                : species === 'duck'
                  ? 'DUCK_BILL_SIZE_RANGE'
                  : species === 'penguin'
                    ? 'PENGUIN_BEAK_SIZE_RANGE'
                    : species === 'owl'
                      ? 'OWL_BEAK_SIZE_RANGE'
                      : species === 'parrot'
                        ? 'PARROT_BEAK_SIZE_RANGE'
                        : species === 'goose'
                          ? 'GOOSE_BILL_SIZE_RANGE'
            : 'SHEEP_HORN_SIZE_RANGE'
    : `${species.replace(/-/gu, '_').toUpperCase()}_${part.toUpperCase()}_SCALE_RANGE`
  const range = ENTITY_MODEL_EXPORTS[rangeName]
  if (range != null && typeof range === 'object' && 'min' in range && 'max' in range) {
    return range as { readonly max: number; readonly min: number }
  }
  return part === 'head' ? { max: 134, min: 76 } : part === 'detail' ? { max: 140, min: 65 } : { max: 155, min: 55 }
}

export const getAvatarAnimalDimensions = (
  species: AvatarAnimalSpeciesId,
  entityParts: readonly AvatarEntityPart[]
): AvatarAnimalDimensions => {
  const earFields = getAvatarAnimalEarSeedFields(species)
  const ear = earFields == null ? null : getScaleReader(species, 'Ear')?.(entityParts) ?? { height: 100, width: 100 }
  const head = getScaleReader(species, 'Head')?.(entityParts) ?? { height: 100, width: 100 }
  const hornReader = ENTITY_MODEL_EXPORTS[
    species === 'deer'
      ? 'getDeerAntlerSize'
      : species === 'cow'
        ? 'getCowHornSize'
        : species === 'squirrel'
          ? 'getSquirrelTailSize'
          : species === 'lion'
            ? 'getLionManeSize'
          : species === 'hedgehog'
            ? 'getHedgehogSpineSize'
            : species === 'beaver'
              ? 'getBeaverToothSize'
              : species === 'chick'
                ? 'getChickBeakSize'
                : species === 'duck'
                  ? 'getDuckBillSize'
                  : species === 'penguin'
                    ? 'getPenguinBeakSize'
                    : species === 'owl'
                      ? 'getOwlBeakSize'
                      : species === 'parrot'
                        ? 'getParrotBeakSize'
                        : species === 'goose'
                          ? 'getGooseBillSize'
            : 'getSheepHornSize'
  ]
  const hornSize = getAvatarAnimalHornSeedField(species) != null && typeof hornReader === 'function'
    ? (hornReader as (parts: readonly AvatarEntityPart[]) => number)(entityParts)
    : undefined
  const detailReader = species === 'chick'
    ? ENTITY_MODEL_EXPORTS.getChickCrestSize
    : species === 'owl'
      ? ENTITY_MODEL_EXPORTS.getOwlTuftSize
      : null
  const detailSize = getAvatarAnimalDetailSeedField(species) != null && typeof detailReader === 'function'
    ? (detailReader as (parts: readonly AvatarEntityPart[]) => number)(entityParts)
    : undefined

  return {
    ...(detailSize == null ? {} : { detailSize }),
    ...(ear == null ? {} : { earHeight: ear.height, earWidth: ear.width }),
    headHeight: head.height,
    headWidth: head.width,
    ...(hornSize == null ? {} : { hornSize })
  }
}

export const applyAvatarAnimalDimensions = (
  entityParts: readonly AvatarEntityPart[],
  species: AvatarAnimalSpeciesId,
  dimensions: Partial<AvatarAnimalDimensions>,
  hornStyle?: AvatarAnimalHornStyle,
  detailStyle?: AvatarAnimalDetailStyle
): readonly AvatarEntityPart[] => {
  let parts = entityParts
  const applyEar = getScaleFunction(species, 'Ear')
  const applyHead = getScaleFunction(species, 'Head')

  if (applyEar != null && (dimensions.earWidth != null || dimensions.earHeight != null)) {
    parts = applyEar(parts, dimensions.earWidth, dimensions.earHeight)
  }
  if (applyHead != null && (dimensions.headWidth != null || dimensions.headHeight != null)) {
    parts = applyHead(parts, dimensions.headWidth, dimensions.headHeight)
  }

  if (getAvatarAnimalHornSeedField(species) != null) {
    const applyHornStyle = ENTITY_MODEL_EXPORTS[
      species === 'deer'
        ? 'applyDeerAntlerStyle'
        : species === 'cow'
          ? 'applyCowHornStyle'
          : species === 'sheep'
            ? 'applySheepHornStyle'
            : species === 'lion'
              ? 'applyLionManeStyle'
            : species === 'beaver'
              ? 'applyBeaverToothStyle'
              : species === 'chick'
                ? 'applyChickBeakStyle'
                : species === 'duck'
                  ? 'applyDuckBillStyle'
                  : species === 'penguin'
                    ? 'applyPenguinBeakStyle'
                    : species === 'owl'
                      ? 'applyOwlBeakStyle'
                      : species === 'parrot'
                        ? 'applyParrotBeakStyle'
                        : species === 'goose'
                          ? 'applyGooseBillStyle'
              : species === 'hedgehog'
                ? 'applyHedgehogSpineStyle'
                : ''
    ]
    if (hornStyle != null && typeof applyHornStyle === 'function') {
      parts = (applyHornStyle as (
        current: readonly AvatarEntityPart[],
        style: AvatarAnimalHornStyle
      ) => readonly AvatarEntityPart[])(parts, hornStyle)
    } else if (hornStyle === 'none') {
      parts = parts.filter(part => !/^(?:antler|horn)-(?:left|right)/u.test(part.id))
    }

    const applyHornSize = ENTITY_MODEL_EXPORTS[
      species === 'deer'
        ? 'applyDeerAntlerSize'
        : species === 'cow'
          ? 'applyCowHornSize'
          : species === 'squirrel'
            ? 'applySquirrelTailSize'
            : species === 'lion'
              ? 'applyLionManeSize'
              : species === 'hedgehog'
                ? 'applyHedgehogSpineSize'
              : species === 'beaver'
                  ? 'applyBeaverToothSize'
                  : species === 'chick'
                    ? 'applyChickBeakSize'
                    : species === 'duck'
                      ? 'applyDuckBillSize'
                      : species === 'penguin'
                        ? 'applyPenguinBeakSize'
                        : species === 'owl'
                          ? 'applyOwlBeakSize'
                          : species === 'parrot'
                            ? 'applyParrotBeakSize'
                            : species === 'goose'
                              ? 'applyGooseBillSize'
                : 'applySheepHornSize'
    ]
    if (dimensions.hornSize != null && typeof applyHornSize === 'function') {
      parts = (applyHornSize as (
        current: readonly AvatarEntityPart[],
        size: number
      ) => readonly AvatarEntityPart[])(parts, dimensions.hornSize)
    }
  }

  if ((species === 'chick' || species === 'owl') && getAvatarAnimalDetailSeedField(species) != null) {
    const applyDetailStyle = species === 'chick'
      ? ENTITY_MODEL_EXPORTS.applyChickCrestStyle
      : ENTITY_MODEL_EXPORTS.applyOwlTuftStyle
    if (detailStyle != null && typeof applyDetailStyle === 'function') {
      parts = (applyDetailStyle as (
        current: readonly AvatarEntityPart[],
        style: AvatarAnimalDetailStyle
      ) => readonly AvatarEntityPart[])(parts, detailStyle)
    }
    const applyDetailSize = species === 'chick'
      ? ENTITY_MODEL_EXPORTS.applyChickCrestSize
      : ENTITY_MODEL_EXPORTS.applyOwlTuftSize
    if (dimensions.detailSize != null && typeof applyDetailSize === 'function') {
      parts = (applyDetailSize as (
        current: readonly AvatarEntityPart[],
        size: number
      ) => readonly AvatarEntityPart[])(parts, dimensions.detailSize)
    }
  }

  return parts
}

const dimensionRange = (value: number, distance: number) => ({
  max: value + distance,
  min: value - distance
})

const createAnimalBreed = (
  species: AvatarAnimalSpeciesId,
  id: string,
  label: string,
  options: AvatarAnimalBreedOptions
): AvatarAnimalBreedTemplate => {
  const fields = AVATAR_ANIMAL_SPECIES_SEED_FIELDS[species]
  const earFields = getAvatarAnimalEarSeedFields(species)
  const hornField = getAvatarAnimalHornSeedField(species)
  const detailField = getAvatarAnimalDetailSeedField(species)
  const ranges: AvatarSeedDomain['ranges'] = {
    ...(earFields == null || options.ears == null ? {} : {
      [earFields.earHeight]: dimensionRange(options.ears[1], options.dimensionJitter?.earHeight ?? 10),
      [earFields.earWidth]: dimensionRange(options.ears[0], options.dimensionJitter?.earWidth ?? 10)
    }),
    [fields.headHeight]: dimensionRange(options.head[1], options.dimensionJitter?.headHeight ?? 7),
    [fields.headWidth]: dimensionRange(options.head[0], options.dimensionJitter?.headWidth ?? 8),
    ...(options.hornSize == null || hornField == null ? {} : {
      [hornField]: dimensionRange(options.hornSize, options.dimensionJitter?.hornSize ?? 12)
    }),
    ...(options.detailSize == null || detailField == null ? {} : {
      [detailField]: dimensionRange(options.detailSize, options.dimensionJitter?.detailSize ?? 8)
    }),
    ...(options.coatPattern?.density == null ? {} : {
      [AVATAR_SEED_FIELD.coatPatternDensity]: {
        max: Math.min(options.coatPattern.density + 12, 100),
        min: Math.max(options.coatPattern.density - 12, 0)
      }
    })
  }
  const toneJitter = options.toneJitter ?? getAvatarBreedToneJitterRange(id)
  const followByDefault = [AVATAR_SEED_FIELD.palette, ...options.follow.flatMap<AvatarSeedField>(field => {
    if (field === 'density') return [AVATAR_SEED_FIELD.coatPatternDensity]
    if (field === 'detailSize') return detailField == null ? [] : [detailField]
    if (field === 'spots') return [AVATAR_SEED_FIELD.coatPatternSeed]
    if (field === 'hornSize') return hornField == null ? [] : [hornField]
    if (field === 'earHeight' || field === 'earWidth') {
      return earFields == null ? [] : [earFields[field]]
    }
    return [fields[field]]
  })]

  return {
    fixed: {
      coatPattern: {
        algorithm: 'mackerel',
        breakup: 0,
        contrast: 76,
        density: 0,
        enabled: false,
        jitter: 0,
        lightPatchLength: 96,
        lightPatchOffsetY: 0,
        lightPatchShape: 'face-mask',
        lightPatchWidth: 108,
        symmetry: 100,
        thickness: 92,
        ...options.coatPattern
      },
      ...(options.detailSize == null ? {} : { detailSize: options.detailSize }),
      ...(options.detailStyle == null ? {} : { detailStyle: options.detailStyle }),
      ...(options.ears == null ? {} : { earHeight: options.ears[1], earWidth: options.ears[0] }),
      ...(options.earStyle == null ? {} : { earStyle: options.earStyle }),
      faceStyle: {
        eyeShape: 'rounded',
        height: 44,
        mouthEnabled: false,
        width: 24,
        ...options.faceStyle
      },
      ...(options.forelockStyle == null ? {} : { forelockStyle: options.forelockStyle }),
      headHeight: options.head[1],
      ...(options.headTaper == null ? {} : { headTaper: options.headTaper }),
      headWidth: options.head[0],
      ...(options.hornSize == null ? {} : { hornSize: options.hornSize }),
      ...(options.hornStyle == null ? {} : { hornStyle: options.hornStyle }),
      paletteId: id,
      ...(options.surfaceFaceMarkings == null ? {} : { surfaceFaceMarkings: options.surfaceFaceMarkings }),
      ...(options.surfaceMarkings == null ? {} : { surfaceMarkings: options.surfaceMarkings })
    },
    followByDefault,
    id,
    label,
    ...(options.previewBackground == null ? {} : { previewBackground: options.previewBackground }),
    seedDomain: {
      coatAlgorithms: [options.coatPattern?.algorithm ?? 'mackerel'],
      lightPatchShapes: [options.coatPattern?.lightPatchShape ?? 'face-mask'],
      paletteIds: [id],
      ranges,
      toneJitter
    },
    species,
    toneJitter
  }
}

const chickBreeds = [
  createAnimalBreed('chick', 'yellow-chick', 'Yellow Chick', {
    detailSize: 93,
    detailStyle: 'fluffy',
    dimensionJitter: { detailSize: 5, headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 44, height: 34, leftEyeRotation: -6, rightEyeRotation: 6, width: 21 },
    follow: ['headWidth', 'headHeight', 'hornSize', 'detailSize'],
    head: [100, 101],
    hornSize: 92,
    hornStyle: 'short',
    surfaceFaceMarkings: { beakColor: '#e99437', color: '#f8dd72', combColor: '#d95b48', height: 82, nostrilColor: '#6d4222', shape: 'ellipse', width: 66, y: 34 },
    toneJitter: { min: -10, max: 8 }
  }),
  createAnimalBreed('chick', 'silkie-chick', 'Silkie Chick', {
    detailSize: 116,
    detailStyle: 'fluffy',
    dimensionJitter: { detailSize: 5, headHeight: 3, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 41, height: 39, leftEyeRotation: -4, rightEyeRotation: 4, width: 22 },
    follow: ['headHeight', 'headWidth', 'hornSize', 'detailSize'],
    head: [106, 109],
    hornSize: 84,
    hornStyle: 'short',
    previewBackground: '#718a87',
    surfaceFaceMarkings: { beakColor: '#b99878', color: '#fff8e9', combColor: '#c96d66', height: 78, nostrilColor: '#5f4639', shape: 'rounded', width: 63, y: 34 },
    toneJitter: { min: -6, max: 4 }
  }),
  createAnimalBreed('chick', 'barred-rock-chick', 'Barred Rock Chick', {
    detailSize: 91,
    detailStyle: 'comb',
    dimensionJitter: { detailSize: 4, headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 47, height: 32, leftEyeRotation: -7, rightEyeRotation: 7, width: 20 },
    follow: ['headWidth', 'hornSize', 'detailSize'],
    head: [107, 103],
    hornSize: 96,
    hornStyle: 'pointed',
    previewBackground: '#bfaa78',
    surfaceFaceMarkings: { beakColor: '#c69a4e', color: '#d6d4cc', combColor: '#c54f45', height: 76, nostrilColor: '#4a3525', shape: 'ellipse', width: 61, y: 35 },
    toneJitter: { min: -9, max: 7 }
  }),
  createAnimalBreed('chick', 'buff-orpington-chick', 'Buff Orpington Chick', {
    detailSize: 104,
    detailStyle: 'fluffy',
    dimensionJitter: { detailSize: 5, headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 42, height: 37, leftEyeRotation: -5, rightEyeRotation: 5, width: 22 },
    follow: ['headHeight', 'headWidth', 'hornSize', 'detailSize'],
    head: [112, 108],
    hornSize: 90,
    hornStyle: 'short',
    surfaceFaceMarkings: { beakColor: '#c7803f', color: '#f5d8a6', combColor: '#ce6653', height: 84, nostrilColor: '#5a3823', shape: 'rounded', width: 67, y: 35 },
    toneJitter: { min: -13, max: 10 }
  })
] as const

const duckBreeds = [
  createAnimalBreed('duck', 'mallard-duck', 'Mallard Duck', {
    dimensionJitter: { headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 45, height: 35, leftEyeRotation: -6, rightEyeRotation: 6, width: 21 },
    follow: ['headWidth', 'headHeight', 'hornSize'],
    head: [106, 99],
    hornSize: 101,
    hornStyle: 'broad',
    previewBackground: '#b9c2a1',
    surfaceFaceMarkings: { billColor: '#d8a43e', color: '#e8dfc3', height: 86, nostrilColor: '#493720', shape: 'rounded', width: 79, y: 35 },
    toneJitter: { min: -12, max: 10 }
  }),
  createAnimalBreed('duck', 'pekin-duck', 'Pekin Duck', {
    dimensionJitter: { headHeight: 3, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 43, height: 39, leftEyeRotation: -4, rightEyeRotation: 4, width: 22 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [108, 104],
    hornSize: 96,
    hornStyle: 'flat',
    previewBackground: '#79949a',
    surfaceFaceMarkings: { billColor: '#e6a143', color: '#fff7e7', height: 82, nostrilColor: '#6b4828', shape: 'ellipse', width: 73, y: 35 },
    toneJitter: { min: -6, max: 4 }
  }),
  createAnimalBreed('duck', 'muscovy-duck', 'Muscovy Duck', {
    dimensionJitter: { headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 48, height: 34, leftEyeRotation: -7, rightEyeRotation: 7, width: 20 },
    follow: ['headWidth', 'hornSize'],
    head: [112, 102],
    hornSize: 105,
    hornStyle: 'broad',
    previewBackground: '#9bb4aa',
    surfaceFaceMarkings: { billColor: '#d5a27c', color: '#b44f4d', height: 91, nostrilColor: '#4b2c29', shape: 'face-mask', width: 76, y: 33 },
    toneJitter: { min: -9, max: 8 }
  }),
  createAnimalBreed('duck', 'yellow-duckling', 'Yellow Duckling', {
    dimensionJitter: { headHeight: 4, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 41, height: 43, leftEyeRotation: -5, rightEyeRotation: 5, width: 23 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [98, 101],
    hornSize: 87,
    hornStyle: 'flat',
    surfaceFaceMarkings: { billColor: '#e89b3c', color: '#ffe47f', height: 75, nostrilColor: '#724521', shape: 'ellipse', width: 68, y: 34 },
    toneJitter: { min: -10, max: 8 }
  })
] as const

const penguinBreeds = [
  createAnimalBreed('penguin', 'emperor-penguin', 'Emperor Penguin', {
    dimensionJitter: { headHeight: 4, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 43, height: 39, leftEyeRotation: -5, rightEyeRotation: 5, width: 21 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [102, 111], hornSize: 101, hornStyle: 'tapered',
    surfaceFaceMarkings: { beakColor: '#d99a42', color: '#f4e9cb', height: 121, nostrilColor: '#443224', shape: 'face-mask', width: 105, y: 28 },
    toneJitter: { min: -7, max: 5 }
  }),
  createAnimalBreed('penguin', 'adelie-penguin', 'Adelie Penguin', {
    dimensionJitter: { headHeight: 3, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 46, height: 34, leftEyeRotation: -6, rightEyeRotation: 6, width: 20 },
    follow: ['headWidth', 'hornSize'],
    head: [105, 102], hornSize: 91, hornStyle: 'short',
    previewBackground: '#8fa8b1',
    surfaceFaceMarkings: { beakColor: '#4a3c34', color: '#fff9ed', height: 102, nostrilColor: '#191716', shape: 'ellipse', width: 92, y: 30 },
    toneJitter: { min: -7, max: 5 }
  }),
  createAnimalBreed('penguin', 'gentoo-penguin', 'Gentoo Penguin', {
    dimensionJitter: { headHeight: 4, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 49, height: 33, leftEyeRotation: -7, rightEyeRotation: 7, width: 20 },
    follow: ['headWidth', 'headHeight', 'hornSize'],
    head: [108, 105], hornSize: 106, hornStyle: 'tapered',
    previewBackground: '#839ba4',
    surfaceFaceMarkings: { beakColor: '#df8e38', color: '#f6f1e8', height: 111, nostrilColor: '#4b3123', shape: 'rounded', width: 101, y: 28 },
    toneJitter: { min: -8, max: 6 }
  }),
  createAnimalBreed('penguin', 'penguin-chick', 'Penguin Chick', {
    dimensionJitter: { headHeight: 4, headWidth: 5, hornSize: 4 },
    faceStyle: { gap: 40, height: 46, leftEyeRotation: -4, rightEyeRotation: 4, width: 23 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [96, 105], hornSize: 82, hornStyle: 'short',
    surfaceFaceMarkings: { beakColor: '#877262', color: '#dedbd3', height: 91, nostrilColor: '#3b302a', shape: 'ellipse', width: 86, y: 31 },
    toneJitter: { min: -9, max: 7 }
  })
] as const

const owlBreeds = [
  createAnimalBreed('owl', 'barn-owl', 'Barn Owl', {
    detailSize: 92, detailStyle: 'none',
    dimensionJitter: { detailSize: 0, headHeight: 4, headWidth: 5, hornSize: 4 },
    faceStyle: { gap: 53, height: 46, leftEyeRotation: -4, rightEyeRotation: 4, width: 27 },
    follow: ['headWidth', 'headHeight', 'hornSize'],
    head: [105, 110], hornSize: 89, hornStyle: 'short',
    surfaceFaceMarkings: { beakColor: '#b99159', color: '#f3e5c8', eyeRingColor: '#8d745d', height: 145, nostrilColor: '#403127', shape: 'face-mask', width: 132, y: 20 },
    toneJitter: { min: -12, max: 10 }
  }),
  createAnimalBreed('owl', 'snowy-owl', 'Snowy Owl', {
    detailSize: 88, detailStyle: 'none',
    dimensionJitter: { detailSize: 0, headHeight: 3, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 55, height: 43, leftEyeRotation: -3, rightEyeRotation: 3, width: 27 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [109, 106], hornSize: 86, hornStyle: 'short',
    previewBackground: '#738c98',
    surfaceFaceMarkings: { beakColor: '#4a4643', color: '#fff9ec', eyeRingColor: '#d7d3ca', height: 139, nostrilColor: '#1e1d1c', shape: 'rounded', width: 135, y: 20 },
    toneJitter: { min: -6, max: 4 }
  }),
  createAnimalBreed('owl', 'great-horned-owl', 'Great Horned Owl', {
    detailSize: 112, detailStyle: 'paired',
    dimensionJitter: { detailSize: 5, headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 57, height: 42, leftEyeRotation: -7, rightEyeRotation: 7, width: 28 },
    follow: ['headWidth', 'headHeight', 'hornSize', 'detailSize'],
    head: [112, 108], hornSize: 103, hornStyle: 'hooked',
    surfaceFaceMarkings: { beakColor: '#8d7048', color: '#d3b98f', eyeRingColor: '#5b4c3b', height: 146, nostrilColor: '#30251d', shape: 'face-mask', tuftColor: '#6a4b35', width: 139, y: 18 },
    toneJitter: { min: -15, max: 12 }
  }),
  createAnimalBreed('owl', 'little-owl', 'Little Owl', {
    detailSize: 82, detailStyle: 'none',
    dimensionJitter: { detailSize: 0, headHeight: 4, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 44, height: 48, leftEyeRotation: -5, rightEyeRotation: 5, width: 25 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [94, 97], hornSize: 82, hornStyle: 'short',
    surfaceFaceMarkings: { beakColor: '#a37b42', color: '#e3d0ae', eyeRingColor: '#665443', height: 116, nostrilColor: '#34271d', shape: 'ellipse', width: 107, y: 24 },
    toneJitter: { min: -13, max: 11 }
  })
] as const

const parrotBreeds = [
  createAnimalBreed('parrot', 'scarlet-macaw', 'Scarlet Macaw', {
    dimensionJitter: { headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 47, height: 38, leftEyeRotation: -5, rightEyeRotation: 5, width: 23 },
    follow: ['headWidth', 'headHeight', 'hornSize'],
    head: [106, 108], hornSize: 108, hornStyle: 'macaw',
    previewBackground: '#5c847b',
    surfaceFaceMarkings: { beakColor: '#e5d9c4', color: '#f6e9d5', height: 122, nostrilColor: '#4a4038', shape: 'face-mask', width: 108, y: 28 },
    toneJitter: { min: -14, max: 11 }
  }),
  createAnimalBreed('parrot', 'blue-yellow-macaw', 'Blue-and-yellow Macaw', {
    dimensionJitter: { headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 48, height: 37, leftEyeRotation: -6, rightEyeRotation: 6, width: 23 },
    follow: ['headWidth', 'hornSize'],
    head: [108, 106], hornSize: 111, hornStyle: 'macaw',
    surfaceFaceMarkings: { beakColor: '#322f2d', color: '#f2eadb', height: 124, nostrilColor: '#171615', shape: 'rounded', width: 111, y: 27 },
    toneJitter: { min: -12, max: 10 }
  }),
  createAnimalBreed('parrot', 'african-grey-parrot', 'African Grey Parrot', {
    dimensionJitter: { headHeight: 4, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 45, height: 42, leftEyeRotation: -4, rightEyeRotation: 4, width: 22 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [102, 104], hornSize: 96, hornStyle: 'hooked',
    previewBackground: '#9da37e',
    surfaceFaceMarkings: { beakColor: '#343436', color: '#e0ddd4', height: 110, nostrilColor: '#161617', shape: 'ellipse', width: 100, y: 30 },
    toneJitter: { min: -10, max: 9 }
  }),
  createAnimalBreed('parrot', 'cockatiel', 'Cockatiel', {
    dimensionJitter: { headHeight: 4, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 44, height: 45, leftEyeRotation: -4, rightEyeRotation: 4, width: 22 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [96, 105], hornSize: 88, hornStyle: 'hooked',
    previewBackground: '#758f93',
    surfaceFaceMarkings: { beakColor: '#c5a36f', color: '#efd769', height: 101, nostrilColor: '#5a4630', shape: 'rounded', width: 92, y: 31 },
    toneJitter: { min: -9, max: 8 }
  })
] as const

const gooseBreeds = [
  createAnimalBreed('goose', 'greylag-goose', 'Greylag Goose', {
    dimensionJitter: { headHeight: 4, headWidth: 5, hornSize: 5 },
    faceStyle: { gap: 46, height: 37, leftEyeRotation: -5, rightEyeRotation: 5, width: 22 },
    follow: ['headWidth', 'headHeight', 'hornSize'],
    head: [105, 110], hornSize: 101, hornStyle: 'broad',
    surfaceFaceMarkings: { billColor: '#d88d43', color: '#d8c6aa', height: 112, nostrilColor: '#56351f', shape: 'rounded', width: 101, y: 30 },
    toneJitter: { min: -13, max: 11 }
  }),
  createAnimalBreed('goose', 'canada-goose', 'Canada Goose', {
    dimensionJitter: { headHeight: 4, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 49, height: 34, leftEyeRotation: -6, rightEyeRotation: 6, width: 20 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [103, 114], hornSize: 105, hornStyle: 'broad',
    previewBackground: '#879884',
    surfaceFaceMarkings: { billColor: '#262624', color: '#f2ece0', height: 99, nostrilColor: '#0f0f0e', shape: 'face-mask', width: 91, y: 33 },
    toneJitter: { min: -8, max: 7 }
  }),
  createAnimalBreed('goose', 'snow-goose', 'Snow Goose', {
    dimensionJitter: { headHeight: 3, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 45, height: 40, leftEyeRotation: -4, rightEyeRotation: 4, width: 22 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [108, 108], hornSize: 96, hornStyle: 'short',
    previewBackground: '#78909a',
    surfaceFaceMarkings: { billColor: '#d97f70', color: '#fff8ec', height: 106, nostrilColor: '#593634', shape: 'ellipse', width: 97, y: 31 },
    toneJitter: { min: -6, max: 4 }
  }),
  createAnimalBreed('goose', 'white-gosling', 'White Gosling', {
    dimensionJitter: { headHeight: 4, headWidth: 4, hornSize: 4 },
    faceStyle: { gap: 40, height: 45, leftEyeRotation: -4, rightEyeRotation: 4, width: 23 },
    follow: ['headHeight', 'headWidth', 'hornSize'],
    head: [96, 103], hornSize: 86, hornStyle: 'short',
    surfaceFaceMarkings: { billColor: '#e5a04d', color: '#fff3cf', height: 86, nostrilColor: '#6d4829', shape: 'ellipse', width: 78, y: 33 },
    toneJitter: { min: -7, max: 5 }
  })
] as const

const sealBreeds = [
  createAnimalBreed('seal', 'harbor-seal', 'Harbor Seal', {
    dimensionJitter: { earHeight: 3, earWidth: 3, headHeight: 4, headWidth: 5 },
    ears: [84, 80], faceStyle: { gap: 51, height: 48, noseHeight: 15, noseWidth: 22, noseY: 33, width: 25 }, follow: ['headWidth', 'headHeight'], head: [112, 101],
    surfaceFaceMarkings: { color: '#e6dfd2', height: 102, shape: 'ellipse', width: 115, y: 32 }
  }),
  createAnimalBreed('seal', 'harp-seal', 'Harp Seal', {
    dimensionJitter: { earHeight: 3, earWidth: 3, headHeight: 4, headWidth: 5 },
    ears: [81, 77], faceStyle: { gap: 47, height: 50, noseHeight: 13, noseWidth: 19, noseY: 33, width: 25 }, follow: ['headHeight', 'headWidth'], head: [107, 105], previewBackground: '#718795',
    surfaceFaceMarkings: { color: '#c4b9a9', height: 98, shape: 'rounded', width: 110, y: 34 }
  }),
  createAnimalBreed('seal', 'gray-seal', 'Gray Seal', {
    dimensionJitter: { earHeight: 3, earWidth: 3, headHeight: 4, headWidth: 5 },
    ears: [88, 83], faceStyle: { gap: 53, height: 43, noseHeight: 16, noseWidth: 24, noseY: 35, width: 23 }, follow: ['headWidth', 'headHeight'], head: [120, 96], previewBackground: '#c3b5a0',
    surfaceFaceMarkings: { color: '#aeaaa0', height: 111, shape: 'face-mask', width: 122, y: 35 }
  }),
  createAnimalBreed('seal', 'seal-pup', 'Seal Pup', {
    dimensionJitter: { earHeight: 3, earWidth: 3, headHeight: 3, headWidth: 4 },
    ears: [79, 78], faceStyle: { gap: 43, height: 55, noseHeight: 12, noseWidth: 16, noseY: 31, width: 27 }, follow: ['headHeight', 'headWidth'], head: [98, 109], previewBackground: '#708698',
    surfaceFaceMarkings: { color: '#f8f1e5', height: 88, shape: 'ellipse', width: 94, y: 31 }
  })
] as const

const beaverBreeds = [
  createAnimalBreed('beaver', 'north-american-beaver', 'North American Beaver', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 4, headWidth: 5, hornSize: 6 },
    ears: [88, 84], faceStyle: { gap: 48, height: 47, noseHeight: 15, noseWidth: 22, noseY: 35 }, follow: ['headWidth', 'headHeight', 'hornSize'], head: [116, 103], hornSize: 104, hornStyle: 'paired',
    surfaceFaceMarkings: { color: '#d5b790', height: 105, shape: 'face-mask', width: 115, y: 34 }
  }),
  createAnimalBreed('beaver', 'eurasian-beaver', 'Eurasian Beaver', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 4, headWidth: 5, hornSize: 6 },
    ears: [94, 89], faceStyle: { gap: 46, height: 49, noseHeight: 14, noseWidth: 20, noseY: 34 }, follow: ['earWidth', 'headHeight', 'hornSize'], head: [109, 108], hornSize: 98, hornStyle: 'paired',
    surfaceFaceMarkings: { color: '#ead3b1', height: 108, shape: 'rounded', width: 111, y: 34 }
  }),
  createAnimalBreed('beaver', 'dark-beaver', 'Dark Beaver', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 4, headWidth: 5, hornSize: 6 },
    ears: [83, 81], faceStyle: { gap: 51, height: 43, noseHeight: 16, noseWidth: 23, noseY: 36 }, follow: ['headWidth', 'hornSize'], head: [122, 100], hornSize: 110, hornStyle: 'paired', previewBackground: '#bca983',
    surfaceFaceMarkings: { color: '#b29a7c', height: 102, shape: 'ellipse', width: 119, y: 35 }
  }),
  createAnimalBreed('beaver', 'beaver-kit', 'Beaver Kit', {
    dimensionJitter: { earHeight: 5, earWidth: 5, headHeight: 3, headWidth: 4, hornSize: 5 },
    ears: [105, 99], faceStyle: { gap: 41, height: 54, noseHeight: 11, noseWidth: 15, noseY: 32 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [95, 101], hornSize: 83, hornStyle: 'paired',
    surfaceFaceMarkings: { color: '#f1dfc2', height: 92, shape: 'ellipse', width: 96, y: 32 }
  })
] as const

const guineaPigBreeds = [
  createAnimalBreed('guinea-pig', 'american-guinea-pig', 'American Guinea Pig', {
    dimensionJitter: { earHeight: 7, earWidth: 7, headHeight: 4, headWidth: 5 },
    ears: [102, 94], faceStyle: { gap: 43, height: 51, noseHeight: 11, noseWidth: 14, noseY: 32 }, follow: ['earWidth', 'headWidth'], head: [113, 105],
    surfaceFaceMarkings: { color: '#f4e3c7', height: 103, innerEarColor: '#c88d85', shape: 'ellipse', width: 108, y: 34 }
  }),
  createAnimalBreed('guinea-pig', 'abyssinian-guinea-pig', 'Abyssinian Guinea Pig', {
    dimensionJitter: { earHeight: 7, earWidth: 7, headHeight: 4, headWidth: 5 },
    ears: [110, 101], faceStyle: { gap: 45, height: 47, noseHeight: 12, noseWidth: 15, noseY: 33 }, follow: ['earHeight', 'headHeight'], head: [119, 112],
    surfaceFaceMarkings: { color: '#ecd2af', height: 112, innerEarColor: '#ac7066', shape: 'face-mask', width: 111, y: 33 }
  }),
  createAnimalBreed('guinea-pig', 'teddy-guinea-pig', 'Teddy Guinea Pig', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 4, headWidth: 5 },
    ears: [91, 88], faceStyle: { gap: 41, height: 53, noseHeight: 11, noseWidth: 14, noseY: 32 }, follow: ['earWidth', 'headWidth'], head: [124, 116], previewBackground: '#788a7f',
    surfaceFaceMarkings: { color: '#fff1d9', height: 113, innerEarColor: '#986766', shape: 'rounded', width: 118, y: 34 }
  }),
  createAnimalBreed('guinea-pig', 'guinea-pig-pup', 'Guinea Pig Pup', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 3, headWidth: 4 },
    ears: [116, 108], faceStyle: { gap: 39, height: 56, noseHeight: 9, noseWidth: 12, noseY: 30 }, follow: ['earHeight', 'headHeight'], head: [94, 99],
    surfaceFaceMarkings: { color: '#eedccc', height: 91, innerEarColor: '#b27e75', shape: 'ellipse', width: 93, y: 32 }
  })
] as const

const chinchillaBreeds = [
  createAnimalBreed('chinchilla', 'gray-chinchilla', 'Gray Chinchilla', {
    dimensionJitter: { earHeight: 7, earWidth: 7, headHeight: 4, headWidth: 5 },
    ears: [116, 121], faceStyle: { gap: 43, height: 50, noseHeight: 11, noseWidth: 14, noseY: 32 }, follow: ['earWidth', 'headWidth'], head: [108, 103],
    surfaceFaceMarkings: { color: '#e7e1d9', height: 108, innerEarColor: '#bd858e', shape: 'ellipse', width: 113, y: 36 }
  }),
  createAnimalBreed('chinchilla', 'beige-chinchilla', 'Beige Chinchilla', {
    dimensionJitter: { earHeight: 7, earWidth: 7, headHeight: 4, headWidth: 5 },
    ears: [110, 116], faceStyle: { gap: 45, height: 47, noseHeight: 12, noseWidth: 15, noseY: 33 }, follow: ['earHeight', 'headHeight'], head: [112, 107],
    surfaceFaceMarkings: { color: '#f8ead8', height: 110, innerEarColor: '#805963', shape: 'rounded', width: 115, y: 35 }
  }),
  createAnimalBreed('chinchilla', 'white-chinchilla', 'White Chinchilla', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 3, headWidth: 4 },
    ears: [119, 125], faceStyle: { gap: 42, height: 52, noseHeight: 10, noseWidth: 13, noseY: 31 }, follow: ['earWidth', 'headHeight'], head: [101, 102], previewBackground: '#71868f',
    surfaceFaceMarkings: { color: '#fffaf0', height: 101, innerEarColor: '#b97986', shape: 'ellipse', width: 106, y: 35 }
  }),
  createAnimalBreed('chinchilla', 'black-velvet-chinchilla', 'Black Velvet Chinchilla', {
    dimensionJitter: { earHeight: 7, earWidth: 7, headHeight: 4, headWidth: 5 },
    ears: [112, 118], faceStyle: { gap: 47, height: 45, noseHeight: 12, noseWidth: 15, noseY: 33 }, follow: ['earHeight', 'headWidth'], head: [116, 108], previewBackground: '#c7b899',
    surfaceFaceMarkings: { color: '#bdb3a7', height: 113, innerEarColor: '#a17078', shape: 'face-mask', width: 119, y: 36 }
  })
] as const

const ferretBreeds = [
  createAnimalBreed('ferret', 'sable-ferret', 'Sable Ferret', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 5, headWidth: 4 },
    ears: [90, 92],
    faceStyle: { gap: 43, height: 49, noseHeight: 12, noseWidth: 15, noseY: 34, width: 24 },
    follow: ['earWidth', 'headHeight'],
    head: [96, 119],
    previewBackground: '#87927e',
    surfaceFaceMarkings: { color: '#eee2cd', height: 105, innerEarColor: '#d39a93', maskColor: '#574536', shape: 'rounded-triangle', width: 98, y: 38 }
  }),
  createAnimalBreed('ferret', 'albino-ferret', 'Albino Ferret', {
    dimensionJitter: { earHeight: 5, earWidth: 5, headHeight: 4, headWidth: 4 },
    ears: [105, 101],
    faceStyle: { gap: 40, height: 53, noseHeight: 10, noseWidth: 13, noseY: 33, width: 25 },
    follow: ['earHeight', 'headWidth'],
    head: [94, 110],
    previewBackground: '#748a88',
    surfaceFaceMarkings: { color: '#fff6e8', height: 98, innerEarColor: '#c88b91', maskColor: '#d5b9a9', shape: 'ellipse', width: 91, y: 36 }
  }),
  createAnimalBreed('ferret', 'cinnamon-ferret', 'Cinnamon Ferret', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 5, headWidth: 5 },
    ears: [96, 98],
    faceStyle: { gap: 44, height: 47, noseHeight: 12, noseWidth: 16, noseY: 35, width: 23 },
    follow: ['earWidth', 'headHeight'],
    head: [101, 115],
    surfaceFaceMarkings: { color: '#f2e1cc', height: 105, innerEarColor: '#e0a098', maskColor: '#86573d', shape: 'rounded', width: 99, y: 38 }
  }),
  createAnimalBreed('ferret', 'panda-ferret', 'Panda Ferret', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 5, headWidth: 4 },
    ears: [88, 91],
    faceStyle: { gap: 45, height: 46, noseHeight: 12, noseWidth: 15, noseY: 35, width: 23 },
    follow: ['earHeight', 'headWidth'],
    head: [103, 121],
    previewBackground: '#b0a88e',
    surfaceFaceMarkings: { color: '#f2ece2', height: 108, innerEarColor: '#8f666d', maskColor: '#423c39', shape: 'face-mask', width: 101, y: 38 }
  })
] as const

const monkeyBreeds = [
  createAnimalBreed('monkey', 'macaque', 'Macaque', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 5, headWidth: 5 },
    ears: [103, 105],
    faceStyle: { gap: 48, height: 40, noseEnabled: false, width: 22 },
    follow: ['earWidth', 'headHeight'],
    head: [104, 109],
    surfaceFaceMarkings: { color: '#e5c8ad', height: 139, innerEarColor: '#bd8171', nostrilColor: '#483028', shape: 'face-mask', width: 139, y: 19 }
  }),
  createAnimalBreed('monkey', 'capuchin-monkey', 'Capuchin Monkey', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 5, headWidth: 5 },
    ears: [94, 99],
    faceStyle: { gap: 45, height: 46, noseEnabled: false, width: 23 },
    follow: ['earHeight', 'headWidth'],
    head: [98, 114],
    previewBackground: '#8d957a',
    surfaceFaceMarkings: { color: '#ead5b6', height: 145, innerEarColor: '#a87267', nostrilColor: '#3c2923', shape: 'rounded-triangle', width: 132, y: 17 }
  }),
  createAnimalBreed('monkey', 'golden-monkey', 'Golden Monkey', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 4, headWidth: 5 },
    ears: [89, 94],
    faceStyle: { gap: 43, height: 49, noseEnabled: false, width: 24 },
    follow: ['earWidth', 'headHeight'],
    head: [101, 107],
    previewBackground: '#778a87',
    surfaceFaceMarkings: { color: '#cfdae0', height: 133, innerEarColor: '#e0a096', nostrilColor: '#41302a', shape: 'rounded', width: 125, y: 20 }
  }),
  createAnimalBreed('monkey', 'baby-monkey', 'Baby Monkey', {
    dimensionJitter: { earHeight: 5, earWidth: 5, headHeight: 3, headWidth: 4 },
    ears: [116, 112],
    faceStyle: { gap: 39, height: 54, noseEnabled: false, width: 26 },
    follow: ['earHeight', 'headWidth'],
    head: [92, 101],
    surfaceFaceMarkings: { color: '#efd5bb', height: 121, innerEarColor: '#bd8479', nostrilColor: '#4b342c', shape: 'ellipse', width: 114, y: 21 }
  })
] as const

const foxBreeds = [
  createAnimalBreed('fox', 'red-fox', 'Red Fox', {
    ears: [100, 100],
    earStyle: 'pointed',
    faceStyle: {
      gap: 54,
      height: 37,
      noseHeight: 17,
      noseWidth: 24,
      noseY: 39,
      width: 21
    },
    follow: ['earWidth', 'headWidth'],
    head: [100, 100],
    headTaper: 52,
    previewBackground: '#173d35'
  }),
  createAnimalBreed('fox', 'arctic-fox', 'Arctic Fox', {
    ears: [77, 79],
    earStyle: 'rounded',
    faceStyle: { gap: 43, height: 50, noseWidth: 13 },
    follow: ['earHeight', 'headWidth'],
    head: [113, 91],
    headTaper: 23,
    previewBackground: '#728b9c',
    surfaceMarkings: {
      cheekColor: '#fffdf7',
      cheekScale: 109,
      innerEarColor: '#ddbab2',
      innerEarScale: 82
    }
  }),
  createAnimalBreed('fox', 'silver-fox', 'Silver Fox', {
    ears: [108, 114],
    earStyle: 'pointed',
    faceStyle: { gap: 47, height: 47, noseWidth: 15 },
    follow: ['earHeight', 'headHeight'],
    head: [105, 108],
    headTaper: 59,
    previewBackground: '#aaafb1',
    surfaceMarkings: {
      cheekColor: '#eceae4',
      cheekScale: 97,
      innerEarColor: '#c8aaa2',
      innerEarScale: 89
    }
  }),
  createAnimalBreed('fox', 'fennec-fox', 'Fennec Fox', {
    dimensionJitter: { earHeight: 7, earWidth: 7, headHeight: 4, headWidth: 5 },
    ears: [157, 173],
    earStyle: 'fennec',
    faceStyle: { gap: 41, height: 51, noseWidth: 12 },
    follow: ['earWidth', 'earHeight', 'headWidth'],
    head: [91, 95],
    headTaper: 43,
    previewBackground: '#827456',
    surfaceMarkings: {
      cheekColor: '#fff3d9',
      cheekScale: 106,
      innerEarColor: '#b78170',
      innerEarScale: 113
    }
  })
] as const

const hamsterBreeds = [
  createAnimalBreed('hamster', 'syrian-hamster', 'Syrian Hamster', {
    ears: [112, 104], faceStyle: { gap: 42, height: 46, noseWidth: 14 }, follow: ['earWidth', 'headWidth'], head: [112, 105],
    surfaceFaceMarkings: { color: '#f7e4c5', height: 103, innerEarColor: '#e7a295', shape: 'ellipse', width: 108, y: 7 }
  }),
  createAnimalBreed('hamster', 'pudding-hamster', 'Pudding Hamster', {
    ears: [88, 86], faceStyle: { gap: 39, height: 48, noseWidth: 13 }, follow: ['earHeight', 'headHeight'], head: [121, 112],
    surfaceFaceMarkings: { color: '#fff0d1', height: 109, innerEarColor: '#bc8173', shape: 'rounded', width: 116, y: 7 }
  }),
  createAnimalBreed('hamster', 'silver-fox-hamster', 'Silver Fox Hamster', {
    ears: [98, 108], faceStyle: { gap: 43, height: 42, noseWidth: 12 }, follow: ['earWidth', 'headWidth'], head: [104, 97], previewBackground: '#667983',
    surfaceFaceMarkings: { color: '#fffdf8', height: 98, innerEarColor: '#996969', shape: 'ellipse', width: 105, y: 6 }
  }),
  createAnimalBreed('hamster', 'sapphire-hamster', 'Sapphire Hamster', {
    ears: [82, 94], faceStyle: { gap: 40, height: 47, noseWidth: 13 }, follow: ['earHeight', 'headHeight'], head: [108, 101],
    surfaceFaceMarkings: { color: '#ded9db', height: 101, innerEarColor: '#c69498', shape: 'ellipse', width: 108, y: 7 }
  })
] as const

const capybaraBreeds = [
  createAnimalBreed('capybara', 'capybara', 'Capybara', {
    ears: [91, 84], faceStyle: { gap: 51, height: 38, noseWidth: 27 }, follow: ['headWidth', 'headHeight'], head: [118, 96],
    surfaceFaceMarkings: { color: '#d4b291', height: 126, shape: 'rounded', width: 143, y: 6 }
  }),
  createAnimalBreed('capybara', 'sandy-capybara', 'Sandy Capybara', {
    ears: [84, 79], faceStyle: { gap: 48, height: 41, noseWidth: 25 }, follow: ['earWidth', 'headWidth'], head: [111, 101],
    surfaceFaceMarkings: { color: '#ecd8ba', height: 120, shape: 'ellipse', width: 136, y: 5 }
  }),
  createAnimalBreed('capybara', 'dark-capybara', 'Dark Capybara', {
    ears: [96, 86], faceStyle: { gap: 53, height: 37, noseWidth: 29 }, follow: ['earHeight', 'headWidth'], head: [125, 103], previewBackground: '#d7b785',
    surfaceFaceMarkings: { color: '#92735d', height: 129, shape: 'face-mask', width: 150, y: 7 }
  }),
  createAnimalBreed('capybara', 'capybara-pup', 'Capybara Pup', {
    ears: [109, 103], faceStyle: { gap: 43, height: 48, noseWidth: 20 }, follow: ['earWidth', 'headHeight'], head: [101, 111],
    surfaceFaceMarkings: { color: '#f1d7b0', height: 111, shape: 'rounded', width: 123, y: 6 }
  })
] as const

const otterBreeds = [
  createAnimalBreed('otter', 'sea-otter', 'Sea Otter', {
    ears: [75, 74], faceStyle: { gap: 48, height: 45, noseWidth: 21 }, follow: ['headWidth', 'headHeight'], head: [123, 106],
    surfaceFaceMarkings: { color: '#ddd0be', height: 136, shape: 'face-mask', width: 154, y: 27 }
  }),
  createAnimalBreed('otter', 'river-otter', 'River Otter', {
    ears: [87, 86], faceStyle: { gap: 45, height: 42, noseWidth: 18 }, follow: ['earWidth', 'headWidth'], head: [112, 95],
    surfaceFaceMarkings: { color: '#e5d0ad', height: 110, shape: 'ellipse', width: 138, y: 36 }
  }),
  createAnimalBreed('otter', 'asian-small-clawed-otter', 'Asian Small-clawed Otter', {
    ears: [95, 91], faceStyle: { gap: 42, height: 49, noseWidth: 16 }, follow: ['earHeight', 'headHeight'], head: [101, 103],
    surfaceFaceMarkings: { color: '#f0e0c4', height: 104, shape: 'rounded', width: 128, y: 34 }
  })
] as const

const pigBreeds = [
  createAnimalBreed('pig', 'pink-pig', 'Pink Pig', {
    ears: [118, 108], faceStyle: { gap: 49, height: 44, noseEnabled: false }, follow: ['earWidth', 'headWidth'], head: [112, 105]
  }),
  createAnimalBreed('pig', 'black-pig', 'Black Pig', {
    ears: [105, 120], faceStyle: { gap: 47, height: 46, noseEnabled: false }, follow: ['earHeight', 'headHeight'], head: [116, 110], previewBackground: '#d8bf98'
  }),
  createAnimalBreed('pig', 'spotted-pig', 'Spotted Pig', {
    coatPattern: { algorithm: 'spotted', density: 42, enabled: true, jitter: 18 }, ears: [113, 111], faceStyle: { gap: 48, height: 45, noseEnabled: false }, follow: ['headWidth', 'density', 'spots'], head: [110, 102]
  }),
  createAnimalBreed('pig', 'wild-boar', 'Wild Boar', {
    ears: [91, 117], faceStyle: { gap: 44, height: 39, noseEnabled: false }, follow: ['earHeight', 'headWidth'], head: [105, 114]
  })
] as const

const deerBreeds = [
  createAnimalBreed('deer', 'sika-deer', 'Sika Deer', {
    coatPattern: { algorithm: 'spotted', density: 38, enabled: true, jitter: 10 }, ears: [102, 111], faceStyle: { gap: 49, height: 49, noseWidth: 17 }, follow: ['headWidth', 'hornSize', 'density'], head: [106, 110], hornSize: 105, hornStyle: 'forked',
    surfaceFaceMarkings: { color: '#f5e7cf', height: 126, shape: 'face-mask', width: 106, y: 37 }
  }),
  createAnimalBreed('deer', 'reindeer', 'Reindeer', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [94, 105], faceStyle: { gap: 50, height: 44, noseWidth: 22 }, follow: ['headHeight', 'hornSize'], head: [118, 111], hornSize: 132, hornStyle: 'reindeer',
    surfaceFaceMarkings: { color: '#e2d5c1', height: 132, shape: 'ellipse', width: 124, y: 38 }
  }),
  createAnimalBreed('deer', 'white-deer', 'White Deer', {
    ears: [111, 116], faceStyle: { gap: 47, height: 51, noseWidth: 15 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [103, 108], hornSize: 96, hornStyle: 'spike', previewBackground: '#728875',
    surfaceFaceMarkings: { color: '#fff9ec', height: 128, shape: 'rounded', width: 110, y: 37 }
  }),
  createAnimalBreed('deer', 'deer-fawn', 'Deer Fawn', {
    coatPattern: { algorithm: 'spotted', density: 29, enabled: true, jitter: 8 }, ears: [120, 118], faceStyle: { gap: 43, height: 54, noseWidth: 13 }, follow: ['earWidth', 'headHeight', 'density'], head: [96, 102], hornStyle: 'none',
    surfaceFaceMarkings: { color: '#f7ead2', height: 114, shape: 'face-mask', width: 98, y: 35 }
  })
] as const

const sheepBreeds = [
  createAnimalBreed('sheep', 'white-sheep', 'White Sheep', {
    ears: [105, 95], faceStyle: { gap: 47, height: 45, noseWidth: 17 }, follow: ['earWidth', 'headWidth'], head: [117, 112], hornStyle: 'none', previewBackground: '#718580',
    surfaceFaceMarkings: { color: '#d2c2aa', height: 132, shape: 'ellipse', width: 122, y: 34 }
  }),
  createAnimalBreed('sheep', 'black-faced-sheep', 'Black-faced Sheep', {
    ears: [114, 101], faceStyle: { gap: 46, height: 48, noseWidth: 17 }, follow: ['earHeight', 'headHeight'], head: [113, 106], hornStyle: 'none', previewBackground: '#cfbea0',
    surfaceFaceMarkings: { color: '#39353a', height: 178, shape: 'face-mask', width: 150, y: 12 }
  }),
  createAnimalBreed('sheep', 'horned-ram', 'Horned Ram', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [88, 91], faceStyle: { gap: 51, height: 42, noseWidth: 20 }, follow: ['headWidth', 'hornSize'], head: [124, 116], hornSize: 124, hornStyle: 'curled',
    surfaceFaceMarkings: { color: '#b6a38a', height: 154, shape: 'face-mask', width: 138, y: 24 }
  }),
  createAnimalBreed('sheep', 'lamb', 'Lamb', {
    ears: [121, 111], faceStyle: { gap: 41, height: 54, noseWidth: 13 }, follow: ['earWidth', 'headHeight'], head: [98, 104], hornStyle: 'none', previewBackground: '#889686',
    surfaceFaceMarkings: { color: '#e7d0ca', height: 120, shape: 'rounded', width: 110, y: 31 }
  }),
  createAnimalBreed('sheep', 'mountain-goat', 'Mountain Goat', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [94, 102], faceStyle: { gap: 44, height: 46, noseWidth: 16 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [99, 113], hornSize: 117, hornStyle: 'straight', previewBackground: '#8a8172',
    surfaceFaceMarkings: { color: '#c4b5a5', height: 152, shape: 'rounded-triangle', width: 112, y: 19 }
  })
] as const

const alpacaBreeds = [
  createAnimalBreed('alpaca', 'cream-alpaca', 'Cream Alpaca', {
    ears: [99, 105], faceStyle: { gap: 45, height: 49, noseHeight: 13, noseWidth: 17, noseY: 33 }, follow: ['earWidth', 'headWidth'], head: [102, 112], previewBackground: '#718875',
    surfaceFaceMarkings: { color: '#cbb6a0', height: 130, shape: 'ellipse', width: 101, y: 36 }
  }),
  createAnimalBreed('alpaca', 'caramel-alpaca', 'Caramel Alpaca', {
    ears: [108, 113], faceStyle: { gap: 46, height: 46, noseHeight: 13, noseWidth: 18, noseY: 35 }, follow: ['earHeight', 'headHeight'], head: [108, 119],
    surfaceFaceMarkings: { color: '#ead4ba', height: 139, shape: 'face-mask', width: 109, y: 35 }
  }),
  createAnimalBreed('alpaca', 'gray-alpaca', 'Gray Alpaca', {
    ears: [91, 106], faceStyle: { gap: 47, height: 47, noseHeight: 12, noseWidth: 16, noseY: 34 }, follow: ['earWidth', 'headWidth'], head: [112, 110],
    surfaceFaceMarkings: { color: '#ddd6ca', height: 126, shape: 'rounded', width: 105, y: 37 }
  }),
  createAnimalBreed('alpaca', 'alpaca-cria', 'Alpaca Cria', {
    ears: [119, 115], faceStyle: { gap: 41, height: 54, noseHeight: 11, noseWidth: 14, noseY: 31 }, follow: ['earHeight', 'headHeight'], head: [93, 101],
    surfaceFaceMarkings: { color: '#f7e9d6', height: 111, shape: 'ellipse', width: 94, y: 33 }
  })
] as const

const cowBreeds = [
  createAnimalBreed('cow', 'dairy-cow', 'Dairy Cow', {
    coatPattern: { algorithm: 'spotted', density: 41, enabled: true, jitter: 13 }, ears: [109, 101], faceStyle: { gap: 49, height: 48, noseEnabled: false }, follow: ['earWidth', 'headWidth', 'density', 'spots'], forelockStyle: 'soft', head: [112, 109], hornSize: 91, hornStyle: 'short',
    surfaceFaceMarkings: { color: '#d6c6b3', height: 112, shape: 'ellipse', width: 101, y: 31 }
  }),
  createAnimalBreed('cow', 'jersey-cow', 'Jersey Cow', {
    ears: [115, 112], faceStyle: { gap: 47, height: 47, noseEnabled: false }, follow: ['earHeight', 'headHeight', 'hornSize'], forelockStyle: 'soft', head: [106, 114], hornSize: 103, hornStyle: 'short',
    surfaceFaceMarkings: { color: '#dfc49e', height: 125, shape: 'rounded', width: 109, y: 30 }
  }),
  createAnimalBreed('cow', 'highland-cow', 'Highland Cow', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [96, 106], faceStyle: { gap: 50, height: 43, noseEnabled: false }, follow: ['headWidth', 'hornSize'], forelockStyle: 'highland', head: [125, 121], hornSize: 128, hornStyle: 'highland',
    surfaceFaceMarkings: { color: '#e6bc88', height: 119, shape: 'face-mask', width: 117, y: 34 }
  }),
  createAnimalBreed('cow', 'cow-calf', 'Cow Calf', {
    ears: [125, 117], faceStyle: { gap: 42, height: 53, noseEnabled: false }, follow: ['earWidth', 'headHeight'], forelockStyle: 'soft', head: [95, 99], hornStyle: 'none',
    surfaceFaceMarkings: { color: '#ead8bc', height: 101, shape: 'ellipse', width: 94, y: 32 }
  })
] as const

const squirrelBreeds = [
  createAnimalBreed('squirrel', 'red-squirrel', 'Red Squirrel', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [104, 116], faceStyle: { gap: 44, height: 49, noseHeight: 11, noseWidth: 14, noseY: 31 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [105, 104], hornSize: 117,
    surfaceFaceMarkings: { color: '#f2dfc2', height: 103, shape: 'ellipse', width: 101, y: 35 }
  }),
  createAnimalBreed('squirrel', 'gray-squirrel', 'Gray Squirrel', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [94, 109], faceStyle: { gap: 46, height: 45, noseHeight: 12, noseWidth: 15, noseY: 32 }, follow: ['earWidth', 'headHeight', 'hornSize'], head: [111, 110], hornSize: 128,
    surfaceFaceMarkings: { color: '#ded7c9', height: 110, shape: 'rounded', width: 109, y: 34 }
  }),
  createAnimalBreed('squirrel', 'chipmunk', 'Chipmunk', {
    dimensionJitter: { earHeight: 7, earWidth: 7, headHeight: 4, headWidth: 5, hornSize: 7 },
    coatPattern: { algorithm: 'mackerel', density: 54, enabled: true, jitter: 9 }, ears: [90, 99], faceStyle: { gap: 41, height: 52, noseHeight: 10, noseWidth: 13, noseY: 30 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [94, 99], hornSize: 94,
    surfaceFaceMarkings: { color: '#f1dfbd', height: 94, shape: 'ellipse', width: 91, y: 37 }
  }),
  createAnimalBreed('squirrel', 'black-squirrel', 'Black Squirrel', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [109, 121], faceStyle: { gap: 45, height: 47, noseHeight: 11, noseWidth: 14, noseY: 31 }, follow: ['earWidth', 'headHeight', 'hornSize'], head: [107, 112], hornSize: 123, previewBackground: '#d2bd9e',
    surfaceFaceMarkings: { color: '#8e7968', height: 107, shape: 'face-mask', width: 104, y: 34 }
  })
] as const

const tigerBreeds = [
  createAnimalBreed('tiger', 'bengal-tiger', 'Bengal Tiger', {
    coatPattern: { algorithm: 'mackerel', contrast: 91, density: 68, enabled: true, jitter: 15 }, ears: [96, 101], faceStyle: { gap: 50, height: 46, noseHeight: 13, noseWidth: 18, noseY: 31 }, follow: ['headWidth', 'density', 'spots'], head: [118, 107],
    surfaceFaceMarkings: { color: '#f6e5cc', height: 115, shape: 'face-mask', width: 126, y: 37 }
  }),
  createAnimalBreed('tiger', 'white-tiger', 'White Tiger', {
    coatPattern: { algorithm: 'classic', contrast: 85, density: 61, enabled: true, jitter: 12 }, ears: [101, 98], faceStyle: { gap: 48, height: 49, noseHeight: 12, noseWidth: 17, noseY: 30 }, follow: ['earWidth', 'headHeight', 'density'], head: [114, 105], previewBackground: '#718891',
    surfaceFaceMarkings: { color: '#fffaf0', height: 118, shape: 'ellipse', width: 123, y: 36 }
  }),
  createAnimalBreed('tiger', 'golden-tiger', 'Golden Tiger', {
    coatPattern: { algorithm: 'broken-mackerel', contrast: 75, density: 54, enabled: true, jitter: 17 }, ears: [107, 106], faceStyle: { gap: 49, height: 47, noseHeight: 13, noseWidth: 17, noseY: 32 }, follow: ['earHeight', 'headWidth', 'density'], head: [111, 109],
    surfaceFaceMarkings: { color: '#fff0d7', height: 112, shape: 'rounded', width: 118, y: 36 }
  }),
  createAnimalBreed('tiger', 'tiger-cub', 'Tiger Cub', {
    coatPattern: { algorithm: 'mackerel', contrast: 79, density: 47, enabled: true, jitter: 9 }, ears: [122, 119], faceStyle: { gap: 42, height: 54, noseHeight: 10, noseWidth: 14, noseY: 29 }, follow: ['earWidth', 'headHeight', 'density'], head: [94, 97],
    surfaceFaceMarkings: { color: '#ffeedb', height: 95, shape: 'ellipse', width: 101, y: 34 }
  })
] as const

const lionBreeds = [
  createAnimalBreed('lion', 'african-lion', 'African Lion', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 3, headWidth: 4, hornSize: 4 },
    ears: [92, 97], faceStyle: { gap: 51, height: 45, noseHeight: 14, noseWidth: 21, noseY: 33 }, follow: ['headWidth', 'hornSize'], head: [104, 101], hornSize: 101, hornStyle: 'full',
    surfaceFaceMarkings: { color: '#f3dfbf', height: 119, shape: 'face-mask', width: 123, y: 38 }
  }),
  createAnimalBreed('lion', 'lioness', 'Lioness', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 3, headWidth: 4 },
    ears: [105, 102], faceStyle: { gap: 47, height: 49, noseHeight: 13, noseWidth: 18, noseY: 32 }, follow: ['earWidth', 'headHeight'], head: [101, 98], hornStyle: 'none',
    surfaceFaceMarkings: { color: '#f5e7cf', height: 110, shape: 'ellipse', width: 113, y: 37 }
  }),
  createAnimalBreed('lion', 'white-lion', 'White Lion', {
    dimensionJitter: { earHeight: 5, earWidth: 5, headHeight: 3, headWidth: 4, hornSize: 4 },
    ears: [95, 99], faceStyle: { gap: 50, height: 47, noseHeight: 13, noseWidth: 19, noseY: 33 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [102, 99], hornSize: 98, hornStyle: 'full', previewBackground: '#77897b',
    surfaceFaceMarkings: { color: '#fff7e9', height: 117, shape: 'rounded', width: 120, y: 37 }
  }),
  createAnimalBreed('lion', 'lion-cub', 'Lion Cub', {
    dimensionJitter: { earHeight: 5, earWidth: 6, headHeight: 3, headWidth: 4, hornSize: 4 },
    ears: [115, 109], faceStyle: { gap: 41, height: 55, noseHeight: 10, noseWidth: 14, noseY: 30 }, follow: ['earWidth', 'headHeight', 'hornSize'], head: [88, 93], hornSize: 72, hornStyle: 'juvenile',
    surfaceFaceMarkings: { color: '#fbebd2', height: 99, shape: 'ellipse', width: 101, y: 35 }
  })
] as const

const hedgehogBreeds = [
  createAnimalBreed('hedgehog', 'european-hedgehog', 'European Hedgehog', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [94, 91], faceStyle: { gap: 42, height: 45, noseHeight: 13, noseWidth: 18, noseY: 34 }, follow: ['headWidth', 'hornSize'], head: [108, 103], hornSize: 115, hornStyle: 'full',
    surfaceFaceMarkings: { color: '#e9dbc5', height: 106, shape: 'rounded-triangle', width: 101, y: 36 }
  }),
  createAnimalBreed('hedgehog', 'cream-hedgehog', 'Cream Hedgehog', {
    dimensionJitter: { earHeight: 7, earWidth: 7, headHeight: 5, headWidth: 6, hornSize: 7 },
    ears: [102, 96], faceStyle: { gap: 43, height: 47, noseHeight: 12, noseWidth: 16, noseY: 33 }, follow: ['earWidth', 'headHeight', 'hornSize'], head: [104, 101], hornSize: 103, hornStyle: 'full',
    surfaceFaceMarkings: { color: '#fff1dc', height: 100, shape: 'ellipse', width: 98, y: 36 }
  }),
  createAnimalBreed('hedgehog', 'albino-hedgehog', 'Albino Hedgehog', {
    dimensionJitter: { earHeight: 6, earWidth: 6, headHeight: 4, headWidth: 5, hornSize: 6 },
    ears: [110, 104], faceStyle: { gap: 42, height: 50, noseHeight: 11, noseWidth: 15, noseY: 33 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [98, 101], hornSize: 91, hornStyle: 'short', previewBackground: '#7d897c',
    surfaceFaceMarkings: { color: '#fff5eb', height: 95, shape: 'rounded', width: 93, y: 35 }
  }),
  createAnimalBreed('hedgehog', 'cinnamon-hedgehog', 'Cinnamon Hedgehog', {
    dimensionJitter: { earHeight: 8, earWidth: 8, headHeight: 5, headWidth: 6, hornSize: 8 },
    ears: [98, 101], faceStyle: { gap: 44, height: 46, noseHeight: 12, noseWidth: 17, noseY: 34 }, follow: ['earWidth', 'headHeight', 'hornSize'], head: [110, 107], hornSize: 121, hornStyle: 'full',
    surfaceFaceMarkings: { color: '#efdbca', height: 104, shape: 'face-mask', width: 105, y: 36 }
  })
] as const

export const AVATAR_ANIMAL_BREED_TEMPLATES_BY_SPECIES: Readonly<
  Record<AvatarAnimalSpeciesId, readonly AvatarAnimalBreedTemplate[]>
> = {
  alpaca: alpacaBreeds,
  beaver: beaverBreeds,
  capybara: capybaraBreeds,
  chick: chickBreeds,
  chinchilla: chinchillaBreeds,
  cow: cowBreeds,
  deer: deerBreeds,
  duck: duckBreeds,
  ferret: ferretBreeds,
  fox: foxBreeds,
  'guinea-pig': guineaPigBreeds,
  hamster: hamsterBreeds,
  hedgehog: hedgehogBreeds,
  lion: lionBreeds,
  monkey: monkeyBreeds,
  otter: otterBreeds,
  owl: owlBreeds,
  parrot: parrotBreeds,
  penguin: penguinBreeds,
  pig: pigBreeds,
  seal: sealBreeds,
  sheep: sheepBreeds,
  squirrel: squirrelBreeds,
  tiger: tigerBreeds,
  goose: gooseBreeds
}

export const AVATAR_ANIMAL_BREED_TEMPLATES = AVATAR_ANIMAL_SPECIES_IDS.flatMap(
  species => AVATAR_ANIMAL_BREED_TEMPLATES_BY_SPECIES[species]
)

export const getAvatarAnimalBreedTemplates = (species: AvatarAnimalSpeciesId) => (
  AVATAR_ANIMAL_BREED_TEMPLATES_BY_SPECIES[species]
)

export const getAvatarAnimalBreedTemplate = (
  species: AvatarAnimalSpeciesId,
  id: string | null | undefined
) => getAvatarAnimalBreedTemplates(species).find(template => template.id === id) ?? null

export const getAvatarAnimalBreedControlledFields = (
  species: AvatarAnimalSpeciesId
): readonly AvatarSeedField[] => [
  AVATAR_SEED_FIELD.palette,
  ...Object.values(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[species]),
  ...(species === 'fox' ? [AVATAR_SEED_FIELD.foxEarStyle, AVATAR_SEED_FIELD.foxHeadTaper] : []),
  ...(getAvatarAnimalHornSeedField(species) == null ? [] : [getAvatarAnimalHornSeedField(species)!]),
  ...(getAvatarAnimalDetailSeedField(species) == null ? [] : [getAvatarAnimalDetailSeedField(species)!]),
  AVATAR_SEED_FIELD.coatPatternAlgorithm,
  AVATAR_SEED_FIELD.coatPatternSeed,
  AVATAR_SEED_FIELD.coatPatternDensity,
  AVATAR_SEED_FIELD.coatPatternJitter,
  AVATAR_SEED_FIELD.coatPatternLightPatchLength,
  AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY,
  AVATAR_SEED_FIELD.coatPatternLightPatchWidth,
  AVATAR_SEED_FIELD.coatPatternLightPatchShape,
  AVATAR_SEED_FIELD.coatPatternThickness,
  AVATAR_SEED_FIELD.coatPatternSymmetry,
  AVATAR_SEED_FIELD.coatPatternContrast,
  AVATAR_SEED_FIELD.coatPatternBreakup
]

export const resolveAvatarAnimalAccessorySize = (
  template: AvatarAnimalBreedTemplate | null | undefined,
  headWidth: number | null | undefined,
  headHeight: number | null | undefined,
  accessorySize: number | null | undefined
): number | null | undefined => {
  if (
    template?.species !== 'lion' ||
    template.fixed.hornSize == null ||
    headWidth == null ||
    headHeight == null ||
    accessorySize == null
  ) return accessorySize

  const range = template.seedDomain.ranges?.[AVATAR_SEED_FIELD.lionManeSize]
  if (range == null) return accessorySize

  const headRatio = Math.sqrt(
    headWidth / template.fixed.headWidth * headHeight / template.fixed.headHeight
  )
  const balancedManeSize = Math.min(
    range.max,
    Math.max(range.min, Math.round(template.fixed.hornSize * headRatio))
  )
  const min = Math.max(range.min, balancedManeSize - 2)
  const max = Math.min(range.max, balancedManeSize + 2)
  return Math.min(max, Math.max(min, accessorySize))
}

export const resolveAvatarAnimalBreedTemplate = (
  template: AvatarAnimalBreedTemplate,
  seed: string,
  currentCoatPattern: AvatarCoatPattern = DEFAULT_AVATAR_COAT_PATTERN
): ResolvedAvatarAnimalBreedTemplate => {
  const fields = AVATAR_ANIMAL_SPECIES_SEED_FIELDS[template.species]
  const earFields = getAvatarAnimalEarSeedFields(template.species)
  const dimension = (key: 'headHeight' | 'headWidth'): number => (
    template.followByDefault.includes(fields[key])
      ? resolveSeededAvatarAnimalScale(seed, fields[key], template.seedDomain)
      : template.fixed[key]
  )
  const earDimension = (key: 'earHeight' | 'earWidth'): number | undefined => {
    const field = earFields?.[key]
    const fixed = template.fixed[key]
    if (field == null || fixed == null) return undefined
    return template.followByDefault.includes(field)
      ? resolveSeededAvatarAnimalScale(seed, field, template.seedDomain)
      : fixed
  }
  const headHeight = dimension('headHeight')
  const headWidth = dimension('headWidth')
  const hornField = getAvatarAnimalHornSeedField(template.species)
  const detailField = getAvatarAnimalDetailSeedField(template.species)
  const seededHornSize = template.fixed.hornSize == null
    ? undefined
    : hornField != null && template.followByDefault.includes(hornField)
      ? resolveSeededAvatarAnimalScale(seed, hornField, template.seedDomain)
      : template.fixed.hornSize
  const proportionalManeSize = resolveAvatarAnimalAccessorySize(
    template,
    headWidth,
    headHeight,
    seededHornSize
  )
  const detailSize = template.fixed.detailSize == null
    ? undefined
    : detailField != null && template.followByDefault.includes(detailField)
      ? resolveSeededAvatarAnimalScale(seed, detailField, template.seedDomain)
      : template.fixed.detailSize
  const earHeight = earDimension('earHeight')
  const earWidth = earDimension('earWidth')
  const dimensions: AvatarAnimalDimensions = {
    ...(detailSize == null ? {} : { detailSize }),
    ...(earHeight == null ? {} : { earHeight }),
    ...(earWidth == null ? {} : { earWidth }),
    headHeight,
    headWidth,
    ...(proportionalManeSize == null ? {} : { hornSize: proportionalManeSize })
  }
  let baseParts = createAvatarEntityParts(template.species as AvatarEntityPreset)
  if (template.species === 'cow' && template.fixed.forelockStyle != null) {
    const applyForelockStyle = ENTITY_MODEL_EXPORTS.applyCowForelockStyle
    if (typeof applyForelockStyle === 'function') {
      baseParts = (applyForelockStyle as (
        parts: readonly AvatarEntityPart[],
        style: AvatarAnimalForelockStyle
      ) => AvatarEntityPart[])(baseParts, template.fixed.forelockStyle)
    }
  }
  if (template.species === 'fox') {
    const applyEarStyle = ENTITY_MODEL_EXPORTS.applyFoxEarStyle
    if (template.fixed.earStyle != null && typeof applyEarStyle === 'function') {
      baseParts = (applyEarStyle as (
        parts: readonly AvatarEntityPart[],
        style: AvatarFoxEarStyle
      ) => AvatarEntityPart[])(baseParts, template.fixed.earStyle)
    }
    const applyHeadTaper = ENTITY_MODEL_EXPORTS.applyFoxHeadTaper
    if (template.fixed.headTaper != null && typeof applyHeadTaper === 'function') {
      baseParts = (applyHeadTaper as (
        parts: readonly AvatarEntityPart[],
        taper: number
      ) => AvatarEntityPart[])(baseParts, template.fixed.headTaper)
    }
  }

  const palette = resolveAvatarBreedPalette(template.fixed.paletteId, seed, template.seedDomain)
  const toneAmount = resolveSeededAvatarPaletteTone(seed, template.fixed.paletteId, template.seedDomain)
  const entityParts = applyAvatarEntityPalette(
    applyAvatarAnimalDimensions(
      baseParts,
      template.species,
      dimensions,
      template.fixed.hornStyle,
      template.fixed.detailStyle
    ),
    palette
  )

  const createFoxDecals = ENTITY_MODEL_EXPORTS.createFoxSurfaceDecals
  const createFaceDecals = ENTITY_MODEL_EXPORTS[`create${speciesExportName(template.species)}SurfaceDecals`]
  const surfaceDecals = template.species === 'fox' && typeof createFoxDecals === 'function'
    ? (createFoxDecals as (style?: AvatarFoxSurfaceMarkingStyle) => readonly AvatarSurfaceDecal[])(
      template.fixed.surfaceMarkings
    ).map(decal => ({
      ...decal,
      color: applyAvatarBreedMarkingTone(
        decal.color,
        toneAmount * (decal.id.includes('inner-ear') ? .45 : .35)
      )
    }))
    : template.fixed.surfaceFaceMarkings != null && typeof createFaceDecals === 'function'
      ? (createFaceDecals as (
        style?: AvatarAnimalBreedSurfaceFaceMarkingStyle
      ) => readonly AvatarSurfaceDecal[])({
        ...template.fixed.surfaceFaceMarkings,
        ...(template.fixed.surfaceFaceMarkings.innerEarColor == null ? {} : {
          innerEarColor: applyAvatarBreedMarkingTone(
            template.fixed.surfaceFaceMarkings.innerEarColor,
            toneAmount * .35
          )
        }),
        ...(template.fixed.surfaceFaceMarkings.beakColor == null ? {} : {
          beakColor: applyAvatarBreedMarkingTone(
            template.fixed.surfaceFaceMarkings.beakColor,
            toneAmount * .22
          )
        }),
        ...(template.fixed.surfaceFaceMarkings.billColor == null ? {} : {
          billColor: applyAvatarBreedMarkingTone(
            template.fixed.surfaceFaceMarkings.billColor,
            toneAmount * .22
          )
        }),
        ...(template.fixed.surfaceFaceMarkings.combColor == null ? {} : {
          combColor: applyAvatarBreedMarkingTone(
            template.fixed.surfaceFaceMarkings.combColor,
            toneAmount * .08
          )
        }),
        ...(template.fixed.surfaceFaceMarkings.maskColor == null ? {} : {
          maskColor: applyAvatarBreedMarkingTone(
            template.fixed.surfaceFaceMarkings.maskColor,
            toneAmount * .2
          )
        }),
        ...(template.fixed.surfaceFaceMarkings.eyeRingColor == null ? {} : {
          eyeRingColor: applyAvatarBreedMarkingTone(
            template.fixed.surfaceFaceMarkings.eyeRingColor,
            toneAmount * .12
          )
        }),
        ...(template.fixed.surfaceFaceMarkings.nostrilColor == null ? {} : {
          nostrilColor: applyAvatarBreedMarkingTone(
            template.fixed.surfaceFaceMarkings.nostrilColor,
            toneAmount * .1
          )
        }),
        ...(template.fixed.surfaceFaceMarkings.tuftColor == null ? {} : {
          tuftColor: applyAvatarBreedMarkingTone(
            template.fixed.surfaceFaceMarkings.tuftColor,
            toneAmount * .18
          )
        }),
        color: template.id === 'black-faced-sheep'
          ? template.fixed.surfaceFaceMarkings.color
          : template.species === 'deer' || template.species === 'otter'
            ? palette.coat?.patch ?? template.fixed.surfaceFaceMarkings.color
            : applyAvatarBreedMarkingTone(template.fixed.surfaceFaceMarkings.color, toneAmount * .45)
      })
      : undefined

  return {
    ...dimensions,
    coatPattern: resolveSeededAvatarCoatPattern(
      seed,
      { ...DEFAULT_AVATAR_COAT_PATTERN, ...currentCoatPattern, ...template.fixed.coatPattern },
      template.followByDefault,
      template.seedDomain
    ),
    entityParts,
    faceStyle: resolveAvatarEntityPresetFaceStyle(
      template.species as AvatarEntityPreset,
      template.fixed.faceStyle
    ) ?? DEFAULT_AVATAR_FACE_STYLE,
    ...(template.fixed.hornStyle == null ? {} : { hornStyle: template.fixed.hornStyle }),
    ...(template.fixed.detailStyle == null ? {} : { detailStyle: template.fixed.detailStyle }),
    paletteId: template.fixed.paletteId,
    ...(surfaceDecals == null ? {} : { surfaceDecals })
  }
}
