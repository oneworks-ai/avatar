import type {
  CompiledAvatarGeometryInput,
  CompiledAvatarPrimitive,
  CompiledAvatarSurfaceMarking
} from './compiledAvatarMesh'

export const COMPILED_SVG_LAB_SIZE = 420
export const COMPILED_SVG_TWO_SPHERE_RADIUS = 72

export const COMPILED_SVG_TWO_SPHERE_PRIMITIVES: readonly CompiledAvatarPrimitive[] = [
  {
    id: 'black-sphere',
    materialId: 'black',
    position: { x: -34, y: 0, z: -10 },
    scale: { x: 72, y: 72, z: 72 },
    shape: 'sphere'
  },
  {
    id: 'white-sphere',
    materialId: 'white',
    position: { x: 34, y: 0, z: 10 },
    scale: { x: 72, y: 72, z: 72 },
    shape: 'sphere'
  }
]

export const COMPILED_SVG_TWO_SPHERE_INPUT: CompiledAvatarGeometryInput = {
  id: 'compiled-two-sphere-union',
  primitives: COMPILED_SVG_TWO_SPHERE_PRIMITIVES,
  resolution: 20
}

export const COMPILED_SVG_TWO_SPHERE_MATERIALS = {
  black: '#000000',
  white: '#ffffff'
} as const

export interface CompiledAttachmentFixtureOptions {
  readonly includeMuzzle?: boolean
  readonly leftScale?: number
  readonly leftX?: number
  readonly muzzleHeight?: number
  readonly muzzleProtrusion?: number
  readonly muzzleWidth?: number
  readonly muzzleY?: number
  readonly rightScale?: number
  readonly rightX?: number
}

export const createCompiledAttachmentFixture = (
  options: CompiledAttachmentFixtureOptions = {}
): CompiledAvatarGeometryInput => {
  const leftX = options.leftX ?? -56
  const rightX = options.rightX ?? 56
  const leftScale = options.leftScale ?? 1
  const rightScale = options.rightScale ?? 1
  const includeMuzzle = options.includeMuzzle ?? true
  const muzzleHeight = options.muzzleHeight ?? 58
  const muzzleProtrusion = options.muzzleProtrusion ?? 18
  const muzzleWidth = options.muzzleWidth ?? 96
  const muzzleY = options.muzzleY ?? 44
  return {
    id: includeMuzzle ? 'compiled-head-two-ear-muzzle-union' : 'compiled-head-two-ear-union',
    primitives: [
      {
        id: 'head',
        materialId: 'fur',
        position: { x: 0, y: 8, z: 0 },
        scale: { x: 88, y: 94, z: 82 },
        shape: 'ellipsoid'
      },
      {
        id: 'ear-left',
        materialId: 'ear-left',
        position: { x: leftX, y: -65, z: -5 },
        scale: { x: 30 * leftScale, y: 43 * leftScale, z: 23 * leftScale },
        shape: 'ellipsoid'
      },
      {
        id: 'ear-right',
        materialId: 'ear-right',
        position: { x: rightX, y: -65, z: -5 },
        scale: { x: 30 * rightScale, y: 43 * rightScale, z: 23 * rightScale },
        shape: 'ellipsoid'
      },
      ...(includeMuzzle ? [{
        id: 'muzzle',
        materialId: 'fur',
        position: { x: 0, y: muzzleY, z: 52 + muzzleProtrusion },
        scale: { x: muzzleWidth / 2, y: muzzleHeight / 2, z: 28 },
        shape: 'ellipsoid' as const
      }] : [])
    ],
    resolution: 22,
    smoothUnionRadius: includeMuzzle ? 7 : 0
  }
}

export const COMPILED_ATTACHMENT_MATERIALS = {
  'ear-left': '#9b5d36',
  'ear-right': '#9b5d36',
  eye: '#15120f',
  fur: '#ba7647',
  marking: '#ffe2ae',
  mouth: '#3b2419'
} as const

export const COMPILED_ATTACHMENT_MARKINGS: readonly CompiledAvatarSurfaceMarking[] = [
  {
    center: { x: -.28, y: -.08 },
    id: 'left-eye',
    materialId: 'eye',
    radii: { x: .105, y: .15 },
    targetPrimitiveId: 'head',
    visibleNormalZ: .05
  },
  {
    center: { x: .28, y: -.08 },
    id: 'right-eye',
    materialId: 'eye',
    radii: { x: .105, y: .15 },
    targetPrimitiveId: 'head',
    visibleNormalZ: .05
  },
  {
    center: { x: 0, y: 44 },
    coordinateSpace: 'object',
    id: 'muzzle-fur-head',
    materialId: 'marking',
    radii: { x: 52, y: 38 },
    targetPrimitiveId: 'head',
    visibleNormalZ: -1
  },
  {
    center: { x: 0, y: 44 },
    coordinateSpace: 'object',
    id: 'muzzle-fur-volume',
    materialId: 'marking',
    radii: { x: 52, y: 38 },
    targetPrimitiveId: 'muzzle',
    visibleNormalZ: -1
  },
  {
    center: { x: 0, y: 59 },
    coordinateSpace: 'object',
    id: 'muzzle-mouth-seam',
    materialId: 'mouth',
    radii: { x: 17, y: 2.4 },
    targetPrimitiveId: 'muzzle',
    visibleNormalZ: -1
  }
]

export interface CompiledBirdFixtureOptions {
  readonly beakHeight?: number
  readonly beakLength?: number
  readonly beakWidth?: number
  readonly beakY?: number
}

export const createCompiledBirdFixture = (
  options: CompiledBirdFixtureOptions = {}
): CompiledAvatarGeometryInput => {
  const beakHeight = options.beakHeight ?? 30
  const beakLength = options.beakLength ?? 72
  const beakWidth = options.beakWidth ?? 48
  const beakY = options.beakY ?? 38
  const beakBaseZ = 52
  return {
    id: 'compiled-pointed-bird-head',
    primitives: [
      {
        id: 'head',
        materialId: 'feather',
        position: { x: 0, y: 8, z: 0 },
        scale: { x: 84, y: 92, z: 80 },
        shape: 'ellipsoid'
      },
      {
        id: 'beak',
        materialId: 'beak',
        position: { x: 0, y: beakY, z: beakBaseZ + beakLength / 2 },
        rotation: { x: -.38, y: 0, z: 0 },
        scale: { x: beakWidth / 2, y: beakHeight / 2, z: beakLength / 2 },
        shape: 'cone'
      }
    ],
    resolution: 24
  }
}

export const COMPILED_BIRD_MATERIALS = {
  beak: '#df6b2d',
  eye: '#15120f',
  feather: '#e6b34f',
  seam: '#713118'
} as const

export const createCompiledBirdMarkings = (
  options: CompiledBirdFixtureOptions = {}
): readonly CompiledAvatarSurfaceMarking[] => {
  const beakHeight = options.beakHeight ?? 30
  const beakWidth = options.beakWidth ?? 48
  const beakY = options.beakY ?? 38
  return [
    {
      center: { x: -.27, y: -.08 },
      id: 'bird-eye-left',
      materialId: 'eye',
      radii: { x: .1, y: .15 },
      targetPrimitiveId: 'head',
      visibleNormalZ: .05
    },
    {
      center: { x: .27, y: -.08 },
      id: 'bird-eye-right',
      materialId: 'eye',
      radii: { x: .1, y: .15 },
      targetPrimitiveId: 'head',
      visibleNormalZ: .05
    },
    {
      center: { x: 0, y: beakY + beakHeight * .2 },
      coordinateSpace: 'object',
      frontSpace: 'primitive',
      id: 'bird-beak-seam',
      materialId: 'seam',
      radii: { x: beakWidth * .34, y: Math.max(1.8, beakHeight * .07) },
      targetPrimitiveId: 'beak',
      visibleNormalZ: -1
    },
    ...[-1, 1].map(side => ({
      center: { x: side * beakWidth * .17, y: beakY - beakHeight * .12 },
      coordinateSpace: 'object' as const,
      frontSpace: 'primitive' as const,
      id: `bird-beak-nostril-${side < 0 ? 'left' : 'right'}`,
      materialId: 'seam',
      radii: { x: Math.max(2, beakWidth * .055), y: Math.max(1.8, beakHeight * .08) },
      targetPrimitiveId: 'beak',
      visibleNormalZ: -1
    }))
  ]
}

export interface CompiledCatFixtureOptions {
  readonly leftHeight?: number
  readonly leftProtrusion?: number
  readonly leftWidth?: number
  readonly muzzleSpacing?: number
  readonly muzzleY?: number
  readonly rightHeight?: number
  readonly rightProtrusion?: number
  readonly rightWidth?: number
}

export const createCompiledCatFixture = (
  options: CompiledCatFixtureOptions = {}
): CompiledAvatarGeometryInput => {
  const leftHeight = options.leftHeight ?? 54
  const leftProtrusion = options.leftProtrusion ?? 17
  const leftWidth = options.leftWidth ?? 68
  const muzzleSpacing = options.muzzleSpacing ?? 54
  const muzzleY = options.muzzleY ?? 46
  const rightHeight = options.rightHeight ?? 54
  const rightProtrusion = options.rightProtrusion ?? 17
  const rightWidth = options.rightWidth ?? 68
  return {
    id: 'compiled-cat-double-muzzle',
    primitives: [
      {
        id: 'head',
        materialId: 'fur',
        position: { x: 0, y: 8, z: 0 },
        scale: { x: 88, y: 94, z: 82 },
        shape: 'ellipsoid'
      },
      {
        id: 'ear-left',
        materialId: 'ear-left',
        position: { x: -56, y: -65, z: -5 },
        scale: { x: 30, y: 43, z: 23 },
        shape: 'ellipsoid'
      },
      {
        id: 'ear-right',
        materialId: 'ear-right',
        position: { x: 56, y: -65, z: -5 },
        scale: { x: 30, y: 43, z: 23 },
        shape: 'ellipsoid'
      },
      {
        id: 'muzzle-left',
        materialId: 'fur',
        position: { x: -muzzleSpacing / 2, y: muzzleY, z: 52 + leftProtrusion },
        scale: { x: leftWidth / 2, y: leftHeight / 2, z: 27 },
        shape: 'ellipsoid'
      },
      {
        id: 'muzzle-right',
        materialId: 'fur',
        position: { x: muzzleSpacing / 2, y: muzzleY, z: 52 + rightProtrusion },
        scale: { x: rightWidth / 2, y: rightHeight / 2, z: 27 },
        shape: 'ellipsoid'
      }
    ],
    resolution: 24,
    smoothUnionPairs: [
      { primitiveIds: ['head', 'muzzle-left'], radius: 6 },
      { primitiveIds: ['head', 'muzzle-right'], radius: 6 }
    ]
  }
}

export const COMPILED_CAT_MATERIALS = {
  'ear-left': '#8f5233',
  'ear-right': '#8f5233',
  eye: '#15120f',
  fur: '#b86f48',
  marking: '#f6d3a4',
  mouth: '#4a251c',
  nose: '#2c1b18'
} as const

export const createCompiledCatMarkings = (
  options: CompiledCatFixtureOptions = {}
): readonly CompiledAvatarSurfaceMarking[] => {
  const leftHeight = options.leftHeight ?? 54
  const leftWidth = options.leftWidth ?? 68
  const muzzleSpacing = options.muzzleSpacing ?? 54
  const muzzleY = options.muzzleY ?? 46
  const rightHeight = options.rightHeight ?? 54
  const rightWidth = options.rightWidth ?? 68
  const leftX = -muzzleSpacing / 2
  const rightX = muzzleSpacing / 2
  const sharedNose = (targetPrimitiveId: 'muzzle-left' | 'muzzle-right'): CompiledAvatarSurfaceMarking => ({
    center: { x: 0, y: muzzleY - Math.min(leftHeight, rightHeight) * .24 },
    coordinateSpace: 'object',
    id: `cat-nose-${targetPrimitiveId}`,
    materialId: 'nose',
    radii: { x: 8, y: 5 },
    targetPrimitiveId,
    visibleNormalZ: -1
  })
  return [
    {
      center: { x: -.28, y: -.11 },
      id: 'cat-eye-left',
      materialId: 'eye',
      radii: { x: .1, y: .15 },
      targetPrimitiveId: 'head',
      visibleNormalZ: .05
    },
    {
      center: { x: .28, y: -.11 },
      id: 'cat-eye-right',
      materialId: 'eye',
      radii: { x: .1, y: .15 },
      targetPrimitiveId: 'head',
      visibleNormalZ: .05
    },
    {
      center: { x: leftX, y: muzzleY },
      coordinateSpace: 'object',
      id: 'cat-muzzle-fur-left',
      materialId: 'marking',
      radii: { x: leftWidth * .47, y: leftHeight * .46 },
      targetPrimitiveId: 'muzzle-left',
      visibleNormalZ: -1
    },
    {
      center: { x: rightX, y: muzzleY },
      coordinateSpace: 'object',
      id: 'cat-muzzle-fur-right',
      materialId: 'marking',
      radii: { x: rightWidth * .47, y: rightHeight * .46 },
      targetPrimitiveId: 'muzzle-right',
      visibleNormalZ: -1
    },
    sharedNose('muzzle-left'),
    sharedNose('muzzle-right'),
    {
      center: { x: -9, y: muzzleY + 12 },
      coordinateSpace: 'object',
      id: 'cat-mouth-left',
      materialId: 'mouth',
      radii: { x: 13, y: 2.2 },
      rotation: -.24,
      targetPrimitiveId: 'muzzle-left',
      visibleNormalZ: -1
    },
    {
      center: { x: 9, y: muzzleY + 12 },
      coordinateSpace: 'object',
      id: 'cat-mouth-right',
      materialId: 'mouth',
      radii: { x: 13, y: 2.2 },
      rotation: .24,
      targetPrimitiveId: 'muzzle-right',
      visibleNormalZ: -1
    }
  ]
}

export const COMPILED_SVG_DIRECTIONS = [-1, 0, 1].flatMap(x =>
  [-1, 0, 1].flatMap(y =>
    [-1, 0, 1].flatMap(z => (
      x === 0 && y === 0 && z === 0 ? [] : [{ x, y, z }]
    ))
  )
)

export const compiledSvgPoseForDirection = (direction: { readonly x: number, readonly y: number, readonly z: number }) => {
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1
  const x = direction.x / length
  const y = direction.y / length
  const z = direction.z / length
  return {
    pitch: -Math.asin(y),
    roll: 0,
    yaw: Math.atan2(x, z)
  }
}

export const compiledSvgDirectionId = (direction: { readonly x: number, readonly y: number, readonly z: number }) => (
  `dir-x${direction.x < 0 ? 'm' : direction.x > 0 ? 'p' : ''}${Math.abs(direction.x)}`
  + `-y${direction.y < 0 ? 'm' : direction.y > 0 ? 'p' : ''}${Math.abs(direction.y)}`
  + `-z${direction.z < 0 ? 'm' : direction.z > 0 ? 'p' : ''}${Math.abs(direction.z)}`
)
