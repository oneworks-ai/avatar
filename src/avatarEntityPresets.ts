import {
  AVATAR_ENTITY_RANGES,
  AVATAR_EYE_HIGHLIGHT_RANGES,
  AVATAR_FACE_RANGES,
  AVATAR_SURFACE_DECAL_RANGES
} from '@oneworks/avatar'
import type { AvatarPalette } from '@oneworks/avatar'

import { AVATAR_BODY_SHAPES, DEFAULT_AVATAR_FACE_STYLE, resolveAvatarFaceStyle } from './avatarGeometry'
import type { AvatarBodyShape, AvatarFaceStyle } from './avatarGeometry'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

export type AvatarAnimalSurfaceMarkingShape = Extract<
  AvatarSurfaceDecal['shape'],
  'ellipse' | 'face-mask' | 'rounded' | 'rounded-triangle'
>

export type AvatarAnimalSurfaceMarkingStyle = Partial<
  Pick<AvatarSurfaceDecal, 'color' | 'height' | 'opacity' | 'width' | 'x' | 'y'>
> & {
  readonly shape?: AvatarAnimalSurfaceMarkingShape
}

export type AvatarDeerSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarOtterSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarSheepSurfaceMarkingShape = AvatarAnimalSurfaceMarkingShape
export type AvatarSheepSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle

export const AVATAR_ENTITY_PRESETS = ['custom', 'cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit', 'fox', 'hamster', 'capybara', 'otter', 'pig', 'deer', 'sheep', 'bun'] as const

export type AvatarEntityPreset = (typeof AVATAR_ENTITY_PRESETS)[number]

export const AVATAR_BUILT_IN_ENTITY_PRESETS = ['cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit', 'fox', 'hamster', 'capybara', 'otter', 'pig', 'deer', 'sheep', 'bun'] as const satisfies readonly AvatarEntityPreset[]

export interface AvatarEntityPart {
  readonly baseColor: string
  readonly bottomTaper?: number
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

export type AvatarEntityFaceStyleOverride = Partial<Omit<AvatarFaceStyle, 'eyeHighlight'>> & {
  readonly eyeHighlight?: Partial<AvatarFaceStyle['eyeHighlight']>
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

const FOX_MATERIAL = {
  baseColor: '#dd7646',
  foregroundColor: '#26352b',
  highlightColor: '#f19b67',
  shadowColor: '#974626'
} as const

const FOX_EAR_MATERIAL = {
  ...FOX_MATERIAL,
  baseColor: '#c85d35',
  highlightColor: '#e97e51',
  shadowColor: '#78361f'
} as const

const FOX_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 54,
  height: 37,
  leftEyeRotation: -8,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 17,
  noseShape: 'inverted-triangle',
  noseWidth: 24,
  noseY: 39,
  rightEyeRotation: 8,
  width: 21
} as const

const HAMSTER_MATERIAL = {
  baseColor: '#ce9660',
  foregroundColor: '#39271f',
  highlightColor: '#edc695',
  shadowColor: '#8f5937'
} as const

const HAMSTER_ACCENT_MATERIAL = {
  ...HAMSTER_MATERIAL,
  baseColor: '#f7e7cb',
  highlightColor: '#fff8e9',
  shadowColor: '#d4bc99'
} as const

const HAMSTER_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeShape: 'rounded',
  gap: 48,
  height: 32,
  leftEyeRotation: -5,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 10,
  noseShape: 'ellipse',
  noseWidth: 14,
  noseY: 35,
  rightEyeRotation: 5,
  width: 21
} as const

const CAPYBARA_MATERIAL = {
  baseColor: '#a77b58',
  foregroundColor: '#34261e',
  highlightColor: '#c8a17c',
  shadowColor: '#694a37'
} as const

const CAPYBARA_MUZZLE_MATERIAL = {
  ...CAPYBARA_MATERIAL,
  baseColor: '#d4b291',
  highlightColor: '#ecd6bb',
  shadowColor: '#a18060'
} as const

const CAPYBARA_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeShape: 'rounded',
  gap: 55,
  height: 28,
  leftEyeRotation: -3,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 15,
  noseShape: 'ellipse',
  noseWidth: 27,
  noseY: 40,
  rightEyeRotation: 3,
  width: 19
} as const

const OTTER_MATERIAL = {
  baseColor: '#815b40',
  foregroundColor: '#302118',
  highlightColor: '#aa8362',
  shadowColor: '#513925'
} as const

const OTTER_MUZZLE_MATERIAL = {
  ...OTTER_MATERIAL,
  baseColor: '#e5d0ad',
  highlightColor: '#fff0d1',
  shadowColor: '#b79c79'
} as const

const OTTER_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeShape: 'rounded',
  gap: 45,
  height: 33,
  leftEyeRotation: -6,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 12,
  noseShape: 'ellipse',
  noseWidth: 19,
  noseY: 35,
  rightEyeRotation: 6,
  width: 20
} as const

const PIG_MATERIAL = {
  baseColor: '#efb0ac',
  foregroundColor: '#713f43',
  highlightColor: '#ffd4d0',
  shadowColor: '#bd7777'
} as const

const PIG_SNOUT_MATERIAL = {
  ...PIG_MATERIAL,
  baseColor: '#f8c5bf',
  highlightColor: '#ffded8',
  shadowColor: '#cf8a88'
} as const

const PIG_NOSTRIL_MATERIAL = {
  ...PIG_MATERIAL,
  baseColor: '#713f43',
  highlightColor: '#8c5458',
  shadowColor: '#542e32'
} as const

const PIG_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeShape: 'rounded',
  gap: 49,
  height: 33,
  leftEyeRotation: -5,
  mouthEnabled: false,
  noseEnabled: false,
  rightEyeRotation: 5,
  width: 20
} as const

const DEER_MATERIAL = {
  baseColor: '#b77a4c',
  foregroundColor: '#39251b',
  highlightColor: '#dda77a',
  shadowColor: '#744931'
} as const

const DEER_ANTLER_MATERIAL = {
  ...DEER_MATERIAL,
  baseColor: '#806447',
  highlightColor: '#aa8963',
  shadowColor: '#59432f'
} as const

const DEER_MUZZLE_MATERIAL = {
  ...DEER_MATERIAL,
  baseColor: '#f5e7cf',
  highlightColor: '#fff7e7',
  shadowColor: '#d0b796'
} as const

const DEER_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeShape: 'rounded',
  gap: 46,
  height: 39,
  leftEyeRotation: -8,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 14,
  noseShape: 'inverted-triangle',
  noseWidth: 19,
  noseY: 42,
  rightEyeRotation: 8,
  width: 20
} as const

const SHEEP_MATERIAL = {
  baseColor: '#f0ece0',
  foregroundColor: '#3a302c',
  highlightColor: '#fffdf6',
  shadowColor: '#c6bca9'
} as const

const SHEEP_FACE_MATERIAL = {
  ...SHEEP_MATERIAL,
  baseColor: '#e7dfd1',
  highlightColor: '#faf3e8',
  shadowColor: '#c0b2a2'
} as const

const SHEEP_HORN_MATERIAL = {
  ...SHEEP_MATERIAL,
  baseColor: '#a48768',
  highlightColor: '#c6ac8c',
  shadowColor: '#735940'
} as const

const SHEEP_FACE_STYLE: AvatarFaceStyle = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  eyeShape: 'rounded',
  gap: 44,
  height: 37,
  leftEyeRotation: -5,
  mouthEnabled: false,
  noseEnabled: true,
  noseHeight: 12,
  noseShape: 'inverted-triangle',
  noseWidth: 17,
  noseY: 37,
  rightEyeRotation: 5,
  width: 20
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

const FOX_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#26352b', opacity: 92, width: 4 },
  avatarShadowStyle: { color: '#10271e', direction: 126, distance: 10, opacity: 26, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#173d35',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'red-fox',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [
    { color: '#fff2dc', height: 108, id: 'fox-inner-ear-left', label: 'Left inner ear', opacity: 100, rotation: 180, shape: 'rounded-triangle', side: 'front', targetPartId: 'fox-ear-left', width: 76, x: 0, y: -8 },
    { color: '#fff2dc', height: 108, id: 'fox-inner-ear-right', label: 'Right inner ear', opacity: 100, rotation: 180, shape: 'rounded-triangle', side: 'front', targetPartId: 'fox-ear-right', width: 76, x: 0, y: -8 },
    { color: '#fff8ec', height: 132, id: 'fox-cheek-left', label: 'Left cheek', opacity: 100, rotation: -76, shape: 'rounded-triangle', side: 'face', targetPartId: 'fox-head', width: 128, x: -57, y: 27 },
    { color: '#fff8ec', height: 132, id: 'fox-cheek-right', label: 'Right cheek', opacity: 100, rotation: 76, shape: 'rounded-triangle', side: 'face', targetPartId: 'fox-head', width: 128, x: 57, y: 27 }
  ],
  viewState: {
    pitch: -.2928,
    positionX: -83.4663,
    positionY: 95.6374,
    roll: .424,
    scale: 1.7697,
    yaw: .2109
  }
} as const satisfies AvatarEntityPresetScene

const HAMSTER_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#39271f', opacity: 86, width: 4 },
  avatarShadowStyle: { color: '#754c37', direction: 128, distance: 11, opacity: 26, softness: 17 },
  backgroundStyle: 'solid',
  cameraBackground: '#e8bd74',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'syrian-hamster',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [
    { color: '#edb2a7', height: 76, id: 'hamster-inner-ear-left', label: 'Left inner ear', opacity: 92, rotation: -8, shape: 'ellipse', side: 'front', targetPartId: 'ear-left', width: 64, x: 0, y: -1 },
    { color: '#edb2a7', height: 76, id: 'hamster-inner-ear-right', label: 'Right inner ear', opacity: 92, rotation: 8, shape: 'ellipse', side: 'front', targetPartId: 'ear-right', width: 64, x: 0, y: -1 }
  ],
  viewState: { pitch: -.17, positionX: 63, positionY: 96, roll: -.19, scale: 1.82, yaw: -.24 }
} as const satisfies AvatarEntityPresetScene

const CAPYBARA_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#34261e', opacity: 82, width: 4 },
  avatarShadowStyle: { color: '#44362d', direction: 132, distance: 11, opacity: 24, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#77968b',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'capybara',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [],
  viewState: { pitch: -.12, positionX: -67, positionY: 105, roll: .16, scale: 1.83, yaw: .23 }
} as const satisfies AvatarEntityPresetScene

const OTTER_FACE_MASK_DECAL: AvatarSurfaceDecal = {
  color: OTTER_MUZZLE_MATERIAL.baseColor,
  height: 130,
  id: 'otter-face-mask',
  label: 'Natural otter face marking',
  opacity: 100,
  rotation: 0,
  shape: 'face-mask',
  side: 'face',
  targetPartId: 'primary',
  width: 160,
  x: 0,
  y: 37
}

const OTTER_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#302118', opacity: 86, width: 4 },
  avatarShadowStyle: { color: '#233e45', direction: 128, distance: 11, opacity: 25, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#78a8ad',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'river-otter',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [OTTER_FACE_MASK_DECAL],
  viewState: { pitch: -.19, positionX: 72, positionY: 92, roll: -.14, scale: 1.9, yaw: -.27 }
} as const satisfies AvatarEntityPresetScene

const PIG_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#713f43', opacity: 84, width: 4 },
  avatarShadowStyle: { color: '#79545b', direction: 126, distance: 10, opacity: 25, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#90a17d',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'pink-pig',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [],
  viewState: { pitch: -.15, positionX: -69, positionY: 103, roll: .21, scale: 1.86, yaw: .22 }
} as const satisfies AvatarEntityPresetScene

const DEER_FACE_MASK_DECAL: AvatarSurfaceDecal = {
  color: DEER_MUZZLE_MATERIAL.baseColor,
  height: 142,
  id: 'deer-face-mask',
  label: 'Natural deer face marking',
  opacity: 100,
  rotation: 0,
  shape: 'face-mask',
  side: 'face',
  targetPartId: 'primary',
  width: 130,
  x: 0,
  y: 38
}

const DEER_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#39251b', opacity: 86, width: 4 },
  avatarShadowStyle: { color: '#485c42', direction: 126, distance: 11, opacity: 25, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#63775b',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'sika-deer',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [DEER_FACE_MASK_DECAL],
  viewState: { pitch: -.16, positionX: 61, positionY: 111, roll: -.18, scale: 1.72, yaw: -.25 }
} as const satisfies AvatarEntityPresetScene

const SHEEP_FACE_MASK_DECAL: AvatarSurfaceDecal = {
  color: SHEEP_FACE_MATERIAL.baseColor,
  height: 168,
  id: 'sheep-face-mask',
  label: 'Natural sheep face marking',
  opacity: 100,
  rotation: 0,
  shape: 'face-mask',
  side: 'face',
  targetPartId: 'primary',
  width: 146,
  x: 0,
  y: 20
}

const SHEEP_PRESET_SCENE = {
  ...DEFAULT_PRESET_LIGHTING,
  avatarOutlineStyle: { color: '#3a302c', opacity: 82, width: 4 },
  avatarShadowStyle: { color: '#535144', direction: 129, distance: 11, opacity: 24, softness: 18 },
  backgroundStyle: 'solid',
  cameraBackground: '#89a085',
  cameraFrame: 'rounded',
  cameraMode: true,
  frameShadowStyle: { direction: 90, distance: 12, opacity: 20, softness: 24 },
  interactionMode: 'rotate',
  paletteId: 'white-sheep',
  showAvatarShadow: true,
  showFrameShadow: true,
  showLight: false,
  showOutline: true,
  showShadow: false,
  surfaceDecals: [SHEEP_FACE_MASK_DECAL],
  viewState: { pitch: -.13, positionX: -72, positionY: 101, roll: .17, scale: 1.8, yaw: .21 }
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

const RABBIT_PARTS: readonly AvatarEntityPart[] = [
  { ...RABBIT_MATERIAL, face: false, id: 'ear-left', label: 'Left ear', occludedByFace: true, rotationX: -3, rotationY: -5, rotationZ: -8, roundness: 100, scaleX: .18, scaleY: .6, shape: 'trapezoid', topScale: .9, x: -50, y: -76, z: -22 },
  { ...RABBIT_MATERIAL, face: false, id: 'ear-right', label: 'Right ear', occludedByFace: true, rotationX: -4, rotationY: 7, rotationZ: 11, roundness: 100, scaleX: .17, scaleY: .62, shape: 'trapezoid', topScale: .9, x: 48, y: -79, z: -24 },
  { ...RABBIT_MATERIAL, face: true, id: 'primary', label: 'Primary', roundness: 100, scaleX: .72, scaleY: .74, shape: 'trapezoid', topScale: .94, x: 0, y: 20, z: 0 }
]

const FOX_PARTS: readonly AvatarEntityPart[] = [
  { ...FOX_EAR_MATERIAL, face: false, id: 'fox-ear-left', label: 'Left ear', occludedByFace: true, occlusionAmount: 10, occlusionPole: 'bottom', rotationX: -5, rotationY: -11, rotationZ: -13, roundness: 28, scaleX: .31, scaleY: .47, scaleZ: .24, shape: 'cone', x: -68, y: -81, z: -16 },
  { ...FOX_EAR_MATERIAL, face: false, id: 'fox-ear-right', label: 'Right ear', occludedByFace: true, occlusionAmount: 10, occlusionPole: 'bottom', rotationX: -5, rotationY: 11, rotationZ: 13, roundness: 28, scaleX: .31, scaleY: .47, scaleZ: .24, shape: 'cone', x: 68, y: -81, z: -16 },
  { ...FOX_MATERIAL, bottomTaper: 52, face: true, id: 'fox-head', label: 'Head', roundness: 76, scaleX: .84, scaleY: .7, scaleZ: .7, shape: 'ellipse', x: 0, y: 17, z: 0 }
]

const HAMSTER_PARTS: readonly AvatarEntityPart[] = [
  { ...HAMSTER_MATERIAL, face: false, id: 'ear-left', label: 'Left ear', occludedByFace: true, rotationX: -5, rotationY: -9, rotationZ: -8, roundness: 100, scaleX: .2, scaleY: .22, scaleZ: .15, shape: 'ellipse', x: -67, y: -72, z: -17 },
  { ...HAMSTER_MATERIAL, face: false, id: 'ear-right', label: 'Right ear', occludedByFace: true, rotationX: -5, rotationY: 9, rotationZ: 8, roundness: 100, scaleX: .19, scaleY: .21, scaleZ: .15, shape: 'ellipse', x: 67, y: -72, z: -17 },
  { ...HAMSTER_MATERIAL, bottomTaper: 10, face: true, id: 'primary', label: 'Rounded head', roundness: 96, scaleX: .77, scaleY: .7, scaleZ: .68, shape: 'ellipse', x: 0, y: 13, z: 0 },
  { ...HAMSTER_ACCENT_MATERIAL, face: false, id: 'cheek-left', label: 'Left rounded cheek', rotationY: -16, rotationZ: -9, roundness: 100, scaleX: .3, scaleY: .3, scaleZ: .21, shape: 'ellipse', x: -60, y: 39, z: 44 },
  { ...HAMSTER_ACCENT_MATERIAL, face: false, id: 'cheek-right', label: 'Right rounded cheek', rotationY: 16, rotationZ: 9, roundness: 100, scaleX: .3, scaleY: .3, scaleZ: .21, shape: 'ellipse', x: 60, y: 39, z: 44 }
]

const CAPYBARA_PARTS: readonly AvatarEntityPart[] = [
  { ...CAPYBARA_MATERIAL, face: false, id: 'ear-left', label: 'Left small rounded ear', occludedByFace: true, rotationX: -5, rotationY: -8, rotationZ: -7, roundness: 100, scaleX: .16, scaleY: .19, scaleZ: .13, shape: 'ellipse', x: -69, y: -73, z: -15 },
  { ...CAPYBARA_MATERIAL, face: false, id: 'ear-right', label: 'Right small rounded ear', occludedByFace: true, rotationX: -5, rotationY: 8, rotationZ: 7, roundness: 100, scaleX: .15, scaleY: .18, scaleZ: .13, shape: 'ellipse', x: 69, y: -73, z: -15 },
  { ...CAPYBARA_MATERIAL, face: true, id: 'primary', label: 'Wide blunt head', roundness: 96, scaleX: .81, scaleY: .74, scaleZ: .73, shape: 'trapezoid', topScale: .92, x: 0, y: 15, z: 0 },
  { ...CAPYBARA_MUZZLE_MATERIAL, face: false, id: 'muzzle', label: 'Broad projecting muzzle', rotationX: -7, roundness: 100, scaleX: .44, scaleY: .34, scaleZ: .26, shape: 'capsule', x: 0, y: 44, z: 57 }
]

const OTTER_PARTS: readonly AvatarEntityPart[] = [
  { ...OTTER_MATERIAL, face: false, id: 'ear-left', label: 'Left small ear', occludedByFace: true, rotationX: -5, rotationY: -8, rotationZ: -7, roundness: 100, scaleX: .16, scaleY: .18, scaleZ: .13, shape: 'ellipse', x: -69, y: -62, z: -17 },
  { ...OTTER_MATERIAL, face: false, id: 'ear-right', label: 'Right small ear', occludedByFace: true, rotationX: -5, rotationY: 8, rotationZ: 7, roundness: 100, scaleX: .15, scaleY: .17, scaleZ: .13, shape: 'ellipse', x: 69, y: -62, z: -17 },
  { ...OTTER_MATERIAL, bottomTaper: 4, face: true, id: 'primary', label: 'Low rounded head', roundness: 100, scaleX: .79, scaleY: .65, scaleZ: .69, shape: 'ellipse', x: 0, y: 18, z: 0 }
]

const PIG_PARTS: readonly AvatarEntityPart[] = [
  { ...PIG_MATERIAL, face: false, id: 'ear-left', label: 'Left soft ear', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -8, rotationY: -12, rotationZ: -27, roundness: 76, scaleX: .25, scaleY: .35, scaleZ: .19, shape: 'teardrop', x: -71, y: -68, z: -13 },
  { ...PIG_MATERIAL, face: false, id: 'ear-right', label: 'Right soft ear', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -8, rotationY: 12, rotationZ: 27, roundness: 76, scaleX: .25, scaleY: .35, scaleZ: .19, shape: 'teardrop', x: 71, y: -68, z: -13 },
  { ...PIG_MATERIAL, bottomTaper: 7, face: true, id: 'primary', label: 'Rounded pig head', roundness: 100, scaleX: .78, scaleY: .73, scaleZ: .7, shape: 'ellipse', x: 0, y: 17, z: 0 },
  { ...PIG_SNOUT_MATERIAL, face: false, id: 'snout', label: 'Raised oval snout', rotationX: -7, roundness: 100, scaleX: .38, scaleY: .25, scaleZ: .24, shape: 'ellipse', x: 0, y: 47, z: 62 },
  { ...PIG_NOSTRIL_MATERIAL, face: false, id: 'nostril-left', label: 'Left nostril', rotationY: -8, roundness: 100, scaleX: .08, scaleY: .105, scaleZ: .08, shape: 'ellipse', x: -21, y: 47, z: 86 },
  { ...PIG_NOSTRIL_MATERIAL, face: false, id: 'nostril-right', label: 'Right nostril', rotationY: 8, roundness: 100, scaleX: .08, scaleY: .105, scaleZ: .08, shape: 'ellipse', x: 21, y: 47, z: 86 }
]

const DEER_PARTS: readonly AvatarEntityPart[] = [
  { ...DEER_ANTLER_MATERIAL, face: false, id: 'antler-left', label: 'Left antler stem', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -8, rotationY: -12, rotationZ: -24, roundness: 86, scaleX: .12, scaleY: .48, scaleZ: .11, shape: 'capsule', x: -45, y: -115, z: -15 },
  { ...DEER_ANTLER_MATERIAL, face: false, id: 'antler-left-branch-1', label: 'Left lower antler branch', rotationX: -7, rotationY: -17, rotationZ: -58, roundness: 88, scaleX: .1, scaleY: .26, scaleZ: .09, shape: 'capsule', x: -70, y: -127, z: -8 },
  { ...DEER_ANTLER_MATERIAL, face: false, id: 'antler-left-branch-2', label: 'Left upper antler branch', rotationX: -8, rotationY: -13, rotationZ: -48, roundness: 88, scaleX: .09, scaleY: .22, scaleZ: .085, shape: 'capsule', x: -63, y: -156, z: -6 },
  { ...DEER_ANTLER_MATERIAL, face: false, id: 'antler-right', label: 'Right antler stem', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -8, rotationY: 12, rotationZ: 24, roundness: 86, scaleX: .12, scaleY: .48, scaleZ: .11, shape: 'capsule', x: 45, y: -115, z: -15 },
  { ...DEER_ANTLER_MATERIAL, face: false, id: 'antler-right-branch-1', label: 'Right lower antler branch', rotationX: -7, rotationY: 17, rotationZ: 58, roundness: 88, scaleX: .1, scaleY: .26, scaleZ: .09, shape: 'capsule', x: 70, y: -127, z: -8 },
  { ...DEER_ANTLER_MATERIAL, face: false, id: 'antler-right-branch-2', label: 'Right upper antler branch', rotationX: -8, rotationY: 13, rotationZ: 48, roundness: 88, scaleX: .09, scaleY: .22, scaleZ: .085, shape: 'capsule', x: 63, y: -156, z: -6 },
  { ...DEER_MATERIAL, face: false, id: 'ear-left', label: 'Left tall deer ear', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -5, rotationY: -13, rotationZ: -36, roundness: 94, scaleX: .23, scaleY: .41, scaleZ: .18, shape: 'teardrop', x: -72, y: -63, z: -10 },
  { ...DEER_MATERIAL, face: false, id: 'ear-right', label: 'Right tall deer ear', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -5, rotationY: 13, rotationZ: 36, roundness: 94, scaleX: .23, scaleY: .41, scaleZ: .18, shape: 'teardrop', x: 72, y: -63, z: -10 },
  { ...DEER_MATERIAL, bottomTaper: 24, face: true, id: 'primary', label: 'Long tapered deer head', roundness: 92, scaleX: .66, scaleY: .82, scaleZ: .64, shape: 'ellipse', x: 0, y: 17, z: 0 }
]

const DEER_REINDEER_BRANCH_PARTS: readonly AvatarEntityPart[] = [
  { ...DEER_ANTLER_MATERIAL, face: false, id: 'antler-left-branch-3', label: 'Left reindeer crown branch', rotationX: -9, rotationY: -15, rotationZ: -39, roundness: 90, scaleX: .085, scaleY: .2, scaleZ: .08, shape: 'capsule', x: -59, y: -179, z: -4 },
  { ...DEER_ANTLER_MATERIAL, face: false, id: 'antler-right-branch-3', label: 'Right reindeer crown branch', rotationX: -9, rotationY: 15, rotationZ: 39, roundness: 90, scaleX: .085, scaleY: .2, scaleZ: .08, shape: 'capsule', x: 59, y: -179, z: -4 }
]

const DEER_ANATOMY_PARTS = [...DEER_PARTS, ...DEER_REINDEER_BRANCH_PARTS]

const SHEEP_PARTS: readonly AvatarEntityPart[] = [
  { ...SHEEP_MATERIAL, face: false, id: 'wool-crown-left', label: 'Left wool crown', roundness: 100, scaleX: .29, scaleY: .3, scaleZ: .34, shape: 'sphere', x: -58, y: -77, z: -12 },
  { ...SHEEP_MATERIAL, face: false, id: 'wool-crown-center', label: 'Central wool crown', roundness: 100, scaleX: .33, scaleY: .32, scaleZ: .37, shape: 'sphere', x: 0, y: -91, z: -15 },
  { ...SHEEP_MATERIAL, face: false, id: 'wool-crown-right', label: 'Right wool crown', roundness: 100, scaleX: .29, scaleY: .3, scaleZ: .34, shape: 'sphere', x: 58, y: -77, z: -12 },
  { ...SHEEP_MATERIAL, face: false, id: 'wool-side-left', label: 'Left wool curl', roundness: 100, scaleX: .28, scaleY: .31, scaleZ: .34, shape: 'sphere', x: -83, y: -25, z: -10 },
  { ...SHEEP_MATERIAL, face: false, id: 'wool-side-right', label: 'Right wool curl', roundness: 100, scaleX: .28, scaleY: .31, scaleZ: .34, shape: 'sphere', x: 83, y: -25, z: -10 },
  { ...SHEEP_FACE_MATERIAL, face: false, id: 'ear-left', label: 'Left soft sheep ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -6, rotationY: -12, rotationZ: -53, roundness: 90, scaleX: .22, scaleY: .34, scaleZ: .24, shape: 'teardrop', x: -85, y: -42, z: -5 },
  { ...SHEEP_FACE_MATERIAL, face: false, id: 'ear-right', label: 'Right soft sheep ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -6, rotationY: 12, rotationZ: 53, roundness: 90, scaleX: .22, scaleY: .34, scaleZ: .24, shape: 'teardrop', x: 85, y: -42, z: -5 },
  { ...SHEEP_MATERIAL, bottomTaper: 12, face: true, id: 'primary', label: 'Soft sheep face', roundness: 100, scaleX: .68, scaleY: .73, scaleZ: .82, shape: 'ellipse', x: 0, y: 17, z: 0 }
]

const SHEEP_HORN_PARTS: readonly AvatarEntityPart[] = [
  { ...SHEEP_HORN_MATERIAL, face: false, id: 'horn-left', label: 'Left horn root', rotationX: -7, rotationY: -14, rotationZ: -47, roundness: 94, scaleX: .18, scaleY: .35, scaleZ: .22, shape: 'capsule', x: -77, y: -51, z: 12 },
  { ...SHEEP_HORN_MATERIAL, face: false, id: 'horn-left-segment-1', label: 'Left horn outer curve', rotationX: -6, rotationY: -18, rotationZ: -93, roundness: 96, scaleX: .16, scaleY: .28, scaleZ: .2, shape: 'capsule', x: -103, y: -31, z: 19 },
  { ...SHEEP_HORN_MATERIAL, face: false, id: 'horn-left-segment-2', label: 'Left horn lower curl', rotationX: -5, rotationY: -13, rotationZ: -149, roundness: 98, scaleX: .14, scaleY: .24, scaleZ: .17, shape: 'capsule', x: -98, y: -1, z: 24 },
  { ...SHEEP_HORN_MATERIAL, face: false, id: 'horn-left-segment-3', label: 'Left horn inner curl', rotationX: -4, rotationY: -8, rotationZ: -205, roundness: 100, scaleX: .12, scaleY: .19, scaleZ: .14, shape: 'capsule', x: -76, y: 10, z: 28 },
  { ...SHEEP_HORN_MATERIAL, face: false, id: 'horn-right', label: 'Right horn root', rotationX: -7, rotationY: 14, rotationZ: 47, roundness: 94, scaleX: .18, scaleY: .35, scaleZ: .22, shape: 'capsule', x: 77, y: -51, z: 12 },
  { ...SHEEP_HORN_MATERIAL, face: false, id: 'horn-right-segment-1', label: 'Right horn outer curve', rotationX: -6, rotationY: 18, rotationZ: 93, roundness: 96, scaleX: .16, scaleY: .28, scaleZ: .2, shape: 'capsule', x: 103, y: -31, z: 19 },
  { ...SHEEP_HORN_MATERIAL, face: false, id: 'horn-right-segment-2', label: 'Right horn lower curl', rotationX: -5, rotationY: 13, rotationZ: 149, roundness: 98, scaleX: .14, scaleY: .24, scaleZ: .17, shape: 'capsule', x: 98, y: -1, z: 24 },
  { ...SHEEP_HORN_MATERIAL, face: false, id: 'horn-right-segment-3', label: 'Right horn inner curl', rotationX: -4, rotationY: 8, rotationZ: 205, roundness: 100, scaleX: .12, scaleY: .19, scaleZ: .14, shape: 'capsule', x: 76, y: 10, z: 28 }
]

const SHEEP_ANATOMY_PARTS = [...SHEEP_HORN_PARTS, ...SHEEP_PARTS]

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

/** Dog ears have their own neutral geometry so breed profiles can keep their silhouette intact. */
export const DOG_EAR_SCALE_RANGE = { min: 50, max: 160 } as const
const DOG_EAR_PARTS = DOG_PARTS.filter(part => part.id === 'ear-left' || part.id === 'ear-right')

const DOG_EAR_STYLE_ATTACHMENTS = {
  floppy: { distanceX: 78, rotationZ: 30, roundness: 82, shape: 'teardrop', y: -48, z: -5 },
  'half-drop': { distanceX: 68, rotationZ: 42, roundness: 70, shape: 'teardrop', y: -60, z: -7 },
  upright: { distanceX: 60, rotationZ: -8, roundness: 50, shape: 'cone', y: -78, z: -10 }
} as const

export type AvatarDogEarStyle = keyof typeof DOG_EAR_STYLE_ATTACHMENTS

export const applyDogEarStyle = (
  parts: readonly AvatarEntityPart[],
  style: AvatarDogEarStyle
): AvatarEntityPart[] => parts.map(part => {
  if (part.id !== 'ear-left' && part.id !== 'ear-right') return part
  const attachment = DOG_EAR_STYLE_ATTACHMENTS[style]
  const side = part.id === 'ear-left' ? -1 : 1
  return {
    ...part,
    rotationZ: -side * attachment.rotationZ,
    roundness: attachment.roundness,
    shape: attachment.shape,
    x: side * attachment.distanceX,
    y: attachment.y,
    z: attachment.z
  }
})

const getDogEarNeutralAttachment = (part: AvatarEntityPart) => {
  const base = DOG_EAR_PARTS.find(candidate => candidate.id === part.id)
  if (base == null) return null
  const style = Object.values(DOG_EAR_STYLE_ATTACHMENTS).find(candidate => (
    part.shape === candidate.shape && part.roundness === candidate.roundness
  ))
  if (style == null) return base
  return {
    x: part.id === 'ear-left' ? -style.distanceX : style.distanceX,
    y: style.y
  }
}

export const applyDogEarScale = (
  parts: readonly AvatarEntityPart[],
  width?: number,
  height?: number
): AvatarEntityPart[] => parts.map(part => {
  const base = DOG_EAR_PARTS.find(candidate => candidate.id === part.id)
  if (base == null) return part
  return {
    ...part,
    ...(width == null ? {} : { scaleX: base.scaleX * width / 100 }),
    ...(height == null ? {} : { scaleY: base.scaleY * height / 100 })
  }
})

export const getDogEarScale = (parts: readonly AvatarEntityPart[]) => {
  const ears = DOG_EAR_PARTS.flatMap(base => {
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

/** Dog head dimensions remain local 3D scales instead of screen-space transforms. */
export const DOG_HEAD_SCALE_RANGE = { min: 70, max: 140 } as const
const DOG_HEAD_PART = DOG_PARTS.find(part => part.face)!

export const applyDogHeadScale = (
  parts: readonly AvatarEntityPart[],
  width?: number,
  height?: number
): AvatarEntityPart[] => {
  if (width == null && height == null) return [...parts]
  const head = parts.find(part => part.id === DOG_HEAD_PART.id && part.face)
  if (head == null) return [...parts]

  const previousWidthScale = head.scaleX / DOG_HEAD_PART.scaleX
  const previousHeightScale = head.scaleY / DOG_HEAD_PART.scaleY
  const nextWidthScale = width == null ? previousWidthScale : width / 100
  const nextHeightScale = height == null ? previousHeightScale : height / 100

  return parts.map(part => {
    if (part.id === head.id && part.face) {
      return {
        ...part,
        ...(width == null ? {} : { scaleX: DOG_HEAD_PART.scaleX * nextWidthScale }),
        ...(height == null ? {} : { scaleY: DOG_HEAD_PART.scaleY * nextHeightScale })
      }
    }

    const attachment = getDogEarNeutralAttachment(part)
    if (attachment == null) return part

    const authoredOffsetX = attachment.x - DOG_HEAD_PART.x
    const authoredOffsetY = attachment.y - DOG_HEAD_PART.y
    const currentOffsetX = part.x - head.x
    const currentOffsetY = part.y - head.y
    const usesNeutralOffsetX = Math.abs(currentOffsetX - authoredOffsetX) < .000001
    const usesNeutralOffsetY = Math.abs(currentOffsetY - authoredOffsetY) < .000001
    const normalizedOffsetX = usesNeutralOffsetX
      ? authoredOffsetX
      : currentOffsetX / previousWidthScale
    const normalizedOffsetY = usesNeutralOffsetY
      ? authoredOffsetY
      : currentOffsetY / previousHeightScale
    const repairLegacyX = usesNeutralOffsetX && Math.abs(previousWidthScale - 1) >= .000001
    const repairLegacyY = usesNeutralOffsetY && Math.abs(previousHeightScale - 1) >= .000001

    return {
      ...part,
      x: Math.abs(previousWidthScale - nextWidthScale) < .000001 && !repairLegacyX
        ? part.x
        : head.x + normalizedOffsetX * nextWidthScale,
      y: Math.abs(previousHeightScale - nextHeightScale) < .000001 && !repairLegacyY
        ? part.y
        : head.y + normalizedOffsetY * nextHeightScale
    }
  })
}

export const getDogHeadScale = (parts: readonly AvatarEntityPart[]) => {
  const head = parts.find(part => part.id === DOG_HEAD_PART.id && part.face)
  if (head == null) return { height: 100, width: 100 }
  return {
    height: Math.round(head.scaleY / DOG_HEAD_PART.scaleY * 100),
    width: Math.round(head.scaleX / DOG_HEAD_PART.scaleX * 100)
  }
}

/** Rabbit ears stay outside the head silhouette while species profiles vary their true 3D posture. */
export const RABBIT_EAR_SCALE_RANGE = { min: 55, max: 155 } as const
export const RABBIT_HEAD_SCALE_RANGE = { min: 76, max: 132 } as const
const RABBIT_EAR_PARTS = RABBIT_PARTS.filter(part => part.id === 'ear-left' || part.id === 'ear-right')
const RABBIT_HEAD_PART = RABBIT_PARTS.find(part => part.face)!
const RABBIT_EAR_STYLE_ATTACHMENTS = {
  compact: { distanceX: 48, rotationZ: -4, roundness: 100, shape: 'rounded', y: -68, z: -22 },
  dutch: { distanceX: 58, rotationZ: -11, roundness: 100, shape: 'trapezoid', y: -70, z: -20 },
  himalayan: { distanceX: 40, rotationZ: -3, roundness: 100, shape: 'trapezoid', y: -86, z: -24 },
  lionhead: { distanceX: 68, rotationZ: -18, roundness: 100, shape: 'trapezoid', y: -60, z: -18 },
  lop: { distanceX: 78, rotationZ: 48, roundness: 92, shape: 'teardrop', y: -30, z: -8 },
  spotted: { distanceX: 53, rotationZ: -14, roundness: 100, shape: 'trapezoid', y: -80, z: -21 },
  upright: { distanceX: 50, rotationZ: -8, roundness: 100, shape: 'trapezoid', y: -76, z: -22 }
} as const

export type AvatarRabbitEarStyle = keyof typeof RABBIT_EAR_STYLE_ATTACHMENTS

export const applyRabbitEarStyle = (parts: readonly AvatarEntityPart[], style: AvatarRabbitEarStyle): AvatarEntityPart[] => parts.map(part => {
  if (part.id !== 'ear-left' && part.id !== 'ear-right') return part
  const attachment = RABBIT_EAR_STYLE_ATTACHMENTS[style]
  const side = part.id === 'ear-left' ? -1 : 1
  return { ...part, rotationZ: -side * attachment.rotationZ, roundness: attachment.roundness, shape: attachment.shape, x: side * attachment.distanceX, y: attachment.y, z: attachment.z }
})

const getRabbitEarAttachment = (part: AvatarEntityPart) => {
  if (!RABBIT_EAR_PARTS.some(base => base.id === part.id)) return null
  const style = Object.values(RABBIT_EAR_STYLE_ATTACHMENTS).find(candidate => (
    candidate.shape === part.shape &&
    candidate.roundness === part.roundness &&
    Math.abs(candidate.rotationZ) === Math.abs(part.rotationZ ?? 0)
  ))
  if (style == null) return { x: part.id === 'ear-left' ? -50 : 48, y: -76 }
  return { x: part.id === 'ear-left' ? -style.distanceX : style.distanceX, y: style.y }
}

export const applyRabbitEarScale = (parts: readonly AvatarEntityPart[], width?: number, height?: number): AvatarEntityPart[] => parts.map(part => {
  const base = RABBIT_EAR_PARTS.find(candidate => candidate.id === part.id)
  if (base == null) return part
  return { ...part, ...(width == null ? {} : { scaleX: base.scaleX * width / 100 }), ...(height == null ? {} : { scaleY: base.scaleY * height / 100 }) }
})

export const getRabbitEarScale = (parts: readonly AvatarEntityPart[]) => {
  const ears = RABBIT_EAR_PARTS.flatMap(base => {
    const part = parts.find(candidate => candidate.id === base.id)
    return part == null ? [] : [{ base, part }]
  })
  if (ears.length === 0) return { height: 100, width: 100 }
  const average = (values: readonly number[]) => values.reduce((total, value) => total + value, 0) / values.length
  return { height: Math.round(average(ears.map(({ base, part }) => part.scaleY / base.scaleY * 100))), width: Math.round(average(ears.map(({ base, part }) => part.scaleX / base.scaleX * 100))) }
}

/** Scales the real rabbit head and reattaches ears to its perimeter, retaining the selected ear posture. */
export const applyRabbitHeadScale = (parts: readonly AvatarEntityPart[], width?: number, height?: number): AvatarEntityPart[] => {
  if (width == null && height == null) return [...parts]
  const head = parts.find(part => part.id === RABBIT_HEAD_PART.id && part.face)
  if (head == null) return [...parts]
  const previousWidthScale = head.scaleX / RABBIT_HEAD_PART.scaleX
  const previousHeightScale = head.scaleY / RABBIT_HEAD_PART.scaleY
  const nextWidthScale = width == null ? previousWidthScale : width / 100
  const nextHeightScale = height == null ? previousHeightScale : height / 100
  return parts.map(part => {
    if (part.id === head.id && part.face) return { ...part, ...(width == null ? {} : { scaleX: RABBIT_HEAD_PART.scaleX * nextWidthScale }), ...(height == null ? {} : { scaleY: RABBIT_HEAD_PART.scaleY * nextHeightScale }) }
    const attachment = getRabbitEarAttachment(part)
    if (attachment == null) return part
    const currentOffsetX = part.x - head.x
    const currentOffsetY = part.y - head.y
    const authoredOffsetX = attachment.x - RABBIT_HEAD_PART.x
    const authoredOffsetY = attachment.y - RABBIT_HEAD_PART.y
    const normalizedOffsetX = Math.abs(currentOffsetX - authoredOffsetX) < .000001 ? authoredOffsetX : currentOffsetX / previousWidthScale
    const normalizedOffsetY = Math.abs(currentOffsetY - authoredOffsetY) < .000001 ? authoredOffsetY : currentOffsetY / previousHeightScale
    return { ...part, x: head.x + normalizedOffsetX * nextWidthScale, y: head.y + normalizedOffsetY * nextHeightScale }
  })
}

export const getRabbitHeadScale = (parts: readonly AvatarEntityPart[]) => {
  const head = parts.find(part => part.id === RABBIT_HEAD_PART.id && part.face)
  if (head == null) return { height: 100, width: 100 }
  return { height: Math.round(head.scaleY / RABBIT_HEAD_PART.scaleY * 100), width: Math.round(head.scaleX / RABBIT_HEAD_PART.scaleX * 100) }
}

/** Bear heads use the same perimeter attachment rule as rabbits, with round, species-specific ears. */
export const BEAR_EAR_SCALE_RANGE = { min: 55, max: 155 } as const
export const BEAR_HEAD_SCALE_RANGE = { min: 76, max: 132 } as const
const BEAR_EAR_PARTS = BEAR_PARTS.filter(part => part.id === 'ear-left' || part.id === 'ear-right')
const BEAR_HEAD_PART = BEAR_PARTS.find(part => part.face)!
const BEAR_EAR_STYLE_ATTACHMENTS = {
  compact: { distanceX: 48, rotationZ: 0, roundness: 100, shape: 'ellipse', y: -62, z: -18 },
  koala: { distanceX: 82, rotationZ: 8, roundness: 100, shape: 'ellipse', y: -50, z: -10 },
  panda: { distanceX: 64, rotationZ: 0, roundness: 100, shape: 'ellipse', y: -68, z: -18 },
  pointed: { distanceX: 68, rotationZ: -12, roundness: 52, shape: 'rounded', y: -72, z: -16 },
  teddy: { distanceX: 58, rotationZ: 0, roundness: 100, shape: 'ellipse', y: -70, z: -18 },
  wombat: { distanceX: 76, rotationZ: 4, roundness: 100, shape: 'ellipse', y: -44, z: -8 }
} as const
export type AvatarBearEarStyle = keyof typeof BEAR_EAR_STYLE_ATTACHMENTS
export const applyBearEarStyle = (parts: readonly AvatarEntityPart[], style: AvatarBearEarStyle): AvatarEntityPart[] => parts.map(part => {
  if (part.id !== 'ear-left' && part.id !== 'ear-right') return part
  const attachment = BEAR_EAR_STYLE_ATTACHMENTS[style]
  const side = part.id === 'ear-left' ? -1 : 1
  return { ...part, rotationZ: -side * attachment.rotationZ, roundness: attachment.roundness, shape: attachment.shape, x: side * attachment.distanceX, y: attachment.y, z: attachment.z }
})
const getBearEarAttachment = (part: AvatarEntityPart) => {
  if (!BEAR_EAR_PARTS.some(base => base.id === part.id)) return null
  const style = Object.values(BEAR_EAR_STYLE_ATTACHMENTS).find(candidate => candidate.shape === part.shape && candidate.roundness === part.roundness && Math.abs(candidate.rotationZ) === Math.abs(part.rotationZ ?? 0))
  if (style == null) return { x: part.id === 'ear-left' ? -58 : 58, y: -72 }
  return { x: part.id === 'ear-left' ? -style.distanceX : style.distanceX, y: style.y }
}
export const applyBearEarScale = (parts: readonly AvatarEntityPart[], width?: number, height?: number): AvatarEntityPart[] => parts.map(part => {
  const base = BEAR_EAR_PARTS.find(candidate => candidate.id === part.id)
  if (base == null) return part
  return { ...part, ...(width == null ? {} : { scaleX: base.scaleX * width / 100 }), ...(height == null ? {} : { scaleY: base.scaleY * height / 100 }) }
})
export const getBearEarScale = (parts: readonly AvatarEntityPart[]) => {
  const ears = BEAR_EAR_PARTS.flatMap(base => { const part = parts.find(candidate => candidate.id === base.id); return part == null ? [] : [{ base, part }] })
  if (ears.length === 0) return { height: 100, width: 100 }
  const average = (values: readonly number[]) => values.reduce((total, value) => total + value, 0) / values.length
  return { height: Math.round(average(ears.map(({ base, part }) => part.scaleY / base.scaleY * 100))), width: Math.round(average(ears.map(({ base, part }) => part.scaleX / base.scaleX * 100))) }
}
export const applyBearHeadScale = (parts: readonly AvatarEntityPart[], width?: number, height?: number): AvatarEntityPart[] => {
  if (width == null && height == null) return [...parts]
  const head = parts.find(part => part.id === BEAR_HEAD_PART.id && part.face)
  if (head == null) return [...parts]
  const previousWidthScale = head.scaleX / BEAR_HEAD_PART.scaleX
  const previousHeightScale = head.scaleY / BEAR_HEAD_PART.scaleY
  const nextWidthScale = width == null ? previousWidthScale : width / 100
  const nextHeightScale = height == null ? previousHeightScale : height / 100
  return parts.map(part => {
    if (part.id === head.id && part.face) return { ...part, ...(width == null ? {} : { scaleX: BEAR_HEAD_PART.scaleX * nextWidthScale }), ...(height == null ? {} : { scaleY: BEAR_HEAD_PART.scaleY * nextHeightScale }) }
    const attachment = getBearEarAttachment(part)
    if (attachment == null) return part
    const authoredOffsetX = attachment.x - BEAR_HEAD_PART.x
    const authoredOffsetY = attachment.y - BEAR_HEAD_PART.y
    const currentOffsetX = part.x - head.x
    const currentOffsetY = part.y - head.y
    const normalizedOffsetX = Math.abs(currentOffsetX - authoredOffsetX) < .000001 ? authoredOffsetX : currentOffsetX / previousWidthScale
    const normalizedOffsetY = Math.abs(currentOffsetY - authoredOffsetY) < .000001 ? authoredOffsetY : currentOffsetY / previousHeightScale
    return { ...part, x: head.x + normalizedOffsetX * nextWidthScale, y: head.y + normalizedOffsetY * nextHeightScale }
  })
}
export const getBearHeadScale = (parts: readonly AvatarEntityPart[]) => {
  const head = parts.find(part => part.id === BEAR_HEAD_PART.id && part.face)
  if (head == null) return { height: 100, width: 100 }
  return { height: Math.round(head.scaleY / BEAR_HEAD_PART.scaleY * 100), width: Math.round(head.scaleX / BEAR_HEAD_PART.scaleX * 100) }
}

interface AvatarAnimalPartScaleControls {
  readonly applyEarScale: (parts: readonly AvatarEntityPart[], width?: number, height?: number) => AvatarEntityPart[]
  readonly applyHeadScale: (parts: readonly AvatarEntityPart[], width?: number, height?: number) => AvatarEntityPart[]
  readonly getEarScale: (parts: readonly AvatarEntityPart[]) => { readonly height: number; readonly width: number }
  readonly getHeadScale: (parts: readonly AvatarEntityPart[]) => { readonly height: number; readonly width: number }
}

interface AvatarAnimalAppendageControls<Style extends string> {
  readonly applySize: (parts: readonly AvatarEntityPart[], size: number) => AvatarEntityPart[]
  readonly applyStyle: (parts: readonly AvatarEntityPart[], style: Style) => AvatarEntityPart[]
  readonly getSize: (parts: readonly AvatarEntityPart[]) => number
}

const createAvatarAnimalPartScaleControls = (
  authoredParts: readonly AvatarEntityPart[],
  earIds: readonly string[] = ['ear-left', 'ear-right'],
  options: { readonly synchronizeDepth?: boolean } = {}
): AvatarAnimalPartScaleControls => {
  const authoredHead = authoredParts.find(part => part.face)!
  const authoredPartsById = new Map(authoredParts.map(part => [part.id, part]))
  const authoredEars = authoredParts.filter(part => earIds.includes(part.id))

  return {
    applyEarScale: (parts, width, height) => parts.map(part => {
      const authoredEar = authoredEars.find(ear => ear.id === part.id)
      if (authoredEar == null) return part
      return {
        ...part,
        ...(width == null ? {} : { scaleX: authoredEar.scaleX * width / 100 }),
        ...(height == null ? {} : { scaleY: authoredEar.scaleY * height / 100 })
      }
    }),
    applyHeadScale: (parts, width, height) => {
      if (width == null && height == null) return [...parts]
      const head = parts.find(part => part.id === authoredHead.id && part.face)
      if (head == null) return [...parts]

      const previousWidthScale = head.scaleX / authoredHead.scaleX
      const previousHeightScale = head.scaleY / authoredHead.scaleY
      const nextWidthScale = width == null ? previousWidthScale : width / 100
      const nextHeightScale = height == null ? previousHeightScale : height / 100
      const authoredHeadDepth = authoredHead.scaleZ ?? Math.min(authoredHead.scaleX, authoredHead.scaleY)
      const previousDepthScale = (head.scaleZ ?? authoredHeadDepth) / authoredHeadDepth
      const nextDepthScale = Math.sqrt(nextWidthScale * nextHeightScale)

      return parts.map(part => {
        if (part.id === head.id && part.face) {
          return {
            ...part,
            ...(width == null ? {} : { scaleX: authoredHead.scaleX * nextWidthScale }),
            ...(height == null ? {} : { scaleY: authoredHead.scaleY * nextHeightScale }),
            ...(options.synchronizeDepth ? { scaleZ: authoredHeadDepth * nextDepthScale } : {})
          }
        }

        const authoredPart = authoredPartsById.get(part.id)
        if (authoredPart == null) return part

        const authoredOffsetX = authoredPart.x - authoredHead.x
        const authoredOffsetY = authoredPart.y - authoredHead.y
        const currentOffsetX = part.x - head.x
        const currentOffsetY = part.y - head.y
        const normalizedOffsetX = Math.abs(currentOffsetX - authoredOffsetX) < .000001
          ? authoredOffsetX
          : currentOffsetX / previousWidthScale
        const normalizedOffsetY = Math.abs(currentOffsetY - authoredOffsetY) < .000001
          ? authoredOffsetY
          : currentOffsetY / previousHeightScale

        return {
          ...part,
          x: head.x + normalizedOffsetX * nextWidthScale,
          y: head.y + normalizedOffsetY * nextHeightScale,
          ...(options.synchronizeDepth
            ? {
                ...(part.scaleZ == null ? {} : { scaleZ: part.scaleZ / previousDepthScale * nextDepthScale }),
                z: head.z + (part.z - head.z) / previousDepthScale * nextDepthScale
              }
            : {})
        }
      })
    },
    getEarScale: parts => {
      const ears = authoredEars.flatMap(authoredEar => {
        const part = parts.find(candidate => candidate.id === authoredEar.id)
        return part == null ? [] : [{ authoredEar, part }]
      })
      if (ears.length === 0) return { height: 100, width: 100 }
      const average = (values: readonly number[]) => values.reduce((total, value) => total + value, 0) / values.length
      return {
        height: Math.round(average(ears.map(({ authoredEar, part }) => part.scaleY / authoredEar.scaleY * 100))),
        width: Math.round(average(ears.map(({ authoredEar, part }) => part.scaleX / authoredEar.scaleX * 100)))
      }
    },
    getHeadScale: parts => {
      const head = parts.find(part => part.id === authoredHead.id && part.face)
      if (head == null) return { height: 100, width: 100 }
      return {
        height: Math.round(head.scaleY / authoredHead.scaleY * 100),
        width: Math.round(head.scaleX / authoredHead.scaleX * 100)
      }
    }
  }
}

const createAvatarAnimalAppendageControls = <Style extends string>(
  authoredParts: readonly AvatarEntityPart[],
  prefix: string,
  styles: Readonly<Record<Style, readonly string[]>>
): AvatarAnimalAppendageControls<Style> => {
  const authoredHead = authoredParts.find(part => part.face)!
  const authoredAppendages = authoredParts.filter(part => part.id.startsWith(`${prefix}-`))
  const authoredById = new Map(authoredAppendages.map(part => [part.id, part]))
  const rootId = (part: AvatarEntityPart) => `${prefix}-${part.id.startsWith(`${prefix}-left`) ? 'left' : 'right'}`
  const clampScale = (value: number) => Math.min(Math.max(value, AVATAR_ENTITY_RANGES.scaleX.min), AVATAR_ENTITY_RANGES.scaleX.max)

  return {
    applySize: (parts, size) => {
      const factor = Math.max(size, 0) / 100
      const head = parts.find(part => part.id === authoredHead.id && part.face)
      const headWidthScale = head == null ? 1 : head.scaleX / authoredHead.scaleX
      const headHeightScale = head == null ? 1 : head.scaleY / authoredHead.scaleY

      return parts.map(part => {
        const authoredPart = authoredById.get(part.id)
        if (authoredPart == null) return part
        const root = parts.find(candidate => candidate.id === rootId(part))
        const authoredRoot = authoredById.get(rootId(part))
        const isRoot = part.id === rootId(part)

        return {
          ...part,
          scaleX: clampScale(authoredPart.scaleX * factor),
          scaleY: clampScale(authoredPart.scaleY * factor),
          ...(authoredPart.scaleZ == null ? {} : { scaleZ: clampScale(authoredPart.scaleZ * factor) }),
          ...(isRoot || root == null || authoredRoot == null
            ? {}
            : {
                x: root.x + (authoredPart.x - authoredRoot.x) * factor * headWidthScale,
                y: root.y + (authoredPart.y - authoredRoot.y) * factor * headHeightScale
              })
        }
      })
    },
    applyStyle: (parts, style) => {
      const included = new Set(styles[style] ?? [])
      const existing = new Map(parts.map(part => [part.id, part]))
      const head = parts.find(part => part.id === authoredHead.id && part.face)
      const headWidthScale = head == null ? 1 : head.scaleX / authoredHead.scaleX
      const headHeightScale = head == null ? 1 : head.scaleY / authoredHead.scaleY
      const nextAppendages = authoredAppendages.flatMap(authoredPart => {
        if (!included.has(authoredPart.id)) return []
        const previous = existing.get(authoredPart.id)
        if (previous != null) return [previous]
        return [{
          ...authoredPart,
          ...(head == null
            ? {}
            : {
                x: head.x + (authoredPart.x - authoredHead.x) * headWidthScale,
                y: head.y + (authoredPart.y - authoredHead.y) * headHeightScale
              })
        }]
      })
      const remaining = parts.filter(part => !part.id.startsWith(`${prefix}-`))
      return [...nextAppendages, ...remaining]
    },
    getSize: parts => {
      const root = authoredAppendages.find(part => part.id === `${prefix}-left` || part.id === `${prefix}-right`)
      if (root == null) return 100
      const current = parts.find(part => part.id === root.id)
      return current == null ? 100 : Math.round(current.scaleY / root.scaleY * 100)
    }
  }
}

export const FOX_EAR_SCALE_RANGE = { min: 55, max: 195 } as const
export const FOX_HEAD_SCALE_RANGE = { min: 74, max: 134 } as const
export const FOX_HEAD_TAPER_RANGE = { min: 15, max: 78 } as const
export const FOX_MARKING_SCALE_RANGE = { min: 60, max: 145 } as const

export type AvatarFoxEarStyle = 'pointed' | 'rounded' | 'fennec'

export interface AvatarFoxSurfaceMarkingStyle {
  readonly cheekColor?: string
  readonly cheekScale?: number
  readonly innerEarColor?: string
  readonly innerEarScale?: number
}

const FOX_HEAD_PART = FOX_PARTS.find(part => part.face)!
const FOX_EAR_STYLE_ATTACHMENTS = {
  fennec: { distanceX: 73, rotationZ: 18, roundness: 36, y: -87, z: -12 },
  pointed: { distanceX: 68, rotationZ: 13, roundness: 28, y: -81, z: -16 },
  rounded: { distanceX: 62, rotationZ: 9, roundness: 78, y: -72, z: -14 }
} as const satisfies Record<AvatarFoxEarStyle, {
  readonly distanceX: number
  readonly rotationZ: number
  readonly roundness: number
  readonly y: number
  readonly z: number
}>

const foxPartScaleControls = createAvatarAnimalPartScaleControls(
  FOX_PARTS,
  ['fox-ear-left', 'fox-ear-right']
)

export const applyFoxEarScale = foxPartScaleControls.applyEarScale
export const applyFoxHeadScale = foxPartScaleControls.applyHeadScale
export const getFoxEarScale = foxPartScaleControls.getEarScale
export const getFoxHeadScale = foxPartScaleControls.getHeadScale

export const applyFoxEarStyle = (
  parts: readonly AvatarEntityPart[],
  style: AvatarFoxEarStyle
): AvatarEntityPart[] => {
  const attachment = FOX_EAR_STYLE_ATTACHMENTS[style]
  const head = parts.find(part => part.id === FOX_HEAD_PART.id && part.face)
  const widthScale = head == null ? 1 : head.scaleX / FOX_HEAD_PART.scaleX
  const heightScale = head == null ? 1 : head.scaleY / FOX_HEAD_PART.scaleY

  return parts.map(part => {
    if (part.id !== 'fox-ear-left' && part.id !== 'fox-ear-right') return part
    const side = part.id === 'fox-ear-left' ? -1 : 1

    return {
      ...part,
      rotationZ: side * attachment.rotationZ,
      roundness: attachment.roundness,
      shape: 'cone',
      x: (head?.x ?? FOX_HEAD_PART.x) + side * attachment.distanceX * widthScale,
      y: (head?.y ?? FOX_HEAD_PART.y) + (attachment.y - FOX_HEAD_PART.y) * heightScale,
      z: (head?.z ?? FOX_HEAD_PART.z) + attachment.z
    }
  })
}

export const getFoxEarStyle = (parts: readonly AvatarEntityPart[]): AvatarFoxEarStyle => {
  const ear = parts.find(part => part.id === 'fox-ear-left' || part.id === 'fox-ear-right')
  if (ear == null) return 'pointed'
  if ((ear.roundness ?? 0) >= 60) return 'rounded'
  return Math.abs(ear.rotationZ ?? 0) >= 16 ? 'fennec' : 'pointed'
}

export const applyFoxHeadTaper = (
  parts: readonly AvatarEntityPart[],
  taper: number
): AvatarEntityPart[] => {
  if (!Number.isFinite(taper)) return [...parts]
  const bottomTaper = Math.min(Math.max(taper, FOX_HEAD_TAPER_RANGE.min), FOX_HEAD_TAPER_RANGE.max)
  return parts.map(part => (
    part.id === FOX_HEAD_PART.id && part.face ? { ...part, bottomTaper } : part
  ))
}

export const getFoxHeadTaper = (parts: readonly AvatarEntityPart[]) => (
  parts.find(part => part.id === FOX_HEAD_PART.id && part.face)?.bottomTaper ??
  FOX_HEAD_PART.bottomTaper ?? 0
)

export const createFoxSurfaceDecals = (
  style: AvatarFoxSurfaceMarkingStyle = {}
): AvatarSurfaceDecal[] => FOX_PRESET_SCENE.surfaceDecals.map(decal => {
  const isCheek = decal.id.startsWith('fox-cheek-')
  const requestedColor = isCheek ? style.cheekColor : style.innerEarColor
  const requestedScale = isCheek ? style.cheekScale : style.innerEarScale
  const scale = typeof requestedScale === 'number' && Number.isFinite(requestedScale)
    ? Math.min(Math.max(requestedScale, FOX_MARKING_SCALE_RANGE.min), FOX_MARKING_SCALE_RANGE.max)
    : 100

  return {
    ...decal,
    ...(typeof requestedColor === 'string' && /^#[\da-f]{6}$/i.test(requestedColor)
      ? { color: requestedColor }
      : {}),
    height: Math.round(decal.height * scale / 100),
    width: Math.round(decal.width * scale / 100)
  }
})

export const HAMSTER_EAR_SCALE_RANGE = { min: 55, max: 155 } as const
export const HAMSTER_HEAD_SCALE_RANGE = { min: 76, max: 132 } as const
const hamsterPartScaleControls = createAvatarAnimalPartScaleControls(HAMSTER_PARTS)
export const applyHamsterEarScale = hamsterPartScaleControls.applyEarScale
export const applyHamsterHeadScale = hamsterPartScaleControls.applyHeadScale
export const getHamsterEarScale = hamsterPartScaleControls.getEarScale
export const getHamsterHeadScale = hamsterPartScaleControls.getHeadScale

export const CAPYBARA_EAR_SCALE_RANGE = { min: 55, max: 150 } as const
export const CAPYBARA_HEAD_SCALE_RANGE = { min: 76, max: 134 } as const
const capybaraPartScaleControls = createAvatarAnimalPartScaleControls(CAPYBARA_PARTS)
export const applyCapybaraEarScale = capybaraPartScaleControls.applyEarScale
export const applyCapybaraHeadScale = capybaraPartScaleControls.applyHeadScale
export const getCapybaraEarScale = capybaraPartScaleControls.getEarScale
export const getCapybaraHeadScale = capybaraPartScaleControls.getHeadScale

export const OTTER_EAR_SCALE_RANGE = { min: 55, max: 150 } as const
export const OTTER_HEAD_SCALE_RANGE = { min: 76, max: 134 } as const
const otterPartScaleControls = createAvatarAnimalPartScaleControls(OTTER_PARTS)
export const applyOtterEarScale = otterPartScaleControls.applyEarScale
export const applyOtterHeadScale = otterPartScaleControls.applyHeadScale
export const getOtterEarScale = otterPartScaleControls.getEarScale
export const getOtterHeadScale = otterPartScaleControls.getHeadScale

export const PIG_EAR_SCALE_RANGE = { min: 55, max: 155 } as const
export const PIG_HEAD_SCALE_RANGE = { min: 76, max: 134 } as const
const pigPartScaleControls = createAvatarAnimalPartScaleControls(PIG_PARTS)
export const applyPigEarScale = pigPartScaleControls.applyEarScale
export const applyPigHeadScale = pigPartScaleControls.applyHeadScale
export const getPigEarScale = pigPartScaleControls.getEarScale
export const getPigHeadScale = pigPartScaleControls.getHeadScale

export const DEER_EAR_SCALE_RANGE = { min: 60, max: 155 } as const
export const DEER_HEAD_SCALE_RANGE = { min: 76, max: 132 } as const
export const DEER_ANTLER_SIZE_RANGE = { min: 60, max: 145 } as const
export type AvatarDeerAntlerStyle = 'none' | 'spike' | 'forked' | 'branched' | 'reindeer'
const deerPartScaleControls = createAvatarAnimalPartScaleControls(DEER_ANATOMY_PARTS)
const deerAntlerControls = createAvatarAnimalAppendageControls<AvatarDeerAntlerStyle>(
  DEER_ANATOMY_PARTS,
  'antler',
  {
    none: [],
    spike: ['antler-left', 'antler-right'],
    forked: ['antler-left', 'antler-left-branch-1', 'antler-right', 'antler-right-branch-1'],
    branched: ['antler-left', 'antler-left-branch-1', 'antler-left-branch-2', 'antler-right', 'antler-right-branch-1', 'antler-right-branch-2'],
    reindeer: [
      'antler-left', 'antler-left-branch-1', 'antler-left-branch-2', 'antler-left-branch-3',
      'antler-right', 'antler-right-branch-1', 'antler-right-branch-2', 'antler-right-branch-3'
    ]
  }
)
export const applyDeerEarScale = deerPartScaleControls.applyEarScale
export const applyDeerHeadScale = deerPartScaleControls.applyHeadScale
export const getDeerEarScale = deerPartScaleControls.getEarScale
export const getDeerHeadScale = deerPartScaleControls.getHeadScale
export const applyDeerAntlerStyle = deerAntlerControls.applyStyle
export const applyDeerAntlerSize = deerAntlerControls.applySize
export const getDeerAntlerSize = deerAntlerControls.getSize

const ANIMAL_SURFACE_MARKING_SHAPES = [
  'ellipse',
  'face-mask',
  'rounded',
  'rounded-triangle'
] as const

const createAnimalSurfaceDecals = (
  authored: AvatarSurfaceDecal,
  style: AvatarAnimalSurfaceMarkingStyle
): AvatarSurfaceDecal[] => {
  const bounded = (
    value: number | undefined,
    fallback: number,
    range: { readonly max: number; readonly min: number }
  ) => typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Math.max(value, range.min), range.max)
    : fallback

  return [{
    ...authored,
    ...(typeof style.color === 'string' && /^#[\da-f]{6}$/i.test(style.color)
      ? { color: style.color }
      : {}),
    height: bounded(style.height, authored.height, AVATAR_SURFACE_DECAL_RANGES.height),
    opacity: bounded(style.opacity, authored.opacity, AVATAR_SURFACE_DECAL_RANGES.opacity),
    shape: style.shape != null && ANIMAL_SURFACE_MARKING_SHAPES.includes(style.shape)
      ? style.shape
      : authored.shape,
    width: bounded(style.width, authored.width, AVATAR_SURFACE_DECAL_RANGES.width),
    x: bounded(style.x, authored.x, AVATAR_SURFACE_DECAL_RANGES.x),
    y: bounded(style.y, authored.y, AVATAR_SURFACE_DECAL_RANGES.y)
  }]
}

export const createOtterSurfaceDecals = (
  style: AvatarOtterSurfaceMarkingStyle = {}
): AvatarSurfaceDecal[] => createAnimalSurfaceDecals(OTTER_FACE_MASK_DECAL, style)

export const createDeerSurfaceDecals = (
  style: AvatarDeerSurfaceMarkingStyle = {}
): AvatarSurfaceDecal[] => createAnimalSurfaceDecals(DEER_FACE_MASK_DECAL, style)

export const SHEEP_EAR_SCALE_RANGE = { min: 60, max: 150 } as const
export const SHEEP_HEAD_SCALE_RANGE = { min: 76, max: 134 } as const
export const SHEEP_HORN_SIZE_RANGE = { min: 60, max: 145 } as const
export type AvatarSheepHornStyle = 'none' | 'curved' | 'curled' | 'straight'

export const createSheepSurfaceDecals = (
  style: AvatarSheepSurfaceMarkingStyle = {}
): AvatarSurfaceDecal[] => createAnimalSurfaceDecals(SHEEP_FACE_MASK_DECAL, style)

const normalizeSurfaceMarkedAnimalEntityParts = (
  parts: readonly AvatarEntityPart[]
): AvatarEntityPart[] => parts.filter(part => part.id !== 'muzzle' || part.face)

export const normalizeOtterEntityParts = (
  parts: readonly AvatarEntityPart[]
): AvatarEntityPart[] => normalizeSurfaceMarkedAnimalEntityParts(parts)

export const normalizeDeerEntityParts = (
  parts: readonly AvatarEntityPart[]
): AvatarEntityPart[] => normalizeSurfaceMarkedAnimalEntityParts(parts)

export const normalizeSheepEntityParts = (
  parts: readonly AvatarEntityPart[]
): AvatarEntityPart[] => {
  const hasLegacyFloatingMuzzle = parts.some(part => part.id === 'muzzle' && !part.face)
  const normalized = normalizeSurfaceMarkedAnimalEntityParts(parts)
  if (!hasLegacyFloatingMuzzle) return normalized

  const authoredHead = SHEEP_PARTS.find(part => part.face)!
  const head = normalized.find(part => part.id === authoredHead.id && part.face)
  if (head == null) return normalized

  const depthScale = Math.sqrt(
    head.scaleX / authoredHead.scaleX * head.scaleY / authoredHead.scaleY
  )
  const authoredById = new Map(SHEEP_ANATOMY_PARTS.map(part => [part.id, part]))
  const clampDepth = (depth: number) => Math.min(
    Math.max(depth, AVATAR_ENTITY_RANGES.scaleZ.min),
    AVATAR_ENTITY_RANGES.scaleZ.max
  )

  return normalized.map(part => {
    const authored = authoredById.get(part.id)
    if (authored?.scaleZ == null) return part
    if (part.face) return { ...part, scaleZ: clampDepth(authored.scaleZ * depthScale) }

    const partSizeScale = Math.sqrt(
      part.scaleX / authored.scaleX * part.scaleY / authored.scaleY
    )

    return {
      ...part,
      scaleZ: clampDepth(authored.scaleZ * partSizeScale * depthScale),
      z: head.z + (authored.z - authoredHead.z) * depthScale
    }
  })
}

const sheepPartScaleControls = createAvatarAnimalPartScaleControls(
  SHEEP_ANATOMY_PARTS,
  ['ear-left', 'ear-right'],
  { synchronizeDepth: true }
)
const sheepHornControls = createAvatarAnimalAppendageControls<AvatarSheepHornStyle>(
  SHEEP_ANATOMY_PARTS,
  'horn',
  {
    none: [],
    straight: ['horn-left', 'horn-right'],
    curved: ['horn-left', 'horn-left-segment-1', 'horn-right', 'horn-right-segment-1'],
    curled: [
      'horn-left', 'horn-left-segment-1', 'horn-left-segment-2', 'horn-left-segment-3',
      'horn-right', 'horn-right-segment-1', 'horn-right-segment-2', 'horn-right-segment-3'
    ]
  }
)
export const applySheepEarScale = sheepPartScaleControls.applyEarScale
export const applySheepHeadScale = sheepPartScaleControls.applyHeadScale
export const getSheepEarScale = sheepPartScaleControls.getEarScale
export const getSheepHeadScale = sheepPartScaleControls.getHeadScale
export const applySheepHornStyle = (
  parts: readonly AvatarEntityPart[],
  style: AvatarSheepHornStyle
): AvatarEntityPart[] => {
  const next = sheepHornControls.applyStyle(parts, style)
  if (style !== 'straight') return next
  const head = next.find(part => part.face)
  const authoredHead = SHEEP_PARTS.find(part => part.face)!
  const widthScale = head == null ? 1 : head.scaleX / authoredHead.scaleX
  const heightScale = head == null ? 1 : head.scaleY / authoredHead.scaleY
  return next.map(part => {
    if (part.id !== 'horn-left' && part.id !== 'horn-right') return part
    const side = part.id === 'horn-left' ? -1 : 1
    return {
      ...part,
      rotationZ: side * 12,
      x: (head?.x ?? 0) + side * 59 * widthScale,
      y: (head?.y ?? authoredHead.y) - 104 * heightScale
    }
  })
}
export const applySheepHornSize = sheepHornControls.applySize
export const getSheepHornSize = sheepHornControls.getSize

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
  const attachmentMaterialId = /^(antler|horn)-(left|right)(?:-branch-|-segment-)/.exec(part.id)
  const material = palette.entityMaterials?.[part.id] ?? (
    attachmentMaterialId == null
      ? undefined
      : palette.entityMaterials?.[`${attachmentMaterialId[1]}-${attachmentMaterialId[2]}`]
  )
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
  if (preset === 'rabbit') return cloneParts(RABBIT_PARTS)
  if (preset === 'fox') return cloneParts(FOX_PARTS)
  if (preset === 'hamster') return cloneParts(HAMSTER_PARTS)
  if (preset === 'capybara') return cloneParts(CAPYBARA_PARTS)
  if (preset === 'otter') return cloneParts(OTTER_PARTS)
  if (preset === 'pig') return cloneParts(PIG_PARTS)
  if (preset === 'deer') return cloneParts(DEER_PARTS)
  if (preset === 'sheep') return cloneParts(SHEEP_PARTS)
  if (preset === 'bun') return cloneParts(BUN_PARTS)
  return []
}

export const getAvatarEntityPresetFaceStyle = (preset: AvatarEntityPreset): AvatarFaceStyle | null => {
  if (preset === 'cloud') return { ...CLOUD_FACE_STYLE }
  if (preset === 'sun') return { ...SUN_FACE_STYLE }
  if (preset === 'cat') return { ...CAT_FACE_STYLE }
  if (preset === 'dog') return { ...DOG_FACE_STYLE }
  if (preset === 'bear') return { ...BEAR_FACE_STYLE }
  if (preset === 'rabbit') return { ...RABBIT_FACE_STYLE }
  if (preset === 'fox') return { ...FOX_FACE_STYLE }
  if (preset === 'hamster') return { ...HAMSTER_FACE_STYLE }
  if (preset === 'capybara') return { ...CAPYBARA_FACE_STYLE }
  if (preset === 'otter') return { ...OTTER_FACE_STYLE }
  if (preset === 'pig') return { ...PIG_FACE_STYLE }
  if (preset === 'deer') return { ...DEER_FACE_STYLE }
  if (preset === 'sheep') return { ...SHEEP_FACE_STYLE }
  if (preset === 'bun') return { ...BUN_FACE_STYLE, eyeHighlight: { ...BUN_FACE_STYLE.eyeHighlight } }
  return null
}

export const resolveAvatarEntityPresetFaceStyle = (
  preset: AvatarEntityPreset,
  override?: AvatarEntityFaceStyleOverride
): AvatarFaceStyle | null => {
  const base = getAvatarEntityPresetFaceStyle(preset)
  if (base == null || override == null) return base

  const next: Record<string, unknown> = { ...base }
  Object.entries(AVATAR_FACE_RANGES).forEach(([key, range]) => {
    const candidate = override[key as keyof AvatarEntityFaceStyleOverride]
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) return
    next[key] = Math.min(Math.max(candidate, range.min), range.max)
  })

  for (const key of ['mouthEnabled', 'noseEnabled'] as const) {
    if (typeof override[key] === 'boolean') next[key] = override[key]
  }
  if (override.eyeShape === 'ellipse' || override.eyeShape === 'rounded') next.eyeShape = override.eyeShape
  if (override.noseShape === 'ellipse' || override.noseShape === 'inverted-triangle' || override.noseShape === 'rounded') {
    next.noseShape = override.noseShape
  }
  if (
    override.mouthShape === 'curve' || override.mouthShape === 'ellipse' ||
    override.mouthShape === 'rounded' || override.mouthShape === 'rounded-triangle'
  ) next.mouthShape = override.mouthShape

  if (override.eyeHighlight != null) {
    const eyeHighlight: Record<string, unknown> = { ...base.eyeHighlight }
    Object.entries(AVATAR_EYE_HIGHLIGHT_RANGES).forEach(([key, range]) => {
      const candidate = override.eyeHighlight?.[key as keyof NonNullable<AvatarEntityFaceStyleOverride['eyeHighlight']>]
      if (typeof candidate !== 'number' || !Number.isFinite(candidate)) return
      eyeHighlight[key] = Math.min(Math.max(candidate, range.min), range.max)
    })
    if (typeof override.eyeHighlight.enabled === 'boolean') eyeHighlight.enabled = override.eyeHighlight.enabled
    if (typeof override.eyeHighlight.color === 'string' && /^#[\da-f]{6}$/i.test(override.eyeHighlight.color)) {
      eyeHighlight.color = override.eyeHighlight.color
    }
    next.eyeHighlight = eyeHighlight
  }

  return resolveAvatarFaceStyle(next as unknown as AvatarFaceStyle)
}

const ENTITY_PRESET_SCENES: Partial<Record<AvatarEntityPreset, AvatarEntityPresetScene>> = {
  bear: BEAR_PRESET_SCENE,
  bun: BUN_PRESET_SCENE,
  capybara: CAPYBARA_PRESET_SCENE,
  cat: CAT_PRESET_SCENE,
  cloud: CLOUD_PRESET_SCENE,
  deer: DEER_PRESET_SCENE,
  dog: DOG_PRESET_SCENE,
  fox: FOX_PRESET_SCENE,
  hamster: HAMSTER_PRESET_SCENE,
  otter: OTTER_PRESET_SCENE,
  pig: PIG_PRESET_SCENE,
  rabbit: RABBIT_PRESET_SCENE,
  sheep: SHEEP_PRESET_SCENE,
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
  part.occlusionPole ?? null,
  part.bottomTaper ?? null
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
          : fallback?.occlusionPole,
        ...(item[24] == null
          ? {}
          : {
              bottomTaper: finite(
                item[24],
                fallback?.bottomTaper ?? 0,
                AVATAR_ENTITY_RANGES.bottomTaper.min,
                AVATAR_ENTITY_RANGES.bottomTaper.max
              )
            })
      }
    })
    const normalizedParts = preset === 'otter'
      ? normalizeOtterEntityParts(parts)
      : preset === 'deer'
        ? normalizeDeerEntityParts(parts)
        : preset === 'sheep'
          ? normalizeSheepEntityParts(parts)
          : parts
    return normalizedParts.length === 0 && parsed.length > 0 ? defaults : normalizedParts
  } catch {
    return defaults
  }
}

export const parseAvatarEntityPreset = (value: string | null): AvatarEntityPreset => {
  return AVATAR_ENTITY_PRESETS.includes(value as AvatarEntityPreset) ? value as AvatarEntityPreset : 'custom'
}
