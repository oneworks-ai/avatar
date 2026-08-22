import type { AvatarPalette } from '@oneworks/avatar'

import { AVATAR_BODY_SHAPES, DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type { AvatarBodyShape, AvatarFaceStyle } from './avatarGeometry'

export const AVATAR_ENTITY_PRESETS = ['custom', 'cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit'] as const

export type AvatarEntityPreset = (typeof AVATAR_ENTITY_PRESETS)[number]

export const AVATAR_BUILT_IN_ENTITY_PRESETS = ['cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit'] as const satisfies readonly AvatarEntityPreset[]

export interface AvatarEntityPart {
  readonly baseColor: string
  readonly cutAngle?: number
  readonly face: boolean
  readonly foregroundColor: string
  readonly highlightColor: string
  readonly hollow?: boolean
  readonly id: string
  readonly label: string
  readonly occlusionAmount?: number
  readonly occludedByFace?: boolean
  readonly occlusionPole?: 'bottom' | 'top'
  readonly rotationX?: number
  readonly rotationY?: number
  readonly rotationZ?: number
  readonly roundness?: number
  readonly scaleX: number
  readonly scaleY: number
  readonly scaleZ?: number
  readonly shadowColor: string
  readonly shape: AvatarBodyShape
  readonly topScale?: number
  readonly x: number
  readonly y: number
  readonly z: number
}

const CLOUD_MATERIAL = {
  baseColor: '#ffffff',
  foregroundColor: '#000000',
  highlightColor: '#ffffff',
  shadowColor: '#9ca3af'
} as const

const SUN_MATERIAL = {
  baseColor: '#eaa064',
  foregroundColor: '#25130d',
  highlightColor: '#ffd29b',
  shadowColor: '#9d482c'
} as const

const CLOUD_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 36,
  height: 54,
  width: 24
}

const SUN_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 42,
  height: 34,
  leftEyeRotation: -5,
  mouthCurve: 24,
  mouthEnabled: true,
  mouthHeight: 6,
  mouthWidth: 30,
  mouthY: 48,
  rightEyeRotation: 5,
  width: 19
}

const CAT_MATERIAL = {
  baseColor: '#f7f7f4',
  foregroundColor: '#050608',
  highlightColor: '#ffffff',
  shadowColor: '#e8e9ec'
} as const

const CAT_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 42,
  height: 28,
  leftEyeRotation: -10,
  noseEnabled: true,
  noseHeight: 11,
  noseShape: 'ellipse',
  noseWidth: 16,
  noseY: 22,
  rightEyeRotation: 10,
  width: 16
}

const DOG_MATERIAL = {
  baseColor: '#f4f3ef',
  foregroundColor: '#211f1d',
  highlightColor: '#ffffff',
  shadowColor: '#a6a196'
} as const

const DOG_EAR_MATERIAL = {
  ...DOG_MATERIAL,
  baseColor: '#211f1d',
  highlightColor: '#45413d',
  shadowColor: '#080706'
} as const

const BEAR_MATERIAL = {
  baseColor: '#e3b17f',
  foregroundColor: '#2b1d18',
  highlightColor: '#f8d8ad',
  shadowColor: '#9a6346'
} as const

const BEAR_ACCENT_MATERIAL = {
  ...BEAR_MATERIAL,
  baseColor: '#a95f47',
  highlightColor: '#dc9876',
  shadowColor: '#693b30'
} as const

const BEAR_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 50,
  height: 26,
  leftEyeRotation: 5,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 16,
  noseShape: 'ellipse',
  noseWidth: 29,
  noseY: 28,
  rightEyeRotation: -5,
  width: 15
} as const

const DOG_FACE_STYLE: AvatarFaceStyle = {
  ...BEAR_FACE_STYLE,
  mouthCurve: 10,
  mouthEnabled: false,
  mouthHeight: 4,
  mouthWidth: 18,
  mouthY: 50,
  noseHeight: 14,
  noseShape: 'inverted-triangle',
  noseWidth: 18,
  noseY: 25
} as const

export interface AvatarEntityPresetScene {
  readonly avatarOutlineStyle: {
    readonly color: string
    readonly opacity: number
    readonly width: number
  }
  readonly avatarShadowStyle: {
    readonly color: string
    readonly direction: number
    readonly distance: number
    readonly opacity: number
    readonly softness: number
  }
  readonly backgroundStyle: 'solid'
  readonly cameraBackground: string
  readonly cameraFrame: 'rounded'
  readonly cameraMode: true
  readonly frameShadowStyle: {
    readonly direction: number
    readonly distance: number
    readonly opacity: number
    readonly softness: number
  }
  readonly interactionMode: 'move' | 'rotate'
  readonly paletteId: string
  readonly showAvatarShadow: boolean
  readonly showFrameShadow: boolean
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showShadow: boolean
  readonly viewState: {
    readonly pitch: number
    readonly positionX: number
    readonly positionY: number
    readonly roll: number
    readonly scale: number
    readonly yaw: number
  }
}

const CLOUD_PRESET_SCENE = {
  avatarOutlineStyle: { color: '#293646', opacity: 80, width: 4 },
  avatarShadowStyle: { color: '#315e8c', direction: 132, distance: 11, opacity: 24, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#87bfff',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'move',
  paletteId: 'white',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  viewState: {
    pitch: -.3425,
    positionX: 100.6977,
    positionY: 112.9753,
    roll: -.12,
    scale: 1.6684,
    yaw: -.1836
  }
} as const satisfies AvatarEntityPresetScene

const SUN_PRESET_SCENE = {
  avatarOutlineStyle: { color: '#25130d', opacity: 84, width: 4 },
  avatarShadowStyle: { color: '#180e22', direction: 44, distance: 12, opacity: 30, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#382641',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 22, softness: 24 },
  interactionMode: 'move',
  paletteId: 'gold',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  viewState: {
    pitch: -.1,
    positionX: -46,
    positionY: 94,
    roll: .15,
    scale: 1.78,
    yaw: .18
  }
} as const satisfies AvatarEntityPresetScene

const CAT_PRESET_SCENE = {
  avatarOutlineStyle: { color: '#050608', opacity: 84, width: 4 },
  avatarShadowStyle: { color: '#7c3140', direction: 132, distance: 10, opacity: 28, softness: 14 },
  backgroundStyle: 'solid',
  cameraBackground: '#111315',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'move',
  paletteId: 'coral',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  viewState: {
    pitch: -.1155,
    positionX: 72.5476,
    positionY: 121.0866,
    roll: -.16,
    scale: 2.3884,
    yaw: -.2538
  }
} as const satisfies AvatarEntityPresetScene

const DOG_PRESET_SCENE = {
  avatarOutlineStyle: { color: '#000000', opacity: 80, width: 4 },
  avatarShadowStyle: { color: '#000000', direction: 45, distance: 12, opacity: 24, softness: 16 },
  backgroundStyle: 'solid',
  cameraBackground: '#0e4fe7',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 22, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'white',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  viewState: {
    pitch: .1413,
    positionX: -59.3965,
    positionY: 107.977,
    roll: .3043,
    scale: 1.8905,
    yaw: .2288
  }
} as const satisfies AvatarEntityPresetScene

const BEAR_PRESET_SCENE = {
  avatarOutlineStyle: { color: '#2b1d18', opacity: 84, width: 4 },
  avatarShadowStyle: { color: '#6f3f25', direction: 42, distance: 11, opacity: 26, softness: 16 },
  backgroundStyle: 'solid',
  cameraBackground: '#f2bd4f',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'gold',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  viewState: {
    pitch: -.07,
    positionX: -35,
    positionY: 84,
    roll: .12,
    scale: 1.72,
    yaw: .2
  }
} as const satisfies AvatarEntityPresetScene

const RABBIT_PRESET_SCENE = {
  avatarOutlineStyle: { color: '#292724', opacity: 82, width: 4 },
  avatarShadowStyle: { color: '#9b451f', direction: 126, distance: 10, opacity: 25, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#f08c46',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'lilac',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  viewState: {
    pitch: -.2275,
    positionX: 82.7852,
    positionY: 116.8548,
    roll: -.4163,
    scale: 1.8604,
    yaw: .0827
  }
} as const satisfies AvatarEntityPresetScene

const RABBIT_MATERIAL = {
  baseColor: '#eee9df',
  foregroundColor: '#292724',
  highlightColor: '#fffdf8',
  shadowColor: '#b9b2a6'
} as const

const RABBIT_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 48,
  height: 21,
  leftEyeRotation: 2,
  mouthCurve: 3.891481414151281,
  mouthEnabled: true,
  mouthHeight: 14.108518585848719,
  mouthWidth: 17.722037041846338,
  mouthY: 71,
  noseEnabled: true,
  noseHeight: 14,
  noseShape: 'inverted-triangle',
  noseWidth: 18,
  noseY: 35,
  rightEyeRotation: -2,
  width: 12
} as const

const CLOUD_PARTS: readonly AvatarEntityPart[] = [
  // Cloud lobes are a fused silhouette, not accessories inserted into the
  // primary body. Masking their overlap would turn every lobe into a ring.
  { ...CLOUD_MATERIAL, face: false, id: 'crown-left', label: 'Crown left', scaleX: .38, scaleY: .38, shape: 'sphere', x: -91, y: -48, z: -42 },
  { ...CLOUD_MATERIAL, face: false, id: 'crown-center', label: 'Crown center', scaleX: .48, scaleY: .46, shape: 'rounded', x: -20, y: -79, z: -34 },
  { ...CLOUD_MATERIAL, face: false, id: 'crown-right', label: 'Crown right', scaleX: .34, scaleY: .37, shape: 'sphere', x: 65, y: -55, z: -47 },
  { ...CLOUD_MATERIAL, face: false, id: 'edge-left', label: 'Left edge', scaleX: .41, scaleY: .36, shape: 'rounded', x: -122, y: 13, z: -26 },
  { ...CLOUD_MATERIAL, face: false, id: 'edge-right', label: 'Right edge', scaleX: .37, scaleY: .34, shape: 'sphere', x: 119, y: 20, z: -29 },
  { ...CLOUD_MATERIAL, face: false, id: 'base-left', label: 'Base left', scaleX: .47, scaleY: .27, shape: 'capsule', x: -65, y: 72, z: -38 },
  { ...CLOUD_MATERIAL, face: false, id: 'base-right', label: 'Base right', scaleX: .52, scaleY: .29, shape: 'capsule', x: 52, y: 70, z: -36 },
  { ...CLOUD_MATERIAL, face: true, id: 'primary', label: 'Primary', scaleX: .83, scaleY: .66, shape: 'ellipse', x: 0, y: 10, z: 0 }
]

const SUN_PARTS: readonly AvatarEntityPart[] = [
  ...Array.from({ length: 8 }, (_, index): AvatarEntityPart => {
    const angle = index * Math.PI / 4
    return {
      ...SUN_MATERIAL,
      face: false,
      id: `ray-${index + 1}`,
      label: `Ray ${index + 1}`,
      occludedByFace: true,
      scaleX: .14,
      scaleY: .14,
      shape: index % 2 === 0 ? 'diamond' : 'sphere',
      x: Math.cos(angle) * 125,
      y: Math.sin(angle) * 125,
      z: -18
    }
  }),
  { ...SUN_MATERIAL, face: true, id: 'primary', label: 'Primary', scaleX: .72, scaleY: .72, shape: 'sphere', x: 0, y: 0, z: 0 }
]

const CAT_PARTS: readonly AvatarEntityPart[] = [
  { ...CAT_MATERIAL, face: false, id: 'cat-ear-left', label: 'Left ear', occludedByFace: true, rotationX: -7, rotationY: -13, rotationZ: -9, roundness: 48, scaleX: .24, scaleY: .29, shape: 'cone', x: -56, y: -78, z: -8 },
  { ...CAT_MATERIAL, face: false, id: 'cat-ear-right', label: 'Right ear', occludedByFace: true, rotationX: -6, rotationY: 13, rotationZ: 9, roundness: 52, scaleX: .23, scaleY: .28, shape: 'cone', x: 56, y: -78, z: -10 },
  { ...CAT_MATERIAL, face: true, id: 'cat-head', label: 'Head', scaleX: .73, scaleY: .68, shape: 'ellipse', x: 0, y: 12, z: 0 }
]

const DOG_PARTS: readonly AvatarEntityPart[] = [
  { ...DOG_EAR_MATERIAL, face: false, id: 'ear-left', label: 'Left ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -4, rotationY: -10, rotationZ: 22, scaleX: .18, scaleY: .34, scaleZ: .18, shape: 'teardrop', x: -72, y: -52, z: 0 },
  { ...DOG_EAR_MATERIAL, face: false, id: 'ear-right', label: 'Right ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -4, rotationY: 10, rotationZ: -22, scaleX: .18, scaleY: .34, scaleZ: .18, shape: 'teardrop', x: 72, y: -52, z: 0 },
  { ...DOG_MATERIAL, face: true, id: 'primary', label: 'Primary', roundness: 84, scaleX: .72, scaleY: .8, shape: 'trapezoid', topScale: .68, x: 0, y: 15, z: 0 }
]

const BEAR_PARTS: readonly AvatarEntityPart[] = [
  { ...BEAR_ACCENT_MATERIAL, face: false, id: 'ear-left', label: 'Left ear', occludedByFace: true, rotationX: -4, rotationY: -7, rotationZ: 8, scaleX: .2, scaleY: .34, shape: 'ellipse', x: -58, y: -72, z: -18 },
  { ...BEAR_ACCENT_MATERIAL, face: false, id: 'ear-right', label: 'Right ear', occludedByFace: true, rotationX: -3, rotationY: 8, rotationZ: -7, scaleX: .19, scaleY: .33, shape: 'ellipse', x: 58, y: -70, z: -20 },
  { ...BEAR_MATERIAL, face: true, id: 'primary', label: 'Primary', roundness: 78, scaleX: .74, scaleY: .72, shape: 'trapezoid', x: 0, y: 20, z: 0 }
]

const RABBIT_PARTS: readonly AvatarEntityPart[] = [
  { ...RABBIT_MATERIAL, face: false, id: 'ear-left', label: 'Left ear', occludedByFace: true, rotationX: -3, rotationY: -5, rotationZ: -8, roundness: 100, scaleX: .18, scaleY: .6, shape: 'trapezoid', topScale: .9, x: -50, y: -76, z: -22 },
  { ...RABBIT_MATERIAL, face: false, id: 'ear-right', label: 'Right ear', occludedByFace: true, rotationX: -4, rotationY: 7, rotationZ: 11, roundness: 100, scaleX: .17, scaleY: .62, shape: 'trapezoid', topScale: .9, x: 48, y: -79, z: -24 },
  { ...RABBIT_MATERIAL, face: true, id: 'primary', label: 'Primary', roundness: 100, scaleX: .72, scaleY: .74, shape: 'trapezoid', topScale: .94, x: 0, y: 20, z: 0 }
]

const cloneParts = (parts: readonly AvatarEntityPart[]) => parts.map(part => ({ ...part }))

const getMaterialSignature = (part: AvatarEntityPart) => [
  part.baseColor,
  part.highlightColor,
  part.shadowColor,
  part.foregroundColor
].join('|')

export const hasMultipleAvatarEntityMaterials = (parts: readonly AvatarEntityPart[]) => {
  return new Set(parts.map(getMaterialSignature)).size > 1
}

export const applyAvatarEntityPalette = (
  parts: readonly AvatarEntityPart[],
  palette: AvatarPalette
): AvatarEntityPart[] => parts.map(part => ({
  ...part,
  baseColor: palette.background,
  foregroundColor: palette.foreground,
  highlightColor: palette.gradient[0],
  shadowColor: palette.shadow
}))

export const resolveAvatarEntityPartScaleZ = (part: AvatarEntityPart) => (
  part.scaleZ ?? Math.min(part.scaleX, part.scaleY)
)

export const createAvatarEntityParts = (preset: AvatarEntityPreset): AvatarEntityPart[] => {
  if (preset === 'cloud') return cloneParts(CLOUD_PARTS)
  if (preset === 'sun') return cloneParts(SUN_PARTS)
  if (preset === 'cat') return cloneParts(CAT_PARTS)
  if (preset === 'dog') return cloneParts(DOG_PARTS)
  if (preset === 'bear') return cloneParts(BEAR_PARTS)
  if (preset === 'rabbit') return cloneParts(RABBIT_PARTS)
  return []
}

export const getAvatarEntityPresetFaceStyle = (preset: AvatarEntityPreset): AvatarFaceStyle | null => {
  if (preset === 'cloud') return { ...CLOUD_FACE_STYLE }
  if (preset === 'sun') return { ...SUN_FACE_STYLE }
  if (preset === 'cat') return { ...CAT_FACE_STYLE }
  if (preset === 'dog') return { ...DOG_FACE_STYLE }
  if (preset === 'bear') return { ...BEAR_FACE_STYLE }
  if (preset === 'rabbit') return { ...RABBIT_FACE_STYLE }
  return null
}

const ENTITY_PRESET_SCENES: Partial<Record<AvatarEntityPreset, AvatarEntityPresetScene>> = {
  bear: BEAR_PRESET_SCENE,
  cat: CAT_PRESET_SCENE,
  cloud: CLOUD_PRESET_SCENE,
  dog: DOG_PRESET_SCENE,
  rabbit: RABBIT_PRESET_SCENE,
  sun: SUN_PRESET_SCENE
}

export const getAvatarEntityPresetScene = (preset: AvatarEntityPreset): AvatarEntityPresetScene | null => {
  const scene = ENTITY_PRESET_SCENES[preset]
  if (scene == null) return null
  return {
    ...scene,
    avatarOutlineStyle: { ...scene.avatarOutlineStyle },
    avatarShadowStyle: { ...scene.avatarShadowStyle },
    frameShadowStyle: { ...scene.frameShadowStyle },
    viewState: { ...scene.viewState }
  }
}

const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)
const finite = (value: unknown, fallback: number, min: number, max: number) => {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : fallback
}
const finiteNumber = (value: unknown, fallback: number) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export const serializeAvatarEntityParts = (parts: readonly AvatarEntityPart[]) => JSON.stringify(parts.map(part => [
  part.id,
  part.shape,
  part.x,
  part.y,
  part.z,
  part.scaleX,
  part.scaleY,
  part.baseColor,
  part.highlightColor,
  part.shadowColor,
  part.foregroundColor,
  part.rotationX ?? 0,
  part.rotationY ?? 0,
  part.rotationZ ?? 0,
  part.roundness ?? 24,
  part.cutAngle ?? 0,
  part.hollow ? 1 : 0,
  null,
  null,
  resolveAvatarEntityPartScaleZ(part),
  part.topScale ?? null
]))

export const deserializeAvatarEntityParts = (
  value: string | null,
  preset: AvatarEntityPreset
): AvatarEntityPart[] => {
  const defaults = createAvatarEntityParts(preset)
  if (value == null || defaults.length === 0) return defaults
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return defaults
    const byId = new Map(parsed.filter(Array.isArray).map(item => [item[0], item]))
    return defaults.map(part => {
      const item = byId.get(part.id)
      if (!Array.isArray(item)) return part
      return {
        ...part,
        baseColor: isHexColor(item[7]) ? item[7] : part.baseColor,
        foregroundColor: isHexColor(item[10]) ? item[10] : part.foregroundColor,
        highlightColor: isHexColor(item[8]) ? item[8] : part.highlightColor,
        hollow: item[16] === 1,
        cutAngle: finiteNumber(item[15], part.cutAngle ?? 0),
        rotationX: finiteNumber(item[11], part.rotationX ?? 0),
        rotationY: finiteNumber(item[12], part.rotationY ?? 0),
        rotationZ: finiteNumber(item[13], part.rotationZ ?? 0),
        roundness: finite(item[14], part.roundness ?? 24, 0, 100),
        scaleX: finite(item[5], part.scaleX, .08, 1.5),
        scaleY: finite(item[6], part.scaleY, .08, 1.5),
        scaleZ: finite(item[19], resolveAvatarEntityPartScaleZ(part), .08, 1.5),
        shadowColor: isHexColor(item[9]) ? item[9] : part.shadowColor,
        shape: AVATAR_BODY_SHAPES.includes(item[1] as AvatarBodyShape) ? item[1] as AvatarBodyShape : part.shape,
        topScale: finite(item[20], part.topScale ?? .82, .4, 1.2),
        x: finiteNumber(item[2], part.x),
        y: finiteNumber(item[3], part.y),
        z: finiteNumber(item[4], part.z)
      }
    })
  } catch {
    return defaults
  }
}

export const parseAvatarEntityPreset = (value: string | null): AvatarEntityPreset => {
  return AVATAR_ENTITY_PRESETS.includes(value as AvatarEntityPreset) ? value as AvatarEntityPreset : 'custom'
}
