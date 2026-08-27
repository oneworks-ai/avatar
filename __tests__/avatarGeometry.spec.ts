import { describe, expect, it } from 'vitest'

import {
  AVATAR_GRID_DENSITY,
  DEFAULT_AVATAR_FACE_STYLE,
  buildAvatarBodyGeometry,
  buildAvatarSurfaceDecalLocalBoundaries,
  getAvatarBodyCompilerShapeSpec,
  mapAvatarPrimitiveLocalPointToAuthoredSurface,
  projectAvatarSurfaceDecal,
  projectDefaultFace,
  resolveAvatarSurfaceShadeOpacity
} from '../src/avatarGeometry'
import { AVATAR_FACE_PRESETS } from '../src/avatarFacePresets'
import {
  applySheepHeadScale,
  createAvatarEntityParts,
  createCapybaraSurfaceDecals,
  createCowSurfaceDecals,
  createMonkeySurfaceDecals,
  createOwlSurfaceDecals,
  createParrotSurfaceDecals,
  createSheepSurfaceDecals
} from '../src/avatarEntityPresets'

const POSE = { pitch: -.35, yaw: .4 }
const LIGHT = { azimuth: -92, elevation: 64 }

it('maps rotated half-cone and side surfaces back to the authored decal chart', () => {
  const roundness = 42
  const exponent = 1 + (.56 - 1) * roundness / 100
  const ring = .5 ** exponent
  const authoredX = .2
  const cutAngle = Math.PI / 3
  const longitude = cutAngle + Math.asin(authoredX / ring)
  const halfCone = mapAvatarPrimitiveLocalPointToAuthoredSurface(
    'half-cone',
    { x: ring * Math.sin(longitude), y: 0, z: ring * Math.cos(longitude) },
    'front',
    { cutAngle: 60, roundness }
  )
  expect(halfCone.x).toBeCloseTo(authoredX, 6)
  expect(halfCone.y).toBe(0)
  expect(halfCone.frontDepth).toBeGreaterThan(0)

  const sideFacingHalfCone = mapAvatarPrimitiveLocalPointToAuthoredSurface(
    'half-cone',
    { x: ring, y: 0, z: 0 },
    'front',
    { cutAngle: 90, roundness }
  )
  expect(sideFacingHalfCone.x).toBeCloseTo(0, 6)
  expect(sideFacingHalfCone.frontDepth).toBeCloseTo(ring, 6)

  const spec = getAvatarBodyCompilerShapeSpec('ellipse')
  const sideX = .25
  const sideZ = .8
  const left = mapAvatarPrimitiveLocalPointToAuthoredSurface('ellipse', {
    x: -sideZ * spec.radiusZ / spec.radiusX,
    y: -.15,
    z: sideX * spec.radiusX / spec.radiusZ
  }, 'left')
  expect(left).toMatchObject({ x: expect.closeTo(sideX, 6), y: -.15 })
  expect(left.frontDepth).toBeCloseTo(sideZ, 6)
})

const projectedPathExtent = (path: string) => {
  const values = Array.from(path.matchAll(/-?\d+(?:\.\d+)?/g), match => Number(match[0]))
  const xs = values.filter((_, index) => index % 2 === 0)
  const ys = values.filter((_, index) => index % 2 === 1)
  return {
    height: Math.max(...ys) - Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs)
  }
}

const projectedPathBandWidth = (path: string, minY: number, maxY: number) => {
  const values = Array.from(path.matchAll(/-?\d+(?:\.\d+)?/g), match => Number(match[0]))
  const xs = values.flatMap((value, index) => {
    if (index % 2 !== 0) return []
    const y = values[index + 1]
    return y != null && y >= minY && y <= maxY ? [value] : []
  })
  return Math.max(...xs) - Math.min(...xs)
}

const projectedPathArea = (path: string | undefined) => {
  if (path == null) return 0
  return path.split(/(?=M )/).reduce((total, subpath) => {
    const values = Array.from(subpath.matchAll(/-?\d+(?:\.\d+)?/g), match => Number(match[0]))
    const points = Array.from({ length: Math.floor(values.length / 2) }, (_, index) => ({
      x: values[index * 2]!,
      y: values[index * 2 + 1]!
    }))
    if (points.length < 3) return total
    const signedArea = points.reduce((area, point, index) => {
      const next = points[(index + 1) % points.length]!
      return area + point.x * next.y - next.x * point.y
    }, 0) / 2
    return total + Math.abs(signedArea)
  }, 0)
}

const getPartGeometryOptions = (part: ReturnType<typeof createAvatarEntityParts>[number]) => ({
  bottomTaper: part.bottomTaper,
  cutAngle: part.cutAngle,
  hollow: part.hollow,
  occlusionAmount: part.occlusionAmount,
  occlusionPole: part.occlusionPole,
  rotationX: part.rotationX,
  rotationY: part.rotationY,
  rotationZ: part.rotationZ,
  roundness: part.roundness,
  scaleX: part.scaleX,
  scaleY: part.scaleY,
  scaleZ: part.scaleZ,
  topScale: part.topScale
})

describe('avatar surface lighting', () => {
  it('uses stronger near shadows and attenuates all contrast with distance', () => {
    expect(resolveAvatarSurfaceShadeOpacity(-1, 0)).toBeCloseTo(.96)
    expect(resolveAvatarSurfaceShadeOpacity(1, 0)).toBeCloseTo(.38)
    expect(resolveAvatarSurfaceShadeOpacity(-.25, 0)).toBeGreaterThan(.38)
    expect(resolveAvatarSurfaceShadeOpacity(-1, 50)).toBeCloseTo(.48)
    expect(resolveAvatarSurfaceShadeOpacity(-1, 100)).toBe(0)
    expect(resolveAvatarSurfaceShadeOpacity(1, 100)).toBe(0)
  })

  it('changes cell density without changing the high-resolution silhouette', () => {
    const low = buildAvatarBodyGeometry('sphere', POSE, LIGHT, AVATAR_GRID_DENSITY.min)
    const original = buildAvatarBodyGeometry('sphere', POSE, LIGHT)
    const explicitDefault = buildAvatarBodyGeometry('sphere', POSE, LIGHT, AVATAR_GRID_DENSITY.default)
    const high = buildAvatarBodyGeometry('sphere', POSE, LIGHT, AVATAR_GRID_DENSITY.max)

    expect(low.cells.length).toBeLessThan(original.cells.length)
    expect(high.cells.length).toBeGreaterThan(original.cells.length)
    expect(explicitDefault.cells.length).toBe(original.cells.length)
    expect(low.outlinePath).toBe(original.outlinePath)
    expect(high.outlinePath).toBe(original.outlinePath)
  })

  it('builds a reusable rounded trapezoid body geometry', () => {
    const geometry = buildAvatarBodyGeometry('trapezoid', { pitch: 0, yaw: 0 }, LIGHT, 100, { roundness: 78 })

    expect(geometry.cells.length).toBeGreaterThan(0)
    expect(geometry.outlinePath).toContain('M ')
  })

  it('builds a reusable tapered teardrop body geometry', () => {
    const geometry = buildAvatarBodyGeometry('teardrop', { pitch: 0, yaw: 0 }, LIGHT, 100, {
      occlusionAmount: 42,
      occlusionPole: 'bottom'
    })
    const ellipse = buildAvatarBodyGeometry('ellipse', { pitch: 0, yaw: 0 }, LIGHT)

    expect(geometry.cells.length).toBeGreaterThan(0)
    expect(geometry.outlinePath).toContain('M ')
    expect(geometry.occlusionPath).toContain('M ')
    expect(geometry.outlinePath).not.toBe(ellipse.outlinePath)
  })

  it('tapers only the lower half of an ellipse without changing its zero-taper silhouette', () => {
    const pose = { pitch: 0, yaw: 0 }
    const original = buildAvatarBodyGeometry('ellipse', pose, LIGHT)
    const explicitZero = buildAvatarBodyGeometry('ellipse', pose, LIGHT, 100, { bottomTaper: 0 })
    const tapered = buildAvatarBodyGeometry('ellipse', pose, LIGHT, 100, { bottomTaper: 75 })
    const unchangedSphere = buildAvatarBodyGeometry('sphere', pose, LIGHT, 100, { bottomTaper: 75 })

    expect(explicitZero.outlinePath).toBe(original.outlinePath)
    expect(tapered.outlinePath).not.toBe(original.outlinePath)
    expect(projectedPathBandWidth(tapered.outlinePath, 110, 145))
      .toBeCloseTo(projectedPathBandWidth(original.outlinePath, 110, 145), 1)
    expect(projectedPathBandWidth(tapered.outlinePath, 255, 290))
      .toBeLessThan(projectedPathBandWidth(original.outlinePath, 255, 290) * .92)
    expect(projectedPathBandWidth(tapered.outlinePath, 255, 270))
      .toBeGreaterThan(projectedPathBandWidth(tapered.outlinePath, 195, 210) * .64)
    expect(unchangedSphere.outlinePath).toBe(buildAvatarBodyGeometry('sphere', pose, LIGHT).outlinePath)
  })

  it('scales multipart geometry in local X, Y, and Z axes before rotation', () => {
    const shallow = buildAvatarBodyGeometry('teardrop', { pitch: 0, yaw: Math.PI / 2 }, LIGHT, 100, {
      scaleX: .3,
      scaleY: .4,
      scaleZ: .1
    })
    const deep = buildAvatarBodyGeometry('teardrop', { pitch: 0, yaw: Math.PI / 2 }, LIGHT, 100, {
      scaleX: .3,
      scaleY: .4,
      scaleZ: .5
    })

    expect(deep.outlinePath).not.toBe(shallow.outlinePath)
  })

  it('projects eye highlights and reusable decals onto the curved surface', () => {
    const face = projectDefaultFace({ pitch: 0, yaw: 0 }, 'teardrop', {
      ...DEFAULT_AVATAR_FACE_STYLE,
      eyeHighlight: { ...DEFAULT_AVATAR_FACE_STYLE.eyeHighlight, enabled: true, size: 30 }
    })
    const decal = projectAvatarSurfaceDecal({ pitch: 0, yaw: 0 }, 'teardrop', {
      color: '#f29a93',
      height: 18,
      id: 'blush-left',
      label: 'Left blush',
      opacity: 90,
      rotation: -8,
      shape: 'ellipse',
      targetPartId: null,
      width: 30,
      x: -48,
      y: 30
    })

    expect(face.eyeHighlights).toHaveLength(2)
    expect(face.eyeHighlights.every(highlight => highlight.path.startsWith('M '))).toBe(true)
    expect(decal?.path).toContain(' Z')
    const fittedTrapezoid = projectAvatarSurfaceDecal({ pitch: 0, yaw: .78 }, 'trapezoid', {
      bend: 10, color: '#2f241c', height: 42, id: 'fitted', label: 'Fitted stripe', opacity: 90,
      rotation: -74, shape: 'tapered-band', targetPartId: null, width: 8, x: -76, y: -28
    }, { roundness: 82, topScale: .62 })
    const wideTopTrapezoid = projectAvatarSurfaceDecal({ pitch: 0, yaw: .78 }, 'trapezoid', {
      bend: 10, color: '#2f241c', height: 42, id: 'fitted', label: 'Fitted stripe', opacity: 90,
      rotation: -74, shape: 'tapered-band', targetPartId: null, width: 8, x: -76, y: -28
    }, { roundness: 82, topScale: 1.12 })
    expect(fittedTrapezoid?.path).toContain(' Z')
    expect(wideTopTrapezoid?.path).toContain(' Z')
    expect(fittedTrapezoid?.path).not.toBe(wideTopTrapezoid?.path)
    const centeredHalfCone = projectAvatarSurfaceDecal({ pitch: 0, yaw: 0 }, 'half-cone', {
      bend: -8, color: '#2f241c', height: 28, id: 'half-cone', label: 'Half-cone stripe', opacity: 90,
      rotation: -20, shape: 'tapered-band', targetPartId: null, width: 7, x: 0, y: 18
    }, { cutAngle: 0, roundness: 42 })
    const rotatedHalfCone = projectAvatarSurfaceDecal({ pitch: 0, yaw: 0 }, 'half-cone', {
      bend: -8, color: '#2f241c', height: 28, id: 'half-cone', label: 'Half-cone stripe', opacity: 90,
      rotation: -20, shape: 'tapered-band', targetPartId: null, width: 7, x: 0, y: 18
    }, { cutAngle: 60, roundness: 42 })
    expect(centeredHalfCone?.path).toContain(' Z')
    expect(rotatedHalfCone?.path).toContain(' Z')
    expect(rotatedHalfCone?.path).not.toBe(centeredHalfCone?.path)
    const officialMark = projectAvatarSurfaceDecal({ pitch: .08, yaw: -.25 }, 'sphere', {
      color: '#d97757', height: 34, id: 'claude', label: 'Official Claude Spark', opacity: 100,
      rotation: 12, shape: 'claude-spark', targetPartId: null, width: 34, x: 48, y: 44
    })
    const openSmile = projectAvatarSurfaceDecal({ pitch: 0, yaw: 0 }, 'sphere', {
      color: '#241915', height: 22, id: 'mouth', label: 'Open smile', opacity: 100,
      rotation: 0, shape: 'rounded-triangle', targetPartId: null, width: 32, x: 0, y: 49
    })
    expect(officialMark?.transform).toMatch(/^matrix\(/)
    const backMark = projectAvatarSurfaceDecal({ pitch: 0, yaw: Math.PI }, 'sphere', {
      color: '#d97757', height: 34, id: 'claude-back', label: 'Official Claude Spark', opacity: 100,
      rotation: 0, shape: 'claude-spark', side: 'back', targetPartId: null, width: 34, x: 30, y: 48
    })
    expect(backMark?.path).toContain('M18.7657 62.4437')
    expect(backMark?.transform).toMatch(/^matrix\(/)
    expect(projectAvatarSurfaceDecal({ pitch: 0, yaw: 0 }, 'sphere', {
      color: '#d97757', height: 34, id: 'hidden-back', label: 'Official Claude Spark', opacity: 100,
      rotation: 0, shape: 'claude-spark', side: 'back', targetPartId: null, width: 34, x: 30, y: 48
    })).toBeNull()
    const rightPleat = projectAvatarSurfaceDecal({ pitch: 0, yaw: -Math.PI / 2 }, 'cone', {
      color: '#d9b985', height: 28, id: 'right-pleat', label: 'Right pleat', opacity: 60,
      rotation: 20, shape: 'rounded', side: 'right', targetPartId: null, width: 5, x: 0, y: -20
    })
    const leftPleat = projectAvatarSurfaceDecal({ pitch: 0, yaw: Math.PI / 2 }, 'cone', {
      color: '#d9b985', height: 28, id: 'left-pleat', label: 'Left pleat', opacity: 60,
      rotation: -20, shape: 'rounded', side: 'left', targetPartId: null, width: 5, x: 0, y: -20
    })
    expect(rightPleat?.path).toContain(' Z')
    expect(leftPleat?.path).toContain(' Z')
    const radialPleatPaths = [0, -.6157, -Math.PI / 2, Math.PI].map(yaw => (
      projectAvatarSurfaceDecal({ pitch: -.04, yaw }, 'cone', {
        color: '#d9b985', height: 64, id: 'radial-pleats', label: 'Crown pleats', opacity: 62,
        rotation: 0, shape: 'radial-pleats', targetPartId: null, width: 5, x: -42, y: 0
      }, { roundness: 46, scaleX: .5, scaleY: .23, scaleZ: .5, topScale: .82 })
    ))
    expect(radialPleatPaths.every(pleats => pleats != null)).toBe(true)
    expect(radialPleatPaths.every(pleats => (pleats?.path.match(/M /g)?.length ?? 0) >= 5)).toBe(true)
    const straightPleats = projectAvatarSurfaceDecal({ pitch: -.04, yaw: 0 }, 'cone', {
      color: '#d9b985', height: 64, id: 'straight-pleats', label: 'Straight pleats', opacity: 62,
      rotation: 0, shape: 'radial-pleats', targetPartId: null, width: 5, x: 0, y: 0
    }, { roundness: 46, scaleX: .5, scaleY: .23, scaleZ: .5, topScale: .82 })
    expect(radialPleatPaths[0]?.path).not.toBe(straightPleats?.path)
    expect(openSmile?.path).toContain(' Z')
    const faceMask = projectAvatarSurfaceDecal({ pitch: -.96, yaw: 1.32 }, 'ellipse', {
      color: '#f3e6d4', height: 160, id: 'face-mask', label: 'Face mask', opacity: 70,
      rotation: 0, shape: 'face-mask', side: 'face', targetPartId: null, width: 108, x: 0, y: 70
    })
    expect(faceMask?.path).toContain(' Z')
    expect(faceMask?.path).not.toContain('NaN')
    expect(openSmile?.transform).toBeUndefined()
    expect(projectAvatarSurfaceDecal({ pitch: 0, yaw: Math.PI }, 'teardrop', {
      color: '#f29a93', height: 18, id: 'hidden', label: 'Hidden', opacity: 100,
      rotation: 0, shape: 'ellipse', targetPartId: null, width: 30, x: 0, y: 0
    })).toBeNull()
  })

  it('projects Mixed signal as an upright left eye and a wide right eye', () => {
    const mixedSignal = AVATAR_FACE_PRESETS.find(preset => preset.id === 'mixed-signal')
    expect(mixedSignal).toBeDefined()
    const face = projectDefaultFace({ pitch: 0, yaw: 0 }, 'sphere', mixedSignal!.style)
    const left = projectedPathExtent(face.eyes[0]!.path)
    const right = projectedPathExtent(face.eyes[1]!.path)

    expect(left.height).toBeGreaterThan(left.width)
    expect(right.width).toBeGreaterThan(right.height)
  })
})

describe('avatar face-anchored surface decals', () => {
  it('clips face-side markings continuously as their target crosses the visible horizon', () => {
    const fixtures = [
      { createDecals: createOwlSurfaceDecals, id: 'owl-facial-disc', preset: 'owl' as const },
      { createDecals: createParrotSurfaceDecals, id: 'parrot-face-patch', preset: 'parrot' as const },
      { createDecals: createMonkeySurfaceDecals, id: 'monkey-face-mask', preset: 'monkey' as const },
      { createDecals: createCowSurfaceDecals, id: 'cow-face-mask', preset: 'cow' as const }
    ]

    for (const fixture of fixtures) {
      const parts = createAvatarEntityParts(fixture.preset)
      const decal = fixture.createDecals().find(candidate => candidate.id === fixture.id)!
      const target = parts.find(part => part.id === decal.targetPartId) ?? parts.find(part => part.face)!
      const areas = [88, 89, 90, 91, 92].map(yaw => projectedPathArea(projectAvatarSurfaceDecal(
        { pitch: 0, yaw: yaw * Math.PI / 180 },
        target.shape,
        decal,
        getPartGeometryOptions(target)
      )?.path))
      const frontArea = projectedPathArea(projectAvatarSurfaceDecal(
        { pitch: 0, yaw: 0 },
        target.shape,
        decal,
        getPartGeometryOptions(target)
      )?.path)
      const largestStep = Math.max(...areas.slice(1).map((area, index) => Math.abs(area - areas[index]!)))

      expect(areas[2], `${fixture.id} must retain the still-visible half at an exact 90 degree yaw`)
        .toBeGreaterThan(0)
      expect(largestStep, `${fixture.id} must shrink at the horizon instead of disappearing as one sheet`)
        .toBeLessThan(frontArea * .08)
    }
  })

  it('clips individual face features continuously instead of toggling the whole face group', () => {
    const areas = [88, 89, 90, 91, 92].map(yaw => {
      const face = projectDefaultFace(
        { pitch: 0, yaw: yaw * Math.PI / 180 },
        'sphere',
        DEFAULT_AVATAR_FACE_STYLE
      )
      return face.eyes.reduce((total, eye) => total + projectedPathArea(eye.path), 0) +
        projectedPathArea(face.nose?.path) + projectedPathArea(face.mouth?.path)
    })
    const front = projectDefaultFace({ pitch: 0, yaw: 0 }, 'sphere', DEFAULT_AVATAR_FACE_STYLE)
    const frontArea = front.eyes.reduce((total, eye) => total + projectedPathArea(eye.path), 0) +
      projectedPathArea(front.nose?.path) + projectedPathArea(front.mouth?.path)
    const largestStep = Math.max(...areas.slice(1).map((area, index) => Math.abs(area - areas[index]!)))

    expect(largestStep).toBeLessThan(frontArea * .08)
    expect(projectDefaultFace(
      { pitch: 0, yaw: Math.PI / 2 },
      'sphere',
      DEFAULT_AVATAR_FACE_STYLE
    ).visible).toBe(true)
    expect(projectDefaultFace({ pitch: 0, yaw: Math.PI }, 'sphere', DEFAULT_AVATAR_FACE_STYLE).eyes)
      .toHaveLength(0)
  })

  it('makes the capybara muzzle a real side-profile volume with its marking on that same curved surface', () => {
    const parts = createAvatarEntityParts('capybara')
    const head = parts.find(part => part.face)!
    const muzzle = parts.find(part => part.id === 'muzzle')!
    const pose = { pitch: -.12, yaw: 1.18 }
    const headGeometry = buildAvatarBodyGeometry(head.shape, pose, LIGHT, 100, {
      roundness: head.roundness,
      scaleX: head.scaleX,
      scaleY: head.scaleY,
      scaleZ: head.scaleZ,
      topScale: head.topScale
    })
    const muzzleOptions = {
      rotationX: muzzle.rotationX,
      roundness: muzzle.roundness,
      scaleX: muzzle.scaleX,
      scaleY: muzzle.scaleY,
      scaleZ: muzzle.scaleZ
    }
    const muzzleGeometry = buildAvatarBodyGeometry(muzzle.shape, pose, LIGHT, 100, muzzleOptions)
    const headRight = projectedPathExtent(headGeometry.outlinePath).width / 2
    const muzzleRight = muzzle.x * Math.cos(pose.yaw)
      + muzzle.z * Math.sin(pose.yaw)
      + projectedPathExtent(muzzleGeometry.outlinePath).width / 2

    expect(muzzle.baseColor).toBe(head.baseColor)
    expect(muzzleRight, 'the fur-covered muzzle must genuinely alter the visible side silhouette')
      .toBeGreaterThan(headRight + 12)

    const marking = createCapybaraSurfaceDecals()[0]!
    expect(marking.targetPartId).toBe('muzzle')
    expect(marking.color).not.toBe(muzzle.baseColor)
    expect(projectAvatarSurfaceDecal(pose, muzzle.shape, marking, muzzleOptions)?.path)
      .not.toContain('NaN')
  })

  it('keeps sheep heads and wool rounded from side views while face masks follow the same thick surface', () => {
    const parts = createAvatarEntityParts('sheep')
    const head = parts.find(part => part.face)!
    const options = {
      bottomTaper: head.bottomTaper,
      scaleX: head.scaleX,
      scaleY: head.scaleY,
      scaleZ: head.scaleZ
    }
    const front = buildAvatarBodyGeometry('ellipse', { pitch: 0, yaw: 0 }, LIGHT, 100, options)
    const side = buildAvatarBodyGeometry('ellipse', { pitch: 0, yaw: 1.38 }, LIGHT, 100, options)
    const top = buildAvatarBodyGeometry('ellipse', { pitch: -.95, yaw: .32 }, LIGHT, 100, options)

    expect(projectedPathExtent(side.outlinePath).width)
      .toBeGreaterThan(projectedPathExtent(front.outlinePath).width * .88)
    expect(projectedPathExtent(top.outlinePath).height)
      .toBeGreaterThan(projectedPathExtent(front.outlinePath).height * .74)

    for (const pose of [{ pitch: 0, yaw: 0 }, { pitch: -.24, yaw: .78 }, { pitch: -.5, yaw: 1.1 }]) {
      const projected = projectAvatarSurfaceDecal(pose, 'ellipse', createSheepSurfaceDecals()[0]!, options)
      expect(projected?.path, `sheep surface marking must follow ${JSON.stringify(pose)}`).toContain(' Z')
      expect(projected?.path).not.toContain('NaN')
    }

    const expanded = applySheepHeadScale(parts, 125, 110)
    const expandedHead = expanded.find(part => part.face)!
    expect(expandedHead.scaleZ).toBeGreaterThan(head.scaleZ!)
    expect(expanded.find(part => part.id === 'wool-crown-center')!.scaleZ)
      .toBeGreaterThan(parts.find(part => part.id === 'wool-crown-center')!.scaleZ!)
  })

  it('uses the same projection as facial features at extreme poses', () => {
    const pose = { pitch: -.96, yaw: 1.32 }
    const face = projectDefaultFace(pose, 'sphere', {
      ...DEFAULT_AVATAR_FACE_STYLE,
      mouthHeight: 20,
      mouthShape: 'ellipse',
      mouthWidth: 20,
      mouthY: 52
    })
    const anchored = projectAvatarSurfaceDecal(pose, 'sphere', {
      color: '#ffffff',
      height: 20,
      id: 'face-anchor',
      label: 'Face anchor',
      opacity: 100,
      rotation: 0,
      shape: 'ellipse',
      side: 'face',
      targetPartId: null,
      width: 20,
      x: 0,
      y: 52
    })

    expect(anchored?.path).toBe(face.mouth?.path)
  })

  it('keeps facial features and face decals attached to a tapered ellipse in 3D', () => {
    const pose = { pitch: -.24, yaw: .52 }
    const options = { bottomTaper: 72 }
    const style = {
      ...DEFAULT_AVATAR_FACE_STYLE,
      mouthHeight: 20,
      mouthShape: 'ellipse' as const,
      mouthWidth: 20,
      mouthY: 52
    }
    const decal = {
      color: '#ffffff', height: 20, id: 'tapered-anchor', label: 'Tapered anchor', opacity: 100,
      rotation: 0, shape: 'ellipse' as const, side: 'face' as const, targetPartId: null,
      width: 20, x: 0, y: 52
    }
    const taperedFace = projectDefaultFace(pose, 'ellipse', style, options)
    const taperedDecal = projectAvatarSurfaceDecal(pose, 'ellipse', decal, options)
    const originalDecal = projectAvatarSurfaceDecal(pose, 'ellipse', decal)

    expect(taperedDecal?.path).toBe(taperedFace.mouth?.path)
    expect(taperedDecal?.path).not.toBe(originalDecal?.path)
    expect(taperedDecal?.path).not.toContain('NaN')
  })

  it('splits full-crown radial markings at the object-space horizon', () => {
    const boundaries = buildAvatarSurfaceDecalLocalBoundaries({
      color: '#d9b985',
      height: 64,
      id: 'crown-pleats',
      label: 'Crown pleats',
      opacity: 62,
      rotation: 0,
      shape: 'radial-pleats',
      side: 'front',
      targetPartId: 'crown',
      width: 5,
      x: -42,
      y: 0
    }, 'sphere')
    const front = boundaries.filter(boundary => boundary[0]?.surfaceSide === 'front')
    const back = boundaries.filter(boundary => boundary[0]?.surfaceSide === 'back')

    expect(front.length).toBeGreaterThan(5)
    expect(back.length).toBeGreaterThan(5)
    for (const boundary of boundaries) {
      expect(new Set(boundary.map(point => point.surfaceSide))).toHaveLength(1)
      expect(boundary.length).toBeGreaterThanOrEqual(3)
    }

    const legacyNonFrontSide = buildAvatarSurfaceDecalLocalBoundaries({
      color: '#d9b985',
      height: 64,
      id: 'legacy-side-crown-pleats',
      label: 'Legacy side crown pleats',
      opacity: 62,
      rotation: 0,
      shape: 'radial-pleats',
      side: 'left',
      targetPartId: 'crown',
      width: 5,
      x: -42,
      y: 0
    }, 'sphere')
    expect(legacyNonFrontSide).toEqual(boundaries)

    const rotatedHalfCone = buildAvatarSurfaceDecalLocalBoundaries({
      color: '#d9b985',
      height: 64,
      id: 'rotated-half-cone-pleats',
      label: 'Rotated half-cone pleats',
      opacity: 62,
      rotation: 0,
      shape: 'radial-pleats',
      side: 'front',
      targetPartId: 'crown',
      width: 5,
      x: -42,
      y: 0
    }, 'half-cone', { cutAngle: 90, roundness: 42 })
    expect(rotatedHalfCone).not.toHaveLength(0)
    expect(rotatedHalfCone.every(boundary => boundary[0]?.surfaceSide === 'front')).toBe(true)
    expect(rotatedHalfCone.flat().every(point => Math.abs(point.x) <= 139.001)).toBe(true)
  })
})
