// @vitest-environment jsdom

import { act, createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDefaultAvatarDefinition, DEFAULT_AVATAR_PIXEL_EFFECT } from '@oneworks/avatar'

const pixelMocks = vi.hoisted(() => ({
  resolvers: [] as Array<() => void>
}))

vi.mock('../src/avatarPixelation', () => ({
  paintPixelatedAvatarCanvas: vi.fn((_: SVGSVGElement, canvas: HTMLCanvasElement) => (
    new Promise<HTMLCanvasElement>(resolve => {
      pixelMocks.resolvers.push(() => resolve(canvas))
    })
  )),
  quantizeAvatarPixelData: vi.fn(),
  renderPixelatedAvatarDataUrl: vi.fn()
}))

import { Avatar } from '../packages/react/src'
import { paintPixelatedAvatarCanvas } from '../src/avatarPixelation'

let host: HTMLDivElement
let root: Root

const flushFrame = () => act(async () => {
  await new Promise(resolve => window.setTimeout(resolve, 0))
  await new Promise(resolve => window.setTimeout(resolve, 0))
})

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  pixelMocks.resolvers = []
  vi.mocked(paintPixelatedAvatarCanvas).mockClear()
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    addEventListener: vi.fn(),
    matches: false,
    removeEventListener: vi.fn()
  }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => (
    window.setTimeout(() => callback(performance.now()), 0)
  ))
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => window.clearTimeout(handle))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    imageSmoothingEnabled: false
  } as unknown as CanvasRenderingContext2D)
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

describe('InteractiveAvatar pixel scheduling', () => {
  it('coalesces rapid updates and reveals the SVG immediately when disabled', async () => {
    const base = createDefaultAvatarDefinition()
    const pixelated = {
      ...base,
      scene: {
        ...base.scene,
        effects: {
          ...base.scene.effects,
          pixelate: { ...DEFAULT_AVATAR_PIXEL_EFFECT, enabled: true }
        }
      }
    }
    act(() => root.render(createElement(StrictMode, null, createElement(Avatar, { definition: pixelated }))))
    await flushFrame()
    expect(paintPixelatedAvatarCanvas).toHaveBeenCalledTimes(1)

    for (const yaw of [0.1, 0.2, 0.3, 0.4]) {
      act(() => root.render(createElement(
        StrictMode,
        null,
        createElement(Avatar, {
          definition: {
            ...pixelated,
            scene: { ...pixelated.scene, view: { ...pixelated.scene.view, yaw } }
          }
        })
      )))
    }
    await flushFrame()
    expect(paintPixelatedAvatarCanvas).toHaveBeenCalledTimes(1)

    act(() => pixelMocks.resolvers.shift()?.())
    await flushFrame()
    expect(paintPixelatedAvatarCanvas).toHaveBeenCalledTimes(2)
    act(() => pixelMocks.resolvers.shift()?.())
    await flushFrame()
    expect(host.querySelector('.interactive-avatar')?.getAttribute('data-pixel-ready')).toBe('true')

    act(() => root.render(createElement(StrictMode, null, createElement(Avatar, { definition: base }))))
    expect(host.querySelector('.interactive-avatar')?.getAttribute('data-pixel-ready')).toBe('false')
    expect(host.querySelector('.interactive-avatar__pixel-canvas')).toBeNull()
  })
})
