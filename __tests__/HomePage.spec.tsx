// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from '../src/HomePage'
import AvatarRoot, { createRandomAvatarEditorQuery } from '../src/Root'
import { HOME_EXPLORE_TEMPLATES, HOME_TEMPLATES } from '../src/avatarHome'
import { AvatarLocaleProvider } from '../src/avatarLocale'
import {
  AVATAR_BREED_PRESET_SNAPSHOT_URLS,
  AVATAR_ENTITY_PRESET_SNAPSHOT_URLS,
  AVATAR_PIXEL_STYLE_PRESET_SNAPSHOT_URLS
} from '../src/avatarPresetSnapshots'
import { AVATAR_SEED_FIELDS, serializeAvatarSeedFields } from '../src/avatarSeed'

vi.mock('../src/App', () => ({ default: () => null }))
vi.mock('../src/HomeAvatarPreview', () => ({
  default: ({ template }: { readonly template: string }) => createElement('svg', {
    'data-home-live-preview': template
  })
}))

let host: HTMLDivElement
let root: Root

const renderHomePage = async (
  locale: 'en' | 'zh-Hans',
  onCreate = vi.fn(),
  onSurprise = vi.fn(),
  onCreateBreed = vi.fn(),
  onCreateEffectStyle = vi.fn()
) => {
  await act(async () => {
    root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: locale, persist: false },
      createElement(HomePage, {
        onCreate,
        onCreateBreed,
        onCreateEffectStyle,
        onPrepareEditor: vi.fn(),
        onSurprise
      })
    ))
  })
  return { onCreate, onCreateBreed, onCreateEffectStyle, onSurprise }
}

const flushEffects = () => act(async () => {
  await new Promise(resolve => window.setTimeout(resolve, 0))
})

const renderRoot = async () => {
  await act(async () => {
    root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarRoot)
    ))
  })
  await flushEffects()
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  window.history.replaceState(null, '', '/')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('HomePage calls to action', () => {
  it('keeps creation primary and exposes an accessible random entry', async () => {
    const { onCreate, onSurprise } = await renderHomePage('en')
    const create = host.querySelector<HTMLButtonElement>('button.avatar-home__continue')
    const surprise = host.querySelector<HTMLButtonElement>('button.avatar-home__surprise')

    expect(create?.textContent).toContain('Start creating')
    expect(surprise?.textContent).toContain('Surprise me')
    expect(surprise?.type).toBe('button')

    act(() => create?.click())
    act(() => surprise?.click())
    expect(onCreate).toHaveBeenCalledTimes(1)
    expect(onSurprise).toHaveBeenCalledTimes(1)
  })

  it('localizes the random entry', async () => {
    await renderHomePage('zh-Hans')
    expect(host.querySelector<HTMLButtonElement>('button.avatar-home__surprise')?.textContent).toContain('随机一个')
  })

  it('keeps the complete static gallery below the fold and scrolls to it from View more', async () => {
    const scrollIntoView = vi.fn()
    vi.stubGlobal('HTMLElement', window.HTMLElement)
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView
    })
    await renderHomePage('en')

    const viewMore = host.querySelector<HTMLButtonElement>('button.avatar-home__view-more')
    expect(viewMore?.textContent).toContain('View more')

    const exploreItems = host.querySelectorAll<HTMLElement>('[data-home-explore-template]')
    expect(exploreItems).toHaveLength(
      Object.keys(AVATAR_ENTITY_PRESET_SNAPSHOT_URLS).length
      + Object.keys(AVATAR_BREED_PRESET_SNAPSHOT_URLS).length
      + Object.keys(AVATAR_PIXEL_STYLE_PRESET_SNAPSHOT_URLS).length
    )
    expect(exploreItems).toHaveLength(HOME_EXPLORE_TEMPLATES.length)
    expect([...exploreItems].every(item => item.querySelector('img[loading="lazy"]') != null)).toBe(true)
    expect(new Set([...exploreItems].map(item => item.getAttribute('data-size')))).toEqual(new Set([
      'standard',
      'wide',
      'tall',
      'large',
      'feature'
    ]))
    expect(host.querySelectorAll('[data-home-live-preview]')).toHaveLength(1)

    act(() => viewMore?.click())
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('opens entity and breed gallery tiles in their exact editor state', async () => {
    const { onCreate, onCreateBreed } = await renderHomePage('en')
    const entityTile = host.querySelector<HTMLButtonElement>('[data-home-explore-template="entity:owl"]')
    const breedTile = host.querySelector<HTMLButtonElement>('[data-home-explore-template="breed:owl--barn-owl"]')

    expect(entityTile?.type).toBe('button')
    expect(breedTile?.type).toBe('button')
    expect(entityTile?.getAttribute('aria-label')).toContain('Edit')
    expect(breedTile?.getAttribute('aria-label')).toContain('Edit')

    act(() => entityTile?.click())
    act(() => breedTile?.click())

    expect(onCreate).toHaveBeenCalledWith('owl')
    expect(onCreateBreed).toHaveBeenCalledWith('owl', 'barn-owl')
  })

  it('opens a static pixel-style tile with its named effect preset', async () => {
    const { onCreateEffectStyle } = await renderHomePage('en')
    const pixelTile = host.querySelector<HTMLButtonElement>(
      '[data-home-explore-template="effect:chunky-pixel:cat"]'
    )

    expect(pixelTile?.querySelector('img[loading="lazy"]')).not.toBeNull()
    act(() => pixelTile?.click())

    expect(onCreateEffectStyle).toHaveBeenCalledWith('cat', 'chunky-pixel')
  })

  it('offers a bottom create-your-own entry from the active hero model', async () => {
    const { onCreate } = await renderHomePage('en')
    act(() => host.querySelector<HTMLButtonElement>('[data-home-avatar-template="cat"]')?.click())

    const createOwn = host.querySelector<HTMLButtonElement>('button.avatar-home__create-own-action')
    expect(createOwn?.textContent).toContain('Create your own')

    act(() => createOwn?.click())
    expect(onCreate).toHaveBeenCalledWith('cat')
  })
})

describe('HomePage carousel navigation', () => {
  it('keeps wrapping when navigating backward through multiple complete loops', async () => {
    await renderHomePage('en')
    const carousel = host.querySelector<HTMLElement>('.avatar-home__carousel-shell')

    expect(carousel).not.toBeNull()

    for (let step = 0; step < HOME_TEMPLATES.length * 3; step += 1) {
      act(() => {
        carousel?.dispatchEvent(new KeyboardEvent('keydown', {
          bubbles: true,
          key: 'ArrowLeft'
        }))
      })

      expect(host.querySelector('.avatar-home__carousel-shell')).not.toBeNull()
    }

    expect(host.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute('aria-label')).toBe('Dog')
  })

  it('shows every prebuilt entity as a static catalog item while keeping one live preview', async () => {
    await renderHomePage('en')
    await flushEffects()

    const catalogItems = host.querySelectorAll<HTMLButtonElement>('[data-home-avatar-template]')
    expect(catalogItems).toHaveLength(Object.keys(AVATAR_ENTITY_PRESET_SNAPSHOT_URLS).length)
    expect(HOME_TEMPLATES.map(template => template.id).sort()).toEqual(
      Object.keys(AVATAR_ENTITY_PRESET_SNAPSHOT_URLS).sort()
    )
    expect([...catalogItems].every(item => item.querySelector('img') != null)).toBe(true)
    expect(host.querySelectorAll('[data-home-live-preview]')).toHaveLength(1)
    expect(host.querySelectorAll('[data-home-avatar-offset="0"]')).toHaveLength(1)
    expect(host.querySelector('[data-home-avatar-offset="0"]')?.getAttribute('data-home-avatar-template')).toBe('dog')
  })

  it('switches distant catalog items immediately and creates the selected entity', async () => {
    const { onCreate } = await renderHomePage('en')
    await flushEffects()

    act(() => host.querySelector<HTMLButtonElement>('[data-home-avatar-template="owl"]')?.click())
    expect(host.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute('data-home-avatar-template')).toBe('owl')
    expect(host.querySelector('[data-home-avatar-offset="0"]')?.getAttribute('data-home-avatar-template')).toBe('owl')
    expect(host.querySelector('[data-home-live-preview]')?.getAttribute('data-home-live-preview')).toBe('owl')

    act(() => host.querySelector<HTMLButtonElement>('button.avatar-home__continue')?.click())
    expect(onCreate).toHaveBeenCalledWith('owl')
  })
})

describe('random editor query', () => {
  it('persists the supplied seed and every supported seeded field', () => {
    const query = createRandomAvatarEditorQuery(
      'v1-home-random',
      serializeAvatarSeedFields(AVATAR_SEED_FIELDS)
    )
    const params = new URLSearchParams(query.slice(1))

    expect(params.get('seed')).toBe('v1-home-random')
    expect(params.get('seedFields')).toBe(serializeAvatarSeedFields(AVATAR_SEED_FIELDS))
  })

  it('keeps Seed dependencies lazy from the homepage entry', () => {
    const rootSource = readFileSync(resolve(process.cwd(), 'src/Root.tsx'), 'utf8')

    expect(rootSource).not.toMatch(/^import[^\n]*['"]\.\/avatarSeed['"]/m)
    expect(rootSource).toContain("import('./avatarSeed')")
  })
})

describe('random editor navigation', () => {
  it('preserves the selected species and breed when opening a gallery tile', async () => {
    await renderRoot()

    act(() => host.querySelector<HTMLButtonElement>('[data-home-explore-template="breed:owl--barn-owl"]')?.click())
    await flushEffects()

    const params = new URLSearchParams(window.location.search)
    expect(params.get('entity')).toBe('owl')
    expect(params.get('breed')).toBe('barn-owl')
    expect(window.location.hash).toBe('#/editor')
  })

  it('preserves the selected entity and named effect when opening a pixel gallery tile', async () => {
    await renderRoot()

    act(() => host.querySelector<HTMLButtonElement>(
      '[data-home-explore-template="effect:chunky-pixel:cat"]'
    )?.click())
    await flushEffects()

    const params = new URLSearchParams(window.location.search)
    expect(params.get('template')).toBe('cat')
    expect(params.get('effectStyle')).toBe('chunky-pixel')
    expect(window.location.hash).toBe('#/editor')
  })

  it('unlocks after returning home so a second random entry gets a new seed', async () => {
    await renderRoot()

    const firstRandom = host.querySelector<HTMLButtonElement>('button.avatar-home__surprise')
    await act(async () => {
      firstRandom?.click()
      await new Promise(resolve => window.setTimeout(resolve, 0))
    })
    await flushEffects()
    const firstSeed = new URLSearchParams(window.location.search).get('seed')
    expect(window.location.hash).toBe('#/editor')
    expect(firstSeed).toMatch(/^v1-/)

    window.history.replaceState(null, '', '/')
    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    await flushEffects()
    expect(host.querySelector('button.avatar-home__surprise')).not.toBeNull()

    const secondRandom = host.querySelector<HTMLButtonElement>('button.avatar-home__surprise')
    await act(async () => {
      secondRandom?.click()
      await new Promise(resolve => window.setTimeout(resolve, 0))
    })
    await flushEffects()
    const secondSeed = new URLSearchParams(window.location.search).get('seed')

    expect(window.location.hash).toBe('#/editor')
    expect(secondSeed).toMatch(/^v1-/)
    expect(secondSeed).not.toBe(firstSeed)
  })
})
