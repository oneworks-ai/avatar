import {
  getAvatarBodyCompilerShapeSpec,
  mapAvatarPrimitiveLocalPointToAuthoredSurface,
  type AvatarBodyShape
} from './avatarGeometry'

export interface CompiledVec3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface CompiledAvatarPrimitive {
  readonly bottomTaper?: number
  readonly cutAngle?: number
  readonly id: string
  readonly materialId: string
  readonly position: CompiledVec3
  readonly productionShape?: AvatarBodyShape
  readonly roundness?: number
  readonly rotation?: CompiledVec3
  readonly scale: CompiledVec3
  readonly shape: AvatarBodyShape | 'ellipsoid'
  readonly topScale?: number
}

export interface CompiledAvatarSmoothUnionPair {
  readonly primitiveIds: readonly [string, string]
  readonly radius: number
}

export interface CompiledAvatarGeometryGroup {
  readonly id: string
  readonly primitiveIds: readonly string[]
  readonly resolution?: number
  readonly smoothUnionRadius?: number
}

export interface CompiledAvatarGeometryInput {
  readonly groups?: readonly CompiledAvatarGeometryGroup[]
  readonly id: string
  readonly primitives: readonly CompiledAvatarPrimitive[]
  readonly resolution?: number
  readonly smoothUnionPairs?: readonly CompiledAvatarSmoothUnionPair[]
  readonly smoothUnionRadius?: number
}

export interface CompiledAvatarMeshVertex extends CompiledVec3 {
  readonly id: string
  readonly normal: CompiledVec3
}

export interface CompiledAvatarMeshTriangle {
  readonly id: string
  readonly materialId: string
  readonly ownerPrimitiveIds: readonly string[]
  readonly ownerPrimitiveWeights: readonly number[]
  readonly primitiveId: string
  readonly vertexIndexes: readonly [number, number, number]
}

export interface CompiledAvatarMesh {
  readonly bounds: { readonly max: CompiledVec3, readonly min: CompiledVec3 }
  readonly compileKey: string
  readonly compileMs: number
  readonly id: string
  readonly triangles: readonly CompiledAvatarMeshTriangle[]
  readonly vertices: readonly CompiledAvatarMeshVertex[]
}

export interface CompiledAvatarPose {
  readonly pitch: number
  readonly roll: number
  readonly yaw: number
}

export interface CompiledAvatarSurfaceMarking {
  readonly area?: number
  readonly boundary?: readonly { readonly x: number, readonly y: number }[]
  readonly bounds?: {
    readonly maxX: number
    readonly maxY: number
    readonly minX: number
    readonly minY: number
  }
  readonly cacheKey?: string
  readonly center: { readonly x: number, readonly y: number }
  readonly coordinateSpace?: 'object' | 'primitive'
  readonly coverage?: 'region' | 'target-surface'
  readonly frontSpace?: 'object' | 'primitive'
  readonly id: string
  readonly materialId: string
  readonly radii: { readonly x: number, readonly y: number }
  readonly rotation?: number
  readonly side?: 'back' | 'face' | 'front' | 'left' | 'right'
  readonly surfaceMapping?: 'avatar-authored-v1' | 'primitive'
  readonly targetPrimitiveId: string
  readonly visibleNormalZ?: number
}

export interface CompiledAvatarProjectionOptions {
  readonly background: string
  readonly height: number
  readonly markings?: readonly CompiledAvatarSurfaceMarking[]
  readonly materials: Readonly<Record<string, string>>
  readonly pose: CompiledAvatarPose
  readonly referenceSize?: number
  readonly width: number
}

export interface CompiledAvatarProjection {
  readonly background: string
  readonly height: number
  readonly materialIds: readonly string[]
  readonly materialPaths: Readonly<Record<string, string>>
  readonly metrics: {
    readonly coloredPixelCount: number
    readonly pathCharacterCount: number
    readonly pathCount: number
    readonly projectMs: number
    readonly rasterizedTriangleCount: number
  }
  readonly ownerPrimitiveIds: readonly (string | null)[]
  readonly pixelMaterialIds: readonly (string | null)[]
  readonly width: number
}

export interface CompiledAvatarMeshCache {
  readonly compileCount: number
  get(input: CompiledAvatarGeometryInput): CompiledAvatarMesh
  has(input: CompiledAvatarGeometryInput): boolean
}

interface MutableMeshCache extends CompiledAvatarMeshCache {
  compileCount: number
}

interface Sample {
  readonly distance: number
  readonly primitiveIndex: number
}

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(Math.max(value, minimum), maximum)
)

const subtract = (left: CompiledVec3, right: CompiledVec3): CompiledVec3 => ({
  x: left.x - right.x,
  y: left.y - right.y,
  z: left.z - right.z
})

const cross = (left: CompiledVec3, right: CompiledVec3): CompiledVec3 => ({
  x: left.y * right.z - left.z * right.y,
  y: left.z * right.x - left.x * right.z,
  z: left.x * right.y - left.y * right.x
})

const dot = (left: CompiledVec3, right: CompiledVec3) => (
  left.x * right.x + left.y * right.y + left.z * right.z
)

const normalize = (vector: CompiledVec3): CompiledVec3 => {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length }
}

const interpolatePoint = (left: CompiledVec3, right: CompiledVec3, progress: number): CompiledVec3 => ({
  x: left.x + (right.x - left.x) * progress,
  y: left.y + (right.y - left.y) * progress,
  z: left.z + (right.z - left.z) * progress
})

const rotatePrimitiveVector = (point: CompiledVec3, rotation: CompiledVec3): CompiledVec3 => {
  const cosX = Math.cos(rotation.x)
  const sinX = Math.sin(rotation.x)
  const xY = point.y * cosX - point.z * sinX
  const xZ = point.y * sinX + point.z * cosX
  const cosY = Math.cos(rotation.y)
  const sinY = Math.sin(rotation.y)
  const yX = point.x * cosY + xZ * sinY
  const yZ = xZ * cosY - point.x * sinY
  const cosZ = Math.cos(rotation.z)
  const sinZ = Math.sin(rotation.z)
  return {
    x: yX * cosZ - xY * sinZ,
    y: yX * sinZ + xY * cosZ,
    z: yZ
  }
}

const primitiveLocalPoint = (primitive: CompiledAvatarPrimitive, point: CompiledVec3): CompiledVec3 => {
  const relative = subtract(point, primitive.position)
  const rotation = primitive.rotation ?? { x: 0, y: 0, z: 0 }
  const cosZ = Math.cos(-rotation.z)
  const sinZ = Math.sin(-rotation.z)
  const zX = relative.x * cosZ - relative.y * sinZ
  const zY = relative.x * sinZ + relative.y * cosZ
  const cosY = Math.cos(-rotation.y)
  const sinY = Math.sin(-rotation.y)
  const yX = zX * cosY + relative.z * sinY
  const yZ = relative.z * cosY - zX * sinY
  const cosX = Math.cos(-rotation.x)
  const sinX = Math.sin(-rotation.x)
  return {
    x: yX,
    y: zY * cosX - yZ * sinX,
    z: zY * sinX + yZ * cosX
  }
}

const productionPrimitiveDistance = (
  primitive: CompiledAvatarPrimitive,
  local: CompiledVec3
) => {
  const productionShape = primitive.productionShape
  if (productionShape == null) return null
  const spec = getAvatarBodyCompilerShapeSpec(productionShape)
  const localX = local.x / primitive.scale.x
  const localY = local.y / primitive.scale.y
  const localZ = local.z / primitive.scale.z
  const minimumScale = Math.min(primitive.scale.x, primitive.scale.y, primitive.scale.z)
  const verticalBoundary = Math.abs(localY) - 1

  if (spec.profile === 'cone' || spec.profile === 'frustum' || spec.profile === 'half-cone') {
    const progress = clamp((localY + 1) / 2, 0, 1)
    const roundness = clamp(primitive.roundness ?? 24, 0, 100) / 100
    const easedProgress = progress * progress * (3 - 2 * progress)
    const taperedProgress = spec.profile === 'frustum'
      ? progress + (easedProgress - progress) * roundness * .55
      : progress ** (1 + (.56 - 1) * roundness)
    const ringRadius = (spec.profile === 'frustum' ? .46 : 0) * (1 - taperedProgress) + taperedProgress
    const radialDistance = Math.hypot(localX, localZ) - ringRadius
    if (spec.profile !== 'half-cone') return Math.max(verticalBoundary, radialDistance) * minimumScale
    const cutAngle = (primitive.cutAngle ?? 0) * Math.PI / 180
    const halfSpace = -(localX * Math.sin(cutAngle) + localZ * Math.cos(cutAngle))
    return Math.max(verticalBoundary, radialDistance, halfSpace) * minimumScale
  }

  if (spec.profile === 'teardrop') {
    const exponent = spec.exponent
    const latitudeFactor = Math.max(1 - Math.abs(localY) ** (2 / exponent), 0) ** (exponent / 2)
    const progress = clamp((localY + 1) / 2, 0, 1)
    const widthTaper = .46 + (1.24 - .46) * progress
    const depthTaper = .7 + (1.12 - .7) * progress
    const horizontal = (
      Math.abs(localX / widthTaper) ** (2 / exponent)
      + Math.abs(localZ / depthTaper) ** (2 / exponent)
    ) ** (exponent / 2)
    return Math.max(verticalBoundary, horizontal - latitudeFactor) * minimumScale
  }

  if (spec.profile === 'trapezoid') {
    const roundness = clamp(primitive.roundness ?? 72, 0, 100) / 100
    const exponent = .34 + (.76 - .34) * roundness
    const latitudeFactor = Math.max(1 - Math.abs(localY) ** (2 / exponent), 0) ** (exponent / 2)
    const progress = clamp((localY + 1) / 2, 0, 1)
    const horizontalTaper = (primitive.topScale ?? .82) * (1 - progress) + 1.08 * progress
    const depthTaper = .92 * (1 - progress) + 1.04 * progress
    const horizontal = (
      Math.abs(localX / horizontalTaper) ** (2 / exponent)
      + Math.abs(localZ / depthTaper) ** (2 / exponent)
    ) ** (exponent / 2)
    return Math.max(verticalBoundary, horizontal - latitudeFactor) * minimumScale
  }

  const exponent = spec.exponent
  const latitudeFactor = Math.max(1 - Math.abs(localY) ** (2 / exponent), 0) ** (exponent / 2)
  const taper = productionShape === 'ellipse'
    ? 1 - clamp(primitive.bottomTaper ?? 0, 0, 100) / 100 * .62 * Math.max(localY, 0) ** 2
    : 1
  const horizontal = (
    Math.abs(localX / taper) ** (2 / exponent)
    + Math.abs(localZ / taper) ** (2 / exponent)
  ) ** (exponent / 2)
  return Math.max(verticalBoundary, horizontal - latitudeFactor) * minimumScale
}

export const compiledAvatarPrimitiveDistance = (primitive: CompiledAvatarPrimitive, point: CompiledVec3) => {
  const local = primitiveLocalPoint(primitive, point)
  const productionDistance = productionPrimitiveDistance(primitive, local)
  if (productionDistance != null) return productionDistance
  const localX = local.x / primitive.scale.x
  const localY = local.y / primitive.scale.y
  const localZ = local.z / primitive.scale.z
  const minimumScale = Math.min(
    primitive.scale.x,
    primitive.scale.y,
    primitive.scale.z
  )
  if (primitive.shape === 'cone') {
    const radiusAtZ = clamp((1 - localZ) / 2, 0, 1)
    const sideDistance = Math.hypot(localX, localY) - radiusAtZ
    const capDistance = Math.max(-1 - localZ, localZ - 1)
    return Math.max(sideDistance, capDistance) * minimumScale
  }
  return (Math.hypot(localX, localY, localZ) - 1) * minimumScale
}

const sampleUnion = (
  primitives: readonly CompiledAvatarPrimitive[],
  point: CompiledVec3,
  smoothUnionRadius = 0,
  smoothUnionPairs: readonly CompiledAvatarSmoothUnionPair[] = []
): Sample => {
  let distance = Number.POSITIVE_INFINITY
  let primitiveIndex = -1
  const primitiveDistances: number[] = []
  primitives.forEach((primitive, index) => {
    const candidate = compiledAvatarPrimitiveDistance(primitive, point)
    primitiveDistances.push(candidate)
    if (candidate < distance - 1e-7 || (Math.abs(candidate - distance) <= 1e-7 && index < primitiveIndex)) {
      distance = candidate
      primitiveIndex = index
    }
  })
  const smoothDistance = smoothUnionRadius > 0 && primitiveDistances.length > 1
    ? distance - smoothUnionRadius * Math.log(primitiveDistances.reduce((sum, candidate) => (
        sum + Math.exp(-(candidate - distance) / smoothUnionRadius)
      ), 0))
    : smoothUnionPairs.reduce((result, pair) => {
        const leftIndex = primitives.findIndex(primitive => primitive.id === pair.primitiveIds[0])
        const rightIndex = primitives.findIndex(primitive => primitive.id === pair.primitiveIds[1])
        if (leftIndex < 0 || rightIndex < 0 || pair.radius <= 0) return result
        const left = primitiveDistances[leftIndex]!
        const right = primitiveDistances[rightIndex]!
        const minimum = Math.min(left, right)
        const pairDistance = minimum - pair.radius * Math.log(
          Math.exp(-(left - minimum) / pair.radius) + Math.exp(-(right - minimum) / pair.radius)
        )
        return Math.min(result, pairDistance)
      }, distance)
  return { distance: smoothDistance, primitiveIndex }
}

const meshInputKey = (input: CompiledAvatarGeometryInput) => JSON.stringify({
  groups: input.groups ?? [],
  id: input.id,
  primitives: input.primitives.map(primitive => ({
    bottomTaper: primitive.bottomTaper,
    cutAngle: primitive.cutAngle,
    id: primitive.id,
    materialId: primitive.materialId,
    position: primitive.position,
    productionShape: primitive.productionShape,
    roundness: primitive.roundness,
    rotation: primitive.rotation,
    scale: primitive.scale,
    shape: primitive.shape,
    topScale: primitive.topScale
  })),
  resolution: input.resolution ?? 38,
  smoothUnionPairs: input.smoothUnionPairs ?? [],
  smoothUnionRadius: input.smoothUnionRadius ?? 0
})

const CUBE_CORNERS = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
] as const

const CUBE_TETRAHEDRA = [
  [0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6],
  [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]
] as const

export const compileAvatarMesh = (input: CompiledAvatarGeometryInput): CompiledAvatarMesh => {
  const startedAt = performance.now()
  if (input.primitives.length === 0) {
    return {
      bounds: { max: { x: 1, y: 1, z: 1 }, min: { x: -1, y: -1, z: -1 } },
      compileKey: meshInputKey(input),
      compileMs: performance.now() - startedAt,
      id: input.id,
      triangles: [],
      vertices: []
    }
  }
  if (input.groups != null && input.groups.length > 0) {
    const groupedPrimitiveIds = new Set(input.groups.flatMap(group => group.primitiveIds))
    const groups: readonly CompiledAvatarGeometryGroup[] = [
      ...input.groups,
      ...input.primitives
        .filter(primitive => !groupedPrimitiveIds.has(primitive.id))
        .map(primitive => ({ id: `independent-${primitive.id}`, primitiveIds: [primitive.id] }))
    ]
    const vertices: CompiledAvatarMeshVertex[] = []
    const triangles: CompiledAvatarMeshTriangle[] = []
    let boundsMin = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY, z: Number.POSITIVE_INFINITY }
    let boundsMax = { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY, z: Number.NEGATIVE_INFINITY }
    for (const group of groups) {
      const primitiveIds = new Set(group.primitiveIds)
      const primitives = input.primitives.filter(primitive => primitiveIds.has(primitive.id))
      if (primitives.length === 0) continue
      const groupMesh = compileAvatarMesh({
        id: `${input.id}-${group.id}`,
        primitives,
        resolution: group.resolution ?? input.resolution,
        smoothUnionRadius: group.smoothUnionRadius ?? 0
      })
      const vertexOffset = vertices.length
      vertices.push(...groupMesh.vertices.map(vertex => ({
        ...vertex,
        id: `${group.id}-${vertex.id}`
      })))
      triangles.push(...groupMesh.triangles.map(triangle => ({
        ...triangle,
        id: `${group.id}-${triangle.id}`,
        vertexIndexes: triangle.vertexIndexes.map(index => index + vertexOffset) as [number, number, number]
      })))
      boundsMin = {
        x: Math.min(boundsMin.x, groupMesh.bounds.min.x),
        y: Math.min(boundsMin.y, groupMesh.bounds.min.y),
        z: Math.min(boundsMin.z, groupMesh.bounds.min.z)
      }
      boundsMax = {
        x: Math.max(boundsMax.x, groupMesh.bounds.max.x),
        y: Math.max(boundsMax.y, groupMesh.bounds.max.y),
        z: Math.max(boundsMax.z, groupMesh.bounds.max.z)
      }
    }
    return {
      bounds: { max: boundsMax, min: boundsMin },
      compileKey: meshInputKey(input),
      compileMs: performance.now() - startedAt,
      id: input.id,
      triangles,
      vertices
    }
  }
  const primitiveBounds = input.primitives.flatMap(primitive => {
    const rotation = primitive.rotation ?? { x: 0, y: 0, z: 0 }
    const corners = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => (
      rotatePrimitiveVector({
        x: x * primitive.scale.x,
        y: y * primitive.scale.y,
        z: z * primitive.scale.z
      }, rotation)
    ))))
    return corners.map(corner => ({
      x: primitive.position.x + corner.x,
      y: primitive.position.y + corner.y,
      z: primitive.position.z + corner.z
    }))
  })
  const rawMin = primitiveBounds.reduce((result, point) => ({
    x: Math.min(result.x, point.x),
    y: Math.min(result.y, point.y),
    z: Math.min(result.z, point.z)
  }), { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY, z: Number.POSITIVE_INFINITY })
  const rawMax = primitiveBounds.reduce((result, point) => ({
    x: Math.max(result.x, point.x),
    y: Math.max(result.y, point.y),
    z: Math.max(result.z, point.z)
  }), { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY, z: Number.NEGATIVE_INFINITY })
  const longestSpan = Math.max(rawMax.x - rawMin.x, rawMax.y - rawMin.y, rawMax.z - rawMin.z)
  const resolution = clamp(Math.round(input.resolution ?? 38), 20, 64)
  const step = longestSpan / resolution
  const margin = step * 1.5
  const min = { x: rawMin.x - margin, y: rawMin.y - margin, z: rawMin.z - margin }
  const max = { x: rawMax.x + margin, y: rawMax.y + margin, z: rawMax.z + margin }
  const columns = Math.ceil((max.x - min.x) / step)
  const rows = Math.ceil((max.y - min.y) / step)
  const layers = Math.ceil((max.z - min.z) / step)
  const sampleColumns = columns + 1
  const sampleRows = rows + 1
  const sampleLayers = layers + 1
  const sampleCount = sampleColumns * sampleRows * sampleLayers
  const distances = new Float32Array(sampleCount)
  const sampleIndex = (column: number, row: number, layer: number) => (
    (layer * sampleRows + row) * sampleColumns + column
  )
  const samplePoint = (column: number, row: number, layer: number): CompiledVec3 => ({
    x: min.x + column * step,
    y: min.y + row * step,
    z: min.z + layer * step
  })
  for (let layer = 0; layer < sampleLayers; layer += 1) {
    for (let row = 0; row < sampleRows; row += 1) {
      for (let column = 0; column < sampleColumns; column += 1) {
        const index = sampleIndex(column, row, layer)
        distances[index] = sampleUnion(
          input.primitives,
          samplePoint(column, row, layer),
          input.smoothUnionRadius,
          input.smoothUnionPairs
        ).distance
      }
    }
  }

  const vertices: CompiledAvatarMeshVertex[] = []
  const triangles: CompiledAvatarMeshTriangle[] = []
  const edgeVertexIndexes = new Map<string, number>()
  const gradientDelta = step * .12
  const gradientAt = (point: CompiledVec3) => normalize({
    x: sampleUnion(input.primitives, { ...point, x: point.x + gradientDelta }, input.smoothUnionRadius, input.smoothUnionPairs).distance
      - sampleUnion(input.primitives, { ...point, x: point.x - gradientDelta }, input.smoothUnionRadius, input.smoothUnionPairs).distance,
    y: sampleUnion(input.primitives, { ...point, y: point.y + gradientDelta }, input.smoothUnionRadius, input.smoothUnionPairs).distance
      - sampleUnion(input.primitives, { ...point, y: point.y - gradientDelta }, input.smoothUnionRadius, input.smoothUnionPairs).distance,
    z: sampleUnion(input.primitives, { ...point, z: point.z + gradientDelta }, input.smoothUnionRadius, input.smoothUnionPairs).distance
      - sampleUnion(input.primitives, { ...point, z: point.z - gradientDelta }, input.smoothUnionRadius, input.smoothUnionPairs).distance
  })
  const edgeVertex = (
    leftSampleIndex: number,
    rightSampleIndex: number,
    leftPoint: CompiledVec3,
    rightPoint: CompiledVec3
  ) => {
    const edgeKey = leftSampleIndex < rightSampleIndex
      ? `${leftSampleIndex}:${rightSampleIndex}`
      : `${rightSampleIndex}:${leftSampleIndex}`
    const cached = edgeVertexIndexes.get(edgeKey)
    if (cached != null) return cached
    const leftDistance = distances[leftSampleIndex]!
    const rightDistance = distances[rightSampleIndex]!
    const progress = clamp(leftDistance / (leftDistance - rightDistance || 1), 0, 1)
    const point = interpolatePoint(leftPoint, rightPoint, progress)
    const index = vertices.length
    vertices.push({ id: `v-${edgeKey}`, normal: gradientAt(point), ...point })
    edgeVertexIndexes.set(edgeKey, index)
    return index
  }
  const appendTriangle = (
    vertexIndexes: readonly [number, number, number],
    stableId: string
  ) => {
    let ordered = vertexIndexes
    const [left, middle, right] = vertexIndexes.map(index => vertices[index]!) as [
      CompiledAvatarMeshVertex,
      CompiledAvatarMeshVertex,
      CompiledAvatarMeshVertex
    ]
    const geometricNormal = cross(subtract(middle, left), subtract(right, left))
    const expectedNormal = normalize({
      x: left.normal.x + middle.normal.x + right.normal.x,
      y: left.normal.y + middle.normal.y + right.normal.y,
      z: left.normal.z + middle.normal.z + right.normal.z
    })
    if (dot(geometricNormal, expectedNormal) < 0) ordered = [vertexIndexes[0], vertexIndexes[2], vertexIndexes[1]]
    const centroid = ordered.map(index => vertices[index]!).reduce((point, vertex) => ({
      x: point.x + vertex.x / 3,
      y: point.y + vertex.y / 3,
      z: point.z + vertex.z / 3
    }), { x: 0, y: 0, z: 0 })
    const owner = sampleUnion(input.primitives, centroid, input.smoothUnionRadius, input.smoothUnionPairs).primitiveIndex
    const primitive = input.primitives[Math.max(owner, 0)]!
    const blendRadius = Math.max(
      input.smoothUnionRadius ?? 0,
      ...(input.smoothUnionPairs ?? []).map(pair => pair.radius),
      0
    )
    const connectedOwners = new Set<number>([owner])
    if ((input.smoothUnionRadius ?? 0) > 0) {
      input.primitives.forEach((_, index) => connectedOwners.add(index))
    } else {
      for (const pair of input.smoothUnionPairs ?? []) {
        const leftIndex = input.primitives.findIndex(candidate => candidate.id === pair.primitiveIds[0])
        const rightIndex = input.primitives.findIndex(candidate => candidate.id === pair.primitiveIds[1])
        if (leftIndex === owner && rightIndex >= 0) connectedOwners.add(rightIndex)
        if (rightIndex === owner && leftIndex >= 0) connectedOwners.add(leftIndex)
      }
    }
    const rawWeights = blendRadius > 0 && connectedOwners.size > 1
      ? (() => {
          const primitiveDistances = input.primitives.map(candidate => compiledAvatarPrimitiveDistance(candidate, centroid))
          const minimumDistance = Math.min(...primitiveDistances)
          return primitiveDistances.map((distance, index) => (
            connectedOwners.has(index) ? Math.exp(-(distance - minimumDistance) / blendRadius) : 0
          ))
        })()
      : input.primitives.map((_, index) => index === owner ? 1 : 0)
    const weightTotal = rawWeights.reduce((total, weight) => total + weight, 0) || 1
    triangles.push({
      id: `t-${stableId}`,
      materialId: primitive.materialId,
      ownerPrimitiveIds: input.primitives.map(candidate => candidate.id),
      ownerPrimitiveWeights: rawWeights.map(weight => weight / weightTotal),
      primitiveId: primitive.id,
      vertexIndexes: ordered
    })
  }

  for (let layer = 0; layer < layers; layer += 1) {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const cornerSampleIndexes = CUBE_CORNERS.map(([offsetX, offsetY, offsetZ]) => (
          sampleIndex(column + offsetX, row + offsetY, layer + offsetZ)
        ))
        const cornerPoints = CUBE_CORNERS.map(([offsetX, offsetY, offsetZ]) => (
          samplePoint(column + offsetX, row + offsetY, layer + offsetZ)
        ))
        for (let tetrahedronIndex = 0; tetrahedronIndex < CUBE_TETRAHEDRA.length; tetrahedronIndex += 1) {
          const tetrahedron = CUBE_TETRAHEDRA[tetrahedronIndex]!
          const inside = tetrahedron.filter(corner => distances[cornerSampleIndexes[corner]!]! <= 0)
          const outside = tetrahedron.filter(corner => distances[cornerSampleIndexes[corner]!]! > 0)
          if (inside.length === 0 || outside.length === 0) continue
          const crossing = (leftCorner: number, rightCorner: number) => edgeVertex(
            cornerSampleIndexes[leftCorner]!,
            cornerSampleIndexes[rightCorner]!,
            cornerPoints[leftCorner]!,
            cornerPoints[rightCorner]!
          )
          const stablePrefix = `${column}-${row}-${layer}-${tetrahedronIndex}`
          if (inside.length === 1) {
            const center = inside[0]!
            appendTriangle([
              crossing(center, outside[0]!),
              crossing(center, outside[1]!),
              crossing(center, outside[2]!)
            ], `${stablePrefix}-0`)
          } else if (outside.length === 1) {
            const center = outside[0]!
            appendTriangle([
              crossing(center, inside[0]!),
              crossing(center, inside[2]!),
              crossing(center, inside[1]!)
            ], `${stablePrefix}-0`)
          } else {
            const [insideA, insideB] = inside as [number, number]
            const [outsideA, outsideB] = outside as [number, number]
            const aToA = crossing(insideA, outsideA)
            const aToB = crossing(insideA, outsideB)
            const bToA = crossing(insideB, outsideA)
            const bToB = crossing(insideB, outsideB)
            appendTriangle([aToA, bToA, bToB], `${stablePrefix}-0`)
            appendTriangle([aToA, bToB, aToB], `${stablePrefix}-1`)
          }
        }
      }
    }
  }

  return {
    bounds: { max, min },
    compileKey: meshInputKey(input),
    compileMs: performance.now() - startedAt,
    id: input.id,
    triangles,
    vertices
  }
}

export const createCompiledAvatarMeshCache = (maxEntries = Number.POSITIVE_INFINITY): CompiledAvatarMeshCache => {
  const cache = new Map<string, CompiledAvatarMesh>()
  const api: MutableMeshCache = {
    compileCount: 0,
    get(input) {
      const key = meshInputKey(input)
      const cached = cache.get(key)
      if (cached != null) {
        // Refresh insertion order so bounded production caches keep recently
        // reused avatar configurations warm.
        cache.delete(key)
        cache.set(key, cached)
        return cached
      }
      const compiled = compileAvatarMesh(input)
      cache.set(key, compiled)
      while (cache.size > maxEntries) {
        const oldestKey = cache.keys().next().value
        if (oldestKey == null) break
        cache.delete(oldestKey)
      }
      api.compileCount += 1
      return compiled
    },
    has(input) {
      return cache.has(meshInputKey(input))
    }
  }
  return api
}

const rotatePoint = (point: CompiledVec3, pose: CompiledAvatarPose): CompiledVec3 => {
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

const polygonEdge = (left: { readonly x: number, readonly y: number }, right: { readonly x: number, readonly y: number }, pointX: number, pointY: number) => (
  (pointX - left.x) * (right.y - left.y) - (pointY - left.y) * (right.x - left.x)
)

const pointInPolygon = (
  polygon: readonly { readonly x: number, readonly y: number }[],
  pointX: number,
  pointY: number
) => {
  let inside = false
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const point = polygon[index]!
    const previous = polygon[previousIndex]!
    if ((point.y > pointY) !== (previous.y > pointY)
      && pointX < (previous.x - point.x) * (pointY - point.y) / (previous.y - point.y) + point.x) {
      inside = !inside
    }
  }
  return inside
}

const markingAt = (
  markings: readonly CompiledAvatarSurfaceMarking[],
  primitive: CompiledAvatarPrimitive,
  point: CompiledVec3,
  normal: CompiledVec3
) => {
  const local = primitiveLocalPoint(primitive, point)
  const localX = local.x / primitive.scale.x
  const localY = local.y / primitive.scale.y
  const localZ = local.z / primitive.scale.z
  let selected: CompiledAvatarSurfaceMarking | undefined
  for (const marking of markings) {
    const side = marking.side ?? 'front'
    const authored = marking.surfaceMapping === 'avatar-authored-v1' && primitive.productionShape != null
      ? mapAvatarPrimitiveLocalPointToAuthoredSurface(
          primitive.productionShape,
          { x: localX, y: localY, z: localZ },
          side,
          primitive
        )
      : null
    const sourceX = marking.coordinateSpace === 'object' ? point.x : localX
    const sourceY = marking.coordinateSpace === 'object' ? point.y : localY
    const sourceZ = marking.coordinateSpace === 'object' ? point.z : localZ
    const frontSourceX = marking.frontSpace === 'object' ? point.x : localX
    const frontSourceZ = marking.frontSpace === 'object' ? point.z : localZ
    const surfaceX = authored?.x ?? (side === 'left'
      ? sourceZ
      : side === 'right'
        ? -sourceZ
        : sourceX)
    const surfaceY = authored?.y ?? sourceY
    const frontDepth = authored?.frontDepth ?? (side === 'back'
      ? -frontSourceZ
      : side === 'left'
        ? -frontSourceX
        : side === 'right'
          ? frontSourceX
          : frontSourceZ)
    const deltaX = surfaceX - marking.center.x
    const deltaY = surfaceY - marking.center.y
    const cosRotation = Math.cos(marking.rotation ?? 0)
    const sinRotation = Math.sin(marking.rotation ?? 0)
    const normalizedX = (deltaX * cosRotation + deltaY * sinRotation) / marking.radii.x
    const normalizedY = (-deltaX * sinRotation + deltaY * cosRotation) / marking.radii.y
    const insideBounds = marking.bounds == null || (
      surfaceX >= marking.bounds.minX &&
      surfaceX <= marking.bounds.maxX &&
      surfaceY >= marking.bounds.minY &&
      surfaceY <= marking.bounds.maxY
    )
    const inside = !insideBounds
      ? false
      : marking.boundary == null
      ? normalizedX ** 2 + normalizedY ** 2 <= 1
      : pointInPolygon(marking.boundary, surfaceX, surfaceY)
    if (!inside
      || frontDepth <= 0
      || normal.z < (marking.visibleNormalZ ?? -.05)) continue
    if (selected == null
      || (marking.area ?? marking.radii.x * marking.radii.y) <
        (selected.area ?? selected.radii.x * selected.radii.y)) {
      selected = marking
    }
  }
  return selected
}

const pixelsToPath = (
  materialIndex: number,
  pixelMaterials: Int16Array,
  width: number,
  height: number
) => {
  const rectangles: Array<{ x: number, y: number, width: number, height: number }> = []
  const active = new Map<string, { x: number, y: number, width: number, height: number }>()
  for (let y = 0; y < height; y += 1) {
    const rowRuns: Array<{ x: number, width: number }> = []
    let x = 0
    while (x < width) {
      if (pixelMaterials[y * width + x] !== materialIndex) {
        x += 1
        continue
      }
      const start = x
      while (x < width && pixelMaterials[y * width + x] === materialIndex) x += 1
      rowRuns.push({ width: x - start, x: start })
    }
    const nextActive = new Map<string, { x: number, y: number, width: number, height: number }>()
    for (const run of rowRuns) {
      const key = `${run.x}:${run.width}`
      const previous = active.get(key)
      if (previous == null) {
        nextActive.set(key, { ...run, height: 1, y })
      } else {
        previous.height += 1
        nextActive.set(key, previous)
      }
    }
    for (const [key, rectangle] of active) {
      if (!nextActive.has(key)) rectangles.push(rectangle)
    }
    active.clear()
    for (const [key, rectangle] of nextActive) active.set(key, rectangle)
  }
  rectangles.push(...active.values())
  return rectangles.map(rectangle => (
    `M${rectangle.x} ${rectangle.y}h${rectangle.width}v${rectangle.height}h-${rectangle.width}Z`
  )).join('')
}

export const projectCompiledAvatarMesh = (
  mesh: CompiledAvatarMesh,
  primitives: readonly CompiledAvatarPrimitive[],
  options: CompiledAvatarProjectionOptions
): CompiledAvatarProjection => {
  const startedAt = performance.now()
  const worldToPixelScale = options.width / (options.referenceSize ?? options.width)
  const rotatedVertices = mesh.vertices.map(vertex => ({
    normal: rotatePoint(vertex.normal, options.pose),
    object: vertex,
    projected: (() => {
      const rotated = rotatePoint(vertex, options.pose)
      return {
        x: options.width / 2 + rotated.x * worldToPixelScale,
        y: options.height / 2 + rotated.y * worldToPixelScale,
        z: rotated.z
      }
    })()
  }))
  const depthBuffer = new Float32Array(options.width * options.height)
  depthBuffer.fill(Number.NEGATIVE_INFINITY)
  const triangleBuffer = new Int32Array(options.width * options.height)
  triangleBuffer.fill(-1)
  let rasterizedTriangleCount = 0
  mesh.triangles.forEach((triangle, triangleIndex) => {
    const [first, second, third] = triangle.vertexIndexes.map(index => rotatedVertices[index]!) as [
      (typeof rotatedVertices)[number],
      (typeof rotatedVertices)[number],
      (typeof rotatedVertices)[number]
    ]
    const points = [first.projected, second.projected, third.projected] as const
    const area = polygonEdge(points[0], points[1], points[2].x, points[2].y)
    // Cull from the projected geometric winding, not an averaged vertex normal.
    // At a compiled union seam the smoothed gradient can cross the horizon
    // inside one triangle; averaging it can incorrectly remove a genuinely
    // front-facing sliver and expose the background at an attachment root.
    if (area >= -1e-6) return
    const minX = clamp(Math.floor(Math.min(...points.map(point => point.x))), 0, options.width - 1)
    const maxX = clamp(Math.ceil(Math.max(...points.map(point => point.x))), 0, options.width - 1)
    const minY = clamp(Math.floor(Math.min(...points.map(point => point.y))), 0, options.height - 1)
    const maxY = clamp(Math.ceil(Math.max(...points.map(point => point.y))), 0, options.height - 1)
    rasterizedTriangleCount += 1
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const sampleX = x + .5
        const sampleY = y + .5
        const weightA = polygonEdge(points[1], points[2], sampleX, sampleY) / area
        const weightB = polygonEdge(points[2], points[0], sampleX, sampleY) / area
        const weightC = 1 - weightA - weightB
        if (weightA < -1e-6 || weightB < -1e-6 || weightC < -1e-6) continue
        const depth = first.projected.z * weightA + second.projected.z * weightB + third.projected.z * weightC
        const pixelIndex = y * options.width + x
        if (depth <= depthBuffer[pixelIndex]! + 1e-5) continue
        depthBuffer[pixelIndex] = depth
        triangleBuffer[pixelIndex] = triangleIndex
      }
    }
  })

  const materialIds = [...new Set([
    ...mesh.triangles.map(triangle => triangle.materialId),
    ...(options.markings ?? []).map(marking => marking.materialId)
  ])]
  const materialIndexes = new Map(materialIds.map((materialId, index) => [materialId, index]))
  const markingsByPrimitive = new Map<string, CompiledAvatarSurfaceMarking[]>()
  for (const marking of options.markings ?? []) {
    markingsByPrimitive.set(marking.targetPrimitiveId, [
      ...(markingsByPrimitive.get(marking.targetPrimitiveId) ?? []),
      marking
    ])
  }
  const pixelMaterialIndexes = new Int16Array(options.width * options.height)
  pixelMaterialIndexes.fill(-1)
  const pixelMaterialIds: Array<string | null> = new Array(options.width * options.height).fill(null)
  const ownerPrimitiveIds: Array<string | null> = new Array(options.width * options.height).fill(null)
  let coloredPixelCount = 0
  for (let pixelIndex = 0; pixelIndex < triangleBuffer.length; pixelIndex += 1) {
    const triangleIndex = triangleBuffer[pixelIndex]!
    if (triangleIndex < 0) continue
    const triangle = mesh.triangles[triangleIndex]!
    const [first, second, third] = triangle.vertexIndexes.map(index => rotatedVertices[index]!) as [
      (typeof rotatedVertices)[number],
      (typeof rotatedVertices)[number],
      (typeof rotatedVertices)[number]
    ]
    const x = pixelIndex % options.width + .5
    const y = Math.floor(pixelIndex / options.width) + .5
    const area = polygonEdge(first.projected, second.projected, third.projected.x, third.projected.y)
    const weightA = polygonEdge(second.projected, third.projected, x, y) / area
    const weightB = polygonEdge(third.projected, first.projected, x, y) / area
    const weightC = 1 - weightA - weightB
    const objectPoint = {
      x: first.object.x * weightA + second.object.x * weightB + third.object.x * weightC,
      y: first.object.y * weightA + second.object.y * weightB + third.object.y * weightC,
      z: first.object.z * weightA + second.object.z * weightB + third.object.z * weightC
    }
    // The compiled union surface is shared, so a triangle can straddle the
    // material boundary between two source primitives. Resolve that boundary
    // from object-space distances per visible sample instead of assigning the
    // whole triangle to its centroid owner. This keeps material ownership
    // independent from tessellation density without re-running compilation.
    let ownerPrimitiveIndex = -1
    let ownerDistance = Number.POSITIVE_INFINITY
    const ownerCandidates = new Set(triangle.ownerPrimitiveIds)
    for (let primitiveIndex = 0; primitiveIndex < primitives.length; primitiveIndex += 1) {
      const primitive = primitives[primitiveIndex]!
      if (!ownerCandidates.has(primitive.id)) continue
      const distance = compiledAvatarPrimitiveDistance(primitive, objectPoint)
      if (distance < ownerDistance) {
        ownerDistance = distance
        ownerPrimitiveIndex = primitiveIndex
      }
    }
    if (ownerPrimitiveIndex < 0) continue
    const ownerPrimitive = primitives[ownerPrimitiveIndex]!
    const primitiveMarkings = markingsByPrimitive.get(ownerPrimitive.id) ?? []
    const marking = primitiveMarkings.length === 0
      ? undefined
      : markingAt(primitiveMarkings, ownerPrimitive, objectPoint, normalize({
          x: first.object.normal.x * weightA + second.object.normal.x * weightB + third.object.normal.x * weightC,
          y: first.object.normal.y * weightA + second.object.normal.y * weightB + third.object.normal.y * weightC,
          z: first.object.normal.z * weightA + second.object.normal.z * weightB + third.object.normal.z * weightC
        }))
    const materialId = marking?.materialId ?? ownerPrimitive.materialId
    pixelMaterialIndexes[pixelIndex] = materialIndexes.get(materialId) ?? -1
    pixelMaterialIds[pixelIndex] = materialId
    ownerPrimitiveIds[pixelIndex] = ownerPrimitive.id
    coloredPixelCount += 1
  }
  const materialPaths = Object.fromEntries(materialIds.map((materialId, materialIndex) => [
    materialId,
    pixelsToPath(materialIndex, pixelMaterialIndexes, options.width, options.height)
  ]))
  return {
    background: options.background,
    height: options.height,
    materialIds,
    materialPaths,
    metrics: {
      coloredPixelCount,
      pathCharacterCount: Object.values(materialPaths).reduce((total, path) => total + path.length, 0),
      pathCount: Object.values(materialPaths).filter(Boolean).length,
      projectMs: performance.now() - startedAt,
      rasterizedTriangleCount
    },
    ownerPrimitiveIds,
    pixelMaterialIds,
    width: options.width
  }
}

export const compiledAvatarProjectionColorAt = (
  projection: CompiledAvatarProjection,
  x: number,
  y: number,
  materials: Readonly<Record<string, string>>
) => {
  const pixelX = clamp(Math.floor(x), 0, projection.width - 1)
  const pixelY = clamp(Math.floor(y), 0, projection.height - 1)
  const materialId = projection.pixelMaterialIds[pixelY * projection.width + pixelX]
  return materialId == null ? projection.background : materials[materialId] ?? projection.background
}
