// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_AVATAR_PIXEL_EFFECT } from '@oneworks/avatar'

vi.mock('../src/avatarPixelation', () => ({
  renderPixelatedAvatarDataUrl: vi.fn(async () => 'data:image/png;base64,cGl4ZWxz')
}))

import { renderAvatarSvgSource, serializeAvatarSvg } from '../src/savedAvatarPresets'

const createSourceSvg = () => {
  const namespace = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(namespace, 'svg')
  const defs = document.createElementNS(namespace, 'defs')
  const avatarShadow = document.createElementNS(namespace, 'filter')
  const body = document.createElementNS(namespace, 'path')
  svg.setAttribute('viewBox', '0 0 256 256')
  avatarShadow.setAttribute('id', 'avatar-body-shadow')
  defs.append(avatarShadow)
  body.setAttribute('d', 'M 0 0 H 256 V 256 H 0 Z')
  body.setAttribute('filter', 'url(#avatar-body-shadow)')
  svg.append(defs, body)
  return svg
}

const captureOptions = {
  background: 'transparent',
  frameShadow: { color: '#ff0044', direction: 90, distance: 12, opacity: 80, softness: 24 },
  showFrameShadow: true
}

const parseCaptureMarkup = (markup: string) => {
  const container = document.createElement('div')
  container.innerHTML = markup
  return container
}

describe('avatar export camera frame', () => {
  it.each(['square', 'rounded', 'circle'] as const)(
    'excludes the preview-only frame shadow from a %s export without shrinking its scene',
    frame => {
      const svg = createSourceSvg()
      const markup = serializeAvatarSvg(svg, 256, { ...captureOptions, frame })
      const output = parseCaptureMarkup(markup)

      expect(output.querySelector('#oneworks-avatar-export-frame-shadow')).toBeNull()
      expect(output.querySelector('#oneworks-avatar-export-frame')).not.toBeNull()
      expect(output.querySelector('#avatar-body-shadow')).not.toBeNull()
      expect(output.querySelector('[filter="url(#avatar-body-shadow)"]')).not.toBeNull()
      expect(output.querySelector('[transform*="translate"]')).toBeNull()
      expect(output.querySelector('[fill="transparent"]')).not.toBeNull()
      expect(svg.querySelector('#oneworks-avatar-export-frame')).toBeNull()

      const path = output.querySelector('#oneworks-avatar-export-frame path')?.getAttribute('d')
      if (frame === 'square') expect(path).toBe('M 0 0 H 256 V 256 H 0 Z')
      if (frame === 'rounded') expect(path).toContain('M 18 0 H 238')
      if (frame === 'circle') expect(path).toContain('M 128 0 A 128 128')
    }
  )

  it('keeps pixelated exports at the full frame size without capturing its preview shadow', async () => {
    const markup = await renderAvatarSvgSource(createSourceSvg(), 256, {
      ...captureOptions,
      frame: 'rounded',
      pixelEffect: { ...DEFAULT_AVATAR_PIXEL_EFFECT, enabled: true }
    })
    const output = parseCaptureMarkup(markup)

    expect(output.querySelector('image')?.getAttribute('href')).toBe('data:image/png;base64,cGl4ZWxz')
    expect(output.querySelector('image')?.getAttribute('width')).toBe('256')
    expect(output.querySelector('#oneworks-avatar-export-frame-shadow')).toBeNull()
    expect(output.querySelector('[transform*="translate"]')).toBeNull()
  })
})
