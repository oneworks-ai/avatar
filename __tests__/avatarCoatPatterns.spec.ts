import {
  DEFAULT_AVATAR_COAT_PATTERN,
  createDefaultAvatarDefinition,
  isAvatarDefinition,
  resolveAvatarCoatPatternDecals
} from '@oneworks/avatar'
import { describe, expect, it } from 'vitest'

import { avatarDefinitionToSearchParams, avatarDefinitionToState, createAvatarDefinition } from '../src/avatarDefinition'
import { createAvatarEntityParts } from '../src/avatarEntityPresets'

describe('procedural avatar coat patterns', () => {
  it('replays the same Seed and changes topology for another Seed in random mode', () => {
    const parts = createAvatarEntityParts('cat')
    const pattern = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, seed: 'v1-tabby-cat' }
    const first = resolveAvatarCoatPatternDecals({ entityParts: parts, entityPreset: 'cat', paletteId: 'tabby', pattern })
    const replayed = resolveAvatarCoatPatternDecals({ entityParts: parts, entityPreset: 'cat', paletteId: 'tabby', pattern })
    const changed = resolveAvatarCoatPatternDecals({
      entityParts: parts,
      entityPreset: 'cat',
      paletteId: 'tabby',
      pattern: { ...pattern, seed: 'v1-another-tabby' }
    })

    expect(replayed).toEqual(first)
    expect(changed).not.toEqual(first)
    expect(first.length).toBeGreaterThanOrEqual(8)
    expect(first.every(decal => ['cat-ear-left', 'cat-ear-right', 'cat-head'].includes(decal.targetPartId!))).toBe(true)
    expect(new Set(first.map(decal => decal.id)).size).toBe(first.length)
    expect(first.filter(decal => decal.label === 'Tabby coat patch')).toHaveLength(1)
    expect(new Set(first.map(decal => decal.color)).size).toBeGreaterThanOrEqual(2)
  })

  it('uses density for every dark marking while preserving the continuous tone region', () => {
    const base = {
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const,
      paletteId: 'tabby'
    }
    const resolve = (density: number) => resolveAvatarCoatPatternDecals({
      ...base,
      pattern: {
        ...DEFAULT_AVATAR_COAT_PATTERN,
        algorithm: 'mackerel' as const,
        density,
        enabled: true,
        jitter: 0,
        seed: 'v1-cat-head'
      }
    })
    const levels = [0, 20, 40, 60, 80, 100].map(resolve)
    const darkCount = (decals: ReturnType<typeof resolve>) => (
      decals.filter(decal => decal.label !== 'Tabby coat patch').length
    )

    expect(levels[0]).toHaveLength(1)
    expect(levels[0]![0]).toMatchObject({ label: 'Tabby coat patch', shape: 'face-mask' })
    expect(levels.map(darkCount)).toEqual([...levels.map(darkCount)].sort((left, right) => left - right))
    expect(new Set(levels[1]!.map(decal => decal.side))).toEqual(new Set(['back', 'face', 'front', 'left', 'right']))
    expect(levels.at(-1)!.filter(decal => decal.id.includes('forehead-'))).toHaveLength(4)
    expect(levels.at(-1)!.filter(decal => decal.id.includes('eye-line-'))).toHaveLength(2)
    expect(levels.at(-1)!.filter(decal => decal.id.includes('ear-inner-'))).toHaveLength(2)
    expect(levels.at(-1)!.filter(decal => decal.id.includes('ear-root-'))).toHaveLength(2)

    for (const decals of levels) {
      for (const decal of decals.filter(candidate => candidate.id.includes('-left'))) {
        expect(decals.some(candidate => candidate.id === decal.id.replace('-left', '-right'))).toBe(true)
      }
    }
  })

  it('uses adjustable jitter only for variable markings', () => {
    const base = {
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const,
      paletteId: 'tabby'
    }
    const resolve = (seed: string, jitter: number) => resolveAvatarCoatPatternDecals({
      ...base,
      pattern: {
        ...DEFAULT_AVATAR_COAT_PATTERN,
        algorithm: 'mackerel' as const,
        density: 100,
        enabled: true,
        jitter,
        seed
      }
    })
    const withoutJitterA = resolve('v1-jitter-a', 0)
    const withoutJitterB = resolve('v1-jitter-b', 0)
    const withJitterA = resolve('v1-jitter-a', 100)
    const withJitterB = resolve('v1-jitter-b', 100)
    const variableGeometry = (decals: ReturnType<typeof resolve>) => decals
      .filter(decal => /cheek-|side-|back-|temple-/u.test(decal.id))
      .map(({ bend, height, id, rotation, width, x, y }) => ({ bend, height, id, rotation, width, x, y }))

    expect(variableGeometry(withoutJitterA)).toEqual(variableGeometry(withoutJitterB))
    expect(variableGeometry(withJitterA)).not.toEqual(variableGeometry(withJitterB))
  })

  it('builds a continuous face-to-chin tone and distributes optional marks around the head', () => {
    const decals = resolveAvatarCoatPatternDecals({
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat',
      paletteId: 'tabby',
      pattern: {
        ...DEFAULT_AVATAR_COAT_PATTERN,
        algorithm: 'mackerel',
        density: 100,
        enabled: true,
        jitter: 0
      }
    })
    const faceToChin = decals.find(decal => decal.id.endsWith('tone-face-to-chin'))

    expect(faceToChin).toMatchObject({ height: 160, rotation: 0, side: 'face', shape: 'face-mask', width: 108, x: 0, y: 70 })
    expect(faceToChin!.height).toBeGreaterThan(faceToChin!.width)
    expect(decals.some(decal => decal.side === 'left' && decal.id.includes('side-'))).toBe(true)
    expect(decals.some(decal => decal.side === 'right' && decal.id.includes('side-'))).toBe(true)
    expect(decals.some(decal => decal.side === 'back' && decal.id.includes('back-'))).toBe(true)
  })

  it('scales the light coat patch around its center while width and shape stay independent', () => {
    const base = {
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const,
      paletteId: 'tabby',
      pattern: { ...DEFAULT_AVATAR_COAT_PATTERN, density: 100, enabled: true, jitter: 0, seed: 'v1-light-patch' }
    }
    const patch = (pattern = base.pattern) => resolveAvatarCoatPatternDecals({ ...base, pattern })
      .find(decal => decal.label === 'Tabby coat patch')!
    const defaultPatch = patch()
    const shortPatch = patch({ ...base.pattern, lightPatchLength: 60 })
    const longPatch = patch({ ...base.pattern, lightPatchLength: 200 })
    const narrowPatch = patch({ ...base.pattern, lightPatchWidth: 60 })
    const widePatch = patch({ ...base.pattern, lightPatchWidth: 200 })

    expect(defaultPatch).toMatchObject({ height: 160, shape: 'face-mask', width: 108, y: 70 })
    expect(shortPatch.height).toBe(96)
    expect(shortPatch.y).toBe(70)
    expect(longPatch.height).toBe(320)
    expect(longPatch.y).toBe(70)
    expect(shortPatch.y - shortPatch.height / 2).toBe(22)
    expect(longPatch.y - longPatch.height / 2).toBe(-90)
    expect(shortPatch.y + shortPatch.height / 2).toBe(118)
    expect(longPatch.y + longPatch.height / 2).toBe(230)
    expect(narrowPatch.width).toBeCloseTo(65)
    expect(widePatch.width).toBe(216)
    expect(narrowPatch.height).toBe(defaultPatch.height)
    for (const lightPatchShape of ['face-mask', 'ellipse', 'rounded'] as const) {
      expect(patch({ ...base.pattern, lightPatchShape }).shape).toBe(lightPatchShape)
    }
  })

  it('moves the light coat patch vertically without changing its geometry', () => {
    const base = {
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const,
      paletteId: 'tabby',
      pattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, lightPatchLength: 110, lightPatchShape: 'rounded', lightPatchWidth: 200 }
    }
    const resolvePatch = (lightPatchOffsetY: number) => resolveAvatarCoatPatternDecals({
      ...base,
      pattern: { ...base.pattern, lightPatchOffsetY }
    }).find(decal => decal.label === 'Tabby coat patch')!
    const up = resolvePatch(-50)
    const center = resolvePatch(0)
    const down = resolvePatch(50)

    expect(center).toMatchObject({ height: 176, shape: 'rounded', width: 216, y: 70 })
    expect(up.y).toBe(20)
    expect(down.y).toBe(120)
    expect({ ...up, y: center.y }).toEqual(center)
    expect({ ...down, y: center.y }).toEqual(center)
  })

  it('keeps light patch geometry separate from dark pattern controls', () => {
    const base = {
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const,
      paletteId: 'tabby',
      pattern: { ...DEFAULT_AVATAR_COAT_PATTERN, density: 100, enabled: true, seed: 'v1-light-patch-isolated' }
    }
    const resolve = (pattern: typeof base.pattern) => resolveAvatarCoatPatternDecals({ ...base, pattern })
    const geometry = (decal: ReturnType<typeof resolve>[number]) => ({ height: decal.height, shape: decal.shape, width: decal.width, x: decal.x, y: decal.y })
    const defaultDecals = resolve(base.pattern)
    const patchDefault = defaultDecals.find(decal => decal.label === 'Tabby coat patch')!
    const deepChanged = resolve({ ...base.pattern, density: 0, jitter: 100, symmetry: 0, thickness: 140 })
    expect(geometry(deepChanged.find(decal => decal.label === 'Tabby coat patch')!)).toEqual(geometry(patchDefault))

    const patchChanged = resolve({ ...base.pattern, lightPatchLength: 60, lightPatchWidth: 140, lightPatchShape: 'ellipse' })
    expect(patchChanged.filter(decal => decal.label !== 'Tabby coat patch')).toEqual(
      defaultDecals.filter(decal => decal.label !== 'Tabby coat patch')
    )
  })

  it('keeps landmark anchors fixed while thickness affects every dark marking', () => {
    const base = {
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const,
      paletteId: 'tabby'
    }
    const resolve = (seed: string, jitter: number, symmetry: number, thickness: number) => (
      resolveAvatarCoatPatternDecals({
        ...base,
        pattern: {
          ...DEFAULT_AVATAR_COAT_PATTERN,
          algorithm: 'mackerel',
          density: 100,
          enabled: true,
          jitter,
          seed,
          symmetry,
          thickness
        }
      })
    )
    const landmarks = (decals: ReturnType<typeof resolve>) => decals.filter(decal => (
      decal.id.includes('forehead-') ||
      decal.id.includes('eye-line-') ||
      decal.id.includes('ear-inner-') ||
      decal.id.includes('ear-root-')
    ))
    const landmarkAnchors = (decals: ReturnType<typeof resolve>) => landmarks(decals)
      .map(({ bend, id, rotation, targetPartId, x, y }) => ({
        bend,
        id,
        rotation,
        targetPartId,
        x,
        y
      }))
    const thin = resolve('v1-layout-a', 0, 100, 50)
    const thick = resolve('v1-layout-b', 100, 0, 140)

    expect(landmarkAnchors(thick)).toEqual(landmarkAnchors(thin))
    expect(landmarks(thick).every((decal, index) => decal.width > landmarks(thin)[index]!.width)).toBe(true)
    expect(thick.filter(decal => decal.label !== 'Tabby coat patch').every((decal, index) => (
      decal.width > thin.filter(candidate => candidate.label !== 'Tabby coat patch')[index]!.width
    ))).toBe(true)
  })

  it('applies each concrete algorithm to landmarks and variable markings as one style', () => {
    const base = {
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const,
      paletteId: 'tabby'
    }
    const resolve = (algorithm: 'broken-mackerel' | 'classic' | 'mackerel' | 'spotted') => (
      resolveAvatarCoatPatternDecals({
        ...base,
        pattern: {
          ...DEFAULT_AVATAR_COAT_PATTERN,
          algorithm,
          density: 100,
          enabled: true,
          jitter: 0,
          seed: 'v1-algorithm-style'
        }
      }).filter(decal => decal.label !== 'Tabby coat patch')
    )
    const mackerel = resolve('mackerel')

    for (const algorithm of ['broken-mackerel', 'classic', 'spotted'] as const) {
      const changed = resolve(algorithm)
      expect(changed).toHaveLength(mackerel.length)
      expect(changed.every((decal, index) => (
        decal.shape !== mackerel[index]!.shape ||
        decal.width !== mackerel[index]!.width ||
        decal.height !== mackerel[index]!.height
      ))).toBe(true)
    }
    expect(resolve('broken-mackerel').every(decal => decal.shape === 'ellipse')).toBe(true)
    expect(resolve('spotted').every(decal => decal.shape === 'ellipse')).toBe(true)
  })

  it('mirrors paired regions exactly at full symmetry', () => {
    const decals = resolveAvatarCoatPatternDecals({
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat',
      paletteId: 'tabby',
      pattern: { ...DEFAULT_AVATAR_COAT_PATTERN, density: 100, enabled: true, seed: 'v1-mirror', symmetry: 100 }
    })

    for (const left of decals.filter(decal => decal.id.includes('-left'))) {
      const right = decals.find(decal => decal.id === left.id.replace('-left', '-right'))
      expect(right).toBeDefined()
      expect(right?.x).toBeCloseTo(-left.x)
      expect(right?.y).toBe(left.y)
      expect(right?.width).toBe(left.width)
      expect(right?.height).toBe(left.height)
      expect(right?.rotation).toBeCloseTo(-left.rotation)
      expect(right?.shape).toBe(left.shape)
      expect(right?.bend ?? 0).toBeCloseTo(-(left.bend ?? 0))
    }
  })

  it('keeps a fixed algorithm while the Seed changes', () => {
    const parts = createAvatarEntityParts('cat')
    const pattern = { ...DEFAULT_AVATAR_COAT_PATTERN, algorithm: 'spotted' as const, enabled: true }
    const first = resolveAvatarCoatPatternDecals({ entityParts: parts, entityPreset: 'cat', paletteId: 'tabby', pattern: { ...pattern, seed: 'v1-a' } })
    const changed = resolveAvatarCoatPatternDecals({ entityParts: parts, entityPreset: 'cat', paletteId: 'tabby', pattern: { ...pattern, seed: 'v1-b' } })
    expect(first.filter(decal => decal.label !== 'Tabby coat patch').every(decal => decal.shape === 'ellipse')).toBe(true)
    expect(changed.filter(decal => decal.label !== 'Tabby coat patch').every(decal => decal.shape === 'ellipse')).toBe(true)
    expect(changed).not.toEqual(first)
  })

  it('does not project a cat coat pattern onto another model', () => {
    expect(resolveAvatarCoatPatternDecals({
      entityParts: createAvatarEntityParts('dog'),
      entityPreset: 'dog',
      paletteId: 'tabby',
      pattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true }
    })).toEqual([])
  })

  it('round-trips the public coat-pattern configuration', () => {
    const definition = createAvatarDefinition({
      ...avatarDefinitionToState(createDefaultAvatarDefinition()),
      coatPattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, algorithm: 'classic' },
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat'
    })
    expect(isAvatarDefinition(definition)).toBe(true)
    expect(definition.scene.appearance.coatPattern?.algorithm).toBe('classic')
    expect(definition.scene.appearance.coatPattern?.jitter).toBe(DEFAULT_AVATAR_COAT_PATTERN.jitter)
    expect(avatarDefinitionToSearchParams(definition).get('coatJitter')).toBe(String(DEFAULT_AVATAR_COAT_PATTERN.jitter))
    expect(avatarDefinitionToSearchParams(definition).get('coatLightPatchLength')).toBe('100')
    expect(avatarDefinitionToSearchParams(definition).get('coatLightPatchOffsetY')).toBe('0')
    expect(avatarDefinitionToSearchParams(definition).get('coatLightPatchWidth')).toBe('100')
    expect(avatarDefinitionToSearchParams(definition).get('coatLightPatchShape')).toBe('face-mask')
    expect(definition.scene.decals).toEqual([])
  })
})
