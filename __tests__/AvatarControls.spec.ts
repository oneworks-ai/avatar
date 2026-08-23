// @vitest-environment jsdom

import { getAvatarPalette } from '@oneworks/avatar'
import { act, createElement } from 'react'
import type { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AvatarControls } from '../src/AvatarControls'
import { DEFAULT_AVATAR_FACE_SHADOW_STYLE, DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'
import { AvatarLocaleProvider } from '../src/avatarLocale'
import { createAvatarSurfaceDecal } from '../src/avatarSurfaceDecals'

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})

const createProps = (): ComponentProps<typeof AvatarControls> => ({
  activeTab: 'build',
  avatarOutlineStyle: { color: '#000000', opacity: 80, width: 4 },
  avatarShadowStyle: { color: '#000000', direction: 90, distance: 12, opacity: 20, softness: 24 },
  backgroundStyle: 'solid',
  bodyShape: 'sphere',
  cameraBackground: '#ffffff',
  cameraFrame: 'rounded',
  controlsWidth: 420,
  entityParts: [],
  entityPreset: 'custom',
  faceShadowStyle: DEFAULT_AVATAR_FACE_SHADOW_STYLE,
  faceStyle: DEFAULT_AVATAR_FACE_STYLE,
  frameShadowStyle: { color: '#000000', direction: 90, distance: 12, opacity: 20, softness: 24 },
  gridDensity: 100,
  headerActions: null,
  hiddenPaletteCount: 0,
  lightAzimuth: -35,
  lightDistance: 0,
  lightElevation: 40,
  onAddSurfaceDecal: vi.fn(),
  onAvatarOutlineStyleChange: vi.fn(),
  onAvatarShadowStyleChange: vi.fn(),
  onBackgroundStyleChange: vi.fn(),
  onBodyShapeChange: vi.fn(),
  onCameraBackgroundChange: vi.fn(),
  onCameraFrameChange: vi.fn(),
  onCollapse: vi.fn(),
  onControlsWidthChange: vi.fn(),
  onDeleteSurfaceDecal: vi.fn(),
  onEntityPartChange: vi.fn(),
  onEntityPresetChange: vi.fn(),
  onFaceShadowStyleChange: vi.fn(),
  onFaceStyleChange: vi.fn(),
  onFrameShadowStyleChange: vi.fn(),
  onGridDensityChange: vi.fn(),
  onLightAzimuthChange: vi.fn(),
  onLightDistanceChange: vi.fn(),
  onLightElevationChange: vi.fn(),
  onPaletteChange: vi.fn(),
  onResetFace: vi.fn(),
  onSavedPresetRemove: vi.fn(),
  onSavedPresetSelect: vi.fn(),
  onSelectSurfaceDecal: vi.fn(),
  onShowMorePalettesChange: vi.fn(),
  onSurfaceDecalChange: vi.fn(),
  onTabChange: vi.fn(),
  onToggleAvatarShadow: vi.fn(),
  onToggleFrameShadow: vi.fn(),
  onToggleLight: vi.fn(),
  onToggleOutline: vi.fn(),
  onToggleShadow: vi.fn(),
  savedPresets: [],
  selectedEntityPartId: null,
  selectedPalette: getAvatarPalette('white'),
  selectedSavedPresetId: null,
  selectedSurfaceDecalId: 'left',
  showAvatarShadow: false,
  showFrameShadow: false,
  showLight: false,
  showMorePalettes: false,
  showOutline: false,
  showShadow: false,
  surfaceDecals: [
    { ...createAvatarSurfaceDecal('left', null), label: 'Left blush' },
    { ...createAvatarSurfaceDecal('right', null), label: 'Right blush' }
  ],
  visiblePalettes: [getAvatarPalette('white')]
})

describe('AvatarControls surface decals', () => {
  it('keeps row selection and deletion as independent actions', () => {
    const props = createProps()
    act(() => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(AvatarControls, props)
      ))
    })

    const options = host.querySelectorAll<HTMLButtonElement>('[role="option"]')
    const deleteButtons = host.querySelectorAll<HTMLButtonElement>('.avatar-controls__decal-remove')
    expect(options).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
    expect(deleteButtons[0]?.getAttribute('aria-label')).toBe('Delete decal: Left blush')

    act(() => deleteButtons[0]?.click())
    expect(props.onDeleteSurfaceDecal).toHaveBeenCalledWith('left')
    expect(props.onSelectSurfaceDecal).not.toHaveBeenCalled()

    act(() => options[1]?.click())
    expect(props.onSelectSurfaceDecal).toHaveBeenCalledWith('right')
  })
})
