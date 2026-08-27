import type { AvatarEntityPreset } from './avatarEntityPresets'

type BuiltInAvatarEntityPreset = Exclude<AvatarEntityPreset, 'custom'>

export const DEFAULT_AVATAR_PREVIEW_LIGHT = { azimuth: -35, elevation: 40 } as const

const AVATAR_BREED_PRESET_SNAPSHOT_MODULES = import.meta.glob(
  './avatarPresetSnapshots/breeds/*.svg',
  { eager: true, import: 'default', query: '?url' }
) as Readonly<Record<string, string>>

const AVATAR_PIXEL_STYLE_PRESET_SNAPSHOT_MODULES = import.meta.glob(
  './avatarPresetSnapshots/pixel/*.svg',
  { eager: true, import: 'default', query: '?url' }
) as Readonly<Record<string, string>>

export const AVATAR_BREED_PRESET_SNAPSHOT_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(AVATAR_BREED_PRESET_SNAPSHOT_MODULES).map(([source, url]) => [
    source.slice(source.lastIndexOf('/') + 1, -'.svg'.length),
    url
  ])
)

export const AVATAR_PIXEL_STYLE_PRESET_SNAPSHOT_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(AVATAR_PIXEL_STYLE_PRESET_SNAPSHOT_MODULES).map(([source, url]) => [
    source.slice(source.lastIndexOf('/') + 1, -'.svg'.length),
    url
  ])
)

export const getAvatarBreedPresetSnapshotUrl = (species: string, breed: string) => (
  AVATAR_BREED_PRESET_SNAPSHOT_URLS[`${species}--${breed}`] ?? null
)

export const AVATAR_ENTITY_PRESET_SNAPSHOT_URLS: Readonly<Record<BuiltInAvatarEntityPreset, string>> = {
  alpaca: new URL('./avatarPresetSnapshots/alpaca.svg', import.meta.url).href,
  bear: new URL('./avatarPresetSnapshots/bear.svg', import.meta.url).href,
  beaver: new URL('./avatarPresetSnapshots/beaver.svg', import.meta.url).href,
  bun: new URL('./avatarPresetSnapshots/bun.svg', import.meta.url).href,
  capybara: new URL('./avatarPresetSnapshots/capybara.svg', import.meta.url).href,
  cat: new URL('./avatarPresetSnapshots/cat.svg', import.meta.url).href,
  chick: new URL('./avatarPresetSnapshots/chick.svg', import.meta.url).href,
  chinchilla: new URL('./avatarPresetSnapshots/chinchilla.svg', import.meta.url).href,
  cloud: new URL('./avatarPresetSnapshots/cloud.svg', import.meta.url).href,
  cow: new URL('./avatarPresetSnapshots/cow.svg', import.meta.url).href,
  deer: new URL('./avatarPresetSnapshots/deer.svg', import.meta.url).href,
  dog: new URL('./avatarPresetSnapshots/dog.svg', import.meta.url).href,
  duck: new URL('./avatarPresetSnapshots/duck.svg', import.meta.url).href,
  ferret: new URL('./avatarPresetSnapshots/ferret.svg', import.meta.url).href,
  fox: new URL('./avatarPresetSnapshots/fox.svg', import.meta.url).href,
  goose: new URL('./avatarPresetSnapshots/goose.svg', import.meta.url).href,
  'guinea-pig': new URL('./avatarPresetSnapshots/guinea-pig.svg', import.meta.url).href,
  hamster: new URL('./avatarPresetSnapshots/hamster.svg', import.meta.url).href,
  hedgehog: new URL('./avatarPresetSnapshots/hedgehog.svg', import.meta.url).href,
  lion: new URL('./avatarPresetSnapshots/lion.svg', import.meta.url).href,
  monkey: new URL('./avatarPresetSnapshots/monkey.svg', import.meta.url).href,
  otter: new URL('./avatarPresetSnapshots/otter.svg', import.meta.url).href,
  owl: new URL('./avatarPresetSnapshots/owl.svg', import.meta.url).href,
  parrot: new URL('./avatarPresetSnapshots/parrot.svg', import.meta.url).href,
  penguin: new URL('./avatarPresetSnapshots/penguin.svg', import.meta.url).href,
  pig: new URL('./avatarPresetSnapshots/pig.svg', import.meta.url).href,
  rabbit: new URL('./avatarPresetSnapshots/rabbit.svg', import.meta.url).href,
  seal: new URL('./avatarPresetSnapshots/seal.svg', import.meta.url).href,
  sheep: new URL('./avatarPresetSnapshots/sheep.svg', import.meta.url).href,
  squirrel: new URL('./avatarPresetSnapshots/squirrel.svg', import.meta.url).href,
  sun: new URL('./avatarPresetSnapshots/sun.svg', import.meta.url).href,
  tiger: new URL('./avatarPresetSnapshots/tiger.svg', import.meta.url).href
}
