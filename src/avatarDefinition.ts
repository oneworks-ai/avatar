import {
  AVATAR_DEFINITION_SCHEMA,
  AVATAR_DEFINITION_VERSION,
  DEFAULT_AVATAR_PIXEL_EFFECT,
  anchorAvatarAnimationClip,
  applyAvatarScenePatch,
  mergeAvatarAnimationLibraries,
  parseAvatarAnimationClip
} from '@oneworks/avatar'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarBackgroundStyle,
  AvatarCoatPattern,
  AvatarDefinition,
  AvatarPixelEffect,
  AvatarSeedConfiguration,
  AvatarScene,
  AvatarScenePatch
} from '@oneworks/avatar'

import type { AvatarCameraFrame } from './AvatarControls'
import type { ExportSize } from './ExportToolbar'
import type {
  AvatarDropShadowStyle,
  AvatarInteractionMode,
  AvatarOutlineStyle,
  AvatarViewState
} from './InteractiveAvatar'
import type { AvatarAnimationKeyframe, AvatarAnimationPlaybackMode, SavedAvatarAnimation } from './avatarAnimations'
import type { AvatarColorGrade } from './avatarColorGrade'
import { serializeAvatarEntityParts } from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import { resolveAvatarFaceStyle } from './avatarGeometry'
import type { AvatarBodyShape, AvatarFaceShadowStyle, AvatarFaceStyle } from './avatarGeometry'
import { serializeAvatarSeedFields } from './avatarSeed'
import { serializeAvatarSurfaceDecals } from './avatarSurfaceDecals'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

const DEFAULT_EDITOR_GLYPH = {
  leftEye: '0',
  linkEyes: true,
  mouth: 'w',
  rightEye: '0'
} as const

export interface AvatarDefinitionState {
  readonly animation?: SavedAvatarAnimation | null
  readonly animationLibraryIds?: readonly string[]
  readonly animationTargetKey?: string | null
  readonly avatarOutlineStyle: AvatarOutlineStyle
  readonly avatarShadowStyle: AvatarDropShadowStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly bodyBottomTaper?: number
  readonly cameraBackground: string
  readonly cameraFrame: AvatarCameraFrame
  readonly coatPattern?: AvatarCoatPattern
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
  readonly generation?: AvatarSeedConfiguration
  readonly interactionMode: AvatarInteractionMode
  readonly lightAzimuth: number
  readonly lightDistance: number
  readonly lightElevation: number
  readonly paletteId: string
  readonly pixelEffect: AvatarPixelEffect
  readonly showAvatarShadow: boolean
  readonly showFrameShadow: boolean
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showShadow: boolean
  readonly surfaceDecals?: readonly AvatarSurfaceDecal[]
  readonly viewState: AvatarViewState
}

const toPublicPart = (part: AvatarEntityPart) => ({ ...part })

export const avatarDefinitionToState = (definition: AvatarDefinition): AvatarDefinitionState => {
  const { scene } = definition
  return {
    animation: undefined,
    avatarOutlineStyle: scene.effects.outline,
    avatarShadowStyle: scene.effects.avatarShadow,
    backgroundStyle: scene.appearance.backgroundStyle,
    bodyShape: scene.appearance.bodyShape,
    bodyBottomTaper: scene.appearance.bottomTaper ?? 0,
    cameraBackground: scene.camera.background,
    cameraFrame: scene.camera.frame,
    coatPattern: scene.appearance.coatPattern,
    colorGrade: scene.effects.colorGrade,
    entityParts: scene.entity.parts,
    entityPreset: scene.entity.preset,
    exportSize: scene.camera.size,
    faceShadowStyle: scene.effects.faceShadow,
    faceStyle: resolveAvatarFaceStyle(scene.face),
    frameShadowStyle: scene.camera.frameShadow,
    glyph: DEFAULT_EDITOR_GLYPH,
    gridDensity: scene.lighting.gridDensity,
    generation: definition.metadata?.generation,
    interactionMode: scene.interactionMode,
    lightAzimuth: scene.lighting.azimuth,
    lightDistance: scene.lighting.distance,
    lightElevation: scene.lighting.elevation,
    paletteId: scene.appearance.paletteId,
    pixelEffect: scene.effects.pixelate ?? DEFAULT_AVATAR_PIXEL_EFFECT,
    showAvatarShadow: scene.effects.showAvatarShadow,
    showFrameShadow: scene.camera.showFrameShadow,
    showLight: scene.lighting.enabled,
    showOutline: scene.effects.showOutline,
    showShadow: scene.effects.showFaceShadow,
    surfaceDecals: scene.decals,
    viewState: scene.view
  }
}

export const savedAvatarAnimationToClip = (animation: SavedAvatarAnimation): AvatarAnimationClip => {
  let atMs = 0
  const keyframes = animation.keyframes.map((keyframe, index) => {
    if (index > 0) atMs += keyframe.durationMs
    return {
      atMs,
      easing: keyframe.easing,
      patch: {
        ...(keyframe.colorGrade == null ? {} : { colorGrade: keyframe.colorGrade }),
        face: Object.fromEntries(
          Object.entries(keyframe.faceStyle).filter(([, value]) => value !== undefined)
        ) as NonNullable<AvatarScenePatch['face']>,
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

const createEmbeddedAnimationLibrary = (
  animation: SavedAvatarAnimation,
  id = 'document'
): AvatarAnimationLibrary => ({
  groups: {
    document: {
      clips: { animation: savedAvatarAnimationToClip(animation) },
      defaultClip: 'animation',
      label: 'Document animations'
    }
  },
  id,
  label: 'Document animations'
})

const mergeEmbeddedAnimation = (
  previous: AvatarAnimationLibrary | undefined,
  animation: SavedAvatarAnimation,
  targetKey?: string | null,
  reservedLibraryIds: readonly string[] = []
): AvatarAnimationLibrary => {
  const clip = savedAvatarAnimationToClip(animation)
  const reservedIds = new Set(reservedLibraryIds)
  const uniqueDocumentId = () => {
    let id = 'document'
    let suffix = 2
    while (reservedIds.has(id)) id = `document-${suffix++}`
    return id
  }
  if (previous == null) return createEmbeddedAnimationLibrary(animation, uniqueDocumentId())

  if (reservedIds.has(previous.id)) {
    const renamed = { ...previous, id: uniqueDocumentId() }
    return mergeEmbeddedAnimation(renamed, animation, null, reservedLibraryIds)
  }

  for (const [groupId, group] of Object.entries(previous.groups)) {
    for (const clipId of Object.keys(group.clips)) {
      if (targetKey !== `public:${previous.id}:${groupId}:${clipId}`) continue
      return {
        ...previous,
        groups: {
          ...previous.groups,
          [groupId]: {
            ...group,
            clips: { ...group.clips, [clipId]: clip }
          }
        }
      }
    }
  }

  const documentGroup = previous.groups.document
  return {
    ...previous,
    groups: {
      ...previous.groups,
      document: {
        ...documentGroup,
        clips: { ...documentGroup?.clips, animation: clip },
        defaultClip: documentGroup?.defaultClip ?? 'animation',
        label: documentGroup?.label ?? 'Document animations'
      }
    }
  }
}

export const createAvatarDefinition = (
  state: AvatarDefinitionState,
  previous?: AvatarDefinition
): AvatarDefinition => {
  const pixelEffect = state.pixelEffect ?? DEFAULT_AVATAR_PIXEL_EFFECT
  const bottomTaper = state.bodyBottomTaper ?? previous?.scene.appearance.bottomTaper ?? 0
  const coatPattern = state.coatPattern ?? previous?.scene.appearance.coatPattern
  const preservePixelEffect = previous?.scene.effects.pixelate != null ||
    pixelEffect.enabled ||
    pixelEffect.blockSize !== DEFAULT_AVATAR_PIXEL_EFFECT.blockSize ||
    pixelEffect.dithering !== DEFAULT_AVATAR_PIXEL_EFFECT.dithering ||
    pixelEffect.paletteSize !== DEFAULT_AVATAR_PIXEL_EFFECT.paletteSize ||
    pixelEffect.sampling !== DEFAULT_AVATAR_PIXEL_EFFECT.sampling
  return ({
    animations: state.animation == null
      ? previous?.animations
      : mergeEmbeddedAnimation(
        previous?.animations,
        state.animation,
        state.animationTargetKey,
        state.animationLibraryIds
      ),
    metadata: state.generation == null
      ? previous?.metadata
      : { ...previous?.metadata, generation: state.generation },
    scene: {
      appearance: {
        backgroundStyle: state.backgroundStyle,
        bodyShape: state.bodyShape,
        ...(bottomTaper !== 0 || previous?.scene.appearance.bottomTaper != null
          ? { bottomTaper }
          : {}),
        ...(state.coatPattern?.enabled === true || previous?.scene.appearance.coatPattern != null
          ? { coatPattern: { ...coatPattern! } }
          : {}),
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
        ...(preservePixelEffect ? { pixelate: pixelEffect } : {}),
        showAvatarShadow: state.showAvatarShadow,
        showFaceShadow: state.showShadow,
        showOutline: state.showOutline
      },
      decals: (state.surfaceDecals ?? []).map(decal => ({ ...decal })),
      entity: {
        parts: state.entityParts.map(toPublicPart),
        preset: state.entityPreset
      },
      face: state.faceStyle,
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
}

const setBoolean = (params: URLSearchParams, key: string, value: boolean) => {
  params.set(key, value ? '1' : '0')
}

export const avatarDefinitionToSearchParams = (definition: AvatarDefinition) => {
  const { scene } = definition
  const params = new URLSearchParams()
  if (definition.metadata?.generation != null) {
    params.set('seed', definition.metadata.generation.seed)
    const seedFields = serializeAvatarSeedFields(definition.metadata.generation.fields)
    if (seedFields !== '') params.set('seedFields', seedFields)
    if (definition.metadata.generation.profileId != null) {
      params.set('breed', definition.metadata.generation.profileId)
    }
  }
  params.set('face', `${DEFAULT_EDITOR_GLYPH.leftEye}${DEFAULT_EDITOR_GLYPH.mouth}${DEFAULT_EDITOR_GLYPH.rightEye}`)
  params.set('palette', scene.appearance.paletteId)
  params.set('bg', scene.appearance.backgroundStyle)
  params.set('shape', scene.appearance.bodyShape)
  if (scene.appearance.bottomTaper != null) params.set('bottomTaper', String(scene.appearance.bottomTaper))
  if (scene.appearance.coatPattern != null) {
    const pattern = scene.appearance.coatPattern
    setBoolean(params, 'coat', pattern.enabled)
    params.set('coatAlgorithm', pattern.algorithm)
    params.set('coatAlgorithmSeed', pattern.algorithmSeed)
    params.set('coatSeed', pattern.seed)
    params.set('coatDensity', String(pattern.density))
    params.set('coatJitter', String(pattern.jitter))
    params.set('coatLightPatchLength', String(pattern.lightPatchLength ?? 100))
    params.set('coatLightPatchOffsetY', String(pattern.lightPatchOffsetY ?? 0))
    params.set('coatLightPatchWidth', String(pattern.lightPatchWidth ?? 100))
    params.set('coatLightPatchShape', pattern.lightPatchShape ?? 'face-mask')
    params.set('coatThickness', String(pattern.thickness))
    params.set('coatSymmetry', String(pattern.symmetry))
    params.set('coatContrast', String(pattern.contrast))
    params.set('coatBreakup', String(pattern.breakup))
  }
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
  setBoolean(params, 'eyes', DEFAULT_EDITOR_GLYPH.linkEyes)
  params.set('eyeShape', scene.face.eyeShape)
  params.set('eyeRound', String(scene.face.eyeRoundness))
  params.set('eyeW', String(scene.face.width))
  params.set('eyeH', String(scene.face.height))
  if (scene.face.leftEyeHeight != null) params.set('eyeLeftH', String(scene.face.leftEyeHeight))
  if (scene.face.rightEyeHeight != null) params.set('eyeRightH', String(scene.face.rightEyeHeight))
  if (scene.face.leftEyeWidth != null) params.set('eyeLeftW', String(scene.face.leftEyeWidth))
  if (scene.face.rightEyeWidth != null) params.set('eyeRightW', String(scene.face.rightEyeWidth))
  params.set('eyeGap', String(scene.face.gap))
  params.set('eyeRot', String(scene.face.rotation))
  params.set('eyeLeftRot', String(scene.face.leftEyeRotation))
  params.set('eyeRightRot', String(scene.face.rightEyeRotation))
  if (scene.face.eyeHighlight != null) {
    setBoolean(params, 'eyeHighlight', scene.face.eyeHighlight.enabled)
    params.set('eyeHighlightColor', scene.face.eyeHighlight.color)
    params.set('eyeHighlightSize', String(scene.face.eyeHighlight.size))
    params.set('eyeHighlightX', String(scene.face.eyeHighlight.offsetX))
    params.set('eyeHighlightY', String(scene.face.eyeHighlight.offsetY))
    params.set('eyeHighlightOpacity', String(scene.face.eyeHighlight.opacity))
  }
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
  if (scene.effects.faceShadow.color != null) params.set('shadowColor', scene.effects.faceShadow.color)
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
  const pixelEffect = scene.effects.pixelate ?? DEFAULT_AVATAR_PIXEL_EFFECT
  setBoolean(params, 'pixel', pixelEffect.enabled)
  params.set('pixelSize', String(pixelEffect.blockSize))
  params.set('pixelColors', String(pixelEffect.paletteSize))
  params.set('pixelSample', pixelEffect.sampling)
  params.set('pixelDither', pixelEffect.dithering)
  setBoolean(params, 'frameShadow', scene.camera.showFrameShadow)
  params.set('frameShadowDir', String(scene.camera.frameShadow.direction))
  params.set('frameShadowDist', String(scene.camera.frameShadow.distance))
  params.set('frameShadowOpacity', String(scene.camera.frameShadow.opacity))
  params.set('frameShadowSoft', String(scene.camera.frameShadow.softness))
  if (scene.camera.frameShadow.color != null) {
    params.set('frameShadowColor', scene.camera.frameShadow.color)
  }
  params.set('gridDensity', String(scene.lighting.gridDensity))
  params.set('entity', scene.entity.preset)
  if (scene.entity.parts.length > 0) {
    params.set('entityParts', serializeAvatarEntityParts(scene.entity.parts as readonly AvatarEntityPart[]))
  }
  if (scene.decals.length > 0) {
    params.set('decals', serializeAvatarSurfaceDecals(scene.decals))
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
  const parsedClip = parseAvatarAnimationClip(clip)
  const resolvedClip = anchorAvatarAnimationClip({
    scene,
    schema: AVATAR_DEFINITION_SCHEMA,
    version: AVATAR_DEFINITION_VERSION
  }, parsedClip)
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
): readonly PublicAvatarAnimationEntry[] =>
  mergeAvatarAnimationLibraries(libraries).flatMap(library => (
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
