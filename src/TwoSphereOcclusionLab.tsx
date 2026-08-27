import { useEffect, useMemo, useRef, useState } from 'react'

import type { AvatarPalette } from '@oneworks/avatar'

import './two-sphere-occlusion-lab.scss'

import { InteractiveAvatar } from './InteractiveAvatar'
import type { AvatarViewState } from './InteractiveAvatar'
import type { AvatarEntityPart } from './avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_SHADOW_STYLE, DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import {
  buildTwoSphereFixture,
  compareTwoSphereGraphWithAnalyticOwner,
  resolveAnalyticTwoSphereOwner,
  TWO_SPHERE_RADIUS,
  TWO_SPHERE_SOURCE_RADIUS,
  TWO_SPHERE_VIEW_RADIUS,
  type TwoSpherePose
} from './twoSphereOcclusionLabGeometry'

type LabBackground = 'magenta' | 'transparent' | 'white'

const CANVAS_SIZE = 420
const SPHERE_SCALE = TWO_SPHERE_RADIUS / TWO_SPHERE_SOURCE_RADIUS
const PROJECTION_SCALE = CANVAS_SIZE / (TWO_SPHERE_VIEW_RADIUS * 2)

const TWO_SPHERE_PALETTE: AvatarPalette = {
  background: '#000000',
  foreground: '#000000',
  gradient: ['#000000', '#000000'],
  id: 'two-sphere-occlusion-lab',
  name: 'Two-sphere occlusion lab',
  shadow: '#000000'
}

const TWO_SPHERE_PARTS: readonly AvatarEntityPart[] = [
  {
    baseColor: '#000000',
    face: false,
    foregroundColor: '#000000',
    highlightColor: '#000000',
    id: 'black',
    label: 'Black analytic sphere',
    scaleX: SPHERE_SCALE,
    scaleY: SPHERE_SCALE,
    scaleZ: SPHERE_SCALE,
    shadowColor: '#000000',
    shape: 'sphere',
    x: -34,
    y: 0,
    z: -10
  },
  {
    baseColor: '#ffffff',
    face: false,
    foregroundColor: '#ffffff',
    highlightColor: '#ffffff',
    id: 'white',
    label: 'White analytic sphere',
    scaleX: SPHERE_SCALE,
    scaleY: SPHERE_SCALE,
    scaleZ: SPHERE_SCALE,
    shadowColor: '#ffffff',
    shape: 'sphere',
    x: 34,
    y: 0,
    z: 10
  }
]

const TWO_SPHERE_FACE_STYLE = {
  ...DEFAULT_AVATAR_FACE_STYLE,
  gap: 0,
  height: 0,
  width: 0,
  mouthEnabled: false,
  noseEnabled: false
}

const backgroundColor = (background: LabBackground) => (
  background === 'magenta' ? '#ff00ff' : background === 'white' ? '#ffffff' : 'transparent'
)

const AnalyticCanvas = ({ background, pose }: {
  readonly background: LabBackground
  readonly pose: TwoSpherePose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas == null) return
    const context = canvas.getContext('2d')
    if (context == null) return
    const image = context.createImageData(canvas.width, canvas.height)
    const backgroundRgb = background === 'magenta'
      ? [255, 0, 255, 255]
      : background === 'white' ? [255, 255, 255, 255] : [0, 0, 0, 0]
    for (let pixelY = 0; pixelY < canvas.height; pixelY += 1) {
      for (let pixelX = 0; pixelX < canvas.width; pixelX += 1) {
        const x = (pixelX + .5) / canvas.width * TWO_SPHERE_VIEW_RADIUS * 2 - TWO_SPHERE_VIEW_RADIUS
        const y = (pixelY + .5) / canvas.height * TWO_SPHERE_VIEW_RADIUS * 2 - TWO_SPHERE_VIEW_RADIUS
        const owner = resolveAnalyticTwoSphereOwner(pose, x, y)
        const color = owner == null ? backgroundRgb : owner === 'black'
          ? [0, 0, 0, 255]
          : [255, 255, 255, 255]
        const index = (pixelY * canvas.width + pixelX) * 4
        image.data.set(color, index)
      }
    }
    context.putImageData(image, 0, 0)
  }, [background, pose])
  return (
    <canvas
      aria-label='Analytic per-pixel depth reference'
      className={`two-sphere-lab__stage two-sphere-lab__stage--${background}`}
      data-two-sphere-renderer='analytic-oracle'
      height={CANVAS_SIZE}
      ref={canvasRef}
      role='img'
      width={CANVAS_SIZE}
    />
  )
}

export default function TwoSphereOcclusionLab() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const [background, setBackground] = useState<LabBackground>('magenta')
  const [showOracle, setShowOracle] = useState(query.get('oracle') === '1')
  const [viewState, setViewState] = useState<AvatarViewState>({
    pitch: Number(query.get('pitch')) || 0,
    positionX: 0,
    // Production geometry is authored around y=202 in a 420px viewBox.
    // Offset the isolated stage by 8px so its fixed camera centre is 210px,
    // matching the Three.js oracle without changing the renderer geometry.
    positionY: 8,
    roll: 0,
    scale: PROJECTION_SCALE,
    yaw: Number(query.get('yaw')) || 0
  })
  const pose = useMemo<TwoSpherePose>(() => ({
    pitch: viewState.pitch,
    yaw: viewState.yaw
  }), [viewState.pitch, viewState.yaw])
  const [auditedPose, setAuditedPose] = useState(pose)
  useEffect(() => {
    const timeout = window.setTimeout(() => setAuditedPose(pose), 160)
    return () => window.clearTimeout(timeout)
  }, [pose])
  // The analytic oracle is a diagnostic sweep, not renderer work. Debounce it
  // so pointer frames only pay for the production ownership graph; the metric
  // catches up after the gesture settles without changing paint topology.
  const fixture = useMemo(() => buildTwoSphereFixture(auditedPose, 'full'), [auditedPose])
  const comparison = useMemo(
    () => compareTwoSphereGraphWithAnalyticOwner(fixture, auditedPose),
    [auditedPose, fixture]
  )

  return (
    <main
      className='two-sphere-lab'
      data-analytic-samples={comparison.analyticOverlapSamples}
      data-cache-key={fixture.graph.cacheKey}
      data-mismatched-owner-samples={comparison.mismatchedOwnerSamples}
      data-null-owner-samples={comparison.nullGraphOwnerSamples}
      data-testid='two-sphere-occlusion-lab'
    >
      <header className='two-sphere-lab__header'>
        <div>
          <h1>Two-sphere occlusion lab</h1>
          <p>The production renderer is under test. The analytic oracle is isolated and off by default.</p>
        </div>
        <button
          type='button'
          onClick={() => setViewState({
            pitch: 0,
            positionX: 0,
            positionY: 8,
            roll: 0,
            scale: PROJECTION_SCALE,
            yaw: 0
          })}
        >
          Reset
        </button>
      </header>
      <div className='two-sphere-lab__controls'>
        <fieldset>
          <legend>Background</legend>
          {(['magenta', 'white', 'transparent'] as const).map(value => (
            <button
              aria-pressed={background === value}
              key={value}
              onClick={() => setBackground(value)}
              type='button'
            >
              {value}
            </button>
          ))}
        </fieldset>
        <button
          aria-pressed={showOracle}
          onClick={() => setShowOracle(value => !value)}
          type='button'
        >
          Analytic oracle
        </button>
      </div>
      <div className='two-sphere-lab__comparison'>
        <figure>
          <figcaption>Production fragment renderer · drag to rotate</figcaption>
          <div
            className={`two-sphere-lab__stage two-sphere-lab__stage--${background}`}
            data-two-sphere-renderer='production'
            style={{ backgroundColor: backgroundColor(background) }}
          >
            <InteractiveAvatar
              backgroundStyle='solid'
              bodyShape='sphere'
              entityParts={TWO_SPHERE_PARTS}
              entityPreset='custom'
              faceStyle={TWO_SPHERE_FACE_STYLE}
              faceStyleTransitionsEnabled={false}
              gridDensity={100}
              interactive
              interactionMode='rotate'
              lightDirection={{ azimuth: 0, elevation: 0 }}
              onViewStateChange={setViewState}
              palette={TWO_SPHERE_PALETTE}
              renderSurfaceCells={false}
              shadowStyle={DEFAULT_AVATAR_FACE_SHADOW_STYLE}
              showAvatarShadow={false}
              showLight={false}
              showOutline={false}
              showShadow={false}
              surfaceDecals={[]}
              viewState={viewState}
            />
          </div>
        </figure>
        {showOracle
          ? (
            <figure data-two-sphere-oracle-panel='true'>
              <figcaption>Independent analytic depth oracle · excluded from tested pixels</figcaption>
              <AnalyticCanvas background={background} pose={pose} />
            </figure>
          )
          : null}
      </div>
      <output className='two-sphere-lab__metrics'>
        yaw {viewState.yaw.toFixed(6)} · pitch {viewState.pitch.toFixed(6)} · null owners{' '}
        {comparison.nullGraphOwnerSamples} · analytic mismatches {comparison.mismatchedOwnerSamples}/
        {comparison.analyticOverlapSamples}
      </output>
    </main>
  )
}
