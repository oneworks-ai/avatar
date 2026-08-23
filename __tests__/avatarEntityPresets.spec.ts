import { describe, expect, it } from 'vitest'

import { getAvatarPalette } from '@oneworks/avatar'

import {
  applyAvatarEntityPalette,
  createAvatarEntityParts,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene,
  hasMultipleAvatarEntityMaterials
} from '../src/avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'

describe('built-in entity preset scenes', () => {
  it('gives every built-in entity a distinct complete camera composition', () => {
    const presets = ['cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit', 'bun'] as const
    const scenes = presets.map(preset => {
      const scene = getAvatarEntityPresetScene(preset)
      expect(scene).not.toBeNull()
      expect(scene?.cameraMode).toBe(true)
      expect(scene?.showAvatarShadow).toBe(true)
      expect(scene?.showOutline).toBe(true)
      return scene!
    })

    expect(new Set(scenes.map(scene => scene.cameraBackground)).size).toBe(scenes.length)
    expect(new Set(scenes.map(scene => JSON.stringify(scene.viewState))).size).toBe(scenes.length)
  })

  it('keeps the custom entity on the generic preview scene', () => {
    expect(getAvatarEntityPresetScene('custom')).toBeNull()
  })

  it('restores the authored cat close-up', () => {
    const cat = getAvatarEntityPresetScene('cat')!

    expect(cat.cameraBackground).toBe('#111315')
    expect(cat.interactionMode).toBe('move')
    expect(cat.viewState).toEqual({
      pitch: -.1155,
      positionX: 72.5476,
      positionY: 121.0866,
      roll: -.16,
      scale: 2.3884,
      yaw: -.2538
    })
  })

  it('restores the authored cloud close-up and white material', () => {
    const cloudScene = getAvatarEntityPresetScene('cloud')!
    const cloudParts = createAvatarEntityParts('cloud')

    expect(cloudScene.cameraBackground).toBe('#87bfff')
    expect(cloudScene.interactionMode).toBe('move')
    expect(cloudScene.paletteId).toBe('white')
    expect(cloudScene.viewState).toEqual({
      pitch: -.3425,
      positionX: 100.6977,
      positionY: 112.9753,
      roll: -.12,
      scale: 1.6684,
      yaw: -.1836
    })
    expect(cloudParts.every(part => (
      part.baseColor === '#ffffff' &&
      part.foregroundColor === '#000000' &&
      part.highlightColor === '#ffffff' &&
      part.shadowColor === '#9ca3af'
    ))).toBe(true)
  })

  it('returns independent scene objects', () => {
    const firstDog = getAvatarEntityPresetScene('dog')!
    const secondDog = getAvatarEntityPresetScene('dog')!

    expect(firstDog).not.toBe(secondDog)
    expect(firstDog.avatarShadowStyle).not.toBe(secondDog.avatarShadowStyle)
    expect(firstDog.viewState).not.toBe(secondDog.viewState)
  })

  it('restores the authored Bun avatar as one complete built-in scene', () => {
    const bun = getAvatarEntityPresetScene('bun')!
    const face = getAvatarEntityPresetFaceStyle('bun')!
    const parts = createAvatarEntityParts('bun')

    expect(bun).toMatchObject({
      cameraBackground: '#f7f5ef',
      cameraFrame: 'rounded',
      cameraMode: true,
      gridDensity: 228,
      lightAzimuth: -32,
      lightDistance: 6,
      lightElevation: 46,
      paletteId: 'white',
      showLight: false,
      viewState: {
        pitch: -.0157,
        positionX: -60.6238,
        positionY: 42.0197,
        roll: .1906,
        scale: 2.4,
        yaw: -.0753
      }
    })
    expect(face).toMatchObject({
      eyeHighlight: {
        color: '#ffffff',
        enabled: true,
        offsetX: -20,
        offsetY: -22,
        opacity: 100,
        size: 36
      },
      eyeShape: 'ellipse',
      gap: 36,
      height: 28,
      mouthEnabled: false,
      noseEnabled: false,
      width: 28
    })
    expect(parts).toMatchObject([
      {
        id: 'bun-crown',
        scaleX: .5,
        scaleY: .23,
        scaleZ: .5,
        shape: 'cone'
      },
      {
        face: true,
        id: 'bun-body',
        scaleX: .7,
        scaleY: .5,
        scaleZ: .7,
        shape: 'sphere'
      }
    ])
    expect(bun.surfaceDecals).toHaveLength(6)
    expect(bun.surfaceDecals[0]).toMatchObject({
      id: 'bun-crown-pleats',
      shape: 'radial-pleats',
      targetPartId: 'bun-crown'
    })
    expect(bun.surfaceDecals.at(-1)).toMatchObject({
      id: 'claude-spark-official',
      shape: 'claude-spark',
      side: 'back',
      targetPartId: 'bun-body'
    })

    const secondBun = getAvatarEntityPresetScene('bun')!
    expect(bun.surfaceDecals).not.toBe(secondBun.surfaceDecals)
    expect(bun.surfaceDecals[0]).not.toBe(secondBun.surfaceDecals[0])
    expect(face.eyeHighlight).not.toBe(getAvatarEntityPresetFaceStyle('bun')!.eyeHighlight)
  })

  it('applies a palette to every part of a multipart entity', () => {
    const palette = getAvatarPalette('signal')
    const cloud = createAvatarEntityParts('cloud')
    const recolored = applyAvatarEntityPalette(cloud, palette)

    expect(recolored).toHaveLength(cloud.length)
    expect(recolored.every(part => (
      part.baseColor === palette.background &&
      part.foregroundColor === palette.foreground &&
      part.highlightColor === palette.gradient[0] &&
      part.shadowColor === palette.shadow
    ))).toBe(true)
    expect(recolored[0]).not.toBe(cloud[0])
  })

  it('detects authored material differences before overwriting them', () => {
    const palette = getAvatarPalette('white')
    const cloud = createAvatarEntityParts('cloud')
    const dog = createAvatarEntityParts('dog')
    const rabbit = createAvatarEntityParts('rabbit')
    const recoloredDog = applyAvatarEntityPalette(dog, palette)

    expect(hasMultipleAvatarEntityMaterials(cloud)).toBe(false)
    expect(hasMultipleAvatarEntityMaterials(dog)).toBe(true)
    expect(hasMultipleAvatarEntityMaterials(rabbit)).toBe(false)
    expect(hasMultipleAvatarEntityMaterials(recoloredDog)).toBe(false)
  })

  it('builds the rabbit from tapered rounded ears and a taller rounded head', () => {
    const rabbit = createAvatarEntityParts('rabbit')
    const ears = rabbit.filter(part => !part.face)
    const head = rabbit.find(part => part.face)

    expect(rabbit).toHaveLength(3)
    expect(rabbit.some(part => part.id.startsWith('inner-ear'))).toBe(false)
    expect(ears.every(part => (
      part.shape === 'trapezoid' &&
      part.roundness === 100 &&
      part.topScale === .9
    ))).toBe(true)
    expect(head).toMatchObject({
      roundness: 100,
      scaleX: .72,
      scaleY: .74,
      shape: 'trapezoid',
      topScale: .94
    })
  })

  it('uses the carrot-orange authored rabbit camera scene', () => {
    const rabbit = getAvatarEntityPresetScene('rabbit')!

    expect(rabbit.cameraBackground).toBe('#f08c46')
    expect(rabbit.avatarShadowStyle.color).toBe('#9b451f')
    expect(rabbit.viewState).toEqual({
      pitch: -.2275,
      positionX: 82.7852,
      positionY: 116.8548,
      roll: -.4163,
      scale: 1.8604,
      yaw: .0827
    })
  })

  it('uses the clean large-eye face on the rabbit', () => {
    const rabbit = getAvatarEntityPresetFaceStyle('rabbit')!

    expect(rabbit).toMatchObject({
      gap: 40,
      height: 64,
      leftEyeRotation: 0,
      mouthEnabled: false,
      noseEnabled: false,
      rightEyeRotation: 0,
      width: 28
    })
  })

  it('keeps every built-in entity on the large default eye size', () => {
    const presets = ['cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit'] as const

    for (const preset of presets) {
      expect(getAvatarEntityPresetFaceStyle(preset)).toMatchObject({
        height: DEFAULT_AVATAR_FACE_STYLE.height,
        width: DEFAULT_AVATAR_FACE_STYLE.width
      })
    }
  })
})
