// @vitest-environment jsdom

import {
  AVATAR_DOG_COMPATIBLE_PALETTE_IDS,
  AVATAR_TABBY_COMPATIBLE_PALETTE_IDS,
  createDefaultAvatarDefinition,
  createSeededAvatarDefinition,
  DEFAULT_AVATAR_COAT_PATTERN,
  getAvatarPalette,
  isAvatarDefinition
} from '@oneworks/avatar'
import type { AvatarDefinition } from '@oneworks/avatar'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App'
import { AvatarLocaleProvider } from '../src/avatarLocale'
import { avatarDefinitionToSearchParams, avatarDefinitionToState, createAvatarDefinition } from '../src/avatarDefinition'
import {
  applyDogHeadScale,
  createAvatarEntityParts,
  deserializeAvatarEntityParts
} from '../src/avatarEntityPresets'
import {
  AVATAR_SEED_FIELD,
  AVATAR_SEED_FIELDS,
  resolveSeededAvatarEntityPreset,
  resolveSeededAvatarFacePreset,
  serializeAvatarSeedFields
} from '../src/avatarSeed'
import { persistSavedAvatarPresets } from '../src/savedAvatarPresets'

let host: HTMLDivElement
let root: Root

const flushEffects = () => act(async () => {
  await new Promise(resolve => window.setTimeout(resolve, 0))
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
  const seedSettings = host.querySelector<HTMLButtonElement>('[aria-label="Seed settings"]')
  if (seedSettings?.getAttribute('aria-expanded') === 'false') {
    act(() => seedSettings.click())
    await flushEffects()
  }
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
  window.history.replaceState(null, '', '/?seed=v1-stable&cameraBg=%230e4fe7')
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

describe('App Seed authoring', () => {
  it('replaces stale optional eye overrides when selecting a complete face preset', async () => {
    window.history.replaceState(null, '', '/?eyeH=54&eyeLeftH=68&eyeRightH=42&eyeLeftW=34&eyeRightW=14&eyeLeftRot=21&eyeRightRot=-19')
    await renderApp()
    act(() => Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(button => button.getAttribute('aria-label') === 'Sleepy')?.click())
    await flushEffects()
    const params = new URLSearchParams(window.location.search)
    expect(params.get('eyeLeftH')).toBeNull()
    expect(params.get('eyeRightH')).toBeNull()
    expect(params.get('eyeLeftW')).toBeNull()
    expect(params.get('eyeRightW')).toBeNull()
    expect(params.get('eyeH')).toBe('30')
    expect(params.get('eyeLeftRot')).toBe('10')
    expect(params.get('eyeRightRot')).toBe('-10')
  })

  it('serializes the Mixed signal preset as independently vertical and horizontal eyes', async () => {
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    await flushEffects()
    act(() => Array.from(host.querySelectorAll<HTMLButtonElement>('button'))
      .find(button => button.getAttribute('aria-label') === 'Mixed signal')?.click())
    await flushEffects()

    const params = new URLSearchParams(window.location.search)
    expect(Number(params.get('eyeLeftH'))).toBeGreaterThan(Number(params.get('eyeLeftW')))
    expect(Number(params.get('eyeRightW'))).toBeGreaterThan(Number(params.get('eyeRightH')))
    expect(params.get('eyeLeftRot')).toBe('0')
    expect(params.get('eyeRightRot')).toBe('0')
  })

  it('turns an empty whiteboard into a fully Seed-following avatar on the first random action', async () => {
    await renderApp()
    expect(new URLSearchParams(window.location.search).get('seedFields')).toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()

    const params = new URLSearchParams(window.location.search)
    const entity = params.get('entity')
    const expectedFields = AVATAR_SEED_FIELDS.filter(field => (
      entity === 'cat'
        ? field !== AVATAR_SEED_FIELD.dogEarWidth &&
          field !== AVATAR_SEED_FIELD.dogEarHeight &&
          field !== AVATAR_SEED_FIELD.dogHeadWidth &&
          field !== AVATAR_SEED_FIELD.dogHeadHeight
        : entity === 'dog'
          ? field !== AVATAR_SEED_FIELD.catEarWidth && field !== AVATAR_SEED_FIELD.catEarHeight
          : field !== AVATAR_SEED_FIELD.catEarWidth &&
            field !== AVATAR_SEED_FIELD.catEarHeight &&
            field !== AVATAR_SEED_FIELD.dogEarWidth &&
            field !== AVATAR_SEED_FIELD.dogEarHeight &&
            field !== AVATAR_SEED_FIELD.dogHeadWidth &&
            field !== AVATAR_SEED_FIELD.dogHeadHeight &&
            !field.startsWith('scene.appearance.coatPattern.')
    ))
    expect(params.get('seedFields')).toBe(serializeAvatarSeedFields(expectedFields))
    expect(entity).not.toBeNull()
    expect(params.get('palette')).not.toBeNull()
    expect(params.get('cameraFrame')).not.toBeNull()
    expect(params.get('seedFields')).not.toContain('scene.camera.frame')
  })

  it('commits a concrete seeded view pose to the URL and restores it exactly after reload', async () => {
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()

    const beforeReload = new URLSearchParams(window.location.search)
    expect(beforeReload.get('seedFields')).toContain(AVATAR_SEED_FIELD.viewPose)
    const concreteView = ['positionX', 'positionY', 'yaw', 'pitch', 'roll'].map(key => beforeReload.get(key))
    expect(concreteView.every(value => value != null)).toBe(true)
    expect(Number(beforeReload.get('positionY'))).toBe(72)
    expect(Number(beforeReload.get('scale'))).toBe(1.72)
    expect(Math.abs(
      Number(beforeReload.get('pitch')) - Math.atan2(-72, 360)
    )).toBeLessThanOrEqual(Math.PI / 36)
    expect(Number(beforeReload.get('roll'))).toBe(0)
    expect(Math.abs(
      Number(beforeReload.get('yaw')) - Math.atan2(-Number(beforeReload.get('positionX')), 360)
    )).toBeLessThanOrEqual(Math.PI / 36)

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()

    const afterReload = new URLSearchParams(window.location.search)
    expect(['positionX', 'positionY', 'yaw', 'pitch', 'roll'].map(key => afterReload.get(key)))
      .toEqual(concreteView)
  })

  it('renders an intermediate seeded pose and cancels its stale frame when direct manipulation begins', async () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callbacks.push(callback)
      return callbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    await renderApp()
    callbacks.length = 0

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const targetX = Number(new URLSearchParams(window.location.search).get('positionX'))
    const avatar = host.querySelector<HTMLElement>('.interactive-avatar')
    expect(Number(avatar?.dataset.positionX)).toBe(0)

    act(() => callbacks[0]?.(0))
    await flushEffects()
    act(() => callbacks.at(-1)?.(110))
    await flushEffects()
    const intermediateX = Number(avatar?.dataset.positionX)
    expect(Math.abs(intermediateX)).toBeGreaterThan(0)
    expect(Math.abs(intermediateX)).toBeLessThan(Math.abs(targetX))

    const canvas = host.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
    const staleTransitionFrame = callbacks.at(-1)
    act(() => canvas?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })))
    act(() => staleTransitionFrame?.(220))
    await flushEffects()
    expect(Number(avatar?.dataset.positionX)).toBe(intermediateX)
  })

  it('continues a rapid Seed reroll from the currently visible intermediate position', async () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callbacks.push(callback)
      return callbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    await renderApp()
    callbacks.length = 0

    const randomize = host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')
    act(() => randomize?.click())
    await flushEffects()
    act(() => callbacks[0]?.(0))
    await flushEffects()
    act(() => callbacks.at(-1)?.(110))
    await flushEffects()

    const avatar = host.querySelector<HTMLElement>('.interactive-avatar')
    const intermediateX = Number(avatar?.dataset.positionX)
    expect(intermediateX).not.toBe(0)

    act(() => randomize?.click())
    await flushEffects()
    expect(Number(avatar?.dataset.positionX)).toBe(intermediateX)
  })

  it('freezes a manually adjusted view and keeps it after reload', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      matches: query === '(prefers-reduced-motion: reduce)',
      removeEventListener: vi.fn()
    })))
    await renderApp()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: View composition"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('seedFields'))
      .toContain(AVATAR_SEED_FIELD.viewPose)

    const canvas = host.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
    act(() => canvas?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })))
    await flushEffects()

    const manual = new URLSearchParams(window.location.search)
    expect(manual.get('seedFields') ?? '').not.toContain(AVATAR_SEED_FIELD.viewPose)
    const manualView = ['positionX', 'positionY', 'yaw', 'pitch', 'roll', 'scale']
      .map(key => manual.get(key))

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    const restored = new URLSearchParams(window.location.search)
    expect(['positionX', 'positionY', 'yaw', 'pitch', 'roll', 'scale'].map(key => restored.get(key)))
      .toEqual(manualView)
  })

  it('commits a reduced-motion seeded pose without scheduling a transient frame', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      matches: query === '(prefers-reduced-motion: reduce)',
      removeEventListener: vi.fn()
    })))
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame')
    await renderApp()
    requestAnimationFrame.mockClear()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: View composition"]')?.click())
    await flushEffects()

    const params = new URLSearchParams(window.location.search)
    const avatar = host.querySelector<HTMLElement>('.interactive-avatar')
    expect(params.get('seedFields')).toContain(AVATAR_SEED_FIELD.viewPose)
    expect(Number(avatar?.dataset.positionX)).toBeCloseTo(Number(params.get('positionX')), 4)
    expect(Number(avatar?.dataset.positionY)).toBe(72)
    expect(Number(params.get('positionY'))).toBe(72)
    expect(Number(params.get('scale'))).toBe(1.72)
    expect(Math.abs(
      Number(params.get('pitch')) - Math.atan2(-72, 360)
    )).toBeLessThanOrEqual(Math.PI / 36)
    expect(Number(params.get('roll'))).toBe(0)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('round-trips a manual camera frame while legacy Seed frame fields are ignored', async () => {
    window.history.replaceState(null, '', '/?seed=v1-frame&cameraFrame=circle&seedFields=scene.face.preset,scene.camera.frame')
    await renderApp()

    let params = new URLSearchParams(window.location.search)
    expect(params.get('cameraFrame')).toBe('circle')
    expect(params.get('seedFields')).toBe(AVATAR_SEED_FIELD.facePreset)

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    params = new URLSearchParams(window.location.search)
    expect(params.get('cameraFrame')).toBe('circle')

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-style')?.click())
    await flushEffects()
    act(() => Array.from(host.querySelectorAll<HTMLButtonElement>('[aria-label="Camera frame shape"] [role="radio"]'))
      .find(button => button.textContent === 'Square')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('cameraFrame')).toBe('square')
  })

  it('locks an explicitly selected avatar type while leaving its applicable fields Seed-capable', async () => {
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-entity-preset="cat"]')?.click())
    await flushEffects()

    const fields = new URLSearchParams(window.location.search).get('seedFields')?.split(',') ?? []
    expect(fields).not.toContain(AVATAR_SEED_FIELD.entityPreset)
    expect(fields).toContain(AVATAR_SEED_FIELD.facePreset)
    expect(fields).toContain(AVATAR_SEED_FIELD.palette)
    expect(fields).toContain(AVATAR_SEED_FIELD.catEarWidth)
    expect(new URLSearchParams(window.location.search).get('entity')).toBe('cat')
  })

  it('applies a Cat type as a deterministic Seed constraint profile', async () => {
    window.history.replaceState(null, '', '/?entity=cat&seed=v1-siamese-a')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('breed')).toBe('siamese')
    expect(selected.get('palette')).toBe('siamese')
    expect(selected.get('coatLightPatchOffsetY')).toBe('-44')
    expect(selected.get('coatLightPatchShape')).toBe('ellipse')
    expect(selected.get('seedFields')).toBe([
      AVATAR_SEED_FIELD.coatPatternLightPatchLength,
      AVATAR_SEED_FIELD.coatPatternLightPatchWidth
    ].join(','))

    const fixed = {
      earHeight: selected.get('catEarHeight'),
      earWidth: selected.get('catEarWidth'),
      offset: selected.get('coatLightPatchOffsetY'),
      palette: selected.get('palette'),
      shape: selected.get('coatLightPatchShape')
    }
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect({
      earHeight: rerolled.get('catEarHeight'),
      earWidth: rerolled.get('catEarWidth'),
      offset: rerolled.get('coatLightPatchOffsetY'),
      palette: rerolled.get('palette'),
      shape: rerolled.get('coatLightPatchShape')
    }).toEqual(fixed)
  })

  it('applies a Dog type as a deterministic constrained profile with Dog-only ear fields', async () => {
    window.history.replaceState(null, '', '/?entity=dog&seed=v1-husky-a')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-dog-breed="husky"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('entity')).toBe('dog')
    expect(selected.get('breed')).toBe('husky')
    expect(selected.get('palette')).toBe('husky')
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogEarWidth)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogEarHeight)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogHeadWidth)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogHeadHeight)
    expect(Number(selected.get('dogHeadWidth'))).toBeGreaterThanOrEqual(100)
    expect(Number(selected.get('dogHeadWidth'))).toBeLessThanOrEqual(112)
    expect(Number(selected.get('dogHeadHeight'))).toBeGreaterThanOrEqual(102)
    expect(Number(selected.get('dogHeadHeight'))).toBeLessThanOrEqual(116)
    expect(selected.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.catEarWidth)
    expect(selected.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.catEarHeight)

    const fixed = {
      algorithm: selected.get('coatAlgorithm'),
      offset: selected.get('coatLightPatchOffsetY'),
      palette: selected.get('palette'),
      shape: selected.get('coatLightPatchShape')
    }
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('breed')).toBe('husky')
    expect({
      algorithm: rerolled.get('coatAlgorithm'),
      offset: rerolled.get('coatLightPatchOffsetY'),
      palette: rerolled.get('palette'),
      shape: rerolled.get('coatLightPatchShape')
    }).toEqual(fixed)
  })

  it('freezes an independently edited Dog head width across Seed rerolls and URL reloads', async () => {
    window.history.replaceState(null, '', '/?entity=dog&seed=v1-corgi-head')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-dog-breed="corgi"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogHeadWidth)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogHeadHeight)

    act(() => {
      const width = host.querySelector<HTMLInputElement>('[aria-label="Dog head width"]')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(width, '132')
      width?.dispatchEvent(new Event('input', { bubbles: true }))
      width?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flushEffects()

    const manual = new URLSearchParams(window.location.search)
    expect(manual.get('breed')).toBe('corgi')
    expect(manual.get('dogHeadWidth')).toBe('132')
    expect(manual.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogHeadWidth)
    expect(manual.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogHeadHeight)

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('dogHeadWidth')).toBe('132')
    expect(Number(rerolled.get('dogHeadHeight'))).toBeGreaterThanOrEqual(84)
    expect(Number(rerolled.get('dogHeadHeight'))).toBeLessThanOrEqual(98)
    const head = deserializeAvatarEntityParts(rerolled.get('entityParts'), 'dog')
      .find(part => part.id === 'primary' && part.face)
    expect(head?.scaleX).toBeCloseTo(.72 * 1.32)
    expect(head?.scaleY).toBeCloseTo(.8 * Number(rerolled.get('dogHeadHeight')) / 100)

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    const reloaded = new URLSearchParams(window.location.search)
    expect(reloaded.get('dogHeadWidth')).toBe('132')
    expect(reloaded.get('dogHeadHeight')).toBe(rerolled.get('dogHeadHeight'))
    expect(deserializeAvatarEntityParts(reloaded.get('entityParts'), 'dog')
      .find(part => part.id === 'primary' && part.face)).toEqual(head)
    expect(reloaded.get('seedFields')).toBe(rerolled.get('seedFields'))
  })

  it('removes Cat-only ear bindings when switching to a Dog type and rerolling its breed', async () => {
    const seededFields = serializeAvatarSeedFields([
      AVATAR_SEED_FIELD.catEarWidth,
      AVATAR_SEED_FIELD.catEarHeight,
      AVATAR_SEED_FIELD.facePreset
    ])
    window.history.replaceState(null, '', `/?entity=cat&seed=v1-cross-species-cat&seedFields=${seededFields}`)
    await renderApp()

    act(() => host.querySelector<HTMLButtonElement>('[data-entity-preset="dog"]')?.click())
    await flushEffects()
    let params = new URLSearchParams(window.location.search)
    expect(params.get('entity')).toBe('dog')
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.catEarWidth)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.catEarHeight)

    act(() => host.querySelector<HTMLButtonElement>('[data-dog-breed="husky"]')?.click())
    await flushEffects()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    params = new URLSearchParams(window.location.search)
    expect(params.get('breed')).toBe('husky')
    expect(params.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogEarWidth)
    expect(params.get('seedFields')).toContain(AVATAR_SEED_FIELD.dogEarHeight)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.catEarWidth)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.catEarHeight)
    expect(params.has('catEarWidth')).toBe(false)
    expect(params.has('catEarHeight')).toBe(false)
  })

  it('removes Dog-only ear bindings when switching to a Cat type and rerolling its breed', async () => {
    const seededFields = serializeAvatarSeedFields([
      AVATAR_SEED_FIELD.dogEarWidth,
      AVATAR_SEED_FIELD.dogEarHeight,
      AVATAR_SEED_FIELD.dogHeadWidth,
      AVATAR_SEED_FIELD.dogHeadHeight,
      AVATAR_SEED_FIELD.facePreset
    ])
    window.history.replaceState(null, '', `/?entity=dog&seed=v1-cross-species-dog&seedFields=${seededFields}`)
    await renderApp()

    act(() => host.querySelector<HTMLButtonElement>('[data-entity-preset="cat"]')?.click())
    await flushEffects()
    let params = new URLSearchParams(window.location.search)
    expect(params.get('entity')).toBe('cat')
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogEarWidth)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogEarHeight)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogHeadWidth)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogHeadHeight)

    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="russian-blue"]')?.click())
    await flushEffects()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    params = new URLSearchParams(window.location.search)
    expect(params.get('breed')).toBe('russian-blue')
    expect(params.get('seedFields')).toContain(AVATAR_SEED_FIELD.catEarWidth)
    expect(params.get('seedFields')).toContain(AVATAR_SEED_FIELD.catEarHeight)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogEarWidth)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogEarHeight)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogHeadWidth)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogHeadHeight)
    expect(params.has('dogEarWidth')).toBe(false)
    expect(params.has('dogEarHeight')).toBe(false)
    expect(params.has('dogHeadWidth')).toBe(false)
    expect(params.has('dogHeadHeight')).toBe(false)
  })

  it('keeps an unprofiled seeded Dog coat inside the Dog palette domain after URL reloads', async () => {
    const seededFields = serializeAvatarSeedFields([
      AVATAR_SEED_FIELD.palette,
      AVATAR_SEED_FIELD.coatPatternSeed
    ])
    window.history.replaceState(null, '', `/?entity=dog&coat=1&seed=v1-dog-coat-domain&seedFields=${seededFields}`)
    await renderApp()

    const first = new URLSearchParams(window.location.search)
    expect(AVATAR_DOG_COMPATIBLE_PALETTE_IDS).toContain(first.get('palette'))
    expect(AVATAR_TABBY_COMPATIBLE_PALETTE_IDS).not.toContain(first.get('palette'))

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    const second = new URLSearchParams(window.location.search)
    expect(second.get('palette')).toBe(first.get('palette'))
    expect(AVATAR_DOG_COMPATIBLE_PALETTE_IDS).toContain(second.get('palette'))
    expect(AVATAR_TABBY_COMPATIBLE_PALETTE_IDS).not.toContain(second.get('palette'))
  })

  it('cancels a Dog type without changing its concrete appearance', async () => {
    window.history.replaceState(null, '', '/?entity=dog&seed=v1-shiba-cancel')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-dog-breed="shiba-inu"]')?.click())
    await flushEffects()
    const selected = new URLSearchParams(window.location.search)
    const concrete = {
      ears: selected.get('entityParts'),
      palette: selected.get('palette'),
      width: selected.get('coatLightPatchWidth')
    }
    act(() => host.querySelector<HTMLButtonElement>('[data-dog-breed="shiba-inu"]')?.click())
    await flushEffects()
    const cancelled = new URLSearchParams(window.location.search)
    expect(cancelled.get('breed')).toBeNull()
    expect(cancelled.get('entityParts')).toBe(concrete.ears)
    expect(cancelled.get('palette')).toBe(concrete.palette)
    expect(cancelled.get('coatLightPatchWidth')).toBe(concrete.width)
  })

  it('locks Cow Cat colors and centered patch while its permitted patch size follows Seed', async () => {
    window.history.replaceState(null, '', '/?entity=cat&seed=v1-cow-profile')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="cow-cat"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('breed')).toBe('cow-cat')
    expect(selected.get('palette')).toBe('cow-cat')
    expect(selected.get('coat')).toBe('1')
    expect(selected.get('coatDensity')).toBe('0')
    expect(selected.get('coatLightPatchOffsetY')).toBe('0')
    expect(selected.get('coatLightPatchShape')).toBe('face-mask')
    expect(selected.get('seedFields')).toBe([
      AVATAR_SEED_FIELD.coatPatternLightPatchLength,
      AVATAR_SEED_FIELD.coatPatternLightPatchWidth
    ].join(','))

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('entity')).toBe('cat')
    expect(rerolled.get('palette')).toBe('cow-cat')
    expect(rerolled.get('coatDensity')).toBe('0')
    expect(rerolled.get('coatLightPatchOffsetY')).toBe('0')
    expect(rerolled.get('coatLightPatchShape')).toBe('face-mask')
  })

  it('keeps Black Cat coat-free and near-black while its constrained ear size follows Seed', async () => {
    window.history.replaceState(null, '', '/?entity=cat&seed=v1-black-profile')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="black-cat"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('breed')).toBe('black-cat')
    expect(selected.get('palette')).toBe('black-cat')
    expect(selected.get('coat')).toBe('0')
    expect(selected.get('seedFields')).toBe([
      AVATAR_SEED_FIELD.catEarWidth,
      AVATAR_SEED_FIELD.catEarHeight
    ].join(','))

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('entity')).toBe('cat')
    expect(rerolled.get('palette')).toBe('black-cat')
    expect(rerolled.get('coat')).toBe('0')
    expect(rerolled.get('seedFields')).toContain(AVATAR_SEED_FIELD.viewPose)
    expect(rerolled.get('positionX')).not.toBe('0')
  })

  it('locks Cat identity when a Cat type replaces an entity Seed binding', async () => {
    const catSeed = Array.from({ length: 100 }, (_, index) => `v1-cat-lock-${index}`)
      .find(candidate => resolveSeededAvatarEntityPreset(candidate) === 'cat')
    expect(catSeed).toBeDefined()
    window.history.replaceState(null, '', `/?entity=cat&seed=${catSeed}&seedFields=${AVATAR_SEED_FIELD.entityPreset}`)
    await renderApp()
    expect(new URLSearchParams(window.location.search).get('seedFields'))
      .toContain(AVATAR_SEED_FIELD.entityPreset)

    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')?.click())
    await flushEffects()
    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('entity')).toBe('cat')
    expect(selected.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.entityPreset)

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('entity')).toBe('cat')
    expect(new URLSearchParams(window.location.search).get('breed')).toBe('siamese')
  })

  it('cancels the current Cat type without changing its concrete appearance', async () => {
    window.history.replaceState(null, '', '/?entity=cat&seed=v1-siamese-cancel')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    const concrete = {
      ears: selected.get('entityParts'),
      length: selected.get('coatLightPatchLength'),
      palette: selected.get('palette'),
      width: selected.get('coatLightPatchWidth')
    }
    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')?.click())
    await flushEffects()

    const cancelled = new URLSearchParams(window.location.search)
    expect(cancelled.get('breed')).toBeNull()
    expect(cancelled.get('entityParts')).toBe(concrete.ears)
    expect(cancelled.get('coatLightPatchLength')).toBe(concrete.length)
    expect(cancelled.get('coatLightPatchWidth')).toBe(concrete.width)
    expect(cancelled.get('palette')).toBe(concrete.palette)
    expect(cancelled.get('seedFields')).toBeNull()
  })

  it('keeps the Cat type domain for remaining fields after a manual palette edit', async () => {
    window.history.replaceState(null, '', '/?entity=cat&seed=v1-orange-manual')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="orange-tabby"]')?.click())
    await flushEffects()
    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-style')?.click())
    await flushEffects()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Coral"]')?.click())
    await flushEffects()
    act(() => Array.from(host.querySelectorAll<HTMLButtonElement>('button'))
      .find(button => button.textContent === 'Apply to all')?.click())
    await flushEffects()

    const manual = new URLSearchParams(window.location.search)
    expect(manual.get('breed')).toBe('orange-tabby')
    expect(manual.get('palette')).toBe('coral')
    expect(manual.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.palette)

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-build')?.click())
    await flushEffects()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('breed')).toBe('orange-tabby')
    expect(rerolled.get('palette')).toBe('coral')
    expect(['mackerel', 'classic']).toContain(rerolled.get('coatAlgorithm'))
  })

  it('replays a field deterministically and makes manual edits leave Seed control', async () => {
    await renderApp()
    const faceSeed = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Face"]')
    expect(faceSeed?.getAttribute('aria-checked')).toBe('false')

    act(() => faceSeed?.click())
    await flushEffects()
    const first = new URLSearchParams(window.location.search)
    expect(first.get('seedFields')).toContain('scene.face.preset')

    const seedInput = host.querySelector<HTMLInputElement>('[aria-label="Current Seed"]')
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      if (seedInput != null) {
        seedInput.focus()
        valueSetter?.call(seedInput, 'v1-next')
        seedInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    act(() => seedInput?.blur())
    await flushEffects()
    const changedSeed = new URLSearchParams(window.location.search)
    const expectedFace = resolveSeededAvatarFacePreset('v1-next').style
    expect(changedSeed.get('seed')).toBe('v1-next')
    expect(changedSeed.get('eyeW')).toBe(String(expectedFace.width))
    expect(changedSeed.get('cameraBg')).toBe('#0e4fe7')

    const changedFace = ['eyeShape', 'eyeW', 'eyeH', 'eyeGap', 'nose', 'mouth'].map(key => changedSeed.get(key))

    act(() => faceSeed?.click())
    await flushEffects()
    act(() => faceSeed?.click())
    await flushEffects()
    const replayed = new URLSearchParams(window.location.search)
    expect(['eyeShape', 'eyeW', 'eyeH', 'eyeGap', 'nose', 'mouth'].map(key => replayed.get(key))).toEqual(changedFace)

    const cute = host.querySelector<HTMLButtonElement>('[aria-label="Cute"]')
    act(() => cute?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('seedFields')).toBeNull()
    expect(faceSeed?.getAttribute('aria-checked')).toBe('false')
  })

  it('restores Seed and linked fields from a saved preset', async () => {
    persistSavedAvatarPresets([{
      createdAt: Date.now(),
      id: 'seed-preset',
      query: '?seed=v1-preset&seedFields=scene.face.preset&cameraBg=%23111315',
      screenshot: 'data:image/png;base64,AA==',
      version: 1
    }])
    await renderApp()

    const restore = host.querySelector<HTMLButtonElement>('[aria-label^="Restore preset saved"]')
    act(() => restore?.click())
    await flushEffects()

    expect(host.querySelector<HTMLInputElement>('[aria-label="Current Seed"]')?.value).toBe('v1-preset')
    expect(host.querySelector('[aria-label="Follow Seed: Face"]')?.getAttribute('aria-checked')).toBe('true')
    expect(new URLSearchParams(window.location.search).get('seedFields')).toBe('scene.face.preset')
  })

  it('cancels a Seed draft with Escape without committing it', async () => {
    await renderApp()
    const seedInput = host.querySelector<HTMLInputElement>('[aria-label="Current Seed"]')
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      seedInput?.focus()
      if (seedInput != null) {
        valueSetter?.call(seedInput, 'v1-draft')
        seedInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await flushEffects()
    act(() => seedInput?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })))
    await flushEffects()
    act(() => seedInput?.blur())
    await flushEffects()

    expect(seedInput?.value).toBe('v1-stable')
    expect(new URLSearchParams(window.location.search).get('seed')).toBe('v1-stable')
  })

  it('keeps manual palette values and future bindings when enabling a model Seed', async () => {
    window.history.replaceState(
      null,
      '',
      '/?seed=v1-stable&palette=coral&seedFields=future.pattern.algorithm'
    )
    await renderApp()

    const entitySeed = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Avatar type"]')
    act(() => entitySeed?.click())
    await flushEffects()

    const params = new URLSearchParams(window.location.search)
    expect(params.get('seedFields')).toBe('scene.entity.preset,future.pattern.algorithm')
    expect(params.get('palette')).toBe('coral')
    const parts = JSON.parse(params.get('entityParts') ?? '[]') as unknown[][]
    expect(parts.length).toBeGreaterThan(0)
    expect(parts.every(part => part[7] === getAvatarPalette('coral').background)).toBe(true)
  })

  it('makes part material edits leave both model and palette Seed control', async () => {
    window.history.replaceState(
      null,
      '',
      '/?seed=v1-stable&entity=dog&palette=white&seedFields=scene.entity.preset,scene.appearance.paletteId'
    )
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-style')?.click())
    await flushEffects()
    const baseColor = host.querySelector<HTMLInputElement>('[aria-label="Base"]')
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      if (baseColor != null) {
        valueSetter?.call(baseColor, '#ff0000')
        baseColor.dispatchEvent(new Event('input', { bubbles: true }))
        baseColor.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    await flushEffects()

    expect(new URLSearchParams(window.location.search).get('seedFields')).toBeNull()
  })

  it('authors a deterministic coat algorithm without serializing generated decals', async () => {
    window.history.replaceState(null, '', '/?seed=v1-tabby-cat&entity=cat&palette=tabby&coat=1')
    await renderApp()
    const algorithmSeed = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Pattern algorithm"]')
    expect(algorithmSeed?.getAttribute('aria-checked')).toBe('false')

    act(() => algorithmSeed?.click())
    await flushEffects()
    const generated = new URLSearchParams(window.location.search)
    expect(generated.get('seedFields')).toBe('scene.appearance.coatPattern.algorithm')
    expect(generated.get('coat')).toBe('1')
    expect(generated.get('coatAlgorithm')).toBe('random')
    expect(generated.get('decals')).toBeNull()

    act(() => Array.from(host.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(button => button.textContent?.includes('Spotted'))?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('coatAlgorithm')).toBe('spotted')
    expect(new URLSearchParams(window.location.search).get('seedFields')).toBeNull()
  })

  it('round-trips, seeds, and manually fixes light coat patch fields independently', async () => {
    window.history.replaceState(
      null,
      '',
      '/?seed=v1-light-patch&entity=cat&palette=tabby&coat=1&coatLightPatchLength=88&coatLightPatchOffsetY=-24&coatLightPatchWidth=124&coatLightPatchShape=ellipse'
    )
    await renderApp()
    let params = new URLSearchParams(window.location.search)
    expect(params.get('coatLightPatchLength')).toBe('88')
    expect(params.get('coatLightPatchOffsetY')).toBe('-24')
    expect(params.get('coatLightPatchWidth')).toBe('124')
    expect(params.get('coatLightPatchShape')).toBe('ellipse')
    expect(params.get('seedFields')).toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Length"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('seedFields')).toBe('scene.appearance.coatPattern.lightPatchLength')

    const length = host.querySelector<HTMLInputElement>('[aria-label="Length"]')
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      valueSetter?.call(length, '90')
      length?.dispatchEvent(new Event('input', { bubbles: true }))
      length?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flushEffects()
    params = new URLSearchParams(window.location.search)
    expect(params.get('coatLightPatchLength')).toBe('90')
    expect(params.get('seedFields')).toBeNull()
    expect(params.get('coatLightPatchWidth')).toBe('124')
    expect(params.get('coatLightPatchShape')).toBe('ellipse')

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Vertical position"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('seedFields')).toBe('scene.appearance.coatPattern.lightPatchOffsetY')

    const offset = host.querySelector<HTMLInputElement>('[aria-label="Vertical position"]')
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      valueSetter?.call(offset, '50')
      offset?.dispatchEvent(new Event('input', { bubbles: true }))
      offset?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flushEffects()
    params = new URLSearchParams(window.location.search)
    expect(params.get('coatLightPatchOffsetY')).toBe('50')
    expect(params.get('seedFields')).toBeNull()
  })

  it('limits a Seed-following cat coat palette to natural tabby candidates', async () => {
    window.history.replaceState(
      null,
      '',
      '/?seed=v1-natural-tabby&entity=cat&palette=coral&coat=1&seedFields=scene.appearance.paletteId'
    )
    await renderApp()

    const paletteId = new URLSearchParams(window.location.search).get('palette')
    expect(AVATAR_TABBY_COMPATIBLE_PALETTE_IDS).toContain(paletteId)
    expect(paletteId).not.toBe('coral')
  })

  it('uses a natural default when first enabling a coat but preserves a manually fixed coral palette', async () => {
    window.history.replaceState(null, '', '/?seed=v1-natural-default&entity=cat')
    await renderApp()
    const toggle = host.querySelector<HTMLButtonElement>('[aria-label="Coat pattern"]')

    act(() => toggle?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('palette')).toBe('tabby')

    act(() => root.unmount())
    root = createRoot(host)
    window.history.replaceState(null, '', '/?seed=v1-manual-coral&entity=cat&palette=coral')
    await renderApp()
    const manualToggle = host.querySelector<HTMLButtonElement>('[aria-label="Coat pattern"]')

    act(() => manualToggle?.click())
    await flushEffects()
    const manual = new URLSearchParams(window.location.search)
    expect(manual.get('coat')).toBe('1')
    expect(manual.get('palette')).toBe('coral')

    const layoutSeed = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Pattern layout"]')
    act(() => layoutSeed?.click())
    await flushEffects()
    const seedInput = host.querySelector<HTMLInputElement>('[aria-label="Current Seed"]')
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      if (seedInput != null) {
        seedInput.focus()
        valueSetter?.call(seedInput, 'v1-manual-coral-next')
        seedInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    act(() => seedInput?.blur())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('palette')).toBe('coral')
  })

  it('keeps a fixed coat algorithm while the global Seed drives only pattern layout', async () => {
    window.history.replaceState(
      null,
      '',
      '/?seed=v1-layout-a&entity=cat&palette=tabby&coat=1&coatAlgorithm=mackerel&coatSeed=v1-concrete-layout'
    )
    await renderApp()
    const layoutSeed = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Pattern layout"]')
    expect(layoutSeed?.getAttribute('aria-checked')).toBe('false')

    act(() => layoutSeed?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('seedFields'))
      .toBe('scene.appearance.coatPattern.seed')

    const seedInput = host.querySelector<HTMLInputElement>('[aria-label="Current Seed"]')
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      if (seedInput != null) {
        seedInput.focus()
        valueSetter?.call(seedInput, 'v1-layout-b')
        seedInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    act(() => seedInput?.blur())
    await flushEffects()

    const changed = new URLSearchParams(window.location.search)
    expect(changed.get('coatAlgorithm')).toBe('mackerel')
    expect(changed.get('coatSeed')).toBe('v1-layout-b')
    expect(changed.get('coatAlgorithmSeed')).toBe('v1-layout-a')
  })

  it('preserves another seeded model built-in decals when the cat pattern field is linked', async () => {
    const bunSeed = Array.from({ length: 500 }, (_, index) => `v1-bun-${index}`).find(
      candidate => resolveSeededAvatarEntityPreset(candidate) === 'bun'
    )
    expect(bunSeed).toBeDefined()
    window.history.replaceState(
      null,
      '',
      `/?seed=${bunSeed}&seedFields=scene.entity.preset,scene.decals.coatPattern`
    )
    await renderApp()

    const params = new URLSearchParams(window.location.search)
    expect(params.get('entity')).toBe('bun')
    expect(JSON.parse(params.get('decals') ?? '[]')).toHaveLength(6)
  })

  it('materializes a procedural coat only when converting it to editable decals', async () => {
    const params = new URLSearchParams({
      coat: '1',
      coatAlgorithm: 'mackerel',
      decals: JSON.stringify([[
        'user-badge', 'cat-head', 'ellipse', -48, 30, 30, 18, -8,
        '#f29a93', 90, 'User badge', 'front', 0
      ], [
        'coat-mackerel-forehead-outer-left', 'cat-head', 'ellipse', -30, -50, 16, 16, 0,
        '#33aa77', 100, 'Explicit coat override', 'front', 0
      ]]),
      entity: 'cat',
      palette: 'tabby',
      seed: 'v1-tabby-cat'
    })
    window.history.replaceState(null, '', `/?${params}`)
    await renderApp()
    expect(host.querySelector('[data-avatar-surface-decal="user-badge"]')).not.toBeNull()
    expect(host.querySelectorAll('[data-avatar-surface-decal="coat-mackerel-forehead-outer-left"]')).toHaveLength(1)
    expect(host.querySelectorAll('[data-avatar-surface-decal^="coat-mackerel-"]').length).toBeGreaterThan(0)
    act(() => Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes('Convert to editable decals'))?.click())
    await flushEffects()
    const converted = new URLSearchParams(window.location.search)
    const decals = JSON.parse(converted.get('decals') ?? '[]') as unknown[][]
    expect(converted.get('coat')).toBe('0')
    expect(decals.some(decal => decal[0] === 'user-badge')).toBe(true)
    expect(decals.some(decal => decal[0] === 'coat-mackerel-forehead-outer-left')).toBe(true)
    expect(decals.some(decal => decal[0] === 'decal-coat-mackerel-forehead-outer-left')).toBe(false)
    expect(decals.some(decal => typeof decal[0] === 'string' && decal[0].startsWith('decal-coat-mackerel-')))
      .toBe(true)
  })

  it('does not rewrite a fixed coat layout Seed when toggling the coat', async () => {
    window.history.replaceState(
      null,
      '',
      '/?seed=v1-global&entity=cat&palette=tabby&coat=1&coatAlgorithm=mackerel&coatSeed=v1-fixed-layout'
    )
    await renderApp()
    const toggle = host.querySelector<HTMLButtonElement>('[aria-label="Coat pattern"]')

    act(() => toggle?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('coatSeed')).toBe('v1-fixed-layout')

    act(() => toggle?.click())
    await flushEffects()
    const restored = new URLSearchParams(window.location.search)
    expect(restored.get('coat')).toBe('1')
    expect(restored.get('coatSeed')).toBe('v1-fixed-layout')
  })

  it('removes an unreachable coat-pattern binding when switching to a custom body', async () => {
    window.history.replaceState(
      null,
      '',
      '/?seed=v1-tabby-cat&entity=custom&coat=1&seedFields=scene.appearance.coatPattern.algorithm'
    )
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-body')?.click())
    await flushEffects()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Sphere"]')?.click())
    await flushEffects()

    expect(new URLSearchParams(window.location.search).get('seedFields')).toBeNull()
  })

  it('does not emit a random generation record when an embedded definition has no Seed authoring state', async () => {
    const onDefinitionChange = vi.fn()
    await act(async () => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(App, {
          definition: createDefaultAvatarDefinition(),
          embedded: true,
          onDefinitionChange
        })
      ))
    })
    await flushEffects()
    expect(onDefinitionChange).not.toHaveBeenCalled()
  })

  it('does not normalize a legal legacy embedded coat pattern into a pseudo-change', async () => {
    const {
      lightPatchLength: _length,
      lightPatchOffsetY: _offsetY,
      lightPatchShape: _shape,
      lightPatchWidth: _width,
      ...legacyCoatPattern
    } = { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true }
    const base = createDefaultAvatarDefinition()
    const definition: AvatarDefinition = {
      ...base,
      scene: {
        ...base.scene,
        appearance: {
          ...base.scene.appearance,
          coatPattern: legacyCoatPattern
        },
        entity: {
          ...base.scene.entity,
          parts: createAvatarEntityParts('cat'),
          preset: 'cat'
        }
      }
    }
    const onDefinitionChange = vi.fn<(next: AvatarDefinition) => void>()
    await act(async () => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(App, { definition, embedded: true, onDefinitionChange })
      ))
    })
    await flushEffects()

    expect(onDefinitionChange).not.toHaveBeenCalled()
  })

  it('restores actual embedded Dog head dimensions without emitting a pseudo-change', async () => {
    const base = createDefaultAvatarDefinition()
    const definition: AvatarDefinition = {
      ...base,
      metadata: {
        generation: {
          fields: [AVATAR_SEED_FIELD.dogHeadWidth, AVATAR_SEED_FIELD.dogHeadHeight],
          profileId: 'corgi',
          seed: 'v1-embedded-dog-head',
          version: 1
        }
      },
      scene: {
        ...base.scene,
        entity: {
          ...base.scene.entity,
          parts: applyDogHeadScale(createAvatarEntityParts('dog'), 124, 88),
          preset: 'dog'
        }
      }
    }
    expect(isAvatarDefinition(definition)).toBe(true)
    const onDefinitionChange = vi.fn<(next: AvatarDefinition) => void>()
    await act(async () => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(App, { definition, embedded: true, onDefinitionChange })
      ))
    })
    await flushEffects()

    expect(onDefinitionChange).not.toHaveBeenCalled()
    expect(host.querySelector<HTMLInputElement>('[aria-label="Dog head width"]')?.value).toBe('124')
    expect(host.querySelector<HTMLInputElement>('[aria-label="Dog head height"]')?.value).toBe('88')
  })

  it('preserves an unknown future Cat profile as an embedded authoring hint', async () => {
    const base = createDefaultAvatarDefinition()
    const definition: AvatarDefinition = {
      ...base,
      metadata: {
        generation: {
          fields: [AVATAR_SEED_FIELD.palette],
          profileId: 'future-longhair-profile',
          seed: 'v1-future-profile',
          version: 1
        }
      },
      scene: {
        ...base.scene,
        entity: {
          ...base.scene.entity,
          parts: createAvatarEntityParts('cat'),
          preset: 'cat'
        }
      }
    }
    const onDefinitionChange = vi.fn<(next: AvatarDefinition) => void>()
    await act(async () => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(App, { definition, embedded: true, onDefinitionChange })
      ))
    })
    await flushEffects()

    expect(onDefinitionChange).not.toHaveBeenCalled()
  })

  it('preserves an unknown future non-Cat profile without an embedded pseudo-change', async () => {
    const base = createDefaultAvatarDefinition()
    const definition: AvatarDefinition = {
      ...base,
      metadata: {
        generation: {
          fields: [AVATAR_SEED_FIELD.facePreset],
          profileId: 'future-cross-entity-profile',
          seed: 'v1-future-cross-entity',
          version: 1
        }
      }
    }
    const onDefinitionChange = vi.fn<(next: AvatarDefinition) => void>()
    await act(async () => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(App, { definition, embedded: true, onDefinitionChange })
      ))
    })
    await flushEffects()

    expect(onDefinitionChange).not.toHaveBeenCalled()
  })

  it('materializes a width-200 light coat patch into a strict public definition and reloads it', async () => {
    const base = createDefaultAvatarDefinition()
    const definition = createAvatarDefinition({
      ...avatarDefinitionToState(base),
      coatPattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true, lightPatchWidth: 200 },
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat'
    }, base)
    const onDefinitionChange = vi.fn<(next: AvatarDefinition) => void>()
    await act(async () => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(App, { definition, embedded: true, onDefinitionChange })
      ))
    })
    await flushEffects()

    act(() => Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes('Convert to editable decals'))?.click())
    await flushEffects()
    const converted = onDefinitionChange.mock.calls.at(-1)?.[0]
    expect(converted).toBeDefined()
    expect(isAvatarDefinition(converted)).toBe(true)
    expect(converted?.scene.appearance.coatPattern?.enabled).toBe(false)
    const materializedPatch = converted?.scene.decals.find(decal => decal.width === 216)
    expect(materializedPatch).toBeDefined()

    const params = avatarDefinitionToSearchParams(converted!)
    expect(params.get('coat')).toBe('0')
    expect(JSON.parse(params.get('decals') ?? '[]').some((decal: unknown[]) => decal[5] === 216)).toBe(true)
    window.history.replaceState(null, '', `/?${params}`)
    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    expect(host.querySelector(`[data-avatar-surface-decal="${materializedPatch?.id}"]`)).not.toBeNull()
  })

  it('opens a core seeded definition without normalization and replays the same field value', async () => {
    const definition = createSeededAvatarDefinition({ seed: 'v1-agent-42' })
    const onDefinitionChange = vi.fn<(definition: AvatarDefinition) => void>()
    await act(async () => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(App, { definition, embedded: true, onDefinitionChange })
      ))
    })
    await flushEffects()
    expect(onDefinitionChange).not.toHaveBeenCalled()

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-style')?.click())
    await flushEffects()
    const paletteSeed = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Palette"]')
    expect(paletteSeed?.getAttribute('aria-checked')).toBe('true')
    act(() => paletteSeed?.click())
    await flushEffects()
    act(() => paletteSeed?.click())
    await flushEffects()

    const replayed = onDefinitionChange.mock.calls.at(-1)?.[0]
    expect(replayed?.scene.appearance.paletteId).toBe(definition.scene.appearance.paletteId)
    expect(replayed?.metadata?.generation?.fields).toContain('scene.appearance.paletteId')
  })
})
