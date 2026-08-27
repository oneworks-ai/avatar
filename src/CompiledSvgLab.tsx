import { useEffect, useMemo, useRef, useState } from 'react'

import './compiled-svg-lab.scss'

import {
  createCompiledAvatarMeshCache,
  projectCompiledAvatarMesh,
  type CompiledAvatarMeshCache,
  type CompiledAvatarPose,
  type CompiledAvatarProjection
} from './compiledAvatarMesh'
import {
  createOptimizedCompiledAvatarProjector,
  summarizeOptimizedProjectionSamples,
  type OptimizedCompiledAvatarProjection,
  type OptimizedCompiledAvatarProjectionMetrics
} from './compiledAvatarMeshOptimized'
import {
  COMPILED_ATTACHMENT_MARKINGS,
  COMPILED_ATTACHMENT_MATERIALS,
  COMPILED_BIRD_MATERIALS,
  COMPILED_CAT_MATERIALS,
  COMPILED_SVG_LAB_SIZE,
  COMPILED_SVG_TWO_SPHERE_INPUT,
  COMPILED_SVG_TWO_SPHERE_MATERIALS,
  createCompiledAttachmentFixture,
  createCompiledBirdFixture,
  createCompiledBirdMarkings,
  createCompiledCatFixture,
  createCompiledCatMarkings
} from './compiledSvgLabFixtures'

type CompiledLabFixture = 'attachment' | 'bird' | 'cat' | 'two-sphere'
type CompiledLabEngine = 'baseline' | 'optimized'

const PROJECTOR_RASTER_SIZE = 280

interface CompiledSvgLabDebugApi {
  getMetrics(): Record<string, number | string>
  resetMetrics(): void
  setEngine(engine: CompiledLabEngine): void
  setFixture(fixture: CompiledLabFixture): void
  setPose(pose: Partial<CompiledAvatarPose>): void
}

declare global {
  interface Window {
    __compiledSvgLab?: CompiledSvgLabDebugApi
  }
}

const percentile = (samples: readonly number[], ratio: number) => {
  if (samples.length === 0) return 0
  const ordered = [...samples].sort((left, right) => left - right)
  return ordered[Math.min(Math.floor((ordered.length - 1) * ratio), ordered.length - 1)]!
}

const initialQuery = new URLSearchParams(window.location.search)
const requestedFixture = initialQuery.get('fixture')
const initialFixture: CompiledLabFixture = requestedFixture === 'attachment'
  || requestedFixture === 'bird'
  || requestedFixture === 'cat'
  ? requestedFixture
  : 'two-sphere'
const initialEngine: CompiledLabEngine = initialQuery.get('engine') === 'baseline' ? 'baseline' : 'optimized'

export default function CompiledSvgLab() {
  const captureMode = initialQuery.get('capture') === '1'
  const highQuality = initialQuery.get('quality') === 'high'
  const projectorRasterSize = highQuality ? COMPILED_SVG_LAB_SIZE * 2 : PROJECTOR_RASTER_SIZE
  const projectorToStageScale = COMPILED_SVG_LAB_SIZE / projectorRasterSize
  const cacheRef = useRef<CompiledAvatarMeshCache>()
  if (cacheRef.current == null) cacheRef.current = createCompiledAvatarMeshCache()
  const cache = cacheRef.current
  const [engine, setEngine] = useState<CompiledLabEngine>(initialEngine)
  const [fixture, setFixture] = useState<CompiledLabFixture>(initialFixture)
  const [pose, setPose] = useState<CompiledAvatarPose>({
    pitch: Number(initialQuery.get('pitch')) || 0,
    roll: Number(initialQuery.get('roll')) || 0,
    yaw: Number(initialQuery.get('yaw')) || 0
  })
  const [leftEarX, setLeftEarX] = useState(-56)
  const [leftEarScale, setLeftEarScale] = useState(1)
  const [rightEarX, setRightEarX] = useState(56)
  const [rightEarScale, setRightEarScale] = useState(1)
  const [includeMuzzle] = useState(initialQuery.get('muzzle') !== '0')
  const [muzzleHeight, setMuzzleHeight] = useState(58)
  const [muzzleProtrusion, setMuzzleProtrusion] = useState(18)
  const [muzzleWidth, setMuzzleWidth] = useState(96)
  const [muzzleY, setMuzzleY] = useState(44)
  const [birdBeakHeight, setBirdBeakHeight] = useState(30)
  const [birdBeakLength, setBirdBeakLength] = useState(72)
  const [birdBeakWidth, setBirdBeakWidth] = useState(48)
  const [birdBeakY, setBirdBeakY] = useState(38)
  const [catLeftHeight, setCatLeftHeight] = useState(54)
  const [catLeftProtrusion, setCatLeftProtrusion] = useState(17)
  const [catLeftWidth, setCatLeftWidth] = useState(68)
  const [catMuzzleSpacing, setCatMuzzleSpacing] = useState(54)
  const [catMuzzleY, setCatMuzzleY] = useState(46)
  const [catRightHeight, setCatRightHeight] = useState(54)
  const [catRightProtrusion, setCatRightProtrusion] = useState(17)
  const [catRightWidth, setCatRightWidth] = useState(68)
  const [furColor, setFurColor] = useState<string>(initialFixture === 'cat'
    ? COMPILED_CAT_MATERIALS.fur
    : COMPILED_ATTACHMENT_MATERIALS.fur)
  const [markingColor, setMarkingColor] = useState<string>(initialFixture === 'cat'
    ? COMPILED_CAT_MATERIALS.marking
    : COMPILED_ATTACHMENT_MATERIALS.marking)
  const [background, setBackground] = useState('#ff00ff')
  const projectCountRef = useRef(0)
  const optimizedSamplesRef = useRef<OptimizedCompiledAvatarProjectionMetrics[]>([])
  const domMutationTimesRef = useRef<number[]>([])
  const frameTimesRef = useRef<number[]>([])
  const uniqueInputPosesRef = useRef(new Set<string>())
  const renderedPosesRef = useRef(0)
  const stalePosesRef = useRef(0)
  const lastRenderedPoseKeyRef = useRef<string | null>(null)
  const releaseSettleMsRef = useRef(0)
  const lastFrameAtRef = useRef<number | null>(null)
  const longTaskCountRef = useRef(0)
  const pathNodesRef = useRef(new Map<string, SVGPathElement>())
  const latestPoseRef = useRef(pose)
  const latestProjectionRef = useRef<CompiledAvatarProjection | OptimizedCompiledAvatarProjection | null>(null)
  const dragRef = useRef<{
    pointerId: number
    startPitch: number
    startX: number
    startY: number
    startYaw: number
  } | null>(null)
  const pendingDragRef = useRef<{ x: number, y: number } | null>(null)
  const dragFrameRef = useRef<number | null>(null)
  const birdOptions = useMemo(() => ({
    beakHeight: birdBeakHeight,
    beakLength: birdBeakLength,
    beakWidth: birdBeakWidth,
    beakY: birdBeakY
  }), [birdBeakHeight, birdBeakLength, birdBeakWidth, birdBeakY])
  const catOptions = useMemo(() => ({
    leftHeight: catLeftHeight,
    leftProtrusion: catLeftProtrusion,
    leftWidth: catLeftWidth,
    muzzleSpacing: catMuzzleSpacing,
    muzzleY: catMuzzleY,
    rightHeight: catRightHeight,
    rightProtrusion: catRightProtrusion,
    rightWidth: catRightWidth
  }), [
    catLeftHeight,
    catLeftProtrusion,
    catLeftWidth,
    catMuzzleSpacing,
    catMuzzleY,
    catRightHeight,
    catRightProtrusion,
    catRightWidth
  ])
  const baseGeometryInput = useMemo(() => fixture === 'two-sphere'
    ? COMPILED_SVG_TWO_SPHERE_INPUT
    : fixture === 'bird'
      ? createCompiledBirdFixture(birdOptions)
      : fixture === 'cat'
        ? createCompiledCatFixture(catOptions)
        : createCompiledAttachmentFixture({
            includeMuzzle,
            leftScale: leftEarScale,
            leftX: leftEarX,
            muzzleHeight,
            muzzleProtrusion,
            muzzleWidth,
            muzzleY,
            rightScale: rightEarScale,
            rightX: rightEarX
          }), [
      birdOptions,
      catOptions,
      fixture,
      includeMuzzle,
      leftEarScale,
      leftEarX,
      muzzleHeight,
      muzzleProtrusion,
      muzzleWidth,
      muzzleY,
      rightEarScale,
      rightEarX
    ])
  const geometryInput = useMemo(() => highQuality && (fixture === 'bird' || fixture === 'cat')
    ? { ...baseGeometryInput, id: `${baseGeometryInput.id}-hq32`, resolution: 32 }
    : baseGeometryInput, [baseGeometryInput, fixture, highQuality])
  const mesh = useMemo(() => cache.get(geometryInput), [cache, geometryInput])
  const primitives = geometryInput.primitives
  const materials = useMemo<Readonly<Record<string, string>>>(() => fixture === 'two-sphere'
    ? COMPILED_SVG_TWO_SPHERE_MATERIALS
    : fixture === 'bird'
      ? COMPILED_BIRD_MATERIALS
      : fixture === 'cat'
        ? { ...COMPILED_CAT_MATERIALS, fur: furColor, marking: markingColor }
        : { ...COMPILED_ATTACHMENT_MATERIALS, fur: furColor, marking: markingColor }, [fixture, furColor, markingColor])
  const markings = useMemo(() => fixture === 'attachment'
    ? COMPILED_ATTACHMENT_MARKINGS
    : fixture === 'bird'
      ? createCompiledBirdMarkings(birdOptions)
      : fixture === 'cat'
        ? createCompiledCatMarkings(catOptions)
        : [], [birdOptions, catOptions, fixture])
  const optimizedProjector = useMemo(() => engine === 'optimized'
    ? createOptimizedCompiledAvatarProjector(mesh, primitives, {
        height: projectorRasterSize,
        markings,
        referenceSize: COMPILED_SVG_LAB_SIZE,
        width: projectorRasterSize
      })
    : null, [engine, markings, mesh, primitives, projectorRasterSize])
  const projection = useMemo(() => {
    projectCountRef.current += 1
    const nextProjection = engine === 'optimized'
      ? optimizedProjector!.project(pose)
      : projectCompiledAvatarMesh(mesh, primitives, {
          background,
          height: projectorRasterSize,
          markings,
          materials,
          pose,
          referenceSize: COMPILED_SVG_LAB_SIZE,
          width: projectorRasterSize
        })
    latestPoseRef.current = pose
    latestProjectionRef.current = nextProjection
    return nextProjection
  }, [background, engine, markings, materials, mesh, optimizedProjector, pose, primitives, projectorRasterSize])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    query.set('engine', engine)
    query.set('fixture', fixture)
    window.history.replaceState(null, '', `${window.location.pathname}?${query.toString()}`)
  }, [engine, fixture])

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return
    const observer = new PerformanceObserver(list => {
      longTaskCountRef.current += list.getEntries().length
    })
    try {
      observer.observe({ entryTypes: ['longtask'] })
    } catch {
      return
    }
    return () => observer.disconnect()
  }, [])

  const resetMetrics = () => {
    optimizedSamplesRef.current = []
    domMutationTimesRef.current = []
    frameTimesRef.current = []
    uniqueInputPosesRef.current = new Set()
    renderedPosesRef.current = 0
    stalePosesRef.current = 0
    lastRenderedPoseKeyRef.current = null
    releaseSettleMsRef.current = 0
    longTaskCountRef.current = 0
    lastFrameAtRef.current = null
  }

  const writeProjectionToDom = (nextProjection: OptimizedCompiledAvatarProjection) => {
    const startedAt = performance.now()
    for (const materialId of nextProjection.materialIds) {
      pathNodesRef.current.get(materialId)?.setAttribute('d', nextProjection.materialPaths[materialId] ?? '')
    }
    domMutationTimesRef.current.push(performance.now() - startedAt)
  }

  const updateDrag = () => {
    dragFrameRef.current = null
    const drag = dragRef.current
    const pending = pendingDragRef.current
    if (drag == null || pending == null) return
    const nextPose: CompiledAvatarPose = {
      ...latestPoseRef.current,
      pitch: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, drag.startPitch + (pending.y - drag.startY) * .008)),
      yaw: drag.startYaw + (pending.x - drag.startX) * .008
    }
    const poseKey = `${nextPose.yaw.toFixed(8)}:${nextPose.pitch.toFixed(8)}:${nextPose.roll.toFixed(8)}`
    if (poseKey === lastRenderedPoseKeyRef.current) return
    lastRenderedPoseKeyRef.current = poseKey
    const now = performance.now()
    if (lastFrameAtRef.current != null) frameTimesRef.current.push(now - lastFrameAtRef.current)
    lastFrameAtRef.current = now
    latestPoseRef.current = nextPose
    renderedPosesRef.current += 1
    if (engine === 'optimized') {
      const nextProjection = optimizedProjector!.project(nextPose)
      projectCountRef.current += 1
      optimizedSamplesRef.current.push({ ...nextProjection.metrics })
      latestProjectionRef.current = nextProjection
      writeProjectionToDom(nextProjection)
      return
    }
    setPose(nextPose)
  }

  const getMetrics = (): Record<string, number | string> => {
    const currentProjection = latestProjectionRef.current ?? projection
    const optimizedSummary = summarizeOptimizedProjectionSamples(optimizedSamplesRef.current)
    const currentOptimizedMetrics = 'candidateTestsAfter' in currentProjection.metrics
      ? currentProjection.metrics
      : null
    const uniqueInputPoses = uniqueInputPosesRef.current.size
    const renderedPoses = renderedPosesRef.current
    return {
      binCullP50Ms: optimizedSummary.binCullP50Ms,
      binCullP95Ms: optimizedSummary.binCullP95Ms,
      candidateTestsAfter: currentOptimizedMetrics?.candidateTestsAfter ?? 0,
      candidateTestsBefore: currentOptimizedMetrics?.candidateTestsBefore ?? 0,
      compileCount: cache.compileCount,
      compileMs: mesh.compileMs,
      contourP50Ms: optimizedSummary.contourP50Ms,
      contourP95Ms: optimizedSummary.contourP95Ms,
      depthOwnerP50Ms: optimizedSummary.depthOwnerP50Ms,
      depthOwnerP95Ms: optimizedSummary.depthOwnerP95Ms,
      domMutationMs: percentile(domMutationTimesRef.current, .5),
      domMutationP95Ms: percentile(domMutationTimesRef.current, .95),
      droppedPoses: Math.max(0, uniqueInputPoses - renderedPoses),
      engine,
      longTaskCount: longTaskCountRef.current,
      pathCharacterCount: currentProjection.metrics.pathCharacterCount,
      pathCount: currentProjection.metrics.pathCount,
      pathSerializationP50Ms: optimizedSummary.pathSerializationP50Ms,
      pathSerializationP95Ms: optimizedSummary.pathSerializationP95Ms,
      projectCount: projectCountRef.current,
      projectMs: currentProjection.metrics.projectMs,
      projectP50Ms: optimizedSummary.projectP50Ms,
      projectP95Ms: optimizedSummary.projectP95Ms,
      quality: highQuality ? 'export-32-840' : 'interactive-native-280',
      rafMaxMs: Math.max(0, ...frameTimesRef.current),
      rafP50Ms: percentile(frameTimesRef.current, .5),
      rafP95Ms: percentile(frameTimesRef.current, .95),
      releaseSettleMs: releaseSettleMsRef.current,
      renderedPoses,
      stalePoses: stalePosesRef.current,
      transformP50Ms: optimizedSummary.transformP50Ms,
      transformP95Ms: optimizedSummary.transformP95Ms,
      triangleCount: mesh.triangles.length,
      uniqueInputPoses,
      vertexCount: mesh.vertices.length
    }
  }
  const metrics = getMetrics()
  window.__compiledSvgLab = {
    getMetrics,
    resetMetrics,
    setEngine,
    setFixture,
    setPose: next => {
      const nextPose = { ...latestPoseRef.current, ...next }
      latestPoseRef.current = nextPose
      setPose(nextPose)
    }
  }

  return (
    <main
      className={`compiled-svg-lab${captureMode ? ' compiled-svg-lab--capture' : ''}`}
      data-compile-count={cache.compileCount}
      data-compile-key={mesh.compileKey}
      data-compile-ms={mesh.compileMs}
      data-contour-segments={'contourSegmentCount' in projection.metrics ? projection.metrics.contourSegmentCount : 0}
      data-engine={engine}
      data-long-task-count={longTaskCountRef.current}
      data-path-count={projection.metrics.pathCount}
      data-project-count={projectCountRef.current}
      data-project-ms={projection.metrics.projectMs}
      data-raf-max-ms={Math.max(0, ...frameTimesRef.current)}
      data-raf-p95-ms={percentile(frameTimesRef.current, .95)}
      data-testid='compiled-svg-lab'
    >
      <header className='compiled-svg-lab__header'>
        <div>
          <p className='compiled-svg-lab__eyebrow'>Architecture prototype</p>
          <h1>Compile geometry once, project SVG many times</h1>
          <p>Drag the stage. Pose changes reuse one watertight mesh; geometry controls invalidate it.</p>
        </div>
        <button onClick={() => setPose({ pitch: 0, roll: 0, yaw: 0 })} type='button'>Reset pose</button>
      </header>

      <section className='compiled-svg-lab__workspace'>
        <div className='compiled-svg-lab__stage-column'>
          <div className='compiled-svg-lab__fixture-switch' role='group' aria-label='Engine'>
            <button aria-pressed={engine === 'baseline'} onClick={() => setEngine('baseline')} type='button'>Baseline</button>
            <button aria-pressed={engine === 'optimized'} onClick={() => setEngine('optimized')} type='button'>Optimized</button>
          </div>
          <div className='compiled-svg-lab__fixture-switch' role='group' aria-label='Fixture'>
            <button aria-pressed={fixture === 'two-sphere'} onClick={() => setFixture('two-sphere')} type='button'>Two spheres</button>
            <button aria-pressed={fixture === 'attachment'} onClick={() => setFixture('attachment')} type='button'>Existing muzzle</button>
            <button aria-pressed={fixture === 'bird'} onClick={() => setFixture('bird')} type='button'>Pointed bird beak</button>
            <button aria-pressed={fixture === 'cat'} onClick={() => setFixture('cat')} type='button'>Cat double muzzle</button>
          </div>
          <svg
            aria-label='Compiled mesh projected to SVG'
            className='compiled-svg-lab__stage'
            data-compiled-svg-stage={fixture}
            height={COMPILED_SVG_LAB_SIZE}
            onPointerDown={event => {
              event.currentTarget.setPointerCapture(event.pointerId)
              dragRef.current = {
                pointerId: event.pointerId,
                startPitch: pose.pitch,
                startX: event.clientX,
                startY: event.clientY,
                startYaw: pose.yaw
              }
              pendingDragRef.current = { x: event.clientX, y: event.clientY }
              resetMetrics()
              uniqueInputPosesRef.current.add(`${event.clientX}:${event.clientY}`)
              lastFrameAtRef.current = performance.now()
            }}
            onPointerMove={event => {
              if (dragRef.current?.pointerId !== event.pointerId) return
              pendingDragRef.current = { x: event.clientX, y: event.clientY }
              uniqueInputPosesRef.current.add(`${event.clientX}:${event.clientY}`)
              if (dragFrameRef.current == null) dragFrameRef.current = requestAnimationFrame(updateDrag)
            }}
            onPointerUp={event => {
              if (dragRef.current?.pointerId !== event.pointerId) return
              const releasedAt = performance.now()
              pendingDragRef.current = { x: event.clientX, y: event.clientY }
              uniqueInputPosesRef.current.add(`${event.clientX}:${event.clientY}`)
              if (dragFrameRef.current != null) cancelAnimationFrame(dragFrameRef.current)
              updateDrag()
              dragRef.current = null
              pendingDragRef.current = null
              event.currentTarget.releasePointerCapture(event.pointerId)
              if (engine === 'optimized') setPose(latestPoseRef.current)
              requestAnimationFrame(() => requestAnimationFrame(() => {
                releaseSettleMsRef.current = performance.now() - releasedAt
              }))
            }}
            role='img'
            viewBox={`0 0 ${COMPILED_SVG_LAB_SIZE} ${COMPILED_SVG_LAB_SIZE}`}
            width={COMPILED_SVG_LAB_SIZE}
          >
            <rect width='420' height='420' fill={background} />
            <g transform={`scale(${projectorToStageScale})`}>
              {projection.materialIds.map(materialId => (
                <path
                  data-compiled-material={materialId}
                  d={projection.materialPaths[materialId]}
                  fill={materials[materialId]}
                  key={materialId}
                  ref={node => {
                    if (node == null) pathNodesRef.current.delete(materialId)
                    else pathNodesRef.current.set(materialId, node)
                  }}
                  shapeRendering={engine === 'optimized' || highQuality ? 'geometricPrecision' : 'crispEdges'}
                />
              ))}
            </g>
          </svg>
          <p className='compiled-svg-lab__hint'>Fixed 420×420 orthographic stage · same ownership topology while dragging</p>
        </div>

        <aside className='compiled-svg-lab__panel'>
          <section>
            <h2>View projection</h2>
            {(['yaw', 'pitch', 'roll'] as const).map(axis => (
              <label key={axis}>
                <span>{axis} <output>{pose[axis].toFixed(3)}</output></span>
                <input
                  max={Math.PI}
                  min={-Math.PI}
                  onChange={event => setPose(current => ({ ...current, [axis]: Number(event.target.value) }))}
                  step='.01'
                  type='range'
                  value={pose[axis]}
                />
              </label>
            ))}
          </section>
          <section>
            <h2>Compiler invalidation</h2>
            {fixture === 'attachment' && <>
              <label><span>Left ear position <output>{leftEarX}</output></span><input max='-35' min='-72' onChange={event => setLeftEarX(Number(event.target.value))} type='range' value={leftEarX} /></label>
              <label><span>Left ear size <output>{leftEarScale.toFixed(2)}</output></span><input max='1.25' min='.72' onChange={event => setLeftEarScale(Number(event.target.value))} step='.01' type='range' value={leftEarScale} /></label>
              <label><span>Right ear position <output>{rightEarX}</output></span><input max='72' min='35' onChange={event => setRightEarX(Number(event.target.value))} type='range' value={rightEarX} /></label>
              <label><span>Right ear size <output>{rightEarScale.toFixed(2)}</output></span><input max='1.25' min='.72' onChange={event => setRightEarScale(Number(event.target.value))} step='.01' type='range' value={rightEarScale} /></label>
              <label><span>Muzzle protrusion <output>{muzzleProtrusion}</output></span><input disabled={!includeMuzzle} max='30' min='6' onChange={event => setMuzzleProtrusion(Number(event.target.value))} type='range' value={muzzleProtrusion} /></label>
              <label><span>Muzzle width <output>{muzzleWidth}</output></span><input disabled={!includeMuzzle} max='124' min='70' onChange={event => setMuzzleWidth(Number(event.target.value))} type='range' value={muzzleWidth} /></label>
              <label><span>Muzzle height <output>{muzzleHeight}</output></span><input disabled={!includeMuzzle} max='78' min='42' onChange={event => setMuzzleHeight(Number(event.target.value))} type='range' value={muzzleHeight} /></label>
              <label><span>Muzzle vertical position <output>{muzzleY}</output></span><input disabled={!includeMuzzle} max='58' min='28' onChange={event => setMuzzleY(Number(event.target.value))} type='range' value={muzzleY} /></label>
            </>}
            {fixture === 'bird' && <>
              <label><span>Beak length <output>{birdBeakLength}</output></span><input max='96' min='48' onChange={event => setBirdBeakLength(Number(event.target.value))} type='range' value={birdBeakLength} /></label>
              <label><span>Beak width <output>{birdBeakWidth}</output></span><input max='68' min='30' onChange={event => setBirdBeakWidth(Number(event.target.value))} type='range' value={birdBeakWidth} /></label>
              <label><span>Beak height <output>{birdBeakHeight}</output></span><input max='44' min='20' onChange={event => setBirdBeakHeight(Number(event.target.value))} type='range' value={birdBeakHeight} /></label>
              <label><span>Beak vertical position <output>{birdBeakY}</output></span><input max='52' min='24' onChange={event => setBirdBeakY(Number(event.target.value))} type='range' value={birdBeakY} /></label>
            </>}
            {fixture === 'cat' && <>
              <label><span>Left muzzle width <output>{catLeftWidth}</output></span><input max='86' min='50' onChange={event => setCatLeftWidth(Number(event.target.value))} type='range' value={catLeftWidth} /></label>
              <label><span>Left muzzle height <output>{catLeftHeight}</output></span><input max='70' min='40' onChange={event => setCatLeftHeight(Number(event.target.value))} type='range' value={catLeftHeight} /></label>
              <label><span>Left protrusion <output>{catLeftProtrusion}</output></span><input max='28' min='8' onChange={event => setCatLeftProtrusion(Number(event.target.value))} type='range' value={catLeftProtrusion} /></label>
              <label><span>Right muzzle width <output>{catRightWidth}</output></span><input max='86' min='50' onChange={event => setCatRightWidth(Number(event.target.value))} type='range' value={catRightWidth} /></label>
              <label><span>Right muzzle height <output>{catRightHeight}</output></span><input max='70' min='40' onChange={event => setCatRightHeight(Number(event.target.value))} type='range' value={catRightHeight} /></label>
              <label><span>Right protrusion <output>{catRightProtrusion}</output></span><input max='28' min='8' onChange={event => setCatRightProtrusion(Number(event.target.value))} type='range' value={catRightProtrusion} /></label>
              <label><span>Muzzle spacing <output>{catMuzzleSpacing}</output></span><input max='72' min='42' onChange={event => setCatMuzzleSpacing(Number(event.target.value))} type='range' value={catMuzzleSpacing} /></label>
              <label><span>Muzzle vertical position <output>{catMuzzleY}</output></span><input max='58' min='34' onChange={event => setCatMuzzleY(Number(event.target.value))} type='range' value={catMuzzleY} /></label>
            </>}
          </section>
          <section>
            <h2>Non-geometry changes</h2>
            <label className='compiled-svg-lab__color'>Fur <input disabled={fixture !== 'attachment' && fixture !== 'cat'} onChange={event => setFurColor(event.target.value)} type='color' value={furColor} /></label>
            <label className='compiled-svg-lab__color'>Surface marking <input disabled={fixture !== 'attachment' && fixture !== 'cat'} onChange={event => setMarkingColor(event.target.value)} type='color' value={markingColor} /></label>
            <label className='compiled-svg-lab__color'>Background <input onChange={event => setBackground(event.target.value)} type='color' value={background} /></label>
          </section>
          <section>
            <h2>Live metrics</h2>
            <dl className='compiled-svg-lab__metrics'>
              {Object.entries(metrics).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === 'number' ? value.toFixed(2) : value}</dd></div>)}
            </dl>
          </section>
        </aside>
      </section>
    </main>
  )
}
