import { AVATAR_LIGHTING_RANGES } from '@oneworks/avatar'

import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'
import { CLAUDE_SPARK_PATH, CLAUDE_SPARK_VIEWBOX_SIZE } from './claudeSpark'

export const AVATAR_BODY_SHAPES = [
  'sphere',
  'ellipse',
  'square',
  'rounded',
  'capsule',
  'teardrop',
  'diamond',
  'trapezoid',
  'cone',
  'frustum',
  'half-cone'
] as const
export type AvatarBodyShape = (typeof AVATAR_BODY_SHAPES)[number]

export interface AvatarBodyGeometryOptions {
  readonly bottomTaper?: number
  readonly compositorDensity?: number
  readonly cutAngle?: number
  readonly faceOffsetY?: number
  readonly hollow?: boolean
  readonly occlusionAmount?: number
  readonly occlusionPole?: 'bottom' | 'top'
  readonly rotationX?: number
  readonly rotationY?: number
  readonly rotationZ?: number
  readonly roundness?: number
  readonly scaleX?: number
  readonly scaleY?: number
  readonly scaleZ?: number
  readonly topScale?: number
}

export interface AvatarAuthoredSurfacePoint {
  readonly frontDepth: number
  readonly x: number
  readonly y: number
}

export interface AvatarPose {
  readonly pitch: number
  readonly yaw: number
}

export interface AvatarLightDirection {
  readonly azimuth: number
  readonly elevation: number
}

export const AVATAR_GRID_DENSITY = {
  default: 100,
  max: AVATAR_LIGHTING_RANGES.gridDensity.max,
  min: AVATAR_LIGHTING_RANGES.gridDensity.min
} as const

export interface AvatarFaceShadowStyle {
  readonly color?: string
  readonly direction: number
  readonly distance: number
  readonly opacity: number
  readonly softness: number
}

export type AvatarEyeShape = 'ellipse' | 'rounded'
export type AvatarMouthShape = 'curve' | 'ellipse' | 'rounded' | 'rounded-triangle'
export type AvatarNoseShape = 'ellipse' | 'inverted-triangle' | 'rounded'

export interface AvatarFaceStyle {
  readonly eyeHighlight: AvatarEyeHighlightStyle
  readonly eyeRoundness: number
  readonly eyeShape: AvatarEyeShape
  readonly gap: number
  readonly height: number
  readonly leftEyeHeight?: number
  readonly leftEyeWidth?: number
  readonly leftEyeRotation: number
  readonly mouthCurve: number
  readonly mouthEnabled: boolean
  readonly mouthHeight: number
  readonly mouthRotation: number
  readonly mouthShape: AvatarMouthShape
  readonly mouthWidth: number
  readonly mouthY: number
  readonly noseEnabled: boolean
  readonly noseHeight: number
  readonly noseRotation: number
  readonly noseShape: AvatarNoseShape
  readonly noseWidth: number
  readonly noseY: number
  readonly rotation: number
  readonly rightEyeHeight?: number
  readonly rightEyeWidth?: number
  readonly rightEyeRotation: number
  readonly width: number
}

export interface AvatarEyeHighlightStyle {
  readonly color: string
  readonly enabled: boolean
  readonly offsetX: number
  readonly offsetY: number
  readonly opacity: number
  readonly size: number
}

export const DEFAULT_AVATAR_EYE_HIGHLIGHT_STYLE: AvatarEyeHighlightStyle = {
  color: '#ffffff',
  enabled: false,
  offsetX: -18,
  offsetY: -20,
  opacity: 92,
  size: 24
}

export const DEFAULT_AVATAR_FACE_STYLE: AvatarFaceStyle = {
  eyeHighlight: DEFAULT_AVATAR_EYE_HIGHLIGHT_STYLE,
  eyeRoundness: 100,
  eyeShape: 'rounded',
  gap: 40,
  height: 64,
  leftEyeRotation: 0,
  mouthCurve: 45,
  mouthEnabled: false,
  mouthHeight: 12,
  mouthRotation: 0,
  mouthShape: 'curve',
  mouthWidth: 52,
  mouthY: 52,
  noseEnabled: false,
  noseHeight: 18,
  noseRotation: 0,
  noseShape: 'inverted-triangle',
  noseWidth: 10,
  noseY: 22,
  rotation: 0,
  rightEyeRotation: 0,
  width: 28
}

export const resolveAvatarFaceStyle = (faceStyle: Partial<AvatarFaceStyle>): AvatarFaceStyle => {
  const resolved = {
    ...DEFAULT_AVATAR_FACE_STYLE,
    ...faceStyle,
    eyeHighlight: {
      ...DEFAULT_AVATAR_EYE_HIGHLIGHT_STYLE,
      ...faceStyle.eyeHighlight
    }
  }
  return {
    ...resolved,
    leftEyeRotation: Number.isFinite(resolved.leftEyeRotation)
      ? resolved.leftEyeRotation
      : DEFAULT_AVATAR_FACE_STYLE.leftEyeRotation,
    rightEyeRotation: Number.isFinite(resolved.rightEyeRotation)
      ? resolved.rightEyeRotation
      : DEFAULT_AVATAR_FACE_STYLE.rightEyeRotation
  }
}

export const DEFAULT_AVATAR_FACE_SHADOW_STYLE: AvatarFaceShadowStyle = {
  direction: 50,
  distance: 4,
  opacity: 28,
  softness: 0
}

export interface AvatarSurfaceOffset {
  readonly latitude: number
  readonly longitude: number
}

export interface BodyCell {
  readonly depth: number
  readonly id: string
  readonly points: string
  readonly shade: number
}

export interface BodySurfaceVertex {
  readonly depth: number
  readonly x: number
  readonly y: number
}

export interface BodySurfaceTriangle {
  readonly bounds: {
    readonly maxX: number
    readonly maxY: number
    readonly minX: number
    readonly minY: number
  }
  readonly id: string
  readonly maxDepth: number
  readonly meanDepth: number
  readonly minDepth: number
  readonly vertices: readonly [BodySurfaceVertex, BodySurfaceVertex, BodySurfaceVertex]
}

export interface BodyGeometry {
  readonly cells: readonly BodyCell[]
  readonly cavityPath?: string
  readonly occlusionPath?: string
  readonly outlinePoints: readonly BodySurfaceVertex[]
  readonly outlinePath: string
  readonly surfaceTriangles: readonly BodySurfaceTriangle[]
}

export interface ProjectedFace {
  readonly eyeHighlights: readonly ProjectedEye[]
  readonly eyes: readonly ProjectedEye[]
  readonly mouth: ProjectedEye | null
  readonly nose: ProjectedEye | null
  readonly visible: boolean
}

export interface ProjectedEye {
  readonly depth: number
  readonly id: string
  readonly path: string
  readonly transform?: string
}

export interface AvatarBodyCompilerShapeSpec {
  readonly exponent: number
  readonly faceCurvature: number
  readonly faceScale: number
  readonly profile: 'cone' | 'frustum' | 'half-cone' | 'superellipsoid' | 'teardrop' | 'trapezoid'
  readonly radiusX: number
  readonly radiusY: number
  readonly radiusZ: number
}

interface Vec2 {
  readonly x: number
  readonly y: number
}

interface Vec3 extends Vec2 {
  readonly z: number
}

const clipPolygonToVisibleHemisphere = (points: readonly Vec3[], minimumDepth = .015): Vec3[] => {
  const clipped: Vec3[] = []
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index + points.length - 1) % points.length]!
    const current = points[index]!
    const previousVisible = previous.z > minimumDepth
    const currentVisible = current.z > minimumDepth
    if (previousVisible !== currentVisible) {
      const ratio = (minimumDepth - previous.z) / (current.z - previous.z)
      clipped.push({
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio,
        z: minimumDepth
      })
    }
    if (currentVisible) clipped.push(current)
  }
  return clipped
}

const VIEW_SIZE = 420
const CENTER_X = VIEW_SIZE / 2
const CENTER_Y = 202
const BASE_LATITUDE_STEPS = 14
const BASE_LONGITUDE_STEPS = 28
const COMPOSITOR_LATITUDE_STEPS = 6
const COMPOSITOR_LONGITUDE_STEPS = 12
const OUTLINE_LATITUDE_STEPS = 28
const OUTLINE_LONGITUDE_STEPS = 72
const NORMAL_DELTA = 0.006
const EYE_CORNER_STEPS = 8
const FACE_EDGE_STEPS = 8
const ELLIPSE_STEPS = 40
const MOUTH_CURVE_STEPS = 28
const MOUTH_CAP_STEPS = 8
const TAPERED_BAND_STEPS = 20
const TRIANGLE_EDGE_STEPS = 10
const FACE_MASK_EDGE_STEPS = 12

const SHAPE_SPECS: Readonly<Record<AvatarBodyShape, AvatarBodyCompilerShapeSpec>> = {
  capsule: { exponent: 0.52, faceCurvature: 0.52, faceScale: 0.52, profile: 'superellipsoid', radiusX: 150, radiusY: 109, radiusZ: 109 },
  cone: { exponent: 1, faceCurvature: .8, faceScale: .8, profile: 'cone', radiusX: 139, radiusY: 139, radiusZ: 124 },
  diamond: { exponent: 1.65, faceCurvature: 0.72, faceScale: 1.12, profile: 'superellipsoid', radiusX: 139, radiusY: 139, radiusZ: 106 },
  ellipse: { exponent: 1, faceCurvature: 1, faceScale: 1, profile: 'superellipsoid', radiusX: 153, radiusY: 118, radiusZ: 122 },
  frustum: { exponent: 1, faceCurvature: .72, faceScale: .72, profile: 'frustum', radiusX: 139, radiusY: 139, radiusZ: 124 },
  'half-cone': { exponent: 1, faceCurvature: .8, faceScale: .8, profile: 'half-cone', radiusX: 139, radiusY: 139, radiusZ: 124 },
  rounded: { exponent: 0.5, faceCurvature: 0.55, faceScale: 0.5, profile: 'superellipsoid', radiusX: 132, radiusY: 132, radiusZ: 116 },
  sphere: { exponent: 1, faceCurvature: 1, faceScale: 1, profile: 'superellipsoid', radiusX: 139, radiusY: 139, radiusZ: 139 },
  square: { exponent: 0.3, faceCurvature: 0.28, faceScale: 0.38, profile: 'superellipsoid', radiusX: 132, radiusY: 132, radiusZ: 108 },
  teardrop: { exponent: .78, faceCurvature: .7, faceScale: .72, profile: 'teardrop', radiusX: 132, radiusY: 148, radiusZ: 112 },
  trapezoid: { exponent: .56, faceCurvature: .62, faceScale: .72, profile: 'trapezoid', radiusX: 142, radiusY: 132, radiusZ: 116 }
}

/**
 * Internal geometry-compiler contract. The production compiled renderer uses
 * the same authored primitive dimensions and profiles as the legacy vector
 * projector instead of maintaining a second, visually divergent shape table.
 */
export const getAvatarBodyCompilerShapeSpec = (
  shape: AvatarBodyShape
): AvatarBodyCompilerShapeSpec => SHAPE_SPECS[shape]

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const signedPow = (value: number, exponent: number) => Math.sign(value) * Math.abs(value) ** exponent

const resolveEllipseLowerTaper = (
  spec: AvatarBodyCompilerShapeSpec,
  vertical: number,
  options: AvatarBodyGeometryOptions
) => {
  if (spec !== SHAPE_SPECS.ellipse) return 1

  // Keep the profile convex and its lower pole rounded rather than collapsing into a sharp V.
  const intensity = clamp(options.bottomTaper ?? 0, 0, 100) / 100
  return 1 - intensity * .62 * Math.max(vertical, 0) ** 2
}

const subtract = (left: Vec3, right: Vec3): Vec3 => ({
  x: left.x - right.x,
  y: left.y - right.y,
  z: left.z - right.z
})

const cross = (left: Vec3, right: Vec3): Vec3 => ({
  x: left.y * right.z - left.z * right.y,
  y: left.z * right.x - left.x * right.z,
  z: left.x * right.y - left.y * right.x
})

const normalize = (vector: Vec3): Vec3 => {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length }
}

const rotate = (point: Vec3, pose: AvatarPose): Vec3 => {
  const cosYaw = Math.cos(pose.yaw)
  const sinYaw = Math.sin(pose.yaw)
  const yawX = point.x * cosYaw + point.z * sinYaw
  const yawZ = -point.x * sinYaw + point.z * cosYaw
  const cosPitch = Math.cos(pose.pitch)
  const sinPitch = Math.sin(pose.pitch)

  return {
    x: yawX,
    y: point.y * cosPitch + yawZ * sinPitch,
    z: -point.y * sinPitch + yawZ * cosPitch
  }
}

const rotateLocal = (point: Vec3, options: AvatarBodyGeometryOptions): Vec3 => {
  const rotationX = (options.rotationX ?? 0) * Math.PI / 180
  const rotationY = (options.rotationY ?? 0) * Math.PI / 180
  const rotationZ = (options.rotationZ ?? 0) * Math.PI / 180
  const cosX = Math.cos(rotationX)
  const sinX = Math.sin(rotationX)
  const xRotated = {
    x: point.x,
    y: point.y * cosX - point.z * sinX,
    z: point.y * sinX + point.z * cosX
  }
  const cosY = Math.cos(rotationY)
  const sinY = Math.sin(rotationY)
  const yRotated = {
    x: xRotated.x * cosY + xRotated.z * sinY,
    y: xRotated.y,
    z: -xRotated.x * sinY + xRotated.z * cosY
  }
  const cosZ = Math.cos(rotationZ)
  const sinZ = Math.sin(rotationZ)
  return {
    x: yRotated.x * cosZ - yRotated.y * sinZ,
    y: yRotated.x * sinZ + yRotated.y * cosZ,
    z: yRotated.z
  }
}

const project = (point: Vec3): Vec2 => ({
  x: CENTER_X + point.x,
  y: CENTER_Y + point.y
})

const getSurfacePoint = (
  spec: AvatarBodyCompilerShapeSpec,
  longitude: number,
  latitude: number,
  faceCoordinates = false,
  options: AvatarBodyGeometryOptions = {}
): Vec3 => {
  if (spec.profile === 'teardrop') {
    const scale = faceCoordinates ? spec.faceScale : 1
    const scaledLongitude = longitude * scale
    const scaledLatitude = latitude * scale
    const vertical = signedPow(Math.sin(scaledLatitude), spec.exponent)
    const progress = clamp((vertical + 1) / 2, 0, 1)
    const latitudeRadius = Math.max(Math.cos(scaledLatitude), 0)
    const latitudeFactor = latitudeRadius ** spec.exponent
    const widthTaper = interpolate(.46, 1.24, progress)
    const depthTaper = interpolate(.7, 1.12, progress)

    return {
      x: spec.radiusX * widthTaper * latitudeFactor * signedPow(Math.sin(scaledLongitude), spec.exponent),
      y: spec.radiusY * vertical,
      z: spec.radiusZ * depthTaper * latitudeFactor * signedPow(Math.cos(scaledLongitude), spec.exponent)
    }
  }
  if (spec.profile === 'trapezoid') {
    const scale = faceCoordinates ? spec.faceScale : 1
    const scaledLongitude = longitude * scale
    const scaledLatitude = latitude * scale
    const roundness = clamp(options.roundness ?? 72, 0, 100) / 100
    const exponent = interpolate(.34, .76, roundness)
    const latitudeRadius = Math.max(Math.cos(scaledLatitude), 0)
    const latitudeFactor = latitudeRadius ** exponent
    const vertical = signedPow(Math.sin(scaledLatitude), exponent)
    const progress = clamp((vertical + 1) / 2, 0, 1)
    const horizontalTaper = interpolate(options.topScale ?? .82, 1.08, progress)
    const depthTaper = interpolate(.92, 1.04, progress)

    return {
      x: spec.radiusX * horizontalTaper * latitudeFactor * signedPow(Math.sin(scaledLongitude), exponent),
      y: spec.radiusY * vertical,
      z: spec.radiusZ * depthTaper * latitudeFactor * signedPow(Math.cos(scaledLongitude), exponent)
    }
  }
  if (spec.profile !== 'superellipsoid' && !faceCoordinates) {
    const progress = clamp((latitude + Math.PI / 2) / Math.PI, 0, 1)
    const roundness = clamp(options.roundness ?? 24, 0, 100) / 100
    const easedProgress = progress * progress * (3 - 2 * progress)
    const taperedProgress = spec.profile === 'frustum'
      ? interpolate(progress, easedProgress, roundness * .55)
      // A sub-linear radius profile keeps a zero-radius apex while giving
      // the tip a continuous, rounded shoulder. A non-zero apex radius would
      // make this a frustum and visibly cut the tip flat.
      : progress ** interpolate(1, .56, roundness)
    const tipRatio = spec.profile === 'frustum' ? .46 : 0
    const ringRadius = interpolate(tipRatio, 1, taperedProgress)
    const cutAngle = (options.cutAngle ?? 0) * Math.PI / 180
    const sampledLongitude = spec.profile === 'half-cone'
      ? cutAngle + longitude / 2
      : longitude
    return {
      x: spec.radiusX * ringRadius * Math.sin(sampledLongitude),
      y: spec.radiusY * (progress * 2 - 1),
      z: spec.radiusZ * ringRadius * Math.cos(sampledLongitude)
    }
  }
  const scale = faceCoordinates ? spec.faceScale : 1
  const scaledLongitude = longitude * scale
  const scaledLatitude = latitude * scale
  const latitudeRadius = Math.max(Math.cos(scaledLatitude), 0)
  const latitudeFactor = latitudeRadius ** spec.exponent
  const vertical = signedPow(Math.sin(scaledLatitude), spec.exponent)
  const lowerTaper = resolveEllipseLowerTaper(spec, vertical, options)

  return {
    x: spec.radiusX * latitudeFactor * lowerTaper * signedPow(Math.sin(scaledLongitude), spec.exponent),
    y: spec.radiusY * vertical,
    z: spec.radiusZ * latitudeFactor * lowerTaper * signedPow(Math.cos(scaledLongitude), spec.exponent)
  }
}

/**
 * Maps a normalized physical primitive-space point back into the two-dimensional
 * authoring chart used by surface decals. Most production profiles preserve x/y
 * exactly; half-cones need the cut-angle inverse, while side markings need the
 * same radius-aware axis exchange used by the legacy projector.
 */
export const mapAvatarPrimitiveLocalPointToAuthoredSurface = (
  bodyShape: AvatarBodyShape,
  point: Vec3,
  side: AvatarSurfaceDecal['side'] = 'front',
  options: AvatarBodyGeometryOptions = {}
): AvatarAuthoredSurfacePoint => {
  const spec = SHAPE_SPECS[bodyShape]
  const radiusZToX = spec.radiusZ / spec.radiusX
  const radiusXToZ = spec.radiusX / spec.radiusZ
  const oriented = side === 'back'
    ? { x: point.x, y: point.y, z: -point.z }
    : side === 'left'
      ? { x: point.z * radiusZToX, y: point.y, z: -point.x * radiusXToZ }
      : side === 'right'
        ? { x: -point.z * radiusZToX, y: point.y, z: point.x * radiusXToZ }
        : point
  if (spec.profile !== 'half-cone') {
    return { frontDepth: oriented.z, x: oriented.x, y: oriented.y }
  }
  const progress = clamp((oriented.y + 1) / 2, 0, 1)
  const roundness = clamp(options.roundness ?? 24, 0, 100) / 100
  const ringRadius = progress ** interpolate(1, .56, roundness)
  const cutAngle = (options.cutAngle ?? 0) * Math.PI / 180
  const longitude = Math.atan2(oriented.x, oriented.z) - cutAngle
  return {
    // A half-cone's authored front axis rotates with its cut angle. Using
    // global +Z here incorrectly rejects the center of a 90-degree cut face.
    frontDepth: oriented.x * Math.sin(cutAngle) + oriented.z * Math.cos(cutAngle),
    x: ringRadius * Math.sin(longitude),
    y: oriented.y
  }
}

const getSurfaceNormal = (
  spec: AvatarBodyCompilerShapeSpec,
  longitude: number,
  latitude: number,
  faceCoordinates = false,
  options: AvatarBodyGeometryOptions = {}
): Vec3 => {
  const center = getSurfacePoint(spec, longitude, latitude, faceCoordinates, options)
  const longitudePoint = getSurfacePoint(spec, longitude + NORMAL_DELTA, latitude, faceCoordinates, options)
  const latitudePoint = getSurfacePoint(spec, longitude, latitude + NORMAL_DELTA, faceCoordinates, options)
  return normalize(cross(subtract(longitudePoint, center), subtract(latitudePoint, center)))
}

const convexHull = (points: readonly Vec2[]): Vec2[] => {
  const sorted = [...points].sort((left, right) => left.x - right.x || left.y - right.y)
  if (sorted.length <= 2) return sorted

  const turn = (origin: Vec2, left: Vec2, right: Vec2) => {
    return (left.x - origin.x) * (right.y - origin.y) - (left.y - origin.y) * (right.x - origin.x)
  }
  const lower: Vec2[] = []
  for (const point of sorted) {
    while (lower.length >= 2 && turn(lower.at(-2)!, lower.at(-1)!, point) <= 0) lower.pop()
    lower.push(point)
  }
  const upper: Vec2[] = []
  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && turn(upper.at(-2)!, upper.at(-1)!, point) <= 0) upper.pop()
    upper.push(point)
  }
  lower.pop()
  upper.pop()
  return [...lower, ...upper]
}

const roundedPolygonPath = (points: readonly Vec2[], radius: number) => {
  if (points.length < 3 || radius <= 0) {
    return points.length === 0
      ? ''
      : `M ${points.map(point => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')} Z`
  }

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
  const segments = corners.slice(1).map(corner =>
    `L ${corner.entry.x.toFixed(2)} ${corner.entry.y.toFixed(2)} ` +
    `Q ${corner.control.x.toFixed(2)} ${corner.control.y.toFixed(2)} ${corner.exit.x.toFixed(2)} ${corner.exit.y.toFixed(2)}`
  )
  segments.push(
    `L ${first.entry.x.toFixed(2)} ${first.entry.y.toFixed(2)} ` +
    `Q ${first.control.x.toFixed(2)} ${first.control.y.toFixed(2)} ${first.exit.x.toFixed(2)} ${first.exit.y.toFixed(2)}`
  )
  return `M ${first.exit.x.toFixed(2)} ${first.exit.y.toFixed(2)} ${segments.join(' ')} Z`
}

const roundedVertexPolygonPath = (
  points: readonly Vec2[],
  vertex: Vec2,
  radius: number
) => {
  if (points.length < 3 || radius <= 0) return roundedPolygonPath(points, 0)
  const vertexIndex = points.reduce((nearestIndex, point, index) => {
    const nearest = points[nearestIndex]!
    return Math.hypot(point.x - vertex.x, point.y - vertex.y) < Math.hypot(nearest.x - vertex.x, nearest.y - vertex.y)
      ? index
      : nearestIndex
  }, 0)
  const ordered = [
    ...points.slice(vertexIndex),
    ...points.slice(0, vertexIndex)
  ]
  const apex = ordered[0]!
  const findCutIndex = (direction: 1 | -1) => {
    for (let offset = 1; offset < ordered.length; offset += 1) {
      const index = direction === 1 ? offset : ordered.length - offset
      const point = ordered[index]!
      if (Math.hypot(point.x - apex.x, point.y - apex.y) >= radius) return index
    }
    return direction === 1 ? 1 : ordered.length - 1
  }
  const nextIndex = findCutIndex(1)
  const previousIndex = findCutIndex(-1)
  const pointAtRadius = (point: Vec2) => {
    const distance = Math.hypot(point.x - apex.x, point.y - apex.y) || 1
    const scale = Math.min(radius / distance, 1)
    return {
      x: apex.x + (point.x - apex.x) * scale,
      y: apex.y + (point.y - apex.y) * scale
    }
  }
  const entry = pointAtRadius(ordered[previousIndex]!)
  const exit = pointAtRadius(ordered[nextIndex]!)
  const remainder = ordered.slice(nextIndex, previousIndex + 1)
  return `M ${entry.x.toFixed(2)} ${entry.y.toFixed(2)} ` +
    `Q ${apex.x.toFixed(2)} ${apex.y.toFixed(2)} ${exit.x.toFixed(2)} ${exit.y.toFixed(2)} ` +
    `${remainder.map(point => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')} Z`
}

const toPointString = (point: Vec2) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`
const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress

const rotateFacePoint = (point: Vec2, centerX: number, centerY: number, rotationDegrees: number): Vec2 => {
  const rotation = rotationDegrees * Math.PI / 180
  const cosRotation = Math.cos(rotation)
  const sinRotation = Math.sin(rotation)
  const localX = point.x - centerX
  const localY = point.y - centerY
  return {
    x: centerX + localX * cosRotation - localY * sinRotation,
    y: centerY + localX * sinRotation + localY * cosRotation
  }
}

const buildRoundedRectangleBoundary = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotationDegrees: number,
  roundness = 100
): Vec2[] => {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const cornerRadius = Math.min(halfWidth, halfHeight) * clamp(roundness / 100, 0, 1)
  if (cornerRadius <= 0.001) {
    const vertices = [
      { x: centerX - halfWidth, y: centerY - halfHeight },
      { x: centerX + halfWidth, y: centerY - halfHeight },
      { x: centerX + halfWidth, y: centerY + halfHeight },
      { x: centerX - halfWidth, y: centerY + halfHeight }
    ]
    return vertices.flatMap((start, edgeIndex) => {
      const end = vertices[(edgeIndex + 1) % vertices.length]!
      return Array.from({ length: FACE_EDGE_STEPS }, (_, index) => {
        const progress = index / FACE_EDGE_STEPS
        return rotateFacePoint(
          {
            x: interpolate(start.x, end.x, progress),
            y: interpolate(start.y, end.y, progress)
          },
          centerX,
          centerY,
          rotationDegrees
        )
      })
    })
  }
  const corners = [
    {
      centerX: centerX + halfWidth - cornerRadius,
      centerY: centerY - halfHeight + cornerRadius,
      start: -Math.PI / 2
    },
    {
      centerX: centerX + halfWidth - cornerRadius,
      centerY: centerY + halfHeight - cornerRadius,
      start: 0
    },
    {
      centerX: centerX - halfWidth + cornerRadius,
      centerY: centerY + halfHeight - cornerRadius,
      start: Math.PI / 2
    },
    {
      centerX: centerX - halfWidth + cornerRadius,
      centerY: centerY - halfHeight + cornerRadius,
      start: Math.PI
    }
  ]

  const cornerPoints = corners.map(corner =>
    Array.from({ length: EYE_CORNER_STEPS + 1 }, (_, index) => {
      const angle = corner.start + index / EYE_CORNER_STEPS * Math.PI / 2
      return {
        x: corner.centerX + Math.cos(angle) * cornerRadius,
        y: corner.centerY + Math.sin(angle) * cornerRadius
      }
    })
  )

  return cornerPoints.flatMap((corner, cornerIndex) => {
    const nextCorner = cornerPoints[(cornerIndex + 1) % cornerPoints.length]!
    const edgeStart = corner.at(-1)!
    const edgeEnd = nextCorner[0]!
    const edgeInterior = Array.from({ length: FACE_EDGE_STEPS - 1 }, (_, index) => {
      const progress = (index + 1) / FACE_EDGE_STEPS
      return {
        x: interpolate(edgeStart.x, edgeEnd.x, progress),
        y: interpolate(edgeStart.y, edgeEnd.y, progress)
      }
    })
    return [...corner, ...edgeInterior]
      .map(point => rotateFacePoint(point, centerX, centerY, rotationDegrees))
  })
}

const buildEllipseBoundary = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotationDegrees: number
): Vec2[] => {
  return Array.from({ length: ELLIPSE_STEPS }, (_, index) => {
    const angle = index / ELLIPSE_STEPS * Math.PI * 2
    return rotateFacePoint(
      {
        x: centerX + Math.cos(angle) * width / 2,
        y: centerY + Math.sin(angle) * height / 2
      },
      centerX,
      centerY,
      rotationDegrees
    )
  })
}

const buildRoundedInvertedTriangleBoundary = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotationDegrees: number
): Vec2[] => {
  const sampleCurve = (start: Vec2, controlA: Vec2, controlB: Vec2, end: Vec2) => (
    Array.from({ length: TRIANGLE_EDGE_STEPS }, (_, step) => {
      const progress = (step + 1) / TRIANGLE_EDGE_STEPS
      const inverseProgress = 1 - progress
      return {
        x: inverseProgress ** 3 * start.x +
          3 * inverseProgress ** 2 * progress * controlA.x +
          3 * inverseProgress * progress ** 2 * controlB.x +
          progress ** 3 * end.x,
        y: inverseProgress ** 3 * start.y +
          3 * inverseProgress ** 2 * progress * controlA.y +
          3 * inverseProgress * progress ** 2 * controlB.y +
          progress ** 3 * end.y
      }
    })
  )
  const point = (widthRatio: number, heightRatio: number): Vec2 => ({
    x: centerX + width * widthRatio,
    y: centerY + height * heightRatio
  })
  const leftShoulder = point(-.5, -.18)
  const rightShoulder = point(.5, -.18)
  const rightTip = point(.07, .45)
  const leftTip = point(-.07, .45)
  const boundary = [
    leftShoulder,
    ...sampleCurve(leftShoulder, point(-.45, -.5), point(.45, -.5), rightShoulder),
    ...sampleCurve(rightShoulder, point(.5, .08), point(.18, .42), rightTip),
    ...sampleCurve(rightTip, point(.04, .52), point(-.04, .52), leftTip),
    ...sampleCurve(leftTip, point(-.18, .42), point(-.5, .08), leftShoulder)
  ]
  return boundary.map(point => rotateFacePoint(point, centerX, centerY, rotationDegrees))
}

const buildFaceMaskBoundary = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotationDegrees: number
): Vec2[] => {
  const point = (widthRatio: number, heightRatio: number): Vec2 => ({
    x: centerX + width * widthRatio,
    y: centerY + height * heightRatio
  })
  const sampleCurve = (start: Vec2, controlA: Vec2, controlB: Vec2, end: Vec2) => (
    Array.from({ length: FACE_MASK_EDGE_STEPS }, (_, step) => {
      const progress = (step + 1) / FACE_MASK_EDGE_STEPS
      const inverseProgress = 1 - progress
      return {
        x: inverseProgress ** 3 * start.x +
          3 * inverseProgress ** 2 * progress * controlA.x +
          3 * inverseProgress * progress ** 2 * controlB.x +
          progress ** 3 * end.x,
        y: inverseProgress ** 3 * start.y +
          3 * inverseProgress ** 2 * progress * controlA.y +
          3 * inverseProgress * progress ** 2 * controlB.y +
          progress ** 3 * end.y
      }
    })
  )
  const top = point(0, -.5)
  const left = point(-.5, .02)
  const bottom = point(0, .5)
  const right = point(.5, .02)
  const boundary = [
    top,
    ...sampleCurve(top, point(-.2, -.5), point(-.5, -.3), left),
    ...sampleCurve(left, point(-.5, .34), point(-.28, .5), bottom),
    ...sampleCurve(bottom, point(.28, .5), point(.5, .34), right),
    ...sampleCurve(right, point(.5, -.3), point(.2, -.5), top)
  ]
  return boundary.map(point => rotateFacePoint(point, centerX, centerY, rotationDegrees))
}

const buildTaperedBandBoundary = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotationDegrees: number,
  bend: number
): Vec2[] => {
  const halfHeight = height / 2
  const halfWidth = width / 2
  const centerline = Array.from({ length: TAPERED_BAND_STEPS + 1 }, (_, index) => {
    const progress = index / TAPERED_BAND_STEPS
    const angle = Math.PI * progress
    const center = {
      x: centerX + Math.sin(angle) * bend,
      y: centerY - halfHeight + progress * height
    }
    const tangent = normalize({
      x: Math.cos(angle) * Math.PI * bend,
      y: height,
      z: 0
    })
    const taper = Math.max(.08, Math.sin(angle) ** .62)
    const normal = { x: -tangent.y, y: tangent.x }
    return { center, normal, width: halfWidth * taper }
  })
  return [
    ...centerline.map(entry => ({
      x: entry.center.x + entry.normal.x * entry.width,
      y: entry.center.y + entry.normal.y * entry.width
    })),
    ...[...centerline].reverse().map(entry => ({
      x: entry.center.x - entry.normal.x * entry.width,
      y: entry.center.y - entry.normal.y * entry.width
    }))
  ].map(point => rotateFacePoint(point, centerX, centerY, rotationDegrees))
}

/**
 * Returns the authored two-dimensional boundary that is later sampled on a
 * compiled primitive surface. Asset-backed and procedural multi-ray decals
 * retain their dedicated renderer until they have an equivalent surface
 * membership representation.
 */
export const buildAvatarSurfaceDecalLocalBoundary = (
  decal: AvatarSurfaceDecal
): readonly { readonly x: number, readonly y: number }[] | null => {
  if (decal.shape === 'ellipse') {
    return buildEllipseBoundary(decal.x, decal.y, decal.width, decal.height, decal.rotation)
  }
  if (decal.shape === 'face-mask') {
    return buildFaceMaskBoundary(decal.x, decal.y, decal.width, decal.height, decal.rotation)
  }
  if (decal.shape === 'tapered-band') {
    return buildTaperedBandBoundary(
      decal.x,
      decal.y,
      decal.width,
      decal.height,
      decal.rotation,
      decal.bend ?? 0
    )
  }
  if (decal.shape === 'rounded-triangle') {
    return buildRoundedInvertedTriangleBoundary(
      decal.x,
      decal.y,
      decal.width,
      decal.height,
      decal.rotation
    )
  }
  if (decal.shape === 'rounded') {
    return buildRoundedRectangleBoundary(
      decal.x,
      decal.y,
      decal.width,
      decal.height,
      decal.rotation,
      100
    )
  }
  return null
}

const sampleClaudeSparkBoundary = () => {
  const tokens = CLAUDE_SPARK_PATH.match(/[MLCZ]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []
  const points: Vec2[] = []
  let command = ''
  let cursor = 0
  let current = { x: 0, y: 0 }
  while (cursor < tokens.length) {
    const token = tokens[cursor]!
    if (/^[MLCZ]$/i.test(token)) {
      command = token.toUpperCase()
      cursor += 1
      if (command === 'Z') break
      continue
    }
    if (command === 'M' || command === 'L') {
      current = { x: Number(tokens[cursor]!), y: Number(tokens[cursor + 1]!) }
      points.push(current)
      cursor += 2
      if (command === 'M') command = 'L'
      continue
    }
    if (command === 'C') {
      const start = current
      const first = { x: Number(tokens[cursor]!), y: Number(tokens[cursor + 1]!) }
      const second = { x: Number(tokens[cursor + 2]!), y: Number(tokens[cursor + 3]!) }
      const end = { x: Number(tokens[cursor + 4]!), y: Number(tokens[cursor + 5]!) }
      for (let step = 1; step <= 6; step += 1) {
        const progress = step / 6
        const inverse = 1 - progress
        points.push({
          x: inverse ** 3 * start.x + 3 * inverse ** 2 * progress * first.x +
            3 * inverse * progress ** 2 * second.x + progress ** 3 * end.x,
          y: inverse ** 3 * start.y + 3 * inverse ** 2 * progress * first.y +
            3 * inverse * progress ** 2 * second.y + progress ** 3 * end.y
        })
      }
      current = end
      cursor += 6
      continue
    }
    cursor += 1
  }
  return points
}

const CLAUDE_SPARK_BOUNDARY = sampleClaudeSparkBoundary()

export interface AvatarSurfaceDecalLocalBoundaryPoint {
  readonly surfaceSide?: 'back' | 'front'
  readonly x: number
  readonly y: number
}

/**
 * Returns every authored region that belongs to one semantic marking. Most
 * decals have one boundary; procedural pleats have twelve disjoint bands.
 * Special asset geometry is sampled here so the compiled renderer can bind it
 * to the target surface instead of applying an already-projected SVG asset.
 */
export const buildAvatarSurfaceDecalLocalBoundaries = (
  decal: AvatarSurfaceDecal,
  bodyShape?: AvatarBodyShape,
  options: AvatarBodyGeometryOptions = {}
): readonly (readonly AvatarSurfaceDecalLocalBoundaryPoint[])[] => {
  const boundary = buildAvatarSurfaceDecalLocalBoundary(decal)
  if (boundary != null) return [boundary]
  if (decal.shape === 'claude-spark') {
    const halfWidth = decal.width / 2
    const halfHeight = decal.height / 2
    return [CLAUDE_SPARK_BOUNDARY.map(point => rotateFacePoint({
      x: decal.x - halfWidth + point.x / CLAUDE_SPARK_VIEWBOX_SIZE * decal.width,
      y: decal.y - halfHeight + point.y / CLAUDE_SPARK_VIEWBOX_SIZE * decal.height
    }, decal.x, decal.y, decal.rotation))]
  }
  if (decal.shape !== 'radial-pleats' || bodyShape == null) return []
  const spec = SHAPE_SPECS[bodyShape]
  const rayCount = 12
  const samplesPerRay = 9
  const phase = decal.rotation * Math.PI / 180
  const curveRadians = decal.x * Math.PI / 180
  const startProgress = .06
  const endProgress = clamp(.2 + decal.height / 160, .3, .82)
  const angularHalfWidth = clamp(decal.width / spec.radiusX, .008, .08)
  return Array.from({ length: rayCount }, (_, rayIndex) => {
    const baseLongitude = phase + rayIndex / rayCount * Math.PI * 2
    const curvedLongitude = (progress: number) => {
      const normalizedProgress = (progress - startProgress) / (endProgress - startProgress)
      const easedProgress = normalizedProgress * normalizedProgress * (3 - 2 * normalizedProgress)
      return baseLongitude + curveRadians * easedProgress
    }
    const samples = Array.from({ length: samplesPerRay }, (_, sampleIndex) => {
      const progress = startProgress + sampleIndex / (samplesPerRay - 1) * (endProgress - startProgress)
      return {
        latitude: progress * Math.PI - Math.PI / 2,
        longitude: curvedLongitude(progress)
      }
    })
    const surfaceLongitude = (longitude: number) => spec.profile === 'half-cone'
      ? ((longitude + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
      : longitude
    const physicalSurfacePoints = [
      ...samples.map(sample => getSurfacePoint(
        spec,
        surfaceLongitude(sample.longitude - angularHalfWidth),
        sample.latitude,
        false,
        options
      )),
      ...[...samples].reverse().map(sample => getSurfacePoint(
        spec,
        surfaceLongitude(sample.longitude + angularHalfWidth),
        sample.latitude,
        false,
        options
      ))
    ]
    const surfacePoints = physicalSurfacePoints.map(point => {
      // radial-pleats is a full-crown object-space marking. Its legacy/public
      // `side` value never selected a different authored chart; interpreting
      // left/right/back here would make the front/back hemisphere tags below
      // describe coordinates from a different chart. Always encode the crown
      // in the canonical front chart, then split that same physical loop into
      // complementary front/back components.
      const authored = mapAvatarPrimitiveLocalPointToAuthoredSurface(
        bodyShape,
        {
          x: point.x / spec.radiusX,
          y: point.y / spec.radiusY,
          z: point.z / spec.radiusZ
        },
        'front',
        options
      )
      return {
        frontDepth: authored.frontDepth,
        x: authored.x * spec.radiusX,
        y: authored.y * spec.radiusY
      }
    })
    const clipHemisphere = (front: boolean): AvatarSurfaceDecalLocalBoundaryPoint[] => {
      const clipped: AvatarSurfaceDecalLocalBoundaryPoint[] = []
      const surfaceSide = front ? 'front' : 'back'
      for (let pointIndex = 0; pointIndex < surfacePoints.length; pointIndex += 1) {
        const previous = surfacePoints[(pointIndex + surfacePoints.length - 1) % surfacePoints.length]!
        const current = surfacePoints[pointIndex]!
        const previousInside = front ? previous.frontDepth >= 0 : previous.frontDepth <= 0
        const currentInside = front ? current.frontDepth >= 0 : current.frontDepth <= 0
        if (previousInside !== currentInside) {
          const progress = Math.max(0, Math.min(
            1,
            -previous.frontDepth / (current.frontDepth - previous.frontDepth || 1)
          ))
          clipped.push({
            surfaceSide,
            x: previous.x + (current.x - previous.x) * progress,
            y: previous.y + (current.y - previous.y) * progress
          })
        }
        if (currentInside) clipped.push({ surfaceSide, x: current.x, y: current.y })
      }
      return clipped
    }
    return [clipHemisphere(true), clipHemisphere(false)].filter(boundary => {
      if (boundary.length < 3) return false
      const doubledArea = Math.abs(boundary.reduce((total, point, pointIndex) => {
        const next = boundary[(pointIndex + 1) % boundary.length]!
        return total + point.x * next.y - next.x * point.y
      }, 0))
      return doubledArea > 1e-4
    })
  }).flat()
}

const buildMouthBoundary = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  curve: number,
  rotationDegrees: number
): Vec2[] => {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const curveDepth = clamp(curve / 100, -1, 1) * width * 0.28
  const centerline = Array.from({ length: MOUTH_CURVE_STEPS + 1 }, (_, index) => {
    const progress = index / MOUTH_CURVE_STEPS
    const x = interpolate(-halfWidth, halfWidth, progress)
    const normalizedX = x / halfWidth
    const y = curveDepth * (1 - normalizedX ** 2)
    const slope = -2 * curveDepth * x / halfWidth ** 2
    const tangentLength = Math.hypot(1, slope)
    return {
      center: { x: centerX + x, y: centerY + y },
      normal: { x: -slope / tangentLength, y: 1 / tangentLength },
      tangent: { x: 1 / tangentLength, y: slope / tangentLength }
    }
  })
  const top = centerline.map(({ center, normal }) => ({
    x: center.x - normal.x * halfHeight,
    y: center.y - normal.y * halfHeight
  }))
  const right = centerline.at(-1)!
  const rightCap = Array.from({ length: MOUTH_CAP_STEPS + 1 }, (_, index) => {
    const angle = -Math.PI / 2 + index / MOUTH_CAP_STEPS * Math.PI
    return {
      x: right.center.x + (Math.cos(angle) * right.tangent.x + Math.sin(angle) * right.normal.x) * halfHeight,
      y: right.center.y + (Math.cos(angle) * right.tangent.y + Math.sin(angle) * right.normal.y) * halfHeight
    }
  })
  const bottom = [...centerline].reverse().map(({ center, normal }) => ({
    x: center.x + normal.x * halfHeight,
    y: center.y + normal.y * halfHeight
  }))
  const left = centerline[0]!
  const leftCap = Array.from({ length: MOUTH_CAP_STEPS + 1 }, (_, index) => {
    const angle = Math.PI / 2 + index / MOUTH_CAP_STEPS * Math.PI
    return {
      x: left.center.x + (Math.cos(angle) * left.tangent.x + Math.sin(angle) * left.normal.x) * halfHeight,
      y: left.center.y + (Math.cos(angle) * left.tangent.y + Math.sin(angle) * left.normal.y) * halfHeight
    }
  })
  return [...top, ...rightCap.slice(1), ...bottom.slice(1), ...leftCap.slice(1)]
    .map(point => rotateFacePoint(point, centerX, centerY, rotationDegrees))
}

const getFacePoint = (
  spec: AvatarBodyCompilerShapeSpec,
  point: Vec2,
  options: AvatarBodyGeometryOptions = {}
): Vec3 => {
  if (spec === SHAPE_SPECS.ellipse && (options.bottomTaper ?? 0) > 0) {
    const surfacePoint = getShapeFacePoint(spec, point, options)
    return { ...surfacePoint, z: surfacePoint.z + .8 }
  }
  const normalizedRadius = Math.min(
    point.x ** 2 / spec.radiusX ** 2 + point.y ** 2 / spec.radiusY ** 2,
    0.98
  )
  const curvedDepth = Math.sqrt(1 - normalizedRadius)
  const depth = spec.radiusZ * (1 - spec.faceCurvature * (1 - curvedDepth))
  return { x: point.x, y: point.y, z: depth + 0.8 }
}

const getFaceNormal = (
  spec: AvatarBodyCompilerShapeSpec,
  point: Vec2,
  options: AvatarBodyGeometryOptions = {}
): Vec3 => {
  if (spec === SHAPE_SPECS.ellipse && (options.bottomTaper ?? 0) > 0) {
    return getShapeFaceNormal(spec, point, options)
  }
  const surfacePoint = getFacePoint(spec, point, options)
  return normalize({
    x: point.x / spec.radiusX ** 2,
    y: point.y / spec.radiusY ** 2,
    z: surfacePoint.z / spec.radiusZ ** 2
  })
}

const inverseSignedPow = (value: number, exponent: number) => signedPow(value, 1 / exponent)

const getShapeFacePoint = (
  spec: AvatarBodyCompilerShapeSpec,
  point: Vec2,
  options: AvatarBodyGeometryOptions = {}
): Vec3 => {
  const normalizedY = clamp(point.y / spec.radiusY, -.995, .995)

  if (spec.profile === 'teardrop') {
    const vertical = normalizedY
    const latitude = Math.asin(clamp(inverseSignedPow(vertical, spec.exponent), -.995, .995))
    const progress = clamp((vertical + 1) / 2, 0, 1)
    const latitudeFactor = Math.max(Math.cos(latitude), 0) ** spec.exponent
    const widthTaper = interpolate(.46, 1.24, progress)
    const depthTaper = interpolate(.7, 1.12, progress)
    const longitude = Math.asin(clamp(inverseSignedPow(
      point.x / Math.max(spec.radiusX * widthTaper * latitudeFactor, .001),
      spec.exponent
    ), -.995, .995))
    return {
      x: spec.radiusX * widthTaper * latitudeFactor * signedPow(Math.sin(longitude), spec.exponent),
      y: spec.radiusY * vertical,
      z: spec.radiusZ * depthTaper * latitudeFactor * signedPow(Math.cos(longitude), spec.exponent)
    }
  }

  if (spec.profile === 'trapezoid') {
    const roundness = clamp(options.roundness ?? 72, 0, 100) / 100
    const exponent = interpolate(.34, .76, roundness)
    const vertical = normalizedY
    const latitude = Math.asin(clamp(inverseSignedPow(vertical, exponent), -.995, .995))
    const progress = clamp((vertical + 1) / 2, 0, 1)
    const latitudeFactor = Math.max(Math.cos(latitude), 0) ** exponent
    const horizontalTaper = interpolate(options.topScale ?? .82, 1.08, progress)
    const depthTaper = interpolate(.92, 1.04, progress)
    const longitude = Math.asin(clamp(inverseSignedPow(
      point.x / Math.max(spec.radiusX * horizontalTaper * latitudeFactor, .001),
      exponent
    ), -.995, .995))
    return {
      x: spec.radiusX * horizontalTaper * latitudeFactor * signedPow(Math.sin(longitude), exponent),
      y: spec.radiusY * vertical,
      z: spec.radiusZ * depthTaper * latitudeFactor * signedPow(Math.cos(longitude), exponent)
    }
  }

  if (spec.profile !== 'superellipsoid') {
    const progress = clamp((normalizedY + 1) / 2, 0, 1)
    const roundness = clamp(options.roundness ?? 24, 0, 100) / 100
    const easedProgress = progress * progress * (3 - 2 * progress)
    const taperedProgress = spec.profile === 'frustum'
      ? interpolate(progress, easedProgress, roundness * .55)
      : progress ** interpolate(1, .56, roundness)
    const tipRatio = spec.profile === 'frustum' ? .46 : 0
    const ringRadius = interpolate(tipRatio, 1, taperedProgress)
    const longitudeOffset = Math.asin(clamp(
      point.x / Math.max(spec.radiusX * ringRadius, .001),
      -.995,
      .995
    ))
    const sampledLongitude = spec.profile === 'half-cone'
      ? (options.cutAngle ?? 0) * Math.PI / 180 + longitudeOffset
      : longitudeOffset
    return {
      x: spec.radiusX * ringRadius * Math.sin(sampledLongitude),
      y: spec.radiusY * (progress * 2 - 1),
      z: spec.radiusZ * ringRadius * Math.cos(sampledLongitude)
    }
  }

  const latitude = Math.asin(clamp(inverseSignedPow(normalizedY, spec.exponent), -.995, .995))
  const latitudeFactor = Math.max(Math.cos(latitude), 0) ** spec.exponent
  const lowerTaper = resolveEllipseLowerTaper(spec, normalizedY, options)
  const longitude = Math.asin(clamp(inverseSignedPow(
    point.x / Math.max(spec.radiusX * latitudeFactor * lowerTaper, .001),
    spec.exponent
  ), -.995, .995))
  return {
    x: spec.radiusX * latitudeFactor * lowerTaper * signedPow(Math.sin(longitude), spec.exponent),
    y: spec.radiusY * signedPow(Math.sin(latitude), spec.exponent),
    z: spec.radiusZ * latitudeFactor * lowerTaper * signedPow(Math.cos(longitude), spec.exponent)
  }
}

const getShapeFaceNormal = (
  spec: AvatarBodyCompilerShapeSpec,
  point: Vec2,
  options: AvatarBodyGeometryOptions = {}
) => {
  const delta = .35
  const tangentX = subtract(
    getShapeFacePoint(spec, { x: point.x + delta, y: point.y }, options),
    getShapeFacePoint(spec, { x: point.x - delta, y: point.y }, options)
  )
  const tangentY = subtract(
    getShapeFacePoint(spec, { x: point.x, y: point.y + delta }, options),
    getShapeFacePoint(spec, { x: point.x, y: point.y - delta }, options)
  )
  return normalize(cross(tangentX, tangentY))
}

export const buildAvatarBodyGeometry = (
  bodyShape: AvatarBodyShape,
  pose: AvatarPose,
  lightDirection: AvatarLightDirection,
  gridDensity: number = AVATAR_GRID_DENSITY.default,
  options: AvatarBodyGeometryOptions = {}
): BodyGeometry => {
  const spec = SHAPE_SPECS[bodyShape]
  const vertices: Vec2[] = []
  const occlusionVertices: Vec2[] = []
  const cells: BodyCell[] = []
  const surfaceTriangles: BodySurfaceTriangle[] = []
  const azimuth = lightDirection.azimuth * Math.PI / 180
  const elevation = lightDirection.elevation * Math.PI / 180
  const lightVector = normalize({
    x: Math.cos(elevation) * Math.sin(azimuth),
    y: -Math.sin(elevation),
    z: Math.cos(elevation) * Math.cos(azimuth)
  })
  const densityScale = clamp(gridDensity, AVATAR_GRID_DENSITY.min, AVATAR_GRID_DENSITY.max) / 100
  const latitudeSteps = Math.max(Math.round(BASE_LATITUDE_STEPS * densityScale), 4)
  const longitudeSteps = Math.max(Math.round(BASE_LONGITUDE_STEPS * densityScale), 8)
  const outlineLatitudeSteps = OUTLINE_LATITUDE_STEPS
  const outlineLongitudeSteps = OUTLINE_LONGITUDE_STEPS
  const scaleX = options.scaleX ?? 1
  const scaleY = options.scaleY ?? 1
  const scaleZ = options.scaleZ ?? 1
  const compositorDensity = clamp(options.compositorDensity ?? 1, .5, 2)
  const compositorLatitudeSteps = Math.max(3, Math.round(COMPOSITOR_LATITUDE_STEPS * compositorDensity))
  const compositorLongitudeSteps = Math.max(6, Math.round(COMPOSITOR_LONGITUDE_STEPS * compositorDensity))
  const transformPoint = (point: Vec3) => rotate(rotateLocal({
    x: point.x * scaleX,
    y: point.y * scaleY,
    z: point.z * scaleZ
  }, options), pose)
  const transformNormal = (normal: Vec3) => rotate(rotateLocal(normalize({
    x: normal.x / scaleX,
    y: normal.y / scaleY,
    z: normal.z / scaleZ
  }), options), pose)

  const buildCompositorVertex = (longitude: number, latitude: number) => {
    const point = transformPoint(getSurfacePoint(spec, longitude, latitude, false, options))
    const normal = transformNormal(getSurfaceNormal(spec, longitude, latitude, false, options))
    const projectedPoint = project(point)
    return { depth: point.z, facing: normal.z, x: projectedPoint.x, y: projectedPoint.y }
  }
  const clipCompositorTriangle = (
    vertices: readonly { readonly depth: number; readonly facing: number; readonly x: number; readonly y: number }[]
  ) => {
    const clipped: { depth: number; facing: number; x: number; y: number }[] = []
    const minimumFacing = .015
    for (let index = 0; index < vertices.length; index += 1) {
      const previous = vertices[(index + vertices.length - 1) % vertices.length]!
      const current = vertices[index]!
      const previousVisible = previous.facing > minimumFacing
      const currentVisible = current.facing > minimumFacing
      if (previousVisible !== currentVisible) {
        const ratio = (minimumFacing - previous.facing) / (current.facing - previous.facing)
        clipped.push({
          depth: previous.depth + (current.depth - previous.depth) * ratio,
          facing: minimumFacing,
          x: previous.x + (current.x - previous.x) * ratio,
          y: previous.y + (current.y - previous.y) * ratio
        })
      }
      if (currentVisible) clipped.push(current)
    }
    return clipped
  }
  const appendCompositorTriangle = (
    id: string,
    source: readonly { readonly depth: number; readonly facing: number; readonly x: number; readonly y: number }[]
  ) => {
    const clipped = clipCompositorTriangle(source)
    for (let index = 1; index < clipped.length - 1; index += 1) {
      const rawVertices = [clipped[0]!, clipped[index]!, clipped[index + 1]!] as const
      const triangleVertices = rawVertices.map(({ depth, x, y }) => ({ depth, x, y })) as unknown as
        readonly [BodySurfaceVertex, BodySurfaceVertex, BodySurfaceVertex]
      const depths = triangleVertices.map(vertex => vertex.depth)
      const xs = triangleVertices.map(vertex => vertex.x)
      const ys = triangleVertices.map(vertex => vertex.y)
      surfaceTriangles.push({
        bounds: {
          maxX: Math.max(...xs),
          maxY: Math.max(...ys),
          minX: Math.min(...xs),
          minY: Math.min(...ys)
        },
        id: `${id}-${index - 1}`,
        maxDepth: Math.max(...depths),
        meanDepth: depths.reduce((total, depth) => total + depth, 0) / depths.length,
        minDepth: Math.min(...depths),
        vertices: triangleVertices
      })
    }
  }

  for (let latitudeIndex = 0; latitudeIndex < compositorLatitudeSteps; latitudeIndex += 1) {
    const latitudeStart = -Math.PI / 2 + latitudeIndex / compositorLatitudeSteps * Math.PI
    const latitudeEnd = -Math.PI / 2 + (latitudeIndex + 1) / compositorLatitudeSteps * Math.PI
    for (let longitudeIndex = 0; longitudeIndex < compositorLongitudeSteps; longitudeIndex += 1) {
      const longitudeStart = -Math.PI + longitudeIndex / compositorLongitudeSteps * Math.PI * 2
      const longitudeEnd = -Math.PI + (longitudeIndex + 1) / compositorLongitudeSteps * Math.PI * 2
      const corners = [
        buildCompositorVertex(longitudeStart, latitudeStart),
        buildCompositorVertex(longitudeEnd, latitudeStart),
        buildCompositorVertex(longitudeEnd, latitudeEnd),
        buildCompositorVertex(longitudeStart, latitudeEnd)
      ] as const
      appendCompositorTriangle(`${latitudeIndex}-${longitudeIndex}-a`, [corners[0], corners[1], corners[2]])
      appendCompositorTriangle(`${latitudeIndex}-${longitudeIndex}-b`, [corners[0], corners[2], corners[3]])
    }
  }

  for (let latitudeIndex = 0; latitudeIndex <= outlineLatitudeSteps; latitudeIndex += 1) {
    const latitude = -Math.PI / 2 + latitudeIndex / outlineLatitudeSteps * Math.PI
    const latitudeProgress = latitudeIndex / outlineLatitudeSteps
    for (let longitudeIndex = 0; longitudeIndex <= outlineLongitudeSteps; longitudeIndex += 1) {
      const longitude = -Math.PI + longitudeIndex / outlineLongitudeSteps * Math.PI * 2
      const projectedPoint = project(transformPoint(getSurfacePoint(spec, longitude, latitude, false, options)))
      vertices.push(projectedPoint)
      const occlusionAmount = clamp(options.occlusionAmount ?? 0, 0, 100) / 100
      const withinOcclusionCap = options.occlusionPole === 'top'
        ? latitudeProgress <= occlusionAmount
        : options.occlusionPole === 'bottom'
          ? latitudeProgress >= 1 - occlusionAmount
          : false
      if (withinOcclusionCap) occlusionVertices.push(projectedPoint)
    }
  }

  for (let latitudeIndex = 0; latitudeIndex < latitudeSteps; latitudeIndex += 1) {
    const latitudeStart = -Math.PI / 2 + latitudeIndex / latitudeSteps * Math.PI
    const latitudeEnd = -Math.PI / 2 + (latitudeIndex + 1) / latitudeSteps * Math.PI
    for (let longitudeIndex = 0; longitudeIndex < longitudeSteps; longitudeIndex += 1) {
      const longitudeStart = -Math.PI + longitudeIndex / longitudeSteps * Math.PI * 2
      const longitudeEnd = -Math.PI + (longitudeIndex + 1) / longitudeSteps * Math.PI * 2
      const normal = transformNormal(
        getSurfaceNormal(
          spec,
          (longitudeStart + longitudeEnd) / 2,
          (latitudeStart + latitudeEnd) / 2,
          false,
          options
        )
      )
      if (normal.z <= 0.015) continue

      const corners = [
        getSurfacePoint(spec, longitudeStart, latitudeStart, false, options),
        getSurfacePoint(spec, longitudeEnd, latitudeStart, false, options),
        getSurfacePoint(spec, longitudeEnd, latitudeEnd, false, options),
        getSurfacePoint(spec, longitudeStart, latitudeEnd, false, options)
      ].map(transformPoint)
      const shade = clamp(
        normal.x * lightVector.x + normal.y * lightVector.y + normal.z * lightVector.z,
        -1,
        1
      )

      cells.push({
        depth: corners.reduce((sum, point) => sum + point.z, 0) / corners.length,
        id: `${latitudeIndex}-${longitudeIndex}`,
        points: corners.map(point => toPointString(project(point))).join(' '),
        shade
      })
    }
  }

  const hull = convexHull(vertices)
  const occlusionHull = convexHull(occlusionVertices)
  const roundness = clamp(options.roundness ?? 24, 0, 100) / 100
  const apex = project(transformPoint(getSurfacePoint(spec, 0, -Math.PI / 2, false, options)))
  const outlinePath = spec.profile === 'cone' || spec.profile === 'half-cone'
    ? roundedVertexPolygonPath(hull, apex, 8 + roundness * 64)
    : spec.profile === 'frustum'
      ? roundedPolygonPath(hull, 4 + roundness * 22)
      : roundedPolygonPath(hull, 0)
  const cavityPoints = options.hollow && spec.profile !== 'superellipsoid'
    ? Array.from({ length: outlineLongitudeSteps + 1 }, (_, index) => {
        const longitude = -Math.PI + index / outlineLongitudeSteps * Math.PI * 2
        return project(transformPoint(getSurfacePoint(spec, longitude, Math.PI / 2, false, options)))
      })
    : []
  const cavityHull = convexHull(cavityPoints)
  const cavityCenter = cavityHull.length === 0
    ? null
    : cavityHull.reduce((center, point) => ({ x: center.x + point.x, y: center.y + point.y }), { x: 0, y: 0 })
  const cavityPath = cavityCenter == null
    ? undefined
    : (() => {
        const center = { x: cavityCenter.x / cavityHull.length, y: cavityCenter.y / cavityHull.length }
        const inset = cavityHull.map(point => ({
          x: center.x + (point.x - center.x) * .68,
          y: center.y + (point.y - center.y) * .68
        }))
        return `M ${inset.map(point => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')} Z`
      })()

  return {
    cells: cells.sort((left, right) => left.depth - right.depth),
    cavityPath,
    occlusionPath: occlusionHull.length === 0 ? undefined : roundedPolygonPath(occlusionHull, 0),
    outlinePoints: hull.map(point => ({ depth: 0, ...point })),
    outlinePath,
    surfaceTriangles
  }
}

export const resolveAvatarSurfaceShadeOpacity = (shade: number, lightDistance: number) => {
  const lightStrength = 1 - clamp(lightDistance, 0, 100) / 100
  const normalizedShade = Math.abs(clamp(shade, -1, 1))
  const contrast = shade >= 0 ? normalizedShade * 0.38 : normalizedShade ** 0.65 * 0.96
  return contrast * lightStrength
}

export const projectDefaultFace = (
  pose: AvatarPose,
  bodyShape: AvatarBodyShape,
  faceStyle: AvatarFaceStyle,
  options: AvatarBodyGeometryOptions = {}
): ProjectedFace => {
  const spec = SHAPE_SPECS[bodyShape]
  const resolvedFaceStyle = resolveAvatarFaceStyle(faceStyle)
  const scaleX = options.scaleX ?? 1
  const scaleY = options.scaleY ?? 1
  const scaleZ = options.scaleZ ?? 1
  const transformFacePoint = (point: Vec3) => rotate(rotateLocal({
    x: point.x * scaleX,
    y: point.y * scaleY,
    z: point.z * scaleZ
  }, options), pose)
  const transformFaceNormal = (normal: Vec3) => rotate(rotateLocal(normalize({
    x: normal.x / scaleX,
    y: normal.y / scaleY,
    z: normal.z / scaleZ
  }), options), pose)
  const projectPart = (
    id: string,
    centerX: number,
    centerY: number,
    boundary: readonly Vec2[]
  ): ProjectedEye | null => {
    const centerNormal = transformFaceNormal(getFaceNormal(spec, { x: centerX, y: centerY }, options))
    const visibleBoundary = clipPolygonToVisibleHemisphere(
      boundary.map(point => transformFacePoint(getFacePoint(spec, point, options)))
    )
    if (visibleBoundary.length < 3) return null
    const projectedBoundary = visibleBoundary.map(project)
    return {
      depth: clamp(centerNormal.z, 0, 1),
      id,
      path: `M ${projectedBoundary.map(point => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' L ')} Z`
    }
  }
  const eyeOffset = resolvedFaceStyle.gap / 2 + resolvedFaceStyle.width / 2
  const faceOffsetY = options.faceOffsetY ?? 0
  const eyeCenterY = faceOffsetY
  const eyeHighlights: ProjectedEye[] = []
  const eyes = [-eyeOffset, eyeOffset].flatMap((centerX, index) => {
    const eyeHeight = index === 0
      ? resolvedFaceStyle.leftEyeHeight ?? resolvedFaceStyle.height
      : resolvedFaceStyle.rightEyeHeight ?? resolvedFaceStyle.height
    const eyeWidth = index === 0
      ? resolvedFaceStyle.leftEyeWidth ?? resolvedFaceStyle.width
      : resolvedFaceStyle.rightEyeWidth ?? resolvedFaceStyle.width
    const eyeRotation = resolvedFaceStyle.rotation + (index === 0
      ? resolvedFaceStyle.leftEyeRotation
      : resolvedFaceStyle.rightEyeRotation)
    const boundary = resolvedFaceStyle.eyeShape === 'ellipse'
      ? buildEllipseBoundary(centerX, eyeCenterY, eyeWidth, eyeHeight, eyeRotation)
      : buildRoundedRectangleBoundary(
        centerX,
        eyeCenterY,
        eyeWidth,
        eyeHeight,
        eyeRotation,
        resolvedFaceStyle.eyeRoundness
      )
    const eye = projectPart(`eye-${index}`, centerX, eyeCenterY, boundary)
    if (eye != null && resolvedFaceStyle.eyeHighlight.enabled) {
      const rawHighlightCenter = {
        x: centerX + resolvedFaceStyle.width * resolvedFaceStyle.eyeHighlight.offsetX / 100,
        y: eyeCenterY + eyeHeight * resolvedFaceStyle.eyeHighlight.offsetY / 100
      }
      const highlightCenter = rotateFacePoint(rawHighlightCenter, centerX, eyeCenterY, eyeRotation)
      const diameter = Math.max(
        Math.min(resolvedFaceStyle.width, eyeHeight) * resolvedFaceStyle.eyeHighlight.size / 100,
        1
      )
      const highlight = projectPart(
        `eye-highlight-${index}`,
        highlightCenter.x,
        highlightCenter.y,
        buildEllipseBoundary(highlightCenter.x, highlightCenter.y, diameter, diameter, eyeRotation)
      )
      if (highlight != null) eyeHighlights.push(highlight)
    }
    return eye == null ? [] : [eye]
  })
  const noseBoundary = resolvedFaceStyle.noseShape === 'ellipse'
    ? buildEllipseBoundary(
      0,
      resolvedFaceStyle.noseY + faceOffsetY,
      resolvedFaceStyle.noseWidth,
      resolvedFaceStyle.noseHeight,
      resolvedFaceStyle.noseRotation
    )
    : resolvedFaceStyle.noseShape === 'rounded'
    ? buildRoundedRectangleBoundary(
      0,
      resolvedFaceStyle.noseY + faceOffsetY,
      resolvedFaceStyle.noseWidth,
      resolvedFaceStyle.noseHeight,
      resolvedFaceStyle.noseRotation
    )
    : buildRoundedInvertedTriangleBoundary(
      0,
      resolvedFaceStyle.noseY + faceOffsetY,
      resolvedFaceStyle.noseWidth,
      resolvedFaceStyle.noseHeight,
      resolvedFaceStyle.noseRotation
    )

  return {
    eyeHighlights,
    eyes,
    mouth: projectPart(
      'mouth',
      0,
      resolvedFaceStyle.mouthY,
      resolvedFaceStyle.mouthShape === 'curve'
        ? buildMouthBoundary(
          0,
          resolvedFaceStyle.mouthY,
          resolvedFaceStyle.mouthWidth,
          resolvedFaceStyle.mouthHeight,
          resolvedFaceStyle.mouthCurve,
          resolvedFaceStyle.mouthRotation
        )
        : resolvedFaceStyle.mouthShape === 'ellipse'
        ? buildEllipseBoundary(
          0,
          resolvedFaceStyle.mouthY,
          resolvedFaceStyle.mouthWidth,
          resolvedFaceStyle.mouthHeight,
          resolvedFaceStyle.mouthRotation
        )
        : resolvedFaceStyle.mouthShape === 'rounded'
        ? buildRoundedRectangleBoundary(
          0,
          resolvedFaceStyle.mouthY,
          resolvedFaceStyle.mouthWidth,
          resolvedFaceStyle.mouthHeight,
          resolvedFaceStyle.mouthRotation
        )
        : buildRoundedInvertedTriangleBoundary(
          0,
          resolvedFaceStyle.mouthY,
          resolvedFaceStyle.mouthWidth,
          resolvedFaceStyle.mouthHeight,
          resolvedFaceStyle.mouthRotation
        )
    ),
    nose: projectPart('nose', 0, resolvedFaceStyle.noseY, noseBoundary),
    visible: eyes.length > 0
  }
}

export const projectAvatarSurfaceDecal = (
  pose: AvatarPose,
  bodyShape: AvatarBodyShape,
  decal: AvatarSurfaceDecal,
  options: AvatarBodyGeometryOptions = {}
): ProjectedEye | null => {
  const spec = SHAPE_SPECS[bodyShape]
  const scaleX = options.scaleX ?? 1
  const scaleY = options.scaleY ?? 1
  const scaleZ = options.scaleZ ?? 1
  const orientToSurfaceSide = (point: Vec3): Vec3 => {
    if (decal.shape === 'radial-pleats') return point
    if (decal.side === 'back') return { x: point.x, y: point.y, z: -point.z }
    if (decal.side === 'left') return { x: -point.z, y: point.y, z: point.x }
    if (decal.side === 'right') return { x: point.z, y: point.y, z: -point.x }
    return point
  }
  const transformPoint = (point: Vec3) => {
    const orientedPoint = orientToSurfaceSide(point)
    return rotate(rotateLocal({
      x: orientedPoint.x * scaleX,
      y: orientedPoint.y * scaleY,
      z: orientedPoint.z * scaleZ
    }, options), pose)
  }
  const transformNormal = (normal: Vec3) => {
    const orientedNormal = orientToSurfaceSide(normal)
    return rotate(rotateLocal(normalize({
      x: orientedNormal.x / scaleX,
      y: orientedNormal.y / scaleY,
      z: orientedNormal.z / scaleZ
    }), options), pose)
  }
  const getLiftedSurfacePoint = (point: Vec2) => {
    if (decal.side === 'face') return getFacePoint(spec, point, options)
    const surfacePoint = getShapeFacePoint(spec, point, options)
    const surfaceNormal = getShapeFaceNormal(spec, point, options)
    return {
      x: surfacePoint.x + surfaceNormal.x * 1.2,
      y: surfacePoint.y + surfaceNormal.y * 1.2,
      z: surfacePoint.z + surfaceNormal.z * 1.2
    }
  }
  if (decal.shape === 'radial-pleats') {
    const rayCount = 12
    const samplesPerRay = 9
    const phase = decal.rotation * Math.PI / 180
    const curveRadians = decal.x * Math.PI / 180
    const startProgress = .06
    const endProgress = clamp(.2 + decal.height / 160, .3, .82)
    const angularHalfWidth = clamp(decal.width / spec.radiusX, .008, .08)
    const paths: string[] = []
    const visibleDepths: number[] = []

    for (let rayIndex = 0; rayIndex < rayCount; rayIndex += 1) {
      const baseLongitude = phase + rayIndex / rayCount * Math.PI * 2
      const curvedLongitude = (progress: number) => {
        const normalizedProgress = (progress - startProgress) / (endProgress - startProgress)
        const easedProgress = normalizedProgress * normalizedProgress * (3 - 2 * normalizedProgress)
        return baseLongitude + curveRadians * easedProgress
      }
      const centerProgress = (startProgress + endProgress) / 2
      const centerLongitude = curvedLongitude(centerProgress)
      const centerLatitude = ((startProgress + endProgress) / 2) * Math.PI - Math.PI / 2
      const centerNormal = transformNormal(getSurfaceNormal(
        spec,
        centerLongitude,
        centerLatitude,
        false,
        options
      ))
      const samples = Array.from({ length: samplesPerRay }, (_, sampleIndex) => {
        const progress = startProgress +
          sampleIndex / (samplesPerRay - 1) * (endProgress - startProgress)
        return {
          latitude: progress * Math.PI - Math.PI / 2,
          longitude: curvedLongitude(progress)
        }
      })
      const boundary = clipPolygonToVisibleHemisphere([
        ...samples.map(sample => getSurfacePoint(
          spec,
          sample.longitude - angularHalfWidth,
          sample.latitude,
          false,
          options
        )),
        ...[...samples].reverse().map(sample => getSurfacePoint(
          spec,
          sample.longitude + angularHalfWidth,
          sample.latitude,
          false,
          options
        ))
      ].map(transformPoint))
      if (boundary.length < 3) continue
      const projectedBoundary = boundary.map(project)

      paths.push(`M ${projectedBoundary.map(point => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' L ')} Z`)
      visibleDepths.push(centerNormal.z)
    }

    if (paths.length === 0) return null
    return {
      depth: clamp(
        visibleDepths.reduce((total, depth) => total + depth, 0) / visibleDepths.length,
        0,
        1
      ),
      id: decal.id,
      path: paths.join(' ')
    }
  }
  const centerNormal = transformNormal(decal.side === 'face'
    ? getFaceNormal(spec, { x: decal.x, y: decal.y }, options)
    : getShapeFaceNormal(spec, { x: decal.x, y: decal.y }, options))
  const boundary = buildAvatarSurfaceDecalLocalBoundary(decal) ??
    buildRoundedRectangleBoundary(decal.x, decal.y, decal.width, decal.height, decal.rotation, 100)
  const transformedBoundary = boundary.map(point => transformPoint(getLiftedSurfacePoint(point)))
  const visibleBoundary = clipPolygonToVisibleHemisphere(transformedBoundary)
  if (visibleBoundary.length < 3) return null
  const projectedBoundary = visibleBoundary.map(project)
  const assetTransform = decal.shape === 'claude-spark'
    ? (() => {
        const halfWidth = decal.width / 2
        const halfHeight = decal.height / 2
        const [topLeft, topRight, bottomLeft] = [
          { x: decal.x - halfWidth, y: decal.y - halfHeight },
          { x: decal.x + halfWidth, y: decal.y - halfHeight },
          { x: decal.x - halfWidth, y: decal.y + halfHeight }
        ].map(point => project(transformPoint(getLiftedSurfacePoint(
          rotateFacePoint(point, decal.x, decal.y, decal.rotation)
        ))))
        if (topLeft == null || topRight == null || bottomLeft == null) return null
        const size = CLAUDE_SPARK_VIEWBOX_SIZE
        const a = (topRight.x - topLeft.x) / size
        const b = (topRight.y - topLeft.y) / size
        const c = (bottomLeft.x - topLeft.x) / size
        const d = (bottomLeft.y - topLeft.y) / size
        return `matrix(${a.toFixed(6)} ${b.toFixed(6)} ${c.toFixed(6)} ${d.toFixed(6)} ${topLeft.x.toFixed(3)} ${topLeft.y.toFixed(3)})`
      })()
    : null
  return {
    depth: clamp(centerNormal.z, 0, 1),
    id: decal.id,
    path: decal.shape === 'claude-spark'
      ? CLAUDE_SPARK_PATH
      : `M ${projectedBoundary.map(point => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' L ')} Z`,
    ...(assetTransform == null ? {} : { transform: assetTransform })
  }
}
