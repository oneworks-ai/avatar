// @vitest-environment jsdom

import { act, createElement, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    InteractiveAvatar: ({ onViewStateChange, viewState }: {
      onViewStateChange: (view: ReturnType<typeof createDefaultAvatarDefinition>['scene']['view']) => void
      viewState: ReturnType<typeof createDefaultAvatarDefinition>['scene']['view']
    }) =>
      createElement('button', {
        'data-testid': 'view-change',
        onClick: () => onViewStateChange({ ...viewState, yaw: .9 })
      }, 'Change view')
  }
})

import { createDefaultAvatarDefinition } from '@oneworks/avatar-core'
import type { AvatarAnimationClip } from '@oneworks/avatar-core'

import { AvatarLocaleProvider, useAvatarLocale } from '../../../src/avatarLocale'
import { Avatar, AvatarEditor } from '../src'
import type { AvatarEditorHandle, AvatarHandle } from '../src'

let root: Root | null = null
let host: HTMLDivElement | null = null
let animationFrames: Map<number, FrameRequestCallback>
let nextAnimationFrame: number

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  animationFrames = new Map()
  nextAnimationFrame = 0
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
        { atMs: 1000, patch: { view: { yaw: .4 } } }
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

  it('does not restart autoplay after an interactive view change', () => {
    const definition = createDefaultAvatarDefinition()
    const clip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { view: { yaw: 0 } } },
        { atMs: 1000, patch: { view: { yaw: .4 } } }
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
