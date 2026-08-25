import { describe, expect, it } from 'vitest'

import { normalizeAvatarLocale, translateAvatarText } from '../src/avatarLocale'
import { AVATAR_FACE_PRESETS } from '../src/avatarFacePresets'
import { AVATAR_ANIMAL_BREED_TEMPLATES } from '../src/avatarSpeciesBreeds'

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
    expect(translateAvatarText('zh-Hans', 'Fox')).toBe('小狐狸')
    expect(translateAvatarText('zh-Hans', 'Fox types')).toBe('狐狸类型')
    expect(translateAvatarText('zh-Hans', 'Fox ear size')).toBe('狐耳尺寸')
    expect(translateAvatarText('zh-Hans', 'Fox head size')).toBe('狐头尺寸')
    expect(translateAvatarText('zh-Hans', 'Red Fox')).toBe('赤狐')
    expect(translateAvatarText('zh-Hans', 'Arctic Fox')).toBe('北极狐')
    expect(translateAvatarText('zh-Hans', 'Silver Fox')).toBe('银狐')
    expect(translateAvatarText('zh-Hans', 'Fennec Fox')).toBe('耳廓狐')
    expect(translateAvatarText('zh-Hans', 'Bottom taper')).toBe('底部收尖')
    expect(translateAvatarText('zh-Hans', 'Part bottom taper')).toBe('部件底部收尖')
    expect(translateAvatarText('zh-Hans', 'Face mask')).toBe('面部遮罩')
    expect(translateAvatarText('zh-Hans', 'Tabby coat patch')).toBe('狸花毛色色块')
    expect(translateAvatarText('zh-Hans', 'Jitter')).toBe('抖动度')
    expect(translateAvatarText('zh-Hans', 'Surface decal')).toBe('曲面贴花')
    expect(translateAvatarText('zh-Hans', 'Surface decal shape')).toBe('曲面贴花形状')
    expect(translateAvatarText('zh-Hans', 'Light coat patch')).toBe('浅色毛区')
    expect(translateAvatarText('zh-Hans', 'Light coat patch shape')).toBe('浅色毛区形状')
    expect(translateAvatarText('zh-Hans', 'Cow Cat')).toBe('奶牛猫')
    expect(translateAvatarText('zh-Hans', 'Black Cat')).toBe('纯黑猫')
    expect(translateAvatarText('zh-Hans', 'Dog types')).toBe('狗狗类型')
    expect(translateAvatarText('zh-Hans', 'Dog ear size')).toBe('狗耳尺寸')
    expect(translateAvatarText('zh-Hans', 'Dog head size')).toBe('狗头尺寸')
    expect(translateAvatarText('zh-Hans', 'Dog head width')).toBe('狗头宽度')
    expect(translateAvatarText('zh-Hans', 'Dog head height')).toBe('狗头高度')
    expect(translateAvatarText('zh-Hans', 'Bear types')).toBe('熊类造型')
    expect(translateAvatarText('zh-Hans', 'Bear ear size')).toBe('熊耳尺寸')
    expect(translateAvatarText('zh-Hans', 'Bear head size')).toBe('熊头尺寸')
    expect(translateAvatarText('zh-Hans', 'Brown Bear')).toBe('棕熊')
    expect(translateAvatarText('zh-Hans', 'Polar Bear')).toBe('北极熊')
    expect(translateAvatarText('zh-Hans', 'Asian Black Bear')).toBe('亚洲黑熊')
    expect(translateAvatarText('zh-Hans', 'Giant Panda')).toBe('大熊猫')
    expect(translateAvatarText('zh-Hans', 'Spectacled Bear')).toBe('眼镜熊')
    expect(translateAvatarText('zh-Hans', 'Sun Bear')).toBe('马来熊')
    expect(translateAvatarText('zh-Hans', 'Red Panda')).toBe('小熊猫')
    expect(translateAvatarText('zh-Hans', 'Koala')).toBe('树袋熊')
    expect(translateAvatarText('zh-Hans', 'Raccoon')).toBe('浣熊')
    expect(translateAvatarText('zh-Hans', 'Wombat')).toBe('袋熊')
    expect(translateAvatarText('zh-Hans', 'Teddy Bear')).toBe('泰迪熊')
    expect(translateAvatarText('zh-Hans', 'Rabbit types')).toBe('兔兔类型')
    expect(translateAvatarText('zh-Hans', 'Rabbit ear size')).toBe('兔耳尺寸')
    expect(translateAvatarText('zh-Hans', 'Rabbit head size')).toBe('兔头尺寸')
    expect(translateAvatarText('zh-Hans', 'Rabbit ear width')).toBe('兔耳宽度')
    expect(translateAvatarText('zh-Hans', 'Rabbit head height')).toBe('兔头高度')
    expect(translateAvatarText('zh-Hans', 'Holland Lop')).toBe('荷兰垂耳兔')
    expect(translateAvatarText('zh-Hans', 'English Spot')).toBe('斑点兔')
    expect(translateAvatarText('zh-Hans', 'Head width')).toBe('头部宽度')
    expect(translateAvatarText('zh-Hans', 'Head height')).toBe('头部高度')
    expect(translateAvatarText('zh-Hans', 'Shiba Inu')).toBe('柴犬')
    expect(translateAvatarText('zh-Hans', 'Husky')).toBe('哈士奇')
    expect(translateAvatarText('zh-Hans', 'Corgi')).toBe('柯基')
    expect(translateAvatarText('zh-Hans', 'Golden Retriever')).toBe('金毛')
    expect(translateAvatarText('zh-Hans', 'Border Collie')).toBe('边牧')
    expect(translateAvatarText('zh-Hans', 'Dalmatian')).toBe('斑点狗')
    expect(translateAvatarText('zh-Hans', 'View composition')).toBe('视图构图')
    expect(translateAvatarText('zh-Hans', 'Vertical position')).toBe('垂直位置')
    expect(translateAvatarText('zh-Hans', 'Eye highlight size')).toBe('眼睛高光大小')
    expect(translateAvatarText('zh-Hans', 'Decal opacity')).toBe('贴花不透明度')
    expect(translateAvatarText('en', 'Effects')).toBe('Effects')
    expect(translateAvatarText('zh-Hans', 'Custom animation name')).toBe('Custom animation name')
  })

  it('provides Simplified Chinese labels for every face preset', () => {
    for (const preset of AVATAR_FACE_PRESETS) {
      expect(translateAvatarText('zh-Hans', preset.label)).not.toBe(preset.label)
    }
  })

  it('provides Simplified Chinese labels for every new animal breed', () => {
    for (const template of AVATAR_ANIMAL_BREED_TEMPLATES) {
      expect(translateAvatarText('zh-Hans', template.label)).not.toBe(template.label)
    }
  })
})
