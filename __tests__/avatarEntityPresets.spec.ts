import { describe, expect, it } from 'vitest'

import { getAvatarPalette } from '@oneworks/avatar'

import {
  AVATAR_BUILT_IN_ENTITY_PRESETS,
  applyCapybaraHeadScale,
  applyCatEarScale,
  applyDeerAntlerSize,
  applyDeerAntlerStyle,
  applyDeerHeadScale,
  applyFoxEarScale,
  applyFoxEarStyle,
  applyFoxHeadScale,
  applyFoxHeadTaper,
  applyHamsterEarScale,
  applyHamsterHeadScale,
  applyOtterHeadScale,
  applyPigHeadScale,
  applySheepHeadScale,
  applySheepHornSize,
  applySheepHornStyle,
  applyAvatarEntityPalette,
  createAvatarEntityParts,
  createDeerSurfaceDecals,
  createFoxSurfaceDecals,
  createOtterSurfaceDecals,
  createSheepSurfaceDecals,
  deserializeAvatarEntityParts,
  FOX_EAR_SCALE_RANGE,
  FOX_HEAD_SCALE_RANGE,
  FOX_HEAD_TAPER_RANGE,
  getCatEarScale,
  getDeerAntlerSize,
  getFoxEarScale,
  getFoxEarStyle,
  getFoxHeadScale,
  getFoxHeadTaper,
  getHamsterEarScale,
  getHamsterHeadScale,
  getSheepHornSize,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene,
  hasMultipleAvatarEntityMaterials,
  normalizeDeerEntityParts,
  normalizeOtterEntityParts,
  normalizeSheepEntityParts,
  resolveAvatarEntityPresetFaceStyle,
  serializeAvatarEntityParts
} from '../src/avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'

describe('built-in entity preset scenes', () => {
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

  it('keeps the capybara’s genuinely broad projecting muzzle as three-dimensional anatomy', () => {
    const parts = createAvatarEntityParts('capybara')
    const head = parts.find(part => part.face)!
    const muzzle = parts.find(part => part.id === 'muzzle')!
    const scaled = applyCapybaraHeadScale(parts, 120, 112)
    const scaledMuzzle = scaled.find(part => part.id === 'muzzle')!

    expect(head.shape).toBe('trapezoid')
    expect(muzzle).toMatchObject({ face: false, scaleZ: .26, shape: 'capsule' })
    expect(muzzle.z).toBeGreaterThan(head.z)
    expect(scaled.find(part => part.id === 'ear-left')!.x).toBeLessThan(parts.find(part => part.id === 'ear-left')!.x)
    expect(scaledMuzzle.y).toBeGreaterThan(muzzle.y)
    expect(deserializeAvatarEntityParts(serializeAvatarEntityParts(parts), 'capybara'))
      .toContainEqual(expect.objectContaining({ id: 'muzzle', scaleZ: .26 }))
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
