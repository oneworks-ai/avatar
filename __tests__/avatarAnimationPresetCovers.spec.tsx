// @vitest-environment jsdom

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { captureAvatarScreenshot } = vi.hoisted(() => ({
  captureAvatarScreenshot: vi.fn()
}))

vi.mock('../src/savedAvatarPresets', async () => ({
  ...await vi.importActual<typeof import('../src/savedAvatarPresets')>('../src/savedAvatarPresets'),
  captureAvatarScreenshot
}))

import App from '../src/App'
import {
  AVATAR_ANIMATION_PRESET_COVER_PROGRESS,
  AVATAR_ANIMATION_PRESETS
} from '../src/avatarAnimations'
import {
  AVATAR_ANIMATION_PRESET_COVER_MANIFEST,
  getAvatarAnimationPresetCoverUrl,
  getAvatarAnimationPresetTimelineFrameUrl
} from '../src/avatarAnimationPresetCovers'
import { AvatarLocaleProvider } from '../src/avatarLocale'

let host: HTMLDivElement
let root: Root

const flushEffects = () => act(async () => {
  await new Promise(resolve => window.setTimeout(resolve, 0))
})

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  captureAvatarScreenshot.mockReset()
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    addEventListener: vi.fn(),
    matches: false,
    removeEventListener: vi.fn()
  }))
  window.localStorage.clear()
  window.history.replaceState(null, '', '/?seed=v1-animation-covers&entity=bear&animationPanel=1')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('static animation preset covers', () => {
  it('covers every built-in preset with a checked asset hash and authored progress', async () => {
    expect(AVATAR_ANIMATION_PRESET_COVER_MANIFEST.entries).toHaveLength(AVATAR_ANIMATION_PRESETS.length)
    expect(AVATAR_ANIMATION_PRESET_COVER_MANIFEST.entries.map(entry => entry.presetId)).toEqual(
      AVATAR_ANIMATION_PRESETS.map(preset => preset.id)
    )

    await Promise.all(AVATAR_ANIMATION_PRESET_COVER_MANIFEST.entries.map(async entry => {
      expect(entry.progress).toBe(AVATAR_ANIMATION_PRESET_COVER_PROGRESS[entry.presetId])
      expect(getAvatarAnimationPresetCoverUrl(entry.presetId)).toMatch(/\.svg(?:\?|$)/)
      const asset = await readFile(path.resolve('src/avatarAnimationPresetCovers', entry.asset))
      expect(createHash('sha256').update(asset).digest('hex')).toBe(entry.assetHash)
      expect(entry.frames.length).toBeGreaterThan(0)
      await Promise.all(entry.frames.map(async frame => {
        expect(getAvatarAnimationPresetTimelineFrameUrl(entry.presetId, frame.progress)).toMatch(/\.svg(?:\?|$)/)
        const frameAsset = await readFile(path.resolve('src/avatarAnimationPresetCovers', frame.asset))
        expect(createHash('sha256').update(frameAsset).digest('hex')).toBe(frame.assetHash)
      }))
    }))
  })

  it('opens, searches, scrolls, and changes theme without runtime thumbnail capture', async () => {
    await act(async () => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(App)
      ))
    })
    await flushEffects()
    const avatarCountBeforeOpeningLibrary = host.querySelectorAll('.interactive-avatar').length
    const animationFrameSpy = vi.spyOn(window, 'requestAnimationFrame')
    animationFrameSpy.mockClear()

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-animation')?.click())
    await flushEffects()

    const library = host.querySelector<HTMLElement>('[aria-label="Animation library"]')
    const search = library?.querySelector<HTMLInputElement>('[aria-label="Search animations"]')
    expect(library).not.toBeNull()
    expect(library?.querySelectorAll('.avatar-animation-sidebar__asset img')).toHaveLength(
      AVATAR_ANIMATION_PRESETS.length
    )
    expect(host.querySelector('.avatar-app__preset-capture')).toBeNull()
    expect(captureAvatarScreenshot).not.toHaveBeenCalled()

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(search, 'blink')
      search?.dispatchEvent(new Event('input', { bubbles: true }))
      library?.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    await flushEffects()

    expect(host.querySelector('.avatar-app__preset-capture')).toBeNull()
    expect(captureAvatarScreenshot).not.toHaveBeenCalled()
    expect(host.querySelectorAll('.interactive-avatar')).toHaveLength(avatarCountBeforeOpeningLibrary)
    expect(animationFrameSpy).toHaveBeenCalledTimes(1)

    act(() => host.querySelector<HTMLButtonElement>('.avatar-app__theme-toggle')?.click())
    await flushEffects()

    expect(host.querySelector('.avatar-app__preset-capture')).toBeNull()
    expect(captureAvatarScreenshot).not.toHaveBeenCalled()
  })
})
