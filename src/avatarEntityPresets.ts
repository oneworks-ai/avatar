import { AVATAR_ENTITY_RANGES } from '@oneworks/avatar'
import type { AvatarPalette } from '@oneworks/avatar'

import { AVATAR_BODY_SHAPES, DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type { AvatarBodyShape, AvatarFaceStyle } from './avatarGeometry'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

export const AVATAR_ENTITY_PRESETS = ['custom', 'cloud', 'sun', 'cat', 'dog', 'bear', 'red-panda', 'hamster', 'otter', 'rabbit', 'bun'] as const

export type AvatarEntityPreset = (typeof AVATAR_ENTITY_PRESETS)[number]

export const AVATAR_BUILT_IN_ENTITY_PRESETS = ['cloud', 'sun', 'cat', 'dog', 'bear', 'red-panda', 'hamster', 'otter', 'rabbit', 'bun'] as const satisfies readonly AvatarEntityPreset[]

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
  gap: 36
}

const SUN_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 42,
  leftEyeRotation: -5,
  mouthCurve: 24,
  mouthEnabled: true,
  mouthHeight: 6,
  mouthWidth: 30,
  mouthY: 48,
  rightEyeRotation: 5
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
  leftEyeRotation: -10,
  noseEnabled: true,
  noseHeight: 11,
  noseShape: 'ellipse',
  noseWidth: 16,
  noseY: 22,
  rightEyeRotation: 10
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

const OTTER_MATERIAL = {
  baseColor: '#806149',
  foregroundColor: '#24150f',
  highlightColor: '#ad8768',
  shadowColor: '#453328'
} as const

const OTTER_EAR_MATERIAL = {
  ...OTTER_MATERIAL,
  baseColor: '#5b4234',
  highlightColor: '#80614d',
  shadowColor: '#32251e'
} as const

const RED_PANDA_MATERIAL = {
  baseColor: '#a96343',
  foregroundColor: '#231714',
  highlightColor: '#d9956c',
  shadowColor: '#613b2e'
} as const

const RED_PANDA_EAR_MATERIAL = {
  ...RED_PANDA_MATERIAL,
  baseColor: '#4d2f2b',
  highlightColor: '#765047',
  shadowColor: '#2b1c19'
} as const

const HAMSTER_MATERIAL = {
  baseColor: '#d8a164',
  foregroundColor: '#2b1a14',
  highlightColor: '#f0c38b',
  shadowColor: '#9a6342'
} as const

const HAMSTER_EAR_MATERIAL = {
  ...HAMSTER_MATERIAL,
  baseColor: '#b8756b',
  highlightColor: '#dc9a8e',
  shadowColor: '#75463f'
} as const

const BEAR_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 50,
  leftEyeRotation: 5,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 16,
  noseShape: 'ellipse',
  noseWidth: 29,
  noseY: 28,
  rightEyeRotation: -5
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

const OTTER_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 44,
  leftEyeRotation: 2,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 14,
  noseShape: 'inverted-triangle',
  noseWidth: 23,
  noseY: 29,
  rightEyeRotation: -2
} as const

const RED_PANDA_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 46,
  leftEyeRotation: 5,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 13,
  noseShape: 'inverted-triangle',
  noseWidth: 19,
  noseY: 28,
  rightEyeRotation: -5
} as const

const HAMSTER_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeRoundness: 100,
  eyeShape: 'ellipse',
  gap: 40,
  height: 48,
  leftEyeRotation: -2,
  mouthEnabled: false,
  noseEnabled: false,
  rightEyeRotation: 2,
  width: 30
} as const

const BUN_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeHighlight: {
    color: '#ffffff',
    enabled: true,
    offsetX: -20,
    offsetY: -22,
    opacity: 100,
    size: 36
  },
  eyeRoundness: 100,
  eyeShape: 'ellipse',
  gap: 36,
  height: 28,
  leftEyeRotation: 0,
  mouthCurve: 42,
  mouthEnabled: false,
  mouthHeight: 8,
  mouthRotation: 0,
  mouthShape: 'curve',
  mouthWidth: 34,
  mouthY: 51,
  noseEnabled: false,
  noseHeight: 8,
  noseRotation: 0,
  noseShape: 'rounded',
  noseWidth: 12,
  noseY: 24,
  rotation: 0,
  rightEyeRotation: 0,
  width: 28
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
  readonly gridDensity: number
  readonly interactionMode: 'move' | 'rotate'
  readonly lightAzimuth: number
  readonly lightDistance: number
  readonly lightElevation: number
  readonly paletteId: string
  readonly showAvatarShadow: boolean
  readonly showFrameShadow: boolean
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showShadow: boolean
  readonly surfaceDecals: readonly AvatarSurfaceDecal[]
  readonly viewState: {
    readonly pitch: number
    readonly positionX: number
    readonly positionY: number
    readonly roll: number
    readonly scale: number
    readonly yaw: number
  }
}

const DEFAULT_PRESET_LIGHTING = {
  gridDensity: 100,
  lightAzimuth: -35,
  lightDistance: 0,
  lightElevation: 40
} as const

const CLOUD_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
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
  surfaceDecals: [],
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
  ...DEFAULT_PRESET_LIGHTING,
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
  surfaceDecals: [],
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
  ...DEFAULT_PRESET_LIGHTING,
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
  surfaceDecals: [],
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
  ...DEFAULT_PRESET_LIGHTING,
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
  surfaceDecals: [],
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
  ...DEFAULT_PRESET_LIGHTING,
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
  surfaceDecals: [],
  viewState: {
    pitch: -.07,
    positionX: -35,
    positionY: 84,
    roll: .12,
    scale: 1.72,
    yaw: .2
  }
} as const satisfies AvatarEntityPresetScene

const OTTER_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#24150f', opacity: 88, width: 4 },
  avatarShadowStyle: { color: '#173d44', direction: 132, distance: 11, opacity: 27, softness: 16 },
  backgroundStyle: 'solid',
  cameraBackground: '#72cbd0',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'cocoa',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [
    { color: '#e8d2aa', height: 46, id: 'otter-muzzle', label: 'Muzzle', opacity: 100, rotation: 0, shape: 'ellipse', side: 'front', targetPartId: 'otter-head', width: 102, x: 0, y: 38 }
  ],
  viewState: {
    pitch: -.06,
    positionX: -20,
    positionY: 76,
    roll: -.06,
    scale: 1.78,
    yaw: -.1
  }
} as const satisfies AvatarEntityPresetScene

const RED_PANDA_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#231714', opacity: 88, width: 4 },
  avatarShadowStyle: { color: '#102f2d', direction: 128, distance: 11, opacity: 28, softness: 16 },
  backgroundStyle: 'solid',
  cameraBackground: '#214b45',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'ember',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [
    { color: '#f3dfc4', height: 92, id: 'red-panda-eye-mask-left', label: 'Left eye mask', opacity: 100, rotation: -12, shape: 'ellipse', side: 'front', targetPartId: 'red-panda-head', width: 58, x: -32, y: -4 },
    { color: '#f3dfc4', height: 92, id: 'red-panda-eye-mask-right', label: 'Right eye mask', opacity: 100, rotation: 12, shape: 'ellipse', side: 'front', targetPartId: 'red-panda-head', width: 58, x: 32, y: -4 },
    { color: '#f7e8d1', height: 44, id: 'red-panda-muzzle', label: 'Muzzle', opacity: 100, rotation: 0, shape: 'ellipse', side: 'front', targetPartId: 'red-panda-head', width: 88, x: 0, y: 39 }
  ],
  viewState: {
    pitch: -.09,
    positionX: 34,
    positionY: 92,
    roll: .1,
    scale: 1.78,
    yaw: .13
  }
} as const satisfies AvatarEntityPresetScene

const HAMSTER_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#2b1a14', opacity: 86, width: 4 },
  avatarShadowStyle: { color: '#66508d', direction: 134, distance: 10, opacity: 24, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#c2b4e7',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'peach',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [
    { color: '#f6d39f', height: 68, id: 'hamster-cheek-left', label: 'Left cheek pouch', opacity: 100, rotation: -4, shape: 'ellipse', side: 'front', targetPartId: 'hamster-head', width: 66, x: -49, y: 36 },
    { color: '#f6d39f', height: 68, id: 'hamster-cheek-right', label: 'Right cheek pouch', opacity: 100, rotation: 4, shape: 'ellipse', side: 'front', targetPartId: 'hamster-head', width: 66, x: 49, y: 36 },
    { color: '#f9e5bf', height: 34, id: 'hamster-muzzle', label: 'Muzzle', opacity: 100, rotation: 0, shape: 'ellipse', side: 'front', targetPartId: 'hamster-head', width: 48, x: 0, y: 41 },
    { color: '#8f4b50', height: 10, id: 'hamster-nose', label: 'Pink nose', opacity: 100, rotation: 0, shape: 'ellipse', side: 'front', targetPartId: 'hamster-head', width: 14, x: 0, y: 28 }
  ],
  viewState: {
    pitch: -.04,
    positionX: 26,
    positionY: 70,
    roll: .07,
    scale: 1.7,
    yaw: .09
  }
} as const satisfies AvatarEntityPresetScene

const RABBIT_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
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
  surfaceDecals: [],
  viewState: {
    pitch: -.2275,
    positionX: 82.7852,
    positionY: 116.8548,
    roll: -.4163,
    scale: 1.8604,
    yaw: .0827
  }
} as const satisfies AvatarEntityPresetScene

const BUN_PLEAT_DECAL: AvatarSurfaceDecal = {
  color: '#d9b985',
  height: 64,
  id: 'bun-crown-pleats',
  label: 'Crown pleats',
  opacity: 62,
  rotation: 0,
  shape: 'radial-pleats',
  side: 'front',
  targetPartId: 'bun-crown',
  width: 5,
  x: -42,
  y: 0
}

const BUN_PRESET_SCENE = {
  avatarOutlineStyle: { color: '#211813', opacity: 92, width: 3 },
  avatarShadowStyle: { color: '#7a5637', direction: 122, distance: 10, opacity: 24, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#f7f5ef',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  gridDensity: 228,
  interactionMode: 'rotate',
  lightAzimuth: -32,
  lightDistance: 6,
  lightElevation: 46,
  paletteId: 'white',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [
    BUN_PLEAT_DECAL,
    { color: '#f5a1ac', height: 12, id: 'blush-left', label: 'Left blush', opacity: 88, rotation: -2, shape: 'ellipse', side: 'front', targetPartId: 'bun-body', width: 23, x: -44, y: 13 },
    { color: '#f5a1ac', height: 12, id: 'blush-right', label: 'Right blush', opacity: 88, rotation: 2, shape: 'ellipse', side: 'front', targetPartId: 'bun-body', width: 23, x: 44, y: 13 },
    { color: '#241915', height: 22, id: 'mouth-outline', label: 'Open smile', opacity: 100, rotation: 0, shape: 'rounded-triangle', side: 'front', targetPartId: 'bun-body', width: 32, x: 0, y: 49 },
    { color: '#f05f68', height: 8, id: 'mouth-inner', label: 'Smile interior', opacity: 100, rotation: 0, shape: 'ellipse', side: 'front', targetPartId: 'bun-body', width: 19, x: 0, y: 54 },
    { color: '#d97757', height: 34, id: 'claude-spark-official', label: 'Official Claude Spark', opacity: 100, rotation: 0, shape: 'claude-spark', side: 'back', targetPartId: 'bun-body', width: 34, x: 30, y: 48 }
  ],
  viewState: {
    pitch: -.0157,
    positionX: -60.6238,
    positionY: 42.0197,
    roll: .1906,
    scale: 2.4,
    yaw: -.0753
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
  gap: 40,
  leftEyeRotation: 0,
  mouthEnabled: false,
  noseEnabled: false,
  rightEyeRotation: 0
} as const

const BUN_MATERIAL = {
  baseColor: '#fff3d9',
  foregroundColor: '#241915',
  highlightColor: '#fffdf4',
  shadowColor: '#d9b985'
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

const OTTER_PARTS: readonly AvatarEntityPart[] = [
  { ...OTTER_EAR_MATERIAL, face: false, id: 'otter-ear-left', label: 'Left ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -4, rotationY: -8, rotationZ: -7, scaleX: .11, scaleY: .13, scaleZ: .11, shape: 'sphere', x: -78, y: -28, z: -14 },
  { ...OTTER_EAR_MATERIAL, face: false, id: 'otter-ear-right', label: 'Right ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -4, rotationY: 8, rotationZ: 7, scaleX: .11, scaleY: .13, scaleZ: .11, shape: 'sphere', x: 78, y: -28, z: -14 },
  { ...OTTER_MATERIAL, face: true, id: 'otter-head', label: 'Head', scaleX: .79, scaleY: .67, scaleZ: .66, shape: 'ellipse', x: 0, y: 16, z: 0 }
]

const RED_PANDA_PARTS: readonly AvatarEntityPart[] = [
  { ...RED_PANDA_EAR_MATERIAL, face: false, id: 'red-panda-ear-left', label: 'Left ear', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -4, rotationY: -8, rotationZ: -8, scaleX: .16, scaleY: .19, scaleZ: .15, shape: 'sphere', x: -61, y: -59, z: -16 },
  { ...RED_PANDA_EAR_MATERIAL, face: false, id: 'red-panda-ear-right', label: 'Right ear', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -4, rotationY: 8, rotationZ: 8, scaleX: .16, scaleY: .19, scaleZ: .15, shape: 'sphere', x: 61, y: -59, z: -16 },
  { ...RED_PANDA_MATERIAL, face: true, id: 'red-panda-head', label: 'Head', roundness: 100, scaleX: .76, scaleY: .68, scaleZ: .67, shape: 'trapezoid', topScale: .86, x: 0, y: 16, z: 0 }
]

const HAMSTER_PARTS: readonly AvatarEntityPart[] = [
  { ...HAMSTER_EAR_MATERIAL, face: false, id: 'hamster-ear-left', label: 'Left ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -4, rotationY: -6, rotationZ: -7, scaleX: .12, scaleY: .15, scaleZ: .12, shape: 'sphere', x: -55, y: -62, z: -14 },
  { ...HAMSTER_EAR_MATERIAL, face: false, id: 'hamster-ear-right', label: 'Right ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -4, rotationY: 6, rotationZ: 7, scaleX: .12, scaleY: .15, scaleZ: .12, shape: 'sphere', x: 55, y: -62, z: -14 },
  { ...HAMSTER_MATERIAL, face: true, id: 'hamster-head', label: 'Head', scaleX: .71, scaleY: .7, scaleZ: .66, shape: 'sphere', x: 0, y: 18, z: 0 }
]

const RABBIT_PARTS: readonly AvatarEntityPart[] = [
  { ...RABBIT_MATERIAL, face: false, id: 'ear-left', label: 'Left ear', occludedByFace: true, rotationX: -3, rotationY: -5, rotationZ: -8, roundness: 100, scaleX: .18, scaleY: .6, shape: 'trapezoid', topScale: .9, x: -50, y: -76, z: -22 },
  { ...RABBIT_MATERIAL, face: false, id: 'ear-right', label: 'Right ear', occludedByFace: true, rotationX: -4, rotationY: 7, rotationZ: 11, roundness: 100, scaleX: .17, scaleY: .62, shape: 'trapezoid', topScale: .9, x: 48, y: -79, z: -24 },
  { ...RABBIT_MATERIAL, face: true, id: 'primary', label: 'Primary', roundness: 100, scaleX: .72, scaleY: .74, shape: 'trapezoid', topScale: .94, x: 0, y: 20, z: 0 }
]

const BUN_PARTS: readonly AvatarEntityPart[] = [
  { ...BUN_MATERIAL, face: false, id: 'bun-crown', label: 'Rounded bun crown', occludedByFace: true, occlusionAmount: 11, occlusionPole: 'bottom', roundness: 46, scaleX: .5, scaleY: .23, scaleZ: .5, shape: 'cone', topScale: .82, x: 0, y: -46, z: -14 },
  { ...BUN_MATERIAL, face: true, id: 'bun-body', label: 'Flattened bun', roundness: 100, scaleX: .7, scaleY: .5, scaleZ: .7, shape: 'sphere', topScale: .62, x: 0, y: 24, z: 0 }
]

const cloneParts = (parts: readonly AvatarEntityPart[]) => parts.map(part => ({ ...part }))

export const CAT_EAR_SCALE_RANGE = { min: 50, max: 160 } as const
const CAT_EAR_PARTS = CAT_PARTS.filter(part => (
  part.id === 'cat-ear-left' || part.id === 'cat-ear-right'
))

export const applyCatEarScale = (
  parts: readonly AvatarEntityPart[],
  width?: number,
  height?: number
): AvatarEntityPart[] => parts.map(part => {
  const base = CAT_EAR_PARTS.find(candidate => candidate.id === part.id)
  if (base == null) return part
  return {
    ...part,
    ...(width == null ? {} : { scaleX: base.scaleX * width / 100 }),
    ...(height == null ? {} : { scaleY: base.scaleY * height / 100 })
  }
})

export const getCatEarScale = (parts: readonly AvatarEntityPart[]) => {
  const ears = CAT_EAR_PARTS.flatMap(base => {
    const part = parts.find(candidate => candidate.id === base.id)
    return part == null ? [] : [{ base, part }]
  })
  if (ears.length === 0) return { height: 100, width: 100 }
  const average = (values: readonly number[]) => values.reduce((total, value) => total + value, 0) / values.length
  return {
    height: Math.round(average(ears.map(({ base, part }) => part.scaleY / base.scaleY * 100))),
    width: Math.round(average(ears.map(({ base, part }) => part.scaleX / base.scaleX * 100)))
  }
}

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
): AvatarEntityPart[] => parts.map(part => {
  const material = palette.entityMaterials?.[part.id]
  return {
    ...part,
    baseColor: material?.baseColor ?? palette.background,
    foregroundColor: material?.foregroundColor ?? palette.foreground,
    highlightColor: material?.highlightColor ?? palette.gradient[0],
    shadowColor: material?.shadowColor ?? palette.shadow
  }
})

export const resolveAvatarEntityPartScaleZ = (part: AvatarEntityPart) => (
  part.scaleZ ?? Math.min(part.scaleX, part.scaleY)
)

export const createAvatarEntityParts = (preset: AvatarEntityPreset): AvatarEntityPart[] => {
  if (preset === 'cloud') return cloneParts(CLOUD_PARTS)
  if (preset === 'sun') return cloneParts(SUN_PARTS)
  if (preset === 'cat') return cloneParts(CAT_PARTS)
  if (preset === 'dog') return cloneParts(DOG_PARTS)
  if (preset === 'bear') return cloneParts(BEAR_PARTS)
  if (preset === 'red-panda') return cloneParts(RED_PANDA_PARTS)
  if (preset === 'hamster') return cloneParts(HAMSTER_PARTS)
  if (preset === 'otter') return cloneParts(OTTER_PARTS)
  if (preset === 'rabbit') return cloneParts(RABBIT_PARTS)
  if (preset === 'bun') return cloneParts(BUN_PARTS)
  return []
}

export const getAvatarEntityPresetFaceStyle = (preset: AvatarEntityPreset): AvatarFaceStyle | null => {
  if (preset === 'cloud') return { ...CLOUD_FACE_STYLE }
  if (preset === 'sun') return { ...SUN_FACE_STYLE }
  if (preset === 'cat') return { ...CAT_FACE_STYLE }
  if (preset === 'dog') return { ...DOG_FACE_STYLE }
  if (preset === 'bear') return { ...BEAR_FACE_STYLE }
  if (preset === 'red-panda') return { ...RED_PANDA_FACE_STYLE }
  if (preset === 'hamster') return { ...HAMSTER_FACE_STYLE }
  if (preset === 'otter') return { ...OTTER_FACE_STYLE }
  if (preset === 'rabbit') return { ...RABBIT_FACE_STYLE }
  if (preset === 'bun') return { ...BUN_FACE_STYLE, eyeHighlight: { ...BUN_FACE_STYLE.eyeHighlight } }
  return null
}

const ENTITY_PRESET_SCENES: Partial<Record<AvatarEntityPreset, AvatarEntityPresetScene>> = {
  bear: BEAR_PRESET_SCENE,
  bun: BUN_PRESET_SCENE,
  cat: CAT_PRESET_SCENE,
  cloud: CLOUD_PRESET_SCENE,
  dog: DOG_PRESET_SCENE,
  hamster: HAMSTER_PRESET_SCENE,
  otter: OTTER_PRESET_SCENE,
  rabbit: RABBIT_PRESET_SCENE,
  'red-panda': RED_PANDA_PRESET_SCENE,
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
    surfaceDecals: scene.surfaceDecals.map(decal => ({ ...decal })),
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
  part.face ? 1 : 0,
  part.label,
  resolveAvatarEntityPartScaleZ(part),
  part.topScale ?? null,
  part.occludedByFace == null ? null : part.occludedByFace ? 1 : 0,
  part.occlusionAmount ?? null,
  part.occlusionPole ?? null
]))

export const deserializeAvatarEntityParts = (
  value: string | null,
  preset: AvatarEntityPreset
): AvatarEntityPart[] => {
  const defaults = createAvatarEntityParts(preset)
  if (value == null) return defaults
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return defaults
    const defaultsById = new Map(defaults.map(part => [part.id, part]))
    const parts = parsed.flatMap(item => {
      if (!Array.isArray(item) || typeof item[0] !== 'string' || item[0].length === 0) return []
      const fallback = defaultsById.get(item[0])
      const shape = AVATAR_BODY_SHAPES.includes(item[1] as AvatarBodyShape)
        ? item[1] as AvatarBodyShape
        : fallback?.shape
      const baseColor = isHexColor(item[7]) ? item[7] : fallback?.baseColor
      const highlightColor = isHexColor(item[8]) ? item[8] : fallback?.highlightColor
      const shadowColor = isHexColor(item[9]) ? item[9] : fallback?.shadowColor
      const foregroundColor = isHexColor(item[10]) ? item[10] : fallback?.foregroundColor
      if (
        shape == null || baseColor == null || highlightColor == null ||
        shadowColor == null || foregroundColor == null
      ) return []
      const part: AvatarEntityPart = {
        baseColor,
        face: item[17] === 1 ? true : item[17] === 0 ? false : fallback?.face ?? false,
        foregroundColor,
        highlightColor,
        id: item[0],
        label: typeof item[18] === 'string' ? item[18] : fallback?.label ?? item[0],
        scaleX: finite(
          item[5],
          fallback?.scaleX ?? 1,
          AVATAR_ENTITY_RANGES.scaleX.min,
          AVATAR_ENTITY_RANGES.scaleX.max
        ),
        scaleY: finite(
          item[6],
          fallback?.scaleY ?? 1,
          AVATAR_ENTITY_RANGES.scaleY.min,
          AVATAR_ENTITY_RANGES.scaleY.max
        ),
        shadowColor,
        shape,
        x: finiteNumber(item[2], fallback?.x ?? 0),
        y: finiteNumber(item[3], fallback?.y ?? 0),
        z: finiteNumber(item[4], fallback?.z ?? 0)
      }
      return {
        ...part,
        hollow: item[16] === 1,
        cutAngle: finiteNumber(item[15], part.cutAngle ?? 0),
        rotationX: finiteNumber(item[11], part.rotationX ?? 0),
        rotationY: finiteNumber(item[12], part.rotationY ?? 0),
        rotationZ: finiteNumber(item[13], part.rotationZ ?? 0),
        roundness: finite(
          item[14],
          part.roundness ?? 24,
          AVATAR_ENTITY_RANGES.roundness.min,
          AVATAR_ENTITY_RANGES.roundness.max
        ),
        scaleX: finite(
          item[5],
          part.scaleX,
          AVATAR_ENTITY_RANGES.scaleX.min,
          AVATAR_ENTITY_RANGES.scaleX.max
        ),
        scaleY: finite(
          item[6],
          part.scaleY,
          AVATAR_ENTITY_RANGES.scaleY.min,
          AVATAR_ENTITY_RANGES.scaleY.max
        ),
        scaleZ: finite(
          item[19],
          resolveAvatarEntityPartScaleZ(part),
          AVATAR_ENTITY_RANGES.scaleZ.min,
          AVATAR_ENTITY_RANGES.scaleZ.max
        ),
        topScale: finite(
          item[20],
          part.topScale ?? .82,
          AVATAR_ENTITY_RANGES.topScale.min,
          AVATAR_ENTITY_RANGES.topScale.max
        ),
        occludedByFace: item[21] === 1 ? true : item[21] === 0 ? false : fallback?.occludedByFace,
        occlusionAmount: item[22] == null
          ? fallback?.occlusionAmount
          : finite(
            item[22],
            fallback?.occlusionAmount ?? 0,
            AVATAR_ENTITY_RANGES.occlusionAmount.min,
            AVATAR_ENTITY_RANGES.occlusionAmount.max
          ),
        occlusionPole: item[23] === 'bottom' || item[23] === 'top'
          ? item[23]
          : fallback?.occlusionPole
      }
    })
    return parts.length === 0 && parsed.length > 0 ? defaults : parts
  } catch {
    return defaults
  }
}

export const parseAvatarEntityPreset = (value: string | null): AvatarEntityPreset => {
  return AVATAR_ENTITY_PRESETS.includes(value as AvatarEntityPreset) ? value as AvatarEntityPreset : 'custom'
}
