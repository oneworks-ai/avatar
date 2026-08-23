export interface AvatarPalette {
  readonly background: string
  readonly foreground: string
  readonly gradient: readonly [string, string]
  readonly id: string
  readonly name: string
  readonly shadow: string
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
