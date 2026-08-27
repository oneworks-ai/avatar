import * as avatarRuntime from '@oneworks/avatar'
import type { AvatarPalette } from '@oneworks/avatar'

import { resolveSeededAvatarPaletteTone } from './avatarSeed'
import type { AvatarPaletteToneJitterRange, AvatarSeedDomain } from './avatarSeed'

type AvatarToneEntityPart = {
  readonly baseColor: string
  readonly face: boolean
  readonly highlightColor?: string
  readonly id?: string
  readonly shadowColor?: string
}

const toneRuntime = avatarRuntime as typeof avatarRuntime & {
  readonly applyAvatarPaletteColorTone?: (color: string, amount: number) => string
  readonly applyAvatarPaletteToneJitter?: (palette: AvatarPalette, amount: number) => AvatarPalette
  readonly resolveAvatarPaletteFromEntityParts?: (
    palette: AvatarPalette,
    entityParts: readonly AvatarToneEntityPart[]
  ) => AvatarPalette
}

/** Each breed owns its natural fur-lightness envelope; palette identity never changes. */
export const AVATAR_BREED_TONE_JITTER_RANGES = {
  'abyssinian-guinea-pig': { min: -15, max: 12 },
  'african-lion': { min: -16, max: 13 },
  'albino-ferret': { min: -6, max: 4 },
  'albino-hedgehog': { min: -6, max: 4 },
  'american-guinea-pig': { min: -15, max: 13 },
  'alpaca-cria': { min: -10, max: 8 },
  'asian-black-bear': { min: -9, max: 8 },
  'asian-small-clawed-otter': { min: -14, max: 12 },
  'arctic-fox': { min: -7, max: 4 },
  'baby-monkey': { min: -12, max: 10 },
  'beaver-kit': { min: -12, max: 10 },
  'beige-chinchilla': { min: -11, max: 9 },
  'black-cat': { min: -7, max: 9 },
  'black-faced-sheep': { min: -8, max: 5 },
  'black-pig': { min: -9, max: 10 },
  'black-squirrel': { min: -8, max: 8 },
  'black-velvet-chinchilla': { min: -8, max: 7 },
  'barred-rock-chick': { min: -9, max: 7 },
  'bengal-tiger': { min: -15, max: 12 },
  'border-collie': { min: -9, max: 8 },
  'british-shorthair': { min: -12, max: 11 },
  'buff-orpington-chick': { min: -13, max: 10 },
  'brown-bear': { min: -20, max: 17 },
  capybara: { min: -19, max: 16 },
  'capuchin-monkey': { min: -12, max: 10 },
  'caramel-alpaca': { min: -16, max: 13 },
  'capybara-pup': { min: -13, max: 11 },
  corgi: { min: -15, max: 13 },
  'cow-calf': { min: -11, max: 9 },
  'cream-alpaca': { min: -8, max: 5 },
  'cream-hedgehog': { min: -9, max: 7 },
  chipmunk: { min: -14, max: 12 },
  'cinnamon-ferret': { min: -14, max: 12 },
  'cow-cat': { min: -7, max: 7 },
  dalmatian: { min: -7, max: 5 },
  'dairy-cow': { min: -7, max: 5 },
  'dark-beaver': { min: -11, max: 9 },
  'dark-capybara': { min: -16, max: 13 },
  'deer-fawn': { min: -13, max: 12 },
  'dutch-rabbit': { min: -10, max: 9 },
  'english-spot': { min: -7, max: 6 },
  'eurasian-beaver': { min: -16, max: 13 },
  'european-hedgehog': { min: -13, max: 11 },
  'fennec-fox': { min: -11, max: 9 },
  'giant-panda': { min: -6, max: 4 },
  'golden-retriever': { min: -16, max: 14 },
  'golden-tiger': { min: -12, max: 10 },
  'golden-monkey': { min: -13, max: 11 },
  'gray-alpaca': { min: -12, max: 11 },
  'gray-chinchilla': { min: -12, max: 10 },
  'gray-seal': { min: -11, max: 9 },
  'gray-squirrel': { min: -12, max: 11 },
  'himalayan-rabbit': { min: -7, max: 5 },
  'harbor-seal': { min: -12, max: 10 },
  'harp-seal': { min: -6, max: 4 },
  'highland-cow': { min: -17, max: 14 },
  'holland-lop': { min: -14, max: 12 },
  'horned-ram': { min: -12, max: 10 },
  husky: { min: -10, max: 9 },
  koala: { min: -11, max: 10 },
  lamb: { min: -7, max: 5 },
  'lionhead-rabbit': { min: -15, max: 13 },
  'lion-cub': { min: -11, max: 9 },
  lioness: { min: -13, max: 11 },
  macaque: { min: -14, max: 12 },
  'mountain-goat': { min: -10, max: 8 },
  'netherland-dwarf': { min: -11, max: 10 },
  'north-american-beaver': { min: -17, max: 14 },
  'orange-tabby': { min: -16, max: 14 },
  'pink-pig': { min: -10, max: 8 },
  'panda-ferret': { min: -8, max: 7 },
  'polar-bear': { min: -7, max: 4 },
  'pudding-hamster': { min: -12, max: 10 },
  raccoon: { min: -12, max: 11 },
  'red-fox': { min: -19, max: 16 },
  'red-squirrel': { min: -17, max: 14 },
  'red-panda': { min: -17, max: 14 },
  reindeer: { min: -14, max: 12 },
  'river-otter': { min: -16, max: 14 },
  'russian-blue': { min: -11, max: 10 },
  'sandy-capybara': { min: -14, max: 12 },
  'sable-ferret': { min: -14, max: 12 },
  'sapphire-hamster': { min: -11, max: 10 },
  'seal-pup': { min: -7, max: 5 },
  'sea-otter': { min: -14, max: 12 },
  'shiba-inu': { min: -15, max: 13 },
  siamese: { min: -9, max: 7 },
  'sika-deer': { min: -16, max: 14 },
  'silver-fox': { min: -10, max: 9 },
  'silver-fox-hamster': { min: -8, max: 5 },
  'silkie-chick': { min: -6, max: 4 },
  'spectacled-bear': { min: -13, max: 11 },
  'spotted-pig': { min: -11, max: 9 },
  'sun-bear': { min: -9, max: 8 },
  'syrian-hamster': { min: -15, max: 13 },
  'teddy-guinea-pig': { min: -9, max: 7 },
  'tiger-cub': { min: -11, max: 9 },
  'teddy-bear': { min: -17, max: 15 },
  'white-deer': { min: -7, max: 4 },
  'white-chinchilla': { min: -6, max: 4 },
  'white-lion': { min: -8, max: 5 },
  'white-sheep': { min: -7, max: 4 },
  'white-tiger': { min: -7, max: 4 },
  'wild-boar': { min: -15, max: 12 },
  wombat: { min: -13, max: 11 },
  'yellow-chick': { min: -10, max: 8 },
  'mallard-duck': { min: -12, max: 10 },
  'pekin-duck': { min: -6, max: 4 },
  'muscovy-duck': { min: -9, max: 8 },
  'yellow-duckling': { min: -10, max: 8 },
  'emperor-penguin': { min: -7, max: 5 },
  'adelie-penguin': { min: -7, max: 5 },
  'gentoo-penguin': { min: -8, max: 6 },
  'penguin-chick': { min: -9, max: 7 },
  'barn-owl': { min: -12, max: 10 },
  'snowy-owl': { min: -6, max: 4 },
  'great-horned-owl': { min: -15, max: 12 },
  'little-owl': { min: -13, max: 11 },
  'scarlet-macaw': { min: -14, max: 11 },
  'blue-yellow-macaw': { min: -12, max: 10 },
  'african-grey-parrot': { min: -10, max: 9 },
  cockatiel: { min: -9, max: 8 },
  'greylag-goose': { min: -13, max: 11 },
  'canada-goose': { min: -8, max: 7 },
  'snow-goose': { min: -6, max: 4 },
  'white-gosling': { min: -7, max: 5 },
  'cinnamon-hedgehog': { min: -14, max: 11 },
  'jersey-cow': { min: -15, max: 12 },
  'guinea-pig-pup': { min: -10, max: 8 }
} as const satisfies Readonly<Record<string, AvatarPaletteToneJitterRange>>

export const getAvatarBreedToneJitterRange = (paletteId: string): AvatarPaletteToneJitterRange => (
  AVATAR_BREED_TONE_JITTER_RANGES[paletteId as keyof typeof AVATAR_BREED_TONE_JITTER_RANGES] ??
  { min: -10, max: 10 }
)

export const resolveAvatarBreedPalette = (
  paletteId: string,
  seed: string,
  seedDomain?: AvatarSeedDomain
): AvatarPalette => applyAvatarPaletteToneJitter(
  avatarRuntime.getAvatarPalette(paletteId),
  resolveSeededAvatarPaletteTone(seed, paletteId, seedDomain)
)

export const applyAvatarPaletteToneJitter = (
  palette: AvatarPalette,
  amount: number
): AvatarPalette => toneRuntime.applyAvatarPaletteToneJitter?.(palette, amount) ?? palette

export const applyAvatarBreedMarkingTone = (color: string, amount: number): string => (
  toneRuntime.applyAvatarPaletteColorTone?.(color, amount) ?? color
)

export const resolveAvatarBreedPaletteFromEntityParts = (
  palette: AvatarPalette,
  entityParts: readonly AvatarToneEntityPart[]
): AvatarPalette => toneRuntime.resolveAvatarPaletteFromEntityParts?.(palette, entityParts) ?? palette
