import './App.scss'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import {
  AVATAR_PALETTES,
  AVATAR_PRESETS,
  createAvatarSvg,
  getAvatarPalette,
  isSupportedAvatarEmoticon
} from '@oneworks/avatar'
import type { AvatarBackgroundStyle } from '@oneworks/avatar'

import { AnimationPanel } from './AnimationPanel'
import { AvatarControls } from './AvatarControls'
import type { AvatarCameraFrame, AvatarControlTab } from './AvatarControls'
import { EXPORT_SIZES, ExportToolbar } from './ExportToolbar'
import type { ExportSize } from './ExportToolbar'
import {
  AVATAR_BODY_SHAPES,
  AVATAR_VIEW_LIMITS,
  DEFAULT_AVATAR_VIEW_STATE,
  InteractiveAvatar
} from './InteractiveAvatar'
import type { AvatarBodyShape, AvatarInteractionMode, AvatarViewState } from './InteractiveAvatar'
import {
  AVATAR_ANIMATION_PRESETS,
  applyAvatarAnimationTransformAnchor,
  createAvatarAnimationTransformAnchor,
  createAvatarAnimationKeyframe,
  easeAvatarAnimationProgress,
  interpolateAvatarAnimationKeyframes,
  loadSavedAvatarAnimations,
  persistSavedAvatarAnimations,
  prependSavedAvatarAnimation,
  resolveAvatarAnimationPreset,
  resolveAvatarAnimationSegment,
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
import { DEFAULT_AVATAR_FACE_SHADOW_STYLE, DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type { AvatarEyeShape, AvatarFaceShadowStyle, AvatarFaceStyle, AvatarNoseShape } from './avatarGeometry'
import {
  captureAvatarScreenshot,
  loadSavedAvatarPresets,
  persistSavedAvatarPresets,
  prependSavedAvatarPreset
} from './savedAvatarPresets'
import type { SavedAvatarPreset } from './savedAvatarPresets'

const INITIAL_EMOTICON = AVATAR_PRESETS[0]?.emoticon ?? '0w0'
const INITIAL_PARTS = Array.from(INITIAL_EMOTICON)
const DEFAULT_PALETTE_COUNT = 16
const DEFAULT_PALETTE_ID = AVATAR_PALETTES[0]?.id ?? ''
const DEFAULT_BACKGROUND_STYLE: AvatarBackgroundStyle = 'solid'
const DEFAULT_EXPORT_SIZE: ExportSize = 256
const DEFAULT_LIGHT_AZIMUTH = -35
const DEFAULT_LIGHT_ELEVATION = 40
const DEFAULT_CAMERA_BACKGROUND = '#111315'
const DEFAULT_CAMERA_FRAME: AvatarCameraFrame = 'rounded'
const DEFAULT_CONTROLS_WIDTH = 420
const SYSTEM_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const AVATAR_GITHUB_URL = 'https://github.com/oneworks-ai/avatar'
type SavePresetState = 'error' | 'idle' | 'saved' | 'saving'
type AvatarTheme = 'dark' | 'light'

interface AvatarQueryConfig {
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly cameraBackground: string
  readonly cameraFrame: AvatarCameraFrame
  readonly cameraMode: boolean
  readonly exportSize: ExportSize
  readonly faceStyle: AvatarFaceStyle
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly lightAzimuth: number
  readonly lightElevation: number
  readonly interactionMode: AvatarInteractionMode
  readonly linkEyes: boolean
  readonly leftEye: string
  readonly mouth: string
  readonly rightEye: string
  readonly selectedPaletteId: string
  readonly showLight: boolean
  readonly showShadow: boolean
  readonly viewState: AvatarViewState
}

interface AnimationThumbnailCaptureRequest {
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly id: number
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly lightAzimuth: number
  readonly lightElevation: number
  readonly paletteId: string
  readonly scale: number
  readonly showLight: boolean
  readonly showShadow: boolean
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
  return value != null && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_CAMERA_BACKGROUND
}
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
const parseInteractionMode = (value: string | null): AvatarInteractionMode => {
  return value === 'move' || value === 'rotate' ? value : 'rotate'
}

const parseLinkEyes = (value: string | null, leftEye: string, rightEye: string) => {
  if (value === '1' || value === 'true' || value === 'same') return true
  if (value === '0' || value === 'false' || value === 'split') return false
  return leftEye === rightEye
}

const parseQueryConfig = (params: URLSearchParams): AvatarQueryConfig => {
  const queryFace = params.get('face') ?? ''
  const emoticon = isSupportedAvatarEmoticon(queryFace) ? queryFace : INITIAL_EMOTICON
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

  return {
    backgroundStyle,
    bodyShape: parseBodyShape(params.get('shape')),
    cameraBackground: parseCameraBackground(params.get('cameraBg')),
    cameraFrame: parseCameraFrame(params.get('cameraFrame')),
    cameraMode: parseShadow(params.get('camera')),
    exportSize: parseExportSize(params.get('size')),
    faceStyle: {
      eyeRoundness: parseRangeValue(params.get('eyeRound'), DEFAULT_AVATAR_FACE_STYLE.eyeRoundness, 0, 100),
      eyeShape: parseEyeShape(params.get('eyeShape')),
      gap: parseRangeValue(params.get('eyeGap'), DEFAULT_AVATAR_FACE_STYLE.gap, 0, 100),
      height: parseRangeValue(params.get('eyeH'), DEFAULT_AVATAR_FACE_STYLE.height, 20, 104),
      leftEyeRotation: parseRangeValue(
        params.get('eyeLeftRot'),
        DEFAULT_AVATAR_FACE_STYLE.leftEyeRotation,
        -90,
        90
      ),
      mouthCurve: parseRangeValue(params.get('mouthCurve'), DEFAULT_AVATAR_FACE_STYLE.mouthCurve, -100, 100),
      mouthEnabled: parseShadow(params.get('mouth')),
      mouthHeight: parseRangeValue(params.get('mouthH'), DEFAULT_AVATAR_FACE_STYLE.mouthHeight, 6, 36),
      mouthRotation: parseRangeValue(params.get('mouthRot'), DEFAULT_AVATAR_FACE_STYLE.mouthRotation, -45, 45),
      mouthWidth: parseRangeValue(params.get('mouthW'), DEFAULT_AVATAR_FACE_STYLE.mouthWidth, 16, 100),
      mouthY: parseRangeValue(params.get('mouthY'), DEFAULT_AVATAR_FACE_STYLE.mouthY, 24, 90),
      noseEnabled: parseShadow(params.get('nose')),
      noseHeight: parseRangeValue(params.get('noseH'), DEFAULT_AVATAR_FACE_STYLE.noseHeight, 6, 48),
      noseRotation: parseRangeValue(params.get('noseRot'), DEFAULT_AVATAR_FACE_STYLE.noseRotation, -90, 90),
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
      width: parseRangeValue(params.get('eyeW'), DEFAULT_AVATAR_FACE_STYLE.width, 12, 72)
    },
    faceShadowStyle: {
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
    interactionMode: parseInteractionMode(params.get('mode')),
    lightAzimuth: parseRangeValue(params.get('lightAz'), DEFAULT_LIGHT_AZIMUTH, -180, 180),
    lightElevation: parseRangeValue(params.get('lightEl'), DEFAULT_LIGHT_ELEVATION, -80, 80),
    leftEye,
    linkEyes,
    mouth,
    rightEye,
    selectedPaletteId,
    showLight: parseLight(params.get('light')),
    showShadow: parseShadow(params.get('shadow')),
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

const getInitialQueryConfig = () => {
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
  return parseQueryConfig(params)
}

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [initialConfig] = useState(getInitialQueryConfig)
  const [activeTab, setActiveTab] = useState<AvatarControlTab>('build')
  const [controlsCollapsed, setControlsCollapsed] = useState(false)
  const [controlsWidth, setControlsWidth] = useState(DEFAULT_CONTROLS_WIDTH)
  const [systemDark, setSystemDark] = useState(() => {
    return typeof window !== 'undefined' && window.matchMedia(SYSTEM_DARK_MEDIA_QUERY).matches
  })
  const [themeOverride, setThemeOverride] = useState<AvatarTheme | null>(null)
  const [interactionMode, setInteractionMode] = useState<AvatarInteractionMode>(initialConfig.interactionMode)
  const [avatarViewState, setAvatarViewState] = useState<AvatarViewState>(initialConfig.viewState)
  const [bodyShape, setBodyShape] = useState<AvatarBodyShape>(initialConfig.bodyShape)
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
  const [faceShadowStyle, setFaceShadowStyle] = useState<AvatarFaceShadowStyle>(initialConfig.faceShadowStyle)
  const [showLight, setShowLight] = useState(initialConfig.showLight)
  const [lightAzimuth, setLightAzimuth] = useState(initialConfig.lightAzimuth)
  const [lightElevation, setLightElevation] = useState(initialConfig.lightElevation)
  const [showShadow, setShowShadow] = useState(initialConfig.showShadow)
  const [exportSize, setExportSize] = useState<ExportSize>(initialConfig.exportSize)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [savePresetState, setSavePresetState] = useState<SavePresetState>('idle')
  const [savedPresets, setSavedPresets] = useState(loadSavedAvatarPresets)
  const [selectedSavedPresetId, setSelectedSavedPresetId] = useState<string | null>(null)
  const [animationOpen, setAnimationOpen] = useState(false)
  const [animationDurationMs, setAnimationDurationMs] = useState(2400)
  const [animationEasing, setAnimationEasing] = useState<AvatarAnimationEasing>('ease-in-out')
  const [animationPlaybackMode, setAnimationPlaybackMode] = useState<AvatarAnimationPlaybackMode>('once')
  const [animationKeyframes, setAnimationKeyframes] = useState<readonly AvatarAnimationKeyframe[]>([])
  const [animationDraftSource, setAnimationDraftSource] = useState<AvatarAnimationDraftSource>(null)
  const [activeAnimationKeyframe, setActiveAnimationKeyframe] = useState<number | null>(null)
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [keyframeCapturePending, setKeyframeCapturePending] = useState(false)
  const [animationThumbnailCapture, setAnimationThumbnailCapture] = useState<AnimationThumbnailCaptureRequest | null>(
    null
  )
  const [savedAnimations, setSavedAnimations] = useState(loadSavedAvatarAnimations)
  const avatarFrameRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const animationTransformAnchorRef = useRef<AvatarAnimationTransformAnchor>()
  const animationThumbnailCaptureRef = useRef<HTMLDivElement>(null)
  const animationThumbnailCaptureIdRef = useRef(0)
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
  const previewEmoticon = `${leftEye}${mouth}${rightEye}`
  const previewSvg = useMemo(() => {
    return createAvatarSvg({
      backgroundStyle,
      emoticon: previewEmoticon,
      palette: selectedPalette,
      showShadow,
      size: exportSize,
      title: `OneWorks ${previewEmoticon} avatar`
    })
  }, [backgroundStyle, exportSize, previewEmoticon, selectedPalette, showShadow])
  const visiblePalettes = useMemo(() => {
    return showMorePalettes ? AVATAR_PALETTES : AVATAR_PALETTES.slice(0, DEFAULT_PALETTE_COUNT)
  }, [showMorePalettes])
  const hiddenPaletteCount = Math.max(AVATAR_PALETTES.length - DEFAULT_PALETTE_COUNT, 0)

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    setSystemDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  useEffect(() => {
    if (animationPlaying) return
    const params = new URLSearchParams()
    params.set('face', previewEmoticon)
    params.set('palette', selectedPalette.id)
    params.set('bg', backgroundStyle)
    params.set('shape', bodyShape)
    params.set('mode', interactionMode)
    params.set('yaw', formatQueryNumber(avatarViewState.yaw))
    params.set('pitch', formatQueryNumber(avatarViewState.pitch))
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
    params.set('eyeGap', String(resolvedFaceStyle.gap))
    params.set('eyeRot', String(resolvedFaceStyle.rotation))
    params.set('eyeLeftRot', String(resolvedFaceStyle.leftEyeRotation))
    params.set('eyeRightRot', String(resolvedFaceStyle.rightEyeRotation))
    params.set('nose', resolvedFaceStyle.noseEnabled ? '1' : '0')
    params.set('noseShape', resolvedFaceStyle.noseShape)
    params.set('noseW', String(resolvedFaceStyle.noseWidth))
    params.set('noseH', String(resolvedFaceStyle.noseHeight))
    params.set('noseY', String(resolvedFaceStyle.noseY))
    params.set('noseRot', String(resolvedFaceStyle.noseRotation))
    params.set('mouth', resolvedFaceStyle.mouthEnabled ? '1' : '0')
    params.set('mouthCurve', String(resolvedFaceStyle.mouthCurve))
    params.set('mouthW', String(resolvedFaceStyle.mouthWidth))
    params.set('mouthH', String(resolvedFaceStyle.mouthHeight))
    params.set('mouthY', String(resolvedFaceStyle.mouthY))
    params.set('mouthRot', String(resolvedFaceStyle.mouthRotation))
    params.set('light', showLight ? '1' : '0')
    params.set('lightAz', String(lightAzimuth))
    params.set('lightEl', String(lightElevation))
    params.set('shadow', showShadow ? '1' : '0')
    params.set('shadowDir', String(resolvedFaceShadowStyle.direction))
    params.set('shadowDist', String(resolvedFaceShadowStyle.distance))
    params.set('shadowOpacity', String(resolvedFaceShadowStyle.opacity))
    params.set('shadowSoft', String(resolvedFaceShadowStyle.softness))
    params.set('size', String(exportSize))

    const nextSearch = `?${params.toString()}`
    if (window.location.search === nextSearch) return

    const nextUrl = new URL(window.location.href)
    nextUrl.search = params.toString()
    window.history.replaceState(null, '', nextUrl)
  }, [
    backgroundStyle,
    animationPlaying,
    avatarViewState,
    bodyShape,
    cameraBackground,
    cameraFrame,
    cameraMode,
    exportSize,
    lightAzimuth,
    lightElevation,
    interactionMode,
    linkEyes,
    previewEmoticon,
    resolvedFaceStyle,
    resolvedFaceShadowStyle,
    selectedPalette.id,
    showLight,
    showShadow
  ])

  useEffect(() => {
    if (selectedSavedPresetId == null) return
    const selectedPreset = savedPresets.find(preset => preset.id === selectedSavedPresetId)
    if (selectedPreset != null && selectedPreset.query !== window.location.search) {
      setSelectedSavedPresetId(null)
    }
  }, [
    avatarViewState,
    backgroundStyle,
    bodyShape,
    cameraBackground,
    cameraFrame,
    cameraMode,
    exportSize,
    faceShadowStyle,
    faceStyle,
    interactionMode,
    lightAzimuth,
    lightElevation,
    savedPresets,
    selectedPaletteId,
    selectedSavedPresetId,
    showLight,
    showShadow
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
          faceStyle: keyframe.faceStyle,
          ...(keyframe.offset == null ? {} : { offset: keyframe.offset }),
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
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(previewSvg)
    setCopyState('copied')
    window.setTimeout(() => setCopyState('idle'), 1400)
  }

  const handleDownload = () => {
    downloadTextFile(`oneworks-agent-${previewEmoticon}-${exportSize}.svg`, previewSvg)
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
        query: window.location.search,
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
    setCameraBackground(config.cameraBackground)
    setCameraFrame(config.cameraFrame)
    setCameraMode(config.cameraMode)
    setExportSize(config.exportSize)
    setFaceShadowStyle(config.faceShadowStyle)
    setFaceStyle(config.faceStyle)
    setInteractionMode(config.interactionMode)
    setLightAzimuth(config.lightAzimuth)
    setLightElevation(config.lightElevation)
    setSelectedPaletteId(config.selectedPaletteId)
    setShowLight(config.showLight)
    setShowMorePalettes(
      AVATAR_PALETTES.findIndex(palette => palette.id === config.selectedPaletteId) >= DEFAULT_PALETTE_COUNT
    )
    setShowShadow(config.showShadow)
    setAvatarViewState(config.viewState)
    setCopyState('idle')
    setSelectedSavedPresetId(preset.id)
  }

  const applyAnimationKeyframe = (keyframe: AvatarAnimationKeyframe) => {
    setAvatarViewState(currentState => ({
      pitch: keyframe.pitch,
      positionX: keyframe.positionX,
      positionY: keyframe.positionY,
      scale: currentState.scale,
      yaw: keyframe.yaw
    }))
    setFaceStyle(keyframe.faceStyle)
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
        screenshot
      )
      setAnimationKeyframes(currentKeyframes => {
        setActiveAnimationKeyframe(currentKeyframes.length)
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
  }

  const handleRemoveAnimationKeyframe = (index: number) => {
    stopAnimationPlayback()
    setAnimationKeyframes(currentKeyframes => currentKeyframes.filter((_, currentIndex) => currentIndex !== index))
    setAnimationDraftSource(animationKeyframes.length <= 1 ? null : 'custom')
    setActiveAnimationKeyframe(currentIndex => {
      if (currentIndex == null || currentIndex === index) return null
      return currentIndex > index ? currentIndex - 1 : currentIndex
    })
  }

  const playAnimation = (
    keyframes: readonly AvatarAnimationKeyframe[],
    durationMs: number,
    options: {
      readonly easing: AvatarAnimationEasing
      readonly mode: AvatarAnimationPlaybackMode
      readonly reuseTransformAnchor?: boolean
    }
  ) => {
    if (keyframes.length < 2) return
    stopAnimationPlayback()
    const firstKeyframe = keyframes[0]
    if (firstKeyframe == null) return
    const transformAnchor = options.reuseTransformAnchor
      ? animationTransformAnchorRef.current ?? createAvatarAnimationTransformAnchor(avatarViewState, firstKeyframe)
      : createAvatarAnimationTransformAnchor(avatarViewState, firstKeyframe)
    animationTransformAnchorRef.current = transformAnchor
    const playbackScale = avatarViewState.scale
    const startedAt = performance.now()
    setAnimationPlaying(true)
    setActiveAnimationKeyframe(0)

    const tick = (now: number) => {
      const elapsed = Math.max(now - startedAt, 0)
      const rawProgress = options.mode === 'loop'
        ? (elapsed % durationMs) / durationMs
        : Math.min(elapsed / durationMs, 1)
      const segment = resolveAvatarAnimationSegment(keyframes, rawProgress)
      const localProgress = easeAvatarAnimationProgress(segment.progress, options.easing)
      const { fromIndex, toIndex } = segment
      const from = keyframes[fromIndex]
      const to = keyframes[toIndex]
      if (from == null || to == null) return
      const keyframe = applyAvatarAnimationTransformAnchor(
        interpolateAvatarAnimationKeyframes(from, to, localProgress),
        transformAnchor
      )
      setAvatarViewState({
        pitch: keyframe.pitch,
        positionX: keyframe.positionX,
        positionY: keyframe.positionY,
        scale: playbackScale,
        yaw: keyframe.yaw
      })
      setFaceStyle(keyframe.faceStyle)
      setActiveAnimationKeyframe(rawProgress >= 1 ? keyframes.length - 1 : fromIndex)

      if (options.mode === 'loop' || rawProgress < 1) {
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
    const animation: SavedAvatarAnimation = {
      createdAt: Date.now(),
      durationMs: animationDurationMs,
      id: globalThis.crypto?.randomUUID?.() ?? `animation-${Date.now()}`,
      keyframes: animationKeyframes.map(keyframe => ({
        ...keyframe,
        faceStyle: { ...keyframe.faceStyle }
      })),
      version: 1
    }
    const nextAnimations = prependSavedAvatarAnimation(savedAnimations, animation)
    persistSavedAvatarAnimations(nextAnimations)
    setSavedAnimations(nextAnimations)
  }

  const handleSavedAnimationSelect = (animation: SavedAvatarAnimation) => {
    if (!confirmAnimationReplacement()) return false
    stopAnimationPlayback()
    setAnimationOpen(true)
    setAnimationDurationMs(animation.durationMs)
    setAnimationPlaybackMode('loop')
    setAnimationKeyframes(animation.keyframes)
    setActiveAnimationKeyframe(animation.keyframes.length > 0 ? 0 : null)
    const firstKeyframe = animation.keyframes[0]
    if (firstKeyframe != null) applyAnimationKeyframe(firstKeyframe)
    setAnimationDraftSource('saved')
    requestAnimationThumbnailCapture(animation.keyframes)
    playAnimation(animation.keyframes, animation.durationMs, { easing: animationEasing, mode: 'loop' })
    return true
  }

  const handlePresetAnimationSelect = (preset: AvatarAnimationPreset) => {
    if (!confirmAnimationReplacement()) return false
    stopAnimationPlayback()
    const resolvedPreset = resolveAvatarAnimationPreset(preset, avatarViewState, resolvedFaceStyle)
    setAnimationOpen(true)
    setAnimationDurationMs(resolvedPreset.durationMs)
    setAnimationEasing('ease-in-out')
    setAnimationPlaybackMode('loop')
    setAnimationKeyframes(resolvedPreset.keyframes)
    setActiveAnimationKeyframe(resolvedPreset.keyframes.length > 0 ? 0 : null)
    setAnimationDraftSource('builtin')
    requestAnimationThumbnailCapture(resolvedPreset.keyframes)
    playAnimation(resolvedPreset.keyframes, resolvedPreset.durationMs, { easing: 'ease-in-out', mode: 'loop' })
    return true
  }

  const confirmAnimationReplacement = () => {
    if (!shouldConfirmAnimationReplacement(animationDraftSource, animationKeyframes.length)) return true
    return window.confirm('Replace the animation in Create? Its current keyframes will be discarded.')
  }

  const handleAnimationDurationChange = (durationMs: number) => {
    setAnimationDurationMs(durationMs)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, durationMs, {
        easing: animationEasing,
        mode: animationPlaybackMode,
        reuseTransformAnchor: true
      })
    }
  }

  const handleAnimationEasingChange = (easing: AvatarAnimationEasing) => {
    setAnimationEasing(easing)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, animationDurationMs, {
        easing,
        mode: animationPlaybackMode,
        reuseTransformAnchor: true
      })
    }
  }

  const handleAnimationPlaybackModeChange = (mode: AvatarAnimationPlaybackMode) => {
    setAnimationPlaybackMode(mode)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, animationDurationMs, {
        easing: animationEasing,
        mode,
        reuseTransformAnchor: true
      })
    }
  }

  const requestAnimationThumbnailCapture = (keyframes: readonly AvatarAnimationKeyframe[]) => {
    const captureId = animationThumbnailCaptureIdRef.current + 1
    animationThumbnailCaptureIdRef.current = captureId
    setAnimationThumbnailCapture({
      backgroundStyle,
      bodyShape,
      faceShadowStyle: resolvedFaceShadowStyle,
      id: captureId,
      keyframes,
      lightAzimuth,
      lightElevation,
      paletteId: selectedPalette.id,
      scale: avatarViewState.scale,
      showLight,
      showShadow
    })
  }

  useEffect(() => {
    if (animationThumbnailCapture != null) return
    if (!animationKeyframes.some(keyframe => keyframe.thumbnailFrame != null)) return
    requestAnimationThumbnailCapture(animationKeyframes)
  }, [animationKeyframes, animationThumbnailCapture])

  const renderAnimationKeyframePreview = (keyframe: AvatarAnimationKeyframe) => {
    return (
      <InteractiveAvatar
        backgroundStyle={backgroundStyle}
        bodyShape={bodyShape}
        faceStyleTransitionsEnabled={false}
        faceStyle={keyframe.faceStyle}
        interactive={false}
        interactionMode='rotate'
        lightDirection={lightDirection}
        onViewStateChange={ignoreAvatarViewStateChange}
        palette={selectedPalette}
        shadowStyle={resolvedFaceShadowStyle}
        showLight={showLight}
        showShadow={showShadow}
        viewState={{
          pitch: keyframe.pitch,
          positionX: 0,
          positionY: 0,
          scale: 1.15,
          yaw: keyframe.yaw
        }}
      />
    )
  }

  const renderAnimationPresetPreview = (preset: AvatarAnimationPreset) => {
    const resolvedPreset = resolveAvatarAnimationPreset(preset, avatarViewState, resolvedFaceStyle)
    const previewKeyframe = resolvedPreset.keyframes[Math.floor(resolvedPreset.keyframes.length / 2)]
    return previewKeyframe == null ? null : renderAnimationKeyframePreview(previewKeyframe)
  }

  return (
    <main className='avatar-app'>
      <section
        className='avatar-app__workspace'
        data-animation-open={animationOpen}
        data-controls-collapsed={controlsCollapsed}
        style={{ '--avatar-controls-width': `${controlsWidth}px` } as CSSProperties}
      >
        <section
          className='avatar-app__stage'
          aria-label='Selected avatar'
          data-camera-mode={cameraMode}
          data-camera-frame={cameraFrame}
          style={{ '--avatar-camera-background': cameraBackground } as CSSProperties}
        >
          <div className='avatar-app__camera-tools'>
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
          </div>
          <div className='avatar-app__stage-actions'>
            {cameraMode
              ? (
                <ExportToolbar
                  copyState={copyState}
                  exportSize={exportSize}
                  onCopy={() => {
                    void handleCopy()
                  }}
                  onDownload={handleDownload}
                  onSizeChange={setExportSize}
                />
              )
              : (
                <button
                  className='avatar-app__save-preset'
                  type='button'
                  aria-label={savePresetState === 'saved' ? 'Preset saved' : 'Save current preset'}
                  title={savePresetState === 'error' ? 'Unable to save preset' : 'Save current preset'}
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
              )}
            <a
              className='avatar-app__github-link'
              href={AVATAR_GITHUB_URL}
              target='_blank'
              rel='noreferrer'
              aria-label='Open Avatar on GitHub'
              title='GitHub'
            >
              <svg viewBox='0 0 20 20' aria-hidden='true'>
                <path d='M10 1.9a8.1 8.1 0 0 0-2.6 15.8c.4.1.6-.2.6-.4v-1.6c-2.4.5-2.9-1-2.9-1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-1.9-.2-3.9-1-3.9-4a3.1 3.1 0 0 1 .8-2.2c-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 2 .1 2.2.5.6.8 1.4.8 2.2 0 3.1-2 3.8-3.9 4 .3.3.6.8.6 1.6v2.4c0 .3.2.5.6.4A8.1 8.1 0 0 0 10 1.9Z' />
              </svg>
            </a>
            <button
              className='avatar-app__theme-toggle'
              type='button'
              aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme'}
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
            <button
              className='avatar-app__controls-toggle'
              type='button'
              aria-controls='avatar-controls'
              aria-label={controlsCollapsed ? 'Show controls sidebar' : 'Hide controls sidebar'}
              aria-pressed={controlsCollapsed}
              title={controlsCollapsed ? 'Show controls' : 'Hide controls'}
              onClick={() => setControlsCollapsed(value => !value)}
            >
              <svg viewBox='0 0 20 20' aria-hidden='true'>
                <rect x='2.5' y='3' width='15' height='14' rx='1.5' />
                <path d='M13 3v14M9.5 7.2 6.7 10l2.8 2.8' />
              </svg>
            </button>
          </div>
          <div className='avatar-app__stage-preview'>
            <div
              id='avatar-camera-frame'
              ref={avatarFrameRef}
              className='avatar-app__preview-art avatar-app__preview-art--hero'
            >
              <InteractiveAvatar
                backgroundStyle={backgroundStyle}
                bodyShape={bodyShape}
                faceStyleTransitionsEnabled={!animationPlaying}
                faceStyle={resolvedFaceStyle}
                interactionMode={interactionMode}
                lightDirection={lightDirection}
                onViewStateChange={(nextState) => {
                  stopAnimationPlayback()
                  setAvatarViewState(nextState)
                  setActiveAnimationKeyframe(null)
                }}
                palette={selectedPalette}
                shadowStyle={resolvedFaceShadowStyle}
                showLight={showLight}
                showShadow={showShadow}
                viewState={avatarViewState}
              />
            </div>
          </div>
          <button
            className='avatar-app__animation-toggle'
            type='button'
            aria-controls='avatar-animation-panel'
            aria-expanded={animationOpen}
            aria-label={animationOpen ? 'Close animation editor' : 'Open animation editor'}
            title={animationOpen ? 'Close animation editor' : 'Animation'}
            onClick={() => {
              if (animationOpen) stopAnimationPlayback()
              setAnimationOpen(value => !value)
            }}
          >
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <path d='M3 5.5h14v9H3Z' />
              <path d='m8 7.5 5 2.5-5 2.5Z' />
            </svg>
          </button>
          <div className='avatar-app__interaction-mode' role='group' aria-label='Mouse drag behavior'>
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
        </section>

        <AvatarControls
          activeTab={activeTab}
          backgroundStyle={backgroundStyle}
          bodyShape={bodyShape}
          cameraBackground={cameraBackground}
          cameraFrame={cameraFrame}
          controlsWidth={controlsWidth}
          faceStyle={resolvedFaceStyle}
          faceShadowStyle={resolvedFaceShadowStyle}
          hiddenPaletteCount={hiddenPaletteCount}
          lightAzimuth={lightAzimuth}
          lightElevation={lightElevation}
          onBackgroundStyleChange={(style) => {
            setBackgroundStyle(style)
            setCopyState('idle')
          }}
          onBodyShapeChange={setBodyShape}
          onCameraBackgroundChange={setCameraBackground}
          onCameraFrameChange={setCameraFrame}
          onControlsWidthChange={setControlsWidth}
          onFaceStyleChange={(nextStyle) => {
            stopAnimationPlayback()
            setActiveAnimationKeyframe(null)
            setFaceStyle(currentStyle => ({ ...DEFAULT_AVATAR_FACE_STYLE, ...currentStyle, ...nextStyle }))
          }}
          onFaceShadowStyleChange={(nextStyle) => {
            setFaceShadowStyle(currentStyle => ({
              ...DEFAULT_AVATAR_FACE_SHADOW_STYLE,
              ...currentStyle,
              ...nextStyle
            }))
          }}
          onResetFace={() => {
            stopAnimationPlayback()
            setActiveAnimationKeyframe(null)
            setFaceStyle(DEFAULT_AVATAR_FACE_STYLE)
          }}
          onSavedPresetSelect={handleSavedPresetSelect}
          onLightAzimuthChange={setLightAzimuth}
          onLightElevationChange={setLightElevation}
          onPaletteChange={(paletteId) => {
            setSelectedPaletteId(paletteId)
            setCopyState('idle')
          }}
          onShowMorePalettesChange={() => setShowMorePalettes(value => !value)}
          onTabChange={setActiveTab}
          onToggleLight={() => setShowLight(value => !value)}
          onToggleShadow={() => {
            setShowShadow(value => !value)
            setCopyState('idle')
          }}
          selectedPalette={selectedPalette}
          selectedSavedPresetId={selectedSavedPresetId}
          savedPresets={savedPresets}
          showLight={showLight}
          showMorePalettes={showMorePalettes}
          showShadow={showShadow}
          visiblePalettes={visiblePalettes}
        />
        {animationOpen
          ? (
            <AnimationPanel
              activeKeyframeIndex={activeAnimationKeyframe}
              animationPresets={AVATAR_ANIMATION_PRESETS}
              durationMs={animationDurationMs}
              easing={animationEasing}
              isCapturingKeyframe={keyframeCapturePending || animationThumbnailCapture != null}
              isPlaying={animationPlaying}
              keyframes={animationKeyframes}
              onAddKeyframe={() => {
                void handleAddAnimationKeyframe()
              }}
              onDurationChange={handleAnimationDurationChange}
              onEasingChange={handleAnimationEasingChange}
              onKeyframeSelect={handleAnimationKeyframeSelect}
              onKeyframeRemove={handleRemoveAnimationKeyframe}
              onPlay={() => {
                playAnimation(animationKeyframes, animationDurationMs, {
                  easing: animationEasing,
                  mode: animationPlaybackMode
                })
              }}
              onPlaybackModeChange={handleAnimationPlaybackModeChange}
              onPresetSelect={handlePresetAnimationSelect}
              onSavedAnimationSelect={handleSavedAnimationSelect}
              onSave={handleSaveAnimation}
              onStop={stopAnimationPlayback}
              playbackMode={animationPlaybackMode}
              renderKeyframePreview={renderAnimationKeyframePreview}
              renderPresetPreview={renderAnimationPresetPreview}
              savedAnimations={savedAnimations}
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
                  backgroundStyle={animationThumbnailCapture.backgroundStyle}
                  bodyShape={animationThumbnailCapture.bodyShape}
                  faceStyleTransitionsEnabled={false}
                  faceStyle={keyframe.faceStyle}
                  interactive={false}
                  interactionMode='rotate'
                  lightDirection={{
                    azimuth: animationThumbnailCapture.lightAzimuth,
                    elevation: animationThumbnailCapture.lightElevation
                  }}
                  onViewStateChange={ignoreAvatarViewStateChange}
                  palette={getAvatarPalette(animationThumbnailCapture.paletteId)}
                  shadowStyle={animationThumbnailCapture.faceShadowStyle}
                  showLight={animationThumbnailCapture.showLight}
                  showShadow={animationThumbnailCapture.showShadow}
                  viewState={{
                    pitch: keyframe.pitch,
                    positionX: keyframe.positionX,
                    positionY: keyframe.positionY,
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
