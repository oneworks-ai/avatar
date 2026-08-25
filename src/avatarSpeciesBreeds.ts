import { DEFAULT_AVATAR_COAT_PATTERN, getAvatarPalette } from '@oneworks/avatar'
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
  AVATAR_ANIMAL_SPECIES_IDS,
  AVATAR_ANIMAL_SPECIES_SEED_FIELDS,
  AVATAR_SEED_FIELD,
  resolveSeededAvatarAnimalScale,
  resolveSeededAvatarCoatPattern
} from './avatarSeed'
import type { AvatarAnimalSpeciesId, AvatarSeedDomain, AvatarSeedField } from './avatarSeed'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

type AvatarAnimalDimension = 'earHeight' | 'earWidth' | 'headHeight' | 'headWidth'
type AvatarAnimalHornStyle = 'branched' | 'curled' | 'curved' | 'forked' | 'none' | 'reindeer' | 'spike' | 'straight'

export interface AvatarAnimalDimensions {
  readonly earHeight: number
  readonly earWidth: number
  readonly headHeight: number
  readonly headWidth: number
  readonly hornSize?: number
}

interface AvatarAnimalBreedOptions {
  readonly coatPattern?: Partial<AvatarCoatPattern>
  readonly ears: readonly [number, number]
  readonly earStyle?: AvatarFoxEarStyle
  readonly faceStyle?: AvatarEntityFaceStyleOverride
  readonly follow: readonly (AvatarAnimalDimension | 'density' | 'hornSize' | 'spots')[]
  readonly head: readonly [number, number]
  readonly headTaper?: number
  readonly hornSize?: number
  readonly hornStyle?: AvatarAnimalHornStyle
  readonly previewBackground?: string
  readonly surfaceMarkings?: AvatarFoxSurfaceMarkingStyle
}

export interface AvatarAnimalBreedTemplate {
  readonly fixed: {
    readonly coatPattern: Partial<AvatarCoatPattern>
    readonly earHeight: number
    readonly earStyle?: AvatarFoxEarStyle
    readonly earWidth: number
    readonly faceStyle: AvatarEntityFaceStyleOverride
    readonly headHeight: number
    readonly headTaper?: number
    readonly headWidth: number
    readonly hornSize?: number
    readonly hornStyle?: AvatarAnimalHornStyle
    readonly paletteId: string
    readonly surfaceMarkings?: AvatarFoxSurfaceMarkingStyle
  }
  readonly followByDefault: readonly AvatarSeedField[]
  readonly id: string
  readonly label: string
  readonly previewBackground?: string
  readonly seedDomain: AvatarSeedDomain
  readonly species: AvatarAnimalSpeciesId
}

export interface ResolvedAvatarAnimalBreedTemplate extends AvatarAnimalDimensions {
  readonly coatPattern: AvatarCoatPattern
  readonly entityParts: readonly AvatarEntityPart[]
  readonly faceStyle: AvatarFaceStyle
  readonly hornStyle?: AvatarAnimalHornStyle
  readonly paletteId: string
  readonly surfaceDecals?: readonly AvatarSurfaceDecal[]
}

const ENTITY_MODEL_EXPORTS = avatarEntityPresets as unknown as Readonly<Record<string, unknown>>

const speciesExportName = (species: AvatarAnimalSpeciesId) => (
  `${species.charAt(0).toUpperCase()}${species.slice(1)}`
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

export const getAvatarAnimalScaleRange = (
  species: AvatarAnimalSpeciesId,
  part: 'ear' | 'head' | 'horn'
): { readonly max: number; readonly min: number } => {
  const rangeName = part === 'horn'
    ? species === 'deer' ? 'DEER_ANTLER_SIZE_RANGE' : 'SHEEP_HORN_SIZE_RANGE'
    : `${species.toUpperCase()}_${part.toUpperCase()}_SCALE_RANGE`
  const range = ENTITY_MODEL_EXPORTS[rangeName]
  if (range != null && typeof range === 'object' && 'min' in range && 'max' in range) {
    return range as { readonly max: number; readonly min: number }
  }
  return part === 'head' ? { max: 134, min: 76 } : { max: 155, min: 55 }
}

export const getAvatarAnimalDimensions = (
  species: AvatarAnimalSpeciesId,
  entityParts: readonly AvatarEntityPart[]
): AvatarAnimalDimensions => {
  const ear = getScaleReader(species, 'Ear')?.(entityParts) ?? { height: 100, width: 100 }
  const head = getScaleReader(species, 'Head')?.(entityParts) ?? { height: 100, width: 100 }
  const hornReader = ENTITY_MODEL_EXPORTS[
    species === 'deer' ? 'getDeerAntlerSize' : 'getSheepHornSize'
  ]
  const hornSize = (species === 'deer' || species === 'sheep') && typeof hornReader === 'function'
    ? (hornReader as (parts: readonly AvatarEntityPart[]) => number)(entityParts)
    : undefined

  return {
    earHeight: ear.height,
    earWidth: ear.width,
    headHeight: head.height,
    headWidth: head.width,
    ...(hornSize == null ? {} : { hornSize })
  }
}

export const applyAvatarAnimalDimensions = (
  entityParts: readonly AvatarEntityPart[],
  species: AvatarAnimalSpeciesId,
  dimensions: Partial<AvatarAnimalDimensions>,
  hornStyle?: AvatarAnimalHornStyle
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

  if (species === 'deer' || species === 'sheep') {
    const applyHornStyle = ENTITY_MODEL_EXPORTS[
      species === 'deer' ? 'applyDeerAntlerStyle' : 'applySheepHornStyle'
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
      species === 'deer' ? 'applyDeerAntlerSize' : 'applySheepHornSize'
    ]
    if (dimensions.hornSize != null && typeof applyHornSize === 'function') {
      parts = (applyHornSize as (
        current: readonly AvatarEntityPart[],
        size: number
      ) => readonly AvatarEntityPart[])(parts, dimensions.hornSize)
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
  const hornField = species === 'deer'
    ? AVATAR_SEED_FIELD.deerAntlerSize
    : AVATAR_SEED_FIELD.sheepHornSize
  const ranges: AvatarSeedDomain['ranges'] = {
    [fields.earHeight]: dimensionRange(options.ears[1], 10),
    [fields.earWidth]: dimensionRange(options.ears[0], 10),
    [fields.headHeight]: dimensionRange(options.head[1], 7),
    [fields.headWidth]: dimensionRange(options.head[0], 8),
    ...(options.hornSize == null ? {} : { [hornField]: dimensionRange(options.hornSize, 12) }),
    ...(options.coatPattern?.density == null ? {} : {
      [AVATAR_SEED_FIELD.coatPatternDensity]: {
        max: Math.min(options.coatPattern.density + 12, 100),
        min: Math.max(options.coatPattern.density - 12, 0)
      }
    })
  }
  const followByDefault = options.follow.flatMap<AvatarSeedField>(field => {
    if (field === 'density') return [AVATAR_SEED_FIELD.coatPatternDensity]
    if (field === 'spots') return [AVATAR_SEED_FIELD.coatPatternSeed]
    if (field === 'hornSize') return [hornField]
    return [fields[field]]
  })

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
      earHeight: options.ears[1],
      ...(options.earStyle == null ? {} : { earStyle: options.earStyle }),
      earWidth: options.ears[0],
      faceStyle: {
        height: 44,
        mouthEnabled: false,
        width: 24,
        ...options.faceStyle
      },
      headHeight: options.head[1],
      ...(options.headTaper == null ? {} : { headTaper: options.headTaper }),
      headWidth: options.head[0],
      ...(options.hornSize == null ? {} : { hornSize: options.hornSize }),
      ...(options.hornStyle == null ? {} : { hornStyle: options.hornStyle }),
      paletteId: id,
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
      ranges
    },
    species
  }
}

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
      innerEarColor: '#e9c8c1',
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
      innerEarColor: '#deb6a6',
      innerEarScale: 113
    }
  })
] as const

const hamsterBreeds = [
  createAnimalBreed('hamster', 'syrian-hamster', 'Syrian Hamster', {
    ears: [112, 104], faceStyle: { gap: 42, height: 46, noseWidth: 14 }, follow: ['earWidth', 'headWidth'], head: [112, 105]
  }),
  createAnimalBreed('hamster', 'pudding-hamster', 'Pudding Hamster', {
    ears: [88, 86], faceStyle: { gap: 39, height: 48, noseWidth: 13 }, follow: ['earHeight', 'headHeight'], head: [121, 112]
  }),
  createAnimalBreed('hamster', 'silver-fox-hamster', 'Silver Fox Hamster', {
    ears: [98, 108], faceStyle: { gap: 43, height: 42, noseWidth: 12 }, follow: ['earWidth', 'headWidth'], head: [104, 97], previewBackground: '#667983'
  }),
  createAnimalBreed('hamster', 'sapphire-hamster', 'Sapphire Hamster', {
    ears: [82, 94], faceStyle: { gap: 40, height: 47, noseWidth: 13 }, follow: ['earHeight', 'headHeight'], head: [108, 101]
  })
] as const

const capybaraBreeds = [
  createAnimalBreed('capybara', 'capybara', 'Capybara', {
    ears: [91, 84], faceStyle: { gap: 51, height: 38, noseWidth: 27 }, follow: ['headWidth', 'headHeight'], head: [118, 96]
  }),
  createAnimalBreed('capybara', 'sandy-capybara', 'Sandy Capybara', {
    ears: [84, 79], faceStyle: { gap: 48, height: 41, noseWidth: 25 }, follow: ['earWidth', 'headWidth'], head: [111, 101]
  }),
  createAnimalBreed('capybara', 'dark-capybara', 'Dark Capybara', {
    ears: [96, 86], faceStyle: { gap: 53, height: 37, noseWidth: 29 }, follow: ['earHeight', 'headWidth'], head: [125, 103], previewBackground: '#d7b785'
  }),
  createAnimalBreed('capybara', 'capybara-pup', 'Capybara Pup', {
    ears: [109, 103], faceStyle: { gap: 43, height: 48, noseWidth: 20 }, follow: ['earWidth', 'headHeight'], head: [101, 111]
  })
] as const

const otterBreeds = [
  createAnimalBreed('otter', 'sea-otter', 'Sea Otter', {
    ears: [75, 74], faceStyle: { gap: 48, height: 45, noseWidth: 21 }, follow: ['headWidth', 'headHeight'], head: [123, 106]
  }),
  createAnimalBreed('otter', 'river-otter', 'River Otter', {
    ears: [87, 86], faceStyle: { gap: 45, height: 42, noseWidth: 18 }, follow: ['earWidth', 'headWidth'], head: [112, 95]
  }),
  createAnimalBreed('otter', 'asian-small-clawed-otter', 'Asian Small-clawed Otter', {
    ears: [95, 91], faceStyle: { gap: 42, height: 49, noseWidth: 16 }, follow: ['earHeight', 'headHeight'], head: [101, 103]
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
    coatPattern: { algorithm: 'spotted', density: 38, enabled: true, jitter: 10 }, ears: [102, 111], faceStyle: { gap: 49, height: 49, noseWidth: 17 }, follow: ['headWidth', 'hornSize', 'density'], head: [106, 110], hornSize: 105, hornStyle: 'forked'
  }),
  createAnimalBreed('deer', 'reindeer', 'Reindeer', {
    ears: [94, 105], faceStyle: { gap: 50, height: 44, noseWidth: 22 }, follow: ['headHeight', 'hornSize'], head: [118, 111], hornSize: 132, hornStyle: 'reindeer'
  }),
  createAnimalBreed('deer', 'white-deer', 'White Deer', {
    ears: [111, 116], faceStyle: { gap: 47, height: 51, noseWidth: 15 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [103, 108], hornSize: 96, hornStyle: 'spike', previewBackground: '#728875'
  }),
  createAnimalBreed('deer', 'deer-fawn', 'Deer Fawn', {
    coatPattern: { algorithm: 'spotted', density: 29, enabled: true, jitter: 8 }, ears: [120, 118], faceStyle: { gap: 43, height: 54, noseWidth: 13 }, follow: ['earWidth', 'headHeight', 'density'], head: [96, 102], hornStyle: 'none'
  })
] as const

const sheepBreeds = [
  createAnimalBreed('sheep', 'white-sheep', 'White Sheep', {
    ears: [105, 95], faceStyle: { gap: 47, height: 45, noseWidth: 17 }, follow: ['earWidth', 'headWidth'], head: [117, 112], hornStyle: 'none', previewBackground: '#718580'
  }),
  createAnimalBreed('sheep', 'black-faced-sheep', 'Black-faced Sheep', {
    ears: [114, 101], faceStyle: { gap: 46, height: 48, noseWidth: 17 }, follow: ['earHeight', 'headHeight'], head: [113, 106], hornStyle: 'none', previewBackground: '#cfbea0'
  }),
  createAnimalBreed('sheep', 'horned-ram', 'Horned Ram', {
    ears: [88, 91], faceStyle: { gap: 51, height: 42, noseWidth: 20 }, follow: ['headWidth', 'hornSize'], head: [124, 116], hornSize: 124, hornStyle: 'curled'
  }),
  createAnimalBreed('sheep', 'lamb', 'Lamb', {
    ears: [121, 111], faceStyle: { gap: 41, height: 54, noseWidth: 13 }, follow: ['earWidth', 'headHeight'], head: [98, 104], hornStyle: 'none', previewBackground: '#889686'
  }),
  createAnimalBreed('sheep', 'mountain-goat', 'Mountain Goat', {
    ears: [94, 102], faceStyle: { gap: 44, height: 46, noseWidth: 16 }, follow: ['earHeight', 'headWidth', 'hornSize'], head: [99, 113], hornSize: 117, hornStyle: 'straight', previewBackground: '#8a8172'
  })
] as const

export const AVATAR_ANIMAL_BREED_TEMPLATES_BY_SPECIES: Readonly<
  Record<AvatarAnimalSpeciesId, readonly AvatarAnimalBreedTemplate[]>
> = {
  capybara: capybaraBreeds,
  deer: deerBreeds,
  fox: foxBreeds,
  hamster: hamsterBreeds,
  otter: otterBreeds,
  pig: pigBreeds,
  sheep: sheepBreeds
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
  ...(species === 'deer' ? [AVATAR_SEED_FIELD.deerAntlerSize] : []),
  ...(species === 'sheep' ? [AVATAR_SEED_FIELD.sheepHornSize] : []),
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

export const resolveAvatarAnimalBreedTemplate = (
  template: AvatarAnimalBreedTemplate,
  seed: string,
  currentCoatPattern: AvatarCoatPattern = DEFAULT_AVATAR_COAT_PATTERN
): ResolvedAvatarAnimalBreedTemplate => {
  const fields = AVATAR_ANIMAL_SPECIES_SEED_FIELDS[template.species]
  const dimension = (key: AvatarAnimalDimension): number => (
    template.followByDefault.includes(fields[key])
      ? resolveSeededAvatarAnimalScale(seed, fields[key], template.seedDomain)
      : template.fixed[key]
  )
  const hornField = template.species === 'deer'
    ? AVATAR_SEED_FIELD.deerAntlerSize
    : AVATAR_SEED_FIELD.sheepHornSize
  const hornSize = template.fixed.hornSize == null
    ? undefined
    : template.followByDefault.includes(hornField)
      ? resolveSeededAvatarAnimalScale(seed, hornField, template.seedDomain)
      : template.fixed.hornSize
  const dimensions: AvatarAnimalDimensions = {
    earHeight: dimension('earHeight'),
    earWidth: dimension('earWidth'),
    headHeight: dimension('headHeight'),
    headWidth: dimension('headWidth'),
    ...(hornSize == null ? {} : { hornSize })
  }
  let baseParts = createAvatarEntityParts(template.species as AvatarEntityPreset)
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

  const entityParts = applyAvatarEntityPalette(
    applyAvatarAnimalDimensions(
      baseParts,
      template.species,
      dimensions,
      template.fixed.hornStyle
    ),
    getAvatarPalette(template.fixed.paletteId)
  )

  const createSurfaceDecals = ENTITY_MODEL_EXPORTS.createFoxSurfaceDecals
  const surfaceDecals = template.species === 'fox' && typeof createSurfaceDecals === 'function'
    ? (createSurfaceDecals as (style?: AvatarFoxSurfaceMarkingStyle) => readonly AvatarSurfaceDecal[])(
      template.fixed.surfaceMarkings
    )
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
    paletteId: template.fixed.paletteId,
    ...(surfaceDecals == null ? {} : { surfaceDecals })
  }
}
