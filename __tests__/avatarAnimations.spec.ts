import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'
import { createDefaultAvatarDefinition, resolveAvatarAnimationTracks } from '@oneworks/avatar'

import {
  AVATAR_ANIMATION_PRESET_COVER_PROGRESS,
  AVATAR_NOTIFICATION_BLUE,
  AVATAR_ANIMATION_PRESETS,
  applyAvatarAnimationTransformAnchor,
  createAvatarAnimationKeyframe,
  createAvatarAnimationRuntimeClip,
  createAvatarAnimationTransformAnchor,
  deserializeSharedAvatarAnimation,
  easeAvatarAnimationProgress,
  interpolateAvatarAnimationKeyframes,
  normalizeAvatarAnimationKeyframes,
  resolveAvatarAnimationHeadLayout,
  resolveAvatarAnimationPreset,
  resolveAvatarAnimationSegment,
  resolveAvatarAnimationTimedSegment,
  serializeSharedAvatarAnimation,
  shouldConfirmAnimationReplacement
} from '../src/avatarAnimations'
import { DEFAULT_AVATAR_COLOR_GRADE } from '../src/avatarColorGrade'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'
import { createAvatarEntityParts, getAvatarEntityPresetFaceStyle } from '../src/avatarEntityPresets'

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

    expect(AVATAR_ANIMATION_PRESETS).toHaveLength(25)
    expect(resolved.keyframes).toHaveLength(6)
    expect(resolved.keyframes[0]).toMatchObject({ pitch: .4, positionX: 18, positionY: -12, yaw: -.3 })
    expect(resolved.keyframes[1]?.durationMs).toBe(576)
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

  it('assigns every built-in animation a representative cover moment', () => {
    expect(AVATAR_ANIMATION_PRESETS).toHaveLength(25)
    expect(AVATAR_ANIMATION_PRESETS.every(preset => (
      AVATAR_ANIMATION_PRESET_COVER_PROGRESS[preset.id] > 0 &&
      AVATAR_ANIMATION_PRESET_COVER_PROGRESS[preset.id] < 1
    ))).toBe(true)
    expect(new Set(Object.values(AVATAR_ANIMATION_PRESET_COVER_PROGRESS)).size).toBeGreaterThan(12)
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
      if (preset.id === 'bear-alert-morph') {
        expect(resolved.keyframes[1]?.easing).toBe('ease-in')
        expect(resolved.keyframes.slice(2, 5).every(keyframe => keyframe.easing === 'linear')).toBe(true)
      } else if (preset.id === 'bear-loading-morph') {
        expect(resolved.keyframes[1]?.easing).toBe('ease-in')
        expect(resolved.keyframes[2]?.easing).toBe('linear')
      } else if (preset.id === 'bear-notification-morph') {
        expect(resolved.keyframes[1]?.easing).toBe('ease-in')
        expect(resolved.keyframes[2]?.easing).toBe('ease-out')
      } else if (preset.id === 'bear-sleep-morph' || preset.id === 'bear-burst-morph') {
        expect(resolved.keyframes[1]?.easing).toBe('ease-in')
        expect(resolved.keyframes[2]?.easing).toBe('linear')
      } else {
        expect(resolved.keyframes.every(keyframe => keyframe.easing === 'ease-in-out')).toBe(true)
      }
      expect(resolved.keyframes.every(keyframe => keyframe.offset == null)).toBe(true)
      expect(resolved.keyframes.at(-1)).toMatchObject({
        pitch: viewState.pitch,
        positionX: viewState.positionX,
        positionY: viewState.positionY,
        yaw: viewState.yaw
      })
    }
  })

  it('keeps every real bear semantic part addressable through both reversible large morphs', () => {
    const parts = createAvatarEntityParts('bear')
    const face = getAvatarEntityPresetFaceStyle('bear')!
    const view = { pitch: -.07, positionX: -35, positionY: 84, scale: 1.72, yaw: .2 }

    for (const id of ['bear-alert-morph', 'bear-loading-morph'] as const) {
      const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === id)!
      const resolved = resolveAvatarAnimationPreset(preset, view, face, parts)
      const transformedFrames = resolved.keyframes.filter(frame => frame.partTransforms != null)

      expect(preset.requiredEntityPreset).toBeUndefined()
      expect(preset.requiresEntityParts).toBe(true)
      expect(transformedFrames.length).toBe(resolved.keyframes.length)
      expect(transformedFrames.every(frame => (
        Object.keys(frame.partTransforms ?? {}).sort().join(',') === 'ear-left,ear-right,primary'
      ))).toBe(true)
      expect(transformedFrames.every(frame => Object.values(frame.partTransforms ?? {}).every(transform => (
        Object.keys(transform).every(key => ['rotationZ', 'scaleX', 'scaleY', 'x', 'y', 'z'].includes(key))
      )))).toBe(true)
      expect(resolved.keyframes.at(-1)?.partTransforms).toEqual(resolved.keyframes[0]?.partTransforms)
      expect(resolved.keyframes.at(-1)).toMatchObject({
        pitch: view.pitch,
        positionX: view.positionX,
        positionY: view.positionY,
        yaw: view.yaw
      })

      if (id === 'bear-alert-morph') {
        const alertFrames = resolved.keyframes.map(frame => frame.auxiliaryParts?.[0])
        expect(alertFrames.every(item => (
          item?.part.id === 'alert-stem' && item.part.shape === 'teardrop' && item.part.face === false
        ))).toBe(true)
        expect(alertFrames[0]?.opacity).toBe(0)
        expect(alertFrames.at(-1)?.opacity).toBe(0)
        expect(Math.max(...alertFrames.map(item => item?.opacity ?? 0))).toBe(100)
        expect(resolved.keyframes.every(frame => frame.auxiliaryShapes == null)).toBe(true)

        const primaryPart = parts.find(part => part.id === 'primary')!
        const compactFrame = resolved.keyframes.find(frame => (
          frame.auxiliaryParts?.[0]?.transform?.rotationZ === 180 &&
          frame.partShapeMorphs?.primary?.progress === 1 &&
          Math.abs((frame.partTransforms?.primary?.scaleX ?? 0) / primaryPart.scaleX - .17) < .001
        ))!
        const compact = compactFrame.partTransforms!
        const stem = compactFrame.auxiliaryParts![0]!
        expect((compact.primary!.scaleX ?? primaryPart.scaleX) / primaryPart.scaleX).toBeLessThan(.18)
        expect(compact.primary!.x).toBeCloseTo(stem.transform!.x!, 5)
        expect(compact.primary!.y).toBeGreaterThan(stem.transform!.y!)
        expect(compact.primary!.rotationZ).toBeGreaterThanOrEqual(360)
        expect(compact['ear-left']!.x).toBeCloseTo(compact.primary!.x!, 5)
        expect(compact['ear-right']!.x).toBeCloseTo(compact.primary!.x!, 5)
        expect(compact['ear-left']!.scaleX).toBeCloseTo(.01, 5)
        expect(compact['ear-right']!.scaleX).toBeCloseTo(.01, 5)
        expect(stem.transform!.rotationZ).toBe(180)
        expect(compactFrame.partShapeMorphs).toMatchObject({
          'alert-stem': { fromShape: 'sphere', progress: 1, toShape: 'teardrop' },
          primary: { progress: 1, toShape: 'sphere' }
        })
        const wiggleFrames = resolved.keyframes.filter(frame => {
          const rotation = frame.auxiliaryParts?.[0]?.transform?.rotationZ
          return rotation != null && rotation !== 180 && frame.partShapeMorphs?.primary?.progress === 1
        })
        expect(wiggleFrames.map(frame => frame.auxiliaryParts![0]!.transform!.rotationZ)).toEqual([
          189,
          173,
          185,
          177
        ])
        expect(wiggleFrames.every(frame => (
          Math.sign(frame.auxiliaryParts![0]!.transform!.x!) ===
          -Math.sign(frame.partTransforms!.primary!.x!)
        ))).toBe(true)
      } else {
        const loadingFrames = resolved.keyframes.map(frame => frame.auxiliaryParts)
        expect(loadingFrames.every(items => (
          items?.length === 2 &&
          items[0]?.part.id === 'loading-ball-left' &&
          items[1]?.part.id === 'loading-ball-right' &&
          items.every(item => item.part.shape === 'sphere' && item.part.face === false)
        ))).toBe(true)
        expect(loadingFrames[0]?.every(item => item.opacity === 0)).toBe(true)
        expect(loadingFrames.at(-1)?.every(item => item.opacity === 0)).toBe(true)
        expect(Math.max(...loadingFrames.flatMap(items => items?.map(item => item.opacity) ?? []))).toBe(100)
        expect(loadingFrames[1]?.[0]?.transform).toMatchObject({ x: -128, y: 30 })
        expect(loadingFrames[1]?.[1]?.transform).toMatchObject({ x: 128, y: 30 })
        expect(resolved.keyframes.every(frame => frame.auxiliaryShapes == null)).toBe(true)

        const loadingRow = resolved.keyframes.find(frame => (
          frame.partShapeMorphs?.primary?.progress === 1 &&
          frame.auxiliaryParts?.[0]?.transform?.x === -68 &&
          frame.auxiliaryParts?.[1]?.transform?.x === 68
        ))!
        const loadingPrimary = loadingRow.partTransforms!.primary!
        expect(loadingRow.partShapeMorphs).toMatchObject({
          primary: { progress: 1, toShape: 'sphere' }
        })
        expect(loadingRow.partTransforms!['ear-left']!.x).toBeCloseTo(loadingPrimary.x!, 5)
        expect(loadingRow.partTransforms!['ear-right']!.x).toBeCloseTo(loadingPrimary.x!, 5)
        expect(loadingRow.partTransforms!['ear-left']!.scaleX).toBeCloseTo(.01, 5)
        expect(loadingRow.partTransforms!['ear-right']!.scaleX).toBeCloseTo(.01, 5)

        const bounceOrder = resolved.keyframes.flatMap(frame => {
          if (frame.partShapeMorphs?.primary?.progress !== 1) return []
          if (frame.auxiliaryParts?.[0]?.transform?.y === -8) return ['left']
          if (frame.partTransforms?.primary?.y === -8) return ['primary']
          if (frame.auxiliaryParts?.[1]?.transform?.y === -8) return ['right']
          return []
        })
        expect(bounceOrder).toEqual(['left', 'primary', 'right', 'left', 'primary', 'right'])
      }
    }
  })

  it('keeps the two user-approved bear morph frame sequences byte-for-byte frozen', () => {
    const parts = createAvatarEntityParts('bear')
    const face = getAvatarEntityPresetFaceStyle('bear')!
    const view = { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 }
    const expected = {
      'bear-alert-morph': 'f306cd35454c1aa0b88ad8615dd4a8d81f9c04459478792f3d1d43af86d6e071',
      'bear-loading-morph': 'bf78764401d4a6cd3229b7690777290e0d79e93ec47568b27ca1b764a8bf15c4'
    } as const

    for (const [id, fingerprint] of Object.entries(expected)) {
      const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === id)!
      const resolved = resolveAvatarAnimationPreset(preset, view, face, parts)
      const digest = createHash('sha256').update(JSON.stringify(resolved.keyframes)).digest('hex')
      expect(digest, `${id} changed after it was approved`).toBe(fingerprint)
    }
  })

  it('keeps notification, sleep, and burst reversible and outside the persisted bear Definition', () => {
    const parts = createAvatarEntityParts('bear')
    const face = getAvatarEntityPresetFaceStyle('bear')!
    const view = { pitch: .11, positionX: -18, positionY: 26, scale: 1.4, yaw: -.24 }
    const realPartIds = parts.map(part => part.id).sort()

    for (const id of ['bear-notification-morph', 'bear-sleep-morph', 'bear-burst-morph'] as const) {
      const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === id)!
      const resolved = resolveAvatarAnimationPreset(preset, view, face, parts)

      expect(preset.requiredEntityPreset).toBeUndefined()
      expect(preset.requiresEntityParts).toBe(true)
      expect(preset.playbackMode).toBe('once')
      if (id === 'bear-notification-morph') {
        expect(resolved.keyframes.every(frame => frame.partTransforms == null)).toBe(true)
      } else {
        expect(resolved.keyframes.every(frame => (
          Object.keys(frame.partTransforms ?? {}).sort().join(',') === realPartIds.join(',')
        ))).toBe(true)
      }
      expect(resolved.keyframes[0]?.partTransforms).toEqual(resolved.keyframes.at(-1)?.partTransforms)
      expect(resolved.keyframes[0]?.faceStyle).toEqual(resolved.keyframes.at(-1)?.faceStyle)
      expect(resolved.keyframes.at(-1)).toMatchObject({
        pitch: view.pitch,
        positionX: view.positionX,
        positionY: view.positionY,
        yaw: view.yaw
      })
      expect(parts.map(part => part.id)).toEqual(['ear-left', 'ear-right', 'primary'])
    }
  })

  it('renders notification as one pure independent 3D sphere without writing the animal face', () => {
    const parts = createAvatarEntityParts('bear')
    const face = getAvatarEntityPresetFaceStyle('bear')!
    const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === 'bear-notification-morph')!
    const resolved = resolveAvatarAnimationPreset(
      preset,
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      face,
      parts
    )
    const badges = resolved.keyframes.map(frame => frame.auxiliaryParts?.[0])

    expect(badges.every(badge => (
      badge?.part.id === 'notification-orb' &&
      badge.composition === 'independent-depth' &&
      badge.part.baseColor === AVATAR_NOTIFICATION_BLUE &&
      badge.part.shape === 'sphere' &&
      badge.part.face === false &&
      badge.transform?.scaleZ === badge.transform?.scaleX
    ))).toBe(true)
    const centers = badges.map(badge => ({
      x: badge?.transform?.x,
      y: badge?.transform?.y,
      z: badge?.transform?.z
    }))
    expect(new Set(centers.map(center => JSON.stringify(center))).size).toBe(1)
    const layout = resolveAvatarAnimationHeadLayout(parts, { pitch: 0, yaw: 0 })!
    expect(centers[0]).toEqual({
      x: layout.notificationAnchor.x,
      y: layout.notificationAnchor.y,
      z: layout.notificationAnchor.z
    })
    expect(layout.notificationAnchor.gap).toBe(2.5)
    expect(resolved.keyframes.every(frame => frame.auxiliaryShapes == null)).toBe(true)
    expect(badges[0]?.opacity).toBe(0)
    expect(badges.at(-1)?.opacity).toBe(0)
    expect(Math.max(...badges.map(badge => badge?.transform?.scaleX ?? 0))).toBeCloseTo(.165)
    expect(resolved.keyframes.every(frame => JSON.stringify(frame.faceStyle) === JSON.stringify(face))).toBe(true)
    expect(resolved.resourceClaims).toEqual(['aux:notification-orb'])
    expect(resolved.parameterValues).toEqual({
      orbColor: AVATAR_NOTIFICATION_BLUE,
      orbPosition: 'upper-right'
    })

    const base = createDefaultAvatarDefinition()
    const definition = {
      ...base,
      scene: {
        ...base.scene,
        entity: { parts, preset: 'bear' as const },
        effects: {
          ...base.scene.effects,
          colorGrade: { ...base.scene.effects.colorGrade, brightness: .7 }
        },
        face,
        view: { ...base.scene.view, pitch: 0, positionX: 0, positionY: 0, yaw: 0 }
      }
    }
    const clip = createAvatarAnimationRuntimeClip(definition, resolved)
    const runtimeFrame = resolveAvatarAnimationTracks(definition, [{
      clip,
      elapsedMs: Math.round(clip.durationMs * .42),
      trackId: 'notification'
    }])
    expect(runtimeFrame.writes).toEqual(['aux:notification/notification-orb'])
    expect(runtimeFrame.scene.face).toEqual(definition.scene.face)
    expect(runtimeFrame.scene.entity.parts).toEqual(definition.scene.entity.parts)
    expect(runtimeFrame.scene.effects.colorGrade).toEqual(definition.scene.effects.colorGrade)
  })

  it('places notification at the selected head-safe upper corner', () => {
    const parts = createAvatarEntityParts('bear')
    const face = getAvatarEntityPresetFaceStyle('bear')!
    const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === 'bear-notification-morph')!
    const view = { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 }
    const right = resolveAvatarAnimationPreset(preset, view, face, parts, { orbPosition: 'upper-right' })
    const left = resolveAvatarAnimationPreset(preset, view, face, parts, { orbPosition: 'upper-left' })
    const rightLayout = resolveAvatarAnimationHeadLayout(parts, view, 'upper-right')!
    const leftLayout = resolveAvatarAnimationHeadLayout(parts, view, 'upper-left')!
    const rightBadge = right.keyframes[3]!.auxiliaryParts![0]!
    const leftBadge = left.keyframes[3]!.auxiliaryParts![0]!

    expect(rightBadge.transform).toMatchObject({
      x: rightLayout.notificationAnchor.x,
      y: rightLayout.notificationAnchor.y,
      z: rightLayout.notificationAnchor.z
    })
    expect(leftBadge.transform).toMatchObject({
      x: leftLayout.notificationAnchor.x,
      y: leftLayout.notificationAnchor.y,
      z: leftLayout.notificationAnchor.z
    })
    expect(rightLayout.notificationAnchor.projectedX).toBeGreaterThan(rightLayout.headProjectedCenter.x)
    expect(leftLayout.notificationAnchor.projectedX).toBeLessThan(leftLayout.headProjectedCenter.x)
    expect(leftLayout.notificationAnchor.projectedY).toBeCloseTo(rightLayout.notificationAnchor.projectedY)
    expect(left.parameterValues).toMatchObject({ orbPosition: 'upper-left' })
  })

  it('keeps one notification-blue material across species and extreme animal tones', () => {
    const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === 'bear-notification-morph')!
    const variants = [
      { color: '#000000', entityPreset: 'cat' as const },
      { color: '#ffffff', entityPreset: 'owl' as const },
      { color: '#2b160b', entityPreset: 'lion' as const },
      { color: '#fff8e8', entityPreset: 'pig' as const }
    ]
    const materialFingerprints = variants.map(({ color, entityPreset }) => {
      const parts = createAvatarEntityParts(entityPreset).map(part => ({
        ...part,
        baseColor: color,
        foregroundColor: color,
        highlightColor: color,
        shadowColor: color
      }))
      const resolved = resolveAvatarAnimationPreset(
        preset,
        { pitch: .18, positionX: 0, positionY: 0, scale: 1, yaw: -.52 },
        getAvatarEntityPresetFaceStyle(entityPreset)!,
        parts
      )
      const material = resolved.keyframes[3]!.auxiliaryParts![0]!.part
      expect(material.baseColor, entityPreset).toBe(AVATAR_NOTIFICATION_BLUE)
      expect(material.baseColor, entityPreset).not.toBe(color)
      return JSON.stringify({
        baseColor: material.baseColor,
        foregroundColor: material.foregroundColor,
        highlightColor: material.highlightColor,
        shadowColor: material.shadowColor
      })
    })

    expect(new Set(materialFingerprints).size).toBe(1)
  })

  it('derives one head-safe notification anchor and reversible topology morphs across representative animals', () => {
    const fixtures = ['cat', 'owl', 'deer', 'cow', 'lion', 'hedgehog', 'squirrel', 'pig'] as const
    const view = { pitch: -.21, positionX: 31, positionY: -18, scale: 1.35, yaw: .63 }

    for (const entityPreset of fixtures) {
      const parts = createAvatarEntityParts(entityPreset).map((part, index) => index === 0
        ? { ...part, baseColor: '#123456', x: part.x + 3.25, z: part.z - 1.5 }
        : part)
      const before = JSON.stringify(parts)
      const face = getAvatarEntityPresetFaceStyle(entityPreset)!
      const head = parts.find(part => part.face)!
      const headOnlyLayout = resolveAvatarAnimationHeadLayout([head], view)!
      const fullLayout = resolveAvatarAnimationHeadLayout(parts, view)!

      expect(fullLayout.headPartId, entityPreset).toBe(head.id)
      expect(fullLayout.notificationAnchor, entityPreset).toEqual(headOnlyLayout.notificationAnchor)
      expect(fullLayout.notificationScale, entityPreset).toBe(headOnlyLayout.notificationScale)

      for (const id of ['bear-notification-morph', 'bear-sleep-morph', 'bear-burst-morph'] as const) {
        const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === id)!
        const resolved = resolveAvatarAnimationPreset(preset, view, face, parts)
        expect(preset.requiredEntityPreset, `${entityPreset}/${id}`).toBeUndefined()
        expect(preset.requiresEntityParts, `${entityPreset}/${id}`).toBe(true)
        expect(JSON.stringify(parts), `${entityPreset}/${id}`).toBe(before)

        if (id === 'bear-notification-morph') {
          const badges = resolved.keyframes.map(frame => frame.auxiliaryParts?.[0])
          expect(badges.every(item => item?.composition === 'independent-depth')).toBe(true)
          expect(new Set(badges.map(item => JSON.stringify({
            x: item?.transform?.x,
            y: item?.transform?.y,
            z: item?.transform?.z
          }))).size).toBe(1)
          expect(resolved.keyframes.every(frame => frame.partTransforms == null)).toBe(true)
          continue
        }

        const expectedIds = parts.map(part => part.id).sort()
        expect(resolved.keyframes.every(frame => (
          Object.keys(frame.partTransforms ?? {}).sort().join(',') === expectedIds.join(',')
        )), `${entityPreset}/${id}`).toBe(true)
        expect(resolved.keyframes[0]?.partTransforms).toEqual(resolved.keyframes.at(-1)?.partTransforms)
        expect(resolved.keyframes[0]?.partShapeMorphs).toEqual({
          [head.id]: { fromShape: head.shape, progress: 0, toShape: 'sphere' }
        })
        expect(resolved.keyframes.at(-1)?.partShapeMorphs).toEqual(resolved.keyframes[0]?.partShapeMorphs)
        expect(Object.values(resolved.keyframes.flatMap(frame => Object.values(frame.partTransforms ?? {})))
          .every(transform => Object.values(transform).every(value => Number.isFinite(value)))).toBe(true)
      }
    }
  })

  it('adapts exclamation and three-ball loading to every representative animal topology', () => {
    const fixtures = ['cat', 'owl', 'deer', 'cow', 'lion', 'hedgehog', 'squirrel', 'pig'] as const
    const view = { pitch: -.19, positionX: 24, positionY: -11, scale: 1.28, yaw: .57 }

    for (const entityPreset of fixtures) {
      const parts = createAvatarEntityParts(entityPreset)
      const before = JSON.stringify(parts)
      const face = getAvatarEntityPresetFaceStyle(entityPreset)!
      const head = parts.find(part => part.face)!
      const expectedIds = parts.map(part => part.id).sort()

      for (const id of ['bear-alert-morph', 'bear-loading-morph'] as const) {
        const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === id)!
        const resolved = resolveAvatarAnimationPreset(preset, view, face, parts)
        const fullyMorphed = resolved.keyframes.filter(frame => frame.partShapeMorphs?.[head.id]?.progress === 1)

        expect(preset.requiredEntityPreset, `${entityPreset}/${id}`).toBeUndefined()
        expect(preset.requiresEntityParts, `${entityPreset}/${id}`).toBe(true)
        expect(JSON.stringify(parts), `${entityPreset}/${id}`).toBe(before)
        expect(resolved.keyframes.every(frame => (
          Object.keys(frame.partTransforms ?? {}).sort().join(',') === expectedIds.join(',')
        )), `${entityPreset}/${id}`).toBe(true)
        expect(resolved.keyframes[0]?.partTransforms).toEqual(resolved.keyframes.at(-1)?.partTransforms)
        expect(resolved.keyframes[0]?.partShapeMorphs?.[head.id]).toEqual({
          fromShape: head.shape,
          progress: 0,
          toShape: 'sphere'
        })
        expect(resolved.keyframes.at(-1)?.partShapeMorphs?.[head.id])
          .toEqual(resolved.keyframes[0]?.partShapeMorphs?.[head.id])
        expect(fullyMorphed.length, `${entityPreset}/${id}`).toBeGreaterThan(2)
        expect(fullyMorphed.every(frame => parts.filter(part => part.id !== head.id).every(part => (
          (frame.partTransforms?.[part.id]?.scaleX ?? 1) <= .011 &&
          (frame.partTransforms?.[part.id]?.scaleY ?? 1) <= .011
        ))), `${entityPreset}/${id}`).toBe(true)
        expect(Object.values(resolved.keyframes.flatMap(frame => [
          ...Object.values(frame.partTransforms ?? {}),
          ...(frame.auxiliaryParts ?? []).map(item => item.transform ?? {})
        ])).flatMap(transform => Object.values(transform)).every(value => Number.isFinite(value))).toBe(true)

        if (id === 'bear-alert-morph') {
          const stems = resolved.keyframes.map(frame => frame.auxiliaryParts?.[0])
          expect(stems.every(stem => (
            stem?.part.id === 'alert-stem' &&
            stem.part.shape === 'teardrop' &&
            stem.part.face === false &&
            stem.composition === 'independent-depth' &&
            stem.part.baseColor === head.baseColor
          )), entityPreset).toBe(true)
          expect(stems[0]?.opacity).toBe(0)
          expect(stems.at(-1)?.opacity).toBe(0)
          expect(Math.max(...stems.map(stem => stem?.opacity ?? 0))).toBe(100)
          expect(resolved.keyframes.some(frame => frame.partShapeMorphs?.['alert-stem']?.progress === 1)).toBe(true)
          continue
        }

        const loadingBalls = resolved.keyframes.map(frame => frame.auxiliaryParts ?? [])
        expect(loadingBalls.every(items => (
          items.length === 2 &&
          items[0]?.part.id === 'loading-ball-left' &&
          items[1]?.part.id === 'loading-ball-right' &&
          items.every(item => (
            item.composition === 'independent-depth' &&
            item.part.shape === 'sphere' &&
            item.part.face === false &&
            item.part.baseColor === head.baseColor &&
            item.transform?.scaleX === item.transform?.scaleY &&
            item.transform?.scaleY === item.transform?.scaleZ
          ))
        )), entityPreset).toBe(true)
        expect(loadingBalls[0]?.every(item => item.opacity === 0)).toBe(true)
        expect(loadingBalls.at(-1)?.every(item => item.opacity === 0)).toBe(true)
        expect(Math.max(...loadingBalls.flatMap(items => items.map(item => item.opacity ?? 0)))).toBe(100)
      }
    }
  })

  it('gathers every real bear part into one breathing sleep ball and unfolds exactly', () => {
    const parts = createAvatarEntityParts('bear')
    const face = getAvatarEntityPresetFaceStyle('bear')!
    const primary = parts.find(part => part.id === 'primary')!
    const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === 'bear-sleep-morph')!
    const resolved = resolveAvatarAnimationPreset(
      preset,
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      face,
      parts
    )
    const ballFrames = resolved.keyframes.filter(frame => frame.partShapeMorphs?.primary?.progress === 1)

    expect(resolved.keyframes.every(frame => frame.auxiliaryParts == null && frame.auxiliaryShapes == null)).toBe(true)
    expect(ballFrames.length).toBeGreaterThanOrEqual(4)
    expect(new Set(ballFrames.map(frame => frame.partTransforms?.primary?.y)).size).toBeGreaterThan(1)
    expect(ballFrames.every(frame => {
      const transform = frame.partTransforms?.primary
      const projectedDepth = (transform?.scaleZ ?? 0) * (transform?.scaleX ?? 0) / primary.scaleX
      return (
        Math.abs((transform?.scaleX ?? 0) - (transform?.scaleY ?? 0)) < 1e-10 &&
        Math.abs(projectedDepth - (transform?.scaleX ?? 0)) < 1e-10
      )
    })).toBe(true)
    expect(ballFrames.every(frame => (
      frame.partTransforms?.['ear-left']?.x === frame.partTransforms?.primary?.x &&
      frame.partTransforms?.['ear-right']?.x === frame.partTransforms?.primary?.x &&
      (frame.partTransforms?.['ear-left']?.scaleX ?? 1) < .011 &&
      (frame.partTransforms?.['ear-right']?.scaleX ?? 1) < .011
    ))).toBe(true)
  })

  it('spirals three distant sphere particles inward around one compact core over a readable sequence', () => {
    const parts = createAvatarEntityParts('bear')
    const face = getAvatarEntityPresetFaceStyle('bear')!
    const primary = parts.find(part => part.id === 'primary')!
    const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === 'bear-burst-morph')!
    const resolved = resolveAvatarAnimationPreset(
      preset,
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      face,
      parts
    )
    const orbitFrames = resolved.keyframes.filter(frame => frame.auxiliaryParts?.every(item => (item.opacity ?? 0) >= 78))
    const particles = orbitFrames[0]!.auxiliaryParts!
    const center = { x: primary.x, y: primary.y + 10 }
    const averageRadius = (frame: typeof resolved.keyframes[number]) => (
      frame.auxiliaryParts!.reduce((sum, item) => sum + Math.hypot(
        (item.transform?.x ?? center.x) - center.x,
        (item.transform?.y ?? center.y) - center.y
      ), 0) / frame.auxiliaryParts!.length
    )

    expect(preset.durationMs).toBe(3200)
    expect(preset.playbackMode).toBe('once')
    expect(orbitFrames.length).toBeGreaterThanOrEqual(4)
    expect(particles.map(item => item.part.id)).toEqual([
      'burst-particle-upper-left',
      'burst-particle-upper-right',
      'burst-particle-lower'
    ])
    expect(particles.every(item => item.part.shape === 'sphere' && item.part.face === false)).toBe(true)
    expect(new Set(particles.map(item => item.transform?.scaleX)).size).toBe(3)
    expect(averageRadius(orbitFrames[0]!)).toBeGreaterThan(averageRadius(orbitFrames.at(-1)!))
    expect(orbitFrames.every(frame => frame.partShapeMorphs?.primary?.progress === 1)).toBe(true)
    expect(orbitFrames.every(frame => {
      const transform = frame.partTransforms?.primary
      const projectedDepth = (transform?.scaleZ ?? 0) * (transform?.scaleX ?? 0) / primary.scaleX
      return (
        Math.abs((transform?.scaleX ?? 0) - (transform?.scaleY ?? 0)) < 1e-10 &&
        Math.abs(projectedDepth - (transform?.scaleX ?? 0)) < 1e-10
      )
    })).toBe(true)
    const firstVisible = resolved.keyframes.find(frame => frame.auxiliaryParts?.some(item => (item.opacity ?? 0) > 0))!
    expect(firstVisible.auxiliaryParts?.every(item => (item.opacity ?? 0) <= 25)).toBe(true)
    expect(averageRadius(firstVisible)).toBeGreaterThan(100)
    const visibleAngles = resolved.keyframes
      .filter(frame => frame.auxiliaryParts?.some(item => (item.opacity ?? 0) > 0))
      .map(frame => {
        const particle = frame.auxiliaryParts![0]!
        return Math.atan2(
          ((particle.transform?.y ?? center.y) - center.y) / .72,
          (particle.transform?.x ?? center.x) - center.x
        )
      })
    const unwrappedAngles = visibleAngles.reduce<number[]>((angles, angle) => {
      const previous = angles.at(-1)
      if (previous == null) return [angle]
      let next = angle
      while (next < previous) next += Math.PI * 2
      return [...angles, next]
    }, [])
    expect(unwrappedAngles.at(-1)! - unwrappedAngles[0]!).toBeCloseTo(Math.PI * 2, 1)
    expect(resolved.keyframes[0]?.auxiliaryParts?.every(item => item.opacity === 0)).toBe(true)
    expect(resolved.keyframes.at(-1)?.auxiliaryParts?.every(item => item.opacity === 0)).toBe(true)
  })

  it('declares timeline playback defaults per animation asset', () => {
    expect(AVATAR_ANIMATION_PRESETS.every(preset => preset.playbackMode === 'once')).toBe(true)
    expect(AVATAR_ANIMATION_PRESETS.every(preset => preset.defaultTimelineIterations == null)).toBe(true)
    expect(AVATAR_ANIMATION_PRESETS.every(preset => preset.durationMs === 3200)).toBe(true)
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

  it('round-trips ordered track parameters without writing them into avatar keyframes', () => {
    const base = createAvatarAnimationKeyframe(
      { pitch: 0, positionX: 0, positionY: 0, scale: 1, yaw: 0 },
      DEFAULT_AVATAR_FACE_STYLE
    )
    const animation = {
      createdAt: 0,
      id: 'stacked',
      keyframes: [base, { ...base, yaw: .1 }],
      lockStartPosition: false,
      name: 'Stacked notification',
      playbackMode: 'loop' as const,
      startFrameIndex: 0,
      tracks: [{
        muted: false,
        parameterValues: { orbColor: '#ff3366', orbPosition: 'upper-left' },
        presetId: 'bear-notification-morph' as const,
        solo: false,
        speed: 1.5,
        trackId: 'notification-track',
        weight: .8
      }],
      version: 3 as const
    }

    const serialized = serializeSharedAvatarAnimation(animation)
    expect(JSON.parse(serialized).t).toEqual(animation.tracks)
    expect(deserializeSharedAvatarAnimation(serialized)).toEqual({
      ...animation,
      id: 'shared',
      tracks: animation.tracks
    })
    expect(JSON.stringify(animation.keyframes)).not.toContain('orbColor')
    const invalid = JSON.parse(serialized)
    invalid.t[0].parameterValues.orbColor = 'red'
    expect(deserializeSharedAvatarAnimation(JSON.stringify(invalid))).toBeNull()
  })
})
