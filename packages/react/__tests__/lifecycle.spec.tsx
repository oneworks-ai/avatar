// @vitest-environment jsdom

import { act, createElement, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { interactiveAvatarRenderSpy } = vi.hoisted(() => ({ interactiveAvatarRenderSpy: vi.fn() }))

vi.mock('../../../src/App', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ definition, onDefinitionChange }: {
      definition: ReturnType<typeof createDefaultAvatarDefinition>
      onDefinitionChange: (definition: ReturnType<typeof createDefaultAvatarDefinition>) => void
    }) =>
      createElement('button', {
        'data-testid': 'editor-change',
        onClick: () => onDefinitionChange({ ...definition, metadata: { id: 'edited' } })
      }, 'Edit')
  }
})

vi.mock('../../../src/InteractiveAvatar', async () => {
  const { createElement } = await import('react')
  return {
    InteractiveAvatar: ({ auxiliaryParts, auxiliaryShapes, onViewStateChange, partShapeMorphs, partTransforms, viewState }: {
      auxiliaryParts?: readonly Readonly<Record<string, unknown>>[]
      auxiliaryShapes?: readonly Readonly<Record<string, unknown>>[]
      onViewStateChange: (view: ReturnType<typeof createDefaultAvatarDefinition>['scene']['view']) => void
      partShapeMorphs?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
      partTransforms?: Readonly<Record<string, Readonly<Record<string, number>>>>
      viewState: ReturnType<typeof createDefaultAvatarDefinition>['scene']['view']
    }) => {
      interactiveAvatarRenderSpy()
      return createElement('button', {
        'data-auxiliary-parts': auxiliaryParts == null ? undefined : JSON.stringify(auxiliaryParts),
        'data-auxiliary-shapes': auxiliaryShapes == null ? undefined : JSON.stringify(auxiliaryShapes),
        'data-part-shape-morphs': partShapeMorphs == null ? undefined : JSON.stringify(partShapeMorphs),
        'data-part-transforms': partTransforms == null ? undefined : JSON.stringify(partTransforms),
        'data-primary-x': partTransforms?.primary?.x,
        'data-testid': 'view-change',
        'data-view-yaw': viewState.yaw,
        onClick: () => onViewStateChange({ ...viewState, yaw: .9 })
      }, 'Change view')
    }
  }
})

import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import type { AvatarAnimationClip, AvatarAnimationTimeline } from '@oneworks/avatar'

import { AvatarLocaleProvider, useAvatarLocale } from '../../../src/avatarLocale'
import { createAvatarEntityParts } from '../../../src/avatarEntityPresets'
import { Avatar, AvatarAnimationPicker, AvatarEditor, AvatarPresetPicker } from '../src'
import type { AvatarEditorHandle, AvatarHandle } from '../src'

let root: Root | null = null
let host: HTMLDivElement | null = null
let animationFrames: Map<number, FrameRequestCallback>
let nextAnimationFrame: number

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  animationFrames = new Map()
  nextAnimationFrame = 0
  interactiveAvatarRenderSpy.mockClear()
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      nextAnimationFrame += 1
      animationFrames.set(nextAnimationFrame, callback)
      return nextAnimationFrame
    })
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => {
      animationFrames.delete(id)
    })
  )
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn()
    }))
  )
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  if (root != null) act(() => root?.unmount())
  host?.remove()
  root = null
  host = null
  vi.unstubAllGlobals()
})

describe('OneWorks Avatar React lifecycle', () => {
  it('exposes a searchable animation picker with selection and drag hooks', () => {
    const onChange = vi.fn()
    const onOptionDragStart = vi.fn()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [],
      playback: 'loop'
    }
    act(() => root?.render(createElement(AvatarAnimationPicker, {
      draggable: true,
      onChange,
      onOptionDragStart,
      options: [
        { animation: clip, id: 'idle', keywords: ['calm'], label: 'Idle', previewUrl: '/idle.png' },
        { animation: clip, id: 'wave', keywords: ['hello'], label: 'Wave', previewUrl: '/wave.png' }
      ],
      value: 'wave'
    })))

    expect(host?.querySelector('[aria-label="Wave"]')?.getAttribute('aria-selected')).toBe('true')
    act(() => {
      const search = host?.querySelector<HTMLInputElement>('input[type="search"]')
      if (search == null) throw new Error('Animation search was not rendered')
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setValue?.call(search, 'calm')
      search.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(host?.querySelector('[aria-label="Idle"]')).not.toBeNull()
    expect(host?.querySelector('[aria-label="Wave"]')).toBeNull()

    const idle = host?.querySelector<HTMLButtonElement>('[aria-label="Idle"]')
    act(() => idle?.click())
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'idle' }))
    act(() => idle?.dispatchEvent(new Event('dragstart', { bubbles: true })))
    expect(onOptionDragStart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'idle' }),
      expect.objectContaining({ type: 'dragstart' })
    )
  })

  it('exposes an avatar preset picker that returns the selected definition', () => {
    const definition = createDefaultAvatarDefinition()
    const onChange = vi.fn()
    act(() => root?.render(createElement(AvatarPresetPicker, {
      onChange,
      options: [{ definition, id: 'dog', label: 'Dog', previewUrl: '/dog.png' }],
      value: 'dog'
    })))

    const dog = host?.querySelector<HTMLButtonElement>('[aria-label="Dog"]')
    expect(dog?.getAttribute('aria-selected')).toBe('true')
    act(() => dog?.click())
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ definition, id: 'dog' }))
  })

  it('renders with the system theme when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    const definition = createDefaultAvatarDefinition()

    expect(() => {
      act(() => root?.render(createElement(Avatar, { definition, theme: 'system' })))
    }).not.toThrow()
    expect(host?.querySelector('[data-theme="light"]')).not.toBeNull()
  })

  it('returns a newly controlled editor definition after an earlier edit', () => {
    const first = createDefaultAvatarDefinition()
    const second = { ...first, metadata: { id: 'second' } }
    const ref = createRef<AvatarEditorHandle>()
    act(() => root?.render(createElement(AvatarEditor, { definition: first, ref })))
    act(() => host?.querySelector<HTMLButtonElement>('[data-testid="editor-change"]')?.click())
    expect(ref.current?.getDefinition().metadata?.id).toBe('edited')

    act(() => root?.render(createElement(AvatarEditor, { definition: second, ref })))
    expect(ref.current?.getDefinition()).toEqual(second)
  })

  it('stops active playback before committing an interactive view change', async () => {
    const definition = createDefaultAvatarDefinition()
    const ref = createRef<AvatarHandle>()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { view: { yaw: 0 } } },
        { atMs: 900, patch: { view: { yaw: .4 } } }
      ],
      playback: 'loop'
    }
    act(() => root?.render(createElement(Avatar, { definition, interactive: true, ref })))
    await act(async () => ref.current?.play(clip))
    expect(animationFrames.size).toBe(1)

    act(() => host?.querySelector<HTMLButtonElement>('[data-testid="view-change"]')?.click())
    expect(animationFrames.size).toBe(0)
    expect(ref.current?.getDefinition().scene.view.yaw).toBe(.9)
  })

  it('renders one representative semantic morph frame when reduced motion is requested', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        matches: query === '(prefers-reduced-motion: reduce)',
        removeEventListener: vi.fn()
      }))
    )
    const baseDefinition = createDefaultAvatarDefinition()
    const definition = {
      ...baseDefinition,
      scene: {
        ...baseDefinition.scene,
        entity: { parts: createAvatarEntityParts('bear'), preset: 'bear' as const }
      }
    }
    const partId = definition.scene.entity.parts[0]!.id
    const alertStemPart = {
      ...definition.scene.entity.parts[0]!,
      face: false,
      id: 'alert-stem',
      label: 'Alert stem',
      scaleX: .11,
      scaleY: .32,
      scaleZ: .15,
      shape: 'teardrop' as const,
      x: 0,
      y: -30,
      z: 0
    }
    const ref = createRef<AvatarHandle>()
    const onAnimationEnd = vi.fn()
    const onAnimationStart = vi.fn()
    act(() => root?.render(createElement(Avatar, {
      definition,
      onAnimationEnd,
      onAnimationStart,
      ref
    })))

    await act(async () => ref.current?.play({
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        {
          atMs: 0,
          patch: {
            auxiliaryParts: [{
              opacity: 0,
              part: alertStemPart,
              transform: { rotationZ: -10, scaleX: .01, scaleY: .01, x: 0, y: 0, z: 0 }
            }],
            partShapeMorphs: {
              'alert-stem': { fromShape: 'sphere', progress: 0, toShape: 'teardrop' }
            },
            partTransforms: { [partId]: { x: 0 } }
          }
        },
        {
          atMs: 900,
          patch: {
            auxiliaryParts: [{
              opacity: 100,
              part: alertStemPart,
              transform: { rotationZ: 0, scaleX: .11, scaleY: .32, x: 0, y: -30, z: 0 }
            }],
            partShapeMorphs: {
              'alert-stem': { fromShape: 'sphere', progress: 1, toShape: 'teardrop' }
            },
            partTransforms: { [partId]: { x: 90 } }
          }
        }
      ],
      playback: 'loop'
    }))

    expect(animationFrames.size).toBe(0)
    const renderedTransforms = JSON.parse(
      host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-part-transforms') ?? '{}'
    ) as Record<string, { readonly x?: number }>
    expect(renderedTransforms[partId]?.x).toBe(50)
    const renderedParts = JSON.parse(
      host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-auxiliary-parts') ?? '[]'
    ) as readonly { readonly id: string, readonly opacity: number }[]
    expect(renderedParts).toHaveLength(1)
    expect((renderedParts[0] as { readonly part?: { readonly id?: string } })?.part?.id).toBe('alert-stem')
    expect(renderedParts[0]?.opacity).toBeCloseTo(55.56, 2)
    const renderedMorphs = JSON.parse(
      host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-part-shape-morphs') ?? '{}'
    ) as Record<string, { readonly progress?: number }>
    expect(renderedMorphs['alert-stem']?.progress).toBeCloseTo(.5556, 3)
    expect(onAnimationStart).toHaveBeenCalledTimes(1)
    expect(onAnimationEnd).toHaveBeenCalledTimes(1)
    expect(ref.current?.getDefinition()).toEqual(definition)

    act(() => ref.current?.stop())
    expect(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-auxiliary-parts')).toBeNull()
    expect(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-auxiliary-shapes')).toBeNull()
    expect(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-part-shape-morphs')).toBeNull()
    expect(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-part-transforms')).toBeNull()
  })

  it('renders the configured timeline frame and resolves preset-backed clips', () => {
    const definition = createDefaultAvatarDefinition()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { view: { yaw: 0 } } },
        { atMs: 1000, easing: 'linear', patch: { view: { yaw: 1 } } }
      ],
      playback: 'once'
    }
    const timeline: AvatarAnimationTimeline = {
      durationMs: 1000,
      tracks: [{
        clips: [{
          durationMs: 1000,
          instanceId: 'entrance-1',
          playbackRate: 1,
          source: {
            fallback: 'skip',
            presetId: 'entrance',
            presetVersion: 1,
            type: 'preset'
          },
          sourceOffsetMs: 0,
          startMs: 0,
          weight: 1
        }],
        trackId: 'motion'
      }],
      version: 1
    }
    const resolveTimelinePreset = vi.fn(() => clip)

    act(() => root?.render(createElement(Avatar, {
      definition,
      resolveTimelinePreset,
      timeline,
      timelineTimeMs: 500
    })))

    expect(resolveTimelinePreset).toHaveBeenCalled()
    expect(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-view-yaw')).toBe('0.5')
    expect(animationFrames.size).toBe(0)
  })

  it('controls a configured timeline through the public handle', () => {
    const definition = createDefaultAvatarDefinition()
    const timeline: AvatarAnimationTimeline = {
      durationMs: 1000,
      tracks: [{
        clips: [{
          durationMs: 1000,
          instanceId: 'move-1',
          playbackRate: 1,
          source: {
            clip: {
              anchor: 'absolute',
              durationMs: 1000,
              keyframes: [
                { atMs: 0, patch: { view: { yaw: 0 } } },
                { atMs: 1000, easing: 'linear', patch: { view: { yaw: .8 } } }
              ],
              playback: 'once'
            },
            type: 'inline',
            version: 1
          },
          sourceOffsetMs: 0,
          startMs: 0,
          weight: 1
        }],
        trackId: 'motion'
      }],
      version: 1
    }
    const ref = createRef<AvatarHandle>()
    act(() => root?.render(createElement(Avatar, { definition, ref })))

    act(() => ref.current?.setTimeline(timeline, { playing: false, timeMs: 250 }))
    expect(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-view-yaw')).toBe('0.2')
    act(() => ref.current?.seek(750))
    expect(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-view-yaw')).toBe('0.6000000000000001')
    act(() => ref.current?.resume())
    expect(animationFrames.size).toBe(1)
    act(() => ref.current?.pause())
    expect(animationFrames.size).toBe(0)
    act(() => ref.current?.stop())
    expect(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-view-yaw')).toBe('0')
  })

  it('does not restart autoplay after an interactive view change', () => {
    const definition = createDefaultAvatarDefinition()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { view: { yaw: 0 } } },
        { atMs: 900, patch: { view: { yaw: .4 } } }
      ],
      playback: 'loop'
    }
    act(() =>
      root?.render(createElement(Avatar, {
        animation: clip,
        autoplay: true,
        definition,
        interactive: true
      }))
    )
    expect(animationFrames.size).toBe(1)

    act(() => host?.querySelector<HTMLButtonElement>('[data-testid="view-change"]')?.click())
    expect(animationFrames.size).toBe(0)
  })

  it('evaluates 1, 4, 8, and 16 ordered tracks through one rAF and one renderer commit', async () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const definition = createDefaultAvatarDefinition()
    const ref = createRef<AvatarHandle>()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { view: { yaw: 0 } } },
        { atMs: 900, easing: 'linear', patch: { view: { yaw: .9 } } }
      ],
      parameters: [{ default: 1, id: 'intensity', label: 'Intensity', max: 2, min: 0, type: 'number' }],
      playback: 'loop',
      resourceClaims: ['view:yaw']
    }
    act(() => root?.render(createElement(Avatar, { definition, ref })))

    for (const count of [1, 4, 8, 16]) {
      const rendersBefore = interactiveAvatarRenderSpy.mock.calls.length
      await act(async () => ref.current?.setTracks(Array.from({ length: count }, (_, index) => ({
        animation: clip,
        trackId: `track-${index}`
      }))))
      expect(animationFrames.size).toBe(1)
      expect(interactiveAvatarRenderSpy.mock.calls.length - rendersBefore).toBe(1)
    }

    const flushFrame = (time: number) => {
      const [id, callback] = [...animationFrames.entries()][0]!
      animationFrames.delete(id)
      act(() => callback(time))
    }
    now = 500
    const rendersBeforeTick = interactiveAvatarRenderSpy.mock.calls.length
    flushFrame(now)
    expect(animationFrames.size).toBe(1)
    expect(interactiveAvatarRenderSpy.mock.calls.length - rendersBeforeTick).toBe(1)
    expect(Number(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-view-yaw'))).toBeCloseTo(.5)

    const current = Array.from({ length: 16 }, (_, index) => ({
      animation: clip,
      trackId: `track-${index}`
    })).reverse()
    const pendingFrameId = [...animationFrames.keys()][0]
    await act(async () => ref.current?.setTracks(current))
    expect([...animationFrames.keys()]).toEqual([pendingFrameId])
    now = 700
    flushFrame(now)
    expect(Number(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-view-yaw'))).toBeCloseTo(.7)

    const frameBeforeParameterUpdate = [...animationFrames.keys()][0]
    await act(async () => ref.current?.setTracks(current.map((track, index) => ({
      ...track,
      ...(index === 0 ? { parameterValues: { intensity: 1.5 } } : {}),
      ...(index === 1 ? { muted: true } : {})
    }))))
    expect([...animationFrames.keys()]).toEqual([frameBeforeParameterUpdate])
    now = 800
    flushFrame(now)
    expect(Number(host?.querySelector('[data-testid="view-change"]')?.getAttribute('data-view-yaw'))).toBeCloseTo(.8)

    act(() => ref.current?.stop({ trackId: 'track-8' }))
    expect(animationFrames.size).toBe(1)
    act(() => ref.current?.stop())
    expect(animationFrames.size).toBe(0)
  })

  it('reacts to locale prop changes', () => {
    const LocaleProbe = () => {
      const { t } = useAvatarLocale()
      return createElement('span', null, t('Size'))
    }
    act(() =>
      root?.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(LocaleProbe)
      ))
    )
    expect(host?.textContent).toBe('Size')

    act(() =>
      root?.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'zh-Hans', persist: false },
        createElement(LocaleProbe)
      ))
    )
    expect(host?.textContent).toBe('尺寸')
  })
})
