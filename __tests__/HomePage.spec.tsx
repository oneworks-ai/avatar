// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from '../src/HomePage'
import AvatarRoot, { createRandomAvatarEditorQuery } from '../src/Root'
import { AvatarLocaleProvider } from '../src/avatarLocale'
import { AVATAR_SEED_FIELDS, serializeAvatarSeedFields } from '../src/avatarSeed'

vi.mock('../src/App', () => ({ default: () => null }))

let host: HTMLDivElement
let root: Root

const renderHomePage = async (locale: 'en' | 'zh-Hans', onCreate = vi.fn(), onSurprise = vi.fn()) => {
  await act(async () => {
    root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: locale, persist: false },
      createElement(HomePage, { onCreate, onPrepareEditor: vi.fn(), onSurprise })
    ))
  })
  return { onCreate, onSurprise }
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
