// @vitest-environment jsdom

import { act, createElement, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_AVATAR_COAT_PATTERN, createDefaultAvatarDefinition } from '@oneworks/avatar'

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
    expect(source).toContain('operator="out"')
    expect(source).toContain('in2="SourceAlpha"')
    expect(source).toContain('translate(36 36) scale(')
  })
})
