import { describe, expect, it, vi } from 'vitest'
import {
  AVATAR_BEAR_COMPATIBLE_PALETTE_IDS,
  AVATAR_RABBIT_COMPATIBLE_PALETTE_IDS,
  AVATAR_SEED_FIELD_PATHS,
  AVATAR_TABBY_COMPATIBLE_PALETTE_IDS,
  DEFAULT_AVATAR_COAT_PATTERN
} from '@oneworks/avatar'

import {
  AVATAR_SEED_FIELD,
  AVATAR_SEED_FIELDS,
  createRandomAvatarSeed,
  interpolateAvatarView,
  parseAvatarSeedFields,
  resolveSeededAvatarBearEarScale,
  resolveSeededAvatarBearHeadScale,
  resolveSeededAvatarCameraBackground,
  resolveSeededAvatarCoatPattern,
  resolveSeededAvatarEntityPreset,
  resolveSeededAvatarFacePreset,
  resolveSeededAvatarPaletteId,
  resolveSeededAvatarTabbyPaletteId,
  resolveSeededAvatarRabbitEarScale,
  resolveSeededAvatarRabbitHeadScale,
  resolveSeededAvatarView,
  serializeAvatarSeedFields
} from '../src/avatarSeed'

describe('avatar editor seed fields', () => {
  it('resolves every supported domain deterministically', () => {
    const seed = 'v1-support-agent'
    expect(resolveSeededAvatarEntityPreset(seed)).toBe(resolveSeededAvatarEntityPreset(seed))
    expect(resolveSeededAvatarFacePreset(seed)).toEqual(resolveSeededAvatarFacePreset(seed))
    expect(resolveSeededAvatarPaletteId(seed)).toBe(resolveSeededAvatarPaletteId(seed))
    expect(resolveSeededAvatarCameraBackground(seed)).toBe(resolveSeededAvatarCameraBackground(seed))
  })

  it('uses a deterministic natural palette candidate set for tabby coats', () => {
    for (const seed of ['v1-tabby-a', 'v1-tabby-b', 'v1-tabby-c', 'v1-tabby-d']) {
      const paletteId = resolveSeededAvatarTabbyPaletteId(seed)
      expect(AVATAR_TABBY_COMPATIBLE_PALETTE_IDS).toContain(paletteId)
      expect(paletteId).toBe(resolveSeededAvatarTabbyPaletteId(seed))
    }
    expect(AVATAR_TABBY_COMPATIBLE_PALETTE_IDS).not.toContain('coral')
    expect(AVATAR_TABBY_COMPATIBLE_PALETTE_IDS).not.toContain('cow-cat')
    expect(AVATAR_TABBY_COMPATIBLE_PALETTE_IDS).not.toContain('black-cat')
  })

  it('supports Rabbit-only virtual dimensions without adding camera-frame randomization', () => {
    const seed = 'v1-rabbit-scales'
    expect(AVATAR_RABBIT_COMPATIBLE_PALETTE_IDS).toEqual([
      'holland-lop', 'netherland-dwarf', 'dutch-rabbit', 'himalayan-rabbit', 'lionhead-rabbit', 'english-spot'
    ])
    expect(resolveSeededAvatarRabbitEarScale(seed, 'width')).toBe(resolveSeededAvatarRabbitEarScale(seed, 'width'))
    expect(resolveSeededAvatarRabbitHeadScale(seed, 'height')).toBeGreaterThanOrEqual(76)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.rabbitEarWidth)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.rabbitHeadHeight)
    expect(AVATAR_SEED_FIELDS).not.toContain('scene.camera.frame')
  })

  it('recognizes Fox-only anatomy fields without randomizing the camera frame', () => {
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.foxEarWidth)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.foxEarHeight)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.foxHeadWidth)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.foxHeadHeight)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.foxEarStyle)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.foxHeadTaper)
    expect(AVATAR_SEED_FIELDS).not.toContain('scene.camera.frame')
  })

  it('keeps Bear-only virtual dimensions and natural palettes deterministic and constrained', () => {
    expect(AVATAR_BEAR_COMPATIBLE_PALETTE_IDS).toEqual([
      'brown-bear', 'polar-bear', 'asian-black-bear', 'giant-panda', 'spectacled-bear', 'sun-bear',
      'red-panda', 'koala', 'raccoon', 'wombat', 'teddy-bear'
    ])
    const seed = 'v1-bear-scales'
    expect(resolveSeededAvatarBearEarScale(seed, 'width')).toBe(resolveSeededAvatarBearEarScale(seed, 'width'))
    expect(resolveSeededAvatarBearEarScale(seed, 'height')).toBeGreaterThanOrEqual(55)
    expect(resolveSeededAvatarBearEarScale(seed, 'height')).toBeLessThanOrEqual(155)
    expect(resolveSeededAvatarBearHeadScale(seed, 'width')).toBeGreaterThanOrEqual(76)
    expect(resolveSeededAvatarBearHeadScale(seed, 'width')).toBeLessThanOrEqual(132)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.bearEarWidth)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.bearEarHeight)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.bearHeadWidth)
    expect(AVATAR_SEED_FIELDS).toContain(AVATAR_SEED_FIELD_PATHS.bearHeadHeight)
    expect(AVATAR_SEED_FIELDS).not.toContain('scene.camera.frame')
  })

  it('filters the legacy Seed camera-frame binding while preserving future field paths', () => {
    const parsed = parseAvatarSeedFields([
      'scene.camera.frame',
      'unknown',
      AVATAR_SEED_FIELD.palette,
      'scene.camera.frame'
    ].join(','))
    expect(parsed).toEqual(['unknown', AVATAR_SEED_FIELD.palette])
    expect(serializeAvatarSeedFields(parsed)).toBe([
      AVATAR_SEED_FIELD.palette,
      'unknown'
    ].join(','))
    expect(serializeAvatarSeedFields(['scene.camera.frame', AVATAR_SEED_FIELD.palette]))
      .toBe(AVATAR_SEED_FIELD.palette)
    expect(AVATAR_SEED_FIELDS).not.toContain('scene.camera.frame')
  })

  it('resolves a deterministic horizontal Seed pose with a restrained center-facing tilt', () => {
    const current = { pitch: 0, positionX: 0, positionY: 0, roll: 0, scale: 1.6, yaw: 0 }
    const first = resolveSeededAvatarView('v1-view-a', current)
    const repeated = resolveSeededAvatarView('v1-view-a', current)
    const different = resolveSeededAvatarView('v1-view-b', current)

    expect(first).toEqual(repeated)
    expect(first).not.toEqual(different)
    expect(first.scale).toBe(1.72)
    expect(Math.abs(first.positionX)).toBeLessThanOrEqual(120)
    expect(first.positionY).toBe(72)
    expect(Math.abs(first.yaw)).toBeLessThanOrEqual(Math.PI / 3)
    expect(Math.abs(first.pitch)).toBeLessThanOrEqual(Math.PI / 10)
    expect(first.roll).toBe(0)
    expect(Math.abs(first.yaw - Math.atan2(-first.positionX, 360))).toBeLessThanOrEqual(Math.PI / 36)
    expect(Math.abs(first.pitch - Math.atan2(-72, 360))).toBeLessThanOrEqual(Math.PI / 36)
  })

  it('interpolates view angles across their shortest arc and ends at the exact target', () => {
    const from = { pitch: 0, positionX: -20, positionY: 10, roll: Math.PI - .1, scale: 1, yaw: Math.PI - .1 }
    const target = { pitch: .4, positionX: 40, positionY: -30, roll: -Math.PI + .1, scale: 1, yaw: -Math.PI + .1 }
    const midway = interpolateAvatarView(from, target, .5)

    expect(Math.abs(midway.roll)).toBeGreaterThan(3)
    expect(Math.abs(midway.yaw)).toBeGreaterThan(3)
    expect(interpolateAvatarView(from, target, 1)).toBe(target)
  })

  it('creates a versioned random seed from environment entropy', () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(array => {
      const values = array as Uint32Array
      values.set([1, 2, 3])
      return array
    })
    expect(createRandomAvatarSeed()).toBe('v1-000000100000020000003')
  })

  it('keeps a fixed coat algorithm while a linked layout follows the Seed', () => {
    const current = {
      algorithm: 'mackerel' as const,
      algorithmSeed: 'v1-fixed-algorithm',
      breakup: 28,
      contrast: 88,
      density: 72,
      enabled: true,
      jitter: 68,
      seed: 'v1-layout-a',
      symmetry: 74,
      thickness: 92
    }
    const resolved = resolveSeededAvatarCoatPattern(
      'v1-layout-b',
      current,
      [AVATAR_SEED_FIELD.coatPatternSeed]
    )
    expect(resolved.algorithm).toBe('mackerel')
    expect(resolved.algorithmSeed).toBe('v1-fixed-algorithm')
    expect(resolved.seed).toBe('v1-layout-b')
  })

  it('resolves coat jitter independently from the other coat controls', () => {
    const current = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, jitter: 0 }
    const resolved = resolveSeededAvatarCoatPattern(
      'v1-jitter',
      current,
      [AVATAR_SEED_FIELD.coatPatternJitter]
    )

    expect(resolved.jitter).toBeGreaterThanOrEqual(0)
    expect(resolved.jitter).toBeLessThanOrEqual(100)
    expect({ ...resolved, jitter: current.jitter }).toEqual(current)
  })

  it('resolves each light coat patch field independently', () => {
    const current = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true }
    const length = resolveSeededAvatarCoatPattern('v1-light-patch', current, [AVATAR_SEED_FIELD.coatPatternLightPatchLength])
    const width = resolveSeededAvatarCoatPattern('v1-light-patch', current, [AVATAR_SEED_FIELD.coatPatternLightPatchWidth])
    const shape = resolveSeededAvatarCoatPattern('v1-light-patch', current, [AVATAR_SEED_FIELD.coatPatternLightPatchShape])
    const offset = resolveSeededAvatarCoatPattern('v1-light-patch', current, [AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY])

    expect(length.lightPatchLength).toBeGreaterThanOrEqual(60)
    expect(length.lightPatchLength).toBeLessThanOrEqual(200)
    expect({ ...length, lightPatchLength: current.lightPatchLength }).toEqual(current)
    expect(width.lightPatchWidth).toBeGreaterThanOrEqual(60)
    expect(width.lightPatchWidth).toBeLessThanOrEqual(200)
    expect({ ...width, lightPatchWidth: current.lightPatchWidth }).toEqual(current)
    expect(['face-mask', 'ellipse', 'rounded']).toContain(shape.lightPatchShape)
    expect({ ...shape, lightPatchShape: current.lightPatchShape }).toEqual(current)
    expect(offset.lightPatchOffsetY).toBeGreaterThanOrEqual(-50)
    expect(offset.lightPatchOffsetY).toBeLessThanOrEqual(50)
    expect({ ...offset, lightPatchOffsetY: current.lightPatchOffsetY }).toEqual(current)
  })
})
