import type { BodyGeometry, BodySurfaceTriangle, BodySurfaceVertex } from './avatarGeometry'

const DEPTH_EPSILON = .025
const AREA_EPSILON = .02
const OCCLUSION_GRID_MAX_DIMENSION = 96
const OCCLUSION_SHARED_PAIR_GRID_MAX_DIMENSION = 64
const OCCLUSION_GRID_SIMPLE_MAX_DIMENSION = 160
const OCCLUSION_GRID_INTERACTIVE_MAX_DIMENSION = 48
const OCCLUSION_GRID_MIN_DIMENSION = 12
const OCCLUSION_LOCAL_REFINEMENT_DIMENSION = 16
const OCCLUSION_BOUNDARY_SNAP_RATIO = .8
const OCCLUSION_BOUNDARY_SIMPLIFY_RATIO = .18
// A disconnected subtractive mask smaller than one compositor sample cannot
// express stable ownership. It shows up as a hard sliver while the real narrow
// anatomy is still painted and hit-tested from its complete surface geometry.
const OCCLUSION_MIN_COMPONENT_CELL_AREA_RATIO = .85
const OCCLUSION_MAX_SEGMENTS_PER_PART = 240
const OCCLUSION_MAX_SEGMENTS_PER_GRAPH = 3_000
// Interaction overlays need a stronger contract than paint masks. A tiny
// ownership residue may be harmless while filling a part, but stroking the
// part's full outline can expose it as a persistent arc after the anatomy has
// rotated behind the head. Require both an absolute region and a meaningful
// fraction of the projected anatomy before the region can own interaction UI.
const MIN_INTERACTION_VISIBLE_AREA = .5
const MIN_INTERACTION_VISIBLE_AREA_RATIO = .1
const MIN_INTERACTION_VISIBLE_AREA_RATIO_INTERACTIVE = .36

export const AVATAR_FRAGMENT_RENDER_BUDGET = {
  maxRasterizationErrorRatio: .07,
  maxSimplificationAreaErrorRatio: .05,
  maxOcclusionPatches: 300,
  maxPathCharacters: 80_000,
  maxSegments: OCCLUSION_MAX_SEGMENTS_PER_GRAPH,
  maxSegmentsPerPart: OCCLUSION_MAX_SEGMENTS_PER_PART
} as const

interface Point2 {
  readonly x: number
  readonly y: number
}

interface DepthBoundarySegment {
  readonly end: Point2
  readonly ownerIndex: number
  readonly start: Point2
}

export interface AvatarFragmentOcclusionPolygon {
  readonly points: readonly Point2[]
}

export interface AvatarFragmentHitResult {
  readonly depth: number
  readonly index: number
  readonly partId: string
}

interface OcclusionGrid {
  readonly bounds: BodySurfaceTriangle['bounds']
  readonly cells: Uint8Array
  readonly columns: number
  readonly owners: Int16Array
  readonly rows: number
}

interface DepthPoint extends Point2 {
  readonly aDepth: number
  readonly bDepth: number
  readonly delta: number
}

interface PlacedTriangle {
  readonly bounds: BodySurfaceTriangle['bounds']
  readonly id: string
  readonly maxDepth: number
  readonly meanDepth: number
  readonly minDepth: number
  readonly partId: string
  readonly vertices: readonly [BodySurfaceVertex, BodySurfaceVertex, BodySurfaceVertex]
}

export interface AvatarProjectedPartSurface {
  readonly anchorDepth: number
  readonly geometry: BodyGeometry
  readonly id: string
  readonly index: number
  readonly occludedByFaceHint?: boolean
  readonly projectedX: number
  readonly projectedY: number
}

export interface AvatarFragmentRenderNode {
  readonly boundaryCellDiagonal: number
  readonly boundaryDisplacementRatio: number
  readonly depth: number
  readonly drawCavity: true
  readonly drawOutline: true
  readonly index: number
  readonly intersects: boolean
  readonly interactionVisibleArea: number
  readonly interactionVisiblePath?: string
  readonly interactionVisiblePolygons: readonly AvatarFragmentOcclusionPolygon[]
  readonly interactionVisibleRatio: number
  readonly maxDepth: number
  readonly maxBoundaryDisplacement: number
  readonly minDepth: number
  readonly occlusionPath?: string
  readonly occlusionPatchCount: number
  readonly occlusionComponentCount: number
  readonly occlusionPolygons: readonly AvatarFragmentOcclusionPolygon[]
  readonly occlusionSegmentCount: number
  readonly outlinePolygon: readonly BodySurfaceVertex[]
  readonly partId: string
  readonly projectedAreaEstimate: number
  readonly simplificationAreaErrorRatio: number
  readonly sharedPaintPath?: string
  readonly stableKey: string
  readonly surfaceTriangles: readonly BodySurfaceTriangle[]
  readonly visibleAreaEstimate: number
}

export interface AvatarFragmentRenderGraph {
  readonly cacheKey: string
  readonly compositionMode: 'independent-masks' | 'shared-partition'
  readonly sharedPairBasePartId?: string
  readonly metrics: {
    readonly intersectingPartCount: number
    readonly rasterizationErrorRatio: number
    readonly occlusionPatchCount: number
    readonly occlusionPathCharacterCount: number
    readonly occlusionSegmentCount: number
    readonly partCount: number
    readonly rawOcclusionPatchCount: number
    readonly rasterizationMeasured: boolean
    readonly trianglePairTests: number
  }
  readonly nodes: readonly AvatarFragmentRenderNode[]
}

interface AvatarFragmentRenderGraphOptions {
  readonly quality?: 'full' | 'interactive'
}

const cross = (a: Point2, b: Point2, c: Point2) => (
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
)

const polygonArea = (points: readonly Point2[]) => Math.abs(points.reduce((total, point, index) => {
  const next = points[(index + 1) % points.length]!
  return total + point.x * next.y - next.x * point.y
}, 0) / 2)

const polygonPath = (points: readonly Point2[]) => (
  `M ${points.map(point => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' L ')} Z`
)

const roundedPolygonPath = (points: readonly Point2[], radius: number) => {
  if (points.length < 3 || radius <= 0) return polygonPath(points)
  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length]!
    const next = points[(index + 1) % points.length]!
    const previousLength = Math.hypot(previous.x - point.x, previous.y - point.y)
    const nextLength = Math.hypot(next.x - point.x, next.y - point.y)
    const trim = Math.min(radius, previousLength * .42, nextLength * .42)
    return {
      control: point,
      entry: {
        x: point.x + (previous.x - point.x) / (previousLength || 1) * trim,
        y: point.y + (previous.y - point.y) / (previousLength || 1) * trim
      },
      exit: {
        x: point.x + (next.x - point.x) / (nextLength || 1) * trim,
        y: point.y + (next.y - point.y) / (nextLength || 1) * trim
      }
    }
  })
  const first = corners[0]!
  const segments = corners.slice(1).map(corner => (
    `L ${corner.entry.x.toFixed(3)} ${corner.entry.y.toFixed(3)} ` +
    `Q ${corner.control.x.toFixed(3)} ${corner.control.y.toFixed(3)} ` +
    `${corner.exit.x.toFixed(3)} ${corner.exit.y.toFixed(3)}`
  ))
  segments.push(
    `L ${first.entry.x.toFixed(3)} ${first.entry.y.toFixed(3)} ` +
    `Q ${first.control.x.toFixed(3)} ${first.control.y.toFixed(3)} ` +
    `${first.exit.x.toFixed(3)} ${first.exit.y.toFixed(3)}`
  )
  return `M ${first.exit.x.toFixed(3)} ${first.exit.y.toFixed(3)} ${segments.join(' ')} Z`
}

const smoothClosedPolygonPath = (points: readonly Point2[]) => {
  if (points.length < 3) return polygonPath(points)
  const midpoint = (left: Point2, right: Point2): Point2 => ({
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2
  })
  const first = midpoint(points.at(-1)!, points[0]!)
  const curves = points.map((point, index) => {
    const next = midpoint(point, points[(index + 1) % points.length]!)
    return `Q ${point.x.toFixed(3)} ${point.y.toFixed(3)} ${next.x.toFixed(3)} ${next.y.toFixed(3)}`
  })
  return `M ${first.x.toFixed(3)} ${first.y.toFixed(3)} ${curves.join(' ')} Z`
}

const smoothClosedPolygonPoints = (points: readonly Point2[], passes = 3): Point2[] => {
  let smoothed = [...points]
  for (let pass = 0; pass < passes && smoothed.length >= 3; pass += 1) {
    smoothed = smoothed.map((point, index) => {
      const previous = smoothed[(index + smoothed.length - 1) % smoothed.length]!
      const next = smoothed[(index + 1) % smoothed.length]!
      return {
        x: (previous.x + point.x * 2 + next.x) / 4,
        y: (previous.y + point.y * 2 + next.y) / 4
      }
    })
  }
  return smoothed
}

const normalizeSharedOwnerGrid = (grid: OcclusionGrid, ownerIndex: number) => {
  const normalized: OcclusionGrid = {
    bounds: grid.bounds,
    cells: new Uint8Array(grid.cells),
    columns: grid.columns,
    owners: new Int16Array(grid.owners),
    rows: grid.rows
  }
  const visitedEmpty = new Uint8Array(grid.cells.length)
  const visitedFilled = new Uint8Array(grid.cells.length)
  const neighbors = (index: number) => {
    const row = Math.floor(index / grid.columns)
    const column = index % grid.columns
    const result: number[] = []
    if (column > 0) result.push(index - 1)
    if (column + 1 < grid.columns) result.push(index + 1)
    if (row > 0) result.push(index - grid.columns)
    if (row + 1 < grid.rows) result.push(index + grid.columns)
    return result
  }
  const collectComponent = (start: number, filled: boolean, visited: Uint8Array) => {
    const queue = [start]
    const component: number[] = []
    let touchesBoundary = false
    visited[start] = 1
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor]!
      component.push(index)
      const row = Math.floor(index / grid.columns)
      const column = index % grid.columns
      touchesBoundary ||= row === 0 || row + 1 === grid.rows || column === 0 || column + 1 === grid.columns
      for (const neighbor of neighbors(index)) {
        if (visited[neighbor] === 1 || (normalized.cells[neighbor] === 1) !== filled) continue
        visited[neighbor] = 1
        queue.push(neighbor)
      }
    }
    return { component, touchesBoundary }
  }

  // A shared two-surface partition has one continuous equality boundary. Tiny
  // enclosed islands are raster ownership noise, not anatomy. Remove them
  // before tracing so the visible path cannot expose a pinhole of the rear
  // colour or add an isolated dot to the front colour.
  for (let index = 0; index < grid.cells.length; index += 1) {
    if (normalized.cells[index] === 1 || visitedEmpty[index] === 1) continue
    const { component, touchesBoundary } = collectComponent(index, false, visitedEmpty)
    if (touchesBoundary) continue
    for (const cellIndex of component) {
      normalized.cells[cellIndex] = 1
      normalized.owners[cellIndex] = ownerIndex
    }
  }
  const filledComponents: number[][] = []
  for (let index = 0; index < grid.cells.length; index += 1) {
    if (normalized.cells[index] !== 1 || visitedFilled[index] === 1) continue
    const { component } = collectComponent(index, true, visitedFilled)
    filledComponents.push(component)
  }
  const primaryComponent = filledComponents.reduce<number[] | null>((largest, component) => (
    largest == null || component.length > largest.length ? component : largest
  ), null)
  const primaryCells = new Set(primaryComponent ?? [])
  for (const component of filledComponents) {
    if (component === primaryComponent) continue
    for (const cellIndex of component) {
      normalized.cells[cellIndex] = 0
      normalized.owners[cellIndex] = -1
    }
  }
  return normalized
}

const boundsOverlap = (a: BodySurfaceTriangle['bounds'], b: BodySurfaceTriangle['bounds']) => (
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
)

const depthRangesOverlap = (
  a: Pick<PlacedTriangle, 'maxDepth' | 'minDepth'>,
  b: Pick<PlacedTriangle, 'maxDepth' | 'minDepth'>
) => a.minDepth <= b.maxDepth + DEPTH_EPSILON && a.maxDepth >= b.minDepth - DEPTH_EPSILON

const placeTriangle = (
  triangle: BodySurfaceTriangle,
  part: AvatarProjectedPartSurface
): PlacedTriangle => {
  const vertices = triangle.vertices.map(vertex => ({
    depth: vertex.depth + part.anchorDepth,
    x: vertex.x + part.projectedX,
    y: vertex.y + part.projectedY
  })) as unknown as readonly [BodySurfaceVertex, BodySurfaceVertex, BodySurfaceVertex]
  const depths = vertices.map(vertex => vertex.depth)
  const xs = vertices.map(vertex => vertex.x)
  const ys = vertices.map(vertex => vertex.y)
  return {
    bounds: {
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
      minX: Math.min(...xs),
      minY: Math.min(...ys)
    },
    id: triangle.id,
    maxDepth: Math.max(...depths),
    meanDepth: depths.reduce((total, depth) => total + depth, 0) / depths.length,
    minDepth: Math.min(...depths),
    partId: part.id,
    vertices
  }
}

const signedPolygonArea = (points: readonly Point2[]) => points.reduce((total, point, index) => {
  const next = points[(index + 1) % points.length]!
  return total + point.x * next.y - next.x * point.y
}, 0) / 2

const clipConvexPolygon = (
  subject: readonly Point2[],
  clip: readonly [Point2, Point2, Point2]
): Point2[] => {
  let output = [...subject]
  const orientation = signedPolygonArea(clip) >= 0 ? 1 : -1
  for (let edgeIndex = 0; edgeIndex < clip.length; edgeIndex += 1) {
    const edgeStart = clip[edgeIndex]!
    const edgeEnd = clip[(edgeIndex + 1) % clip.length]!
    const input = output
    output = []
    for (let index = 0; index < input.length; index += 1) {
      const previous = input[(index + input.length - 1) % input.length]!
      const current = input[index]!
      const previousDistance = cross(edgeStart, edgeEnd, previous) * orientation
      const currentDistance = cross(edgeStart, edgeEnd, current) * orientation
      const previousInside = previousDistance >= -AREA_EPSILON
      const currentInside = currentDistance >= -AREA_EPSILON
      if (previousInside !== currentInside) {
        const ratio = previousDistance / (previousDistance - currentDistance)
        output.push({
          x: previous.x + (current.x - previous.x) * ratio,
          y: previous.y + (current.y - previous.y) * ratio
        })
      }
      if (currentInside) output.push(current)
    }
    if (output.length < 3) return []
  }
  return output
}

const interpolateTriangleDepth = (
  point: Point2,
  triangle: readonly [BodySurfaceVertex, BodySurfaceVertex, BodySurfaceVertex]
) => {
  const [a, b, c] = triangle
  const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
  if (Math.abs(denominator) < Number.EPSILON) return (a.depth + b.depth + c.depth) / 3
  const weightA = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator
  const weightB = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator
  const weightC = 1 - weightA - weightB
  return weightA * a.depth + weightB * b.depth + weightC * c.depth
}

const clipDepthPolygon = (points: readonly DepthPoint[], keepAFront: boolean): DepthPoint[] => {
  const output: DepthPoint[] = []
  const isInside = (point: DepthPoint) => keepAFront ? point.delta >= 0 : point.delta < 0
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index + points.length - 1) % points.length]!
    const current = points[index]!
    const previousInside = isInside(previous)
    const currentInside = isInside(current)
    if (previousInside !== currentInside) {
      const ratio = previous.delta / (previous.delta - current.delta)
      const aDepth = previous.aDepth + (current.aDepth - previous.aDepth) * ratio
      const bDepth = previous.bDepth + (current.bDepth - previous.bDepth) * ratio
      output.push({
        aDepth,
        bDepth,
        delta: aDepth - bDepth,
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio
      })
    }
    if (currentInside) output.push(current)
  }
  return output
}

const splitTriangleOverlapByDepth = (a: PlacedTriangle, b: PlacedTriangle) => {
  const overlap = clipConvexPolygon(a.vertices, b.vertices)
  if (overlap.length < 3 || polygonArea(overlap) <= AREA_EPSILON) return null
  const points = overlap.map(point => {
    const aDepth = interpolateTriangleDepth(point, a.vertices)
    const bDepth = interpolateTriangleDepth(point, b.vertices)
    return { ...point, aDepth, bDepth, delta: aDepth - bDepth }
  })
  const allTied = points.every(point => Math.abs(point.delta) <= DEPTH_EPSILON)
  return {
    aFront: allTied ? points : clipDepthPolygon(points, true),
    bFront: allTied ? [] : clipDepthPolygon(points, false),
    overlap,
    tied: allTied
  }
}

const appendUnionBoundarySegments = (
  target: DepthBoundarySegment[],
  polygons: readonly (readonly Point2[])[],
  ownerIndex: number
) => {
  const inUnion = (point: Point2) => polygons.some(polygon => pointInPolygon(point, polygon))
  for (const polygon of polygons) {
    const orientation = signedPolygonArea(polygon) >= 0 ? 1 : -1
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index]!
      const end = polygon[(index + 1) % polygon.length]!
      const length = Math.hypot(end.x - start.x, end.y - start.y)
      if (length <= AREA_EPSILON) continue
      const sampleDistance = Math.max(AREA_EPSILON * 2, Math.min(.16, length * .03))
      const inward = {
        x: -(end.y - start.y) / length * orientation,
        y: (end.x - start.x) / length * orientation
      }
      const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
      const inside = {
        x: midpoint.x + inward.x * sampleDistance,
        y: midpoint.y + inward.y * sampleDistance
      }
      const outside = {
        x: midpoint.x - inward.x * sampleDistance,
        y: midpoint.y - inward.y * sampleDistance
      }
      if (inUnion(inside) && !inUnion(outside)) target.push({ end, ownerIndex, start })
    }
  }
}

const partBounds = (triangles: readonly PlacedTriangle[]) => ({
  maxX: Math.max(...triangles.map(triangle => triangle.bounds.maxX)),
  maxY: Math.max(...triangles.map(triangle => triangle.bounds.maxY)),
  minX: Math.min(...triangles.map(triangle => triangle.bounds.minX)),
  minY: Math.min(...triangles.map(triangle => triangle.bounds.minY))
})

const createOcclusionGrid = (
  bounds: BodySurfaceTriangle['bounds'],
  maxDimension: number = OCCLUSION_GRID_MAX_DIMENSION
): OcclusionGrid => {
  const width = Math.max(bounds.maxX - bounds.minX, AREA_EPSILON)
  const height = Math.max(bounds.maxY - bounds.minY, AREA_EPSILON)
  const columns = width >= height
    ? maxDimension
    : Math.max(OCCLUSION_GRID_MIN_DIMENSION, Math.round(maxDimension * width / height))
  const rows = height >= width
    ? maxDimension
    : Math.max(OCCLUSION_GRID_MIN_DIMENSION, Math.round(maxDimension * height / width))
  const owners = new Int16Array(columns * rows)
  owners.fill(-1)
  return { bounds, cells: new Uint8Array(columns * rows), columns, owners, rows }
}

const cloneOcclusionGrid = (grid: OcclusionGrid): OcclusionGrid => ({
  bounds: grid.bounds,
  cells: new Uint8Array(grid.cells.length),
  columns: grid.columns,
  owners: new Int16Array(grid.owners),
  rows: grid.rows
})

const rasterizeSurfaceDepth = (
  grid: OcclusionGrid,
  triangle: PlacedTriangle,
  depths: Float64Array
) => {
  const width = grid.bounds.maxX - grid.bounds.minX
  const height = grid.bounds.maxY - grid.bounds.minY
  const cellWidth = width / grid.columns
  const cellHeight = height / grid.rows
  const firstColumn = Math.max(0, Math.ceil((triangle.bounds.minX - grid.bounds.minX) / cellWidth - .5))
  const lastColumn = Math.min(grid.columns - 1, Math.floor((triangle.bounds.maxX - grid.bounds.minX) / cellWidth - .5))
  const firstRow = Math.max(0, Math.ceil((triangle.bounds.minY - grid.bounds.minY) / cellHeight - .5))
  const lastRow = Math.min(grid.rows - 1, Math.floor((triangle.bounds.maxY - grid.bounds.minY) / cellHeight - .5))

  for (let row = firstRow; row <= lastRow; row += 1) {
    const y = grid.bounds.minY + (row + .5) * cellHeight
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const x = grid.bounds.minX + (column + .5) * cellWidth
      if (!pointInPolygon({ x, y }, triangle.vertices)) continue
      const cellIndex = row * grid.columns + column
      depths[cellIndex] = Math.max(depths[cellIndex]!, interpolateTriangleDepth({ x, y }, triangle.vertices))
    }
  }
}

const buildSharedDepthEqualitySegments = (
  grid: OcclusionGrid,
  leftDepths: Float64Array,
  rightDepths: Float64Array,
  ownerIndex: number
): DepthBoundarySegment[] => {
  const cellWidth = (grid.bounds.maxX - grid.bounds.minX) / grid.columns
  const cellHeight = (grid.bounds.maxY - grid.bounds.minY) / grid.rows
  let depthDeltas = new Float64Array(grid.cells.length)
  depthDeltas.fill(Number.NaN)
  for (let index = 0; index < depthDeltas.length; index += 1) {
    const leftDepth = leftDepths[index]!
    const rightDepth = rightDepths[index]!
    if (Number.isFinite(leftDepth) && Number.isFinite(rightDepth)) {
      depthDeltas[index] = leftDepth - rightDepth
    }
  }
  // The body surface is intentionally a bounded triangle mesh. Its piecewise
  // planar depth can alternate at adjacent triangle seams even though the
  // underlying equality curve is smooth. Filter only that shared depth-delta
  // field before interpolation; categorical ownership and silhouettes remain
  // untouched, so this removes mesh-frequency chatter without inventing a
  // lower-resolution owner graph.
  for (let pass = 0; pass < 2; pass += 1) {
    const filtered = new Float64Array(depthDeltas.length)
    filtered.fill(Number.NaN)
    for (let row = 0; row < grid.rows; row += 1) {
      for (let column = 0; column < grid.columns; column += 1) {
        const index = row * grid.columns + column
        if (!Number.isFinite(depthDeltas[index]!)) continue
        let total = 0
        let totalWeight = 0
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          const sampleRow = row + offsetY
          if (sampleRow < 0 || sampleRow >= grid.rows) continue
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const sampleColumn = column + offsetX
            if (sampleColumn < 0 || sampleColumn >= grid.columns) continue
            const value = depthDeltas[sampleRow * grid.columns + sampleColumn]!
            if (!Number.isFinite(value)) continue
            const weight = (offsetX === 0 ? 2 : 1) * (offsetY === 0 ? 2 : 1)
            total += value * weight
            totalWeight += weight
          }
        }
        filtered[index] = totalWeight === 0 ? depthDeltas[index]! : total / totalWeight
      }
    }
    depthDeltas = filtered
  }
  const pointAt = (column: number, row: number): DepthPoint | null => {
    const index = row * grid.columns + column
    const leftDepth = leftDepths[index]!
    const rightDepth = rightDepths[index]!
    const delta = depthDeltas[index]!
    if (!Number.isFinite(leftDepth) || !Number.isFinite(rightDepth) || !Number.isFinite(delta)) return null
    return {
      aDepth: leftDepth,
      bDepth: rightDepth,
      delta,
      x: grid.bounds.minX + (column + .5) * cellWidth,
      y: grid.bounds.minY + (row + .5) * cellHeight
    }
  }
  const crossing = (start: DepthPoint, end: DepthPoint): Point2 | null => {
    const startFront = start.delta >= 0
    const endFront = end.delta >= 0
    if (startFront === endFront) return null
    const denominator = start.delta - end.delta
    const ratio = Math.abs(denominator) < Number.EPSILON ? .5 : start.delta / denominator
    return {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio
    }
  }
  const segments: DepthBoundarySegment[] = []
  for (let row = 0; row + 1 < grid.rows; row += 1) {
    for (let column = 0; column + 1 < grid.columns; column += 1) {
      const topLeft = pointAt(column, row)
      const topRight = pointAt(column + 1, row)
      const bottomRight = pointAt(column + 1, row + 1)
      const bottomLeft = pointAt(column, row + 1)
      if (topLeft == null || topRight == null || bottomRight == null || bottomLeft == null) continue
      const crossings = [
        crossing(topLeft, topRight),
        crossing(topRight, bottomRight),
        crossing(bottomRight, bottomLeft),
        crossing(bottomLeft, topLeft)
      ]
      const present = crossings.flatMap((point, edge) => point == null ? [] : [{ edge, point }])
      if (present.length === 2) {
        segments.push({ end: present[1]!.point, ownerIndex, start: present[0]!.point })
        continue
      }
      if (present.length !== 4) continue
      // Resolve the marching-squares saddle from the bilinear centre depth.
      // This gives every cell one stable topology without a categorical island.
      const centreDelta = (topLeft.delta + topRight.delta + bottomRight.delta + bottomLeft.delta) / 4
      const topLeftOwnsCentre = (topLeft.delta >= 0) === (centreDelta >= 0)
      const pairs = topLeftOwnsCentre
        ? [[0, 3], [1, 2]] as const
        : [[0, 1], [2, 3]] as const
      for (const [startEdge, endEdge] of pairs) {
        segments.push({
          end: crossings[endEdge]!,
          ownerIndex,
          start: crossings[startEdge]!
        })
      }
    }
  }
  return segments
}

interface GridEdge {
  readonly direction: number
  readonly endX: number
  readonly endY: number
  readonly ownerIndex: number
  readonly startX: number
  readonly startY: number
}

const gridPointKey = (x: number, y: number) => `${x}:${y}`

const simplifyCollinear = (points: readonly Point2[]) => points.filter((point, index) => {
  const previous = points[(index + points.length - 1) % points.length]!
  const next = points[(index + 1) % points.length]!
  return Math.abs(cross(previous, point, next)) > Number.EPSILON
})

const pointLineDistance = (point: Point2, start: Point2, end: Point2) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (Math.abs(dx) + Math.abs(dy) < Number.EPSILON) return Math.hypot(point.x - start.x, point.y - start.y)
  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / Math.hypot(dx, dy)
}

const simplifyOpenPath = (points: readonly Point2[], tolerance: number): Point2[] => {
  if (points.length <= 2) return [...points]
  let maxDistance = 0
  let maxIndex = 0
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = pointLineDistance(points[index]!, points[0]!, points[points.length - 1]!)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = index
    }
  }
  if (maxDistance <= tolerance) return [points[0]!, points[points.length - 1]!]
  const left = simplifyOpenPath(points.slice(0, maxIndex + 1), tolerance)
  const right = simplifyOpenPath(points.slice(maxIndex), tolerance)
  return [...left.slice(0, -1), ...right]
}

const simplifyClosedPath = (points: readonly Point2[], tolerance: number) => {
  if (points.length <= 4) return [...points]
  const anchorIndex = points.reduce((best, point, index) => (
    point.x < points[best]!.x || (point.x === points[best]!.x && point.y < points[best]!.y) ? index : best
  ), 0)
  const rotated = [...points.slice(anchorIndex), ...points.slice(0, anchorIndex)]
  let oppositeIndex = 1
  let oppositeDistance = 0
  for (let index = 1; index < rotated.length; index += 1) {
    const distance = (rotated[index]!.x - rotated[0]!.x) ** 2 + (rotated[index]!.y - rotated[0]!.y) ** 2
    if (distance > oppositeDistance) {
      oppositeDistance = distance
      oppositeIndex = index
    }
  }
  const first = simplifyOpenPath(rotated.slice(0, oppositeIndex + 1), tolerance)
  const second = simplifyOpenPath([...rotated.slice(oppositeIndex), rotated[0]!], tolerance)
  return simplifyCollinear([...first.slice(0, -1), ...second.slice(0, -1)])
}

const closestPointOnSegment = (
  point: Point2,
  segment: Pick<DepthBoundarySegment, 'end' | 'start'>
) => {
  const dx = segment.end.x - segment.start.x
  const dy = segment.end.y - segment.start.y
  const lengthSquared = dx * dx + dy * dy
  const ratio = lengthSquared < Number.EPSILON ? 0 : Math.max(0, Math.min(1,
    ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / lengthSquared
  ))
  const closest = { x: segment.start.x + dx * ratio, y: segment.start.y + dy * ratio }
  return { closest, distance: Math.hypot(point.x - closest.x, point.y - closest.y) }
}

const snapToDepthBoundary = (
  point: Point2,
  segments: readonly DepthBoundarySegment[],
  maxDistance: number
) => {
  let bestPoint = point
  let bestDistance = maxDistance
  for (const segment of segments) {
    if (point.x < Math.min(segment.start.x, segment.end.x) - maxDistance
      || point.x > Math.max(segment.start.x, segment.end.x) + maxDistance
      || point.y < Math.min(segment.start.y, segment.end.y) - maxDistance
      || point.y > Math.max(segment.start.y, segment.end.y) + maxDistance) continue
    const candidate = closestPointOnSegment(point, segment)
    if (candidate.distance < bestDistance) {
      bestDistance = candidate.distance
      bestPoint = candidate.closest
    }
  }
  return bestPoint
}

const distanceToPolygonBoundary = (point: Point2, polygon: readonly Point2[]) => {
  let distance = Number.POSITIVE_INFINITY
  for (let index = 0; index < polygon.length; index += 1) {
    distance = Math.min(distance, closestPointOnSegment(point, {
      end: polygon[(index + 1) % polygon.length]!,
      start: polygon[index]!
    }).distance)
  }
  return distance
}

const traceOcclusionGrid = (
  grid: OcclusionGrid,
  maxSegments: number,
  depthBoundaries: readonly DepthBoundarySegment[]
) => {
  const edges: GridEdge[] = []
  const filled = (column: number, row: number) => (
    column >= 0 && column < grid.columns && row >= 0 && row < grid.rows
      ? grid.cells[row * grid.columns + column] === 1
      : false
  )
  const ownerAt = (column: number, row: number) => (
    grid.owners[row * grid.columns + column] ?? -1
  )
  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      if (!filled(column, row)) continue
      const ownerIndex = ownerAt(column, row)
      if (!filled(column, row - 1)) edges.push({ direction: 0, endX: column + 1, endY: row, ownerIndex, startX: column, startY: row })
      if (!filled(column + 1, row)) edges.push({ direction: 1, endX: column + 1, endY: row + 1, ownerIndex, startX: column + 1, startY: row })
      if (!filled(column, row + 1)) edges.push({ direction: 2, endX: column, endY: row + 1, ownerIndex, startX: column + 1, startY: row + 1 })
      if (!filled(column - 1, row)) edges.push({ direction: 3, endX: column, endY: row, ownerIndex, startX: column, startY: row + 1 })
    }
  }
  const outgoing = new Map<string, number[]>()
  edges.forEach((edge, index) => {
    const key = gridPointKey(edge.startX, edge.startY)
    outgoing.set(key, [...(outgoing.get(key) ?? []), index])
  })
  const used = new Uint8Array(edges.length)
  const loops: Array<{ owners: number[]; points: Point2[] }> = []
  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
    if (used[edgeIndex] === 1) continue
    const first = edges[edgeIndex]!
    const loop: Point2[] = [{ x: first.startX, y: first.startY }]
    const loopOwners: number[] = [first.ownerIndex]
    let currentIndex = edgeIndex
    let guard = 0
    while (guard <= edges.length) {
      guard += 1
      const current = edges[currentIndex]!
      used[currentIndex] = 1
      loop.push({ x: current.endX, y: current.endY })
      loopOwners.push(current.ownerIndex)
      if (current.endX === first.startX && current.endY === first.startY) break
      const candidates = (outgoing.get(gridPointKey(current.endX, current.endY)) ?? [])
        .filter(candidate => used[candidate] === 0)
        .sort((left, right) => {
          const leftTurn = (edges[left]!.direction - current.direction + 4) % 4
          const rightTurn = (edges[right]!.direction - current.direction + 4) % 4
          const priority = (turn: number) => turn === 1 ? 0 : turn === 0 ? 1 : turn === 3 ? 2 : 3
          return priority(leftTurn) - priority(rightTurn) || left - right
        })
      if (candidates.length === 0) break
      currentIndex = candidates[0]!
    }
    if (loop.length >= 4) loops.push({ owners: loopOwners.slice(0, -1), points: loop.slice(0, -1) })
  }

  const cellWidth = (grid.bounds.maxX - grid.bounds.minX) / grid.columns
  const cellHeight = (grid.bounds.maxY - grid.bounds.minY) / grid.rows
  const cellDiagonal = Math.hypot(cellWidth, cellHeight)
  const toWorld = (point: Point2): Point2 => ({
    x: grid.bounds.minX + point.x * cellWidth,
    y: grid.bounds.minY + point.y * cellHeight
  })
  const boundariesByOwner = new Map<number, DepthBoundarySegment[]>()
  for (const segment of depthBoundaries) {
    boundariesByOwner.set(segment.ownerIndex, [
      ...(boundariesByOwner.get(segment.ownerIndex) ?? []),
      segment
    ])
  }
  const worldLoops = loops.map(loop => loop.points.map((point, pointIndex) => (
    snapToDepthBoundary(
      toWorld(point),
      boundariesByOwner.get(loop.owners[pointIndex]!) ?? [],
      cellDiagonal * OCCLUSION_BOUNDARY_SNAP_RATIO
    )
  )))
  let tolerance = cellDiagonal * OCCLUSION_BOUNDARY_SIMPLIFY_RATIO
  const simplifyLoops = () => worldLoops.map(loop => {
    const candidate = simplifyClosedPath(loop, tolerance)
    // A narrow but valid owner island must not disappear merely because the
    // simplifier collapsed it below a polygon. Keep its unsimplified shared
    // boundary; segment fuses below still bound the whole graph.
    return candidate.length >= 3 ? candidate : loop
  })
  let simplified = simplifyLoops()
  while (simplified.reduce((total, loop) => total + loop.length, 0) > maxSegments) {
    tolerance *= 1.45
    simplified = simplifyLoops()
    if (tolerance > Math.max(cellWidth * grid.columns, cellHeight * grid.rows)) break
  }
  const maxBoundaryDisplacement = worldLoops.reduce((maxLoopDistance, loop, loopIndex) => {
    const simplifiedLoop = simplified[loopIndex]
    if (simplifiedLoop == null) return Number.POSITIVE_INFINITY
    return Math.max(maxLoopDistance, ...loop.map(point => distanceToPolygonBoundary(point, simplifiedLoop)))
  }, 0)
  return {
    cellDiagonal,
    maxBoundaryDisplacement,
    polygons: simplified,
    sourceArea: Math.abs(worldLoops.reduce(
      (total, loop) => total + signedPolygonArea(loop),
      0
    ))
  }
}

const pointInPolygon = (point: Point2, polygon: readonly Point2[]) => {
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]!
    const end = polygon[(index + 1) % polygon.length]!
    if (point.x < Math.min(start.x, end.x) - AREA_EPSILON
      || point.x > Math.max(start.x, end.x) + AREA_EPSILON
      || point.y < Math.min(start.y, end.y) - AREA_EPSILON
      || point.y > Math.max(start.y, end.y) + AREA_EPSILON) continue
    if (pointLineDistance(point, start, end) <= AREA_EPSILON) return true
  }
  let inside = false
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index]!
    const previous = polygon[previousIndex]!
    if ((current.y > point.y) !== (previous.y > point.y)
      && point.x < (previous.x - current.x) * (point.y - current.y) / (previous.y - current.y) + current.x) {
      inside = !inside
    }
  }
  return inside
}

const limitPolygonSegments = (
  polygons: readonly Point2[][],
  maxSegments: number,
  baseTolerance: number
) => {
  let tolerance = baseTolerance
  let limited = polygons.map(points => [...points])
  while (limited.reduce((total, points) => total + points.length, 0) > maxSegments) {
    tolerance = tolerance === 0 ? baseTolerance : tolerance * 1.35
    limited = polygons.map(points => simplifyClosedPath(points, tolerance)).filter(points => points.length >= 3)
    if (tolerance > baseTolerance * 20) break
  }
  return limited
}

const interpolatedDepthAtPoint = (point: Point2, triangle: BodySurfaceTriangle) => {
  const [a, b, c] = triangle.vertices
  const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
  if (Math.abs(denominator) < Number.EPSILON) return null
  const weightA = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator
  const weightB = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator
  const weightC = 1 - weightA - weightB
  if (weightA < -AREA_EPSILON || weightB < -AREA_EPSILON || weightC < -AREA_EPSILON) return null
  return weightA * a.depth + weightB * b.depth + weightC * c.depth
}

export const resolveFrontmostPartAtPoint = (
  graph: AvatarFragmentRenderGraph,
  x: number,
  y: number
): AvatarFragmentHitResult | null => {
  const point = { x, y }
  let frontmost: AvatarFragmentHitResult | null = null
  for (const node of graph.nodes) {
    if (!pointInPolygon(point, node.outlinePolygon)) continue
    let depth: number | null = null
    for (const triangle of node.surfaceTriangles) {
      if (x < triangle.bounds.minX || x > triangle.bounds.maxX || y < triangle.bounds.minY || y > triangle.bounds.maxY) continue
      const localDepth = interpolatedDepthAtPoint(point, triangle)
      if (localDepth != null && (depth == null || localDepth > depth)) depth = localDepth
    }
    // The visible compositor mesh deliberately stops just before the horizon.
    // The production outline is the authoritative silhouette, so a point in
    // that narrow rim still has an owner even when no front triangle contains
    // its exact centre.
    if (depth == null) depth = node.minDepth
    if (frontmost == null || depth > frontmost.depth + DEPTH_EPSILON
      || (Math.abs(depth - frontmost.depth) <= DEPTH_EPSILON && node.index > frontmost.index)) {
      frontmost = { depth, index: node.index, partId: node.partId }
    }
  }
  return frontmost
}

const geometryFingerprint = (geometry: BodyGeometry) => {
  let hash = 2166136261
  for (const triangle of geometry.surfaceTriangles) {
    for (const vertex of triangle.vertices) {
      for (const value of [vertex.x, vertex.y, vertex.depth]) {
        hash ^= Math.round(value * 1_000)
        hash = Math.imul(hash, 16777619)
      }
    }
  }
  return (hash >>> 0).toString(36)
}

const FRAGMENT_GRAPH_CACHE_LIMIT = 48
const fragmentGraphCache = new Map<string, AvatarFragmentRenderGraph>()

export const buildAvatarFragmentRenderGraph = (
  parts: readonly AvatarProjectedPartSurface[],
  options: AvatarFragmentRenderGraphOptions = {}
): AvatarFragmentRenderGraph => {
  const requestedQuality = options.quality ?? 'full'
  // Two surfaces share one structural ownership partition. Reusing that exact
  // graph between interactive and settled paint avoids a second expensive
  // build and guarantees that dragging cannot change owner topology.
  const quality = parts.length === 2 ? 'full' : requestedQuality
  const cacheKey = parts.map(part => [
    quality,
    part.id,
    part.index,
    part.projectedX.toFixed(4),
    part.projectedY.toFixed(4),
    part.anchorDepth.toFixed(4),
    geometryFingerprint(part.geometry)
  ].join(':')).join('|')
  const cachedGraph = fragmentGraphCache.get(cacheKey)
  if (cachedGraph != null) {
    fragmentGraphCache.delete(cacheKey)
    fragmentGraphCache.set(cacheKey, cachedGraph)
    return cachedGraph
  }
  const surfaces = parts.map(part => {
    const triangles = part.geometry.surfaceTriangles.map(triangle => placeTriangle(triangle, part))
    const depths = triangles.flatMap(triangle => [triangle.minDepth, triangle.maxDepth])
    const weightedDepth = triangles.reduce((total, triangle) => (
      total + triangle.meanDepth * polygonArea(triangle.vertices)
    ), 0)
    const totalArea = triangles.reduce((total, triangle) => total + polygonArea(triangle.vertices), 0)
    return {
      bounds: triangles.length === 0
        ? { maxX: 0, maxY: 0, minX: 0, minY: 0 }
        : partBounds(triangles),
      depth: totalArea === 0 ? part.anchorDepth : weightedDepth / totalArea,
      maxDepth: depths.length === 0 ? part.anchorDepth : Math.max(...depths),
      minDepth: depths.length === 0 ? part.anchorDepth : Math.min(...depths),
      outlinePolygon: part.geometry.outlinePoints.map(point => ({
        depth: point.depth + part.anchorDepth,
        x: point.x + part.projectedX,
        y: point.y + part.projectedY
      })),
      part,
      triangles
    }
  })
  // SVG still needs a deterministic painter's order, but that order is only a
  // stable traversal order. Local surface depth remains the source of truth.
  // For every overlap pixel we mask only a later-painted surface when the true
  // owner has already been painted. The opposite side is left intact and will
  // naturally cover earlier paint. This assigns every shared boundary to one
  // subtractive mask instead of eroding both neighbours independently.
  const surfaceDrawOrder = surfaces.map((_, index) => index).sort((leftIndex, rightIndex) => {
    const left = surfaces[leftIndex]!
    const right = surfaces[rightIndex]!
    return left.depth - right.depth
      || left.part.index - right.part.index
      || left.part.id.localeCompare(right.part.id)
  })
  const surfaceDrawRanks = new Int16Array(surfaces.length)
  surfaceDrawOrder.forEach((surfaceIndex, rank) => {
    surfaceDrawRanks[surfaceIndex] = rank
  })
  const shouldMaskSurface = (surfaceIndex: number, frontSurfaceIndex: number) => (
    frontSurfaceIndex >= 0
    && frontSurfaceIndex !== surfaceIndex
    && surfaceDrawRanks[frontSurfaceIndex]! < surfaceDrawRanks[surfaceIndex]!
  )
  const allTriangles = surfaces.flatMap(surface => surface.triangles)
  const globalBounds = allTriangles.length === 0
    ? { maxX: 1, maxY: 1, minX: -1, minY: -1 }
    : partBounds(allTriangles)
  const gridTemplate = createOcclusionGrid(
    globalBounds,
    surfaces.length === 2
      ? OCCLUSION_SHARED_PAIR_GRID_MAX_DIMENSION
      : quality === 'interactive'
      ? OCCLUSION_GRID_INTERACTIVE_MAX_DIMENSION
      : surfaces.length <= 5 ? OCCLUSION_GRID_SIMPLE_MAX_DIMENSION : OCCLUSION_GRID_MAX_DIMENSION
  )
  const occlusionGrids = new Map(surfaces.map(surface => [surface.part.id, cloneOcclusionGrid(gridTemplate)]))
  const exactOcclusionPolygons = new Map(surfaces.map(surface => [surface.part.id, [] as Point2[][]]))
  const depthBoundaries = new Map(surfaces.map(surface => [surface.part.id, [] as DepthBoundarySegment[]]))
  const intersectingPartIds = new Set<string>()
  const gridCellArea = (globalBounds.maxX - globalBounds.minX) / gridTemplate.columns
    * (globalBounds.maxY - globalBounds.minY) / gridTemplate.rows
  let rasterizationAbsoluteErrorArea = 0
  let rasterizationExactArea = 0
  let rawOcclusionPatchCount = 0
  let trianglePairTests = 0

  const surfaceDepthGrids = surfaces.map(surface => {
    const depths = new Float64Array(gridTemplate.cells.length)
    depths.fill(Number.NEGATIVE_INFINITY)
    for (const triangle of surface.triangles) rasterizeSurfaceDepth(gridTemplate, triangle, depths)
    const cellWidth = (gridTemplate.bounds.maxX - gridTemplate.bounds.minX) / gridTemplate.columns
    const cellHeight = (gridTemplate.bounds.maxY - gridTemplate.bounds.minY) / gridTemplate.rows
    for (let cellIndex = 0; cellIndex < depths.length; cellIndex += 1) {
      const column = cellIndex % gridTemplate.columns
      const row = Math.floor(cellIndex / gridTemplate.columns)
      const sample = {
        x: gridTemplate.bounds.minX + (column + .5) * cellWidth,
        y: gridTemplate.bounds.minY + (row + .5) * cellHeight
      }
      if (!pointInPolygon(sample, surface.outlinePolygon)) {
        depths[cellIndex] = Number.NEGATIVE_INFINITY
      } else if (surfaces.length === 2 && !Number.isFinite(depths[cellIndex]!)) {
        // Surface triangles stop just inside the silhouette to avoid unstable
        // horizon normals, while the painted primitive includes the complete
        // outline. In a two-surface compositor that missing rim otherwise has
        // no owner and lets the hidden primitive's own AA edge leak through.
        // Give the rim the surface's horizon/min depth; this is a geometric
        // fallback for any primitive, not a sphere-specific depth formula.
        depths[cellIndex] = surface.minDepth
      }
    }
    return depths
  })
  for (let leftIndex = 0; leftIndex < surfaces.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < surfaces.length; rightIndex += 1) {
      const left = surfaces[leftIndex]!
      const right = surfaces[rightIndex]!
      if (!boundsOverlap(left.bounds, right.bounds) || !depthRangesOverlap(left, right)) continue
      const sharedBoundaryForLeft = buildSharedDepthEqualitySegments(
        gridTemplate,
        surfaceDepthGrids[leftIndex]!,
        surfaceDepthGrids[rightIndex]!,
        rightIndex
      )
      depthBoundaries.get(left.part.id)!.push(...sharedBoundaryForLeft)
      depthBoundaries.get(right.part.id)!.push(...sharedBoundaryForLeft.map(segment => ({
        ...segment,
        ownerIndex: leftIndex
      })))
    }
  }
  const cellCoverCounts = new Uint16Array(gridTemplate.cells.length)
  const cellCoverSurfaceIndexes: Array<readonly number[] | undefined> = new Array(gridTemplate.cells.length)
  const cellFrontSurfaceIndexes = new Int16Array(gridTemplate.cells.length)
  cellFrontSurfaceIndexes.fill(-1)
  const frontOwnedCellCounts = new Uint32Array(surfaces.length)
  const frontOwnedMaxColumns = new Int16Array(surfaces.length).fill(-1)
  const frontOwnedMaxRows = new Int16Array(surfaces.length).fill(-1)
  const frontOwnedMinColumns = new Int16Array(surfaces.length).fill(gridTemplate.columns)
  const frontOwnedMinRows = new Int16Array(surfaces.length).fill(gridTemplate.rows)
  const sharedCellCounts = new Uint16Array(surfaces.length * surfaces.length)
  const projectedCellCounts = new Uint32Array(surfaces.length)
  for (let cellIndex = 0; cellIndex < gridTemplate.cells.length; cellIndex += 1) {
    const coveringSurfaceIndexes: number[] = []
    let frontSurfaceIndex = -1
    for (let surfaceIndex = 0; surfaceIndex < surfaces.length; surfaceIndex += 1) {
      const depth = surfaceDepthGrids[surfaceIndex]![cellIndex]!
      if (!Number.isFinite(depth)) continue
      projectedCellCounts[surfaceIndex] += 1
      coveringSurfaceIndexes.push(surfaceIndex)
      if (frontSurfaceIndex < 0) {
        frontSurfaceIndex = surfaceIndex
        continue
      }
      const frontDepth = surfaceDepthGrids[frontSurfaceIndex]![cellIndex]!
      if (depth > frontDepth + DEPTH_EPSILON
        || (Math.abs(depth - frontDepth) <= DEPTH_EPSILON
          && surfaces[surfaceIndex]!.part.index > surfaces[frontSurfaceIndex]!.part.index)) {
        frontSurfaceIndex = surfaceIndex
      }
    }
    cellCoverCounts[cellIndex] = coveringSurfaceIndexes.length
    if (coveringSurfaceIndexes.length >= 2) cellCoverSurfaceIndexes[cellIndex] = coveringSurfaceIndexes
    cellFrontSurfaceIndexes[cellIndex] = frontSurfaceIndex
    if (frontSurfaceIndex >= 0) {
      const column = cellIndex % gridTemplate.columns
      const row = Math.floor(cellIndex / gridTemplate.columns)
      frontOwnedCellCounts[frontSurfaceIndex] += 1
      frontOwnedMinColumns[frontSurfaceIndex] = Math.min(frontOwnedMinColumns[frontSurfaceIndex]!, column)
      frontOwnedMaxColumns[frontSurfaceIndex] = Math.max(frontOwnedMaxColumns[frontSurfaceIndex]!, column)
      frontOwnedMinRows[frontSurfaceIndex] = Math.min(frontOwnedMinRows[frontSurfaceIndex]!, row)
      frontOwnedMaxRows[frontSurfaceIndex] = Math.max(frontOwnedMaxRows[frontSurfaceIndex]!, row)
    }
    if (coveringSurfaceIndexes.length < 2) continue
    for (const surfaceIndex of coveringSurfaceIndexes) {
      intersectingPartIds.add(surfaces[surfaceIndex]!.part.id)
    }
    for (let left = 0; left < coveringSurfaceIndexes.length; left += 1) {
      const leftIndex = coveringSurfaceIndexes[left]!
      for (let right = left + 1; right < coveringSurfaceIndexes.length; right += 1) {
        const rightIndex = coveringSurfaceIndexes[right]!
        sharedCellCounts[leftIndex * surfaces.length + rightIndex] += 1
      }
      if (shouldMaskSurface(leftIndex, frontSurfaceIndex)) {
        const grid = occlusionGrids.get(surfaces[leftIndex]!.part.id)!
        grid.cells[cellIndex] = 1
        grid.owners[cellIndex] = frontSurfaceIndex
      }
    }
  }

  const refinedPairCellCounts = new Uint16Array(surfaces.length * surfaces.length)
  const refinedPairAreas = new Float64Array(surfaces.length * surfaces.length)
  const coarseCellWidth = (gridTemplate.bounds.maxX - gridTemplate.bounds.minX) / gridTemplate.columns
  const coarseCellHeight = (gridTemplate.bounds.maxY - gridTemplate.bounds.minY) / gridTemplate.rows
  const depthAtPoint = (surfaceIndex: number, point: Point2) => {
    let depth = Number.NEGATIVE_INFINITY
    for (const triangle of surfaces[surfaceIndex]!.triangles) {
      if (point.x < triangle.bounds.minX || point.x > triangle.bounds.maxX
        || point.y < triangle.bounds.minY || point.y > triangle.bounds.maxY
        || !pointInPolygon(point, triangle.vertices)) continue
      depth = Math.max(depth, interpolateTriangleDepth(point, triangle.vertices))
    }
    return depth
  }

  for (let cellIndex = 0; cellIndex < gridTemplate.cells.length; cellIndex += 1) {
    const covering = cellCoverSurfaceIndexes[cellIndex]
    if (covering == null || covering.length < 3) continue
    const narrowSurfaceIndex = covering.find(surfaceIndex => covering.every(otherSurfaceIndex => {
      if (surfaceIndex === otherSurfaceIndex) return true
      const low = Math.min(surfaceIndex, otherSurfaceIndex)
      const high = Math.max(surfaceIndex, otherSurfaceIndex)
      return sharedCellCounts[low * surfaces.length + high] <= 1
    }))
    if (narrowSurfaceIndex == null) continue

    const column = cellIndex % gridTemplate.columns
    const row = Math.floor(cellIndex / gridTemplate.columns)
    const localBounds = {
      maxX: gridTemplate.bounds.minX + (column + 1) * coarseCellWidth,
      maxY: gridTemplate.bounds.minY + (row + 1) * coarseCellHeight,
      minX: gridTemplate.bounds.minX + column * coarseCellWidth,
      minY: gridTemplate.bounds.minY + row * coarseCellHeight
    }
    const localGrids = new Map(covering.map(surfaceIndex => [surfaceIndex, {
      bounds: localBounds,
      cells: new Uint8Array(OCCLUSION_LOCAL_REFINEMENT_DIMENSION ** 2),
      columns: OCCLUSION_LOCAL_REFINEMENT_DIMENSION,
      owners: new Int16Array(OCCLUSION_LOCAL_REFINEMENT_DIMENSION ** 2).fill(-1),
      rows: OCCLUSION_LOCAL_REFINEMENT_DIMENSION
    } satisfies OcclusionGrid]))
    const localCellWidth = coarseCellWidth / OCCLUSION_LOCAL_REFINEMENT_DIMENSION
    const localCellHeight = coarseCellHeight / OCCLUSION_LOCAL_REFINEMENT_DIMENSION
    const localCellArea = localCellWidth * localCellHeight
    for (let localRow = 0; localRow < OCCLUSION_LOCAL_REFINEMENT_DIMENSION; localRow += 1) {
      for (let localColumn = 0; localColumn < OCCLUSION_LOCAL_REFINEMENT_DIMENSION; localColumn += 1) {
        const point = {
          x: localBounds.minX + (localColumn + .5) * localCellWidth,
          y: localBounds.minY + (localRow + .5) * localCellHeight
        }
        const localSurfaces = covering.map(surfaceIndex => ({
          depth: depthAtPoint(surfaceIndex, point),
          surfaceIndex
        })).filter(candidate => Number.isFinite(candidate.depth))
        if (localSurfaces.length < 2) continue
        for (let left = 0; left < localSurfaces.length; left += 1) {
          for (let right = left + 1; right < localSurfaces.length; right += 1) {
            const low = Math.min(localSurfaces[left]!.surfaceIndex, localSurfaces[right]!.surfaceIndex)
            const high = Math.max(localSurfaces[left]!.surfaceIndex, localSurfaces[right]!.surfaceIndex)
            refinedPairAreas[low * surfaces.length + high] += localCellArea
          }
        }
        const front = localSurfaces.reduce((best, candidate) => (
          candidate.depth > best.depth + DEPTH_EPSILON
          || (Math.abs(candidate.depth - best.depth) <= DEPTH_EPSILON
            && surfaces[candidate.surfaceIndex]!.part.index > surfaces[best.surfaceIndex]!.part.index)
            ? candidate
            : best
        ))
        const localCellIndex = localRow * OCCLUSION_LOCAL_REFINEMENT_DIMENSION + localColumn
        for (const candidate of localSurfaces) {
          if (shouldMaskSurface(candidate.surfaceIndex, front.surfaceIndex)) {
            const grid = localGrids.get(candidate.surfaceIndex)!
            grid.cells[localCellIndex] = 1
            grid.owners[localCellIndex] = front.surfaceIndex
          }
        }
      }
    }

    for (const surfaceIndex of covering) {
      occlusionGrids.get(surfaces[surfaceIndex]!.part.id)!.cells[cellIndex] = 0
      const traced = traceOcclusionGrid(localGrids.get(surfaceIndex)!, 64, [])
      exactOcclusionPolygons.get(surfaces[surfaceIndex]!.part.id)!.push(...traced.polygons)
      rawOcclusionPatchCount += traced.polygons.length
    }
    for (let left = 0; left < covering.length; left += 1) {
      for (let right = left + 1; right < covering.length; right += 1) {
        const low = Math.min(covering[left]!, covering[right]!)
        const high = Math.max(covering[left]!, covering[right]!)
        refinedPairCellCounts[low * surfaces.length + high] += 1
      }
    }
  }

  for (let leftIndex = 0; leftIndex < surfaces.length; leftIndex += 1) {
    const left = surfaces[leftIndex]!
    for (let rightIndex = leftIndex + 1; rightIndex < surfaces.length; rightIndex += 1) {
      const right = surfaces[rightIndex]!
      if (!boundsOverlap(left.bounds, right.bounds) || !depthRangesOverlap(left, right)) continue
      const sharedCellCount = sharedCellCounts[leftIndex * surfaces.length + rightIndex]!
      if (quality === 'interactive' && sharedCellCount > 1 && surfaces.length !== 2) continue
      const useDenseSharedPairGrid = surfaces.length === 2
        && sharedCellCount > 0
        && left.triangles.length * right.triangles.length > 4_096
      if (useDenseSharedPairGrid) {
        // The depth grid has already evaluated the same local triangle depth
        // function at every compositor cell. For a dense two-surface pair it
        // is both cheaper and more stable to trace that single owner field
        // than to intersect every triangle with every triangle and rebuild a
        // second approximation of the same boundary.
        intersectingPartIds.add(left.part.id)
        intersectingPartIds.add(right.part.id)
        rawOcclusionPatchCount += 1
        rasterizationExactArea += sharedCellCount * gridCellArea
        continue
      }
      let pairIntersects = false
      let exactOverlapArea = 0
      let exactFallbackArea = 0
      const leftFallbacks: Point2[][] = []
      const rightFallbacks: Point2[][] = []
      for (const leftTriangle of left.triangles) {
        for (const rightTriangle of right.triangles) {
          if (!boundsOverlap(leftTriangle.bounds, rightTriangle.bounds)) continue
          trianglePairTests += 1
          const split = splitTriangleOverlapByDepth(leftTriangle, rightTriangle)
          if (split == null) continue
          pairIntersects = true
          exactOverlapArea += polygonArea(split.overlap)
          if (split.tied) {
            if (left.part.index <= right.part.index) {
              leftFallbacks.push(split.aFront)
            } else {
              rightFallbacks.push(split.aFront)
            }
          } else {
            if (polygonArea(split.aFront) > AREA_EPSILON) {
              rightFallbacks.push(split.aFront)
            }
            if (polygonArea(split.bFront) > AREA_EPSILON) {
              leftFallbacks.push(split.bFront)
            }
          }
          rawOcclusionPatchCount += Number(polygonArea(split.aFront) > AREA_EPSILON)
            + Number(polygonArea(split.bFront) > AREA_EPSILON)
        }
      }
      if (pairIntersects) {
        appendUnionBoundarySegments(depthBoundaries.get(left.part.id)!, leftFallbacks, rightIndex)
        appendUnionBoundarySegments(depthBoundaries.get(right.part.id)!, rightFallbacks, leftIndex)
        const pairMetricIndex = leftIndex * surfaces.length + rightIndex
        const gridApproximationArea = Math.max(
          0,
          sharedCellCount - refinedPairCellCounts[pairMetricIndex]!
        ) * gridCellArea + refinedPairAreas[pairMetricIndex]!
        const singleSharedCellIndex = sharedCellCount === 1
          ? surfaceDepthGrids[leftIndex]!.findIndex((depth, cellIndex) => (
            Number.isFinite(depth) && Number.isFinite(surfaceDepthGrids[rightIndex]![cellIndex]!)
          ))
          : -1
        const useExactNarrowFallback = surfaces.length === 2 || sharedCellCount === 0 || (
          singleSharedCellIndex >= 0 && cellCoverCounts[singleSharedCellIndex] === 2
        )
        if (useExactNarrowFallback) {
          if (singleSharedCellIndex >= 0) {
            const frontSurfaceIndex = cellFrontSurfaceIndexes[singleSharedCellIndex]
            if (frontSurfaceIndex !== leftIndex) {
              occlusionGrids.get(left.part.id)!.cells[singleSharedCellIndex] = 0
            }
            if (frontSurfaceIndex !== rightIndex) {
              occlusionGrids.get(right.part.id)!.cells[singleSharedCellIndex] = 0
            }
          }
          const maskedLeftFallbacks = shouldMaskSurface(leftIndex, rightIndex) ? leftFallbacks : []
          const maskedRightFallbacks = shouldMaskSurface(rightIndex, leftIndex) ? rightFallbacks : []
          exactOcclusionPolygons.get(left.part.id)!.push(...maskedLeftFallbacks)
          exactOcclusionPolygons.get(right.part.id)!.push(...maskedRightFallbacks)
          exactFallbackArea = [...leftFallbacks, ...rightFallbacks]
            .reduce((total, points) => total + polygonArea(points), 0)
        }
        rasterizationExactArea += exactOverlapArea
        rasterizationAbsoluteErrorArea += Math.abs(
          (useExactNarrowFallback ? 0 : gridApproximationArea) + exactFallbackArea - exactOverlapArea
        )
        intersectingPartIds.add(left.part.id)
        intersectingPartIds.add(right.part.id)
      }
    }
  }

  const maxSegmentsPerGraph = quality === 'interactive' ? 1_500 : OCCLUSION_MAX_SEGMENTS_PER_GRAPH
  const maxSegmentsPerPart = Math.min(
    OCCLUSION_MAX_SEGMENTS_PER_PART,
    quality === 'interactive' ? 120 : OCCLUSION_MAX_SEGMENTS_PER_PART,
    Math.max(12, Math.floor(maxSegmentsPerGraph / Math.max(1, surfaces.length)))
  )
  const sharedPairDrawOrder = surfaces.length === 2 && intersectingPartIds.size === 2
    ? [...surfaces].sort((left, right) => (
        left.depth - right.depth
        || left.part.index - right.part.index
        || left.part.id.localeCompare(right.part.id)
      ))
    : null
  const sharedPairBasePartId = sharedPairDrawOrder?.[0]?.part.id
  const sharedPairTopPartId = sharedPairDrawOrder?.[1]?.part.id
  const nodes = surfaces.map((surface, surfaceIndex) => {
    const grid = occlusionGrids.get(surface.part.id)!
    const traced = traceOcclusionGrid(grid, maxSegmentsPerPart, depthBoundaries.get(surface.part.id)!)
    const exactPolygons = exactOcclusionPolygons.get(surface.part.id)!
    // A two-surface overlap only needs one subtractive mask. Paint the stable
    // rear/base surface in full, then remove from the later surface exactly the
    // region owned by the base. Both colours therefore meet on the same traced
    // depth-equality boundary instead of two independently simplified masks.
    const sharedPairContourPoints = sharedPairDrawOrder == null
      ? null
      : surface.part.id === sharedPairTopPartId ? traced.polygons : []
    const minimumComponentArea = traced.cellDiagonal ** 2 * OCCLUSION_MIN_COMPONENT_CELL_AREA_RATIO
    const sourceContourPoints = (sharedPairContourPoints ?? [...traced.polygons, ...exactPolygons])
      .filter(points => sharedPairDrawOrder != null || polygonArea(points) >= minimumComponentArea)
    const contourPoints = limitPolygonSegments(
      sourceContourPoints,
      maxSegmentsPerPart,
      traced.cellDiagonal * OCCLUSION_BOUNDARY_SIMPLIFY_RATIO
    )
    const occlusionPolygons = contourPoints.map(points => ({ points }))
    const occlusionPath = contourPoints.map(polygonPath).join(' ')
    const sourceArea = Math.abs(sourceContourPoints.reduce(
      (total, points) => total + signedPolygonArea(points),
      0
    ))
    const contourArea = Math.abs(contourPoints.reduce((total, points) => total + signedPolygonArea(points), 0))
    const simplificationAreaErrorRatio = sourceArea <= AREA_EPSILON
      ? 0
      : Math.abs(contourArea - sourceArea) / sourceArea
    const occlusionSegmentCount = contourPoints.reduce((total, points) => total + points.length, 0)
    const partShortSide = Math.max(AREA_EPSILON, Math.min(
      surface.bounds.maxX - surface.bounds.minX,
      surface.bounds.maxY - surface.bounds.minY
    ))
    const projectedAreaEstimate = projectedCellCounts[surfaceIndex]! * gridCellArea
    const interactionSourceArea = frontOwnedCellCounts[surfaceIndex]! * gridCellArea
    const interactionVisibleRatio = projectedAreaEstimate <= AREA_EPSILON
      ? 0
      : interactionSourceArea / projectedAreaEstimate
    const interactionIsVisible = interactionSourceArea >= MIN_INTERACTION_VISIBLE_AREA
      && interactionVisibleRatio >= (quality === 'interactive'
        ? MIN_INTERACTION_VISIBLE_AREA_RATIO_INTERACTIVE
        : MIN_INTERACTION_VISIBLE_AREA_RATIO)
    const interactionVisiblePolygons = (() => {
      if (!interactionIsVisible) return []
      const minColumn = frontOwnedMinColumns[surfaceIndex]!
      const maxColumn = frontOwnedMaxColumns[surfaceIndex]!
      const minRow = frontOwnedMinRows[surfaceIndex]!
      const maxRow = frontOwnedMaxRows[surfaceIndex]!
      const columns = maxColumn - minColumn + 1
      const rows = maxRow - minRow + 1
      const interactionGrid: OcclusionGrid = {
        bounds: {
          maxX: gridTemplate.bounds.minX + (maxColumn + 1) * coarseCellWidth,
          maxY: gridTemplate.bounds.minY + (maxRow + 1) * coarseCellHeight,
          minX: gridTemplate.bounds.minX + minColumn * coarseCellWidth,
          minY: gridTemplate.bounds.minY + minRow * coarseCellHeight
        },
        cells: new Uint8Array(columns * rows),
        columns,
        owners: new Int16Array(columns * rows).fill(-1),
        rows
      }
      for (let row = minRow; row <= maxRow; row += 1) {
        for (let column = minColumn; column <= maxColumn; column += 1) {
          const globalCellIndex = row * gridTemplate.columns + column
          if (cellFrontSurfaceIndexes[globalCellIndex] !== surfaceIndex) continue
          const localCellIndex = (row - minRow) * columns + column - minColumn
          interactionGrid.cells[localCellIndex] = 1
          interactionGrid.owners[localCellIndex] = surfaceIndex
        }
      }
      return traceOcclusionGrid(interactionGrid, maxSegmentsPerPart, [])
        .polygons.map(points => ({ points }))
    })()
    const interactionVisiblePath = interactionVisiblePolygons.map(polygon => polygonPath(polygon.points)).join(' ')
    const interactionVisibleArea = interactionIsVisible ? interactionSourceArea : 0
    const sharedPaintPath = (() => {
      if (sharedPairDrawOrder == null || surface.part.id !== sharedPairTopPartId) return undefined
      const visibleGrid = cloneOcclusionGrid(gridTemplate)
      for (let cellIndex = 0; cellIndex < cellFrontSurfaceIndexes.length; cellIndex += 1) {
        if (cellFrontSurfaceIndexes[cellIndex] !== surfaceIndex) continue
        visibleGrid.cells[cellIndex] = 1
        visibleGrid.owners[cellIndex] = surfaceIndex
      }
      const normalizedVisibleGrid = normalizeSharedOwnerGrid(visibleGrid, surfaceIndex)
      const outlineBoundary = surface.outlinePolygon.map((point, index) => ({
        end: surface.outlinePolygon[(index + 1) % surface.outlinePolygon.length]!,
        ownerIndex: surfaceIndex,
        start: point
      }))
      const equalityBoundary = (depthBoundaries.get(surface.part.id) ?? []).map(segment => ({
        ...segment,
        ownerIndex: surfaceIndex
      }))
      const visibleTrace = traceOcclusionGrid(
        normalizedVisibleGrid,
        maxSegmentsPerPart,
        [...outlineBoundary, ...equalityBoundary]
      )
      return visibleTrace.polygons
        .map(points => simplifyClosedPath(points, visibleTrace.cellDiagonal * .12))
        .filter(points => points.length >= 3)
        .map(points => smoothClosedPolygonPoints(points, 3))
        .map(smoothClosedPolygonPath)
        .join(' ')
    })()
    // Paint ownership and interaction overlays deliberately have different
    // thresholds. A small but real front fragment still owns its pixels and
    // target decals even when it is too small to draw a selection overlay.
    const visibleAreaEstimate = interactionSourceArea
    return {
      boundaryCellDiagonal: traced.cellDiagonal,
      boundaryDisplacementRatio: traced.maxBoundaryDisplacement / partShortSide,
      depth: surface.depth,
      drawCavity: true as const,
      drawOutline: true as const,
      index: surface.part.index,
      intersects: intersectingPartIds.has(surface.part.id),
      interactionVisibleArea,
      ...(interactionVisiblePath.length === 0 ? {} : { interactionVisiblePath }),
      interactionVisiblePolygons,
      interactionVisibleRatio,
      maxDepth: surface.maxDepth,
      maxBoundaryDisplacement: traced.maxBoundaryDisplacement,
      minDepth: surface.minDepth,
      ...(occlusionPath.length === 0 ? {} : { occlusionPath }),
      occlusionPatchCount: contourPoints.length,
      occlusionComponentCount: contourPoints.length,
      occlusionPolygons,
      occlusionSegmentCount,
      outlinePolygon: surface.outlinePolygon,
      partId: surface.part.id,
      projectedAreaEstimate,
      simplificationAreaErrorRatio,
      ...(sharedPaintPath == null ? {} : { sharedPaintPath }),
      stableKey: `${surface.depth.toFixed(4)}:${surface.part.index}:${surface.part.id}`,
      surfaceTriangles: surface.triangles,
      visibleAreaEstimate
    }
  }).sort((left, right) => left.depth - right.depth || left.index - right.index || left.partId.localeCompare(right.partId))
  const occlusionPatchCount = nodes.reduce((total, node) => total + node.occlusionPatchCount, 0)
  const occlusionPathCharacterCount = nodes.reduce((total, node) => total + (node.occlusionPath?.length ?? 0), 0)
  const occlusionSegmentCount = nodes.reduce((total, node) => total + node.occlusionSegmentCount, 0)
  const graph = {
    cacheKey,
    compositionMode: intersectingPartIds.size < 2
      ? 'independent-masks' as const
      : 'shared-partition' as const,
    metrics: {
      intersectingPartCount: intersectingPartIds.size,
      rasterizationErrorRatio: rasterizationExactArea <= AREA_EPSILON
        ? 0
        : rasterizationAbsoluteErrorArea / rasterizationExactArea,
      occlusionPatchCount,
      occlusionPathCharacterCount,
      occlusionSegmentCount,
      partCount: parts.length,
      rawOcclusionPatchCount,
      rasterizationMeasured: quality === 'full',
      trianglePairTests
    },
    nodes,
    ...(sharedPairBasePartId == null ? {} : { sharedPairBasePartId })
  }
  fragmentGraphCache.set(cacheKey, graph)
  if (fragmentGraphCache.size > FRAGMENT_GRAPH_CACHE_LIMIT) {
    fragmentGraphCache.delete(fragmentGraphCache.keys().next().value!)
  }
  return graph
}
