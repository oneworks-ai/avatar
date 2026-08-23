import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const appSourceDir = process.env.ONEWORKS_APP_SOURCE_DIR
const defaultAppSourcePath = path.resolve('app-source')
const appSourcePath = appSourceDir == null || appSourceDir.length === 0
  ? (fs.existsSync(defaultAppSourcePath) ? defaultAppSourcePath : null)
  : path.resolve(appSourceDir)

export default defineConfig({
  base: process.env.ONEWORKS_AVATAR_BASE ?? '/',
  plugins: [react()],
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: appSourcePath == null
    ? undefined
    : {
      alias: [
        {
          find: /^@oneworks\/avatar-react$/,
          replacement: path.resolve('packages/react/src/index.tsx')
        },
        {
          find: /^@oneworks\/avatar-react\/style\.css$/,
          replacement: path.resolve('packages/react/src/style.scss')
        },
        {
          find: /^@oneworks\/avatar$/,
          replacement: path.resolve('packages/avatar/src/index.ts')
        },
        {
          find: '@oneworks/route-layout/design-tokens.css',
          replacement: path.join(appSourcePath, 'packages/route-layout/src/design-tokens.css')
        }
      ]
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
