import './HomePage.scss'

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'

import { HomeHeaderActions } from './HomeHeaderActions'
import { HOME_TEMPLATES } from './avatarHome'
import type { HomeTemplateId } from './avatarHome'
import { useAvatarLocale } from './avatarLocale'

const HomeAvatarPreview = lazy(() => import('./HomeAvatarPreview'))

interface HomePageProps {
  readonly onCreate: (template: HomeTemplateId) => void
  readonly onPrepareEditor: () => void
}

const getWrappedIndex = (index: number) => (
  (index + HOME_TEMPLATES.length) % HOME_TEMPLATES.length
)

const CAROUSEL_OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const

const getCarouselPosition = (offset: (typeof CAROUSEL_OFFSETS)[number]) => {
  if (offset === -3) return 'hidden-previous'
  if (offset === -2) return 'far-previous'
  if (offset === -1) return 'previous'
  if (offset === 0) return 'active'
  if (offset === 1) return 'next'
  if (offset === 2) return 'far-next'
  return 'hidden-next'
}

const AvatarPreviewFallback = ({ background }: { readonly background: string }) => (
  <div
    className='avatar-home__preview-fallback'
    aria-hidden='true'
    style={{ '--avatar-home-fallback': background } as CSSProperties}
  >
    <i />
    <i />
  </div>
)

export const HomePage = ({
  onCreate,
  onPrepareEditor
}: HomePageProps) => {
  const { t } = useAvatarLocale()
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [previewReady, setPreviewReady] = useState(false)
  const activeIndexRef = useRef(0)
  const dragStartXRef = useRef<number | null>(null)
  const dragPointerIdRef = useRef<number | null>(null)
  const ignoreCardClickRef = useRef(false)
  const navigationTimerRef = useRef<number | null>(null)
  const wrappedActiveIndex = getWrappedIndex(activeIndex)
  const activeTemplate = HOME_TEMPLATES[wrappedActiveIndex]
  const carouselItems = CAROUSEL_OFFSETS.map(offset => {
    const virtualIndex = activeIndex + offset
    return {
      index: getWrappedIndex(virtualIndex),
      position: getCarouselPosition(offset),
      virtualIndex
    }
  })

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setPreviewReady(true))
    return () => {
      window.cancelAnimationFrame(frameId)
      if (navigationTimerRef.current != null) {
        window.clearTimeout(navigationTimerRef.current)
      }
    }
  }, [])

  const setCarouselIndex = (nextIndex: number) => {
    activeIndexRef.current = nextIndex
    setActiveIndex(nextIndex)
    setDragOffset(0)
  }

  const selectTemplate = (nextIndex: number) => {
    if (navigationTimerRef.current != null) {
      window.clearTimeout(navigationTimerRef.current)
      navigationTimerRef.current = null
    }

    const distance = Math.abs(nextIndex - activeIndexRef.current)
    if (distance <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCarouselIndex(nextIndex)
      return
    }

    const direction = nextIndex > activeIndexRef.current ? 1 : -1
    const advance = () => {
      const nextStep = activeIndexRef.current + direction
      setCarouselIndex(nextStep)
      if (nextStep === nextIndex) {
        navigationTimerRef.current = null
        return
      }
      navigationTimerRef.current = window.setTimeout(advance, 420)
    }

    advance()
  }

  const selectTemplateByWrappedIndex = (nextWrappedIndex: number) => {
    let delta = nextWrappedIndex - wrappedActiveIndex
    if (delta > HOME_TEMPLATES.length / 2) delta -= HOME_TEMPLATES.length
    if (delta < -HOME_TEMPLATES.length / 2) delta += HOME_TEMPLATES.length
    selectTemplate(activeIndex + delta)
  }

  const changeTemplate = (direction: 'next' | 'previous') => {
    selectTemplate(activeIndex + (direction === 'next' ? 1 : -1))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = event.clientX
    dragPointerIdRef.current = event.pointerId
    ignoreCardClickRef.current = false
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current == null || dragPointerIdRef.current !== event.pointerId) return
    const delta = event.clientX - dragStartXRef.current
    if (Math.abs(delta) >= 8) {
      ignoreCardClickRef.current = true
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
    }
    setDragOffset(Math.max(-110, Math.min(110, delta)))
  }

  const finishPointerGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current == null || dragPointerIdRef.current !== event.pointerId) return
    const delta = event.clientX - dragStartXRef.current
    dragStartXRef.current = null
    dragPointerIdRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (Math.abs(delta) >= 44) {
      changeTemplate(delta < 0 ? 'next' : 'previous')
      return
    }
    setDragOffset(0)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    changeTemplate(event.key === 'ArrowRight' ? 'next' : 'previous')
  }

  return (
    <main className='avatar-home'>
      <header className='avatar-home__header'>
        <a className='avatar-home__brand' href='/' aria-label={t('OneWorks Avatar home')}>
          <svg viewBox='0 0 32 32' aria-hidden='true'>
            <rect x='3' y='3' width='26' height='26' rx='9' />
            <rect x='9' y='11' width='4' height='10' rx='2' />
            <rect x='19' y='11' width='4' height='10' rx='2' />
          </svg>
          <span>OneWorks Avatar</span>
        </a>
        <div className='avatar-home__header-actions'>
          <HomeHeaderActions />
        </div>
      </header>

      <section className='avatar-home__hero' aria-labelledby='avatar-home-title'>
        <div
          className='avatar-home__carousel-shell'
          role='region'
          aria-roledescription={t('carousel')}
          aria-label={`${t('Avatar templates')}. ${t('Current avatar')}: ${t(activeTemplate.label)}`}
          aria-live='polite'
          tabIndex={0}
          data-dragging={dragStartXRef.current != null}
          style={{ '--avatar-home-drag-x': `${dragOffset}px` } as CSSProperties}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerGesture}
          onPointerCancel={finishPointerGesture}
        >
          {carouselItems.map(item => {
            const template = HOME_TEMPLATES[item.index]
            const preview = previewReady
              ? (
                <Suspense fallback={<AvatarPreviewFallback background={template.background} />}>
                  <HomeAvatarPreview template={template.id} />
                </Suspense>
              )
              : <AvatarPreviewFallback background={template.background} />

            return (
              <div
                key={item.virtualIndex}
                className='avatar-home__carousel-card'
                data-position={item.position}
              >
                <button
                  className='avatar-home__carousel-tile'
                  type='button'
                  aria-current={item.position === 'active' ? 'true' : undefined}
                  aria-label={item.position === 'active'
                    ? `${t('Current avatar')}: ${t(template.label)}`
                    : `${t('Switch to')} ${t(template.label)}`}
                  onPointerUp={() => {
                    if (!ignoreCardClickRef.current && item.position !== 'active') {
                      selectTemplate(item.virtualIndex)
                    }
                  }}
                  onClick={event => {
                    if (event.detail !== 0 || item.position === 'active') return
                    ignoreCardClickRef.current = false
                    selectTemplate(item.virtualIndex)
                  }}
                >
                  {preview}
                </button>
              </div>
            )
          })}
        </div>

        <div className='avatar-home__carousel-pagination' role='tablist' aria-label={t('Select avatar')}>
          {HOME_TEMPLATES.map((template, index) => (
            <button
              key={template.id}
              type='button'
              role='tab'
              aria-label={t(template.label)}
              aria-selected={index === wrappedActiveIndex}
              title={t(template.label)}
              style={{ '--avatar-home-dot': template.background } as CSSProperties}
              onClick={() => selectTemplateByWrappedIndex(index)}
            />
          ))}
        </div>

        <div className='avatar-home__hero-copy'>
          <h1 id='avatar-home-title'>{t('Bring your avatar to life')}</h1>
          <div className='avatar-home__hero-actions'>
            <button
              className='avatar-home__continue'
              type='button'
              onPointerEnter={onPrepareEditor}
              onFocus={onPrepareEditor}
              onClick={() => onCreate(activeTemplate.id)}
            >
              {t('Start creating')}
              <svg viewBox='0 0 20 20' aria-hidden='true'><path d='m7 4 6 6-6 6' /></svg>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
