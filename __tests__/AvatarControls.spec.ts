// @vitest-environment jsdom

import { DEFAULT_AVATAR_COAT_PATTERN, DEFAULT_AVATAR_PIXEL_EFFECT, getAvatarPalette } from '@oneworks/avatar'
import { act, createElement } from 'react'
import type { ComponentProps } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AvatarControls } from '../src/AvatarControls'
import { createAvatarEntityParts } from '../src/avatarEntityPresets'
import { DEFAULT_AVATAR_FACE_SHADOW_STYLE, DEFAULT_AVATAR_FACE_STYLE } from '../src/avatarGeometry'
import { AvatarLocaleProvider } from '../src/avatarLocale'
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

describe('AvatarControls Seed authoring', () => {
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

  it('marks selecting a complete face preset as a replace operation', () => {
    const props = createProps()
    act(() => root.render(createElement(AvatarLocaleProvider, { initialLocale: 'en', persist: false }, createElement(AvatarControls, props))))
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

  it('keeps Seed settings collapsed until the accessible disclosure is opened', () => {
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

    act(() => disclosure?.click())
    expect(disclosure?.getAttribute('aria-expanded')).toBe('true')
    const input = host.querySelector<HTMLInputElement>('[aria-label="Current Seed"]')
    const randomize = host.querySelector<HTMLButtonElement>('[aria-label="Generate random Seed"]')
    expect(input?.value).toBe('v1-test')
    expect(input?.closest('.avatar-controls__seed-input')?.id).toBe(disclosure?.getAttribute('aria-controls'))

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

    act(() => faceSeed?.click())
    expect(props.onSeedFieldToggle).toHaveBeenCalledWith('scene.face.preset', true)
    act(() => randomize?.click())
    expect(props.onRandomSeed).toHaveBeenCalledOnce()
  })

  it('exposes one Seed toggle for the horizontal position', () => {
    const props = createProps()
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const pose = host.querySelector<HTMLButtonElement>('[aria-label="Follow Seed: View composition"]')
    expect(pose).not.toBeNull()
    act(() => pose?.click())
    expect(props.onSeedFieldToggle).toHaveBeenCalledWith('scene.view.pose', true)
  })

  it('keeps locally saved presets separate from built-in avatar templates', () => {
    const props = {
      ...createProps(),
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
    const fox = templateSection?.querySelector<HTMLButtonElement>('[data-entity-preset="fox"]')
    expect(fox?.getAttribute('aria-label')).toBe('Fox')
    expect(fox?.querySelector('[data-avatar-surface-decal="fox-cheek-left"]')).not.toBeNull()
    expect(templateSection?.querySelector('img')).toBeNull()
  })

  it('keeps cat types as a peer library and applies a selected constraint profile', () => {
    const props = {
      ...createProps(),
      entityParts: createAvatarEntityParts('cat'),
      entityPreset: 'cat' as const
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
    expect(catTypes?.querySelectorAll('[data-cat-breed]')).toHaveLength(6)
    const siamese = catTypes?.querySelector<HTMLButtonElement>('[data-cat-breed="siamese"]')
    const cat = avatarType?.querySelector<HTMLButtonElement>('[data-entity-preset="cat"]')
    expect(siamese?.classList.contains('avatar-controls__saved-preset')).toBe(true)
    expect(siamese?.querySelector('svg')?.getAttribute('viewBox')).toBe(cat?.querySelector('svg')?.getAttribute('viewBox'))
    expect(siamese?.querySelector('span')).toBeNull()
    const cow = catTypes?.querySelector<HTMLButtonElement>('[data-cat-breed="cow-cat"]')
    const black = catTypes?.querySelector<HTMLButtonElement>('[data-cat-breed="black-cat"]')
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
    const props = { ...createProps(), activeTab: 'style' as const, selectedEntityPartId: null }
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
      entityPreset: 'dog' as const
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
    expect(dogTypes?.querySelectorAll('[data-dog-breed]')).toHaveLength(6)
    expect(host.querySelector('[aria-label="Cat types"]')).toBeNull()
    const shiba = dogTypes?.querySelector<HTMLButtonElement>('[data-dog-breed="shiba-inu"]')
    const dalmatian = dogTypes?.querySelector<HTMLButtonElement>('[data-dog-breed="dalmatian"]')
    const dog = avatarType?.querySelector<HTMLButtonElement>('[data-entity-preset="dog"]')
    expect(shiba?.classList.contains('avatar-controls__saved-preset')).toBe(true)
    expect(shiba?.querySelector('svg')?.getAttribute('viewBox')).toBe(dog?.querySelector('svg')?.getAttribute('viewBox'))
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
    const hollandLop = rabbitTypes?.querySelector<HTMLButtonElement>('[data-rabbit-breed="holland-lop"]')
    expect(rabbitTypes?.querySelectorAll('[data-rabbit-breed]')).toHaveLength(6)
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
    expect(host.querySelector('[aria-label="Coat pattern"]')).not.toBeNull()

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
      entityPreset: 'bear' as const
    }
    act(() => root.render(createElement(
      AvatarLocaleProvider,
      { initialLocale: 'en', persist: false },
      createElement(AvatarControls, props)
    )))

    const bearTypes = host.querySelector<HTMLElement>('[aria-label="Bear types"]')
    const panda = bearTypes?.querySelector<HTMLButtonElement>('[data-bear-breed="giant-panda"]')
    expect(bearTypes?.querySelectorAll('[data-bear-breed]')).toHaveLength(11)
    expect(panda?.textContent).toBe('')
    expect(panda?.getAttribute('aria-label')).toBe('Giant Panda')
    expect(panda?.querySelector('svg')).not.toBeNull()
    expect(bearTypes?.querySelector('[data-bear-breed="spectacled-bear"] path[fill="#241711"]'))
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
  it.each(['fox', 'hamster', 'capybara', 'otter', 'pig', 'deer', 'sheep'] as const)(
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

      const buttons = host.querySelectorAll<HTMLButtonElement>('[data-animal-breed]')
      expect(buttons).toHaveLength(templates.length)
      expect([...buttons].every(button => button.querySelector(
        `svg.avatar-controls__entity-preset-icon [data-avatar-entity-preset="${species}"] [data-avatar-entity-part]`
      ) != null)).toBe(true)
      if (species === 'fox') {
        expect([...buttons].every(button => button.querySelector(
          '[data-avatar-surface-decal="fox-cheek-left"]'
        ) != null)).toBe(true)
      }
      const label = species === 'capybara' ? 'Capybara' : `${species[0]!.toUpperCase()}${species.slice(1)}`
      expect(host.querySelector<HTMLInputElement>(`[aria-label="${label} head width"]`)?.value).toBe('113')
      expect(host.querySelector<HTMLInputElement>(`[aria-label="${label} ear width"]`)?.value).toBe('104')
      act(() => buttons[1]?.click())
      expect(onBreed).toHaveBeenCalledWith(templates[1]!.id)
    }
  )

  it('shows true antler and horn controls only for breeds that actually carry them', () => {
    const cases = [
      ['deer', 'reindeer', 'Deer antler size', true],
      ['deer', 'deer-fawn', 'Deer antler size', false],
      ['sheep', 'horned-ram', 'Sheep horn size', true],
      ['sheep', 'lamb', 'Sheep horn size', false]
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
      expect(host.querySelector(`[aria-label="${label}"]`) != null).toBe(present)
    }
  })
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

  it('offers the smooth face mask as an icon-backed decal shape', () => {
    const props = {
      ...createProps(),
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

    const faceMask = [...host.querySelectorAll<HTMLButtonElement>('[aria-label="Surface decal shape"] [role="radio"]')]
      .find(button => button.textContent === 'Face mask')
    expect(faceMask?.getAttribute('aria-checked')).toBe('true')
    expect(faceMask?.querySelector('svg path')).not.toBeNull()
  })
})

describe('AvatarControls pixel style', () => {
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
