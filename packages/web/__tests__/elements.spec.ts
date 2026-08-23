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
      resume: vi.fn(),
      seek: vi.fn(),
      setDefinition: (next: unknown) => {
        definition = next
      },
      stop: vi.fn(),
      update: vi.fn((next: { definition?: unknown }) => {
        if (next.definition != null) definition = next.definition
      })
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
})
