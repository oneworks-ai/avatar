// @vitest-environment jsdom

import { act, createElement, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDefaultAvatarDefinition } from '@oneworks/avatar'

import { createAvatarEntityParts } from '../../../src/avatarEntityPresets'
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
  it('renders every part in a custom multipart definition', () => {
    const definition = createDefaultAvatarDefinition()
    const parts = createAvatarEntityParts('dog')
    const custom = {
      ...definition,
      scene: {
        ...definition.scene,
        decals: [{
          color: '#f29a93', height: 18, id: 'blush-left', label: 'Left blush', opacity: 90,
          rotation: -8, shape: 'ellipse' as const, targetPartId: parts.find(part => part.face)?.id ?? null,
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
    expect(host.querySelectorAll('[data-avatar-eye-highlight]')).toHaveLength(2)
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

  it('captures the definition camera frame shadow in SVG', async () => {
    const definition = createDefaultAvatarDefinition()
    const ref = createRef<AvatarHandle>()
    act(() => root.render(createElement(Avatar, { definition, ref })))

    const blob = await ref.current!.capture({ format: 'svg', size: 256 })
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(reader.error)
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(blob)
    })
    expect(source).toContain('oneworks-avatar-export-frame-shadow')
    expect(source).toContain('flood-opacity="0.22"')
  })
})
