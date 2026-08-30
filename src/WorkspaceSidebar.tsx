import './WorkspaceSidebar.scss'

import type { SavedAvatarProject } from './savedAvatarProjects'
import { useAvatarLocale } from './avatarLocale'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

type ProjectSaveState = 'error' | 'idle' | 'saved' | 'saving'

interface WorkspaceSidebarProps {
  readonly activeProjectId: string | null
  readonly anchorRef: RefObject<HTMLElement | null>
  readonly onClose: () => void
  readonly onDeleteProject: (projectId: string) => void
  readonly onHome?: () => void
  readonly onLoadProject: (projectId: string) => void
  readonly onProjectNameChange: (name: string) => void
  readonly onSaveAsProject: () => void
  readonly onSaveProject: () => void
  readonly projectName: string
  readonly projects: readonly SavedAvatarProject[]
  readonly saveState: ProjectSaveState
}

const WorkspaceIcon = ({ name }: { readonly name: 'chevron' | 'delete' | 'home' | 'recent' | 'rename' | 'save' | 'saveAs' }) => (
  <svg viewBox='0 0 20 20' aria-hidden='true'>
    {name === 'save' ? <><path d='M4 3h10l2 2v12H4Z' /><path d='M7 3v5h6V3M7 17v-5h6v5' /></> : null}
    {name === 'saveAs' ? <><path d='M4 3h9l2 2v6M7 3v5h5V3M4 8v9h6' /><path d='M13 12v5m-2.5-2.5h5' /></> : null}
    {name === 'rename' ? <><path d='m4 14-.5 3 3-.5L15 8l-2.5-2.5Z' /><path d='m11.5 6.5 2 2M9 17h7' /></> : null}
    {name === 'recent' ? <><circle cx='10' cy='10' r='7' /><path d='M10 6v4l3 2M3 5v4h4' /></> : null}
    {name === 'chevron' ? <path d='m7 5 5 5-5 5' /> : null}
    {name === 'delete' ? <><path d='M5 6h10M8 6V4h4v2M7 8v7m3-7v7m3-7v7M6 6l1 11h6l1-11' /></> : null}
    {name === 'home' ? <><path d='m3 9 7-6 7 6v8H3Z' /><path d='M8 17v-5h4v5' /></> : null}
  </svg>
)

const formatProjectDate = (timestamp: number) => new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short'
}).format(timestamp)

export function WorkspaceSidebar({
  activeProjectId,
  anchorRef,
  onClose,
  onDeleteProject,
  onHome,
  onLoadProject,
  onProjectNameChange,
  onSaveAsProject,
  onSaveProject,
  projectName,
  projects,
  saveState
}: WorkspaceSidebarProps) {
  const { t } = useAvatarLocale()
  const menuRef = useRef<HTMLElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [anchorStyle, setAnchorStyle] = useState<CSSProperties>()
  const [renaming, setRenaming] = useState(false)
  const [recentOpen, setRecentOpen] = useState(false)

  useLayoutEffect(() => {
    const updateAnchorStyle = () => {
      const anchor = anchorRef.current
      if (anchor == null) return
      const rect = anchor.getBoundingClientRect()
      const width = menuRef.current?.offsetWidth || 240
      const left = Math.min(Math.max(rect.left, 8), Math.max(window.innerWidth - width - 8, 8))
      const top = rect.bottom + 8
      setAnchorStyle({
        left,
        maxHeight: Math.max(window.innerHeight - top - 8, 120),
        top
      })
    }
    updateAnchorStyle()
    window.addEventListener('resize', updateAnchorStyle)
    window.addEventListener('scroll', updateAnchorStyle, true)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateAnchorStyle)
    if (anchorRef.current != null) observer?.observe(anchorRef.current)
    return () => {
      window.removeEventListener('resize', updateAnchorStyle)
      window.removeEventListener('scroll', updateAnchorStyle, true)
      observer?.disconnect()
    }
  }, [anchorRef])

  useEffect(() => {
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      if ((event.target as Element | null)?.closest('.avatar-app__workspace-toggle') != null) return
      onClose()
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (renaming) nameInputRef.current?.select()
  }, [renaming])

  const runAndClose = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <aside
      ref={menuRef}
      id='avatar-workspace-sidebar'
      className='avatar-workspace-sidebar'
      role='menu'
      aria-label={t('Project menu')}
      style={anchorStyle}
    >
      <section className='avatar-workspace-sidebar__project'>
        <strong>{projectName.trim() || t('Untitled project')}</strong>
        {saveState === 'idle' ? null : (
          <span className='avatar-workspace-sidebar__save-status' data-state={saveState}>
            {saveState === 'saving' ? t('Saving…') : saveState === 'saved' ? t('Saved') : t('Save failed')}
          </span>
        )}
      </section>

      <div className='avatar-workspace-sidebar__items'>
        <button type='button' role='menuitem' disabled={saveState === 'saving'} onClick={() => runAndClose(onSaveProject)}>
          <WorkspaceIcon name='save' /><span>{t('Save project')}</span>
        </button>
        <button type='button' role='menuitem' onClick={() => runAndClose(onSaveAsProject)}>
          <WorkspaceIcon name='saveAs' /><span>{t('Save as')}</span>
        </button>
        <button type='button' role='menuitem' aria-expanded={renaming} onClick={() => setRenaming(current => !current)}>
          <WorkspaceIcon name='rename' /><span>{t('Rename project')}</span>
        </button>
        {renaming ? (
          <input
            ref={nameInputRef}
            className='avatar-workspace-sidebar__name'
            value={projectName}
            aria-label={t('Project name')}
            placeholder={t('Untitled project')}
            onChange={event => onProjectNameChange(event.currentTarget.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') setRenaming(false)
              if (event.key === 'Escape') setRenaming(false)
            }}
          />
        ) : null}
        <button type='button' role='menuitem' aria-expanded={recentOpen} onClick={() => setRecentOpen(current => !current)}>
          <WorkspaceIcon name='recent' /><span>{t('Recent projects')}</span><WorkspaceIcon name='chevron' />
        </button>
      </div>

      {recentOpen ? (
        <section className='avatar-workspace-sidebar__recent' aria-label={t('Recent projects')}>
          {projects.length === 0 ? <span className='avatar-workspace-sidebar__empty'>{t('No recent projects')}</span> : null}
          {projects.map(project => (
            <div key={project.id} className='avatar-workspace-sidebar__project-row' data-active={project.id === activeProjectId}>
              <button type='button' role='menuitem' onClick={() => runAndClose(() => onLoadProject(project.id))}>
                <strong>{project.name}</strong><span>{formatProjectDate(project.updatedAt)}</span>
              </button>
              <button type='button' aria-label={`${t('Delete')} ${project.name}`} onClick={() => onDeleteProject(project.id)}>
                <WorkspaceIcon name='delete' />
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {activeProjectId == null ? null : (
        <div className='avatar-workspace-sidebar__danger'>
          <button type='button' role='menuitem' onClick={() => runAndClose(() => onDeleteProject(activeProjectId))}>
            <WorkspaceIcon name='delete' /><span>{t('Delete project')}</span>
          </button>
        </div>
      )}

      {onHome == null ? null : (
        <div className='avatar-workspace-sidebar__items avatar-workspace-sidebar__items--home'>
          <button className='avatar-workspace-sidebar__home' type='button' role='menuitem' onClick={() => runAndClose(onHome)}>
            <WorkspaceIcon name='home' /><span>{t('Back to website')}</span>
          </button>
        </div>
      )}
    </aside>
  )
}
