import { describe, expect, it } from 'vitest'

import {
  deserializeAvatarSurfaceDecals,
  serializeAvatarSurfaceDecals
} from '../src/avatarSurfaceDecals'

describe('avatar surface decal URL state', () => {
  it('round-trips official vector and rounded-triangle decals', () => {
    const encoded = serializeAvatarSurfaceDecals([
      {
        color: '#d97757', height: 34, id: 'claude', label: 'Official Claude Spark', opacity: 100,
        rotation: 0, shape: 'claude-spark', side: 'back', targetPartId: 'head', width: 34, x: 30, y: 48
      },
      {
        color: '#241915', height: 22, id: 'mouth', label: 'Open smile', opacity: 100,
        rotation: 0, shape: 'rounded-triangle', targetPartId: 'head', width: 32, x: 0, y: 49
      },
      {
        color: '#d9b985', height: 28, id: 'left-pleat', label: 'Left pleat', opacity: 60,
        rotation: 20, shape: 'rounded', side: 'left', targetPartId: 'head', width: 5, x: 0, y: -20
      },
      {
        color: '#d9b985', height: 28, id: 'right-pleat', label: 'Right pleat', opacity: 60,
        rotation: -20, shape: 'rounded', side: 'right', targetPartId: 'head', width: 5, x: 0, y: -20
      }
    ])

    expect(deserializeAvatarSurfaceDecals(encoded, ['head']).map(decal => [decal.shape, decal.side]))
      .toEqual([
        ['claude-spark', 'back'],
        ['rounded-triangle', 'front'],
        ['rounded', 'left'],
        ['rounded', 'right']
      ])
  })

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
