import {
  AVATAR_DEFINITION_SCHEMA,
  AVATAR_DEFINITION_VERSION,
  anchorAvatarAnimationClip,
  applyAvatarScenePatch
} from '@oneworks/avatar-core'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarDefinition,
  AvatarScene
} from '@oneworks/avatar-core'
import type { AvatarBackgroundStyle } from '@oneworks/avatar'

import type { ExportSize } from './ExportToolbar'
import type {
  AvatarDropShadowStyle,
  AvatarInteractionMode,
  AvatarOutlineStyle,
  AvatarViewState
} from './InteractiveAvatar'
import type {
  AvatarAnimationKeyframe,
  AvatarAnimationPlaybackMode,
  SavedAvatarAnimation
} from './avatarAnimations'
import type { AvatarColorGrade } from './avatarColorGrade'
import { serializeAvatarEntityParts } from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import type { AvatarBodyShape, AvatarFaceShadowStyle, AvatarFaceStyle } from './avatarGeometry'
import type { AvatarCameraFrame } from './AvatarControls'

export interface AvatarDefinitionState {
  readonly animation?: SavedAvatarAnimation | null
  readonly avatarOutlineStyle: AvatarOutlineStyle
  readonly avatarShadowStyle: AvatarDropShadowStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly cameraBackground: string
  readonly cameraFrame: AvatarCameraFrame
  readonly colorGrade: AvatarColorGrade
  readonly entityParts: readonly AvatarEntityPart[]
  readonly entityPreset: AvatarEntityPreset
  readonly exportSize: ExportSize
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly faceStyle: AvatarFaceStyle
  readonly frameShadowStyle: AvatarDropShadowStyle
  readonly glyph: {
    readonly leftEye: string
    readonly linkEyes: boolean
    readonly mouth: string
    readonly rightEye: string
  }
  readonly gridDensity: number
  readonly interactionMode: AvatarInteractionMode
  readonly lightAzimuth: number
  readonly lightDistance: number
  readonly lightElevation: number
  readonly paletteId: string
  readonly showAvatarShadow: boolean
  readonly showFrameShadow: boolean
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showShadow: boolean
  readonly viewState: AvatarViewState
}

const toPublicPart = (part: AvatarEntityPart) => ({ ...part })

export const savedAvatarAnimationToClip = (animation: SavedAvatarAnimation): AvatarAnimationClip => {
  let atMs = 0
  const keyframes = animation.keyframes.map((keyframe, index) => {
    if (index > 0) atMs += keyframe.durationMs
    return {
      atMs,
      easing: keyframe.easing,
      patch: {
        colorGrade: keyframe.colorGrade,
        face: keyframe.faceStyle,
        view: {
          pitch: keyframe.pitch,
          positionX: keyframe.positionX,
          positionY: keyframe.positionY,
          yaw: keyframe.yaw
        }
      }
    }
  })
  const loopDuration = animation.playbackMode === 'loop'
    ? animation.keyframes[0]?.durationMs ?? 0
    : 0
  return {
    anchor: animation.lockStartPosition ? 'absolute' : 'relative',
    durationMs: Math.max(atMs + loopDuration, 1),
    keyframes,
    label: animation.name,
    playback: animation.playbackMode
  }
}

const createEmbeddedAnimationLibrary = (animation: SavedAvatarAnimation): AvatarAnimationLibrary => ({
  groups: {
    document: {
      clips: { animation: savedAvatarAnimationToClip(animation) },
      defaultClip: 'animation',
      label: 'Document animations'
    }
  },
  id: 'document',
  label: 'Document animations'
})

export const createAvatarDefinition = (
  state: AvatarDefinitionState,
  previous?: AvatarDefinition
): AvatarDefinition => ({
  animations: state.animation == null
    ? previous?.animations
    : createEmbeddedAnimationLibrary(state.animation),
  metadata: previous?.metadata,
  scene: {
    appearance: {
      backgroundStyle: state.backgroundStyle,
      bodyShape: state.bodyShape,
      paletteId: state.paletteId
    },
    camera: {
      background: state.cameraBackground,
      frame: state.cameraFrame,
      frameShadow: state.frameShadowStyle,
      showFrameShadow: state.showFrameShadow,
      size: state.exportSize
    },
    effects: {
      avatarShadow: state.avatarShadowStyle,
      colorGrade: state.colorGrade,
      faceShadow: state.faceShadowStyle,
      outline: state.avatarOutlineStyle,
      showAvatarShadow: state.showAvatarShadow,
      showFaceShadow: state.showShadow,
      showOutline: state.showOutline
    },
    entity: {
      parts: state.entityParts.map(toPublicPart),
      preset: state.entityPreset
    },
    face: state.faceStyle,
    glyph: state.glyph,
    interactionMode: state.interactionMode,
    lighting: {
      azimuth: state.lightAzimuth,
      distance: state.lightDistance,
      elevation: state.lightElevation,
      enabled: state.showLight,
      gridDensity: state.gridDensity
    },
    view: state.viewState
  },
  schema: AVATAR_DEFINITION_SCHEMA,
  version: AVATAR_DEFINITION_VERSION
})

const setBoolean = (params: URLSearchParams, key: string, value: boolean) => {
  params.set(key, value ? '1' : '0')
}

export const avatarDefinitionToSearchParams = (definition: AvatarDefinition) => {
  const { scene } = definition
  const params = new URLSearchParams()
  params.set('face', `${scene.glyph.leftEye}${scene.glyph.mouth}${scene.glyph.rightEye}`)
  params.set('palette', scene.appearance.paletteId)
  params.set('bg', scene.appearance.backgroundStyle)
  params.set('shape', scene.appearance.bodyShape)
  params.set('mode', scene.interactionMode)
  params.set('yaw', String(scene.view.yaw))
  params.set('pitch', String(scene.view.pitch))
  params.set('roll', String(scene.view.roll))
  params.set('positionX', String(scene.view.positionX))
  params.set('positionY', String(scene.view.positionY))
  params.set('scale', String(scene.view.scale))
  params.set('camera', '1')
  params.set('cameraBg', scene.camera.background)
  params.set('cameraFrame', scene.camera.frame)
  setBoolean(params, 'eyes', scene.glyph.linkEyes)
  params.set('eyeShape', scene.face.eyeShape)
  params.set('eyeRound', String(scene.face.eyeRoundness))
  params.set('eyeW', String(scene.face.width))
  params.set('eyeH', String(scene.face.height))
  params.set('eyeGap', String(scene.face.gap))
  params.set('eyeRot', String(scene.face.rotation))
  params.set('eyeLeftRot', String(scene.face.leftEyeRotation))
  params.set('eyeRightRot', String(scene.face.rightEyeRotation))
  setBoolean(params, 'nose', scene.face.noseEnabled)
  params.set('noseShape', scene.face.noseShape)
  params.set('noseW', String(scene.face.noseWidth))
  params.set('noseH', String(scene.face.noseHeight))
  params.set('noseY', String(scene.face.noseY))
  params.set('noseRot', String(scene.face.noseRotation))
  setBoolean(params, 'mouth', scene.face.mouthEnabled)
  params.set('mouthShape', scene.face.mouthShape)
  params.set('mouthCurve', String(scene.face.mouthCurve))
  params.set('mouthW', String(scene.face.mouthWidth))
  params.set('mouthH', String(scene.face.mouthHeight))
  params.set('mouthY', String(scene.face.mouthY))
  params.set('mouthRot', String(scene.face.mouthRotation))
  setBoolean(params, 'light', scene.lighting.enabled)
  params.set('lightAz', String(scene.lighting.azimuth))
  params.set('lightEl', String(scene.lighting.elevation))
  params.set('lightDist', String(scene.lighting.distance))
  setBoolean(params, 'shadow', scene.effects.showFaceShadow)
  params.set('shadowDir', String(scene.effects.faceShadow.direction))
  params.set('shadowDist', String(scene.effects.faceShadow.distance))
  params.set('shadowOpacity', String(scene.effects.faceShadow.opacity))
  params.set('shadowSoft', String(scene.effects.faceShadow.softness))
  setBoolean(params, 'avatarShadow', scene.effects.showAvatarShadow)
  params.set('avatarShadowColor', scene.effects.avatarShadow.color ?? '#000000')
  params.set('avatarShadowDir', String(scene.effects.avatarShadow.direction))
  params.set('avatarShadowDist', String(scene.effects.avatarShadow.distance))
  params.set('avatarShadowOpacity', String(scene.effects.avatarShadow.opacity))
  params.set('avatarShadowSoft', String(scene.effects.avatarShadow.softness))
  setBoolean(params, 'outline', scene.effects.showOutline)
  params.set('outlineColor', scene.effects.outline.color)
  params.set('outlineWidth', String(scene.effects.outline.width))
  params.set('outlineOpacity', String(scene.effects.outline.opacity))
  setBoolean(params, 'frameShadow', scene.camera.showFrameShadow)
  params.set('frameShadowDir', String(scene.camera.frameShadow.direction))
  params.set('frameShadowDist', String(scene.camera.frameShadow.distance))
  params.set('frameShadowOpacity', String(scene.camera.frameShadow.opacity))
  params.set('frameShadowSoft', String(scene.camera.frameShadow.softness))
  params.set('gridDensity', String(scene.lighting.gridDensity))
  params.set('entity', scene.entity.preset)
  if (scene.entity.parts.length > 0) {
    params.set('entityParts', serializeAvatarEntityParts(scene.entity.parts as readonly AvatarEntityPart[]))
  }
  params.set('size', String(scene.camera.size))
  params.set('sidebar', '1')
  params.set('animationPanel', '0')
  return params
}

export const avatarAnimationClipToSavedAnimation = (
  id: string,
  clip: AvatarAnimationClip,
  scene: AvatarScene
): SavedAvatarAnimation => {
  const resolvedClip = anchorAvatarAnimationClip({
    scene,
    schema: AVATAR_DEFINITION_SCHEMA,
    version: AVATAR_DEFINITION_VERSION
  }, clip)
  const ordered = [...resolvedClip.keyframes].sort((a, b) => a.atMs - b.atMs)
  const withBase = ordered[0]?.atMs != null && ordered[0].atMs > 0
    ? [{ atMs: 0, easing: ordered[0].easing, patch: {} }, ...ordered]
    : ordered
  const last = withBase.at(-1)
  const timeline = resolvedClip.playback === 'once' && last != null && last.atMs < resolvedClip.durationMs
    ? [...withBase, { atMs: resolvedClip.durationMs, easing: last.easing, patch: last.patch }]
    : withBase
  const keyframes: AvatarAnimationKeyframe[] = timeline.map((frame, index) => {
    const resolved = applyAvatarScenePatch(scene, frame.patch)
    const previous = timeline[index - 1]
    const durationMs = index === 0
      ? resolvedClip.playback === 'loop'
        ? Math.max(resolvedClip.durationMs - (timeline.at(-1)?.atMs ?? 0), 100)
        : 100
      : Math.max(frame.atMs - (previous?.atMs ?? 0), 100)
    return {
      colorGrade: resolved.effects.colorGrade as AvatarColorGrade,
      durationMs,
      easing: frame.easing ?? 'linear',
      faceStyle: resolved.face as AvatarFaceStyle,
      pitch: resolved.view.pitch,
      positionX: resolved.view.positionX,
      positionY: resolved.view.positionY,
      yaw: resolved.view.yaw
    }
  })
  return {
    createdAt: 0,
    id,
    keyframes,
    lockStartPosition: resolvedClip.anchor === 'absolute',
    name: resolvedClip.label ?? id,
    playbackMode: resolvedClip.playback as AvatarAnimationPlaybackMode,
    startFrameIndex: 0,
    version: 3
  }
}

export interface PublicAvatarAnimationEntry {
  readonly animation: SavedAvatarAnimation
  readonly clipId: string
  readonly groupId: string
  readonly libraryId: string
}

export const flattenAvatarAnimationLibraries = (
  libraries: readonly AvatarAnimationLibrary[],
  scene: AvatarScene
): readonly PublicAvatarAnimationEntry[] => libraries.flatMap(library => (
  Object.entries(library.groups).flatMap(([groupId, group]) => (
    Object.entries(group.clips).map(([clipId, clip]) => ({
      animation: avatarAnimationClipToSavedAnimation(
        `public:${library.id}:${groupId}:${clipId}`,
        clip,
        scene
      ),
      clipId,
      groupId,
      libraryId: library.id
    }))
  ))
))
