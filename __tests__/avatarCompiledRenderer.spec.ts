import { describe, expect, it } from 'vitest'

import {
  AVATAR_BODY_SHAPES,
  DEFAULT_AVATAR_FACE_STYLE
} from '../src/avatarGeometry'
import {
  AVATAR_BUILT_IN_ENTITY_PRESETS,
  createAvatarEntityParts,
  getAvatarEntityPresetScene,
  type AvatarEntityPart
} from '../src/avatarEntityPresets'
import {
  createAvatarCompiledGeometryInput,
  createAvatarCompiledRenderCache,
  getAvatarCompiledSurfaceDecalMaterialId,
  projectAvatarCompiledScene
} from '../src/avatarCompiledRenderer'
import type { AvatarSurfaceDecal } from '../src/avatarSurfaceDecals'
import {
  AVATAR_ANIMAL_BREED_TEMPLATES,
  resolveAvatarAnimalBreedTemplate
} from '../src/avatarSpeciesBreeds'
import {
  OWL_PARTS,
  OWL_SURFACE_DECALS,
  PENGUIN_PARTS,
  PENGUIN_SURFACE_DECALS
} from '../src/avatarBirdHeadModels'
import {
  COMPILED_SVG_TWO_SPHERE_INPUT,
  COMPILED_SVG_TWO_SPHERE_PRIMITIVES,
  createCompiledCatFixture
} from '../src/compiledSvgLabFixtures'
import { compileAvatarMesh } from '../src/compiledAvatarMesh'
import { createOptimizedCompiledAvatarProjector } from '../src/compiledAvatarMeshOptimized'

const MATERIAL = {
  baseColor: '#74563c',
  face: false,
  foregroundColor: '#21170f',
  highlightColor: '#b18b68',
  shadowColor: '#402c20'
} as const

describe('production compiled avatar renderer adapter', () => {
  const expectContinuousVectorBoundary = (path: string) => {
    expect(path).toMatch(/^M/)
    expect(path).toMatch(/[QC]/)
    expect(path).not.toMatch(/[hv]/)
    expect(path).not.toMatch(/M\d+ \d+h/)
  }

  const expectAdaptiveCurvedBoundary = (path: string) => {
    expect(path).toMatch(/^M/)
    expect(path).toMatch(/[QC]/)
    expect(path).not.toMatch(/[hv]/)
  }

  const wholeTargetSurfaceOverrides = new Set([
    'chick:chick-beak-explicit-color-override:beak',
    'duck:duck-bill-explicit-color-override:bill',
    'penguin:penguin-beak-explicit-color-override:beak'
  ])

  const isWholeTargetSurfaceOverride = (preset: string, decal: AvatarSurfaceDecal) => (
    wholeTargetSurfaceOverrides.has(`${preset}:${decal.id}:${decal.targetPartId ?? ''}`)
  )

  const expectSemanticSideVisibility = (
    decal: AvatarSurfaceDecal,
    path: string,
    yawDegrees: number,
    label: string,
    preset: string
  ) => {
    if (decal.shape === 'radial-pleats' || isWholeTargetSurfaceOverride(preset, decal)) return
    const side = decal.side ?? 'front'
    if ((side === 'front' || side === 'face') && Math.abs(yawDegrees) === 180) {
      expect(path, `${label}:rear-hidden`).toBe('')
    } else if (side === 'back' && yawDegrees === 0) {
      expect(path, `${label}:front-hidden`).toBe('')
    } else if (side === 'left' && yawDegrees === -90) {
      expect(path, `${label}:left-hidden`).toBe('')
    } else if (side === 'right' && yawDegrees === 90) {
      expect(path, `${label}:right-hidden`).toBe('')
    }
  }

  it('uses the existing Avatar pitch direction for projected anatomy', () => {
    const depthOffsetPart: AvatarEntityPart = {
      ...MATERIAL,
      face: true,
      id: 'depth-offset',
      label: 'Depth offset pitch probe',
      scaleX: .22,
      scaleY: .22,
      scaleZ: .22,
      shape: 'sphere',
      x: 0,
      y: 0,
      z: 48
    }
    const input = createAvatarCompiledGeometryInput('custom', [depthOffsetPart], 22)
    const compiled = createAvatarCompiledRenderCache().get(input)
    const project = (pitch: number) => projectAvatarCompiledScene(compiled, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 240,
      pose: { pitch, roll: 0, yaw: 0 },
      surfaceDecals: [],
      width: 240
    })
    const ownerCentroidY = (projection: ReturnType<typeof projectAvatarCompiledScene>) => {
      let count = 0
      let totalY = 0
      projection.ownerPrimitiveIndexes.forEach((owner, pixelIndex) => {
        if (owner !== 0) return
        count += 1
        totalY += Math.floor(pixelIndex / projection.width)
      })
      expect(count).toBeGreaterThan(0)
      return totalY / count
    }

    // avatarGeometry.rotate projects positive-depth anatomy toward positive
    // screen Y for a positive pitch. Saved scene pitches depend on this sign.
    expect(ownerCentroidY(project(.35))).toBeGreaterThan(ownerCentroidY(project(-.35)))
  })

  it('compiles every public body shape without a legacy fallback', () => {
    const parts = AVATAR_BODY_SHAPES.map((shape, index): AvatarEntityPart => ({
      ...MATERIAL,
      face: index === 0,
      id: `shape-${shape}`,
      label: shape,
      roundness: 48,
      scaleX: .18,
      scaleY: .2,
      scaleZ: .17,
      shape,
      x: (index % 4 - 1.5) * 72,
      y: (Math.floor(index / 4) - 1) * 82,
      z: index % 2 === 0 ? -8 : 8
    }))
    const input = createAvatarCompiledGeometryInput('custom', parts, 22)

    expect(input.primitives.map(primitive => primitive.shape)).toEqual(AVATAR_BODY_SHAPES)
    expect(input.primitives.every(primitive => primitive.productionShape != null)).toBe(true)
  })

  it('keeps geometry compilation stable across pose and color-only projection changes', () => {
    const parts = createAvatarEntityParts('beaver')
    const cache = createAvatarCompiledRenderCache()
    const input = createAvatarCompiledGeometryInput('beaver', parts, 22)
    const compiled = cache.get(input)

    const front = projectAvatarCompiledScene(compiled, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 210,
      pose: { pitch: 0, roll: 0, yaw: 0 },
      surfaceDecals: [],
      width: 210
    })
    const frontOwners = new Int16Array(front.ownerPrimitiveIndexes)
    const side = projectAvatarCompiledScene(compiled, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 210,
      pose: { pitch: .2, roll: 0, yaw: Math.PI / 3 },
      surfaceDecals: [],
      width: 210
    })

    expect(cache.compileCount).toBe(1)
    expect(front.ownerPaths.primary).not.toBe('')
    expect(side.ownerPaths.primary).not.toBe('')
    expect(frontOwners).not.toEqual(side.ownerPrimitiveIndexes)
  })

  it('gives cat and beaver fixtures one total owner partition with target-bound markings', () => {
    const cache = createAvatarCompiledRenderCache()
    for (const preset of ['cat', 'beaver'] as const) {
      const parts = createAvatarEntityParts(preset)
      const input = createAvatarCompiledGeometryInput(preset, parts, 22)
      const compiled = cache.get(input)
      const projection = projectAvatarCompiledScene(compiled, input, {
        faceStyle: DEFAULT_AVATAR_FACE_STYLE,
        height: 240,
        pose: { pitch: -.15, roll: 0, yaw: .65 },
        surfaceDecals: [],
        width: 240
      })

      expect(projection.metrics.nullOwnerPixelCount).toBe(0)
      expect(Object.values(projection.ownerPaths).filter(Boolean).length).toBeGreaterThan(1)
      Object.values(projection.ownerPaths).filter(Boolean).forEach(expectContinuousVectorBoundary)
      projection.ownerPrimitiveIndexes.forEach(owner => {
        expect(owner).toBeGreaterThanOrEqual(-1)
        expect(owner).toBeLessThan(parts.length)
      })
    }
  })

  it('uses shared continuous owner contours for the cat double muzzle junction', () => {
    const input = createCompiledCatFixture()
    const mesh = compileAvatarMesh(input)
    const projector = createOptimizedCompiledAvatarProjector(mesh, input.primitives, {
      height: 240,
      includeOwnerPaths: true,
      referenceSize: 420,
      width: 240
    })
    const projection = projector.project({ pitch: .2, roll: 0, yaw: .55 })

    for (const id of ['head', 'muzzle-left', 'muzzle-right']) {
      expectContinuousVectorBoundary(projection.ownerPaths[id]!)
    }
    expect(projection.metrics.nullOwnerPixelCount).toBe(0)
  })

  it('resolves semantic owners and lazily projects only the selected primitive grid', () => {
    const assertSemanticParts = (
      projection: ReturnType<ReturnType<typeof createOptimizedCompiledAvatarProjector>['project']>,
      partIds: readonly string[]
    ) => {
      for (const partId of partIds) {
        const primitiveIndex = projection.primitiveIds.indexOf(partId)
        const pixelIndex = projection.ownerPrimitiveIndexes.findIndex(owner => owner === primitiveIndex)
        expect(pixelIndex, `${partId} has a frontmost pixel`).toBeGreaterThanOrEqual(0)
        const x = pixelIndex % projection.width + .5
        const y = Math.floor(pixelIndex / projection.width) + .5
        expect(projection.resolveFrontmostPrimitiveId(x, y)).toBe(partId)
        const overlay = projection.getSelectionOverlay(partId)
        expect(overlay.primitiveId).toBe(partId)
        expect(overlay.visiblePixelCount).toBeGreaterThan(0)
        expect(overlay.contourPath).toBe(projection.ownerPaths[partId])
        expect(overlay.gridSegmentCount).toBeGreaterThan(0)
        expect(overlay.gridPath).toMatch(/^M/)
      }
    }

    const catInput = createCompiledCatFixture()
    const catMesh = compileAvatarMesh(catInput)
    expect(catMesh.triangles.every(triangle => (
      Math.abs(triangle.ownerPrimitiveWeights.reduce((sum, weight) => sum + weight, 0) - 1) < 1e-6
    ))).toBe(true)
    expect(catMesh.triangles.some(triangle => (
      triangle.ownerPrimitiveWeights.filter(weight => weight > .01).length > 1
    ))).toBe(true)
    const catProjector = createOptimizedCompiledAvatarProjector(
      catMesh,
      catInput.primitives,
      { height: 240, includeOwnerPaths: true, referenceSize: 420, width: 240 }
    )
    const catProjection = catProjector.project({ pitch: 0, roll: 0, yaw: 0 })
    assertSemanticParts(catProjection, ['head', 'muzzle-left', 'muzzle-right'])
    const stableCatOwners = new Int16Array(catProjection.ownerPrimitiveIndexes)
    const repeatedCatProjection = catProjector.project({ pitch: 0, roll: 0, yaw: 0 })
    expect(repeatedCatProjection.ownerPrimitiveIndexes).toEqual(stableCatOwners)
    repeatedCatProjection.ownerPrimitiveIndexes.forEach((owner, pixelIndex) => {
      if (owner < 0 || pixelIndex % 11 !== 0) return
      expect(repeatedCatProjection.resolveFrontmostPrimitiveId(
        pixelIndex % repeatedCatProjection.width + .5,
        Math.floor(pixelIndex / repeatedCatProjection.width) + .5
      )).toBe(repeatedCatProjection.primitiveIds[owner])
    })

    for (const fixture of [
      { ids: ['primary', 'cheek-left', 'cheek-right', 'tooth-left', 'tooth-right'], preset: 'beaver' },
      { ids: ['primary', 'horn-left', 'horn-right', 'ear-left', 'ear-right'], preset: 'cow' },
      { ids: ['primary', 'mane-top', 'mane-left', 'mane-right'], preset: 'lion' }
    ] as const) {
      const parts = createAvatarEntityParts(fixture.preset)
      const input = createAvatarCompiledGeometryInput(fixture.preset, parts, 20)
      const projection = projectAvatarCompiledScene(
        createAvatarCompiledRenderCache().get(input),
        input,
        {
          faceStyle: DEFAULT_AVATAR_FACE_STYLE,
          height: 300,
          pose: { pitch: -.12, roll: 0, yaw: .24 },
          surfaceDecals: [],
          width: 300
        }
      )
      assertSemanticParts(projection, fixture.ids)
    }
  })

  it('keeps a selected semantic id while its compiled rear overlay becomes empty', () => {
    const parts = createAvatarEntityParts('beaver')
    const input = createAvatarCompiledGeometryInput('beaver', parts, 22)
    const projector = createOptimizedCompiledAvatarProjector(
      createAvatarCompiledRenderCache().get(input),
      input.primitives,
      {
        height: 300,
        includeOwnerPaths: true,
        poseConvention: 'avatar',
        referenceSize: 420,
        width: 300
      }
    )

    const front = projector.project({ pitch: 0, roll: 0, yaw: 0 })
    expect(front.getSelectionOverlay('tooth-left').visiblePixelCount).toBeGreaterThan(0)
    expect(front.getSelectionOverlay('tooth-left').gridSegmentCount).toBeGreaterThan(0)

    const rear = projector.project({ pitch: 0, roll: 0, yaw: Math.PI })
    const rearOverlay = rear.getSelectionOverlay('tooth-left')
    expect(rearOverlay.contourPath).toBe('')
    expect(rearOverlay.gridPath).toBe('')
    expect(rearOverlay.gridSegmentCount).toBe(0)
    expect(rearOverlay.primitiveId).toBe('tooth-left')
    expect(rearOverlay.rawVisiblePixelCount).toBeGreaterThan(0)
    expect(rearOverlay.visibleRatio).toBeLessThan(.1)
    expect(rearOverlay.visiblePixelCount).toBe(0)
    const toothIndex = input.primitives.findIndex(part => part.id === 'tooth-left')
    rear.ownerPrimitiveIndexes.forEach((owner, pixelIndex) => {
      if (owner !== toothIndex) return
      expect(rear.resolveFrontmostPrimitiveId(
        pixelIndex % rear.width + .5,
        Math.floor(pixelIndex / rear.width) + .5
      )).toBeNull()
    })

    const restored = projector.project({ pitch: 0, roll: 0, yaw: 0 })
    expect(restored.getSelectionOverlay('tooth-left').visiblePixelCount).toBeGreaterThan(0)
  })

  it('serializes the two-sphere owner switch from one complementary shared boundary', () => {
    const mesh = compileAvatarMesh(COMPILED_SVG_TWO_SPHERE_INPUT)
    const projector = createOptimizedCompiledAvatarProjector(
      mesh,
      COMPILED_SVG_TWO_SPHERE_PRIMITIVES,
      { height: 420, includeOwnerPaths: true, referenceSize: 420, width: 420 }
    )
    const projection = projector.project({ pitch: .6154797086703874, roll: 0, yaw: -2.356194490192345 })

    expect(projection.metrics.contourSharedCurveReuseCount).toBeGreaterThan(8)
    expect(projection.metrics.nullOwnerPixelCount).toBe(0)
    expectAdaptiveCurvedBoundary(projection.ownerPaths['black-sphere']!)
    expectAdaptiveCurvedBoundary(projection.ownerPaths['white-sphere']!)
  })

  it('fits smooth shared owner boundaries with adaptive SVG curves instead of faceted line runs', () => {
    const parts = createAvatarEntityParts('beaver')
    const input = createAvatarCompiledGeometryInput('beaver', parts, 28)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const options = {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 420,
      pose: { pitch: -.1095, roll: 0, yaw: -.2394 },
      surfaceDecals: [],
      width: 420
    } as const
    const projection = projectAvatarCompiledScene(
      mesh,
      input,
      options
    )
    const repeatedProjection = projectAvatarCompiledScene(mesh, input, options)

    expectAdaptiveCurvedBoundary(projection.ownerPaths.primary!)
    expectAdaptiveCurvedBoundary(projection.ownerPaths['ear-left']!)
    expect(projection.metrics.contourCurveSegmentCount).toBeGreaterThan(24)
    expect(projection.metrics.contourMaxCurveError).toBeLessThanOrEqual(.125)
    for (const sceneScale of [1, 1.7, 2]) {
      expect(projection.metrics.contourMaxCurveError * sceneScale).toBeLessThanOrEqual(.25)
    }
    expect(projection.metrics.contourLineSegmentCount).toBeLessThan(
      projection.metrics.contourSegmentCount
    )
    expect(repeatedProjection.ownerPaths).toEqual(projection.ownerPaths)
    expect(repeatedProjection.metrics.contourCurveSegmentCount).toBe(
      projection.metrics.contourCurveSegmentCount
    )
  })

  it('keeps cow horn and ear owner contours semantic and continuous across pitch', () => {
    const parts = createAvatarEntityParts('cow')
    const input = createAvatarCompiledGeometryInput('cow', parts, 20)
    const mesh = createAvatarCompiledRenderCache().get(input)
    for (const pitch of [-.4, 0, .4]) {
      const projection = projectAvatarCompiledScene(mesh, input, {
        faceStyle: DEFAULT_AVATAR_FACE_STYLE,
        height: 240,
        pose: { pitch, roll: 0, yaw: .45 },
        surfaceDecals: [],
        width: 240
      })
      for (const id of ['horn-left', 'horn-right', 'ear-left', 'ear-right']) {
        const path = projection.ownerPaths[id]
        if (path !== '') expectContinuousVectorBoundary(path!)
      }
    }
  })

  it('samples owl facial markings only on the compiled primary surface', () => {
    const input = createAvatarCompiledGeometryInput('owl', OWL_PARTS, 24)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const facialDisc = OWL_SURFACE_DECALS.find(decal => decal.id === 'owl-facial-disc')!
    const materialId = getAvatarCompiledSurfaceDecalMaterialId('owl', facialDisc)!
    const primaryIndex = input.primitives.findIndex(primitive => primitive.id === 'primary')
    const project = (yaw: number, pitch = 0) => projectAvatarCompiledScene(mesh, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 300,
      pose: { pitch, roll: 0, yaw },
      surfaceDecals: OWL_SURFACE_DECALS,
      width: 300
    })

    expect(materialId).toBe('surface-decal:owl-facial-disc')
    for (const yaw of [0, Math.PI / 3, Math.PI * .47]) {
      const projection = project(yaw)
      expect(projection.materialPaths[materialId]).toMatch(/^M/)
      const materialIndex = projection.materialIds.indexOf(materialId)
      let markedPixelCount = 0
      projection.pixelMaterialIndexes.forEach((pixelMaterialIndex, pixelIndex) => {
        if (pixelMaterialIndex !== materialIndex) return
        markedPixelCount += 1
        expect(projection.ownerPrimitiveIndexes[pixelIndex]).toBe(primaryIndex)
      })
      expect(markedPixelCount).toBeGreaterThan(0)
      expect(projection.metrics.nullOwnerPixelCount).toBe(0)
    }
    expect(project(Math.PI).materialPaths[materialId]).toBe('')
  })

  it('samples cat face markings on the compiled target surface instead of the legacy flat path', () => {
    const parts = createAvatarEntityParts('cat')
    const input = createAvatarCompiledGeometryInput('cat', parts, 24)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const marking: AvatarSurfaceDecal = {
      color: '#f6e4ce',
      height: 154,
      id: 'cat-compiled-face-mask',
      label: 'Cat face coat marking',
      opacity: 100,
      rotation: 0,
      shape: 'face-mask',
      side: 'face',
      targetPartId: 'cat-head',
      width: 138,
      x: 0,
      y: 24
    }
    const materialId = getAvatarCompiledSurfaceDecalMaterialId('cat', marking)
    const projection = projectAvatarCompiledScene(mesh, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 300,
      pose: { pitch: -.18, roll: 0, yaw: Math.PI / 3 },
      surfaceDecals: [marking],
      width: 300
    })

    expect(materialId).toBe('surface-decal:cat-compiled-face-mask')
    expect(projection.materialPaths[materialId!]).toMatch(/^M/)
    const materialIndex = projection.materialIds.indexOf(materialId!)
    const targetIndex = input.primitives.findIndex(primitive => primitive.id === 'cat-head')
    projection.pixelMaterialIndexes.forEach((pixelMaterialIndex, pixelIndex) => {
      if (pixelMaterialIndex === materialIndex) {
        expect(projection.ownerPrimitiveIndexes[pixelIndex]).toBe(targetIndex)
      }
    })
  })

  it('keeps authored marking shape and target semantics in the compiled sampler', () => {
    const input = createAvatarCompiledGeometryInput('owl', OWL_PARTS, 24)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const beakNostril = OWL_SURFACE_DECALS.find(decal => decal.id === 'owl-nostril-left')!
    const beakMaterialId = getAvatarCompiledSurfaceDecalMaterialId('owl', beakNostril)
    const beakProjection = projectAvatarCompiledScene(mesh, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 300,
      pose: { pitch: 0, roll: 0, yaw: .45 },
      surfaceDecals: [beakNostril],
      width: 300
    })
    const beakIndex = input.primitives.findIndex(primitive => primitive.id === 'beak')
    const beakMaterialIndex = beakProjection.materialIds.indexOf(beakMaterialId!)

    expect(beakMaterialId).toBe('surface-decal:owl-nostril-left')
    expect(beakProjection.materialPaths[beakMaterialId!]).toMatch(/^M/)
    beakProjection.pixelMaterialIndexes.forEach((pixelMaterialIndex, pixelIndex) => {
      if (pixelMaterialIndex === beakMaterialIndex) {
        expect(beakProjection.ownerPrimitiveIndexes[pixelIndex]).toBe(beakIndex)
      }
    })

    const projectShape = (shape: AvatarSurfaceDecal['shape']) => {
      const marking: AvatarSurfaceDecal = {
        color: '#eee0c5',
        height: 140,
        id: `shape-${shape}`,
        label: shape,
        opacity: 100,
        rotation: 0,
        shape,
        side: 'face',
        targetPartId: 'primary',
        width: 150,
        x: 0,
        y: 14
      }
      const projection = projectAvatarCompiledScene(mesh, input, {
        faceStyle: DEFAULT_AVATAR_FACE_STYLE,
        height: 240,
        pose: { pitch: 0, roll: 0, yaw: 0 },
        surfaceDecals: [marking],
        width: 240
      })
      const materialId = getAvatarCompiledSurfaceDecalMaterialId('owl', marking)!
      const materialIndex = projection.materialIds.indexOf(materialId)
      return projection.pixelMaterialIndexes.reduce(
        (count, pixelMaterialIndex) => count + Number(pixelMaterialIndex === materialIndex),
        0
      )
    }

    expect(projectShape('face-mask')).not.toBe(projectShape('ellipse'))
  })

  it('keeps every built-in surface marking on an existing semantic target', () => {
    const invalidTargets: string[] = []
    const expectValidTargets = (
      context: string,
      preset: Parameters<typeof getAvatarCompiledSurfaceDecalMaterialId>[0],
      parts: readonly AvatarEntityPart[],
      decals: readonly AvatarSurfaceDecal[]
    ) => {
      const partIds = new Set(parts.map(part => part.id))
      for (const decal of decals) {
        if (decal.targetPartId == null) continue
        if (!partIds.has(decal.targetPartId)) {
          invalidTargets.push(`${context}:${decal.id}:${decal.targetPartId}`)
          continue
        }
        expect(getAvatarCompiledSurfaceDecalMaterialId(preset, decal), `${preset}:${decal.id}`)
          .toBe(`surface-decal:${decal.id}`)
      }
    }

    for (const preset of AVATAR_BUILT_IN_ENTITY_PRESETS) {
      expectValidTargets(
        `preset:${preset}`,
        preset,
        createAvatarEntityParts(preset),
        getAvatarEntityPresetScene(preset)?.surfaceDecals ?? []
      )
    }
    for (const template of AVATAR_ANIMAL_BREED_TEMPLATES) {
      const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${template.id}-surface-target`)
      expectValidTargets(
        `breed:${template.species}:${template.id}`,
        template.species,
        resolved.entityParts,
        resolved.surfaceDecals ?? []
      )
    }
    // The fourth-batch chick crest authoring is intentionally frozen until
    // the renderer migration closes. Keeping the exact debt here prevents it
    // from masking any new invalid target in the shared surface pipeline.
    expect(invalidTargets).toEqual([
      'breed:chick:yellow-chick:crest-comb-front-color:crest-comb-front',
      'breed:chick:yellow-chick:crest-comb-center-color:crest-comb-center',
      'breed:chick:yellow-chick:crest-comb-rear-color:crest-comb-rear',
      'breed:chick:silkie-chick:crest-comb-front-color:crest-comb-front',
      'breed:chick:silkie-chick:crest-comb-center-color:crest-comb-center',
      'breed:chick:silkie-chick:crest-comb-rear-color:crest-comb-rear',
      'breed:chick:buff-orpington-chick:crest-comb-front-color:crest-comb-front',
      'breed:chick:buff-orpington-chick:crest-comb-center-color:crest-comb-center',
      'breed:chick:buff-orpington-chick:crest-comb-rear-color:crest-comb-rear'
    ])
  })

  it('binds procedural pleats and the Claude Spark asset to their compiled bun surfaces', () => {
    const parts = createAvatarEntityParts('bun')
    const decals = getAvatarEntityPresetScene('bun')!.surfaceDecals
    const input = createAvatarCompiledGeometryInput('bun', parts, 24)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const project = (yaw: number) => projectAvatarCompiledScene(mesh, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 240,
      pose: { pitch: 0, roll: 0, yaw },
      surfaceDecals: decals,
      width: 240
    })
    const front = project(0)
    const pleats = getAvatarCompiledSurfaceDecalMaterialId('bun', decals[0]!)!
    const sparkDecal = decals.find(decal => decal.id === 'claude-spark-official')!
    const spark = getAvatarCompiledSurfaceDecalMaterialId('bun', sparkDecal)!
    // The projector intentionally reuses its projection object and typed
    // buffers. Snapshot front-facing evidence before advancing the pose.
    const frontPleatsPath = front.materialPaths[pleats]
    const frontSparkPath = front.materialPaths[spark]
    const frontNullOwnerPixelCount = front.metrics.nullOwnerPixelCount
    const rear = project(Math.PI)
    const rearPleatsPath = rear.materialPaths[pleats]

    expect(frontPleatsPath).toMatch(/^M/)
    expect(frontPleatsPath).toMatch(/C/)
    expect(frontPleatsPath!.match(/M/g)?.length).toBeGreaterThan(2)
    expect(frontSparkPath).toBe('')
    expect(rearPleatsPath).toMatch(/^M/)
    expect(rearPleatsPath).toMatch(/C/)
    expect(rearPleatsPath!.match(/M/g)?.length).toBeGreaterThan(2)
    expect(rear.materialPaths[spark]).toMatch(/^M/)
    expect(rear.materialPaths[spark]).toMatch(/C/)
    expect(frontNullOwnerPixelCount).toBe(0)
    expect(rear.metrics.nullOwnerPixelCount).toBe(0)
  })

  it('projects left-side markings from the target surface instead of a fixed screen plane', () => {
    const part: AvatarEntityPart = {
      ...MATERIAL,
      face: true,
      id: 'primary',
      label: 'Side marking sphere',
      scaleX: .72,
      scaleY: .72,
      scaleZ: .72,
      shape: 'sphere',
      x: 0,
      y: 0,
      z: 0
    }
    const marking: AvatarSurfaceDecal = {
      color: '#ffffff',
      height: 100,
      id: 'left-surface-marking',
      label: 'Left surface marking',
      opacity: 100,
      rotation: 0,
      shape: 'ellipse',
      side: 'left',
      targetPartId: 'primary',
      width: 100,
      x: 0,
      y: 0
    }
    const input = createAvatarCompiledGeometryInput('custom', [part], 24)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const materialId = getAvatarCompiledSurfaceDecalMaterialId('custom', marking)!
    const countPixels = (yaw: number) => {
      const projection = projectAvatarCompiledScene(mesh, input, {
        faceStyle: DEFAULT_AVATAR_FACE_STYLE,
        height: 220,
        pose: { pitch: 0, roll: 0, yaw },
        surfaceDecals: [marking],
        width: 220
      })
      const materialIndex = projection.materialIds.indexOf(materialId)
      return projection.pixelMaterialIndexes.reduce(
        (count, pixelMaterialIndex) => count + Number(pixelMaterialIndex === materialIndex),
        0
      )
    }

    const front = countPixels(0)
    const leftFacing = countPixels(Math.PI / 2)
    const leftHidden = countPixels(-Math.PI / 2)
    expect(leftFacing).toBeGreaterThan(front)
    expect(leftHidden).toBe(0)
  })

  it('keeps a rotated half-cone marking in the optimized material owner field', () => {
    const halfCone: AvatarEntityPart = {
      ...MATERIAL,
      cutAngle: 90,
      face: true,
      id: 'rotated-half-cone',
      label: 'Rotated half-cone',
      roundness: 42,
      scaleX: .5,
      scaleY: .5,
      scaleZ: .5,
      shape: 'half-cone',
      x: 0,
      y: 0,
      z: 0
    }
    const marking: AvatarSurfaceDecal = {
      color: '#fff',
      height: 80,
      id: 'rotated-half-cone-marking',
      label: 'Rotated half-cone marking',
      opacity: 100,
      rotation: 0,
      shape: 'ellipse',
      side: 'front',
      targetPartId: halfCone.id,
      width: 80,
      x: 0,
      y: 0
    }
    const input = createAvatarCompiledGeometryInput('custom', [halfCone], 24)
    const projection = projectAvatarCompiledScene(createAvatarCompiledRenderCache().get(input), input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 180,
      pose: { pitch: 0, roll: 0, yaw: -Math.PI / 2 },
      surfaceDecals: [marking],
      width: 180
    })
    const materialId = getAvatarCompiledSurfaceDecalMaterialId('custom', marking)!
    const materialIndex = projection.materialIds.indexOf(materialId)
    const materialPixels = projection.pixelMaterialIndexes.reduce(
      (count, pixelMaterialIndex) => count + Number(pixelMaterialIndex === materialIndex),
      0
    )

    expect(materialPixels).toBeGreaterThan(0)
    expect(projection.materialPaths[materialId]).toMatch(/C/)
    expect(projection.metrics.nullOwnerPixelCount).toBe(0)
  })

  it('fits internal semantic material boundaries as continuous shared curves', () => {
    const input = createAvatarCompiledGeometryInput('owl', OWL_PARTS, 24)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const projection = projectAvatarCompiledScene(mesh, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 300,
      pose: { pitch: -.38, roll: .13, yaw: -.15 },
      surfaceDecals: OWL_SURFACE_DECALS,
      width: 300
    })
    const materialIds = [
      'primary',
      'beak',
      'surface-decal:owl-facial-disc',
      'surface-decal:owl-nostril-left',
      'surface-decal:owl-nostril-right'
    ]

    for (const materialId of materialIds) {
      const path = projection.materialPaths[materialId]!
      expect(path, materialId).toMatch(/^M/)
      expect(path, materialId).toMatch(/C/)
      expect(path, materialId).not.toMatch(/L/)
    }
    expect(
      projection.materialPaths['surface-decal:owl-facial-disc']!.match(/C/g)?.length ?? 0
    ).toBeLessThan(40)
    expect(projection.metrics.nullOwnerPixelCount).toBe(0)
    expect(projection.metrics.contourMaxCurveError).toBeLessThanOrEqual(.125)
    expect(projection.metrics.contourSharedCurveReuseCount).toBeGreaterThan(0)
  })

  it('keeps cat, owl, and penguin semantic regions curved and surface-bound across the view matrix', () => {
    const catMarking: AvatarSurfaceDecal = {
      color: '#f1cbbd',
      height: 156,
      id: 'cat-face-to-chin',
      label: 'Cat face to chin',
      opacity: 100,
      rotation: 0,
      shape: 'face-mask',
      side: 'face',
      targetPartId: 'cat-head',
      width: 148,
      x: 0,
      y: 24
    }
    const fixtures = [
      {
        decals: [catMarking],
        parts: createAvatarEntityParts('cat'),
        preset: 'cat' as const,
        requiredVisibleDecalId: catMarking.id
      },
      {
        decals: OWL_SURFACE_DECALS,
        parts: OWL_PARTS,
        preset: 'owl' as const,
        requiredVisibleDecalId: 'owl-facial-disc'
      },
      {
        decals: PENGUIN_SURFACE_DECALS,
        parts: PENGUIN_PARTS,
        preset: 'penguin' as const,
        requiredVisibleDecalId: 'penguin-face-mask'
      }
    ]
    const poses = [
      ...[0, -30, 30, -60, 60, -85, 85, -90, 90].map(yaw => ({ pitch: 0, yaw })),
      { pitch: -30, yaw: 0 },
      { pitch: 30, yaw: 0 }
    ].map(pose => ({ pitch: pose.pitch * Math.PI / 180, roll: 0, yaw: pose.yaw * Math.PI / 180 }))

    for (const fixture of fixtures) {
      const input = createAvatarCompiledGeometryInput(fixture.preset, fixture.parts, 20)
      const mesh = createAvatarCompiledRenderCache().get(input)
      for (const pose of poses) {
        const projection = projectAvatarCompiledScene(mesh, input, {
          faceStyle: DEFAULT_AVATAR_FACE_STYLE,
          height: 140,
          pose,
          surfaceDecals: fixture.decals,
          width: 140
        })
        expect(projection.metrics.nullOwnerPixelCount, `${fixture.preset}:${pose.yaw}:${pose.pitch}`).toBe(0)
        for (const decal of fixture.decals) {
          const materialId = getAvatarCompiledSurfaceDecalMaterialId(fixture.preset, decal)
          if (materialId == null) continue
          const path = projection.materialPaths[materialId] ?? ''
          if (decal.id === fixture.requiredVisibleDecalId && Math.abs(pose.yaw) <= Math.PI / 3) {
            expect(path, `${fixture.preset}:${decal.id}:${pose.yaw}:${pose.pitch}:visible`).toMatch(/^M/)
          }
          if (path === '') continue
          expect(path, `${fixture.preset}:${decal.id}:${pose.yaw}:${pose.pitch}`).toMatch(/C/)
          expect(path, `${fixture.preset}:${decal.id}:${pose.yaw}:${pose.pitch}`).not.toMatch(/[LQ]/)
        }
        expect(projection.metrics.contourMaxCurveError).toBeLessThanOrEqual(.125)
      }
      const rear = projectAvatarCompiledScene(mesh, input, {
        faceStyle: DEFAULT_AVATAR_FACE_STYLE,
        height: 140,
        pose: { pitch: 0, roll: 0, yaw: Math.PI },
        surfaceDecals: fixture.decals,
        width: 140
      })
      for (const decal of fixture.decals) {
        const materialId = getAvatarCompiledSurfaceDecalMaterialId(fixture.preset, decal)
        if (materialId != null) expect(rear.materialPaths[materialId], `${fixture.preset}:${decal.id}:rear`).toBe('')
      }
    }
  })

  it('keeps every built-in preset surface marking on its compiled owner across the view matrix', () => {
    const poses = [
      ...[0, -30, 30, -60, 60, -85, 85, -90, 90, 180].map(yaw => ({ pitch: 0, yaw })),
      { pitch: -30, yaw: 0 },
      { pitch: 30, yaw: 0 }
    ].map(pose => ({
      pitch: pose.pitch * Math.PI / 180,
      roll: 0,
      yaw: pose.yaw * Math.PI / 180
    }))

    for (const preset of AVATAR_BUILT_IN_ENTITY_PRESETS) {
      const decals = getAvatarEntityPresetScene(preset)?.surfaceDecals ?? []
      if (decals.length === 0) continue
      for (const decal of decals) {
        expect(decal.targetPartId, `${preset}:${decal.id}:surface-target`).toEqual(expect.any(String))
        expect(decal.targetPartId?.length, `${preset}:${decal.id}:nonempty-target`).toBeGreaterThan(0)
      }
      const parts = createAvatarEntityParts(preset)
      const input = createAvatarCompiledGeometryInput(preset, parts, 12)
      const mesh = createAvatarCompiledRenderCache().get(input)
      const primitiveIndexById = new Map(input.primitives.map((primitive, index) => [primitive.id, index]))
      const pathVisibleDecalIds = new Set<string>()

      for (const pose of poses) {
        const projection = projectAvatarCompiledScene(mesh, input, {
          faceStyle: DEFAULT_AVATAR_FACE_STYLE,
          height: 112,
          pose,
          surfaceDecals: decals,
          width: 112
        })
        const poseLabel = `${preset}:${(pose.yaw * 180 / Math.PI).toFixed(0)}:` +
          `${(pose.pitch * 180 / Math.PI).toFixed(0)}`
        const yawDegrees = Math.round(pose.yaw * 180 / Math.PI)
        expect(projection.metrics.nullOwnerPixelCount, `${poseLabel}:null-owner`).toBe(0)

        for (const decal of decals) {
          if (decal.targetPartId == null) continue
          const targetIndex = primitiveIndexById.get(decal.targetPartId)
          expect(targetIndex, `${preset}:${decal.id}:target`).not.toBeUndefined()
          const materialId = getAvatarCompiledSurfaceDecalMaterialId(preset, decal)!
          const materialIndex = projection.materialIds.indexOf(materialId)
          const path = projection.materialPaths[materialId] ?? ''
          expectSemanticSideVisibility(decal, path, yawDegrees, `${poseLabel}:${decal.id}`, preset)
          if (path === '') continue
          pathVisibleDecalIds.add(decal.id)
          expect(path, `${poseLabel}:${decal.id}:finite`).not.toContain('NaN')
          expect(path, `${poseLabel}:${decal.id}:continuous`).not.toMatch(/L/)
          expect(path, `${poseLabel}:${decal.id}:vector`).toMatch(/[CQ]/)

          projection.pixelMaterialIndexes.forEach((pixelMaterialIndex, pixelIndex) => {
            if (pixelMaterialIndex !== materialIndex) return
            expect(
              projection.ownerPrimitiveIndexes[pixelIndex],
              `${poseLabel}:${decal.id}:owner`
            ).toBe(targetIndex)
          })
        }
      }
      for (const decal of decals) {
        if (decal.targetPartId == null) continue
        expect(pathVisibleDecalIds.has(decal.id), `${preset}:${decal.id}:visible-path`).toBe(true)
      }
    }
  }, 30_000)

  it('keeps every valid breed marking compiled at front, side horizons, and rear', () => {
    const invalidTargets: string[] = []
    const poses = [0, -85, 85, -90, 90, 180].map(yaw => ({
      pitch: 0,
      roll: 0,
      yaw: yaw * Math.PI / 180
    }))

    for (const template of AVATAR_ANIMAL_BREED_TEMPLATES) {
      const resolved = resolveAvatarAnimalBreedTemplate(template, `v1-${template.id}-compiled-matrix`)
      const partIds = new Set(resolved.entityParts.map(part => part.id))
      for (const decal of resolved.surfaceDecals ?? []) {
        expect(decal.targetPartId, `${template.id}:${decal.id}:surface-target`).toEqual(expect.any(String))
        expect(decal.targetPartId?.length, `${template.id}:${decal.id}:nonempty-target`).toBeGreaterThan(0)
      }
      const validDecals = (resolved.surfaceDecals ?? []).filter(decal => {
        if (decal.targetPartId == null || partIds.has(decal.targetPartId)) return true
        invalidTargets.push(`${template.id}:${decal.id}:${decal.targetPartId}`)
        return false
      })
      if (validDecals.length === 0) continue
      const input = createAvatarCompiledGeometryInput(template.species, resolved.entityParts, 10)
      const mesh = createAvatarCompiledRenderCache().get(input)
      const primitiveIndexById = new Map(input.primitives.map((primitive, index) => [primitive.id, index]))
      const visibleDecalIds = new Set<string>()

      for (const pose of poses) {
        const projection = projectAvatarCompiledScene(mesh, input, {
          faceStyle: resolved.faceStyle,
          height: 72,
          pose,
          surfaceDecals: validDecals,
          width: 72
        })
        expect(projection.metrics.nullOwnerPixelCount, `${template.id}:${pose.yaw}:null-owner`).toBe(0)
        const yawDegrees = Math.round(pose.yaw * 180 / Math.PI)
        for (const decal of validDecals) {
          if (decal.targetPartId == null) continue
          const targetIndex = primitiveIndexById.get(decal.targetPartId)
          const materialId = getAvatarCompiledSurfaceDecalMaterialId(template.species, decal)!
          const materialIndex = projection.materialIds.indexOf(materialId)
          const path = projection.materialPaths[materialId] ?? ''
          expectSemanticSideVisibility(
            decal,
            path,
            yawDegrees,
            `${template.id}:${decal.id}:${yawDegrees}`,
            template.species
          )
          if (path === '') continue
          visibleDecalIds.add(decal.id)
          expect(path, `${template.id}:${decal.id}:finite`).not.toContain('NaN')
          expect(path, `${template.id}:${decal.id}:continuous`).not.toMatch(/L/)
          expect(path, `${template.id}:${decal.id}:vector`).toMatch(/[CQ]/)
          projection.pixelMaterialIndexes.forEach((pixelMaterialIndex, pixelIndex) => {
            if (pixelMaterialIndex === materialIndex) {
              expect(projection.ownerPrimitiveIndexes[pixelIndex], `${template.id}:${decal.id}:owner`)
                .toBe(targetIndex)
            }
          })
        }
      }
      for (const decal of validDecals) {
        if (decal.targetPartId != null) {
          expect(visibleDecalIds.has(decal.id), `${template.id}:${decal.id}:visible`).toBe(true)
        }
      }
    }

    expect(invalidTargets).toEqual([
      'yellow-chick:crest-comb-front-color:crest-comb-front',
      'yellow-chick:crest-comb-center-color:crest-comb-center',
      'yellow-chick:crest-comb-rear-color:crest-comb-rear',
      'silkie-chick:crest-comb-front-color:crest-comb-front',
      'silkie-chick:crest-comb-center-color:crest-comb-center',
      'silkie-chick:crest-comb-rear-color:crest-comb-rear',
      'buff-orpington-chick:crest-comb-front-color:crest-comb-front',
      'buff-orpington-chick:crest-comb-center-color:crest-comb-center',
      'buff-orpington-chick:crest-comb-rear-color:crest-comb-rear'
    ])
  }, 60_000)

  it('projects a semantic face region from cached mesh anchors and collapses it at the rear horizon', () => {
    const input = createAvatarCompiledGeometryInput('penguin', PENGUIN_PARTS, 24)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const faceMask = PENGUIN_SURFACE_DECALS.find(decal => decal.id === 'penguin-face-mask')!
    const materialId = getAvatarCompiledSurfaceDecalMaterialId('penguin', faceMask)!
    const projectPath = (yaw: number) => projectAvatarCompiledScene(mesh, input, {
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      height: 300,
      pose: { pitch: 0, roll: 0, yaw },
      surfaceDecals: [faceMask],
      width: 300
    }).materialPaths[materialId] ?? ''
    const pathWidth = (path: string) => {
      const coordinates = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0]))
      const x = coordinates.filter((_, index) => index % 2 === 0)
      if (x.length === 0) return 0
      return Math.max(...x) - Math.min(...x)
    }
    const front = projectPath(0)
    const yaw60 = projectPath(Math.PI / 3)
    const yaw85 = projectPath(85 * Math.PI / 180)
    const rear = projectPath(Math.PI)

    expect(front).toMatch(/C/)
    expect(front).not.toMatch(/[LQ]/)
    expect(pathWidth(yaw60)).toBeLessThan(pathWidth(front))
    expect(pathWidth(yaw85)).toBeLessThan(pathWidth(yaw60))
    expect(rear).toBe('')

    for (const direction of [-1, 1]) {
      const horizonWidths = [88, 89, 90, 91, 92].map(yaw => (
        pathWidth(projectPath(direction * yaw * Math.PI / 180))
      ))
      for (let index = 1; index < horizonWidths.length; index += 1) {
        // The curved chart may widen by a fraction of a pixel immediately
        // after crossing the geometric tangent, but it cannot jump by a
        // whole visible region between adjacent one-degree samples.
        expect(
          Math.abs(horizonWidths[index]! - horizonWidths[index - 1]!),
          `${direction < 0 ? 'left' : 'right'}:${87 + index}->${88 + index}`
        ).toBeLessThanOrEqual(1)
      }
      for (let index = 1; index < horizonWidths.length - 1; index += 1) {
        if (horizonWidths[index] !== 0) continue
        expect(
          Math.min(horizonWidths[index - 1]!, horizonWidths[index + 1]!),
          `${direction < 0 ? 'left' : 'right'}:${88 + index}:isolated-zero`
        ).toBe(0)
      }
    }
  })

  it('keeps user-authored override-like ids as bounded regions instead of repainting the target', () => {
    const primary: AvatarEntityPart = {
      ...MATERIAL,
      face: true,
      id: 'primary',
      label: 'Override id probe',
      scaleX: .72,
      scaleY: .72,
      scaleZ: .72,
      shape: 'sphere',
      x: 0,
      y: 0,
      z: 0
    }
    const decal: AvatarSurfaceDecal = {
      color: '#fff',
      height: 42,
      id: 'chick-beak-explicit-color-override',
      label: 'User region colliding with a built-in override id',
      opacity: 100,
      rotation: 0,
      shape: 'ellipse',
      side: 'front',
      targetPartId: 'primary',
      width: 48,
      x: 0,
      y: 0
    }
    const input = createAvatarCompiledGeometryInput('custom', [primary], 22)
    const projection = projectAvatarCompiledScene(
      createAvatarCompiledRenderCache().get(input),
      input,
      {
        faceStyle: DEFAULT_AVATAR_FACE_STYLE,
        height: 220,
        pose: { pitch: 0, roll: 0, yaw: 0 },
        surfaceDecals: [decal],
        width: 220
      }
    )
    const ownerPixels = projection.ownerPrimitiveIndexes.reduce(
      (count, owner) => count + (owner === 0 ? 1 : 0),
      0
    )
    const materialIndex = projection.materialIds.indexOf(
      getAvatarCompiledSurfaceDecalMaterialId('custom', decal)!
    )
    const markingPixels = projection.pixelMaterialIndexes.reduce(
      (count, material) => count + (material === materialIndex ? 1 : 0),
      0
    )

    expect(markingPixels).toBeGreaterThan(0)
    expect(markingPixels).toBeLessThan(ownerPixels / 3)
  })

  it('keeps horizon-separated surface regions as distinct vector components without a screen bridge', () => {
    const primary: AvatarEntityPart = {
      ...MATERIAL,
      face: true,
      id: 'primary',
      label: 'Concave horizon probe',
      scaleX: .76,
      scaleY: .76,
      scaleZ: .76,
      shape: 'sphere',
      x: 0,
      y: 0,
      z: 0
    }
    const input = createAvatarCompiledGeometryInput('custom', [primary], 26)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const boundary = [
      { x: -.45, y: -.65 },
      { x: .55, y: -.65 },
      { x: .55, y: .65 },
      { x: -.45, y: .65 },
      { x: -.45, y: .2 },
      { x: .35, y: .2 },
      { x: .35, y: -.2 },
      { x: -.45, y: -.2 }
    ]
    const projector = createOptimizedCompiledAvatarProjector(mesh, input.primitives, {
      height: 280,
      markings: [{
        area: 1,
        boundary,
        bounds: { maxX: .55, maxY: .65, minX: -.45, minY: -.65 },
        cacheKey: 'concave-horizon-probe',
        center: { x: 0, y: 0 },
        coordinateSpace: 'primitive',
        id: 'concave-horizon-probe',
        materialId: 'concave-mark',
        radii: { x: .55, y: .65 },
        side: 'front',
        surfaceMapping: 'avatar-authored-v1',
        targetPrimitiveId: 'primary',
        visibleNormalZ: -1
      }],
      poseConvention: 'avatar',
      referenceSize: 420,
      width: 280
    })
    const projection = projector.project({
      pitch: 0,
      roll: 0,
      yaw: 70 * Math.PI / 180
    })
    const path = projection.materialPaths['concave-mark'] ?? ''

    expect(path.match(/M/g)?.length).toBe(2)
    expect(path).toMatch(/C/)
    expect(path).not.toMatch(/[LQ]/)
    expect(projection.metrics.nullOwnerPixelCount).toBe(0)

    const exactHorizon = projector.project({
      pitch: 0,
      roll: 0,
      yaw: Math.PI / 2
    })
    const exactHorizonPath = exactHorizon.materialPaths['concave-mark'] ?? ''
    expect(exactHorizonPath).not.toContain('NaN')
    expect(exactHorizonPath).not.toMatch(/[LQ]/)
    expect(exactHorizon.metrics.nullOwnerPixelCount).toBe(0)
  })

  it('keeps self-intersecting authored regions on the same even-odd contour path across the horizon', () => {
    const primary: AvatarEntityPart = {
      ...MATERIAL,
      face: true,
      id: 'primary',
      label: 'Self-intersection probe',
      scaleX: .76,
      scaleY: .76,
      scaleZ: .76,
      shape: 'sphere',
      x: 0,
      y: 0,
      z: 0
    }
    const input = createAvatarCompiledGeometryInput('custom', [primary], 24)
    const mesh = createAvatarCompiledRenderCache().get(input)
    const projector = createOptimizedCompiledAvatarProjector(mesh, input.primitives, {
      height: 220,
      markings: [{
        area: 1,
        boundary: [
          { x: -.55, y: -.5 },
          { x: .55, y: .5 },
          { x: -.55, y: .5 },
          { x: .55, y: -.5 }
        ],
        bounds: { maxX: .55, maxY: .5, minX: -.55, minY: -.5 },
        cacheKey: 'self-intersection-probe',
        center: { x: 0, y: 0 },
        coordinateSpace: 'primitive',
        id: 'self-intersection-probe',
        materialId: 'self-intersection-mark',
        radii: { x: .55, y: .5 },
        side: 'front',
        surfaceMapping: 'avatar-authored-v1',
        targetPrimitiveId: 'primary',
        visibleNormalZ: -1
      }],
      poseConvention: 'avatar',
      referenceSize: 420,
      width: 220
    })

    for (const yawDegrees of [0, 89, 90, 91]) {
      const projection = projector.project({
        pitch: 0,
        roll: 0,
        yaw: yawDegrees * Math.PI / 180
      })
      const path = projection.materialPaths['self-intersection-mark'] ?? ''
      expect(path, `yaw ${yawDegrees}`).not.toContain('NaN')
      expect(path, `yaw ${yawDegrees}`).not.toMatch(/L/)
      expect(projection.metrics.nullOwnerPixelCount, `yaw ${yawDegrees}`).toBe(0)
    }
  })
})
