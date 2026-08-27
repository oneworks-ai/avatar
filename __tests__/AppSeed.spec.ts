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
import { getAvatarBearBreedTemplate, resolveAvatarBearBreedTemplate } from '../src/avatarBreedTemplates'
import { AvatarLocaleProvider } from '../src/avatarLocale'
import { avatarDefinitionToSearchParams, avatarDefinitionToState, createAvatarDefinition } from '../src/avatarDefinition'
import { getAvatarAnimalBreedTemplate, resolveAvatarAnimalBreedTemplate } from '../src/avatarSpeciesBreeds'
import {
  applyDogHeadScale,
  createAvatarEntityParts,
  deserializeAvatarEntityParts,
  getAvatarEntityPresetScene,
  serializeAvatarEntityParts
} from '../src/avatarEntityPresets'
import {
  AVATAR_ANIMAL_SPECIES_SEED_FIELDS,
  AVATAR_SEED_FIELD,
  AVATAR_SEED_FIELDS,
  getAvatarAnimalSpeciesKey,
  getAvatarSeedFieldEntityPreset,
  isAvatarAnimalSpeciesId,
  resolveSeededAvatarEntityPreset,
  resolveSeededAvatarFacePreset,
  resolveSeededAvatarPaletteTone,
  serializeAvatarSeedFields
} from '../src/avatarSeed'
import { persistSavedAvatarPresets } from '../src/savedAvatarPresets'
import { serializeAvatarSurfaceDecals } from '../src/avatarSurfaceDecals'

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
  it('adjusts and reloads a standalone ellipse bottom taper through its shared URL', async () => {
    window.history.replaceState(null, '', '/?shape=ellipse&bottomTaper=42&seed=v1-taper')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-body')?.click())
    await flushEffects()

    const taper = host.querySelector<HTMLInputElement>('[aria-label="Body bottom taper"]')
    expect(taper?.value).toBe('42')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(taper, '79')
      taper?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('bottomTaper')).toBe('79')

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-body')?.click())
    await flushEffects()
    expect(host.querySelector<HTMLInputElement>('[aria-label="Body bottom taper"]')?.value).toBe('79')
  })

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
    act(() => host.querySelector<HTMLButtonElement>(
      '[aria-label="Face presets"] [aria-label="More presets"]'
    )?.click())
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
    const supportsCoat = entity === 'cat' || entity === 'dog' || entity === 'rabbit' ||
      entity === 'bear' || isAvatarAnimalSpeciesId(entity)
    const expectedFields = AVATAR_SEED_FIELDS.filter(field => {
      const owner = getAvatarSeedFieldEntityPreset(field)
      if (owner != null && owner !== entity) return false
      return supportsCoat || !field.startsWith('scene.appearance.coatPattern.')
    })
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

  it('restores the complete Fox scene and keeps its 3D markings in the shared URL', async () => {
    window.history.replaceState(
      null,
      '',
      '/?entity=rabbit&breed=lionhead-rabbit&rabbitEarWidth=112&rabbitHeadWidth=115&coat=1&seed=v1-fox-scene'
    )
    await renderApp()

    act(() => host.querySelector<HTMLButtonElement>('[data-entity-preset="fox"]')?.click())
    await flushEffects()

    const params = new URLSearchParams(window.location.search)
    const decals = JSON.parse(params.get('decals') ?? '[]') as unknown[][]
    expect(params.get('entity')).toBe('fox')
    expect(params.get('palette')).toBe('red-fox')
    expect(params.get('cameraBg')).toBe('#173d35')
    expect(params.get('noseShape')).toBe('inverted-triangle')
    expect(params.get('coat')).toBe('0')
    expect(params.get('seedFields')).toBeNull()
    expect(params.has('breed')).toBe(false)
    expect(params.has('rabbitEarWidth')).toBe(false)
    expect(params.has('rabbitHeadWidth')).toBe(false)
    expect(decals.map(decal => decal[0])).toEqual([
      'fox-inner-ear-left',
      'fox-inner-ear-right',
      'fox-cheek-left',
      'fox-cheek-right'
    ])
    expect(host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')).not.toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-body')?.click())
    await flushEffects()
    const foxTaper = host.querySelector<HTMLInputElement>('[aria-label="Part bottom taper"]')
    expect(foxTaper?.value).toBe('52')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(foxTaper, '83')
      foxTaper?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flushEffects()
    const adjustedParams = new URLSearchParams(window.location.search)
    expect(deserializeAvatarEntityParts(adjustedParams.get('entityParts'), 'fox')
      .find(part => part.id === 'fox-head')?.bottomTaper).toBe(83)

    const authoredScene = [
      'palette',
      'bg',
      'cameraBg',
      'yaw',
      'pitch',
      'eyeGap',
      'eyeLeftRot',
      'eyeRightRot',
      'noseShape',
      'noseY'
    ].map(key => [key, params.get(key)] as const)
    const authoredParts = deserializeAvatarEntityParts(adjustedParams.get('entityParts'), 'fox')
      .map(({ id, shape, baseColor, bottomTaper, highlightColor, shadowColor, foregroundColor }) => ({
        id,
        shape,
        baseColor,
        bottomTaper,
        highlightColor,
        shadowColor,
        foregroundColor
      }))

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()

    const reloaded = new URLSearchParams(window.location.search)
    expect(authoredScene.map(([key]) => [key, reloaded.get(key)] as const)).toEqual(authoredScene)
    expect(deserializeAvatarEntityParts(reloaded.get('entityParts'), 'fox')
      .map(({ id, shape, baseColor, bottomTaper, highlightColor, shadowColor, foregroundColor }) => ({
        id,
        shape,
        baseColor,
        bottomTaper,
        highlightColor,
        shadowColor,
        foregroundColor
      }))).toEqual(authoredParts)
    expect((JSON.parse(reloaded.get('decals') ?? '[]') as unknown[][])
      .map(decal => decal.slice(0, 12))).toEqual(decals.map(decal => decal.slice(0, 12)))
    expect(host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')).not.toBeNull()
  })

  it.each(['red-fox', 'arctic-fox', 'silver-fox', 'fennec-fox'] as const)(
    'restores the authored side-view composition and real markings from a bare %s link',
    async breed => {
      window.history.replaceState(null, '', `/?entity=fox&breed=${breed}&seed=v1-${breed}-bare`)
      await renderApp()

      const params = new URLSearchParams(window.location.search)
      expect(params.get('breed')).toBe(breed)
      expect(params.get('palette')).toBe(breed)
      expect(params.get('eyeShape')).toBe('rounded')
      expect(params.get('yaw')).toBe('0.2109')
      expect(params.get('pitch')).toBe('-0.2928')
      expect(params.get('roll')).toBe('0.424')
      expect(params.get('positionX')).toBe('-83.4663')
      expect(params.get('positionY')).toBe('95.6374')
      expect(params.get('scale')).toBe('1.7697')
      expect(host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')).not.toBeNull()

      if (breed === 'red-fox') {
        expect(params.get('eyeGap')).toBe('54')
        expect(params.get('eyeH')).toBe('37')
        expect(params.get('eyeW')).toBe('21')
        expect(params.get('noseW')).toBe('24')
        expect(params.get('noseH')).toBe('17')
        expect(params.get('noseY')).toBe('39')
      }
    }
  )

  it.each(['african-lion', 'lioness', 'white-lion', 'lion-cub'] as const)(
    'restores the approved cropped overhead composition from a bare %s link',
    async breed => {
      window.history.replaceState(null, '', `/?entity=lion&breed=${breed}&seed=v1-${breed}-approved-view`)
      await renderApp()

      const params = new URLSearchParams(window.location.search)
      expect(params.get('breed')).toBe(breed)
      expect(params.get('palette')).toBe(breed)
      expect(params.get('yaw')).toBe('0.5247')
      expect(params.get('pitch')).toBe('0.4877')
      expect(params.get('roll')).toBe('0.2')
      expect(params.get('positionX')).toBe('-95.8539')
      expect(params.get('positionY')).toBe('-43.7987')
      expect(params.get('scale')).toBe('1.64')
    }
  )

  it.each([
    ['seal', 'harbor-seal'],
    ['beaver', 'north-american-beaver'],
    ['guinea-pig', 'american-guinea-pig'],
    ['chinchilla', 'gray-chinchilla'],
    ['ferret', 'sable-ferret'],
    ['monkey', 'macaque']
  ] as const)(
    'restores the authored %s view and camera from a bare breed link and keeps it when reselecting the breed',
    async (species, breed) => {
      const scene = getAvatarEntityPresetScene(species)!
      window.history.replaceState(null, '', `/?entity=${species}&breed=${breed}&seed=v1-${species}-authored-view`)
      await renderApp()

      let params = new URLSearchParams(window.location.search)
      expect(params.get('breed')).toBe(breed)
      expect(Number(params.get('yaw'))).toBeCloseTo(scene.viewState.yaw, 4)
      expect(Number(params.get('pitch'))).toBeCloseTo(scene.viewState.pitch, 4)
      expect(Number(params.get('roll'))).toBeCloseTo(scene.viewState.roll, 4)
      expect(Number(params.get('positionX'))).toBeCloseTo(scene.viewState.positionX, 4)
      expect(Number(params.get('positionY'))).toBeCloseTo(scene.viewState.positionY, 4)
      expect(Number(params.get('scale'))).toBeCloseTo(scene.viewState.scale, 4)
      expect(params.get('camera')).toBe(scene.cameraMode ? '1' : '0')
      expect(params.get('cameraBg')).toBe(scene.cameraBackground)
      expect(params.get('cameraFrame')).toBe(scene.cameraFrame)

      act(() => host.querySelector<HTMLButtonElement>(`[data-animal-breed="${breed}"]`)?.click())
      await flushEffects()
      params = new URLSearchParams(window.location.search)
      expect(params.get('breed')).toBe(breed)
      expect(Number(params.get('yaw'))).toBeCloseTo(scene.viewState.yaw, 4)
      expect(Number(params.get('pitch'))).toBeCloseTo(scene.viewState.pitch, 4)
    }
  )

  it.each([
    ['seal', 'harbor-seal'],
    ['beaver', 'north-american-beaver'],
    ['guinea-pig', 'american-guinea-pig'],
    ['chinchilla', 'gray-chinchilla'],
    ['ferret', 'sable-ferret'],
    ['monkey', 'macaque']
  ] as const)(
    'preserves an explicit %s view and camera instead of applying the authored breed composition',
    async (species, breed) => {
      window.history.replaceState(
        null,
        '',
        `/?entity=${species}&breed=${breed}&yaw=0.31&pitch=-0.19&roll=0.11&positionX=17&positionY=43&scale=1.49&camera=0&cameraBg=%23124578&cameraFrame=circle`
      )
      await renderApp()
      const params = new URLSearchParams(window.location.search)
      expect(params.get('breed')).toBe(breed)
      expect(params.get('yaw')).toBe('0.31')
      expect(params.get('pitch')).toBe('-0.19')
      expect(params.get('roll')).toBe('0.11')
      expect(params.get('positionX')).toBe('17')
      expect(params.get('positionY')).toBe('43')
      expect(params.get('scale')).toBe('1.49')
      expect(params.get('camera')).toBe('0')
      expect(params.get('cameraBg')).toBe('#124578')
      expect(params.get('cameraFrame')).toBe('circle')
    }
  )

  it.each(['african-lion', 'lioness', 'white-lion', 'lion-cub'] as const)(
    'keeps the selected %s breed and approved composition when its preview is clicked again',
    async breed => {
      window.history.replaceState(null, '', `/?entity=lion&breed=${breed}&seed=v1-${breed}-selected`)
      await renderApp()

      act(() => host.querySelector<HTMLButtonElement>(`[data-animal-breed="${breed}"]`)?.click())
      await flushEffects()

      const params = new URLSearchParams(window.location.search)
      expect(params.get('breed')).toBe(breed)
      expect(params.get('palette')).toBe(breed)
      expect(params.get('yaw')).toBe('0.5247')
      expect(params.get('pitch')).toBe('0.4877')
      expect(params.get('roll')).toBe('0.2')
      expect(params.get('positionX')).toBe('-95.8539')
      expect(params.get('positionY')).toBe('-43.7987')
      expect(params.get('scale')).toBe('1.64')
    }
  )

  it.each(['african-lion', 'white-lion', 'lion-cub'] as const)(
    'keeps the %s mane proportional to its actual head throughout runtime Seed rerolls',
    async breed => {
      const template = getAvatarAnimalBreedTemplate('lion', breed)!
      const params = new URLSearchParams({
        breed,
        entity: 'lion',
        seed: `v1-${breed}-runtime-reroll`,
        seedFields: template.followByDefault.join(',')
      })
      window.history.replaceState(null, '', `/?${params.toString()}`)
      await renderApp()

      for (let iteration = 0; iteration < 6; iteration += 1) {
        act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
        await flushEffects()

        const randomized = new URLSearchParams(window.location.search)
        const headWidth = Number(randomized.get('lionHeadWidth') ?? template.fixed.headWidth)
        const headHeight = Number(randomized.get('lionHeadHeight') ?? template.fixed.headHeight)
        const maneSize = Number(randomized.get('lionManeSize'))
        const expectedMane = Math.round(template.fixed.hornSize! * Math.sqrt(
          headWidth / template.fixed.headWidth * headHeight / template.fixed.headHeight
        ))

        expect(randomized.get('breed')).toBe(breed)
        expect(Math.abs(maneSize - expectedMane)).toBeLessThanOrEqual(2)
        expect(randomized.get('yaw')).toBe('0.5247')
        expect(randomized.get('pitch')).toBe('0.4877')
      }
    }
  )

  it('keeps an explicitly authored lion pose while switching between lion breeds', async () => {
    window.history.replaceState(
      null,
      '',
      '/?entity=lion&breed=african-lion&yaw=0.32&pitch=-0.18&roll=0.12&positionX=18&positionY=44&scale=1.48'
    )
    await renderApp()

    act(() => host.querySelector<HTMLButtonElement>('[data-animal-breed="white-lion"]')?.click())
    await flushEffects()

    const params = new URLSearchParams(window.location.search)
    expect(params.get('breed')).toBe('white-lion')
    expect(params.get('yaw')).toBe('0.32')
    expect(params.get('pitch')).toBe('-0.18')
    expect(params.get('roll')).toBe('0.12')
    expect(params.get('positionX')).toBe('18')
    expect(params.get('positionY')).toBe('44')
    expect(params.get('scale')).toBe('1.48')
  })

  it('applies a Cat type as a deterministic Seed constraint profile', async () => {
    window.history.replaceState(null, '', '/?entity=cat&seed=v1-siamese-a')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('breed')).toBe('siamese')
    expect(selected.get('palette')).toBe('siamese')
    expect(selected.get('eyeShape')).toBe('rounded')
    expect(selected.get('coatLightPatchOffsetY')).toBe('-44')
    expect(selected.get('coatLightPatchShape')).toBe('ellipse')
    expect(selected.get('seedFields')).toBe([
      AVATAR_SEED_FIELD.palette,
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

  it('preserves unrelated Seed bindings when selecting a constrained Cat breed', async () => {
    const unrelatedFields = [
      AVATAR_SEED_FIELD.facePreset,
      AVATAR_SEED_FIELD.backgroundStyle,
      AVATAR_SEED_FIELD.cameraBackground,
      AVATAR_SEED_FIELD.viewPose
    ]
    window.history.replaceState(
      null,
      '',
      `/?entity=cat&seed=v1-siamese-keep-fields&seedFields=${serializeAvatarSeedFields(unrelatedFields)}`
    )
    await renderApp()

    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    const seededFields = selected.get('seedFields')?.split(',') ?? []
    expect(selected.get('breed')).toBe('siamese')
    expect(seededFields).toContain(AVATAR_SEED_FIELD.coatPatternLightPatchLength)
    expect(seededFields).toContain(AVATAR_SEED_FIELD.coatPatternLightPatchWidth)
    for (const field of unrelatedFields) expect(seededFields).toContain(field)
    expect(seededFields).toContain(AVATAR_SEED_FIELD.palette)
  })

  it('applies a Dog type as a deterministic constrained profile with Dog-only ear fields', async () => {
    window.history.replaceState(null, '', '/?entity=dog&seed=v1-husky-a')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-dog-breed="husky"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('entity')).toBe('dog')
    expect(selected.get('breed')).toBe('husky')
    expect(selected.get('eyeShape')).toBe('rounded')
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

  it('applies a Rabbit type as a deterministic constrained profile with Rabbit-only 3D size fields', async () => {
    window.history.replaceState(null, '', '/?entity=rabbit&seed=v1-holland-lop-a')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-rabbit-breed="holland-lop"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('entity')).toBe('rabbit')
    expect(selected.get('breed')).toBe('holland-lop')
    expect(selected.get('eyeShape')).toBe('rounded')
    expect(selected.get('palette')).toBe('holland-lop')
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.rabbitEarWidth)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.rabbitEarHeight)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.rabbitHeadWidth)
    expect(selected.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.catEarWidth)
    expect(selected.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogEarWidth)
    expect(Number(selected.get('rabbitEarWidth'))).toBeGreaterThanOrEqual(108)
    expect(Number(selected.get('rabbitEarWidth'))).toBeLessThanOrEqual(128)
    expect(Number(selected.get('rabbitHeadWidth'))).toBeGreaterThanOrEqual(106)
    expect(Number(selected.get('rabbitHeadWidth'))).toBeLessThanOrEqual(118)

    const fixed = {
      palette: selected.get('palette'),
      style: deserializeAvatarEntityParts(selected.get('entityParts'), 'rabbit').find(part => part.id === 'ear-left')?.shape
    }
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('breed')).toBe('holland-lop')
    expect(rerolled.get('palette')).toBe(fixed.palette)
    expect(deserializeAvatarEntityParts(rerolled.get('entityParts'), 'rabbit').find(part => part.id === 'ear-left')?.shape)
      .toBe(fixed.style)
  })

  it('round-trips Bear-only virtual dimensions without leaking them into other species', async () => {
    window.history.replaceState(null, '', '/?entity=bear&breed=giant-panda&bearEarWidth=112&bearEarHeight=108&bearHeadWidth=116&bearHeadHeight=104&seed=v1-bear-url')
    await renderApp()
    const bear = new URLSearchParams(window.location.search)
    expect(bear.get('entity')).toBe('bear')
    expect(bear.get('breed')).toBe('giant-panda')
    expect(bear.get('bearHeadWidth')).toBe('116')
    expect(bear.get('bearEarHeight')).toBe('108')
    expect(bear.get('seedFields') ?? '').not.toContain(AVATAR_SEED_FIELD.rabbitHeadWidth)
  })

  it('applies a Bear type as a deterministic constrained profile with Bear-only 3D size fields', async () => {
    window.history.replaceState(null, '', '/?entity=bear&seed=v1-giant-panda-a')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-bear-breed="giant-panda"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('entity')).toBe('bear')
    expect(selected.get('breed')).toBe('giant-panda')
    expect(selected.get('eyeShape')).toBe('rounded')
    expect(selected.get('palette')).toBe('giant-panda')
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.bearEarWidth)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.bearHeadWidth)
    expect(selected.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.catEarWidth)
    expect(selected.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogEarWidth)
    expect(selected.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.rabbitEarWidth)
    expect(Number(selected.get('bearEarWidth'))).toBeGreaterThanOrEqual(108)
    expect(Number(selected.get('bearEarWidth'))).toBeLessThanOrEqual(128)
    expect(Number(selected.get('bearHeadWidth'))).toBeGreaterThanOrEqual(108)
    expect(Number(selected.get('bearHeadWidth'))).toBeLessThanOrEqual(124)

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('breed')).toBe('giant-panda')
    expect(rerolled.get('palette')).toBe('giant-panda')
    expect(Number(rerolled.get('bearEarWidth'))).toBeGreaterThanOrEqual(108)
    expect(Number(rerolled.get('bearEarWidth'))).toBeLessThanOrEqual(128)
    expect(Number(rerolled.get('bearHeadWidth'))).toBeGreaterThanOrEqual(108)
    expect(Number(rerolled.get('bearHeadWidth'))).toBeLessThanOrEqual(124)
    expect(deserializeAvatarEntityParts(rerolled.get('entityParts'), 'bear').find(part => part.id === 'ear-left')?.baseColor)
      .toBe('#24272a')
  })

  it('restores the Koala vertical nose from a bare breed link and keeps it after rerolling', async () => {
    window.history.replaceState(null, '', '/?entity=bear&breed=koala&seed=v1-koala-nose')
    await renderApp()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('palette')).toBe('koala')
    expect(selected.get('eyeShape')).toBe('rounded')
    expect(selected.get('nose')).toBe('1')
    expect(selected.get('noseShape')).toBe('ellipse')
    expect(selected.get('noseW')).toBe('32')
    expect(selected.get('noseH')).toBe('42')
    expect(selected.get('noseY')).toBe('30')

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('nose')).toBe('1')
    expect(rerolled.get('noseShape')).toBe('ellipse')
    expect(rerolled.get('noseW')).toBe('32')
    expect(rerolled.get('noseH')).toBe('42')
  })

  it('preserves manually authored Koala nose overrides in a complete shared link', async () => {
    window.history.replaceState(null, '', '/?entity=bear&breed=koala&nose=1&noseShape=rounded&noseW=24&noseH=36&noseY=27')
    await renderApp()
    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('noseShape')).toBe('rounded')
    expect(selected.get('noseW')).toBe('24')
    expect(selected.get('noseH')).toBe('36')
    expect(selected.get('noseY')).toBe('27')
  })

  it('keeps the Koala anatomical nose while independently randomizing its eyes', async () => {
    window.history.replaceState(
      null,
      '',
      '/?entity=bear&breed=koala&seed=v1-koala-face&seedFields=scene.face.preset'
    )
    await renderApp()

    for (let iteration = 0; iteration < 3; iteration += 1) {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('eyeShape')).toBe('rounded')
      expect(params.get('nose')).toBe('1')
      expect(params.get('noseShape')).toBe('ellipse')
      expect(params.get('noseW')).toBe('32')
      expect(params.get('noseH')).toBe('42')
      expect(params.get('noseY')).toBe('30')

      act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
      await flushEffects()
    }
  })

  it.each([
    ['pig', 'pink-pig'],
    ['cow', 'dairy-cow']
  ] as const)('keeps the real %s snout visible when facial expressions follow Seed', async (species, breed) => {
    window.history.replaceState(
      null,
      '',
      `/?entity=${species}&breed=${breed}&seed=v1-${species}-face&seedFields=scene.face.preset`
    )
    await renderApp()

    for (let iteration = 0; iteration < 3; iteration += 1) {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('eyeShape')).toBe('rounded')
      expect(params.get('nose')).toBe('0')
      expect(params.get('mouth')).toBe('0')
      expect(host.querySelector('[data-avatar-entity-part="snout"]')).not.toBeNull()
      expect(host.querySelector('[data-avatar-entity-part="nostril-left"]')).not.toBeNull()
      expect(host.querySelector('[data-avatar-entity-part="nostril-right"]')).not.toBeNull()

      act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
      await flushEffects()
    }
  })

  it.each([
    ['sheep', 'black-faced-sheep'],
    ['otter', 'river-otter'],
    ['deer', 'sika-deer'],
    ['pig', 'pink-pig']
  ] as const)('preserves an explicitly selected ellipse eye shape in a legacy %s share link', async (species, breed) => {
    window.history.replaceState(null, '', `/?entity=${species}&breed=${breed}&eyeShape=ellipse&seed=v1-${breed}-manual-eyes`)
    await renderApp()

    expect(new URLSearchParams(window.location.search).get('eyeShape')).toBe('ellipse')
    expect(host.querySelector('[aria-label="Eye shape"] [role="radio"][aria-checked="true"]')?.textContent)
      .toContain('Ellipse')

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('eyeShape')).toBe('ellipse')

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    expect(new URLSearchParams(window.location.search).get('eyeShape')).toBe('ellipse')
  })

  it.each([
    ['pig', 'spotted-pig'],
    ['deer', 'sika-deer'],
    ['deer', 'deer-fawn']
  ] as const)('restores the natural curved markings from a bare %s breed link', async (species, id) => {
    window.history.replaceState(null, '', `/?entity=${species}&breed=${id}&seed=v1-${id}-bare`)
    await renderApp()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('palette')).toBe(id)
    expect(selected.get('coat')).toBe('1')
    expect(host.querySelector(`[data-avatar-surface-decal^="coat-${species}-spots-"]`)).not.toBeNull()
  })

  it.each([
    ['cow', 'dairy-cow', 'coat-cow-spots-'],
    ['squirrel', 'chipmunk', 'coat-chipmunk-'],
    ['tiger', 'bengal-tiger', 'coat-tiger-'],
    ['tiger', 'white-tiger', 'coat-tiger-'],
    ['tiger', 'golden-tiger', 'coat-tiger-'],
    ['tiger', 'tiger-cub', 'coat-tiger-']
  ] as const)('restores the authentic curved %s markings from a bare %s share link', async (species, id, decalId) => {
    window.history.replaceState(null, '', `/?entity=${species}&breed=${id}&seed=v1-${id}-bare-markings`)
    await renderApp()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('palette')).toBe(id)
    expect(selected.get('coat')).toBe('1')
    expect(host.querySelector(
      `.interactive-avatar__canvas [data-avatar-entity-part] [data-avatar-surface-decal^="${decalId}"]`
    )).not.toBeNull()
  })

  it.each([
    ['hamster', 'syrian-hamster'],
    ['hamster', 'pudding-hamster'],
    ['hamster', 'silver-fox-hamster'],
    ['hamster', 'sapphire-hamster'],
    ['squirrel', 'red-squirrel'],
    ['squirrel', 'gray-squirrel'],
    ['squirrel', 'chipmunk'],
    ['squirrel', 'black-squirrel'],
    ['capybara', 'capybara'],
    ['capybara', 'sandy-capybara'],
    ['capybara', 'dark-capybara'],
    ['capybara', 'capybara-pup']
  ] as const)('keeps %s %s fur color on its actual anatomical surface across sharing and Seed rerolls', async (
    species,
    breed
  ) => {
    window.history.replaceState(null, '', `/?entity=${species}&breed=${breed}&seed=v1-${breed}-anatomical-fur`)
    await renderApp()

    const assertAnatomicalMarkings = () => {
      const params = new URLSearchParams(window.location.search)
      const parts = deserializeAvatarEntityParts(params.get('entityParts'), species)
      const head = parts.find(part => part.face)!
      const anatomicalIds = species === 'capybara' ? ['muzzle'] : ['cheek-left', 'cheek-right']

      for (const partId of anatomicalIds) {
        const part = parts.find(candidate => candidate.id === partId)!
        expect(part.baseColor).toBe(head.baseColor)
        expect(part.highlightColor).toBe(head.highlightColor)
        expect(part.shadowColor).toBe(head.shadowColor)
        const decalId = species === 'capybara' ? 'capybara-muzzle-fur' : `${species}-${partId}`
        expect(host.querySelector(
          `.interactive-avatar__canvas [data-avatar-entity-part="${partId}"] ` +
          `[data-avatar-surface-decal="${decalId}"]`
        )).not.toBeNull()
        expect(params.get('decals')).toContain(decalId)
      }
    }

    assertAnatomicalMarkings()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    assertAnatomicalMarkings()

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    assertAnatomicalMarkings()
  })

  it.each([
    ['hamster', 'syrian-hamster'],
    ['squirrel', 'red-squirrel'],
    ['capybara', 'capybara']
  ] as const)('migrates legacy %s colored anatomy into body-colored volume and projected fur', async (
    species,
    breed
  ) => {
    const template = getAvatarAnimalBreedTemplate(species, breed)!
    const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${breed}-legacy-anatomy`)
    const head = resolved.entityParts.find(part => part.face)!
    const anatomicalIds = species === 'capybara' ? ['muzzle'] : ['cheek-left', 'cheek-right']
    const legacyParts = resolved.entityParts.map(part => anatomicalIds.includes(part.id)
      ? {
          ...part,
          baseColor: template.fixed.surfaceFaceMarkings!.color,
          ...(species === 'capybara' ? { scaleZ: .25, z: 57 } : {})
        }
      : part)
    const params = new URLSearchParams({
      breed,
      entity: species,
      entityParts: serializeAvatarEntityParts(legacyParts),
      seed: `v1-${breed}-legacy-anatomy`
    })
    window.history.replaceState(null, '', `/?${params.toString()}`)
    await renderApp()

    const shared = new URLSearchParams(window.location.search)
    const migratedParts = deserializeAvatarEntityParts(shared.get('entityParts'), species)
    for (const partId of anatomicalIds) {
      const part = migratedParts.find(candidate => candidate.id === partId)!
      expect(part.baseColor).toBe(head.baseColor)
      expect(part.highlightColor).toBe(head.highlightColor)
      expect(part.shadowColor).toBe(head.shadowColor)
      const decalId = species === 'capybara' ? 'capybara-muzzle-fur' : `${species}-${partId}`
      expect(host.querySelector(
        `.interactive-avatar__canvas [data-avatar-entity-part="${partId}"] ` +
        `[data-avatar-surface-decal="${decalId}"]`
      )).not.toBeNull()
    }
    if (species === 'capybara') {
      expect(migratedParts.find(part => part.id === 'muzzle')?.scaleZ).toBeGreaterThan(.35)
    }
  })

  it.each([
    ['hamster', 'pudding-hamster'],
    ['squirrel', 'chipmunk'],
    ['capybara', 'dark-capybara']
  ] as const)('restores missing legacy %s fur decals without replacing manually saved markings', async (
    species,
    breed
  ) => {
    const resolved = resolveAvatarAnimalBreedTemplate(
      getAvatarAnimalBreedTemplate(species, breed)!,
      `v1-${breed}-legacy-decals`
    )
    const preserved = {
      ...resolved.surfaceDecals![0]!,
      color: '#12ab34',
      id: 'manually-saved-marking',
      targetPartId: 'primary'
    }
    const params = new URLSearchParams({
      breed,
      decals: serializeAvatarSurfaceDecals([preserved]),
      entity: species,
      entityParts: serializeAvatarEntityParts(resolved.entityParts),
      seed: `v1-${breed}-legacy-decals`
    })
    window.history.replaceState(null, '', `/?${params.toString()}`)
    await renderApp()

    expect(host.querySelector('[data-avatar-surface-decal="manually-saved-marking"]')?.getAttribute('fill'))
      .toBe('#12ab34')
    const required = species === 'capybara'
      ? ['capybara-muzzle-fur']
      : [`${species}-cheek-left`, `${species}-cheek-right`]
    for (const decal of required) {
      expect(host.querySelector(`[data-avatar-surface-decal="${decal}"]`)).not.toBeNull()
      expect(new URLSearchParams(window.location.search).get('decals')).toContain(decal)
    }
  })

  it.each([
    ['sheep', 'white-sheep'],
    ['sheep', 'black-faced-sheep'],
    ['sheep', 'horned-ram'],
    ['sheep', 'lamb'],
    ['sheep', 'mountain-goat'],
    ['deer', 'sika-deer'],
    ['deer', 'reindeer'],
    ['deer', 'white-deer'],
    ['deer', 'deer-fawn'],
    ['otter', 'sea-otter'],
    ['otter', 'river-otter'],
    ['otter', 'asian-small-clawed-otter']
  ] as const)('keeps the %s %s face marking attached across sharing and Seed rerolls', async (species, id) => {
    window.history.replaceState(null, '', `/?entity=${species}&breed=${id}&seed=v1-${id}-surface`)
    await renderApp()

    const findMask = () => host.querySelector<SVGPathElement>(
      `.interactive-avatar__canvas [data-avatar-entity-part="primary"] [data-avatar-surface-decal="${species}-face-mask"]`
    )
    const originalMask = findMask()
    expect(originalMask).not.toBeNull()
    expect(host.querySelector('.interactive-avatar__canvas [data-avatar-entity-part="muzzle"]')).toBeNull()
    expect(originalMask?.getAttribute('fill')).not.toBe(getAvatarPalette(id).foreground)

    const initial = new URLSearchParams(window.location.search)
    expect(initial.get('decals')).toContain(`${species}-face-mask`)
    expect(initial.get('entityParts')).not.toContain('"muzzle"')

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('breed')).toBe(id)
    expect(findMask()?.getAttribute('fill')).toBe(originalMask?.getAttribute('fill'))
    expect(host.querySelector('.interactive-avatar__canvas [data-avatar-entity-part="muzzle"]')).toBeNull()

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    expect(findMask()?.getAttribute('fill')).toBe(originalMask?.getAttribute('fill'))
    expect(host.querySelector('.interactive-avatar__canvas [data-avatar-entity-part="muzzle"]')).toBeNull()
  })

  it.each([
    ['sheep', 'black-faced-sheep', '#39353a'],
    ['deer', 'sika-deer', '#f5e7cf'],
    ['otter', 'river-otter', '#e5d0ad']
  ] as const)('migrates the legacy protruding %s muzzle in an old share link to its head surface', async (
    species,
    breed,
    expectedColor
  ) => {
    const currentParts = createAvatarEntityParts(species).map(part => {
      if (species !== 'sheep') return part
      if (part.face) return { ...part, scaleZ: .65 }
      if (part.id.startsWith('wool-')) return { ...part, scaleZ: .26 }
      if (part.id === 'ear-left' || part.id === 'ear-right') return { ...part, scaleZ: .17 }
      return part
    })
    const head = currentParts.find(part => part.face)!
    const legacyMuzzle = {
      ...head,
      face: false,
      id: 'muzzle',
      label: `Legacy ${species} muzzle`,
      scaleX: .34,
      scaleY: .26,
      scaleZ: .2,
      x: 0,
      y: 42,
      z: 49
    }
    const params = new URLSearchParams({
      breed,
      entity: species,
      entityParts: serializeAvatarEntityParts([...currentParts, legacyMuzzle]),
      seed: `v1-legacy-${species}-muzzle`
    })
    window.history.replaceState(null, '', `/?${params.toString()}`)
    await renderApp()

    const shared = new URLSearchParams(window.location.search)
    const restoredParts = deserializeAvatarEntityParts(shared.get('entityParts'), species)
    expect(restoredParts.some(part => part.id === 'muzzle')).toBe(false)
    if (species === 'sheep') {
      expect(restoredParts.find(part => part.face)?.scaleZ).toBeCloseTo(.82)
      expect(restoredParts.filter(part => part.id.startsWith('wool-'))
        .every(part => (part.scaleZ ?? 0) >= .34)).toBe(true)
      expect(restoredParts.filter(part => part.id === 'ear-left' || part.id === 'ear-right')
        .every(part => (part.scaleZ ?? 0) >= .24)).toBe(true)
    }
    expect(host.querySelector('.interactive-avatar__canvas [data-avatar-entity-part="muzzle"]')).toBeNull()
    expect(host.querySelector(
      `.interactive-avatar__canvas [data-avatar-entity-part="primary"] [data-avatar-surface-decal="${species}-face-mask"]`
    )?.getAttribute('fill')).toBe(expectedColor)
  })

  it.each([
    ['fox', 'fennec-fox'],
    ['hamster', 'pudding-hamster'],
    ['capybara', 'dark-capybara'],
    ['otter', 'sea-otter'],
    ['pig', 'spotted-pig'],
    ['deer', 'reindeer'],
    ['sheep', 'horned-ram'],
    ['alpaca', 'caramel-alpaca'],
    ['cow', 'highland-cow'],
    ['squirrel', 'chipmunk'],
    ['tiger', 'white-tiger'],
    ['lion', 'white-lion'],
    ['hedgehog', 'albino-hedgehog'],
    ['seal', 'harp-seal'],
    ['beaver', 'eurasian-beaver'],
    ['guinea-pig', 'teddy-guinea-pig'],
    ['chinchilla', 'black-velvet-chinchilla'],
    ['ferret', 'panda-ferret'],
    ['monkey', 'golden-monkey']
  ] as const)('applies and restores a constrained %s breed with species-specific Seed fields', async (species, id) => {
    window.history.replaceState(null, '', `/?entity=${species}&seed=v1-${id}-editor`)
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>(`[data-animal-breed="${id}"]`)?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    const template = getAvatarAnimalBreedTemplate(species, id)!
    expect(selected.get('entity')).toBe(species)
    expect(selected.get('breed')).toBe(id)
    expect(selected.get('palette')).toBe(id)
    expect(selected.get('eyeShape')).toBe('rounded')
    const speciesKey = getAvatarAnimalSpeciesKey(species)
    expect(Number(selected.get(`${speciesKey}HeadWidth`))).toBeGreaterThan(0)
    expect(Number(selected.get(`${speciesKey}EarHeight`))).toBeGreaterThan(0)

    const follows = selected.get('seedFields')?.split(',') ?? []
    for (const field of template.followByDefault) expect(follows).toContain(field)
    for (const field of follows) {
      const owner = getAvatarSeedFieldEntityPreset(field)
      if (owner != null) expect(owner).toBe(species)
    }
    if (species === 'pig') {
      expect(selected.get('nose')).toBe('0')
      expect(selected.get('coat')).toBe('1')
    }
    if (species === 'fox') {
      expect(host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')).not.toBeNull()
      expect(Number(selected.get('foxEarHeight'))).toBeGreaterThanOrEqual(163)
      expect(selected.get('decals')).not.toBeNull()
    }
    if (species === 'deer') expect(selected.get('deerAntlerSize')).not.toBeNull()
    if (species === 'sheep') expect(selected.get('sheepHornSize')).not.toBeNull()
    if (species === 'cow') expect(selected.get('cowHornSize')).not.toBeNull()
    if (species === 'squirrel') expect(selected.get('squirrelTailSize')).not.toBeNull()
    if (species === 'lion') expect(selected.get('lionManeSize')).not.toBeNull()
    if (species === 'hedgehog') expect(selected.get('hedgehogSpineSize')).not.toBeNull()
    if (species === 'beaver') expect(selected.get('beaverToothSize')).not.toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('breed')).toBe(id)
    expect(rerolled.get('palette')).toBe(id)

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    const restored = new URLSearchParams(window.location.search)
    expect(restored.get('breed')).toBe(id)
    expect(restored.get('palette')).toBe(id)
    expect(restored.get(`${speciesKey}HeadWidth`)).toBe(rerolled.get(`${speciesKey}HeadWidth`))
  })

  it('freezes a manually adjusted new-species head width while keeping breed colors and horns fixed', async () => {
    window.history.replaceState(null, '', '/?entity=deer&seed=v1-deer-manual')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-animal-breed="reindeer"]')?.click())
    await flushEffects()

    const slider = host.querySelector<HTMLInputElement>('[aria-label="Deer head width"]')
    expect(slider).not.toBeNull()
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(slider, '109')
      slider?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flushEffects()
    const manual = new URLSearchParams(window.location.search)
    expect(manual.get('deerHeadWidth')).toBe('109')
    expect(manual.get('seedFields') ?? '').not.toContain(AVATAR_ANIMAL_SPECIES_SEED_FIELDS.deer.headWidth)

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('deerHeadWidth')).toBe('109')
    expect(rerolled.get('palette')).toBe('reindeer')
    expect(deserializeAvatarEntityParts(rerolled.get('entityParts'), 'deer')
      .filter(part => part.id.startsWith('antler-'))).toHaveLength(8)
  })

  it.each([
    ['cow', 'highland-cow', 'Cow horn size', 'cowHornSize', 'horn-', '112'],
    ['squirrel', 'red-squirrel', 'Squirrel tail size', 'squirrelTailSize', 'tail-', '106'],
    ['lion', 'african-lion', 'Lion mane size', 'lionManeSize', 'mane-', '109'],
    ['hedgehog', 'european-hedgehog', 'Hedgehog spine size', 'hedgehogSpineSize', 'spine-', '104'],
    ['beaver', 'north-american-beaver', 'Incisor size', 'beaverToothSize', 'tooth-', '101']
  ] as const)(
    'preserves a manually adjusted %s anatomical feature through Seed changes and share restoration',
    async (species, breed, label, queryKey, partPrefix, value) => {
      window.history.replaceState(null, '', `/?entity=${species}&breed=${breed}&seed=v1-${breed}-manual-feature`)
      await renderApp()

      const slider = host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)
      expect(slider).not.toBeNull()
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        setter?.call(slider, value)
        slider?.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await flushEffects()

      const manual = new URLSearchParams(window.location.search)
      expect(manual.get(queryKey)).toBe(value)
      expect(manual.get('seedFields') ?? '').not.toContain(`scene.entity.${queryKey}`)
      const originalParts = deserializeAvatarEntityParts(manual.get('entityParts'), species)
      const originalFeature = originalParts.filter(part => part.id.startsWith(partPrefix))
      expect(originalFeature.length).toBeGreaterThan(0)

      act(() => root.unmount())
      root = createRoot(host)
      await renderApp()
      expect(new URLSearchParams(window.location.search).get(queryKey)).toBe(value)

      act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
      await flushEffects()
      const randomized = new URLSearchParams(window.location.search)
      expect(randomized.get(queryKey), `${queryKey}: ${randomized.get('seedFields')}`).toBe(value)
      expect(randomized.get('palette')).toBe(breed)
      expect(deserializeAvatarEntityParts(randomized.get('entityParts'), species)
        .filter(part => part.id.startsWith(partPrefix))).toHaveLength(originalFeature.length)

      act(() => root.unmount())
      root = createRoot(host)
      await renderApp()
      expect(new URLSearchParams(window.location.search).get(queryKey)).toBe(value)
    }
  )

  it('clears previous-species dimensions and Seed followers when switching between new animal types', async () => {
    window.history.replaceState(null, '', '/?entity=hamster&seed=v1-species-switch')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-animal-breed="syrian-hamster"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('seedFields')).toContain(
      AVATAR_ANIMAL_SPECIES_SEED_FIELDS.hamster.headWidth
    )

    act(() => host.querySelector<HTMLButtonElement>('[data-entity-preset="pig"]')?.click())
    await flushEffects()
    const pig = new URLSearchParams(window.location.search)
    expect(pig.get('entity')).toBe('pig')
    expect(pig.get('hamsterHeadWidth')).toBeNull()
    expect(pig.get('breed')).toBeNull()
    expect(pig.get('seedFields') ?? '').not.toContain('hamster')
  })

  it('restores legible Spectacled Bear facial colors from legacy links and preserves them across Seed rerolls', async () => {
    const template = getAvatarBearBreedTemplate('spectacled-bear')!
    const legacyParts = resolveAvatarBearBreedTemplate(template, 'v1-spectacled-legacy').entityParts.map(part => (
      part.face ? { ...part, foregroundColor: getAvatarPalette('spectacled-bear').foreground } : part
    ))
    const params = new URLSearchParams({
      breed: 'spectacled-bear',
      coat: '1',
      entity: 'bear',
      entityParts: serializeAvatarEntityParts(legacyParts),
      palette: 'spectacled-bear',
      seed: 'v1-spectacled-legacy',
      seedFields: `${AVATAR_SEED_FIELD.bearHeadWidth},${AVATAR_SEED_FIELD.palette}`
    })
    window.history.replaceState(null, '', `/?${params.toString()}`)
    await renderApp()

    const restored = new URLSearchParams(window.location.search)
    expect(deserializeAvatarEntityParts(restored.get('entityParts'), 'bear').find(part => part.face)?.foregroundColor)
      .toBe('#241711')
    expect(host.querySelector('.interactive-avatar__canvas path[fill="#241711"]')).not.toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(deserializeAvatarEntityParts(rerolled.get('entityParts'), 'bear').find(part => part.face)?.foregroundColor)
      .toBe('#241711')

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    const reloaded = new URLSearchParams(window.location.search)
    expect(deserializeAvatarEntityParts(reloaded.get('entityParts'), 'bear').find(part => part.face)?.foregroundColor)
      .toBe('#241711')
  })

  it('preserves manually authored Spectacled Bear facial colors while upgrading the old default', async () => {
    const template = getAvatarBearBreedTemplate('spectacled-bear')!
    const customizedParts = resolveAvatarBearBreedTemplate(template, 'v1-spectacled-custom').entityParts.map(part => (
      part.face ? { ...part, foregroundColor: '#753923' } : part
    ))
    const params = new URLSearchParams({
      breed: 'spectacled-bear',
      coat: '1',
      entity: 'bear',
      entityParts: serializeAvatarEntityParts(customizedParts),
      palette: 'spectacled-bear',
      seed: 'v1-spectacled-custom'
    })
    window.history.replaceState(null, '', `/?${params.toString()}`)
    await renderApp()

    const restored = new URLSearchParams(window.location.search)
    expect(deserializeAvatarEntityParts(restored.get('entityParts'), 'bear').find(part => part.face)?.foregroundColor)
      .toBe('#753923')
  })

  it('clears Bear-only Seed bindings and concrete dimensions when switching animal types', async () => {
    window.history.replaceState(null, '', '/?entity=bear&seed=v1-bear-switch')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-bear-breed="giant-panda"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('bearHeadWidth')).not.toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('[data-entity-preset="dog"]')?.click())
    await flushEffects()
    const params = new URLSearchParams(window.location.search)
    expect(params.get('entity')).toBe('dog')
    expect(params.get('seedFields') ?? '').not.toContain(AVATAR_SEED_FIELD.bearEarWidth)
    expect(params.get('seedFields') ?? '').not.toContain(AVATAR_SEED_FIELD.bearHeadWidth)
    expect(params.has('bearEarWidth')).toBe(false)
    expect(params.has('bearEarHeight')).toBe(false)
    expect(params.has('bearHeadWidth')).toBe(false)
    expect(params.has('bearHeadHeight')).toBe(false)
  })

  it('freezes an independently edited Bear head width across Seed rerolls and URL reloads', async () => {
    window.history.replaceState(null, '', '/?entity=bear&seed=v1-giant-panda-head')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-bear-breed="giant-panda"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('seedFields')).toContain(AVATAR_SEED_FIELD.bearHeadWidth)

    act(() => {
      const width = host.querySelector<HTMLInputElement>('[aria-label="Bear head width"]')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(width, '126')
      width?.dispatchEvent(new Event('input', { bubbles: true }))
      width?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flushEffects()

    const manual = new URLSearchParams(window.location.search)
    expect(manual.get('breed')).toBe('giant-panda')
    expect(manual.get('bearHeadWidth')).toBe('126')
    expect(manual.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.bearHeadWidth)
    expect(manual.get('seedFields')).toContain(AVATAR_SEED_FIELD.bearEarWidth)

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('bearHeadWidth')).toBe('126')
    const head = deserializeAvatarEntityParts(rerolled.get('entityParts'), 'bear').find(part => part.face)

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    const reloaded = new URLSearchParams(window.location.search)
    expect(reloaded.get('bearHeadWidth')).toBe('126')
    expect(deserializeAvatarEntityParts(reloaded.get('entityParts'), 'bear').find(part => part.face)).toEqual(head)
  })

  it('clears Rabbit-only Seed bindings when switching to another entity type', async () => {
    const seededFields = serializeAvatarSeedFields([
      AVATAR_SEED_FIELD.rabbitEarWidth,
      AVATAR_SEED_FIELD.rabbitEarHeight,
      AVATAR_SEED_FIELD.rabbitHeadWidth,
      AVATAR_SEED_FIELD.rabbitHeadHeight,
      AVATAR_SEED_FIELD.facePreset
    ])
    window.history.replaceState(null, '', `/?entity=rabbit&seed=v1-rabbit-switch&seedFields=${seededFields}`)
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-entity-preset="dog"]')?.click())
    await flushEffects()
    const params = new URLSearchParams(window.location.search)
    expect(params.get('entity')).toBe('dog')
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.rabbitEarWidth)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.rabbitEarHeight)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.rabbitHeadWidth)
    expect(params.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.rabbitHeadHeight)
    expect(params.has('rabbitEarWidth')).toBe(false)
    expect(params.has('rabbitHeadWidth')).toBe(false)
  })

  it('clears Rabbit profile dimensions when switching directly from Rabbit to Cat', async () => {
    window.history.replaceState(null, '', '/?entity=rabbit&seed=v1-rabbit-cat-switch')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-rabbit-breed="lionhead-rabbit"]')?.click())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('rabbitHeadWidth')).not.toBeNull()

    const rabbit = new URLSearchParams(window.location.search)
    rabbit.set('breed', 'siamese')
    rabbit.set('entity', 'cat')
    act(() => root.unmount())
    window.history.replaceState(null, '', `/?${rabbit.toString()}`)
    root = createRoot(host)
    await renderApp()
    const params = new URLSearchParams(window.location.search)
    expect(params.get('entity')).toBe('cat')
    expect(params.get('breed')).toBe('siamese')
    expect(params.has('rabbitEarWidth')).toBe(false)
    expect(params.has('rabbitEarHeight')).toBe(false)
    expect(params.has('rabbitHeadWidth')).toBe(false)
    expect(params.has('rabbitHeadHeight')).toBe(false)
  })

  it('freezes an independently edited Rabbit head width across Seed rerolls and URL reloads', async () => {
    window.history.replaceState(null, '', '/?entity=rabbit&seed=v1-lionhead-head')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-rabbit-breed="lionhead-rabbit"]')?.click())
    await flushEffects()

    const selected = new URLSearchParams(window.location.search)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.rabbitHeadWidth)
    expect(selected.get('seedFields')).toContain(AVATAR_SEED_FIELD.rabbitHeadHeight)

    act(() => {
      const width = host.querySelector<HTMLInputElement>('[aria-label="Rabbit head width"]')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(width, '126')
      width?.dispatchEvent(new Event('input', { bubbles: true }))
      width?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flushEffects()

    const manual = new URLSearchParams(window.location.search)
    expect(manual.get('breed')).toBe('lionhead-rabbit')
    expect(manual.get('rabbitHeadWidth')).toBe('126')
    expect(manual.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.rabbitHeadWidth)
    expect(manual.get('seedFields')).toContain(AVATAR_SEED_FIELD.rabbitHeadHeight)

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')?.click())
    await flushEffects()
    const rerolled = new URLSearchParams(window.location.search)
    expect(rerolled.get('rabbitHeadWidth')).toBe('126')
    const head = deserializeAvatarEntityParts(rerolled.get('entityParts'), 'rabbit')
      .find(part => part.id === 'primary')
    expect(head?.scaleX).toBeCloseTo(.72 * 1.26)

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()
    const reloaded = new URLSearchParams(window.location.search)
    expect(reloaded.get('rabbitHeadWidth')).toBe('126')
    expect(reloaded.get('rabbitHeadHeight')).toBe(rerolled.get('rabbitHeadHeight'))
    expect(deserializeAvatarEntityParts(reloaded.get('entityParts'), 'rabbit')
      .find(part => part.id === 'primary')).toEqual(head)
    expect(reloaded.get('seedFields')).toBe(rerolled.get('seedFields'))
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

  it('moves legacy Dog ears outside a broad head and restores their real attachment positions after reload', async () => {
    const legacyParts = createAvatarEntityParts('dog').map(part => part.face
      ? { ...part, scaleX: .72 * 1.15, scaleY: .8 * 1.38 }
      : part)
    const params = new URLSearchParams({
      dogEarHeight: '131',
      dogEarWidth: '61',
      dogHeadHeight: '138',
      dogHeadWidth: '115',
      entity: 'dog',
      entityParts: serializeAvatarEntityParts(legacyParts),
      seed: 'v1-legacy-dog-ears'
    })
    window.history.replaceState(null, '', `/?${params.toString()}`)
    await renderApp()

    const first = new URLSearchParams(window.location.search)
    const firstParts = deserializeAvatarEntityParts(first.get('entityParts'), 'dog')
    expect(firstParts.find(part => part.id === 'ear-left')?.x).toBeCloseTo(-72 * 1.15)
    expect(firstParts.find(part => part.id === 'ear-right')?.x).toBeCloseTo(72 * 1.15)
    expect(firstParts.find(part => part.id === 'ear-left')?.y).toBeCloseTo(15 - 67 * 1.38)

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()

    const reloaded = new URLSearchParams(window.location.search)
    expect(deserializeAvatarEntityParts(reloaded.get('entityParts'), 'dog')).toEqual(firstParts)
    expect(reloaded.get('dogHeadWidth')).toBe('115')
    expect(reloaded.get('dogHeadHeight')).toBe('138')
  })

  it('keeps Dog ears outside the head when its real part dimensions are edited and restored', async () => {
    window.history.replaceState(null, '', '/?entity=dog&seed=v1-corgi-part-dimensions')
    await renderApp()
    act(() => host.querySelector<HTMLButtonElement>('[data-dog-breed="corgi"]')?.click())
    await flushEffects()

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-body')?.click())
    await flushEffects()

    const setPartDimension = async (label: 'Part width' | 'Part height', value: string) => {
      const input = host.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)
      expect(input).not.toBeNull()
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        setter?.call(input, value)
        input?.dispatchEvent(new Event('input', { bubbles: true }))
        input?.dispatchEvent(new Event('change', { bubbles: true }))
      })
      await flushEffects()
    }

    await setPartDimension('Part width', '108')
    await setPartDimension('Part height', '112')

    const manual = new URLSearchParams(window.location.search)
    expect(manual.get('dogHeadWidth')).toBeNull()
    expect(manual.get('dogHeadHeight')).toBeNull()
    expect(manual.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogHeadWidth)
    expect(manual.get('seedFields')).not.toContain(AVATAR_SEED_FIELD.dogHeadHeight)

    const parts = deserializeAvatarEntityParts(manual.get('entityParts'), 'dog')
    expect(parts.find(part => part.id === 'primary')?.scaleX).toBeCloseTo(1.08)
    expect(parts.find(part => part.id === 'primary')?.scaleY).toBeCloseTo(1.12)
    expect(parts.find(part => part.id === 'ear-left')?.x).toBeCloseTo(-90)
    expect(parts.find(part => part.id === 'ear-right')?.x).toBeCloseTo(90)
    expect(parts.find(part => part.id === 'ear-left')?.y).toBeCloseTo(-115.2)

    act(() => root.unmount())
    root = createRoot(host)
    await renderApp()

    const reloaded = new URLSearchParams(window.location.search)
    expect(deserializeAvatarEntityParts(reloaded.get('entityParts'), 'dog')).toEqual(parts)
    expect(reloaded.get('dogHeadWidth')).toBeNull()
    expect(reloaded.get('dogHeadHeight')).toBeNull()
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
      AVATAR_SEED_FIELD.palette,
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
      AVATAR_SEED_FIELD.catEarHeight,
      AVATAR_SEED_FIELD.palette
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

  it('restores a saved Bear profile, its real dimensions, and its Seed-following fields', async () => {
    persistSavedAvatarPresets([{
      createdAt: Date.now(),
      id: 'bear-preset',
      query: '?entity=bear&breed=giant-panda&palette=giant-panda&bearEarWidth=118&bearEarHeight=110&bearHeadWidth=120&bearHeadHeight=112&seed=v1-panda-preset&seedFields=scene.entity.bearEarWidth,scene.entity.bearHeadWidth',
      screenshot: 'data:image/png;base64,AA==',
      version: 1
    }])
    await renderApp()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label^="Restore preset saved"]')?.click())
    await flushEffects()
    const restored = new URLSearchParams(window.location.search)
    expect(restored.get('entity')).toBe('bear')
    expect(restored.get('breed')).toBe('giant-panda')
    expect(restored.get('palette')).toBe('giant-panda')
    expect(restored.get('bearEarHeight')).toBe('110')
    expect(restored.get('bearHeadHeight')).toBe('112')
    expect(restored.get('seedFields')).toContain(AVATAR_SEED_FIELD.bearEarWidth)
    expect(restored.get('seedFields')).toContain(AVATAR_SEED_FIELD.bearHeadWidth)
  })

  it.each([
    ['fox', 'arctic-fox', 0],
    ['otter', 'river-otter', 0],
    ['pig', 'spotted-pig', 0],
    ['deer', 'reindeer', 8],
    ['sheep', 'horned-ram', 8],
    ['alpaca', 'gray-alpaca', 0],
    ['cow', 'highland-cow', 4],
    ['squirrel', 'chipmunk', 0],
    ['tiger', 'golden-tiger', 0],
    ['lion', 'white-lion', 0],
    ['hedgehog', 'cinnamon-hedgehog', 0]
  ] as const)('restores a saved %s breed with its real geometry and constrained Seed', async (species, id, hornCount) => {
    const template = getAvatarAnimalBreedTemplate(species, id)!
    const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${id}-saved`)
    const params = new URLSearchParams({
      breed: id,
      entity: species,
      entityParts: serializeAvatarEntityParts(resolved.entityParts),
      palette: id,
      seed: `v1-${id}-saved`,
      seedFields: template.followByDefault.join(','),
      [`${species}EarWidth`]: String(resolved.earWidth),
      [`${species}HeadHeight`]: String(resolved.headHeight),
      [`${species}HeadWidth`]: String(resolved.headWidth)
    })
    persistSavedAvatarPresets([{
      createdAt: Date.now(),
      id: `${id}-saved`,
      query: `?${params.toString()}`,
      screenshot: 'data:image/png;base64,AA==',
      version: 1
    }])
    await renderApp()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label^="Restore preset saved"]')?.click())
    await flushEffects()
    const restored = new URLSearchParams(window.location.search)
    expect(restored.get('entity')).toBe(species)
    expect(restored.get('breed')).toBe(id)
    expect(restored.get('palette')).toBe(id)
    expect(restored.get(`${species}HeadHeight`)).toBe(String(resolved.headHeight))
    for (const field of template.followByDefault) {
      expect(restored.get('seedFields')?.split(',')).toContain(field)
    }
    expect(deserializeAvatarEntityParts(restored.get('entityParts'), species)
      .filter(part => /^(?:antler|horn)-(?:left|right)/u.test(part.id))).toHaveLength(hornCount)
    if (species === 'fox') {
      expect(host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')).not.toBeNull()
    }
    if (species === 'otter' || species === 'deer' || species === 'sheep' || species === 'alpaca') {
      expect(host.querySelector(
        `.interactive-avatar__canvas [data-avatar-entity-part="primary"] [data-avatar-surface-decal="${species}-face-mask"]`
      )).not.toBeNull()
      expect(host.querySelector('.interactive-avatar__canvas [data-avatar-entity-part="muzzle"]')).toBeNull()
    }
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

  it('restores an embedded Bear profile and its actual dimensions without emitting a pseudo-change', async () => {
    const base = createDefaultAvatarDefinition()
    const seed = 'v1-embedded-giant-panda'
    const resolved = resolveAvatarBearBreedTemplate(getAvatarBearBreedTemplate('giant-panda')!, seed)
    const definition: AvatarDefinition = {
      ...base,
      metadata: {
        generation: {
          fields: [AVATAR_SEED_FIELD.bearEarWidth, AVATAR_SEED_FIELD.bearHeadWidth],
          profileId: 'giant-panda',
          seed,
          version: 1
        }
      },
      scene: {
        ...base.scene,
        appearance: {
          ...base.scene.appearance,
          coatPattern: resolved.coatPattern,
          paletteId: 'giant-panda'
        },
        entity: {
          ...base.scene.entity,
          parts: resolved.entityParts,
          preset: 'bear'
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
    expect(host.querySelector('[data-bear-breed="giant-panda"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(host.querySelector<HTMLInputElement>('[aria-label="Bear ear width"]')?.value)
      .toBe(String(resolved.bearEarWidth))
    expect(host.querySelector<HTMLInputElement>('[aria-label="Bear head width"]')?.value)
      .toBe(String(resolved.bearHeadWidth))
  })

  it.each([
    ['fox', 'fennec-fox'],
    ['otter', 'river-otter'],
    ['pig', 'spotted-pig'],
    ['deer', 'reindeer'],
    ['sheep', 'horned-ram'],
    ['alpaca', 'alpaca-cria'],
    ['cow', 'highland-cow'],
    ['squirrel', 'chipmunk'],
    ['tiger', 'tiger-cub'],
    ['lion', 'african-lion'],
    ['hedgehog', 'cream-hedgehog'],
    ['seal', 'harbor-seal'],
    ['beaver', 'north-american-beaver'],
    ['guinea-pig', 'american-guinea-pig'],
    ['chinchilla', 'gray-chinchilla'],
    ['ferret', 'sable-ferret'],
    ['monkey', 'macaque']
  ] as const)('restores an embedded %s breed without changing its real geometry or Seed state', async (species, id) => {
    const base = createDefaultAvatarDefinition()
    const seed = `v1-embedded-${id}`
    const template = getAvatarAnimalBreedTemplate(species, id)!
    const resolved = resolveAvatarAnimalBreedTemplate(template, seed)
    const definition: AvatarDefinition = {
      ...base,
      metadata: {
        generation: {
          fields: [...template.followByDefault],
          profileId: id,
          seed,
          version: 1
        }
      },
      scene: {
        ...base.scene,
        appearance: {
          ...base.scene.appearance,
          coatPattern: resolved.coatPattern,
          paletteId: id
        },
        decals: resolved.surfaceDecals ?? base.scene.decals,
        entity: {
          ...base.scene.entity,
          parts: resolved.entityParts,
          preset: species
        },
        face: resolved.faceStyle
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
    expect(host.querySelector(`[data-animal-breed="${id}"]`)?.getAttribute('aria-pressed')).toBe('true')
    const speciesLabel = species === 'guinea-pig'
      ? 'Guinea Pig'
      : `${species[0]!.toUpperCase()}${species.slice(1)}`
    expect(host.querySelector<HTMLInputElement>(`[aria-label="${speciesLabel} head width"]`)?.value)
      .toBe(String(resolved.headWidth))
    if (species === 'otter' || species === 'deer' || species === 'sheep' || species === 'alpaca') {
      expect(host.querySelector(
        `.interactive-avatar__canvas [data-avatar-entity-part="primary"] [data-avatar-surface-decal="${species}-face-mask"]`
      )).not.toBeNull()
      expect(host.querySelector('.interactive-avatar__canvas [data-avatar-entity-part="muzzle"]')).toBeNull()
    }
    if (species === 'seal' || species === 'beaver' || species === 'guinea-pig' || species === 'chinchilla') {
      expect(host.querySelector(
        `.interactive-avatar__canvas [data-avatar-entity-part="cheek-left"] ` +
        `[data-avatar-surface-decal="${species}-cheek-left"]`
      )).not.toBeNull()
    }
    if (species === 'ferret') {
      expect(host.querySelector(
        '.interactive-avatar__canvas [data-avatar-entity-part="primary"] ' +
        '[data-avatar-surface-decal="ferret-eye-mask-left"]'
      )).not.toBeNull()
    }
    if (species === 'monkey') {
      expect(host.querySelector(
        '.interactive-avatar__canvas [data-avatar-entity-part="muzzle"] ' +
        '[data-avatar-surface-decal="monkey-muzzle-skin"]'
      )).not.toBeNull()
    }
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

  it('freezes a breed fur tone when Palette following is disabled and resumes its own range when re-enabled', async () => {
    const template = getAvatarAnimalBreedTemplate('fox', 'red-fox')!
    const lowSeed = Array.from({ length: 600 }, (_, index) => `v1-red-fox-lock-low-${index}`)
      .find(seed => resolveSeededAvatarPaletteTone(seed, 'red-fox', template.seedDomain) === template.toneJitter.min)
    const highSeed = Array.from({ length: 600 }, (_, index) => `v1-red-fox-lock-high-${index}`)
      .find(seed => resolveSeededAvatarPaletteTone(seed, 'red-fox', template.seedDomain) === template.toneJitter.max)
    expect(lowSeed).toBeDefined()
    expect(highSeed).toBeDefined()
    window.history.replaceState(null, '', `/?entity=fox&breed=red-fox&seed=${lowSeed}&seedFields=${AVATAR_SEED_FIELD.palette}`)
    await renderApp()

    const getConcreteHead = () => {
      const params = new URLSearchParams(window.location.search)
      return deserializeAvatarEntityParts(params.get('entityParts'), 'fox').find(part => part.face)?.baseColor
    }
    const lowHead = getConcreteHead()
    const lowCheek = host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')?.getAttribute('fill')

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-style')?.click())
    await flushEffects()
    const paletteSeed = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Palette"]')
    expect(paletteSeed?.getAttribute('aria-checked')).toBe('true')
    act(() => paletteSeed?.click())
    await flushEffects()

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-build')?.click())
    await flushEffects()
    const seedInput = host.querySelector<HTMLInputElement>('[aria-label="Current Seed"]')
    expect(seedInput).not.toBeNull()
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      seedInput?.focus()
      valueSetter?.call(seedInput, highSeed)
      seedInput?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => seedInput?.blur())
    await flushEffects()
    expect(new URLSearchParams(window.location.search).get('seed')).toBe(highSeed)
    expect(getConcreteHead()).toBe(lowHead)
    expect(host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')?.getAttribute('fill')).toBe(lowCheek)

    act(() => host.querySelector<HTMLButtonElement>('#avatar-controls-tab-style')?.click())
    await flushEffects()
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Palette"]')?.click())
    await flushEffects()
    expect(getConcreteHead()).not.toBe(lowHead)
    expect(host.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')?.getAttribute('fill')).not.toBe(lowCheek)
    const restored = new URLSearchParams(window.location.search)
    expect(restored.get('palette')).toBe('red-fox')
    expect(restored.get('seedFields')).toContain(AVATAR_SEED_FIELD.palette)
  })
})
