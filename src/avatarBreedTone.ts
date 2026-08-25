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
  'asian-black-bear': { min: -9, max: 8 },
  'asian-small-clawed-otter': { min: -14, max: 12 },
  'arctic-fox': { min: -7, max: 4 },
  'black-cat': { min: -7, max: 9 },
  'black-faced-sheep': { min: -8, max: 5 },
  'black-pig': { min: -9, max: 10 },
  'border-collie': { min: -9, max: 8 },
  'british-shorthair': { min: -12, max: 11 },
  'brown-bear': { min: -20, max: 17 },
  capybara: { min: -19, max: 16 },
  'capybara-pup': { min: -13, max: 11 },
  corgi: { min: -15, max: 13 },
  'cow-cat': { min: -7, max: 7 },
  dalmatian: { min: -7, max: 5 },
  'dark-capybara': { min: -16, max: 13 },
  'deer-fawn': { min: -13, max: 12 },
  'dutch-rabbit': { min: -10, max: 9 },
  'english-spot': { min: -7, max: 6 },
  'fennec-fox': { min: -11, max: 9 },
  'giant-panda': { min: -6, max: 4 },
  'golden-retriever': { min: -16, max: 14 },
  'himalayan-rabbit': { min: -7, max: 5 },
  'holland-lop': { min: -14, max: 12 },
  'horned-ram': { min: -12, max: 10 },
  husky: { min: -10, max: 9 },
  koala: { min: -11, max: 10 },
  lamb: { min: -7, max: 5 },
  'lionhead-rabbit': { min: -15, max: 13 },
  'mountain-goat': { min: -10, max: 8 },
  'netherland-dwarf': { min: -11, max: 10 },
  'orange-tabby': { min: -16, max: 14 },
  'pink-pig': { min: -10, max: 8 },
  'polar-bear': { min: -7, max: 4 },
  'pudding-hamster': { min: -12, max: 10 },
  raccoon: { min: -12, max: 11 },
  'red-fox': { min: -19, max: 16 },
  'red-panda': { min: -17, max: 14 },
  reindeer: { min: -14, max: 12 },
  'river-otter': { min: -16, max: 14 },
  'russian-blue': { min: -11, max: 10 },
  'sandy-capybara': { min: -14, max: 12 },
  'sapphire-hamster': { min: -11, max: 10 },
  'sea-otter': { min: -14, max: 12 },
  'shiba-inu': { min: -15, max: 13 },
  siamese: { min: -9, max: 7 },
  'sika-deer': { min: -16, max: 14 },
  'silver-fox': { min: -10, max: 9 },
  'silver-fox-hamster': { min: -8, max: 5 },
  'spectacled-bear': { min: -13, max: 11 },
  'spotted-pig': { min: -11, max: 9 },
  'sun-bear': { min: -9, max: 8 },
  'syrian-hamster': { min: -15, max: 13 },
  'teddy-bear': { min: -17, max: 15 },
  'white-deer': { min: -7, max: 4 },
  'white-sheep': { min: -7, max: 4 },
  'wild-boar': { min: -15, max: 12 },
  wombat: { min: -13, max: 11 }
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
