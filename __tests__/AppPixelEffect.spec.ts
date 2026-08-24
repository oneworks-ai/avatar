// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App'
import { AvatarLocaleProvider } from '../src/avatarLocale'
import { persistSavedAvatarPresets } from '../src/savedAvatarPresets'

let host: HTMLDivElement
let root: Root

const flushEffects = () => act(async () => {
  await new Promise(resolve => window.setTimeout(resolve, 0))
})

const openPixelControls = () => {
  const effectsTab = host.querySelector<HTMLButtonElement>('#avatar-controls-tab-effects')
  act(() => effectsTab?.click())
  return host.querySelector<HTMLButtonElement>('[role="switch"][aria-label="Pixel style"]')
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
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
  window.history.replaceState(null, '', '/?pixel=0&pixelSize=8&pixelColors=64&pixelSample=nearest&pixelDither=none')
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

const renderApp = async () => {
  await act(async () => {
    root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(App)
    ))
  })
  await flushEffects()
}

describe('App pixel effect history', () => {
  it('normalizes fractional pixel sizes from legacy URLs', async () => {
    window.history.replaceState(null, '', '/?pixel=1&pixelSize=6.5')
    await renderApp()

    expect(window.location.search).toContain('pixelSize=7')
  })

  it('migrates legacy smoothing URLs to a hard structure-aware sampler', async () => {
    window.history.replaceState(null, '', '/?pixel=1&pixelSample=lanczos3')
    await renderApp()

    expect(window.location.search).toContain('pixelSample=slic')
    expect(window.location.search).not.toContain('lanczos3')
  })

  it('restores pixel settings from a saved preset', async () => {
    persistSavedAvatarPresets([{
      createdAt: Date.now(),
      id: 'pixel-preset',
      query: '?pixel=1&pixelSize=18&pixelColors=8&pixelSample=box&pixelDither=ordered',
      screenshot: 'data:image/png;base64,AA==',
      version: 1
    }])
    await renderApp()

    const restore = host.querySelector<HTMLButtonElement>('[aria-label^="Restore preset saved"]')
    expect(restore).not.toBeNull()
    act(() => restore?.click())

    const pixelSwitch = openPixelControls()
    expect(pixelSwitch?.getAttribute('aria-checked')).toBe('true')
    expect(window.location.search).toContain('pixelSize=18')
    expect(window.location.search).toContain('pixelSample=dominant')
  })

  it('restores pixel settings with editor undo', async () => {
    await renderApp()
    const pixelSwitch = openPixelControls()
    expect(pixelSwitch?.getAttribute('aria-checked')).toBe('false')

    act(() => pixelSwitch?.click())
    await flushEffects()
    expect(window.location.search).toContain('pixel=1')

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'z' })))
    await flushEffects()
    expect(pixelSwitch?.getAttribute('aria-checked')).toBe('false')
    expect(window.location.search).toContain('pixel=0')
  })
})
