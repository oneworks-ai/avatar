// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDefaultAvatarDefinition, getAvatarPalette } from '@oneworks/avatar'
import type { AvatarAnimationEntityPart } from '@oneworks/avatar'

vi.mock('../src/avatarPixelation', () => ({
  paintPixelatedAvatarCanvas: vi.fn()
}))

import {
  createAvatarEntityParts,
  createBeaverSurfaceDecals,
  createOwlSurfaceDecals,
  getAvatarEntityPresetFaceStyle,
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
  it('applies semantic part transforms after compilation so face, decals, and selection travel together', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const parts = createAvatarEntityParts('bear')
    const faceStyle = getAvatarEntityPresetFaceStyle('bear')!
    const surfaceDecals: readonly AvatarSurfaceDecal[] = [{
      color: '#f3caa3',
      height: 92,
      id: 'bear-test-face-coat',
      label: 'Bear test face coat',
      opacity: 100,
      rotation: 0,
      shape: 'face-mask',
      side: 'face',
      targetPartId: 'primary',
      width: 104,
      x: 0,
      y: 24
    }]
    const render = (partTransforms?: {
      readonly [id: string]: {
        readonly rotationZ?: number
        readonly scaleX?: number
        readonly scaleY?: number
        readonly x?: number
        readonly y?: number
      }
    }, auxiliaryParts?: readonly AvatarAnimationEntityPart[], yaw = 0) => createElement(InteractiveAvatar, {
      auxiliaryParts,
      bodyShape: scene.appearance.bodyShape,
      entityParts: parts,
      entityPreset: 'bear' as const,
      faceStyle,
      interactive: true,
      interactionMode: 'rotate' as const,
      lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
      onViewStateChange: vi.fn(),
      palette: getAvatarPalette('brown-bear'),
      partShapeMorphs: auxiliaryParts == null ? undefined : {
        'alert-stem': { fromShape: 'sphere' as const, progress: 1, toShape: 'teardrop' as const },
        primary: { fromShape: 'trapezoid' as const, progress: 1, toShape: 'sphere' as const }
      },
      partTransforms,
      selectedEntityPartId: 'primary',
      shadowStyle: scene.effects.faceShadow,
      showLight: false,
      showShadow: false,
      surfaceDecals,
      viewState: { ...scene.view, pitch: 0, yaw }
    })

    act(() => root.render(render()))
    const compileCount = host.querySelector('[data-avatar-entity-fragment-root]')
      ?.getAttribute('data-avatar-fragment-compile-count')

    const stemSource = parts.find(part => part.id === 'primary')!
    const auxiliaryParts: readonly AvatarAnimationEntityPart[] = [{
      opacity: 100,
      part: {
        ...stemSource,
        face: false,
        id: 'alert-stem',
        label: 'Alert droplet',
        roundness: 88,
        scaleX: .11,
        scaleY: .32,
        scaleZ: .15,
        shape: 'teardrop',
        x: 0,
        y: -30,
        z: 0
      },
      transform: { rotationZ: 0, scaleX: .11, scaleY: .32, x: 0, y: -30, z: 0 }
    }]
    act(() => root.render(render({
      'ear-left': { rotationZ: 0, scaleX: .18, scaleY: .18, x: -58, y: 10 },
      'ear-right': { rotationZ: 0, scaleX: .18, scaleY: .18, x: 58, y: 10 },
      primary: { rotationZ: 0, scaleX: .3, scaleY: .3, x: 0, y: -4 }
    }, auxiliaryParts)))

    const renderer = host.querySelector('[data-avatar-entity-fragment-root]')!
    const primary = renderer.querySelector('[data-avatar-entity-part="primary"]')!
    const leftEar = renderer.querySelector('[data-avatar-entity-part="ear-left"]')!
    const decal = primary.querySelector('[data-avatar-surface-decal="bear-test-face-coat"]')
    const alertStem = host.querySelector('[data-avatar-animation-entity-part="alert-stem"]')
    const frontStemPath = alertStem?.querySelector('path')?.getAttribute('d')
    const animationCompileCount = renderer.getAttribute('data-avatar-fragment-compile-count')
    expect(Number(animationCompileCount)).toBeGreaterThanOrEqual(Number(compileCount))
    expect(leftEar.getAttribute('data-avatar-part-geometry')).toBe('full-semantic')
    expect(primary.getAttribute('data-avatar-part-transform')).toBe('projection-time')
    expect(primary.getAttribute('data-avatar-part-shape-morph')).toBe('1')
    expect(primary.getAttribute('transform')).toContain('scale(')
    expect(primary.querySelector('[data-avatar-face-feature="nose"]')).not.toBeNull()
    expect(decal).not.toBeNull()
    expect(decal?.closest('[data-avatar-entity-part]')).toBe(primary)
    expect(alertStem).not.toBeNull()
    expect(alertStem?.getAttribute('data-avatar-entity-part')).toBe('alert-stem')
    expect(alertStem?.querySelector('path')).not.toBeNull()
    expect(host.querySelector('[data-avatar-animation-shape="alert-stem"]')).toBeNull()
    expect(renderer.querySelector('[data-avatar-entity-selection="primary"]')?.getAttribute('transform'))
      .toBe(primary.getAttribute('transform'))

    act(() => root.render(render({
      'ear-left': { rotationZ: 0, scaleX: .18, scaleY: .18, x: -58, y: 10 },
      'ear-right': { rotationZ: 0, scaleX: .18, scaleY: .18, x: 58, y: 10 },
      primary: { rotationZ: 0, scaleX: .3, scaleY: .3, x: 0, y: -4 }
    }, auxiliaryParts, .8)))
    const rotatedStem = host.querySelector('[data-avatar-animation-entity-part="alert-stem"]')
    expect(rotatedStem?.querySelector('path')?.getAttribute('d')).not.toBe(frontStemPath)
    expect(host.querySelector('[data-avatar-entity-fragment-root]')
      ?.getAttribute('data-avatar-fragment-compile-count')).toBe(animationCompileCount)
  })

  it('composites the notification sphere independently without changing any bear owner geometry', () => {
    const definition = createDefaultAvatarDefinition()
    const scene = definition.scene
    const cameraBackground = '#382641'
    const parts = createAvatarEntityParts('bear')
    const primary = parts.find(part => part.id === 'primary')!
    const faceStyle = getAvatarEntityPresetFaceStyle('bear')!
    const surfaceDecals: readonly AvatarSurfaceDecal[] = [{
      color: '#f3caa3',
      height: 92,
      id: 'notification-regression-face-coat',
      label: 'Notification regression face coat',
      opacity: 100,
      rotation: 0,
      shape: 'face-mask',
      side: 'face',
      targetPartId: 'primary',
      width: 104,
      x: 0,
      y: 24
    }]
    const badgePart = {
      ...primary,
      face: false,
      id: 'notification-orb',
      label: 'Notification badge',
      scaleX: .15,
      scaleY: .15,
      scaleZ: .15,
      shape: 'sphere' as const,
      x: 112,
      y: -86,
      z: 28
    }
    const notification = (
      opacity: number,
      scale: number
    ): readonly AvatarAnimationEntityPart[] => [{
      composition: 'independent-depth',
      opacity,
      part: badgePart,
      transform: { scaleX: scale, scaleY: scale, scaleZ: scale, x: 112, y: -86, z: 28 }
    }]
    const render = (auxiliaryParts?: readonly AvatarAnimationEntityPart[], yaw = 0) => createElement(
      InteractiveAvatar,
      {
        auxiliaryParts,
        avatarOutlineStyle: { color: '#101010', opacity: 100, width: 5 },
        backgroundStyle: scene.appearance.backgroundStyle,
        bodyShape: scene.appearance.bodyShape,
        canvasBackgroundColor: cameraBackground,
        entityParts: parts,
        entityPreset: 'bear' as const,
        faceStyle,
        interactive: true,
        interactionMode: 'rotate' as const,
        lightDirection: { azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation },
        onViewStateChange: vi.fn(),
        palette: getAvatarPalette('brown-bear'),
        shadowStyle: scene.effects.faceShadow,
        showLight: false,
        showOutline: true,
        showShadow: false,
        surfaceDecals,
        viewState: { ...scene.view, pitch: 0, yaw }
      }
    )
    const baseRoot = () => [...host.querySelectorAll('[data-avatar-entity-fragment-root]')].find(
      candidate => candidate.querySelector('[data-avatar-entity-part="primary"]') != null
    )!
    const bearFingerprint = () => parts.map(part => (
      baseRoot().querySelector(`[data-avatar-entity-part="${part.id}"]`)?.outerHTML
    )).join('|')

    act(() => root.render(render()))
    const frontBaseline = bearFingerprint()
    const frontRevision = baseRoot().getAttribute('data-avatar-fragment-revision')

    act(() => root.render(render(notification(0, .03))))
    expect(host.querySelectorAll('[data-avatar-entity-fragment-root]')).toHaveLength(1)
    expect(host.querySelector('[data-avatar-entity-part="notification-orb"]')).toBeNull()
    expect(bearFingerprint()).toBe(frontBaseline)
    expect(baseRoot().getAttribute('data-avatar-fragment-revision')).toBe(frontRevision)

    act(() => root.render(render(notification(100, 0))))
    expect(host.querySelectorAll('[data-avatar-entity-fragment-root]')).toHaveLength(1)
    expect(bearFingerprint()).toBe(frontBaseline)

    act(() => root.render(render(notification(100, .19))))
    const badge = host.querySelector('[data-avatar-entity-part="notification-orb"]')!
    const badgeRoot = badge.closest('[data-avatar-entity-fragment-root]')!
    expect(host.querySelectorAll('[data-avatar-entity-fragment-root]')).toHaveLength(2)
    expect(badgeRoot).not.toBe(baseRoot())
    expect(badge.closest('[data-avatar-auxiliary-composition]')?.getAttribute('data-avatar-auxiliary-composition'))
      .toBe('independent-depth-layer')
    expect(badge.closest('[data-avatar-auxiliary-depth-layer]')?.getAttribute('data-avatar-auxiliary-depth-layer'))
      .toBe('front')
    expect(badge.getAttribute('data-avatar-part-geometry')).toBe('compiled-owner')
    expect(badge.getAttribute('data-avatar-part-outline')).toBe('independent-geometry')
    expect(badge.querySelector(`path[fill="${badgePart.baseColor}"]`)).not.toBeNull()
    const badgeOutline = badge.querySelector('[data-avatar-independent-outline="notification-orb"]')
    expect(badgeOutline?.getAttribute('stroke')).toBe(cameraBackground)
    expect(badgeOutline?.getAttribute('stroke-opacity')).toBe('1')
    expect(badgeOutline?.getAttribute('stroke-width')).toBe('5')
    expect(badgeOutline?.getAttribute('vector-effect')).toBe('non-scaling-stroke')
    const badgeRevision = badgeRoot.getAttribute('data-avatar-fragment-revision')
    act(() => root.render(render(notification(100, .12))))
    expect(host.querySelector('[data-avatar-entity-part="notification-orb"]')
      ?.closest('[data-avatar-entity-fragment-root]')?.getAttribute('data-avatar-fragment-revision'))
      .toBe(badgeRevision)
    expect(bearFingerprint()).toBe(frontBaseline)
    expect(baseRoot().getAttribute('data-avatar-fragment-revision')).toBe(frontRevision)

    act(() => root.render(render(undefined, Math.PI / 3)))
    const positiveYawBaseline = bearFingerprint()
    const positiveYawRevision = baseRoot().getAttribute('data-avatar-fragment-revision')
    act(() => root.render(render(notification(100, .19), Math.PI / 3)))
    expect(bearFingerprint()).toBe(positiveYawBaseline)
    expect(baseRoot().getAttribute('data-avatar-fragment-revision')).toBe(positiveYawRevision)
    expect(host.querySelector('[data-avatar-independent-auxiliary-part="notification-orb"]')
      ?.closest('[data-avatar-auxiliary-depth-layer]')?.getAttribute('data-avatar-auxiliary-depth-layer'))
      .toBe('back')

    act(() => root.render(render(undefined, -Math.PI / 3)))
    const negativeYawBaseline = bearFingerprint()
    const negativeYawRevision = baseRoot().getAttribute('data-avatar-fragment-revision')
    act(() => root.render(render(notification(100, .19), -Math.PI / 3)))
    expect(bearFingerprint()).toBe(negativeYawBaseline)
    expect(baseRoot().getAttribute('data-avatar-fragment-revision')).toBe(negativeYawRevision)
    expect(host.querySelector('[data-avatar-independent-auxiliary-part="notification-orb"]')
      ?.closest('[data-avatar-auxiliary-depth-layer]')?.getAttribute('data-avatar-auxiliary-depth-layer'))
      .toBe('front')

    act(() => root.render(render()))
    expect(host.querySelectorAll('[data-avatar-entity-fragment-root]')).toHaveLength(1)
    expect(bearFingerprint()).toBe(frontBaseline)
    expect(baseRoot().getAttribute('data-avatar-fragment-revision')).toBe(frontRevision)
  })

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
