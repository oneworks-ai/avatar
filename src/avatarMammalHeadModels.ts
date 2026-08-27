import {
  createAvatarHeadFaceStyle,
  createAvatarHeadOnlyScene,
  createAvatarHeadSurfaceMarking
} from './avatarHeadModelHelpers'
import type { AvatarHeadMaterial } from './avatarHeadModelHelpers'
import type { AvatarEntityPart } from './avatarEntityPresets'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

const SEAL_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#a6a49d',
  foregroundColor: '#293036',
  highlightColor: '#d6d4cc',
  shadowColor: '#77756f'
}

export const SEAL_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 50,
  height: 34,
  leftEyeRotation: -7,
  noseEnabled: true,
  noseHeight: 19,
  noseShape: 'rounded',
  noseWidth: 25,
  noseY: 32,
  rightEyeRotation: 7,
  width: 22
})

export const SEAL_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({
    color: '#e5e1d5',
    height: 103,
    id: 'seal-face-mask',
    label: 'Natural curved seal muzzle marking',
    width: 138,
    y: 40
  }),
  createAvatarHeadSurfaceMarking({
    color: '#e5e1d5',
    height: 118,
    id: 'seal-cheek-left',
    label: 'Left seal whisker-pad fur',
    shape: 'ellipse',
    side: 'front',
    targetPartId: 'cheek-left',
    width: 120,
    x: 0,
    y: 0
  }),
  createAvatarHeadSurfaceMarking({
    color: '#e5e1d5',
    height: 118,
    id: 'seal-cheek-right',
    label: 'Right seal whisker-pad fur',
    shape: 'ellipse',
    side: 'front',
    targetPartId: 'cheek-right',
    width: 120,
    x: 0,
    y: 0
  })
]

export const SEAL_PARTS: readonly AvatarEntityPart[] = [
  // True seals have no external pinnae: keep these tiny attachment points
  // flush with the skull so shared ear controls never invent visible ears.
  { ...SEAL_MATERIAL, face: false, id: 'ear-left', label: 'Left flush seal ear opening', occludedByFace: true, rotationY: -8, roundness: 100, scaleX: .108, scaleY: .108, scaleZ: .08, shape: 'sphere', x: -100, y: -16, z: -16 },
  { ...SEAL_MATERIAL, face: false, id: 'ear-right', label: 'Right flush seal ear opening', occludedByFace: true, rotationY: 8, roundness: 100, scaleX: .108, scaleY: .108, scaleZ: .08, shape: 'sphere', x: 100, y: -16, z: -16 },
  { ...SEAL_MATERIAL, face: false, id: 'cheek-left', label: 'Left three-dimensional seal whisker pad', roundness: 100, scaleX: .31, scaleY: .29, scaleZ: .34, shape: 'sphere', x: -35, y: 43, z: 55 },
  { ...SEAL_MATERIAL, face: false, id: 'cheek-right', label: 'Right three-dimensional seal whisker pad', roundness: 100, scaleX: .31, scaleY: .29, scaleZ: .34, shape: 'sphere', x: 35, y: 43, z: 55 },
  { ...SEAL_MATERIAL, bottomTaper: 13, face: true, id: 'primary', label: 'Broad rounded seal head', roundness: 98, scaleX: .87, scaleY: .69, scaleZ: .81, shape: 'ellipse', x: 0, y: 14, z: 0 }
]

export const SEAL_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#58788a',
  material: SEAL_MATERIAL,
  paletteId: 'harbor-seal',
  surfaceDecals: SEAL_SURFACE_DECALS,
  viewState: { pitch: -.14, positionX: -76, positionY: 103, roll: .16, scale: 1.7, yaw: .23 }
})

const BEAVER_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#997252',
  foregroundColor: '#32251d',
  highlightColor: '#c59d77',
  shadowColor: '#684933'
}

const BEAVER_TOOTH_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#f1e8d6',
  foregroundColor: BEAVER_MATERIAL.foregroundColor,
  highlightColor: '#fff8ea',
  shadowColor: '#cbbca5'
}

export const BEAVER_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 48,
  height: 35,
  leftEyeRotation: -7,
  noseEnabled: true,
  noseHeight: 17,
  noseShape: 'rounded',
  noseWidth: 25,
  noseY: 37,
  rightEyeRotation: 7,
  width: 20
})

export const BEAVER_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({
    color: '#dac4a9',
    height: 110,
    id: 'beaver-face-mask',
    label: 'Natural beaver muzzle fur marking',
    width: 145,
    y: 42
  }),
  ...(['left', 'right'] as const).map(side => createAvatarHeadSurfaceMarking({
    color: '#dac4a9',
    height: 114,
    id: `beaver-cheek-${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} beaver muzzle-pad fur`,
    shape: 'ellipse',
    side: 'front',
    targetPartId: `cheek-${side}`,
    width: 122,
    x: 0,
    y: 0
  }))
]

export const BEAVER_PARTS: readonly AvatarEntityPart[] = [
  { ...BEAVER_MATERIAL, face: false, id: 'ear-left', label: 'Left round beaver ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationY: -9, rotationZ: -8, roundness: 100, scaleX: .19, scaleY: .22, scaleZ: .19, shape: 'sphere', x: -75, y: -66, z: -17 },
  { ...BEAVER_MATERIAL, face: false, id: 'ear-right', label: 'Right round beaver ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationY: 9, rotationZ: 8, roundness: 100, scaleX: .19, scaleY: .22, scaleZ: .19, shape: 'sphere', x: 75, y: -66, z: -17 },
  { ...BEAVER_MATERIAL, face: false, id: 'cheek-left', label: 'Left volumetric beaver jaw pad', roundness: 100, scaleX: .27, scaleY: .25, scaleZ: .31, shape: 'sphere', x: -38, y: 47, z: 56 },
  { ...BEAVER_MATERIAL, face: false, id: 'cheek-right', label: 'Right volumetric beaver jaw pad', roundness: 100, scaleX: .27, scaleY: .25, scaleZ: .31, shape: 'sphere', x: 38, y: 47, z: 56 },
  { ...BEAVER_TOOTH_MATERIAL, face: false, id: 'tooth-left', label: 'Left projecting beaver incisor', roundness: 42, scaleX: .095, scaleY: .19, scaleZ: .15, shape: 'rounded', x: -12, y: 78, z: 85 },
  { ...BEAVER_TOOTH_MATERIAL, face: false, id: 'tooth-right', label: 'Right projecting beaver incisor', roundness: 42, scaleX: .095, scaleY: .19, scaleZ: .15, shape: 'rounded', x: 12, y: 78, z: 85 },
  { ...BEAVER_MATERIAL, bottomTaper: 11, face: true, id: 'primary', label: 'Broad three-dimensional beaver head', roundness: 95, scaleX: .79, scaleY: .76, scaleZ: .81, shape: 'ellipse', x: 0, y: 13, z: 0 }
]

export const BEAVER_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#557868',
  material: BEAVER_MATERIAL,
  paletteId: 'north-american-beaver',
  surfaceDecals: BEAVER_SURFACE_DECALS,
  viewState: { pitch: -.16, positionX: 70, positionY: 102, roll: -.18, scale: 1.74, yaw: -.24 }
})

const GUINEA_PIG_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#b97d50',
  foregroundColor: '#38271f',
  highlightColor: '#e2ac7d',
  shadowColor: '#7c4e34'
}

export const GUINEA_PIG_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 45,
  height: 35,
  leftEyeRotation: -6,
  noseEnabled: true,
  noseHeight: 13,
  noseShape: 'inverted-triangle',
  noseWidth: 17,
  noseY: 38,
  rightEyeRotation: 6,
  width: 21
})

export const GUINEA_PIG_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({
    color: '#f1dfc3',
    height: 124,
    id: 'guinea-pig-face-mask',
    label: 'Natural guinea pig face marking',
    width: 139,
    y: 31
  }),
  ...(['left', 'right'] as const).map(side => createAvatarHeadSurfaceMarking({
    color: '#f1dfc3',
    height: 120,
    id: `guinea-pig-cheek-${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} guinea pig cheek marking`,
    shape: 'ellipse',
    side: 'front',
    targetPartId: `cheek-${side}`,
    width: 124,
    x: 0,
    y: 0
  })),
  ...(['left', 'right'] as const).map(side => createAvatarHeadSurfaceMarking({
    color: '#d79b8c',
    height: 98,
    id: `guinea-pig-inner-ear-${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} guinea pig inner ear`,
    shape: 'ellipse',
    side: 'front',
    targetPartId: `ear-${side}`,
    width: 86,
    x: 0,
    y: 0
  }))
]

export const GUINEA_PIG_PARTS: readonly AvatarEntityPart[] = [
  { ...GUINEA_PIG_MATERIAL, face: false, id: 'ear-left', label: 'Left softly folded guinea pig ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -5, rotationY: -10, rotationZ: -12, roundness: 100, scaleX: .2, scaleY: .23, scaleZ: .19, shape: 'ellipse', x: -71, y: -53, z: -9 },
  { ...GUINEA_PIG_MATERIAL, face: false, id: 'ear-right', label: 'Right softly folded guinea pig ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -5, rotationY: 10, rotationZ: 12, roundness: 100, scaleX: .2, scaleY: .23, scaleZ: .19, shape: 'ellipse', x: 71, y: -53, z: -9 },
  { ...GUINEA_PIG_MATERIAL, face: false, id: 'cheek-left', label: 'Left true guinea pig cheek volume', roundness: 100, scaleX: .32, scaleY: .32, scaleZ: .35, shape: 'sphere', x: -47, y: 38, z: 47 },
  { ...GUINEA_PIG_MATERIAL, face: false, id: 'cheek-right', label: 'Right true guinea pig cheek volume', roundness: 100, scaleX: .32, scaleY: .32, scaleZ: .35, shape: 'sphere', x: 47, y: 38, z: 47 },
  { ...GUINEA_PIG_MATERIAL, bottomTaper: 9, face: true, id: 'primary', label: 'Compact full guinea pig head', roundness: 98, scaleX: .82, scaleY: .72, scaleZ: .79, shape: 'ellipse', x: 0, y: 16, z: 0 }
]

export const GUINEA_PIG_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#6d7f69',
  material: GUINEA_PIG_MATERIAL,
  paletteId: 'american-guinea-pig',
  surfaceDecals: GUINEA_PIG_SURFACE_DECALS,
  viewState: { pitch: -.13, positionX: 73, positionY: 106, roll: -.17, scale: 1.75, yaw: -.22 }
})

const CHINCHILLA_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#aaaeb5',
  foregroundColor: '#30333a',
  highlightColor: '#dadde2',
  shadowColor: '#747983'
}

export const CHINCHILLA_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 44,
  height: 39,
  leftEyeRotation: -5,
  noseEnabled: true,
  noseHeight: 12,
  noseShape: 'inverted-triangle',
  noseWidth: 16,
  noseY: 36,
  rightEyeRotation: 5,
  width: 21
})

export const CHINCHILLA_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#e7e5e0', height: 117, id: 'chinchilla-face-mask', label: 'Natural chinchilla muzzle marking', width: 132, y: 37 }),
  ...(['left', 'right'] as const).map(side => createAvatarHeadSurfaceMarking({
    color: '#e7e5e0', height: 122, id: `chinchilla-cheek-${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} chinchilla cheek fur`, shape: 'ellipse', side: 'front',
    targetPartId: `cheek-${side}`, width: 124, x: 0, y: 0
  })),
  ...(['left', 'right'] as const).map(side => createAvatarHeadSurfaceMarking({
    color: '#c58f98', height: 104, id: `chinchilla-inner-ear-${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} chinchilla inner ear`, shape: 'ellipse', side: 'front',
    targetPartId: `ear-${side}`, width: 80, x: 0, y: 0
  }))
]

export const CHINCHILLA_PARTS: readonly AvatarEntityPart[] = [
  { ...CHINCHILLA_MATERIAL, face: false, id: 'ear-left', label: 'Left large round chinchilla ear', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -4, rotationY: -9, rotationZ: -9, roundness: 100, scaleX: .29, scaleY: .37, scaleZ: .25, shape: 'ellipse', x: -64, y: -72, z: -13 },
  { ...CHINCHILLA_MATERIAL, face: false, id: 'ear-right', label: 'Right large round chinchilla ear', occludedByFace: true, occlusionAmount: 9, occlusionPole: 'bottom', rotationX: -4, rotationY: 9, rotationZ: 9, roundness: 100, scaleX: .29, scaleY: .37, scaleZ: .25, shape: 'ellipse', x: 64, y: -72, z: -13 },
  { ...CHINCHILLA_MATERIAL, face: false, id: 'cheek-left', label: 'Left dense chinchilla cheek volume', roundness: 100, scaleX: .33, scaleY: .36, scaleZ: .39, shape: 'sphere', x: -48, y: 31, z: 39 },
  { ...CHINCHILLA_MATERIAL, face: false, id: 'cheek-right', label: 'Right dense chinchilla cheek volume', roundness: 100, scaleX: .33, scaleY: .36, scaleZ: .39, shape: 'sphere', x: 48, y: 31, z: 39 },
  { ...CHINCHILLA_MATERIAL, bottomTaper: 12, face: true, id: 'primary', label: 'Soft full chinchilla head', roundness: 100, scaleX: .76, scaleY: .73, scaleZ: .8, shape: 'ellipse', x: 0, y: 15, z: 0 }
]

export const CHINCHILLA_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#6c7080',
  material: CHINCHILLA_MATERIAL,
  paletteId: 'gray-chinchilla',
  surfaceDecals: CHINCHILLA_SURFACE_DECALS,
  viewState: { pitch: -.17, positionX: -70, positionY: 101, roll: .19, scale: 1.72, yaw: .24 }
})

const FERRET_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#8b6750',
  foregroundColor: '#2b211c',
  highlightColor: '#bd9473',
  shadowColor: '#5c4032'
}

export const FERRET_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 49,
  height: 38,
  leftEyeRotation: -8,
  noseEnabled: true,
  noseHeight: 15,
  noseShape: 'rounded',
  noseWidth: 20,
  noseY: 46,
  rightEyeRotation: 8,
  width: 19
})

export const FERRET_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#ead7ba', height: 142, id: 'ferret-muzzle-mask', label: 'Natural ferret muzzle fur', width: 120, y: 32 }),
  createAvatarHeadSurfaceMarking({ color: '#4a352b', height: 35, id: 'ferret-eye-mask-left', label: 'Left curved ferret eye mask', rotation: -10, shape: 'ellipse', side: 'face', width: 53, x: -31, y: -8 }),
  createAvatarHeadSurfaceMarking({ color: '#4a352b', height: 35, id: 'ferret-eye-mask-right', label: 'Right curved ferret eye mask', rotation: 10, shape: 'ellipse', side: 'face', width: 53, x: 31, y: -8 }),
  ...(['left', 'right'] as const).map(side => createAvatarHeadSurfaceMarking({
    color: '#bb8178', height: 94, id: `ferret-inner-ear-${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} ferret inner ear`, shape: 'ellipse', side: 'front',
    targetPartId: `ear-${side}`, width: 80, x: 0, y: 0
  }))
]

export const FERRET_PARTS: readonly AvatarEntityPart[] = [
  { ...FERRET_MATERIAL, face: false, id: 'ear-left', label: 'Left small round ferret ear', occludedByFace: true, occlusionAmount: 7, occlusionPole: 'bottom', rotationX: -4, rotationY: -9, rotationZ: -8, roundness: 100, scaleX: .17, scaleY: .2, scaleZ: .17, shape: 'ellipse', x: -59, y: -70, z: -12 },
  { ...FERRET_MATERIAL, face: false, id: 'ear-right', label: 'Right small round ferret ear', occludedByFace: true, occlusionAmount: 7, occlusionPole: 'bottom', rotationX: -4, rotationY: 9, rotationZ: 8, roundness: 100, scaleX: .17, scaleY: .2, scaleZ: .17, shape: 'ellipse', x: 59, y: -70, z: -12 },
  { ...FERRET_MATERIAL, bottomTaper: 43, face: true, id: 'primary', label: 'Long tapered three-dimensional ferret head', roundness: 94, scaleX: .68, scaleY: .84, scaleZ: .76, shape: 'ellipse', x: 0, y: 14, z: 0 }
]

export const FERRET_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#657965',
  material: FERRET_MATERIAL,
  paletteId: 'sable-ferret',
  surfaceDecals: FERRET_SURFACE_DECALS,
  viewState: { pitch: -.18, positionX: -75, positionY: 94, roll: .2, scale: 1.72, yaw: .27 }
})

const MONKEY_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#8b6244',
  foregroundColor: '#2f211b',
  highlightColor: '#bd9067',
  shadowColor: '#5d3d2c'
}

export const MONKEY_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 49,
  height: 39,
  leftEyeRotation: -5,
  noseEnabled: false,
  rightEyeRotation: 5,
  width: 22
})

export const MONKEY_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#d5a77c', height: 139, id: 'monkey-face-mask', label: 'Natural monkey facial skin marking', width: 139, y: 19 }),
  createAvatarHeadSurfaceMarking({ color: '#d5a77c', height: 119, id: 'monkey-muzzle-skin', label: 'Monkey muzzle skin projected onto its true volume', shape: 'ellipse', side: 'front', targetPartId: 'muzzle', width: 123, x: 0, y: 0 }),
  ...(['left', 'right'] as const).map(side => createAvatarHeadSurfaceMarking({
    color: '#bd8171', height: 106, id: `monkey-inner-ear-${side}`,
    label: `${side === 'left' ? 'Left' : 'Right'} monkey inner ear`, shape: 'ellipse', side: 'front',
    targetPartId: `ear-${side}`, width: 83, x: 0, y: 0
  })),
  ...([-1, 1] as const).map(side => createAvatarHeadSurfaceMarking({
    color: '#483028', height: 14, id: `monkey-nostril-${side < 0 ? 'left' : 'right'}`,
    label: `${side < 0 ? 'Left' : 'Right'} monkey nostril`, shape: 'ellipse', side: 'front',
    targetPartId: 'muzzle', width: 17, x: side * 15, y: -5
  }))
]

export const MONKEY_PARTS: readonly AvatarEntityPart[] = [
  { ...MONKEY_MATERIAL, face: false, id: 'ear-left', label: 'Left broad three-dimensional monkey ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -3, rotationY: -8, roundness: 100, scaleX: .27, scaleY: .36, scaleZ: .25, shape: 'ellipse', x: -84, y: -18, z: -11 },
  { ...MONKEY_MATERIAL, face: false, id: 'ear-right', label: 'Right broad three-dimensional monkey ear', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -3, rotationY: 8, roundness: 100, scaleX: .27, scaleY: .36, scaleZ: .25, shape: 'ellipse', x: 84, y: -18, z: -11 },
  { ...MONKEY_MATERIAL, face: false, id: 'muzzle', label: 'True projecting monkey muzzle volume', roundness: 100, scaleX: .43, scaleY: .31, scaleZ: .4, shape: 'ellipse', x: 0, y: 49, z: 62 },
  { ...MONKEY_MATERIAL, bottomTaper: 16, face: true, id: 'primary', label: 'Tall rounded three-dimensional monkey head', roundness: 96, scaleX: .72, scaleY: .8, scaleZ: .79, shape: 'ellipse', x: 0, y: 13, z: 0 }
]

export const MONKEY_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#66745f',
  material: MONKEY_MATERIAL,
  paletteId: 'macaque',
  surfaceDecals: MONKEY_SURFACE_DECALS,
  viewState: { pitch: -.15, positionX: 72, positionY: 91, roll: -.2, scale: 1.69, yaw: -.25 }
})
