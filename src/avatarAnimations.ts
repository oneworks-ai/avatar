import type { AvatarCameraFrame } from './AvatarControls'
import {
  AVATAR_ANIMATION_PART_SCALE_RANGE,
  AVATAR_ENTITY_RANGES,
  resolveAvatarAnimationColorMaterial,
  resolveAvatarAnimationParameterValues
} from '@oneworks/avatar'
import type {
  AvatarAnimationClip,
  AvatarAnimationEntityPart,
  AvatarAnimationParameter,
  AvatarAnimationParameterValues,
  AvatarAnimationResourceClaim,
  AvatarAnimationShape,
  AvatarDefinition,
  AvatarEntityPartShapeMorphs,
  AvatarEntityPartTransforms
} from '@oneworks/avatar'
import type { AvatarViewState } from './InteractiveAvatar'
import { interpolateAvatarColorGrade, resolveAvatarColorGrade } from './avatarColorGrade'
import type { AvatarColorGrade } from './avatarColorGrade'
import {
  DEFAULT_AVATAR_FACE_STYLE,
  getAvatarBodyCompilerShapeSpec,
  resolveAvatarFaceStyle
} from './avatarGeometry'
import type { AvatarFaceStyle } from './avatarGeometry'
import { resolveAvatarEntityPartScaleZ } from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'

const SAVED_ANIMATIONS_STORAGE_KEY = 'oneworks-avatar-saved-animations-v1'
const MAX_SAVED_ANIMATIONS = 12
export const DEFAULT_AVATAR_ANIMATION_FRAME_DURATION_MS = 800
export const DEFAULT_AVATAR_ANIMATION_EASING: AvatarAnimationEasing = 'ease-in-out'
export const DEFAULT_AVATAR_ANIMATION_DURATION_MS = 3200
export const MIN_AVATAR_ANIMATION_FRAME_DURATION_MS = 100
export const MAX_AVATAR_ANIMATION_FRAME_DURATION_MS = 8000
export const AVATAR_NOTIFICATION_BLUE = '#3b82f6'

export interface AvatarAnimationKeyframe {
  readonly auxiliaryParts?: readonly AvatarAnimationEntityPart[]
  readonly auxiliaryShapes?: readonly AvatarAnimationShape[]
  readonly colorGrade?: AvatarColorGrade
  readonly durationMs: number
  readonly easing: AvatarAnimationEasing
  readonly faceStyle: AvatarFaceStyle
  readonly offset?: number
  readonly partShapeMorphs?: AvatarEntityPartShapeMorphs
  readonly partTransforms?: AvatarEntityPartTransforms
  readonly pitch: number
  readonly positionX: number
  readonly positionY: number
  readonly screenshot?: string
  readonly thumbnailFrame?: AvatarCameraFrame
  readonly yaw: number
}

export interface SavedAvatarAnimation {
  readonly createdAt: number
  readonly id: string
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly lockStartPosition: boolean
  readonly name: string
  readonly playbackMode: AvatarAnimationPlaybackMode
  readonly startFrameIndex: number
  readonly tracks?: readonly AvatarAnimationEditorTrack[]
  readonly version: 3
}

type StoredAvatarAnimationKeyframe = Omit<AvatarAnimationKeyframe, 'durationMs' | 'easing'> & {
  readonly durationMs?: number
  readonly easing?: AvatarAnimationEasing
}

interface LegacyStoredAvatarAnimation {
  readonly createdAt: number
  readonly durationMs: number
  readonly easing?: AvatarAnimationEasing
  readonly id: string
  readonly keyframes: readonly StoredAvatarAnimationKeyframe[]
  readonly lockStartPosition?: boolean
  readonly name?: string
  readonly playbackMode?: AvatarAnimationPlaybackMode
  readonly startFrameIndex?: number
  readonly version: 1 | 2
}

interface StoredAvatarAnimationV3 {
  readonly createdAt: number
  readonly id: string
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly lockStartPosition: boolean
  readonly name: string
  readonly playbackMode: AvatarAnimationPlaybackMode
  readonly startFrameIndex: number
  readonly tracks?: readonly AvatarAnimationEditorTrack[]
  readonly version: 3
}

type StoredAvatarAnimation = LegacyStoredAvatarAnimation | StoredAvatarAnimationV3

export type AvatarAnimationPresetId =
  | 'angry'
  | 'blink'
  | 'bored'
  | 'celebrate'
  | 'curious'
  | 'excited'
  | 'happy'
  | 'idle'
  | 'laughing'
  | 'listening'
  | 'nod'
  | 'playful'
  | 'petrified'
  | 'sad'
  | 'searching'
  | 'surprised'
  | 'shocked'
  | 'thinking'
  | 'wink'
  | 'working'
  | 'bear-alert-morph'
  | 'bear-loading-morph'
  | 'bear-notification-morph'
  | 'bear-sleep-morph'
  | 'bear-burst-morph'

export interface AvatarAnimationPreset {
  readonly defaultTimelineIterations?: number
  readonly description: string
  readonly durationMs: number
  readonly id: AvatarAnimationPresetId
  readonly label: string
  readonly parameters?: readonly AvatarAnimationParameter[]
  readonly playbackMode?: AvatarAnimationPlaybackMode
  readonly requiredEntityPreset?: AvatarEntityPreset
  readonly requiresEntityParts?: boolean
  readonly resourceClaims?: readonly AvatarAnimationResourceClaim[]
}

export const AVATAR_ANIMATION_PRESET_COVER_PROGRESS: Readonly<Record<AvatarAnimationPresetId, number>> = {
  angry: .49,
  'bear-alert-morph': .54,
  'bear-burst-morph': .54,
  'bear-loading-morph': .32,
  'bear-notification-morph': .42,
  'bear-sleep-morph': .55,
  blink: .5,
  bored: .72,
  celebrate: .38,
  curious: .24,
  excited: .39,
  happy: .58,
  idle: .42,
  laughing: .43,
  listening: .22,
  nod: .34,
  petrified: .72,
  playful: .48,
  sad: .48,
  searching: .34,
  shocked: .42,
  surprised: .31,
  thinking: .48,
  wink: .5,
  working: .42
}

export interface ResolvedAvatarAnimationPreset extends AvatarAnimationPreset {
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly parameterValues?: AvatarAnimationParameterValues
}

export interface AvatarAnimationEditorTrack {
  readonly muted: boolean
  readonly parameterValues: AvatarAnimationParameterValues
  readonly presetId: AvatarAnimationPresetId
  readonly solo: boolean
  readonly speed: number
  readonly trackId: string
  readonly weight: number
}

export type AvatarAnimationDraftSource = 'builtin' | 'custom' | 'saved' | null
export type AvatarAnimationEasing = 'ease-in' | 'ease-in-out' | 'ease-out' | 'linear'
export type AvatarAnimationPlaybackMode = 'loop' | 'once'

export const shouldConfirmAnimationReplacement = (
  source: AvatarAnimationDraftSource,
  keyframeCount: number
) => keyframeCount > 0 && source !== 'builtin'

export const easeAvatarAnimationProgress = (
  progress: number,
  easing: AvatarAnimationEasing
) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1)
  if (easing === 'ease-in') return clampedProgress * clampedProgress
  if (easing === 'ease-out') return 1 - (1 - clampedProgress) ** 2
  if (easing === 'ease-in-out') {
    return clampedProgress < .5
      ? 2 * clampedProgress * clampedProgress
      : 1 - ((-2 * clampedProgress + 2) ** 2) / 2
  }
  return clampedProgress
}

export interface AvatarAnimationSegment {
  readonly fromIndex: number
  readonly progress: number
  readonly toIndex: number
}

export interface AvatarAnimationTransformAnchor {
  readonly pitch: number
  readonly positionX: number
  readonly positionY: number
  readonly yaw: number
}

export const createAvatarAnimationTransformAnchor = (
  currentViewState: AvatarViewState,
  firstKeyframe: AvatarAnimationKeyframe
): AvatarAnimationTransformAnchor => ({
  pitch: currentViewState.pitch - firstKeyframe.pitch,
  positionX: currentViewState.positionX - firstKeyframe.positionX,
  positionY: currentViewState.positionY - firstKeyframe.positionY,
  yaw: currentViewState.yaw - firstKeyframe.yaw
})

export const applyAvatarAnimationTransformAnchor = (
  keyframe: AvatarAnimationKeyframe,
  anchor: AvatarAnimationTransformAnchor
): AvatarAnimationKeyframe => ({
  ...keyframe,
  pitch: keyframe.pitch + anchor.pitch,
  positionX: keyframe.positionX + anchor.positionX,
  positionY: keyframe.positionY + anchor.positionY,
  yaw: keyframe.yaw + anchor.yaw
})

export const resolveAvatarAnimationSegment = (
  keyframes: readonly AvatarAnimationKeyframe[],
  progress: number
): AvatarAnimationSegment => {
  if (keyframes.length < 2) return { fromIndex: 0, progress: 0, toIndex: 0 }

  const clampedProgress = Math.min(Math.max(progress, 0), 1)
  const lastIndex = keyframes.length - 1
  const offsets = keyframes.reduce<number[]>((resolvedOffsets, keyframe, index) => {
    const fallback = index / lastIndex
    const requestedOffset = index === 0
      ? 0
      : index === lastIndex
      ? 1
      : Math.min(Math.max(keyframe.offset ?? fallback, 0), 1)
    const previousOffset = resolvedOffsets.at(-1) ?? 0
    resolvedOffsets.push(Math.max(requestedOffset, previousOffset))
    return resolvedOffsets
  }, [])

  let toIndex = 1
  while (toIndex < lastIndex && clampedProgress > offsets[toIndex]!) toIndex += 1
  const fromIndex = toIndex - 1
  const fromOffset = offsets[fromIndex]!
  const toOffset = offsets[toIndex]!
  const span = toOffset - fromOffset

  return {
    fromIndex,
    progress: span <= 0 ? 1 : Math.min(Math.max((clampedProgress - fromOffset) / span, 0), 1),
    toIndex
  }
}

export interface AvatarAnimationTimedSegment extends AvatarAnimationSegment {
  readonly easing: AvatarAnimationEasing
  readonly finished: boolean
  readonly totalDurationMs: number
}

export const resolveAvatarAnimationTimedSegment = (
  keyframes: readonly AvatarAnimationKeyframe[],
  elapsedMs: number,
  mode: AvatarAnimationPlaybackMode
): AvatarAnimationTimedSegment => {
  if (keyframes.length < 2) {
    return {
      easing: keyframes[0]?.easing ?? DEFAULT_AVATAR_ANIMATION_EASING,
      finished: true,
      fromIndex: 0,
      progress: 0,
      toIndex: 0,
      totalDurationMs: 0
    }
  }

  const destinationIndices = keyframes.slice(1).map((_, index) => index + 1)
  if (mode === 'loop') destinationIndices.push(0)
  const totalDurationMs = destinationIndices.reduce((total, index) => {
    return total + keyframes[index]!.durationMs
  }, 0)
  const clampedElapsed = Math.max(elapsedMs, 0)
  const finished = mode === 'once' && clampedElapsed >= totalDurationMs
  if (finished) {
    const lastIndex = keyframes.length - 1
    return {
      easing: keyframes[lastIndex]!.easing,
      finished: true,
      fromIndex: lastIndex,
      progress: 1,
      toIndex: lastIndex,
      totalDurationMs
    }
  }

  const timelineElapsed = mode === 'loop' && totalDurationMs > 0
    ? clampedElapsed % totalDurationMs
    : Math.min(clampedElapsed, totalDurationMs)
  let segmentStartedAt = 0
  for (const toIndex of destinationIndices) {
    const to = keyframes[toIndex]!
    const segmentEndsAt = segmentStartedAt + to.durationMs
    if (timelineElapsed < segmentEndsAt || toIndex === destinationIndices.at(-1)) {
      const fromIndex = toIndex === 0 ? keyframes.length - 1 : toIndex - 1
      return {
        easing: to.easing,
        finished: false,
        fromIndex,
        progress: Math.min(Math.max((timelineElapsed - segmentStartedAt) / to.durationMs, 0), 1),
        toIndex,
        totalDurationMs
      }
    }
    segmentStartedAt = segmentEndsAt
  }

  return {
    easing: DEFAULT_AVATAR_ANIMATION_EASING,
    finished: mode === 'once',
    fromIndex: 0,
    progress: 0,
    toIndex: 0,
    totalDurationMs
  }
}

export const AVATAR_ANIMATION_PRESETS: readonly AvatarAnimationPreset[] = [
  {
    description: 'Breathing, a soft glance, and one quick blink.',
    durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS,
    id: 'idle',
    label: 'Idle',
    playbackMode: 'once'
  },
  { description: 'A compact close, hold, and open eye beat.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'blink', label: 'Blink', playbackMode: 'once' },
  { description: 'A playful one-eyed wink with a small smile.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'wink', label: 'Wink', playbackMode: 'once' },
  {
    description: 'A relaxed attentive gaze with a quiet response.',
    durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS,
    id: 'listening',
    label: 'Listening',
    playbackMode: 'once'
  },
  { description: 'A small affirmative dip with a soft rebound.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'nod', label: 'Nod', playbackMode: 'once' },
  { description: 'An upward side gaze with changing focus.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'thinking', label: 'Thinking', playbackMode: 'once' },
  { description: 'A quick left-right scan with focused eyes.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'searching', label: 'Searching', playbackMode: 'once' },
  { description: 'Steady concentration with restrained movement.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'working', label: 'Working', playbackMode: 'once' },
  { description: 'A warm smile with a gentle buoyant lift.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'happy', label: 'Happy', playbackMode: 'once' },
  { description: 'A questioning tilt with wide observant eyes.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'curious', label: 'Curious', playbackMode: 'once' },
  { description: 'A fast recoil into a wide-eyed reaction.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'surprised', label: 'Surprised', playbackMode: 'once' },
  { description: 'Heavy eyelids and a slow unimpressed drift.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'bored', label: 'Bored', playbackMode: 'once' },
  { description: 'A lowered posture with a soft frown.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'sad', label: 'Sad', playbackMode: 'once' },
  { description: 'A hot red flare with a sharp, trembling glare.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'angry', label: 'Angry', playbackMode: 'once' },
  { description: 'A bright flash and a full-body startled recoil.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'shocked', label: 'Shocked', playbackMode: 'once' },
  { description: 'Color drains away as the whole character freezes.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'petrified', label: 'Petrified', playbackMode: 'once' },
  { description: 'Closed smiling eyes with a rhythmic laugh.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'laughing', label: 'Laughing', playbackMode: 'once' },
  { description: 'A cheeky side tilt and crooked smile.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'playful', label: 'Playful', playbackMode: 'once' },
  { description: 'Quick happy hops with a bright expression.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'excited', label: 'Excited', playbackMode: 'once' },
  { description: 'A broad side-to-side victory bounce.', durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS, id: 'celebrate', label: 'Celebrate', playbackMode: 'once' },
  {
    description: 'The intact character becomes the dot beneath an independent alert stem, then fully restores.',
    durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS,
    id: 'bear-alert-morph',
    label: 'Exclamation',
    playbackMode: 'once',
    requiresEntityParts: true
  },
  {
    description: 'The intact character becomes the center ball while two independent 3D loading balls join it, then fully restores.',
    durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS,
    id: 'bear-loading-morph',
    label: 'Three-ball loading',
    playbackMode: 'once',
    requiresEntityParts: true
  },
  {
    description: 'The intact character focuses as a transient 3D notification badge scales at a head-safe upper anchor.',
    durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS,
    id: 'bear-notification-morph',
    label: 'Notification',
    parameters: [
      {
        default: 'upper-right',
        id: 'orbPosition',
        label: '圆球位置',
        options: [
          { label: '左上', value: 'upper-left' },
          { label: '右上', value: 'upper-right' }
        ],
        type: 'enum'
      },
      {
        binding: { partId: 'notification-orb', type: 'auxiliary-part-material' },
        default: AVATAR_NOTIFICATION_BLUE,
        id: 'orbColor',
        label: '圆球颜色',
        type: 'color'
      }
    ],
    playbackMode: 'once',
    requiresEntityParts: true,
    resourceClaims: ['aux:notification-orb']
  },
  {
    description: 'Every semantic character part gathers into one gently floating sleep ball, then reversibly unfolds.',
    durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS,
    id: 'bear-sleep-morph',
    label: 'Sleep',
    playbackMode: 'once',
    requiresEntityParts: true
  },
  {
    description: 'Three distant particles fade in, complete one full spiral around the compressed character, and enter its core before the sequence completes.',
    durationMs: DEFAULT_AVATAR_ANIMATION_DURATION_MS,
    id: 'bear-burst-morph',
    label: 'Burst',
    playbackMode: 'once',
    requiresEntityParts: true
  }
]

export const getAvatarAnimationPresetDefaultTimelineIterations = (
  preset: AvatarAnimationPreset
) => preset.playbackMode === 'loop'
  ? Math.max(Math.round(preset.defaultTimelineIterations ?? 1), 1)
  : 1

const numericFaceStyleKeys = [
  'eyeRoundness',
  'gap',
  'height',
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
  'width'
] as const satisfies readonly (keyof AvatarFaceStyle)[]

const optionalNumericFaceStyleKeys = [
  'leftEyeHeight',
  'leftEyeWidth',
  'leftEyeRotation',
  'rightEyeHeight',
  'rightEyeWidth',
  'rightEyeRotation'
] as const satisfies readonly (keyof AvatarFaceStyle)[]

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value != null && typeof value === 'object'
}

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}

const isAvatarAnimationEasing = (value: unknown): value is AvatarAnimationEasing => {
  return value === 'linear' || value === 'ease-in' || value === 'ease-out' || value === 'ease-in-out'
}

const isAvatarAnimationFrameDuration = (value: unknown): value is number => {
  return isFiniteNumber(value) &&
    value >= MIN_AVATAR_ANIMATION_FRAME_DURATION_MS &&
    value <= MAX_AVATAR_ANIMATION_FRAME_DURATION_MS
}

export const clampAvatarAnimationFrameDuration = (durationMs: number) => {
  return Math.min(
    Math.max(Math.round(durationMs), MIN_AVATAR_ANIMATION_FRAME_DURATION_MS),
    MAX_AVATAR_ANIMATION_FRAME_DURATION_MS
  )
}

const isAvatarFaceStyle = (value: unknown): value is AvatarFaceStyle => {
  if (!isRecord(value)) return false
  const highlight = value.eyeHighlight
  return numericFaceStyleKeys.every(key => isFiniteNumber(value[key])) &&
    optionalNumericFaceStyleKeys.every(key => value[key] == null || isFiniteNumber(value[key])) &&
    (value.eyeShape === 'ellipse' || value.eyeShape === 'rounded' || value.eyeShape === 'chevron') &&
    (value.leftEyeShape == null || value.leftEyeShape === 'ellipse' || value.leftEyeShape === 'rounded' || value.leftEyeShape === 'chevron') &&
    (value.rightEyeShape == null || value.rightEyeShape === 'ellipse' || value.rightEyeShape === 'rounded' || value.rightEyeShape === 'chevron') &&
    typeof value.mouthEnabled === 'boolean' &&
    (value.mouthShape == null ||
      value.mouthShape === 'curve' ||
      value.mouthShape === 'ellipse' ||
      value.mouthShape === 'rounded' ||
      value.mouthShape === 'rounded-triangle') &&
    typeof value.noseEnabled === 'boolean' &&
    (value.noseShape === 'ellipse' || value.noseShape === 'inverted-triangle' || value.noseShape === 'rounded') &&
    (highlight == null || (
      isRecord(highlight) && typeof highlight.enabled === 'boolean' &&
      typeof highlight.color === 'string' && /^#[\da-f]{6}$/iu.test(highlight.color) &&
      isFiniteNumber(highlight.offsetX) && isFiniteNumber(highlight.offsetY) &&
      isFiniteNumber(highlight.opacity) && isFiniteNumber(highlight.size)
    ))
}

const isAvatarColorGrade = (value: unknown): value is AvatarColorGrade => {
  if (!isRecord(value)) return false
  return isFiniteNumber(value.brightness) && value.brightness >= .35 && value.brightness <= 1.8 &&
    isFiniteNumber(value.saturation) && value.saturation >= 0 && value.saturation <= 2 &&
    isFiniteNumber(value.tintAmount) && value.tintAmount >= 0 && value.tintAmount <= 1 &&
    isFiniteNumber(value.tintB) && value.tintB >= 0 && value.tintB <= 255 &&
    isFiniteNumber(value.tintG) && value.tintG >= 0 && value.tintG <= 255 &&
    isFiniteNumber(value.tintR) && value.tintR >= 0 && value.tintR <= 255
}

const isAvatarEntityPartTransforms = (value: unknown): value is AvatarEntityPartTransforms => {
  if (!isRecord(value)) return false
  const allowedKeys = ['rotationZ', 'scaleX', 'scaleY', 'scaleZ', 'x', 'y', 'z']
  return Object.entries(value).every(([id, transform]) => {
    if (id.trim().length === 0 || !isRecord(transform)) return false
    return Object.entries(transform).every(([key, field]) => {
      if (!allowedKeys.includes(key) || !isFiniteNumber(field)) return false
      if (key === 'scaleX' || key === 'scaleY' || key === 'scaleZ') {
        return field >= AVATAR_ANIMATION_PART_SCALE_RANGE.min &&
          field <= AVATAR_ANIMATION_PART_SCALE_RANGE.max
      }
      return true
    })
  })
}

const isAvatarEntityPartShapeMorphs = (value: unknown): value is AvatarEntityPartShapeMorphs => {
  if (!isRecord(value)) return false
  const shapes = [
    'capsule', 'cone', 'diamond', 'ellipse', 'frustum', 'half-cone',
    'rounded', 'square', 'sphere', 'teardrop', 'trapezoid'
  ]
  return Object.entries(value).every(([id, morph]) => (
    id.trim().length > 0 && isRecord(morph) &&
    Object.keys(morph).every(key => ['fromShape', 'progress', 'toShape'].includes(key)) &&
    typeof morph.fromShape === 'string' && shapes.includes(morph.fromShape) &&
    isFiniteNumber(morph.progress) && morph.progress >= 0 && morph.progress <= 1 &&
    typeof morph.toShape === 'string' && shapes.includes(morph.toShape)
  ))
}

const isAvatarAnimationShapes = (value: unknown): value is readonly AvatarAnimationShape[] => {
  if (!Array.isArray(value) || value.length > 16) return false
  const ids = new Set<string>()
  return value.every(shape => {
    if (!isRecord(shape) || typeof shape.id !== 'string' || ids.has(shape.id)) return false
    ids.add(shape.id)
    return shape.id.trim().length > 0 && shape.id.length <= 80 &&
      (shape.kind === 'ellipse' || shape.kind === 'exclamation' || shape.kind === 'rounded-rect') &&
      typeof shape.color === 'string' && /^#[\da-f]{6}$/iu.test(shape.color) &&
      isFiniteNumber(shape.height) && shape.height >= 0 && shape.height <= 840 &&
      isFiniteNumber(shape.opacity) && shape.opacity >= 0 && shape.opacity <= 100 &&
      isFiniteNumber(shape.rotation) && shape.rotation >= -360 && shape.rotation <= 360 &&
      isFiniteNumber(shape.roundness) && shape.roundness >= 0 && shape.roundness <= 100 &&
      isFiniteNumber(shape.width) && shape.width >= 0 && shape.width <= 840 &&
      isFiniteNumber(shape.x) && isFiniteNumber(shape.y) &&
      Object.keys(shape).every(key => [
        'color',
        'height',
        'id',
        'kind',
        'opacity',
        'rotation',
        'roundness',
        'width',
        'x',
        'y'
      ].includes(key))
  })
}

const isAvatarAnimationEntityParts = (
  value: unknown
): value is readonly AvatarAnimationEntityPart[] => {
  if (!Array.isArray(value) || value.length > 16) return false
  const ids = new Set<string>()
  const shapes = [
    'capsule', 'cone', 'diamond', 'ellipse', 'frustum', 'half-cone',
    'rounded', 'square', 'sphere', 'teardrop', 'trapezoid'
  ]
  return value.every(item => {
    if (!isRecord(item) || !isRecord(item.part)) return false
    const part = item.part
    if (typeof part.id !== 'string' || ids.has(part.id)) return false
    ids.add(part.id)
    const colorsAreValid = ['baseColor', 'foregroundColor', 'highlightColor', 'shadowColor']
      .every(key => typeof part[key] === 'string' && /^#[\da-f]{6}$/iu.test(part[key] as string))
    return Object.keys(item).every(key => ['composition', 'opacity', 'part', 'transform'].includes(key)) &&
      (item.composition == null || item.composition === 'co-compiled' || item.composition === 'independent-depth') &&
      isFiniteNumber(item.opacity) && item.opacity >= 0 && item.opacity <= 100 &&
      part.id.trim().length > 0 && part.id.length <= 80 &&
      typeof part.label === 'string' && typeof part.face === 'boolean' &&
      typeof part.shape === 'string' && shapes.includes(part.shape) && colorsAreValid &&
      isFiniteNumber(part.scaleX) && part.scaleX >= AVATAR_ENTITY_RANGES.scaleX.min &&
      part.scaleX <= AVATAR_ENTITY_RANGES.scaleX.max &&
      isFiniteNumber(part.scaleY) && part.scaleY >= AVATAR_ENTITY_RANGES.scaleY.min &&
      part.scaleY <= AVATAR_ENTITY_RANGES.scaleY.max &&
      (part.scaleZ == null || (isFiniteNumber(part.scaleZ) &&
        part.scaleZ >= AVATAR_ENTITY_RANGES.scaleZ.min && part.scaleZ <= AVATAR_ENTITY_RANGES.scaleZ.max)) &&
      isFiniteNumber(part.x) && isFiniteNumber(part.y) && isFiniteNumber(part.z) &&
      (item.transform == null || isAvatarEntityPartTransforms({ [part.id]: item.transform }))
  })
}

const isStoredAvatarAnimationKeyframe = (value: unknown): value is StoredAvatarAnimationKeyframe => {
  if (!isRecord(value)) return false
  return (value.durationMs == null || isAvatarAnimationFrameDuration(value.durationMs)) &&
    (value.auxiliaryParts == null || isAvatarAnimationEntityParts(value.auxiliaryParts)) &&
    (value.auxiliaryShapes == null || isAvatarAnimationShapes(value.auxiliaryShapes)) &&
    (value.easing == null || isAvatarAnimationEasing(value.easing)) &&
    (value.colorGrade == null || isAvatarColorGrade(value.colorGrade)) &&
    (value.partShapeMorphs == null || isAvatarEntityPartShapeMorphs(value.partShapeMorphs)) &&
    (value.partTransforms == null || isAvatarEntityPartTransforms(value.partTransforms)) &&
    isAvatarFaceStyle(value.faceStyle) &&
    (value.offset == null || (isFiniteNumber(value.offset) && value.offset >= 0 && value.offset <= 1)) &&
    isFiniteNumber(value.pitch) &&
    isFiniteNumber(value.positionX) &&
    isFiniteNumber(value.positionY) &&
    (value.screenshot == null ||
      (typeof value.screenshot === 'string' && value.screenshot.startsWith('data:image/'))) &&
    (value.thumbnailFrame == null ||
      value.thumbnailFrame === 'circle' ||
      value.thumbnailFrame === 'rounded' ||
      value.thumbnailFrame === 'square') &&
    isFiniteNumber(value.yaw)
}

const isAvatarAnimationKeyframe = (value: unknown): value is AvatarAnimationKeyframe => {
  return isStoredAvatarAnimationKeyframe(value) &&
    isAvatarAnimationFrameDuration(value.durationMs) &&
    isAvatarAnimationEasing(value.easing)
}

const resolveLegacyKeyframeOffsets = (keyframes: readonly StoredAvatarAnimationKeyframe[]) => {
  if (keyframes.length < 2) return keyframes.map(() => 0)
  const lastIndex = keyframes.length - 1
  return keyframes.reduce<number[]>((resolvedOffsets, keyframe, index) => {
    const fallback = index / lastIndex
    const requestedOffset = index === 0
      ? 0
      : index === lastIndex
      ? 1
      : Math.min(Math.max(keyframe.offset ?? fallback, 0), 1)
    resolvedOffsets.push(Math.max(requestedOffset, resolvedOffsets.at(-1) ?? 0))
    return resolvedOffsets
  }, [])
}

export const normalizeAvatarAnimationKeyframes = (
  keyframes: readonly StoredAvatarAnimationKeyframe[],
  legacyDurationMs?: number,
  legacyEasing: AvatarAnimationEasing = DEFAULT_AVATAR_ANIMATION_EASING
): AvatarAnimationKeyframe[] => {
  const offsets = resolveLegacyKeyframeOffsets(keyframes)
  const fallbackTotalDuration = isFiniteNumber(legacyDurationMs)
    ? Math.max(legacyDurationMs, MIN_AVATAR_ANIMATION_FRAME_DURATION_MS)
    : DEFAULT_AVATAR_ANIMATION_FRAME_DURATION_MS * Math.max(keyframes.length - 1, 1)

  return keyframes.map((keyframe, index) => {
    const { durationMs, easing, offset: _offset, ...frame } = keyframe
    const previousOffset = offsets[Math.max(index - 1, 0)] ?? 0
    const currentOffset = offsets[index] ?? previousOffset
    const legacySegmentDuration = index === 0
      ? MIN_AVATAR_ANIMATION_FRAME_DURATION_MS
      : fallbackTotalDuration * Math.max(currentOffset - previousOffset, 0)
    return {
      ...frame,
      durationMs: isAvatarAnimationFrameDuration(durationMs)
        ? durationMs
        : clampAvatarAnimationFrameDuration(
          legacySegmentDuration > 0 ? legacySegmentDuration : DEFAULT_AVATAR_ANIMATION_FRAME_DURATION_MS
        ),
      easing: isAvatarAnimationEasing(easing) ? easing : legacyEasing,
      faceStyle: resolveAvatarFaceStyle(frame.faceStyle)
    }
  })
}

const isStoredAvatarAnimation = (value: unknown): value is StoredAvatarAnimation => {
  if (!isRecord(value)) return false
  const hasCommonShape = typeof value.id === 'string' &&
    isFiniteNumber(value.createdAt) &&
    Array.isArray(value.keyframes) &&
    value.keyframes.length >= 2 &&
    value.keyframes.every(isStoredAvatarAnimationKeyframe)
  if (!hasCommonShape) return false
  if (value.version === 3) {
    return typeof value.name === 'string' &&
      typeof value.lockStartPosition === 'boolean' &&
      (value.playbackMode === 'once' || value.playbackMode === 'loop') &&
      isFiniteNumber(value.startFrameIndex) &&
      (value.tracks === undefined || isAvatarAnimationEditorTracks(value.tracks)) &&
      Array.isArray(value.keyframes) &&
      value.keyframes.every(isAvatarAnimationKeyframe)
  }
  return (value.version === 1 || value.version === 2) &&
    isFiniteNumber(value.durationMs) &&
    value.durationMs >= 200 &&
    value.durationMs <= 30_000
}

interface SharedAvatarAnimationPayloadV1 {
  readonly d: number
  readonly e: AvatarAnimationEasing
  readonly k: readonly StoredAvatarAnimationKeyframe[]
  readonly l: boolean
  readonly n: string
  readonly p: AvatarAnimationPlaybackMode
  readonly s: number
  readonly v: 1
}

interface SharedAvatarAnimationPayloadV2 {
  readonly k: readonly AvatarAnimationKeyframe[]
  readonly l: boolean
  readonly n: string
  readonly p: AvatarAnimationPlaybackMode
  readonly s: number
  readonly t?: readonly AvatarAnimationEditorTrack[]
  readonly v: 2
}

const isAvatarAnimationParameterValues = (value: unknown): value is AvatarAnimationParameterValues => (
  isRecord(value) && Object.values(value).every(item => (
    typeof item === 'boolean' || typeof item === 'string' || isFiniteNumber(item)
  ))
)

const isAvatarAnimationEditorTrack = (value: unknown): value is AvatarAnimationEditorTrack => {
  if (
    !isRecord(value) ||
    typeof value.trackId !== 'string' || value.trackId.trim().length === 0 ||
    typeof value.presetId !== 'string' ||
    typeof value.muted !== 'boolean' || typeof value.solo !== 'boolean' ||
    !isFiniteNumber(value.speed) || value.speed <= 0 || value.speed > 4 ||
    !isFiniteNumber(value.weight) || value.weight < 0 || value.weight > 1 ||
    !isAvatarAnimationParameterValues(value.parameterValues)
  ) return false
  const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === value.presetId)
  if (preset == null) return false
  try {
    resolveAvatarAnimationParameterValues(
      { parameters: preset.parameters },
      value.parameterValues
    )
    return true
  } catch {
    return false
  }
}

const isAvatarAnimationEditorTracks = (value: unknown): value is readonly AvatarAnimationEditorTrack[] => (
  Array.isArray(value) && value.length <= 16 && value.every(isAvatarAnimationEditorTrack) &&
  new Set(value.map(track => track.trackId)).size === value.length
)

const hasSharedAvatarAnimationShape = (value: Record<string, unknown>) => {
  return typeof value.n === 'string' &&
    value.n.trim().length > 0 &&
    value.n.length <= 40 &&
    (value.p === 'once' || value.p === 'loop') &&
    typeof value.l === 'boolean' &&
    isFiniteNumber(value.s) &&
    Array.isArray(value.k) &&
    value.k.length >= 2 &&
    value.k.length <= 32
}

const isSharedAvatarAnimationPayloadV1 = (value: unknown): value is SharedAvatarAnimationPayloadV1 => {
  if (!isRecord(value)) return false
  return hasSharedAvatarAnimationShape(value) &&
    Array.isArray(value.k) &&
    value.v === 1 &&
    isFiniteNumber(value.d) &&
    value.d >= 200 &&
    value.d <= 30_000 &&
    isAvatarAnimationEasing(value.e) &&
    value.k.every(isStoredAvatarAnimationKeyframe)
}

const isSharedAvatarAnimationPayloadV2 = (value: unknown): value is SharedAvatarAnimationPayloadV2 => {
  if (!isRecord(value)) return false
  return hasSharedAvatarAnimationShape(value) &&
    Array.isArray(value.k) &&
    value.v === 2 &&
    (value.t === undefined || isAvatarAnimationEditorTracks(value.t)) &&
    value.k.every(isAvatarAnimationKeyframe)
}

export const serializeSharedAvatarAnimation = (animation: SavedAvatarAnimation) => {
  const payload: SharedAvatarAnimationPayloadV2 = {
    k: animation.keyframes.map(({ screenshot: _screenshot, thumbnailFrame: _thumbnailFrame, ...keyframe }) => ({
      ...keyframe,
      faceStyle: { ...keyframe.faceStyle }
    })),
    l: animation.lockStartPosition,
    n: animation.name.trim() || 'Untitled animation',
    p: animation.playbackMode,
    s: Math.min(Math.max(Math.round(animation.startFrameIndex), 0), animation.keyframes.length - 1),
    ...(animation.tracks == null ? {} : { t: animation.tracks }),
    v: 2
  }
  return JSON.stringify(payload)
}

export const deserializeSharedAvatarAnimation = (serialized: string | null): SavedAvatarAnimation | null => {
  if (serialized == null || serialized.length > 64_000) return null
  try {
    const payload = JSON.parse(serialized) as unknown
    if (!isSharedAvatarAnimationPayloadV1(payload) && !isSharedAvatarAnimationPayloadV2(payload)) return null
    const keyframes = payload.v === 1
      ? normalizeAvatarAnimationKeyframes(payload.k, payload.d, payload.e)
      : normalizeAvatarAnimationKeyframes(payload.k)
    return {
      createdAt: 0,
      id: 'shared',
      keyframes,
      lockStartPosition: payload.l,
      name: payload.n.trim(),
      playbackMode: payload.p,
      startFrameIndex: Math.min(Math.max(Math.round(payload.s), 0), payload.k.length - 1),
      ...(payload.v === 2 && payload.t != null ? { tracks: payload.t } : {}),
      version: 3
    }
  } catch {
    return null
  }
}

export const loadSavedAvatarAnimations = (): SavedAvatarAnimation[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = JSON.parse(window.localStorage.getItem(SAVED_ANIMATIONS_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(stored)
      ? stored
        .filter(isStoredAvatarAnimation)
        .slice(0, MAX_SAVED_ANIMATIONS)
        .map((animation, index) => {
          const legacyDurationMs = animation.version === 3 ? undefined : animation.durationMs
          const legacyEasing = animation.version === 3 || !isAvatarAnimationEasing(animation.easing)
            ? DEFAULT_AVATAR_ANIMATION_EASING
            : animation.easing
          return {
            createdAt: animation.createdAt,
            id: animation.id,
            keyframes: normalizeAvatarAnimationKeyframes(animation.keyframes, legacyDurationMs, legacyEasing),
            lockStartPosition: animation.lockStartPosition === true,
            name: typeof animation.name === 'string' && animation.name.trim().length > 0
              ? animation.name.trim()
              : `Saved ${Math.max(stored.length - index, 1)}`,
            playbackMode: animation.playbackMode === 'once' ? 'once' : 'loop',
            startFrameIndex: isFiniteNumber(animation.startFrameIndex)
              ? Math.min(
                Math.max(Math.round(animation.startFrameIndex), 0),
                animation.keyframes.length - 1
              )
              : 0,
            ...(animation.version === 3 && animation.tracks != null ? { tracks: animation.tracks } : {}),
            version: 3 as const
          }
        })
      : []
  } catch {
    return []
  }
}

export const persistSavedAvatarAnimations = (animations: readonly SavedAvatarAnimation[]) => {
  window.localStorage.setItem(
    SAVED_ANIMATIONS_STORAGE_KEY,
    JSON.stringify(animations.slice(0, MAX_SAVED_ANIMATIONS))
  )
}

export const prependSavedAvatarAnimation = (
  animations: readonly SavedAvatarAnimation[],
  animation: SavedAvatarAnimation
) => [animation, ...animations].slice(0, MAX_SAVED_ANIMATIONS)

export const createAvatarAnimationKeyframe = (
  viewState: AvatarViewState,
  faceStyle: AvatarFaceStyle,
  screenshot?: string,
  colorGrade?: AvatarColorGrade
): AvatarAnimationKeyframe => ({
  colorGrade: resolveAvatarColorGrade(colorGrade),
  durationMs: DEFAULT_AVATAR_ANIMATION_FRAME_DURATION_MS,
  easing: DEFAULT_AVATAR_ANIMATION_EASING,
  faceStyle: resolveAvatarFaceStyle(faceStyle),
  pitch: viewState.pitch,
  positionX: viewState.positionX,
  positionY: viewState.positionY,
  ...(screenshot == null ? {} : { screenshot }),
  yaw: viewState.yaw
})

interface AvatarPresetFrame {
  readonly auxiliaryParts?: readonly AvatarAnimationEntityPart[]
  readonly auxiliaryShapes?: readonly AvatarAnimationShape[]
  readonly colorGrade?: Partial<AvatarColorGrade>
  readonly easing?: AvatarAnimationEasing
  readonly faceStyle?: Partial<AvatarFaceStyle>
  readonly offset?: number
  readonly partShapeMorphs?: AvatarEntityPartShapeMorphs
  readonly partTransforms?: AvatarEntityPartTransforms
  readonly pitch?: number
  readonly positionX?: number
  readonly positionY?: number
  readonly yaw?: number
}

const clampPresetValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const createRelativePresetFrame = (
  viewState: AvatarViewState,
  faceStyle: AvatarFaceStyle,
  frame: AvatarPresetFrame = {}
): StoredAvatarAnimationKeyframe => ({
  ...(frame.auxiliaryParts == null ? {} : { auxiliaryParts: frame.auxiliaryParts }),
  ...(frame.auxiliaryShapes == null ? {} : { auxiliaryShapes: frame.auxiliaryShapes }),
  colorGrade: resolveAvatarColorGrade(frame.colorGrade),
  ...(frame.easing == null ? {} : { easing: frame.easing }),
  faceStyle: resolveAvatarFaceStyle({ ...faceStyle, ...frame.faceStyle }),
  ...(frame.offset == null ? {} : { offset: frame.offset }),
  ...(frame.partShapeMorphs == null ? {} : { partShapeMorphs: frame.partShapeMorphs }),
  ...(frame.partTransforms == null ? {} : { partTransforms: frame.partTransforms }),
  pitch: viewState.pitch + (frame.pitch ?? 0),
  positionX: viewState.positionX + (frame.positionX ?? 0),
  positionY: viewState.positionY + (frame.positionY ?? 0),
  yaw: viewState.yaw + (frame.yaw ?? 0)
})

export interface AvatarAnimationHeadLayout {
  readonly badgeRadius: number
  readonly headPartId: string
  readonly headProjectedCenter: Readonly<{ x: number; y: number }>
  readonly headProjectedRadius: Readonly<{ x: number; y: number; z: number }>
  readonly notificationAnchor: Readonly<{
    gap: number
    projectedX: number
    projectedY: number
    x: number
    y: number
    z: number
  }>
  readonly notificationScale: number
}

export type AvatarNotificationPosition = 'upper-left' | 'upper-right'

const ENTITY_MORPH_PROFILE = {
  badgeDepthRatio: 28 / (116 * .72),
  badgeGap: 2.5,
  badgeScaleRatio: 5 / 24,
  badgeUpperRightAngle: -Math.PI / 4,
  referenceHeadScale: .72
} as const

const projectEntityPoint = (
  point: Readonly<{ x: number; y: number; z: number }>,
  pose: Pick<AvatarViewState, 'pitch' | 'yaw'>
) => {
  const cosYaw = Math.cos(pose.yaw)
  const sinYaw = Math.sin(pose.yaw)
  const yawX = point.x * cosYaw + point.z * sinYaw
  const yawDepth = -point.x * sinYaw + point.z * cosYaw
  const cosPitch = Math.cos(pose.pitch)
  const sinPitch = Math.sin(pose.pitch)
  return {
    depth: -point.y * sinPitch + yawDepth * cosPitch,
    x: yawX,
    y: point.y * cosPitch + yawDepth * sinPitch
  }
}

const unprojectEntityPoint = (
  point: Readonly<{ depth: number; x: number; y: number }>,
  pose: Pick<AvatarViewState, 'pitch' | 'yaw'>
) => {
  const cosPitch = Math.cos(pose.pitch)
  const sinPitch = Math.sin(pose.pitch)
  const localY = point.y * cosPitch - point.depth * sinPitch
  const yawDepth = point.y * sinPitch + point.depth * cosPitch
  const cosYaw = Math.cos(pose.yaw)
  const sinYaw = Math.sin(pose.yaw)
  return {
    x: point.x * cosYaw - yawDepth * sinYaw,
    y: localY,
    z: point.x * sinYaw + yawDepth * cosYaw
  }
}

export const resolveAvatarAnimationHeadLayout = (
  entityParts: readonly AvatarEntityPart[],
  viewState: Pick<AvatarViewState, 'pitch' | 'yaw'>,
  notificationPosition: AvatarNotificationPosition = 'upper-right'
): AvatarAnimationHeadLayout | null => {
  const head = entityParts.find(part => part.face) ?? entityParts[0]
  if (head == null) return null
  const shape = getAvatarBodyCompilerShapeSpec(head.shape)
  const radiusX = shape.radiusX * head.scaleX
  const radiusY = shape.radiusY * head.scaleY
  const radiusZ = shape.radiusZ * resolveAvatarEntityPartScaleZ(head)
  const cosYaw = Math.cos(viewState.yaw)
  const sinYaw = Math.sin(viewState.yaw)
  const cosPitch = Math.cos(viewState.pitch)
  const sinPitch = Math.sin(viewState.pitch)
  const projectedRadiusX = Math.hypot(radiusX * cosYaw, radiusZ * sinYaw)
  const projectedRadiusY = Math.hypot(
    radiusY * cosPitch,
    radiusX * sinYaw * sinPitch,
    radiusZ * cosYaw * sinPitch
  )
  const projectedRadiusZ = Math.hypot(
    radiusY * sinPitch,
    radiusX * sinYaw * cosPitch,
    radiusZ * cosYaw * cosPitch
  )
  const center = projectEntityPoint(head, viewState)
  const notificationScale = clampPresetValue(
    Math.min(head.scaleX, head.scaleY) * ENTITY_MORPH_PROFILE.badgeScaleRatio,
    .08,
    .22
  )
  const badgeRadius = getAvatarBodyCompilerShapeSpec('sphere').radiusX * notificationScale
  const directionX = Math.cos(ENTITY_MORPH_PROFILE.badgeUpperRightAngle) * (
    notificationPosition === 'upper-left' ? -1 : 1
  )
  const directionY = Math.sin(ENTITY_MORPH_PROFILE.badgeUpperRightAngle)
  const headRadiusAlongAnchor = 1 / Math.sqrt(
    (directionX / projectedRadiusX) ** 2 + (directionY / projectedRadiusY) ** 2
  )
  const anchorDistance = headRadiusAlongAnchor + badgeRadius + ENTITY_MORPH_PROFILE.badgeGap
  const projectedAnchor = {
    depth: center.depth + projectedRadiusZ * ENTITY_MORPH_PROFILE.badgeDepthRatio,
    x: center.x + directionX * anchorDistance,
    y: center.y + directionY * anchorDistance
  }
  const anchor = unprojectEntityPoint(projectedAnchor, viewState)
  return {
    badgeRadius,
    headPartId: head.id,
    headProjectedCenter: { x: center.x, y: center.y },
    headProjectedRadius: { x: projectedRadiusX, y: projectedRadiusY, z: projectedRadiusZ },
    notificationAnchor: {
      gap: ENTITY_MORPH_PROFILE.badgeGap,
      projectedX: projectedAnchor.x,
      projectedY: projectedAnchor.y,
      ...anchor
    },
    notificationScale
  }
}

const buildPresetFrames = (
  id: AvatarAnimationPresetId,
  viewState: AvatarViewState,
  faceStyle: AvatarFaceStyle,
  entityParts: readonly AvatarEntityPart[] = [],
  parameterValues: AvatarAnimationParameterValues = {}
): readonly StoredAvatarAnimationKeyframe[] => {
  const closedEyeHeight = clampPresetValue(faceStyle.height * .16, 7, 14)
  const relaxedEyeHeight = clampPresetValue(faceStyle.height * .78, 18, 104)
  const focusedEyeHeight = clampPresetValue(faceStyle.height * .58, 14, 88)
  const wideEyeHeight = clampPresetValue(faceStyle.height + 20, 28, 112)
  const wideEyeWidth = clampPresetValue(faceStyle.width + 10, 18, 76)
  const focusedFace: Partial<AvatarFaceStyle> = {
    gap: clampPresetValue(faceStyle.gap + 4, 0, 100),
    height: focusedEyeHeight,
    eyeShape: 'rounded',
    mouthEnabled: false,
    width: clampPresetValue(faceStyle.width * .9, 12, 72)
  }
  const happyFace: Partial<AvatarFaceStyle> = {
    height: relaxedEyeHeight,
    mouthCurve: 82,
    mouthEnabled: true,
    mouthWidth: clampPresetValue(Math.max(faceStyle.mouthWidth, 62), 24, 100)
  }
  const excitedFace: Partial<AvatarFaceStyle> = {
    gap: clampPresetValue(faceStyle.gap + 6, 0, 100),
    height: wideEyeHeight,
    eyeShape: 'rounded',
    mouthEnabled: false,
    width: wideEyeWidth
  }
  const surprisedFace: Partial<AvatarFaceStyle> = {
    gap: clampPresetValue(faceStyle.gap + 10, 0, 100),
    height: wideEyeHeight,
    eyeShape: 'rounded',
    mouthEnabled: false,
    width: wideEyeWidth
  }
  const sadFace: Partial<AvatarFaceStyle> = {
    height: clampPresetValue(faceStyle.height * .56, 12, 76),
    leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation + 7, -90, 90),
    mouthEnabled: false,
    rotation: clampPresetValue(faceStyle.rotation - 5, -90, 90),
    rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation - 7, -90, 90)
  }
  const laughingFace: Partial<AvatarFaceStyle> = {
    height: clampPresetValue(closedEyeHeight * 1.35, 9, 20),
    mouthCurve: 100,
    mouthEnabled: true,
    mouthHeight: clampPresetValue(faceStyle.mouthHeight + 5, 8, 30),
    mouthWidth: clampPresetValue(Math.max(faceStyle.mouthWidth, 74), 24, 100),
    rotation: 0
  }
  const angryFace: Partial<AvatarFaceStyle> = {
    gap: clampPresetValue(faceStyle.gap + 6, 0, 100),
    height: clampPresetValue(faceStyle.height * .58, 12, 74),
    leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation - 18, -90, 90),
    mouthEnabled: false,
    rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation + 18, -90, 90),
    width: clampPresetValue(faceStyle.width * 1.08, 12, 76)
  }

  const redHotGrade: Partial<AvatarColorGrade> = {
    brightness: 1.08,
    saturation: 1.55,
    tintAmount: .68,
    tintB: 22,
    tintG: 43,
    tintR: 255
  }
  const shockedGrade: Partial<AvatarColorGrade> = {
    brightness: 1.34,
    saturation: .72,
    tintAmount: .48,
    tintB: 255,
    tintG: 242,
    tintR: 218
  }
  const petrifiedGrade: Partial<AvatarColorGrade> = {
    brightness: .76,
    saturation: 0,
    tintAmount: .38,
    tintB: 117,
    tintG: 112,
    tintR: 102
  }
  const sadGrade: Partial<AvatarColorGrade> = {
    brightness: .84,
    saturation: .56,
    tintAmount: .28,
    tintB: 226,
    tintG: 146,
    tintR: 74
  }

  const animatedBearParts = Object.fromEntries(
    entityParts
      .filter(part => part.id === 'ear-left' || part.id === 'ear-right' || part.id === 'primary')
      .map(part => [part.id, part])
  ) as Readonly<Record<string, AvatarEntityPart>>
  const bearBaseTransforms = Object.fromEntries(
    Object.values(animatedBearParts).map(part => [part.id, {
      rotationZ: part.rotationZ ?? 0,
      scaleX: part.scaleX,
      scaleY: part.scaleY,
      x: part.x,
      y: part.y,
      z: part.z
    }])
  ) as AvatarEntityPartTransforms
  const bearTransform = (
    overrides: Readonly<Record<string, Partial<AvatarEntityPartTransforms[string]>>>
  ): AvatarEntityPartTransforms => Object.fromEntries(
    Object.entries(bearBaseTransforms).map(([partId, transform]) => [
      partId,
      { ...transform, ...overrides[partId] }
    ])
  )
  const scaleWithinRange = (value: number) => clampPresetValue(
    value,
    AVATAR_ANIMATION_PART_SCALE_RANGE.min,
    AVATAR_ANIMATION_PART_SCALE_RANGE.max
  )
  const primary = animatedBearParts.primary
  const leftEar = animatedBearParts['ear-left']
  const rightEar = animatedBearParts['ear-right']
  const bearMorphAvailable = primary != null && leftEar != null && rightEar != null
  const compactBear = (
    factor: number,
    targetX: number,
    targetY: number,
    ballProgress: number = 0
  ) => {
    if (!bearMorphAvailable) return bearBaseTransforms
    const mix = (from: number, to: number) => from + (to - from) * ballProgress
    const spinDegrees = 360 * ballProgress
    const spinRadians = spinDegrees * Math.PI / 180
    const cosSpin = Math.cos(spinRadians)
    const sinSpin = Math.sin(spinRadians)
    return bearTransform(Object.fromEntries(Object.values(animatedBearParts).map(part => {
      const isEar = part.id === 'ear-left' || part.id === 'ear-right'
      const relativeX = (part.x - primary.x) * factor
      const relativeY = (part.y - primary.y) * factor
      const scaledX = targetX + relativeX * cosSpin - relativeY * sinSpin
      const scaledY = targetY + relativeX * sinSpin + relativeY * cosSpin
      return [part.id, {
        rotationZ: (isEar ? mix(part.rotationZ ?? 0, 0) : part.rotationZ ?? 0) + spinDegrees,
        scaleX: scaleWithinRange(isEar ? mix(part.scaleX * factor, .01) : part.scaleX * factor),
        scaleY: scaleWithinRange(isEar ? mix(part.scaleY * factor, .01) : part.scaleY * factor),
        x: isEar ? mix(scaledX, targetX) : scaledX,
        y: isEar ? mix(scaledY, targetY) : scaledY,
        z: isEar ? mix(primary.z + (part.z - primary.z) * factor, primary.z) : primary.z
      }]
    })))
  }
  const alertGather = compactBear(.86, 0, 26, .08)
  const alertShrink = compactBear(.68, 0, 36, .25)
  const alertMorphingBear = compactBear(.38, 0, 56, .68)
  const alertCompact = compactBear(.17, 0, 70, 1)
  const alertPulse = compactBear(.15, 0, 72, 1)
  const alertStemPart: AvatarEntityPart = {
    baseColor: primary?.baseColor ?? '#e3b17f',
    face: false,
    foregroundColor: primary?.foregroundColor ?? '#2b1d18',
    highlightColor: primary?.highlightColor ?? '#f8d8ad',
    id: 'alert-stem',
    label: 'Animated alert droplet',
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    roundness: 88,
    scaleX: .16,
    scaleY: .42,
    scaleZ: .19,
    shadowColor: primary?.shadowColor ?? '#9a6346',
    shape: 'teardrop',
    x: 0,
    y: -30,
    z: 0
  }
  const createAlertPart = (
    opacity: number,
    scaleX: number,
    scaleY: number,
    x: number,
    y: number,
    rotationZ: number = 0
  ): readonly AvatarAnimationEntityPart[] => [{
    opacity,
    part: alertStemPart,
    transform: { rotationZ, scaleX, scaleY, x, y, z: 0 }
  }]
  const alertPartHidden = createAlertPart(0, .04, .04, 0, -112, 180)
  const alertPartEmerging = createAlertPart(60, .06, .055, 0, -108, 180)
  const alertBall = createAlertPart(100, .085, .078, 0, -100, 180)
  const alertMorphingPart = createAlertPart(100, .115, .22, 0, -68, 180)
  const alertDroplet = createAlertPart(100, .15, .37, 0, -40, 180)
  const alertPart = createAlertPart(100, .16, .42, 0, -34, 180)
  const alertPartPulse = createAlertPart(100, .17, .45, 0, -36, 180)
  const alertWigglePivotY = 18
  const rotateAlertPoint = (x: number, y: number, degrees: number) => {
    const radians = degrees * Math.PI / 180
    const relativeY = y - alertWigglePivotY
    return {
      x: x * Math.cos(radians) - relativeY * Math.sin(radians),
      y: alertWigglePivotY + x * Math.sin(radians) + relativeY * Math.cos(radians)
    }
  }
  const createAlertWigglePart = (degrees: number) => {
    const point = rotateAlertPoint(0, -34, degrees)
    return createAlertPart(100, .16, .42, point.x, point.y, 180 + degrees)
  }
  const createAlertWiggleBear = (degrees: number): AvatarEntityPartTransforms => {
    const radians = degrees * Math.PI / 180
    return Object.fromEntries(Object.entries(alertCompact).map(([partId, transform]) => {
      const x = transform.x ?? 0
      const y = transform.y ?? 0
      const relativeY = y - alertWigglePivotY
      return [partId, {
        ...transform,
        rotationZ: (transform.rotationZ ?? 0) + degrees,
        x: x * Math.cos(radians) - relativeY * Math.sin(radians),
        y: alertWigglePivotY + x * Math.sin(radians) + relativeY * Math.cos(radians)
      }]
    }))
  }
  const alertShapeMorphs = (bearProgress: number, stemProgress: number): AvatarEntityPartShapeMorphs => ({
    'alert-stem': { fromShape: 'sphere', progress: stemProgress, toShape: 'teardrop' },
    primary: { fromShape: primary?.shape ?? 'trapezoid', progress: bearProgress, toShape: 'sphere' }
  })
  const loadingGather = compactBear(.78, 0, 30, .15)
  const loadingBall = compactBear(.18, 0, 24, 1)
  const loadingBallLifted = compactBear(.18, 0, -8, 1)
  const createLoadingBallPart = (id: 'loading-ball-left' | 'loading-ball-right'): AvatarEntityPart => ({
    baseColor: primary?.baseColor ?? '#e3b17f',
    face: false,
    foregroundColor: primary?.foregroundColor ?? '#2b1d18',
    highlightColor: primary?.highlightColor ?? '#f8d8ad',
    id,
    label: id === 'loading-ball-left' ? 'Animated left loading ball' : 'Animated right loading ball',
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    roundness: 100,
    scaleX: .14,
    scaleY: .14,
    scaleZ: .14,
    shadowColor: primary?.shadowColor ?? '#9a6346',
    shape: 'sphere',
    x: 0,
    y: 24,
    z: 0
  })
  const loadingBallParts = {
    left: createLoadingBallPart('loading-ball-left'),
    right: createLoadingBallPart('loading-ball-right')
  }
  const createLoadingParts = (
    opacity: number,
    leftX: number,
    leftY: number,
    rightX: number,
    rightY: number,
    scale: number
  ): readonly AvatarAnimationEntityPart[] => [
    {
      opacity,
      part: loadingBallParts.left,
      transform: { rotationZ: 0, scaleX: scale, scaleY: scale, x: leftX, y: leftY, z: 0 }
    },
    {
      opacity,
      part: loadingBallParts.right,
      transform: { rotationZ: 0, scaleX: scale, scaleY: scale, x: rightX, y: rightY, z: 0 }
    }
  ]
  const loadingPartsHidden = createLoadingParts(0, -150, 30, 150, 30, .04)
  const loadingPartsEmerging = createLoadingParts(60, -128, 30, 128, 30, .08)
  const loadingPartsFrame = (liftedBall?: 'left' | 'right') => createLoadingParts(
    100,
    -68,
    liftedBall === 'left' ? -8 : 24,
    68,
    liftedBall === 'right' ? -8 : 24,
    .14
  )
  const loadingShapeMorphs = (progress: number): AvatarEntityPartShapeMorphs => ({
    primary: { fromShape: primary?.shape ?? 'trapezoid', progress, toShape: 'sphere' }
  })
  const animatedEntityParts = Object.fromEntries(
    entityParts.map(part => [part.id, part])
  ) as Readonly<Record<string, AvatarEntityPart>>
  const entityPrimary = entityParts.find(part => part.face) ?? entityParts[0]
  const entityBaseTransforms = Object.fromEntries(
    entityParts.map(part => [part.id, {
      rotationZ: part.rotationZ ?? 0,
      scaleX: part.scaleX,
      scaleY: part.scaleY,
      x: part.x,
      y: part.y,
      z: part.z
    }])
  ) as AvatarEntityPartTransforms
  const entityTransform = (
    overrides: Readonly<Record<string, Partial<AvatarEntityPartTransforms[string]>>>
  ): AvatarEntityPartTransforms => Object.fromEntries(
    Object.entries(entityBaseTransforms).map(([partId, transform]) => [
      partId,
      { ...transform, ...overrides[partId] }
    ])
  )
  const compactEntity = (
    factor: number,
    targetX: number,
    targetY: number,
    ballProgress: number = 0,
    sphericalPrimary: boolean = false
  ): AvatarEntityPartTransforms => {
    if (entityPrimary == null) return entityBaseTransforms
    const mix = (from: number, to: number) => from + (to - from) * ballProgress
    const spinDegrees = 360 * ballProgress
    const spinRadians = spinDegrees * Math.PI / 180
    const cosSpin = Math.cos(spinRadians)
    const sinSpin = Math.sin(spinRadians)
    return entityTransform(Object.fromEntries(entityParts.map(part => {
      const isPrimary = part.id === entityPrimary.id
      const relativeX = (part.x - entityPrimary.x) * factor
      const relativeY = (part.y - entityPrimary.y) * factor
      const scaledX = targetX + relativeX * cosSpin - relativeY * sinSpin
      const scaledY = targetY + relativeX * sinSpin + relativeY * cosSpin
      const primaryScaleX = part.scaleX * factor
      const primaryScaleY = part.scaleY * factor
      const sphereScale = Math.min(primaryScaleX, primaryScaleY)
      return [part.id, {
        rotationZ: (isPrimary ? part.rotationZ ?? 0 : mix(part.rotationZ ?? 0, 0)) + spinDegrees,
        scaleX: scaleWithinRange(isPrimary
          ? mix(primaryScaleX, sphericalPrimary ? sphereScale : primaryScaleX)
          : mix(primaryScaleX, .01)),
        scaleY: scaleWithinRange(isPrimary
          ? mix(primaryScaleY, sphericalPrimary ? sphereScale : primaryScaleY)
          : mix(primaryScaleY, .01)),
        x: isPrimary ? scaledX : mix(scaledX, targetX),
        y: isPrimary ? scaledY : mix(scaledY, targetY),
        z: isPrimary
          ? entityPrimary.z
          : mix(entityPrimary.z + (part.z - entityPrimary.z) * factor, entityPrimary.z)
      }]
    })))
  }
  const withAnimatedScaleZ = (transforms: AvatarEntityPartTransforms): AvatarEntityPartTransforms => (
    Object.fromEntries(Object.entries(transforms).map(([partId, transform]) => {
      const part = animatedEntityParts[partId]
      const targetScaleX = transform.scaleX ?? part?.scaleX ?? 1
      const targetScaleY = transform.scaleY ?? part?.scaleY ?? 1
      const projectionScaleX = part == null ? 1 : targetScaleX / part.scaleX
      return [partId, {
        ...transform,
        scaleZ: Math.min(targetScaleX, targetScaleY) / projectionScaleX
      }]
    }))
  )
  const primaryX = entityPrimary?.x ?? 0
  const primaryY = entityPrimary?.y ?? 20
  const entityMotionScale = entityPrimary == null
    ? 1
    : Math.min(entityPrimary.scaleX, entityPrimary.scaleY) / ENTITY_MORPH_PROFILE.referenceHeadScale
  const notificationPosition: AvatarNotificationPosition = parameterValues.orbPosition === 'upper-left'
    ? 'upper-left'
    : 'upper-right'
  const headLayout = resolveAvatarAnimationHeadLayout(entityParts, viewState, notificationPosition)
  const notificationScale = headLayout?.notificationScale ?? .15
  const notificationAnchor = headLayout?.notificationAnchor ?? {
    gap: ENTITY_MORPH_PROFILE.badgeGap,
    projectedX: notificationPosition === 'upper-left' ? -88 : 88,
    projectedY: -68,
    x: notificationPosition === 'upper-left' ? -88 : 88,
    y: -68,
    z: 28
  }
  const notificationMaterial = resolveAvatarAnimationColorMaterial(
    typeof parameterValues.orbColor === 'string' ? parameterValues.orbColor : AVATAR_NOTIFICATION_BLUE
  )
  const notificationBadgePart: AvatarEntityPart = {
    ...notificationMaterial,
    face: false,
    id: 'notification-orb',
    label: 'Animated notification badge',
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    roundness: 100,
    scaleX: notificationScale,
    scaleY: notificationScale,
    scaleZ: notificationScale,
    shape: 'sphere',
    x: notificationAnchor.x,
    y: notificationAnchor.y,
    z: notificationAnchor.z
  }
  const createNotificationBadge = (
    opacity: number,
    scale: number
  ): readonly AvatarAnimationEntityPart[] => [{
    composition: 'independent-depth',
    opacity,
    part: notificationBadgePart,
    transform: {
      rotationZ: 0,
      scaleX: scale,
      scaleY: scale,
      scaleZ: scale,
      x: notificationAnchor.x,
      y: notificationAnchor.y,
      z: notificationAnchor.z
    }
  }]
  const notificationBadgeHidden = createNotificationBadge(0, .01)
  const notificationBadgeEmerging = createNotificationBadge(65, notificationScale * 2 / 3)
  const notificationBadgeOvershoot = createNotificationBadge(100, notificationScale * 1.1)
  const notificationBadgeSettle = createNotificationBadge(100, notificationScale)
  const notificationBadgePulse = createNotificationBadge(100, notificationScale * 1.05)

  const sleepGather = withAnimatedScaleZ(compactEntity(.76, primaryX, primaryY + 10 * entityMotionScale, .18, true))
  const sleepCurl = withAnimatedScaleZ(compactEntity(.4, primaryX, primaryY + 24 * entityMotionScale, .62, true))
  const sleepBall = withAnimatedScaleZ(compactEntity(.16, primaryX, primaryY + 36 * entityMotionScale, 1, true))
  const sleepFloatUp = withAnimatedScaleZ(compactEntity(.17, primaryX, primaryY + 28 * entityMotionScale, 1, true))
  const sleepFloatDown = withAnimatedScaleZ(compactEntity(.155, primaryX, primaryY + 40 * entityMotionScale, 1, true))
  const sleepShapeMorphs = (progress: number): AvatarEntityPartShapeMorphs => ({
    ...(entityPrimary == null ? {} : {
      [entityPrimary.id]: { fromShape: entityPrimary.shape, progress, toShape: 'sphere' }
    })
  })

  const burstCompress = withAnimatedScaleZ(compactEntity(.58, primaryX, primaryY + 8 * entityMotionScale, .42, true))
  const burstCore = withAnimatedScaleZ(compactEntity(.19, primaryX, primaryY + 10 * entityMotionScale, 1, true))
  const burstCoreTight = withAnimatedScaleZ(compactEntity(.17, primaryX, primaryY + 10 * entityMotionScale, 1, true))
  const burstRebound = withAnimatedScaleZ(compactEntity(1.08, primaryX, primaryY - 4 * entityMotionScale, 0, true))
  const burstSettle = withAnimatedScaleZ(compactEntity(.96, primaryX, primaryY + entityMotionScale, 0, true))
  const burstShapeMorphs = (progress: number): AvatarEntityPartShapeMorphs => ({
    ...(entityPrimary == null ? {} : {
      [entityPrimary.id]: { fromShape: entityPrimary.shape, progress, toShape: 'sphere' }
    })
  })
  const burstParticleParts: readonly AvatarEntityPart[] = [
    { id: 'burst-particle-upper-left', label: 'Animated upper-left burst particle', scale: .1 },
    { id: 'burst-particle-upper-right', label: 'Animated upper-right burst particle', scale: .075 },
    { id: 'burst-particle-lower', label: 'Animated lower burst particle', scale: .12 }
  ].map(spec => ({
    baseColor: entityPrimary?.baseColor ?? '#e3b17f',
    face: false,
    foregroundColor: entityPrimary?.foregroundColor ?? '#2b1d18',
    highlightColor: entityPrimary?.highlightColor ?? '#f8d8ad',
    id: spec.id,
    label: spec.label,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    roundness: 100,
    scaleX: clampPresetValue(
      spec.scale * entityMotionScale,
      AVATAR_ENTITY_RANGES.scaleX.min,
      AVATAR_ENTITY_RANGES.scaleX.max
    ),
    scaleY: clampPresetValue(
      spec.scale * entityMotionScale,
      AVATAR_ENTITY_RANGES.scaleY.min,
      AVATAR_ENTITY_RANGES.scaleY.max
    ),
    scaleZ: clampPresetValue(
      spec.scale * entityMotionScale,
      AVATAR_ENTITY_RANGES.scaleZ.min,
      AVATAR_ENTITY_RANGES.scaleZ.max
    ),
    shadowColor: entityPrimary?.shadowColor ?? '#9a6346',
    shape: 'sphere',
    x: primaryX,
    y: primaryY + 10 * entityMotionScale,
    z: (entityPrimary?.z ?? 0) + 18 * entityMotionScale
  }))
  const createBurstParticles = (
    opacity: number,
    radius: number,
    phase: number,
    scaleFactor: number
  ): readonly AvatarAnimationEntityPart[] => burstParticleParts.map((part, index) => ({
    opacity,
    part,
    transform: {
      rotationZ: phase + index * Math.PI * 2 / 3,
      scaleX: part.scaleX * scaleFactor * (1 + Math.sin(phase + index * Math.PI * 2 / 3) * .08),
      scaleY: part.scaleY * scaleFactor * (1 + Math.sin(phase + index * Math.PI * 2 / 3) * .08),
      scaleZ: (part.scaleZ ?? Math.min(part.scaleX, part.scaleY)) * scaleFactor,
      x: primaryX + Math.cos(phase + index * Math.PI * 2 / 3) * radius * entityMotionScale,
      y: primaryY + 10 * entityMotionScale + Math.sin(phase + index * Math.PI * 2 / 3) * radius * .72 * entityMotionScale,
      z: (entityPrimary?.z ?? 0) + (18 + Math.sin(phase + index * Math.PI * 2 / 3) * 9) * entityMotionScale
    }
  }))
  const burstParticlesHidden = createBurstParticles(0, 132, 0, .14)
  const burstParticlesDistant = createBurstParticles(22, 126, 0, .3)
  const burstParticlesOuterA = createBurstParticles(54, 122, .82, .52)
  const burstParticlesOuterB = createBurstParticles(82, 114, 1.68, .74)
  const burstParticlesMidA = createBurstParticles(100, 102, 2.52, 1)
  const burstParticlesMidB = createBurstParticles(100, 85, 3.36, .94)
  const burstParticlesInnerA = createBurstParticles(94, 64, 4.2, .82)
  const burstParticlesInnerB = createBurstParticles(78, 42, 5.04, .64)
  const burstParticlesConverging = createBurstParticles(44, 18, 5.78, .4)
  const burstParticlesAbsorbing = createBurstParticles(18, 6, Math.PI * 2, .22)
  const burstParticlesAbsorbed = createBurstParticles(0, 2, Math.PI * 2, .16)

  // Keep the approved bear choreography byte-identical while deriving the same semantic morph
  // from every real part for animals with a different head/appendage topology.
  const approvedBearMorph = bearMorphAvailable && entityPrimary?.id === 'primary' && entityParts.length === 3
  const morphDepth = entityPrimary?.z ?? 0
  const genericAlertGather = compactEntity(
    .86,
    primaryX,
    primaryY + 6 * entityMotionScale,
    .08
  )
  const genericAlertShrink = compactEntity(
    .68,
    primaryX,
    primaryY + 16 * entityMotionScale,
    .25
  )
  const genericAlertMorphingEntity = compactEntity(
    .38,
    primaryX,
    primaryY + 36 * entityMotionScale,
    .68
  )
  const genericAlertCompact = compactEntity(
    .17,
    primaryX,
    primaryY + 50 * entityMotionScale,
    1
  )
  const genericAlertPulse = compactEntity(
    .15,
    primaryX,
    primaryY + 52 * entityMotionScale,
    1
  )
  const genericAlertStemPart: AvatarEntityPart = {
    baseColor: entityPrimary?.baseColor ?? '#e3b17f',
    face: false,
    foregroundColor: entityPrimary?.foregroundColor ?? '#2b1d18',
    highlightColor: entityPrimary?.highlightColor ?? '#f8d8ad',
    id: 'alert-stem',
    label: 'Animated alert droplet',
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    roundness: 88,
    scaleX: scaleWithinRange(.16 * entityMotionScale),
    scaleY: scaleWithinRange(.42 * entityMotionScale),
    scaleZ: scaleWithinRange(.19 * entityMotionScale),
    shadowColor: entityPrimary?.shadowColor ?? '#9a6346',
    shape: 'teardrop',
    x: primaryX,
    y: primaryY - 50 * entityMotionScale,
    z: morphDepth
  }
  const createGenericAlertPart = (
    opacity: number,
    scaleX: number,
    scaleY: number,
    x: number,
    y: number,
    rotationZ: number = 0
  ): readonly AvatarAnimationEntityPart[] => [{
    composition: 'independent-depth',
    opacity,
    part: genericAlertStemPart,
    transform: {
      rotationZ,
      scaleX: scaleWithinRange(scaleX * entityMotionScale),
      scaleY: scaleWithinRange(scaleY * entityMotionScale),
      scaleZ: scaleWithinRange(Math.min(scaleX, scaleY) * entityMotionScale),
      x: primaryX + x * entityMotionScale,
      y: primaryY + y * entityMotionScale,
      z: morphDepth
    }
  }]
  const genericAlertPartHidden = createGenericAlertPart(0, .04, .04, 0, -132, 180)
  const genericAlertPartEmerging = createGenericAlertPart(60, .06, .055, 0, -128, 180)
  const genericAlertBall = createGenericAlertPart(100, .085, .078, 0, -120, 180)
  const genericAlertMorphingPart = createGenericAlertPart(100, .115, .22, 0, -88, 180)
  const genericAlertDroplet = createGenericAlertPart(100, .15, .37, 0, -60, 180)
  const genericAlertPart = createGenericAlertPart(100, .16, .42, 0, -54, 180)
  const genericAlertPartPulse = createGenericAlertPart(100, .17, .45, 0, -56, 180)
  const genericAlertWigglePivot = {
    x: primaryX,
    y: primaryY - 2 * entityMotionScale
  }
  const rotateGenericAlertPoint = (degrees: number) => {
    const radians = degrees * Math.PI / 180
    const x = primaryX
    const y = primaryY - 54 * entityMotionScale
    const relativeX = x - genericAlertWigglePivot.x
    const relativeY = y - genericAlertWigglePivot.y
    return {
      x: genericAlertWigglePivot.x + relativeX * Math.cos(radians) - relativeY * Math.sin(radians),
      y: genericAlertWigglePivot.y + relativeX * Math.sin(radians) + relativeY * Math.cos(radians)
    }
  }
  const createGenericAlertWigglePart = (degrees: number) => {
    const point = rotateGenericAlertPoint(degrees)
    return createGenericAlertPart(
      100,
      .16,
      .42,
      (point.x - primaryX) / entityMotionScale,
      (point.y - primaryY) / entityMotionScale,
      180 + degrees
    )
  }
  const createGenericAlertWiggleEntity = (degrees: number): AvatarEntityPartTransforms => {
    const radians = degrees * Math.PI / 180
    return Object.fromEntries(Object.entries(genericAlertCompact).map(([partId, transform]) => {
      const x = transform.x ?? primaryX
      const y = transform.y ?? primaryY
      const relativeX = x - genericAlertWigglePivot.x
      const relativeY = y - genericAlertWigglePivot.y
      return [partId, {
        ...transform,
        rotationZ: (transform.rotationZ ?? 0) + degrees,
        x: genericAlertWigglePivot.x + relativeX * Math.cos(radians) - relativeY * Math.sin(radians),
        y: genericAlertWigglePivot.y + relativeX * Math.sin(radians) + relativeY * Math.cos(radians)
      }]
    }))
  }
  const genericAlertShapeMorphs = (entityProgress: number, stemProgress: number): AvatarEntityPartShapeMorphs => ({
    'alert-stem': { fromShape: 'sphere', progress: stemProgress, toShape: 'teardrop' },
    ...(entityPrimary == null ? {} : {
      [entityPrimary.id]: { fromShape: entityPrimary.shape, progress: entityProgress, toShape: 'sphere' }
    })
  })

  const genericLoadingGather = compactEntity(
    .78,
    primaryX,
    primaryY + 10 * entityMotionScale,
    .15
  )
  const genericLoadingBall = compactEntity(
    .18,
    primaryX,
    primaryY + 4 * entityMotionScale,
    1
  )
  const genericLoadingBallLifted = compactEntity(
    .18,
    primaryX,
    primaryY - 28 * entityMotionScale,
    1
  )
  const createGenericLoadingBallPart = (
    id: 'loading-ball-left' | 'loading-ball-right'
  ): AvatarEntityPart => ({
    baseColor: entityPrimary?.baseColor ?? '#e3b17f',
    face: false,
    foregroundColor: entityPrimary?.foregroundColor ?? '#2b1d18',
    highlightColor: entityPrimary?.highlightColor ?? '#f8d8ad',
    id,
    label: id === 'loading-ball-left' ? 'Animated left loading ball' : 'Animated right loading ball',
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    roundness: 100,
    scaleX: scaleWithinRange(.14 * entityMotionScale),
    scaleY: scaleWithinRange(.14 * entityMotionScale),
    scaleZ: scaleWithinRange(.14 * entityMotionScale),
    shadowColor: entityPrimary?.shadowColor ?? '#9a6346',
    shape: 'sphere',
    x: primaryX,
    y: primaryY + 4 * entityMotionScale,
    z: morphDepth
  })
  const genericLoadingBallParts = {
    left: createGenericLoadingBallPart('loading-ball-left'),
    right: createGenericLoadingBallPart('loading-ball-right')
  }
  const createGenericLoadingParts = (
    opacity: number,
    leftX: number,
    leftY: number,
    rightX: number,
    rightY: number,
    scale: number
  ): readonly AvatarAnimationEntityPart[] => [
    {
      composition: 'independent-depth',
      opacity,
      part: genericLoadingBallParts.left,
      transform: {
        rotationZ: 0,
        scaleX: scaleWithinRange(scale * entityMotionScale),
        scaleY: scaleWithinRange(scale * entityMotionScale),
        scaleZ: scaleWithinRange(scale * entityMotionScale),
        x: primaryX + leftX * entityMotionScale,
        y: primaryY + leftY * entityMotionScale,
        z: morphDepth
      }
    },
    {
      composition: 'independent-depth',
      opacity,
      part: genericLoadingBallParts.right,
      transform: {
        rotationZ: 0,
        scaleX: scaleWithinRange(scale * entityMotionScale),
        scaleY: scaleWithinRange(scale * entityMotionScale),
        scaleZ: scaleWithinRange(scale * entityMotionScale),
        x: primaryX + rightX * entityMotionScale,
        y: primaryY + rightY * entityMotionScale,
        z: morphDepth
      }
    }
  ]
  const genericLoadingPartsHidden = createGenericLoadingParts(0, -150, 10, 150, 10, .04)
  const genericLoadingPartsEmerging = createGenericLoadingParts(60, -128, 10, 128, 10, .08)
  const genericLoadingPartsFrame = (liftedBall?: 'left' | 'right') => createGenericLoadingParts(
    100,
    -68,
    liftedBall === 'left' ? -28 : 4,
    68,
    liftedBall === 'right' ? -28 : 4,
    .14
  )
  const genericLoadingShapeMorphs = (progress: number): AvatarEntityPartShapeMorphs => ({
    ...(entityPrimary == null ? {} : {
      [entityPrimary.id]: { fromShape: entityPrimary.shape, progress, toShape: 'sphere' }
    })
  })

  const morphBaseTransforms = approvedBearMorph ? bearBaseTransforms : entityBaseTransforms
  const resolvedAlertGather = approvedBearMorph ? alertGather : genericAlertGather
  const resolvedAlertShrink = approvedBearMorph ? alertShrink : genericAlertShrink
  const resolvedAlertMorphingEntity = approvedBearMorph ? alertMorphingBear : genericAlertMorphingEntity
  const resolvedAlertCompact = approvedBearMorph ? alertCompact : genericAlertCompact
  const resolvedAlertPulse = approvedBearMorph ? alertPulse : genericAlertPulse
  const resolvedAlertPartHidden = approvedBearMorph ? alertPartHidden : genericAlertPartHidden
  const resolvedAlertPartEmerging = approvedBearMorph ? alertPartEmerging : genericAlertPartEmerging
  const resolvedAlertBall = approvedBearMorph ? alertBall : genericAlertBall
  const resolvedAlertMorphingPart = approvedBearMorph ? alertMorphingPart : genericAlertMorphingPart
  const resolvedAlertDroplet = approvedBearMorph ? alertDroplet : genericAlertDroplet
  const resolvedAlertPart = approvedBearMorph ? alertPart : genericAlertPart
  const resolvedAlertPartPulse = approvedBearMorph ? alertPartPulse : genericAlertPartPulse
  const resolveAlertWigglePart = approvedBearMorph ? createAlertWigglePart : createGenericAlertWigglePart
  const resolveAlertWiggleEntity = approvedBearMorph ? createAlertWiggleBear : createGenericAlertWiggleEntity
  const resolveAlertShapeMorphs = approvedBearMorph ? alertShapeMorphs : genericAlertShapeMorphs
  const resolvedLoadingGather = approvedBearMorph ? loadingGather : genericLoadingGather
  const resolvedLoadingBall = approvedBearMorph ? loadingBall : genericLoadingBall
  const resolvedLoadingBallLifted = approvedBearMorph ? loadingBallLifted : genericLoadingBallLifted
  const resolvedLoadingPartsHidden = approvedBearMorph ? loadingPartsHidden : genericLoadingPartsHidden
  const resolvedLoadingPartsEmerging = approvedBearMorph ? loadingPartsEmerging : genericLoadingPartsEmerging
  const resolveLoadingPartsFrame = approvedBearMorph ? loadingPartsFrame : genericLoadingPartsFrame
  const resolveLoadingShapeMorphs = approvedBearMorph ? loadingShapeMorphs : genericLoadingShapeMorphs
  const alertFace: Partial<AvatarFaceStyle> = {
    height: clampPresetValue(faceStyle.height * .86, 18, 92),
    leftEyeHeight: clampPresetValue((faceStyle.leftEyeHeight ?? faceStyle.height) * .86, 18, 92),
    rightEyeHeight: clampPresetValue((faceStyle.rightEyeHeight ?? faceStyle.height) * .86, 18, 92)
  }
  const loadingFace: Partial<AvatarFaceStyle> = {
    gap: clampPresetValue(faceStyle.gap * .72, 12, 42),
    height: clampPresetValue(faceStyle.height * .72, 12, 42),
    leftEyeHeight: clampPresetValue((faceStyle.leftEyeHeight ?? faceStyle.height) * .72, 12, 42),
    leftEyeWidth: clampPresetValue((faceStyle.leftEyeWidth ?? faceStyle.width) * .72, 10, 36),
    noseHeight: clampPresetValue(faceStyle.noseHeight * .74, 6, 24),
    noseWidth: clampPresetValue(faceStyle.noseWidth * .74, 6, 26),
    rightEyeHeight: clampPresetValue((faceStyle.rightEyeHeight ?? faceStyle.height) * .72, 12, 42),
    rightEyeWidth: clampPresetValue((faceStyle.rightEyeWidth ?? faceStyle.width) * .72, 10, 36),
    width: clampPresetValue(faceStyle.width * .72, 10, 36)
  }
  const sleepFace: Partial<AvatarFaceStyle> = {
    gap: 0,
    height: 1,
    leftEyeHeight: 1,
    leftEyeWidth: 1,
    mouthHeight: 4,
    mouthWidth: 12,
    noseHeight: 6,
    noseWidth: 6,
    rightEyeHeight: 1,
    rightEyeWidth: 1,
    width: 1
  }
  const burstCoreFace: Partial<AvatarFaceStyle> = {
    gap: 0,
    height: 2,
    leftEyeHeight: 2,
    leftEyeWidth: 2,
    mouthHeight: 4,
    mouthWidth: 12,
    noseHeight: 6,
    noseWidth: 6,
    rightEyeHeight: 2,
    rightEyeWidth: 2,
    width: 2
  }
  const burstRecoverFace: Partial<AvatarFaceStyle> = {
    gap: clampPresetValue(faceStyle.gap * .9, 4, 48),
    height: clampPresetValue(faceStyle.height * .82, 12, 92),
    leftEyeHeight: clampPresetValue((faceStyle.leftEyeHeight ?? faceStyle.height) * .82, 12, 92),
    leftEyeWidth: clampPresetValue((faceStyle.leftEyeWidth ?? faceStyle.width) * .82, 8, 60),
    rightEyeHeight: clampPresetValue((faceStyle.rightEyeHeight ?? faceStyle.height) * .82, 12, 92),
    rightEyeWidth: clampPresetValue((faceStyle.rightEyeWidth ?? faceStyle.width) * .82, 8, 60),
    width: clampPresetValue(faceStyle.width * .82, 8, 60)
  }

  const framesByPreset: Readonly<Record<AvatarAnimationPresetId, readonly AvatarPresetFrame[]>> = {
    angry: [
      { offset: 0 },
      { colorGrade: { ...redHotGrade, tintAmount: .32 }, faceStyle: angryFace, offset: .15, pitch: -.03, positionX: -4, yaw: -.05 },
      { colorGrade: redHotGrade, faceStyle: angryFace, offset: .32, pitch: .04, positionX: 6, positionY: -4, yaw: .06 },
      { colorGrade: { ...redHotGrade, brightness: 1.18, tintAmount: .82 }, faceStyle: angryFace, offset: .49, pitch: -.04, positionX: -6, yaw: -.07 },
      { colorGrade: redHotGrade, faceStyle: angryFace, offset: .66, pitch: .04, positionX: 5, positionY: -3, yaw: .06 },
      { colorGrade: { ...redHotGrade, tintAmount: .38 }, faceStyle: angryFace, offset: .84, pitch: -.02, positionX: -2 },
      { offset: 1 }
    ],
    blink: [
      { offset: 0 },
      { faceStyle: { height: relaxedEyeHeight }, offset: .24 },
      { faceStyle: { height: closedEyeHeight }, offset: .43 },
      { faceStyle: { height: closedEyeHeight }, offset: .57 },
      { faceStyle: { height: relaxedEyeHeight }, offset: .76 },
      { offset: 1 }
    ],
    bored: [
      { offset: 0 },
      {
        faceStyle: {
          height: clampPresetValue(faceStyle.height * .3, 10, 36),
          mouthCurve: -12,
          mouthEnabled: true,
          mouthWidth: 42,
          rotation: clampPresetValue(faceStyle.rotation - 4, -90, 90)
        },
        offset: .18,
        pitch: .08,
        positionY: 4,
        yaw: -.1
      },
      {
        faceStyle: {
          height: clampPresetValue(faceStyle.height * .25, 8, 30),
          mouthCurve: -24,
          mouthEnabled: true,
          mouthWidth: 46,
          rotation: clampPresetValue(faceStyle.rotation + 3, -90, 90)
        },
        offset: .72,
        pitch: .12,
        positionY: 7,
        yaw: .1
      },
      { offset: 1 }
    ],
    celebrate: [
      { offset: 0 },
      { faceStyle: excitedFace, offset: .12, pitch: -.1, positionX: -12, positionY: -24, yaw: -.18 },
      { faceStyle: happyFace, offset: .25, pitch: .05, positionX: 8, positionY: 4, yaw: .1 },
      { faceStyle: excitedFace, offset: .38, pitch: -.12, positionX: 18, positionY: -28, yaw: .24 },
      { faceStyle: happyFace, offset: .5, pitch: .05, positionX: -6, positionY: 3, yaw: -.08 },
      { faceStyle: excitedFace, offset: .64, pitch: -.1, positionX: -18, positionY: -24, yaw: -.24 },
      { faceStyle: happyFace, offset: .78, pitch: .04, positionX: 5, positionY: -3, yaw: .07 },
      { faceStyle: excitedFace, offset: .9, pitch: -.06, positionY: -12 },
      { offset: 1 }
    ],
    curious: [
      { offset: 0 },
      {
        faceStyle: {
          gap: clampPresetValue(faceStyle.gap + 10, 0, 100),
          height: wideEyeHeight,
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation - 12, -90, 90),
          mouthCurve: 12,
          mouthEnabled: true,
          mouthWidth: 30,
          rotation: clampPresetValue(faceStyle.rotation - 5, -90, 90),
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation + 5, -90, 90),
          width: wideEyeWidth
        },
        offset: .24,
        pitch: -.12,
        positionX: 4,
        positionY: -4,
        yaw: .2
      },
      {
        faceStyle: {
          gap: clampPresetValue(faceStyle.gap + 8, 0, 100),
          height: clampPresetValue(wideEyeHeight * .93, 28, 112),
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation + 5, -90, 90),
          mouthCurve: 22,
          mouthEnabled: true,
          mouthRotation: 7,
          mouthWidth: 34,
          rotation: clampPresetValue(faceStyle.rotation + 4, -90, 90),
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation - 10, -90, 90),
          width: wideEyeWidth
        },
        offset: .7,
        pitch: -.08,
        positionX: -3,
        positionY: -2,
        yaw: -.12
      },
      { offset: 1 }
    ],
    excited: [
      { offset: 0 },
      { faceStyle: excitedFace, offset: .12, pitch: -.08, positionY: -20, yaw: -.08 },
      { faceStyle: happyFace, offset: .25, pitch: .05, positionY: 5, yaw: .07 },
      { faceStyle: excitedFace, offset: .39, pitch: -.1, positionY: -24, yaw: .12 },
      { faceStyle: happyFace, offset: .53, pitch: .05, positionY: 5, yaw: -.08 },
      { faceStyle: excitedFace, offset: .68, pitch: -.08, positionY: -18, yaw: .06 },
      { faceStyle: happyFace, offset: .84, pitch: .02, positionY: 2 },
      { offset: 1 }
    ],
    happy: [
      { offset: 0 },
      { faceStyle: happyFace, offset: .18, pitch: -.04, positionY: -8, yaw: -.06 },
      { faceStyle: happyFace, offset: .48, pitch: .025, positionY: 1, yaw: .05 },
      { faceStyle: { ...happyFace, height: closedEyeHeight * 1.4 }, offset: .58, positionY: -2 },
      { faceStyle: happyFace, offset: .68, positionY: -5, yaw: -.03 },
      { faceStyle: happyFace, offset: .86, pitch: .015, positionY: 0 },
      { offset: 1 }
    ],
    idle: [
      { offset: 0 },
      { faceStyle: { rotation: faceStyle.rotation - 1 }, offset: .2, pitch: -.016, positionY: -2, yaw: .038 },
      { faceStyle: { rotation: faceStyle.rotation + 1 }, offset: .42, pitch: .014, positionY: 1, yaw: -.046 },
      {
        faceStyle: { height: relaxedEyeHeight },
        offset: .46,
        pitch: -.006,
        positionY: -1,
        yaw: -.02
      },
      { faceStyle: { height: closedEyeHeight }, offset: .5, positionY: -1, yaw: -.015 },
      { faceStyle: { height: relaxedEyeHeight }, offset: .54, positionY: -1, yaw: -.01 },
      { offset: .72, pitch: -.01, positionY: -2, yaw: .025 },
      { offset: .88, pitch: .008, positionY: 1, yaw: -.018 },
      { offset: 1 }
    ],
    laughing: [
      { offset: 0 },
      { faceStyle: laughingFace, offset: .14, pitch: -.08, positionY: -12, yaw: -.06 },
      { faceStyle: laughingFace, offset: .28, pitch: .06, positionY: 5, yaw: .05 },
      { faceStyle: laughingFace, offset: .43, pitch: -.1, positionY: -15, yaw: .08 },
      { faceStyle: laughingFace, offset: .58, pitch: .06, positionY: 5, yaw: -.06 },
      { faceStyle: laughingFace, offset: .74, pitch: -.08, positionY: -11, yaw: .04 },
      { faceStyle: happyFace, offset: .88, pitch: .02, positionY: 0 },
      { offset: 1 }
    ],
    listening: [
      { offset: 0 },
      {
        faceStyle: {
          gap: clampPresetValue(faceStyle.gap + 5, 0, 100),
          height: clampPresetValue(faceStyle.height * .92, 18, 104),
          mouthCurve: 18,
          mouthEnabled: true,
          mouthWidth: 32
        },
        offset: .22,
        pitch: -.035,
        positionY: -2,
        yaw: .08
      },
      {
        faceStyle: { height: closedEyeHeight, mouthCurve: 18, mouthEnabled: true, mouthWidth: 32 },
        offset: .48,
        pitch: -.02,
        yaw: .05
      },
      {
        faceStyle: {
          gap: clampPresetValue(faceStyle.gap + 5, 0, 100),
          height: clampPresetValue(faceStyle.height * .92, 18, 104),
          mouthCurve: 18,
          mouthEnabled: true,
          mouthWidth: 32
        },
        offset: .54,
        yaw: .04
      },
      { offset: .78, pitch: .02, positionY: 1, yaw: -.05 },
      { offset: 1 }
    ],
    nod: [
      { offset: 0 },
      { offset: .18, pitch: .04, positionY: 1 },
      { offset: .34, pitch: .18, positionY: 5 },
      { offset: .5, pitch: -.055, positionY: -2 },
      { offset: .68, pitch: .105, positionY: 3 },
      { offset: .84, pitch: -.025, positionY: -1 },
      { offset: 1 }
    ],
    playful: [
      { offset: 0 },
      {
        faceStyle: {
          ...happyFace,
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation + 14, -90, 90),
          mouthRotation: -8,
          mouthWidth: 54,
          rotation: clampPresetValue(faceStyle.rotation + 8, -90, 90),
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation - 5, -90, 90)
        },
        offset: .2,
        pitch: -.08,
        positionX: -4,
        positionY: -6,
        yaw: -.18
      },
      {
        faceStyle: {
          ...happyFace,
          height: closedEyeHeight * 1.45,
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation - 5, -90, 90),
          mouthRotation: 7,
          mouthWidth: 58,
          rotation: clampPresetValue(faceStyle.rotation - 7, -90, 90),
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation + 13, -90, 90)
        },
        offset: .48,
        pitch: .04,
        positionX: 4,
        positionY: 2,
        yaw: .15
      },
      {
        faceStyle: {
          ...happyFace,
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation + 7, -90, 90),
          mouthRotation: -4,
          rotation: faceStyle.rotation + 4,
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation - 3, -90, 90)
        },
        offset: .74,
        pitch: -.04,
        positionX: -2,
        positionY: -3,
        yaw: -.1
      },
      { offset: 1 }
    ],
    sad: [
      { offset: 0 },
      { colorGrade: { ...sadGrade, tintAmount: .16 }, faceStyle: sadFace, offset: .22, pitch: .1, positionY: 6, yaw: -.06 },
      { colorGrade: sadGrade, faceStyle: { ...sadFace, height: closedEyeHeight * 1.5 }, offset: .48, pitch: .12, positionY: 8 },
      { colorGrade: sadGrade, faceStyle: sadFace, offset: .56, pitch: .11, positionY: 7, yaw: .04 },
      { colorGrade: { ...sadGrade, tintAmount: .18 }, faceStyle: sadFace, offset: .8, pitch: .08, positionY: 5, yaw: -.03 },
      { offset: 1 }
    ],
    shocked: [
      { offset: 0 },
      { colorGrade: { ...shockedGrade, tintAmount: .2 }, faceStyle: { height: closedEyeHeight }, offset: .14, pitch: .04 },
      { colorGrade: shockedGrade, faceStyle: surprisedFace, offset: .27, pitch: -.18, positionY: -20, yaw: -.05 },
      { colorGrade: { ...shockedGrade, brightness: 1.5, tintAmount: .65 }, faceStyle: surprisedFace, offset: .42, pitch: -.14, positionY: -15, yaw: .06 },
      { colorGrade: shockedGrade, faceStyle: surprisedFace, offset: .7, pitch: -.1, positionY: -10 },
      { colorGrade: { ...shockedGrade, tintAmount: .18 }, faceStyle: { ...surprisedFace, height: wideEyeHeight * .9 }, offset: .86, positionY: -4 },
      { offset: 1 }
    ],
    petrified: [
      { offset: 0 },
      { colorGrade: { ...petrifiedGrade, saturation: .55, tintAmount: .16 }, faceStyle: surprisedFace, offset: .2, pitch: -.05, positionY: -4 },
      { colorGrade: petrifiedGrade, faceStyle: { ...surprisedFace, mouthHeight: 13, mouthWidth: 13 }, offset: .44, pitch: -.08, positionY: -7 },
      { colorGrade: { ...petrifiedGrade, brightness: .66, tintAmount: .52 }, faceStyle: { ...surprisedFace, mouthHeight: 12, mouthWidth: 12 }, offset: .72, pitch: -.08, positionY: -7 },
      { colorGrade: petrifiedGrade, faceStyle: surprisedFace, offset: .88, pitch: -.05, positionY: -4 },
      { offset: 1 }
    ],
    searching: [
      { offset: 0 },
      { faceStyle: focusedFace, offset: .15, pitch: -.05, positionX: -3, yaw: -.22 },
      { faceStyle: { ...focusedFace, rotation: faceStyle.rotation - 6 }, offset: .34, yaw: -.3 },
      { faceStyle: focusedFace, offset: .5, pitch: -.02, positionX: 2, yaw: .06 },
      { faceStyle: { ...focusedFace, rotation: faceStyle.rotation + 6 }, offset: .68, yaw: .3 },
      { faceStyle: focusedFace, offset: .85, pitch: -.05, positionX: -1, yaw: .16 },
      { offset: 1 }
    ],
    surprised: [
      { offset: 0 },
      { faceStyle: { height: closedEyeHeight }, offset: .18, pitch: .04 },
      { faceStyle: surprisedFace, offset: .31, pitch: -.12, positionY: -14, yaw: -.04 },
      { faceStyle: surprisedFace, offset: .66, pitch: -.1, positionY: -10, yaw: .04 },
      { faceStyle: { ...surprisedFace, height: wideEyeHeight * .9 }, offset: .84, positionY: -4 },
      { offset: 1 }
    ],
    thinking: [
      { offset: 0 },
      {
        faceStyle: {
          gap: clampPresetValue(faceStyle.gap + 7, 0, 100),
          height: focusedEyeHeight,
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation - 11, -90, 90),
          mouthCurve: 8,
          mouthEnabled: true,
          rotation: clampPresetValue(faceStyle.rotation - 7, -90, 90),
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation + 4, -90, 90)
        },
        offset: .18,
        pitch: -.11,
        positionX: 3,
        positionY: -4,
        yaw: .16
      },
      {
        faceStyle: {
          gap: clampPresetValue(faceStyle.gap + 4, 0, 100),
          height: clampPresetValue(focusedEyeHeight * .9, 12, 104),
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation - 6, -90, 90),
          mouthCurve: -6,
          mouthEnabled: true,
          rotation: clampPresetValue(faceStyle.rotation - 4, -90, 90),
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation + 9, -90, 90)
        },
        offset: .48,
        pitch: -.15,
        positionX: 5,
        positionY: -5,
        yaw: .22
      },
      {
        faceStyle: {
          gap: clampPresetValue(faceStyle.gap + 7, 0, 100),
          height: focusedEyeHeight,
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation - 11, -90, 90),
          mouthCurve: 8,
          mouthEnabled: true,
          rotation: clampPresetValue(faceStyle.rotation - 7, -90, 90),
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation + 4, -90, 90)
        },
        offset: .74,
        pitch: -.1,
        positionX: 2,
        positionY: -3,
        yaw: .14
      },
      { faceStyle: { height: closedEyeHeight }, offset: .88, pitch: -.04, yaw: .06 },
      { offset: 1 }
    ],
    wink: [
      { offset: 0 },
      {
        faceStyle: {
          leftEyeHeight: relaxedEyeHeight,
          mouthCurve: 38,
          mouthEnabled: true,
          mouthWidth: clampPresetValue(Math.max(faceStyle.mouthWidth, 42), 24, 100),
          rightEyeHeight: relaxedEyeHeight
        },
        offset: .2,
        yaw: -.025
      },
      {
        faceStyle: {
          leftEyeHeight: closedEyeHeight,
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation - 5, -90, 90),
          mouthCurve: 72,
          mouthEnabled: true,
          mouthWidth: clampPresetValue(Math.max(faceStyle.mouthWidth, 52), 24, 100),
          rightEyeHeight: relaxedEyeHeight,
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation + 3, -90, 90)
        },
        offset: .4,
        pitch: -.025,
        yaw: -.055
      },
      {
        faceStyle: {
          leftEyeHeight: closedEyeHeight,
          leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation - 5, -90, 90),
          mouthCurve: 72,
          mouthEnabled: true,
          mouthWidth: clampPresetValue(Math.max(faceStyle.mouthWidth, 52), 24, 100),
          rightEyeHeight: relaxedEyeHeight,
          rightEyeRotation: clampPresetValue(faceStyle.rightEyeRotation + 3, -90, 90)
        },
        offset: .6,
        pitch: -.025,
        yaw: -.055
      },
      {
        faceStyle: {
          leftEyeHeight: relaxedEyeHeight,
          mouthCurve: 38,
          mouthEnabled: true,
          mouthWidth: clampPresetValue(Math.max(faceStyle.mouthWidth, 42), 24, 100),
          rightEyeHeight: relaxedEyeHeight
        },
        offset: .8,
        yaw: -.025
      },
      { offset: 1 }
    ],
    working: [
      { offset: 0 },
      { faceStyle: focusedFace, offset: .18, pitch: .035, positionY: 2, yaw: -.05 },
      { faceStyle: focusedFace, offset: .42, pitch: -.025, positionY: -2, yaw: .045 },
      { faceStyle: { ...focusedFace, height: closedEyeHeight }, offset: .48, pitch: -.015, yaw: .03 },
      { faceStyle: focusedFace, offset: .54, pitch: -.01, positionY: -1, yaw: .02 },
      { faceStyle: focusedFace, offset: .78, pitch: .03, positionY: 2, yaw: -.04 },
      { offset: 1 }
    ],
    'bear-alert-morph': [
      { auxiliaryParts: resolvedAlertPartHidden, offset: 0, partShapeMorphs: resolveAlertShapeMorphs(0, 0), partTransforms: morphBaseTransforms },
      { auxiliaryParts: resolvedAlertPartEmerging, easing: 'ease-in', faceStyle: alertFace, offset: .08, partShapeMorphs: resolveAlertShapeMorphs(.08, 0), partTransforms: resolvedAlertGather },
      { auxiliaryParts: resolvedAlertBall, easing: 'linear', faceStyle: alertFace, offset: .18, partShapeMorphs: resolveAlertShapeMorphs(.25, 0), partTransforms: resolvedAlertShrink },
      { auxiliaryParts: resolvedAlertMorphingPart, easing: 'linear', faceStyle: alertFace, offset: .31, partShapeMorphs: resolveAlertShapeMorphs(.68, .55), partTransforms: resolvedAlertMorphingEntity },
      { auxiliaryParts: resolvedAlertDroplet, easing: 'linear', faceStyle: alertFace, offset: .42, partShapeMorphs: resolveAlertShapeMorphs(1, 1), partTransforms: resolvedAlertCompact },
      { auxiliaryParts: resolvedAlertPartPulse, easing: 'ease-out', faceStyle: alertFace, offset: .48, partShapeMorphs: resolveAlertShapeMorphs(1, 1), partTransforms: resolvedAlertPulse },
      { auxiliaryParts: resolvedAlertPart, easing: 'ease-out', faceStyle: alertFace, offset: .54, partShapeMorphs: resolveAlertShapeMorphs(1, 1), partTransforms: resolvedAlertCompact },
      { auxiliaryParts: resolveAlertWigglePart(9), easing: 'linear', faceStyle: alertFace, offset: .59, partShapeMorphs: resolveAlertShapeMorphs(1, 1), partTransforms: resolveAlertWiggleEntity(9) },
      { auxiliaryParts: resolveAlertWigglePart(-7), easing: 'linear', faceStyle: alertFace, offset: .64, partShapeMorphs: resolveAlertShapeMorphs(1, 1), partTransforms: resolveAlertWiggleEntity(-7) },
      { auxiliaryParts: resolveAlertWigglePart(5), easing: 'linear', faceStyle: alertFace, offset: .68, partShapeMorphs: resolveAlertShapeMorphs(1, 1), partTransforms: resolveAlertWiggleEntity(5) },
      { auxiliaryParts: resolveAlertWigglePart(-3), easing: 'linear', faceStyle: alertFace, offset: .72, partShapeMorphs: resolveAlertShapeMorphs(1, 1), partTransforms: resolveAlertWiggleEntity(-3) },
      { auxiliaryParts: resolvedAlertPart, easing: 'ease-out', faceStyle: alertFace, offset: .75, partShapeMorphs: resolveAlertShapeMorphs(1, 1), partTransforms: resolvedAlertCompact },
      { auxiliaryParts: resolvedAlertMorphingPart, easing: 'linear', faceStyle: alertFace, offset: .86, partShapeMorphs: resolveAlertShapeMorphs(.68, .55), partTransforms: resolvedAlertMorphingEntity },
      { auxiliaryParts: resolvedAlertPartEmerging, easing: 'linear', faceStyle: alertFace, offset: .95, partShapeMorphs: resolveAlertShapeMorphs(.08, 0), partTransforms: resolvedAlertGather },
      { auxiliaryParts: resolvedAlertPartHidden, easing: 'ease-out', offset: 1, partShapeMorphs: resolveAlertShapeMorphs(0, 0), partTransforms: morphBaseTransforms }
    ],
    'bear-loading-morph': [
      { auxiliaryParts: resolvedLoadingPartsHidden, offset: 0, partShapeMorphs: resolveLoadingShapeMorphs(0), partTransforms: morphBaseTransforms },
      { auxiliaryParts: resolvedLoadingPartsEmerging, easing: 'ease-in', faceStyle: loadingFace, offset: .1, partShapeMorphs: resolveLoadingShapeMorphs(.15), partTransforms: resolvedLoadingGather },
      { auxiliaryParts: resolveLoadingPartsFrame(), easing: 'linear', faceStyle: loadingFace, offset: .22, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame('left'), faceStyle: loadingFace, offset: .32, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame(), faceStyle: loadingFace, offset: .38, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame(), faceStyle: loadingFace, offset: .44, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBallLifted },
      { auxiliaryParts: resolveLoadingPartsFrame(), faceStyle: loadingFace, offset: .5, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame('right'), faceStyle: loadingFace, offset: .56, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame(), faceStyle: loadingFace, offset: .62, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame('left'), faceStyle: loadingFace, offset: .68, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame(), faceStyle: loadingFace, offset: .74, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame(), faceStyle: loadingFace, offset: .8, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBallLifted },
      { auxiliaryParts: resolveLoadingPartsFrame('right'), faceStyle: loadingFace, offset: .86, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolveLoadingPartsFrame(), faceStyle: loadingFace, offset: .9, partShapeMorphs: resolveLoadingShapeMorphs(1), partTransforms: resolvedLoadingBall },
      { auxiliaryParts: resolvedLoadingPartsEmerging, easing: 'linear', faceStyle: loadingFace, offset: .96, partShapeMorphs: resolveLoadingShapeMorphs(.15), partTransforms: resolvedLoadingGather },
      { auxiliaryParts: resolvedLoadingPartsHidden, easing: 'ease-out', offset: 1, partShapeMorphs: resolveLoadingShapeMorphs(0), partTransforms: morphBaseTransforms }
    ],
    'bear-notification-morph': [
      { auxiliaryParts: notificationBadgeHidden, offset: 0 },
      { auxiliaryParts: notificationBadgeEmerging, easing: 'ease-in', offset: .14 },
      { auxiliaryParts: notificationBadgeOvershoot, easing: 'ease-out', offset: .28 },
      { auxiliaryParts: notificationBadgeSettle, easing: 'ease-out', offset: .42 },
      { auxiliaryParts: notificationBadgePulse, easing: 'ease-in-out', offset: .58 },
      { auxiliaryParts: notificationBadgeSettle, easing: 'ease-out', offset: .7 },
      { auxiliaryParts: notificationBadgeEmerging, easing: 'linear', offset: .84 },
      { auxiliaryParts: notificationBadgeHidden, easing: 'ease-out', offset: 1 }
    ],
    'bear-sleep-morph': [
      { offset: 0, partShapeMorphs: sleepShapeMorphs(0), partTransforms: entityBaseTransforms },
      { easing: 'ease-in', faceStyle: sleepFace, offset: .14, partShapeMorphs: sleepShapeMorphs(.18), partTransforms: sleepGather },
      { easing: 'linear', faceStyle: sleepFace, offset: .3, partShapeMorphs: sleepShapeMorphs(.62), partTransforms: sleepCurl },
      { easing: 'ease-out', faceStyle: sleepFace, offset: .42, partShapeMorphs: sleepShapeMorphs(1), partTransforms: sleepBall },
      { faceStyle: sleepFace, offset: .55, partShapeMorphs: sleepShapeMorphs(1), partTransforms: sleepFloatUp },
      { faceStyle: sleepFace, offset: .68, partShapeMorphs: sleepShapeMorphs(1), partTransforms: sleepFloatDown },
      { faceStyle: sleepFace, offset: .79, partShapeMorphs: sleepShapeMorphs(1), partTransforms: sleepFloatUp },
      { faceStyle: sleepFace, offset: .86, partShapeMorphs: sleepShapeMorphs(1), partTransforms: sleepBall },
      { easing: 'linear', faceStyle: sleepFace, offset: .94, partShapeMorphs: sleepShapeMorphs(.62), partTransforms: sleepCurl },
      { easing: 'ease-out', offset: 1, partShapeMorphs: sleepShapeMorphs(0), partTransforms: entityBaseTransforms }
    ],
    'bear-burst-morph': [
      { auxiliaryParts: burstParticlesHidden, offset: 0, partShapeMorphs: burstShapeMorphs(0), partTransforms: entityBaseTransforms },
      { auxiliaryParts: burstParticlesHidden, easing: 'ease-in', faceStyle: burstRecoverFace, offset: .07, partShapeMorphs: burstShapeMorphs(.42), partTransforms: burstCompress },
      { auxiliaryParts: burstParticlesDistant, easing: 'linear', faceStyle: burstCoreFace, offset: .14, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCore },
      { auxiliaryParts: burstParticlesOuterA, easing: 'linear', faceStyle: burstCoreFace, offset: .24, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCoreTight },
      { auxiliaryParts: burstParticlesOuterB, easing: 'linear', faceStyle: burstCoreFace, offset: .34, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCore },
      { auxiliaryParts: burstParticlesMidA, easing: 'linear', faceStyle: burstCoreFace, offset: .44, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCoreTight },
      { auxiliaryParts: burstParticlesMidB, easing: 'linear', faceStyle: burstCoreFace, offset: .54, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCore },
      { auxiliaryParts: burstParticlesInnerA, easing: 'linear', faceStyle: burstCoreFace, offset: .64, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCoreTight },
      { auxiliaryParts: burstParticlesInnerB, easing: 'linear', faceStyle: burstCoreFace, offset: .73, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCore },
      { auxiliaryParts: burstParticlesConverging, easing: 'linear', faceStyle: burstCoreFace, offset: .81, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCoreTight },
      { auxiliaryParts: burstParticlesAbsorbing, easing: 'ease-in', faceStyle: burstCoreFace, offset: .86, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCore },
      { auxiliaryParts: burstParticlesAbsorbed, easing: 'ease-in', faceStyle: burstCoreFace, offset: .89, partShapeMorphs: burstShapeMorphs(1), partTransforms: burstCore },
      { auxiliaryParts: burstParticlesAbsorbed, easing: 'ease-out', faceStyle: burstRecoverFace, offset: .94, partShapeMorphs: burstShapeMorphs(.28), partTransforms: burstRebound },
      { auxiliaryParts: burstParticlesHidden, easing: 'ease-out', offset: .97, partShapeMorphs: burstShapeMorphs(.05), partTransforms: burstSettle },
      { auxiliaryParts: burstParticlesHidden, easing: 'ease-out', offset: 1, partShapeMorphs: burstShapeMorphs(0), partTransforms: entityBaseTransforms }
    ]
  }

  return framesByPreset[id].map(frame => createRelativePresetFrame(viewState, faceStyle, frame))
}

export const resolveAvatarAnimationPreset = (
  preset: AvatarAnimationPreset,
  viewState: AvatarViewState,
  faceStyle: AvatarFaceStyle,
  entityParts: readonly AvatarEntityPart[] = [],
  parameterOverrides: AvatarAnimationParameterValues = {}
): ResolvedAvatarAnimationPreset => {
  const parameterValues = resolveAvatarAnimationParameterValues(
    { parameters: preset.parameters },
    parameterOverrides
  )
  return {
    ...preset,
    keyframes: normalizeAvatarAnimationKeyframes(
      buildPresetFrames(preset.id, viewState, faceStyle, entityParts, parameterValues),
      preset.durationMs,
      DEFAULT_AVATAR_ANIMATION_EASING
    ),
    ...(preset.parameters == null ? {} : { parameterValues })
  }
}

const avatarAnimationValuesEqual = (left: unknown, right: unknown) => (
  JSON.stringify(left) === JSON.stringify(right)
)

/**
 * Converts editor keyframes to a core sparse clip. A field that never differs
 * from the base Definition is absent and therefore passes lower tracks through.
 * Once authored, the core runtime holds it until a later write or release.
 */
export const createAvatarAnimationRuntimeClip = (
  definition: AvatarDefinition,
  preset: ResolvedAvatarAnimationPreset
): AvatarAnimationClip => {
  const resourceAllowed = (resource: string) => (
    preset.resourceClaims == null || preset.resourceClaims.some(claim => (
      claim === resource || resource.startsWith(`${claim}.`)
    ))
  )
  const faceKeys = (Object.keys(definition.scene.face) as (keyof AvatarFaceStyle)[]).filter(key => (
    resourceAllowed(`face:${key}`) &&
    preset.keyframes.some(frame => !avatarAnimationValuesEqual(frame.faceStyle[key], definition.scene.face[key]))
  ))
  const viewKeys = (['pitch', 'positionX', 'positionY', 'yaw'] as const).filter(key => (
    resourceAllowed(`view:${key}`) &&
    preset.keyframes.some(frame => !avatarAnimationValuesEqual(frame[key], definition.scene.view[key]))
  ))
  const colorGradeKeys = (Object.keys(definition.scene.effects.colorGrade) as (keyof AvatarColorGrade)[]).filter(key => (
    resourceAllowed(`effect:colorGrade.${key}`) && preset.keyframes.some(frame => !avatarAnimationValuesEqual(
      frame.colorGrade?.[key],
      definition.scene.effects.colorGrade[key]
    ))
  ))
  let atMs = 0
  const keyframes = preset.keyframes.map((frame, index) => {
    if (index > 0) atMs += frame.durationMs
    return {
      atMs,
      easing: frame.easing,
      patch: {
        ...(frame.auxiliaryParts == null
          ? {}
          : { auxiliaryParts: frame.auxiliaryParts.filter(item => resourceAllowed(`aux:${item.part.id}`)) }),
        ...(frame.auxiliaryShapes == null
          ? {}
          : { auxiliaryShapes: frame.auxiliaryShapes.filter(shape => resourceAllowed(`shape:${shape.id}`)) }),
        ...(colorGradeKeys.length === 0
          ? {}
          : { colorGrade: Object.fromEntries(colorGradeKeys.map(key => [key, frame.colorGrade?.[key]])) }),
        ...(faceKeys.length === 0
          ? {}
          : { face: Object.fromEntries(faceKeys.map(key => [key, frame.faceStyle[key]])) }),
        ...(frame.partShapeMorphs == null ? {} : { partShapeMorphs: frame.partShapeMorphs }),
        ...(frame.partTransforms == null ? {} : { partTransforms: frame.partTransforms }),
        ...(viewKeys.length === 0
          ? {}
          : { view: Object.fromEntries(viewKeys.map(key => [key, frame[key]])) })
      }
    }
  })
  const playback = preset.playbackMode ?? 'once'
  const durationMs = atMs + (playback === 'loop' ? preset.keyframes[0]!.durationMs : 0)
  return {
    anchor: 'absolute',
    durationMs,
    keyframes,
    label: preset.label,
    ...(preset.parameterValues == null ? {} : { parameterValues: preset.parameterValues }),
    ...(preset.parameters == null ? {} : { parameters: preset.parameters }),
    playback,
    ...(preset.resourceClaims == null ? {} : { resourceClaims: preset.resourceClaims })
  }
}

const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress
const selectDiscrete = <T>(from: T, to: T, progress: number) => progress < .5 ? from : to

const interpolatePartTransforms = (
  from: AvatarEntityPartTransforms | undefined,
  to: AvatarEntityPartTransforms | undefined,
  progress: number
): AvatarEntityPartTransforms | undefined => {
  if (from == null && to == null) return undefined
  const ids = new Set([...Object.keys(from ?? {}), ...Object.keys(to ?? {})])
  return Object.fromEntries([...ids].map(id => {
    const fromTransform = from?.[id]
    const toTransform = to?.[id]
    if (fromTransform == null || toTransform == null) {
      return [id, selectDiscrete(fromTransform, toTransform, progress) ?? {}]
    }
    const keys = new Set([...Object.keys(fromTransform), ...Object.keys(toTransform)] as (
      keyof typeof fromTransform
    )[])
    return [id, Object.fromEntries([...keys].map(key => {
      const fromValue = fromTransform[key]
      const toValue = toTransform[key]
      return [key, typeof fromValue === 'number' && typeof toValue === 'number'
        ? interpolate(fromValue, toValue, progress)
        : selectDiscrete(fromValue, toValue, progress)]
    }))]
  }))
}

const interpolateAuxiliaryShapes = (
  from: readonly AvatarAnimationShape[] | undefined,
  to: readonly AvatarAnimationShape[] | undefined,
  progress: number
): readonly AvatarAnimationShape[] | undefined => {
  if ((from == null || from.length === 0) && (to == null || to.length === 0)) return undefined
  const fromById = new Map(from?.map(shape => [shape.id, shape]) ?? [])
  const toById = new Map(to?.map(shape => [shape.id, shape]) ?? [])
  const ids = [...new Set([...(from?.map(shape => shape.id) ?? []), ...(to?.map(shape => shape.id) ?? [])])]
  return ids.map(id => {
    const fromShape = fromById.get(id)
    const toShape = toById.get(id)
    const source = fromShape ?? { ...toShape!, height: 0, opacity: 0, width: 0 }
    const target = toShape ?? { ...fromShape!, height: 0, opacity: 0, width: 0 }
    return {
      color: selectDiscrete(source.color, target.color, progress),
      height: interpolate(source.height, target.height, progress),
      id,
      kind: selectDiscrete(source.kind, target.kind, progress),
      opacity: interpolate(source.opacity, target.opacity, progress),
      rotation: interpolate(source.rotation, target.rotation, progress),
      roundness: interpolate(source.roundness, target.roundness, progress),
      width: interpolate(source.width, target.width, progress),
      x: interpolate(source.x, target.x, progress),
      y: interpolate(source.y, target.y, progress)
    }
  })
}

const interpolateAuxiliaryParts = (
  from: readonly AvatarAnimationEntityPart[] | undefined,
  to: readonly AvatarAnimationEntityPart[] | undefined,
  progress: number
): readonly AvatarAnimationEntityPart[] | undefined => {
  if ((from == null || from.length === 0) && (to == null || to.length === 0)) return undefined
  const fromById = new Map(from?.map(item => [item.part.id, item]) ?? [])
  const toById = new Map(to?.map(item => [item.part.id, item]) ?? [])
  const ids = [...new Set([
    ...(from?.map(item => item.part.id) ?? []),
    ...(to?.map(item => item.part.id) ?? [])
  ])]
  return ids.map(id => {
    const fromItem = fromById.get(id)
    const toItem = toById.get(id)
    const source = fromItem ?? { ...toItem!, opacity: 0 }
    const target = toItem ?? { ...fromItem!, opacity: 0 }
    const transform = Object.fromEntries(
      (['rotationZ', 'scaleX', 'scaleY', 'scaleZ', 'x', 'y', 'z'] as const).map(key => [
        key,
        interpolate(
          source.transform?.[key] ?? source.part[key] ?? (
            key === 'scaleZ' ? Math.min(source.part.scaleX, source.part.scaleY) : 0
          ),
          target.transform?.[key] ?? target.part[key] ?? (
            key === 'scaleZ' ? Math.min(target.part.scaleX, target.part.scaleY) : 0
          ),
          progress
        )
      ])
    ) as AvatarEntityPartTransforms[string]
    return {
      ...(source.composition == null && target.composition == null
        ? {}
        : { composition: progress < 1 ? source.composition : target.composition }),
      opacity: interpolate(source.opacity, target.opacity, progress),
      part: selectDiscrete(source.part, target.part, progress),
      transform
    }
  })
}

const interpolatePartShapeMorphs = (
  from: AvatarEntityPartShapeMorphs | undefined,
  to: AvatarEntityPartShapeMorphs | undefined,
  progress: number
): AvatarEntityPartShapeMorphs | undefined => {
  if (from == null && to == null) return undefined
  const ids = [...new Set([...Object.keys(from ?? {}), ...Object.keys(to ?? {})])]
  return Object.fromEntries(ids.map(id => {
    const source = from?.[id] ?? { ...to![id]!, progress: 0 }
    const target = to?.[id] ?? { ...from![id]!, progress: 0 }
    return [id, {
      fromShape: selectDiscrete(source.fromShape, target.fromShape, progress),
      progress: interpolate(source.progress, target.progress, progress),
      toShape: selectDiscrete(source.toShape, target.toShape, progress)
    }]
  }))
}

export const interpolateAvatarAnimationKeyframes = (
  from: AvatarAnimationKeyframe,
  to: AvatarAnimationKeyframe,
  progress: number
): AvatarAnimationKeyframe => {
  const fromFaceStyle = resolveAvatarFaceStyle(from.faceStyle)
  const toFaceStyle = resolveAvatarFaceStyle(to.faceStyle)
  const auxiliaryParts = interpolateAuxiliaryParts(from.auxiliaryParts, to.auxiliaryParts, progress)
  const auxiliaryShapes = interpolateAuxiliaryShapes(from.auxiliaryShapes, to.auxiliaryShapes, progress)
  const partShapeMorphs = interpolatePartShapeMorphs(from.partShapeMorphs, to.partShapeMorphs, progress)
  const partTransforms = interpolatePartTransforms(from.partTransforms, to.partTransforms, progress)
  return {
    ...(auxiliaryParts == null ? {} : { auxiliaryParts }),
    ...(auxiliaryShapes == null ? {} : { auxiliaryShapes }),
    colorGrade: interpolateAvatarColorGrade(from.colorGrade, to.colorGrade, progress),
    durationMs: to.durationMs,
    easing: to.easing,
    faceStyle: {
      eyeHighlight: {
        color: selectDiscrete(fromFaceStyle.eyeHighlight.color, toFaceStyle.eyeHighlight.color, progress),
        enabled: selectDiscrete(fromFaceStyle.eyeHighlight.enabled, toFaceStyle.eyeHighlight.enabled, progress),
        offsetX: interpolate(fromFaceStyle.eyeHighlight.offsetX, toFaceStyle.eyeHighlight.offsetX, progress),
        offsetY: interpolate(fromFaceStyle.eyeHighlight.offsetY, toFaceStyle.eyeHighlight.offsetY, progress),
        opacity: interpolate(fromFaceStyle.eyeHighlight.opacity, toFaceStyle.eyeHighlight.opacity, progress),
        size: interpolate(fromFaceStyle.eyeHighlight.size, toFaceStyle.eyeHighlight.size, progress)
      },
      eyeRoundness: interpolate(from.faceStyle.eyeRoundness, to.faceStyle.eyeRoundness, progress),
      eyeShape: selectDiscrete(from.faceStyle.eyeShape, to.faceStyle.eyeShape, progress),
      leftEyeShape: selectDiscrete(fromFaceStyle.leftEyeShape, toFaceStyle.leftEyeShape, progress),
      rightEyeShape: selectDiscrete(fromFaceStyle.rightEyeShape, toFaceStyle.rightEyeShape, progress),
      gap: interpolate(from.faceStyle.gap, to.faceStyle.gap, progress),
      height: interpolate(from.faceStyle.height, to.faceStyle.height, progress),
      leftEyeHeight: interpolate(
        fromFaceStyle.leftEyeHeight ?? fromFaceStyle.height,
        toFaceStyle.leftEyeHeight ?? toFaceStyle.height,
        progress
      ),
      leftEyeWidth: interpolate(fromFaceStyle.leftEyeWidth ?? fromFaceStyle.width, toFaceStyle.leftEyeWidth ?? toFaceStyle.width, progress),
      leftEyeRotation: interpolate(fromFaceStyle.leftEyeRotation, toFaceStyle.leftEyeRotation, progress),
      mouthCurve: interpolate(from.faceStyle.mouthCurve, to.faceStyle.mouthCurve, progress),
      mouthEnabled: selectDiscrete(from.faceStyle.mouthEnabled, to.faceStyle.mouthEnabled, progress),
      mouthHeight: interpolate(from.faceStyle.mouthHeight, to.faceStyle.mouthHeight, progress),
      mouthRotation: interpolate(from.faceStyle.mouthRotation, to.faceStyle.mouthRotation, progress),
      mouthShape: selectDiscrete(fromFaceStyle.mouthShape, toFaceStyle.mouthShape, progress),
      mouthWidth: interpolate(from.faceStyle.mouthWidth, to.faceStyle.mouthWidth, progress),
      mouthY: interpolate(from.faceStyle.mouthY, to.faceStyle.mouthY, progress),
      noseEnabled: selectDiscrete(from.faceStyle.noseEnabled, to.faceStyle.noseEnabled, progress),
      noseHeight: interpolate(from.faceStyle.noseHeight, to.faceStyle.noseHeight, progress),
      noseRotation: interpolate(from.faceStyle.noseRotation, to.faceStyle.noseRotation, progress),
      noseShape: selectDiscrete(from.faceStyle.noseShape, to.faceStyle.noseShape, progress),
      noseWidth: interpolate(from.faceStyle.noseWidth, to.faceStyle.noseWidth, progress),
      noseY: interpolate(from.faceStyle.noseY, to.faceStyle.noseY, progress),
      rotation: interpolate(from.faceStyle.rotation, to.faceStyle.rotation, progress),
      rightEyeHeight: interpolate(
        fromFaceStyle.rightEyeHeight ?? fromFaceStyle.height,
        toFaceStyle.rightEyeHeight ?? toFaceStyle.height,
        progress
      ),
      rightEyeWidth: interpolate(fromFaceStyle.rightEyeWidth ?? fromFaceStyle.width, toFaceStyle.rightEyeWidth ?? toFaceStyle.width, progress),
      rightEyeRotation: interpolate(fromFaceStyle.rightEyeRotation, toFaceStyle.rightEyeRotation, progress),
      width: interpolate(from.faceStyle.width, to.faceStyle.width, progress)
    },
    ...(partShapeMorphs == null ? {} : { partShapeMorphs }),
    ...(partTransforms == null ? {} : { partTransforms }),
    pitch: interpolate(from.pitch, to.pitch, progress),
    positionX: interpolate(from.positionX, to.positionX, progress),
    positionY: interpolate(from.positionY, to.positionY, progress),
    screenshot: selectDiscrete(from.screenshot, to.screenshot, progress),
    thumbnailFrame: selectDiscrete(from.thumbnailFrame, to.thumbnailFrame, progress),
    yaw: interpolate(from.yaw, to.yaw, progress)
  }
}
