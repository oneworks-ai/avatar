import './HomeHeaderActions.scss'

import { useEffect, useState } from 'react'

import { LanguageSwitcher } from './LanguageSwitcher'
import { useAvatarLocale } from './avatarLocale'

const AVATAR_GITHUB_URL = 'https://github.com/oneworks-ai/avatar'

export const HomeHeaderActions = () => {
  const { t } = useAvatarLocale()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <>
      <a
        className='avatar-app__github-link'
        href={AVATAR_GITHUB_URL}
        target='_blank'
        rel='noreferrer'
        aria-label={t('Open Avatar on GitHub')}
        title='GitHub'
      >
        <svg viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M10 1.9a8.1 8.1 0 0 0-2.6 15.8c.4.1.6-.2.6-.4v-1.6c-2.4.5-2.9-1-2.9-1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-1.9-.2-3.9-1-3.9-4a3.1 3.1 0 0 1 .8-2.2c-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 2 .1 2.2.5.6.8 1.4.8 2.2 0 3.1-2 3.8-3.9 4 .3.3.6.8.6 1.6v2.4c0 .3.2.5.6.4A8.1 8.1 0 0 0 10 1.9Z' />
        </svg>
      </a>
      <button
        className='avatar-app__theme-toggle'
        type='button'
        aria-label={dark ? t('Switch to light theme') : t('Switch to dark theme')}
        title={dark ? t('Light theme') : t('Dark theme')}
        onClick={() => setDark(value => !value)}
      >
        {dark
          ? (
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <circle cx='10' cy='10' r='3.2' />
              <path d='M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4' />
            </svg>
          )
          : (
            <svg viewBox='0 0 20 20' aria-hidden='true'>
              <path d='M16.9 12.6A7 7 0 0 1 7.4 3.1a7 7 0 1 0 9.5 9.5Z' />
            </svg>
          )}
      </button>
      <LanguageSwitcher />
    </>
  )
}
