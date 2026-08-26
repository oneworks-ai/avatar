import { describe, expect, it } from 'vitest'

import {
  buildTwoSphereFixture,
  compareTwoSphereGraphWithAnalyticOwner,
  resolveAnalyticTwoSphereBoundaryX,
  resolveAnalyticTwoSphereOwner
} from '../src/twoSphereOcclusionLabGeometry'

describe('two-sphere occlusion lab', () => {
  it('has one analytic depth-equality branch inside the front overlap', () => {
    const boundaryX = resolveAnalyticTwoSphereBoundaryX(0)
    expect(boundaryX).not.toBeNull()
    expect(resolveAnalyticTwoSphereOwner({ pitch: 0, yaw: 0 }, boundaryX! - 1, 0)).toBe('black')
    expect(resolveAnalyticTwoSphereOwner({ pitch: 0, yaw: 0 }, boundaryX! + 1, 0)).toBe('white')
  })

  it.each(['full', 'interactive'] as const)(
    'keeps %s graph ownership total across the analytic sphere footprint',
    quality => {
      const pose = { pitch: 0, yaw: 0 }
      const fixture = buildTwoSphereFixture(pose, quality)
      const comparison = compareTwoSphereGraphWithAnalyticOwner(fixture, pose, 2)
      expect(comparison.analyticOverlapSamples).toBeGreaterThan(5_000)
      expect(comparison.nullGraphOwnerSamples).toBe(0)
      expect(comparison.mismatchedOwnerSamples).toBeLessThan(comparison.analyticOverlapSamples * .015)
    }
  )

  it('keeps one shared owner component and skips dense triangle-pair intersections in all 26 directions', () => {
    const directions = [-1, 0, 1].flatMap(x => [-1, 0, 1].flatMap(y => (
      [-1, 0, 1].flatMap(z => x === 0 && y === 0 && z === 0 ? [] : [{ x, y, z }])
    )))
    for (const direction of directions) {
      const length = Math.hypot(direction.x, direction.y, direction.z)
      const pose = {
        pitch: -Math.asin(direction.y / length),
        yaw: Math.atan2(-direction.x / length, direction.z / length)
      }
      const fixture = buildTwoSphereFixture(pose)
      const sharedPaths = fixture.graph.nodes.flatMap(node => node.sharedPaintPath == null
        ? []
        : [node.sharedPaintPath])
      expect(sharedPaths).toHaveLength(1)
      expect(sharedPaths[0]!.match(/M/g)).toHaveLength(1)
      expect(fixture.graph.metrics.trianglePairTests).toBe(0)
      expect(fixture.graph.metrics.occlusionSegmentCount).toBeLessThan(100)
    }
  })

  it.todo('keeps one stable shared-boundary topology through a 240-step diagonal drag')
})
