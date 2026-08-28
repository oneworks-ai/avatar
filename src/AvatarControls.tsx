import './AvatarControls.scss'

import {
  AVATAR_ENTITY_RANGES,
  AVATAR_COAT_PATTERN_RANGES,
  AVATAR_EYE_HIGHLIGHT_RANGES,
  AVATAR_FACE_RANGES,
  AVATAR_LIGHTING_RANGES,
  AVATAR_OUTLINE_RANGES,
  AVATAR_PALETTES,
  AVATAR_PIXEL_EFFECT_RANGES,
  AVATAR_SHADOW_RANGES,
  AVATAR_SURFACE_DECAL_RANGES,
  getAvatarPalette,
  resolveAvatarCoatPatternDecals
} from '@oneworks/avatar'
import type {
  AvatarBackgroundStyle,
  AvatarCoatPattern,
  AvatarCoatPatternAlgorithm,
  AvatarCoatPatternLightPatchShape,
  AvatarPalette,
  AvatarPixelEffect,
  AvatarPixelSampling
} from '@oneworks/avatar'
import { memo, useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'

import { AVATAR_BODY_SHAPES, EntityPresetPreview } from './InteractiveAvatar'
import type { AvatarBodyShape, AvatarDropShadowStyle, AvatarOutlineStyle } from './InteractiveAvatar'
import {
  AVATAR_BUILT_IN_ENTITY_PRESETS,
  BEAR_EAR_SCALE_RANGE,
  BEAR_HEAD_SCALE_RANGE,
  CAT_EAR_SCALE_RANGE,
  DOG_EAR_SCALE_RANGE,
  DOG_HEAD_SCALE_RANGE,
  RABBIT_EAR_SCALE_RANGE,
  RABBIT_HEAD_SCALE_RANGE,
  hasMultipleAvatarEntityMaterials,
  resolveAvatarEntityPartScaleZ
} from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import { AVATAR_FACE_PRESETS, DEFAULT_AVATAR_FACE_PRESET, isAvatarFacePresetSelected } from './avatarFacePresets'
import type { AvatarFacePreset } from './avatarFacePresets'
import { DEFAULT_AVATAR_FACE_STYLE, projectDefaultFace } from './avatarGeometry'
import type {
  AvatarEyeShape,
  AvatarFaceShadowStyle,
  AvatarFaceStyle,
  AvatarMouthShape,
  AvatarNoseShape
} from './avatarGeometry'
import { useAvatarLocale } from './avatarLocale'
import {
  AVATAR_ENTITY_PRESET_SNAPSHOT_URLS,
  DEFAULT_AVATAR_PREVIEW_LIGHT,
  getAvatarBreedPresetSnapshotUrl
} from './avatarPresetSnapshots'
import {
  AVATAR_BEAR_BREED_TEMPLATES,
  AVATAR_CAT_BREED_TEMPLATES,
  AVATAR_DOG_BREED_TEMPLATES,
  AVATAR_RABBIT_BREED_TEMPLATES,
  resolveAvatarBearBreedTemplate,
  resolveAvatarCatBreedTemplate,
  resolveAvatarDogBreedTemplate,
  resolveAvatarRabbitBreedTemplate
} from './avatarBreedTemplates'
import type { AvatarBearBreedTemplateId, AvatarCatBreedTemplateId, AvatarDogBreedTemplateId, AvatarRabbitBreedTemplateId } from './avatarBreedTemplates'
import { resolveAvatarBreedPaletteFromEntityParts } from './avatarBreedTone'
import {
  AVATAR_ANIMAL_SPECIES_SEED_FIELDS,
  AVATAR_CAMERA_BACKGROUND_PRESETS,
  AVATAR_SEED_FIELD,
  getAvatarAnimalEarSeedFields,
  isAvatarAnimalSpeciesId
} from './avatarSeed'
import type { AvatarAnimalSpeciesId, AvatarSeedField } from './avatarSeed'
import {
  getAvatarAnimalBreedTemplate,
  getAvatarAnimalBreedTemplates,
  getAvatarAnimalDetailSeedField,
  getAvatarAnimalHornSeedField,
  getAvatarAnimalScaleRange,
  resolveAvatarAnimalBreedTemplate
} from './avatarSpeciesBreeds'
import type { AvatarAnimalBreedTemplate } from './avatarSpeciesBreeds'
import {
  loadAvatarPresetUsage,
  persistAvatarPresetUsage,
  sortAvatarPresetItems,
  touchAvatarPresetUsage
} from './avatarPresetUsage'
import type { AvatarSurfaceDecal, AvatarSurfaceDecalShape } from './avatarSurfaceDecals'
import type { SavedAvatarPreset } from './savedAvatarPresets'

export type AvatarControlTab = 'animation' | 'body' | 'build' | 'effects' | 'style'
export type AvatarCameraFrame = 'circle' | 'rounded' | 'square'
type AvatarFacePart = 'eyes' | 'mouth' | 'nose'
type AvatarPresetBrowser = 'entities' | 'faces' | 'saved'
type AvatarSavedPresetItem =
  | {
    readonly createdAt: number
    readonly key: string
    readonly kind: 'entity'
    readonly preset: Exclude<AvatarEntityPreset, 'custom'>
  }
  | {
    readonly createdAt: number
    readonly key: string
    readonly kind: 'saved'
    readonly preset: SavedAvatarPreset
  }
type ControlIconName =
  | AvatarControlTab
  | 'background'
  | 'camera'
  | 'eyes'
  | 'gradient'
  | 'history'
  | 'light'
  | 'mouth'
  | 'nose'
  | 'outline'
  | 'palette'
  | 'pixel'
  | 'shadow'
  | 'solid'
  | 'transparent'
type GeometricShapeIconName =
  | 'circle'
  | 'curve'
  | 'ellipse'
  | 'face-mask'
  | 'inverted-triangle'
  | 'rounded'
  | 'square'

interface GeometricShapeOption<T extends string> {
  readonly icon: GeometricShapeIconName
  readonly id: T
  readonly label: string
}

interface AvatarPreviewScheduler {
  cacheSnapshot: (key: string, svg: string) => string
  enqueue: (key: string, activate: () => void) => () => void
  getSnapshot: (key: string) => string | null
  isReady: (key: string) => boolean
  markReady: (key: string) => void
}

type AvatarPreviewIdleWindow = Window & typeof globalThis & {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
}

const AVATAR_PREVIEW_SNAPSHOT_LIMIT = 96
const avatarPreviewSnapshotCache = new Map<string, string>()

const getAvatarPreviewSnapshot = (key: string) => {
  const snapshot = avatarPreviewSnapshotCache.get(key)
  if (snapshot == null) return null
  avatarPreviewSnapshotCache.delete(key)
  avatarPreviewSnapshotCache.set(key, snapshot)
  return snapshot
}

const cacheAvatarPreviewSnapshot = (key: string, svg: string) => {
  const namespacedSvg = svg.includes('xmlns=')
    ? svg
    : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  const snapshot = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(namespacedSvg)}`
  avatarPreviewSnapshotCache.delete(key)
  avatarPreviewSnapshotCache.set(key, snapshot)
  while (avatarPreviewSnapshotCache.size > AVATAR_PREVIEW_SNAPSHOT_LIMIT) {
    avatarPreviewSnapshotCache.delete(avatarPreviewSnapshotCache.keys().next().value!)
  }
  return snapshot
}

const createAvatarPreviewScheduler = (): AvatarPreviewScheduler => {
  const readyKeys = new Set<string>()
  const queuedKeys: string[] = []
  const subscribers = new Map<string, Set<() => void>>()
  let idleHandle: number | null = null
  let frameHandle: number | null = null

  const activateNext = () => {
    idleHandle = null
    let key = queuedKeys.shift()
    while (key != null && subscribers.get(key)?.size === 0) key = queuedKeys.shift()
    if (key == null) return
    readyKeys.add(key)
    const listeners = subscribers.get(key)
    subscribers.delete(key)
    listeners?.forEach(listener => listener())
    const idleWindow = window as AvatarPreviewIdleWindow
    if (idleWindow.requestIdleCallback == null) {
      scheduleNext()
      return
    }
    frameHandle = window.requestAnimationFrame(() => {
      frameHandle = null
      scheduleNext()
    })
  }

  const scheduleNext = () => {
    if (idleHandle != null || frameHandle != null || queuedKeys.length === 0) return
    const idleWindow = window as AvatarPreviewIdleWindow
    if (idleWindow.requestIdleCallback == null) {
      // Capability fallback: environments without an idle scheduler keep the
      // previous eager behavior rather than leaving blank previews behind.
      activateNext()
      return
    }
    idleHandle = idleWindow.requestIdleCallback(activateNext, { timeout: 120 })
  }

  const markReady = (key: string) => {
    if (readyKeys.has(key)) return
    readyKeys.add(key)
    const listeners = subscribers.get(key)
    subscribers.delete(key)
    listeners?.forEach(listener => listener())
  }

  return {
    cacheSnapshot: cacheAvatarPreviewSnapshot,
    enqueue: (key, activate) => {
      if (readyKeys.has(key) || getAvatarPreviewSnapshot(key) != null) {
        activate()
        return () => undefined
      }
      let listeners = subscribers.get(key)
      if (listeners == null) {
        listeners = new Set()
        subscribers.set(key, listeners)
        queuedKeys.push(key)
      }
      listeners.add(activate)
      scheduleNext()
      return () => listeners?.delete(activate)
    },
    getSnapshot: getAvatarPreviewSnapshot,
    isReady: key => readyKeys.has(key) || getAvatarPreviewSnapshot(key) != null,
    markReady
  }
}

const DeferredEntityPresetPreview = memo(function DeferredEntityPresetPreview({
  eager,
  previewKey,
  renderPreview,
  scheduler,
  staticSnapshot
}: {
  readonly eager: boolean
  readonly previewKey: string
  readonly renderPreview: () => ReactNode
  readonly scheduler: AvatarPreviewScheduler
  readonly staticSnapshot?: string | null
}) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(eager || typeof IntersectionObserver === 'undefined')
  const [readyKey, setReadyKey] = useState<string | null>(() => (
    eager || staticSnapshot != null || scheduler.isReady(previewKey) ? previewKey : null
  ))
  const [, setSnapshotKey] = useState<string | null>(() => (
    scheduler.getSnapshot(previewKey) == null ? null : previewKey
  ))
  const runtimeSnapshot = scheduler.getSnapshot(previewKey)
  const snapshot = staticSnapshot ?? runtimeSnapshot
  const ready = eager || snapshot != null || readyKey === previewKey || scheduler.isReady(previewKey)

  useEffect(() => {
    if (eager || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const element = containerRef.current
    if (element == null) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setVisible(true)
    }, { rootMargin: '96px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [eager, previewKey])

  useEffect(() => {
    if (eager) {
      scheduler.markReady(previewKey)
      setReadyKey(previewKey)
      return
    }
    if (!visible || ready) return
    return scheduler.enqueue(previewKey, () => setReadyKey(previewKey))
  }, [eager, previewKey, ready, scheduler, visible])

  useEffect(() => {
    if (!ready || snapshot != null) return
    const frame = window.requestAnimationFrame(() => {
      const svg = containerRef.current?.querySelector(':scope > svg')
      if (svg == null) return
      scheduler.cacheSnapshot(previewKey, svg.outerHTML)
      setSnapshotKey(previewKey)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [previewKey, ready, scheduler, snapshot])

  return (
    <span
      ref={containerRef}
      className={`avatar-controls__deferred-entity-preview${ready ? '' : ' avatar-controls__deferred-entity-preview--pending'}`}
      data-preview-key={previewKey}
      data-preview-ready={ready ? 'true' : 'false'}
      data-preview-static={snapshot == null ? 'false' : 'true'}
      data-preview-source={staticSnapshot != null
        ? 'prebuilt'
        : runtimeSnapshot != null ? 'runtime-cache' : ready ? 'live' : 'pending'}
      aria-hidden='true'
    >
      {snapshot == null
        ? ready ? renderPreview() : null
        : <img className='avatar-controls__entity-preset-icon' alt='' decoding='async' src={snapshot} />}
    </span>
  )
}, (previous, next) => (
  previous.eager === next.eager &&
  previous.previewKey === next.previewKey &&
  previous.scheduler === next.scheduler &&
  previous.staticSnapshot === next.staticSnapshot
))

interface AvatarControlsProps {
  readonly activeTab: AvatarControlTab
  readonly animationContent?: ReactNode
  readonly animalBreedTemplateId?: string | null
  readonly animalEarHeight?: number
  readonly animalEarWidth?: number
  readonly animalHeadHeight?: number
  readonly animalHeadWidth?: number
  readonly animalHornSize?: number
  readonly avatarShadowStyle: AvatarDropShadowStyle
  readonly avatarOutlineStyle: AvatarOutlineStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly bodyBottomTaper: number
  readonly bearBreedTemplateId: AvatarBearBreedTemplateId | null
  readonly bearEarHeight: number
  readonly bearEarWidth: number
  readonly bearHeadHeight: number
  readonly bearHeadWidth: number
  readonly cameraBackground: string
  readonly cameraFrame: AvatarCameraFrame
  readonly catBreedTemplateId: AvatarCatBreedTemplateId | null
  readonly catEarHeight: number
  readonly catEarWidth: number
  readonly coatPattern: AvatarCoatPattern
  readonly controlsWidth: number
  readonly entityParts: readonly AvatarEntityPart[]
  readonly entityPreset: AvatarEntityPreset
  readonly dogBreedTemplateId: AvatarDogBreedTemplateId | null
  readonly dogEarHeight: number
  readonly dogEarWidth: number
  readonly dogHeadHeight: number
  readonly dogHeadWidth: number
  readonly rabbitBreedTemplateId: AvatarRabbitBreedTemplateId | null
  readonly rabbitEarHeight: number
  readonly rabbitEarWidth: number
  readonly rabbitHeadHeight: number
  readonly rabbitHeadWidth: number
  readonly faceStyle: AvatarFaceStyle
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly frameShadowStyle: AvatarDropShadowStyle
  readonly gridDensity: number
  readonly headerActions: ReactNode
  readonly hiddenPaletteCount: number
  readonly lightAzimuth: number
  readonly lightDistance: number
  readonly lightElevation: number
  readonly onBackgroundStyleChange: (style: AvatarBackgroundStyle) => void
  readonly onAnimalBreedTemplateChange?: (id: string | null) => void
  readonly onAnimalEarHeightChange?: (value: number) => void
  readonly onAnimalEarWidthChange?: (value: number) => void
  readonly onAnimalHeadHeightChange?: (value: number) => void
  readonly onAnimalHeadWidthChange?: (value: number) => void
  readonly onAnimalHornSizeChange?: (value: number) => void
  readonly onAvatarShadowStyleChange: (style: Partial<AvatarDropShadowStyle>) => void
  readonly onAvatarOutlineStyleChange: (style: Partial<AvatarOutlineStyle>) => void
  readonly onBodyBottomTaperChange: (value: number) => void
  readonly onBearBreedTemplateChange: (id: AvatarBearBreedTemplateId | null) => void
  readonly onBearEarHeightChange: (value: number) => void
  readonly onBearEarWidthChange: (value: number) => void
  readonly onBearHeadHeightChange: (value: number) => void
  readonly onBearHeadWidthChange: (value: number) => void
  readonly onBodyShapeChange: (shape: AvatarBodyShape) => void
  readonly onCameraBackgroundChange: (color: string) => void
  readonly onCameraFrameChange: (frame: AvatarCameraFrame) => void
  readonly onCatBreedTemplateChange: (id: AvatarCatBreedTemplateId | null) => void
  readonly onCatEarHeightChange: (value: number) => void
  readonly onCatEarWidthChange: (value: number) => void
  readonly onDogBreedTemplateChange: (id: AvatarDogBreedTemplateId | null) => void
  readonly onDogEarHeightChange: (value: number) => void
  readonly onDogEarWidthChange: (value: number) => void
  readonly onDogHeadHeightChange: (value: number) => void
  readonly onDogHeadWidthChange: (value: number) => void
  readonly onRabbitBreedTemplateChange: (id: AvatarRabbitBreedTemplateId | null) => void
  readonly onRabbitEarHeightChange: (value: number) => void
  readonly onRabbitEarWidthChange: (value: number) => void
  readonly onRabbitHeadHeightChange: (value: number) => void
  readonly onRabbitHeadWidthChange: (value: number) => void
  readonly onCoatPatternChange: (pattern: Partial<AvatarCoatPattern>, manualField?: AvatarSeedField) => void
  readonly onConvertCoatPatternToDecals: () => void
  readonly onCollapse: () => void
  readonly onControlsWidthChange: (width: number) => void
  readonly onFaceStyleChange: (style: Partial<AvatarFaceStyle>, mode?: 'merge' | 'replace') => void
  readonly onFaceShadowStyleChange: (style: Partial<AvatarFaceShadowStyle>) => void
  readonly onFrameShadowStyleChange: (style: Partial<AvatarDropShadowStyle>) => void
  readonly onGridDensityChange: (value: number) => void
  readonly onLightAzimuthChange: (value: number) => void
  readonly onLightDistanceChange: (value: number) => void
  readonly onLightElevationChange: (value: number) => void
  readonly onPaletteChange: (paletteId: string) => void
  readonly onPixelEffectChange: (effect: Partial<AvatarPixelEffect>) => void
  readonly onEntityPresetChange: (preset: AvatarEntityPreset) => void
  readonly onEntityPartChange: (id: string, part: Partial<AvatarEntityPart>) => void
  readonly onResetFace: () => void
  readonly onAddSurfaceDecal: () => void
  readonly onDeleteSurfaceDecal: (id: string) => void
  readonly onSelectSurfaceDecal: (id: string) => void
  readonly onSurfaceDecalChange: (id: string, decal: Partial<AvatarSurfaceDecal>) => void
  readonly onSavedPresetSelect: (preset: SavedAvatarPreset) => void
  readonly onSavedPresetRemove: (presetId: string) => void
  readonly onShowMorePalettesChange: () => void
  readonly onTabChange: (tab: AvatarControlTab) => void
  readonly onToggleLight: () => void
  readonly onToggleAvatarShadow: () => void
  readonly onToggleOutline: () => void
  readonly onToggleFrameShadow: () => void
  readonly onToggleShadow: () => void
  readonly onToggleCoatPattern: () => void
  readonly selectedPalette: AvatarPalette
  readonly pixelEffect: AvatarPixelEffect
  readonly selectedEntityPartId: string | null
  readonly selectedSavedPresetId: string | null
  readonly selectedSurfaceDecalId: string | null
  readonly savedPresets: readonly SavedAvatarPreset[]
  readonly seed: string
  readonly seededFields: readonly string[]
  readonly showLight: boolean
  readonly showAvatarShadow: boolean
  readonly showOutline: boolean
  readonly showFrameShadow: boolean
  readonly showMorePalettes: boolean
  readonly showShadow: boolean
  readonly surfaceDecals: readonly AvatarSurfaceDecal[]
  readonly visiblePalettes: readonly AvatarPalette[]
  readonly onRandomSeed: () => void
  readonly onSeedChange: (seed: string) => void
  readonly onSeedFieldToggle: (field: AvatarSeedField, enabled: boolean) => void
}

const DEFAULT_CONTROLS_WIDTH = 420
const MIN_CONTROLS_WIDTH = 300
const MIN_STAGE_WIDTH = 160

const clampControlsWidth = (width: number) => {
  const viewportLimit = typeof window === 'undefined'
    ? 960
    : Math.max(MIN_CONTROLS_WIDTH, window.innerWidth - MIN_STAGE_WIDTH)
  return Math.min(Math.max(width, MIN_CONTROLS_WIDTH), viewportLimit)
}

const CONTROL_TABS: readonly { id: AvatarControlTab; label: string }[] = [
  { id: 'build', label: 'Build' },
  { id: 'body', label: 'Body' },
  { id: 'style', label: 'Style' },
  { id: 'effects', label: 'Effects' },
  { id: 'animation', label: 'Animation' }
]

const COAT_PATTERN_ALGORITHMS: readonly { id: AvatarCoatPatternAlgorithm; label: string }[] = [
  { id: 'random', label: 'Random' },
  { id: 'mackerel', label: 'Mackerel' },
  { id: 'classic', label: 'Classic' },
  { id: 'broken-mackerel', label: 'Broken' },
  { id: 'spotted', label: 'Spotted' }
]

const COAT_LIGHT_PATCH_SHAPES: readonly GeometricShapeOption<AvatarCoatPatternLightPatchShape>[] = [
  { icon: 'face-mask', id: 'face-mask', label: 'Face mask' },
  { icon: 'ellipse', id: 'ellipse', label: 'Ellipse' },
  { icon: 'rounded', id: 'rounded', label: 'Rounded' }
]

const CoatPatternIcon = ({ algorithm }: { readonly algorithm: AvatarCoatPatternAlgorithm }) => (
  <svg className='avatar-controls__coat-icon' viewBox='0 0 24 18' aria-hidden='true'>
    {algorithm === 'spotted'
      ? <><circle cx='7' cy='6' r='2.5' /><circle cx='16' cy='5' r='2' /><circle cx='12' cy='13' r='2.3' /></>
      : algorithm === 'classic'
        ? <><path d='M3 5c5-4 9-4 14 0' /><path d='M5 11c4-3 8-3 13 0' /></>
        : algorithm === 'broken-mackerel'
          ? <><path d='M5 2v5m0 4v4M12 2v3m0 4v6M19 2v6m0 3v4' /></>
          : algorithm === 'random'
            ? <><path d='M5 3v5m7-5 3 4-3 4v4m7-12v4m0 4v4' /><circle cx='5' cy='13' r='1.5' /></>
            : <><path d='M5 2v13M12 2v13M19 2v13' /></>}
  </svg>
)

const BODY_SHAPE_LABELS: Readonly<Record<AvatarBodyShape, string>> = {
  capsule: 'Capsule',
  cone: 'Cone',
  diamond: 'Diamond',
  ellipse: 'Ellipse',
  frustum: 'Frustum',
  'half-cone': 'Half cone',
  rounded: 'Rounded square',
  sphere: 'Sphere',
  square: 'Square',
  teardrop: 'Teardrop',
  trapezoid: 'Rounded trapezoid'
}

const ENTITY_PRESET_LABELS: Readonly<
  Record<Exclude<AvatarEntityPreset, 'custom'>, string> & Record<AvatarAnimalSpeciesId, string>
> = {
  alpaca: 'Alpaca',
  bear: 'Bear',
  beaver: 'Beaver',
  bun: 'Bun',
  capybara: 'Capybara',
  cat: 'Cat',
  chick: 'Chick',
  chinchilla: 'Chinchilla',
  cloud: 'Cloud',
  cow: 'Cow',
  deer: 'Deer',
  duck: 'Duck',
  ferret: 'Ferret',
  dog: 'Dog',
  fox: 'Fox',
  'guinea-pig': 'Guinea Pig',
  hamster: 'Hamster',
  hedgehog: 'Hedgehog',
  lion: 'Lion',
  monkey: 'Monkey',
  otter: 'Otter',
  owl: 'Owl',
  parrot: 'Parrot',
  penguin: 'Penguin',
  pig: 'Pig',
  rabbit: 'Rabbit',
  seal: 'Seal',
  sheep: 'Sheep',
  squirrel: 'Squirrel',
  sun: 'Sun',
  tiger: 'Tiger',
  goose: 'Goose'
}

const EYE_SHAPE_OPTIONS: readonly GeometricShapeOption<AvatarEyeShape>[] = [
  { icon: 'rounded', id: 'rounded', label: 'Rounded' },
  { icon: 'ellipse', id: 'ellipse', label: 'Ellipse' },
  { icon: 'inverted-triangle', id: 'chevron', label: 'Chevron' }
]

const SURFACE_DECAL_SHAPE_OPTIONS: readonly GeometricShapeOption<AvatarSurfaceDecalShape>[] = [
  { icon: 'rounded', id: 'claude-spark', label: 'Claude Spark' },
  { icon: 'ellipse', id: 'ellipse', label: 'Ellipse' },
  { icon: 'rounded', id: 'radial-pleats', label: 'Radial pleats' },
  { icon: 'rounded', id: 'rounded', label: 'Rounded' },
  { icon: 'inverted-triangle', id: 'rounded-triangle', label: 'Rounded triangle' },
  { icon: 'face-mask', id: 'face-mask', label: 'Face mask' },
  { icon: 'curve', id: 'tapered-band', label: 'Tapered band' }
]

const NOSE_SHAPE_OPTIONS: readonly GeometricShapeOption<AvatarNoseShape>[] = [
  { icon: 'inverted-triangle', id: 'inverted-triangle', label: 'Rounded triangle' },
  { icon: 'ellipse', id: 'ellipse', label: 'Ellipse' },
  { icon: 'rounded', id: 'rounded', label: 'Rounded' }
]

const MOUTH_SHAPE_OPTIONS: readonly GeometricShapeOption<AvatarMouthShape>[] = [
  { icon: 'curve', id: 'curve', label: 'Curve' },
  { icon: 'ellipse', id: 'ellipse', label: 'Ellipse' },
  { icon: 'rounded', id: 'rounded', label: 'Rounded' },
  { icon: 'inverted-triangle', id: 'rounded-triangle', label: 'Rounded triangle' }
]

const CAMERA_FRAME_OPTIONS: readonly GeometricShapeOption<AvatarCameraFrame>[] = [
  { icon: 'square', id: 'square', label: 'Square' },
  { icon: 'rounded', id: 'rounded', label: 'Rounded' },
  { icon: 'circle', id: 'circle', label: 'Circle' }
]

const getSavedPresetFrame = (query: string): AvatarCameraFrame => {
  const frame = new URLSearchParams(query).get('cameraFrame')
  return frame === 'circle' || frame === 'square' || frame === 'rounded' ? frame : 'rounded'
}

const DEFAULT_CAMERA_BACKGROUND_COLOR = AVATAR_CAMERA_BACKGROUND_PRESETS[0]

function FacePresetPreview({ preset }: { readonly preset: AvatarFacePreset }) {
  const { style } = preset
  const id = useId()
  const face = projectDefaultFace({ pitch: 0, yaw: 0 }, 'sphere', style)
  return (
    <svg className='avatar-controls__face-preset-preview' viewBox='135 140 150 145' aria-hidden='true'>
      <defs>
        {face.eyes.map(eye => (
          <clipPath key={eye.id} id={`${id}-${eye.id}-highlight-clip`}>
            <path d={eye.path} />
          </clipPath>
        ))}
      </defs>
      <rect className='avatar-controls__face-preset-head' x='143' y='143' width='134' height='136' rx='58' />
      {face.eyes.map(eye => <path key={eye.id} d={eye.path} />)}
      {face.eyeHighlights.map(highlight => (
        <path
          key={highlight.id}
          clipPath={`url(#${id}-${highlight.id.replace('eye-highlight-', 'eye-')}-highlight-clip)`}
          d={highlight.path}
          fill={style.eyeHighlight.color}
          fillOpacity={style.eyeHighlight.opacity / 100}
        />
      ))}
      {style.noseEnabled && face.nose != null ? <path d={face.nose.path} /> : null}
      {style.mouthEnabled && face.mouth != null ? <path d={face.mouth.path} /> : null}
    </svg>
  )
}

function ControlIcon({ name }: { readonly name: ControlIconName }) {
  return (
    <svg className='avatar-controls__icon' viewBox='0 0 20 20' aria-hidden='true'>
      {name === 'build'
        ? (
          <>
            <path d='M3 5h14M3 10h14M3 15h14' />
            <circle cx='7' cy='5' r='1.6' />
            <circle cx='13' cy='10' r='1.6' />
            <circle cx='8.5' cy='15' r='1.6' />
          </>
        )
        : null}
      {name === 'body'
        ? (
          <>
            <circle cx='7.2' cy='8' r='3.7' />
            <rect x='9.5' y='8.5' width='7' height='7' rx='1.5' />
          </>
        )
        : null}
      {name === 'style' || name === 'palette'
        ? (
          <>
            <path d='M10 2.7a7.3 7.3 0 1 0 0 14.6h1.1a1.8 1.8 0 0 0 0-3.6h-.7a1.5 1.5 0 0 1 0-3h2.8A4.1 4.1 0 0 0 17.3 6.6C17.3 4.4 14 2.7 10 2.7Z' />
            <circle cx='6.2' cy='7.1' r='.8' />
            <circle cx='9.3' cy='5.4' r='.8' />
            <circle cx='13' cy='6.2' r='.8' />
          </>
        )
        : null}
      {name === 'effects'
        ? <path d='m10 2 1.3 4.2L15.5 7.5l-4.2 1.3L10 13l-1.3-4.2-4.2-1.3 4.2-1.3L10 2Zm5.2 10 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z' />
        : null}
      {name === 'animation'
        ? (
          <>
            <rect x='2.8' y='4' width='14.4' height='12' rx='2' />
            <path d='m8 7 5 3-5 3Z' />
          </>
        )
        : null}
      {name === 'eyes'
        ? (
          <>
            <circle cx='6' cy='10' r='2.7' />
            <circle cx='14' cy='10' r='2.7' />
            <path d='M8.7 10h2.6' />
          </>
        )
        : null}
      {name === 'nose' ? <rect x='7.5' y='5' width='5' height='10' rx='2.5' /> : null}
      {name === 'mouth' ? <rect x='4' y='8' width='12' height='4' rx='2' /> : null}
      {name === 'light'
        ? (
          <>
            <circle cx='10' cy='10' r='3.2' />
            <path d='M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.5 4.5 6 6M14 14l1.5 1.5M15.5 4.5 14 6M6 14l-1.5 1.5' />
          </>
        )
        : null}
      {name === 'pixel'
        ? (
          <>
            <rect x='3' y='3' width='5' height='5' rx='.6' />
            <rect x='12' y='3' width='5' height='5' rx='.6' />
            <rect x='3' y='12' width='5' height='5' rx='.6' />
            <rect x='12' y='12' width='5' height='5' rx='.6' />
          </>
        )
        : null}
      {name === 'shadow'
        ? (
          <>
            <rect x='3.5' y='3.5' width='9' height='9' rx='2' />
            <path d='M8 16.5h6.5a2 2 0 0 0 2-2V8' />
          </>
        )
        : null}
      {name === 'outline'
        ? (
          <>
            <path d='M4 4h10v10H4Z' />
            <path d='M7 7h9v9H7Z' />
          </>
        )
        : null}
      {name === 'background'
        ? (
          <>
            <rect x='3' y='4' width='14' height='12' rx='2' />
            <path d='m4 15 5-5 3 3 4-4' />
          </>
        )
        : null}
      {name === 'solid'
        ? <rect x='3' y='3' width='14' height='14' rx='2' />
        : null}
      {name === 'gradient'
        ? (
          <>
            <rect x='3' y='3' width='14' height='14' rx='2' />
            <path d='M4.5 15.5 15.5 4.5' />
          </>
        )
        : null}
      {name === 'transparent'
        ? (
          <>
            <rect x='3' y='3' width='14' height='14' rx='2' />
            <path d='M3 10h14M10 3v14M3 3l14 14M17 3 3 17' />
          </>
        )
        : null}
      {name === 'camera'
        ? (
          <>
            <path d='M3.5 7h3l1.2-2h4.6l1.2 2h3A1.5 1.5 0 0 1 18 8.5v6a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14.5v-6A1.5 1.5 0 0 1 3.5 7Z' />
            <circle cx='10' cy='11.5' r='2.8' />
          </>
        )
        : null}
      {name === 'history'
        ? (
          <>
            <path d='M4.2 6.2A6.5 6.5 0 1 1 3.8 13' />
            <path d='M4.2 2.8v3.4h3.4M10 6.3v4l2.8 1.7' />
          </>
        )
        : null}
    </svg>
  )
}

function BodyShapeIcon({ shape }: { readonly shape: AvatarBodyShape }) {
  return (
    <svg className='avatar-controls__body-shape-icon' viewBox='0 0 48 48' aria-hidden='true'>
      {shape === 'sphere' ? <circle cx='24' cy='24' r='15' /> : null}
      {shape === 'ellipse' ? <ellipse cx='24' cy='24' rx='18' ry='12' /> : null}
      {shape === 'square' ? <rect x='9' y='9' width='30' height='30' /> : null}
      {shape === 'rounded' ? <rect x='9' y='9' width='30' height='30' rx='7' /> : null}
      {shape === 'capsule' ? <rect x='5' y='13' width='38' height='22' rx='11' /> : null}
      {shape === 'teardrop' ? <path d='M24 5C19 14 12 21 12 30a12 12 0 0 0 24 0c0-9-7-16-12-25Z' /> : null}
      {shape === 'diamond' ? <path d='m24 6 18 18-18 18L6 24Z' /> : null}
      {shape === 'trapezoid' ? <path d='M16 8h16q3 0 4 3l6 24q1 5-4 5H10q-5 0-4-5l6-24q1-3 4-3Z' /> : null}
      {shape === 'cone' ? <path d='M24 6 40 39H8Z' /> : null}
      {shape === 'frustum' ? <path d='M17 8h14l9 31H8Z' /> : null}
      {shape === 'half-cone' ? <path d='M24 6v33H8Z' /> : null}
    </svg>
  )
}

function GeometricShapeIcon({ shape }: { readonly shape: GeometricShapeIconName }) {
  return (
    <svg className='avatar-controls__shape-icon' viewBox='0 0 40 32' aria-hidden='true'>
      {shape === 'circle' ? <circle cx='20' cy='16' r='10' /> : null}
      {shape === 'curve' ? <path d='M7 11q13 15 26 0' strokeLinecap='round' strokeWidth='5' /> : null}
      {shape === 'ellipse' ? <ellipse cx='20' cy='16' rx='12' ry='9' /> : null}
      {shape === 'face-mask'
        ? <path d='M8 8c3-3 7-5 12-5s9 2 12 5v9c0 7-5 12-12 12S8 24 8 17Z' />
        : null}
      {shape === 'rounded' ? <rect x='9' y='6' width='22' height='20' rx='5' /> : null}
      {shape === 'square' ? <rect x='10' y='6' width='20' height='20' /> : null}
      {shape === 'inverted-triangle'
        ? <path d='M7 9C10 3 30 3 33 9c3 6-6 17-11.5 20q-1.5 1-3 0C13 26 4 15 7 9Z' />
        : null}
    </svg>
  )
}

function PixelSamplingIcon({ sampling }: { readonly sampling: AvatarPixelSampling }) {
  return (
    <svg className='avatar-controls__pixel-sampling-icon' viewBox='0 0 20 20' aria-hidden='true'>
      {sampling === 'center'
        ? (
          <>
            <path d='M3 3h4v4H3zm5 0h4v4H8zm5 0h4v4h-4zM3 8h4v4H3zm10 0h4v4h-4zM3 13h4v4H3zm5 0h4v4H8zm5 0h4v4h-4z' />
            <rect data-fill x='8' y='8' width='4' height='4' />
          </>
        )
        : null}
      {sampling === 'dominant'
        ? (
          <>
            <path d='M3 3h4v4H3zm10 0h4v4h-4zM3 13h4v4H3zm10 0h4v4h-4z' />
            <path data-fill d='M8 3h4v4H8zM3 8h4v4H3zm5 0h4v4H8zm5 0h4v4h-4zM8 13h4v4H8z' />
          </>
        )
        : null}
      {sampling === 'median'
        ? (
          <>
            <rect x='3' y='3' width='14' height='3.5' />
            <rect data-fill x='3' y='8.25' width='14' height='3.5' />
            <rect x='3' y='13.5' width='14' height='3.5' />
          </>
        )
        : null}
      {sampling === 'slic'
        ? (
          <>
            <path d='m3 3 6 1 1 5-6 1-1-7Zm7 1 7-1v6l-7 1V4ZM4 10l6-1 1 7-8 1 1-7Zm6-1 7 1v7l-6-1-1-7Z' />
            <rect data-fill x='8.5' y='7.5' width='3' height='3' rx='.4' />
          </>
        )
        : null}
    </svg>
  )
}

function GeometricShapePicker<T extends string>({ ariaLabel, onChange, options, value }: {
  readonly ariaLabel: string
  readonly onChange: (value: T) => void
  readonly options: readonly GeometricShapeOption<T>[]
  readonly value: T
}) {
  const { t } = useAvatarLocale()
  return (
    <div className='avatar-controls__shape-options' role='radiogroup' aria-label={t(ariaLabel)}>
      {options.map(option => (
        <button
          key={option.id}
          className='avatar-controls__shape-option'
          type='button'
          role='radio'
          aria-checked={option.id === value}
          onClick={() => onChange(option.id)}
        >
          <GeometricShapeIcon shape={option.icon} />
          <span>{t(option.label)}</span>
        </button>
      ))}
    </div>
  )
}

function ToggleRow({ checked, icon, label, onChange }: {
  readonly checked: boolean
  readonly icon: ControlIconName
  readonly label: string
  readonly onChange: () => void
}) {
  const { t } = useAvatarLocale()
  return (
    <div className='avatar-controls__toggle-row'>
      <span className='avatar-controls__toggle-label'>
        <ControlIcon name={icon} />
        {t(label)}
      </span>
      <button
        className='avatar-controls__switch'
        type='button'
        role='switch'
        aria-label={t(label)}
        aria-checked={checked}
        onClick={onChange}
      >
        <span />
      </button>
    </div>
  )
}

function SeedFieldToggle({ enabled, label, onChange }: {
  readonly enabled: boolean
  readonly label: string
  readonly onChange: () => void
}) {
  const { t } = useAvatarLocale()
  const translatedLabel = t(label)
  return (
    <button
      className='avatar-controls__seed-toggle'
      type='button'
      role='switch'
      aria-checked={enabled}
      aria-label={`${t('Follow Seed')}: ${translatedLabel}`}
      title={`${t('Follow Seed')}: ${translatedLabel}`}
      onClick={onChange}
    >
      <svg viewBox='0 0 20 20' aria-hidden='true'>
        <path d='M10 3v14M4.5 6.2 10 10l5.5-3.8M4.5 13.8 10 10l5.5 3.8' />
        <circle cx='10' cy='10' r='2.2' />
      </svg>
      <span>{t('Seed')}</span>
    </button>
  )
}

function ValueSlider({ ariaLabel, label, max, min, onChange, suffix = '', value }: {
  readonly ariaLabel: string
  readonly label: string
  readonly max: number
  readonly min: number
  readonly onChange: (value: number) => void
  readonly suffix?: string
  readonly value: number
}) {
  const { t } = useAvatarLocale()
  return (
    <label className='avatar-controls__value-slider'>
      <span>
        {t(label)}
        <output>{Math.round(value)}{suffix}</output>
      </span>
      <input
        type='range'
        aria-label={t(ariaLabel)}
        min={min}
        max={max}
        step='1'
        value={value}
        onChange={event => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}

function NumberField({ ariaLabel, label, onChange, suffix = '', value }: {
  readonly ariaLabel: string
  readonly label: string
  readonly onChange: (value: number) => void
  readonly suffix?: string
  readonly value: number
}) {
  const { t } = useAvatarLocale()
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = () => {
    const parsed = Number(draft)
    if (draft.trim() !== '' && Number.isFinite(parsed)) {
      onChange(parsed)
      setDraft(String(parsed))
      return
    }
    setDraft(String(value))
  }
  return (
    <label className='avatar-controls__number-field'>
      <span>{t(label)}</span>
      <span>
        <input
          type='number'
          aria-label={t(ariaLabel)}
          step='any'
          value={draft}
          onBlur={commit}
          onChange={event => {
            const nextDraft = event.currentTarget.value
            setDraft(nextDraft)
            const parsed = Number(nextDraft)
            if (nextDraft.trim() !== '' && Number.isFinite(parsed)) onChange(parsed)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') {
              setDraft(String(value))
              event.currentTarget.blur()
            }
          }}
        />
        {suffix === '' ? null : <span aria-hidden='true'>{suffix}</span>}
      </span>
    </label>
  )
}

export function AvatarControls({
  activeTab,
  animationContent,
  animalBreedTemplateId = null,
  animalEarHeight = 100,
  animalEarWidth = 100,
  animalHeadHeight = 100,
  animalHeadWidth = 100,
  animalHornSize = 100,
  avatarOutlineStyle,
  avatarShadowStyle,
  backgroundStyle,
  bodyShape,
  bodyBottomTaper,
  bearBreedTemplateId,
  bearEarHeight,
  bearEarWidth,
  bearHeadHeight,
  bearHeadWidth,
  cameraBackground,
  cameraFrame,
  catBreedTemplateId,
  catEarHeight,
  catEarWidth,
  coatPattern,
  controlsWidth,
  entityParts,
  entityPreset,
  dogBreedTemplateId,
  dogEarHeight,
  dogEarWidth,
  dogHeadHeight,
  dogHeadWidth,
  rabbitBreedTemplateId,
  rabbitEarHeight,
  rabbitEarWidth,
  rabbitHeadHeight,
  rabbitHeadWidth,
  faceStyle,
  faceShadowStyle,
  frameShadowStyle,
  gridDensity,
  headerActions,
  hiddenPaletteCount,
  lightAzimuth,
  lightDistance,
  lightElevation,
  pixelEffect,
  onAnimalBreedTemplateChange,
  onAnimalEarHeightChange,
  onAnimalEarWidthChange,
  onAnimalHeadHeightChange,
  onAnimalHeadWidthChange,
  onAnimalHornSizeChange,
  onBackgroundStyleChange,
  onAvatarOutlineStyleChange,
  onAvatarShadowStyleChange,
  onBodyBottomTaperChange,
  onBearBreedTemplateChange,
  onBearEarHeightChange,
  onBearEarWidthChange,
  onBearHeadHeightChange,
  onBearHeadWidthChange,
  onBodyShapeChange,
  onCameraBackgroundChange,
  onCameraFrameChange,
  onCatBreedTemplateChange,
  onCatEarHeightChange,
  onCatEarWidthChange,
  onDogBreedTemplateChange,
  onDogEarHeightChange,
  onDogEarWidthChange,
  onDogHeadHeightChange,
  onDogHeadWidthChange,
  onRabbitBreedTemplateChange,
  onRabbitEarHeightChange,
  onRabbitEarWidthChange,
  onRabbitHeadHeightChange,
  onRabbitHeadWidthChange,
  onCoatPatternChange,
  onConvertCoatPatternToDecals,
  onCollapse,
  onControlsWidthChange,
  onFaceStyleChange,
  onFaceShadowStyleChange,
  onFrameShadowStyleChange,
  onGridDensityChange,
  onLightAzimuthChange,
  onLightDistanceChange,
  onLightElevationChange,
  onPaletteChange,
  onPixelEffectChange,
  onRandomSeed,
  onSeedChange,
  onSeedFieldToggle,
  onEntityPresetChange,
  onEntityPartChange,
  onAddSurfaceDecal,
  onDeleteSurfaceDecal,
  onSelectSurfaceDecal,
  onSurfaceDecalChange,
  onResetFace,
  onSavedPresetSelect,
  onSavedPresetRemove,
  onShowMorePalettesChange,
  onTabChange,
  onToggleLight,
  onToggleOutline,
  onToggleAvatarShadow,
  onToggleFrameShadow,
  onToggleShadow,
  onToggleCoatPattern,
  selectedPalette,
  selectedEntityPartId,
  selectedSavedPresetId,
  selectedSurfaceDecalId,
  savedPresets,
  seed,
  seededFields,
  showLight,
  showOutline,
  showAvatarShadow,
  showFrameShadow,
  showMorePalettes,
  showShadow,
  surfaceDecals,
  visiblePalettes
}: AvatarControlsProps) {
  const { t } = useAvatarLocale()
  const [activeFacePart, setActiveFacePart] = useState<AvatarFacePart>('eyes')
  const [pendingPaletteId, setPendingPaletteId] = useState<string | null>(null)
  const [presetBrowser, setPresetBrowser] = useState<AvatarPresetBrowser | null>(null)
  const [presetSearch, setPresetSearch] = useState('')
  const [presetUsage, setPresetUsage] = useState(loadAvatarPresetUsage)
  const [resizing, setResizing] = useState(false)
  const [seedSettingsOpen, setSeedSettingsOpen] = useState(false)
  const [seedDraft, setSeedDraft] = useState(seed)
  const seedSettingsId = useId()
  const paletteConfirmActionRef = useRef<HTMLButtonElement>(null)
  const presetSearchRef = useRef<HTMLInputElement>(null)
  const resizeStartRef = useRef<{ pointerX: number; width: number } | null>(null)
  const previewSchedulerRef = useRef<AvatarPreviewScheduler | null>(null)
  if (previewSchedulerRef.current == null) previewSchedulerRef.current = createAvatarPreviewScheduler()
  const previewScheduler = previewSchedulerRef.current
  const lastCameraColorRef = useRef(
    cameraBackground === 'transparent' ? DEFAULT_CAMERA_BACKGROUND_COLOR : cameraBackground
  )

  useEffect(() => {
    if (cameraBackground !== 'transparent') lastCameraColorRef.current = cameraBackground
  }, [cameraBackground])

  useEffect(() => setSeedDraft(seed), [seed])

  const commitSeedDraft = () => {
    const nextSeed = seedDraft.trim()
    if (nextSeed === '') {
      setSeedDraft(seed)
      return
    }
    onSeedChange(nextSeed)
  }

  const renderSeedFieldHeader = (
    icon: ControlIconName,
    label: string,
    field: AvatarSeedField
  ) => (
    <div className='avatar-controls__field-header'>
      <span className='avatar-controls__label'>
        <ControlIcon name={icon} />
        {t(label)}
      </span>
      <SeedFieldToggle
        enabled={seededFields.includes(field)}
        label={label}
        onChange={() => onSeedFieldToggle(field, !seededFields.includes(field))}
      />
    </div>
  )

  const isDefaultFace = Object.entries(DEFAULT_AVATAR_FACE_STYLE).every(([key, value]) => {
    return faceStyle[key as keyof AvatarFaceStyle] === value
  })
  const selectedEntityPart = entityParts.find(part => part.id === selectedEntityPartId)
  const editingEntityPart = selectedEntityPart ?? entityParts.find(part => part.face)
  const editingSurfaceDecal = surfaceDecals.find(decal => decal.id === selectedSurfaceDecalId) ?? null
  const pendingPalette = visiblePalettes.find(palette => palette.id === pendingPaletteId) ?? null
  const showOverallStyleControls = selectedEntityPart == null || selectedEntityPart.face
  const compactPresetCapacity = Math.max(8, Math.floor((controlsWidth - 32) / 64) * 2)
  const facePresets = sortAvatarPresetItems(
    [DEFAULT_AVATAR_FACE_PRESET, ...AVATAR_FACE_PRESETS],
    preset => `face:${preset.id}`,
    presetUsage
  )
  const entityPresetItems = sortAvatarPresetItems<AvatarSavedPresetItem>(
    AVATAR_BUILT_IN_ENTITY_PRESETS.map(preset => ({
      createdAt: 0,
      key: `entity:${preset}`,
      kind: 'entity' as const,
      preset
    })),
    item => item.key,
    presetUsage
  )
  const savedPresetItems = sortAvatarPresetItems<AvatarSavedPresetItem>(
    savedPresets.map(preset => ({
      createdAt: preset.createdAt,
      key: `saved:${preset.id}`,
      kind: 'saved' as const,
      preset
    })),
    item => item.key,
    presetUsage,
    item => item.createdAt
  )
  const compactFacePresets = facePresets.length > compactPresetCapacity
    ? facePresets.slice(0, compactPresetCapacity - 1)
    : facePresets
  const compactSavedPresetItems = savedPresetItems.length > compactPresetCapacity
    ? savedPresetItems.slice(0, compactPresetCapacity - 1)
    : savedPresetItems
  const compactEntityPresetItems = entityPresetItems.length > compactPresetCapacity
    ? entityPresetItems.slice(0, compactPresetCapacity - 1)
    : entityPresetItems

  useEffect(() => {
    if (pendingPalette != null) paletteConfirmActionRef.current?.focus()
  }, [pendingPalette])

  useEffect(() => {
    if (presetBrowser != null) presetSearchRef.current?.focus()
  }, [presetBrowser])

  useEffect(() => {
    if (lightAzimuth !== DEFAULT_AVATAR_PREVIEW_LIGHT.azimuth ||
      lightElevation !== DEFAULT_AVATAR_PREVIEW_LIGHT.elevation) return
    const preload = () => Object.values(AVATAR_ENTITY_PRESET_SNAPSHOT_URLS).forEach(source => {
      const image = new Image()
      image.decoding = 'async'
      image.src = source
    })
    const idleWindow = window as AvatarPreviewIdleWindow
    if (idleWindow.requestIdleCallback == null) {
      const frame = window.requestAnimationFrame(preload)
      return () => window.cancelAnimationFrame(frame)
    }
    const idle = idleWindow.requestIdleCallback(preload, { timeout: 600 })
    return () => idleWindow.cancelIdleCallback?.(idle)
  }, [lightAzimuth, lightElevation])

  const renderEntityPresetPreview = (
    preset: Exclude<AvatarEntityPreset, 'custom'>,
    eager = false
  ) => {
    const staticSnapshot = lightAzimuth === DEFAULT_AVATAR_PREVIEW_LIGHT.azimuth &&
      lightElevation === DEFAULT_AVATAR_PREVIEW_LIGHT.elevation
      ? AVATAR_ENTITY_PRESET_SNAPSHOT_URLS[preset]
      : null
    return <DeferredEntityPresetPreview
      eager={eager}
      previewKey={`entity:${preset}:light:${lightAzimuth}:${lightElevation}`}
      scheduler={previewScheduler}
      staticSnapshot={staticSnapshot}
      renderPreview={() => (
        <EntityPresetPreview
          preset={preset}
          lightDirection={{ azimuth: lightAzimuth, elevation: lightElevation }}
        />
      )}
    />
  }

  const getStaticBreedPreview = (species: string, breed: string) => (
    lightAzimuth === DEFAULT_AVATAR_PREVIEW_LIGHT.azimuth &&
      lightElevation === DEFAULT_AVATAR_PREVIEW_LIGHT.elevation
      ? getAvatarBreedPresetSnapshotUrl(species, breed)
      : null
  )

  const renderCatBreedPreview = (
    template: (typeof AVATAR_CAT_BREED_TEMPLATES)[number],
    eager = false
  ) => {
    const staticSnapshot = getStaticBreedPreview('cat', template.id)
    return (
      <DeferredEntityPresetPreview
        eager={eager}
        previewKey={staticSnapshot == null
          ? `breed:cat:${template.id}:seed:${seed}:light:${lightAzimuth}:${lightElevation}`
          : `breed:cat:${template.id}:prebuilt`}
        scheduler={previewScheduler}
        staticSnapshot={staticSnapshot}
        renderPreview={() => {
          const resolved = resolveAvatarCatBreedTemplate(template, seed)
          const decals = resolveAvatarCoatPatternDecals({
            entityParts: resolved.entityParts,
            entityPreset: 'cat',
            ...{ palette: resolveAvatarBreedPaletteFromEntityParts(getAvatarPalette(resolved.paletteId), resolved.entityParts) },
            paletteId: resolved.paletteId,
            pattern: resolved.coatPattern
          })
          return (
            <EntityPresetPreview
              entityParts={resolved.entityParts}
              lightDirection={{ azimuth: lightAzimuth, elevation: lightElevation }}
              preset='cat'
              previewBackground={template.previewBackground}
              surfaceDecals={decals}
            />
          )
        }}
      />
    )
  }

  const renderDogBreedPreview = (
    template: (typeof AVATAR_DOG_BREED_TEMPLATES)[number],
    eager = false
  ) => {
    const staticSnapshot = getStaticBreedPreview('dog', template.id)
    return (
      <DeferredEntityPresetPreview
        eager={eager}
        previewKey={staticSnapshot == null
          ? `breed:dog:${template.id}:seed:${seed}:light:${lightAzimuth}:${lightElevation}`
          : `breed:dog:${template.id}:prebuilt`}
        scheduler={previewScheduler}
        staticSnapshot={staticSnapshot}
        renderPreview={() => {
          const resolved = resolveAvatarDogBreedTemplate(template, seed)
          const decals = resolveAvatarCoatPatternDecals({
            entityParts: resolved.entityParts,
            entityPreset: 'dog',
            ...{ palette: resolveAvatarBreedPaletteFromEntityParts(getAvatarPalette(resolved.paletteId), resolved.entityParts) },
            paletteId: resolved.paletteId,
            pattern: resolved.coatPattern
          })
          return (
            <EntityPresetPreview
              entityParts={resolved.entityParts}
              lightDirection={{ azimuth: lightAzimuth, elevation: lightElevation }}
              preset='dog'
              previewBackground={template.previewBackground}
              surfaceDecals={decals}
            />
          )
        }}
      />
    )
  }

  const renderRabbitBreedPreview = (
    template: (typeof AVATAR_RABBIT_BREED_TEMPLATES)[number],
    eager = false
  ) => {
    const staticSnapshot = getStaticBreedPreview('rabbit', template.id)
    return (
      <DeferredEntityPresetPreview
        eager={eager}
        previewKey={staticSnapshot == null
          ? `breed:rabbit:${template.id}:seed:${seed}:light:${lightAzimuth}:${lightElevation}`
          : `breed:rabbit:${template.id}:prebuilt`}
        scheduler={previewScheduler}
        staticSnapshot={staticSnapshot}
        renderPreview={() => {
          const resolved = resolveAvatarRabbitBreedTemplate(template, seed)
          const decals = resolveAvatarCoatPatternDecals({
            entityParts: resolved.entityParts,
            entityPreset: 'rabbit',
            ...{ palette: resolveAvatarBreedPaletteFromEntityParts(getAvatarPalette(resolved.paletteId), resolved.entityParts) },
            paletteId: resolved.paletteId,
            pattern: resolved.coatPattern
          })
          return (
            <EntityPresetPreview
              entityParts={resolved.entityParts}
              lightDirection={{ azimuth: lightAzimuth, elevation: lightElevation }}
              preset='rabbit'
              previewBackground={template.previewBackground}
              surfaceDecals={decals}
            />
          )
        }}
      />
    )
  }

  const renderBearBreedPreview = (
    template: (typeof AVATAR_BEAR_BREED_TEMPLATES)[number],
    eager = false
  ) => {
    const staticSnapshot = getStaticBreedPreview('bear', template.id)
    return (
      <DeferredEntityPresetPreview
        eager={eager}
        previewKey={staticSnapshot == null
          ? `breed:bear:${template.id}:seed:${seed}:light:${lightAzimuth}:${lightElevation}`
          : `breed:bear:${template.id}:prebuilt`}
        scheduler={previewScheduler}
        staticSnapshot={staticSnapshot}
        renderPreview={() => {
          const resolved = resolveAvatarBearBreedTemplate(template, seed)
          const decals = resolveAvatarCoatPatternDecals({
            entityParts: resolved.entityParts,
            entityPreset: 'bear',
            ...{ palette: resolveAvatarBreedPaletteFromEntityParts(getAvatarPalette(resolved.paletteId), resolved.entityParts) },
            paletteId: resolved.paletteId,
            pattern: resolved.coatPattern
          })
          return (
            <EntityPresetPreview
              entityParts={resolved.entityParts}
              faceStyle={resolved.faceStyle}
              lightDirection={{ azimuth: lightAzimuth, elevation: lightElevation }}
              preset='bear'
              previewBackground={template.previewBackground}
              surfaceDecals={decals}
            />
          )
        }}
      />
    )
  }

  const animalSpecies = isAvatarAnimalSpeciesId(entityPreset) ? entityPreset : null
  const animalEarSeedFields = animalSpecies == null ? null : getAvatarAnimalEarSeedFields(animalSpecies)
  const animalTemplate = animalSpecies == null
    ? null
    : getAvatarAnimalBreedTemplate(animalSpecies, animalBreedTemplateId)

  const renderAnimalBreedPreview = (template: AvatarAnimalBreedTemplate, eager = false) => {
    const staticSnapshot = getStaticBreedPreview(template.species, template.id)
    return (
      <DeferredEntityPresetPreview
        eager={eager}
        previewKey={staticSnapshot == null
          ? `breed:${template.species}:${template.id}:seed:${seed}:light:${lightAzimuth}:${lightElevation}`
          : `breed:${template.species}:${template.id}:prebuilt`}
        scheduler={previewScheduler}
        staticSnapshot={staticSnapshot}
        renderPreview={() => {
          const resolved = resolveAvatarAnimalBreedTemplate(template, seed)
          const decals = [
            ...resolveAvatarCoatPatternDecals({
              entityParts: resolved.entityParts,
              entityPreset: template.species,
              ...{ palette: resolveAvatarBreedPaletteFromEntityParts(getAvatarPalette(resolved.paletteId), resolved.entityParts) },
              paletteId: resolved.paletteId,
              pattern: resolved.coatPattern
            }),
            ...(resolved.surfaceDecals ?? [])
          ]
          return (
            <EntityPresetPreview
              entityParts={resolved.entityParts}
              faceStyle={resolved.faceStyle}
              lightDirection={{ azimuth: lightAzimuth, elevation: lightElevation }}
              preset={template.species}
              previewBackground={template.previewBackground}
              surfaceDecals={decals}
            />
          )
        }}
      />
    )
  }

  const handleResizeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    resizeStartRef.current = { pointerX: event.clientX, width: controlsWidth }
    event.currentTarget.setPointerCapture(event.pointerId)
    setResizing(true)
  }

  const handleResizeMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = resizeStartRef.current
    if (start == null) return
    onControlsWidthChange(clampControlsWidth(start.width + start.pointerX - event.clientX))
  }

  const handleResizeEnd = (event: PointerEvent<HTMLDivElement>) => {
    resizeStartRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setResizing(false)
  }

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    onControlsWidthChange(clampControlsWidth(controlsWidth + (event.key === 'ArrowLeft' ? 16 : -16)))
  }

  const handlePaletteSelect = (paletteId: string) => {
    if (hasMultipleAvatarEntityMaterials(entityParts)) {
      setPendingPaletteId(paletteId)
      return
    }
    onPaletteChange(paletteId)
  }

  const handlePaletteConfirm = () => {
    if (pendingPalette == null) return
    onPaletteChange(pendingPalette.id)
    setPendingPaletteId(null)
  }

  const markPresetUsed = (key: string) => {
    setPresetUsage(currentUsage => {
      const nextUsage = touchAvatarPresetUsage(currentUsage, key)
      persistAvatarPresetUsage(nextUsage)
      return nextUsage
    })
  }

  const openPresetBrowser = (browser: AvatarPresetBrowser) => {
    setPresetSearch('')
    setPresetBrowser(browser)
  }

  const selectFacePreset = (preset: AvatarFacePreset) => {
    markPresetUsed(`face:${preset.id}`)
    setPresetBrowser(null)
    if (preset.id === DEFAULT_AVATAR_FACE_PRESET.id) {
      onResetFace()
      return
    }
    onFaceStyleChange(preset.style, 'replace')
  }

  const selectSavedPreset = (item: AvatarSavedPresetItem) => {
    markPresetUsed(item.key)
    setPresetBrowser(null)
    if (item.kind === 'entity') {
      onEntityPresetChange(item.preset)
      return
    }
    onSavedPresetSelect(item.preset)
  }

  const renderFacePresetButton = (preset: AvatarFacePreset) => (
    <button
      key={preset.id}
      className='avatar-controls__face-preset'
      type='button'
      aria-label={t(preset.label)}
      aria-pressed={preset.id === DEFAULT_AVATAR_FACE_PRESET.id
        ? isDefaultFace
        : isAvatarFacePresetSelected(faceStyle, preset)}
      title={t(preset.label)}
      onClick={() => selectFacePreset(preset)}
    >
      <FacePresetPreview preset={preset} />
    </button>
  )

  const renderSavedPresetItem = (item: AvatarSavedPresetItem, eagerPreview = false) => {
    if (item.kind === 'entity') {
      return (
        <button
          key={item.key}
          className='avatar-controls__saved-preset avatar-controls__saved-preset--entity-preset'
          type='button'
          aria-label={t(ENTITY_PRESET_LABELS[item.preset])}
          aria-pressed={entityPreset === item.preset}
          data-entity-preset={item.preset}
          onClick={() => selectSavedPreset(item)}
        >
          {renderEntityPresetPreview(item.preset, eagerPreview)}
        </button>
      )
    }

    const savedAt = new Date(item.preset.createdAt)
    const savedFrame = getSavedPresetFrame(item.preset.query)
    return (
      <div key={item.key} className='avatar-controls__saved-preset-item'>
        <button
          className='avatar-controls__saved-preset'
          type='button'
          aria-label={`Restore preset saved ${savedAt.toLocaleString()}`}
          aria-pressed={item.preset.id === selectedSavedPresetId}
          data-frame={savedFrame}
          onClick={() => selectSavedPreset(item)}
        >
          <img src={item.preset.screenshot} alt='' aria-hidden='true' />
        </button>
        <button
          className='avatar-controls__saved-preset-remove'
          type='button'
          aria-label={`Remove preset saved ${savedAt.toLocaleString()}`}
          title='Remove preset'
          onClick={() => onSavedPresetRemove(item.preset.id)}
        >
          <svg viewBox='0 0 16 16' aria-hidden='true'>
            <path d='m4.5 4.5 7 7m0-7-7 7' />
          </svg>
        </button>
      </div>
    )
  }

  const renderMorePresetButton = (browser: AvatarPresetBrowser) => (
    <button
      className='avatar-controls__preset-more'
      type='button'
      aria-label={t('More presets')}
      title={t('More presets')}
      onClick={() => openPresetBrowser(browser)}
    >
      <svg viewBox='0 0 24 24' aria-hidden='true'>
        <circle cx='5' cy='12' r='1.7' />
        <circle cx='12' cy='12' r='1.7' />
        <circle cx='19' cy='12' r='1.7' />
      </svg>
    </button>
  )

  const normalizedPresetSearch = presetSearch.trim().toLocaleLowerCase()
  const searchedFacePresets = facePresets.filter(preset => (
    normalizedPresetSearch === '' || t(preset.label).toLocaleLowerCase().includes(normalizedPresetSearch)
  ))
  const searchedSavedPresetItems = savedPresetItems.filter(item => {
    if (normalizedPresetSearch === '') return true
    const searchableLabel = item.kind === 'entity'
      ? t(ENTITY_PRESET_LABELS[item.preset])
      : `${t('Saved preset')} ${new Date(item.preset.createdAt).toLocaleString()}`
    return searchableLabel.toLocaleLowerCase().includes(normalizedPresetSearch)
  })
  const searchedEntityPresetItems = entityPresetItems.filter(item => (
    item.kind === 'entity' && (
      normalizedPresetSearch === '' ||
      t(ENTITY_PRESET_LABELS[item.preset]).toLocaleLowerCase().includes(normalizedPresetSearch)
    )
  ))
  const searchedPresetCount = presetBrowser === 'faces'
    ? searchedFacePresets.length
    : presetBrowser === 'entities' ? searchedEntityPresetItems.length : searchedSavedPresetItems.length

  return (
    <aside id='avatar-controls' className='avatar-controls' aria-label={t('Avatar controls')} data-resizing={resizing}>
      <div
        className='avatar-controls__resize-handle'
        role='separator'
        aria-label='Resize avatar controls'
        aria-orientation='vertical'
        aria-valuemin={MIN_CONTROLS_WIDTH}
        aria-valuemax={clampControlsWidth(Number.POSITIVE_INFINITY)}
        aria-valuenow={controlsWidth}
        tabIndex={0}
        onDoubleClick={() => onControlsWidthChange(DEFAULT_CONTROLS_WIDTH)}
        onKeyDown={handleResizeKeyDown}
        onPointerCancel={handleResizeEnd}
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
      />
      <div className='avatar-controls__header'>
        <button
          className='avatar-controls__collapse'
          type='button'
          aria-controls='avatar-controls'
          aria-expanded='true'
          aria-label={t('Hide controls sidebar')}
          title={t('Hide controls')}
          onClick={onCollapse}
        >
          <svg viewBox='0 0 20 20' aria-hidden='true'>
            <rect x='2.5' y='3' width='15' height='14' rx='1.5' />
            <path d='M13 3v14M6.7 7.2 9.5 10l-2.8 2.8' />
          </svg>
        </button>
        <div className='avatar-controls__tabs' role='tablist' aria-label={t('Avatar settings')}>
          {CONTROL_TABS.map(tab => (
            <button
              key={tab.id}
              id={`avatar-controls-tab-${tab.id}`}
              className='avatar-controls__tab'
              type='button'
              role='tab'
              aria-controls={`avatar-controls-panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-label={t(tab.label)}
              title={t(tab.label)}
              onClick={() => onTabChange(tab.id)}
            >
              <ControlIcon name={tab.id} />
              <span className='avatar-controls__tab-label'>{t(tab.label)}</span>
            </button>
          ))}
        </div>
        <div className='avatar-controls__header-actions'>
          {headerActions}
        </div>
      </div>

      <div
        id={`avatar-controls-panel-${activeTab}`}
        className='avatar-controls__panel'
        role='tabpanel'
        aria-labelledby={`avatar-controls-tab-${activeTab}`}
      >
        {activeTab === 'animation' ? animationContent : null}
        {activeTab === 'build'
          ? (
            <>
              <section
                className='avatar-controls__seed-settings'
                aria-labelledby={`${seedSettingsId}-trigger`}
              >
                <button
                  id={`${seedSettingsId}-trigger`}
                  className='avatar-controls__seed-disclosure'
                  type='button'
                  aria-controls={`${seedSettingsId}-content`}
                  aria-expanded={seedSettingsOpen}
                  aria-label={t('Seed settings')}
                  onClick={() => setSeedSettingsOpen(open => !open)}
                >
                  <span className='avatar-controls__label'>
                    <ControlIcon name='build' />
                    {t('Seed')}
                  </span>
                  <span className='avatar-controls__seed-summary'>
                    <span className='avatar-controls__seed-count'>
                      {t('Seeded fields')}: {seededFields.length}
                    </span>
                    <svg viewBox='0 0 16 16' aria-hidden='true'>
                      <path d='m4.5 6 3.5 4 3.5-4' />
                    </svg>
                  </span>
                </button>
                {seedSettingsOpen
                  ? (
                    <div
                      id={`${seedSettingsId}-content`}
                      className='avatar-controls__seed-input'
                      aria-labelledby={`${seedSettingsId}-trigger`}
                    >
                      <input
                        type='text'
                        aria-label={t('Current Seed')}
                        autoCapitalize='off'
                        autoComplete='off'
                        spellCheck='false'
                        value={seedDraft}
                        onBlur={commitSeedDraft}
                        onChange={event => setSeedDraft(event.currentTarget.value)}
                        onKeyDown={event => {
                          if (event.key === 'Enter') event.currentTarget.blur()
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            setSeedDraft(seed)
                          }
                        }}
                      />
                      <button
                        type='button'
                        aria-label={t('Generate random Seed')}
                        title={t('Generate random Seed')}
                        onClick={onRandomSeed}
                      >
                        <svg viewBox='0 0 20 20' aria-hidden='true'>
                          <rect x='3' y='3' width='14' height='14' rx='4' />
                          <circle cx='7' cy='7' r='1' />
                          <circle cx='13' cy='7' r='1' />
                          <circle cx='10' cy='10' r='1' />
                          <circle cx='7' cy='13' r='1' />
                          <circle cx='13' cy='13' r='1' />
                        </svg>
                      </button>
                    </div>
                  )
                  : null}
              </section>

              <section className='avatar-controls__field-group' aria-label={t('View composition')}>
                {renderSeedFieldHeader('build', 'View composition', AVATAR_SEED_FIELD.viewPose)}
              </section>

              <section className='avatar-controls__field-group' aria-label={t('Avatar type')}>
                {renderSeedFieldHeader('build', 'Avatar type', AVATAR_SEED_FIELD.entityPreset)}
                <div className='avatar-controls__saved-preset-list'>
                  {compactEntityPresetItems.map(item => renderSavedPresetItem(item, true))}
                  {entityPresetItems.length > compactPresetCapacity
                    ? renderMorePresetButton('entities')
                    : null}
                </div>
              </section>

              {entityPreset === 'cat'
                ? (
                  <section className='avatar-controls__field-group' aria-label={t('Cat types')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='style' />
                        {t('Cat types')}
                      </span>
                    </div>
                    <div className='avatar-controls__saved-preset-list avatar-controls__cat-breed-list'>
                      {AVATAR_CAT_BREED_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          className='avatar-controls__saved-preset avatar-controls__saved-preset--entity-preset avatar-controls__cat-breed-preset'
                          type='button'
                          aria-label={t(template.label)}
                          aria-pressed={catBreedTemplateId === template.id}
                          data-cat-breed={template.id}
                          title={t(template.label)}
                          onClick={() => onCatBreedTemplateChange(
                            catBreedTemplateId === template.id ? null : template.id
                          )}
                        >
                          {renderCatBreedPreview(template)}
                        </button>
                      ))}
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'dog'
                ? (
                  <section className='avatar-controls__field-group' aria-label={t('Dog types')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='style' />
                        {t('Dog types')}
                      </span>
                    </div>
                    <div className='avatar-controls__saved-preset-list avatar-controls__dog-breed-list'>
                      {AVATAR_DOG_BREED_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          className='avatar-controls__saved-preset avatar-controls__saved-preset--entity-preset avatar-controls__dog-breed-preset'
                          type='button'
                          aria-label={t(template.label)}
                          aria-pressed={dogBreedTemplateId === template.id}
                          data-dog-breed={template.id}
                          title={t(template.label)}
                          onClick={() => onDogBreedTemplateChange(
                            dogBreedTemplateId === template.id ? null : template.id
                          )}
                        >
                          {renderDogBreedPreview(template)}
                        </button>
                      ))}
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'rabbit'
                ? (
                  <section className='avatar-controls__field-group' aria-label={t('Rabbit types')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='style' />
                        {t('Rabbit types')}
                      </span>
                    </div>
                    <div className='avatar-controls__saved-preset-list avatar-controls__rabbit-breed-list'>
                      {AVATAR_RABBIT_BREED_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          className='avatar-controls__saved-preset avatar-controls__saved-preset--entity-preset avatar-controls__rabbit-breed-preset'
                          type='button'
                          aria-label={t(template.label)}
                          aria-pressed={rabbitBreedTemplateId === template.id}
                          data-rabbit-breed={template.id}
                          title={t(template.label)}
                          onClick={() => onRabbitBreedTemplateChange(
                            rabbitBreedTemplateId === template.id ? null : template.id
                          )}
                        >
                          {renderRabbitBreedPreview(template)}
                        </button>
                      ))}
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'bear'
                ? (
                  <section className='avatar-controls__field-group' aria-label={t('Bear types')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='style' />
                        {t('Bear types')}
                      </span>
                    </div>
                    <div className='avatar-controls__saved-preset-list avatar-controls__bear-breed-list'>
                      {AVATAR_BEAR_BREED_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          className='avatar-controls__saved-preset avatar-controls__saved-preset--entity-preset avatar-controls__bear-breed-preset'
                          type='button'
                          aria-label={t(template.label)}
                          aria-pressed={bearBreedTemplateId === template.id}
                          data-bear-breed={template.id}
                          title={t(template.label)}
                          onClick={() => onBearBreedTemplateChange(bearBreedTemplateId === template.id ? null : template.id)}
                        >
                          {renderBearBreedPreview(template)}
                        </button>
                      ))}
                    </div>
                  </section>
                )
                : null}

              {animalSpecies == null
                ? null
                : (
                  <section
                    className='avatar-controls__field-group'
                    aria-label={t(`${ENTITY_PRESET_LABELS[animalSpecies]} types`)}
                  >
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='style' />
                        {t(`${ENTITY_PRESET_LABELS[animalSpecies]} types`)}
                      </span>
                    </div>
                    <div className='avatar-controls__saved-preset-list avatar-controls__animal-breed-list'>
                      {getAvatarAnimalBreedTemplates(animalSpecies).map(template => (
                        <button
                          key={template.id}
                          className='avatar-controls__saved-preset avatar-controls__saved-preset--entity-preset avatar-controls__animal-breed-preset'
                          type='button'
                          aria-label={t(template.label)}
                          aria-pressed={animalBreedTemplateId === template.id}
                          data-animal-breed={template.id}
                          title={t(template.label)}
                          onClick={() => onAnimalBreedTemplateChange?.(template.id)}
                        >
                          {renderAnimalBreedPreview(template)}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {savedPresetItems.length === 0
                ? null
                : (
                  <section className='avatar-controls__saved-presets' aria-label={t('Saved looks')}>
                    <span className='avatar-controls__label'>
                      <ControlIcon name='history' />
                      {t('Saved looks')}
                    </span>
                    <div className='avatar-controls__saved-preset-list'>
                      {compactSavedPresetItems.map(item => renderSavedPresetItem(item))}
                      {savedPresetItems.length > compactPresetCapacity
                        ? renderMorePresetButton('saved')
                        : null}
                    </div>
                  </section>
                )}

              {entityPreset === 'cat'
                ? (
                  <section className='avatar-controls__field-group avatar-controls__cat-ear-size' aria-label={t('Cat ear size')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='body' />
                        {t('Cat ear size')}
                      </span>
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Ear width')}</span>
                        <SeedFieldToggle
                          enabled={seededFields.includes(AVATAR_SEED_FIELD.catEarWidth)}
                          label='Ear width'
                          onChange={() => onSeedFieldToggle(
                            AVATAR_SEED_FIELD.catEarWidth,
                            !seededFields.includes(AVATAR_SEED_FIELD.catEarWidth)
                          )}
                        />
                      </div>
                      <ValueSlider
                        ariaLabel='Cat ear width'
                        label='Width'
                        min={CAT_EAR_SCALE_RANGE.min}
                        max={CAT_EAR_SCALE_RANGE.max}
                        suffix='%'
                        value={catEarWidth}
                        onChange={onCatEarWidthChange}
                      />
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Ear height')}</span>
                        <SeedFieldToggle
                          enabled={seededFields.includes(AVATAR_SEED_FIELD.catEarHeight)}
                          label='Ear height'
                          onChange={() => onSeedFieldToggle(
                            AVATAR_SEED_FIELD.catEarHeight,
                            !seededFields.includes(AVATAR_SEED_FIELD.catEarHeight)
                          )}
                        />
                      </div>
                      <ValueSlider
                        ariaLabel='Cat ear height'
                        label='Height'
                        min={CAT_EAR_SCALE_RANGE.min}
                        max={CAT_EAR_SCALE_RANGE.max}
                        suffix='%'
                        value={catEarHeight}
                        onChange={onCatEarHeightChange}
                      />
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'dog'
                ? (
                  <section className='avatar-controls__field-group avatar-controls__dog-head-size' aria-label={t('Dog head size')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='body' />
                        {t('Dog head size')}
                      </span>
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Head width')}</span>
                        <SeedFieldToggle
                          enabled={seededFields.includes(AVATAR_SEED_FIELD.dogHeadWidth)}
                          label='Head width'
                          onChange={() => onSeedFieldToggle(
                            AVATAR_SEED_FIELD.dogHeadWidth,
                            !seededFields.includes(AVATAR_SEED_FIELD.dogHeadWidth)
                          )}
                        />
                      </div>
                      <ValueSlider
                        ariaLabel='Dog head width'
                        label='Width'
                        min={DOG_HEAD_SCALE_RANGE.min}
                        max={DOG_HEAD_SCALE_RANGE.max}
                        suffix='%'
                        value={dogHeadWidth}
                        onChange={onDogHeadWidthChange}
                      />
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Head height')}</span>
                        <SeedFieldToggle
                          enabled={seededFields.includes(AVATAR_SEED_FIELD.dogHeadHeight)}
                          label='Head height'
                          onChange={() => onSeedFieldToggle(
                            AVATAR_SEED_FIELD.dogHeadHeight,
                            !seededFields.includes(AVATAR_SEED_FIELD.dogHeadHeight)
                          )}
                        />
                      </div>
                      <ValueSlider
                        ariaLabel='Dog head height'
                        label='Height'
                        min={DOG_HEAD_SCALE_RANGE.min}
                        max={DOG_HEAD_SCALE_RANGE.max}
                        suffix='%'
                        value={dogHeadHeight}
                        onChange={onDogHeadHeightChange}
                      />
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'dog'
                ? (
                  <section className='avatar-controls__field-group avatar-controls__dog-ear-size' aria-label={t('Dog ear size')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='body' />
                        {t('Dog ear size')}
                      </span>
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Ear width')}</span>
                        <SeedFieldToggle
                          enabled={seededFields.includes(AVATAR_SEED_FIELD.dogEarWidth)}
                          label='Ear width'
                          onChange={() => onSeedFieldToggle(
                            AVATAR_SEED_FIELD.dogEarWidth,
                            !seededFields.includes(AVATAR_SEED_FIELD.dogEarWidth)
                          )}
                        />
                      </div>
                      <ValueSlider
                        ariaLabel='Dog ear width'
                        label='Width'
                        min={DOG_EAR_SCALE_RANGE.min}
                        max={DOG_EAR_SCALE_RANGE.max}
                        suffix='%'
                        value={dogEarWidth}
                        onChange={onDogEarWidthChange}
                      />
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Ear height')}</span>
                        <SeedFieldToggle
                          enabled={seededFields.includes(AVATAR_SEED_FIELD.dogEarHeight)}
                          label='Ear height'
                          onChange={() => onSeedFieldToggle(
                            AVATAR_SEED_FIELD.dogEarHeight,
                            !seededFields.includes(AVATAR_SEED_FIELD.dogEarHeight)
                          )}
                        />
                      </div>
                      <ValueSlider
                        ariaLabel='Dog ear height'
                        label='Height'
                        min={DOG_EAR_SCALE_RANGE.min}
                        max={DOG_EAR_SCALE_RANGE.max}
                        suffix='%'
                        value={dogEarHeight}
                        onChange={onDogEarHeightChange}
                      />
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'rabbit'
                ? (
                  <section className='avatar-controls__field-group avatar-controls__rabbit-head-size' aria-label={t('Rabbit head size')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='body' />
                        {t('Rabbit head size')}
                      </span>
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Head width')}</span>
                        <SeedFieldToggle enabled={seededFields.includes(AVATAR_SEED_FIELD.rabbitHeadWidth)} label='Head width' onChange={() => onSeedFieldToggle(AVATAR_SEED_FIELD.rabbitHeadWidth, !seededFields.includes(AVATAR_SEED_FIELD.rabbitHeadWidth))} />
                      </div>
                      <ValueSlider ariaLabel='Rabbit head width' label='Width' min={RABBIT_HEAD_SCALE_RANGE.min} max={RABBIT_HEAD_SCALE_RANGE.max} suffix='%' value={rabbitHeadWidth} onChange={onRabbitHeadWidthChange} />
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Head height')}</span>
                        <SeedFieldToggle enabled={seededFields.includes(AVATAR_SEED_FIELD.rabbitHeadHeight)} label='Head height' onChange={() => onSeedFieldToggle(AVATAR_SEED_FIELD.rabbitHeadHeight, !seededFields.includes(AVATAR_SEED_FIELD.rabbitHeadHeight))} />
                      </div>
                      <ValueSlider ariaLabel='Rabbit head height' label='Height' min={RABBIT_HEAD_SCALE_RANGE.min} max={RABBIT_HEAD_SCALE_RANGE.max} suffix='%' value={rabbitHeadHeight} onChange={onRabbitHeadHeightChange} />
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'rabbit'
                ? (
                  <section className='avatar-controls__field-group avatar-controls__rabbit-ear-size' aria-label={t('Rabbit ear size')}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='body' />
                        {t('Rabbit ear size')}
                      </span>
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Ear width')}</span>
                        <SeedFieldToggle enabled={seededFields.includes(AVATAR_SEED_FIELD.rabbitEarWidth)} label='Ear width' onChange={() => onSeedFieldToggle(AVATAR_SEED_FIELD.rabbitEarWidth, !seededFields.includes(AVATAR_SEED_FIELD.rabbitEarWidth))} />
                      </div>
                      <ValueSlider ariaLabel='Rabbit ear width' label='Width' min={RABBIT_EAR_SCALE_RANGE.min} max={RABBIT_EAR_SCALE_RANGE.max} suffix='%' value={rabbitEarWidth} onChange={onRabbitEarWidthChange} />
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'>
                        <span>{t('Ear height')}</span>
                        <SeedFieldToggle enabled={seededFields.includes(AVATAR_SEED_FIELD.rabbitEarHeight)} label='Ear height' onChange={() => onSeedFieldToggle(AVATAR_SEED_FIELD.rabbitEarHeight, !seededFields.includes(AVATAR_SEED_FIELD.rabbitEarHeight))} />
                      </div>
                      <ValueSlider ariaLabel='Rabbit ear height' label='Height' min={RABBIT_EAR_SCALE_RANGE.min} max={RABBIT_EAR_SCALE_RANGE.max} suffix='%' value={rabbitEarHeight} onChange={onRabbitEarHeightChange} />
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'bear'
                ? (
                  <section className='avatar-controls__field-group avatar-controls__bear-head-size' aria-label={t('Bear head size')}>
                    <div className='avatar-controls__field-header'><span className='avatar-controls__label'><ControlIcon name='body' />{t('Bear head size')}</span></div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'><span>{t('Head width')}</span><SeedFieldToggle enabled={seededFields.includes(AVATAR_SEED_FIELD.bearHeadWidth)} label='Head width' onChange={() => onSeedFieldToggle(AVATAR_SEED_FIELD.bearHeadWidth, !seededFields.includes(AVATAR_SEED_FIELD.bearHeadWidth))} /></div>
                      <ValueSlider ariaLabel='Bear head width' label='Width' min={BEAR_HEAD_SCALE_RANGE.min} max={BEAR_HEAD_SCALE_RANGE.max} suffix='%' value={bearHeadWidth} onChange={onBearHeadWidthChange} />
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'><span>{t('Head height')}</span><SeedFieldToggle enabled={seededFields.includes(AVATAR_SEED_FIELD.bearHeadHeight)} label='Head height' onChange={() => onSeedFieldToggle(AVATAR_SEED_FIELD.bearHeadHeight, !seededFields.includes(AVATAR_SEED_FIELD.bearHeadHeight))} /></div>
                      <ValueSlider ariaLabel='Bear head height' label='Height' min={BEAR_HEAD_SCALE_RANGE.min} max={BEAR_HEAD_SCALE_RANGE.max} suffix='%' value={bearHeadHeight} onChange={onBearHeadHeightChange} />
                    </div>
                  </section>
                )
                : null}

              {entityPreset === 'bear'
                ? (
                  <section className='avatar-controls__field-group avatar-controls__bear-ear-size' aria-label={t('Bear ear size')}>
                    <div className='avatar-controls__field-header'><span className='avatar-controls__label'><ControlIcon name='body' />{t('Bear ear size')}</span></div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'><span>{t('Ear width')}</span><SeedFieldToggle enabled={seededFields.includes(AVATAR_SEED_FIELD.bearEarWidth)} label='Ear width' onChange={() => onSeedFieldToggle(AVATAR_SEED_FIELD.bearEarWidth, !seededFields.includes(AVATAR_SEED_FIELD.bearEarWidth))} /></div>
                      <ValueSlider ariaLabel='Bear ear width' label='Width' min={BEAR_EAR_SCALE_RANGE.min} max={BEAR_EAR_SCALE_RANGE.max} suffix='%' value={bearEarWidth} onChange={onBearEarWidthChange} />
                    </div>
                    <div className='avatar-controls__coat-row'>
                      <div className='avatar-controls__coat-row-header'><span>{t('Ear height')}</span><SeedFieldToggle enabled={seededFields.includes(AVATAR_SEED_FIELD.bearEarHeight)} label='Ear height' onChange={() => onSeedFieldToggle(AVATAR_SEED_FIELD.bearEarHeight, !seededFields.includes(AVATAR_SEED_FIELD.bearEarHeight))} /></div>
                      <ValueSlider ariaLabel='Bear ear height' label='Height' min={BEAR_EAR_SCALE_RANGE.min} max={BEAR_EAR_SCALE_RANGE.max} suffix='%' value={bearEarHeight} onChange={onBearEarHeightChange} />
                    </div>
                  </section>
                )
                : null}

              {animalSpecies == null
                ? null
                : (
                  <>
                    <section
                      className='avatar-controls__field-group avatar-controls__animal-head-size'
                      aria-label={t(`${ENTITY_PRESET_LABELS[animalSpecies]} head size`)}
                    >
                      <div className='avatar-controls__field-header'>
                        <span className='avatar-controls__label'>
                          <ControlIcon name='body' />
                          {t(`${ENTITY_PRESET_LABELS[animalSpecies]} head size`)}
                        </span>
                      </div>
                      <div className='avatar-controls__coat-row'>
                        <div className='avatar-controls__coat-row-header'>
                          <span>{t('Head width')}</span>
                          <SeedFieldToggle
                            enabled={seededFields.includes(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[animalSpecies].headWidth)}
                            label='Head width'
                            onChange={() => onSeedFieldToggle(
                              AVATAR_ANIMAL_SPECIES_SEED_FIELDS[animalSpecies].headWidth,
                              !seededFields.includes(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[animalSpecies].headWidth)
                            )}
                          />
                        </div>
                        <ValueSlider
                          ariaLabel={`${ENTITY_PRESET_LABELS[animalSpecies]} head width`}
                          label='Width'
                          min={getAvatarAnimalScaleRange(animalSpecies, 'head').min}
                          max={getAvatarAnimalScaleRange(animalSpecies, 'head').max}
                          suffix='%'
                          value={animalHeadWidth}
                          onChange={value => onAnimalHeadWidthChange?.(value)}
                        />
                      </div>
                      <div className='avatar-controls__coat-row'>
                        <div className='avatar-controls__coat-row-header'>
                          <span>{t('Head height')}</span>
                          <SeedFieldToggle
                            enabled={seededFields.includes(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[animalSpecies].headHeight)}
                            label='Head height'
                            onChange={() => onSeedFieldToggle(
                              AVATAR_ANIMAL_SPECIES_SEED_FIELDS[animalSpecies].headHeight,
                              !seededFields.includes(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[animalSpecies].headHeight)
                            )}
                          />
                        </div>
                        <ValueSlider
                          ariaLabel={`${ENTITY_PRESET_LABELS[animalSpecies]} head height`}
                          label='Height'
                          min={getAvatarAnimalScaleRange(animalSpecies, 'head').min}
                          max={getAvatarAnimalScaleRange(animalSpecies, 'head').max}
                          suffix='%'
                          value={animalHeadHeight}
                          onChange={value => onAnimalHeadHeightChange?.(value)}
                        />
                      </div>
                    </section>

                    {animalSpecies === 'seal' || animalEarSeedFields == null ? null : <section
                      className='avatar-controls__field-group avatar-controls__animal-ear-size'
                      aria-label={t(`${ENTITY_PRESET_LABELS[animalSpecies]} ear size`)}
                    >
                      <div className='avatar-controls__field-header'>
                        <span className='avatar-controls__label'>
                          <ControlIcon name='body' />
                          {t(`${ENTITY_PRESET_LABELS[animalSpecies]} ear size`)}
                        </span>
                      </div>
                      <div className='avatar-controls__coat-row'>
                        <div className='avatar-controls__coat-row-header'>
                          <span>{t('Ear width')}</span>
                          <SeedFieldToggle
                            enabled={seededFields.includes(animalEarSeedFields.earWidth)}
                            label='Ear width'
                            onChange={() => onSeedFieldToggle(
                              animalEarSeedFields.earWidth,
                              !seededFields.includes(animalEarSeedFields.earWidth)
                            )}
                          />
                        </div>
                        <ValueSlider
                          ariaLabel={`${ENTITY_PRESET_LABELS[animalSpecies]} ear width`}
                          label='Width'
                          min={getAvatarAnimalScaleRange(animalSpecies, 'ear').min}
                          max={getAvatarAnimalScaleRange(animalSpecies, 'ear').max}
                          suffix='%'
                          value={animalEarWidth}
                          onChange={value => onAnimalEarWidthChange?.(value)}
                        />
                      </div>
                      <div className='avatar-controls__coat-row'>
                        <div className='avatar-controls__coat-row-header'>
                          <span>{t('Ear height')}</span>
                          <SeedFieldToggle
                            enabled={seededFields.includes(animalEarSeedFields.earHeight)}
                            label='Ear height'
                            onChange={() => onSeedFieldToggle(
                              animalEarSeedFields.earHeight,
                              !seededFields.includes(animalEarSeedFields.earHeight)
                            )}
                          />
                        </div>
                        <ValueSlider
                          ariaLabel={`${ENTITY_PRESET_LABELS[animalSpecies]} ear height`}
                          label='Height'
                          min={getAvatarAnimalScaleRange(animalSpecies, 'ear').min}
                          max={getAvatarAnimalScaleRange(animalSpecies, 'ear').max}
                          suffix='%'
                          value={animalEarHeight}
                          onChange={value => onAnimalEarHeightChange?.(value)}
                        />
                      </div>
                    </section>}

                    {getAvatarAnimalHornSeedField(animalSpecies) != null &&
                      animalTemplate?.fixed.hornSize != null && animalTemplate.fixed.hornStyle !== 'none'
                      ? (
                        <section
                          className='avatar-controls__field-group avatar-controls__animal-horn-size'
                            aria-label={t(animalSpecies === 'deer' ? 'Antler size' : animalSpecies === 'cow' ? 'Cow horn size' : animalSpecies === 'squirrel' ? 'Tail size' : animalSpecies === 'lion' ? 'Mane size' : animalSpecies === 'hedgehog' ? 'Spine size' : animalSpecies === 'beaver' ? 'Incisor size' : 'Horn size')}
                        >
                          <div className='avatar-controls__field-header'>
                            <span className='avatar-controls__label'>
                              <ControlIcon name='body' />
                              {t(animalSpecies === 'deer' ? 'Antler size' : animalSpecies === 'cow' ? 'Cow horn size' : animalSpecies === 'squirrel' ? 'Tail size' : animalSpecies === 'lion' ? 'Mane size' : animalSpecies === 'hedgehog' ? 'Spine size' : animalSpecies === 'beaver' ? 'Incisor size' : 'Horn size')}
                            </span>
                            <SeedFieldToggle
                              enabled={seededFields.includes(getAvatarAnimalHornSeedField(animalSpecies)!)}
                              label={animalSpecies === 'deer' ? 'Antler size' : animalSpecies === 'cow' ? 'Cow horn size' : animalSpecies === 'squirrel' ? 'Tail size' : animalSpecies === 'lion' ? 'Mane size' : animalSpecies === 'hedgehog' ? 'Spine size' : animalSpecies === 'beaver' ? 'Incisor size' : 'Horn size'}
                              onChange={() => {
                                const field = getAvatarAnimalHornSeedField(animalSpecies)!
                                onSeedFieldToggle(field, !seededFields.includes(field))
                              }}
                            />
                          </div>
                          <ValueSlider
                            ariaLabel={animalSpecies === 'deer' ? 'Deer antler size' : animalSpecies === 'cow' ? 'Cow horn size' : animalSpecies === 'squirrel' ? 'Squirrel tail size' : animalSpecies === 'lion' ? 'Lion mane size' : animalSpecies === 'hedgehog' ? 'Hedgehog spine size' : animalSpecies === 'beaver' ? 'Incisor size' : 'Sheep horn size'}
                            label='Size'
                            min={getAvatarAnimalScaleRange(animalSpecies, 'horn').min}
                            max={getAvatarAnimalScaleRange(animalSpecies, 'horn').max}
                            suffix='%'
                            value={animalHornSize}
                            onChange={value => onAnimalHornSizeChange?.(value)}
                          />
                        </section>
                      )
                      : null}
                  </>
                )}

              <div className='avatar-controls__field-group'>
                {renderSeedFieldHeader('eyes', 'Face', AVATAR_SEED_FIELD.facePreset)}
                <div className='avatar-controls__face-presets' role='group' aria-label={t('Face presets')}>
                  {compactFacePresets.map(renderFacePresetButton)}
                  {facePresets.length > compactPresetCapacity
                    ? renderMorePresetButton('faces')
                    : null}
                </div>
                <div
                  className='avatar-controls__segments avatar-controls__face-tabs'
                  role='tablist'
                  aria-label={t('Face parts')}
                >
                  {(['eyes', 'nose', 'mouth'] satisfies AvatarFacePart[]).map(part => (
                    <button
                      key={part}
                      className='avatar-controls__segment'
                      type='button'
                      role='tab'
                      aria-selected={activeFacePart === part}
                      onClick={() => setActiveFacePart(part)}
                    >
                      <ControlIcon name={part} />
                      {t(`${part[0]?.toUpperCase()}${part.slice(1)}`)}
                    </button>
                  ))}
                </div>
                {activeFacePart === 'eyes'
                  ? (
                    <>
                      <GeometricShapePicker
                        ariaLabel='Eye shape'
                        options={EYE_SHAPE_OPTIONS}
                        value={faceStyle.eyeShape}
                        onChange={eyeShape => onFaceStyleChange({ eyeShape })}
                      />
                      <div className='avatar-controls__parameter-controls'>
                        {faceStyle.eyeShape === 'rounded'
                          ? (
                            <ValueSlider
                              ariaLabel='Eye corner roundness'
                              label='Roundness'
                              min={AVATAR_FACE_RANGES.eyeRoundness.min}
                              max={AVATAR_FACE_RANGES.eyeRoundness.max}
                              suffix='%'
                              value={faceStyle.eyeRoundness}
                              onChange={eyeRoundness => onFaceStyleChange({ eyeRoundness })}
                            />
                          )
                          : null}
                        <ValueSlider
                          ariaLabel='Eye width'
                          label='Width'
                          min={AVATAR_FACE_RANGES.width.min}
                          max={AVATAR_FACE_RANGES.width.max}
                          value={faceStyle.width}
                          onChange={width => onFaceStyleChange({ width })}
                        />
                        <ValueSlider
                          ariaLabel='Eye height'
                          label='Height'
                          min={AVATAR_FACE_RANGES.height.min}
                          max={AVATAR_FACE_RANGES.height.max}
                          value={faceStyle.height}
                          onChange={height => onFaceStyleChange({ height })}
                        />
                        <ValueSlider
                          ariaLabel='Eye gap'
                          label='Gap'
                          min={AVATAR_FACE_RANGES.gap.min}
                          max={AVATAR_FACE_RANGES.gap.max}
                          value={faceStyle.gap}
                          onChange={gap => onFaceStyleChange({ gap })}
                        />
                        <ValueSlider
                          ariaLabel='Overall eye rotation'
                          label='Rotation (overall)'
                          min={AVATAR_FACE_RANGES.rotation.min}
                          max={AVATAR_FACE_RANGES.rotation.max}
                          suffix='°'
                          value={faceStyle.rotation}
                          onChange={rotation => onFaceStyleChange({ rotation })}
                        />
                        <ValueSlider
                          ariaLabel='Left eye tilt'
                          label='Left tilt'
                          min={AVATAR_FACE_RANGES.leftEyeRotation.min}
                          max={AVATAR_FACE_RANGES.leftEyeRotation.max}
                          suffix='°'
                          value={faceStyle.leftEyeRotation}
                          onChange={leftEyeRotation => onFaceStyleChange({ leftEyeRotation })}
                        />
                        <ValueSlider
                          ariaLabel='Right eye tilt'
                          label='Right tilt'
                          min={AVATAR_FACE_RANGES.rightEyeRotation.min}
                          max={AVATAR_FACE_RANGES.rightEyeRotation.max}
                          suffix='°'
                          value={faceStyle.rightEyeRotation}
                          onChange={rightEyeRotation => onFaceStyleChange({ rightEyeRotation })}
                        />
                      </div>
                      <ToggleRow
                        checked={faceStyle.eyeHighlight.enabled}
                        icon='eyes'
                        label='Eye highlights'
                        onChange={() =>
                          onFaceStyleChange({
                            eyeHighlight: {
                              ...faceStyle.eyeHighlight,
                              enabled: !faceStyle.eyeHighlight.enabled
                            }
                          })}
                      />
                      {faceStyle.eyeHighlight.enabled
                        ? (
                          <div className='avatar-controls__parameter-controls'>
                            <label className='avatar-controls__entity-color'>
                              <span>{t('Highlight color')}</span>
                              <input
                                type='color'
                                aria-label={t('Highlight color')}
                                value={faceStyle.eyeHighlight.color}
                                onChange={event =>
                                  onFaceStyleChange({
                                    eyeHighlight: { ...faceStyle.eyeHighlight, color: event.currentTarget.value }
                                  })}
                              />
                            </label>
                            <ValueSlider
                              ariaLabel='Eye highlight size'
                              label='Highlight size'
                              min={AVATAR_EYE_HIGHLIGHT_RANGES.size.min}
                              max={AVATAR_EYE_HIGHLIGHT_RANGES.size.max}
                              suffix='%'
                              value={faceStyle.eyeHighlight.size}
                              onChange={size =>
                                onFaceStyleChange({
                                  eyeHighlight: { ...faceStyle.eyeHighlight, size }
                                })}
                            />
                            <ValueSlider
                              ariaLabel='Eye highlight horizontal position'
                              label='Highlight position X'
                              min={AVATAR_EYE_HIGHLIGHT_RANGES.offsetX.min}
                              max={AVATAR_EYE_HIGHLIGHT_RANGES.offsetX.max}
                              suffix='%'
                              value={faceStyle.eyeHighlight.offsetX}
                              onChange={offsetX =>
                                onFaceStyleChange({
                                  eyeHighlight: { ...faceStyle.eyeHighlight, offsetX }
                                })}
                            />
                            <ValueSlider
                              ariaLabel='Eye highlight vertical position'
                              label='Highlight position Y'
                              min={AVATAR_EYE_HIGHLIGHT_RANGES.offsetY.min}
                              max={AVATAR_EYE_HIGHLIGHT_RANGES.offsetY.max}
                              suffix='%'
                              value={faceStyle.eyeHighlight.offsetY}
                              onChange={offsetY =>
                                onFaceStyleChange({
                                  eyeHighlight: { ...faceStyle.eyeHighlight, offsetY }
                                })}
                            />
                            <ValueSlider
                              ariaLabel='Eye highlight opacity'
                              label='Highlight opacity'
                              min={AVATAR_EYE_HIGHLIGHT_RANGES.opacity.min}
                              max={AVATAR_EYE_HIGHLIGHT_RANGES.opacity.max}
                              suffix='%'
                              value={faceStyle.eyeHighlight.opacity}
                              onChange={opacity =>
                                onFaceStyleChange({
                                  eyeHighlight: { ...faceStyle.eyeHighlight, opacity }
                                })}
                            />
                          </div>
                        )
                        : null}
                    </>
                  )
                  : null}
                {activeFacePart === 'nose'
                  ? (
                    <>
                      <ToggleRow
                        checked={faceStyle.noseEnabled}
                        icon='nose'
                        label='Show nose'
                        onChange={() => onFaceStyleChange({ noseEnabled: !faceStyle.noseEnabled })}
                      />
                      {faceStyle.noseEnabled
                        ? (
                          <>
                            <GeometricShapePicker
                              ariaLabel='Nose shape'
                              options={NOSE_SHAPE_OPTIONS}
                              value={faceStyle.noseShape}
                              onChange={noseShape => onFaceStyleChange({ noseShape })}
                            />
                            <div className='avatar-controls__parameter-controls'>
                              <ValueSlider
                                ariaLabel='Nose width'
                                label='Width'
                                min={AVATAR_FACE_RANGES.noseWidth.min}
                                max={AVATAR_FACE_RANGES.noseWidth.max}
                                value={faceStyle.noseWidth}
                                onChange={noseWidth => onFaceStyleChange({ noseWidth })}
                              />
                              <ValueSlider
                                ariaLabel='Nose height'
                                label='Height'
                                min={AVATAR_FACE_RANGES.noseHeight.min}
                                max={AVATAR_FACE_RANGES.noseHeight.max}
                                value={faceStyle.noseHeight}
                                onChange={noseHeight => onFaceStyleChange({ noseHeight })}
                              />
                              <ValueSlider
                                ariaLabel='Nose vertical position'
                                label='Position Y'
                                min={AVATAR_FACE_RANGES.noseY.min}
                                max={AVATAR_FACE_RANGES.noseY.max}
                                value={faceStyle.noseY}
                                onChange={noseY => onFaceStyleChange({ noseY })}
                              />
                              <ValueSlider
                                ariaLabel='Nose rotation'
                                label='Rotation'
                                min={AVATAR_FACE_RANGES.noseRotation.min}
                                max={AVATAR_FACE_RANGES.noseRotation.max}
                                suffix='°'
                                value={faceStyle.noseRotation}
                                onChange={noseRotation => onFaceStyleChange({ noseRotation })}
                              />
                            </div>
                          </>
                        )
                        : null}
                    </>
                  )
                  : null}
                {activeFacePart === 'mouth'
                  ? (
                    <>
                      <ToggleRow
                        checked={faceStyle.mouthEnabled}
                        icon='mouth'
                        label='Show mouth'
                        onChange={() => onFaceStyleChange({ mouthEnabled: !faceStyle.mouthEnabled })}
                      />
                      {faceStyle.mouthEnabled
                        ? (
                          <>
                            <GeometricShapePicker
                              ariaLabel='Mouth shape'
                              options={MOUTH_SHAPE_OPTIONS}
                              value={faceStyle.mouthShape}
                              onChange={mouthShape => onFaceStyleChange({ mouthShape })}
                            />
                            <div className='avatar-controls__parameter-controls'>
                              <ValueSlider
                                ariaLabel='Mouth width'
                                label='Width'
                                min={AVATAR_FACE_RANGES.mouthWidth.min}
                                max={AVATAR_FACE_RANGES.mouthWidth.max}
                                value={faceStyle.mouthWidth}
                                onChange={mouthWidth => onFaceStyleChange({ mouthWidth })}
                              />
                              <ValueSlider
                                ariaLabel='Mouth height'
                                label={faceStyle.mouthShape === 'curve' ? 'Thickness' : 'Height'}
                                min={AVATAR_FACE_RANGES.mouthHeight.min}
                                max={AVATAR_FACE_RANGES.mouthHeight.max}
                                value={faceStyle.mouthHeight}
                                onChange={mouthHeight => onFaceStyleChange({ mouthHeight })}
                              />
                              <ValueSlider
                                ariaLabel='Mouth vertical position'
                                label='Position Y'
                                min={AVATAR_FACE_RANGES.mouthY.min}
                                max={AVATAR_FACE_RANGES.mouthY.max}
                                value={faceStyle.mouthY}
                                onChange={mouthY => onFaceStyleChange({ mouthY })}
                              />
                              {faceStyle.mouthShape === 'curve'
                                ? (
                                  <>
                                    <ValueSlider
                                      ariaLabel='Mouth curvature from frown to smile'
                                      label='Curvature'
                                      min={AVATAR_FACE_RANGES.mouthCurve.min}
                                      max={AVATAR_FACE_RANGES.mouthCurve.max}
                                      suffix='%'
                                      value={faceStyle.mouthCurve}
                                      onChange={mouthCurve => onFaceStyleChange({ mouthCurve })}
                                    />
                                    <div className='avatar-controls__curve-scale' aria-hidden='true'>
                                      <span>{t('Frown')}</span>
                                      <span>{t('Flat')}</span>
                                      <span>{t('Smile')}</span>
                                    </div>
                                  </>
                                )
                                : null}
                              <ValueSlider
                                ariaLabel='Mouth rotation'
                                label='Rotation'
                                min={AVATAR_FACE_RANGES.mouthRotation.min}
                                max={AVATAR_FACE_RANGES.mouthRotation.max}
                                suffix='°'
                                value={faceStyle.mouthRotation}
                                onChange={mouthRotation => onFaceStyleChange({ mouthRotation })}
                              />
                            </div>
                          </>
                        )
                        : null}
                    </>
                  )
                  : null}
              </div>
              {entityPreset === 'cat' || entityPreset === 'dog' || entityPreset === 'rabbit' ||
                (entityPreset === 'bear' && bearBreedTemplateId != null) || isAvatarAnimalSpeciesId(entityPreset)
                ? (
                  <div className='avatar-controls__field-group avatar-controls__coat-pattern' data-enabled={coatPattern.enabled}>
                    <div className='avatar-controls__field-header'>
                      <span className='avatar-controls__label'>{t('Coat pattern')}</span>
                      <button
                        className='avatar-controls__switch'
                        type='button'
                        role='switch'
                        aria-checked={coatPattern.enabled}
                        aria-label={t('Coat pattern')}
                        onClick={onToggleCoatPattern}
                      ><span /></button>
                    </div>
                    {coatPattern.enabled
                      ? (
                        <div className='avatar-controls__coat-content'>
                          <div className='avatar-controls__coat-row'>
                            <div className='avatar-controls__coat-row-header'>
                              <span>{t('Pattern algorithm')}</span>
                              <SeedFieldToggle
                                enabled={seededFields.includes(AVATAR_SEED_FIELD.coatPatternAlgorithm)}
                                label='Pattern algorithm'
                                onChange={() => onSeedFieldToggle(
                                  AVATAR_SEED_FIELD.coatPatternAlgorithm,
                                  !seededFields.includes(AVATAR_SEED_FIELD.coatPatternAlgorithm)
                                )}
                              />
                            </div>
                            <div className='avatar-controls__coat-algorithms' role='radiogroup' aria-label={t('Pattern algorithm')}>
                              {COAT_PATTERN_ALGORITHMS.map(option => (
                                <button
                                  key={option.id}
                                  type='button'
                                  role='radio'
                                  aria-checked={coatPattern.algorithm === option.id}
                                  data-active={coatPattern.algorithm === option.id}
                                  onClick={() => onCoatPatternChange(
                                    { algorithm: option.id },
                                    AVATAR_SEED_FIELD.coatPatternAlgorithm
                                  )}
                                >
                                  <CoatPatternIcon algorithm={option.id} />
                                  <span>{t(option.label)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className='avatar-controls__coat-row'>
                            <div className='avatar-controls__coat-row-header'>
                              <span>{t('Pattern layout')}</span>
                              <SeedFieldToggle
                                enabled={seededFields.includes(AVATAR_SEED_FIELD.coatPatternSeed)}
                                label='Pattern layout'
                                onChange={() => onSeedFieldToggle(
                                  AVATAR_SEED_FIELD.coatPatternSeed,
                                  !seededFields.includes(AVATAR_SEED_FIELD.coatPatternSeed)
                                )}
                              />
                            </div>
                          </div>
                          <div className='avatar-controls__coat-row avatar-controls__coat-light-patch'>
                            <div className='avatar-controls__coat-row-header'>
                              <span>{t('Light coat patch')}</span>
                            </div>
                            <div className='avatar-controls__coat-row-header'>
                              <span>{t('Shape')}</span>
                              <SeedFieldToggle
                                enabled={seededFields.includes(AVATAR_SEED_FIELD.coatPatternLightPatchShape)}
                                label='Light coat patch shape'
                                onChange={() => onSeedFieldToggle(
                                  AVATAR_SEED_FIELD.coatPatternLightPatchShape,
                                  !seededFields.includes(AVATAR_SEED_FIELD.coatPatternLightPatchShape)
                                )}
                              />
                            </div>
                            <GeometricShapePicker
                              ariaLabel='Light coat patch shape'
                              options={COAT_LIGHT_PATCH_SHAPES}
                              value={coatPattern.lightPatchShape ?? 'face-mask'}
                              onChange={lightPatchShape => onCoatPatternChange(
                                { lightPatchShape },
                                AVATAR_SEED_FIELD.coatPatternLightPatchShape
                              )}
                            />
                            {([
                              ['lightPatchLength', 'Length', AVATAR_SEED_FIELD.coatPatternLightPatchLength, AVATAR_COAT_PATTERN_RANGES.lightPatchLength],
                              ['lightPatchOffsetY', 'Vertical position', AVATAR_SEED_FIELD.coatPatternLightPatchOffsetY, AVATAR_COAT_PATTERN_RANGES.lightPatchOffsetY],
                              ['lightPatchWidth', 'Width', AVATAR_SEED_FIELD.coatPatternLightPatchWidth, AVATAR_COAT_PATTERN_RANGES.lightPatchWidth]
                            ] as const).map(([key, label, field, range]) => (
                              <div className='avatar-controls__coat-row' key={key}>
                                <div className='avatar-controls__coat-row-header'>
                                  <span>{t(label)}</span>
                                  <SeedFieldToggle
                                    enabled={seededFields.includes(field)}
                                    label={label}
                                    onChange={() => onSeedFieldToggle(field, !seededFields.includes(field))}
                                  />
                                </div>
                                <ValueSlider
                                  ariaLabel={label}
                                  label={label}
                                  min={range.min}
                                  max={range.max}
                                  suffix={key === 'lightPatchOffsetY' ? '' : '%'}
                                  value={key === 'lightPatchOffsetY'
                                    ? coatPattern.lightPatchOffsetY ?? 0
                                    : coatPattern[key] ?? 100}
                                  onChange={value => onCoatPatternChange({ [key]: value }, field)}
                                />
                              </div>
                            ))}
                          </div>
                          {([
                            ['density', 'Density', AVATAR_SEED_FIELD.coatPatternDensity, AVATAR_COAT_PATTERN_RANGES.density],
                            ['jitter', 'Jitter', AVATAR_SEED_FIELD.coatPatternJitter, AVATAR_COAT_PATTERN_RANGES.jitter],
                            ['thickness', 'Thickness', AVATAR_SEED_FIELD.coatPatternThickness, AVATAR_COAT_PATTERN_RANGES.thickness],
                            ['symmetry', 'Symmetry', AVATAR_SEED_FIELD.coatPatternSymmetry, AVATAR_COAT_PATTERN_RANGES.symmetry],
                            ['contrast', 'Contrast', AVATAR_SEED_FIELD.coatPatternContrast, AVATAR_COAT_PATTERN_RANGES.contrast],
                            ['breakup', 'Breakup', AVATAR_SEED_FIELD.coatPatternBreakup, AVATAR_COAT_PATTERN_RANGES.breakup]
                          ] as const).map(([key, label, field, range]) => (
                            <div className='avatar-controls__coat-row' key={key}>
                              <div className='avatar-controls__coat-row-header'>
                                <span>{t(label)}</span>
                                <SeedFieldToggle
                                  enabled={seededFields.includes(field)}
                                  label={label}
                                  onChange={() => onSeedFieldToggle(field, !seededFields.includes(field))}
                                />
                              </div>
                              <ValueSlider
                                ariaLabel={label}
                                label={label}
                                min={range.min}
                                max={range.max}
                                suffix='%'
                                value={coatPattern[key]}
                                onChange={value => onCoatPatternChange({ [key]: value }, field)}
                              />
                            </div>
                          ))}
                          <div className='avatar-controls__coat-actions'>
                            <button type='button' className='avatar-controls__inline-action' onClick={onConvertCoatPatternToDecals}>
                              {t('Convert to editable decals')}
                            </button>
                          </div>
                        </div>
                      )
                      : null}
                  </div>
                )
                : null}
              <div className='avatar-controls__field-group'>
                <div className='avatar-controls__field-header'>
                  <span className='avatar-controls__label'>{t('Surface decals')}</span>
                  <div className='avatar-controls__field-actions'>
                    {coatPattern.enabled
                      ? null
                      : (
                        <button className='avatar-controls__inline-action' type='button' onClick={onAddSurfaceDecal}>
                          {t('Add decal')}
                        </button>
                      )}
                  </div>
                </div>
                {coatPattern.enabled || surfaceDecals.length === 0
                  ? null
                  : (
                    <div className='avatar-controls__decal-list' role='listbox' aria-label={t('Surface decals')}>
                      {surfaceDecals.map(decal => (
                        <div
                          key={decal.id}
                          className='avatar-controls__decal-item'
                          data-selected={decal.id === selectedSurfaceDecalId}
                        >
                          <button
                            className='avatar-controls__decal-option'
                            type='button'
                            role='option'
                            aria-selected={decal.id === selectedSurfaceDecalId}
                            onClick={() => onSelectSurfaceDecal(decal.id)}
                          >
                            <span style={{ background: decal.color }} />
                            <span className='avatar-controls__decal-label'>{t(decal.label)}</span>
                          </button>
                          <button
                            className='avatar-controls__decal-remove'
                            type='button'
                            aria-label={`${t('Delete decal')}: ${t(decal.label)}`}
                            title={t('Delete decal')}
                            onClick={() => onDeleteSurfaceDecal(decal.id)}
                          >
                            <svg viewBox='0 0 16 16' aria-hidden='true'>
                              <path d='m4.5 4.5 7 7m0-7-7 7' />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                {editingSurfaceDecal == null || coatPattern.enabled
                  ? null
                  : (
                    <div className='avatar-controls__decal-editor'>
                      <label className='avatar-controls__select-field'>
                        <span>{t('Target part')}</span>
                        <select
                          value={editingSurfaceDecal.targetPartId ?? ''}
                          onChange={event =>
                            onSurfaceDecalChange(editingSurfaceDecal.id, {
                              targetPartId: event.currentTarget.value || null
                            })}
                        >
                          <option value=''>{t('Body')}</option>
                          {entityParts.map(part => <option key={part.id} value={part.id}>{t(part.label)}</option>)}
                        </select>
                      </label>
                      {editingSurfaceDecal.shape === 'radial-pleats' ? null : (
                        <label className='avatar-controls__select-field'>
                          <span>{t('Surface side')}</span>
                          <select
                            value={editingSurfaceDecal.side ?? 'front'}
                            onChange={event =>
                              onSurfaceDecalChange(editingSurfaceDecal.id, {
                                side: event.currentTarget.value === 'back' ||
                                    event.currentTarget.value === 'face' ||
                                    event.currentTarget.value === 'left' ||
                                    event.currentTarget.value === 'right'
                                  ? event.currentTarget.value
                                  : 'front'
                              })}
                          >
                            <option value='front'>{t('Front')}</option>
                            <option value='face'>{t('Face plane')}</option>
                            <option value='right'>{t('Right')}</option>
                            <option value='back'>{t('Back')}</option>
                            <option value='left'>{t('Left')}</option>
                          </select>
                        </label>
                      )}
                      <GeometricShapePicker
                        ariaLabel='Surface decal shape'
                        options={SURFACE_DECAL_SHAPE_OPTIONS}
                        value={editingSurfaceDecal.shape}
                        onChange={shape => onSurfaceDecalChange(editingSurfaceDecal.id, { shape })}
                      />
                      <label className='avatar-controls__entity-color'>
                        <span>{t('Color')}</span>
                        <input
                          type='color'
                          aria-label={t('Color')}
                          value={editingSurfaceDecal.color}
                          onChange={event =>
                            onSurfaceDecalChange(editingSurfaceDecal.id, {
                              color: event.currentTarget.value
                            })}
                        />
                      </label>
                      <div className='avatar-controls__parameter-controls'>
                        {editingSurfaceDecal.shape === 'radial-pleats'
                          ? (
                            <ValueSlider
                              ariaLabel='Pleat curvature'
                              label='Curvature'
                              min={-60}
                              max={60}
                              suffix='°'
                              value={editingSurfaceDecal.x}
                              onChange={x => onSurfaceDecalChange(editingSurfaceDecal.id, { x })}
                            />
                          )
                          : (
                            <>
                              <ValueSlider
                                ariaLabel='Decal position X'
                                label='Position X'
                                min={AVATAR_SURFACE_DECAL_RANGES.x.min}
                                max={AVATAR_SURFACE_DECAL_RANGES.x.max}
                                value={editingSurfaceDecal.x}
                                onChange={x => onSurfaceDecalChange(editingSurfaceDecal.id, { x })}
                              />
                              <ValueSlider
                                ariaLabel='Decal position Y'
                                label='Position Y'
                                min={AVATAR_SURFACE_DECAL_RANGES.y.min}
                                max={AVATAR_SURFACE_DECAL_RANGES.y.max}
                                value={editingSurfaceDecal.y}
                                onChange={y => onSurfaceDecalChange(editingSurfaceDecal.id, { y })}
                              />
                            </>
                          )}
                        <ValueSlider
                          ariaLabel='Decal width'
                          label='Width'
                          min={AVATAR_SURFACE_DECAL_RANGES.width.min}
                          max={AVATAR_SURFACE_DECAL_RANGES.width.max}
                          value={editingSurfaceDecal.width}
                          onChange={width => onSurfaceDecalChange(editingSurfaceDecal.id, { width })}
                        />
                        <ValueSlider
                          ariaLabel='Decal height'
                          label='Height'
                          min={AVATAR_SURFACE_DECAL_RANGES.height.min}
                          max={AVATAR_SURFACE_DECAL_RANGES.height.max}
                          value={editingSurfaceDecal.height}
                          onChange={height => onSurfaceDecalChange(editingSurfaceDecal.id, { height })}
                        />
                        <ValueSlider
                          ariaLabel='Decal rotation'
                          label='Rotation'
                          min={AVATAR_SURFACE_DECAL_RANGES.rotation.min}
                          max={AVATAR_SURFACE_DECAL_RANGES.rotation.max}
                          suffix='°'
                          value={editingSurfaceDecal.rotation}
                          onChange={rotation => onSurfaceDecalChange(editingSurfaceDecal.id, { rotation })}
                        />
                        {editingSurfaceDecal.shape === 'tapered-band'
                          ? (
                            <ValueSlider
                              ariaLabel='Decal bend'
                              label='Bend'
                              min={AVATAR_SURFACE_DECAL_RANGES.bend.min}
                              max={AVATAR_SURFACE_DECAL_RANGES.bend.max}
                              value={editingSurfaceDecal.bend ?? 0}
                              onChange={bend => onSurfaceDecalChange(editingSurfaceDecal.id, { bend })}
                            />
                          )
                          : null}
                        <ValueSlider
                          ariaLabel='Decal opacity'
                          label='Opacity'
                          min={AVATAR_SURFACE_DECAL_RANGES.opacity.min}
                          max={AVATAR_SURFACE_DECAL_RANGES.opacity.max}
                          suffix='%'
                          value={editingSurfaceDecal.opacity}
                          onChange={opacity => onSurfaceDecalChange(editingSurfaceDecal.id, { opacity })}
                        />
                      </div>
                      <button
                        className='avatar-controls__danger-action'
                        type='button'
                        onClick={() => onDeleteSurfaceDecal(editingSurfaceDecal.id)}
                      >
                        {t('Delete decal')}
                      </button>
                    </div>
                  )}
              </div>
            </>
          )
          : null}

        {activeTab === 'style'
          ? (
            <>
              {editingEntityPart == null
                ? null
                : (
                  <div className='avatar-controls__field-group'>
                    <span className='avatar-controls__label'>{t('Part material')}</span>
                    <div className='avatar-controls__entity-colors'>
                      {([
                        ['baseColor', 'Base'],
                        ['highlightColor', 'Highlight'],
                        ['shadowColor', 'Shadow'],
                        ['foregroundColor', 'Face']
                      ] as const).map(([key, label]) => (
                        <label key={key} className='avatar-controls__entity-color'>
                          <span>{t(label)}</span>
                          <input
                            type='color'
                            aria-label={t(label)}
                            value={editingEntityPart[key]}
                            onChange={event =>
                              onEntityPartChange(editingEntityPart.id, {
                                [key]: event.currentTarget.value
                              })}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              <div className='avatar-controls__field-group'>
                {renderSeedFieldHeader('palette', 'Palette', AVATAR_SEED_FIELD.palette)}
                <div className='avatar-controls__swatches'>
                  {visiblePalettes.map((palette) => (
                    <button
                      key={palette.id}
                      className='avatar-controls__swatch'
                      type='button'
                      aria-label={palette.name}
                      aria-pressed={palette.id === selectedPalette.id}
                      style={{
                        '--avatar-bg': palette.background,
                        '--avatar-bg-end': palette.gradient[1],
                        '--avatar-fg': palette.foreground
                      } as CSSProperties}
                      onClick={() => handlePaletteSelect(palette.id)}
                    >
                      <span />
                    </button>
                  ))}
                </div>
                {hiddenPaletteCount > 0
                  ? (
                    <button
                      className='avatar-controls__palette-more'
                      type='button'
                      aria-expanded={showMorePalettes}
                      onClick={onShowMorePalettesChange}
                    >
                      {showMorePalettes ? t('Less') : `${t('More')} ${hiddenPaletteCount}`}
                    </button>
                  )
                  : null}
              </div>

              {showOverallStyleControls
                ? (
                  <>
                    <div className='avatar-controls__field-group'>
                      {renderSeedFieldHeader(
                        'background',
                        'Background',
                        AVATAR_SEED_FIELD.backgroundStyle
                      )}
                      <div className='avatar-controls__segments'>
                        {(['solid', 'gradient'] satisfies AvatarBackgroundStyle[]).map(style => (
                          <button
                            key={style}
                            className='avatar-controls__segment'
                            type='button'
                            aria-pressed={style === backgroundStyle}
                            onClick={() => onBackgroundStyleChange(style)}
                          >
                            <ControlIcon name={style} />
                            {t(style === 'solid' ? 'Solid' : 'Gradient')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className='avatar-controls__field-group'>
                      <span className='avatar-controls__label'>
                        <ControlIcon name='camera' />
                        {t('Camera frame')}
                      </span>
                      <GeometricShapePicker
                        ariaLabel='Camera frame shape'
                        options={CAMERA_FRAME_OPTIONS}
                        value={cameraFrame}
                        onChange={onCameraFrameChange}
                      />
                    </div>

                    <div className='avatar-controls__field-group'>
                      {renderSeedFieldHeader(
                        'background',
                        'Camera background',
                        AVATAR_SEED_FIELD.cameraBackground
                      )}
                      <div className='avatar-controls__segments'>
                        <button
                          className='avatar-controls__segment'
                          type='button'
                          aria-pressed={cameraBackground !== 'transparent'}
                          onClick={() => onCameraBackgroundChange(lastCameraColorRef.current)}
                        >
                          <ControlIcon name='solid' />
                          {t('Color')}
                        </button>
                        <button
                          className='avatar-controls__segment'
                          type='button'
                          aria-pressed={cameraBackground === 'transparent'}
                          onClick={() => onCameraBackgroundChange('transparent')}
                        >
                          <ControlIcon name='transparent' />
                          {t('Transparent')}
                        </button>
                      </div>
                      {cameraBackground === 'transparent'
                        ? null
                        : (
                          <div className='avatar-controls__camera-background'>
                            <label className='avatar-controls__color-input'>
                              <input
                                type='color'
                                aria-label='Camera background color'
                                value={cameraBackground}
                                onChange={event => onCameraBackgroundChange(event.currentTarget.value)}
                              />
                              <output>{cameraBackground.toUpperCase()}</output>
                            </label>
                            <div className='avatar-controls__camera-presets' aria-label='Camera background presets'>
                              {AVATAR_CAMERA_BACKGROUND_PRESETS.map(color => (
                                <button
                                  key={color}
                                  type='button'
                                  aria-label={`Set camera background to ${color}`}
                                  aria-pressed={cameraBackground === color}
                                  style={{ '--camera-preset': color } as CSSProperties}
                                  onClick={() => onCameraBackgroundChange(color)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </>
                )
                : null}
            </>
          )
          : null}

        {activeTab === 'body'
          ? (
            <>
              {entityPreset === 'custom' || editingEntityPart != null
                ? (
                  <div className='avatar-controls__body-grid'>
                    {AVATAR_BODY_SHAPES.map(shape => (
                      <button
                        key={shape}
                        className='avatar-controls__body-option'
                        type='button'
                        aria-label={t(BODY_SHAPE_LABELS[shape])}
                        aria-pressed={(editingEntityPart?.shape ?? bodyShape) === shape}
                        title={t(BODY_SHAPE_LABELS[shape])}
                        onClick={() =>
                          editingEntityPart == null
                            ? onBodyShapeChange(shape)
                            : onEntityPartChange(editingEntityPart.id, { shape })}
                      >
                        <BodyShapeIcon shape={shape} />
                      </button>
                    ))}
                  </div>
                )
                : null}
              {editingEntityPart == null
                ? bodyShape === 'ellipse'
                  ? (
                    <div className='avatar-controls__parameter-controls'>
                      <ValueSlider
                        ariaLabel='Body bottom taper'
                        label='Bottom taper'
                        min={AVATAR_ENTITY_RANGES.bottomTaper.min}
                        max={AVATAR_ENTITY_RANGES.bottomTaper.max}
                        suffix='%'
                        value={bodyBottomTaper}
                        onChange={onBodyBottomTaperChange}
                      />
                    </div>
                  )
                  : null
                : (
                  <div className='avatar-controls__parameter-controls'>
                    <NumberField
                      ariaLabel='Part position X'
                      label='Position X'
                      value={editingEntityPart.x}
                      onChange={x => onEntityPartChange(editingEntityPart.id, { x })}
                    />
                    <NumberField
                      ariaLabel='Part position Y'
                      label='Position Y'
                      value={editingEntityPart.y}
                      onChange={y => onEntityPartChange(editingEntityPart.id, { y })}
                    />
                    <NumberField
                      ariaLabel='Part position Z'
                      label='Position Z'
                      value={editingEntityPart.z}
                      onChange={z => onEntityPartChange(editingEntityPart.id, { z })}
                    />
                    <ValueSlider
                      ariaLabel='Part width'
                      label='Width'
                      min={AVATAR_ENTITY_RANGES.scaleX.min * 100}
                      max={AVATAR_ENTITY_RANGES.scaleX.max * 100}
                      suffix='%'
                      value={editingEntityPart.scaleX * 100}
                      onChange={value => onEntityPartChange(editingEntityPart.id, { scaleX: value / 100 })}
                    />
                    <ValueSlider
                      ariaLabel='Part height'
                      label='Height'
                      min={AVATAR_ENTITY_RANGES.scaleY.min * 100}
                      max={AVATAR_ENTITY_RANGES.scaleY.max * 100}
                      suffix='%'
                      value={editingEntityPart.scaleY * 100}
                      onChange={value => onEntityPartChange(editingEntityPart.id, { scaleY: value / 100 })}
                    />
                    <ValueSlider
                      ariaLabel='Part depth'
                      label='Depth'
                      min={AVATAR_ENTITY_RANGES.scaleZ.min * 100}
                      max={AVATAR_ENTITY_RANGES.scaleZ.max * 100}
                      suffix='%'
                      value={resolveAvatarEntityPartScaleZ(editingEntityPart) * 100}
                      onChange={value => onEntityPartChange(editingEntityPart.id, { scaleZ: value / 100 })}
                    />
                    {editingEntityPart.shape === 'ellipse'
                      ? (
                        <ValueSlider
                          ariaLabel='Part bottom taper'
                          label='Bottom taper'
                          min={AVATAR_ENTITY_RANGES.bottomTaper.min}
                          max={AVATAR_ENTITY_RANGES.bottomTaper.max}
                          suffix='%'
                          value={editingEntityPart.bottomTaper ?? 0}
                          onChange={bottomTaper => onEntityPartChange(editingEntityPart.id, { bottomTaper })}
                        />
                      )
                      : null}
                    <NumberField
                      ariaLabel='Part rotation X'
                      label='Rotation X'
                      suffix='°'
                      value={editingEntityPart.rotationX ?? 0}
                      onChange={rotationX => onEntityPartChange(editingEntityPart.id, { rotationX })}
                    />
                    <NumberField
                      ariaLabel='Part rotation Y'
                      label='Rotation Y'
                      suffix='°'
                      value={editingEntityPart.rotationY ?? 0}
                      onChange={rotationY => onEntityPartChange(editingEntityPart.id, { rotationY })}
                    />
                    <NumberField
                      ariaLabel='Part rotation Z'
                      label='Rotation Z'
                      suffix='°'
                      value={editingEntityPart.rotationZ ?? 0}
                      onChange={rotationZ => onEntityPartChange(editingEntityPart.id, { rotationZ })}
                    />
                    {editingEntityPart.shape === 'cone' || editingEntityPart.shape === 'frustum' ||
                        editingEntityPart.shape === 'half-cone'
                      ? (
                        <>
                          <ValueSlider
                            ariaLabel='Part cone roundness'
                            label='Cone roundness'
                            min={AVATAR_ENTITY_RANGES.roundness.min}
                            max={AVATAR_ENTITY_RANGES.roundness.max}
                            suffix='%'
                            value={editingEntityPart.roundness ?? 24}
                            onChange={roundness => onEntityPartChange(editingEntityPart.id, { roundness })}
                          />
                          <NumberField
                            ariaLabel='Part cut direction'
                            label='Cut direction'
                            suffix='°'
                            value={editingEntityPart.cutAngle ?? 0}
                            onChange={cutAngle => onEntityPartChange(editingEntityPart.id, { cutAngle })}
                          />
                          <ToggleRow
                            checked={editingEntityPart.hollow ?? false}
                            icon='body'
                            label='Hollow'
                            onChange={() =>
                              onEntityPartChange(editingEntityPart.id, {
                                hollow: !(editingEntityPart.hollow ?? false)
                              })}
                          />
                        </>
                      )
                      : null}
                    {editingEntityPart.shape === 'trapezoid'
                      ? (
                        <ValueSlider
                          ariaLabel='Part corner roundness'
                          label='Corner roundness'
                          min={AVATAR_ENTITY_RANGES.roundness.min}
                          max={AVATAR_ENTITY_RANGES.roundness.max}
                          suffix='%'
                          value={editingEntityPart.roundness ?? 72}
                          onChange={roundness => onEntityPartChange(editingEntityPart.id, { roundness })}
                        />
                      )
                      : null}
                  </div>
                )}
            </>
          )
          : null}

        {activeTab === 'effects'
          ? (
            <>
              <ToggleRow
                checked={pixelEffect.enabled}
                icon='pixel'
                label='Pixel style'
                onChange={() => onPixelEffectChange({ enabled: !pixelEffect.enabled })}
              />
              {pixelEffect.enabled
                ? (
                  <div className='avatar-controls__parameter-controls avatar-controls__pixel-controls'>
                    <ValueSlider
                      ariaLabel='Pixel size'
                      label='Pixel size'
                      min={AVATAR_PIXEL_EFFECT_RANGES.blockSize.min}
                      max={AVATAR_PIXEL_EFFECT_RANGES.blockSize.max}
                      suffix='px'
                      value={pixelEffect.blockSize}
                      onChange={blockSize => onPixelEffectChange({ blockSize })}
                    />
                    <div className='avatar-controls__pixel-control'>
                      <span>{t('Sampling')}</span>
                      <div
                        className='avatar-controls__segments avatar-controls__pixel-sampling'
                        role='radiogroup'
                        aria-label={t('Pixel sampling')}
                      >
                        {([
                          ['center', 'Center'],
                          ['dominant', 'Dominant'],
                          ['median', 'Median'],
                          ['slic', 'SLIC']
                        ] as const).map(([sampling, label]) => (
                          <button
                            key={sampling}
                            className='avatar-controls__segment'
                            type='button'
                            role='radio'
                            aria-checked={pixelEffect.sampling === sampling}
                            aria-pressed={pixelEffect.sampling === sampling}
                            onClick={() => onPixelEffectChange({ sampling })}
                          >
                            <PixelSamplingIcon sampling={sampling} />
                            <span>{t(label)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className='avatar-controls__pixel-control'>
                      <span>{t('Colors')}</span>
                      <div
                        className='avatar-controls__segments avatar-controls__pixel-palette'
                        role='radiogroup'
                        aria-label={t('Pixel color count')}
                      >
                        {AVATAR_PIXEL_EFFECT_RANGES.paletteSizes.map(paletteSize => (
                          <button
                            key={paletteSize}
                            className='avatar-controls__segment'
                            type='button'
                            role='radio'
                            aria-checked={pixelEffect.paletteSize === paletteSize}
                            aria-pressed={pixelEffect.paletteSize === paletteSize}
                            onClick={() => onPixelEffectChange({ paletteSize })}
                          >
                            {paletteSize}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className='avatar-controls__pixel-control'>
                      <span>{t('Dithering')}</span>
                      <div
                        className='avatar-controls__segments'
                        role='radiogroup'
                        aria-label={t('Pixel dithering')}
                      >
                        {([
                          ['none', 'Off'],
                          ['ordered', 'Ordered']
                        ] as const).map(([dithering, label]) => (
                          <button
                            key={dithering}
                            className='avatar-controls__segment'
                            type='button'
                            role='radio'
                            aria-checked={pixelEffect.dithering === dithering}
                            aria-pressed={pixelEffect.dithering === dithering}
                            onClick={() => onPixelEffectChange({ dithering })}
                          >
                            {t(label)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
                : null}
              <ToggleRow checked={showLight} icon='light' label='Light source' onChange={onToggleLight} />
              {showLight
                ? (
                  <div className='avatar-controls__parameter-controls'>
                    <ValueSlider
                      ariaLabel='Light direction'
                      label='Direction'
                      min={AVATAR_LIGHTING_RANGES.azimuth.min}
                      max={AVATAR_LIGHTING_RANGES.azimuth.max}
                      suffix='°'
                      value={lightAzimuth}
                      onChange={onLightAzimuthChange}
                    />
                    <ValueSlider
                      ariaLabel='Light angle'
                      label='Angle'
                      min={AVATAR_LIGHTING_RANGES.elevation.min}
                      max={AVATAR_LIGHTING_RANGES.elevation.max}
                      suffix='°'
                      value={lightElevation}
                      onChange={onLightElevationChange}
                    />
                    <div>
                      <ValueSlider
                        ariaLabel='Light distance'
                        label='Distance'
                        min={AVATAR_LIGHTING_RANGES.distance.min}
                        max={AVATAR_LIGHTING_RANGES.distance.max}
                        suffix='%'
                        value={lightDistance}
                        onChange={onLightDistanceChange}
                      />
                      <div className='avatar-controls__value-scale' aria-hidden='true'>
                        <span>{t('Near')}</span>
                        <span>{t('Far')}</span>
                      </div>
                    </div>
                    <div>
                      <ValueSlider
                        ariaLabel='Surface grid density'
                        label='Grid density'
                        min={AVATAR_LIGHTING_RANGES.gridDensity.min}
                        max={AVATAR_LIGHTING_RANGES.gridDensity.max}
                        suffix='%'
                        value={gridDensity}
                        onChange={onGridDensityChange}
                      />
                      <div className='avatar-controls__value-scale' aria-hidden='true'>
                        <span>{t('Low')}</span>
                        <span>{t('High')}</span>
                      </div>
                    </div>
                  </div>
                )
                : null}
              <ToggleRow
                checked={showAvatarShadow}
                icon='shadow'
                label='Avatar shadow'
                onChange={onToggleAvatarShadow}
              />
              {showAvatarShadow
                ? (
                  <div className='avatar-controls__parameter-controls'>
                    <label className='avatar-controls__color-control'>
                      <span>{t('Color')}</span>
                      <span>
                        <input
                          type='color'
                          aria-label='Avatar shadow color'
                          value={avatarShadowStyle.color ?? '#000000'}
                          onChange={event => onAvatarShadowStyleChange({ color: event.currentTarget.value })}
                        />
                        <output>{(avatarShadowStyle.color ?? '#000000').toUpperCase()}</output>
                      </span>
                    </label>
                    <ValueSlider
                      ariaLabel='Avatar shadow direction'
                      label='Direction'
                      min={AVATAR_SHADOW_RANGES.avatar.direction.min}
                      max={AVATAR_SHADOW_RANGES.avatar.direction.max}
                      suffix='°'
                      value={avatarShadowStyle.direction}
                      onChange={direction => onAvatarShadowStyleChange({ direction })}
                    />
                    <ValueSlider
                      ariaLabel='Avatar shadow distance'
                      label='Distance'
                      min={AVATAR_SHADOW_RANGES.avatar.distance.min}
                      max={AVATAR_SHADOW_RANGES.avatar.distance.max}
                      suffix='px'
                      value={avatarShadowStyle.distance}
                      onChange={distance => onAvatarShadowStyleChange({ distance })}
                    />
                    <ValueSlider
                      ariaLabel='Avatar shadow softness'
                      label='Softness'
                      min={AVATAR_SHADOW_RANGES.avatar.softness.min}
                      max={AVATAR_SHADOW_RANGES.avatar.softness.max}
                      suffix='px'
                      value={avatarShadowStyle.softness}
                      onChange={softness => onAvatarShadowStyleChange({ softness })}
                    />
                    <ValueSlider
                      ariaLabel='Avatar shadow opacity'
                      label='Opacity'
                      min={AVATAR_SHADOW_RANGES.avatar.opacity.min}
                      max={AVATAR_SHADOW_RANGES.avatar.opacity.max}
                      suffix='%'
                      value={avatarShadowStyle.opacity}
                      onChange={opacity => onAvatarShadowStyleChange({ opacity })}
                    />
                  </div>
                )
                : null}
              <ToggleRow
                checked={showOutline}
                icon='outline'
                label='Avatar outline'
                onChange={onToggleOutline}
              />
              {showOutline
                ? (
                  <div className='avatar-controls__parameter-controls'>
                    <label className='avatar-controls__color-control'>
                      <span>{t('Color')}</span>
                      <span>
                        <input
                          type='color'
                          aria-label='Avatar outline color'
                          value={avatarOutlineStyle.color}
                          onChange={event => onAvatarOutlineStyleChange({ color: event.currentTarget.value })}
                        />
                        <output>{avatarOutlineStyle.color.toUpperCase()}</output>
                      </span>
                    </label>
                    <ValueSlider
                      ariaLabel='Avatar outline width'
                      label='Width'
                      min={AVATAR_OUTLINE_RANGES.width.min}
                      max={AVATAR_OUTLINE_RANGES.width.max}
                      suffix='px'
                      value={avatarOutlineStyle.width}
                      onChange={width => onAvatarOutlineStyleChange({ width })}
                    />
                    <ValueSlider
                      ariaLabel='Avatar outline opacity'
                      label='Opacity'
                      min={AVATAR_OUTLINE_RANGES.opacity.min}
                      max={AVATAR_OUTLINE_RANGES.opacity.max}
                      suffix='%'
                      value={avatarOutlineStyle.opacity}
                      onChange={opacity => onAvatarOutlineStyleChange({ opacity })}
                    />
                  </div>
                )
                : null}
              <ToggleRow checked={showShadow} icon='shadow' label='Face shadow' onChange={onToggleShadow} />
              {showShadow
                ? (
                  <div className='avatar-controls__parameter-controls'>
                    <ValueSlider
                      ariaLabel='Face shadow direction'
                      label='Direction'
                      min={AVATAR_SHADOW_RANGES.face.direction.min}
                      max={AVATAR_SHADOW_RANGES.face.direction.max}
                      suffix='°'
                      value={faceShadowStyle.direction}
                      onChange={direction => onFaceShadowStyleChange({ direction })}
                    />
                    <ValueSlider
                      ariaLabel='Face shadow distance'
                      label='Distance'
                      min={AVATAR_SHADOW_RANGES.face.distance.min}
                      max={AVATAR_SHADOW_RANGES.face.distance.max}
                      suffix='px'
                      value={faceShadowStyle.distance}
                      onChange={distance => onFaceShadowStyleChange({ distance })}
                    />
                    <ValueSlider
                      ariaLabel='Face shadow softness'
                      label='Softness'
                      min={AVATAR_SHADOW_RANGES.face.softness.min}
                      max={AVATAR_SHADOW_RANGES.face.softness.max}
                      suffix='px'
                      value={faceShadowStyle.softness}
                      onChange={softness => onFaceShadowStyleChange({ softness })}
                    />
                    <ValueSlider
                      ariaLabel='Face shadow opacity'
                      label='Opacity'
                      min={AVATAR_SHADOW_RANGES.face.opacity.min}
                      max={AVATAR_SHADOW_RANGES.face.opacity.max}
                      suffix='%'
                      value={faceShadowStyle.opacity}
                      onChange={opacity => onFaceShadowStyleChange({ opacity })}
                    />
                  </div>
                )
                : null}
              <ToggleRow
                checked={showFrameShadow}
                icon='shadow'
                label='Frame shadow'
                onChange={onToggleFrameShadow}
              />
              {showFrameShadow
                ? (
                  <div className='avatar-controls__parameter-controls'>
                    <ValueSlider
                      ariaLabel='Frame shadow direction'
                      label='Direction'
                      min={AVATAR_SHADOW_RANGES.frame.direction.min}
                      max={AVATAR_SHADOW_RANGES.frame.direction.max}
                      suffix='°'
                      value={frameShadowStyle.direction}
                      onChange={direction => onFrameShadowStyleChange({ direction })}
                    />
                    <ValueSlider
                      ariaLabel='Frame shadow distance'
                      label='Distance'
                      min={AVATAR_SHADOW_RANGES.frame.distance.min}
                      max={AVATAR_SHADOW_RANGES.frame.distance.max}
                      suffix='px'
                      value={frameShadowStyle.distance}
                      onChange={distance => onFrameShadowStyleChange({ distance })}
                    />
                    <ValueSlider
                      ariaLabel='Frame shadow softness'
                      label='Softness'
                      min={AVATAR_SHADOW_RANGES.frame.softness.min}
                      max={AVATAR_SHADOW_RANGES.frame.softness.max}
                      suffix='px'
                      value={frameShadowStyle.softness}
                      onChange={softness => onFrameShadowStyleChange({ softness })}
                    />
                    <ValueSlider
                      ariaLabel='Frame shadow opacity'
                      label='Opacity'
                      min={AVATAR_SHADOW_RANGES.frame.opacity.min}
                      max={AVATAR_SHADOW_RANGES.frame.opacity.max}
                      suffix='%'
                      value={frameShadowStyle.opacity}
                      onChange={opacity => onFrameShadowStyleChange({ opacity })}
                    />
                  </div>
                )
                : null}
            </>
          )
          : null}
      </div>
      {presetBrowser == null
        ? null
        : (
          <div
            className='avatar-controls__preset-browser-backdrop'
            role='presentation'
            onPointerDown={event => {
              if (event.target !== event.currentTarget) return
              setPresetBrowser(null)
            }}
            onKeyDown={event => {
              if (event.key !== 'Escape') return
              event.stopPropagation()
              setPresetBrowser(null)
            }}
          >
            <section
              className='avatar-controls__preset-browser'
              role='dialog'
              aria-labelledby='avatar-preset-browser-title'
              aria-modal='true'
            >
              <div className='avatar-controls__preset-browser-header'>
                <h2 id='avatar-preset-browser-title'>
                  {t(presetBrowser === 'faces'
                    ? 'Face presets'
                    : presetBrowser === 'entities' ? 'Avatar templates' : 'Saved presets')}
                </h2>
                <button
                  type='button'
                  aria-label={t('Close')}
                  title={t('Close')}
                  onClick={() => setPresetBrowser(null)}
                >
                  <svg viewBox='0 0 20 20' aria-hidden='true'>
                    <path d='m5 5 10 10m0-10L5 15' />
                  </svg>
                </button>
              </div>
              <label className='avatar-controls__preset-browser-search'>
                <svg viewBox='0 0 20 20' aria-hidden='true'>
                  <circle cx='8.5' cy='8.5' r='5.5' />
                  <path d='m12.5 12.5 4 4' />
                </svg>
                <input
                  ref={presetSearchRef}
                  type='search'
                  aria-label={t('Search presets')}
                  placeholder={t('Search presets')}
                  value={presetSearch}
                  onChange={event => setPresetSearch(event.currentTarget.value)}
                />
              </label>
              {searchedPresetCount === 0
                ? <p className='avatar-controls__preset-browser-empty'>{t('No presets found')}</p>
                : (
                  <div
                    className='avatar-controls__preset-browser-grid'
                    role='group'
                    aria-label={t(presetBrowser === 'faces'
                      ? 'Face presets'
                      : presetBrowser === 'entities' ? 'Avatar templates' : 'Saved presets')}
                  >
                    {presetBrowser === 'faces'
                      ? searchedFacePresets.map(renderFacePresetButton)
                      : presetBrowser === 'entities'
                        ? searchedEntityPresetItems.map(item => renderSavedPresetItem(item, false))
                        : searchedSavedPresetItems.map(item => renderSavedPresetItem(item))}
                  </div>
                )}
            </section>
          </div>
        )}
      {pendingPalette == null
        ? null
        : (
          <div
            className='avatar-controls__palette-confirmation-backdrop'
            role='presentation'
            onKeyDown={event => {
              if (event.key !== 'Escape') return
              event.stopPropagation()
              setPendingPaletteId(null)
            }}
          >
            <div
              className='avatar-controls__palette-confirmation'
              role='alertdialog'
              aria-labelledby='avatar-palette-confirmation-title'
              aria-describedby='avatar-palette-confirmation-description'
              aria-modal='true'
            >
              <div id='avatar-palette-confirmation-title' className='avatar-controls__palette-confirmation-title'>
                {t('Apply palette to all parts?')}
              </div>
              <p id='avatar-palette-confirmation-description'>
                {t('This entity uses multiple materials. Applying this palette will replace all part colors.')}
              </p>
              <div className='avatar-controls__palette-confirmation-actions'>
                <button type='button' onClick={() => setPendingPaletteId(null)}>{t('Cancel')}</button>
                <button ref={paletteConfirmActionRef} type='button' onClick={handlePaletteConfirm}>
                  {t('Apply to all')}
                </button>
              </div>
            </div>
          </div>
        )}
    </aside>
  )
}
