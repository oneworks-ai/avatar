import type { AvatarCameraFrame } from './AvatarControls'
import type { AvatarDropShadowStyle } from './InteractiveAvatar'

const SAVED_PRESETS_STORAGE_KEY = 'oneworks-avatar-saved-presets-v1'
const MAX_SAVED_PRESETS = 12
const SCREENSHOT_SIZE = 256

export interface SavedAvatarPreset {
  readonly createdAt: number
  readonly id: string
  readonly query: string
  readonly screenshot: string
  readonly version: 1
}

export interface AvatarCaptureOptions {
  readonly background?: string
  readonly frame?: AvatarCameraFrame
  readonly frameShadow?: AvatarDropShadowStyle
  readonly showFrameShadow?: boolean
}

const isSavedAvatarPreset = (value: unknown): value is SavedAvatarPreset => {
  if (value == null || typeof value !== 'object') return false
  const preset = value as Partial<SavedAvatarPreset>
  return preset.version === 1 &&
    typeof preset.id === 'string' &&
    typeof preset.createdAt === 'number' &&
    Number.isFinite(preset.createdAt) &&
    typeof preset.query === 'string' &&
    typeof preset.screenshot === 'string' &&
    preset.screenshot.startsWith('data:image/')
}

export const loadSavedAvatarPresets = (): SavedAvatarPreset[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = JSON.parse(window.localStorage.getItem(SAVED_PRESETS_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(stored)
      ? stored.filter(isSavedAvatarPreset).slice(0, MAX_SAVED_PRESETS)
      : []
  } catch {
    return []
  }
}

export const persistSavedAvatarPresets = (presets: readonly SavedAvatarPreset[]) => {
  window.localStorage.setItem(
    SAVED_PRESETS_STORAGE_KEY,
    JSON.stringify(presets.slice(0, MAX_SAVED_PRESETS))
  )
}

export const prependSavedAvatarPreset = (
  presets: readonly SavedAvatarPreset[],
  preset: SavedAvatarPreset
) => [preset, ...presets].slice(0, MAX_SAVED_PRESETS)

const getAvatarFramePath = (width: number, height: number, frame: AvatarCameraFrame, inset = 0) => {
  const innerWidth = Math.max(width - inset * 2, 1)
  const innerHeight = Math.max(height - inset * 2, 1)
  if (frame === 'circle') {
    const radius = Math.min(innerWidth, innerHeight) / 2
    return `M ${width / 2} ${height / 2 - radius} A ${radius} ${radius} 0 1 1 ${
      width / 2
    } ${height / 2 + radius} A ${radius} ${radius} 0 1 1 ${width / 2} ${height / 2 - radius} Z`
  }
  if (frame === 'rounded') {
    const right = width - inset
    const bottom = height - inset
    const radius = Math.min(innerWidth, innerHeight) * 18 / SCREENSHOT_SIZE
    return `M ${inset + radius} ${inset} H ${right - radius} Q ${right} ${inset} ${right} ${
      inset + radius
    } V ${bottom - radius} Q ${right} ${bottom} ${right - radius} ${bottom} H ${
      inset + radius
    } Q ${inset} ${bottom} ${inset} ${bottom - radius} V ${inset + radius} Q ${inset} ${inset} ${
      inset + radius
    } ${inset} Z`
  }
  return `M ${inset} ${inset} H ${width - inset} V ${height - inset} H ${inset} Z`
}

const applyAvatarCaptureFrame = (svg: SVGSVGElement, options: AvatarCaptureOptions) => {
  if (options.background == null && options.frame == null) return

  const viewBox = svg.viewBox.baseVal
  const width = viewBox.width || Number(svg.getAttribute('width')) || SCREENSHOT_SIZE
  const height = viewBox.height || Number(svg.getAttribute('height')) || SCREENSHOT_SIZE
  const frame = options.frame ?? 'square'
  const document = svg.ownerDocument
  const namespace = 'http://www.w3.org/2000/svg'
  const clipId = 'oneworks-avatar-export-frame'
  const shadowFilterId = 'oneworks-avatar-export-frame-shadow'
  const defs = document.createElementNS(namespace, 'defs')
  const clipPath = document.createElementNS(namespace, 'clipPath')
  const framePath = document.createElementNS(namespace, 'path')
  const content = document.createElementNS(namespace, 'g')
  const scene = document.createElementNS(namespace, 'g')
  const shadowInset = options.showFrameShadow && options.frameShadow != null && options.frameShadow.opacity > 0
    ? Math.min(
      Math.max(options.frameShadow.distance + options.frameShadow.softness, 1),
      Math.min(width, height) / 4
    )
    : 0

  clipPath.setAttribute('id', clipId)
  framePath.setAttribute('d', getAvatarFramePath(width, height, frame, shadowInset))
  clipPath.append(framePath)
  defs.append(clipPath)

  let shadowPath: SVGPathElement | null = null
  if (options.showFrameShadow && options.frameShadow != null) {
    const direction = options.frameShadow.direction * Math.PI / 180
    const filter = document.createElementNS(namespace, 'filter')
    const blur = document.createElementNS(namespace, 'feGaussianBlur')
    const offset = document.createElementNS(namespace, 'feOffset')
    const flood = document.createElementNS(namespace, 'feFlood')
    const outside = document.createElementNS(namespace, 'feComposite')
    const colorize = document.createElementNS(namespace, 'feComposite')
    filter.setAttribute('id', shadowFilterId)
    filter.setAttribute('x', '-50%')
    filter.setAttribute('y', '-50%')
    filter.setAttribute('width', '200%')
    filter.setAttribute('height', '200%')
    blur.setAttribute('in', 'SourceAlpha')
    blur.setAttribute('stdDeviation', String(options.frameShadow.softness / 2))
    blur.setAttribute('result', 'blur')
    offset.setAttribute('in', 'blur')
    offset.setAttribute('dx', String(Math.cos(direction) * options.frameShadow.distance))
    offset.setAttribute('dy', String(Math.sin(direction) * options.frameShadow.distance))
    offset.setAttribute('result', 'offset')
    flood.setAttribute('flood-color', options.frameShadow.color ?? '#000000')
    flood.setAttribute('flood-opacity', String(options.frameShadow.opacity / 100))
    flood.setAttribute('result', 'color')
    outside.setAttribute('in', 'offset')
    outside.setAttribute('in2', 'SourceAlpha')
    outside.setAttribute('operator', 'out')
    outside.setAttribute('result', 'outside')
    colorize.setAttribute('in', 'color')
    colorize.setAttribute('in2', 'outside')
    colorize.setAttribute('operator', 'in')
    filter.append(blur, offset, outside, flood, colorize)
    defs.append(filter)

    shadowPath = document.createElementNS(namespace, 'path')
    shadowPath.setAttribute('d', getAvatarFramePath(width, height, frame, shadowInset))
    shadowPath.setAttribute('fill', '#000000')
    shadowPath.setAttribute('filter', `url(#${shadowFilterId})`)
  }

  content.setAttribute('clip-path', `url(#${clipId})`)
  if (options.background != null) {
    const background = document.createElementNS(namespace, 'path')
    background.setAttribute('d', getAvatarFramePath(width, height, frame, shadowInset))
    background.setAttribute('fill', options.background)
    content.append(background)
  }
  if (shadowInset > 0) {
    scene.setAttribute(
      'transform',
      `translate(${shadowInset} ${shadowInset}) scale(${(width - shadowInset * 2) / width} ${
        (height - shadowInset * 2) / height
      })`
    )
  }
  while (svg.firstChild != null) scene.append(svg.firstChild)
  content.append(scene)
  svg.append(defs)
  if (shadowPath != null) svg.append(shadowPath)
  svg.append(content)
}

export const serializeAvatarSvg = (
  sourceSvg: SVGSVGElement,
  size: number,
  options: AvatarCaptureOptions = {}
) => {
  const clonedSvg = sourceSvg.cloneNode(true) as SVGSVGElement
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clonedSvg.setAttribute('width', String(size))
  clonedSvg.setAttribute('height', String(size))
  clonedSvg.removeAttribute('aria-label')
  clonedSvg.removeAttribute('role')
  clonedSvg.removeAttribute('tabindex')
  applyAvatarCaptureFrame(clonedSvg, options)
  return new XMLSerializer().serializeToString(clonedSvg)
}

export const renderAvatarCaptureCanvas = async (
  sourceSvg: SVGSVGElement,
  size: number,
  options: AvatarCaptureOptions = {}
) => {
  const svgSource = serializeAvatarSvg(sourceSvg, size, options)
  const sourceUrl = URL.createObjectURL(new Blob([svgSource], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    image.src = sourceUrl
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (context == null) throw new Error('Unable to create avatar capture canvas')

    context.drawImage(image, 0, 0, size, size)
    return canvas
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export const renderAvatarPngBlob = async (
  sourceSvg: SVGSVGElement,
  size: number,
  options: AvatarCaptureOptions = {}
) => {
  const canvas = await renderAvatarCaptureCanvas(sourceSvg, size, options)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob == null) {
        reject(new Error('Unable to encode avatar PNG'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

export const captureAvatarScreenshot = async (
  sourceSvg: SVGSVGElement,
  options: AvatarCaptureOptions = {}
) => {
  const canvas = await renderAvatarCaptureCanvas(sourceSvg, SCREENSHOT_SIZE, options)
  return canvas.toDataURL('image/png')
}
