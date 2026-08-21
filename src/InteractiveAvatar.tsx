import './InteractiveAvatar.scss'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, WheelEvent } from 'react'

import type { AvatarBackgroundStyle, AvatarPalette } from '@oneworks/avatar'

import {
  AVATAR_BODY_SHAPES,
  buildAvatarBodyGeometry,
  projectDefaultFace,
  resolveAvatarFaceStyle
} from './avatarGeometry'
import type {
  AvatarBodyShape,
  AvatarFaceShadowStyle,
  AvatarFaceStyle,
  AvatarLightDirection,
  AvatarPose
} from './avatarGeometry'

export { AVATAR_BODY_SHAPES }
export type { AvatarBodyShape }
export type AvatarInteractionMode = 'move' | 'rotate'

export interface AvatarViewState {
  readonly pitch: number
  readonly positionX: number
  readonly positionY: number
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
  scale: 1.28,
  yaw: 0
}

interface InteractiveAvatarProps {
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly faceStyleTransitionsEnabled?: boolean
  readonly faceStyle: AvatarFaceStyle
  readonly interactive?: boolean
  readonly interactionMode: AvatarInteractionMode
  readonly lightDirection: AvatarLightDirection
  readonly onViewStateChange: (state: AvatarViewState) => void
  readonly palette: AvatarPalette
  readonly shadowStyle: AvatarFaceShadowStyle
  readonly showLight: boolean
  readonly showShadow: boolean
  readonly viewState: AvatarViewState
}

interface AvatarPosition {
  readonly x: number
  readonly y: number
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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress

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
        eyeRoundness: interpolate(from.eyeRoundness, target.eyeRoundness, easedProgress),
        eyeShape: target.eyeShape,
        gap: interpolate(from.gap, target.gap, easedProgress),
        height: interpolate(from.height, target.height, easedProgress),
        leftEyeRotation: interpolate(from.leftEyeRotation, resolvedTarget.leftEyeRotation, easedProgress),
        mouthCurve: interpolate(from.mouthCurve, target.mouthCurve, easedProgress),
        mouthEnabled: target.mouthEnabled,
        mouthHeight: interpolate(from.mouthHeight, target.mouthHeight, easedProgress),
        mouthRotation: interpolate(from.mouthRotation, target.mouthRotation, easedProgress),
        mouthWidth: interpolate(from.mouthWidth, target.mouthWidth, easedProgress),
        mouthY: interpolate(from.mouthY, target.mouthY, easedProgress),
        noseEnabled: target.noseEnabled,
        noseHeight: interpolate(from.noseHeight, target.noseHeight, easedProgress),
        noseRotation: interpolate(from.noseRotation, target.noseRotation, easedProgress),
        noseShape: target.noseShape,
        noseWidth: interpolate(from.noseWidth, target.noseWidth, easedProgress),
        noseY: interpolate(from.noseY, target.noseY, easedProgress),
        rotation: interpolate(from.rotation, target.rotation, easedProgress),
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
    target.eyeRoundness,
    target.eyeShape,
    target.gap,
    target.height,
    target.leftEyeRotation,
    target.mouthCurve,
    target.mouthEnabled,
    target.mouthHeight,
    target.mouthRotation,
    target.mouthWidth,
    target.mouthY,
    target.noseEnabled,
    target.noseHeight,
    target.noseRotation,
    target.noseShape,
    target.noseWidth,
    target.noseY,
    target.rotation,
    target.rightEyeRotation,
    target.width,
    transitionsEnabled
  ])

  return animatedStyle
}

export function InteractiveAvatar({
  backgroundStyle,
  bodyShape,
  faceStyleTransitionsEnabled = true,
  faceStyle,
  interactive = true,
  interactionMode,
  lightDirection,
  onViewStateChange,
  palette,
  shadowStyle,
  showLight,
  showShadow,
  viewState
}: InteractiveAvatarProps) {
  const [dragging, setDragging] = useState(false)
  const pose = useMemo<AvatarPose>(() => ({ pitch: viewState.pitch, yaw: viewState.yaw }), [
    viewState.pitch,
    viewState.yaw
  ])
  const position = useMemo<AvatarPosition>(() => ({ x: viewState.positionX, y: viewState.positionY }), [
    viewState.positionX,
    viewState.positionY
  ])
  const avatarScale = viewState.scale
  const poseRef = useRef(pose)
  const positionRef = useRef(position)
  const avatarScaleRef = useRef(avatarScale)
  const dragOriginRef = useRef<DragOrigin>()
  const rawId = useId()
  const id = rawId.replaceAll(':', '')
  const animatedFaceStyle = useAnimatedFaceStyle(faceStyle, faceStyleTransitionsEnabled)
  const bodyGeometry = useMemo(
    () => buildAvatarBodyGeometry(bodyShape, pose, lightDirection),
    [bodyShape, lightDirection, pose]
  )
  const face = useMemo(
    () => projectDefaultFace(pose, bodyShape, animatedFaceStyle),
    [animatedFaceStyle, bodyShape, pose]
  )
  const surfaceMid = backgroundStyle === 'gradient' ? palette.gradient[1] : palette.background
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

  useEffect(() => {
    poseRef.current = pose
    positionRef.current = position
    avatarScaleRef.current = avatarScale
  }, [avatarScale, pose, position])

  const updatePose = (nextPose: AvatarPose) => {
    poseRef.current = nextPose
    onViewStateChange({
      pitch: nextPose.pitch,
      positionX: positionRef.current.x,
      positionY: positionRef.current.y,
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
      scale: clampedScale,
      yaw: poseRef.current.yaw
    })
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 && event.button !== 2) return
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
      updatePosition({
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
      })
      return
    }
    updatePose({
      pitch: origin.pitch + (event.clientY - origin.y) * ROTATION_PER_PIXEL,
      yaw: origin.yaw + (event.clientX - origin.x) * ROTATION_PER_PIXEL
    })
  }

  const finishPointerInteraction = (event: PointerEvent<SVGSVGElement>) => {
    if (dragOriginRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragOriginRef.current = undefined
    setDragging(false)
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
        </defs>

        <g
          transform={`translate(${position.x} ${position.y}) translate(${VIEW_SIZE / 2} ${
            VIEW_SIZE / 2
          }) scale(${avatarScale}) translate(${-VIEW_SIZE / 2} ${-VIEW_SIZE / 2})`}
        >
          <g clipPath={`url(#${id}-clip)`}>
            <path d={bodyGeometry.outlinePath} fill={surfaceMid} />
            {showLight
              ? bodyGeometry.cells.map(cell => (
                <polygon
                  key={cell.id}
                  points={cell.points}
                  fill={cell.shade >= 0 ? palette.gradient[0] : palette.shadow}
                  fillOpacity={Math.abs(cell.shade) * (cell.shade >= 0 ? 0.34 : 0.48)}
                />
              ))
              : null}

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
                        fill={palette.shadow}
                        filter={shadowFilter}
                        opacity={getFaceShadowOpacity(eye.depth)}
                      />
                    ))
                    : null}
                  {face.eyes.map(eye => (
                    <path
                      key={eye.id}
                      d={eye.path}
                      fill={palette.foreground}
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
                                fill={palette.shadow}
                                filter={shadowFilter}
                                opacity={getFaceShadowOpacity(part.depth)}
                              />
                            )
                            : null}
                          <path
                            d={part.path}
                            fill={palette.foreground}
                          />
                        </g>
                      )
                  )}
                </g>
              )
              : null}
          </g>
          <path
            d={bodyGeometry.outlinePath}
            fill='none'
            stroke='#fff'
            strokeOpacity='.14'
            strokeWidth='1.5'
            strokeLinejoin='round'
          />
        </g>
      </svg>
    </div>
  )
}
