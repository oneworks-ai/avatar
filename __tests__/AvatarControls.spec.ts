// @vitest-environment jsdom

import { DEFAULT_AVATAR_COAT_PATTERN, DEFAULT_AVATAR_PIXEL_EFFECT, getAvatarPalette } from '@oneworks/avatar'
import { act, createElement } from 'react'
import type { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AvatarControls } from '../src/AvatarControls'
import { resolveAvatarBreedPalette } from '../src/avatarBreedTone'
import { AVATAR_BUILT_IN_ENTITY_PRESETS, createAvatarEntityParts } from '../src/avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_SHADOW_STYLE, DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'
import { AvatarLocaleProvider } from '../src/avatarLocale'
import { AVATAR_ANIMAL_SPECIES_IDS } from '../src/avatarSeed'
import { getAvatarAnimalBreedTemplates, resolveAvatarAnimalBreedTemplate } from '../src/avatarSpeciesBreeds'
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
  vi.unstubAllGlobals()
})

const createProps = (): ComponentProps<typeof AvatarControls> => ({
  activeTab: 'build',
  avatarOutlineStyle: { color: '#000000', opacity: 80, width: 4 },
  avatarShadowStyle: { color: '#000000', direction: 90, distance: 12, opacity: 20, softness: 24 },
  backgroundStyle: 'solid',
  bodyShape: 'sphere',
  bodyBottomTaper: 0,
  bearBreedTemplateId: null,
  bearEarHeight: 100,
  bearEarWidth: 100,
  bearHeadHeight: 100,
  bearHeadWidth: 100,
  cameraBackground: '#ffffff',
  cameraFrame: 'rounded',
  catBreedTemplateId: null,
  catEarHeight: 100,
  catEarWidth: 100,
  coatPattern: DEFAULT_AVATAR_COAT_PATTERN,
  controlsWidth: 420,
  entityGroups: [],
  entityParts: [],
  entityPreset: 'custom',
  dogBreedTemplateId: null,
  dogEarHeight: 100,
  dogEarWidth: 100,
  dogHeadHeight: 100,
  dogHeadWidth: 100,
  rabbitBreedTemplateId: null,
  rabbitEarHeight: 100,
  rabbitEarWidth: 100,
  rabbitHeadHeight: 100,
  rabbitHeadWidth: 100,
  faceShadowStyle: DEFAULT_AVATAR_FACE_SHADOW_STYLE,
  faceStyle: DEFAULT_AVATAR_FACE_STYLE,
  frameShadowStyle: { color: '#000000', direction: 90, distance: 12, opacity: 20, softness: 24 },
  gridDensity: 100,
  headerActions: null,
  hiddenPaletteCount: 0,
  lightAzimuth: -35,
  lightDistance: 0,
  lightElevation: 40,
  leftControlsWidth: 300,
  onAddSurfaceDecal: vi.fn(),
  onAvatarOutlineStyleChange: vi.fn(),
  onAvatarShadowStyleChange: vi.fn(),
  onBackgroundStyleChange: vi.fn(),
  onBodyBottomTaperChange: vi.fn(),
  onBearBreedTemplateChange: vi.fn(),
  onBearEarHeightChange: vi.fn(),
  onBearEarWidthChange: vi.fn(),
  onBearHeadHeightChange: vi.fn(),
  onBearHeadWidthChange: vi.fn(),
  onBodyShapeChange: vi.fn(),
  onCameraBackgroundChange: vi.fn(),
  onCameraFrameChange: vi.fn(),
  onCatBreedTemplateChange: vi.fn(),
  onCatEarHeightChange: vi.fn(),
  onCatEarWidthChange: vi.fn(),
  onDogBreedTemplateChange: vi.fn(),
  onDogEarHeightChange: vi.fn(),
  onDogEarWidthChange: vi.fn(),
  onDogHeadHeightChange: vi.fn(),
  onDogHeadWidthChange: vi.fn(),
  onRabbitBreedTemplateChange: vi.fn(),
  onRabbitEarHeightChange: vi.fn(),
  onRabbitEarWidthChange: vi.fn(),
  onRabbitHeadHeightChange: vi.fn(),
  onRabbitHeadWidthChange: vi.fn(),
  onCoatPatternChange: vi.fn(),
  onConvertCoatPatternToDecals: vi.fn(),
  onCollapseLeft: vi.fn(),
  onCollapseRight: vi.fn(),
  onControlsWidthChange: vi.fn(),
  onLeftControlsWidthChange: vi.fn(),
  onDeleteSurfaceDecal: vi.fn(),
  onEntityPartChange: vi.fn(),
  onEntityPartAdd: vi.fn(),
  onEntityPartDelete: vi.fn(),
  onEntityGroupAdd: vi.fn(),
  onEntityGroupChange: vi.fn(),
  onEntityGroupDelete: vi.fn(),
  onSelectEntityPart: vi.fn(),
  onEntityPresetChange: vi.fn(),
  onFaceShadowStyleChange: vi.fn(),
  onFaceStyleChange: vi.fn(),
  onFrameShadowStyleChange: vi.fn(),
  onGridDensityChange: vi.fn(),
  onLightAzimuthChange: vi.fn(),
  onLightDistanceChange: vi.fn(),
  onLightElevationChange: vi.fn(),
  onPaletteChange: vi.fn(),
  onPixelEffectChange: vi.fn(),
  onRandomSeed: vi.fn(),
  onResetFace: vi.fn(),
  onSavedPresetRemove: vi.fn(),
  onSavedPresetSelect: vi.fn(),
  onSeedChange: vi.fn(),
  onSeedFieldToggle: vi.fn(),
  onSelectSurfaceDecal: vi.fn(),
  onShowMorePalettesChange: vi.fn(),
  onSurfaceDecalChange: vi.fn(),
  onTabChange: vi.fn(),
  onToggleAvatarShadow: vi.fn(),
  onToggleFrameShadow: vi.fn(),
  onToggleLight: vi.fn(),
  onToggleOutline: vi.fn(),
  onToggleShadow: vi.fn(),
  onToggleCoatPattern: vi.fn(),
  savedPresets: [],
  seed: 'v1-test',
  seededFields: [],
  selectedEntityPartId: null,
  selectedPalette: getAvatarPalette('white'),
  pixelEffect: DEFAULT_AVATAR_PIXEL_EFFECT,
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

const openBuildAdvanced = () => {
  const openDetail = host.querySelector<HTMLElement>('#avatar-controls-build-detail-parameters')
  if (openDetail != null) return openDetail
  const trigger = host.querySelector<HTMLButtonElement>(
    '[aria-controls="avatar-controls-build-detail-parameters"]'
  )
  act(() => trigger?.click())
  return host.querySelector<HTMLElement>('#avatar-controls-build-detail-parameters')
}

const openSeedDetail = () => {
  const openDetail = host.querySelector<HTMLElement>('#avatar-controls-build-detail-seed')
  if (openDetail != null) return openDetail
  const trigger = host.querySelector<HTMLButtonElement>(
    '[aria-controls="avatar-controls-build-detail-seed"]'
  )
  act(() => trigger?.click())
  return host.querySelector<HTMLElement>('#avatar-controls-build-detail-seed')
}

const openCoatPatternDetail = () => {
  const openDetail = host.querySelector<HTMLElement>('#avatar-controls-build-detail-coat-pattern')
  if (openDetail != null) return openDetail
  const trigger = host.querySelector<HTMLButtonElement>(
    '[aria-controls="avatar-controls-build-detail-coat-pattern"]'
  )
  act(() => trigger?.click())
  return host.querySelector<HTMLElement>('#avatar-controls-build-detail-coat-pattern')
}

const openFaceDetail = () => {
  const openDetail = host.querySelector<HTMLElement>('#avatar-controls-build-detail-face')
  if (openDetail != null) return openDetail
  const trigger = host.querySelector<HTMLButtonElement>(
    '[aria-controls="avatar-controls-build-detail-face"]'
  )
  act(() => trigger?.click())
  return host.querySelector<HTMLElement>('#avatar-controls-build-detail-face')
}

const openEffectsDetail = (page: 'avatar-outline' | 'avatar-shadow' | 'face-shadow' | 'frame-shadow' | 'light' | 'pixel') => {
  const id = `avatar-controls-effects-detail-${page}`
  const openDetail = host.querySelector<HTMLElement>(`#${id}`)
  if (openDetail != null) return openDetail
  const trigger = host.querySelector<HTMLButtonElement>(`[aria-controls="${id}"]`)
  act(() => trigger?.click())
  return host.querySelector<HTMLElement>(`#${id}`)
}

describe('AvatarControls Seed authoring', () => {
  it('separates resource selection from detail settings', () => {
    const props = { ...createProps(), activeTab: 'style' as const }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const resourceTabs = host.querySelector('[role="tablist"][aria-label="Avatar resources"]') as HTMLElement
    const detailTabs = host.querySelector('[role="tablist"][aria-label="Avatar details"]') as HTMLElement
    const leftTabs = resourceTabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    const rightTabs = detailTabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    expect([...leftTabs].map(tab => tab.getAttribute('aria-label'))).toEqual([
      'Build', 'Animation', 'Body'
    ])
    expect([...rightTabs].map(tab => tab.getAttribute('aria-label'))).toEqual([
      'Body', 'Style', 'Effects', 'Animation'
    ])
    expect(resourceTabs.style.getPropertyValue('--avatar-control-tab-count')).toBe('3')
    expect(detailTabs.style.getPropertyValue('--avatar-control-tab-count')).toBe('4')
    expect(rightTabs[1]?.getAttribute('aria-selected')).toBe('true')
    expect(host.querySelector('[role="tab"][aria-label="Surface decals"]')).toBeNull()
    expect(host.querySelector('#avatar-controls-right-panel-style [aria-label="Surface decals"]')).not.toBeNull()
    act(() => leftTabs[1]?.click())
    expect(leftTabs[1]?.getAttribute('aria-selected')).toBe('true')
    act(() => rightTabs[2]?.click())
    expect(props.onTabChange).toHaveBeenCalledWith('effects')
    expect(leftTabs[1]?.getAttribute('aria-selected')).toBe('true')

    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, { ...props, activeTab: 'animation' })
    )))
    expect(leftTabs[1]?.getAttribute('aria-selected')).toBe('true')
    expect(rightTabs[3]?.getAttribute('aria-selected')).toBe('true')
  })

  it('uses a shape node tree on the left and edits the selected leaf on the right', () => {
    const props = {
      ...createProps(),
      activeTab: 'body' as const,
      entityParts: createAvatarEntityParts('fox'),
      entityPreset: 'fox' as const
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const tree = host.querySelector<HTMLElement>('[role="tree"][aria-label="Shape node tree"]')
    const leaf = tree?.querySelector<HTMLButtonElement>('.avatar-controls__node-tree-row--part [role="treeitem"]')
    expect(tree).not.toBeNull()
    expect(tree?.querySelector('.avatar-controls__node-tree-row--root')?.getAttribute('data-selected')).toBe('true')
    expect(host.querySelector('#avatar-controls-left-panel-body .avatar-controls__parameter-controls')).toBeNull()

    act(() => leaf?.click())
    expect(props.onSelectEntityPart).toHaveBeenCalled()
    expect(host.querySelector('#avatar-controls-right-panel-body [aria-label="Shape name"]')).not.toBeNull()
    expect(host.querySelector('#avatar-controls-right-panel-body [aria-label="Shape type"]')).not.toBeNull()

    act(() => tree?.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      clientX: 80,
      clientY: 120
    })))
    const newShape = document.querySelector<HTMLButtonElement>('[role="menuitem"]')
    expect(newShape?.textContent).toBe('New shape')
    act(() => newShape?.click())
    expect(props.onEntityPartAdd).toHaveBeenCalledWith(expect.objectContaining({ shape: 'sphere' }))
  })

  it('keeps each sidebar collapse and resize control independent', () => {
    const props = createProps()
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const leftCollapse = host.querySelector<HTMLButtonElement>('[aria-label="Hide resources sidebar"]')
    const rightCollapse = host.querySelector<HTMLButtonElement>('[aria-label="Hide controls sidebar"]')
    act(() => leftCollapse?.click())
    expect(props.onCollapseLeft).toHaveBeenCalledTimes(1)
    expect(props.onCollapseRight).not.toHaveBeenCalled()
    act(() => rightCollapse?.click())
    expect(props.onCollapseRight).toHaveBeenCalledTimes(1)

    const leftResize = host.querySelector<HTMLElement>('[aria-label="Resize avatar resources"]')
    const rightResize = host.querySelector<HTMLElement>('[aria-label="Resize avatar controls"]')
    act(() => leftResize?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })))
    expect(props.onLeftControlsWidthChange).toHaveBeenCalledWith(316)
    expect(props.onControlsWidthChange).not.toHaveBeenCalled()
    act(() => rightResize?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' })))
    expect(props.onControlsWidthChange).toHaveBeenCalledWith(436)
  })

  it('exposes reusable bottom taper for standalone ellipses and ellipse entity parts only', () => {
    const customProps = { ...createProps(), activeTab: 'body' as const, bodyShape: 'ellipse' as const, bodyBottomTaper: 43 }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, customProps)
    )))

    const standalone = host.querySelector<HTMLInputElement>('[aria-label="Body bottom taper"]')
    expect(standalone?.value).toBe('43')
    expect(standalone?.min).toBe('0')
    expect(standalone?.max).toBe('100')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(standalone, '59')
      standalone?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(customProps.onBodyBottomTaperChange).toHaveBeenCalledWith(59)

    const foxProps = {
      ...createProps(), activeTab: 'body' as const, entityParts: createAvatarEntityParts('fox'),
      entityPreset: 'fox' as const, selectedEntityPartId: 'fox-head'
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, foxProps)
    )))
    const head = host.querySelector<HTMLInputElement>('[aria-label="Part bottom taper"]')
    expect(head?.value).toBe('52')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(head, '84')
      head?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(foxProps.onEntityPartChange).toHaveBeenCalledWith('fox-head', { bottomTaper: 84 })

    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, { ...foxProps, selectedEntityPartId: 'fox-ear-left' })
    )))
    expect(host.querySelector('[aria-label="Part bottom taper"]')).toBeNull()
  })

  it('keeps expanded face presets discoverable through the accessible more control', () => {
    const props = createProps()
    act(() => root.render(createElement(AvatarLocaleProvider, { initialLocale: 'en', persist: false }, createElement(AvatarControls, props))))
    const more = host.querySelector<HTMLButtonElement>('[aria-label="More presets"]')
    expect(more).not.toBeNull()
    expect(more?.querySelector('svg')).not.toBeNull()
  })

  it('opens the avatar template detail page before cold previews finish and reuses ready previews', () => {
    const idleCallbacks: Array<() => void> = []
    const frameCallbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestIdleCallback', vi.fn((callback: () => void) => {
      idleCallbacks.push(callback)
      return idleCallbacks.length
    }))
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const props = { ...createProps(), lightAzimuth: 13.37, lightElevation: 22.41 }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))
    act(() => frameCallbacks.splice(0).forEach(callback => callback(0)))

    const avatarTypes = host.querySelector<HTMLElement>('[aria-label="Avatar type"]')
    act(() => avatarTypes?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    const browser = host.querySelector<HTMLElement>('[aria-label="Avatar templates"]')
    const beforeReady = browser?.querySelectorAll('[data-preview-ready="true"]').length ?? 0
    const beforePending = browser?.querySelectorAll('[data-preview-ready="false"]').length ?? 0
    expect(browser).not.toBeNull()
    expect(host.querySelector('[role="dialog"]')).toBeNull()
    expect(host.querySelector('#avatar-controls-build-detail-presets')).not.toBeNull()
    expect(beforeReady).toBeGreaterThan(0)
    expect(beforePending).toBeGreaterThan(0)
    expect(idleCallbacks).toHaveLength(1)
    const reusedStatic = browser?.querySelectorAll('[data-preview-static="true"]') ?? []
    expect(reusedStatic.length).toBeGreaterThan(0)
    expect([...reusedStatic].every(preview => preview.querySelector('img') != null)).toBe(true)

    act(() => idleCallbacks.shift()?.())
    expect(browser?.querySelectorAll('[data-preview-ready="true"]')).toHaveLength(beforeReady + 1)
    expect(browser?.querySelectorAll('[data-preview-ready="false"]')).toHaveLength(beforePending - 1)
    act(() => frameCallbacks.splice(0).forEach(callback => callback(16)))
    expect(browser?.querySelectorAll('[data-preview-static="true"]')).toHaveLength(reusedStatic.length + 1)
  })

  it('does not fetch the entire preset catalog in background when the editor opens', () => {
    const idleCallbacks: Array<() => void> = []
    const frameCallbacks: FrameRequestCallback[] = []
    const image = vi.fn(function () { return document.createElement('img') })
    vi.stubGlobal('Image', image)
    vi.stubGlobal('requestIdleCallback', vi.fn((callback: () => void) => idleCallbacks.push(callback)))
    vi.stubGlobal('cancelIdleCallback', vi.fn())
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => frameCallbacks.push(callback)))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, createProps())
    )))
    act(() => {
      idleCallbacks.splice(0).forEach(callback => callback())
      frameCallbacks.splice(0).forEach(callback => callback(0))
    })
    expect(image).not.toHaveBeenCalled()
    expect(host.querySelectorAll('[data-preview-source="prebuilt"] img').length).toBeGreaterThan(0)
  })

  it('opens built-in avatar templates from prebuilt SVG snapshots without modeling them first', () => {
    const props = createProps()
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const avatarTypes = host.querySelector<HTMLElement>('[aria-label="Avatar type"]')
    act(() => avatarTypes?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    const browser = host.querySelector<HTMLElement>('[aria-label="Avatar templates"]')
    const previews = browser?.querySelectorAll('[data-preview-source="prebuilt"]') ?? []

    expect(previews).toHaveLength(AVATAR_BUILT_IN_ENTITY_PRESETS.length)
    expect(browser?.querySelectorAll('[data-preview-ready="false"]')).toHaveLength(0)
    expect(browser?.querySelectorAll('[data-preview-ready="true"] > svg')).toHaveLength(0)
    expect([...previews].every(preview => preview.querySelector('img') != null)).toBe(true)
  })

  it('opens every species type from prebuilt SVG snapshots without modeling it first', () => {
    const owlTemplates = getAvatarAnimalBreedTemplates('owl')
    const props = {
      ...createProps(),
      animalBreedTemplateId: owlTemplates[0]!.id,
      entityParts: resolveAvatarAnimalBreedTemplate(owlTemplates[0]!, 'v1-preview').entityParts,
      entityPreset: 'owl' as const,
      onAnimalBreedTemplateChange: vi.fn(),
      selectedPalette: getAvatarPalette(owlTemplates[0]!.fixed.paletteId)
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const types = host.querySelector<HTMLElement>('[aria-label="Owl types"]')
    const previews = types?.querySelectorAll('[data-preview-source="prebuilt"]') ?? []
    expect(previews).toHaveLength(owlTemplates.length)
    expect(types?.querySelectorAll('[data-preview-ready="false"]')).toHaveLength(0)
    expect(types?.querySelectorAll('svg.avatar-controls__entity-preset-icon')).toHaveLength(0)
    expect([...previews].every(preview => preview.querySelector('img') != null)).toBe(true)
  })

  it('marks selecting a complete face preset as a replace operation', () => {
    const props = { ...createProps(), activeTab: 'build' as const }
    act(() => root.render(createElement(AvatarLocaleProvider, { initialLocale: 'en', persist: false }, createElement(AvatarControls, props))))
    act(() => host.querySelector<HTMLElement>('[aria-label="Face presets"]')
      ?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    act(() => Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(button => button.getAttribute('aria-label') === 'Sleepy')?.click())
    expect(props.onFaceStyleChange).toHaveBeenCalledWith(expect.objectContaining({ height: 30 }), 'replace')
  })

  it('presents coat algorithms as icon-backed controls instead of generated decals', () => {
    const props = {
      ...createProps(),
      coatPattern: { ...DEFAULT_AVATAR_COAT_PATTERN, enabled: true },
      entityParts: [],
      entityPreset: 'cat' as const,
      surfaceDecals: []
    }
    act(() => root.render(createElement(AvatarLocaleProvider, { initialLocale: 'en', persist: false }, createElement(AvatarControls, props))))
    expect(host.querySelector('#avatar-controls-left-panel-build .avatar-controls__coat-content')).toBeNull()
    expect(host.querySelector('#avatar-controls-left-panel-build .avatar-controls__coat-pattern-entry')).not.toBeNull()
    const coatPatternToggle = host.querySelector<HTMLButtonElement>('.avatar-controls__coat-pattern-toggle')
    expect(coatPatternToggle?.getAttribute('role')).toBe('switch')
    expect(coatPatternToggle?.getAttribute('aria-checked')).toBe('true')
    expect(coatPatternToggle?.textContent).toContain('Random')
    const firstBuildControl = host.querySelector('#avatar-controls-left-panel-build')?.firstElementChild
    expect(firstBuildControl?.classList.contains('avatar-controls__coat-pattern-entry')).toBe(true)
    const advanced = openCoatPatternDetail()
    expect(advanced).not.toBeNull()
    expect(advanced?.getAttribute('role')).not.toBe('dialog')
    expect(document.querySelector('#avatar-controls-build-advanced')).toBeNull()
    expect(advanced?.querySelector('.avatar-controls__coat-content')).not.toBeNull()
    const algorithms = host.querySelectorAll<HTMLButtonElement>('[aria-label="Pattern algorithm"] [role="radio"]')
    expect(algorithms).toHaveLength(5)
    expect([...algorithms].every(button => button.querySelector('svg') != null)).toBe(true)
    expect(host.querySelector('[aria-label="Follow Seed: Pattern layout"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Jitter"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Light coat patch shape"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Length"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Vertical position"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Width"]')).not.toBeNull()
    const lightPatchShapes = host.querySelectorAll<HTMLButtonElement>('[aria-label="Light coat patch shape"] [role="radio"]')
    expect(lightPatchShapes).toHaveLength(3)
    expect([...lightPatchShapes].every(button => button.querySelector('svg') != null)).toBe(true)
    expect(host.querySelector('[aria-label="Jitter"]')).not.toBeNull()
    expect(host.textContent).toContain('Convert to editable decals')
    expect(host.textContent).not.toContain('Seed controls stripe placement and curvature.')
    expect(host.textContent).not.toContain('Generated procedurally from the pattern seed.')
    expect(host.textContent).not.toContain('Procedural pattern active.')
    expect(host.querySelector('[role="listbox"][aria-label="Surface decals"]')).toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('.avatar-controls__coat-actions button')?.click())
    expect(props.onConvertCoatPatternToDecals).toHaveBeenCalledOnce()
  })

  it('moves Seed editing out of the overview and into the sidebar detail page', () => {
    const props = createProps()
    act(() => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(AvatarControls, props)
      ))
    })

    const disclosure = host.querySelector<HTMLButtonElement>('[aria-label="Seed settings"]')
    const faceSeed = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Face"]')
    expect(disclosure?.getAttribute('aria-expanded')).toBe('false')
    expect(disclosure?.getAttribute('aria-controls')).toBeTruthy()
    expect(host.querySelector('[aria-label="Current Seed"]')).toBeNull()
    expect(host.querySelector('[aria-label="Generate random Seed"]')).toBeNull()
    expect(host.querySelector('.avatar-controls__seed')).toBeNull()
    expect(host.querySelector('.avatar-controls__seed-settings')).not.toBeNull()
    expect(host.textContent).not.toContain('Only linked fields change when the Seed changes.')
    expect(faceSeed?.getAttribute('aria-checked')).toBe('false')
    expect(host.textContent).not.toContain('Saved presets')
    expect(host.textContent).toContain('Avatar type')

    act(() => faceSeed?.click())
    expect(props.onSeedFieldToggle).toHaveBeenCalledWith('scene.face.preset', true)
    act(() => disclosure?.click())
    const detail = host.querySelector<HTMLElement>('#avatar-controls-build-detail-seed')
    expect(detail).not.toBeNull()
    expect(host.querySelector('[aria-label="Avatar type"]')).toBeNull()
    expect(detail?.textContent).toContain('Seeded fields: 0')
    expect(detail?.textContent).toContain('Only linked fields change when the Seed changes.')
    expect(detail?.querySelector('[aria-label="View composition"]')).toBeNull()
    const input = host.querySelector<HTMLInputElement>('[aria-label="Current Seed"]')
    const randomize = host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')
    expect(input?.value).toBe('v1-test')
    expect(input?.closest('#avatar-controls-build-detail-seed')).toBe(detail)

    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      if (input != null) {
        input.focus()
        valueSetter?.call(input, 'v1-next')
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    act(() => input?.blur())
    expect(props.onSeedChange).toHaveBeenCalledWith('v1-next')

    act(() => randomize?.click())
    expect(props.onRandomSeed).toHaveBeenCalledOnce()
  })

  it('opens Seed settings as an in-sidebar detail page and returns to the overview', () => {
    const props = createProps()
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const detail = openSeedDetail()
    expect(detail).not.toBeNull()
    expect(detail?.closest('#avatar-controls-left-panel-build')).not.toBeNull()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(detail?.textContent).toContain('Seed')
    expect(detail?.textContent).toContain('Advanced options')
    expect(detail?.querySelector('[aria-label="Current Seed"]')).not.toBeNull()
    expect(detail?.querySelector('[aria-label="Generate random Seed"]')).not.toBeNull()
    expect(detail?.querySelector('[aria-label="View composition"]')).toBeNull()
    expect(host.querySelector('[aria-label="Avatar type"]')).toBeNull()

    act(() => detail?.querySelector<HTMLButtonElement>('[aria-label="Back to Build overview"]')?.click())
    expect(host.querySelector('#avatar-controls-build-detail-seed')).toBeNull()
    expect(host.querySelector('[aria-label="Avatar type"]')).not.toBeNull()
  })

  it('opens Face settings as an in-sidebar detail page and restores the Build overview', () => {
    const props = createProps()
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const detail = openFaceDetail()
    expect(detail).not.toBeNull()
    expect(detail?.closest('#avatar-controls-left-panel-build')).not.toBeNull()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(detail?.textContent).toContain('Face')
    expect(detail?.textContent).toContain('Advanced options')
    expect(detail?.querySelector('[role="tablist"][aria-label="Face parts"]')).not.toBeNull()
    expect(detail?.querySelector('[aria-label="Eye shape"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Avatar type"]')).toBeNull()

    act(() => detail?.querySelector<HTMLButtonElement>('[aria-label="Back to Build overview"]')?.click())
    expect(host.querySelector('#avatar-controls-build-detail-face')).toBeNull()
    expect(host.querySelector('[aria-label="Avatar type"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Face presets"]')).not.toBeNull()
  })

  it('keeps Style libraries compact and moves complete configuration into sidebar detail pages', () => {
    const entityParts = createAvatarEntityParts('bear')
    const props = {
      ...createProps(),
      activeTab: 'style' as const,
      entityParts,
      entityPreset: 'bear' as const,
      selectedEntityPartId: null
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const paletteOverview = host.querySelector<HTMLElement>('#avatar-controls-right-panel-style [aria-label="Palette"]')
    expect(paletteOverview?.querySelector('.avatar-controls__swatches--compact')).not.toBeNull()
    expect(paletteOverview?.querySelectorAll('.avatar-controls__swatch').length).toBeGreaterThan(0)
    expect(host.querySelector('#avatar-controls-right-panel-style [aria-label="Background"]')).toBeNull()

    act(() => paletteOverview?.querySelector<HTMLButtonElement>('.avatar-controls__style-more')?.click())
    const paletteDetail = host.querySelector<HTMLElement>('#avatar-controls-style-detail-palette')
    expect(paletteDetail).not.toBeNull()
    expect(host.querySelector('[role="dialog"]')).toBeNull()
    expect(paletteDetail?.querySelector('[aria-label="Part material"]')).not.toBeNull()
    expect(paletteDetail?.querySelector('[aria-label="Palette presets"]')).not.toBeNull()
    expect(paletteDetail?.querySelector('[aria-label="Background"]')).not.toBeNull()

    act(() => paletteDetail?.querySelector<HTMLButtonElement>('[aria-label="Back to Style overview"]')?.click())
    const cameraOverview = host.querySelector<HTMLElement>('#avatar-controls-right-panel-style [aria-label="Camera background"]')
    act(() => cameraOverview?.querySelector<HTMLButtonElement>('.avatar-controls__style-more')?.click())
    const cameraDetail = host.querySelector<HTMLElement>('#avatar-controls-style-detail-camera-background')
    expect(cameraDetail?.querySelector('[aria-label="Camera background color"]')).not.toBeNull()
    expect(cameraDetail?.querySelectorAll('[aria-label="Camera background presets"] button').length).toBeGreaterThan(5)
  })

  it('exposes one Seed toggle for the horizontal position', () => {
    const props = createProps()
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))
    expect(openBuildAdvanced()).not.toBeNull()

    const pose = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: View composition"]')
    expect(pose).not.toBeNull()
    act(() => pose?.click())
    expect(props.onSeedFieldToggle).toHaveBeenCalledWith('scene.view.pose', true)
  })

  it('keeps locally saved presets separate from built-in avatar templates', () => {
    const props = {
      ...createProps(),
      lightAzimuth: -34,
      savedPresets: [{
        createdAt: 1_700_000_000_000,
        id: 'saved-one',
        query: '?entity=cat&cameraFrame=rounded',
        screenshot: 'data:image/png;base64,cHJlc2V0',
        version: 1 as const
      }]
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const savedSection = host.querySelector<HTMLElement>('[aria-label="Saved looks"]')
    const templateSection = host.querySelector<HTMLElement>('[aria-label="Avatar type"]')
    expect(savedSection).not.toBeNull()
    expect(templateSection).not.toBeNull()
    expect(savedSection?.contains(templateSection ?? null)).toBe(false)
    expect(savedSection?.querySelector('[data-entity-preset]')).toBeNull()
    expect(savedSection?.querySelector('img')).not.toBeNull()
    expect(templateSection?.querySelector('[data-entity-preset="cat"]')).not.toBeNull()
    expect(templateSection?.querySelectorAll('[data-entity-preset]')).toHaveLength(4)
    act(() => templateSection?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    const browser = host.querySelector<HTMLElement>('[aria-label="Avatar templates"]')
    const fox = browser?.querySelector<HTMLButtonElement>('[data-entity-preset="fox"]')
    expect(fox?.getAttribute('aria-label')).toBe('Fox')
    expect(fox?.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')).not.toBeNull()
    expect(browser?.querySelectorAll('[data-entity-preset]')).toHaveLength(AVATAR_BUILT_IN_ENTITY_PRESETS.length)
  })

  it('keeps cat types as a peer library and applies a selected constraint profile', () => {
    const props = {
      ...createProps(),
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const,
      lightAzimuth: -34
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const avatarType = host.querySelector<HTMLElement>('[aria-label="Avatar type"]')
    const catTypes = host.querySelector<HTMLElement>('[aria-label="Cat types"]')
    expect(avatarType).not.toBeNull()
    expect(catTypes).not.toBeNull()
    expect(avatarType?.contains(catTypes ?? null)).toBe(false)
    expect(catTypes?.querySelectorAll('[data-cat-breed]')).toHaveLength(4)
    act(() => catTypes?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    const catBrowser = host.querySelector<HTMLElement>('#avatar-controls-build-detail-presets .avatar-controls__preset-browser-grid')
    expect(catBrowser?.querySelectorAll('[data-cat-breed]')).toHaveLength(6)
    const siamese = catBrowser?.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')
    const cat = avatarType?.querySelector<HTMLButtonElement>('[data-entity-preset="cat"]')
    expect(siamese?.classList.contains('avatar-controls__saved-preset')).toBe(true)
    expect(siamese?.querySelector('svg')?.getAttribute('viewBox')).toBe(cat?.querySelector('svg')?.getAttribute('viewBox'))
    expect(siamese?.textContent).toBe('')
    const cow = catBrowser?.querySelector<HTMLButtonElement>('[data-cat-breed="cow-cat"]')
    const black = catBrowser?.querySelector<HTMLButtonElement>('[data-cat-breed="black-cat"]')
    expect(cow?.querySelector('svg')).not.toBeNull()
    expect(cow?.textContent).toBe('')
    expect(cow?.getAttribute('aria-label')).toBe('Cow Cat')
    expect(cow?.getAttribute('title')).toBe('Cow Cat')
    expect(black?.getAttribute('aria-label')).toBe('Black Cat')
    expect(cow?.querySelector('svg rect')?.getAttribute('fill')).toBe('#f5f1e7')
    expect(black?.querySelector('svg rect')?.getAttribute('fill')).toBe('#eef2f5')
    act(() => siamese?.click())
    expect(props.onCatBreedTemplateChange).toHaveBeenCalledWith('siamese')

    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, { ...props, catBreedTemplateId: 'siamese' })
    )))
    act(() => host.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')?.click())
    expect(props.onCatBreedTemplateChange).toHaveBeenLastCalledWith(null)
  })

  it('does not expose a Seed toggle for the manually controlled camera frame', () => {
    const props = { ...createProps(), activeTab: 'effects' as const, selectedEntityPartId: null }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))
    expect(host.querySelector('[aria-label="Follow Seed: Camera frame"]')).toBeNull()
    expect(host.querySelector('[aria-label="Camera frame shape"]')).not.toBeNull()
  })

  it('keeps dog types as a peer library with real previews and a cancellable selection', () => {
    const props = {
      ...createProps(),
      entityParts: createAvatarEntityParts('dog'),
      entityPreset: 'dog' as const,
      lightAzimuth: -34
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const avatarType = host.querySelector<HTMLElement>('[aria-label="Avatar type"]')
    const dogTypes = host.querySelector<HTMLElement>('[aria-label="Dog types"]')
    expect(avatarType).not.toBeNull()
    expect(dogTypes).not.toBeNull()
    expect(avatarType?.contains(dogTypes ?? null)).toBe(false)
    expect(dogTypes?.querySelectorAll('[data-dog-breed]')).toHaveLength(4)
    expect(host.querySelector('[aria-label="Cat types"]')).toBeNull()
    act(() => dogTypes?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    const dogBrowser = host.querySelector<HTMLElement>('#avatar-controls-build-detail-presets .avatar-controls__preset-browser-grid')
    expect(dogBrowser?.querySelectorAll('[data-dog-breed]')).toHaveLength(6)
    const shiba = dogBrowser?.querySelector<HTMLButtonElement>('[data-dog-breed="shiba-inu"]')
    const dalmatian = dogBrowser?.querySelector<HTMLButtonElement>('[data-dog-breed="dalmatian"]')
    const dog = avatarType?.querySelector<HTMLButtonElement>('[data-entity-preset="dog"]')
    expect(shiba?.classList.contains('avatar-controls__saved-preset')).toBe(true)
    expect(shiba?.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 420 420')
    expect(shiba?.textContent).toBe('')
    expect(shiba?.getAttribute('aria-label')).toBe('Shiba Inu')
    expect(shiba?.getAttribute('title')).toBe('Shiba Inu')
    expect(dalmatian?.getAttribute('aria-label')).toBe('Dalmatian')
    expect(dalmatian?.querySelector('svg rect')?.getAttribute('fill')).toBe('#536f86')

    act(() => shiba?.click())
    expect(props.onDogBreedTemplateChange).toHaveBeenCalledWith('shiba-inu')

    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, { ...props, dogBreedTemplateId: 'shiba-inu' })
    )))
    act(() => host.querySelector<HTMLButtonElement>('[data-dog-breed="shiba-inu"]')?.click())
    expect(props.onDogBreedTemplateChange).toHaveBeenLastCalledWith(null)
  })

  it('keeps rabbit types, true previews, dimensions, and Seed bindings isolated to rabbits', () => {
    const props = {
      ...createProps(),
      entityParts: createAvatarEntityParts('rabbit'),
      entityPreset: 'rabbit' as const,
      lightAzimuth: -34,
      rabbitEarHeight: 126,
      rabbitEarWidth: 118,
      rabbitHeadHeight: 104,
      rabbitHeadWidth: 112
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const rabbitTypes = host.querySelector<HTMLElement>('[aria-label="Rabbit types"]')
    expect(rabbitTypes?.querySelectorAll('[data-rabbit-breed]')).toHaveLength(4)
    act(() => rabbitTypes?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    const rabbitBrowser = host.querySelector<HTMLElement>('#avatar-controls-build-detail-presets .avatar-controls__preset-browser-grid')
    const hollandLop = rabbitBrowser?.querySelector<HTMLButtonElement>('[data-rabbit-breed="holland-lop"]')
    expect(rabbitBrowser?.querySelectorAll('[data-rabbit-breed]')).toHaveLength(6)
    expect(host.querySelector('[aria-label="Dog types"]')).toBeNull()
    expect(hollandLop?.textContent).toBe('')
    expect(hollandLop?.getAttribute('aria-label')).toBe('Holland Lop')
    expect(hollandLop?.querySelector('svg')).not.toBeNull()

    act(() => hollandLop?.click())
    expect(props.onRabbitBreedTemplateChange).toHaveBeenCalledWith('holland-lop')
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, { ...props, rabbitBreedTemplateId: 'holland-lop' })
    )))
    act(() => host.querySelector<HTMLButtonElement>('[data-rabbit-breed="holland-lop"]')?.click())
    expect(props.onRabbitBreedTemplateChange).toHaveBeenLastCalledWith(null)
    expect(openBuildAdvanced()).not.toBeNull()

    const earWidth = host.querySelector<HTMLInputElement>('[aria-label="Rabbit ear width"]')
    const headWidth = host.querySelector<HTMLInputElement>('[aria-label="Rabbit head width"]')
    expect(earWidth?.value).toBe('118')
    expect(earWidth?.min).toBe('55')
    expect(earWidth?.max).toBe('155')
    expect(headWidth?.value).toBe('112')
    expect(headWidth?.min).toBe('76')
    expect(headWidth?.max).toBe('132')
    expect(host.querySelector('[aria-label="Follow Seed: Ear width"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Head width"]')).not.toBeNull()
    expect(host.querySelector('#avatar-controls-build-detail-coat-pattern')).toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Head width"]')?.click())
    expect(props.onSeedFieldToggle).toHaveBeenCalledWith('scene.entity.rabbitHeadWidth', true)
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(earWidth, '120')
      earWidth?.dispatchEvent(new Event('input', { bubbles: true }))
      earWidth?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onRabbitEarWidthChange).toHaveBeenCalledWith(120)

    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, { ...props, entityParts: createAvatarEntityParts('dog'), entityPreset: 'dog' })
    )))
    expect(host.querySelector('[aria-label="Rabbit types"]')).toBeNull()
    expect(host.querySelector('[aria-label="Rabbit ear size"]')).toBeNull()
    expect(host.querySelector('[aria-label="Rabbit head size"]')).toBeNull()
  })

  it('keeps bear types icon-only, true-rendered, cancellable, and breed-scoped for coat editing', () => {
    const props = {
      ...createProps(),
      bearEarHeight: 122,
      bearEarWidth: 108,
      bearHeadHeight: 112,
      bearHeadWidth: 118,
      entityParts: createAvatarEntityParts('bear'),
      entityPreset: 'bear' as const,
      lightAzimuth: -34
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const bearTypes = host.querySelector<HTMLElement>('[aria-label="Bear types"]')
    expect(bearTypes?.querySelectorAll('[data-bear-breed]')).toHaveLength(4)
    act(() => bearTypes?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')?.click())
    const bearBrowser = host.querySelector<HTMLElement>('[aria-label="Bear types"]')
    const panda = bearBrowser?.querySelector<HTMLButtonElement>('[data-bear-breed="giant-panda"]')
    expect(bearBrowser?.querySelectorAll('[data-bear-breed]')).toHaveLength(11)
    expect(panda?.textContent).toBe('')
    expect(panda?.getAttribute('aria-label')).toBe('Giant Panda')
    expect(panda?.querySelector('svg')).not.toBeNull()
    expect(bearBrowser?.querySelector('[data-bear-breed="spectacled-bear"] path[fill="#241711"]'))
      .not.toBeNull()
    expect(host.querySelector('[aria-label="Coat pattern"]')).toBeNull()

    act(() => panda?.click())
    expect(props.onBearBreedTemplateChange).toHaveBeenCalledWith('giant-panda')
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, { ...props, bearBreedTemplateId: 'giant-panda' })
    )))
    expect(host.querySelector('[aria-label="Coat pattern"]')).not.toBeNull()
    act(() => host.querySelector<HTMLButtonElement>('[data-bear-breed="giant-panda"]')?.click())
    expect(props.onBearBreedTemplateChange).toHaveBeenLastCalledWith(null)
    expect(openBuildAdvanced()).not.toBeNull()

    const earWidth = host.querySelector<HTMLInputElement>('[aria-label="Bear ear width"]')
    const headWidth = host.querySelector<HTMLInputElement>('[aria-label="Bear head width"]')
    expect(earWidth?.value).toBe('108')
    expect(earWidth?.min).toBe('55')
    expect(earWidth?.max).toBe('155')
    expect(headWidth?.value).toBe('118')
    expect(headWidth?.min).toBe('76')
    expect(headWidth?.max).toBe('132')
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Head width"]')?.click())
    expect(props.onSeedFieldToggle).toHaveBeenCalledWith('scene.entity.bearHeadWidth', true)
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(earWidth, '116')
      earWidth?.dispatchEvent(new Event('input', { bubbles: true }))
      earWidth?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onBearEarWidthChange).toHaveBeenCalledWith(116)

    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, { ...props, entityParts: createAvatarEntityParts('rabbit'), entityPreset: 'rabbit' })
    )))
    expect(host.querySelector('[aria-label="Bear types"]')).toBeNull()
    expect(host.querySelector('[aria-label="Bear ear size"]')).toBeNull()
    expect(host.querySelector('[aria-label="Bear head size"]')).toBeNull()
  })

  it('exposes independent cat ear dimensions and Seed bindings only for the cat template', () => {
    const props = {
      ...createProps(),
      catEarHeight: 80,
      catEarWidth: 140,
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))
    expect(openBuildAdvanced()).not.toBeNull()

    const width = host.querySelector<HTMLInputElement>('[aria-label="Cat ear width"]')
    const height = host.querySelector<HTMLInputElement>('[aria-label="Cat ear height"]')
    expect(width?.value).toBe('140')
    expect(height?.value).toBe('80')
    expect(width?.min).toBe('50')
    expect(width?.max).toBe('160')
    expect(host.querySelector('[aria-label="Follow Seed: Ear width"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Ear height"]')).not.toBeNull()

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(width, '150')
      width?.dispatchEvent(new Event('input', { bubbles: true }))
      width?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onCatEarWidthChange).toHaveBeenCalledWith(150)
  })

  it('exposes independent dog ear dimensions and Seed bindings only for the dog template', () => {
    const props = {
      ...createProps(),
      dogEarHeight: 80,
      dogEarWidth: 140,
      entityParts: createAvatarEntityParts('dog'),
      entityPreset: 'dog' as const
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))
    expect(openBuildAdvanced()).not.toBeNull()

    const width = host.querySelector<HTMLInputElement>('[aria-label="Dog ear width"]')
    const height = host.querySelector<HTMLInputElement>('[aria-label="Dog ear height"]')
    expect(width?.value).toBe('140')
    expect(height?.value).toBe('80')
    expect(width?.min).toBe('50')
    expect(width?.max).toBe('160')
    expect(host.querySelector('[aria-label="Cat ear width"]')).toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Ear width"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Ear height"]')).not.toBeNull()

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(width, '150')
      width?.dispatchEvent(new Event('input', { bubbles: true }))
      width?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onDogEarWidthChange).toHaveBeenCalledWith(150)
  })

  it('exposes independently Seed-following dog head width and height only for dogs', () => {
    const props = {
      ...createProps(),
      dogHeadHeight: 88,
      dogHeadWidth: 124,
      entityParts: createAvatarEntityParts('dog'),
      entityPreset: 'dog' as const
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))
    expect(openBuildAdvanced()).not.toBeNull()

    const width = host.querySelector<HTMLInputElement>('[aria-label="Dog head width"]')
    const height = host.querySelector<HTMLInputElement>('[aria-label="Dog head height"]')
    expect(width?.value).toBe('124')
    expect(height?.value).toBe('88')
    expect(width?.min).toBe('70')
    expect(width?.max).toBe('140')
    expect(host.querySelector('[aria-label="Follow Seed: Head width"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Follow Seed: Head height"]')).not.toBeNull()

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: Head width"]')?.click())
    expect(props.onSeedFieldToggle).toHaveBeenCalledWith('scene.entity.dogHeadWidth', true)

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(width, '130')
      width?.dispatchEvent(new Event('input', { bubbles: true }))
      width?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(props.onDogHeadWidthChange).toHaveBeenCalledWith(130)

    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, {
        ...props,
        entityParts: createAvatarEntityParts('cat'),
        entityPreset: 'cat'
      })
    )))
    expect(host.querySelector('[aria-label="Dog head size"]')).toBeNull()
  })
})

describe('AvatarControls natural animal breeds', () => {
  it.each(AVATAR_ANIMAL_SPECIES_IDS)(
    'renders real %s breed previews and independent head/ear controls',
    species => {
      const templates = getAvatarAnimalBreedTemplates(species)
      const onBreed = vi.fn()
      const props = {
        ...createProps(),
        animalBreedTemplateId: templates[0]!.id,
        animalEarHeight: 108,
        animalEarWidth: 104,
        animalHeadHeight: 109,
        animalHeadWidth: 113,
        entityParts: resolveAvatarAnimalBreedTemplate(templates[0]!, 'v1-preview').entityParts,
        entityPreset: species,
        lightAzimuth: -34,
        onAnimalBreedTemplateChange: onBreed,
        onAnimalEarWidthChange: vi.fn(),
        onAnimalHeadWidthChange: vi.fn(),
        selectedPalette: getAvatarPalette(templates[0]!.fixed.paletteId)
      }
      act(() => root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(AvatarControls, props)
      )))

      const inlineButtons = host.querySelectorAll<HTMLButtonElement>('[data-animal-breed]')
      const inlineMore = [...host.querySelectorAll<HTMLElement>('.avatar-controls__field-group')]
        .find(section => section.querySelector('[data-animal-breed]') != null)
        ?.querySelector<HTMLButtonElement>('[aria-label="More presets"]')
      if (inlineMore != null) act(() => inlineMore.click())
      const browser = host.querySelector<HTMLElement>('#avatar-controls-build-detail-presets .avatar-controls__preset-browser-grid')
      const buttons = browser?.querySelectorAll<HTMLButtonElement>('[data-animal-breed]') ?? inlineButtons
      expect(buttons).toHaveLength(templates.length)
      expect([...buttons].every(button => button.querySelector(
        `svg.avatar-controls__entity-preset-icon [data-avatar-entity-preset="${species}"] [data-avatar-entity-part]`
      ) != null)).toBe(true)
      if (species === 'fox') {
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-surface-decal="fox-cheek-left"]'
        ) != null)).toBe(true)
      }
      if (species === 'hamster' || species === 'squirrel') {
        for (const button of buttons) {
          for (const side of ['left', 'right'] as const) {
            expect(button.querySelector(
              `[data-avatar-entity-part="cheek-${side}"] ` +
              `[data-avatar-surface-decal="${species}-cheek-${side}"]`
            )).not.toBeNull()
          }
        }
        if (species === 'hamster') {
          expect([...buttons].every(button => button.querySelector(
            '[data-avatar-entity-part="ear-left"] [data-avatar-surface-decal="hamster-inner-ear-left"]'
          ) != null)).toBe(true)
        }
        if (species === 'squirrel') {
          expect([...buttons].every(button => button.querySelector(
            '[data-avatar-entity-part="primary"] [data-avatar-surface-decal="squirrel-face-mask"]'
          ) != null)).toBe(true)
        }
      }
      if (species === 'capybara') {
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-entity-part="muzzle"] [data-avatar-surface-decal="capybara-muzzle-fur"]'
        ) != null)).toBe(true)
      }
      if (species === 'seal' || species === 'guinea-pig' || species === 'chinchilla') {
        expect([...buttons].every(button => ['left', 'right'].every(side => button.querySelector(
          `[data-avatar-entity-part="cheek-${side}"] ` +
          `[data-avatar-surface-decal="${species}-cheek-${side}"]`
        ) != null))).toBe(true)
      }
      if (species === 'beaver') {
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-entity-part="tooth-left"]'
        ) != null)).toBe(true)
      }
      if (species === 'ferret') {
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-entity-part="primary"] [data-avatar-surface-decal="ferret-eye-mask-left"]'
        ) != null)).toBe(true)
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-entity-part="muzzle"]'
        ) == null)).toBe(true)
      }
      if (species === 'monkey') {
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-entity-part="muzzle"] [data-avatar-surface-decal="monkey-muzzle-skin"]'
        ) != null)).toBe(true)
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-entity-part="muzzle"] [data-avatar-surface-decal="monkey-nostril-left"]'
        ) != null)).toBe(true)
      }
      if (species === 'sheep' || species === 'deer' || species === 'otter' || species === 'alpaca') {
        expect([...buttons].every(button => button.querySelector(
          `[data-avatar-entity-part="primary"] [data-avatar-surface-decal="${species}-face-mask"]`
        ) != null)).toBe(true)
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-entity-part="muzzle"]'
        ) == null)).toBe(true)
      }
      act(() => buttons[1]?.click())
      expect(onBreed).toHaveBeenCalledWith(templates[1]!.id)
      expect(openBuildAdvanced()).not.toBeNull()
      const label = host.querySelector<HTMLElement>('.avatar-controls__animal-head-size .avatar-controls__label')
        ?.textContent?.replace(' head size', '') ?? ''
      expect(host.querySelector<HTMLInputElement>(`[aria-label="${label} head width"]`)?.value).toBe('113')
      const hasAuthoredEars = props.entityParts.some(part => /(?:^|-)ear-(?:left|right)$/u.test(part.id))
      if (species === 'seal' || !hasAuthoredEars) {
        expect(host.querySelector('.avatar-controls__animal-ear-size')).toBeNull()
      } else {
        expect(host.querySelector<HTMLInputElement>(`[aria-label="${label} ear width"]`)?.value).toBe('104')
      }
    }
  )

  it('shows true antler and horn controls only for breeds that actually carry them', () => {
    const cases = [
      ['deer', 'reindeer', 'Deer antler size', true],
      ['deer', 'deer-fawn', 'Deer antler size', false],
      ['sheep', 'horned-ram', 'Sheep horn size', true],
      ['sheep', 'lamb', 'Sheep horn size', false],
      ['cow', 'highland-cow', 'Cow horn size', true],
      ['cow', 'cow-calf', 'Cow horn size', false],
      ['squirrel', 'red-squirrel', 'Squirrel tail size', true],
      ['lion', 'african-lion', 'Lion mane size', true],
      ['lion', 'lioness', 'Lion mane size', false],
      ['hedgehog', 'european-hedgehog', 'Hedgehog spine size', true]
    ] as const
    for (const [species, id, label, present] of cases) {
      const template = getAvatarAnimalBreedTemplates(species).find(candidate => candidate.id === id)!
      const props = {
        ...createProps(),
        animalBreedTemplateId: id,
        animalHornSize: 118,
        entityParts: resolveAvatarAnimalBreedTemplate(template, `v1-${id}`).entityParts,
        entityPreset: species,
        selectedPalette: getAvatarPalette(id)
      }
      act(() => root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(AvatarControls, props)
      )))
      expect(openBuildAdvanced()).not.toBeNull()
      expect(host.querySelector(`[aria-label="${label}"]`) != null).toBe(present)
    }
  })

  it.each([
    ['cow', 'dairy-cow', 'coat-cow-spots-', 'mark'],
    ['squirrel', 'chipmunk', 'coat-chipmunk-left-light', 'patch'],
    ['tiger', 'bengal-tiger', 'coat-tiger-', 'mark']
  ] as const)('keeps %s preview markings coordinated with their seeded natural fur tone', (species, id, decalId, color) => {
    const template = getAvatarAnimalBreedTemplates(species).find(candidate => candidate.id === id)!
    const basePalette = getAvatarPalette(id)
    const seed = Array.from({ length: 50 }, (_, index) => `v1-${id}-preview-tone-${index}`).find(candidate => (
      resolveAvatarBreedPalette(id, candidate, template.seedDomain).background !== basePalette.background
    ))
    expect(seed).toBeDefined()
    const palette = resolveAvatarBreedPalette(id, seed!, template.seedDomain)
    const props = {
      ...createProps(),
      animalBreedTemplateId: id,
      entityParts: resolveAvatarAnimalBreedTemplate(template, seed!).entityParts,
      entityPreset: species,
      lightAzimuth: -34,
      seed: seed!,
      selectedPalette: palette
    }

    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const decal = host.querySelector<SVGElement>(
      `[data-animal-breed="${id}"] [data-avatar-surface-decal^="${decalId}"]`
    )
    expect(decal).not.toBeNull()
    expect(decal?.getAttribute('fill')).toBe(palette.coat?.[color])
    if (color === 'patch') expect(palette.coat?.patch).not.toBe(basePalette.coat?.patch)
  })
})

describe('AvatarControls surface decals', () => {
  it('opens each decal in a secondary settings page and deletes it there', () => {
    const props = { ...createProps(), activeTab: 'style' as const }
    act(() => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(AvatarControls, props)
      ))
    })

    const options = host.querySelectorAll<HTMLButtonElement>('[role="option"]')
    const addButton = host.querySelector<HTMLButtonElement>('button[aria-label="Add decal"]')
    expect(options).toHaveLength(2)
    expect(addButton?.textContent?.trim()).toBe('')
    expect(addButton?.querySelector('svg')).not.toBeNull()
    expect(host.querySelector(
      '[aria-label="Surface decals"] .avatar-controls__field-header .avatar-controls__label .avatar-controls__icon'
    )).not.toBeNull()
    expect(host.querySelector('.avatar-controls__decal-editor')).toBeNull()
    expect(host.querySelector('.avatar-controls__decal-remove')).toBeNull()

    act(() => options[1]?.click())
    expect(props.onSelectSurfaceDecal).toHaveBeenCalledWith('right')
    expect(host.querySelector('.avatar-controls__decal-editor')).not.toBeNull()
    expect(host.querySelector('.avatar-controls__style-detail strong')?.textContent).toBe('Right blush')

    act(() => host.querySelector<HTMLButtonElement>('.avatar-controls__danger-action')?.click())
    expect(props.onDeleteSurfaceDecal).toHaveBeenCalledWith('right')
    expect(host.querySelector('.avatar-controls__decal-editor')).toBeNull()
  })

  it('offers the smooth face mask as an icon-backed decal shape', () => {
    const props = {
      ...createProps(),
      activeTab: 'style' as const,
      surfaceDecals: [{
        ...createAvatarSurfaceDecal('left', null),
        label: 'Face mask',
        shape: 'face-mask' as const
      }]
    }
    act(() => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(AvatarControls, props)
      ))
    })

    act(() => host.querySelector<HTMLButtonElement>('[role="option"]')?.click())

    const faceMask = [...host.querySelectorAll<HTMLButtonElement>('[aria-label="Surface decal shape"] [role="radio"]')]
      .find(button => button.textContent === 'Face mask')
    expect(faceMask?.getAttribute('aria-checked')).toBe('true')
    expect(faceMask?.querySelector('svg path')).not.toBeNull()
  })
})

describe('AvatarControls pixel style', () => {
  it('opens effect settings as an in-sidebar detail page and restores the overview', () => {
    const props = {
      ...createProps(),
      activeTab: 'effects' as const,
      showOutline: true
    }
    act(() => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(AvatarControls, props)
      ))
    })

    expect(host.querySelector('[aria-label="Camera frame shape"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="Avatar outline width"]')).toBeNull()
    expect(host.querySelectorAll('[aria-controls^="avatar-controls-effects-detail-"]')).toHaveLength(6)
    expect(host.querySelectorAll('#avatar-controls-right-panel-effects [role="switch"]')).toHaveLength(6)

    const pixelToggle = host.querySelector<HTMLButtonElement>('[role="switch"][aria-label="Pixel style"]')
    act(() => pixelToggle?.click())
    expect(props.onPixelEffectChange).toHaveBeenCalledWith({ enabled: true })
    expect(host.querySelector('#avatar-controls-effects-detail-pixel')).toBeNull()

    const detail = openEffectsDetail('avatar-outline')
    expect(detail).not.toBeNull()
    expect(host.querySelector('[aria-label="Camera frame shape"]')).toBeNull()
    expect(detail?.querySelector('[role="switch"][aria-label="Avatar outline"]')).not.toBeNull()
    expect(detail?.querySelector('[aria-label="Avatar outline width"]')).not.toBeNull()

    act(() => detail?.querySelector<HTMLButtonElement>('[aria-label="Back to Effects overview"]')?.click())
    expect(host.querySelector('#avatar-controls-effects-detail-avatar-outline')).toBeNull()
    expect(host.querySelector('[aria-label="Camera frame shape"]')).not.toBeNull()
  })

  it('exposes grain, sampling, palette, and dithering controls when enabled', () => {
    const props = {
      ...createProps(),
      activeTab: 'effects' as const,
      pixelEffect: { ...DEFAULT_AVATAR_PIXEL_EFFECT, enabled: true }
    }
    act(() => {
      root.render(createElement(
        AvatarLocaleProvider,
        { initialLocale: 'en', persist: false },
        createElement(AvatarControls, props)
      ))
    })

    openEffectsDetail('pixel')

    const sampling = host.querySelector('[aria-label="Pixel sampling"]')
    const palette = host.querySelector('[aria-label="Pixel color count"]')
    const dithering = host.querySelector('[aria-label="Pixel dithering"]')
    expect(sampling?.querySelectorAll('[role="radio"]')).toHaveLength(4)
    expect(sampling?.querySelectorAll('.avatar-controls__pixel-sampling-icon')).toHaveLength(4)
    expect(palette?.querySelectorAll('[role="radio"]')).toHaveLength(4)
    expect(dithering?.querySelectorAll('[role="radio"]')).toHaveLength(2)

    act(() => sampling?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[3]?.click())
    expect(props.onPixelEffectChange).toHaveBeenCalledWith({ sampling: 'slic' })
  })
})
