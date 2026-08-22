import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

import type { AvatarViewState } from './InteractiveAvatar'

interface AvatarOrientationControlProps {
  readonly onReset: () => void
  readonly onViewStateChange: (state: AvatarViewState) => void
  readonly viewState: AvatarViewState
}

type OrientationControl = 'pitch' | 'roll' | 'screen-roll' | 'yaw'

interface OrientationDragOrigin {
  readonly angle: number
  readonly centerX: number
  readonly centerY: number
  readonly control: OrientationControl
  readonly pitch: number
  readonly pointerId: number
  readonly roll: number
  readonly tangentX: number
  readonly tangentY: number
  readonly x: number
  readonly y: number
  readonly yaw: number
}

const ROTATION_PER_PIXEL = Math.PI / 240
const KEY_ROTATION = Math.PI / 12
const RING_RADIUS = 31
const RING_CENTER = 44
const RING_STEPS = 48

const toDegrees = (radians: number) => Math.round(radians * 180 / Math.PI)

const getTargetControl = (target: EventTarget | null): OrientationControl | null => {
  if (!(target instanceof Element)) return null
  const value = target.closest<SVGElement>('[data-orientation-control]')?.dataset.orientationControl
  return value === 'pitch' || value === 'roll' || value === 'screen-roll' || value === 'yaw'
    ? value
    : null
}

const getPointerAngle = (clientX: number, clientY: number, centerX: number, centerY: number) => (
  Math.atan2(clientY - centerY, clientX - centerX)
)

const getAngleDelta = (angle: number, origin: number) => Math.atan2(
  Math.sin(angle - origin),
  Math.cos(angle - origin)
)

const rotateScreenPoint = (
  point: { readonly x: number; readonly y: number },
  angle: number
) => {
  const x = point.x - RING_CENTER
  const y = point.y - RING_CENTER
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: RING_CENTER + x * cos - y * sin,
    y: RING_CENTER + x * sin + y * cos
  }
}

export function AvatarOrientationControl({
  onReset,
  onViewStateChange,
  viewState
}: AvatarOrientationControlProps) {
  const dragOriginRef = useRef<OrientationDragOrigin>()
  const [activeControl, setActiveControl] = useState<OrientationControl | null>(null)
  const [hoveredControl, setHoveredControl] = useState<OrientationControl | null>(null)
  const rollDegrees = viewState.roll * 180 / Math.PI
  const rings = useMemo(() => {
    const cosYaw = Math.cos(viewState.yaw)
    const sinYaw = Math.sin(viewState.yaw)
    const cosPitch = Math.cos(viewState.pitch)
    const sinPitch = Math.sin(viewState.pitch)
    const rotatePoint = (point: { readonly x: number; readonly y: number; readonly z: number }) => {
      const yawX = point.x * cosYaw + point.z * sinYaw
      const yawZ = -point.x * sinYaw + point.z * cosYaw
      return {
        depth: -point.y * sinPitch + yawZ * cosPitch,
        x: yawX,
        y: point.y * cosPitch + yawZ * sinPitch
      }
    }
    return [
      {
        color: '#ff6670',
        control: 'pitch' as const,
        id: 'x',
        point: (angle: number) => ({ x: 0, y: Math.cos(angle), z: -Math.sin(angle) })
      },
      {
        color: '#43df8c',
        control: 'yaw' as const,
        id: 'y',
        point: (angle: number) => ({ x: Math.cos(angle), y: 0, z: -Math.sin(angle) })
      },
      {
        color: '#6485ff',
        control: 'roll' as const,
        id: 'z',
        point: (angle: number) => ({ x: Math.cos(angle), y: Math.sin(angle), z: 0 })
      }
    ].map(ring => {
      const points = Array.from({ length: RING_STEPS }, (_, index) => {
        const rotated = rotatePoint(ring.point(index / RING_STEPS * Math.PI * 2))
        return {
          depth: rotated.depth,
          x: RING_CENTER + rotated.x * RING_RADIUS,
          y: RING_CENTER + rotated.y * RING_RADIUS
        }
      })
      const fullPath = `M ${points.map(point => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')} Z`
      const frontPath = points.map((point, index) => {
        const next = points[(index + 1) % points.length]!
        return (point.depth + next.depth) / 2 < 0
          ? ''
          : `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
      }).join(' ')
      return { ...ring, frontPath, fullPath, points }
    })
  }, [viewState.pitch, viewState.yaw])

  const updateControl = (control: OrientationControl, nextValue: number) => {
    if (control === 'pitch') {
      onViewStateChange({ ...viewState, pitch: nextValue })
      return
    }
    if (control === 'yaw') {
      onViewStateChange({ ...viewState, yaw: nextValue })
      return
    }
    onViewStateChange({ ...viewState, roll: nextValue })
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const control = getTargetControl(event.target)
    if (control == null) return
    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    let tangentX = 0
    let tangentY = 0
    if (control !== 'screen-roll') {
      const svgBounds = event.currentTarget.querySelector('svg')?.getBoundingClientRect() ?? bounds
      const pointerX = (event.clientX - svgBounds.left) / svgBounds.width * 88
      const pointerY = (event.clientY - svgBounds.top) / svgBounds.height * 88
      const ring = rings.find(candidate => candidate.control === control)
      if (ring != null) {
        const screenPoints = ring.points.map(point => rotateScreenPoint(point, viewState.roll))
        let nearestIndex = 0
        let nearestDistance = Number.POSITIVE_INFINITY
        screenPoints.forEach((point, index) => {
          const distance = (point.x - pointerX) ** 2 + (point.y - pointerY) ** 2
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearestIndex = index
          }
        })
        const previous = screenPoints[(nearestIndex - 1 + screenPoints.length) % screenPoints.length]!
        const next = screenPoints[(nearestIndex + 1) % screenPoints.length]!
        const clientTangentX = (next.x - previous.x) * svgBounds.width / 88
        const clientTangentY = (next.y - previous.y) * svgBounds.height / 88
        const tangentLength = Math.hypot(clientTangentX, clientTangentY)
        if (tangentLength > 0) {
          tangentX = clientTangentX / tangentLength
          tangentY = clientTangentY / tangentLength
          const cosRoll = Math.cos(viewState.roll)
          const sinRoll = Math.sin(viewState.roll)
          const positiveDirection = control === 'pitch'
            ? { x: -sinRoll, y: cosRoll }
            : control === 'yaw'
            ? { x: cosRoll, y: sinRoll }
            : {
                x: -(event.clientY - centerY),
                y: event.clientX - centerX
              }
          if (tangentX * positiveDirection.x + tangentY * positiveDirection.y < 0) {
            tangentX *= -1
            tangentY *= -1
          }
        }
      }
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOriginRef.current = {
      angle: getPointerAngle(event.clientX, event.clientY, centerX, centerY),
      centerX,
      centerY,
      control,
      pitch: viewState.pitch,
      pointerId: event.pointerId,
      roll: viewState.roll,
      tangentX,
      tangentY,
      x: event.clientX,
      y: event.clientY,
      yaw: viewState.yaw
    }
    setActiveControl(control)
    setHoveredControl(control)
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const origin = dragOriginRef.current
    if (origin == null || origin.pointerId !== event.pointerId) {
      setHoveredControl(getTargetControl(event.target))
      return
    }
    if (origin.control !== 'screen-roll') {
      const tangentDistance = (event.clientX - origin.x) * origin.tangentX +
        (event.clientY - origin.y) * origin.tangentY
      const initialValue = origin.control === 'pitch'
        ? origin.pitch
        : origin.control === 'yaw'
        ? origin.yaw
        : origin.roll
      updateControl(origin.control, initialValue + tangentDistance * ROTATION_PER_PIXEL)
      return
    }
    const angle = getPointerAngle(event.clientX, event.clientY, origin.centerX, origin.centerY)
    updateControl(origin.control, origin.roll + getAngleDelta(angle, origin.angle))
  }

  const finishPointerDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragOriginRef.current?.pointerId !== event.pointerId) return
    dragOriginRef.current = undefined
    setActiveControl(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Home') {
      event.preventDefault()
      onReset()
      return
    }
    if (!['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    const control = hoveredControl ?? 'yaw'
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1
    const keyRotation = (event.shiftKey ? KEY_ROTATION / 3 : KEY_ROTATION) * direction
    const currentValue = control === 'pitch'
      ? viewState.pitch
      : control === 'yaw'
      ? viewState.yaw
      : viewState.roll
    updateControl(control, currentValue + keyRotation)
  }

  const isHighlighted = (control: OrientationControl) => (
    activeControl === control || (activeControl == null && hoveredControl === control)
  )

  return (
    <div className='avatar-orientation-control' role='group' aria-label='Avatar orientation controls'>
      <button
        className='avatar-orientation-control__orbit'
        type='button'
        aria-label={`Adjust avatar rings. Yaw ${toDegrees(viewState.yaw)} degrees, pitch ${toDegrees(viewState.pitch)} degrees, roll ${toDegrees(viewState.roll)} degrees`}
        title='Hover a ring, then drag to adjust only that rotation axis.'
        data-active-control={activeControl ?? undefined}
        onKeyDown={handleKeyDown}
        onLostPointerCapture={() => {
          dragOriginRef.current = undefined
          setActiveControl(null)
        }}
        onPointerCancel={finishPointerDrag}
        onPointerDown={handlePointerDown}
        onPointerLeave={() => {
          if (dragOriginRef.current == null) setHoveredControl(null)
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
      >
        <svg viewBox='0 0 88 88' aria-hidden='true'>
          <circle
            className='avatar-orientation-control__outer-ring'
            cx='44'
            cy='44'
            r='39'
            data-highlighted={isHighlighted('screen-roll')}
          />
          <circle
            className='avatar-orientation-control__roll-handle'
            cx='44'
            cy='5'
            r='2.4'
            transform={`rotate(${rollDegrees} 44 44)`}
            data-highlighted={isHighlighted('screen-roll')}
          />
          <g transform={`rotate(${rollDegrees} 44 44)`}>
            {rings.map(ring => (
              <g key={ring.id} data-highlighted={isHighlighted(ring.control)}>
                <path
                  className='avatar-orientation-control__ring avatar-orientation-control__ring--far'
                  d={ring.fullPath}
                  fill='none'
                  stroke={ring.color}
                />
                <path
                  className='avatar-orientation-control__ring avatar-orientation-control__ring--front'
                  d={ring.frontPath}
                  fill='none'
                  stroke={ring.color}
                />
              </g>
            ))}
            {rings.map(ring => (
              <path
                key={`hit-${ring.id}`}
                className='avatar-orientation-control__ring-hit'
                d={ring.fullPath}
                data-orientation-control={ring.control}
              />
            ))}
          </g>
          <circle
            className='avatar-orientation-control__ring-hit avatar-orientation-control__ring-hit--outer'
            cx='44'
            cy='44'
            r='39'
            data-orientation-control='screen-roll'
          />
        </svg>
      </button>
      <button
        className='avatar-orientation-control__reset'
        type='button'
        aria-label='Reset avatar orientation'
        title='Reset orientation'
        onClick={onReset}
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M4.4 6.2A6.7 6.7 0 1 1 3.7 13M4.4 6.2V2.8M4.4 6.2h3.4' />
        </svg>
      </button>
    </div>
  )
}
