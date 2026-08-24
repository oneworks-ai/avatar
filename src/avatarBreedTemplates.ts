import { DEFAULT_AVATAR_COAT_PATTERN, getAvatarPalette } from '@oneworks/avatar'
import type { AvatarCoatPattern } from '@oneworks/avatar'

import {
  applyAvatarEntityPalette,
  applyCatEarScale,
  createAvatarEntityParts
} from './avatarEntityPresets'
import type { AvatarEntityPart } from './avatarEntityPresets'
import {
  AVATAR_SEED_FIELD,
  resolveSeededAvatarCatEarScale,
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
