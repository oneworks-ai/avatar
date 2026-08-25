// @vitest-environment jsdom

import { act, createElement, createRef } from 'react'
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
  applyDeerAntlerStyle,
  applyAvatarEntityPalette,
  applyFoxEarScale,
  applyFoxEarStyle,
  applyFoxHeadScale,
  applyFoxHeadTaper,
  applySheepHornStyle,
  createAvatarEntityParts,
  createDeerSurfaceDecals,
  createFoxSurfaceDecals,
  createOtterSurfaceDecals,
  createSheepSurfaceDecals,
  getAvatarEntityPresetFaceStyle,
  resolveAvatarEntityPresetFaceStyle
} from '../../../src/avatarEntityPresets'
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
          expect(snout.compareDocumentPosition(nostril) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
        }
      }
    }
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
