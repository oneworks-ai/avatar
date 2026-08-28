import { describe, expect, it } from 'vitest'

import {
  createAvatarGifSamples,
  createAvatarGifSampleTimeline,
  createAvatarTimelineGifKeyframes,
  ditherAvatarGifAlpha,
  orderAvatarGifKeyframes
} from '../src/avatarGifExport'
import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import type { AvatarAnimationClip, AvatarAnimationTimeline } from '@oneworks/avatar'
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
  it('samples the serializable Timeline evaluator including trim offsets, overlap, and muted tracks', () => {
    const viewClip = (fromYaw: number, toYaw: number): AvatarAnimationClip => ({
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { view: { yaw: fromYaw } } },
        { atMs: 1000, easing: 'linear', patch: { view: { yaw: toYaw } } }
      ],
      playback: 'once',
      resourceClaims: ['view:yaw']
    })
    const positionClip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1000,
      keyframes: [
        { atMs: 0, patch: { view: { positionX: 80 } } },
        { atMs: 1000, easing: 'linear', patch: { view: { positionX: 100 } } }
      ],
      playback: 'once',
      resourceClaims: ['view:positionX']
    }
    const timeline: AvatarAnimationTimeline = {
      durationMs: 9000,
      tracks: [
        {
          clips: [
            {
              durationMs: 500,
              instanceId: 'trimmed',
              playbackRate: 1,
              source: { clip: viewClip(0, 1), type: 'inline', version: 1 },
              sourceOffsetMs: 500,
              startMs: 0,
              weight: 1
            },
            {
              durationMs: 500,
              instanceId: 'sequential',
              playbackRate: 1,
              source: { clip: viewClip(1, 2), type: 'inline', version: 1 },
              sourceOffsetMs: 0,
              startMs: 500,
              weight: 1
            }
          ],
          trackId: 'motion'
        },
        {
          clips: [{
            durationMs: 1000,
            instanceId: 'muted-overlap',
            playbackRate: 1,
            source: { clip: positionClip, type: 'inline', version: 1 },
            sourceOffsetMs: 0,
            startMs: 0,
            weight: 1
          }],
          muted: true,
          trackId: 'muted'
        }
      ],
      version: 1
    }

    const frames = createAvatarTimelineGifKeyframes(createDefaultAvatarDefinition(), timeline)
    expect(frames.length).toBeGreaterThan(2)
    expect(frames[0]?.yaw).toBeCloseTo(.5)
    expect(frames.at(-1)?.yaw).toBeCloseTo(1.5)
    expect(frames.every(frame => frame.positionX === 0)).toBe(true)
    expect(frames[0]?.durationMs! * (frames.length - 1)).toBeCloseTo(1000, 8)
  })

  it('exports the configured frame range and ping-pong loop instead of the untouched source order', () => {
    const sequenceClip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 400,
      keyframes: Array.from({ length: 5 }, (_, index) => ({
        atMs: index * 100,
        easing: 'linear' as const,
        patch: { view: { positionX: index * 10 } }
      })),
      playback: 'once',
      resourceClaims: ['view:positionX']
    }
    const timeline: AvatarAnimationTimeline = {
      durationMs: 800,
      tracks: [{
        clips: [{
          durationMs: 800,
          frameSequence: {
            firstFrameIndex: 0,
            lastFrameIndex: 4,
            loop: { endFrameIndex: 3, iterations: 3, startFrameIndex: 2 }
          },
          instanceId: 'sequence-export',
          playbackRate: 1,
          source: { clip: sequenceClip, type: 'inline', version: 1 },
          sourceOffsetMs: 0,
          startMs: 0,
          weight: 1
        }],
        trackId: 'sequence'
      }],
      version: 1
    }

    const positions = createAvatarTimelineGifKeyframes(createDefaultAvatarDefinition(), timeline)
      .map(frame => frame.positionX)
    const deltas = positions.slice(1).map((value, index) => value - positions[index]!)

    expect(positions[0]).toBe(0)
    expect(positions.at(-1)).toBeCloseTo(40, 1)
    expect(deltas.some(delta => delta < 0)).toBe(true)
    expect(deltas.filter(delta => delta > 0).length).toBeGreaterThan(3)
  })

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

  it('keeps sampled track duration equal to the source instead of stretching short clips to 48 frames', () => {
    const timeline = createAvatarGifSampleTimeline(1000)
    expect(timeline.times[0]).toBe(0)
    expect(timeline.times.at(-1)).toBe(1000)
    expect(timeline.times.length).toBeLessThanOrEqual(48)
    expect(timeline.frameDurationMs * (timeline.times.length - 1)).toBeCloseTo(1000, 8)
  })

  it('dithers semi-transparent frame shadows into GIF-compatible binary alpha', () => {
    const pixels = new Uint8ClampedArray(4 * 4 * 4)
    for (let offset = 0; offset < pixels.length; offset += 4) {
      pixels[offset] = 20
      pixels[offset + 1] = 30
      pixels[offset + 2] = 40
      pixels[offset + 3] = 56
    }

    const dithered = ditherAvatarGifAlpha(pixels, 4)
    const alpha = Array.from({ length: 16 }, (_, index) => dithered[index * 4 + 3])
    expect(alpha).toContain(0)
    expect(alpha).toContain(255)
    expect(alpha.every(value => value === 0 || value === 255)).toBe(true)
    expect(dithered.slice(0, 3)).toEqual(new Uint8ClampedArray([20, 30, 40]))
  })
})
