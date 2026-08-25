import {
  AVATAR_COAT_PATTERN_RANGES,
  createDefaultAvatarDefinition,
  getAvatarPalette,
  isAvatarDefinition,
  resolveAvatarCoatPatternDecals
} from '@oneworks/avatar'
import { describe, expect, it } from 'vitest'

import {
  AVATAR_CAT_BREED_TEMPLATES,
  AVATAR_DOG_BREED_CONTROLLED_FIELDS,
  AVATAR_DOG_BREED_TEMPLATES,
  getAvatarCatBreedTemplate,
  getAvatarDogBreedTemplate,
  resolveAvatarCatBreedTemplate,
  resolveAvatarDogBreedTemplate
} from '../src/avatarBreedTemplates'
import {
  applyDogEarScale,
  applyDogEarStyle,
  applyDogHeadScale,
  createAvatarEntityParts,
  getDogEarScale,
  getDogHeadScale
} from '../src/avatarEntityPresets'

describe('cat type Seed constraint profiles', () => {
  it('defines the built-in cat types as constrained Cat looks', () => {
    expect(AVATAR_CAT_BREED_TEMPLATES.map(template => template.id)).toEqual([
      'siamese',
      'british-shorthair',
      'russian-blue',
      'orange-tabby',
      'cow-cat',
      'black-cat'
    ])

    for (const template of AVATAR_CAT_BREED_TEMPLATES) {
      const resolved = resolveAvatarCatBreedTemplate(template, 'v1-breed-contract')
      const head = resolved.entityParts.find(part => part.id === 'cat-head')
      expect(resolved.paletteId).toBe(template.fixed.paletteId)
      expect(resolved.entityParts).toHaveLength(3)
      expect(head?.baseColor).toBe(getAvatarPalette(template.fixed.paletteId).background)
      expect(head?.scaleX).toBe(.73)
      expect(head?.scaleY).toBe(.68)
    }
    expect(getAvatarCatBreedTemplate('siamese')?.previewBackground).toBeUndefined()
    expect(getAvatarCatBreedTemplate('orange-tabby')?.previewBackground).toBeUndefined()
    expect(getAvatarCatBreedTemplate('cow-cat')?.previewBackground).toBe('#f5f1e7')
    expect(getAvatarCatBreedTemplate('black-cat')?.previewBackground).toBe('#eef2f5')
  })

  it('keeps the Siamese center, palette, ears, and shape fixed while Seed changes only mask size', () => {
    const template = getAvatarCatBreedTemplate('siamese')!
    const first = resolveAvatarCatBreedTemplate(template, 'v1-siamese-a')
    const second = resolveAvatarCatBreedTemplate(template, 'v1-siamese-b')

    expect(first.paletteId).toBe('siamese')
    expect(second.paletteId).toBe('siamese')
    expect(first.catEarWidth).toBe(second.catEarWidth)
    expect(first.catEarHeight).toBe(second.catEarHeight)
    expect(first.coatPattern.lightPatchOffsetY).toBe(-44)
    expect(second.coatPattern.lightPatchOffsetY).toBe(-44)
    expect(first.coatPattern.lightPatchShape).toBe('ellipse')
    expect(second.coatPattern.lightPatchShape).toBe('ellipse')
    expect(first.coatPattern.lightPatchWidth).toBeGreaterThanOrEqual(126)
    expect(first.coatPattern.lightPatchWidth).toBeLessThanOrEqual(160)
    expect(first.coatPattern.lightPatchLength).toBeGreaterThanOrEqual(60)
    expect(first.coatPattern.lightPatchLength).toBeLessThanOrEqual(72)
    expect(template.seedDomain.ranges?.['scene.appearance.coatPattern.lightPatchLength']).toEqual({
      max: 72,
      min: AVATAR_COAT_PATTERN_RANGES.lightPatchLength.min
    })
    expect({
      ...first.coatPattern,
      lightPatchLength: second.coatPattern.lightPatchLength,
      lightPatchWidth: second.coatPattern.lightPatchWidth
    }).toEqual(second.coatPattern)
  })

  it('keeps every generated cat type inside its declared palette and numeric domains', () => {
    for (const template of AVATAR_CAT_BREED_TEMPLATES) {
      for (let index = 0; index < 50; index += 1) {
        const resolved = resolveAvatarCatBreedTemplate(template, `v1-${template.id}-${index}`)
        expect(template.seedDomain.paletteIds).toContain(resolved.paletteId)
        for (const field of template.followByDefault) {
          const range = template.seedDomain.ranges?.[field]
          if (range == null) continue
          if (field.endsWith('catEarWidth')) {
            expect(resolved.catEarWidth).toBeGreaterThanOrEqual(range.min)
            expect(resolved.catEarWidth).toBeLessThanOrEqual(range.max)
            continue
          }
          if (field.endsWith('catEarHeight')) {
            expect(resolved.catEarHeight).toBeGreaterThanOrEqual(range.min)
            expect(resolved.catEarHeight).toBeLessThanOrEqual(range.max)
            continue
          }
          const key = field.split('.').at(-1) as keyof typeof resolved.coatPattern
          const value = resolved.coatPattern[key]
          expect(typeof value).toBe('number')
          expect(value).toBeGreaterThanOrEqual(range.min)
          expect(value).toBeLessThanOrEqual(range.max)
        }
      }
    }
  })

  it('keeps British gold and Russian Blue solid-coat profiles visually distinct', () => {
    const british = resolveAvatarCatBreedTemplate(getAvatarCatBreedTemplate('british-shorthair')!, 'v1-british')
    const russian = resolveAvatarCatBreedTemplate(getAvatarCatBreedTemplate('russian-blue')!, 'v1-russian')

    expect(british.entityParts.find(part => part.id === 'cat-head')?.baseColor).toBe('#b89a6b')
    expect(british.coatPattern.enabled).toBe(true)
    expect(russian.entityParts.find(part => part.id === 'cat-head')?.baseColor).toBe('#718493')
    expect(russian.coatPattern.enabled).toBe(false)
    expect(russian.catEarWidth).toBeGreaterThanOrEqual(98)
    expect(russian.catEarWidth).toBeLessThanOrEqual(112)
    expect(russian.catEarHeight).toBeGreaterThanOrEqual(106)
    expect(russian.catEarHeight).toBeLessThanOrEqual(122)
  })

  it('keeps Cow Cat black and white while Seed changes only its centered face patch size', () => {
    const template = getAvatarCatBreedTemplate('cow-cat')!
    const first = resolveAvatarCatBreedTemplate(template, 'v1-cow-a')
    const second = resolveAvatarCatBreedTemplate(template, 'v1-cow-b')
    const palette = getAvatarPalette('cow-cat')

    expect(first.paletteId).toBe('cow-cat')
    expect(first.coatPattern).toMatchObject({
      density: 0,
      enabled: true,
      lightPatchOffsetY: 0,
      lightPatchShape: 'face-mask'
    })
    expect(first.entityParts.find(part => part.id === 'cat-head')?.baseColor).toBe('#171b22')
    expect(first.entityParts.find(part => part.id === 'cat-head')?.foregroundColor).toBe('#c58b35')
    expect(first.entityParts.find(part => part.id === 'cat-ear-left')?.baseColor).toBe('#171b22')
    expect(palette.coat?.patch).toBe('#fffdf7')
    expect(palette.foreground).toBe('#c58b35')
    expect(first.coatPattern.lightPatchLength).toBeGreaterThanOrEqual(112)
    expect(first.coatPattern.lightPatchLength).toBeLessThanOrEqual(132)
    expect(first.coatPattern.lightPatchWidth).toBeGreaterThanOrEqual(112)
    expect(first.coatPattern.lightPatchWidth).toBeLessThanOrEqual(132)
    expect(first.catEarWidth).toBe(second.catEarWidth)
    expect(first.catEarHeight).toBe(second.catEarHeight)
    expect({ ...first.coatPattern, lightPatchLength: second.coatPattern.lightPatchLength, lightPatchWidth: second.coatPattern.lightPatchWidth })
      .toEqual(second.coatPattern)
  })

  it('keeps Black Cat near-black and coat-free while only ear scale follows Seed', () => {
    const template = getAvatarCatBreedTemplate('black-cat')!
    const first = resolveAvatarCatBreedTemplate(template, 'v1-black-a')
    const second = resolveAvatarCatBreedTemplate(template, 'v1-black-b')
    const palette = getAvatarPalette('black-cat')

    expect(first.paletteId).toBe('black-cat')
    expect(first.coatPattern.enabled).toBe(false)
    expect(first.coatPattern.lightPatchOffsetY).toBe(0)
    expect(first.entityParts.find(part => part.id === 'cat-head')).toMatchObject({
      baseColor: '#111419',
      highlightColor: '#303844',
      shadowColor: '#05070a'
    })
    expect(palette.foreground).toBe('#eef2f5')
    expect(first.catEarWidth).toBeGreaterThanOrEqual(96)
    expect(first.catEarWidth).toBeLessThanOrEqual(108)
    expect(first.catEarHeight).toBeGreaterThanOrEqual(100)
    expect(first.catEarHeight).toBeLessThanOrEqual(112)
    expect(first.coatPattern).toEqual(second.coatPattern)
  })
})

describe('dog type Seed constraint profiles', () => {
  it('defines six natural dog profiles with genuinely distinct head and ear silhouettes', () => {
    expect(AVATAR_DOG_BREED_TEMPLATES.map(template => template.id)).toEqual([
      'shiba-inu', 'husky', 'corgi', 'golden-retriever', 'border-collie', 'dalmatian'
    ])
    expect(new Set(AVATAR_DOG_BREED_TEMPLATES.map(template => template.earStyle))).toEqual(
      new Set(['upright', 'floppy', 'half-drop'])
    )
    const headSilhouettes = new Set<string>()
    for (const template of AVATAR_DOG_BREED_TEMPLATES) {
      const resolved = resolveAvatarDogBreedTemplate(template, 'v1-dog-profile')
      expect(resolved.paletteId).toBe(template.fixed.paletteId)
      expect(resolved.entityParts).toHaveLength(3)
      expect(resolved.entityParts.find(part => part.face)?.id).toBe('primary')
      const head = resolved.entityParts.find(part => part.face)!
      expect(getDogHeadScale(resolved.entityParts)).toEqual({
        height: resolved.dogHeadHeight,
        width: resolved.dogHeadWidth
      })
      headSilhouettes.add(`${head.scaleX}:${head.scaleY}`)
      expect(resolved.entityParts.filter(part => !part.face).every(part => (
        template.earStyle === 'upright' ? part.shape === 'cone' : part.shape === 'teardrop'
      ))).toBe(true)

      const neutralEars = applyDogEarStyle(createAvatarEntityParts('dog'), template.earStyle)
      for (const ear of resolved.entityParts.filter(part => !part.face)) {
        const neutralEar = neutralEars.find(part => part.id === ear.id)!
        expect(ear.x).toBeCloseTo(neutralEar.x * resolved.dogHeadWidth / 100)
        expect(ear.y).toBeCloseTo(15 + (neutralEar.y - 15) * resolved.dogHeadHeight / 100)
      }
    }
    expect(headSilhouettes.size).toBeGreaterThanOrEqual(5)
    const corgi = resolveAvatarDogBreedTemplate(getAvatarDogBreedTemplate('corgi')!, 'v1-dog-profile')
    const collie = resolveAvatarDogBreedTemplate(getAvatarDogBreedTemplate('border-collie')!, 'v1-dog-profile')
    expect(corgi.dogHeadWidth).toBeGreaterThan(collie.dogHeadWidth)
    expect(corgi.dogHeadHeight).toBeLessThan(collie.dogHeadHeight)
  })

  it('constrains dog Seeds to the declared natural palette, ear, and head ranges', () => {
    for (const template of AVATAR_DOG_BREED_TEMPLATES) {
      for (let index = 0; index < 20; index += 1) {
        const resolved = resolveAvatarDogBreedTemplate(template, `v1-${template.id}-${index}`)
        expect(template.seedDomain.paletteIds).toContain(resolved.paletteId)
        for (const [field, range] of Object.entries(template.seedDomain.ranges ?? {})) {
          if (field === 'scene.entity.dogEarWidth') {
            expect(resolved.dogEarWidth).toBeGreaterThanOrEqual(range.min)
            expect(resolved.dogEarWidth).toBeLessThanOrEqual(range.max)
          }
          if (field === 'scene.entity.dogEarHeight') {
            expect(resolved.dogEarHeight).toBeGreaterThanOrEqual(range.min)
            expect(resolved.dogEarHeight).toBeLessThanOrEqual(range.max)
          }
          if (field === 'scene.entity.dogHeadWidth') {
            expect(resolved.dogHeadWidth).toBeGreaterThanOrEqual(range.min)
            expect(resolved.dogHeadWidth).toBeLessThanOrEqual(range.max)
          }
          if (field === 'scene.entity.dogHeadHeight') {
            expect(resolved.dogHeadHeight).toBeGreaterThanOrEqual(range.min)
            expect(resolved.dogHeadHeight).toBeLessThanOrEqual(range.max)
          }
        }
      }
    }
  })

  it('uses all coat bindings as breed-controlled fields so a prior profile cannot leak through', () => {
    expect(AVATAR_DOG_BREED_CONTROLLED_FIELDS).toEqual(expect.arrayContaining([
      'scene.appearance.paletteId',
      'scene.entity.dogEarWidth',
      'scene.entity.dogEarHeight',
      'scene.entity.dogHeadWidth',
      'scene.entity.dogHeadHeight',
      'scene.appearance.coatPattern.algorithm',
      'scene.appearance.coatPattern.seed',
      'scene.appearance.coatPattern.jitter',
      'scene.appearance.coatPattern.lightPatchOffsetY',
      'scene.appearance.coatPattern.lightPatchShape',
      'scene.appearance.coatPattern.thickness',
      'scene.appearance.coatPattern.symmetry',
      'scene.appearance.coatPattern.contrast',
      'scene.appearance.coatPattern.breakup'
    ]))
  })

  it('projects distinct, repeatable Dalmatian spots across the head and both ears without covering its eyes', () => {
    const dalmatian = resolveAvatarDogBreedTemplate(getAvatarDogBreedTemplate('dalmatian')!, 'v1-dalmatian-spots')
    const replay = resolveAvatarCoatPatternDecals({ entityParts: dalmatian.entityParts, entityPreset: 'dog', paletteId: dalmatian.paletteId, pattern: dalmatian.coatPattern })
    const repeated = resolveAvatarCoatPatternDecals({ entityParts: dalmatian.entityParts, entityPreset: 'dog', paletteId: dalmatian.paletteId, pattern: dalmatian.coatPattern })
    const changed = resolveAvatarCoatPatternDecals({ entityParts: dalmatian.entityParts, entityPreset: 'dog', paletteId: dalmatian.paletteId, pattern: { ...dalmatian.coatPattern, seed: 'v1-dalmatian-other' } })

    expect(replay.length).toBeGreaterThanOrEqual(18)
    expect(replay).toEqual(repeated)
    expect(replay).not.toEqual(changed)
    expect(new Set(replay.map(decal => decal.targetPartId))).toEqual(
      new Set(['primary', 'ear-left', 'ear-right'])
    )
    expect(new Set(replay.filter(decal => decal.targetPartId === 'primary').map(decal => decal.side))).toEqual(
      new Set(['front', 'left', 'right', 'back'])
    )
    expect(replay.every(decal => decal.color !== getAvatarPalette('dalmatian').foreground)).toBe(true)
    expect(replay.filter(decal => decal.targetPartId === 'primary' && decal.side === 'front').every(decal => (
      Math.abs(decal.x) >= 64 + decal.width / 2 ||
      decal.y <= -24 - decal.height / 2 ||
      decal.y >= 60 + decal.height / 2
    ))).toBe(true)

    const definition = createDefaultAvatarDefinition()
    expect(isAvatarDefinition({
      ...definition,
      scene: {
        ...definition.scene,
        appearance: { ...definition.scene.appearance, coatPattern: dalmatian.coatPattern, paletteId: dalmatian.paletteId },
        decals: replay,
        entity: { parts: dalmatian.entityParts, preset: 'dog' }
      }
    })).toBe(true)
  })

  it('keeps the Husky mask on its lower face without adding a disconnected forehead cap', () => {
    const husky = resolveAvatarDogBreedTemplate(getAvatarDogBreedTemplate('husky')!, 'v1-husky')
    const mask = resolveAvatarCoatPatternDecals({ entityParts: husky.entityParts, entityPreset: 'dog', paletteId: husky.paletteId, pattern: husky.coatPattern })
    const raisedMask = resolveAvatarCoatPatternDecals({
      entityParts: husky.entityParts,
      entityPreset: 'dog',
      paletteId: husky.paletteId,
      pattern: { ...husky.coatPattern, lightPatchOffsetY: -24 }
    })

    expect(mask).toEqual([
      expect.objectContaining({ id: 'coat-dog-mask-mask', side: 'face', targetPartId: 'primary', y: 40 })
    ])
    expect(mask[0]!.y - mask[0]!.height / 2).toBeGreaterThan(-50)
    expect(raisedMask.map(decal => decal.y)).toEqual(mask.map(decal => decal.y - 24))
  })

  it('keeps Border Collie eyes and nose distinct from its pale facial blaze', () => {
    const collie = resolveAvatarDogBreedTemplate(getAvatarDogBreedTemplate('border-collie')!, 'v1-collie-face')
    const palette = getAvatarPalette(collie.paletteId)
    const markings = resolveAvatarCoatPatternDecals({
      entityParts: collie.entityParts,
      entityPreset: 'dog',
      paletteId: collie.paletteId,
      pattern: collie.coatPattern
    })

    expect(palette.foreground).toBe('#b77a38')
    expect(collie.entityParts.find(part => part.face)?.foregroundColor).toBe(palette.foreground)
    expect(markings.map(marking => marking.color)).toEqual([palette.coat?.patch, palette.coat?.patch])
    expect(markings.every(marking => marking.color !== palette.foreground)).toBe(true)
    expect(markings.every(marking => marking.opacity === 100)).toBe(true)
  })

  it('merges same-color Corgi nose blazes and muzzles without a translucent overlap seam', () => {
    const corgi = resolveAvatarDogBreedTemplate(getAvatarDogBreedTemplate('corgi')!, 'v1-corgi-seam')
    const markings = resolveAvatarCoatPatternDecals({
      entityParts: corgi.entityParts,
      entityPreset: 'dog',
      paletteId: corgi.paletteId,
      pattern: corgi.coatPattern
    })

    expect(markings).toHaveLength(2)
    expect(new Set(markings.map(marking => marking.color))).toEqual(
      new Set([getAvatarPalette(corgi.paletteId).coat?.patch])
    )
    expect(markings.every(marking => marking.opacity === 100)).toBe(true)
  })

  it('scales only dog ears from their own neutral geometry', () => {
    const base = createAvatarEntityParts('dog')
    const scaled = applyDogEarScale(base, 120, 80)
    expect(getDogEarScale(scaled)).toEqual({ height: 80, width: 120 })
    expect(scaled.find(part => part.face)).toEqual(base.find(part => part.face))
  })

  it('moves both Dog ears with the head perimeter while scaling their true three-dimensional head', () => {
    const base = createAvatarEntityParts('dog')
    const scaled = applyDogHeadScale(base, 124, 86)

    expect(getDogHeadScale(scaled)).toEqual({ height: 86, width: 124 })
    expect(scaled.find(part => part.face)?.scaleX).toBeCloseTo(.72 * 1.24)
    expect(scaled.find(part => part.face)?.scaleY).toBeCloseTo(.8 * .86)
    expect(scaled.find(part => part.id === 'ear-left')).toMatchObject({
      scaleX: .18,
      scaleY: .34,
      x: -72 * 1.24,
      y: 15 - 67 * .86
    })
    expect(scaled.find(part => part.id === 'ear-right')).toMatchObject({
      scaleX: .18,
      scaleY: .34,
      x: 72 * 1.24,
      y: 15 - 67 * .86
    })

    const resized = applyDogHeadScale(scaled, 92)
    expect(getDogHeadScale(resized)).toEqual({ height: 86, width: 92 })
    expect(resized.find(part => part.id === 'ear-left')?.x).toBeCloseTo(-72 * .92)
    expect(resized.find(part => part.id === 'ear-left')?.y).toBeCloseTo(15 - 67 * .86)
    expect(applyDogHeadScale(resized, 92, 86)).toEqual(resized)
  })

  it('repairs legacy broad heads whose narrow Dog ears still use unscaled attachment coordinates', () => {
    const legacy = applyDogEarScale(createAvatarEntityParts('dog'), 61, 131).map(part => (
      part.face ? { ...part, scaleX: .72 * 1.15, scaleY: .8 * 1.38 } : part
    ))
    const repaired = applyDogHeadScale(legacy, 115, 138)
    const leftEar = repaired.find(part => part.id === 'ear-left')!

    expect(leftEar.scaleX).toBeCloseTo(.18 * .61)
    expect(leftEar.scaleY).toBeCloseTo(.34 * 1.31)
    expect(leftEar.x).toBeCloseTo(-72 * 1.15)
    expect(leftEar.y).toBeCloseTo(15 - 67 * 1.38)
    expect(repaired.find(part => part.id === 'ear-right')?.x).toBeCloseTo(72 * 1.15)
    expect(applyDogHeadScale(repaired, 115, 138)).toEqual(repaired)
  })

  it('keeps manually positioned Dog ears proportional when the head is resized again', () => {
    const scaled = applyDogHeadScale(createAvatarEntityParts('dog'), 120, 110)
    const positioned = scaled.map(part => part.id === 'ear-left'
      ? { ...part, x: -108, y: -73 }
      : part)
    const resized = applyDogHeadScale(positioned, 135, 130)

    expect(resized.find(part => part.id === 'ear-left')?.x).toBeCloseTo(-108 / 1.2 * 1.35)
    expect(resized.find(part => part.id === 'ear-left')?.y).toBeCloseTo(15 + (-73 - 15) / 1.1 * 1.3)
  })
})
