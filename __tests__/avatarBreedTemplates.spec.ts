import { AVATAR_COAT_PATTERN_RANGES, getAvatarPalette } from '@oneworks/avatar'
import { describe, expect, it } from 'vitest'

import {
  AVATAR_CAT_BREED_TEMPLATES,
  getAvatarCatBreedTemplate,
  resolveAvatarCatBreedTemplate
} from '../src/avatarBreedTemplates'

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
