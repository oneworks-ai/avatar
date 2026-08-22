import './AnimationPanel.scss'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'

import type {
  AvatarAnimationEasing,
  AvatarAnimationKeyframe,
  AvatarAnimationPlaybackMode,
  AvatarAnimationPreset,
  SavedAvatarAnimation
} from './avatarAnimations'
import { useAvatarLocale } from './avatarLocale'

interface AnimationPanelProps {
  readonly activeKeyframeIndex: number | null
  readonly animationName: string
  readonly animationPresets: readonly AvatarAnimationPreset[]
  readonly isCapturingKeyframe: boolean
  readonly isPlaying: boolean
  readonly interactionControls?: ReactNode
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly lockStartPosition: boolean
  readonly onAddKeyframe: () => void
  readonly onAnimationNameChange: (name: string) => void
  readonly onKeyframeDeselect: () => void
  readonly onKeyframeDurationChange: (index: number, durationMs: number) => void
  readonly onKeyframeEasingChange: (index: number, easing: AvatarAnimationEasing) => void
  readonly onKeyframeRemove: (index: number) => void
  readonly onKeyframeSelect: (index: number) => void
  readonly onLockStartPositionChange: (lockStartPosition: boolean) => void
  readonly onInteractionControlsDockChange: (docked: boolean) => void
  readonly onClose: () => void
  readonly onPlay: () => void
  readonly onPlaybackModeChange: (mode: AvatarAnimationPlaybackMode) => void
  readonly onPresetSelect: (preset: AvatarAnimationPreset) => boolean
  readonly onSavedAnimationRemove: (animation: SavedAvatarAnimation) => void
  readonly onSavedAnimationSelect: (animation: SavedAvatarAnimation) => boolean
  readonly onSave: () => void
  readonly onStartFrameChange: (index: number) => void
  readonly onStop: () => void
  readonly playbackMode: AvatarAnimationPlaybackMode
  readonly renderKeyframePreview: (keyframe: AvatarAnimationKeyframe) => ReactNode
  readonly renderPresetPreview: (preset: AvatarAnimationPreset) => ReactNode
  readonly requiresReplacementConfirmation: boolean
  readonly savedAnimations: readonly SavedAvatarAnimation[]
  readonly selectedLibraryId: string | null
  readonly selectedKeyframeIndex: number | null
  readonly startFrameIndex: number
}

type AnimationPanelTab = 'create' | 'playback'
type PendingAnimationAction =
  | { readonly animation: SavedAvatarAnimation; readonly type: 'remove-saved' }
  | { readonly animation: SavedAvatarAnimation; readonly type: 'replace-saved' }
  | { readonly preset: AvatarAnimationPreset; readonly type: 'replace-preset' }

const DEFAULT_PANEL_HEIGHT = 244
const MIN_PANEL_HEIGHT = 180
const MIN_STAGE_HEIGHT = 96

const clampPanelHeight = (height: number) => {
  const viewportLimit = typeof window === 'undefined'
    ? 720
    : Math.max(MIN_PANEL_HEIGHT, Math.round(window.innerHeight - MIN_STAGE_HEIGHT))
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
  animationName,
  animationPresets,
  isCapturingKeyframe,
  isPlaying,
  interactionControls,
  keyframes,
  lockStartPosition,
  onAddKeyframe,
  onAnimationNameChange,
  onKeyframeDeselect,
  onKeyframeDurationChange,
  onKeyframeEasingChange,
  onKeyframeRemove,
  onKeyframeSelect,
  onLockStartPositionChange,
  onInteractionControlsDockChange,
  onClose,
  onPlay,
  onPlaybackModeChange,
  onPresetSelect,
  onSavedAnimationRemove,
  onSavedAnimationSelect,
  onSave,
  onStartFrameChange,
  onStop,
  playbackMode,
  renderKeyframePreview,
  renderPresetPreview,
  requiresReplacementConfirmation,
  savedAnimations,
  selectedLibraryId,
  selectedKeyframeIndex,
  startFrameIndex
}: AnimationPanelProps) {
  const { t } = useAvatarLocale()
  const [activeTab, setActiveTab] = useState<AnimationPanelTab>('create')
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT)
  const [pendingAction, setPendingAction] = useState<PendingAnimationAction | null>(null)
  const [resizing, setResizing] = useState(false)
  const confirmActionRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const resizeStartRef = useRef<{ height: number; pointerY: number } | null>(null)
  const settingsOpen = activeTab === 'create' || selectedLibraryId != null
  const selectedKeyframe = selectedKeyframeIndex == null ? null : keyframes[selectedKeyframeIndex] ?? null
  const createTabLabel = selectedLibraryId == null
    ? t('Create')
    : `${t('Editing')} ${animationName.trim() || t('Untitled animation')}`

  useEffect(() => {
    if (pendingAction != null) confirmActionRef.current?.focus()
  }, [pendingAction])

  useEffect(() => {
    const panel = panelRef.current
    if (panel == null) return

    const updateDockedState = () => {
      onInteractionControlsDockChange(panel.getBoundingClientRect().height > window.innerHeight * .4)
    }
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateDockedState)
    resizeObserver?.observe(panel)
    window.addEventListener('resize', updateDockedState)
    updateDockedState()
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateDockedState)
    }
  }, [onInteractionControlsDockChange])

  useEffect(() => {
    return () => onInteractionControlsDockChange(false)
  }, [onInteractionControlsDockChange])

  const changeTab = (tab: AnimationPanelTab) => {
    if (tab === 'create' && activeTab !== 'create') onStop()
    setPendingAction(null)
    setActiveTab(tab)
  }

  const requestPresetSelection = (preset: AvatarAnimationPreset) => {
    if (requiresReplacementConfirmation) {
      setPendingAction({ preset, type: 'replace-preset' })
      return
    }
    onPresetSelect(preset)
  }

  const requestSavedAnimationSelection = (animation: SavedAvatarAnimation) => {
    if (requiresReplacementConfirmation) {
      setPendingAction({ animation, type: 'replace-saved' })
      return
    }
    onSavedAnimationSelect(animation)
  }

  const confirmPendingAction = () => {
    const action = pendingAction
    setPendingAction(null)
    if (action == null) return
    if (action.type === 'replace-preset') onPresetSelect(action.preset)
    else if (action.type === 'replace-saved') onSavedAnimationSelect(action.animation)
    else onSavedAnimationRemove(action.animation)
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
      ref={panelRef}
      id='avatar-animation-panel'
      className='avatar-animation-panel'
      aria-label={t('Animation editor')}
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
        <div className='avatar-animation-panel__header-leading'>
          <button
            className='avatar-animation-panel__close'
            type='button'
            aria-controls='avatar-animation-panel'
            aria-expanded='true'
            aria-label='Close animation editor'
            title='Close animation editor'
            onClick={onClose}
          >
            <PlaybackIcon />
          </button>
          {interactionControls}
          <div className='avatar-animation-panel__tabs' role='tablist' aria-label={t('Animation mode')}>
            <button
              id='avatar-animation-tab-create'
              type='button'
              role='tab'
              aria-controls='avatar-animation-panel-create'
              aria-selected={activeTab === 'create'}
              aria-label={createTabLabel}
              title={createTabLabel}
              onClick={() => changeTab('create')}
            >
              <CreateIcon />
              <span className='avatar-animation-panel__tab-label'>{createTabLabel}</span>
            </button>
            <button
              id='avatar-animation-tab-playback'
              type='button'
              role='tab'
              aria-controls='avatar-animation-panel-playback'
              aria-selected={activeTab === 'playback'}
              aria-label={t('Playback')}
              onClick={() => changeTab('playback')}
            >
              <PlaybackIcon />
              <span>{t('Playback')}</span>
            </button>
          </div>
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
          <button
            type='button'
            aria-label='Save animation'
            title='Save animation'
            disabled={keyframes.length < 2 || isCapturingKeyframe}
            onClick={onSave}
          >
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <path d='M4 3h9l3 3v11H4Z' />
              <path d='M7 3v5h6V3M7 17v-5h6v5' />
            </svg>
          </button>
        </div>
      </div>

      <div className='avatar-animation-panel__body' data-settings-open={settingsOpen}>
        <div
          id={`avatar-animation-panel-${activeTab}`}
          className='avatar-animation-panel__content'
          role='tabpanel'
          aria-labelledby={`avatar-animation-tab-${activeTab}`}
          onClick={event => {
            const target = event.target
            if (target instanceof Element && target.closest('button, input, select, textarea, label, a')) return
            onKeyframeDeselect()
          }}
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
                      {renderKeyframePreview(keyframe)}
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
                  const libraryId = `preset:${preset.id}`
                  return (
                    <button
                      key={libraryId}
                      className='avatar-animation-panel__library-item'
                      type='button'
                      aria-label={`Play ${preset.label} animation preset`}
                      aria-pressed={selectedLibraryId === libraryId}
                      title={preset.description}
                      onClick={() => requestPresetSelection(preset)}
                    >
                      <span className='avatar-animation-panel__library-preview' aria-hidden='true'>
                        {renderPresetPreview(preset)}
                      </span>
                      <span className='avatar-animation-panel__library-name'>{preset.label}</span>
                    </button>
                  )
                })}
                {savedAnimations.map(animation => {
                  const previewKeyframe = animation.keyframes[animation.startFrameIndex]
                  const libraryId = `saved:${animation.id}`
                  return (
                    <div
                      key={libraryId}
                      className='avatar-animation-panel__library-item-wrapper'
                    >
                      <button
                        className='avatar-animation-panel__library-item'
                        type='button'
                        aria-label={`Play ${animation.name}`}
                        aria-pressed={selectedLibraryId === libraryId}
                        title={`${animation.name} · ${animation.keyframes.length} keyframes`}
                        onClick={() => requestSavedAnimationSelection(animation)}
                      >
                        <span className='avatar-animation-panel__library-preview' aria-hidden='true'>
                          {previewKeyframe == null ? null : renderKeyframePreview(previewKeyframe)}
                        </span>
                        <span className='avatar-animation-panel__library-name'>
                          {animation.name}
                        </span>
                      </button>
                      <button
                        className='avatar-animation-panel__library-delete'
                        type='button'
                        aria-label={`Delete ${animation.name}`}
                        title={`Delete ${animation.name}`}
                        onClick={() => setPendingAction({ animation, type: 'remove-saved' })}
                      >
                        <svg viewBox='0 0 20 20' aria-hidden='true'>
                          <path d='M4 6h12M8 3h4l1 3H7Zm-2 3v7m4-7v7m4-7v7M6 6l1 11h6l1-11' />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
        </div>

        {settingsOpen
          ? (
            <aside
              className='avatar-animation-panel__settings'
              aria-label={selectedKeyframe == null
                ? 'Animation group settings'
                : `Keyframe ${selectedKeyframeIndex! + 1} settings`}
            >
              {activeTab === 'playback'
                ? (
                  <div className='avatar-animation-panel__settings-frames' aria-label='Selected animation frames'>
                    {keyframes.map((keyframe, index) => (
                      <button
                        key={index}
                        className='avatar-animation-panel__settings-frame'
                        type='button'
                        aria-label={`Edit keyframe ${index + 1}`}
                        aria-pressed={selectedKeyframeIndex === index}
                        onClick={() => onKeyframeSelect(index)}
                      >
                        {renderKeyframePreview(keyframe)}
                        <span>{index + 1}</span>
                      </button>
                    ))}
                  </div>
                )
                : null}

              <div className='avatar-animation-panel__settings-title'>
                {selectedKeyframe == null ? t('Animation group') : `${t('Frame')} ${selectedKeyframeIndex! + 1}`}
              </div>

              {selectedKeyframe == null
                ? (
                  <>
                    <label className='avatar-animation-panel__group-name'>
                      <span>{t('Name')}</span>
                      <input
                        type='text'
                        aria-label={t('Animation name')}
                        maxLength={40}
                        value={animationName}
                        onChange={event => onAnimationNameChange(event.currentTarget.value)}
                      />
                    </label>

                    <div className='avatar-animation-panel__setting-row'>
                      <span>{t('Position')}</span>
                      <button
                        className='avatar-animation-panel__lock-toggle'
                        type='button'
                        aria-pressed={lockStartPosition}
                        onClick={() => onLockStartPositionChange(!lockStartPosition)}
                      >
                        {lockStartPosition ? t('Fixed position') : t('Current position')}
                      </button>
                    </div>

                    {keyframes.length > 0
                      ? (
                        <div className='avatar-animation-panel__start-frame-setting'>
                          <span>{t('First frame')}</span>
                          <div
                            className='avatar-animation-panel__start-frames'
                            role='group'
                            aria-label={t('First frame')}
                          >
                            {keyframes.map((keyframe, index) => (
                              <button
                                key={index}
                                type='button'
                                aria-label={`Start animation at keyframe ${index + 1}`}
                                aria-pressed={startFrameIndex === index}
                                onClick={() => onStartFrameChange(index)}
                              >
                                {renderKeyframePreview(keyframe)}
                                <span>{index + 1}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                      : null}

                    <div className='avatar-animation-panel__setting-row'>
                      <span>{t('Playback')}</span>
                      <div className='avatar-animation-panel__segments' role='group' aria-label='Playback behavior'>
                        {(['once', 'loop'] satisfies AvatarAnimationPlaybackMode[]).map(mode => (
                          <button
                            key={mode}
                            type='button'
                            aria-pressed={playbackMode === mode}
                            onClick={() => onPlaybackModeChange(mode)}
                          >
                            {t(mode === 'once' ? 'Once' : 'Loop')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )
                : (
                  <>
                    <label className='avatar-animation-panel__duration'>
                      <span>{t('Duration')}</span>
                      <input
                        type='range'
                        aria-label={`Keyframe ${selectedKeyframeIndex! + 1} transition duration`}
                        min='100'
                        max='8000'
                        step='100'
                        value={selectedKeyframe.durationMs}
                        onChange={event =>
                          onKeyframeDurationChange(
                            selectedKeyframeIndex!,
                            Number(event.currentTarget.value)
                          )}
                      />
                      <output>{(selectedKeyframe.durationMs / 1000).toFixed(1)}s</output>
                    </label>

                    <label className='avatar-animation-panel__setting-row'>
                      <span>{t('Easing')}</span>
                      <select
                        aria-label={`Keyframe ${selectedKeyframeIndex! + 1} easing`}
                        value={selectedKeyframe.easing}
                        onChange={event =>
                          onKeyframeEasingChange(
                            selectedKeyframeIndex!,
                            event.currentTarget.value as AvatarAnimationEasing
                          )}
                      >
                        <option value='linear'>Linear</option>
                        <option value='ease-in'>Ease in</option>
                        <option value='ease-out'>Ease out</option>
                        <option value='ease-in-out'>Ease in / out</option>
                      </select>
                    </label>

                    <p className='avatar-animation-panel__timing-help'>
                      {playbackMode === 'once' && selectedKeyframeIndex === startFrameIndex
                        ? 'Once starts here immediately. This timing is used when Loop returns to this frame.'
                        : 'Transition time and easing from the previous frame into this frame.'}
                    </p>
                  </>
                )}
            </aside>
          )
          : null}
      </div>
      {pendingAction == null
        ? null
        : (
          <div
            className='avatar-animation-panel__confirmation-backdrop'
            role='presentation'
            onKeyDown={event => {
              if (event.key !== 'Escape') return
              event.stopPropagation()
              setPendingAction(null)
            }}
          >
            <div
              className='avatar-animation-panel__confirmation'
              role='alertdialog'
              aria-labelledby='avatar-animation-confirmation-title'
              aria-describedby='avatar-animation-confirmation-description'
              aria-modal='true'
            >
              <div id='avatar-animation-confirmation-title' className='avatar-animation-panel__confirmation-title'>
                {pendingAction.type === 'remove-saved' ? 'Delete saved animation?' : 'Replace current animation?'}
              </div>
              <p id='avatar-animation-confirmation-description'>
                {pendingAction.type === 'remove-saved'
                  ? `Delete “${pendingAction.animation.name}” from this browser? Its open keyframes will remain as an unsaved draft.`
                  : `Load “${
                    pendingAction.type === 'replace-preset'
                      ? pendingAction.preset.label
                      : pendingAction.animation.name
                  }” and discard the keyframes currently in Create?`}
              </p>
              <div className='avatar-animation-panel__confirmation-actions'>
                <button type='button' onClick={() => setPendingAction(null)}>Cancel</button>
                <button
                  ref={confirmActionRef}
                  type='button'
                  data-danger={pendingAction.type === 'remove-saved'}
                  onClick={confirmPendingAction}
                >
                  {pendingAction.type === 'remove-saved' ? 'Delete' : 'Replace'}
                </button>
              </div>
            </div>
          </div>
        )}
    </section>
  )
}
