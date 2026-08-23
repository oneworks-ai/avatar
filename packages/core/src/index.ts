export const AVATAR_DEFINITION_SCHEMA = 'oneworks.avatar' as const
export const AVATAR_DEFINITION_VERSION = 1 as const

export type AvatarBackgroundStyle = 'gradient' | 'solid'
export type AvatarBodyShape =
  | 'capsule'
  | 'cone'
  | 'diamond'
  | 'ellipse'
  | 'frustum'
  | 'half-cone'
  | 'rounded'
  | 'square'
  | 'sphere'
  | 'teardrop'
  | 'trapezoid'
export type AvatarCameraFrame = 'circle' | 'rounded' | 'square'
export type AvatarEntityPreset = 'bear' | 'cat' | 'cloud' | 'custom' | 'dog' | 'rabbit' | 'sun'
export type AvatarEyeShape = 'ellipse' | 'rounded'
export type AvatarInteractionMode = 'move' | 'rotate'
export type AvatarMouthShape = 'curve' | 'ellipse' | 'rounded' | 'rounded-triangle'
export type AvatarNoseShape = 'ellipse' | 'inverted-triangle' | 'rounded'
export type AvatarPlaybackMode = 'loop' | 'once'
export type AvatarAnimationAnchor = 'absolute' | 'relative'
export type AvatarAnimationEasing = 'ease-in' | 'ease-in-out' | 'ease-out' | 'linear'

export interface AvatarColorGrade {
  readonly brightness: number
  readonly saturation: number
  readonly tintAmount: number
  readonly tintB: number
  readonly tintG: number
  readonly tintR: number
}

export interface AvatarView {
  readonly pitch: number
  readonly positionX: number
  readonly positionY: number
  readonly roll: number
  readonly scale: number
  readonly yaw: number
}

export interface AvatarFace {
  readonly eyeRoundness: number
  readonly eyeShape: AvatarEyeShape
  readonly gap: number
  readonly height: number
  readonly leftEyeHeight?: number
  readonly leftEyeRotation: number
  readonly mouthCurve: number
  readonly mouthEnabled: boolean
  readonly mouthHeight: number
  readonly mouthRotation: number
  readonly mouthShape: AvatarMouthShape
  readonly mouthWidth: number
  readonly mouthY: number
  readonly noseEnabled: boolean
  readonly noseHeight: number
  readonly noseRotation: number
  readonly noseShape: AvatarNoseShape
  readonly noseWidth: number
  readonly noseY: number
  readonly rotation: number
  readonly rightEyeHeight?: number
  readonly rightEyeRotation: number
  readonly width: number
}

export interface AvatarEntityPart {
  readonly baseColor: string
  readonly cutAngle?: number
  readonly face: boolean
  readonly foregroundColor: string
  readonly highlightColor: string
  readonly hollow?: boolean
  readonly id: string
  readonly label: string
  readonly occlusionAmount?: number
  readonly occludedByFace?: boolean
  readonly occlusionPole?: 'bottom' | 'top'
  readonly rotationX?: number
  readonly rotationY?: number
  readonly rotationZ?: number
  readonly roundness?: number
  readonly scaleX: number
  readonly scaleY: number
  readonly scaleZ?: number
  readonly shadowColor: string
  readonly shape: AvatarBodyShape
  readonly topScale?: number
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface AvatarShadow {
  readonly color?: string
  readonly direction: number
  readonly distance: number
  readonly opacity: number
  readonly softness: number
}

export interface AvatarOutline {
  readonly color: string
  readonly opacity: number
  readonly width: number
}

export interface AvatarScene {
  readonly appearance: {
    readonly backgroundStyle: AvatarBackgroundStyle
    readonly bodyShape: AvatarBodyShape
    readonly paletteId: string
  }
  readonly camera: {
    readonly background: string | 'transparent'
    readonly frame: AvatarCameraFrame
    readonly frameShadow: AvatarShadow
    readonly showFrameShadow: boolean
    readonly size: 128 | 256 | 512
  }
  readonly effects: {
    readonly avatarShadow: AvatarShadow
    readonly colorGrade: AvatarColorGrade
    readonly faceShadow: AvatarShadow
    readonly outline: AvatarOutline
    readonly showAvatarShadow: boolean
    readonly showFaceShadow: boolean
    readonly showOutline: boolean
  }
  readonly entity: {
    readonly parts: readonly AvatarEntityPart[]
    readonly preset: AvatarEntityPreset
  }
  readonly face: AvatarFace
  readonly glyph: {
    readonly leftEye: string
    readonly linkEyes: boolean
    readonly mouth: string
    readonly rightEye: string
  }
  readonly interactionMode: AvatarInteractionMode
  readonly lighting: {
    readonly azimuth: number
    readonly distance: number
    readonly elevation: number
    readonly gridDensity: number
    readonly enabled: boolean
  }
  readonly view: AvatarView
}

export interface AvatarScenePatch {
  readonly colorGrade?: Partial<AvatarColorGrade>
  readonly entityParts?: Readonly<Record<string, Partial<AvatarEntityPart>>>
  readonly face?: Partial<AvatarFace>
  readonly lighting?: Partial<AvatarScene['lighting']>
  readonly view?: Partial<AvatarView>
}

export interface AvatarAnimationKeyframe {
  readonly atMs: number
  readonly easing?: AvatarAnimationEasing
  readonly patch: AvatarScenePatch
}

export interface AvatarAnimationClip {
  readonly anchor: AvatarAnimationAnchor
  readonly durationMs: number
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly label?: string
  readonly playback: AvatarPlaybackMode
}

export interface AvatarAnimationGroup {
  readonly clips: Readonly<Record<string, AvatarAnimationClip>>
  readonly defaultClip?: string
  readonly label?: string
}

export interface AvatarAnimationLibrary {
  readonly groups: Readonly<Record<string, AvatarAnimationGroup>>
  readonly id: string
  readonly label?: string
}

export interface AvatarAnimationRef {
  readonly clipId: string
  readonly groupId: string
  readonly libraryId: string
}

export interface AvatarDefinitionV1 {
  readonly animations?: AvatarAnimationLibrary
  readonly metadata?: {
    readonly createdAt?: string
    readonly id?: string
    readonly name?: string
    readonly updatedAt?: string
  }
  readonly scene: AvatarScene
  readonly schema: typeof AVATAR_DEFINITION_SCHEMA
  readonly version: typeof AVATAR_DEFINITION_VERSION
}

export type AvatarDefinition = AvatarDefinitionV1

export interface ResolvedAvatarAnimationFrame {
  readonly elapsedMs: number
  readonly finished: boolean
  readonly progress: number
  readonly scene: AvatarScene
}

export const DEFAULT_AVATAR_COLOR_GRADE: AvatarColorGrade = {
  brightness: 1,
  saturation: 1,
  tintAmount: 0,
  tintB: 0,
  tintG: 0,
  tintR: 0
}

export const DEFAULT_AVATAR_FACE: AvatarFace = {
  eyeRoundness: 100,
  eyeShape: 'rounded',
  gap: 40,
  height: 64,
  leftEyeRotation: 0,
  mouthCurve: 45,
  mouthEnabled: false,
  mouthHeight: 12,
  mouthRotation: 0,
  mouthShape: 'curve',
  mouthWidth: 52,
  mouthY: 52,
  noseEnabled: false,
  noseHeight: 18,
  noseRotation: 0,
  noseShape: 'inverted-triangle',
  noseWidth: 10,
  noseY: 22,
  rotation: 0,
  rightEyeRotation: 0,
  width: 28
}

export const createDefaultAvatarDefinition = (): AvatarDefinition => ({
  scene: {
    appearance: { backgroundStyle: 'solid', bodyShape: 'sphere', paletteId: 'signal' },
    camera: {
      background: '#111315',
      frame: 'rounded',
      frameShadow: { direction: 90, distance: 12, opacity: 22, softness: 24 },
      showFrameShadow: true,
      size: 256
    },
    effects: {
      avatarShadow: { color: '#000000', direction: 45, distance: 12, opacity: 24, softness: 16 },
      colorGrade: DEFAULT_AVATAR_COLOR_GRADE,
      faceShadow: { direction: 50, distance: 4, opacity: 28, softness: 0 },
      outline: { color: '#ffffff', opacity: 80, width: 4 },
      showAvatarShadow: true,
      showFaceShadow: false,
      showOutline: true
    },
    entity: { parts: [], preset: 'custom' },
    face: DEFAULT_AVATAR_FACE,
    glyph: { leftEye: '0', linkEyes: true, mouth: 'w', rightEye: '0' },
    interactionMode: 'rotate',
    lighting: { azimuth: -35, distance: 0, elevation: 40, enabled: false, gridDensity: 100 },
    view: { pitch: 0, positionX: 0, positionY: 0, roll: 0, scale: 1.28, yaw: 0 }
  },
  schema: AVATAR_DEFINITION_SCHEMA,
  version: AVATAR_DEFINITION_VERSION
})

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value != null && !Array.isArray(value)
)

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
)
const isString = (value: unknown): value is string => typeof value === 'string'
const isOptionalNumber = (value: unknown) => value == null || isFiniteNumber(value)
const isOptionalString = (value: unknown) => value == null || isString(value)
const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T => (
  isString(value) && options.includes(value as T)
)

const isAvatarColorGrade = (value: unknown): value is AvatarColorGrade => (
  isRecord(value) && isFiniteNumber(value.brightness) && isFiniteNumber(value.saturation) &&
  isFiniteNumber(value.tintAmount) && isFiniteNumber(value.tintB) &&
  isFiniteNumber(value.tintG) && isFiniteNumber(value.tintR)
)

const isAvatarShadow = (value: unknown): value is AvatarShadow => (
  isRecord(value) && isOptionalString(value.color) && isFiniteNumber(value.direction) &&
  isFiniteNumber(value.distance) && isFiniteNumber(value.opacity) && isFiniteNumber(value.softness)
)

const isAvatarOutline = (value: unknown): value is AvatarOutline => (
  isRecord(value) && isString(value.color) && isFiniteNumber(value.opacity) &&
  isFiniteNumber(value.width)
)

const isAvatarView = (value: unknown): value is AvatarView => (
  isRecord(value) && isFiniteNumber(value.pitch) && isFiniteNumber(value.positionX) &&
  isFiniteNumber(value.positionY) && isFiniteNumber(value.roll) && isFiniteNumber(value.scale) &&
  isFiniteNumber(value.yaw)
)

const isAvatarFace = (value: unknown): value is AvatarFace => (
  isRecord(value) && isFiniteNumber(value.eyeRoundness) &&
  isOneOf(value.eyeShape, ['ellipse', 'rounded']) && isFiniteNumber(value.gap) &&
  isFiniteNumber(value.height) && isOptionalNumber(value.leftEyeHeight) &&
  isFiniteNumber(value.leftEyeRotation) && isFiniteNumber(value.mouthCurve) &&
  isBoolean(value.mouthEnabled) && isFiniteNumber(value.mouthHeight) &&
  isFiniteNumber(value.mouthRotation) &&
  isOneOf(value.mouthShape, ['curve', 'ellipse', 'rounded', 'rounded-triangle']) &&
  isFiniteNumber(value.mouthWidth) && isFiniteNumber(value.mouthY) &&
  isBoolean(value.noseEnabled) && isFiniteNumber(value.noseHeight) &&
  isFiniteNumber(value.noseRotation) &&
  isOneOf(value.noseShape, ['ellipse', 'inverted-triangle', 'rounded']) &&
  isFiniteNumber(value.noseWidth) && isFiniteNumber(value.noseY) &&
  isFiniteNumber(value.rotation) && isOptionalNumber(value.rightEyeHeight) &&
  isFiniteNumber(value.rightEyeRotation) && isFiniteNumber(value.width)
)

const isAvatarEntityPart = (value: unknown): value is AvatarEntityPart => (
  isRecord(value) && isString(value.baseColor) && isOptionalNumber(value.cutAngle) &&
  isBoolean(value.face) && isString(value.foregroundColor) && isString(value.highlightColor) &&
  (value.hollow == null || isBoolean(value.hollow)) && isString(value.id) && isString(value.label) &&
  isOptionalNumber(value.occlusionAmount) &&
  (value.occludedByFace == null || isBoolean(value.occludedByFace)) &&
  (value.occlusionPole == null || isOneOf(value.occlusionPole, ['bottom', 'top'])) &&
  isOptionalNumber(value.rotationX) && isOptionalNumber(value.rotationY) &&
  isOptionalNumber(value.rotationZ) && isOptionalNumber(value.roundness) &&
  isFiniteNumber(value.scaleX) && isFiniteNumber(value.scaleY) &&
  isOptionalNumber(value.scaleZ) && isString(value.shadowColor) &&
  isOneOf(value.shape, [
    'capsule', 'cone', 'diamond', 'ellipse', 'frustum', 'half-cone', 'rounded', 'square',
    'sphere', 'teardrop', 'trapezoid'
  ]) && isOptionalNumber(value.topScale) && isFiniteNumber(value.x) &&
  isFiniteNumber(value.y) && isFiniteNumber(value.z)
)

const isPartialNumberRecord = (value: unknown, keys: readonly string[]) => (
  isRecord(value) && Object.entries(value).every(([key, field]) => keys.includes(key) && isFiniteNumber(field))
)

const isAvatarScenePatch = (value: unknown): value is AvatarScenePatch => {
  if (!isRecord(value)) return false
  if (value.colorGrade != null && !isPartialNumberRecord(value.colorGrade, [
    'brightness', 'saturation', 'tintAmount', 'tintB', 'tintG', 'tintR'
  ])) return false
  if (value.view != null && !isPartialNumberRecord(value.view, [
    'pitch', 'positionX', 'positionY', 'roll', 'scale', 'yaw'
  ])) return false
  if (value.lighting != null && (!isRecord(value.lighting) || Object.entries(value.lighting).some(
    ([key, field]) => key === 'enabled'
      ? !isBoolean(field)
      : !['azimuth', 'distance', 'elevation', 'gridDensity'].includes(key) || !isFiniteNumber(field)
  ))) return false
  if (value.face != null && !isRecord(value.face)) return false
  if (value.entityParts != null && (!isRecord(value.entityParts) || Object.values(value.entityParts).some(
    part => !isRecord(part)
  ))) return false
  return true
}

const isAvatarAnimationClip = (value: unknown): value is AvatarAnimationClip => (
  isRecord(value) && isOneOf(value.anchor, ['absolute', 'relative']) &&
  isFiniteNumber(value.durationMs) && value.durationMs > 0 && isOptionalString(value.label) &&
  isOneOf(value.playback, ['loop', 'once']) && Array.isArray(value.keyframes) &&
  value.keyframes.every(keyframe => (
    isRecord(keyframe) && isFiniteNumber(keyframe.atMs) && keyframe.atMs >= 0 &&
    (keyframe.easing == null || isOneOf(keyframe.easing, [
      'ease-in', 'ease-in-out', 'ease-out', 'linear'
    ])) && isAvatarScenePatch(keyframe.patch)
  ))
)

const isAvatarAnimationLibrary = (value: unknown): value is AvatarAnimationLibrary => (
  isRecord(value) && isString(value.id) && isOptionalString(value.label) && isRecord(value.groups) &&
  Object.values(value.groups).every(group => (
    isRecord(group) && isOptionalString(group.defaultClip) && isOptionalString(group.label) &&
    isRecord(group.clips) && Object.values(group.clips).every(isAvatarAnimationClip)
  ))
)

export const isAvatarDefinition = (value: unknown): value is AvatarDefinition => {
  if (!isRecord(value) || value.schema !== AVATAR_DEFINITION_SCHEMA || value.version !== 1) return false
  if (value.animations != null && !isAvatarAnimationLibrary(value.animations)) return false
  if (value.metadata != null && (!isRecord(value.metadata) ||
    !isOptionalString(value.metadata.createdAt) || !isOptionalString(value.metadata.id) ||
    !isOptionalString(value.metadata.name) || !isOptionalString(value.metadata.updatedAt))) return false
  if (!isRecord(value.scene)) return false
  const scene = value.scene
  return isRecord(scene.appearance) &&
    isOneOf(scene.appearance.backgroundStyle, ['gradient', 'solid']) &&
    isOneOf(scene.appearance.bodyShape, [
      'capsule', 'cone', 'diamond', 'ellipse', 'frustum', 'half-cone', 'rounded', 'square',
      'sphere', 'teardrop', 'trapezoid'
    ]) && isString(scene.appearance.paletteId) &&
    isRecord(scene.camera) && isString(scene.camera.background) &&
    isOneOf(scene.camera.frame, ['circle', 'rounded', 'square']) &&
    isAvatarShadow(scene.camera.frameShadow) && isBoolean(scene.camera.showFrameShadow) &&
    [128, 256, 512].includes(scene.camera.size as number) &&
    isRecord(scene.effects) && isAvatarShadow(scene.effects.avatarShadow) &&
    isAvatarColorGrade(scene.effects.colorGrade) && isAvatarShadow(scene.effects.faceShadow) &&
    isAvatarOutline(scene.effects.outline) && isBoolean(scene.effects.showAvatarShadow) &&
    isBoolean(scene.effects.showFaceShadow) && isBoolean(scene.effects.showOutline) &&
    isRecord(scene.entity) && Array.isArray(scene.entity.parts) &&
    scene.entity.parts.every(isAvatarEntityPart) &&
    isOneOf(scene.entity.preset, ['bear', 'cat', 'cloud', 'custom', 'dog', 'rabbit', 'sun']) &&
    isAvatarFace(scene.face) && isRecord(scene.glyph) && isString(scene.glyph.leftEye) &&
    isBoolean(scene.glyph.linkEyes) && isString(scene.glyph.mouth) &&
    isString(scene.glyph.rightEye) && isOneOf(scene.interactionMode, ['move', 'rotate']) &&
    isRecord(scene.lighting) && isFiniteNumber(scene.lighting.azimuth) &&
    isFiniteNumber(scene.lighting.distance) && isFiniteNumber(scene.lighting.elevation) &&
    isBoolean(scene.lighting.enabled) && isFiniteNumber(scene.lighting.gridDensity) &&
    isAvatarView(scene.view)
}

export const parseAvatarDefinition = (input: unknown): AvatarDefinition => {
  const value = typeof input === 'string' ? JSON.parse(input) : input
  if (!isAvatarDefinition(value)) throw new TypeError('Invalid OneWorks Avatar definition')
  return structuredClone(value)
}

export const serializeAvatarDefinition = (definition: AvatarDefinition) => {
  if (!isAvatarDefinition(definition)) throw new TypeError('Invalid OneWorks Avatar definition')
  return `${JSON.stringify(definition, null, 2)}\n`
}

export const mergeAvatarAnimationLibraries = (
  libraries: readonly AvatarAnimationLibrary[]
): readonly AvatarAnimationLibrary[] => {
  const merged = new Map<string, AvatarAnimationLibrary>()
  libraries.forEach(library => merged.set(library.id, library))
  return [...merged.values()]
}

export const resolveAvatarAnimationClip = (
  libraries: readonly AvatarAnimationLibrary[],
  reference: AvatarAnimationRef
): AvatarAnimationClip | null => (
  libraries.find(library => library.id === reference.libraryId)
    ?.groups[reference.groupId]
    ?.clips[reference.clipId] ?? null
)

export const anchorAvatarAnimationClip = (
  definition: AvatarDefinition,
  clip: AvatarAnimationClip
): AvatarAnimationClip => {
  if (clip.anchor === 'absolute' || clip.keyframes.length === 0) return clip
  const first = [...clip.keyframes].sort((a, b) => a.atMs - b.atMs)[0]!
  const firstScene = applyAvatarScenePatch(definition.scene, first.patch)
  const delta = {
    pitch: definition.scene.view.pitch - firstScene.view.pitch,
    positionX: definition.scene.view.positionX - firstScene.view.positionX,
    positionY: definition.scene.view.positionY - firstScene.view.positionY,
    yaw: definition.scene.view.yaw - firstScene.view.yaw
  }
  return {
    ...clip,
    anchor: 'absolute',
    keyframes: clip.keyframes.map(frame => ({
      ...frame,
      patch: {
        ...frame.patch,
        view: {
          ...frame.patch.view,
          ...(frame.patch.view?.pitch == null ? {} : { pitch: frame.patch.view.pitch + delta.pitch }),
          ...(frame.patch.view?.positionX == null
            ? {}
            : { positionX: frame.patch.view.positionX + delta.positionX }),
          ...(frame.patch.view?.positionY == null
            ? {}
            : { positionY: frame.patch.view.positionY + delta.positionY }),
          ...(frame.patch.view?.yaw == null ? {} : { yaw: frame.patch.view.yaw + delta.yaw })
        }
      }
    }))
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress

export const easeAvatarAnimationProgress = (progress: number, easing: AvatarAnimationEasing = 'linear') => {
  const value = clamp(progress, 0, 1)
  if (easing === 'ease-in') return value * value
  if (easing === 'ease-out') return 1 - (1 - value) ** 2
  if (easing === 'ease-in-out') return value < .5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2
  return value
}

export const applyAvatarScenePatch = (scene: AvatarScene, patch: AvatarScenePatch): AvatarScene => ({
  ...scene,
  effects: {
    ...scene.effects,
    colorGrade: { ...scene.effects.colorGrade, ...patch.colorGrade }
  },
  entity: patch.entityParts == null
    ? scene.entity
    : {
        ...scene.entity,
        parts: scene.entity.parts.map(part => ({ ...part, ...patch.entityParts?.[part.id] }))
      },
  face: { ...scene.face, ...patch.face },
  lighting: { ...scene.lighting, ...patch.lighting },
  view: { ...scene.view, ...patch.view }
})

const interpolateRecord = <T extends object>(from: T, to: T, progress: number): T => {
  const fromRecord = from as Record<string, unknown>
  const toRecord = to as Record<string, unknown>
  const result: Record<string, unknown> = { ...fromRecord }
  Object.keys(toRecord).forEach(key => {
    const fromValue = fromRecord[key]
    const toValue = toRecord[key]
    if (typeof fromValue === 'number' && typeof toValue === 'number') {
      result[key] = interpolate(fromValue, toValue, progress)
    } else {
      result[key] = progress < 1 ? fromValue : toValue
    }
  })
  return result as T
}

const interpolateScene = (from: AvatarScene, to: AvatarScene, progress: number): AvatarScene => ({
  ...from,
  effects: {
    ...from.effects,
    colorGrade: interpolateRecord(from.effects.colorGrade, to.effects.colorGrade, progress)
  },
  entity: {
    ...from.entity,
    parts: from.entity.parts.map(part => {
      const target = to.entity.parts.find(candidate => candidate.id === part.id)
      return target == null ? part : interpolateRecord(part, target, progress)
    })
  },
  face: interpolateRecord(from.face, to.face, progress),
  lighting: interpolateRecord(from.lighting, to.lighting, progress),
  view: interpolateRecord(from.view, to.view, progress)
})

export const resolveAvatarAnimationFrame = (
  definition: AvatarDefinition,
  clip: AvatarAnimationClip,
  elapsedMs: number
): ResolvedAvatarAnimationFrame => {
  const ordered = [...clip.keyframes].sort((a, b) => a.atMs - b.atMs)
  if (ordered.length === 0 || clip.durationMs <= 0) {
    return { elapsedMs: 0, finished: true, progress: 1, scene: definition.scene }
  }
  const requested = Math.max(elapsedMs, 0)
  const finished = clip.playback === 'once' && requested >= clip.durationMs
  const timeline = clip.playback === 'loop'
    ? requested % clip.durationMs
    : Math.min(requested, clip.durationMs)
  let currentIndex = 0
  ordered.forEach((frame, index) => {
    if (frame.atMs <= timeline) currentIndex = index
  })
  const fromFrame = ordered[currentIndex]!
  const nextFrame = ordered[currentIndex + 1]
  const fromScene = applyAvatarScenePatch(definition.scene, fromFrame.patch)
  if (nextFrame == null) {
    if (clip.playback === 'once') {
      return { elapsedMs: timeline, finished, progress: 1, scene: fromScene }
    }
    const toFrame = ordered[0]!
    const span = Math.max(clip.durationMs - fromFrame.atMs + toFrame.atMs, 1)
    const progress = easeAvatarAnimationProgress((timeline - fromFrame.atMs) / span, toFrame.easing)
    return {
      elapsedMs: timeline,
      finished: false,
      progress,
      scene: interpolateScene(fromScene, applyAvatarScenePatch(definition.scene, toFrame.patch), progress)
    }
  }
  const span = Math.max(nextFrame.atMs - fromFrame.atMs, 1)
  const progress = easeAvatarAnimationProgress((timeline - fromFrame.atMs) / span, nextFrame.easing)
  return {
    elapsedMs: timeline,
    finished,
    progress,
    scene: interpolateScene(fromScene, applyAvatarScenePatch(definition.scene, nextFrame.patch), progress)
  }
}
