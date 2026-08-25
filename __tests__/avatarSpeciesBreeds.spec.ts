import { getAvatarPalette, resolveAvatarCoatPatternDecals } from '@oneworks/avatar'
import { describe, expect, it } from 'vitest'

import {
  AVATAR_ANIMAL_SPECIES_IDS,
  AVATAR_ANIMAL_SPECIES_SEED_FIELDS,
  AVATAR_SEED_FIELD,
  getAvatarSeedFieldEntityPreset,
  resolveSeededAvatarPaletteTone
} from '../src/avatarSeed'
import {
  applyAvatarBreedMarkingTone,
  resolveAvatarBreedPalette
} from '../src/avatarBreedTone'
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

const perceivedLightness = (color: string): number => (
  (
    Number.parseInt(color.slice(1, 3), 16) * .2126 +
    Number.parseInt(color.slice(3, 5), 16) * .7152 +
    Number.parseInt(color.slice(5, 7), 16) * .0722
  ) / 255
)

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
      const distinctFurTones = new Set<string>()
      for (let index = 0; index < 24; index += 1) {
        const seed = `v1-${template.id}-${index}`
        const resolved = resolveAvatarAnimalBreedTemplate(template, seed)
        expect(resolveAvatarAnimalBreedTemplate(template, seed)).toEqual(resolved)
        expect(resolved.paletteId).toBe(template.fixed.paletteId)
        expect(template.seedDomain.paletteIds).toEqual([template.fixed.paletteId])
        expect(template.seedDomain.toneJitter).toEqual(template.toneJitter)
        expect(template.followByDefault).toContain(AVATAR_SEED_FIELD.palette)
        expect(resolved.faceStyle.eyeShape).toBe('rounded')
        expect(resolved.faceStyle.mouthEnabled).toBe(false)

        const head = resolved.entityParts.find(part => part.face)
        const palette = resolveAvatarBreedPalette(template.fixed.paletteId, seed, template.seedDomain)
        expect(head?.baseColor).toBe(palette.background)
        distinctFurTones.add(head!.baseColor)
        const tone = resolveSeededAvatarPaletteTone(seed, template.fixed.paletteId, template.seedDomain)
        expect(tone).toBeGreaterThanOrEqual(template.toneJitter.min)
        expect(tone).toBeLessThanOrEqual(template.toneJitter.max)

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
      expect(distinctFurTones.size, `${template.id} should have multiple natural fur tones`).toBeGreaterThan(3)
    }
  })

  it('preserves readable adjacent facial layers at both ends of every breed-specific fur range', () => {
    const failures: string[] = []
    for (const template of AVATAR_ANIMAL_BREED_TEMPLATES) {
      for (const requestedTone of [template.toneJitter.min, template.toneJitter.max]) {
        const seed = Array.from({ length: 600 }, (_, index) => `v1-${template.id}-contrast-${index}`)
          .find(candidate => (
            resolveSeededAvatarPaletteTone(candidate, template.fixed.paletteId, template.seedDomain) === requestedTone
          ))
        expect(seed, `${template.id} should reach authored tone ${requestedTone}`).toBeDefined()

        const resolved = resolveAvatarAnimalBreedTemplate(template, seed!)
        const head = resolved.entityParts.find(part => part.face)!
        const layers = (resolved.surfaceDecals ?? []).map(decal => ({
          color: decal.color,
          id: decal.id,
          parent: resolved.entityParts.find(part => part.id === decal.targetPartId)?.baseColor ?? head.baseColor
        }))

        for (const part of resolved.entityParts) {
          if (part.id.startsWith('cheek-') || part.id === 'muzzle' || part.id === 'snout') {
            layers.push({ color: part.baseColor, id: part.id, parent: head.baseColor })
          }
          if (part.id.startsWith('nostril-')) {
            const snout = resolved.entityParts.find(candidate => candidate.id === 'snout')!
            layers.push({ color: part.baseColor, id: part.id, parent: snout.baseColor })
          }
        }

        for (const layer of layers) {
          const contrast = Math.abs(perceivedLightness(layer.color) - perceivedLightness(layer.parent))
          if (contrast <= .045) {
            failures.push(`${template.id} ${layer.id} at tone ${requestedTone}: ${contrast.toFixed(3)}`)
          }
        }

        const eyeBackdrop = template.id === 'black-faced-sheep'
          ? resolved.surfaceDecals?.find(decal => decal.id === 'sheep-face-mask')?.color ?? head.baseColor
          : head.baseColor
        const eyeContrast = Math.abs(perceivedLightness(head.foregroundColor) - perceivedLightness(eyeBackdrop))
        if (eyeContrast <= .14) failures.push(`${template.id} eyes at tone ${requestedTone}: ${eyeContrast.toFixed(3)}`)
      }
    }
    expect(failures).toEqual([])
  })

  it('keeps ears and genuine anatomical geometry attached across head-size boundaries', () => {
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
    const redTemplate = getAvatarAnimalBreedTemplate('fox', 'red-fox')!
    const red = resolveAvatarAnimalBreedTemplate(redTemplate, 'v1-red-fox')
    const arctic = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate('fox', 'arctic-fox')!, 'v1-arctic-fox')
    const silver = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate('fox', 'silver-fox')!, 'v1-silver-fox')
    const fennec = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate('fox', 'fennec-fox')!, 'v1-fennec-fox')

    const redTone = resolveSeededAvatarPaletteTone('v1-red-fox', 'red-fox', redTemplate.seedDomain)
    expect(red.surfaceDecals).toEqual(createFoxSurfaceDecals().map(decal => ({
      ...decal,
      color: applyAvatarBreedMarkingTone(decal.color, redTone * (decal.id.includes('inner-ear') ? .45 : .35))
    })))
    const originalToneSeed = Array.from({ length: 200 }, (_, index) => `v1-red-fox-neutral-${index}`)
      .find(seed => resolveSeededAvatarPaletteTone(seed, 'red-fox', redTemplate.seedDomain) === 0)
    expect(originalToneSeed).toBeDefined()
    expect(resolveAvatarAnimalBreedTemplate(redTemplate, originalToneSeed!).surfaceDecals)
      .toEqual(createFoxSurfaceDecals())
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

  it('preserves true species-specific cheeks, the projecting capybara muzzle, and pig snouts', () => {
    for (const species of ['hamster', 'capybara', 'otter', 'pig'] as const) {
      const resolved = resolveAvatarAnimalBreedTemplate(
        getAvatarAnimalBreedTemplates(species)[0]!,
        `v1-${species}-features`
      )
      if (species === 'hamster') {
        expect(resolved.entityParts.some(part => part.id === 'cheek-left')).toBe(true)
        expect(resolved.entityParts.some(part => part.id === 'cheek-right')).toBe(true)
      }
      if (species === 'capybara') {
        const muzzle = resolved.entityParts.find(part => part.id === 'muzzle')
        expect(muzzle?.shape).toBe('capsule')
        expect(muzzle?.scaleZ).toBeGreaterThan(.2)
      }
      if (species === 'otter') {
        expect(resolved.entityParts.some(part => part.id === 'muzzle')).toBe(false)
      }
      if (species === 'pig') {
        expect(resolved.entityParts.some(part => part.id === 'snout')).toBe(true)
        expect(resolved.entityParts.some(part => part.id === 'nostril-left')).toBe(true)
        expect(resolved.entityParts.some(part => part.id === 'nostril-right')).toBe(true)
        expect(resolved.faceStyle.noseEnabled).toBe(false)
      }
    }
  })

  it.each([
    ['otter', ['sea-otter', 'river-otter', 'asian-small-clawed-otter']],
    ['deer', ['sika-deer', 'reindeer', 'white-deer', 'deer-fawn']]
  ] as const)('keeps every %s breed muzzle color on the real head surface', (species, ids) => {
    for (const id of ids) {
      const resolved = resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate(species, id)!, `v1-${id}`)
      const marking = resolved.surfaceDecals?.find(decal => decal.id === `${species}-face-mask`)
      const template = getAvatarAnimalBreedTemplate(species, id)!
      const palette = resolveAvatarBreedPalette(id, `v1-${id}`, template.seedDomain)

      expect(resolved.entityParts.some(part => part.id === 'muzzle')).toBe(false)
      expect(marking).toMatchObject({
        color: palette.coat?.patch,
        opacity: 100,
        side: 'face',
        targetPartId: 'primary'
      })
      expect(palette.foreground.toLowerCase()).not.toBe(marking?.color)
      expect(resolveAvatarAnimalBreedTemplate(getAvatarAnimalBreedTemplate(species, id)!, `v1-${id}`).surfaceDecals)
        .toEqual(resolved.surfaceDecals)
    }
  })

  it('keeps every sheep face marking directly on the real head instead of adding a second 3D muzzle', () => {
    const expected = {
      'black-faced-sheep': { color: '#39353a', shape: 'face-mask' },
      'horned-ram': { color: '#b6a38a', shape: 'face-mask' },
      lamb: { color: '#e7d0ca', shape: 'rounded' },
      'mountain-goat': { color: '#c4b5a5', shape: 'rounded-triangle' },
      'white-sheep': { color: '#d2c2aa', shape: 'ellipse' }
    } as const

    for (const template of getAvatarAnimalBreedTemplates('sheep')) {
      const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${template.id}-face-marking`)
      const marking = resolved.surfaceDecals?.find(decal => decal.id === 'sheep-face-mask')
      const identity = expected[template.id as keyof typeof expected]
      const tone = resolveSeededAvatarPaletteTone(
        `v1-${template.id}-face-marking`,
        template.fixed.paletteId,
        template.seedDomain
      )

      expect(resolved.entityParts.some(part => part.id === 'muzzle')).toBe(false)
      expect(marking).toMatchObject({
        color: template.id === 'black-faced-sheep'
          ? identity.color
          : applyAvatarBreedMarkingTone(identity.color, tone * .45),
        opacity: 100,
        shape: identity.shape,
        side: 'face',
        targetPartId: 'primary'
      })
      expect(getAvatarPalette(template.id).foreground.toLowerCase()).not.toBe(marking?.color)
      expect(resolveAvatarAnimalBreedTemplate(template, `v1-${template.id}-face-marking`).surfaceDecals)
        .toEqual(resolved.surfaceDecals)
    }
  })

  it('keeps every sheep breed genuinely three-dimensional across head-size boundaries', () => {
    for (const template of getAvatarAnimalBreedTemplates('sheep')) {
      const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${template.id}-volume`)
      for (const [width, height] of [[80, 82], [128, 128]]) {
        const parts = applyAvatarAnimalDimensions(resolved.entityParts, 'sheep', {
          headHeight: height,
          headWidth: width
        }, template.fixed.hornStyle)
        const head = parts.find(part => part.face)
        expect(head?.scaleZ).toBeGreaterThanOrEqual(Math.min(head?.scaleX ?? 0, head?.scaleY ?? 0) * .9)
        for (const part of parts.filter(part => part.id.startsWith('wool-'))) {
          expect(part.scaleZ).toBeGreaterThan(.24)
        }
        for (const part of parts.filter(part => /^horn-(left|right)$/u.test(part.id))) {
          expect(part.scaleZ).toBeGreaterThan(.17)
        }
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
