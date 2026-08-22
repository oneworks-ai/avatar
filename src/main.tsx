import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './base.scss'

import { AvatarLocaleProvider } from './avatarLocale'
import Root from './Root'

document.documentElement.classList.toggle(
  'dark',
  window.matchMedia('(prefers-color-scheme: dark)').matches
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AvatarLocaleProvider>
      <Root />
    </AvatarLocaleProvider>
  </StrictMode>
)
