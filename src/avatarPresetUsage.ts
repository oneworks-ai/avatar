const AVATAR_PRESET_USAGE_STORAGE_KEY = 'oneworks-avatar-preset-usage-v1'

export type AvatarPresetUsage = Readonly<Record<string, number>>

export const loadAvatarPresetUsage = (): AvatarPresetUsage => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = JSON.parse(window.localStorage.getItem(AVATAR_PRESET_USAGE_STORAGE_KEY) ?? '{}') as unknown
    if (stored == null || typeof stored !== 'object' || Array.isArray(stored)) return {}
    return Object.fromEntries(Object.entries(stored).filter((entry): entry is [string, number] => (
      typeof entry[1] === 'number' && Number.isFinite(entry[1])
    )))
  } catch {
    return {}
  }
}

export const persistAvatarPresetUsage = (usage: AvatarPresetUsage) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(AVATAR_PRESET_USAGE_STORAGE_KEY, JSON.stringify(usage))
  } catch {
    // Usage history is a progressive enhancement; unavailable storage must not block selection.
  }
}

export const touchAvatarPresetUsage = (
  usage: AvatarPresetUsage,
  key: string,
  usedAt = Date.now()
): AvatarPresetUsage => ({ ...usage, [key]: usedAt })

export const sortAvatarPresetItems = <T>(
  items: readonly T[],
  getKey: (item: T) => string,
  usage: AvatarPresetUsage,
  getCreatedAt: (item: T) => number = () => 0
) => items
  .map((item, index) => ({ index, item }))
  .sort((left, right) => {
    const leftScore = usage[getKey(left.item)] ?? getCreatedAt(left.item)
    const rightScore = usage[getKey(right.item)] ?? getCreatedAt(right.item)
    return rightScore - leftScore || left.index - right.index
  })
  .map(({ item }) => item)
