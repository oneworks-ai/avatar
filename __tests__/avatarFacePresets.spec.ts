import { describe, expect, it } from 'vitest'

import { AVATAR_FACE_PRESETS, isAvatarFacePresetSelected } from '../src/avatarFacePresets'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'

describe('avatar face presets', () => {
  it('provides ten distinct complete face combinations', () => {
    expect(AVATAR_FACE_PRESETS.length).toBeGreaterThanOrEqual(20)
    expect(new Set(AVATAR_FACE_PRESETS.map(preset => preset.id)).size).toBe(AVATAR_FACE_PRESETS.length)
    expect(new Set(AVATAR_FACE_PRESETS.map(preset => preset.label)).size).toBe(AVATAR_FACE_PRESETS.length)

    for (const preset of AVATAR_FACE_PRESETS) {
      expect(Object.keys(DEFAULT_AVATAR_FACE_STYLE).every(key => key in preset.style)).toBe(true)
    }
  })

  it('covers faces with and without noses and mouths', () => {
    expect(AVATAR_FACE_PRESETS.some(preset => preset.style.noseEnabled)).toBe(true)
    expect(AVATAR_FACE_PRESETS.some(preset => !preset.style.noseEnabled)).toBe(true)
    expect(AVATAR_FACE_PRESETS.some(preset => preset.style.mouthEnabled)).toBe(true)
    expect(AVATAR_FACE_PRESETS.some(preset => !preset.style.mouthEnabled)).toBe(true)
  })

  it('uses rounded, larger eye-led expressions with asymmetric variants', () => {
    expect(AVATAR_FACE_PRESETS.every(preset => preset.style.eyeShape === 'rounded')).toBe(true)
    expect(AVATAR_FACE_PRESETS.some(preset => preset.style.leftEyeHeight !== preset.style.rightEyeHeight)).toBe(true)
    expect(AVATAR_FACE_PRESETS.filter(preset => preset.style.mouthEnabled).length).toBeLessThanOrEqual(4)
  })

  it('recognizes a fully applied combination', () => {
    const preset = AVATAR_FACE_PRESETS[0]!

    expect(isAvatarFacePresetSelected(preset.style, preset)).toBe(true)
    expect(isAvatarFacePresetSelected({ ...preset.style, gap: preset.style.gap + 1 }, preset)).toBe(false)
  })

  it('defines Mixed signal as one upright and one wide eye without a rotation shortcut', () => {
    const mixedSignal = AVATAR_FACE_PRESETS.find(preset => preset.id === 'mixed-signal')
    expect(mixedSignal).toBeDefined()
    expect(mixedSignal!.style.leftEyeHeight).toBeGreaterThan(mixedSignal!.style.leftEyeWidth ?? 0)
    expect(mixedSignal!.style.rightEyeWidth).toBeGreaterThan(mixedSignal!.style.rightEyeHeight ?? 0)
    expect(mixedSignal!.style.leftEyeRotation).toBe(0)
    expect(mixedSignal!.style.rightEyeRotation).toBe(0)
  })
})
