import {
  AVATAR_BREED_PRESET_SNAPSHOT_URLS,
  AVATAR_ENTITY_PRESET_SNAPSHOT_URLS,
  AVATAR_PIXEL_STYLE_PRESET_SNAPSHOT_URLS
} from './avatarPresetSnapshots'
import type { AvatarEffectStylePresetId } from './avatarEffectStylePresets'
import { AVATAR_EFFECT_STYLE_PRESETS } from './avatarEffectStylePresets'

export const LAST_EDITOR_QUERY_STORAGE_KEY = 'oneworks-avatar-last-editor-query-v1'

export type HomeTemplateId = keyof typeof AVATAR_ENTITY_PRESET_SNAPSHOT_URLS

const HOME_FEATURED_TEMPLATE_IDS = ['dog', 'cat', 'bear', 'rabbit', 'cloud', 'sun'] as const satisfies readonly HomeTemplateId[]
const HOME_FEATURED_TEMPLATE_ID_SET = new Set<HomeTemplateId>(HOME_FEATURED_TEMPLATE_IDS)

const getHomeTemplateLabel = (id: HomeTemplateId) => (
  id.split('-').map(segment => `${segment[0]?.toUpperCase() ?? ''}${segment.slice(1)}`).join(' ')
)

export const HOME_TEMPLATE_IDS: readonly HomeTemplateId[] = [
  ...HOME_FEATURED_TEMPLATE_IDS,
  ...(Object.keys(AVATAR_ENTITY_PRESET_SNAPSHOT_URLS) as HomeTemplateId[])
    .filter(id => !HOME_FEATURED_TEMPLATE_ID_SET.has(id))
    .sort((left, right) => getHomeTemplateLabel(left).localeCompare(getHomeTemplateLabel(right)))
]

export interface HomeTemplate {
  readonly id: HomeTemplateId
  readonly label: string
  readonly snapshot: string
}

export const HOME_TEMPLATES: readonly HomeTemplate[] = HOME_TEMPLATE_IDS.map(id => ({
  id,
  label: getHomeTemplateLabel(id),
  snapshot: AVATAR_ENTITY_PRESET_SNAPSHOT_URLS[id]
}))

export interface HomeExploreTemplate {
  readonly id: string
  readonly entity: HomeTemplateId
  readonly breed: string | null
  readonly effectStyle: AvatarEffectStylePresetId | null
  readonly label: string
  readonly snapshot: string
  readonly size: 'standard' | 'wide' | 'tall' | 'large' | 'feature'
}

const getStableGalleryRank = (value: string) => {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16_777_619)
  }
  return hash >>> 0
}

const getBreedTemplateLabel = (id: string) => {
  const [species = '', breed = id] = id.split('--')
  return `${getHomeTemplateLabel(breed as HomeTemplateId)} · ${getHomeTemplateLabel(species as HomeTemplateId)}`
}

const homeExploreTemplates = [
  ...HOME_TEMPLATES.map(template => ({
    id: `entity:${template.id}`,
    entity: template.id,
    breed: null,
    effectStyle: null,
    label: template.label,
    snapshot: template.snapshot
  })),
  ...Object.entries(AVATAR_BREED_PRESET_SNAPSHOT_URLS).map(([id, snapshot]) => {
    const [entity = '', breed = ''] = id.split('--')
    return {
      id: `breed:${id}`,
      entity: entity as HomeTemplateId,
      breed,
      effectStyle: null,
      label: getBreedTemplateLabel(id),
      snapshot
    }
  }),
  ...Object.entries(AVATAR_PIXEL_STYLE_PRESET_SNAPSHOT_URLS).map(([entity, snapshot]) => ({
    id: `effect:chunky-pixel:${entity}`,
    entity: entity as HomeTemplateId,
    breed: null,
    effectStyle: 'chunky-pixel' as const,
    label: `${getHomeTemplateLabel(entity as HomeTemplateId)} · ${AVATAR_EFFECT_STYLE_PRESETS['chunky-pixel'].label}`,
    snapshot
  }))
].sort((left, right) => (
  getStableGalleryRank(left.id) - getStableGalleryRank(right.id)
  || left.id.localeCompare(right.id)
))

const HOME_EXPLORE_SIZE_PATTERN: readonly HomeExploreTemplate['size'][] = [
  'standard', 'wide', 'standard', 'large', 'standard', 'tall',
  'standard', 'feature', 'standard', 'wide', 'standard', 'standard',
  'large', 'standard', 'wide', 'tall', 'standard', 'standard',
  'feature', 'standard', 'wide', 'standard', 'standard'
]

export const HOME_EXPLORE_TEMPLATES: readonly HomeExploreTemplate[] = homeExploreTemplates.map((template, index) => ({
  ...template,
  size: HOME_EXPLORE_SIZE_PATTERN[index % HOME_EXPLORE_SIZE_PATTERN.length]
}))
