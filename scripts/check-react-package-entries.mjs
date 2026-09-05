import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// Capture utilities may contain a short data-URL prefix; only complete embedded
// image literals indicate that a preview asset leaked into a JavaScript chunk.
const hasEmbeddedSvg = code => [...code.matchAll(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g)]
  .some(([literal]) => /^['"]data:image\/svg\+xml/.test(literal) && literal.length > 200)

// Exercise the installed tarball, without repository aliases or source conditions.
export async function checkReactPackageEntries(consumerDirectory) {
  const { build } = await import(pathToFileURL(path.join(consumerDirectory, 'node_modules/vite/dist/node/index.js')).href)
  const manifest = JSON.parse(await readFile(path.join(consumerDirectory, 'node_modules/@oneworks/avatar-react/package.json'), 'utf8'))
  for (const name of ['renderer', 'editor']) {
    const entry = manifest.exports[`./${name}`]
    assert.equal(entry.default, `./dist/${name}.js`)
    await readFile(path.join(consumerDirectory, 'node_modules/@oneworks/avatar-react', entry.types))
  }

  const rendererEntry = path.join(consumerDirectory, 'src/renderer-only.ts')
  await writeFile(rendererEntry, `
export { Avatar } from '@oneworks/avatar-react/renderer'
import '@oneworks/avatar-react/renderer.css'
`)
  const buildEntry = async entry => {
    const result = await build({
      root: consumerDirectory,
      configFile: false,
      publicDir: false,
      base: './',
      logLevel: 'error',
      build: {
        write: false,
        assetsInlineLimit: 0,
        cssCodeSplit: true,
        rollupOptions: { input: entry, preserveEntrySignatures: 'strict' }
      }
    })
    return result.output
  }

  const rendererOutput = await buildEntry(rendererEntry)
  const rendererChunks = rendererOutput.filter(file => file.type === 'chunk')
  const rendererBytes = rendererChunks.reduce((total, file) => total + Buffer.byteLength(file.code), 0)
  assert.ok(rendererBytes < 750_000, `Display-only consumer is unexpectedly large: ${rendererBytes} bytes`)
  for (const chunk of rendererChunks) {
    assert.ok(!Object.keys(chunk.modules).some(id => /\/avatar-react\/dist\/(?:index|editor)\.js$/.test(id)), 'Renderer includes the compatibility/editor entry')
    assert.ok(!hasEmbeddedSvg(chunk.code), 'Renderer includes inline preview SVGs')
  }
  const rendererAssets = rendererOutput.filter(file => file.type === 'asset')
  assert.ok(rendererAssets.length > 0, 'Renderer CSS was removed as a side effect')
  assert.ok(rendererAssets.every(file => file.fileName.endsWith('.css')), 'Renderer emitted editor image assets')
  const rendererCss = rendererAssets.map(file => String(file.source)).join('\n')
  assert.ok(Buffer.byteLength(rendererCss) < 16_000, 'Renderer contains full editor styles')
  assert.ok(rendererCss.includes('.interactive-avatar') && rendererCss.includes('.oneworks-avatar'))
  assert.ok(!rendererCss.includes('.avatar-app'))

  const lazyEntry = path.join(consumerDirectory, 'src/lazy-editor.ts')
  await writeFile(lazyEntry, `
export { Avatar } from '@oneworks/avatar-react/renderer'
import '@oneworks/avatar-react/renderer.css'
export async function loadEditor() {
  const [module] = await Promise.all([
    import('@oneworks/avatar-react/editor'),
    import('@oneworks/avatar-react/editor.css')
  ])
  return module.AvatarEditor
}
`)
  const lazyOutput = await buildEntry(lazyEntry)
  const files = new Map(lazyOutput.map(file => [file.fileName, file]))
  const initial = new Set()
  const visit = filename => {
    if (initial.has(filename)) return
    initial.add(filename)
    const file = files.get(filename)
    if (file?.type === 'chunk') file.imports.forEach(visit)
  }
  lazyOutput.filter(file => file.type === 'chunk' && file.isEntry).forEach(file => visit(file.fileName))
  const editorChunk = lazyOutput.find(file => file.type === 'chunk' && Object.keys(file.modules).some(id => /\/avatar-react\/dist\/editor\.js$/.test(id)))
  assert.ok(editorChunk, 'Packed editor subpath did not produce an editor chunk')
  assert.ok(!initial.has(editorChunk.fileName), 'Editor is reachable through a startup static import')
  const editorCss = lazyOutput.find(file => file.type === 'asset' && file.fileName.endsWith('.css') && String(file.source).includes('.avatar-app'))
  assert.ok(editorCss, 'Packed editor CSS did not survive the consuming build')
  for (const filename of initial) {
    const chunk = files.get(filename)
    if (chunk?.type === 'chunk') {
      assert.ok(chunk.viteMetadata?.importedCss instanceof Set, 'Missing Vite stylesheet graph metadata')
      assert.ok(!chunk.viteMetadata.importedCss.has(editorCss.fileName), 'Editor CSS is loaded by the startup graph')
    }
  }
  const imageAssets = lazyOutput.filter(file => file.type === 'asset' && file.fileName.endsWith('.svg'))
  assert.ok(imageAssets.length > 0, 'Editor images were not emitted as relocatable assets')
  assert.ok(imageAssets.some(file => /favicon-.*\.svg$/.test(file.fileName)), 'Editor project icon still depends on the host site root')
  for (const file of lazyOutput.filter(file => file.type === 'chunk')) {
    assert.ok(!hasEmbeddedSvg(file.code), 'Editor preview images were inlined into JavaScript')
    for (const reference of file.referencedFiles) assert.ok(files.has(reference), `Missing referenced asset: ${reference}`)
  }
  const initialBytes = [...initial].reduce((total, name) => {
    const file = files.get(name)
    return total + (file?.type === 'chunk' ? Buffer.byteLength(file.code) : 0)
  }, 0)
  assert.ok(initialBytes < 750_000, `Lazy consumer startup graph is unexpectedly large: ${initialBytes} bytes`)
  process.stdout.write(`Packed React entries passed: renderer ${rendererBytes} B JS / ${Buffer.byteLength(rendererCss)} B CSS; lazy startup ${initialBytes} B JS; ${imageAssets.length} external SVG assets.\n`)
}
