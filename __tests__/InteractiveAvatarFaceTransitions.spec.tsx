// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDefaultAvatarDefinition, getAvatarPalette } from '@oneworks/avatar'

import { InteractiveAvatar } from '../src/InteractiveAvatar'
import { resolveAvatarFaceStyle } from '../src/avatarGeometry'

let host: HTMLDivElement
let root: Root
let now = 0
let nextFrame = 0
const frames = new Map<number, FrameRequestCallback>()

const renderAvatar = (leftEyeWidth: number, rightEyeWidth: number, transitionsEnabled = true) => {
  const definition = createDefaultAvatarDefinition()
  const scene = definition.scene
  act(() => root.render(createElement(InteractiveAvatar, {
    avatarOutlineStyle: scene.effects.outline,
    avatarShadowStyle: scene.effects.avatarShadow,
    backgroundStyle: scene.appearance.backgroundStyle,
    bodyShape: scene.appearance.bodyShape,
    colorGrade: scene.effects.colorGrade,
    entityParts: scene.entity.parts,
    entityPreset: scene.entity.preset,
    faceStyle: resolveAvatarFaceStyle({ ...scene.face, leftEyeWidth, rightEyeWidth }),
    faceStyleTransitionsEnabled: transitionsEnabled,
    gridDensity: scene.lighting.gridDensity,
    interactive: false,
    interactionMode: scene.interactionMode,
    lightDistance: scene.lighting.distance,
    lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
    onViewStateChange: vi.fn(),
    palette: getAvatarPalette(scene.appearance.paletteId),
    pixelEffect: scene.effects.pixelate,
    shadowStyle: scene.effects.faceShadow,
    showAvatarShadow: scene.effects.showAvatarShadow,
    showLight: scene.lighting.enabled,
    showOutline: scene.effects.showOutline,
    showShadow: scene.effects.showFaceShadow,
    viewState: scene.view
  })))
}

const advanceFrame = (milliseconds: number) => {
  now += milliseconds
  const pending = [...frames.entries()]
  frames.clear()
  act(() => pending.forEach(([, callback]) => callback(now)))
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  now = 0
  nextFrame = 0
  frames.clear()
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextFrame
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.spyOn(performance, 'now').mockImplementation(() => now)
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

describe('InteractiveAvatar face transitions', () => {
  it('uses the supplied animation frame directly without passive state-update churn', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    for (let frame = 0; frame < 80; frame += 1) {
      renderAvatar(20 + frame / 10, 36 - frame / 20, false)
    }

    expect(frames.size).toBe(0)
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('Maximum update depth exceeded')
  })

  it('restarts and lands the eye paths when independent eye widths change', () => {
    renderAvatar(20, 36)
    advanceFrame(180)
    const initialLeft = host.querySelector('[data-avatar-eye="eye-0"]')?.getAttribute('d')
    const initialRight = host.querySelector('[data-avatar-eye="eye-1"]')?.getAttribute('d')

    renderAvatar(52, 12)
    advanceFrame(90)
    const halfwayLeft = host.querySelector('[data-avatar-eye="eye-0"]')?.getAttribute('d')
    const halfwayRight = host.querySelector('[data-avatar-eye="eye-1"]')?.getAttribute('d')
    advanceFrame(90)
    const landedLeft = host.querySelector('[data-avatar-eye="eye-0"]')?.getAttribute('d')
    const landedRight = host.querySelector('[data-avatar-eye="eye-1"]')?.getAttribute('d')

    expect(halfwayLeft).not.toBe(initialLeft)
    expect(halfwayRight).not.toBe(initialRight)
    expect(landedLeft).not.toBe(initialLeft)
    expect(landedRight).not.toBe(initialRight)

    renderAvatar(52, 12, false)
    expect(host.querySelector('[data-avatar-eye="eye-0"]')?.getAttribute('d')).toBe(landedLeft)
    expect(host.querySelector('[data-avatar-eye="eye-1"]')?.getAttribute('d')).toBe(landedRight)
  })
})
