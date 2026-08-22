import { describe, expect, it } from 'vitest'

import { sortAvatarPresetItems, touchAvatarPresetUsage } from '../src/avatarPresetUsage'

describe('avatar preset usage ordering', () => {
  const items = [
    { createdAt: 0, id: 'first' },
    { createdAt: 30, id: 'new' },
    { createdAt: 0, id: 'last' }
  ]

  it('moves newly created presets to the front', () => {
    expect(sortAvatarPresetItems(items, item => item.id, {}, item => item.createdAt).map(item => item.id))
      .toEqual(['new', 'first', 'last'])
  })

  it('moves a recently used preset ahead of newly created presets', () => {
    const usage = touchAvatarPresetUsage({}, 'last', 50)
    expect(sortAvatarPresetItems(items, item => item.id, usage, item => item.createdAt).map(item => item.id))
      .toEqual(['last', 'new', 'first'])
  })
})
