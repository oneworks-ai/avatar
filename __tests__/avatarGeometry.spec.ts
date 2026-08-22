import { describe, expect, it } from 'vitest'

import { AVATAR_GRID_DENSITY, buildAvatarBodyGeometry, resolveAvatarSurfaceShadeOpacity } from '../src/avatarGeometry'

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
})
