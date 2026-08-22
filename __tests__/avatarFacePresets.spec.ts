import { describe, expect, it } from 'vitest'

import { AVATAR_FACE_PRESETS, isAvatarFacePresetSelected } from '../src/avatarFacePresets'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'

describe('avatar face presets', () => {
  it('provides ten distinct complete face combinations', () => {
    expect(AVATAR_FACE_PRESETS).toHaveLength(10)
    expect(new Set(AVATAR_FACE_PRESETS.map(preset => preset.id)).size).toBe(10)
    expect(new Set(AVATAR_FACE_PRESETS.map(preset => preset.label)).size).toBe(10)

    for (const preset of AVATAR_FACE_PRESETS) {
      expect(Object.keys(preset.style).sort()).toEqual(Object.keys(DEFAULT_AVATAR_FACE_STYLE).sort())
    }
  })

  it('covers faces with and without noses and mouths', () => {
    expect(AVATAR_FACE_PRESETS.some(preset => preset.style.noseEnabled)).toBe(true)
    expect(AVATAR_FACE_PRESETS.some(preset => !preset.style.noseEnabled)).toBe(true)
    expect(AVATAR_FACE_PRESETS.some(preset => preset.style.mouthEnabled)).toBe(true)
    expect(AVATAR_FACE_PRESETS.some(preset => !preset.style.mouthEnabled)).toBe(true)
  })

  it('recognizes a fully applied combination', () => {
    const preset = AVATAR_FACE_PRESETS[0]!

    expect(isAvatarFacePresetSelected(preset.style, preset)).toBe(true)
    expect(isAvatarFacePresetSelected({ ...preset.style, gap: preset.style.gap + 1 }, preset)).toBe(false)
  })
})
