import type { AvatarCameraFrame } from './AvatarControls'
import type { AvatarViewState } from './InteractiveAvatar'
import { DEFAULT_AVATAR_FACE_STYLE, resolveAvatarFaceStyle } from './avatarGeometry'
import type { AvatarFaceStyle } from './avatarGeometry'

const SAVED_ANIMATIONS_STORAGE_KEY = 'oneworks-avatar-saved-animations-v1'
const MAX_SAVED_ANIMATIONS = 12

export interface AvatarAnimationKeyframe {
  readonly faceStyle: AvatarFaceStyle
  readonly offset?: number
  readonly pitch: number
  readonly positionX: number
  readonly positionY: number
  readonly screenshot?: string
  readonly thumbnailFrame?: AvatarCameraFrame
  readonly yaw: number
}

export interface SavedAvatarAnimation {
  readonly createdAt: number
  readonly durationMs: number
  readonly id: string
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly version: 1
}

export type AvatarAnimationPresetId =
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
  | 'sad'
  | 'searching'
  | 'surprised'
  | 'thinking'
  | 'working'

export interface AvatarAnimationPreset {
  readonly description: string
  readonly durationMs: number
  readonly id: AvatarAnimationPresetId
  readonly label: string
}

export interface ResolvedAvatarAnimationPreset extends AvatarAnimationPreset {
  readonly keyframes: readonly AvatarAnimationKeyframe[]
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

export const AVATAR_ANIMATION_PRESETS: readonly AvatarAnimationPreset[] = [
  { description: 'Breathing, a soft glance, and one quick blink.', durationMs: 7200, id: 'idle', label: 'Idle' },
  { description: 'A compact close, hold, and open eye beat.', durationMs: 1050, id: 'blink', label: 'Blink' },
  {
    description: 'A relaxed attentive gaze with a quiet response.',
    durationMs: 5000,
    id: 'listening',
    label: 'Listening'
  },
  { description: 'A small affirmative dip with a soft rebound.', durationMs: 2400, id: 'nod', label: 'Nod' },
  { description: 'An upward side gaze with changing focus.', durationMs: 6200, id: 'thinking', label: 'Thinking' },
  { description: 'A quick left-right scan with focused eyes.', durationMs: 4600, id: 'searching', label: 'Searching' },
  { description: 'Steady concentration with restrained movement.', durationMs: 6000, id: 'working', label: 'Working' },
  { description: 'A warm smile with a gentle buoyant lift.', durationMs: 3700, id: 'happy', label: 'Happy' },
  { description: 'A questioning tilt with wide observant eyes.', durationMs: 4700, id: 'curious', label: 'Curious' },
  { description: 'A fast recoil into a wide-eyed reaction.', durationMs: 2600, id: 'surprised', label: 'Surprised' },
  { description: 'Heavy eyelids and a slow unimpressed drift.', durationMs: 6100, id: 'bored', label: 'Bored' },
  { description: 'A lowered posture with a soft frown.', durationMs: 5800, id: 'sad', label: 'Sad' },
  { description: 'Closed smiling eyes with a rhythmic laugh.', durationMs: 3900, id: 'laughing', label: 'Laughing' },
  { description: 'A cheeky side tilt and crooked smile.', durationMs: 4200, id: 'playful', label: 'Playful' },
  { description: 'Quick happy hops with a bright expression.', durationMs: 3500, id: 'excited', label: 'Excited' },
  { description: 'A broad side-to-side victory bounce.', durationMs: 4600, id: 'celebrate', label: 'Celebrate' }
]

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
  'leftEyeRotation',
  'rightEyeRotation'
] as const satisfies readonly (keyof AvatarFaceStyle)[]

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value != null && typeof value === 'object'
}

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}

const isAvatarFaceStyle = (value: unknown): value is AvatarFaceStyle => {
  if (!isRecord(value)) return false
  return numericFaceStyleKeys.every(key => isFiniteNumber(value[key])) &&
    optionalNumericFaceStyleKeys.every(key => value[key] == null || isFiniteNumber(value[key])) &&
    (value.eyeShape === 'ellipse' || value.eyeShape === 'rounded') &&
    typeof value.mouthEnabled === 'boolean' &&
    typeof value.noseEnabled === 'boolean' &&
    (value.noseShape === 'ellipse' || value.noseShape === 'inverted-triangle' || value.noseShape === 'rounded')
}

const isAvatarAnimationKeyframe = (value: unknown): value is AvatarAnimationKeyframe => {
  if (!isRecord(value)) return false
  return isAvatarFaceStyle(value.faceStyle) &&
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

const isSavedAvatarAnimation = (value: unknown): value is SavedAvatarAnimation => {
  if (!isRecord(value)) return false
  return value.version === 1 &&
    typeof value.id === 'string' &&
    isFiniteNumber(value.createdAt) &&
    isFiniteNumber(value.durationMs) &&
    value.durationMs >= 200 &&
    value.durationMs <= 30_000 &&
    Array.isArray(value.keyframes) &&
    value.keyframes.length >= 2 &&
    value.keyframes.every(isAvatarAnimationKeyframe)
}

export const loadSavedAvatarAnimations = (): SavedAvatarAnimation[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = JSON.parse(window.localStorage.getItem(SAVED_ANIMATIONS_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(stored)
      ? stored
        .filter(isSavedAvatarAnimation)
        .slice(0, MAX_SAVED_ANIMATIONS)
        .map(animation => ({
          ...animation,
          keyframes: animation.keyframes.map(keyframe => ({
            ...keyframe,
            faceStyle: { ...DEFAULT_AVATAR_FACE_STYLE, ...keyframe.faceStyle }
          }))
        }))
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
  screenshot?: string
): AvatarAnimationKeyframe => ({
  faceStyle: { ...faceStyle },
  pitch: viewState.pitch,
  positionX: viewState.positionX,
  positionY: viewState.positionY,
  ...(screenshot == null ? {} : { screenshot }),
  yaw: viewState.yaw
})

interface AvatarPresetFrame {
  readonly faceStyle?: Partial<AvatarFaceStyle>
  readonly offset?: number
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
): AvatarAnimationKeyframe => ({
  faceStyle: { ...faceStyle, ...frame.faceStyle },
  ...(frame.offset == null ? {} : { offset: frame.offset }),
  pitch: viewState.pitch + (frame.pitch ?? 0),
  positionX: viewState.positionX + (frame.positionX ?? 0),
  positionY: viewState.positionY + (frame.positionY ?? 0),
  yaw: viewState.yaw + (frame.yaw ?? 0)
})

const buildPresetFrames = (
  id: AvatarAnimationPresetId,
  viewState: AvatarViewState,
  faceStyle: AvatarFaceStyle
): readonly AvatarAnimationKeyframe[] => {
  const closedEyeHeight = clampPresetValue(faceStyle.height * .16, 7, 14)
  const relaxedEyeHeight = clampPresetValue(faceStyle.height * .78, 18, 104)
  const focusedEyeHeight = clampPresetValue(faceStyle.height * .58, 14, 88)
  const wideEyeHeight = clampPresetValue(faceStyle.height + 20, 28, 112)
  const wideEyeWidth = clampPresetValue(faceStyle.width + 10, 18, 76)
  const focusedFace: Partial<AvatarFaceStyle> = {
    gap: clampPresetValue(faceStyle.gap + 4, 0, 100),
    height: focusedEyeHeight,
    mouthCurve: 4,
    mouthEnabled: true,
    mouthWidth: clampPresetValue(faceStyle.mouthWidth * .62, 18, 58),
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
    mouthCurve: 94,
    mouthEnabled: true,
    mouthHeight: clampPresetValue(faceStyle.mouthHeight + 3, 6, 28),
    mouthWidth: clampPresetValue(Math.max(faceStyle.mouthWidth, 70), 24, 100),
    width: wideEyeWidth
  }
  const surprisedFace: Partial<AvatarFaceStyle> = {
    eyeShape: 'ellipse',
    gap: clampPresetValue(faceStyle.gap + 10, 0, 100),
    height: wideEyeHeight,
    mouthCurve: 0,
    mouthEnabled: true,
    mouthHeight: 18,
    mouthWidth: 18,
    width: wideEyeWidth
  }
  const sadFace: Partial<AvatarFaceStyle> = {
    height: clampPresetValue(faceStyle.height * .56, 12, 76),
    leftEyeRotation: clampPresetValue(faceStyle.leftEyeRotation + 7, -90, 90),
    mouthCurve: -76,
    mouthEnabled: true,
    mouthWidth: clampPresetValue(Math.max(faceStyle.mouthWidth, 54), 24, 100),
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

  const framesByPreset: Readonly<Record<AvatarAnimationPresetId, readonly AvatarPresetFrame[]>> = {
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
          eyeShape: 'ellipse',
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
          eyeShape: 'ellipse',
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
      { faceStyle: sadFace, offset: .22, pitch: .1, positionY: 6, yaw: -.06 },
      { faceStyle: { ...sadFace, height: closedEyeHeight * 1.5 }, offset: .48, pitch: .12, positionY: 8 },
      { faceStyle: sadFace, offset: .56, pitch: .11, positionY: 7, yaw: .04 },
      { faceStyle: sadFace, offset: .8, pitch: .08, positionY: 5, yaw: -.03 },
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
    working: [
      { offset: 0 },
      { faceStyle: focusedFace, offset: .18, pitch: .035, positionY: 2, yaw: -.05 },
      { faceStyle: focusedFace, offset: .42, pitch: -.025, positionY: -2, yaw: .045 },
      { faceStyle: { ...focusedFace, height: closedEyeHeight }, offset: .48, pitch: -.015, yaw: .03 },
      { faceStyle: focusedFace, offset: .54, pitch: -.01, positionY: -1, yaw: .02 },
      { faceStyle: focusedFace, offset: .78, pitch: .03, positionY: 2, yaw: -.04 },
      { offset: 1 }
    ]
  }

  return framesByPreset[id].map(frame => createRelativePresetFrame(viewState, faceStyle, frame))
}

export const resolveAvatarAnimationPreset = (
  preset: AvatarAnimationPreset,
  viewState: AvatarViewState,
  faceStyle: AvatarFaceStyle
): ResolvedAvatarAnimationPreset => ({
  ...preset,
  keyframes: buildPresetFrames(preset.id, viewState, faceStyle)
})

const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress
const selectDiscrete = <T>(from: T, to: T, progress: number) => progress < .5 ? from : to

export const interpolateAvatarAnimationKeyframes = (
  from: AvatarAnimationKeyframe,
  to: AvatarAnimationKeyframe,
  progress: number
): AvatarAnimationKeyframe => {
  const fromFaceStyle = resolveAvatarFaceStyle(from.faceStyle)
  const toFaceStyle = resolveAvatarFaceStyle(to.faceStyle)
  return {
    faceStyle: {
    eyeRoundness: interpolate(from.faceStyle.eyeRoundness, to.faceStyle.eyeRoundness, progress),
    eyeShape: selectDiscrete(from.faceStyle.eyeShape, to.faceStyle.eyeShape, progress),
    gap: interpolate(from.faceStyle.gap, to.faceStyle.gap, progress),
    height: interpolate(from.faceStyle.height, to.faceStyle.height, progress),
    leftEyeRotation: interpolate(fromFaceStyle.leftEyeRotation, toFaceStyle.leftEyeRotation, progress),
    mouthCurve: interpolate(from.faceStyle.mouthCurve, to.faceStyle.mouthCurve, progress),
    mouthEnabled: selectDiscrete(from.faceStyle.mouthEnabled, to.faceStyle.mouthEnabled, progress),
    mouthHeight: interpolate(from.faceStyle.mouthHeight, to.faceStyle.mouthHeight, progress),
    mouthRotation: interpolate(from.faceStyle.mouthRotation, to.faceStyle.mouthRotation, progress),
    mouthWidth: interpolate(from.faceStyle.mouthWidth, to.faceStyle.mouthWidth, progress),
    mouthY: interpolate(from.faceStyle.mouthY, to.faceStyle.mouthY, progress),
    noseEnabled: selectDiscrete(from.faceStyle.noseEnabled, to.faceStyle.noseEnabled, progress),
    noseHeight: interpolate(from.faceStyle.noseHeight, to.faceStyle.noseHeight, progress),
    noseRotation: interpolate(from.faceStyle.noseRotation, to.faceStyle.noseRotation, progress),
    noseShape: selectDiscrete(from.faceStyle.noseShape, to.faceStyle.noseShape, progress),
    noseWidth: interpolate(from.faceStyle.noseWidth, to.faceStyle.noseWidth, progress),
    noseY: interpolate(from.faceStyle.noseY, to.faceStyle.noseY, progress),
    rotation: interpolate(from.faceStyle.rotation, to.faceStyle.rotation, progress),
    rightEyeRotation: interpolate(fromFaceStyle.rightEyeRotation, toFaceStyle.rightEyeRotation, progress),
    width: interpolate(from.faceStyle.width, to.faceStyle.width, progress)
  },
  pitch: interpolate(from.pitch, to.pitch, progress),
  positionX: interpolate(from.positionX, to.positionX, progress),
  positionY: interpolate(from.positionY, to.positionY, progress),
  screenshot: selectDiscrete(from.screenshot, to.screenshot, progress),
  thumbnailFrame: selectDiscrete(from.thumbnailFrame, to.thumbnailFrame, progress),
    yaw: interpolate(from.yaw, to.yaw, progress)
  }
}
