// @vitest-environment jsdom

import { act, createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@oneworks/avatar-react', () => ({
  Avatar: () => null,
  AvatarAnimationPicker: ({ onChange, options, value }: {
    onChange: (option: unknown) => void
    options: readonly { readonly id: string, readonly label: string }[]
    value?: string | null
  }) => createElement('button', {
    'data-value': value,
    onClick: () => onChange(options[0])
  }, options[0]?.label),
  AvatarEditor: () => null,
  AvatarPresetPicker: ({ onChange, options, value }: {
    onChange: (option: unknown) => void
    options: readonly { readonly id: string, readonly label: string }[]
    value?: string | null
  }) => createElement('button', {
    'data-value': value,
    onClick: () => onChange(options[0])
  }, options[0]?.label)
}))

import { createDefaultAvatarDefinition } from '@oneworks/avatar'

import { createAvatarAnimationPicker, createAvatarPresetPicker } from '../src'

const hosts: HTMLElement[] = []

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  hosts.splice(0).forEach(host => host.remove())
})

describe('OneWorks Avatar picker mounts', () => {
  it('emits animation selections and supports controlled updates', () => {
    const host = document.createElement('div')
    document.body.append(host)
    hosts.push(host)
    const clip = { anchor: 'absolute' as const, durationMs: 1000, keyframes: [], playback: 'loop' as const }
    const option = { animation: clip, id: 'idle', label: 'Idle' }
    const listener = vi.fn()
    host.addEventListener('animationchange', listener)

    let picker!: ReturnType<typeof createAvatarAnimationPicker>
    act(() => {
      picker = createAvatarAnimationPicker(host, { options: [option], value: 'idle' })
    })
    expect(host.querySelector('button')?.dataset.value).toBe('idle')
    act(() => host.querySelector('button')?.click())
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ animation: clip, option })

    act(() => picker.update({ value: null }))
    expect(host.querySelector('button')?.dataset.value).toBeUndefined()
    act(() => picker.destroy())
  })

  it('emits the selected avatar preset definition', () => {
    const host = document.createElement('div')
    document.body.append(host)
    hosts.push(host)
    const definition = createDefaultAvatarDefinition()
    const option = { definition, id: 'dog', label: 'Dog' }
    const listener = vi.fn()
    host.addEventListener('avatarpresetchange', listener)

    let picker!: ReturnType<typeof createAvatarPresetPicker>
    act(() => {
      picker = createAvatarPresetPicker(host, { options: [option], value: 'dog' })
    })
    act(() => host.querySelector('button')?.click())
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ definition, option })
    act(() => picker.destroy())
  })
})
