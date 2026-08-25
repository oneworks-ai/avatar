import { DEFAULT_AVATAR_COAT_PATTERN, getAvatarPalette } from '@oneworks/avatar'
import type { AvatarCoatPattern } from '@oneworks/avatar'

import {
  applyAvatarEntityPalette,
  applyCatEarScale,
  applyDogEarScale,
  applyDogEarStyle,
  applyDogHeadScale,
  applyBearEarScale,
  applyBearEarStyle,
  applyBearHeadScale,
  applyRabbitEarScale,
  applyRabbitEarStyle,
  applyRabbitHeadScale,
  createAvatarEntityParts,
  resolveAvatarEntityPresetFaceStyle
} from './avatarEntityPresets'
import type {
  AvatarBearEarStyle,
  AvatarDogEarStyle,
  AvatarEntityFaceStyleOverride,
  AvatarEntityPart,
  AvatarRabbitEarStyle
} from './avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type { AvatarFaceStyle } from './avatarGeometry'
import {
  AVATAR_SEED_FIELD,
  resolveSeededAvatarCatEarScale,
  resolveSeededAvatarDogEarScale,
  resolveSeededAvatarDogHeadScale,
  resolveSeededAvatarBearEarScale,
  resolveSeededAvatarBearHeadScale,
  resolveSeededAvatarRabbitEarScale,
  resolveSeededAvatarRabbitHeadScale,
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
  readonly earStyle: AvatarDogEarStyle
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
  const entityParts = applyAvatarEntityPalette(applyDogHeadScale(
    applyDogEarStyle(
      applyDogEarScale(createAvatarEntityParts('dog'), dogEarWidth, dogEarHeight),
      template.earStyle
    ),
    dogHeadWidth,
    dogHeadHeight
  ), palette)
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

export const AVATAR_RABBIT_BREED_TEMPLATE_IDS = [
  'holland-lop', 'netherland-dwarf', 'dutch-rabbit', 'himalayan-rabbit', 'lionhead-rabbit', 'english-spot'
] as const
export type AvatarRabbitBreedTemplateId = (typeof AVATAR_RABBIT_BREED_TEMPLATE_IDS)[number]
export interface AvatarRabbitBreedTemplate {
  readonly earStyle: AvatarRabbitEarStyle
  readonly fixed: { readonly coatPattern: Partial<AvatarCoatPattern>; readonly rabbitEarHeight: number; readonly rabbitEarWidth: number; readonly rabbitHeadHeight: number; readonly rabbitHeadWidth: number; readonly paletteId: string }
  readonly followByDefault: readonly AvatarSeedField[]
  readonly id: AvatarRabbitBreedTemplateId
  readonly label: string
  readonly previewBackground?: string
  readonly seedDomain: AvatarSeedDomain
}
export const AVATAR_RABBIT_BREED_CONTROLLED_FIELDS = [
  AVATAR_SEED_FIELD.palette, AVATAR_SEED_FIELD.rabbitEarWidth, AVATAR_SEED_FIELD.rabbitEarHeight, AVATAR_SEED_FIELD.rabbitHeadWidth, AVATAR_SEED_FIELD.rabbitHeadHeight,
  AVATAR_SEED_FIELD.coatPatternAlgorithm, AVATAR_SEED_FIELD.coatPatternSeed, AVATAR_SEED_FIELD.coatPatternDensity, AVATAR_SEED_FIELD.coatPatternJitter,
  AVATAR_SEED_FIELD.coatPatternLightPatchLength, AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY, AVATAR_SEED_FIELD.coatPatternLightPatchWidth, AVATAR_SEED_FIELD.coatPatternLightPatchShape,
  AVATAR_SEED_FIELD.coatPatternThickness, AVATAR_SEED_FIELD.coatPatternSymmetry, AVATAR_SEED_FIELD.coatPatternContrast, AVATAR_SEED_FIELD.coatPatternBreakup
] as const satisfies readonly AvatarSeedField[]
const RABBIT_COAT = { ...DOG_COAT_BASE, density: 0, thickness: 90 }
const rabbitTemplate = (id: AvatarRabbitBreedTemplateId, label: string, earStyle: AvatarRabbitEarStyle, paletteId: string, ears: readonly [number, number], head: readonly [number, number], followByDefault: readonly AvatarSeedField[], ranges: AvatarSeedDomain['ranges'], coatPattern: Partial<AvatarCoatPattern> = {}, previewBackground?: string): AvatarRabbitBreedTemplate => ({
  earStyle, fixed: { coatPattern: { ...RABBIT_COAT, ...coatPattern }, paletteId, rabbitEarHeight: ears[1], rabbitEarWidth: ears[0], rabbitHeadHeight: head[1], rabbitHeadWidth: head[0] }, followByDefault, id, label, previewBackground, seedDomain: { paletteIds: [paletteId], ranges }
})
export const AVATAR_RABBIT_BREED_TEMPLATES: readonly AvatarRabbitBreedTemplate[] = [
  rabbitTemplate('holland-lop', 'Holland Lop', 'lop', 'holland-lop', [118, 126], [112, 104], [AVATAR_SEED_FIELD.rabbitEarWidth, AVATAR_SEED_FIELD.rabbitEarHeight, AVATAR_SEED_FIELD.rabbitHeadWidth], { [AVATAR_SEED_FIELD.rabbitEarWidth]: { min: 108, max: 128 }, [AVATAR_SEED_FIELD.rabbitEarHeight]: { min: 116, max: 140 }, [AVATAR_SEED_FIELD.rabbitHeadWidth]: { min: 106, max: 118 } }, { lightPatchWidth: 108 }),
  rabbitTemplate('netherland-dwarf', 'Netherland Dwarf', 'compact', 'netherland-dwarf', [82, 78], [92, 88], [AVATAR_SEED_FIELD.rabbitEarWidth, AVATAR_SEED_FIELD.rabbitEarHeight, AVATAR_SEED_FIELD.rabbitHeadWidth, AVATAR_SEED_FIELD.rabbitHeadHeight], { [AVATAR_SEED_FIELD.rabbitEarWidth]: { min: 74, max: 90 }, [AVATAR_SEED_FIELD.rabbitEarHeight]: { min: 70, max: 88 }, [AVATAR_SEED_FIELD.rabbitHeadWidth]: { min: 88, max: 98 }, [AVATAR_SEED_FIELD.rabbitHeadHeight]: { min: 84, max: 94 } }, { lightPatchWidth: 88 }),
  rabbitTemplate('dutch-rabbit', 'Dutch Rabbit', 'dutch', 'dutch-rabbit', [98, 108], [104, 102], [AVATAR_SEED_FIELD.rabbitEarHeight, AVATAR_SEED_FIELD.rabbitHeadWidth, AVATAR_SEED_FIELD.coatPatternLightPatchWidth], { [AVATAR_SEED_FIELD.rabbitEarHeight]: { min: 100, max: 116 }, [AVATAR_SEED_FIELD.rabbitHeadWidth]: { min: 98, max: 110 }, [AVATAR_SEED_FIELD.coatPatternLightPatchWidth]: { min: 92, max: 110 } }, { lightPatchWidth: 100 }),
  rabbitTemplate('himalayan-rabbit', 'Himalayan Rabbit', 'himalayan', 'himalayan-rabbit', [94, 112], [100, 100], [AVATAR_SEED_FIELD.rabbitEarHeight, AVATAR_SEED_FIELD.coatPatternLightPatchLength], { [AVATAR_SEED_FIELD.rabbitEarHeight]: { min: 104, max: 122 }, [AVATAR_SEED_FIELD.coatPatternLightPatchLength]: { min: 96, max: 112 } }, { lightPatchLength: 104, lightPatchWidth: 96 }),
  rabbitTemplate('lionhead-rabbit', 'Lionhead Rabbit', 'lionhead', 'lionhead-rabbit', [110, 116], [122, 116], [AVATAR_SEED_FIELD.rabbitEarWidth, AVATAR_SEED_FIELD.rabbitHeadWidth, AVATAR_SEED_FIELD.rabbitHeadHeight], { [AVATAR_SEED_FIELD.rabbitEarWidth]: { min: 102, max: 120 }, [AVATAR_SEED_FIELD.rabbitHeadWidth]: { min: 114, max: 130 }, [AVATAR_SEED_FIELD.rabbitHeadHeight]: { min: 108, max: 124 } }, { lightPatchWidth: 112 }),
  rabbitTemplate('english-spot', 'English Spot', 'spotted', 'english-spot', [100, 110], [104, 104], [AVATAR_SEED_FIELD.rabbitEarWidth, AVATAR_SEED_FIELD.rabbitEarHeight, AVATAR_SEED_FIELD.coatPatternSeed, AVATAR_SEED_FIELD.coatPatternDensity], { [AVATAR_SEED_FIELD.rabbitEarWidth]: { min: 94, max: 108 }, [AVATAR_SEED_FIELD.rabbitEarHeight]: { min: 102, max: 120 }, [AVATAR_SEED_FIELD.coatPatternDensity]: { min: 40, max: 68 } }, { density: 54, thickness: 88 }, '#73879a')
]
export const getAvatarRabbitBreedTemplate = (id: string | null | undefined) => AVATAR_RABBIT_BREED_TEMPLATES.find(template => template.id === id) ?? null
export const isAvatarRabbitBreedTemplateId = (value: unknown): value is AvatarRabbitBreedTemplateId => typeof value === 'string' && AVATAR_RABBIT_BREED_TEMPLATE_IDS.some(id => id === value)
export interface ResolvedAvatarRabbitBreedTemplate { readonly coatPattern: AvatarCoatPattern; readonly rabbitEarHeight: number; readonly rabbitEarWidth: number; readonly rabbitHeadHeight: number; readonly rabbitHeadWidth: number; readonly entityParts: readonly AvatarEntityPart[]; readonly paletteId: string }
export const resolveAvatarRabbitBreedTemplate = (template: AvatarRabbitBreedTemplate, seed: string, currentCoatPattern: AvatarCoatPattern = DEFAULT_AVATAR_COAT_PATTERN): ResolvedAvatarRabbitBreedTemplate => {
  const coatPattern = resolveSeededAvatarCoatPattern(seed, { ...DEFAULT_AVATAR_COAT_PATTERN, ...currentCoatPattern, ...template.fixed.coatPattern }, template.followByDefault, template.seedDomain)
  const ear = (field: 'height' | 'width') => template.followByDefault.includes(field === 'width' ? AVATAR_SEED_FIELD.rabbitEarWidth : AVATAR_SEED_FIELD.rabbitEarHeight) ? resolveSeededAvatarRabbitEarScale(seed, field, template.seedDomain) : field === 'width' ? template.fixed.rabbitEarWidth : template.fixed.rabbitEarHeight
  const head = (field: 'height' | 'width') => template.followByDefault.includes(field === 'width' ? AVATAR_SEED_FIELD.rabbitHeadWidth : AVATAR_SEED_FIELD.rabbitHeadHeight) ? resolveSeededAvatarRabbitHeadScale(seed, field, template.seedDomain) : field === 'width' ? template.fixed.rabbitHeadWidth : template.fixed.rabbitHeadHeight
  const rabbitEarWidth = ear('width'), rabbitEarHeight = ear('height'), rabbitHeadWidth = head('width'), rabbitHeadHeight = head('height')
  const entityParts = applyAvatarEntityPalette(applyRabbitHeadScale(applyRabbitEarStyle(applyRabbitEarScale(createAvatarEntityParts('rabbit'), rabbitEarWidth, rabbitEarHeight), template.earStyle), rabbitHeadWidth, rabbitHeadHeight), getAvatarPalette(template.fixed.paletteId))
  return { coatPattern, rabbitEarHeight, rabbitEarWidth, rabbitHeadHeight, rabbitHeadWidth, entityParts, paletteId: template.fixed.paletteId }
}

export const AVATAR_BEAR_BREED_TEMPLATE_IDS = ['brown-bear', 'polar-bear', 'asian-black-bear', 'giant-panda', 'spectacled-bear', 'sun-bear', 'red-panda', 'koala', 'raccoon', 'wombat', 'teddy-bear'] as const
export type AvatarBearBreedTemplateId = (typeof AVATAR_BEAR_BREED_TEMPLATE_IDS)[number]
export interface AvatarBearBreedTemplate {
  readonly earStyle: AvatarBearEarStyle
  readonly fixed: { readonly bearEarHeight: number; readonly bearEarWidth: number; readonly bearHeadHeight: number; readonly bearHeadWidth: number; readonly coatPattern: Partial<AvatarCoatPattern>; readonly faceStyle?: AvatarEntityFaceStyleOverride; readonly foregroundColor?: string; readonly paletteId: string }
  readonly followByDefault: readonly AvatarSeedField[]
  readonly id: AvatarBearBreedTemplateId
  readonly label: string
  readonly previewBackground?: string
  readonly seedDomain: AvatarSeedDomain
}
export const AVATAR_BEAR_BREED_CONTROLLED_FIELDS = [
  AVATAR_SEED_FIELD.palette, AVATAR_SEED_FIELD.bearEarWidth, AVATAR_SEED_FIELD.bearEarHeight, AVATAR_SEED_FIELD.bearHeadWidth, AVATAR_SEED_FIELD.bearHeadHeight,
  AVATAR_SEED_FIELD.coatPatternAlgorithm, AVATAR_SEED_FIELD.coatPatternSeed, AVATAR_SEED_FIELD.coatPatternDensity, AVATAR_SEED_FIELD.coatPatternJitter,
  AVATAR_SEED_FIELD.coatPatternLightPatchLength, AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY, AVATAR_SEED_FIELD.coatPatternLightPatchWidth, AVATAR_SEED_FIELD.coatPatternLightPatchShape,
  AVATAR_SEED_FIELD.coatPatternThickness, AVATAR_SEED_FIELD.coatPatternSymmetry, AVATAR_SEED_FIELD.coatPatternContrast, AVATAR_SEED_FIELD.coatPatternBreakup
] as const satisfies readonly AvatarSeedField[]
const BEAR_COAT = { ...DOG_COAT_BASE, density: 0, jitter: 0, thickness: 92, symmetry: 100, breakup: 0, contrast: 88, lightPatchOffsetY: 0, lightPatchShape: 'face-mask' as const }
const bearTemplate = (id: AvatarBearBreedTemplateId, label: string, earStyle: AvatarBearEarStyle, paletteId: string, ears: readonly [number, number], head: readonly [number, number], followByDefault: readonly AvatarSeedField[], ranges: AvatarSeedDomain['ranges'], coatPattern: Partial<AvatarCoatPattern> = {}, previewBackground?: string, foregroundColor?: string, faceStyle?: AvatarEntityFaceStyleOverride): AvatarBearBreedTemplate => ({
  earStyle, fixed: { bearEarHeight: ears[1], bearEarWidth: ears[0], bearHeadHeight: head[1], bearHeadWidth: head[0], coatPattern: { ...BEAR_COAT, ...coatPattern }, ...(faceStyle == null ? {} : { faceStyle }), ...(foregroundColor == null ? {} : { foregroundColor }), paletteId }, followByDefault, id, label, previewBackground, seedDomain: { paletteIds: [paletteId], ranges }
})
const bearRange = (earWidth: readonly [number, number], earHeight: readonly [number, number], headWidth: readonly [number, number], headHeight: readonly [number, number]) => ({
  [AVATAR_SEED_FIELD.bearEarWidth]: { min: earWidth[0], max: earWidth[1] }, [AVATAR_SEED_FIELD.bearEarHeight]: { min: earHeight[0], max: earHeight[1] }, [AVATAR_SEED_FIELD.bearHeadWidth]: { min: headWidth[0], max: headWidth[1] }, [AVATAR_SEED_FIELD.bearHeadHeight]: { min: headHeight[0], max: headHeight[1] }
})
export const AVATAR_BEAR_BREED_TEMPLATES: readonly AvatarBearBreedTemplate[] = [
  bearTemplate('brown-bear', 'Brown Bear', 'teddy', 'brown-bear', [105, 98], [112, 108], [AVATAR_SEED_FIELD.bearEarWidth, AVATAR_SEED_FIELD.bearHeadWidth], bearRange([96, 112], [92, 104], [106, 120], [102, 114])),
  bearTemplate('polar-bear', 'Polar Bear', 'compact', 'polar-bear', [82, 78], [116, 104], [AVATAR_SEED_FIELD.bearHeadWidth, AVATAR_SEED_FIELD.bearHeadHeight], bearRange([76, 90], [72, 86], [110, 126], [98, 112]), {}, '#687c86'),
  bearTemplate('asian-black-bear', 'Asian Black Bear', 'pointed', 'asian-black-bear', [92, 92], [106, 108], [AVATAR_SEED_FIELD.bearEarHeight, AVATAR_SEED_FIELD.bearHeadWidth], bearRange([84, 100], [86, 100], [100, 114], [102, 114]), {}, '#e8decc'),
  bearTemplate('giant-panda', 'Giant Panda', 'panda', 'giant-panda', [118, 110], [116, 112], [AVATAR_SEED_FIELD.bearEarWidth, AVATAR_SEED_FIELD.bearHeadWidth], bearRange([108, 128], [102, 118], [108, 124], [104, 118])),
  bearTemplate('spectacled-bear', 'Spectacled Bear', 'teddy', 'spectacled-bear', [92, 92], [108, 110], [AVATAR_SEED_FIELD.bearHeadWidth], bearRange([84, 100], [84, 100], [102, 116], [104, 116]), {}, '#e8decc', '#241711'),
  bearTemplate('sun-bear', 'Sun Bear', 'compact', 'sun-bear', [76, 80], [98, 112], [AVATAR_SEED_FIELD.bearEarHeight, AVATAR_SEED_FIELD.bearHeadHeight], bearRange([70, 84], [74, 88], [92, 106], [106, 120]), {}, '#e8decc'),
  bearTemplate('red-panda', 'Red Panda', 'pointed', 'red-panda', [108, 106], [106, 110], [AVATAR_SEED_FIELD.bearEarWidth, AVATAR_SEED_FIELD.bearHeadWidth], bearRange([98, 120], [98, 116], [98, 116], [104, 116])),
  bearTemplate('koala', 'Koala', 'koala', 'koala', [132, 124], [108, 110], [AVATAR_SEED_FIELD.bearEarWidth, AVATAR_SEED_FIELD.bearEarHeight], bearRange([120, 145], [114, 136], [102, 114], [104, 116]), {}, undefined, undefined, {
    mouthEnabled: false,
    noseEnabled: true,
    noseHeight: 42,
    noseShape: 'ellipse',
    noseWidth: 32,
    noseY: 30
  }),
  bearTemplate('raccoon', 'Raccoon', 'pointed', 'raccoon', [92, 88], [110, 104], [AVATAR_SEED_FIELD.bearHeadWidth, AVATAR_SEED_FIELD.bearHeadHeight], bearRange([84, 100], [82, 96], [104, 118], [98, 112])),
  bearTemplate('wombat', 'Wombat', 'wombat', 'wombat', [78, 70], [124, 96], [AVATAR_SEED_FIELD.bearHeadWidth, AVATAR_SEED_FIELD.bearHeadHeight], bearRange([70, 88], [64, 78], [116, 130], [90, 104])),
  bearTemplate('teddy-bear', 'Teddy Bear', 'teddy', 'teddy-bear', [108, 104], [108, 108], [AVATAR_SEED_FIELD.bearEarWidth, AVATAR_SEED_FIELD.bearHeadWidth, AVATAR_SEED_FIELD.bearHeadHeight], bearRange([98, 118], [96, 112], [102, 118], [102, 118]))
]
export const getAvatarBearBreedTemplate = (id: string | null | undefined) => AVATAR_BEAR_BREED_TEMPLATES.find(template => template.id === id) ?? null
export const isAvatarBearBreedTemplateId = (value: unknown): value is AvatarBearBreedTemplateId => typeof value === 'string' && AVATAR_BEAR_BREED_TEMPLATE_IDS.some(id => id === value)
export const applyAvatarBearBreedForeground = (
  entityParts: readonly AvatarEntityPart[],
  template: AvatarBearBreedTemplate | null | undefined
): readonly AvatarEntityPart[] => {
  const foregroundColor = template?.fixed.foregroundColor
  if (foregroundColor == null || template == null) return entityParts

  const paletteForeground = getAvatarPalette(template.fixed.paletteId).foreground.toLowerCase()
  return entityParts.map(part => (
    part.face && part.foregroundColor.toLowerCase() === paletteForeground
      ? { ...part, foregroundColor }
      : part
  ))
}
export interface ResolvedAvatarBearBreedTemplate { readonly bearEarHeight: number; readonly bearEarWidth: number; readonly bearHeadHeight: number; readonly bearHeadWidth: number; readonly coatPattern: AvatarCoatPattern; readonly entityParts: readonly AvatarEntityPart[]; readonly faceStyle: AvatarFaceStyle; readonly paletteId: string }
export const resolveAvatarBearBreedTemplate = (template: AvatarBearBreedTemplate, seed: string, currentCoatPattern: AvatarCoatPattern = DEFAULT_AVATAR_COAT_PATTERN): ResolvedAvatarBearBreedTemplate => {
  const coatPattern = resolveSeededAvatarCoatPattern(seed, { ...DEFAULT_AVATAR_COAT_PATTERN, ...currentCoatPattern, ...template.fixed.coatPattern }, template.followByDefault, template.seedDomain)
  const ear = (field: 'height' | 'width') => template.followByDefault.includes(field === 'width' ? AVATAR_SEED_FIELD.bearEarWidth : AVATAR_SEED_FIELD.bearEarHeight) ? resolveSeededAvatarBearEarScale(seed, field, template.seedDomain) : field === 'width' ? template.fixed.bearEarWidth : template.fixed.bearEarHeight
  const head = (field: 'height' | 'width') => template.followByDefault.includes(field === 'width' ? AVATAR_SEED_FIELD.bearHeadWidth : AVATAR_SEED_FIELD.bearHeadHeight) ? resolveSeededAvatarBearHeadScale(seed, field, template.seedDomain) : field === 'width' ? template.fixed.bearHeadWidth : template.fixed.bearHeadHeight
  const bearEarWidth = ear('width'), bearEarHeight = ear('height'), bearHeadWidth = head('width'), bearHeadHeight = head('height')
  const entityParts = applyAvatarBearBreedForeground(applyAvatarEntityPalette(applyBearHeadScale(applyBearEarStyle(applyBearEarScale(createAvatarEntityParts('bear'), bearEarWidth, bearEarHeight), template.earStyle), bearHeadWidth, bearHeadHeight), getAvatarPalette(template.fixed.paletteId)), template)
  return { bearEarHeight, bearEarWidth, bearHeadHeight, bearHeadWidth, coatPattern, entityParts, faceStyle: resolveAvatarEntityPresetFaceStyle('bear', template.fixed.faceStyle) ?? DEFAULT_AVATAR_FACE_STYLE, paletteId: template.fixed.paletteId }
}
