import './HomeAvatarPreview.scss'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { getAvatarPalette } from '@oneworks/avatar'

import { DEFAULT_AVATAR_FACE_SHADOW_STYLE } from './avatarGeometry'
import {
  AVATAR_ANIMATION_PRESETS,
  easeAvatarAnimationProgress,
  interpolateAvatarAnimationKeyframes,
  resolveAvatarAnimationPreset,
  resolveAvatarAnimationTimedSegment
} from './avatarAnimations'
import type { AvatarAnimationPresetId } from './avatarAnimations'
import {
  createAvatarEntityParts,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene
} from './avatarEntityPresets'
import { InteractiveAvatar } from './InteractiveAvatar'
import type { AvatarViewState } from './InteractiveAvatar'
import type { HomeTemplateId } from './avatarHome'

interface HomeAvatarPreviewProps {
  readonly template: HomeTemplateId
}

const ignoreViewStateChange = () => {}

const HOME_HOVER_ANIMATION_IDS = [
  'wink',
  'nod',
  'happy',
  'curious',
  'playful',
  'excited'
] as const satisfies readonly AvatarAnimationPresetId[]

const HOME_HOVER_ANIMATIONS = AVATAR_ANIMATION_PRESETS.filter(preset => (
  HOME_HOVER_ANIMATION_IDS.includes(preset.id as (typeof HOME_HOVER_ANIMATION_IDS)[number])
))

const getFrameShadow = (
  scene: NonNullable<ReturnType<typeof getAvatarEntityPresetScene>>,
  shadowColor: string
) => {
  if (!scene.showFrameShadow) return 'none'
  const direction = scene.frameShadowStyle.direction * Math.PI / 180
  const x = Math.cos(direction) * scene.frameShadowStyle.distance
  const y = Math.sin(direction) * scene.frameShadowStyle.distance
  return `${x.toFixed(2)}px ${y.toFixed(2)}px ${scene.frameShadowStyle.softness}px color-mix(in srgb, ${shadowColor} ${scene.frameShadowStyle.opacity}%, transparent)`
}

const HomeAvatarPreview = ({ template }: HomeAvatarPreviewProps) => {
  const scene = useMemo(() => getAvatarEntityPresetScene(template), [template])
  const baseFaceStyle = useMemo(() => getAvatarEntityPresetFaceStyle(template), [template])
  const animationFrameRef = useRef<number | null>(null)
  const [animationId, setAnimationId] = useState<AvatarAnimationPresetId | null>(null)
  const [faceStyle, setFaceStyle] = useState(baseFaceStyle)
  const [viewState, setViewState] = useState<AvatarViewState | null>(scene?.viewState ?? null)

  useEffect(() => {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setAnimationId(null)
    setFaceStyle(baseFaceStyle)
    setViewState(scene?.viewState ?? null)

    return () => {
      if (animationFrameRef.current != null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [baseFaceStyle, scene])

  if (scene == null || baseFaceStyle == null || faceStyle == null || viewState == null) return null

  const palette = getAvatarPalette(scene.paletteId)

  const playRandomAnimation = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current)
    }
    const preset = HOME_HOVER_ANIMATIONS[Math.floor(Math.random() * HOME_HOVER_ANIMATIONS.length)]
    if (preset == null) return
    const animation = resolveAvatarAnimationPreset(preset, scene.viewState, baseFaceStyle)
    const startedAt = performance.now()
    setAnimationId(preset.id)

    const renderFrame = (now: number) => {
      const segment = resolveAvatarAnimationTimedSegment(animation.keyframes, now - startedAt, 'once')
      const frame = interpolateAvatarAnimationKeyframes(
        animation.keyframes[segment.fromIndex]!,
        animation.keyframes[segment.toIndex]!,
        easeAvatarAnimationProgress(segment.progress, segment.easing)
      )
      setFaceStyle(frame.faceStyle)
      setViewState({
        ...scene.viewState,
        pitch: frame.pitch,
        positionX: frame.positionX,
        positionY: frame.positionY,
        yaw: frame.yaw
      })

      if (segment.finished) {
        animationFrameRef.current = null
        setAnimationId(null)
        setFaceStyle(baseFaceStyle)
        setViewState(scene.viewState)
        return
      }
      animationFrameRef.current = window.requestAnimationFrame(renderFrame)
    }

    animationFrameRef.current = window.requestAnimationFrame(renderFrame)
  }

  return (
    <div
      className='avatar-home-renderer'
      data-animation={animationId ?? 'idle'}
      onPointerEnter={playRandomAnimation}
      style={{
        '--avatar-home-renderer-background': scene.cameraBackground,
        '--avatar-home-renderer-shadow': getFrameShadow(scene, palette.shadow)
      } as CSSProperties}
    >
      <InteractiveAvatar
        avatarOutlineStyle={scene.avatarOutlineStyle}
        avatarShadowStyle={scene.avatarShadowStyle}
        backgroundStyle={scene.backgroundStyle}
        bodyShape='sphere'
        entityParts={createAvatarEntityParts(template)}
        entityPreset={template}
        faceStyleTransitionsEnabled={false}
        faceStyle={faceStyle}
        gridDensity={25}
        interactive={false}
        interactionMode={scene.interactionMode}
        lightDistance={0}
        lightDirection={{ azimuth: -35, elevation: 40 }}
        onViewStateChange={ignoreViewStateChange}
        palette={palette}
        renderSurfaceCells={false}
        shadowStyle={DEFAULT_AVATAR_FACE_SHADOW_STYLE}
        showAvatarShadow={scene.showAvatarShadow}
        showLight={scene.showLight}
        showOutline={scene.showOutline}
        showShadow={scene.showShadow}
        surfaceDecals={scene.surfaceDecals}
        viewState={viewState}
      />
    </div>
  )
}

export default HomeAvatarPreview
