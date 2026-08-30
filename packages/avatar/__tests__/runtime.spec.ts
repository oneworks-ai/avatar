import { describe, expect, it } from 'vitest'

import {
  AVATAR_BACKGROUND_STYLES,
  AVATAR_BEAR_COMPATIBLE_PALETTE_IDS,
  AVATAR_CAMERA_BACKGROUND_PRESETS,
  DEFAULT_AVATAR_COAT_PATTERN,
  AVATAR_FACE_RANGES,
  AVATAR_PALETTES,
  AVATAR_SEED_FIELD_PATHS,
  anchorAvatarAnimationClip,
  applyAvatarPaletteToneJitter,
  applyAvatarScenePatch,
  createDefaultAvatarDefinition,
  createSeededAvatarDefinition,
  normalizeAvatarSeed,
  isAvatarDefinition,
  mergeAvatarAnimationLibraries,
  parseAvatarAnimationClip,
  parseAvatarDefinition,
  resolveAvatarAnimationClip,
  resolveAvatarAnimationFrame,
  resolveAvatarAnimationParameterValues,
  resolveAvatarAnimationTracks,
  resolveAvatarCoatPatternDecals,
  resolveAvatarPaletteFromEntityParts,
  resolveAvatarSeededInteger,
  resolveAvatarSeededOption,
  resolveSeededAvatarView,
  serializeAvatarDefinition
} from '../src'
import type { AvatarAnimationClip, AvatarAnimationLibrary } from '../src'

const nod: AvatarAnimationClip = {
  anchor: 'relative',
  durationMs: 1000,
  keyframes: [
    { atMs: 0, patch: { view: { pitch: 0, yaw: 0 } } },
    { atMs: 1000, easing: 'linear', patch: { view: { pitch: .4, yaw: .6 } } }
  ],
  playback: 'once'
}

const supportLibrary: AvatarAnimationLibrary = {
  groups: {
    attention: {
      clips: { nod },
      defaultClip: 'nod'
    }
  },
  id: 'support'
}

describe('OneWorks Avatar public runtime contract', () => {
  it('keeps public palette ids unique', () => {
    const paletteIds = AVATAR_PALETTES.map(palette => palette.id)
    expect(new Set(paletteIds).size).toBe(paletteIds.length)
  })

  it('supports bounded optional ellipse taper on both standalone bodies and entity parts', () => {
    const definition = createDefaultAvatarDefinition()
    const tapered = {
      ...definition,
      scene: {
        ...definition.scene,
        appearance: { ...definition.scene.appearance, bodyShape: 'ellipse' as const, bottomTaper: 72 },
        entity: {
          parts: [{
            baseColor: '#dd7646', bottomTaper: 68, face: true, foregroundColor: '#26352b',
            highlightColor: '#f19b67', id: 'fox-head', label: 'Head', scaleX: .84,
            scaleY: .7, shadowColor: '#974626', shape: 'ellipse' as const, x: 0, y: 17, z: 0
          }],
          preset: 'fox' as const
        }
      }
    }

    expect(isAvatarDefinition(definition)).toBe(true)
    expect(isAvatarDefinition(tapered)).toBe(true)
    expect(isAvatarDefinition({
      ...tapered,
      scene: { ...tapered.scene, appearance: { ...tapered.scene.appearance, bottomTaper: -1 } }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...tapered,
      scene: {
        ...tapered.scene,
        entity: {
          ...tapered.scene.entity,
          parts: [{ ...tapered.scene.entity.parts[0]!, bottomTaper: 101 }]
        }
      }
    })).toBe(false)
  })

  it('validates and deterministically resolves first-class coat patterns', () => {
    const definition = createDefaultAvatarDefinition()
    const parts = [{
      baseColor: '#9a8267', face: true, foregroundColor: '#2f241c', highlightColor: '#c1ad8f',
      id: 'cat-head', label: 'Head', scaleX: .7, scaleY: .7, shadowColor: '#5b4635',
      shape: 'ellipse' as const, x: 0, y: 0, z: 0
    }]
    const pattern = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, seed: 'v1-core-tabby' }
    const decorated = {
      ...definition,
      scene: {
        ...definition.scene,
        appearance: { ...definition.scene.appearance, coatPattern: pattern, paletteId: 'tabby' },
        entity: { parts, preset: 'cat' as const }
      }
    }
    expect(isAvatarDefinition(decorated)).toBe(true)
    const first = resolveAvatarCoatPatternDecals({ entityParts: parts, entityPreset: 'cat', paletteId: 'tabby', pattern })
    expect(resolveAvatarCoatPatternDecals({ entityParts: parts, entityPreset: 'cat', paletteId: 'tabby', pattern })).toEqual(first)
    expect(first.length).toBeGreaterThan(0)
  })

  it('exposes natural Bear palettes, independent dimension paths, and projected panda eye patches', () => {
    expect(AVATAR_BEAR_COMPATIBLE_PALETTE_IDS).toHaveLength(11)
    expect(AVATAR_BEAR_COMPATIBLE_PALETTE_IDS.every(id => AVATAR_PALETTES.some(palette => palette.id === id)))
      .toBe(true)
    expect(AVATAR_SEED_FIELD_PATHS.bearEarWidth).toBe('scene.entity.bearEarWidth')
    expect(AVATAR_SEED_FIELD_PATHS.bearEarHeight).toBe('scene.entity.bearEarHeight')
    expect(AVATAR_SEED_FIELD_PATHS.bearHeadWidth).toBe('scene.entity.bearHeadWidth')
    expect(AVATAR_SEED_FIELD_PATHS.bearHeadHeight).toBe('scene.entity.bearHeadHeight')

    const parts = [{
      baseColor: '#f5f3ec', face: true, foregroundColor: '#b56c45', highlightColor: '#ffffff',
      id: 'primary', label: 'Head', scaleX: .8, scaleY: .8, shadowColor: '#9fa6a2',
      shape: 'ellipse' as const, x: 0, y: 0, z: 0
    }]
    const decals = resolveAvatarCoatPatternDecals({
      entityParts: parts,
      entityPreset: 'bear',
      paletteId: 'giant-panda',
      pattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true }
    })
    expect(decals.map(decal => decal.id)).toEqual([
      'coat-bear-panda-eye-left', 'coat-bear-panda-eye-right', 'coat-bear-panda-muzzle'
    ])
    expect(decals.every(decal => decal.targetPartId === 'primary')).toBe(true)
  })

  it('uses an optional runtime palette for curved coat markings while preserving canonical palette IDs', () => {
    const parts = [{
      baseColor: '#f5f3ec', face: true, foregroundColor: '#b56c45', highlightColor: '#ffffff',
      id: 'primary', label: 'Head', scaleX: .8, scaleY: .8, shadowColor: '#9fa6a2',
      shape: 'ellipse' as const, x: 0, y: 0, z: 0
    }]
    const basePalette = AVATAR_PALETTES.find(palette => palette.id === 'giant-panda')!
    const runtimePalette = {
      ...basePalette,
      coat: { ...basePalette.coat!, mark: '#263238', patch: '#f1e7d9' }
    }
    const options = {
      entityParts: parts,
      entityPreset: 'bear' as const,
      paletteId: basePalette.id,
      pattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true }
    }

    const canonical = resolveAvatarCoatPatternDecals(options)
    const jittered = resolveAvatarCoatPatternDecals({ ...options, palette: runtimePalette })

    expect(jittered.map(decal => decal.id)).toEqual(canonical.map(decal => decal.id))
    expect(jittered.filter(decal => decal.id.includes('eye-')).map(decal => decal.color))
      .toEqual(['#263238', '#263238'])
    expect(jittered.find(decal => decal.id.endsWith('-muzzle'))?.color).toBe('#f1e7d9')
    expect(canonical.filter(decal => decal.id.includes('eye-')).map(decal => decal.color))
      .toEqual([basePalette.coat!.mark, basePalette.coat!.mark])
    expect(canonical.find(decal => decal.id.endsWith('-muzzle'))?.color).toBe(basePalette.coat!.patch)
    expect(runtimePalette.id).toBe(basePalette.id)
    expect(resolveAvatarCoatPatternDecals(options)).toEqual(canonical)
  })

  it('recovers a precise saved fur tone even when light-colored heads saturate to pure white', () => {
    for (const { amount, paletteId } of [
      { amount: 18, paletteId: 'arctic-fox' },
      { amount: 22, paletteId: 'giant-panda' },
      { amount: 19, paletteId: 'white-sheep' }
    ]) {
      const canonical = AVATAR_PALETTES.find(palette => palette.id === paletteId)!
      const jittered = applyAvatarPaletteToneJitter(canonical, amount)
      const parts = Object.entries(jittered.entityMaterials!).map(([id, material]) => ({
        ...material,
        face: id === 'primary' || id === 'fox-head',
        id
      }))

      expect(parts.find(part => part.face)?.baseColor, `${paletteId} must exercise channel saturation`)
        .toBe('#ffffff')
      expect(resolveAvatarPaletteFromEntityParts(canonical, parts), `${paletteId} must preserve its exact saved tone`)
        .toEqual(jittered)
      expect(jittered.id).toBe(canonical.id)
      expect(jittered.foreground).toBe(canonical.foreground)
    }
  })

  it('keeps panda face markings clearly separated from the head throughout its natural tone range', () => {
    const basePalette = AVATAR_PALETTES.find(palette => palette.id === 'giant-panda')!
    const luminance = (color: string) => (
      Number.parseInt(color.slice(1, 3), 16) * .2126 +
      Number.parseInt(color.slice(3, 5), 16) * .7152 +
      Number.parseInt(color.slice(5, 7), 16) * .0722
    ) / 255

    for (const amount of [-6, 0, 4]) {
      const palette = applyAvatarPaletteToneJitter(basePalette, amount)
      const head = palette.entityMaterials!.primary!.baseColor
      const muzzle = palette.coat!.patch
      const eyePatch = palette.coat!.mark

      expect(luminance(muzzle) - luminance(head), `panda muzzle must remain visible at tone ${amount}`)
        .toBeGreaterThan(.065)
      expect(luminance(head) - luminance(eyePatch), `panda eye patches must remain distinctive at tone ${amount}`)
        .toBeGreaterThan(.5)
      expect(eyePatch).toBe(basePalette.coat!.mark)
      expect(palette.entityMaterials!['ear-left']!.baseColor)
        .toBe(basePalette.entityMaterials!['ear-left']!.baseColor)
      expect(palette.foreground).toBe(basePalette.foreground)
    }
  })

  it('round-trips all six animal entity contracts and exposes their independent geometry Seed fields', () => {
    const definition = createDefaultAvatarDefinition()
    const presets = ['hamster', 'capybara', 'otter', 'pig', 'deer', 'sheep'] as const

    for (const preset of presets) {
      const next = {
        ...definition,
        scene: { ...definition.scene, entity: { ...definition.scene.entity, preset } }
      }
      expect(isAvatarDefinition(next), `${preset} must be accepted by the public runtime`).toBe(true)
      expect(parseAvatarDefinition(serializeAvatarDefinition(next))).toEqual(next)

      for (const dimension of ['EarWidth', 'EarHeight', 'HeadWidth', 'HeadHeight'] as const) {
        const key = `${preset}${dimension}` as keyof typeof AVATAR_SEED_FIELD_PATHS
        expect(AVATAR_SEED_FIELD_PATHS[key]).toBe(`scene.entity.${preset}${dimension}`)
      }
    }

    expect(AVATAR_SEED_FIELD_PATHS.deerAntlerSize).toBe('scene.entity.deerAntlerSize')
    expect(AVATAR_SEED_FIELD_PATHS.deerAntlerStyle).toBe('scene.entity.deerAntlerStyle')
    expect(AVATAR_SEED_FIELD_PATHS.sheepHornSize).toBe('scene.entity.sheepHornSize')
    expect(AVATAR_SEED_FIELD_PATHS.sheepHornStyle).toBe('scene.entity.sheepHornStyle')
  })

  it('round-trips the six next-generation animal contracts and exposes their anatomical Seed fields', () => {
    const definition = createDefaultAvatarDefinition()
    const presets = ['alpaca', 'cow', 'squirrel', 'tiger', 'lion', 'hedgehog'] as const

    for (const preset of presets) {
      const next = {
        ...definition,
        scene: { ...definition.scene, entity: { ...definition.scene.entity, preset } }
      }
      expect(isAvatarDefinition(next), `${preset} must be valid in the framework-neutral SDK`).toBe(true)
      expect(parseAvatarDefinition(serializeAvatarDefinition(next))).toEqual(next)

      for (const dimension of ['EarWidth', 'EarHeight', 'HeadWidth', 'HeadHeight'] as const) {
        const key = `${preset}${dimension}` as keyof typeof AVATAR_SEED_FIELD_PATHS
        expect(AVATAR_SEED_FIELD_PATHS[key]).toBe(`scene.entity.${preset}${dimension}`)
      }
    }

    for (const field of [
      'cowForelockStyle', 'cowHornSize', 'cowHornStyle', 'squirrelTailSize',
      'lionManeSize', 'lionManeStyle', 'hedgehogSpineSize', 'hedgehogSpineStyle'
    ] as const) {
      expect(AVATAR_SEED_FIELD_PATHS[field]).toBe(`scene.entity.${field}`)
    }
  })

  it('round-trips each landed third-batch head-only animal contract', () => {
    const definition = createDefaultAvatarDefinition()
    const presets = [
      { fieldPrefix: 'seal', preset: 'seal' },
      { fieldPrefix: 'beaver', preset: 'beaver' },
      { fieldPrefix: 'guineaPig', preset: 'guinea-pig' },
      { fieldPrefix: 'chinchilla', preset: 'chinchilla' },
      { fieldPrefix: 'ferret', preset: 'ferret' },
      { fieldPrefix: 'monkey', preset: 'monkey' }
    ] as const

    for (const { fieldPrefix, preset } of presets) {
      const next = {
        ...definition,
        scene: { ...definition.scene, entity: { ...definition.scene.entity, preset } }
      }
      expect(isAvatarDefinition(next), `${preset} must be accepted by the public runtime`).toBe(true)
      expect(parseAvatarDefinition(serializeAvatarDefinition(next))).toEqual(next)

      for (const dimension of ['EarWidth', 'EarHeight', 'HeadWidth', 'HeadHeight'] as const) {
        const key = `${fieldPrefix}${dimension}` as keyof typeof AVATAR_SEED_FIELD_PATHS
        expect(AVATAR_SEED_FIELD_PATHS[key]).toBe(`scene.entity.${fieldPrefix}${dimension}`)
      }
    }

    expect(AVATAR_SEED_FIELD_PATHS.beaverToothSize).toBe('scene.entity.beaverToothSize')
    expect(AVATAR_SEED_FIELD_PATHS.beaverToothStyle).toBe('scene.entity.beaverToothStyle')
  })

  it('round-trips the bird-native chick contract without fake ear Seed fields', () => {
    const definition = createDefaultAvatarDefinition()
    const chick = {
      ...definition,
      metadata: {
        ...definition.metadata,
        generation: {
          fields: [
            AVATAR_SEED_FIELD_PATHS.chickHeadWidth,
            AVATAR_SEED_FIELD_PATHS.chickHeadHeight,
            AVATAR_SEED_FIELD_PATHS.chickBeakSize,
            AVATAR_SEED_FIELD_PATHS.chickBeakStyle,
            AVATAR_SEED_FIELD_PATHS.chickCrestSize,
            AVATAR_SEED_FIELD_PATHS.chickCrestStyle
          ],
          seed: 'v1-yellow-chick',
          version: 1 as const
        }
      },
      scene: { ...definition.scene, entity: { ...definition.scene.entity, preset: 'chick' as const } }
    }

    expect(isAvatarDefinition(chick)).toBe(true)
    expect(parseAvatarDefinition(serializeAvatarDefinition(chick))).toEqual(chick)
    expect(Object.keys(AVATAR_SEED_FIELD_PATHS).some(field => field.startsWith('chickEar'))).toBe(false)
  })

  it('round-trips the bird-native duck contract without fake ear Seed fields', () => {
    const definition = createDefaultAvatarDefinition()
    const duck = {
      ...definition,
      metadata: {
        ...definition.metadata,
        generation: {
          fields: [
            AVATAR_SEED_FIELD_PATHS.duckHeadWidth,
            AVATAR_SEED_FIELD_PATHS.duckHeadHeight,
            AVATAR_SEED_FIELD_PATHS.duckBillSize,
            AVATAR_SEED_FIELD_PATHS.duckBillStyle
          ],
          seed: 'v1-yellow-duckling',
          version: 1 as const
        }
      },
      scene: { ...definition.scene, entity: { ...definition.scene.entity, preset: 'duck' as const } }
    }

    expect(isAvatarDefinition(duck)).toBe(true)
    expect(parseAvatarDefinition(serializeAvatarDefinition(duck))).toEqual(duck)
    expect(Object.keys(AVATAR_SEED_FIELD_PATHS).some(field => field.startsWith('duckEar'))).toBe(false)
  })

  it('round-trips the bird-native penguin contract without fake ear Seed fields', () => {
    const definition = createDefaultAvatarDefinition()
    const penguin = {
      ...definition,
      metadata: {
        ...definition.metadata,
        generation: {
          fields: [
            AVATAR_SEED_FIELD_PATHS.penguinHeadWidth,
            AVATAR_SEED_FIELD_PATHS.penguinHeadHeight,
            AVATAR_SEED_FIELD_PATHS.penguinBeakSize,
            AVATAR_SEED_FIELD_PATHS.penguinBeakStyle
          ],
          seed: 'v1-emperor-penguin',
          version: 1 as const
        }
      },
      scene: { ...definition.scene, entity: { ...definition.scene.entity, preset: 'penguin' as const } }
    }

    expect(isAvatarDefinition(penguin)).toBe(true)
    expect(parseAvatarDefinition(serializeAvatarDefinition(penguin))).toEqual(penguin)
    expect(Object.keys(AVATAR_SEED_FIELD_PATHS).some(field => field.startsWith('penguinEar'))).toBe(false)
  })

  it('round-trips the bird-native owl contract and its true tuft attachment without fake ears', () => {
    const definition = createDefaultAvatarDefinition()
    const fields = [
      AVATAR_SEED_FIELD_PATHS.owlHeadWidth,
      AVATAR_SEED_FIELD_PATHS.owlHeadHeight,
      AVATAR_SEED_FIELD_PATHS.owlBeakSize,
      AVATAR_SEED_FIELD_PATHS.owlBeakStyle,
      AVATAR_SEED_FIELD_PATHS.owlTuftSize,
      AVATAR_SEED_FIELD_PATHS.owlTuftStyle
    ]
    const owl = {
      ...definition,
      metadata: { ...definition.metadata, generation: { fields, seed: 'v1-barn-owl', version: 1 as const } },
      scene: { ...definition.scene, entity: { ...definition.scene.entity, preset: 'owl' as const } }
    }

    expect(isAvatarDefinition(owl)).toBe(true)
    expect(parseAvatarDefinition(serializeAvatarDefinition(owl))).toEqual(owl)
    expect(Object.keys(AVATAR_SEED_FIELD_PATHS).some(field => field.startsWith('owlEar'))).toBe(false)
  })

  it('round-trips the bird-native parrot contract without fake ear or crest Seed fields', () => {
    const definition = createDefaultAvatarDefinition()
    const fields = [
      AVATAR_SEED_FIELD_PATHS.parrotHeadWidth,
      AVATAR_SEED_FIELD_PATHS.parrotHeadHeight,
      AVATAR_SEED_FIELD_PATHS.parrotBeakSize,
      AVATAR_SEED_FIELD_PATHS.parrotBeakStyle
    ]
    const parrot = {
      ...definition,
      metadata: { ...definition.metadata, generation: { fields, seed: 'v1-scarlet-macaw', version: 1 as const } },
      scene: { ...definition.scene, entity: { ...definition.scene.entity, preset: 'parrot' as const } }
    }

    expect(isAvatarDefinition(parrot)).toBe(true)
    expect(parseAvatarDefinition(serializeAvatarDefinition(parrot))).toEqual(parrot)
    expect(Object.keys(AVATAR_SEED_FIELD_PATHS).some(field => field.startsWith('parrotEar'))).toBe(false)
    expect(Object.keys(AVATAR_SEED_FIELD_PATHS).some(field => field.startsWith('parrotCrest'))).toBe(false)
  })

  it('round-trips the bird-native goose contract without fake ear Seed fields', () => {
    const definition = createDefaultAvatarDefinition()
    const fields = [
      AVATAR_SEED_FIELD_PATHS.gooseHeadWidth,
      AVATAR_SEED_FIELD_PATHS.gooseHeadHeight,
      AVATAR_SEED_FIELD_PATHS.gooseBillSize,
      AVATAR_SEED_FIELD_PATHS.gooseBillStyle
    ]
    const goose = {
      ...definition,
      metadata: { ...definition.metadata, generation: { fields, seed: 'v1-white-gosling', version: 1 as const } },
      scene: { ...definition.scene, entity: { ...definition.scene.entity, preset: 'goose' as const } }
    }

    expect(isAvatarDefinition(goose)).toBe(true)
    expect(parseAvatarDefinition(serializeAvatarDefinition(goose))).toEqual(goose)
    expect(Object.keys(AVATAR_SEED_FIELD_PATHS).some(field => field.startsWith('gooseEar'))).toBe(false)
  })

  it('exposes independent public fox breed geometry and anatomical style Seed fields', () => {
    expect(AVATAR_SEED_FIELD_PATHS.foxEarWidth).toBe('scene.entity.foxEarWidth')
    expect(AVATAR_SEED_FIELD_PATHS.foxEarHeight).toBe('scene.entity.foxEarHeight')
    expect(AVATAR_SEED_FIELD_PATHS.foxEarStyle).toBe('scene.entity.foxEarStyle')
    expect(AVATAR_SEED_FIELD_PATHS.foxHeadWidth).toBe('scene.entity.foxHeadWidth')
    expect(AVATAR_SEED_FIELD_PATHS.foxHeadHeight).toBe('scene.entity.foxHeadHeight')
    expect(AVATAR_SEED_FIELD_PATHS.foxHeadTaper).toBe('scene.entity.foxHeadTaper')

    const definition = createDefaultAvatarDefinition()
    const fox = {
      ...definition,
      metadata: {
        ...definition.metadata,
        generation: {
          fields: [AVATAR_SEED_FIELD_PATHS.foxEarWidth, AVATAR_SEED_FIELD_PATHS.foxHeadTaper],
          seed: 'v1-arctic-fox',
          version: 1 as const
        }
      },
      scene: { ...definition.scene, entity: { ...definition.scene.entity, preset: 'fox' as const } }
    }

    expect(isAvatarDefinition(fox)).toBe(true)
    expect(parseAvatarDefinition(serializeAvatarDefinition(fox))).toEqual(fox)
  })

  it('projects deterministic pig and deer spots onto their real three-dimensional head and ears', () => {
    const parts = [
      { baseColor: '#b77a4c', face: true, foregroundColor: '#39251b', highlightColor: '#dda77a', id: 'primary', label: 'Head', scaleX: .72, scaleY: .76, shadowColor: '#744931', shape: 'ellipse' as const, x: 0, y: 0, z: 0 },
      { baseColor: '#a06747', face: false, foregroundColor: '#39251b', highlightColor: '#dda77a', id: 'ear-left', label: 'Left ear', scaleX: .2, scaleY: .3, shadowColor: '#744931', shape: 'ellipse' as const, x: -62, y: -68, z: -12 },
      { baseColor: '#a06747', face: false, foregroundColor: '#39251b', highlightColor: '#dda77a', id: 'ear-right', label: 'Right ear', scaleX: .2, scaleY: .3, shadowColor: '#744931', shape: 'ellipse' as const, x: 62, y: -68, z: -12 }
    ]
    const pattern = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, seed: 'v1-animal-spots' }

    for (const { entityPreset, paletteId } of [
      { entityPreset: 'deer', paletteId: 'sika-deer' },
      { entityPreset: 'pig', paletteId: 'spotted-pig' }
    ] as const) {
      const options = { entityParts: parts, entityPreset, paletteId, pattern }
      const decals = resolveAvatarCoatPatternDecals(options)
      expect(decals.length).toBeGreaterThan(0)
      expect(resolveAvatarCoatPatternDecals(options)).toEqual(decals)
      expect(decals.some(decal => decal.targetPartId === 'ear-left')).toBe(true)
      expect(decals.some(decal => decal.targetPartId === 'ear-right')).toBe(true)
      expect(decals.some(decal => decal.side === 'left' || decal.side === 'right')).toBe(true)
      expect(decals.every(decal => decal.id.startsWith(`coat-${entityPreset}-spots-`))).toBe(true)
    }

    expect(resolveAvatarCoatPatternDecals({
      entityParts: parts,
      entityPreset: 'pig',
      paletteId: 'pink-pig',
      pattern
    })).toEqual([])
    expect(resolveAvatarCoatPatternDecals({
      entityParts: parts,
      entityPreset: 'deer',
      paletteId: 'reindeer',
      pattern
    })).toEqual([])
  })

  it('projects dairy-cow spots, chipmunk bands, and tiger stripes onto real animal surfaces', () => {
    const parts = [
      { baseColor: '#c87948', face: true, foregroundColor: '#39251d', highlightColor: '#eaa779', id: 'primary', label: 'Head', scaleX: .75, scaleY: .74, scaleZ: .76, shadowColor: '#875033', shape: 'ellipse' as const, x: 0, y: 12, z: 0 },
      { baseColor: '#c87948', face: false, foregroundColor: '#39251d', highlightColor: '#eaa779', id: 'ear-left', label: 'Left ear', scaleX: .22, scaleY: .28, scaleZ: .2, shadowColor: '#875033', shape: 'ellipse' as const, x: -65, y: -70, z: -12 },
      { baseColor: '#c87948', face: false, foregroundColor: '#39251d', highlightColor: '#eaa779', id: 'ear-right', label: 'Right ear', scaleX: .22, scaleY: .28, scaleZ: .2, shadowColor: '#875033', shape: 'ellipse' as const, x: 65, y: -70, z: -12 }
    ]
    const pattern = {
      ...DEFAULT_AVATAR_COAT_PATTERN,
      algorithm: 'mackerel' as const,
      density: 100,
      enabled: true,
      seed: 'v1-next-generation-anatomy'
    }

    const cow = resolveAvatarCoatPatternDecals({
      entityParts: parts, entityPreset: 'cow', paletteId: 'dairy-cow', pattern
    })
    expect(cow.length).toBeGreaterThan(8)
    expect(cow.some(decal => decal.targetPartId === 'ear-left')).toBe(true)
    expect(cow.every(decal => decal.id.startsWith('coat-cow-spots-'))).toBe(true)

    const chipmunk = resolveAvatarCoatPatternDecals({
      entityParts: parts, entityPreset: 'squirrel', paletteId: 'chipmunk', pattern
    })
    expect(chipmunk).toHaveLength(5)
    expect(chipmunk.every(decal => decal.shape === 'tapered-band' && decal.targetPartId === 'primary')).toBe(true)
    expect(new Set(chipmunk.map(decal => decal.color)).size).toBe(2)
    expect(chipmunk.some(decal => decal.bend !== 0)).toBe(true)

    const tiger = resolveAvatarCoatPatternDecals({
      entityParts: parts, entityPreset: 'tiger', paletteId: 'bengal-tiger', pattern
    })
    expect(tiger.length).toBeGreaterThan(12)
    expect(tiger.every(decal => decal.id.startsWith('coat-tiger-mackerel-'))).toBe(true)
    expect(tiger.some(decal => decal.targetPartId === 'ear-left')).toBe(true)
    expect(tiger.some(decal => decal.side === 'left' || decal.side === 'right')).toBe(true)
    expect(tiger.some(decal => decal.shape === 'tapered-band' && decal.bend !== 0)).toBe(true)
    expect(tiger.some(decal => decal.shape === 'face-mask')).toBe(false)
  })

  it('accepts old coat definitions while validating optional light coat patch fields', () => {
    const definition = createDefaultAvatarDefinition()
    const oldPattern = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true }
    delete (oldPattern as { lightPatchLength?: number }).lightPatchLength
    delete (oldPattern as { lightPatchOffsetY?: number }).lightPatchOffsetY
    delete (oldPattern as { lightPatchShape?: string }).lightPatchShape
    delete (oldPattern as { lightPatchWidth?: number }).lightPatchWidth
    const oldDefinition = {
      ...definition,
      scene: {
        ...definition.scene,
        appearance: { ...definition.scene.appearance, coatPattern: oldPattern }
      }
    }
    expect(isAvatarDefinition(oldDefinition)).toBe(true)
    expect(isAvatarDefinition({
      ...oldDefinition,
      scene: {
        ...oldDefinition.scene,
        appearance: {
          ...oldDefinition.scene.appearance,
          coatPattern: { ...oldPattern, lightPatchShape: 'rounded-triangle' }
        }
      }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...oldDefinition,
      scene: {
        ...oldDefinition.scene,
        appearance: {
          ...oldDefinition.scene.appearance,
          coatPattern: { ...oldPattern, lightPatchOffsetY: -51 }
        }
      }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...oldDefinition,
      scene: {
        ...oldDefinition.scene,
        appearance: {
          ...oldDefinition.scene.appearance,
          coatPattern: { ...oldPattern, lightPatchLength: 59 }
        }
      }
    })).toBe(false)
  })

  it('validates optional independent eye widths as strict bounded face fields', () => {
    const definition = createDefaultAvatarDefinition()
    const withIndependentWidths = {
      ...definition,
      scene: {
        ...definition.scene,
        face: { ...definition.scene.face, leftEyeWidth: 12, rightEyeWidth: 68 }
      }
    }

    expect(isAvatarDefinition(withIndependentWidths)).toBe(true)
    expect(isAvatarDefinition({
      ...withIndependentWidths,
      scene: {
        ...withIndependentWidths.scene,
        face: { ...withIndependentWidths.scene.face, leftEyeWidth: 0 }
      }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...withIndependentWidths,
      scene: {
        ...withIndependentWidths.scene,
        face: { ...withIndependentWidths.scene.face, rightEyeWidth: Number.NaN }
      }
    })).toBe(false)
    expect(isAvatarDefinition({
      ...withIndependentWidths,
      scene: {
        ...withIndependentWidths.scene,
        face: { ...withIndependentWidths.scene.face, unknownEyeWidth: 24 }
      }
    })).toBe(false)
  })

  it('creates deterministic valid 3D definitions from a seed', () => {
    const first = createSeededAvatarDefinition({ name: 'Support', seed: 'agent:support' })
    const second = createSeededAvatarDefinition({ name: 'Support', seed: 'agent:support' })
    const different = createSeededAvatarDefinition({ seed: 'agent:research' })

    expect(first).toEqual(second)
    expect(first).not.toEqual(different)
    expect(first.metadata?.name).toBe('Support')
    expect(first.metadata?.generation).toEqual(expect.objectContaining({
      seed: 'v1-agent:support',
      version: 1
    }))
    expect(first.scene.appearance.backgroundStyle).toBe(resolveAvatarSeededOption(
      'v1-agent:support',
      AVATAR_SEED_FIELD_PATHS.backgroundStyle,
      AVATAR_BACKGROUND_STYLES
    ))
    expect(first.scene.appearance.paletteId).toBe(resolveAvatarSeededOption(
      'v1-agent:support',
      AVATAR_SEED_FIELD_PATHS.palette,
      AVATAR_PALETTES.map(palette => palette.id)
    ))
    expect(first.scene.camera.background).toBe(resolveAvatarSeededOption(
      'v1-agent:support',
      AVATAR_SEED_FIELD_PATHS.cameraBackground,
      AVATAR_CAMERA_BACKGROUND_PRESETS
    ))
    expect(first.scene.camera.frame).toBe(createDefaultAvatarDefinition().scene.camera.frame)
    expect(first.metadata?.generation?.fields).not.toContain(AVATAR_SEED_FIELD_PATHS.cameraFrame)
    expect(first.metadata?.generation?.fields).toContain(AVATAR_SEED_FIELD_PATHS.viewPose)
    expect(first.scene.view.scale).toBe(1.72)
    expect(Math.abs(first.scene.view.yaw - Math.atan2(-first.scene.view.positionX, 360)))
      .toBeLessThanOrEqual(Math.PI / 36)
    expect(first.scene.view.positionY).toBe(72)
    expect(Math.abs(first.scene.view.pitch - Math.atan2(-72, 360)))
      .toBeLessThanOrEqual(Math.PI / 36)
    expect(first.scene.view.roll).toBe(0)
    expect(parseAvatarDefinition(serializeAvatarDefinition(first))).toEqual(first)
  })

  it('keeps Seeded view poses upright in a consistent lower composition with restrained tilt', () => {
    const current = createDefaultAvatarDefinition().scene.view
    const views = Array.from({ length: 80 }, (_, index) => resolveSeededAvatarView(`v1-view-${index}`, current))
    expect(views.some(view => view.positionX < 0)).toBe(true)
    expect(views.some(view => view.positionX > 0)).toBe(true)
    expect(new Set(views.map(view => view.pitch.toFixed(4))).size).toBeGreaterThan(20)
    expect(new Set(views.map(view => view.yaw.toFixed(4))).size).toBeGreaterThan(20)
    for (const view of views) {
      expect(view.positionY).toBe(72)
      expect(Math.abs(view.pitch)).toBeLessThanOrEqual(Math.PI / 10)
      expect(view.roll).toBe(0)
      expect(Math.abs(view.yaw - Math.atan2(-view.positionX, 360))).toBeLessThanOrEqual(Math.PI / 36)
      expect(Math.abs(view.pitch - Math.atan2(-72, 360))).toBeLessThanOrEqual(Math.PI / 36)
      expect(view.scale).toBe(1.72)
    }
  })

  it('resolves seeded fields independently and remains stable when candidates are appended', () => {
    const seed = normalizeAvatarSeed('agent:support')
    expect(resolveAvatarSeededInteger(seed, 'face.gap', 32, 48)).toBe(
      resolveAvatarSeededInteger(seed, 'face.gap', 32, 48)
    )
    expect(resolveAvatarSeededInteger(seed, 'face.gap', 32, 48)).not.toBe(
      resolveAvatarSeededInteger(seed, 'camera.frame', 32, 48)
    )

    const original = resolveAvatarSeededOption(seed, 'entity.preset', ['cat', 'dog', 'rabbit'])
    const extended = resolveAvatarSeededOption(seed, 'entity.preset', ['cat', 'dog', 'rabbit', 'bun'])
    expect(['cat', 'dog', 'rabbit']).toContain(original)
    expect(extended === 'bun' || extended === original).toBe(true)
    expect(resolveAvatarSeededOption(seed, 'entity.preset', ['cat', 'dog', 'rabbit'])).toBe(original)
  })

  it('round-trips a versioned definition', () => {
    const definition = createDefaultAvatarDefinition()
    expect(parseAvatarDefinition(serializeAvatarDefinition(definition))).toEqual(definition)
    const profiled = {
      ...definition,
      metadata: {
        generation: {
          fields: ['scene.face.preset'],
          profileId: 'future-cat-profile',
          seed: 'v1-profiled',
          version: 1 as const
        }
      }
    }
    expect(parseAvatarDefinition(serializeAvatarDefinition(profiled))).toEqual(profiled)
    const dogHeadProfile = {
      ...profiled,
      metadata: {
        generation: {
          ...profiled.metadata.generation,
          fields: [AVATAR_SEED_FIELD_PATHS.dogHeadWidth, AVATAR_SEED_FIELD_PATHS.dogHeadHeight],
          profileId: 'corgi'
        }
      }
    }
    expect(isAvatarDefinition(dogHeadProfile)).toBe(true)
    expect(parseAvatarDefinition(serializeAvatarDefinition(dogHeadProfile))).toEqual(dogHeadProfile)
    expect(() => parseAvatarDefinition({
      ...profiled,
      metadata: {
        generation: { ...profiled.metadata.generation, profileId: ' future-cat-profile' }
      }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({ ...definition, version: 2 })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({
      ...definition,
      metadata: { generation: { fields: ['scene.face', 'scene.face'], seed: 'v1-test', version: 1 } }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({
      ...definition,
      metadata: { generation: { fields: [' scene.face'], seed: 'v1-test', version: 1 } }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({
      ...definition,
      metadata: { generation: { fields: ['scene.face,scene.view'], seed: 'v1-test', version: 1 } }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition(Object.create(definition))).toThrow(TypeError)
    const revoked = Proxy.revocable(definition, {})
    revoked.revoke()
    expect(isAvatarDefinition(revoked.proxy)).toBe(false)
    expect(() => parseAvatarDefinition(revoked.proxy)).toThrow(TypeError)
    expect(() => parseAvatarAnimationClip(Object.create(nod))).toThrow(TypeError)
    const revokedClip = Proxy.revocable(nod, {})
    revokedClip.revoke()
    expect(() => parseAvatarAnimationClip(revokedClip.proxy)).toThrow(TypeError)
    const decorated = {
      ...definition,
      scene: {
        ...definition.scene,
        decals: [{
          color: '#f29a93',
          height: 18,
          id: 'blush-left',
          label: 'Left blush',
          opacity: 90,
          rotation: -8,
          shape: 'ellipse' as const,
          targetPartId: null,
          width: 30,
          x: -48,
          y: 30
        }],
        face: {
          ...definition.scene.face,
          eyeHighlight: {
            color: '#ffffff',
            enabled: true,
            offsetX: -18,
            offsetY: -20,
            opacity: 92,
            size: 28
          }
        }
      }
    }
    expect(parseAvatarDefinition(serializeAvatarDefinition(decorated))).toEqual(decorated)
    const withFaceMask = {
      ...decorated,
      scene: {
        ...decorated.scene,
        decals: [{
          ...decorated.scene.decals[0]!,
          height: 160,
          id: 'face-to-chin',
          rotation: 0,
          shape: 'face-mask' as const,
          side: 'face' as const,
          width: 108,
          x: 0,
          y: 70
        }]
      }
    }
    expect(parseAvatarDefinition(serializeAvatarDefinition(withFaceMask))).toEqual(withFaceMask)
    expect(() =>
      parseAvatarDefinition({
        ...decorated,
        scene: { ...decorated.scene, decals: [{ ...decorated.scene.decals[0]!, opacity: 101 }] }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...decorated,
        scene: {
          ...decorated.scene,
          face: { ...decorated.scene.face, eyeHighlight: { ...decorated.scene.face.eyeHighlight, size: 0 } }
        }
      })
    ).toThrow(TypeError)
    const invalidScenes = [
      { ...definition.scene, face: { ...definition.scene.face, width: -1 } },
      { ...definition.scene, view: { ...definition.scene.view, scale: -1 } },
      {
        ...definition.scene,
        effects: {
          ...definition.scene.effects,
          outline: { ...definition.scene.effects.outline, opacity: 1000 }
        }
      },
      {
        ...definition.scene,
        camera: {
          ...definition.scene.camera,
          frameShadow: { ...definition.scene.camera.frameShadow, distance: -20 }
        }
      },
      { ...definition.scene, lighting: { ...definition.scene.lighting, gridDensity: -1 } },
      { ...definition.scene, camera: { ...definition.scene.camera, background: 'bogus' } },
      {
        ...definition.scene,
        effects: {
          ...definition.scene.effects,
          outline: { ...definition.scene.effects.outline, color: 'bogus' }
        }
      }
    ]
    invalidScenes.forEach(scene => {
      expect(() => parseAvatarDefinition({ ...definition, scene })).toThrow(TypeError)
    })
    expect(
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          camera: {
            ...definition.scene.camera,
            frameShadow: { ...definition.scene.camera.frameShadow, distance: 40, softness: 48 }
          },
          effects: {
            ...definition.scene.effects,
            outline: { ...definition.scene.effects.outline, opacity: 100, width: 20 }
          },
          face: { ...definition.scene.face, width: 72 },
          lighting: { ...definition.scene.lighting, gridDensity: 400 },
          view: { ...definition.scene.view, positionX: -230, positionY: 230, scale: .35 }
        }
      }).scene.view.scale
    ).toBe(.35)
    const changing = { ...definition }
    let versionReads = 0
    Object.defineProperty(changing, 'version', {
      enumerable: true,
      get: () => ++versionReads === 1 ? 1 : 2
    })
    expect(() => parseAvatarDefinition(changing)).toThrow(TypeError)
    const polluted = { ...definition, scene: { ...definition.scene, view: { ...definition.scene.view } } }
    delete (polluted.scene.view as { yaw?: number }).yaw
    Object.defineProperty(Object.prototype, 'yaw', { configurable: true, value: 0 })
    try {
      expect(() => parseAvatarDefinition(polluted)).toThrow(TypeError)
    } finally {
      delete (Object.prototype as { yaw?: number }).yaw
    }
    const hiddenVersion = { ...definition }
    Object.defineProperty(hiddenVersion, 'version', { enumerable: false, value: 1 })
    expect(() => parseAvatarDefinition(hiddenVersion)).toThrow(TypeError)
    const hiddenExtra = { ...definition }
    Object.defineProperty(hiddenExtra, 'extra', { value: true })
    expect(() => parseAvatarDefinition(hiddenExtra)).toThrow(TypeError)
    const hiddenName = { ...definition, metadata: {} }
    Object.defineProperty(hiddenName.metadata, 'name', { value: 'Hidden' })
    expect(() => parseAvatarDefinition(hiddenName)).toThrow(TypeError)
    const missingHighlight = {
      ...definition,
      scene: { ...definition.scene, face: { ...definition.scene.face } }
    }
    delete (missingHighlight.scene.face as Partial<typeof missingHighlight.scene.face>).eyeHighlight
    expect(() => parseAvatarDefinition(missingHighlight)).toThrow(TypeError)
    const missingDecals = { ...definition, scene: { ...definition.scene } }
    delete (missingDecals.scene as Partial<typeof missingDecals.scene>).decals
    expect(() => parseAvatarDefinition(missingDecals)).toThrow(TypeError)
    const hiddenDecals = [] as typeof definition.scene.decals[number][]
    Object.defineProperty(hiddenDecals, '0', {
      configurable: true,
      enumerable: false,
      value: definition.scene.decals[0] ?? {
        color: '#ffffff',
        height: 20,
        id: 'hidden',
        label: 'Hidden',
        opacity: 100,
        rotation: 0,
        shape: 'ellipse',
        targetPartId: null,
        width: 20,
        x: 0,
        y: 0
      },
      writable: true
    })
    expect(isAvatarDefinition({ ...definition, scene: { ...definition.scene, decals: hiddenDecals } })).toBe(false)
    expect(() => parseAvatarDefinition({ ...definition, [Symbol('extra')]: true })).toThrow(TypeError)
    const invalidWidth = {
      ...definition,
      scene: { ...definition.scene, face: { ...definition.scene.face, width: 999 } }
    }
    expect(isAvatarDefinition(invalidWidth)).toBe(false)
    expect(() => {
      ;(AVATAR_FACE_RANGES.width as { max: number }).max = 1000
    }).toThrow(TypeError)
    expect(isAvatarDefinition(invalidWidth)).toBe(false)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          glyph: { leftEye: '0', linkEyes: true, mouth: 'w', rightEye: '0' }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          decals: [{
            color: '#f29a93',
            height: 18,
            id: 'missing-target',
            label: 'Missing target',
            opacity: 90,
            rotation: 0,
            shape: 'ellipse',
            targetPartId: 'missing-part',
            width: 30,
            x: 0,
            y: 0
          }]
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          decals: [{
            color: '#f29a93',
            height: 18,
            id: 'blank-target',
            label: 'Blank target',
            opacity: 90,
            rotation: 0,
            shape: 'ellipse',
            targetPartId: ' ',
            width: 30,
            x: 0,
            y: 0
          }]
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: Array(1), preset: 'custom' }
        }
      })
    ).toThrow(TypeError)
    const duplicatePart = {
      baseColor: '#111111',
      face: true,
      foregroundColor: '#ffffff',
      highlightColor: '#eeeeee',
      id: 'duplicate',
      label: 'Duplicate',
      scaleX: 1,
      scaleY: 1,
      shadowColor: '#000000',
      shape: 'sphere' as const,
      x: 0,
      y: 0,
      z: 0
    }
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: [{ ...duplicatePart, id: '' }], preset: 'custom' }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: [{ ...duplicatePart, baseColor: 'bogus' }], preset: 'custom' }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: [{ ...duplicatePart, scaleX: 0 }], preset: 'custom' }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: {
            parts: [{ ...duplicatePart, face: false }],
            preset: 'custom'
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: {
            parts: [duplicatePart, { ...duplicatePart, id: 'second' }],
            preset: 'custom'
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          entity: {
            parts: [duplicatePart, { ...duplicatePart }],
            preset: 'custom'
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 100,
        keyframes: Array(1),
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(() => parseAvatarDefinition({ ...definition, extra: true })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({ ...definition, animations: null })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({ ...definition, metadata: null })).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: { ...definition.scene, extra: true }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: { ...definition.scene, view: { ...definition.scene.view, extra: true } }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: { ...definition.scene, face: { ...definition.scene.face, width: undefined } }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: { nod },
              defaultClip: 'missing'
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        extra: true
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ ...nod.keyframes[0], extra: true }]
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ atMs: 0, easing: null, patch: {} }]
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ atMs: 0, patch: { view: null } }]
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ atMs: 0, patch: { face: { width: -1 } } }]
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        ...nod,
        keyframes: [{ atMs: 0, patch: { view: { positionX: Number.POSITIVE_INFINITY } } }]
      })
    ).toThrow(TypeError)
    const symbolicPatch = {
      ...nod,
      keyframes: [{ atMs: 0, patch: { face: { width: 28 } } }]
    }
    Object.defineProperty(symbolicPatch.keyframes[0]!.patch.face, Symbol('unknown'), {
      enumerable: true,
      value: 1
    })
    expect(() => parseAvatarAnimationClip(symbolicPatch)).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          effects: {
            ...definition.scene.effects,
            colorGrade: { ...definition.scene.effects.colorGrade, brightness: 2 }
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: { broken: { clips: { nope: { durationMs: 'fast' } } } },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 100,
        keyframes: [{ atMs: 0, patch: { colorGrade: { tintAmount: 1.1 } } }],
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 100,
        keyframes: [{ atMs: 0, patch: { colorGrade: { tintR: 256 } } }],
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 100,
        keyframes: [{
          atMs: 0,
          patch: {
            colorGrade: {
              brightness: .35,
              saturation: 2,
              tintAmount: 1,
              tintB: 0,
              tintG: 255,
              tintR: 255
            }
          }
        }],
        playback: 'once'
      }).keyframes
    ).toHaveLength(1)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: {
                nope: {
                  anchor: 'absolute',
                  durationMs: 100,
                  keyframes: [{ atMs: 101, patch: {} }],
                  playback: 'once'
                }
              }
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: {
                nope: {
                  anchor: 'absolute',
                  durationMs: 100,
                  keyframes: [{ atMs: 0, patch: { lighting: { enabled: true } } }],
                  playback: 'once'
                }
              }
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    const withFaceAnimation = {
      ...definition,
      animations: {
        groups: {
          valid: {
            clips: {
              expression: {
                anchor: 'absolute' as const,
                durationMs: 100,
                keyframes: [{
                  atMs: 0,
                  patch: { face: { eyeShape: 'rounded' as const, noseEnabled: false } }
                }],
                playback: 'once' as const
              }
            }
          }
        },
        id: 'valid'
      }
    }
    expect(parseAvatarDefinition(serializeAvatarDefinition(withFaceAnimation))).toEqual(withFaceAnimation)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: {
                nope: {
                  anchor: 'absolute',
                  durationMs: 100,
                  keyframes: [{ atMs: 0, patch: { face: { width: 'wide' } } }],
                  playback: 'once'
                }
              }
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...definition,
        animations: {
          groups: {
            broken: {
              clips: {
                nope: {
                  anchor: 'absolute',
                  durationMs: 100,
                  keyframes: [{ atMs: 0, patch: { view: { roll: 1 } } }],
                  playback: 'once'
                }
              }
            }
          },
          id: 'broken'
        }
      })
    ).toThrow(TypeError)
  })

  it('validates the optional pixel effect and sampling algorithm', () => {
    const definition = createDefaultAvatarDefinition()
    const pixelated = {
      ...definition,
      scene: {
        ...definition.scene,
        effects: {
          ...definition.scene.effects,
          pixelate: {
            blockSize: 12,
            dithering: 'ordered' as const,
            enabled: true,
            paletteSize: 16 as const,
            sampling: 'slic' as const
          }
        }
      }
    }

    expect(parseAvatarDefinition(serializeAvatarDefinition(pixelated))).toEqual(pixelated)
    expect(() =>
      parseAvatarDefinition({
        ...pixelated,
        scene: {
          ...pixelated.scene,
          effects: {
            ...pixelated.scene.effects,
            pixelate: { ...pixelated.scene.effects.pixelate, sampling: 'bilinear' }
          }
        }
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarDefinition({
        ...pixelated,
        scene: {
          ...pixelated.scene,
          effects: {
            ...pixelated.scene.effects,
            pixelate: { ...pixelated.scene.effects.pixelate, blockSize: 2.5 }
          }
        }
      })
    ).toThrow(TypeError)
  })

  it('resolves custom animation groups with deterministic library precedence', () => {
    const replacement = {
      ...supportLibrary,
      groups: {
        attention: {
          clips: { wave: { ...nod, label: 'Wave' } },
          defaultClip: 'wave'
        }
      }
    }
    const libraries = mergeAvatarAnimationLibraries([supportLibrary, replacement])
    expect(libraries).toHaveLength(1)
    expect(
      resolveAvatarAnimationClip(libraries, {
        clipId: 'wave',
        groupId: 'attention',
        libraryId: 'support'
      })?.label
    ).toBe('Wave')
  })

  it('anchors relative motion to the consumer definition and interpolates it', () => {
    const definition = applyAvatarScenePatch(createDefaultAvatarDefinition().scene, {
      view: { pitch: .2, positionX: 12, positionY: -8, yaw: -.3 }
    })
    const source = { ...createDefaultAvatarDefinition(), scene: definition }
    const anchored = anchorAvatarAnimationClip(source, nod)
    const middle = resolveAvatarAnimationFrame(source, anchored, 500)
    expect(middle.scene.view.pitch).toBeCloseTo(.4)
    expect(middle.scene.view.yaw).toBeCloseTo(0)
    expect(middle.scene.view.positionX).toBe(12)
    expect(middle.finished).toBe(false)
    expect(resolveAvatarAnimationFrame(source, anchored, 1000).finished).toBe(true)
  })

  it('interpolates nested eye highlights consistently with the editor', () => {
    const definition = createDefaultAvatarDefinition()
    const fromHighlight = {
      ...definition.scene.face.eyeHighlight,
      enabled: true,
      offsetX: -20,
      offsetY: -16,
      opacity: 0,
      size: 8
    }
    const toHighlight = {
      ...fromHighlight,
      offsetX: 20,
      offsetY: 16,
      opacity: 100,
      size: 48
    }
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { face: { eyeHighlight: fromHighlight } } },
        { atMs: 1000, patch: { face: { eyeHighlight: toHighlight } } }
      ],
      playback: 'once'
    }

    const middle = resolveAvatarAnimationFrame(definition, clip, 500).scene.face.eyeHighlight
    expect(middle).toMatchObject({
      offsetX: 0,
      offsetY: 0,
      opacity: 50,
      size: 28
    })
  })

  it('interpolates semantic part TRS without admitting material or topology mutations', () => {
    const base = createDefaultAvatarDefinition()
    const primary = {
      baseColor: '#b77a4c',
      face: true,
      foregroundColor: '#39251b',
      highlightColor: '#dda77a',
      id: 'primary',
      label: 'Head',
      scaleX: .72,
      scaleY: .76,
      shadowColor: '#744931',
      shape: 'ellipse' as const,
      x: 0,
      y: 12,
      z: 0
    }
    const definition = {
      ...base,
      scene: { ...base.scene, entity: { parts: [primary], preset: 'custom' as const } }
    }
    const alertStem = {
      ...primary,
      face: false,
      id: 'alert-stem',
      label: 'Alert droplet',
      scaleX: .11,
      scaleY: .32,
      scaleZ: .15,
      shape: 'teardrop' as const,
      x: 0,
      y: -30,
      z: 0
    }
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        {
          atMs: 0,
          patch: {
            auxiliaryParts: [{
              composition: 'independent-depth',
              opacity: 0,
              part: alertStem,
              transform: { rotationZ: -10, scaleX: .01, scaleY: .01, scaleZ: .02, x: 0, y: 0, z: 0 }
            }],
            partShapeMorphs: {
              'alert-stem': { fromShape: 'sphere', progress: 0, toShape: 'teardrop' },
              primary: { fromShape: 'ellipse', progress: 0, toShape: 'sphere' }
            },
            auxiliaryShapes: [{
              color: '#39251b',
              height: 0,
              id: 'alert-glyph',
              kind: 'exclamation',
              opacity: 0,
              rotation: -10,
              roundness: 100,
              width: 0,
              x: 0,
              y: 0
            }]
          }
        },
        {
          atMs: 1000,
          easing: 'linear',
          patch: {
            auxiliaryParts: [{
              composition: 'independent-depth',
              opacity: 100,
              part: alertStem,
              transform: { rotationZ: 0, scaleX: .11, scaleY: .32, scaleZ: .2, x: 0, y: -30, z: 0 }
            }],
            partShapeMorphs: {
              'alert-stem': { fromShape: 'sphere', progress: 1, toShape: 'teardrop' },
              primary: { fromShape: 'ellipse', progress: 1, toShape: 'sphere' }
            },
            auxiliaryShapes: [{
              color: '#39251b',
              height: 120,
              id: 'alert-glyph',
              kind: 'exclamation',
              opacity: 100,
              rotation: 0,
              roundness: 100,
              width: 24,
              x: 70,
              y: -12
            }],
            partTransforms: {
              primary: {
                rotationZ: 20,
                scaleX: primary.scaleX * .5,
                scaleY: primary.scaleY * 1.4,
                scaleZ: .2,
                x: primary.x + 40,
                y: primary.y - 20,
                z: primary.z
              }
            }
          }
        }
      ],
      playback: 'once'
    }

    expect(parseAvatarAnimationClip(clip)).toEqual(clip)
    expect(parseAvatarAnimationClip({
      ...clip,
      keyframes: [{
        atMs: 0,
        patch: { partTransforms: { primary: { scaleX: .02, scaleY: .02 } } }
      }]
    }).keyframes[0]?.patch.partTransforms?.primary).toEqual({ scaleX: .02, scaleY: .02 })
    const middle = resolveAvatarAnimationFrame(definition, clip, 500)
    const resolvedPrimary = middle.scene.entity.parts.find(part => part.id === 'primary')!
    expect(resolvedPrimary.x).toBeCloseTo(primary.x + 20)
    expect(resolvedPrimary.y).toBeCloseTo(primary.y - 10)
    expect(middle.partTransforms?.primary?.x).toBeCloseTo(primary.x + 20)
    expect(middle.auxiliaryParts?.[0]).toMatchObject({
      composition: 'independent-depth',
      opacity: 50,
      part: { id: 'alert-stem', shape: 'teardrop' },
      transform: { rotationZ: -5, scaleY: .165, x: 0, y: -15, z: 0 }
    })
    expect(middle.auxiliaryParts?.[0]?.transform?.scaleX).toBeCloseTo(.06)
    expect(middle.auxiliaryParts?.[0]?.transform?.scaleZ).toBeCloseTo(.11)
    expect(middle.partTransforms?.primary?.scaleZ).toBeCloseTo(.46)
    expect(middle.partShapeMorphs).toEqual({
      'alert-stem': { fromShape: 'sphere', progress: .5, toShape: 'teardrop' },
      primary: { fromShape: 'ellipse', progress: .5, toShape: 'sphere' }
    })
    expect(middle.auxiliaryShapes?.[0]).toMatchObject({
      height: 60,
      id: 'alert-glyph',
      kind: 'exclamation',
      opacity: 50,
      rotation: -5,
      width: 12,
      x: 35,
      y: -6
    })
    expect(resolvedPrimary).toMatchObject({
      baseColor: primary.baseColor,
      face: primary.face,
      foregroundColor: primary.foregroundColor,
      highlightColor: primary.highlightColor,
      id: primary.id,
      shape: primary.shape
    })
    expect(() => parseAvatarAnimationClip({
      ...clip,
      keyframes: [{
        atMs: 0,
        patch: { partTransforms: { primary: { baseColor: '#000000' } } }
      }]
    })).toThrow(TypeError)
    expect(() => parseAvatarAnimationClip({
      ...clip,
      keyframes: [{
        atMs: 0,
        patch: {
          auxiliaryShapes: [{
            color: '#39251b',
            height: 120,
            id: 'alert-glyph',
            kind: 'orb',
            opacity: 100,
            rotation: 0,
            roundness: 100,
            width: 24,
            x: 70,
            y: -12
          }]
        }
      }]
    })).toThrow(TypeError)
  })

  it('anchors each sparse view dimension at its first authored keyframe', () => {
    const source = createDefaultAvatarDefinition()
    const definition = {
      ...source,
      scene: applyAvatarScenePatch(source.scene, { view: { yaw: -.3 } })
    }
    const clip: AvatarAnimationClip = {
      anchor: 'relative',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { face: { mouthEnabled: false } } },
        { atMs: 500, patch: { view: { yaw: .6 } } },
        { atMs: 1000, patch: { view: { yaw: 1 } } }
      ],
      playback: 'once'
    }
    const anchored = anchorAvatarAnimationClip(definition, clip)
    expect(resolveAvatarAnimationFrame(definition, anchored, 500).scene.view.yaw).toBeCloseTo(-.3)
    expect(resolveAvatarAnimationFrame(definition, anchored, 1000).scene.view.yaw).toBeCloseTo(.1)
  })

  it('keeps relative motion unbounded by the editor drag range', () => {
    const base = createDefaultAvatarDefinition()
    const definition = {
      ...base,
      scene: applyAvatarScenePatch(base.scene, { view: { positionX: 230 } })
    }
    const clip: AvatarAnimationClip = {
      anchor: 'relative',
      durationMs: 100,
      keyframes: [
        { atMs: 0, patch: { view: { positionX: -230 } } },
        { atMs: 100, patch: { view: { positionX: 230 } } }
      ],
      playback: 'once'
    }
    const anchored = anchorAvatarAnimationClip(definition, clip)

    expect(anchored.keyframes.map(frame => frame.patch.view?.positionX)).toEqual([230, 690])
    expect(parseAvatarAnimationClip(anchored)).toEqual(anchored)
    const scene = resolveAvatarAnimationFrame(definition, anchored, 100).scene
    expect(parseAvatarDefinition({ ...definition, scene }).scene.view.positionX).toBe(690)
  })

  it('interpolates from the base scene to a delayed first keyframe', () => {
    const definition = createDefaultAvatarDefinition()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [{ atMs: 500, easing: 'linear', patch: { view: { pitch: .6 } } }],
      playback: 'once'
    }
    expect(resolveAvatarAnimationFrame(definition, clip, 0).scene.view.pitch).toBe(0)
    expect(resolveAvatarAnimationFrame(definition, clip, 250).scene.view.pitch).toBeCloseTo(.3)
    expect(resolveAvatarAnimationFrame(definition, clip, 500).scene.view.pitch).toBeCloseTo(.6)
    const looping = { ...clip, playback: 'loop' as const }
    expect(resolveAvatarAnimationFrame(definition, looping, 750).scene.view.pitch).toBeCloseTo(.6)
    expect(resolveAvatarAnimationFrame(definition, looping, 1000).scene.view.pitch).toBeCloseTo(.6)

    const releasing: AvatarAnimationClip = {
      ...looping,
      keyframes: [
        { atMs: 0, patch: {} },
        { atMs: 500, easing: 'linear', patch: { view: { pitch: .6 } } },
        { atMs: 900, easing: 'linear', patch: { release: ['view:pitch'] } }
      ]
    }
    expect(resolveAvatarAnimationFrame(definition, releasing, 700).scene.view.pitch).toBeCloseTo(.3)
    expect(resolveAvatarAnimationFrame(definition, releasing, 900).scene.view.pitch).toBe(0)
    expect(resolveAvatarAnimationFrame(definition, releasing, 1000).scene.view.pitch).toBe(0)
  })

  it('composes ordered sparse animation tracks without resetting lower-layer clocks', () => {
    const base = createDefaultAvatarDefinition()
    const head = {
      baseColor: '#b77a4c', face: true, foregroundColor: '#39251b', highlightColor: '#dda77a',
      id: 'primary', label: 'Head', scaleX: .72, scaleY: .76, shadowColor: '#744931',
      shape: 'ellipse' as const, x: 0, y: 12, z: 0
    }
    const definition = {
      ...base,
      scene: { ...base.scene, entity: { parts: [head], preset: 'custom' as const } }
    }
    const loop = (
      patch: AvatarAnimationClip['keyframes'][number]['patch'],
      claims: readonly string[]
    ): AvatarAnimationClip => ({
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch },
        { atMs: 1000, easing: 'linear', patch }
      ],
      playback: 'loop',
      resourceClaims: claims
    })
    const breathing = loop(
      { partTransforms: { [head.id]: { scaleY: head.scaleY * .9 } } },
      [`part:${head.id}.transform.scaleY`]
    )
    const nodding = loop({ view: { pitch: .3 } }, ['view:pitch'])
    const blinking = loop({ face: { height: 8 } }, ['face:leftEye.height', 'face:rightEye.height'])
    const shocked = loop({ face: { height: 96 } }, ['face:leftEye.height', 'face:rightEye.height'])

    const baseTracks = [
      { clip: breathing, elapsedMs: 420, trackId: 'idle' },
      { clip: nodding, elapsedMs: 610, trackId: 'nod' },
      { clip: blinking, elapsedMs: 250, trackId: 'blink' }
    ]
    const layered = resolveAvatarAnimationTracks(definition, baseTracks)
    expect(layered.scene.entity.parts.find(part => part.id === head.id)?.scaleY).toBe(head.scaleY * .9)
    expect(layered.scene.view.pitch).toBe(.3)
    expect(layered.scene.face.leftEyeHeight).toBe(8)
    expect(layered.scene.face.rightEyeHeight).toBe(8)

    const overridden = resolveAvatarAnimationTracks(definition, [
      ...baseTracks,
      { clip: shocked, elapsedMs: 700, trackId: 'shocked' }
    ])
    expect(overridden.scene.face.leftEyeHeight).toBe(96)
    expect(overridden.scene.view.pitch).toBe(.3)
    expect(overridden.scene.entity.parts.find(part => part.id === head.id)?.scaleY).toBe(head.scaleY * .9)

    const revealed = resolveAvatarAnimationTracks(definition, baseTracks)
    expect(revealed.scene.face.leftEyeHeight).toBe(8)
    expect(revealed.scene.view.pitch).toBe(.3)
  })

  it('releases one upper resource smoothly to the lower track current value', () => {
    const definition = createDefaultAvatarDefinition()
    const lower: AvatarAnimationClip = {
      anchor: 'absolute', durationMs: 1000, playback: 'loop', resourceClaims: ['view:pitch'],
      keyframes: [
        { atMs: 0, patch: { view: { pitch: .4 } } },
        { atMs: 1000, patch: { view: { pitch: .4 } } }
      ]
    }
    const upper: AvatarAnimationClip = {
      anchor: 'absolute', durationMs: 1000, playback: 'once', resourceClaims: ['view:pitch'],
      keyframes: [
        { atMs: 0, patch: { view: { pitch: .8 } } },
        { atMs: 1000, easing: 'linear', patch: { release: ['view:pitch'] } }
      ]
    }
    const at = (elapsedMs: number) => resolveAvatarAnimationTracks(definition, [
      { clip: lower, elapsedMs: 777, trackId: 'lower' },
      { clip: upper, elapsedMs, trackId: 'upper' }
    ]).scene.view.pitch

    expect(at(0)).toBe(.8)
    expect(at(500)).toBeCloseTo(.6)
    expect(at(999)).toBeCloseTo(.4004, 3)
    expect(at(1000)).toBe(.4)
  })

  it('namespaces weighted auxiliary parts and keeps the source clip immutable', () => {
    const definition = createDefaultAvatarDefinition()
    const primary = definition.scene.entity.parts.find(part => part.face)!
    const orb = { ...primary, face: false, id: 'notification-orb', label: 'Notification orb', shape: 'sphere' as const }
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { auxiliaryParts: [{ opacity: 100, part: orb }] } },
        { atMs: 1000, patch: { auxiliaryParts: [{ opacity: 100, part: orb }] } }
      ],
      parameters: [{
        binding: { partId: 'notification-orb', type: 'auxiliary-part-material' },
        default: '#3b82f6', id: 'orbColor', label: 'Orb color', type: 'color'
      }],
      playback: 'loop',
      resourceClaims: ['aux:notification-orb']
    }
    const before = JSON.stringify(clip)
    const defaultFrame = resolveAvatarAnimationTracks(definition, [{
      clip, elapsedMs: 200, trackId: 'notification', weight: .5
    }])
    expect(defaultFrame.auxiliaryParts?.[0]).toMatchObject({
      opacity: 50,
      part: { baseColor: '#3b82f6', id: 'notification/notification-orb' }
    })
    expect(defaultFrame.writes).toEqual(['aux:notification/notification-orb'])
    expect(defaultFrame.trackWrites).toEqual({ notification: ['aux:notification/notification-orb'] })
    expect(defaultFrame.trackResourceWeights).toEqual({
      notification: { 'aux:notification/notification-orb': .5 }
    })
    const custom = resolveAvatarAnimationTracks(definition, [{
      clip,
      elapsedMs: 200,
      parameterValues: { orbColor: '#ff3366' },
      trackId: 'notice-2'
    }])
    expect(custom.auxiliaryParts?.[0]?.part).toMatchObject({
      baseColor: '#ff3366',
      id: 'notice-2/notification-orb'
    })
    expect(JSON.stringify(clip)).toBe(before)
    expect(resolveAvatarAnimationTracks(definition, [{
      clip, elapsedMs: 200, muted: true, trackId: 'notification'
    }]).auxiliaryParts).toBeUndefined()
    expect(() => resolveAvatarAnimationParameterValues(clip, { orbColor: 'red' })).toThrow()
  })

  it('keeps auxiliary resource namespaces unambiguous for arbitrary valid track and part ids', () => {
    const definition = createDefaultAvatarDefinition()
    const createAuxClip = (partId: string): AvatarAnimationClip => ({
      anchor: 'absolute',
      durationMs: 1100,
      keyframes: [0, 1000].map(atMs => ({
        atMs,
        patch: {
          auxiliaryParts: [{
            opacity: 100,
            part: {
              baseColor: '#3b82f6', face: false, foregroundColor: '#173f99',
              highlightColor: '#8bb6ff', id: partId, label: partId, scaleX: .2,
              scaleY: .2, scaleZ: .2, shadowColor: '#2457b8', shape: 'sphere' as const,
              x: 0, y: 0, z: 0
            }
          }]
        }
      })),
      playback: 'loop'
    })
    expect(parseAvatarAnimationClip(createAuxClip('b/c'))).toEqual(createAuxClip('b/c'))
    const frame = resolveAvatarAnimationTracks(definition, [
      { clip: createAuxClip('c'), elapsedMs: 100, trackId: 'a/b' },
      { clip: createAuxClip('b/c'), elapsedMs: 100, trackId: 'a' }
    ])

    expect(frame.auxiliaryParts?.map(item => item.part.id)).toEqual(['a%2Fb/c', 'a/b%2Fc'])
    expect(new Set(frame.auxiliaryParts?.map(item => item.part.id)).size).toBe(2)
    expect(frame.trackWrites).toEqual({
      a: ['aux:a/b%2Fc'],
      'a/b': ['aux:a%2Fb/c']
    })
    expect(frame.writes).toEqual(['aux:a%2Fb/c', 'aux:a/b%2Fc'])

    const prototypeNamed = resolveAvatarAnimationTracks(definition, [{
      clip: createAuxClip('notification-orb'), elapsedMs: 100, trackId: '__proto__'
    }])
    expect(prototypeNamed.auxiliaryParts?.[0]?.part.id).toBe('__proto__/notification-orb')
    expect(Object.hasOwn(prototypeNamed.trackWrites!, '__proto__')).toBe(true)
    expect(prototypeNamed.trackWrites?.__proto__).toEqual(['aux:__proto__/notification-orb'])
    expect(Object.hasOwn(prototypeNamed.trackResourceWeights!, '__proto__')).toBe(true)
    expect(prototypeNamed.trackResourceWeights?.__proto__).toEqual({
      'aux:__proto__/notification-orb': 1
    })
  })

  it('applies solo filtering and rejects invalid animation track stacks', () => {
    const definition = createDefaultAvatarDefinition()
    const clip = (yaw: number): AvatarAnimationClip => ({
      anchor: 'absolute', durationMs: 1000, playback: 'loop', resourceClaims: ['view:yaw'],
      keyframes: [
        { atMs: 0, patch: { view: { yaw } } },
        { atMs: 1000, patch: { view: { yaw } } }
      ]
    })
    const solo = resolveAvatarAnimationTracks(definition, [
      { clip: clip(.1), elapsedMs: 0, trackId: 'bottom' },
      { clip: clip(.2), elapsedMs: 0, solo: true, trackId: 'solo-low' },
      { clip: clip(.3), elapsedMs: 0, muted: true, solo: true, trackId: 'solo-muted' },
      { clip: clip(.4), elapsedMs: 0, solo: true, trackId: 'solo-high' }
    ])
    expect(solo.scene.view.yaw).toBe(.4)
    expect(() => resolveAvatarAnimationTracks(definition, [
      { clip: clip(.1), elapsedMs: 0, trackId: 'duplicate' },
      { clip: clip(.2), elapsedMs: 0, trackId: 'duplicate' }
    ])).toThrow()
    expect(() => resolveAvatarAnimationTracks(definition, [
      { clip: clip(.1), elapsedMs: 0, trackId: 'bad', weight: Number.NaN }
    ])).toThrow()
    expect(() => resolveAvatarAnimationTracks(definition, [
      { clip: clip(.1), elapsedMs: 0, speed: Number.NaN, trackId: 'bad' }
    ])).toThrow()
    expect(() => resolveAvatarAnimationTracks(definition, Array.from({ length: 17 }, (_, index) => ({
      clip: clip(index / 100), elapsedMs: 0, trackId: `track-${index}`
    })))).toThrow(/at most 16 animation tracks/)
  })

  it('rejects resolved sparse writes outside the clip declared claim ceiling', () => {
    const definition = createDefaultAvatarDefinition()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { face: { height: 12 }, view: { yaw: .2 } } },
        { atMs: 1000, patch: { face: { height: 12 }, view: { yaw: .2 } } }
      ],
      playback: 'loop',
      resourceClaims: ['view:yaw']
    }

    expect(() => resolveAvatarAnimationTracks(definition, [
      { clip, elapsedMs: 250, trackId: 'under-declared' }
    ])).toThrow(/face:leftEye\.height, face:rightEye\.height/)
  })

  it('keeps one-track weight-one output equivalent at exact numeric and color endpoints', () => {
    const definition = createDefaultAvatarDefinition()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute', durationMs: 1000, playback: 'once',
      keyframes: [
        { atMs: 0, patch: { colorGrade: { brightness: .75 }, view: { yaw: -.2 } } },
        { atMs: 1000, patch: { colorGrade: { brightness: 1.25 }, view: { yaw: .4 } } }
      ]
    }
    for (const elapsedMs of [0, 500, 1000]) {
      const single = resolveAvatarAnimationFrame(definition, clip, elapsedMs)
      const stacked = resolveAvatarAnimationTracks(definition, [{ clip, elapsedMs, trackId: 'legacy' }])
      expect(stacked.scene).toEqual(single.scene)
      expect(stacked.partTransforms).toEqual(single.partTransforms)
    }
  })

  it('canonicalizes shared eye aliases before per-eye overrides regardless of object insertion order', () => {
    const definition = createDefaultAvatarDefinition()
    const clip = (face: AvatarAnimationClip['keyframes'][number]['patch']['face']): AvatarAnimationClip => ({
      anchor: 'absolute',
      durationMs: 100,
      keyframes: [{ atMs: 0, patch: { face } }],
      playback: 'once'
    })
    const commonFirst = clip({ height: 10, leftEyeHeight: 26, width: 12, rightEyeWidth: 34 })
    const overrideFirst = clip(Object.fromEntries([
      ['rightEyeWidth', 34], ['width', 12], ['leftEyeHeight', 26], ['height', 10]
    ]))

    expect(resolveAvatarAnimationFrame(definition, overrideFirst, 0).scene.face)
      .toEqual(resolveAvatarAnimationFrame(definition, commonFirst, 0).scene.face)
    expect(resolveAvatarAnimationFrame(definition, commonFirst, 0).scene.face).toMatchObject({
      leftEyeHeight: 26,
      leftEyeWidth: 12,
      rightEyeHeight: 10,
      rightEyeWidth: 34
    })
  })

  it('rejects timeline segments the editor cannot represent losslessly', () => {
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 50,
        keyframes: [
          { atMs: 0, patch: {} },
          { atMs: 50, patch: { view: { yaw: .1 } } }
        ],
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 9000,
        keyframes: [
          { atMs: 0, patch: {} },
          { atMs: 9000, patch: { view: { yaw: .1 } } }
        ],
        playback: 'once'
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 800,
        keyframes: [
          { atMs: 0, patch: {} },
          { atMs: 800, patch: { view: { yaw: .1 } } }
        ],
        playback: 'loop'
      })
    ).toThrow(TypeError)
    expect(() =>
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 500,
        keyframes: [{ atMs: 0, patch: { view: { yaw: .1 } } }],
        playback: 'loop'
      })
    ).toThrow(TypeError)
    expect(
      parseAvatarAnimationClip({
        anchor: 'absolute',
        durationMs: 900,
        keyframes: [
          { atMs: 0, patch: {} },
          { atMs: 300, patch: { view: { yaw: .1 } } }
        ],
        playback: 'loop'
      }).durationMs
    ).toBe(900)
  })
})
