import { useEffect, useRef, useState } from 'react'

import { AVATAR_LOCALES, useAvatarLocale } from './avatarLocale'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useAvatarLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className='avatar-language-switcher'>
      <button
        className='avatar-app__language-toggle'
        type='button'
        aria-expanded={open}
        aria-haspopup='dialog'
        aria-label={t('Language')}
        title={t('Language')}
        onClick={() => setOpen(value => !value)}
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <circle cx='10' cy='10' r='7.4' />
          <path d='M2.8 10h14.4M10 2.6c2 2.1 3 4.6 3 7.4s-1 5.3-3 7.4c-2-2.1-3-4.6-3-7.4s1-5.3 3-7.4Z' />
        </svg>
      </button>
      {open
        ? (
          <div className='avatar-language-switcher__dialog' role='dialog' aria-label={t('Select language')}>
            <span className='avatar-language-switcher__title'>{t('Language')}</span>
            <div className='avatar-language-switcher__options' role='radiogroup' aria-label={t('Select language')}>
              {AVATAR_LOCALES.map(option => (
                <button
                  key={option.id}
                  className='avatar-language-switcher__option'
                  type='button'
                  role='radio'
                  aria-checked={locale === option.id}
                  onClick={() => {
                    setLocale(option.id)
                    setOpen(false)
                  }}
                >
                  <span>
                    <strong>{option.nativeLabel}</strong>
                    {option.nativeLabel === t(option.label) ? null : <small>{t(option.label)}</small>}
                  </span>
                  <svg viewBox='0 0 20 20' aria-hidden='true'>
                    <path d='m4.5 10.2 3.4 3.4 7.6-7.4' />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )
        : null}
    </div>
  )
}
