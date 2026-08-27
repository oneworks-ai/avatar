import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import TwoSphereOcclusionLab from './TwoSphereOcclusionLab'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TwoSphereOcclusionLab />
  </StrictMode>
)
