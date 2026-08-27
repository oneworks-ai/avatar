import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    exclude: ['**/app-source/**', '**/dist/**', '**/node_modules/**'],
    hookTimeout: 120_000,
    maxWorkers: 1,
    testTimeout: 120_000
  }
}))
