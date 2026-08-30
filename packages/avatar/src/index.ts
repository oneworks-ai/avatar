import { AVATAR_PALETTES, type AvatarPalette } from './catalog.js'

export * from './catalog.js'

const deepFreeze = <T>(value: T): T => {
  if (value == null || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  Object.freeze(value)
  return value
}

export const AVATAR_DEFINITION_SCHEMA = 'oneworks.avatar' as const
export const AVATAR_DEFINITION_VERSION = 1 as const
export const AVATAR_BACKGROUND_STYLES = deepFreeze(['solid', 'gradient'] as const)
export const AVATAR_CAMERA_FRAMES = deepFreeze(['square', 'rounded', 'circle'] as const)
export const AVATAR_CAMERA_BACKGROUND_PRESETS = deepFreeze([
  '#111315',
  '#f2f0eb',
  '#24334a',
  '#3f201c',
  '#173d35',
  '#382641',
  '#ff766c',
  '#0e4fe7',
  '#f2bd4f',
  '#7568e7',
  '#f6b8cf',
  '#56d6cc',
  '#c9e76c',
  '#87bfff',
  '#f08c46',
  '#d9c8ff',
  '#efe5cc',
  '#8ec5a4'
] as const)
export const AVATAR_SEED_FIELD_PATHS = deepFreeze({
  alpacaEarHeight: 'scene.entity.alpacaEarHeight',
  alpacaEarWidth: 'scene.entity.alpacaEarWidth',
  alpacaHeadHeight: 'scene.entity.alpacaHeadHeight',
  alpacaHeadWidth: 'scene.entity.alpacaHeadWidth',
  backgroundStyle: 'scene.appearance.backgroundStyle',
  beaverEarHeight: 'scene.entity.beaverEarHeight',
  beaverEarWidth: 'scene.entity.beaverEarWidth',
  beaverHeadHeight: 'scene.entity.beaverHeadHeight',
  beaverHeadWidth: 'scene.entity.beaverHeadWidth',
  beaverToothSize: 'scene.entity.beaverToothSize',
  beaverToothStyle: 'scene.entity.beaverToothStyle',
  cameraBackground: 'scene.camera.background',
  cameraFrame: 'scene.camera.frame',
  capybaraEarHeight: 'scene.entity.capybaraEarHeight',
  capybaraEarWidth: 'scene.entity.capybaraEarWidth',
  capybaraHeadHeight: 'scene.entity.capybaraHeadHeight',
  capybaraHeadWidth: 'scene.entity.capybaraHeadWidth',
  catEarHeight: 'scene.entity.catEarHeight',
  catEarWidth: 'scene.entity.catEarWidth',
  chinchillaEarHeight: 'scene.entity.chinchillaEarHeight',
  chinchillaEarWidth: 'scene.entity.chinchillaEarWidth',
  chinchillaHeadHeight: 'scene.entity.chinchillaHeadHeight',
  chinchillaHeadWidth: 'scene.entity.chinchillaHeadWidth',
  chickBeakSize: 'scene.entity.chickBeakSize',
  chickBeakStyle: 'scene.entity.chickBeakStyle',
  chickCrestSize: 'scene.entity.chickCrestSize',
  chickCrestStyle: 'scene.entity.chickCrestStyle',
  chickHeadHeight: 'scene.entity.chickHeadHeight',
  chickHeadWidth: 'scene.entity.chickHeadWidth',
  cowEarHeight: 'scene.entity.cowEarHeight',
  cowEarWidth: 'scene.entity.cowEarWidth',
  cowForelockStyle: 'scene.entity.cowForelockStyle',
  cowHeadHeight: 'scene.entity.cowHeadHeight',
  cowHeadWidth: 'scene.entity.cowHeadWidth',
  cowHornSize: 'scene.entity.cowHornSize',
  cowHornStyle: 'scene.entity.cowHornStyle',
  dogEarHeight: 'scene.entity.dogEarHeight',
  dogEarWidth: 'scene.entity.dogEarWidth',
  dogHeadHeight: 'scene.entity.dogHeadHeight',
  dogHeadWidth: 'scene.entity.dogHeadWidth',
  duckBillSize: 'scene.entity.duckBillSize',
  duckBillStyle: 'scene.entity.duckBillStyle',
  duckHeadHeight: 'scene.entity.duckHeadHeight',
  duckHeadWidth: 'scene.entity.duckHeadWidth',
  deerAntlerSize: 'scene.entity.deerAntlerSize',
  deerAntlerStyle: 'scene.entity.deerAntlerStyle',
  deerEarHeight: 'scene.entity.deerEarHeight',
  deerEarWidth: 'scene.entity.deerEarWidth',
  deerHeadHeight: 'scene.entity.deerHeadHeight',
  deerHeadWidth: 'scene.entity.deerHeadWidth',
  foxEarHeight: 'scene.entity.foxEarHeight',
  foxEarStyle: 'scene.entity.foxEarStyle',
  foxEarWidth: 'scene.entity.foxEarWidth',
  foxHeadHeight: 'scene.entity.foxHeadHeight',
  foxHeadTaper: 'scene.entity.foxHeadTaper',
  foxHeadWidth: 'scene.entity.foxHeadWidth',
  ferretEarHeight: 'scene.entity.ferretEarHeight',
  ferretEarWidth: 'scene.entity.ferretEarWidth',
  ferretHeadHeight: 'scene.entity.ferretHeadHeight',
  ferretHeadWidth: 'scene.entity.ferretHeadWidth',
  guineaPigEarHeight: 'scene.entity.guineaPigEarHeight',
  guineaPigEarWidth: 'scene.entity.guineaPigEarWidth',
  guineaPigHeadHeight: 'scene.entity.guineaPigHeadHeight',
  guineaPigHeadWidth: 'scene.entity.guineaPigHeadWidth',
  gooseBillSize: 'scene.entity.gooseBillSize',
  gooseBillStyle: 'scene.entity.gooseBillStyle',
  gooseHeadHeight: 'scene.entity.gooseHeadHeight',
  gooseHeadWidth: 'scene.entity.gooseHeadWidth',
  hamsterEarHeight: 'scene.entity.hamsterEarHeight',
  hamsterEarWidth: 'scene.entity.hamsterEarWidth',
  hamsterHeadHeight: 'scene.entity.hamsterHeadHeight',
  hamsterHeadWidth: 'scene.entity.hamsterHeadWidth',
  hedgehogEarHeight: 'scene.entity.hedgehogEarHeight',
  hedgehogEarWidth: 'scene.entity.hedgehogEarWidth',
  hedgehogHeadHeight: 'scene.entity.hedgehogHeadHeight',
  hedgehogHeadWidth: 'scene.entity.hedgehogHeadWidth',
  hedgehogSpineSize: 'scene.entity.hedgehogSpineSize',
  hedgehogSpineStyle: 'scene.entity.hedgehogSpineStyle',
  lionEarHeight: 'scene.entity.lionEarHeight',
  lionEarWidth: 'scene.entity.lionEarWidth',
  lionHeadHeight: 'scene.entity.lionHeadHeight',
  lionHeadWidth: 'scene.entity.lionHeadWidth',
  lionManeSize: 'scene.entity.lionManeSize',
  lionManeStyle: 'scene.entity.lionManeStyle',
  monkeyEarHeight: 'scene.entity.monkeyEarHeight',
  monkeyEarWidth: 'scene.entity.monkeyEarWidth',
  monkeyHeadHeight: 'scene.entity.monkeyHeadHeight',
  monkeyHeadWidth: 'scene.entity.monkeyHeadWidth',
  otterEarHeight: 'scene.entity.otterEarHeight',
  otterEarWidth: 'scene.entity.otterEarWidth',
  otterHeadHeight: 'scene.entity.otterHeadHeight',
  otterHeadWidth: 'scene.entity.otterHeadWidth',
  owlBeakSize: 'scene.entity.owlBeakSize',
  owlBeakStyle: 'scene.entity.owlBeakStyle',
  owlHeadHeight: 'scene.entity.owlHeadHeight',
  owlHeadWidth: 'scene.entity.owlHeadWidth',
  owlTuftSize: 'scene.entity.owlTuftSize',
  owlTuftStyle: 'scene.entity.owlTuftStyle',
  parrotBeakSize: 'scene.entity.parrotBeakSize',
  parrotBeakStyle: 'scene.entity.parrotBeakStyle',
  parrotHeadHeight: 'scene.entity.parrotHeadHeight',
  parrotHeadWidth: 'scene.entity.parrotHeadWidth',
  pigEarHeight: 'scene.entity.pigEarHeight',
  pigEarWidth: 'scene.entity.pigEarWidth',
  pigHeadHeight: 'scene.entity.pigHeadHeight',
  pigHeadWidth: 'scene.entity.pigHeadWidth',
  penguinBeakSize: 'scene.entity.penguinBeakSize',
  penguinBeakStyle: 'scene.entity.penguinBeakStyle',
  penguinHeadHeight: 'scene.entity.penguinHeadHeight',
  penguinHeadWidth: 'scene.entity.penguinHeadWidth',
  bearEarHeight: 'scene.entity.bearEarHeight',
  bearEarWidth: 'scene.entity.bearEarWidth',
  bearHeadHeight: 'scene.entity.bearHeadHeight',
  bearHeadWidth: 'scene.entity.bearHeadWidth',
  rabbitEarHeight: 'scene.entity.rabbitEarHeight',
  rabbitEarWidth: 'scene.entity.rabbitEarWidth',
  rabbitHeadHeight: 'scene.entity.rabbitHeadHeight',
  rabbitHeadWidth: 'scene.entity.rabbitHeadWidth',
  sealEarHeight: 'scene.entity.sealEarHeight',
  sealEarWidth: 'scene.entity.sealEarWidth',
  sealHeadHeight: 'scene.entity.sealHeadHeight',
  sealHeadWidth: 'scene.entity.sealHeadWidth',
  sheepEarHeight: 'scene.entity.sheepEarHeight',
  sheepEarWidth: 'scene.entity.sheepEarWidth',
  sheepHeadHeight: 'scene.entity.sheepHeadHeight',
  sheepHeadWidth: 'scene.entity.sheepHeadWidth',
  sheepHornSize: 'scene.entity.sheepHornSize',
  sheepHornStyle: 'scene.entity.sheepHornStyle',
  squirrelEarHeight: 'scene.entity.squirrelEarHeight',
  squirrelEarWidth: 'scene.entity.squirrelEarWidth',
  squirrelHeadHeight: 'scene.entity.squirrelHeadHeight',
  squirrelHeadWidth: 'scene.entity.squirrelHeadWidth',
  squirrelTailSize: 'scene.entity.squirrelTailSize',
  tigerEarHeight: 'scene.entity.tigerEarHeight',
  tigerEarWidth: 'scene.entity.tigerEarWidth',
  tigerHeadHeight: 'scene.entity.tigerHeadHeight',
  tigerHeadWidth: 'scene.entity.tigerHeadWidth',
  coatPatternAlgorithm: 'scene.appearance.coatPattern.algorithm',
  coatPatternBreakup: 'scene.appearance.coatPattern.breakup',
  coatPatternContrast: 'scene.appearance.coatPattern.contrast',
  coatPatternDensity: 'scene.appearance.coatPattern.density',
  coatPatternJitter: 'scene.appearance.coatPattern.jitter',
  coatPatternLightPatchLength: 'scene.appearance.coatPattern.lightPatchLength',
  coatPatternLightPatchOffsetY: 'scene.appearance.coatPattern.lightPatchOffsetY',
  coatPatternLightPatchShape: 'scene.appearance.coatPattern.lightPatchShape',
  coatPatternLightPatchWidth: 'scene.appearance.coatPattern.lightPatchWidth',
  coatPatternSeed: 'scene.appearance.coatPattern.seed',
  coatPatternSymmetry: 'scene.appearance.coatPattern.symmetry',
  coatPatternThickness: 'scene.appearance.coatPattern.thickness',
  palette: 'scene.appearance.paletteId',
  viewPose: 'scene.view.pose'
} as const)
export const AVATAR_ANIMATION_MIN_SEGMENT_MS = 100
export const AVATAR_ANIMATION_MAX_SEGMENT_MS = 8000
export const AVATAR_COLOR_GRADE_RANGES = deepFreeze(
  {
    brightness: { max: 1.8, min: .35 },
    saturation: { max: 2, min: 0 },
    tintAmount: { max: 1, min: 0 },
    tintB: { max: 255, min: 0 },
    tintG: { max: 255, min: 0 },
    tintR: { max: 255, min: 0 }
  } as const
)
export const AVATAR_EYE_HIGHLIGHT_RANGES = deepFreeze(
  {
    offsetX: { max: 35, min: -35 },
    offsetY: { max: 35, min: -35 },
    opacity: { max: 100, min: 0 },
    size: { max: 50, min: 8 }
  } as const
)
export const AVATAR_FACE_RANGES = deepFreeze(
  {
    eyeRoundness: { max: 100, min: 0 },
    gap: { max: 100, min: 0 },
    height: { max: 112, min: 1 },
    leftEyeHeight: { max: 112, min: 1 },
    leftEyeWidth: { max: 76, min: 1 },
    leftEyeRotation: { max: 90, min: -90 },
    mouthCurve: { max: 100, min: -100 },
    mouthHeight: { max: 48, min: 4 },
    mouthRotation: { max: 180, min: -180 },
    mouthWidth: { max: 100, min: 12 },
    mouthY: { max: 90, min: 24 },
    noseHeight: { max: 48, min: 6 },
    noseRotation: { max: 180, min: -180 },
    noseWidth: { max: 36, min: 6 },
    noseY: { max: 50, min: -10 },
    rotation: { max: 90, min: -90 },
    rightEyeHeight: { max: 112, min: 1 },
    rightEyeWidth: { max: 76, min: 1 },
    rightEyeRotation: { max: 90, min: -90 },
    width: { max: 76, min: 1 }
  } as const
)
export const AVATAR_ANIMATION_FACE_RANGES = AVATAR_FACE_RANGES
export const AVATAR_VIEW_RANGES = deepFreeze(
  {
    positionX: { max: 230, min: -230 },
    positionY: { max: 230, min: -230 },
    scale: { max: 2.4, min: .35 }
  } as const
)
export const AVATAR_SEEDED_VIEW_POSE = deepFreeze(
  {
    maxPitch: Math.PI / 10,
    maxPositionX: 120,
    maxYaw: Math.PI / 3,
    pitchJitter: Math.PI / 36,
    positionY: 72,
    pseudoDepth: 360,
    scale: 1.72,
    yawJitter: Math.PI / 36
  } as const
)
export const AVATAR_ENTITY_RANGES = deepFreeze(
  {
    bottomTaper: { max: 100, min: 0 },
    occlusionAmount: { max: 100, min: 0 },
    roundness: { max: 100, min: 0 },
    scaleX: { max: 1.5, min: .08 },
    scaleY: { max: 1.5, min: .08 },
    scaleZ: { max: 1.5, min: .08 },
    topScale: { max: 1.2, min: .4 }
  } as const
)
export const AVATAR_ANIMATION_PART_SCALE_RANGE = deepFreeze(
  { max: AVATAR_ENTITY_RANGES.scaleX.max, min: .01 } as const
)
export const AVATAR_LIGHTING_RANGES = deepFreeze(
  {
    azimuth: { max: 180, min: -180 },
    distance: { max: 100, min: 0 },
    elevation: { max: 80, min: -80 },
    gridDensity: { max: 400, min: 25 }
  } as const
)
export const AVATAR_OUTLINE_RANGES = deepFreeze(
  {
    opacity: { max: 100, min: 0 },
    width: { max: 20, min: 1 }
  } as const
)
export const AVATAR_PIXEL_EFFECT_RANGES = deepFreeze(
  {
    blockSize: { max: 32, min: 2 },
    paletteSizes: [8, 16, 32, 64]
  } as const
)
export const AVATAR_SHADOW_RANGES = deepFreeze(
  {
    avatar: {
      direction: { max: 180, min: -180 },
      distance: { max: 40, min: 0 },
      opacity: { max: 100, min: 0 },
      softness: { max: 40, min: 0 }
    },
    face: {
      direction: { max: 180, min: -180 },
      distance: { max: 24, min: 0 },
      opacity: { max: 100, min: 0 },
      softness: { max: 12, min: 0 }
    },
    frame: {
      direction: { max: 180, min: -180 },
      distance: { max: 40, min: 0 },
      opacity: { max: 100, min: 0 },
      softness: { max: 48, min: 0 }
    }
  } as const
)
export const AVATAR_SURFACE_DECAL_RANGES = deepFreeze(
  {
    bend: { max: 60, min: -60 },
    height: { max: 340, min: 2 },
    opacity: { max: 100, min: 0 },
    rotation: { max: 180, min: -180 },
    width: { max: 240, min: 2 },
    x: { max: 180, min: -180 },
    y: { max: 180, min: -180 }
  } as const
)
export const AVATAR_COAT_PATTERN_RANGES = deepFreeze({
  breakup: { max: 100, min: 0 },
  contrast: { max: 100, min: 20 },
  density: { max: 100, min: 0 },
  jitter: { max: 100, min: 0 },
  lightPatchLength: { max: 200, min: 60 },
  lightPatchOffsetY: { max: 50, min: -50 },
  lightPatchWidth: { max: 200, min: 60 },
  symmetry: { max: 100, min: 0 },
  thickness: { max: 140, min: 50 }
} as const)
export const AVATAR_TABBY_COMPATIBLE_PALETTE_IDS = deepFreeze([
  'tabby',
  'white',
  'gold',
  'cocoa',
  'siamese',
  'british-shorthair',
  'russian-blue',
  'orange-tabby'
] as const)
export const AVATAR_DOG_COMPATIBLE_PALETTE_IDS = deepFreeze([
  'shiba-inu',
  'husky',
  'corgi',
  'golden-retriever',
  'border-collie',
  'dalmatian'
] as const)
export const AVATAR_RABBIT_COMPATIBLE_PALETTE_IDS = deepFreeze([
  'holland-lop',
  'netherland-dwarf',
  'dutch-rabbit',
  'himalayan-rabbit',
  'lionhead-rabbit',
  'english-spot'
] as const)
export const AVATAR_BEAR_COMPATIBLE_PALETTE_IDS = deepFreeze([
  'brown-bear', 'polar-bear', 'asian-black-bear', 'giant-panda', 'spectacled-bear', 'sun-bear',
  'red-panda', 'koala', 'raccoon', 'wombat', 'teddy-bear'
] as const)

export type AvatarBackgroundStyle = 'gradient' | 'solid'
export type AvatarBodyShape =
  | 'capsule'
  | 'cone'
  | 'diamond'
  | 'ellipse'
  | 'frustum'
  | 'half-cone'
  | 'rounded'
  | 'square'
  | 'sphere'
  | 'teardrop'
  | 'trapezoid'
export type AvatarCameraFrame = 'circle' | 'rounded' | 'square'
export type AvatarCoatPatternAlgorithm = 'broken-mackerel' | 'classic' | 'mackerel' | 'random' | 'spotted'
export type AvatarCoatPatternLightPatchShape = 'ellipse' | 'face-mask' | 'rounded'
export const AVATAR_ENTITY_PRESET_VALUES = deepFreeze([
  'alpaca', 'bear', 'beaver', 'bun', 'capybara', 'cat', 'cloud', 'cow', 'custom',
  'chick', 'chinchilla', 'deer', 'dog', 'duck', 'ferret', 'fox', 'goose', 'hamster', 'hedgehog', 'lion', 'monkey', 'otter', 'pig', 'rabbit',
  'guinea-pig', 'owl', 'parrot', 'penguin', 'seal', 'sheep', 'squirrel', 'sun', 'tiger'
] as const)
export type AvatarEntityPreset = (typeof AVATAR_ENTITY_PRESET_VALUES)[number]
export type AvatarBeaverToothStyle = 'none' | 'paired'
export type AvatarChickBeakStyle = 'pointed' | 'short'
export type AvatarChickCrestStyle = 'comb' | 'fluffy' | 'none'
export type AvatarCowForelockStyle = 'highland' | 'none' | 'soft'
export type AvatarCowHornStyle = 'highland' | 'none' | 'short'
export type AvatarDeerAntlerStyle = 'branched' | 'forked' | 'none' | 'reindeer' | 'spike'
export type AvatarDuckBillStyle = 'broad' | 'flat'
export type AvatarFoxEarStyle = 'fennec' | 'pointed' | 'rounded'
export type AvatarGooseBillStyle = 'broad' | 'short'
export type AvatarHedgehogSpineStyle = 'full' | 'none' | 'short'
export type AvatarLionManeStyle = 'full' | 'juvenile' | 'none'
export type AvatarPenguinBeakStyle = 'short' | 'tapered'
export type AvatarOwlBeakStyle = 'hooked' | 'short'
export type AvatarOwlTuftStyle = 'none' | 'paired'
export type AvatarParrotBeakStyle = 'hooked' | 'macaw'
export type AvatarSheepHornStyle = 'curled' | 'curved' | 'none' | 'straight'
export type AvatarAnimalSurfaceMarkingShape = 'ellipse' | 'face-mask' | 'rounded' | 'rounded-triangle'

export interface AvatarAnimalSurfaceMarkingStyle {
  readonly color?: string
  readonly height?: number
  readonly opacity?: number
  readonly shape?: AvatarAnimalSurfaceMarkingShape
  readonly width?: number
  readonly x?: number
  readonly y?: number
}
export type AvatarAlpacaSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarBeaverSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarGuineaPigSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly innerEarColor?: string
}
export type AvatarGooseSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly billColor?: string
  readonly nostrilColor?: string
  readonly seamColor?: string
}
export type AvatarCapybaraSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarChickSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly beakColor?: string
  readonly combColor?: string
  readonly nostrilColor?: string
  readonly seamColor?: string
}
export type AvatarChinchillaSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly innerEarColor?: string
}
export type AvatarCowSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarHamsterSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly innerEarColor?: string
}
export type AvatarHedgehogSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarLionSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarMonkeySurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly innerEarColor?: string
  readonly nostrilColor?: string
}
export type AvatarPenguinSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly beakColor?: string
  readonly nostrilColor?: string
  readonly seamColor?: string
}
export type AvatarOwlSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly beakColor?: string
  readonly eyeRingColor?: string
  readonly nostrilColor?: string
  readonly seamColor?: string
  readonly tuftColor?: string
}
export type AvatarParrotSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly beakColor?: string
  readonly nostrilColor?: string
  readonly seamColor?: string
}
export type AvatarDeerSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarDuckSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly billColor?: string
  readonly nostrilColor?: string
  readonly seamColor?: string
}
export type AvatarFerretSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle & {
  readonly innerEarColor?: string
  readonly maskColor?: string
}
export type AvatarOtterSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarSealSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarSheepSurfaceMarkingShape = AvatarAnimalSurfaceMarkingShape
export type AvatarSheepSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarSquirrelSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarTigerSurfaceMarkingStyle = AvatarAnimalSurfaceMarkingStyle
export type AvatarEyeShape = 'chevron' | 'ellipse' | 'rounded'
export type AvatarSurfaceDecalSide = 'back' | 'face' | 'front' | 'left' | 'right'
export type AvatarSurfaceDecalShape =
  | 'claude-spark'
  | 'ellipse'
  | 'face-mask'
  | 'radial-pleats'
  | 'rounded'
  | 'rounded-triangle'
  | 'tapered-band'
export type AvatarInteractionMode = 'move' | 'rotate'
export type AvatarMouthShape = 'curve' | 'ellipse' | 'rounded' | 'rounded-triangle'
export type AvatarNoseShape = 'ellipse' | 'inverted-triangle' | 'rounded'
export type AvatarPlaybackMode = 'loop' | 'once'
export type AvatarPixelDithering = 'none' | 'ordered'
export type AvatarPixelSampling = 'center' | 'dominant' | 'median' | 'slic'
export type AvatarAnimationAnchor = 'absolute' | 'relative'
export type AvatarAnimationEasing = 'ease-in' | 'ease-in-out' | 'ease-out' | 'linear'

export interface AvatarColorGrade {
  readonly brightness: number
  readonly saturation: number
  readonly tintAmount: number
  readonly tintB: number
  readonly tintG: number
  readonly tintR: number
}

export interface AvatarView {
  readonly pitch: number
  readonly positionX: number
  readonly positionY: number
  readonly roll: number
  readonly scale: number
  readonly yaw: number
}

export interface AvatarFace {
  readonly eyeHighlight: AvatarEyeHighlight
  readonly eyeRoundness: number
  readonly eyeShape: AvatarEyeShape
  readonly gap: number
  readonly height: number
  readonly leftEyeHeight?: number
  readonly leftEyeShape?: AvatarEyeShape
  readonly leftEyeWidth?: number
  readonly leftEyeRotation: number
  readonly mouthCurve: number
  readonly mouthEnabled: boolean
  readonly mouthHeight: number
  readonly mouthRotation: number
  readonly mouthShape: AvatarMouthShape
  readonly mouthWidth: number
  readonly mouthY: number
  readonly noseEnabled: boolean
  readonly noseHeight: number
  readonly noseRotation: number
  readonly noseShape: AvatarNoseShape
  readonly noseWidth: number
  readonly noseY: number
  readonly rotation: number
  readonly rightEyeHeight?: number
  readonly rightEyeShape?: AvatarEyeShape
  readonly rightEyeWidth?: number
  readonly rightEyeRotation: number
  readonly width: number
}

export interface AvatarEyeHighlight {
  readonly color: string
  readonly enabled: boolean
  readonly offsetX: number
  readonly offsetY: number
  readonly opacity: number
  readonly size: number
}

export type AvatarFaceOverride = Partial<Omit<AvatarFace, 'eyeHighlight'>> & {
  readonly eyeHighlight?: Partial<AvatarEyeHighlight>
}

export interface AvatarSurfaceDecal {
  readonly bend?: number
  readonly color: string
  readonly height: number
  readonly id: string
  readonly label: string
  readonly opacity: number
  readonly rotation: number
  readonly side?: AvatarSurfaceDecalSide
  readonly shape: AvatarSurfaceDecalShape
  readonly targetPartId: string | null
  readonly width: number
  readonly x: number
  readonly y: number
}

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

export type AvatarEntityPartTransform = Partial<Pick<AvatarEntityPart,
  | 'rotationZ'
  | 'scaleX'
  | 'scaleY'
  | 'scaleZ'
  | 'x'
  | 'y'
  | 'z'
>>

export type AvatarEntityPartTransforms = Readonly<Record<string, AvatarEntityPartTransform>>

export interface AvatarEntityPartShapeMorph {
  readonly fromShape: AvatarBodyShape
  readonly progress: number
  readonly toShape: AvatarBodyShape
}

export type AvatarEntityPartShapeMorphs = Readonly<Record<string, AvatarEntityPartShapeMorph>>

export type AvatarAnimationShapeKind = 'ellipse' | 'exclamation' | 'rounded-rect'

export interface AvatarAnimationShape {
  readonly color: string
  readonly height: number
  readonly id: string
  readonly kind: AvatarAnimationShapeKind
  readonly opacity: number
  readonly rotation: number
  readonly roundness: number
  readonly width: number
  readonly x: number
  readonly y: number
}

export interface AvatarAnimationEntityPart {
  readonly composition?: 'co-compiled' | 'independent-depth'
  readonly opacity: number
  readonly part: AvatarEntityPart
  readonly transform?: AvatarEntityPartTransform
}

export interface AvatarShadow {
  readonly color?: string
  readonly direction: number
  readonly distance: number
  readonly opacity: number
  readonly softness: number
}

export interface AvatarOutline {
  readonly color: string
  readonly opacity: number
  readonly width: number
}

export interface AvatarPixelEffect {
  readonly blockSize: number
  readonly dithering: AvatarPixelDithering
  readonly enabled: boolean
  readonly paletteSize: 8 | 16 | 32 | 64
  readonly sampling: AvatarPixelSampling
}

export interface AvatarCoatPattern {
  readonly algorithm: AvatarCoatPatternAlgorithm
  readonly algorithmSeed: string
  readonly breakup: number
  readonly contrast: number
  readonly density: number
  readonly enabled: boolean
  readonly jitter: number
  readonly lightPatchLength?: number
  readonly lightPatchOffsetY?: number
  readonly lightPatchShape?: AvatarCoatPatternLightPatchShape
  readonly lightPatchWidth?: number
  readonly seed: string
  readonly symmetry: number
  readonly thickness: number
}

export interface AvatarScene {
  readonly appearance: {
    readonly backgroundStyle: AvatarBackgroundStyle
    readonly bodyShape: AvatarBodyShape
    readonly bottomTaper?: number
    readonly coatPattern?: AvatarCoatPattern
    readonly paletteId: string
  }
  readonly camera: {
    readonly background: string | 'transparent'
    readonly frame: AvatarCameraFrame
    readonly frameShadow: AvatarShadow
    readonly showFrameShadow: boolean
    readonly size: 128 | 256 | 512
  }
  readonly effects: {
    readonly avatarShadow: AvatarShadow
    readonly colorGrade: AvatarColorGrade
    readonly faceShadow: AvatarShadow
    readonly outline: AvatarOutline
    readonly pixelate?: AvatarPixelEffect
    readonly showAvatarShadow: boolean
    readonly showFaceShadow: boolean
    readonly showOutline: boolean
  }
  readonly decals: readonly AvatarSurfaceDecal[]
  readonly entity: {
    readonly parts: readonly AvatarEntityPart[]
    readonly preset: AvatarEntityPreset
  }
  readonly face: AvatarFace
  readonly interactionMode: AvatarInteractionMode
  readonly lighting: {
    readonly azimuth: number
    readonly distance: number
    readonly elevation: number
    readonly gridDensity: number
    readonly enabled: boolean
  }
  readonly view: AvatarView
}

export interface AvatarScenePatch {
  readonly auxiliaryParts?: readonly AvatarAnimationEntityPart[]
  readonly auxiliaryShapes?: readonly AvatarAnimationShape[]
  readonly colorGrade?: Partial<AvatarColorGrade>
  readonly face?: Partial<AvatarFace>
  readonly partShapeMorphs?: AvatarEntityPartShapeMorphs
  readonly partTransforms?: AvatarEntityPartTransforms
  readonly release?: readonly AvatarAnimationResourceClaim[]
  readonly view?: Partial<Pick<AvatarView, 'pitch' | 'positionX' | 'positionY' | 'yaw'>>
}

export interface AvatarAnimationKeyframe {
  readonly atMs: number
  readonly easing?: AvatarAnimationEasing
  readonly patch: AvatarScenePatch
}

export type AvatarAnimationResourceClaim = string
export type AvatarAnimationParameterValue = boolean | number | string
export type AvatarAnimationParameterValues = Readonly<Record<string, AvatarAnimationParameterValue>>

interface AvatarAnimationParameterBase {
  readonly advanced?: boolean
  readonly id: string
  readonly label: string
}

export interface AvatarAnimationBooleanParameter extends AvatarAnimationParameterBase {
  readonly default: boolean
  readonly type: 'boolean'
}

export interface AvatarAnimationColorParameter extends AvatarAnimationParameterBase {
  readonly binding?: {
    readonly partId: string
    readonly type: 'auxiliary-part-material'
  }
  readonly default: string
  readonly type: 'color'
}

export interface AvatarAnimationEnumParameter extends AvatarAnimationParameterBase {
  readonly default: string
  readonly options: readonly {
    readonly label: string
    readonly value: string
  }[]
  readonly type: 'enum'
}

export interface AvatarAnimationNumberParameter extends AvatarAnimationParameterBase {
  readonly default: number
  readonly max: number
  readonly min: number
  readonly step?: number
  readonly type: 'number'
}

export type AvatarAnimationParameter =
  | AvatarAnimationBooleanParameter
  | AvatarAnimationColorParameter
  | AvatarAnimationEnumParameter
  | AvatarAnimationNumberParameter

export interface AvatarAnimationClip {
  readonly anchor: AvatarAnimationAnchor
  readonly blendMode?: 'replace'
  readonly durationMs: number
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly label?: string
  readonly parameterValues?: AvatarAnimationParameterValues
  readonly parameters?: readonly AvatarAnimationParameter[]
  readonly playback: AvatarPlaybackMode
  readonly resourceClaims?: readonly AvatarAnimationResourceClaim[]
}

export interface AvatarAnimationGroup {
  readonly clips: Readonly<Record<string, AvatarAnimationClip>>
  readonly defaultClip?: string
  readonly label?: string
}

export interface AvatarAnimationLibrary {
  readonly groups: Readonly<Record<string, AvatarAnimationGroup>>
  readonly id: string
  readonly label?: string
}

export interface AvatarAnimationRef {
  readonly clipId: string
  readonly groupId: string
  readonly libraryId: string
}

export interface AvatarSeedConfiguration {
  readonly fields: readonly string[]
  readonly profileId?: string
  readonly seed: string
  readonly version: 1
}

export interface AvatarDefinitionV1 {
  readonly animations?: AvatarAnimationLibrary
  readonly metadata?: {
    readonly createdAt?: string
    readonly generation?: AvatarSeedConfiguration
    readonly id?: string
    readonly name?: string
    readonly updatedAt?: string
  }
  readonly scene: AvatarScene
  readonly schema: typeof AVATAR_DEFINITION_SCHEMA
  readonly version: typeof AVATAR_DEFINITION_VERSION
}

export type AvatarDefinition = AvatarDefinitionV1

export interface CreateSeededAvatarDefinitionOptions {
  readonly name?: string
  readonly seed: string
}

export interface ResolvedAvatarAnimationFrame {
  readonly auxiliaryParts?: readonly AvatarAnimationEntityPart[]
  readonly auxiliaryShapes?: readonly AvatarAnimationShape[]
  readonly elapsedMs: number
  readonly finished: boolean
  readonly partShapeMorphs?: AvatarEntityPartShapeMorphs
  readonly partTransforms?: AvatarEntityPartTransforms
  readonly patch: AvatarScenePatch
  readonly progress: number
  readonly resourceWeights: Readonly<Record<AvatarAnimationResourceClaim, number>>
  readonly scene: AvatarScene
  readonly trackResourceWeights?: Readonly<
    Record<string, Readonly<Record<AvatarAnimationResourceClaim, number>>>
  >
  readonly trackWrites?: Readonly<Record<string, readonly AvatarAnimationResourceClaim[]>>
  readonly writes: readonly AvatarAnimationResourceClaim[]
}

export interface AvatarAnimationResolvedInstance {
  readonly frame: ResolvedAvatarAnimationFrame
  readonly instanceId: string
  readonly resourceClaims?: readonly AvatarAnimationResourceClaim[]
}

export interface AvatarAnimationTrack {
  readonly clip: AvatarAnimationClip
  readonly elapsedMs: number
  readonly muted?: boolean
  readonly parameterValues?: AvatarAnimationParameterValues
  readonly preserveAuxiliaryPartIds?: boolean
  readonly solo?: boolean
  readonly speed?: number
  readonly trackId: string
  readonly weight?: number
}

export interface AvatarAnimationTimelineEnvelope {
  readonly fadeInMs?: number
  readonly fadeOutMs?: number
}

export interface AvatarAnimationTimelineInlineSource {
  readonly clip: AvatarAnimationClip
  readonly type: 'inline'
  readonly version: 1
}

export interface AvatarAnimationTimelinePresetSource {
  readonly fallback: 'skip'
  readonly presetId: string
  readonly presetVersion: number
  readonly type: 'preset'
}

export type AvatarAnimationTimelineClipSource =
  | AvatarAnimationTimelineInlineSource
  | AvatarAnimationTimelinePresetSource

export interface AvatarAnimationTimelineFrameLoop {
  readonly endFrameIndex: number
  readonly iterations: number | 'infinite'
  readonly startFrameIndex: number
}

export interface AvatarAnimationTimelineFrameSequence {
  readonly firstFrameIndex: number
  readonly lastFrameIndex: number
  readonly loop?: AvatarAnimationTimelineFrameLoop
}

export interface AvatarAnimationTimelineClipInstance {
  readonly durationMs: number
  readonly envelope?: AvatarAnimationTimelineEnvelope
  readonly frameSequence?: AvatarAnimationTimelineFrameSequence
  readonly instanceId: string
  readonly parameterValues?: AvatarAnimationParameterValues
  readonly playback?: AvatarPlaybackMode
  readonly playbackRate: number
  readonly preserveAuxiliaryPartIds?: boolean
  readonly source: AvatarAnimationTimelineClipSource
  readonly sourceOffsetMs: number
  readonly startMs: number
  readonly weight: number
}

export interface AvatarAnimationTimelineTrack {
  readonly clips: readonly AvatarAnimationTimelineClipInstance[]
  readonly muted?: boolean
  readonly name?: string
  readonly solo?: boolean
  readonly trackId: string
  readonly weight?: number
}

export interface AvatarAnimationTimeline {
  readonly durationMs: number
  readonly tracks: readonly AvatarAnimationTimelineTrack[]
  readonly version: 1
}

export interface AvatarAnimationTimelineActiveClip {
  readonly instanceId: string
  readonly resourceWeights: Readonly<Record<AvatarAnimationResourceClaim, number>>
  readonly sourceTimeMs: number
  readonly trackId: string
  readonly writes: readonly AvatarAnimationResourceClaim[]
}

export interface ResolvedAvatarAnimationTimelineFrame extends ResolvedAvatarAnimationFrame {
  readonly activeClips: readonly AvatarAnimationTimelineActiveClip[]
  readonly timelineTimeMs: number
  readonly unresolvedClipIds: readonly string[]
}

export type AvatarAnimationTimelineEditFailure = 'conflict' | 'invalid' | 'not-found'

export type AvatarAnimationTimelineEditResult =
  | {
      readonly conflictInstanceId?: string
      readonly reason: AvatarAnimationTimelineEditFailure
      readonly timeline: AvatarAnimationTimeline
      readonly valid: false
    }
  | {
      readonly snappedTimeMs: number
      readonly timeline: AvatarAnimationTimeline
      readonly undo: AvatarAnimationTimelineUndoCommand
      readonly valid: true
    }

export interface AvatarAnimationTimelineUndoCommand {
  readonly clip: AvatarAnimationTimelineClipInstance
  readonly timelineDurationMs: number
  readonly trackId: string
  readonly type: 'restore-clip'
}

export interface AvatarAnimationTimelinePresetResolver {
  (
    source: AvatarAnimationTimelinePresetSource,
    instance?: AvatarAnimationTimelineClipInstance
  ): AvatarAnimationClip | null | undefined
}

export interface AvatarAnimationResolveOptions {
  readonly parameterValues?: AvatarAnimationParameterValues
}


export const DEFAULT_AVATAR_COLOR_GRADE: AvatarColorGrade = {
  brightness: 1,
  saturation: 1,
  tintAmount: 0,
  tintB: 0,
  tintG: 0,
  tintR: 0
}

export const DEFAULT_AVATAR_PIXEL_EFFECT: AvatarPixelEffect = deepFreeze({
  blockSize: 8,
  dithering: 'none',
  enabled: false,
  paletteSize: 64,
  sampling: 'dominant'
})

export const DEFAULT_AVATAR_COAT_PATTERN: AvatarCoatPattern = deepFreeze({
  algorithm: 'random',
  algorithmSeed: 'v1-tabby',
  breakup: 28,
  contrast: 88,
  density: 72,
  enabled: false,
  jitter: 68,
  lightPatchLength: 100,
  lightPatchOffsetY: 0,
  lightPatchShape: 'face-mask',
  lightPatchWidth: 100,
  seed: 'v1-tabby',
  symmetry: 74,
  thickness: 92
})

export const DEFAULT_AVATAR_FACE: AvatarFace = {
  eyeHighlight: {
    color: '#ffffff',
    enabled: false,
    offsetX: -18,
    offsetY: -20,
    opacity: 92,
    size: 24
  },
  eyeRoundness: 100,
  eyeShape: 'rounded',
  gap: 40,
  height: 64,
  leftEyeRotation: 0,
  mouthCurve: 45,
  mouthEnabled: false,
  mouthHeight: 12,
  mouthRotation: 0,
  mouthShape: 'curve',
  mouthWidth: 52,
  mouthY: 52,
  noseEnabled: false,
  noseHeight: 18,
  noseRotation: 0,
  noseShape: 'inverted-triangle',
  noseWidth: 10,
  noseY: 22,
  rotation: 0,
  rightEyeRotation: 0,
  width: 28
}

export const createDefaultAvatarDefinition = (): AvatarDefinition => ({
  scene: {
    appearance: { backgroundStyle: 'solid', bodyShape: 'sphere', paletteId: 'signal' },
    camera: {
      background: '#111315',
      frame: 'rounded',
      frameShadow: { direction: 90, distance: 12, opacity: 22, softness: 24 },
      showFrameShadow: true,
      size: 256
    },
    effects: {
      avatarShadow: { color: '#000000', direction: 45, distance: 12, opacity: 24, softness: 16 },
      colorGrade: DEFAULT_AVATAR_COLOR_GRADE,
      faceShadow: { direction: 50, distance: 4, opacity: 28, softness: 0 },
      outline: { color: '#ffffff', opacity: 80, width: 4 },
      showAvatarShadow: true,
      showFaceShadow: false,
      showOutline: true
    },
    decals: [],
    entity: { parts: [], preset: 'custom' },
    face: DEFAULT_AVATAR_FACE,
    interactionMode: 'rotate',
    lighting: { azimuth: -35, distance: 0, elevation: 40, enabled: false, gridDensity: 100 },
    view: { pitch: 0, positionX: 0, positionY: 0, roll: 0, scale: 1.28, yaw: 0 }
  },
  schema: AVATAR_DEFINITION_SCHEMA,
  version: AVATAR_DEFINITION_VERSION
})

export const hashAvatarSeed = (seed: string) => {
  let hash = 2166136261
  for (const character of seed) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const normalizeAvatarSeed = (seed: string) => {
  const trimmed = seed.trim()
  if (trimmed === '') return 'v1-0'
  return /^v\d+-/.test(trimmed) ? trimmed : `v1-${trimmed}`
}

export const isAvatarSeedFieldPath = (value: unknown): value is string => (
  typeof value === 'string' && value.length > 0 && value === value.trim() &&
  !/[\s,]/u.test(value)
)

export const resolveAvatarSeededInteger = (
  seed: string,
  path: string,
  min: number,
  max: number
) => {
  const lower = Math.ceil(Math.min(min, max))
  const upper = Math.floor(Math.max(min, max))
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    throw new TypeError('Seeded integer bounds must be finite')
  }
  if (lower > upper) throw new RangeError('Seeded integer bounds must contain an integer')
  if (lower === upper) return lower
  return lower + hashAvatarSeed(`${normalizeAvatarSeed(seed)}\0${path}`) % (upper - lower + 1)
}

export const resolveAvatarSeededOption = <Value extends string>(
  seed: string,
  path: string,
  options: readonly Value[]
): Value => {
  if (options.length === 0) throw new TypeError('Seeded options must not be empty')
  const normalizedSeed = normalizeAvatarSeed(seed)
  let selected = options[0]!
  let selectedScore = -1
  for (const option of options) {
    const score = hashAvatarSeed(`${normalizedSeed}\0${path}\0${option}`)
    if (score > selectedScore) {
      selected = option
      selectedScore = score
    }
  }
  return selected
}

const resolveAvatarSeededUnit = (seed: string, path: string) => (
  hashAvatarSeed(`${normalizeAvatarSeed(seed)}\0${path}`) / 0x1_0000_0000
)

const clampAvatarSeededViewAngle = (angle: number, maxTilt: number) => (
  Math.min(Math.max(angle, -maxTilt), maxTilt)
)

/** Resolves a lower, horizontally varied Seed pose with a restrained center-facing tilt. */
export const resolveSeededAvatarView = (
  seed: string,
  current: AvatarView
): AvatarView => {
  const positionX = (resolveAvatarSeededUnit(seed, `${AVATAR_SEED_FIELD_PATHS.viewPose}.positionX`) * 2 - 1) *
    AVATAR_SEEDED_VIEW_POSE.maxPositionX
  const yawJitter = (resolveAvatarSeededUnit(seed, `${AVATAR_SEED_FIELD_PATHS.viewPose}.yaw`) * 2 - 1) *
    AVATAR_SEEDED_VIEW_POSE.yawJitter
  const pitchJitter = (resolveAvatarSeededUnit(seed, `${AVATAR_SEED_FIELD_PATHS.viewPose}.pitch`) * 2 - 1) *
    AVATAR_SEEDED_VIEW_POSE.pitchJitter
  return {
    pitch: clampAvatarSeededViewAngle(
      Math.atan2(-AVATAR_SEEDED_VIEW_POSE.positionY, AVATAR_SEEDED_VIEW_POSE.pseudoDepth) + pitchJitter,
      AVATAR_SEEDED_VIEW_POSE.maxPitch
    ),
    positionX,
    positionY: AVATAR_SEEDED_VIEW_POSE.positionY,
    roll: 0,
    scale: AVATAR_SEEDED_VIEW_POSE.scale,
    yaw: clampAvatarSeededViewAngle(
      Math.atan2(-positionX, AVATAR_SEEDED_VIEW_POSE.pseudoDepth) + yawJitter,
      AVATAR_SEEDED_VIEW_POSE.maxYaw
    )
  }
}

const AVATAR_CONCRETE_COAT_PATTERN_ALGORITHMS = deepFreeze([
  'mackerel',
  'classic',
  'broken-mackerel',
  'spotted'
] as const)

const mixAvatarHexColor = (from: string, to: string, amount: number) => {
  const parse = (color: string) => [1, 3, 5].map(index => Number.parseInt(color.slice(index, index + 2), 16))
  const left = parse(from)
  const right = parse(to)
  const ratio = Math.max(0, Math.min(1, amount))
  return `#${left.map((channel, index) => (
    Math.round(channel + (right[index]! - channel) * ratio).toString(16).padStart(2, '0')
  )).join('')}`
}

interface AvatarCoatPatternMarkSpec {
  readonly bend?: number
  readonly height: number
  readonly landmark?: boolean
  readonly id: string
  readonly rotation: number
  readonly side?: AvatarSurfaceDecalSide
  readonly shape: AvatarSurfaceDecalShape
  readonly target: 'ear-left' | 'ear-right' | 'face'
  readonly tone?: 'light' | 'shadow'
  readonly width: number
  readonly x: number
  readonly y: number
}

const AVATAR_TABBY_TONE_GROUPS: readonly (readonly AvatarCoatPatternMarkSpec[])[] = deepFreeze([
  [
    { height: 160, id: 'tone-face-to-chin', landmark: true, rotation: 0, shape: 'face-mask', side: 'face', target: 'face', tone: 'light', width: 108, x: 0, y: 70 }
  ]
])

const AVATAR_TABBY_LANDMARK_GROUPS: readonly (readonly AvatarCoatPatternMarkSpec[])[] = deepFreeze([
  [
    { bend: -3, height: 38, id: 'forehead-outer-left', landmark: true, rotation: -28, shape: 'tapered-band', target: 'face', width: 7, x: -31, y: -55 },
    { bend: 3, height: 38, id: 'forehead-outer-right', landmark: true, rotation: 28, shape: 'tapered-band', target: 'face', width: 7, x: 31, y: -55 },
    { bend: 2, height: 31, id: 'forehead-inner-left', landmark: true, rotation: 25, shape: 'tapered-band', target: 'face', width: 6, x: -10, y: -48 },
    { bend: -2, height: 31, id: 'forehead-inner-right', landmark: true, rotation: -25, shape: 'tapered-band', target: 'face', width: 6, x: 10, y: -48 }
  ],
  [
    { bend: -5, height: 32, id: 'eye-line-left', landmark: true, rotation: -75, shape: 'tapered-band', target: 'face', width: 5, x: -63, y: -13 },
    { bend: 5, height: 32, id: 'eye-line-right', landmark: true, rotation: 75, shape: 'tapered-band', target: 'face', width: 5, x: 63, y: -13 }
  ],
  [
    { height: 70, id: 'ear-inner-left', landmark: true, rotation: 0, shape: 'rounded-triangle', target: 'ear-left', width: 64, x: 0, y: 16 },
    { height: 70, id: 'ear-inner-right', landmark: true, rotation: 0, shape: 'rounded-triangle', target: 'ear-right', width: 64, x: 0, y: 16 }
  ],
  [
    { bend: -5, height: 26, id: 'ear-root-left', landmark: true, rotation: -52, shape: 'tapered-band', target: 'face', width: 7, x: -82, y: -50 },
    { bend: 5, height: 26, id: 'ear-root-right', landmark: true, rotation: 52, shape: 'tapered-band', target: 'face', width: 7, x: 82, y: -50 }
  ]
])

const AVATAR_TABBY_VARIABLE_GROUPS: readonly (readonly AvatarCoatPatternMarkSpec[])[] = deepFreeze([
  [
    { bend: -14, height: 58, id: 'cheek-upper-left', rotation: -74, shape: 'tapered-band', target: 'face', width: 7, x: -70, y: 6 },
    { bend: 14, height: 58, id: 'cheek-upper-right', rotation: 74, shape: 'tapered-band', target: 'face', width: 7, x: 70, y: 6 }
  ],
  [
    { bend: -20, height: 84, id: 'side-upper-left', rotation: -76, shape: 'tapered-band', side: 'left', target: 'face', width: 8, x: -10, y: -42 },
    { bend: 20, height: 84, id: 'side-upper-right', rotation: 76, shape: 'tapered-band', side: 'right', target: 'face', width: 8, x: 10, y: -42 }
  ],
  [
    { bend: -16, height: 76, id: 'back-upper-left', rotation: -72, shape: 'tapered-band', side: 'back', target: 'face', width: 8, x: -48, y: -45 },
    { bend: 16, height: 76, id: 'back-upper-right', rotation: 72, shape: 'tapered-band', side: 'back', target: 'face', width: 8, x: 48, y: -45 }
  ],
  [
    { bend: 6, height: 128, id: 'back-spine', rotation: 0, shape: 'tapered-band', side: 'back', target: 'face', width: 9, x: 0, y: -18 }
  ],
  [
    { bend: -13, height: 54, id: 'cheek-middle-left', rotation: -84, shape: 'tapered-band', target: 'face', width: 7, x: -73, y: 28 },
    { bend: 13, height: 54, id: 'cheek-middle-right', rotation: 84, shape: 'tapered-band', target: 'face', width: 7, x: 73, y: 28 }
  ],
  [
    { bend: -18, height: 92, id: 'side-middle-left', rotation: -88, shape: 'tapered-band', side: 'left', target: 'face', width: 8, x: -4, y: 2 },
    { bend: 18, height: 92, id: 'side-middle-right', rotation: 88, shape: 'tapered-band', side: 'right', target: 'face', width: 8, x: 4, y: 2 }
  ],
  [
    { bend: -14, height: 84, id: 'back-middle-left', rotation: -88, shape: 'tapered-band', side: 'back', target: 'face', width: 8, x: -50, y: -2 },
    { bend: 14, height: 84, id: 'back-middle-right', rotation: 88, shape: 'tapered-band', side: 'back', target: 'face', width: 8, x: 50, y: -2 }
  ],
  [
    { bend: -11, height: 46, id: 'cheek-lower-left', rotation: -98, shape: 'tapered-band', target: 'face', width: 7, x: -68, y: 49 },
    { bend: 11, height: 46, id: 'cheek-lower-right', rotation: 98, shape: 'tapered-band', target: 'face', width: 7, x: 68, y: 49 }
  ],
  [
    { bend: -15, height: 78, id: 'side-lower-left', rotation: -100, shape: 'tapered-band', side: 'left', target: 'face', width: 8, x: 8, y: 47 },
    { bend: 15, height: 78, id: 'side-lower-right', rotation: 100, shape: 'tapered-band', side: 'right', target: 'face', width: 8, x: -8, y: 47 }
  ],
  [
    { bend: -12, height: 72, id: 'back-lower-left', rotation: -104, shape: 'tapered-band', side: 'back', target: 'face', width: 8, x: -48, y: 40 },
    { bend: 12, height: 72, id: 'back-lower-right', rotation: 104, shape: 'tapered-band', side: 'back', target: 'face', width: 8, x: 48, y: 40 }
  ],
  [
    { bend: -7, height: 36, id: 'temple-left', rotation: -60, shape: 'tapered-band', target: 'face', width: 6, x: -56, y: -34 },
    { bend: 7, height: 36, id: 'temple-right', rotation: 60, shape: 'tapered-band', target: 'face', width: 6, x: 56, y: -34 }
  ]
])

const AVATAR_TABBY_DARK_GROUPS: readonly (readonly AvatarCoatPatternMarkSpec[])[] = deepFreeze([
  AVATAR_TABBY_LANDMARK_GROUPS[0]!,
  AVATAR_TABBY_VARIABLE_GROUPS[1]!,
  AVATAR_TABBY_VARIABLE_GROUPS[2]!,
  AVATAR_TABBY_LANDMARK_GROUPS[1]!,
  AVATAR_TABBY_LANDMARK_GROUPS[2]!,
  AVATAR_TABBY_VARIABLE_GROUPS[0]!,
  AVATAR_TABBY_LANDMARK_GROUPS[3]!,
  AVATAR_TABBY_VARIABLE_GROUPS[3]!,
  AVATAR_TABBY_VARIABLE_GROUPS[4]!,
  AVATAR_TABBY_VARIABLE_GROUPS[5]!,
  AVATAR_TABBY_VARIABLE_GROUPS[6]!,
  AVATAR_TABBY_VARIABLE_GROUPS[7]!,
  AVATAR_TABBY_VARIABLE_GROUPS[8]!,
  AVATAR_TABBY_VARIABLE_GROUPS[9]!,
  AVATAR_TABBY_VARIABLE_GROUPS[10]!
])

const resolveAvatarDogCoatPatternDecals = ({
  facePartId,
  leftEarId,
  palette,
  pattern,
  rightEarId,
  species = 'dog'
}: {
  readonly facePartId: string
  readonly leftEarId: string | undefined
  readonly palette: (typeof AVATAR_PALETTES)[number]
  readonly pattern: AvatarCoatPattern
  readonly rightEarId: string | undefined
  readonly species?: 'bear' | 'cow' | 'deer' | 'dog' | 'pig' | 'rabbit'
}): readonly AvatarSurfaceDecal[] => {
  const marking = palette.coat?.marking
  if (marking == null) return []
  const patch = palette.coat?.patch ?? palette.gradient[1]
  const mark = palette.coat?.mark ?? palette.foreground
  const contrast = pattern.contrast / 100
  const opacity = Math.round(76 + contrast * 20)
  const width = pattern.lightPatchWidth ?? 100
  const length = pattern.lightPatchLength ?? 100
  const offsetY = pattern.lightPatchOffsetY ?? 0
  const speciesLabel = species.charAt(0).toUpperCase() + species.slice(1)
  const fixed = (
    id: string,
    label: string,
    color: string,
    shape: AvatarSurfaceDecalShape,
    x: number,
    y: number,
    decalWidth: number,
    height: number,
    rotation = 0,
    side: AvatarSurfaceDecalSide = 'face',
    targetPartId = facePartId
  ): AvatarSurfaceDecal => ({
    color,
    height: Math.max(AVATAR_SURFACE_DECAL_RANGES.height.min, Math.min(AVATAR_SURFACE_DECAL_RANGES.height.max, Math.round(height))),
    id: `coat-${species}-${marking}-${id}`,
    label,
    opacity: color === patch ? 100 : opacity,
    rotation,
    shape,
    side,
    targetPartId,
    width: Math.max(AVATAR_SURFACE_DECAL_RANGES.width.min, Math.min(AVATAR_SURFACE_DECAL_RANGES.width.max, Math.round(decalWidth))),
    x,
    y
  })
  if (marking === 'muzzle') {
    return [fixed('muzzle', `${speciesLabel} cream muzzle`, patch, 'ellipse', 0, 42 + offsetY, width * 1.05, length * .66)]
  }
  if (marking === 'blaze') {
    return [
      fixed('blaze', `${speciesLabel} face blaze`, patch, 'rounded', 0, -45 + offsetY, width * .32, length * 1.22),
      fixed('muzzle', `${speciesLabel} cream muzzle`, patch, 'ellipse', 0, 40 + offsetY, width * .96, length * .58)
    ]
  }
  if (marking === 'mask') {
    return [fixed('mask', `${speciesLabel} face mask`, patch, 'face-mask', 0, 40 + offsetY, width * 1.08, length * 1.12)]
  }
  const count = Math.max(8, Math.round(10 + pattern.density / 100 * 16))
  const headSides = ['front', 'front', 'left', 'front', 'right', 'front', 'back', 'front'] as const
  return Array.from({ length: count }, (_, index) => {
    const earPartId = index % 12 === 0 ? leftEarId : index % 12 === 1 ? rightEarId : undefined
    const side = earPartId == null ? headSides[index % headSides.length]! : 'front'
    const isEarSpot = earPartId != null
    const rawX = resolveAvatarSeededInteger(
      pattern.seed,
      `coat.${species}.spots.${index}.x`,
      isEarSpot ? -34 : side === 'front' ? -118 : -70,
      isEarSpot ? 34 : side === 'front' ? 118 : 70
    )
    const y = resolveAvatarSeededInteger(
      pattern.seed,
      `coat.${species}.spots.${index}.y`,
      isEarSpot ? -44 : -112,
      isEarSpot ? 46 : 112
    )
    const spotWidth = resolveAvatarSeededInteger(
      pattern.seed,
      `coat.${species}.spots.${index}.width`,
      isEarSpot ? 13 : 16,
      isEarSpot ? 24 : 34
    ) * pattern.thickness / 100
    const spotHeight = resolveAvatarSeededInteger(
      pattern.seed,
      `coat.${species}.spots.${index}.height`,
      isEarSpot ? 16 : 18,
      isEarSpot ? 28 : 42
    ) * pattern.thickness / 100
    const overlapsFacialFeatures = !isEarSpot && side === 'front' &&
      Math.abs(rawX) < 64 + Math.ceil(spotWidth) / 2 &&
      y > -24 - Math.ceil(spotHeight) / 2 && y < 60 + Math.ceil(spotHeight) / 2
    const x = overlapsFacialFeatures
      ? (rawX < 0 ? -1 : 1) * (90 + Math.abs(rawX) % 20)
      : rawX
    const rotation = resolveAvatarSeededInteger(pattern.seed, `coat.${species}.spots.${index}.rotation`, -55, 55)
    return fixed(
      `spot-${index + 1}`,
      species === 'dog' ? 'Dalmatian coat spot' : `${speciesLabel} coat spot`,
      mark,
      'ellipse',
      x,
      y,
      spotWidth,
      spotHeight,
      rotation,
      side,
      earPartId
    )
  })
}

const resolveAvatarBearCoatPatternDecals = ({ facePartId, palette, pattern }: {
  readonly facePartId: string
  readonly palette: (typeof AVATAR_PALETTES)[number]
  readonly pattern: AvatarCoatPattern
}): readonly AvatarSurfaceDecal[] => {
  const marking = palette.coat?.marking
  const mark = palette.coat?.mark ?? palette.foreground
  const patch = palette.coat?.patch ?? palette.gradient[1]
  const fixed = (id: string, label: string, color: string, shape: AvatarSurfaceDecalShape, x: number, y: number, width: number, height: number, rotation = 0): AvatarSurfaceDecal => ({
    color, height: Math.max(10, Math.round(height)), id: `coat-bear-${marking}-${id}`, label, opacity: 100, rotation, shape, side: 'face', targetPartId: facePartId, width: Math.max(10, Math.round(width)), x, y
  })
  if (marking === 'panda') return [
    fixed('eye-left', 'Panda left eye patch', mark, 'ellipse', -48, -4, 62, 76, -20),
    fixed('eye-right', 'Panda right eye patch', mark, 'ellipse', 48, -4, 62, 76, 20),
    fixed('muzzle', 'Panda cream muzzle', patch, 'ellipse', 0, 44, 104, 54)
  ]
  if (marking === 'spectacles') return [
    fixed('ring-left', 'Spectacled bear left eye ring', mark, 'ellipse', -48, -4, 52, 55, 0),
    fixed('ring-right', 'Spectacled bear right eye ring', mark, 'ellipse', 48, -4, 52, 55, 0),
    fixed('muzzle', 'Spectacled bear muzzle', patch, 'ellipse', 0, 43, 100, 48)
  ]
  if (marking === 'moon') return [fixed('moon', 'Asian black bear moon chest', patch, 'rounded-triangle', 0, 50, 88, 54, 180)]
  if (marking === 'sun') return [fixed('sun', 'Sun bear chest crescent', patch, 'rounded-triangle', 0, 48, 76, 52, 180)]
  if (marking === 'red-panda') return [
    fixed('eye-mask-left', 'Red panda left eye mask', patch, 'ellipse', -32, -4, 58, 92, -12),
    fixed('eye-mask-right', 'Red panda right eye mask', patch, 'ellipse', 32, -4, 58, 92, 12),
    fixed('muzzle', 'Red panda muzzle', '#f7e8d1', 'ellipse', 0, 39, 88, 44)
  ]
  if (marking === 'raccoon') return [fixed('mask', 'Raccoon eye mask', mark, 'face-mask', 0, 2, 146, 76), fixed('muzzle', 'Raccoon muzzle', patch, 'ellipse', 0, 47, 88, 44)]
  if (marking === 'wombat') return [fixed('muzzle', 'Wombat broad muzzle', patch, 'ellipse', 0, 43, 122, 54)]
  return resolveAvatarDogCoatPatternDecals({ facePartId, leftEarId: undefined, palette, pattern, rightEarId: undefined, species: 'bear' })
}

const resolveAvatarCoatPatternAlgorithm = (pattern: AvatarCoatPattern) => (
  pattern.algorithm === 'random'
    ? resolveAvatarSeededOption(
      pattern.algorithmSeed,
      AVATAR_SEED_FIELD_PATHS.coatPatternAlgorithm,
      AVATAR_CONCRETE_COAT_PATTERN_ALGORITHMS
    )
    : pattern.algorithm
)

export const resolveAvatarCoatPatternDecals = ({
  entityParts,
  entityPreset,
  palette: paletteOverride,
  paletteId,
  pattern
}: {
  readonly entityParts: readonly AvatarEntityPart[]
  readonly entityPreset: AvatarEntityPreset
  readonly palette?: AvatarPalette
  readonly paletteId: string
  readonly pattern: AvatarCoatPattern
}): readonly AvatarSurfaceDecal[] => {
  if (!pattern.enabled || (
    entityPreset !== 'cat' && entityPreset !== 'dog' && entityPreset !== 'rabbit' &&
    entityPreset !== 'bear' && entityPreset !== 'cow' && entityPreset !== 'deer' && entityPreset !== 'pig' &&
    entityPreset !== 'squirrel' && entityPreset !== 'tiger'
  )) return []
  const facePartId = entityParts.find(part => part.face)?.id
  if (facePartId == null) return []
  const leftEarId = entityParts.find(part => /ear-left|left-ear/u.test(part.id))?.id
  const rightEarId = entityParts.find(part => /ear-right|right-ear/u.test(part.id))?.id
  const palette = paletteOverride ?? AVATAR_PALETTES.find(candidate => candidate.id === paletteId) ?? AVATAR_PALETTES[0]!
  if (entityPreset === 'bear') return resolveAvatarBearCoatPatternDecals({ facePartId, palette, pattern })
  if (entityPreset === 'tiger' && palette.coat?.marking !== 'stripes') return []
  if (entityPreset === 'squirrel') {
    if (palette.coat?.marking !== 'stripes') return []
    const thickness = pattern.thickness / 100
    const opacity = Math.round(72 + pattern.contrast * .23)
    const chipmunkStripe = (
      id: string,
      x: number,
      width: number,
      rotation: number,
      bend: number,
      color: string
    ): AvatarSurfaceDecal => ({
      bend,
      color,
      height: 112,
      id: `coat-chipmunk-${id}`,
      label: 'Natural curved chipmunk stripe',
      opacity,
      rotation,
      shape: 'tapered-band',
      side: 'face',
      targetPartId: facePartId,
      width: Math.max(6, Math.round(width * thickness)),
      x,
      y: -14
    })
    return [
      chipmunkStripe('center', 0, 14, 0, 0, palette.coat.mark),
      chipmunkStripe('left', -42, 12, -11, -17, palette.coat.mark),
      chipmunkStripe('right', 42, 12, 11, 17, palette.coat.mark),
      chipmunkStripe('left-light', -23, 9, -5, -9, palette.coat.patch),
      chipmunkStripe('right-light', 23, 9, 5, 9, palette.coat.patch)
    ]
  }
  if ((entityPreset === 'cow' || entityPreset === 'deer' || entityPreset === 'pig') && palette.coat?.marking !== 'spots') return []
  if (
    entityPreset === 'dog' || entityPreset === 'rabbit' ||
    entityPreset === 'cow' || entityPreset === 'deer' || entityPreset === 'pig'
  ) return resolveAvatarDogCoatPatternDecals({
    facePartId,
    leftEarId,
    palette,
    pattern,
    rightEarId,
    species: entityPreset
  })
  const algorithm = resolveAvatarCoatPatternAlgorithm(pattern)
  const contrast = pattern.contrast / 100
  const stripeColor = palette.coat?.mark ?? mixAvatarHexColor(palette.background, palette.foreground, contrast)
  const stripeOpacity = Math.round(70 + contrast * 28)
  const thicknessScale = pattern.thickness / 100
  const densityCount = Math.round(AVATAR_TABBY_DARK_GROUPS.length * pattern.density / 100)
  const breakup = pattern.breakup / 100
  const asymmetry = (100 - pattern.symmetry) / 100
  const jitterAmount = pattern.jitter / 100
  const lightPatchLength = pattern.lightPatchLength ?? 100
  const lightPatchOffsetY = pattern.lightPatchOffsetY ?? 0
  const lightPatchWidth = pattern.lightPatchWidth ?? 100
  const lightPatchShape = pattern.lightPatchShape ?? 'face-mask'
  const clampDecalValue = (
    value: number,
    range: { readonly max: number; readonly min: number }
  ) => Math.max(range.min, Math.min(range.max, value))
  const jitter = (path: string, axis: string, amount: number) => Math.round(
    resolveAvatarSeededInteger(pattern.seed, `coat.${algorithm}.${path}.${axis}`, -100, 100) / 100 * amount * jitterAmount
  )
  const selectedGroups = [
    ...(entityPreset === 'tiger' ? [] : AVATAR_TABBY_TONE_GROUPS),
    ...AVATAR_TABBY_DARK_GROUPS.slice(0, densityCount)
  ]
  return selectedGroups.flatMap(group => group.map(spec => {
    const isRight = spec.id.includes('right')
    const pairKey = group.map(mark => mark.id.replace(/left|right/gu, 'side')).join('-')
    const pairedJitter = (axis: string, amount: number) => {
      const mirroredAxis = axis === 'bend' || axis === 'rotation' || axis === 'x'
      const shared = jitter(pairKey, axis, amount) * (isRight && mirroredAxis ? -1 : 1)
      const independent = jitter(spec.id, axis, amount)
      return Math.round(shared * (1 - asymmetry) + independent * asymmetry)
    }
    const classic = algorithm === 'classic'
    const broken = algorithm === 'broken-mackerel'
    const spotted = algorithm === 'spotted'
    const isTone = spec.tone != null
    const isDarkMark = !isTone
    const isVariable = !spec.landmark && isDarkMark
    const darkWidthScale = classic ? 1.35 : broken ? .72 + breakup * .22 : spotted ? .7 : 1
    const widthScale = isDarkMark ? darkWidthScale : 1
    const heightScale = isDarkMark
      ? classic ? 1.08 : broken ? .46 + (1 - breakup) * .16 : spotted ? .32 : 1
      : 1
    const jitterScale = isVariable ? 1 : 0
    const appliedThicknessScale = isDarkMark ? thicknessScale : 1
    const color = spec.tone === 'light'
      ? palette.coat?.patch ?? mixAvatarHexColor(palette.background, palette.gradient[1], .82)
      : spec.tone === 'shadow'
        ? mixAvatarHexColor(palette.background, palette.shadow, .52)
        : stripeColor
    const opacity = spec.tone === 'light'
      ? Math.round(50 + contrast * 16)
      : spec.tone === 'shadow'
        ? Math.round(22 + contrast * 18)
        : stripeOpacity
    const targetPartId = spec.target === 'ear-left'
      ? leftEarId ?? facePartId
      : spec.target === 'ear-right'
        ? rightEarId ?? facePartId
        : facePartId
    return {
      ...(spec.shape === 'tapered-band'
        ? { bend: Math.max(-60, Math.min(60, (spec.bend ?? 0) + pairedJitter('bend', 12 * jitterScale))) }
        : {}),
      color,
      height: clampDecalValue(
        isTone
          ? Math.round(spec.height * lightPatchLength / 100)
          : Math.round(spec.height * heightScale) + Math.abs(pairedJitter('height', 8 * jitterScale)),
        AVATAR_SURFACE_DECAL_RANGES.height
      ),
      id: `coat-${entityPreset === 'tiger' ? 'tiger-' : ''}${algorithm}-${spec.id}`,
      label: entityPreset === 'tiger'
        ? 'Natural curved tiger stripe'
        : isTone ? 'Tabby coat patch' : spotted || broken ? 'Tabby spot' : 'Tabby stripe',
      opacity,
      rotation: clampDecalValue(
        spec.rotation + pairedJitter('rotation', 14 * jitterScale),
        AVATAR_SURFACE_DECAL_RANGES.rotation
      ),
      side: spec.side ?? 'front',
      shape: isTone
        ? lightPatchShape
        : isDarkMark && (spotted || broken) ? 'ellipse' as const : spec.shape,
      targetPartId,
      width: clampDecalValue(
        isTone
          ? Math.round(spec.width * lightPatchWidth / 100)
          : Math.round(spec.width * widthScale * appliedThicknessScale) + Math.abs(pairedJitter('width', 6 * jitterScale)),
        AVATAR_SURFACE_DECAL_RANGES.width
      ),
      x: clampDecalValue(spec.x + pairedJitter('x', 12 * jitterScale), AVATAR_SURFACE_DECAL_RANGES.x),
      y: clampDecalValue(
        isTone
          ? spec.y + lightPatchOffsetY
          : spec.y + pairedJitter('y', 10 * jitterScale),
        AVATAR_SURFACE_DECAL_RANGES.y
      )
    }
  }))
}

export const createSeededAvatarDefinition = ({
  name,
  seed
}: CreateSeededAvatarDefinitionOptions): AvatarDefinition => {
  const normalizedSeed = normalizeAvatarSeed(seed)
  const hash = hashAvatarSeed(normalizedSeed)
  const paletteId = resolveAvatarSeededOption(
    normalizedSeed,
    AVATAR_SEED_FIELD_PATHS.palette,
    AVATAR_PALETTES.map(palette => palette.id)
  )
  const backgroundStyle = resolveAvatarSeededOption(
    normalizedSeed,
    AVATAR_SEED_FIELD_PATHS.backgroundStyle,
    AVATAR_BACKGROUND_STYLES
  )
  const cameraBackground = resolveAvatarSeededOption(
    normalizedSeed,
    AVATAR_SEED_FIELD_PATHS.cameraBackground,
    AVATAR_CAMERA_BACKGROUND_PRESETS
  )
  const palette = AVATAR_PALETTES.find(candidate => candidate.id === paletteId)!
  const definition = createDefaultAvatarDefinition()
  const bodyShapes: readonly AvatarBodyShape[] = ['capsule', 'ellipse', 'rounded', 'sphere', 'teardrop']
  const signed = (shift: number, range: number) => ((hash >>> shift) % (range * 2 + 1)) - range

  return {
    ...definition,
    metadata: {
      generation: {
        fields: [
          AVATAR_SEED_FIELD_PATHS.palette,
          AVATAR_SEED_FIELD_PATHS.backgroundStyle,
          AVATAR_SEED_FIELD_PATHS.cameraBackground,
          AVATAR_SEED_FIELD_PATHS.viewPose
        ],
        seed: normalizedSeed,
        version: 1
      },
      ...(name == null ? {} : { name })
    },
    scene: {
      ...definition.scene,
      appearance: {
        backgroundStyle,
        bodyShape: bodyShapes[(hash >>> 5) % bodyShapes.length]!,
        paletteId: palette.id
      },
      camera: {
        ...definition.scene.camera,
        background: cameraBackground
      },
      face: {
        ...definition.scene.face,
        gap: 38 + ((hash >>> 11) % 9),
        leftEyeRotation: signed(16, 9),
        rightEyeRotation: signed(21, 9)
      },
      view: {
        ...resolveSeededAvatarView(normalizedSeed, definition.scene.view)
      }
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value != null && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) &&
  Reflect.ownKeys(value).every(key => typeof key === 'string') &&
  Object.values(Object.getOwnPropertyDescriptors(value)).every(descriptor => (
    'value' in descriptor && descriptor.enumerable
  ))
)
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => (
  Reflect.ownKeys(value).every(key => typeof key === 'string' && keys.includes(key))
)
const hasOwnKeys = (value: Record<string, unknown>, keys: readonly string[]) => (
  keys.every(key => Object.hasOwn(value, key))
)
const isDenseArray = <T = unknown>(value: unknown): value is T[] => {
  if (!Array.isArray(value)) return false
  if (!Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean)) {
    return false
  }
  return Reflect.ownKeys(value).every(key => {
    if (key === 'length') return true
    if (typeof key !== 'string' || !/^(0|[1-9]\d*)$/u.test(key)) return false
    const index = Number(key)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    return index < value.length && descriptor != null && 'value' in descriptor && descriptor.enumerable
  })
}

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
)
const isFiniteInRange = (value: unknown, range: { readonly max: number; readonly min: number }) => (
  isFiniteNumber(value) && value >= range.min && value <= range.max
)
const isString = (value: unknown): value is string => typeof value === 'string'
const isOptionalNumber = (value: unknown) => value === undefined || isFiniteNumber(value)
const isOptionalString = (value: unknown) => value === undefined || isString(value)
const isOptionalHexColor = (value: unknown) => value === undefined || isHexColor(value)
const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T => (
  isString(value) && options.includes(value as T)
)
const isHexColor = (value: unknown): value is string => (
  isString(value) && /^#[\da-f]{6}$/iu.test(value)
)

const isAvatarEyeHighlight = (value: unknown): value is AvatarEyeHighlight => (
  isRecord(value) && hasOnlyKeys(value, [
    'color',
    'enabled',
    'offsetX',
    'offsetY',
    'opacity',
    'size'
  ]) && hasOwnKeys(value, ['color', 'enabled', 'offsetX', 'offsetY', 'opacity', 'size']) &&
  isHexColor(value.color) && isBoolean(value.enabled) &&
  isFiniteInRange(value.offsetX, AVATAR_EYE_HIGHLIGHT_RANGES.offsetX) &&
  isFiniteInRange(value.offsetY, AVATAR_EYE_HIGHLIGHT_RANGES.offsetY) &&
  isFiniteInRange(value.opacity, AVATAR_EYE_HIGHLIGHT_RANGES.opacity) &&
  isFiniteInRange(value.size, AVATAR_EYE_HIGHLIGHT_RANGES.size)
)

const isAvatarSurfaceDecal = (value: unknown): value is AvatarSurfaceDecal => (
  isRecord(value) && hasOnlyKeys(value, [
    'bend',
    'color',
    'height',
    'id',
    'label',
    'opacity',
    'rotation',
    'side',
    'shape',
    'targetPartId',
    'width',
    'x',
    'y'
  ]) && hasOwnKeys(value, [
    'color',
    'height',
    'id',
    'label',
    'opacity',
    'rotation',
    'shape',
    'targetPartId',
    'width',
    'x',
    'y'
  ]) && (value.bend === undefined || isFiniteInRange(value.bend, AVATAR_SURFACE_DECAL_RANGES.bend)) &&
  isHexColor(value.color) && isFiniteInRange(value.height, AVATAR_SURFACE_DECAL_RANGES.height) &&
  isString(value.id) && value.id.trim().length > 0 && isString(value.label) &&
  isFiniteInRange(value.opacity, AVATAR_SURFACE_DECAL_RANGES.opacity) &&
  isFiniteInRange(value.rotation, AVATAR_SURFACE_DECAL_RANGES.rotation) &&
  (value.side === undefined || isOneOf(value.side, ['back', 'face', 'front', 'left', 'right'])) &&
  isOneOf(value.shape, ['claude-spark', 'ellipse', 'face-mask', 'radial-pleats', 'rounded', 'rounded-triangle', 'tapered-band']) &&
  (value.targetPartId === null || (isString(value.targetPartId) && value.targetPartId.trim().length > 0)) &&
  isFiniteInRange(value.width, AVATAR_SURFACE_DECAL_RANGES.width) &&
  isFiniteInRange(value.x, AVATAR_SURFACE_DECAL_RANGES.x) &&
  isFiniteInRange(value.y, AVATAR_SURFACE_DECAL_RANGES.y)
)

const isAvatarColorGradeField = (key: string, value: unknown) => {
  const range = AVATAR_COLOR_GRADE_RANGES[key as keyof AvatarColorGrade]
  return range != null && isFiniteNumber(value) && value >= range.min && value <= range.max
}

const isPartialAvatarColorGrade = (value: unknown) => (
  isRecord(value) && Object.entries(value).every(([key, field]) => (
    isAvatarColorGradeField(key, field)
  ))
)

const isAvatarColorGrade = (value: unknown): value is AvatarColorGrade => (
  isRecord(value) && Object.keys(value).length === Object.keys(AVATAR_COLOR_GRADE_RANGES).length &&
  Object.entries(value).every(([key, field]) => isAvatarColorGradeField(key, field))
)

const isAvatarShadow = (
  value: unknown,
  ranges: (typeof AVATAR_SHADOW_RANGES)[keyof typeof AVATAR_SHADOW_RANGES]
): value is AvatarShadow => (
  isRecord(value) && hasOnlyKeys(value, ['color', 'direction', 'distance', 'opacity', 'softness']) &&
  hasOwnKeys(value, ['direction', 'distance', 'opacity', 'softness']) &&
  isOptionalHexColor(value.color) && isFiniteInRange(value.direction, ranges.direction) &&
  isFiniteInRange(value.distance, ranges.distance) && isFiniteInRange(value.opacity, ranges.opacity) &&
  isFiniteInRange(value.softness, ranges.softness)
)

const isAvatarOutline = (value: unknown): value is AvatarOutline => (
  isRecord(value) && hasOnlyKeys(value, ['color', 'opacity', 'width']) &&
  hasOwnKeys(value, ['color', 'opacity', 'width']) &&
  isHexColor(value.color) && isFiniteInRange(value.opacity, AVATAR_OUTLINE_RANGES.opacity) &&
  isFiniteInRange(value.width, AVATAR_OUTLINE_RANGES.width)
)

const isAvatarPixelEffect = (value: unknown): value is AvatarPixelEffect => (
  isRecord(value) && hasOnlyKeys(value, ['blockSize', 'dithering', 'enabled', 'paletteSize', 'sampling']) &&
  hasOwnKeys(value, ['blockSize', 'dithering', 'enabled', 'paletteSize', 'sampling']) &&
  Number.isInteger(value.blockSize) && isFiniteInRange(value.blockSize, AVATAR_PIXEL_EFFECT_RANGES.blockSize) &&
  isOneOf(value.dithering, ['none', 'ordered']) && isBoolean(value.enabled) &&
  AVATAR_PIXEL_EFFECT_RANGES.paletteSizes.includes(value.paletteSize as 8 | 16 | 32 | 64) &&
  isOneOf(value.sampling, ['center', 'dominant', 'median', 'slic'])
)

const isAvatarCoatPattern = (value: unknown): value is AvatarCoatPattern => (
  isRecord(value) && hasOnlyKeys(value, [
    'algorithm',
    'algorithmSeed',
    'breakup',
    'contrast',
    'density',
    'enabled',
    'jitter',
    'lightPatchLength',
    'lightPatchOffsetY',
    'lightPatchShape',
    'lightPatchWidth',
    'seed',
    'symmetry',
    'thickness'
  ]) && hasOwnKeys(value, [
    'algorithm',
    'algorithmSeed',
    'breakup',
    'contrast',
    'density',
    'enabled',
    'jitter',
    'seed',
    'symmetry',
    'thickness'
  ]) && isOneOf(value.algorithm, ['broken-mackerel', 'classic', 'mackerel', 'random', 'spotted']) &&
  isString(value.algorithmSeed) && value.algorithmSeed.trim().length > 0 &&
  isFiniteInRange(value.breakup, AVATAR_COAT_PATTERN_RANGES.breakup) &&
  isFiniteInRange(value.contrast, AVATAR_COAT_PATTERN_RANGES.contrast) &&
  isFiniteInRange(value.density, AVATAR_COAT_PATTERN_RANGES.density) &&
  isBoolean(value.enabled) && isFiniteInRange(value.jitter, AVATAR_COAT_PATTERN_RANGES.jitter) &&
  (value.lightPatchLength === undefined || isFiniteInRange(value.lightPatchLength, AVATAR_COAT_PATTERN_RANGES.lightPatchLength)) &&
  (value.lightPatchOffsetY === undefined || isFiniteInRange(value.lightPatchOffsetY, AVATAR_COAT_PATTERN_RANGES.lightPatchOffsetY)) &&
  (value.lightPatchShape === undefined || isOneOf(value.lightPatchShape, ['ellipse', 'face-mask', 'rounded'])) &&
  (value.lightPatchWidth === undefined || isFiniteInRange(value.lightPatchWidth, AVATAR_COAT_PATTERN_RANGES.lightPatchWidth)) &&
  isString(value.seed) && value.seed.trim().length > 0 &&
  isFiniteInRange(value.symmetry, AVATAR_COAT_PATTERN_RANGES.symmetry) &&
  isFiniteInRange(value.thickness, AVATAR_COAT_PATTERN_RANGES.thickness)
)

const isAvatarView = (value: unknown): value is AvatarView => (
  isRecord(value) && hasOnlyKeys(value, ['pitch', 'positionX', 'positionY', 'roll', 'scale', 'yaw']) &&
  hasOwnKeys(value, ['pitch', 'positionX', 'positionY', 'roll', 'scale', 'yaw']) &&
  isFiniteNumber(value.pitch) && isFiniteNumber(value.positionX) &&
  isFiniteNumber(value.positionY) && isFiniteNumber(value.roll) &&
  isFiniteInRange(value.scale, AVATAR_VIEW_RANGES.scale) &&
  isFiniteNumber(value.yaw)
)

const isAvatarFace = (value: unknown): value is AvatarFace => (
  isRecord(value) && hasOnlyKeys(value, [
    'eyeHighlight',
    'eyeRoundness',
    'eyeShape',
    'gap',
    'height',
    'leftEyeHeight',
    'leftEyeWidth',
    'leftEyeRotation',
    'mouthCurve',
    'mouthEnabled',
    'mouthHeight',
    'mouthRotation',
    'mouthShape',
    'mouthWidth',
    'mouthY',
    'noseEnabled',
    'noseHeight',
    'noseRotation',
    'noseShape',
    'noseWidth',
    'noseY',
    'rotation',
    'rightEyeHeight',
    'rightEyeWidth',
    'rightEyeRotation',
    'width'
  ]) && hasOwnKeys(value, [
    'eyeHighlight',
    'eyeRoundness',
    'eyeShape',
    'gap',
    'height',
    'leftEyeRotation',
    'mouthCurve',
    'mouthEnabled',
    'mouthHeight',
    'mouthRotation',
    'mouthShape',
    'mouthWidth',
    'mouthY',
    'noseEnabled',
    'noseHeight',
    'noseRotation',
    'noseShape',
    'noseWidth',
    'noseY',
    'rotation',
    'rightEyeRotation',
    'width'
  ]) && isAvatarEyeHighlight(value.eyeHighlight) &&
  isFiniteInRange(value.eyeRoundness, AVATAR_FACE_RANGES.eyeRoundness) &&
  isOneOf(value.eyeShape, ['ellipse', 'rounded']) && isFiniteInRange(value.gap, AVATAR_FACE_RANGES.gap) &&
  isFiniteInRange(value.height, AVATAR_FACE_RANGES.height) &&
  (value.leftEyeHeight === undefined || isFiniteInRange(value.leftEyeHeight, AVATAR_FACE_RANGES.leftEyeHeight)) &&
  (value.leftEyeWidth === undefined || isFiniteInRange(value.leftEyeWidth, AVATAR_FACE_RANGES.leftEyeWidth)) &&
  isFiniteInRange(value.leftEyeRotation, AVATAR_FACE_RANGES.leftEyeRotation) &&
  isFiniteInRange(value.mouthCurve, AVATAR_FACE_RANGES.mouthCurve) &&
  isBoolean(value.mouthEnabled) && isFiniteInRange(value.mouthHeight, AVATAR_FACE_RANGES.mouthHeight) &&
  isFiniteInRange(value.mouthRotation, AVATAR_FACE_RANGES.mouthRotation) &&
  isOneOf(value.mouthShape, ['curve', 'ellipse', 'rounded', 'rounded-triangle']) &&
  isFiniteInRange(value.mouthWidth, AVATAR_FACE_RANGES.mouthWidth) &&
  isFiniteInRange(value.mouthY, AVATAR_FACE_RANGES.mouthY) &&
  isBoolean(value.noseEnabled) && isFiniteInRange(value.noseHeight, AVATAR_FACE_RANGES.noseHeight) &&
  isFiniteInRange(value.noseRotation, AVATAR_FACE_RANGES.noseRotation) &&
  isOneOf(value.noseShape, ['ellipse', 'inverted-triangle', 'rounded']) &&
  isFiniteInRange(value.noseWidth, AVATAR_FACE_RANGES.noseWidth) &&
  isFiniteInRange(value.noseY, AVATAR_FACE_RANGES.noseY) &&
  isFiniteInRange(value.rotation, AVATAR_FACE_RANGES.rotation) &&
  (value.rightEyeHeight === undefined ||
    isFiniteInRange(value.rightEyeHeight, AVATAR_FACE_RANGES.rightEyeHeight)) &&
  (value.rightEyeWidth === undefined || isFiniteInRange(value.rightEyeWidth, AVATAR_FACE_RANGES.rightEyeWidth)) &&
  isFiniteInRange(value.rightEyeRotation, AVATAR_FACE_RANGES.rightEyeRotation) &&
  isFiniteInRange(value.width, AVATAR_FACE_RANGES.width)
)

const isAvatarEntityPart = (value: unknown): value is AvatarEntityPart => (
  isRecord(value) && hasOnlyKeys(value, [
    'baseColor',
    'bottomTaper',
    'cutAngle',
    'face',
    'foregroundColor',
    'highlightColor',
    'hollow',
    'id',
    'label',
    'occlusionAmount',
    'occludedByFace',
    'occlusionPole',
    'rotationX',
    'rotationY',
    'rotationZ',
    'roundness',
    'scaleX',
    'scaleY',
    'scaleZ',
    'shadowColor',
    'shape',
    'topScale',
    'x',
    'y',
    'z'
  ]) && hasOwnKeys(value, [
    'baseColor',
    'face',
    'foregroundColor',
    'highlightColor',
    'id',
    'label',
    'scaleX',
    'scaleY',
    'shadowColor',
    'shape',
    'x',
    'y',
    'z'
  ]) && isHexColor(value.baseColor) &&
  (value.bottomTaper === undefined || isFiniteInRange(value.bottomTaper, AVATAR_ENTITY_RANGES.bottomTaper)) &&
  isOptionalNumber(value.cutAngle) &&
  isBoolean(value.face) && isHexColor(value.foregroundColor) && isHexColor(value.highlightColor) &&
  (value.hollow === undefined || isBoolean(value.hollow)) && isString(value.id) && value.id.trim().length > 0 &&
  isString(value.label) &&
  (value.occlusionAmount === undefined ||
    isFiniteInRange(value.occlusionAmount, AVATAR_ENTITY_RANGES.occlusionAmount)) &&
  (value.occludedByFace === undefined || isBoolean(value.occludedByFace)) &&
  (value.occlusionPole === undefined || isOneOf(value.occlusionPole, ['bottom', 'top'])) &&
  isOptionalNumber(value.rotationX) && isOptionalNumber(value.rotationY) &&
  isOptionalNumber(value.rotationZ) &&
  (value.roundness === undefined || isFiniteInRange(value.roundness, AVATAR_ENTITY_RANGES.roundness)) &&
  isFiniteInRange(value.scaleX, AVATAR_ENTITY_RANGES.scaleX) &&
  isFiniteInRange(value.scaleY, AVATAR_ENTITY_RANGES.scaleY) &&
  (value.scaleZ === undefined || isFiniteInRange(value.scaleZ, AVATAR_ENTITY_RANGES.scaleZ)) &&
  isHexColor(value.shadowColor) &&
  isOneOf(value.shape, [
    'capsule',
    'cone',
    'diamond',
    'ellipse',
    'frustum',
    'half-cone',
    'rounded',
    'square',
    'sphere',
    'teardrop',
    'trapezoid'
  ]) && (value.topScale === undefined || isFiniteInRange(value.topScale, AVATAR_ENTITY_RANGES.topScale)) &&
  isFiniteNumber(value.x) &&
  isFiniteNumber(value.y) && isFiniteNumber(value.z)
)

const isPartialNumberRecord = (value: unknown, keys: readonly string[]) => (
  isRecord(value) && Object.entries(value).every(([key, field]) => keys.includes(key) && isFiniteNumber(field))
)

const isPartialAvatarView = (value: unknown) => {
  return isPartialNumberRecord(value, ['pitch', 'positionX', 'positionY', 'yaw'])
}

const isPartialAvatarFace = (value: unknown) => {
  if (!isRecord(value)) return false
  const numberKeys = [
    'eyeRoundness',
    'gap',
    'height',
    'leftEyeHeight',
    'leftEyeWidth',
    'leftEyeRotation',
    'mouthCurve',
    'mouthHeight',
    'mouthRotation',
    'mouthWidth',
    'mouthY',
    'noseHeight',
    'noseRotation',
    'noseWidth',
    'noseY',
    'rotation',
    'rightEyeHeight',
    'rightEyeWidth',
    'rightEyeRotation',
    'width'
  ]
  const booleanKeys = ['mouthEnabled', 'noseEnabled']
  const allowedKeys = [
    ...numberKeys,
    ...booleanKeys,
    'eyeHighlight',
    'eyeShape',
    'mouthShape',
    'noseShape'
  ]
  if (!hasOnlyKeys(value, allowedKeys)) return false
  return Object.entries(value).every(([key, field]) => {
    if (numberKeys.includes(key)) {
      const range = AVATAR_ANIMATION_FACE_RANGES[key as keyof typeof AVATAR_ANIMATION_FACE_RANGES]
      return range != null && isFiniteInRange(field, range)
    }
    if (booleanKeys.includes(key)) return isBoolean(field)
    if (key === 'eyeShape') return isOneOf(field, ['ellipse', 'rounded'])
    if (key === 'eyeHighlight') return isAvatarEyeHighlight(field)
    if (key === 'mouthShape') {
      return isOneOf(field, ['curve', 'ellipse', 'rounded', 'rounded-triangle'])
    }
    if (key === 'noseShape') return isOneOf(field, ['ellipse', 'inverted-triangle', 'rounded'])
    return false
  })
}

const isAvatarEntityPartTransform = (value: unknown): value is AvatarEntityPartTransform => {
  if (!isRecord(value)) return false
  const allowedKeys = ['rotationZ', 'scaleX', 'scaleY', 'scaleZ', 'x', 'y', 'z']
  if (!hasOnlyKeys(value, allowedKeys)) return false
  return Object.entries(value).every(([key, field]) => {
    if (key === 'scaleX' || key === 'scaleY' || key === 'scaleZ') {
      return isFiniteInRange(field, AVATAR_ANIMATION_PART_SCALE_RANGE)
    }
    const range = AVATAR_ENTITY_RANGES[key as keyof typeof AVATAR_ENTITY_RANGES]
    return range == null ? isFiniteNumber(field) : isFiniteInRange(field, range)
  })
}

const isAvatarEntityPartShapeMorph = (value: unknown): value is AvatarEntityPartShapeMorph => (
  isRecord(value) &&
  hasOnlyKeys(value, ['fromShape', 'progress', 'toShape']) &&
  hasOwnKeys(value, ['fromShape', 'progress', 'toShape']) &&
  isOneOf(value.fromShape, [
    'capsule', 'cone', 'diamond', 'ellipse', 'frustum', 'half-cone',
    'rounded', 'square', 'sphere', 'teardrop', 'trapezoid'
  ]) &&
  isFiniteNumber(value.progress) && value.progress >= 0 && value.progress <= 1 &&
  isOneOf(value.toShape, [
    'capsule', 'cone', 'diamond', 'ellipse', 'frustum', 'half-cone',
    'rounded', 'square', 'sphere', 'teardrop', 'trapezoid'
  ])
)

const isAvatarAnimationShape = (value: unknown): value is AvatarAnimationShape => (
  isRecord(value) &&
  hasOnlyKeys(value, [
    'color',
    'height',
    'id',
    'kind',
    'opacity',
    'rotation',
    'roundness',
    'width',
    'x',
    'y'
  ]) &&
  hasOwnKeys(value, [
    'color',
    'height',
    'id',
    'kind',
    'opacity',
    'rotation',
    'roundness',
    'width',
    'x',
    'y'
  ]) &&
  isHexColor(value.color) &&
  isFiniteNumber(value.height) && value.height >= 0 && value.height <= 840 &&
  typeof value.id === 'string' && value.id.trim().length > 0 && value.id.length <= 80 &&
  isOneOf(value.kind, ['ellipse', 'exclamation', 'rounded-rect']) &&
  isFiniteNumber(value.opacity) && value.opacity >= 0 && value.opacity <= 100 &&
  isFiniteNumber(value.rotation) && value.rotation >= -360 && value.rotation <= 360 &&
  isFiniteNumber(value.roundness) && value.roundness >= 0 && value.roundness <= 100 &&
  isFiniteNumber(value.width) && value.width >= 0 && value.width <= 840 &&
  isFiniteNumber(value.x) &&
  isFiniteNumber(value.y)
)

const isAvatarAnimationEntityPart = (value: unknown): value is AvatarAnimationEntityPart => (
  isRecord(value) &&
  hasOnlyKeys(value, ['composition', 'opacity', 'part', 'transform']) &&
  hasOwnKeys(value, ['opacity', 'part']) &&
  (value.composition === undefined || isOneOf(value.composition, ['co-compiled', 'independent-depth'])) &&
  isFiniteNumber(value.opacity) && value.opacity >= 0 && value.opacity <= 100 &&
  isAvatarEntityPart(value.part) &&
  (value.transform === undefined || isAvatarEntityPartTransform(value.transform))
)

const isTransformRecord = <T>(
  value: unknown,
  validate: (field: unknown) => field is T
): value is Readonly<Record<string, T>> => (
  isRecord(value) && Object.entries(value).every(([id, field]) => id.trim().length > 0 && validate(field))
)

const isAvatarScenePatch = (value: unknown): value is AvatarScenePatch => {
  if (!isRecord(value) || Object.keys(value).some(key => ![
    'auxiliaryParts',
    'auxiliaryShapes',
    'colorGrade',
    'face',
    'partShapeMorphs',
    'partTransforms',
    'release',
    'view'
  ].includes(key))) {
    return false
  }
  if (value.auxiliaryParts !== undefined) {
    if (
      !isDenseArray<AvatarAnimationEntityPart>(value.auxiliaryParts) ||
      value.auxiliaryParts.length > 16 ||
      !value.auxiliaryParts.every(isAvatarAnimationEntityPart) ||
      new Set(value.auxiliaryParts.map(item => item.part.id)).size !== value.auxiliaryParts.length
    ) return false
  }
  if (value.auxiliaryShapes !== undefined) {
    if (
      !isDenseArray<AvatarAnimationShape>(value.auxiliaryShapes) ||
      value.auxiliaryShapes.length > 16 ||
      !value.auxiliaryShapes.every(isAvatarAnimationShape) ||
      new Set(value.auxiliaryShapes.map(shape => shape.id)).size !== value.auxiliaryShapes.length
    ) return false
  }
  if (value.colorGrade !== undefined && !isPartialAvatarColorGrade(value.colorGrade)) return false
  if (value.view !== undefined && !isPartialAvatarView(value.view)) return false
  if (value.face !== undefined && !isPartialAvatarFace(value.face)) return false
  if (
    value.partShapeMorphs !== undefined &&
    !isTransformRecord(value.partShapeMorphs, isAvatarEntityPartShapeMorph)
  ) return false
  if (
    value.partTransforms !== undefined &&
    !isTransformRecord(value.partTransforms, isAvatarEntityPartTransform)
  ) return false
  if (
    value.release !== undefined && (
      !isDenseArray<AvatarAnimationResourceClaim>(value.release) ||
      !value.release.every(isAvatarAnimationResourceClaim) ||
      new Set(value.release).size !== value.release.length
    )
  ) return false
  return true
}

const AVATAR_ANIMATION_RESOURCE_CLAIM_PATTERN = /^(?:exclusive:\*|(?:aux|decal|effect|face|part|shape|view):[a-z0-9_-]+(?:\.[a-z0-9_-]+)*)$/iu

const isAvatarAnimationResourceClaim = (value: unknown): value is AvatarAnimationResourceClaim => (
  isString(value) && value.length <= 160 && AVATAR_ANIMATION_RESOURCE_CLAIM_PATTERN.test(value)
)

const isAvatarAnimationParameter = (value: unknown): value is AvatarAnimationParameter => {
  if (
    !isRecord(value) || !isString(value.id) || value.id.trim() !== value.id || value.id.length === 0 ||
    !isString(value.label) || value.label.trim().length === 0 ||
    (value.advanced !== undefined && !isBoolean(value.advanced))
  ) return false
  const commonKeys = ['advanced', 'default', 'id', 'label', 'type']
  if (value.type === 'boolean') {
    return hasOnlyKeys(value, commonKeys) && isBoolean(value.default)
  }
  if (value.type === 'color') {
    return hasOnlyKeys(value, [...commonKeys, 'binding']) && isHexColor(value.default) && (
      value.binding === undefined || (
        isRecord(value.binding) && hasOnlyKeys(value.binding, ['partId', 'type']) &&
        value.binding.type === 'auxiliary-part-material' && isString(value.binding.partId) &&
        value.binding.partId.trim().length > 0
      )
    )
  }
  if (value.type === 'number') {
    return hasOnlyKeys(value, [...commonKeys, 'max', 'min', 'step']) &&
      isFiniteNumber(value.default) && isFiniteNumber(value.min) && isFiniteNumber(value.max) &&
      value.min <= value.default && value.default <= value.max && value.min < value.max &&
      (value.step === undefined || isFiniteNumber(value.step) && value.step > 0)
  }
  if (value.type === 'enum') {
    return hasOnlyKeys(value, [...commonKeys, 'options']) && isString(value.default) &&
      isDenseArray<{ readonly label: string; readonly value: string }>(value.options) &&
      value.options.length > 0 && value.options.every(option => (
        isRecord(option) && hasOnlyKeys(option, ['label', 'value']) &&
        isString(option.label) && option.label.trim().length > 0 &&
        isString(option.value) && option.value.length > 0
      )) && new Set(value.options.map(option => option.value)).size === value.options.length &&
      value.options.some(option => option.value === value.default)
  }
  return false
}

const isAvatarAnimationParameterValue = (
  parameter: AvatarAnimationParameter,
  value: unknown
): value is AvatarAnimationParameterValue => {
  if (parameter.type === 'boolean') return isBoolean(value)
  if (parameter.type === 'color') return isHexColor(value)
  if (parameter.type === 'number') return isFiniteNumber(value) && value >= parameter.min && value <= parameter.max
  return isString(value) && parameter.options.some(option => option.value === value)
}

const isAvatarAnimationParameterValues = (
  parameters: readonly AvatarAnimationParameter[],
  values: unknown
): values is AvatarAnimationParameterValues => {
  if (!isRecord(values)) return false
  const byId = new Map(parameters.map(parameter => [parameter.id, parameter]))
  return Object.entries(values).every(([id, value]) => {
    const parameter = byId.get(id)
    return parameter != null && isAvatarAnimationParameterValue(parameter, value)
  })
}

const isAvatarAnimationClip = (value: unknown): value is AvatarAnimationClip => {
  if (
    !isRecord(value) || !hasOnlyKeys(value, [
      'anchor',
      'blendMode',
      'durationMs',
      'keyframes',
      'label',
      'parameterValues',
      'parameters',
      'playback',
      'resourceClaims'
    ]) || !hasOwnKeys(value, ['anchor', 'durationMs', 'keyframes', 'playback']) ||
    !isOneOf(value.anchor, ['absolute', 'relative']) ||
    (value.blendMode !== undefined && value.blendMode !== 'replace') ||
    !isFiniteNumber(value.durationMs) || value.durationMs <= 0 || !isOptionalString(value.label) ||
    !isOneOf(value.playback, ['loop', 'once']) ||
    !isDenseArray<AvatarAnimationKeyframe>(value.keyframes) ||
    value.keyframes.length === 0 || (value.playback === 'loop' && value.keyframes.length < 2) ||
    (value.resourceClaims !== undefined && (
      !isDenseArray<AvatarAnimationResourceClaim>(value.resourceClaims) ||
      value.resourceClaims.length === 0 || !value.resourceClaims.every(isAvatarAnimationResourceClaim) ||
      new Set(value.resourceClaims).size !== value.resourceClaims.length
    )) ||
    (value.parameters !== undefined && (
      !isDenseArray<AvatarAnimationParameter>(value.parameters) ||
      !value.parameters.every(isAvatarAnimationParameter) ||
      new Set(value.parameters.map(parameter => parameter.id)).size !== value.parameters.length
    )) ||
    (value.parameterValues !== undefined && (
      value.parameters === undefined || !isAvatarAnimationParameterValues(value.parameters, value.parameterValues)
    ))
  ) return false
  const durationMs = value.durationMs
  if (
    !value.keyframes.every(keyframe => (
      isRecord(keyframe) && hasOnlyKeys(keyframe, ['atMs', 'easing', 'patch']) &&
      hasOwnKeys(keyframe, ['atMs', 'patch']) &&
      isFiniteNumber(keyframe.atMs) && keyframe.atMs >= 0 &&
      keyframe.atMs <= durationMs &&
      (keyframe.easing === undefined || isOneOf(keyframe.easing, [
        'ease-in',
        'ease-in-out',
        'ease-out',
        'linear'
      ])) && isAvatarScenePatch(keyframe.patch)
    ))
  ) return false
  const ordered = [...value.keyframes].sort((a, b) => a.atMs - b.atMs)
  const timeline = ordered[0]!.atMs > 0
    ? [{ atMs: 0 }, ...ordered]
    : ordered
  const segmentIsValid = (duration: number) => (
    duration >= AVATAR_ANIMATION_MIN_SEGMENT_MS && duration <= AVATAR_ANIMATION_MAX_SEGMENT_MS
  )
  if (
    timeline.slice(1).some((frame, index) => (
      !segmentIsValid(frame.atMs - timeline[index]!.atMs)
    ))
  ) return false
  const tailDuration = durationMs - timeline.at(-1)!.atMs
  return value.playback === 'loop'
    ? segmentIsValid(tailDuration)
    : tailDuration === 0 || segmentIsValid(tailDuration)
}

export const parseAvatarAnimationClip = (input: unknown): AvatarAnimationClip => {
  try {
    if (!isAvatarAnimationClip(input)) throw new TypeError('Invalid OneWorks Avatar animation clip')
    const value = structuredClone(input)
    if (!isAvatarAnimationClip(value)) throw new TypeError('Invalid OneWorks Avatar animation clip')
    return value
  } catch {
    throw new TypeError('Invalid OneWorks Avatar animation clip')
  }
}

export const resolveAvatarAnimationParameterValues = (
  clip: Pick<AvatarAnimationClip, 'parameterValues' | 'parameters'>,
  overrides: AvatarAnimationParameterValues = {}
): AvatarAnimationParameterValues => {
  const parameters = clip.parameters ?? []
  const merged = {
    ...Object.fromEntries(parameters.map(parameter => [parameter.id, parameter.default])),
    ...clip.parameterValues,
    ...overrides
  }
  if (!isAvatarAnimationParameterValues(parameters, merged)) {
    throw new TypeError('Invalid OneWorks Avatar animation parameter values')
  }
  return merged
}

const blendAvatarAnimationColor = (source: string, target: 0 | 255, amount: number) => {
  const sourceValue = Number.parseInt(source.slice(1), 16)
  const channel = (shift: number) => Math.round(
    ((sourceValue >> shift) & 0xff) * (1 - amount) + target * amount
  )
  return `#${[16, 8, 0].map(shift => channel(shift).toString(16).padStart(2, '0')).join('')}`
}

export const resolveAvatarAnimationColorMaterial = (baseColor: string) => {
  if (!isHexColor(baseColor)) throw new TypeError('Invalid OneWorks Avatar animation color')
  return {
    baseColor,
    foregroundColor: blendAvatarAnimationColor(baseColor, 0, .58),
    highlightColor: blendAvatarAnimationColor(baseColor, 255, .38),
    shadowColor: blendAvatarAnimationColor(baseColor, 0, .34)
  } as const
}

const isAvatarAnimationLibrary = (value: unknown): value is AvatarAnimationLibrary => (
  isRecord(value) && hasOnlyKeys(value, ['groups', 'id', 'label']) &&
  hasOwnKeys(value, ['groups', 'id']) &&
  isString(value.id) && value.id.trim().length > 0 && isOptionalString(value.label) && isRecord(value.groups) &&
  Object.entries(value.groups).every(([groupId, group]) => (
    groupId.trim().length > 0 &&
    isRecord(group) && hasOnlyKeys(group, ['clips', 'defaultClip', 'label']) &&
    hasOwnKeys(group, ['clips']) &&
    isOptionalString(group.defaultClip) && isOptionalString(group.label) &&
    isRecord(group.clips) && Object.entries(group.clips).every(([clipId, clip]) => (
      clipId.trim().length > 0 && isAvatarAnimationClip(clip)
    )) &&
    (group.defaultClip === undefined || Object.hasOwn(group.clips, group.defaultClip))
  ))
)

const isAvatarSeedConfiguration = (value: unknown): value is AvatarSeedConfiguration => (
  isRecord(value) && hasOnlyKeys(value, ['fields', 'profileId', 'seed', 'version']) &&
  hasOwnKeys(value, ['fields', 'seed', 'version']) &&
  value.version === 1 && isString(value.seed) && value.seed.trim().length > 0 &&
  (value.profileId === undefined || (
    isString(value.profileId) &&
    value.profileId.length > 0 &&
    value.profileId === value.profileId.trim()
  )) &&
  isDenseArray<string>(value.fields) && value.fields.every(isAvatarSeedFieldPath) &&
  new Set(value.fields).size === value.fields.length
)

const isAvatarDefinitionValue = (value: unknown): value is AvatarDefinition => {
  if (
    !isRecord(value) || !hasOnlyKeys(value, ['animations', 'metadata', 'scene', 'schema', 'version']) ||
    !hasOwnKeys(value, ['scene', 'schema', 'version']) ||
    value.schema !== AVATAR_DEFINITION_SCHEMA || value.version !== 1
  ) return false
  if (value.animations !== undefined && !isAvatarAnimationLibrary(value.animations)) return false
  if (
    value.metadata !== undefined && (!isRecord(value.metadata) ||
      !hasOnlyKeys(value.metadata, ['createdAt', 'generation', 'id', 'name', 'updatedAt']) ||
      !isOptionalString(value.metadata.createdAt) || !isOptionalString(value.metadata.id) ||
      !isOptionalString(value.metadata.name) || !isOptionalString(value.metadata.updatedAt) ||
      value.metadata.generation !== undefined && !isAvatarSeedConfiguration(value.metadata.generation))
  ) return false
  if (
    !isRecord(value.scene) || !hasOnlyKeys(value.scene, [
      'appearance',
      'camera',
      'decals',
      'effects',
      'entity',
      'face',
      'interactionMode',
      'lighting',
      'view'
    ]) || !hasOwnKeys(value.scene, [
      'appearance',
      'camera',
      'decals',
      'effects',
      'entity',
      'face',
      'interactionMode',
      'lighting',
      'view'
    ])
  ) return false
  const scene = value.scene
  if (!isDenseArray<AvatarSurfaceDecal>(scene.decals) || !scene.decals.every(isAvatarSurfaceDecal)) return false
  if (new Set(scene.decals.map(decal => decal.id)).size !== scene.decals.length) return false
  const entityParts = isRecord(scene.entity) && isDenseArray<AvatarEntityPart>(scene.entity.parts)
    ? scene.entity.parts
    : []
  const decalTargetsAreValid = scene.decals.every(decal => (
    decal.targetPartId === null || entityParts.some(part => part.id === decal.targetPartId)
  ))
  return isRecord(scene.appearance) && hasOnlyKeys(scene.appearance, [
    'backgroundStyle',
    'bodyShape',
    'bottomTaper',
    'coatPattern',
    'paletteId'
  ]) && hasOwnKeys(scene.appearance, ['backgroundStyle', 'bodyShape', 'paletteId']) &&
    isOneOf(scene.appearance.backgroundStyle, ['gradient', 'solid']) &&
    isOneOf(scene.appearance.bodyShape, [
      'capsule',
      'cone',
      'diamond',
      'ellipse',
      'frustum',
      'half-cone',
      'rounded',
      'square',
      'sphere',
      'teardrop',
      'trapezoid'
    ]) && (scene.appearance.bottomTaper === undefined ||
      isFiniteInRange(scene.appearance.bottomTaper, AVATAR_ENTITY_RANGES.bottomTaper)) &&
    (scene.appearance.coatPattern === undefined || isAvatarCoatPattern(scene.appearance.coatPattern)) &&
    isString(scene.appearance.paletteId) &&
    isRecord(scene.camera) && hasOnlyKeys(scene.camera, [
      'background',
      'frame',
      'frameShadow',
      'showFrameShadow',
      'size'
    ]) && hasOwnKeys(scene.camera, [
      'background',
      'frame',
      'frameShadow',
      'showFrameShadow',
      'size'
    ]) && (scene.camera.background === 'transparent' || isHexColor(scene.camera.background)) &&
    isOneOf(scene.camera.frame, ['circle', 'rounded', 'square']) &&
    isAvatarShadow(scene.camera.frameShadow, AVATAR_SHADOW_RANGES.frame) &&
    isBoolean(scene.camera.showFrameShadow) &&
    [128, 256, 512].includes(scene.camera.size as number) &&
    isRecord(scene.effects) && hasOnlyKeys(scene.effects, [
      'avatarShadow',
      'colorGrade',
      'faceShadow',
      'outline',
      'pixelate',
      'showAvatarShadow',
      'showFaceShadow',
      'showOutline'
    ]) && hasOwnKeys(scene.effects, [
      'avatarShadow',
      'colorGrade',
      'faceShadow',
      'outline',
      'showAvatarShadow',
      'showFaceShadow',
      'showOutline'
    ]) && isAvatarShadow(scene.effects.avatarShadow, AVATAR_SHADOW_RANGES.avatar) &&
    isAvatarColorGrade(scene.effects.colorGrade) &&
    isAvatarShadow(scene.effects.faceShadow, AVATAR_SHADOW_RANGES.face) &&
    isAvatarOutline(scene.effects.outline) &&
    (scene.effects.pixelate === undefined || isAvatarPixelEffect(scene.effects.pixelate)) &&
    isBoolean(scene.effects.showAvatarShadow) &&
    isBoolean(scene.effects.showFaceShadow) && isBoolean(scene.effects.showOutline) &&
    isRecord(scene.entity) && hasOnlyKeys(scene.entity, ['parts', 'preset']) &&
    hasOwnKeys(scene.entity, ['parts', 'preset']) &&
    isDenseArray<AvatarEntityPart>(scene.entity.parts) &&
    scene.entity.parts.every(isAvatarEntityPart) &&
    new Set(scene.entity.parts.map(part => part.id)).size === scene.entity.parts.length &&
    (scene.entity.parts.length === 0 || scene.entity.parts.filter(part => part.face).length === 1) &&
    decalTargetsAreValid &&
    isOneOf(scene.entity.preset, AVATAR_ENTITY_PRESET_VALUES) &&
    isAvatarFace(scene.face) && isOneOf(scene.interactionMode, ['move', 'rotate']) &&
    isRecord(scene.lighting) && hasOnlyKeys(scene.lighting, [
      'azimuth',
      'distance',
      'elevation',
      'enabled',
      'gridDensity'
    ]) && hasOwnKeys(scene.lighting, [
      'azimuth',
      'distance',
      'elevation',
      'enabled',
      'gridDensity'
    ]) && isFiniteInRange(scene.lighting.azimuth, AVATAR_LIGHTING_RANGES.azimuth) &&
    isFiniteInRange(scene.lighting.distance, AVATAR_LIGHTING_RANGES.distance) &&
    isFiniteInRange(scene.lighting.elevation, AVATAR_LIGHTING_RANGES.elevation) &&
    isBoolean(scene.lighting.enabled) &&
    isFiniteInRange(scene.lighting.gridDensity, AVATAR_LIGHTING_RANGES.gridDensity) &&
    isAvatarView(scene.view)
}

export const isAvatarDefinition = (value: unknown): value is AvatarDefinition => {
  try {
    return isAvatarDefinitionValue(value)
  } catch {
    return false
  }
}

export const parseAvatarDefinition = (input: unknown): AvatarDefinition => {
  let inputValue: unknown
  try {
    inputValue = typeof input === 'string' ? JSON.parse(input) : input
  } catch {
    throw new TypeError('Invalid OneWorks Avatar definition')
  }
  if (!isAvatarDefinition(inputValue)) throw new TypeError('Invalid OneWorks Avatar definition')
  let value: unknown
  try {
    value = structuredClone(inputValue)
  } catch {
    throw new TypeError('Invalid OneWorks Avatar definition')
  }
  if (!isAvatarDefinition(value)) throw new TypeError('Invalid OneWorks Avatar definition')
  return value
}

export const serializeAvatarDefinition = (definition: AvatarDefinition) => {
  if (!isAvatarDefinition(definition)) throw new TypeError('Invalid OneWorks Avatar definition')
  let value: unknown
  try {
    value = structuredClone(definition)
  } catch {
    throw new TypeError('Invalid OneWorks Avatar definition')
  }
  if (!isAvatarDefinition(value)) throw new TypeError('Invalid OneWorks Avatar definition')
  return `${JSON.stringify(value, null, 2)}\n`
}

export const mergeAvatarAnimationLibraries = (
  libraries: readonly AvatarAnimationLibrary[]
): readonly AvatarAnimationLibrary[] => {
  const merged = new Map<string, AvatarAnimationLibrary>()
  libraries.forEach(library => merged.set(library.id, library))
  return [...merged.values()]
}

export const resolveAvatarAnimationClip = (
  libraries: readonly AvatarAnimationLibrary[],
  reference: AvatarAnimationRef
): AvatarAnimationClip | null => (
  libraries.find(library => library.id === reference.libraryId)
    ?.groups[reference.groupId]
    ?.clips[reference.clipId] ?? null
)

export const anchorAvatarAnimationClip = (
  definition: AvatarDefinition,
  clip: AvatarAnimationClip
): AvatarAnimationClip => {
  if (clip.anchor === 'absolute' || clip.keyframes.length === 0) return clip
  const ordered = [...clip.keyframes].sort((a, b) => a.atMs - b.atMs)
  const viewKeys = ['pitch', 'positionX', 'positionY', 'yaw'] as const
  const delta = Object.fromEntries(viewKeys.map(key => {
    const first = ordered.find(frame => frame.patch.view?.[key] != null)
    const authored = first?.patch.view?.[key]
    return [key, authored == null ? 0 : definition.scene.view[key] - authored]
  })) as Record<(typeof viewKeys)[number], number>
  return {
    ...clip,
    anchor: 'absolute',
    keyframes: clip.keyframes.map(frame => ({
      ...frame,
      patch: {
        ...frame.patch,
        ...(frame.patch.view == null
          ? {}
          : {
            view: Object.fromEntries(
              Object.entries(frame.patch.view).map(([key, value]) => [
                key,
                value + delta[key as keyof typeof delta]
              ])
            )
          })
      }
    }))
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress

export const easeAvatarAnimationProgress = (progress: number, easing: AvatarAnimationEasing = 'linear') => {
  const value = clamp(progress, 0, 1)
  if (easing === 'ease-in') return value * value
  if (easing === 'ease-out') return 1 - (1 - value) ** 2
  if (easing === 'ease-in-out') return value < .5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2
  return value
}

export const applyAvatarEntityPartTransforms = (
  parts: readonly AvatarEntityPart[],
  transforms?: AvatarEntityPartTransforms
): readonly AvatarEntityPart[] => {
  if (transforms == null) return parts
  return parts.map(part => {
    const transform = transforms[part.id]
    return transform == null ? part : { ...part, ...transform }
  })
}

export const applyAvatarScenePatch = (scene: AvatarScene, patch: AvatarScenePatch): AvatarScene => ({
  ...scene,
  entity: {
    ...scene.entity,
    parts: applyAvatarEntityPartTransforms(scene.entity.parts, patch.partTransforms)
  },
  effects: {
    ...scene.effects,
    colorGrade: { ...scene.effects.colorGrade, ...patch.colorGrade }
  },
  face: {
    ...scene.face,
    ...patch.face,
    ...(patch.face?.eyeHighlight == null
      ? {}
      : { eyeHighlight: { ...scene.face.eyeHighlight, ...patch.face.eyeHighlight } })
  },
  view: { ...scene.view, ...patch.view }
})

const interpolateRecord = <T extends object>(from: T, to: T, progress: number): T => {
  const fromRecord = from as Record<string, unknown>
  const toRecord = to as Record<string, unknown>
  const result: Record<string, unknown> = { ...fromRecord }
  Object.keys(toRecord).forEach(key => {
    const fromValue = fromRecord[key]
    const toValue = toRecord[key]
    if (typeof fromValue === 'number' && typeof toValue === 'number') {
      result[key] = interpolate(fromValue, toValue, progress)
    } else {
      result[key] = progress < 1 ? fromValue : toValue
    }
  })
  return result as T
}

const hiddenAnimationShape = (shape: AvatarAnimationShape): AvatarAnimationShape => ({
  ...shape,
  height: 0,
  opacity: 0,
  width: 0
})

const interpolateAnimationShapes = (
  from: readonly AvatarAnimationShape[] | undefined,
  to: readonly AvatarAnimationShape[] | undefined,
  progress: number
): readonly AvatarAnimationShape[] | undefined => {
  if ((from == null || from.length === 0) && (to == null || to.length === 0)) return undefined
  const fromById = new Map(from?.map(shape => [shape.id, shape]) ?? [])
  const toById = new Map(to?.map(shape => [shape.id, shape]) ?? [])
  const ids = [...new Set([...(from?.map(shape => shape.id) ?? []), ...(to?.map(shape => shape.id) ?? [])])]
  return ids.map(id => {
    const fromShape = fromById.get(id)
    const toShape = toById.get(id)
    const source = fromShape ?? hiddenAnimationShape(toShape!)
    const target = toShape ?? hiddenAnimationShape(fromShape!)
    return {
      color: progress < 1 ? source.color : target.color,
      height: interpolate(source.height, target.height, progress),
      id,
      kind: progress < 1 ? source.kind : target.kind,
      opacity: interpolate(source.opacity, target.opacity, progress),
      rotation: interpolate(source.rotation, target.rotation, progress),
      roundness: interpolate(source.roundness, target.roundness, progress),
      width: interpolate(source.width, target.width, progress),
      x: interpolate(source.x, target.x, progress),
      y: interpolate(source.y, target.y, progress)
    }
  })
}

const interpolateAnimationPartTransform = (
  source: AvatarAnimationEntityPart,
  target: AvatarAnimationEntityPart,
  progress: number
): AvatarEntityPartTransform => Object.fromEntries(
  (['rotationZ', 'scaleX', 'scaleY', 'scaleZ', 'x', 'y', 'z'] as const).map(key => {
    const sourceValue = source.transform?.[key] ?? source.part[key] ?? (
      key === 'scaleZ' ? Math.min(source.part.scaleX, source.part.scaleY) : 0
    )
    const targetValue = target.transform?.[key] ?? target.part[key] ?? (
      key === 'scaleZ' ? Math.min(target.part.scaleX, target.part.scaleY) : 0
    )
    return [key, interpolate(sourceValue, targetValue, progress)]
  })
)

const hiddenAnimationEntityPart = (
  item: AvatarAnimationEntityPart
): AvatarAnimationEntityPart => ({ ...item, opacity: 0 })

const interpolateAnimationEntityParts = (
  from: readonly AvatarAnimationEntityPart[] | undefined,
  to: readonly AvatarAnimationEntityPart[] | undefined,
  progress: number
): readonly AvatarAnimationEntityPart[] | undefined => {
  if ((from == null || from.length === 0) && (to == null || to.length === 0)) return undefined
  const fromById = new Map(from?.map(item => [item.part.id, item]) ?? [])
  const toById = new Map(to?.map(item => [item.part.id, item]) ?? [])
  const ids = [...new Set([
    ...(from?.map(item => item.part.id) ?? []),
    ...(to?.map(item => item.part.id) ?? [])
  ])]
  return ids.map(id => {
    const fromItem = fromById.get(id)
    const toItem = toById.get(id)
    const source = fromItem ?? hiddenAnimationEntityPart(toItem!)
    const target = toItem ?? hiddenAnimationEntityPart(fromItem!)
    return {
      ...(source.composition == null && target.composition == null
        ? {}
        : { composition: progress < 1 ? source.composition : target.composition }),
      opacity: interpolate(source.opacity, target.opacity, progress),
      part: progress < 1 ? source.part : target.part,
      transform: interpolateAnimationPartTransform(source, target, progress)
    }
  })
}

const interpolatePartShapeMorphs = (
  from: AvatarEntityPartShapeMorphs | undefined,
  to: AvatarEntityPartShapeMorphs | undefined,
  progress: number
): AvatarEntityPartShapeMorphs | undefined => {
  if (from == null && to == null) return undefined
  const ids = [...new Set([...Object.keys(from ?? {}), ...Object.keys(to ?? {})])]
  return Object.fromEntries(ids.map(id => {
    const source = from?.[id] ?? { ...to![id]!, progress: 0 }
    const target = to?.[id] ?? { ...from![id]!, progress: 0 }
    return [id, {
      fromShape: progress < 1 ? source.fromShape : target.fromShape,
      progress: interpolate(source.progress, target.progress, progress),
      toShape: progress < 1 ? source.toShape : target.toShape
    }]
  }))
}

const interpolateScene = (from: AvatarScene, to: AvatarScene, progress: number): AvatarScene => {
  const face = interpolateRecord(from.face, to.face, progress)
  const toParts = new Map(to.entity.parts.map(part => [part.id, part]))
  return {
    ...from,
    entity: {
      ...from.entity,
      parts: from.entity.parts.map(part => {
        const target = toParts.get(part.id)
        if (target == null) return part
        const interpolated = interpolateRecord(part, target, progress)
        if (part.scaleZ == null && target.scaleZ == null) return interpolated
        return {
          ...interpolated,
          scaleZ: interpolate(
            part.scaleZ ?? Math.min(part.scaleX, part.scaleY),
            target.scaleZ ?? Math.min(target.scaleX, target.scaleY),
            progress
          )
        }
      })
    },
    effects: {
      ...from.effects,
      colorGrade: interpolateRecord(from.effects.colorGrade, to.effects.colorGrade, progress)
    },
    face: {
      ...face,
      eyeHighlight: interpolateRecord(from.face.eyeHighlight, to.face.eyeHighlight, progress)
    },
    view: interpolateRecord(from.view, to.view, progress)
  }
}

const resolveScenePartTransforms = (
  base: readonly AvatarEntityPart[],
  resolved: readonly AvatarEntityPart[]
): AvatarEntityPartTransforms | undefined => {
  const baseById = new Map(base.map(part => [part.id, part]))
  const transforms = Object.fromEntries(resolved.flatMap(part => {
    const source = baseById.get(part.id)
    if (source == null) return []
    const transform: Record<string, number> = {}
    for (const key of ['rotationZ', 'scaleX', 'scaleY', 'scaleZ', 'x', 'y', 'z'] as const) {
      const sourceValue = key === 'rotationZ'
        ? source[key] ?? 0
        : key === 'scaleZ'
        ? source.scaleZ ?? Math.min(source.scaleX, source.scaleY)
        : source[key]
      const resolvedValue = key === 'rotationZ'
        ? part[key] ?? 0
        : key === 'scaleZ'
        ? part.scaleZ ?? Math.min(part.scaleX, part.scaleY)
        : part[key]
      if (sourceValue !== resolvedValue) transform[key] = resolvedValue
    }
    return Object.keys(transform).length === 0 ? [] : [[part.id, transform]]
  })) as AvatarEntityPartTransforms
  return Object.keys(transforms).length === 0 ? undefined : transforms
}

const resolveFaceResourceClaims = (face: Partial<AvatarFace>): readonly AvatarAnimationResourceClaim[] => (
  Object.keys(face).flatMap(key => {
    if (key === 'height') return ['face:leftEye.height', 'face:rightEye.height']
    if (key === 'width') return ['face:leftEye.width', 'face:rightEye.width']
    if (key === 'rotation') return ['face:leftEye.rotation', 'face:rightEye.rotation']
    if (key === 'eyeShape') return ['face:leftEye.shape', 'face:rightEye.shape']
    if (key === 'leftEyeHeight') return ['face:leftEye.height']
    if (key === 'rightEyeHeight') return ['face:rightEye.height']
    if (key === 'leftEyeWidth') return ['face:leftEye.width']
    if (key === 'rightEyeWidth') return ['face:rightEye.width']
    if (key === 'leftEyeRotation') return ['face:leftEye.rotation']
    if (key === 'rightEyeRotation') return ['face:rightEye.rotation']
    if (key === 'leftEyeShape') return ['face:leftEye.shape']
    if (key === 'rightEyeShape') return ['face:rightEye.shape']
    if (key === 'eyeHighlight' && face.eyeHighlight != null) {
      return Object.keys(face.eyeHighlight).map(field => `face:eyeHighlight.${field}`)
    }
    return [`face:${key}`]
  })
)

export const resolveAvatarScenePatchWrites = (
  patch: AvatarScenePatch
): readonly AvatarAnimationResourceClaim[] => [...new Set([
  ...Object.keys(patch.colorGrade ?? {}).map(key => `effect:colorGrade.${key}`),
  ...resolveFaceResourceClaims(patch.face ?? {}),
  ...Object.entries(patch.partTransforms ?? {}).flatMap(([partId, transform]) => (
    Object.keys(transform).map(field => `part:${partId}.transform.${field}`)
  )),
  ...Object.keys(patch.partShapeMorphs ?? {}).map(partId => `part:${partId}.shapeMorph`),
  ...Object.keys(patch.view ?? {}).map(key => `view:${key}`),
  ...(patch.auxiliaryParts ?? []).map(item => `aux:${item.part.id}`),
  ...(patch.auxiliaryShapes ?? []).map(shape => `shape:${shape.id}`)
])].sort()

const avatarAnimationClaimAllows = (
  declared: AvatarAnimationResourceClaim,
  actual: AvatarAnimationResourceClaim
) => declared === actual || actual.startsWith(`${declared}.`)

export const assertAvatarAnimationClaims = (
  declared: readonly AvatarAnimationResourceClaim[] | undefined,
  actual: readonly AvatarAnimationResourceClaim[]
) => {
  if (declared == null) return
  const undeclared = actual.filter(resource => !declared.some(claim => avatarAnimationClaimAllows(claim, resource)))
  if (undeclared.length > 0) {
    throw new TypeError(`OneWorks Avatar animation wrote undeclared resources: ${undeclared.join(', ')}`)
  }
}

const resolveParameterizedAuxiliaryParts = (
  clip: AvatarAnimationClip,
  items: readonly AvatarAnimationEntityPart[] | undefined,
  parameterValues: AvatarAnimationParameterValues | undefined
) => {
  if (items == null || items.length === 0 || clip.parameters == null) return items
  const values = resolveAvatarAnimationParameterValues(clip, parameterValues)
  const materialByPartId = new Map<string, ReturnType<typeof resolveAvatarAnimationColorMaterial>>()
  clip.parameters.forEach(parameter => {
    if (parameter.type !== 'color' || parameter.binding?.type !== 'auxiliary-part-material') return
    materialByPartId.set(
      parameter.binding.partId,
      resolveAvatarAnimationColorMaterial(values[parameter.id] as string)
    )
  })
  if (materialByPartId.size === 0) return items
  return items.map(item => {
    const material = materialByPartId.get(item.part.id)
    return material == null ? item : { ...item, part: { ...item.part, ...material } }
  })
}

type AvatarAnimationResourceValue = AvatarAnimationEntityPart | AvatarAnimationShape |
  AvatarEntityPartShapeMorph | AvatarAnimationParameterValue

interface ResolvedAvatarAnimationSparseState {
  readonly elapsedMs: number
  readonly finished: boolean
  readonly progress: number
  readonly resources: ReadonlyMap<AvatarAnimationResourceClaim, AvatarAnimationResourceValue>
  readonly resourceWeights: ReadonlyMap<AvatarAnimationResourceClaim, number>
}

const setFacePatchResources = (
  resources: Map<AvatarAnimationResourceClaim, AvatarAnimationResourceValue>,
  face: Partial<AvatarFace>
) => {
  const sharedEyeFields = {
    eyeShape: ['shape', face.eyeShape],
    height: ['height', face.height],
    rotation: ['rotation', face.rotation],
    width: ['width', face.width]
  } as const
  Object.values(sharedEyeFields).forEach(([field, value]) => {
    if (value == null) return
    resources.set(`face:leftEye.${field}`, value)
    resources.set(`face:rightEye.${field}`, value)
  })
  Object.entries(face).forEach(([key, value]) => {
    if (value == null) return
    if (key === 'height' || key === 'width' || key === 'rotation' || key === 'eyeShape') return
    if (key === 'leftEyeHeight') resources.set('face:leftEye.height', value as number)
    else if (key === 'rightEyeHeight') resources.set('face:rightEye.height', value as number)
    else if (key === 'leftEyeWidth') resources.set('face:leftEye.width', value as number)
    else if (key === 'rightEyeWidth') resources.set('face:rightEye.width', value as number)
    else if (key === 'leftEyeRotation') resources.set('face:leftEye.rotation', value as number)
    else if (key === 'rightEyeRotation') resources.set('face:rightEye.rotation', value as number)
    else if (key === 'leftEyeShape') resources.set('face:leftEye.shape', value as string)
    else if (key === 'rightEyeShape') resources.set('face:rightEye.shape', value as string)
    else if (key === 'eyeHighlight' && isRecord(value)) {
      Object.entries(value).forEach(([field, fieldValue]) => {
        resources.set(`face:eyeHighlight.${field}`, fieldValue as AvatarAnimationParameterValue)
      })
    } else resources.set(`face:${key}`, value as AvatarAnimationParameterValue)
  })
}

const applyPatchToResourceMap = (
  current: ReadonlyMap<AvatarAnimationResourceClaim, AvatarAnimationResourceValue>,
  patch: AvatarScenePatch
) => {
  const next = new Map(current)
  patch.release?.forEach(resource => next.delete(resource))
  Object.entries(patch.colorGrade ?? {}).forEach(([key, value]) => {
    if (value != null) next.set(`effect:colorGrade.${key}`, value)
  })
  setFacePatchResources(next, patch.face ?? {})
  Object.entries(patch.partTransforms ?? {}).forEach(([partId, transform]) => {
    Object.entries(transform).forEach(([field, value]) => {
      if (value != null) next.set(`part:${partId}.transform.${field}`, value)
    })
  })
  Object.entries(patch.partShapeMorphs ?? {}).forEach(([partId, morph]) => {
    next.set(`part:${partId}.shapeMorph`, morph)
  })
  Object.entries(patch.view ?? {}).forEach(([key, value]) => {
    if (value != null) next.set(`view:${key}`, value)
  })
  patch.auxiliaryParts?.forEach(item => next.set(`aux:${item.part.id}`, item))
  patch.auxiliaryShapes?.forEach(shape => next.set(`shape:${shape.id}`, shape))
  return next
}

const interpolateAvatarAnimationHexColor = (from: string, to: string, progress: number) => {
  if (progress <= 0) return from
  if (progress >= 1) return to
  const fromValue = Number.parseInt(from.slice(1), 16)
  const toValue = Number.parseInt(to.slice(1), 16)
  return `#${[16, 8, 0].map(shift => Math.round(interpolate(
    (fromValue >> shift) & 0xff,
    (toValue >> shift) & 0xff,
    progress
  )).toString(16).padStart(2, '0')).join('')}`
}

const interpolateAvatarAnimationResourceValue = (
  resource: AvatarAnimationResourceClaim,
  from: AvatarAnimationResourceValue,
  to: AvatarAnimationResourceValue,
  progress: number
): AvatarAnimationResourceValue => {
  if (progress <= 0) return from
  if (progress >= 1) return to
  if (typeof from === 'number' && typeof to === 'number') return interpolate(from, to, progress)
  if (
    typeof from === 'string' && typeof to === 'string' &&
    /^#[\da-f]{6}$/iu.test(from) && /^#[\da-f]{6}$/iu.test(to)
  ) return interpolateAvatarAnimationHexColor(from, to, progress)
  if (resource.startsWith('aux:')) {
    return interpolateAnimationEntityParts(
      [from as AvatarAnimationEntityPart],
      [to as AvatarAnimationEntityPart],
      progress
    )![0]!
  }
  if (resource.startsWith('shape:')) {
    return interpolateAnimationShapes(
      [from as AvatarAnimationShape],
      [to as AvatarAnimationShape],
      progress
    )![0]!
  }
  if (resource.endsWith('.shapeMorph')) {
    const result = interpolatePartShapeMorphs(
      { value: from as AvatarEntityPartShapeMorph },
      { value: to as AvatarEntityPartShapeMorph },
      progress
    )
    return result!.value!
  }
  return progress < .5 ? from : to
}

const resolveAvatarAnimationSparseState = (
  clip: AvatarAnimationClip,
  elapsedMs: number,
  options: AvatarAnimationResolveOptions
): ResolvedAvatarAnimationSparseState => {
  const authored = [...clip.keyframes].sort((a, b) => a.atMs - b.atMs)
  const ordered: readonly AvatarAnimationKeyframe[] = authored[0]?.atMs > 0
    ? [{ atMs: 0, easing: authored[0]!.easing, patch: {} }, ...authored]
    : authored
  const buildStates = (
    initial: ReadonlyMap<AvatarAnimationResourceClaim, AvatarAnimationResourceValue>
  ) => {
    const resolved: ReadonlyMap<AvatarAnimationResourceClaim, AvatarAnimationResourceValue>[] = []
    let state = new Map(initial)
    ordered.forEach(frame => {
      state = applyPatchToResourceMap(state, frame.patch)
      resolved.push(state)
    })
    return resolved
  }
  let states = buildStates(new Map())
  if (clip.playback === 'loop') states = buildStates(states.at(-1) ?? new Map())
  const requested = Math.max(elapsedMs, 0)
  const finished = clip.playback === 'once' && requested >= clip.durationMs
  const timeline = clip.playback === 'loop'
    ? requested % clip.durationMs
    : Math.min(requested, clip.durationMs)
  let fromIndex = 0
  ordered.forEach((frame, index) => {
    if (frame.atMs <= timeline) fromIndex = index
  })
  const fromFrame = ordered[fromIndex]!
  const nextFrame = ordered[fromIndex + 1] ?? (clip.playback === 'loop' ? ordered[0] : undefined)
  const fromState = states[fromIndex] ?? new Map()
  if (nextFrame == null) {
    const parameterized = new Map(fromState)
    for (const [resource, value] of parameterized) {
      if (!resource.startsWith('aux:')) continue
      const resolved = resolveParameterizedAuxiliaryParts(clip, [value as AvatarAnimationEntityPart], options.parameterValues)
      parameterized.set(resource, resolved![0]!)
    }
    const writes = [...parameterized.keys()].sort()
    assertAvatarAnimationClaims(clip.resourceClaims, writes)
    return {
      elapsedMs: timeline,
      finished,
      progress: 1,
      resources: parameterized,
      resourceWeights: new Map(writes.map(resource => [resource, 1]))
    }
  }
  const toIndex = fromIndex + 1 < ordered.length ? fromIndex + 1 : 0
  const toState = states[toIndex] ?? new Map()
  const span = Math.max(
    toIndex === 0
      ? clip.durationMs - fromFrame.atMs + nextFrame.atMs
      : nextFrame.atMs - fromFrame.atMs,
    1
  )
  const rawProgress = toIndex === 0
    ? (timeline - fromFrame.atMs) / span
    : (timeline - fromFrame.atMs) / span
  const progress = easeAvatarAnimationProgress(rawProgress, nextFrame.easing)
  const resources = new Map<AvatarAnimationResourceClaim, AvatarAnimationResourceValue>()
  const resourceWeights = new Map<AvatarAnimationResourceClaim, number>()
  const keys = new Set([...fromState.keys(), ...toState.keys()])
  keys.forEach(resource => {
    const from = fromState.get(resource)
    const to = toState.get(resource)
    if (from != null && to != null) {
      resources.set(resource, interpolateAvatarAnimationResourceValue(resource, from, to, progress))
      resourceWeights.set(resource, 1)
    } else if (from != null) {
      resources.set(resource, from)
      resourceWeights.set(resource, 1 - progress)
    } else if (to != null) {
      resources.set(resource, to)
      resourceWeights.set(resource, progress)
    }
  })
  for (const [resource, value] of resources) {
    if (!resource.startsWith('aux:')) continue
    const resolved = resolveParameterizedAuxiliaryParts(clip, [value as AvatarAnimationEntityPart], options.parameterValues)
    resources.set(resource, resolved![0]!)
  }
  const writes = [...resources.keys()].filter(resource => (resourceWeights.get(resource) ?? 0) > 0).sort()
  assertAvatarAnimationClaims(clip.resourceClaims, writes)
  return { elapsedMs: timeline, finished, progress, resources, resourceWeights }
}

interface MutableAvatarAnimationComposition {
  auxiliaryParts: AvatarAnimationEntityPart[]
  auxiliaryShapes: AvatarAnimationShape[]
  partShapeMorphs: Record<string, AvatarEntityPartShapeMorph>
  scene: AvatarScene
}

const createAvatarAnimationComposition = (definition: AvatarDefinition): MutableAvatarAnimationComposition => ({
  auxiliaryParts: [],
  auxiliaryShapes: [],
  partShapeMorphs: {},
  scene: {
    ...definition.scene,
    effects: {
      ...definition.scene.effects,
      colorGrade: { ...definition.scene.effects.colorGrade }
    },
    entity: {
      ...definition.scene.entity,
      parts: definition.scene.entity.parts.map(part => ({ ...part }))
    },
    face: {
      ...definition.scene.face,
      eyeHighlight: { ...definition.scene.face.eyeHighlight }
    },
    view: { ...definition.scene.view }
  }
})

const blendAvatarAnimationValue = (
  lower: AvatarAnimationParameterValue,
  upper: AvatarAnimationParameterValue,
  weight: number
) => {
  if (weight <= 0) return lower
  if (weight >= 1) return upper
  if (typeof lower === 'number' && typeof upper === 'number') return interpolate(lower, upper, weight)
  if (
    typeof lower === 'string' && typeof upper === 'string' &&
    /^#[\da-f]{6}$/iu.test(lower) && /^#[\da-f]{6}$/iu.test(upper)
  ) return interpolateAvatarAnimationHexColor(lower, upper, weight)
  return weight < .5 ? lower : upper
}

const readAvatarAnimationResource = (
  composition: MutableAvatarAnimationComposition,
  resource: AvatarAnimationResourceClaim
): AvatarAnimationResourceValue | undefined => {
  const scene = composition.scene
  if (resource.endsWith('.shapeMorph')) {
    return composition.partShapeMorphs[resource.slice('part:'.length, -'.shapeMorph'.length)]
  }
  if (resource.startsWith('view:')) {
    const key = resource.slice('view:'.length) as keyof Pick<AvatarView, 'pitch' | 'positionX' | 'positionY' | 'yaw'>
    return scene.view[key]
  }
  if (resource.startsWith('effect:colorGrade.')) {
    return scene.effects.colorGrade[resource.slice('effect:colorGrade.'.length) as keyof AvatarColorGrade]
  }
  if (resource.startsWith('part:') && resource.includes('.transform.')) {
    const [partId, field] = resource.slice('part:'.length).split('.transform.') as [string, keyof AvatarEntityPartTransform]
    const part = scene.entity.parts.find(candidate => candidate.id === partId)
    if (part == null) return undefined
    return field === 'rotationZ'
      ? part.rotationZ ?? 0
      : field === 'scaleZ'
      ? part.scaleZ ?? Math.min(part.scaleX, part.scaleY)
      : part[field] as number
  }
  if (!resource.startsWith('face:')) return undefined
  const face = scene.face as unknown as Record<string, AvatarAnimationParameterValue>
  const field = resource.slice('face:'.length)
  const eyeField = field.match(/^(leftEye|rightEye)\.(height|rotation|shape|width)$/u)
  if (eyeField != null) {
    const prefix = eyeField[1]!
    const suffix = eyeField[2]!
    const key = `${prefix}${suffix[0]!.toUpperCase()}${suffix.slice(1)}`
    return face[key] ?? face[suffix === 'shape' ? 'eyeShape' : suffix]
  }
  if (field.startsWith('eyeHighlight.')) {
    return (scene.face.eyeHighlight as unknown as Record<string, AvatarAnimationParameterValue>)[
      field.slice('eyeHighlight.'.length)
    ]
  }
  return face[field]
}

const applyAvatarAnimationResource = (
  composition: MutableAvatarAnimationComposition,
  resource: AvatarAnimationResourceClaim,
  value: AvatarAnimationResourceValue,
  weight: number,
  namespace?: string,
  lowerValue?: AvatarAnimationResourceValue
) => {
  if (weight <= 0) return
  if (resource.startsWith('aux:')) {
    const item = value as AvatarAnimationEntityPart
    composition.auxiliaryParts.push({
      ...item,
      opacity: blendAvatarAnimationValue(0, item.opacity, weight) as number,
      part: {
        ...item.part,
        id: namespace == null
          ? item.part.id
          : `${encodeAvatarAnimationIdComponent(namespace)}/${encodeAvatarAnimationIdComponent(item.part.id)}`
      }
    })
    return
  }
  if (resource.startsWith('shape:')) {
    const shape = value as AvatarAnimationShape
    composition.auxiliaryShapes.push({
      ...shape,
      id: namespace == null
        ? shape.id
        : `${encodeAvatarAnimationIdComponent(namespace)}/${encodeAvatarAnimationIdComponent(shape.id)}`,
      opacity: blendAvatarAnimationValue(0, shape.opacity, weight) as number
    })
    return
  }
  if (resource.endsWith('.shapeMorph')) {
    const partId = resource.slice('part:'.length, -'.shapeMorph'.length)
    const upper = value as AvatarEntityPartShapeMorph
    const lower = lowerValue as AvatarEntityPartShapeMorph | undefined
    composition.partShapeMorphs[partId] = lower == null
      ? { ...upper, progress: blendAvatarAnimationValue(0, upper.progress, weight) as number }
      : {
          fromShape: weight < .5 ? lower.fromShape : upper.fromShape,
          progress: blendAvatarAnimationValue(lower.progress, upper.progress, weight) as number,
          toShape: weight < .5 ? lower.toShape : upper.toShape
        }
    return
  }
  const scene = composition.scene
  if (resource.startsWith('view:')) {
    const key = resource.slice('view:'.length) as keyof Pick<AvatarView, 'pitch' | 'positionX' | 'positionY' | 'yaw'>
    ;(scene.view as unknown as Record<string, AvatarAnimationParameterValue>)[key] = blendAvatarAnimationValue(
      (lowerValue ?? scene.view[key]) as AvatarAnimationParameterValue,
      value as AvatarAnimationParameterValue,
      weight
    )
    return
  }
  if (resource.startsWith('effect:colorGrade.')) {
    const key = resource.slice('effect:colorGrade.'.length) as keyof AvatarColorGrade
    ;(scene.effects.colorGrade as unknown as Record<string, AvatarAnimationParameterValue>)[key] = blendAvatarAnimationValue(
      (lowerValue ?? scene.effects.colorGrade[key]) as AvatarAnimationParameterValue,
      value as AvatarAnimationParameterValue,
      weight
    )
    return
  }
  if (resource.startsWith('part:') && resource.includes('.transform.')) {
    const [partId, field] = resource.slice('part:'.length).split('.transform.') as [string, keyof AvatarEntityPartTransform]
    const part = scene.entity.parts.find(candidate => candidate.id === partId)
    if (part == null) return
    const lower = (lowerValue as AvatarAnimationParameterValue | undefined) ?? (field === 'rotationZ'
      ? part.rotationZ ?? 0
      : field === 'scaleZ'
      ? part.scaleZ ?? Math.min(part.scaleX, part.scaleY)
      : part[field] as number)
    ;(part as unknown as Record<string, number>)[field] = blendAvatarAnimationValue(
      lower, value as number, weight
    ) as number
    return
  }
  if (!resource.startsWith('face:')) return
  const face = scene.face as unknown as Record<string, AvatarAnimationParameterValue>
  const field = resource.slice('face:'.length)
  const eyeField = field.match(/^(leftEye|rightEye)\.(height|rotation|shape|width)$/u)
  if (eyeField != null) {
    const prefix = eyeField[1]!
    const suffix = eyeField[2]!
    const key = `${prefix}${suffix[0]!.toUpperCase()}${suffix.slice(1)}`
    const fallbackKey = suffix === 'shape' ? 'eyeShape' : suffix
    const lower = (lowerValue as AvatarAnimationParameterValue | undefined) ?? face[key] ?? face[fallbackKey]
    face[key] = blendAvatarAnimationValue(lower!, value as AvatarAnimationParameterValue, weight)
    return
  }
  if (field.startsWith('eyeHighlight.')) {
    const key = field.slice('eyeHighlight.'.length)
    const highlight = scene.face.eyeHighlight as unknown as Record<string, AvatarAnimationParameterValue>
    highlight[key] = blendAvatarAnimationValue(
      ((lowerValue as AvatarAnimationParameterValue | undefined) ?? highlight[key])!,
      value as AvatarAnimationParameterValue,
      weight
    )
    return
  }
  face[field] = blendAvatarAnimationValue(
    ((lowerValue as AvatarAnimationParameterValue | undefined) ?? face[field])!,
    value as AvatarAnimationParameterValue,
    weight
  )
}

const encodeAvatarAnimationIdComponent = (value: string) => {
  let encoded = ''
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index)
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1)
      if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
        encoded += encodeURIComponent(value.slice(index, index + 2))
        index += 1
      } else encoded += `%u${codeUnit.toString(16).toUpperCase().padStart(4, '0')}`
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      encoded += `%u${codeUnit.toString(16).toUpperCase().padStart(4, '0')}`
    } else encoded += encodeURIComponent(value[index]!)
  }
  return encoded
}

const namespaceAvatarAnimationResource = (
  resource: AvatarAnimationResourceClaim,
  namespace?: string
): AvatarAnimationResourceClaim => {
  if (namespace == null) return resource
  if (resource.startsWith('aux:')) {
    return `aux:${encodeAvatarAnimationIdComponent(namespace)}/${encodeAvatarAnimationIdComponent(resource.slice('aux:'.length))}`
  }
  if (resource.startsWith('shape:')) {
    return `shape:${encodeAvatarAnimationIdComponent(namespace)}/${encodeAvatarAnimationIdComponent(resource.slice('shape:'.length))}`
  }
  return resource
}

const createResolvedAvatarAnimationFrame = (
  definition: AvatarDefinition,
  composition: MutableAvatarAnimationComposition,
  patch: AvatarScenePatch,
  elapsedMs: number,
  finished: boolean,
  progress: number,
  resourceWeights: ReadonlyMap<AvatarAnimationResourceClaim, number>
): ResolvedAvatarAnimationFrame => {
  const partTransforms = resolveScenePartTransforms(definition.scene.entity.parts, composition.scene.entity.parts)
  const weights = Object.fromEntries(resourceWeights)
  const writes = [...resourceWeights.entries()].filter(([, weight]) => weight > 0).map(([resource]) => resource).sort()
  return {
    ...(composition.auxiliaryParts.length === 0 ? {} : { auxiliaryParts: composition.auxiliaryParts }),
    ...(composition.auxiliaryShapes.length === 0 ? {} : { auxiliaryShapes: composition.auxiliaryShapes }),
    elapsedMs,
    finished,
    ...(Object.keys(composition.partShapeMorphs).length === 0
      ? {}
      : { partShapeMorphs: composition.partShapeMorphs }),
    ...(partTransforms == null ? {} : { partTransforms }),
    patch,
    progress,
    resourceWeights: weights,
    scene: composition.scene,
    writes
  }
}

const patchFromAvatarAnimationResources = (
  resources: ReadonlyMap<AvatarAnimationResourceClaim, AvatarAnimationResourceValue>
): AvatarScenePatch => {
  const auxiliaryParts: AvatarAnimationEntityPart[] = []
  const auxiliaryShapes: AvatarAnimationShape[] = []
  const colorGrade: Record<string, number> = {}
  const face: Record<string, unknown> = {}
  const partShapeMorphs: Record<string, AvatarEntityPartShapeMorph> = {}
  const partTransforms: Record<string, Record<string, number>> = {}
  const view: Record<string, number> = {}
  resources.forEach((value, resource) => {
    if (resource.startsWith('aux:')) auxiliaryParts.push(value as AvatarAnimationEntityPart)
    else if (resource.startsWith('shape:')) auxiliaryShapes.push(value as AvatarAnimationShape)
    else if (resource.startsWith('effect:colorGrade.')) {
      colorGrade[resource.slice('effect:colorGrade.'.length)] = value as number
    } else if (resource.startsWith('view:')) view[resource.slice('view:'.length)] = value as number
    else if (resource.endsWith('.shapeMorph')) {
      partShapeMorphs[resource.slice('part:'.length, -'.shapeMorph'.length)] = value as AvatarEntityPartShapeMorph
    } else if (resource.startsWith('part:') && resource.includes('.transform.')) {
      const [partId, field] = resource.slice('part:'.length).split('.transform.')
      partTransforms[partId!] ??= {}
      partTransforms[partId!]![field!] = value as number
    } else if (resource.startsWith('face:')) {
      const field = resource.slice('face:'.length)
      const eyeField = field.match(/^(leftEye|rightEye)\.(height|rotation|shape|width)$/u)
      if (eyeField != null) {
        const suffix = eyeField[2]!
        face[`${eyeField[1]}${suffix[0]!.toUpperCase()}${suffix.slice(1)}`] = value
      } else if (field.startsWith('eyeHighlight.')) {
        const eyeHighlight = (face.eyeHighlight ??= {}) as Record<string, unknown>
        eyeHighlight[field.slice('eyeHighlight.'.length)] = value
      } else face[field] = value
    }
  })
  return {
    ...(auxiliaryParts.length === 0 ? {} : { auxiliaryParts }),
    ...(auxiliaryShapes.length === 0 ? {} : { auxiliaryShapes }),
    ...(Object.keys(colorGrade).length === 0 ? {} : { colorGrade }),
    ...(Object.keys(face).length === 0 ? {} : { face: face as Partial<AvatarFace> }),
    ...(Object.keys(partShapeMorphs).length === 0 ? {} : { partShapeMorphs }),
    ...(Object.keys(partTransforms).length === 0 ? {} : { partTransforms }),
    ...(Object.keys(view).length === 0 ? {} : { view })
  }
}

export const resolveAvatarAnimationFrame = (
  definition: AvatarDefinition,
  clip: AvatarAnimationClip,
  elapsedMs: number,
  options: AvatarAnimationResolveOptions = {}
): ResolvedAvatarAnimationFrame => {
  const sparse = resolveAvatarAnimationSparseState(clip, elapsedMs, options)
  const composition = createAvatarAnimationComposition(definition)
  const lowerValues = new Map([...sparse.resources.keys()].map(resource => [
    resource,
    readAvatarAnimationResource(composition, resource)
  ]))
  sparse.resources.forEach((value, resource) => {
    applyAvatarAnimationResource(
      composition,
      resource,
      value,
      sparse.resourceWeights.get(resource) ?? 0,
      undefined,
      lowerValues.get(resource)
    )
  })
  return createResolvedAvatarAnimationFrame(
    definition,
    composition,
    patchFromAvatarAnimationResources(sparse.resources),
    sparse.elapsedMs,
    sparse.finished,
    sparse.progress,
    sparse.resourceWeights
  )
}

export const MAX_AVATAR_ANIMATION_TRACKS = 16

export const validateAvatarAnimationTracks = (tracks: readonly AvatarAnimationTrack[]) => {
  if (tracks.length > MAX_AVATAR_ANIMATION_TRACKS) {
    throw new TypeError(`OneWorks Avatar supports at most ${MAX_AVATAR_ANIMATION_TRACKS} animation tracks`)
  }
  const ids = new Set<string>()
  tracks.forEach(track => {
    if (
      track.trackId.trim().length === 0 || track.trackId !== track.trackId.trim() || ids.has(track.trackId) ||
      !Number.isFinite(track.elapsedMs) || track.elapsedMs < 0 ||
      !Number.isFinite(track.speed ?? 1) || (track.speed ?? 1) <= 0 ||
      !Number.isFinite(track.weight ?? 1) || (track.weight ?? 1) < 0 || (track.weight ?? 1) > 1 ||
      (track.muted !== undefined && typeof track.muted !== 'boolean') ||
      (track.preserveAuxiliaryPartIds !== undefined && typeof track.preserveAuxiliaryPartIds !== 'boolean') ||
      (track.solo !== undefined && typeof track.solo !== 'boolean')
    ) throw new TypeError('Invalid OneWorks Avatar animation track')
    ids.add(track.trackId)
  })
  return tracks
}

export const resolveAvatarAnimationTracks = (
  definition: AvatarDefinition,
  tracks: readonly AvatarAnimationTrack[]
): ResolvedAvatarAnimationFrame => {
  validateAvatarAnimationTracks(tracks)
  const hasSolo = tracks.some(track => track.solo === true && track.muted !== true)
  const active = tracks.filter(track => track.muted !== true && (!hasSolo || track.solo === true))
  const composition = createAvatarAnimationComposition(definition)
  const combinedWeights = new Map<AvatarAnimationResourceClaim, number>()
  const trackResourceWeights = new Map<
    string,
    Readonly<Record<AvatarAnimationResourceClaim, number>>
  >()
  const trackWrites = new Map<string, readonly AvatarAnimationResourceClaim[]>()
  let elapsedMs = 0
  let finished = active.length > 0
  let progress = 0
  active.forEach(track => {
    const sparse = resolveAvatarAnimationSparseState(
      track.clip,
      track.elapsedMs * (track.speed ?? 1),
      { parameterValues: track.parameterValues }
    )
    const trackWeight = track.weight ?? 1
    const namespace = track.preserveAuxiliaryPartIds === true ? undefined : track.trackId
    const effectiveWeights = new Map<AvatarAnimationResourceClaim, number>()
    sparse.resourceWeights.forEach((weight, resource) => {
      const effectiveWeight = weight * trackWeight
      if (effectiveWeight <= 0) return
      effectiveWeights.set(namespaceAvatarAnimationResource(resource, namespace), effectiveWeight)
    })
    trackResourceWeights.set(track.trackId, Object.fromEntries(effectiveWeights))
    trackWrites.set(track.trackId, [...effectiveWeights.keys()].sort())
    const lowerValues = new Map([...sparse.resources.keys()].map(resource => [
      resource,
      readAvatarAnimationResource(composition, resource)
    ]))
    sparse.resources.forEach((value, resource) => {
      const weight = (sparse.resourceWeights.get(resource) ?? 0) * trackWeight
      applyAvatarAnimationResource(
        composition,
        resource,
        value,
        weight,
        namespace,
        lowerValues.get(resource)
      )
      if (weight > 0) combinedWeights.set(namespaceAvatarAnimationResource(resource, namespace), weight)
    })
    elapsedMs = Math.max(elapsedMs, sparse.elapsedMs)
    finished = finished && sparse.finished
    progress = Math.max(progress, sparse.progress)
  })
  const patch: AvatarScenePatch = {
    ...(composition.auxiliaryParts.length === 0 ? {} : { auxiliaryParts: composition.auxiliaryParts }),
    ...(composition.auxiliaryShapes.length === 0 ? {} : { auxiliaryShapes: composition.auxiliaryShapes }),
    ...(Object.keys(composition.partShapeMorphs).length === 0
      ? {}
      : { partShapeMorphs: composition.partShapeMorphs })
  }
  return {
    ...createResolvedAvatarAnimationFrame(
    definition,
    composition,
    patch,
    elapsedMs,
    finished,
    progress,
    combinedWeights
    ),
    trackResourceWeights: Object.fromEntries(trackResourceWeights),
    trackWrites: Object.fromEntries(trackWrites)
  }
}

export const AVATAR_ANIMATION_TIMELINE_VERSION = 1 as const
export const MAX_AVATAR_ANIMATION_TIMELINE_CLIPS = 256

const avatarAnimationTimelineClipEnd = (clip: AvatarAnimationTimelineClipInstance) => (
  clip.startMs + clip.durationMs
)

export const getAvatarAnimationTimelineContentEndMs = (
  timeline: AvatarAnimationTimeline
) => Math.max(
  0,
  ...timeline.tracks.flatMap(track => track.clips.map(avatarAnimationTimelineClipEnd))
)

const avatarAnimationTimelineClipsOverlap = (
  left: AvatarAnimationTimelineClipInstance,
  right: AvatarAnimationTimelineClipInstance
) => left.startMs < avatarAnimationTimelineClipEnd(right) &&
  right.startMs < avatarAnimationTimelineClipEnd(left)

const isSerializableAvatarAnimationParameterValues = (value: unknown) => (
  value === undefined || isRecord(value) && Object.entries(value).every(([id, field]) => (
    id.trim().length > 0 && (
      typeof field === 'boolean' || typeof field === 'string' || isFiniteNumber(field)
    )
  ))
)

const isAvatarAnimationTimelineSource = (value: unknown): value is AvatarAnimationTimelineClipSource => {
  if (!isRecord(value) || value.type !== 'inline' && value.type !== 'preset') return false
  if (value.type === 'inline') {
    return hasOnlyKeys(value, ['clip', 'type', 'version']) && value.version === 1 &&
      isAvatarAnimationClip(value.clip)
  }
  return hasOnlyKeys(value, ['fallback', 'presetId', 'presetVersion', 'type']) &&
    value.fallback === 'skip' && isString(value.presetId) && value.presetId.trim() === value.presetId &&
    value.presetId.length > 0 && isFiniteNumber(value.presetVersion) &&
    Number.isSafeInteger(value.presetVersion) && value.presetVersion > 0
}

const isAvatarAnimationTimelineFrameSequence = (
  value: unknown
): value is AvatarAnimationTimelineFrameSequence => {
  if (!isRecord(value) || !hasOnlyKeys(value, ['firstFrameIndex', 'lastFrameIndex', 'loop']) ||
    !hasOwnKeys(value, ['firstFrameIndex', 'lastFrameIndex']) ||
    !isFiniteNumber(value.firstFrameIndex) || !Number.isSafeInteger(value.firstFrameIndex) ||
    !isFiniteNumber(value.lastFrameIndex) || !Number.isSafeInteger(value.lastFrameIndex) ||
    value.firstFrameIndex < 0 || value.lastFrameIndex < value.firstFrameIndex) return false
  if (value.loop === undefined) return true
  if (!isRecord(value.loop) ||
    !hasOnlyKeys(value.loop, ['endFrameIndex', 'iterations', 'startFrameIndex']) ||
    !hasOwnKeys(value.loop, ['endFrameIndex', 'iterations', 'startFrameIndex']) ||
    !isFiniteNumber(value.loop.startFrameIndex) || !Number.isSafeInteger(value.loop.startFrameIndex) ||
    !isFiniteNumber(value.loop.endFrameIndex) || !Number.isSafeInteger(value.loop.endFrameIndex) ||
    value.loop.startFrameIndex < value.firstFrameIndex ||
    value.loop.endFrameIndex <= value.loop.startFrameIndex ||
    value.loop.endFrameIndex > value.lastFrameIndex) return false
  return value.loop.iterations === 'infinite' || (
    isFiniteNumber(value.loop.iterations) && Number.isSafeInteger(value.loop.iterations) &&
    value.loop.iterations >= 2
  )
}

interface ResolvedAvatarAnimationTimelineFrameSequence {
  readonly firstAtMs: number
  readonly lastAtMs: number
  readonly loop?: {
    readonly endAtMs: number
    readonly iterations: number | 'infinite'
    readonly spanMs: number
    readonly startAtMs: number
  }
  readonly virtualDurationMs: number
}

const resolveAvatarAnimationTimelineFrameSequenceDefinition = (
  sequence: AvatarAnimationTimelineFrameSequence,
  sourceClip: AvatarAnimationClip
): ResolvedAvatarAnimationTimelineFrameSequence => {
  const first = sourceClip.keyframes[sequence.firstFrameIndex]
  const last = sourceClip.keyframes[sequence.lastFrameIndex]
  if (first == null || last == null) {
    throw new TypeError('Invalid OneWorks Avatar animation timeline frame sequence')
  }
  if (sequence.loop == null) {
    return {
      firstAtMs: first.atMs,
      lastAtMs: last.atMs,
      virtualDurationMs: last.atMs - first.atMs
    }
  }
  const loopStart = sourceClip.keyframes[sequence.loop.startFrameIndex]
  const loopEnd = sourceClip.keyframes[sequence.loop.endFrameIndex]
  if (loopStart == null || loopEnd == null || loopEnd.atMs <= loopStart.atMs) {
    throw new TypeError('Invalid OneWorks Avatar animation timeline frame loop')
  }
  const spanMs = loopEnd.atMs - loopStart.atMs
  const loopDurationMs = sequence.loop.iterations === 'infinite'
    ? Infinity
    : spanMs * (sequence.loop.iterations * 2 - 1)
  return {
    firstAtMs: first.atMs,
    lastAtMs: last.atMs,
    loop: {
      endAtMs: loopEnd.atMs,
      iterations: sequence.loop.iterations,
      spanMs,
      startAtMs: loopStart.atMs
    },
    virtualDurationMs: loopStart.atMs - first.atMs + loopDurationMs +
      (sequence.loop.iterations === 'infinite' ? 0 : last.atMs - loopEnd.atMs)
  }
}

export interface AvatarAnimationTimelineSequenceNode {
  readonly sequenceTimeMs: number
  readonly sourceFrameIndex: number
}

const MAX_AVATAR_ANIMATION_TIMELINE_SEQUENCE_NODES = 256

const sampleIntegerRange = (start: number, end: number, limit: number): readonly number[] => {
  if (end < start || limit <= 0) return []
  const length = end - start + 1
  if (length <= limit) return Array.from({ length }, (_, index) => start + index)
  return Array.from({ length: limit }, (_, index) => (
    start + Math.round((end - start) * (index / Math.max(limit - 1, 1)))
  ))
}

const limitAvatarAnimationTimelineSequenceNodes = (
  nodes: readonly AvatarAnimationTimelineSequenceNode[]
): readonly AvatarAnimationTimelineSequenceNode[] => {
  const ordered = [...nodes].sort((first, second) => first.sequenceTimeMs - second.sequenceTimeMs)
  const unique = ordered.filter((node, index) => index === 0 || (
    node.sequenceTimeMs !== ordered[index - 1]!.sequenceTimeMs ||
    node.sourceFrameIndex !== ordered[index - 1]!.sourceFrameIndex
  ))
  if (unique.length <= MAX_AVATAR_ANIMATION_TIMELINE_SEQUENCE_NODES) return unique
  return sampleIntegerRange(
    0,
    unique.length - 1,
    MAX_AVATAR_ANIMATION_TIMELINE_SEQUENCE_NODES
  ).map(index => unique[index]!)
}

export const resolveAvatarAnimationTimelineSequenceNodes = (
  clip: AvatarAnimationTimelineClipInstance,
  sourceClip: AvatarAnimationClip
): readonly AvatarAnimationTimelineSequenceNode[] => {
  const playback = clip.playback ?? sourceClip.playback
  const visibleStartMs = clip.sourceOffsetMs
  const visibleEndMs = clip.sourceOffsetMs + clip.durationMs * clip.playbackRate
  const nodes: AvatarAnimationTimelineSequenceNode[] = []
  const push = (sourceFrameIndex: number, sequenceTimeMs: number) => {
    if (
      sequenceTimeMs >= visibleStartMs &&
      sequenceTimeMs <= visibleEndMs
    ) {
      nodes.push({ sequenceTimeMs, sourceFrameIndex })
    }
  }
  const pushLoopingSequence = (
    sourceFrameIndices: readonly number[],
    sequenceTimeForFrame: (sourceFrameIndex: number) => number,
    cycleDurationMs: number
  ) => {
    if (cycleDurationMs <= 0) return
    const firstCycle = Math.max(Math.floor(visibleStartMs / cycleDurationMs) - 1, 0)
    const lastCycle = Math.ceil(visibleEndMs / cycleDurationMs)
    const cycleSampleLimit = Math.max(
      Math.floor(MAX_AVATAR_ANIMATION_TIMELINE_SEQUENCE_NODES / Math.max(sourceFrameIndices.length, 1)),
      2
    )
    const sampledCycles = new Set(sampleIntegerRange(firstCycle, lastCycle, cycleSampleLimit))
    for (let offset = 0; offset <= 2; offset += 1) {
      if (firstCycle + offset <= lastCycle) sampledCycles.add(firstCycle + offset)
      if (lastCycle - offset >= firstCycle) sampledCycles.add(lastCycle - offset)
    }
    for (const cycle of [...sampledCycles].sort((first, second) => first - second)) {
      const cycleStartMs = cycle * cycleDurationMs
      for (const sourceFrameIndex of sourceFrameIndices) {
        push(sourceFrameIndex, cycleStartMs + sequenceTimeForFrame(sourceFrameIndex))
      }
    }
  }
  const sequence = clip.frameSequence
  if (sequence == null) {
    const sourceFrameIndices = sourceClip.keyframes.map((_, sourceFrameIndex) => sourceFrameIndex)
    if (playback === 'loop') {
      pushLoopingSequence(
        sourceFrameIndices,
        sourceFrameIndex => sourceClip.keyframes[sourceFrameIndex]!.atMs,
        sourceClip.durationMs
      )
    } else {
      for (const sourceFrameIndex of sourceFrameIndices) {
        push(sourceFrameIndex, sourceClip.keyframes[sourceFrameIndex]!.atMs)
      }
    }
    return limitAvatarAnimationTimelineSequenceNodes(nodes)
  }
  const resolved = resolveAvatarAnimationTimelineFrameSequenceDefinition(sequence, sourceClip)
  if (sequence.loop == null || resolved.loop == null) {
    const sourceFrameIndices = Array.from(
      { length: sequence.lastFrameIndex - sequence.firstFrameIndex + 1 },
      (_, offset) => sequence.firstFrameIndex + offset
    )
    if (playback === 'loop') {
      pushLoopingSequence(
        sourceFrameIndices,
        sourceFrameIndex => sourceClip.keyframes[sourceFrameIndex]!.atMs - resolved.firstAtMs,
        resolved.virtualDurationMs
      )
    } else {
      for (const sourceFrameIndex of sourceFrameIndices) {
        push(sourceFrameIndex, sourceClip.keyframes[sourceFrameIndex]!.atMs - resolved.firstAtMs)
      }
    }
    return limitAvatarAnimationTimelineSequenceNodes(nodes)
  }

  for (let index = sequence.firstFrameIndex; index <= sequence.loop.startFrameIndex; index += 1) {
    push(index, sourceClip.keyframes[index]!.atMs - resolved.firstAtMs)
  }
  let cursorMs = resolved.loop.startAtMs - resolved.firstAtMs
  const requestedIterations = sequence.loop.iterations === 'infinite'
    ? Math.max(Math.floor((visibleEndMs - cursorMs) /
        Math.max(resolved.loop.spanMs * 2, 1)) + 1, 1)
    : sequence.loop.iterations
  const loopFramesPerIteration = Math.max(
    sequence.loop.endFrameIndex - sequence.loop.startFrameIndex,
    1
  ) * 2
  const iterationSampleLimit = Math.max(
    Math.floor(MAX_AVATAR_ANIMATION_TIMELINE_SEQUENCE_NODES / loopFramesPerIteration),
    2
  )
  const firstVisibleIteration = Math.min(Math.max(
    Math.floor((visibleStartMs - cursorMs) / Math.max(resolved.loop.spanMs * 2, 1)) - 1,
    0
  ), requestedIterations - 1)
  const lastVisibleIteration = Math.min(Math.max(
    Math.floor((visibleEndMs - cursorMs) / Math.max(resolved.loop.spanMs * 2, 1)) + 1,
    firstVisibleIteration
  ), requestedIterations - 1)
  const sampledIterations = new Set(sampleIntegerRange(
    firstVisibleIteration,
    lastVisibleIteration,
    iterationSampleLimit
  ))
  for (let offset = 0; offset <= 2; offset += 1) {
    if (firstVisibleIteration + offset <= lastVisibleIteration) {
      sampledIterations.add(firstVisibleIteration + offset)
    }
    if (lastVisibleIteration - offset >= firstVisibleIteration) {
      sampledIterations.add(lastVisibleIteration - offset)
    }
  }
  for (const iteration of [...sampledIterations].sort((first, second) => first - second)) {
    cursorMs = resolved.loop.startAtMs - resolved.firstAtMs + iteration * resolved.loop.spanMs * 2
    for (let index = sequence.loop.startFrameIndex + 1; index <= sequence.loop.endFrameIndex; index += 1) {
      push(index, cursorMs + sourceClip.keyframes[index]!.atMs - resolved.loop.startAtMs)
    }
    cursorMs += resolved.loop.spanMs
    if (iteration === requestedIterations - 1 && sequence.loop.iterations !== 'infinite') break
    for (let index = sequence.loop.endFrameIndex - 1; index >= sequence.loop.startFrameIndex; index -= 1) {
      push(index, cursorMs + resolved.loop.endAtMs - sourceClip.keyframes[index]!.atMs)
    }
    cursorMs += resolved.loop.spanMs
  }
  if (sequence.loop.iterations !== 'infinite') {
    cursorMs = resolved.loop.startAtMs - resolved.firstAtMs +
      resolved.loop.spanMs * (sequence.loop.iterations * 2 - 1)
    for (let index = sequence.loop.endFrameIndex + 1; index <= sequence.lastFrameIndex; index += 1) {
      push(index, cursorMs + sourceClip.keyframes[index]!.atMs - resolved.loop.endAtMs)
    }
  }
  return limitAvatarAnimationTimelineSequenceNodes(nodes)
}

const isAvatarAnimationTimelineClip = (value: unknown): value is AvatarAnimationTimelineClipInstance => {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'durationMs',
    'envelope',
    'frameSequence',
    'instanceId',
    'parameterValues',
    'playback',
    'playbackRate',
    'preserveAuxiliaryPartIds',
    'source',
    'sourceOffsetMs',
    'startMs',
    'weight'
  ]) || !hasOwnKeys(value, [
    'durationMs',
    'instanceId',
    'playbackRate',
    'source',
    'sourceOffsetMs',
    'startMs',
    'weight'
  ]) || !isString(value.instanceId) || value.instanceId.trim() !== value.instanceId ||
    value.instanceId.length === 0 || !isFiniteNumber(value.startMs) || value.startMs < 0 ||
    !isFiniteNumber(value.durationMs) || value.durationMs <= 0 ||
    !isFiniteNumber(value.sourceOffsetMs) || value.sourceOffsetMs < 0 ||
    !isFiniteNumber(value.playbackRate) || value.playbackRate <= 0 ||
    !isFiniteNumber(value.weight) || value.weight < 0 || value.weight > 1 ||
    (value.playback !== undefined && !isOneOf(value.playback, ['loop', 'once'])) ||
    (value.preserveAuxiliaryPartIds !== undefined && !isBoolean(value.preserveAuxiliaryPartIds)) ||
    (value.frameSequence !== undefined && !isAvatarAnimationTimelineFrameSequence(value.frameSequence)) ||
    !isSerializableAvatarAnimationParameterValues(value.parameterValues) ||
    !isAvatarAnimationTimelineSource(value.source)) return false
  if (value.envelope !== undefined) {
    if (!isRecord(value.envelope) || !hasOnlyKeys(value.envelope, ['fadeInMs', 'fadeOutMs'])) return false
    const fadeInMs = value.envelope.fadeInMs ?? 0
    const fadeOutMs = value.envelope.fadeOutMs ?? 0
    if (
      !isFiniteNumber(fadeInMs) || fadeInMs < 0 || !isFiniteNumber(fadeOutMs) || fadeOutMs < 0 ||
      fadeInMs + fadeOutMs > value.durationMs
    ) return false
  }
  if (value.source.type === 'inline') {
    const sourceDurationMs = value.source.clip.durationMs
    const playback = value.playback ?? value.source.clip.playback
    if (value.frameSequence != null && value.frameSequence.lastFrameIndex >= value.source.clip.keyframes.length) {
      return false
    }
    if (
      value.frameSequence == null && (
        value.sourceOffsetMs > sourceDurationMs ||
        playback === 'loop' && value.sourceOffsetMs >= sourceDurationMs
      )
    ) return false
    if (value.frameSequence != null) {
      try {
        const sequence = resolveAvatarAnimationTimelineFrameSequenceDefinition(
          value.frameSequence,
          value.source.clip
        )
        if (Number.isFinite(sequence.virtualDurationMs) && value.sourceOffsetMs > sequence.virtualDurationMs) {
          return false
        }
      } catch {
        return false
      }
    }
    try {
      resolveAvatarAnimationParameterValues(
        value.source.clip,
        value.parameterValues as AvatarAnimationParameterValues | undefined
      )
    } catch {
      return false
    }
  }
  return true
}

// Timeline values are immutable by contract. Validation is therefore cached by
// identity so the frame evaluator can stay O(tracks * log clips); every edit
// helper below returns a fresh timeline identity and validates that new value.
const validatedAvatarAnimationTimelines = new WeakSet<object>()

export const validateAvatarAnimationTimeline = (timeline: AvatarAnimationTimeline) => {
  if (
    !isRecord(timeline) || !hasOnlyKeys(timeline, ['durationMs', 'tracks', 'version']) ||
    timeline.version !== AVATAR_ANIMATION_TIMELINE_VERSION ||
    !isFiniteNumber(timeline.durationMs) || timeline.durationMs < 0 ||
    !isDenseArray<AvatarAnimationTimelineTrack>(timeline.tracks) ||
    timeline.tracks.length > MAX_AVATAR_ANIMATION_TRACKS
  ) throw new TypeError('Invalid OneWorks Avatar animation timeline')
  const trackIds = new Set<string>()
  const instanceIds = new Set<string>()
  let clipCount = 0
  let maxEndMs = 0
  timeline.tracks.forEach(track => {
    if (
      !isRecord(track) || !hasOnlyKeys(track, ['clips', 'muted', 'name', 'solo', 'trackId', 'weight']) ||
      !isString(track.trackId) || track.trackId.trim() !== track.trackId || track.trackId.length === 0 ||
      trackIds.has(track.trackId) || !isDenseArray<AvatarAnimationTimelineClipInstance>(track.clips) ||
      (track.muted !== undefined && !isBoolean(track.muted)) ||
      (track.solo !== undefined && !isBoolean(track.solo)) ||
      (track.name !== undefined && (!isString(track.name) || track.name.trim().length === 0)) ||
      (track.weight !== undefined && (!isFiniteNumber(track.weight) || track.weight < 0 || track.weight > 1))
    ) throw new TypeError('Invalid OneWorks Avatar animation timeline track')
    trackIds.add(track.trackId)
    let previous: AvatarAnimationTimelineClipInstance | undefined
    track.clips.forEach(clip => {
      if (!isAvatarAnimationTimelineClip(clip) || instanceIds.has(clip.instanceId)) {
        throw new TypeError('Invalid OneWorks Avatar animation timeline clip')
      }
      if (previous != null && (
        clip.startMs < previous.startMs || avatarAnimationTimelineClipsOverlap(previous, clip)
      )) throw new TypeError('Overlapping OneWorks Avatar animation timeline clips')
      instanceIds.add(clip.instanceId)
      previous = clip
      clipCount += 1
      maxEndMs = Math.max(maxEndMs, avatarAnimationTimelineClipEnd(clip))
    })
  })
  if (clipCount > MAX_AVATAR_ANIMATION_TIMELINE_CLIPS || timeline.durationMs < maxEndMs) {
    throw new TypeError('Invalid OneWorks Avatar animation timeline duration')
  }
  validatedAvatarAnimationTimelines.add(timeline)
  return timeline
}

export const normalizeAvatarAnimationTimeline = (timeline: AvatarAnimationTimeline): AvatarAnimationTimeline => {
  const tracks = timeline.tracks.map(track => ({
    ...track,
    clips: [...track.clips].sort((left, right) => (
      left.startMs - right.startMs || left.instanceId.localeCompare(right.instanceId)
    ))
  }))
  const maxEndMs = getAvatarAnimationTimelineContentEndMs({ ...timeline, tracks })
  const normalized = {
    ...timeline,
    durationMs: Math.max(timeline.durationMs, maxEndMs),
    tracks
  }
  validateAvatarAnimationTimeline(normalized)
  return normalized
}

export const migrateAvatarAnimationTrackToTimeline = (
  track: AvatarAnimationTrack
): AvatarAnimationTimelineTrack => {
  const playbackRate = track.speed ?? 1
  const rawSourceOffsetMs = track.elapsedMs * playbackRate
  const sourceOffsetMs = track.clip.playback === 'loop'
    ? rawSourceOffsetMs % track.clip.durationMs
    : Math.min(rawSourceOffsetMs, track.clip.durationMs)
  return {
    clips: [{
      durationMs: track.clip.durationMs / playbackRate,
      instanceId: `${track.trackId}-clip-1`,
      parameterValues: track.parameterValues,
      playbackRate,
      preserveAuxiliaryPartIds: track.preserveAuxiliaryPartIds,
      source: { clip: track.clip, type: 'inline', version: 1 },
      sourceOffsetMs,
      startMs: 0,
      weight: 1
    }],
    muted: track.muted,
    name: track.clip.label ?? track.trackId,
    solo: track.solo,
    trackId: track.trackId,
    weight: track.weight
  }
}

export const migrateAvatarAnimationTracksToTimeline = (
  tracks: readonly AvatarAnimationTrack[]
): AvatarAnimationTimeline => normalizeAvatarAnimationTimeline({
  durationMs: Math.max(0, ...tracks.map(track => track.clip.durationMs / (track.speed ?? 1))),
  tracks: tracks.map(migrateAvatarAnimationTrackToTimeline),
  version: AVATAR_ANIMATION_TIMELINE_VERSION
})

const findActiveAvatarAnimationTimelineClip = (
  clips: readonly AvatarAnimationTimelineClipInstance[],
  timelineTimeMs: number
) => {
  let low = 0
  let high = clips.length - 1
  let candidate: AvatarAnimationTimelineClipInstance | undefined
  while (low <= high) {
    const middle = (low + high) >>> 1
    const clip = clips[middle]!
    if (clip.startMs <= timelineTimeMs) {
      candidate = clip
      low = middle + 1
    } else high = middle - 1
  }
  return candidate != null && timelineTimeMs < avatarAnimationTimelineClipEnd(candidate)
    ? candidate
    : undefined
}

const resolveAvatarAnimationTimelineEnvelopeWeight = (
  clip: AvatarAnimationTimelineClipInstance,
  localTimeMs: number
) => {
  const fadeInMs = clip.envelope?.fadeInMs ?? 0
  const fadeOutMs = clip.envelope?.fadeOutMs ?? 0
  const fadeInWeight = fadeInMs === 0 ? 1 : Math.min(Math.max(localTimeMs / fadeInMs, 0), 1)
  const remainingMs = clip.durationMs - localTimeMs
  const fadeOutWeight = fadeOutMs === 0 ? 1 : Math.min(Math.max(remainingMs / fadeOutMs, 0), 1)
  return Math.min(fadeInWeight, fadeOutWeight)
}

const resolveAvatarAnimationTimelineSourceTime = (
  clip: AvatarAnimationTimelineClipInstance,
  sourceClip: AvatarAnimationClip,
  localTimeMs: number
) => {
  const playback = clip.playback ?? sourceClip.playback
  if (clip.frameSequence != null) {
    const sequence = resolveAvatarAnimationTimelineFrameSequenceDefinition(clip.frameSequence, sourceClip)
    const rawTimeMs = clip.sourceOffsetMs + localTimeMs * clip.playbackRate
    if (sequence.virtualDurationMs === 0) return sequence.firstAtMs
    if (sequence.loop == null) {
      const sequenceTimeMs = playback === 'loop'
        ? rawTimeMs % sequence.virtualDurationMs
        : Math.min(rawTimeMs, sequence.virtualDurationMs)
      return sequence.firstAtMs + sequenceTimeMs
    }
    const prefixDurationMs = sequence.loop.startAtMs - sequence.firstAtMs
    if (rawTimeMs <= prefixDurationMs) return sequence.firstAtMs + rawTimeMs
    if (sequence.loop.iterations === 'infinite') {
      const loopTimeMs = (rawTimeMs - prefixDurationMs) % (sequence.loop.spanMs * 2)
      return loopTimeMs <= sequence.loop.spanMs
        ? sequence.loop.startAtMs + loopTimeMs
        : sequence.loop.endAtMs - (loopTimeMs - sequence.loop.spanMs)
    }
    const loopDurationMs = sequence.loop.spanMs * (sequence.loop.iterations * 2 - 1)
    const timeAfterPrefixMs = rawTimeMs - prefixDurationMs
    if (timeAfterPrefixMs <= loopDurationMs) {
      const legIndex = Math.min(Math.floor(timeAfterPrefixMs / sequence.loop.spanMs),
        sequence.loop.iterations * 2 - 2)
      const legTimeMs = timeAfterPrefixMs - legIndex * sequence.loop.spanMs
      return legIndex % 2 === 0
        ? sequence.loop.startAtMs + legTimeMs
        : sequence.loop.endAtMs - legTimeMs
    }
    return Math.min(
      sequence.loop.endAtMs + timeAfterPrefixMs - loopDurationMs,
      sequence.lastAtMs
    )
  }
  if (
    clip.sourceOffsetMs > sourceClip.durationMs ||
    playback === 'loop' && clip.sourceOffsetMs >= sourceClip.durationMs
  ) throw new TypeError('Invalid OneWorks Avatar animation timeline source offset')
  const rawTimeMs = clip.sourceOffsetMs + localTimeMs * clip.playbackRate
  return playback === 'loop'
    ? rawTimeMs % sourceClip.durationMs
    : Math.min(rawTimeMs, sourceClip.durationMs)
}

export const resolveAvatarAnimationTimelineFrame = (
  definition: AvatarDefinition,
  timeline: AvatarAnimationTimeline,
  timelineTimeMs: number,
  resolvePreset?: AvatarAnimationTimelinePresetResolver
): ResolvedAvatarAnimationTimelineFrame => {
  if (!validatedAvatarAnimationTimelines.has(timeline)) validateAvatarAnimationTimeline(timeline)
  if (!isFiniteNumber(timelineTimeMs)) throw new TypeError('Invalid OneWorks Avatar timeline time')
  const resolvedTimeMs = Math.min(Math.max(timelineTimeMs, 0), timeline.durationMs)
  const hasSolo = timeline.tracks.some(track => track.solo === true && track.muted !== true)
  const unresolvedClipIds: string[] = []
  const active = timeline.tracks.flatMap(track => {
    if (track.muted === true || hasSolo && track.solo !== true) return []
    const instance = findActiveAvatarAnimationTimelineClip(track.clips, resolvedTimeMs)
    if (instance == null) return []
    const sourceClip = instance.source.type === 'inline'
      ? instance.source.clip
      : resolvePreset?.(instance.source, instance)
    if (sourceClip == null) {
      unresolvedClipIds.push(instance.instanceId)
      return []
    }
    const localTimeMs = resolvedTimeMs - instance.startMs
    const sourceTimeMs = resolveAvatarAnimationTimelineSourceTime(instance, sourceClip, localTimeMs)
    const runtimeTrackId = `timeline:${encodeAvatarAnimationIdComponent(track.trackId)}:${encodeAvatarAnimationIdComponent(instance.instanceId)}`
    return [{
      instance,
      runtimeTrack: {
        clip: sourceClip,
        elapsedMs: sourceTimeMs,
        parameterValues: instance.parameterValues,
        preserveAuxiliaryPartIds: instance.preserveAuxiliaryPartIds,
        trackId: runtimeTrackId,
        weight: (track.weight ?? 1) * instance.weight *
          resolveAvatarAnimationTimelineEnvelopeWeight(instance, localTimeMs)
      } satisfies AvatarAnimationTrack,
      runtimeTrackId,
      sourceTimeMs,
      trackId: track.trackId
    }]
  })
  const frame = resolveAvatarAnimationTracks(definition, active.map(item => item.runtimeTrack))
  return {
    ...frame,
    activeClips: active.map(item => ({
      instanceId: item.instance.instanceId,
      resourceWeights: frame.trackResourceWeights?.[item.runtimeTrackId] ?? {},
      sourceTimeMs: item.sourceTimeMs,
      trackId: item.trackId,
      writes: frame.trackWrites?.[item.runtimeTrackId] ?? []
    })),
    timelineTimeMs: resolvedTimeMs,
    unresolvedClipIds
  }
}

const clampAvatarAnimationTimelineEnvelope = (
  envelope: AvatarAnimationTimelineEnvelope | undefined,
  durationMs: number
) => {
  if (envelope == null) return undefined
  const fadeInMs = Math.max(envelope.fadeInMs ?? 0, 0)
  const fadeOutMs = Math.max(envelope.fadeOutMs ?? 0, 0)
  const total = fadeInMs + fadeOutMs
  const scale = total > durationMs && total > 0 ? durationMs / total : 1
  const resolved = { fadeInMs: fadeInMs * scale, fadeOutMs: fadeOutMs * scale }
  return resolved.fadeInMs === 0 && resolved.fadeOutMs === 0 ? undefined : resolved
}

const getAvatarAnimationTimelineSnapPoints = (
  timeline: AvatarAnimationTimeline,
  excludedInstanceId: string,
  playheadMs?: number
) => [
  0,
  ...(playheadMs == null ? [] : [playheadMs]),
  ...timeline.tracks.flatMap(track => track.clips.flatMap(clip => (
    clip.instanceId === excludedInstanceId ? [] : [clip.startMs, avatarAnimationTimelineClipEnd(clip)]
  )))
]

const snapAvatarAnimationTimelineRange = (
  startMs: number,
  durationMs: number,
  points: readonly number[],
  thresholdMs: number
) => {
  let bestDelta = 0
  let bestDistance = Infinity
  for (const point of points) {
    for (const edge of [startMs, startMs + durationMs]) {
      const delta = point - edge
      const distance = Math.abs(delta)
      if (distance <= thresholdMs && distance < bestDistance) {
        bestDelta = delta
        bestDistance = distance
      }
    }
  }
  return Math.max(startMs + bestDelta, 0)
}

const avatarAnimationTimelineEditFailure = (
  timeline: AvatarAnimationTimeline,
  reason: AvatarAnimationTimelineEditFailure,
  conflictInstanceId?: string
): AvatarAnimationTimelineEditResult => ({
  ...(conflictInstanceId == null ? {} : { conflictInstanceId }),
  reason,
  timeline,
  valid: false
})

export const previewMoveAvatarAnimationTimelineClip = (
  timeline: AvatarAnimationTimeline,
  options: {
    readonly instanceId: string
    readonly playheadMs?: number
    readonly snap?: boolean
    readonly snapThresholdMs?: number
    readonly startMs: number
    readonly targetTrackId: string
  }
): AvatarAnimationTimelineEditResult => {
  validateAvatarAnimationTimeline(timeline)
  const sourceTrack = timeline.tracks.find(track => track.clips.some(clip => clip.instanceId === options.instanceId))
  const targetTrack = timeline.tracks.find(track => track.trackId === options.targetTrackId)
  const sourceClip = sourceTrack?.clips.find(clip => clip.instanceId === options.instanceId)
  if (sourceTrack == null || targetTrack == null || sourceClip == null) {
    return avatarAnimationTimelineEditFailure(timeline, 'not-found')
  }
  if (!isFiniteNumber(options.startMs) || options.startMs < 0) {
    return avatarAnimationTimelineEditFailure(timeline, 'invalid')
  }
  const snappedTimeMs = options.snap === false
    ? options.startMs
    : snapAvatarAnimationTimelineRange(
        options.startMs,
        sourceClip.durationMs,
        getAvatarAnimationTimelineSnapPoints(timeline, sourceClip.instanceId, options.playheadMs),
        Math.max(options.snapThresholdMs ?? 80, 0)
      )
  const movedClip = { ...sourceClip, startMs: snappedTimeMs }
  const conflict = targetTrack.clips.find(clip => (
    clip.instanceId !== sourceClip.instanceId && avatarAnimationTimelineClipsOverlap(clip, movedClip)
  ))
  if (conflict != null) return avatarAnimationTimelineEditFailure(timeline, 'conflict', conflict.instanceId)
  const nextTracks = timeline.tracks.map(track => {
    const withoutSource = track.clips.filter(clip => clip.instanceId !== sourceClip.instanceId)
    return track.trackId === targetTrack.trackId
      ? { ...track, clips: [...withoutSource, movedClip] }
      : { ...track, clips: withoutSource }
  })
  const nextTimeline = normalizeAvatarAnimationTimeline({ ...timeline, tracks: nextTracks })
  return {
    snappedTimeMs,
    timeline: nextTimeline,
    undo: {
      clip: sourceClip,
      timelineDurationMs: timeline.durationMs,
      trackId: sourceTrack.trackId,
      type: 'restore-clip'
    },
    valid: true
  }
}

export const previewTrimAvatarAnimationTimelineClip = (
  timeline: AvatarAnimationTimeline,
  options: {
    readonly edge: 'end' | 'start'
    readonly instanceId: string
    readonly playheadMs?: number
    readonly resolvePreset?: AvatarAnimationTimelinePresetResolver
    readonly snap?: boolean
    readonly snapThresholdMs?: number
    readonly timeMs: number
  }
): AvatarAnimationTimelineEditResult => {
  validateAvatarAnimationTimeline(timeline)
  const track = timeline.tracks.find(candidate => candidate.clips.some(clip => clip.instanceId === options.instanceId))
  const sourceClip = track?.clips.find(clip => clip.instanceId === options.instanceId)
  if (track == null || sourceClip == null) return avatarAnimationTimelineEditFailure(timeline, 'not-found')
  if (!isFiniteNumber(options.timeMs)) return avatarAnimationTimelineEditFailure(timeline, 'invalid')
  const points = getAvatarAnimationTimelineSnapPoints(timeline, sourceClip.instanceId, options.playheadMs)
  const snappedTimeMs = options.snap === false
    ? options.timeMs
    : snapAvatarAnimationTimelineRange(options.timeMs, 0, points, Math.max(options.snapThresholdMs ?? 80, 0))
  const sourceEndMs = avatarAnimationTimelineClipEnd(sourceClip)
  const nextStartMs = options.edge === 'start' ? snappedTimeMs : sourceClip.startMs
  const nextEndMs = options.edge === 'end' ? snappedTimeMs : sourceEndMs
  const durationMs = nextEndMs - nextStartMs
  if (durationMs <= 0 || nextStartMs < 0) {
    return avatarAnimationTimelineEditFailure(timeline, 'invalid')
  }
  let sourceOffsetMs = sourceClip.sourceOffsetMs
  if (options.edge === 'start') {
    const sourceDefinition = sourceClip.source.type === 'inline'
      ? sourceClip.source.clip
      : options.resolvePreset?.(sourceClip.source, sourceClip)
    if (sourceDefinition == null) return avatarAnimationTimelineEditFailure(timeline, 'invalid')
    const rawSourceOffsetMs = sourceClip.sourceOffsetMs +
      (nextStartMs - sourceClip.startMs) * sourceClip.playbackRate
    if (sourceClip.frameSequence != null) {
      const sequence = resolveAvatarAnimationTimelineFrameSequenceDefinition(
        sourceClip.frameSequence,
        sourceDefinition
      )
      sourceOffsetMs = !Number.isFinite(sequence.virtualDurationMs)
        ? Math.max(rawSourceOffsetMs, 0)
        : (sourceClip.playback ?? sourceDefinition.playback) === 'loop' && sequence.loop == null && sequence.virtualDurationMs > 0
          ? ((rawSourceOffsetMs % sequence.virtualDurationMs) + sequence.virtualDurationMs) %
            sequence.virtualDurationMs
          : Math.min(Math.max(rawSourceOffsetMs, 0), sequence.virtualDurationMs)
    } else {
      sourceOffsetMs = (sourceClip.playback ?? sourceDefinition.playback) === 'loop'
        ? ((rawSourceOffsetMs % sourceDefinition.durationMs) + sourceDefinition.durationMs) % sourceDefinition.durationMs
        : Math.min(Math.max(rawSourceOffsetMs, 0), sourceDefinition.durationMs)
    }
  }
  const trimmedClip = {
    ...sourceClip,
    durationMs,
    envelope: clampAvatarAnimationTimelineEnvelope(sourceClip.envelope, durationMs),
    sourceOffsetMs,
    startMs: nextStartMs
  }
  if (!isAvatarAnimationTimelineClip(trimmedClip)) return avatarAnimationTimelineEditFailure(timeline, 'invalid')
  const conflict = track.clips.find(clip => (
    clip.instanceId !== sourceClip.instanceId && avatarAnimationTimelineClipsOverlap(clip, trimmedClip)
  ))
  if (conflict != null) return avatarAnimationTimelineEditFailure(timeline, 'conflict', conflict.instanceId)
  const nextTimeline = normalizeAvatarAnimationTimeline({
    ...timeline,
    tracks: timeline.tracks.map(candidate => candidate.trackId === track.trackId
      ? { ...candidate, clips: candidate.clips.map(clip => clip.instanceId === sourceClip.instanceId ? trimmedClip : clip) }
      : candidate)
  })
  return {
    snappedTimeMs,
    timeline: nextTimeline,
    undo: {
      clip: sourceClip,
      timelineDurationMs: timeline.durationMs,
      trackId: track.trackId,
      type: 'restore-clip'
    },
    valid: true
  }
}

export const restoreAvatarAnimationTimelineClip = (
  timeline: AvatarAnimationTimeline,
  command: AvatarAnimationTimelineUndoCommand
) => normalizeAvatarAnimationTimeline({
  ...timeline,
  durationMs: command.timelineDurationMs,
  tracks: timeline.tracks.map(track => {
    const clips = track.clips.filter(clip => clip.instanceId !== command.clip.instanceId)
    return track.trackId === command.trackId ? { ...track, clips: [...clips, command.clip] } : { ...track, clips }
  })
})

export const reorderAvatarAnimationTimelineTrack = (
  timeline: AvatarAnimationTimeline,
  trackId: string,
  targetRuntimeIndex: number
) => {
  validateAvatarAnimationTimeline(timeline)
  const sourceIndex = timeline.tracks.findIndex(track => track.trackId === trackId)
  const targetIndex = Math.min(Math.max(Math.round(targetRuntimeIndex), 0), timeline.tracks.length - 1)
  if (sourceIndex < 0) throw new TypeError('Unknown OneWorks Avatar animation timeline track')
  const tracks = [...timeline.tracks]
  const [track] = tracks.splice(sourceIndex, 1)
  tracks.splice(targetIndex, 0, track!)
  return { ...timeline, tracks }
}

export const getAvatarAnimationTimelineDisplayTracks = (timeline: AvatarAnimationTimeline) => (
  [...timeline.tracks].reverse()
)
