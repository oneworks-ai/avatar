import type { AvatarAnimationTimeline } from '@oneworks/avatar'

export const AVATAR_PROJECTS_STORAGE_KEY = 'oneworks-avatar-projects-v1'
export const ACTIVE_AVATAR_PROJECT_STORAGE_KEY = 'oneworks-avatar-active-project-v1'

export interface SavedAvatarProject {
  readonly activeTab: 'animation' | 'body' | 'build' | 'decals' | 'effects' | 'style'
  readonly animationAutoReplay: boolean
  readonly animationPlaybackSpeed: number
  readonly createdAt: number
  readonly id: string
  readonly name: string
  readonly query: string
  readonly timeline: AvatarAnimationTimeline
  readonly updatedAt: number
}

const isSavedAvatarProject = (value: unknown): value is SavedAvatarProject => {
  if (value == null || typeof value !== 'object') return false
  const project = value as Partial<SavedAvatarProject>
  return typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    typeof project.query === 'string' &&
    typeof project.createdAt === 'number' &&
    typeof project.updatedAt === 'number' &&
    typeof project.animationAutoReplay === 'boolean' &&
    typeof project.animationPlaybackSpeed === 'number' &&
    typeof project.activeTab === 'string' &&
    project.timeline != null && typeof project.timeline === 'object'
}

export const loadSavedAvatarProjects = (): readonly SavedAvatarProject[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(AVATAR_PROJECTS_STORAGE_KEY)
    if (stored == null) return []
    const parsed = JSON.parse(stored) as unknown
    return Array.isArray(parsed)
      ? parsed.filter(isSavedAvatarProject).sort((a, b) => b.updatedAt - a.updatedAt)
      : []
  } catch {
    return []
  }
}

export const persistSavedAvatarProjects = (projects: readonly SavedAvatarProject[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AVATAR_PROJECTS_STORAGE_KEY, JSON.stringify(projects.slice(0, 24)))
}

export const readActiveAvatarProjectId = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACTIVE_AVATAR_PROJECT_STORAGE_KEY)
}

export const persistActiveAvatarProjectId = (projectId: string | null) => {
  if (typeof window === 'undefined') return
  if (projectId == null) window.localStorage.removeItem(ACTIVE_AVATAR_PROJECT_STORAGE_KEY)
  else window.localStorage.setItem(ACTIVE_AVATAR_PROJECT_STORAGE_KEY, projectId)
}

export const upsertSavedAvatarProject = (
  projects: readonly SavedAvatarProject[],
  project: SavedAvatarProject
) => [project, ...projects.filter(candidate => candidate.id !== project.id)]
