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
    readonly marking?: 'blaze' | 'mask' | 'muzzle' | 'spots' | 'panda' | 'spectacles' | 'moon' | 'sun' | 'red-panda' | 'raccoon' | 'wombat'
    readonly patch: string
  }
  readonly entityMaterials?: Readonly<Record<string, { readonly baseColor: string; readonly foregroundColor: string; readonly highlightColor: string; readonly shadowColor: string }>>
}

interface NaturalAnimalPaletteOptions {
  readonly ear?: string
  readonly foreground: string
  readonly highlight: string
  readonly horn?: string
  readonly id: string
  readonly mark: string
  readonly marking: NonNullable<AvatarPalette['coat']>['marking']
  readonly name: string
  readonly patch: string
  readonly shadow: string
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
  const horn = options.horn == null ? null : material(options.horn)

  return {
    background: options.tone,
    coat: { mark: options.mark, marking: options.marking, patch: options.patch },
    entityMaterials: {
      'cheek-left': material(options.patch),
      'cheek-right': material(options.patch),
      'ear-left': ear,
      'ear-right': ear,
      muzzle: material(options.patch),
      'nostril-left': material(options.foreground),
      'nostril-right': material(options.foreground),
      snout: material(options.patch),
      ...(horn == null ? {} : {
        'antler-left': horn,
        'antler-right': horn,
        'horn-left': horn,
        'horn-right': horn
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
  { id: 'polar-bear', name: 'Polar Bear', background: '#f4f1e8', gradient: ['#f4f1e8', '#d9e4e7'], foreground: '#26343a', shadow: '#aebec2', coat: { mark: '#b6d0d4', marking: 'muzzle', patch: '#fffdf6' }, entityMaterials: { 'ear-left': { baseColor: '#e3e8e5', foregroundColor: '#26343a', highlightColor: '#ffffff', shadowColor: '#afc1c3' }, 'ear-right': { baseColor: '#e3e8e5', foregroundColor: '#26343a', highlightColor: '#ffffff', shadowColor: '#afc1c3' }, primary: { baseColor: '#f4f1e8', foregroundColor: '#26343a', highlightColor: '#fffdf6', shadowColor: '#aebec2' } } },
  { id: 'asian-black-bear', name: 'Asian Black Bear', background: '#242527', gradient: ['#242527', '#4b4d50'], foreground: '#d9b57a', shadow: '#0d0e0f', coat: { mark: '#111214', marking: 'moon', patch: '#e7d7ad' }, entityMaterials: { 'ear-left': { baseColor: '#161719', foregroundColor: '#d9b57a', highlightColor: '#414348', shadowColor: '#070708' }, 'ear-right': { baseColor: '#161719', foregroundColor: '#d9b57a', highlightColor: '#414348', shadowColor: '#070708' }, primary: { baseColor: '#242527', foregroundColor: '#d9b57a', highlightColor: '#4b4d50', shadowColor: '#0d0e0f' } } },
  { id: 'giant-panda', name: 'Giant Panda', background: '#f5f3ec', gradient: ['#f5f3ec', '#d9ddd9'], foreground: '#b56c45', shadow: '#9fa6a2', coat: { mark: '#303338', marking: 'panda', patch: '#f8f6ef' }, entityMaterials: { 'ear-left': { baseColor: '#24272a', foregroundColor: '#b56c45', highlightColor: '#43484b', shadowColor: '#101113' }, 'ear-right': { baseColor: '#24272a', foregroundColor: '#b56c45', highlightColor: '#43484b', shadowColor: '#101113' }, primary: { baseColor: '#f5f3ec', foregroundColor: '#b56c45', highlightColor: '#ffffff', shadowColor: '#9fa6a2' } } },
  { id: 'spectacled-bear', name: 'Spectacled Bear', background: '#3a2e25', gradient: ['#3a2e25', '#675142'], foreground: '#d4a871', shadow: '#1e1712', coat: { mark: '#d7c19a', marking: 'spectacles', patch: '#b88958' }, entityMaterials: { 'ear-left': { baseColor: '#2b221c', foregroundColor: '#d4a871', highlightColor: '#514139', shadowColor: '#15100d' }, 'ear-right': { baseColor: '#2b221c', foregroundColor: '#d4a871', highlightColor: '#514139', shadowColor: '#15100d' }, primary: { baseColor: '#3a2e25', foregroundColor: '#d4a871', highlightColor: '#675142', shadowColor: '#1e1712' } } },
  { id: 'sun-bear', name: 'Sun Bear', background: '#2c2722', gradient: ['#2c2722', '#544a3d'], foreground: '#d9a56b', shadow: '#14110e', coat: { mark: '#151310', marking: 'sun', patch: '#e8bd77' }, entityMaterials: { 'ear-left': { baseColor: '#1d1a17', foregroundColor: '#d9a56b', highlightColor: '#3e3730', shadowColor: '#0d0b0a' }, 'ear-right': { baseColor: '#1d1a17', foregroundColor: '#d9a56b', highlightColor: '#3e3730', shadowColor: '#0d0b0a' }, primary: { baseColor: '#2c2722', foregroundColor: '#d9a56b', highlightColor: '#544a3d', shadowColor: '#14110e' } } },
  { id: 'red-panda', name: 'Red Panda', background: '#b65b32', gradient: ['#b65b32', '#de9257'], foreground: '#2d211c', shadow: '#6b301e', coat: { mark: '#f1d7ae', marking: 'red-panda', patch: '#f5e6c9' }, entityMaterials: { 'ear-left': { baseColor: '#7f3825', foregroundColor: '#2d211c', highlightColor: '#b75e38', shadowColor: '#431c15' }, 'ear-right': { baseColor: '#7f3825', foregroundColor: '#2d211c', highlightColor: '#b75e38', shadowColor: '#431c15' }, primary: { baseColor: '#b65b32', foregroundColor: '#2d211c', highlightColor: '#de9257', shadowColor: '#6b301e' } } },
  { id: 'koala', name: 'Koala', background: '#87949a', gradient: ['#87949a', '#b8c2c1'], foreground: '#273238', shadow: '#55636a', coat: { mark: '#d7d4c6', marking: 'muzzle', patch: '#e9e5d9' }, entityMaterials: { 'ear-left': { baseColor: '#69767d', foregroundColor: '#273238', highlightColor: '#9ba8aa', shadowColor: '#424d52' }, 'ear-right': { baseColor: '#69767d', foregroundColor: '#273238', highlightColor: '#9ba8aa', shadowColor: '#424d52' }, primary: { baseColor: '#87949a', foregroundColor: '#273238', highlightColor: '#b8c2c1', shadowColor: '#55636a' } } },
  { id: 'raccoon', name: 'Raccoon', background: '#74716c', gradient: ['#74716c', '#aaa59b'], foreground: '#2a2d31', shadow: '#484640', coat: { mark: '#34383c', marking: 'raccoon', patch: '#d9d2c2' }, entityMaterials: { 'ear-left': { baseColor: '#4d5050', foregroundColor: '#2a2d31', highlightColor: '#747570', shadowColor: '#2b2d2e' }, 'ear-right': { baseColor: '#4d5050', foregroundColor: '#2a2d31', highlightColor: '#747570', shadowColor: '#2b2d2e' }, primary: { baseColor: '#74716c', foregroundColor: '#2a2d31', highlightColor: '#aaa59b', shadowColor: '#484640' } } },
  { id: 'wombat', name: 'Wombat', background: '#786a5c', gradient: ['#786a5c', '#a99a89'], foreground: '#312a25', shadow: '#4c4138', coat: { mark: '#5b5046', marking: 'wombat', patch: '#d5c5ae' }, entityMaterials: { 'ear-left': { baseColor: '#615549', foregroundColor: '#312a25', highlightColor: '#84776a', shadowColor: '#3e352e' }, 'ear-right': { baseColor: '#615549', foregroundColor: '#312a25', highlightColor: '#84776a', shadowColor: '#3e352e' }, primary: { baseColor: '#786a5c', foregroundColor: '#312a25', highlightColor: '#a99a89', shadowColor: '#4c4138' } } },
  { id: 'teddy-bear', name: 'Teddy Bear', background: '#b98050', gradient: ['#b98050', '#dfad78'], foreground: '#4b2d1d', shadow: '#77452c', coat: { mark: '#895232', marking: 'muzzle', patch: '#edc38d' }, entityMaterials: { 'ear-left': { baseColor: '#9a5d3b', foregroundColor: '#4b2d1d', highlightColor: '#c98254', shadowColor: '#5f3522' }, 'ear-right': { baseColor: '#9a5d3b', foregroundColor: '#4b2d1d', highlightColor: '#c98254', shadowColor: '#5f3522' }, primary: { baseColor: '#b98050', foregroundColor: '#4b2d1d', highlightColor: '#dfad78', shadowColor: '#77452c' } } },
  naturalAnimalPalette({ id: 'syrian-hamster', name: 'Syrian Hamster', tone: '#c99152', highlight: '#edc38d', shadow: '#795032', foreground: '#38241c', ear: '#b97855', mark: '#a16c3f', marking: 'muzzle', patch: '#f7e4c5' }),
  naturalAnimalPalette({ id: 'pudding-hamster', name: 'Pudding Hamster', tone: '#e5bd76', highlight: '#f8dea7', shadow: '#ad8350', foreground: '#4e3826', ear: '#d6a47c', mark: '#c59658', marking: 'muzzle', patch: '#fff0d1' }),
  naturalAnimalPalette({ id: 'silver-fox-hamster', name: 'Silver Fox Hamster', tone: '#ece9e1', highlight: '#fffdf6', shadow: '#b4afa4', foreground: '#302b2a', ear: '#b9a7a3', mark: '#a9a39c', marking: 'blaze', patch: '#fffdf8' }),
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
  naturalAnimalPalette({ id: 'spotted-pig', name: 'Spotted Pig', tone: '#ead3c7', highlight: '#fff0e5', shadow: '#a99589', foreground: '#55372f', ear: '#d7b3a7', mark: '#595251', marking: 'spots', patch: '#f4d8cd' }),
  naturalAnimalPalette({ id: 'wild-boar', name: 'Wild Boar', tone: '#665347', highlight: '#927969', shadow: '#403329', foreground: '#e8cbaa', ear: '#564338', mark: '#43352e', marking: 'blaze', patch: '#b49273' }),
  naturalAnimalPalette({ id: 'sika-deer', name: 'Sika Deer', tone: '#b77a4c', highlight: '#dda77a', shadow: '#744931', foreground: '#39251b', ear: '#a06747', horn: '#806447', mark: '#f2ddbb', marking: 'spots', patch: '#f5e7cf' }),
  naturalAnimalPalette({ id: 'reindeer', name: 'Reindeer', tone: '#8a7565', highlight: '#b49c84', shadow: '#59493f', foreground: '#33271f', ear: '#756153', horn: '#b59876', mark: '#cbbba6', marking: 'muzzle', patch: '#e2d5c1' }),
  naturalAnimalPalette({ id: 'white-deer', name: 'White Deer', tone: '#ece9df', highlight: '#fffdf4', shadow: '#c0b8aa', foreground: '#453a34', ear: '#e2d8ca', horn: '#b8a386', mark: '#d7cec0', marking: 'muzzle', patch: '#fff9ec' }),
  naturalAnimalPalette({ id: 'deer-fawn', name: 'Fawn', tone: '#c28a5a', highlight: '#e4b587', shadow: '#845839', foreground: '#3d281c', ear: '#b07451', mark: '#f6e5c8', marking: 'spots', patch: '#f7ead2' }),
  naturalAnimalPalette({ id: 'white-sheep', name: 'White Sheep', tone: '#f0ece0', highlight: '#fffdf6', shadow: '#c6bca9', foreground: '#3a302c', ear: '#d8cbb9', mark: '#e0d7c5', marking: 'muzzle', patch: '#f7eee0' }),
  naturalAnimalPalette({ id: 'black-faced-sheep', name: 'Black-faced Sheep', tone: '#e9e4d8', highlight: '#fffdf4', shadow: '#beb5a5', foreground: '#ecdfc2', ear: '#383438', mark: '#39353a', marking: 'mask', patch: '#454047' }),
  naturalAnimalPalette({ id: 'horned-ram', name: 'Horned Ram', tone: '#cec2ac', highlight: '#ece2d0', shadow: '#948674', foreground: '#43352d', ear: '#b6a58e', horn: '#977557', mark: '#aa947c', marking: 'muzzle', patch: '#efe3ce' }),
  naturalAnimalPalette({ id: 'lamb', name: 'Lamb', tone: '#f3eee5', highlight: '#fffdf8', shadow: '#d0c4b5', foreground: '#584038', ear: '#e2c5bf', mark: '#dfd1c5', marking: 'muzzle', patch: '#fff4ea' }),
  naturalAnimalPalette({ id: 'mountain-goat', name: 'Mountain Goat', tone: '#e5e0d4', highlight: '#fbf8f0', shadow: '#ada395', foreground: '#4b3b32', ear: '#cfc5b7', horn: '#806b58', mark: '#c4b5a5', marking: 'blaze', patch: '#f5eee2' }),
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
    background: '#edf0eb',
    gradient: ['#edf0eb', '#fffdf8'],
    foreground: '#38454c',
    shadow: '#adb9bd',
    entityMaterials: {
      'fox-ear-left': { baseColor: '#dce1df', foregroundColor: '#38454c', highlightColor: '#f8f7f2', shadowColor: '#a9b5b8' },
      'fox-ear-right': { baseColor: '#dce1df', foregroundColor: '#38454c', highlightColor: '#f8f7f2', shadowColor: '#a9b5b8' },
      'fox-head': { baseColor: '#edf0eb', foregroundColor: '#38454c', highlightColor: '#fffdf8', shadowColor: '#adb9bd' }
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

const AVATAR_EYE_GLYPHS = new Set(Array.from('0OoQqPpUuVvXx^~=*@-_'))
const AVATAR_MOUTH_GLYPHS = new Set(Array.from('wWvVuUxXqQaAmMnN.-_^~=+*'))

export const getAvatarPalette = (paletteId: string): AvatarPalette => (
  AVATAR_PALETTES.find(palette => palette.id === paletteId) ?? AVATAR_PALETTES[0]!
)

export const isSupportedAvatarGlyphExpression = (expression: string) => {
  const glyphs = Array.from(expression.trim())
  return glyphs.length === 3 && AVATAR_EYE_GLYPHS.has(glyphs[0]!) &&
    AVATAR_MOUTH_GLYPHS.has(glyphs[1]!) && AVATAR_EYE_GLYPHS.has(glyphs[2]!)
}
