import './HomePage.scss'

import { lazy, Suspense, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'

import { HomeHeaderActions } from './HomeHeaderActions'
import { HOME_EXPLORE_TEMPLATES, HOME_TEMPLATES } from './avatarHome'
import type { HomeTemplateId } from './avatarHome'
import type { AvatarEffectStylePresetId } from './avatarEffectStylePresets'
import { useAvatarLocale } from './avatarLocale'

const HomeAvatarPreview = lazy(() => import('./HomeAvatarPreview'))

interface HomePageProps {
  readonly onCreate: (template: HomeTemplateId) => void
  readonly onCreateBreed: (entity: HomeTemplateId, breed: string) => void
  readonly onCreateEffectStyle: (entity: HomeTemplateId, effectStyle: AvatarEffectStylePresetId) => void
  readonly onSurprise: () => void
  readonly onPrepareEditor: () => void
}

const getWrappedIndex = (index: number) => (
  ((index % HOME_TEMPLATES.length) + HOME_TEMPLATES.length) % HOME_TEMPLATES.length
)

const getGalleryOffset = (index: number, activeIndex: number) => {
  let offset = index - activeIndex
  if (offset > HOME_TEMPLATES.length / 2) offset -= HOME_TEMPLATES.length
  if (offset < -HOME_TEMPLATES.length / 2) offset += HOME_TEMPLATES.length
  return offset
}

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

const StaticAvatarPreview = ({ snapshot }: { readonly snapshot: string }) => (
  <img
    className='avatar-home__static-preview'
    alt=''
    aria-hidden='true'
    decoding='async'
    src={snapshot}
  />
)

export const HomePage = ({
  onCreate,
  onCreateBreed,
  onCreateEffectStyle,
  onSurprise,
  onPrepareEditor
}: HomePageProps) => {
  const { t } = useAvatarLocale()
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const catalogRef = useRef<HTMLDivElement>(null)
  const exploreRef = useRef<HTMLElement>(null)
  const dragStartXRef = useRef<number | null>(null)
  const dragPointerIdRef = useRef<number | null>(null)
  const ignoreCardClickRef = useRef(false)
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

  const setCarouselIndex = (nextIndex: number) => {
    setActiveIndex(nextIndex)
    setDragOffset(0)
  }

  const selectTemplate = (nextIndex: number) => {
    setCarouselIndex(nextIndex)
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

  const handleCatalogKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    changeTemplate(event.key === 'ArrowRight' ? 'next' : 'previous')
    window.requestAnimationFrame(() => {
      catalogRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
    })
  }

  const scrollToExplore = () => {
    exploreRef.current?.scrollIntoView?.({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    })
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
            const preview = item.position === 'active'
              ? (
                <Suspense fallback={<StaticAvatarPreview snapshot={template.snapshot} />}>
                  <HomeAvatarPreview template={template.id} />
                </Suspense>
              )
              : <StaticAvatarPreview snapshot={template.snapshot} />

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

        <div
          ref={catalogRef}
          className='avatar-home__catalog'
          role='tablist'
          aria-label={t('Select avatar')}
        >
          {HOME_TEMPLATES.map((template, index) => (
            <button
              key={template.id}
              className='avatar-home__catalog-item'
              data-home-avatar-template={template.id}
              data-home-avatar-offset={getGalleryOffset(index, wrappedActiveIndex)}
              type='button'
              role='tab'
              aria-label={t(template.label)}
              aria-selected={index === wrappedActiveIndex}
              tabIndex={index === wrappedActiveIndex ? 0 : -1}
              title={t(template.label)}
              style={{
                '--avatar-home-gallery-x': `${getGalleryOffset(index, wrappedActiveIndex) * 64}px`
              } as CSSProperties}
              onClick={() => selectTemplateByWrappedIndex(index)}
              onKeyDown={handleCatalogKeyDown}
            >
              <img
                alt=''
                aria-hidden='true'
                decoding='async'
                loading={index < 12 ? 'eager' : 'lazy'}
                src={template.snapshot}
              />
            </button>
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
            <button
              className='avatar-home__surprise'
              type='button'
              onPointerEnter={onPrepareEditor}
              onFocus={onPrepareEditor}
              onClick={onSurprise}
            >
              <svg viewBox='0 0 20 20' aria-hidden='true'>
                <rect x='3.25' y='3.25' width='13.5' height='13.5' rx='3' />
                <circle cx='7' cy='7' r='1' />
                <circle cx='13' cy='7' r='1' />
                <circle cx='10' cy='10' r='1' />
                <circle cx='7' cy='13' r='1' />
                <circle cx='13' cy='13' r='1' />
              </svg>
              {t('Surprise me')}
            </button>
          </div>
          <button
            className='avatar-home__view-more'
            type='button'
            aria-controls='avatar-home-explore'
            onClick={scrollToExplore}
          >
            {t('View more')}
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <path d='m5 8 5 5 5-5' />
            </svg>
          </button>
        </div>
      </section>

      <section
        ref={exploreRef}
        id='avatar-home-explore'
        className='avatar-home__explore'
        aria-label={t('All avatars')}
      >
        <div className='avatar-home__explore-grid'>
          {HOME_EXPLORE_TEMPLATES.map(template => (
            <button
              key={template.id}
              className='avatar-home__explore-item'
              type='button'
              data-home-explore-template={template.id}
              data-size={template.size}
              aria-label={`${t('Edit')} ${t(template.label)}`}
              title={t(template.label)}
              onPointerEnter={onPrepareEditor}
              onFocus={onPrepareEditor}
              onClick={() => {
                if (template.effectStyle != null) {
                  onCreateEffectStyle(template.entity, template.effectStyle)
                  return
                }
                if (template.breed != null) {
                  onCreateBreed(template.entity, template.breed)
                  return
                }
                onCreate(template.entity)
              }}
            >
              <img
                src={template.snapshot}
                alt=''
                aria-hidden='true'
                decoding='async'
                loading='lazy'
              />
            </button>
          ))}
        </div>
      </section>

      <section className='avatar-home__create-own' aria-labelledby='avatar-home-create-own-title'>
        <h2 id='avatar-home-create-own-title'>{t("Didn't find your avatar?")}</h2>
        <p>{t('Create your own avatar from the model you selected.')}</p>
        <button
          className='avatar-home__continue avatar-home__create-own-action'
          type='button'
          onPointerEnter={onPrepareEditor}
          onFocus={onPrepareEditor}
          onClick={() => onCreate(activeTemplate.id)}
        >
          {t('Create your own')}
          <svg viewBox='0 0 20 20' aria-hidden='true'><path d='m7 4 6 6-6 6' /></svg>
        </button>
      </section>
    </main>
  )
}
