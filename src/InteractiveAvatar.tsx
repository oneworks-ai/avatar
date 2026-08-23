import './InteractiveAvatar.scss'

import { memo, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, WheelEvent } from 'react'

import type { AvatarBackgroundStyle, AvatarPalette } from '@oneworks/avatar'
import { applyAvatarColorGrade } from './avatarColorGrade'
import type { AvatarColorGrade } from './avatarColorGrade'

import {
  AVATAR_BODY_SHAPES,
  AVATAR_GRID_DENSITY,
  buildAvatarBodyGeometry,
  DEFAULT_AVATAR_FACE_SHADOW_STYLE,
  DEFAULT_AVATAR_FACE_STYLE,
  projectAvatarSurfaceDecal,
  projectDefaultFace,
  resolveAvatarFaceStyle,
  resolveAvatarSurfaceShadeOpacity
} from './avatarGeometry'
import type {
  AvatarBodyGeometryOptions,
  AvatarBodyShape,
  BodyGeometry,
  AvatarFaceShadowStyle,
  AvatarFaceStyle,
  AvatarLightDirection,
  AvatarPose,
  ProjectedFace
} from './avatarGeometry'
import {
  createAvatarEntityParts,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene,
  resolveAvatarEntityPartScaleZ
} from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

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
  maxPosition: 230,
  maxScale: 2.4,
  minScale: 0.35
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
  readonly onViewStateChange: (state: AvatarViewState) => void
  readonly palette: AvatarPalette
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
}

interface DragOrigin extends AvatarPose {
  readonly mode: AvatarInteractionMode
  readonly pointerId: number
  readonly positionX: number
  readonly positionY: number
  readonly scale: number
  readonly x: number
  readonly y: number
}

const VIEW_SIZE = 420
const ROTATION_PER_PIXEL = Math.PI / 280
const KEY_ROTATION = Math.PI / 12
const KEY_POSITION_MOVE = 8
const WHEEL_SCALE_SPEED = 0.0015
const FACE_STYLE_ANIMATION_MS = 180
const ENTITY_OCCLUSION_DEPTH_TOLERANCE = 24

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
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
  showLight,
  lightDistance
}: {
  readonly clipId: string
  readonly geometry: ReturnType<typeof buildAvatarBodyGeometry>
  readonly part: AvatarEntityPart
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
        <path d={geometry.outlinePath} fill={part.baseColor} />
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
      {geometry.cavityPath == null
        ? null
        : <path d={geometry.cavityPath} fill={part.shadowColor} fillOpacity='.9' />}
    </>
  )
}

const getEntityPartGeometryOptions = (part: AvatarEntityPart): AvatarBodyGeometryOptions => ({
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
  gridDensity: number
) => buildAvatarBodyGeometry(part.shape, pose, lightDirection, gridDensity, getEntityPartGeometryOptions(part))

const buildEntityPartGeometries = (
  parts: readonly AvatarEntityPart[],
  pose: AvatarPose,
  lightDirection: AvatarLightDirection,
  gridDensity: number
): Record<string, BodyGeometry> => {
  const cache = new Map<string, BodyGeometry>()
  return Object.fromEntries(parts.map(part => {
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
      part.scaleX,
      part.scaleY,
      resolveAvatarEntityPartScaleZ(part)
    ])
    let geometry = cache.get(geometryKey)
    if (geometry == null) {
      geometry = buildEntityPartGeometry(part, pose, lightDirection, gridDensity)
      cache.set(geometryKey, geometry)
    }
    return [part.id, geometry]
  }))
}

function EntityPresetBody({
  avatarOutlineStyle,
  face,
  faceStyle,
  geometries,
  idPrefix,
  interactive,
  lightDistance,
  onPartSelect,
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
  readonly geometries: Readonly<Record<string, BodyGeometry>>
  readonly idPrefix: string
  readonly interactive: boolean
  readonly lightDistance: number
  readonly onPartSelect?: (id: string) => void
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
  const projectedParts = parts.map((part, index) => {
    const yawX = part.x * cosYaw + part.z * sinYaw
    const yawZ = -part.x * sinYaw + part.z * cosYaw
    return {
      ...part,
      depth: -part.y * sinPitch + yawZ * cosPitch,
      index,
      projectedX: yawX,
      projectedY: part.y * cosPitch + yawZ * sinPitch
    }
  }).sort((left, right) => left.depth - right.depth)
  const outlineWidth = avatarOutlineStyle?.width ?? 0
  const outlineEnabled = showOutline && avatarOutlineStyle != null && outlineWidth > 0
  const facePart = projectedParts.find(part => part.face) ?? projectedParts.at(-1)
  const selectedPart = projectedParts.find(part => part.id === selectedPartId)
  const faceGeometry = facePart == null ? null : geometries[facePart.id]
  const partTransform = (part: (typeof projectedParts)[number]) => (
    `translate(${part.projectedX} ${part.projectedY})`
  )
  const occlusionMaskId = (part: (typeof projectedParts)[number]) => `${idPrefix}-entity-occlusion-${part.index}`
  const occlusionClipId = (part: (typeof projectedParts)[number]) => `${idPrefix}-entity-occlusion-clip-${part.index}`
  const isOccludedByFace = (part: (typeof projectedParts)[number]) => (
    part.occludedByFace === true &&
    facePart != null &&
    part.id !== facePart.id &&
    part.depth <= facePart.depth + ENTITY_OCCLUSION_DEPTH_TOLERANCE
  )
  const hitTestParts = [...projectedParts].sort((left, right) => {
    const areaDifference = right.scaleX * right.scaleY - left.scaleX * left.scaleY
    return areaDifference === 0 ? left.depth - right.depth : areaDifference
  })
  const shadowDirection = shadowStyle.direction * Math.PI / 180
  const faceShadowTransform = (depth: number) => {
    const distance = shadowStyle.distance * depth
    return `translate(${(Math.cos(shadowDirection) * distance).toFixed(2)} ${
      (Math.sin(shadowDirection) * distance).toFixed(2)
    })`
  }

  return (
    <g data-avatar-entity-preset={preset}>
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
        {facePart == null || faceGeometry == null
          ? null
          : projectedParts.filter(isOccludedByFace).map(part => geometries[part.id].occlusionPath == null
            ? null
            : (
              <clipPath key={`occlusion-clip-${part.id}`} id={occlusionClipId(part)}>
                <path d={geometries[part.id].occlusionPath} transform={partTransform(part)} />
              </clipPath>
              ))}
        {facePart == null || faceGeometry == null
          ? null
          : projectedParts.filter(isOccludedByFace).map(part => (
            <mask
              key={`mask-${part.id}`}
              id={occlusionMaskId(part)}
              x={-VIEW_SIZE}
              y={-VIEW_SIZE}
              width={VIEW_SIZE * 3}
              height={VIEW_SIZE * 3}
              maskUnits='userSpaceOnUse'
            >
              <rect x={-VIEW_SIZE} y={-VIEW_SIZE} width={VIEW_SIZE * 3} height={VIEW_SIZE * 3} fill='white' />
              {geometries[part.id].occlusionPath == null
                ? <path d={faceGeometry.outlinePath} fill='black' transform={partTransform(facePart)} />
                : (
                  <g clipPath={`url(#${occlusionClipId(part)})`}>
                    <path d={faceGeometry.outlinePath} fill='black' transform={partTransform(facePart)} />
                  </g>
                  )}
            </mask>
          ))}
      </defs>
      <g filter={outlineEnabled ? `url(#${idPrefix}-entity-outline)` : undefined}>
        {projectedParts.map(part => (
          <g
            key={part.id}
            data-avatar-entity-part={part.id}
            mask={isOccludedByFace(part) ? `url(#${occlusionMaskId(part)})` : undefined}
            pointerEvents={interactive ? 'none' : undefined}
          >
            <g transform={partTransform(part)}>
              <EntityPrimitive
                clipId={`${idPrefix}-entity-${preset}-${part.index}`}
                geometry={geometries[part.id]}
                part={part}
                showLight={showLight && renderSurfaceCells && (part.face || part.scaleX * part.scaleY >= .075)}
                lightDistance={lightDistance}
              />
              {surfaceDecals.filter(decal => decal.targetPartId === part.id).map(decal => (
                <path
                  key={decal.id}
                  data-avatar-surface-decal={decal.id}
                  d={decal.path}
                  fill={decal.color}
                  fillOpacity={decal.opacity / 100}
                />
              ))}
            </g>
          </g>
        ))}
      </g>
      {showGrid && selectedPart != null
        ? [selectedPart].map(part => (
          <g
            key={`grid-${part.index}`}
            mask={isOccludedByFace(part) ? `url(#${occlusionMaskId(part)})` : undefined}
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
      {interactive && selectedPart != null
        ? (
          <g
            mask={isOccludedByFace(selectedPart) ? `url(#${occlusionMaskId(selectedPart)})` : undefined}
            pointerEvents='none'
          >
            <g transform={partTransform(selectedPart)}>
              <path
                d={geometries[selectedPart.id].outlinePath}
                fill='none'
                stroke='var(--primary-color)'
                strokeDasharray='5 4'
                strokeWidth={2}
              />
            </g>
          </g>
        )
        : null}
      {face.visible && facePart != null
        ? (
          <g
            transform={partTransform(facePart)}
          >
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
            {face.eyes.map(eye => <path key={eye.id} d={eye.path} fill={facePart.foregroundColor} />)}
              {face.eyeHighlights.map(highlight => (
                <path
                  key={highlight.id}
                  data-avatar-eye-highlight={highlight.id}
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
                  <path d={face.nose.path} fill={facePart.foregroundColor} />
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
                  <path d={face.mouth.path} fill={facePart.foregroundColor} />
                </>
              )}
          </g>
        )
        : null}
      {interactive
        ? hitTestParts.map(part => (
          <g
            key={`hit-${part.id}`}
            data-avatar-entity-part-hit={part.id}
            mask={isOccludedByFace(part) ? `url(#${occlusionMaskId(part)})` : undefined}
          >
            <g transform={partTransform(part)}>
              <path
                d={geometries[part.id].outlinePath}
                fill='transparent'
                pointerEvents='all'
              />
            </g>
          </g>
        ))
        : null}
    </g>
  )
}

export const EntityPresetPreview = memo(function EntityPresetPreview({
  lightDirection,
  preset
}: {
  readonly lightDirection: AvatarLightDirection
  readonly preset: Exclude<AvatarEntityPreset, 'custom'>
}) {
  const rawId = useId()
  const id = rawId.replaceAll(':', '')
  const scene = useMemo(() => getAvatarEntityPresetScene(preset), [preset])
  const pose = useMemo<AvatarPose>(() => scene == null
    ? { pitch: -.22, yaw: -.38 }
    : { pitch: scene.viewState.pitch, yaw: scene.viewState.yaw }, [scene])
  const parts = useMemo(() => createAvatarEntityParts(preset), [preset])
  const faceStyle = useMemo(
    () => getAvatarEntityPresetFaceStyle(preset) ?? ENTITY_PREVIEW_FACE_STYLE,
    [preset]
  )
  const geometries = useMemo(
    () => buildEntityPartGeometries(parts, pose, lightDirection, 25),
    [lightDirection, parts, pose]
  )
  const facePart = parts.find(part => part.face)
  const face = useMemo(
    () => projectDefaultFace(
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
        : <rect width={VIEW_SIZE} height={VIEW_SIZE} rx='34' fill={scene.cameraBackground} />}
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
          surfaceDecals={[]}
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
  onViewStateChange,
  palette,
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
  const rawId = useId()
  const id = rawId.replaceAll(':', '')
  const animatedFaceStyle = useAnimatedFaceStyle(faceStyle, faceStyleTransitionsEnabled)
  const resolvedGridDensity = gridDensity ?? AVATAR_GRID_DENSITY.default
  const renderedGridDensity = dragging
    ? Math.min(resolvedGridDensity, 50)
    : resolvedGridDensity
  const bodyGeometry = useMemo(
    () => buildAvatarBodyGeometry(bodyShape, pose, lightDirection, renderedGridDensity),
    [bodyShape, lightDirection, pose, renderedGridDensity]
  )
  const face = useMemo(
    () => projectDefaultFace(pose, bodyShape, animatedFaceStyle),
    [animatedFaceStyle, bodyShape, pose]
  )
  const sourceEntityParts = useMemo(
    () => entityParts.length > 0 ? entityParts : createAvatarEntityParts(entityPreset),
    [entityParts, entityPreset]
  )
  const usesEntityParts = sourceEntityParts.length > 0
  const resolvedEntityParts = useMemo(
    () => sourceEntityParts.map(part => ({
      ...part,
      baseColor: applyAvatarColorGrade(part.baseColor, colorGrade),
      highlightColor: applyAvatarColorGrade(part.highlightColor, colorGrade),
      shadowColor: applyAvatarColorGrade(part.shadowColor, colorGrade)
    })),
    [colorGrade, sourceEntityParts]
  )
  const entityGeometries = useMemo(
    () => buildEntityPartGeometries(sourceEntityParts, pose, lightDirection, renderedGridDensity),
    [lightDirection, pose, renderedGridDensity, sourceEntityParts]
  )
  const entityFacePart = sourceEntityParts.find(part => part.face)
  const entityFace = useMemo(
    () => projectDefaultFace(
      pose,
      entityFacePart?.shape ?? 'sphere',
      animatedFaceStyle,
      entityFacePart == null ? {} : getEntityFaceGeometryOptions(entityFacePart, entityPreset)
    ),
    [animatedFaceStyle, entityFacePart, entityPreset, pose]
  )
  const projectedSurfaceDecals = useMemo<ProjectedSurfaceDecal[]>(() => surfaceDecals.flatMap(decal => {
    if (!usesEntityParts) {
      if (decal.targetPartId != null) return []
      const projected = projectAvatarSurfaceDecal(pose, bodyShape, decal)
      return projected == null ? [] : [{ ...decal, path: projected.path }]
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
    return projected == null ? [] : [{ ...decal, path: projected.path, targetPartId: targetPart.id }]
  }), [bodyShape, entityFacePart, entityPreset, pose, sourceEntityParts, surfaceDecals, usesEntityParts])
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

  useEffect(() => () => {
    if (dragRenderFrameRef.current != null) window.cancelAnimationFrame(dragRenderFrameRef.current)
  }, [])

  const scheduleDragViewState = (nextState: AvatarViewState) => {
    pendingDragViewStateRef.current = nextState
    if (dragRenderFrameRef.current != null) return
    dragRenderFrameRef.current = window.requestAnimationFrame(() => {
      dragRenderFrameRef.current = undefined
      const pendingState = pendingDragViewStateRef.current
      if (pendingState != null) setTransientViewState(pendingState)
    })
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
    if (event.button === 0 && event.target instanceof Element) {
      const partHitTarget = event.target.closest<SVGGElement>('[data-avatar-entity-part-hit]')
      const partId = partHitTarget?.dataset.avatarEntityPartHit
      onEntityPartSelect?.(partId ?? null)
    }
    const temporaryMove = event.button === 2 || (event.pointerType === 'mouse' && event.detail >= 2)
    if (temporaryMove) event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOriginRef.current = {
      mode: temporaryMove ? 'move' : interactionMode,
      pitch: poseRef.current.pitch,
      pointerId: event.pointerId,
      positionX: positionRef.current.x,
      positionY: positionRef.current.y,
      scale: VIEW_SIZE / event.currentTarget.getBoundingClientRect().width,
      x: event.clientX,
      y: event.clientY,
      yaw: poseRef.current.yaw
    }
    setDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const origin = dragOriginRef.current
    if (origin == null || origin.pointerId !== event.pointerId) return
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
    if (dragOriginRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (dragRenderFrameRef.current != null) {
      window.cancelAnimationFrame(dragRenderFrameRef.current)
      dragRenderFrameRef.current = undefined
    }
    const finalViewState = pendingDragViewStateRef.current
    pendingDragViewStateRef.current = undefined
    dragOriginRef.current = undefined
    setTransientViewState(null)
    setDragging(false)
    if (finalViewState != null) onViewStateChange(finalViewState)
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

  return (
    <div
      className='interactive-avatar'
      data-dragging={dragging}
      data-interaction-mode={interactionMode}
      data-object-position-x={position.x}
      data-object-position-y={position.y}
      data-object-scale={avatarScale}
      data-pitch={pose.pitch}
      data-position-x={position.x}
      data-position-y={position.y}
      data-roll={avatarRoll}
      data-visible-marks={face.eyes.length + (face.nose != null && animatedFaceStyle.noseEnabled ? 1 : 0) +
        (face.mouth != null && animatedFaceStyle.mouthEnabled ? 1 : 0)}
      data-yaw={pose.yaw}
    >
      <svg
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
          transform={`translate(${position.x} ${position.y}) translate(${VIEW_SIZE / 2} ${
            VIEW_SIZE / 2
          }) rotate(${avatarRoll * 180 / Math.PI}) scale(${avatarScale}) translate(${-VIEW_SIZE / 2} ${-VIEW_SIZE / 2})`}
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
                      d={eye.path}
                      fill={surfaceForeground}
                    />
                  ))}
                  {face.eyeHighlights.map(highlight => (
                    <path
                      key={highlight.id}
                      data-avatar-eye-highlight={highlight.id}
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
                geometries={entityGeometries}
                idPrefix={id}
                interactive={interactive}
                lightDistance={lightDistance}
                onPartSelect={onEntityPartSelect}
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
  previous.entityParts === next.entityParts &&
  previous.entityPreset === next.entityPreset &&
  previous.faceStyleTransitionsEnabled === next.faceStyleTransitionsEnabled &&
  previous.gridDensity === next.gridDensity &&
  previous.interactive === next.interactive &&
  previous.interactionMode === next.interactionMode &&
  previous.lightDistance === next.lightDistance &&
  previous.onEntityPartSelect === next.onEntityPartSelect &&
  previous.onViewStateChange === next.onViewStateChange &&
  previous.palette === next.palette &&
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
