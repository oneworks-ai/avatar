import { describe, expect, it } from 'vitest'

import {
  AVATAR_FRAGMENT_RENDER_BUDGET,
  buildAvatarFragmentRenderGraph,
  resolveFrontmostPartAtPoint,
  type AvatarProjectedPartSurface
} from '../src/avatarFragmentRenderGraph'
import type { BodyGeometry, BodySurfaceTriangle } from '../src/avatarGeometry'
import { buildAvatarBodyGeometry } from '../src/avatarGeometry'
import {
  applyBeaverToothSize,
  applyChickBeakSize,
  applyChickBeakStyle,
  applyCowForelockStyle,
  applyCowHeadScale,
  applyCowHornSize,
  applyCowHornStyle,
  BEAVER_TOOTH_SIZE_RANGE,
  CHICK_BEAK_SIZE_RANGE,
  createAvatarEntityParts
} from '../src/avatarEntityPresets'
import { getAvatarAnimalBreedTemplate, resolveAvatarAnimalBreedTemplate } from '../src/avatarSpeciesBreeds'

const triangle = (
  id: string,
  points: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number]
  ]
): BodySurfaceTriangle => {
  const vertices = points.map(([x, y, depth]) => ({ depth, x, y })) as unknown as BodySurfaceTriangle['vertices']
  const depths = vertices.map(vertex => vertex.depth)
  const xs = vertices.map(vertex => vertex.x)
  const ys = vertices.map(vertex => vertex.y)
  return {
    bounds: { maxX: Math.max(...xs), maxY: Math.max(...ys), minX: Math.min(...xs), minY: Math.min(...ys) },
    id,
    maxDepth: Math.max(...depths),
    meanDepth: depths.reduce((total, depth) => total + depth, 0) / depths.length,
    minDepth: Math.min(...depths),
    vertices
  }
}

const geometry = (...surfaceTriangles: readonly BodySurfaceTriangle[]): BodyGeometry => ({
  cells: [],
  outlinePath: 'M 0 0 L 10 0 L 0 10 Z',
  surfaceTriangles
})

const pathArea = (path: string | undefined) => path == null ? 0 : path.split(/(?=M )/).reduce((total, subpath) => {
  const values = Array.from(subpath.matchAll(/-?\d+(?:\.\d+)?/g), match => Number(match[0]))
  const points = Array.from({ length: Math.floor(values.length / 2) }, (_, index) => ({
    x: values[index * 2]!,
    y: values[index * 2 + 1]!
  }))
  return total + Math.abs(points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length]!
    return area + point.x * next.y - next.x * point.y
  }, 0) / 2)
}, 0)

const part = (
  id: string,
  index: number,
  surface: BodyGeometry,
  offsets: Partial<Pick<AvatarProjectedPartSurface, 'anchorDepth' | 'projectedX' | 'projectedY'>> = {}
): AvatarProjectedPartSurface => ({
  anchorDepth: offsets.anchorDepth ?? 0,
  geometry: surface,
  id,
  index,
  projectedX: offsets.projectedX ?? 0,
  projectedY: offsets.projectedY ?? 0
})

const graphForParts = (
  entityParts: ReturnType<typeof createAvatarEntityParts>,
  pose = { pitch: -.18, yaw: Math.PI / 3 },
  options: { readonly compositorDensity?: number, readonly quality?: 'full' | 'interactive' } = {}
) => {
  const cosYaw = Math.cos(pose.yaw)
  const sinYaw = Math.sin(pose.yaw)
  const cosPitch = Math.cos(pose.pitch)
  const sinPitch = Math.sin(pose.pitch)
  return buildAvatarFragmentRenderGraph(entityParts.map((entityPart, index) => {
    const yawX = entityPart.x * cosYaw + entityPart.z * sinYaw
    const yawZ = -entityPart.x * sinYaw + entityPart.z * cosYaw
    return {
      anchorDepth: -entityPart.y * sinPitch + yawZ * cosPitch,
      geometry: buildAvatarBodyGeometry(entityPart.shape, pose, { azimuth: -35, elevation: 40 }, 100, {
        bottomTaper: entityPart.bottomTaper,
        compositorDensity: options.compositorDensity,
        cutAngle: entityPart.cutAngle,
        hollow: entityPart.hollow,
        occlusionAmount: entityPart.occlusionAmount,
        occlusionPole: entityPart.occlusionPole,
        rotationX: entityPart.rotationX,
        rotationY: entityPart.rotationY,
        rotationZ: entityPart.rotationZ,
        roundness: entityPart.roundness,
        scaleX: entityPart.scaleX,
        scaleY: entityPart.scaleY,
        scaleZ: entityPart.scaleZ,
        topScale: entityPart.topScale
      }),
      id: entityPart.id,
      index,
      occludedByFaceHint: entityPart.occludedByFace,
      projectedX: yawX,
      projectedY: entityPart.y * cosPitch + yawZ * sinPitch
    }
  }), { quality: options.quality })
}

const graphForPreset = (
  preset: Parameters<typeof createAvatarEntityParts>[0],
  pose = { pitch: -.18, yaw: Math.PI / 3 }
) => graphForParts(createAvatarEntityParts(preset), pose)

const findVisiblePartSample = (graph: ReturnType<typeof graphForParts>, partId: string) => {
  const node = graph.nodes.find(candidate => candidate.partId === partId)
  if (node == null) return undefined
  return node.surfaceTriangles.map(surfaceTriangle => ({
    x: surfaceTriangle.vertices.reduce((total, vertex) => total + vertex.x, 0) / 3,
    y: surfaceTriangle.vertices.reduce((total, vertex) => total + vertex.y, 0) / 3
  })).find(point => resolveFrontmostPartAtPoint(graph, point.x, point.y)?.partId === partId)
}

describe('avatar fragment render graph', () => {
  it('keeps non-intersecting parts as single stable nodes without occlusion patches', () => {
    const surface = geometry(triangle('surface', [[0, 0, 0], [20, 0, 0], [0, 20, 0]]))
    const input = [part('left', 0, surface), part('right', 1, surface, { projectedX: 80 })]
    const first = buildAvatarFragmentRenderGraph(input)
    const second = buildAvatarFragmentRenderGraph(input)

    expect(first).toEqual(second)
    expect(first.metrics).toMatchObject({ intersectingPartCount: 0, occlusionPatchCount: 0, partCount: 2 })
    expect(first.nodes).toHaveLength(2)
    expect(first.nodes.every(node => !node.intersects && node.occlusionPath == null)).toBe(true)
    expect(first.nodes.every(node => node.drawCavity && node.drawOutline)).toBe(true)
  })

  it('splits a local overlap where surface depth changes sign along triangle edges', () => {
    const ascending = geometry(triangle('ascending', [[0, 0, -8], [30, 0, 8], [0, 30, 8]]))
    const flat = geometry(triangle('flat', [[0, 0, 0], [30, 0, 0], [0, 30, 0]]))
    const graph = buildAvatarFragmentRenderGraph([
      part('primary', 0, flat),
      part('muzzle', 1, ascending)
    ])
    const primary = graph.nodes.find(node => node.partId === 'primary')!
    const muzzle = graph.nodes.find(node => node.partId === 'muzzle')!

    expect(graph.metrics.intersectingPartCount).toBe(2)
    expect(primary.occlusionPatchCount).toBeGreaterThan(0)
    expect(muzzle.occlusionPatchCount).toBeGreaterThan(0)
    expect(primary.occlusionPath).toContain('M ')
    expect(muzzle.occlusionPath).toContain('M ')
    const partitionArea = pathArea(primary.occlusionPath) + pathArea(muzzle.occlusionPath)
    expect(Math.abs(partitionArea - 450) / 450).toBeLessThan(.01)
    expect(Math.max(primary.simplificationAreaErrorRatio, muzzle.simplificationAreaErrorRatio)).toBeLessThan(.03)
    expect(resolveFrontmostPartAtPoint(graph, 2, 2)?.partId).toBe('primary')
    expect(resolveFrontmostPartAtPoint(graph, 20, 2)?.partId).toBe('muzzle')
  })

  it('changes the cache identity when stable tie ownership changes', () => {
    const surface = geometry(triangle('surface', [[0, 0, 0], [20, 0, 0], [0, 20, 0]]))
    const first = buildAvatarFragmentRenderGraph([part('left', 0, surface), part('right', 1, surface)])
    const swapped = buildAvatarFragmentRenderGraph([part('left', 1, surface), part('right', 0, surface)])

    expect(first.cacheKey).not.toBe(swapped.cacheKey)
  })

  it('compares overlapping attachments even without the legacy occludedByFace hint', () => {
    const rearToFront = geometry(triangle('rear-to-front', [[0, 0, -6], [24, 0, 6], [0, 24, 6]]))
    const frontToRear = geometry(triangle('front-to-rear', [[0, 0, 6], [24, 0, -6], [0, 24, -6]]))
    const graph = buildAvatarFragmentRenderGraph([
      part('mane-left', 0, rearToFront),
      part('mane-right', 1, frontToRear)
    ])

    expect(graph.metrics.intersectingPartCount).toBe(2)
    expect(graph.metrics.trianglePairTests).toBeGreaterThan(0)
    expect(graph.nodes.every(node => node.occlusionPatchCount > 0)).toBe(true)
  })

  it('keeps unique semantic owners while local masks partition many overlapping attachments', () => {
    const primary = geometry(triangle('primary', [[0, 0, 0], [32, 0, 0], [0, 32, 0]]))
    const branchA = geometry(triangle('branch-a', [[0, 0, -10], [32, 0, 10], [0, 32, 10]]))
    const branchB = geometry(triangle('branch-b', [[0, 0, 10], [32, 0, -10], [0, 32, -10]]))
    const graph = buildAvatarFragmentRenderGraph([
      part('primary', 0, primary),
      part('antler-branch-a', 1, branchA),
      part('antler-branch-b', 2, branchB)
    ])

    expect(new Set(graph.nodes.map(node => node.partId)).size).toBe(3)
    expect(graph.nodes.filter(node => node.drawOutline)).toHaveLength(3)
    expect(graph.nodes.filter(node => node.drawCavity)).toHaveLength(3)
    expect(graph.metrics.rawOcclusionPatchCount).toBeGreaterThanOrEqual(4)
    expect(graph.metrics.occlusionPatchCount).toBeLessThan(graph.metrics.rawOcclusionPatchCount)
  })

  it('uses complementary stable ownership for near-zero depth without transparent seams', () => {
    const almostTied = geometry(triangle('almost-tied', [[0, 0, -.001], [30, 0, .03], [0, 30, -.001]]))
    const flat = geometry(triangle('flat', [[0, 0, 0], [30, 0, 0], [0, 30, 0]]))
    const original = buildAvatarFragmentRenderGraph([part('primary', 0, flat), part('feature', 1, almostTied)])
    const swapped = buildAvatarFragmentRenderGraph([part('feature', 1, almostTied), part('primary', 0, flat)])
    const area = (graph: typeof original) => graph.nodes.reduce((total, node) => total + pathArea(node.occlusionPath), 0)

    expect(Math.abs(area(original) - 450) / 450).toBeLessThan(.012)
    expect(area(swapped)).toBeCloseTo(area(original), 4)
    expect(resolveFrontmostPartAtPoint(original, 2, 2)?.partId)
      .toBe(resolveFrontmostPartAtPoint(swapped, 2, 2)?.partId)
    expect(original.nodes.every(node => node.simplificationAreaErrorRatio < .03)).toBe(true)
  })

  it('assigns every coplanar three-part sample to one deterministic front owner', () => {
    const surface = geometry(triangle('shared', [[0, 0, 0], [30, 0, 0], [0, 30, 0]]))
    const original = buildAvatarFragmentRenderGraph([
      part('primary', 0, surface),
      part('forelock', 1, surface),
      part('horn', 2, surface)
    ])
    const reordered = buildAvatarFragmentRenderGraph([
      part('horn', 2, surface),
      part('primary', 0, surface),
      part('forelock', 1, surface)
    ])

    for (const point of [{ x: 2, y: 2 }, { x: 12, y: 4 }, { x: 4, y: 12 }]) {
      expect(resolveFrontmostPartAtPoint(original, point.x, point.y)?.partId).toBe('horn')
      expect(resolveFrontmostPartAtPoint(reordered, point.x, point.y)?.partId).toBe('horn')
    }
    expect(original.nodes.filter(node => node.occlusionPath == null).map(node => node.partId)).toEqual(['horn'])
  })

  it.each(['nostril', 'short-beak', 'antler-branch'])('preserves a sub-cell $preset overlap as exact geometry', preset => {
    const head = geometry(triangle('head', [[0, 0, 0], [400, 0, 0], [0, 400, 0]]))
    const narrow = geometry(triangle(preset, [[.1, .1, -2], [.5, .1, 8], [.1, .5, 8]]))
    const projectedParts = [part('primary', 0, head), part(preset, 1, narrow)]
    const graph = buildAvatarFragmentRenderGraph(projectedParts)
    const interactiveGraph = buildAvatarFragmentRenderGraph(projectedParts, { quality: 'interactive' })

    expect(graph.metrics.rasterizationErrorRatio).toBeLessThan(.05)
    expect(graph.nodes.find(node => node.partId === 'primary')?.occlusionPolygons.length).toBeGreaterThan(0)
    expect(resolveFrontmostPartAtPoint(graph, .2, .2)?.partId).toBe(preset)
    expect(interactiveGraph.nodes.find(node => node.partId === 'primary')?.occlusionPolygons.length).toBeGreaterThan(0)
    expect(resolveFrontmostPartAtPoint(interactiveGraph, .2, .2)?.partId).toBe(preset)
  })

  it('refines a one-cell overlap whose exact area is much smaller than the raster cell', () => {
    const head = geometry(triangle('head', [[0, 0, 0], [400, 0, 0], [0, 400, 0]]))
    const narrow = geometry(triangle('one-cell-nostril', [
      [200, 100, -2],
      [202.6, 100, 8],
      [200, 102.6, 8]
    ]))
    const projectedParts = [part('primary', 0, head), part('one-cell-nostril', 1, narrow)]
    const graph = buildAvatarFragmentRenderGraph(projectedParts)
    const interactiveGraph = buildAvatarFragmentRenderGraph(projectedParts, { quality: 'interactive' })

    expect(graph.metrics.rasterizationMeasured).toBe(true)
    expect(graph.metrics.rasterizationErrorRatio).toBeLessThan(.01)
    expect(resolveFrontmostPartAtPoint(graph, 200.4, 100.4)?.partId).toBe('one-cell-nostril')
    expect(resolveFrontmostPartAtPoint(graph, 202.3, 102.3)?.partId).toBe('primary')
    expect(resolveFrontmostPartAtPoint(interactiveGraph, 200.4, 100.4)?.partId).toBe('one-cell-nostril')
    expect(resolveFrontmostPartAtPoint(interactiveGraph, 202.3, 102.3)?.partId).toBe('primary')
  })

  it('keeps a middle surface visible outside a narrow third surface in one shared cell', () => {
    const head = geometry(triangle('head', [[0, 0, 0], [400, 0, 0], [0, 400, 0]]))
    const middle = geometry(triangle('middle', [
      [200, 100, 4],
      [215, 100, 4],
      [200, 115, 4]
    ]))
    const narrow = geometry(triangle('nostril', [
      [200, 100, -2],
      [202.6, 100, 8],
      [200, 102.6, 8]
    ]))
    const projectedParts = [
      part('primary', 0, head),
      part('middle', 1, middle),
      part('nostril', 2, narrow)
    ]

    for (const quality of ['full', 'interactive'] as const) {
      const graph = buildAvatarFragmentRenderGraph(projectedParts, { quality })
      expect(resolveFrontmostPartAtPoint(graph, 201.6, 100.6)?.partId).toBe('nostril')
      expect(resolveFrontmostPartAtPoint(graph, 205, 105)?.partId).toBe('middle')
      if (quality === 'full') {
        expect(graph.metrics.rasterizationErrorRatio)
          .toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxRasterizationErrorRatio)
      }
    }
  })

  it.each([
    {
      anatomyPartId: 'nostril-left',
      parts: createAvatarEntityParts('pig'),
      preset: 'pig nostril'
    },
    {
      anatomyPartId: 'beak-upper',
      parts: applyChickBeakSize(
        applyChickBeakStyle(createAvatarEntityParts('chick'), 'short'),
        CHICK_BEAK_SIZE_RANGE.min
      ),
      preset: 'chick short beak'
    },
    {
      anatomyPartId: 'tooth-left',
      parts: applyBeaverToothSize(createAvatarEntityParts('beaver'), BEAVER_TOOTH_SIZE_RANGE.min),
      preset: 'beaver tooth'
    }
  ])('preserves the real minimum-size $preset in full and interactive graphs', ({ anatomyPartId, parts }) => {
    const pose = { pitch: 0, yaw: 0 }
    const graph = graphForParts(parts, pose, { compositorDensity: 1, quality: 'full' })
    const interactiveGraph = graphForParts(parts, pose, { compositorDensity: .5, quality: 'interactive' })

    const fullNode = graph.nodes.find(node => node.partId === anatomyPartId)
    const interactiveNode = interactiveGraph.nodes.find(node => node.partId === anatomyPartId)
    expect(fullNode).toBeDefined()
    expect(interactiveNode).toBeDefined()
    expect(fullNode?.interactionVisibleArea).toBeGreaterThan(0)
    expect(fullNode?.interactionVisiblePath).toBeTruthy()
    expect(interactiveNode?.interactionVisibleArea).toBeGreaterThan(0)
    expect(interactiveNode?.interactionVisiblePath).toBeTruthy()
    expect(graph.metrics.rasterizationErrorRatio)
      .toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxRasterizationErrorRatio)
    expect(findVisiblePartSample(graph, anatomyPartId)).toBeDefined()
    expect(findVisiblePartSample(interactiveGraph, anatomyPartId)).toBeDefined()
  })

  it('keeps interactive beaver ownership total without using overlay visibility as paint visibility', () => {
    const parts = resolveAvatarAnimalBreedTemplate(
      getAvatarAnimalBreedTemplate('beaver', 'north-american-beaver')!,
      'v1-0auditfixed000000000'
    ).entityParts
    const graph = graphForParts(parts, { pitch: 0, yaw: 1.04345756 }, {
      compositorDensity: .5,
      quality: 'interactive'
    })
    const farCheek = graph.nodes.find(node => node.partId === 'cheek-right')

    expect(farCheek?.projectedAreaEstimate).toBeGreaterThan(0)
    expect(farCheek?.interactionVisibleArea).toBe(0)
    expect(farCheek?.visibleAreaEstimate).toBeGreaterThan(0)

    const coveredTriangleCenters = graph.nodes.flatMap(node => node.surfaceTriangles.map(surfaceTriangle => ({
      partId: node.partId,
      x: surfaceTriangle.vertices.reduce((total, vertex) => total + vertex.x, 0) / 3,
      y: surfaceTriangle.vertices.reduce((total, vertex) => total + vertex.y, 0) / 3
    })))
    expect(coveredTriangleCenters.filter(point => (
      resolveFrontmostPartAtPoint(graph, point.x, point.y) == null
    ))).toEqual([])
  })

  it('keeps the reported beaver still angle fully owned with bounded shared boundaries', () => {
    const parts = resolveAvatarAnimalBreedTemplate(
      getAvatarAnimalBreedTemplate('beaver', 'north-american-beaver')!,
      'v1-0auditfixed000000000'
    ).entityParts
    const graph = graphForParts(parts, { pitch: -.1095, yaw: -.2394 }, {
      compositorDensity: 1,
      quality: 'full'
    })

    const coveredTriangleCenters = graph.nodes.flatMap(node => node.surfaceTriangles.map(surfaceTriangle => ({
      partId: node.partId,
      x: surfaceTriangle.vertices.reduce((total, vertex) => total + vertex.x, 0) / 3,
      y: surfaceTriangle.vertices.reduce((total, vertex) => total + vertex.y, 0) / 3
    })))
    expect(coveredTriangleCenters.filter(point => (
      resolveFrontmostPartAtPoint(graph, point.x, point.y) == null
    ))).toEqual([])
    expect(graph.nodes.every(node => node.visibleAreaEstimate >= node.interactionVisibleArea)).toBe(true)
    expect(graph.nodes.every(node => !node.occlusionPath?.includes('NaN'))).toBe(true)
    expect(Math.max(...graph.nodes.map(node => node.maxBoundaryDisplacement))).toBeLessThan(4)
  })

  it.each([
    { ids: ['primary', 'beak-upper', 'beak-lower'], preset: 'owl' as const },
    { ids: ['primary', 'beak-upper', 'beak-lower'], preset: 'parrot' as const },
    { ids: ['primary', 'muzzle'], preset: 'monkey' as const },
    { ids: ['primary', 'snout', 'nostril-left'], preset: 'cow' as const },
    { ids: ['primary', 'mane-back'], preset: 'lion' as const },
    { ids: ['primary', 'antler-left'], preset: 'deer' as const },
    { ids: ['primary', 'spine-core'], preset: 'hedgehog' as const },
    { ids: ['primary', 'tail-base', 'cheek-left'], preset: 'squirrel' as const }
  ])('partitions real $preset anatomy using local surface overlap', ({ ids, preset }) => {
    const graph = graphForPreset(preset)

    expect(graph.nodes.map(node => node.partId)).toEqual(expect.arrayContaining(ids))
    expect(ids.some(id => graph.nodes.find(node => node.partId === id)?.occlusionPatchCount)).toBe(true)
    expect(graph.metrics.intersectingPartCount).toBeGreaterThanOrEqual(2)
    expect(graph.metrics.trianglePairTests).toBeLessThan(150_000)
  })

  it.each([
    { maxPathCharacters: 18_000, maxSegments: 1_000, preset: 'hedgehog' as const },
    { maxPathCharacters: 22_000, maxSegments: 1_200, preset: 'lion' as const },
    { maxPathCharacters: 13_000, maxSegments: 750, preset: 'sheep' as const },
    { maxPathCharacters: 11_000, maxSegments: 650, preset: 'squirrel' as const }
  ])(
    'keeps compressed $preset masks within a bounded SVG path budget at 85 degrees',
    ({ maxPathCharacters, maxSegments, preset }) => {
      const graph = graphForPreset(preset, { pitch: 0, yaw: 85 * Math.PI / 180 })
      expect(graph.metrics.occlusionPatchCount).toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxOcclusionPatches)
      expect(graph.metrics.occlusionSegmentCount).toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxSegments)
      expect(graph.metrics.occlusionPathCharacterCount).toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxPathCharacters)
      expect(graph.metrics.occlusionPathCharacterCount).toBeLessThanOrEqual(maxPathCharacters)
      expect(graph.metrics.occlusionSegmentCount).toBeLessThanOrEqual(maxSegments)
      expect(Math.max(...graph.nodes.map(node => node.occlusionSegmentCount)))
        .toBeLessThanOrEqual(AVATAR_FRAGMENT_RENDER_BUDGET.maxSegmentsPerPart)
      expect(Math.max(...graph.nodes.map(node => node.simplificationAreaErrorRatio)))
        .toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxSimplificationAreaErrorRatio)
      expect(graph.metrics.rasterizationErrorRatio)
        .toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxRasterizationErrorRatio)
      expect(Math.max(...graph.nodes.map(node => node.maxBoundaryDisplacement))).toBeLessThan(4)
      expect(Math.max(...graph.nodes.map(node => node.boundaryDisplacementRatio))).toBeLessThan(.2)
    }
  )

  it('locks the most crowded highland cow projection below the per-part segment fuse', () => {
    let parts = createAvatarEntityParts('cow')
    parts = applyCowHeadScale(parts, 125, 121)
    parts = applyCowHornStyle(parts, 'highland')
    parts = applyCowHornSize(parts, 128)
    parts = applyCowForelockStyle(parts, 'highland')
    const graph = graphForParts(
      parts,
      { pitch: 30 * Math.PI / 180, yaw: 0 },
      { compositorDensity: 1 }
    )

    expect(Math.max(...graph.nodes.map(node => node.occlusionSegmentCount)))
      .toBeLessThanOrEqual(AVATAR_FRAGMENT_RENDER_BUDGET.maxSegmentsPerPart)
    expect(graph.metrics.occlusionPathCharacterCount).toBeLessThanOrEqual(22_000)
    expect(graph.metrics.occlusionSegmentCount).toBeLessThanOrEqual(1_300)
    expect(graph.metrics.rasterizationErrorRatio)
      .toBeLessThan(.065)
  })

  it.each(['owl', 'parrot', 'monkey', 'cow'] as const)(
    'keeps $preset fragment ownership continuous through the 90 degree horizon',
    preset => {
      const samples = Array.from({ length: 9 }, (_, index) => 88 + index * .5).map(yaw => (
        graphForPreset(preset, { pitch: 0, yaw: yaw * Math.PI / 180 })
      ))
      for (const sample of samples) {
        expect(sample.metrics.rasterizationErrorRatio)
          .toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxRasterizationErrorRatio)
      }
      for (let index = 1; index < samples.length; index += 1) {
        const previous = samples[index - 1]!
        const current = samples[index]!
        const previousArea = previous.nodes.reduce((total, node) => total + pathArea(node.occlusionPath), 0)
        const currentArea = current.nodes.reduce((total, node) => total + pathArea(node.occlusionPath), 0)
        const relativeAreaDelta = Math.abs(currentArea - previousArea) / Math.max(1, previousArea, currentArea)
        expect(relativeAreaDelta).toBeLessThan(.18)
        expect(Math.abs(current.metrics.occlusionSegmentCount - previous.metrics.occlusionSegmentCount))
          .toBeLessThan(280)
      }
    }
  )

  it('keeps the fixed barn owl breed below the rasterization fuse across its 90 degree horizon', () => {
    const template = getAvatarAnimalBreedTemplate('owl', 'barn-owl')!
    const parts = resolveAvatarAnimalBreedTemplate(template, 'v1-0auditfixed000000000').entityParts

    for (let yaw = 88; yaw <= 92; yaw += .5) {
      const graph = graphForParts(parts, { pitch: 0, yaw: yaw * Math.PI / 180 })
      expect(graph.metrics.rasterizationErrorRatio)
        .toBeLessThan(AVATAR_FRAGMENT_RENDER_BUDGET.maxRasterizationErrorRatio)
    }
  })
})
