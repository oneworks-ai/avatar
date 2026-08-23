import { AVATAR_PALETTES } from './catalog.js'

export * from './catalog.js'

const deepFreeze = <T>(value: T): T => {
  if (value == null || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  Object.freeze(value)
  return value
}

export const AVATAR_DEFINITION_SCHEMA = 'oneworks.avatar' as const
export const AVATAR_DEFINITION_VERSION = 1 as const
export const AVATAR_ANIMATION_MIN_SEGMENT_MS = 100
export const AVATAR_ANIMATION_MAX_SEGMENT_MS = 8000
export const AVATAR_COLOR_GRADE_RANGES = deepFreeze({
  brightness: { max: 1.8, min: .35 },
  saturation: { max: 2, min: 0 },
  tintAmount: { max: 1, min: 0 },
  tintB: { max: 255, min: 0 },
  tintG: { max: 255, min: 0 },
  tintR: { max: 255, min: 0 }
} as const)
export const AVATAR_EYE_HIGHLIGHT_RANGES = deepFreeze({
  offsetX: { max: 35, min: -35 },
  offsetY: { max: 35, min: -35 },
  opacity: { max: 100, min: 0 },
  size: { max: 50, min: 8 }
} as const)
export const AVATAR_FACE_RANGES = deepFreeze({
  eyeRoundness: { max: 100, min: 0 },
  gap: { max: 100, min: 0 },
  height: { max: 112, min: 1 },
  leftEyeHeight: { max: 112, min: 1 },
  leftEyeRotation: { max: 90, min: -90 },
  mouthCurve: { max: 100, min: -100 },
  mouthHeight: { max: 48, min: 4 },
  mouthRotation: { max: 180, min: -180 },
  mouthWidth: { max: 100, min: 12 },
  mouthY: { max: 90, min: 24 },
  noseHeight: { max: 48, min: 6 },
  noseRotation: { max: 180, min: -180 },
  noseWidth: { max: 36, min: 6 },
  noseY: { max: 50, min: -10 },
  rotation: { max: 90, min: -90 },
  rightEyeHeight: { max: 112, min: 1 },
  rightEyeRotation: { max: 90, min: -90 },
  width: { max: 76, min: 1 }
} as const)
export const AVATAR_ANIMATION_FACE_RANGES = AVATAR_FACE_RANGES
export const AVATAR_VIEW_RANGES = deepFreeze({
  positionX: { max: 230, min: -230 },
  positionY: { max: 230, min: -230 },
  scale: { max: 2.4, min: .35 }
} as const)
export const AVATAR_ENTITY_RANGES = deepFreeze({
  occlusionAmount: { max: 100, min: 0 },
  roundness: { max: 100, min: 0 },
  scaleX: { max: 1.5, min: .08 },
  scaleY: { max: 1.5, min: .08 },
  scaleZ: { max: 1.5, min: .08 },
  topScale: { max: 1.2, min: .4 }
} as const)
export const AVATAR_LIGHTING_RANGES = deepFreeze({
  azimuth: { max: 180, min: -180 },
  distance: { max: 100, min: 0 },
  elevation: { max: 80, min: -80 },
  gridDensity: { max: 400, min: 25 }
} as const)
export const AVATAR_OUTLINE_RANGES = deepFreeze({
  opacity: { max: 100, min: 0 },
  width: { max: 20, min: 1 }
} as const)
export const AVATAR_SHADOW_RANGES = deepFreeze({
  avatar: {
    direction: { max: 180, min: -180 },
    distance: { max: 40, min: 0 },
    opacity: { max: 100, min: 0 },
    softness: { max: 40, min: 0 }
  },
  face: {
    direction: { max: 180, min: -180 },
    distance: { max: 24, min: 0 },
    opacity: { max: 100, min: 0 },
    softness: { max: 12, min: 0 }
  },
  frame: {
    direction: { max: 180, min: -180 },
    distance: { max: 40, min: 0 },
    opacity: { max: 100, min: 0 },
    softness: { max: 48, min: 0 }
  }
} as const)
export const AVATAR_SURFACE_DECAL_RANGES = deepFreeze({
  height: { max: 180, min: 2 },
  opacity: { max: 100, min: 0 },
  rotation: { max: 180, min: -180 },
  width: { max: 180, min: 2 },
  x: { max: 180, min: -180 },
  y: { max: 180, min: -180 }
} as const)

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
export type AvatarSurfaceDecalShape = 'ellipse' | 'rounded'
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
  readonly eyeHighlight: AvatarEyeHighlight
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

export interface AvatarEyeHighlight {
  readonly color: string
  readonly enabled: boolean
  readonly offsetX: number
  readonly offsetY: number
  readonly opacity: number
  readonly size: number
}

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
  readonly decals: readonly AvatarSurfaceDecal[]
  readonly entity: {
    readonly parts: readonly AvatarEntityPart[]
    readonly preset: AvatarEntityPreset
  }
  readonly face: AvatarFace
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
  readonly face?: Partial<AvatarFace>
  readonly view?: Partial<Pick<AvatarView, 'pitch' | 'positionX' | 'positionY' | 'yaw'>>
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

export interface CreateSeededAvatarDefinitionOptions {
  readonly name?: string
  readonly seed: string
}

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
  eyeHighlight: {
    color: '#ffffff',
    enabled: false,
    offsetX: -18,
    offsetY: -20,
    opacity: 92,
    size: 24
  },
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
    decals: [],
    entity: { parts: [], preset: 'custom' },
    face: DEFAULT_AVATAR_FACE,
    interactionMode: 'rotate',
    lighting: { azimuth: -35, distance: 0, elevation: 40, enabled: false, gridDensity: 100 },
    view: { pitch: 0, positionX: 0, positionY: 0, roll: 0, scale: 1.28, yaw: 0 }
  },
  schema: AVATAR_DEFINITION_SCHEMA,
  version: AVATAR_DEFINITION_VERSION
})

const hashAvatarSeed = (seed: string) => {
  let hash = 2166136261
  for (const character of seed) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const createSeededAvatarDefinition = ({
  name,
  seed
}: CreateSeededAvatarDefinitionOptions): AvatarDefinition => {
  const hash = hashAvatarSeed(seed)
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length]!
  const definition = createDefaultAvatarDefinition()
  const bodyShapes: readonly AvatarBodyShape[] = ['capsule', 'ellipse', 'rounded', 'sphere', 'teardrop']
  const signed = (shift: number, range: number) => ((hash >>> shift) % (range * 2 + 1)) - range

  return {
    ...definition,
    ...(name == null ? {} : { metadata: { name } }),
    scene: {
      ...definition.scene,
      appearance: {
        backgroundStyle: (hash & 1) === 0 ? 'solid' : 'gradient',
        bodyShape: bodyShapes[(hash >>> 5) % bodyShapes.length]!,
        paletteId: palette.id
      },
      camera: {
        ...definition.scene.camera,
        background: palette.gradient[1]
      },
      face: {
        ...definition.scene.face,
        gap: 38 + ((hash >>> 11) % 9),
        leftEyeRotation: signed(16, 9),
        rightEyeRotation: signed(21, 9)
      },
      view: {
        ...definition.scene.view,
        pitch: signed(8, 10) / 100,
        roll: signed(3, 8) / 100,
        yaw: signed(13, 16) / 100
      }
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value != null && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) &&
  Reflect.ownKeys(value).every(key => typeof key === 'string') &&
  Object.values(Object.getOwnPropertyDescriptors(value)).every(descriptor => (
    'value' in descriptor && descriptor.enumerable
  ))
)
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => (
  Reflect.ownKeys(value).every(key => typeof key === 'string' && keys.includes(key))
)
const hasOwnKeys = (value: Record<string, unknown>, keys: readonly string[]) => (
  keys.every(key => Object.hasOwn(value, key))
)
const isDenseArray = <T = unknown>(value: unknown): value is T[] => {
  if (!Array.isArray(value)) return false
  if (!Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean)) {
    return false
  }
  return Reflect.ownKeys(value).every(key => {
    if (key === 'length') return true
    if (typeof key !== 'string' || !/^(0|[1-9]\d*)$/u.test(key)) return false
    const index = Number(key)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    return index < value.length && descriptor != null && 'value' in descriptor && descriptor.enumerable
  })
}

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
)
const isFiniteInRange = (value: unknown, range: { readonly max: number; readonly min: number }) => (
  isFiniteNumber(value) && value >= range.min && value <= range.max
)
const isString = (value: unknown): value is string => typeof value === 'string'
const isOptionalNumber = (value: unknown) => value === undefined || isFiniteNumber(value)
const isOptionalString = (value: unknown) => value === undefined || isString(value)
const isOptionalHexColor = (value: unknown) => value === undefined || isHexColor(value)
const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T => (
  isString(value) && options.includes(value as T)
)
const isHexColor = (value: unknown): value is string => (
  isString(value) && /^#[\da-f]{6}$/iu.test(value)
)

const isAvatarEyeHighlight = (value: unknown): value is AvatarEyeHighlight => (
  isRecord(value) && hasOnlyKeys(value, [
    'color',
    'enabled',
    'offsetX',
    'offsetY',
    'opacity',
    'size'
  ]) && hasOwnKeys(value, ['color', 'enabled', 'offsetX', 'offsetY', 'opacity', 'size']) &&
  isHexColor(value.color) && isBoolean(value.enabled) &&
  isFiniteInRange(value.offsetX, AVATAR_EYE_HIGHLIGHT_RANGES.offsetX) &&
  isFiniteInRange(value.offsetY, AVATAR_EYE_HIGHLIGHT_RANGES.offsetY) &&
  isFiniteInRange(value.opacity, AVATAR_EYE_HIGHLIGHT_RANGES.opacity) &&
  isFiniteInRange(value.size, AVATAR_EYE_HIGHLIGHT_RANGES.size)
)

const isAvatarSurfaceDecal = (value: unknown): value is AvatarSurfaceDecal => (
  isRecord(value) && hasOnlyKeys(value, [
    'color',
    'height',
    'id',
    'label',
    'opacity',
    'rotation',
    'shape',
    'targetPartId',
    'width',
    'x',
    'y'
  ]) && hasOwnKeys(value, [
    'color',
    'height',
    'id',
    'label',
    'opacity',
    'rotation',
    'shape',
    'targetPartId',
    'width',
    'x',
    'y'
  ]) && isHexColor(value.color) && isFiniteInRange(value.height, AVATAR_SURFACE_DECAL_RANGES.height) &&
  isString(value.id) && value.id.trim().length > 0 && isString(value.label) &&
  isFiniteInRange(value.opacity, AVATAR_SURFACE_DECAL_RANGES.opacity) &&
  isFiniteInRange(value.rotation, AVATAR_SURFACE_DECAL_RANGES.rotation) &&
  isOneOf(value.shape, ['ellipse', 'rounded']) &&
  (value.targetPartId === null || (isString(value.targetPartId) && value.targetPartId.trim().length > 0)) &&
  isFiniteInRange(value.width, AVATAR_SURFACE_DECAL_RANGES.width) &&
  isFiniteInRange(value.x, AVATAR_SURFACE_DECAL_RANGES.x) &&
  isFiniteInRange(value.y, AVATAR_SURFACE_DECAL_RANGES.y)
)

const isAvatarColorGradeField = (key: string, value: unknown) => {
  const range = AVATAR_COLOR_GRADE_RANGES[key as keyof AvatarColorGrade]
  return range != null && isFiniteNumber(value) && value >= range.min && value <= range.max
}

const isPartialAvatarColorGrade = (value: unknown) => (
  isRecord(value) && Object.entries(value).every(([key, field]) => (
    isAvatarColorGradeField(key, field)
  ))
)

const isAvatarColorGrade = (value: unknown): value is AvatarColorGrade => (
  isRecord(value) && Object.keys(value).length === Object.keys(AVATAR_COLOR_GRADE_RANGES).length &&
  Object.entries(value).every(([key, field]) => isAvatarColorGradeField(key, field))
)

const isAvatarShadow = (
  value: unknown,
  ranges: (typeof AVATAR_SHADOW_RANGES)[keyof typeof AVATAR_SHADOW_RANGES]
): value is AvatarShadow => (
  isRecord(value) && hasOnlyKeys(value, ['color', 'direction', 'distance', 'opacity', 'softness']) &&
  hasOwnKeys(value, ['direction', 'distance', 'opacity', 'softness']) &&
  isOptionalHexColor(value.color) && isFiniteInRange(value.direction, ranges.direction) &&
  isFiniteInRange(value.distance, ranges.distance) && isFiniteInRange(value.opacity, ranges.opacity) &&
  isFiniteInRange(value.softness, ranges.softness)
)

const isAvatarOutline = (value: unknown): value is AvatarOutline => (
  isRecord(value) && hasOnlyKeys(value, ['color', 'opacity', 'width']) &&
  hasOwnKeys(value, ['color', 'opacity', 'width']) &&
  isHexColor(value.color) && isFiniteInRange(value.opacity, AVATAR_OUTLINE_RANGES.opacity) &&
  isFiniteInRange(value.width, AVATAR_OUTLINE_RANGES.width)
)

const isAvatarView = (value: unknown): value is AvatarView => (
  isRecord(value) && hasOnlyKeys(value, ['pitch', 'positionX', 'positionY', 'roll', 'scale', 'yaw']) &&
  hasOwnKeys(value, ['pitch', 'positionX', 'positionY', 'roll', 'scale', 'yaw']) &&
  isFiniteNumber(value.pitch) && isFiniteNumber(value.positionX) &&
  isFiniteNumber(value.positionY) && isFiniteNumber(value.roll) &&
  isFiniteInRange(value.scale, AVATAR_VIEW_RANGES.scale) &&
  isFiniteNumber(value.yaw)
)

const isAvatarFace = (value: unknown): value is AvatarFace => (
  isRecord(value) && hasOnlyKeys(value, [
    'eyeHighlight',
    'eyeRoundness',
    'eyeShape',
    'gap',
    'height',
    'leftEyeHeight',
    'leftEyeRotation',
    'mouthCurve',
    'mouthEnabled',
    'mouthHeight',
    'mouthRotation',
    'mouthShape',
    'mouthWidth',
    'mouthY',
    'noseEnabled',
    'noseHeight',
    'noseRotation',
    'noseShape',
    'noseWidth',
    'noseY',
    'rotation',
    'rightEyeHeight',
    'rightEyeRotation',
    'width'
  ]) && hasOwnKeys(value, [
    'eyeHighlight',
    'eyeRoundness',
    'eyeShape',
    'gap',
    'height',
    'leftEyeRotation',
    'mouthCurve',
    'mouthEnabled',
    'mouthHeight',
    'mouthRotation',
    'mouthShape',
    'mouthWidth',
    'mouthY',
    'noseEnabled',
    'noseHeight',
    'noseRotation',
    'noseShape',
    'noseWidth',
    'noseY',
    'rotation',
    'rightEyeRotation',
    'width'
  ]) && isAvatarEyeHighlight(value.eyeHighlight) &&
  isFiniteInRange(value.eyeRoundness, AVATAR_FACE_RANGES.eyeRoundness) &&
  isOneOf(value.eyeShape, ['ellipse', 'rounded']) && isFiniteInRange(value.gap, AVATAR_FACE_RANGES.gap) &&
  isFiniteInRange(value.height, AVATAR_FACE_RANGES.height) &&
  (value.leftEyeHeight === undefined || isFiniteInRange(value.leftEyeHeight, AVATAR_FACE_RANGES.leftEyeHeight)) &&
  isFiniteInRange(value.leftEyeRotation, AVATAR_FACE_RANGES.leftEyeRotation) &&
  isFiniteInRange(value.mouthCurve, AVATAR_FACE_RANGES.mouthCurve) &&
  isBoolean(value.mouthEnabled) && isFiniteInRange(value.mouthHeight, AVATAR_FACE_RANGES.mouthHeight) &&
  isFiniteInRange(value.mouthRotation, AVATAR_FACE_RANGES.mouthRotation) &&
  isOneOf(value.mouthShape, ['curve', 'ellipse', 'rounded', 'rounded-triangle']) &&
  isFiniteInRange(value.mouthWidth, AVATAR_FACE_RANGES.mouthWidth) &&
  isFiniteInRange(value.mouthY, AVATAR_FACE_RANGES.mouthY) &&
  isBoolean(value.noseEnabled) && isFiniteInRange(value.noseHeight, AVATAR_FACE_RANGES.noseHeight) &&
  isFiniteInRange(value.noseRotation, AVATAR_FACE_RANGES.noseRotation) &&
  isOneOf(value.noseShape, ['ellipse', 'inverted-triangle', 'rounded']) &&
  isFiniteInRange(value.noseWidth, AVATAR_FACE_RANGES.noseWidth) &&
  isFiniteInRange(value.noseY, AVATAR_FACE_RANGES.noseY) &&
  isFiniteInRange(value.rotation, AVATAR_FACE_RANGES.rotation) &&
  (value.rightEyeHeight === undefined ||
    isFiniteInRange(value.rightEyeHeight, AVATAR_FACE_RANGES.rightEyeHeight)) &&
  isFiniteInRange(value.rightEyeRotation, AVATAR_FACE_RANGES.rightEyeRotation) &&
  isFiniteInRange(value.width, AVATAR_FACE_RANGES.width)
)

const isAvatarEntityPart = (value: unknown): value is AvatarEntityPart => (
  isRecord(value) && hasOnlyKeys(value, [
    'baseColor',
    'cutAngle',
    'face',
    'foregroundColor',
    'highlightColor',
    'hollow',
    'id',
    'label',
    'occlusionAmount',
    'occludedByFace',
    'occlusionPole',
    'rotationX',
    'rotationY',
    'rotationZ',
    'roundness',
    'scaleX',
    'scaleY',
    'scaleZ',
    'shadowColor',
    'shape',
    'topScale',
    'x',
    'y',
    'z'
  ]) && hasOwnKeys(value, [
    'baseColor',
    'face',
    'foregroundColor',
    'highlightColor',
    'id',
    'label',
    'scaleX',
    'scaleY',
    'shadowColor',
    'shape',
    'x',
    'y',
    'z'
  ]) && isHexColor(value.baseColor) && isOptionalNumber(value.cutAngle) &&
  isBoolean(value.face) && isHexColor(value.foregroundColor) && isHexColor(value.highlightColor) &&
  (value.hollow === undefined || isBoolean(value.hollow)) && isString(value.id) && value.id.trim().length > 0 &&
  isString(value.label) &&
  (value.occlusionAmount === undefined ||
    isFiniteInRange(value.occlusionAmount, AVATAR_ENTITY_RANGES.occlusionAmount)) &&
  (value.occludedByFace === undefined || isBoolean(value.occludedByFace)) &&
  (value.occlusionPole === undefined || isOneOf(value.occlusionPole, ['bottom', 'top'])) &&
  isOptionalNumber(value.rotationX) && isOptionalNumber(value.rotationY) &&
  isOptionalNumber(value.rotationZ) &&
  (value.roundness === undefined || isFiniteInRange(value.roundness, AVATAR_ENTITY_RANGES.roundness)) &&
  isFiniteInRange(value.scaleX, AVATAR_ENTITY_RANGES.scaleX) &&
  isFiniteInRange(value.scaleY, AVATAR_ENTITY_RANGES.scaleY) &&
  (value.scaleZ === undefined || isFiniteInRange(value.scaleZ, AVATAR_ENTITY_RANGES.scaleZ)) &&
  isHexColor(value.shadowColor) &&
  isOneOf(value.shape, [
    'capsule',
    'cone',
    'diamond',
    'ellipse',
    'frustum',
    'half-cone',
    'rounded',
    'square',
    'sphere',
    'teardrop',
    'trapezoid'
  ]) && (value.topScale === undefined || isFiniteInRange(value.topScale, AVATAR_ENTITY_RANGES.topScale)) &&
  isFiniteNumber(value.x) &&
  isFiniteNumber(value.y) && isFiniteNumber(value.z)
)

const isPartialNumberRecord = (value: unknown, keys: readonly string[]) => (
  isRecord(value) && Object.entries(value).every(([key, field]) => keys.includes(key) && isFiniteNumber(field))
)

const isPartialAvatarView = (value: unknown) => {
  return isPartialNumberRecord(value, ['pitch', 'positionX', 'positionY', 'yaw'])
}

const isPartialAvatarFace = (value: unknown) => {
  if (!isRecord(value)) return false
  const numberKeys = [
    'eyeRoundness',
    'gap',
    'height',
    'leftEyeHeight',
    'leftEyeRotation',
    'mouthCurve',
    'mouthHeight',
    'mouthRotation',
    'mouthWidth',
    'mouthY',
    'noseHeight',
    'noseRotation',
    'noseWidth',
    'noseY',
    'rotation',
    'rightEyeHeight',
    'rightEyeRotation',
    'width'
  ]
  const booleanKeys = ['mouthEnabled', 'noseEnabled']
  const allowedKeys = [
    ...numberKeys,
    ...booleanKeys,
    'eyeHighlight',
    'eyeShape',
    'mouthShape',
    'noseShape'
  ]
  if (!hasOnlyKeys(value, allowedKeys)) return false
  return Object.entries(value).every(([key, field]) => {
    if (numberKeys.includes(key)) {
      const range = AVATAR_ANIMATION_FACE_RANGES[key as keyof typeof AVATAR_ANIMATION_FACE_RANGES]
      return range != null && isFiniteInRange(field, range)
    }
    if (booleanKeys.includes(key)) return isBoolean(field)
    if (key === 'eyeShape') return isOneOf(field, ['ellipse', 'rounded'])
    if (key === 'eyeHighlight') return isAvatarEyeHighlight(field)
    if (key === 'mouthShape') {
      return isOneOf(field, ['curve', 'ellipse', 'rounded', 'rounded-triangle'])
    }
    if (key === 'noseShape') return isOneOf(field, ['ellipse', 'inverted-triangle', 'rounded'])
    return false
  })
}

const isAvatarScenePatch = (value: unknown): value is AvatarScenePatch => {
  if (!isRecord(value) || Object.keys(value).some(key => !['colorGrade', 'face', 'view'].includes(key))) {
    return false
  }
  if (value.colorGrade !== undefined && !isPartialAvatarColorGrade(value.colorGrade)) return false
  if (value.view !== undefined && !isPartialAvatarView(value.view)) return false
  if (value.face !== undefined && !isPartialAvatarFace(value.face)) return false
  return true
}

const isAvatarAnimationClip = (value: unknown): value is AvatarAnimationClip => {
  if (
    !isRecord(value) || !hasOnlyKeys(value, [
      'anchor',
      'durationMs',
      'keyframes',
      'label',
      'playback'
    ]) || !hasOwnKeys(value, ['anchor', 'durationMs', 'keyframes', 'playback']) ||
    !isOneOf(value.anchor, ['absolute', 'relative']) ||
    !isFiniteNumber(value.durationMs) || value.durationMs <= 0 || !isOptionalString(value.label) ||
    !isOneOf(value.playback, ['loop', 'once']) ||
    !isDenseArray<AvatarAnimationKeyframe>(value.keyframes) ||
    value.keyframes.length === 0 || (value.playback === 'loop' && value.keyframes.length < 2)
  ) return false
  const durationMs = value.durationMs
  if (
    !value.keyframes.every(keyframe => (
      isRecord(keyframe) && hasOnlyKeys(keyframe, ['atMs', 'easing', 'patch']) &&
      hasOwnKeys(keyframe, ['atMs', 'patch']) &&
      isFiniteNumber(keyframe.atMs) && keyframe.atMs >= 0 &&
      keyframe.atMs <= durationMs &&
      (keyframe.easing === undefined || isOneOf(keyframe.easing, [
        'ease-in',
        'ease-in-out',
        'ease-out',
        'linear'
      ])) && isAvatarScenePatch(keyframe.patch)
    ))
  ) return false
  const ordered = [...value.keyframes].sort((a, b) => a.atMs - b.atMs)
  const timeline = ordered[0]!.atMs > 0
    ? [{ atMs: 0 }, ...ordered]
    : ordered
  const segmentIsValid = (duration: number) => (
    duration >= AVATAR_ANIMATION_MIN_SEGMENT_MS && duration <= AVATAR_ANIMATION_MAX_SEGMENT_MS
  )
  if (
    timeline.slice(1).some((frame, index) => (
      !segmentIsValid(frame.atMs - timeline[index]!.atMs)
    ))
  ) return false
  const tailDuration = durationMs - timeline.at(-1)!.atMs
  return value.playback === 'loop'
    ? segmentIsValid(tailDuration)
    : tailDuration === 0 || segmentIsValid(tailDuration)
}

export const parseAvatarAnimationClip = (input: unknown): AvatarAnimationClip => {
  try {
    if (!isAvatarAnimationClip(input)) throw new TypeError('Invalid OneWorks Avatar animation clip')
    const value = structuredClone(input)
    if (!isAvatarAnimationClip(value)) throw new TypeError('Invalid OneWorks Avatar animation clip')
    return value
  } catch {
    throw new TypeError('Invalid OneWorks Avatar animation clip')
  }
}

const isAvatarAnimationLibrary = (value: unknown): value is AvatarAnimationLibrary => (
  isRecord(value) && hasOnlyKeys(value, ['groups', 'id', 'label']) &&
  hasOwnKeys(value, ['groups', 'id']) &&
  isString(value.id) && value.id.trim().length > 0 && isOptionalString(value.label) && isRecord(value.groups) &&
  Object.entries(value.groups).every(([groupId, group]) => (
    groupId.trim().length > 0 &&
    isRecord(group) && hasOnlyKeys(group, ['clips', 'defaultClip', 'label']) &&
    hasOwnKeys(group, ['clips']) &&
    isOptionalString(group.defaultClip) && isOptionalString(group.label) &&
    isRecord(group.clips) && Object.entries(group.clips).every(([clipId, clip]) => (
      clipId.trim().length > 0 && isAvatarAnimationClip(clip)
    )) &&
    (group.defaultClip === undefined || Object.hasOwn(group.clips, group.defaultClip))
  ))
)

const isAvatarDefinitionValue = (value: unknown): value is AvatarDefinition => {
  if (
    !isRecord(value) || !hasOnlyKeys(value, ['animations', 'metadata', 'scene', 'schema', 'version']) ||
    !hasOwnKeys(value, ['scene', 'schema', 'version']) ||
    value.schema !== AVATAR_DEFINITION_SCHEMA || value.version !== 1
  ) return false
  if (value.animations !== undefined && !isAvatarAnimationLibrary(value.animations)) return false
  if (
    value.metadata !== undefined && (!isRecord(value.metadata) ||
      !hasOnlyKeys(value.metadata, ['createdAt', 'id', 'name', 'updatedAt']) ||
      !isOptionalString(value.metadata.createdAt) || !isOptionalString(value.metadata.id) ||
      !isOptionalString(value.metadata.name) || !isOptionalString(value.metadata.updatedAt))
  ) return false
  if (!isRecord(value.scene) || !hasOnlyKeys(value.scene, [
    'appearance',
    'camera',
    'decals',
    'effects',
    'entity',
    'face',
    'interactionMode',
    'lighting',
    'view'
  ]) || !hasOwnKeys(value.scene, [
    'appearance',
    'camera',
    'decals',
    'effects',
    'entity',
    'face',
    'interactionMode',
    'lighting',
    'view'
  ])) return false
  const scene = value.scene
  if (!isDenseArray<AvatarSurfaceDecal>(scene.decals) || !scene.decals.every(isAvatarSurfaceDecal)) return false
  if (new Set(scene.decals.map(decal => decal.id)).size !== scene.decals.length) return false
  const entityParts = isRecord(scene.entity) && isDenseArray<AvatarEntityPart>(scene.entity.parts)
    ? scene.entity.parts
    : []
  const decalTargetsAreValid = scene.decals.every(decal => (
    decal.targetPartId === null || entityParts.some(part => part.id === decal.targetPartId)
  ))
  return isRecord(scene.appearance) && hasOnlyKeys(scene.appearance, [
    'backgroundStyle',
    'bodyShape',
    'paletteId'
  ]) && hasOwnKeys(scene.appearance, ['backgroundStyle', 'bodyShape', 'paletteId']) &&
    isOneOf(scene.appearance.backgroundStyle, ['gradient', 'solid']) &&
    isOneOf(scene.appearance.bodyShape, [
      'capsule',
      'cone',
      'diamond',
      'ellipse',
      'frustum',
      'half-cone',
      'rounded',
      'square',
      'sphere',
      'teardrop',
      'trapezoid'
    ]) && isString(scene.appearance.paletteId) &&
    isRecord(scene.camera) && hasOnlyKeys(scene.camera, [
      'background',
      'frame',
      'frameShadow',
      'showFrameShadow',
      'size'
    ]) && hasOwnKeys(scene.camera, [
      'background',
      'frame',
      'frameShadow',
      'showFrameShadow',
      'size'
    ]) && (scene.camera.background === 'transparent' || isHexColor(scene.camera.background)) &&
    isOneOf(scene.camera.frame, ['circle', 'rounded', 'square']) &&
    isAvatarShadow(scene.camera.frameShadow, AVATAR_SHADOW_RANGES.frame) &&
    isBoolean(scene.camera.showFrameShadow) &&
    [128, 256, 512].includes(scene.camera.size as number) &&
    isRecord(scene.effects) && hasOnlyKeys(scene.effects, [
      'avatarShadow',
      'colorGrade',
      'faceShadow',
      'outline',
      'showAvatarShadow',
      'showFaceShadow',
      'showOutline'
    ]) && hasOwnKeys(scene.effects, [
      'avatarShadow',
      'colorGrade',
      'faceShadow',
      'outline',
      'showAvatarShadow',
      'showFaceShadow',
      'showOutline'
    ]) && isAvatarShadow(scene.effects.avatarShadow, AVATAR_SHADOW_RANGES.avatar) &&
    isAvatarColorGrade(scene.effects.colorGrade) &&
    isAvatarShadow(scene.effects.faceShadow, AVATAR_SHADOW_RANGES.face) &&
    isAvatarOutline(scene.effects.outline) && isBoolean(scene.effects.showAvatarShadow) &&
    isBoolean(scene.effects.showFaceShadow) && isBoolean(scene.effects.showOutline) &&
    isRecord(scene.entity) && hasOnlyKeys(scene.entity, ['parts', 'preset']) &&
    hasOwnKeys(scene.entity, ['parts', 'preset']) &&
    isDenseArray<AvatarEntityPart>(scene.entity.parts) &&
    scene.entity.parts.every(isAvatarEntityPart) &&
    new Set(scene.entity.parts.map(part => part.id)).size === scene.entity.parts.length &&
    (scene.entity.parts.length === 0 || scene.entity.parts.filter(part => part.face).length === 1) &&
    decalTargetsAreValid &&
    isOneOf(scene.entity.preset, ['bear', 'cat', 'cloud', 'custom', 'dog', 'rabbit', 'sun']) &&
    isAvatarFace(scene.face) && isOneOf(scene.interactionMode, ['move', 'rotate']) &&
    isRecord(scene.lighting) && hasOnlyKeys(scene.lighting, [
      'azimuth',
      'distance',
      'elevation',
      'enabled',
      'gridDensity'
    ]) && hasOwnKeys(scene.lighting, [
      'azimuth',
      'distance',
      'elevation',
      'enabled',
      'gridDensity'
    ]) && isFiniteInRange(scene.lighting.azimuth, AVATAR_LIGHTING_RANGES.azimuth) &&
    isFiniteInRange(scene.lighting.distance, AVATAR_LIGHTING_RANGES.distance) &&
    isFiniteInRange(scene.lighting.elevation, AVATAR_LIGHTING_RANGES.elevation) &&
    isBoolean(scene.lighting.enabled) &&
    isFiniteInRange(scene.lighting.gridDensity, AVATAR_LIGHTING_RANGES.gridDensity) &&
    isAvatarView(scene.view)
}

export const isAvatarDefinition = (value: unknown): value is AvatarDefinition => {
  try {
    return isAvatarDefinitionValue(value)
  } catch {
    return false
  }
}

export const parseAvatarDefinition = (input: unknown): AvatarDefinition => {
  let inputValue: unknown
  try {
    inputValue = typeof input === 'string' ? JSON.parse(input) : input
  } catch {
    throw new TypeError('Invalid OneWorks Avatar definition')
  }
  if (!isAvatarDefinition(inputValue)) throw new TypeError('Invalid OneWorks Avatar definition')
  let value: unknown
  try {
    value = structuredClone(inputValue)
  } catch {
    throw new TypeError('Invalid OneWorks Avatar definition')
  }
  if (!isAvatarDefinition(value)) throw new TypeError('Invalid OneWorks Avatar definition')
  return value
}

export const serializeAvatarDefinition = (definition: AvatarDefinition) => {
  if (!isAvatarDefinition(definition)) throw new TypeError('Invalid OneWorks Avatar definition')
  let value: unknown
  try {
    value = structuredClone(definition)
  } catch {
    throw new TypeError('Invalid OneWorks Avatar definition')
  }
  if (!isAvatarDefinition(value)) throw new TypeError('Invalid OneWorks Avatar definition')
  return `${JSON.stringify(value, null, 2)}\n`
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
  const ordered = [...clip.keyframes].sort((a, b) => a.atMs - b.atMs)
  const viewKeys = ['pitch', 'positionX', 'positionY', 'yaw'] as const
  const delta = Object.fromEntries(viewKeys.map(key => {
    const first = ordered.find(frame => frame.patch.view?.[key] != null)
    const authored = first?.patch.view?.[key]
    return [key, authored == null ? 0 : definition.scene.view[key] - authored]
  })) as Record<(typeof viewKeys)[number], number>
  return {
    ...clip,
    anchor: 'absolute',
    keyframes: clip.keyframes.map(frame => ({
      ...frame,
      patch: {
        ...frame.patch,
        ...(frame.patch.view == null
          ? {}
          : {
            view: Object.fromEntries(
              Object.entries(frame.patch.view).map(([key, value]) => [
                key,
                value + delta[key as keyof typeof delta]
              ])
            )
          })
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
  face: { ...scene.face, ...patch.face },
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
  face: interpolateRecord(from.face, to.face, progress),
  view: interpolateRecord(from.view, to.view, progress)
})

export const resolveAvatarAnimationFrame = (
  definition: AvatarDefinition,
  clip: AvatarAnimationClip,
  elapsedMs: number
): ResolvedAvatarAnimationFrame => {
  const authored = [...clip.keyframes].sort((a, b) => a.atMs - b.atMs)
  if (authored.length === 0 || clip.durationMs <= 0) {
    return { elapsedMs: 0, finished: true, progress: 1, scene: definition.scene }
  }
  const ordered: readonly AvatarAnimationKeyframe[] = authored[0]!.atMs > 0
    ? [{ atMs: 0, easing: authored[0]!.easing, patch: {} }, ...authored]
    : authored
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
