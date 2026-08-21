import type { AvatarCameraFrame } from './AvatarControls'

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

interface AvatarScreenshotOptions {
  readonly background?: string
  readonly frame?: AvatarCameraFrame
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

const addFramePath = (context: CanvasRenderingContext2D, frame: AvatarCameraFrame) => {
  const size = SCREENSHOT_SIZE
  context.beginPath()
  if (frame === 'circle') {
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    return
  }
  if (frame === 'rounded') {
    const radius = 18
    context.moveTo(radius, 0)
    context.lineTo(size - radius, 0)
    context.quadraticCurveTo(size, 0, size, radius)
    context.lineTo(size, size - radius)
    context.quadraticCurveTo(size, size, size - radius, size)
    context.lineTo(radius, size)
    context.quadraticCurveTo(0, size, 0, size - radius)
    context.lineTo(0, radius)
    context.quadraticCurveTo(0, 0, radius, 0)
    return
  }
  context.rect(0, 0, size, size)
}

export const captureAvatarScreenshot = async (
  sourceSvg: SVGSVGElement,
  options: AvatarScreenshotOptions = {}
) => {
  const clonedSvg = sourceSvg.cloneNode(true) as SVGSVGElement
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clonedSvg.setAttribute('width', String(SCREENSHOT_SIZE))
  clonedSvg.setAttribute('height', String(SCREENSHOT_SIZE))

  const svgSource = new XMLSerializer().serializeToString(clonedSvg)
  const sourceUrl = URL.createObjectURL(new Blob([svgSource], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    image.src = sourceUrl
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = SCREENSHOT_SIZE
    canvas.height = SCREENSHOT_SIZE
    const context = canvas.getContext('2d')
    if (context == null) throw new Error('Unable to create avatar screenshot canvas')

    context.save()
    if (options.frame != null) {
      addFramePath(context, options.frame)
      context.clip()
    }
    if (options.background != null) {
      context.fillStyle = options.background
      context.fillRect(0, 0, SCREENSHOT_SIZE, SCREENSHOT_SIZE)
    }
    context.drawImage(image, 0, 0, SCREENSHOT_SIZE, SCREENSHOT_SIZE)
    context.restore()
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}
