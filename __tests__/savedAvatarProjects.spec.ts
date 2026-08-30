// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'

import {
  ACTIVE_AVATAR_PROJECT_STORAGE_KEY,
  AVATAR_PROJECTS_STORAGE_KEY,
  loadSavedAvatarProjects,
  persistActiveAvatarProjectId,
  persistSavedAvatarProjects,
  readActiveAvatarProjectId,
  upsertSavedAvatarProject
} from '../src/savedAvatarProjects'
import type { SavedAvatarProject } from '../src/savedAvatarProjects'

const createProject = (id: string, updatedAt: number): SavedAvatarProject => ({
  activeTab: 'build',
  animationAutoReplay: false,
  animationPlaybackSpeed: 1,
  createdAt: updatedAt,
  id,
  name: `Project ${id}`,
  query: '?shape=sphere',
  timeline: { durationMs: 3200, tracks: [], version: 1 },
  updatedAt
})

describe('saved avatar projects', () => {
  beforeEach(() => window.localStorage.clear())

  it('persists projects in most-recent order', () => {
    persistSavedAvatarProjects([createProject('older', 1), createProject('newer', 2)])
    expect(loadSavedAvatarProjects().map(project => project.id)).toEqual(['newer', 'older'])
    expect(window.localStorage.getItem(AVATAR_PROJECTS_STORAGE_KEY)).not.toBeNull()
  })

  it('replaces a project without duplicating it', () => {
    const next = upsertSavedAvatarProject(
      [createProject('same', 1), createProject('other', 2)],
      { ...createProject('same', 3), name: 'Renamed' }
    )
    expect(next.map(project => project.id)).toEqual(['same', 'other'])
    expect(next[0]?.name).toBe('Renamed')
  })

  it('tracks and clears the active project', () => {
    persistActiveAvatarProjectId('project-1')
    expect(readActiveAvatarProjectId()).toBe('project-1')
    expect(window.localStorage.getItem(ACTIVE_AVATAR_PROJECT_STORAGE_KEY)).toBe('project-1')
    persistActiveAvatarProjectId(null)
    expect(readActiveAvatarProjectId()).toBeNull()
  })
})
