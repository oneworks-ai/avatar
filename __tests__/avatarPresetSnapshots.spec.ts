import { describe, expect, it } from 'vitest'

import {
  AVATAR_BEAR_BREED_TEMPLATES,
  AVATAR_CAT_BREED_TEMPLATES,
  AVATAR_DOG_BREED_TEMPLATES,
  AVATAR_RABBIT_BREED_TEMPLATES
} from '../src/avatarBreedTemplates'
import {
  AVATAR_BREED_PRESET_SNAPSHOT_URLS,
  getAvatarBreedPresetSnapshotUrl
} from '../src/avatarPresetSnapshots'
import { AVATAR_ANIMAL_BREED_TEMPLATES } from '../src/avatarSpeciesBreeds'

describe('prebuilt Avatar preset snapshots', () => {
  it('covers every registered built-in breed and species type', () => {
    const expected = [
      ...AVATAR_CAT_BREED_TEMPLATES.map(template => `cat--${template.id}`),
      ...AVATAR_DOG_BREED_TEMPLATES.map(template => `dog--${template.id}`),
      ...AVATAR_RABBIT_BREED_TEMPLATES.map(template => `rabbit--${template.id}`),
      ...AVATAR_BEAR_BREED_TEMPLATES.map(template => `bear--${template.id}`),
      ...AVATAR_ANIMAL_BREED_TEMPLATES.map(template => `${template.species}--${template.id}`)
    ].sort()

    expect(Object.keys(AVATAR_BREED_PRESET_SNAPSHOT_URLS).sort()).toEqual(expected)
    for (const key of expected) {
      const separator = key.indexOf('--')
      expect(getAvatarBreedPresetSnapshotUrl(
        key.slice(0, separator),
        key.slice(separator + 2)
      )).toMatch(/\.svg(?:\?|$)/)
    }
  })
})
