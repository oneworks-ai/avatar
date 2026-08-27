import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'
import {
  buildAvatarSurfaceDecalLocalBoundaries,
  getAvatarBodyCompilerShapeSpec,
  type AvatarFaceStyle
} from './avatarGeometry'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import {
  createCompiledAvatarMeshCache,
  type CompiledAvatarGeometryInput,
  type CompiledAvatarMesh,
  type CompiledAvatarMeshCache,
  type CompiledAvatarPose,
  type CompiledAvatarPrimitive,
  type CompiledAvatarSurfaceMarking
} from './compiledAvatarMesh'
import {
  createOptimizedCompiledAvatarProjector,
  type OptimizedCompiledAvatarProjection,
  type OptimizedCompiledAvatarProjector
} from './compiledAvatarMeshOptimized'

const VIEW_SIZE = 420
const degreesToRadians = (degrees = 0) => degrees * Math.PI / 180
const COMPILED_SURFACE_DECAL_MATERIAL_PREFIX = 'surface-decal:'
const FULL_TARGET_SURFACE_OVERRIDES = new Set([
  'chick:chick-beak-explicit-color-override:beak',
  'duck:duck-bill-explicit-color-override:bill',
  'penguin:penguin-beak-explicit-color-override:beak',
  'owl:owl-beak-explicit-color-override:beak',
  'parrot:parrot-beak-explicit-color-override:beak',
  'goose:goose-bill-explicit-color-override:bill'
])

const createCompiledPrimitive = (part: AvatarEntityPart): CompiledAvatarPrimitive => {
  const spec = getAvatarBodyCompilerShapeSpec(part.shape)
  return {
    bottomTaper: part.bottomTaper,
    cutAngle: part.cutAngle,
    id: part.id,
    // Materials remain projection-time state. A stable semantic material id
    // keeps palette/color-only edits out of the geometry compile key.
    materialId: part.id,
    position: { x: part.x, y: part.y, z: part.z },
    productionShape: part.shape,
    rotation: {
      x: degreesToRadians(part.rotationX),
      y: degreesToRadians(part.rotationY),
      z: degreesToRadians(part.rotationZ)
    },
    roundness: part.roundness,
    scale: {
      x: spec.radiusX * part.scaleX,
      y: spec.radiusY * part.scaleY,
      z: spec.radiusZ * (part.scaleZ ?? Math.min(part.scaleX, part.scaleY))
    },
    shape: part.shape,
    topScale: part.topScale
  }
}

export const createAvatarCompiledGeometryInput = (
  preset: AvatarEntityPreset,
  parts: readonly AvatarEntityPart[],
  resolution: number
): CompiledAvatarGeometryInput => ({
  groups: parts.map(part => ({
    id: `anatomy-${part.id}`,
    primitiveIds: [part.id],
    resolution
  })),
  id: `production-${preset}`,
  primitives: parts.map(createCompiledPrimitive),
  resolution
})

export type AvatarCompiledRenderCache = CompiledAvatarMeshCache

export const createAvatarCompiledRenderCache = (maxEntries?: number): AvatarCompiledRenderCache => (
  createCompiledAvatarMeshCache(maxEntries)
)

export interface AvatarCompiledProjectionOptions {
  readonly centerX?: number
  readonly centerY?: number
  readonly faceStyle: AvatarFaceStyle
  readonly height: number
  readonly pose: CompiledAvatarPose
  readonly surfaceDecals: readonly AvatarSurfaceDecal[]
  readonly width: number
}

const supportsCompiledSurfaceDecal = (decal: AvatarSurfaceDecal) => decal.targetPartId != null

export const getAvatarCompiledSurfaceDecalMaterialId = (
  _preset: AvatarEntityPreset,
  decal: AvatarSurfaceDecal
) => supportsCompiledSurfaceDecal(decal)
  ? `${COMPILED_SURFACE_DECAL_MATERIAL_PREFIX}${decal.id}`
  : null

const createAvatarCompiledSurfaceMarkings = (
  preset: AvatarEntityPreset,
  input: CompiledAvatarGeometryInput,
  decals: readonly AvatarSurfaceDecal[]
): CompiledAvatarSurfaceMarking[] => {
  const primitivesById = new Map(input.primitives.map(primitive => [primitive.id, primitive]))
  return decals.flatMap(decal => {
    const materialId = getAvatarCompiledSurfaceDecalMaterialId(preset, decal)
    const target = decal.targetPartId == null ? null : primitivesById.get(decal.targetPartId)
    if (materialId == null || target?.productionShape == null) return []
    const spec = getAvatarBodyCompilerShapeSpec(target.productionShape)
    const side = decal.side ?? 'front'
    const boundaries = buildAvatarSurfaceDecalLocalBoundaries(decal, target.productionShape, {
      bottomTaper: target.bottomTaper,
      cutAngle: target.cutAngle,
      roundness: target.roundness,
      topScale: target.topScale
    })
    return boundaries.flatMap((boundary, boundaryIndex) => {
      if (boundary.length < 3) return []
      // Full-crown authored markings are split at z=0 while their object-space
      // samples are still available. Preserve that hemisphere here because
      // the normalized x/y silhouette alone is ambiguous front-to-back.
      const boundarySide = boundary[0]?.surfaceSide ?? side
      const normalizedBoundary = boundary.map(point => ({
        x: point.x / spec.radiusX,
        y: point.y / spec.radiusY
      }))
      const area = Math.abs(normalizedBoundary.reduce((total, point, index) => {
        const next = normalizedBoundary[(index + 1) % normalizedBoundary.length]!
        return total + point.x * next.y - next.x * point.y
      }, 0)) / 2
      const boundaryX = normalizedBoundary.map(point => point.x)
      const boundaryY = normalizedBoundary.map(point => point.y)
      return [{
        area,
        boundary: normalizedBoundary,
        bounds: {
          maxX: Math.max(...boundaryX),
          maxY: Math.max(...boundaryY),
          minX: Math.min(...boundaryX),
          minY: Math.min(...boundaryY)
        },
        cacheKey: `avatar-authored-v1:${decal.id}:${target.id}:${decal.shape}:${boundarySide}:${decal.x}:${decal.y}:` +
          `${decal.width}:${decal.height}:${decal.rotation}:${decal.bend ?? 0}:${boundaryIndex}`,
        center: { x: decal.x / spec.radiusX, y: decal.y / spec.radiusY },
        coordinateSpace: 'primitive',
        coverage: FULL_TARGET_SURFACE_OVERRIDES.has(`${preset}:${decal.id}:${target.id}`)
          ? 'target-surface'
          : 'region',
        frontSpace: 'primitive',
        id: boundaryIndex === 0 ? decal.id : `${decal.id}:${boundaryIndex}`,
        materialId,
        radii: {
          x: decal.width / 2 / spec.radiusX,
          y: decal.height / 2 / spec.radiusY
        },
        rotation: 0,
        side: boundarySide,
        surfaceMapping: 'avatar-authored-v1',
        targetPrimitiveId: target.id,
        // The marking is authored on the primitive's positive-Z hemisphere.
        // Final visibility comes from the compiled owner/depth field; using an
        // unrotated object normal here would incorrectly cull the marking as the
        // Avatar pose changes.
        visibleNormalZ: -1
      } satisfies CompiledAvatarSurfaceMarking]
    })
  })
}

const surfaceMarkingKey = (markings: readonly CompiledAvatarSurfaceMarking[]) => markings.map(marking => (
  marking.cacheKey ?? (
  `${marking.id}:${marking.targetPrimitiveId}:${marking.materialId}:${marking.center.x}:${marking.center.y}:` +
  `${marking.radii.x}:${marking.radii.y}:${marking.rotation ?? 0}:${marking.visibleNormalZ ?? 0}:` +
  `${marking.side ?? 'front'}:${marking.surfaceMapping ?? 'primitive'}:${marking.coverage ?? 'region'}:` +
  `${marking.boundary?.map(point => `${point.x},${point.y}`).join(';') ?? ''}`
  )
)).join('|')

const projectorCache = new WeakMap<CompiledAvatarMesh, Map<string, OptimizedCompiledAvatarProjector>>()
const MAX_PROJECTORS_PER_MESH = 2

const getProjector = (
  mesh: CompiledAvatarMesh,
  input: CompiledAvatarGeometryInput,
  markings: readonly CompiledAvatarSurfaceMarking[],
  width: number,
  height: number,
  centerX: number,
  centerY: number
) => {
  let projectors = projectorCache.get(mesh)
  if (projectors == null) {
    projectors = new Map()
    projectorCache.set(mesh, projectors)
  }
  const key = `${width}:${height}:${centerX}:${centerY}:avatar-pose:${surfaceMarkingKey(markings)}`
  let projector = projectors.get(key)
  if (projector != null) {
    projectors.delete(key)
    projectors.set(key, projector)
  } else {
    projector = createOptimizedCompiledAvatarProjector(mesh, input.primitives, {
      centerX,
      centerY,
      height,
      markings,
      poseConvention: 'avatar',
      referenceSize: VIEW_SIZE,
      width
    })
    projectors.set(key, projector)
    while (projectors.size > MAX_PROJECTORS_PER_MESH) {
      const oldestKey = projectors.keys().next().value
      if (oldestKey == null) break
      projectors.delete(oldestKey)
    }
  }
  return projector
}

export type AvatarCompiledProjection = OptimizedCompiledAvatarProjection

export const projectAvatarCompiledScene = (
  mesh: CompiledAvatarMesh,
  input: CompiledAvatarGeometryInput,
  options: AvatarCompiledProjectionOptions
): AvatarCompiledProjection => {
  // Face and decal geometry are intentionally projection-time inputs. The
  // production wiring consumes the same owner paths for their clips without
  // turning either into geometry compile invalidations.
  void options.faceStyle
  const markings = createAvatarCompiledSurfaceMarkings(
    input.id.startsWith('production-')
      ? input.id.slice('production-'.length) as AvatarEntityPreset
      : 'custom',
    input,
    options.surfaceDecals
  )
  const projection = getProjector(
    mesh,
    input,
    markings,
    options.width,
    options.height,
    options.centerX ?? options.width / 2,
    options.centerY ?? options.height / 2
  ).project(options.pose)
  return projection
}
