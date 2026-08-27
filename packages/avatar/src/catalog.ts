export interface AvatarPalette {
  readonly background: string
  readonly foreground: string
  readonly gradient: readonly [string, string]
  readonly id: string
  readonly name: string
  readonly shadow: string
  readonly coat?: {
    readonly mark: string
    /** Declarative coat geometry interpreted by the shared 3D decal resolver. */
    readonly marking?: 'blaze' | 'mask' | 'muzzle' | 'spots' | 'stripes' | 'panda' | 'spectacles' | 'moon' | 'sun' | 'red-panda' | 'raccoon' | 'wombat'
    readonly patch: string
  }
  readonly entityMaterials?: Readonly<Record<string, { readonly baseColor: string; readonly foregroundColor: string; readonly highlightColor: string; readonly shadowColor: string }>>
}

/** A breed-owned, percentage-based fur brightness interval. */
export interface AvatarPaletteToneJitterRange {
  readonly max: number
  readonly min: number
}

const AVATAR_PALETTE_TONE_JITTER_LIMIT = 40

const adjustAvatarPaletteHexTone = (color: string, amount: number): string => {
  if (!/^#[\da-f]{6}$/iu.test(color)) return color
  const scale = 1 + Math.max(-AVATAR_PALETTE_TONE_JITTER_LIMIT, Math.min(AVATAR_PALETTE_TONE_JITTER_LIMIT, amount)) / 100
  const channel = (offset: number) => Math.min(255, Math.max(0,
    Math.round(Number.parseInt(color.slice(offset, offset + 2), 16) * scale)
  )).toString(16).padStart(2, '0')
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

/** Adjusts one authored fur or marking color without changing its hue. */
export const applyAvatarPaletteColorTone = (color: string, amount: number): string => (
  adjustAvatarPaletteHexTone(color, amount)
)

const avatarPaletteToneLuminance = (color: string): number => {
  if (!/^#[\da-f]{6}$/iu.test(color)) return 0
  return (
    Number.parseInt(color.slice(1, 3), 16) * .2126 +
    Number.parseInt(color.slice(3, 5), 16) * .7152 +
    Number.parseInt(color.slice(5, 7), 16) * .0722
  ) / 255
}

/**
 * Derives a complete natural-fur palette without changing its public identity.
 * Eyes, noses, nostrils, and defining dark masks remain deliberately untouched.
 */
export const applyAvatarPaletteToneJitter = (
  palette: AvatarPalette,
  amount: number
): AvatarPalette => {
  const boundedAmount = Number.isFinite(amount)
    ? Math.max(-AVATAR_PALETTE_TONE_JITTER_LIMIT, Math.min(AVATAR_PALETTE_TONE_JITTER_LIMIT, Math.round(amount)))
    : 0
  if (boundedAmount === 0) return palette

  const hasProtectedDarkIdentity = palette.coat?.marking === 'mask' ||
    palette.coat?.marking === 'panda' || palette.coat?.marking === 'spectacles' ||
    palette.coat?.marking === 'raccoon'
  const baseLuminance = avatarPaletteToneLuminance(palette.background)
  const protectDarkIdentity = (color: string) => hasProtectedDarkIdentity &&
    baseLuminance - avatarPaletteToneLuminance(color) > .32
  const adjustPatch = (color: string) => protectDarkIdentity(color)
    ? color
    : adjustAvatarPaletteHexTone(color, boundedAmount * .55)

  const entityMaterials = palette.entityMaterials == null ? undefined : Object.fromEntries(
    Object.entries(palette.entityMaterials).map(([partId, material]) => {
      const isNostril = partId.startsWith('nostril-')
      const isHorn = partId.startsWith('horn-') || partId.startsWith('antler-')
      const isPatch = partId === 'snout'
      const protectedMaterial = isNostril || protectDarkIdentity(material.baseColor)
      const materialAmount = protectedMaterial ? 0 : boundedAmount * (isHorn ? .38 : isPatch ? .58 : 1)
      return [partId, {
        baseColor: adjustAvatarPaletteHexTone(material.baseColor, materialAmount),
        foregroundColor: material.foregroundColor,
        highlightColor: adjustAvatarPaletteHexTone(material.highlightColor, materialAmount * .65),
        shadowColor: adjustAvatarPaletteHexTone(material.shadowColor, materialAmount * .7)
      }]
    })
  )

  return {
    ...palette,
    background: adjustAvatarPaletteHexTone(palette.background, boundedAmount),
    ...(palette.coat == null ? {} : {
      coat: {
        ...palette.coat,
        mark: palette.coat.mark,
        patch: adjustPatch(palette.coat.patch)
      }
    }),
    ...(entityMaterials == null ? {} : { entityMaterials }),
    gradient: [
      adjustAvatarPaletteHexTone(palette.gradient[0], boundedAmount),
      adjustAvatarPaletteHexTone(palette.gradient[1], boundedAmount * .65)
    ],
    shadow: adjustAvatarPaletteHexTone(palette.shadow, boundedAmount * .7)
  }
}

/** Restores a saved/shared fur tone from concrete material colors alone. */
export const resolveAvatarPaletteFromEntityParts = (
  palette: AvatarPalette,
  entityParts: readonly {
    readonly baseColor: string
    readonly face: boolean
    readonly highlightColor?: string
    readonly id?: string
    readonly shadowColor?: string
  }[]
): AvatarPalette => {
  const facePart = entityParts.find(part => part.face)
  if (facePart == null) return palette
  const originalColor = facePart.id == null
    ? palette.background
    : palette.entityMaterials?.[facePart.id]?.baseColor ?? palette.background
  let bestAmount: number | null = null
  let bestScore = -1
  for (let amount = -AVATAR_PALETTE_TONE_JITTER_LIMIT; amount <= AVATAR_PALETTE_TONE_JITTER_LIMIT; amount += 1) {
    if (adjustAvatarPaletteHexTone(originalColor, amount).toLowerCase() !== facePart.baseColor.toLowerCase()) continue

    const candidate = applyAvatarPaletteToneJitter(palette, amount)
    let score = 0
    for (const part of entityParts) {
      const material = part.id == null ? undefined : candidate.entityMaterials?.[part.id]
      const expectedBase = material?.baseColor ?? candidate.background
      if (part.baseColor.toLowerCase() === expectedBase.toLowerCase()) score += part.face ? 8 : 2
      if (material != null && part.highlightColor?.toLowerCase() === material.highlightColor.toLowerCase()) score += 2
      if (material != null && part.shadowColor?.toLowerCase() === material.shadowColor.toLowerCase()) score += 3
    }
    if (score > bestScore || (score === bestScore && Math.abs(amount) < Math.abs(bestAmount ?? amount))) {
      bestAmount = amount
      bestScore = score
    }
  }
  return bestAmount == null ? palette : applyAvatarPaletteToneJitter(palette, bestAmount)
}

interface NaturalAnimalPaletteOptions {
  readonly ear?: string
  readonly forelock?: string
  readonly foreground: string
  readonly highlight: string
  readonly horn?: string
  readonly id: string
  readonly mane?: string
  readonly mark: string
  readonly marking: NonNullable<AvatarPalette['coat']>['marking']
  readonly name: string
  readonly patch: string
  readonly shadow: string
  readonly snout?: string
  readonly spines?: string
  readonly tail?: string
  readonly teeth?: string
  readonly tone: string
}

const naturalAnimalPalette = (options: NaturalAnimalPaletteOptions): AvatarPalette => {
  const material = (baseColor: string) => ({
    baseColor,
    foregroundColor: options.foreground,
    highlightColor: options.highlight,
    shadowColor: options.shadow
  })
  const ear = material(options.ear ?? options.tone)
  const forelock = options.forelock == null ? null : material(options.forelock)
  const horn = options.horn == null ? null : material(options.horn)
  const mane = options.mane == null ? null : material(options.mane)
  const spines = options.spines == null ? null : material(options.spines)
  const tail = options.tail == null ? null : material(options.tail)
  const teeth = options.teeth == null ? null : material(options.teeth)

  return {
    background: options.tone,
    coat: { mark: options.mark, marking: options.marking, patch: options.patch },
    entityMaterials: {
      'cheek-left': material(options.tone),
      'cheek-right': material(options.tone),
      'ear-left': ear,
      'ear-right': ear,
      muzzle: material(options.tone),
      'nostril-left': material(options.foreground),
      'nostril-right': material(options.foreground),
      snout: material(options.snout ?? options.patch),
      ...(forelock == null ? {} : {
        'forelock-center': forelock,
        'forelock-left': forelock,
        'forelock-right': forelock,
        'fringe-center': forelock,
        'fringe-left': forelock,
        'fringe-right': forelock
      }),
      ...(horn == null ? {} : {
        'antler-left': horn,
        'antler-right': horn,
        'horn-left': horn,
        'horn-right': horn
      }),
      ...(mane == null ? {} : {
        mane,
        'mane-back': mane,
        'mane-bottom': mane,
        'mane-crown-left': mane,
        'mane-crown-right': mane,
        'mane-left': mane,
        'mane-lower-left': mane,
        'mane-lower-right': mane,
        'mane-right': mane,
        'mane-top': mane
      }),
      ...(spines == null ? {} : {
        spines,
        'spine-core': spines,
        'spine-left': spines,
        'spine-right': spines,
        'spine-top': spines,
        ...Object.fromEntries(Array.from({ length: 14 }, (_, index) => [`spine-${index}`, spines]))
      }),
      ...(tail == null ? {} : {
        tail,
        'tail-base': tail,
        'tail-fringe': tail,
        'tail-left': tail,
        'tail-right': tail,
        'tail-tip': tail
      }),
      ...(teeth == null ? {} : {
        'incisor-left': teeth,
        'incisor-right': teeth,
        'tooth-left': teeth,
        'tooth-right': teeth
      }),
      primary: material(options.tone)
    },
    foreground: options.foreground,
    gradient: [options.tone, options.highlight],
    id: options.id,
    name: options.name,
    shadow: options.shadow
  }
}

export const AVATAR_PALETTES: readonly AvatarPalette[] = [
  {
    id: 'signal',
    name: 'Signal',
    background: '#d8340c',
    gradient: ['#d8340c', '#f47b61'],
    foreground: '#fff8ef',
    shadow: '#5c1808'
  },
  {
    id: 'mint',
    name: 'Mint',
    background: '#0f766e',
    gradient: ['#0f766e', '#72c8a4'],
    foreground: '#f2fff8',
    shadow: '#063d38'
  },
  {
    id: 'graphite',
    name: 'Graphite',
    background: '#202321',
    gradient: ['#202321', '#4a504b'],
    foreground: '#f7f7f2',
    shadow: '#e23f12'
  },
  {
    id: 'black',
    name: 'Black',
    background: '#000000',
    gradient: ['#000000', '#111827'],
    foreground: '#ffffff',
    shadow: '#334155'
  },
  {
    id: 'white',
    name: 'White',
    background: '#ffffff',
    gradient: ['#ffffff', '#e5e7eb'],
    foreground: '#000000',
    shadow: '#9ca3af'
  },
  {
    id: 'sky',
    name: 'Sky',
    background: '#d7ecff',
    gradient: ['#d7ecff', '#91c9f4'],
    foreground: '#17324d',
    shadow: '#8ca8bd'
  },
  {
    id: 'gold',
    name: 'Gold',
    background: '#f2bd4b',
    gradient: ['#f2bd4b', '#ffe6a1'],
    foreground: '#201b12',
    shadow: '#a86a1a'
  },
  {
    id: 'moss',
    name: 'Moss',
    background: '#c8d77a',
    gradient: ['#c8d77a', '#789d59'],
    foreground: '#253119',
    shadow: '#6f7e34'
  },
  {
    id: 'coral',
    name: 'Coral',
    background: '#f47b61',
    gradient: ['#f47b61', '#ffc1a9'],
    foreground: '#27120f',
    shadow: '#b33e2e'
  },
  {
    id: 'iris',
    name: 'Iris',
    background: '#6750a4',
    gradient: ['#6750a4', '#a991df'],
    foreground: '#fff9ff',
    shadow: '#2f2257'
  },
  {
    id: 'terminal',
    name: 'Terminal',
    background: '#0b1020',
    gradient: ['#0b1020', '#00a36c'],
    foreground: '#d8ffe8',
    shadow: '#007a53'
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    background: '#ffd6e7',
    gradient: ['#ffd6e7', '#ff8ab3'],
    foreground: '#321322',
    shadow: '#c94f78'
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    background: '#5eead4',
    gradient: ['#5eead4', '#1d9bd1'],
    foreground: '#042f2e',
    shadow: '#0f766e'
  },
  {
    id: 'berry',
    name: 'Berry',
    background: '#9d174d',
    gradient: ['#9d174d', '#f472b6'],
    foreground: '#fff1f8',
    shadow: '#4a0b25'
  },
  {
    id: 'solar',
    name: 'Solar',
    background: '#fff2a8',
    gradient: ['#fff2a8', '#f59e0b'],
    foreground: '#2f2200',
    shadow: '#c77700'
  },
  {
    id: 'porcelain',
    name: 'Porcelain',
    background: '#f8fafc',
    gradient: ['#f8fafc', '#93c5fd'],
    foreground: '#111827',
    shadow: '#94a3b8'
  },
  {
    id: 'ember',
    name: 'Ember',
    background: '#32130f',
    gradient: ['#32130f', '#ef5a24'],
    foreground: '#fff2de',
    shadow: '#a83216'
  },
  {
    id: 'acid',
    name: 'Acid',
    background: '#d8ff47',
    gradient: ['#d8ff47', '#49d17d'],
    foreground: '#13220a',
    shadow: '#80a317'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#15162b',
    gradient: ['#15162b', '#5b6ee1'],
    foreground: '#f2f0ff',
    shadow: '#4b4db8'
  },
  {
    id: 'jade',
    name: 'Jade',
    background: '#d1fae5',
    gradient: ['#d1fae5', '#34d399'],
    foreground: '#064e3b',
    shadow: '#34d399'
  },
  {
    id: 'plum',
    name: 'Plum',
    background: '#3b0764',
    gradient: ['#3b0764', '#a855f7'],
    foreground: '#faf5ff',
    shadow: '#7e22ce'
  },
  {
    id: 'peach',
    name: 'Peach',
    background: '#ffe0c7',
    gradient: ['#ffe0c7', '#fb923c'],
    foreground: '#3a1c0b',
    shadow: '#ea580c'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    background: '#075985',
    gradient: ['#075985', '#38bdf8'],
    foreground: '#ecfeff',
    shadow: '#0c4a6e'
  },
  {
    id: 'rosewood',
    name: 'Rosewood',
    background: '#4c0519',
    gradient: ['#4c0519', '#e11d48'],
    foreground: '#fff1f2',
    shadow: '#be123c'
  },
  {
    id: 'limepop',
    name: 'Limepop',
    background: '#ecfccb',
    gradient: ['#ecfccb', '#84cc16'],
    foreground: '#1a2e05',
    shadow: '#65a30d'
  },
  {
    id: 'denim',
    name: 'Denim',
    background: '#1e3a8a',
    gradient: ['#1e3a8a', '#60a5fa'],
    foreground: '#eff6ff',
    shadow: '#1d4ed8'
  },
  {
    id: 'orchid',
    name: 'Orchid',
    background: '#f5d0fe',
    gradient: ['#f5d0fe', '#d946ef'],
    foreground: '#3b0a45',
    shadow: '#c026d3'
  },
  {
    id: 'cocoa',
    name: 'Cocoa',
    background: '#2a1712',
    gradient: ['#2a1712', '#a16207'],
    foreground: '#fff7ed',
    shadow: '#854d0e'
  },
  {
    id: 'tabby',
    name: 'Tabby',
    background: '#9a8267',
    gradient: ['#9a8267', '#c1ad8f'],
    foreground: '#2f241c',
    shadow: '#5b4635'
  },
  {
    id: 'siamese',
    name: 'Siamese',
    background: '#ead7b8',
    gradient: ['#ead7b8', '#fff2d8'],
    foreground: '#281913',
    shadow: '#9b7558',
    coat: { patch: '#3c2118', mark: '#3c2118' },
    entityMaterials: {
      'cat-ear-left': { baseColor: '#3c2118', foregroundColor: '#fff0db', highlightColor: '#61382a', shadowColor: '#24120d' },
      'cat-ear-right': { baseColor: '#3c2118', foregroundColor: '#fff0db', highlightColor: '#61382a', shadowColor: '#24120d' },
      'cat-head': { baseColor: '#ead7b8', foregroundColor: '#281913', highlightColor: '#fff2d8', shadowColor: '#9b7558' }
    }
  },
  {
    id: 'british-shorthair',
    name: 'British Shorthair',
    background: '#b89a6b',
    gradient: ['#b89a6b', '#dec99d'],
    foreground: '#35291f',
    shadow: '#806b4e',
    coat: { patch: '#d7c29a', mark: '#756047' }
  },
  {
    id: 'russian-blue',
    name: 'Russian Blue',
    background: '#718493',
    gradient: ['#718493', '#a9b7c1'],
    foreground: '#17232c',
    shadow: '#485b69',
    coat: { patch: '#718493', mark: '#435663' }
  },
  {
    id: 'orange-tabby',
    name: 'Orange Tabby',
    background: '#d98a35',
    gradient: ['#d98a35', '#f2bc69'],
    foreground: '#3b2416',
    shadow: '#9b5423',
    coat: { patch: '#f1c783', mark: '#8c491f' }
  },
  {
    id: 'cow-cat',
    name: 'Cow Cat',
    background: '#171b22',
    gradient: ['#171b22', '#343c48'],
    foreground: '#c58b35',
    shadow: '#07090d',
    coat: { patch: '#fffdf7', mark: '#080a0e' },
    entityMaterials: {
      'cat-ear-left': { baseColor: '#171b22', foregroundColor: '#f7f5ee', highlightColor: '#343c48', shadowColor: '#07090d' },
      'cat-ear-right': { baseColor: '#171b22', foregroundColor: '#f7f5ee', highlightColor: '#343c48', shadowColor: '#07090d' },
      'cat-head': { baseColor: '#171b22', foregroundColor: '#c58b35', highlightColor: '#343c48', shadowColor: '#07090d' }
    }
  },
  {
    id: 'black-cat',
    name: 'Black Cat',
    background: '#111419',
    gradient: ['#111419', '#303844'],
    foreground: '#eef2f5',
    shadow: '#05070a',
    coat: { patch: '#111419', mark: '#080a0d' },
    entityMaterials: {
      'cat-ear-left': { baseColor: '#111419', foregroundColor: '#dce3e8', highlightColor: '#303844', shadowColor: '#05070a' },
      'cat-ear-right': { baseColor: '#111419', foregroundColor: '#dce3e8', highlightColor: '#303844', shadowColor: '#05070a' },
      'cat-head': { baseColor: '#111419', foregroundColor: '#eef2f5', highlightColor: '#303844', shadowColor: '#05070a' }
    }
  },
  {
    id: 'shiba-inu',
    name: 'Shiba Inu',
    background: '#c96f32',
    gradient: ['#c96f32', '#efb66d'],
    foreground: '#322017',
    shadow: '#7a3b1b',
    coat: { mark: '#8b431c', marking: 'muzzle', patch: '#f5ddba' },
    entityMaterials: {
      'ear-left': { baseColor: '#9f4a20', foregroundColor: '#322017', highlightColor: '#db8550', shadowColor: '#51200d' },
      'ear-right': { baseColor: '#9f4a20', foregroundColor: '#322017', highlightColor: '#db8550', shadowColor: '#51200d' },
      primary: { baseColor: '#c96f32', foregroundColor: '#322017', highlightColor: '#efb66d', shadowColor: '#7a3b1b' }
    }
  },
  {
    id: 'husky',
    name: 'Husky',
    background: '#64717c',
    gradient: ['#64717c', '#aebbc2'],
    foreground: '#182128',
    shadow: '#35434c',
    coat: { mark: '#29343d', marking: 'mask', patch: '#f5f3ec' },
    entityMaterials: {
      'ear-left': { baseColor: '#29343d', foregroundColor: '#182128', highlightColor: '#596975', shadowColor: '#131a1f' },
      'ear-right': { baseColor: '#29343d', foregroundColor: '#182128', highlightColor: '#596975', shadowColor: '#131a1f' },
      primary: { baseColor: '#64717c', foregroundColor: '#182128', highlightColor: '#aebbc2', shadowColor: '#35434c' }
    }
  },
  {
    id: 'corgi',
    name: 'Corgi',
    background: '#be7135',
    gradient: ['#be7135', '#e8ad70'],
    foreground: '#352218',
    shadow: '#744020',
    coat: { mark: '#934f25', marking: 'blaze', patch: '#f7e3c3' },
    entityMaterials: {
      'ear-left': { baseColor: '#b15f2d', foregroundColor: '#352218', highlightColor: '#df9353', shadowColor: '#663215' },
      'ear-right': { baseColor: '#b15f2d', foregroundColor: '#352218', highlightColor: '#df9353', shadowColor: '#663215' },
      primary: { baseColor: '#be7135', foregroundColor: '#352218', highlightColor: '#e8ad70', shadowColor: '#744020' }
    }
  },
  {
    id: 'golden-retriever',
    name: 'Golden Retriever',
    background: '#d8a34d',
    gradient: ['#d8a34d', '#f4d68a'],
    foreground: '#3a2a16',
    shadow: '#8a5a21',
    coat: { mark: '#b67a2e', marking: 'muzzle', patch: '#f3d39a' },
    entityMaterials: {
      'ear-left': { baseColor: '#bc7e30', foregroundColor: '#3a2a16', highlightColor: '#dcaa59', shadowColor: '#714216' },
      'ear-right': { baseColor: '#bc7e30', foregroundColor: '#3a2a16', highlightColor: '#dcaa59', shadowColor: '#714216' },
      primary: { baseColor: '#d8a34d', foregroundColor: '#3a2a16', highlightColor: '#f4d68a', shadowColor: '#8a5a21' }
    }
  },
  {
    id: 'border-collie',
    name: 'Border Collie',
    background: '#22262a',
    gradient: ['#22262a', '#4a535a'],
    foreground: '#b77a38',
    shadow: '#0d1114',
    coat: { mark: '#101417', marking: 'blaze', patch: '#f7f4eb' },
    entityMaterials: {
      'ear-left': { baseColor: '#171b1f', foregroundColor: '#b77a38', highlightColor: '#3d464d', shadowColor: '#07090b' },
      'ear-right': { baseColor: '#171b1f', foregroundColor: '#b77a38', highlightColor: '#3d464d', shadowColor: '#07090b' },
      primary: { baseColor: '#22262a', foregroundColor: '#b77a38', highlightColor: '#4a535a', shadowColor: '#0d1114' }
    }
  },
  {
    id: 'dalmatian',
    name: 'Dalmatian',
    background: '#f1eee5',
    gradient: ['#f1eee5', '#ffffff'],
    foreground: '#202328',
    shadow: '#b5b3aa',
    coat: { mark: '#596571', marking: 'spots', patch: '#f8f6ee' },
    entityMaterials: {
      'ear-left': { baseColor: '#f1eee5', foregroundColor: '#202328', highlightColor: '#ffffff', shadowColor: '#b5b3aa' },
      'ear-right': { baseColor: '#f1eee5', foregroundColor: '#202328', highlightColor: '#ffffff', shadowColor: '#b5b3aa' },
      primary: { baseColor: '#f1eee5', foregroundColor: '#202328', highlightColor: '#ffffff', shadowColor: '#b5b3aa' }
    }
  },
  {
    id: 'holland-lop', name: 'Holland Lop', background: '#c99055', gradient: ['#c99055', '#f1d1a2'], foreground: '#482b1c', shadow: '#81502d',
    coat: { mark: '#9a5f35', marking: 'muzzle', patch: '#f6e4c9' },
    entityMaterials: {
      'ear-left': { baseColor: '#a8673c', foregroundColor: '#482b1c', highlightColor: '#d89b68', shadowColor: '#66391f' },
      'ear-right': { baseColor: '#a8673c', foregroundColor: '#482b1c', highlightColor: '#d89b68', shadowColor: '#66391f' },
      primary: { baseColor: '#c99055', foregroundColor: '#482b1c', highlightColor: '#f1d1a2', shadowColor: '#81502d' }
    }
  },
  {
    id: 'netherland-dwarf', name: 'Netherland Dwarf', background: '#8e7866', gradient: ['#8e7866', '#cbbba8'], foreground: '#31251f', shadow: '#59473b',
    coat: { mark: '#715a4a', marking: 'muzzle', patch: '#eee3d6' },
    entityMaterials: {
      'ear-left': { baseColor: '#796354', foregroundColor: '#31251f', highlightColor: '#aa9380', shadowColor: '#4a382e' },
      'ear-right': { baseColor: '#796354', foregroundColor: '#31251f', highlightColor: '#aa9380', shadowColor: '#4a382e' },
      primary: { baseColor: '#8e7866', foregroundColor: '#31251f', highlightColor: '#cbbba8', shadowColor: '#59473b' }
    }
  },
  {
    id: 'dutch-rabbit', name: 'Dutch Rabbit', background: '#302b2a', gradient: ['#302b2a', '#5b504d'], foreground: '#9c6a54', shadow: '#171312',
    coat: { mark: '#272120', marking: 'blaze', patch: '#f5f0e5' },
    entityMaterials: {
      'ear-left': { baseColor: '#272120', foregroundColor: '#9c6a54', highlightColor: '#504440', shadowColor: '#11100f' },
      'ear-right': { baseColor: '#272120', foregroundColor: '#9c6a54', highlightColor: '#504440', shadowColor: '#11100f' },
      primary: { baseColor: '#302b2a', foregroundColor: '#9c6a54', highlightColor: '#5b504d', shadowColor: '#171312' }
    }
  },
  {
    id: 'himalayan-rabbit', name: 'Himalayan Rabbit', background: '#f3e7d1', gradient: ['#f3e7d1', '#fff8eb'], foreground: '#4b2d22', shadow: '#c5ae8f',
    coat: { mark: '#4b2d22', marking: 'mask', patch: '#765244' },
    entityMaterials: {
      'ear-left': { baseColor: '#4b2d22', foregroundColor: '#4b2d22', highlightColor: '#795040', shadowColor: '#2d1712' },
      'ear-right': { baseColor: '#4b2d22', foregroundColor: '#4b2d22', highlightColor: '#795040', shadowColor: '#2d1712' },
      primary: { baseColor: '#f3e7d1', foregroundColor: '#4b2d22', highlightColor: '#fff8eb', shadowColor: '#c5ae8f' }
    }
  },
  {
    id: 'lionhead-rabbit', name: 'Lionhead Rabbit', background: '#c48d55', gradient: ['#c48d55', '#f2d49f'], foreground: '#4b301c', shadow: '#825331',
    coat: { mark: '#9a6538', marking: 'muzzle', patch: '#f6e4c2' },
    entityMaterials: {
      'ear-left': { baseColor: '#b6753e', foregroundColor: '#4b301c', highlightColor: '#dfa968', shadowColor: '#70421f' },
      'ear-right': { baseColor: '#b6753e', foregroundColor: '#4b301c', highlightColor: '#dfa968', shadowColor: '#70421f' },
      primary: { baseColor: '#c48d55', foregroundColor: '#4b301c', highlightColor: '#f2d49f', shadowColor: '#825331' }
    }
  },
  {
    id: 'english-spot', name: 'English Spot', background: '#f4f0e8', gradient: ['#f4f0e8', '#ffffff'], foreground: '#32353b', shadow: '#b9b4aa',
    coat: { mark: '#676d72', marking: 'spots', patch: '#fffdf7' },
    entityMaterials: {
      'ear-left': { baseColor: '#f4f0e8', foregroundColor: '#32353b', highlightColor: '#ffffff', shadowColor: '#b9b4aa' },
      'ear-right': { baseColor: '#f4f0e8', foregroundColor: '#32353b', highlightColor: '#ffffff', shadowColor: '#b9b4aa' },
      primary: { baseColor: '#f4f0e8', foregroundColor: '#32353b', highlightColor: '#ffffff', shadowColor: '#b9b4aa' }
    }
  },
  { id: 'brown-bear', name: 'Brown Bear', background: '#8b5737', gradient: ['#8b5737', '#bd8153'], foreground: '#211711', shadow: '#4c2c1e', coat: { mark: '#70432b', marking: 'muzzle', patch: '#d6a576' }, entityMaterials: { 'ear-left': { baseColor: '#67402b', foregroundColor: '#211711', highlightColor: '#9f6845', shadowColor: '#382015' }, 'ear-right': { baseColor: '#67402b', foregroundColor: '#211711', highlightColor: '#9f6845', shadowColor: '#382015' }, primary: { baseColor: '#8b5737', foregroundColor: '#211711', highlightColor: '#bd8153', shadowColor: '#4c2c1e' } } },
  { id: 'polar-bear', name: 'Polar Bear', background: '#e7e5dc', gradient: ['#e7e5dc', '#d9e4e7'], foreground: '#26343a', shadow: '#aebec2', coat: { mark: '#b6d0d4', marking: 'muzzle', patch: '#fffdf6' }, entityMaterials: { 'ear-left': { baseColor: '#dbe0dd', foregroundColor: '#26343a', highlightColor: '#ffffff', shadowColor: '#afc1c3' }, 'ear-right': { baseColor: '#dbe0dd', foregroundColor: '#26343a', highlightColor: '#ffffff', shadowColor: '#afc1c3' }, primary: { baseColor: '#e7e5dc', foregroundColor: '#26343a', highlightColor: '#fffdf6', shadowColor: '#aebec2' } } },
  { id: 'asian-black-bear', name: 'Asian Black Bear', background: '#242527', gradient: ['#242527', '#4b4d50'], foreground: '#d9b57a', shadow: '#0d0e0f', coat: { mark: '#111214', marking: 'moon', patch: '#e7d7ad' }, entityMaterials: { 'ear-left': { baseColor: '#161719', foregroundColor: '#d9b57a', highlightColor: '#414348', shadowColor: '#070708' }, 'ear-right': { baseColor: '#161719', foregroundColor: '#d9b57a', highlightColor: '#414348', shadowColor: '#070708' }, primary: { baseColor: '#242527', foregroundColor: '#d9b57a', highlightColor: '#4b4d50', shadowColor: '#0d0e0f' } } },
  { id: 'giant-panda', name: 'Giant Panda', background: '#dedbd1', gradient: ['#dedbd1', '#f1efe8'], foreground: '#b56c45', shadow: '#9fa6a2', coat: { mark: '#303338', marking: 'panda', patch: '#f8f6ef' }, entityMaterials: { 'ear-left': { baseColor: '#24272a', foregroundColor: '#b56c45', highlightColor: '#43484b', shadowColor: '#101113' }, 'ear-right': { baseColor: '#24272a', foregroundColor: '#b56c45', highlightColor: '#43484b', shadowColor: '#101113' }, primary: { baseColor: '#dedbd1', foregroundColor: '#b56c45', highlightColor: '#fffdf7', shadowColor: '#9fa6a2' } } },
  { id: 'spectacled-bear', name: 'Spectacled Bear', background: '#3a2e25', gradient: ['#3a2e25', '#675142'], foreground: '#d4a871', shadow: '#1e1712', coat: { mark: '#d7c19a', marking: 'spectacles', patch: '#b88958' }, entityMaterials: { 'ear-left': { baseColor: '#2b221c', foregroundColor: '#d4a871', highlightColor: '#514139', shadowColor: '#15100d' }, 'ear-right': { baseColor: '#2b221c', foregroundColor: '#d4a871', highlightColor: '#514139', shadowColor: '#15100d' }, primary: { baseColor: '#3a2e25', foregroundColor: '#d4a871', highlightColor: '#675142', shadowColor: '#1e1712' } } },
  { id: 'sun-bear', name: 'Sun Bear', background: '#2c2722', gradient: ['#2c2722', '#544a3d'], foreground: '#d9a56b', shadow: '#14110e', coat: { mark: '#151310', marking: 'sun', patch: '#e8bd77' }, entityMaterials: { 'ear-left': { baseColor: '#1d1a17', foregroundColor: '#d9a56b', highlightColor: '#3e3730', shadowColor: '#0d0b0a' }, 'ear-right': { baseColor: '#1d1a17', foregroundColor: '#d9a56b', highlightColor: '#3e3730', shadowColor: '#0d0b0a' }, primary: { baseColor: '#2c2722', foregroundColor: '#d9a56b', highlightColor: '#544a3d', shadowColor: '#14110e' } } },
  { id: 'red-panda', name: 'Red Panda', background: '#b65b32', gradient: ['#b65b32', '#de9257'], foreground: '#2d211c', shadow: '#6b301e', coat: { mark: '#f1d7ae', marking: 'red-panda', patch: '#f5e6c9' }, entityMaterials: { 'ear-left': { baseColor: '#7f3825', foregroundColor: '#2d211c', highlightColor: '#b75e38', shadowColor: '#431c15' }, 'ear-right': { baseColor: '#7f3825', foregroundColor: '#2d211c', highlightColor: '#b75e38', shadowColor: '#431c15' }, primary: { baseColor: '#b65b32', foregroundColor: '#2d211c', highlightColor: '#de9257', shadowColor: '#6b301e' } } },
  { id: 'koala', name: 'Koala', background: '#87949a', gradient: ['#87949a', '#b8c2c1'], foreground: '#273238', shadow: '#55636a', coat: { mark: '#d7d4c6', marking: 'muzzle', patch: '#e9e5d9' }, entityMaterials: { 'ear-left': { baseColor: '#69767d', foregroundColor: '#273238', highlightColor: '#9ba8aa', shadowColor: '#424d52' }, 'ear-right': { baseColor: '#69767d', foregroundColor: '#273238', highlightColor: '#9ba8aa', shadowColor: '#424d52' }, primary: { baseColor: '#87949a', foregroundColor: '#273238', highlightColor: '#b8c2c1', shadowColor: '#55636a' } } },
  { id: 'raccoon', name: 'Raccoon', background: '#74716c', gradient: ['#74716c', '#aaa59b'], foreground: '#2a2d31', shadow: '#484640', coat: { mark: '#34383c', marking: 'raccoon', patch: '#d9d2c2' }, entityMaterials: { 'ear-left': { baseColor: '#4d5050', foregroundColor: '#2a2d31', highlightColor: '#747570', shadowColor: '#2b2d2e' }, 'ear-right': { baseColor: '#4d5050', foregroundColor: '#2a2d31', highlightColor: '#747570', shadowColor: '#2b2d2e' }, primary: { baseColor: '#74716c', foregroundColor: '#2a2d31', highlightColor: '#aaa59b', shadowColor: '#484640' } } },
  { id: 'wombat', name: 'Wombat', background: '#786a5c', gradient: ['#786a5c', '#a99a89'], foreground: '#312a25', shadow: '#4c4138', coat: { mark: '#5b5046', marking: 'wombat', patch: '#d5c5ae' }, entityMaterials: { 'ear-left': { baseColor: '#615549', foregroundColor: '#312a25', highlightColor: '#84776a', shadowColor: '#3e352e' }, 'ear-right': { baseColor: '#615549', foregroundColor: '#312a25', highlightColor: '#84776a', shadowColor: '#3e352e' }, primary: { baseColor: '#786a5c', foregroundColor: '#312a25', highlightColor: '#a99a89', shadowColor: '#4c4138' } } },
  { id: 'teddy-bear', name: 'Teddy Bear', background: '#b98050', gradient: ['#b98050', '#dfad78'], foreground: '#4b2d1d', shadow: '#77452c', coat: { mark: '#895232', marking: 'muzzle', patch: '#edc38d' }, entityMaterials: { 'ear-left': { baseColor: '#9a5d3b', foregroundColor: '#4b2d1d', highlightColor: '#c98254', shadowColor: '#5f3522' }, 'ear-right': { baseColor: '#9a5d3b', foregroundColor: '#4b2d1d', highlightColor: '#c98254', shadowColor: '#5f3522' }, primary: { baseColor: '#b98050', foregroundColor: '#4b2d1d', highlightColor: '#dfad78', shadowColor: '#77452c' } } },
  naturalAnimalPalette({ id: 'syrian-hamster', name: 'Syrian Hamster', tone: '#c99152', highlight: '#edc38d', shadow: '#795032', foreground: '#38241c', ear: '#b97855', mark: '#a16c3f', marking: 'muzzle', patch: '#f7e4c5' }),
  naturalAnimalPalette({ id: 'pudding-hamster', name: 'Pudding Hamster', tone: '#e5bd76', highlight: '#f8dea7', shadow: '#ad8350', foreground: '#4e3826', ear: '#d6a47c', mark: '#c59658', marking: 'muzzle', patch: '#fff0d1' }),
  naturalAnimalPalette({ id: 'silver-fox-hamster', name: 'Silver Fox Hamster', tone: '#e3e0d8', highlight: '#fffdf6', shadow: '#b4afa4', foreground: '#302b2a', ear: '#b9a7a3', mark: '#a9a39c', marking: 'blaze', patch: '#fffdf8' }),
  naturalAnimalPalette({ id: 'sapphire-hamster', name: 'Sapphire Hamster', tone: '#8b8997', highlight: '#bebbc4', shadow: '#595764', foreground: '#292732', ear: '#777280', mark: '#626170', marking: 'muzzle', patch: '#ded9db' }),
  naturalAnimalPalette({ id: 'capybara', name: 'Capybara', tone: '#a77b58', highlight: '#c8a17c', shadow: '#694a37', foreground: '#34261e', ear: '#8b654d', mark: '#805b42', marking: 'muzzle', patch: '#d4b291' }),
  naturalAnimalPalette({ id: 'sandy-capybara', name: 'Sandy Capybara', tone: '#c2a079', highlight: '#e0c39e', shadow: '#866744', foreground: '#473326', ear: '#ad8a69', mark: '#967551', marking: 'muzzle', patch: '#ecd8ba' }),
  naturalAnimalPalette({ id: 'dark-capybara', name: 'Dark Capybara', tone: '#705443', highlight: '#977761', shadow: '#49362c', foreground: '#f1d7ab', ear: '#614839', mark: '#594033', marking: 'muzzle', patch: '#92735d' }),
  naturalAnimalPalette({ id: 'capybara-pup', name: 'Capybara Pup', tone: '#bd8d60', highlight: '#ddbb91', shadow: '#805a3d', foreground: '#38261c', ear: '#a47554', mark: '#986946', marking: 'muzzle', patch: '#f1d7b0' }),
  naturalAnimalPalette({ id: 'sea-otter', name: 'Sea Otter', tone: '#675349', highlight: '#8d766a', shadow: '#40332d', foreground: '#241c19', ear: '#57443b', mark: '#b9a996', marking: 'mask', patch: '#ddd0be' }),
  naturalAnimalPalette({ id: 'river-otter', name: 'River Otter', tone: '#815b40', highlight: '#aa8362', shadow: '#513925', foreground: '#302118', ear: '#704d36', mark: '#a98664', marking: 'muzzle', patch: '#e5d0ad' }),
  naturalAnimalPalette({ id: 'asian-small-clawed-otter', name: 'Asian Small-clawed Otter', tone: '#917055', highlight: '#b99b7d', shadow: '#604835', foreground: '#34261d', ear: '#7e6049', mark: '#b59879', marking: 'muzzle', patch: '#f0e0c4' }),
  naturalAnimalPalette({ id: 'pink-pig', name: 'Pink Pig', tone: '#efb0ac', highlight: '#ffd4d0', shadow: '#bd7777', foreground: '#713f43', ear: '#df9391', mark: '#d88d8b', marking: 'muzzle', patch: '#f8c5bf' }),
  naturalAnimalPalette({ id: 'black-pig', name: 'Black Pig', tone: '#353035', highlight: '#64555a', shadow: '#1e1a1e', foreground: '#dca87f', ear: '#292529', mark: '#58464a', marking: 'muzzle', patch: '#725760' }),
  naturalAnimalPalette({ id: 'spotted-pig', name: 'Spotted Pig', tone: '#ead3c7', highlight: '#fff0e5', shadow: '#a99589', foreground: '#55372f', ear: '#d7b3a7', mark: '#595251', marking: 'spots', patch: '#d9a399' }),
  naturalAnimalPalette({ id: 'wild-boar', name: 'Wild Boar', tone: '#665347', highlight: '#927969', shadow: '#403329', foreground: '#e8cbaa', ear: '#564338', mark: '#43352e', marking: 'blaze', patch: '#b49273' }),
  naturalAnimalPalette({ id: 'sika-deer', name: 'Sika Deer', tone: '#b77a4c', highlight: '#dda77a', shadow: '#744931', foreground: '#39251b', ear: '#a06747', horn: '#806447', mark: '#f2ddbb', marking: 'spots', patch: '#f5e7cf' }),
  naturalAnimalPalette({ id: 'reindeer', name: 'Reindeer', tone: '#8a7565', highlight: '#b49c84', shadow: '#59493f', foreground: '#33271f', ear: '#756153', horn: '#b59876', mark: '#cbbba6', marking: 'muzzle', patch: '#e2d5c1' }),
  naturalAnimalPalette({ id: 'white-deer', name: 'White Deer', tone: '#e5e1d6', highlight: '#fffdf4', shadow: '#c0b8aa', foreground: '#453a34', ear: '#d9cfc1', horn: '#b8a386', mark: '#d7cec0', marking: 'muzzle', patch: '#fff9ec' }),
  naturalAnimalPalette({ id: 'deer-fawn', name: 'Fawn', tone: '#c28a5a', highlight: '#e4b587', shadow: '#845839', foreground: '#3d281c', ear: '#b07451', mark: '#f6e5c8', marking: 'spots', patch: '#f7ead2' }),
  naturalAnimalPalette({ id: 'white-sheep', name: 'White Sheep', tone: '#f0ece0', highlight: '#fffdf6', shadow: '#c6bca9', foreground: '#3a302c', ear: '#d8cbb9', mark: '#e0d7c5', marking: 'muzzle', patch: '#f7eee0' }),
  naturalAnimalPalette({ id: 'black-faced-sheep', name: 'Black-faced Sheep', tone: '#e9e4d8', highlight: '#fffdf4', shadow: '#beb5a5', foreground: '#ecdfc2', ear: '#383438', mark: '#39353a', marking: 'mask', patch: '#454047' }),
  naturalAnimalPalette({ id: 'horned-ram', name: 'Horned Ram', tone: '#cec2ac', highlight: '#ece2d0', shadow: '#948674', foreground: '#43352d', ear: '#b6a58e', horn: '#977557', mark: '#aa947c', marking: 'muzzle', patch: '#efe3ce' }),
  naturalAnimalPalette({ id: 'lamb', name: 'Lamb', tone: '#f3eee5', highlight: '#fffdf8', shadow: '#d0c4b5', foreground: '#584038', ear: '#e2c5bf', mark: '#dfd1c5', marking: 'muzzle', patch: '#fff4ea' }),
  naturalAnimalPalette({ id: 'mountain-goat', name: 'Mountain Goat', tone: '#e5e0d4', highlight: '#fbf8f0', shadow: '#ada395', foreground: '#4b3b32', ear: '#cfc5b7', horn: '#806b58', mark: '#c4b5a5', marking: 'blaze', patch: '#f5eee2' }),
  naturalAnimalPalette({ id: 'cream-alpaca', name: 'Cream Alpaca', tone: '#e6dccb', highlight: '#fff9eb', shadow: '#b7a893', foreground: '#473a32', ear: '#cdbca9', forelock: '#f4ead9', mark: '#c8b39b', marking: 'muzzle', patch: '#cbb6a0' }),
  naturalAnimalPalette({ id: 'caramel-alpaca', name: 'Caramel Alpaca', tone: '#bb8251', highlight: '#e2b88c', shadow: '#765032', foreground: '#38271e', ear: '#a06b48', forelock: '#d5a171', mark: '#875a3c', marking: 'muzzle', patch: '#ead4ba' }),
  naturalAnimalPalette({ id: 'gray-alpaca', name: 'Gray Alpaca', tone: '#888582', highlight: '#bcb8b0', shadow: '#575451', foreground: '#262424', ear: '#706d6a', forelock: '#a7a39d', mark: '#615e5b', marking: 'muzzle', patch: '#ddd6ca' }),
  naturalAnimalPalette({ id: 'alpaca-cria', name: 'Alpaca Cria', tone: '#d8b995', highlight: '#f6e4ca', shadow: '#aa8662', foreground: '#453126', ear: '#c79f82', forelock: '#edd2af', mark: '#b38d68', marking: 'muzzle', patch: '#f7e9d6' }),
  naturalAnimalPalette({ id: 'dairy-cow', name: 'Dairy Cow', tone: '#e8e3d8', highlight: '#fffdf3', shadow: '#bab2a4', foreground: '#252126', ear: '#303238', horn: '#c6b392', mark: '#57555a', marking: 'spots', patch: '#f6eee1', snout: '#d2a49e', forelock: '#d8d0c1' }),
  naturalAnimalPalette({ id: 'jersey-cow', name: 'Jersey Cow', tone: '#b98b5d', highlight: '#e3bf93', shadow: '#775537', foreground: '#342720', ear: '#916640', horn: '#b4a184', mark: '#85603f', marking: 'muzzle', patch: '#eee0c8', snout: '#83584f', forelock: '#d0a574' }),
  naturalAnimalPalette({ id: 'highland-cow', name: 'Highland Cow', tone: '#ac6942', highlight: '#dc9c68', shadow: '#6d3f2a', foreground: '#30221c', ear: '#925437', horn: '#d2b58d', mark: '#825039', marking: 'muzzle', patch: '#e9ceb0', snout: '#69473f', forelock: '#d18a57' }),
  naturalAnimalPalette({ id: 'cow-calf', name: 'Cow Calf', tone: '#d2a47c', highlight: '#f1d1ad', shadow: '#986b4d', foreground: '#413029', ear: '#bc8b6a', mark: '#ae7757', marking: 'muzzle', patch: '#f7e7d2', snout: '#b47570', forelock: '#e6c099' }),
  naturalAnimalPalette({ id: 'red-squirrel', name: 'Red Squirrel', tone: '#bc7045', highlight: '#e6a16f', shadow: '#78412b', foreground: '#36231b', ear: '#995537', mark: '#82442a', marking: 'muzzle', patch: '#f2dfc2', tail: '#9d5337' }),
  naturalAnimalPalette({ id: 'gray-squirrel', name: 'Gray Squirrel', tone: '#85837e', highlight: '#b7b3aa', shadow: '#53514e', foreground: '#292726', ear: '#686661', mark: '#5d5b57', marking: 'muzzle', patch: '#ded7c9', tail: '#716f6a' }),
  naturalAnimalPalette({ id: 'chipmunk', name: 'Chipmunk', tone: '#ae7b50', highlight: '#d9ac7c', shadow: '#704b32', foreground: '#38271e', ear: '#906342', mark: '#4e392c', marking: 'stripes', patch: '#f1dfbd', tail: '#946443' }),
  naturalAnimalPalette({ id: 'black-squirrel', name: 'Black Squirrel', tone: '#393735', highlight: '#66615b', shadow: '#1d1c1a', foreground: '#e1be91', ear: '#302e2c', mark: '#242220', marking: 'muzzle', patch: '#8e7968', tail: '#2f2d2b' }),
  naturalAnimalPalette({ id: 'bengal-tiger', name: 'Bengal Tiger', tone: '#d38a41', highlight: '#efba76', shadow: '#985620', foreground: '#38251a', ear: '#bd7135', mark: '#653923', marking: 'stripes', patch: '#f6e5cc' }),
  naturalAnimalPalette({ id: 'white-tiger', name: 'White Tiger', tone: '#e5e0d5', highlight: '#fffaf1', shadow: '#b7aea0', foreground: '#353438', ear: '#ccc2b6', mark: '#66605b', marking: 'stripes', patch: '#fffaf0' }),
  naturalAnimalPalette({ id: 'golden-tiger', name: 'Golden Tiger', tone: '#dda860', highlight: '#f7d391', shadow: '#ab7842', foreground: '#493224', ear: '#ca9151', mark: '#a26c43', marking: 'stripes', patch: '#fff0d7' }),
  naturalAnimalPalette({ id: 'tiger-cub', name: 'Tiger Cub', tone: '#dca064', highlight: '#f6ca96', shadow: '#a36c40', foreground: '#3d2a20', ear: '#c18450', mark: '#775039', marking: 'stripes', patch: '#ffeedb' }),
  naturalAnimalPalette({ id: 'african-lion', name: 'African Lion', tone: '#c79861', highlight: '#ebc58f', shadow: '#8c633e', foreground: '#422d20', ear: '#af7b4a', mark: '#8a5e3b', marking: 'muzzle', patch: '#f3dfbf', mane: '#795038' }),
  naturalAnimalPalette({ id: 'lioness', name: 'Lioness', tone: '#cbae80', highlight: '#ebd2ad', shadow: '#947650', foreground: '#463225', ear: '#af9068', mark: '#9e7951', marking: 'muzzle', patch: '#f5e7cf' }),
  naturalAnimalPalette({ id: 'white-lion', name: 'White Lion', tone: '#ded7c7', highlight: '#faf3e6', shadow: '#aca18c', foreground: '#44382e', ear: '#c8bdab', mark: '#b2a58f', marking: 'muzzle', patch: '#fff7e9', mane: '#bbb09e' }),
  naturalAnimalPalette({ id: 'lion-cub', name: 'Lion Cub', tone: '#d5b183', highlight: '#f2d8b0', shadow: '#a27f58', foreground: '#493224', ear: '#bd986e', mark: '#a88662', marking: 'muzzle', patch: '#fbebd2', mane: '#c4a074' }),
  naturalAnimalPalette({ id: 'european-hedgehog', name: 'European Hedgehog', tone: '#b9a58c', highlight: '#dccdb6', shadow: '#80705f', foreground: '#352a24', ear: '#9c8874', mark: '#77634f', marking: 'muzzle', patch: '#e9dbc5', spines: '#645443' }),
  naturalAnimalPalette({ id: 'cream-hedgehog', name: 'Cream Hedgehog', tone: '#d7c8ad', highlight: '#f1e7d2', shadow: '#a5967e', foreground: '#473a2e', ear: '#c4b197', mark: '#a38f72', marking: 'muzzle', patch: '#fff1dc', spines: '#aa9476' }),
  naturalAnimalPalette({ id: 'albino-hedgehog', name: 'Albino Hedgehog', tone: '#e9ddd1', highlight: '#fff8ed', shadow: '#c5b5a7', foreground: '#87564f', ear: '#dcc3b9', mark: '#cdbbae', marking: 'muzzle', patch: '#fff5eb', spines: '#cdbfad' }),
  naturalAnimalPalette({ id: 'cinnamon-hedgehog', name: 'Cinnamon Hedgehog', tone: '#bb9275', highlight: '#ddba9c', shadow: '#86634e', foreground: '#442e25', ear: '#a47c65', mark: '#906c50', marking: 'muzzle', patch: '#efdbca', spines: '#785b46' }),
  naturalAnimalPalette({ id: 'harbor-seal', name: 'Harbor Seal', tone: '#87918e', highlight: '#b4c0ba', shadow: '#596660', foreground: '#25312f', ear: '#78827e', mark: '#62706a', marking: 'muzzle', patch: '#e6dfd2' }),
  naturalAnimalPalette({ id: 'harp-seal', name: 'Harp Seal', tone: '#e4e2d8', highlight: '#fffdf5', shadow: '#b9bbb0', foreground: '#333b3e', ear: '#d0d0c6', mark: '#a4aaa5', marking: 'muzzle', patch: '#c4b9a9' }),
  naturalAnimalPalette({ id: 'gray-seal', name: 'Gray Seal', tone: '#666d70', highlight: '#939a9a', shadow: '#404749', foreground: '#e8dfcf', ear: '#575e60', mark: '#485153', marking: 'muzzle', patch: '#aeaaa0' }),
  naturalAnimalPalette({ id: 'seal-pup', name: 'Seal Pup', tone: '#d9d2c2', highlight: '#f7f2e6', shadow: '#aea494', foreground: '#3d3530', ear: '#c4bba9', mark: '#b2a897', marking: 'muzzle', patch: '#f8f1e5' }),
  naturalAnimalPalette({ id: 'north-american-beaver', name: 'North American Beaver', tone: '#896343', highlight: '#b68d65', shadow: '#533b2a', foreground: '#2e211a', ear: '#725039', mark: '#67472f', marking: 'muzzle', patch: '#d5b790', teeth: '#f7edda' }),
  naturalAnimalPalette({ id: 'eurasian-beaver', name: 'Eurasian Beaver', tone: '#9b704d', highlight: '#c8a078', shadow: '#654631', foreground: '#35241c', ear: '#815a40', mark: '#765137', marking: 'muzzle', patch: '#ead3b1', teeth: '#f6ecd6' }),
  naturalAnimalPalette({ id: 'dark-beaver', name: 'Dark Beaver', tone: '#59483d', highlight: '#806b5a', shadow: '#342921', foreground: '#ebd7b5', ear: '#493a31', mark: '#42342c', marking: 'muzzle', patch: '#b29a7c', teeth: '#f5ead5' }),
  naturalAnimalPalette({ id: 'beaver-kit', name: 'Beaver Kit', tone: '#b08860', highlight: '#d9b48c', shadow: '#765437', foreground: '#39281f', ear: '#98704f', mark: '#856043', marking: 'muzzle', patch: '#f1dfc2', teeth: '#fff5df' }),
  naturalAnimalPalette({ id: 'american-guinea-pig', name: 'American Guinea Pig', tone: '#bc8959', highlight: '#e1b78c', shadow: '#805a3e', foreground: '#38271e', ear: '#956e59', mark: '#825a3e', marking: 'muzzle', patch: '#f4e3c7' }),
  naturalAnimalPalette({ id: 'abyssinian-guinea-pig', name: 'Abyssinian Guinea Pig', tone: '#9b6144', highlight: '#c8916d', shadow: '#653a2a', foreground: '#31221b', ear: '#794835', mark: '#75452f', marking: 'blaze', patch: '#ecd2af' }),
  naturalAnimalPalette({ id: 'teddy-guinea-pig', name: 'Teddy Guinea Pig', tone: '#dbc39d', highlight: '#f4e3c9', shadow: '#ac906d', foreground: '#443126', ear: '#c1a184', mark: '#b4956e', marking: 'muzzle', patch: '#fff1d9' }),
  naturalAnimalPalette({ id: 'guinea-pig-pup', name: 'Guinea Pig Pup', tone: '#a78b76', highlight: '#d0b7a0', shadow: '#725846', foreground: '#38271f', ear: '#916f63', mark: '#7c5e4d', marking: 'muzzle', patch: '#eedccc' }),
  naturalAnimalPalette({ id: 'gray-chinchilla', name: 'Gray Chinchilla', tone: '#929197', highlight: '#c2c0c5', shadow: '#62616a', foreground: '#302e34', ear: '#77717a', mark: '#686770', marking: 'muzzle', patch: '#e7e1d9' }),
  naturalAnimalPalette({ id: 'beige-chinchilla', name: 'Beige Chinchilla', tone: '#c0ab92', highlight: '#e6d8c3', shadow: '#8e7861', foreground: '#44342a', ear: '#a88b7d', mark: '#967f66', marking: 'muzzle', patch: '#f8ead8' }),
  naturalAnimalPalette({ id: 'white-chinchilla', name: 'White Chinchilla', tone: '#dfddd5', highlight: '#fffdf5', shadow: '#b3b0a7', foreground: '#3c3633', ear: '#bea9aa', mark: '#bab7ad', marking: 'muzzle', patch: '#fffaf0' }),
  naturalAnimalPalette({ id: 'black-velvet-chinchilla', name: 'Black Velvet Chinchilla', tone: '#494850', highlight: '#77757d', shadow: '#29282e', foreground: '#e7d5bc', ear: '#666068', mark: '#323138', marking: 'muzzle', patch: '#bdb3a7' }),
  naturalAnimalPalette({ id: 'sable-ferret', name: 'Sable Ferret', tone: '#a48667', highlight: '#cfb291', shadow: '#70553d', foreground: '#2e211a', ear: '#80664f', mark: '#574536', marking: 'mask', patch: '#eee2cd' }),
  naturalAnimalPalette({ id: 'albino-ferret', name: 'Albino Ferret', tone: '#e7dfd0', highlight: '#fff9ec', shadow: '#c1b5a5', foreground: '#76524b', ear: '#d4bcb6', mark: '#c8b5a3', marking: 'muzzle', patch: '#fff6e8' }),
  naturalAnimalPalette({ id: 'cinnamon-ferret', name: 'Cinnamon Ferret', tone: '#bd8860', highlight: '#e3b694', shadow: '#83573c', foreground: '#422a21', ear: '#a56e53', mark: '#86573d', marking: 'mask', patch: '#f2e1cc' }),
  naturalAnimalPalette({ id: 'panda-ferret', name: 'Panda Ferret', tone: '#66615d', highlight: '#948f86', shadow: '#413b37', foreground: '#332822', ear: '#514945', mark: '#423c39', marking: 'mask', patch: '#f2ece2' }),
  naturalAnimalPalette({ id: 'macaque', name: 'Macaque', tone: '#9a785a', highlight: '#c6a382', shadow: '#654a35', foreground: '#3a2720', ear: '#866044', mark: '#78553c', marking: 'mask', patch: '#e5c8ad' }),
  naturalAnimalPalette({ id: 'capuchin-monkey', name: 'Capuchin Monkey', tone: '#635146', highlight: '#8e7866', shadow: '#3d3028', foreground: '#241813', ear: '#514137', mark: '#40332b', marking: 'mask', patch: '#ead5b6' }),
  naturalAnimalPalette({ id: 'golden-monkey', name: 'Golden Monkey', tone: '#ca995c', highlight: '#efd19b', shadow: '#916741', foreground: '#37302b', ear: '#ad7948', mark: '#98683f', marking: 'mask', patch: '#cfdae0' }),
  naturalAnimalPalette({ id: 'baby-monkey', name: 'Baby Monkey', tone: '#b39271', highlight: '#dbbd99', shadow: '#7f6248', foreground: '#422d24', ear: '#a0725c', mark: '#89694e', marking: 'mask', patch: '#efd5bb' }),
  naturalAnimalPalette({ id: 'yellow-chick', name: 'Yellow Chick', tone: '#efc84a', highlight: '#ffe787', shadow: '#bd8f27', foreground: '#392714', mark: '#d9a43b', marking: 'muzzle', patch: '#f8dd72' }),
  naturalAnimalPalette({ id: 'silkie-chick', name: 'Silkie Chick', tone: '#e8e4da', highlight: '#fffdf7', shadow: '#b8b4ad', foreground: '#373433', mark: '#b7afa6', marking: 'muzzle', patch: '#fff8e9' }),
  naturalAnimalPalette({ id: 'barred-rock-chick', name: 'Barred Rock Chick', tone: '#777a78', highlight: '#aaaead', shadow: '#484b4a', foreground: '#272929', mark: '#474a49', marking: 'stripes', patch: '#d6d4cc' }),
  naturalAnimalPalette({ id: 'buff-orpington-chick', name: 'Buff Orpington Chick', tone: '#d8a566', highlight: '#f1ca91', shadow: '#9e7041', foreground: '#3e2b1d', mark: '#b57f48', marking: 'muzzle', patch: '#f5d8a6' }),
  naturalAnimalPalette({ id: 'mallard-duck', name: 'Mallard Duck', tone: '#315c4a', highlight: '#5f8874', shadow: '#193c31', foreground: '#1d241f', mark: '#6b5236', marking: 'mask', patch: '#e8dfc3' }),
  naturalAnimalPalette({ id: 'pekin-duck', name: 'Pekin Duck', tone: '#eee9dc', highlight: '#fffdf5', shadow: '#c2bbae', foreground: '#443329', mark: '#d8cfc0', marking: 'muzzle', patch: '#fff7e7' }),
  naturalAnimalPalette({ id: 'muscovy-duck', name: 'Muscovy Duck', tone: '#383736', highlight: '#656260', shadow: '#1c1c1b', foreground: '#ead9c5', mark: '#b44f4d', marking: 'mask', patch: '#e7dfd3' }),
  naturalAnimalPalette({ id: 'yellow-duckling', name: 'Yellow Duckling', tone: '#efc64d', highlight: '#ffe689', shadow: '#bb8e29', foreground: '#3c2b18', mark: '#d6a53e', marking: 'muzzle', patch: '#ffe47f' }),
  naturalAnimalPalette({ id: 'emperor-penguin', name: 'Emperor Penguin', tone: '#292d31', highlight: '#555b60', shadow: '#111416', foreground: '#e0a34b', mark: '#e1b45e', marking: 'mask', patch: '#f4e9cb' }),
  naturalAnimalPalette({ id: 'adelie-penguin', name: 'Adelie Penguin', tone: '#202427', highlight: '#4b5054', shadow: '#0b0d0f', foreground: '#f1ece3', mark: '#9fa2a0', marking: 'mask', patch: '#fff9ed' }),
  naturalAnimalPalette({ id: 'gentoo-penguin', name: 'Gentoo Penguin', tone: '#30363b', highlight: '#5d656a', shadow: '#15191c', foreground: '#df8e38', mark: '#d5d3ce', marking: 'blaze', patch: '#f6f1e8' }),
  naturalAnimalPalette({ id: 'penguin-chick', name: 'Penguin Chick', tone: '#777b7b', highlight: '#a8aaaa', shadow: '#4a4e4e', foreground: '#3b302a', mark: '#989895', marking: 'muzzle', patch: '#dedbd3' }),
  naturalAnimalPalette({ id: 'barn-owl', name: 'Barn Owl', tone: '#b28a5e', highlight: '#d9b88c', shadow: '#765738', foreground: '#34281f', mark: '#8d745d', marking: 'mask', patch: '#f3e5c8' }),
  naturalAnimalPalette({ id: 'snowy-owl', name: 'Snowy Owl', tone: '#e8e5dc', highlight: '#fffdf6', shadow: '#bab9b2', foreground: '#25272a', mark: '#747878', marking: 'spots', patch: '#fff9ec' }),
  naturalAnimalPalette({ id: 'great-horned-owl', name: 'Great Horned Owl', tone: '#806046', highlight: '#ab896b', shadow: '#4e3929', foreground: '#30251d', mark: '#4d3e31', marking: 'mask', patch: '#d3b98f' }),
  naturalAnimalPalette({ id: 'little-owl', name: 'Little Owl', tone: '#93816a', highlight: '#bca98f', shadow: '#625344', foreground: '#34271d', mark: '#665443', marking: 'mask', patch: '#e3d0ae' }),
  naturalAnimalPalette({ id: 'scarlet-macaw', name: 'Scarlet Macaw', tone: '#c84235', highlight: '#e87962', shadow: '#87271f', foreground: '#2f2521', mark: '#f6e9d5', marking: 'mask', patch: '#f6e9d5' }),
  naturalAnimalPalette({ id: 'blue-yellow-macaw', name: 'Blue-and-yellow Macaw', tone: '#276aaa', highlight: '#5796cc', shadow: '#174371', foreground: '#26231f', mark: '#efc34f', marking: 'mask', patch: '#f2eadb' }),
  naturalAnimalPalette({ id: 'african-grey-parrot', name: 'African Grey Parrot', tone: '#85878a', highlight: '#b5b7b7', shadow: '#53565a', foreground: '#242426', mark: '#5f6265', marking: 'muzzle', patch: '#e0ddd4' }),
  naturalAnimalPalette({ id: 'cockatiel', name: 'Cockatiel', tone: '#a7a39a', highlight: '#d1ccc0', shadow: '#737067', foreground: '#302a24', mark: '#efbd4c', marking: 'mask', patch: '#efd769' }),
  naturalAnimalPalette({ id: 'greylag-goose', name: 'Greylag Goose', tone: '#95877a', highlight: '#bdb0a3', shadow: '#63594f', foreground: '#34291f', mark: '#75695c', marking: 'muzzle', patch: '#d8c6aa' }),
  naturalAnimalPalette({ id: 'canada-goose', name: 'Canada Goose', tone: '#383834', highlight: '#65645e', shadow: '#1d1d1a', foreground: '#f2ece0', mark: '#e3ded2', marking: 'mask', patch: '#f2ece0' }),
  naturalAnimalPalette({ id: 'snow-goose', name: 'Snow Goose', tone: '#e9e6dd', highlight: '#fffdf6', shadow: '#bbb7ad', foreground: '#3b3030', mark: '#d2cec5', marking: 'muzzle', patch: '#fff8ec' }),
  naturalAnimalPalette({ id: 'white-gosling', name: 'White Gosling', tone: '#e8d9aa', highlight: '#fff1c8', shadow: '#b8a36f', foreground: '#473421', mark: '#cfb679', marking: 'muzzle', patch: '#fff3cf' }),
  naturalAnimalPalette({ id: 'silkie-chick', name: 'Silkie Chick', tone: '#e5e2d7', highlight: '#fffdf4', shadow: '#b9b3a7', foreground: '#3c3430', mark: '#bdb8ad', marking: 'muzzle', patch: '#fff8e9' }),
  naturalAnimalPalette({ id: 'barred-rock-chick', name: 'Barred Rock Chick', tone: '#65666b', highlight: '#95979d', shadow: '#3d3e43', foreground: '#f2d78c', mark: '#303238', marking: 'muzzle', patch: '#d6d4cc' }),
  naturalAnimalPalette({ id: 'buff-orpington-chick', name: 'Buff Orpington Chick', tone: '#d9a65e', highlight: '#f4cc8a', shadow: '#9d713a', foreground: '#412a18', mark: '#a66f36', marking: 'muzzle', patch: '#f5d8a6' }),
  {
    id: 'red-fox',
    name: 'Red Fox',
    background: '#dd7646',
    gradient: ['#dd7646', '#f19b67'],
    foreground: '#26352b',
    shadow: '#974626',
    entityMaterials: {
      'fox-ear-left': { baseColor: '#c85d35', foregroundColor: '#26352b', highlightColor: '#e97e51', shadowColor: '#78361f' },
      'fox-ear-right': { baseColor: '#c85d35', foregroundColor: '#26352b', highlightColor: '#e97e51', shadowColor: '#78361f' },
      'fox-head': { baseColor: '#dd7646', foregroundColor: '#26352b', highlightColor: '#f19b67', shadowColor: '#974626' }
    }
  },
  {
    id: 'arctic-fox',
    name: 'Arctic Fox',
    background: '#e2e6e0',
    gradient: ['#e2e6e0', '#fffdf8'],
    foreground: '#38454c',
    shadow: '#adb9bd',
    entityMaterials: {
      'fox-ear-left': { baseColor: '#dce1df', foregroundColor: '#38454c', highlightColor: '#f8f7f2', shadowColor: '#a9b5b8' },
      'fox-ear-right': { baseColor: '#dce1df', foregroundColor: '#38454c', highlightColor: '#f8f7f2', shadowColor: '#a9b5b8' },
      'fox-head': { baseColor: '#e2e6e0', foregroundColor: '#38454c', highlightColor: '#fffdf8', shadowColor: '#adb9bd' }
    }
  },
  {
    id: 'silver-fox',
    name: 'Silver Fox',
    background: '#484b4a',
    gradient: ['#484b4a', '#808381'],
    foreground: '#bc9160',
    shadow: '#242725',
    entityMaterials: {
      'fox-ear-left': { baseColor: '#383b3a', foregroundColor: '#bc9160', highlightColor: '#777b78', shadowColor: '#202220' },
      'fox-ear-right': { baseColor: '#383b3a', foregroundColor: '#bc9160', highlightColor: '#777b78', shadowColor: '#202220' },
      'fox-head': { baseColor: '#484b4a', foregroundColor: '#bc9160', highlightColor: '#808381', shadowColor: '#242725' }
    }
  },
  {
    id: 'fennec-fox',
    name: 'Fennec Fox',
    background: '#dfbe86',
    gradient: ['#dfbe86', '#f4dcab'],
    foreground: '#57412f',
    shadow: '#ad8757',
    entityMaterials: {
      'fox-ear-left': { baseColor: '#d6ab74', foregroundColor: '#57412f', highlightColor: '#f0cc98', shadowColor: '#9e704a' },
      'fox-ear-right': { baseColor: '#d6ab74', foregroundColor: '#57412f', highlightColor: '#f0cc98', shadowColor: '#9e704a' },
      'fox-head': { baseColor: '#dfbe86', foregroundColor: '#57412f', highlightColor: '#f4dcab', shadowColor: '#ad8757' }
    }
  },
  {
    id: 'ice',
    name: 'Ice',
    background: '#e0f2fe',
    gradient: ['#e0f2fe', '#7dd3fc'],
    foreground: '#082f49',
    shadow: '#38bdf8'
  },
  {
    id: 'ink',
    name: 'Ink',
    background: '#020617',
    gradient: ['#020617', '#64748b'],
    foreground: '#f8fafc',
    shadow: '#334155'
  },
  {
    id: 'clay',
    name: 'Clay',
    background: '#fca5a5',
    gradient: ['#fca5a5', '#dc2626'],
    foreground: '#2f0f0f',
    shadow: '#b91c1c'
  },
  {
    id: 'lilac',
    name: 'Lilac',
    background: '#ede9fe',
    gradient: ['#ede9fe', '#8b5cf6'],
    foreground: '#2e1065',
    shadow: '#7c3aed'
  },
  {
    id: 'pine',
    name: 'Pine',
    background: '#064e3b',
    gradient: ['#064e3b', '#10b981'],
    foreground: '#ecfdf5',
    shadow: '#047857'
  },
  {
    id: 'banana',
    name: 'Banana',
    background: '#fef08a',
    gradient: ['#fef08a', '#facc15'],
    foreground: '#29210c',
    shadow: '#ca8a04'
  }
]

export const DEFAULT_AVATAR_GLYPH_EXPRESSION = '0w0'

const AVATAR_EYE_GLYPHS = new Set(Array.from('0OoQqPpUuVvXx^~=*@-_><'))
const AVATAR_MOUTH_GLYPHS = new Set(Array.from('wWvVuUxXqQaAmMnN.-_^~=+*'))

export const getAvatarPalette = (paletteId: string): AvatarPalette => (
  AVATAR_PALETTES.find(palette => palette.id === paletteId) ?? AVATAR_PALETTES[0]!
)

export const isSupportedAvatarGlyphExpression = (expression: string) => {
  const glyphs = Array.from(expression.trim())
  return glyphs.length === 3 && AVATAR_EYE_GLYPHS.has(glyphs[0]!) &&
    AVATAR_MOUTH_GLYPHS.has(glyphs[1]!) && AVATAR_EYE_GLYPHS.has(glyphs[2]!)
}
