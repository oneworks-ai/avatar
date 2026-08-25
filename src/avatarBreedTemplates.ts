import { DEFAULT_AVATAR_COAT_PATTERN, getAvatarPalette } from '@oneworks/avatar'
import type { AvatarCoatPattern } from '@oneworks/avatar'

import {
  applyAvatarEntityPalette,
  applyCatEarScale,
  applyDogEarScale,
  applyDogHeadScale,
  createAvatarEntityParts
} from './avatarEntityPresets'
import type { AvatarEntityPart } from './avatarEntityPresets'
import {
  AVATAR_SEED_FIELD,
  resolveSeededAvatarCatEarScale,
  resolveSeededAvatarDogEarScale,
  resolveSeededAvatarDogHeadScale,
  resolveSeededAvatarCoatPattern
} from './avatarSeed'
import type { AvatarSeedDomain, AvatarSeedField } from './avatarSeed'

export const AVATAR_CAT_BREED_TEMPLATE_IDS = [
  'siamese',
  'british-shorthair',
  'russian-blue',
  'orange-tabby',
  'cow-cat',
  'black-cat'
] as const

export type AvatarCatBreedTemplateId = (typeof AVATAR_CAT_BREED_TEMPLATE_IDS)[number]

export interface AvatarCatBreedTemplate {
  readonly fixed: {
    readonly catEarHeight: number
    readonly catEarWidth: number
    readonly coatPattern: Partial<AvatarCoatPattern>
    readonly paletteId: string
  }
  readonly followByDefault: readonly AvatarSeedField[]
  readonly id: AvatarCatBreedTemplateId
  readonly label: string
  readonly previewBackground?: string
  readonly seedDomain: AvatarSeedDomain
}

export const AVATAR_CAT_BREED_CONTROLLED_FIELDS = [
  AVATAR_SEED_FIELD.palette,
  AVATAR_SEED_FIELD.catEarWidth,
  AVATAR_SEED_FIELD.catEarHeight,
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
] as const satisfies readonly AvatarSeedField[]

export const AVATAR_CAT_BREED_TEMPLATES: readonly AvatarCatBreedTemplate[] = [
  {
    fixed: {
      catEarHeight: 114,
      catEarWidth: 104,
      coatPattern: {
        algorithm: 'mackerel',
        breakup: 0,
        contrast: 90,
        density: 0,
        enabled: true,
        jitter: 0,
        lightPatchLength: 60,
        lightPatchOffsetY: -44,
        lightPatchShape: 'ellipse',
        lightPatchWidth: 143,
        symmetry: 100,
        thickness: 90
      },
      paletteId: 'siamese'
    },
    followByDefault: [
      AVATAR_SEED_FIELD.coatPatternLightPatchLength,
      AVATAR_SEED_FIELD.coatPatternLightPatchWidth
    ],
    id: 'siamese',
    label: 'Siamese',
    seedDomain: {
      coatAlgorithms: ['mackerel'],
      lightPatchShapes: ['ellipse'],
      paletteIds: ['siamese'],
      ranges: {
        [AVATAR_SEED_FIELD.catEarHeight]: { max: 120, min: 105 },
        [AVATAR_SEED_FIELD.catEarWidth]: { max: 112, min: 96 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchLength]: { max: 72, min: 60 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY]: { max: -44, min: -44 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { max: 160, min: 126 }
      }
    }
  },
  {
    fixed: {
      catEarHeight: 86,
      catEarWidth: 90,
      coatPattern: {
        algorithm: 'classic',
        breakup: 12,
        contrast: 48,
        density: 22,
        enabled: true,
        jitter: 18,
        lightPatchOffsetY: 8,
        lightPatchShape: 'face-mask',
        symmetry: 88,
        thickness: 108
      },
      paletteId: 'british-shorthair'
    },
    followByDefault: [
      AVATAR_SEED_FIELD.coatPatternDensity,
      AVATAR_SEED_FIELD.coatPatternLightPatchLength,
      AVATAR_SEED_FIELD.coatPatternLightPatchWidth
    ],
    id: 'british-shorthair',
    label: 'British Shorthair',
    seedDomain: {
      coatAlgorithms: ['classic'],
      lightPatchShapes: ['face-mask'],
      paletteIds: ['british-shorthair'],
      ranges: {
        [AVATAR_SEED_FIELD.catEarHeight]: { max: 94, min: 80 },
        [AVATAR_SEED_FIELD.catEarWidth]: { max: 96, min: 82 },
        [AVATAR_SEED_FIELD.coatPatternDensity]: { max: 32, min: 12 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchLength]: { max: 118, min: 88 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY]: { max: 12, min: 4 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { max: 128, min: 98 }
      }
    }
  },
  {
    fixed: {
      catEarHeight: 116,
      catEarWidth: 104,
      coatPattern: {
        algorithm: 'mackerel',
        breakup: 0,
        contrast: 36,
        density: 0,
        enabled: false,
        jitter: 0,
        lightPatchOffsetY: 12,
        lightPatchShape: 'face-mask',
        symmetry: 100,
        thickness: 84
      },
      paletteId: 'russian-blue'
    },
    followByDefault: [
      AVATAR_SEED_FIELD.catEarWidth,
      AVATAR_SEED_FIELD.catEarHeight
    ],
    id: 'russian-blue',
    label: 'Russian Blue',
    seedDomain: {
      coatAlgorithms: ['mackerel'],
      lightPatchShapes: ['face-mask'],
      paletteIds: ['russian-blue'],
      ranges: {
        [AVATAR_SEED_FIELD.catEarHeight]: { max: 122, min: 106 },
        [AVATAR_SEED_FIELD.catEarWidth]: { max: 112, min: 98 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchLength]: { max: 112, min: 84 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY]: { max: 16, min: 8 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { max: 116, min: 88 }
      }
    }
  },
  {
    fixed: {
      catEarHeight: 100,
      catEarWidth: 100,
      coatPattern: {
        algorithm: 'mackerel',
        breakup: 22,
        contrast: 74,
        density: 72,
        enabled: true,
        jitter: 48,
        lightPatchOffsetY: 8,
        lightPatchShape: 'face-mask',
        symmetry: 78,
        thickness: 94
      },
      paletteId: 'orange-tabby'
    },
    followByDefault: [
      AVATAR_SEED_FIELD.coatPatternAlgorithm,
      AVATAR_SEED_FIELD.coatPatternSeed,
      AVATAR_SEED_FIELD.coatPatternDensity,
      AVATAR_SEED_FIELD.coatPatternJitter,
      AVATAR_SEED_FIELD.coatPatternLightPatchLength,
      AVATAR_SEED_FIELD.coatPatternLightPatchWidth,
      AVATAR_SEED_FIELD.coatPatternThickness
    ],
    id: 'orange-tabby',
    label: 'Orange Tabby',
    seedDomain: {
      coatAlgorithms: ['mackerel', 'classic'],
      lightPatchShapes: ['face-mask'],
      paletteIds: ['orange-tabby'],
      ranges: {
        [AVATAR_SEED_FIELD.catEarHeight]: { max: 108, min: 92 },
        [AVATAR_SEED_FIELD.catEarWidth]: { max: 108, min: 92 },
        [AVATAR_SEED_FIELD.coatPatternDensity]: { max: 82, min: 60 },
        [AVATAR_SEED_FIELD.coatPatternJitter]: { max: 75, min: 30 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchLength]: { max: 105, min: 78 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY]: { max: 10, min: 6 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { max: 125, min: 90 },
        [AVATAR_SEED_FIELD.coatPatternThickness]: { max: 105, min: 82 }
      }
    }
  },
  {
    fixed: {
      catEarHeight: 104,
      catEarWidth: 100,
      coatPattern: {
        algorithm: 'mackerel',
        breakup: 0,
        contrast: 100,
        density: 0,
        enabled: true,
        jitter: 0,
        lightPatchOffsetY: 0,
        lightPatchShape: 'face-mask',
        symmetry: 100,
        thickness: 90
      },
      paletteId: 'cow-cat'
    },
    followByDefault: [
      AVATAR_SEED_FIELD.coatPatternLightPatchLength,
      AVATAR_SEED_FIELD.coatPatternLightPatchWidth
    ],
    id: 'cow-cat',
    label: 'Cow Cat',
    previewBackground: '#f5f1e7',
    seedDomain: {
      coatAlgorithms: ['mackerel'],
      lightPatchShapes: ['face-mask'],
      paletteIds: ['cow-cat'],
      ranges: {
        [AVATAR_SEED_FIELD.coatPatternLightPatchLength]: { max: 132, min: 112 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY]: { max: 0, min: 0 },
        [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { max: 132, min: 112 }
      }
    }
  },
  {
    fixed: {
      catEarHeight: 106,
      catEarWidth: 102,
      coatPattern: {
        algorithm: 'mackerel',
        breakup: 0,
        contrast: 30,
        density: 0,
        enabled: false,
        jitter: 0,
        lightPatchOffsetY: 0,
        lightPatchShape: 'face-mask',
        symmetry: 100,
        thickness: 90
      },
      paletteId: 'black-cat'
    },
    followByDefault: [
      AVATAR_SEED_FIELD.catEarWidth,
      AVATAR_SEED_FIELD.catEarHeight
    ],
    id: 'black-cat',
    label: 'Black Cat',
    previewBackground: '#eef2f5',
    seedDomain: {
      paletteIds: ['black-cat'],
      ranges: {
        [AVATAR_SEED_FIELD.catEarHeight]: { max: 112, min: 100 },
        [AVATAR_SEED_FIELD.catEarWidth]: { max: 108, min: 96 }
      }
    }
  }
] as const

export const getAvatarCatBreedTemplate = (id: string | null | undefined) => (
  AVATAR_CAT_BREED_TEMPLATES.find(template => template.id === id) ?? null
)

export const isAvatarCatBreedTemplateId = (value: unknown): value is AvatarCatBreedTemplateId => (
  typeof value === 'string' && AVATAR_CAT_BREED_TEMPLATE_IDS.some(id => id === value)
)

export interface ResolvedAvatarCatBreedTemplate {
  readonly catEarHeight: number
  readonly catEarWidth: number
  readonly coatPattern: AvatarCoatPattern
  readonly entityParts: readonly AvatarEntityPart[]
  readonly paletteId: string
}

export const resolveAvatarCatBreedTemplate = (
  template: AvatarCatBreedTemplate,
  seed: string,
  currentCoatPattern: AvatarCoatPattern = DEFAULT_AVATAR_COAT_PATTERN
): ResolvedAvatarCatBreedTemplate => {
  const fixedCoatPattern: AvatarCoatPattern = {
    ...DEFAULT_AVATAR_COAT_PATTERN,
    ...currentCoatPattern,
    ...template.fixed.coatPattern
  }
  const coatPattern = resolveSeededAvatarCoatPattern(
    seed,
    fixedCoatPattern,
    template.followByDefault,
    template.seedDomain
  )
  const catEarWidth = template.followByDefault.includes(AVATAR_SEED_FIELD.catEarWidth)
    ? resolveSeededAvatarCatEarScale(seed, 'width', template.seedDomain)
    : template.fixed.catEarWidth
  const catEarHeight = template.followByDefault.includes(AVATAR_SEED_FIELD.catEarHeight)
    ? resolveSeededAvatarCatEarScale(seed, 'height', template.seedDomain)
    : template.fixed.catEarHeight
  const palette = getAvatarPalette(template.fixed.paletteId)
  const entityParts = applyAvatarEntityPalette(
    applyCatEarScale(
      createAvatarEntityParts('cat'),
      catEarWidth,
      catEarHeight
    ),
    palette
  )
  return {
    catEarHeight,
    catEarWidth,
    coatPattern,
    entityParts,
    paletteId: template.fixed.paletteId
  }
}

export const AVATAR_DOG_BREED_TEMPLATE_IDS = [
  'shiba-inu',
  'husky',
  'corgi',
  'golden-retriever',
  'border-collie',
  'dalmatian'
] as const

export type AvatarDogBreedTemplateId = (typeof AVATAR_DOG_BREED_TEMPLATE_IDS)[number]

export interface AvatarDogBreedTemplate {
  readonly earStyle: 'floppy' | 'half-drop' | 'upright'
  readonly fixed: {
    readonly coatPattern: Partial<AvatarCoatPattern>
    readonly dogEarHeight: number
    readonly dogEarWidth: number
    readonly dogHeadHeight: number
    readonly dogHeadWidth: number
    readonly paletteId: string
  }
  readonly followByDefault: readonly AvatarSeedField[]
  readonly id: AvatarDogBreedTemplateId
  readonly label: string
  readonly previewBackground?: string
  readonly seedDomain: AvatarSeedDomain
}

export const AVATAR_DOG_BREED_CONTROLLED_FIELDS = [
  AVATAR_SEED_FIELD.palette,
  AVATAR_SEED_FIELD.dogEarWidth,
  AVATAR_SEED_FIELD.dogEarHeight,
  AVATAR_SEED_FIELD.dogHeadWidth,
  AVATAR_SEED_FIELD.dogHeadHeight,
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
] as const satisfies readonly AvatarSeedField[]

const DOG_COAT_BASE = {
  algorithm: 'mackerel' as const,
  breakup: 0,
  contrast: 88,
  density: 0,
  enabled: true,
  jitter: 0,
  lightPatchLength: 100,
  lightPatchOffsetY: 0,
  lightPatchShape: 'face-mask' as const,
  lightPatchWidth: 100,
  symmetry: 100,
  thickness: 100
}

export const AVATAR_DOG_BREED_TEMPLATES: readonly AvatarDogBreedTemplate[] = [
  {
    earStyle: 'upright',
    fixed: { coatPattern: { ...DOG_COAT_BASE, lightPatchLength: 96, lightPatchWidth: 104 }, dogEarHeight: 118, dogEarWidth: 104, dogHeadHeight: 96, dogHeadWidth: 102, paletteId: 'shiba-inu' },
    followByDefault: [AVATAR_SEED_FIELD.dogEarWidth, AVATAR_SEED_FIELD.dogEarHeight, AVATAR_SEED_FIELD.dogHeadWidth, AVATAR_SEED_FIELD.dogHeadHeight, AVATAR_SEED_FIELD.coatPatternLightPatchWidth],
    id: 'shiba-inu', label: 'Shiba Inu',
    seedDomain: { paletteIds: ['shiba-inu'], ranges: {
      [AVATAR_SEED_FIELD.dogEarWidth]: { min: 98, max: 110 },
      [AVATAR_SEED_FIELD.dogEarHeight]: { min: 112, max: 126 },
      [AVATAR_SEED_FIELD.dogHeadWidth]: { min: 96, max: 108 },
      [AVATAR_SEED_FIELD.dogHeadHeight]: { min: 90, max: 102 },
      [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { min: 94, max: 112 }
    } }
  },
  {
    earStyle: 'upright',
    fixed: { coatPattern: { ...DOG_COAT_BASE, lightPatchLength: 132, lightPatchWidth: 122 }, dogEarHeight: 122, dogEarWidth: 108, dogHeadHeight: 110, dogHeadWidth: 106, paletteId: 'husky' },
    followByDefault: [AVATAR_SEED_FIELD.dogEarWidth, AVATAR_SEED_FIELD.dogEarHeight, AVATAR_SEED_FIELD.dogHeadWidth, AVATAR_SEED_FIELD.dogHeadHeight, AVATAR_SEED_FIELD.coatPatternLightPatchLength, AVATAR_SEED_FIELD.coatPatternLightPatchWidth],
    id: 'husky', label: 'Husky',
    seedDomain: { paletteIds: ['husky'], ranges: {
      [AVATAR_SEED_FIELD.dogEarWidth]: { min: 102, max: 114 },
      [AVATAR_SEED_FIELD.dogEarHeight]: { min: 114, max: 130 },
      [AVATAR_SEED_FIELD.dogHeadWidth]: { min: 100, max: 112 },
      [AVATAR_SEED_FIELD.dogHeadHeight]: { min: 102, max: 116 },
      [AVATAR_SEED_FIELD.coatPatternLightPatchLength]: { min: 120, max: 144 },
      [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { min: 112, max: 132 }
    } }
  },
  {
    earStyle: 'upright',
    fixed: { coatPattern: { ...DOG_COAT_BASE, lightPatchLength: 116, lightPatchWidth: 94 }, dogEarHeight: 146, dogEarWidth: 128, dogHeadHeight: 90, dogHeadWidth: 120, paletteId: 'corgi' },
    followByDefault: [AVATAR_SEED_FIELD.dogEarWidth, AVATAR_SEED_FIELD.dogEarHeight, AVATAR_SEED_FIELD.dogHeadWidth, AVATAR_SEED_FIELD.dogHeadHeight, AVATAR_SEED_FIELD.coatPatternLightPatchWidth],
    id: 'corgi', label: 'Corgi',
    seedDomain: { paletteIds: ['corgi'], ranges: {
      [AVATAR_SEED_FIELD.dogEarWidth]: { min: 120, max: 136 },
      [AVATAR_SEED_FIELD.dogEarHeight]: { min: 136, max: 154 },
      [AVATAR_SEED_FIELD.dogHeadWidth]: { min: 112, max: 128 },
      [AVATAR_SEED_FIELD.dogHeadHeight]: { min: 84, max: 98 },
      [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { min: 86, max: 104 }
    } }
  },
  {
    earStyle: 'floppy',
    fixed: { coatPattern: { ...DOG_COAT_BASE, lightPatchLength: 100, lightPatchWidth: 112 }, dogEarHeight: 136, dogEarWidth: 118, dogHeadHeight: 102, dogHeadWidth: 112, paletteId: 'golden-retriever' },
    followByDefault: [AVATAR_SEED_FIELD.dogEarWidth, AVATAR_SEED_FIELD.dogEarHeight, AVATAR_SEED_FIELD.dogHeadWidth, AVATAR_SEED_FIELD.dogHeadHeight, AVATAR_SEED_FIELD.coatPatternLightPatchWidth],
    id: 'golden-retriever', label: 'Golden Retriever',
    seedDomain: { paletteIds: ['golden-retriever'], ranges: {
      [AVATAR_SEED_FIELD.dogEarWidth]: { min: 110, max: 126 },
      [AVATAR_SEED_FIELD.dogEarHeight]: { min: 124, max: 146 },
      [AVATAR_SEED_FIELD.dogHeadWidth]: { min: 106, max: 120 },
      [AVATAR_SEED_FIELD.dogHeadHeight]: { min: 96, max: 110 },
      [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { min: 102, max: 122 }
    } }
  },
  {
    earStyle: 'half-drop',
    fixed: { coatPattern: { ...DOG_COAT_BASE, lightPatchLength: 126, lightPatchWidth: 92 }, dogEarHeight: 112, dogEarWidth: 106, dogHeadHeight: 108, dogHeadWidth: 98, paletteId: 'border-collie' },
    followByDefault: [AVATAR_SEED_FIELD.dogEarWidth, AVATAR_SEED_FIELD.dogEarHeight, AVATAR_SEED_FIELD.dogHeadWidth, AVATAR_SEED_FIELD.dogHeadHeight, AVATAR_SEED_FIELD.coatPatternLightPatchWidth],
    id: 'border-collie', label: 'Border Collie',
    seedDomain: { paletteIds: ['border-collie'], ranges: {
      [AVATAR_SEED_FIELD.dogEarWidth]: { min: 98, max: 114 },
      [AVATAR_SEED_FIELD.dogEarHeight]: { min: 104, max: 122 },
      [AVATAR_SEED_FIELD.dogHeadWidth]: { min: 92, max: 104 },
      [AVATAR_SEED_FIELD.dogHeadHeight]: { min: 102, max: 116 },
      [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { min: 82, max: 104 }
    } }
  },
  {
    earStyle: 'floppy',
    fixed: { coatPattern: { ...DOG_COAT_BASE, density: 60, lightPatchLength: 100, lightPatchWidth: 100, thickness: 98 }, dogEarHeight: 124, dogEarWidth: 104, dogHeadHeight: 106, dogHeadWidth: 104, paletteId: 'dalmatian' },
    followByDefault: [AVATAR_SEED_FIELD.dogEarWidth, AVATAR_SEED_FIELD.dogEarHeight, AVATAR_SEED_FIELD.dogHeadWidth, AVATAR_SEED_FIELD.dogHeadHeight, AVATAR_SEED_FIELD.coatPatternSeed, AVATAR_SEED_FIELD.coatPatternDensity],
    id: 'dalmatian', label: 'Dalmatian', previewBackground: '#536f86',
    seedDomain: { paletteIds: ['dalmatian'], ranges: {
      [AVATAR_SEED_FIELD.dogEarWidth]: { min: 96, max: 112 },
      [AVATAR_SEED_FIELD.dogEarHeight]: { min: 116, max: 136 },
      [AVATAR_SEED_FIELD.dogHeadWidth]: { min: 98, max: 112 },
      [AVATAR_SEED_FIELD.dogHeadHeight]: { min: 100, max: 114 },
      [AVATAR_SEED_FIELD.coatPatternDensity]: { min: 46, max: 78 }
    } }
  }
] as const

export const getAvatarDogBreedTemplate = (id: string | null | undefined) => (
  AVATAR_DOG_BREED_TEMPLATES.find(template => template.id === id) ?? null
)

export const isAvatarDogBreedTemplateId = (value: unknown): value is AvatarDogBreedTemplateId => (
  typeof value === 'string' && AVATAR_DOG_BREED_TEMPLATE_IDS.some(id => id === value)
)

export interface ResolvedAvatarDogBreedTemplate {
  readonly coatPattern: AvatarCoatPattern
  readonly dogEarHeight: number
  readonly dogEarWidth: number
  readonly dogHeadHeight: number
  readonly dogHeadWidth: number
  readonly entityParts: readonly AvatarEntityPart[]
  readonly paletteId: string
}

const applyDogEarStyle = (
  parts: readonly AvatarEntityPart[],
  style: AvatarDogBreedTemplate['earStyle']
): AvatarEntityPart[] => parts.map(part => {
  if (part.id !== 'ear-left' && part.id !== 'ear-right') return part
  const left = part.id === 'ear-left'
  if (style === 'upright') return {
    ...part, shape: 'cone', roundness: 50, rotationZ: left ? -8 : 8, x: left ? -60 : 60, y: -78, z: -10
  }
  if (style === 'half-drop') return {
    ...part, shape: 'teardrop', roundness: 70, rotationZ: left ? 42 : -42, x: left ? -68 : 68, y: -60, z: -7
  }
  return {
    ...part, shape: 'teardrop', roundness: 82, rotationZ: left ? 30 : -30, x: left ? -78 : 78, y: -48, z: -5
  }
})

export const resolveAvatarDogBreedTemplate = (
  template: AvatarDogBreedTemplate,
  seed: string,
  currentCoatPattern: AvatarCoatPattern = DEFAULT_AVATAR_COAT_PATTERN
): ResolvedAvatarDogBreedTemplate => {
  const fixedCoatPattern: AvatarCoatPattern = { ...DEFAULT_AVATAR_COAT_PATTERN, ...currentCoatPattern, ...template.fixed.coatPattern }
  const coatPattern = resolveSeededAvatarCoatPattern(seed, fixedCoatPattern, template.followByDefault, template.seedDomain)
  const dogEarWidth = template.followByDefault.includes(AVATAR_SEED_FIELD.dogEarWidth)
    ? resolveSeededAvatarDogEarScale(seed, 'width', template.seedDomain)
    : template.fixed.dogEarWidth
  const dogEarHeight = template.followByDefault.includes(AVATAR_SEED_FIELD.dogEarHeight)
    ? resolveSeededAvatarDogEarScale(seed, 'height', template.seedDomain)
    : template.fixed.dogEarHeight
  const dogHeadWidth = template.followByDefault.includes(AVATAR_SEED_FIELD.dogHeadWidth)
    ? resolveSeededAvatarDogHeadScale(seed, 'width', template.seedDomain)
    : template.fixed.dogHeadWidth
  const dogHeadHeight = template.followByDefault.includes(AVATAR_SEED_FIELD.dogHeadHeight)
    ? resolveSeededAvatarDogHeadScale(seed, 'height', template.seedDomain)
    : template.fixed.dogHeadHeight
  const palette = getAvatarPalette(template.fixed.paletteId)
  const entityParts = applyDogEarStyle(applyAvatarEntityPalette(
    applyDogHeadScale(
      applyDogEarScale(createAvatarEntityParts('dog'), dogEarWidth, dogEarHeight),
      dogHeadWidth,
      dogHeadHeight
    ),
    palette
  ), template.earStyle)
  return {
    coatPattern,
    dogEarHeight,
    dogEarWidth,
    dogHeadHeight,
    dogHeadWidth,
    entityParts,
    paletteId: template.fixed.paletteId
  }
}
