// @vitest-environment jsdom

import { act, createElement, createRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_AVATAR_COAT_PATTERN,
  applyAvatarPaletteToneJitter,
  createDefaultAvatarDefinition,
  getAvatarPalette,
  resolveAvatarCoatPatternDecals
} from '@oneworks/avatar'

import {
  applyBeaverToothSize,
  applyCowForelockStyle,
  applyCowHornStyle,
  applyDeerAntlerStyle,
  applyAvatarEntityPalette,
  applyFoxEarScale,
  applyFoxEarStyle,
  applyFoxHeadScale,
  applyFoxHeadTaper,
  applyHedgehogSpineStyle,
  applyLionManeStyle,
  applySheepHornStyle,
  BEAVER_TOOTH_SIZE_RANGE,
  createAvatarEntityParts,
  createAlpacaSurfaceDecals,
  createCapybaraSurfaceDecals,
  createCowSurfaceDecals,
  createDeerSurfaceDecals,
  createFoxSurfaceDecals,
  createHamsterSurfaceDecals,
  createHedgehogSurfaceDecals,
  createLionSurfaceDecals,
  createOtterSurfaceDecals,
  createOwlSurfaceDecals,
  createSheepSurfaceDecals,
  createSquirrelSurfaceDecals,
  createTigerSurfaceDecals,
  getAvatarEntityPresetFaceStyle,
  resolveAvatarEntityPresetFaceStyle
} from '../../../src/avatarEntityPresets'
import { InteractiveAvatar } from '../../../src/InteractiveAvatar'
import { resolveAvatarFaceStyle } from '../../../src/avatarGeometry'
import { getAvatarAnimalBreedTemplate, resolveAvatarAnimalBreedTemplate } from '../../../src/avatarSpeciesBreeds'
import { Avatar } from '../src'
import type { AvatarHandle } from '../src'

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
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
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('OneWorks Avatar React rendering', () => {
  it('flushes a completed drag before a second interaction cancels the idle commit', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const onViewStateChange = vi.fn()

    act(() => root.render(createElement(InteractiveAvatar, {
      bodyShape: scene.appearance.bodyShape,
      entityParts: [],
      entityPreset: 'custom',
      faceStyle: resolveAvatarFaceStyle(scene.face),
      interactive: true,
      interactionMode: 'rotate',
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onViewStateChange,
      palette: getAvatarPalette('dairy-cow'),
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      viewState: scene.view
    })))

    const canvas = host.querySelector<SVGSVGElement>('.interactive-avatar__canvas')!
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ width: 420 } as DOMRect)
    Object.defineProperties(canvas, {
      hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
      releasePointerCapture: { configurable: true, value: vi.fn() },
      setPointerCapture: { configurable: true, value: vi.fn() }
    })
    const pointer = (type: string, x: number, y: number, id: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y })
      Object.defineProperties(event, {
        pointerId: { value: id },
        pointerType: { value: 'mouse' }
      })
      return event
    }

    act(() => canvas.dispatchEvent(pointer('pointerdown', 100, 100, 1)))
    act(() => canvas.dispatchEvent(pointer('pointermove', 180, 120, 1)))
    act(() => canvas.dispatchEvent(pointer('pointerup', 180, 120, 1)))
    expect(onViewStateChange).not.toHaveBeenCalled()

    act(() => canvas.dispatchEvent(pointer('pointerdown', 120, 120, 2)))
    expect(onViewStateChange).toHaveBeenCalledTimes(1)
    expect(onViewStateChange.mock.calls[0]![0]).toMatchObject({
      pitch: scene.view.pitch + 20 * Math.PI / 280,
      yaw: scene.view.yaw + 80 * Math.PI / 280
    })
    act(() => canvas.dispatchEvent(pointer('pointerup', 120, 120, 2)))
  })

  it('does not reuse entity geometry across different top scales', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const primary = createAvatarEntityParts('dog').find(part => part.id === 'primary')!
    const parts = [
      { ...primary, id: 'narrow-top', topScale: .55, x: -45 },
      { ...primary, id: 'wide-top', topScale: 1.15, x: 45 }
    ]

    act(() => root.render(createElement(InteractiveAvatar, {
      bodyShape: scene.appearance.bodyShape,
      entityParts: parts,
      entityPreset: 'custom',
      faceStyle: resolveAvatarFaceStyle(scene.face),
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      palette: getAvatarPalette('dairy-cow'),
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      viewState: scene.view
    })))

    const narrow = host.querySelector('[data-avatar-entity-part="narrow-top"] path[fill]')?.getAttribute('d')
    const wide = host.querySelector('[data-avatar-entity-part="wide-top"] path[fill]')?.getAttribute('d')
    expect(narrow).toBeTruthy()
    expect(wide).toBeTruthy()
    expect(narrow).not.toBe(wide)
  })

  it('keeps rotation gestures from selecting a body part while preserving intentional click selection', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const onEntityPartSelect = vi.fn()

    act(() => root.render(createElement(InteractiveAvatar, {
      avatarOutlineStyle: scene.effects.outline,
      avatarShadowStyle: scene.effects.avatarShadow,
      backgroundStyle: scene.appearance.backgroundStyle,
      bodyShape: scene.appearance.bodyShape,
      colorGrade: scene.effects.colorGrade,
      entityParts: createAvatarEntityParts('cow'),
      entityPreset: 'cow',
      faceStyle: resolveAvatarFaceStyle(scene.face),
      gridDensity: scene.lighting.gridDensity,
      interactive: true,
      interactionMode: 'rotate',
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onEntityPartSelect,
      onViewStateChange: vi.fn(),
      palette: getAvatarPalette('dairy-cow'),
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      viewState: scene.view
    })))

    const canvas = host.querySelector<SVGSVGElement>('.interactive-avatar__canvas')!
    const fragmentRoot = canvas.querySelector<SVGGElement>('[data-avatar-entity-fragment-root]')!
    const head = canvas.querySelector<SVGPathElement>('[data-avatar-entity-part="primary"] path')!
    const localHitPoint = { x: 210, y: 210 }
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ width: 420 } as DOMRect)
    Object.defineProperties(canvas, {
      createSVGPoint: {
        configurable: true,
        value: vi.fn(() => ({
          matrixTransform: vi.fn(() => localHitPoint),
          x: 0,
          y: 0
        }))
      },
      hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
      releasePointerCapture: { configurable: true, value: vi.fn() },
      setPointerCapture: { configurable: true, value: vi.fn() }
    })
    Object.defineProperty(fragmentRoot, 'getScreenCTM', {
      configurable: true,
      value: vi.fn(() => ({ inverse: vi.fn(() => ({})) }))
    })

    const pointer = (type: string, x: number, y: number, id: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y })
      Object.defineProperties(event, {
        pointerId: { value: id },
        pointerType: { value: 'mouse' }
      })
      return event
    }

    act(() => head.dispatchEvent(pointer('pointerdown', 100, 100, 1)))
    expect(onEntityPartSelect).not.toHaveBeenCalled()
    act(() => canvas.dispatchEvent(pointer('pointermove', 190, 130, 1)))
    act(() => canvas.dispatchEvent(pointer('pointerup', 190, 130, 1)))

    expect(onEntityPartSelect).not.toHaveBeenCalled()
    expect(canvas.querySelector('[stroke-dasharray="5 4"]')).toBeNull()
    expect(canvas.querySelector('polygon[stroke-opacity=".09"]')).toBeNull()

    act(() => head.dispatchEvent(pointer('pointerdown', 100, 100, 2)))
    act(() => canvas.dispatchEvent(pointer('pointerup', 101, 101, 2)))
    expect(onEntityPartSelect).toHaveBeenCalledExactlyOnceWith('primary')

    onEntityPartSelect.mockClear()
    localHitPoint.y = 264
    act(() => head.dispatchEvent(pointer('pointerdown', 100, 100, 4)))
    act(() => canvas.dispatchEvent(pointer('pointerup', 101, 101, 4)))
    expect(onEntityPartSelect).toHaveBeenCalledExactlyOnceWith('snout')

    onEntityPartSelect.mockClear()
    localHitPoint.y = 210
    act(() => head.dispatchEvent(pointer('pointerdown', 100, 100, 3)))
    act(() => canvas.dispatchEvent(pointer('pointercancel', 100, 100, 3)))
    expect(onEntityPartSelect).not.toHaveBeenCalled()
  })

  it('uses one local visibility mask for body, curved markings, face features, grid, and selection', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const parts = createAvatarEntityParts('cow')
    const decals = createCowSurfaceDecals()

    act(() => root.render(createElement(InteractiveAvatar, {
      avatarOutlineStyle: scene.effects.outline,
      avatarShadowStyle: scene.effects.avatarShadow,
      backgroundStyle: scene.appearance.backgroundStyle,
      bodyShape: scene.appearance.bodyShape,
      colorGrade: scene.effects.colorGrade,
      entityParts: parts,
      entityPreset: 'cow',
      faceStyle: resolveAvatarFaceStyle(scene.face),
      gridDensity: scene.lighting.gridDensity,
      interactive: true,
      interactionMode: 'rotate',
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onEntityPartSelect: vi.fn(),
      onViewStateChange: vi.fn(),
      palette: getAvatarPalette('dairy-cow'),
      shadowStyle: scene.effects.faceShadow,
      selectedEntityPartId: 'primary',
      showLight: true,
      showOutline: true,
      showShadow: true,
      surfaceDecals: decals,
      viewState: { ...scene.view, pitch: -.18, yaw: Math.PI / 3 }
    })))

    const preset = host.querySelector('[data-avatar-entity-preset="cow"]')!
    const primary = preset.querySelector('[data-avatar-entity-part="primary"]')!
    const primaryMask = primary.getAttribute('mask')
    const faceLayer = preset.querySelector('[data-avatar-face-surface-layer="primary"]')!
    const faceMask = preset.querySelector('[data-avatar-surface-decal="cow-face-mask"]')!
    const selection = preset.querySelector<SVGGElement>('[data-avatar-entity-selection="primary"]')
    const grid = preset.querySelector<SVGGElement>('[data-avatar-entity-grid="primary"]')
    const undercoat = preset.querySelector<SVGGElement>('[data-avatar-entity-undercoat]')

    expect(primaryMask).toContain('-entity-visibility-')
    expect(preset.matches('[data-avatar-entity-fragment-root]')).toBe(true)
    expect(preset.querySelector('[data-avatar-entity-part-hit]')).toBeNull()
    expect(faceLayer.closest('[data-avatar-entity-part]')).toBe(primary)
    expect(faceMask.closest('[data-avatar-entity-part]')).toBe(primary)
    expect(preset.querySelectorAll('[data-avatar-face-surface-layer]')).toHaveLength(1)
    expect(preset.querySelectorAll('[data-avatar-surface-decal="cow-face-mask"]')).toHaveLength(1)
    expect(preset.querySelectorAll('[data-avatar-entity-part]')).toHaveLength(parts.length)
    expect(preset.querySelector(`[mask="${primaryMask}"]`)).not.toBeNull()
    expect(selection?.getAttribute('mask')).toBeNull()
    expect(selection?.querySelector('path')?.getAttribute('d')).toBeTruthy()
    expect(grid?.getAttribute('mask')).toBeNull()
    expect(grid?.getAttribute('clip-path')).toContain('-entity-interaction-')
    expect(undercoat).not.toBeNull()
    expect(undercoat?.getAttribute('pointer-events')).toBe('none')
    expect(undercoat?.closest('[mask]')).toBeNull()
    expect(undercoat?.children).toHaveLength(parts.length)
    expect(undercoat?.querySelectorAll('[stroke]')).toHaveLength(0)
    const occlusionOverdraw = preset.querySelectorAll('[data-avatar-fragment-occlusion-overdraw]')
    expect(occlusionOverdraw.length).toBeGreaterThan(0)
    expect([...occlusionOverdraw].every(path => (
      path.getAttribute('fill') === 'black'
      && path.getAttribute('stroke') === 'white'
      && Number(path.getAttribute('stroke-width')) <= 2
    ))).toBe(true)
    expect(preset.querySelectorAll('g[filter*="-entity-outline"]')).toHaveLength(1)
  })

  it('hides interaction overlays for a selected rear fragment and restores them when it returns to the front', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const parts = applyBeaverToothSize(
      resolveAvatarAnimalBreedTemplate(
        getAvatarAnimalBreedTemplate('beaver', 'north-american-beaver')!,
        'v1-0auditfixed000000000'
      ).entityParts,
      BEAVER_TOOTH_SIZE_RANGE.min
    )
    const render = (yaw: number) => act(() => root.render(createElement(InteractiveAvatar, {
      avatarOutlineStyle: scene.effects.outline,
      bodyShape: scene.appearance.bodyShape,
      entityParts: parts,
      entityPreset: 'beaver',
      faceStyle: resolveAvatarFaceStyle(scene.face),
      gridDensity: scene.lighting.gridDensity,
      interactive: true,
      interactionMode: 'rotate',
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onEntityPartSelect: vi.fn(),
      onViewStateChange: vi.fn(),
      palette: getAvatarPalette('north-american-beaver'),
      selectedEntityPartId: 'tooth-left',
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      viewState: { ...scene.view, pitch: 0, yaw }
    })))

    const overlays = () => ({
      grid: host.querySelector('[data-avatar-entity-grid="tooth-left"]'),
      interactionArea: Number(
        host.querySelector('[data-avatar-entity-part="tooth-left"]')
          ?.getAttribute('data-avatar-fragment-interaction-area')
      ),
      interactionRatio: Number(
        host.querySelector('[data-avatar-entity-part="tooth-left"]')
          ?.getAttribute('data-avatar-fragment-interaction-ratio')
      ),
      selection: host.querySelector('[data-avatar-entity-selection="tooth-left"]'),
      visibleArea: Number(
        host.querySelector('[data-avatar-entity-part="tooth-left"]')
          ?.getAttribute('data-avatar-fragment-visible-area')
      )
    })

    render(0)
    expect(overlays()).toMatchObject({
      grid: expect.any(SVGGElement),
      interactionArea: expect.any(Number),
      interactionRatio: expect.any(Number),
      selection: expect.any(SVGGElement),
      visibleArea: expect.any(Number)
    })
    expect(overlays().visibleArea).toBeGreaterThan(0)
    expect(overlays().interactionArea).toBeGreaterThan(0)
    expect(overlays().interactionRatio).toBeGreaterThan(0)

    render(-3.5904)
    expect(overlays()).toMatchObject({ grid: null, interactionArea: 0, selection: null, visibleArea: 0 })

    render(-Math.PI)
    expect(overlays()).toMatchObject({ grid: null, interactionArea: 0, selection: null, visibleArea: 0 })

    // This angle is beyond the rear view but projects the tooth back onto the
    // visible side. Keep it interactive instead of hiding by yaw alone.
    render(-4.9368)
    expect(overlays().interactionArea).toBeGreaterThan(0)
    expect(overlays().grid).not.toBeNull()
    expect(overlays().selection).not.toBeNull()

    render(0)
    expect(overlays().grid).not.toBeNull()
    expect(overlays().selection).not.toBeNull()
    expect(overlays().visibleArea).toBeGreaterThan(0)
    expect(overlays().interactionArea).toBeGreaterThan(0)
  })

  it('does not retain a rear tooth overlay across interactive release and full-quality settling', () => {
    const frameCallbacks = new Map<number, FrameRequestCallback>()
    const idleCallbacks = new Map<number, IdleRequestCallback>()
    let nextCallbackId = 1
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      const callbackId = nextCallbackId++
      frameCallbacks.set(callbackId, callback)
      return callbackId
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((callbackId: number) => {
      frameCallbacks.delete(callbackId)
    }))
    vi.stubGlobal('requestIdleCallback', vi.fn((callback: IdleRequestCallback) => {
      const callbackId = nextCallbackId++
      idleCallbacks.set(callbackId, callback)
      return callbackId
    }))
    vi.stubGlobal('cancelIdleCallback', vi.fn((callbackId: number) => {
      idleCallbacks.delete(callbackId)
    }))

    const flushFrame = () => {
      const callbacks = [...frameCallbacks.values()]
      frameCallbacks.clear()
      act(() => callbacks.forEach(callback => callback(performance.now())))
    }
    const flushIdle = () => {
      const callbacks = [...idleCallbacks.values()]
      idleCallbacks.clear()
      act(() => callbacks.forEach(callback => callback({
        didTimeout: false,
        timeRemaining: () => 50
      })))
    }
    const flushSettling = () => {
      for (let phase = 0; phase < 8 && (idleCallbacks.size > 0 || frameCallbacks.size > 0); phase += 1) {
        if (idleCallbacks.size > 0) flushIdle()
        if (frameCallbacks.size > 0) flushFrame()
      }
    }

    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const parts = applyBeaverToothSize(
      resolveAvatarAnimalBreedTemplate(
        getAvatarAnimalBreedTemplate('beaver', 'north-american-beaver')!,
        'v1-0auditfixed000000000'
      ).entityParts,
      BEAVER_TOOTH_SIZE_RANGE.min
    )
    const Harness = () => {
      const [viewState, setViewState] = useState({ ...scene.view, pitch: 0, roll: 0, yaw: 0 })
      return createElement(InteractiveAvatar, {
        avatarOutlineStyle: scene.effects.outline,
        bodyShape: scene.appearance.bodyShape,
        entityParts: parts,
        entityPreset: 'beaver',
        faceStyle: resolveAvatarFaceStyle(scene.face),
        gridDensity: scene.lighting.gridDensity,
        interactive: true,
        interactionMode: 'rotate',
        lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
        onEntityPartSelect: vi.fn(),
        onViewStateChange: setViewState,
        palette: getAvatarPalette('north-american-beaver'),
        selectedEntityPartId: 'tooth-left',
        shadowStyle: scene.effects.faceShadow,
        showLight: false,
        showShadow: false,
        viewState
      })
    }
    act(() => root.render(createElement(Harness)))

    const canvas = host.querySelector<SVGSVGElement>('.interactive-avatar__canvas')!
    const fragmentRoot = canvas.querySelector<SVGGElement>('[data-avatar-entity-fragment-root]')!
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ width: 420 } as DOMRect)
    Object.defineProperties(canvas, {
      hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
      releasePointerCapture: { configurable: true, value: vi.fn() },
      setPointerCapture: { configurable: true, value: vi.fn() }
    })
    Object.defineProperty(fragmentRoot, 'getScreenCTM', {
      configurable: true,
      value: vi.fn(() => null)
    })
    const pointer = (type: string, x: number, id: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: 350 })
      Object.defineProperties(event, {
        pointerId: { value: id },
        pointerType: { value: 'mouse' }
      })
      return event
    }
    const overlayState = () => {
      const avatar = host.querySelector('.interactive-avatar')!
      const tooth = host.querySelector('[data-avatar-entity-part="tooth-left"]')!
      return {
        area: Number(tooth.getAttribute('data-avatar-fragment-interaction-area')),
        compositorQuality: avatar.getAttribute('data-avatar-compositor-quality'),
        dashCount: host.querySelectorAll('[stroke-dasharray="5 4"]').length,
        gridCount: host.querySelectorAll('[data-avatar-entity-grid="tooth-left"]').length,
        quality: avatar.getAttribute('data-avatar-fragment-quality'),
        ratio: Number(tooth.getAttribute('data-avatar-fragment-interaction-ratio')),
        yaw: Number(avatar.getAttribute('data-yaw'))
      }
    }
    const drag = (fromX: number, toX: number, pointerId: number) => {
      act(() => canvas.dispatchEvent(pointer('pointerdown', fromX, pointerId)))
      act(() => canvas.dispatchEvent(pointer('pointermove', toX, pointerId)))
      flushFrame()
      act(() => canvas.dispatchEvent(pointer('pointerup', toX, pointerId)))
    }

    expect(overlayState()).toMatchObject({ dashCount: 1, gridCount: 1, quality: 'full', yaw: 0 })

    drag(500, 180, 1)
    expect(overlayState()).toMatchObject({
      area: 0,
      compositorQuality: 'interactive',
      dashCount: 0,
      gridCount: 0,
      quality: 'interactive'
    })

    // Start the correcting gesture before the first idle commit. This is the
    // real CUA path that previously left an interactive selection arc alive.
    drag(300, 340, 2)
    expect(overlayState()).toMatchObject({
      area: 0,
      compositorQuality: 'interactive',
      dashCount: 0,
      gridCount: 0,
      quality: 'interactive'
    })
    expect(overlayState().yaw).toBeCloseTo(-Math.PI, 3)

    while (idleCallbacks.size > 0 || frameCallbacks.size > 0) {
      if (idleCallbacks.size > 0) flushIdle()
      expect(overlayState().compositorQuality).toBe(overlayState().quality)
      if (frameCallbacks.size > 0) flushFrame()
      expect(overlayState().compositorQuality).toBe(overlayState().quality)
    }
    expect(overlayState()).toMatchObject({ area: 0, dashCount: 0, gridCount: 0, quality: 'full' })
    expect(overlayState().yaw).toBeCloseTo(-Math.PI, 3)

    drag(100, 380, 3)
    expect(overlayState().area).toBeGreaterThan(0)
    expect(overlayState()).toMatchObject({ dashCount: 1, gridCount: 1, quality: 'interactive' })
    flushSettling()
    expect(overlayState().area).toBeGreaterThan(0)
    expect(overlayState()).toMatchObject({ dashCount: 1, gridCount: 1, quality: 'full', yaw: 0 })
  })

  it('keeps the still-visible side of bird face layers and beak markings at the 90 degree horizon', () => {
    const definition = createDefaultAvatarDefinition()
    const owl = createAvatarEntityParts('owl')

    act(() => root.render(createElement(Avatar, {
      definition: {
        ...definition,
        scene: {
          ...definition.scene,
          decals: createOwlSurfaceDecals(),
          entity: { parts: owl, preset: 'owl' },
          view: { ...definition.scene.view, pitch: 0, yaw: Math.PI / 2 }
        }
      }
    })))

    const preset = host.querySelector('[data-avatar-entity-preset="owl"]')!
    expect(preset.querySelector('[data-avatar-surface-decal="owl-facial-disc"]')).not.toBeNull()
    expect(preset.querySelector('[data-avatar-face-surface-layer="primary"]')).not.toBeNull()
    expect(preset.querySelectorAll('[data-avatar-face-feature]').length).toBeGreaterThan(0)
    expect(Number(preset.getAttribute('data-avatar-fragment-intersections'))).toBeGreaterThan(0)
    expect(preset.querySelectorAll('[data-avatar-entity-part="primary"]')).toHaveLength(1)
    expect(preset.querySelectorAll('[data-avatar-entity-part="beak-upper"]')).toHaveLength(1)
    expect(preset.querySelectorAll('[data-avatar-entity-part="beak-lower"]')).toHaveLength(1)
  })

  it('hides rear-facing face features and face-side markings without removing real anatomy', () => {
    const definition = createDefaultAvatarDefinition()
    const owl = createAvatarEntityParts('owl')

    act(() => root.render(createElement(Avatar, {
      definition: {
        ...definition,
        scene: {
          ...definition.scene,
          decals: createOwlSurfaceDecals(),
          entity: { parts: owl, preset: 'owl' },
          view: { ...definition.scene.view, pitch: 0, yaw: Math.PI }
        }
      }
    })))

    const preset = host.querySelector('[data-avatar-entity-preset="owl"]')!
    expect(preset.querySelector('[data-avatar-face-feature]')).toBeNull()
    expect(preset.querySelector('[data-avatar-surface-decal="owl-facial-disc"]')).toBeNull()
    expect(preset.querySelectorAll('[data-avatar-entity-part]')).toHaveLength(owl.length)
  })

  it('renders configurable ellipse bottom taper from the shared public definition', () => {
    const definition = createDefaultAvatarDefinition()
    const ellipse = {
      ...definition,
      scene: {
        ...definition.scene,
        appearance: { ...definition.scene.appearance, bodyShape: 'ellipse' as const }
      }
    }

    act(() => root.render(createElement(Avatar, { definition: ellipse })))
    const untapered = host.querySelector('svg clipPath path')?.getAttribute('d')

    act(() => root.render(createElement(Avatar, {
      definition: {
        ...ellipse,
        scene: {
          ...ellipse.scene,
          appearance: { ...ellipse.scene.appearance, bottomTaper: 78 }
        }
      }
    })))
    const tapered = host.querySelector('svg clipPath path')?.getAttribute('d')

    expect(untapered).toContain('M ')
    expect(tapered).toContain('M ')
    expect(tapered).not.toBe(untapered)
  })

  it('derives procedural coat decals from the public definition', () => {
    const definition = createDefaultAvatarDefinition()
    const badge = {
      color: '#f29a93', height: 18, id: 'user-badge', label: 'User badge', opacity: 90,
      rotation: -8, shape: 'ellipse' as const, targetPartId: 'cat-head',
      width: 30, x: -48, y: 30
    }
    act(() => root.render(createElement(Avatar, {
      definition: {
        ...definition,
        scene: {
          ...definition.scene,
          appearance: {
            ...definition.scene.appearance,
            coatPattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, algorithm: 'mackerel' },
            paletteId: 'tabby'
          },
          decals: [badge],
          entity: { parts: createAvatarEntityParts('cat'), preset: 'cat' }
        }
      }
    })))
    expect(host.querySelectorAll('[data-avatar-surface-decal^="coat-mackerel-"]').length).toBeGreaterThan(0)
    expect(host.querySelector('[data-avatar-surface-decal="user-badge"]')).not.toBeNull()
  })

  it('restores a saved natural fur tone and its projected markings without changing the palette identity', () => {
    const definition = createDefaultAvatarDefinition()
    const basePalette = getAvatarPalette('giant-panda')
    for (const amount of [-17, -6, 4, 18]) {
      const runtimePalette = applyAvatarPaletteToneJitter(basePalette, amount)
      const parts = applyAvatarEntityPalette(createAvatarEntityParts('bear'), runtimePalette)
      const saved = {
        ...definition,
        scene: {
          ...definition.scene,
          appearance: {
            ...definition.scene.appearance,
            coatPattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true },
            paletteId: basePalette.id
          },
          entity: { parts, preset: 'bear' as const }
        }
      }

      act(() => root.render(createElement(Avatar, { definition: saved })))

      expect(runtimePalette.id).toBe(basePalette.id)
      expect(parts.find(part => part.face)?.baseColor).toBe(runtimePalette.background)
      expect(parts.find(part => part.face)?.baseColor).not.toBe(basePalette.background)
      expect(host.querySelector('[data-avatar-surface-decal="coat-bear-panda-muzzle"]')?.getAttribute('fill'))
        .toBe(runtimePalette.coat!.patch)
      expect(host.querySelector('[data-avatar-surface-decal="coat-bear-panda-muzzle"]')?.getAttribute('fill'))
        .not.toBe(basePalette.coat!.patch)
      expect(host.querySelector('[data-avatar-surface-decal="coat-bear-panda-eye-left"]')?.getAttribute('fill'))
        .toBe(basePalette.coat!.mark)
      expect(host.querySelector('[data-avatar-entity-part="primary"] g path[fill]')?.getAttribute('fill'))
        .toBe(runtimePalette.entityMaterials!.primary!.baseColor)
      expect(host.querySelector('[data-avatar-entity-part="primary"] g path[fill]')?.getAttribute('fill'))
        .not.toBe(runtimePalette.coat!.patch)
      expect(saved.scene.appearance.paletteId).toBe('giant-panda')
    }
  })

  it('preserves saved fur tones and their curved face markings while an animation changes the pose', async () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const definition = createDefaultAvatarDefinition()
    const basePalette = getAvatarPalette('giant-panda')
    const runtimePalette = applyAvatarPaletteToneJitter(basePalette, -16)
    const parts = applyAvatarEntityPalette(createAvatarEntityParts('bear'), runtimePalette)
    const saved = {
      ...definition,
      scene: {
        ...definition.scene,
        appearance: {
          ...definition.scene.appearance,
          coatPattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true },
          paletteId: basePalette.id
        },
        entity: { parts, preset: 'bear' as const }
      }
    }
    const ref = createRef<AvatarHandle>()

    act(() => root.render(createElement(Avatar, { definition: saved, ref })))
    await act(async () => ref.current?.play({
      anchor: 'relative',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { view: { yaw: 0 } } },
        { atMs: 900, patch: { view: { yaw: .55 } } }
      ],
      playback: 'loop'
    }))
    act(() => ref.current?.seek(450))

    expect(host.querySelector('[data-avatar-entity-part="primary"] g path[fill]')?.getAttribute('fill'))
      .toBe(runtimePalette.entityMaterials!.primary!.baseColor)
    expect(host.querySelector('[data-avatar-surface-decal="coat-bear-panda-muzzle"]')?.getAttribute('fill'))
      .toBe(runtimePalette.coat!.patch)
    expect(host.querySelector('[data-avatar-surface-decal="coat-bear-panda-eye-left"]')?.getAttribute('fill'))
      .toBe(basePalette.coat!.mark)
    expect(ref.current?.getDefinition().scene.appearance.paletteId).toBe(basePalette.id)
    expect(ref.current?.getDefinition().scene.entity.parts).toEqual(parts)
  })

  it('keeps manually authored face colors and the camera background unchanged across fur tone changes', () => {
    const definition = createDefaultAvatarDefinition()
    const basePalette = getAvatarPalette('giant-panda')
    const pattern = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true }
    const manualMuzzle = {
      ...resolveAvatarCoatPatternDecals({
        entityParts: createAvatarEntityParts('bear'),
        entityPreset: 'bear',
        paletteId: basePalette.id,
        pattern
      }).find(decal => decal.id === 'coat-bear-panda-muzzle')!,
      color: '#12ab34'
    }

    for (const amount of [-6, 4]) {
      const palette = applyAvatarPaletteToneJitter(basePalette, amount)
      const parts = applyAvatarEntityPalette(createAvatarEntityParts('bear'), palette)
      act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: {
            ...definition.scene,
            appearance: { ...definition.scene.appearance, coatPattern: pattern, paletteId: basePalette.id },
            camera: { ...definition.scene.camera, background: '#124578' },
            decals: [manualMuzzle],
            entity: { parts, preset: 'bear' }
          }
        }
      })))

      expect(host.querySelector('[data-avatar-surface-decal="coat-bear-panda-muzzle"]')?.getAttribute('fill'))
        .toBe('#12ab34')
      expect(host.querySelector('[data-avatar-entity-part="primary"] g path[fill]')?.getAttribute('fill'))
        .toBe(palette.entityMaterials!.primary!.baseColor)
      expect(host.querySelector<HTMLElement>('.oneworks-avatar')?.style
        .getPropertyValue('--oneworks-avatar-background')).toBe('#124578')
    }
  })

  it('projects procedural coat marks on the back of the head', () => {
    const definition = createDefaultAvatarDefinition()
    act(() => root.render(createElement(Avatar, {
      definition: {
        ...definition,
        scene: {
          ...definition.scene,
          appearance: {
            ...definition.scene.appearance,
            coatPattern: {
              ...DEFAULT_AVATAR_COAT_PATTERN,
              algorithm: 'mackerel',
              density: 100,
              enabled: true
            },
            paletteId: 'tabby'
          },
          entity: { parts: createAvatarEntityParts('cat'), preset: 'cat' },
          view: { ...definition.scene.view, yaw: Math.PI }
        }
      }
    })))

    expect(host.querySelectorAll('[data-avatar-surface-decal*="back-"]').length).toBeGreaterThan(0)
  })

  it('keeps fox breed ears and colored markings attached to their true three-dimensional surfaces', () => {
    const definition = createDefaultAvatarDefinition()
    const renderFox = (
      parts: ReturnType<typeof createAvatarEntityParts>,
      decals = createFoxSurfaceDecals()
    ) => act(() => root.render(createElement(Avatar, {
      definition: {
        ...definition,
        scene: {
          ...definition.scene,
          decals,
          entity: { parts, preset: 'fox' },
          view: { ...definition.scene.view, pitch: -.16, yaw: .28 }
        }
      }
    })))

    renderFox(createAvatarEntityParts('fox'))
    const originalCheek = host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')?.getAttribute('d')
    const originalEar = host.querySelector('[data-avatar-entity-part="fox-ear-left"] g')?.getAttribute('transform')

    const arctic = applyFoxHeadTaper(
      applyFoxHeadScale(
        applyFoxEarScale(applyFoxEarStyle(createAvatarEntityParts('fox'), 'rounded'), 72, 70),
        84,
        90
      ),
      24
    )
    renderFox(arctic, createFoxSurfaceDecals({
      cheekColor: '#ffffff',
      cheekScale: 112,
      innerEarColor: '#f2d3d0',
      innerEarScale: 78
    }))

    expect(host.querySelectorAll('[data-avatar-entity-part]')).toHaveLength(arctic.length)
    const cheek = host.querySelector(
      '[data-avatar-entity-part="fox-head"] [data-avatar-surface-decal="fox-cheek-left"]'
    )
    const innerEar = host.querySelector(
      '[data-avatar-entity-part="fox-ear-left"] [data-avatar-surface-decal="fox-inner-ear-left"]'
    )
    expect(cheek?.getAttribute('fill')).toBe('#ffffff')
    expect(cheek?.getAttribute('d')).not.toBe(originalCheek)
    expect(innerEar?.getAttribute('fill')).toBe('#f2d3d0')
    expect(host.querySelector('[data-avatar-entity-part="fox-ear-left"] g')?.getAttribute('transform'))
      .not.toBe(originalEar)

    const fennec = applyFoxHeadScale(
      applyFoxEarScale(applyFoxEarStyle(createAvatarEntityParts('fox'), 'fennec'), 164, 176),
      96,
      104
    )
    renderFox(fennec)

    for (const side of ['left', 'right']) {
      expect(host.querySelector(
        `[data-avatar-entity-part="fox-ear-${side}"] [data-avatar-surface-decal="fox-inner-ear-${side}"]`
      )).not.toBeNull()
      expect(host.querySelector(
        `[data-avatar-entity-part="fox-head"] [data-avatar-surface-decal="fox-cheek-${side}"]`
      )).not.toBeNull()
    }
  })

  it('renders the six new animal anatomies as independently projected three-dimensional parts', () => {
    const definition = createDefaultAvatarDefinition()
    const animals = [
      { identifiers: ['cheek-left', 'cheek-right'], preset: 'hamster' },
      { identifiers: ['muzzle'], preset: 'capybara' },
      { identifiers: ['ear-left', 'ear-right', 'primary'], preset: 'otter' },
      { identifiers: ['snout', 'nostril-left', 'nostril-right'], preset: 'pig' },
      { identifiers: ['antler-left-branch-3', 'antler-right-branch-3'], preset: 'deer' },
      { identifiers: ['wool-crown-center', 'horn-left-segment-3'], preset: 'sheep' }
    ] as const

    for (const animal of animals) {
      let parts = createAvatarEntityParts(animal.preset)
      if (animal.preset === 'deer') parts = applyDeerAntlerStyle(parts, 'reindeer')
      if (animal.preset === 'sheep') parts = applySheepHornStyle(parts, 'curled')

      act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: {
            ...definition.scene,
            entity: { parts, preset: animal.preset },
            view: { ...definition.scene.view, pitch: -.2, yaw: .48 }
          }
        }
      })))

      expect(host.querySelector(`[data-avatar-entity-preset="${animal.preset}"]`)).not.toBeNull()
      expect(host.querySelectorAll('[data-avatar-entity-part]')).toHaveLength(parts.length)
      for (const identifier of animal.identifiers) {
        const part = host.querySelector(`[data-avatar-entity-part="${identifier}"]`)
        expect(part, `${animal.preset} must render its real ${identifier} geometry`).not.toBeNull()
        expect(part?.querySelector('g')?.getAttribute('transform')).toContain('translate(')
      }

      if (animal.preset === 'pig') {
        const snout = host.querySelector('[data-avatar-entity-part="snout"]')!
        for (const identifier of ['nostril-left', 'nostril-right']) {
          const nostril = host.querySelector(`[data-avatar-entity-part="${identifier}"]`)!
          expect(
            Number(snout.getAttribute('data-avatar-fragment-patches')) +
            Number(nostril.getAttribute('data-avatar-fragment-patches')),
            `pig ${identifier} and snout must resolve their overlap from local surface depth`
          ).toBeGreaterThan(0)
        }
      }
    }
  })

  it('renders all six next-generation animal anatomies as independently projected three-dimensional parts', () => {
    const definition = createDefaultAvatarDefinition()
    const animals = [
      { identifiers: ['forelock-left', 'forelock-center', 'forelock-right'], paletteId: 'cream-alpaca', preset: 'alpaca' },
      { identifiers: ['horn-left-segment-1', 'forelock-left', 'snout', 'nostril-left', 'nostril-right'], paletteId: 'highland-cow', preset: 'cow' },
      { identifiers: ['tail-base', 'tail-tip', 'tail-fringe', 'cheek-left'], paletteId: 'red-squirrel', preset: 'squirrel' },
      { identifiers: ['ear-left', 'ear-right', 'primary'], paletteId: 'bengal-tiger', preset: 'tiger' },
      { identifiers: ['mane-back', 'mane-top', 'mane-left', 'mane-bottom'], paletteId: 'african-lion', preset: 'lion' },
      { identifiers: ['spine-core', 'spine-0', 'spine-7', 'spine-13'], paletteId: 'european-hedgehog', preset: 'hedgehog' }
    ] as const

    for (const animal of animals) {
      let parts = createAvatarEntityParts(animal.preset)
      if (animal.preset === 'cow') {
        parts = applyCowForelockStyle(applyCowHornStyle(parts, 'highland'), 'highland')
      }

      const render = (yaw: number) => act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: {
            ...definition.scene,
            appearance: { ...definition.scene.appearance, paletteId: animal.paletteId },
            entity: { parts, preset: animal.preset },
            face: getAvatarEntityPresetFaceStyle(animal.preset)!,
            view: { ...definition.scene.view, pitch: -.21, yaw }
          }
        }
      })))

      render(.22)
      expect(host.querySelectorAll('[data-avatar-entity-part]')).toHaveLength(parts.length)
      for (const identifier of animal.identifiers) {
        const part = host.querySelector(`[data-avatar-entity-part="${identifier}"]`)
        expect(part, `${animal.preset} must project its genuine ${identifier} anatomy`).not.toBeNull()
        expect(part?.querySelector('g')?.getAttribute('transform')).toContain('translate(')
      }

      const feature = animal.identifiers[0]
      const before = host.querySelector(`[data-avatar-entity-part="${feature}"] g`)?.getAttribute('transform')
      render(.94)
      const after = host.querySelector(`[data-avatar-entity-part="${feature}"] g`)?.getAttribute('transform')
      expect(after, `${animal.preset} ${feature} must rotate with the real head`).not.toBe(before)
    }
  })

  it('switches real lion mane and hedgehog quill topology without leaving floating geometry', () => {
    const definition = createDefaultAvatarDefinition()
    const render = (preset: 'hedgehog' | 'lion', parts: ReturnType<typeof createAvatarEntityParts>) => {
      act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: { ...definition.scene, entity: { parts, preset } }
        }
      })))
    }

    const lion = createAvatarEntityParts('lion')
    render('lion', lion)
    expect(host.querySelectorAll('[data-avatar-entity-part^="mane-"]')).toHaveLength(9)
    render('lion', applyLionManeStyle(lion, 'none'))
    expect(host.querySelectorAll('[data-avatar-entity-part^="mane-"]')).toHaveLength(0)
    render('lion', applyLionManeStyle(lion, 'juvenile'))
    expect(host.querySelectorAll('[data-avatar-entity-part^="mane-"]')).toHaveLength(3)

    const hedgehog = createAvatarEntityParts('hedgehog')
    render('hedgehog', hedgehog)
    expect(host.querySelectorAll('[data-avatar-entity-part^="spine-"]')).toHaveLength(15)
    render('hedgehog', applyHedgehogSpineStyle(hedgehog, 'short'))
    expect(host.querySelectorAll('[data-avatar-entity-part^="spine-"]')).toHaveLength(8)
  })

  it('projects animal face color onto the head surface without adding floating muzzle geometry', () => {
    const definition = createDefaultAvatarDefinition()

    for (const { color, createDecals, paletteId, preset } of [
      { color: '#e5d0ad', createDecals: createOtterSurfaceDecals, paletteId: 'river-otter', preset: 'otter' },
      { color: '#f5e7cf', createDecals: createDeerSurfaceDecals, paletteId: 'sika-deer', preset: 'deer' },
      { color: '#39353a', createDecals: createSheepSurfaceDecals, paletteId: 'black-faced-sheep', preset: 'sheep' }
    ] as const) {
      const parts = applyAvatarEntityPalette(createAvatarEntityParts(preset), getAvatarPalette(paletteId))
      const face = getAvatarEntityPresetFaceStyle(preset)!
      const render = (yaw: number, pitch: number) => act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: {
            ...definition.scene,
            appearance: { ...definition.scene.appearance, paletteId },
            decals: createDecals({ color }),
            entity: { parts, preset },
            face,
            view: { ...definition.scene.view, pitch, yaw }
          }
        }
      })))

      render(.15, -.1)
      const initial = host.querySelector(
        `[data-avatar-entity-part="primary"] [data-avatar-surface-decal="${preset}-face-mask"]`
      )

      expect(initial, `${preset} mask must be projected inside its real head part`).not.toBeNull()
      expect(initial?.getAttribute('fill')).toBe(color)
      expect(initial?.parentElement?.getAttribute('clip-path')).toContain(`-entity-${preset}-`)
      expect(host.querySelector('[data-avatar-entity-part="muzzle"]')).toBeNull()
      expect(face.eyeShape).toBe('rounded')
      expect(host.querySelector('[data-visible-marks]')?.getAttribute('data-visible-marks')).toBe('3')

      const originalPath = initial?.getAttribute('d')
      render(.86, -.28)
      const turned = host.querySelector(
        `[data-avatar-entity-part="primary"] [data-avatar-surface-decal="${preset}-face-mask"]`
      )

      expect(turned, `${preset} surface mask must follow the head during side views`).not.toBeNull()
      expect(turned?.getAttribute('d')).not.toBe(originalPath)
      expect(turned?.getAttribute('d')).not.toContain('NaN')

      if (preset === 'sheep') {
        expect(parts.find(part => part.face)?.foregroundColor).not.toBe(color)
      }
    }
  })

  it('projects cheek and muzzle fur onto their actual moving anatomy instead of coloring the volume', () => {
    const definition = createDefaultAvatarDefinition()

    for (const { createDecals, paletteId, preset, targets } of [
      {
        createDecals: createHamsterSurfaceDecals,
        paletteId: 'syrian-hamster',
        preset: 'hamster',
        targets: [
          { id: 'hamster-cheek-left', partId: 'cheek-left' },
          { id: 'hamster-cheek-right', partId: 'cheek-right' }
        ]
      },
      {
        createDecals: createCapybaraSurfaceDecals,
        paletteId: 'capybara',
        preset: 'capybara',
        targets: [{ id: 'capybara-muzzle-fur', partId: 'muzzle' }]
      },
      {
        createDecals: createSquirrelSurfaceDecals,
        paletteId: 'chipmunk',
        preset: 'squirrel',
        targets: [
          { id: 'squirrel-cheek-left', partId: 'cheek-left' },
          { id: 'squirrel-cheek-right', partId: 'cheek-right' }
        ]
      }
    ] as const) {
      const palette = applyAvatarPaletteToneJitter(getAvatarPalette(paletteId), 7)
      const parts = applyAvatarEntityPalette(createAvatarEntityParts(preset), palette)
      const head = parts.find(part => part.face)!
      const color = palette.coat!.patch
      const render = (yaw: number, pitch: number) => act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: {
            ...definition.scene,
            appearance: { ...definition.scene.appearance, paletteId },
            decals: createDecals({ color }),
            entity: { parts, preset },
            view: { ...definition.scene.view, pitch, yaw }
          }
        }
      })))

      render(.12, -.1)

      for (const target of targets) {
        const anatomy = parts.find(part => part.id === target.partId)!
        const query = `[data-avatar-entity-part="${target.partId}"] [data-avatar-surface-decal="${target.id}"]`
        const initial = host.querySelector(query)

        expect(anatomy.baseColor, `${preset}/${target.partId} anatomical volume must match its head`)
          .toBe(head.baseColor)
        expect(initial, `${preset}/${target.id} fur must be projected onto its actual 3D anatomy`)
          .not.toBeNull()
        expect(initial?.getAttribute('fill')).toBe(color)
        expect(initial?.parentElement?.getAttribute('clip-path')).toContain(`-entity-${preset}-`)
        expect(color).not.toBe(head.baseColor)

        const originalPath = initial?.getAttribute('d')
        render(.73, -.24)

        const turned = host.querySelector(query)
        expect(turned, `${preset}/${target.id} must remain attached during a real 3D turn`).not.toBeNull()
        expect(turned?.getAttribute('d')).not.toBe(originalPath)
        expect(turned?.getAttribute('d')).not.toContain('NaN')

        render(.12, -.1)
      }

      if (preset === 'hamster') {
        expect(host.querySelector('[data-avatar-entity-part="ear-left"] [data-avatar-surface-decal="hamster-inner-ear-left"]'))
          .not.toBeNull()
      }
    }
  })

  it('keeps every next-generation face marking projected onto its actual rotating head surface', () => {
    const definition = createDefaultAvatarDefinition()
    const animals = [
      { createDecals: createAlpacaSurfaceDecals, paletteId: 'cream-alpaca', preset: 'alpaca' },
      { createDecals: createCowSurfaceDecals, paletteId: 'dairy-cow', preset: 'cow' },
      { createDecals: createSquirrelSurfaceDecals, paletteId: 'red-squirrel', preset: 'squirrel' },
      { createDecals: createTigerSurfaceDecals, paletteId: 'bengal-tiger', preset: 'tiger' },
      { createDecals: createLionSurfaceDecals, paletteId: 'african-lion', preset: 'lion' },
      { createDecals: createHedgehogSurfaceDecals, paletteId: 'european-hedgehog', preset: 'hedgehog' }
    ] as const

    for (const animal of animals) {
      const parts = createAvatarEntityParts(animal.preset)
      const render = (yaw: number) => act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: {
            ...definition.scene,
            appearance: { ...definition.scene.appearance, paletteId: animal.paletteId },
            decals: animal.createDecals(),
            entity: { parts, preset: animal.preset },
            view: { ...definition.scene.view, pitch: -.23, yaw }
          }
        }
      })))

      render(.12)
      const query = `[data-avatar-entity-part="primary"] [data-avatar-surface-decal="${animal.preset}-face-mask"]`
      const initial = host.querySelector(query)
      expect(initial, `${animal.preset} face marking must be projected onto its real head`).not.toBeNull()
      const initialPath = initial?.getAttribute('d')
      render(.84)
      const turned = host.querySelector(query)
      expect(turned?.getAttribute('d')).not.toBe(initialPath)
      expect(turned?.getAttribute('d')).not.toContain('NaN')
      expect(host.querySelector('[data-avatar-entity-part="muzzle"]')).toBeNull()
    }
  })

  it('renders pig and deer coat spots on their real curved head and ear geometry', () => {
    const definition = createDefaultAvatarDefinition()

    for (const { paletteId, preset } of [
      { paletteId: 'spotted-pig', preset: 'pig' },
      { paletteId: 'sika-deer', preset: 'deer' }
    ] as const) {
      act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: {
            ...definition.scene,
            appearance: {
              ...definition.scene.appearance,
              coatPattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true },
              paletteId
            },
            entity: { parts: createAvatarEntityParts(preset), preset }
          }
        }
      })))

      expect(host.querySelectorAll(`[data-avatar-surface-decal^="coat-${preset}-spots-"]`).length)
        .toBeGreaterThan(0)
      expect(host.querySelector(`[data-avatar-entity-part="ear-left"] [data-avatar-surface-decal^="coat-${preset}-spots-"]`))
        .not.toBeNull()
    }
  })

  it('renders dairy-cow spots, curved chipmunk bands, and real projected tiger stripes', () => {
    const definition = createDefaultAvatarDefinition()

    for (const { paletteId, prefix, preset } of [
      { paletteId: 'dairy-cow', prefix: 'coat-cow-spots-', preset: 'cow' },
      { paletteId: 'chipmunk', prefix: 'coat-chipmunk-', preset: 'squirrel' },
      { paletteId: 'bengal-tiger', prefix: 'coat-tiger-mackerel-', preset: 'tiger' }
    ] as const) {
      act(() => root.render(createElement(Avatar, {
        definition: {
          ...definition,
          scene: {
            ...definition.scene,
            appearance: {
              ...definition.scene.appearance,
              coatPattern: {
                ...DEFAULT_AVATAR_COAT_PATTERN,
                algorithm: 'mackerel',
                density: 100,
                enabled: true
              },
              paletteId
            },
            entity: { parts: createAvatarEntityParts(preset), preset },
            view: { ...definition.scene.view, pitch: -.16, yaw: .58 }
          }
        }
      })))

      expect(host.querySelectorAll(`[data-avatar-surface-decal^="${prefix}"]`).length,
        `${preset} must have projected anatomical coat markings`).toBeGreaterThan(0)
      expect(host.querySelector(
        `[data-avatar-entity-part="primary"] [data-avatar-surface-decal^="${prefix}"]`
      )).not.toBeNull()
      if (preset !== 'squirrel') {
        expect(host.querySelector(
          `[data-avatar-entity-part="ear-left"] [data-avatar-surface-decal^="${prefix}"]`
        )).not.toBeNull()
      }
    }
  })

  it('renders a breed-specific koala nose from the public face definition', () => {
    const definition = createDefaultAvatarDefinition()
    const koalaFace = resolveAvatarEntityPresetFaceStyle('bear', {
      noseEnabled: true,
      noseHeight: 42,
      noseShape: 'ellipse',
      noseWidth: 32,
      noseY: 30
    })!

    act(() => root.render(createElement(Avatar, {
      definition: {
        ...definition,
        scene: {
          ...definition.scene,
          entity: { parts: createAvatarEntityParts('bear'), preset: 'bear' },
          face: koalaFace
        }
      }
    })))

    expect(host.querySelector('[data-avatar-entity-preset="bear"]')).not.toBeNull()
    expect(host.querySelector('[data-visible-marks]')?.getAttribute('data-visible-marks')).toBe('3')
    expect(koalaFace).toMatchObject({ noseEnabled: true, noseHeight: 42, noseShape: 'ellipse', noseWidth: 32 })
  })

  it('renders every part in a custom multipart definition', () => {
    const definition = createDefaultAvatarDefinition()
    const parts = createAvatarEntityParts('dog')
    const custom = {
      ...definition,
      scene: {
        ...definition.scene,
        decals: [{
          color: '#f29a93', height: 18, id: 'blush-left', label: 'Left blush', opacity: 90,
          rotation: -8, shape: 'ellipse' as const, targetPartId: null,
          width: 30, x: -48, y: 30
        }],
        entity: { parts, preset: 'custom' as const },
        face: {
          ...definition.scene.face,
          eyeHighlight: { ...definition.scene.face.eyeHighlight, enabled: true }
        }
      }
    }

    act(() => root.render(createElement(Avatar, { definition: custom })))

    expect(host.querySelector('[data-avatar-entity-preset="custom"]')).not.toBeNull()
    expect(
      [...host.querySelectorAll('[data-avatar-entity-part]')].map(node =>
        node.getAttribute('data-avatar-entity-part')
      )
    ).toEqual(expect.arrayContaining(parts.map(part => part.id)))
    expect(host.querySelectorAll('[data-avatar-entity-part]')).toHaveLength(parts.length)
    expect(host.querySelector('[data-avatar-surface-decal="blush-left"]')).not.toBeNull()
    expect(host.querySelector('[data-avatar-surface-decal="blush-left"]')?.parentElement?.getAttribute('clip-path'))
      .toContain('-entity-custom-')
    expect(host.querySelectorAll('[data-avatar-eye-highlight]')).toHaveLength(2)
    expect(host.querySelector('[data-avatar-eye-highlight]')?.getAttribute('clip-path')).toContain('highlight-clip')
  })

  it('clips decals to a hollow part and redraws its cavity above them', () => {
    const definition = createDefaultAvatarDefinition()
    const parts = createAvatarEntityParts('dog').map((part, index) => index === 0 ? { ...part, hollow: true } : part)
    const target = parts[0]!
    act(() => root.render(createElement(Avatar, {
      definition: {
        ...definition,
        scene: {
          ...definition.scene,
          decals: [{
            color: '#ffffff', height: 180, id: 'large', label: 'Large', opacity: 100,
            rotation: 0, shape: 'ellipse', targetPartId: target.id, width: 180, x: 0, y: 0
          }],
          entity: { parts, preset: 'custom' }
        }
      }
    })))

    const decal = host.querySelector('[data-avatar-surface-decal="large"]')!
    const cavity = host.querySelector(`[data-avatar-entity-cavity="${target.id}"]`)!
    expect(decal.parentElement?.getAttribute('clip-path')).toContain('-entity-custom-')
    expect(decal.compareDocumentPosition(cavity) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
  })

  it('renders the definition camera frame shadow', () => {
    const definition = createDefaultAvatarDefinition()
    act(() => root.render(createElement(Avatar, { definition })))

    const frame = host.querySelector<HTMLElement>('.oneworks-avatar')
    expect(frame?.style.boxShadow).toContain('12.00px')
    expect(frame?.style.boxShadow).toContain('color-mix')

    act(() => root.render(createElement(Avatar, {
      definition: {
        ...definition,
        scene: {
          ...definition.scene,
          camera: { ...definition.scene.camera, showFrameShadow: false }
        }
      }
    })))
    expect(frame?.style.boxShadow).toBe('none')
  })

  it('keeps the camera frame shadow in the preview and out of captured SVG', async () => {
    const definition = createDefaultAvatarDefinition()
    const ref = createRef<AvatarHandle>()
    act(() => root.render(createElement(Avatar, { definition, ref })))

    expect(host.querySelector<HTMLElement>('.oneworks-avatar')?.style.boxShadow).toContain('12.00px')

    const blob = await ref.current!.capture({ format: 'svg', size: 256 })
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(reader.error)
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(blob)
    })
    expect(source).toContain('oneworks-avatar-export-frame')
    expect(source).not.toContain('oneworks-avatar-export-frame-shadow')
    expect(source).not.toContain('translate(36 36) scale(')
  })
})
