import { describe, expect, it } from 'vitest'

import { getAvatarPalette } from '@oneworks/avatar'

import {
  applyAvatarEntityPalette,
  createAvatarEntityParts,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene,
  hasMultipleAvatarEntityMaterials
} from '../src/avatarEntityPresets'

describe('built-in entity preset scenes', () => {
  it('gives every built-in entity a distinct complete camera composition', () => {
    const presets = ['cloud', 'sun', 'cat', 'dog', 'bear', 'rabbit'] as const
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

  it('uses the dog nose without a mouth on the rabbit', () => {
    const dog = getAvatarEntityPresetFaceStyle('dog')!
    const rabbit = getAvatarEntityPresetFaceStyle('rabbit')!

    expect(rabbit).toMatchObject({
      mouthEnabled: false,
      noseEnabled: true,
      noseHeight: dog.noseHeight,
      noseShape: dog.noseShape,
      noseWidth: dog.noseWidth,
      noseY: 35
    })
  })
})
