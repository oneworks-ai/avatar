import { describe, expect, it } from 'vitest'

import {
  anchorAvatarAnimationClip,
  applyAvatarScenePatch,
  createDefaultAvatarDefinition,
  mergeAvatarAnimationLibraries,
  parseAvatarDefinition,
  resolveAvatarAnimationClip,
  resolveAvatarAnimationFrame,
  serializeAvatarDefinition
} from '../src'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary
} from '../src'

const nod: AvatarAnimationClip = {
  anchor: 'relative',
  durationMs: 1000,
  keyframes: [
    { atMs: 0, patch: { view: { pitch: 0, yaw: 0 } } },
    { atMs: 1000, easing: 'linear', patch: { view: { pitch: .4, yaw: .6 } } }
  ],
  playback: 'once'
}

const supportLibrary: AvatarAnimationLibrary = {
  groups: {
    attention: {
      clips: { nod },
      defaultClip: 'nod'
    }
  },
  id: 'support'
}

describe('OneWorks Avatar public runtime contract', () => {
  it('round-trips a versioned definition', () => {
    const definition = createDefaultAvatarDefinition()
    expect(parseAvatarDefinition(serializeAvatarDefinition(definition))).toEqual(definition)
    expect(() => parseAvatarDefinition({ ...definition, version: 2 })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({
      ...definition,
      scene: { ...definition.scene, face: { ...definition.scene.face, width: undefined } }
    })).toThrow(TypeError)
    expect(() => parseAvatarDefinition({
      ...definition,
      animations: {
        groups: { broken: { clips: { nope: { durationMs: 'fast' } } } },
        id: 'broken'
      }
    })).toThrow(TypeError)
  })

  it('resolves custom animation groups with deterministic library precedence', () => {
    const replacement = {
      ...supportLibrary,
      groups: {
        attention: {
          clips: { wave: { ...nod, label: 'Wave' } },
          defaultClip: 'wave'
        }
      }
    }
    const libraries = mergeAvatarAnimationLibraries([supportLibrary, replacement])
    expect(libraries).toHaveLength(1)
    expect(resolveAvatarAnimationClip(libraries, {
      clipId: 'wave',
      groupId: 'attention',
      libraryId: 'support'
    })?.label).toBe('Wave')
  })

  it('anchors relative motion to the consumer definition and interpolates it', () => {
    const definition = applyAvatarScenePatch(createDefaultAvatarDefinition().scene, {
      view: { pitch: .2, positionX: 12, positionY: -8, yaw: -.3 }
    })
    const source = { ...createDefaultAvatarDefinition(), scene: definition }
    const anchored = anchorAvatarAnimationClip(source, nod)
    const middle = resolveAvatarAnimationFrame(source, anchored, 500)
    expect(middle.scene.view.pitch).toBeCloseTo(.4)
    expect(middle.scene.view.yaw).toBeCloseTo(0)
    expect(middle.scene.view.positionX).toBe(12)
    expect(middle.finished).toBe(false)
    expect(resolveAvatarAnimationFrame(source, anchored, 1000).finished).toBe(true)
  })
})
