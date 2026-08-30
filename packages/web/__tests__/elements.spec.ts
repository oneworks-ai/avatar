// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

const mounts = vi.hoisted(() => {
  const createAvatar = vi.fn((_element: HTMLElement, options: { definition: unknown }) => {
    let definition = options.definition
    return {
      capture: vi.fn(),
      destroy: vi.fn(),
      getDefinition: () => definition,
      pause: vi.fn(),
      play: vi.fn(),
      ready: Promise.resolve(),
      removeTrack: vi.fn(),
      resume: vi.fn(),
      seek: vi.fn(),
      setDefinition: (next: unknown) => {
        definition = next
      },
      setTimeline: vi.fn(),
      setTracks: vi.fn(),
      stop: vi.fn(),
      update: vi.fn((next: { definition?: unknown }) => {
        if (next.definition != null) definition = next.definition
      }),
      updateTrack: vi.fn()
    }
  })
  const createAvatarEditor = vi.fn((_element: HTMLElement, options: { definition: unknown }) => {
    let definition = options.definition
    return {
      destroy: vi.fn(),
      focus: vi.fn(),
      getDefinition: () => definition,
      ready: Promise.resolve(),
      setDefinition: (next: unknown) => {
        definition = next
      },
      update: vi.fn((next: { definition?: unknown }) => {
        if (next.definition != null) definition = next.definition
      })
    }
  })
  return { createAvatar, createAvatarEditor }
})

vi.mock('../src/index', () => mounts)

import { createDefaultAvatarDefinition } from '@oneworks/avatar'

import { OneWorksAvatarEditorElement, OneWorksAvatarElement, registerAvatarElements } from '../src/elements'

const mounted: Element[] = []

afterEach(() => {
  mounted.splice(0).forEach(element => element.remove())
  mounts.createAvatar.mockClear()
  mounts.createAvatarEditor.mockClear()
})

describe('OneWorks Avatar custom elements', () => {
  it('does not register elements as an import side effect', () => {
    expect(customElements.get('oneworks-avatar')).toBeUndefined()
    expect(customElements.get('oneworks-avatar-editor')).toBeUndefined()
  })

  it('registers the public tags explicitly and idempotently', () => {
    registerAvatarElements()
    registerAvatarElements()
    expect(customElements.get('oneworks-avatar')).toBe(OneWorksAvatarElement)
    expect(customElements.get('oneworks-avatar-editor')).toBe(OneWorksAvatarEditorElement)
  })

  it('normalizes custom-element attributes to safe public options', () => {
    registerAvatarElements()
    const avatar = document.createElement('oneworks-avatar')
    const editor = document.createElement('oneworks-avatar-editor')
    mounted.push(avatar, editor)
    avatar.setAttribute('autoplay', '')
    avatar.setAttribute('interactive', '')
    avatar.setAttribute('theme', 'untrusted')
    editor.setAttribute('locale', 'untrusted')
    editor.setAttribute('theme', 'dark')
    document.body.append(avatar, editor)

    expect(mounts.createAvatar.mock.calls.at(-1)?.[1]).toEqual(expect.objectContaining({
      autoplay: true,
      interactive: true,
      theme: 'system'
    }))
    expect(mounts.createAvatarEditor.mock.calls.at(-1)?.[1]).toEqual(expect.objectContaining({
      locale: 'en',
      theme: 'dark'
    }))
  })

  it('preserves runtime and editor definitions across disconnect and reconnect', () => {
    registerAvatarElements()
    const definition = {
      ...createDefaultAvatarDefinition(),
      metadata: { id: 'reconnected' }
    }
    const avatar = document.createElement('oneworks-avatar')
    const editor = document.createElement('oneworks-avatar-editor')
    mounted.push(avatar, editor)
    document.body.append(avatar, editor)
    avatar.definition = definition
    editor.definition = definition

    avatar.remove()
    editor.remove()
    document.body.append(avatar, editor)

    expect(mounts.createAvatar.mock.calls.at(-1)?.[1].definition).toEqual(definition)
    expect(mounts.createAvatarEditor.mock.calls.at(-1)?.[1].definition).toEqual(definition)
  })

  it('forwards ordered track stack operations through the custom element', () => {
    registerAvatarElements()
    const avatar = document.createElement('oneworks-avatar')
    mounted.push(avatar)
    document.body.append(avatar)
    const mount = mounts.createAvatar.mock.results.at(-1)?.value
    const tracks = [{ animation: { anchor: 'absolute', durationMs: 1000, keyframes: [], playback: 'loop' }, trackId: 'idle' }]

    avatar.setTracks(tracks as never)
    avatar.updateTrack('idle', { weight: .5 })
    avatar.removeTrack('idle')

    expect(mount.setTracks).toHaveBeenCalledWith(tracks)
    expect(mount.updateTrack).toHaveBeenCalledWith('idle', { weight: .5 })
    expect(mount.removeTrack).toHaveBeenCalledWith('idle')
  })

  it('forwards the latest timeline configuration through the custom element', () => {
    registerAvatarElements()
    const avatar = document.createElement('oneworks-avatar')
    mounted.push(avatar)
    document.body.append(avatar)
    const mount = mounts.createAvatar.mock.results.at(-1)?.value
    const timeline = { durationMs: 0, tracks: [], version: 1 as const }

    avatar.timeline = timeline
    avatar.timelineLoop = true
    avatar.timelineSpeed = 1.5
    avatar.timelineTimeMs = 240
    avatar.setTimeline(timeline, { loop: true, playing: false, speed: 1.5, timeMs: 240 })

    expect(mount.setTimeline).toHaveBeenCalledWith(timeline, {
      loop: true,
      playing: false,
      speed: 1.5,
      timeMs: 240
    })
    expect(mount.update).toHaveBeenLastCalledWith(expect.objectContaining({
      timeline,
      timelineLoop: true,
      timelineSpeed: 1.5,
      timelineTimeMs: 240
    }))
  })
})
