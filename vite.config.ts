import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.ONEWORKS_AGENT_AVATAR_BASE ?? '/',
  plugins: [react()],
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    conditions: ['browser', '__oneworks__', 'module', 'import', 'development']
  },
  server: {
    host: '127.0.0.1'
  },
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    target: 'es2022'
  }
})
