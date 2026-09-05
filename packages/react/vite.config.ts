import path from 'node:path'

import react from '@vitejs/plugin-react'
import { compile } from 'sass'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'avatar-public-stylesheets',
      generateBundle: {
        order: 'post',
        handler(_options, bundle) {
          // Vite's compatibility stylesheet contains all editor/component CSS.
          // Display consumers get a separately compiled, complete renderer CSS.
          const fullStyle = bundle['style.css']
          if (fullStyle?.type !== 'asset') throw new Error('Missing Avatar compatibility stylesheet')
          this.emitFile({ type: 'asset', fileName: 'editor.css', source: fullStyle.source })
          this.emitFile({
            type: 'asset',
            fileName: 'renderer.css',
            source: compile(path.resolve(__dirname, 'src/renderer-style.scss'), { style: 'compressed' }).css
          })
        }
      }
    },
    dts({
      aliasesExclude: ['@oneworks/avatar'],
      entryRoot: 'src',
      include: ['src/**/*', '../../src/gifenc.d.ts'],
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json')
    })
  ],
  // Relative URLs let a consuming Vite build relocate chunks and static assets.
  base: './',
  resolve: {
    alias: {
      '@oneworks/avatar': path.resolve(__dirname, '../avatar/src/index.ts'),
      '@oneworks/route-layout/design-tokens.css': path.resolve(
        __dirname,
        '../../app-source/packages/route-layout/src/design-tokens.css'
      )
    }
  },
  build: {
    emptyOutDir: true,
    // Vite library mode always inlines assets in this supported Vite version.
    // Explicit ESM entries preserve the package API while emitting image files.
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    cssMinify: true,
    minify: false,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src/index.tsx'),
        renderer: path.resolve(__dirname, 'src/renderer.tsx'),
        editor: path.resolve(__dirname, 'src/editor.tsx')
      },
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: asset => asset.name?.endsWith('.css') ? 'style.css' : 'assets/[name]-[hash][extname]'
      },
      external: [
        '@oneworks/avatar',
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime'
      ]
    },
    target: 'es2022'
  }
})
