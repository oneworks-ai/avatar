import { renderToStaticMarkup } from 'react-dom/server'

import { getAvatarPalette } from '@oneworks/avatar'

import {
  DEFAULT_AVATAR_VIEW_STATE,
  InteractiveAvatar
} from './InteractiveAvatar'
import {
  AVATAR_ANIMATION_PRESET_COVER_PROGRESS,
  AVATAR_ANIMATION_PRESETS,
  easeAvatarAnimationProgress,
  interpolateAvatarAnimationKeyframes,
  resolveAvatarAnimationPreset,
  resolveAvatarAnimationTimedSegment
} from './avatarAnimations'
import type { AvatarAnimationKeyframe } from './avatarAnimations'
import { resolveAvatarBreedPaletteFromEntityParts } from './avatarBreedTone'
import {
  createAvatarEntityParts,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene
} from './avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_SHADOW_STYLE } from './avatarGeometry'

const REPRESENTATIVE_ENTITY = 'bear' as const
const REPRESENTATIVE_VIEW = {
  ...DEFAULT_AVATAR_VIEW_STATE,
  pitch: 0,
  positionX: 0,
  positionY: 34,
  roll: 0,
  scale: 1.46,
  yaw: 0
} as const

const entityParts = createAvatarEntityParts(REPRESENTATIVE_ENTITY)
const faceStyle = getAvatarEntityPresetFaceStyle(REPRESENTATIVE_ENTITY)
const scene = getAvatarEntityPresetScene(REPRESENTATIVE_ENTITY)

if (faceStyle == null || scene == null) {
  throw new Error('The representative animation-cover entity is missing its authored scene')
}

const resolvePresetFrames = (presetId: (typeof AVATAR_ANIMATION_PRESETS)[number]['id']) => {
  const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === presetId)
  if (preset == null) throw new Error(`Unknown avatar animation preset: ${presetId}`)
  const resolved = resolveAvatarAnimationPreset(preset, REPRESENTATIVE_VIEW, faceStyle, entityParts)
  return { preset, resolved }
}

const resolveFrameAtProgress = (
  resolved: ReturnType<typeof resolveAvatarAnimationPreset>,
  progress: number
) => {
  const segment = resolveAvatarAnimationTimedSegment(resolved.keyframes, resolved.durationMs * progress, 'once')
  const from = resolved.keyframes[segment.fromIndex]
  const to = resolved.keyframes[segment.toIndex]
  if (from == null || to == null) throw new Error(`Unable to resolve animation frame: ${resolved.id}`)
  return interpolateAvatarAnimationKeyframes(
    from,
    to,
    easeAvatarAnimationProgress(segment.progress, segment.easing)
  )
}

const renderCover = (keyframe: AvatarAnimationKeyframe) => {
  const markup = renderToStaticMarkup(
    <InteractiveAvatar
      auxiliaryParts={keyframe.auxiliaryParts}
      auxiliaryShapes={keyframe.auxiliaryShapes}
      avatarOutlineStyle={scene.avatarOutlineStyle}
      backgroundStyle={scene.backgroundStyle}
      bodyShape='sphere'
      bottomTaper={0}
      canvasBackgroundColor={scene.cameraBackground}
      colorGrade={keyframe.colorGrade}
      entityParts={entityParts}
      entityPreset={REPRESENTATIVE_ENTITY}
      faceStyleTransitionsEnabled={false}
      faceStyle={keyframe.faceStyle}
      gridDensity={25}
      interactive={false}
      interactionMode='rotate'
      lightDistance={scene.lightDistance}
      lightDirection={{ azimuth: scene.lightAzimuth, elevation: scene.lightElevation }}
      onViewStateChange={() => {}}
      palette={resolveAvatarBreedPaletteFromEntityParts(getAvatarPalette(scene.paletteId), entityParts)}
      partShapeMorphs={keyframe.partShapeMorphs}
      partTransforms={keyframe.partTransforms}
      renderSurfaceCells={false}
      shadowStyle={DEFAULT_AVATAR_FACE_SHADOW_STYLE}
      showLight={scene.showLight}
      showOutline={scene.showOutline}
      showShadow={scene.showShadow}
      surfaceDecals={scene.surfaceDecals}
      viewState={{
        pitch: keyframe.pitch,
        positionX: keyframe.positionX,
        positionY: keyframe.positionY,
        roll: 0,
        scale: REPRESENTATIVE_VIEW.scale,
        yaw: keyframe.yaw
      }}
    />
  )
  const start = markup.indexOf('<svg')
  const end = markup.lastIndexOf('</svg>')
  if (start < 0 || end < 0) throw new Error('InteractiveAvatar did not render an SVG cover')
  return markup
    .slice(start, end + '</svg>'.length)
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(/\sdata-avatar-[\w-]+-ms="[^"]*"/g, '')
}

export interface GeneratedAvatarAnimationPresetCover {
  readonly presetId: (typeof AVATAR_ANIMATION_PRESETS)[number]['id']
  readonly progress: number
  readonly svg: string
  readonly timelineFrames: readonly {
    readonly progress: number
    readonly svg: string
  }[]
}

export const AVATAR_ANIMATION_COVER_REPRESENTATIVE_ENTITY = REPRESENTATIVE_ENTITY

export const renderAvatarAnimationPresetCovers = (): readonly GeneratedAvatarAnimationPresetCover[] => (
  AVATAR_ANIMATION_PRESETS.map(preset => {
    const { resolved } = resolvePresetFrames(preset.id)
    const progress = AVATAR_ANIMATION_PRESET_COVER_PROGRESS[preset.id]
    const lastKeyframeIndex = Math.max(resolved.keyframes.length - 1, 1)
    const timelineProgresses = [...new Set(resolved.keyframes.map((keyframe, index) => (
      Math.min(Math.max(keyframe.offset ?? index / lastKeyframeIndex, 0), 1)
    )))]
    return {
      presetId: preset.id,
      progress,
      svg: `${renderCover(resolveFrameAtProgress(resolved, progress))}\n`,
      timelineFrames: timelineProgresses.map(frameProgress => ({
        progress: frameProgress,
        svg: `${renderCover(resolveFrameAtProgress(resolved, frameProgress))}\n`
      }))
    }
  })
)
