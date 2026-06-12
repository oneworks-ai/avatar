import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

const syncTheme = () => {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', dark)
}

syncTheme()
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
