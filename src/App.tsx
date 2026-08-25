import './App.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import {
  AVATAR_EYE_HIGHLIGHT_RANGES,
  AVATAR_COAT_PATTERN_RANGES,
  AVATAR_DOG_COMPATIBLE_PALETTE_IDS,
  AVATAR_BEAR_COMPATIBLE_PALETTE_IDS,
  AVATAR_ENTITY_RANGES,
  AVATAR_RABBIT_COMPATIBLE_PALETTE_IDS,
  AVATAR_FACE_RANGES,
  AVATAR_LIGHTING_RANGES,
  AVATAR_OUTLINE_RANGES,
  AVATAR_PALETTES,
  AVATAR_PIXEL_EFFECT_RANGES,
  AVATAR_SHADOW_RANGES,
  AVATAR_TABBY_COMPATIBLE_PALETTE_IDS,
  DEFAULT_AVATAR_GLYPH_EXPRESSION,
  DEFAULT_AVATAR_COAT_PATTERN,
  DEFAULT_AVATAR_PIXEL_EFFECT,
  getAvatarPalette,
  isSupportedAvatarGlyphExpression,
  resolveAvatarCoatPatternDecals
} from '@oneworks/avatar'
import type {
  AvatarAnimationLibrary,
  AvatarBackgroundStyle,
  AvatarCoatPattern,
  AvatarCoatPatternAlgorithm,
  AvatarDefinition,
  AvatarPixelEffect,
  AvatarSeedConfiguration
} from '@oneworks/avatar'

import { AnimationPanel } from './AnimationPanel'
import { AvatarControls } from './AvatarControls'
import type { AvatarCameraFrame, AvatarControlTab } from './AvatarControls'
import { AvatarOrientationControl } from './AvatarOrientationControl'
import { EXPORT_SIZES, ExportToolbar } from './ExportToolbar'
import type { ExportSize } from './ExportToolbar'
import {
  AVATAR_BODY_SHAPES,
  AVATAR_VIEW_LIMITS,
  DEFAULT_AVATAR_VIEW_STATE,
  InteractiveAvatar
} from './InteractiveAvatar'
import type {
  AvatarBodyShape,
  AvatarDropShadowStyle,
  AvatarInteractionMode,
  AvatarOutlineStyle,
  AvatarViewState
} from './InteractiveAvatar'
import { LanguageSwitcher } from './LanguageSwitcher'
import {
  AVATAR_ANIMATION_PRESETS,
  applyAvatarAnimationTransformAnchor,
  clampAvatarAnimationFrameDuration,
  createAvatarAnimationKeyframe,
  createAvatarAnimationTransformAnchor,
  deserializeSharedAvatarAnimation,
  easeAvatarAnimationProgress,
  interpolateAvatarAnimationKeyframes,
  loadSavedAvatarAnimations,
  persistSavedAvatarAnimations,
  prependSavedAvatarAnimation,
  resolveAvatarAnimationPreset,
  resolveAvatarAnimationTimedSegment,
  serializeSharedAvatarAnimation,
  shouldConfirmAnimationReplacement
} from './avatarAnimations'
import type {
  AvatarAnimationDraftSource,
  AvatarAnimationEasing,
  AvatarAnimationKeyframe,
  AvatarAnimationPlaybackMode,
  AvatarAnimationPreset,
  AvatarAnimationTransformAnchor,
  SavedAvatarAnimation
} from './avatarAnimations'
import { DEFAULT_AVATAR_COLOR_GRADE, resolveAvatarColorGrade } from './avatarColorGrade'
import type { AvatarColorGrade } from './avatarColorGrade'
import {
  applyAvatarBearBreedForeground,
  AVATAR_CAT_BREED_CONTROLLED_FIELDS,
  AVATAR_DOG_BREED_CONTROLLED_FIELDS,
  AVATAR_RABBIT_BREED_CONTROLLED_FIELDS,
  AVATAR_BEAR_BREED_CONTROLLED_FIELDS,
  getAvatarCatBreedTemplate,
  getAvatarDogBreedTemplate,
  getAvatarRabbitBreedTemplate,
  getAvatarBearBreedTemplate,
  isAvatarCatBreedTemplateId,
  isAvatarDogBreedTemplateId,
  isAvatarRabbitBreedTemplateId,
  isAvatarBearBreedTemplateId,
  resolveAvatarCatBreedTemplate,
  resolveAvatarDogBreedTemplate,
  resolveAvatarRabbitBreedTemplate,
  resolveAvatarBearBreedTemplate
} from './avatarBreedTemplates'
import type { AvatarBearBreedTemplateId, AvatarCatBreedTemplateId, AvatarDogBreedTemplateId, AvatarRabbitBreedTemplateId } from './avatarBreedTemplates'
import {
  resolveAvatarBreedPalette,
  resolveAvatarBreedPaletteFromEntityParts
} from './avatarBreedTone'
import {
  avatarDefinitionToSearchParams,
  avatarDefinitionToState,
  createAvatarDefinition,
  flattenAvatarAnimationLibraries
} from './avatarDefinition'
import {
  applyCatEarScale,
  applyDogEarScale,
  applyDogHeadScale,
  applyRabbitEarScale,
  applyRabbitHeadScale,
  applyBearEarScale,
  applyBearHeadScale,
  applyAvatarEntityPalette,
  CAT_EAR_SCALE_RANGE,
  DOG_EAR_SCALE_RANGE,
  DOG_HEAD_SCALE_RANGE,
  RABBIT_EAR_SCALE_RANGE,
  RABBIT_HEAD_SCALE_RANGE,
  BEAR_EAR_SCALE_RANGE,
  BEAR_HEAD_SCALE_RANGE,
  createAvatarEntityParts,
  deserializeAvatarEntityParts,
  getCatEarScale,
  getDogEarScale,
  getDogHeadScale,
  getRabbitEarScale,
  getRabbitHeadScale,
  getBearEarScale,
  getBearHeadScale,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene,
  parseAvatarEntityPreset,
  resolveAvatarEntityPresetFaceStyle,
  serializeAvatarEntityParts
} from './avatarEntityPresets'
import type { AvatarEntityPart, AvatarEntityPreset } from './avatarEntityPresets'
import { AVATAR_GRID_DENSITY, DEFAULT_AVATAR_FACE_SHADOW_STYLE, DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type {
  AvatarEyeShape,
  AvatarFaceShadowStyle,
  AvatarFaceStyle,
  AvatarMouthShape,
  AvatarNoseShape
} from './avatarGeometry'
import { createAvatarGif } from './avatarGifExport'
import { LAST_EDITOR_QUERY_STORAGE_KEY } from './avatarHome'
import { useAvatarLocale } from './avatarLocale'
import {
  AVATAR_ANIMAL_SPECIES_SEED_FIELDS,
  AVATAR_COAT_PATTERN_SEED_FIELDS,
  AVATAR_SEED_FIELD,
  AVATAR_SEED_FIELDS,
  createRandomAvatarSeed,
  getAvatarSeedFieldEntityPreset,
  isAvatarAnimalSpeciesId,
  normalizeEditorAvatarSeed,
  parseAvatarSeedFields,
  resolveSeededAvatarBackgroundStyle,
  resolveSeededAvatarCameraBackground,
  resolveSeededAvatarAnimalScale,
  resolveSeededAvatarCatEarScale,
  resolveSeededAvatarDogEarScale,
  resolveSeededAvatarDogHeadScale,
  resolveSeededAvatarRabbitEarScale,
  resolveSeededAvatarRabbitHeadScale,
  resolveSeededAvatarBearEarScale,
  resolveSeededAvatarBearHeadScale,
  resolveSeededAvatarCoatPattern,
  resolveSeededAvatarEntityPreset,
  resolveSeededAvatarFacePreset,
  resolveSeededAvatarPaletteId,
  resolveSeededAvatarTabbyPaletteId,
  resolveSeededAvatarView,
  interpolateAvatarView,
  serializeAvatarSeedFields
} from './avatarSeed'
import type { AvatarAnimalSpeciesId, AvatarSeedField } from './avatarSeed'
import {
  applyAvatarAnimalDimensions,
  getAvatarAnimalBreedControlledFields,
  getAvatarAnimalBreedTemplate,
  getAvatarAnimalBreedTemplates,
  getAvatarAnimalDimensions,
  getAvatarAnimalScaleRange,
  resolveAvatarAnimalBreedTemplate
} from './avatarSpeciesBreeds'
import {
  createAvatarSurfaceDecal,
  deserializeAvatarSurfaceDecals,
  serializeAvatarSurfaceDecals
} from './avatarSurfaceDecals'
import type { AvatarSurfaceDecal } from './avatarSurfaceDecals'
import {
  captureAvatarScreenshot,
  loadSavedAvatarPresets,
  persistSavedAvatarPresets,
  prependSavedAvatarPreset,
  renderAvatarPngBlob,
  renderAvatarSvgSource
} from './savedAvatarPresets'
import type { SavedAvatarPreset } from './savedAvatarPresets'

const INITIAL_EMOTICON = DEFAULT_AVATAR_GLYPH_EXPRESSION
const INITIAL_PARTS = Array.from(INITIAL_EMOTICON)
const DEFAULT_PALETTE_COUNT = 16
const UNDO_GROUP_DELAY_MS = 400
const UNDO_HISTORY_LIMIT = 100
const DEFAULT_PALETTE_ID = AVATAR_PALETTES[0]?.id ?? ''
const DEFAULT_TABBY_PALETTE_ID = AVATAR_TABBY_COMPATIBLE_PALETTE_IDS[0]
const DEFAULT_BACKGROUND_STYLE: AvatarBackgroundStyle = 'solid'
const DEFAULT_EXPORT_SIZE: ExportSize = 256
const DEFAULT_LIGHT_AZIMUTH = -35
const DEFAULT_LIGHT_DISTANCE = 0
const DEFAULT_LIGHT_ELEVATION = 40
const DEFAULT_CAMERA_BACKGROUND = '#111315'
const DEFAULT_CAMERA_FRAME: AvatarCameraFrame = 'rounded'
const DEFAULT_AVATAR_SHADOW_STYLE: AvatarDropShadowStyle = {
  color: '#000000',
  direction: 45,
  distance: 12,
  opacity: 24,
  softness: 16
}
const DEFAULT_AVATAR_OUTLINE_STYLE: AvatarOutlineStyle = {
  color: '#ffffff',
  opacity: 80,
  width: 4
}
const DEFAULT_FRAME_SHADOW_STYLE: AvatarDropShadowStyle = {
  direction: 90,
  distance: 12,
  opacity: 22,
  softness: 24
}
const DEFAULT_CONTROLS_WIDTH = 420
const SEEDED_VIEW_TRANSITION_MS = 220
const SYSTEM_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const AVATAR_GITHUB_URL = 'https://github.com/oneworks-ai/avatar'

const parseAvatarPixelSampling = (value: string | null): AvatarPixelEffect['sampling'] => {
  switch (value) {
    case 'center':
    case 'dominant':
    case 'median':
    case 'slic':
      return value
    case 'nearest':
      return 'center'
    case 'box':
      return 'dominant'
    case 'lanczos3':
      return 'slic'
    default:
      return DEFAULT_AVATAR_PIXEL_EFFECT.sampling
  }
}

type SavePresetState = 'error' | 'idle' | 'saved' | 'saving'
type GifExportState = 'error' | 'exporting' | 'idle'
type AvatarTheme = 'dark' | 'light'
type AvatarAnimationSelectionKey =
  | 'shared'
  | `preset:${AvatarAnimationPreset['id']}`
  | `public:${string}`
  | `saved:${string}`

interface AvatarQueryConfig {
  readonly animationOpen: boolean
  readonly animationSelectionKey: AvatarAnimationSelectionKey | null
  readonly sharedAnimation: SavedAvatarAnimation | null
  readonly avatarShadowStyle: AvatarDropShadowStyle
  readonly avatarOutlineStyle: AvatarOutlineStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly bodyBottomTaper: number
  readonly cameraBackground: string
  readonly cameraFrame: AvatarCameraFrame
  readonly cameraMode: boolean
  readonly animalBreedTemplateId: string | null
  readonly animalEarHeight: number | null
  readonly animalEarWidth: number | null
  readonly animalHeadHeight: number | null
  readonly animalHeadWidth: number | null
  readonly animalHornSize: number | null
  readonly catBreedTemplateId: string | null
  readonly catEarHeight: number | null
  readonly catEarWidth: number | null
  readonly dogBreedTemplateId: string | null
  readonly dogEarHeight: number | null
  readonly dogEarWidth: number | null
  readonly dogHeadHeight: number | null
  readonly dogHeadWidth: number | null
  readonly rabbitBreedTemplateId: string | null
  readonly rabbitEarHeight: number | null
  readonly rabbitEarWidth: number | null
  readonly rabbitHeadHeight: number | null
  readonly rabbitHeadWidth: number | null
  readonly bearBreedTemplateId: string | null
  readonly bearEarHeight: number | null
  readonly bearEarWidth: number | null
  readonly bearHeadHeight: number | null
  readonly bearHeadWidth: number | null
  readonly coatPattern: AvatarCoatPattern
  readonly controlsCollapsed: boolean
  readonly entityParts: readonly AvatarEntityPart[]
  readonly entityPreset: AvatarEntityPreset
  readonly exportSize: ExportSize
  readonly faceStyle: AvatarFaceStyle
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly frameShadowStyle: AvatarDropShadowStyle
  readonly gridDensity: number
  readonly lightAzimuth: number
  readonly lightDistance: number
  readonly lightElevation: number
  readonly interactionMode: AvatarInteractionMode
  readonly linkEyes: boolean
  readonly leftEye: string
  readonly mouth: string
  readonly pixelEffect: AvatarPixelEffect
  readonly rightEye: string
  readonly seed: string
  readonly seededFields: readonly string[]
  readonly selectedPaletteId: string
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showAvatarShadow: boolean
  readonly showFrameShadow: boolean
  readonly showShadow: boolean
  readonly surfaceDecals: readonly AvatarSurfaceDecal[]
  readonly viewState: AvatarViewState
}

interface AnimationThumbnailCaptureRequest {
  readonly avatarOutlineStyle: AvatarOutlineStyle
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly bodyShape: AvatarBodyShape
  readonly bodyBottomTaper: number
  readonly entityParts: readonly AvatarEntityPart[]
  readonly entityPreset: AvatarEntityPreset
  readonly faceShadowStyle: AvatarFaceShadowStyle
  readonly gridDensity: number
  readonly id: number
  readonly keyframes: readonly AvatarAnimationKeyframe[]
  readonly lightAzimuth: number
  readonly lightDistance: number
  readonly lightElevation: number
  readonly paletteId: string
  readonly pixelEffect: AvatarPixelEffect
  readonly scale: number
  readonly showLight: boolean
  readonly showOutline: boolean
  readonly showShadow: boolean
  readonly surfaceDecals: readonly AvatarSurfaceDecal[]
}

const ignoreAvatarViewStateChange = () => {}

const isAvatarBackgroundStyle = (value: string | null): value is AvatarBackgroundStyle => {
  return value === 'solid' || value === 'gradient'
}

const parseExportSize = (value: string | null): ExportSize => {
  const parsed = Number(value)
  return EXPORT_SIZES.includes(parsed as ExportSize) ? (parsed as ExportSize) : DEFAULT_EXPORT_SIZE
}

const parseShadow = (value: string | null) => value === '1' || value === 'true'
const parseLight = (value: string | null) => value === '1' || value === 'true'
const parseCameraBackground = (value: string | null) => {
  if (value === 'transparent') return value
  return value != null && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_CAMERA_BACKGROUND
}
const parseOutlineColor = (value: string | null) => {
  return value != null && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_AVATAR_OUTLINE_STYLE.color
}
const parseAvatarShadowColor = (value: string | null) => {
  return value != null && /^#[\da-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : DEFAULT_AVATAR_SHADOW_STYLE.color
}
const parseOptionalShadowColor = (value: string | null) => (
  value != null && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : undefined
)
const parseCameraFrame = (value: string | null): AvatarCameraFrame => {
  return value === 'circle' || value === 'rounded' || value === 'square' ? value : DEFAULT_CAMERA_FRAME
}
const parseRangeValue = (value: string | null, fallback: number, min: number, max: number) => {
  if (value == null || value.trim() === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback
}
const parseFiniteValue = (value: string | null, fallback: number) => {
  if (value == null || value.trim() === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const formatQueryNumber = (value: number) => String(Number(value.toFixed(4)))
const createStableJsonFingerprint = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(createStableJsonFingerprint).join(',')}]`
  if (value != null && typeof value === 'object') {
    return `{${Object.keys(value).sort().flatMap((key) => {
      const entry = (value as Record<string, unknown>)[key]
      return entry === undefined
        ? []
        : [`${JSON.stringify(key)}:${createStableJsonFingerprint(entry)}`]
    }).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}
const parseBodyShape = (value: string | null): AvatarBodyShape => {
  return AVATAR_BODY_SHAPES.includes(value as AvatarBodyShape) ? (value as AvatarBodyShape) : 'sphere'
}
const parseEyeShape = (value: string | null): AvatarEyeShape => {
  return value === 'ellipse' || value === 'rounded' ? value : DEFAULT_AVATAR_FACE_STYLE.eyeShape
}
const parseNoseShape = (value: string | null): AvatarNoseShape => {
  return value === 'ellipse' || value === 'inverted-triangle' || value === 'rounded'
    ? value
    : DEFAULT_AVATAR_FACE_STYLE.noseShape
}
const parseMouthShape = (value: string | null): AvatarMouthShape => {
  return value === 'curve' || value === 'ellipse' || value === 'rounded' || value === 'rounded-triangle'
    ? value
    : DEFAULT_AVATAR_FACE_STYLE.mouthShape
}
const parseInteractionMode = (value: string | null): AvatarInteractionMode => {
  return value === 'move' || value === 'rotate' ? value : 'rotate'
}

const parseAvatarCoatPatternAlgorithm = (value: string | null): AvatarCoatPatternAlgorithm => (
  ['broken-mackerel', 'classic', 'mackerel', 'random', 'spotted'].includes(value ?? '')
    ? value as AvatarCoatPatternAlgorithm
    : DEFAULT_AVATAR_COAT_PATTERN.algorithm
)

const parseAvatarCoatPattern = (params: URLSearchParams, fallbackSeed: string): AvatarCoatPattern => ({
  algorithm: parseAvatarCoatPatternAlgorithm(params.get('coatAlgorithm')),
  algorithmSeed: normalizeEditorAvatarSeed(params.get('coatAlgorithmSeed') ?? params.get('seed') ?? fallbackSeed),
  breakup: parseRangeValue(params.get('coatBreakup'), DEFAULT_AVATAR_COAT_PATTERN.breakup, AVATAR_COAT_PATTERN_RANGES.breakup.min, AVATAR_COAT_PATTERN_RANGES.breakup.max),
  contrast: parseRangeValue(params.get('coatContrast'), DEFAULT_AVATAR_COAT_PATTERN.contrast, AVATAR_COAT_PATTERN_RANGES.contrast.min, AVATAR_COAT_PATTERN_RANGES.contrast.max),
  density: parseRangeValue(params.get('coatDensity'), DEFAULT_AVATAR_COAT_PATTERN.density, AVATAR_COAT_PATTERN_RANGES.density.min, AVATAR_COAT_PATTERN_RANGES.density.max),
  enabled: parseShadow(params.get('coat')) || parseAvatarSeedFields(params.get('seedFields')).some(field => (
    field === 'scene.decals.coatPattern' || field.startsWith('scene.appearance.coatPattern.')
  )),
  jitter: parseRangeValue(params.get('coatJitter'), DEFAULT_AVATAR_COAT_PATTERN.jitter, AVATAR_COAT_PATTERN_RANGES.jitter.min, AVATAR_COAT_PATTERN_RANGES.jitter.max),
  lightPatchLength: parseRangeValue(params.get('coatLightPatchLength'), DEFAULT_AVATAR_COAT_PATTERN.lightPatchLength!, AVATAR_COAT_PATTERN_RANGES.lightPatchLength.min, AVATAR_COAT_PATTERN_RANGES.lightPatchLength.max),
  lightPatchOffsetY: parseRangeValue(params.get('coatLightPatchOffsetY'), DEFAULT_AVATAR_COAT_PATTERN.lightPatchOffsetY!, AVATAR_COAT_PATTERN_RANGES.lightPatchOffsetY.min, AVATAR_COAT_PATTERN_RANGES.lightPatchOffsetY.max),
  lightPatchShape: ['face-mask', 'ellipse', 'rounded'].includes(params.get('coatLightPatchShape') ?? '')
    ? params.get('coatLightPatchShape') as NonNullable<AvatarCoatPattern['lightPatchShape']>
    : DEFAULT_AVATAR_COAT_PATTERN.lightPatchShape,
  lightPatchWidth: parseRangeValue(params.get('coatLightPatchWidth'), DEFAULT_AVATAR_COAT_PATTERN.lightPatchWidth!, AVATAR_COAT_PATTERN_RANGES.lightPatchWidth.min, AVATAR_COAT_PATTERN_RANGES.lightPatchWidth.max),
  seed: normalizeEditorAvatarSeed(params.get('coatSeed') ?? params.get('seed') ?? fallbackSeed),
  symmetry: parseRangeValue(params.get('coatSymmetry'), DEFAULT_AVATAR_COAT_PATTERN.symmetry, AVATAR_COAT_PATTERN_RANGES.symmetry.min, AVATAR_COAT_PATTERN_RANGES.symmetry.max),
  thickness: parseRangeValue(params.get('coatThickness'), DEFAULT_AVATAR_COAT_PATTERN.thickness, AVATAR_COAT_PATTERN_RANGES.thickness.min, AVATAR_COAT_PATTERN_RANGES.thickness.max)
})

const parseAnimationSelectionKey = (value: string | null): AvatarAnimationSelectionKey | null => {
  if (value == null) return null
  if (value === 'shared') return 'shared'
  if (value.startsWith('preset:')) {
    const presetId = value.slice('preset:'.length)
    return AVATAR_ANIMATION_PRESETS.some(preset => preset.id === presetId)
      ? value as AvatarAnimationSelectionKey
      : null
  }
  return null
}

const parseLinkEyes = (value: string | null, leftEye: string, rightEye: string) => {
  if (value === '1' || value === 'true' || value === 'same') return true
  if (value === '0' || value === 'false' || value === 'split') return false
  return leftEye === rightEye
}

const constrainSeededBreedFaceStyle = (
  faceStyle: AvatarFaceStyle,
  entityPreset: AvatarEntityPreset,
  bearBreedTemplateId: string | null,
  animalBreedTemplateId: string | null
): AvatarFaceStyle => {
  const fixedFaceStyle = entityPreset === 'bear'
    ? getAvatarBearBreedTemplate(bearBreedTemplateId)?.fixed.faceStyle
    : isAvatarAnimalSpeciesId(entityPreset)
      ? getAvatarAnimalBreedTemplate(entityPreset, animalBreedTemplateId)?.fixed.faceStyle
      : undefined
  if (fixedFaceStyle == null) return faceStyle

  const anatomicalFaceStyle = resolveAvatarEntityPresetFaceStyle(entityPreset, fixedFaceStyle)
  if (anatomicalFaceStyle == null) return faceStyle

  return {
    ...faceStyle,
    mouthEnabled: anatomicalFaceStyle.mouthEnabled,
    noseEnabled: anatomicalFaceStyle.noseEnabled,
    noseHeight: anatomicalFaceStyle.noseHeight,
    noseRotation: anatomicalFaceStyle.noseRotation,
    noseShape: anatomicalFaceStyle.noseShape,
    noseWidth: anatomicalFaceStyle.noseWidth,
    noseY: anatomicalFaceStyle.noseY
  }
}

const getApplicableAvatarSeedFields = (
  entityPreset: AvatarEntityPreset,
  includeEntityPreset: boolean
): readonly AvatarSeedField[] => {
  const hasCoatPattern = entityPreset === 'cat' || entityPreset === 'dog' ||
    entityPreset === 'rabbit' || entityPreset === 'bear' || isAvatarAnimalSpeciesId(entityPreset)

  return AVATAR_SEED_FIELDS.filter(field => {
    if (!includeEntityPreset && field === AVATAR_SEED_FIELD.entityPreset) return false

    const fieldEntityPreset = getAvatarSeedFieldEntityPreset(field)
    if (fieldEntityPreset != null && fieldEntityPreset !== entityPreset) return false

    return hasCoatPattern || !field.startsWith('scene.appearance.coatPattern.')
  })
}

const parseQueryConfig = (
  params: URLSearchParams,
  fallbackSeed = createRandomAvatarSeed()
): AvatarQueryConfig => {
  const queryFace = params.get('face') ?? ''
  const emoticon = isSupportedAvatarGlyphExpression(queryFace) ? queryFace : INITIAL_EMOTICON
  const parts = Array.from(emoticon)
  let coatPattern = parseAvatarCoatPattern(params, fallbackSeed)
  const queryPaletteId = params.get('palette') ?? ''
  let selectedPaletteId = AVATAR_PALETTES.some(palette => palette.id === queryPaletteId)
    ? queryPaletteId
    : coatPattern.enabled ? DEFAULT_TABBY_PALETTE_ID : DEFAULT_PALETTE_ID
  const queryBackgroundStyle = params.get('bg')
  const backgroundStyle = isAvatarBackgroundStyle(queryBackgroundStyle)
    ? queryBackgroundStyle
    : DEFAULT_BACKGROUND_STYLE
  const leftEye = parts[0] ?? INITIAL_PARTS[0] ?? '0'
  const mouth = parts[1] ?? INITIAL_PARTS[1] ?? 'w'
  const queryRightEye = parts[2] ?? INITIAL_PARTS[2] ?? '0'
  const linkEyes = parseLinkEyes(params.get('eyes'), leftEye, queryRightEye)
  const rightEye = linkEyes ? leftEye : queryRightEye

  const animationSelectionKey = parseAnimationSelectionKey(params.get('animation'))
  const entityPreset = parseAvatarEntityPreset(params.get('entity'))
  const defaultViewState = entityPreset === 'fox'
    ? getAvatarEntityPresetScene('fox')?.viewState ?? DEFAULT_AVATAR_VIEW_STATE
    : DEFAULT_AVATAR_VIEW_STATE
  const breedParam = params.get('breed')
  const animalBreedTemplateId = isAvatarAnimalSpeciesId(entityPreset) && breedParam != null && breedParam.trim() !== ''
    ? breedParam.trim()
    : null
  const catBreedTemplateId = entityPreset === 'cat' && breedParam != null && breedParam.trim() !== ''
    ? breedParam.trim()
    : null
  const dogBreedTemplateId = entityPreset === 'dog' && breedParam != null && breedParam.trim() !== ''
    ? breedParam.trim()
    : null
  const rabbitBreedTemplateId = entityPreset === 'rabbit' && breedParam != null && breedParam.trim() !== ''
    ? breedParam.trim()
    : null
  const bearBreedTemplateId = entityPreset === 'bear' && breedParam != null && breedParam.trim() !== ''
    ? breedParam.trim()
    : null
  const bearBreedTemplate = getAvatarBearBreedTemplate(bearBreedTemplateId)
  const animalBreedTemplate = isAvatarAnimalSpeciesId(entityPreset)
    ? getAvatarAnimalBreedTemplate(entityPreset, animalBreedTemplateId)
    : null
  const concreteSeed = normalizeEditorAvatarSeed(params.get('seed') ?? fallbackSeed)
  const defaultBearBreed = entityPreset === 'bear' && bearBreedTemplate != null
    ? resolveAvatarBearBreedTemplate(bearBreedTemplate, concreteSeed, coatPattern)
    : null
  const defaultAnimalBreed = animalBreedTemplate == null
    ? null
    : resolveAvatarAnimalBreedTemplate(animalBreedTemplate, concreteSeed, coatPattern)
  const breedFaceStyle = defaultBearBreed?.faceStyle ?? defaultAnimalBreed?.faceStyle
  if (!params.has('coat')) {
    coatPattern = defaultBearBreed?.coatPattern ?? defaultAnimalBreed?.coatPattern ?? coatPattern
  }
  if (!params.has('palette')) {
    selectedPaletteId = defaultBearBreed?.paletteId ?? defaultAnimalBreed?.paletteId ?? selectedPaletteId
  }
  const rawEntityParts = params.has('entityParts')
    ? deserializeAvatarEntityParts(params.get('entityParts'), entityPreset)
    : defaultBearBreed?.entityParts ?? defaultAnimalBreed?.entityParts ??
      deserializeAvatarEntityParts(params.get('entityParts'), entityPreset)
  const catEarWidth = params.has('catEarWidth')
    ? parseRangeValue(params.get('catEarWidth'), 100, CAT_EAR_SCALE_RANGE.min, CAT_EAR_SCALE_RANGE.max)
    : null
  const catEarHeight = params.has('catEarHeight')
    ? parseRangeValue(params.get('catEarHeight'), 100, CAT_EAR_SCALE_RANGE.min, CAT_EAR_SCALE_RANGE.max)
    : null
  const dogEarWidth = params.has('dogEarWidth')
    ? parseRangeValue(params.get('dogEarWidth'), 100, DOG_EAR_SCALE_RANGE.min, DOG_EAR_SCALE_RANGE.max)
    : null
  const dogEarHeight = params.has('dogEarHeight')
    ? parseRangeValue(params.get('dogEarHeight'), 100, DOG_EAR_SCALE_RANGE.min, DOG_EAR_SCALE_RANGE.max)
    : null
  const dogHeadWidth = params.has('dogHeadWidth')
    ? parseRangeValue(params.get('dogHeadWidth'), 100, DOG_HEAD_SCALE_RANGE.min, DOG_HEAD_SCALE_RANGE.max)
    : null
  const dogHeadHeight = params.has('dogHeadHeight')
    ? parseRangeValue(params.get('dogHeadHeight'), 100, DOG_HEAD_SCALE_RANGE.min, DOG_HEAD_SCALE_RANGE.max)
    : null
  const rabbitEarWidth = params.has('rabbitEarWidth')
    ? parseRangeValue(params.get('rabbitEarWidth'), 100, RABBIT_EAR_SCALE_RANGE.min, RABBIT_EAR_SCALE_RANGE.max)
    : null
  const rabbitEarHeight = params.has('rabbitEarHeight')
    ? parseRangeValue(params.get('rabbitEarHeight'), 100, RABBIT_EAR_SCALE_RANGE.min, RABBIT_EAR_SCALE_RANGE.max)
    : null
  const rabbitHeadWidth = params.has('rabbitHeadWidth')
    ? parseRangeValue(params.get('rabbitHeadWidth'), 100, RABBIT_HEAD_SCALE_RANGE.min, RABBIT_HEAD_SCALE_RANGE.max)
    : null
  const rabbitHeadHeight = params.has('rabbitHeadHeight')
    ? parseRangeValue(params.get('rabbitHeadHeight'), 100, RABBIT_HEAD_SCALE_RANGE.min, RABBIT_HEAD_SCALE_RANGE.max)
    : null
  const bearEarWidth = params.has('bearEarWidth')
    ? parseRangeValue(params.get('bearEarWidth'), 100, BEAR_EAR_SCALE_RANGE.min, BEAR_EAR_SCALE_RANGE.max) : null
  const bearEarHeight = params.has('bearEarHeight')
    ? parseRangeValue(params.get('bearEarHeight'), 100, BEAR_EAR_SCALE_RANGE.min, BEAR_EAR_SCALE_RANGE.max) : null
  const bearHeadWidth = params.has('bearHeadWidth')
    ? parseRangeValue(params.get('bearHeadWidth'), 100, BEAR_HEAD_SCALE_RANGE.min, BEAR_HEAD_SCALE_RANGE.max) : null
  const bearHeadHeight = params.has('bearHeadHeight')
    ? parseRangeValue(params.get('bearHeadHeight'), 100, BEAR_HEAD_SCALE_RANGE.min, BEAR_HEAD_SCALE_RANGE.max) : null
  const animalEarRange = isAvatarAnimalSpeciesId(entityPreset)
    ? getAvatarAnimalScaleRange(entityPreset, 'ear')
    : { max: 155, min: 55 }
  const animalHeadRange = isAvatarAnimalSpeciesId(entityPreset)
    ? getAvatarAnimalScaleRange(entityPreset, 'head')
    : { max: 134, min: 76 }
  const animalEarWidth = isAvatarAnimalSpeciesId(entityPreset) && params.has(`${entityPreset}EarWidth`)
    ? parseRangeValue(params.get(`${entityPreset}EarWidth`), 100, animalEarRange.min, animalEarRange.max)
    : null
  const animalEarHeight = isAvatarAnimalSpeciesId(entityPreset) && params.has(`${entityPreset}EarHeight`)
    ? parseRangeValue(params.get(`${entityPreset}EarHeight`), 100, animalEarRange.min, animalEarRange.max)
    : null
  const animalHeadWidth = isAvatarAnimalSpeciesId(entityPreset) && params.has(`${entityPreset}HeadWidth`)
    ? parseRangeValue(params.get(`${entityPreset}HeadWidth`), 100, animalHeadRange.min, animalHeadRange.max)
    : null
  const animalHeadHeight = isAvatarAnimalSpeciesId(entityPreset) && params.has(`${entityPreset}HeadHeight`)
    ? parseRangeValue(params.get(`${entityPreset}HeadHeight`), 100, animalHeadRange.min, animalHeadRange.max)
    : null
  const animalHornQueryKey = entityPreset === 'deer'
    ? 'deerAntlerSize'
    : entityPreset === 'sheep' ? 'sheepHornSize' : null
  const animalHornSize = animalHornQueryKey != null && params.has(animalHornQueryKey)
    ? parseRangeValue(params.get(animalHornQueryKey), 100, 60, 145)
    : null
  const entityParts = entityPreset === 'cat'
    ? applyCatEarScale(rawEntityParts, catEarWidth ?? undefined, catEarHeight ?? undefined)
    : entityPreset === 'dog'
      ? applyDogHeadScale(
        applyDogEarScale(rawEntityParts, dogEarWidth ?? undefined, dogEarHeight ?? undefined),
        dogHeadWidth ?? undefined,
        dogHeadHeight ?? undefined
      )
      : entityPreset === 'rabbit'
        ? applyRabbitHeadScale(
          applyRabbitEarScale(rawEntityParts, rabbitEarWidth ?? undefined, rabbitEarHeight ?? undefined),
          rabbitHeadWidth ?? undefined,
          rabbitHeadHeight ?? undefined
        )
      : entityPreset === 'bear'
        ? applyAvatarBearBreedForeground(
          applyBearHeadScale(applyBearEarScale(rawEntityParts, bearEarWidth ?? undefined, bearEarHeight ?? undefined), bearHeadWidth ?? undefined, bearHeadHeight ?? undefined),
          getAvatarBearBreedTemplate(bearBreedTemplateId)
        )
      : isAvatarAnimalSpeciesId(entityPreset)
        ? applyAvatarAnimalDimensions(rawEntityParts, entityPreset, {
          ...(animalEarWidth == null ? {} : { earWidth: animalEarWidth }),
          ...(animalEarHeight == null ? {} : { earHeight: animalEarHeight }),
          ...(animalHeadWidth == null ? {} : { headWidth: animalHeadWidth }),
          ...(animalHeadHeight == null ? {} : { headHeight: animalHeadHeight }),
          ...(animalHornSize == null ? {} : { hornSize: animalHornSize })
        }, animalBreedTemplate?.fixed.hornStyle)
      : rawEntityParts
  const sharedAnimation = animationSelectionKey === 'shared'
    ? deserializeSharedAvatarAnimation(params.get('animationData'))
    : null

  const parsedSeedFields = parseAvatarSeedFields(params.get('seedFields'))
  const seededFields = (parsedSeedFields.includes('scene.decals.coatPattern')
    ? [
      ...parsedSeedFields.filter(field => field !== 'scene.decals.coatPattern'),
      AVATAR_SEED_FIELD.coatPatternAlgorithm,
      AVATAR_SEED_FIELD.coatPatternSeed
    ]
    : parsedSeedFields).filter(field => {
      const fieldEntityPreset = getAvatarSeedFieldEntityPreset(field)
      return fieldEntityPreset == null || fieldEntityPreset === entityPreset
    })
  return {
    animationOpen: parseShadow(params.get('animationPanel')),
    animationSelectionKey: animationSelectionKey === 'shared' && sharedAnimation == null
      ? null
      : animationSelectionKey,
    avatarShadowStyle: {
      color: parseAvatarShadowColor(params.get('avatarShadowColor')),
      direction: parseRangeValue(
        params.get('avatarShadowDir'),
        DEFAULT_AVATAR_SHADOW_STYLE.direction,
        AVATAR_SHADOW_RANGES.avatar.direction.min,
        AVATAR_SHADOW_RANGES.avatar.direction.max
      ),
      distance: parseRangeValue(
        params.get('avatarShadowDist'),
        DEFAULT_AVATAR_SHADOW_STYLE.distance,
        AVATAR_SHADOW_RANGES.avatar.distance.min,
        AVATAR_SHADOW_RANGES.avatar.distance.max
      ),
      opacity: parseRangeValue(
        params.get('avatarShadowOpacity'),
        DEFAULT_AVATAR_SHADOW_STYLE.opacity,
        AVATAR_SHADOW_RANGES.avatar.opacity.min,
        AVATAR_SHADOW_RANGES.avatar.opacity.max
      ),
      softness: parseRangeValue(
        params.get('avatarShadowSoft'),
        DEFAULT_AVATAR_SHADOW_STYLE.softness,
        AVATAR_SHADOW_RANGES.avatar.softness.min,
        AVATAR_SHADOW_RANGES.avatar.softness.max
      )
    },
    avatarOutlineStyle: {
      color: parseOutlineColor(params.get('outlineColor')),
      opacity: parseRangeValue(
        params.get('outlineOpacity'),
        DEFAULT_AVATAR_OUTLINE_STYLE.opacity,
        AVATAR_OUTLINE_RANGES.opacity.min,
        AVATAR_OUTLINE_RANGES.opacity.max
      ),
      width: parseRangeValue(
        params.get('outlineWidth'),
        DEFAULT_AVATAR_OUTLINE_STYLE.width,
        AVATAR_OUTLINE_RANGES.width.min,
        AVATAR_OUTLINE_RANGES.width.max
      )
    },
    backgroundStyle,
    bodyShape: parseBodyShape(params.get('shape')),
    bodyBottomTaper: parseRangeValue(
      params.get('bottomTaper'),
      0,
      AVATAR_ENTITY_RANGES.bottomTaper.min,
      AVATAR_ENTITY_RANGES.bottomTaper.max
    ),
    cameraBackground: parseCameraBackground(params.get('cameraBg')),
    cameraFrame: parseCameraFrame(params.get('cameraFrame')),
    cameraMode: parseShadow(params.get('camera')),
    animalBreedTemplateId,
    animalEarHeight,
    animalEarWidth,
    animalHeadHeight,
    animalHeadWidth,
    animalHornSize,
    catBreedTemplateId,
    catEarHeight,
    catEarWidth,
    dogBreedTemplateId,
    dogEarHeight,
    dogEarWidth,
    dogHeadHeight,
    dogHeadWidth,
    rabbitBreedTemplateId,
    rabbitEarHeight,
    rabbitEarWidth,
    rabbitHeadHeight,
    rabbitHeadWidth,
    bearBreedTemplateId,
    bearEarHeight,
    bearEarWidth,
    bearHeadHeight,
    bearHeadWidth,
    coatPattern,
    controlsCollapsed: params.get('sidebar') === '0',
    entityParts,
    entityPreset,
    exportSize: parseExportSize(params.get('size')),
    faceStyle: {
      eyeHighlight: {
        color: parseOutlineColor(params.get('eyeHighlightColor')),
        enabled: parseShadow(params.get('eyeHighlight')),
        offsetX: parseRangeValue(
          params.get('eyeHighlightX'),
          DEFAULT_AVATAR_FACE_STYLE.eyeHighlight.offsetX,
          AVATAR_EYE_HIGHLIGHT_RANGES.offsetX.min,
          AVATAR_EYE_HIGHLIGHT_RANGES.offsetX.max
        ),
        offsetY: parseRangeValue(
          params.get('eyeHighlightY'),
          DEFAULT_AVATAR_FACE_STYLE.eyeHighlight.offsetY,
          AVATAR_EYE_HIGHLIGHT_RANGES.offsetY.min,
          AVATAR_EYE_HIGHLIGHT_RANGES.offsetY.max
        ),
        opacity: parseRangeValue(
          params.get('eyeHighlightOpacity'),
          DEFAULT_AVATAR_FACE_STYLE.eyeHighlight.opacity,
          AVATAR_EYE_HIGHLIGHT_RANGES.opacity.min,
          AVATAR_EYE_HIGHLIGHT_RANGES.opacity.max
        ),
        size: parseRangeValue(
          params.get('eyeHighlightSize'),
          DEFAULT_AVATAR_FACE_STYLE.eyeHighlight.size,
          AVATAR_EYE_HIGHLIGHT_RANGES.size.min,
          AVATAR_EYE_HIGHLIGHT_RANGES.size.max
        )
      },
      eyeRoundness: parseRangeValue(
        params.get('eyeRound'),
        breedFaceStyle?.eyeRoundness ?? DEFAULT_AVATAR_FACE_STYLE.eyeRoundness,
        AVATAR_FACE_RANGES.eyeRoundness.min,
        AVATAR_FACE_RANGES.eyeRoundness.max
      ),
      eyeShape: parseEyeShape(params.get('eyeShape')),
      gap: parseRangeValue(
        params.get('eyeGap'),
        breedFaceStyle?.gap ?? DEFAULT_AVATAR_FACE_STYLE.gap,
        AVATAR_FACE_RANGES.gap.min,
        AVATAR_FACE_RANGES.gap.max
      ),
      height: parseRangeValue(
        params.get('eyeH'),
        breedFaceStyle?.height ?? DEFAULT_AVATAR_FACE_STYLE.height,
        AVATAR_FACE_RANGES.height.min,
        AVATAR_FACE_RANGES.height.max
      ),
      leftEyeHeight: params.has('eyeLeftH')
        ? parseRangeValue(
          params.get('eyeLeftH'),
          DEFAULT_AVATAR_FACE_STYLE.height,
          AVATAR_FACE_RANGES.leftEyeHeight.min,
          AVATAR_FACE_RANGES.leftEyeHeight.max
        )
        : undefined,
      leftEyeWidth: params.has('eyeLeftW')
        ? parseRangeValue(params.get('eyeLeftW'), DEFAULT_AVATAR_FACE_STYLE.width, AVATAR_FACE_RANGES.leftEyeWidth.min, AVATAR_FACE_RANGES.leftEyeWidth.max)
        : undefined,
      leftEyeRotation: parseRangeValue(
        params.get('eyeLeftRot'),
        breedFaceStyle?.leftEyeRotation ?? DEFAULT_AVATAR_FACE_STYLE.leftEyeRotation,
        AVATAR_FACE_RANGES.leftEyeRotation.min,
        AVATAR_FACE_RANGES.leftEyeRotation.max
      ),
      mouthCurve: parseRangeValue(
        params.get('mouthCurve'),
        DEFAULT_AVATAR_FACE_STYLE.mouthCurve,
        AVATAR_FACE_RANGES.mouthCurve.min,
        AVATAR_FACE_RANGES.mouthCurve.max
      ),
      mouthEnabled: params.has('mouth')
        ? parseShadow(params.get('mouth'))
        : breedFaceStyle?.mouthEnabled ?? DEFAULT_AVATAR_FACE_STYLE.mouthEnabled,
      mouthHeight: parseRangeValue(
        params.get('mouthH'),
        DEFAULT_AVATAR_FACE_STYLE.mouthHeight,
        AVATAR_FACE_RANGES.mouthHeight.min,
        AVATAR_FACE_RANGES.mouthHeight.max
      ),
      mouthRotation: parseRangeValue(
        params.get('mouthRot'),
        DEFAULT_AVATAR_FACE_STYLE.mouthRotation,
        AVATAR_FACE_RANGES.mouthRotation.min,
        AVATAR_FACE_RANGES.mouthRotation.max
      ),
      mouthShape: parseMouthShape(params.get('mouthShape')),
      mouthWidth: parseRangeValue(
        params.get('mouthW'),
        DEFAULT_AVATAR_FACE_STYLE.mouthWidth,
        AVATAR_FACE_RANGES.mouthWidth.min,
        AVATAR_FACE_RANGES.mouthWidth.max
      ),
      mouthY: parseRangeValue(
        params.get('mouthY'),
        DEFAULT_AVATAR_FACE_STYLE.mouthY,
        AVATAR_FACE_RANGES.mouthY.min,
        AVATAR_FACE_RANGES.mouthY.max
      ),
      noseEnabled: params.has('nose')
        ? parseShadow(params.get('nose'))
        : breedFaceStyle?.noseEnabled ?? DEFAULT_AVATAR_FACE_STYLE.noseEnabled,
      noseHeight: parseRangeValue(
        params.get('noseH'),
        breedFaceStyle?.noseHeight ?? DEFAULT_AVATAR_FACE_STYLE.noseHeight,
        AVATAR_FACE_RANGES.noseHeight.min,
        AVATAR_FACE_RANGES.noseHeight.max
      ),
      noseRotation: parseRangeValue(
        params.get('noseRot'),
        DEFAULT_AVATAR_FACE_STYLE.noseRotation,
        AVATAR_FACE_RANGES.noseRotation.min,
        AVATAR_FACE_RANGES.noseRotation.max
      ),
      noseShape: params.has('noseShape')
        ? parseNoseShape(params.get('noseShape'))
        : breedFaceStyle?.noseShape ?? DEFAULT_AVATAR_FACE_STYLE.noseShape,
      noseWidth: parseRangeValue(
        params.get('noseW'),
        breedFaceStyle?.noseWidth ?? DEFAULT_AVATAR_FACE_STYLE.noseWidth,
        AVATAR_FACE_RANGES.noseWidth.min,
        AVATAR_FACE_RANGES.noseWidth.max
      ),
      noseY: parseRangeValue(
        params.get('noseY'),
        breedFaceStyle?.noseY ?? DEFAULT_AVATAR_FACE_STYLE.noseY,
        AVATAR_FACE_RANGES.noseY.min,
        AVATAR_FACE_RANGES.noseY.max
      ),
      rotation: parseRangeValue(
        params.get('eyeRot'),
        DEFAULT_AVATAR_FACE_STYLE.rotation,
        AVATAR_FACE_RANGES.rotation.min,
        AVATAR_FACE_RANGES.rotation.max
      ),
      rightEyeRotation: parseRangeValue(
        params.get('eyeRightRot'),
        breedFaceStyle?.rightEyeRotation ?? DEFAULT_AVATAR_FACE_STYLE.rightEyeRotation,
        AVATAR_FACE_RANGES.rightEyeRotation.min,
        AVATAR_FACE_RANGES.rightEyeRotation.max
      ),
      rightEyeHeight: params.has('eyeRightH')
        ? parseRangeValue(
          params.get('eyeRightH'),
          DEFAULT_AVATAR_FACE_STYLE.height,
          AVATAR_FACE_RANGES.rightEyeHeight.min,
          AVATAR_FACE_RANGES.rightEyeHeight.max
        )
        : undefined,
      rightEyeWidth: params.has('eyeRightW')
        ? parseRangeValue(params.get('eyeRightW'), DEFAULT_AVATAR_FACE_STYLE.width, AVATAR_FACE_RANGES.rightEyeWidth.min, AVATAR_FACE_RANGES.rightEyeWidth.max)
        : undefined,
      width: parseRangeValue(
        params.get('eyeW'),
        breedFaceStyle?.width ?? DEFAULT_AVATAR_FACE_STYLE.width,
        AVATAR_FACE_RANGES.width.min,
        AVATAR_FACE_RANGES.width.max
      )
    },
    faceShadowStyle: {
      color: parseOptionalShadowColor(params.get('shadowColor')),
      direction: parseRangeValue(
        params.get('shadowDir'),
        DEFAULT_AVATAR_FACE_SHADOW_STYLE.direction,
        AVATAR_SHADOW_RANGES.face.direction.min,
        AVATAR_SHADOW_RANGES.face.direction.max
      ),
      distance: parseRangeValue(
        params.get('shadowDist'),
        DEFAULT_AVATAR_FACE_SHADOW_STYLE.distance,
        AVATAR_SHADOW_RANGES.face.distance.min,
        AVATAR_SHADOW_RANGES.face.distance.max
      ),
      opacity: parseRangeValue(
        params.get('shadowOpacity'),
        DEFAULT_AVATAR_FACE_SHADOW_STYLE.opacity,
        AVATAR_SHADOW_RANGES.face.opacity.min,
        AVATAR_SHADOW_RANGES.face.opacity.max
      ),
      softness: parseRangeValue(
        params.get('shadowSoft'),
        DEFAULT_AVATAR_FACE_SHADOW_STYLE.softness,
        AVATAR_SHADOW_RANGES.face.softness.min,
        AVATAR_SHADOW_RANGES.face.softness.max
      )
    },
    frameShadowStyle: {
      color: parseOptionalShadowColor(params.get('frameShadowColor')),
      direction: parseRangeValue(
        params.get('frameShadowDir'),
        DEFAULT_FRAME_SHADOW_STYLE.direction,
        AVATAR_SHADOW_RANGES.frame.direction.min,
        AVATAR_SHADOW_RANGES.frame.direction.max
      ),
      distance: parseRangeValue(
        params.get('frameShadowDist'),
        DEFAULT_FRAME_SHADOW_STYLE.distance,
        AVATAR_SHADOW_RANGES.frame.distance.min,
        AVATAR_SHADOW_RANGES.frame.distance.max
      ),
      opacity: parseRangeValue(
        params.get('frameShadowOpacity'),
        DEFAULT_FRAME_SHADOW_STYLE.opacity,
        AVATAR_SHADOW_RANGES.frame.opacity.min,
        AVATAR_SHADOW_RANGES.frame.opacity.max
      ),
      softness: parseRangeValue(
        params.get('frameShadowSoft'),
        DEFAULT_FRAME_SHADOW_STYLE.softness,
        AVATAR_SHADOW_RANGES.frame.softness.min,
        AVATAR_SHADOW_RANGES.frame.softness.max
      )
    },
    gridDensity: parseRangeValue(
      params.get('gridDensity'),
      AVATAR_GRID_DENSITY.default,
      AVATAR_GRID_DENSITY.min,
      AVATAR_GRID_DENSITY.max
    ),
    interactionMode: parseInteractionMode(params.get('mode')),
    lightAzimuth: parseRangeValue(
      params.get('lightAz'),
      DEFAULT_LIGHT_AZIMUTH,
      AVATAR_LIGHTING_RANGES.azimuth.min,
      AVATAR_LIGHTING_RANGES.azimuth.max
    ),
    lightDistance: parseRangeValue(
      params.get('lightDist'),
      DEFAULT_LIGHT_DISTANCE,
      AVATAR_LIGHTING_RANGES.distance.min,
      AVATAR_LIGHTING_RANGES.distance.max
    ),
    lightElevation: parseRangeValue(
      params.get('lightEl'),
      DEFAULT_LIGHT_ELEVATION,
      AVATAR_LIGHTING_RANGES.elevation.min,
      AVATAR_LIGHTING_RANGES.elevation.max
    ),
    leftEye,
    linkEyes,
    mouth,
    pixelEffect: {
      blockSize: Math.round(parseRangeValue(
        params.get('pixelSize'),
        DEFAULT_AVATAR_PIXEL_EFFECT.blockSize,
        AVATAR_PIXEL_EFFECT_RANGES.blockSize.min,
        AVATAR_PIXEL_EFFECT_RANGES.blockSize.max
      )),
      dithering: params.get('pixelDither') === 'ordered'
        ? 'ordered'
        : DEFAULT_AVATAR_PIXEL_EFFECT.dithering,
      enabled: parseShadow(params.get('pixel')),
      paletteSize:
        AVATAR_PIXEL_EFFECT_RANGES.paletteSizes.includes(Number(params.get('pixelColors')) as 8 | 16 | 32 | 64)
          ? Number(params.get('pixelColors')) as 8 | 16 | 32 | 64
          : DEFAULT_AVATAR_PIXEL_EFFECT.paletteSize,
      sampling: parseAvatarPixelSampling(params.get('pixelSample'))
    },
    rightEye,
    seed: normalizeEditorAvatarSeed(params.get('seed') ?? fallbackSeed),
    seededFields,
    selectedPaletteId,
    showLight: parseLight(params.get('light')),
    showOutline: params.get('outline') == null ? true : parseShadow(params.get('outline')),
    showAvatarShadow: parseShadow(params.get('avatarShadow')),
    showFrameShadow: params.get('frameShadow') == null ? true : parseShadow(params.get('frameShadow')),
    showShadow: parseShadow(params.get('shadow')),
    surfaceDecals: (
      params.has('decals')
        ? deserializeAvatarSurfaceDecals(params.get('decals'), entityParts.map(part => part.id))
        : defaultAnimalBreed?.surfaceDecals?.map(decal => {
          if (
            !params.has('entityParts') ||
            seededFields.includes(AVATAR_SEED_FIELD.palette) ||
            animalBreedTemplate?.fixed.surfaceFaceMarkings == null ||
            decal.id !== `${entityPreset}-face-mask`
          ) {
            return decal
          }

          const concretePalette = resolveAvatarBreedPaletteFromEntityParts(
            getAvatarPalette(selectedPaletteId),
            entityParts
          )
          const color = entityPreset === 'deer' || entityPreset === 'otter'
            ? concretePalette.coat?.patch ?? animalBreedTemplate.fixed.surfaceFaceMarkings.color
            : animalBreedTemplate.fixed.surfaceFaceMarkings.color

          return { ...decal, color }
        }) ?? []
    ).filter(decal => !decal.id.startsWith('seed-tabby-')),
    sharedAnimation,
    viewState: {
      pitch: parseFiniteValue(params.get('pitch'), defaultViewState.pitch),
      positionX: parseRangeValue(
        params.get('positionX'),
        defaultViewState.positionX,
        -AVATAR_VIEW_LIMITS.maxPosition,
        AVATAR_VIEW_LIMITS.maxPosition
      ),
      positionY: parseRangeValue(
        params.get('positionY'),
        defaultViewState.positionY,
        -AVATAR_VIEW_LIMITS.maxPosition,
        AVATAR_VIEW_LIMITS.maxPosition
      ),
      roll: parseFiniteValue(params.get('roll'), defaultViewState.roll),
      scale: parseRangeValue(
        params.get('scale'),
        defaultViewState.scale,
        AVATAR_VIEW_LIMITS.minScale,
        AVATAR_VIEW_LIMITS.maxScale
      ),
      yaw: parseFiniteValue(params.get('yaw'), defaultViewState.yaw)
    }
  }
}

const resolveSeededQueryConfig = (config: AvatarQueryConfig): AvatarQueryConfig => {
  if (config.seededFields.length === 0) return config
  const breedTemplate = isAvatarAnimalSpeciesId(config.entityPreset)
    ? getAvatarAnimalBreedTemplate(config.entityPreset, config.animalBreedTemplateId)
    : config.entityPreset === 'dog'
    ? getAvatarDogBreedTemplate(config.dogBreedTemplateId)
    : config.entityPreset === 'rabbit'
      ? getAvatarRabbitBreedTemplate(config.rabbitBreedTemplateId)
      : config.entityPreset === 'bear'
        ? getAvatarBearBreedTemplate(config.bearBreedTemplateId)
        : getAvatarCatBreedTemplate(config.catBreedTemplateId)
  const seedDomain = breedTemplate?.seedDomain
  let next = config
  if (config.seededFields.includes(AVATAR_SEED_FIELD.entityPreset)) {
    const preset = resolveSeededAvatarEntityPreset(config.seed)
    const parts = createAvatarEntityParts(preset)
    const entityChanged = preset !== config.entityPreset
    next = {
      ...next,
      bodyShape: 'sphere',
      bodyBottomTaper: 0,
      entityParts: config.seededFields.includes(AVATAR_SEED_FIELD.palette)
        ? parts
        : applyAvatarEntityPalette(parts, getAvatarPalette(config.selectedPaletteId)),
      entityPreset: preset,
      animalBreedTemplateId: isAvatarAnimalSpeciesId(preset) ? config.animalBreedTemplateId : null,
      animalEarHeight: isAvatarAnimalSpeciesId(preset) ? config.animalEarHeight : null,
      animalEarWidth: isAvatarAnimalSpeciesId(preset) ? config.animalEarWidth : null,
      animalHeadHeight: isAvatarAnimalSpeciesId(preset) ? config.animalHeadHeight : null,
      animalHeadWidth: isAvatarAnimalSpeciesId(preset) ? config.animalHeadWidth : null,
      animalHornSize: preset === 'deer' || preset === 'sheep' ? config.animalHornSize : null,
      catBreedTemplateId: preset === 'cat' ? config.catBreedTemplateId : null,
      dogBreedTemplateId: preset === 'dog' ? config.dogBreedTemplateId : null,
      rabbitBreedTemplateId: preset === 'rabbit' ? config.rabbitBreedTemplateId : null,
      bearBreedTemplateId: preset === 'bear' ? config.bearBreedTemplateId : null,
      surfaceDecals: entityChanged
        ? getAvatarEntityPresetScene(preset)?.surfaceDecals ?? []
        : config.surfaceDecals
    }
  }
  if (isAvatarAnimalSpeciesId(next.entityPreset)) {
    const species = next.entityPreset
    const fields = AVATAR_ANIMAL_SPECIES_SEED_FIELDS[species]
    const hornField = species === 'deer'
      ? AVATAR_SEED_FIELD.deerAntlerSize
      : species === 'sheep' ? AVATAR_SEED_FIELD.sheepHornSize : null
    const animalEarWidth = config.seededFields.includes(fields.earWidth)
      ? resolveSeededAvatarAnimalScale(config.seed, fields.earWidth, seedDomain)
      : next.animalEarWidth
    const animalEarHeight = config.seededFields.includes(fields.earHeight)
      ? resolveSeededAvatarAnimalScale(config.seed, fields.earHeight, seedDomain)
      : next.animalEarHeight
    const animalHeadWidth = config.seededFields.includes(fields.headWidth)
      ? resolveSeededAvatarAnimalScale(config.seed, fields.headWidth, seedDomain)
      : next.animalHeadWidth
    const animalHeadHeight = config.seededFields.includes(fields.headHeight)
      ? resolveSeededAvatarAnimalScale(config.seed, fields.headHeight, seedDomain)
      : next.animalHeadHeight
    const animalHornSize = hornField != null && config.seededFields.includes(hornField)
      ? resolveSeededAvatarAnimalScale(config.seed, hornField, seedDomain)
      : next.animalHornSize
    const animalTemplate = getAvatarAnimalBreedTemplate(species, next.animalBreedTemplateId)

    next = {
      ...next,
      animalEarHeight,
      animalEarWidth,
      animalHeadHeight,
      animalHeadWidth,
      animalHornSize,
      entityParts: applyAvatarAnimalDimensions(next.entityParts, species, {
        ...(animalEarWidth == null ? {} : { earWidth: animalEarWidth }),
        ...(animalEarHeight == null ? {} : { earHeight: animalEarHeight }),
        ...(animalHeadWidth == null ? {} : { headWidth: animalHeadWidth }),
        ...(animalHeadHeight == null ? {} : { headHeight: animalHeadHeight }),
        ...(animalHornSize == null ? {} : { hornSize: animalHornSize })
      }, animalTemplate?.fixed.hornStyle)
    }
  }
  const dogEarWidthSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.dogEarWidth)
  const dogEarHeightSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.dogEarHeight)
  if (dogEarWidthSeeded || dogEarHeightSeeded) {
    const dogEarWidth = dogEarWidthSeeded
      ? resolveSeededAvatarDogEarScale(config.seed, 'width', seedDomain)
      : next.dogEarWidth
    const dogEarHeight = dogEarHeightSeeded
      ? resolveSeededAvatarDogEarScale(config.seed, 'height', seedDomain)
      : next.dogEarHeight
    next = {
      ...next,
      dogEarHeight,
      dogEarWidth,
      entityParts: next.entityPreset === 'dog'
        ? applyDogEarScale(next.entityParts, dogEarWidth ?? undefined, dogEarHeight ?? undefined)
        : next.entityParts
    }
  }
  const dogHeadWidthSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.dogHeadWidth)
  const dogHeadHeightSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.dogHeadHeight)
  if (dogHeadWidthSeeded || dogHeadHeightSeeded) {
    const dogHeadWidth = dogHeadWidthSeeded
      ? resolveSeededAvatarDogHeadScale(config.seed, 'width', seedDomain)
      : next.dogHeadWidth
    const dogHeadHeight = dogHeadHeightSeeded
      ? resolveSeededAvatarDogHeadScale(config.seed, 'height', seedDomain)
      : next.dogHeadHeight
    next = {
      ...next,
      dogHeadHeight,
      dogHeadWidth,
      entityParts: next.entityPreset === 'dog'
        ? applyDogHeadScale(next.entityParts, dogHeadWidth ?? undefined, dogHeadHeight ?? undefined)
        : next.entityParts
    }
  }
  const catEarWidthSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.catEarWidth)
  const catEarHeightSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.catEarHeight)
  if (catEarWidthSeeded || catEarHeightSeeded) {
    const catEarWidth = catEarWidthSeeded
      ? resolveSeededAvatarCatEarScale(config.seed, 'width', seedDomain)
      : next.catEarWidth
    const catEarHeight = catEarHeightSeeded
      ? resolveSeededAvatarCatEarScale(config.seed, 'height', seedDomain)
      : next.catEarHeight
    next = {
      ...next,
      catEarHeight,
      catEarWidth,
      entityParts: next.entityPreset === 'cat'
        ? applyCatEarScale(next.entityParts, catEarWidth ?? undefined, catEarHeight ?? undefined)
        : next.entityParts
    }
  }
  const rabbitEarWidthSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.rabbitEarWidth)
  const rabbitEarHeightSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.rabbitEarHeight)
  if (rabbitEarWidthSeeded || rabbitEarHeightSeeded) {
    const rabbitEarWidth = rabbitEarWidthSeeded
      ? resolveSeededAvatarRabbitEarScale(config.seed, 'width', seedDomain)
      : next.rabbitEarWidth
    const rabbitEarHeight = rabbitEarHeightSeeded
      ? resolveSeededAvatarRabbitEarScale(config.seed, 'height', seedDomain)
      : next.rabbitEarHeight
    next = {
      ...next,
      rabbitEarHeight,
      rabbitEarWidth,
      entityParts: next.entityPreset === 'rabbit'
        ? applyRabbitEarScale(next.entityParts, rabbitEarWidth ?? undefined, rabbitEarHeight ?? undefined)
        : next.entityParts
    }
  }
  const rabbitHeadWidthSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.rabbitHeadWidth)
  const rabbitHeadHeightSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.rabbitHeadHeight)
  if (rabbitHeadWidthSeeded || rabbitHeadHeightSeeded) {
    const rabbitHeadWidth = rabbitHeadWidthSeeded
      ? resolveSeededAvatarRabbitHeadScale(config.seed, 'width', seedDomain)
      : next.rabbitHeadWidth
    const rabbitHeadHeight = rabbitHeadHeightSeeded
      ? resolveSeededAvatarRabbitHeadScale(config.seed, 'height', seedDomain)
      : next.rabbitHeadHeight
    next = {
      ...next,
      rabbitHeadHeight,
      rabbitHeadWidth,
      entityParts: next.entityPreset === 'rabbit'
        ? applyRabbitHeadScale(next.entityParts, rabbitHeadWidth ?? undefined, rabbitHeadHeight ?? undefined)
        : next.entityParts
    }
  }
  const bearEarWidthSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.bearEarWidth)
  const bearEarHeightSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.bearEarHeight)
  if (bearEarWidthSeeded || bearEarHeightSeeded) {
    const bearEarWidth = bearEarWidthSeeded ? resolveSeededAvatarBearEarScale(config.seed, 'width', seedDomain) : next.bearEarWidth
    const bearEarHeight = bearEarHeightSeeded ? resolveSeededAvatarBearEarScale(config.seed, 'height', seedDomain) : next.bearEarHeight
    next = { ...next, bearEarWidth, bearEarHeight, entityParts: next.entityPreset === 'bear' ? applyBearEarScale(next.entityParts, bearEarWidth ?? undefined, bearEarHeight ?? undefined) : next.entityParts }
  }
  const bearHeadWidthSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.bearHeadWidth)
  const bearHeadHeightSeeded = config.seededFields.includes(AVATAR_SEED_FIELD.bearHeadHeight)
  if (bearHeadWidthSeeded || bearHeadHeightSeeded) {
    const bearHeadWidth = bearHeadWidthSeeded ? resolveSeededAvatarBearHeadScale(config.seed, 'width', seedDomain) : next.bearHeadWidth
    const bearHeadHeight = bearHeadHeightSeeded ? resolveSeededAvatarBearHeadScale(config.seed, 'height', seedDomain) : next.bearHeadHeight
    next = { ...next, bearHeadWidth, bearHeadHeight, entityParts: next.entityPreset === 'bear' ? applyBearHeadScale(next.entityParts, bearHeadWidth ?? undefined, bearHeadHeight ?? undefined) : next.entityParts }
  }
  if (config.seededFields.includes(AVATAR_SEED_FIELD.facePreset)) {
    next = {
      ...next,
      faceStyle: constrainSeededBreedFaceStyle(
        resolveSeededAvatarFacePreset(config.seed).style,
        next.entityPreset,
        next.bearBreedTemplateId,
        next.animalBreedTemplateId
      )
    }
  }
  const coatPatternFields = AVATAR_SEED_FIELDS.filter(field => (
    field.startsWith('scene.appearance.coatPattern.') && config.seededFields.includes(field)
  ))
  if (coatPatternFields.length > 0) {
    next = {
      ...next,
      coatPattern: {
        ...resolveSeededAvatarCoatPattern(config.seed, next.coatPattern, coatPatternFields, seedDomain),
        enabled: true
      }
    }
  }
  if (config.seededFields.includes(AVATAR_SEED_FIELD.palette)) {
    const paletteId = seedDomain?.paletteIds != null
      ? resolveSeededAvatarPaletteId(config.seed, seedDomain.paletteIds)
      : next.entityPreset === 'dog' && next.coatPattern.enabled
        ? resolveSeededAvatarPaletteId(config.seed, AVATAR_DOG_COMPATIBLE_PALETTE_IDS)
        : next.entityPreset === 'cat' && next.coatPattern.enabled
          ? resolveSeededAvatarTabbyPaletteId(config.seed)
          : next.entityPreset === 'rabbit' && next.coatPattern.enabled
            ? resolveSeededAvatarPaletteId(config.seed, AVATAR_RABBIT_COMPATIBLE_PALETTE_IDS)
            : next.entityPreset === 'bear' && next.coatPattern.enabled
              ? resolveSeededAvatarPaletteId(config.seed, AVATAR_BEAR_COMPATIBLE_PALETTE_IDS)
              : isAvatarAnimalSpeciesId(next.entityPreset)
                ? resolveSeededAvatarPaletteId(
                  config.seed,
                  getAvatarAnimalBreedTemplates(next.entityPreset).map(template => template.fixed.paletteId)
                )
      : resolveSeededAvatarPaletteId(config.seed)
    const palette = breedTemplate != null && breedTemplate.fixed.paletteId === paletteId
      ? resolveAvatarBreedPalette(paletteId, config.seed, breedTemplate.seedDomain)
      : getAvatarPalette(paletteId)
    const paletteParts = applyAvatarEntityPalette(next.entityParts, palette)
    next = {
      ...next,
      entityParts: next.entityPreset === 'bear'
        ? applyAvatarBearBreedForeground(paletteParts, getAvatarBearBreedTemplate(next.bearBreedTemplateId))
        : paletteParts,
      selectedPaletteId: paletteId
    }
  }
  if (config.seededFields.includes(AVATAR_SEED_FIELD.backgroundStyle)) {
    next = { ...next, backgroundStyle: resolveSeededAvatarBackgroundStyle(config.seed) }
  }
  if (config.seededFields.includes(AVATAR_SEED_FIELD.cameraBackground)) {
    next = { ...next, cameraBackground: resolveSeededAvatarCameraBackground(config.seed) }
  }
  if (config.seededFields.includes(AVATAR_SEED_FIELD.viewPose)) {
    next = {
      ...next,
      viewState: resolveSeededAvatarView(config.seed, next.viewState)
    }
  }
  return next
}

const getInitialQueryConfig = (definition?: AvatarDefinition) => {
  const params = definition == null
    ? typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
    : avatarDefinitionToSearchParams(definition)
  const config = definition == null
    ? resolveSeededQueryConfig(parseQueryConfig(params))
    : parseQueryConfig(params)
  if (definition != null) {
    const state = avatarDefinitionToState(definition)
    const definitionSeedFields = parseAvatarSeedFields(state.generation?.fields.join(','))
    const concreteCatEarScale = getCatEarScale(state.entityParts)
    const concreteDogEarScale = getDogEarScale(state.entityParts)
    const concreteDogHeadScale = getDogHeadScale(state.entityParts)
    const concreteRabbitEarScale = getRabbitEarScale(state.entityParts)
    const concreteRabbitHeadScale = getRabbitHeadScale(state.entityParts)
    const concreteBearEarScale = getBearEarScale(state.entityParts)
    const concreteBearHeadScale = getBearHeadScale(state.entityParts)
    const animalSpecies = isAvatarAnimalSpeciesId(state.entityPreset) ? state.entityPreset : null
    const concreteAnimalScale = animalSpecies == null
      ? null
      : getAvatarAnimalDimensions(animalSpecies, state.entityParts)
    const animalSeedFields = animalSpecies == null ? null : AVATAR_ANIMAL_SPECIES_SEED_FIELDS[animalSpecies]
    return {
      ...config,
      avatarOutlineStyle: state.avatarOutlineStyle,
      avatarShadowStyle: state.avatarShadowStyle,
      backgroundStyle: state.backgroundStyle,
      bodyShape: state.bodyShape,
      bodyBottomTaper: state.bodyBottomTaper ?? 0,
      cameraBackground: state.cameraBackground,
      cameraFrame: state.cameraFrame,
      animalBreedTemplateId: animalSpecies == null ? null : state.generation?.profileId ?? null,
      animalEarHeight: animalSeedFields != null && definitionSeedFields.includes(animalSeedFields.earHeight)
        ? concreteAnimalScale?.earHeight ?? null
        : null,
      animalEarWidth: animalSeedFields != null && definitionSeedFields.includes(animalSeedFields.earWidth)
        ? concreteAnimalScale?.earWidth ?? null
        : null,
      animalHeadHeight: animalSeedFields != null && definitionSeedFields.includes(animalSeedFields.headHeight)
        ? concreteAnimalScale?.headHeight ?? null
        : null,
      animalHeadWidth: animalSeedFields != null && definitionSeedFields.includes(animalSeedFields.headWidth)
        ? concreteAnimalScale?.headWidth ?? null
        : null,
      animalHornSize: concreteAnimalScale?.hornSize ?? null,
      catBreedTemplateId: (
        state.entityPreset === 'cat' || (
          state.entityPreset !== 'dog' && state.entityPreset !== 'rabbit' &&
          state.entityPreset !== 'bear' && !isAvatarAnimalSpeciesId(state.entityPreset)
        )
      ) ? state.generation?.profileId ?? null : null,
      catEarHeight: definitionSeedFields.includes(AVATAR_SEED_FIELD.catEarHeight)
        ? concreteCatEarScale.height
        : null,
      catEarWidth: definitionSeedFields.includes(AVATAR_SEED_FIELD.catEarWidth)
        ? concreteCatEarScale.width
        : null,
      dogBreedTemplateId: state.entityPreset === 'dog' ? state.generation?.profileId ?? null : null,
      dogEarHeight: definitionSeedFields.includes(AVATAR_SEED_FIELD.dogEarHeight)
        ? concreteDogEarScale.height
        : null,
      dogEarWidth: definitionSeedFields.includes(AVATAR_SEED_FIELD.dogEarWidth)
        ? concreteDogEarScale.width
        : null,
      dogHeadHeight: definitionSeedFields.includes(AVATAR_SEED_FIELD.dogHeadHeight)
        ? concreteDogHeadScale.height
        : null,
      dogHeadWidth: definitionSeedFields.includes(AVATAR_SEED_FIELD.dogHeadWidth)
        ? concreteDogHeadScale.width
        : null,
      rabbitBreedTemplateId: state.entityPreset === 'rabbit' ? state.generation?.profileId ?? null : null,
      rabbitEarHeight: definitionSeedFields.includes(AVATAR_SEED_FIELD.rabbitEarHeight)
        ? concreteRabbitEarScale.height
        : null,
      rabbitEarWidth: definitionSeedFields.includes(AVATAR_SEED_FIELD.rabbitEarWidth)
        ? concreteRabbitEarScale.width
        : null,
      rabbitHeadHeight: definitionSeedFields.includes(AVATAR_SEED_FIELD.rabbitHeadHeight)
        ? concreteRabbitHeadScale.height
        : null,
      rabbitHeadWidth: definitionSeedFields.includes(AVATAR_SEED_FIELD.rabbitHeadWidth)
        ? concreteRabbitHeadScale.width
        : null,
      bearBreedTemplateId: state.entityPreset === 'bear' ? state.generation?.profileId ?? null : null,
      bearEarHeight: definitionSeedFields.includes(AVATAR_SEED_FIELD.bearEarHeight)
        ? concreteBearEarScale.height
        : null,
      bearEarWidth: definitionSeedFields.includes(AVATAR_SEED_FIELD.bearEarWidth)
        ? concreteBearEarScale.width
        : null,
      bearHeadHeight: definitionSeedFields.includes(AVATAR_SEED_FIELD.bearHeadHeight)
        ? concreteBearHeadScale.height
        : null,
      bearHeadWidth: definitionSeedFields.includes(AVATAR_SEED_FIELD.bearHeadWidth)
        ? concreteBearHeadScale.width
        : null,
      coatPattern: state.coatPattern ?? config.coatPattern,
      entityParts: state.entityParts,
      entityPreset: state.entityPreset,
      exportSize: state.exportSize,
      faceShadowStyle: state.faceShadowStyle,
      faceStyle: state.faceStyle,
      frameShadowStyle: state.frameShadowStyle,
      gridDensity: state.gridDensity,
      interactionMode: state.interactionMode,
      leftEye: state.glyph.leftEye,
      lightAzimuth: state.lightAzimuth,
      lightDistance: state.lightDistance,
      lightElevation: state.lightElevation,
      linkEyes: state.glyph.linkEyes,
      mouth: state.glyph.mouth,
      pixelEffect: state.pixelEffect,
      rightEye: state.glyph.rightEye,
      seed: state.generation?.seed ?? config.seed,
      seededFields: definitionSeedFields,
      selectedPaletteId: state.paletteId,
      showAvatarShadow: state.showAvatarShadow,
      showFrameShadow: state.showFrameShadow,
      showLight: state.showLight,
      showOutline: state.showOutline,
      showShadow: state.showShadow,
      surfaceDecals: state.surfaceDecals,
      viewState: state.viewState
    }
  }
  if (!params.has('template')) return config

  const preset = parseAvatarEntityPreset(params.get('template'))
  const scene = getAvatarEntityPresetScene(preset)
  const faceStyle = getAvatarEntityPresetFaceStyle(preset)
  if (preset === 'custom' || scene == null || faceStyle == null) return config

  return resolveSeededQueryConfig({
    ...config,
    animationOpen: false,
    avatarOutlineStyle: scene.avatarOutlineStyle,
    avatarShadowStyle: scene.avatarShadowStyle,
    backgroundStyle: scene.backgroundStyle,
    bodyShape: 'sphere' as const,
    bodyBottomTaper: 0,
    cameraBackground: scene.cameraBackground,
    cameraFrame: scene.cameraFrame,
    cameraMode: scene.cameraMode,
    animalBreedTemplateId: null,
    animalEarHeight: null,
    animalEarWidth: null,
    animalHeadHeight: null,
    animalHeadWidth: null,
    animalHornSize: null,
    catBreedTemplateId: null,
    dogBreedTemplateId: null,
    rabbitBreedTemplateId: null,
    bearBreedTemplateId: null,
    controlsCollapsed: false,
    entityParts: preset === 'cat'
      ? applyCatEarScale(
        createAvatarEntityParts(preset),
        config.catEarWidth ?? undefined,
        config.catEarHeight ?? undefined
      )
      : preset === 'dog'
        ? applyDogHeadScale(
          applyDogEarScale(
            createAvatarEntityParts(preset),
            config.dogEarWidth ?? undefined,
            config.dogEarHeight ?? undefined
          ),
          config.dogHeadWidth ?? undefined,
          config.dogHeadHeight ?? undefined
        )
        : preset === 'rabbit'
          ? applyRabbitHeadScale(
            applyRabbitEarScale(
              createAvatarEntityParts(preset),
              config.rabbitEarWidth ?? undefined,
              config.rabbitEarHeight ?? undefined
            ),
            config.rabbitHeadWidth ?? undefined,
            config.rabbitHeadHeight ?? undefined
          )
          : preset === 'bear'
            ? applyBearHeadScale(
              applyBearEarScale(
                createAvatarEntityParts(preset),
                config.bearEarWidth ?? undefined,
                config.bearEarHeight ?? undefined
              ),
              config.bearHeadWidth ?? undefined,
              config.bearHeadHeight ?? undefined
            )
            : createAvatarEntityParts(preset),
    entityPreset: preset,
    surfaceDecals: scene.surfaceDecals,
    faceStyle,
    frameShadowStyle: scene.frameShadowStyle,
    gridDensity: scene.gridDensity,
    interactionMode: scene.interactionMode,
    lightAzimuth: scene.lightAzimuth,
    lightDistance: scene.lightDistance,
    lightElevation: scene.lightElevation,
    selectedPaletteId: scene.paletteId,
    showAvatarShadow: scene.showAvatarShadow,
    showFrameShadow: scene.showFrameShadow,
    showLight: scene.showLight,
    showOutline: scene.showOutline,
    showShadow: scene.showShadow,
    viewState: scene.viewState
  })
}

const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

const waitForAvatarExportSvg = async (container: Element | null) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const svg = container?.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
    if (svg?.querySelector('path, polygon, ellipse, circle, rect') != null) return svg
    await new Promise<void>(resolve => window.setTimeout(resolve, 16))
  }
  return null
}

export interface AppProps {
  readonly animationLibraries?: readonly AvatarAnimationLibrary[]
  readonly definition?: AvatarDefinition
  readonly embedded?: boolean
  readonly onDefinitionChange?: (definition: AvatarDefinition) => void
  readonly onHome?: () => void
  readonly theme?: 'dark' | 'light' | 'system'
}

function App({
  animationLibraries = [],
  definition,
  embedded = false,
  onDefinitionChange,
  onHome,
  theme = 'system'
}: AppProps) {
  const { t } = useAvatarLocale()
  const [initialConfig] = useState(() => getInitialQueryConfig(definition))
  const [activeTab, setActiveTab] = useState<AvatarControlTab>('build')
  const [controlsCollapsed, setControlsCollapsed] = useState(initialConfig.controlsCollapsed)
  const [controlsWidth, setControlsWidth] = useState(DEFAULT_CONTROLS_WIDTH)
  const [systemDark, setSystemDark] = useState(() => {
    return typeof window !== 'undefined' && window.matchMedia(SYSTEM_DARK_MEDIA_QUERY).matches
  })
  const [themeOverride, setThemeOverride] = useState<AvatarTheme | null>(
    theme === 'system' ? null : theme
  )
  const [interactionMode, setInteractionMode] = useState<AvatarInteractionMode>(initialConfig.interactionMode)
  const [avatarViewState, setAvatarViewState] = useState<AvatarViewState>(initialConfig.viewState)
  const [seededViewTransitionState, setSeededViewTransitionState] = useState<AvatarViewState | null>(null)
  const [bodyShape, setBodyShape] = useState<AvatarBodyShape>(initialConfig.bodyShape)
  const [bodyBottomTaper, setBodyBottomTaper] = useState(initialConfig.bodyBottomTaper)
  const [entityParts, setEntityParts] = useState<readonly AvatarEntityPart[]>(initialConfig.entityParts)
  const [entityPreset, setEntityPreset] = useState<AvatarEntityPreset>(initialConfig.entityPreset)
  const [animalBreedTemplateId, setAnimalBreedTemplateId] = useState<string | null>(
    initialConfig.animalBreedTemplateId
  )
  const [animalEarWidth, setAnimalEarWidth] = useState<number | null>(initialConfig.animalEarWidth)
  const [animalEarHeight, setAnimalEarHeight] = useState<number | null>(initialConfig.animalEarHeight)
  const [animalHeadWidth, setAnimalHeadWidth] = useState<number | null>(initialConfig.animalHeadWidth)
  const [animalHeadHeight, setAnimalHeadHeight] = useState<number | null>(initialConfig.animalHeadHeight)
  const [animalHornSize, setAnimalHornSize] = useState<number | null>(initialConfig.animalHornSize)
  const [catBreedTemplateId, setCatBreedTemplateId] = useState<string | null>(
    initialConfig.catBreedTemplateId
  )
  const [catEarWidth, setCatEarWidth] = useState<number | null>(initialConfig.catEarWidth)
  const [catEarHeight, setCatEarHeight] = useState<number | null>(initialConfig.catEarHeight)
  const [dogBreedTemplateId, setDogBreedTemplateId] = useState<string | null>(
    initialConfig.dogBreedTemplateId
  )
  const [dogEarWidth, setDogEarWidth] = useState<number | null>(initialConfig.dogEarWidth)
  const [dogEarHeight, setDogEarHeight] = useState<number | null>(initialConfig.dogEarHeight)
  const [dogHeadWidth, setDogHeadWidth] = useState<number | null>(initialConfig.dogHeadWidth)
  const [dogHeadHeight, setDogHeadHeight] = useState<number | null>(initialConfig.dogHeadHeight)
  const [rabbitBreedTemplateId, setRabbitBreedTemplateId] = useState<string | null>(
    initialConfig.rabbitBreedTemplateId
  )
  const [rabbitEarWidth, setRabbitEarWidth] = useState<number | null>(initialConfig.rabbitEarWidth)
  const [rabbitEarHeight, setRabbitEarHeight] = useState<number | null>(initialConfig.rabbitEarHeight)
  const [rabbitHeadWidth, setRabbitHeadWidth] = useState<number | null>(initialConfig.rabbitHeadWidth)
  const [rabbitHeadHeight, setRabbitHeadHeight] = useState<number | null>(initialConfig.rabbitHeadHeight)
  const [bearBreedTemplateId, setBearBreedTemplateId] = useState<string | null>(initialConfig.bearBreedTemplateId)
  const [bearEarWidth, setBearEarWidth] = useState<number | null>(initialConfig.bearEarWidth)
  const [bearEarHeight, setBearEarHeight] = useState<number | null>(initialConfig.bearEarHeight)
  const [bearHeadWidth, setBearHeadWidth] = useState<number | null>(initialConfig.bearHeadWidth)
  const [bearHeadHeight, setBearHeadHeight] = useState<number | null>(initialConfig.bearHeadHeight)
  const [selectedEntityPartId, setSelectedEntityPartId] = useState<string | null>(null)
  const [surfaceDecals, setSurfaceDecals] = useState<readonly AvatarSurfaceDecal[]>(initialConfig.surfaceDecals ?? [])
  const [coatPattern, setCoatPattern] = useState<AvatarCoatPattern>(initialConfig.coatPattern)
  const [selectedSurfaceDecalId, setSelectedSurfaceDecalId] = useState<string | null>(null)
  const [cameraMode, setCameraMode] = useState(initialConfig.cameraMode)
  const [cameraBackground, setCameraBackground] = useState(initialConfig.cameraBackground)
  const [cameraFrame, setCameraFrame] = useState<AvatarCameraFrame>(initialConfig.cameraFrame)
  const { leftEye, linkEyes, mouth, rightEye } = initialConfig
  const [selectedPaletteId, setSelectedPaletteId] = useState(initialConfig.selectedPaletteId)
  const [seed, setSeed] = useState(initialConfig.seed)
  const [seededFields, setSeededFields] = useState<readonly string[]>(initialConfig.seededFields)
  const appliedPaletteSeedRef = useRef(initialConfig.seed)
  const paletteManuallyFixedRef = useRef(
    !initialConfig.seededFields.includes(AVATAR_SEED_FIELD.palette) && (
      definition != null || typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('palette')
    )
  )
  const [generationEnabled, setGenerationEnabled] = useState(
    definition == null || definition.metadata?.generation != null
  )
  const [showMorePalettes, setShowMorePalettes] = useState(() => {
    return AVATAR_PALETTES.findIndex(palette => palette.id === initialConfig.selectedPaletteId) >=
      DEFAULT_PALETTE_COUNT
  })
  const [backgroundStyle, setBackgroundStyle] = useState<AvatarBackgroundStyle>(initialConfig.backgroundStyle)
  const [faceStyle, setFaceStyle] = useState<AvatarFaceStyle>(initialConfig.faceStyle)
  const [avatarColorGrade, setAvatarColorGrade] = useState<AvatarColorGrade>(
    definition?.scene.effects.colorGrade ?? DEFAULT_AVATAR_COLOR_GRADE
  )
  const [faceShadowStyle, setFaceShadowStyle] = useState<AvatarFaceShadowStyle>(initialConfig.faceShadowStyle)
  const [avatarShadowStyle, setAvatarShadowStyle] = useState<AvatarDropShadowStyle>(initialConfig.avatarShadowStyle)
  const [avatarOutlineStyle, setAvatarOutlineStyle] = useState<AvatarOutlineStyle>(initialConfig.avatarOutlineStyle)
  const [pixelEffect, setPixelEffect] = useState<AvatarPixelEffect>(initialConfig.pixelEffect)
  const [frameShadowStyle, setFrameShadowStyle] = useState<AvatarDropShadowStyle>(initialConfig.frameShadowStyle)
  const [gridDensity, setGridDensity] = useState(initialConfig.gridDensity)
  const [showLight, setShowLight] = useState(initialConfig.showLight)
  const [lightAzimuth, setLightAzimuth] = useState(initialConfig.lightAzimuth)
  const [lightDistance, setLightDistance] = useState(initialConfig.lightDistance)
  const [lightElevation, setLightElevation] = useState(initialConfig.lightElevation)
  const [showShadow, setShowShadow] = useState(initialConfig.showShadow)
  const [showAvatarShadow, setShowAvatarShadow] = useState(initialConfig.showAvatarShadow)
  const [showOutline, setShowOutline] = useState(initialConfig.showOutline)
  const [showFrameShadow, setShowFrameShadow] = useState(initialConfig.showFrameShadow)
  const [exportSize, setExportSize] = useState<ExportSize>(initialConfig.exportSize)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [gifExportState, setGifExportState] = useState<GifExportState>('idle')
  const [savePresetState, setSavePresetState] = useState<SavePresetState>('idle')
  const [savedPresets, setSavedPresets] = useState(loadSavedAvatarPresets)
  const [selectedSavedPresetId, setSelectedSavedPresetId] = useState<string | null>(null)
  const [animationOpen, setAnimationOpen] = useState(initialConfig.animationOpen)
  const [animationPlaybackMode, setAnimationPlaybackMode] = useState<AvatarAnimationPlaybackMode>('once')
  const [animationKeyframes, setAnimationKeyframes] = useState<readonly AvatarAnimationKeyframe[]>([])
  const [animationName, setAnimationName] = useState('Untitled animation')
  const [animationStartFrameIndex, setAnimationStartFrameIndex] = useState(0)
  const [animationLockStartPosition, setAnimationLockStartPosition] = useState(false)
  const [editingSavedAnimationId, setEditingSavedAnimationId] = useState<string | null>(null)
  const [selectedAnimationKey, setSelectedAnimationKey] = useState<AvatarAnimationSelectionKey | null>(
    initialConfig.animationSelectionKey
  )
  const [animationDraftSource, setAnimationDraftSource] = useState<AvatarAnimationDraftSource>(null)
  const [activeAnimationKeyframe, setActiveAnimationKeyframe] = useState<number | null>(null)
  const [selectedAnimationKeyframe, setSelectedAnimationKeyframe] = useState<number | null>(null)
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [animationPreviewFaceStyle, setAnimationPreviewFaceStyle] = useState<AvatarFaceStyle>(
    initialConfig.faceStyle
  )
  const [animationPreviewViewState, setAnimationPreviewViewState] = useState<AvatarViewState>(initialConfig.viewState)
  const [keyframeCapturePending, setKeyframeCapturePending] = useState(false)
  const [interactionControlsDocked, setInteractionControlsDocked] = useState(false)
  const [stageNarrow, setStageNarrow] = useState(false)
  const [animationThumbnailCapture, setAnimationThumbnailCapture] = useState<AnimationThumbnailCaptureRequest | null>(
    null
  )
  const [savedAnimations, setSavedAnimations] = useState(loadSavedAvatarAnimations)
  const avatarFrameRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const animationFrameRef = useRef<number>()
  const avatarViewStateRef = useRef<AvatarViewState>(initialConfig.viewState)
  const seededViewTransitionFrameRef = useRef<number>()
  const seededViewTransitionTokenRef = useRef(0)
  const seededViewTransitionViewRef = useRef<AvatarViewState | null>(null)
  const animationTransformAnchorRef = useRef<AvatarAnimationTransformAnchor>()
  const animationThumbnailCaptureRef = useRef<HTMLDivElement>(null)
  const animationThumbnailCaptureIdRef = useRef(0)
  const applyingUndoRef = useRef(false)
  const undoGroupTimerRef = useRef<number>()
  const undoStackRef = useRef<string[]>([])
  const resolvedTheme: AvatarTheme = themeOverride ?? (systemDark ? 'dark' : 'light')

  avatarViewStateRef.current = avatarViewState
  seededViewTransitionViewRef.current = seededViewTransitionState

  const selectedPalette = useMemo(() => resolveAvatarBreedPaletteFromEntityParts(
    getAvatarPalette(selectedPaletteId),
    entityParts
  ), [entityParts, selectedPaletteId])
  const concreteCatEarScale = useMemo(() => getCatEarScale(entityParts), [entityParts])
  const resolvedCatEarWidth = catEarWidth ?? concreteCatEarScale.width
  const resolvedCatEarHeight = catEarHeight ?? concreteCatEarScale.height
  const concreteDogEarScale = useMemo(() => getDogEarScale(entityParts), [entityParts])
  const resolvedDogEarWidth = dogEarWidth ?? concreteDogEarScale.width
  const resolvedDogEarHeight = dogEarHeight ?? concreteDogEarScale.height
  const concreteDogHeadScale = useMemo(() => getDogHeadScale(entityParts), [entityParts])
  const resolvedDogHeadWidth = dogHeadWidth ?? concreteDogHeadScale.width
  const resolvedDogHeadHeight = dogHeadHeight ?? concreteDogHeadScale.height
  const concreteRabbitEarScale = useMemo(() => getRabbitEarScale(entityParts), [entityParts])
  const resolvedRabbitEarWidth = rabbitEarWidth ?? concreteRabbitEarScale.width
  const resolvedRabbitEarHeight = rabbitEarHeight ?? concreteRabbitEarScale.height
  const concreteRabbitHeadScale = useMemo(() => getRabbitHeadScale(entityParts), [entityParts])
  const resolvedRabbitHeadWidth = rabbitHeadWidth ?? concreteRabbitHeadScale.width
  const resolvedRabbitHeadHeight = rabbitHeadHeight ?? concreteRabbitHeadScale.height
  const concreteBearEarScale = useMemo(() => getBearEarScale(entityParts), [entityParts])
  const resolvedBearEarWidth = bearEarWidth ?? concreteBearEarScale.width
  const resolvedBearEarHeight = bearEarHeight ?? concreteBearEarScale.height
  const concreteBearHeadScale = useMemo(() => getBearHeadScale(entityParts), [entityParts])
  const resolvedBearHeadWidth = bearHeadWidth ?? concreteBearHeadScale.width
  const resolvedBearHeadHeight = bearHeadHeight ?? concreteBearHeadScale.height
  const concreteAnimalDimensions = useMemo(
    () => isAvatarAnimalSpeciesId(entityPreset) ? getAvatarAnimalDimensions(entityPreset, entityParts) : null,
    [entityParts, entityPreset]
  )
  const resolvedAnimalEarWidth = animalEarWidth ?? concreteAnimalDimensions?.earWidth ?? 100
  const resolvedAnimalEarHeight = animalEarHeight ?? concreteAnimalDimensions?.earHeight ?? 100
  const resolvedAnimalHeadWidth = animalHeadWidth ?? concreteAnimalDimensions?.headWidth ?? 100
  const resolvedAnimalHeadHeight = animalHeadHeight ?? concreteAnimalDimensions?.headHeight ?? 100
  const resolvedAnimalHornSize = animalHornSize ?? concreteAnimalDimensions?.hornSize ?? 100
  const generatedCoatDecals = useMemo(() => coatPattern.enabled
    ? resolveAvatarCoatPatternDecals({
      entityParts,
      entityPreset,
      ...{ palette: selectedPalette },
      paletteId: selectedPaletteId,
      pattern: coatPattern
    })
    : [], [coatPattern, entityParts, entityPreset, selectedPalette, selectedPaletteId])
  const resolvedSurfaceDecals = useMemo(() => {
    const explicitDecalIds = new Set(surfaceDecals.map(decal => decal.id))
    return [
      ...generatedCoatDecals.filter(decal => !explicitDecalIds.has(decal.id)),
      ...surfaceDecals
    ]
  }, [generatedCoatDecals, surfaceDecals])
  const resolvedFaceStyle = useMemo(
    () => ({ ...DEFAULT_AVATAR_FACE_STYLE, ...faceStyle }),
    [faceStyle]
  )
  const resolvedFaceShadowStyle = useMemo(
    () => ({ ...DEFAULT_AVATAR_FACE_SHADOW_STYLE, ...faceShadowStyle }),
    [faceShadowStyle]
  )
  const lightDirection = useMemo(
    () => ({ azimuth: lightAzimuth, elevation: lightElevation }),
    [lightAzimuth, lightElevation]
  )
  const frameShadow = useMemo(() => {
    if (!showFrameShadow) return 'none'
    const direction = frameShadowStyle.direction * Math.PI / 180
    const x = Math.cos(direction) * frameShadowStyle.distance
    const y = Math.sin(direction) * frameShadowStyle.distance
    return `${x.toFixed(2)}px ${y.toFixed(2)}px ${frameShadowStyle.softness}px color-mix(in srgb, ${
      frameShadowStyle.color ?? selectedPalette.shadow
    } ${frameShadowStyle.opacity}%, transparent)`
  }, [frameShadowStyle, selectedPalette.shadow, showFrameShadow])
  const previewEmoticon = `${leftEye}${mouth}${rightEye}`
  const visiblePalettes = useMemo(() => {
    return showMorePalettes ? AVATAR_PALETTES : AVATAR_PALETTES.slice(0, DEFAULT_PALETTE_COUNT)
  }, [showMorePalettes])
  const hiddenPaletteCount = Math.max(AVATAR_PALETTES.length - DEFAULT_PALETTE_COUNT, 0)
  const sharedAnimationQuery = useMemo(() => {
    if (selectedAnimationKey == null || selectedAnimationKey.startsWith('preset:') || animationKeyframes.length < 2) {
      return null
    }
    return serializeSharedAvatarAnimation({
      createdAt: 0,
      id: 'shared',
      keyframes: animationKeyframes,
      lockStartPosition: animationLockStartPosition,
      name: animationName,
      playbackMode: animationPlaybackMode,
      startFrameIndex: animationStartFrameIndex,
      version: 3
    })
  }, [
    animationKeyframes,
    animationLockStartPosition,
    animationName,
    animationPlaybackMode,
    animationStartFrameIndex,
    selectedAnimationKey
  ])
  const currentDocumentAnimation = useMemo<SavedAvatarAnimation | null>(() => {
    if (animationKeyframes.length < 2) return null
    return {
      createdAt: 0,
      id: 'document',
      keyframes: animationKeyframes,
      lockStartPosition: animationLockStartPosition,
      name: animationName.trim() || 'Untitled animation',
      playbackMode: animationPlaybackMode,
      startFrameIndex: Math.min(animationStartFrameIndex, animationKeyframes.length - 1),
      version: 3
    }
  }, [
    animationKeyframes,
    animationLockStartPosition,
    animationName,
    animationPlaybackMode,
    animationStartFrameIndex
  ])
  const seedGeneration = useMemo<AvatarSeedConfiguration | undefined>(() => (
    generationEnabled
      ? {
        fields: seededFields,
        ...((isAvatarAnimalSpeciesId(entityPreset) ? animalBreedTemplateId : entityPreset === 'dog' ? dogBreedTemplateId : entityPreset === 'rabbit' ? rabbitBreedTemplateId : entityPreset === 'bear' ? bearBreedTemplateId : catBreedTemplateId) == null
          ? {}
          : { profileId: isAvatarAnimalSpeciesId(entityPreset) ? animalBreedTemplateId! : entityPreset === 'dog' ? dogBreedTemplateId! : entityPreset === 'rabbit' ? rabbitBreedTemplateId! : entityPreset === 'bear' ? bearBreedTemplateId! : catBreedTemplateId! }),
        seed,
        version: 1
      }
      : undefined
  ), [animalBreedTemplateId, bearBreedTemplateId, catBreedTemplateId, dogBreedTemplateId, entityPreset, generationEnabled, rabbitBreedTemplateId, seed, seededFields])
  const currentDefinition = useMemo(() =>
    createAvatarDefinition({
      animation: animationDraftSource === 'builtin' ? null : currentDocumentAnimation,
      animationLibraryIds: animationLibraries.map(library => library.id),
      animationTargetKey: selectedAnimationKey,
      avatarOutlineStyle,
      avatarShadowStyle,
      backgroundStyle,
      bodyShape,
      bodyBottomTaper,
      cameraBackground,
      cameraFrame,
      coatPattern,
      colorGrade: avatarColorGrade,
      entityParts,
      entityPreset,
      exportSize,
      faceShadowStyle: resolvedFaceShadowStyle,
      faceStyle: resolvedFaceStyle,
      frameShadowStyle,
      generation: seedGeneration,
      glyph: { leftEye, linkEyes, mouth, rightEye },
      gridDensity,
      interactionMode,
      lightAzimuth,
      lightDistance,
      lightElevation,
      paletteId: selectedPaletteId,
      pixelEffect,
      showAvatarShadow,
      showFrameShadow,
      showLight,
      showOutline,
      showShadow,
      surfaceDecals,
      viewState: avatarViewState
    }, definition), [
    avatarOutlineStyle,
    avatarShadowStyle,
    avatarViewState,
    backgroundStyle,
    bodyShape,
    bodyBottomTaper,
    cameraBackground,
    cameraFrame,
    coatPattern,
    avatarColorGrade,
    animationDraftSource,
    animationLibraries,
    currentDocumentAnimation,
    definition,
    entityParts,
    entityPreset,
    exportSize,
    frameShadowStyle,
    gridDensity,
    interactionMode,
    leftEye,
    lightAzimuth,
    lightDistance,
    lightElevation,
    linkEyes,
    mouth,
    pixelEffect,
    resolvedFaceShadowStyle,
    resolvedFaceStyle,
    rightEye,
    seedGeneration,
    selectedAnimationKey,
    selectedPaletteId,
    showAvatarShadow,
    showFrameShadow,
    showLight,
    showOutline,
    showShadow,
    surfaceDecals
  ])
  const currentDefinitionFingerprint = useMemo(
    () => createStableJsonFingerprint(currentDefinition),
    [currentDefinition]
  )
  const lastEmittedDefinitionFingerprintRef = useRef(
    definition == null ? null : createStableJsonFingerprint(definition)
  )
  const publicAnimationEntries = useMemo(() =>
    flattenAvatarAnimationLibraries(
      [definition?.animations, ...animationLibraries].filter(
        (library): library is AvatarAnimationLibrary => library != null
      ),
      currentDefinition.scene
    ), [animationLibraries, currentDefinition.scene, definition?.animations])
  const publicAnimations = useMemo(
    () => publicAnimationEntries.map(entry => entry.animation),
    [publicAnimationEntries]
  )

  useEffect(() => {
    if (!embedded || animationPlaying) return
    if (lastEmittedDefinitionFingerprintRef.current === currentDefinitionFingerprint) return
    lastEmittedDefinitionFingerprintRef.current = currentDefinitionFingerprint
    onDefinitionChange?.(currentDefinition)
  }, [
    animationPlaying,
    currentDefinition,
    currentDefinitionFingerprint,
    embedded,
    onDefinitionChange
  ])

  useEffect(() => {
    setThemeOverride(theme === 'system' ? null : theme)
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    setSystemDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (embedded) return
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [embedded, resolvedTheme])

  useEffect(() => {
    const stage = stageRef.current
    if (stage == null) return

    const updateStageWidthState = () => {
      setStageNarrow(stage.getBoundingClientRect().width < window.innerWidth * .5)
    }
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateStageWidthState)
    resizeObserver?.observe(stage)
    window.addEventListener('resize', updateStageWidthState)
    updateStageWidthState()
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateStageWidthState)
    }
  }, [])

  useEffect(() => {
    if (embedded) return
    const params = new URLSearchParams(window.location.search)
    params.set('sidebar', controlsCollapsed ? '0' : '1')
    params.set('animationPanel', animationOpen ? '1' : '0')
    if (selectedAnimationKey == null) {
      params.delete('animation')
      params.delete('animationData')
    } else if (selectedAnimationKey.startsWith('preset:')) {
      params.set('animation', selectedAnimationKey)
      params.delete('animationData')
    } else if (sharedAnimationQuery != null) {
      params.set('animation', 'shared')
      params.set('animationData', sharedAnimationQuery)
    }
    if (params.toString() === window.location.search.slice(1)) return

    const nextUrl = new URL(window.location.href)
    nextUrl.search = params.toString()
    window.history.replaceState(null, '', nextUrl)
  }, [animationOpen, controlsCollapsed, embedded, selectedAnimationKey, sharedAnimationQuery])

  useEffect(() => {
    if (embedded) return
    if (animationPlaying) return
    const params = new URLSearchParams()
    params.set('face', previewEmoticon)
    params.set('palette', selectedPalette.id)
    params.set('bg', backgroundStyle)
    params.set('shape', bodyShape)
    if (bodyBottomTaper !== 0) params.set('bottomTaper', String(bodyBottomTaper))
    params.set('coat', coatPattern.enabled ? '1' : '0')
    params.set('coatAlgorithm', coatPattern.algorithm)
    params.set('coatAlgorithmSeed', coatPattern.algorithmSeed)
    params.set('coatSeed', coatPattern.seed)
    params.set('coatDensity', String(coatPattern.density))
    params.set('coatJitter', String(coatPattern.jitter))
    params.set('coatLightPatchLength', String(coatPattern.lightPatchLength ?? DEFAULT_AVATAR_COAT_PATTERN.lightPatchLength))
    params.set('coatLightPatchOffsetY', String(coatPattern.lightPatchOffsetY ?? DEFAULT_AVATAR_COAT_PATTERN.lightPatchOffsetY))
    params.set('coatLightPatchWidth', String(coatPattern.lightPatchWidth ?? DEFAULT_AVATAR_COAT_PATTERN.lightPatchWidth))
    params.set('coatLightPatchShape', coatPattern.lightPatchShape ?? 'face-mask')
    params.set('coatThickness', String(coatPattern.thickness))
    params.set('coatSymmetry', String(coatPattern.symmetry))
    params.set('coatContrast', String(coatPattern.contrast))
    params.set('coatBreakup', String(coatPattern.breakup))
    params.set('seed', seed)
    const serializedSeedFields = serializeAvatarSeedFields(seededFields)
    if (serializedSeedFields === '') params.delete('seedFields')
    else params.set('seedFields', serializedSeedFields)
    params.set('mode', interactionMode)
    params.set('yaw', formatQueryNumber(avatarViewState.yaw))
    params.set('pitch', formatQueryNumber(avatarViewState.pitch))
    params.set('roll', formatQueryNumber(avatarViewState.roll))
    params.set('positionX', formatQueryNumber(avatarViewState.positionX))
    params.set('positionY', formatQueryNumber(avatarViewState.positionY))
    params.set('scale', formatQueryNumber(avatarViewState.scale))
    params.set('camera', cameraMode ? '1' : '0')
    params.set('cameraBg', cameraBackground)
    params.set('cameraFrame', cameraFrame)
    params.set('eyes', linkEyes ? '1' : '0')
    params.set('eyeShape', resolvedFaceStyle.eyeShape)
    params.set('eyeRound', String(resolvedFaceStyle.eyeRoundness))
    params.set('eyeW', String(resolvedFaceStyle.width))
    params.set('eyeH', String(resolvedFaceStyle.height))
    if (resolvedFaceStyle.leftEyeHeight != null) {
      params.set('eyeLeftH', String(resolvedFaceStyle.leftEyeHeight))
    }
    if (resolvedFaceStyle.rightEyeHeight != null) {
      params.set('eyeRightH', String(resolvedFaceStyle.rightEyeHeight))
    }
    if (resolvedFaceStyle.leftEyeWidth != null) params.set('eyeLeftW', String(resolvedFaceStyle.leftEyeWidth))
    if (resolvedFaceStyle.rightEyeWidth != null) params.set('eyeRightW', String(resolvedFaceStyle.rightEyeWidth))
    params.set('eyeGap', String(resolvedFaceStyle.gap))
    params.set('eyeRot', String(resolvedFaceStyle.rotation))
    params.set('eyeLeftRot', String(resolvedFaceStyle.leftEyeRotation))
    params.set('eyeRightRot', String(resolvedFaceStyle.rightEyeRotation))
    params.set('eyeHighlight', resolvedFaceStyle.eyeHighlight.enabled ? '1' : '0')
    params.set('eyeHighlightColor', resolvedFaceStyle.eyeHighlight.color)
    params.set('eyeHighlightSize', String(resolvedFaceStyle.eyeHighlight.size))
    params.set('eyeHighlightX', String(resolvedFaceStyle.eyeHighlight.offsetX))
    params.set('eyeHighlightY', String(resolvedFaceStyle.eyeHighlight.offsetY))
    params.set('eyeHighlightOpacity', String(resolvedFaceStyle.eyeHighlight.opacity))
    params.set('nose', resolvedFaceStyle.noseEnabled ? '1' : '0')
    params.set('noseShape', resolvedFaceStyle.noseShape)
    params.set('noseW', String(resolvedFaceStyle.noseWidth))
    params.set('noseH', String(resolvedFaceStyle.noseHeight))
    params.set('noseY', String(resolvedFaceStyle.noseY))
    params.set('noseRot', String(resolvedFaceStyle.noseRotation))
    params.set('mouth', resolvedFaceStyle.mouthEnabled ? '1' : '0')
    params.set('mouthShape', resolvedFaceStyle.mouthShape)
    params.set('mouthCurve', String(resolvedFaceStyle.mouthCurve))
    params.set('mouthW', String(resolvedFaceStyle.mouthWidth))
    params.set('mouthH', String(resolvedFaceStyle.mouthHeight))
    params.set('mouthY', String(resolvedFaceStyle.mouthY))
    params.set('mouthRot', String(resolvedFaceStyle.mouthRotation))
    params.set('light', showLight ? '1' : '0')
    params.set('lightAz', String(lightAzimuth))
    params.set('lightEl', String(lightElevation))
    params.set('lightDist', String(lightDistance))
    params.set('shadow', showShadow ? '1' : '0')
    params.set('shadowDir', String(resolvedFaceShadowStyle.direction))
    params.set('shadowDist', String(resolvedFaceShadowStyle.distance))
    params.set('shadowOpacity', String(resolvedFaceShadowStyle.opacity))
    params.set('shadowSoft', String(resolvedFaceShadowStyle.softness))
    if (resolvedFaceShadowStyle.color != null) {
      params.set('shadowColor', resolvedFaceShadowStyle.color)
    }
    params.set('avatarShadow', showAvatarShadow ? '1' : '0')
    params.set('avatarShadowColor', avatarShadowStyle.color ?? DEFAULT_AVATAR_SHADOW_STYLE.color ?? '#000000')
    params.set('avatarShadowDir', String(avatarShadowStyle.direction))
    params.set('avatarShadowDist', String(avatarShadowStyle.distance))
    params.set('avatarShadowOpacity', String(avatarShadowStyle.opacity))
    params.set('avatarShadowSoft', String(avatarShadowStyle.softness))
    params.set('outline', showOutline ? '1' : '0')
    params.set('outlineColor', avatarOutlineStyle.color)
    params.set('outlineWidth', String(avatarOutlineStyle.width))
    params.set('outlineOpacity', String(avatarOutlineStyle.opacity))
    params.set('pixel', pixelEffect.enabled ? '1' : '0')
    params.set('pixelSize', String(pixelEffect.blockSize))
    params.set('pixelColors', String(pixelEffect.paletteSize))
    params.set('pixelSample', pixelEffect.sampling)
    params.set('pixelDither', pixelEffect.dithering)
    params.set('frameShadow', showFrameShadow ? '1' : '0')
    params.set('frameShadowDir', String(frameShadowStyle.direction))
    params.set('frameShadowDist', String(frameShadowStyle.distance))
    params.set('frameShadowOpacity', String(frameShadowStyle.opacity))
    params.set('frameShadowSoft', String(frameShadowStyle.softness))
    if (frameShadowStyle.color != null) params.set('frameShadowColor', frameShadowStyle.color)
    params.set('gridDensity', String(gridDensity))
    if (entityPreset === 'custom') {
      params.delete('entity')
      params.delete('entityParts')
    } else {
      params.set('entity', entityPreset)
      params.set('entityParts', serializeAvatarEntityParts(entityParts))
      if (entityPreset === 'cat' && catBreedTemplateId != null) params.set('breed', catBreedTemplateId)
      if (entityPreset === 'dog' && dogBreedTemplateId != null) params.set('breed', dogBreedTemplateId)
      if (entityPreset === 'rabbit' && rabbitBreedTemplateId != null) params.set('breed', rabbitBreedTemplateId)
      if (entityPreset === 'bear' && bearBreedTemplateId != null) params.set('breed', bearBreedTemplateId)
      if (isAvatarAnimalSpeciesId(entityPreset) && animalBreedTemplateId != null) {
        params.set('breed', animalBreedTemplateId)
      }
      if (entityPreset === 'cat' && catEarWidth != null) params.set('catEarWidth', String(catEarWidth))
      if (entityPreset === 'cat' && catEarHeight != null) params.set('catEarHeight', String(catEarHeight))
      if (entityPreset === 'dog' && dogEarWidth != null) params.set('dogEarWidth', String(dogEarWidth))
      if (entityPreset === 'dog' && dogEarHeight != null) params.set('dogEarHeight', String(dogEarHeight))
      if (entityPreset === 'dog' && dogHeadWidth != null) params.set('dogHeadWidth', String(dogHeadWidth))
      if (entityPreset === 'dog' && dogHeadHeight != null) params.set('dogHeadHeight', String(dogHeadHeight))
      if (entityPreset === 'rabbit' && rabbitEarWidth != null) params.set('rabbitEarWidth', String(rabbitEarWidth))
      if (entityPreset === 'rabbit' && rabbitEarHeight != null) params.set('rabbitEarHeight', String(rabbitEarHeight))
      if (entityPreset === 'rabbit' && rabbitHeadWidth != null) params.set('rabbitHeadWidth', String(rabbitHeadWidth))
      if (entityPreset === 'rabbit' && rabbitHeadHeight != null) params.set('rabbitHeadHeight', String(rabbitHeadHeight))
      if (entityPreset === 'bear' && bearEarWidth != null) params.set('bearEarWidth', String(bearEarWidth))
      if (entityPreset === 'bear' && bearEarHeight != null) params.set('bearEarHeight', String(bearEarHeight))
      if (entityPreset === 'bear' && bearHeadWidth != null) params.set('bearHeadWidth', String(bearHeadWidth))
      if (entityPreset === 'bear' && bearHeadHeight != null) params.set('bearHeadHeight', String(bearHeadHeight))
      if (isAvatarAnimalSpeciesId(entityPreset)) {
        if (animalEarWidth != null) params.set(`${entityPreset}EarWidth`, String(animalEarWidth))
        if (animalEarHeight != null) params.set(`${entityPreset}EarHeight`, String(animalEarHeight))
        if (animalHeadWidth != null) params.set(`${entityPreset}HeadWidth`, String(animalHeadWidth))
        if (animalHeadHeight != null) params.set(`${entityPreset}HeadHeight`, String(animalHeadHeight))
        if (animalHornSize != null && entityPreset === 'deer') params.set('deerAntlerSize', String(animalHornSize))
        if (animalHornSize != null && entityPreset === 'sheep') params.set('sheepHornSize', String(animalHornSize))
      }
    }
    if (surfaceDecals.length > 0) params.set('decals', serializeAvatarSurfaceDecals(surfaceDecals))
    params.delete('objects')
    params.set('size', String(exportSize))
    params.set('sidebar', controlsCollapsed ? '0' : '1')
    params.set('animationPanel', animationOpen ? '1' : '0')
    if (selectedAnimationKey?.startsWith('preset:')) {
      params.set('animation', selectedAnimationKey)
    } else if (sharedAnimationQuery != null) {
      params.set('animation', 'shared')
      params.set('animationData', sharedAnimationQuery)
    }

    const nextSearch = `?${params.toString()}`
    try {
      window.localStorage.setItem(LAST_EDITOR_QUERY_STORAGE_KEY, nextSearch)
    } catch {
      // Some embedded and private browsing contexts disable local storage.
    }
    if (window.location.search === nextSearch) return

    if (!applyingUndoRef.current) {
      const currentSearch = window.location.search
      if (undoGroupTimerRef.current == null && undoStackRef.current.at(-1) !== currentSearch) {
        undoStackRef.current = [...undoStackRef.current.slice(-(UNDO_HISTORY_LIMIT - 1)), currentSearch]
      }
      window.clearTimeout(undoGroupTimerRef.current)
      undoGroupTimerRef.current = window.setTimeout(() => {
        undoGroupTimerRef.current = undefined
      }, UNDO_GROUP_DELAY_MS)
    }

    const nextUrl = new URL(window.location.href)
    nextUrl.search = params.toString()
    window.history.replaceState(null, '', nextUrl)
  }, [
    backgroundStyle,
    animationOpen,
    animationPlaying,
    avatarOutlineStyle,
    avatarShadowStyle,
    avatarViewState,
    bodyShape,
    bodyBottomTaper,
    cameraBackground,
    cameraFrame,
    animalBreedTemplateId,
    animalEarHeight,
    animalEarWidth,
    animalHeadHeight,
    animalHeadWidth,
    animalHornSize,
    catEarHeight,
    catEarWidth,
    catBreedTemplateId,
    dogEarHeight,
    dogEarWidth,
    dogHeadHeight,
    dogHeadWidth,
    dogBreedTemplateId,
    rabbitEarHeight,
    rabbitEarWidth,
    rabbitHeadHeight,
    rabbitHeadWidth,
    rabbitBreedTemplateId,
    bearBreedTemplateId,
    bearEarHeight,
    bearEarWidth,
    bearHeadHeight,
    bearHeadWidth,
    coatPattern,
    cameraMode,
    controlsCollapsed,
    embedded,
    entityParts,
    entityPreset,
    exportSize,
    frameShadowStyle,
    gridDensity,
    lightAzimuth,
    lightDistance,
    lightElevation,
    interactionMode,
    linkEyes,
    previewEmoticon,
    pixelEffect,
    resolvedFaceStyle,
    resolvedFaceShadowStyle,
    selectedPalette.id,
    seed,
    seededFields,
    selectedAnimationKey,
    sharedAnimationQuery,
    showLight,
    showOutline,
    showAvatarShadow,
    showFrameShadow,
    showShadow,
    surfaceDecals
  ])

  useEffect(() => {
    if (embedded) return
    const handleUndo = (event: globalThis.KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.key.toLowerCase() !== 'z' || event.isComposing) {
        return
      }
      const target = event.target instanceof HTMLElement ? event.target : null
      const editable = target?.closest('input, textarea, [contenteditable="true"]')
      if (
        editable instanceof HTMLTextAreaElement ||
        editable instanceof HTMLElement && editable.isContentEditable ||
        editable instanceof HTMLInputElement &&
          !['button', 'checkbox', 'color', 'radio', 'range'].includes(editable.type)
      ) {
        return
      }

      const previousSearch = undoStackRef.current.pop()
      if (previousSearch == null) return
      event.preventDefault()
      window.clearTimeout(undoGroupTimerRef.current)
      undoGroupTimerRef.current = undefined
      applyingUndoRef.current = true

      const previousParams = new URLSearchParams(previousSearch)
      const config = resolveSeededQueryConfig(parseQueryConfig(previousParams, seed))
      const nextUrl = new URL(window.location.href)
      nextUrl.search = previousSearch
      window.history.replaceState(null, '', nextUrl)
      cancelSeededViewTransition()
      if (animationFrameRef.current != null) window.cancelAnimationFrame(animationFrameRef.current)
      setAnimationPlaying(false)
      setActiveAnimationKeyframe(null)
      setAvatarColorGrade(DEFAULT_AVATAR_COLOR_GRADE)
      setAnimationOpen(config.animationOpen)
      setAvatarOutlineStyle(config.avatarOutlineStyle)
      setAvatarShadowStyle(config.avatarShadowStyle)
      setPixelEffect(config.pixelEffect)
      setAvatarViewState(config.viewState)
      setAnimationPreviewViewState(config.viewState)
      setBackgroundStyle(config.backgroundStyle)
      setBodyShape(config.bodyShape)
      setBodyBottomTaper(config.bodyBottomTaper)
      setCameraBackground(config.cameraBackground)
      setCameraFrame(config.cameraFrame)
      setCameraMode(config.cameraMode)
      setControlsCollapsed(config.controlsCollapsed)
      setEntityParts(config.entityParts)
      setEntityPreset(config.entityPreset)
      setAnimalBreedTemplateId(config.animalBreedTemplateId)
      setAnimalEarHeight(config.animalEarHeight)
      setAnimalEarWidth(config.animalEarWidth)
      setAnimalHeadHeight(config.animalHeadHeight)
      setAnimalHeadWidth(config.animalHeadWidth)
      setAnimalHornSize(config.animalHornSize)
      setCatBreedTemplateId(config.catBreedTemplateId)
      setCatEarHeight(config.catEarHeight)
      setCatEarWidth(config.catEarWidth)
      setDogBreedTemplateId(config.dogBreedTemplateId)
      setDogEarHeight(config.dogEarHeight)
      setDogEarWidth(config.dogEarWidth)
      setDogHeadHeight(config.dogHeadHeight)
      setDogHeadWidth(config.dogHeadWidth)
      setRabbitBreedTemplateId(config.rabbitBreedTemplateId)
      setRabbitEarHeight(config.rabbitEarHeight)
      setRabbitEarWidth(config.rabbitEarWidth)
      setRabbitHeadHeight(config.rabbitHeadHeight)
      setRabbitHeadWidth(config.rabbitHeadWidth)
      setBearBreedTemplateId(config.bearBreedTemplateId)
      setBearEarHeight(config.bearEarHeight)
      setBearEarWidth(config.bearEarWidth)
      setBearHeadHeight(config.bearHeadHeight)
      setBearHeadWidth(config.bearHeadWidth)
      setCoatPattern(config.coatPattern)
      setSurfaceDecals(config.surfaceDecals)
      setSelectedSurfaceDecalId(null)
      setExportSize(config.exportSize)
      setFaceShadowStyle(config.faceShadowStyle)
      setFaceStyle(config.faceStyle)
      setAnimationPreviewFaceStyle(config.faceStyle)
      setFrameShadowStyle(config.frameShadowStyle)
      setGridDensity(config.gridDensity)
      setInteractionMode(config.interactionMode)
      setLightAzimuth(config.lightAzimuth)
      setLightDistance(config.lightDistance)
      setLightElevation(config.lightElevation)
      setSelectedEntityPartId(null)
      setSelectedPaletteId(config.selectedPaletteId)
      paletteManuallyFixedRef.current = !config.seededFields.includes(AVATAR_SEED_FIELD.palette) &&
        previousParams.has('palette')
      appliedPaletteSeedRef.current = config.seed
      setSeed(config.seed)
      setSeededFields(config.seededFields)
      setGenerationEnabled(true)
      setSelectedSavedPresetId(null)
      setShowAvatarShadow(config.showAvatarShadow)
      setShowFrameShadow(config.showFrameShadow)
      setShowLight(config.showLight)
      setShowMorePalettes(
        AVATAR_PALETTES.findIndex(palette => palette.id === config.selectedPaletteId) >= DEFAULT_PALETTE_COUNT
      )
      setShowOutline(config.showOutline)
      setShowShadow(config.showShadow)
      setCopyState('idle')
      window.requestAnimationFrame(() => {
        applyingUndoRef.current = false
      })
    }

    window.addEventListener('keydown', handleUndo)
    return () => {
      window.removeEventListener('keydown', handleUndo)
      window.clearTimeout(undoGroupTimerRef.current)
    }
  }, [embedded, seed])

  useEffect(() => {
    if (embedded) return
    if (selectedSavedPresetId == null) return
    const selectedPreset = savedPresets.find(preset => preset.id === selectedSavedPresetId)
    if (selectedPreset != null && selectedPreset.query !== window.location.search) {
      setSelectedSavedPresetId(null)
    }
  }, [
    avatarOutlineStyle,
    avatarShadowStyle,
    avatarViewState,
    backgroundStyle,
    bodyShape,
    bodyBottomTaper,
    cameraBackground,
    cameraFrame,
    cameraMode,
    entityParts,
    entityPreset,
    exportSize,
    faceShadowStyle,
    faceStyle,
    frameShadowStyle,
    gridDensity,
    embedded,
    interactionMode,
    lightAzimuth,
    lightDistance,
    lightElevation,
    pixelEffect,
    savedPresets,
    seed,
    seededFields,
    selectedPaletteId,
    selectedSavedPresetId,
    showLight,
    showOutline,
    showAvatarShadow,
    showFrameShadow,
    showShadow,
    surfaceDecals
  ])

  useEffect(() => {
    if (animationThumbnailCapture == null) return
    const captureRequest = animationThumbnailCapture
    let cancelled = false
    const renderFrame = window.requestAnimationFrame(() => {
      const sourceSvgs = Array.from(
        animationThumbnailCaptureRef.current?.querySelectorAll<SVGSVGElement>('svg.interactive-avatar__canvas') ?? []
      )
      if (sourceSvgs.length !== captureRequest.keyframes.length) {
        console.error('Unable to capture animation thumbnails: rendered frame count mismatch')
        setAnimationThumbnailCapture(current => current?.id === captureRequest.id ? null : current)
        return
      }

      void Promise.all(
        sourceSvgs.map(sourceSvg =>
          captureAvatarScreenshot(sourceSvg, {
            pixelEffect: captureRequest.pixelEffect
          })
        )
      ).then(screenshots => {
        if (cancelled || animationThumbnailCaptureIdRef.current !== captureRequest.id) return
        const capturedKeyframes = captureRequest.keyframes.map((keyframe, index) => ({
          colorGrade: keyframe.colorGrade,
          durationMs: keyframe.durationMs,
          easing: keyframe.easing,
          faceStyle: keyframe.faceStyle,
          pitch: keyframe.pitch,
          positionX: keyframe.positionX,
          positionY: keyframe.positionY,
          screenshot: screenshots[index],
          yaw: keyframe.yaw
        }))
        setAnimationKeyframes(currentKeyframes => {
          return currentKeyframes === captureRequest.keyframes ? capturedKeyframes : currentKeyframes
        })
        setAnimationThumbnailCapture(current => current?.id === captureRequest.id ? null : current)
      }).catch(error => {
        if (cancelled) return
        console.error('Unable to capture animation thumbnails', error)
        setAnimationThumbnailCapture(current => current?.id === captureRequest.id ? null : current)
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(renderFrame)
    }
  }, [animationThumbnailCapture])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current != null) window.cancelAnimationFrame(animationFrameRef.current)
      if (seededViewTransitionFrameRef.current != null) {
        window.cancelAnimationFrame(seededViewTransitionFrameRef.current)
      }
    }
  }, [])

  const cancelSeededViewTransition = () => {
    seededViewTransitionTokenRef.current += 1
    if (seededViewTransitionFrameRef.current != null) {
      window.cancelAnimationFrame(seededViewTransitionFrameRef.current)
      seededViewTransitionFrameRef.current = undefined
    }
    seededViewTransitionViewRef.current = null
    setSeededViewTransitionState(null)
  }

  const startSeededViewTransition = (
    target: AvatarViewState,
    fromOverride?: AvatarViewState
  ) => {
    const from = fromOverride ?? seededViewTransitionViewRef.current ?? avatarViewStateRef.current
    cancelSeededViewTransition()
    avatarViewStateRef.current = target
    setAvatarViewState(target)
    setAnimationPreviewViewState(target)
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    if (Object.keys(target).every(key => target[key as keyof AvatarViewState] === from[key as keyof AvatarViewState])) {
      return
    }

    const token = seededViewTransitionTokenRef.current
    let startedAt: number | null = null
    const tick = (now: number) => {
      if (token !== seededViewTransitionTokenRef.current) return
      startedAt ??= now
      const progress = Math.min(Math.max((now - startedAt) / SEEDED_VIEW_TRANSITION_MS, 0), 1)
      const easedProgress = .5 - Math.cos(Math.PI * progress) / 2
      const nextViewState = interpolateAvatarView(from, target, easedProgress)
      seededViewTransitionViewRef.current = nextViewState
      setSeededViewTransitionState(nextViewState)
      if (progress < 1) {
        seededViewTransitionFrameRef.current = window.requestAnimationFrame(tick)
        return
      }
      seededViewTransitionFrameRef.current = undefined
      seededViewTransitionViewRef.current = null
      setSeededViewTransitionState(null)
    }
    seededViewTransitionViewRef.current = from
    setSeededViewTransitionState(from)
    seededViewTransitionFrameRef.current = window.requestAnimationFrame(tick)
  }

  const stopAnimationPlayback = () => {
    cancelSeededViewTransition()
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    setAnimationPlaying(false)
    setAvatarColorGrade(DEFAULT_AVATAR_COLOR_GRADE)
  }

  const handleAvatarViewStateChange = (nextState: AvatarViewState) => {
    stopAnimationPlayback()
    markSeedFieldsManual(AVATAR_SEED_FIELD.viewPose)
    avatarViewStateRef.current = nextState
    setAvatarViewState(nextState)
    setAnimationPreviewViewState(nextState)
    setActiveAnimationKeyframe(null)
  }

  const avatarCaptureOptions = {
    background: cameraBackground,
    frame: cameraFrame,
    frameShadow: {
      ...frameShadowStyle,
      color: frameShadowStyle.color ?? selectedPalette.shadow
    },
    pixelEffect,
    showFrameShadow
  }

  const resetAnimalBreedState = () => {
    setAnimalBreedTemplateId(null)
    setAnimalEarHeight(null)
    setAnimalEarWidth(null)
    setAnimalHeadHeight(null)
    setAnimalHeadWidth(null)
    setAnimalHornSize(null)
  }

  const handleEntityPresetChange = (preset: AvatarEntityPreset) => {
    const nextParts = createAvatarEntityParts(preset)
    const nextFaceStyle = getAvatarEntityPresetFaceStyle(preset)
    const nextScene = getAvatarEntityPresetScene(preset)
    const applicableFields = getApplicableAvatarSeedFields(preset, false)
    const authoredSceneFields: readonly AvatarSeedField[] = preset === 'fox'
      ? applicableFields
      : []
    stopAnimationPlayback()
    setActiveAnimationKeyframe(null)
    setAvatarColorGrade(DEFAULT_AVATAR_COLOR_GRADE)
    setEntityPreset(preset)
    resetAnimalBreedState()
    setCatBreedTemplateId(null)
    setDogBreedTemplateId(null)
    setEntityParts(nextParts)
    setCatEarHeight(null)
    setCatEarWidth(null)
    setDogEarHeight(null)
    setDogEarWidth(null)
    setDogHeadHeight(null)
    setDogHeadWidth(null)
    setRabbitBreedTemplateId(null)
    setRabbitEarHeight(null)
    setRabbitEarWidth(null)
    setRabbitHeadHeight(null)
    setRabbitHeadWidth(null)
    setBearBreedTemplateId(null)
    setBearEarHeight(null)
    setBearEarWidth(null)
    setBearHeadHeight(null)
    setBearHeadWidth(null)
    setSeededFields(current => current.filter(field => (
      !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField) ||
      (
        applicableFields.includes(field as AvatarSeedField) &&
        !authoredSceneFields.includes(field as AvatarSeedField)
      )
    )))
    setCoatPattern(current => ({
      ...current,
      enabled: (preset === 'cat' || preset === 'dog' || preset === 'rabbit' || preset === 'bear') && current.enabled
    }))
    setSelectedEntityPartId(null)
    setSurfaceDecals(nextScene?.surfaceDecals ?? [])
    setSelectedSurfaceDecalId(null)
    setSelectedSavedPresetId(null)
    if (nextFaceStyle != null) {
      setFaceStyle(nextFaceStyle)
      setAnimationPreviewFaceStyle(nextFaceStyle)
    }
    if (nextScene != null) {
      setAvatarOutlineStyle(nextScene.avatarOutlineStyle)
      setAvatarShadowStyle(nextScene.avatarShadowStyle)
      setAvatarViewState(nextScene.viewState)
      setAnimationPreviewViewState(nextScene.viewState)
      setBackgroundStyle(nextScene.backgroundStyle)
      setBodyShape('sphere')
      setBodyBottomTaper(0)
      setCameraBackground(nextScene.cameraBackground)
      setCameraFrame(nextScene.cameraFrame)
      setCameraMode(nextScene.cameraMode)
      setExportSize(DEFAULT_EXPORT_SIZE)
      setFrameShadowStyle(nextScene.frameShadowStyle)
      setGridDensity(nextScene.gridDensity)
      setInteractionMode(nextScene.interactionMode)
      setLightAzimuth(nextScene.lightAzimuth)
      setLightDistance(nextScene.lightDistance)
      setLightElevation(nextScene.lightElevation)
      setPixelEffect(DEFAULT_AVATAR_PIXEL_EFFECT)
      setSelectedPaletteId(nextScene.paletteId)
      paletteManuallyFixedRef.current = false
      appliedPaletteSeedRef.current = seed
      setShowAvatarShadow(nextScene.showAvatarShadow)
      setShowFrameShadow(nextScene.showFrameShadow)
      setShowLight(nextScene.showLight)
      setShowMorePalettes(
        AVATAR_PALETTES.findIndex(palette => palette.id === nextScene.paletteId) >= DEFAULT_PALETTE_COUNT
      )
      setShowOutline(nextScene.showOutline)
      setShowShadow(nextScene.showShadow)
    }
    setCopyState('idle')
  }

  const handleCatBreedTemplateChange = (profileId: AvatarCatBreedTemplateId | null) => {
    cancelSeededViewTransition()
    if (profileId == null) {
      setCatBreedTemplateId(null)
      setSeededFields(current => current.filter(
        field => !AVATAR_CAT_BREED_CONTROLLED_FIELDS.some(candidate => candidate === field)
      ))
      paletteManuallyFixedRef.current = true
      setSelectedSavedPresetId(null)
      setCopyState('idle')
      return
    }
    const template = getAvatarCatBreedTemplate(profileId)
    if (template == null) return
    const resolved = resolveAvatarCatBreedTemplate(template, seed, coatPattern)
    stopAnimationPlayback()
    setActiveAnimationKeyframe(null)
    setGenerationEnabled(true)
    resetAnimalBreedState()
    setCatBreedTemplateId(profileId)
    setDogBreedTemplateId(null)
    setRabbitBreedTemplateId(null)
    setBearBreedTemplateId(null)
    setEntityPreset('cat')
    setEntityParts(resolved.entityParts)
    setCatEarHeight(resolved.catEarHeight)
    setCatEarWidth(resolved.catEarWidth)
    setDogEarHeight(null)
    setDogEarWidth(null)
    setDogHeadHeight(null)
    setDogHeadWidth(null)
    setRabbitEarHeight(null)
    setRabbitEarWidth(null)
    setRabbitHeadHeight(null)
    setRabbitHeadWidth(null)
    setBearEarHeight(null)
    setBearEarWidth(null)
    setBearHeadHeight(null)
    setBearHeadWidth(null)
    setCoatPattern(resolved.coatPattern)
    setSelectedPaletteId(resolved.paletteId)
    paletteManuallyFixedRef.current = false
    appliedPaletteSeedRef.current = seed
    setSeededFields(current => [
      ...getApplicableAvatarSeedFields('cat', false).filter(field => (
        template.followByDefault.includes(field) ||
        (
          !AVATAR_CAT_BREED_CONTROLLED_FIELDS.some(candidate => candidate === field) &&
          current.includes(field)
        )
      )),
      ...current.filter(field => !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField))
    ])
    setSelectedEntityPartId(null)
    setSelectedSurfaceDecalId(null)
    setSelectedSavedPresetId(null)
    setShowMorePalettes(
      AVATAR_PALETTES.findIndex(palette => palette.id === resolved.paletteId) >= DEFAULT_PALETTE_COUNT
    )
    setCopyState('idle')
  }

  const handleDogBreedTemplateChange = (profileId: AvatarDogBreedTemplateId | null) => {
    cancelSeededViewTransition()
    if (profileId == null) {
      setDogBreedTemplateId(null)
      setSeededFields(current => current.filter(
        field => !AVATAR_DOG_BREED_CONTROLLED_FIELDS.some(candidate => candidate === field)
      ))
      paletteManuallyFixedRef.current = true
      setSelectedSavedPresetId(null)
      setCopyState('idle')
      return
    }
    const template = getAvatarDogBreedTemplate(profileId)
    if (template == null) return
    const resolved = resolveAvatarDogBreedTemplate(template, seed, coatPattern)
    stopAnimationPlayback()
    setActiveAnimationKeyframe(null)
    setGenerationEnabled(true)
    resetAnimalBreedState()
    setCatBreedTemplateId(null)
    setDogBreedTemplateId(profileId)
    setRabbitBreedTemplateId(null)
    setBearBreedTemplateId(null)
    setEntityPreset('dog')
    setEntityParts(resolved.entityParts)
    setCatEarHeight(null)
    setCatEarWidth(null)
    setDogEarHeight(resolved.dogEarHeight)
    setDogEarWidth(resolved.dogEarWidth)
    setDogHeadHeight(resolved.dogHeadHeight)
    setDogHeadWidth(resolved.dogHeadWidth)
    setRabbitEarHeight(null)
    setRabbitEarWidth(null)
    setRabbitHeadHeight(null)
    setRabbitHeadWidth(null)
    setBearEarHeight(null)
    setBearEarWidth(null)
    setBearHeadHeight(null)
    setBearHeadWidth(null)
    setCoatPattern(resolved.coatPattern)
    setSelectedPaletteId(resolved.paletteId)
    paletteManuallyFixedRef.current = false
    appliedPaletteSeedRef.current = seed
    setSeededFields(current => [
      ...getApplicableAvatarSeedFields('dog', false).filter(field => (
        template.followByDefault.includes(field) ||
        (
          !AVATAR_DOG_BREED_CONTROLLED_FIELDS.some(candidate => candidate === field) &&
          current.includes(field)
        )
      )),
      ...current.filter(field => !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField))
    ])
    setSelectedEntityPartId(null)
    setSelectedSurfaceDecalId(null)
    setSelectedSavedPresetId(null)
    setShowMorePalettes(
      AVATAR_PALETTES.findIndex(palette => palette.id === resolved.paletteId) >= DEFAULT_PALETTE_COUNT
    )
    setCopyState('idle')
  }

  const handleRabbitBreedTemplateChange = (profileId: AvatarRabbitBreedTemplateId | null) => {
    cancelSeededViewTransition()
    if (profileId == null) {
      setRabbitBreedTemplateId(null)
      setSeededFields(current => current.filter(
        field => !AVATAR_RABBIT_BREED_CONTROLLED_FIELDS.some(candidate => candidate === field)
      ))
      paletteManuallyFixedRef.current = true
      setSelectedSavedPresetId(null)
      setCopyState('idle')
      return
    }
    const template = getAvatarRabbitBreedTemplate(profileId)
    if (template == null) return
    const resolved = resolveAvatarRabbitBreedTemplate(template, seed, coatPattern)
    stopAnimationPlayback()
    setActiveAnimationKeyframe(null)
    setGenerationEnabled(true)
    resetAnimalBreedState()
    setCatBreedTemplateId(null)
    setDogBreedTemplateId(null)
    setRabbitBreedTemplateId(profileId)
    setBearBreedTemplateId(null)
    setEntityPreset('rabbit')
    setEntityParts(resolved.entityParts)
    setCatEarHeight(null)
    setCatEarWidth(null)
    setDogEarHeight(null)
    setDogEarWidth(null)
    setDogHeadHeight(null)
    setDogHeadWidth(null)
    setRabbitEarHeight(resolved.rabbitEarHeight)
    setRabbitEarWidth(resolved.rabbitEarWidth)
    setRabbitHeadHeight(resolved.rabbitHeadHeight)
    setRabbitHeadWidth(resolved.rabbitHeadWidth)
    setBearEarHeight(null)
    setBearEarWidth(null)
    setBearHeadHeight(null)
    setBearHeadWidth(null)
    setCoatPattern(resolved.coatPattern)
    setSelectedPaletteId(resolved.paletteId)
    paletteManuallyFixedRef.current = false
    appliedPaletteSeedRef.current = seed
    setSeededFields(current => [
      ...getApplicableAvatarSeedFields('rabbit', false).filter(field => (
        template.followByDefault.includes(field) || (
          !AVATAR_RABBIT_BREED_CONTROLLED_FIELDS.some(candidate => candidate === field) && current.includes(field)
        )
      )),
      ...current.filter(field => !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField))
    ])
    setSelectedEntityPartId(null)
    setSelectedSurfaceDecalId(null)
    setSelectedSavedPresetId(null)
    setShowMorePalettes(
      AVATAR_PALETTES.findIndex(palette => palette.id === resolved.paletteId) >= DEFAULT_PALETTE_COUNT
    )
    setCopyState('idle')
  }

  const handleBearBreedTemplateChange = (profileId: AvatarBearBreedTemplateId | null) => {
    cancelSeededViewTransition()
    if (profileId == null) {
      setBearBreedTemplateId(null)
      setSeededFields(current => current.filter(
        field => !AVATAR_BEAR_BREED_CONTROLLED_FIELDS.some(candidate => candidate === field)
      ))
      paletteManuallyFixedRef.current = true
      setSelectedSavedPresetId(null)
      setCopyState('idle')
      return
    }
    const template = getAvatarBearBreedTemplate(profileId)
    if (template == null) return
    const resolved = resolveAvatarBearBreedTemplate(template, seed, coatPattern)
    stopAnimationPlayback()
    setActiveAnimationKeyframe(null)
    setGenerationEnabled(true)
    resetAnimalBreedState()
    setCatBreedTemplateId(null)
    setDogBreedTemplateId(null)
    setRabbitBreedTemplateId(null)
    setBearBreedTemplateId(profileId)
    setEntityPreset('bear')
    setEntityParts(resolved.entityParts)
    setCatEarHeight(null)
    setCatEarWidth(null)
    setDogEarHeight(null)
    setDogEarWidth(null)
    setDogHeadHeight(null)
    setDogHeadWidth(null)
    setRabbitEarHeight(null)
    setRabbitEarWidth(null)
    setRabbitHeadHeight(null)
    setRabbitHeadWidth(null)
    setBearEarWidth(resolved.bearEarWidth)
    setBearEarHeight(resolved.bearEarHeight)
    setBearHeadWidth(resolved.bearHeadWidth)
    setBearHeadHeight(resolved.bearHeadHeight)
    if (template.fixed.faceStyle != null) {
      setFaceStyle(resolved.faceStyle)
      setAnimationPreviewFaceStyle(resolved.faceStyle)
    }
    setCoatPattern(resolved.coatPattern)
    setSelectedPaletteId(resolved.paletteId)
    paletteManuallyFixedRef.current = false
    appliedPaletteSeedRef.current = seed
    setSeededFields(current => [
      ...getApplicableAvatarSeedFields('bear', false).filter(field => (
        template.followByDefault.includes(field) || (
          !AVATAR_BEAR_BREED_CONTROLLED_FIELDS.some(candidate => candidate === field) && current.includes(field)
        )
      )),
      ...current.filter(field => !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField))
    ])
    setSelectedEntityPartId(null)
    setSelectedSurfaceDecalId(null)
    setSelectedSavedPresetId(null)
    setShowMorePalettes(
      AVATAR_PALETTES.findIndex(palette => palette.id === resolved.paletteId) >= DEFAULT_PALETTE_COUNT
    )
    setCopyState('idle')
  }

  const handleAnimalBreedTemplateChange = (profileId: string | null) => {
    if (!isAvatarAnimalSpeciesId(entityPreset)) return
    const species = entityPreset
    cancelSeededViewTransition()
    if (profileId == null) {
      setAnimalBreedTemplateId(null)
      setSeededFields(current => current.filter(
        field => !getAvatarAnimalBreedControlledFields(species).includes(field as AvatarSeedField)
      ))
      paletteManuallyFixedRef.current = true
      setSelectedSavedPresetId(null)
      setCopyState('idle')
      return
    }

    const template = getAvatarAnimalBreedTemplate(species, profileId)
    if (template == null) return
    const resolved = resolveAvatarAnimalBreedTemplate(template, seed, coatPattern)
    stopAnimationPlayback()
    setActiveAnimationKeyframe(null)
    setGenerationEnabled(true)
    setCatBreedTemplateId(null)
    setDogBreedTemplateId(null)
    setRabbitBreedTemplateId(null)
    setBearBreedTemplateId(null)
    setAnimalBreedTemplateId(profileId)
    setEntityPreset(species)
    setEntityParts(resolved.entityParts)
    if (resolved.surfaceDecals != null) setSurfaceDecals(resolved.surfaceDecals)
    setAnimalEarWidth(resolved.earWidth)
    setAnimalEarHeight(resolved.earHeight)
    setAnimalHeadWidth(resolved.headWidth)
    setAnimalHeadHeight(resolved.headHeight)
    setAnimalHornSize(resolved.hornSize ?? null)
    setCatEarHeight(null)
    setCatEarWidth(null)
    setDogEarHeight(null)
    setDogEarWidth(null)
    setDogHeadHeight(null)
    setDogHeadWidth(null)
    setRabbitEarHeight(null)
    setRabbitEarWidth(null)
    setRabbitHeadHeight(null)
    setRabbitHeadWidth(null)
    setBearEarHeight(null)
    setBearEarWidth(null)
    setBearHeadHeight(null)
    setBearHeadWidth(null)
    setFaceStyle(resolved.faceStyle)
    setAnimationPreviewFaceStyle(resolved.faceStyle)
    setCoatPattern(resolved.coatPattern)
    setSelectedPaletteId(resolved.paletteId)
    paletteManuallyFixedRef.current = false
    appliedPaletteSeedRef.current = seed
    const controlledFields = getAvatarAnimalBreedControlledFields(species)
    setSeededFields(current => [
      ...getApplicableAvatarSeedFields(species, false).filter(field => (
        template.followByDefault.includes(field) || (
          !controlledFields.includes(field) && current.includes(field)
        )
      )),
      ...current.filter(field => !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField))
    ])
    setSelectedEntityPartId(null)
    setSelectedSurfaceDecalId(null)
    setSelectedSavedPresetId(null)
    setShowMorePalettes(
      AVATAR_PALETTES.findIndex(palette => palette.id === resolved.paletteId) >= DEFAULT_PALETTE_COUNT
    )
    setCopyState('idle')
  }

  const markSeedFieldsManual = (...fields: readonly AvatarSeedField[]) => {
    setSeededFields(current => current.filter(field => !fields.includes(field as AvatarSeedField)))
  }

  const ensureNaturalCoatPalette = (nextSeed: string, paletteSeeded: boolean) => {
    if (
      entityPreset !== 'cat' && entityPreset !== 'dog' && entityPreset !== 'rabbit' &&
      entityPreset !== 'bear' && !isAvatarAnimalSpeciesId(entityPreset)
    ) {
      return
    }
    const breedTemplate = isAvatarAnimalSpeciesId(entityPreset)
      ? getAvatarAnimalBreedTemplate(entityPreset, animalBreedTemplateId)
      : entityPreset === 'dog'
      ? getAvatarDogBreedTemplate(dogBreedTemplateId)
      : entityPreset === 'rabbit'
        ? getAvatarRabbitBreedTemplate(rabbitBreedTemplateId)
        : entityPreset === 'bear'
          ? getAvatarBearBreedTemplate(bearBreedTemplateId)
          : getAvatarCatBreedTemplate(catBreedTemplateId)
    const paletteCandidates = breedTemplate?.seedDomain.paletteIds ?? (
      isAvatarAnimalSpeciesId(entityPreset)
        ? getAvatarAnimalBreedTemplates(entityPreset).map(template => template.fixed.paletteId)
        : entityPreset === 'dog'
        ? AVATAR_DOG_COMPATIBLE_PALETTE_IDS
        : entityPreset === 'rabbit'
          ? AVATAR_RABBIT_COMPATIBLE_PALETTE_IDS
          : entityPreset === 'bear'
            ? AVATAR_BEAR_COMPATIBLE_PALETTE_IDS
            : AVATAR_TABBY_COMPATIBLE_PALETTE_IDS
    )
    const compatible = paletteCandidates.some(candidate => candidate === selectedPaletteId)
    if (!paletteSeeded && (paletteManuallyFixedRef.current || compatible)) return
    const paletteId = paletteSeeded
      ? resolveSeededAvatarPaletteId(nextSeed, paletteCandidates)
      : breedTemplate?.fixed.paletteId ?? (isAvatarAnimalSpeciesId(entityPreset)
        ? getAvatarAnimalBreedTemplates(entityPreset)[0]?.fixed.paletteId ?? DEFAULT_PALETTE_ID
        : entityPreset === 'dog'
        ? AVATAR_DOG_COMPATIBLE_PALETTE_IDS[0]!
        : entityPreset === 'rabbit'
          ? AVATAR_RABBIT_COMPATIBLE_PALETTE_IDS[0]!
          : entityPreset === 'bear'
            ? AVATAR_BEAR_COMPATIBLE_PALETTE_IDS[0]!
            : DEFAULT_TABBY_PALETTE_ID)
    const palette = paletteSeeded && breedTemplate != null && breedTemplate.fixed.paletteId === paletteId
      ? resolveAvatarBreedPalette(paletteId, nextSeed, breedTemplate.seedDomain)
      : getAvatarPalette(paletteId)
    setSelectedPaletteId(paletteId)
    setEntityParts(currentParts => {
      const paletteParts = applyAvatarEntityPalette(currentParts, palette)
      return entityPreset === 'bear'
        ? applyAvatarBearBreedForeground(paletteParts, getAvatarBearBreedTemplate(bearBreedTemplateId))
        : paletteParts
    })
    paletteManuallyFixedRef.current = false
    appliedPaletteSeedRef.current = nextSeed
  }

  const applySeededFields = (nextSeed: string, fields: readonly string[]) => {
    const orderedFields = AVATAR_SEED_FIELDS.filter(field => fields.includes(field))
    if (orderedFields.length === 0) return
    const visibleSeededView = fields.includes(AVATAR_SEED_FIELD.viewPose)
      ? seededViewTransitionViewRef.current ?? undefined
      : undefined
    stopAnimationPlayback()
    setActiveAnimationKeyframe(null)

    const breedTemplate = isAvatarAnimalSpeciesId(entityPreset)
      ? getAvatarAnimalBreedTemplate(entityPreset, animalBreedTemplateId)
      : entityPreset === 'dog'
      ? getAvatarDogBreedTemplate(dogBreedTemplateId)
      : entityPreset === 'rabbit'
        ? getAvatarRabbitBreedTemplate(rabbitBreedTemplateId)
        : entityPreset === 'bear'
          ? getAvatarBearBreedTemplate(bearBreedTemplateId)
          : getAvatarCatBreedTemplate(catBreedTemplateId)
    const seedDomain = breedTemplate?.seedDomain
    const resolvedEntityPreset = fields.includes(AVATAR_SEED_FIELD.entityPreset)
      ? resolveSeededAvatarEntityPreset(nextSeed)
      : entityPreset
    const resolvedEntityParts = fields.includes(AVATAR_SEED_FIELD.entityPreset)
      ? createAvatarEntityParts(resolvedEntityPreset)
      : entityParts
    const animalSpecies = isAvatarAnimalSpeciesId(resolvedEntityPreset) ? resolvedEntityPreset : null
    const animalFields = animalSpecies == null ? null : AVATAR_ANIMAL_SPECIES_SEED_FIELDS[animalSpecies]
    const nextAnimalEarWidth = animalFields != null && fields.includes(animalFields.earWidth)
      ? resolveSeededAvatarAnimalScale(nextSeed, animalFields.earWidth, seedDomain)
      : animalEarWidth
    const nextAnimalEarHeight = animalFields != null && fields.includes(animalFields.earHeight)
      ? resolveSeededAvatarAnimalScale(nextSeed, animalFields.earHeight, seedDomain)
      : animalEarHeight
    const nextAnimalHeadWidth = animalFields != null && fields.includes(animalFields.headWidth)
      ? resolveSeededAvatarAnimalScale(nextSeed, animalFields.headWidth, seedDomain)
      : animalHeadWidth
    const nextAnimalHeadHeight = animalFields != null && fields.includes(animalFields.headHeight)
      ? resolveSeededAvatarAnimalScale(nextSeed, animalFields.headHeight, seedDomain)
      : animalHeadHeight
    const hornField = animalSpecies === 'deer'
      ? AVATAR_SEED_FIELD.deerAntlerSize
      : animalSpecies === 'sheep'
        ? AVATAR_SEED_FIELD.sheepHornSize
        : null
    const nextAnimalHornSize = hornField != null && fields.includes(hornField)
      ? resolveSeededAvatarAnimalScale(nextSeed, hornField, seedDomain)
      : animalHornSize
    const nextCatEarWidth = fields.includes(AVATAR_SEED_FIELD.catEarWidth)
      ? resolveSeededAvatarCatEarScale(nextSeed, 'width', seedDomain)
      : catEarWidth
    const nextCatEarHeight = fields.includes(AVATAR_SEED_FIELD.catEarHeight)
      ? resolveSeededAvatarCatEarScale(nextSeed, 'height', seedDomain)
      : catEarHeight
    const nextDogEarWidth = fields.includes(AVATAR_SEED_FIELD.dogEarWidth)
      ? resolveSeededAvatarDogEarScale(nextSeed, 'width', seedDomain)
      : dogEarWidth
    const nextDogEarHeight = fields.includes(AVATAR_SEED_FIELD.dogEarHeight)
      ? resolveSeededAvatarDogEarScale(nextSeed, 'height', seedDomain)
      : dogEarHeight
    const nextDogHeadWidth = fields.includes(AVATAR_SEED_FIELD.dogHeadWidth)
      ? resolveSeededAvatarDogHeadScale(nextSeed, 'width', seedDomain)
      : dogHeadWidth
    const nextDogHeadHeight = fields.includes(AVATAR_SEED_FIELD.dogHeadHeight)
      ? resolveSeededAvatarDogHeadScale(nextSeed, 'height', seedDomain)
      : dogHeadHeight
    const nextRabbitEarWidth = fields.includes(AVATAR_SEED_FIELD.rabbitEarWidth)
      ? resolveSeededAvatarRabbitEarScale(nextSeed, 'width', seedDomain)
      : rabbitEarWidth
    const nextRabbitEarHeight = fields.includes(AVATAR_SEED_FIELD.rabbitEarHeight)
      ? resolveSeededAvatarRabbitEarScale(nextSeed, 'height', seedDomain)
      : rabbitEarHeight
    const nextRabbitHeadWidth = fields.includes(AVATAR_SEED_FIELD.rabbitHeadWidth)
      ? resolveSeededAvatarRabbitHeadScale(nextSeed, 'width', seedDomain)
      : rabbitHeadWidth
    const nextRabbitHeadHeight = fields.includes(AVATAR_SEED_FIELD.rabbitHeadHeight)
      ? resolveSeededAvatarRabbitHeadScale(nextSeed, 'height', seedDomain)
      : rabbitHeadHeight
    const nextBearEarWidth = fields.includes(AVATAR_SEED_FIELD.bearEarWidth)
      ? resolveSeededAvatarBearEarScale(nextSeed, 'width', seedDomain)
      : bearEarWidth
    const nextBearEarHeight = fields.includes(AVATAR_SEED_FIELD.bearEarHeight)
      ? resolveSeededAvatarBearEarScale(nextSeed, 'height', seedDomain)
      : bearEarHeight
    const nextBearHeadWidth = fields.includes(AVATAR_SEED_FIELD.bearHeadWidth)
      ? resolveSeededAvatarBearHeadScale(nextSeed, 'width', seedDomain)
      : bearHeadWidth
    const nextBearHeadHeight = fields.includes(AVATAR_SEED_FIELD.bearHeadHeight)
      ? resolveSeededAvatarBearHeadScale(nextSeed, 'height', seedDomain)
      : bearHeadHeight
    const resolvedSizedEntityParts = resolvedEntityPreset === 'cat'
      ? applyCatEarScale(resolvedEntityParts, nextCatEarWidth ?? undefined, nextCatEarHeight ?? undefined)
      : resolvedEntityPreset === 'dog'
        ? applyDogHeadScale(
          applyDogEarScale(resolvedEntityParts, nextDogEarWidth ?? undefined, nextDogEarHeight ?? undefined),
          nextDogHeadWidth ?? undefined,
          nextDogHeadHeight ?? undefined
        )
        : resolvedEntityPreset === 'rabbit'
          ? applyRabbitHeadScale(
            applyRabbitEarScale(resolvedEntityParts, nextRabbitEarWidth ?? undefined, nextRabbitEarHeight ?? undefined),
            nextRabbitHeadWidth ?? undefined,
            nextRabbitHeadHeight ?? undefined
          )
          : resolvedEntityPreset === 'bear'
            ? applyBearHeadScale(
              applyBearEarScale(resolvedEntityParts, nextBearEarWidth ?? undefined, nextBearEarHeight ?? undefined),
              nextBearHeadWidth ?? undefined,
              nextBearHeadHeight ?? undefined
            )
            : animalSpecies != null
              ? applyAvatarAnimalDimensions(
                resolvedEntityParts,
                animalSpecies,
                {
                  earHeight: nextAnimalEarHeight ?? undefined,
                  earWidth: nextAnimalEarWidth ?? undefined,
                  headHeight: nextAnimalHeadHeight ?? undefined,
                  headWidth: nextAnimalHeadWidth ?? undefined,
                  hornSize: nextAnimalHornSize ?? undefined
                },
                getAvatarAnimalBreedTemplate(animalSpecies, animalBreedTemplateId)?.fixed.hornStyle
              )
              : resolvedEntityParts
    const coatPatternFields = orderedFields.filter(field => field.startsWith('scene.appearance.coatPattern.'))
    const resolvedCoatPattern = coatPatternFields.length > 0
      ? resolveSeededAvatarCoatPattern(nextSeed, coatPattern, coatPatternFields, seedDomain)
      : coatPattern
    const useCoatPalette = (
      resolvedEntityPreset === 'cat' || resolvedEntityPreset === 'dog' ||
      resolvedEntityPreset === 'rabbit' || resolvedEntityPreset === 'bear' || animalSpecies != null
    ) && (
      coatPattern.enabled || coatPatternFields.length > 0
    )
    const resolvedPaletteId = fields.includes(AVATAR_SEED_FIELD.palette)
      ? seedDomain?.paletteIds != null
        ? resolveSeededAvatarPaletteId(nextSeed, seedDomain.paletteIds)
        : animalSpecies != null
          ? resolveSeededAvatarPaletteId(
            nextSeed,
            getAvatarAnimalBreedTemplates(animalSpecies).map(template => template.fixed.paletteId)
          )
        : useCoatPalette
          ? resolveSeededAvatarPaletteId(nextSeed, resolvedEntityPreset === 'dog'
            ? AVATAR_DOG_COMPATIBLE_PALETTE_IDS
            : resolvedEntityPreset === 'rabbit'
              ? AVATAR_RABBIT_COMPATIBLE_PALETTE_IDS
              : resolvedEntityPreset === 'bear'
                ? AVATAR_BEAR_COMPATIBLE_PALETTE_IDS
                : AVATAR_TABBY_COMPATIBLE_PALETTE_IDS)
        : resolveSeededAvatarPaletteId(nextSeed)
      : selectedPaletteId
    const resolvedViewState = fields.includes(AVATAR_SEED_FIELD.viewPose)
      ? resolveSeededAvatarView(nextSeed, avatarViewStateRef.current)
      : null

    for (const field of orderedFields) {
      if (field === AVATAR_SEED_FIELD.entityPreset) {
        const scene = getAvatarEntityPresetScene(resolvedEntityPreset)
        const entityChanged = resolvedEntityPreset !== entityPreset
        setEntityPreset(resolvedEntityPreset)
        if (resolvedEntityPreset !== 'cat') setCatBreedTemplateId(null)
        if (resolvedEntityPreset !== 'dog') setDogBreedTemplateId(null)
        if (resolvedEntityPreset !== 'rabbit') setRabbitBreedTemplateId(null)
        if (resolvedEntityPreset !== 'bear') setBearBreedTemplateId(null)
        if (!isAvatarAnimalSpeciesId(resolvedEntityPreset) || entityChanged) resetAnimalBreedState()
        setEntityParts(applyAvatarEntityPalette(
          resolvedSizedEntityParts,
          getAvatarPalette(selectedPaletteId)
        ))
        setBodyShape('sphere')
        setBodyBottomTaper(0)
        if (entityChanged) setSurfaceDecals(scene?.surfaceDecals ?? [])
        setSelectedEntityPartId(null)
        setSelectedSurfaceDecalId(null)
        continue
      }
      if (animalSpecies != null && animalFields != null) {
        let nextDimensions: Partial<ReturnType<typeof getAvatarAnimalDimensions>> | null = null
        if (field === animalFields.earWidth) {
          setAnimalEarWidth(nextAnimalEarWidth)
          nextDimensions = { earWidth: nextAnimalEarWidth ?? undefined }
        } else if (field === animalFields.earHeight) {
          setAnimalEarHeight(nextAnimalEarHeight)
          nextDimensions = { earHeight: nextAnimalEarHeight ?? undefined }
        } else if (field === animalFields.headWidth) {
          setAnimalHeadWidth(nextAnimalHeadWidth)
          nextDimensions = { headWidth: nextAnimalHeadWidth ?? undefined }
        } else if (field === animalFields.headHeight) {
          setAnimalHeadHeight(nextAnimalHeadHeight)
          nextDimensions = { headHeight: nextAnimalHeadHeight ?? undefined }
        } else if (field === hornField) {
          setAnimalHornSize(nextAnimalHornSize)
          nextDimensions = { hornSize: nextAnimalHornSize ?? undefined }
        }
        if (nextDimensions != null) {
          const dimensions = nextDimensions
          setEntityParts(currentParts => applyAvatarAnimalDimensions(
            currentParts,
            animalSpecies,
            dimensions,
            getAvatarAnimalBreedTemplate(animalSpecies, animalBreedTemplateId)?.fixed.hornStyle
          ))
          continue
        }
      }
      if (field === AVATAR_SEED_FIELD.catEarWidth) {
        setCatEarWidth(nextCatEarWidth)
        if (resolvedEntityPreset === 'cat') {
          setEntityParts(currentParts => applyCatEarScale(currentParts, nextCatEarWidth ?? undefined, undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.catEarHeight) {
        setCatEarHeight(nextCatEarHeight)
        if (resolvedEntityPreset === 'cat') {
          setEntityParts(currentParts => applyCatEarScale(currentParts, undefined, nextCatEarHeight ?? undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.dogEarWidth) {
        setDogEarWidth(nextDogEarWidth)
        if (resolvedEntityPreset === 'dog') {
          setEntityParts(currentParts => applyDogEarScale(currentParts, nextDogEarWidth ?? undefined, undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.dogEarHeight) {
        setDogEarHeight(nextDogEarHeight)
        if (resolvedEntityPreset === 'dog') {
          setEntityParts(currentParts => applyDogEarScale(currentParts, undefined, nextDogEarHeight ?? undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.dogHeadWidth) {
        setDogHeadWidth(nextDogHeadWidth)
        if (resolvedEntityPreset === 'dog') {
          setEntityParts(currentParts => applyDogHeadScale(currentParts, nextDogHeadWidth ?? undefined, undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.dogHeadHeight) {
        setDogHeadHeight(nextDogHeadHeight)
        if (resolvedEntityPreset === 'dog') {
          setEntityParts(currentParts => applyDogHeadScale(currentParts, undefined, nextDogHeadHeight ?? undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.rabbitEarWidth) {
        setRabbitEarWidth(nextRabbitEarWidth)
        if (resolvedEntityPreset === 'rabbit') {
          setEntityParts(currentParts => applyRabbitEarScale(currentParts, nextRabbitEarWidth ?? undefined, undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.rabbitEarHeight) {
        setRabbitEarHeight(nextRabbitEarHeight)
        if (resolvedEntityPreset === 'rabbit') {
          setEntityParts(currentParts => applyRabbitEarScale(currentParts, undefined, nextRabbitEarHeight ?? undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.rabbitHeadWidth) {
        setRabbitHeadWidth(nextRabbitHeadWidth)
        if (resolvedEntityPreset === 'rabbit') {
          setEntityParts(currentParts => applyRabbitHeadScale(currentParts, nextRabbitHeadWidth ?? undefined, undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.rabbitHeadHeight) {
        setRabbitHeadHeight(nextRabbitHeadHeight)
        if (resolvedEntityPreset === 'rabbit') {
          setEntityParts(currentParts => applyRabbitHeadScale(currentParts, undefined, nextRabbitHeadHeight ?? undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.bearEarWidth) {
        setBearEarWidth(nextBearEarWidth)
        if (resolvedEntityPreset === 'bear') {
          setEntityParts(currentParts => applyBearEarScale(currentParts, nextBearEarWidth ?? undefined, undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.bearEarHeight) {
        setBearEarHeight(nextBearEarHeight)
        if (resolvedEntityPreset === 'bear') {
          setEntityParts(currentParts => applyBearEarScale(currentParts, undefined, nextBearEarHeight ?? undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.bearHeadWidth) {
        setBearHeadWidth(nextBearHeadWidth)
        if (resolvedEntityPreset === 'bear') {
          setEntityParts(currentParts => applyBearHeadScale(currentParts, nextBearHeadWidth ?? undefined, undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.bearHeadHeight) {
        setBearHeadHeight(nextBearHeadHeight)
        if (resolvedEntityPreset === 'bear') {
          setEntityParts(currentParts => applyBearHeadScale(currentParts, undefined, nextBearHeadHeight ?? undefined))
        }
        continue
      }
      if (field === AVATAR_SEED_FIELD.facePreset) {
        const nextFaceStyle = constrainSeededBreedFaceStyle(
          resolveSeededAvatarFacePreset(nextSeed).style,
          resolvedEntityPreset,
          bearBreedTemplateId,
          animalBreedTemplateId
        )
        setFaceStyle(nextFaceStyle)
        setAnimationPreviewFaceStyle(nextFaceStyle)
        continue
      }
      if (field === AVATAR_SEED_FIELD.palette) {
        const previousPaletteSeed = appliedPaletteSeedRef.current
        const palette = breedTemplate != null && breedTemplate.fixed.paletteId === resolvedPaletteId
          ? resolveAvatarBreedPalette(resolvedPaletteId, nextSeed, breedTemplate.seedDomain)
          : getAvatarPalette(resolvedPaletteId)
        setSelectedPaletteId(resolvedPaletteId)
        paletteManuallyFixedRef.current = false
        appliedPaletteSeedRef.current = nextSeed
        setEntityParts(currentParts => {
          const paletteParts = applyAvatarEntityPalette(currentParts, palette)
          return resolvedEntityPreset === 'bear'
            ? applyAvatarBearBreedForeground(paletteParts, getAvatarBearBreedTemplate(bearBreedTemplateId))
            : paletteParts
        })
        if (animalSpecies != null) {
          const animalTemplate = getAvatarAnimalBreedTemplate(animalSpecies, animalBreedTemplateId)
          if (animalTemplate != null) {
            const previousDecals = resolveAvatarAnimalBreedTemplate(animalTemplate, previousPaletteSeed).surfaceDecals ?? []
            const nextDecals = resolveAvatarAnimalBreedTemplate(animalTemplate, nextSeed).surfaceDecals ?? []
            const previousById = new Map(previousDecals.map(decal => [decal.id, decal]))
            const nextById = new Map(nextDecals.map(decal => [decal.id, decal]))
            setSurfaceDecals(current => current.map(decal => {
              const previous = previousById.get(decal.id)
              const updated = nextById.get(decal.id)
              return updated != null && previous?.color.toLowerCase() === decal.color.toLowerCase()
                ? { ...decal, color: updated.color }
                : decal
            }))
          }
        }
        continue
      }
      if (field.startsWith('scene.appearance.coatPattern.')) continue
      if (field === AVATAR_SEED_FIELD.backgroundStyle) {
        setBackgroundStyle(resolveSeededAvatarBackgroundStyle(nextSeed))
        continue
      }
      if (field === AVATAR_SEED_FIELD.cameraBackground) {
        setCameraBackground(resolveSeededAvatarCameraBackground(nextSeed))
        continue
      }
      if (field === AVATAR_SEED_FIELD.viewPose && resolvedViewState != null) {
        startSeededViewTransition(resolvedViewState, visibleSeededView)
      }
    }

    if (coatPatternFields.length > 0) {
      setCoatPattern({ ...resolvedCoatPattern, enabled: true })
      setSelectedSurfaceDecalId(null)
    }

    setSelectedSavedPresetId(null)
    setCopyState('idle')
  }

  const handleSeedChange = (value: string) => {
    const nextSeed = normalizeEditorAvatarSeed(value)
    setGenerationEnabled(true)
    setSeed(nextSeed)
    applySeededFields(nextSeed, seededFields)
  }

  const handleRandomSeed = () => {
    const nextSeed = createRandomAvatarSeed()
    const breedTemplate = isAvatarAnimalSpeciesId(entityPreset)
      ? getAvatarAnimalBreedTemplate(entityPreset, animalBreedTemplateId)
      : entityPreset === 'dog'
      ? getAvatarDogBreedTemplate(dogBreedTemplateId)
      : entityPreset === 'rabbit'
        ? getAvatarRabbitBreedTemplate(rabbitBreedTemplateId)
        : entityPreset === 'bear'
          ? getAvatarBearBreedTemplate(bearBreedTemplateId)
          : getAvatarCatBreedTemplate(catBreedTemplateId)
    const randomEntityPreset = entityPreset === 'custom'
      ? resolveSeededAvatarEntityPreset(nextSeed)
      : entityPreset
    const activeFields = seededFields.length === 0
      ? breedTemplate == null
        ? getApplicableAvatarSeedFields(randomEntityPreset, entityPreset === 'custom')
        : paletteManuallyFixedRef.current
          ? breedTemplate.followByDefault.filter(field => field !== AVATAR_SEED_FIELD.palette)
          : breedTemplate.followByDefault
      : seededFields
    const randomFields = breedTemplate != null && !activeFields.includes(AVATAR_SEED_FIELD.viewPose)
      ? [...activeFields, AVATAR_SEED_FIELD.viewPose]
      : activeFields
    setGenerationEnabled(true)
    setSeed(nextSeed)
    if (seededFields.length === 0 || randomFields !== activeFields) {
      setSeededFields(current => [
        ...AVATAR_SEED_FIELDS.filter(field => randomFields.includes(field) || current.includes(field)),
        ...current.filter(field => !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField))
      ])
    }
    applySeededFields(nextSeed, randomFields)
  }

  const handleSeedFieldToggle = (field: AvatarSeedField, enabled: boolean) => {
    setGenerationEnabled(true)
    if (!enabled) {
      if (field === AVATAR_SEED_FIELD.viewPose) cancelSeededViewTransition()
      if (field === AVATAR_SEED_FIELD.palette) paletteManuallyFixedRef.current = true
      markSeedFieldsManual(field)
      return
    }
    if (field === AVATAR_SEED_FIELD.palette) paletteManuallyFixedRef.current = false
    const nextSeed = normalizeEditorAvatarSeed(seed)
    setSeed(nextSeed)
    if (field === AVATAR_SEED_FIELD.entityPreset) {
      setCatBreedTemplateId(null)
      setDogBreedTemplateId(null)
      setRabbitBreedTemplateId(null)
      setBearBreedTemplateId(null)
      resetAnimalBreedState()
    }
    if (field.startsWith('scene.appearance.coatPattern.')) {
      setCoatPattern(current => ({ ...current, enabled: true }))
    }
    setSeededFields(current => [
      ...AVATAR_SEED_FIELDS.filter(candidate => candidate === field || current.includes(candidate)),
      ...current.filter(candidate => !AVATAR_SEED_FIELDS.includes(candidate as AvatarSeedField))
    ])
    const paletteSeeded = seededFields.includes(AVATAR_SEED_FIELD.palette)
    if (field.startsWith('scene.appearance.coatPattern.') && !paletteSeeded) {
      ensureNaturalCoatPalette(nextSeed, false)
    }
    const dependentEntityFields = field === AVATAR_SEED_FIELD.entityPreset
      ? [
        field,
        ...[
          AVATAR_SEED_FIELD.catEarWidth,
          AVATAR_SEED_FIELD.catEarHeight,
          AVATAR_SEED_FIELD.dogEarWidth,
          AVATAR_SEED_FIELD.dogEarHeight,
          AVATAR_SEED_FIELD.dogHeadWidth,
          AVATAR_SEED_FIELD.dogHeadHeight,
          AVATAR_SEED_FIELD.rabbitEarWidth,
          AVATAR_SEED_FIELD.rabbitEarHeight,
          AVATAR_SEED_FIELD.rabbitHeadWidth,
          AVATAR_SEED_FIELD.rabbitHeadHeight,
          AVATAR_SEED_FIELD.bearEarWidth,
          AVATAR_SEED_FIELD.bearEarHeight,
          AVATAR_SEED_FIELD.bearHeadWidth,
          AVATAR_SEED_FIELD.bearHeadHeight,
          ...Object.values(AVATAR_ANIMAL_SPECIES_SEED_FIELDS).flatMap(candidate => Object.values(candidate)),
          AVATAR_SEED_FIELD.deerAntlerSize,
          AVATAR_SEED_FIELD.sheepHornSize
        ]
          .filter(candidate => seededFields.includes(candidate))
      ]
      : [field]
    applySeededFields(
      nextSeed,
      field.startsWith('scene.appearance.coatPattern.') && paletteSeeded
        ? [field, AVATAR_SEED_FIELD.palette]
        : dependentEntityFields
    )
  }

  const handleCopy = async () => {
    const sourceSvg = avatarFrameRef.current?.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
    if (sourceSvg == null) return
    await navigator.clipboard.writeText(
      await renderAvatarSvgSource(sourceSvg, exportSize, {
        ...avatarCaptureOptions
      })
    )
    setCopyState('copied')
    window.setTimeout(() => setCopyState('idle'), 1400)
  }

  const handleDownload = async () => {
    const sourceSvg = avatarFrameRef.current?.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
    if (sourceSvg == null) return
    const source = await renderAvatarSvgSource(sourceSvg, exportSize, {
      ...avatarCaptureOptions
    })
    downloadBlob(
      `oneworks-avatar-${entityPreset}-${exportSize}.svg`,
      new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    )
  }

  const handlePngDownload = async () => {
    const sourceSvg = await waitForAvatarExportSvg(avatarFrameRef.current)
    if (sourceSvg == null) return false
    try {
      const png = await renderAvatarPngBlob(sourceSvg, exportSize, {
        ...avatarCaptureOptions
      })
      downloadBlob(`oneworks-avatar-${entityPreset}-${exportSize}.png`, png)
      return true
    } catch (error) {
      console.error('Unable to export avatar PNG', error)
      return false
    }
  }

  const handleGifDownload = async () => {
    if (animationKeyframes.length < 2 || gifExportState === 'exporting') return false
    stopAnimationPlayback()
    setGifExportState('exporting')
    try {
      const gif = await createAvatarGif({
        ...avatarCaptureOptions,
        currentViewState: avatarViewState,
        keyframes: animationKeyframes,
        lockStartPosition: animationLockStartPosition,
        playbackMode: animationPlaybackMode,
        renderProps: {
          avatarOutlineStyle,
          avatarShadowStyle,
          backgroundStyle,
          bodyShape,
          bottomTaper: bodyBottomTaper,
          entityParts,
          entityPreset,
          gridDensity,
          lightDistance,
          lightDirection,
          palette: selectedPalette,
          shadowStyle: resolvedFaceShadowStyle,
          showAvatarShadow,
          showLight,
          showOutline,
          showShadow,
          surfaceDecals: resolvedSurfaceDecals
        },
        size: exportSize,
        startFrameIndex: animationStartFrameIndex
      })
      downloadBlob(
        `oneworks-avatar-${entityPreset}-${animationName.trim() || 'animation'}-${exportSize}.gif`,
        gif
      )
      setGifExportState('idle')
      return true
    } catch (error) {
      console.error('Unable to export avatar GIF', error)
      setGifExportState('error')
      return false
    }
  }

  const handleSavePreset = async () => {
    const sourceSvg = avatarFrameRef.current?.querySelector('svg')
    if (sourceSvg == null || savePresetState === 'saving') return
    setSavePresetState('saving')
    try {
      const screenshot = await captureAvatarScreenshot(sourceSvg, avatarCaptureOptions)
      const preset: SavedAvatarPreset = {
        createdAt: Date.now(),
        id: globalThis.crypto?.randomUUID?.() ?? `preset-${Date.now()}`,
        query: embedded
          ? `?${avatarDefinitionToSearchParams(currentDefinition).toString()}`
          : window.location.search,
        screenshot,
        version: 1
      }
      const nextPresets = prependSavedAvatarPreset(savedPresets, preset)
      persistSavedAvatarPresets(nextPresets)
      setSavedPresets(nextPresets)
      setSelectedSavedPresetId(preset.id)
      setSavePresetState('saved')
      window.setTimeout(() => setSavePresetState('idle'), 1400)
    } catch (error) {
      console.error('Unable to save avatar preset', error)
      setSavePresetState('error')
    }
  }

  const handleSavedPresetSelect = (preset: SavedAvatarPreset) => {
    stopAnimationPlayback()
    const presetParams = new URLSearchParams(preset.query)
    const config = resolveSeededQueryConfig(parseQueryConfig(presetParams, seed))
    setBackgroundStyle(config.backgroundStyle)
    setBodyShape(config.bodyShape)
    setBodyBottomTaper(config.bodyBottomTaper)
    setEntityParts(config.entityParts)
    setEntityPreset(config.entityPreset)
    setAnimalBreedTemplateId(config.animalBreedTemplateId)
    setAnimalEarHeight(config.animalEarHeight)
    setAnimalEarWidth(config.animalEarWidth)
    setAnimalHeadHeight(config.animalHeadHeight)
    setAnimalHeadWidth(config.animalHeadWidth)
    setAnimalHornSize(config.animalHornSize)
    setCatBreedTemplateId(config.catBreedTemplateId)
    setCatEarHeight(config.catEarHeight)
    setCatEarWidth(config.catEarWidth)
    setDogBreedTemplateId(config.dogBreedTemplateId)
    setDogEarHeight(config.dogEarHeight)
    setDogEarWidth(config.dogEarWidth)
    setDogHeadHeight(config.dogHeadHeight)
    setDogHeadWidth(config.dogHeadWidth)
    setRabbitBreedTemplateId(config.rabbitBreedTemplateId)
    setRabbitEarHeight(config.rabbitEarHeight)
    setRabbitEarWidth(config.rabbitEarWidth)
    setRabbitHeadHeight(config.rabbitHeadHeight)
    setRabbitHeadWidth(config.rabbitHeadWidth)
    setBearBreedTemplateId(config.bearBreedTemplateId)
    setBearEarHeight(config.bearEarHeight)
    setBearEarWidth(config.bearEarWidth)
    setBearHeadHeight(config.bearHeadHeight)
    setBearHeadWidth(config.bearHeadWidth)
    setCoatPattern(config.coatPattern)
    setSelectedEntityPartId(null)
    setSurfaceDecals(config.surfaceDecals)
    setSelectedSurfaceDecalId(null)
    setCameraBackground(config.cameraBackground)
    setCameraFrame(config.cameraFrame)
    setCameraMode(config.cameraMode)
    setExportSize(config.exportSize)
    setAvatarOutlineStyle(config.avatarOutlineStyle)
    setAvatarShadowStyle(config.avatarShadowStyle)
    setFaceShadowStyle(config.faceShadowStyle)
    setFaceStyle(config.faceStyle)
    setPixelEffect(config.pixelEffect)
    setAnimationPreviewFaceStyle(config.faceStyle)
    setFrameShadowStyle(config.frameShadowStyle)
    setGridDensity(config.gridDensity)
    setInteractionMode(config.interactionMode)
    setLightAzimuth(config.lightAzimuth)
    setLightDistance(config.lightDistance)
    setLightElevation(config.lightElevation)
    setSelectedPaletteId(config.selectedPaletteId)
    paletteManuallyFixedRef.current = !config.seededFields.includes(AVATAR_SEED_FIELD.palette) &&
      presetParams.has('palette')
    appliedPaletteSeedRef.current = config.seed
    setSeed(config.seed)
    setSeededFields(config.seededFields)
    setGenerationEnabled(true)
    setShowLight(config.showLight)
    setShowOutline(config.showOutline)
    setShowMorePalettes(
      AVATAR_PALETTES.findIndex(palette => palette.id === config.selectedPaletteId) >= DEFAULT_PALETTE_COUNT
    )
    setShowShadow(config.showShadow)
    setShowAvatarShadow(config.showAvatarShadow)
    setShowFrameShadow(config.showFrameShadow)
    setAvatarViewState(config.viewState)
    setAnimationPreviewViewState(config.viewState)
    setCopyState('idle')
    setSelectedSavedPresetId(preset.id)
  }

  const handleSavedPresetRemove = (presetId: string) => {
    setSavedPresets((currentPresets) => {
      const nextPresets = currentPresets.filter(preset => preset.id !== presetId)
      persistSavedAvatarPresets(nextPresets)
      return nextPresets
    })
    setSelectedSavedPresetId(currentId => currentId === presetId ? null : currentId)
  }

  const applyAnimationKeyframe = (keyframe: AvatarAnimationKeyframe) => {
    cancelSeededViewTransition()
    setAvatarViewState(currentState => ({
      pitch: keyframe.pitch,
      positionX: keyframe.positionX,
      positionY: keyframe.positionY,
      roll: currentState.roll,
      scale: currentState.scale,
      yaw: keyframe.yaw
    }))
    setFaceStyle(keyframe.faceStyle)
    setAvatarColorGrade(resolveAvatarColorGrade(keyframe.colorGrade))
  }

  const handleAddAnimationKeyframe = async () => {
    const sourceSvg = avatarFrameRef.current?.querySelector('svg')
    if (sourceSvg == null || keyframeCapturePending) return
    stopAnimationPlayback()
    setKeyframeCapturePending(true)
    const viewStateSnapshot = avatarViewState
    const faceStyleSnapshot = resolvedFaceStyle
    try {
      const screenshot = await captureAvatarScreenshot(sourceSvg, { pixelEffect })
      const keyframe = createAvatarAnimationKeyframe(
        viewStateSnapshot,
        faceStyleSnapshot,
        screenshot,
        avatarColorGrade
      )
      setAnimationKeyframes(currentKeyframes => {
        setActiveAnimationKeyframe(currentKeyframes.length)
        setSelectedAnimationKeyframe(currentKeyframes.length)
        return [...currentKeyframes, keyframe]
      })
      setAnimationDraftSource('custom')
    } catch (error) {
      console.error('Unable to capture animation keyframe', error)
    } finally {
      setKeyframeCapturePending(false)
    }
  }

  const handleAnimationKeyframeSelect = (index: number) => {
    const keyframe = animationKeyframes[index]
    if (keyframe == null) return
    stopAnimationPlayback()
    applyAnimationKeyframe(keyframe)
    setActiveAnimationKeyframe(index)
    setSelectedAnimationKeyframe(index)
  }

  const handleRemoveAnimationKeyframe = (index: number) => {
    stopAnimationPlayback()
    setAnimationKeyframes(currentKeyframes => currentKeyframes.filter((_, currentIndex) => currentIndex !== index))
    setAnimationStartFrameIndex(currentIndex => {
      const nextLength = Math.max(animationKeyframes.length - 1, 0)
      if (nextLength === 0) return 0
      if (currentIndex === index) return Math.min(index, nextLength - 1)
      return currentIndex > index ? currentIndex - 1 : Math.min(currentIndex, nextLength - 1)
    })
    setAnimationDraftSource(animationKeyframes.length <= 1 ? null : 'custom')
    setActiveAnimationKeyframe(currentIndex => {
      if (currentIndex == null || currentIndex === index) return null
      return currentIndex > index ? currentIndex - 1 : currentIndex
    })
    setSelectedAnimationKeyframe(currentIndex => {
      if (currentIndex == null || currentIndex === index) return null
      return currentIndex > index ? currentIndex - 1 : currentIndex
    })
  }

  const playAnimation = (
    keyframes: readonly AvatarAnimationKeyframe[],
    options: {
      readonly lockStartPosition?: boolean
      readonly mode: AvatarAnimationPlaybackMode
      readonly reuseTransformAnchor?: boolean
      readonly startFrameIndex?: number
    }
  ) => {
    if (keyframes.length < 2) return
    stopAnimationPlayback()
    const startFrameIndex = Math.min(
      Math.max(Math.round(options.startFrameIndex ?? 0), 0),
      keyframes.length - 1
    )
    const sourceIndices = keyframes.map((_, index) => index)
    const playbackSourceIndices = startFrameIndex === 0
      ? sourceIndices
      : [...sourceIndices.slice(startFrameIndex), ...sourceIndices.slice(0, startFrameIndex)]
    const playbackKeyframes = playbackSourceIndices.map(sourceIndex => keyframes[sourceIndex]!)
    const firstKeyframe = playbackKeyframes[0]
    if (firstKeyframe == null) return
    const transformAnchor = options.lockStartPosition
      ? { pitch: 0, positionX: 0, positionY: 0, yaw: 0 }
      : options.reuseTransformAnchor
      ? animationTransformAnchorRef.current ?? createAvatarAnimationTransformAnchor(avatarViewState, firstKeyframe)
      : createAvatarAnimationTransformAnchor(avatarViewState, firstKeyframe)
    animationTransformAnchorRef.current = transformAnchor
    const playbackScale = avatarViewState.scale
    const startedAt = performance.now()
    setAnimationPlaying(true)
    setAvatarColorGrade(resolveAvatarColorGrade(firstKeyframe.colorGrade))
    setActiveAnimationKeyframe(playbackSourceIndices[0] ?? 0)

    const tick = (now: number) => {
      const elapsed = Math.max(now - startedAt, 0)
      const segment = resolveAvatarAnimationTimedSegment(playbackKeyframes, elapsed, options.mode)
      const localProgress = easeAvatarAnimationProgress(segment.progress, segment.easing)
      const { fromIndex, toIndex } = segment
      const from = playbackKeyframes[fromIndex]
      const to = playbackKeyframes[toIndex]
      if (from == null || to == null) return
      const keyframe = applyAvatarAnimationTransformAnchor(
        interpolateAvatarAnimationKeyframes(from, to, localProgress),
        transformAnchor
      )
      setAvatarViewState(currentState => ({
        pitch: keyframe.pitch,
        positionX: keyframe.positionX,
        positionY: keyframe.positionY,
        roll: currentState.roll,
        scale: playbackScale,
        yaw: keyframe.yaw
      }))
      setFaceStyle(keyframe.faceStyle)
      setAvatarColorGrade(resolveAvatarColorGrade(keyframe.colorGrade))
      setActiveAnimationKeyframe(
        segment.finished
          ? playbackSourceIndices.at(-1) ?? keyframes.length - 1
          : playbackSourceIndices[fromIndex] ?? fromIndex
      )

      if (!segment.finished) {
        animationFrameRef.current = window.requestAnimationFrame(tick)
      } else {
        animationFrameRef.current = undefined
        setAnimationPlaying(false)
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(tick)
  }

  const handleSaveAnimation = () => {
    if (animationKeyframes.length < 2) return
    const currentAnimation = savedAnimations.find(animation => animation.id === editingSavedAnimationId)
    const animationId = currentAnimation?.id ?? globalThis.crypto?.randomUUID?.() ?? `animation-${Date.now()}`
    const animation: SavedAvatarAnimation = {
      createdAt: currentAnimation?.createdAt ?? Date.now(),
      id: animationId,
      keyframes: animationKeyframes.map(keyframe => ({
        ...keyframe,
        faceStyle: { ...keyframe.faceStyle }
      })),
      lockStartPosition: animationLockStartPosition,
      name: animationName.trim() || 'Untitled animation',
      playbackMode: animationPlaybackMode,
      startFrameIndex: Math.min(animationStartFrameIndex, animationKeyframes.length - 1),
      version: 3
    }
    const nextAnimations = currentAnimation == null
      ? prependSavedAvatarAnimation(savedAnimations, animation)
      : savedAnimations.map(savedAnimation => savedAnimation.id === animation.id ? animation : savedAnimation)
    persistSavedAvatarAnimations(nextAnimations)
    setSavedAnimations(nextAnimations)
    setEditingSavedAnimationId(animationId)
    setSelectedAnimationKey(`saved:${animationId}`)
    setAnimationDraftSource('saved')
  }

  const handleSavedAnimationSelect = (animation: SavedAvatarAnimation) => {
    stopAnimationPlayback()
    setAnimationOpen(true)
    setAnimationPlaybackMode(animation.playbackMode)
    setAnimationKeyframes(animation.keyframes)
    setAnimationName(animation.name)
    setAnimationStartFrameIndex(animation.startFrameIndex)
    setAnimationLockStartPosition(animation.lockStartPosition)
    setEditingSavedAnimationId(animation.id)
    setSelectedAnimationKey(`saved:${animation.id}`)
    setActiveAnimationKeyframe(animation.keyframes.length > 0 ? animation.startFrameIndex : null)
    setSelectedAnimationKeyframe(null)
    const firstKeyframe = animation.keyframes[animation.startFrameIndex]
    if (firstKeyframe != null && animation.lockStartPosition) applyAnimationKeyframe(firstKeyframe)
    setAnimationDraftSource('saved')
    requestAnimationThumbnailCapture(animation.keyframes)
    playAnimation(animation.keyframes, {
      lockStartPosition: animation.lockStartPosition,
      mode: animation.playbackMode,
      startFrameIndex: animation.startFrameIndex
    })
    return true
  }

  const handlePublicAnimationSelect = (animation: SavedAvatarAnimation) => {
    stopAnimationPlayback()
    setAnimationOpen(true)
    setAnimationPlaybackMode(animation.playbackMode)
    setAnimationKeyframes(animation.keyframes)
    setAnimationName(animation.name)
    setAnimationStartFrameIndex(animation.startFrameIndex)
    setAnimationLockStartPosition(animation.lockStartPosition)
    setEditingSavedAnimationId(null)
    setSelectedAnimationKey(animation.id as AvatarAnimationSelectionKey)
    setActiveAnimationKeyframe(animation.keyframes.length > 0 ? animation.startFrameIndex : null)
    setSelectedAnimationKeyframe(null)
    const firstKeyframe = animation.keyframes[animation.startFrameIndex]
    if (firstKeyframe != null && animation.lockStartPosition) applyAnimationKeyframe(firstKeyframe)
    setAnimationDraftSource('builtin')
    requestAnimationThumbnailCapture(animation.keyframes)
    playAnimation(animation.keyframes, {
      lockStartPosition: animation.lockStartPosition,
      mode: animation.playbackMode,
      startFrameIndex: animation.startFrameIndex
    })
    return true
  }

  const handleSavedAnimationRemove = (animation: SavedAvatarAnimation) => {
    const nextAnimations = savedAnimations.filter(savedAnimation => savedAnimation.id !== animation.id)
    persistSavedAvatarAnimations(nextAnimations)
    setSavedAnimations(nextAnimations)

    const libraryId = `saved:${animation.id}`
    if (editingSavedAnimationId !== animation.id && selectedAnimationKey !== libraryId) return
    stopAnimationPlayback()
    setEditingSavedAnimationId(null)
    setSelectedAnimationKey(null)
    setAnimationDraftSource(animationKeyframes.length > 0 ? 'custom' : null)
  }

  const handleAnimationLibraryDeselect = () => {
    stopAnimationPlayback()
    setEditingSavedAnimationId(null)
    setSelectedAnimationKey(null)
    setSelectedAnimationKeyframe(null)
    setActiveAnimationKeyframe(null)
    setAnimationKeyframes([])
    setAnimationName('Untitled animation')
    setAnimationStartFrameIndex(0)
    setAnimationLockStartPosition(false)
    setAnimationPlaybackMode('once')
    setAnimationDraftSource(null)
  }

  const handlePresetAnimationSelect = (preset: AvatarAnimationPreset) => {
    stopAnimationPlayback()
    const resolvedPreset = resolveAvatarAnimationPreset(
      preset,
      animationPreviewViewState,
      animationPreviewFaceStyle
    )
    setAnimationOpen(true)
    setAnimationPlaybackMode('loop')
    setAnimationKeyframes(resolvedPreset.keyframes)
    setAnimationName(preset.label)
    setAnimationStartFrameIndex(0)
    setAnimationLockStartPosition(false)
    setEditingSavedAnimationId(null)
    setSelectedAnimationKey(`preset:${preset.id}`)
    setActiveAnimationKeyframe(resolvedPreset.keyframes.length > 0 ? 0 : null)
    setSelectedAnimationKeyframe(null)
    setAnimationDraftSource('builtin')
    requestAnimationThumbnailCapture(resolvedPreset.keyframes)
    playAnimation(resolvedPreset.keyframes, {
      lockStartPosition: false,
      mode: 'loop'
    })
    return true
  }

  const restoredInitialAnimationSelectionRef = useRef(false)
  useEffect(() => {
    if (restoredInitialAnimationSelectionRef.current) return
    restoredInitialAnimationSelectionRef.current = true
    const selectionKey = initialConfig.animationSelectionKey
    if (selectionKey == null) return

    if (selectionKey === 'shared' && initialConfig.sharedAnimation != null) {
      handleSavedAnimationSelect(initialConfig.sharedAnimation)
      setEditingSavedAnimationId(null)
      setSelectedAnimationKey('shared')
      return
    }

    if (selectionKey.startsWith('preset:')) {
      const presetId = selectionKey.slice('preset:'.length)
      const preset = AVATAR_ANIMATION_PRESETS.find(candidate => candidate.id === presetId)
      if (preset != null) {
        handlePresetAnimationSelect(preset)
        return
      }
    }

    setSelectedAnimationKey(null)
  }, [initialConfig.animationSelectionKey, initialConfig.sharedAnimation, savedAnimations])

  const updateAnimationKeyframeTiming = (
    index: number,
    timing: Partial<Pick<AvatarAnimationKeyframe, 'durationMs' | 'easing'>>
  ) => {
    const nextKeyframes = animationKeyframes.map((keyframe, currentIndex) => {
      return currentIndex === index ? { ...keyframe, ...timing } : keyframe
    })
    if (nextKeyframes[index] == null) return
    setAnimationKeyframes(nextKeyframes)
    setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(nextKeyframes, {
        lockStartPosition: animationLockStartPosition,
        mode: animationPlaybackMode,
        reuseTransformAnchor: true,
        startFrameIndex: animationStartFrameIndex
      })
    }
  }

  const handleAnimationKeyframeDurationChange = (index: number, durationMs: number) => {
    updateAnimationKeyframeTiming(index, {
      durationMs: clampAvatarAnimationFrameDuration(durationMs)
    })
  }

  const handleAnimationKeyframeEasingChange = (index: number, easing: AvatarAnimationEasing) => {
    updateAnimationKeyframeTiming(index, { easing })
  }

  const handleAnimationPlaybackModeChange = (mode: AvatarAnimationPlaybackMode) => {
    setAnimationPlaybackMode(mode)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, {
        lockStartPosition: animationLockStartPosition,
        mode,
        reuseTransformAnchor: true,
        startFrameIndex: animationStartFrameIndex
      })
    }
  }

  const handleAnimationLockStartPositionChange = (lockStartPosition: boolean) => {
    setAnimationLockStartPosition(lockStartPosition)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, {
        lockStartPosition,
        mode: animationPlaybackMode,
        startFrameIndex: animationStartFrameIndex
      })
    }
  }

  const handleAnimationStartFrameChange = (startFrameIndex: number) => {
    setAnimationStartFrameIndex(startFrameIndex)
    setActiveAnimationKeyframe(startFrameIndex)
    setSelectedAnimationKeyframe(null)
    if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
    if (animationPlaying) {
      playAnimation(animationKeyframes, {
        lockStartPosition: animationLockStartPosition,
        mode: animationPlaybackMode,
        startFrameIndex
      })
    } else {
      const firstKeyframe = animationKeyframes[startFrameIndex]
      if (firstKeyframe != null) {
        const previewKeyframe = animationLockStartPosition
          ? firstKeyframe
          : applyAvatarAnimationTransformAnchor(
            firstKeyframe,
            createAvatarAnimationTransformAnchor(avatarViewState, firstKeyframe)
          )
        applyAnimationKeyframe(previewKeyframe)
      }
    }
  }

  const requestAnimationThumbnailCapture = (keyframes: readonly AvatarAnimationKeyframe[]) => {
    const captureId = animationThumbnailCaptureIdRef.current + 1
    animationThumbnailCaptureIdRef.current = captureId
    setAnimationThumbnailCapture({
      avatarOutlineStyle,
      backgroundStyle,
      bodyShape,
      bodyBottomTaper,
      entityParts,
      entityPreset,
      faceShadowStyle: resolvedFaceShadowStyle,
      gridDensity,
      id: captureId,
      keyframes,
      lightAzimuth,
      lightDistance,
      lightElevation,
      paletteId: selectedPaletteId,
      pixelEffect,
      scale: avatarViewState.scale,
      showLight,
      showOutline,
      showShadow,
      surfaceDecals: resolvedSurfaceDecals
    })
  }

  useEffect(() => {
    if (animationThumbnailCapture != null) return
    if (!animationKeyframes.some(keyframe => keyframe.thumbnailFrame != null)) return
    requestAnimationThumbnailCapture(animationKeyframes)
  }, [animationKeyframes, animationThumbnailCapture])

  const renderAnimationKeyframePreview = useCallback((keyframe: AvatarAnimationKeyframe) => {
    return (
      <InteractiveAvatar
        avatarOutlineStyle={avatarOutlineStyle}
        backgroundStyle={backgroundStyle}
        bodyShape={bodyShape}
        bottomTaper={bodyBottomTaper}
        colorGrade={keyframe.colorGrade}
        entityParts={entityParts}
        entityPreset={entityPreset}
        surfaceDecals={resolvedSurfaceDecals}
        faceStyleTransitionsEnabled={false}
        faceStyle={keyframe.faceStyle}
        gridDensity={25}
        interactive={false}
        interactionMode='rotate'
        lightDistance={lightDistance}
        lightDirection={lightDirection}
        onViewStateChange={ignoreAvatarViewStateChange}
        palette={selectedPalette}
        pixelEffect={pixelEffect}
        renderSurfaceCells={false}
        shadowStyle={resolvedFaceShadowStyle}
        showLight={showLight}
        showOutline={showOutline}
        showShadow={showShadow}
        viewState={{
          pitch: keyframe.pitch,
          positionX: 0,
          positionY: 0,
          roll: 0,
          scale: 1.15,
          yaw: keyframe.yaw
        }}
      />
    )
  }, [
    avatarOutlineStyle,
    backgroundStyle,
    bodyShape,
    bodyBottomTaper,
    entityParts,
    entityPreset,
    lightDirection,
    lightDistance,
    resolvedFaceShadowStyle,
    selectedPalette,
    pixelEffect,
    showLight,
    showOutline,
    showShadow
  ])

  const renderAnimationPresetPreview = useCallback((preset: AvatarAnimationPreset) => {
    const resolvedPreset = resolveAvatarAnimationPreset(
      preset,
      animationPreviewViewState,
      animationPreviewFaceStyle
    )
    const previewKeyframe = resolvedPreset.keyframes[Math.floor(resolvedPreset.keyframes.length / 2)]
    return previewKeyframe == null ? null : renderAnimationKeyframePreview(previewKeyframe)
  }, [animationPreviewFaceStyle, animationPreviewViewState, renderAnimationKeyframePreview])

  const renderSavePreset = () => (
    <button
      className='avatar-app__save-preset'
      type='button'
      aria-label={savePresetState === 'saved' ? 'Preset saved' : t('Save current preset')}
      title={savePresetState === 'error' ? 'Unable to save preset' : t('Save current preset')}
      data-state={savePresetState}
      disabled={savePresetState === 'saving'}
      onClick={() => {
        void handleSavePreset()
      }}
    >
      {savePresetState === 'saved'
        ? (
          <svg viewBox='0 0 20 20' aria-hidden='true'>
            <path d='m4 10.2 3.6 3.6L16 5.8' />
          </svg>
        )
        : (
          <svg viewBox='0 0 20 20' aria-hidden='true'>
            <path d='M4 3h9l3 3v11H4Z' />
            <path d='M7 3v5h6V3M7 17v-5h6v5' />
          </svg>
        )}
    </button>
  )

  const renderCameraToggle = () => (
    <button
      className='avatar-app__camera-toggle'
      type='button'
      aria-controls='avatar-camera-frame'
      aria-label={cameraMode ? 'Exit camera mode' : 'Enter camera mode'}
      aria-pressed={cameraMode}
      title={cameraMode ? 'Exit camera mode' : 'Enter camera mode'}
      onClick={() => setCameraMode(value => !value)}
    >
      <svg viewBox='0 0 20 20' aria-hidden='true'>
        <path d='M3.2 6.8h3l1.2-2h5.2l1.2 2h3a1.5 1.5 0 0 1 1.5 1.5v6.2a1.5 1.5 0 0 1-1.5 1.5H3.2a1.5 1.5 0 0 1-1.5-1.5V8.3a1.5 1.5 0 0 1 1.5-1.5Z' />
        <circle cx='10' cy='11.2' r='3' />
      </svg>
    </button>
  )

  const renderInteractionModeControls = (docked = false) => (
    <div
      className={`avatar-app__interaction-mode${docked ? ' avatar-app__interaction-mode--docked' : ''}`}
      role='group'
      aria-label='Mouse drag behavior'
    >
      <button
        className='avatar-app__interaction-mode-option'
        type='button'
        aria-pressed={interactionMode === 'rotate'}
        aria-label='Rotate with primary drag'
        title='Rotate'
        onClick={() => {
          stopAnimationPlayback()
          setInteractionMode('rotate')
        }}
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M15.6 6.2A6.4 6.4 0 1 0 16.2 13M15.6 6.2V2.8M15.6 6.2h-3.4' />
        </svg>
      </button>
      <button
        className='avatar-app__interaction-mode-option'
        type='button'
        aria-pressed={interactionMode === 'move'}
        aria-label='Move with primary drag'
        title='Move'
        onClick={() => {
          stopAnimationPlayback()
          setInteractionMode('move')
        }}
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M10 2.5v15M7.7 4.8 10 2.5l2.3 2.3M7.7 15.2 10 17.5l2.3-2.3M2.5 10h15M4.8 7.7 2.5 10l2.3 2.3M15.2 7.7l2.3 2.3-2.3 2.3' />
        </svg>
      </button>
    </div>
  )

  const renderGlobalHeaderActions = () => (
    <>
      <a
        className='avatar-app__github-link'
        href={AVATAR_GITHUB_URL}
        target='_blank'
        rel='noreferrer'
        aria-label={t('Open Avatar on GitHub')}
        title='GitHub'
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M10 1.9a8.1 8.1 0 0 0-2.6 15.8c.4.1.6-.2.6-.4v-1.6c-2.4.5-2.9-1-2.9-1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-1.9-.2-3.9-1-3.9-4a3.1 3.1 0 0 1 .8-2.2c-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 2 .1 2.2.5.6.8 1.4.8 2.2 0 3.1-2 3.8-3.9 4 .3.3.6.8.6 1.6v2.4c0 .3.2.5.6.4A8.1 8.1 0 0 0 10 1.9Z' />
        </svg>
      </a>
      <button
        className='avatar-app__theme-toggle'
        type='button'
        aria-label={resolvedTheme === 'dark' ? t('Switch to light theme') : t('Switch to dark theme')}
        title={resolvedTheme === 'dark' ? t('Light theme') : t('Dark theme')}
        onClick={() => {
          setThemeOverride(resolvedTheme === 'dark' ? 'light' : 'dark')
        }}
      >
        {resolvedTheme === 'dark'
          ? (
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <circle cx='10' cy='10' r='3.2' />
              <path d='M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4' />
            </svg>
          )
          : (
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <path d='M16.9 12.6A7 7 0 0 1 7.4 3.1a7 7 0 1 0 9.5 9.5Z' />
            </svg>
          )}
      </button>
      <LanguageSwitcher />
    </>
  )

  return (
    <main
      className={`avatar-app${embedded && resolvedTheme === 'dark' ? ' dark' : ''}`}
      data-embedded={embedded ? 'true' : 'false'}
    >
      <section
        className='avatar-app__workspace'
        data-animation-open={animationOpen}
        data-controls-collapsed={controlsCollapsed}
        style={{ '--avatar-controls-width': `${controlsWidth}px` } as CSSProperties}
      >
        <section
          ref={stageRef}
          className='avatar-app__stage'
          aria-label={t('Selected avatar')}
          data-camera-background={cameraBackground === 'transparent' ? 'transparent' : 'color'}
          data-camera-mode={cameraMode}
          data-camera-frame={cameraFrame}
          style={{
            '--avatar-camera-background': cameraBackground,
            '--avatar-frame-shadow': frameShadow
          } as CSSProperties}
        >
          {onHome != null || !stageNarrow || controlsCollapsed
            ? (
              <div className='avatar-app__camera-tools'>
                {onHome == null
                  ? null
                  : (
                    <button
                      className='avatar-app__home-link'
                      type='button'
                      aria-label='Home'
                      title='Home'
                      onClick={onHome}
                    >
                      <svg viewBox='0 0 20 20' aria-hidden='true'>
                        <path d='m3 9 7-6 7 6v8H5V9' />
                        <path d='M8 17v-5h4v5' />
                      </svg>
                    </button>
                  )}
                {!stageNarrow || controlsCollapsed ? renderCameraToggle() : null}
              </div>
            )
            : null}
          <div className='avatar-app__stage-actions'>
            {cameraMode
              ? (
                <ExportToolbar
                  copyState={copyState}
                  exportSize={exportSize}
                  gifAvailable={animationKeyframes.length >= 2}
                  gifExportState={gifExportState}
                  onCopy={() => {
                    void handleCopy()
                  }}
                  onDownload={handleDownload}
                  onDownloadGif={handleGifDownload}
                  onDownloadPng={handlePngDownload}
                  onSizeChange={setExportSize}
                />
              )
              : !stageNarrow || controlsCollapsed
              ? renderSavePreset()
              : null}
            {controlsCollapsed ? renderGlobalHeaderActions() : null}
            {controlsCollapsed
              ? (
                <button
                  className='avatar-app__controls-toggle'
                  type='button'
                  aria-controls='avatar-controls'
                  aria-expanded='false'
                  aria-label='Show controls sidebar'
                  title='Show controls'
                  onClick={() => setControlsCollapsed(false)}
                >
                  <svg viewBox='0 0 20 20' aria-hidden='true'>
                    <rect x='2.5' y='3' width='15' height='14' rx='1.5' />
                    <path d='M13 3v14M9.5 7.2 6.7 10l2.8 2.8' />
                  </svg>
                </button>
              )
              : null}
          </div>
          <div className='avatar-app__stage-preview'>
            <div
              id='avatar-camera-frame'
              ref={avatarFrameRef}
              className='avatar-app__preview-art avatar-app__preview-art--hero'
            >
              <InteractiveAvatar
                avatarOutlineStyle={avatarOutlineStyle}
                avatarShadowStyle={avatarShadowStyle}
                backgroundStyle={backgroundStyle}
                bodyShape={bodyShape}
                bottomTaper={bodyBottomTaper}
                colorGrade={avatarColorGrade}
                entityParts={entityParts}
                entityPreset={entityPreset}
                surfaceDecals={resolvedSurfaceDecals}
                faceStyleTransitionsEnabled={!animationPlaying}
                faceStyle={resolvedFaceStyle}
                gridDensity={gridDensity}
                interactionMode={interactionMode}
                lightDistance={lightDistance}
                lightDirection={lightDirection}
                onEntityPartSelect={setSelectedEntityPartId}
                onInteractionStart={cancelSeededViewTransition}
                onViewStateChange={handleAvatarViewStateChange}
                palette={selectedPalette}
                pixelEffect={pixelEffect}
                selectedEntityPartId={selectedEntityPartId}
                shadowStyle={resolvedFaceShadowStyle}
                showLight={showLight}
                showOutline={showOutline}
                showAvatarShadow={showAvatarShadow}
                showShadow={showShadow}
                viewState={seededViewTransitionState ?? avatarViewState}
              />
            </div>
          </div>
          {animationOpen
            ? null
            : (
              <button
                className='avatar-app__animation-toggle'
                type='button'
                aria-controls='avatar-animation-panel'
                aria-expanded='false'
                aria-label={t('Open animation editor')}
                title='Animation'
                onClick={() => setAnimationOpen(true)}
              >
                <svg viewBox='0 0 20 20' aria-hidden='true'>
                  <path d='M3 5.5h14v9H3Z' />
                  <path d='m8 7.5 5 2.5-5 2.5Z' />
                </svg>
              </button>
            )}
          {interactionControlsDocked ? null : renderInteractionModeControls()}
          <AvatarOrientationControl
            viewState={avatarViewState}
            onReset={() =>
              handleAvatarViewStateChange({
                ...avatarViewState,
                pitch: DEFAULT_AVATAR_VIEW_STATE.pitch,
                roll: DEFAULT_AVATAR_VIEW_STATE.roll,
                yaw: DEFAULT_AVATAR_VIEW_STATE.yaw
              })}
            onViewStateChange={handleAvatarViewStateChange}
          />
        </section>

        <AvatarControls
          activeTab={activeTab}
          avatarOutlineStyle={avatarOutlineStyle}
          avatarShadowStyle={avatarShadowStyle}
          backgroundStyle={backgroundStyle}
          bodyShape={bodyShape}
          bodyBottomTaper={bodyBottomTaper}
          cameraBackground={cameraBackground}
          cameraFrame={cameraFrame}
          animalBreedTemplateId={animalBreedTemplateId}
          animalEarHeight={resolvedAnimalEarHeight}
          animalEarWidth={resolvedAnimalEarWidth}
          animalHeadHeight={resolvedAnimalHeadHeight}
          animalHeadWidth={resolvedAnimalHeadWidth}
          animalHornSize={resolvedAnimalHornSize}
          catBreedTemplateId={isAvatarCatBreedTemplateId(catBreedTemplateId) ? catBreedTemplateId : null}
          catEarHeight={resolvedCatEarHeight}
          catEarWidth={resolvedCatEarWidth}
          dogBreedTemplateId={isAvatarDogBreedTemplateId(dogBreedTemplateId) ? dogBreedTemplateId : null}
          dogEarHeight={resolvedDogEarHeight}
          dogEarWidth={resolvedDogEarWidth}
          dogHeadHeight={resolvedDogHeadHeight}
          dogHeadWidth={resolvedDogHeadWidth}
          rabbitBreedTemplateId={isAvatarRabbitBreedTemplateId(rabbitBreedTemplateId) ? rabbitBreedTemplateId : null}
          rabbitEarHeight={resolvedRabbitEarHeight}
          rabbitEarWidth={resolvedRabbitEarWidth}
          rabbitHeadHeight={resolvedRabbitHeadHeight}
          rabbitHeadWidth={resolvedRabbitHeadWidth}
          bearBreedTemplateId={isAvatarBearBreedTemplateId(bearBreedTemplateId) ? bearBreedTemplateId : null}
          bearEarHeight={resolvedBearEarHeight}
          bearEarWidth={resolvedBearEarWidth}
          bearHeadHeight={resolvedBearHeadHeight}
          bearHeadWidth={resolvedBearHeadWidth}
          coatPattern={coatPattern}
          controlsWidth={controlsWidth}
          entityParts={entityParts}
          entityPreset={entityPreset}
          faceStyle={resolvedFaceStyle}
          faceShadowStyle={resolvedFaceShadowStyle}
          frameShadowStyle={frameShadowStyle}
          gridDensity={gridDensity}
          headerActions={
            <>
              {stageNarrow && !cameraMode ? renderSavePreset() : null}
              {stageNarrow ? renderCameraToggle() : null}
              {renderGlobalHeaderActions()}
            </>
          }
          hiddenPaletteCount={hiddenPaletteCount}
          lightAzimuth={lightAzimuth}
          lightDistance={lightDistance}
          lightElevation={lightElevation}
          pixelEffect={pixelEffect}
          onBackgroundStyleChange={(style) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.backgroundStyle)
            setBackgroundStyle(style)
            setCopyState('idle')
          }}
          onAvatarOutlineStyleChange={(nextStyle) => {
            setAvatarOutlineStyle(currentStyle => ({ ...currentStyle, ...nextStyle }))
            setCopyState('idle')
          }}
          onBodyBottomTaperChange={(value) => {
            setBodyBottomTaper(value)
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onBodyShapeChange={(shape) => {
            markSeedFieldsManual(
              AVATAR_SEED_FIELD.entityPreset,
              AVATAR_SEED_FIELD.catEarWidth,
              AVATAR_SEED_FIELD.catEarHeight,
              AVATAR_SEED_FIELD.dogEarWidth,
              AVATAR_SEED_FIELD.dogEarHeight,
              AVATAR_SEED_FIELD.dogHeadWidth,
              AVATAR_SEED_FIELD.dogHeadHeight,
              AVATAR_SEED_FIELD.rabbitEarWidth,
              AVATAR_SEED_FIELD.rabbitEarHeight,
              AVATAR_SEED_FIELD.rabbitHeadWidth,
              AVATAR_SEED_FIELD.rabbitHeadHeight,
              AVATAR_SEED_FIELD.bearEarWidth,
              AVATAR_SEED_FIELD.bearEarHeight,
              AVATAR_SEED_FIELD.bearHeadWidth,
              AVATAR_SEED_FIELD.bearHeadHeight,
              ...Object.values(AVATAR_ANIMAL_SPECIES_SEED_FIELDS).flatMap(fields => Object.values(fields)),
              AVATAR_SEED_FIELD.deerAntlerSize,
              AVATAR_SEED_FIELD.sheepHornSize,
              ...AVATAR_COAT_PATTERN_SEED_FIELDS
            )
            setBodyShape(shape)
            setBodyBottomTaper(0)
            setEntityParts([])
            setEntityPreset('custom')
            resetAnimalBreedState()
            setCatBreedTemplateId(null)
            setCatEarHeight(null)
            setCatEarWidth(null)
            setDogBreedTemplateId(null)
            setDogEarHeight(null)
            setDogEarWidth(null)
            setDogHeadHeight(null)
            setDogHeadWidth(null)
            setRabbitBreedTemplateId(null)
            setRabbitEarHeight(null)
            setRabbitEarWidth(null)
            setRabbitHeadHeight(null)
            setRabbitHeadWidth(null)
            setBearBreedTemplateId(null)
            setBearEarHeight(null)
            setBearEarWidth(null)
            setBearHeadHeight(null)
            setBearHeadWidth(null)
            setCoatPattern(current => ({ ...current, enabled: false }))
            setSelectedEntityPartId(null)
            setSurfaceDecals([])
            setSelectedSurfaceDecalId(null)
            setCopyState('idle')
          }}
          onAddSurfaceDecal={() => {
            markSeedFieldsManual(...AVATAR_COAT_PATTERN_SEED_FIELDS)
            const id = globalThis.crypto?.randomUUID?.() ?? `decal-${Date.now()}`
            const targetPartId = selectedEntityPartId ?? entityParts.find(part => part.face)?.id ?? null
            setSurfaceDecals(current => [...current, createAvatarSurfaceDecal(id, targetPartId)])
            setSelectedSurfaceDecalId(id)
          }}
          onAvatarShadowStyleChange={(nextStyle) => {
            setAvatarShadowStyle(currentStyle => ({ ...currentStyle, ...nextStyle }))
          }}
          onCameraBackgroundChange={(color) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.cameraBackground)
            setCameraBackground(color)
          }}
          onCameraFrameChange={(frame) => {
            setCameraFrame(frame)
          }}
          onCatBreedTemplateChange={handleCatBreedTemplateChange}
          onCatEarHeightChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.catEarHeight)
            setCatEarHeight(value)
            setEntityParts(currentParts => applyCatEarScale(currentParts, undefined, value))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onCatEarWidthChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.catEarWidth)
            setCatEarWidth(value)
            setEntityParts(currentParts => applyCatEarScale(currentParts, value, undefined))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onDogBreedTemplateChange={handleDogBreedTemplateChange}
          onDogEarHeightChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.dogEarHeight)
            setDogEarHeight(value)
            setEntityParts(currentParts => applyDogEarScale(currentParts, undefined, value))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onDogEarWidthChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.dogEarWidth)
            setDogEarWidth(value)
            setEntityParts(currentParts => applyDogEarScale(currentParts, value, undefined))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onDogHeadHeightChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.dogHeadHeight)
            setDogHeadHeight(value)
            setEntityParts(currentParts => applyDogHeadScale(currentParts, undefined, value))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onDogHeadWidthChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.dogHeadWidth)
            setDogHeadWidth(value)
            setEntityParts(currentParts => applyDogHeadScale(currentParts, value, undefined))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onRabbitBreedTemplateChange={handleRabbitBreedTemplateChange}
          onRabbitEarHeightChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.rabbitEarHeight)
            setRabbitEarHeight(value)
            setEntityParts(currentParts => applyRabbitEarScale(currentParts, undefined, value))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onRabbitEarWidthChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.rabbitEarWidth)
            setRabbitEarWidth(value)
            setEntityParts(currentParts => applyRabbitEarScale(currentParts, value, undefined))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onRabbitHeadHeightChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.rabbitHeadHeight)
            setRabbitHeadHeight(value)
            setEntityParts(currentParts => applyRabbitHeadScale(currentParts, undefined, value))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onRabbitHeadWidthChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.rabbitHeadWidth)
            setRabbitHeadWidth(value)
            setEntityParts(currentParts => applyRabbitHeadScale(currentParts, value, undefined))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onBearBreedTemplateChange={handleBearBreedTemplateChange}
          onBearEarHeightChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.bearEarHeight)
            setBearEarHeight(value)
            setEntityParts(parts => applyBearEarScale(parts, undefined, value))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onBearEarWidthChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.bearEarWidth)
            setBearEarWidth(value)
            setEntityParts(parts => applyBearEarScale(parts, value, undefined))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onBearHeadHeightChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.bearHeadHeight)
            setBearHeadHeight(value)
            setEntityParts(parts => applyBearHeadScale(parts, undefined, value))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onBearHeadWidthChange={(value) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.bearHeadWidth)
            setBearHeadWidth(value)
            setEntityParts(parts => applyBearHeadScale(parts, value, undefined))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onAnimalBreedTemplateChange={handleAnimalBreedTemplateChange}
          onAnimalEarHeightChange={(value) => {
            if (!isAvatarAnimalSpeciesId(entityPreset)) return
            markSeedFieldsManual(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[entityPreset].earHeight)
            setAnimalEarHeight(value)
            setEntityParts(parts => applyAvatarAnimalDimensions(parts, entityPreset, { earHeight: value }))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onAnimalEarWidthChange={(value) => {
            if (!isAvatarAnimalSpeciesId(entityPreset)) return
            markSeedFieldsManual(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[entityPreset].earWidth)
            setAnimalEarWidth(value)
            setEntityParts(parts => applyAvatarAnimalDimensions(parts, entityPreset, { earWidth: value }))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onAnimalHeadHeightChange={(value) => {
            if (!isAvatarAnimalSpeciesId(entityPreset)) return
            markSeedFieldsManual(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[entityPreset].headHeight)
            setAnimalHeadHeight(value)
            setEntityParts(parts => applyAvatarAnimalDimensions(parts, entityPreset, { headHeight: value }))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onAnimalHeadWidthChange={(value) => {
            if (!isAvatarAnimalSpeciesId(entityPreset)) return
            markSeedFieldsManual(AVATAR_ANIMAL_SPECIES_SEED_FIELDS[entityPreset].headWidth)
            setAnimalHeadWidth(value)
            setEntityParts(parts => applyAvatarAnimalDimensions(parts, entityPreset, { headWidth: value }))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onAnimalHornSizeChange={(value) => {
            if (entityPreset !== 'deer' && entityPreset !== 'sheep') return
            markSeedFieldsManual(
              entityPreset === 'deer' ? AVATAR_SEED_FIELD.deerAntlerSize : AVATAR_SEED_FIELD.sheepHornSize
            )
            setAnimalHornSize(value)
            setEntityParts(parts => applyAvatarAnimalDimensions(
              parts,
              entityPreset,
              { hornSize: value },
              getAvatarAnimalBreedTemplate(entityPreset, animalBreedTemplateId)?.fixed.hornStyle
            ))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onCoatPatternChange={(patch, manualField) => {
            if (manualField != null) markSeedFieldsManual(manualField)
            setCoatPattern(current => ({ ...current, ...patch, enabled: true }))
            setSelectedSavedPresetId(null)
            setCopyState('idle')
          }}
          onConvertCoatPatternToDecals={() => {
            setSurfaceDecals(current => {
              const usedIds = new Set(current.map(decal => decal.id))
              const materialized = generatedCoatDecals
                .filter(decal => !usedIds.has(decal.id))
                .map(decal => {
                  const baseId = `decal-${decal.id}`
                  let id = baseId
                  let suffix = 2
                  while (usedIds.has(id)) {
                    id = `${baseId}-${suffix}`
                    suffix += 1
                  }
                  usedIds.add(id)
                  return { ...decal, id }
                })
              return [...materialized, ...current]
            })
            setCoatPattern(current => ({ ...current, enabled: false }))
            markSeedFieldsManual(...AVATAR_COAT_PATTERN_SEED_FIELDS)
            setSelectedSurfaceDecalId(null)
            setCopyState('idle')
          }}
          onCollapse={() => setControlsCollapsed(true)}
          onControlsWidthChange={setControlsWidth}
          onFaceStyleChange={(nextStyle, mode = 'merge') => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.facePreset)
            stopAnimationPlayback()
            setActiveAnimationKeyframe(null)
            const nextFaceStyle = mode === 'replace'
              ? { ...DEFAULT_AVATAR_FACE_STYLE, ...nextStyle }
              : { ...DEFAULT_AVATAR_FACE_STYLE, ...resolvedFaceStyle, ...nextStyle }
            setFaceStyle(nextFaceStyle)
            setAnimationPreviewFaceStyle(nextFaceStyle)
          }}
          onFaceShadowStyleChange={(nextStyle) => {
            setFaceShadowStyle(currentStyle => ({
              ...DEFAULT_AVATAR_FACE_SHADOW_STYLE,
              ...currentStyle,
              ...nextStyle
            }))
          }}
          onFrameShadowStyleChange={(nextStyle) => {
            setFrameShadowStyle(currentStyle => ({ ...currentStyle, ...nextStyle }))
          }}
          onGridDensityChange={setGridDensity}
          onResetFace={() => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.facePreset)
            stopAnimationPlayback()
            setActiveAnimationKeyframe(null)
            setFaceStyle(DEFAULT_AVATAR_FACE_STYLE)
            setAnimationPreviewFaceStyle(DEFAULT_AVATAR_FACE_STYLE)
          }}
          onDeleteSurfaceDecal={(id) => {
            markSeedFieldsManual(...AVATAR_COAT_PATTERN_SEED_FIELDS)
            const deletingIndex = surfaceDecals.findIndex(decal => decal.id === id)
            const nextSurfaceDecals = surfaceDecals.filter(decal => decal.id !== id)
            const nextSelectedDecalId = nextSurfaceDecals[
              Math.min(Math.max(deletingIndex, 0), nextSurfaceDecals.length - 1)
            ]?.id ?? null
            setSurfaceDecals(nextSurfaceDecals)
            setSelectedSurfaceDecalId(current => current === id ? nextSelectedDecalId : current)
            setCopyState('idle')
          }}
          onSelectSurfaceDecal={setSelectedSurfaceDecalId}
          onSurfaceDecalChange={(id, patch) => {
            markSeedFieldsManual(...AVATAR_COAT_PATTERN_SEED_FIELDS)
            setSurfaceDecals(current => current.map(decal => decal.id === id ? { ...decal, ...patch } : decal))
          }}
          onSavedPresetSelect={handleSavedPresetSelect}
          onSavedPresetRemove={handleSavedPresetRemove}
          onLightAzimuthChange={setLightAzimuth}
          onLightDistanceChange={setLightDistance}
          onLightElevationChange={setLightElevation}
          onPaletteChange={(paletteId) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.palette)
            paletteManuallyFixedRef.current = true
            const nextPalette = getAvatarPalette(paletteId)
            stopAnimationPlayback()
            setActiveAnimationKeyframe(null)
            setSelectedPaletteId(paletteId)
            setEntityParts(currentParts => {
              const paletteParts = applyAvatarEntityPalette(currentParts, nextPalette)
              return entityPreset === 'bear'
                ? applyAvatarBearBreedForeground(paletteParts, getAvatarBearBreedTemplate(bearBreedTemplateId))
                : paletteParts
            })
            setCopyState('idle')
          }}
          onPixelEffectChange={(patch) => {
            setPixelEffect(current => ({ ...current, ...patch }))
            setCopyState('idle')
          }}
          onEntityPresetChange={(preset) => {
            setGenerationEnabled(true)
            setSeededFields(current => [
              ...getApplicableAvatarSeedFields(preset, false),
              ...current.filter(field => !AVATAR_SEED_FIELDS.includes(field as AvatarSeedField))
            ])
            handleEntityPresetChange(preset)
          }}
          onEntityPartChange={(id, nextPart) => {
            markSeedFieldsManual(AVATAR_SEED_FIELD.entityPreset)
            if (/cat-ear-(left|right)/u.test(id) && nextPart.scaleX != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.catEarWidth)
              setCatEarWidth(null)
            }
            if (/cat-ear-(left|right)/u.test(id) && nextPart.scaleY != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.catEarHeight)
              setCatEarHeight(null)
            }
            if (entityPreset === 'dog' && /ear-(left|right)/u.test(id) && nextPart.scaleX != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.dogEarWidth)
              setDogEarWidth(null)
            }
            if (entityPreset === 'dog' && /ear-(left|right)/u.test(id) && nextPart.scaleY != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.dogEarHeight)
              setDogEarHeight(null)
            }
            if (entityPreset === 'dog' && id === 'primary' && nextPart.scaleX != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.dogHeadWidth)
              setDogHeadWidth(null)
            }
            if (entityPreset === 'dog' && id === 'primary' && nextPart.scaleY != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.dogHeadHeight)
              setDogHeadHeight(null)
            }
            if (entityPreset === 'rabbit' && /ear-(left|right)/u.test(id) && nextPart.scaleX != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.rabbitEarWidth)
              setRabbitEarWidth(null)
            }
            if (entityPreset === 'rabbit' && /ear-(left|right)/u.test(id) && nextPart.scaleY != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.rabbitEarHeight)
              setRabbitEarHeight(null)
            }
            if (entityPreset === 'rabbit' && id === 'primary' && nextPart.scaleX != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.rabbitHeadWidth)
              setRabbitHeadWidth(null)
            }
            if (entityPreset === 'rabbit' && id === 'primary' && nextPart.scaleY != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.rabbitHeadHeight)
              setRabbitHeadHeight(null)
            }
            if (entityPreset === 'bear' && /ear-(left|right)/u.test(id) && nextPart.scaleX != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.bearEarWidth)
              setBearEarWidth(null)
            }
            if (entityPreset === 'bear' && /ear-(left|right)/u.test(id) && nextPart.scaleY != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.bearEarHeight)
              setBearEarHeight(null)
            }
            if (entityPreset === 'bear' && id === 'primary' && nextPart.scaleX != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.bearHeadWidth)
              setBearHeadWidth(null)
            }
            if (entityPreset === 'bear' && id === 'primary' && nextPart.scaleY != null) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.bearHeadHeight)
              setBearHeadHeight(null)
            }
            if (isAvatarAnimalSpeciesId(entityPreset)) {
              const fields = AVATAR_ANIMAL_SPECIES_SEED_FIELDS[entityPreset]
              if (/ear-(left|right)/u.test(id) && nextPart.scaleX != null) {
                markSeedFieldsManual(fields.earWidth)
                setAnimalEarWidth(null)
              }
              if (/ear-(left|right)/u.test(id) && nextPart.scaleY != null) {
                markSeedFieldsManual(fields.earHeight)
                setAnimalEarHeight(null)
              }
              if (id === 'primary' && nextPart.scaleX != null) {
                markSeedFieldsManual(fields.headWidth)
                setAnimalHeadWidth(null)
              }
              if (id === 'primary' && nextPart.scaleY != null) {
                markSeedFieldsManual(fields.headHeight)
                setAnimalHeadHeight(null)
              }
              if (/^(antler|horn)-(left|right)/u.test(id) && (
                nextPart.scaleX != null || nextPart.scaleY != null
              )) {
                markSeedFieldsManual(
                  entityPreset === 'deer' ? AVATAR_SEED_FIELD.deerAntlerSize : AVATAR_SEED_FIELD.sheepHornSize
                )
                setAnimalHornSize(null)
              }
            }
            if (
              nextPart.baseColor != null || nextPart.highlightColor != null ||
              nextPart.shadowColor != null || nextPart.foregroundColor != null
            ) {
              markSeedFieldsManual(AVATAR_SEED_FIELD.palette)
              paletteManuallyFixedRef.current = true
            }
            setEntityParts(currentParts => {
              let nextParts = currentParts
              if (
                entityPreset === 'dog' && id === 'primary' &&
                (nextPart.scaleX != null || nextPart.scaleY != null)
              ) {
                const neutralHead = createAvatarEntityParts('dog').find(part => part.face)
                if (neutralHead != null) {
                  nextParts = applyDogHeadScale(
                    currentParts,
                    nextPart.scaleX == null ? undefined : nextPart.scaleX / neutralHead.scaleX * 100,
                    nextPart.scaleY == null ? undefined : nextPart.scaleY / neutralHead.scaleY * 100
                  )
                }
              }
              if (
                entityPreset === 'rabbit' && id === 'primary' &&
                (nextPart.scaleX != null || nextPart.scaleY != null)
              ) {
                const neutralHead = createAvatarEntityParts('rabbit').find(part => part.face)
                if (neutralHead != null) {
                  nextParts = applyRabbitHeadScale(
                    currentParts,
                    nextPart.scaleX == null ? undefined : nextPart.scaleX / neutralHead.scaleX * 100,
                    nextPart.scaleY == null ? undefined : nextPart.scaleY / neutralHead.scaleY * 100
                  )
                }
              }
              if (
                entityPreset === 'bear' && id === 'primary' &&
                (nextPart.scaleX != null || nextPart.scaleY != null)
              ) {
                const neutralHead = createAvatarEntityParts('bear').find(part => part.face)
                if (neutralHead != null) {
                  nextParts = applyBearHeadScale(
                    currentParts,
                    nextPart.scaleX == null ? undefined : nextPart.scaleX / neutralHead.scaleX * 100,
                    nextPart.scaleY == null ? undefined : nextPart.scaleY / neutralHead.scaleY * 100
                  )
                }
              }
              if (
                isAvatarAnimalSpeciesId(entityPreset) && id === 'primary' &&
                (nextPart.scaleX != null || nextPart.scaleY != null)
              ) {
                const neutralHead = createAvatarEntityParts(entityPreset).find(part => part.face)
                if (neutralHead != null) {
                  nextParts = applyAvatarAnimalDimensions(currentParts, entityPreset, {
                    headHeight: nextPart.scaleY == null ? undefined : nextPart.scaleY / neutralHead.scaleY * 100,
                    headWidth: nextPart.scaleX == null ? undefined : nextPart.scaleX / neutralHead.scaleX * 100
                  })
                }
              }
              return nextParts.map(part => part.id === id ? { ...part, ...nextPart } : part)
            })
            setCopyState('idle')
          }}
          onShowMorePalettesChange={() => setShowMorePalettes(value => !value)}
          onTabChange={setActiveTab}
          onToggleLight={() => setShowLight(value => !value)}
          onToggleOutline={() => {
            setShowOutline(value => !value)
            setCopyState('idle')
          }}
          onToggleAvatarShadow={() => setShowAvatarShadow(value => !value)}
          onToggleFrameShadow={() => setShowFrameShadow(value => !value)}
          onToggleShadow={() => {
            setShowShadow(value => !value)
            setCopyState('idle')
          }}
          onToggleCoatPattern={() => {
            if (!coatPattern.enabled) {
              ensureNaturalCoatPalette(
                normalizeEditorAvatarSeed(seed),
                seededFields.includes(AVATAR_SEED_FIELD.palette)
              )
            }
            setCoatPattern(current => ({ ...current, enabled: !current.enabled }))
            if (coatPattern.enabled) markSeedFieldsManual(...AVATAR_COAT_PATTERN_SEED_FIELDS)
            setSelectedSurfaceDecalId(null)
            setCopyState('idle')
          }}
          selectedPalette={selectedPalette}
          selectedEntityPartId={selectedEntityPartId}
          selectedSavedPresetId={selectedSavedPresetId}
          selectedSurfaceDecalId={selectedSurfaceDecalId}
          savedPresets={savedPresets}
          seed={seed}
          seededFields={seededFields}
          onRandomSeed={handleRandomSeed}
          onSeedChange={handleSeedChange}
          onSeedFieldToggle={handleSeedFieldToggle}
          showLight={showLight}
          showOutline={showOutline}
          showAvatarShadow={showAvatarShadow}
          showFrameShadow={showFrameShadow}
          showMorePalettes={showMorePalettes}
          showShadow={showShadow}
          surfaceDecals={surfaceDecals}
          visiblePalettes={visiblePalettes}
        />
        {animationOpen
          ? (
            <AnimationPanel
              activeKeyframeIndex={activeAnimationKeyframe}
              animationName={animationName}
              animationPresets={AVATAR_ANIMATION_PRESETS}
              startFrameIndex={animationStartFrameIndex}
              isCapturingKeyframe={keyframeCapturePending || animationThumbnailCapture != null}
              isPlaying={animationPlaying}
              interactionControls={interactionControlsDocked ? renderInteractionModeControls(true) : null}
              keyframes={animationKeyframes}
              lockStartPosition={animationLockStartPosition}
              onAddKeyframe={() => {
                void handleAddAnimationKeyframe()
              }}
              onAnimationNameChange={(name) => {
                setAnimationName(name)
                if (animationKeyframes.length > 0) setAnimationDraftSource('custom')
              }}
              onStartFrameChange={handleAnimationStartFrameChange}
              onKeyframeDeselect={() => {
                setSelectedAnimationKeyframe(null)
                if (!animationPlaying) setActiveAnimationKeyframe(null)
              }}
              onKeyframeDurationChange={handleAnimationKeyframeDurationChange}
              onKeyframeEasingChange={handleAnimationKeyframeEasingChange}
              onKeyframeSelect={handleAnimationKeyframeSelect}
              onKeyframeRemove={handleRemoveAnimationKeyframe}
              onLibraryDeselect={handleAnimationLibraryDeselect}
              onLockStartPositionChange={handleAnimationLockStartPositionChange}
              onInteractionControlsDockChange={setInteractionControlsDocked}
              onClose={() => setAnimationOpen(false)}
              onPlay={() => {
                playAnimation(animationKeyframes, {
                  lockStartPosition: animationLockStartPosition,
                  mode: animationPlaybackMode,
                  startFrameIndex: animationStartFrameIndex
                })
              }}
              onPlaybackModeChange={handleAnimationPlaybackModeChange}
              onPresetSelect={handlePresetAnimationSelect}
              onPublicAnimationSelect={handlePublicAnimationSelect}
              onSavedAnimationRemove={handleSavedAnimationRemove}
              onSavedAnimationSelect={handleSavedAnimationSelect}
              onSave={handleSaveAnimation}
              onStop={stopAnimationPlayback}
              playbackMode={animationPlaybackMode}
              publicAnimations={publicAnimations}
              renderKeyframePreview={renderAnimationKeyframePreview}
              renderPresetPreview={renderAnimationPresetPreview}
              requiresReplacementConfirmation={shouldConfirmAnimationReplacement(
                animationDraftSource,
                animationKeyframes.length
              )}
              savedAnimations={savedAnimations}
              selectedLibraryId={selectedAnimationKey}
              selectedKeyframeIndex={selectedAnimationKeyframe}
            />
          )
          : null}
      </section>
      {animationThumbnailCapture == null
        ? null
        : (
          <div
            ref={animationThumbnailCaptureRef}
            className='avatar-app__preset-capture'
            aria-hidden='true'
          >
            {animationThumbnailCapture.keyframes.map((keyframe, index) => (
              <div
                key={`${animationThumbnailCapture.id}-${index}`}
                className='avatar-app__preset-capture-frame'
              >
                <InteractiveAvatar
                  avatarOutlineStyle={animationThumbnailCapture.avatarOutlineStyle}
                  backgroundStyle={animationThumbnailCapture.backgroundStyle}
                  bodyShape={animationThumbnailCapture.bodyShape}
                  bottomTaper={animationThumbnailCapture.bodyBottomTaper}
                  colorGrade={keyframe.colorGrade}
                  entityParts={animationThumbnailCapture.entityParts}
                  entityPreset={animationThumbnailCapture.entityPreset}
                  surfaceDecals={animationThumbnailCapture.surfaceDecals}
                  faceStyleTransitionsEnabled={false}
                  faceStyle={keyframe.faceStyle}
                  gridDensity={25}
                  interactive={false}
                  interactionMode='rotate'
                  lightDistance={animationThumbnailCapture.lightDistance}
                  lightDirection={{
                    azimuth: animationThumbnailCapture.lightAzimuth,
                    elevation: animationThumbnailCapture.lightElevation
                  }}
                  onViewStateChange={ignoreAvatarViewStateChange}
                  palette={resolveAvatarBreedPaletteFromEntityParts(
                    getAvatarPalette(animationThumbnailCapture.paletteId),
                    animationThumbnailCapture.entityParts
                  )}
                  renderSurfaceCells={false}
                  shadowStyle={animationThumbnailCapture.faceShadowStyle}
                  showLight={animationThumbnailCapture.showLight}
                  showOutline={animationThumbnailCapture.showOutline}
                  showShadow={animationThumbnailCapture.showShadow}
                  viewState={{
                    pitch: keyframe.pitch,
                    positionX: keyframe.positionX,
                    positionY: keyframe.positionY,
                    roll: 0,
                    scale: animationThumbnailCapture.scale,
                    yaw: keyframe.yaw
                  }}
                />
              </div>
            ))}
          </div>
        )}
    </main>
  )
}

export default App
