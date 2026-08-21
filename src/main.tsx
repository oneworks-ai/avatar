import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { AvatarLocaleProvider } from './avatarLocale'

document.documentElement.classList.toggle(
  'dark',
  window.matchMedia('(prefers-color-scheme: dark)').matches
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AvatarLocaleProvider>
      <App />
    </AvatarLocaleProvider>
  </StrictMode>
)
