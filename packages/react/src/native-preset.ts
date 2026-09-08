import { getAvatarPalette } from '@oneworks/avatar'
import type { AvatarDefinition } from '@oneworks/avatar'
import {
  applyAvatarEntityPalette, createAvatarEntityParts, getAvatarEntityPresetScene
} from '../../../src/avatarEntityPresets'
import {
  AVATAR_CAT_BREED_TEMPLATES, AVATAR_DOG_BREED_TEMPLATES,
  AVATAR_RABBIT_BREED_TEMPLATES, AVATAR_BEAR_BREED_TEMPLATES,
  resolveAvatarCatBreedTemplate, resolveAvatarDogBreedTemplate,
  resolveAvatarRabbitBreedTemplate, resolveAvatarBearBreedTemplate
} from '../../../src/avatarBreedTemplates'
import { AVATAR_ANIMAL_BREED_TEMPLATES, resolveAvatarAnimalBreedTemplate } from '../../../src/avatarSpeciesBreeds'

/** Materialize the same native anatomy and markings used by the editor. Explicit
 * parts remain concrete authoring truth; no breed or material is inferred for them. */
function materializeNativeAvatarPreset(definition: AvatarDefinition) {
  const { scene } = definition
  if (scene.entity.parts.length > 0) return { parts: scene.entity.parts, decals: [] }
  const preset = scene.entity.preset
  const paletteId = scene.appearance.paletteId
  const seed = definition.metadata?.generation?.seed ?? scene.appearance.coatPattern?.seed ?? `native-${preset}-${paletteId}`
  const pattern = scene.appearance.coatPattern
  const cat = preset === 'cat' && AVATAR_CAT_BREED_TEMPLATES.find(item => item.fixed.paletteId === paletteId)
  const dog = preset === 'dog' && AVATAR_DOG_BREED_TEMPLATES.find(item => item.fixed.paletteId === paletteId)
  const rabbit = preset === 'rabbit' && AVATAR_RABBIT_BREED_TEMPLATES.find(item => item.fixed.paletteId === paletteId)
  const bear = preset === 'bear' && AVATAR_BEAR_BREED_TEMPLATES.find(item => item.fixed.paletteId === paletteId)
  const animal = AVATAR_ANIMAL_BREED_TEMPLATES.find(item => item.species === preset && item.fixed.paletteId === paletteId)
  const breed = cat ? resolveAvatarCatBreedTemplate(cat, seed, pattern)
    : dog ? resolveAvatarDogBreedTemplate(dog, seed, pattern)
    : rabbit ? resolveAvatarRabbitBreedTemplate(rabbit, seed, pattern)
    : bear ? resolveAvatarBearBreedTemplate(bear, seed, pattern)
    : animal ? resolveAvatarAnimalBreedTemplate(animal, seed, pattern) : undefined
  const nativeScene = getAvatarEntityPresetScene(preset)
  if (breed) return {
    parts: breed.entityParts,
    decals: 'surfaceDecals' in breed ? breed.surfaceDecals ?? nativeScene?.surfaceDecals ?? [] : nativeScene?.surfaceDecals ?? []
  }
  const original = createAvatarEntityParts(preset)
  const palette = getAvatarPalette(paletteId)
  const colored = applyAvatarEntityPalette(original, palette)
  const head = original.find(part => part.face)
  return {
    parts: colored.map((part, index) => {
      const authored = original[index]!
      // Unmapped exposed anatomy keeps its native material instead of becoming
      // indistinguishable from fur when the embedding disables surface lighting.
      return head && authored.baseColor !== head.baseColor && !palette.entityMaterials?.[part.id]
        ? { ...part, baseColor: authored.baseColor, foregroundColor: authored.foregroundColor,
          highlightColor: authored.highlightColor, shadowColor: authored.shadowColor }
        : part
    }),
    decals: nativeScene?.surfaceDecals ?? []
  }
}

const nativePresetCache = new Map<string, ReturnType<typeof materializeNativeAvatarPreset>>()
/** Animation frames often clone definitions. Their view/face changes do not
 * change native anatomy, so retain stable renderer inputs across those frames. */
export function resolveNativeAvatarPreset(definition: AvatarDefinition) {
  if (definition.scene.entity.parts.length > 0) return materializeNativeAvatarPreset(definition)
  const key = JSON.stringify([definition.scene.entity.preset, definition.scene.appearance.paletteId,
    definition.metadata?.generation?.seed, definition.scene.appearance.coatPattern])
  const existing = nativePresetCache.get(key)
  if (existing) {
    nativePresetCache.delete(key)
    nativePresetCache.set(key, existing)
    return existing
  }
  const resolved = materializeNativeAvatarPreset(definition)
  nativePresetCache.set(key, resolved)
  if (nativePresetCache.size > 128) nativePresetCache.delete(nativePresetCache.keys().next().value!)
  return resolved
}
