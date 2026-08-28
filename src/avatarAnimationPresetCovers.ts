import manifest from './avatarAnimationPresetCovers/manifest.json'

const AVATAR_ANIMATION_PRESET_COVER_MODULES = import.meta.glob(
  './avatarAnimationPresetCovers/*.svg',
  { eager: true, import: 'default', query: '?url' }
) as Readonly<Record<string, string>>

const coverUrls = Object.fromEntries(Object.entries(AVATAR_ANIMATION_PRESET_COVER_MODULES).map(([source, url]) => [
  source.slice(source.lastIndexOf('/') + 1),
  url
])) as Readonly<Record<string, string>>

const warnedMissingCovers = new Set<string>()

export const AVATAR_ANIMATION_PRESET_COVER_MANIFEST = manifest

export const getAvatarAnimationPresetCoverUrl = (presetId: string): string | null => {
  const entry = manifest.entries.find(candidate => candidate.presetId === presetId)
  const url = entry == null ? null : coverUrls[entry.asset] ?? null
  if (url == null && import.meta.env.DEV && !warnedMissingCovers.has(presetId)) {
    warnedMissingCovers.add(presetId)
    console.warn(`Missing static animation preset cover for "${presetId}". Run pnpm animation-covers:generate.`)
  }
  return url
}

export const getAvatarAnimationPresetTimelineFrameUrl = (
  presetId: string,
  progress: number
): string | null => {
  const entry = manifest.entries.find(candidate => candidate.presetId === presetId)
  const frame = entry?.frames.reduce<(typeof entry.frames)[number] | null>((nearest, candidate) => (
    nearest == null || Math.abs(candidate.progress - progress) < Math.abs(nearest.progress - progress)
      ? candidate
      : nearest
  ), null)
  const url = frame == null ? null : coverUrls[frame.asset] ?? null
  if (url == null && import.meta.env.DEV && !warnedMissingCovers.has(`${presetId}:timeline`)) {
    warnedMissingCovers.add(`${presetId}:timeline`)
    console.warn(`Missing static animation preset timeline frame for "${presetId}". Run pnpm animation-covers:generate.`)
  }
  return url
}
