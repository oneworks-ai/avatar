import { describe, expect, it } from 'vitest'

import { DEFAULT_AVATAR_FACE_STYLE, projectDefaultFace } from '../src/avatarGeometry'

const parsePathPoints = (path: string) => {
  const coordinates = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0]))
  return Array.from({ length: coordinates.length / 2 }, (_, index) => ({
    x: coordinates[index * 2]!,
    y: coordinates[index * 2 + 1]!
  }))
}

describe('avatar face surface projection', () => {
  it('tessellates a rounded eye edge so the projected outline follows the sphere', () => {
    const face = projectDefaultFace(
      { pitch: 0, yaw: -1 },
      'sphere',
      { ...DEFAULT_AVATAR_FACE_STYLE, height: 96, width: 28 }
    )
    const points = parsePathPoints(face.eyes[0]!.path)

    expect(points).toHaveLength(64)

    const edgeTop = points[8]!
    const edgeMiddle = points[12]!
    const edgeBottom = points[16]!
    const straightChordMiddleX = (edgeTop.x + edgeBottom.x) / 2

    expect(Math.abs(edgeMiddle.x - straightChordMiddleX)).toBeGreaterThan(2)
  })

  it('adds an independent tilt to each eye on top of the overall rotation', () => {
    const base = projectDefaultFace(
      { pitch: 0, yaw: 0 },
      'sphere',
      DEFAULT_AVATAR_FACE_STYLE
    )
    const tilted = projectDefaultFace(
      { pitch: 0, yaw: 0 },
      'sphere',
      {
        ...DEFAULT_AVATAR_FACE_STYLE,
        leftEyeRotation: -24,
        rotation: 8,
        rightEyeRotation: 18
      }
    )

    expect(tilted.eyes[0]?.path).not.toBe(base.eyes[0]?.path)
    expect(tilted.eyes[1]?.path).not.toBe(base.eyes[1]?.path)
    expect(tilted.eyes[0]?.path).not.toBe(tilted.eyes[1]?.path)
  })

  it('keeps the eyes renderable when hot state contains invalid new tilt fields', () => {
    const face = projectDefaultFace(
      { pitch: .43, yaw: .39 },
      'sphere',
      {
        ...DEFAULT_AVATAR_FACE_STYLE,
        leftEyeRotation: Number.NaN,
        rightEyeRotation: Number.NaN
      }
    )

    expect(face.eyes).toHaveLength(2)
    expect(face.eyes.every(eye => !eye.path.includes('NaN'))).toBe(true)
  })
})
