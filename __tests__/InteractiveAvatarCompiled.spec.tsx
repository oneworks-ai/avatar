// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDefaultAvatarDefinition, getAvatarPalette } from '@oneworks/avatar'

vi.mock('../src/avatarPixelation', () => ({
  paintPixelatedAvatarCanvas: vi.fn()
}))

import {
  createAvatarEntityParts,
  createBeaverSurfaceDecals,
  createOwlSurfaceDecals,
  getAvatarEntityPresetScene
} from '../src/avatarEntityPresets'
import { InteractiveAvatar } from '../src/InteractiveAvatar'
import { resolveAvatarFaceStyle } from '../src/avatarGeometry'
import type { AvatarSurfaceDecal } from '../src/avatarSurfaceDecals'

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('InteractiveAvatar compiled renderer', () => {
  it('does not create compiled interaction overlays without a selected semantic part', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene

    act(() => root.render(createElement(InteractiveAvatar, {
      bodyShape: scene.appearance.bodyShape,
      entityParts: createAvatarEntityParts('beaver'),
      entityPreset: 'beaver',
      faceStyle: resolveAvatarFaceStyle(scene.face),
      interactive: true,
      interactionMode: 'rotate',
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onViewStateChange: vi.fn(),
      palette: getAvatarPalette('north-american-beaver'),
      selectedEntityPartId: null,
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      surfaceDecals: createBeaverSurfaceDecals(),
      viewState: { ...scene.view, pitch: 0, yaw: 0 }
    })))

    expect(host.querySelector('[data-avatar-entity-selection]')).toBeNull()
    expect(host.querySelector('[data-avatar-compiled-selection-grid]')).toBeNull()
  })

  it('uses one compiled owner partition for anatomy, target decals, and face features', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const parts = createAvatarEntityParts('beaver')

    act(() => root.render(createElement(InteractiveAvatar, {
      bodyShape: scene.appearance.bodyShape,
      entityParts: parts,
      entityPreset: 'beaver',
      faceStyle: resolveAvatarFaceStyle(scene.face),
      interactive: true,
      interactionMode: 'rotate',
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onViewStateChange: vi.fn(),
      palette: getAvatarPalette('north-american-beaver'),
      selectedEntityPartId: 'primary',
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      surfaceDecals: createBeaverSurfaceDecals(),
      viewState: { ...scene.view, pitch: -.1, yaw: .4 }
    })))

    const renderer = host.querySelector('[data-avatar-entity-fragment-root]')!
    const primary = renderer.querySelector('[data-avatar-entity-part="primary"]')!
    const primarySurface = primary.querySelector('[data-avatar-compiled-surface-layer="primary"]')!
    const primaryClip = primarySurface.getAttribute('clip-path')

    expect(renderer.getAttribute('data-avatar-fragment-composition')).toBe('compiled-owner-partition')
    expect(renderer.getAttribute('data-avatar-fragment-null-owner-pixels')).toBe('0')
    expect(primary.getAttribute('clip-path')).toBeNull()
    expect(primaryClip).toContain('-compiled-owner-')
    expect(primary.querySelector('[data-avatar-compiled-base="primary"]')).not.toBeNull()
    expect(primary.querySelector('[data-avatar-surface-decal="beaver-face-mask"]')
      ?.getAttribute('data-avatar-surface-decal-renderer')).toBe('compiled')
    expect(primary.querySelector('[data-avatar-face-surface-layer="primary"]')).not.toBeNull()
    expect(renderer.querySelector('[data-avatar-entity-selection="primary"]')?.getAttribute('clip-path')).toBe(primaryClip)
    expect(renderer.querySelector('[data-avatar-entity-grid="primary"]')?.getAttribute('clip-path')).toBe(primaryClip)
    expect(renderer.querySelector('[data-avatar-compiled-selection-grid="primary"]')).not.toBeNull()
    expect(renderer.querySelector('[data-avatar-compiled-base="primary"]')?.getAttribute('shape-rendering')).toBeNull()
  })

  it('renders cat and owl color regions only through their compiled target surfaces', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const catMarking: AvatarSurfaceDecal = {
      color: '#f0ddc4',
      height: 154,
      id: 'cat-face-coat',
      label: 'Cat face coat',
      opacity: 100,
      rotation: 0,
      shape: 'face-mask',
      side: 'face',
      targetPartId: 'cat-head',
      width: 138,
      x: 0,
      y: 24
    }
    const fixtures = [
      {
        decals: [catMarking],
        ids: ['cat-face-coat'],
        palette: 'siamese' as const,
        preset: 'cat' as const,
        targets: ['cat-head']
      },
      {
        decals: createOwlSurfaceDecals(),
        ids: [
          'owl-facial-disc',
          'owl-eye-ring-left',
          'owl-eye-ring-right',
          'owl-beak-seam',
          'owl-nostril-left',
          'owl-nostril-right'
        ],
        palette: 'barn-owl' as const,
        preset: 'owl' as const,
        targets: ['primary', 'primary', 'primary', 'beak', 'beak', 'beak']
      }
    ]

    for (const fixture of fixtures) {
      act(() => root.render(createElement(InteractiveAvatar, {
        bodyShape: scene.appearance.bodyShape,
        entityParts: createAvatarEntityParts(fixture.preset),
        entityPreset: fixture.preset,
        faceStyle: resolveAvatarFaceStyle(scene.face),
        interactive: true,
        interactionMode: 'rotate',
        lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
        onViewStateChange: vi.fn(),
        palette: getAvatarPalette(fixture.palette),
        shadowStyle: scene.effects.faceShadow,
        showLight: false,
        showShadow: false,
        surfaceDecals: fixture.decals,
        viewState: { ...scene.view, pitch: -.12, yaw: .55 }
      })))

      fixture.ids.forEach((id, index) => {
        const marking = host.querySelector(`[data-avatar-surface-decal="${id}"]`)
        expect(marking?.getAttribute('data-avatar-surface-decal-renderer'), id).toBe('compiled')
        expect(marking?.closest('[data-avatar-entity-part]')?.getAttribute('data-avatar-entity-part'), id)
          .toBe(fixture.targets[index])
      })
      expect(host.querySelector('[data-avatar-surface-decal-renderer="legacy"]')).toBeNull()
    }
  })

  it('renders bun procedural and asset markings only through compiled target surfaces', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const bun = getAvatarEntityPresetScene('bun')!
    const renderAt = (yaw: number) => act(() => root.render(createElement(InteractiveAvatar, {
      bodyShape: scene.appearance.bodyShape,
      entityParts: createAvatarEntityParts('bun'),
      entityPreset: 'bun',
      faceStyle: resolveAvatarFaceStyle(scene.face),
      interactive: true,
      interactionMode: 'rotate',
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onViewStateChange: vi.fn(),
      palette: getAvatarPalette('white'),
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      surfaceDecals: bun.surfaceDecals,
      viewState: { ...scene.view, pitch: 0, yaw }
    })))

    renderAt(0)
    expect(host.querySelector('[data-avatar-surface-decal="bun-crown-pleats"]')
      ?.getAttribute('data-avatar-surface-decal-renderer')).toBe('compiled')
    expect(host.querySelector('[data-avatar-surface-decal-renderer="legacy"]')).toBeNull()

    renderAt(Math.PI)
    expect(host.querySelector('[data-avatar-surface-decal="claude-spark-official"]')
      ?.getAttribute('data-avatar-surface-decal-renderer')).toBe('compiled')
    expect(host.querySelector('[data-avatar-surface-decal-renderer="legacy"]')).toBeNull()
  })

  it('keeps semantic selection state while hiding rear compiled overlays', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const parts = createAvatarEntityParts('beaver')
    const renderAt = (yaw: number) => createElement(InteractiveAvatar, {
      bodyShape: scene.appearance.bodyShape,
      entityParts: parts,
      entityPreset: 'beaver' as const,
      faceStyle: resolveAvatarFaceStyle(scene.face),
      interactive: true,
      interactionMode: 'rotate' as const,
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onViewStateChange: vi.fn(),
      palette: getAvatarPalette('north-american-beaver'),
      selectedEntityPartId: 'tooth-left',
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      surfaceDecals: createBeaverSurfaceDecals(),
      viewState: { ...scene.view, pitch: 0, yaw }
    })

    act(() => root.render(renderAt(0)))
    expect(host.querySelector('[data-avatar-entity-selection="tooth-left"]')).not.toBeNull()
    expect(host.querySelector('[data-avatar-compiled-selection-grid="tooth-left"]')).not.toBeNull()

    act(() => root.render(renderAt(Math.PI)))
    expect(host.querySelector('[data-avatar-entity-selection="tooth-left"]')).toBeNull()
    expect(host.querySelector('[data-avatar-compiled-selection-grid="tooth-left"]')).toBeNull()

    act(() => root.render(renderAt(0)))
    expect(host.querySelector('[data-avatar-entity-selection="tooth-left"]')).not.toBeNull()
    expect(host.querySelector('[data-avatar-compiled-selection-grid="tooth-left"]')).not.toBeNull()
  })
})
