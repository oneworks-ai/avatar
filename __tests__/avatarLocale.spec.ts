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
    expect(translateAvatarText('zh-Hans', 'Download PNG')).toBe('下载 PNG')
    expect(translateAvatarText('zh-Hans', 'Transparent')).toBe('透明')
    expect(translateAvatarText('zh-Hans', 'Bring your avatar to life')).toBe('让形象动起来')
    expect(translateAvatarText('zh-Hans', 'Start creating')).toBe('开始创造')
    expect(translateAvatarText('zh-Hans', 'Dog')).toBe('小狗')
    expect(translateAvatarText('zh-Hans', 'Surface decal')).toBe('曲面贴花')
    expect(translateAvatarText('zh-Hans', 'Surface decal shape')).toBe('曲面贴花形状')
    expect(translateAvatarText('zh-Hans', 'Eye highlight size')).toBe('眼睛高光大小')
    expect(translateAvatarText('zh-Hans', 'Decal opacity')).toBe('贴花不透明度')
    expect(translateAvatarText('en', 'Effects')).toBe('Effects')
    expect(translateAvatarText('zh-Hans', 'Custom animation name')).toBe('Custom animation name')
  })
})
