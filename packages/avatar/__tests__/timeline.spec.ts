import { describe, expect, it, vi } from 'vitest'

import {
  AVATAR_ANIMATION_TIMELINE_VERSION,
  createDefaultAvatarDefinition,
  getAvatarAnimationTimelineContentEndMs,
  getAvatarAnimationTimelineDisplayTracks,
  migrateAvatarAnimationTracksToTimeline,
  normalizeAvatarAnimationTimeline,
  parseAvatarAnimationClip,
  previewMoveAvatarAnimationTimelineClip,
  previewTrimAvatarAnimationTimelineClip,
  reorderAvatarAnimationTimelineTrack,
  resolveAvatarAnimationTimelineFrame,
  resolveAvatarAnimationTimelineSequenceNodes,
  resolveAvatarAnimationTracks,
  restoreAvatarAnimationTimelineClip,
  validateAvatarAnimationTimeline
} from '../src'
import type {
  AvatarAnimationClip,
  AvatarAnimationTimeline,
  AvatarAnimationTimelineClipInstance,
  AvatarAnimationTimelineTrack
} from '../src'

const onceClip = (yaw = 1): AvatarAnimationClip => ({
  anchor: 'absolute',
  durationMs: 1000,
  keyframes: [
    { atMs: 0, patch: { view: { yaw: 0 } } },
    { atMs: 1000, easing: 'linear', patch: { view: { yaw } } }
  ],
  playback: 'once',
  resourceClaims: ['view:yaw']
})

const loopClip = (yaw = 1): AvatarAnimationClip => ({
  anchor: 'absolute',
  durationMs: 1000,
  keyframes: [
    { atMs: 0, patch: { view: { yaw: 0 } } },
    { atMs: 500, easing: 'linear', patch: { view: { yaw } } }
  ],
  playback: 'loop',
  resourceClaims: ['view:yaw']
})

const sequenceClip = (): AvatarAnimationClip => ({
  anchor: 'absolute',
  durationMs: 400,
  keyframes: Array.from({ length: 5 }, (_, index) => ({
    atMs: index * 100,
    easing: 'linear' as const,
    patch: { view: { yaw: index } }
  })),
  playback: 'once',
  resourceClaims: ['view:yaw']
})

const instance = (
  instanceId: string,
  startMs: number,
  durationMs: number,
  clip: AvatarAnimationClip = onceClip(),
  overrides: Partial<AvatarAnimationTimelineClipInstance> = {}
): AvatarAnimationTimelineClipInstance => ({
  durationMs,
  instanceId,
  playbackRate: 1,
  source: { clip, type: 'inline', version: 1 },
  sourceOffsetMs: 0,
  startMs,
  weight: 1,
  ...overrides
})

const timeline = (
  tracks: readonly AvatarAnimationTimelineTrack[],
  durationMs = Math.max(0, ...tracks.flatMap(track => track.clips.map(clip => clip.startMs + clip.durationMs)))
): AvatarAnimationTimeline => ({ durationMs, tracks, version: AVATAR_ANIMATION_TIMELINE_VERSION })

describe('OneWorks Avatar animation timeline', () => {
  it('uses the final clip frame as the playback boundary instead of retained canvas duration', () => {
    const value = timeline([{
      clips: [instance('first', 0, 500), instance('last', 1200, 300)],
      trackId: 'motion'
    }], 6000)

    expect(getAvatarAnimationTimelineContentEndMs(value)).toBe(1500)
    expect(getAvatarAnimationTimelineContentEndMs(timeline([], 6000))).toBe(0)
  })

  it('uses a serializable discriminated source union and rejects ambiguous or missing sources', () => {
    const presetTimeline = timeline([{
      clips: [{
        durationMs: 500,
        instanceId: 'notice',
        playbackRate: 1,
        source: { fallback: 'skip', presetId: 'notification', presetVersion: 1, type: 'preset' },
        sourceOffsetMs: 0,
        startMs: 0,
        weight: 1
      }],
      trackId: 'effects'
    }])
    expect(validateAvatarAnimationTimeline(JSON.parse(JSON.stringify(presetTimeline)))).toEqual(presetTimeline)

    const ambiguous = structuredClone(presetTimeline) as unknown as {
      tracks: { clips: { source: Record<string, unknown> }[] }[]
    }
    ambiguous.tracks[0]!.clips[0]!.source.clip = onceClip()
    expect(() => validateAvatarAnimationTimeline(ambiguous as never)).toThrow()
    delete ambiguous.tracks[0]!.clips[0]!.source.type
    expect(() => validateAvatarAnimationTimeline(ambiguous as never)).toThrow()
  })

  it('uses half-open [start,end) intervals so adjacent clips never overlap', () => {
    const definition = createDefaultAvatarDefinition()
    const value = timeline([{
      clips: [instance('first', 0, 500, onceClip(.2)), instance('second', 500, 500, onceClip(.8))],
      trackId: 'expressions'
    }])
    expect(validateAvatarAnimationTimeline(value)).toBe(value)
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 499).activeClips[0]?.instanceId).toBe('first')
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 500).activeClips[0]?.instanceId).toBe('second')
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 1000).activeClips).toEqual([])

    const overlapping = timeline([{
      clips: [instance('first', 0, 501), instance('second', 500, 500)],
      trackId: 'expressions'
    }])
    expect(() => validateAvatarAnimationTimeline(overlapping)).toThrow(/Overlapping/)
  })

  it('clamps one-shot source time and wraps loop source time without changing block duration', () => {
    const definition = createDefaultAvatarDefinition()
    const oneShot = instance('once', 0, 2000, onceClip(), {
      playbackRate: 2,
      sourceOffsetMs: 100
    })
    const looping = instance('loop', 2000, 1000, loopClip(), {
      playbackRate: 1,
      sourceOffsetMs: 800
    })
    const value = timeline([{ clips: [oneShot, looping], trackId: 'motion' }], 3000)

    expect(resolveAvatarAnimationTimelineFrame(definition, value, 600).activeClips[0]?.sourceTimeMs).toBe(1000)
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 2300).activeClips[0]?.sourceTimeMs).toBe(100)
    expect(value.tracks[0]?.clips[0]?.durationMs).toBe(2000)
    expect(() => validateAvatarAnimationTimeline(timeline([{
      clips: [instance('invalid-loop', 0, 100, loopClip(), { sourceOffsetMs: 1000 })],
      trackId: 'invalid'
    }]))).toThrow()
  })

  it('expands looping source keyframes across the full timeline clip duration', () => {
    const source = loopClip()
    const clip = instance('loop-nodes', 0, 3000, source)

    expect(resolveAvatarAnimationTimelineSequenceNodes(clip, source)).toEqual([
      { sequenceTimeMs: 0, sourceFrameIndex: 0 },
      { sequenceTimeMs: 500, sourceFrameIndex: 1 },
      { sequenceTimeMs: 1000, sourceFrameIndex: 0 },
      { sequenceTimeMs: 1500, sourceFrameIndex: 1 },
      { sequenceTimeMs: 2000, sourceFrameIndex: 0 },
      { sequenceTimeMs: 2500, sourceFrameIndex: 1 },
      { sequenceTimeMs: 3000, sourceFrameIndex: 0 }
    ])
  })

  it('lets a timeline clip override the source playback mode without mutating the source', () => {
    const definition = createDefaultAvatarDefinition()
    const source = loopClip()
    const oneShot = instance('loop-as-once', 0, 3000, source, { playback: 'once' })
    const repeated = instance('once-as-loop', 3000, 3000, onceClip(), { playback: 'loop' })
    const value = timeline([{ clips: [oneShot, repeated], trackId: 'motion' }], 6000)

    expect(resolveAvatarAnimationTimelineSequenceNodes(oneShot, source)).toEqual([
      { sequenceTimeMs: 0, sourceFrameIndex: 0 },
      { sequenceTimeMs: 500, sourceFrameIndex: 1 }
    ])
    expect(resolveAvatarAnimationTimelineSequenceNodes(repeated, onceClip())).toEqual([
      { sequenceTimeMs: 0, sourceFrameIndex: 0 },
      { sequenceTimeMs: 1000, sourceFrameIndex: 1 },
      { sequenceTimeMs: 1000, sourceFrameIndex: 0 },
      { sequenceTimeMs: 2000, sourceFrameIndex: 1 },
      { sequenceTimeMs: 2000, sourceFrameIndex: 0 },
      { sequenceTimeMs: 3000, sourceFrameIndex: 1 },
      { sequenceTimeMs: 3000, sourceFrameIndex: 0 }
    ])
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 2500).activeClips[0]?.sourceTimeMs).toBe(1000)
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 5500).activeClips[0]?.sourceTimeMs).toBe(500)
    expect(validateAvatarAnimationTimeline(value)).toBe(value)
    expect(source.playback).toBe('loop')
  })

  it('bounds very long loop thumbnails while preserving real occurrences across the full clip', () => {
    const source = loopClip()
    const clip = instance('long-loop-nodes', 0, 300_000, source)
    const nodes = resolveAvatarAnimationTimelineSequenceNodes(clip, source)

    expect(nodes.length).toBeLessThanOrEqual(256)
    expect(nodes[0]).toEqual({ sequenceTimeMs: 0, sourceFrameIndex: 0 })
    expect(nodes.at(-1)).toEqual({ sequenceTimeMs: 300_000, sourceFrameIndex: 0 })
    expect(nodes.some(node => node.sequenceTimeMs >= 140_000 && node.sequenceTimeMs <= 160_000)).toBe(true)
    expect(nodes.every(node => (
      node.sequenceTimeMs % 1000 === (node.sourceFrameIndex === 0 ? 0 : 500)
    ))).toBe(true)
  })

  it('preserves the nearest real loop occurrences at fractional visible boundaries', () => {
    const source = loopClip()
    const fromOrigin = resolveAvatarAnimationTimelineSequenceNodes(
      instance('fractional-loop-origin', 0, 300_200, source),
      source
    )
    const deeplyTrimmed = resolveAvatarAnimationTimelineSequenceNodes(
      instance('fractional-loop-trimmed', 0, 300_000, source, { sourceOffsetMs: 1500 }),
      source
    )

    expect(fromOrigin.length).toBeLessThanOrEqual(256)
    expect(fromOrigin[0]).toEqual({ sequenceTimeMs: 0, sourceFrameIndex: 0 })
    expect(fromOrigin.at(-1)).toEqual({ sequenceTimeMs: 300_000, sourceFrameIndex: 0 })
    expect(fromOrigin.some(node => node.sequenceTimeMs >= 140_000 && node.sequenceTimeMs <= 160_000))
      .toBe(true)
    expect(deeplyTrimmed.length).toBeLessThanOrEqual(256)
    expect(deeplyTrimmed[0]).toEqual({ sequenceTimeMs: 1500, sourceFrameIndex: 1 })
    expect(deeplyTrimmed.at(-1)).toEqual({ sequenceTimeMs: 301_500, sourceFrameIndex: 1 })
    expect([...fromOrigin, ...deeplyTrimmed].every(node => (
      node.sequenceTimeMs % 1000 === (node.sourceFrameIndex === 0 ? 0 : 500)
    ))).toBe(true)
  })

  it('expands a selected frame range for every visible source loop cycle', () => {
    const source = { ...sequenceClip(), playback: 'loop' as const }
    const clip = instance('range-loop-nodes', 0, 700, source, {
      frameSequence: { firstFrameIndex: 1, lastFrameIndex: 3 }
    })
    const nodes = resolveAvatarAnimationTimelineSequenceNodes(clip, source)

    expect(nodes.filter(node => node.sourceFrameIndex === 1).map(node => node.sequenceTimeMs))
      .toEqual([0, 200, 400, 600])
    expect(nodes.at(-1)).toEqual({ sequenceTimeMs: 700, sourceFrameIndex: 2 })
  })

  it('maps a trimmed frame range through a finite ping-pong loop before continuing to the outro', () => {
    const definition = createDefaultAvatarDefinition()
    const clip = instance('sequence', 0, 800, sequenceClip(), {
      frameSequence: {
        firstFrameIndex: 1,
        lastFrameIndex: 4,
        loop: { endFrameIndex: 3, iterations: 3, startFrameIndex: 2 }
      }
    })
    const value = timeline([{ clips: [clip], trackId: 'sequence' }], 800)

    expect([0, 100, 200, 300, 400, 500, 600, 700].map(timeMs => (
      resolveAvatarAnimationTimelineFrame(definition, value, timeMs).activeClips[0]?.sourceTimeMs
    ))).toEqual([100, 200, 300, 200, 300, 200, 300, 400])
    expect(resolveAvatarAnimationTimelineSequenceNodes(clip, sequenceClip())).toEqual([
      { sequenceTimeMs: 0, sourceFrameIndex: 1 },
      { sequenceTimeMs: 100, sourceFrameIndex: 2 },
      { sequenceTimeMs: 200, sourceFrameIndex: 3 },
      { sequenceTimeMs: 300, sourceFrameIndex: 2 },
      { sequenceTimeMs: 400, sourceFrameIndex: 3 },
      { sequenceTimeMs: 500, sourceFrameIndex: 2 },
      { sequenceTimeMs: 600, sourceFrameIndex: 3 },
      { sequenceTimeMs: 700, sourceFrameIndex: 4 }
    ])
  })

  it('supports an infinite ping-pong frame region while keeping the timeline clip finite', () => {
    const definition = createDefaultAvatarDefinition()
    const clip = instance('sequence-loop', 0, 1000, sequenceClip(), {
      frameSequence: {
        firstFrameIndex: 0,
        lastFrameIndex: 4,
        loop: { endFrameIndex: 3, iterations: 'infinite', startFrameIndex: 1 }
      }
    })
    const value = timeline([{ clips: [clip], trackId: 'sequence-loop' }], 1000)

    expect(resolveAvatarAnimationTimelineFrame(definition, value, 100).activeClips[0]?.sourceTimeMs).toBe(100)
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 300).activeClips[0]?.sourceTimeMs).toBe(300)
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 500).activeClips[0]?.sourceTimeMs).toBe(100)
    expect(resolveAvatarAnimationTimelineFrame(definition, value, 700).activeClips[0]?.sourceTimeMs).toBe(300)
    expect(validateAvatarAnimationTimeline(JSON.parse(JSON.stringify(value)))).toEqual(value)
  })

  it('samples a deeply trimmed long infinite frame loop across its full visible window', () => {
    const source = sequenceClip()
    const clip = instance('long-sequence-loop', 0, 180_000, source, {
      frameSequence: {
        firstFrameIndex: 0,
        lastFrameIndex: 4,
        loop: { endFrameIndex: 3, iterations: 'infinite', startFrameIndex: 1 }
      },
      sourceOffsetMs: 120_000
    })
    const nodes = resolveAvatarAnimationTimelineSequenceNodes(clip, source)

    expect(nodes.length).toBeLessThanOrEqual(256)
    expect(nodes[0]!.sequenceTimeMs).toBeGreaterThanOrEqual(120_000)
    expect(nodes.at(-1)).toEqual({ sequenceTimeMs: 300_000, sourceFrameIndex: 2 })
    expect(nodes.some(node => node.sequenceTimeMs >= 200_000 && node.sequenceTimeMs <= 220_000)).toBe(true)
  })

  it('preserves the nearest real ping-pong occurrences at fractional visible boundaries', () => {
    const source = sequenceClip()
    const clip = instance('fractional-sequence-loop', 0, 300_100, source, {
      frameSequence: {
        firstFrameIndex: 0,
        lastFrameIndex: 4,
        loop: { endFrameIndex: 3, iterations: 'infinite', startFrameIndex: 1 }
      },
      sourceOffsetMs: 150
    })
    const nodes = resolveAvatarAnimationTimelineSequenceNodes(clip, source)

    expect(nodes.length).toBeLessThanOrEqual(256)
    expect(nodes[0]).toEqual({ sequenceTimeMs: 200, sourceFrameIndex: 2 })
    expect(nodes.at(-1)).toEqual({ sequenceTimeMs: 300_200, sourceFrameIndex: 2 })
    expect(nodes.some(node => node.sequenceTimeMs >= 140_000 && node.sequenceTimeMs <= 160_000))
      .toBe(true)
  })

  it('rejects frame loops outside the trimmed source range', () => {
    const invalid = timeline([{
      clips: [instance('invalid-sequence', 0, 1000, sequenceClip(), {
        frameSequence: {
          firstFrameIndex: 1,
          lastFrameIndex: 3,
          loop: { endFrameIndex: 4, iterations: 2, startFrameIndex: 2 }
        }
      })],
      trackId: 'invalid-sequence'
    }])
    expect(() => validateAvatarAnimationTimeline(invalid)).toThrow()
  })

  it('keeps start trims in virtual sequence time instead of wrapping against the raw source duration', () => {
    const definition = createDefaultAvatarDefinition()
    const original = timeline([{
      clips: [instance('trim-sequence', 0, 800, sequenceClip(), {
        frameSequence: {
          firstFrameIndex: 1,
          lastFrameIndex: 4,
          loop: { endFrameIndex: 3, iterations: 3, startFrameIndex: 2 }
        }
      })],
      trackId: 'trim-sequence'
    }], 800)
    const preview = previewTrimAvatarAnimationTimelineClip(original, {
      edge: 'start', instanceId: 'trim-sequence', snap: false, timeMs: 300
    })
    expect(preview.valid).toBe(true)
    if (!preview.valid) return
    expect(preview.timeline.tracks[0]?.clips[0]?.sourceOffsetMs).toBe(300)
    expect(resolveAvatarAnimationTimelineFrame(definition, preview.timeline, 300).activeClips[0]?.sourceTimeMs)
      .toBe(200)
  })

  it('multiplies track, clip and envelope weights at the current timeline time', () => {
    const definition = createDefaultAvatarDefinition()
    const value = timeline([{
      clips: [instance('fade', 0, 1000, onceClip(1), {
        envelope: { fadeInMs: 200, fadeOutMs: 200 },
        weight: .8
      })],
      trackId: 'fade-track',
      weight: .5
    }])
    const frame = resolveAvatarAnimationTimelineFrame(definition, value, 100)
    expect(frame.activeClips[0]?.resourceWeights['view:yaw']).toBeCloseTo(.2)
    expect(frame.scene.view.yaw).toBeCloseTo(.02)

    const invalidEnvelope = timeline([{
      clips: [instance('invalid-envelope', 0, 300, onceClip(), {
        envelope: { fadeInMs: 200, fadeOutMs: 200 }
      })],
      trackId: 'invalid'
    }])
    expect(() => validateAvatarAnimationTimeline(invalidEnvelope)).toThrow()
  })

  it('stores an explicit duration, expands it on edits, and never shrinks it merely because clips disappear', () => {
    const original = timeline([{
      clips: [instance('clip', 0, 500)],
      trackId: 'track'
    }], 2000)
    const moved = previewMoveAvatarAnimationTimelineClip(original, {
      instanceId: 'clip', snap: false, startMs: 2400, targetTrackId: 'track'
    })
    expect(moved.valid).toBe(true)
    if (!moved.valid) return
    expect(moved.timeline.durationMs).toBe(2900)
    expect(original.durationMs).toBe(2000)
    expect(normalizeAvatarAnimationTimeline({
      ...moved.timeline,
      tracks: moved.timeline.tracks.map(track => ({ ...track, clips: [] }))
    }).durationMs).toBe(2900)
  })

  it('binary-searches a validated sorted track without rescanning clip history each frame', () => {
    const definition = createDefaultAvatarDefinition()
    const sourceClips = Array.from({ length: 100 }, (_, index): AvatarAnimationTimelineClipInstance => ({
      durationMs: 100,
      instanceId: `clip-${index}`,
      playbackRate: 1,
      source: { fallback: 'skip', presetId: `preset-${index}`, presetVersion: 1, type: 'preset' },
      sourceOffsetMs: 0,
      startMs: index * 100,
      weight: 1
    }))
    let numericReads = 0
    const clips = new Proxy(sourceClips, {
      get(target, property, receiver) {
        if (typeof property === 'string' && /^\d+$/.test(property)) numericReads += 1
        return Reflect.get(target, property, receiver)
      }
    })
    const value = timeline([{ clips, trackId: 'history' }], 10000)
    validateAvatarAnimationTimeline(value)
    numericReads = 0
    const resolver = vi.fn(() => onceClip())
    const frame = resolveAvatarAnimationTimelineFrame(
      definition,
      value,
      7654,
      resolver
    )
    expect(frame.activeClips[0]?.instanceId).toBe('clip-76')
    expect(resolver).toHaveBeenCalledOnce()
    expect(resolver.mock.calls[0]?.[0]).toMatchObject({ presetId: 'preset-76' })
    expect(resolver.mock.calls[0]?.[1]).toBe(sourceClips[76])
    expect(numericReads).toBeLessThan(20)
  })

  it('returns immutable move previews, rejects same-track overlap, snaps, and restores complete undo state', () => {
    const originalClip = instance('moving', 0, 500, onceClip(), {
      parameterValues: {},
      sourceOffsetMs: 100
    })
    const original = timeline([
      { clips: [originalClip], trackId: 'low' },
      { clips: [instance('neighbor', 1000, 500)], trackId: 'high' }
    ], 2000)
    const preview = previewMoveAvatarAnimationTimelineClip(original, {
      instanceId: 'moving',
      playheadMs: 500,
      snapThresholdMs: 80,
      startMs: 530,
      targetTrackId: 'high'
    })
    expect(preview.valid).toBe(true)
    if (!preview.valid) return
    expect(preview.snappedTimeMs).toBe(500)
    expect(original.tracks[0]?.clips).toEqual([originalClip])
    expect(preview.timeline.tracks[1]?.clips.map(clip => clip.instanceId)).toEqual(['moving', 'neighbor'])
    expect(restoreAvatarAnimationTimelineClip(preview.timeline, preview.undo)).toEqual(original)

    const conflict = previewMoveAvatarAnimationTimelineClip(original, {
      instanceId: 'moving', snap: false, startMs: 1100, targetTrackId: 'high'
    })
    expect(conflict).toMatchObject({ conflictInstanceId: 'neighbor', reason: 'conflict', valid: false })
    expect(conflict.timeline).toBe(original)
  })

  it('trims source offset without time-stretching, clamps the envelope, snaps, and remains undoable', () => {
    const originalClip = instance('trim', 100, 1000, onceClip(), {
      envelope: { fadeInMs: 400, fadeOutMs: 400 },
      playbackRate: 2,
      sourceOffsetMs: 100
    })
    const original = timeline([{ clips: [originalClip], trackId: 'track' }], 2000)
    const preview = previewTrimAvatarAnimationTimelineClip(original, {
      edge: 'start', instanceId: 'trim', snap: false, timeMs: 400
    })
    expect(preview.valid).toBe(true)
    if (!preview.valid) return
    const trimmed = preview.timeline.tracks[0]?.clips[0]
    expect(trimmed).toMatchObject({ durationMs: 700, playbackRate: 2, sourceOffsetMs: 700, startMs: 400 })
    expect((trimmed?.envelope?.fadeInMs ?? 0) + (trimmed?.envelope?.fadeOutMs ?? 0)).toBe(700)
    expect(restoreAvatarAnimationTimelineClip(preview.timeline, preview.undo)).toEqual(original)
  })

  it('canonicalizes start-trim offsets with source loop modulo and one-shot clamp semantics', () => {
    const looping = timeline([{ clips: [instance('looping', 0, 3000, loopClip())], trackId: 'loop' }])
    const loopTrim = previewTrimAvatarAnimationTimelineClip(looping, {
      edge: 'start', instanceId: 'looping', snap: false, timeMs: 1500
    })
    expect(loopTrim.valid).toBe(true)
    if (!loopTrim.valid) return
    expect(loopTrim.timeline.tracks[0]?.clips[0]).toMatchObject({
      durationMs: 1500,
      sourceOffsetMs: 500,
      startMs: 1500
    })

    const held = timeline([{ clips: [instance('held', 0, 3000, onceClip())], trackId: 'once' }])
    const heldTrim = previewTrimAvatarAnimationTimelineClip(held, {
      edge: 'start', instanceId: 'held', snap: false, timeMs: 1500
    })
    expect(heldTrim.valid).toBe(true)
    if (!heldTrim.valid) return
    expect(heldTrim.timeline.tracks[0]?.clips[0]).toMatchObject({
      durationMs: 1500,
      sourceOffsetMs: 1000,
      startMs: 1500
    })

    const wrapped = timeline([{
      clips: [instance('wrapped', 500, 1000, loopClip(), { sourceOffsetMs: 100 })],
      trackId: 'wrapped-loop'
    }], 1500)
    const wrappedTrim = previewTrimAvatarAnimationTimelineClip(wrapped, {
      edge: 'start', instanceId: 'wrapped', snap: false, timeMs: 300
    })
    expect(wrappedTrim.valid).toBe(true)
    if (!wrappedTrim.valid) return
    expect(wrappedTrim.timeline.tracks[0]?.clips[0]?.sourceOffsetMs).toBe(900)

    const preset = timeline([{
      clips: [instance('preset-end', 0, 1000, onceClip(), {
        source: { fallback: 'skip', presetId: 'notice', presetVersion: 1, type: 'preset' }
      })],
      trackId: 'preset'
    }])
    const presetEndTrim = previewTrimAvatarAnimationTimelineClip(preset, {
      edge: 'end', instanceId: 'preset-end', snap: false, timeMs: 800
    })
    expect(presetEndTrim.valid).toBe(true)
    if (!presetEndTrim.valid) return
    expect(presetEndTrim.timeline.tracks[0]?.clips[0]).toMatchObject({
      durationMs: 800,
      sourceOffsetMs: 0
    })
  })

  it('keeps runtime namespaces injective for arbitrary valid track and instance ids', () => {
    const value = timeline([
      { clips: [instance('c', 0, 1000, onceClip(.2))], trackId: 'a\u001fb' },
      { clips: [instance('b\u001fc', 0, 1000, onceClip(.8))], trackId: 'a' }
    ])
    const frame = resolveAvatarAnimationTimelineFrame(createDefaultAvatarDefinition(), value, 500)
    expect(frame.activeClips.map(item => [item.trackId, item.instanceId])).toEqual([
      ['a\u001fb', 'c'],
      ['a', 'b\u001fc']
    ])
    expect(frame.scene.view.yaw).toBeCloseTo(.4)

    const malformedUnicode = timeline([
      { clips: [instance('left', 0, 1000, onceClip(.2))], trackId: '\ud800' },
      { clips: [instance('right', 0, 1000, onceClip(.8))], trackId: '%uD800' }
    ])
    expect(() => resolveAvatarAnimationTimelineFrame(
      createDefaultAvatarDefinition(), malformedUnicode, 500
    )).not.toThrow()
    const malformedFrame = resolveAvatarAnimationTimelineFrame(
      createDefaultAvatarDefinition(), malformedUnicode, 500
    )
    expect(Object.keys(malformedFrame.trackWrites ?? {})).toHaveLength(2)
  })

  it('keeps runtime low-to-high while the view adapter displays the highest-priority track first', () => {
    const definition = createDefaultAvatarDefinition()
    const low = { clips: [instance('low-clip', 0, 1000, onceClip(.2))], trackId: 'low' }
    const high = { clips: [instance('high-clip', 0, 1000, onceClip(.8))], trackId: 'high' }
    const original = timeline([low, high])
    expect(getAvatarAnimationTimelineDisplayTracks(original).map(track => track.trackId)).toEqual(['high', 'low'])
    expect(resolveAvatarAnimationTimelineFrame(definition, original, 500).scene.view.yaw).toBeCloseTo(.4)

    const reordered = reorderAvatarAnimationTimelineTrack(original, 'low', 1)
    expect(getAvatarAnimationTimelineDisplayTracks(reordered).map(track => track.trackId)).toEqual(['low', 'high'])
    expect(resolveAvatarAnimationTimelineFrame(definition, reordered, 500).scene.view.yaw).toBeCloseTo(.1)
  })

  it('honors mute/solo, reports unresolved preset fallbacks, and migrates old single-clip tracks', () => {
    const definition = createDefaultAvatarDefinition()
    const unresolved = timeline([{
      clips: [{
        durationMs: 500,
        instanceId: 'missing',
        playbackRate: 1,
        source: { fallback: 'skip', presetId: 'missing', presetVersion: 1, type: 'preset' },
        sourceOffsetMs: 0,
        startMs: 0,
        weight: 1
      }],
      trackId: 'preset'
    }])
    expect(resolveAvatarAnimationTimelineFrame(definition, unresolved, 100).unresolvedClipIds).toEqual(['missing'])

    const legacyTrack = {
      clip: onceClip(.6), elapsedMs: 250, muted: false, parameterValues: {}, speed: 2,
      preserveAuxiliaryPartIds: true, trackId: 'legacy', weight: .75
    } as const
    const migrated = migrateAvatarAnimationTracksToTimeline([legacyTrack])
    expect(migrated).toMatchObject({
      durationMs: 500,
      tracks: [{
        clips: [{
          durationMs: 500,
          playbackRate: 2,
          preserveAuxiliaryPartIds: true,
          sourceOffsetMs: 500,
          startMs: 0
        }],
        trackId: 'legacy',
        weight: .75
      }],
      version: 1
    })
    expect(migrated.tracks[0]?.clips[0]?.source.type).toBe('inline')
    expect(resolveAvatarAnimationTimelineFrame(definition, migrated, 0).scene).toEqual(
      resolveAvatarAnimationTracks(definition, [legacyTrack]).scene
    )

    const auxClip: AvatarAnimationClip = {
      anchor: 'absolute',
      durationMs: 1100,
      keyframes: [0, 1000].map(atMs => ({
        atMs,
        patch: {
          auxiliaryParts: [{
            opacity: 100,
            part: {
              baseColor: '#3b82f6', face: false, foregroundColor: '#173f99',
              highlightColor: '#8bb6ff', id: 'notification-orb', label: 'Notification orb',
              scaleX: .2, scaleY: .2, scaleZ: .2, shadowColor: '#2457b8', shape: 'sphere',
              x: 0, y: 0, z: 0
            }
          }]
        }
      })),
      playback: 'loop'
    }
    const legacyAuxTrack = {
      clip: auxClip,
      elapsedMs: 750,
      preserveAuxiliaryPartIds: true,
      speed: 2,
      trackId: 'legacy-aux'
    } as const
    expect(parseAvatarAnimationClip(auxClip)).toEqual(auxClip)
    const migratedAux = migrateAvatarAnimationTracksToTimeline([legacyAuxTrack])
    const legacyAux = resolveAvatarAnimationTracks(definition, [legacyAuxTrack])
    const timelineAux = resolveAvatarAnimationTimelineFrame(definition, migratedAux, 0)
    expect(timelineAux.activeClips[0]?.sourceTimeMs).toBe(400)
    expect(timelineAux.auxiliaryParts?.map(item => item.part.id)).toEqual(
      legacyAux.auxiliaryParts?.map(item => item.part.id)
    )
  })
})
