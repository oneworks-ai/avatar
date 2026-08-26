import {
  createAvatarHeadFaceStyle,
  createAvatarHeadOnlyScene,
  createAvatarHeadSurfaceMarking
} from './avatarHeadModelHelpers'
import type { AvatarHeadMaterial } from './avatarHeadModelHelpers'
import type { AvatarEntityPart } from './avatarEntityPresets'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'

const CHICK_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#efc84a',
  foregroundColor: '#392714',
  highlightColor: '#ffe787',
  shadowColor: '#bd8f27'
}

const CHICK_BEAK_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#e99437',
  foregroundColor: '#6d4222',
  highlightColor: '#ffc86d',
  shadowColor: '#a85f23'
}

export const CHICK_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 44,
  height: 34,
  leftEyeRotation: -6,
  noseEnabled: false,
  rightEyeRotation: 6,
  width: 21
})

export const CHICK_BEAK_PARTS: readonly AvatarEntityPart[] = [
  { ...CHICK_BEAK_MATERIAL, face: false, id: 'beak', label: 'Single shallow rounded chick beak', roundness: 100, scaleX: .2, scaleY: .14, scaleZ: .2, shape: 'ellipse', x: 0, y: 44, z: 82 }
]

export const CHICK_CREST_PARTS: readonly AvatarEntityPart[] = [
  { ...CHICK_MATERIAL, face: false, id: 'crest-fluff-left', label: 'Left fluffy chick crest', roundness: 100, scaleX: .2, scaleY: .24, scaleZ: .23, shape: 'sphere', x: -31, y: -87, z: 5 },
  { ...CHICK_MATERIAL, face: false, id: 'crest-fluff-center', label: 'Central fluffy chick crest', roundness: 100, scaleX: .23, scaleY: .28, scaleZ: .26, shape: 'sphere', x: 0, y: -99, z: 9 },
  { ...CHICK_MATERIAL, face: false, id: 'crest-fluff-right', label: 'Right fluffy chick crest', roundness: 100, scaleX: .2, scaleY: .24, scaleZ: .23, shape: 'sphere', x: 31, y: -87, z: 5 },
  { ...CHICK_MATERIAL, face: false, id: 'crest-comb-front', label: 'Front keratin chick comb lobe', rotationZ: -8, roundness: 92, scaleX: .12, scaleY: .25, scaleZ: .14, shape: 'capsule', x: -17, y: -102, z: 8 },
  { ...CHICK_MATERIAL, face: false, id: 'crest-comb-center', label: 'Central keratin chick comb lobe', roundness: 92, scaleX: .13, scaleY: .29, scaleZ: .15, shape: 'capsule', x: 0, y: -108, z: 10 },
  { ...CHICK_MATERIAL, face: false, id: 'crest-comb-rear', label: 'Rear keratin chick comb lobe', rotationZ: 8, roundness: 92, scaleX: .12, scaleY: .24, scaleZ: .14, shape: 'capsule', x: 18, y: -100, z: 6 }
]

const CHICK_DEFAULT_CREST_IDS = new Set(['crest-fluff-left', 'crest-fluff-center', 'crest-fluff-right'])

export const CHICK_PARTS: readonly AvatarEntityPart[] = [
  ...CHICK_BEAK_PARTS,
  ...CHICK_CREST_PARTS.filter(part => CHICK_DEFAULT_CREST_IDS.has(part.id)),
  { ...CHICK_MATERIAL, bottomTaper: 8, face: true, id: 'primary', label: 'Round full three-dimensional chick head', roundness: 100, scaleX: .77, scaleY: .77, scaleZ: .8, shape: 'ellipse', x: 0, y: 14, z: 0 }
]

const CHICK_COMB_DECALS: readonly AvatarSurfaceDecal[] = CHICK_CREST_PARTS
  .filter(part => part.id.startsWith('crest-comb-'))
  .map(part => createAvatarHeadSurfaceMarking({
    color: '#d95b48',
    height: 146,
    id: `${part.id}-color`,
    label: `${part.label} surface color`,
    shape: 'rounded',
    side: 'front',
    targetPartId: part.id,
    width: 104,
    x: 0,
    y: 0
  }))

export const CHICK_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#f8dd72', height: 82, id: 'chick-cheek-left', label: 'Left chick cheek feather marking', rotation: -10, shape: 'ellipse', width: 66, x: -47, y: 34 }),
  createAvatarHeadSurfaceMarking({ color: '#f8dd72', height: 82, id: 'chick-cheek-right', label: 'Right chick cheek feather marking', rotation: 10, shape: 'ellipse', width: 66, x: 47, y: 34 }),
  createAvatarHeadSurfaceMarking({ bend: 8, color: '#9f5a22', height: 8, id: 'chick-beak-seam', label: 'Chick beak curved seam', shape: 'tapered-band', side: 'front', targetPartId: 'beak', width: 112, x: 0, y: 13 }),
  createAvatarHeadSurfaceMarking({ color: '#6d4222', height: 12, id: 'chick-nostril-left', label: 'Left chick nostril', shape: 'ellipse', side: 'front', targetPartId: 'beak', width: 15, x: -18, y: -10 }),
  createAvatarHeadSurfaceMarking({ color: '#6d4222', height: 12, id: 'chick-nostril-right', label: 'Right chick nostril', shape: 'ellipse', side: 'front', targetPartId: 'beak', width: 15, x: 18, y: -10 })
]

export const createChickCombSurfaceDecals = (color = '#d95b48'): readonly AvatarSurfaceDecal[] => (
  CHICK_COMB_DECALS.map(decal => ({ ...decal, color }))
)

export const CHICK_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#6f8f79',
  material: CHICK_MATERIAL,
  paletteId: 'yellow-chick',
  surfaceDecals: CHICK_SURFACE_DECALS,
  viewState: { pitch: -.16, positionX: -70, positionY: 96, roll: .18, scale: 1.72, yaw: .24 }
})

const DUCK_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#f0c94e',
  foregroundColor: '#382919',
  highlightColor: '#ffe88b',
  shadowColor: '#ba8d2e'
}

const DUCK_BILL_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#dc8738',
  foregroundColor: '#5b3b24',
  highlightColor: '#f7b765',
  shadowColor: '#945523'
}

export const DUCK_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 48,
  height: 35,
  leftEyeRotation: -4,
  noseEnabled: false,
  rightEyeRotation: 4,
  width: 22
})

export const DUCK_BILL_PARTS: readonly AvatarEntityPart[] = [
  { ...DUCK_BILL_MATERIAL, face: false, id: 'bill', label: 'Single shallow flat duck bill', roundness: 100, scaleX: .34, scaleY: .14, scaleZ: .24, shape: 'ellipse', x: 0, y: 46, z: 84 }
]

export const DUCK_PARTS: readonly AvatarEntityPart[] = [
  ...DUCK_BILL_PARTS,
  { ...DUCK_MATERIAL, bottomTaper: 5, face: true, id: 'primary', label: 'Full three-dimensional duck head', roundness: 100, scaleX: .76, scaleY: .78, scaleZ: .8, shape: 'ellipse', x: 0, y: 13, z: 0 }
]

export const DUCK_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#f8dc72', height: 76, id: 'duck-cheek-left', label: 'Left duck cheek feather marking', rotation: -8, shape: 'ellipse', width: 64, x: -48, y: 34 }),
  createAvatarHeadSurfaceMarking({ color: '#f8dc72', height: 76, id: 'duck-cheek-right', label: 'Right duck cheek feather marking', rotation: 8, shape: 'ellipse', width: 64, x: 48, y: 34 }),
  createAvatarHeadSurfaceMarking({ bend: 5, color: '#8f5020', height: 8, id: 'duck-bill-seam', label: 'Duck bill curved seam', shape: 'tapered-band', side: 'front', targetPartId: 'bill', width: 126, x: 0, y: 15 }),
  createAvatarHeadSurfaceMarking({ color: '#5b3b24', height: 10, id: 'duck-nostril-left', label: 'Left duck nostril', shape: 'ellipse', side: 'front', targetPartId: 'bill', width: 14, x: -28, y: -9 }),
  createAvatarHeadSurfaceMarking({ color: '#5b3b24', height: 10, id: 'duck-nostril-right', label: 'Right duck nostril', shape: 'ellipse', side: 'front', targetPartId: 'bill', width: 14, x: 28, y: -9 })
]

export const DUCK_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#497c91',
  material: DUCK_MATERIAL,
  paletteId: 'yellow-duckling',
  surfaceDecals: DUCK_SURFACE_DECALS,
  viewState: { pitch: -.11, positionX: 74, positionY: 91, roll: -.16, scale: 1.7, yaw: -.27 }
})

const PENGUIN_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#303944',
  foregroundColor: '#17202a',
  highlightColor: '#5b6975',
  shadowColor: '#161d25'
}

const PENGUIN_BEAK_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#e69a37',
  foregroundColor: '#5a3923',
  highlightColor: '#ffc56b',
  shadowColor: '#a96523'
}

export const PENGUIN_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 42,
  height: 36,
  leftEyeRotation: -3,
  noseEnabled: false,
  rightEyeRotation: 3,
  width: 21
})

export const PENGUIN_BEAK_PARTS: readonly AvatarEntityPart[] = [
  { ...PENGUIN_BEAK_MATERIAL, face: false, id: 'beak', label: 'Single tapered penguin beak', rotationX: -9, roundness: 58, scaleX: .17, scaleY: .14, scaleZ: .29, shape: 'cone', x: 0, y: 44, z: 82 }
]

export const PENGUIN_PARTS: readonly AvatarEntityPart[] = [
  ...PENGUIN_BEAK_PARTS,
  { ...PENGUIN_MATERIAL, bottomTaper: 7, face: true, id: 'primary', label: 'Tall full three-dimensional penguin head', roundness: 100, scaleX: .69, scaleY: .84, scaleZ: .76, shape: 'ellipse', x: 0, y: 16, z: 0 }
]

export const PENGUIN_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#f1eee4', height: 146, id: 'penguin-face-mask', label: 'Penguin white facial feather mask', shape: 'face-mask', width: 138, x: 0, y: 25 }),
  createAvatarHeadSurfaceMarking({ bend: 12, color: '#935a20', height: 8, id: 'penguin-beak-seam', label: 'Penguin beak curved seam', shape: 'tapered-band', side: 'front', targetPartId: 'beak', width: 108, x: 0, y: 14 }),
  createAvatarHeadSurfaceMarking({ color: '#5a3923', height: 10, id: 'penguin-nostril-left', label: 'Left penguin nostril', shape: 'ellipse', side: 'front', targetPartId: 'beak', width: 13, x: -17, y: -8 }),
  createAvatarHeadSurfaceMarking({ color: '#5a3923', height: 10, id: 'penguin-nostril-right', label: 'Right penguin nostril', shape: 'ellipse', side: 'front', targetPartId: 'beak', width: 13, x: 17, y: -8 })
]

export const PENGUIN_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#6d91aa',
  material: PENGUIN_MATERIAL,
  paletteId: 'emperor-penguin',
  surfaceDecals: PENGUIN_SURFACE_DECALS,
  viewState: { pitch: -.14, positionX: -64, positionY: 86, roll: .13, scale: 1.69, yaw: .26 }
})

const OWL_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#b9966d',
  foregroundColor: '#30251d',
  highlightColor: '#d9bd96',
  shadowColor: '#755a43'
}

const OWL_BEAK_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#d39b45',
  foregroundColor: '#5b4026',
  highlightColor: '#f4c66f',
  shadowColor: '#8d6228'
}

export const OWL_FACE_STYLE = createAvatarHeadFaceStyle({
  eyeRoundness: 100,
  gap: 52,
  height: 42,
  leftEyeRotation: -2,
  noseEnabled: false,
  rightEyeRotation: 2,
  width: 31
})

export const OWL_BEAK_PARTS: readonly AvatarEntityPart[] = [
  { ...OWL_BEAK_MATERIAL, face: false, id: 'beak', label: 'Single shallow hooked owl beak', rotationX: -18, roundness: 54, scaleX: .18, scaleY: .19, scaleZ: .29, shape: 'cone', x: 0, y: 42, z: 84 }
]

export const OWL_TUFT_PARTS: readonly AvatarEntityPart[] = [
  { ...OWL_MATERIAL, face: false, id: 'tuft-left', label: 'Left projecting owl ear feather tuft', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -6, rotationY: -10, rotationZ: -22, roundness: 38, scaleX: .18, scaleY: .38, scaleZ: .18, shape: 'cone', x: -63, y: -91, z: -9 },
  { ...OWL_MATERIAL, face: false, id: 'tuft-right', label: 'Right projecting owl ear feather tuft', occludedByFace: true, occlusionAmount: 8, occlusionPole: 'bottom', rotationX: -6, rotationY: 10, rotationZ: 22, roundness: 38, scaleX: .18, scaleY: .38, scaleZ: .18, shape: 'cone', x: 63, y: -91, z: -9 }
]

export const OWL_PARTS: readonly AvatarEntityPart[] = [
  ...OWL_BEAK_PARTS,
  { ...OWL_MATERIAL, bottomTaper: 3, face: true, id: 'primary', label: 'Broad full three-dimensional owl head', roundness: 100, scaleX: .82, scaleY: .78, scaleZ: .82, shape: 'ellipse', x: 0, y: 14, z: 0 }
]

const OWL_TUFT_DECALS: readonly AvatarSurfaceDecal[] = OWL_TUFT_PARTS.map(part => (
  createAvatarHeadSurfaceMarking({
    color: '#765740',
    height: 148,
    id: `${part.id}-color`,
    label: `${part.label} feather color`,
    shape: 'rounded-triangle',
    side: 'front',
    targetPartId: part.id,
    width: 140,
    x: 0,
    y: 0
  })
))

export const OWL_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#eee0c5', height: 166, id: 'owl-facial-disc', label: 'Owl facial feather disc', shape: 'face-mask', width: 176, x: 0, y: 13 }),
  createAvatarHeadSurfaceMarking({ color: '#8c684b', height: 78, id: 'owl-eye-ring-left', label: 'Left owl eye feather ring', rotation: -7, shape: 'ellipse', width: 76, x: -49, y: -6 }),
  createAvatarHeadSurfaceMarking({ color: '#8c684b', height: 78, id: 'owl-eye-ring-right', label: 'Right owl eye feather ring', rotation: 7, shape: 'ellipse', width: 76, x: 49, y: -6 }),
  createAvatarHeadSurfaceMarking({ bend: 18, color: '#856026', height: 8, id: 'owl-beak-seam', label: 'Owl beak curved seam', shape: 'tapered-band', side: 'front', targetPartId: 'beak', width: 104, x: 0, y: 13 }),
  createAvatarHeadSurfaceMarking({ color: '#5b4026', height: 9, id: 'owl-nostril-left', label: 'Left owl nostril', shape: 'ellipse', side: 'front', targetPartId: 'beak', width: 11, x: -14, y: -9 }),
  createAvatarHeadSurfaceMarking({ color: '#5b4026', height: 9, id: 'owl-nostril-right', label: 'Right owl nostril', shape: 'ellipse', side: 'front', targetPartId: 'beak', width: 11, x: 14, y: -9 })
]

export const createOwlTuftSurfaceDecals = (color = '#765740'): readonly AvatarSurfaceDecal[] => (
  OWL_TUFT_DECALS.map(decal => ({ ...decal, color }))
)

export const OWL_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#34485b',
  material: OWL_MATERIAL,
  paletteId: 'barn-owl',
  surfaceDecals: OWL_SURFACE_DECALS,
  viewState: { pitch: -.08, positionX: 66, positionY: 91, roll: -.17, scale: 1.68, yaw: -.3 }
})

const PARROT_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#c9483d',
  foregroundColor: '#2e2923',
  highlightColor: '#ee7566',
  shadowColor: '#7d2b29'
}

const PARROT_BEAK_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#e3d4b7',
  foregroundColor: '#554437',
  highlightColor: '#fff2d7',
  shadowColor: '#a28e72'
}

export const PARROT_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 48,
  height: 37,
  leftEyeRotation: -4,
  noseEnabled: false,
  rightEyeRotation: 4,
  width: 22
})

export const PARROT_BEAK_PARTS: readonly AvatarEntityPart[] = [
  { ...PARROT_BEAK_MATERIAL, face: false, id: 'beak', label: 'Single continuous hooked parrot beak', rotationX: -25, roundness: 62, scaleX: .27, scaleY: .29, scaleZ: .42, shape: 'cone', x: 0, y: 40, z: 86 }
]

export const PARROT_PARTS: readonly AvatarEntityPart[] = [
  ...PARROT_BEAK_PARTS,
  { ...PARROT_MATERIAL, bottomTaper: 10, face: true, id: 'primary', label: 'Full three-dimensional parrot head', roundness: 98, scaleX: .72, scaleY: .8, scaleZ: .76, shape: 'ellipse', x: 0, y: 14, z: 0 }
]

export const PARROT_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#f2e6ca', height: 126, id: 'parrot-face-patch', label: 'Parrot curved facial feather patch', shape: 'face-mask', width: 132, x: 0, y: 24 }),
  createAvatarHeadSurfaceMarking({ bend: 24, color: '#89735b', height: 9, id: 'parrot-beak-seam', label: 'Parrot beak curved seam', shape: 'tapered-band', side: 'front', targetPartId: 'beak', width: 116, x: 0, y: 13 }),
  createAvatarHeadSurfaceMarking({ color: '#554437', height: 11, id: 'parrot-nostril-left', label: 'Left parrot nostril', shape: 'ellipse', side: 'front', targetPartId: 'beak', width: 13, x: -18, y: -13 }),
  createAvatarHeadSurfaceMarking({ color: '#554437', height: 11, id: 'parrot-nostril-right', label: 'Right parrot nostril', shape: 'ellipse', side: 'front', targetPartId: 'beak', width: 13, x: 18, y: -13 })
]

export const PARROT_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#174f49',
  material: PARROT_MATERIAL,
  paletteId: 'scarlet-macaw',
  surfaceDecals: PARROT_SURFACE_DECALS,
  viewState: { pitch: -.13, positionX: -75, positionY: 88, roll: .2, scale: 1.67, yaw: .31 }
})

const GOOSE_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#eee9dc',
  foregroundColor: '#393631',
  highlightColor: '#ffffff',
  shadowColor: '#b8b2a7'
}

const GOOSE_BILL_MATERIAL: AvatarHeadMaterial = {
  baseColor: '#df913d',
  foregroundColor: '#5b3b25',
  highlightColor: '#ffc06c',
  shadowColor: '#965b25'
}

export const GOOSE_FACE_STYLE = createAvatarHeadFaceStyle({
  gap: 47,
  height: 35,
  leftEyeRotation: -4,
  noseEnabled: false,
  rightEyeRotation: 4,
  width: 21
})

export const GOOSE_BILL_PARTS: readonly AvatarEntityPart[] = [
  { ...GOOSE_BILL_MATERIAL, face: false, id: 'bill', label: 'Single shallow goose bill', roundness: 100, scaleX: .29, scaleY: .14, scaleZ: .23, shape: 'ellipse', x: 0, y: 46, z: 83 }
]

export const GOOSE_PARTS: readonly AvatarEntityPart[] = [
  ...GOOSE_BILL_PARTS,
  { ...GOOSE_MATERIAL, bottomTaper: 15, face: true, id: 'primary', label: 'Long full three-dimensional goose head', roundness: 98, scaleX: .67, scaleY: .83, scaleZ: .73, shape: 'ellipse', x: 0, y: 15, z: 0 }
]

export const GOOSE_SURFACE_DECALS: readonly AvatarSurfaceDecal[] = [
  createAvatarHeadSurfaceMarking({ color: '#f7f3e9', height: 118, id: 'goose-face-patch', label: 'Goose facial feather patch', shape: 'face-mask', width: 124, x: 0, y: 28 }),
  createAvatarHeadSurfaceMarking({ bend: 7, color: '#915323', height: 8, id: 'goose-bill-seam', label: 'Goose bill curved seam', shape: 'tapered-band', side: 'front', targetPartId: 'bill', width: 122, x: 0, y: 15 }),
  createAvatarHeadSurfaceMarking({ color: '#5b3b25', height: 10, id: 'goose-nostril-left', label: 'Left goose nostril', shape: 'ellipse', side: 'front', targetPartId: 'bill', width: 14, x: -24, y: -9 }),
  createAvatarHeadSurfaceMarking({ color: '#5b3b25', height: 10, id: 'goose-nostril-right', label: 'Right goose nostril', shape: 'ellipse', side: 'front', targetPartId: 'bill', width: 14, x: 24, y: -9 })
]

export const GOOSE_PRESET_SCENE = createAvatarHeadOnlyScene({
  cameraBackground: '#7894a6',
  material: GOOSE_MATERIAL,
  paletteId: 'white-gosling',
  surfaceDecals: GOOSE_SURFACE_DECALS,
  viewState: { pitch: -.12, positionX: 69, positionY: 86, roll: -.18, scale: 1.69, yaw: -.28 }
})
