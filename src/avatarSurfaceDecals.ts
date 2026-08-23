import { AVATAR_SURFACE_DECAL_RANGES } from '@oneworks/avatar'

export const AVATAR_SURFACE_DECAL_SHAPES = ['ellipse', 'rounded'] as const

export type AvatarSurfaceDecalShape = (typeof AVATAR_SURFACE_DECAL_SHAPES)[number]

export interface AvatarSurfaceDecal {
  readonly color: string
  readonly height: number
  readonly id: string
  readonly label: string
  readonly opacity: number
  readonly rotation: number
  readonly shape: AvatarSurfaceDecalShape
  readonly targetPartId: string | null
  readonly width: number
  readonly x: number
  readonly y: number
}

const isHexColor = (value: unknown): value is string => (
  typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)
)

const finite = (value: unknown, fallback: number, min: number, max: number) => (
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : fallback
)

export const createAvatarSurfaceDecal = (
  id: string,
  targetPartId: string | null = null
): AvatarSurfaceDecal => ({
  color: '#ffffff',
  height: 24,
  id,
  label: 'Surface decal',
  opacity: 100,
  rotation: 0,
  shape: 'ellipse',
  targetPartId,
  width: 36,
  x: 0,
  y: 0
})

export const serializeAvatarSurfaceDecals = (decals: readonly AvatarSurfaceDecal[]) => (
  JSON.stringify(decals.map(decal => [
    decal.id,
    decal.targetPartId,
    decal.shape,
    decal.x,
    decal.y,
    decal.width,
    decal.height,
    decal.rotation,
    decal.color,
    decal.opacity,
    decal.label
  ]))
)

export const deserializeAvatarSurfaceDecals = (
  value: string | null,
  targetPartIds?: readonly string[]
): AvatarSurfaceDecal[] => {
  if (value == null) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    const validTargets = targetPartIds == null ? null : new Set(targetPartIds)
    return parsed.flatMap(item => {
      if (!Array.isArray(item) || typeof item[0] !== 'string' || item[0].length === 0) return []
      if (item[1] != null && typeof item[1] !== 'string') return []
      if (!AVATAR_SURFACE_DECAL_SHAPES.includes(item[2] as AvatarSurfaceDecalShape)) return []
      if (!isHexColor(item[8])) return []
      const requestedTarget = typeof item[1] === 'string' && item[1].trim() !== '' ? item[1] : null
      const targetPartId = requestedTarget != null && (validTargets == null || validTargets.has(requestedTarget))
        ? requestedTarget
        : null
      return [{
        color: item[8].toLowerCase(),
        height: finite(
          item[6],
          24,
          AVATAR_SURFACE_DECAL_RANGES.height.min,
          AVATAR_SURFACE_DECAL_RANGES.height.max
        ),
        id: item[0],
        label: typeof item[10] === 'string' && item[10].trim() !== '' ? item[10] : item[0],
        opacity: finite(
          item[9],
          100,
          AVATAR_SURFACE_DECAL_RANGES.opacity.min,
          AVATAR_SURFACE_DECAL_RANGES.opacity.max
        ),
        rotation: finite(
          item[7],
          0,
          AVATAR_SURFACE_DECAL_RANGES.rotation.min,
          AVATAR_SURFACE_DECAL_RANGES.rotation.max
        ),
        shape: item[2] as AvatarSurfaceDecalShape,
        targetPartId,
        width: finite(
          item[5],
          36,
          AVATAR_SURFACE_DECAL_RANGES.width.min,
          AVATAR_SURFACE_DECAL_RANGES.width.max
        ),
        x: finite(item[3], 0, AVATAR_SURFACE_DECAL_RANGES.x.min, AVATAR_SURFACE_DECAL_RANGES.x.max),
        y: finite(item[4], 0, AVATAR_SURFACE_DECAL_RANGES.y.min, AVATAR_SURFACE_DECAL_RANGES.y.max)
      } satisfies AvatarSurfaceDecal]
    })
  } catch {
    return []
  }
}
