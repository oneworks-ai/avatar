// @vitest-environment jsdom

import { act, createElement } from 'react'
import type { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AvatarAnimationTimeline, AvatarAnimationTimelineClipInstance } from '@oneworks/avatar'

import {
  AnimationPanel,
  AnimationSidebar,
  constrainAnimationTimelineClipStart,
  constrainAnimationTimelineClipTrim,
  planAnimationTimelineClipSwap
} from '../src/AnimationPanel'
import type { AnimationPlayheadStore } from '../src/AnimationPanel'
import { AVATAR_ANIMATION_PRESETS } from '../src/avatarAnimations'

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  Reflect.deleteProperty(document, 'elementFromPoint')
  vi.restoreAllMocks()
})

const clip = (
  instanceId: string,
  presetId: string,
  startMs: number,
  overrides: Partial<AvatarAnimationTimelineClipInstance> = {}
): AvatarAnimationTimelineClipInstance => ({
  durationMs: 1000,
  instanceId,
  playbackRate: 1,
  source: { fallback: 'skip', presetId, presetVersion: 1, type: 'preset' },
  sourceOffsetMs: 0,
  startMs,
  weight: 1,
  ...overrides
})

const timeline: AvatarAnimationTimeline = {
  durationMs: 6000,
  tracks: [
    { clips: [clip('low-clip', 'blink', 0)], name: 'Blink', trackId: 'low' },
    { clips: [clip('middle-clip', 'nod', 1000)], name: 'Nod', trackId: 'middle' },
    { clips: [clip('high-clip', 'shocked', 2000)], name: 'Shocked', trackId: 'high' }
  ],
  version: 1
}

const createPlayheadStore = () => {
  let value = 0
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    set: (next: number) => { value = next; listeners.forEach(listener => listener()) },
    subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
  } satisfies AnimationPlayheadStore & { set: (next: number) => void }
}

const createPanelProps = (store = createPlayheadStore()): ComponentProps<typeof AnimationPanel> => ({
  animationPresets: AVATAR_ANIMATION_PRESETS,
  autoReplay: false,
  isPlaying: false,
  onAddPreset: vi.fn(),
  onAutoReplayChange: vi.fn(),
  onClearTimeline: vi.fn(),
  onClearTrack: vi.fn(),
  onClose: vi.fn(),
  onDeleteClip: vi.fn(),
  onDeleteKeyframe: vi.fn(),
  onDeleteTrack: vi.fn(),
  onArrangeClips: vi.fn(),
  onMoveClip: vi.fn(),
  onPlayPause: vi.fn(),
  onPlaybackSpeedChange: vi.fn(),
  onSeek: vi.fn(),
  onSelectClip: vi.fn(),
  onSelectKeyframe: vi.fn(),
  onTrackReorder: vi.fn(),
  onTrackUpdate: vi.fn(),
  onTrimClip: vi.fn(),
  playbackSpeed: 1,
  playheadStore: store,
  renderPresetPreview: preset => createElement('img', { alt: '', 'data-preset': preset.id }),
  renderClipPreview: candidate => createElement('img', { alt: '', 'data-clip': candidate.instanceId }),
  resolveClipKeyframes: () => [
    { atMs: 0, easing: 'linear', keyframeIndex: 0, sourceDurationMs: 1000 },
    { atMs: 1000, easing: 'ease-out', keyframeIndex: 1, sourceDurationMs: 1000 }
  ],
  selectedClipId: null,
  selectedKeyframe: null,
  timeline,
  unresolvedClipIds: []
})

const renderPanel = (props = createPanelProps()) => {
  act(() => root.render(createElement(AnimationPanel, props)))
  return props
}

describe('Animation timeline UI', () => {
  it('renders runtime-highest track at the top and keeps Base Avatar locked at the bottom', () => {
    renderPanel()
    expect([...host.querySelectorAll('.avatar-animation-panel__track-header strong')].map(node => node.textContent))
      .toEqual(['Shocked', 'Nod', 'Blink'])
    expect(host.querySelector('.avatar-animation-panel__track-column')?.lastElementChild)
      .toHaveProperty('className', 'avatar-animation-panel__base-header')
    expect(host.querySelector('.avatar-animation-panel__base-header')?.textContent).toContain('Base Avatar')
  })

  it('uses the shared playhead store and transport shortcuts without a second component clock', () => {
    const store = createPlayheadStore()
    const props = renderPanel(createPanelProps(store))
    act(() => store.set(1250))
    expect(host.querySelector('.avatar-animation-panel__transport')?.textContent).toContain('0:01.25')
    act(() => host.querySelector('.avatar-animation-panel')?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' })
    ))
    expect(props.onPlayPause).toHaveBeenCalledOnce()
    act(() => host.querySelector('.avatar-animation-panel')?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    ))
    expect(props.onSeek).toHaveBeenCalledWith(1350)
  })

  it('provides direct speed choices and explicit timeline zoom controls', () => {
    const props = renderPanel()
    const speed = host.querySelector('button[aria-label="Set timeline speed to 1.5×"]') as HTMLButtonElement
    act(() => speed.click())
    expect(props.onPlaybackSpeedChange).toHaveBeenCalledWith(1.5)

    const zoom = host.querySelector('input[aria-label="Timeline zoom"]') as HTMLInputElement
    const zoomIn = host.querySelector('button[aria-label="Zoom timeline in"]') as HTMLButtonElement
    const zoomOut = host.querySelector('button[aria-label="Zoom timeline out"]') as HTMLButtonElement
    expect(zoom.value).toBe('96')
    act(() => zoomIn.click())
    expect(zoom.value).toBe('112')
    act(() => zoomOut.click())
    expect(zoom.value).toBe('96')
  })

  it('groups timeline-wide playback, view, and clearing actions in the More menu', () => {
    const props = renderPanel({ ...createPanelProps(), selectedClipId: 'high-clip' })
    const more = host.querySelector('button[aria-label="More timeline options"]') as HTMLButtonElement
    const openMenu = () => act(() => more.click())

    openMenu()
    let menu = host.querySelector('[role="menu"][aria-label="Timeline options"]') as HTMLElement
    expect(menu.textContent).toContain('播放头归零')
    expect(menu.textContent).toContain('重置时间线缩放')
    expect(menu.textContent).toContain('自动重播')
    expect(menu.textContent).toContain('清空选中轨道')
    expect(menu.textContent).toContain('清空全部片段')

    act(() => (menu.querySelector('[role="menuitemcheckbox"]') as HTMLButtonElement).click())
    expect(props.onAutoReplayChange).toHaveBeenCalledWith(true)
    act(() => (menu.querySelector('button[data-danger]') as HTMLButtonElement).click())
    expect(props.onClearTrack).toHaveBeenCalledWith('high')

    openMenu()
    menu = host.querySelector('[role="menu"][aria-label="Timeline options"]') as HTMLElement
    act(() => ([...menu.querySelectorAll('button[data-danger]')].at(-1) as HTMLButtonElement).click())
    expect(props.onClearTimeline).toHaveBeenCalledOnce()
  })

  it('keeps manual zoom stable instead of fitting the whole timeline automatically', () => {
    renderPanel({
      ...createPanelProps(),
      timeline: { ...timeline, durationMs: 20000 }
    })

    const zoom = host.querySelector('input[aria-label="Timeline zoom"]') as HTMLInputElement
    expect(zoom.value).toBe('96')
    act(() => (host.querySelector('button[aria-label="Zoom timeline in"]') as HTMLButtonElement).click())
    expect(zoom.value).toBe('112')
  })

  it('scrubs the playhead across the ruler without selecting its labels', () => {
    const props = renderPanel()
    const ruler = host.querySelector('.avatar-animation-panel__ruler') as HTMLDivElement
    vi.spyOn(ruler, 'getBoundingClientRect').mockReturnValue({
      bottom: 30, height: 30, left: 10, right: 610, top: 0, width: 600, x: 10, y: 0, toJSON: () => ({})
    })
    let capturedPointer: number | null = null
    ruler.setPointerCapture = vi.fn(pointerId => { capturedPointer = pointerId })
    ruler.hasPointerCapture = vi.fn(pointerId => capturedPointer === pointerId)
    ruler.releasePointerCapture = vi.fn(() => { capturedPointer = null })
    const pointer = (type: string, clientX: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, { clientX: { value: clientX }, pointerId: { value: 7 } })
      act(() => ruler.dispatchEvent(event))
    }
    pointer('pointerdown', 106)
    pointer('pointermove', 202)
    pointer('pointerup', 202)
    expect(props.onSeek).toHaveBeenNthCalledWith(1, 1000)
    expect(props.onSeek).toHaveBeenNthCalledWith(2, 2000)
    expect(ruler.releasePointerCapture).toHaveBeenCalledWith(7)
  })

  it('does not extend the scroll range with a ruler tick beyond a fractional duration', () => {
    renderPanel({
      ...createPanelProps(),
      timeline: { ...timeline, durationMs: 6550 }
    })

    const ticks = [...host.querySelectorAll('.avatar-animation-panel__ruler span')]
    expect(ticks.map(tick => tick.textContent)).toEqual(['0s', '1s', '2s', '3s', '4s', '5s', '6s'])
    expect(ticks.at(-1)?.getAttribute('style')).toContain('left: 576px')
  })

  it('keeps the new-track instruction in a viewport-sticky label inside the full-width drop target', () => {
    renderPanel()
    const dropTarget = host.querySelector('.avatar-animation-panel__new-track') as HTMLDivElement
    const label = dropTarget.querySelector(':scope > .avatar-animation-panel__new-track-label')
    expect(label?.textContent).toBe('拖到此处新建最高轨道')
  })

  it('keeps track actions in the right-side more menu', () => {
    const props = renderPanel()
    const header = host.querySelector('.avatar-animation-panel__track-header') as HTMLElement
    const menu = header.querySelector('.avatar-animation-panel__track-menu') as HTMLDetailsElement
    expect(menu.querySelector('summary')?.getAttribute('aria-label')).toContain('More options')
    expect(header.querySelectorAll(':scope > button')).toHaveLength(0)
    const mute = menu.querySelector('button[aria-label^="Mute"]') as HTMLButtonElement
    act(() => mute.click())
    expect(props.onTrackUpdate).toHaveBeenCalledWith('high', { muted: true })
    const removeTrack = menu.querySelector('button[aria-label^="Delete"]') as HTMLButtonElement
    act(() => removeTrack.click())
    expect(props.onDeleteTrack).toHaveBeenCalledWith('high')
  })

  it('selects and deletes clip blocks explicitly', () => {
    const props = renderPanel({ ...createPanelProps(), selectedClipId: 'high-clip' })
    const selected = host.querySelector('.avatar-animation-panel__clip[data-selected="true"]') as HTMLElement
    expect(selected.querySelector('.avatar-animation-panel__clip-label')).toBeNull()
    expect(selected.querySelector('small')).toBeNull()
    expect(selected.querySelectorAll('.avatar-animation-panel__clip-keyframes img')).toHaveLength(2)
    act(() => selected.click())
    expect(props.onSelectClip).toHaveBeenCalledWith('high-clip')
    act(() => host.querySelector('.avatar-animation-panel')?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Delete' })
    ))
    expect(props.onDeleteClip).toHaveBeenCalledWith('high-clip')
  })

  it('opens item-specific context menus for clips, keyframes, and tracks', () => {
    const props = renderPanel()
    const dispatchContextMenu = (target: Element, clientX = 240, clientY = 420) => {
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX, clientY })
      act(() => target.dispatchEvent(event))
    }

    const clipBlock = host.querySelector('.avatar-animation-panel__clip') as HTMLElement
    dispatchContextMenu(clipBlock)
    let menu = host.querySelector('[role="menu"][aria-label="Timeline item actions"]') as HTMLElement
    expect(menu.style.left).toBe('240px')
    act(() => (menu.querySelector('button') as HTMLButtonElement).click())
    expect(props.onDeleteClip).toHaveBeenCalledWith('high-clip')

    const keyframe = clipBlock.querySelector('.avatar-animation-panel__clip-keyframe') as HTMLElement
    dispatchContextMenu(keyframe)
    menu = host.querySelector('[role="menu"][aria-label="Timeline item actions"]') as HTMLElement
    act(() => (menu.querySelector('button') as HTMLButtonElement).click())
    expect(props.onDeleteKeyframe).toHaveBeenCalledWith('high-clip', 0)

    const header = host.querySelector('.avatar-animation-panel__track-header') as HTMLElement
    dispatchContextMenu(header)
    menu = host.querySelector('[role="menu"][aria-label="Timeline item actions"]') as HTMLElement
    expect(menu.textContent).toContain('静音轨道')
    expect(menu.textContent).toContain('仅播放此轨道')
    act(() => document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })))
    expect(host.querySelector('[role="menu"][aria-label="Timeline item actions"]')).toBeNull()

    dispatchContextMenu(header)
    menu = host.querySelector('[role="menu"][aria-label="Timeline item actions"]') as HTMLElement
    act(() => ([...menu.querySelectorAll('button')].at(-1) as HTMLButtonElement).click())
    expect(props.onDeleteTrack).toHaveBeenCalledWith('high')
  })

  it('deletes the selected keyframe instead of the whole clip from the keyboard', () => {
    const props = renderPanel({
      ...createPanelProps(),
      selectedClipId: 'high-clip',
      selectedKeyframe: { instanceId: 'high-clip', keyframeIndex: 1 }
    })
    act(() => host.querySelector('.avatar-animation-panel')?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Backspace' })
    ))
    expect(props.onDeleteKeyframe).toHaveBeenCalledWith('high-clip', 1)
    expect(props.onDeleteClip).not.toHaveBeenCalled()
  })

  it('renders every visible source keyframe instead of sampling three thumbnails', () => {
    renderPanel({
      ...createPanelProps(),
      resolveClipKeyframes: () => Array.from({ length: 8 }, (_, keyframeIndex) => ({
        atMs: keyframeIndex * 100,
        easing: 'linear' as const,
        keyframeIndex,
        sourceDurationMs: 700
      }))
    })
    const clipBlock = host.querySelector('.avatar-animation-panel__clip') as HTMLElement
    expect(clipBlock.querySelectorAll('.avatar-animation-panel__clip-keyframe')).toHaveLength(8)
  })

  it('compacts repeated sequence occurrences into one editable source-frame group', () => {
    const sequenceTimeline: AvatarAnimationTimeline = {
      ...timeline,
      tracks: timeline.tracks.map(track => track.trackId === 'high'
        ? {
            ...track,
            clips: track.clips.map(candidate => ({
              ...candidate,
              frameSequence: {
                firstFrameIndex: 0,
                lastFrameIndex: 2,
                loop: { endFrameIndex: 1, iterations: 3, startFrameIndex: 0 }
              }
            }))
          }
        : track)
    }
    renderPanel({
      ...createPanelProps(),
      selectedKeyframe: { instanceId: 'high-clip', keyframeIndex: 0 },
      timeline: sequenceTimeline,
      resolveClipKeyframes: () => [
        { atMs: 0, easing: 'linear', keyframeIndex: 0, occurrenceId: '0-0', sequenceTimeMs: 0, sourceDurationMs: 1000, sourceFrameCount: 3 },
        { atMs: 400, easing: 'linear', keyframeIndex: 1, occurrenceId: '1-0', sequenceTimeMs: 400, sourceDurationMs: 1000, sourceFrameCount: 3 },
        { atMs: 0, easing: 'linear', keyframeIndex: 0, occurrenceId: '0-1', sequenceTimeMs: 800, sourceDurationMs: 1000, sourceFrameCount: 3 }
      ]
    })
    const nodes = host.querySelectorAll('[data-track-id="high"] .avatar-animation-panel__clip-keyframe')
    expect(nodes).toHaveLength(2)
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip-keyframes')?.getAttribute('data-repeat-count'))
      .toBe('3')
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip-repeat-fold')?.textContent)
      .toBe('×3')
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip-loop-region')).toBeNull()
    expect(host.querySelectorAll('[data-track-id="high"] .avatar-animation-panel__clip-keyframe[data-loop-member="true"]'))
      .toHaveLength(2)
    expect(host.querySelectorAll('[data-track-id="high"] .avatar-animation-panel__clip-keyframe[aria-pressed="true"]'))
      .toHaveLength(1)
  })

  it('folds repeated duration to one source cycle plus a compact repeat summary', () => {
    const longTimeline: AvatarAnimationTimeline = {
      ...timeline,
      tracks: timeline.tracks.map(track => track.trackId === 'high'
        ? { ...track, clips: track.clips.map(candidate => ({ ...candidate, durationMs: 3000 })) }
        : track)
    }
    const props = renderPanel({
      ...createPanelProps(),
      timeline: longTimeline,
      resolveClipKeyframes: () => Array.from({ length: 7 }, (_, occurrenceIndex) => ({
        atMs: occurrenceIndex % 2 === 0 ? 0 : 500,
        easing: 'linear' as const,
        keyframeIndex: occurrenceIndex % 2,
        occurrenceId: `loop-${occurrenceIndex}`,
        sequenceTimeMs: occurrenceIndex * 500,
        sourceDurationMs: 1000,
        sourceFrameCount: 2
      }))
    })

    const nodes = host.querySelectorAll('[data-track-id="high"] .avatar-animation-panel__clip-keyframe')
    expect(nodes).toHaveLength(2)
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip')?.getAttribute('style'))
      .toContain('width: 136px')
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip-keyframes')?.getAttribute('data-repeat-count'))
      .toBe('4')
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip-repeat-fold')?.textContent)
      .toBe('×4')
    const ticks = [...host.querySelectorAll('.avatar-animation-panel__ruler > span')]
    expect(ticks.find(tick => tick.textContent === '5s')?.getAttribute('style')).toContain('left: 328px')
    expect(host.querySelector('.avatar-animation-panel__ruler-fold')?.textContent).toBe('×4')

    const ruler = host.querySelector('.avatar-animation-panel__ruler') as HTMLDivElement
    vi.spyOn(ruler, 'getBoundingClientRect').mockReturnValue({
      bottom: 30, height: 30, left: 0, right: 720, top: 0, width: 720, x: 0, y: 0, toJSON: () => ({})
    })
    ruler.setPointerCapture = vi.fn()
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperties(pointerDown, { clientX: { value: 308 }, pointerId: { value: 9 } })
    act(() => ruler.dispatchEvent(pointerDown))
    expect(props.onSeek).toHaveBeenLastCalledWith(4000)

    const repeatToggle = host.querySelector(
      '[data-track-id="high"] .avatar-animation-panel__clip-repeat-fold'
    ) as HTMLButtonElement
    act(() => repeatToggle.click())
    expect(host.querySelectorAll('[data-track-id="high"] .avatar-animation-panel__clip-keyframe'))
      .toHaveLength(7)
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip')?.getAttribute('style'))
      .toContain('width: 288px')
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip-repeat-fold')).toBeNull()
    expect([...host.querySelectorAll('.avatar-animation-panel__ruler > span')]
      .some(tick => tick.textContent === '4s')).toBe(true)
    const collapseToggle = host.querySelector('.avatar-animation-panel__ruler-fold') as HTMLButtonElement
    expect(collapseToggle.textContent).toBe('收起 ×4')

    act(() => collapseToggle.click())
    expect(host.querySelectorAll('[data-track-id="high"] .avatar-animation-panel__clip-keyframe'))
      .toHaveLength(2)
    expect(host.querySelector('[data-track-id="high"] .avatar-animation-panel__clip')?.getAttribute('style'))
      .toContain('width: 136px')
    expect(host.querySelector('.avatar-animation-panel__ruler-fold')?.textContent).toBe('×4')
  })

  it('keeps near-edge keyframes inside the clip instead of clipping their thumbnails', () => {
    renderPanel({
      ...createPanelProps(),
      resolveClipKeyframes: () => [
        { atMs: 0, easing: 'linear', keyframeIndex: 0, sourceDurationMs: 1000 },
        { atMs: 980, easing: 'ease-out', keyframeIndex: 1, sourceDurationMs: 1000 }
      ]
    })
    const lastNode = host.querySelector('button[aria-label="Edit keyframe 2 of Shocked"]') as HTMLButtonElement
    expect(lastNode.dataset.edge).toBe('end')
    expect(lastNode.style.left).toBe('100%')
  })

  it('selects square keyframe nodes and seeks to their timeline position', () => {
    const props = renderPanel(createPanelProps())
    const node = host.querySelector('button[aria-label="Edit keyframe 1 of Shocked"]') as HTMLButtonElement
    act(() => node.click())
    expect(props.onSelectClip).toHaveBeenCalledWith('high-clip')
    expect(props.onSelectKeyframe).toHaveBeenCalledWith({ instanceId: 'high-clip', keyframeIndex: 0 })
    expect(props.onSeek).toHaveBeenCalledWith(2000)
  })

  it('keeps clip and keyframe selection distinct on the timeline', () => {
    const keyframeProps = createPanelProps()
    renderPanel({
      ...keyframeProps,
      selectedClipId: 'high-clip',
      selectedKeyframe: { instanceId: 'high-clip', keyframeIndex: 0 }
    })
    expect(host.querySelector('.avatar-animation-panel__clip[data-keyframe-selected="true"]')).not.toBeNull()
    expect(host.querySelector('.avatar-animation-panel__clip[data-selected="true"]')).toBeNull()

    const selectedNode = host.querySelector('.avatar-animation-panel__clip-keyframe[aria-pressed="true"]') as HTMLElement
    act(() => selectedNode.click())
    expect(keyframeProps.onSelectKeyframe).toHaveBeenCalledWith(null)

    const clipBlock = host.querySelector('.avatar-animation-panel__clip[data-keyframe-selected="true"]') as HTMLElement
    act(() => clipBlock.click())
    expect(keyframeProps.onSelectClip).toHaveBeenCalledWith('high-clip')
    expect(keyframeProps.onSelectKeyframe).toHaveBeenCalledWith(null)
  })

  it('moves clips across tracks and reorders tracks through explicit drag payloads', () => {
    const props = renderPanel()
    const lane = host.querySelectorAll('.avatar-animation-panel__lane')[1] as HTMLElement
    vi.spyOn(lane, 'getBoundingClientRect').mockReturnValue({
      bottom: 44, height: 44, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0, toJSON: () => ({})
    })
    const drop = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(drop, 'clientX', { value: 96 })
    Object.defineProperty(drop, 'dataTransfer', { value: {
      getData: (type: string) => type.includes('clip') ? 'low-clip' : '',
      setData: vi.fn()
    } })
    act(() => lane.dispatchEvent(drop))
    expect(props.onMoveClip).toHaveBeenCalledWith('low-clip', 1000, 'middle')

    const headers = host.querySelectorAll('.avatar-animation-panel__track-header')
    const trackDrop = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(trackDrop, 'dataTransfer', { value: {
      getData: (type: string) => type.includes('track') ? 'low' : '', setData: vi.fn()
    } })
    act(() => headers[0]!.dispatchEvent(trackDrop))
    expect(props.onTrackReorder).toHaveBeenCalledWith('low', 'high')
  })

  it('moves a clip like a range slider while preserving the grabbed point', () => {
    const props = renderPanel()
    const lane = host.querySelector('.avatar-animation-panel__lane') as HTMLElement
    const clipBlock = lane.querySelector('.avatar-animation-panel__clip') as HTMLElement
    vi.spyOn(lane, 'getBoundingClientRect').mockReturnValue({
      bottom: 44, height: 44, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0, toJSON: () => ({})
    })
    vi.spyOn(clipBlock, 'getBoundingClientRect').mockReturnValue({
      bottom: 39, height: 34, left: 200, right: 296, top: 5, width: 96, x: 200, y: 5, toJSON: () => ({})
    })
    let capturedPointer: number | null = null
    clipBlock.setPointerCapture = vi.fn(pointerId => { capturedPointer = pointerId })
    clipBlock.hasPointerCapture = vi.fn(pointerId => capturedPointer === pointerId)
    clipBlock.releasePointerCapture = vi.fn(() => { capturedPointer = null })
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => lane) })
    const pointer = (type: string, clientX: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        button: { value: 0 }, clientX: { value: clientX }, clientY: { value: 20 }, pointerId: { value: 9 }
      })
      act(() => clipBlock.dispatchEvent(event))
    }
    pointer('pointerdown', 248)
    pointer('pointermove', 440)
    expect(clipBlock.style.left).toBe('392px')
    expect(host.querySelector('.avatar-animation-panel__drop-range')).toBeNull()
    pointer('pointerup', 440)
    expect(props.onMoveClip).toHaveBeenCalledWith('high-clip', 4083.333333333333, 'high')
  })

  it('moves a clip across tracks when the gesture starts on a visible keyframe', () => {
    const props = renderPanel()
    const lanes = host.querySelectorAll('.avatar-animation-panel__lane')
    const sourceLane = lanes[0] as HTMLElement
    const targetLane = lanes[1] as HTMLElement
    const clipBlock = sourceLane.querySelector('.avatar-animation-panel__clip') as HTMLElement
    const keyframe = clipBlock.querySelector('.avatar-animation-panel__clip-keyframe') as HTMLButtonElement
    vi.spyOn(sourceLane, 'getBoundingClientRect').mockReturnValue({
      bottom: 44, height: 44, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0, toJSON: () => ({})
    })
    vi.spyOn(targetLane, 'getBoundingClientRect').mockReturnValue({
      bottom: 88, height: 44, left: 0, right: 600, top: 44, width: 600, x: 0, y: 44, toJSON: () => ({})
    })
    vi.spyOn(clipBlock, 'getBoundingClientRect').mockReturnValue({
      bottom: 39, height: 34, left: 200, right: 296, top: 5, width: 96, x: 200, y: 5, toJSON: () => ({})
    })
    let capturedPointer: number | null = null
    clipBlock.setPointerCapture = vi.fn(pointerId => { capturedPointer = pointerId })
    clipBlock.hasPointerCapture = vi.fn(pointerId => capturedPointer === pointerId)
    clipBlock.releasePointerCapture = vi.fn(() => { capturedPointer = null })
    const pointer = (target: EventTarget, type: string, clientX: number, clientY: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        button: { value: 0 }, clientX: { value: clientX }, clientY: { value: clientY }, pointerId: { value: 11 }
      })
      act(() => target.dispatchEvent(event))
    }
    pointer(keyframe, 'pointerdown', 248, 20)
    pointer(window, 'pointermove', 344, 66)
    expect(targetLane.dataset.dropActive).toBe('true')
    pointer(window, 'pointerup', 344, 66)
    expect(props.onMoveClip).toHaveBeenCalledWith('high-clip', 3083.3333333333335, 'middle')

    act(() => keyframe.click())
    expect(props.onSelectKeyframe).not.toHaveBeenCalled()
    expect(props.onSeek).not.toHaveBeenCalled()
  })

  it('keeps a keyframe click targeted at the keyframe until the pointer actually moves', () => {
    const props = renderPanel()
    const clipBlock = host.querySelector('.avatar-animation-panel__clip') as HTMLElement
    const keyframe = clipBlock.querySelector('.avatar-animation-panel__clip-keyframe') as HTMLButtonElement
    clipBlock.setPointerCapture = vi.fn()
    clipBlock.hasPointerCapture = vi.fn(() => false)
    clipBlock.releasePointerCapture = vi.fn()
    const pointer = (type: string) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        button: { value: 0 }, clientX: { value: 24 }, clientY: { value: 20 }, pointerId: { value: 12 }
      })
      act(() => keyframe.dispatchEvent(event))
    }

    pointer('pointerdown')
    pointer('pointerup')
    act(() => keyframe.click())

    expect(clipBlock.setPointerCapture).not.toHaveBeenCalled()
    expect(props.onSelectKeyframe).toHaveBeenCalledWith({ instanceId: 'high-clip', keyframeIndex: 0 })
    expect(props.onSeek).toHaveBeenCalledWith(2000)
  })

  it('keeps range-slider clips from colliding and parks them at the nearest legal edge', () => {
    const track: AvatarAnimationTimeline['tracks'][number] = {
      clips: [clip('moving', 'blink', 0), clip('neighbor', 'nod', 2000)],
      trackId: 'track'
    }
    expect(constrainAnimationTimelineClipStart(track, 'moving', 1600, 1000)).toBe(1000)
    expect(constrainAnimationTimelineClipStart(track, 'moving', 4000, 1000)).toBe(1000)
    expect(constrainAnimationTimelineClipStart({
      clips: [clip('neighbor', 'nod', 1000), clip('moving', 'blink', 3000)],
      trackId: 'track'
    }, 'moving', 0, 1000)).toBe(2000)
  })

  it('constrains trim handles between adjacent clips like non-overlapping range sliders', () => {
    const moving = clip('moving', 'blink', 1000, { durationMs: 1000 })
    const track: AvatarAnimationTimeline['tracks'][number] = {
      clips: [clip('previous', 'nod', 0, { durationMs: 800 }), moving, clip('next', 'shocked', 2200)],
      trackId: 'track'
    }
    expect(constrainAnimationTimelineClipTrim(track, moving, 'start', 500)).toEqual({
      durationMs: 1200,
      startMs: 800,
      timeMs: 800
    })
    expect(constrainAnimationTimelineClipTrim(track, moving, 'end', 2600)).toEqual({
      durationMs: 1200,
      startMs: 1000,
      timeMs: 2200
    })
  })

  it('previews trim movement live, commits on release, and restores on Escape', () => {
    const props = renderPanel()
    const clipBlock = host.querySelector('.avatar-animation-panel__clip') as HTMLElement
    const trimEnd = clipBlock.querySelector('.avatar-animation-panel__trim--end') as HTMLButtonElement
    let capturedPointer: number | null = null
    trimEnd.setPointerCapture = vi.fn(pointerId => { capturedPointer = pointerId })
    trimEnd.hasPointerCapture = vi.fn(pointerId => capturedPointer === pointerId)
    trimEnd.releasePointerCapture = vi.fn(() => { capturedPointer = null })
    const pointer = (target: EventTarget, type: string, clientX: number, pointerId = 31) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        button: { value: 0 }, clientX: { value: clientX }, clientY: { value: 20 }, pointerId: { value: pointerId }
      })
      act(() => target.dispatchEvent(event))
    }

    pointer(trimEnd, 'pointerdown', 296)
    pointer(window, 'pointermove', 344)
    expect(clipBlock.dataset.trimming).toBe('true')
    expect(clipBlock.style.width).toBe('144px')
    expect(props.onTrimClip).not.toHaveBeenCalled()
    pointer(window, 'pointerup', 344)
    expect(props.onTrimClip).toHaveBeenCalledWith('high-clip', 'end', 3500)
    expect(clipBlock.dataset.trimming).toBeUndefined()

    props.onTrimClip.mockClear()
    pointer(trimEnd, 'pointerdown', 296, 32)
    pointer(window, 'pointermove', 248, 32)
    expect(clipBlock.style.width).toBe('48px')
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(clipBlock.style.width).toBe('96px')
    expect(props.onTrimClip).not.toHaveBeenCalled()
  })

  it('plans direct swaps at neighbor centers while preserving gaps for unequal clip durations', () => {
    const moveRight: AvatarAnimationTimeline['tracks'][number] = {
      clips: [
        clip('moving', 'blink', 0, { durationMs: 1500 }),
        clip('neighbor', 'nod', 2000, { durationMs: 500 })
      ],
      trackId: 'track'
    }
    expect(planAnimationTimelineClipSwap(moveRight, 'moving', 1700, 2300)).toEqual({
      movingStartMs: 1000,
      placements: [
        { instanceId: 'moving', startMs: 1000 },
        { instanceId: 'neighbor', startMs: 0 }
      ],
      swapped: true
    })

    const moveLeft: AvatarAnimationTimeline['tracks'][number] = {
      clips: [
        clip('neighbor', 'nod', 0, { durationMs: 500 }),
        clip('moving', 'blink', 1000, { durationMs: 1500 })
      ],
      trackId: 'track'
    }
    expect(planAnimationTimelineClipSwap(moveLeft, 'moving', 0, 0)).toEqual({
      movingStartMs: 0,
      placements: [
        { instanceId: 'neighbor', startMs: 2000 },
        { instanceId: 'moving', startMs: 0 }
      ],
      swapped: true
    })
  })

  it('swaps same-track clips live and commits the arrangement only when the pointer is released', () => {
    const props = createPanelProps()
    const value: AvatarAnimationTimeline = {
      durationMs: 6000,
      tracks: [{
        clips: [clip('moving', 'blink', 0), clip('neighbor', 'nod', 2000)],
        name: 'Track',
        trackId: 'track'
      }],
      version: 1
    }
    renderPanel({ ...props, timeline: value })
    const lane = host.querySelector('.avatar-animation-panel__lane') as HTMLElement
    const [moving, neighbor] = [...lane.querySelectorAll<HTMLElement>('.avatar-animation-panel__clip')]
    vi.spyOn(lane, 'getBoundingClientRect').mockReturnValue({
      bottom: 44, height: 44, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0, toJSON: () => ({})
    })
    vi.spyOn(moving!, 'getBoundingClientRect').mockReturnValue({
      bottom: 39, height: 34, left: 0, right: 96, top: 5, width: 96, x: 0, y: 5, toJSON: () => ({})
    })
    let capturedPointer: number | null = null
    moving!.setPointerCapture = vi.fn(pointerId => { capturedPointer = pointerId })
    moving!.hasPointerCapture = vi.fn(pointerId => capturedPointer === pointerId)
    moving!.releasePointerCapture = vi.fn(() => { capturedPointer = null })
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => lane) })
    const pointer = (target: EventTarget, type: string, clientX: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        button: { value: 0 }, clientX: { value: clientX }, clientY: { value: 20 }, pointerId: { value: 17 }
      })
      act(() => target.dispatchEvent(event))
    }

    pointer(moving!, 'pointerdown', 48)
    pointer(window, 'pointermove', 250)
    expect(moving!.style.left).toBe('192px')
    expect(neighbor!.style.left).toBe('0px')
    expect(neighbor!.dataset.swapMoving).toBe('true')
    expect(props.onArrangeClips).not.toHaveBeenCalled()

    pointer(window, 'pointerup', 250)
    expect(props.onArrangeClips).toHaveBeenCalledWith('track', [
      { instanceId: 'moving', startMs: 2000 },
      { instanceId: 'neighbor', startMs: 0 }
    ])
    expect(props.onMoveClip).not.toHaveBeenCalled()
  })

  it('restores the original arrangement when a live swap is cancelled with Escape', () => {
    const props = createPanelProps()
    const value: AvatarAnimationTimeline = {
      durationMs: 6000,
      tracks: [{ clips: [clip('moving', 'blink', 0), clip('neighbor', 'nod', 2000)], trackId: 'track' }],
      version: 1
    }
    renderPanel({ ...props, timeline: value })
    const lane = host.querySelector('.avatar-animation-panel__lane') as HTMLElement
    const [moving, neighbor] = [...lane.querySelectorAll<HTMLElement>('.avatar-animation-panel__clip')]
    vi.spyOn(lane, 'getBoundingClientRect').mockReturnValue({
      bottom: 44, height: 44, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0, toJSON: () => ({})
    })
    vi.spyOn(moving!, 'getBoundingClientRect').mockReturnValue({
      bottom: 39, height: 34, left: 0, right: 96, top: 5, width: 96, x: 0, y: 5, toJSON: () => ({})
    })
    moving!.setPointerCapture = vi.fn()
    moving!.hasPointerCapture = vi.fn(() => false)
    moving!.releasePointerCapture = vi.fn()
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => lane) })
    const dispatchPointer = (target: EventTarget, type: string, clientX: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        button: { value: 0 }, clientX: { value: clientX }, clientY: { value: 20 }, pointerId: { value: 18 }
      })
      act(() => target.dispatchEvent(event))
    }
    dispatchPointer(moving!, 'pointerdown', 48)
    dispatchPointer(window, 'pointermove', 250)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))

    expect(moving!.style.left).toBe('0px')
    expect(neighbor!.style.left).toBe('192px')
    expect(props.onArrangeClips).not.toHaveBeenCalled()
    expect(props.onMoveClip).not.toHaveBeenCalled()
  })

  it('previews the drop lane and exact insertion time while dragging', () => {
    renderPanel()
    const lane = host.querySelectorAll('.avatar-animation-panel__lane')[1] as HTMLElement
    vi.spyOn(lane, 'getBoundingClientRect').mockReturnValue({
      bottom: 44, height: 44, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0, toJSON: () => ({})
    })
    const transfer = { dropEffect: 'none', getData: vi.fn(() => ''), setData: vi.fn(), types: [
      'application/x-oneworks-avatar-animation-clip'
    ] }
    const dragOver = new Event('dragover', { bubbles: true, cancelable: true })
    Object.defineProperties(dragOver, {
      clientX: { value: 144 },
      dataTransfer: { value: transfer }
    })
    act(() => lane.dispatchEvent(dragOver))
    expect(lane.dataset.dropActive).toBe('true')
    expect(transfer.dropEffect).toBe('move')
    expect(host.querySelector('.avatar-animation-panel__drop-marker')?.textContent).toBe('0:01.50')
  })

  it('renders unavailable clips as persistent placeholders rather than dropping their blocks', () => {
    const incompatible = clip('missing', 'removed-preset', 3000, {
      source: { fallback: 'skip', presetId: 'removed-preset', presetVersion: 9, type: 'preset' }
    })
    const value: AvatarAnimationTimeline = {
      ...timeline,
      tracks: [...timeline.tracks, { clips: [incompatible], name: 'Unavailable', trackId: 'placeholder' }]
    }
    renderPanel({ ...createPanelProps(), timeline: value, unresolvedClipIds: ['missing'] })
    const placeholder = host.querySelector('.avatar-animation-panel__clip[data-unavailable="true"]')
    expect(placeholder?.getAttribute('title')).toContain('removed-preset')
    expect(JSON.parse(JSON.stringify(value)).tracks[3].clips[0].source.presetVersion).toBe(9)
  })
})

describe('Animation sidebar', () => {
  const createSidebarProps = (): ComponentProps<typeof AnimationSidebar> => ({
    animationPresets: AVATAR_ANIMATION_PRESETS,
    onDeleteClip: vi.fn(),
    onDeleteKeyframe: vi.fn(),
    onOpenCustomEditor: vi.fn(),
    onReplaceClip: vi.fn(),
    onSelectClip: vi.fn(),
    onSelectPreset: vi.fn(),
    onSetClipDuration: vi.fn(),
    onUpdateClip: vi.fn(),
    onUpdateKeyframeEasing: vi.fn(),
    onUpdateKeyframeTime: vi.fn(),
    renderPresetPreview: preset => createElement('img', { alt: '', 'data-preset': preset.id }),
    resolveClipKeyframes: () => [
      { atMs: 0, easing: 'linear', keyframeIndex: 0, sourceDurationMs: 1000 },
      { atMs: 1000, easing: 'ease-out', keyframeIndex: 1, sourceDurationMs: 1000 }
    ],
    selectedClipId: null,
    selectedKeyframe: null,
    selectedPresetId: null,
    timeline,
    unresolvedClipIds: []
  })

  it('keeps library thumbnails static and separates selection from adding at the playhead', () => {
    const renderPresetPreview = vi.fn((preset: typeof AVATAR_ANIMATION_PRESETS[number]) => (
      createElement('img', { alt: '', 'data-preset': preset.id })
    ))
    const props = { ...createSidebarProps(), renderPresetPreview }
    act(() => root.render(createElement(AnimationSidebar, props)))
    const blink = host.querySelector('button[aria-label="Blink"]') as HTMLButtonElement
    act(() => blink.click())
    expect(props.onSelectPreset).toHaveBeenCalledWith('blink')
    act(() => root.render(createElement(AnimationSidebar, { ...props, selectedPresetId: 'blink' })))
    expect(host.querySelector('.avatar-animation-sidebar__add-selected')).toBeNull()
    expect(host.querySelector('.avatar-animation-sidebar__hint')).toBeNull()
    expect(host.querySelectorAll('.avatar-animation-sidebar__asset img')).toHaveLength(AVATAR_ANIMATION_PRESETS.length)
    expect(renderPresetPreview).toHaveBeenCalledTimes(AVATAR_ANIMATION_PRESETS.length * 2)
    expect(renderPresetPreview.mock.calls.every(call => call.length === 1)).toBe(true)
    expect(host.querySelector('.avatar-animation-sidebar__heading')).toBeNull()
    expect(host.querySelectorAll('article.avatar-animation-sidebar__asset')).toHaveLength(0)
  })

  it('shows clip-instance parameters and repair actions for version-incompatible sources', () => {
    const notification = AVATAR_ANIMATION_PRESETS.find(preset => preset.id === 'bear-notification-morph')!
    const incompatible = clip('notice', notification.id, 0, {
      parameterValues: { orbColor: '#3b82f6' },
      source: { fallback: 'skip', presetId: notification.id, presetVersion: 9, type: 'preset' }
    })
    const value: AvatarAnimationTimeline = {
      durationMs: 6000,
      tracks: [{ clips: [incompatible], name: 'Notice', trackId: 'notice-track' }],
      version: 1
    }
    const props = { ...createSidebarProps(), selectedClipId: 'notice', timeline: value, unresolvedClipIds: ['notice'] }
    act(() => root.render(createElement(AnimationSidebar, props)))
    expect(host.textContent).toContain('版本不兼容')
    expect(host.textContent).toContain(notification.id)
    expect(host.querySelector('input[type="color"]')).not.toBeNull()
    const position = host.querySelector('select[aria-label="圆球位置"]') as HTMLSelectElement
    expect(position.value).toBe('upper-right')
    expect([...position.options].map(option => [option.value, option.textContent])).toEqual([
      ['upper-left', '左上'],
      ['upper-right', '右上']
    ])
    act(() => {
      position.value = 'upper-left'
      position.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onUpdateClip).toHaveBeenCalledWith('notice', {
      parameterValues: { orbColor: '#3b82f6', orbPosition: 'upper-left' }
    })
    expect(host.textContent).toContain('修复不可用动画')
    expect(host.querySelector('select[aria-label="选择替换动画"]')).not.toBeNull()
    expect(host.textContent).toContain('删除片段')
  })

  it('keeps replacement repair controls out of available clip inspectors', () => {
    const props = { ...createSidebarProps(), selectedClipId: 'low-clip' }
    act(() => root.render(createElement(AnimationSidebar, props)))
    expect(host.querySelector('select[aria-label="选择替换动画"]')).toBeNull()
    expect(host.textContent).not.toContain('修复不可用动画')
    expect(host.textContent).toContain('删除片段')
  })

  it('edits the selected keyframe easing instead of treating it as clip playback speed', () => {
    const props = {
      ...createSidebarProps(),
      selectedClipId: 'low-clip',
      selectedKeyframe: { instanceId: 'low-clip', keyframeIndex: 1 }
    }
    act(() => root.render(createElement(AnimationSidebar, props)))
    const easing = host.querySelector('[role="group"][aria-label="关键节点缓动类型"]') as HTMLElement
    expect(easing.querySelector('button[aria-label="缓出"]')?.getAttribute('aria-pressed')).toBe('true')
    expect([...easing.querySelectorAll('button')].map(button => button.getAttribute('aria-label')))
      .toEqual(['线性', '缓入', '缓出', '缓入缓出'])
    act(() => (easing.querySelector('button[aria-label="缓入缓出"]') as HTMLButtonElement).click())
    expect(props.onUpdateKeyframeEasing).toHaveBeenCalledWith('low-clip', 1, 'ease-in-out')
  })

  it('shows different forms for whole-clip and single-keyframe selection', () => {
    const props = createSidebarProps()
    act(() => root.render(createElement(AnimationSidebar, {
      ...props,
      selectedClipId: 'low-clip',
      selectedKeyframe: { instanceId: 'low-clip', keyframeIndex: 0 }
    })))
    expect(host.querySelector('.avatar-animation-sidebar__heading')?.textContent).toContain('Keyframe Inspector')
    expect(host.querySelector('.avatar-animation-sidebar__keyframe-field')).not.toBeNull()
    expect(host.querySelector('input[min=".1"]')).toBeNull()
    expect(host.textContent).toContain('删除关键帧')
    expect(host.textContent).not.toContain('删除片段')
    act(() => ([...host.querySelectorAll('button')].find(button => button.textContent === '删除关键帧') as HTMLButtonElement).click())
    expect(props.onDeleteKeyframe).toHaveBeenCalledWith('low-clip', 0)

    act(() => root.render(createElement(AnimationSidebar, {
      ...props,
      selectedClipId: 'low-clip',
      selectedKeyframe: null
    })))
    expect(host.querySelector('.avatar-animation-sidebar__heading')?.textContent).toContain('Clip Inspector')
    expect(host.querySelector('.avatar-animation-sidebar__keyframe-field')).toBeNull()
    expect(host.querySelector('input[min=".1"]')).not.toBeNull()
    expect(host.textContent).toContain('删除片段')
  })

  it('configures frame in/out points and a finite or infinite ping-pong loop on the clip instance', () => {
    const sequenceClip = clip('sequence', 'blink', 0, {
      frameSequence: {
        firstFrameIndex: 1,
        lastFrameIndex: 4,
        loop: { endFrameIndex: 3, iterations: 3, startFrameIndex: 2 }
      }
    })
    const value: AvatarAnimationTimeline = {
      durationMs: 6000,
      tracks: [{ clips: [sequenceClip], name: 'Sequence', trackId: 'sequence-track' }],
      version: 1
    }
    const props = {
      ...createSidebarProps(),
      resolveClipKeyframes: () => Array.from({ length: 6 }, (_, keyframeIndex) => ({
        atMs: keyframeIndex * 100,
        easing: 'linear' as const,
        keyframeIndex,
        sourceDurationMs: 500,
        sourceFrameCount: 6
      })),
      selectedClipId: 'sequence',
      timeline: value
    }
    act(() => root.render(createElement(AnimationSidebar, props)))

    expect((host.querySelector('select[aria-label="序列起始帧"]') as HTMLSelectElement).value).toBe('1')
    expect((host.querySelector('select[aria-label="序列结束帧"]') as HTMLSelectElement).value).toBe('4')
    expect((host.querySelector('select[aria-label="循环起始帧"]') as HTMLSelectElement).value).toBe('2')
    expect((host.querySelector('select[aria-label="循环结束帧"]') as HTMLSelectElement).value).toBe('3')
    const iterations = host.querySelector('select[aria-label="循环遍数"]') as HTMLSelectElement
    expect(iterations.value).toBe('3')
    act(() => {
      iterations.value = 'infinite'
      iterations.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onUpdateClip).toHaveBeenCalledWith('sequence', {
      frameSequence: {
        firstFrameIndex: 1,
        lastFrameIndex: 4,
        loop: { endFrameIndex: 3, iterations: 'infinite', startFrameIndex: 2 }
      },
      sourceOffsetMs: 0
    })
  })

  it('lets a loop range be chosen before a loop count and enables two passes', () => {
    const props = {
      ...createSidebarProps(),
      resolveClipKeyframes: () => Array.from({ length: 6 }, (_, keyframeIndex) => ({
        atMs: keyframeIndex * 100,
        easing: 'linear' as const,
        keyframeIndex,
        sourceDurationMs: 500,
        sourceFrameCount: 6
      })),
      selectedClipId: 'low-clip'
    }
    act(() => root.render(createElement(AnimationSidebar, props)))

    expect(host.querySelector('select[aria-label="循环起始帧"]')).toBeNull()
    expect(host.querySelector('select[aria-label="循环结束帧"]')).toBeNull()
    const iterations = host.querySelector('select[aria-label="循环遍数"]') as HTMLSelectElement
    expect(iterations.value).toBe('1')

    act(() => {
      iterations.value = '2'
      iterations.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onUpdateClip).toHaveBeenCalledWith('low-clip', {
      frameSequence: {
        firstFrameIndex: 0,
        lastFrameIndex: 5,
        loop: { endFrameIndex: 1, iterations: 2, startFrameIndex: 0 }
      },
      sourceOffsetMs: 0
    })
  })

  it('shows and overrides whole-clip playback independently from the local ping-pong range', () => {
    const offsetTimeline: AvatarAnimationTimeline = {
      ...timeline,
      tracks: timeline.tracks.map(track => track.trackId === 'low'
        ? { ...track, clips: track.clips.map(value => ({ ...value, playback: 'loop', sourceOffsetMs: 375 })) }
        : track)
    }
    const props = { ...createSidebarProps(), selectedClipId: 'low-clip', timeline: offsetTimeline }
    act(() => root.render(createElement(AnimationSidebar, props)))

    const playback = host.querySelector('select[aria-label="整段播放"]') as HTMLSelectElement
    expect(playback.value).toBe('loop')
    expect(host.textContent).toContain('局部往返')
    expect(host.querySelector('select[aria-label="循环起始帧"]')).toBeNull()

    act(() => {
      playback.value = 'once'
      playback.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onUpdateClip).toHaveBeenCalledWith('low-clip', {
      playback: 'once'
    })
    expect(offsetTimeline.tracks[0].clips[0].sourceOffsetMs).toBe(375)
  })

  it('shows the effective whole-loop count and resizes the clip without changing its source offset', () => {
    const loopTimeline: AvatarAnimationTimeline = {
      ...timeline,
      tracks: timeline.tracks.map(track => track.trackId === 'low'
        ? { ...track, clips: track.clips.map(value => ({
            ...value,
            durationMs: 2625,
            playback: 'loop',
            sourceOffsetMs: 375
          })) }
        : track)
    }
    const props = {
      ...createSidebarProps(),
      resolveClipKeyframes: () => [
        { atMs: 0, easing: 'linear' as const, keyframeIndex: 0, sourceDurationMs: 1000 },
        { atMs: 900, easing: 'ease-out' as const, keyframeIndex: 1, sourceDurationMs: 1000 }
      ],
      selectedClipId: 'low-clip',
      timeline: loopTimeline
    }
    act(() => root.render(createElement(AnimationSidebar, props)))

    const iterations = host.querySelector('input[aria-label="循环次数"]') as HTMLInputElement
    expect(iterations.value).toBe('3')
    expect(iterations.max).toBe('20')

    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(iterations, '5')
      iterations.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(props.onSetClipDuration).toHaveBeenCalledWith('low-clip', 4625)
    expect(loopTimeline.tracks[0].clips[0].sourceOffsetMs).toBe(375)
  })
})
