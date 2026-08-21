import './AvatarControls.scss'

import type { AvatarBackgroundStyle, AvatarPalette } from '@oneworks/avatar'
import { useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'

import { AVATAR_BODY_SHAPES } from './InteractiveAvatar'
import type { AvatarBodyShape } from './InteractiveAvatar'
import { DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type { AvatarEyeShape, AvatarFaceShadowStyle, AvatarFaceStyle, AvatarNoseShape } from './avatarGeometry'
import type { SavedAvatarPreset } from './savedAvatarPresets'

export type AvatarControlTab = 'body' | 'build' | 'effects' | 'style'
export type AvatarCameraFrame = 'circle' | 'rounded' | 'square'
type AvatarFacePart = 'eyes' | 'mouth' | 'nose'
type ControlIconName =
  | AvatarControlTab
  | 'background'
  | 'camera'
  | 'eyes'
  | 'history'
  | 'light'
  | 'mouth'
  | 'nose'
  | 'palette'
  | 'shadow'
type GeometricShapeIconName = 'circle' | 'ellipse' | 'inverted-triangle' | 'rounded' | 'square'

interface GeometricShapeOption<T extends string> {
  readonly icon: GeometricShapeIconName
  readonly id: T
  readonly label: string
}

interface AvatarControlsProps {
  readonly activeTab: AvatarControlTab
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly cameraBackground: string
  readonly cameraFrame: AvatarCameraFrame
  readonly controlsWidth: number
  readonly faceStyle: AvatarFaceStyle
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly hiddenPaletteCount: number
  readonly lightAzimuth: number
  readonly lightElevation: number
  readonly onBackgroundStyleChange: (style: AvatarBackgroundStyle) => void
  readonly onBodyShapeChange: (shape: AvatarBodyShape) => void
  readonly onCameraBackgroundChange: (color: string) => void
  readonly onCameraFrameChange: (frame: AvatarCameraFrame) => void
  readonly onControlsWidthChange: (width: number) => void
  readonly onFaceStyleChange: (style: Partial<AvatarFaceStyle>) => void
  readonly onFaceShadowStyleChange: (style: Partial<AvatarFaceShadowStyle>) => void
  readonly onLightAzimuthChange: (value: number) => void
  readonly onLightElevationChange: (value: number) => void
  readonly onPaletteChange: (paletteId: string) => void
  readonly onResetFace: () => void
  readonly onSavedPresetSelect: (preset: SavedAvatarPreset) => void
  readonly onShowMorePalettesChange: () => void
  readonly onTabChange: (tab: AvatarControlTab) => void
  readonly onToggleLight: () => void
  readonly onToggleShadow: () => void
  readonly selectedPalette: AvatarPalette
  readonly selectedSavedPresetId: string | null
  readonly savedPresets: readonly SavedAvatarPreset[]
  readonly showLight: boolean
  readonly showMorePalettes: boolean
  readonly showShadow: boolean
  readonly visiblePalettes: readonly AvatarPalette[]
}

const DEFAULT_CONTROLS_WIDTH = 420
const MIN_CONTROLS_WIDTH = 300

const clampControlsWidth = (width: number) => {
  const viewportLimit = typeof window === 'undefined'
    ? 620
    : Math.max(MIN_CONTROLS_WIDTH, Math.min(620, window.innerWidth - 360))
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
  diamond: 'Diamond',
  ellipse: 'Ellipse',
  rounded: 'Rounded square',
  sphere: 'Sphere',
  square: 'Square'
}

const EYE_SHAPE_OPTIONS: readonly GeometricShapeOption<AvatarEyeShape>[] = [
  { icon: 'rounded', id: 'rounded', label: 'Rounded' },
  { icon: 'ellipse', id: 'ellipse', label: 'Ellipse' }
]

const NOSE_SHAPE_OPTIONS: readonly GeometricShapeOption<AvatarNoseShape>[] = [
  { icon: 'inverted-triangle', id: 'inverted-triangle', label: 'Triangle' },
  { icon: 'ellipse', id: 'ellipse', label: 'Ellipse' },
  { icon: 'rounded', id: 'rounded', label: 'Rounded' }
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

const CAMERA_BACKGROUND_PRESETS = ['#111315', '#f2f0eb', '#24334a', '#3f201c', '#173d35', '#382641'] as const

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
      {name === 'background'
        ? (
          <>
            <rect x='3' y='4' width='14' height='12' rx='2' />
            <path d='m4 15 5-5 3 3 4-4' />
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
      {shape === 'diamond' ? <path d='m24 6 18 18-18 18L6 24Z' /> : null}
    </svg>
  )
}

function GeometricShapeIcon({ shape }: { readonly shape: GeometricShapeIconName }) {
  return (
    <svg className='avatar-controls__shape-icon' viewBox='0 0 40 32' aria-hidden='true'>
      {shape === 'circle' ? <circle cx='20' cy='16' r='10' /> : null}
      {shape === 'ellipse' ? <ellipse cx='20' cy='16' rx='12' ry='9' /> : null}
      {shape === 'rounded' ? <rect x='9' y='6' width='22' height='20' rx='5' /> : null}
      {shape === 'square' ? <rect x='10' y='6' width='20' height='20' /> : null}
      {shape === 'inverted-triangle' ? <path d='M8 7h24L20 26Z' /> : null}
    </svg>
  )
}

function GeometricShapePicker<T extends string>({ ariaLabel, onChange, options, value }: {
  readonly ariaLabel: string
  readonly onChange: (value: T) => void
  readonly options: readonly GeometricShapeOption<T>[]
  readonly value: T
}) {
  return (
    <div className='avatar-controls__shape-options' role='radiogroup' aria-label={ariaLabel}>
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
          <span>{option.label}</span>
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
  return (
    <div className='avatar-controls__toggle-row'>
      <span className='avatar-controls__toggle-label'>
        <ControlIcon name={icon} />
        {label}
      </span>
      <button
        className='avatar-controls__switch'
        type='button'
        role='switch'
        aria-label={label}
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
  return (
    <label className='avatar-controls__value-slider'>
      <span>
        {label}
        <output>{Math.round(value)}{suffix}</output>
      </span>
      <input
        type='range'
        aria-label={ariaLabel}
        min={min}
        max={max}
        step='1'
        value={value}
        onChange={event => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}

export function AvatarControls({
  activeTab,
  backgroundStyle,
  bodyShape,
  cameraBackground,
  cameraFrame,
  controlsWidth,
  faceStyle,
  faceShadowStyle,
  hiddenPaletteCount,
  lightAzimuth,
  lightElevation,
  onBackgroundStyleChange,
  onBodyShapeChange,
  onCameraBackgroundChange,
  onCameraFrameChange,
  onControlsWidthChange,
  onFaceStyleChange,
  onFaceShadowStyleChange,
  onLightAzimuthChange,
  onLightElevationChange,
  onPaletteChange,
  onResetFace,
  onSavedPresetSelect,
  onShowMorePalettesChange,
  onTabChange,
  onToggleLight,
  onToggleShadow,
  selectedPalette,
  selectedSavedPresetId,
  savedPresets,
  showLight,
  showMorePalettes,
  showShadow,
  visiblePalettes
}: AvatarControlsProps) {
  const [activeFacePart, setActiveFacePart] = useState<AvatarFacePart>('eyes')
  const [resizing, setResizing] = useState(false)
  const resizeStartRef = useRef<{ pointerX: number; width: number } | null>(null)
  const isDefaultFace = Object.entries(DEFAULT_AVATAR_FACE_STYLE).every(([key, value]) => {
    return faceStyle[key as keyof AvatarFaceStyle] === value
  })

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

  return (
    <aside id='avatar-controls' className='avatar-controls' aria-label='Avatar controls' data-resizing={resizing}>
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
      <div className='avatar-controls__tabs' role='tablist' aria-label='Avatar settings'>
        {CONTROL_TABS.map(tab => (
          <button
            key={tab.id}
            id={`avatar-controls-tab-${tab.id}`}
            className='avatar-controls__tab'
            type='button'
            role='tab'
            aria-controls={`avatar-controls-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            <ControlIcon name={tab.id} />
            {tab.label}
          </button>
        ))}
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
                  Saved presets
                </span>
                {savedPresets.length > 0
                  ? (
                    <div className='avatar-controls__saved-preset-list'>
                      {savedPresets.map((preset) => {
                        const savedAt = new Date(preset.createdAt)
                        const savedFrame = getSavedPresetFrame(preset.query)
                        return (
                          <button
                            key={preset.id}
                            className='avatar-controls__saved-preset'
                            type='button'
                            aria-label={`Restore preset saved ${savedAt.toLocaleString()}`}
                            aria-pressed={preset.id === selectedSavedPresetId}
                            data-frame={savedFrame}
                            onClick={() => onSavedPresetSelect(preset)}
                          >
                            <img src={preset.screenshot} alt='' aria-hidden='true' />
                          </button>
                        )
                      })}
                    </div>
                  )
                  : <p className='avatar-controls__saved-preset-empty'>Save a look to build your history.</p>}
              </section>

              <div className='avatar-controls__field-group'>
                <span className='avatar-controls__label'>
                  <ControlIcon name='eyes' />
                  Face
                </span>
                <button
                  className='avatar-controls__face-option'
                  type='button'
                  aria-label='Reset default face'
                  aria-pressed={isDefaultFace}
                  title='Default face'
                  onClick={onResetFace}
                >
                  <svg viewBox='0 0 96 72' aria-hidden='true'>
                    <rect x='22' y='14' width='16' height='44' rx='8' />
                    <rect x='58' y='14' width='16' height='44' rx='8' />
                  </svg>
                </button>
                <div
                  className='avatar-controls__segments avatar-controls__face-tabs'
                  role='tablist'
                  aria-label='Face parts'
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
                      {part[0]?.toUpperCase()}
                      {part.slice(1)}
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
                                min={-90}
                                max={90}
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
                              label='Thickness'
                              min={6}
                              max={36}
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
                              <span>Frown</span>
                              <span>Flat</span>
                              <span>Smile</span>
                            </div>
                          </div>
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
              <div className='avatar-controls__field-group'>
                <span className='avatar-controls__label'>
                  <ControlIcon name='palette' />
                  Palette
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
                      onClick={() => onPaletteChange(palette.id)}
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
                      {showMorePalettes ? 'Less' : `More ${hiddenPaletteCount}`}
                    </button>
                  )
                  : null}
              </div>

              <div className='avatar-controls__field-group'>
                <span className='avatar-controls__label'>
                  <ControlIcon name='background' />
                  Background
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
                      {style === 'solid' ? 'Solid' : 'Gradient'}
                    </button>
                  ))}
                </div>
              </div>

              <div className='avatar-controls__field-group'>
                <span className='avatar-controls__label'>
                  <ControlIcon name='camera' />
                  Camera frame
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
                  Camera background
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

        {activeTab === 'body'
          ? (
            <div className='avatar-controls__body-grid'>
              {AVATAR_BODY_SHAPES.map(shape => (
                <button
                  key={shape}
                  className='avatar-controls__body-option'
                  type='button'
                  aria-pressed={bodyShape === shape}
                  onClick={() => onBodyShapeChange(shape)}
                >
                  <BodyShapeIcon shape={shape} />
                  <span>{BODY_SHAPE_LABELS[shape]}</span>
                </button>
              ))}
            </div>
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
            </>
          )
          : null}
      </div>
    </aside>
  )
}
