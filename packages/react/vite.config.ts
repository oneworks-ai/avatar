import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      include: ['src/**/*', '../../src/gifenc.d.ts'],
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json')
    })
  ],
  resolve: {
    alias: {
      '@oneworks/avatar': path.resolve(__dirname, '../../app-source/packages/avatar/src/index.ts'),
      '@oneworks/route-layout/design-tokens.css': path.resolve(
        __dirname,
        '../../app-source/packages/route-layout/src/design-tokens.css'
      )
    }
  },
  build: {
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'),
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        '@oneworks/avatar-core',
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime'
      ]
    },
    target: 'es2022'
  }
})
