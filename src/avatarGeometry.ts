export const AVATAR_BODY_SHAPES = ['sphere', 'ellipse', 'square', 'rounded', 'capsule', 'diamond'] as const
export type AvatarBodyShape = (typeof AVATAR_BODY_SHAPES)[number]

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
  max: 400,
  min: 25
} as const

export interface AvatarFaceShadowStyle {
  readonly direction: number
  readonly distance: number
  readonly opacity: number
  readonly softness: number
}

export type AvatarEyeShape = 'ellipse' | 'rounded'
export type AvatarNoseShape = 'ellipse' | 'inverted-triangle' | 'rounded'

export interface AvatarFaceStyle {
  readonly eyeRoundness: number
  readonly eyeShape: AvatarEyeShape
  readonly gap: number
  readonly height: number
  readonly leftEyeRotation: number
  readonly mouthCurve: number
  readonly mouthEnabled: boolean
  readonly mouthHeight: number
  readonly mouthRotation: number
  readonly mouthWidth: number
  readonly mouthY: number
  readonly noseEnabled: boolean
  readonly noseHeight: number
  readonly noseRotation: number
  readonly noseShape: AvatarNoseShape
  readonly noseWidth: number
  readonly noseY: number
  readonly rotation: number
  readonly rightEyeRotation: number
  readonly width: number
}

export const DEFAULT_AVATAR_FACE_STYLE: AvatarFaceStyle = {
  eyeRoundness: 100,
  eyeShape: 'rounded',
  gap: 40,
  height: 64,
  leftEyeRotation: 0,
  mouthCurve: 45,
  mouthEnabled: false,
  mouthHeight: 12,
  mouthRotation: 0,
  mouthWidth: 52,
  mouthY: 52,
  noseEnabled: false,
  noseHeight: 18,
  noseRotation: 0,
  noseShape: 'inverted-triangle',
  noseWidth: 10,
  noseY: 14,
  rotation: 0,
  rightEyeRotation: 0,
  width: 28
}

export const resolveAvatarFaceStyle = (faceStyle: Partial<AvatarFaceStyle>): AvatarFaceStyle => {
  const resolved = { ...DEFAULT_AVATAR_FACE_STYLE, ...faceStyle }
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

export interface BodyGeometry {
  readonly cells: readonly BodyCell[]
  readonly outlinePath: string
}

export interface ProjectedFace {
  readonly eyes: readonly ProjectedEye[]
  readonly mouth: ProjectedEye | null
  readonly nose: ProjectedEye | null
  readonly visible: boolean
}

export interface ProjectedEye {
  readonly depth: number
  readonly id: string
  readonly path: string
}

interface ShapeSpec {
  readonly exponent: number
  readonly faceCurvature: number
  readonly faceScale: number
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

const VIEW_SIZE = 420
const CENTER_X = VIEW_SIZE / 2
const CENTER_Y = 202
const BASE_LATITUDE_STEPS = 14
const BASE_LONGITUDE_STEPS = 28
const OUTLINE_LATITUDE_STEPS = 28
const OUTLINE_LONGITUDE_STEPS = 72
const NORMAL_DELTA = 0.006
const EYE_CORNER_STEPS = 8
const FACE_EDGE_STEPS = 8
const ELLIPSE_STEPS = 40
const MOUTH_CURVE_STEPS = 28
const MOUTH_CAP_STEPS = 8
const TRIANGLE_EDGE_STEPS = 10

const SHAPE_SPECS: Readonly<Record<AvatarBodyShape, ShapeSpec>> = {
  capsule: { exponent: 0.52, faceCurvature: 0.52, faceScale: 0.52, radiusX: 150, radiusY: 109, radiusZ: 109 },
  diamond: { exponent: 1.65, faceCurvature: 0.72, faceScale: 1.12, radiusX: 139, radiusY: 139, radiusZ: 106 },
  ellipse: { exponent: 1, faceCurvature: 1, faceScale: 1, radiusX: 153, radiusY: 118, radiusZ: 122 },
  rounded: { exponent: 0.5, faceCurvature: 0.55, faceScale: 0.5, radiusX: 132, radiusY: 132, radiusZ: 116 },
  sphere: { exponent: 1, faceCurvature: 1, faceScale: 1, radiusX: 139, radiusY: 139, radiusZ: 139 },
  square: { exponent: 0.3, faceCurvature: 0.28, faceScale: 0.38, radiusX: 132, radiusY: 132, radiusZ: 108 }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const signedPow = (value: number, exponent: number) => Math.sign(value) * Math.abs(value) ** exponent

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

const project = (point: Vec3): Vec2 => ({
  x: CENTER_X + point.x,
  y: CENTER_Y + point.y
})

const getSurfacePoint = (
  spec: ShapeSpec,
  longitude: number,
  latitude: number,
  faceCoordinates = false
): Vec3 => {
  const scale = faceCoordinates ? spec.faceScale : 1
  const scaledLongitude = longitude * scale
  const scaledLatitude = latitude * scale
  const latitudeRadius = Math.max(Math.cos(scaledLatitude), 0)
  const latitudeFactor = latitudeRadius ** spec.exponent

  return {
    x: spec.radiusX * latitudeFactor * signedPow(Math.sin(scaledLongitude), spec.exponent),
    y: spec.radiusY * signedPow(Math.sin(scaledLatitude), spec.exponent),
    z: spec.radiusZ * latitudeFactor * signedPow(Math.cos(scaledLongitude), spec.exponent)
  }
}

const getSurfaceNormal = (
  spec: ShapeSpec,
  longitude: number,
  latitude: number,
  faceCoordinates = false
): Vec3 => {
  const center = getSurfacePoint(spec, longitude, latitude, faceCoordinates)
  const longitudePoint = getSurfacePoint(spec, longitude + NORMAL_DELTA, latitude, faceCoordinates)
  const latitudePoint = getSurfacePoint(spec, longitude, latitude + NORMAL_DELTA, faceCoordinates)
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

const sampleBoundaryEdge = (from: Vec2, to: Vec2) => {
  return Array.from({ length: TRIANGLE_EDGE_STEPS }, (_, index) => {
    const progress = index / TRIANGLE_EDGE_STEPS
    return {
      x: interpolate(from.x, to.x, progress),
      y: interpolate(from.y, to.y, progress)
    }
  })
}

const buildInvertedTriangleBoundary = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotationDegrees: number
): Vec2[] => {
  const points = [
    { x: centerX - width / 2, y: centerY - height / 2 },
    { x: centerX + width / 2, y: centerY - height / 2 },
    { x: centerX, y: centerY + height / 2 }
  ]
  return points.flatMap((point, index) => {
    const nextPoint = points[(index + 1) % points.length]!
    return sampleBoundaryEdge(point, nextPoint)
  }).map(point => rotateFacePoint(point, centerX, centerY, rotationDegrees))
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

const getFacePoint = (spec: ShapeSpec, point: Vec2): Vec3 => {
  const normalizedRadius = Math.min(
    point.x ** 2 / spec.radiusX ** 2 + point.y ** 2 / spec.radiusY ** 2,
    0.98
  )
  const curvedDepth = Math.sqrt(1 - normalizedRadius)
  const depth = spec.radiusZ * (1 - spec.faceCurvature * (1 - curvedDepth))
  return { x: point.x, y: point.y, z: depth + 0.8 }
}

const getFaceNormal = (spec: ShapeSpec, point: Vec2): Vec3 => {
  const surfacePoint = getFacePoint(spec, point)
  return normalize({
    x: point.x / spec.radiusX ** 2,
    y: point.y / spec.radiusY ** 2,
    z: surfacePoint.z / spec.radiusZ ** 2
  })
}

export const buildAvatarBodyGeometry = (
  bodyShape: AvatarBodyShape,
  pose: AvatarPose,
  lightDirection: AvatarLightDirection,
  gridDensity: number = AVATAR_GRID_DENSITY.default
): BodyGeometry => {
  const spec = SHAPE_SPECS[bodyShape]
  const vertices: Vec2[] = []
  const cells: BodyCell[] = []
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

  for (let latitudeIndex = 0; latitudeIndex <= OUTLINE_LATITUDE_STEPS; latitudeIndex += 1) {
    const latitude = -Math.PI / 2 + latitudeIndex / OUTLINE_LATITUDE_STEPS * Math.PI
    for (let longitudeIndex = 0; longitudeIndex <= OUTLINE_LONGITUDE_STEPS; longitudeIndex += 1) {
      const longitude = -Math.PI + longitudeIndex / OUTLINE_LONGITUDE_STEPS * Math.PI * 2
      vertices.push(project(rotate(getSurfacePoint(spec, longitude, latitude), pose)))
    }
  }

  for (let latitudeIndex = 0; latitudeIndex < latitudeSteps; latitudeIndex += 1) {
    const latitudeStart = -Math.PI / 2 + latitudeIndex / latitudeSteps * Math.PI
    const latitudeEnd = -Math.PI / 2 + (latitudeIndex + 1) / latitudeSteps * Math.PI
    for (let longitudeIndex = 0; longitudeIndex < longitudeSteps; longitudeIndex += 1) {
      const longitudeStart = -Math.PI + longitudeIndex / longitudeSteps * Math.PI * 2
      const longitudeEnd = -Math.PI + (longitudeIndex + 1) / longitudeSteps * Math.PI * 2
      const normal = rotate(
        getSurfaceNormal(spec, (longitudeStart + longitudeEnd) / 2, (latitudeStart + latitudeEnd) / 2),
        pose
      )
      if (normal.z <= 0.015) continue

      const corners = [
        getSurfacePoint(spec, longitudeStart, latitudeStart),
        getSurfacePoint(spec, longitudeEnd, latitudeStart),
        getSurfacePoint(spec, longitudeEnd, latitudeEnd),
        getSurfacePoint(spec, longitudeStart, latitudeEnd)
      ].map(point => rotate(point, pose))
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
  const outlinePath = hull.length === 0
    ? ''
    : `M ${hull.map(point => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')} Z`

  return {
    cells: cells.sort((left, right) => left.depth - right.depth),
    outlinePath
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
  faceStyle: AvatarFaceStyle
): ProjectedFace => {
  const spec = SHAPE_SPECS[bodyShape]
  const resolvedFaceStyle = resolveAvatarFaceStyle(faceStyle)
  const faceNormal = rotate({ x: 0, y: 0, z: 1 }, pose)
  const projectPart = (
    id: string,
    centerX: number,
    centerY: number,
    boundary: readonly Vec2[]
  ): ProjectedEye | null => {
    const centerNormal = rotate(getFaceNormal(spec, { x: centerX, y: centerY }), pose)
    if (centerNormal.z <= 0.015) return null

    const projectedBoundary = boundary.map(point => project(rotate(getFacePoint(spec, point), pose)))
    return {
      depth: clamp(centerNormal.z, 0, 1),
      id,
      path: `M ${projectedBoundary.map(point => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' L ')} Z`
    }
  }
  const eyeOffset = resolvedFaceStyle.gap / 2 + resolvedFaceStyle.width / 2
  const eyes = [-eyeOffset, eyeOffset].flatMap((centerX, index) => {
    const eyeRotation = resolvedFaceStyle.rotation + (index === 0
      ? resolvedFaceStyle.leftEyeRotation
      : resolvedFaceStyle.rightEyeRotation)
    const boundary = resolvedFaceStyle.eyeShape === 'ellipse'
      ? buildEllipseBoundary(centerX, 0, resolvedFaceStyle.width, resolvedFaceStyle.height, eyeRotation)
      : buildRoundedRectangleBoundary(
        centerX,
        0,
        resolvedFaceStyle.width,
        resolvedFaceStyle.height,
        eyeRotation,
        resolvedFaceStyle.eyeRoundness
      )
    const eye = projectPart(`eye-${index}`, centerX, 0, boundary)
    return eye == null ? [] : [eye]
  })
  const noseBoundary = faceStyle.noseShape === 'ellipse'
    ? buildEllipseBoundary(0, faceStyle.noseY, faceStyle.noseWidth, faceStyle.noseHeight, faceStyle.noseRotation)
    : faceStyle.noseShape === 'rounded'
    ? buildRoundedRectangleBoundary(
      0,
      faceStyle.noseY,
      faceStyle.noseWidth,
      faceStyle.noseHeight,
      faceStyle.noseRotation
    )
    : buildInvertedTriangleBoundary(
      0,
      faceStyle.noseY,
      faceStyle.noseWidth,
      faceStyle.noseHeight,
      faceStyle.noseRotation
    )

  return {
    eyes,
    mouth: projectPart(
      'mouth',
      0,
      faceStyle.mouthY,
      buildMouthBoundary(
        0,
        faceStyle.mouthY,
        faceStyle.mouthWidth,
        faceStyle.mouthHeight,
        faceStyle.mouthCurve,
        faceStyle.mouthRotation
      )
    ),
    nose: projectPart('nose', 0, faceStyle.noseY, noseBoundary),
    visible: faceNormal.z > 0.015
  }
}
