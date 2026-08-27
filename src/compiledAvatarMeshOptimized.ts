import type {
  CompiledAvatarMesh,
  CompiledAvatarPose,
  CompiledAvatarPrimitive,
  CompiledAvatarSurfaceMarking
} from './compiledAvatarMesh'
import { compiledAvatarPrimitiveDistance } from './compiledAvatarMesh'
import {
  getAvatarBodyCompilerShapeSpec,
  mapAvatarPrimitiveLocalPointToAuthoredSurface
} from './avatarGeometry'

export interface OptimizedCompiledAvatarProjectionMetrics {
  binCullMs: number
  candidateTestsAfter: number
  candidateTestsBefore: number
  coloredPixelCount: number
  contourMs: number
  contourCurveSegmentCount: number
  contourLineSegmentCount: number
  contourMaxCurveError: number
  contourSharedCurveReuseCount: number
  contourSegmentCount: number
  depthOwnerMs: number
  dirtyTileCount: number
  fullContourFallback: boolean
  pathCharacterCount: number
  pathCount: number
  pathSerializationMs: number
  projectMs: number
  rasterizedTriangleCount: number
  nullOwnerPixelCount: number
  transformMs: number
}

export interface OptimizedCompiledAvatarProjection {
  getSelectionOverlay(primitiveId: string): OptimizedCompiledAvatarSelectionOverlay
  readonly height: number
  readonly materialIds: readonly string[]
  readonly materialPaths: Readonly<Record<string, string>>
  readonly metrics: OptimizedCompiledAvatarProjectionMetrics
  readonly ownerPaths: Readonly<Record<string, string>>
  readonly ownerPrimitiveIndexes: Int16Array
  readonly pixelMaterialIndexes: Int16Array
  readonly primitiveIds: readonly string[]
  resolveFrontmostPrimitiveId(x: number, y: number): string | null
  readonly width: number
}

export interface OptimizedCompiledAvatarSelectionOverlay {
  readonly contourPath: string
  readonly gridPath: string
  readonly gridSegmentCount: number
  readonly rawVisiblePixelCount: number
  readonly primitiveId: string
  readonly visibleRatio: number
  readonly visiblePixelCount: number
}

export interface OptimizedCompiledAvatarProjector {
  readonly materialIds: readonly string[]
  project(pose: CompiledAvatarPose): OptimizedCompiledAvatarProjection
}

export interface OptimizedCompiledAvatarProjectorOptions {
  readonly centerX?: number
  readonly centerY?: number
  readonly height: number
  readonly includeOwnerPaths?: boolean
  readonly markings?: readonly CompiledAvatarSurfaceMarking[]
  /**
   * The isolated compiler lab historically used the conventional mathematical
   * pitch sign. Production Avatar scenes use the pre-existing avatarGeometry
   * convention, where positive pitch moves positive-depth points downward in
   * screen coordinates. Keep the choice internal to the projector so adopting
   * the compiler does not reinterpret saved Avatar poses.
   */
  readonly poseConvention?: 'avatar' | 'compiled-lab'
  readonly referenceSize?: number
  readonly tileSize?: number
  readonly width: number
}

interface PreparedMarking {
  readonly area: number
  readonly authoredSurfaceMapping: 0 | 1
  readonly boundaryX: Float32Array | null
  readonly boundaryY: Float32Array | null
  readonly centerX: number
  readonly centerY: number
  readonly coordinateSpace: 0 | 1
  readonly cosRotation: number
  readonly coversTargetSurface: 0 | 1
  readonly frontSpace: 0 | 1
  readonly halfConeCutAngle: number
  readonly halfConeRadiusExponent: number
  readonly halfConeSurface: 0 | 1
  readonly materialIndex: number
  readonly maxX: number
  readonly maxY: number
  readonly minX: number
  readonly minY: number
  readonly radiusX: number
  readonly radiusXToZ: number
  readonly radiusY: number
  readonly radiusZToX: number
  readonly segmentBinIndexes: Int16Array | null
  readonly segmentBinMinY: number
  readonly segmentBinScale: number
  readonly segmentBinStarts: Int32Array | null
  readonly side: 0 | 1 | 2 | 3
  readonly sinRotation: number
  readonly surfaceAnchors: readonly PreparedSurfaceAnchor[] | null
  readonly surfaceTriangleIndexes: Int32Array | null
  readonly targetPrimitiveIndex: number
  readonly visibleNormalZ: number
}

interface PreparedSurfaceAnchor {
  readonly featureCorner: boolean
  readonly normalX: number
  readonly normalY: number
  readonly normalZ: number
  readonly x: number
  readonly y: number
  readonly z: number
}

const compiledSurfaceAnchorCache = new WeakMap<
CompiledAvatarMesh,
Map<string, readonly PreparedSurfaceAnchor[] | null>
>()
const compiledSurfaceTrianglesCache = new WeakMap<
CompiledAvatarMesh,
Map<string, readonly number[]>
>()

const MARKING_SEGMENT_BIN_COUNT = 64
const MARKING_BOUNDARY_DISTANCE_BAND = .08
const SURFACE_ANCHOR_BIN_COUNT = 24

const triangulateSurfaceBoundary = (
  boundaryX: Float32Array | null,
  boundaryY: Float32Array | null,
  pointCount: number
) => {
  if (boundaryX == null || boundaryY == null || pointCount < 3) return null
  const segmentOrientation = (
    firstX: number,
    firstY: number,
    secondX: number,
    secondY: number,
    pointX: number,
    pointY: number
  ) => (secondX - firstX) * (pointY - firstY) - (secondY - firstY) * (pointX - firstX)
  const segmentsIntersect = (first: number, second: number) => {
    const firstNext = (first + 1) % pointCount
    const secondNext = (second + 1) % pointCount
    if (first === second || firstNext === second || secondNext === first) return false
    const firstX = boundaryX[first]!
    const firstY = boundaryY[first]!
    const firstNextX = boundaryX[firstNext]!
    const firstNextY = boundaryY[firstNext]!
    const secondX = boundaryX[second]!
    const secondY = boundaryY[second]!
    const secondNextX = boundaryX[secondNext]!
    const secondNextY = boundaryY[secondNext]!
    const firstSide = segmentOrientation(firstX, firstY, firstNextX, firstNextY, secondX, secondY)
    const firstNextSide = segmentOrientation(
      firstX,
      firstY,
      firstNextX,
      firstNextY,
      secondNextX,
      secondNextY
    )
    const secondSide = segmentOrientation(secondX, secondY, secondNextX, secondNextY, firstX, firstY)
    const secondNextSide = segmentOrientation(
      secondX,
      secondY,
      secondNextX,
      secondNextY,
      firstNextX,
      firstNextY
    )
    const epsilon = 1e-10
    if (firstSide * firstNextSide < -epsilon && secondSide * secondNextSide < -epsilon) return true
    const onSegment = (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      pointX: number,
      pointY: number
    ) => pointX >= Math.min(startX, endX) - epsilon
      && pointX <= Math.max(startX, endX) + epsilon
      && pointY >= Math.min(startY, endY) - epsilon
      && pointY <= Math.max(startY, endY) + epsilon
    return (Math.abs(firstSide) <= epsilon
        && onSegment(firstX, firstY, firstNextX, firstNextY, secondX, secondY))
      || (Math.abs(firstNextSide) <= epsilon
        && onSegment(firstX, firstY, firstNextX, firstNextY, secondNextX, secondNextY))
      || (Math.abs(secondSide) <= epsilon
        && onSegment(secondX, secondY, secondNextX, secondNextY, firstX, firstY))
      || (Math.abs(secondNextSide) <= epsilon
        && onSegment(secondX, secondY, secondNextX, secondNextY, firstNextX, firstNextY))
  }
  // Ear clipping only describes simple polygons. A self-intersecting authored
  // loop uses even-odd material membership, so attempting to triangulate it
  // would make its direct SVG fill disagree with the owner/material raster at
  // the horizon. Keep the continuous raster-derived contour for that case.
  for (let first = 0; first < pointCount; first += 1) {
    for (let second = first + 1; second < pointCount; second += 1) {
      if (segmentsIntersect(first, second)) return null
    }
  }
  let signedArea = 0
  for (let index = 0; index < pointCount; index += 1) {
    const next = (index + 1) % pointCount
    signedArea += boundaryX[index]! * boundaryY[next]!
      - boundaryX[next]! * boundaryY[index]!
  }
  if (Math.abs(signedArea) < 1e-10) return null
  const orientation = signedArea > 0 ? 1 : -1
  const remaining = Array.from({ length: pointCount }, (_, index) => index)
  const triangles: number[] = []
  const cross = (first: number, second: number, third: number) => (
    (boundaryX[second]! - boundaryX[first]!) * (boundaryY[third]! - boundaryY[first]!)
      - (boundaryY[second]! - boundaryY[first]!) * (boundaryX[third]! - boundaryX[first]!)
  )
  const containsPoint = (first: number, second: number, third: number, point: number) => {
    const firstCross = cross(first, second, point) * orientation
    const secondCross = cross(second, third, point) * orientation
    const thirdCross = cross(third, first, point) * orientation
    return firstCross > 1e-8 && secondCross > 1e-8 && thirdCross > 1e-8
  }
  let guard = pointCount * pointCount
  while (remaining.length > 3 && guard > 0) {
    let clipped = false
    for (let offset = 0; offset < remaining.length; offset += 1) {
      const previous = remaining[(offset + remaining.length - 1) % remaining.length]!
      const current = remaining[offset]!
      const next = remaining[(offset + 1) % remaining.length]!
      if (cross(previous, current, next) * orientation <= 1e-8) continue
      let occupied = false
      for (const candidate of remaining) {
        if (candidate === previous || candidate === current || candidate === next) continue
        if (!containsPoint(previous, current, next, candidate)) continue
        occupied = true
        break
      }
      if (occupied) continue
      triangles.push(previous, current, next)
      remaining.splice(offset, 1)
      clipped = true
      break
    }
    if (!clipped) return null
    guard -= 1
  }
  if (remaining.length !== 3) return null
  triangles.push(remaining[0]!, remaining[1]!, remaining[2]!)
  return Int32Array.from(triangles)
}

const createMarkingSegmentBins = (
  boundaryX: Float32Array | null,
  boundaryY: Float32Array | null,
  minY: number,
  maxY: number
) => {
  if (boundaryX == null || boundaryY == null || boundaryX.length === 0) return null
  const binMinY = minY - MARKING_BOUNDARY_DISTANCE_BAND
  const binMaxY = maxY + MARKING_BOUNDARY_DISTANCE_BAND
  const binScale = MARKING_SEGMENT_BIN_COUNT / Math.max(binMaxY - binMinY, 1e-6)
  const bins = Array.from({ length: MARKING_SEGMENT_BIN_COUNT }, () => [] as number[])
  for (let segmentIndex = 0; segmentIndex < boundaryX.length; segmentIndex += 1) {
    const previousIndex = (segmentIndex + boundaryX.length - 1) % boundaryX.length
    const segmentMinY = Math.min(boundaryY[segmentIndex]!, boundaryY[previousIndex]!)
      - MARKING_BOUNDARY_DISTANCE_BAND
    const segmentMaxY = Math.max(boundaryY[segmentIndex]!, boundaryY[previousIndex]!)
      + MARKING_BOUNDARY_DISTANCE_BAND
    const firstBin = Math.max(0, Math.min(
      MARKING_SEGMENT_BIN_COUNT - 1,
      Math.floor((segmentMinY - binMinY) * binScale)
    ))
    const lastBin = Math.max(firstBin, Math.min(
      MARKING_SEGMENT_BIN_COUNT - 1,
      Math.floor((segmentMaxY - binMinY) * binScale)
    ))
    for (let bin = firstBin; bin <= lastBin; bin += 1) bins[bin]!.push(segmentIndex)
  }
  const starts = new Int32Array(MARKING_SEGMENT_BIN_COUNT + 1)
  const indexes: number[] = []
  for (let bin = 0; bin < MARKING_SEGMENT_BIN_COUNT; bin += 1) {
    starts[bin] = indexes.length
    indexes.push(...bins[bin]!)
  }
  starts[MARKING_SEGMENT_BIN_COUNT] = indexes.length
  return {
    indexes: Int16Array.from(indexes),
    minY: binMinY,
    scale: binScale,
    starts
  }
}

interface CachedSelectionSegment {
  readonly endLeftVertex: number
  readonly endProgress: number
  readonly endRightVertex: number
  readonly startLeftVertex: number
  readonly startProgress: number
  readonly startRightVertex: number
  readonly triangleIndex: number
}

interface ContourEdge {
  boundaryKey: string
  direction: number
  endX: number
  endY: number
  startX: number
  startY: number
}

interface ContourPoint {
  x: number
  y: number
}

interface ProjectedSilhouetteSegment {
  readonly endX: number
  readonly endY: number
  readonly startX: number
  readonly startY: number
}

interface ContourLoop {
  readonly boundaryKeys: readonly string[]
  readonly points: readonly ContourPoint[]
}

interface ContourTraceScratch {
  edgeCounts: Int32Array
  edgePools: ContourEdge[][]
  outgoingHead: Int32Array
  outgoingNext: Int32Array
  readonly rawLoopEdges: ContourEdge[]
  readonly rawLoopVertexKeys: number[]
  readonly sharedPoints: Array<ContourPoint | undefined>
  readonly sharedPointX: Float32Array
  readonly sharedPointY: Float32Array
  touchedVertices: Int32Array
  usedEdges: Uint8Array
}

const contourBoundaryKey = (left: number, right: number) => (
  left < right ? `${left}:${right}` : `${right}:${left}`
)

const pointLineDistance = (point: ContourPoint, start: ContourPoint, end: ContourPoint) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length < Number.EPSILON) return Math.hypot(point.x - start.x, point.y - start.y)
  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / length
}

const contourPointDistance = (left: ContourPoint, right: ContourPoint) => (
  Math.hypot(right.x - left.x, right.y - left.y)
)

const contourPointSignature = (point: ContourPoint) => `${point.x.toFixed(4)},${point.y.toFixed(4)}`

interface SharedCurveSegment {
  readonly control1: ContourPoint
  readonly control2: ContourPoint
  readonly end: ContourPoint
  readonly start: ContourPoint
}

const normalizedContourVector = (x: number, y: number) => {
  const length = Math.hypot(x, y)
  return length < 1e-8 ? { x: 0, y: 0 } : { x: x / length, y: y / length }
}

const evaluateCubicPoint = (
  curve: SharedCurveSegment,
  progress: number
): ContourPoint => {
  const inverse = 1 - progress
  const inverseSquared = inverse * inverse
  const progressSquared = progress * progress
  return {
    x: curve.start.x * inverseSquared * inverse
      + curve.control1.x * 3 * inverseSquared * progress
      + curve.control2.x * 3 * inverse * progressSquared
      + curve.end.x * progressSquared * progress,
    y: curve.start.y * inverseSquared * inverse
      + curve.control1.y * 3 * inverseSquared * progress
      + curve.control2.y * 3 * inverse * progressSquared
      + curve.end.y * progressSquared * progress
  }
}

const reverseCurveSegments = (segments: readonly SharedCurveSegment[]) => (
  segments.slice().reverse().map(segment => ({
    control1: segment.control2,
    control2: segment.control1,
    end: segment.start,
    start: segment.end
  }))
)

/**
 * Fit a dense shared boundary run with a small set of cubic segments. The
 * categorical owner field determines topology, while this bounded fit removes
 * the one-sample-per-command faceting from the final SVG. The routine is a
 * deliberately constrained form of Schneider's recursive Bezier fitting: it
 * never moves run endpoints, clamps handles to the endpoint chord, and splits
 * until every sampled boundary point stays inside the requested screen-space
 * corridor.
 */
const fitContourCubicRun = (
  points: readonly ContourPoint[],
  maximumError: number
): { readonly maxError: number, readonly segments: readonly SharedCurveSegment[] } => {
  if (points.length < 2) return { maxError: 0, segments: [] }
  let maximumObservedError = 0
  const segments: SharedCurveSegment[] = []
  const fitRange = (
    startIndex: number,
    endIndex: number,
    startTangent: ContourPoint,
    endTangent: ContourPoint
  ) => {
    const start = points[startIndex]!
    const end = points[endIndex]!
    const chordLength = contourPointDistance(start, end)
    if (endIndex - startIndex === 1 || chordLength < 1e-6) {
      const handleLength = chordLength / 3
      segments.push({
        control1: {
          x: start.x + startTangent.x * handleLength,
          y: start.y + startTangent.y * handleLength
        },
        control2: {
          x: end.x + endTangent.x * handleLength,
          y: end.y + endTangent.y * handleLength
        },
        end,
        start
      })
      return
    }

    const parameters = new Float64Array(endIndex - startIndex + 1)
    let totalLength = 0
    for (let index = startIndex + 1; index <= endIndex; index += 1) {
      totalLength += contourPointDistance(points[index - 1]!, points[index]!)
      parameters[index - startIndex] = totalLength
    }
    if (totalLength < 1e-8) return
    for (let index = 1; index < parameters.length; index += 1) {
      parameters[index] /= totalLength
    }

    let c00 = 0
    let c01 = 0
    let c11 = 0
    let x0 = 0
    let x1 = 0
    for (let offset = 0; offset < parameters.length; offset += 1) {
      const progress = parameters[offset]!
      const inverse = 1 - progress
      const b0 = inverse * inverse * inverse
      const b1 = 3 * progress * inverse * inverse
      const b2 = 3 * progress * progress * inverse
      const b3 = progress * progress * progress
      const a1 = { x: startTangent.x * b1, y: startTangent.y * b1 }
      const a2 = { x: endTangent.x * b2, y: endTangent.y * b2 }
      const point = points[startIndex + offset]!
      const residual = {
        x: point.x - start.x * (b0 + b1) - end.x * (b2 + b3),
        y: point.y - start.y * (b0 + b1) - end.y * (b2 + b3)
      }
      c00 += a1.x * a1.x + a1.y * a1.y
      c01 += a1.x * a2.x + a1.y * a2.y
      c11 += a2.x * a2.x + a2.y * a2.y
      x0 += a1.x * residual.x + a1.y * residual.y
      x1 += a2.x * residual.x + a2.y * residual.y
    }
    const determinant = c00 * c11 - c01 * c01
    let startAlpha = determinant === 0 ? chordLength / 3 : (x0 * c11 - x1 * c01) / determinant
    let endAlpha = determinant === 0 ? chordLength / 3 : (c00 * x1 - c01 * x0) / determinant
    const minimumAlpha = chordLength * 1e-4
    const maximumAlpha = chordLength
    if (!Number.isFinite(startAlpha) || startAlpha < minimumAlpha || startAlpha > maximumAlpha) {
      startAlpha = chordLength / 3
    }
    if (!Number.isFinite(endAlpha) || endAlpha < minimumAlpha || endAlpha > maximumAlpha) {
      endAlpha = chordLength / 3
    }
    const curve: SharedCurveSegment = {
      control1: {
        x: start.x + startTangent.x * startAlpha,
        y: start.y + startTangent.y * startAlpha
      },
      control2: {
        x: end.x + endTangent.x * endAlpha,
        y: end.y + endTangent.y * endAlpha
      },
      end,
      start
    }
    let splitIndex = Math.floor((startIndex + endIndex) / 2)
    let maximumDistance = 0
    for (let offset = 1; offset < parameters.length - 1; offset += 1) {
      const expected = evaluateCubicPoint(curve, parameters[offset]!)
      const distance = contourPointDistance(expected, points[startIndex + offset]!)
      if (distance <= maximumDistance) continue
      maximumDistance = distance
      splitIndex = startIndex + offset
    }
    if (maximumDistance <= maximumError) {
      maximumObservedError = Math.max(maximumObservedError, maximumDistance)
      segments.push(curve)
      return
    }
    const centerTangent = normalizedContourVector(
      points[splitIndex - 1]!.x - points[splitIndex + 1]!.x,
      points[splitIndex - 1]!.y - points[splitIndex + 1]!.y
    )
    fitRange(startIndex, splitIndex, startTangent, centerTangent)
    fitRange(splitIndex, endIndex, { x: -centerTangent.x, y: -centerTangent.y }, endTangent)
  }

  const startTangent = normalizedContourVector(
    points[1]!.x - points[0]!.x,
    points[1]!.y - points[0]!.y
  )
  const endTangent = normalizedContourVector(
    points.at(-2)!.x - points.at(-1)!.x,
    points.at(-2)!.y - points.at(-1)!.y
  )
  fitRange(0, points.length - 1, startTangent, endTangent)
  return { maxError: maximumObservedError, segments }
}

const simplifyOpenContourRun = (
  points: readonly ContourPoint[],
  tolerance: number
): number[] => {
  if (points.length <= 2) return points.map((_, index) => index)
  const retained = new Uint8Array(points.length)
  retained[0] = 1
  retained[points.length - 1] = 1
  const stack: Array<[number, number]> = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop()!
    let maximumDistance = tolerance
    let splitIndex = -1
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = pointLineDistance(points[index]!, points[startIndex]!, points[endIndex]!)
      if (distance <= maximumDistance) continue
      maximumDistance = distance
      splitIndex = index
    }
    if (splitIndex < 0) continue
    retained[splitIndex] = 1
    stack.push([startIndex, splitIndex], [splitIndex, endIndex])
  }
  return [...retained.entries()].filter(([, value]) => value === 1).map(([index]) => index)
}

const simplifyClosedContour = (
  points: readonly ContourPoint[],
  boundaryKeys: readonly string[],
  tolerance: number
): ContourLoop => {
  if (points.length <= 4) return { boundaryKeys, points }
  const transitionIndexes = points
    .map((_, index) => index)
    .filter(index => boundaryKeys[(index + points.length - 1) % points.length] !== boundaryKeys[index])
  const anchors = transitionIndexes.length > 0
    ? transitionIndexes
    : (() => {
        let left = 0
        let right = 0
        for (let index = 1; index < points.length; index += 1) {
          if (points[index]!.x < points[left]!.x) left = index
          if (points[index]!.x > points[right]!.x) right = index
        }
        if (left === right) right = (left + Math.floor(points.length / 2)) % points.length
        return [left, right].sort((a, b) => a - b)
      })()
  const outputPoints: ContourPoint[] = []
  const outputBoundaryKeys: string[] = []
  for (let anchorOffset = 0; anchorOffset < anchors.length; anchorOffset += 1) {
    const start = anchors[anchorOffset]!
    const end = anchors[(anchorOffset + 1) % anchors.length]!
    const indexes = [start]
    let cursor = start
    while (cursor !== end) {
      cursor = (cursor + 1) % points.length
      indexes.push(cursor)
    }
    const runPoints = indexes.map(index => points[index]!)
    const retained = simplifyOpenContourRun(runPoints, tolerance)
    for (let retainedOffset = 0; retainedOffset < retained.length - 1; retainedOffset += 1) {
      const sourceOffset = retained[retainedOffset]!
      outputPoints.push(runPoints[sourceOffset]!)
      outputBoundaryKeys.push(boundaryKeys[indexes[sourceOffset]!]!)
    }
  }
  return outputPoints.length >= 3
    ? { boundaryKeys: outputBoundaryKeys, points: outputPoints }
    : { boundaryKeys, points }
}

/**
 * Trace one categorical owner field into vector loops. The raster remains the
 * topology oracle, but its cell runs are never painted. Every lattice junction
 * is moved once from the confidence-weighted depth crossing shared by all
 * adjacent labels, so both sides of a part boundary consume identical points.
 */
const traceContinuousLabelPaths = (
  labels: Int16Array,
  confidence: Float32Array,
  labelCount: number,
  width: number,
  height: number,
  refineOuterBoundaryPoint?: (label: number, point: ContourPoint) => ContourPoint,
  bounds?: { readonly maxX: number, readonly maxY: number, readonly minX: number, readonly minY: number },
  scratch?: ContourTraceScratch,
  smoothInternalBoundaries = false
) => {
  const edgePools = scratch != null && scratch.edgePools.length >= labelCount
    ? scratch.edgePools
    : Array.from({ length: labelCount }, () => [] as ContourEdge[])
  const edgeCounts = scratch != null && scratch.edgeCounts.length >= labelCount
    ? scratch.edgeCounts
    : new Int32Array(labelCount)
  const ensureTraversalCapacity = (edgeCount: number) => {
    if (scratch == null || scratch.outgoingNext.length >= edgeCount) return
    let capacity = Math.max(64, scratch.outgoingNext.length)
    while (capacity < edgeCount) capacity *= 2
    scratch.outgoingNext = new Int32Array(capacity)
    scratch.touchedVertices = new Int32Array(capacity)
    scratch.usedEdges = new Uint8Array(capacity)
  }
  edgeCounts.fill(0, 0, labelCount)
  const pushEdge = (
    label: number,
    boundaryKey: string,
    direction: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const edgeIndex = edgeCounts[label]!
    const edges = edgePools[label]!
    const edge = edges[edgeIndex]
    if (edge == null) {
      edges.push({ boundaryKey, direction, endX, endY, startX, startY })
    } else {
      edge.boundaryKey = boundaryKey
      edge.direction = direction
      edge.endX = endX
      edge.endY = endY
      edge.startX = startX
      edge.startY = startY
    }
    edgeCounts[label] = edgeIndex + 1
  }
  const labelAt = (x: number, y: number) => (
    x < 0 || y < 0 || x >= width || y >= height ? -1 : labels[y * width + x]!
  )
  const pushSharedVerticalBoundary = (x: number, y: number, left: number, right: number) => {
    if (left === right) return
    const boundaryKey = contourBoundaryKey(left, right)
    if (left >= 0 && left < labelCount) {
      pushEdge(left, boundaryKey, 1, x, y, x, y + 1)
    }
    if (right >= 0 && right < labelCount) {
      pushEdge(right, boundaryKey, 3, x, y + 1, x, y)
    }
  }
  const pushSharedHorizontalBoundary = (x: number, y: number, top: number, bottom: number) => {
    if (top === bottom) return
    const boundaryKey = contourBoundaryKey(top, bottom)
    if (top >= 0 && top < labelCount) {
      pushEdge(top, boundaryKey, 2, x + 1, y, x, y)
    }
    if (bottom >= 0 && bottom < labelCount) {
      pushEdge(bottom, boundaryKey, 0, x, y, x + 1, y)
    }
  }
  const scanMinX = clamp(Math.floor(bounds?.minX ?? 0), 0, width - 1)
  const scanMaxX = clamp(Math.ceil(bounds?.maxX ?? width - 1), 0, width - 1)
  const scanMinY = clamp(Math.floor(bounds?.minY ?? 0), 0, height - 1)
  const scanMaxY = clamp(Math.ceil(bounds?.maxY ?? height - 1), 0, height - 1)
  for (let y = scanMinY; y <= scanMaxY; y += 1) {
    for (let x = scanMinX; x <= scanMaxX; x += 1) {
      const label = labels[y * width + x]!
      if (x === scanMinX) pushSharedVerticalBoundary(x, y, labelAt(x - 1, y), label)
      pushSharedVerticalBoundary(x + 1, y, label, labelAt(x + 1, y))
      if (y === scanMinY) pushSharedHorizontalBoundary(x, y, labelAt(x, y - 1), label)
      pushSharedHorizontalBoundary(x, y + 1, label, labelAt(x, y + 1))
    }
  }

  const latticeWidth = width + 1
  const latticeSize = latticeWidth * (height + 1)
  const sharedPointX = scratch?.sharedPointX.length === latticeSize
    ? scratch.sharedPointX
    : new Float32Array(latticeSize)
  const sharedPointY = scratch?.sharedPointY.length === latticeSize
    ? scratch.sharedPointY
    : new Float32Array(latticeSize)
  const sharedPoints = scratch?.sharedPoints.length === latticeSize
    ? scratch.sharedPoints
    : new Array<ContourPoint | undefined>(latticeSize)
  sharedPointX.fill(Number.NaN)
  const confidenceAt = (pixelX: number, pixelY: number) => {
    if (pixelX < 0 || pixelY < 0 || pixelX >= width || pixelY >= height) return 1
    const sample = confidence[pixelY * width + pixelX]!
    return Number.isFinite(sample) ? Math.max(sample, .001) : 1
  }
  const continuousPointAt = (x: number, y: number) => {
    const key = y * latticeWidth + x
    let point = sharedPoints[key]
    if (!Number.isNaN(sharedPointX[key]!)) {
      if (point == null) {
        point = { x: sharedPointX[key]!, y: sharedPointY[key]! }
        sharedPoints[key] = point
      }
      return point
    }
    const topLeftLabel = labelAt(x - 1, y - 1)
    const topRightLabel = labelAt(x, y - 1)
    const bottomRightLabel = labelAt(x, y)
    const bottomLeftLabel = labelAt(x - 1, y)
    const topLeftConfidence = confidenceAt(x - 1, y - 1)
    const topRightConfidence = confidenceAt(x, y - 1)
    const bottomRightConfidence = confidenceAt(x, y)
    const bottomLeftConfidence = confidenceAt(x - 1, y)
    let crossingCount = 0
    let crossingX = 0
    let crossingY = 0
    if (topLeftLabel !== topRightLabel) {
      const ratio = topLeftConfidence / (topLeftConfidence + topRightConfidence)
      crossingX += x - .5 + ratio
      crossingY += y - .5
      crossingCount += 1
    }
    if (topRightLabel !== bottomRightLabel) {
      const ratio = topRightConfidence / (topRightConfidence + bottomRightConfidence)
      crossingX += x + .5
      crossingY += y - .5 + ratio
      crossingCount += 1
    }
    if (bottomRightLabel !== bottomLeftLabel) {
      const ratio = bottomRightConfidence / (bottomRightConfidence + bottomLeftConfidence)
      crossingX += x + .5 - ratio
      crossingY += y + .5
      crossingCount += 1
    }
    if (bottomLeftLabel !== topLeftLabel) {
      const ratio = bottomLeftConfidence / (bottomLeftConfidence + topLeftConfidence)
      crossingX += x - .5
      crossingY += y + .5 - ratio
      crossingCount += 1
    }
    const pointX = crossingCount < 2 ? x : crossingX / crossingCount
    const pointY = crossingCount < 2 ? y : crossingY / crossingCount
    sharedPointX[key] = pointX
    sharedPointY[key] = pointY
    if (point == null) {
      point = { x: pointX, y: pointY }
      sharedPoints[key] = point
    } else {
      point.x = pointX
      point.y = pointY
    }
    return point
  }

  const boundaryLabels = new Map<string, readonly [number, number]>()
  const labelsForBoundary = (boundaryKey: string) => {
    const cached = boundaryLabels.get(boundaryKey)
    if (cached != null) return cached
    const separator = boundaryKey.indexOf(':')
    const labels = [
      Number(boundaryKey.slice(0, separator)),
      Number(boundaryKey.slice(separator + 1))
    ] as const
    boundaryLabels.set(boundaryKey, labels)
    return labels
  }
  const boundaryFieldAt = (x: number, y: number, boundaryKey: string) => {
    const [firstLabel, secondLabel] = labelsForBoundary(boundaryKey)
    const gridX = x - .5
    const gridY = y - .5
    const baseX = Math.floor(gridX)
    const baseY = Math.floor(gridY)
    const fractionX = gridX - baseX
    const fractionY = gridY - baseY
    let value = 0
    let totalWeight = 0
    for (let offsetY = 0; offsetY <= 1; offsetY += 1) {
      for (let offsetX = 0; offsetX <= 1; offsetX += 1) {
        const pixelX = baseX + offsetX
        const pixelY = baseY + offsetY
        const sampleLabel = labelAt(pixelX, pixelY)
        if (sampleLabel !== firstLabel && sampleLabel !== secondLabel) continue
        const pixelIndex = pixelX < 0 || pixelY < 0 || pixelX >= width || pixelY >= height
          ? -1
          : pixelY * width + pixelX
        const sampleConfidence = pixelIndex < 0 ? 1 : Math.max(confidence[pixelIndex]!, .001)
        const weight = (offsetX === 0 ? 1 - fractionX : fractionX)
          * (offsetY === 0 ? 1 - fractionY : fractionY)
        value += (sampleLabel === firstLabel ? sampleConfidence : -sampleConfidence) * weight
        totalWeight += weight
      }
    }
    return totalWeight <= 1e-8 ? 0 : value / totalWeight
  }

  // Only refine the narrow owner-change band. The categorical raster decides
  // topology; the confidence field (real surface-depth / SDF distance margin)
  // relocates the local crossing without increasing the full raster or mesh.
  const sharedRefinedMidpoints = new Map<string, ContourPoint>()
  const projectPointToBoundary = (
    point: ContourPoint,
    normalX: number,
    normalY: number,
    boundaryKey: string,
    radius: number
  ) => {
    let low = -radius
    let high = radius
    let lowValue = boundaryFieldAt(point.x + normalX * low, point.y + normalY * low, boundaryKey)
    let highValue = boundaryFieldAt(point.x + normalX * high, point.y + normalY * high, boundaryKey)
    if (lowValue !== 0 && highValue !== 0 && Math.sign(lowValue) === Math.sign(highValue)) return point
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const middle = (low + high) / 2
      const middleValue = boundaryFieldAt(
        point.x + normalX * middle,
        point.y + normalY * middle,
        boundaryKey
      )
      if (Math.abs(middleValue) < 1e-5) {
        low = middle
        high = middle
        break
      }
      if (Math.sign(middleValue) === Math.sign(lowValue)) {
        low = middle
        lowValue = middleValue
      } else {
        high = middle
        highValue = middleValue
      }
    }
    const offset = Math.abs(lowValue) <= Math.abs(highValue) ? low : high
    return { x: point.x + normalX * offset, y: point.y + normalY * offset }
  }

  const refinedMidpoint = (start: ContourPoint, end: ContourPoint, boundaryKey: string) => {
    const startSignature = contourPointSignature(start)
    const endSignature = contourPointSignature(end)
    const key = startSignature < endSignature
      ? `${boundaryKey}:${startSignature}|${endSignature}`
      : `${boundaryKey}:${endSignature}|${startSignature}`
    const cached = sharedRefinedMidpoints.get(key)
    if (cached != null) return cached
    const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
    const length = contourPointDistance(start, end)
    if (length < .35) {
      sharedRefinedMidpoints.set(key, midpoint)
      return midpoint
    }
    const normalX = -(end.y - start.y) / length
    const normalY = (end.x - start.x) / length
    const radius = Math.min(.7, Math.max(.35, length * .55))
    const refined = projectPointToBoundary(midpoint, normalX, normalY, boundaryKey, radius)
    sharedRefinedMidpoints.set(key, refined)
    return refined
  }

  const sharedCurves = new Map<string, {
    readonly maxError: number
    readonly segments: readonly SharedCurveSegment[]
  }>()
  const sharedJunctionCurves = new Map<string, SharedCurveSegment>()
  // The compiled silhouette / depth-zero samples are simplified inside a
  // .04-unit corridor, then the shared cubic consumes at most .08 more. The
  // two-decimal SVG serialization adds at most .005, so at the supported 2x
  // scene zoom the combined .125-unit bound stays at or below .25px.
  const maximumCurveError = .08
  const maximumSimplificationError = .04
  const serializationRoundingError = .005
  let curveSegmentCount = 0
  let lineSegmentCount = 0
  let maximumObservedCurveError = 0
  let sharedCurveReuseCount = 0

  const serializeLoop = (points: readonly ContourPoint[], boundaryKeys: readonly string[]) => {
    const pointCount = points.length
    const transitionIndex = points.findIndex((_, index) => (
      boundaryKeys[(index + pointCount - 1) % pointCount] !== boundaryKeys[index]
    ))
    let startIndex = transitionIndex
    if (startIndex < 0) {
      startIndex = 0
      for (let index = 1; index < pointCount; index += 1) {
        if (contourPointSignature(points[index]!) < contourPointSignature(points[startIndex]!)) {
          startIndex = index
        }
      }
    }
    const rotatedPoints = points.map((_, index) => points[(startIndex + index) % pointCount]!)
    const rotatedBoundaryKeys = boundaryKeys.map((_, index) => (
      boundaryKeys[(startIndex + index) % pointCount]!
    ))
    const appendFittedRun = (
      path: string,
      runPoints: readonly ContourPoint[],
      boundaryKey: string,
      disambiguator: string
    ) => {
      if (runPoints.length < 2) return path
      const [firstBoundaryLabel, secondBoundaryLabel] = labelsForBoundary(boundaryKey)
      if (firstBoundaryLabel >= 0 && secondBoundaryLabel >= 0 && !smoothInternalBoundaries) {
        for (let index = 0; index < runPoints.length - 1; index += 1) {
          const start = runPoints[index]!
          const end = runPoints[index + 1]!
          const startSignature = contourPointSignature(start)
          const endSignature = contourPointSignature(end)
          const forward = startSignature <= endSignature
          const cacheKey = forward
            ? `${boundaryKey}:${startSignature}|${endSignature}`
            : `${boundaryKey}:${endSignature}|${startSignature}`
          let curve = sharedJunctionCurves.get(cacheKey)
          if (curve == null) {
            const canonicalStart = forward ? start : end
            const canonicalEnd = forward ? end : start
            const refined = refinedMidpoint(canonicalStart, canonicalEnd, boundaryKey)
            const linearMidpoint = {
              x: (canonicalStart.x + canonicalEnd.x) / 2,
              y: (canonicalStart.y + canonicalEnd.y) / 2
            }
            const midpointDisplacement = contourPointDistance(linearMidpoint, refined)
            const midpoint = midpointDisplacement <= maximumCurveError
              ? refined
              : {
                  x: linearMidpoint.x + (refined.x - linearMidpoint.x)
                    * maximumCurveError / midpointDisplacement,
                  y: linearMidpoint.y + (refined.y - linearMidpoint.y)
                    * maximumCurveError / midpointDisplacement
                }
            const quadraticControl = {
              x: midpoint.x * 2 - (canonicalStart.x + canonicalEnd.x) / 2,
              y: midpoint.y * 2 - (canonicalStart.y + canonicalEnd.y) / 2
            }
            curve = {
              control1: {
                x: canonicalStart.x + (quadraticControl.x - canonicalStart.x) * 2 / 3,
                y: canonicalStart.y + (quadraticControl.y - canonicalStart.y) * 2 / 3
              },
              control2: {
                x: canonicalEnd.x + (quadraticControl.x - canonicalEnd.x) * 2 / 3,
                y: canonicalEnd.y + (quadraticControl.y - canonicalEnd.y) * 2 / 3
              },
              end: canonicalEnd,
              start: canonicalStart
            }
            sharedJunctionCurves.set(cacheKey, curve)
          } else {
            sharedCurveReuseCount += 1
          }
          const oriented = forward ? curve : {
            control1: curve.control2,
            control2: curve.control1,
            end: curve.start,
            start: curve.end
          }
          // Junction curves originate from one quadratic depth-equality sample.
          // Preserve that exact shared curve as Q instead of expanding it to C:
          // both owners still reuse the same boundary, while the hot-path SVG
          // payload is materially smaller and cheaper for the browser to parse.
          const quadraticControl = {
            x: oriented.start.x + (oriented.control1.x - oriented.start.x) * 1.5,
            y: oriented.start.y + (oriented.control1.y - oriented.start.y) * 1.5
          }
          path += `Q${quadraticControl.x.toFixed(2)} ${quadraticControl.y.toFixed(2)} ${oriented.end.x.toFixed(2)} ${oriented.end.y.toFixed(2)}`
          curveSegmentCount += 1
        }
        return path
      }
      const startSignature = contourPointSignature(runPoints[0]!)
      const endSignature = contourPointSignature(runPoints.at(-1)!)
      const forward = startSignature <= endSignature
      const canonicalPoints = forward ? runPoints : runPoints.slice().reverse()
      const cacheKey = `${boundaryKey}:${forward ? startSignature : endSignature}|${forward ? endSignature : startSignature}:${disambiguator}`
      let fitted = sharedCurves.get(cacheKey)
      if (fitted == null) {
        fitted = fitContourCubicRun(canonicalPoints, maximumCurveError)
        sharedCurves.set(cacheKey, fitted)
      } else {
        sharedCurveReuseCount += 1
      }
      maximumObservedCurveError = Math.max(maximumObservedCurveError, fitted.maxError)
      const segments = forward ? fitted.segments : reverseCurveSegments(fitted.segments)
      for (const segment of segments) {
        path += `C${segment.control1.x.toFixed(2)} ${segment.control1.y.toFixed(2)} ${segment.control2.x.toFixed(2)} ${segment.control2.y.toFixed(2)} ${segment.end.x.toFixed(2)} ${segment.end.y.toFixed(2)}`
        curveSegmentCount += 1
      }
      return path
    }

    let path = `M${rotatedPoints[0]!.x.toFixed(2)} ${rotatedPoints[0]!.y.toFixed(2)}`
    if (transitionIndex < 0) {
      let splitIndex = 1
      let splitDistance = 0
      for (let index = 1; index < pointCount; index += 1) {
        const distance = contourPointDistance(rotatedPoints[0]!, rotatedPoints[index]!)
        if (distance <= splitDistance) continue
        splitDistance = distance
        splitIndex = index
      }
      path = appendFittedRun(
        path,
        rotatedPoints.slice(0, splitIndex + 1),
        rotatedBoundaryKeys[0]!,
        'closed-a'
      )
      path = appendFittedRun(
        path,
        [...rotatedPoints.slice(splitIndex), rotatedPoints[0]!],
        rotatedBoundaryKeys[0]!,
        'closed-b'
      )
      return `${path}Z`
    }

    const closedPoints = [...rotatedPoints, rotatedPoints[0]!]
    let runStart = 0
    while (runStart < pointCount) {
      let runEnd = runStart
      while (runEnd + 1 < pointCount
        && rotatedBoundaryKeys[runEnd + 1] === rotatedBoundaryKeys[runStart]) {
        runEnd += 1
      }
      path = appendFittedRun(
        path,
        closedPoints.slice(runStart, runEnd + 2),
        rotatedBoundaryKeys[runStart]!,
        'open'
      )
      runStart = runEnd + 1
    }
    return `${path}Z`
  }

  let segmentCount = 0
  const paths = Array.from({ length: labelCount }, (_, labelIndex) => {
    const edges = edgePools[labelIndex]!
    const edgeCount = edgeCounts[labelIndex]!
    ensureTraversalCapacity(edgeCount)
    const outgoingHead = scratch?.outgoingHead ?? new Int32Array(latticeWidth * (height + 1)).fill(-1)
    const outgoingNext = scratch?.outgoingNext ?? new Int32Array(edgeCount)
    const touchedVertices = scratch?.touchedVertices ?? new Int32Array(edgeCount)
    const used = scratch?.usedEdges ?? new Uint8Array(edgeCount)
    used.fill(0, 0, edgeCount)
    let touchedVertexCount = 0
    for (let index = 0; index < edgeCount; index += 1) {
      const edge = edges[index]!
      const key = edge.startY * latticeWidth + edge.startX
      if (outgoingHead[key] === -1) {
        touchedVertices[touchedVertexCount] = key
        touchedVertexCount += 1
      }
      outgoingNext[index] = outgoingHead[key]!
      outgoingHead[key] = index
    }
    const loops: ContourLoop[] = []
    const rawLoopVertexKeys = scratch?.rawLoopVertexKeys ?? []
    const rawLoopEdges = scratch?.rawLoopEdges ?? []
    for (let edgeIndex = 0; edgeIndex < edgeCount; edgeIndex += 1) {
      if (used[edgeIndex] === 1) continue
      const first = edges[edgeIndex]!
      rawLoopVertexKeys.length = 0
      rawLoopEdges.length = 0
      rawLoopVertexKeys.push(first.startY * latticeWidth + first.startX)
      let currentIndex = edgeIndex
      let guard = 0
      while (guard <= edgeCount) {
        guard += 1
        const current = edges[currentIndex]!
        used[currentIndex] = 1
        rawLoopEdges.push(current)
        rawLoopVertexKeys.push(current.endY * latticeWidth + current.endX)
        if (current.endX === first.startX && current.endY === first.startY) {
          break
        }
        const candidateKey = current.endY * latticeWidth + current.endX
        let nextIndex = -1
        let nextPriority = Number.POSITIVE_INFINITY
        for (
          let candidate = outgoingHead[candidateKey]!;
          candidate >= 0;
          candidate = outgoingNext[candidate]!
        ) {
          if (used[candidate] === 1) continue
          const turn = (edges[candidate]!.direction - current.direction + 4) % 4
          const priority = turn === 1 ? 0 : turn === 0 ? 1 : turn === 3 ? 2 : 3
          if (priority < nextPriority || (priority === nextPriority && candidate < nextIndex)) {
            nextIndex = candidate
            nextPriority = priority
          }
        }
        if (nextIndex < 0) break
        currentIndex = nextIndex
      }
      if (rawLoopVertexKeys.length < 4) continue
      const continuous = new Array<ContourPoint>(rawLoopVertexKeys.length - 1)
      for (let index = 0; index < continuous.length; index += 1) {
        const vertexKey = rawLoopVertexKeys[index]!
        continuous[index] = continuousPointAt(vertexKey % latticeWidth, Math.floor(vertexKey / latticeWidth))
      }
      const boundaryKeys = rawLoopEdges.map(edge => edge.boundaryKey)
      const silhouetteRefined = refineOuterBoundaryPoint == null
        ? continuous
        : continuous.map((point, index) => {
            const previousIndex = (index + continuous.length - 1) % continuous.length
            if (boundaryKeys[previousIndex] !== boundaryKeys[index]) return point
            const [firstLabel, secondLabel] = labelsForBoundary(boundaryKeys[index]!)
            if (firstLabel !== -1 && secondLabel !== -1) return point
            return refineOuterBoundaryPoint(firstLabel === -1 ? secondLabel : firstLabel, point)
          })
      // Do not average already projected compiled-silhouette samples in screen
      // space. That recreates a one-pixel wave which the simplifier must retain.
      // The curve fitter below owns tangent continuity without moving the
      // shared ownership boundary away from the compiled surface.
      const smoothed = silhouetteRefined
      const refined: ContourPoint[] = []
      const refinedBoundaryKeys: string[] = []
      for (let index = 0; index < smoothed.length; index += 1) {
        const start = smoothed[index]!
        const end = smoothed[(index + 1) % smoothed.length]!
        const boundaryKey = rawLoopEdges[index]!.boundaryKey
        if (refined.length === 0 || contourPointDistance(refined.at(-1)!, start) > .0001) {
          refined.push(start)
          refinedBoundaryKeys.push(boundaryKey)
        }
        const linearMidpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
        if (contourPointDistance(start, end) > 1.45) {
          const midpoint = refinedMidpoint(start, end, boundaryKey)
          if (contourPointDistance(midpoint, linearMidpoint) > .12
            && contourPointDistance(start, midpoint) > .08
            && contourPointDistance(midpoint, end) > .08) {
            refined.push(midpoint)
            refinedBoundaryKeys.push(boundaryKey)
          }
        }
      }
      if (refined.length >= 3) loops.push(simplifyClosedContour(
        refined,
        refinedBoundaryKeys,
        maximumSimplificationError
      ))
    }
    for (let index = 0; index < touchedVertexCount; index += 1) {
      outgoingHead[touchedVertices[index]!] = -1
    }
    const path = loops.map(loop => serializeLoop(loop.points, loop.boundaryKeys)).join('')
    return path
  })
  segmentCount = curveSegmentCount + lineSegmentCount
  return {
    curveSegmentCount,
    lineSegmentCount,
    maxCurveError: maximumObservedCurveError + maximumSimplificationError + serializationRoundingError,
    paths,
    sharedCurveReuseCount,
    segmentCount
  }
}

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(Math.max(value, minimum), maximum)
)

const percentile = (samples: readonly number[], ratio: number) => {
  if (samples.length === 0) return 0
  const ordered = [...samples].sort((left, right) => left - right)
  return ordered[Math.min(Math.floor((ordered.length - 1) * ratio), ordered.length - 1)]!
}

export const summarizeOptimizedProjectionSamples = (
  samples: readonly OptimizedCompiledAvatarProjectionMetrics[]
) => ({
  binCullP50Ms: percentile(samples.map(sample => sample.binCullMs), .5),
  binCullP95Ms: percentile(samples.map(sample => sample.binCullMs), .95),
  contourP50Ms: percentile(samples.map(sample => sample.contourMs), .5),
  contourP95Ms: percentile(samples.map(sample => sample.contourMs), .95),
  depthOwnerP50Ms: percentile(samples.map(sample => sample.depthOwnerMs), .5),
  depthOwnerP95Ms: percentile(samples.map(sample => sample.depthOwnerMs), .95),
  pathSerializationP50Ms: percentile(samples.map(sample => sample.pathSerializationMs), .5),
  pathSerializationP95Ms: percentile(samples.map(sample => sample.pathSerializationMs), .95),
  projectP50Ms: percentile(samples.map(sample => sample.projectMs), .5),
  projectP95Ms: percentile(samples.map(sample => sample.projectMs), .95),
  transformP50Ms: percentile(samples.map(sample => sample.transformMs), .5),
  transformP95Ms: percentile(samples.map(sample => sample.transformMs), .95)
})

export const createOptimizedCompiledAvatarProjector = (
  mesh: CompiledAvatarMesh,
  primitives: readonly CompiledAvatarPrimitive[],
  options: OptimizedCompiledAvatarProjectorOptions
): OptimizedCompiledAvatarProjector => {
  const width = options.width
  const height = options.height
  const centerX = options.centerX ?? width / 2
  const centerY = options.centerY ?? height / 2
  const pixelCount = width * height
  const maximumContourLabels = Math.max(1, primitives.length + (options.markings?.length ?? 0))
  const contourTraceScratch: ContourTraceScratch = {
    edgeCounts: new Int32Array(maximumContourLabels),
    edgePools: Array.from({ length: maximumContourLabels }, () => []),
    outgoingHead: new Int32Array((width + 1) * (height + 1)).fill(-1),
    outgoingNext: new Int32Array(1024),
    rawLoopEdges: [],
    rawLoopVertexKeys: [],
    sharedPoints: new Array<ContourPoint | undefined>((width + 1) * (height + 1)),
    sharedPointX: new Float32Array((width + 1) * (height + 1)),
    sharedPointY: new Float32Array((width + 1) * (height + 1)),
    touchedVertices: new Int32Array(1024),
    usedEdges: new Uint8Array(1024)
  }
  const tileSize = clamp(Math.round(options.tileSize ?? 20), 8, 40)
  const tileColumns = Math.ceil(width / tileSize)
  const tileRows = Math.ceil(height / tileSize)
  const tileCount = tileColumns * tileRows
  const worldToPixelScale = width / (options.referenceSize ?? width)
  const usesAvatarPoseConvention = options.poseConvention === 'avatar'
  const vertexCount = mesh.vertices.length
  const triangleCount = mesh.triangles.length
  const primitiveCount = primitives.length
  const primitiveIds = primitives.map(primitive => primitive.id)

  const vertexX = new Float32Array(vertexCount)
  const vertexY = new Float32Array(vertexCount)
  const vertexZ = new Float32Array(vertexCount)
  const normalX = new Float32Array(vertexCount)
  const normalY = new Float32Array(vertexCount)
  const normalZ = new Float32Array(vertexCount)
  const projectedX = new Float32Array(vertexCount)
  const projectedY = new Float32Array(vertexCount)
  const projectedZ = new Float32Array(vertexCount)
  for (let index = 0; index < vertexCount; index += 1) {
    const vertex = mesh.vertices[index]!
    vertexX[index] = vertex.x
    vertexY[index] = vertex.y
    vertexZ[index] = vertex.z
    normalX[index] = vertex.normal.x
    normalY[index] = vertex.normal.y
    normalZ[index] = vertex.normal.z
  }

  const triangleVertices = new Int32Array(triangleCount * 3)
  const meshEdgeMap = new Map<string, { firstVertex: number, secondVertex: number, triangles: number[] }>()
  for (let index = 0; index < triangleCount; index += 1) {
    const indexes = mesh.triangles[index]!.vertexIndexes
    triangleVertices[index * 3] = indexes[0]
    triangleVertices[index * 3 + 1] = indexes[1]
    triangleVertices[index * 3 + 2] = indexes[2]
    for (const [left, right] of [[indexes[0], indexes[1]], [indexes[1], indexes[2]], [indexes[2], indexes[0]]] as const) {
      const firstVertex = Math.min(left, right)
      const secondVertex = Math.max(left, right)
      const key = `${firstVertex}:${secondVertex}`
      const edge = meshEdgeMap.get(key)
      if (edge == null) meshEdgeMap.set(key, { firstVertex, secondVertex, triangles: [index] })
      else edge.triangles.push(index)
    }
  }
  const meshEdges = [...meshEdgeMap.values()]

  const positionX = new Float32Array(primitiveCount)
  const positionY = new Float32Array(primitiveCount)
  const positionZ = new Float32Array(primitiveCount)
  const scaleX = new Float32Array(primitiveCount)
  const scaleY = new Float32Array(primitiveCount)
  const scaleZ = new Float32Array(primitiveCount)
  const minimumScale = new Float32Array(primitiveCount)
  const shape = new Uint8Array(primitiveCount)
  const inverseCosX = new Float32Array(primitiveCount)
  const inverseSinX = new Float32Array(primitiveCount)
  const inverseCosY = new Float32Array(primitiveCount)
  const inverseSinY = new Float32Array(primitiveCount)
  const inverseCosZ = new Float32Array(primitiveCount)
  const inverseSinZ = new Float32Array(primitiveCount)
  const primitiveIndexesById = new Map<string, number>()

  const materialIds = [...new Set([
    ...primitives.map(primitive => primitive.materialId),
    ...(options.markings ?? []).map(marking => marking.materialId)
  ])]
  const materialIndexes = new Map(materialIds.map((materialId, index) => [materialId, index]))
  const primitiveMaterialIndexes = new Int16Array(primitiveCount)
  for (let index = 0; index < primitiveCount; index += 1) {
    const primitive = primitives[index]!
    const rotation = primitive.rotation ?? { x: 0, y: 0, z: 0 }
    primitiveIndexesById.set(primitive.id, index)
    positionX[index] = primitive.position.x
    positionY[index] = primitive.position.y
    positionZ[index] = primitive.position.z
    scaleX[index] = primitive.scale.x
    scaleY[index] = primitive.scale.y
    scaleZ[index] = primitive.scale.z
    minimumScale[index] = Math.min(primitive.scale.x, primitive.scale.y, primitive.scale.z)
    shape[index] = primitive.shape === 'cone' ? 1 : 0
    inverseCosX[index] = Math.cos(-rotation.x)
    inverseSinX[index] = Math.sin(-rotation.x)
    inverseCosY[index] = Math.cos(-rotation.y)
    inverseSinY[index] = Math.sin(-rotation.y)
    inverseCosZ[index] = Math.cos(-rotation.z)
    inverseSinZ[index] = Math.sin(-rotation.z)
    primitiveMaterialIndexes[index] = materialIndexes.get(primitive.materialId) ?? -1
  }
  const triangleOwnerCandidateStarts = new Int32Array(triangleCount + 1)
  const triangleOwnerCandidateList: number[] = []
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    triangleOwnerCandidateStarts[triangleIndex] = triangleOwnerCandidateList.length
    for (const primitiveId of mesh.triangles[triangleIndex]!.ownerPrimitiveIds) {
      const primitiveIndex = primitiveIndexesById.get(primitiveId)
      if (primitiveIndex != null) triangleOwnerCandidateList.push(primitiveIndex)
    }
  }
  triangleOwnerCandidateStarts[triangleCount] = triangleOwnerCandidateList.length
  const triangleOwnerCandidates = Int16Array.from(triangleOwnerCandidateList)
  const trianglePrimitiveIndexes = new Int16Array(triangleCount)
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    trianglePrimitiveIndexes[triangleIndex] = primitiveIndexesById.get(mesh.triangles[triangleIndex]!.primitiveId) ?? -1
  }

  let surfaceTrianglesById = compiledSurfaceTrianglesCache.get(mesh)
  if (surfaceTrianglesById == null) {
    const mutableTrianglesById = new Map<string, number[]>()
    for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
      for (const primitiveId of mesh.triangles[triangleIndex]!.ownerPrimitiveIds) {
        let triangles = mutableTrianglesById.get(primitiveId)
        if (triangles == null) {
          triangles = []
          mutableTrianglesById.set(primitiveId, triangles)
        }
        triangles.push(triangleIndex)
      }
    }
    surfaceTrianglesById = mutableTrianglesById
    compiledSurfaceTrianglesCache.set(mesh, surfaceTrianglesById)
  }
  const surfaceTrianglesByPrimitive = primitives.map(primitive => (
    surfaceTrianglesById.get(primitive.id) ?? []
  ))

  const writeLocalPoint = (
    primitiveIndex: number,
    x: number,
    y: number,
    z: number,
    output: Float64Array
) => {
    const relativeX = x - positionX[primitiveIndex]!
    const relativeY = y - positionY[primitiveIndex]!
    const relativeZ = z - positionZ[primitiveIndex]!
    const zX = relativeX * inverseCosZ[primitiveIndex]! - relativeY * inverseSinZ[primitiveIndex]!
    const zY = relativeX * inverseSinZ[primitiveIndex]! + relativeY * inverseCosZ[primitiveIndex]!
    const yX = zX * inverseCosY[primitiveIndex]! + relativeZ * inverseSinY[primitiveIndex]!
    const yZ = relativeZ * inverseCosY[primitiveIndex]! - zX * inverseSinY[primitiveIndex]!
    output[0] = yX
    output[1] = zY * inverseCosX[primitiveIndex]! - yZ * inverseSinX[primitiveIndex]!
    output[2] = zY * inverseSinX[primitiveIndex]! + yZ * inverseCosX[primitiveIndex]!
  }

  const surfaceCoordinatesByPrimitiveSide = new Map<string, {
    readonly binMinX: number
    readonly binMinY: number
    readonly binScaleX: number
    readonly binScaleY: number
    readonly frontDepth: Float32Array
    readonly triangleBins: readonly number[][]
    readonly x: Float32Array
    readonly y: Float32Array
  }>()
  let surfaceAnchorsForMesh = compiledSurfaceAnchorCache.get(mesh)
  if (surfaceAnchorsForMesh == null) {
    surfaceAnchorsForMesh = new Map()
    compiledSurfaceAnchorCache.set(mesh, surfaceAnchorsForMesh)
  }
  const getSurfaceCoordinates = (
    primitiveIndex: number,
    side: CompiledAvatarSurfaceMarking['side']
  ) => {
    const key = `${primitiveIndex}:${side ?? 'front'}`
    const cached = surfaceCoordinatesByPrimitiveSide.get(key)
    if (cached != null) return cached
    const primitive = primitives[primitiveIndex]!
    if (primitive.productionShape == null) return null
    const coordinates = {
      binMinX: 0,
      binMinY: 0,
      binScaleX: 0,
      binScaleY: 0,
      frontDepth: new Float32Array(vertexCount),
      triangleBins: [] as number[][],
      x: new Float32Array(vertexCount),
      y: new Float32Array(vertexCount)
    }
    const local = new Float64Array(3)
    const surfaceTriangles = surfaceTrianglesByPrimitive[primitiveIndex]!
    const mappedVertices = new Uint8Array(vertexCount)
    for (const triangleIndex of surfaceTriangles) {
      const offset = triangleIndex * 3
      for (let vertexOffset = 0; vertexOffset < 3; vertexOffset += 1) {
        const vertexIndex = triangleVertices[offset + vertexOffset]!
        if (mappedVertices[vertexIndex] === 1) continue
        mappedVertices[vertexIndex] = 1
        writeLocalPoint(
          primitiveIndex,
          vertexX[vertexIndex]!,
          vertexY[vertexIndex]!,
          vertexZ[vertexIndex]!,
          local
        )
        const mapped = mapAvatarPrimitiveLocalPointToAuthoredSurface(
          primitive.productionShape,
          {
            x: local[0]! / scaleX[primitiveIndex]!,
            y: local[1]! / scaleY[primitiveIndex]!,
            z: local[2]! / scaleZ[primitiveIndex]!
          },
          side ?? 'front',
          {
            bottomTaper: primitive.bottomTaper,
            cutAngle: primitive.cutAngle,
            roundness: primitive.roundness,
            topScale: primitive.topScale
          }
        )
        coordinates.x[vertexIndex] = mapped.x
        coordinates.y[vertexIndex] = mapped.y
        coordinates.frontDepth[vertexIndex] = mapped.frontDepth
      }
    }
    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    for (const triangleIndex of surfaceTriangles) {
      const offset = triangleIndex * 3
      for (let vertexOffset = 0; vertexOffset < 3; vertexOffset += 1) {
        const vertexIndex = triangleVertices[offset + vertexOffset]!
        if (coordinates.frontDepth[vertexIndex]! <= 0) continue
        minX = Math.min(minX, coordinates.x[vertexIndex]!)
        maxX = Math.max(maxX, coordinates.x[vertexIndex]!)
        minY = Math.min(minY, coordinates.y[vertexIndex]!)
        maxY = Math.max(maxY, coordinates.y[vertexIndex]!)
      }
    }
    if (!Number.isFinite(minX)) return null
    const binScaleX = SURFACE_ANCHOR_BIN_COUNT / Math.max(maxX - minX, 1e-6)
    const binScaleY = SURFACE_ANCHOR_BIN_COUNT / Math.max(maxY - minY, 1e-6)
    const triangleBins = Array.from(
      { length: SURFACE_ANCHOR_BIN_COUNT * SURFACE_ANCHOR_BIN_COUNT },
      () => [] as number[]
    )
    const binX = (value: number) => clamp(
      Math.floor((value - minX) * binScaleX),
      0,
      SURFACE_ANCHOR_BIN_COUNT - 1
    )
    const binY = (value: number) => clamp(
      Math.floor((value - minY) * binScaleY),
      0,
      SURFACE_ANCHOR_BIN_COUNT - 1
    )
    for (const triangleIndex of surfaceTriangles) {
      const offset = triangleIndex * 3
      const first = triangleVertices[offset]!
      const second = triangleVertices[offset + 1]!
      const third = triangleVertices[offset + 2]!
      if (Math.max(
        coordinates.frontDepth[first]!,
        coordinates.frontDepth[second]!,
        coordinates.frontDepth[third]!
      ) <= 0) continue
      const firstBinX = binX(Math.min(
        coordinates.x[first]!,
        coordinates.x[second]!,
        coordinates.x[third]!
      ))
      const lastBinX = binX(Math.max(
        coordinates.x[first]!,
        coordinates.x[second]!,
        coordinates.x[third]!
      ))
      const firstBinY = binY(Math.min(
        coordinates.y[first]!,
        coordinates.y[second]!,
        coordinates.y[third]!
      ))
      const lastBinY = binY(Math.max(
        coordinates.y[first]!,
        coordinates.y[second]!,
        coordinates.y[third]!
      ))
      for (let y = firstBinY; y <= lastBinY; y += 1) {
        for (let x = firstBinX; x <= lastBinX; x += 1) {
          triangleBins[y * SURFACE_ANCHOR_BIN_COUNT + x]!.push(triangleIndex)
        }
      }
    }
    coordinates.binMinX = minX
    coordinates.binMinY = minY
    coordinates.binScaleX = binScaleX
    coordinates.binScaleY = binScaleY
    coordinates.triangleBins = triangleBins
    surfaceCoordinatesByPrimitiveSide.set(key, coordinates)
    return coordinates
  }

  const resolveSurfaceAnchors = (
    primitiveIndex: number,
    marking: CompiledAvatarSurfaceMarking,
    boundaryX: Float32Array | null,
    boundaryY: Float32Array | null
  ): readonly PreparedSurfaceAnchor[] | null => {
    if (boundaryX == null || boundaryY == null || boundaryX.length < 3) return null
    const anchorCacheKey = `${marking.targetPrimitiveId}:${marking.side ?? 'front'}:` + (
      marking.cacheKey ?? `${marking.id}:${[...boundaryX].join(',')}:${[...boundaryY].join(',')}`
    )
    if (surfaceAnchorsForMesh.has(anchorCacheKey)) {
      return surfaceAnchorsForMesh.get(anchorCacheKey) ?? null
    }
    const surfaceCoordinates = getSurfaceCoordinates(primitiveIndex, marking.side)
    if (surfaceCoordinates == null) return null
    const anchors: PreparedSurfaceAnchor[] = []
    const lastBoundaryIndex = boundaryX.length - 1
    const boundaryPointCount = Math.hypot(
      boundaryX[lastBoundaryIndex]! - boundaryX[0]!,
      boundaryY[lastBoundaryIndex]! - boundaryY[0]!
    ) < 1e-6
      ? boundaryX.length - 1
      : boundaryX.length
    if (boundaryPointCount < 3) return null
    for (let boundaryIndex = 0; boundaryIndex < boundaryPointCount; boundaryIndex += 1) {
      const targetX = boundaryX[boundaryIndex]!
      const targetY = boundaryY[boundaryIndex]!
      const targetBinX = clamp(
        Math.floor((targetX - surfaceCoordinates.binMinX) * surfaceCoordinates.binScaleX),
        0,
        SURFACE_ANCHOR_BIN_COUNT - 1
      )
      const targetBinY = clamp(
        Math.floor((targetY - surfaceCoordinates.binMinY) * surfaceCoordinates.binScaleY),
        0,
        SURFACE_ANCHOR_BIN_COUNT - 1
      )
      const targetBinIndex = targetBinY * SURFACE_ANCHOR_BIN_COUNT + targetBinX
      const localCandidates = Number.isFinite(targetBinIndex)
        ? surfaceCoordinates.triangleBins[targetBinIndex]
        : undefined
      const candidates = localCandidates == null || localCandidates.length === 0
        ? surfaceTrianglesByPrimitive[primitiveIndex]!
        : localCandidates
      let selectedTriangle = -1
      let selectedWeightA = 0
      let selectedWeightB = 0
      let selectedWeightC = 0
      let selectedScore = Number.NEGATIVE_INFINITY
      let selectedFrontDepth = Number.NEGATIVE_INFINITY
      for (const triangleIndex of candidates) {
        const offset = triangleIndex * 3
        const first = triangleVertices[offset]!
        const second = triangleVertices[offset + 1]!
        const third = triangleVertices[offset + 2]!
        const firstX = surfaceCoordinates.x[first]!
        const firstY = surfaceCoordinates.y[first]!
        const secondX = surfaceCoordinates.x[second]!
        const secondY = surfaceCoordinates.y[second]!
        const thirdX = surfaceCoordinates.x[third]!
        const thirdY = surfaceCoordinates.y[third]!
        const denominator = (secondY - thirdY) * (firstX - thirdX)
          + (thirdX - secondX) * (firstY - thirdY)
        if (Math.abs(denominator) < 1e-10) continue
        const weightA = ((secondY - thirdY) * (targetX - thirdX)
          + (thirdX - secondX) * (targetY - thirdY)) / denominator
        const weightB = ((thirdY - firstY) * (targetX - thirdX)
          + (firstX - thirdX) * (targetY - thirdY)) / denominator
        const weightC = 1 - weightA - weightB
        const score = Math.min(weightA, weightB, weightC)
        if (score < -.025) continue
        const frontDepth = surfaceCoordinates.frontDepth[first]! * weightA
          + surfaceCoordinates.frontDepth[second]! * weightB
          + surfaceCoordinates.frontDepth[third]! * weightC
        if (frontDepth <= 0 || score < selectedScore
          || (score === selectedScore && frontDepth <= selectedFrontDepth)) continue
        selectedTriangle = triangleIndex
        selectedWeightA = weightA
        selectedWeightB = weightB
        selectedWeightC = weightC
        selectedScore = score
        selectedFrontDepth = frontDepth
      }
      if (selectedTriangle < 0) {
        surfaceAnchorsForMesh.set(anchorCacheKey, null)
        return null
      }
      const offset = selectedTriangle * 3
      const first = triangleVertices[offset]!
      const second = triangleVertices[offset + 1]!
      const third = triangleVertices[offset + 2]!
      const previousIndex = (boundaryIndex + boundaryPointCount - 1) % boundaryPointCount
      const nextIndex = (boundaryIndex + 1) % boundaryPointCount
      const incomingX = targetX - boundaryX[previousIndex]!
      const incomingY = targetY - boundaryY[previousIndex]!
      const outgoingX = boundaryX[nextIndex]! - targetX
      const outgoingY = boundaryY[nextIndex]! - targetY
      const incomingLength = Math.hypot(incomingX, incomingY) || 1
      const outgoingLength = Math.hypot(outgoingX, outgoingY) || 1
      const tangentDot = (incomingX * outgoingX + incomingY * outgoingY)
        / (incomingLength * outgoingLength)
      const anchorX = vertexX[first]! * selectedWeightA + vertexX[second]! * selectedWeightB
        + vertexX[third]! * selectedWeightC
      const anchorY = vertexY[first]! * selectedWeightA + vertexY[second]! * selectedWeightB
        + vertexY[third]! * selectedWeightC
      const anchorZ = vertexZ[first]! * selectedWeightA + vertexZ[second]! * selectedWeightB
        + vertexZ[third]! * selectedWeightC
      let anchorNormalX = normalX[first]! * selectedWeightA + normalX[second]! * selectedWeightB
        + normalX[third]! * selectedWeightC
      let anchorNormalY = normalY[first]! * selectedWeightA + normalY[second]! * selectedWeightB
        + normalY[third]! * selectedWeightC
      let anchorNormalZ = normalZ[first]! * selectedWeightA + normalZ[second]! * selectedWeightB
        + normalZ[third]! * selectedWeightC
      // Marching-cubes winding is an implementation detail; normalize every
      // cached surface anchor to the semantic primitive's outward direction
      // before view-space horizon clipping.
      if (anchorNormalX * (anchorX - positionX[primitiveIndex]!)
          + anchorNormalY * (anchorY - positionY[primitiveIndex]!)
          + anchorNormalZ * (anchorZ - positionZ[primitiveIndex]!) < 0) {
        anchorNormalX *= -1
        anchorNormalY *= -1
        anchorNormalZ *= -1
      }
      anchors.push({
        featureCorner: tangentDot < .72,
        normalX: anchorNormalX,
        normalY: anchorNormalY,
        normalZ: anchorNormalZ,
        x: anchorX,
        y: anchorY,
        z: anchorZ
      })
    }
    surfaceAnchorsForMesh.set(anchorCacheKey, anchors)
    return anchors
  }

  const preparedMarkings = Array.from({ length: primitiveCount }, () => [] as PreparedMarking[])
  for (const marking of options.markings ?? []) {
    const primitiveIndex = primitiveIndexesById.get(marking.targetPrimitiveId)
    if (primitiveIndex == null) continue
    const primitive = primitives[primitiveIndex]!
    const productionSpec = primitive.productionShape == null
      ? null
      : getAvatarBodyCompilerShapeSpec(primitive.productionShape)
    const rotation = marking.rotation ?? 0
    const boundaryX = marking.boundary == null
      ? null
      : Float32Array.from(marking.boundary, point => point.x)
    const boundaryY = marking.boundary == null
      ? null
      : Float32Array.from(marking.boundary, point => point.y)
    const boundaryMinY = marking.bounds?.minY ?? (
      boundaryY == null ? Number.NEGATIVE_INFINITY : Math.min(...boundaryY)
    )
    const boundaryMaxY = marking.bounds?.maxY ?? (
      boundaryY == null ? Number.POSITIVE_INFINITY : Math.max(...boundaryY)
    )
    const segmentBins = createMarkingSegmentBins(
      boundaryX,
      boundaryY,
      boundaryMinY,
      boundaryMaxY
    )
    const surfaceAnchors = marking.coverage === 'target-surface'
      ? null
      : resolveSurfaceAnchors(primitiveIndex, marking, boundaryX, boundaryY)
    preparedMarkings[primitiveIndex]!.push({
      area: marking.area ?? marking.radii.x * marking.radii.y,
      authoredSurfaceMapping: marking.surfaceMapping === 'avatar-authored-v1' ? 1 : 0,
      boundaryX,
      boundaryY,
      centerX: marking.center.x,
      centerY: marking.center.y,
      coordinateSpace: marking.coordinateSpace === 'object' ? 1 : 0,
      cosRotation: Math.cos(rotation),
      coversTargetSurface: marking.coverage === 'target-surface' ? 1 : 0,
      frontSpace: (marking.frontSpace ?? marking.coordinateSpace) === 'object' ? 1 : 0,
      halfConeCutAngle: (primitive.cutAngle ?? 0) * Math.PI / 180,
      halfConeRadiusExponent: 1 + (.56 - 1) * Math.max(0, Math.min(primitive.roundness ?? 24, 100)) / 100,
      halfConeSurface: productionSpec?.profile === 'half-cone' ? 1 : 0,
      materialIndex: materialIndexes.get(marking.materialId) ?? -1,
      maxX: marking.bounds?.maxX ?? Number.POSITIVE_INFINITY,
      maxY: marking.bounds?.maxY ?? Number.POSITIVE_INFINITY,
      minX: marking.bounds?.minX ?? Number.NEGATIVE_INFINITY,
      minY: marking.bounds?.minY ?? Number.NEGATIVE_INFINITY,
      radiusX: marking.radii.x,
      radiusXToZ: productionSpec == null ? 1 : productionSpec.radiusX / productionSpec.radiusZ,
      radiusY: marking.radii.y,
      radiusZToX: productionSpec == null ? 1 : productionSpec.radiusZ / productionSpec.radiusX,
      segmentBinIndexes: segmentBins?.indexes ?? null,
      segmentBinMinY: segmentBins?.minY ?? 0,
      segmentBinScale: segmentBins?.scale ?? 0,
      segmentBinStarts: segmentBins?.starts ?? null,
      side: marking.side === 'back'
        ? 1
        : marking.side === 'left'
          ? 2
          : marking.side === 'right'
            ? 3
            : 0,
      sinRotation: Math.sin(rotation),
      surfaceAnchors,
      surfaceTriangleIndexes: surfaceAnchors == null
        ? null
        : triangulateSurfaceBoundary(boundaryX, boundaryY, surfaceAnchors.length),
      targetPrimitiveIndex: primitiveIndex,
      visibleNormalZ: marking.visibleNormalZ ?? -.05
    })
  }
  const hasPreparedMarkings = preparedMarkings.some(markings => markings.length > 0)

  const depthBuffer = new Float32Array(pixelCount)
  const secondDepthBuffer = new Float32Array(pixelCount)
  const triangleBuffer = new Int32Array(pixelCount)
  const secondTriangleBuffer = new Int32Array(pixelCount)
  const pixelMaterialIndexes = new Int16Array(pixelCount)
  const materialConfidence = new Float32Array(pixelCount)
  const ownerPrimitiveIndexes = new Int16Array(pixelCount)
  const ownerPixelCounts = new Uint32Array(primitiveCount)
  const ownerInteractionVisible = new Uint8Array(primitiveCount)
  const primitiveProjectedAreas = new Float64Array(primitiveCount)
  const ownerConfidence = new Float32Array(pixelCount)

  const visibleTriangles = new Int32Array(triangleCount)
  const visibleTriangleFlags = new Uint8Array(triangleCount)
  const triangleAreas = new Float32Array(triangleCount)
  const triangleMinX = new Int16Array(triangleCount)
  const triangleMaxX = new Int16Array(triangleCount)
  const triangleMinY = new Int16Array(triangleCount)
  const triangleMaxY = new Int16Array(triangleCount)
  const projectedSilhouetteSegments = Array.from(
    { length: primitiveCount },
    () => [] as ProjectedSilhouetteSegment[]
  )

  const materialPaths: Record<string, string> = Object.fromEntries(materialIds.map(materialId => [materialId, '']))
  const includeOwnerPaths = options.includeOwnerPaths ?? false
  const ownerPaths: Record<string, string> = Object.fromEntries(primitiveIds.map(primitiveId => [primitiveId, '']))
  const metrics: OptimizedCompiledAvatarProjectionMetrics = {
    binCullMs: 0,
    candidateTestsAfter: 0,
    candidateTestsBefore: 0,
    coloredPixelCount: 0,
    contourMs: 0,
    contourCurveSegmentCount: 0,
    contourLineSegmentCount: 0,
    contourMaxCurveError: 0,
    contourSharedCurveReuseCount: 0,
    contourSegmentCount: 0,
    depthOwnerMs: 0,
    dirtyTileCount: tileCount,
    fullContourFallback: true,
    pathCharacterCount: 0,
    pathCount: 0,
    pathSerializationMs: 0,
    projectMs: 0,
    rasterizedTriangleCount: 0,
    nullOwnerPixelCount: 0,
    transformMs: 0
  }
  const projection: OptimizedCompiledAvatarProjection = {
    getSelectionOverlay: primitiveId => getSelectionOverlay(primitiveId),
    height,
    materialIds,
    materialPaths,
    metrics,
    ownerPaths,
    ownerPrimitiveIndexes,
    pixelMaterialIndexes,
    primitiveIds,
    resolveFrontmostPrimitiveId: (x, y) => resolveFrontmostPrimitiveId(x, y),
    width
  }

  const localPointBuffer = new Float64Array(3)
  let lastProjectedPoseKey = ''
  const writePrimitiveLocal = (primitiveIndex: number, x: number, y: number, z: number) => {
    writeLocalPoint(primitiveIndex, x, y, z, localPointBuffer)
  }

  const primitiveDistance = (primitiveIndex: number, x: number, y: number, z: number) => {
    if (primitives[primitiveIndex]!.productionShape != null) {
      return compiledAvatarPrimitiveDistance(primitives[primitiveIndex]!, { x, y, z })
    }
    writePrimitiveLocal(primitiveIndex, x, y, z)
    const localX = localPointBuffer[0]! / scaleX[primitiveIndex]!
    const localY = localPointBuffer[1]! / scaleY[primitiveIndex]!
    const localZ = localPointBuffer[2]! / scaleZ[primitiveIndex]!
    if (shape[primitiveIndex] === 1) {
      const radiusAtZ = clamp((1 - localZ) / 2, 0, 1)
      const sideDistance = Math.hypot(localX, localY) - radiusAtZ
      const capDistance = Math.max(-1 - localZ, localZ - 1)
      return Math.max(sideDistance, capDistance) * minimumScale[primitiveIndex]!
    }
    return (Math.hypot(localX, localY, localZ) - 1) * minimumScale[primitiveIndex]!
  }

  const SELECTION_ISO_LEVELS = [-.55, -.27, 0, .27, .55] as const
  const selectionSegmentsByPrimitive = new Array<CachedSelectionSegment[] | undefined>(primitiveCount)
  const selectionIntersection = (
    leftVertex: number,
    rightVertex: number,
    leftValue: number,
    rightValue: number,
    level: number
  ) => {
    const leftDelta = leftValue - level
    const rightDelta = rightValue - level
    if (Math.abs(leftDelta) < 1e-8 && Math.abs(rightDelta) < 1e-8) return null
    if ((leftDelta > 0 && rightDelta > 0) || (leftDelta < 0 && rightDelta < 0)) return null
    const progress = clamp(leftDelta / (leftDelta - rightDelta || 1), 0, 1)
    return { leftVertex, progress, rightVertex }
  }
  const getSelectionSegments = (primitiveIndex: number) => {
    const cached = selectionSegmentsByPrimitive[primitiveIndex]
    if (cached != null) return cached
    const segments: CachedSelectionSegment[] = []
    const triangleLocalCoordinates = new Float64Array(9)
    for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
      if (trianglePrimitiveIndexes[triangleIndex] !== primitiveIndex) continue
      const offset = triangleIndex * 3
      const indexes = [
        triangleVertices[offset]!,
        triangleVertices[offset + 1]!,
        triangleVertices[offset + 2]!
      ] as const
      for (let vertexOffset = 0; vertexOffset < 3; vertexOffset += 1) {
        const vertexIndex = indexes[vertexOffset]!
        writePrimitiveLocal(
          primitiveIndex,
          vertexX[vertexIndex]!,
          vertexY[vertexIndex]!,
          vertexZ[vertexIndex]!
        )
        triangleLocalCoordinates[vertexOffset * 3] = localPointBuffer[0]! / scaleX[primitiveIndex]!
        triangleLocalCoordinates[vertexOffset * 3 + 1] = localPointBuffer[1]! / scaleY[primitiveIndex]!
        triangleLocalCoordinates[vertexOffset * 3 + 2] = localPointBuffer[2]! / scaleZ[primitiveIndex]!
      }
      for (const axis of [0, 1] as const) {
        for (const level of SELECTION_ISO_LEVELS) {
          const intersections = [
            selectionIntersection(
              indexes[0], indexes[1],
              triangleLocalCoordinates[axis]!, triangleLocalCoordinates[3 + axis]!, level
            ),
            selectionIntersection(
              indexes[1], indexes[2],
              triangleLocalCoordinates[3 + axis]!, triangleLocalCoordinates[6 + axis]!, level
            ),
            selectionIntersection(
              indexes[2], indexes[0],
              triangleLocalCoordinates[6 + axis]!, triangleLocalCoordinates[axis]!, level
            )
          ].filter(intersection => intersection != null)
          if (intersections.length < 2) continue
          const start = intersections[0]!
          const end = intersections.find(candidate => (
            candidate.leftVertex !== start.leftVertex
            || candidate.rightVertex !== start.rightVertex
            || Math.abs(candidate.progress - start.progress) > 1e-6
          ))
          if (end == null) continue
          segments.push({
            endLeftVertex: end.leftVertex,
            endProgress: end.progress,
            endRightVertex: end.rightVertex,
            startLeftVertex: start.leftVertex,
            startProgress: start.progress,
            startRightVertex: start.rightVertex,
            triangleIndex
          })
        }
      }
    }
    selectionSegmentsByPrimitive[primitiveIndex] = segments
    return segments
  }

  const selectionOverlayCache = new Map<string, OptimizedCompiledAvatarSelectionOverlay>()
  const emptySelectionOverlay = (primitiveId: string): OptimizedCompiledAvatarSelectionOverlay => ({
    contourPath: '',
    gridPath: '',
    gridSegmentCount: 0,
    rawVisiblePixelCount: 0,
    primitiveId,
    visibleRatio: 0,
    visiblePixelCount: 0
  })
  const projectedEdgePoint = (leftVertex: number, rightVertex: number, progress: number) => ({
    x: projectedX[leftVertex]! + (projectedX[rightVertex]! - projectedX[leftVertex]!) * progress,
    y: projectedY[leftVertex]! + (projectedY[rightVertex]! - projectedY[leftVertex]!) * progress
  })
  const ownerAt = (x: number, y: number) => {
    const rasterX = Math.floor(x)
    const rasterY = Math.floor(y)
    if (rasterX < 0 || rasterY < 0 || rasterX >= width || rasterY >= height) return -1
    return ownerPrimitiveIndexes[rasterY * width + rasterX] ?? -1
  }
  const getSelectionOverlay = (primitiveId: string): OptimizedCompiledAvatarSelectionOverlay => {
    const cached = selectionOverlayCache.get(primitiveId)
    if (cached != null) return cached
    const primitiveIndex = primitiveIndexesById.get(primitiveId)
    if (primitiveIndex == null) {
      const empty = emptySelectionOverlay(primitiveId)
      selectionOverlayCache.set(primitiveId, empty)
      return empty
    }
    const rawVisiblePixelCount = ownerPixelCounts[primitiveIndex] ?? 0
    const projectedArea = primitiveProjectedAreas[primitiveIndex] ?? 0
    const visibleRatio = projectedArea <= 0 ? 0 : rawVisiblePixelCount / projectedArea
    if (ownerInteractionVisible[primitiveIndex] === 0 || ownerPaths[primitiveId] === '') {
      const hidden = {
        ...emptySelectionOverlay(primitiveId),
        rawVisiblePixelCount,
        visibleRatio
      }
      selectionOverlayCache.set(primitiveId, hidden)
      return hidden
    }
    let gridPath = ''
    let gridSegmentCount = 0
    for (const segment of getSelectionSegments(primitiveIndex)) {
      if (visibleTriangleFlags[segment.triangleIndex] === 0) continue
      const start = projectedEdgePoint(
        segment.startLeftVertex,
        segment.startRightVertex,
        segment.startProgress
      )
      const end = projectedEdgePoint(
        segment.endLeftVertex,
        segment.endRightVertex,
        segment.endProgress
      )
      const middleX = (start.x + end.x) / 2
      const middleY = (start.y + end.y) / 2
      if (ownerAt(start.x, start.y) !== primitiveIndex
        && ownerAt(middleX, middleY) !== primitiveIndex
        && ownerAt(end.x, end.y) !== primitiveIndex) continue
      gridPath += `M${start.x.toFixed(2)} ${start.y.toFixed(2)}L${end.x.toFixed(2)} ${end.y.toFixed(2)}`
      gridSegmentCount += 1
    }
    const overlay: OptimizedCompiledAvatarSelectionOverlay = {
      contourPath: ownerPaths[primitiveId] ?? '',
      gridPath,
      gridSegmentCount,
      rawVisiblePixelCount,
      primitiveId,
      visibleRatio,
      visiblePixelCount: rawVisiblePixelCount
    }
    selectionOverlayCache.set(primitiveId, overlay)
    return overlay
  }
  const resolveFrontmostPrimitiveId = (x: number, y: number) => {
    const owner = ownerAt(x, y)
    return owner < 0 || ownerInteractionVisible[owner] === 0 ? null : primitiveIds[owner] ?? null
  }

  let evaluatedMarkingBoundaryMargin = 1
  const markingMaterialIndex = (
    primitiveIndex: number,
    pointX: number,
    pointY: number,
    pointZ: number,
    interpolatedNormalX: number,
    interpolatedNormalY: number,
    interpolatedNormalZ: number
  ) => {
    evaluatedMarkingBoundaryMargin = 1
    const markings = preparedMarkings[primitiveIndex]!
    if (markings.length === 0) return -1
    writePrimitiveLocal(primitiveIndex, pointX, pointY, pointZ)
    const localX = localPointBuffer[0]! / scaleX[primitiveIndex]!
    const localY = localPointBuffer[1]! / scaleY[primitiveIndex]!
    const localZ = localPointBuffer[2]! / scaleZ[primitiveIndex]!
    const normalLength = Math.hypot(interpolatedNormalX, interpolatedNormalY, interpolatedNormalZ) || 1
    const normalizedNormalZ = interpolatedNormalZ / normalLength
    let selected = -1
    let selectedArea = Number.POSITIVE_INFINITY
    for (let index = 0; index < markings.length; index += 1) {
      const marking = markings[index]!
      const sourceX = marking.coordinateSpace === 1 ? pointX : localX
      const sourceY = marking.coordinateSpace === 1 ? pointY : localY
      const sourceZ = marking.coordinateSpace === 1 ? pointZ : localZ
      const frontSourceX = marking.frontSpace === 1 ? pointX : localX
      const frontSourceZ = marking.frontSpace === 1 ? pointZ : localZ
      let surfaceX = marking.side === 2 ? sourceZ : marking.side === 3 ? -sourceZ : sourceX
      let surfaceY = sourceY
      let frontDepth = marking.side === 1
        ? -frontSourceZ
        : marking.side === 2
          ? -frontSourceX
          : marking.side === 3
            ? frontSourceX
            : frontSourceZ
      if (marking.authoredSurfaceMapping === 1) {
        let authoredX = localX
        let authoredZ = localZ
        if (marking.side === 1) authoredZ = -localZ
        if (marking.side === 2) {
          authoredX = localZ * marking.radiusZToX
          authoredZ = -localX * marking.radiusXToZ
        }
        if (marking.side === 3) {
          authoredX = -localZ * marking.radiusZToX
          authoredZ = localX * marking.radiusXToZ
        }
        if (marking.halfConeSurface === 1) {
          const authoredFrontDepth = authoredX * Math.sin(marking.halfConeCutAngle)
            + authoredZ * Math.cos(marking.halfConeCutAngle)
          const progress = Math.max(0, Math.min((localY + 1) / 2, 1))
          const ringRadius = progress ** marking.halfConeRadiusExponent
          authoredX = ringRadius * Math.sin(
            Math.atan2(authoredX, authoredZ) - marking.halfConeCutAngle
          )
          authoredZ = authoredFrontDepth
        }
        surfaceX = authoredX
        surfaceY = localY
        frontDepth = authoredZ
      }
      const deltaX = surfaceX - marking.centerX
      const deltaY = surfaceY - marking.centerY
      const normalizedX = (deltaX * marking.cosRotation + deltaY * marking.sinRotation) / marking.radiusX
      const normalizedY = (-deltaX * marking.sinRotation + deltaY * marking.cosRotation) / marking.radiusY
      let boundaryMargin = 1
      let inside = false
      if (marking.boundaryX == null || marking.boundaryY == null) {
        const radius = Math.hypot(normalizedX, normalizedY)
        inside = radius <= 1
        boundaryMargin = Math.abs(1 - radius) * Math.min(marking.radiusX, marking.radiusY)
      }
      if (marking.boundaryX != null && marking.boundaryY != null) {
        const outsideX = Math.max(marking.minX - surfaceX, 0, surfaceX - marking.maxX)
        const outsideY = Math.max(marking.minY - surfaceY, 0, surfaceY - marking.maxY)
        const outsideBoundsDistance = Math.hypot(outsideX, outsideY)
        if (outsideBoundsDistance > MARKING_BOUNDARY_DISTANCE_BAND) {
          evaluatedMarkingBoundaryMargin = Math.min(
            evaluatedMarkingBoundaryMargin,
            outsideBoundsDistance
          )
          continue
        }
        let minimumDistanceSquared = Number.POSITIVE_INFINITY
        const segmentBin = Math.max(0, Math.min(
          MARKING_SEGMENT_BIN_COUNT - 1,
          Math.floor((surfaceY - marking.segmentBinMinY) * marking.segmentBinScale)
        ))
        const firstSegmentOffset = marking.segmentBinStarts?.[segmentBin] ?? 0
        const lastSegmentOffset = marking.segmentBinStarts?.[segmentBin + 1]
          ?? marking.boundaryX.length
        for (let segmentOffset = firstSegmentOffset; segmentOffset < lastSegmentOffset; segmentOffset += 1) {
          const pointIndex = marking.segmentBinIndexes?.[segmentOffset] ?? segmentOffset
          const previousIndex = (pointIndex + marking.boundaryX.length - 1) % marking.boundaryX.length
          const boundaryX = marking.boundaryX[pointIndex]!
          const boundaryY = marking.boundaryY[pointIndex]!
          const previousX = marking.boundaryX[previousIndex]!
          const previousY = marking.boundaryY[previousIndex]!
          if ((boundaryY > surfaceY) !== (previousY > surfaceY)
            && surfaceX < (previousX - boundaryX) * (surfaceY - boundaryY) /
              (previousY - boundaryY) + boundaryX) {
            inside = !inside
          }
          const segmentX = previousX - boundaryX
          const segmentY = previousY - boundaryY
          const lengthSquared = segmentX * segmentX + segmentY * segmentY
          const progress = lengthSquared < 1e-12
            ? 0
            : clamp(
                ((surfaceX - boundaryX) * segmentX + (surfaceY - boundaryY) * segmentY) /
                  lengthSquared,
                0,
                1
              )
          const nearestX = boundaryX + segmentX * progress
          const nearestY = boundaryY + segmentY * progress
          const distanceSquared = (surfaceX - nearestX) ** 2 + (surfaceY - nearestY) ** 2
          minimumDistanceSquared = Math.min(minimumDistanceSquared, distanceSquared)
        }
        boundaryMargin = Number.isFinite(minimumDistanceSquared)
          ? Math.sqrt(minimumDistanceSquared)
          : outsideBoundsDistance
      }
      const facingMargin = Math.abs(frontDepth)
      const normalMargin = Math.abs(normalizedNormalZ - marking.visibleNormalZ)
      evaluatedMarkingBoundaryMargin = Math.min(
        evaluatedMarkingBoundaryMargin,
        boundaryMargin,
        inside ? facingMargin : 1,
        inside ? normalMargin : 1
      )
      if (!inside
        || frontDepth <= 0
        || normalizedNormalZ < marking.visibleNormalZ
        || marking.area >= selectedArea) continue
      selected = marking.materialIndex
      selectedArea = marking.area
    }
    return selected
  }

  const projectSurfaceMarkingPath = (
    marking: PreparedMarking,
    cosYaw: number,
    sinYaw: number,
    cosPitch: number,
    sinPitch: number,
    cosRoll: number,
    sinRoll: number
  ) => {
    const anchors = marking.surfaceAnchors
    if (anchors == null || anchors.length < 3) return null
    type ProjectedMarkingPoint = ContourPoint & {
      readonly anchorIndex: number
      readonly featureCorner: boolean
      readonly key: string
      readonly normalDepth: number
    }
    const transformed: ProjectedMarkingPoint[] = anchors.map((anchor, anchorIndex) => {
      const yawX = anchor.x * cosYaw + anchor.z * sinYaw
      const yawZ = anchor.z * cosYaw - anchor.x * sinYaw
      const pitchY = usesAvatarPoseConvention
        ? anchor.y * cosPitch + yawZ * sinPitch
        : anchor.y * cosPitch - yawZ * sinPitch
      const normalYawZ = anchor.normalZ * cosYaw - anchor.normalX * sinYaw
      const normalDepth = usesAvatarPoseConvention
        ? normalYawZ * cosPitch - anchor.normalY * sinPitch
        : normalYawZ * cosPitch + anchor.normalY * sinPitch
      return {
        anchorIndex,
        featureCorner: anchor.featureCorner,
        key: `v:${anchorIndex}`,
        normalDepth,
        x: centerX + (yawX * cosRoll - pitchY * sinRoll) * worldToPixelScale,
        y: centerY + (yawX * sinRoll + pitchY * cosRoll) * worldToPixelScale
      }
    })
    const minimumNormalDepth = 0
    const allVisible = transformed.every(point => point.normalDepth > minimumNormalDepth)
    const loops: ProjectedMarkingPoint[][] = []
    if (allVisible && marking.surfaceTriangleIndexes != null) {
      loops.push(transformed)
    } else if (allVisible) {
      return null
    } else {
      const triangleIndexes = marking.surfaceTriangleIndexes
      // Self-intersecting asset silhouettes cannot be safely ear-clipped. Keep
      // their already owner-bound continuous material contour rather than
      // flattening multiple visible runs into one synthetic screen polygon.
      if (triangleIndexes == null) return null
      interface BoundaryEdge {
        readonly end: ProjectedMarkingPoint
        readonly start: ProjectedMarkingPoint
      }
      const boundaryEdges = new Map<string, BoundaryEdge>()
      const isAuthoredBoundaryEdge = (left: number, right: number) => {
        const distance = Math.abs(left - right)
        return distance === 1 || distance === transformed.length - 1
      }
      const horizonIntersection = (
        start: ProjectedMarkingPoint,
        end: ProjectedMarkingPoint
      ): ProjectedMarkingPoint => {
        const progress = clamp(
          (minimumNormalDepth - start.normalDepth) / (end.normalDepth - start.normalDepth || 1),
          0,
          1
        )
        // Reuse an authored vertex that lies exactly on the horizon. Giving
        // the same point a different edge-pair key on each adjacent triangle
        // disconnects the clipped boundary loop at yaw/pitch degeneracies.
        if (progress <= 1e-7) return start
        if (progress >= 1 - 1e-7) return end
        const firstIndex = Math.min(start.anchorIndex, end.anchorIndex)
        const secondIndex = Math.max(start.anchorIndex, end.anchorIndex)
        return {
          anchorIndex: -1,
          featureCorner: isAuthoredBoundaryEdge(start.anchorIndex, end.anchorIndex),
          key: `h:${firstIndex}:${secondIndex}`,
          normalDepth: minimumNormalDepth,
          x: start.x + (end.x - start.x) * progress,
          y: start.y + (end.y - start.y) * progress
        }
      }
      const addBoundaryEdge = (start: ProjectedMarkingPoint, end: ProjectedMarkingPoint) => {
        if (start.key === end.key) return
        const reverseKey = `${end.key}>${start.key}`
        if (boundaryEdges.delete(reverseKey)) return
        boundaryEdges.set(`${start.key}>${end.key}`, { end, start })
      }
      for (let offset = 0; offset < triangleIndexes.length; offset += 3) {
        const triangle = [
          transformed[triangleIndexes[offset]!]!,
          transformed[triangleIndexes[offset + 1]!]!,
          transformed[triangleIndexes[offset + 2]!]!
        ]
        const clipped: ProjectedMarkingPoint[] = []
        for (let vertexOffset = 0; vertexOffset < triangle.length; vertexOffset += 1) {
          const previous = triangle[(vertexOffset + triangle.length - 1) % triangle.length]!
          const current = triangle[vertexOffset]!
          const previousVisible = previous.normalDepth > minimumNormalDepth
          const currentVisible = current.normalDepth > minimumNormalDepth
          if (previousVisible !== currentVisible) {
            clipped.push(horizonIntersection(previous, current))
          }
          if (currentVisible) clipped.push(current)
        }
        if (clipped.length < 3) continue
        for (let edgeIndex = 0; edgeIndex < clipped.length; edgeIndex += 1) {
          addBoundaryEdge(clipped[edgeIndex]!, clipped[(edgeIndex + 1) % clipped.length]!)
        }
      }
      const outgoing = new Map<string, BoundaryEdge[]>()
      for (const edge of boundaryEdges.values()) {
        const edges = outgoing.get(edge.start.key)
        if (edges == null) outgoing.set(edge.start.key, [edge])
        else edges.push(edge)
      }
      const unused = new Set(boundaryEdges.values())
      while (unused.size > 0) {
        const firstEdge = unused.values().next().value as BoundaryEdge | undefined
        if (firstEdge == null) break
        const loop: ProjectedMarkingPoint[] = [firstEdge.start]
        let edge: BoundaryEdge | undefined = firstEdge
        let guard = boundaryEdges.size + 1
        while (edge != null && guard > 0) {
          unused.delete(edge)
          if (edge.end.key === firstEdge.start.key) break
          loop.push(edge.end)
          edge = outgoing.get(edge.end.key)?.find(candidate => unused.has(candidate))
          guard -= 1
        }
        if (edge?.end.key === firstEdge.start.key && loop.length >= 3) loops.push(loop)
      }
    }
    if (loops.length === 0) return { maxError: 0, path: '', segmentCount: 0 }

    let path = ''
    let segmentCount = 0
    let maxError = 0
    for (const visible of loops) {
      const cornerIndexes = visible
        .map((point, index) => point.featureCorner ? index : -1)
        .filter(index => index >= 0)
      if (cornerIndexes.length === 0) {
        let splitIndex = 1
        let splitDistance = 0
        for (let index = 1; index < visible.length; index += 1) {
          const distance = contourPointDistance(visible[0]!, visible[index]!)
          if (distance <= splitDistance) continue
          splitDistance = distance
          splitIndex = index
        }
        cornerIndexes.push(0, splitIndex)
      }
      cornerIndexes.sort((left, right) => left - right)
      const startIndex = cornerIndexes[0]!
      const rotated = visible.map((_, index) => visible[(startIndex + index) % visible.length]!)
      const rotatedCorners = new Set(cornerIndexes.map(index => (
        (index - startIndex + visible.length) % visible.length
      )))
      const orderedCorners = [...rotatedCorners].sort((left, right) => left - right)
      if (orderedCorners[0] !== 0) orderedCorners.unshift(0)
      let loopPath = `M${rotated[0]!.x.toFixed(2)} ${rotated[0]!.y.toFixed(2)}`
      for (let cornerOffset = 0; cornerOffset < orderedCorners.length; cornerOffset += 1) {
        const runStart = orderedCorners[cornerOffset]!
        const runEnd = cornerOffset + 1 < orderedCorners.length
          ? orderedCorners[cornerOffset + 1]!
          : visible.length
        const run = Array.from({ length: runEnd - runStart + 1 }, (_, offset) => (
          rotated[(runStart + offset) % visible.length]!
        ))
        const fitted = fitContourCubicRun(run, .08)
        maxError = Math.max(maxError, fitted.maxError)
        for (const segment of fitted.segments) {
          loopPath += `C${segment.control1.x.toFixed(2)} ${segment.control1.y.toFixed(2)} `
            + `${segment.control2.x.toFixed(2)} ${segment.control2.y.toFixed(2)} `
            + `${segment.end.x.toFixed(2)} ${segment.end.y.toFixed(2)}`
          segmentCount += 1
        }
      }
      path += `${loopPath}Z`
    }
    return { maxError, path, segmentCount }
  }

  return {
    materialIds,
    project(pose) {
      const poseKey = `${pose.yaw}:${pose.pitch}:${pose.roll}`
      // React StrictMode intentionally invokes memo calculations twice in
      // development. The projector owns reusable typed buffers, so the second
      // identical pose must reuse the already-complete atomic projection
      // instead of doubling the depth/contour hot path.
      if (poseKey === lastProjectedPoseKey) {
        metrics.dirtyTileCount = 0
        return projection
      }
      const startedAt = performance.now()
      const cosYaw = Math.cos(pose.yaw)
      const sinYaw = Math.sin(pose.yaw)
      const cosPitch = Math.cos(pose.pitch)
      const sinPitch = Math.sin(pose.pitch)
      const cosRoll = Math.cos(pose.roll)
      const sinRoll = Math.sin(pose.roll)
      for (let index = 0; index < vertexCount; index += 1) {
        const x = vertexX[index]!
        const y = vertexY[index]!
        const z = vertexZ[index]!
        const yawX = x * cosYaw + z * sinYaw
        const yawZ = z * cosYaw - x * sinYaw
        const pitchY = usesAvatarPoseConvention
          ? y * cosPitch + yawZ * sinPitch
          : y * cosPitch - yawZ * sinPitch
        projectedX[index] = centerX + (yawX * cosRoll - pitchY * sinRoll) * worldToPixelScale
        projectedY[index] = centerY + (yawX * sinRoll + pitchY * cosRoll) * worldToPixelScale
        projectedZ[index] = usesAvatarPoseConvention
          ? yawZ * cosPitch - y * sinPitch
          : yawZ * cosPitch + y * sinPitch
      }
      const transformedAt = performance.now()

      let visibleTriangleCount = 0
      visibleTriangleFlags.fill(0)
      primitiveProjectedAreas.fill(0)
      let candidateTestsBefore = 0
      let visibleMinX = width - 1
      let visibleMaxX = 0
      let visibleMinY = height - 1
      let visibleMaxY = 0
      for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
        const offset = triangleIndex * 3
        const first = triangleVertices[offset]!
        const second = triangleVertices[offset + 1]!
        const third = triangleVertices[offset + 2]!
        const firstX = projectedX[first]!
        const firstY = projectedY[first]!
        const secondX = projectedX[second]!
        const secondY = projectedY[second]!
        const thirdX = projectedX[third]!
        const thirdY = projectedY[third]!
        const area = (thirdX - firstX) * (secondY - firstY) - (thirdY - firstY) * (secondX - firstX)
        if (area >= -1e-6) continue
        const minX = clamp(Math.floor(Math.min(firstX, secondX, thirdX)), 0, width - 1)
        const maxX = clamp(Math.ceil(Math.max(firstX, secondX, thirdX)), 0, width - 1)
        const minY = clamp(Math.floor(Math.min(firstY, secondY, thirdY)), 0, height - 1)
        const maxY = clamp(Math.ceil(Math.max(firstY, secondY, thirdY)), 0, height - 1)
        const visibleIndex = visibleTriangleCount++
        visibleTriangles[visibleIndex] = triangleIndex
        visibleTriangleFlags[triangleIndex] = 1
        triangleAreas[visibleIndex] = area
        const semanticPrimitiveIndex = trianglePrimitiveIndexes[triangleIndex]!
        if (semanticPrimitiveIndex >= 0) {
          primitiveProjectedAreas[semanticPrimitiveIndex]! += Math.abs(area) / 2
        }
        triangleMinX[visibleIndex] = minX
        triangleMaxX[visibleIndex] = maxX
        triangleMinY[visibleIndex] = minY
        triangleMaxY[visibleIndex] = maxY
        visibleMinX = Math.min(visibleMinX, minX)
        visibleMaxX = Math.max(visibleMaxX, maxX)
        visibleMinY = Math.min(visibleMinY, minY)
        visibleMaxY = Math.max(visibleMaxY, maxY)
        candidateTestsBefore += (maxX - minX + 1) * (maxY - minY + 1)
      }
      const visibleBounds = visibleTriangleCount === 0
        ? undefined
        : {
            maxX: Math.min(width - 1, visibleMaxX + 1),
            maxY: Math.min(height - 1, visibleMaxY + 1),
            minX: Math.max(0, visibleMinX - 1),
            minY: Math.max(0, visibleMinY - 1)
          }
      for (const segments of projectedSilhouetteSegments) segments.length = 0
      for (const edge of meshEdges) {
        let frontTriangleIndex = -1
        let frontTriangleCount = 0
        for (const triangleIndex of edge.triangles) {
          if (visibleTriangleFlags[triangleIndex] === 0) continue
          frontTriangleIndex = triangleIndex
          frontTriangleCount += 1
        }
        if (frontTriangleCount !== 1 || frontTriangleIndex < 0) continue
        const primitiveIndex = trianglePrimitiveIndexes[frontTriangleIndex]!
        if (primitiveIndex < 0) continue
        projectedSilhouetteSegments[primitiveIndex]!.push({
          endX: projectedX[edge.secondVertex]!,
          endY: projectedY[edge.secondVertex]!,
          startX: projectedX[edge.firstVertex]!,
          startY: projectedY[edge.firstVertex]!
        })
      }
      const binnedAt = performance.now()

      depthBuffer.fill(Number.NEGATIVE_INFINITY)
      secondDepthBuffer.fill(Number.NEGATIVE_INFINITY)
      triangleBuffer.fill(-1)
      secondTriangleBuffer.fill(-1)
      let candidateTestsAfter = 0
      for (let visibleIndex = 0; visibleIndex < visibleTriangleCount; visibleIndex += 1) {
        const triangleIndex = visibleTriangles[visibleIndex]!
        const offset = triangleIndex * 3
        const first = triangleVertices[offset]!
        const second = triangleVertices[offset + 1]!
        const third = triangleVertices[offset + 2]!
        const firstX = projectedX[first]!
        const firstY = projectedY[first]!
        const secondX = projectedX[second]!
        const secondY = projectedY[second]!
        const thirdX = projectedX[third]!
        const thirdY = projectedY[third]!
        const area = triangleAreas[visibleIndex]!
        const weightAXStep = (thirdY - secondY) / area
        const weightBXStep = (firstY - thirdY) / area
        for (let y = triangleMinY[visibleIndex]!; y <= triangleMaxY[visibleIndex]!; y += 1) {
          const sampleY = y + .5
          let rowMinX = Number.POSITIVE_INFINITY
          let rowMaxX = Number.NEGATIVE_INFINITY
          if (sampleY >= Math.min(firstY, secondY) && sampleY <= Math.max(firstY, secondY) && firstY !== secondY) {
            const intersection = firstX + (secondX - firstX) * (sampleY - firstY) / (secondY - firstY)
            rowMinX = Math.min(rowMinX, intersection)
            rowMaxX = Math.max(rowMaxX, intersection)
          }
          if (sampleY >= Math.min(secondY, thirdY) && sampleY <= Math.max(secondY, thirdY) && secondY !== thirdY) {
            const intersection = secondX + (thirdX - secondX) * (sampleY - secondY) / (thirdY - secondY)
            rowMinX = Math.min(rowMinX, intersection)
            rowMaxX = Math.max(rowMaxX, intersection)
          }
          if (sampleY >= Math.min(thirdY, firstY) && sampleY <= Math.max(thirdY, firstY) && thirdY !== firstY) {
            const intersection = thirdX + (firstX - thirdX) * (sampleY - thirdY) / (firstY - thirdY)
            rowMinX = Math.min(rowMinX, intersection)
            rowMaxX = Math.max(rowMaxX, intersection)
          }
          if (!Number.isFinite(rowMinX)) continue
          const startX = clamp(Math.floor(rowMinX - .5) - 1, triangleMinX[visibleIndex]!, triangleMaxX[visibleIndex]!)
          const endX = clamp(Math.ceil(rowMaxX - .5) + 1, triangleMinX[visibleIndex]!, triangleMaxX[visibleIndex]!)
          const firstSampleX = startX + .5
          let weightA = ((firstSampleX - secondX) * (thirdY - secondY) - (sampleY - secondY) * (thirdX - secondX)) / area
          let weightB = ((firstSampleX - thirdX) * (firstY - thirdY) - (sampleY - thirdY) * (firstX - thirdX)) / area
          for (let x = startX; x <= endX; x += 1) {
            candidateTestsAfter += 1
            const weightC = 1 - weightA - weightB
            if (weightA >= -1e-6 && weightB >= -1e-6 && weightC >= -1e-6) {
              const depth = projectedZ[first]! * weightA + projectedZ[second]! * weightB + projectedZ[third]! * weightC
              const pixelIndex = y * width + x
              const topTriangleIndex = triangleBuffer[pixelIndex]!
              const topPrimitiveIndex = topTriangleIndex < 0 ? -1 : trianglePrimitiveIndexes[topTriangleIndex]!
              const candidatePrimitiveIndex = trianglePrimitiveIndexes[triangleIndex]!
              if (depth > depthBuffer[pixelIndex]! + 1e-5) {
                if (topTriangleIndex >= 0 && topPrimitiveIndex !== candidatePrimitiveIndex
                  && depthBuffer[pixelIndex]! > secondDepthBuffer[pixelIndex]!) {
                  secondDepthBuffer[pixelIndex] = depthBuffer[pixelIndex]!
                  secondTriangleBuffer[pixelIndex] = topTriangleIndex
                }
                depthBuffer[pixelIndex] = depth
                triangleBuffer[pixelIndex] = triangleIndex
              } else if (candidatePrimitiveIndex !== topPrimitiveIndex
                && depth > secondDepthBuffer[pixelIndex]! + 1e-5) {
                secondDepthBuffer[pixelIndex] = depth
                secondTriangleBuffer[pixelIndex] = triangleIndex
              }
            }
            weightA += weightAXStep
            weightB += weightBXStep
          }
        }
      }

      pixelMaterialIndexes.fill(-1)
      materialConfidence.fill(1)
      ownerPrimitiveIndexes.fill(-1)
      ownerPixelCounts.fill(0)
      ownerInteractionVisible.fill(0)
      ownerConfidence.fill(0)
      selectionOverlayCache.clear()
      let coloredPixelCount = 0
      const ownerScanMinX = visibleBounds?.minX ?? 0
      const ownerScanMaxX = visibleBounds?.maxX ?? -1
      const ownerScanMinY = visibleBounds?.minY ?? 0
      const ownerScanMaxY = visibleBounds?.maxY ?? -1
      for (let y = ownerScanMinY; y <= ownerScanMaxY; y += 1) {
        for (let x = ownerScanMinX; x <= ownerScanMaxX; x += 1) {
          const pixelIndex = y * width + x
          const triangleIndex = triangleBuffer[pixelIndex]!
          if (triangleIndex < 0) continue
        let ownerPrimitiveIndex = -1
        let ownerDistance = Number.POSITIVE_INFINITY
        let secondOwnerPrimitiveIndex = -1
        let secondOwnerDistance = Number.POSITIVE_INFINITY
        let markingIndex = -1
        const candidateStart = triangleOwnerCandidateStarts[triangleIndex]!
        const candidateEnd = triangleOwnerCandidateStarts[triangleIndex + 1]!
        if (candidateEnd - candidateStart === 1 && !hasPreparedMarkings) {
          ownerPrimitiveIndex = triangleOwnerCandidates[candidateStart]!
        } else {
          const offset = triangleIndex * 3
          const first = triangleVertices[offset]!
          const second = triangleVertices[offset + 1]!
          const third = triangleVertices[offset + 2]!
          const sampleX = x + .5
          const sampleY = y + .5
          const firstX = projectedX[first]!
          const firstY = projectedY[first]!
          const secondX = projectedX[second]!
          const secondY = projectedY[second]!
          const thirdX = projectedX[third]!
          const thirdY = projectedY[third]!
          const area = (thirdX - firstX) * (secondY - firstY) - (thirdY - firstY) * (secondX - firstX)
          const weightA = ((sampleX - secondX) * (thirdY - secondY) - (sampleY - secondY) * (thirdX - secondX)) / area
          const weightB = ((sampleX - thirdX) * (firstY - thirdY) - (sampleY - thirdY) * (firstX - thirdX)) / area
          const weightC = 1 - weightA - weightB
          const pointX = vertexX[first]! * weightA + vertexX[second]! * weightB + vertexX[third]! * weightC
          const pointY = vertexY[first]! * weightA + vertexY[second]! * weightB + vertexY[third]! * weightC
          const pointZ = vertexZ[first]! * weightA + vertexZ[second]! * weightB + vertexZ[third]! * weightC
          for (let candidateIndex = candidateStart; candidateIndex < candidateEnd; candidateIndex += 1) {
            const primitiveIndex = triangleOwnerCandidates[candidateIndex]!
            const distance = primitiveDistance(primitiveIndex, pointX, pointY, pointZ)
            if (distance < ownerDistance) {
              secondOwnerDistance = ownerDistance
              secondOwnerPrimitiveIndex = ownerPrimitiveIndex
              ownerDistance = distance
              ownerPrimitiveIndex = primitiveIndex
            } else if (distance < secondOwnerDistance) {
              secondOwnerDistance = distance
              secondOwnerPrimitiveIndex = primitiveIndex
            }
          }
          if (hasPreparedMarkings) {
            markingIndex = markingMaterialIndex(
              ownerPrimitiveIndex,
              pointX,
              pointY,
              pointZ,
              normalX[first]! * weightA + normalX[second]! * weightB + normalX[third]! * weightC,
              normalY[first]! * weightA + normalY[second]! * weightB + normalY[third]! * weightC,
              normalZ[first]! * weightA + normalZ[second]! * weightB + normalZ[third]! * weightC
            )
          }
        }
        if (ownerPrimitiveIndex < 0) continue
        ownerPrimitiveIndexes[pixelIndex] = ownerPrimitiveIndex
        ownerPixelCounts[ownerPrimitiveIndex]! += 1
        const secondTriangleIndex = secondTriangleBuffer[pixelIndex]!
        const secondSurfacePrimitiveIndex = secondTriangleIndex < 0
          ? -1
          : trianglePrimitiveIndexes[secondTriangleIndex]!
        const surfaceDepthMargin = secondSurfacePrimitiveIndex >= 0
          && secondSurfacePrimitiveIndex !== ownerPrimitiveIndex
          ? depthBuffer[pixelIndex]! - secondDepthBuffer[pixelIndex]!
          : Number.POSITIVE_INFINITY
        const semanticDistanceMargin = secondOwnerPrimitiveIndex >= 0
          ? secondOwnerDistance - ownerDistance
          : Number.POSITIVE_INFINITY
        const boundaryMargin = Math.min(surfaceDepthMargin, semanticDistanceMargin)
        ownerConfidence[pixelIndex] = Number.isFinite(boundaryMargin)
          ? Math.max(boundaryMargin, .001)
          : 1
        const semanticBoundaryConfidence = Number.isFinite(evaluatedMarkingBoundaryMargin)
          ? evaluatedMarkingBoundaryMargin
          : 1
        materialConfidence[pixelIndex] = Math.max(
          Math.min(ownerConfidence[pixelIndex]!, semanticBoundaryConfidence),
          .001
        )
        pixelMaterialIndexes[pixelIndex] = markingIndex >= 0
          ? markingIndex
          : primitiveMaterialIndexes[ownerPrimitiveIndex]!
        coloredPixelCount += 1
        }
      }
      for (let primitiveIndex = 0; primitiveIndex < primitiveCount; primitiveIndex += 1) {
        const projectedArea = primitiveProjectedAreas[primitiveIndex]!
        const visibleRatio = projectedArea <= 0 ? 0 : ownerPixelCounts[primitiveIndex]! / projectedArea
        ownerInteractionVisible[primitiveIndex] = ownerPixelCounts[primitiveIndex]! > 0 && visibleRatio >= .1 ? 1 : 0
      }
      const ownedAt = performance.now()

      // Continuous contours currently rebuild from the complete visible owner
      // field. The former dirty-tile comparison still scanned and copied the
      // whole raster even though no incremental contour consumer remained.
      // Report the truthful full fallback without paying that dead hot-path
      // cost; exact-pose cache hits above continue to report zero dirty tiles.
      const dirtyTileCount = tileCount
      const snapToCompiledSilhouette = (label: number, point: ContourPoint) => {
        const segments = projectedSilhouetteSegments[label]
        if (segments == null || segments.length === 0) return point
        let closestX = point.x
        let closestY = point.y
        let closestDistanceSquared = 2.25
        for (const segment of segments) {
          const deltaX = segment.endX - segment.startX
          const deltaY = segment.endY - segment.startY
          const lengthSquared = deltaX * deltaX + deltaY * deltaY
          if (lengthSquared < 1e-8) continue
          const progress = clamp(
            ((point.x - segment.startX) * deltaX + (point.y - segment.startY) * deltaY) / lengthSquared,
            0,
            1
          )
          const candidateX = segment.startX + deltaX * progress
          const candidateY = segment.startY + deltaY * progress
          const distanceSquared = (candidateX - point.x) ** 2 + (candidateY - point.y) ** 2
          if (distanceSquared >= closestDistanceSquared) continue
          closestDistanceSquared = distanceSquared
          closestX = candidateX
          closestY = candidateY
        }
        return { x: closestX, y: closestY }
      }
      const ownerContours = traceContinuousLabelPaths(
        ownerPrimitiveIndexes,
        ownerConfidence,
        primitiveCount,
        width,
        height,
        snapToCompiledSilhouette,
        visibleBounds,
        contourTraceScratch
      )
      for (let primitiveIndex = 0; primitiveIndex < primitiveCount; primitiveIndex += 1) {
        ownerPaths[primitiveIds[primitiveIndex]!] = ownerContours.paths[primitiveIndex] ?? ''
      }
      const hasSurfaceMarkings = preparedMarkings.some(markings => markings.length > 0)
      let materialContoursCurveSegmentCount = 0
      let materialContoursLineSegmentCount = 0
      let materialContoursMaxCurveError = 0
      let materialContoursSharedCurveReuseCount = 0
      let materialSegmentCount = 0
      let projectedSurfaceCurveSegmentCount = 0
      let projectedSurfaceMaxCurveError = 0
      if (hasSurfaceMarkings) {
        const materialContours = traceContinuousLabelPaths(
          pixelMaterialIndexes,
          materialConfidence,
          materialIds.length,
          width,
          height,
          undefined,
          visibleBounds,
          contourTraceScratch,
          true
        )
        materialContoursCurveSegmentCount = materialContours.curveSegmentCount
        materialContoursLineSegmentCount = materialContours.lineSegmentCount
        materialContoursMaxCurveError = materialContours.maxCurveError
        materialContoursSharedCurveReuseCount = materialContours.sharedCurveReuseCount
        materialSegmentCount = materialContours.segmentCount
        for (let materialIndex = 0; materialIndex < materialIds.length; materialIndex += 1) {
          materialPaths[materialIds[materialIndex]!] = materialContours.paths[materialIndex] ?? ''
        }
        const projectedSurfaceMaterialIndexes = new Set<number>()
        for (const markings of preparedMarkings) {
          for (const marking of markings) {
            if (marking.coversTargetSurface === 1) {
              materialPaths[materialIds[marking.materialIndex]!] =
                ownerContours.paths[marking.targetPrimitiveIndex] ?? ''
              projectedSurfaceMaterialIndexes.add(marking.materialIndex)
              continue
            }
            if (marking.surfaceAnchors == null) continue
            const projected = projectSurfaceMarkingPath(
              marking,
              cosYaw,
              sinYaw,
              cosPitch,
              sinPitch,
              cosRoll,
              sinRoll
            )
            if (projected == null) continue
            if (!projectedSurfaceMaterialIndexes.has(marking.materialIndex)) {
              materialPaths[materialIds[marking.materialIndex]!] = ''
              projectedSurfaceMaterialIndexes.add(marking.materialIndex)
            }
            materialPaths[materialIds[marking.materialIndex]!] += projected.path
            projectedSurfaceCurveSegmentCount += projected.segmentCount
            projectedSurfaceMaxCurveError = Math.max(
              projectedSurfaceMaxCurveError,
              projected.maxError
            )
          }
        }
      } else {
        for (const materialId of materialIds) materialPaths[materialId] = ''
        for (let primitiveIndex = 0; primitiveIndex < primitiveCount; primitiveIndex += 1) {
          const materialId = materialIds[primitiveMaterialIndexes[primitiveIndex]!]!
          materialPaths[materialId] = `${materialPaths[materialId] ?? ''}${ownerContours.paths[primitiveIndex] ?? ''}`
        }
      }
      const contouredAt = performance.now()

      let pathCharacterCount = 0
      let pathCount = 0
      for (let materialIndex = 0; materialIndex < materialIds.length; materialIndex += 1) {
        const path = materialPaths[materialIds[materialIndex]!] ?? ''
        pathCharacterCount += path.length
        if (path.length > 0) pathCount += 1
      }
      if (includeOwnerPaths || hasSurfaceMarkings) {
        for (let primitiveIndex = 0; primitiveIndex < primitiveCount; primitiveIndex += 1) {
          const path = ownerPaths[primitiveIds[primitiveIndex]!] ?? ''
          pathCharacterCount += path.length
          if (path.length > 0) pathCount += 1
        }
      }
      const serializedAt = performance.now()
      metrics.transformMs = transformedAt - startedAt
      metrics.binCullMs = binnedAt - transformedAt
      metrics.depthOwnerMs = ownedAt - binnedAt
      metrics.contourMs = contouredAt - ownedAt
      metrics.contourCurveSegmentCount = ownerContours.curveSegmentCount
        + materialContoursCurveSegmentCount
        + projectedSurfaceCurveSegmentCount
      metrics.contourLineSegmentCount = ownerContours.lineSegmentCount + materialContoursLineSegmentCount
      metrics.contourMaxCurveError = Math.max(
        ownerContours.maxCurveError,
        materialContoursMaxCurveError,
        projectedSurfaceMaxCurveError
      )
      metrics.contourSharedCurveReuseCount = ownerContours.sharedCurveReuseCount
        + materialContoursSharedCurveReuseCount
      metrics.contourSegmentCount = ownerContours.segmentCount + materialSegmentCount
      metrics.pathSerializationMs = serializedAt - contouredAt
      metrics.projectMs = serializedAt - startedAt
      metrics.candidateTestsBefore = candidateTestsBefore
      metrics.candidateTestsAfter = candidateTestsAfter
      metrics.coloredPixelCount = coloredPixelCount
      metrics.dirtyTileCount = dirtyTileCount
      metrics.fullContourFallback = true
      metrics.pathCharacterCount = pathCharacterCount
      metrics.pathCount = pathCount
      metrics.rasterizedTriangleCount = visibleTriangleCount
      metrics.nullOwnerPixelCount = 0
      lastProjectedPoseKey = poseKey
      return projection
    }
  }
}
