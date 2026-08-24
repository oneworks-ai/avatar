import { describe, expect, it } from 'vitest'

import { DEFAULT_AVATAR_PIXEL_EFFECT } from '@oneworks/avatar'

import { expandAvatarPixelGrid, sampleAvatarPixelGrid } from '../src/avatarPixelSampling'
import { quantizeAvatarPixelData } from '../src/avatarPixelation'

const createImageData = (data: readonly number[], width: number, height: number) =>
  ({
    data: new Uint8ClampedArray(data),
    height,
    width
  }) as ImageData

describe('avatar pixel quantization', () => {
  it('builds exact hard-edged blocks without interpolation', () => {
    const source = createImageData(Array.from({ length: 12 * 6 }, (_, index) => (
      index % 12 < 6 ? [244, 80, 40, 255] : [20, 130, 240, 255]
    )).flat(), 12, 6)
    const grid = sampleAvatarPixelGrid(source, 6, 'dominant')
    const expanded = expandAvatarPixelGrid(grid, 12, 6, 6)

    expect([grid.width, grid.height]).toEqual([2, 1])
    for (let y = 0; y < 6; y += 1) {
      for (let x = 0; x < 12; x += 1) {
        const offset = (y * 12 + x) * 4
        expect([...expanded.data.slice(offset, offset + 4)]).toEqual(
          x < 6 ? [244, 80, 40, 255] : [20, 130, 240, 255]
        )
      }
    }
  })

  it('defensively normalizes fractional block sizes to the nearest integer', () => {
    const source = createImageData(Array.from({ length: 6 * 3 }, (_, index) => (
      index % 6 < 3 ? [244, 80, 40, 255] : [20, 130, 240, 255]
    )).flat(), 6, 3)

    expect([...sampleAvatarPixelGrid(source, 2.5, 'dominant').data]).toEqual([
      ...sampleAvatarPixelGrid(source, 3, 'dominant').data
    ])
    expect([...sampleAvatarPixelGrid(source, Number.POSITIVE_INFINITY, 'center').data]).toEqual([
      ...sampleAvatarPixelGrid(source, 1, 'center').data
    ])
  })

  it('uses source representatives and binary alpha for every sampling mode', () => {
    const pixels = Array.from({ length: 64 }, (_, index) => {
      const x = index % 8
      const y = Math.floor(index / 8)
      if (x < 2 && y < 2) return [250, 80, 30, 80]
      if (x < 4) return [245, 75, 35, 255]
      if (y < 4) return [35, 140, 245, 255]
      return [245, 205, 45, 255]
    }).flat()
    const source = createImageData(pixels, 8, 8)
    const sourceColors = new Set(Array.from({ length: 64 }, (_, index) => (
      [...source.data.slice(index * 4, index * 4 + 3)].join(',')
    )))

    for (const sampling of ['center', 'dominant', 'median', 'slic'] as const) {
      const first = sampleAvatarPixelGrid(source, 2, sampling)
      const second = sampleAvatarPixelGrid(source, 2, sampling)
      expect([...first.data]).toEqual([...second.data])
      for (let index = 0; index < first.data.length; index += 4) {
        const alpha = first.data[index + 3]
        expect([0, 255]).toContain(alpha)
        if (alpha === 255) {
          expect(sourceColors).toContain([...first.data.slice(index, index + 3)].join(','))
        }
      }
    }
  })

  it('keeps point sampling distinct from a per-cell dominant-color vote', () => {
    const pixels = Array.from({ length: 16 }, () => [238, 70, 40, 255])
    pixels[5] = [35, 135, 245, 255]
    const source = createImageData(pixels.flat(), 4, 4)

    expect([...sampleAvatarPixelGrid(source, 4, 'center').data]).toEqual([35, 135, 245, 255])
    expect([...sampleAvatarPixelGrid(source, 4, 'dominant').data]).toEqual([238, 70, 40, 255])
  })

  it('reduces color levels while preserving transparent pixels', () => {
    const colors = Array.from({ length: 16 }, (_, index) => [
      index * 16,
      255 - index * 12,
      index * 9,
      index === 15 ? 0 : 255
    ]).flat()
    const imageData = createImageData(colors, 16, 1)
    const result = quantizeAvatarPixelData(imageData, {
      ...DEFAULT_AVATAR_PIXEL_EFFECT,
      dithering: 'none',
      paletteSize: 8
    })

    const opaqueColors = new Set(Array.from({ length: 15 }, (_, index) => (
      [...result.data.slice(index * 4, index * 4 + 3)].join(',')
    )))
    expect(opaqueColors.size).toBeLessThanOrEqual(8)
    expect([...result.data.slice(60, 64)]).toEqual([0, 0, 0, 0])
  })

  it('applies ordered dithering deterministically', () => {
    const source = Array.from({ length: 16 }, (_, index) => [
      index * 16,
      index * 16,
      index * 16,
      255
    ]).flat()
    const effect = {
      ...DEFAULT_AVATAR_PIXEL_EFFECT,
      dithering: 'ordered',
      paletteSize: 8 as const
    }
    const first = quantizeAvatarPixelData(createImageData(source, 16, 1), effect)
    const second = quantizeAvatarPixelData(createImageData(source, 16, 1), effect)
    const withoutDithering = quantizeAvatarPixelData(createImageData(source, 16, 1), {
      ...effect,
      dithering: 'none'
    })

    expect([...first.data]).toEqual([...second.data])
    expect([...first.data]).not.toEqual([...withoutDithering.data])
  })
})
