import './InteractiveAvatar.scss'

import { memo, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, WheelEvent } from 'react'

import { AVATAR_VIEW_RANGES } from '@oneworks/avatar'
import type { AvatarBackgroundStyle, AvatarPalette, AvatarPixelEffect } from '@oneworks/avatar'
import { applyAvatarColorGrade } from './avatarColorGrade'
import type { AvatarColorGrade } from './avatarColorGrade'
import { paintPixelatedAvatarCanvas } from './avatarPixelation'

import {
  createAvatarEntityParts,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene,
  resolveAvatarEntityPresetFaceStyle,
  resolveAvatarEntityPartScaleZ
} from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import {
  AVATAR_BODY_SHAPES,
  AVATAR_GRID_DENSITY,
  DEFAULT_AVATAR_FACE_SHADOW_STYLE,
  DEFAULT_AVATAR_FACE_STYLE,
  buildAvatarBodyGeometry,
  projectAvatarSurfaceDecal,
  projectDefaultFace,
  resolveAvatarFaceStyle,
  resolveAvatarSurfaceShadeOpacity
} from './avatarGeometry'
import type {
  AvatarBodyGeometryOptions,
  AvatarBodyShape,
  AvatarFaceShadowStyle,
  AvatarFaceStyle,
  AvatarLightDirection,
  AvatarPose,
  BodyGeometry,
  ProjectedFace
} from './avatarGeometry'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'
import { buildAvatarFragmentRenderGraph, resolveFrontmostPartAtPoint } from './avatarFragmentRenderGraph'

export { AVATAR_BODY_SHAPES }
export type { AvatarBodyShape }
export type AvatarInteractionMode = 'move' | 'rotate'

export interface AvatarDropShadowStyle {
  readonly color?: string
  readonly direction: number
  readonly distance: number
  readonly opacity: number
  readonly softness: number
}

export interface AvatarOutlineStyle {
  readonly color: string
  readonly opacity: number
  readonly width: number
}

export interface AvatarViewState {
  readonly pitch: number
  readonly positionX: number
  readonly positionY: number
  readonly roll: number
  readonly scale: number
  readonly yaw: number
}

export const AVATAR_VIEW_LIMITS = {
  maxPosition: AVATAR_VIEW_RANGES.positionX.max,
  maxScale: AVATAR_VIEW_RANGES.scale.max,
  minScale: AVATAR_VIEW_RANGES.scale.min
} as const

export const DEFAULT_AVATAR_VIEW_STATE: AvatarViewState = {
  pitch: 0,
  positionX: 0,
  positionY: 0,
  roll: 0,
  scale: 1.28,
  yaw: 0
}

export interface InteractiveAvatarProps {
  readonly colorGrade?: AvatarColorGrade
  readonly avatarOutlineStyle?: AvatarOutlineStyle
  readonly avatarShadowStyle?: AvatarDropShadowStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly bottomTaper?: number
  readonly entityParts?: readonly AvatarEntityPart[]
  readonly entityPreset?: AvatarEntityPreset
  readonly faceStyleTransitionsEnabled?: boolean
  readonly faceStyle: AvatarFaceStyle
  readonly gridDensity?: number
  readonly interactive?: boolean
  readonly interactionMode: AvatarInteractionMode
  readonly lightDistance?: number
  readonly lightDirection: AvatarLightDirection
  readonly onEntityPartSelect?: (id: string | null) => void
  readonly onInteractionStart?: () => void
  readonly onViewStateChange: (state: AvatarViewState) => void
  readonly palette: AvatarPalette
  readonly pixelEffect?: AvatarPixelEffect
  readonly renderSurfaceCells?: boolean
  readonly shadowStyle: AvatarFaceShadowStyle
  readonly selectedEntityPartId?: string | null
  readonly surfaceDecals?: readonly AvatarSurfaceDecal[]
  readonly showLight: boolean
  readonly showOutline?: boolean
  readonly showAvatarShadow?: boolean
  readonly showShadow: boolean
  readonly viewState: AvatarViewState
}

interface AvatarPosition {
  readonly x: number
  readonly y: number
}

interface ProjectedSurfaceDecal extends AvatarSurfaceDecal {
  readonly path: string
  readonly transform?: string
}

interface DragOrigin extends AvatarPose {
  readonly moved: boolean
  readonly mode: AvatarInteractionMode
  readonly pointerId: number
  readonly positionX: number
  readonly positionY: number
  readonly scale: number
  readonly selectable: boolean
  readonly selectionPartId: string | null
  readonly x: number
  readonly y: number
}

const VIEW_SIZE = 420
const ROTATION_PER_PIXEL = Math.PI / 280
const KEY_ROTATION = Math.PI / 12
const KEY_POSITION_MOVE = 8
const WHEEL_SCALE_SPEED = 0.0015
const FACE_STYLE_ANIMATION_MS = 180
const ENTITY_SELECTION_DRAG_THRESHOLD = 4

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const percentile = (values: readonly number[], ratio: number) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))]!
}
const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress

const ENTITY_PREVIEW_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 36,
  height: 54,
  width: 24
}

function EntityPrimitive({
  clipId,
  geometry,
  part,
  showBase = true,
  showLight,
  lightDistance
}: {
  readonly clipId: string
  readonly geometry: ReturnType<typeof buildAvatarBodyGeometry>
  readonly part: AvatarEntityPart
  readonly showBase?: boolean
  readonly showLight: boolean
  readonly lightDistance: number
}) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={geometry.outlinePath} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {showBase ? <path d={geometry.outlinePath} fill={part.baseColor} /> : null}
        {showLight
          ? geometry.cells.map(cell => (
            <polygon
              key={cell.id}
              points={cell.points}
              fill={cell.shade >= 0 ? part.highlightColor : part.shadowColor}
              fillOpacity={resolveAvatarSurfaceShadeOpacity(cell.shade, lightDistance)}
            />
          ))
          : null}
      </g>
    </>
  )
}

const getEntityPartGeometryOptions = (
  part: AvatarEntityPart,
  compositorDensity: number = 2
): AvatarBodyGeometryOptions => ({
  bottomTaper: part.bottomTaper,
  compositorDensity,
  cutAngle: part.cutAngle,
  hollow: part.hollow,
  occlusionAmount: part.occlusionAmount,
  occlusionPole: part.occlusionPole,
  rotationX: part.rotationX,
  rotationY: part.rotationY,
  rotationZ: part.rotationZ,
  roundness: part.roundness,
  scaleX: part.scaleX,
  scaleY: part.scaleY,
  scaleZ: resolveAvatarEntityPartScaleZ(part),
  topScale: part.topScale
})

const getEntityFaceGeometryOptions = (
  part: AvatarEntityPart,
  preset: AvatarEntityPreset
): AvatarBodyGeometryOptions => ({
  ...getEntityPartGeometryOptions(part),
  faceOffsetY: preset === 'dog' ? -22 : undefined
})

const buildEntityPartGeometry = (
  part: AvatarEntityPart,
  pose: AvatarPose,
  lightDirection: AvatarLightDirection,
  gridDensity: number,
  compositorDensity: number
) => buildAvatarBodyGeometry(
  part.shape,
  pose,
  lightDirection,
  gridDensity,
  getEntityPartGeometryOptions(part, compositorDensity)
)

const entityPartGeometryCache = new WeakMap<readonly AvatarEntityPart[], Map<string, Record<string, BodyGeometry>>>()

const buildEntityPartGeometries = (
  parts: readonly AvatarEntityPart[],
  pose: AvatarPose,
  lightDirection: AvatarLightDirection,
  gridDensity: number,
  compositorDensity: number
): Record<string, BodyGeometry> => {
  const cacheKey = [
    pose.pitch.toFixed(5),
    pose.yaw.toFixed(5),
    lightDirection.azimuth.toFixed(3),
    lightDirection.elevation.toFixed(3),
    gridDensity,
    compositorDensity.toFixed(3)
  ].join(':')
  const partCache = entityPartGeometryCache.get(parts) ?? new Map<string, Record<string, BodyGeometry>>()
  entityPartGeometryCache.set(parts, partCache)
  const cachedGeometries = partCache.get(cacheKey)
  if (cachedGeometries != null) {
    partCache.delete(cacheKey)
    partCache.set(cacheKey, cachedGeometries)
    return cachedGeometries
  }
  const cache = new Map<string, BodyGeometry>()
  const geometries = Object.fromEntries(parts.map(part => {
    const geometryKey = JSON.stringify([
      part.shape,
      part.rotationX ?? 0,
      part.rotationY ?? 0,
      part.rotationZ ?? 0,
      part.roundness ?? 24,
      part.cutAngle ?? 0,
      part.hollow ?? false,
      part.occlusionAmount ?? 0,
      part.occlusionPole ?? null,
      part.bottomTaper ?? 0,
      part.topScale ?? null,
      compositorDensity,
      part.scaleX,
      part.scaleY,
      resolveAvatarEntityPartScaleZ(part)
    ])
    let geometry = cache.get(geometryKey)
    if (geometry == null) {
      geometry = buildEntityPartGeometry(part, pose, lightDirection, gridDensity, compositorDensity)
      cache.set(geometryKey, geometry)
    }
    return [part.id, geometry]
  }))
  partCache.set(cacheKey, geometries)
  if (partCache.size > 8) partCache.delete(partCache.keys().next().value!)
  return geometries
}

function EntityPresetBody({
  avatarOutlineStyle,
  face,
  faceStyle,
  fragmentGeometries,
  geometries,
  idPrefix,
  interactive,
  interactiveQuality = false,
  isDragging = false,
  lightDistance,
  partHitResolverRef,
  parts,
  pose,
  preset,
  renderSurfaceCells,
  selectedPartId,
  shadowStyle,
  surfaceDecals,
  showGrid,
  showLight,
  showOutline,
  showShadow
}: {
  readonly avatarOutlineStyle?: AvatarOutlineStyle
  readonly face: ProjectedFace
  readonly faceStyle: AvatarFaceStyle
  readonly fragmentGeometries?: Readonly<Record<string, BodyGeometry>>
  readonly geometries: Readonly<Record<string, BodyGeometry>>
  readonly idPrefix: string
  readonly interactive: boolean
  readonly interactiveQuality?: boolean
  readonly isDragging?: boolean
  readonly lightDistance: number
  readonly partHitResolverRef?: { current: ((x: number, y: number) => string | null) | null }
  readonly parts: readonly AvatarEntityPart[]
  readonly pose: AvatarPose
  readonly preset: AvatarEntityPreset
  readonly renderSurfaceCells: boolean
  readonly selectedPartId?: string | null
  readonly shadowStyle: AvatarFaceShadowStyle
  readonly surfaceDecals: readonly ProjectedSurfaceDecal[]
  readonly showGrid: boolean
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showShadow: boolean
}) {
  const cosYaw = Math.cos(pose.yaw)
  const sinYaw = Math.sin(pose.yaw)
  const cosPitch = Math.cos(pose.pitch)
  const sinPitch = Math.sin(pose.pitch)
  const projectedPartSurfaces = useMemo(() => parts.map((part, index) => {
    const yawX = part.x * cosYaw + part.z * sinYaw
    const yawZ = -part.x * sinYaw + part.z * cosYaw
    return {
      ...part,
      anchorDepth: -part.y * sinPitch + yawZ * cosPitch,
      geometry: (fragmentGeometries ?? geometries)[part.id],
      index,
      projectedX: yawX,
      projectedY: part.y * cosPitch + yawZ * sinPitch,
      occludedByFaceHint: part.occludedByFace
    }
  }), [cosPitch, cosYaw, fragmentGeometries, geometries, parts, sinPitch, sinYaw])
  const fragmentGraphBuildCountRef = useRef(0)
  const fragmentDragBuildSamplesRef = useRef<number[]>([])
  const fragmentReleaseBuildMsRef = useRef(0)
  const fragmentSettleBuildMsRef = useRef(0)
  const fragmentPreviousBuildWasDraggingRef = useRef(false)
  const fragmentPreviousInteractiveQualityRef = useRef(false)
  const fragmentGraphBuild = useMemo(() => {
    const startedAt = performance.now()
    const graph = buildAvatarFragmentRenderGraph(projectedPartSurfaces, {
      quality: interactiveQuality ? 'interactive' : 'full'
    })
    const duration = performance.now() - startedAt
    fragmentGraphBuildCountRef.current += 1
    if (isDragging) {
      if (!fragmentPreviousBuildWasDraggingRef.current) fragmentDragBuildSamplesRef.current = []
      fragmentDragBuildSamplesRef.current.push(duration)
      if (fragmentDragBuildSamplesRef.current.length > 512) fragmentDragBuildSamplesRef.current.shift()
    } else if (fragmentPreviousBuildWasDraggingRef.current) {
      fragmentReleaseBuildMsRef.current = duration
    }
    if (!interactiveQuality && fragmentPreviousInteractiveQualityRef.current) {
      fragmentSettleBuildMsRef.current = duration
    }
    fragmentPreviousBuildWasDraggingRef.current = isDragging
    fragmentPreviousInteractiveQualityRef.current = interactiveQuality
    return { duration, graph }
  }, [interactiveQuality, isDragging, projectedPartSurfaces])
  const fragmentGraph = fragmentGraphBuild.graph
  const fragmentDragBuildSamples = fragmentDragBuildSamplesRef.current
  const fragmentDragBuildMean = fragmentDragBuildSamples.length === 0
    ? 0
    : fragmentDragBuildSamples.reduce((total, sample) => total + sample, 0) / fragmentDragBuildSamples.length
  if (partHitResolverRef != null) {
    partHitResolverRef.current = (x, y) => resolveFrontmostPartAtPoint(fragmentGraph, x, y)?.partId ?? null
  }
  const projectedPartById = new Map(projectedPartSurfaces.map(part => [part.id, part]))
  const projectedParts = fragmentGraph.nodes.map(node => ({
    ...projectedPartById.get(node.partId)!,
    depth: node.depth,
    fragmentNode: node
  }))
  const outlineWidth = avatarOutlineStyle?.width ?? 0
  const outlineEnabled = showOutline && avatarOutlineStyle != null && outlineWidth > 0
  const facePart = projectedParts.find(part => part.face) ?? projectedParts.at(-1)
  const selectedPart = projectedParts.find(part => part.id === selectedPartId)
  // Keep the authored selection while it rotates behind the head, but only draw
  // interaction overlays when the same fragment ownership graph used for paint
  // and hit-testing still assigns a visible region to the selected anatomy.
  const selectedPartIsVisible = selectedPart != null && selectedPart.fragmentNode.interactionVisibleArea > 0
  const partTransform = (part: (typeof projectedParts)[number]) => (
    `translate(${part.projectedX} ${part.projectedY})`
  )
  const visibilityMaskId = (part: (typeof projectedParts)[number]) => (
    `${idPrefix}-entity-visibility-${part.index}`
  )
  const visibilityMask = (part: (typeof projectedParts)[number]) => (
    part.fragmentNode.occlusionPath == null ? undefined : `url(#${visibilityMaskId(part)})`
  )
  const interactionClipId = (part: (typeof projectedParts)[number]) => (
    `${idPrefix}-entity-interaction-${part.index}`
  )
  const sharedPaintClipId = (part: (typeof projectedParts)[number]) => (
    `${idPrefix}-entity-shared-paint-${part.index}`
  )
  const shadowDirection = shadowStyle.direction * Math.PI / 180
  const faceShadowTransform = (depth: number) => {
    const distance = shadowStyle.distance * depth
    return `translate(${(Math.cos(shadowDirection) * distance).toFixed(2)} ${
      (Math.sin(shadowDirection) * distance).toFixed(2)
    })`
  }
  const renderFaceSurfaceLayer = (part: (typeof projectedParts)[number]) => {
    if (!face.visible || facePart == null || part.id !== facePart.id) return null
    return (
      <g data-avatar-face-surface-layer={part.id}>
        {showShadow
          ? face.eyes.map(eye => (
            <path
              key={`shadow-${eye.id}`}
              d={eye.path}
              transform={faceShadowTransform(eye.depth)}
              fill={shadowStyle.color ?? facePart.shadowColor}
              filter={shadowStyle.softness > 0 ? `url(#${idPrefix}-entity-face-shadow)` : undefined}
              opacity={shadowStyle.opacity / 100 * eye.depth ** 2}
            />
          ))
          : null}
        {face.eyes.map(eye => <path key={eye.id} data-avatar-face-feature={eye.id} d={eye.path} fill={facePart.foregroundColor} />)}
        {face.eyeHighlights.map(highlight => (
          <path
            key={highlight.id}
            data-avatar-eye-highlight={highlight.id}
            data-avatar-face-feature={highlight.id}
            clipPath={`url(#${idPrefix}-entity-${highlight.id.replace('eye-highlight-', 'eye-')}-highlight-clip)`}
            d={highlight.path}
            fill={faceStyle.eyeHighlight.color}
            fillOpacity={faceStyle.eyeHighlight.opacity / 100}
          />
        ))}
        {!faceStyle.noseEnabled || face.nose == null
          ? null
          : (
            <>
              {showShadow
                ? (
                  <path
                    d={face.nose.path}
                    transform={faceShadowTransform(face.nose.depth)}
                    fill={shadowStyle.color ?? facePart.shadowColor}
                    filter={shadowStyle.softness > 0 ? `url(#${idPrefix}-entity-face-shadow)` : undefined}
                    opacity={shadowStyle.opacity / 100 * face.nose.depth ** 2}
                  />
                )
                : null}
              <path data-avatar-face-feature='nose' d={face.nose.path} fill={facePart.foregroundColor} />
            </>
          )}
        {!faceStyle.mouthEnabled || face.mouth == null
          ? null
          : (
            <>
              {showShadow
                ? (
                  <path
                    d={face.mouth.path}
                    transform={faceShadowTransform(face.mouth.depth)}
                    fill={shadowStyle.color ?? facePart.shadowColor}
                    filter={shadowStyle.softness > 0 ? `url(#${idPrefix}-entity-face-shadow)` : undefined}
                    opacity={shadowStyle.opacity / 100 * face.mouth.depth ** 2}
                  />
                )
                : null}
              <path data-avatar-face-feature='mouth' d={face.mouth.path} fill={facePart.foregroundColor} />
            </>
          )}
      </g>
    )
  }

  return (
    <g
      data-avatar-entity-fragment-root='true'
      data-avatar-entity-preset={preset}
      data-avatar-fragment-build-count={fragmentGraphBuildCountRef.current}
      data-avatar-fragment-build-ms={fragmentGraphBuild.duration.toFixed(3)}
      data-avatar-fragment-drag-build-max-ms={Math.max(0, ...fragmentDragBuildSamples).toFixed(3)}
      data-avatar-fragment-drag-build-mean-ms={fragmentDragBuildMean.toFixed(3)}
      data-avatar-fragment-drag-build-p95-ms={percentile(fragmentDragBuildSamples, .95).toFixed(3)}
      data-avatar-fragment-drag-build-samples={fragmentDragBuildSamples.length}
      data-avatar-fragment-quality={interactiveQuality ? 'interactive' : 'full'}
      data-avatar-fragment-revision={fragmentGraph.cacheKey}
      data-avatar-fragment-release-build-ms={fragmentReleaseBuildMsRef.current.toFixed(3)}
      data-avatar-fragment-settle-build-ms={fragmentSettleBuildMsRef.current.toFixed(3)}
      data-avatar-fragment-intersections={fragmentGraph.metrics.intersectingPartCount}
      data-avatar-fragment-path-characters={fragmentGraph.metrics.occlusionPathCharacterCount}
      data-avatar-fragment-patches={fragmentGraph.metrics.occlusionPatchCount}
      data-avatar-fragment-raster-error={fragmentGraph.metrics.rasterizationErrorRatio.toFixed(6)}
      data-avatar-fragment-raster-measured={fragmentGraph.metrics.rasterizationMeasured}
      data-avatar-fragment-segments={fragmentGraph.metrics.occlusionSegmentCount}
    >
      <defs>
        <filter id={`${idPrefix}-entity-face-shadow`} x='-50%' y='-50%' width='200%' height='200%'>
          <feGaussianBlur stdDeviation={shadowStyle.softness} />
        </filter>
        {outlineEnabled
          ? (
            <filter id={`${idPrefix}-entity-outline`} x='-30%' y='-30%' width='160%' height='160%'>
              <feMorphology in='SourceAlpha' operator='dilate' radius={outlineWidth / 2} result='expanded' />
              <feFlood floodColor={avatarOutlineStyle.color} floodOpacity={avatarOutlineStyle.opacity / 100} />
              <feComposite in2='expanded' operator='in' />
              <feMerge>
                <feMergeNode />
                <feMergeNode in='SourceGraphic' />
              </feMerge>
            </filter>
          )
          : null}
        {projectedParts.filter(part => part.fragmentNode.occlusionPath != null).map(part => (
            <mask
              key={`visibility-mask-${part.id}`}
              id={visibilityMaskId(part)}
              x={-VIEW_SIZE}
              y={-VIEW_SIZE}
              width={VIEW_SIZE * 3}
              height={VIEW_SIZE * 3}
              maskUnits='userSpaceOnUse'
            >
              <rect x={-VIEW_SIZE} y={-VIEW_SIZE} width={VIEW_SIZE * 3} height={VIEW_SIZE * 3} fill='white' />
              <path
                data-avatar-fragment-occlusion-overdraw={part.id}
                d={part.fragmentNode.occlusionPath}
                fill='black'
                {...(fragmentGraph.compositionMode === 'shared-pair'
                  ? {}
                  : {
                      stroke: 'white',
                      strokeLinejoin: 'round' as const,
                      strokeWidth: Math.min(2, Math.max(.8, part.fragmentNode.boundaryCellDiagonal * .45))
                    })}
              />
            </mask>
        ))}
        {projectedParts.filter(part => part.fragmentNode.sharedPaintPath != null).map(part => (
          <clipPath
            key={`shared-paint-clip-${fragmentGraph.cacheKey}-${part.id}`}
            id={sharedPaintClipId(part)}
            clipPathUnits='userSpaceOnUse'
          >
            <path
              data-avatar-fragment-shared-paint={part.id}
              d={part.fragmentNode.sharedPaintPath}
            />
          </clipPath>
        ))}
        {projectedParts.filter(part => part.fragmentNode.interactionVisiblePath != null).map(part => (
          <clipPath
            key={`interaction-clip-${fragmentGraph.cacheKey}-${part.id}`}
            id={interactionClipId(part)}
            clipPathUnits='userSpaceOnUse'
          >
            <path
              d={part.fragmentNode.interactionVisiblePath}
              clipRule='evenodd'
              fillRule='evenodd'
            />
          </clipPath>
        ))}
        {face.eyes.map(eye => (
          <clipPath key={`highlight-clip-${eye.id}`} id={`${idPrefix}-entity-${eye.id}-highlight-clip`}>
            <path d={eye.path} />
          </clipPath>
        ))}
      </defs>
      <g filter={outlineEnabled ? `url(#${idPrefix}-entity-outline)` : undefined}>
        {fragmentGraph.compositionMode === 'shared-pair'
          ? null
          : (
            <g data-avatar-entity-undercoat pointerEvents='none'>
              {projectedParts.map(part => (
                <g key={`undercoat-${part.id}`} transform={partTransform(part)}>
                  <path
                    d={geometries[part.id].outlinePath}
                    fill={part.baseColor}
                  />
                </g>
              ))}
            </g>
          )}
        {projectedParts.map(part => (
          <g
            key={part.id}
            data-avatar-entity-part={part.id}
            data-avatar-fragment-intersects={part.fragmentNode.intersects}
            data-avatar-fragment-patches={part.fragmentNode.occlusionPatchCount}
            data-avatar-fragment-interaction-area={String(part.fragmentNode.interactionVisibleArea)}
            data-avatar-fragment-interaction-ratio={String(part.fragmentNode.interactionVisibleRatio)}
            data-avatar-fragment-projected-area={String(part.fragmentNode.projectedAreaEstimate)}
            data-avatar-fragment-visible-area={String(part.fragmentNode.visibleAreaEstimate)}
            mask={part.fragmentNode.sharedPaintPath == null ? visibilityMask(part) : undefined}
            pointerEvents={interactive ? 'none' : undefined}
          >
            <g clipPath={part.fragmentNode.sharedPaintPath == null
              ? undefined
              : `url(#${sharedPaintClipId(part)})`}
            >
              <g transform={partTransform(part)}>
                <EntityPrimitive
                  clipId={`${idPrefix}-entity-${preset}-${part.index}`}
                  geometry={geometries[part.id]}
                  part={part}
                  showLight={showLight && renderSurfaceCells && (part.face || part.scaleX * part.scaleY >= .075)}
                  lightDistance={lightDistance}
                />
                <g clipPath={`url(#${idPrefix}-entity-${preset}-${part.index})`}>
                  {surfaceDecals.filter(decal => decal.targetPartId === part.id).map(decal => (
                    <path
                      key={decal.id}
                      data-avatar-surface-decal={decal.id}
                      d={decal.path}
                      fill={decal.color}
                      fillOpacity={decal.opacity / 100}
                      transform={decal.transform}
                    />
                  ))}
                  {renderFaceSurfaceLayer(part)}
                </g>
                {geometries[part.id].cavityPath == null
                  ? null
                  : (
                    <path
                      data-avatar-entity-cavity={part.id}
                      d={geometries[part.id].cavityPath}
                      fill={part.shadowColor}
                      fillOpacity='.9'
                    />
                  )}
              </g>
            </g>
          </g>
        ))}
      </g>
      {showGrid && selectedPartIsVisible
        ? [selectedPart].map(part => (
          <g
            key={`grid-${part.index}`}
            data-avatar-entity-grid={part.id}
            clipPath={`url(#${interactionClipId(part)})`}
            pointerEvents='none'
          >
            <g transform={partTransform(part)}>
              {geometries[part.id].cells.map(cell => (
                <polygon
                  key={cell.id}
                  points={cell.points}
                  fill='none'
                  stroke='#fff'
                  strokeOpacity='.09'
                  strokeWidth='.55'
                />
              ))}
            </g>
          </g>
        ))
        : null}
      {interactive && selectedPartIsVisible
        ? (
          <g
            key={`selection-${fragmentGraph.cacheKey}-${selectedPart.id}`}
            data-avatar-entity-selection={selectedPart.id}
            data-avatar-fragment-interaction-area={String(selectedPart.fragmentNode.interactionVisibleArea)}
            data-avatar-fragment-interaction-ratio={String(selectedPart.fragmentNode.interactionVisibleRatio)}
            pointerEvents='none'
          >
            <path
              d={selectedPart.fragmentNode.interactionVisiblePath}
              fill='none'
              fillRule='evenodd'
              stroke='var(--primary-color)'
              strokeDasharray='5 4'
              strokeLinejoin='round'
              strokeWidth={2}
            />
          </g>
        )
        : null}
    </g>
  )
}

export const EntityPresetPreview = memo(function EntityPresetPreview({
  entityParts,
  faceStyle: providedFaceStyle,
  lightDirection,
  preset,
  previewBackground,
  surfaceDecals: providedSurfaceDecals
}: {
  readonly entityParts?: readonly AvatarEntityPart[]
  readonly faceStyle?: Partial<AvatarFaceStyle>
  readonly lightDirection: AvatarLightDirection
  readonly preset: Exclude<AvatarEntityPreset, 'custom'>
  readonly previewBackground?: string
  readonly surfaceDecals?: readonly AvatarSurfaceDecal[]
}) {
  const rawId = useId()
  const id = rawId.replaceAll(':', '')
  const scene = useMemo(() => getAvatarEntityPresetScene(preset), [preset])
  const pose = useMemo<AvatarPose>(() =>
    scene == null
      ? { pitch: -.22, yaw: -.38 }
      : { pitch: scene.viewState.pitch, yaw: scene.viewState.yaw }, [scene])
  const parts = useMemo(
    () => entityParts ?? createAvatarEntityParts(preset),
    [entityParts, preset]
  )
  const faceStyle = useMemo(
    () => resolveAvatarEntityPresetFaceStyle(preset, providedFaceStyle) ?? ENTITY_PREVIEW_FACE_STYLE,
    [preset, providedFaceStyle]
  )
  const surfaceDecals = useMemo<ProjectedSurfaceDecal[]>(() =>
    (providedSurfaceDecals ?? scene?.surfaceDecals ?? []).flatMap(decal => {
      const targetPart = decal.targetPartId == null
        ? parts.find(part => part.face)
        : parts.find(part => part.id === decal.targetPartId)
      if (targetPart == null) return []
      const projected = projectAvatarSurfaceDecal(
        pose,
        targetPart.shape,
        decal,
        getEntityFaceGeometryOptions(targetPart, preset)
      )
      return projected == null ? [] : [{
        ...decal,
        path: projected.path,
        targetPartId: targetPart.id,
        ...(projected.transform == null ? {} : { transform: projected.transform })
      }]
    }), [parts, pose, preset, providedSurfaceDecals, scene])
  const geometries = useMemo(
    () => buildEntityPartGeometries(parts, pose, lightDirection, 25, 1),
    [lightDirection, parts, pose]
  )
  const facePart = parts.find(part => part.face)
  const face = useMemo(
    () =>
      projectDefaultFace(
        pose,
        facePart?.shape ?? 'sphere',
        faceStyle,
        facePart == null ? {} : getEntityFaceGeometryOptions(facePart, preset)
      ),
    [facePart, faceStyle, pose, preset]
  )
  const previewTransform = scene == null
    ? 'translate(210 210) scale(1.05) translate(-210 -210)'
    : `translate(${scene.viewState.positionX} ${scene.viewState.positionY}) translate(210 210) rotate(${
      scene.viewState.roll * 180 / Math.PI
    }) scale(${scene.viewState.scale}) translate(-210 -210)`
  const shadowDirection = (scene?.avatarShadowStyle.direction ?? 0) * Math.PI / 180
  return (
    <svg className='avatar-controls__entity-preset-icon' viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} aria-hidden='true'>
      {scene == null
        ? null
        : <rect width={VIEW_SIZE} height={VIEW_SIZE} rx='34' fill={previewBackground ?? scene.cameraBackground} />}
      {scene == null
        ? null
        : (
          <defs>
            <filter id={`${id}-preview-avatar-shadow`} x='-100%' y='-100%' width='300%' height='300%'>
              <feDropShadow
                dx={Math.cos(shadowDirection) * scene.avatarShadowStyle.distance}
                dy={Math.sin(shadowDirection) * scene.avatarShadowStyle.distance}
                stdDeviation={scene.avatarShadowStyle.softness / 2}
                floodColor={scene.avatarShadowStyle.color}
                floodOpacity={scene.avatarShadowStyle.opacity / 100}
              />
            </filter>
          </defs>
        )}
      <g
        filter={scene?.showAvatarShadow ? `url(#${id}-preview-avatar-shadow)` : undefined}
        transform={previewTransform}
      >
        <EntityPresetBody
          avatarOutlineStyle={scene?.avatarOutlineStyle}
          face={face}
          faceStyle={faceStyle}
          geometries={geometries}
          idPrefix={`${id}-preview`}
          interactive={false}
          lightDistance={0}
          parts={parts}
          pose={pose}
          preset={preset}
          renderSurfaceCells={false}
          shadowStyle={DEFAULT_AVATAR_FACE_SHADOW_STYLE}
          surfaceDecals={surfaceDecals}
          showGrid={false}
          showLight={scene?.showLight ?? true}
          showOutline={scene?.showOutline ?? false}
          showShadow={false}
        />
      </g>
    </svg>
  )
}, (previous, next) => (
  previous.preset === next.preset &&
  previous.entityParts === next.entityParts &&
  previous.previewBackground === next.previewBackground &&
  previous.surfaceDecals === next.surfaceDecals &&
  previous.lightDirection.azimuth === next.lightDirection.azimuth &&
  previous.lightDirection.elevation === next.lightDirection.elevation
))

const useAnimatedFaceStyle = (target: AvatarFaceStyle, transitionsEnabled: boolean) => {
  const [animatedStyle, setAnimatedStyle] = useState(target)
  const animatedStyleRef = useRef(target)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!transitionsEnabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animatedStyleRef.current = target
      setAnimatedStyle(target)
      return
    }

    const from = resolveAvatarFaceStyle(animatedStyleRef.current)
    const resolvedTarget = resolveAvatarFaceStyle(target)
    const startedAt = performance.now()
    const animate = (now: number) => {
      const progress = clamp((now - startedAt) / FACE_STYLE_ANIMATION_MS, 0, 1)
      const easedProgress = 1 - (1 - progress) ** 3
      const nextStyle = {
        eyeHighlight: {
          color: resolvedTarget.eyeHighlight.color,
          enabled: resolvedTarget.eyeHighlight.enabled,
          offsetX: interpolate(from.eyeHighlight.offsetX, resolvedTarget.eyeHighlight.offsetX, easedProgress),
          offsetY: interpolate(from.eyeHighlight.offsetY, resolvedTarget.eyeHighlight.offsetY, easedProgress),
          opacity: interpolate(from.eyeHighlight.opacity, resolvedTarget.eyeHighlight.opacity, easedProgress),
          size: interpolate(from.eyeHighlight.size, resolvedTarget.eyeHighlight.size, easedProgress)
        },
        eyeRoundness: interpolate(from.eyeRoundness, target.eyeRoundness, easedProgress),
        eyeShape: target.eyeShape,
        gap: interpolate(from.gap, target.gap, easedProgress),
        height: interpolate(from.height, target.height, easedProgress),
        leftEyeHeight: interpolate(
          from.leftEyeHeight ?? from.height,
          resolvedTarget.leftEyeHeight ?? resolvedTarget.height,
          easedProgress
        ),
        leftEyeWidth: interpolate(from.leftEyeWidth ?? from.width, resolvedTarget.leftEyeWidth ?? resolvedTarget.width, easedProgress),
        leftEyeRotation: interpolate(from.leftEyeRotation, resolvedTarget.leftEyeRotation, easedProgress),
        mouthCurve: interpolate(from.mouthCurve, target.mouthCurve, easedProgress),
        mouthEnabled: target.mouthEnabled,
        mouthHeight: interpolate(from.mouthHeight, target.mouthHeight, easedProgress),
        mouthRotation: interpolate(from.mouthRotation, target.mouthRotation, easedProgress),
        mouthShape: target.mouthShape,
        mouthWidth: interpolate(from.mouthWidth, target.mouthWidth, easedProgress),
        mouthY: interpolate(from.mouthY, target.mouthY, easedProgress),
        noseEnabled: target.noseEnabled,
        noseHeight: interpolate(from.noseHeight, target.noseHeight, easedProgress),
        noseRotation: interpolate(from.noseRotation, target.noseRotation, easedProgress),
        noseShape: target.noseShape,
        noseWidth: interpolate(from.noseWidth, target.noseWidth, easedProgress),
        noseY: interpolate(from.noseY, target.noseY, easedProgress),
        rotation: interpolate(from.rotation, target.rotation, easedProgress),
        rightEyeHeight: interpolate(
          from.rightEyeHeight ?? from.height,
          resolvedTarget.rightEyeHeight ?? resolvedTarget.height,
          easedProgress
        ),
        rightEyeWidth: interpolate(from.rightEyeWidth ?? from.width, resolvedTarget.rightEyeWidth ?? resolvedTarget.width, easedProgress),
        rightEyeRotation: interpolate(from.rightEyeRotation, resolvedTarget.rightEyeRotation, easedProgress),
        width: interpolate(from.width, target.width, easedProgress)
      }
      animatedStyleRef.current = nextStyle
      setAnimatedStyle(nextStyle)
      if (progress < 1) animationFrameRef.current = window.requestAnimationFrame(animate)
    }

    if (animationFrameRef.current != null) window.cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = window.requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current != null) window.cancelAnimationFrame(animationFrameRef.current)
    }
  }, [
    target.eyeHighlight.color,
    target.eyeHighlight.enabled,
    target.eyeHighlight.offsetX,
    target.eyeHighlight.offsetY,
    target.eyeHighlight.opacity,
    target.eyeHighlight.size,
    target.eyeRoundness,
    target.eyeShape,
    target.gap,
    target.height,
    target.leftEyeHeight,
    target.leftEyeWidth,
    target.leftEyeRotation,
    target.mouthCurve,
    target.mouthEnabled,
    target.mouthHeight,
    target.mouthRotation,
    target.mouthShape,
    target.mouthWidth,
    target.mouthY,
    target.noseEnabled,
    target.noseHeight,
    target.noseRotation,
    target.noseShape,
    target.noseWidth,
    target.noseY,
    target.rotation,
    target.rightEyeHeight,
    target.rightEyeWidth,
    target.rightEyeRotation,
    target.width,
    transitionsEnabled
  ])

  return animatedStyle
}

function InteractiveAvatarComponent({
  avatarOutlineStyle,
  avatarShadowStyle,
  backgroundStyle,
  bodyShape,
  bottomTaper = 0,
  colorGrade,
  entityParts = [],
  entityPreset = 'custom',
  faceStyleTransitionsEnabled = true,
  faceStyle,
  gridDensity,
  interactive = true,
  interactionMode,
  lightDistance = 0,
  lightDirection,
  onEntityPartSelect,
  onInteractionStart,
  onViewStateChange,
  palette,
  pixelEffect,
  renderSurfaceCells = true,
  selectedEntityPartId,
  shadowStyle,
  showLight,
  showOutline = false,
  showAvatarShadow = false,
  showShadow,
  surfaceDecals = [],
  viewState
}: InteractiveAvatarProps) {
  const [dragging, setDragging] = useState(false)
  const [fragmentInteractiveQuality, setFragmentInteractiveQuality] = useState(false)
  const [gridInteractiveQuality, setGridInteractiveQuality] = useState(false)
  const [renderingInteractively, setRenderingInteractively] = useState(false)
  const [dragMetricsRevision, setDragMetricsRevision] = useState(0)
  const dragRuntimeStatsRef = useRef({
    longTasks: [] as number[],
    rafIntervals: [] as number[]
  })
  const dragRuntimeFrameRef = useRef<number>()
  const dragReleaseFrameMsRef = useRef(0)
  const dragReleaseStartedAtRef = useRef<number>()
  const dragSettleFrameMsRef = useRef(0)
  const dragSettleStartedAtRef = useRef<number>()
  const fragmentSettleFrameMsRef = useRef(0)
  const fragmentSettleHandleRef = useRef<number>()
  const fragmentSettleStartedAtRef = useRef<number>()
  const fragmentSettleUsesIdleRef = useRef(false)
  const gridSettleFrameMsRef = useRef(0)
  const gridSettleHandleRef = useRef<number>()
  const gridSettleStartedAtRef = useRef<number>()
  const gridSettleUsesIdleRef = useRef(false)
  const renderSettleHandleRef = useRef<number>()
  const renderSettleUsesIdleRef = useRef(false)
  const pendingCommittedViewStateRef = useRef<AvatarViewState | null>(null)
  const [transientViewState, setTransientViewState] = useState<AvatarViewState | null>(null)
  const renderedViewState = transientViewState ?? viewState
  const pose = useMemo<AvatarPose>(() => ({
    pitch: renderedViewState.pitch,
    yaw: renderedViewState.yaw
  }), [
    renderedViewState.pitch,
    renderedViewState.yaw
  ])
  const position = useMemo<AvatarPosition>(() => ({
    x: renderedViewState.positionX,
    y: renderedViewState.positionY
  }), [
    renderedViewState.positionX,
    renderedViewState.positionY
  ])
  const avatarScale = renderedViewState.scale
  const avatarRoll = renderedViewState.roll
  const poseRef = useRef(pose)
  const positionRef = useRef(position)
  const avatarRollRef = useRef(avatarRoll)
  const avatarScaleRef = useRef(avatarScale)
  const dragOriginRef = useRef<DragOrigin>()
  const pendingDragViewStateRef = useRef<AvatarViewState>()
  const dragRenderFrameRef = useRef<number>()
  const pixelEffectRef = useRef(pixelEffect)
  pixelEffectRef.current = pixelEffect
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null)
  const pixelRenderEpochRef = useRef(0)
  const pixelRenderFrameRef = useRef<number>()
  const pixelRenderInFlightRef = useRef(false)
  const pixelRenderMountedRef = useRef(true)
  const pixelRenderPendingRef = useRef(false)
  const sourceSvgRef = useRef<SVGSVGElement>(null)
  const entityPartHitResolverRef = useRef<((x: number, y: number) => string | null) | null>(null)
  const entityGeometryDragBuildSamplesRef = useRef<number[]>([])
  const entityGeometryGridSettleBuildMsRef = useRef(0)
  const entityGeometryReleaseBuildMsRef = useRef(0)
  const entityGeometrySettleBuildMsRef = useRef(0)
  const entityGeometryPreviousBuildWasDraggingRef = useRef(false)
  const entityGeometryPreviousGridInteractiveQualityRef = useRef(false)
  const entityGeometryPreviousInteractiveQualityRef = useRef(false)
  const [pixelReady, setPixelReady] = useState(false)
  const rawId = useId()
  const id = rawId.replaceAll(':', '')
  const animatedFaceStyle = useAnimatedFaceStyle(faceStyle, faceStyleTransitionsEnabled)
  const resolvedGridDensity = gridDensity ?? AVATAR_GRID_DENSITY.default
  const renderedGridDensity = gridInteractiveQuality
    ? Math.min(resolvedGridDensity, 24)
    : resolvedGridDensity
  const bodyGeometryOptions = useMemo<AvatarBodyGeometryOptions>(
    () => ({ bottomTaper }),
    [bottomTaper]
  )
  const bodyGeometry = useMemo(
    () => buildAvatarBodyGeometry(bodyShape, pose, lightDirection, renderedGridDensity, bodyGeometryOptions),
    [bodyGeometryOptions, bodyShape, lightDirection, pose, renderedGridDensity]
  )
  const face = useMemo(
    () => projectDefaultFace(pose, bodyShape, animatedFaceStyle, bodyGeometryOptions),
    [animatedFaceStyle, bodyGeometryOptions, bodyShape, pose]
  )
  const sourceEntityParts = useMemo(
    () => entityParts.length > 0 ? entityParts : createAvatarEntityParts(entityPreset),
    [entityParts, entityPreset]
  )
  const usesEntityParts = sourceEntityParts.length > 0
  const resolvedEntityParts = useMemo(
    () =>
      sourceEntityParts.map(part => ({
        ...part,
        baseColor: applyAvatarColorGrade(part.baseColor, colorGrade),
        highlightColor: applyAvatarColorGrade(part.highlightColor, colorGrade),
        shadowColor: applyAvatarColorGrade(part.shadowColor, colorGrade)
      })),
    [colorGrade, sourceEntityParts]
  )
  const entityGeometryBuild = useMemo(() => {
    const startedAt = performance.now()
    const geometries = buildEntityPartGeometries(
      sourceEntityParts,
      pose,
      lightDirection,
      renderedGridDensity,
      renderingInteractively ? .5 : 1
    )
    const duration = performance.now() - startedAt
    if (dragging) {
      if (!entityGeometryPreviousBuildWasDraggingRef.current) entityGeometryDragBuildSamplesRef.current = []
      entityGeometryDragBuildSamplesRef.current.push(duration)
      if (entityGeometryDragBuildSamplesRef.current.length > 512) entityGeometryDragBuildSamplesRef.current.shift()
    } else if (entityGeometryPreviousBuildWasDraggingRef.current) {
      entityGeometryReleaseBuildMsRef.current = duration
    }
    if (!renderingInteractively && entityGeometryPreviousInteractiveQualityRef.current) {
      entityGeometrySettleBuildMsRef.current = duration
    }
    if (!gridInteractiveQuality && entityGeometryPreviousGridInteractiveQualityRef.current) {
      entityGeometryGridSettleBuildMsRef.current = duration
    }
    entityGeometryPreviousBuildWasDraggingRef.current = dragging
    entityGeometryPreviousGridInteractiveQualityRef.current = gridInteractiveQuality
    entityGeometryPreviousInteractiveQualityRef.current = renderingInteractively
    return { duration, geometries }
  }, [
    dragging,
    gridInteractiveQuality,
    lightDirection,
    pose,
    renderedGridDensity,
    renderingInteractively,
    sourceEntityParts
  ])
  const entityGeometries = entityGeometryBuild.geometries
  // Two intersecting surfaces use a shared ownership partition. Keep that
  // structural mesh identical while dragging and at rest; interactive quality
  // may simplify lighting and boundary output, but must not change topology.
  const entityFragmentGeometries = useMemo(
    () => sourceEntityParts.length === 2
      ? buildEntityPartGeometries(sourceEntityParts, pose, lightDirection, renderedGridDensity, 1)
      : entityGeometries,
    [entityGeometries, lightDirection, pose, renderedGridDensity, sourceEntityParts]
  )
  const entityFacePart = sourceEntityParts.find(part => part.face)
  const entityFace = useMemo(
    () =>
      projectDefaultFace(
        pose,
        entityFacePart?.shape ?? 'sphere',
        animatedFaceStyle,
        entityFacePart == null ? {} : getEntityFaceGeometryOptions(entityFacePart, entityPreset)
      ),
    [animatedFaceStyle, entityFacePart, entityPreset, pose]
  )
  const projectedSurfaceDecals = useMemo<ProjectedSurfaceDecal[]>(() =>
    surfaceDecals.flatMap(decal => {
      if (!usesEntityParts) {
        if (decal.targetPartId != null) return []
        const projected = projectAvatarSurfaceDecal(pose, bodyShape, decal, bodyGeometryOptions)
        return projected == null ? [] : [{
          ...decal,
          path: projected.path,
          ...(projected.transform == null ? {} : { transform: projected.transform })
        }]
      }
      const targetPart = decal.targetPartId == null
        ? entityFacePart
        : sourceEntityParts.find(part => part.id === decal.targetPartId)
      if (targetPart == null) return []
      const projected = projectAvatarSurfaceDecal(
        pose,
        targetPart.shape,
        decal,
        getEntityFaceGeometryOptions(targetPart, entityPreset)
      )
      return projected == null ? [] : [{
        ...decal,
        path: projected.path,
        targetPartId: targetPart.id,
        ...(projected.transform == null ? {} : { transform: projected.transform })
      }]
    }), [bodyGeometryOptions, bodyShape, entityFacePart, entityPreset, pose, sourceEntityParts, surfaceDecals, usesEntityParts])
  const surfaceMid = applyAvatarColorGrade(
    backgroundStyle === 'gradient' ? palette.gradient[1] : palette.background,
    colorGrade
  )
  const surfaceHighlight = applyAvatarColorGrade(palette.gradient[0], colorGrade)
  const surfaceShadow = applyAvatarColorGrade(palette.shadow, colorGrade)
  const surfaceForeground = palette.foreground
  const faceShadowColor = shadowStyle.color ?? surfaceShadow
  const shadowDirection = shadowStyle.direction * Math.PI / 180
  const getFaceShadowTransform = (surfaceDepth: number) => {
    const projectedDistance = shadowStyle.distance * surfaceDepth
    return `translate(${(Math.cos(shadowDirection) * projectedDistance).toFixed(2)} ${
      (Math.sin(shadowDirection) * projectedDistance).toFixed(2)
    })`
  }
  const getFaceShadowOpacity = (surfaceDepth: number) => {
    return shadowStyle.opacity / 100 * surfaceDepth ** 2
  }
  const shadowFilter = shadowStyle.softness > 0 ? `url(#${id}-face-shadow-blur)` : undefined
  const avatarShadowDirection = (avatarShadowStyle?.direction ?? 0) * Math.PI / 180
  const avatarShadowDistance = avatarShadowStyle?.distance ?? 0

  useEffect(() => {
    if (transientViewState != null) return
    poseRef.current = pose
    positionRef.current = position
    avatarRollRef.current = avatarRoll
    avatarScaleRef.current = avatarScale
  }, [avatarRoll, avatarScale, pose, position, transientViewState])

  const runPixelRender = () => {
    pixelRenderFrameRef.current = undefined
    if (!pixelRenderPendingRef.current) return
    pixelRenderPendingRef.current = false
    const currentPixelEffect = pixelEffectRef.current
    if (currentPixelEffect?.enabled !== true) return
    const sourceSvg = sourceSvgRef.current
    const targetCanvas = pixelCanvasRef.current
    if (sourceSvg == null || targetCanvas == null) return
    const epoch = pixelRenderEpochRef.current
    pixelRenderInFlightRef.current = true
    const renderedCanvas = document.createElement('canvas')
    void paintPixelatedAvatarCanvas(sourceSvg, renderedCanvas, VIEW_SIZE, currentPixelEffect).then(() => {
      if (!pixelRenderMountedRef.current || pixelRenderEpochRef.current !== epoch) return
      targetCanvas.width = VIEW_SIZE
      targetCanvas.height = VIEW_SIZE
      const context = targetCanvas.getContext('2d')
      if (context == null) return
      context.imageSmoothingEnabled = false
      context.clearRect(0, 0, VIEW_SIZE, VIEW_SIZE)
      context.drawImage(renderedCanvas, 0, 0)
      setPixelReady(true)
    }).catch(() => {
      if (pixelRenderMountedRef.current && pixelRenderEpochRef.current === epoch) setPixelReady(false)
    }).finally(() => {
      pixelRenderInFlightRef.current = false
      if (
        pixelRenderMountedRef.current &&
        pixelRenderPendingRef.current &&
        pixelEffectRef.current?.enabled === true &&
        pixelRenderFrameRef.current == null
      ) {
        pixelRenderFrameRef.current = window.requestAnimationFrame(runPixelRender)
      }
    })
  }

  const schedulePixelRender = () => {
    if (pixelRenderInFlightRef.current || pixelRenderFrameRef.current != null) return
    pixelRenderFrameRef.current = window.requestAnimationFrame(runPixelRender)
  }

  useEffect(() => {
    pixelRenderMountedRef.current = true
    return () => {
      pixelRenderMountedRef.current = false
      pixelRenderEpochRef.current += 1
      if (dragRenderFrameRef.current != null) window.cancelAnimationFrame(dragRenderFrameRef.current)
      if (renderSettleHandleRef.current != null) {
        if (renderSettleUsesIdleRef.current) window.cancelIdleCallback(renderSettleHandleRef.current)
        else window.clearTimeout(renderSettleHandleRef.current)
      }
      if (fragmentSettleHandleRef.current != null) {
        if (fragmentSettleUsesIdleRef.current) window.cancelIdleCallback(fragmentSettleHandleRef.current)
        else window.clearTimeout(fragmentSettleHandleRef.current)
      }
      if (gridSettleHandleRef.current != null) {
        if (gridSettleUsesIdleRef.current) window.cancelIdleCallback(gridSettleHandleRef.current)
        else window.clearTimeout(gridSettleHandleRef.current)
      }
      if (pixelRenderFrameRef.current != null) {
        window.cancelAnimationFrame(pixelRenderFrameRef.current)
        pixelRenderFrameRef.current = undefined
      }
    }
  }, [])

  useEffect(() => {
    if (!dragging) return
    const stats = dragRuntimeStatsRef.current
    stats.longTasks = []
    stats.rafIntervals = []
    let previousFrame: number | null = null
    const sampleFrame = (now: number) => {
      if (previousFrame != null) {
        stats.rafIntervals.push(now - previousFrame)
        if (stats.rafIntervals.length > 1_024) stats.rafIntervals.shift()
      }
      previousFrame = now
      dragRuntimeFrameRef.current = window.requestAnimationFrame(sampleFrame)
    }
    dragRuntimeFrameRef.current = window.requestAnimationFrame(sampleFrame)
    const longTaskObserver = typeof PerformanceObserver === 'undefined'
      || !PerformanceObserver.supportedEntryTypes.includes('longtask')
      ? null
      : new PerformanceObserver(entries => {
        stats.longTasks.push(...entries.getEntries().map(entry => entry.duration))
      })
    longTaskObserver?.observe({ entryTypes: ['longtask'] })
    return () => {
      if (dragRuntimeFrameRef.current != null) {
        window.cancelAnimationFrame(dragRuntimeFrameRef.current)
        dragRuntimeFrameRef.current = undefined
      }
      longTaskObserver?.disconnect()
      if (pixelRenderMountedRef.current) setDragMetricsRevision(revision => revision + 1)
    }
  }, [dragging])

  useEffect(() => {
    if (dragging || dragReleaseStartedAtRef.current == null) return
    const startedAt = dragReleaseStartedAtRef.current
    dragReleaseStartedAtRef.current = undefined
    const frame = window.requestAnimationFrame(() => {
      dragReleaseFrameMsRef.current = performance.now() - startedAt
      if (pixelRenderMountedRef.current) setDragMetricsRevision(revision => revision + 1)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [dragging])

  useEffect(() => {
    if (renderingInteractively || dragSettleStartedAtRef.current == null) return
    const startedAt = dragSettleStartedAtRef.current
    dragSettleStartedAtRef.current = undefined
    const frame = window.requestAnimationFrame(() => {
      dragSettleFrameMsRef.current = performance.now() - startedAt
      if (pixelRenderMountedRef.current) setDragMetricsRevision(revision => revision + 1)
    })
    if (fragmentInteractiveQuality && fragmentSettleHandleRef.current == null) {
      const settleFragments = () => {
        fragmentSettleHandleRef.current = undefined
        fragmentSettleUsesIdleRef.current = false
        fragmentSettleStartedAtRef.current = performance.now()
        setFragmentInteractiveQuality(false)
      }
      fragmentSettleUsesIdleRef.current = typeof window.requestIdleCallback === 'function'
      fragmentSettleHandleRef.current = fragmentSettleUsesIdleRef.current
        ? window.requestIdleCallback(settleFragments, { timeout: 160 })
        : window.setTimeout(settleFragments, 32)
    }
    return () => window.cancelAnimationFrame(frame)
  }, [fragmentInteractiveQuality, renderingInteractively])

  useEffect(() => {
    if (fragmentInteractiveQuality || fragmentSettleStartedAtRef.current == null) return
    const startedAt = fragmentSettleStartedAtRef.current
    fragmentSettleStartedAtRef.current = undefined
    const frame = window.requestAnimationFrame(() => {
      fragmentSettleFrameMsRef.current = performance.now() - startedAt
      if (pixelRenderMountedRef.current) setDragMetricsRevision(revision => revision + 1)
    })
    if (gridInteractiveQuality && gridSettleHandleRef.current == null) {
      const settleGrid = () => {
        gridSettleHandleRef.current = undefined
        gridSettleUsesIdleRef.current = false
        gridSettleStartedAtRef.current = performance.now()
        setGridInteractiveQuality(false)
      }
      gridSettleUsesIdleRef.current = typeof window.requestIdleCallback === 'function'
      gridSettleHandleRef.current = gridSettleUsesIdleRef.current
        ? window.requestIdleCallback(settleGrid, { timeout: 160 })
        : window.setTimeout(settleGrid, 32)
    }
    return () => window.cancelAnimationFrame(frame)
  }, [fragmentInteractiveQuality, gridInteractiveQuality])

  useEffect(() => {
    if (gridInteractiveQuality || gridSettleStartedAtRef.current == null) return
    const startedAt = gridSettleStartedAtRef.current
    gridSettleStartedAtRef.current = undefined
    const frame = window.requestAnimationFrame(() => {
      gridSettleFrameMsRef.current = performance.now() - startedAt
      if (pixelRenderMountedRef.current) setDragMetricsRevision(revision => revision + 1)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [gridInteractiveQuality])

  useEffect(() => {
    if (pixelEffect?.enabled !== true) {
      pixelRenderPendingRef.current = false
      pixelRenderEpochRef.current += 1
      if (pixelRenderFrameRef.current != null) {
        window.cancelAnimationFrame(pixelRenderFrameRef.current)
        pixelRenderFrameRef.current = undefined
      }
      setPixelReady(false)
      return
    }
    pixelRenderPendingRef.current = true
    schedulePixelRender()
  })

  const scheduleDragViewState = (nextState: AvatarViewState) => {
    pendingDragViewStateRef.current = nextState
    if (dragRenderFrameRef.current != null) return
    dragRenderFrameRef.current = window.requestAnimationFrame(() => {
      dragRenderFrameRef.current = undefined
      const pendingState = pendingDragViewStateRef.current
      if (pendingState != null) setTransientViewState(pendingState)
    })
  }

  const flushPendingViewStateCommit = () => {
    const pendingState = pendingCommittedViewStateRef.current
    if (pendingState == null) return
    pendingCommittedViewStateRef.current = null
    onViewStateChange(pendingState)
  }

  const updatePose = (nextPose: AvatarPose) => {
    poseRef.current = nextPose
    onViewStateChange({
      pitch: nextPose.pitch,
      positionX: positionRef.current.x,
      positionY: positionRef.current.y,
      roll: avatarRollRef.current,
      scale: avatarScaleRef.current,
      yaw: nextPose.yaw
    })
  }

  const updatePosition = (nextPosition: AvatarPosition) => {
    positionRef.current = nextPosition
    onViewStateChange({
      pitch: poseRef.current.pitch,
      positionX: nextPosition.x,
      positionY: nextPosition.y,
      roll: avatarRollRef.current,
      scale: avatarScaleRef.current,
      yaw: poseRef.current.yaw
    })
  }

  const updateAvatarScale = (nextScale: number) => {
    const clampedScale = clamp(nextScale, AVATAR_VIEW_LIMITS.minScale, AVATAR_VIEW_LIMITS.maxScale)
    avatarScaleRef.current = clampedScale
    onViewStateChange({
      pitch: poseRef.current.pitch,
      positionX: positionRef.current.x,
      positionY: positionRef.current.y,
      roll: avatarRollRef.current,
      scale: clampedScale,
      yaw: poseRef.current.yaw
    })
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 && event.button !== 2) return
    // A new gesture can arrive before the idle commit from the previous drag. Flush
    // that final state before cancelling its settle callback so the controlled parent
    // cannot snap the avatar back to the previous prop value.
    flushPendingViewStateCommit()
    onInteractionStart?.()
    const temporaryMove = event.button === 2 || (event.pointerType === 'mouse' && event.detail >= 2)
    let selectionPartId: string | null = null
    if (event.button === 0 && !temporaryMove && usesEntityParts && entityPartHitResolverRef.current != null) {
      const fragmentRoot = event.currentTarget.querySelector<SVGGElement>('[data-avatar-entity-fragment-root]')
      const screenMatrix = fragmentRoot?.getScreenCTM()
      if (screenMatrix != null) {
        const screenPoint = event.currentTarget.createSVGPoint()
        screenPoint.x = event.clientX
        screenPoint.y = event.clientY
        const localPoint = screenPoint.matrixTransform(screenMatrix.inverse())
        selectionPartId = entityPartHitResolverRef.current(localPoint.x, localPoint.y)
      }
    }
    if (temporaryMove) event.preventDefault()
    if (renderSettleHandleRef.current != null) {
      if (renderSettleUsesIdleRef.current) window.cancelIdleCallback(renderSettleHandleRef.current)
      else window.clearTimeout(renderSettleHandleRef.current)
      renderSettleHandleRef.current = undefined
    }
    if (fragmentSettleHandleRef.current != null) {
      if (fragmentSettleUsesIdleRef.current) window.cancelIdleCallback(fragmentSettleHandleRef.current)
      else window.clearTimeout(fragmentSettleHandleRef.current)
      fragmentSettleHandleRef.current = undefined
    }
    if (gridSettleHandleRef.current != null) {
      if (gridSettleUsesIdleRef.current) window.cancelIdleCallback(gridSettleHandleRef.current)
      else window.clearTimeout(gridSettleHandleRef.current)
      gridSettleHandleRef.current = undefined
    }
    setFragmentInteractiveQuality(true)
    setGridInteractiveQuality(true)
    setRenderingInteractively(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOriginRef.current = {
      moved: false,
      mode: temporaryMove ? 'move' : interactionMode,
      pitch: poseRef.current.pitch,
      pointerId: event.pointerId,
      positionX: positionRef.current.x,
      positionY: positionRef.current.y,
      scale: VIEW_SIZE / event.currentTarget.getBoundingClientRect().width,
      selectable: event.button === 0 && !temporaryMove,
      selectionPartId,
      x: event.clientX,
      y: event.clientY,
      yaw: poseRef.current.yaw
    }
    setDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const origin = dragOriginRef.current
    if (origin == null || origin.pointerId !== event.pointerId) return
    if (!origin.moved && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > ENTITY_SELECTION_DRAG_THRESHOLD) {
      dragOriginRef.current = { ...origin, moved: true }
    }
    if (origin.mode === 'move') {
      const nextPosition = {
        x: clamp(
          origin.positionX + (event.clientX - origin.x) * origin.scale,
          -AVATAR_VIEW_LIMITS.maxPosition,
          AVATAR_VIEW_LIMITS.maxPosition
        ),
        y: clamp(
          origin.positionY + (event.clientY - origin.y) * origin.scale,
          -AVATAR_VIEW_LIMITS.maxPosition,
          AVATAR_VIEW_LIMITS.maxPosition
        )
      }
      positionRef.current = nextPosition
      scheduleDragViewState({
        pitch: poseRef.current.pitch,
        positionX: nextPosition.x,
        positionY: nextPosition.y,
        roll: avatarRollRef.current,
        scale: avatarScaleRef.current,
        yaw: poseRef.current.yaw
      })
      return
    }
    const nextPose = {
      pitch: origin.pitch + (event.clientY - origin.y) * ROTATION_PER_PIXEL,
      yaw: origin.yaw + (event.clientX - origin.x) * ROTATION_PER_PIXEL
    }
    poseRef.current = nextPose
    scheduleDragViewState({
      pitch: nextPose.pitch,
      positionX: positionRef.current.x,
      positionY: positionRef.current.y,
      roll: avatarRollRef.current,
      scale: avatarScaleRef.current,
      yaw: nextPose.yaw
    })
  }

  const finishPointerInteraction = (event: PointerEvent<SVGSVGElement>) => {
    const origin = dragOriginRef.current
    if (origin?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (dragRenderFrameRef.current != null) {
      window.cancelAnimationFrame(dragRenderFrameRef.current)
      dragRenderFrameRef.current = undefined
    }
    const finalViewState = pendingDragViewStateRef.current
    pendingDragViewStateRef.current = undefined
    if (finalViewState != null) pendingCommittedViewStateRef.current = finalViewState
    dragOriginRef.current = undefined
    if (finalViewState == null) setTransientViewState(null)
    dragReleaseStartedAtRef.current = performance.now()
    setDragging(false)
    const settleRendering = () => {
      renderSettleHandleRef.current = undefined
      renderSettleUsesIdleRef.current = false
      dragSettleStartedAtRef.current = performance.now()
      fragmentSettleStartedAtRef.current = performance.now()
      setRenderingInteractively(false)
      setFragmentInteractiveQuality(false)
    }
    const commitViewState = () => {
      renderSettleHandleRef.current = undefined
      renderSettleUsesIdleRef.current = false
      if (pendingCommittedViewStateRef.current != null) {
        flushPendingViewStateCommit()
        setTransientViewState(null)
      }
      renderSettleUsesIdleRef.current = typeof window.requestIdleCallback === 'function'
      renderSettleHandleRef.current = renderSettleUsesIdleRef.current
        ? window.requestIdleCallback(settleRendering, { timeout: 160 })
        : window.setTimeout(settleRendering, 32)
    }
    renderSettleUsesIdleRef.current = typeof window.requestIdleCallback === 'function'
    renderSettleHandleRef.current = renderSettleUsesIdleRef.current
      ? window.requestIdleCallback(commitViewState, { timeout: 96 })
      : window.setTimeout(commitViewState, 16)
    if (
      origin.selectable &&
      event.type !== 'pointercancel' &&
      !origin.moved &&
      Math.hypot(event.clientX - origin.x, event.clientY - origin.y) <= ENTITY_SELECTION_DRAG_THRESHOLD
    ) {
      onEntityPartSelect?.(origin.selectionPartId)
    }
  }

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    if (interactionMode !== 'move') return
    event.preventDefault()
    const deltaMultiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? VIEW_SIZE : 1
    updateAvatarScale(avatarScaleRef.current * Math.exp(-event.deltaY * deltaMultiplier * WHEEL_SCALE_SPEED))
  }

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (interactionMode === 'move') {
      const positionDelta: Partial<Record<string, AvatarPosition>> = {
        ArrowDown: { x: 0, y: KEY_POSITION_MOVE },
        ArrowLeft: { x: -KEY_POSITION_MOVE, y: 0 },
        ArrowRight: { x: KEY_POSITION_MOVE, y: 0 },
        ArrowUp: { x: 0, y: -KEY_POSITION_MOVE }
      }
      const delta = positionDelta[event.key]
      if (delta == null) return
      event.preventDefault()
      updatePosition({
        x: clamp(
          positionRef.current.x + delta.x,
          -AVATAR_VIEW_LIMITS.maxPosition,
          AVATAR_VIEW_LIMITS.maxPosition
        ),
        y: clamp(
          positionRef.current.y + delta.y,
          -AVATAR_VIEW_LIMITS.maxPosition,
          AVATAR_VIEW_LIMITS.maxPosition
        )
      })
      return
    }

    const poseDelta: Partial<Record<string, AvatarPose>> = {
      ArrowDown: { pitch: KEY_ROTATION, yaw: 0 },
      ArrowLeft: { pitch: 0, yaw: -KEY_ROTATION },
      ArrowRight: { pitch: 0, yaw: KEY_ROTATION },
      ArrowUp: { pitch: -KEY_ROTATION, yaw: 0 }
    }
    const delta = poseDelta[event.key]
    if (delta == null) return
    event.preventDefault()
    updatePose({
      pitch: poseRef.current.pitch + delta.pitch,
      yaw: poseRef.current.yaw + delta.yaw
    })
  }

  const dragRuntimeStats = dragRuntimeStatsRef.current

  return (
    <div
      className='interactive-avatar'
      data-avatar-drag-long-task-count={dragRuntimeStats.longTasks.length}
      data-avatar-drag-long-task-max-ms={Math.max(0, ...dragRuntimeStats.longTasks).toFixed(3)}
      data-avatar-drag-long-task-p95-ms={percentile(dragRuntimeStats.longTasks, .95).toFixed(3)}
      data-avatar-drag-metrics-revision={dragMetricsRevision}
      data-avatar-drag-raf-max-ms={Math.max(0, ...dragRuntimeStats.rafIntervals).toFixed(3)}
      data-avatar-drag-raf-p95-ms={percentile(dragRuntimeStats.rafIntervals, .95).toFixed(3)}
      data-avatar-drag-raf-samples={dragRuntimeStats.rafIntervals.length}
      data-avatar-release-frame-ms={dragReleaseFrameMsRef.current.toFixed(3)}
      data-avatar-fragment-settle-frame-ms={fragmentSettleFrameMsRef.current.toFixed(3)}
      data-avatar-grid-settle-frame-ms={gridSettleFrameMsRef.current.toFixed(3)}
      data-avatar-settle-frame-ms={dragSettleFrameMsRef.current.toFixed(3)}
      data-avatar-geometry-build-ms={entityGeometryBuild.duration.toFixed(3)}
      data-avatar-geometry-drag-build-max-ms={Math.max(0, ...entityGeometryDragBuildSamplesRef.current).toFixed(3)}
      data-avatar-geometry-drag-build-mean-ms={(
        entityGeometryDragBuildSamplesRef.current.length === 0
          ? 0
          : entityGeometryDragBuildSamplesRef.current.reduce((total, sample) => total + sample, 0)
            / entityGeometryDragBuildSamplesRef.current.length
      ).toFixed(3)}
      data-avatar-geometry-drag-build-p95-ms={percentile(entityGeometryDragBuildSamplesRef.current, .95).toFixed(3)}
      data-avatar-geometry-drag-build-samples={entityGeometryDragBuildSamplesRef.current.length}
      data-avatar-geometry-grid-settle-build-ms={entityGeometryGridSettleBuildMsRef.current.toFixed(3)}
      data-avatar-geometry-release-build-ms={entityGeometryReleaseBuildMsRef.current.toFixed(3)}
      data-avatar-geometry-settle-build-ms={entityGeometrySettleBuildMsRef.current.toFixed(3)}
      data-avatar-compositor-quality={renderingInteractively ? 'interactive' : 'full'}
      data-dragging={dragging}
      data-avatar-fragment-quality={fragmentInteractiveQuality ? 'interactive' : 'full'}
      data-avatar-grid-quality={gridInteractiveQuality ? 'interactive' : 'full'}
      data-interaction-mode={interactionMode}
      data-object-position-x={position.x}
      data-object-position-y={position.y}
      data-object-scale={avatarScale}
      data-pitch={pose.pitch}
      data-position-x={position.x}
      data-position-y={position.y}
      data-pixel-ready={pixelEffect?.enabled === true && pixelReady}
      data-roll={avatarRoll}
      data-visible-marks={face.eyes.length + (face.nose != null && animatedFaceStyle.noseEnabled ? 1 : 0) +
        (face.mouth != null && animatedFaceStyle.mouthEnabled ? 1 : 0)}
      data-yaw={pose.yaw}
    >
      <svg
        ref={sourceSvgRef}
        className='interactive-avatar__canvas'
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        role={interactive ? 'img' : undefined}
        aria-hidden={interactive ? undefined : true}
        aria-label={interactive
          ? `Interactive default avatar. Drag to ${
            interactionMode === 'move' ? 'move the entire avatar; pinch or scroll to resize it' : 'rotate the body'
          }.`
          : undefined}
        focusable={interactive ? undefined : 'false'}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        onContextMenu={interactive ? event => event.preventDefault() : undefined}
        onPointerCancel={interactive ? finishPointerInteraction : undefined}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerUp={interactive ? finishPointerInteraction : undefined}
        onWheel={interactive ? handleWheel : undefined}
      >
        {interactive ? <title>Interactive default avatar</title> : null}
        <defs>
          <clipPath id={`${id}-clip`}>
            <path d={bodyGeometry.outlinePath} />
          </clipPath>
          {face.eyes.map(eye => (
            <clipPath key={`highlight-clip-${eye.id}`} id={`${id}-${eye.id}-highlight-clip`}>
              <path d={eye.path} />
            </clipPath>
          ))}
          <filter id={`${id}-face-shadow-blur`} x='-50%' y='-50%' width='200%' height='200%'>
            <feGaussianBlur stdDeviation={shadowStyle.softness} />
          </filter>
          <filter id={`${id}-avatar-shadow`} x='-100%' y='-100%' width='300%' height='300%'>
            <feDropShadow
              dx={Math.cos(avatarShadowDirection) * avatarShadowDistance}
              dy={Math.sin(avatarShadowDirection) * avatarShadowDistance}
              stdDeviation={(avatarShadowStyle?.softness ?? 0) / 2}
              floodColor={avatarShadowStyle?.color ?? surfaceShadow}
              floodOpacity={(avatarShadowStyle?.opacity ?? 0) / 100}
            />
          </filter>
        </defs>

        <g
          filter={showAvatarShadow ? `url(#${id}-avatar-shadow)` : undefined}
          transform={`translate(${position.x} ${position.y}) translate(${VIEW_SIZE / 2} ${VIEW_SIZE / 2}) rotate(${
            avatarRoll * 180 / Math.PI
          }) scale(${avatarScale}) translate(${-VIEW_SIZE / 2} ${-VIEW_SIZE / 2})`}
        >
          {!usesEntityParts
            ? (
              <>
                <g clipPath={`url(#${id}-clip)`}>
                  <path d={bodyGeometry.outlinePath} fill={surfaceMid} />
                  {showLight && renderSurfaceCells
                    ? bodyGeometry.cells.map(cell => (
                      <polygon
                        key={cell.id}
                        points={cell.points}
                        fill={cell.shade >= 0 ? surfaceHighlight : surfaceShadow}
                        fillOpacity={resolveAvatarSurfaceShadeOpacity(cell.shade, lightDistance)}
                      />
                    ))
                    : null}

                  {projectedSurfaceDecals.filter(decal => decal.targetPartId == null).map(decal => (
                    <path
                      key={decal.id}
                      data-avatar-surface-decal={decal.id}
                      d={decal.path}
                      fill={decal.color}
                      fillOpacity={decal.opacity / 100}
                    />
                  ))}

                  {dragging
                    ? bodyGeometry.cells.map(cell => (
                      <polygon
                        key={`grid-${cell.id}`}
                        points={cell.points}
                        fill='none'
                        stroke='#fff'
                        strokeOpacity='.09'
                        strokeWidth='.55'
                      />
                    ))
                    : null}

                  {face.visible
                    ? (
                      <g>
                        {showShadow
                          ? face.eyes.map(eye => (
                            <path
                              key={`shadow-${eye.id}`}
                              d={eye.path}
                              transform={getFaceShadowTransform(eye.depth)}
                              fill={faceShadowColor}
                              filter={shadowFilter}
                              opacity={getFaceShadowOpacity(eye.depth)}
                            />
                          ))
                          : null}
                        {face.eyes.map(eye => (
                          <path
                            key={eye.id}
                            data-avatar-eye={eye.id}
                            d={eye.path}
                            fill={surfaceForeground}
                          />
                        ))}
                        {face.eyeHighlights.map(highlight => (
                          <path
                            key={highlight.id}
                            data-avatar-eye-highlight={highlight.id}
                            clipPath={`url(#${id}-${highlight.id.replace('eye-highlight-', 'eye-')}-highlight-clip)`}
                            d={highlight.path}
                            fill={animatedFaceStyle.eyeHighlight.color}
                            fillOpacity={animatedFaceStyle.eyeHighlight.opacity / 100}
                          />
                        ))}
                        {[
                          { enabled: animatedFaceStyle.noseEnabled, part: face.nose },
                          { enabled: animatedFaceStyle.mouthEnabled, part: face.mouth }
                        ].map(({ enabled, part }) =>
                          part == null
                            ? null
                            : (
                              <g
                                key={part.id}
                                className='interactive-avatar__face-part'
                                opacity={enabled ? 1 : 0}
                              >
                                {showShadow
                                  ? (
                                    <path
                                      d={part.path}
                                      transform={getFaceShadowTransform(part.depth)}
                                      fill={faceShadowColor}
                                      filter={shadowFilter}
                                      opacity={getFaceShadowOpacity(part.depth)}
                                    />
                                  )
                                  : null}
                                <path
                                  d={part.path}
                                  fill={surfaceForeground}
                                />
                              </g>
                            )
                        )}
                      </g>
                    )
                    : null}
                </g>
                {showOutline && avatarOutlineStyle != null && avatarOutlineStyle.width > 0
                  ? (
                    <path
                      data-avatar-outline='true'
                      d={bodyGeometry.outlinePath}
                      fill='none'
                      stroke={avatarOutlineStyle.color}
                      strokeOpacity={avatarOutlineStyle.opacity / 100}
                      strokeWidth={avatarOutlineStyle.width}
                      strokeLinejoin='round'
                    />
                  )
                  : null}
                {showOutline
                  ? null
                  : (
                    <path
                      d={bodyGeometry.outlinePath}
                      fill='none'
                      stroke='#fff'
                      strokeOpacity='.14'
                      strokeWidth='1.5'
                      strokeLinejoin='round'
                    />
                  )}
              </>
            )
            : (
              <EntityPresetBody
                avatarOutlineStyle={avatarOutlineStyle}
                face={entityFace}
                faceStyle={animatedFaceStyle}
                fragmentGeometries={entityFragmentGeometries}
                geometries={entityGeometries}
                idPrefix={id}
                interactive={interactive}
                interactiveQuality={fragmentInteractiveQuality}
                isDragging={dragging}
                lightDistance={lightDistance}
                partHitResolverRef={entityPartHitResolverRef}
                parts={resolvedEntityParts}
                pose={pose}
                preset={entityPreset}
                renderSurfaceCells={renderSurfaceCells}
                selectedPartId={selectedEntityPartId}
                shadowStyle={shadowStyle}
                surfaceDecals={projectedSurfaceDecals}
                showGrid={selectedEntityPartId != null}
                showLight={showLight}
                showOutline={showOutline}
                showShadow={showShadow}
              />
            )}
        </g>
      </svg>
      {pixelEffect?.enabled === true
        ? <canvas ref={pixelCanvasRef} className='interactive-avatar__pixel-canvas' aria-hidden='true' />
        : null}
    </div>
  )
}

const shallowEqualObject = (
  left: object | null | undefined,
  right: object | null | undefined
) => {
  if (left === right) return true
  if (left == null || right == null) return false
  const leftRecord = left as Readonly<Record<string, unknown>>
  const rightRecord = right as Readonly<Record<string, unknown>>
  const keys = Object.keys(leftRecord)
  return keys.length === Object.keys(rightRecord).length && keys.every(key => leftRecord[key] === rightRecord[key])
}

const areInteractiveAvatarPropsEqual = (
  previous: InteractiveAvatarProps,
  next: InteractiveAvatarProps
) => (
  previous.backgroundStyle === next.backgroundStyle &&
  previous.bodyShape === next.bodyShape &&
  previous.bottomTaper === next.bottomTaper &&
  previous.entityParts === next.entityParts &&
  previous.entityPreset === next.entityPreset &&
  previous.faceStyleTransitionsEnabled === next.faceStyleTransitionsEnabled &&
  previous.gridDensity === next.gridDensity &&
  previous.interactive === next.interactive &&
  previous.interactionMode === next.interactionMode &&
  previous.lightDistance === next.lightDistance &&
  previous.onEntityPartSelect === next.onEntityPartSelect &&
  previous.onInteractionStart === next.onInteractionStart &&
  previous.onViewStateChange === next.onViewStateChange &&
  previous.palette === next.palette &&
  shallowEqualObject(previous.pixelEffect, next.pixelEffect) &&
  previous.renderSurfaceCells === next.renderSurfaceCells &&
  previous.selectedEntityPartId === next.selectedEntityPartId &&
  previous.showLight === next.showLight &&
  previous.showOutline === next.showOutline &&
  previous.showAvatarShadow === next.showAvatarShadow &&
  previous.showShadow === next.showShadow &&
  shallowEqualObject(previous.avatarOutlineStyle, next.avatarOutlineStyle) &&
  shallowEqualObject(previous.avatarShadowStyle, next.avatarShadowStyle) &&
  shallowEqualObject(previous.colorGrade, next.colorGrade) &&
  shallowEqualObject(previous.faceStyle, next.faceStyle) &&
  shallowEqualObject(previous.lightDirection, next.lightDirection) &&
  shallowEqualObject(previous.shadowStyle, next.shadowStyle) &&
  shallowEqualObject(previous.viewState, next.viewState)
)

export const InteractiveAvatar = memo(InteractiveAvatarComponent, areInteractiveAvatarPropsEqual)
