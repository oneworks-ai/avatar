import './AvatarControls.scss'

import type { AvatarBackgroundStyle, AvatarPalette } from '@oneworks/avatar'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'

import { AVATAR_BODY_SHAPES, EntityPresetPreview } from './InteractiveAvatar'
import type { AvatarBodyShape, AvatarDropShadowStyle, AvatarOutlineStyle } from './InteractiveAvatar'
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
  AVATAR_FACE_PRESETS,
  DEFAULT_AVATAR_FACE_PRESET,
  isAvatarFacePresetSelected
} from './avatarFacePresets'
import type { AvatarFacePreset } from './avatarFacePresets'
import {
  AVATAR_BUILT_IN_ENTITY_PRESETS,
  hasMultipleAvatarEntityMaterials,
  resolveAvatarEntityPartScaleZ
} from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import {
  loadAvatarPresetUsage,
  persistAvatarPresetUsage,
  sortAvatarPresetItems,
  touchAvatarPresetUsage
} from './avatarPresetUsage'
import type { SavedAvatarPreset } from './savedAvatarPresets'

export type AvatarControlTab = 'body' | 'build' | 'effects' | 'style'
export type AvatarCameraFrame = 'circle' | 'rounded' | 'square'
type AvatarFacePart = 'eyes' | 'mouth' | 'nose'
type AvatarPresetBrowser = 'faces' | 'saved'
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
  | 'shadow'
  | 'solid'
type GeometricShapeIconName = 'circle' | 'curve' | 'ellipse' | 'inverted-triangle' | 'rounded' | 'square'

interface GeometricShapeOption<T extends string> {
  readonly icon: GeometricShapeIconName
  readonly id: T
  readonly label: string
}

interface AvatarControlsProps {
  readonly activeTab: AvatarControlTab
  readonly avatarShadowStyle: AvatarDropShadowStyle
  readonly avatarOutlineStyle: AvatarOutlineStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly cameraBackground: string
  readonly cameraFrame: AvatarCameraFrame
  readonly controlsWidth: number
  readonly entityParts: readonly AvatarEntityPart[]
  readonly entityPreset: AvatarEntityPreset
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
  readonly onAvatarShadowStyleChange: (style: Partial<AvatarDropShadowStyle>) => void
  readonly onAvatarOutlineStyleChange: (style: Partial<AvatarOutlineStyle>) => void
  readonly onBodyShapeChange: (shape: AvatarBodyShape) => void
  readonly onCameraBackgroundChange: (color: string) => void
  readonly onCameraFrameChange: (frame: AvatarCameraFrame) => void
  readonly onCollapse: () => void
  readonly onControlsWidthChange: (width: number) => void
  readonly onFaceStyleChange: (style: Partial<AvatarFaceStyle>) => void
  readonly onFaceShadowStyleChange: (style: Partial<AvatarFaceShadowStyle>) => void
  readonly onFrameShadowStyleChange: (style: Partial<AvatarDropShadowStyle>) => void
  readonly onGridDensityChange: (value: number) => void
  readonly onLightAzimuthChange: (value: number) => void
  readonly onLightDistanceChange: (value: number) => void
  readonly onLightElevationChange: (value: number) => void
  readonly onPaletteChange: (paletteId: string) => void
  readonly onEntityPresetChange: (preset: AvatarEntityPreset) => void
  readonly onEntityPartChange: (id: string, part: Partial<AvatarEntityPart>) => void
  readonly onResetFace: () => void
  readonly onSavedPresetSelect: (preset: SavedAvatarPreset) => void
  readonly onSavedPresetRemove: (presetId: string) => void
  readonly onShowMorePalettesChange: () => void
  readonly onTabChange: (tab: AvatarControlTab) => void
  readonly onToggleLight: () => void
  readonly onToggleAvatarShadow: () => void
  readonly onToggleOutline: () => void
  readonly onToggleFrameShadow: () => void
  readonly onToggleShadow: () => void
  readonly selectedPalette: AvatarPalette
  readonly selectedEntityPartId: string | null
  readonly selectedSavedPresetId: string | null
  readonly savedPresets: readonly SavedAvatarPreset[]
  readonly showLight: boolean
  readonly showAvatarShadow: boolean
  readonly showOutline: boolean
  readonly showFrameShadow: boolean
  readonly showMorePalettes: boolean
  readonly showShadow: boolean
  readonly visiblePalettes: readonly AvatarPalette[]
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
  { id: 'effects', label: 'Effects' }
]

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

const ENTITY_PRESET_LABELS: Readonly<Record<Exclude<AvatarEntityPreset, 'custom'>, string>> = {
  bear: 'Bear',
  cat: 'Cat',
  cloud: 'Cloud',
  dog: 'Dog',
  rabbit: 'Rabbit',
  sun: 'Sun'
}

const EYE_SHAPE_OPTIONS: readonly GeometricShapeOption<AvatarEyeShape>[] = [
  { icon: 'rounded', id: 'rounded', label: 'Rounded' },
  { icon: 'ellipse', id: 'ellipse', label: 'Ellipse' }
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

const CAMERA_BACKGROUND_PRESETS = [
  '#111315', '#f2f0eb', '#24334a', '#3f201c', '#173d35', '#382641',
  '#ff766c', '#0e4fe7', '#f2bd4f', '#7568e7', '#f6b8cf', '#56d6cc',
  '#c9e76c', '#87bfff', '#f08c46', '#d9c8ff', '#efe5cc', '#8ec5a4'
] as const

function FacePresetPreview({ preset }: { readonly preset: AvatarFacePreset }) {
  const { style } = preset
  const face = projectDefaultFace({ pitch: 0, yaw: 0 }, 'sphere', style)
  return (
    <svg className='avatar-controls__face-preset-preview' viewBox='135 140 150 145' aria-hidden='true'>
      <rect className='avatar-controls__face-preset-head' x='143' y='143' width='134' height='136' rx='58' />
      {face.eyes.map(eye => <path key={eye.id} d={eye.path} />)}
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
      {shape === 'rounded' ? <rect x='9' y='6' width='22' height='20' rx='5' /> : null}
      {shape === 'square' ? <rect x='10' y='6' width='20' height='20' /> : null}
      {shape === 'inverted-triangle' ? <path d='M7 9C10 3 30 3 33 9c3 6-6 17-11.5 20q-1.5 1-3 0C13 26 4 15 7 9Z' /> : null}
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
  avatarOutlineStyle,
  avatarShadowStyle,
  backgroundStyle,
  bodyShape,
  cameraBackground,
  cameraFrame,
  controlsWidth,
  entityParts,
  entityPreset,
  faceStyle,
  faceShadowStyle,
  frameShadowStyle,
  gridDensity,
  headerActions,
  hiddenPaletteCount,
  lightAzimuth,
  lightDistance,
  lightElevation,
  onBackgroundStyleChange,
  onAvatarOutlineStyleChange,
  onAvatarShadowStyleChange,
  onBodyShapeChange,
  onCameraBackgroundChange,
  onCameraFrameChange,
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
  onEntityPresetChange,
  onEntityPartChange,
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
  selectedPalette,
  selectedEntityPartId,
  selectedSavedPresetId,
  savedPresets,
  showLight,
  showOutline,
  showAvatarShadow,
  showFrameShadow,
  showMorePalettes,
  showShadow,
  visiblePalettes
}: AvatarControlsProps) {
  const { t } = useAvatarLocale()
  const [activeFacePart, setActiveFacePart] = useState<AvatarFacePart>('eyes')
  const [pendingPaletteId, setPendingPaletteId] = useState<string | null>(null)
  const [presetBrowser, setPresetBrowser] = useState<AvatarPresetBrowser | null>(null)
  const [presetSearch, setPresetSearch] = useState('')
  const [presetUsage, setPresetUsage] = useState(loadAvatarPresetUsage)
  const [resizing, setResizing] = useState(false)
  const paletteConfirmActionRef = useRef<HTMLButtonElement>(null)
  const presetSearchRef = useRef<HTMLInputElement>(null)
  const resizeStartRef = useRef<{ pointerX: number; width: number } | null>(null)
  const isDefaultFace = Object.entries(DEFAULT_AVATAR_FACE_STYLE).every(([key, value]) => {
    return faceStyle[key as keyof AvatarFaceStyle] === value
  })
  const selectedEntityPart = entityParts.find(part => part.id === selectedEntityPartId)
  const editingEntityPart = selectedEntityPart ?? entityParts.find(part => part.face)
  const pendingPalette = visiblePalettes.find(palette => palette.id === pendingPaletteId) ?? null
  const showOverallStyleControls = selectedEntityPart == null || selectedEntityPart.face
  const compactPresetCapacity = Math.max(8, Math.floor((controlsWidth - 32) / 64) * 2)
  const facePresets = sortAvatarPresetItems(
    [DEFAULT_AVATAR_FACE_PRESET, ...AVATAR_FACE_PRESETS],
    preset => `face:${preset.id}`,
    presetUsage
  )
  const savedPresetItems = sortAvatarPresetItems<AvatarSavedPresetItem>([
    ...AVATAR_BUILT_IN_ENTITY_PRESETS.map(preset => ({
      createdAt: 0,
      key: `entity:${preset}`,
      kind: 'entity' as const,
      preset
    })),
    ...savedPresets.map(preset => ({
      createdAt: preset.createdAt,
      key: `saved:${preset.id}`,
      kind: 'saved' as const,
      preset
    }))
  ], item => item.key, presetUsage, item => item.createdAt)
  const compactFacePresets = facePresets.length > compactPresetCapacity
    ? facePresets.slice(0, compactPresetCapacity - 1)
    : facePresets
  const compactSavedPresetItems = savedPresetItems.length > compactPresetCapacity
    ? savedPresetItems.slice(0, compactPresetCapacity - 1)
    : savedPresetItems

  useEffect(() => {
    if (pendingPalette != null) paletteConfirmActionRef.current?.focus()
  }, [pendingPalette])

  useEffect(() => {
    if (presetBrowser != null) presetSearchRef.current?.focus()
  }, [presetBrowser])

  const renderEntityPresetPreview = (preset: Exclude<AvatarEntityPreset, 'custom'>) => (
    <EntityPresetPreview
      preset={preset}
      lightDirection={{ azimuth: lightAzimuth, elevation: lightElevation }}
    />
  )

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
    onFaceStyleChange(preset.style)
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

  const renderSavedPresetItem = (item: AvatarSavedPresetItem) => {
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
          {renderEntityPresetPreview(item.preset)}
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
  const searchedPresetCount = presetBrowser === 'faces'
    ? searchedFacePresets.length
    : searchedSavedPresetItems.length

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
        {activeTab === 'build'
          ? (
            <>
              <section className='avatar-controls__saved-presets' aria-label='Saved presets'>
                <span className='avatar-controls__label'>
                  <ControlIcon name='history' />
                  {t('Saved presets')}
                </span>
                <div className='avatar-controls__saved-preset-list'>
                  {compactSavedPresetItems.map(renderSavedPresetItem)}
                  {savedPresetItems.length > compactPresetCapacity
                    ? renderMorePresetButton('saved')
                    : null}
                </div>
              </section>

              <div className='avatar-controls__field-group'>
                <span className='avatar-controls__label'>
                  <ControlIcon name='eyes' />
                  {t('Face')}
                </span>
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
                              min={0}
                              max={100}
                              suffix='%'
                              value={faceStyle.eyeRoundness}
                              onChange={eyeRoundness => onFaceStyleChange({ eyeRoundness })}
                            />
                          )
                          : null}
                        <ValueSlider
                          ariaLabel='Eye width'
                          label='Width'
                          min={12}
                          max={72}
                          value={faceStyle.width}
                          onChange={width => onFaceStyleChange({ width })}
                        />
                        <ValueSlider
                          ariaLabel='Eye height'
                          label='Height'
                          min={20}
                          max={104}
                          value={faceStyle.height}
                          onChange={height => onFaceStyleChange({ height })}
                        />
                        <ValueSlider
                          ariaLabel='Eye gap'
                          label='Gap'
                          min={0}
                          max={100}
                          value={faceStyle.gap}
                          onChange={gap => onFaceStyleChange({ gap })}
                        />
                        <ValueSlider
                          ariaLabel='Overall eye rotation'
                          label='Rotation (overall)'
                          min={-90}
                          max={90}
                          suffix='°'
                          value={faceStyle.rotation}
                          onChange={rotation => onFaceStyleChange({ rotation })}
                        />
                        <ValueSlider
                          ariaLabel='Left eye tilt'
                          label='Left tilt'
                          min={-90}
                          max={90}
                          suffix='°'
                          value={faceStyle.leftEyeRotation}
                          onChange={leftEyeRotation => onFaceStyleChange({ leftEyeRotation })}
                        />
                        <ValueSlider
                          ariaLabel='Right eye tilt'
                          label='Right tilt'
                          min={-90}
                          max={90}
                          suffix='°'
                          value={faceStyle.rightEyeRotation}
                          onChange={rightEyeRotation => onFaceStyleChange({ rightEyeRotation })}
                        />
                      </div>
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
                                min={6}
                                max={36}
                                value={faceStyle.noseWidth}
                                onChange={noseWidth => onFaceStyleChange({ noseWidth })}
                              />
                              <ValueSlider
                                ariaLabel='Nose height'
                                label='Height'
                                min={6}
                                max={48}
                                value={faceStyle.noseHeight}
                                onChange={noseHeight => onFaceStyleChange({ noseHeight })}
                              />
                              <ValueSlider
                                ariaLabel='Nose vertical position'
                                label='Position Y'
                                min={-10}
                                max={50}
                                value={faceStyle.noseY}
                                onChange={noseY => onFaceStyleChange({ noseY })}
                              />
                              <ValueSlider
                                ariaLabel='Nose rotation'
                                label='Rotation'
                                min={-180}
                                max={180}
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
                                min={16}
                                max={100}
                                value={faceStyle.mouthWidth}
                                onChange={mouthWidth => onFaceStyleChange({ mouthWidth })}
                              />
                              <ValueSlider
                                ariaLabel='Mouth height'
                                label={faceStyle.mouthShape === 'curve' ? 'Thickness' : 'Height'}
                                min={6}
                                max={48}
                                value={faceStyle.mouthHeight}
                                onChange={mouthHeight => onFaceStyleChange({ mouthHeight })}
                              />
                              <ValueSlider
                                ariaLabel='Mouth vertical position'
                                label='Position Y'
                                min={24}
                                max={90}
                                value={faceStyle.mouthY}
                                onChange={mouthY => onFaceStyleChange({ mouthY })}
                              />
                              {faceStyle.mouthShape === 'curve'
                                ? (
                                  <>
                                    <ValueSlider
                                      ariaLabel='Mouth curvature from frown to smile'
                                      label='Curvature'
                                      min={-100}
                                      max={100}
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
                                min={-180}
                                max={180}
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
                            onChange={event => onEntityPartChange(editingEntityPart.id, {
                              [key]: event.currentTarget.value
                            })}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              <div className='avatar-controls__field-group'>
                <span className='avatar-controls__label'>
                  <ControlIcon name='palette' />
                  {t('Palette')}
                </span>
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
                      <span className='avatar-controls__label'>
                        <ControlIcon name='background' />
                        {t('Background')}
                      </span>
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
                      <span className='avatar-controls__label'>
                        <ControlIcon name='background' />
                        {t('Camera background')}
                      </span>
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
                          {CAMERA_BACKGROUND_PRESETS.map(color => (
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
                        onClick={() => editingEntityPart == null
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
                ? null
                : (
                  <div className='avatar-controls__parameter-controls'>
                    <NumberField ariaLabel='Part position X' label='Position X' value={editingEntityPart.x} onChange={x => onEntityPartChange(editingEntityPart.id, { x })} />
                    <NumberField ariaLabel='Part position Y' label='Position Y' value={editingEntityPart.y} onChange={y => onEntityPartChange(editingEntityPart.id, { y })} />
                    <NumberField ariaLabel='Part position Z' label='Position Z' value={editingEntityPart.z} onChange={z => onEntityPartChange(editingEntityPart.id, { z })} />
                    <ValueSlider ariaLabel='Part width' label='Width' min={8} max={150} suffix='%' value={editingEntityPart.scaleX * 100} onChange={value => onEntityPartChange(editingEntityPart.id, { scaleX: value / 100 })} />
                    <ValueSlider ariaLabel='Part height' label='Height' min={8} max={150} suffix='%' value={editingEntityPart.scaleY * 100} onChange={value => onEntityPartChange(editingEntityPart.id, { scaleY: value / 100 })} />
                    <ValueSlider ariaLabel='Part depth' label='Depth' min={8} max={150} suffix='%' value={resolveAvatarEntityPartScaleZ(editingEntityPart) * 100} onChange={value => onEntityPartChange(editingEntityPart.id, { scaleZ: value / 100 })} />
                    <NumberField ariaLabel='Part rotation X' label='Rotation X' suffix='°' value={editingEntityPart.rotationX ?? 0} onChange={rotationX => onEntityPartChange(editingEntityPart.id, { rotationX })} />
                    <NumberField ariaLabel='Part rotation Y' label='Rotation Y' suffix='°' value={editingEntityPart.rotationY ?? 0} onChange={rotationY => onEntityPartChange(editingEntityPart.id, { rotationY })} />
                    <NumberField ariaLabel='Part rotation Z' label='Rotation Z' suffix='°' value={editingEntityPart.rotationZ ?? 0} onChange={rotationZ => onEntityPartChange(editingEntityPart.id, { rotationZ })} />
                    {editingEntityPart.shape === 'cone' || editingEntityPart.shape === 'frustum' || editingEntityPart.shape === 'half-cone'
                      ? (
                        <>
                          <ValueSlider
                            ariaLabel='Part cone roundness'
                            label='Cone roundness'
                            min={0}
                            max={100}
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
                            onChange={() => onEntityPartChange(editingEntityPart.id, { hollow: !(editingEntityPart.hollow ?? false) })}
                          />
                        </>
                      )
                      : null}
                    {editingEntityPart.shape === 'trapezoid'
                      ? (
                        <ValueSlider
                          ariaLabel='Part corner roundness'
                          label='Corner roundness'
                          min={0}
                          max={100}
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
              <ToggleRow checked={showLight} icon='light' label='Light source' onChange={onToggleLight} />
              {showLight
                ? (
                  <div className='avatar-controls__parameter-controls'>
                    <ValueSlider
                      ariaLabel='Light direction'
                      label='Direction'
                      min={-180}
                      max={180}
                      suffix='°'
                      value={lightAzimuth}
                      onChange={onLightAzimuthChange}
                    />
                    <ValueSlider
                      ariaLabel='Light angle'
                      label='Angle'
                      min={-80}
                      max={80}
                      suffix='°'
                      value={lightElevation}
                      onChange={onLightElevationChange}
                    />
                    <div>
                      <ValueSlider
                        ariaLabel='Light distance'
                        label='Distance'
                        min={0}
                        max={100}
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
                        min={25}
                        max={400}
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
                      min={-180}
                      max={180}
                      suffix='°'
                      value={avatarShadowStyle.direction}
                      onChange={direction => onAvatarShadowStyleChange({ direction })}
                    />
                    <ValueSlider
                      ariaLabel='Avatar shadow distance'
                      label='Distance'
                      min={0}
                      max={40}
                      suffix='px'
                      value={avatarShadowStyle.distance}
                      onChange={distance => onAvatarShadowStyleChange({ distance })}
                    />
                    <ValueSlider
                      ariaLabel='Avatar shadow softness'
                      label='Softness'
                      min={0}
                      max={40}
                      suffix='px'
                      value={avatarShadowStyle.softness}
                      onChange={softness => onAvatarShadowStyleChange({ softness })}
                    />
                    <ValueSlider
                      ariaLabel='Avatar shadow opacity'
                      label='Opacity'
                      min={0}
                      max={100}
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
                      min={1}
                      max={20}
                      suffix='px'
                      value={avatarOutlineStyle.width}
                      onChange={width => onAvatarOutlineStyleChange({ width })}
                    />
                    <ValueSlider
                      ariaLabel='Avatar outline opacity'
                      label='Opacity'
                      min={0}
                      max={100}
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
                      min={-180}
                      max={180}
                      suffix='°'
                      value={faceShadowStyle.direction}
                      onChange={direction => onFaceShadowStyleChange({ direction })}
                    />
                    <ValueSlider
                      ariaLabel='Face shadow distance'
                      label='Distance'
                      min={0}
                      max={24}
                      suffix='px'
                      value={faceShadowStyle.distance}
                      onChange={distance => onFaceShadowStyleChange({ distance })}
                    />
                    <ValueSlider
                      ariaLabel='Face shadow softness'
                      label='Softness'
                      min={0}
                      max={12}
                      suffix='px'
                      value={faceShadowStyle.softness}
                      onChange={softness => onFaceShadowStyleChange({ softness })}
                    />
                    <ValueSlider
                      ariaLabel='Face shadow opacity'
                      label='Opacity'
                      min={0}
                      max={100}
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
                      min={-180}
                      max={180}
                      suffix='°'
                      value={frameShadowStyle.direction}
                      onChange={direction => onFrameShadowStyleChange({ direction })}
                    />
                    <ValueSlider
                      ariaLabel='Frame shadow distance'
                      label='Distance'
                      min={0}
                      max={40}
                      suffix='px'
                      value={frameShadowStyle.distance}
                      onChange={distance => onFrameShadowStyleChange({ distance })}
                    />
                    <ValueSlider
                      ariaLabel='Frame shadow softness'
                      label='Softness'
                      min={0}
                      max={48}
                      suffix='px'
                      value={frameShadowStyle.softness}
                      onChange={softness => onFrameShadowStyleChange({ softness })}
                    />
                    <ValueSlider
                      ariaLabel='Frame shadow opacity'
                      label='Opacity'
                      min={0}
                      max={100}
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
                  {t(presetBrowser === 'faces' ? 'Face presets' : 'Saved presets')}
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
                    aria-label={t(presetBrowser === 'faces' ? 'Face presets' : 'Saved presets')}
                  >
                    {presetBrowser === 'faces'
                      ? searchedFacePresets.map(renderFacePresetButton)
                      : searchedSavedPresetItems.map(renderSavedPresetItem)}
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
