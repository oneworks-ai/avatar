import { describe, expect, it } from 'vitest'

import { normalizeAvatarLocale, translateAvatarText } from '../src/avatarLocale'

describe('avatar locale', () => {
  it('normalizes supported English and Simplified Chinese locale variants', () => {
    expect(normalizeAvatarLocale('en')).toBe('en')
    expect(normalizeAvatarLocale('zh-CN')).toBe('zh-Hans')
    expect(normalizeAvatarLocale('zh-Hans')).toBe('zh-Hans')
    expect(normalizeAvatarLocale('fr')).toBeNull()
  })

  it('translates known labels and preserves unknown text', () => {
    expect(translateAvatarText('zh-Hans', 'Effects')).toBe('效果')
    expect(translateAvatarText('en', 'Effects')).toBe('Effects')
    expect(translateAvatarText('zh-Hans', 'Custom animation name')).toBe('Custom animation name')
  })
})
