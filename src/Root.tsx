import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { HomePage } from './HomePage'
import { LAST_EDITOR_QUERY_STORAGE_KEY } from './avatarHome'
import { useAvatarLocale } from './avatarLocale'

const loadEditor = () => import('./App')
const AvatarEditor = lazy(loadEditor)
const EDITOR_HASH = '#/editor'

export const createRandomAvatarEditorQuery = (seed: string, seedFields: string) => {
  const params = new URLSearchParams()
  params.set('seed', seed)
  params.set('seedFields', seedFields)
  return `?${params.toString()}`
}

const isEditorLocation = () => (
  window.location.hash === EDITOR_HASH || new URLSearchParams(window.location.search).size > 0
)

const replaceLocation = (query: string, hash: string) => {
  const url = new URL(window.location.href)
  url.search = query
  url.hash = hash
  window.history.pushState(null, '', url)
}

const Root = () => {
  const { t } = useAvatarLocale()
  const [editorOpen, setEditorOpen] = useState(isEditorLocation)
  const randomEditorOpeningRef = useRef(false)

  useEffect(() => {
    const syncRoute = () => setEditorOpen(isEditorLocation())
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  useEffect(() => {
    if (!editorOpen) randomEditorOpeningRef.current = false
  }, [editorOpen])

  useEffect(() => {
    if (editorOpen) return
    const connection = (navigator as Navigator & {
      connection?: { readonly saveData?: boolean }
    }).connection
    if (connection?.saveData) return

    const idleWindow = window as typeof window & {
      cancelIdleCallback?: (id: number) => void
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
    }
    let idleId: number | undefined
    const timeoutId = window.setTimeout(() => {
      if (idleWindow.requestIdleCallback != null) {
        idleId = idleWindow.requestIdleCallback(() => void loadEditor(), { timeout: 1800 })
        return
      }
      void loadEditor()
    }, 4000)
    return () => {
      window.clearTimeout(timeoutId)
      if (idleId != null) idleWindow.cancelIdleCallback?.(idleId)
    }
  }, [editorOpen])

  const openEditor = useCallback((query: string) => {
    replaceLocation(query, EDITOR_HASH)
    setEditorOpen(true)
  }, [])

  const openRandomEditor = useCallback(() => {
    if (randomEditorOpeningRef.current) return
    randomEditorOpeningRef.current = true

    void import('./avatarSeed')
      .then(({ AVATAR_SEED_FIELDS, createRandomAvatarSeed, serializeAvatarSeedFields }) => {
        openEditor(createRandomAvatarEditorQuery(
          createRandomAvatarSeed(),
          serializeAvatarSeedFields(AVATAR_SEED_FIELDS)
        ))
      })
      .catch(() => {
        randomEditorOpeningRef.current = false
      })
  }, [openEditor])

  const openHome = useCallback(() => {
    if (window.location.search.length > 1) {
      try {
        window.localStorage.setItem(LAST_EDITOR_QUERY_STORAGE_KEY, window.location.search)
      } catch {
        // Navigation should continue even if storage is unavailable.
      }
    }
    replaceLocation('', '')
    setEditorOpen(false)
  }, [])

  if (editorOpen) {
    return (
      <Suspense fallback={<div className='avatar-home-loading' aria-label={t('Opening editor')}><i /><i /></div>}>
        <AvatarEditor onHome={openHome} />
      </Suspense>
    )
  }

  return (
    <HomePage
      onCreate={template => openEditor(`?template=${template}`)}
      onSurprise={openRandomEditor}
      onPrepareEditor={() => void loadEditor()}
    />
  )
}

export default Root
