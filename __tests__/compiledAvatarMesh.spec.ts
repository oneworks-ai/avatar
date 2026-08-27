import { describe, expect, it } from 'vitest'

import {
  compileAvatarMesh,
  createCompiledAvatarMeshCache,
  projectCompiledAvatarMesh,
  type CompiledAvatarPose,
  type CompiledVec3
} from '../src/compiledAvatarMesh'
import { createOptimizedCompiledAvatarProjector } from '../src/compiledAvatarMeshOptimized'
import {
  COMPILED_ATTACHMENT_MARKINGS,
  COMPILED_ATTACHMENT_MATERIALS,
  COMPILED_BIRD_MATERIALS,
  COMPILED_CAT_MATERIALS,
  COMPILED_SVG_DIRECTIONS,
  COMPILED_SVG_LAB_SIZE,
  COMPILED_SVG_TWO_SPHERE_INPUT,
  COMPILED_SVG_TWO_SPHERE_MATERIALS,
  COMPILED_SVG_TWO_SPHERE_PRIMITIVES,
  compiledSvgPoseForDirection,
  createCompiledAttachmentFixture,
  createCompiledBirdFixture,
  createCompiledBirdMarkings,
  createCompiledCatFixture,
  createCompiledCatMarkings
} from '../src/compiledSvgLabFixtures'

const rotate = (point: CompiledVec3, pose: CompiledAvatarPose): CompiledVec3 => {
  const cosYaw = Math.cos(pose.yaw)
  const sinYaw = Math.sin(pose.yaw)
  const yawX = point.x * cosYaw + point.z * sinYaw
  const yawZ = point.z * cosYaw - point.x * sinYaw
  const cosPitch = Math.cos(pose.pitch)
  const sinPitch = Math.sin(pose.pitch)
  const pitchY = point.y * cosPitch - yawZ * sinPitch
  const pitchZ = yawZ * cosPitch + point.y * sinPitch
  const cosRoll = Math.cos(pose.roll)
  const sinRoll = Math.sin(pose.roll)
  return {
    x: yawX * cosRoll - pitchY * sinRoll,
    y: yawX * sinRoll + pitchY * cosRoll,
    z: pitchZ
  }
}

const analyticTwoSphereOwner = (pose: CompiledAvatarPose, x: number, y: number) => {
  let owner: string | null = null
  let frontDepth = Number.NEGATIVE_INFINITY
  for (const primitive of COMPILED_SVG_TWO_SPHERE_PRIMITIVES) {
    const center = rotate(primitive.position, pose)
    const deltaX = x - center.x
    const deltaY = y - center.y
    const depthSquared = 72 ** 2 - deltaX ** 2 - deltaY ** 2
    if (depthSquared < 0) continue
    const depth = center.z + Math.sqrt(depthSquared)
    if (depth > frontDepth) {
      frontDepth = depth
      owner = primitive.id
    }
  }
  return owner
}

const materialArea = (projection: ReturnType<typeof projectCompiledAvatarMesh>, materialId: string) => (
  projection.pixelMaterialIds.filter(candidate => candidate === materialId).length
)

const ownerMaterialArea = (
  projection: ReturnType<typeof projectCompiledAvatarMesh>,
  ownerId: string,
  materialId: string
) => projection.pixelMaterialIds.filter((candidate, index) => (
  candidate === materialId && projection.ownerPrimitiveIds[index] === ownerId
)).length

const foregroundBounds = (projection: ReturnType<typeof projectCompiledAvatarMesh>) => {
  const pixels = projection.ownerPrimitiveIds
    .map((owner, index) => owner == null ? null : ({ x: index % projection.width, y: Math.floor(index / projection.width) }))
    .filter((point): point is { x: number, y: number } => point != null)
  return {
    maxX: Math.max(...pixels.map(point => point.x)),
    maxY: Math.max(...pixels.map(point => point.y)),
    minX: Math.min(...pixels.map(point => point.x)),
    minY: Math.min(...pixels.map(point => point.y))
  }
}

describe('compiled avatar mesh lab architecture', () => {
  it('compiles stable watertight union topology with deterministic triangle ids', () => {
    const first = compileAvatarMesh(COMPILED_SVG_TWO_SPHERE_INPUT)
    const second = compileAvatarMesh(COMPILED_SVG_TWO_SPHERE_INPUT)

    expect(first.vertices.length).toBeGreaterThan(1_000)
    expect(first.triangles.length).toBeGreaterThan(2_000)
    expect(new Set(first.vertices.map(vertex => vertex.id)).size).toBe(first.vertices.length)
    expect(new Set(first.triangles.map(triangle => triangle.id)).size).toBe(first.triangles.length)
    expect(second.vertices.map(vertex => vertex.id)).toEqual(first.vertices.map(vertex => vertex.id))
    expect(second.triangles).toEqual(first.triangles)
  })

  it('keeps compile invalidation separate from pose, color, and surface marking projection', () => {
    const cache = createCompiledAvatarMeshCache()
    const input = createCompiledAttachmentFixture()
    const mesh = cache.get(input)

    for (const yaw of [0, Math.PI / 3, Math.PI * .85]) {
      projectCompiledAvatarMesh(mesh, input.primitives, {
        background: '#ff00ff',
        height: 160,
        markings: COMPILED_ATTACHMENT_MARKINGS,
        materials: { ...COMPILED_ATTACHMENT_MATERIALS, fur: yaw === 0 ? '#ba7647' : '#8c4f32' },
        pose: { pitch: .1, roll: 0, yaw },
        referenceSize: 420,
        width: 160
      })
    }
    expect(cache.compileCount).toBe(1)
    expect(cache.get(createCompiledAttachmentFixture({ leftX: -52 })).compileKey).not.toBe(mesh.compileKey)
    expect(cache.compileCount).toBe(2)
    expect(cache.get(createCompiledAttachmentFixture({ rightX: 52 })).compileKey).not.toBe(mesh.compileKey)
    expect(cache.compileCount).toBe(3)
    expect(cache.get(createCompiledAttachmentFixture({ rightScale: .9 })).compileKey).not.toBe(mesh.compileKey)
    expect(cache.compileCount).toBe(4)
    expect(cache.get(createCompiledAttachmentFixture({ muzzleProtrusion: 24 })).compileKey).not.toBe(mesh.compileKey)
    expect(cache.compileCount).toBe(5)
    expect(cache.get(createCompiledAttachmentFixture({ muzzleWidth: 108 })).compileKey).not.toBe(mesh.compileKey)
    expect(cache.compileCount).toBe(6)
    expect(cache.get(createCompiledAttachmentFixture({ muzzleHeight: 68 })).compileKey).not.toBe(mesh.compileKey)
    expect(cache.compileCount).toBe(7)
    expect(cache.get(createCompiledAttachmentFixture({ muzzleY: 50 })).compileKey).not.toBe(mesh.compileKey)
    expect(cache.compileCount).toBe(8)
    expect(cache.get(input)).toBe(mesh)
    expect(cache.compileCount).toBe(8)
  })

  it('keeps recently reused compiled configurations warm in a bounded cache', () => {
    const cache = createCompiledAvatarMeshCache(2)
    const first = createCompiledAttachmentFixture({ muzzleProtrusion: 20 })
    const second = createCompiledAttachmentFixture({ muzzleProtrusion: 22 })
    const third = createCompiledAttachmentFixture({ muzzleProtrusion: 24 })

    cache.get(first)
    cache.get(second)
    cache.get(first)
    cache.get(third)
    expect(cache.compileCount).toBe(3)
    expect(cache.has(first)).toBe(true)
    expect(cache.has(second)).toBe(false)
    expect(cache.has(third)).toBe(true)

    cache.get(second)
    expect(cache.compileCount).toBe(4)
  })

  it('matches the analytic front owner without null holes across all 26 directions', () => {
    const mesh = compileAvatarMesh(COMPILED_SVG_TWO_SPHERE_INPUT)
    for (const direction of COMPILED_SVG_DIRECTIONS) {
      const pose = compiledSvgPoseForDirection(direction)
      const size = 180
      const projection = projectCompiledAvatarMesh(mesh, COMPILED_SVG_TWO_SPHERE_PRIMITIVES, {
        background: '#ff00ff',
        height: size,
        materials: COMPILED_SVG_TWO_SPHERE_MATERIALS,
        pose,
        referenceSize: 420,
        width: size
      })
      let analyticPixels = 0
      let nullPixels = 0
      let mismatchedPixels = 0
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const worldX = (x + .5 - size / 2) * 420 / size
          const worldY = (y + .5 - size / 2) * 420 / size
          const analytic = analyticTwoSphereOwner(pose, worldX, worldY)
          if (analytic == null) continue
          analyticPixels += 1
          const rendered = projection.ownerPrimitiveIds[y * size + x]
          if (rendered == null) nullPixels += 1
          else if (rendered !== analytic) mismatchedPixels += 1
        }
      }
      expect(nullPixels / analyticPixels).toBeLessThan(.065)
      expect(mismatchedPixels / analyticPixels).toBeLessThan(.075)
      expect(projection.metrics.pathCount).toBeLessThanOrEqual(2)
    }
  })

  it('clips an embedded attachment root during compile and keeps markings on the real target surface', () => {
    const input = createCompiledAttachmentFixture()
    const mesh = compileAvatarMesh(input)
    const projectionAt = (pose: CompiledAvatarPose) => projectCompiledAvatarMesh(mesh, input.primitives, {
      background: '#ff00ff',
      height: 240,
      markings: COMPILED_ATTACHMENT_MARKINGS,
      materials: COMPILED_ATTACHMENT_MATERIALS,
      pose,
      referenceSize: 420,
      width: 240
    })
    const front = projectionAt({ pitch: 0, roll: 0, yaw: 0 })
    const leftHorizon = projectionAt({ pitch: 0, roll: 0, yaw: -Math.PI * 85 / 180 })
    const oblique = projectionAt({ pitch: 0, roll: 0, yaw: Math.PI / 3 })
    const rightHorizon = projectionAt({ pitch: 0, roll: 0, yaw: Math.PI * 85 / 180 })
    const rear = projectionAt({ pitch: 0, roll: 0, yaw: Math.PI })

    expect(materialArea(front, 'marking')).toBeGreaterThan(materialArea(oblique, 'marking'))
    expect(materialArea(oblique, 'marking')).toBeGreaterThan(materialArea(rightHorizon, 'marking'))
    expect(materialArea(rightHorizon, 'marking')).toBeGreaterThan(0)
    expect(materialArea(rear, 'marking')).toBe(0)
    expect(materialArea(front, 'mouth')).toBeGreaterThan(0)
    expect(materialArea(rightHorizon, 'mouth')).toBeGreaterThan(0)
    expect(materialArea(rear, 'mouth')).toBe(0)
    expect(materialArea(front, 'ear-left')).toBeGreaterThan(0)
    expect(materialArea(front, 'ear-right')).toBeGreaterThan(0)
    expect(Math.abs(materialArea(leftHorizon, 'ear-left') - materialArea(rightHorizon, 'ear-right'))).toBeLessThanOrEqual(16)
    expect(Math.abs(materialArea(leftHorizon, 'ear-right') - materialArea(rightHorizon, 'ear-left'))).toBeLessThanOrEqual(16)
    expect(materialArea(rear, 'ear-left')).toBeGreaterThan(0)
    expect(materialArea(rear, 'ear-right')).toBeGreaterThan(0)
    for (const projection of [front, leftHorizon, oblique, rightHorizon, rear]) {
      projection.pixelMaterialIds.forEach((materialId, index) => {
        if (materialId === 'eye') {
          expect(projection.ownerPrimitiveIds[index]).toBe('head')
        } else if (materialId === 'marking') {
          expect(['head', 'muzzle']).toContain(projection.ownerPrimitiveIds[index])
        } else if (materialId === 'mouth') {
          expect(projection.ownerPrimitiveIds[index]).toBe('muzzle')
        }
      })
      expect(projection.metrics.pathCount).toBeLessThanOrEqual(6)
    }

    const head = input.primitives.find(primitive => primitive.id === 'head')!
    for (const earId of ['ear-left', 'ear-right']) {
      const earTriangles = mesh.triangles.filter(triangle => triangle.primitiveId === earId)
      expect(earTriangles.length).toBeGreaterThan(0)
      expect(earTriangles.length).toBeLessThan(mesh.triangles.length)
      const exposedEarCentroids = earTriangles.map(triangle => triangle.vertexIndexes
        .map(index => mesh.vertices[index]!)
        .reduce((point, vertex) => ({
          x: point.x + vertex.x / 3,
          y: point.y + vertex.y / 3,
          z: point.z + vertex.z / 3
        }), { x: 0, y: 0, z: 0 }))
      expect(exposedEarCentroids.every(point => (
        Math.hypot(
          (point.x - head.position.x) / head.scale.x,
          (point.y - head.position.y) / head.scale.y,
          (point.z - head.position.z) / head.scale.z
        ) >= .94
      ))).toBe(true)
    }

    const muzzleTriangles = mesh.triangles.filter(triangle => triangle.primitiveId === 'muzzle')
    expect(muzzleTriangles.length).toBeGreaterThan(0)
    expect(muzzleTriangles.length).toBeLessThan(mesh.triangles.length)
  })

  it('changes the side silhouette with real muzzle volume while keeping the surface marking attached', () => {
    const withMuzzle = createCompiledAttachmentFixture()
    const withoutMuzzle = createCompiledAttachmentFixture({ includeMuzzle: false })
    const withMesh = compileAvatarMesh(withMuzzle)
    const withoutMesh = compileAvatarMesh(withoutMuzzle)
    const projectionAt = (
      input: typeof withMuzzle,
      mesh: typeof withMesh,
      yaw: number
    ) => projectCompiledAvatarMesh(mesh, input.primitives, {
      background: '#ff00ff',
      height: 260,
      markings: COMPILED_ATTACHMENT_MARKINGS,
      materials: COMPILED_ATTACHMENT_MATERIALS,
      pose: { pitch: 0, roll: 0, yaw },
      referenceSize: 420,
      width: 260
    })
    const rightWith = projectionAt(withMuzzle, withMesh, Math.PI * 85 / 180)
    const rightWithout = projectionAt(withoutMuzzle, withoutMesh, Math.PI * 85 / 180)
    const leftWith = projectionAt(withMuzzle, withMesh, -Math.PI * 85 / 180)
    const leftWithout = projectionAt(withoutMuzzle, withoutMesh, -Math.PI * 85 / 180)

    expect(foregroundBounds(rightWith).maxX - foregroundBounds(rightWithout).maxX).toBeGreaterThan(5)
    expect(foregroundBounds(leftWithout).minX - foregroundBounds(leftWith).minX).toBeGreaterThan(5)
    expect(materialArea(rightWith, 'marking')).toBeGreaterThan(0)
    expect(materialArea(leftWith, 'marking')).toBeGreaterThan(0)
    expect(materialArea(rightWith, 'mouth')).toBeGreaterThan(0)
    expect(materialArea(leftWith, 'mouth')).toBeGreaterThan(0)
  })

  it('hard-clips one pointed cone beak root while keeping seam and nostril markings on beak surface', () => {
    const input = createCompiledBirdFixture()
    const markings = createCompiledBirdMarkings()
    const mesh = compileAvatarMesh(input)
    const projectionAt = (pose: CompiledAvatarPose) => projectCompiledAvatarMesh(mesh, input.primitives, {
      background: '#ff00ff',
      height: 260,
      markings,
      materials: COMPILED_BIRD_MATERIALS,
      pose,
      referenceSize: 420,
      width: 260
    })
    const front = projectionAt({ pitch: 0, roll: 0, yaw: 0 })
    const oblique = projectionAt({ pitch: 0, roll: 0, yaw: Math.PI / 3 })
    const horizon = projectionAt({ pitch: 0, roll: 0, yaw: Math.PI * 85 / 180 })
    const rear = projectionAt({ pitch: 0, roll: 0, yaw: Math.PI })

    expect(materialArea(front, 'beak')).toBeGreaterThan(100)
    expect(materialArea(oblique, 'beak')).toBeGreaterThan(100)
    expect(materialArea(horizon, 'beak')).toBeGreaterThan(20)
    expect(materialArea(rear, 'beak')).toBe(0)
    expect(materialArea(front, 'seam')).toBeGreaterThan(0)
    expect(materialArea(oblique, 'seam')).toBeGreaterThan(0)
    expect(materialArea(rear, 'seam')).toBe(0)
    for (const projection of [front, oblique, horizon]) {
      projection.pixelMaterialIds.forEach((materialId, index) => {
        if (materialId === 'seam') expect(projection.ownerPrimitiveIds[index]).toBe('beak')
      })
      expect(projection.metrics.pathCount).toBeLessThanOrEqual(4)
    }

    const head = input.primitives.find(primitive => primitive.id === 'head')!
    const beakTriangles = mesh.triangles.filter(triangle => triangle.primitiveId === 'beak')
    expect(beakTriangles.length).toBeGreaterThan(0)
    const exposedBeakCentroids = beakTriangles.map(triangle => triangle.vertexIndexes
      .map(index => mesh.vertices[index]!)
      .reduce((point, vertex) => ({
        x: point.x + vertex.x / 3,
        y: point.y + vertex.y / 3,
        z: point.z + vertex.z / 3
      }), { x: 0, y: 0, z: 0 }))
    expect(exposedBeakCentroids.every(point => Math.hypot(
      (point.x - head.position.x) / head.scale.x,
      (point.y - head.position.y) / head.scale.y,
      (point.z - head.position.z) / head.scale.z
    ) >= .94)).toBe(true)
  })

  it('keeps two cat muzzle volumes semantically distinct while smoothing only their head junctions', () => {
    const input = createCompiledCatFixture()
    const markings = createCompiledCatMarkings()
    const mesh = compileAvatarMesh(input)
    const projectionAt = (pose: CompiledAvatarPose) => projectCompiledAvatarMesh(mesh, input.primitives, {
      background: '#ff00ff',
      height: 260,
      markings,
      materials: COMPILED_CAT_MATERIALS,
      pose,
      referenceSize: 420,
      width: 260
    })
    const front = projectionAt({ pitch: 0, roll: 0, yaw: 0 })
    const left = projectionAt({ pitch: 0, roll: 0, yaw: -Math.PI * 85 / 180 })
    const right = projectionAt({ pitch: 0, roll: 0, yaw: Math.PI * 85 / 180 })
    const rear = projectionAt({ pitch: 0, roll: 0, yaw: Math.PI })

    expect(input.smoothUnionPairs).toEqual([
      { primitiveIds: ['head', 'muzzle-left'], radius: 6 },
      { primitiveIds: ['head', 'muzzle-right'], radius: 6 }
    ])
    expect(ownerMaterialArea(front, 'muzzle-left', 'marking')).toBeGreaterThan(100)
    expect(ownerMaterialArea(front, 'muzzle-right', 'marking')).toBeGreaterThan(100)
    expect(materialArea(left, 'marking')).toBeGreaterThan(0)
    expect(materialArea(right, 'marking')).toBeGreaterThan(0)
    expect(materialArea(front, 'nose')).toBeGreaterThan(0)
    expect(materialArea(front, 'mouth')).toBeGreaterThan(0)
    expect(materialArea(rear, 'marking')).toBe(0)
    expect(materialArea(rear, 'nose')).toBe(0)
    expect(materialArea(rear, 'mouth')).toBe(0)
    for (const projection of [front, left, right, rear]) {
      projection.pixelMaterialIds.forEach((materialId, index) => {
        if (materialId === 'marking' || materialId === 'nose' || materialId === 'mouth') {
          expect(['muzzle-left', 'muzzle-right']).toContain(projection.ownerPrimitiveIds[index])
        }
      })
      expect(projection.metrics.pathCount).toBeLessThanOrEqual(7)
    }
  })

  it('recompiles bird and cat geometry controls but reuses prior compiled keys', () => {
    const cache = createCompiledAvatarMeshCache()
    const bird = createCompiledBirdFixture()
    const cat = createCompiledCatFixture()
    const birdMesh = cache.get(bird)
    const catMesh = cache.get(cat)
    expect(cache.compileCount).toBe(2)
    for (const variant of [
      createCompiledBirdFixture({ beakLength: 80 }),
      createCompiledBirdFixture({ beakWidth: 54 }),
      createCompiledBirdFixture({ beakHeight: 34 }),
      createCompiledBirdFixture({ beakY: 43 }),
      createCompiledCatFixture({ leftWidth: 74 }),
      createCompiledCatFixture({ leftHeight: 60 }),
      createCompiledCatFixture({ leftProtrusion: 21 }),
      createCompiledCatFixture({ rightWidth: 74 }),
      createCompiledCatFixture({ rightHeight: 60 }),
      createCompiledCatFixture({ rightProtrusion: 21 }),
      createCompiledCatFixture({ muzzleSpacing: 60 }),
      createCompiledCatFixture({ muzzleY: 50 })
    ]) cache.get(variant)
    expect(cache.compileCount).toBe(14)
    expect(cache.get(bird)).toBe(birdMesh)
    expect(cache.get(cat)).toBe(catMesh)
    expect(cache.compileCount).toBe(14)
  })

  it('keeps optimized ownership and markings pixel-identical across the full bird and cat view matrix', () => {
    const yawValues = [-90, -85, -60, -30, 0, 30, 60, 85, 90, 180]
    const pitchValues = [-30, 0, 30]
    const fixtures = [
      {
        input: COMPILED_SVG_TWO_SPHERE_INPUT,
        markings: []
      },
      {
        input: createCompiledBirdFixture(),
        markings: createCompiledBirdMarkings()
      },
      {
        input: createCompiledCatFixture(),
        markings: createCompiledCatMarkings()
      }
    ]
    for (const fixture of fixtures) {
      const mesh = compileAvatarMesh(fixture.input)
      const optimizedProjector = createOptimizedCompiledAvatarProjector(mesh, fixture.input.primitives, {
        height: 280,
        markings: fixture.markings,
        referenceSize: COMPILED_SVG_LAB_SIZE,
        width: 280
      })
      for (const pitchDegrees of pitchValues) {
        for (const yawDegrees of yawValues) {
          const pose = {
            pitch: pitchDegrees * Math.PI / 180,
            roll: 0,
            yaw: yawDegrees * Math.PI / 180
          }
          const baseline = projectCompiledAvatarMesh(mesh, fixture.input.primitives, {
            background: '#ff00ff',
            height: 280,
            markings: fixture.markings,
            materials: {},
            pose,
            referenceSize: COMPILED_SVG_LAB_SIZE,
            width: 280
          })
          const optimized = optimizedProjector.project(pose)
          let materialMismatchCount = 0
          let ownerMismatchCount = 0
          for (let pixelIndex = 0; pixelIndex < baseline.pixelMaterialIds.length; pixelIndex += 1) {
            const optimizedMaterialIndex = optimized.pixelMaterialIndexes[pixelIndex]!
            const optimizedOwnerIndex = optimized.ownerPrimitiveIndexes[pixelIndex]!
            if ((optimizedMaterialIndex < 0 ? null : optimized.materialIds[optimizedMaterialIndex])
              !== baseline.pixelMaterialIds[pixelIndex]) materialMismatchCount += 1
            if ((optimizedOwnerIndex < 0 ? null : fixture.input.primitives[optimizedOwnerIndex]?.id)
              !== baseline.ownerPrimitiveIds[pixelIndex]) ownerMismatchCount += 1
          }
          expect(materialMismatchCount).toBe(0)
          expect(ownerMismatchCount).toBe(0)
          expect(optimized.metrics.candidateTestsAfter).toBeLessThan(optimized.metrics.candidateTestsBefore)
        }
      }
      optimizedProjector.project({ pitch: 0, roll: 0, yaw: 0 })
      const repeated = optimizedProjector.project({ pitch: 0, roll: 0, yaw: 0 })
      expect(repeated.metrics.dirtyTileCount).toBe(0)
    }
  })
})
