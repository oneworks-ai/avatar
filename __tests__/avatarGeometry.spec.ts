import { describe, expect, it } from 'vitest'

import {
  AVATAR_GRID_DENSITY,
  DEFAULT_AVATAR_FACE_STYLE,
  buildAvatarBodyGeometry,
  projectAvatarSurfaceDecal,
  projectDefaultFace,
  resolveAvatarSurfaceShadeOpacity
} from '../src/avatarGeometry'

const POSE = { pitch: -.35, yaw: .4 }
const LIGHT = { azimuth: -92, elevation: 64 }

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
    expect(openSmile?.transform).toBeUndefined()
    expect(projectAvatarSurfaceDecal({ pitch: 0, yaw: Math.PI }, 'teardrop', {
      color: '#f29a93', height: 18, id: 'hidden', label: 'Hidden', opacity: 100,
      rotation: 0, shape: 'ellipse', targetPartId: null, width: 30, x: 0, y: 0
    })).toBeNull()
  })
})
