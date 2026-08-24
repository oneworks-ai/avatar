import { describe, expect, it } from 'vitest'

import {
  AVATAR_ANIMATION_PRESETS,
  applyAvatarAnimationTransformAnchor,
  createAvatarAnimationKeyframe,
  createAvatarAnimationTransformAnchor,
  deserializeSharedAvatarAnimation,
  easeAvatarAnimationProgress,
  interpolateAvatarAnimationKeyframes,
  normalizeAvatarAnimationKeyframes,
  resolveAvatarAnimationPreset,
  resolveAvatarAnimationSegment,
  resolveAvatarAnimationTimedSegment,
  serializeSharedAvatarAnimation,
  shouldConfirmAnimationReplacement
} from '../src/avatarAnimations'
import { DEFAULT_AVATAR_COLOR_GRADE } from '../src/avatarColorGrade'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'

describe('avatar animation keyframes', () => {
  it('applies the selected easing curve without leaving the normalized range', () => {
    expect(easeAvatarAnimationProgress(-1, 'linear')).toBe(0)
    expect(easeAvatarAnimationProgress(.5, 'linear')).toBe(.5)
    expect(easeAvatarAnimationProgress(.5, 'ease-in')).toBe(.25)
    expect(easeAvatarAnimationProgress(.5, 'ease-out')).toBe(.75)
    expect(easeAvatarAnimationProgress(.25, 'ease-in-out')).toBe(.125)
    expect(easeAvatarAnimationProgress(.75, 'ease-in-out')).toBe(.875)
    expect(easeAvatarAnimationProgress(2, 'linear')).toBe(1)
  })

  it('only asks before replacing a non-built-in draft that already has keyframes', () => {
    expect(shouldConfirmAnimationReplacement(null, 0)).toBe(false)
    expect(shouldConfirmAnimationReplacement('builtin', 6)).toBe(false)
    expect(shouldConfirmAnimationReplacement('custom', 0)).toBe(false)
    expect(shouldConfirmAnimationReplacement('custom', 1)).toBe(true)
    expect(shouldConfirmAnimationReplacement('saved', 4)).toBe(true)
  })

  it('resolves non-uniform keyframe timing within the active segment', () => {
    const base = createAvatarAnimationKeyframe(
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const keyframes = [
      { ...base, offset: 0 },
      { ...base, offset: .2 },
      { ...base, offset: .8 },
      { ...base, offset: 1 }
    ]

    const firstSegment = resolveAvatarAnimationSegment(keyframes, .1)
    const middleSegment = resolveAvatarAnimationSegment(keyframes, .5)
    const lastSegment = resolveAvatarAnimationSegment(keyframes, .9)

    expect(firstSegment).toMatchObject({ fromIndex: 0, toIndex: 1 })
    expect(firstSegment.progress).toBeCloseTo(.5)
    expect(middleSegment).toMatchObject({ fromIndex: 1, toIndex: 2 })
    expect(middleSegment.progress).toBeCloseTo(.5)
    expect(lastSegment).toMatchObject({ fromIndex: 2, toIndex: 3 })
    expect(lastSegment.progress).toBeCloseTo(.5)
  })

  it('reanchors playback to the current transform while preserving frame movement', () => {
    const first = createAvatarAnimationKeyframe(
      { pitch: .2, positionX: 30, positionY: -10, scale: 1, yaw: -.4 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const second = createAvatarAnimationKeyframe(
      { pitch: .35, positionX: 42, positionY: -18, scale: 1, yaw: -.1 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const anchor = createAvatarAnimationTransformAnchor(
      { pitch: -.5, positionX: 120, positionY: 64, scale: 2, yaw: .8 },
      first
    )

    const anchoredFirst = applyAvatarAnimationTransformAnchor(first, anchor)
    const anchoredSecond = applyAvatarAnimationTransformAnchor(second, anchor)

    expect(anchoredFirst.positionX).toBe(120)
    expect(anchoredFirst.positionY).toBe(64)
    expect(anchoredFirst.pitch).toBeCloseTo(-.5)
    expect(anchoredFirst.yaw).toBeCloseTo(.8)
    expect(anchoredSecond.positionX).toBe(132)
    expect(anchoredSecond.positionY).toBe(56)
    expect(anchoredSecond.pitch).toBeCloseTo(-.35)
    expect(anchoredSecond.yaw).toBeCloseTo(1.1)
  })

  it('captures pose, face, and a transparent preview without camera metadata or scale', () => {
    const screenshot = 'data:image/png;base64,keyframe'
    const keyframe = createAvatarAnimationKeyframe(
      {
        pitch: .5,
        positionX: 20,
        positionY: -30,
        scale: 1.8,
        yaw: -.25
      },
      DEFAULT_AVATAR_FACE_STYLE,
      screenshot
    )

    expect(keyframe).toEqual({
      colorGrade: DEFAULT_AVATAR_COLOR_GRADE,
      durationMs: 800,
      easing: 'ease-in-out',
      faceStyle: DEFAULT_AVATAR_FACE_STYLE,
      pitch: .5,
      positionX: 20,
      positionY: -30,
      screenshot,
      yaw: -.25
    })
    expect(keyframe).not.toHaveProperty('scale')
    expect(keyframe).not.toHaveProperty('thumbnailFrame')
  })

  it('interpolates pose and numeric face values while switching discrete values at the midpoint', () => {
    const from = createAvatarAnimationKeyframe(
      { pitch: 0, positionX: -40, positionY: 10, scale: 1, yaw: -.6 },
      DEFAULT_AVATAR_FACE_STYLE,
      'data:image/png;base64,from'
    )
    const to = createAvatarAnimationKeyframe(
      { pitch: 1, positionX: 80, positionY: -30, scale: 2, yaw: .8 },
      {
        ...DEFAULT_AVATAR_FACE_STYLE,
        eyeShape: 'ellipse',
        leftEyeWidth: 14,
        leftEyeRotation: -20,
        mouthEnabled: true,
        mouthCurve: -45,
        noseEnabled: true,
        noseShape: 'ellipse',
        rightEyeWidth: 52,
        rightEyeRotation: 15,
        width: 52
      },
      'data:image/png;base64,to'
    )

    const beforeMidpoint = interpolateAvatarAnimationKeyframes(from, to, .25)
    const midpoint = interpolateAvatarAnimationKeyframes(from, to, .5)

    expect(beforeMidpoint).toMatchObject({
      pitch: .25,
      positionX: -10,
      positionY: 0,
      screenshot: 'data:image/png;base64,from',
      yaw: -.25
    })
    expect(beforeMidpoint.faceStyle).toMatchObject({
      eyeShape: 'rounded',
      leftEyeWidth: 24.5,
      leftEyeRotation: -5,
      mouthCurve: 22.5,
      mouthEnabled: false,
      noseEnabled: false,
      noseShape: 'inverted-triangle',
      rightEyeRotation: 3.75,
      rightEyeWidth: 34,
      width: 34
    })
    expect(midpoint.faceStyle).toMatchObject({
      eyeShape: 'ellipse',
      mouthEnabled: true,
      noseEnabled: true,
      noseShape: 'ellipse'
    })
    expect(midpoint.screenshot).toBe('data:image/png;base64,to')
  })

  it('defaults missing independent eye tilts from legacy in-memory keyframes', () => {
    const { leftEyeRotation: _left, rightEyeRotation: _right, ...legacyFaceStyle } = DEFAULT_AVATAR_FACE_STYLE
    const base = createAvatarAnimationKeyframe(
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const legacy = { ...base, faceStyle: legacyFaceStyle as typeof DEFAULT_AVATAR_FACE_STYLE }
    const interpolated = interpolateAvatarAnimationKeyframes(legacy, base, .5)

    expect(interpolated.faceStyle.leftEyeRotation).toBe(0)
    expect(interpolated.faceStyle.rightEyeRotation).toBe(0)
  })

  it('resolves built-in presets relative to the current pose and face without scale or appearance state', () => {
    const thinking = AVATAR_ANIMATION_PRESETS.find(preset => preset.id === 'thinking')
    expect(thinking).toBeDefined()
    if (thinking == null) return

    const resolved = resolveAvatarAnimationPreset(
      thinking,
      { pitch: .4, positionX: 18, positionY: -12, scale: 1.9, yaw: -.3 },
      DEFAULT_AVATAR_FACE_STYLE
    )

    expect(AVATAR_ANIMATION_PRESETS).toHaveLength(20)
    expect(resolved.keyframes).toHaveLength(6)
    expect(resolved.keyframes[0]).toMatchObject({ pitch: .4, positionX: 18, positionY: -12, yaw: -.3 })
    expect(resolved.keyframes[1]?.durationMs).toBe(1116)
    expect(resolved.keyframes[1]?.easing).toBe('ease-in-out')
    expect(resolved.keyframes[1]?.pitch).toBeCloseTo(.29)
    expect(resolved.keyframes[1]?.positionX).toBe(21)
    expect(resolved.keyframes[1]?.positionY).toBe(-16)
    expect(resolved.keyframes[1]?.yaw).toBeCloseTo(-.14)
    expect(resolved.keyframes[1]?.faceStyle.leftEyeRotation).toBe(-11)
    expect(resolved.keyframes[1]?.faceStyle.rightEyeRotation).toBe(4)
    expect(resolved.keyframes.every(keyframe => !('scale' in keyframe))).toBe(true)
    expect(resolved.keyframes.every(keyframe => !('screenshot' in keyframe))).toBe(true)
  })

  it('closes only one eye during the wink preset', () => {
    const wink = AVATAR_ANIMATION_PRESETS.find(preset => preset.id === 'wink')
    expect(wink).toBeDefined()
    if (wink == null) return

    const resolved = resolveAvatarAnimationPreset(
      wink,
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const winkFrame = resolved.keyframes[2]

    expect(winkFrame?.faceStyle.leftEyeHeight).toBeLessThanOrEqual(14)
    expect(winkFrame?.faceStyle.rightEyeHeight).toBeGreaterThan(14)
    expect(winkFrame?.faceStyle.mouthEnabled).toBe(true)
  })

  it('keeps the current long-bar eye shape across every built-in animation', () => {
    const sourceFace = { ...DEFAULT_AVATAR_FACE_STYLE, eyeShape: 'rounded' as const }

    for (const preset of AVATAR_ANIMATION_PRESETS) {
      const resolved = resolveAvatarAnimationPreset(
        preset,
        { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
        sourceFace
      )

      expect(
        resolved.keyframes.every(keyframe => keyframe.faceStyle.eyeShape === 'rounded'),
        `${preset.id} should preserve rounded eyes`
      ).toBe(true)
    }
  })

  it('uses wide rounded eyes for alert actions without relying on a mouth', () => {
    const view = { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 }
    for (const id of ['excited', 'surprised'] as const) {
      const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === id)!
      const resolved = resolveAvatarAnimationPreset(preset, view, DEFAULT_AVATAR_FACE_STYLE)
      expect(resolved.keyframes.every(frame => frame.faceStyle.eyeShape === 'rounded')).toBe(true)
      expect(resolved.keyframes.some(frame => frame.faceStyle.height > DEFAULT_AVATAR_FACE_STYLE.height)).toBe(true)
      expect(resolved.keyframes.filter(frame => frame.faceStyle.mouthEnabled).length).toBeLessThan(resolved.keyframes.length)
    }
  })

  it('gives every built-in frame transition timing and returns to the current pose', () => {
    const viewState = { pitch: .2, positionX: 12, positionY: -7, scale: 1.4, yaw: -.3 }

    for (const preset of AVATAR_ANIMATION_PRESETS) {
      const resolved = resolveAvatarAnimationPreset(preset, viewState, DEFAULT_AVATAR_FACE_STYLE)
      expect(resolved.keyframes.every(keyframe => keyframe.durationMs >= 100)).toBe(true)
      expect(resolved.keyframes.every(keyframe => keyframe.easing === 'ease-in-out')).toBe(true)
      expect(resolved.keyframes.every(keyframe => keyframe.offset == null)).toBe(true)
      expect(resolved.keyframes.at(-1)).toMatchObject({
        pitch: viewState.pitch,
        positionX: viewState.positionX,
        positionY: viewState.positionY,
        yaw: viewState.yaw
      })
    }
  })

  it('uses each destination frame timing and easing, including the loop return', () => {
    const base = createAvatarAnimationKeyframe(
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const keyframes = [
      { ...base, durationMs: 300, easing: 'ease-out' as const },
      { ...base, durationMs: 200, easing: 'linear' as const, positionX: 20 },
      { ...base, durationMs: 400, easing: 'ease-in' as const, positionX: 40 }
    ]

    expect(resolveAvatarAnimationTimedSegment(keyframes, 100, 'once')).toMatchObject({
      easing: 'linear',
      fromIndex: 0,
      progress: .5,
      toIndex: 1,
      totalDurationMs: 600
    })
    expect(resolveAvatarAnimationTimedSegment(keyframes, 300, 'once')).toMatchObject({
      easing: 'ease-in',
      fromIndex: 1,
      progress: .25,
      toIndex: 2
    })
    expect(resolveAvatarAnimationTimedSegment(keyframes, 750, 'loop')).toMatchObject({
      easing: 'ease-out',
      fromIndex: 2,
      progress: .5,
      toIndex: 0,
      totalDurationMs: 900
    })
  })

  it('migrates legacy total duration and offsets into frame transition timing', () => {
    const base = createAvatarAnimationKeyframe(
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const legacyFrames = [
      { ...base, durationMs: undefined, easing: undefined, offset: 0 },
      { ...base, durationMs: undefined, easing: undefined, offset: .25 },
      { ...base, durationMs: undefined, easing: undefined, offset: 1 }
    ]
    const normalized = normalizeAvatarAnimationKeyframes(legacyFrames, 2000, 'ease-out')

    expect(normalized.map(frame => frame.durationMs)).toEqual([100, 500, 1500])
    expect(normalized.every(frame => frame.easing === 'ease-out')).toBe(true)
    expect(normalized.every(frame => frame.offset == null)).toBe(true)
  })

  it('keeps legacy shared URLs readable and writes the per-frame payload format', () => {
    const base = createAvatarAnimationKeyframe(
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const { durationMs: _durationMs, easing: _easing, ...legacyBase } = base
    const legacyPayload = JSON.stringify({
      d: 2400,
      e: 'ease-out',
      k: [
        { ...legacyBase, offset: 0 },
        { ...legacyBase, offset: 1, positionX: 40 }
      ],
      l: false,
      n: 'Legacy',
      p: 'loop',
      s: 0,
      v: 1
    })
    const migrated = deserializeSharedAvatarAnimation(legacyPayload)

    expect(migrated?.version).toBe(3)
    expect(migrated?.keyframes.map(frame => frame.durationMs)).toEqual([100, 2400])
    expect(migrated?.keyframes.every(frame => frame.easing === 'ease-out')).toBe(true)
    if (migrated == null) return

    const serialized = serializeSharedAvatarAnimation(migrated)
    expect(JSON.parse(serialized)).toMatchObject({ v: 2 })
    expect(deserializeSharedAvatarAnimation(serialized)).toEqual(migrated)
  })
})
