import './App.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import {
  AVATAR_PALETTES,
  DEFAULT_AVATAR_GLYPH_EXPRESSION,
  getAvatarPalette,
  isSupportedAvatarGlyphExpression
} from '@oneworks/avatar'
import type { AvatarAnimationLibrary, AvatarBackgroundStyle, AvatarDefinition } from '@oneworks/avatar'

import { AnimationPanel } from './AnimationPanel'
import { AvatarControls } from './AvatarControls'
import type { AvatarCameraFrame, AvatarControlTab } from './AvatarControls'
import { AvatarOrientationControl } from './AvatarOrientationControl'
import { EXPORT_SIZES, ExportToolbar } from './ExportToolbar'
import type { ExportSize } from './ExportToolbar'
import {
  AVATAR_BODY_SHAPES,
  AVATAR_VIEW_LIMITS,
  DEFAULT_AVATAR_VIEW_STATE,
  InteractiveAvatar
} from './InteractiveAvatar'
import type {
  AvatarBodyShape,
  AvatarDropShadowStyle,
  AvatarInteractionMode,
  AvatarOutlineStyle,
  AvatarViewState
} from './InteractiveAvatar'
import { LanguageSwitcher } from './LanguageSwitcher'
import {
  AVATAR_ANIMATION_PRESETS,
  applyAvatarAnimationTransformAnchor,
  clampAvatarAnimationFrameDuration,
  createAvatarAnimationKeyframe,
  createAvatarAnimationTransformAnchor,
  deserializeSharedAvatarAnimation,
  easeAvatarAnimationProgress,
  interpolateAvatarAnimationKeyframes,
  loadSavedAvatarAnimations,
  persistSavedAvatarAnimations,
  prependSavedAvatarAnimation,
  resolveAvatarAnimationPreset,
  resolveAvatarAnimationTimedSegment,
  serializeSharedAvatarAnimation,
  shouldConfirmAnimationReplacement
} from './avatarAnimations'
import type {
  AvatarAnimationDraftSource,
  AvatarAnimationEasing,
  AvatarAnimationKeyframe,
  AvatarAnimationPlaybackMode,
  AvatarAnimationPreset,
  AvatarAnimationTransformAnchor,
  SavedAvatarAnimation
} from './avatarAnimations'
import { DEFAULT_AVATAR_COLOR_GRADE, resolveAvatarColorGrade } from './avatarColorGrade'
import type { AvatarColorGrade } from './avatarColorGrade'
import {
  avatarDefinitionToSearchParams,
  avatarDefinitionToState,
  createAvatarDefinition,
  flattenAvatarAnimationLibraries
} from './avatarDefinition'
import {
  applyAvatarEntityPalette,
  createAvatarEntityParts,
  deserializeAvatarEntityParts,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene,
  parseAvatarEntityPreset,
  serializeAvatarEntityParts
} from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import { AVATAR_GRID_DENSITY, DEFAULT_AVATAR_FACE_SHADOW_STYLE, DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type {
  AvatarEyeShape,
  AvatarFaceShadowStyle,
  AvatarFaceStyle,
  AvatarMouthShape,
  AvatarNoseShape
} from './avatarGeometry'
import { createAvatarGif } from './avatarGifExport'
import { LAST_EDITOR_QUERY_STORAGE_KEY } from './avatarHome'
import { useAvatarLocale } from './avatarLocale'
import {
  captureAvatarScreenshot,
  loadSavedAvatarPresets,
  persistSavedAvatarPresets,
  prependSavedAvatarPreset,
  renderAvatarPngBlob,
  serializeAvatarSvg
} from './savedAvatarPresets'
import type { SavedAvatarPreset } from './savedAvatarPresets'
import {
  createAvatarSurfaceDecal,
  deserializeAvatarSurfaceDecals,
  serializeAvatarSurfaceDecals
} from './avatarSurfaceDecals'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

const INITIAL_EMOTICON = DEFAULT_AVATAR_GLYPH_EXPRESSION
const INITIAL_PARTS = Array.from(INITIAL_EMOTICON)
const DEFAULT_PALETTE_COUNT = 16
const UNDO_GROUP_DELAY_MS = 400
const UNDO_HISTORY_LIMIT = 100
const DEFAULT_PALETTE_ID = AVATAR_PALETTES[0]?.id ?? ''
const DEFAULT_BACKGROUND_STYLE: AvatarBackgroundStyle = 'solid'
const DEFAULT_EXPORT_SIZE: ExportSize = 256
const DEFAULT_LIGHT_AZIMUTH = -35
const DEFAULT_LIGHT_DISTANCE = 0
const DEFAULT_LIGHT_ELEVATION = 40
const DEFAULT_CAMERA_BACKGROUND = '#111315'
const DEFAULT_CAMERA_FRAME: AvatarCameraFrame = 'rounded'
const DEFAULT_AVATAR_SHADOW_STYLE: AvatarDropShadowStyle = {
  color: '#000000',
  direction: 45,
  distance: 12,
  opacity: 24,
  softness: 16
}
const DEFAULT_AVATAR_OUTLINE_STYLE: AvatarOutlineStyle = {
  color: '#ffffff',
  opacity: 80,
  width: 4
}
const DEFAULT_FRAME_SHADOW_STYLE: AvatarDropShadowStyle = {
  direction: 90,
  distance: 12,
  opacity: 22,
  softness: 24
}
const DEFAULT_CONTROLS_WIDTH = 420
const SYSTEM_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const AVATAR_GITHUB_URL = 'https://github.com/oneworks-ai/avatar'
type SavePresetState = 'error' | 'idle' | 'saved' | 'saving'
type GifExportState = 'error' | 'exporting' | 'idle'
type AvatarTheme = 'dark' | 'light'
type AvatarAnimationSelectionKey =
  | 'shared'
  | `preset:${AvatarAnimationPreset['id']}`
  | `public:${string}`
  | `saved:${string}`

interface AvatarQueryConfig {
  readonly animationOpen: boolean
  readonly animationSelectionKey: AvatarAnimationSelectionKey | null
  readonly sharedAnimation: SavedAvatarAnimation | null
  readonly avatarShadowStyle: AvatarDropShadowStyle
  readonly avatarOutlineStyle: AvatarOutlineStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly cameraBackground: string
  readonly cameraFrame: AvatarCameraFrame
  readonly cameraMode: boolean
  readonly controlsCollapsed: boolean
  readonly entityParts: readonly AvatarEntityPart[]
  readonly entityPreset: AvatarEntityPreset
  readonly exportSize: ExportSize
  readonly faceStyle: AvatarFaceStyle
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly frameShadowStyle: AvatarDropShadowStyle
  readonly gridDensity: number
  readonly lightAzimuth: number
  readonly lightDistance: number
  readonly lightElevation: number
  readonly interactionMode: AvatarInteractionMode
  readonly linkEyes: boolean
  readonly leftEye: string
  readonly mouth: string
  readonly rightEye: string
  readonly selectedPaletteId: string
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showAvatarShadow: boolean
  readonly showFrameShadow: boolean
  readonly showShadow: boolean
  readonly surfaceDecals: readonly AvatarSurfaceDecal[]
  readonly viewState: AvatarViewState
}

interface AnimationThumbnailCaptureRequest {
  readonly avatarOutlineStyle: AvatarOutlineStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly entityParts: readonly AvatarEntityPart[]
  readonly entityPreset: AvatarEntityPreset
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly gridDensity: number
  readonly id: number
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly lightAzimuth: number
  readonly lightDistance: number
  readonly lightElevation: number
  readonly paletteId: string
  readonly scale: number
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showShadow: boolean
  readonly surfaceDecals: readonly AvatarSurfaceDecal[]
}

const ignoreAvatarViewStateChange = () => {}

const isAvatarBackgroundStyle = (value: string | null): value is AvatarBackgroundStyle => {
  return value === 'solid' || value === 'gradient'
}

const parseExportSize = (value: string | null): ExportSize => {
  const parsed = Number(value)
  return EXPORT_SIZES.includes(parsed as ExportSize) ? (parsed as ExportSize) : DEFAULT_EXPORT_SIZE
}

const parseShadow = (value: string | null) => value === '1' || value === 'true'
const parseLight = (value: string | null) => value === '1' || value === 'true'
const parseCameraBackground = (value: string | null) => {
  if (value === 'transparent') return value
  return value != null && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_CAMERA_BACKGROUND
}
const parseOutlineColor = (value: string | null) => {
  return value != null && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_AVATAR_OUTLINE_STYLE.color
}
const parseAvatarShadowColor = (value: string | null) => {
  return value != null && /^#[\da-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : DEFAULT_AVATAR_SHADOW_STYLE.color
}
const parseOptionalShadowColor = (value: string | null) => (
  value != null && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : undefined
)
const parseCameraFrame = (value: string | null): AvatarCameraFrame => {
  return value === 'circle' || value === 'rounded' || value === 'square' ? value : DEFAULT_CAMERA_FRAME
}
const parseRangeValue = (value: string | null, fallback: number, min: number, max: number) => {
  if (value == null || value.trim() === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback
}
const parseFiniteValue = (value: string | null, fallback: number) => {
  if (value == null || value.trim() === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const formatQueryNumber = (value: number) => String(Number(value.toFixed(4)))
const parseBodyShape = (value: string | null): AvatarBodyShape => {
  return AVATAR_BODY_SHAPES.includes(value as AvatarBodyShape) ? (value as AvatarBodyShape) : 'sphere'
}
const parseEyeShape = (value: string | null): AvatarEyeShape => {
  return value === 'ellipse' || value === 'rounded' ? value : DEFAULT_AVATAR_FACE_STYLE.eyeShape
}
const parseNoseShape = (value: string | null): AvatarNoseShape => {
  return value === 'ellipse' || value === 'inverted-triangle' || value === 'rounded'
    ? value
    : DEFAULT_AVATAR_FACE_STYLE.noseShape
}
const parseMouthShape = (value: string | null): AvatarMouthShape => {
  return value === 'curve' || value === 'ellipse' || value === 'rounded' || value === 'rounded-triangle'
    ? value
    : DEFAULT_AVATAR_FACE_STYLE.mouthShape
}
const parseInteractionMode = (value: string | null): AvatarInteractionMode => {
  return value === 'move' || value === 'rotate' ? value : 'rotate'
}

const parseAnimationSelectionKey = (value: string | null): AvatarAnimationSelectionKey | null => {
  if (value == null) return null
  if (value === 'shared') return 'shared'
  if (value.startsWith('preset:')) {
    const presetId = value.slice('preset:'.length)
    return AVATAR_ANIMATION_PRESETS.some(preset => preset.id === presetId)
      ? value as AvatarAnimationSelectionKey
      : null
  }
  return null
}

const parseLinkEyes = (value: string | null, leftEye: string, rightEye: string) => {
  if (value === '1' || value === 'true' || value === 'same') return true
  if (value === '0' || value === 'false' || value === 'split') return false
  return leftEye === rightEye
}

const parseQueryConfig = (params: URLSearchParams): AvatarQueryConfig => {
  const queryFace = params.get('face') ?? ''
  const emoticon = isSupportedAvatarGlyphExpression(queryFace) ? queryFace : INITIAL_EMOTICON
  const parts = Array.from(emoticon)
  const queryPaletteId = params.get('palette') ?? ''
  const selectedPaletteId = AVATAR_PALETTES.some(palette => palette.id === queryPaletteId)
    ? queryPaletteId
    : DEFAULT_PALETTE_ID
  const queryBackgroundStyle = params.get('bg')
  const backgroundStyle = isAvatarBackgroundStyle(queryBackgroundStyle)
    ? queryBackgroundStyle
    : DEFAULT_BACKGROUND_STYLE
  const leftEye = parts[0] ?? INITIAL_PARTS[0] ?? '0'
  const mouth = parts[1] ?? INITIAL_PARTS[1] ?? 'w'
  const queryRightEye = parts[2] ?? INITIAL_PARTS[2] ?? '0'
  const linkEyes = parseLinkEyes(params.get('eyes'), leftEye, queryRightEye)
  const rightEye = linkEyes ? leftEye : queryRightEye

  const animationSelectionKey = parseAnimationSelectionKey(params.get('animation'))
  const entityPreset = parseAvatarEntityPreset(params.get('entity'))
  const sharedAnimation = animationSelectionKey === 'shared'
    ? deserializeSharedAvatarAnimation(params.get('animationData'))
    : null

  return {
    animationOpen: parseShadow(params.get('animationPanel')),
    animationSelectionKey: animationSelectionKey === 'shared' && sharedAnimation == null
      ? null
      : animationSelectionKey,
    avatarShadowStyle: {
      color: parseAvatarShadowColor(params.get('avatarShadowColor')),
      direction: parseRangeValue(params.get('avatarShadowDir'), DEFAULT_AVATAR_SHADOW_STYLE.direction, -180, 180),
      distance: parseRangeValue(params.get('avatarShadowDist'), DEFAULT_AVATAR_SHADOW_STYLE.distance, 0, 40),
      opacity: parseRangeValue(params.get('avatarShadowOpacity'), DEFAULT_AVATAR_SHADOW_STYLE.opacity, 0, 100),
      softness: parseRangeValue(params.get('avatarShadowSoft'), DEFAULT_AVATAR_SHADOW_STYLE.softness, 0, 40)
    },
    avatarOutlineStyle: {
      color: parseOutlineColor(params.get('outlineColor')),
      opacity: parseRangeValue(params.get('outlineOpacity'), DEFAULT_AVATAR_OUTLINE_STYLE.opacity, 0, 100),
      width: parseRangeValue(params.get('outlineWidth'), DEFAULT_AVATAR_OUTLINE_STYLE.width, 1, 20)
    },
    backgroundStyle,
    bodyShape: parseBodyShape(params.get('shape')),
    cameraBackground: parseCameraBackground(params.get('cameraBg')),
    cameraFrame: parseCameraFrame(params.get('cameraFrame')),
    cameraMode: parseShadow(params.get('camera')),
    controlsCollapsed: params.get('sidebar') === '0',
    entityParts: deserializeAvatarEntityParts(params.get('entityParts'), entityPreset),
    entityPreset,
    exportSize: parseExportSize(params.get('size')),
    faceStyle: {
      eyeHighlight: {
        color: parseOutlineColor(params.get('eyeHighlightColor')),
        enabled: parseShadow(params.get('eyeHighlight')),
        offsetX: parseRangeValue(
          params.get('eyeHighlightX'),
          DEFAULT_AVATAR_FACE_STYLE.eyeHighlight.offsetX,
          -35,
          35
        ),
        offsetY: parseRangeValue(
          params.get('eyeHighlightY'),
          DEFAULT_AVATAR_FACE_STYLE.eyeHighlight.offsetY,
          -35,
          35
        ),
        opacity: parseRangeValue(
          params.get('eyeHighlightOpacity'),
          DEFAULT_AVATAR_FACE_STYLE.eyeHighlight.opacity,
          0,
          100
        ),
        size: parseRangeValue(
          params.get('eyeHighlightSize'),
          DEFAULT_AVATAR_FACE_STYLE.eyeHighlight.size,
          8,
          50
        )
      },
      eyeRoundness: parseRangeValue(params.get('eyeRound'), DEFAULT_AVATAR_FACE_STYLE.eyeRoundness, 0, 100),
      eyeShape: parseEyeShape(params.get('eyeShape')),
      gap: parseRangeValue(params.get('eyeGap'), DEFAULT_AVATAR_FACE_STYLE.gap, 0, 100),
      height: parseRangeValue(params.get('eyeH'), DEFAULT_AVATAR_FACE_STYLE.height, 20, 104),
      leftEyeHeight: params.has('eyeLeftH')
        ? parseRangeValue(params.get('eyeLeftH'), DEFAULT_AVATAR_FACE_STYLE.height, 20, 104)
        : undefined,
      leftEyeRotation: parseRangeValue(
        params.get('eyeLeftRot'),
        DEFAULT_AVATAR_FACE_STYLE.leftEyeRotation,
        -90,
        90
      ),
      mouthCurve: parseRangeValue(params.get('mouthCurve'), DEFAULT_AVATAR_FACE_STYLE.mouthCurve, -100, 100),
      mouthEnabled: parseShadow(params.get('mouth')),
      mouthHeight: parseRangeValue(params.get('mouthH'), DEFAULT_AVATAR_FACE_STYLE.mouthHeight, 6, 48),
      mouthRotation: parseRangeValue(params.get('mouthRot'), DEFAULT_AVATAR_FACE_STYLE.mouthRotation, -180, 180),
      mouthShape: parseMouthShape(params.get('mouthShape')),
      mouthWidth: parseRangeValue(params.get('mouthW'), DEFAULT_AVATAR_FACE_STYLE.mouthWidth, 16, 100),
      mouthY: parseRangeValue(params.get('mouthY'), DEFAULT_AVATAR_FACE_STYLE.mouthY, 24, 90),
      noseEnabled: parseShadow(params.get('nose')),
      noseHeight: parseRangeValue(params.get('noseH'), DEFAULT_AVATAR_FACE_STYLE.noseHeight, 6, 48),
      noseRotation: parseRangeValue(params.get('noseRot'), DEFAULT_AVATAR_FACE_STYLE.noseRotation, -180, 180),
      noseShape: parseNoseShape(params.get('noseShape')),
      noseWidth: parseRangeValue(params.get('noseW'), DEFAULT_AVATAR_FACE_STYLE.noseWidth, 6, 36),
      noseY: parseRangeValue(params.get('noseY'), DEFAULT_AVATAR_FACE_STYLE.noseY, -10, 50),
      rotation: parseRangeValue(params.get('eyeRot'), DEFAULT_AVATAR_FACE_STYLE.rotation, -90, 90),
      rightEyeRotation: parseRangeValue(
        params.get('eyeRightRot'),
        DEFAULT_AVATAR_FACE_STYLE.rightEyeRotation,
        -90,
        90
      ),
      rightEyeHeight: params.has('eyeRightH')
        ? parseRangeValue(params.get('eyeRightH'), DEFAULT_AVATAR_FACE_STYLE.height, 20, 104)
        : undefined,
      width: parseRangeValue(params.get('eyeW'), DEFAULT_AVATAR_FACE_STYLE.width, 12, 72)
    },
    faceShadowStyle: {
      color: parseOptionalShadowColor(params.get('shadowColor')),
      direction: parseRangeValue(
        params.get('shadowDir'),
        DEFAULT_AVATAR_FACE_SHADOW_STYLE.direction,
        -180,
        180
      ),
      distance: parseRangeValue(params.get('shadowDist'), DEFAULT_AVATAR_FACE_SHADOW_STYLE.distance, 0, 24),
      opacity: parseRangeValue(params.get('shadowOpacity'), DEFAULT_AVATAR_FACE_SHADOW_STYLE.opacity, 0, 100),
      softness: parseRangeValue(params.get('shadowSoft'), DEFAULT_AVATAR_FACE_SHADOW_STYLE.softness, 0, 12)
    },
    frameShadowStyle: {
      color: parseOptionalShadowColor(params.get('frameShadowColor')),
      direction: parseRangeValue(params.get('frameShadowDir'), DEFAULT_FRAME_SHADOW_STYLE.direction, -180, 180),
      distance: parseRangeValue(params.get('frameShadowDist'), DEFAULT_FRAME_SHADOW_STYLE.distance, 0, 40),
      opacity: parseRangeValue(params.get('frameShadowOpacity'), DEFAULT_FRAME_SHADOW_STYLE.opacity, 0, 100),
      softness: parseRangeValue(params.get('frameShadowSoft'), DEFAULT_FRAME_SHADOW_STYLE.softness, 0, 48)
    },
    gridDensity: parseRangeValue(
      params.get('gridDensity'),
      AVATAR_GRID_DENSITY.default,
      AVATAR_GRID_DENSITY.min,
      AVATAR_GRID_DENSITY.max
    ),
    interactionMode: parseInteractionMode(params.get('mode')),
    lightAzimuth: parseRangeValue(params.get('lightAz'), DEFAULT_LIGHT_AZIMUTH, -180, 180),
    lightDistance: parseRangeValue(params.get('lightDist'), DEFAULT_LIGHT_DISTANCE, 0, 100),
    lightElevation: parseRangeValue(params.get('lightEl'), DEFAULT_LIGHT_ELEVATION, -80, 80),
    leftEye,
    linkEyes,
    mouth,
    rightEye,
    selectedPaletteId,
    showLight: parseLight(params.get('light')),
    showOutline: params.get('outline') == null ? true : parseShadow(params.get('outline')),
    showAvatarShadow: parseShadow(params.get('avatarShadow')),
    showFrameShadow: params.get('frameShadow') == null ? true : parseShadow(params.get('frameShadow')),
    showShadow: parseShadow(params.get('shadow')),
    surfaceDecals: deserializeAvatarSurfaceDecals(params.get('decals')),
    sharedAnimation,
    viewState: {
      pitch: parseFiniteValue(params.get('pitch'), DEFAULT_AVATAR_VIEW_STATE.pitch),
      positionX: parseRangeValue(
        params.get('positionX'),
        DEFAULT_AVATAR_VIEW_STATE.positionX,
        -AVATAR_VIEW_LIMITS.maxPosition,
        AVATAR_VIEW_LIMITS.maxPosition
      ),
      positionY: parseRangeValue(
        params.get('positionY'),
        DEFAULT_AVATAR_VIEW_STATE.positionY,
        -AVATAR_VIEW_LIMITS.maxPosition,
        AVATAR_VIEW_LIMITS.maxPosition
      ),
      roll: parseFiniteValue(params.get('roll'), DEFAULT_AVATAR_VIEW_STATE.roll),
      scale: parseRangeValue(
        params.get('scale'),
        DEFAULT_AVATAR_VIEW_STATE.scale,
        AVATAR_VIEW_LIMITS.minScale,
        AVATAR_VIEW_LIMITS.maxScale
      ),
      yaw: parseFiniteValue(params.get('yaw'), DEFAULT_AVATAR_VIEW_STATE.yaw)
    }
  }
}

const getInitialQueryConfig = (definition?: AvatarDefinition) => {
  const params = definition == null
    ? typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
    : avatarDefinitionToSearchParams(definition)
  const config = parseQueryConfig(params)
  if (definition != null) {
    const state = avatarDefinitionToState(definition)
    return {
      ...config,
      avatarOutlineStyle: state.avatarOutlineStyle,
      avatarShadowStyle: state.avatarShadowStyle,
      backgroundStyle: state.backgroundStyle,
      bodyShape: state.bodyShape,
      cameraBackground: state.cameraBackground,
      cameraFrame: state.cameraFrame,
      entityParts: state.entityParts,
      entityPreset: state.entityPreset,
      exportSize: state.exportSize,
      faceShadowStyle: state.faceShadowStyle,
      faceStyle: state.faceStyle,
      frameShadowStyle: state.frameShadowStyle,
      gridDensity: state.gridDensity,
      interactionMode: state.interactionMode,
      leftEye: state.glyph.leftEye,
      lightAzimuth: state.lightAzimuth,
      lightDistance: state.lightDistance,
      lightElevation: state.lightElevation,
      linkEyes: state.glyph.linkEyes,
      mouth: state.glyph.mouth,
      rightEye: state.glyph.rightEye,
      selectedPaletteId: state.paletteId,
      showAvatarShadow: state.showAvatarShadow,
      showFrameShadow: state.showFrameShadow,
      showLight: state.showLight,
      showOutline: state.showOutline,
      showShadow: state.showShadow,
      surfaceDecals: state.surfaceDecals,
      viewState: state.viewState
    }
  }
  if (!params.has('template')) return config

  const preset = parseAvatarEntityPreset(params.get('template'))
  const scene = getAvatarEntityPresetScene(preset)
  const faceStyle = getAvatarEntityPresetFaceStyle(preset)
  if (preset === 'custom' || scene == null || faceStyle == null) return config

  return {
    ...config,
    animationOpen: false,
    avatarOutlineStyle: scene.avatarOutlineStyle,
    avatarShadowStyle: scene.avatarShadowStyle,
    backgroundStyle: scene.backgroundStyle,
    bodyShape: 'sphere' as const,
    cameraBackground: scene.cameraBackground,
    cameraFrame: scene.cameraFrame,
    cameraMode: scene.cameraMode,
    controlsCollapsed: false,
    entityParts: createAvatarEntityParts(preset),
    entityPreset: preset,
    surfaceDecals: [],
    faceStyle,
    frameShadowStyle: scene.frameShadowStyle,
    interactionMode: scene.interactionMode,
    selectedPaletteId: scene.paletteId,
    showAvatarShadow: scene.showAvatarShadow,
    showFrameShadow: scene.showFrameShadow,
    showLight: scene.showLight,
    showOutline: scene.showOutline,
    showShadow: scene.showShadow,
    viewState: scene.viewState
  }
}

const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

const waitForAvatarExportSvg = async (container: Element | null) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const svg = container?.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
    if (svg?.querySelector('path, polygon, ellipse, circle, rect') != null) return svg
    await new Promise<void>(resolve => window.setTimeout(resolve, 16))
  }
  return null
}

export interface AppProps {
  readonly animationLibraries?: readonly AvatarAnimationLibrary[]
  readonly definition?: AvatarDefinition
  readonly embedded?: boolean
  readonly onDefinitionChange?: (definition: AvatarDefinition) => void
  readonly onHome?: () => void
  readonly theme?: 'dark' | 'light' | 'system'
}

function App({
  animationLibraries = [],
  definition,
  embedded = false,
  onDefinitionChange,
  onHome,
  theme = 'system'
}: AppProps) {
  const { t } = useAvatarLocale()
  const [initialConfig] = useState(() => getInitialQueryConfig(definition))
  const [activeTab, setActiveTab] = useState<AvatarControlTab>('build')
  const [controlsCollapsed, setControlsCollapsed] = useState(initialConfig.controlsCollapsed)
  const [controlsWidth, setControlsWidth] = useState(DEFAULT_CONTROLS_WIDTH)
  const [systemDark, setSystemDark] = useState(() => {
    return typeof window !== 'undefined' && window.matchMedia(SYSTEM_DARK_MEDIA_QUERY).matches
  })
  const [themeOverride, setThemeOverride] = useState<AvatarTheme | null>(
    theme === 'system' ? null : theme
  )
  const [interactionMode, setInteractionMode] = useState<AvatarInteractionMode>(initialConfig.interactionMode)
  const [avatarViewState, setAvatarViewState] = useState<AvatarViewState>(initialConfig.viewState)
  const [bodyShape, setBodyShape] = useState<AvatarBodyShape>(initialConfig.bodyShape)
  const [entityParts, setEntityParts] = useState<readonly AvatarEntityPart[]>(initialConfig.entityParts)
  const [entityPreset, setEntityPreset] = useState<AvatarEntityPreset>(initialConfig.entityPreset)
  const [selectedEntityPartId, setSelectedEntityPartId] = useState<string | null>(null)
  const [surfaceDecals, setSurfaceDecals] = useState<readonly AvatarSurfaceDecal[]>(initialConfig.surfaceDecals ?? [])
  const [selectedSurfaceDecalId, setSelectedSurfaceDecalId] = useState<string | null>(null)
  const [cameraMode, setCameraMode] = useState(initialConfig.cameraMode)
  const [cameraBackground, setCameraBackground] = useState(initialConfig.cameraBackground)
  const [cameraFrame, setCameraFrame] = useState<AvatarCameraFrame>(initialConfig.cameraFrame)
  const { leftEye, linkEyes, mouth, rightEye } = initialConfig
  const [selectedPaletteId, setSelectedPaletteId] = useState(initialConfig.selectedPaletteId)
  const [showMorePalettes, setShowMorePalettes] = useState(() => {
    return AVATAR_PALETTES.findIndex(palette => palette.id === initialConfig.selectedPaletteId) >=
      DEFAULT_PALETTE_COUNT
  })
  const [backgroundStyle, setBackgroundStyle] = useState<AvatarBackgroundStyle>(initialConfig.backgroundStyle)
  const [faceStyle, setFaceStyle] = useState<AvatarFaceStyle>(initialConfig.faceStyle)
  const [avatarColorGrade, setAvatarColorGrade] = useState<AvatarColorGrade>(
    definition?.scene.effects.colorGrade ?? DEFAULT_AVATAR_COLOR_GRADE
  )
  const [faceShadowStyle, setFaceShadowStyle] = useState<AvatarFaceShadowStyle>(initialConfig.faceShadowStyle)
  const [avatarShadowStyle, setAvatarShadowStyle] = useState<AvatarDropShadowStyle>(initialConfig.avatarShadowStyle)
  const [avatarOutlineStyle, setAvatarOutlineStyle] = useState<AvatarOutlineStyle>(initialConfig.avatarOutlineStyle)
  const [frameShadowStyle, setFrameShadowStyle] = useState<AvatarDropShadowStyle>(initialConfig.frameShadowStyle)
  const [gridDensity, setGridDensity] = useState(initialConfig.gridDensity)
  const [showLight, setShowLight] = useState(initialConfig.showLight)
  const [lightAzimuth, setLightAzimuth] = useState(initialConfig.lightAzimuth)
  const [lightDistance, setLightDistance] = useState(initialConfig.lightDistance)
  const [lightElevation, setLightElevation] = useState(initialConfig.lightElevation)
  const [showShadow, setShowShadow] = useState(initialConfig.showShadow)
  const [showAvatarShadow, setShowAvatarShadow] = useState(initialConfig.showAvatarShadow)
  const [showOutline, setShowOutline] = useState(initialConfig.showOutline)
  const [showFrameShadow, setShowFrameShadow] = useState(initialConfig.showFrameShadow)
  const [exportSize, setExportSize] = useState<ExportSize>(initialConfig.exportSize)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [gifExportState, setGifExportState] = useState<GifExportState>('idle')
  const [savePresetState, setSavePresetState] = useState<SavePresetState>('idle')
  const [savedPresets, setSavedPresets] = useState(loadSavedAvatarPresets)
  const [selectedSavedPresetId, setSelectedSavedPresetId] = useState<string | null>(null)
  const [animationOpen, setAnimationOpen] = useState(initialConfig.animationOpen)
  const [animationPlaybackMode, setAnimationPlaybackMode] = useState<AvatarAnimationPlaybackMode>('once')
  const [animationKeyframes, setAnimationKeyframes] = useState<readonly AvatarAnimationKeyframe[]>([])
  const [animationName, setAnimationName] = useState('Untitled animation')
  const [animationStartFrameIndex, setAnimationStartFrameIndex] = useState(0)
  const [animationLockStartPosition, setAnimationLockStartPosition] = useState(false)
  const [editingSavedAnimationId, setEditingSavedAnimationId] = useState<string | null>(null)
  const [selectedAnimationKey, setSelectedAnimationKey] = useState<AvatarAnimationSelectionKey | null>(
    initialConfig.animationSelectionKey
  )
  const [animationDraftSource, setAnimationDraftSource] = useState<AvatarAnimationDraftSource>(null)
  const [activeAnimationKeyframe, setActiveAnimationKeyframe] = useState<number | null>(null)
  const [selectedAnimationKeyframe, setSelectedAnimationKeyframe] = useState<number | null>(null)
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [animationPreviewFaceStyle, setAnimationPreviewFaceStyle] = useState<AvatarFaceStyle>(
    initialConfig.faceStyle
  )
  const [animationPreviewViewState, setAnimationPreviewViewState] = useState<AvatarViewState>(initialConfig.viewState)
  const [keyframeCapturePending, setKeyframeCapturePending] = useState(false)
  const [interactionControlsDocked, setInteractionControlsDocked] = useState(false)
  const [stageNarrow, setStageNarrow] = useState(false)
  const [animationThumbnailCapture, setAnimationThumbnailCapture] = useState<AnimationThumbnailCaptureRequest | null>(
    null
  )
  const [savedAnimations, setSavedAnimations] = useState(loadSavedAvatarAnimations)
  const avatarFrameRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const animationFrameRef = useRef<number>()
  const animationTransformAnchorRef = useRef<AvatarAnimationTransformAnchor>()
  const animationThumbnailCaptureRef = useRef<HTMLDivElement>(null)
  const animationThumbnailCaptureIdRef = useRef(0)
  const applyingUndoRef = useRef(false)
  const undoGroupTimerRef = useRef<number>()
  const undoStackRef = useRef<string[]>([])
  const resolvedTheme: AvatarTheme = themeOverride ?? (systemDark ? 'dark' : 'light')

  const selectedPalette = getAvatarPalette(selectedPaletteId)
  const resolvedFaceStyle = useMemo(
    () => ({ ...DEFAULT_AVATAR_FACE_STYLE, ...faceStyle }),
    [faceStyle]
  )
  const resolvedFaceShadowStyle = useMemo(
    () => ({ ...DEFAULT_AVATAR_FACE_SHADOW_STYLE, ...faceShadowStyle }),
    [faceShadowStyle]
  )
  const lightDirection = useMemo(
    () => ({ azimuth: lightAzimuth, elevation: lightElevation }),
    [lightAzimuth, lightElevation]
  )
  const frameShadow = useMemo(() => {
    if (!showFrameShadow) return 'none'
    const direction = frameShadowStyle.direction * Math.PI / 180
    const x = Math.cos(direction) * frameShadowStyle.distance
    const y = Math.sin(direction) * frameShadowStyle.distance
    return `${x.toFixed(2)}px ${y.toFixed(2)}px ${frameShadowStyle.softness}px color-mix(in srgb, ${
      frameShadowStyle.color ?? selectedPalette.shadow
    } ${frameShadowStyle.opacity}%, transparent)`
  }, [frameShadowStyle, selectedPalette.shadow, showFrameShadow])
  const previewEmoticon = `${leftEye}${mouth}${rightEye}`
  const visiblePalettes = useMemo(() => {
    return showMorePalettes ? AVATAR_PALETTES : AVATAR_PALETTES.slice(0, DEFAULT_PALETTE_COUNT)
  }, [showMorePalettes])
  const hiddenPaletteCount = Math.max(AVATAR_PALETTES.length - DEFAULT_PALETTE_COUNT, 0)
  const sharedAnimationQuery = useMemo(() => {
    if (selectedAnimationKey == null || selectedAnimationKey.startsWith('preset:') || animationKeyframes.length < 2) {
      return null
    }
    return serializeSharedAvatarAnimation({
      createdAt: 0,
      id: 'shared',
      keyframes: animationKeyframes,
      lockStartPosition: animationLockStartPosition,
      name: animationName,
      playbackMode: animationPlaybackMode,
      startFrameIndex: animationStartFrameIndex,
      version: 3
    })
  }, [
    animationKeyframes,
    animationLockStartPosition,
    animationName,
    animationPlaybackMode,
    animationStartFrameIndex,
    selectedAnimationKey
  ])
  const currentDocumentAnimation = useMemo<SavedAvatarAnimation | null>(() => {
    if (animationKeyframes.length < 2) return null
    return {
      createdAt: 0,
      id: 'document',
      keyframes: animationKeyframes,
      lockStartPosition: animationLockStartPosition,
      name: animationName.trim() || 'Untitled animation',
      playbackMode: animationPlaybackMode,
      startFrameIndex: Math.min(animationStartFrameIndex, animationKeyframes.length - 1),
      version: 3
    }
  }, [
    animationKeyframes,
    animationLockStartPosition,
    animationName,
    animationPlaybackMode,
    animationStartFrameIndex
  ])
  const currentDefinition = useMemo(() =>
    createAvatarDefinition({
      animation: animationDraftSource === 'builtin' ? null : currentDocumentAnimation,
      animationLibraryIds: animationLibraries.map(library => library.id),
      animationTargetKey: selectedAnimationKey,
      avatarOutlineStyle,
      avatarShadowStyle,
      backgroundStyle,
      bodyShape,
      cameraBackground,
      cameraFrame,
      colorGrade: avatarColorGrade,
      entityParts,
      entityPreset,
      exportSize,
      faceShadowStyle: resolvedFaceShadowStyle,
      faceStyle: resolvedFaceStyle,
      frameShadowStyle,
      glyph: { leftEye, linkEyes, mouth, rightEye },
      gridDensity,
      interactionMode,
      lightAzimuth,
      lightDistance,
      lightElevation,
      paletteId: selectedPaletteId,
      showAvatarShadow,
      showFrameShadow,
      showLight,
      showOutline,
      showShadow,
      surfaceDecals,
      viewState: avatarViewState
    }, definition), [
    avatarOutlineStyle,
    avatarShadowStyle,
    avatarViewState,
    backgroundStyle,
    bodyShape,
    cameraBackground,
    cameraFrame,
    avatarColorGrade,
    animationDraftSource,
    animationLibraries,
    currentDocumentAnimation,
    definition,
    entityParts,
    entityPreset,
    exportSize,
    frameShadowStyle,
    gridDensity,
    interactionMode,
    leftEye,
    lightAzimuth,
    lightDistance,
    lightElevation,
    linkEyes,
    mouth,
    resolvedFaceShadowStyle,
    resolvedFaceStyle,
    rightEye,
    selectedAnimationKey,
    selectedPaletteId,
    showAvatarShadow,
    showFrameShadow,
    showLight,
    showOutline,
    showShadow,
    surfaceDecals
  ])
  const currentDefinitionFingerprint = useMemo(
    () => JSON.stringify(currentDefinition),
    [currentDefinition]
  )
  const lastEmittedDefinitionFingerprintRef = useRef(
    definition == null ? null : JSON.stringify(definition)
  )
  const publicAnimationEntries = useMemo(() =>
    flattenAvatarAnimationLibraries(
      [definition?.animations, ...animationLibraries].filter(
        (library): library is AvatarAnimationLibrary => library != null
      ),
      currentDefinition.scene
    ), [animationLibraries, currentDefinition.scene, definition?.animations])
  const publicAnimations = useMemo(
    () => publicAnimationEntries.map(entry => entry.animation),
    [publicAnimationEntries]
  )

  useEffect(() => {
    if (!embedded || animationPlaying) return
    if (lastEmittedDefinitionFingerprintRef.current === currentDefinitionFingerprint) return
    lastEmittedDefinitionFingerprintRef.current = currentDefinitionFingerprint
    onDefinitionChange?.(currentDefinition)
  }, [
    animationPlaying,
    currentDefinition,
    currentDefinitionFingerprint,
    embedded,
    onDefinitionChange
  ])

  useEffect(() => {
    setThemeOverride(theme === 'system' ? null : theme)
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    setSystemDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (embedded) return
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [embedded, resolvedTheme])

  useEffect(() => {
    const stage = stageRef.current
    if (stage == null) return

    const updateStageWidthState = () => {
      setStageNarrow(stage.getBoundingClientRect().width < window.innerWidth * .5)
    }
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateStageWidthState)
    resizeObserver?.observe(stage)
    window.addEventListener('resize', updateStageWidthState)
    updateStageWidthState()
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateStageWidthState)
    }
  }, [])

  useEffect(() => {
    if (embedded) return
    const params = new URLSearchParams(window.location.search)
    params.set('sidebar', controlsCollapsed ? '0' : '1')
    params.set('animationPanel', animationOpen ? '1' : '0')
    if (selectedAnimationKey == null) {
      params.delete('animation')
      params.delete('animationData')
    } else if (selectedAnimationKey.startsWith('preset:')) {
      params.set('animation', selectedAnimationKey)
      params.delete('animationData')
    } else if (sharedAnimationQuery != null) {
      params.set('animation', 'shared')
      params.set('animationData', sharedAnimationQuery)
    }
    if (params.toString() === window.location.search.slice(1)) return

    const nextUrl = new URL(window.location.href)
    nextUrl.search = params.toString()
    window.history.replaceState(null, '', nextUrl)
  }, [animationOpen, controlsCollapsed, embedded, selectedAnimationKey, sharedAnimationQuery])

  useEffect(() => {
    if (embedded) return
    if (animationPlaying) return
    const params = new URLSearchParams()
    params.set('face', previewEmoticon)
    params.set('palette', selectedPalette.id)
    params.set('bg', backgroundStyle)
    params.set('shape', bodyShape)
    params.set('mode', interactionMode)
    params.set('yaw', formatQueryNumber(avatarViewState.yaw))
    params.set('pitch', formatQueryNumber(avatarViewState.pitch))
    params.set('roll', formatQueryNumber(avatarViewState.roll))
    params.set('positionX', formatQueryNumber(avatarViewState.positionX))
    params.set('positionY', formatQueryNumber(avatarViewState.positionY))
    params.set('scale', formatQueryNumber(avatarViewState.scale))
    params.set('camera', cameraMode ? '1' : '0')
    params.set('cameraBg', cameraBackground)
    params.set('cameraFrame', cameraFrame)
    params.set('eyes', linkEyes ? '1' : '0')
    params.set('eyeShape', resolvedFaceStyle.eyeShape)
    params.set('eyeRound', String(resolvedFaceStyle.eyeRoundness))
    params.set('eyeW', String(resolvedFaceStyle.width))
    params.set('eyeH', String(resolvedFaceStyle.height))
    if (resolvedFaceStyle.leftEyeHeight != null) {
      params.set('eyeLeftH', String(resolvedFaceStyle.leftEyeHeight))
    }
    if (resolvedFaceStyle.rightEyeHeight != null) {
      params.set('eyeRightH', String(resolvedFaceStyle.rightEyeHeight))
    }
    params.set('eyeGap', String(resolvedFaceStyle.gap))
    params.set('eyeRot', String(resolvedFaceStyle.rotation))
    params.set('eyeLeftRot', String(resolvedFaceStyle.leftEyeRotation))
    params.set('eyeRightRot', String(resolvedFaceStyle.rightEyeRotation))
    params.set('eyeHighlight', resolvedFaceStyle.eyeHighlight.enabled ? '1' : '0')
    params.set('eyeHighlightColor', resolvedFaceStyle.eyeHighlight.color)
    params.set('eyeHighlightSize', String(resolvedFaceStyle.eyeHighlight.size))
    params.set('eyeHighlightX', String(resolvedFaceStyle.eyeHighlight.offsetX))
    params.set('eyeHighlightY', String(resolvedFaceStyle.eyeHighlight.offsetY))
    params.set('eyeHighlightOpacity', String(resolvedFaceStyle.eyeHighlight.opacity))
    params.set('nose', resolvedFaceStyle.noseEnabled ? '1' : '0')
    params.set('noseShape', resolvedFaceStyle.noseShape)
    params.set('noseW', String(resolvedFaceStyle.noseWidth))
    params.set('noseH', String(resolvedFaceStyle.noseHeight))
    params.set('noseY', String(resolvedFaceStyle.noseY))
    params.set('noseRot', String(resolvedFaceStyle.noseRotation))
    params.set('mouth', resolvedFaceStyle.mouthEnabled ? '1' : '0')
    params.set('mouthShape', resolvedFaceStyle.mouthShape)
    params.set('mouthCurve', String(resolvedFaceStyle.mouthCurve))
    params.set('mouthW', String(resolvedFaceStyle.mouthWidth))
    params.set('mouthH', String(resolvedFaceStyle.mouthHeight))
    params.set('mouthY', String(resolvedFaceStyle.mouthY))
    params.set('mouthRot', String(resolvedFaceStyle.mouthRotation))
    params.set('light', showLight ? '1' : '0')
    params.set('lightAz', String(lightAzimuth))
    params.set('lightEl', String(lightElevation))
    params.set('lightDist', String(lightDistance))
    params.set('shadow', showShadow ? '1' : '0')
    params.set('shadowDir', String(resolvedFaceShadowStyle.direction))
    params.set('shadowDist', String(resolvedFaceShadowStyle.distance))
    params.set('shadowOpacity', String(resolvedFaceShadowStyle.opacity))
    params.set('shadowSoft', String(resolvedFaceShadowStyle.softness))
    if (resolvedFaceShadowStyle.color != null) {
      params.set('shadowColor', resolvedFaceShadowStyle.color)
    }
    params.set('avatarShadow', showAvatarShadow ? '1' : '0')
    params.set('avatarShadowColor', avatarShadowStyle.color ?? DEFAULT_AVATAR_SHADOW_STYLE.color ?? '#000000')
    params.set('avatarShadowDir', String(avatarShadowStyle.direction))
    params.set('avatarShadowDist', String(avatarShadowStyle.distance))
    params.set('avatarShadowOpacity', String(avatarShadowStyle.opacity))
    params.set('avatarShadowSoft', String(avatarShadowStyle.softness))
    params.set('outline', showOutline ? '1' : '0')
    params.set('outlineColor', avatarOutlineStyle.color)
    params.set('outlineWidth', String(avatarOutlineStyle.width))
    params.set('outlineOpacity', String(avatarOutlineStyle.opacity))
    params.set('frameShadow', showFrameShadow ? '1' : '0')
    params.set('frameShadowDir', String(frameShadowStyle.direction))
    params.set('frameShadowDist', String(frameShadowStyle.distance))
    params.set('frameShadowOpacity', String(frameShadowStyle.opacity))
    params.set('frameShadowSoft', String(frameShadowStyle.softness))
    if (frameShadowStyle.color != null) params.set('frameShadowColor', frameShadowStyle.color)
    params.set('gridDensity', String(gridDensity))
    if (entityPreset === 'custom') {
      params.delete('entity')
      params.delete('entityParts')
    } else {
      params.set('entity', entityPreset)
      params.set('entityParts', serializeAvatarEntityParts(entityParts))
    }
    if (surfaceDecals.length > 0) params.set('decals', serializeAvatarSurfaceDecals(surfaceDecals))
    params.delete('objects')
    params.set('size', String(exportSize))
    params.set('sidebar', controlsCollapsed ? '0' : '1')
    params.set('animationPanel', animationOpen ? '1' : '0')
    if (selectedAnimationKey?.startsWith('preset:')) {
      params.set('animation', selectedAnimationKey)
    } else if (sharedAnimationQuery != null) {
      params.set('animation', 'shared')
      params.set('animationData', sharedAnimationQuery)
    }

    const nextSearch = `?${params.toString()}`
    try {
      window.localStorage.setItem(LAST_EDITOR_QUERY_STORAGE_KEY, nextSearch)
    } catch {
      // Some embedded and private browsing contexts disable local storage.
    }
    if (window.location.search === nextSearch) return

    if (!applyingUndoRef.current) {
      const currentSearch = window.location.search
      if (undoGroupTimerRef.current == null && undoStackRef.current.at(-1) !== currentSearch) {
        undoStackRef.current = [...undoStackRef.current.slice(-(UNDO_HISTORY_LIMIT - 1)), currentSearch]
      }
      window.clearTimeout(undoGroupTimerRef.current)
      undoGroupTimerRef.current = window.setTimeout(() => {
        undoGroupTimerRef.current = undefined
      }, UNDO_GROUP_DELAY_MS)
    }

    const nextUrl = new URL(window.location.href)
    nextUrl.search = params.toString()
    window.history.replaceState(null, '', nextUrl)
  }, [
    backgroundStyle,
    animationOpen,
    animationPlaying,
    avatarOutlineStyle,
    avatarShadowStyle,
    avatarViewState,
    bodyShape,
    cameraBackground,
    cameraFrame,
    cameraMode,
    controlsCollapsed,
    embedded,
    entityParts,
    entityPreset,
    exportSize,
    frameShadowStyle,
    gridDensity,
    lightAzimuth,
    lightDistance,
    lightElevation,
    interactionMode,
    linkEyes,
    previewEmoticon,
    resolvedFaceStyle,
    resolvedFaceShadowStyle,
    selectedPalette.id,
    selectedAnimationKey,
    sharedAnimationQuery,
    showLight,
    showOutline,
    showAvatarShadow,
    showFrameShadow,
    showShadow,
    surfaceDecals
  ])

  useEffect(() => {
    if (embedded) return
    const handleUndo = (event: globalThis.KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.key.toLowerCase() !== 'z' || event.isComposing) {
        return
      }
      const target = event.target instanceof HTMLElement ? event.target : null
      const editable = target?.closest('input, textarea, [contenteditable="true"]')
      if (
        editable instanceof HTMLTextAreaElement ||
        editable instanceof HTMLElement && editable.isContentEditable ||
        editable instanceof HTMLInputElement &&
          !['button', 'checkbox', 'color', 'radio', 'range'].includes(editable.type)
      ) {
        return
      }

      const previousSearch = undoStackRef.current.pop()
      if (previousSearch == null) return
      event.preventDefault()
      window.clearTimeout(undoGroupTimerRef.current)
      undoGroupTimerRef.current = undefined
      applyingUndoRef.current = true

      const config = parseQueryConfig(new URLSearchParams(previousSearch))
      const nextUrl = new URL(window.location.href)
      nextUrl.search = previousSearch
      window.history.replaceState(null, '', nextUrl)
      if (animationFrameRef.current != null) window.cancelAnimationFrame(animationFrameRef.current)
      setAnimationPlaying(false)
      setActiveAnimationKeyframe(null)
      setAvatarColorGrade(DEFAULT_AVATAR_COLOR_GRADE)
      setAnimationOpen(config.animationOpen)
      setAvatarOutlineStyle(config.avatarOutlineStyle)
      setAvatarShadowStyle(config.avatarShadowStyle)
      setAvatarViewState(config.viewState)
      setAnimationPreviewViewState(config.viewState)
      setBackgroundStyle(config.backgroundStyle)
      setBodyShape(config.bodyShape)
      setCameraBackground(config.cameraBackground)
      setCameraFrame(config.cameraFrame)
      setCameraMode(config.cameraMode)
      setControlsCollapsed(config.controlsCollapsed)
      setEntityParts(config.entityParts)
      setEntityPreset(config.entityPreset)
      setSurfaceDecals(config.surfaceDecals)
      setSelectedSurfaceDecalId(null)
      setExportSize(config.exportSize)
      setFaceShadowStyle(config.faceShadowStyle)
      setFaceStyle(config.faceStyle)
      setAnimationPreviewFaceStyle(config.faceStyle)
      setFrameShadowStyle(config.frameShadowStyle)
      setGridDensity(config.gridDensity)
      setInteractionMode(config.interactionMode)
      setLightAzimuth(config.lightAzimuth)
      setLightDistance(config.lightDistance)
      setLightElevation(config.lightElevation)
      setSelectedEntityPartId(null)
      setSelectedPaletteId(config.selectedPaletteId)
      setSelectedSavedPresetId(null)
      setShowAvatarShadow(config.showAvatarShadow)
      setShowFrameShadow(config.showFrameShadow)
      setShowLight(config.showLight)
      setShowMorePalettes(
        AVATAR_PALETTES.findIndex(palette => palette.id === config.selectedPaletteId) >= DEFAULT_PALETTE_COUNT
      )
      setShowOutline(config.showOutline)
      setShowShadow(config.showShadow)
      setCopyState('idle')
      window.requestAnimationFrame(() => {
        applyingUndoRef.current = false
      })
    }

    window.addEventListener('keydown', handleUndo)
    return () => {
      window.removeEventListener('keydown', handleUndo)
      window.clearTimeout(undoGroupTimerRef.current)
    }
  }, [embedded])

  useEffect(() => {
    if (embedded) return
    if (selectedSavedPresetId == null) return
    const selectedPreset = savedPresets.find(preset => preset.id === selectedSavedPresetId)
    if (selectedPreset != null && selectedPreset.query !== window.location.search) {
      setSelectedSavedPresetId(null)
    }
  }, [
    avatarOutlineStyle,
    avatarShadowStyle,
    avatarViewState,
    backgroundStyle,
    bodyShape,
    cameraBackground,
    cameraFrame,
    cameraMode,
    entityParts,
    entityPreset,
    exportSize,
    faceShadowStyle,
    faceStyle,
    frameShadowStyle,
    gridDensity,
    embedded,
    interactionMode,
    lightAzimuth,
    lightDistance,
    lightElevation,
    savedPresets,
    selectedPaletteId,
    selectedSavedPresetId,
    showLight,
    showOutline,
    showAvatarShadow,
    showFrameShadow,
    showShadow,
    surfaceDecals
  ])

  useEffect(() => {
    if (animationThumbnailCapture == null) return
    const captureRequest = animationThumbnailCapture
    let cancelled = false
    const renderFrame = window.requestAnimationFrame(() => {
      const sourceSvgs = Array.from(
        animationThumbnailCaptureRef.current?.querySelectorAll<SVGSVGElement>('svg.interactive-avatar__canvas') ?? []
      )
      if (sourceSvgs.length !== captureRequest.keyframes.length) {
        console.error('Unable to capture animation thumbnails: rendered frame count mismatch')
        setAnimationThumbnailCapture(current => current?.id === captureRequest.id ? null : current)
        return
      }

      void Promise.all(
        sourceSvgs.map(sourceSvg => captureAvatarScreenshot(sourceSvg))
      ).then(screenshots => {
        if (cancelled || animationThumbnailCaptureIdRef.current !== captureRequest.id) return
        const capturedKeyframes = captureRequest.keyframes.map((keyframe, index) => ({
          colorGrade: keyframe.colorGrade,
          durationMs: keyframe.durationMs,
          easing: keyframe.easing,
          faceStyle: keyframe.faceStyle,
          pitch: keyframe.pitch,
          positionX: keyframe.positionX,
          positionY: keyframe.positionY,
          screenshot: screenshots[index],
          yaw: keyframe.yaw
        }))
        setAnimationKeyframes(currentKeyframes => {
          return currentKeyframes === captureRequest.keyframes ? capturedKeyframes : currentKeyframes
        })
        setAnimationThumbnailCapture(current => current?.id === captureRequest.id ? null : current)
      }).catch(error => {
        if (cancelled) return
        console.error('Unable to capture animation thumbnails', error)
        setAnimationThumbnailCapture(current => current?.id === captureRequest.id ? null : current)
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(renderFrame)
    }
  }, [animationThumbnailCapture])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current != null) window.cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const stopAnimationPlayback = () => {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    setAnimationPlaying(false)
    setAvatarColorGrade(DEFAULT_AVATAR_COLOR_GRADE)
  }

  const handleAvatarViewStateChange = (nextState: AvatarViewState) => {
    stopAnimationPlayback()
    setAvatarViewState(nextState)
    setAnimationPreviewViewState(nextState)
    setActiveAnimationKeyframe(null)
  }

  const avatarCaptureOptions = {
    background: cameraBackground,
    frame: cameraFrame,
    frameShadow: {
      ...frameShadowStyle,
      color: frameShadowStyle.color ?? selectedPalette.shadow
    },
    showFrameShadow
  }

  const handleEntityPresetChange = (preset: AvatarEntityPreset) => {
    const nextParts = createAvatarEntityParts(preset)
    const nextFaceStyle = getAvatarEntityPresetFaceStyle(preset)
    const nextScene = getAvatarEntityPresetScene(preset)
    stopAnimationPlayback()
    setActiveAnimationKeyframe(null)
    setAvatarColorGrade(DEFAULT_AVATAR_COLOR_GRADE)
    setEntityPreset(preset)
    setEntityParts(nextParts)
    setSelectedEntityPartId(null)
    setSurfaceDecals([])
    setSelectedSurfaceDecalId(null)
    setSelectedSavedPresetId(null)
    if (nextFaceStyle != null) {
      setFaceStyle(nextFaceStyle)
      setAnimationPreviewFaceStyle(nextFaceStyle)
    }
    if (nextScene != null) {
      setAvatarOutlineStyle(nextScene.avatarOutlineStyle)
      setAvatarShadowStyle(nextScene.avatarShadowStyle)
      setAvatarViewState(nextScene.viewState)
      setAnimationPreviewViewState(nextScene.viewState)
      setBackgroundStyle(nextScene.backgroundStyle)
      setBodyShape('sphere')
      setCameraBackground(nextScene.cameraBackground)
      setCameraFrame(nextScene.cameraFrame)
      setCameraMode(nextScene.cameraMode)
      setExportSize(DEFAULT_EXPORT_SIZE)
      setFrameShadowStyle(nextScene.frameShadowStyle)
      setInteractionMode(nextScene.interactionMode)
      setSelectedPaletteId(nextScene.paletteId)
      setShowAvatarShadow(nextScene.showAvatarShadow)
      setShowFrameShadow(nextScene.showFrameShadow)
      setShowLight(nextScene.showLight)
      setShowMorePalettes(false)
      setShowOutline(nextScene.showOutline)
      setShowShadow(nextScene.showShadow)
    }
    setCopyState('idle')
  }

  const handleCopy = async () => {
    const sourceSvg = avatarFrameRef.current?.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
    if (sourceSvg == null) return
    await navigator.clipboard.writeText(serializeAvatarSvg(sourceSvg, exportSize, {
      ...avatarCaptureOptions
    }))
    setCopyState('copied')
    window.setTimeout(() => setCopyState('idle'), 1400)
  }

  const handleDownload = () => {
    const sourceSvg = avatarFrameRef.current?.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
    if (sourceSvg == null) return
    downloadBlob(
      `oneworks-avatar-${entityPreset}-${exportSize}.svg`,
      new Blob([
        serializeAvatarSvg(sourceSvg, exportSize, {
          ...avatarCaptureOptions
        })
      ], { type: 'image/svg+xml;charset=utf-8' })
    )
  }

  const handlePngDownload = async () => {
    const sourceSvg = await waitForAvatarExportSvg(avatarFrameRef.current)
    if (sourceSvg == null) return false
    try {
      const png = await renderAvatarPngBlob(sourceSvg, exportSize, {
        ...avatarCaptureOptions
      })
      downloadBlob(`oneworks-avatar-${entityPreset}-${exportSize}.png`, png)
      return true
    } catch (error) {
      console.error('Unable to export avatar PNG', error)
      return false
    }
  }

  const handleGifDownload = async () => {
    if (animationKeyframes.length < 2 || gifExportState === 'exporting') return false
    stopAnimationPlayback()
    setGifExportState('exporting')
    try {
      const gif = await createAvatarGif({
        background: cameraBackground,
        currentViewState: avatarViewState,
        frame: cameraFrame,
        keyframes: animationKeyframes,
        lockStartPosition: animationLockStartPosition,
        playbackMode: animationPlaybackMode,
        renderProps: {
          avatarOutlineStyle,
          avatarShadowStyle,
          backgroundStyle,
          bodyShape,
          entityParts,
          entityPreset,
          gridDensity,
          lightDistance,
          lightDirection,
          palette: selectedPalette,
          shadowStyle: resolvedFaceShadowStyle,
          showAvatarShadow,
          showLight,
          showOutline,
          showShadow,
          surfaceDecals
        },
        size: exportSize,
        startFrameIndex: animationStartFrameIndex
      })
      downloadBlob(
        `oneworks-avatar-${entityPreset}-${animationName.trim() || 'animation'}-${exportSize}.gif`,
        gif
      )
      setGifExportState('idle')
      return true
    } catch (error) {
      console.error('Unable to export avatar GIF', error)
      setGifExportState('error')
      return false
    }
  }

  const handleSavePreset = async () => {
    const sourceSvg = avatarFrameRef.current?.querySelector('svg')
    if (sourceSvg == null || savePresetState === 'saving') return
    setSavePresetState('saving')
    try {
      const screenshot = await captureAvatarScreenshot(sourceSvg, {
        background: cameraBackground,
        frame: cameraFrame
      })
      const preset: SavedAvatarPreset = {
        createdAt: Date.now(),
        id: globalThis.crypto?.randomUUID?.() ?? `preset-${Date.now()}`,
        query: embedded
          ? `?${avatarDefinitionToSearchParams(currentDefinition).toString()}`
          : window.location.search,
        screenshot,
        version: 1
      }
      const nextPresets = prependSavedAvatarPreset(savedPresets, preset)
      persistSavedAvatarPresets(nextPresets)
      setSavedPresets(nextPresets)
      setSelectedSavedPresetId(preset.id)
      setSavePresetState('saved')
      window.setTimeout(() => setSavePresetState('idle'), 1400)
    } catch (error) {
      console.error('Unable to save avatar preset', error)
      setSavePresetState('error')
    }
  }

  const handleSavedPresetSelect = (preset: SavedAvatarPreset) => {
    stopAnimationPlayback()
    const config = parseQueryConfig(new URLSearchParams(preset.query))
    setBackgroundStyle(config.backgroundStyle)
    setBodyShape(config.bodyShape)
    setEntityParts(config.entityParts)
    setEntityPreset(config.entityPreset)
    setSelectedEntityPartId(null)
    setSurfaceDecals(config.surfaceDecals)
    setSelectedSurfaceDecalId(null)
    setCameraBackground(config.cameraBackground)
    setCameraFrame(config.cameraFrame)
    setCameraMode(config.cameraMode)
    setExportSize(config.exportSize)
    setAvatarOutlineStyle(config.avatarOutlineStyle)
    setAvatarShadowStyle(config.avatarShadowStyle)
    setFaceShadowStyle(config.faceShadowStyle)
    setFaceStyle(config.faceStyle)
    setAnimationPreviewFaceStyle(config.faceStyle)
    setFrameShadowStyle(config.frameShadowStyle)
    setGridDensity(config.gridDensity)
    setInteractionMode(config.interactionMode)
    setLightAzimuth(config.lightAzimuth)
    setLightDistance(config.lightDistance)
    setLightElevation(config.lightElevation)
    setSelectedPaletteId(config.selectedPaletteId)
    setShowLight(config.showLight)
    setShowOutline(config.showOutline)
    setShowMorePalettes(
      AVATAR_PALETTES.findIndex(palette => palette.id === config.selectedPaletteId) >= DEFAULT_PALETTE_COUNT
    )
    setShowShadow(config.showShadow)
    setShowAvatarShadow(config.showAvatarShadow)
    setShowFrameShadow(config.showFrameShadow)
    setAvatarViewState(config.viewState)
    setAnimationPreviewViewState(config.viewState)
    setCopyState('idle')
    setSelectedSavedPresetId(preset.id)
  }

  const handleSavedPresetRemove = (presetId: string) => {
    setSavedPresets((currentPresets) => {
      const nextPresets = currentPresets.filter(preset => preset.id !== presetId)
      persistSavedAvatarPresets(nextPresets)
      return nextPresets
    })
    setSelectedSavedPresetId(currentId => currentId === presetId ? null : currentId)
  }

  const applyAnimationKeyframe = (keyframe: AvatarAnimationKeyframe) => {
    setAvatarViewState(currentState => ({
      pitch: keyframe.pitch,
      positionX: keyframe.positionX,
      positionY: keyframe.positionY,
      roll: currentState.roll,
      scale: currentState.scale,
      yaw: keyframe.yaw
    }))
    setFaceStyle(keyframe.faceStyle)
    setAvatarColorGrade(resolveAvatarColorGrade(keyframe.colorGrade))
  }

  const handleAddAnimationKeyframe = async () => {
    const sourceSvg = avatarFrameRef.current?.querySelector('svg')
    if (sourceSvg == null || keyframeCapturePending) return
    stopAnimationPlayback()
    setKeyframeCapturePending(true)
    const viewStateSnapshot = avatarViewState
    const faceStyleSnapshot = resolvedFaceStyle
    try {
      const screenshot = await captureAvatarScreenshot(sourceSvg)
      const keyframe = createAvatarAnimationKeyframe(
        viewStateSnapshot,
        faceStyleSnapshot,
        screenshot,
        avatarColorGrade
      )
      setAnimationKeyframes(currentKeyframes => {
        setActiveAnimationKeyframe(currentKeyframes.length)
        setSelectedAnimationKeyframe(currentKeyframes.length)
        return [...currentKeyframes, keyframe]
      })
      setAnimationDraftSource('custom')
    } catch (error) {
      console.error('Unable to capture animation keyframe', error)
    } finally {
      setKeyframeCapturePending(false)
    }
  }

  const handleAnimationKeyframeSelect = (index: number) => {
    const keyframe = animationKeyframes[index]
    if (keyframe == null) return
    stopAnimationPlayback()
    applyAnimationKeyframe(keyframe)
    setActiveAnimationKeyframe(index)
    setSelectedAnimationKeyframe(index)
  }

  const handleRemoveAnimationKeyframe = (index: number) => {
    stopAnimationPlayback()
    setAnimationKeyframes(currentKeyframes => currentKeyframes.filter((_, currentIndex) => currentIndex !== index))
    setAnimationStartFrameIndex(currentIndex => {
      const nextLength = Math.max(animationKeyframes.length - 1, 0)
      if (nextLength === 0) return 0
      if (currentIndex === index) return Math.min(index, nextLength - 1)
      return currentIndex > index ? currentIndex - 1 : Math.min(currentIndex, nextLength - 1)
    })
    setAnimationDraftSource(animationKeyframes.length <= 1 ? null : 'custom')
    setActiveAnimationKeyframe(currentIndex => {
      if (currentIndex == null || currentIndex === index) return null
      return currentIndex > index ? currentIndex - 1 : currentIndex
    })
    setSelectedAnimationKeyframe(currentIndex => {
      if (currentIndex == null || currentIndex === index) return null
      return currentIndex > index ? currentIndex - 1 : currentIndex
    })
  }

  const playAnimation = (
    keyframes: readonly AvatarAnimationKeyframe[],
    options: {
      readonly lockStartPosition?: boolean
      readonly mode: AvatarAnimationPlaybackMode
      readonly reuseTransformAnchor?: boolean
      readonly startFrameIndex?: number
    }
  ) => {
    if (keyframes.length < 2) return
    stopAnimationPlayback()
    const startFrameIndex = Math.min(
      Math.max(Math.round(options.startFrameIndex ?? 0), 0),
      keyframes.length - 1
    )
    const sourceIndices = keyframes.map((_, index) => index)
    const playbackSourceIndices = startFrameIndex === 0
      ? sourceIndices
      : [...sourceIndices.slice(startFrameIndex), ...sourceIndices.slice(0, startFrameIndex)]
    const playbackKeyframes = playbackSourceIndices.map(sourceIndex => keyframes[sourceIndex]!)
    const firstKeyframe = playbackKeyframes[0]
    if (firstKeyframe == null) return
    const transformAnchor = options.lockStartPosition
      ? { pitch: 0, positionX: 0, positionY: 0, yaw: 0 }
      : options.reuseTransformAnchor
      ? animationTransformAnchorRef.current ?? createAvatarAnimationTransformAnchor(avatarViewState, firstKeyframe)
      : createAvatarAnimationTransformAnchor(avatarViewState, firstKeyframe)
    animationTransformAnchorRef.current = transformAnchor
    const playbackScale = avatarViewState.scale
    const startedAt = performance.now()
    setAnimationPlaying(true)
    setAvatarColorGrade(resolveAvatarColorGrade(firstKeyframe.colorGrade))
    setActiveAnimationKeyframe(playbackSourceIndices[0] ?? 0)

    const tick = (now: number) => {
      const elapsed = Math.max(now - startedAt, 0)
      const segment = resolveAvatarAnimationTimedSegment(playbackKeyframes, elapsed, options.mode)
      const localProgress = easeAvatarAnimationProgress(segment.progress, segment.easing)
      const { fromIndex, toIndex } = segment
      const from = playbackKeyframes[fromIndex]
      const to = playbackKeyframes[toIndex]
      if (from == null || to == null) return
      const keyframe = applyAvatarAnimationTransformAnchor(
        interpolateAvatarAnimationKeyframes(from, to, localProgress),
        transformAnchor
      )
      setAvatarViewState(currentState => ({
        pitch: keyframe.pitch,
        positionX: keyframe.positionX,
        positionY: keyframe.positionY,
        roll: currentState.roll,
        scale: playbackScale,
        yaw: keyframe.yaw
      }))
      setFaceStyle(keyframe.faceStyle)
      setAvatarColorGrade(resolveAvatarColorGrade(keyframe.colorGrade))
      setActiveAnimationKeyframe(
        segment.finished
          ? playbackSourceIndices.at(-1) ?? keyframes.length - 1
          : playbackSourceIndices[fromIndex] ?? fromIndex
      )

      if (!segment.finished) {
        animationFrameRef.current = window.requestAnimationFrame(tick)
      } else {
        animationFrameRef.current = undefined
        setAnimationPlaying(false)
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(tick)
  }

  const handleSaveAnimation = () => {
    if (animationKeyframes.length < 2) return
    const currentAnimation = savedAnimations.find(animation => animation.id === editingSavedAnimationId)
    const animationId = currentAnimation?.id ?? globalThis.crypto?.randomUUID?.() ?? `animation-${Date.now()}`
    const animation: SavedAvatarAnimation = {
      createdAt: currentAnimation?.createdAt ?? Date.now(),
      id: animationId,
      keyframes: animationKeyframes.map(keyframe => ({
        ...keyframe,
        faceStyle: { ...keyframe.faceStyle }
      })),
      lockStartPosition: animationLockStartPosition,
      name: animationName.trim() || 'Untitled animation',
      playbackMode: animationPlaybackMode,
      startFrameIndex: Math.min(animationStartFrameIndex, animationKeyframes.length - 1),
      version: 3
    }
    const nextAnimations = currentAnimation == null
      ? prependSavedAvatarAnimation(savedAnimations, animation)
      : savedAnimations.map(savedAnimation => savedAnimation.id === animation.id ? animation : savedAnimation)
    persistSavedAvatarAnimations(nextAnimations)
    setSavedAnimations(nextAnimations)
    setEditingSavedAnimationId(animationId)
    setSelectedAnimationKey(`saved:${animationId}`)
    setAnimationDraftSource('saved')
  }

  const handleSavedAnimationSelect = (animation: SavedAvatarAnimation) => {
    stopAnimationPlayback()
    setAnimationOpen(true)
    setAnimationPlaybackMode(animation.playbackMode)
    setAnimationKeyframes(animation.keyframes)
    setAnimationName(animation.name)
    setAnimationStartFrameIndex(animation.startFrameIndex)
    setAnimationLockStartPosition(animation.lockStartPosition)
    setEditingSavedAnimationId(animation.id)
    setSelectedAnimationKey(`saved:${animation.id}`)
    setActiveAnimationKeyframe(animation.keyframes.length > 0 ? animation.startFrameIndex : null)
    setSelectedAnimationKeyframe(null)
    const firstKeyframe = animation.keyframes[animation.startFrameIndex]
    if (firstKeyframe != null && animation.lockStartPosition) applyAnimationKeyframe(firstKeyframe)
    setAnimationDraftSource('saved')
    requestAnimationThumbnailCapture(animation.keyframes)
    playAnimation(animation.keyframes, {
      lockStartPosition: animation.lockStartPosition,
      mode: animation.playbackMode,
      startFrameIndex: animation.startFrameIndex
    })
    return true
  }

  const handlePublicAnimationSelect = (animation: SavedAvatarAnimation) => {
    stopAnimationPlayback()
    setAnimationOpen(true)
    setAnimationPlaybackMode(animation.playbackMode)
    setAnimationKeyframes(animation.keyframes)
    setAnimationName(animation.name)
    setAnimationStartFrameIndex(animation.startFrameIndex)
    setAnimationLockStartPosition(animation.lockStartPosition)
    setEditingSavedAnimationId(null)
    setSelectedAnimationKey(animation.id as AvatarAnimationSelectionKey)
    setActiveAnimationKeyframe(animation.keyframes.length > 0 ? animation.startFrameIndex : null)
    setSelectedAnimationKeyframe(null)
    const firstKeyframe = animation.keyframes[animation.startFrameIndex]
    if (firstKeyframe != null && animation.lockStartPosition) applyAnimationKeyframe(firstKeyframe)
    setAnimationDraftSource('builtin')
    requestAnimationThumbnailCapture(animation.keyframes)
    playAnimation(animation.keyframes, {
      lockStartPosition: animation.lockStartPosition,
      mode: animation.playbackMode,
      startFrameIndex: animation.startFrameIndex
    })
    return true
  }

  const handleSavedAnimationRemove = (animation: SavedAvatarAnimation) => {
    const nextAnimations = savedAnimations.filter(savedAnimation => savedAnimation.id !== animation.id)
    persistSavedAvatarAnimations(nextAnimations)
    setSavedAnimations(nextAnimations)

    const libraryId = `saved:${animation.id}`
    if (editingSavedAnimationId !== animation.id && selectedAnimationKey !== libraryId) return
    stopAnimationPlayback()
    setEditingSavedAnimationId(null)
    setSelectedAnimationKey(null)
    setAnimationDraftSource(animationKeyframes.length > 0 ? 'custom' : null)
  }

  const handleAnimationLibraryDeselect = () => {
    stopAnimationPlayback()
    setEditingSavedAnimationId(null)
    setSelectedAnimationKey(null)
    setSelectedAnimationKeyframe(null)
    setActiveAnimationKeyframe(null)
    setAnimationKeyframes([])
    setAnimationName('Untitled animation')
    setAnimationStartFrameIndex(0)
    setAnimationLockStartPosition(false)
    setAnimationPlaybackMode('once')
    setAnimationDraftSource(null)
  }

  const handlePresetAnimationSelect = (preset: AvatarAnimationPreset) => {
    stopAnimationPlayback()
    const resolvedPreset = resolveAvatarAnimationPreset(
      preset,
      animationPreviewViewState,
      animationPreviewFaceStyle
    )
    setAnimationOpen(true)
    setAnimationPlaybackMode('loop')
    setAnimationKeyframes(resolvedPreset.keyframes)
    setAnimationName(preset.label)
    setAnimationStartFrameIndex(0)
    setAnimationLockStartPosition(false)
    setEditingSavedAnimationId(null)
    setSelectedAnimationKey(`preset:${preset.id}`)
    setActiveAnimationKeyframe(resolvedPreset.keyframes.length > 0 ? 0 : null)
    setSelectedAnimationKeyframe(null)
    setAnimationDraftSource('builtin')
    requestAnimationThumbnailCapture(resolvedPreset.keyframes)
    playAnimation(resolvedPreset.keyframes, {
      lockStartPosition: false,
      mode: 'loop'
    })
    return true
  }

  const restoredInitialAnimationSelectionRef = useRef(false)
  useEffect(() => {
    if (restoredInitialAnimationSelectionRef.current) return
    restoredInitialAnimationSelectionRef.current = true
    const selectionKey = initialConfig.animationSelectionKey
    if (selectionKey == null) return

    if (selectionKey === 'shared' && initialConfig.sharedAnimation != null) {
      handleSavedAnimationSelect(initialConfig.sharedAnimation)
      setEditingSavedAnimationId(null)
      setSelectedAnimationKey('shared')
      return
    }

    if (selectionKey.startsWith('preset:')) {
      const presetId = selectionKey.slice('preset:'.length)
      const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === presetId)
      if (preset != null) {
        handlePresetAnimationSelect(preset)
        return
      }
    }

    setSelectedAnimationKey(null)
  }, [initialConfig.animationSelectionKey, initialConfig.sharedAnimation, savedAnimations])

  const updateAnimationKeyframeTiming = (
    index: number,
    timing: Partial<Pick<AvatarAnimationKeyframe, 'durationMs' | 'easing'>>
  ) => {
    const nextKeyframes = animationKeyframes.map((keyframe, currentIndex) => {
      return currentIndex === index ? { ...keyframe, ...timing } : keyframe
    })
    if (nextKeyframes[index] == null) return
    setAnimationKeyframes(nextKeyframes)
    setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(nextKeyframes, {
        lockStartPosition: animationLockStartPosition,
        mode: animationPlaybackMode,
        reuseTransformAnchor: true,
        startFrameIndex: animationStartFrameIndex
      })
    }
  }

  const handleAnimationKeyframeDurationChange = (index: number, durationMs: number) => {
    updateAnimationKeyframeTiming(index, {
      durationMs: clampAvatarAnimationFrameDuration(durationMs)
    })
  }

  const handleAnimationKeyframeEasingChange = (index: number, easing: AvatarAnimationEasing) => {
    updateAnimationKeyframeTiming(index, { easing })
  }

  const handleAnimationPlaybackModeChange = (mode: AvatarAnimationPlaybackMode) => {
    setAnimationPlaybackMode(mode)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, {
        lockStartPosition: animationLockStartPosition,
        mode,
        reuseTransformAnchor: true,
        startFrameIndex: animationStartFrameIndex
      })
    }
  }

  const handleAnimationLockStartPositionChange = (lockStartPosition: boolean) => {
    setAnimationLockStartPosition(lockStartPosition)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, {
        lockStartPosition,
        mode: animationPlaybackMode,
        startFrameIndex: animationStartFrameIndex
      })
    }
  }

  const handleAnimationStartFrameChange = (startFrameIndex: number) => {
    setAnimationStartFrameIndex(startFrameIndex)
    setActiveAnimationKeyframe(startFrameIndex)
    setSelectedAnimationKeyframe(null)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, {
        lockStartPosition: animationLockStartPosition,
        mode: animationPlaybackMode,
        startFrameIndex
      })
    } else {
      const firstKeyframe = animationKeyframes[startFrameIndex]
      if (firstKeyframe != null) {
        const previewKeyframe = animationLockStartPosition
          ? firstKeyframe
          : applyAvatarAnimationTransformAnchor(
            firstKeyframe,
            createAvatarAnimationTransformAnchor(avatarViewState, firstKeyframe)
          )
        applyAnimationKeyframe(previewKeyframe)
      }
    }
  }

  const requestAnimationThumbnailCapture = (keyframes: readonly AvatarAnimationKeyframe[]) => {
    const captureId = animationThumbnailCaptureIdRef.current + 1
    animationThumbnailCaptureIdRef.current = captureId
    setAnimationThumbnailCapture({
      avatarOutlineStyle,
      backgroundStyle,
      bodyShape,
      entityParts,
      entityPreset,
      faceShadowStyle: resolvedFaceShadowStyle,
      gridDensity,
      id: captureId,
      keyframes,
      lightAzimuth,
      lightDistance,
      lightElevation,
      paletteId: selectedPaletteId,
      scale: avatarViewState.scale,
      showLight,
      showOutline,
      showShadow,
      surfaceDecals
    })
  }

  useEffect(() => {
    if (animationThumbnailCapture != null) return
    if (!animationKeyframes.some(keyframe => keyframe.thumbnailFrame != null)) return
    requestAnimationThumbnailCapture(animationKeyframes)
  }, [animationKeyframes, animationThumbnailCapture])

  const renderAnimationKeyframePreview = useCallback((keyframe: AvatarAnimationKeyframe) => {
    return (
      <InteractiveAvatar
        avatarOutlineStyle={avatarOutlineStyle}
        backgroundStyle={backgroundStyle}
        bodyShape={bodyShape}
        colorGrade={keyframe.colorGrade}
        entityParts={entityParts}
        entityPreset={entityPreset}
        surfaceDecals={surfaceDecals}
        faceStyleTransitionsEnabled={false}
        faceStyle={keyframe.faceStyle}
        gridDensity={25}
        interactive={false}
        interactionMode='rotate'
        lightDistance={lightDistance}
        lightDirection={lightDirection}
        onViewStateChange={ignoreAvatarViewStateChange}
        palette={selectedPalette}
        renderSurfaceCells={false}
        shadowStyle={resolvedFaceShadowStyle}
        showLight={showLight}
        showOutline={showOutline}
        showShadow={showShadow}
        viewState={{
          pitch: keyframe.pitch,
          positionX: 0,
          positionY: 0,
          roll: 0,
          scale: 1.15,
          yaw: keyframe.yaw
        }}
      />
    )
  }, [
    avatarOutlineStyle,
    backgroundStyle,
    bodyShape,
    entityParts,
    entityPreset,
    lightDirection,
    lightDistance,
    resolvedFaceShadowStyle,
    selectedPalette,
    showLight,
    showOutline,
    showShadow
  ])

  const renderAnimationPresetPreview = useCallback((preset: AvatarAnimationPreset) => {
    const resolvedPreset = resolveAvatarAnimationPreset(
      preset,
      animationPreviewViewState,
      animationPreviewFaceStyle
    )
    const previewKeyframe = resolvedPreset.keyframes[Math.floor(resolvedPreset.keyframes.length / 2)]
    return previewKeyframe == null ? null : renderAnimationKeyframePreview(previewKeyframe)
  }, [animationPreviewFaceStyle, animationPreviewViewState, renderAnimationKeyframePreview])

  const renderSavePreset = () => (
    <button
      className='avatar-app__save-preset'
      type='button'
      aria-label={savePresetState === 'saved' ? 'Preset saved' : t('Save current preset')}
      title={savePresetState === 'error' ? 'Unable to save preset' : t('Save current preset')}
      data-state={savePresetState}
      disabled={savePresetState === 'saving'}
      onClick={() => {
        void handleSavePreset()
      }}
    >
      {savePresetState === 'saved'
        ? (
          <svg viewBox='0 0 20 20' aria-hidden='true'>
            <path d='m4 10.2 3.6 3.6L16 5.8' />
          </svg>
        )
        : (
          <svg viewBox='0 0 20 20' aria-hidden='true'>
            <path d='M4 3h9l3 3v11H4Z' />
            <path d='M7 3v5h6V3M7 17v-5h6v5' />
          </svg>
        )}
    </button>
  )

  const renderCameraToggle = () => (
    <button
      className='avatar-app__camera-toggle'
      type='button'
      aria-controls='avatar-camera-frame'
      aria-label={cameraMode ? 'Exit camera mode' : 'Enter camera mode'}
      aria-pressed={cameraMode}
      title={cameraMode ? 'Exit camera mode' : 'Enter camera mode'}
      onClick={() => setCameraMode(value => !value)}
    >
      <svg viewBox='0 0 20 20' aria-hidden='true'>
        <path d='M3.2 6.8h3l1.2-2h5.2l1.2 2h3a1.5 1.5 0 0 1 1.5 1.5v6.2a1.5 1.5 0 0 1-1.5 1.5H3.2a1.5 1.5 0 0 1-1.5-1.5V8.3a1.5 1.5 0 0 1 1.5-1.5Z' />
        <circle cx='10' cy='11.2' r='3' />
      </svg>
    </button>
  )

  const renderInteractionModeControls = (docked = false) => (
    <div
      className={`avatar-app__interaction-mode${docked ? ' avatar-app__interaction-mode--docked' : ''}`}
      role='group'
      aria-label='Mouse drag behavior'
    >
      <button
        className='avatar-app__interaction-mode-option'
        type='button'
        aria-pressed={interactionMode === 'rotate'}
        aria-label='Rotate with primary drag'
        title='Rotate'
        onClick={() => {
          stopAnimationPlayback()
          setInteractionMode('rotate')
        }}
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M15.6 6.2A6.4 6.4 0 1 0 16.2 13M15.6 6.2V2.8M15.6 6.2h-3.4' />
        </svg>
      </button>
      <button
        className='avatar-app__interaction-mode-option'
        type='button'
        aria-pressed={interactionMode === 'move'}
        aria-label='Move with primary drag'
        title='Move'
        onClick={() => {
          stopAnimationPlayback()
          setInteractionMode('move')
        }}
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M10 2.5v15M7.7 4.8 10 2.5l2.3 2.3M7.7 15.2 10 17.5l2.3-2.3M2.5 10h15M4.8 7.7 2.5 10l2.3 2.3M15.2 7.7l2.3 2.3-2.3 2.3' />
        </svg>
      </button>
    </div>
  )

  const renderGlobalHeaderActions = () => (
    <>
      <a
        className='avatar-app__github-link'
        href={AVATAR_GITHUB_URL}
        target='_blank'
        rel='noreferrer'
        aria-label={t('Open Avatar on GitHub')}
        title='GitHub'
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M10 1.9a8.1 8.1 0 0 0-2.6 15.8c.4.1.6-.2.6-.4v-1.6c-2.4.5-2.9-1-2.9-1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-1.9-.2-3.9-1-3.9-4a3.1 3.1 0 0 1 .8-2.2c-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 2 .1 2.2.5.6.8 1.4.8 2.2 0 3.1-2 3.8-3.9 4 .3.3.6.8.6 1.6v2.4c0 .3.2.5.6.4A8.1 8.1 0 0 0 10 1.9Z' />
        </svg>
      </a>
      <button
        className='avatar-app__theme-toggle'
        type='button'
        aria-label={resolvedTheme === 'dark' ? t('Switch to light theme') : t('Switch to dark theme')}
        title={resolvedTheme === 'dark' ? t('Light theme') : t('Dark theme')}
        onClick={() => {
          setThemeOverride(resolvedTheme === 'dark' ? 'light' : 'dark')
        }}
      >
        {resolvedTheme === 'dark'
          ? (
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <circle cx='10' cy='10' r='3.2' />
              <path d='M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4' />
            </svg>
          )
          : (
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <path d='M16.9 12.6A7 7 0 0 1 7.4 3.1a7 7 0 1 0 9.5 9.5Z' />
            </svg>
          )}
      </button>
      <LanguageSwitcher />
    </>
  )

  return (
    <main
      className={`avatar-app${embedded && resolvedTheme === 'dark' ? ' dark' : ''}`}
      data-embedded={embedded ? 'true' : 'false'}
    >
      <section
        className='avatar-app__workspace'
        data-animation-open={animationOpen}
        data-controls-collapsed={controlsCollapsed}
        style={{ '--avatar-controls-width': `${controlsWidth}px` } as CSSProperties}
      >
        <section
          ref={stageRef}
          className='avatar-app__stage'
          aria-label={t('Selected avatar')}
          data-camera-background={cameraBackground === 'transparent' ? 'transparent' : 'color'}
          data-camera-mode={cameraMode}
          data-camera-frame={cameraFrame}
          style={{
            '--avatar-camera-background': cameraBackground,
            '--avatar-frame-shadow': frameShadow
          } as CSSProperties}
        >
          {onHome != null || !stageNarrow || controlsCollapsed
            ? (
              <div className='avatar-app__camera-tools'>
                {onHome == null
                  ? null
                  : (
                    <button
                      className='avatar-app__home-link'
                      type='button'
                      aria-label='Home'
                      title='Home'
                      onClick={onHome}
                    >
                      <svg viewBox='0 0 20 20' aria-hidden='true'>
                        <path d='m3 9 7-6 7 6v8H5V9' />
                        <path d='M8 17v-5h4v5' />
                      </svg>
                    </button>
                  )}
                {!stageNarrow || controlsCollapsed ? renderCameraToggle() : null}
              </div>
            )
            : null}
          <div className='avatar-app__stage-actions'>
            {cameraMode
              ? (
                <ExportToolbar
                  copyState={copyState}
                  exportSize={exportSize}
                  gifAvailable={animationKeyframes.length >= 2}
                  gifExportState={gifExportState}
                  onCopy={() => {
                    void handleCopy()
                  }}
                  onDownload={handleDownload}
                  onDownloadGif={handleGifDownload}
                  onDownloadPng={handlePngDownload}
                  onSizeChange={setExportSize}
                />
              )
              : !stageNarrow || controlsCollapsed
              ? renderSavePreset()
              : null}
            {controlsCollapsed ? renderGlobalHeaderActions() : null}
            {controlsCollapsed
              ? (
                <button
                  className='avatar-app__controls-toggle'
                  type='button'
                  aria-controls='avatar-controls'
                  aria-expanded='false'
                  aria-label='Show controls sidebar'
                  title='Show controls'
                  onClick={() => setControlsCollapsed(false)}
                >
                  <svg viewBox='0 0 20 20' aria-hidden='true'>
                    <rect x='2.5' y='3' width='15' height='14' rx='1.5' />
                    <path d='M13 3v14M9.5 7.2 6.7 10l2.8 2.8' />
                  </svg>
                </button>
              )
              : null}
          </div>
          <div className='avatar-app__stage-preview'>
            <div
              id='avatar-camera-frame'
              ref={avatarFrameRef}
              className='avatar-app__preview-art avatar-app__preview-art--hero'
            >
              <InteractiveAvatar
                avatarOutlineStyle={avatarOutlineStyle}
                avatarShadowStyle={avatarShadowStyle}
                backgroundStyle={backgroundStyle}
                bodyShape={bodyShape}
                colorGrade={avatarColorGrade}
                entityParts={entityParts}
                entityPreset={entityPreset}
                surfaceDecals={surfaceDecals}
                faceStyleTransitionsEnabled={!animationPlaying}
                faceStyle={resolvedFaceStyle}
                gridDensity={gridDensity}
                interactionMode={interactionMode}
                lightDistance={lightDistance}
                lightDirection={lightDirection}
                onEntityPartSelect={setSelectedEntityPartId}
                onViewStateChange={handleAvatarViewStateChange}
                palette={selectedPalette}
                selectedEntityPartId={selectedEntityPartId}
                shadowStyle={resolvedFaceShadowStyle}
                showLight={showLight}
                showOutline={showOutline}
                showAvatarShadow={showAvatarShadow}
                showShadow={showShadow}
                viewState={avatarViewState}
              />
            </div>
          </div>
          {animationOpen
            ? null
            : (
              <button
                className='avatar-app__animation-toggle'
                type='button'
                aria-controls='avatar-animation-panel'
                aria-expanded='false'
                aria-label={t('Open animation editor')}
                title='Animation'
                onClick={() => setAnimationOpen(true)}
              >
                <svg viewBox='0 0 20 20' aria-hidden='true'>
                  <path d='M3 5.5h14v9H3Z' />
                  <path d='m8 7.5 5 2.5-5 2.5Z' />
                </svg>
              </button>
            )}
          {interactionControlsDocked ? null : renderInteractionModeControls()}
          <AvatarOrientationControl
            viewState={avatarViewState}
            onReset={() =>
              handleAvatarViewStateChange({
                ...avatarViewState,
                pitch: DEFAULT_AVATAR_VIEW_STATE.pitch,
                roll: DEFAULT_AVATAR_VIEW_STATE.roll,
                yaw: DEFAULT_AVATAR_VIEW_STATE.yaw
              })}
            onViewStateChange={handleAvatarViewStateChange}
          />
        </section>

        <AvatarControls
          activeTab={activeTab}
          avatarOutlineStyle={avatarOutlineStyle}
          avatarShadowStyle={avatarShadowStyle}
          backgroundStyle={backgroundStyle}
          bodyShape={bodyShape}
          cameraBackground={cameraBackground}
          cameraFrame={cameraFrame}
          controlsWidth={controlsWidth}
          entityParts={entityParts}
          entityPreset={entityPreset}
          faceStyle={resolvedFaceStyle}
          faceShadowStyle={resolvedFaceShadowStyle}
          frameShadowStyle={frameShadowStyle}
          gridDensity={gridDensity}
          headerActions={
            <>
              {stageNarrow && !cameraMode ? renderSavePreset() : null}
              {stageNarrow ? renderCameraToggle() : null}
              {renderGlobalHeaderActions()}
            </>
          }
          hiddenPaletteCount={hiddenPaletteCount}
          lightAzimuth={lightAzimuth}
          lightDistance={lightDistance}
          lightElevation={lightElevation}
          onBackgroundStyleChange={(style) => {
            setBackgroundStyle(style)
            setCopyState('idle')
          }}
          onAvatarOutlineStyleChange={(nextStyle) => {
            setAvatarOutlineStyle(currentStyle => ({ ...currentStyle, ...nextStyle }))
            setCopyState('idle')
          }}
          onBodyShapeChange={(shape) => {
            setBodyShape(shape)
            setEntityParts([])
            setEntityPreset('custom')
            setSelectedEntityPartId(null)
            setSurfaceDecals([])
            setSelectedSurfaceDecalId(null)
            setCopyState('idle')
          }}
          onAddSurfaceDecal={() => {
            const id = globalThis.crypto?.randomUUID?.() ?? `decal-${Date.now()}`
            const targetPartId = selectedEntityPartId ?? entityParts.find(part => part.face)?.id ?? null
            setSurfaceDecals(current => [...current, createAvatarSurfaceDecal(id, targetPartId)])
            setSelectedSurfaceDecalId(id)
          }}
          onAvatarShadowStyleChange={(nextStyle) => {
            setAvatarShadowStyle(currentStyle => ({ ...currentStyle, ...nextStyle }))
          }}
          onCameraBackgroundChange={setCameraBackground}
          onCameraFrameChange={setCameraFrame}
          onCollapse={() => setControlsCollapsed(true)}
          onControlsWidthChange={setControlsWidth}
          onFaceStyleChange={(nextStyle) => {
            stopAnimationPlayback()
            setActiveAnimationKeyframe(null)
            const nextFaceStyle = { ...DEFAULT_AVATAR_FACE_STYLE, ...resolvedFaceStyle, ...nextStyle }
            setFaceStyle(nextFaceStyle)
            setAnimationPreviewFaceStyle(nextFaceStyle)
          }}
          onFaceShadowStyleChange={(nextStyle) => {
            setFaceShadowStyle(currentStyle => ({
              ...DEFAULT_AVATAR_FACE_SHADOW_STYLE,
              ...currentStyle,
              ...nextStyle
            }))
          }}
          onFrameShadowStyleChange={(nextStyle) => {
            setFrameShadowStyle(currentStyle => ({ ...currentStyle, ...nextStyle }))
          }}
          onGridDensityChange={setGridDensity}
          onResetFace={() => {
            stopAnimationPlayback()
            setActiveAnimationKeyframe(null)
            setFaceStyle(DEFAULT_AVATAR_FACE_STYLE)
            setAnimationPreviewFaceStyle(DEFAULT_AVATAR_FACE_STYLE)
          }}
          onDeleteSurfaceDecal={(id) => {
            setSurfaceDecals(current => current.filter(decal => decal.id !== id))
            setSelectedSurfaceDecalId(current => current === id ? null : current)
          }}
          onSelectSurfaceDecal={setSelectedSurfaceDecalId}
          onSurfaceDecalChange={(id, patch) => {
            setSurfaceDecals(current => current.map(decal => decal.id === id ? { ...decal, ...patch } : decal))
          }}
          onSavedPresetSelect={handleSavedPresetSelect}
          onSavedPresetRemove={handleSavedPresetRemove}
          onLightAzimuthChange={setLightAzimuth}
          onLightDistanceChange={setLightDistance}
          onLightElevationChange={setLightElevation}
          onPaletteChange={(paletteId) => {
            const nextPalette = getAvatarPalette(paletteId)
            stopAnimationPlayback()
            setActiveAnimationKeyframe(null)
            setSelectedPaletteId(paletteId)
            setEntityParts(currentParts => applyAvatarEntityPalette(currentParts, nextPalette))
            setCopyState('idle')
          }}
          onEntityPresetChange={handleEntityPresetChange}
          onEntityPartChange={(id, nextPart) => {
            setEntityParts(currentParts => currentParts.map(part => part.id === id ? { ...part, ...nextPart } : part))
            setCopyState('idle')
          }}
          onShowMorePalettesChange={() => setShowMorePalettes(value => !value)}
          onTabChange={setActiveTab}
          onToggleLight={() => setShowLight(value => !value)}
          onToggleOutline={() => {
            setShowOutline(value => !value)
            setCopyState('idle')
          }}
          onToggleAvatarShadow={() => setShowAvatarShadow(value => !value)}
          onToggleFrameShadow={() => setShowFrameShadow(value => !value)}
          onToggleShadow={() => {
            setShowShadow(value => !value)
            setCopyState('idle')
          }}
          selectedPalette={selectedPalette}
          selectedEntityPartId={selectedEntityPartId}
          selectedSavedPresetId={selectedSavedPresetId}
          selectedSurfaceDecalId={selectedSurfaceDecalId}
          savedPresets={savedPresets}
          showLight={showLight}
          showOutline={showOutline}
          showAvatarShadow={showAvatarShadow}
          showFrameShadow={showFrameShadow}
          showMorePalettes={showMorePalettes}
          showShadow={showShadow}
          surfaceDecals={surfaceDecals}
          visiblePalettes={visiblePalettes}
        />
        {animationOpen
          ? (
            <AnimationPanel
              activeKeyframeIndex={activeAnimationKeyframe}
              animationName={animationName}
              animationPresets={AVATAR_ANIMATION_PRESETS}
              startFrameIndex={animationStartFrameIndex}
              isCapturingKeyframe={keyframeCapturePending || animationThumbnailCapture != null}
              isPlaying={animationPlaying}
              interactionControls={interactionControlsDocked ? renderInteractionModeControls(true) : null}
              keyframes={animationKeyframes}
              lockStartPosition={animationLockStartPosition}
              onAddKeyframe={() => {
                void handleAddAnimationKeyframe()
              }}
              onAnimationNameChange={(name) => {
                setAnimationName(name)
                if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
              }}
              onStartFrameChange={handleAnimationStartFrameChange}
              onKeyframeDeselect={() => {
                setSelectedAnimationKeyframe(null)
                if (!animationPlaying) setActiveAnimationKeyframe(null)
              }}
              onKeyframeDurationChange={handleAnimationKeyframeDurationChange}
              onKeyframeEasingChange={handleAnimationKeyframeEasingChange}
              onKeyframeSelect={handleAnimationKeyframeSelect}
              onKeyframeRemove={handleRemoveAnimationKeyframe}
              onLibraryDeselect={handleAnimationLibraryDeselect}
              onLockStartPositionChange={handleAnimationLockStartPositionChange}
              onInteractionControlsDockChange={setInteractionControlsDocked}
              onClose={() => setAnimationOpen(false)}
              onPlay={() => {
                playAnimation(animationKeyframes, {
                  lockStartPosition: animationLockStartPosition,
                  mode: animationPlaybackMode,
                  startFrameIndex: animationStartFrameIndex
                })
              }}
              onPlaybackModeChange={handleAnimationPlaybackModeChange}
              onPresetSelect={handlePresetAnimationSelect}
              onPublicAnimationSelect={handlePublicAnimationSelect}
              onSavedAnimationRemove={handleSavedAnimationRemove}
              onSavedAnimationSelect={handleSavedAnimationSelect}
              onSave={handleSaveAnimation}
              onStop={stopAnimationPlayback}
              playbackMode={animationPlaybackMode}
              publicAnimations={publicAnimations}
              renderKeyframePreview={renderAnimationKeyframePreview}
              renderPresetPreview={renderAnimationPresetPreview}
              requiresReplacementConfirmation={shouldConfirmAnimationReplacement(
                animationDraftSource,
                animationKeyframes.length
              )}
              savedAnimations={savedAnimations}
              selectedLibraryId={selectedAnimationKey}
              selectedKeyframeIndex={selectedAnimationKeyframe}
            />
          )
          : null}
      </section>
      {animationThumbnailCapture == null
        ? null
        : (
          <div
            ref={animationThumbnailCaptureRef}
            className='avatar-app__preset-capture'
            aria-hidden='true'
          >
            {animationThumbnailCapture.keyframes.map((keyframe, index) => (
              <div
                key={`${animationThumbnailCapture.id}-${index}`}
                className='avatar-app__preset-capture-frame'
              >
                <InteractiveAvatar
                  avatarOutlineStyle={animationThumbnailCapture.avatarOutlineStyle}
                  backgroundStyle={animationThumbnailCapture.backgroundStyle}
                  bodyShape={animationThumbnailCapture.bodyShape}
                  colorGrade={keyframe.colorGrade}
                  entityParts={animationThumbnailCapture.entityParts}
                  entityPreset={animationThumbnailCapture.entityPreset}
                  surfaceDecals={animationThumbnailCapture.surfaceDecals}
                  faceStyleTransitionsEnabled={false}
                  faceStyle={keyframe.faceStyle}
                  gridDensity={25}
                  interactive={false}
                  interactionMode='rotate'
                  lightDistance={animationThumbnailCapture.lightDistance}
                  lightDirection={{
                    azimuth: animationThumbnailCapture.lightAzimuth,
                    elevation: animationThumbnailCapture.lightElevation
                  }}
                  onViewStateChange={ignoreAvatarViewStateChange}
                  palette={getAvatarPalette(animationThumbnailCapture.paletteId)}
                  renderSurfaceCells={false}
                  shadowStyle={animationThumbnailCapture.faceShadowStyle}
                  showLight={animationThumbnailCapture.showLight}
                  showOutline={animationThumbnailCapture.showOutline}
                  showShadow={animationThumbnailCapture.showShadow}
                  viewState={{
                    pitch: keyframe.pitch,
                    positionX: keyframe.positionX,
                    positionY: keyframe.positionY,
                    roll: 0,
                    scale: animationThumbnailCapture.scale,
                    yaw: keyframe.yaw
                  }}
                />
              </div>
            ))}
          </div>
        )}
    </main>
  )
}

export default App
