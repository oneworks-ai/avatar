import './AnimationPanel.scss'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { DragEvent, MouseEvent, PointerEvent, ReactNode } from 'react'

import addIcon from '@material-symbols/svg-400/rounded/add.svg?url'
import animationIcon from '@material-symbols/svg-400/rounded/animation.svg?url'
import arrowBackIcon from '@material-symbols/svg-400/rounded/arrow_back.svg?url'
import closeIcon from '@material-symbols/svg-400/rounded/close.svg?url'
import deleteIcon from '@material-symbols/svg-400/rounded/delete.svg?url'
import dragIndicatorIcon from '@material-symbols/svg-400/rounded/drag_indicator.svg?url'
import deleteSweepIcon from '@material-symbols/svg-400/rounded/delete_sweep.svg?url'
import firstPageIcon from '@material-symbols/svg-400/rounded/first_page.svg?url'
import fitScreenIcon from '@material-symbols/svg-400/rounded/fit_screen.svg?url'
import keyIcon from '@material-symbols/svg-400/rounded/key.svg?url'
import layersIcon from '@material-symbols/svg-400/rounded/layers.svg?url'
import linearScaleIcon from '@material-symbols/svg-400/rounded/linear_scale.svg?url'
import moreHorizIcon from '@material-symbols/svg-400/rounded/more_horiz.svg?url'
import pauseIcon from '@material-symbols/svg-400/rounded/pause.svg?url'
import playArrowIcon from '@material-symbols/svg-400/rounded/play_arrow.svg?url'
import radioButtonCheckedIcon from '@material-symbols/svg-400/rounded/radio_button_checked.svg?url'
import removeIcon from '@material-symbols/svg-400/rounded/remove.svg?url'
import repeatIcon from '@material-symbols/svg-400/rounded/repeat.svg?url'
import scheduleIcon from '@material-symbols/svg-400/rounded/schedule.svg?url'
import speedIcon from '@material-symbols/svg-400/rounded/speed.svg?url'
import swapHorizIcon from '@material-symbols/svg-400/rounded/swap_horiz.svg?url'
import tagIcon from '@material-symbols/svg-400/rounded/tag.svg?url'
import timerIcon from '@material-symbols/svg-400/rounded/timer.svg?url'
import trendingDownIcon from '@material-symbols/svg-400/rounded/trending_down.svg?url'
import trendingUpIcon from '@material-symbols/svg-400/rounded/trending_up.svg?url'
import showChartIcon from '@material-symbols/svg-400/rounded/show_chart.svg?url'
import tuneIcon from '@material-symbols/svg-400/rounded/tune.svg?url'
import unfoldLessIcon from '@material-symbols/svg-400/rounded/unfold_less.svg?url'
import unfoldMoreIcon from '@material-symbols/svg-400/rounded/unfold_more.svg?url'
import volumeOffIcon from '@material-symbols/svg-400/rounded/volume_off.svg?url'

import type {
  AvatarAnimationParameterValue,
  AvatarPlaybackMode,
  AvatarAnimationTimeline,
  AvatarAnimationTimelineClipInstance,
  AvatarAnimationTimelineTrack
} from '@oneworks/avatar'

import type { AvatarAnimationEasing, AvatarAnimationPreset } from './avatarAnimations'

const PRESET_DRAG_TYPE = 'application/x-oneworks-avatar-animation-preset'
const CLIP_DRAG_TYPE = 'application/x-oneworks-avatar-animation-clip'
const TRACK_DRAG_TYPE = 'application/x-oneworks-avatar-animation-track'
const TRACK_HEADER_WIDTH = 164
const DEFAULT_PIXELS_PER_SECOND = 96
const MIN_PIXELS_PER_SECOND = 48
const MAX_PIXELS_PER_SECOND = 240
const TIMELINE_KEYFRAME_EDGE_SAFE_PX = 16
const MIN_TIMELINE_CLIP_DURATION_MS = 50
const TIMELINE_FOLDED_REPEAT_GAP_PX = 6
const TIMELINE_FOLDED_REPEAT_SUMMARY_WIDTH_PX = 34
const TIMELINE_FOLDED_REPEAT_WIDTH_PX = TIMELINE_FOLDED_REPEAT_GAP_PX + TIMELINE_FOLDED_REPEAT_SUMMARY_WIDTH_PX

const MaterialIcon = ({ src }: { readonly src: string }) => (
  <span className='avatar-material-icon' aria-hidden='true' style={{ maskImage: `url(${src})` }} />
)

export interface AnimationPlayheadStore {
  readonly getSnapshot: () => number
  readonly subscribe: (listener: () => void) => () => void
}

interface SharedAnimationTimelineProps {
  readonly animationPresets: readonly AvatarAnimationPreset[]
  readonly timeline: AvatarAnimationTimeline
  readonly unresolvedClipIds: readonly string[]
}

interface AnimationSidebarProps extends SharedAnimationTimelineProps {
  readonly onDeleteClip: (instanceId: string) => void
  readonly onDeleteKeyframe: (instanceId: string, keyframeIndex: number) => void
  readonly onOpenCustomEditor: () => void
  readonly onReplaceClip: (instanceId: string, presetId: string) => void
  readonly onSelectClip: (instanceId: string | null) => void
  readonly onSelectPreset: (presetId: string) => void
  readonly onSetClipDuration: (instanceId: string, durationMs: number) => void
  readonly onUpdateClip: (
    instanceId: string,
    update: Partial<Pick<AvatarAnimationTimelineClipInstance,
      'frameSequence' | 'parameterValues' | 'playback' | 'playbackRate' | 'sourceOffsetMs' | 'weight'>>
  ) => void
  readonly onUpdateKeyframeTime: (instanceId: string, keyframeIndex: number, atMs: number) => void
  readonly onUpdateKeyframeEasing: (
    instanceId: string,
    keyframeIndex: number,
    easing: AvatarAnimationEasing
  ) => void
  readonly renderPresetPreview: (preset: AvatarAnimationPreset, progress?: number) => ReactNode
  readonly resolveClipKeyframes: (
    clip: AvatarAnimationTimelineClipInstance
  ) => readonly AnimationTimelineKeyframeNode[]
  readonly selectedClipId: string | null
  readonly selectedKeyframe: AnimationTimelineKeyframeSelection | null
  readonly selectedPresetId: string | null
}

interface AnimationPanelProps extends SharedAnimationTimelineProps {
  readonly autoReplay: boolean
  readonly interactionControls?: ReactNode
  readonly isPlaying: boolean
  readonly onAddPreset: (presetId: string, startMs: number, targetTrackId?: string) => void
  readonly onClose: () => void
  readonly onClearTimeline: () => void
  readonly onClearTrack: (trackId: string) => void
  readonly onDeleteClip: (instanceId: string) => void
  readonly onDeleteKeyframe: (instanceId: string, keyframeIndex: number) => void
  readonly onDeleteTrack: (trackId: string) => void
  readonly onArrangeClips: (
    trackId: string,
    placements: readonly AnimationTimelineClipPlacement[]
  ) => void
  readonly onMoveClip: (instanceId: string, startMs: number, targetTrackId: string) => void
  readonly onAutoReplayChange: (autoReplay: boolean) => void
  readonly onPlayPause: () => void
  readonly onPlaybackSpeedChange: (speed: number) => void
  readonly onSelectClip: (instanceId: string | null) => void
  readonly onSeek: (timeMs: number) => void
  readonly onSelectKeyframe: (selection: AnimationTimelineKeyframeSelection | null) => void
  readonly onTrackReorder: (trackId: string, targetTrackId: string) => void
  readonly onTrackUpdate: (
    trackId: string,
    update: Partial<Pick<AvatarAnimationTimelineTrack, 'muted' | 'solo' | 'weight'>>
  ) => void
  readonly onTrimClip: (instanceId: string, edge: 'end' | 'start', timeMs: number) => void
  readonly playbackSpeed: number
  readonly playheadStore: AnimationPlayheadStore
  readonly renderPresetPreview: (preset: AvatarAnimationPreset, progress?: number) => ReactNode
  readonly resolveClipKeyframes: (
    clip: AvatarAnimationTimelineClipInstance
  ) => readonly AnimationTimelineKeyframeNode[]
  readonly renderClipPreview: (clip: AvatarAnimationTimelineClipInstance, progress?: number) => ReactNode
  readonly selectedClipId: string | null
  readonly selectedKeyframe: AnimationTimelineKeyframeSelection | null
}

export interface AnimationTimelineKeyframeNode {
  readonly atMs: number
  readonly canDelete?: boolean
  readonly easing: AvatarAnimationEasing
  readonly keyframeIndex: number
  readonly occurrenceId?: string
  readonly sequenceTimeMs?: number
  readonly sourceDurationMs: number
  readonly sourceFrameCount?: number
}

interface AnimationTimelineFold {
  readonly endMs: number
  readonly instanceId: string
  readonly repeatCount: number | 'infinite'
  readonly startMs: number
}

interface AnimationTimelineDisplayFold {
  readonly endMs: number
  readonly repeatCount: number | 'infinite' | 'mixed'
  readonly startMs: number
}

const getTimelineFoldKey = (fold: Pick<AnimationTimelineDisplayFold, 'endMs' | 'startMs'>) => (
  `${fold.startMs}:${fold.endMs}`
)

const resolveVisibleClipKeyframes = (
  clip: AvatarAnimationTimelineClipInstance,
  resolveClipKeyframes: AnimationPanelProps['resolveClipKeyframes']
) => resolveClipKeyframes(clip).filter(node => {
  const localMs = ((node.sequenceTimeMs ?? node.atMs) - clip.sourceOffsetMs) / clip.playbackRate
  return localMs >= 0 && localMs <= clip.durationMs
})

const resolveClipTimelineFold = (
  clip: AvatarAnimationTimelineClipInstance,
  resolveClipKeyframes: AnimationPanelProps['resolveClipKeyframes']
): AnimationTimelineFold | null => {
  const nodes = resolveVisibleClipKeyframes(clip, resolveClipKeyframes)
  if (nodes.length < 3) return null
  const groups = new Map<number, number[]>()
  for (const node of nodes) {
    const localMs = ((node.sequenceTimeMs ?? node.atMs) - clip.sourceOffsetMs) / clip.playbackRate
    const times = groups.get(node.keyframeIndex)
    if (times == null) groups.set(node.keyframeIndex, [localMs])
    else if (!times.includes(localMs)) times.push(localMs)
  }
  const explicitLoop = clip.frameSequence?.loop
  const anchorGroup = explicitLoop == null
    ? [...groups.entries()]
      .filter(([, times]) => times.length > 1)
      .sort((first, second) => second[1].length - first[1].length || first[1][0]! - second[1][0]!)[0]
    : [explicitLoop.startFrameIndex, groups.get(explicitLoop.startFrameIndex) ?? []] as const
  if (anchorGroup == null || anchorGroup[1].length < 2) return null
  const occurrences = [...anchorGroup[1]].sort((first, second) => first - second)
  const foldStartLocalMs = occurrences[1]!
  const outroStartLocalMs = explicitLoop == null || explicitLoop.iterations === 'infinite'
    ? clip.durationMs
    : nodes
      .filter(node => node.keyframeIndex > explicitLoop.endFrameIndex)
      .map(node => ((node.sequenceTimeMs ?? node.atMs) - clip.sourceOffsetMs) / clip.playbackRate)
      .filter(localMs => localMs > foldStartLocalMs)
      .sort((first, second) => first - second)[0] ?? clip.durationMs
  if (outroStartLocalMs - foldStartLocalMs <= MIN_TIMELINE_CLIP_DURATION_MS) return null
  return {
    endMs: clip.startMs + outroStartLocalMs,
    instanceId: clip.instanceId,
    repeatCount: explicitLoop?.iterations ?? occurrences.length,
    startMs: clip.startMs + foldStartLocalMs
  }
}

const mergeTimelineDisplayFolds = (
  folds: readonly AnimationTimelineFold[]
): readonly AnimationTimelineDisplayFold[] => {
  const ordered = [...folds].sort((first, second) => first.startMs - second.startMs || first.endMs - second.endMs)
  const merged: AnimationTimelineDisplayFold[] = []
  for (const fold of ordered) {
    const previous = merged.at(-1)
    if (previous == null || fold.startMs >= previous.endMs) {
      merged.push({ endMs: fold.endMs, repeatCount: fold.repeatCount, startMs: fold.startMs })
      continue
    }
    merged[merged.length - 1] = {
      endMs: Math.max(previous.endMs, fold.endMs),
      repeatCount: previous.repeatCount === fold.repeatCount ? previous.repeatCount : 'mixed',
      startMs: previous.startMs
    }
  }
  return merged
}

const timelineTimeToDisplayPx = (
  timeMs: number,
  folds: readonly AnimationTimelineDisplayFold[],
  pixelsPerSecond: number
) => {
  let displayPx = Math.max(timeMs, 0) / 1000 * pixelsPerSecond
  for (const fold of folds) {
    const expandedWidthPx = (fold.endMs - fold.startMs) / 1000 * pixelsPerSecond
    const foldedWidthPx = Math.min(TIMELINE_FOLDED_REPEAT_WIDTH_PX, expandedWidthPx)
    if (timeMs >= fold.endMs) {
      displayPx -= expandedWidthPx - foldedWidthPx
      continue
    }
    if (timeMs <= fold.startMs) break
    const progress = (timeMs - fold.startMs) / Math.max(fold.endMs - fold.startMs, 1)
    displayPx -= (timeMs - fold.startMs) / 1000 * pixelsPerSecond
    displayPx += progress * foldedWidthPx
    break
  }
  return displayPx
}

const timelineDisplayPxToTime = (
  displayPx: number,
  folds: readonly AnimationTimelineDisplayFold[],
  pixelsPerSecond: number
) => {
  let removedPx = 0
  for (const fold of folds) {
    const foldStartPx = fold.startMs / 1000 * pixelsPerSecond - removedPx
    if (displayPx <= foldStartPx) break
    const expandedWidthPx = (fold.endMs - fold.startMs) / 1000 * pixelsPerSecond
    const foldedWidthPx = Math.min(TIMELINE_FOLDED_REPEAT_WIDTH_PX, expandedWidthPx)
    const foldEndPx = foldStartPx + foldedWidthPx
    if (displayPx < foldEndPx) {
      const progress = (displayPx - foldStartPx) / Math.max(foldedWidthPx, 1)
      return fold.startMs + progress * (fold.endMs - fold.startMs)
    }
    removedPx += expandedWidthPx - foldedWidthPx
  }
  return Math.max((displayPx + removedPx) / pixelsPerSecond * 1000, 0)
}

export interface AnimationTimelineKeyframeSelection {
  readonly instanceId: string
  readonly keyframeIndex: number
}

type AnimationTimelineContextMenuTarget =
  | { readonly instanceId: string; readonly kind: 'clip' }
  | { readonly canDelete: boolean; readonly instanceId: string; readonly keyframeIndex: number; readonly kind: 'keyframe' }
  | { readonly kind: 'track'; readonly trackId: string }

type AnimationTimelineContextMenu = {
  readonly clientX: number
  readonly clientY: number
} & AnimationTimelineContextMenuTarget

interface AnimationTimelineDropPreview {
  readonly atMs: number
  readonly durationMs?: number
  readonly isNewTrack: boolean
  readonly topPx?: number
  readonly trackId: string | null
}

interface AnimationTimelineClipMove {
  readonly captureTarget: HTMLElement
  readonly durationMs: number
  readonly grabOffsetMs: number
  readonly instanceId: string
  readonly pointerId: number
  readonly pointerX: number
  readonly pointerY: number
  moved: boolean
  swapPlacements?: readonly AnimationTimelineClipPlacement[]
  targetStartMs?: number
  targetTrackId?: string
}

export interface AnimationTimelineClipPlacement {
  readonly instanceId: string
  readonly startMs: number
}

interface AnimationTimelineClipSwapPreview {
  readonly starts: Readonly<Record<string, number>>
  readonly trackId: string
}

interface AnimationTimelineTrimPreview {
  readonly durationMs: number
  readonly instanceId: string
  readonly startMs: number
  readonly timeMs: number
}

interface AnimationTimelineClipTrim {
  readonly captureTarget: HTMLElement
  readonly edge: 'end' | 'start'
  readonly instanceId: string
  readonly originDurationMs: number
  readonly originStartMs: number
  readonly pointerId: number
  readonly pointerX: number
  preview?: AnimationTimelineTrimPreview
}

const findTimelineClip = (timeline: AvatarAnimationTimeline, instanceId: string | null) => {
  if (instanceId == null) return null
  for (const track of timeline.tracks) {
    const clip = track.clips.find(candidate => candidate.instanceId === instanceId)
    if (clip != null) return { clip, track }
  }
  return null
}

const timelineRangesOverlap = (startMs: number, durationMs: number, otherStartMs: number, otherDurationMs: number) => (
  startMs < otherStartMs + otherDurationMs && otherStartMs < startMs + durationMs
)

export const constrainAnimationTimelineClipStart = (
  track: AvatarAnimationTimelineTrack,
  instanceId: string,
  desiredStartMs: number,
  durationMs: number
) => {
  const desired = Math.max(desiredStartMs, 0)
  const neighbors = track.clips.filter(clip => clip.instanceId !== instanceId)
  const movingClip = track.clips.find(clip => clip.instanceId === instanceId)
  if (movingClip != null) {
    const previousEndMs = neighbors
      .filter(clip => clip.startMs + clip.durationMs <= movingClip.startMs)
      .reduce((latest, clip) => Math.max(latest, clip.startMs + clip.durationMs), 0)
    const nextStartMs = neighbors
      .filter(clip => clip.startMs >= movingClip.startMs + movingClip.durationMs)
      .reduce((earliest, clip) => Math.min(earliest, clip.startMs), Number.POSITIVE_INFINITY)
    return Math.min(Math.max(desired, previousEndMs), nextStartMs - durationMs)
  }
  const available = (startMs: number) => neighbors.every(clip => !timelineRangesOverlap(
    startMs, durationMs, clip.startMs, clip.durationMs
  ))
  if (available(desired)) return desired
  const candidates = [
    0,
    ...neighbors.flatMap(clip => [clip.startMs + clip.durationMs, Math.max(clip.startMs - durationMs, 0)])
  ].filter(available)
  return candidates.sort((left, right) => Math.abs(left - desired) - Math.abs(right - desired) || left - right)[0] ?? desired
}

export const constrainAnimationTimelineClipTrim = (
  track: AvatarAnimationTimelineTrack,
  clip: AvatarAnimationTimelineClipInstance,
  edge: 'end' | 'start',
  desiredTimeMs: number
) => {
  const neighbors = track.clips.filter(candidate => candidate.instanceId !== clip.instanceId)
  if (edge === 'start') {
    const previousEndMs = neighbors
      .filter(candidate => candidate.startMs + candidate.durationMs <= clip.startMs)
      .reduce((latest, candidate) => Math.max(latest, candidate.startMs + candidate.durationMs), 0)
    const startMs = Math.min(
      Math.max(desiredTimeMs, previousEndMs, 0),
      clip.startMs + clip.durationMs - MIN_TIMELINE_CLIP_DURATION_MS
    )
    return {
      durationMs: clip.startMs + clip.durationMs - startMs,
      startMs,
      timeMs: startMs
    }
  }
  const nextStartMs = neighbors
    .filter(candidate => candidate.startMs >= clip.startMs + clip.durationMs)
    .reduce((earliest, candidate) => Math.min(earliest, candidate.startMs), Number.POSITIVE_INFINITY)
  const endMs = Math.max(
    Math.min(desiredTimeMs, nextStartMs),
    clip.startMs + MIN_TIMELINE_CLIP_DURATION_MS
  )
  return {
    durationMs: endMs - clip.startMs,
    startMs: clip.startMs,
    timeMs: endMs
  }
}

export const planAnimationTimelineClipSwap = (
  track: AvatarAnimationTimelineTrack,
  instanceId: string,
  desiredStartMs: number,
  pointerAtMs: number
) => {
  const ordered = [...track.clips].sort((left, right) => left.startMs - right.startMs)
  const movingIndex = ordered.findIndex(clip => clip.instanceId === instanceId)
  const moving = ordered[movingIndex]
  if (moving == null) return {
    movingStartMs: Math.max(desiredStartMs, 0),
    placements: [] as readonly AnimationTimelineClipPlacement[],
    swapped: false
  }

  const neighbors = ordered.filter(clip => clip.instanceId !== instanceId)
  const targetIndex = neighbors.filter(clip => pointerAtMs > clip.startMs + clip.durationMs / 2).length
  if (targetIndex === movingIndex) {
    const movingStartMs = constrainAnimationTimelineClipStart(
      track, instanceId, desiredStartMs, moving.durationMs
    )
    return {
      movingStartMs,
      placements: [{ instanceId, startMs: movingStartMs }] as readonly AnimationTimelineClipPlacement[],
      swapped: false
    }
  }

  const starts = new Map(ordered.map(clip => [clip.instanceId, clip.startMs]))
  const mutableOrder = [...ordered]
  let currentIndex = movingIndex
  while (currentIndex < targetIndex) {
    const currentMoving = mutableOrder[currentIndex]!
    const next = mutableOrder[currentIndex + 1]!
    const movingStartMs = starts.get(currentMoving.instanceId)!
    const nextStartMs = starts.get(next.instanceId)!
    starts.set(next.instanceId, movingStartMs)
    starts.set(currentMoving.instanceId, nextStartMs + next.durationMs - currentMoving.durationMs)
    mutableOrder[currentIndex] = next
    mutableOrder[currentIndex + 1] = currentMoving
    currentIndex += 1
  }
  while (currentIndex > targetIndex) {
    const previous = mutableOrder[currentIndex - 1]!
    const currentMoving = mutableOrder[currentIndex]!
    const previousStartMs = starts.get(previous.instanceId)!
    const movingStartMs = starts.get(currentMoving.instanceId)!
    starts.set(currentMoving.instanceId, previousStartMs)
    starts.set(previous.instanceId, movingStartMs + currentMoving.durationMs - previous.durationMs)
    mutableOrder[currentIndex - 1] = currentMoving
    mutableOrder[currentIndex] = previous
    currentIndex -= 1
  }

  const originalStarts = new Map(ordered.map(clip => [clip.instanceId, clip.startMs]))
  return {
    movingStartMs: starts.get(instanceId)!,
    placements: ordered
      .map(clip => ({ instanceId: clip.instanceId, startMs: starts.get(clip.instanceId)! }))
      .filter(placement => placement.startMs !== originalStarts.get(placement.instanceId)),
    swapped: true
  }
}

const formatTimelineTime = (timeMs: number) => {
  const seconds = Math.max(timeMs, 0) / 1000
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${(seconds % 60).toFixed(2).padStart(5, '0')}`
}

const getPresetAvailability = (
  clip: AvatarAnimationTimelineClipInstance,
  presets: readonly AvatarAnimationPreset[]
) => {
  const source = clip.source
  if (source.type === 'inline') return { available: true, preset: null, reason: null }
  const preset = presets.find(candidate => candidate.id === source.presetId) ?? null
  if (preset == null) return { available: false, preset: null, reason: '动画不可用' }
  if (source.presetVersion !== 1) return { available: false, preset, reason: '版本不兼容' }
  return { available: true, preset, reason: null }
}

export function AnimationSidebar({
  animationPresets,
  onDeleteClip,
  onDeleteKeyframe,
  onOpenCustomEditor,
  onReplaceClip,
  onSelectClip,
  onSelectPreset,
  onSetClipDuration,
  onUpdateClip,
  onUpdateKeyframeEasing,
  onUpdateKeyframeTime,
  renderPresetPreview,
  resolveClipKeyframes,
  selectedClipId,
  selectedKeyframe,
  selectedPresetId,
  timeline,
  unresolvedClipIds
}: AnimationSidebarProps) {
  const [search, setSearch] = useState('')
  const selected = findTimelineClip(timeline, selectedClipId)
  const selectedAvailability = selected == null
    ? null
    : getPresetAvailability(selected.clip, animationPresets)
  const visiblePresets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return animationPresets.filter(preset => query === '' || (
      preset.label.toLocaleLowerCase().includes(query) || preset.id.toLocaleLowerCase().includes(query)
    ))
  }, [animationPresets, search])

  if (selected != null) {
    const { clip } = selected
    const resolvedKeyframeNodes = resolveClipKeyframes(clip)
    const sourceFrameCount = Math.max(
      1,
      ...resolvedKeyframeNodes.map(node => node.sourceFrameCount ?? node.keyframeIndex + 1)
    )
    const frameSequence = clip.frameSequence ?? {
      firstFrameIndex: 0,
      lastFrameIndex: sourceFrameCount - 1
    }
    const updateFrameSequence = (
      next: AvatarAnimationTimelineClipInstance['frameSequence']
    ) => onUpdateClip(clip.instanceId, {
      frameSequence: next?.loop == null && next?.firstFrameIndex === 0 &&
        next.lastFrameIndex === sourceFrameCount - 1
        ? undefined
        : next,
      sourceOffsetMs: 0
    })
    const selectedKeyframeNode = selectedKeyframe?.instanceId === clip.instanceId
      ? resolvedKeyframeNodes.find(node => node.keyframeIndex === selectedKeyframe.keyframeIndex) ?? null
      : null
    const inspectorLabel = selectedKeyframeNode == null ? 'Clip Inspector' : 'Keyframe Inspector'
    const sourceId = clip.source.type === 'preset' ? clip.source.presetId : 'inline'
    const sourceVersion = clip.source.type === 'preset' ? clip.source.presetVersion : clip.source.version
    const preset = selectedAvailability?.preset ?? null
    const sourcePlayback = preset?.playbackMode ?? (
      clip.source.type === 'inline' ? clip.source.clip.playback : 'once'
    )
    const playback: AvatarPlaybackMode = clip.playback ?? sourcePlayback
    const sourceFrameTimes = new Map<number, number>()
    resolvedKeyframeNodes.forEach(node => {
      if (!sourceFrameTimes.has(node.keyframeIndex)) sourceFrameTimes.set(node.keyframeIndex, node.atMs)
    })
    const firstSequenceAtMs = sourceFrameTimes.get(frameSequence.firstFrameIndex) ?? 0
    const lastSequenceAtMs = sourceFrameTimes.get(frameSequence.lastFrameIndex) ??
      resolvedKeyframeNodes[0]?.sourceDurationMs ?? 0
    const loopStartAtMs = frameSequence.loop == null
      ? 0
      : sourceFrameTimes.get(frameSequence.loop.startFrameIndex) ?? firstSequenceAtMs
    const loopEndAtMs = frameSequence.loop == null
      ? 0
      : sourceFrameTimes.get(frameSequence.loop.endFrameIndex) ?? loopStartAtMs
    const sequenceCycleDurationMs = frameSequence.loop?.iterations === 'infinite'
      ? Infinity
      : clip.frameSequence == null
        ? resolvedKeyframeNodes[0]?.sourceDurationMs ?? 0
        : frameSequence.loop == null
        ? Math.max(lastSequenceAtMs - firstSequenceAtMs, 0)
        : Math.max(
            loopStartAtMs - firstSequenceAtMs +
            (loopEndAtMs - loopStartAtMs) * (frameSequence.loop.iterations * 2 - 1) +
            lastSequenceAtMs - loopEndAtMs,
            0
          )
    const loopCount = Number.isFinite(sequenceCycleDurationMs) && sequenceCycleDurationMs > 0
      ? Math.max(Math.round(
          (clip.sourceOffsetMs + clip.durationMs * clip.playbackRate) / sequenceCycleDurationMs
        ), 1)
      : null
    const nextClip = selected.track.clips.find(candidate => candidate.startMs > clip.startMs)
    const maximumLoopCount = loopCount == null
      ? 1
      : Math.max(
          loopCount,
          nextClip == null
            ? 20
            : Math.max(Math.floor(
                (clip.sourceOffsetMs + (nextClip.startMs - clip.startMs) * clip.playbackRate) /
                sequenceCycleDurationMs + 1e-6
              ), 1)
        )
    const unavailable = unresolvedClipIds.includes(clip.instanceId) || selectedAvailability?.available === false
    return (
      <section
        className='avatar-animation-sidebar avatar-animation-sidebar--inspector'
        aria-label={selectedKeyframeNode == null ? 'Animation clip inspector' : 'Animation keyframe inspector'}
      >
        <header className='avatar-animation-sidebar__heading'>
          <button type='button' onClick={() => onSelectClip(null)} aria-label='Back to animation library'>
            <MaterialIcon src={arrowBackIcon} />
          </button>
          <div><strong>{preset?.label ?? sourceId}</strong><span>{inspectorLabel}</span></div>
        </header>
        <div className='avatar-animation-sidebar__inspector-scroll'>
        {unavailable
          ? (
            <div className='avatar-animation-sidebar__unavailable' role='status'>
              <strong>{selectedAvailability?.reason ?? '动画不可用'}</strong>
              <span>原 clip 数据仍会保留并随时间线保存。</span>
            </div>
          )
          : null}
        <dl className='avatar-animation-sidebar__source'>
          <div><MaterialIcon src={animationIcon} /><dt>动画来源</dt><dd>{sourceId}</dd></div>
          <div><MaterialIcon src={tagIcon} /><dt>版本</dt><dd>{sourceVersion}</dd></div>
          <div><MaterialIcon src={scheduleIcon} /><dt>开始时间</dt><dd>{formatTimelineTime(clip.startMs)}</dd></div>
          <div><MaterialIcon src={timerIcon} /><dt>持续时间</dt><dd>{formatTimelineTime(clip.durationMs)}</dd></div>
        </dl>
        <div className='avatar-animation-sidebar__settings'>
          {selectedKeyframeNode != null
            ? (
              <>
                <label className='avatar-animation-sidebar__field avatar-animation-sidebar__keyframe-field'>
                  <span className='avatar-animation-sidebar__field-label'>
                    <MaterialIcon src={keyIcon} /><span>关键节点 {selectedKeyframeNode.keyframeIndex + 1}</span>
                  </span>
                  <span className='avatar-animation-sidebar__control avatar-animation-sidebar__control--suffix'>
                    <input type='number' min='0' step='0.1'
                      value={selectedKeyframeNode.atMs / 1000}
                      onChange={event => onUpdateKeyframeTime(
                        clip.instanceId,
                        selectedKeyframeNode.keyframeIndex,
                        Number(event.currentTarget.value) * 1000
                      )} />
                    <output>s</output>
                  </span>
                </label>
                <div className='avatar-animation-sidebar__field'>
                  <span className='avatar-animation-sidebar__field-label'>
                    <MaterialIcon src={tuneIcon} /><span>缓动类型</span>
                  </span>
                  <div className='avatar-animation-sidebar__easing' role='group' aria-label='关键节点缓动类型'>
                    {([
                      ['linear', '线性', linearScaleIcon],
                      ['ease-in', '缓入', trendingUpIcon],
                      ['ease-out', '缓出', trendingDownIcon],
                      ['ease-in-out', '缓入缓出', showChartIcon]
                    ] as const).map(([value, label, icon]) => (
                      <button
                        key={value}
                        type='button'
                        aria-label={label}
                        aria-pressed={selectedKeyframeNode.easing === value}
                        onClick={() => onUpdateKeyframeEasing(
                          clip.instanceId,
                          selectedKeyframeNode.keyframeIndex,
                          value
                        )}
                      >
                        <MaterialIcon src={icon} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )
            : null}
          {selectedKeyframeNode == null
            ? (
              <>
                <label className='avatar-animation-sidebar__field'>
                  <span className='avatar-animation-sidebar__field-label'>
                    <MaterialIcon src={speedIcon} /><span>播放速度</span>
                  </span>
                  <span className='avatar-animation-sidebar__control'>
                    <input type='number' min='.1' max='4' step='.05' value={clip.playbackRate}
                      onChange={event => onUpdateClip(
                        clip.instanceId,
                        { playbackRate: Number(event.currentTarget.value) }
                      )} />
                  </span>
                </label>
                {playback === 'loop' && loopCount != null
                  ? (
                    <label className='avatar-animation-sidebar__field'>
                      <span className='avatar-animation-sidebar__field-label'>
                        <MaterialIcon src={repeatIcon} /><span>循环次数</span>
                      </span>
                      <span className='avatar-animation-sidebar__control avatar-animation-sidebar__control--suffix'>
                        <input aria-label='循环次数' type='number' min='1' max={maximumLoopCount} step='1'
                          value={loopCount}
                          onChange={event => {
                            const iterations = Math.min(
                              Math.max(Math.round(Number(event.currentTarget.value)), 1),
                              maximumLoopCount
                            )
                            onSetClipDuration(
                              clip.instanceId,
                              Math.max(
                                (sequenceCycleDurationMs * iterations - clip.sourceOffsetMs) /
                                clip.playbackRate,
                                MIN_TIMELINE_CLIP_DURATION_MS
                              )
                            )
                          }} />
                        <output>遍</output>
                      </span>
                    </label>
                    )
                  : null}
                <label className='avatar-animation-sidebar__field'>
                  <span className='avatar-animation-sidebar__field-label'>
                    <MaterialIcon src={swapHorizIcon} /><span>整段播放</span>
                  </span>
                  <span className='avatar-animation-sidebar__control'>
                    <select aria-label='整段播放' value={playback}
                      onChange={event => onUpdateClip(clip.instanceId, {
                        playback: event.currentTarget.value as AvatarPlaybackMode
                      })}>
                      <option value='once'>单次</option>
                      <option value='loop'>循环</option>
                    </select>
                  </span>
                </label>
                <label className='avatar-animation-sidebar__field'>
                  <span className='avatar-animation-sidebar__field-label'>
                    <MaterialIcon src={layersIcon} /><span>动画权重</span>
                  </span>
                  <span className='avatar-animation-sidebar__control avatar-animation-sidebar__control--with-output'>
                    <input type='range' min='0' max='1' step='.05' value={clip.weight}
                      onChange={event => onUpdateClip(clip.instanceId, { weight: Number(event.currentTarget.value) })} />
                    <output>{Math.round(clip.weight * 100)}%</output>
                  </span>
                </label>
                {sourceFrameCount > 1
                  ? (
                    <>
                      <div className='avatar-animation-sidebar__field'>
                        <span className='avatar-animation-sidebar__field-label'>
                          <MaterialIcon src={tuneIcon} /><span>序列范围</span>
                        </span>
                        <span className='avatar-animation-sidebar__sequence-range'>
                          <label>
                            <span>起始</span>
                            <select aria-label='序列起始帧' value={frameSequence.firstFrameIndex}
                              onChange={event => {
                                const firstFrameIndex = Number(event.currentTarget.value)
                                const lastFrameIndex = Math.max(frameSequence.lastFrameIndex, firstFrameIndex)
                                const loop = frameSequence.loop != null &&
                                  frameSequence.loop.startFrameIndex >= firstFrameIndex &&
                                  frameSequence.loop.endFrameIndex <= lastFrameIndex
                                  ? frameSequence.loop
                                  : undefined
                                updateFrameSequence({ firstFrameIndex, lastFrameIndex, ...(loop == null ? {} : { loop }) })
                              }}>
                              {Array.from({ length: sourceFrameCount }, (_, index) => (
                                <option key={index} value={index} disabled={index > frameSequence.lastFrameIndex}>
                                  {index + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                          <span aria-hidden='true'>–</span>
                          <label>
                            <span>结束</span>
                            <select aria-label='序列结束帧' value={frameSequence.lastFrameIndex}
                              onChange={event => {
                                const lastFrameIndex = Number(event.currentTarget.value)
                                const firstFrameIndex = Math.min(frameSequence.firstFrameIndex, lastFrameIndex)
                                const loop = frameSequence.loop != null &&
                                  frameSequence.loop.startFrameIndex >= firstFrameIndex &&
                                  frameSequence.loop.endFrameIndex <= lastFrameIndex
                                  ? frameSequence.loop
                                  : undefined
                                updateFrameSequence({ firstFrameIndex, lastFrameIndex, ...(loop == null ? {} : { loop }) })
                              }}>
                              {Array.from({ length: sourceFrameCount }, (_, index) => (
                                <option key={index} value={index} disabled={index < frameSequence.firstFrameIndex}>
                                  {index + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                        </span>
                      </div>
                      <div className='avatar-animation-sidebar__field'>
                        <span className='avatar-animation-sidebar__field-label'>
                          <MaterialIcon src={tuneIcon} /><span>局部往返</span>
                        </span>
                        <span className={`avatar-animation-sidebar__sequence-loop${frameSequence.loop == null ? ' avatar-animation-sidebar__sequence-loop--disabled' : ''}`}>
                          {frameSequence.loop == null
                            ? null
                            : <>
                          <select aria-label='循环起始帧' value={frameSequence.loop.startFrameIndex}
                            onChange={event => {
                              const startFrameIndex = Number(event.currentTarget.value)
                              const endFrameIndex = Math.max(
                                frameSequence.loop?.endFrameIndex ?? startFrameIndex + 1,
                                startFrameIndex + 1
                              )
                              updateFrameSequence({
                                ...frameSequence,
                                loop: {
                                  endFrameIndex,
                                  iterations: frameSequence.loop?.iterations ?? 2,
                                  startFrameIndex
                                }
                              })
                            }}>
                            {Array.from({ length: sourceFrameCount }, (_, index) => (
                              <option key={index} value={index} disabled={index < frameSequence.firstFrameIndex || index >= frameSequence.lastFrameIndex}>
                                {index + 1}
                              </option>
                            ))}
                          </select>
                          <span aria-hidden='true'>↔</span>
                          <select aria-label='循环结束帧' value={frameSequence.loop.endFrameIndex}
                            onChange={event => {
                              const endFrameIndex = Number(event.currentTarget.value)
                              const startFrameIndex = Math.min(
                                frameSequence.loop?.startFrameIndex ?? frameSequence.firstFrameIndex,
                                endFrameIndex - 1
                              )
                              updateFrameSequence({
                                ...frameSequence,
                                loop: {
                                  endFrameIndex,
                                  iterations: frameSequence.loop?.iterations ?? 2,
                                  startFrameIndex
                                }
                              })
                            }}>
                            {Array.from({ length: sourceFrameCount }, (_, index) => (
                              <option key={index} value={index} disabled={index <= frameSequence.firstFrameIndex || index > frameSequence.lastFrameIndex}>
                                {index + 1}
                              </option>
                            ))}
                          </select>
                          </>}
                          <select aria-label='循环遍数' value={frameSequence.loop?.iterations ?? 1}
                            disabled={frameSequence.firstFrameIndex === frameSequence.lastFrameIndex}
                            onChange={event => {
                              const value = event.currentTarget.value
                              if (value === '1') {
                                updateFrameSequence({
                                  firstFrameIndex: frameSequence.firstFrameIndex,
                                  lastFrameIndex: frameSequence.lastFrameIndex
                                })
                                return
                              }
                              updateFrameSequence({
                                ...frameSequence,
                                loop: {
                                  endFrameIndex: frameSequence.loop?.endFrameIndex ?? Math.min(
                                    frameSequence.firstFrameIndex + 1,
                                    frameSequence.lastFrameIndex
                                  ),
                                  iterations: value === 'infinite' ? 'infinite' : Number(value),
                                  startFrameIndex: frameSequence.loop?.startFrameIndex ?? frameSequence.firstFrameIndex
                                }
                              })
                            }}>
                            <option value='1'>关闭</option>
                            <option value='2'>2 遍</option>
                            <option value='3'>3 遍</option>
                            <option value='4'>4 遍</option>
                            <option value='5'>5 遍</option>
                            <option value='infinite'>无限</option>
                          </select>
                        </span>
                      </div>
                    </>
                    )
                  : null}
                {(preset?.parameters ?? []).map(parameter => {
          const value = clip.parameterValues?.[parameter.id] ?? parameter.default
          const update = (nextValue: AvatarAnimationParameterValue) => onUpdateClip(clip.instanceId, {
            parameterValues: { ...clip.parameterValues, [parameter.id]: nextValue }
          })
          if (parameter.type === 'color') return (
            <label key={parameter.id} className='avatar-animation-sidebar__field'>
              <span className='avatar-animation-sidebar__field-label'>
                <MaterialIcon src={tuneIcon} /><span>{parameter.label}</span>
              </span>
              <input type='color' value={String(value)} onChange={event => update(event.currentTarget.value)} />
            </label>
          )
          if (parameter.type === 'boolean') return (
            <label key={parameter.id} className='avatar-animation-sidebar__field'>
              <span className='avatar-animation-sidebar__field-label'>
                <MaterialIcon src={tuneIcon} /><span>{parameter.label}</span>
              </span>
              <input type='checkbox' checked={value === true} onChange={event => update(event.currentTarget.checked)} />
            </label>
          )
          if (parameter.type === 'enum') return (
            <label key={parameter.id} className='avatar-animation-sidebar__field'>
              <span className='avatar-animation-sidebar__field-label'>
                <MaterialIcon src={tuneIcon} /><span>{parameter.label}</span>
              </span>
              <select aria-label={parameter.label} value={String(value)} onChange={event => update(event.currentTarget.value)}>
                {parameter.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )
          return (
            <label key={parameter.id} className='avatar-animation-sidebar__field'>
              <span className='avatar-animation-sidebar__field-label'>
                <MaterialIcon src={tuneIcon} /><span>{parameter.label}</span>
              </span>
              <input type='number' min={parameter.min} max={parameter.max} step={parameter.step} value={Number(value)}
                onChange={event => update(Number(event.currentTarget.value))} />
            </label>
          )
                })}
              </>
              )
            : null}
        </div>
        <div className='avatar-animation-sidebar__actions' data-has-repair={unavailable}>
          {selectedKeyframeNode == null && unavailable
            ? (
              <label className='avatar-animation-sidebar__replace'>
                <span className='avatar-animation-sidebar__action-label'>
                  <MaterialIcon src={swapHorizIcon} /><span>修复不可用动画</span>
                </span>
                <select defaultValue='' onChange={event => {
                  if (event.currentTarget.value !== '') onReplaceClip(clip.instanceId, event.currentTarget.value)
                  event.currentTarget.value = ''
                }} aria-label='选择替换动画'>
                  <option value=''>选择可用动画…</option>
                  {animationPresets.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
                </select>
              </label>
            )
            : null}
          {selectedKeyframeNode == null
            ? (
              <button type='button' data-danger onClick={() => onDeleteClip(clip.instanceId)}>
                <MaterialIcon src={deleteIcon} /><span>删除片段</span>
              </button>
              )
            : (
              <button type='button' data-danger disabled={selectedKeyframeNode.canDelete === false}
                title={selectedKeyframeNode.canDelete === false ? '该动画至少需要保留当前数量的关键帧' : undefined}
                onClick={() => onDeleteKeyframe(clip.instanceId, selectedKeyframeNode.keyframeIndex)}>
                <MaterialIcon src={deleteIcon} /><span>删除关键帧</span>
              </button>
              )}
        </div>
        </div>
      </section>
    )
  }

  return (
    <section className='avatar-animation-sidebar' aria-label='Animation library'>
      <div className='avatar-animation-sidebar__search-row'>
        <input className='avatar-animation-sidebar__search' type='search' value={search} placeholder='搜索动画'
          aria-label='Search animations' onChange={event => setSearch(event.currentTarget.value)} />
        <button type='button' aria-label='Create custom animation' title='自定义动画' onClick={onOpenCustomEditor}>
          <MaterialIcon src={addIcon} />
        </button>
      </div>
      <div className='avatar-animation-sidebar__library'>
        {visiblePresets.map(preset => (
          <button key={preset.id} className='avatar-animation-sidebar__asset'
            data-selected={selectedPresetId === preset.id} draggable onDragStart={event => {
              event.dataTransfer.effectAllowed = 'copy'
              event.dataTransfer.setData(PRESET_DRAG_TYPE, preset.id)
            }} type='button' aria-label={preset.label} title={preset.label}
            onClick={() => onSelectPreset(preset.id)}>
            <span aria-hidden='true'>{renderPresetPreview(preset)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function AnimationPanel({
  animationPresets,
  autoReplay,
  interactionControls,
  isPlaying,
  onAddPreset,
  onAutoReplayChange,
  onClearTimeline,
  onClearTrack,
  onClose,
  onDeleteClip,
  onDeleteKeyframe,
  onDeleteTrack,
  onArrangeClips,
  onMoveClip,
  onPlayPause,
  onPlaybackSpeedChange,
  onSelectClip,
  onSeek,
  onSelectKeyframe,
  onTrackReorder,
  onTrackUpdate,
  onTrimClip,
  playbackSpeed,
  playheadStore,
  renderPresetPreview,
  resolveClipKeyframes,
  renderClipPreview,
  selectedClipId,
  selectedKeyframe,
  timeline,
  unresolvedClipIds
}: AnimationPanelProps) {
  const playheadMs = useSyncExternalStore(playheadStore.subscribe, playheadStore.getSnapshot, playheadStore.getSnapshot)
  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_PIXELS_PER_SECOND)
  const [expandedTimelineFoldKeys, setExpandedTimelineFoldKeys] = useState<ReadonlySet<string>>(() => new Set())
  const [contextMenu, setContextMenu] = useState<AnimationTimelineContextMenu | null>(null)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null)
  const [clipSwapPreview, setClipSwapPreview] = useState<AnimationTimelineClipSwapPreview | null>(null)
  const [dropPreview, setDropPreview] = useState<AnimationTimelineDropPreview | null>(null)
  const [trimPreview, setTrimPreview] = useState<AnimationTimelineTrimPreview | null>(null)
  const trimRef = useRef<AnimationTimelineClipTrim | null>(null)
  const trimCleanupRef = useRef<(() => void) | null>(null)
  const clipMoveRef = useRef<AnimationTimelineClipMove | null>(null)
  const clipMoveCleanupRef = useRef<(() => void) | null>(null)
  const suppressClipClickRef = useRef<string | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const displayedTracks = useMemo(() => [...timeline.tracks].reverse(), [timeline.tracks])
  const clipFolds = useMemo(() => timeline.tracks.flatMap(track => track.clips.flatMap(clip => {
    const fold = resolveClipTimelineFold(clip, resolveClipKeyframes)
    return fold == null ? [] : [fold]
  })), [resolveClipKeyframes, timeline.tracks])
  const allDisplayFolds = useMemo(() => mergeTimelineDisplayFolds(clipFolds), [clipFolds])
  const displayFolds = useMemo(() => allDisplayFolds.filter(
    fold => !expandedTimelineFoldKeys.has(getTimelineFoldKey(fold))
  ), [allDisplayFolds, expandedTimelineFoldKeys])
  const toggleTimelineFold = (fold: AnimationTimelineDisplayFold) => {
    const foldKey = getTimelineFoldKey(fold)
    setExpandedTimelineFoldKeys(current => {
      const next = new Set(current)
      if (next.has(foldKey)) next.delete(foldKey)
      else next.add(foldKey)
      return next
    })
  }
  const selectedTrackId = useMemo(() => timeline.tracks.find(track => (
    track.clips.some(clip => clip.instanceId === selectedClipId)
  ))?.trackId ?? null, [selectedClipId, timeline.tracks])
  const hasExpandedTimelineFolds = allDisplayFolds.some(
    fold => expandedTimelineFoldKeys.has(getTimelineFoldKey(fold))
  )
  const timeToDisplayPx = (timeMs: number) => timelineTimeToDisplayPx(timeMs, displayFolds, pixelsPerSecond)
  const displayPxToTime = (displayPx: number) => timelineDisplayPxToTime(displayPx, displayFolds, pixelsPerSecond)
  const contentWidth = Math.max(timeToDisplayPx(timeline.durationMs), 720)
  const presetById = useMemo(
    () => new Map<string, AvatarAnimationPreset>(animationPresets.map(preset => [preset.id, preset])),
    [animationPresets]
  )
  useEffect(() => {
    if (contextMenu == null) return
    contextMenuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()

    const closeFromOutsidePointer = (event: globalThis.PointerEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) return
      setContextMenu(null)
    }
    const closeContextMenu = () => setContextMenu(null)
    document.addEventListener('pointerdown', closeFromOutsidePointer, true)
    document.addEventListener('scroll', closeContextMenu, true)
    window.addEventListener('blur', closeContextMenu)
    return () => {
      document.removeEventListener('pointerdown', closeFromOutsidePointer, true)
      document.removeEventListener('scroll', closeContextMenu, true)
      window.removeEventListener('blur', closeContextMenu)
    }
  }, [contextMenu])
  useEffect(() => {
    if (!moreMenuOpen) return
    moreMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus()
    const closeMoreMenu = () => setMoreMenuOpen(false)
    const closeFromOutsidePointer = (event: globalThis.PointerEvent) => {
      if (moreMenuRef.current?.contains(event.target as Node)) return
      closeMoreMenu()
    }
    const closeFromEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeMoreMenu()
    }
    document.addEventListener('pointerdown', closeFromOutsidePointer, true)
    document.addEventListener('keydown', closeFromEscape, true)
    window.addEventListener('blur', closeMoreMenu)
    return () => {
      document.removeEventListener('pointerdown', closeFromOutsidePointer, true)
      document.removeEventListener('keydown', closeFromEscape, true)
      window.removeEventListener('blur', closeMoreMenu)
    }
  }, [moreMenuOpen])
  useEffect(() => () => {
    clipMoveCleanupRef.current?.()
    clipMoveCleanupRef.current = null
    trimCleanupRef.current?.()
    trimCleanupRef.current = null
  }, [])
  const renderTrackPreviewStack = (clips: readonly AvatarAnimationTimelineClipInstance[]) => (
    <span className='avatar-animation-panel__preview-stack' aria-hidden='true'>
      {clips.slice(0, 4).map(clip => {
        if (clip.source.type !== 'preset') return null
        const preset = presetById.get(clip.source.presetId)
        return preset == null ? null : (
          <span key={clip.instanceId}>{renderPresetPreview(preset, .35)}</span>
        )
      })}
    </span>
  )

  const timeFromDrop = (event: DragEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return displayPxToTime(event.clientX - rect.left)
  }
  const showDropPreview = (event: DragEvent<HTMLElement>, trackId: string | null, isNewTrack = false) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes(PRESET_DRAG_TYPE) ? 'copy' : 'move'
    setDropPreview({
      atMs: timeFromDrop(event),
      isNewTrack,
      topPx: isNewTrack ? undefined : event.currentTarget.offsetTop,
      trackId
    })
  }
  const finishLaneDrop = (event: DragEvent<HTMLElement>, trackId?: string) => {
    event.preventDefault()
    const startMs = timeFromDrop(event)
    setDropPreview(null)
    setDraggingClipId(null)
    const presetId = event.dataTransfer.getData(PRESET_DRAG_TYPE)
    if (presetId !== '') return onAddPreset(presetId, startMs, trackId)
    const instanceId = event.dataTransfer.getData(CLIP_DRAG_TYPE)
    if (instanceId !== '' && trackId != null) onMoveClip(instanceId, startMs, trackId)
  }
  const resetClipMove = () => {
    const state = clipMoveRef.current
    clipMoveCleanupRef.current?.()
    clipMoveCleanupRef.current = null
    if (state != null && state.captureTarget.hasPointerCapture(state.pointerId)) {
      state.captureTarget.releasePointerCapture(state.pointerId)
    }
    clipMoveRef.current = null
    setDraggingClipId(null)
    setClipSwapPreview(null)
    setDropPreview(null)
  }
  const findLaneAtPointer = (clientX: number, clientY: number) => {
    const lanes = Array.from(document.querySelectorAll<HTMLElement>('.avatar-animation-panel__lane'))
    const laneFromGeometry = lanes.find(lane => {
      const rect = lane.getBoundingClientRect()
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    })
    return laneFromGeometry ?? document.elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>('.avatar-animation-panel__lane') ?? null
  }
  const consumeSuppressedClipClick = (event: MouseEvent<HTMLElement>, instanceId: string) => {
    if (suppressClipClickRef.current !== instanceId) return false
    suppressClipClickRef.current = null
    event.preventDefault()
    event.stopPropagation()
    return true
  }
  const updateClipMove = (event: Pick<globalThis.PointerEvent, 'clientX' | 'clientY' | 'pointerId' | 'preventDefault'>) => {
    const state = clipMoveRef.current
    if (state == null || state.pointerId !== event.pointerId) return
    if (!state.moved && Math.hypot(event.clientX - state.pointerX, event.clientY - state.pointerY) < 4) return
    if (!state.moved && !state.captureTarget.hasPointerCapture(event.pointerId)) {
      state.captureTarget.setPointerCapture(event.pointerId)
    }
    state.moved = true
    event.preventDefault()
    const lane = findLaneAtPointer(event.clientX, event.clientY)
    const trackId = lane?.dataset.trackId
    const track = timeline.tracks.find(candidate => candidate.trackId === trackId)
    if (lane == null || track == null) {
      state.targetStartMs = undefined
      state.targetTrackId = undefined
      setClipSwapPreview(null)
      setDropPreview(null)
      return
    }
    const rect = lane.getBoundingClientRect()
    const pointerAtMs = displayPxToTime(event.clientX - rect.left)
    const desiredStartMs = pointerAtMs - state.grabOffsetMs
    const source = findTimelineClip(timeline, state.instanceId)
    if (source?.track.trackId === track.trackId) {
      const plan = planAnimationTimelineClipSwap(track, state.instanceId, desiredStartMs, pointerAtMs)
      state.swapPlacements = plan.swapped ? plan.placements : undefined
      state.targetStartMs = plan.movingStartMs
      state.targetTrackId = track.trackId
      setDraggingClipId(state.instanceId)
      setClipSwapPreview({
        starts: Object.fromEntries(plan.placements.map(placement => [placement.instanceId, placement.startMs])),
        trackId: track.trackId
      })
      setDropPreview(null)
      return
    }
    const atMs = constrainAnimationTimelineClipStart(track, state.instanceId, desiredStartMs, state.durationMs)
    state.swapPlacements = undefined
    state.targetStartMs = atMs
    state.targetTrackId = track.trackId
    setDraggingClipId(state.instanceId)
    setClipSwapPreview(null)
    setDropPreview({
      atMs,
      durationMs: state.durationMs,
      isNewTrack: false,
      topPx: lane.offsetTop,
      trackId: track.trackId
    })
  }
  const finishClipMove = (event: Pick<globalThis.PointerEvent, 'pointerId'>) => {
    const state = clipMoveRef.current
    if (state == null || state.pointerId !== event.pointerId) return
    if (state.moved && state.targetStartMs != null && state.targetTrackId != null) {
      suppressClipClickRef.current = state.instanceId
      window.setTimeout(() => {
        if (suppressClipClickRef.current === state.instanceId) suppressClipClickRef.current = null
      }, 0)
      if (state.swapPlacements != null && state.swapPlacements.length > 1) {
        onArrangeClips(state.targetTrackId, state.swapPlacements)
      } else {
        onMoveClip(state.instanceId, state.targetStartMs, state.targetTrackId)
      }
    }
    resetClipMove()
  }
  const beginClipMove = (
    event: PointerEvent<HTMLElement>, clip: AvatarAnimationTimelineClipInstance
  ) => {
    if (event.button !== 0 || (event.target as Element).closest('.avatar-animation-panel__trim') != null) return
    const rect = event.currentTarget.getBoundingClientRect()
    const clipDisplayStartPx = timeToDisplayPx(clip.startMs)
    clipMoveRef.current = {
      captureTarget: event.currentTarget,
      durationMs: clip.durationMs,
      grabOffsetMs: Math.min(Math.max(
        displayPxToTime(clipDisplayStartPx + event.clientX - rect.left) - clip.startMs,
        0
      ), clip.durationMs),
      instanceId: clip.instanceId,
      moved: false,
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY
    }
    const move = (nativeEvent: globalThis.PointerEvent) => updateClipMove(nativeEvent)
    const end = (nativeEvent: globalThis.PointerEvent) => finishClipMove(nativeEvent)
    const cancel = (nativeEvent: globalThis.PointerEvent) => {
      if (clipMoveRef.current?.pointerId === nativeEvent.pointerId) resetClipMove()
    }
    const cancelFromKeyboard = (nativeEvent: KeyboardEvent) => {
      if (nativeEvent.key === 'Escape') resetClipMove()
    }
    window.addEventListener('pointermove', move, true)
    window.addEventListener('pointerup', end, true)
    window.addEventListener('pointercancel', cancel, true)
    window.addEventListener('keydown', cancelFromKeyboard, true)
    clipMoveCleanupRef.current = () => {
      window.removeEventListener('pointermove', move, true)
      window.removeEventListener('pointerup', end, true)
      window.removeEventListener('pointercancel', cancel, true)
      window.removeEventListener('keydown', cancelFromKeyboard, true)
    }
    setContextMenu(null)
  }
  const openContextMenu = (
    event: MouseEvent<HTMLElement>, target: AnimationTimelineContextMenuTarget
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const menuWidth = 176
    const menuHeight = target.kind === 'track' ? 126 : 54
    setContextMenu({
      ...target,
      clientX: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
      clientY: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8))
    } as AnimationTimelineContextMenu)
  }
  const handleTrimPointerDown = (
    event: PointerEvent<HTMLButtonElement>, clip: AvatarAnimationTimelineClipInstance, edge: 'end' | 'start'
  ) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    trimRef.current = {
      captureTarget: event.currentTarget,
      edge,
      instanceId: clip.instanceId,
      originDurationMs: clip.durationMs,
      originStartMs: clip.startMs,
      pointerId: event.pointerId,
      pointerX: event.clientX
    }
    const move = (nativeEvent: globalThis.PointerEvent) => {
      const state = trimRef.current
      if (state == null || nativeEvent.pointerId !== state.pointerId) return
      nativeEvent.preventDefault()
      const found = findTimelineClip(timeline, state.instanceId)
      if (found == null) return
      const originTimeMs = state.edge === 'start'
        ? state.originStartMs
        : state.originStartMs + state.originDurationMs
      const originDisplayPx = timeToDisplayPx(originTimeMs)
      const constrained = constrainAnimationTimelineClipTrim(
        found.track,
        { ...found.clip, durationMs: state.originDurationMs, startMs: state.originStartMs },
        state.edge,
        displayPxToTime(originDisplayPx + nativeEvent.clientX - state.pointerX)
      )
      state.preview = { ...constrained, instanceId: state.instanceId }
      setTrimPreview(state.preview)
    }
    const reset = () => {
      const state = trimRef.current
      trimCleanupRef.current?.()
      trimCleanupRef.current = null
      if (state != null && state.captureTarget.hasPointerCapture(state.pointerId)) {
        state.captureTarget.releasePointerCapture(state.pointerId)
      }
      trimRef.current = null
      setTrimPreview(null)
    }
    const finish = (nativeEvent: globalThis.PointerEvent) => {
      const state = trimRef.current
      if (state == null || nativeEvent.pointerId !== state.pointerId) return
      if (state.preview != null) onTrimClip(state.instanceId, state.edge, state.preview.timeMs)
      reset()
    }
    const cancel = (nativeEvent: globalThis.PointerEvent) => {
      if (trimRef.current?.pointerId === nativeEvent.pointerId) reset()
    }
    const cancelFromKeyboard = (nativeEvent: KeyboardEvent) => {
      if (nativeEvent.key === 'Escape') reset()
    }
    window.addEventListener('pointermove', move, true)
    window.addEventListener('pointerup', finish, true)
    window.addEventListener('pointercancel', cancel, true)
    window.addEventListener('keydown', cancelFromKeyboard, true)
    trimCleanupRef.current = () => {
      window.removeEventListener('pointermove', move, true)
      window.removeEventListener('pointerup', finish, true)
      window.removeEventListener('pointercancel', cancel, true)
      window.removeEventListener('keydown', cancelFromKeyboard, true)
    }
    setContextMenu(null)
  }

  return (
    <section id='avatar-animation-panel' className='avatar-animation-panel' aria-label='Animation timeline' tabIndex={0}
      onPointerDownCapture={event => {
        if (contextMenu != null && !contextMenuRef.current?.contains(event.target as Node)) setContextMenu(null)
      }} onScrollCapture={() => setContextMenu(null)}
      onKeyDown={event => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
        if (event.key === 'Escape' && contextMenu != null) { event.preventDefault(); setContextMenu(null) }
        else if (event.key === ' ') { event.preventDefault(); onPlayPause() }
        else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedKeyframe != null) {
          event.preventDefault(); onDeleteKeyframe(selectedKeyframe.instanceId, selectedKeyframe.keyframeIndex)
        } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedClipId != null) {
          event.preventDefault(); onDeleteClip(selectedClipId)
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); onSeek(playheadMs + (event.key === 'ArrowLeft' ? -100 : 100))
        }
      }}>
      <header className='avatar-animation-panel__transport'>
        <div className='avatar-animation-panel__transport-primary'>
          <button className='avatar-animation-panel__play' type='button'
            aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'} onClick={onPlayPause}>
            <MaterialIcon src={isPlaying ? pauseIcon : playArrowIcon} />
          </button>
          <div className='avatar-animation-panel__timecode'>
            <strong>{formatTimelineTime(playheadMs)}</strong>
            <span>{formatTimelineTime(timeline.durationMs)}</span>
          </div>
          <div className='avatar-animation-panel__speed' role='group' aria-label='Timeline speed'>
            {[.5, .75, 1, 1.5, 2].map(speed => (
              <button key={speed} type='button' aria-pressed={playbackSpeed === speed}
                aria-label={`Set timeline speed to ${speed}×`}
                onClick={() => onPlaybackSpeedChange(speed)}>{speed}×</button>
            ))}
          </div>
        </div>
        <div className='avatar-animation-panel__transport-secondary'>
          <div className='avatar-animation-panel__zoom' role='group' aria-label='Timeline zoom controls'>
            <button type='button' aria-label='Zoom timeline out'
              onClick={() => setPixelsPerSecond(value => Math.max(value - 16, MIN_PIXELS_PER_SECOND))}>
              <MaterialIcon src={removeIcon} />
            </button>
            <input type='range' aria-label='Timeline zoom' min={MIN_PIXELS_PER_SECOND} max={MAX_PIXELS_PER_SECOND}
              value={pixelsPerSecond} onChange={event => setPixelsPerSecond(Number(event.currentTarget.value))} />
            <button type='button' aria-label='Zoom timeline in'
              onClick={() => setPixelsPerSecond(value => Math.min(value + 16, MAX_PIXELS_PER_SECOND))}>
              <MaterialIcon src={addIcon} />
            </button>
          </div>
          {interactionControls}
          <div className='avatar-animation-panel__more' ref={moreMenuRef}>
            <button type='button' aria-label='More timeline options' aria-expanded={moreMenuOpen}
              aria-haspopup='menu' title='更多时间线操作'
              onClick={() => setMoreMenuOpen(current => !current)}>
              <MaterialIcon src={moreHorizIcon} />
            </button>
            {moreMenuOpen
              ? (
                <div className='avatar-animation-panel__more-popover' role='menu' aria-label='Timeline options'>
                  <button type='button' role='menuitem' onClick={() => { onSeek(0); setMoreMenuOpen(false) }}>
                    <MaterialIcon src={firstPageIcon} />播放头归零
                  </button>
                  <button type='button' role='menuitem'
                    onClick={() => { setPixelsPerSecond(DEFAULT_PIXELS_PER_SECOND); setMoreMenuOpen(false) }}>
                    <MaterialIcon src={fitScreenIcon} />重置时间线缩放
                  </button>
                  <button type='button' role='menuitem' disabled={allDisplayFolds.length === 0}
                    onClick={() => {
                      setExpandedTimelineFoldKeys(hasExpandedTimelineFolds
                        ? new Set()
                        : new Set(allDisplayFolds.map(getTimelineFoldKey)))
                      setMoreMenuOpen(false)
                    }}>
                    <MaterialIcon src={hasExpandedTimelineFolds ? unfoldLessIcon : unfoldMoreIcon} />
                    {hasExpandedTimelineFolds ? '折叠所有循环组' : '展开所有循环组'}
                  </button>
                  <button type='button' role='menuitemcheckbox' aria-checked={autoReplay}
                    onClick={() => onAutoReplayChange(!autoReplay)}>
                    <MaterialIcon src={repeatIcon} />自动重播
                    <span className='avatar-animation-panel__menu-check' aria-hidden='true'>
                      {autoReplay ? '✓' : ''}
                    </span>
                  </button>
                  <span className='avatar-animation-panel__menu-separator' role='separator' />
                  <button type='button' role='menuitem' data-danger disabled={selectedTrackId == null}
                    onClick={() => {
                      if (selectedTrackId == null) return
                      onClearTrack(selectedTrackId)
                      setMoreMenuOpen(false)
                    }}>
                    <MaterialIcon src={deleteSweepIcon} />清空选中轨道
                  </button>
                  <button type='button' role='menuitem' data-danger disabled={timeline.tracks.length === 0}
                    onClick={() => { onClearTimeline(); setMoreMenuOpen(false) }}>
                    <MaterialIcon src={deleteIcon} />清空全部片段
                  </button>
                </div>
              )
              : null}
          </div>
          <button className='avatar-animation-panel__close' type='button'
            aria-label='Close animation timeline' onClick={onClose}><MaterialIcon src={closeIcon} /></button>
        </div>
      </header>
      <div className='avatar-animation-panel__editor'>
        <div className='avatar-animation-panel__track-column' style={{ width: TRACK_HEADER_WIDTH }}>
          <div className='avatar-animation-panel__corner'>轨道</div>
          {displayedTracks.map(track => (
            <div key={track.trackId} className='avatar-animation-panel__track-header' draggable
              onContextMenu={event => openContextMenu(event, { kind: 'track', trackId: track.trackId })}
              onDragStart={event => event.dataTransfer.setData(TRACK_DRAG_TYPE, track.trackId)}
              onDragOver={event => event.preventDefault()} onDrop={event => {
                event.preventDefault()
                const sourceId = event.dataTransfer.getData(TRACK_DRAG_TYPE)
                if (sourceId !== '' && sourceId !== track.trackId) onTrackReorder(sourceId, track.trackId)
              }}>
              <MaterialIcon src={dragIndicatorIcon} />
              {renderTrackPreviewStack(track.clips)}
              <strong>{track.name ?? 'Animation'}</strong>
              <details className='avatar-animation-panel__track-menu'>
                <summary aria-label={`More options for ${track.name ?? track.trackId}`} title='更多轨道操作'>
                  <MaterialIcon src={moreHorizIcon} />
                </summary>
                <div role='menu'>
                  <button type='button' role='menuitem' aria-label={`Mute ${track.name ?? track.trackId}`}
                    title={track.muted ? '取消静音' : '静音轨道'} aria-pressed={track.muted}
                    onClick={event => {
                      onTrackUpdate(track.trackId, { muted: !track.muted })
                      event.currentTarget.closest('details')?.removeAttribute('open')
                    }}>
                    <MaterialIcon src={volumeOffIcon} />{track.muted ? '取消静音' : '静音轨道'}
                  </button>
                  <button type='button' role='menuitem' aria-label={`Solo ${track.name ?? track.trackId}`}
                    title={track.solo ? '取消 Solo' : '仅播放此轨道'} aria-pressed={track.solo}
                    onClick={event => {
                      onTrackUpdate(track.trackId, { solo: !track.solo })
                      event.currentTarget.closest('details')?.removeAttribute('open')
                    }}>
                    <MaterialIcon src={radioButtonCheckedIcon} />{track.solo ? '取消 Solo' : '仅播放此轨道'}
                  </button>
                  <button type='button' role='menuitem' data-danger
                    aria-label={`Delete ${track.name ?? track.trackId}`} title='删除轨道'
                    onClick={event => {
                      onDeleteTrack(track.trackId)
                      event.currentTarget.closest('details')?.removeAttribute('open')
                    }}>
                    <MaterialIcon src={deleteIcon} />删除轨道
                  </button>
                </div>
              </details>
            </div>
          ))}
          <div className='avatar-animation-panel__base-header'>
            {renderTrackPreviewStack(displayedTracks.flatMap(track => track.clips))}
            <strong>Base Avatar</strong>
          </div>
        </div>
        <div className='avatar-animation-panel__scroll'>
          <div className='avatar-animation-panel__canvas' style={{ minWidth: contentWidth, width: '100%' }}>
            <div className='avatar-animation-panel__ruler' onPointerDown={event => {
              event.preventDefault()
              event.currentTarget.setPointerCapture(event.pointerId)
              const rect = event.currentTarget.getBoundingClientRect()
              onSeek(displayPxToTime(event.clientX - rect.left))
            }} onPointerMove={event => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
              event.preventDefault()
              const rect = event.currentTarget.getBoundingClientRect()
              onSeek(displayPxToTime(event.clientX - rect.left))
            }} onPointerUp={event => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
              }
            }} onPointerCancel={event => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
              }
            }}>
              {Array.from({ length: Math.floor(timeline.durationMs / 1000) + 1 }, (_, second) => second * 1000)
                .filter(timeMs => !displayFolds.some(fold => timeMs > fold.startMs && timeMs < fold.endMs))
                .map(timeMs => (
                  <span key={timeMs} style={{ left: timeToDisplayPx(timeMs) }}>{timeMs / 1000}s</span>
                ))}
              {allDisplayFolds.map(fold => {
                const expanded = expandedTimelineFoldKeys.has(getTimelineFoldKey(fold))
                const repeatLabel = fold.repeatCount === 'mixed'
                  ? '↔'
                  : fold.repeatCount === 'infinite' ? '×∞' : `×${fold.repeatCount}`
                return (
                <button key={getTimelineFoldKey(fold)} type='button'
                  className='avatar-animation-panel__ruler-fold'
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} repeated timeline region ${repeatLabel}`}
                  data-expanded={expanded || undefined}
                  style={{
                    left: timeToDisplayPx(fold.startMs),
                    width: expanded
                      ? 62
                      : Math.min(
                        TIMELINE_FOLDED_REPEAT_WIDTH_PX,
                        (fold.endMs - fold.startMs) / 1000 * pixelsPerSecond
                      )
                  }}
                  onPointerDown={event => event.stopPropagation()}
                  onClick={event => {
                    event.stopPropagation()
                    toggleTimelineFold(fold)
                  }}>
                  {expanded ? `收起 ${repeatLabel}` : repeatLabel}
                </button>
                )
              })}
            </div>
            {displayedTracks.map(track => (
              <div key={track.trackId} className='avatar-animation-panel__lane' data-track-id={track.trackId}
                data-drop-active={dropPreview?.trackId === track.trackId || undefined}
                onDragOver={event => showDropPreview(event, track.trackId)}
                onDragLeave={event => {
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
                  if (dropPreview?.trackId === track.trackId) setDropPreview(null)
                }} onDrop={event => finishLaneDrop(event, track.trackId)}>
                {track.clips.map(clip => {
                  const presetId = clip.source.type === 'preset' ? clip.source.presetId : 'inline'
                  const preset = presetById.get(presetId)
                  const unavailable = unresolvedClipIds.includes(clip.instanceId) ||
                    clip.source.type === 'preset' && (preset == null || clip.source.presetVersion !== 1)
                  const activeTrimPreview = trimPreview?.instanceId === clip.instanceId ? trimPreview : null
                  const displayedStartMs = activeTrimPreview?.startMs ?? clip.startMs
                  const displayedDurationMs = activeTrimPreview?.durationMs ?? clip.durationMs
                  const clipWidth = Math.max(
                    timeToDisplayPx(displayedStartMs + displayedDurationMs) - timeToDisplayPx(displayedStartMs),
                    36
                  )
                  const previewStartMs = clipSwapPreview?.trackId === track.trackId
                    ? clipSwapPreview.starts[clip.instanceId]
                    : undefined
                  const sourceNodes = resolveVisibleClipKeyframes(clip, resolveClipKeyframes)
                  const keyNodeGroups = new Map<number, typeof sourceNodes>()
                  sourceNodes.forEach(node => {
                    const group = keyNodeGroups.get(node.keyframeIndex)
                    if (group == null) keyNodeGroups.set(node.keyframeIndex, [node])
                    else group.push(node)
                  })
                  const loop = clip.frameSequence?.loop
                  const clipFold = clipFolds.find(fold => fold.instanceId === clip.instanceId)
                  const clipDisplayFold = clipFold == null
                    ? null
                    : allDisplayFolds.find(fold => (
                      clipFold.startMs >= fold.startMs && clipFold.endMs <= fold.endMs
                    )) ?? null
                  const clipFoldExpanded = clipDisplayFold != null &&
                    expandedTimelineFoldKeys.has(getTimelineFoldKey(clipDisplayFold))
                  const keyNodes = (clipFoldExpanded
                    ? [...sourceNodes]
                    : Array.from(keyNodeGroups.values(), group => group[0]))
                    .sort((first, second) => (
                      (first.sequenceTimeMs ?? first.atMs) - (second.sequenceTimeMs ?? second.atMs)
                    ))
                  const clipDisplayStartPx = timeToDisplayPx(clip.startMs)
                  const foldStartPx = clipFold == null
                    ? null
                    : timeToDisplayPx(clipFold.startMs) - clipDisplayStartPx
                  const foldWidthPx = clipFold == null
                    ? null
                    : timeToDisplayPx(clipFold.endMs) - timeToDisplayPx(clipFold.startMs)
                  return (
                    <article key={clip.instanceId} className='avatar-animation-panel__clip'
                      data-selected={selectedClipId === clip.instanceId && selectedKeyframe?.instanceId !== clip.instanceId}
                      data-keyframe-selected={selectedKeyframe?.instanceId === clip.instanceId}
                      data-unavailable={unavailable} data-dragging={draggingClipId === clip.instanceId || undefined}
                      data-swap-moving={(previewStartMs != null && draggingClipId !== clip.instanceId) || undefined}
                      data-trimming={activeTrimPreview != null || undefined}
                      style={{ left: timeToDisplayPx(previewStartMs ?? displayedStartMs),
                        width: clipWidth }}
                      title={unavailable ? `${presetId} · 动画不可用/版本不兼容` : preset?.label ?? presetId}
                      onContextMenu={event => {
                        onSelectClip(clip.instanceId)
                        onSelectKeyframe(null)
                        openContextMenu(event, { instanceId: clip.instanceId, kind: 'clip' })
                      }}
                      onClick={event => {
                        if (consumeSuppressedClipClick(event, clip.instanceId)) return
                        onSelectClip(clip.instanceId)
                        onSelectKeyframe(null)
                      }} onPointerDown={event => beginClipMove(event, clip)}>
                      <button className='avatar-animation-panel__trim avatar-animation-panel__trim--start' type='button'
                        aria-label={`Trim start of ${preset?.label ?? presetId}`}
                        onPointerDown={event => handleTrimPointerDown(event, clip, 'start')} />
                      {clipFold == null || clipFoldExpanded || clipDisplayFold == null ||
                        foldStartPx == null || foldWidthPx == null
                        ? null
                        : (
                          <button type='button' className='avatar-animation-panel__clip-repeat-fold'
                            aria-label={`Expand repeated animation ${clipFold.repeatCount === 'infinite' ? 'infinite' : clipFold.repeatCount} times`}
                            data-infinite={clipFold.repeatCount === 'infinite' || undefined}
                            style={{
                              left: foldStartPx + Math.min(TIMELINE_FOLDED_REPEAT_GAP_PX, foldWidthPx),
                              width: Math.max(foldWidthPx - TIMELINE_FOLDED_REPEAT_GAP_PX, 0)
                            }}
                            onPointerDown={event => event.stopPropagation()}
                            onClick={event => {
                              event.stopPropagation()
                              toggleTimelineFold(clipDisplayFold)
                            }}>
                            <i aria-hidden='true' /><i aria-hidden='true' />
                            <span>{clipFold.repeatCount === 'infinite' ? '×∞' : `×${clipFold.repeatCount}`}</span>
                          </button>
                        )}
                      {keyNodes.length === 0
                        ? null
                        : (
                          <span className='avatar-animation-panel__clip-keyframes'
                            data-folded={clipFold != null && !clipFoldExpanded || undefined}
                            data-expanded={clipFoldExpanded || undefined}
                            data-repeat-count={clipFold?.repeatCount}>
                            {keyNodes.map((node, nodeIndex) => {
                              const localMs = ((node.sequenceTimeMs ?? node.atMs) - clip.sourceOffsetMs) / clip.playbackRate
                              const nodePositionPx = timeToDisplayPx(clip.startMs + localMs) - clipDisplayStartPx
                              const keyframeIsSelected = selectedKeyframe?.instanceId === clip.instanceId &&
                                selectedKeyframe.keyframeIndex === node.keyframeIndex
                              const keyframeEdge = nodePositionPx <= TIMELINE_KEYFRAME_EDGE_SAFE_PX
                                ? 'start'
                                : nodePositionPx >= clipWidth - TIMELINE_KEYFRAME_EDGE_SAFE_PX
                                  ? 'end'
                                  : 'middle'
                              return (
                                <button key={node.occurrenceId ?? `${node.keyframeIndex}-${node.sequenceTimeMs ?? node.atMs}-${nodeIndex}`} type='button'
                                  className='avatar-animation-panel__clip-keyframe'
                                  aria-label={`Edit keyframe ${node.keyframeIndex + 1} of ${preset?.label ?? presetId}`}
                                  aria-pressed={keyframeIsSelected}
                                  style={{ left: keyframeEdge === 'start'
                                    ? '0%'
                                    : keyframeEdge === 'end' ? '100%' : nodePositionPx }}
                                  data-edge={keyframeEdge}
                                  data-loop-member={loop != null && node.keyframeIndex >= loop.startFrameIndex &&
                                    node.keyframeIndex <= loop.endFrameIndex || undefined}
                                  data-source-frame-index={node.keyframeIndex}
                                  onContextMenu={event => {
                                    onSelectClip(clip.instanceId)
                                    onSelectKeyframe({ instanceId: clip.instanceId, keyframeIndex: node.keyframeIndex })
                                    openContextMenu(event, {
                                      canDelete: node.canDelete !== false,
                                      instanceId: clip.instanceId,
                                      keyframeIndex: node.keyframeIndex,
                                      kind: 'keyframe'
                                    })
                                  }}
                                  onClick={event => {
                                    if (consumeSuppressedClipClick(event, clip.instanceId)) return
                                    event.stopPropagation()
                                    onSelectClip(clip.instanceId)
                                    onSelectKeyframe(keyframeIsSelected
                                      ? null
                                      : { instanceId: clip.instanceId, keyframeIndex: node.keyframeIndex })
                                    onSeek(clip.startMs + localMs)
                                  }}>
                                  {renderClipPreview(clip, node.atMs / node.sourceDurationMs)}
                                </button>
                              )
                            })}
                          </span>
                        )}
                      <button className='avatar-animation-panel__trim avatar-animation-panel__trim--end' type='button'
                        aria-label={`Trim end of ${preset?.label ?? presetId}`}
                        onPointerDown={event => handleTrimPointerDown(event, clip, 'end')} />
                    </article>
                  )
                })}
              </div>
            ))}
            <div className='avatar-animation-panel__new-track'
              data-drop-active={dropPreview?.isNewTrack || undefined}
              onDragOver={event => showDropPreview(event, null, true)}
              onDragLeave={event => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
                if (dropPreview?.isNewTrack) setDropPreview(null)
              }} onDrop={event => finishLaneDrop(event)}>
              <span className='avatar-animation-panel__new-track-label'>
                <MaterialIcon src={addIcon} /><span>拖到此处新建最高轨道</span>
              </span>
            </div>
            <div className='avatar-animation-panel__base-lane' />
            {dropPreview == null || dropPreview.isNewTrack
              ? null
              : (
                <>
                  {dropPreview.durationMs == null ? null : (
                    <div className='avatar-animation-panel__drop-range'
                      style={{
                        left: timeToDisplayPx(dropPreview.atMs),
                        top: dropPreview.topPx,
                        width: Math.max(
                          timeToDisplayPx(dropPreview.atMs + dropPreview.durationMs) -
                            timeToDisplayPx(dropPreview.atMs),
                          36
                        )
                      }} />
                  )}
                  <div className='avatar-animation-panel__drop-marker'
                    style={{ left: timeToDisplayPx(dropPreview.atMs) }}>
                    <span>{formatTimelineTime(dropPreview.atMs)}</span>
                  </div>
                </>
                )}
            <div className='avatar-animation-panel__playhead' style={{ left: timeToDisplayPx(playheadMs) }}><i /></div>
          </div>
        </div>
      </div>
      {contextMenu == null
        ? null
        : (
          <div ref={contextMenuRef} className='avatar-animation-panel__context-menu' role='menu'
            aria-label='Timeline item actions' style={{ left: contextMenu.clientX, top: contextMenu.clientY }}>
            {contextMenu.kind === 'track'
              ? (() => {
                  const track = timeline.tracks.find(candidate => candidate.trackId === contextMenu.trackId)
                  if (track == null) return null
                  return (
                    <>
                      <button type='button' role='menuitem' onClick={() => {
                        onTrackUpdate(track.trackId, { muted: !track.muted }); setContextMenu(null)
                      }}><MaterialIcon src={volumeOffIcon} />{track.muted ? '取消静音' : '静音轨道'}</button>
                      <button type='button' role='menuitem' onClick={() => {
                        onTrackUpdate(track.trackId, { solo: !track.solo }); setContextMenu(null)
                      }}><MaterialIcon src={radioButtonCheckedIcon} />{track.solo ? '取消 Solo' : '仅播放此轨道'}</button>
                      <button type='button' role='menuitem' data-danger onClick={() => {
                        onDeleteTrack(track.trackId); setContextMenu(null)
                      }}><MaterialIcon src={deleteIcon} />删除轨道</button>
                    </>
                  )
                })()
              : contextMenu.kind === 'keyframe'
                ? (
                  <button type='button' role='menuitem' data-danger disabled={!contextMenu.canDelete}
                    title={!contextMenu.canDelete ? '该动画至少需要保留当前数量的关键帧' : undefined}
                    onClick={() => {
                      onDeleteKeyframe(contextMenu.instanceId, contextMenu.keyframeIndex); setContextMenu(null)
                    }}><MaterialIcon src={deleteIcon} />删除关键帧</button>
                  )
                : (
                  <button type='button' role='menuitem' data-danger onClick={() => {
                    onDeleteClip(contextMenu.instanceId); setContextMenu(null)
                  }}><MaterialIcon src={deleteIcon} />删除片段</button>
                  )}
          </div>
          )}
    </section>
  )
}
