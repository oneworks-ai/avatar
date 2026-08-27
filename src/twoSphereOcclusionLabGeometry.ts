import { buildAvatarBodyGeometry } from './avatarGeometry'
import {
  buildAvatarFragmentRenderGraph,
  resolveFrontmostPartAtPoint,
  type AvatarFragmentRenderGraph,
  type AvatarProjectedPartSurface
} from './avatarFragmentRenderGraph'

export const TWO_SPHERE_RADIUS = 72
export const TWO_SPHERE_VIEW_RADIUS = 120
export const TWO_SPHERE_SOURCE_RADIUS = 139
const PRODUCTION_VIEW_CENTER_X = 210
const PRODUCTION_VIEW_CENTER_Y = 202

export interface TwoSpherePose {
  readonly pitch: number
  readonly yaw: number
}

export interface TwoSphereCenter {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface TwoSphereFixture {
  readonly centers: Readonly<Record<'black' | 'white', TwoSphereCenter>>
  readonly graph: AvatarFragmentRenderGraph
  readonly parts: readonly AvatarProjectedPartSurface[]
}

const LOCAL_CENTERS = {
  black: { x: -34, y: 0, z: -10 },
  white: { x: 34, y: 0, z: 10 }
} as const

const rotateCenter = (center: TwoSphereCenter, pose: TwoSpherePose): TwoSphereCenter => {
  const cosYaw = Math.cos(pose.yaw)
  const sinYaw = Math.sin(pose.yaw)
  const yawX = center.x * cosYaw + center.z * sinYaw
  const yawZ = -center.x * sinYaw + center.z * cosYaw
  const cosPitch = Math.cos(pose.pitch)
  const sinPitch = Math.sin(pose.pitch)
  return {
    x: yawX,
    y: center.y * cosPitch + yawZ * sinPitch,
    z: -center.y * sinPitch + yawZ * cosPitch
  }
}

export const resolveTwoSphereCenters = (pose: TwoSpherePose) => ({
  black: rotateCenter(LOCAL_CENTERS.black, pose),
  white: rotateCenter(LOCAL_CENTERS.white, pose)
})

const analyticSphereDepth = (center: TwoSphereCenter, x: number, y: number) => {
  const radialSquare = TWO_SPHERE_RADIUS ** 2 - (x - center.x) ** 2 - (y - center.y) ** 2
  return radialSquare < 0 ? null : center.z + Math.sqrt(radialSquare)
}

export const resolveAnalyticTwoSphereOwner = (
  pose: TwoSpherePose,
  x: number,
  y: number
): 'black' | 'white' | null => {
  const centers = resolveTwoSphereCenters(pose)
  const blackDepth = analyticSphereDepth(centers.black, x, y)
  const whiteDepth = analyticSphereDepth(centers.white, x, y)
  if (blackDepth == null) return whiteDepth == null ? null : 'white'
  if (whiteDepth == null) return 'black'
  return blackDepth > whiteDepth ? 'black' : 'white'
}

export const resolveAnalyticTwoSphereBoundaryX = (y: number) => {
  const radius = TWO_SPHERE_RADIUS
  const horizontalOffset = Math.abs(LOCAL_CENTERS.black.x)
  const depthOffset = Math.abs(LOCAL_CENTERS.black.z)
  const radicand = radius ** 2 - horizontalOffset ** 2 - depthOffset ** 2 - y ** 2
  if (radicand < 0) return null
  return -depthOffset / Math.sqrt(horizontalOffset ** 2 + depthOffset ** 2) * Math.sqrt(radicand)
}

export const buildTwoSphereFixture = (
  pose: TwoSpherePose,
  quality: 'full' | 'interactive' = 'full'
): TwoSphereFixture => {
  const geometry = buildAvatarBodyGeometry(
    'sphere',
    { pitch: 0, yaw: 0 },
    { azimuth: 0, elevation: 0 },
    100,
    {
      // Match the production two-surface structural compositor: interaction
      // may reduce visual detail, never the ownership topology.
      compositorDensity: 2,
      scaleX: TWO_SPHERE_RADIUS / TWO_SPHERE_SOURCE_RADIUS,
      scaleY: TWO_SPHERE_RADIUS / TWO_SPHERE_SOURCE_RADIUS,
      scaleZ: TWO_SPHERE_RADIUS / TWO_SPHERE_SOURCE_RADIUS
    }
  )
  const centers = resolveTwoSphereCenters(pose)
  const parts = (['black', 'white'] as const).map((id, index) => ({
    anchorDepth: centers[id].z,
    geometry,
    id,
    index,
    projectedX: centers[id].x,
    projectedY: centers[id].y
  }))
  return {
    centers,
    graph: buildAvatarFragmentRenderGraph(parts, { quality }),
    parts
  }
}

export const compareTwoSphereGraphWithAnalyticOwner = (
  fixture: TwoSphereFixture,
  pose: TwoSpherePose,
  step = 2
) => {
  let analyticOverlapSamples = 0
  let mismatchedOwnerSamples = 0
  let nullGraphOwnerSamples = 0
  for (let y = -TWO_SPHERE_VIEW_RADIUS; y <= TWO_SPHERE_VIEW_RADIUS; y += step) {
    for (let x = -TWO_SPHERE_VIEW_RADIUS; x <= TWO_SPHERE_VIEW_RADIUS; x += step) {
      const analyticOwner = resolveAnalyticTwoSphereOwner(pose, x, y)
      if (analyticOwner == null) continue
      analyticOverlapSamples += 1
      const graphOwner = resolveFrontmostPartAtPoint(
        fixture.graph,
        x + PRODUCTION_VIEW_CENTER_X,
        y + PRODUCTION_VIEW_CENTER_Y
      )?.partId ?? null
      if (graphOwner == null) nullGraphOwnerSamples += 1
      if (graphOwner !== analyticOwner) mismatchedOwnerSamples += 1
    }
  }
  return { analyticOverlapSamples, mismatchedOwnerSamples, nullGraphOwnerSamples }
}
