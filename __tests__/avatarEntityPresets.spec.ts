import { describe, expect, it } from 'vitest'

import {
  AVATAR_ENTITY_RANGES,
  applyAvatarPaletteToneJitter,
  createDefaultAvatarDefinition,
  getAvatarPalette,
  isAvatarDefinition
} from '@oneworks/avatar'

import {
  AVATAR_BUILT_IN_ENTITY_PRESETS,
  applyAlpacaEarScale,
  applyAlpacaHeadScale,
  applyBeaverHeadScale,
  applyBeaverToothSize,
  applyBeaverToothStyle,
  applyCapybaraHeadScale,
  applyChickBeakSize,
  applyChickBeakStyle,
  applyChickCrestSize,
  applyChickCrestStyle,
  applyChickHeadScale,
  applyChinchillaEarScale,
  applyChinchillaHeadScale,
  applyCatEarScale,
  applyCowForelockStyle,
  applyCowHeadScale,
  applyCowHornSize,
  applyCowHornStyle,
  applyDeerAntlerSize,
  applyDeerAntlerStyle,
  applyDeerHeadScale,
  applyDuckBillSize,
  applyDuckBillStyle,
  applyDuckHeadScale,
  applyFoxEarScale,
  applyFerretEarScale,
  applyFerretHeadScale,
  applyFoxEarStyle,
  applyFoxHeadScale,
  applyFoxHeadTaper,
  applyHamsterEarScale,
  applyHamsterHeadScale,
  applyHedgehogHeadScale,
  applyGuineaPigEarScale,
  applyGuineaPigHeadScale,
  applyGooseBillSize,
  applyGooseBillStyle,
  applyGooseHeadScale,
  applyHedgehogSpineSize,
  applyHedgehogSpineStyle,
  applyLionHeadScale,
  applyMonkeyEarScale,
  applyMonkeyHeadScale,
  applyLionManeSize,
  applyLionManeStyle,
  applyOtterHeadScale,
  applyOwlBeakSize,
  applyOwlBeakStyle,
  applyOwlHeadScale,
  applyOwlTuftSize,
  applyOwlTuftStyle,
  applyPigHeadScale,
  applyPenguinBeakSize,
  applyPenguinBeakStyle,
  applyPenguinHeadScale,
  applyParrotBeakSize,
  applyParrotBeakStyle,
  applyParrotHeadScale,
  applySheepHeadScale,
  applySheepHornSize,
  applySheepHornStyle,
  applySealEarScale,
  applySealHeadScale,
  applySquirrelHeadScale,
  applySquirrelTailSize,
  applyTigerEarScale,
  applyTigerHeadScale,
  applyAvatarEntityPalette,
  createAvatarEntityParts,
  createAlpacaSurfaceDecals,
  createBeaverSurfaceDecals,
  createCapybaraSurfaceDecals,
  createChickSurfaceDecals,
  createChinchillaSurfaceDecals,
  createCowSurfaceDecals,
  createDeerSurfaceDecals,
  createDuckSurfaceDecals,
  createFoxSurfaceDecals,
  createFerretSurfaceDecals,
  createHamsterSurfaceDecals,
  createHedgehogSurfaceDecals,
  createGuineaPigSurfaceDecals,
  createGooseSurfaceDecals,
  createLionSurfaceDecals,
  createMonkeySurfaceDecals,
  createOtterSurfaceDecals,
  createOwlSurfaceDecals,
  createPenguinSurfaceDecals,
  createParrotSurfaceDecals,
  createSheepSurfaceDecals,
  createSealSurfaceDecals,
  createSquirrelSurfaceDecals,
  createTigerSurfaceDecals,
  deserializeAvatarEntityGroups,
  deserializeAvatarEntityParts,
  CHICK_BEAK_SIZE_RANGE,
  DUCK_BILL_SIZE_RANGE,
  FOX_EAR_SCALE_RANGE,
  FOX_HEAD_SCALE_RANGE,
  FOX_HEAD_TAPER_RANGE,
  GOOSE_BILL_SIZE_RANGE,
  OWL_BEAK_SIZE_RANGE,
  PARROT_BEAK_SIZE_RANGE,
  PENGUIN_BEAK_SIZE_RANGE,
  SEAL_EAR_SCALE_RANGE,
  getCatEarScale,
  getChinchillaEarScale,
  getChinchillaHeadScale,
  getChickBeakSize,
  getChickBeakStyle,
  getChickCrestSize,
  getChickCrestStyle,
  getChickHeadScale,
  getAlpacaEarScale,
  getAlpacaHeadScale,
  getBeaverHeadScale,
  getBeaverToothSize,
  getBeaverToothStyle,
  getCowForelockStyle,
  getCowHornSize,
  getCowHornStyle,
  getDeerAntlerSize,
  getDuckBillSize,
  getDuckBillStyle,
  getDuckHeadScale,
  getFoxEarScale,
  getFoxEarStyle,
  getFerretEarScale,
  getFerretHeadScale,
  getFoxHeadScale,
  getFoxHeadTaper,
  getHamsterEarScale,
  getHamsterHeadScale,
  getHedgehogSpineSize,
  getHedgehogSpineStyle,
  getGuineaPigEarScale,
  getGuineaPigHeadScale,
  getGooseBillSize,
  getGooseBillStyle,
  getGooseHeadScale,
  getLionManeSize,
  getLionManeStyle,
  getMonkeyEarScale,
  getMonkeyHeadScale,
  getOwlBeakSize,
  getOwlBeakStyle,
  getOwlHeadScale,
  getOwlTuftSize,
  getOwlTuftStyle,
  getPenguinBeakSize,
  getPenguinBeakStyle,
  getPenguinHeadScale,
  getParrotBeakSize,
  getParrotBeakStyle,
  getParrotHeadScale,
  getSheepHornSize,
  getSealEarScale,
  getSealHeadScale,
  getSquirrelTailSize,
  getTigerEarScale,
  getTigerHeadScale,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene,
  hasMultipleAvatarEntityMaterials,
  normalizeCapybaraEntityParts,
  normalizeDeerEntityParts,
  normalizeHamsterEntityParts,
  normalizeOtterEntityParts,
  normalizeSheepEntityParts,
  normalizeSquirrelEntityParts,
  resolveAvatarEntityPresetFaceStyle,
  serializeAvatarEntityGroups,
  serializeAvatarEntityParts
} from '../src/avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'

describe('built-in entity preset scenes', () => {
  it('keeps every fourth-batch bird head-only and separates anatomy from all feather and beak colors', () => {
    const definition = createDefaultAvatarDefinition()
    for (const preset of ['chick', 'duck', 'penguin', 'owl', 'parrot', 'goose'] as const) {
      const parts = createAvatarEntityParts(preset)
      const head = parts.find(part => part.face)!
      const scene = getAvatarEntityPresetScene(preset)!

      expect(parts.some(part => /(^|[-_])(ear|wing|body|neck)([-_]|$)/u.test(part.id)), preset).toBe(false)
      expect(parts.every(part => {
        const isKeratinMouth = part.id === 'beak' || part.id === 'bill'
        return isKeratinMouth || (
          part.baseColor === head.baseColor && part.foregroundColor === head.foregroundColor &&
          part.highlightColor === head.highlightColor && part.shadowColor === head.shadowColor
        )
      }), `${preset} feather anatomy must inherit its head material while its beak or bill keeps keratin material`).toBe(true)
      expect(scene.surfaceDecals.every(decal => (
        decal.targetPartId == null || parts.some(part => part.id === decal.targetPartId)
      )), `${preset} default decals must only target real anatomy`).toBe(true)
      expect(getAvatarEntityPresetFaceStyle(preset)?.eyeShape, preset).toBe('rounded')
      expect(isAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          decals: scene.surfaceDecals,
          entity: { ...definition.scene.entity, parts, preset }
        }
      }), `${preset} complete authored scene must be a valid public Definition`).toBe(true)
    }

    const chickComb = applyChickCrestStyle(createAvatarEntityParts('chick'), 'comb')
    const owlTufts = applyOwlTuftStyle(createAvatarEntityParts('owl'), 'paired')
    expect(createChickSurfaceDecals({ combColor: '#d44f42' }).slice(-3).every(decal => (
      chickComb.some(part => part.id === decal.targetPartId)
    ))).toBe(true)
    expect(createOwlSurfaceDecals({ tuftColor: '#765740' }).slice(-2).every(decal => (
      owlTufts.some(part => part.id === decal.targetPartId)
    ))).toBe(true)

    const minimumBeaks = [
      { parts: applyChickBeakSize(applyChickBeakStyle(createAvatarEntityParts('chick'), 'pointed'), CHICK_BEAK_SIZE_RANGE.min), preset: 'chick' },
      { parts: applyDuckBillSize(applyDuckBillStyle(createAvatarEntityParts('duck'), 'flat'), DUCK_BILL_SIZE_RANGE.min), preset: 'duck' },
      { parts: applyPenguinBeakSize(applyPenguinBeakStyle(createAvatarEntityParts('penguin'), 'short'), PENGUIN_BEAK_SIZE_RANGE.min), preset: 'penguin' },
      { parts: applyOwlBeakSize(applyOwlBeakStyle(createAvatarEntityParts('owl'), 'short'), OWL_BEAK_SIZE_RANGE.min), preset: 'owl' },
      { parts: applyParrotBeakSize(applyParrotBeakStyle(createAvatarEntityParts('parrot'), 'hooked'), PARROT_BEAK_SIZE_RANGE.min), preset: 'parrot' },
      { parts: applyGooseBillSize(applyGooseBillStyle(createAvatarEntityParts('goose'), 'broad'), GOOSE_BILL_SIZE_RANGE.min), preset: 'goose' }
    ] as const
    for (const { parts, preset } of minimumBeaks) {
      expect(parts.every(part => (
        part.scaleX >= AVATAR_ENTITY_RANGES.scaleX.min &&
        part.scaleY >= AVATAR_ENTITY_RANGES.scaleY.min &&
        (part.scaleZ == null || part.scaleZ >= AVATAR_ENTITY_RANGES.scaleZ.min)
      )), `${preset} minimum public attachment size must stay Definition-safe`).toBe(true)
      expect(isAvatarDefinition({
        ...definition,
        scene: {
          ...definition.scene,
          decals: getAvatarEntityPresetScene(preset)!.surfaceDecals,
          entity: { ...definition.scene.entity, parts, preset }
        }
      }), `${preset} minimum attachment scene must round-trip`).toBe(true)
    }
  })

  it('builds a head-only goose with a true projecting bill and surface-only feather and nostril colors', () => {
    const goose = createAvatarEntityParts('goose')
    const head = goose.find(part => part.face)!
    const bill = goose.filter(part => part.id === 'bill')
    const decals = createGooseSurfaceDecals({ billColor: '#df913d', color: '#f7f3e9', nostrilColor: '#5b3b25' })

    expect(goose.some(part => /ear|wing|body|neck|crest|tuft/u.test(part.id))).toBe(false)
    expect(bill).toHaveLength(1)
    expect(bill.every(part => part.baseColor !== head.baseColor && (part.scaleZ ?? 0) >= .2)).toBe(true)
    expect(decals[0]).toMatchObject({ id: 'goose-face-patch', targetPartId: 'primary' })
    expect(decals.slice(1).every(decal => decal.targetPartId === 'bill')).toBe(true)
    expect(decals.find(decal => decal.id === 'goose-bill-explicit-color-override'))
      .toMatchObject({ color: '#df913d' })

    expect(getGooseBillStyle(goose)).toBe('short')
    const broad = applyGooseBillSize(applyGooseBillStyle(goose, 'broad'), 121)
    expect(getGooseBillStyle(broad)).toBe('broad')
    expect(getGooseBillSize(broad)).toBe(121)
    expect(broad.find(part => part.id === 'bill')!.scaleX).toBeGreaterThan(
      applyGooseBillSize(goose, 121).find(part => part.id === 'bill')!.scaleX
    )
    expect(getGooseHeadScale(applyGooseHeadScale(goose, 107, 112))).toEqual({ height: 112, width: 107 })
    expect(getAvatarEntityPresetFaceStyle('goose')).toMatchObject({ eyeShape: 'rounded', noseEnabled: false })
    expect(getAvatarEntityPresetScene('goose')).toMatchObject({ cameraMode: true, paletteId: 'white-gosling' })
  })

  it('builds a head-only parrot with a true deep hooked beak and projected facial feather colors', () => {
    const parrot = createAvatarEntityParts('parrot')
    const head = parrot.find(part => part.face)!
    const beak = parrot.filter(part => part.id === 'beak')
    const decals = createParrotSurfaceDecals({ beakColor: '#e3d4b7', color: '#f2e6ca', nostrilColor: '#554437' })

    expect(parrot.some(part => /ear|wing|body|neck|crest|tuft/u.test(part.id))).toBe(false)
    expect(beak).toHaveLength(1)
    expect(beak.every(part => part.baseColor !== head.baseColor && (part.scaleZ ?? 0) >= .28)).toBe(true)
    expect(decals[0]).toMatchObject({ id: 'parrot-face-patch', targetPartId: 'primary' })
    expect(decals.slice(1).every(decal => decal.targetPartId === 'beak')).toBe(true)
    expect(decals.find(decal => decal.id === 'parrot-beak-explicit-color-override'))
      .toMatchObject({ color: '#e3d4b7' })

    expect(getParrotBeakStyle(parrot)).toBe('macaw')
    const hooked = applyParrotBeakSize(applyParrotBeakStyle(parrot, 'hooked'), 117)
    expect(getParrotBeakStyle(hooked)).toBe('hooked')
    expect(getParrotBeakSize(hooked)).toBe(117)
    expect(hooked.find(part => part.id === 'beak')!.scaleZ).toBeLessThan(
      applyParrotBeakSize(parrot, 117).find(part => part.id === 'beak')!.scaleZ!
    )
    expect(getParrotHeadScale(applyParrotHeadScale(parrot, 106, 111))).toEqual({ height: 111, width: 106 })
    expect(getAvatarEntityPresetFaceStyle('parrot')).toMatchObject({ eyeShape: 'rounded', noseEnabled: false })
    expect(getAvatarEntityPresetScene('parrot')).toMatchObject({ cameraMode: true, paletteId: 'scarlet-macaw' })
  })

  it('builds a head-only owl with a hooked beak, optional true feather tufts, and surface-only face rings', () => {
    const owl = createAvatarEntityParts('owl')
    const head = owl.find(part => part.face)!
    const beak = owl.filter(part => part.id === 'beak')
    const decals = createOwlSurfaceDecals({
      beakColor: '#d39b45', color: '#eee0c5', eyeRingColor: '#8c684b',
      nostrilColor: '#5b4026', tuftColor: '#765740'
    })

    expect(owl.some(part => /ear|wing|body|neck/u.test(part.id))).toBe(false)
    expect(beak).toHaveLength(1)
    expect(beak.every(part => part.baseColor !== head.baseColor && (part.scaleZ ?? 0) >= .2)).toBe(true)
    expect(owl.some(part => part.id.startsWith('tuft-'))).toBe(false)
    expect(decals.slice(0, 3).every(decal => decal.targetPartId === 'primary')).toBe(true)
    expect(decals.filter(decal => decal.id.includes('beak-') || decal.id.includes('nostril')).every(decal => decal.targetPartId === 'beak')).toBe(true)
    expect(decals.some(decal => decal.id === 'owl-beak-explicit-color-override')).toBe(true)
    expect(decals.filter(decal => decal.id.includes('tuft-')).every(decal => decal.targetPartId?.startsWith('tuft-'))).toBe(true)

    expect(getOwlBeakStyle(owl)).toBe('hooked')
    const short = applyOwlBeakSize(applyOwlBeakStyle(owl, 'short'), 119)
    expect(getOwlBeakStyle(short)).toBe('short')
    expect(getOwlBeakSize(short)).toBe(119)
    const tufted = applyOwlTuftSize(applyOwlTuftStyle(owl, 'paired'), 126)
    expect(getOwlTuftStyle(tufted)).toBe('paired')
    expect(getOwlTuftSize(tufted)).toBe(126)
    expect(tufted.filter(part => part.id.startsWith('tuft-'))).toHaveLength(2)
    expect(getOwlHeadScale(applyOwlHeadScale(tufted, 110, 106))).toEqual({ height: 106, width: 110 })
    expect(getAvatarEntityPresetFaceStyle('owl')).toMatchObject({ eyeShape: 'rounded', noseEnabled: false })
    expect(getAvatarEntityPresetScene('owl')).toMatchObject({ cameraMode: true, paletteId: 'barn-owl' })
  })

  it('builds a head-only penguin with a true tapered beak and a curved facial feather mask', () => {
    const penguin = createAvatarEntityParts('penguin')
    const head = penguin.find(part => part.face)!
    const beak = penguin.filter(part => part.id === 'beak')
    const decals = createPenguinSurfaceDecals({ beakColor: '#e69a37', color: '#f2efe6', nostrilColor: '#543722' })

    expect(penguin.some(part => /ear|wing|body|neck/u.test(part.id))).toBe(false)
    expect(beak).toHaveLength(1)
    expect(beak.every(part => part.baseColor !== head.baseColor && (part.scaleZ ?? 0) >= .24)).toBe(true)
    expect(decals[0]).toMatchObject({ id: 'penguin-face-mask', targetPartId: 'primary' })
    expect(decals.slice(1).every(decal => decal.targetPartId === 'beak')).toBe(true)
    expect(decals.find(decal => decal.id === 'penguin-beak-explicit-color-override'))
      .toMatchObject({ color: '#e69a37' })

    expect(getPenguinBeakStyle(penguin)).toBe('tapered')
    const short = applyPenguinBeakSize(applyPenguinBeakStyle(penguin, 'short'), 124)
    expect(getPenguinBeakStyle(short)).toBe('short')
    expect(getPenguinBeakSize(short)).toBe(124)
    expect(short.find(part => part.id === 'beak')!.scaleZ).toBeLessThan(
      applyPenguinBeakSize(penguin, 124).find(part => part.id === 'beak')!.scaleZ!
    )
    expect(getPenguinHeadScale(applyPenguinHeadScale(penguin, 108, 113))).toEqual({ height: 113, width: 108 })
    expect(getAvatarEntityPresetFaceStyle('penguin')).toMatchObject({ eyeShape: 'rounded', noseEnabled: false })
    expect(getAvatarEntityPresetScene('penguin')).toMatchObject({ cameraMode: true, paletteId: 'emperor-penguin' })
  })

  it('builds a head-only duck with a truly broad bill and projected feather, bill, and nostril colors', () => {
    const duck = createAvatarEntityParts('duck')
    const head = duck.find(part => part.face)!
    const bill = duck.filter(part => part.id === 'bill')
    const decals = createDuckSurfaceDecals({ billColor: '#de8737', color: '#f7dc72', nostrilColor: '#54351f' })

    expect(duck.some(part => /ear|wing|body|neck/u.test(part.id))).toBe(false)
    expect(bill).toHaveLength(1)
    expect(bill.every(part => part.baseColor !== head.baseColor && (part.scaleZ ?? 0) >= .24)).toBe(true)
    expect(decals.slice(0, 2).every(decal => decal.targetPartId === 'primary')).toBe(true)
    expect(decals.slice(2).every(decal => decal.targetPartId === 'bill')).toBe(true)
    expect(decals.find(decal => decal.id === 'duck-bill-explicit-color-override'))
      .toMatchObject({ color: '#de8737' })

    expect(getDuckBillStyle(duck)).toBe('flat')
    const broad = applyDuckBillSize(applyDuckBillStyle(duck, 'broad'), 122)
    expect(getDuckBillStyle(broad)).toBe('broad')
    expect(getDuckBillSize(broad)).toBe(122)
    expect(broad.find(part => part.id === 'bill')!.scaleX).toBeGreaterThan(
      applyDuckBillSize(duck, 122).find(part => part.id === 'bill')!.scaleX
    )
    expect(getDuckHeadScale(applyDuckHeadScale(duck, 109, 105))).toEqual({ height: 105, width: 109 })
    expect(getAvatarEntityPresetFaceStyle('duck')).toMatchObject({ eyeShape: 'rounded', noseEnabled: false })
    expect(getAvatarEntityPresetScene('duck')).toMatchObject({ cameraMode: true, paletteId: 'yellow-duckling' })
  })

  it('builds a head-only chick with true beak and crest anatomy while keeping feather colors on surfaces', () => {
    const chick = createAvatarEntityParts('chick')
    const head = chick.find(part => part.face)!
    const beak = chick.filter(part => part.id === 'beak')
    const decals = createChickSurfaceDecals({
      beakColor: '#e89132',
      color: '#f8dc74',
      combColor: '#d44f42',
      nostrilColor: '#5f351e'
    })

    expect(chick.some(part => /ear|wing|body|neck/u.test(part.id))).toBe(false)
    expect(beak.map(part => part.id)).toEqual(['beak'])
    expect(beak.every(part => part.baseColor !== head.baseColor && (part.scaleZ ?? 0) >= .18)).toBe(true)
    expect(chick.filter(part => part.id.startsWith('crest-fluff-'))).toHaveLength(3)
    expect(decals.filter(decal => decal.id.includes('cheek')).every(decal => decal.targetPartId === 'primary')).toBe(true)
    expect(decals.filter(decal => decal.id.includes('beak-')).every(decal => (
      decal.targetPartId === 'beak'
    ))).toBe(true)
    expect(decals.filter(decal => decal.id.includes('nostril')).every(decal => decal.targetPartId === 'beak')).toBe(true)
    expect(decals.some(decal => decal.id === 'chick-beak-explicit-color-override')).toBe(true)
    expect(decals.filter(decal => decal.id.includes('crest-comb')).every(decal => decal.targetPartId?.startsWith('crest-comb-'))).toBe(true)

    expect(getChickBeakStyle(chick)).toBe('short')
    const pointed = applyChickBeakSize(applyChickBeakStyle(chick, 'pointed'), 127)
    expect(getChickBeakStyle(pointed)).toBe('pointed')
    expect(getChickBeakSize(pointed)).toBe(127)
    expect(pointed.find(part => part.id === 'beak')!.scaleZ).toBeGreaterThan(
      chick.find(part => part.id === 'beak')!.scaleZ!
    )

    const noCrest = applyChickCrestStyle(chick, 'none')
    expect(getChickCrestStyle(noCrest)).toBe('none')
    const comb = applyChickCrestSize(applyChickCrestStyle(noCrest, 'comb'), 118)
    expect(getChickCrestStyle(comb)).toBe('comb')
    expect(getChickCrestSize(comb)).toBe(118)
    expect(comb.filter(part => part.id.startsWith('crest-comb-'))).toHaveLength(3)
    expect(comb.some(part => part.id.startsWith('crest-fluff-'))).toBe(false)

    const scaled = applyChickHeadScale(chick, 112, 106)
    expect(getChickHeadScale(scaled)).toEqual({ height: 106, width: 112 })
    expect(getAvatarEntityPresetFaceStyle('chick')).toMatchObject({ eyeShape: 'rounded', noseEnabled: false })
    expect(getAvatarEntityPresetScene('chick')).toMatchObject({ cameraMode: true, paletteId: 'yellow-chick' })

    const definition = createDefaultAvatarDefinition()
    expect(isAvatarDefinition({
      ...definition,
      scene: {
        ...definition.scene,
        decals: getAvatarEntityPresetScene('chick')!.surfaceDecals,
        entity: { ...definition.scene.entity, parts: chick, preset: 'chick' }
      }
    })).toBe(true)
  })

  it('makes a monkey recognizably volumetric without using facial-skin color as fake geometry', () => {
    const monkey = createAvatarEntityParts('monkey')
    const head = monkey.find(part => part.face)!
    const muzzle = monkey.find(part => part.id === 'muzzle')!
    const decals = createMonkeySurfaceDecals({ color: '#d9ac83', innerEarColor: '#bb7f70', nostrilColor: '#402a24' })

    expect(muzzle.baseColor).toBe(head.baseColor)
    expect(muzzle.scaleZ).toBeGreaterThanOrEqual(.4)
    expect(muzzle.z).toBeGreaterThan(60)
    expect(monkey.filter(part => part.id.startsWith('ear-')).every(part => (part.scaleZ ?? 0) >= .25)).toBe(true)
    expect(decals.map(decal => decal.targetPartId)).toEqual([
      'primary', 'muzzle', 'ear-left', 'ear-right', 'muzzle', 'muzzle'
    ])
    expect(decals.slice(4).every(decal => decal.color === '#402a24')).toBe(true)
    expect(getMonkeyEarScale(applyMonkeyEarScale(monkey, 116, 109))).toEqual({ height: 109, width: 116 })
    expect(getMonkeyHeadScale(applyMonkeyHeadScale(monkey, 108, 112))).toEqual({ height: 112, width: 108 })
    expect(getAvatarEntityPresetScene('monkey')?.paletteId).toBe('macaque')
    expect(getAvatarEntityPresetFaceStyle('monkey')?.eyeShape).toBe('rounded')
  })

  it('keeps a ferret’s long tapered skull structural while projecting its mask and inner-ear colors', () => {
    const ferret = createAvatarEntityParts('ferret')
    const head = ferret.find(part => part.face)!
    const decals = createFerretSurfaceDecals({ color: '#eee0c6', innerEarColor: '#bd8279', maskColor: '#3e2f28' })

    expect(head.bottomTaper).toBeGreaterThan(40)
    expect(head.scaleY).toBeGreaterThan(head.scaleX)
    expect(ferret.map(part => part.id)).toEqual(['ear-left', 'ear-right', 'primary'])
    expect(decals.map(decal => decal.targetPartId)).toEqual(['primary', 'primary', 'primary', 'ear-left', 'ear-right'])
    expect(decals.slice(1, 3).every(decal => decal.color === '#3e2f28')).toBe(true)
    expect(getFerretEarScale(applyFerretEarScale(ferret, 112, 107))).toEqual({ height: 107, width: 112 })
    expect(getFerretHeadScale(applyFerretHeadScale(ferret, 96, 119))).toEqual({ height: 119, width: 96 })
    expect(getAvatarEntityPresetScene('ferret')?.paletteId).toBe('sable-ferret')
    expect(getAvatarEntityPresetFaceStyle('ferret')?.eyeShape).toBe('rounded')
  })

  it('builds chinchilla identity from truly large ears, dense cheek volume, and per-surface colors', () => {
    const chinchilla = createAvatarEntityParts('chinchilla')
    const head = chinchilla.find(part => part.face)!
    const ears = chinchilla.filter(part => part.id.startsWith('ear-'))
    const cheeks = chinchilla.filter(part => part.id.startsWith('cheek-'))
    const decals = createChinchillaSurfaceDecals({ color: '#eeeae3', innerEarColor: '#c78f98' })

    expect(ears.every(part => part.scaleX >= .29 && part.scaleY >= .37 && (part.scaleZ ?? 0) >= .25)).toBe(true)
    expect(cheeks.every(part => part.baseColor === head.baseColor && (part.scaleZ ?? 0) >= .39)).toBe(true)
    expect(decals.map(decal => decal.targetPartId)).toEqual([
      'primary', 'cheek-left', 'cheek-right', 'ear-left', 'ear-right'
    ])
    expect(getChinchillaEarScale(applyChinchillaEarScale(chinchilla, 119, 111))).toEqual({ height: 111, width: 119 })
    expect(getChinchillaHeadScale(applyChinchillaHeadScale(chinchilla, 107, 104))).toEqual({ height: 104, width: 107 })
    expect(getAvatarEntityPresetScene('chinchilla')?.paletteId).toBe('gray-chinchilla')
    expect(getAvatarEntityPresetFaceStyle('chinchilla')?.eyeShape).toBe('rounded')
  })

  it('separates a guinea pig’s true cheek volume from its projected cheek and inner-ear colors', () => {
    const guineaPig = createAvatarEntityParts('guinea-pig')
    const head = guineaPig.find(part => part.face)!
    const cheeks = guineaPig.filter(part => part.id.startsWith('cheek-'))
    const decals = createGuineaPigSurfaceDecals({ color: '#f6e6cd', innerEarColor: '#cf8d86' })

    expect(cheeks).toHaveLength(2)
    expect(cheeks.every(part => part.baseColor === head.baseColor && (part.scaleZ ?? 0) >= .35)).toBe(true)
    expect(decals.map(decal => decal.targetPartId)).toEqual([
      'primary', 'cheek-left', 'cheek-right', 'ear-left', 'ear-right'
    ])
    expect(decals.slice(0, 3).every(decal => decal.color === '#f6e6cd')).toBe(true)
    expect(decals.slice(3).every(decal => decal.color === '#cf8d86')).toBe(true)
    expect(getGuineaPigEarScale(applyGuineaPigEarScale(guineaPig, 115, 108))).toEqual({ height: 108, width: 115 })
    expect(getGuineaPigHeadScale(applyGuineaPigHeadScale(guineaPig, 112, 105))).toEqual({ height: 105, width: 112 })
    expect(getAvatarEntityPresetScene('guinea-pig')?.paletteId).toBe('american-guinea-pig')
    expect(getAvatarEntityPresetFaceStyle('guinea-pig')?.eyeShape).toBe('rounded')
  })

  it('gives a beaver a broad 3D head, two true projecting incisors, and projected fur-only cheek marks', () => {
    const beaver = createAvatarEntityParts('beaver')
    const head = beaver.find(part => part.face)!
    const teeth = beaver.filter(part => part.id.startsWith('tooth-'))
    const cheeks = beaver.filter(part => part.id.startsWith('cheek-'))

    expect(teeth).toHaveLength(2)
    expect(teeth.every(part => (part.scaleZ ?? 0) >= .15 && part.z > 80)).toBe(true)
    expect(teeth.every(part => part.baseColor !== head.baseColor)).toBe(true)
    expect(cheeks.every(part => part.baseColor === head.baseColor && (part.scaleZ ?? 0) >= .3)).toBe(true)
    expect(createBeaverSurfaceDecals().map(decal => decal.targetPartId)).toEqual([
      'primary', 'cheek-left', 'cheek-right'
    ])
    expect(getBeaverHeadScale(applyBeaverHeadScale(beaver, 118, 106))).toEqual({ height: 106, width: 118 })
    expect(getBeaverToothSize(applyBeaverToothSize(beaver, 121))).toBe(121)
    expect(getBeaverToothStyle(applyBeaverToothStyle(beaver, 'none'))).toBe('none')
    expect(getAvatarEntityPresetScene('beaver')?.paletteId).toBe('north-american-beaver')
    expect(getAvatarEntityPresetFaceStyle('beaver')?.eyeShape).toBe('rounded')
  })

  it('builds a head-only seal with flush ears, true whisker pads, and projected pale muzzle markings', () => {
    const seal = createAvatarEntityParts('seal')
    const head = seal.find(part => part.face)!
    const cheeks = seal.filter(part => part.id.startsWith('cheek-'))
    const ears = seal.filter(part => part.id.startsWith('ear-'))
    const markings = createSealSurfaceDecals({ color: '#ede7d8' })

    expect(head.scaleX).toBeGreaterThan(head.scaleY)
    expect(head.scaleZ).toBeGreaterThan(.75)
    expect(ears).toHaveLength(2)
    expect(ears.every(part => part.scaleX < .11 && part.occludedByFace)).toBe(true)
    expect(cheeks).toHaveLength(2)
    expect(cheeks.every(part => part.baseColor === head.baseColor && (part.scaleZ ?? 0) > .3)).toBe(true)
    expect(markings.map(marking => marking.targetPartId)).toEqual(['primary', 'cheek-left', 'cheek-right'])
    expect(markings.every(marking => marking.color === '#ede7d8')).toBe(true)
    expect(getSealEarScale(applySealEarScale(seal, 112, 108))).toEqual({ height: 108, width: 112 })
    expect(getSealHeadScale(applySealHeadScale(seal, 114, 103))).toEqual({ height: 103, width: 114 })
    expect(getAvatarEntityPresetFaceStyle('seal')?.eyeShape).toBe('rounded')
    expect(getAvatarEntityPresetScene('seal')?.paletteId).toBe('harbor-seal')
    expect(seal.some(part => /wing|body|neck|shoulder/.test(part.id))).toBe(false)

    const definition = createDefaultAvatarDefinition()
    expect(isAvatarDefinition({
      ...definition,
      scene: { ...definition.scene, entity: { parts: seal, preset: 'seal' } }
    })).toBe(true)

    const minimumEars = applySealEarScale(seal, SEAL_EAR_SCALE_RANGE.min, SEAL_EAR_SCALE_RANGE.min)
    expect(minimumEars.filter(part => part.id.startsWith('ear-')).every(part => (
      part.scaleX >= AVATAR_ENTITY_RANGES.scaleX.min &&
      part.scaleY >= AVATAR_ENTITY_RANGES.scaleY.min &&
      (part.scaleZ ?? 0) >= AVATAR_ENTITY_RANGES.scaleZ.min
    ))).toBe(true)
    expect(isAvatarDefinition({
      ...definition,
      scene: { ...definition.scene, entity: { parts: minimumEars, preset: 'seal' } }
    })).toBe(true)
  })

  it('gives hedgehogs a truly volumetric quill mantle with fourteen separately anchored spines', () => {
    const hedgehog = createAvatarEntityParts('hedgehog')
    const head = hedgehog.find(part => part.face)!
    const spines = hedgehog.filter(part => part.id.startsWith('spine-'))

    expect(spines).toHaveLength(15)
    expect(spines.find(part => part.id === 'spine-core')?.scaleZ).toBeGreaterThan(.7)
    expect(spines.filter(part => part.id !== 'spine-core').every(part => (
      part.shape === 'cone' && (part.scaleZ ?? 0) >= .14 && part.z < head.z
    ))).toBe(true)
    expect(new Set(spines.map(part => part.rotationZ)).size).toBeGreaterThan(10)
    expect(getHedgehogSpineStyle(hedgehog)).toBe('full')
    expect(createHedgehogSurfaceDecals()[0]).toMatchObject({ id: 'hedgehog-face-mask', targetPartId: 'primary' })

    const short = applyHedgehogSpineStyle(hedgehog, 'short')
    expect(short.filter(part => part.id.startsWith('spine-'))).toHaveLength(8)
    expect(getHedgehogSpineStyle(short)).toBe('short')
    expect(getHedgehogSpineSize(applyHedgehogSpineSize(hedgehog, 122))).toBe(122)
    expect(applyHedgehogSpineStyle(hedgehog, 'none').some(part => part.id.startsWith('spine-'))).toBe(false)

    const widened = applyHedgehogHeadScale(hedgehog, 123, 111)
    expect(Math.abs(widened.find(part => part.id === 'spine-0')!.x)).toBeGreaterThan(
      Math.abs(hedgehog.find(part => part.id === 'spine-0')!.x)
    )
    expect(widened.find(part => part.id === 'spine-core')!.scaleZ).toBeGreaterThan(.76)
    expect(getAvatarEntityPresetFaceStyle('hedgehog')?.eyeShape).toBe('rounded')
  })

  it('builds a truly volumetric lion mane with distinct male, female, and cub topologies', () => {
    const lion = createAvatarEntityParts('lion')
    const mane = lion.filter(part => part.id.startsWith('mane-'))

    expect(mane).toHaveLength(9)
    expect(mane.find(part => part.id === 'mane-back')?.scaleZ).toBeGreaterThan(.8)
    expect(mane.filter(part => part.id !== 'mane-back').every(part => (part.scaleZ ?? 0) >= .35)).toBe(true)
    expect(getLionManeStyle(lion)).toBe('full')
    expect(createLionSurfaceDecals()[0]).toMatchObject({ id: 'lion-face-mask', targetPartId: 'primary' })

    const lioness = applyLionManeStyle(lion, 'none')
    const cub = applyLionManeStyle(lioness, 'juvenile')
    expect(lioness.some(part => part.id.startsWith('mane-'))).toBe(false)
    expect(cub.filter(part => part.id.startsWith('mane-'))).toHaveLength(3)
    expect(getLionManeStyle(cub)).toBe('juvenile')
    expect(getLionManeSize(applyLionManeSize(lion, 126))).toBe(126)

    const widened = applyLionHeadScale(lion, 120, 108)
    expect(Math.abs(widened.find(part => part.id === 'mane-left')!.x)).toBeGreaterThan(101)
    expect(widened.find(part => part.id === 'mane-back')!.scaleZ).toBeGreaterThan(.87)
    expect(getAvatarEntityPresetFaceStyle('lion')?.eyeShape).toBe('rounded')
    expect(getAvatarEntityPresetScene('lion')?.viewState).toEqual({
      pitch: .4877,
      positionX: -95.8539,
      positionY: -43.7987,
      roll: .2,
      scale: 1.64,
      yaw: .5247
    })
  })

  it('keeps all semantically related tails, manes, and quills synchronized with their natural palette', () => {
    for (const { material, prefix, preset, paletteId } of [
      { material: 'tail', paletteId: 'red-squirrel', prefix: 'tail-', preset: 'squirrel' },
      { material: 'mane', paletteId: 'african-lion', prefix: 'mane-', preset: 'lion' },
      { material: 'spines', paletteId: 'european-hedgehog', prefix: 'spine-', preset: 'hedgehog' }
    ] as const) {
      const palette = getAvatarPalette(paletteId)
      const parts = applyAvatarEntityPalette(createAvatarEntityParts(preset), palette)
      const expected = palette.entityMaterials![material]!.baseColor

      expect(parts.filter(part => part.id.startsWith(prefix)).length).toBeGreaterThan(2)
      expect(parts.filter(part => part.id.startsWith(prefix)).every(part => part.baseColor === expected)).toBe(true)
    }
  })

  it('builds a broad three-dimensional tiger with rounded ears and a projected white muzzle', () => {
    const tiger = createAvatarEntityParts('tiger')
    const head = tiger.find(part => part.face)!

    expect(head.scaleX).toBeGreaterThan(head.scaleY)
    expect(head.scaleZ).toBeGreaterThan(.74)
    expect(tiger.filter(part => part.id.startsWith('ear-')).every(part => (
      part.shape === 'ellipse' && part.roundness === 100 && (part.scaleZ ?? 0) >= .2
    ))).toBe(true)
    expect(tiger.some(part => part.id === 'muzzle')).toBe(false)
    expect(createTigerSurfaceDecals()[0]).toMatchObject({ id: 'tiger-face-mask', targetPartId: 'primary' })

    const cub = applyTigerHeadScale(applyTigerEarScale(tiger, 124, 116), 88, 91)
    expect(getTigerEarScale(cub)).toEqual({ height: 116, width: 124 })
    expect(getTigerHeadScale(cub)).toEqual({ height: 91, width: 88 })
    expect(Math.abs(cub.find(part => part.id === 'ear-left')!.x)).toBeLessThan(75)
    expect(getAvatarEntityPresetFaceStyle('tiger')?.eyeShape).toBe('rounded')
  })

  it('builds a layered volumetric squirrel tail behind its head and keeps it attached while scaling', () => {
    const squirrel = createAvatarEntityParts('squirrel')
    const head = squirrel.find(part => part.face)!
    const tail = squirrel.filter(part => part.id.startsWith('tail-'))

    expect(tail).toHaveLength(3)
    expect(tail.every(part => part.z < head.z && (part.scaleZ ?? 0) >= .27)).toBe(true)
    expect(squirrel.filter(part => part.id.startsWith('cheek-'))).toHaveLength(2)
    expect(squirrel.filter(part => part.id.startsWith('ear-')).every(part => part.shape === 'cone')).toBe(true)
    expect(createSquirrelSurfaceDecals()[0]).toMatchObject({ id: 'squirrel-face-mask', targetPartId: 'primary' })
    expect(getSquirrelTailSize(applySquirrelTailSize(squirrel, 132))).toBe(132)

    const widened = applySquirrelHeadScale(squirrel, 124, 108)
    expect(widened.find(part => part.id === 'tail-base')!.x).toBeGreaterThan(88)
    expect(widened.find(part => part.id === 'tail-base')!.z).toBeLessThan(-61)
    expect(getAvatarEntityPresetFaceStyle('squirrel')?.eyeShape).toBe('rounded')
  })

  it('gives cows a genuine raised nose pad, separate nostrils, attached horns, and optional Highland bangs', () => {
    const cow = createAvatarEntityParts('cow')
    const snout = cow.find(part => part.id === 'snout')!
    const nostrils = cow.filter(part => part.id.startsWith('nostril-'))

    expect(snout.scaleZ).toBeGreaterThan(.24)
    expect(nostrils).toHaveLength(2)
    expect(nostrils.every(part => part.z > snout.z)).toBe(true)
    expect(getCowHornStyle(cow)).toBe('short')
    expect(getCowForelockStyle(cow)).toBe('soft')
    expect(createCowSurfaceDecals()[0]?.targetPartId).toBe('primary')
    expect(getAvatarEntityPresetFaceStyle('cow')).toMatchObject({ eyeShape: 'rounded', noseEnabled: false })

    const highland = applyCowForelockStyle(applyCowHornStyle(cow, 'highland'), 'highland')
    expect(highland.filter(part => part.id.startsWith('horn-'))).toHaveLength(4)
    expect(highland.filter(part => part.id.startsWith('forelock-'))).toHaveLength(3)
    expect(getCowForelockStyle(highland)).toBe('highland')
    expect(getCowHornSize(applyCowHornSize(highland, 126))).toBe(126)
    expect(applyCowHornStyle(highland, 'none').some(part => part.id.startsWith('horn-'))).toBe(false)

    const scaled = applyCowHeadScale(highland, 125, 110)
    expect(Math.abs(scaled.find(part => part.id === 'horn-left')!.x)).toBeGreaterThan(55)
    expect(Math.abs(scaled.find(part => part.id === 'nostril-left')!.x)).toBeGreaterThan(27)
    expect(scaled.find(part => part.id === 'snout')!.z).toBeGreaterThan(snout.z)
  })

  it('builds a long three-dimensional alpaca with a real fluffy forehead and attached short ears', () => {
    const parts = createAvatarEntityParts('alpaca')
    const head = parts.find(part => part.face)!
    const forelocks = parts.filter(part => part.id.startsWith('forelock-'))

    expect(head.scaleY).toBeGreaterThan(head.scaleX)
    expect(head.scaleZ).toBeGreaterThan(.65)
    expect(forelocks).toHaveLength(3)
    expect(forelocks.every(part => part.shape === 'sphere' && (part.scaleZ ?? 0) >= .27)).toBe(true)
    expect(parts.filter(part => part.id.startsWith('ear-')).every(part => part.shape === 'cone')).toBe(true)
    expect(createAlpacaSurfaceDecals()[0]).toMatchObject({ id: 'alpaca-face-mask', targetPartId: 'primary' })
    expect(parts.some(part => part.id === 'muzzle')).toBe(false)

    const scaled = applyAlpacaHeadScale(applyAlpacaEarScale(parts, 115, 108), 124, 112)
    expect(getAlpacaEarScale(scaled)).toEqual({ height: 108, width: 115 })
    expect(getAlpacaHeadScale(scaled)).toEqual({ height: 112, width: 124 })
    expect(Math.abs(scaled.find(part => part.id === 'ear-left')!.x)).toBeGreaterThan(55)
    expect(scaled.find(part => part.id === 'forelock-center')!.y).toBeLessThan(-88)
    expect(getAvatarEntityPresetFaceStyle('alpaca')?.eyeShape).toBe('rounded')
  })

  it('changes only the Cat ears when authoring ear size', () => {
    const base = createAvatarEntityParts('cat')
    const scaled = applyCatEarScale(base, 90, 86)
    const baseHead = base.find(part => part.id === 'cat-head')!
    const scaledHead = scaled.find(part => part.id === 'cat-head')!

    expect(scaledHead.scaleX).toBe(baseHead.scaleX)
    expect(scaledHead.scaleY).toBe(baseHead.scaleY)
    expect(getCatEarScale(scaled)).toEqual({ height: 86, width: 90 })
  })

  it('gives every built-in entity a distinct complete camera composition', () => {
    const presets = ['cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit', 'fox', 'bun'] as const
    const scenes = presets.map(preset => {
      const scene = getAvatarEntityPresetScene(preset)
      expect(scene).not.toBeNull()
      expect(scene?.cameraMode).toBe(true)
      expect(scene?.showAvatarShadow).toBe(true)
      expect(scene?.showOutline).toBe(true)
      return scene!
    })

    expect(new Set(scenes.map(scene => scene.cameraBackground)).size).toBe(scenes.length)
    expect(new Set(scenes.map(scene => JSON.stringify(scene.viewState))).size).toBe(scenes.length)
  })

  it('composes every built-in character off-center from an oblique viewing angle', () => {
    AVATAR_BUILT_IN_ENTITY_PRESETS.forEach(preset => {
      const scene = getAvatarEntityPresetScene(preset)

      expect(scene, `${preset} must own a complete authored scene`).not.toBeNull()
      expect(scene!.viewState.positionX, `${preset} must not be horizontally centered`).not.toBe(0)
      expect(
        Math.hypot(scene!.viewState.yaw, scene!.viewState.pitch),
        `${preset} must not face the camera straight on`
      ).toBeGreaterThan(0)
    })
  })

  it('defaults every animal to animation-friendly rounded eyes while preserving explicit ellipse overrides', () => {
    for (const preset of [
      'cat', 'dog', 'bear', 'rabbit', 'fox', 'hamster', 'capybara', 'otter', 'pig', 'deer', 'sheep'
    ] as const) {
      expect(getAvatarEntityPresetFaceStyle(preset)?.eyeShape, `${preset} should use rounded eyes`).toBe('rounded')
      expect(resolveAvatarEntityPresetFaceStyle(preset, { eyeShape: 'ellipse' })?.eyeShape).toBe('ellipse')
    }

    expect(resolveAvatarEntityPresetFaceStyle('bear', { noseShape: 'ellipse', noseHeight: 42 })?.noseShape)
      .toBe('ellipse')
  })

  it('keeps the custom entity on the generic preview scene', () => {
    expect(getAvatarEntityPresetScene('custom')).toBeNull()
  })

  it('restores the authored cat close-up', () => {
    const cat = getAvatarEntityPresetScene('cat')!

    expect(cat.cameraBackground).toBe('#111315')
    expect(cat.interactionMode).toBe('move')
    expect(cat.viewState).toEqual({
      pitch: -.1155,
      positionX: 72.5476,
      positionY: 121.0866,
      roll: -.16,
      scale: 2.3884,
      yaw: -.2538
    })
  })

  it('restores the authored cloud close-up and white material', () => {
    const cloudScene = getAvatarEntityPresetScene('cloud')!
    const cloudParts = createAvatarEntityParts('cloud')

    expect(cloudScene.cameraBackground).toBe('#87bfff')
    expect(cloudScene.interactionMode).toBe('move')
    expect(cloudScene.paletteId).toBe('white')
    expect(cloudScene.viewState).toEqual({
      pitch: -.3425,
      positionX: 100.6977,
      positionY: 112.9753,
      roll: -.12,
      scale: 1.6684,
      yaw: -.1836
    })
    expect(cloudParts.every(part => (
      part.baseColor === '#ffffff' &&
      part.foregroundColor === '#000000' &&
      part.highlightColor === '#ffffff' &&
      part.shadowColor === '#9ca3af'
    ))).toBe(true)
  })

  it('returns independent scene objects', () => {
    const firstDog = getAvatarEntityPresetScene('dog')!
    const secondDog = getAvatarEntityPresetScene('dog')!

    expect(firstDog).not.toBe(secondDog)
    expect(firstDog.avatarShadowStyle).not.toBe(secondDog.avatarShadowStyle)
    expect(firstDog.viewState).not.toBe(secondDog.viewState)
  })

  it('restores the authored Bun avatar as one complete built-in scene', () => {
    const bun = getAvatarEntityPresetScene('bun')!
    const face = getAvatarEntityPresetFaceStyle('bun')!
    const parts = createAvatarEntityParts('bun')

    expect(bun).toMatchObject({
      cameraBackground: '#f7f5ef',
      cameraFrame: 'rounded',
      cameraMode: true,
      gridDensity: 228,
      lightAzimuth: -32,
      lightDistance: 6,
      lightElevation: 46,
      paletteId: 'white',
      showLight: false,
      viewState: {
        pitch: -.0157,
        positionX: -60.6238,
        positionY: 42.0197,
        roll: .1906,
        scale: 2.4,
        yaw: -.0753
      }
    })
    expect(face).toMatchObject({
      eyeHighlight: {
        color: '#ffffff',
        enabled: true,
        offsetX: -20,
        offsetY: -22,
        opacity: 100,
        size: 36
      },
      eyeShape: 'ellipse',
      gap: 36,
      height: 28,
      mouthEnabled: false,
      noseEnabled: false,
      width: 28
    })
    expect(parts).toMatchObject([
      {
        id: 'bun-crown',
        scaleX: .5,
        scaleY: .23,
        scaleZ: .5,
        shape: 'cone'
      },
      {
        face: true,
        id: 'bun-body',
        scaleX: .7,
        scaleY: .5,
        scaleZ: .7,
        shape: 'sphere'
      }
    ])
    expect(bun.surfaceDecals).toHaveLength(6)
    expect(bun.surfaceDecals[0]).toMatchObject({
      id: 'bun-crown-pleats',
      shape: 'radial-pleats',
      targetPartId: 'bun-crown'
    })
    expect(bun.surfaceDecals.at(-1)).toMatchObject({
      id: 'claude-spark-official',
      shape: 'claude-spark',
      side: 'back',
      targetPartId: 'bun-body'
    })

    const secondBun = getAvatarEntityPresetScene('bun')!
    expect(bun.surfaceDecals).not.toBe(secondBun.surfaceDecals)
    expect(bun.surfaceDecals[0]).not.toBe(secondBun.surfaceDecals[0])
    expect(face.eyeHighlight).not.toBe(getAvatarEntityPresetFaceStyle('bun')!.eyeHighlight)
  })

  it('builds the fox from true pointed ears and paired face-attached cream markings', () => {
    const scene = getAvatarEntityPresetScene('fox')!
    const face = getAvatarEntityPresetFaceStyle('fox')!
    const parts = createAvatarEntityParts('fox')

    expect(scene).toMatchObject({
      cameraBackground: '#173d35',
      cameraMode: true,
      paletteId: 'red-fox',
      viewState: {
        pitch: -.2928,
        positionX: -83.4663,
        positionY: 95.6374,
        roll: .424,
        scale: 1.7697,
        yaw: .2109
      }
    })
    expect(parts).toMatchObject([
      { face: false, id: 'fox-ear-left', occludedByFace: true, shape: 'cone', x: -68 },
      { face: false, id: 'fox-ear-right', occludedByFace: true, shape: 'cone', x: 68 },
      { bottomTaper: 52, face: true, id: 'fox-head', shape: 'ellipse' }
    ])
    expect(scene.surfaceDecals).toMatchObject([
      { id: 'fox-inner-ear-left', shape: 'rounded-triangle', targetPartId: 'fox-ear-left' },
      { id: 'fox-inner-ear-right', shape: 'rounded-triangle', targetPartId: 'fox-ear-right' },
      { id: 'fox-cheek-left', shape: 'rounded-triangle', side: 'face', targetPartId: 'fox-head' },
      { id: 'fox-cheek-right', shape: 'rounded-triangle', side: 'face', targetPartId: 'fox-head' }
    ])
    expect(face).toMatchObject({ mouthEnabled: false, noseEnabled: true, noseShape: 'inverted-triangle' })
    expect(applyAvatarEntityPalette(parts, getAvatarPalette('red-fox'))).toEqual(parts)
  })

  it('scales true three-dimensional fox ears independently for large-eared and short-eared breeds', () => {
    const original = createAvatarEntityParts('fox')
    const fennec = applyFoxEarScale(applyFoxEarStyle(original, 'fennec'), 162, 178)
    const arctic = applyFoxEarScale(applyFoxEarStyle(original, 'rounded'), 72, 70)
    const originalEar = original.find(part => part.id === 'fox-ear-left')!
    const fennecEar = fennec.find(part => part.id === 'fox-ear-left')!
    const arcticEar = arctic.find(part => part.id === 'fox-ear-left')!

    expect(FOX_EAR_SCALE_RANGE).toEqual({ min: 55, max: 195 })
    expect(FOX_HEAD_SCALE_RANGE).toEqual({ min: 74, max: 134 })
    expect(getFoxEarScale(fennec)).toEqual({ height: 178, width: 162 })
    expect(getFoxEarScale(arctic)).toEqual({ height: 70, width: 72 })
    expect(getFoxEarStyle(fennec)).toBe('fennec')
    expect(getFoxEarStyle(arctic)).toBe('rounded')
    expect(getFoxEarStyle(original)).toBe('pointed')
    expect(fennecEar.scaleX).toBeGreaterThan(originalEar.scaleX * 1.6)
    expect(fennecEar.scaleY).toBeGreaterThan(originalEar.scaleY * 1.7)
    expect(arcticEar.roundness).toBeGreaterThan(originalEar.roundness!)
    expect(arcticEar.scaleY).toBeLessThan(originalEar.scaleY)
    expect(fennec.find(part => part.face)).toEqual(original.find(part => part.face))
    expect(arctic.find(part => part.face)).toEqual(original.find(part => part.face))
  })

  it('reattaches styled fox ears when its smooth tapered three-dimensional head changes size', () => {
    const original = createAvatarEntityParts('fox')
    const rounded = applyFoxEarScale(applyFoxEarStyle(original, 'rounded'), 74, 72)
    const compact = applyFoxHeadTaper(applyFoxHeadScale(rounded, 82, 88), 24)
    const wider = applyFoxHeadScale(compact, 122, 112)
    const head = wider.find(part => part.id === 'fox-head')!
    const left = wider.find(part => part.id === 'fox-ear-left')!
    const right = wider.find(part => part.id === 'fox-ear-right')!

    expect(getFoxHeadScale(compact)).toEqual({ height: 88, width: 82 })
    expect(getFoxHeadScale(wider)).toEqual({ height: 112, width: 122 })
    expect(getFoxEarScale(wider)).toEqual({ height: 72, width: 74 })
    expect(getFoxEarStyle(wider)).toBe('rounded')
    expect(left.x).toBeCloseTo(head.x - 62 * 1.22)
    expect(right.x).toBeCloseTo(head.x + 62 * 1.22)
    expect(left.y).toBeCloseTo(head.y + (-72 - 17) * 1.12)
    expect(right.y).toBeCloseTo(left.y)
    expect(getFoxHeadTaper(compact)).toBe(24)
    expect(getFoxHeadTaper(wider)).toBe(24)
    expect(getFoxHeadTaper(applyFoxHeadTaper(original, -50))).toBe(FOX_HEAD_TAPER_RANGE.min)
    expect(getFoxHeadTaper(applyFoxHeadTaper(original, 500))).toBe(FOX_HEAD_TAPER_RANGE.max)
    expect(getFoxHeadTaper(original)).toBe(52)
    expect(getAvatarEntityPresetScene('fox')!.viewState.positionX).toBe(-83.4663)
  })

  it('preserves authored fox markings by default and safely specializes attached cheeks and inner ears', () => {
    const authored = getAvatarEntityPresetScene('fox')!.surfaceDecals
    const original = createFoxSurfaceDecals()
    const arctic = createFoxSurfaceDecals({
      cheekColor: '#ffffff',
      cheekScale: 118,
      innerEarColor: '#f2d3d0',
      innerEarScale: 76
    })

    expect(original).toEqual(authored)
    expect(original).not.toBe(authored)
    expect(original[0]).not.toBe(authored[0])
    expect(arctic.find(decal => decal.id === 'fox-cheek-left')).toMatchObject({
      color: '#ffffff',
      height: 156,
      targetPartId: 'fox-head',
      width: 151
    })
    expect(arctic.find(decal => decal.id === 'fox-inner-ear-right')).toMatchObject({
      color: '#f2d3d0',
      height: 82,
      targetPartId: 'fox-ear-right',
      width: 58
    })
    expect(createFoxSurfaceDecals({ cheekColor: 'invalid', cheekScale: 999 })[2]).toMatchObject({
      color: '#fff8ec',
      height: 191,
      targetPartId: 'fox-head',
      width: 186
    })
    expect(getAvatarEntityPresetScene('fox')!.surfaceDecals).toEqual(authored)
  })

  it('builds a hamster with real rounded ears and raised three-dimensional cheeks', () => {
    const scene = getAvatarEntityPresetScene('hamster')!
    const face = getAvatarEntityPresetFaceStyle('hamster')!
    const parts = createAvatarEntityParts('hamster')

    expect(scene.paletteId).toBe('syrian-hamster')
    expect(parts).toMatchObject([
      { face: false, id: 'ear-left', occludedByFace: true, shape: 'ellipse' },
      { face: false, id: 'ear-right', occludedByFace: true, shape: 'ellipse' },
      { face: true, id: 'primary', shape: 'ellipse' },
      { face: false, id: 'cheek-left', shape: 'ellipse', z: 44 },
      { face: false, id: 'cheek-right', shape: 'ellipse', z: 44 }
    ])
    expect(face).toMatchObject({ noseEnabled: true, noseHeight: 10, noseShape: 'ellipse', noseWidth: 14 })

    const scaledEars = applyHamsterEarScale(parts, 112, 92)
    const scaledHead = applyHamsterHeadScale(scaledEars, 120, 110)

    expect(getHamsterEarScale(scaledHead)).toEqual({ height: 92, width: 112 })
    expect(getHamsterHeadScale(scaledHead)).toEqual({ height: 110, width: 120 })
    expect(scaledHead.find(part => part.id === 'ear-left')?.x).toBeCloseTo(-80.4)
    expect(scaledHead.find(part => part.id === 'cheek-left')?.x).toBeCloseTo(-72)
  })

  it('separates true cheek and muzzle volume from painted fur across every affected breed and tone', () => {
    for (const { anatomyIds, createDecals, paletteIds, preset } of [
      {
        anatomyIds: ['cheek-left', 'cheek-right'],
        createDecals: createHamsterSurfaceDecals,
        paletteIds: ['syrian-hamster', 'pudding-hamster', 'silver-fox-hamster', 'sapphire-hamster'],
        preset: 'hamster'
      },
      {
        anatomyIds: ['muzzle'],
        createDecals: createCapybaraSurfaceDecals,
        paletteIds: ['capybara', 'sandy-capybara', 'dark-capybara', 'capybara-pup'],
        preset: 'capybara'
      },
      {
        anatomyIds: ['cheek-left', 'cheek-right'],
        createDecals: createSquirrelSurfaceDecals,
        paletteIds: ['red-squirrel', 'gray-squirrel', 'chipmunk', 'black-squirrel'],
        preset: 'squirrel'
      }
    ] as const) {
      const authored = createAvatarEntityParts(preset)
      const authoredHead = authored.find(part => part.face)!

      for (const anatomyId of anatomyIds) {
        const part = authored.find(candidate => candidate.id === anatomyId)!
        expect(part.scaleZ, `${preset}/${anatomyId} must retain real anatomical volume`).toBeGreaterThan(.19)
        expect(part, `${preset}/${anatomyId} cannot encode its fur marking as a separate material`)
          .toMatchObject({
            baseColor: authoredHead.baseColor,
            foregroundColor: authoredHead.foregroundColor,
            highlightColor: authoredHead.highlightColor,
            shadowColor: authoredHead.shadowColor
          })
      }

      for (const paletteId of paletteIds) {
        for (const amount of [-14, 0, 14]) {
          const palette = applyAvatarPaletteToneJitter(getAvatarPalette(paletteId), amount)
          const parts = applyAvatarEntityPalette(authored, palette)
          const head = parts.find(part => part.face)!
          const decals = createDecals({ color: palette.coat?.patch })

          for (const anatomyId of anatomyIds) {
            const anatomy = parts.find(part => part.id === anatomyId)!
            const marking = decals.find(decal => decal.targetPartId === anatomyId)

            expect(anatomy, `${paletteId} at ${amount} cannot recolor its anatomical volume`).toMatchObject({
              baseColor: head.baseColor,
              foregroundColor: head.foregroundColor,
              highlightColor: head.highlightColor,
              shadowColor: head.shadowColor
            })
            expect(marking, `${paletteId}/${anatomyId} must carry its marking on the actual curved surface`)
              .toMatchObject({ color: palette.coat?.patch, side: 'front', targetPartId: anatomyId })
            expect(marking?.color).not.toBe(head.baseColor)
          }
        }
      }
    }

    expect(createHamsterSurfaceDecals({ color: '#edddbe', innerEarColor: '#d98a8b' }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ color: '#d98a8b', targetPartId: 'ear-left' }),
        expect.objectContaining({ color: '#edddbe', targetPartId: 'cheek-left' })
      ]))
    expect(createSquirrelSurfaceDecals()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'squirrel-face-mask', targetPartId: 'primary' }),
      expect.objectContaining({ id: 'squirrel-cheek-left', targetPartId: 'cheek-left' }),
      expect.objectContaining({ id: 'squirrel-cheek-right', targetPartId: 'cheek-right' })
    ]))
  })

  it('never encodes fur-only masks, patches, stripes, or inner-ear markings as standalone anatomy', () => {
    for (const preset of AVATAR_BUILT_IN_ENTITY_PRESETS) {
      const parts = createAvatarEntityParts(preset)
      const head = parts.find(part => part.face)

      expect(parts.filter(part => /(?:face-mask|fur-mark|inner-ear|stripe|spot|patch)/.test(part.id)),
        `${preset} markings must be projected decals rather than separate entity shapes`).toHaveLength(0)

      for (const part of parts.filter(candidate => (
        candidate.id === 'cheek-left' || candidate.id === 'cheek-right' || candidate.id === 'muzzle'
      ))) {
        expect(part.baseColor, `${preset}/${part.id} must share its fur foundation with the head`)
          .toBe(head?.baseColor)
      }
    }

    for (const preset of ['pig', 'cow'] as const) {
      const parts = createAvatarEntityParts(preset)
      const head = parts.find(part => part.face)!
      const snout = parts.find(part => part.id === 'snout')!

      expect(snout.baseColor, `${preset} exposed nose tissue retains its true independent material`)
        .not.toBe(head.baseColor)
      expect(parts.filter(part => part.id.startsWith('nostril-'))).toHaveLength(2)
    }
  })

  it('migrates old accent-colored cheek and muzzle anatomy without losing their three-dimensional shape', () => {
    for (const { anatomyIds, normalize, preset } of [
      { anatomyIds: ['cheek-left', 'cheek-right'], normalize: normalizeHamsterEntityParts, preset: 'hamster' },
      { anatomyIds: ['cheek-left', 'cheek-right'], normalize: normalizeSquirrelEntityParts, preset: 'squirrel' },
      { anatomyIds: ['muzzle'], normalize: normalizeCapybaraEntityParts, preset: 'capybara' }
    ] as const) {
      const authored = createAvatarEntityParts(preset)
      const oldParts = authored.map(part => anatomyIds.some(id => id === part.id)
        ? {
            ...part,
            baseColor: '#f6e5ce',
            foregroundColor: '#493426',
            highlightColor: '#fff2de',
            shadowColor: '#ae987d',
            ...(preset === 'capybara' ? { scaleZ: .26, z: 57 } : {})
          }
        : part)

      for (const migrated of [
        normalize(oldParts),
        deserializeAvatarEntityParts(serializeAvatarEntityParts(oldParts), preset)
      ]) {
        const head = migrated.find(part => part.face)!

        for (const anatomyId of anatomyIds) {
          const part = migrated.find(candidate => candidate.id === anatomyId)!

          expect(part).toMatchObject({
            baseColor: head.baseColor,
            foregroundColor: head.foregroundColor,
            highlightColor: head.highlightColor,
            shadowColor: head.shadowColor
          })
          expect(part.scaleZ).toBeGreaterThan(.19)

          if (preset === 'capybara') {
            expect(part.scaleZ).toBe(.48)
            expect(part.z).toBe(76)
          }
        }
      }
    }
  })

  it('keeps the capybara’s genuinely broad projecting muzzle as three-dimensional anatomy', () => {
    const parts = createAvatarEntityParts('capybara')
    const head = parts.find(part => part.face)!
    const muzzle = parts.find(part => part.id === 'muzzle')!
    const scaled = applyCapybaraHeadScale(parts, 120, 112)
    const scaledMuzzle = scaled.find(part => part.id === 'muzzle')!

    expect(head.shape).toBe('trapezoid')
    expect(muzzle).toMatchObject({ face: false, scaleZ: .48, shape: 'capsule' })
    expect(muzzle.z).toBeGreaterThan(head.z)
    expect(scaled.find(part => part.id === 'ear-left')!.x).toBeLessThan(parts.find(part => part.id === 'ear-left')!.x)
    expect(scaledMuzzle.y).toBeGreaterThan(muzzle.y)
    expect(deserializeAvatarEntityParts(serializeAvatarEntityParts(parts), 'capybara'))
      .toContainEqual(expect.objectContaining({ id: 'muzzle', scaleZ: .48 }))
    expect(createCapybaraSurfaceDecals()).toEqual(getAvatarEntityPresetScene('capybara')?.surfaceDecals)
  })

  it('paints otter, deer, and sheep face color directly onto their real curved head surfaces', () => {
    for (const { createDecals, preset } of [
      { createDecals: createOtterSurfaceDecals, preset: 'otter' },
      { createDecals: createDeerSurfaceDecals, preset: 'deer' },
      { createDecals: createSheepSurfaceDecals, preset: 'sheep' }
    ] as const) {
      const parts = createAvatarEntityParts(preset)
      const scene = getAvatarEntityPresetScene(preset)!
      const original = createDecals()
      const styled = createDecals({
        color: '#f5e7cf', height: 1000, opacity: -2, shape: 'rounded-triangle', width: 300, x: -400, y: 400
      })

      expect(parts.some(part => part.id === 'muzzle'), `${preset} cannot use a floating color-only muzzle`).toBe(false)
      expect(original).toEqual(scene.surfaceDecals)
      expect(original[0]).not.toBe(scene.surfaceDecals[0])
      expect(original[0]).toMatchObject({
        id: `${preset}-face-mask`, shape: 'face-mask', side: 'face', targetPartId: 'primary'
      })
      expect(styled[0]).toMatchObject({
        color: '#f5e7cf', height: 340, opacity: 0, shape: 'rounded-triangle', targetPartId: 'primary',
        width: 240, x: -180, y: 180
      })
      expect(createDecals({ color: 'not-a-color' })[0]?.color).toBe(original[0]?.color)
    }

    const scaledOtter = applyOtterHeadScale(createAvatarEntityParts('otter'), 120, 112)
    expect(scaledOtter.find(part => part.id === 'ear-left')!.x).toBeLessThan(-69)
    expect(scaledOtter.some(part => part.id === 'muzzle')).toBe(false)
  })

  it('migrates old floating face-color geometry without stripping the capybara or pig anatomy', () => {
    const oldMuzzle = createAvatarEntityParts('capybara').find(part => part.id === 'muzzle')!

    for (const { normalize, preset } of [
      { normalize: normalizeOtterEntityParts, preset: 'otter' },
      { normalize: normalizeDeerEntityParts, preset: 'deer' },
      { normalize: normalizeSheepEntityParts, preset: 'sheep' }
    ] as const) {
      const legacyParts = [...createAvatarEntityParts(preset), oldMuzzle]
      expect(normalize(legacyParts).some(part => part.id === 'muzzle')).toBe(false)
      expect(deserializeAvatarEntityParts(serializeAvatarEntityParts(legacyParts), preset)
        .some(part => part.id === 'muzzle')).toBe(false)
    }

    expect(createAvatarEntityParts('capybara').some(part => part.id === 'muzzle')).toBe(true)
    expect(createAvatarEntityParts('pig').filter(part => (
      part.id === 'snout' || part.id.startsWith('nostril-')
    ))).toHaveLength(3)
    expect(createAvatarEntityParts('hamster').filter(part => part.id.startsWith('cheek-'))).toHaveLength(2)
  })

  it('restores real sheep thickness from old muzzle links without overwriting modern custom depth', () => {
    const oldMuzzle = createAvatarEntityParts('capybara').find(part => part.id === 'muzzle')!
    const authored = applySheepHornSize(
      applySheepHornStyle(createAvatarEntityParts('sheep'), 'curled'),
      125
    )
    const widthScale = 1.18
    const heightScale = .9
    const depthScale = Math.sqrt(widthScale * heightScale)
    const oldParts = applySheepHeadScale(authored, widthScale * 100, heightScale * 100).map(part => ({
      ...part,
      ...(part.face
        ? { scaleZ: .65 * depthScale }
        : part.id.startsWith('wool-')
          ? { scaleZ: .25 * depthScale, z: -19 }
          : part.id.startsWith('ear-')
            ? { scaleZ: .17 * depthScale, z: -8 }
            : part.id.startsWith('horn-')
              ? { scaleZ: .15 * 1.25 * depthScale, z: 8 }
              : {})
    }))
    const migrated = deserializeAvatarEntityParts(
      serializeAvatarEntityParts([...oldParts, oldMuzzle]),
      'sheep'
    )

    expect(migrated.some(part => part.id === 'muzzle')).toBe(false)
    expect(migrated.find(part => part.face)).toMatchObject({
      scaleX: .68 * widthScale,
      scaleY: .73 * heightScale
    })
    expect(migrated.find(part => part.face)?.scaleZ).toBeCloseTo(.82 * depthScale)
    expect(migrated.find(part => part.id === 'wool-crown-center')?.scaleZ).toBeCloseTo(.37 * depthScale)
    expect(migrated.find(part => part.id === 'ear-left')?.scaleZ).toBeCloseTo(.24 * depthScale)
    expect(migrated.find(part => part.id === 'horn-left')?.scaleZ).toBeCloseTo(.22 * 1.25 * depthScale)
    expect(migrated.find(part => part.id === 'horn-left')?.z).toBeCloseTo(12 * depthScale)
    expect(migrated.filter(part => part.id.startsWith('horn-'))).toHaveLength(8)

    const modernCustomDepth = createAvatarEntityParts('sheep').map(part => (
      part.face ? { ...part, scaleZ: .59 } : part
    ))
    expect(normalizeSheepEntityParts(modernCustomDepth).find(part => part.face)?.scaleZ).toBe(.59)
    expect(deserializeAvatarEntityParts(serializeAvatarEntityParts(modernCustomDepth), 'sheep')
      .find(part => part.face)?.scaleZ).toBe(.59)
  })

  it('builds a projecting pig snout and two independent depth-sorted nostrils', () => {
    const parts = createAvatarEntityParts('pig')
    const snout = parts.find(part => part.id === 'snout')!
    const nostrils = parts.filter(part => part.id.startsWith('nostril-'))

    expect(snout).toMatchObject({ face: false, shape: 'ellipse', z: 62 })
    expect(nostrils).toHaveLength(2)
    expect(nostrils.every(part => part.shape === 'ellipse' && part.z > snout.z && (part.scaleZ ?? 0) > 0)).toBe(true)
    expect(getAvatarEntityPresetFaceStyle('pig')?.noseEnabled).toBe(false)

    const scaled = applyPigHeadScale(parts, 120, 112)
    expect(scaled.find(part => part.id === 'nostril-left')?.x).toBeCloseTo(-25.2)
    expect(scaled.find(part => part.id === 'nostril-right')?.x).toBeCloseTo(25.2)
    expect(scaled.find(part => part.id === 'snout')!.y).toBeGreaterThan(snout.y)
  })

  it('authors removable, branched, scalable deer antlers that stay attached to the head', () => {
    const parts = createAvatarEntityParts('deer')
    const antlers = parts.filter(part => part.id.startsWith('antler-'))
    expect(antlers).toHaveLength(6)
    expect(antlers.every(part => part.shape === 'capsule' && (part.scaleZ ?? 0) > 0)).toBe(true)
    expect(parts.find(part => part.face)).toMatchObject({ bottomTaper: 24, shape: 'ellipse' })

    const none = applyDeerAntlerStyle(parts, 'none')
    expect(none.some(part => part.id.startsWith('antler-'))).toBe(false)
    expect(applyDeerAntlerStyle(none, 'spike').filter(part => part.id.startsWith('antler-'))).toHaveLength(2)
    expect(applyDeerAntlerStyle(none, 'forked').filter(part => part.id.startsWith('antler-'))).toHaveLength(4)
    expect(applyDeerAntlerStyle(none, 'branched').filter(part => part.id.startsWith('antler-'))).toHaveLength(6)

    const reindeer = applyDeerAntlerStyle(none, 'reindeer')
    expect(reindeer.filter(part => part.id.startsWith('antler-'))).toHaveLength(8)
    expect(reindeer.find(part => part.id === 'antler-left-branch-3')?.scaleZ).toBeGreaterThan(0)

    const resized = applyDeerAntlerSize(reindeer, 125)
    expect(getDeerAntlerSize(resized)).toBe(125)
    expect(resized.find(part => part.id === 'antler-left-branch-3')!.x)
      .toBeLessThan(reindeer.find(part => part.id === 'antler-left-branch-3')!.x)

    const scaledHead = applyDeerHeadScale(resized, 120, 110)
    expect(scaledHead.find(part => part.id === 'antler-left')!.x)
      .toBeLessThan(resized.find(part => part.id === 'antler-left')!.x)
    expect(scaledHead.find(part => part.id === 'antler-left-branch-3')!.x)
      .toBeLessThan(resized.find(part => part.id === 'antler-left-branch-3')!.x)
  })

  it('builds sculpted three-dimensional sheep wool and optional curved, curled, or straight horns', () => {
    const parts = createAvatarEntityParts('sheep')
    const head = parts.find(part => part.face)!
    const wool = parts.filter(part => part.id.startsWith('wool-'))
    const ears = parts.filter(part => part.id.startsWith('ear-'))

    expect(head.scaleZ).toBe(.82)
    expect(head.scaleZ!).toBeGreaterThan(head.scaleX)
    expect(wool).toHaveLength(5)
    expect(wool.every(part => part.shape === 'sphere' && (part.scaleZ ?? 0) >= Math.min(part.scaleX, part.scaleY)))
      .toBe(true)
    expect(ears.every(part => (part.scaleZ ?? 0) >= part.scaleX)).toBe(true)
    expect(parts.some(part => part.id.startsWith('horn-'))).toBe(false)

    const curved = applySheepHornStyle(parts, 'curved')
    const curled = applySheepHornStyle(parts, 'curled')
    const straight = applySheepHornStyle(parts, 'straight')
    expect(curved.filter(part => part.id.startsWith('horn-'))).toHaveLength(4)
    expect(curled.filter(part => part.id.startsWith('horn-'))).toHaveLength(8)
    expect(straight.filter(part => part.id.startsWith('horn-'))).toHaveLength(2)
    expect(straight.find(part => part.id === 'horn-left')?.rotationZ).toBe(-12)
    expect(applySheepHornStyle(curled, 'none').some(part => part.id.startsWith('horn-'))).toBe(false)

    const resized = applySheepHornSize(curled, 130)
    expect(getSheepHornSize(resized)).toBe(130)
    const scaledHead = applySheepHeadScale(resized, 118, 110)
    const depthFactor = Math.sqrt(1.18 * 1.1)

    expect(scaledHead.find(part => part.face)?.scaleZ).toBeCloseTo(.82 * depthFactor)
    expect(scaledHead.find(part => part.id === 'wool-crown-center')?.scaleZ).toBeCloseTo(.37 * depthFactor)
    expect(scaledHead.find(part => part.id === 'ear-left')?.scaleZ).toBeCloseTo(.24 * depthFactor)
    expect(scaledHead.find(part => part.id === 'horn-left')?.scaleZ).toBeCloseTo(.22 * 1.3 * depthFactor)
    expect(scaledHead.find(part => part.id === 'wool-crown-center')?.z).toBeCloseTo(-15 * depthFactor)
    expect(scaledHead.find(part => part.id === 'horn-left')?.z).toBeCloseTo(12 * depthFactor)
    expect(scaledHead.find(part => part.id === 'horn-left')!.x)
      .toBeLessThan(resized.find(part => part.id === 'horn-left')!.x)
    expect(scaledHead.find(part => part.id === 'wool-side-left')!.x)
      .toBeLessThan(parts.find(part => part.id === 'wool-side-left')!.x)

    const resizedAgain = applySheepHeadScale(scaledHead, 86, 92)
    const nextDepthFactor = Math.sqrt(.86 * .92)
    expect(resizedAgain.find(part => part.face)?.scaleZ).toBeCloseTo(.82 * nextDepthFactor)
    expect(resizedAgain.find(part => part.id === 'horn-left')?.scaleZ).toBeCloseTo(.22 * 1.3 * nextDepthFactor)
  })

  it('lets antler and horn segments inherit semantic root materials from breed palettes', () => {
    const deer = applyAvatarEntityPalette(
      applyDeerAntlerStyle(createAvatarEntityParts('deer'), 'reindeer'),
      getAvatarPalette('reindeer')
    )
    const sheep = applyAvatarEntityPalette(
      applySheepHornStyle(createAvatarEntityParts('sheep'), 'curled'),
      getAvatarPalette('horned-ram')
    )

    expect(deer.find(part => part.id === 'antler-left-branch-3')?.baseColor)
      .toBe(deer.find(part => part.id === 'antler-left')?.baseColor)
    expect(sheep.find(part => part.id === 'horn-right-segment-3')?.baseColor)
      .toBe(sheep.find(part => part.id === 'horn-right')?.baseColor)
    expect(sheep.find(part => part.id === 'horn-right')?.baseColor)
      .not.toBe(sheep.find(part => part.face)?.baseColor)
  })

  it('supports safe breed-specific face overrides without mutating the shared entity face', () => {
    const original = getAvatarEntityPresetFaceStyle('bear')!
    const koala = resolveAvatarEntityPresetFaceStyle('bear', {
      noseEnabled: true,
      noseHeight: 42,
      noseShape: 'ellipse',
      noseWidth: 32,
      noseY: 30
    })!

    expect(koala).toMatchObject({ noseEnabled: true, noseHeight: 42, noseShape: 'ellipse', noseWidth: 32, noseY: 30 })
    expect(getAvatarEntityPresetFaceStyle('bear')).toEqual(original)
    expect(resolveAvatarEntityPresetFaceStyle('bear', {
      noseHeight: 1000,
      noseWidth: Number.NaN,
      noseY: -1000
    })).toMatchObject({ noseHeight: 48, noseWidth: original.noseWidth, noseY: -10 })
    expect(resolveAvatarEntityPresetFaceStyle('custom', { noseEnabled: true })).toBeNull()
  })

  it('round-trips ellipse taper while leaving older part tuples untapered', () => {
    const parts = createAvatarEntityParts('fox')
    const serialized = serializeAvatarEntityParts(parts)
    const tuples = JSON.parse(serialized) as unknown[][]

    expect(tuples.find(tuple => tuple[0] === 'fox-head')?.[24]).toBe(52)
    expect(deserializeAvatarEntityParts(serialized, 'fox')
      .find(part => part.id === 'fox-head')?.bottomTaper).toBe(52)

    const oldTuples = JSON.stringify(tuples.map(tuple => tuple.slice(0, 24)))
    expect(deserializeAvatarEntityParts(oldTuples, 'fox')
      .find(part => part.id === 'fox-head')?.bottomTaper ?? 0).toBe(0)

    const invalidTuples = tuples.map(tuple => tuple[0] === 'fox-head' ? [...tuple.slice(0, 24), 160] : tuple)
    expect(deserializeAvatarEntityParts(JSON.stringify(invalidTuples), 'fox')
      .find(part => part.id === 'fox-head')?.bottomTaper).toBe(100)
  })

  it('round-trips optional node-tree group metadata without changing legacy tuples', () => {
    const parts = createAvatarEntityParts('fox').map((part, index) => index === 0
      ? { ...part, groupId: 'features', groupLabel: 'Features' }
      : part)
    const serialized = serializeAvatarEntityParts(parts)
    const tuples = JSON.parse(serialized) as unknown[][]

    expect(tuples[0]?.slice(25, 27)).toEqual(['features', 'Features'])
    expect(deserializeAvatarEntityParts(serialized, 'fox')[0]).toMatchObject({
      groupId: 'features',
      groupLabel: 'Features'
    })
    expect(deserializeAvatarEntityParts(JSON.stringify(tuples.map(tuple => tuple.slice(0, 25))), 'fox')[0])
      .not.toHaveProperty('groupId')
  })

  it('round-trips empty node-tree groups independently from entity parts', () => {
    const groups = [
      { id: 'face-details', label: 'Face details' },
      { id: 'empty-group', label: 'Empty group' }
    ]

    expect(deserializeAvatarEntityGroups(serializeAvatarEntityGroups(groups))).toEqual(groups)
    expect(deserializeAvatarEntityGroups(JSON.stringify([
      ['face-details', 'Face details'],
      ['face-details', 'Duplicate'],
      ['', 'Invalid'],
      ['empty-group', 'Empty group']
    ]))).toEqual(groups)
    expect(deserializeAvatarEntityGroups('not-json')).toEqual([])
  })

  it('applies a palette to every part of a multipart entity', () => {
    const palette = getAvatarPalette('signal')
    const cloud = createAvatarEntityParts('cloud')
    const recolored = applyAvatarEntityPalette(cloud, palette)

    expect(recolored).toHaveLength(cloud.length)
    expect(recolored.every(part => (
      part.baseColor === palette.background &&
      part.foregroundColor === palette.foreground &&
      part.highlightColor === palette.gradient[0] &&
      part.shadowColor === palette.shadow
    ))).toBe(true)
    expect(recolored[0]).not.toBe(cloud[0])
  })

  it('applies semantic Siamese materials to cat parts and falls back for other entities', () => {
    const palette = getAvatarPalette('siamese')
    const cat = applyAvatarEntityPalette(createAvatarEntityParts('cat'), palette)
    const cloud = applyAvatarEntityPalette(createAvatarEntityParts('cloud'), palette)
    expect(cat.find(part => part.id === 'cat-head')?.baseColor).toBe('#ead7b8')
    expect(cat.filter(part => part.id.startsWith('cat-ear')).every(part => part.baseColor === '#3c2118')).toBe(true)
    expect(cloud.every(part => part.baseColor === palette.background)).toBe(true)
  })

  it('detects authored material differences before overwriting them', () => {
    const palette = getAvatarPalette('white')
    const cloud = createAvatarEntityParts('cloud')
    const dog = createAvatarEntityParts('dog')
    const rabbit = createAvatarEntityParts('rabbit')
    const recoloredDog = applyAvatarEntityPalette(dog, palette)

    expect(hasMultipleAvatarEntityMaterials(cloud)).toBe(false)
    expect(hasMultipleAvatarEntityMaterials(dog)).toBe(true)
    expect(hasMultipleAvatarEntityMaterials(rabbit)).toBe(false)
    expect(hasMultipleAvatarEntityMaterials(recoloredDog)).toBe(false)
  })

  it('builds the rabbit from tapered rounded ears and a taller rounded head', () => {
    const rabbit = createAvatarEntityParts('rabbit')
    const ears = rabbit.filter(part => !part.face)
    const head = rabbit.find(part => part.face)

    expect(rabbit).toHaveLength(3)
    expect(rabbit.some(part => part.id.startsWith('inner-ear'))).toBe(false)
    expect(ears.every(part => (
      part.shape === 'trapezoid' &&
      part.roundness === 100 &&
      part.topScale === .9
    ))).toBe(true)
    expect(head).toMatchObject({
      roundness: 100,
      scaleX: .72,
      scaleY: .74,
      shape: 'trapezoid',
      topScale: .94
    })
  })

  it('uses the carrot-orange authored rabbit camera scene', () => {
    const rabbit = getAvatarEntityPresetScene('rabbit')!

    expect(rabbit.cameraBackground).toBe('#f08c46')
    expect(rabbit.avatarShadowStyle.color).toBe('#9b451f')
    expect(rabbit.viewState).toEqual({
      pitch: -.2275,
      positionX: 82.7852,
      positionY: 116.8548,
      roll: -.4163,
      scale: 1.8604,
      yaw: .0827
    })
  })

  it('uses the clean large-eye face on the rabbit', () => {
    const rabbit = getAvatarEntityPresetFaceStyle('rabbit')!

    expect(rabbit).toMatchObject({
      gap: 40,
      height: 64,
      leftEyeRotation: 0,
      mouthEnabled: false,
      noseEnabled: false,
      rightEyeRotation: 0,
      width: 28
    })
  })

  it('keeps every built-in entity on the large default eye size', () => {
    const presets = ['cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit'] as const

    for (const preset of presets) {
      expect(getAvatarEntityPresetFaceStyle(preset)).toMatchObject({
        height: DEFAULT_AVATAR_FACE_STYLE.height,
        width: DEFAULT_AVATAR_FACE_STYLE.width
      })
    }
  })
})
