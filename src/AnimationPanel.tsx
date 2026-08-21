import './AnimationPanel.scss'

import { useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'

import type {
  AvatarAnimationEasing,
  AvatarAnimationKeyframe,
  AvatarAnimationPlaybackMode,
  AvatarAnimationPreset,
  SavedAvatarAnimation
} from './avatarAnimations'

interface AnimationPanelProps {
  readonly activeKeyframeIndex: number | null
  readonly animationPresets: readonly AvatarAnimationPreset[]
  readonly durationMs: number
  readonly easing: AvatarAnimationEasing
  readonly isCapturingKeyframe: boolean
  readonly isPlaying: boolean
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly onAddKeyframe: () => void
  readonly onDurationChange: (durationMs: number) => void
  readonly onEasingChange: (easing: AvatarAnimationEasing) => void
  readonly onKeyframeRemove: (index: number) => void
  readonly onKeyframeSelect: (index: number) => void
  readonly onPlay: () => void
  readonly onPlaybackModeChange: (mode: AvatarAnimationPlaybackMode) => void
  readonly onPresetSelect: (preset: AvatarAnimationPreset) => boolean
  readonly onSavedAnimationSelect: (animation: SavedAvatarAnimation) => boolean
  readonly onSave: () => void
  readonly onStop: () => void
  readonly playbackMode: AvatarAnimationPlaybackMode
  readonly renderKeyframePreview: (keyframe: AvatarAnimationKeyframe) => ReactNode
  readonly renderPresetPreview: (preset: AvatarAnimationPreset) => ReactNode
  readonly savedAnimations: readonly SavedAvatarAnimation[]
}

type AnimationPanelTab = 'create' | 'playback'

const DEFAULT_PANEL_HEIGHT = 244
const MIN_PANEL_HEIGHT = 180

const clampPanelHeight = (height: number) => {
  const viewportLimit = typeof window === 'undefined'
    ? 640
    : Math.max(MIN_PANEL_HEIGHT, Math.round(window.innerHeight * .72))
  return Math.min(Math.max(height, MIN_PANEL_HEIGHT), viewportLimit)
}

function CreateIcon() {
  return (
    <svg viewBox='0 0 20 20' aria-hidden='true'>
      <path d='M4 4h8l4 4v8H4Z' />
      <path d='M12 4v4h4M7 12h6M10 9v6' />
    </svg>
  )
}

function PlaybackIcon() {
  return (
    <svg viewBox='0 0 20 20' aria-hidden='true'>
      <rect x='3' y='4' width='14' height='12' rx='2' />
      <path d='m8 7 5 3-5 3Z' />
    </svg>
  )
}

function PlayIcon({ playing }: { readonly playing: boolean }) {
  return (
    <svg viewBox='0 0 20 20' aria-hidden='true'>
      {playing ? <path d='M6 6h8v8H6Z' /> : <path d='m7 4.5 8 5.5-8 5.5Z' />}
    </svg>
  )
}

export function AnimationPanel({
  activeKeyframeIndex,
  animationPresets,
  durationMs,
  easing,
  isCapturingKeyframe,
  isPlaying,
  keyframes,
  onAddKeyframe,
  onDurationChange,
  onEasingChange,
  onKeyframeRemove,
  onKeyframeSelect,
  onPlay,
  onPlaybackModeChange,
  onPresetSelect,
  onSavedAnimationSelect,
  onSave,
  onStop,
  playbackMode,
  renderKeyframePreview,
  renderPresetPreview,
  savedAnimations
}: AnimationPanelProps) {
  const [activeTab, setActiveTab] = useState<AnimationPanelTab>('create')
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT)
  const [resizing, setResizing] = useState(false)
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null)
  const resizeStartRef = useRef<{ height: number; pointerY: number } | null>(null)
  const settingsOpen = activeTab === 'create' || selectedLibraryId != null

  const changeTab = (tab: AnimationPanelTab) => {
    if (tab === 'create' && activeTab !== 'create') onStop()
    setActiveTab(tab)
  }

  const handleResizeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    resizeStartRef.current = { height: panelHeight, pointerY: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
    setResizing(true)
  }

  const handleResizeMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = resizeStartRef.current
    if (start == null) return
    setPanelHeight(clampPanelHeight(start.height + start.pointerY - event.clientY))
  }

  const handleResizeEnd = (event: PointerEvent<HTMLDivElement>) => {
    resizeStartRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setResizing(false)
  }

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    setPanelHeight(current => clampPanelHeight(current + (event.key === 'ArrowUp' ? 16 : -16)))
  }

  return (
    <section
      id='avatar-animation-panel'
      className='avatar-animation-panel'
      aria-label='Animation editor'
      data-resizing={resizing}
      style={{ '--avatar-animation-height': `${panelHeight}px` } as CSSProperties}
    >
      <div
        className='avatar-animation-panel__resize-handle'
        role='separator'
        aria-label='Resize animation editor'
        aria-orientation='horizontal'
        aria-valuemin={MIN_PANEL_HEIGHT}
        aria-valuemax={clampPanelHeight(Number.POSITIVE_INFINITY)}
        aria-valuenow={panelHeight}
        tabIndex={0}
        onDoubleClick={() => setPanelHeight(DEFAULT_PANEL_HEIGHT)}
        onKeyDown={handleResizeKeyDown}
        onPointerCancel={handleResizeEnd}
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
      />
      <div className='avatar-animation-panel__header'>
        <div className='avatar-animation-panel__tabs' role='tablist' aria-label='Animation mode'>
          <button
            id='avatar-animation-tab-create'
            type='button'
            role='tab'
            aria-controls='avatar-animation-panel-create'
            aria-selected={activeTab === 'create'}
            onClick={() => changeTab('create')}
          >
            <CreateIcon />
            <span>Create</span>
          </button>
          <button
            id='avatar-animation-tab-playback'
            type='button'
            role='tab'
            aria-controls='avatar-animation-panel-playback'
            aria-selected={activeTab === 'playback'}
            onClick={() => changeTab('playback')}
          >
            <PlaybackIcon />
            <span>Playback</span>
          </button>
        </div>
        <div className='avatar-animation-panel__actions'>
          <button
            type='button'
            aria-label={isPlaying ? 'Stop animation' : 'Play current animation'}
            title={isPlaying ? 'Stop' : 'Play'}
            disabled={keyframes.length < 2}
            data-active={isPlaying}
            onClick={isPlaying ? onStop : onPlay}
          >
            <PlayIcon playing={isPlaying} />
          </button>
          {activeTab === 'create'
            ? (
              <button
                type='button'
                aria-label='Save animation'
                title='Save animation'
                disabled={keyframes.length < 2 || isCapturingKeyframe}
                onClick={() => {
                  onSave()
                  setActiveTab('playback')
                }}
              >
                <svg viewBox='0 0 20 20' aria-hidden='true'>
                  <path d='M4 3h9l3 3v11H4Z' />
                  <path d='M7 3v5h6V3M7 17v-5h6v5' />
                </svg>
              </button>
            )
            : null}
        </div>
      </div>

      <div className='avatar-animation-panel__body' data-settings-open={settingsOpen}>
        <div
          id={`avatar-animation-panel-${activeTab}`}
          className='avatar-animation-panel__content'
          role='tabpanel'
          aria-labelledby={`avatar-animation-tab-${activeTab}`}
        >
          {activeTab === 'create'
            ? (
              <div className='avatar-animation-panel__keyframes'>
                {keyframes.map((keyframe, index) => (
                  <div
                    key={index}
                    className='avatar-animation-panel__keyframe-item'
                    data-active={activeKeyframeIndex === index}
                  >
                    <button
                      className='avatar-animation-panel__keyframe'
                      type='button'
                      aria-label={`Show keyframe ${index + 1}`}
                      aria-pressed={activeKeyframeIndex === index}
                      onClick={() => onKeyframeSelect(index)}
                    >
                      {keyframe.screenshot == null
                        ? <span className='avatar-animation-panel__keyframe-fallback'>{index + 1}</span>
                        : <img src={keyframe.screenshot} alt='' aria-hidden='true' />}
                      <span className='avatar-animation-panel__keyframe-number'>{index + 1}</span>
                    </button>
                    <button
                      className='avatar-animation-panel__delete-keyframe'
                      type='button'
                      aria-label={`Delete keyframe ${index + 1}`}
                      title={`Delete keyframe ${index + 1}`}
                      onClick={() => onKeyframeRemove(index)}
                    >
                      <svg viewBox='0 0 20 20' aria-hidden='true'>
                        <path d='m6 6 8 8M14 6l-8 8' />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  className='avatar-animation-panel__add-keyframe'
                  type='button'
                  aria-label={isCapturingKeyframe ? 'Capturing keyframe' : 'Add current state as keyframe'}
                  title={isCapturingKeyframe ? 'Capturing keyframe' : 'Add current state as keyframe'}
                  disabled={isCapturingKeyframe}
                  onClick={onAddKeyframe}
                >
                  <svg viewBox='0 0 20 20' aria-hidden='true'>
                    <path d='M10 3v14M3 10h14' />
                  </svg>
                </button>
              </div>
            )
            : (
              <div className='avatar-animation-panel__library' aria-label='Animation library'>
                {animationPresets.map(preset => {
                  const libraryId = `preset-${preset.id}`
                  return (
                    <button
                      key={libraryId}
                      className='avatar-animation-panel__library-item'
                      type='button'
                      aria-label={`Play ${preset.label} animation preset`}
                      aria-pressed={selectedLibraryId === libraryId}
                      title={preset.description}
                      onClick={() => {
                        if (onPresetSelect(preset)) setSelectedLibraryId(libraryId)
                      }}
                    >
                      <span className='avatar-animation-panel__library-preview' aria-hidden='true'>
                        {renderPresetPreview(preset)}
                      </span>
                      <span className='avatar-animation-panel__library-name'>{preset.label}</span>
                    </button>
                  )
                })}
                {savedAnimations.map((animation, index) => {
                  const previewKeyframe = animation.keyframes[Math.floor(animation.keyframes.length / 2)]
                  const libraryId = `saved-${animation.id}`
                  return (
                    <button
                      key={libraryId}
                      className='avatar-animation-panel__library-item'
                      type='button'
                      aria-label={`Play saved animation ${savedAnimations.length - index}`}
                      aria-pressed={selectedLibraryId === libraryId}
                      title={`Play ${animation.keyframes.length} keyframes`}
                      onClick={() => {
                        if (onSavedAnimationSelect(animation)) setSelectedLibraryId(libraryId)
                      }}
                    >
                      <span className='avatar-animation-panel__library-preview' aria-hidden='true'>
                        {previewKeyframe == null ? null : renderKeyframePreview(previewKeyframe)}
                      </span>
                      <span className='avatar-animation-panel__library-name'>
                        Saved {savedAnimations.length - index}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
        </div>

        {settingsOpen
          ? (
            <aside className='avatar-animation-panel__settings' aria-label='Animation settings'>
              {activeTab === 'playback'
                ? (
                  <div className='avatar-animation-panel__settings-frames' aria-label='Selected animation frames'>
                    {keyframes.map((keyframe, index) => (
                      <span key={index} className='avatar-animation-panel__settings-frame'>
                        {keyframe.screenshot == null
                          ? renderKeyframePreview(keyframe)
                          : <img src={keyframe.screenshot} alt='' aria-hidden='true' />}
                        <span>{index + 1}</span>
                      </span>
                    ))}
                  </div>
                )
                : null}

              <label className='avatar-animation-panel__duration'>
                <span>Duration</span>
                <input
                  type='range'
                  aria-label='Animation duration'
                  min='400'
                  max='8000'
                  step='100'
                  value={durationMs}
                  onChange={event => onDurationChange(Number(event.currentTarget.value))}
                />
                <output>{(durationMs / 1000).toFixed(1)}s</output>
              </label>

              <div className='avatar-animation-panel__setting-row'>
                <span>Playback</span>
                <div className='avatar-animation-panel__segments' role='group' aria-label='Playback behavior'>
                  {(['once', 'loop'] satisfies AvatarAnimationPlaybackMode[]).map(mode => (
                    <button
                      key={mode}
                      type='button'
                      aria-pressed={playbackMode === mode}
                      onClick={() => onPlaybackModeChange(mode)}
                    >
                      {mode === 'once' ? 'Once' : 'Loop'}
                    </button>
                  ))}
                </div>
              </div>

              <label className='avatar-animation-panel__setting-row'>
                <span>Easing</span>
                <select
                  aria-label='Animation easing'
                  value={easing}
                  onChange={event => onEasingChange(event.currentTarget.value as AvatarAnimationEasing)}
                >
                  <option value='linear'>Linear</option>
                  <option value='ease-in'>Ease in</option>
                  <option value='ease-out'>Ease out</option>
                  <option value='ease-in-out'>Ease in / out</option>
                </select>
              </label>
            </aside>
          )
          : null}
      </div>
    </section>
  )
}
