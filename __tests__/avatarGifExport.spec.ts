import { describe, expect, it } from 'vitest'

import { createAvatarGifSamples, orderAvatarGifKeyframes } from '../src/avatarGifExport'
import { createAvatarAnimationKeyframe } from '../src/avatarAnimations'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'

const createFrame = (positionX: number, durationMs: number) => ({
  ...createAvatarAnimationKeyframe(
    { pitch: 0, positionX, positionY: 0, roll: 0, scale: 1, yaw: 0 },
    DEFAULT_AVATAR_FACE_STYLE
  ),
  durationMs
})

const currentViewState = {
  pitch: .4,
  positionX: 100,
  positionY: -30,
  roll: .2,
  scale: 1.5,
  yaw: -.6
}

describe('avatar GIF export', () => {
  it('starts with the selected frame and preserves the complete frame order', () => {
    const frames = [createFrame(10, 100), createFrame(20, 200), createFrame(30, 300)]

    expect(orderAvatarGifKeyframes(frames, 1).map(frame => frame.positionX)).toEqual([20, 30, 10])
    expect(orderAvatarGifKeyframes(frames, 99).map(frame => frame.positionX)).toEqual([30, 10, 20])
  })

  it('samples once playback through its final frame and anchors it to the current composition', () => {
    const samples = createAvatarGifSamples(
      [createFrame(10, 100), createFrame(20, 100), createFrame(30, 100)],
      {
        currentViewState,
        lockStartPosition: false,
        maxFrames: 3,
        playbackMode: 'once',
        startFrameIndex: 1
      }
    )

    expect(samples).toHaveLength(3)
    expect(samples.map(sample => sample.keyframe.positionX)).toEqual([100, 110, 90])
    expect(samples[0]?.keyframe).toMatchObject({
      pitch: currentViewState.pitch,
      positionY: currentViewState.positionY,
      yaw: currentViewState.yaw
    })
    expect(samples.every(sample => sample.delayMs === 100)).toBe(true)
  })

  it('keeps locked animations in their authored coordinate system', () => {
    const samples = createAvatarGifSamples(
      [createFrame(10, 100), createFrame(20, 100)],
      {
        currentViewState,
        lockStartPosition: true,
        maxFrames: 2,
        playbackMode: 'once',
        startFrameIndex: 0
      }
    )

    expect(samples.map(sample => sample.keyframe.positionX)).toEqual([10, 20])
  })

  it('preserves short keyframe boundaries when a long hold consumes most of the frame budget', () => {
    const samples = createAvatarGifSamples(
      [createFrame(0, 100), createFrame(10, 3000), createFrame(20, 100), createFrame(30, 100)],
      {
        currentViewState: { ...currentViewState, pitch: 0, positionX: 0, positionY: 0, yaw: 0 },
        lockStartPosition: false,
        maxFrames: 5,
        playbackMode: 'once',
        startFrameIndex: 0
      }
    )

    expect(samples).toHaveLength(5)
    expect(samples.map(sample => sample.keyframe.positionX)).toEqual([0, 5, 10, 20, 30])
  })
})
