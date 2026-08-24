import type { AvatarPixelEffect } from '@oneworks/avatar'
import { applyPalette, quantize } from 'gifenc'

import { expandAvatarPixelGrid, sampleAvatarPixelGrid } from './avatarPixelSampling'

const BASE_RENDER_SIZE = 256
const BAYER_MATRIX_4X4 = [
  0,
  8,
  2,
  10,
  12,
  4,
  14,
  6,
  3,
  11,
  1,
  9,
  15,
  7,
  13,
  5
] as const

export const quantizeAvatarPixelData = (
  imageData: ImageData,
  effect: AvatarPixelEffect
) => {
  const data = imageData.data
  const dithered = new Uint8ClampedArray(data)
  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const offset = (y * imageData.width + x) * 4
      if ((data[offset + 3] ?? 0) < 128) {
        data[offset] = 0
        data[offset + 1] = 0
        data[offset + 2] = 0
        data[offset + 3] = 0
        continue
      }
      data[offset + 3] = 255
      const threshold = effect.dithering === 'ordered'
        ? ((BAYER_MATRIX_4X4[y % 4 * 4 + x % 4] ?? 0) - 7.5) / 7.5 * 10
        : 0
      dithered[offset] = Math.min(Math.max((dithered[offset] ?? 0) + threshold, 0), 255)
      dithered[offset + 1] = Math.min(Math.max((dithered[offset + 1] ?? 0) + threshold, 0), 255)
      dithered[offset + 2] = Math.min(Math.max((dithered[offset + 2] ?? 0) + threshold, 0), 255)
    }
  }
  const palette = quantize(data, effect.paletteSize, { format: 'rgb565' })
  const indexedPixels = applyPalette(dithered, palette, 'rgb565')
  for (let index = 0; index < indexedPixels.length; index += 1) {
    const offset = index * 4
    if (data[offset + 3] === 0) continue
    const color = palette[indexedPixels[index] ?? 0] ?? [0, 0, 0]
    data[offset] = color[0] ?? 0
    data[offset + 1] = color[1] ?? 0
    data[offset + 2] = color[2] ?? 0
  }
  return imageData
}

const loadSvgImage = async (sourceSvg: SVGSVGElement, size: number) => {
  const clonedSvg = sourceSvg.cloneNode(true) as SVGSVGElement
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clonedSvg.setAttribute('width', String(size))
  clonedSvg.setAttribute('height', String(size))
  clonedSvg.removeAttribute('aria-label')
  clonedSvg.removeAttribute('role')
  clonedSvg.removeAttribute('tabindex')
  const source = new XMLSerializer().serializeToString(clonedSvg)
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const paintPixelatedAvatarCanvas = async (
  sourceSvg: SVGSVGElement,
  targetCanvas: HTMLCanvasElement,
  size: number,
  effect: AvatarPixelEffect
) => {
  const sourceImage = await loadSvgImage(sourceSvg, BASE_RENDER_SIZE)
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = BASE_RENDER_SIZE
  sourceCanvas.height = BASE_RENDER_SIZE
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  if (sourceContext == null) throw new Error('Unable to create avatar pixel source canvas')
  sourceContext.drawImage(sourceImage, 0, 0, BASE_RENDER_SIZE, BASE_RENDER_SIZE)
  const sourceData = sourceContext.getImageData(0, 0, BASE_RENDER_SIZE, BASE_RENDER_SIZE)
  const gridData = sampleAvatarPixelGrid(sourceData, effect.blockSize, effect.sampling)
  const expandedData = expandAvatarPixelGrid(
    quantizeAvatarPixelData(gridData, effect),
    BASE_RENDER_SIZE,
    BASE_RENDER_SIZE,
    effect.blockSize
  )
  const pixelCanvas = document.createElement('canvas')
  pixelCanvas.width = BASE_RENDER_SIZE
  pixelCanvas.height = BASE_RENDER_SIZE
  const pixelContext = pixelCanvas.getContext('2d')
  if (pixelContext == null) throw new Error('Unable to create avatar pixel grid canvas')
  pixelContext.putImageData(expandedData, 0, 0)

  targetCanvas.width = size
  targetCanvas.height = size
  const targetContext = targetCanvas.getContext('2d')
  if (targetContext == null) throw new Error('Unable to create avatar pixel output canvas')
  targetContext.clearRect(0, 0, size, size)
  targetContext.imageSmoothingEnabled = false
  targetContext.drawImage(pixelCanvas, 0, 0, size, size)
  return targetCanvas
}

export const renderPixelatedAvatarDataUrl = async (
  sourceSvg: SVGSVGElement,
  size: number,
  effect: AvatarPixelEffect
) => {
  const canvas = document.createElement('canvas')
  await paintPixelatedAvatarCanvas(sourceSvg, canvas, size, effect)
  return canvas.toDataURL('image/png')
}
