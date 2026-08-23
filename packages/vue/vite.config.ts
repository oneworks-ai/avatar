import path from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({ entryRoot: 'src', tsconfigPath: path.resolve(__dirname, 'tsconfig.json') })
  ],
  build: {
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['@oneworks/avatar-core', '@oneworks/avatar-web', 'vue']
    },
    target: 'es2022'
  }
})
