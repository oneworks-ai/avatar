import path from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ entryRoot: 'src', tsconfigPath: path.resolve(__dirname, 'tsconfig.json') })],
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        elements: path.resolve(__dirname, 'src/elements.ts'),
        index: path.resolve(__dirname, 'src/index.ts')
      },
      formats: ['es']
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [
        '@oneworks/avatar-core',
        '@oneworks/avatar-react',
        'react',
        'react-dom/client'
      ],
      output: { entryFileNames: '[name].js' }
    },
    target: 'es2022'
  }
})
