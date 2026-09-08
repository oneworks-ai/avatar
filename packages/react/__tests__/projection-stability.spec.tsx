// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { createDefaultAvatarDefinition, DEFAULT_AVATAR_COAT_PATTERN } from '@oneworks/avatar'
const projected = vi.hoisted(() => ({ props: undefined as Record<string, unknown> | undefined }))
vi.mock('../../../src/App', () => ({ default: () => null }))
vi.mock('../../../src/InteractiveAvatar', () => ({ InteractiveAvatar: (props: Record<string, unknown>) => {
  projected.props = props
  return null
} }))
import { Avatar } from '../src'

it('keeps projected inputs stable across face frames and invalidates actual coat changes', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })))
  const host = document.createElement('div')
  const root = createRoot(host)
  const original = createDefaultAvatarDefinition()
  const base = { ...original, scene: { ...original.scene,
    entity: { preset: 'cat' as const, parts: [] },
    appearance: { ...original.scene.appearance, paletteId: 'orange-tabby', coatPattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true } }
  } }
  try {
    act(() => root.render(createElement(Avatar, { definition: base, autoplay: false })))
    const before = projected.props!
    const frame = JSON.parse(JSON.stringify(base))
    frame.scene.face.height = 15
    act(() => root.render(createElement(Avatar, { definition: frame, autoplay: false })))
    expect(projected.props!.surfaceDecals).toBe(before.surfaceDecals)
    expect(projected.props!.entityParts).toBe(before.entityParts)
    frame.scene.appearance.coatPattern.enabled = false
    act(() => root.render(createElement(Avatar, { definition: JSON.parse(JSON.stringify(frame)), autoplay: false })))
    expect(projected.props!.surfaceDecals).not.toBe(before.surfaceDecals)
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
