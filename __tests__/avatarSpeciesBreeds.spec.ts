import { getAvatarPalette, resolveAvatarCoatPatternDecals } from '@oneworks/avatar'
import { describe, expect, it } from 'vitest'

import {
  AVATAR_ANIMAL_SPECIES_IDS,
  AVATAR_ANIMAL_SPECIES_SEED_FIELDS,
  AVATAR_SEED_FIELD,
  getAvatarSeedFieldEntityPreset
} from '../src/avatarSeed'
import {
  createFoxSurfaceDecals,
  getFoxEarStyle,
  getFoxHeadTaper
} from '../src/avatarEntityPresets'
import {
  applyAvatarAnimalDimensions,
  AVATAR_ANIMAL_BREED_TEMPLATES,
  getAvatarAnimalBreedTemplate,
  getAvatarAnimalBreedTemplates,
  getAvatarAnimalDimensions,
  resolveAvatarAnimalBreedTemplate
} from '../src/avatarSpeciesBreeds'

describe('natural animal breed constraint profiles', () => {
  it('offers distinguishable natural breeds for every modeled species', () => {
    expect(Object.fromEntries(AVATAR_ANIMAL_SPECIES_IDS.map(species => [
      species,
      getAvatarAnimalBreedTemplates(species).length
    ]))).toEqual({
      capybara: 4,
      deer: 4,
      fox: 4,
      hamster: 4,
      otter: 3,
      pig: 4,
      sheep: 5
    })
    expect(AVATAR_ANIMAL_BREED_TEMPLATES).toHaveLength(28)

    for (const species of AVATAR_ANIMAL_SPECIES_IDS) {
      const palettes = new Set(getAvatarAnimalBreedTemplates(species).map(template => template.fixed.paletteId))
      const proportions = new Set(getAvatarAnimalBreedTemplates(species).map(template => (
        `${template.fixed.headWidth}:${template.fixed.headHeight}:${template.fixed.earWidth}:${template.fixed.earHeight}`
      )))
      expect(palettes.size).toBe(getAvatarAnimalBreedTemplates(species).length)
      expect(proportions.size).toBe(getAvatarAnimalBreedTemplates(species).length)
    }
  })

  it('keeps every breed deterministic, naturally colored, and inside its independent Seed domain', () => {
    for (const template of AVATAR_ANIMAL_BREED_TEMPLATES) {
      const fields = AVATAR_ANIMAL_SPECIES_SEED_FIELDS[template.species]
      for (let index = 0; index < 24; index += 1) {
        const seed = `v1-${template.id}-${index}`
        const resolved = resolveAvatarAnimalBreedTemplate(template, seed)
        expect(resolveAvatarAnimalBreedTemplate(template, seed)).toEqual(resolved)
        expect(resolved.paletteId).toBe(template.fixed.paletteId)
        expect(template.seedDomain.paletteIds).toEqual([template.fixed.paletteId])
        expect(resolved.faceStyle.mouthEnabled).toBe(false)

        const head = resolved.entityParts.find(part => part.face)
        expect(head?.baseColor).toBe(getAvatarPalette(template.fixed.paletteId).background)

        for (const [dimension, field] of Object.entries(fields)) {
          const value = resolved[dimension as keyof typeof fields]
          if (!template.followByDefault.includes(field)) {
            expect(value).toBe(template.fixed[dimension as keyof typeof fields])
            continue
          }
          const range = template.seedDomain.ranges?.[field]
          expect(range).toBeDefined()
          expect(value).toBeGreaterThanOrEqual(range!.min)
          expect(value).toBeLessThanOrEqual(range!.max)
          expect(getAvatarSeedFieldEntityPreset(field)).toBe(template.species)
        }

        if (resolved.hornSize != null) {
          const field = template.species === 'deer'
            ? AVATAR_SEED_FIELD.deerAntlerSize
            : AVATAR_SEED_FIELD.sheepHornSize
          const range = template.seedDomain.ranges?.[field]
          expect(resolved.hornSize).toBeGreaterThanOrEqual(range!.min)
          expect(resolved.hornSize).toBeLessThanOrEqual(range!.max)
        }
      }
    }
  })

  it('keeps ears and real muzzle geometry attached across head-size boundaries', () => {
    for (const species of AVATAR_ANIMAL_SPECIES_IDS) {
      const template = getAvatarAnimalBreedTemplates(species)[0]!
      const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${species}-attachment`)
      for (const [width, height] of [[80, 82], [128, 128]]) {
        const parts = applyAvatarAnimalDimensions(resolved.entityParts, species, {
          headHeight: height,
          headWidth: width
        }, template.fixed.hornStyle)
        const left = parts.find(part => part.id === (species === 'fox' ? 'fox-ear-left' : 'ear-left'))
        const right = parts.find(part => part.id === (species === 'fox' ? 'fox-ear-right' : 'ear-right'))
        expect(left?.x).toBeLessThan(-20)
        expect(right?.x).toBeGreaterThan(20)
        expect(getAvatarAnimalDimensions(species, parts).headWidth).toBe(width)
        expect(getAvatarAnimalDimensions(species, parts).headHeight).toBe(height)
      }
    }
  })

  it('preserves natural fox identities, distinctive anatomy, and attached cheek/inner-ear markings', () => {
    const red = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate('fox', 'red-fox')!, 'v1-red-fox')
    const arctic = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate('fox', 'arctic-fox')!, 'v1-arctic-fox')
    const silver = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate('fox', 'silver-fox')!, 'v1-silver-fox')
    const fennec = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate('fox', 'fennec-fox')!, 'v1-fennec-fox')

    expect(red.surfaceDecals).toEqual(createFoxSurfaceDecals())
    expect(getFoxEarStyle(red.entityParts)).toBe('pointed')
    expect(getFoxHeadTaper(red.entityParts)).toBe(52)
    expect(getFoxEarStyle(arctic.entityParts)).toBe('rounded')
    expect(getFoxHeadTaper(arctic.entityParts)).toBeLessThan(30)
    expect(arctic.headWidth).toBeGreaterThan(arctic.headHeight)
    expect(getFoxEarStyle(silver.entityParts)).toBe('pointed')
    expect(silver.paletteId).toBe('silver-fox')
    expect(getFoxEarStyle(fennec.entityParts)).toBe('fennec')
    expect(fennec.earHeight).toBeGreaterThanOrEqual(163)

    for (const resolved of [red, arctic, silver, fennec]) {
      expect(resolved.surfaceDecals).toHaveLength(4)
      expect(resolved.surfaceDecals?.filter(decal => decal.targetPartId === 'fox-head')).toHaveLength(2)
      expect(resolved.surfaceDecals?.filter(decal => decal.targetPartId.startsWith('fox-ear-'))).toHaveLength(2)
    }
  })

  it('preserves true species-specific cheeks, muzzles, and pig snouts', () => {
    for (const species of ['hamster', 'capybara', 'otter', 'pig'] as const) {
      const resolved = resolveAvatarAnimalBreedTemplate(
        getAvatarAnimalBreedTemplates(species)[0]!,
        `v1-${species}-features`
      )
      if (species === 'hamster') {
        expect(resolved.entityParts.some(part => part.id === 'cheek-left')).toBe(true)
        expect(resolved.entityParts.some(part => part.id === 'cheek-right')).toBe(true)
      }
      if (species === 'capybara' || species === 'otter') {
        expect(resolved.entityParts.some(part => part.id === 'muzzle')).toBe(true)
      }
      if (species === 'pig') {
        expect(resolved.entityParts.some(part => part.id === 'snout')).toBe(true)
        expect(resolved.entityParts.some(part => part.id === 'nostril-left')).toBe(true)
        expect(resolved.entityParts.some(part => part.id === 'nostril-right')).toBe(true)
        expect(resolved.faceStyle.noseEnabled).toBe(false)
      }
    }
  })

  it('binds antler and horn topology to breed identity instead of randomizing its style', () => {
    const count = (species: 'deer' | 'sheep', id: string, prefix: 'antler' | 'horn') => (
      resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate(species, id)!, 'v1-horns')
        .entityParts.filter(part => part.id.startsWith(prefix)).length
    )
    expect(count('deer', 'deer-fawn', 'antler')).toBe(0)
    expect(count('deer', 'white-deer', 'antler')).toBe(2)
    expect(count('deer', 'sika-deer', 'antler')).toBe(4)
    expect(count('deer', 'reindeer', 'antler')).toBe(8)
    expect(count('sheep', 'white-sheep', 'horn')).toBe(0)
    expect(count('sheep', 'lamb', 'horn')).toBe(0)
    expect(count('sheep', 'horned-ram', 'horn')).toBe(8)
    expect(count('sheep', 'mountain-goat', 'horn')).toBeGreaterThan(0)
  })

  it('projects pig and deer markings onto actual head and ear surfaces only', () => {
    for (const [species, id] of [['pig', 'spotted-pig'], ['deer', 'sika-deer'], ['deer', 'deer-fawn']] as const) {
      const resolved = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate(species, id)!, `v1-${id}`)
      const decals = resolveAvatarCoatPatternDecals({
        entityParts: resolved.entityParts,
        entityPreset: species,
        paletteId: resolved.paletteId,
        pattern: resolved.coatPattern
      })
      expect(decals.length).toBeGreaterThan(0)
      expect(decals.every(decal => (
        decal.targetPartId === 'primary' || decal.targetPartId === 'ear-left' || decal.targetPartId === 'ear-right'
      ))).toBe(true)
    }
  })
})
