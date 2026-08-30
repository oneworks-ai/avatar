/// <reference path="./gifenc.d.ts" />

import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import {
  getAvatarAnimationTimelineContentEndMs,
  resolveAvatarAnimationTimelineFrame
} from '@oneworks/avatar'
import type {
  AvatarAnimationTimeline,
  AvatarAnimationTimelinePresetResolver,
  AvatarDefinition
} from '@oneworks/avatar'

import { InteractiveAvatar } from './InteractiveAvatar'
import type { AvatarViewState, InteractiveAvatarProps } from './InteractiveAvatar'
import {
  applyAvatarAnimationTransformAnchor,
  createAvatarAnimationTransformAnchor,
  easeAvatarAnimationProgress,
  interpolateAvatarAnimationKeyframes
} from './avatarAnimations'
import type {
  AvatarAnimationKeyframe,
  AvatarAnimationPlaybackMode,
  AvatarAnimationTransformAnchor
} from './avatarAnimations'
import { renderAvatarCaptureCanvas } from './savedAvatarPresets'
import type { AvatarCaptureOptions } from './savedAvatarPresets'

const GIF_FRAMES_PER_SECOND = 12
const MAX_GIF_FRAMES = 48
const GIF_PALETTE_SIZE = 256
const GIF_PALETTE_FORMAT = 'rgba4444'
const GIF_ALPHA_BAYER_4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5
] as const

type AvatarGifRenderProps = Omit<
  InteractiveAvatarProps,
  | 'colorGrade'
  | 'faceStyle'
  | 'faceStyleTransitionsEnabled'
  | 'interactionMode'
  | 'interactive'
  | 'onViewStateChange'
  | 'pixelEffect'
  | 'selectedEntityPartId'
  | 'viewState'
>

export interface AvatarGifExportOptions extends AvatarCaptureOptions {
  readonly currentViewState: AvatarViewState
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly lockStartPosition: boolean
  readonly playbackMode: AvatarAnimationPlaybackMode
  readonly renderProps: AvatarGifRenderProps
  readonly size: number
  readonly startFrameIndex: number
}

export interface AvatarGifSample {
  readonly delayMs: number
  readonly keyframe: AvatarAnimationKeyframe
}

export const createAvatarGifSampleTimeline = (
  durationMs: number,
  framesPerSecond = GIF_FRAMES_PER_SECOND,
  maxFrames = MAX_GIF_FRAMES
) => {
  const resolvedDurationMs = Math.max(durationMs, 1)
  const targetFrameDurationMs = 1000 / Math.max(framesPerSecond, 1)
  const segmentCount = Math.min(
    Math.max(Math.round(maxFrames), 2) - 1,
    Math.max(1, Math.ceil(resolvedDurationMs / targetFrameDurationMs))
  )
  return {
    frameDurationMs: resolvedDurationMs / segmentCount,
    times: Array.from({ length: segmentCount + 1 }, (_, index) => (
      resolvedDurationMs * index / segmentCount
    ))
  }
}

export const createAvatarTimelineGifKeyframes = (
  definition: AvatarDefinition,
  timeline: AvatarAnimationTimeline,
  resolvePreset?: AvatarAnimationTimelinePresetResolver
): readonly AvatarAnimationKeyframe[] => {
  const durationMs = getAvatarAnimationTimelineContentEndMs(timeline)
  if (durationMs <= 0 || timeline.tracks.every(track => track.clips.length === 0)) return []
  const { frameDurationMs, times } = createAvatarGifSampleTimeline(durationMs)
  return times.map(timeMs => {
    const sampleTimeMs = Math.min(timeMs, Math.max(0, durationMs - .001))
    const frame = resolveAvatarAnimationTimelineFrame(definition, timeline, sampleTimeMs, resolvePreset)
    return {
      ...(frame.auxiliaryParts == null ? {} : { auxiliaryParts: frame.auxiliaryParts }),
      ...(frame.auxiliaryShapes == null ? {} : { auxiliaryShapes: frame.auxiliaryShapes }),
      colorGrade: frame.scene.effects.colorGrade,
      durationMs: frameDurationMs,
      easing: 'linear',
      faceStyle: frame.scene.face,
      ...(frame.partShapeMorphs == null ? {} : { partShapeMorphs: frame.partShapeMorphs }),
      ...(frame.partTransforms == null ? {} : { partTransforms: frame.partTransforms }),
      pitch: frame.scene.view.pitch,
      positionX: frame.scene.view.positionX,
      positionY: frame.scene.view.positionY,
      yaw: frame.scene.view.yaw
    }
  })
}

const clampStartFrameIndex = (index: number, length: number) => {
  return Math.min(Math.max(Math.round(index), 0), Math.max(length - 1, 0))
}

interface AvatarGifSegment {
  readonly durationMs: number
  readonly from: AvatarAnimationKeyframe
  readonly to: AvatarAnimationKeyframe
}

const createAvatarGifSegments = (
  keyframes: readonly AvatarAnimationKeyframe[],
  playbackMode: AvatarAnimationPlaybackMode
) => {
  const destinationIndices = keyframes.slice(1).map((_, index) => index + 1)
  if (playbackMode === 'loop') destinationIndices.push(0)
  return destinationIndices.map<AvatarGifSegment>(toIndex => ({
    durationMs: keyframes[toIndex]!.durationMs,
    from: keyframes[toIndex === 0 ? keyframes.length - 1 : toIndex - 1]!,
    to: keyframes[toIndex]!
  }))
}

const allocateAvatarGifSegmentFrames = (
  segments: readonly AvatarGifSegment[],
  maxFrames: number,
  includeFinalFrame: boolean
) => {
  const desiredCounts = segments.map(segment => {
    return Math.max(Math.ceil(segment.durationMs / 1000 * GIF_FRAMES_PER_SECOND), 1)
  })
  const minimumFrameCount = segments.length + (includeFinalFrame ? 1 : 0)
  const frameBudget = Math.max(Math.round(maxFrames), minimumFrameCount, 2)
  const counts = segments.map(() => 1)
  let remainingFrames = frameBudget - minimumFrameCount

  while (remainingFrames > 0) {
    let selectedIndex = -1
    let selectedScore = -Infinity
    for (const [index, desiredCount] of desiredCounts.entries()) {
      const currentCount = counts[index]!
      if (currentCount >= desiredCount) continue
      const score = desiredCount / currentCount
      if (score > selectedScore) {
        selectedIndex = index
        selectedScore = score
      }
    }
    if (selectedIndex < 0) break
    counts[selectedIndex]! += 1
    remainingFrames -= 1
  }
  return counts
}

export const orderAvatarGifKeyframes = (
  keyframes: readonly AvatarAnimationKeyframe[],
  startFrameIndex: number
) => {
  const resolvedStartIndex = clampStartFrameIndex(startFrameIndex, keyframes.length)
  return resolvedStartIndex === 0
    ? [...keyframes]
    : [...keyframes.slice(resolvedStartIndex), ...keyframes.slice(0, resolvedStartIndex)]
}

export const createAvatarGifSamples = (
  keyframes: readonly AvatarAnimationKeyframe[],
  options: {
    readonly currentViewState: AvatarViewState
    readonly lockStartPosition: boolean
    readonly maxFrames?: number
    readonly playbackMode: AvatarAnimationPlaybackMode
    readonly startFrameIndex: number
  }
): readonly AvatarGifSample[] => {
  if (keyframes.length < 2) return []
  const orderedKeyframes = orderAvatarGifKeyframes(keyframes, options.startFrameIndex)
  const firstKeyframe = orderedKeyframes[0]
  if (firstKeyframe == null) return []

  const transformAnchor: AvatarAnimationTransformAnchor = options.lockStartPosition
    ? { pitch: 0, positionX: 0, positionY: 0, yaw: 0 }
    : createAvatarAnimationTransformAnchor(options.currentViewState, firstKeyframe)
  const segments = createAvatarGifSegments(orderedKeyframes, options.playbackMode)
  if (segments.length === 0) return []
  const includeFinalFrame = options.playbackMode === 'once'
  const maxFrames = Math.max(Math.round(options.maxFrames ?? MAX_GIF_FRAMES), 2)
  const segmentFrameCounts = allocateAvatarGifSegmentFrames(segments, maxFrames, includeFinalFrame)
  const samples = segments.flatMap<AvatarGifSample>((segment, segmentIndex) => {
    const frameCount = segmentFrameCounts[segmentIndex]!
    const delayMs = segment.durationMs / frameCount
    return Array.from({ length: frameCount }, (_, frameIndex) => {
      const progress = easeAvatarAnimationProgress(
        frameIndex / frameCount,
        segment.to.easing
      )
      return {
        delayMs,
        keyframe: applyAvatarAnimationTransformAnchor(
          interpolateAvatarAnimationKeyframes(segment.from, segment.to, progress),
          transformAnchor
        )
      }
    })
  })

  if (includeFinalFrame) {
    const finalKeyframe = orderedKeyframes.at(-1)!
    const finalDelayMs = samples.at(-1)?.delayMs ?? finalKeyframe.durationMs
    samples.push({
      delayMs: Math.min(finalDelayMs, 100),
      keyframe: applyAvatarAnimationTransformAnchor(finalKeyframe, transformAnchor)
    })
  }
  return samples
}

const yieldToBrowser = () =>
  new Promise<void>(resolve => {
    window.setTimeout(resolve, 0)
  })

export const ditherAvatarGifAlpha = (source: Uint8ClampedArray, width: number) => {
  const pixels = new Uint8ClampedArray(source)
  const resolvedWidth = Math.max(Math.round(width), 1)
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + 3]!
    if (alpha === 0 || alpha === 255) continue
    const pixelIndex = offset / 4
    const x = pixelIndex % resolvedWidth
    const y = Math.floor(pixelIndex / resolvedWidth)
    const threshold = (GIF_ALPHA_BAYER_4[(y % 4) * 4 + x % 4]! + .5) * 16
    pixels[offset + 3] = alpha > threshold ? 255 : 0
  }
  return pixels
}

export const createAvatarGif = async (options: AvatarGifExportOptions) => {
  const samples = createAvatarGifSamples(options.keyframes, options)
  if (samples.length < 2) throw new Error('At least two animation keyframes are required to export a GIF')

  const container = document.createElement('div')
  container.setAttribute('aria-hidden', 'true')
  Object.assign(container.style, {
    height: `${options.size}px`,
    left: '-10000px',
    pointerEvents: 'none',
    position: 'fixed',
    top: '0',
    width: `${options.size}px`
  })
  document.body.append(container)
  const root = createRoot(container)
  const encoder = GIFEncoder()

  try {
    for (const [index, sample] of samples.entries()) {
      const viewState: AvatarViewState = {
        pitch: sample.keyframe.pitch,
        positionX: sample.keyframe.positionX,
        positionY: sample.keyframe.positionY,
        roll: options.currentViewState.roll,
        scale: options.currentViewState.scale,
        yaw: sample.keyframe.yaw
      }
      flushSync(() => {
        root.render(
          <InteractiveAvatar
            {...options.renderProps}
            auxiliaryParts={sample.keyframe.auxiliaryParts}
            auxiliaryShapes={sample.keyframe.auxiliaryShapes}
            colorGrade={sample.keyframe.colorGrade}
            faceStyleTransitionsEnabled={false}
            faceStyle={sample.keyframe.faceStyle}
            interactive={false}
            interactionMode='rotate'
            onViewStateChange={() => undefined}
            partShapeMorphs={sample.keyframe.partShapeMorphs}
            partTransforms={sample.keyframe.partTransforms}
            viewState={viewState}
          />
        )
      })
      const sourceSvg = container.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
      if (sourceSvg == null) throw new Error('Unable to render avatar GIF frame')

      const canvas = await renderAvatarCaptureCanvas(sourceSvg, options.size, options)
      const context = canvas.getContext('2d')
      if (context == null) throw new Error('Unable to read avatar GIF frame')
      const pixels = ditherAvatarGifAlpha(
        context.getImageData(0, 0, options.size, options.size).data,
        options.size
      )
      const palette = quantize(pixels, GIF_PALETTE_SIZE, {
        clearAlpha: true,
        clearAlphaThreshold: 127,
        format: GIF_PALETTE_FORMAT,
        oneBitAlpha: true
      })
      const indexedPixels = applyPalette(pixels, palette, GIF_PALETTE_FORMAT)
      const transparentIndex = palette.findIndex(color => color[3] === 0)
      encoder.writeFrame(indexedPixels, options.size, options.size, {
        delay: sample.delayMs,
        dispose: transparentIndex >= 0 ? 2 : 1,
        palette,
        repeat: options.playbackMode === 'loop' ? 0 : -1,
        transparent: transparentIndex >= 0,
        transparentIndex
      })

      if (index < samples.length - 1) await yieldToBrowser()
    }
    encoder.finish()
    return new Blob([Uint8Array.from(encoder.bytes()).buffer], { type: 'image/gif' })
  } finally {
    root.unmount()
    container.remove()
  }
}
