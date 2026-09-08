import { describe, expect, it } from 'vitest'
import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import { resolveNativeAvatarPreset } from '../src/native-preset'

describe('native preset projection cache', () => {
  it('reuses geometry and markings across cloned expression and pose frames', () => {
    const original = createDefaultAvatarDefinition()
    const base = { ...original, scene: { ...original.scene, entity: { preset: 'duck' as const, parts: [] },
      appearance: { ...original.scene.appearance, paletteId: 'mallard-duck' } } }
    const initial = resolveNativeAvatarPreset(base)
    for (let frame = 0; frame < 100; frame++) {
      const animated = JSON.parse(JSON.stringify(base))
      animated.scene.view.yaw = frame / 100
      animated.scene.face.height = 20 + frame % 40
      expect(resolveNativeAvatarPreset(animated)).toBe(initial)
    }
    const changed = JSON.parse(JSON.stringify(base))
    changed.scene.appearance.paletteId = 'pekin-duck'
    expect(resolveNativeAvatarPreset(changed)).not.toBe(initial)
  })
  it('bounds cache growth without changing an evicted preset appearance', () => {
    const original = createDefaultAvatarDefinition()
    const definition = { ...original, scene: { ...original.scene, entity: { preset: 'penguin' as const, parts: [] },
      appearance: { ...original.scene.appearance, paletteId: 'emperor-penguin' } } }
    const first = resolveNativeAvatarPreset(definition)
    for (let index = 0; index < 140; index++) {
      resolveNativeAvatarPreset({ ...definition, metadata: { generation: { version: 1, seed: `cache-${index}`, fields: [] } } })
    }
    const renewed = resolveNativeAvatarPreset(definition)
    expect(renewed).not.toBe(first)
    expect(renewed).toEqual(first)
  })
})
