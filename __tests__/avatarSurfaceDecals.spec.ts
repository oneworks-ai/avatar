import { describe, expect, it } from 'vitest'

import {
  deserializeAvatarSurfaceDecals,
  serializeAvatarSurfaceDecals
} from '../src/avatarSurfaceDecals'

describe('avatar surface decal URL state', () => {
  it('normalizes blank and unknown multipart targets to the primary body', () => {
    const encoded = serializeAvatarSurfaceDecals([
      {
        color: '#ffffff', height: 24, id: 'known', label: 'Known', opacity: 100,
        rotation: 0, shape: 'ellipse', targetPartId: 'head', width: 36, x: 0, y: 0
      },
      {
        color: '#ffffff', height: 24, id: 'unknown', label: 'Unknown', opacity: 100,
        rotation: 0, shape: 'ellipse', targetPartId: 'missing', width: 36, x: 0, y: 0
      },
      {
        color: '#ffffff', height: 24, id: 'blank', label: 'Blank', opacity: 100,
        rotation: 0, shape: 'ellipse', targetPartId: ' ', width: 36, x: 0, y: 0
      }
    ])

    expect(deserializeAvatarSurfaceDecals(encoded, ['head']).map(decal => decal.targetPartId))
      .toEqual(['head', null, null])
  })
})
