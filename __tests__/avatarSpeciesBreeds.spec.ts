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
  AVATAR_BEAR_BREED_TEMPLATES,
  AVATAR_CAT_BREED_TEMPLATES,
  AVATAR_DOG_BREED_TEMPLATES,
  AVATAR_RABBIT_BREED_TEMPLATES,
  resolveAvatarBearBreedTemplate,
  resolveAvatarCatBreedTemplate,
  resolveAvatarDogBreedTemplate,
  resolveAvatarRabbitBreedTemplate
} from '../src/avatarBreedTemplates'
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
  getAvatarAnimalHornSeedField,
  getAvatarAnimalScaleRange,
  resolveAvatarAnimalBreedTemplate
} from '../src/avatarSpeciesBreeds'

const perceivedLightness = (color: string): number => (
  (
    Number.parseInt(color.slice(1, 3), 16) * .2126 +
    Number.parseInt(color.slice(3, 5), 16) * .7152 +
    Number.parseInt(color.slice(5, 7), 16) * .0722
  ) / 255
)

const normalizedRgbDistance = (left: string, right: string): number => {
  const channel = (color: string, offset: number) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255
  return Math.hypot(
    channel(left, 1) - channel(right, 1),
    channel(left, 3) - channel(right, 3),
    channel(left, 5) - channel(right, 5)
  ) / Math.sqrt(3)
}

describe('natural animal breed constraint profiles', () => {
  it('offers distinguishable natural breeds for every modeled species', () => {
    expect(Object.fromEntries(AVATAR_ANIMAL_SPECIES_IDS.map(species => [
      species,
      getAvatarAnimalBreedTemplates(species).length
    ]))).toEqual({
      alpaca: 4,
      beaver: 4,
      capybara: 4,
      chick: 4,
      chinchilla: 4,
      cow: 4,
      deer: 4,
      duck: 4,
      ferret: 4,
      fox: 4,
      goose: 4,
      'guinea-pig': 4,
      hamster: 4,
      hedgehog: 4,
      lion: 4,
      monkey: 4,
      otter: 3,
      owl: 4,
      parrot: 4,
      penguin: 4,
      pig: 4,
      seal: 4,
      sheep: 5,
      squirrel: 4,
      tiger: 4
    })
    expect(AVATAR_ANIMAL_BREED_TEMPLATES).toHaveLength(100)

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
          const field = getAvatarAnimalHornSeedField(template.species)!
          const range = template.seedDomain.ranges?.[field]
          expect(resolved.hornSize).toBeGreaterThanOrEqual(range!.min)
          expect(resolved.hornSize).toBeLessThanOrEqual(range!.max)
        }
      }
      expect(distinctFurTones.size, `${template.id} should have multiple natural fur tones`).toBeGreaterThan(3)
    }
  })

  it('keeps all 129 existing animal breeds proportionate across repeated constrained Seeds', () => {
    const profiles = [
      ...AVATAR_ANIMAL_BREED_TEMPLATES.map(template => ({
        id: template.id,
        resolve: (seed: string) => resolveAvatarAnimalBreedTemplate(template, seed),
        species: template.species
      })),
      ...AVATAR_CAT_BREED_TEMPLATES.map(template => ({
        id: template.id,
        resolve: (seed: string) => {
          const resolved = resolveAvatarCatBreedTemplate(template, seed)
          return {
            earHeight: resolved.catEarHeight,
            earWidth: resolved.catEarWidth,
            entityParts: resolved.entityParts,
            headHeight: 100,
            headWidth: 100
          }
        },
        species: 'cat'
      })),
      ...AVATAR_DOG_BREED_TEMPLATES.map(template => ({
        id: template.id,
        resolve: (seed: string) => {
          const resolved = resolveAvatarDogBreedTemplate(template, seed)
          return {
            earHeight: resolved.dogEarHeight,
            earWidth: resolved.dogEarWidth,
            entityParts: resolved.entityParts,
            headHeight: resolved.dogHeadHeight,
            headWidth: resolved.dogHeadWidth
          }
        },
        species: 'dog'
      })),
      ...AVATAR_RABBIT_BREED_TEMPLATES.map(template => ({
        id: template.id,
        resolve: (seed: string) => {
          const resolved = resolveAvatarRabbitBreedTemplate(template, seed)
          return {
            earHeight: resolved.rabbitEarHeight,
            earWidth: resolved.rabbitEarWidth,
            entityParts: resolved.entityParts,
            headHeight: resolved.rabbitHeadHeight,
            headWidth: resolved.rabbitHeadWidth
          }
        },
        species: 'rabbit'
      })),
      ...AVATAR_BEAR_BREED_TEMPLATES.map(template => ({
        id: template.id,
        resolve: (seed: string) => {
          const resolved = resolveAvatarBearBreedTemplate(template, seed)
          return {
            earHeight: resolved.bearEarHeight,
            earWidth: resolved.bearEarWidth,
            entityParts: resolved.entityParts,
            headHeight: resolved.bearHeadHeight,
            headWidth: resolved.bearHeadWidth
          }
        },
        species: 'bear'
      }))
    ]

    expect(profiles).toHaveLength(129)

    for (const profile of profiles) {
      for (let index = 0; index < 48; index += 1) {
        const resolved = profile.resolve(`v1-${profile.id}-proportion-${index}`)
        const earLimit = profile.id === 'fennec-fox' ? 2.12 : profile.id === 'corgi' ? 1.9 : 1.5

        expect(resolved.headWidth, `${profile.id} has an oversized head`).toBeLessThanOrEqual(135)
        expect(resolved.headHeight, `${profile.id} has an oversized head`).toBeLessThanOrEqual(135)
        if (typeof resolved.earHeight === 'number' && typeof resolved.earWidth === 'number') {
          expect(
            Math.max(resolved.earHeight / resolved.headHeight, resolved.earWidth / resolved.headWidth),
            `${profile.id} ears overwhelm its head`
          ).toBeLessThanOrEqual(earLimit)
        }

        if ('hornSize' in resolved && typeof resolved.hornSize === 'number') {
          const headSize = Math.sqrt(resolved.headWidth * resolved.headHeight)
          const accessoryLimit = profile.species === 'lion'
            ? profile.id === 'lion-cub' ? .86 : 1.06
            : 1.42
          expect(
            resolved.hornSize / headSize,
            `${profile.id} horns, tail, mane, or spines overwhelm its head`
          ).toBeLessThanOrEqual(accessoryLimit)
        }

        const left = resolved.entityParts.find(part => /(?:^|-)ear-left$/u.test(part.id))
        const right = resolved.entityParts.find(part => /(?:^|-)ear-right$/u.test(part.id))
        if (left == null || right == null) {
          expect(resolved.entityParts.some(part => /(?:^|-)ear-(?:left|right)$/u.test(part.id))).toBe(false)
        } else {
          expect(left.x, `${profile.id} left ear is hidden inside its head`).toBeLessThan(-20)
          expect(right.x, `${profile.id} right ear is hidden inside its head`).toBeGreaterThan(20)
        }

        if (profile.id === 'highland-cow') {
          expect(resolved.entityParts.filter(part => part.id.startsWith('forelock-'))
            .every(part => part.y < -20)).toBe(true)
        }
      }
    }
  })

  it('correlates compact lion manes with head size without restricting manual anatomy controls', () => {
    const expected = {
      'african-lion': { head: [104, 101], mane: 101, maneRange: [97, 105] },
      'lion-cub': { head: [88, 93], mane: 72, maneRange: [68, 76] },
      lioness: { head: [101, 98], mane: undefined, maneRange: undefined },
      'white-lion': { head: [102, 99], mane: 98, maneRange: [94, 102] }
    } as const

    for (const template of getAvatarAnimalBreedTemplates('lion')) {
      const authored = expected[template.id as keyof typeof expected]
      expect([template.fixed.headWidth, template.fixed.headHeight]).toEqual(authored.head)
      expect(template.fixed.hornSize).toBe(authored.mane)

      const range = template.seedDomain.ranges?.[AVATAR_SEED_FIELD.lionManeSize]
      if (authored.maneRange == null) {
        expect(range).toBeUndefined()
        expect(template.followByDefault).not.toContain(AVATAR_SEED_FIELD.lionManeSize)
        continue
      }

      expect([range?.min, range?.max]).toEqual(authored.maneRange)
      for (let index = 0; index < 96; index += 1) {
        const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${template.id}-balanced-${index}`)
        const headRatio = Math.sqrt(
          resolved.headWidth / template.fixed.headWidth * resolved.headHeight / template.fixed.headHeight
        )
        expect(Math.abs(resolved.hornSize! - Math.round(authored.mane! * headRatio))).toBeLessThanOrEqual(2)
      }
    }

    const template = getAvatarAnimalBreedTemplate('lion', 'african-lion')!
    const resolved = resolveAvatarAnimalBreedTemplate(template, 'v1-lion-manual-dimensions')
    const manuallySized = applyAvatarAnimalDimensions(resolved.entityParts, 'lion', {
      headHeight: 130,
      headWidth: 135,
      hornSize: 145
    }, 'full')
    expect(getAvatarAnimalScaleRange('lion', 'head').max).toBe(135)
    expect(getAvatarAnimalScaleRange('lion', 'horn').max).toBe(145)
    expect(getAvatarAnimalDimensions('lion', manuallySized)).toMatchObject({
      headHeight: 130,
      headWidth: 135,
      hornSize: 145
    })
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
          if (part.id === 'snout') {
            layers.push({ color: part.baseColor, id: part.id, parent: head.baseColor })
          }
          if (part.id.startsWith('nostril-')) {
            const snout = resolved.entityParts.find(candidate => candidate.id === 'snout')!
            layers.push({ color: part.baseColor, id: part.id, parent: snout.baseColor })
          }
        }

        for (const layer of layers) {
          if (/(?:seam|nostril|explicit-color-override|crest-comb)/u.test(layer.id)) continue
          const contrast = Math.abs(perceivedLightness(layer.color) - perceivedLightness(layer.parent))
          const colorDistance = normalizedRgbDistance(layer.color, layer.parent)
          if (contrast <= .02 && colorDistance <= .02) {
            failures.push(
              `${template.id} ${layer.id} at tone ${requestedTone}: ` +
              `lightness ${contrast.toFixed(3)}, rgb ${colorDistance.toFixed(3)}`
            )
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
        if (left == null || right == null) {
          expect(parts.some(part => /(?:^|-)ear-(?:left|right)$/u.test(part.id))).toBe(false)
        } else {
          expect(left.x).toBeLessThan(-20)
          expect(right.x).toBeGreaterThan(20)
        }
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

  it('preserves true species-specific cheeks, projecting snouts, and three-dimensional forelocks', () => {
    for (const species of ['hamster', 'capybara', 'otter', 'pig', 'alpaca', 'cow', 'squirrel'] as const) {
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
      if (species === 'alpaca') {
        expect(resolved.entityParts.filter(part => part.id.startsWith('forelock-'))).toHaveLength(3)
        expect(resolved.surfaceDecals?.some(decal => decal.id === 'alpaca-face-mask')).toBe(true)
      }
      if (species === 'cow') {
        expect(resolved.entityParts.some(part => part.id === 'snout')).toBe(true)
        expect(resolved.entityParts.some(part => part.id === 'nostril-left')).toBe(true)
        expect(resolved.entityParts.some(part => part.id === 'nostril-right')).toBe(true)
        expect(resolved.faceStyle.noseEnabled).toBe(false)
      }
      if (species === 'squirrel') {
        expect(resolved.entityParts.filter(part => part.id.startsWith('tail-'))).toHaveLength(3)
        expect(resolved.entityParts.filter(part => part.id.startsWith('tail-'))
          .every(part => part.z < -40)).toBe(true)
      }
    }
  })

  it('separates third-batch anatomy from every facial color region', () => {
    for (const species of ['seal', 'beaver', 'guinea-pig', 'chinchilla', 'ferret', 'monkey'] as const) {
      for (const template of getAvatarAnimalBreedTemplates(species)) {
        const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${template.id}-surface-anatomy`)
        const head = resolved.entityParts.find(part => part.face)!
        const partIds = new Set(resolved.entityParts.map(part => part.id))

        expect(resolved.faceStyle.eyeShape).toBe('rounded')
        expect(resolved.surfaceDecals?.every(decal => partIds.has(decal.targetPartId))).toBe(true)

        if (species === 'seal' || species === 'beaver' || species === 'guinea-pig' || species === 'chinchilla') {
          for (const side of ['left', 'right'] as const) {
            const cheek = resolved.entityParts.find(part => part.id === `cheek-${side}`)!
            expect(cheek.scaleZ).toBeGreaterThan(.12)
            expect(cheek.baseColor).toBe(head.baseColor)
            expect(cheek.highlightColor).toBe(head.highlightColor)
            expect(cheek.shadowColor).toBe(head.shadowColor)
            expect(resolved.surfaceDecals?.some(decal => (
              decal.id === `${species}-cheek-${side}` && decal.targetPartId === `cheek-${side}`
            ))).toBe(true)
          }
        }

        if (species === 'beaver') {
          const leftTooth = resolved.entityParts.find(part => part.id === 'tooth-left')!
          expect(leftTooth.scaleZ).toBeGreaterThan(.1)
          expect(leftTooth.baseColor).not.toBe(head.baseColor)
        }

        if (species === 'ferret') {
          expect(resolved.entityParts.some(part => part.id === 'muzzle')).toBe(false)
          expect(resolved.surfaceDecals?.filter(decal => decal.id.startsWith('ferret-eye-mask-')))
            .toHaveLength(2)
        }

        if (species === 'monkey') {
          const muzzle = resolved.entityParts.find(part => part.id === 'muzzle')!
          expect(muzzle.scaleZ).toBeGreaterThan(.3)
          expect(muzzle.baseColor).toBe(head.baseColor)
          expect(resolved.surfaceDecals?.find(decal => decal.id === 'monkey-muzzle-skin'))
            .toMatchObject({ targetPartId: 'muzzle' })
          expect(resolved.surfaceDecals?.filter(decal => decal.id.startsWith('monkey-nostril-'))
            .every(decal => decal.targetPartId === 'muzzle')).toBe(true)
        }
      }
    }
  })

  it.each(['hamster', 'squirrel'] as const)(
    'keeps every %s cheek as genuine body-colored volume with its pale fur projected onto the surface',
    species => {
      for (const template of getAvatarAnimalBreedTemplates(species)) {
        for (const requestedTone of [template.toneJitter.min, 0, template.toneJitter.max]) {
          const seed = Array.from({ length: 600 }, (_, index) => `v1-${template.id}-real-cheek-${index}`)
            .find(candidate => (
              resolveSeededAvatarPaletteTone(candidate, template.fixed.paletteId, template.seedDomain) === requestedTone
            ))
          expect(seed, `${template.id} should reach authored tone ${requestedTone}`).toBeDefined()

          const resolved = resolveAvatarAnimalBreedTemplate(template, seed!)
          const head = resolved.entityParts.find(part => part.face)!

          for (const side of ['left', 'right'] as const) {
            const cheek = resolved.entityParts.find(part => part.id === `cheek-${side}`)
            const marking = resolved.surfaceDecals?.find(decal => decal.id === `${species}-cheek-${side}`)

            expect(cheek?.baseColor, `${template.id} ${side} cheek must continue the head material`)
              .toBe(head.baseColor)
            expect(cheek?.highlightColor).toBe(head.highlightColor)
            expect(cheek?.shadowColor).toBe(head.shadowColor)
            expect(cheek?.scaleZ).toBeGreaterThan(.12)
            expect(marking, `${template.id} ${side} cheek needs a real surface marking`).toMatchObject({
              opacity: 100,
              targetPartId: `cheek-${side}`
            })
            expect(Math.abs(perceivedLightness(marking!.color) - perceivedLightness(cheek!.baseColor)))
              .toBeGreaterThan(.045)
          }
        }
      }
    }
  )

  it('keeps every capybara muzzle as body-colored anatomy with fur projected onto its true surface', () => {
    for (const template of getAvatarAnimalBreedTemplates('capybara')) {
      for (const requestedTone of [template.toneJitter.min, 0, template.toneJitter.max]) {
        const seed = Array.from({ length: 600 }, (_, index) => `v1-${template.id}-real-muzzle-${index}`)
          .find(candidate => (
            resolveSeededAvatarPaletteTone(candidate, template.fixed.paletteId, template.seedDomain) === requestedTone
          ))
        expect(seed, `${template.id} should reach authored tone ${requestedTone}`).toBeDefined()

        const resolved = resolveAvatarAnimalBreedTemplate(template, seed!)
        const head = resolved.entityParts.find(part => part.face)!
        const muzzle = resolved.entityParts.find(part => part.id === 'muzzle')
        const marking = resolved.surfaceDecals?.find(decal => decal.id === 'capybara-muzzle-fur')

        expect(muzzle?.baseColor, `${template.id} muzzle must continue the head material`).toBe(head.baseColor)
        expect(muzzle?.highlightColor).toBe(head.highlightColor)
        expect(muzzle?.shadowColor).toBe(head.shadowColor)
        expect(muzzle?.scaleZ).toBeGreaterThan(.35)
        expect(marking, `${template.id} muzzle needs a genuine surface fur marking`).toMatchObject({
          opacity: 100,
          side: 'front',
          targetPartId: 'muzzle'
        })
        expect(Math.abs(perceivedLightness(marking!.color) - perceivedLightness(muzzle!.baseColor)))
          .toBeGreaterThan(.045)
      }
    }
  })

  it('keeps chipmunk stripes attached to the actual three-dimensional head', () => {
    const template = getAvatarAnimalBreedTemplate('squirrel', 'chipmunk')!
    const resolved = resolveAvatarAnimalBreedTemplate(template, 'v1-chipmunk-stripes')
    const stripes = resolveAvatarCoatPatternDecals({
      entityParts: resolved.entityParts,
      entityPreset: 'squirrel',
      palette: resolveAvatarBreedPalette(template.fixed.paletteId, 'v1-chipmunk-stripes', template.seedDomain),
      paletteId: resolved.paletteId,
      pattern: resolved.coatPattern
    })
    expect(stripes.filter(decal => decal.id.startsWith('coat-chipmunk-'))).toHaveLength(5)
    expect(stripes.every(decal => decal.targetPartId === 'primary')).toBe(true)
  })

  it('gives every tiger natural curved stripes bound to its real head and ears', () => {
    for (const template of getAvatarAnimalBreedTemplates('tiger')) {
      const seed = `v1-${template.id}-curved-stripes`
      const resolved = resolveAvatarAnimalBreedTemplate(template, seed)
      const stripes = resolveAvatarCoatPatternDecals({
        entityParts: resolved.entityParts,
        entityPreset: 'tiger',
        palette: resolveAvatarBreedPalette(template.fixed.paletteId, seed, template.seedDomain),
        paletteId: resolved.paletteId,
        pattern: resolved.coatPattern
      })
      expect(resolved.coatPattern.enabled).toBe(true)
      expect(stripes.length).toBeGreaterThan(5)
      expect(stripes.every(decal => decal.id.startsWith('coat-tiger-'))).toBe(true)
      expect(stripes.some(decal => decal.targetPartId === 'primary')).toBe(true)
      expect(resolved.surfaceDecals?.some(decal => decal.id === 'tiger-face-mask')).toBe(true)
      expect(resolved.entityParts.some(part => part.id === 'muzzle')).toBe(false)
    }
  })

  it('distinguishes true Highland horns and bangs from a naturally hornless calf', () => {
    const highland = resolveAvatarAnimalBreedTemplate(
      getAvatarAnimalBreedTemplate('cow', 'highland-cow')!,
      'v1-highland-cow-anatomy'
    )
    const calf = resolveAvatarAnimalBreedTemplate(
      getAvatarAnimalBreedTemplate('cow', 'cow-calf')!,
      'v1-cow-calf-anatomy'
    )

    expect(highland.entityParts.filter(part => /^horn-(?:left|right)/u.test(part.id))).toHaveLength(4)
    expect(highland.entityParts.filter(part => part.id.startsWith('forelock-'))).toHaveLength(3)
    expect(highland.entityParts.filter(part => part.id.startsWith('forelock-'))
      .every(part => part.y < -20)).toBe(true)
    expect(calf.entityParts.some(part => part.id.startsWith('horn-'))).toBe(false)
    expect(calf.entityParts.filter(part => part.id.startsWith('forelock-'))).toHaveLength(1)
  })

  it('keeps dairy spots on real curved surfaces and visibly different from its eyes and nostrils', () => {
    const template = getAvatarAnimalBreedTemplate('cow', 'dairy-cow')!
    const seed = 'v1-dairy-cow-spot-contrast'
    const resolved = resolveAvatarAnimalBreedTemplate(template, seed)
    const palette = resolveAvatarBreedPalette(template.fixed.paletteId, seed, template.seedDomain)
    const spots = resolveAvatarCoatPatternDecals({
      entityParts: resolved.entityParts,
      entityPreset: 'cow',
      palette,
      paletteId: resolved.paletteId,
      pattern: resolved.coatPattern
    })

    expect(spots.length).toBeGreaterThan(3)
    expect(spots.every(spot => (
      spot.targetPartId === 'primary' || spot.targetPartId === 'ear-left' || spot.targetPartId === 'ear-right'
    ))).toBe(true)
    expect(Math.abs(perceivedLightness(palette.coat!.mark) - perceivedLightness(palette.foreground)))
      .toBeGreaterThan(.08)
    expect(resolved.entityParts.find(part => part.id === 'nostril-left')?.baseColor).toBe(palette.foreground)
  })

  it('distinguishes real full, juvenile, and absent lion manes', () => {
    const count = (id: string) => resolveAvatarAnimalBreedTemplate(
      getAvatarAnimalBreedTemplate('lion', id)!,
      `v1-${id}-mane`
    ).entityParts.filter(part => part.id.startsWith('mane-')).length

    expect(count('african-lion')).toBe(9)
    expect(count('white-lion')).toBe(9)
    expect(count('lion-cub')).toBe(3)
    expect(count('lioness')).toBe(0)
  })

  it('gives each hedgehog genuinely three-dimensional natural quills', () => {
    for (const template of getAvatarAnimalBreedTemplates('hedgehog')) {
      const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${template.id}-spines`)
      const spines = resolved.entityParts.filter(part => part.id.startsWith('spine-'))
      expect(spines).toHaveLength(template.id === 'albino-hedgehog' ? 8 : 15)
      expect(spines.some(part => part.id === 'spine-core')).toBe(true)
      expect(spines.every(part => (part.scaleZ ?? 0) > .1)).toBe(true)
      expect(resolved.surfaceDecals?.some(decal => decal.id === 'hedgehog-face-mask')).toBe(true)
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
