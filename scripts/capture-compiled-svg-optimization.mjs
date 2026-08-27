import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import sharp from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs'

const ROOT = process.cwd()
const OUTPUT = path.join(ROOT, 'artifacts/compiled-svg-optimization-2026-08-26')
const BASE_URL = process.env.COMPILED_SVG_LAB_URL ?? 'http://127.0.0.1:5194/compiled-svg-lab.html'
const fixtures = ['bird', 'cat']
const engines = ['baseline', 'optimized']
const qualities = [
  { id: 'interactive', query: '' },
  { id: 'export32', query: '&quality=high' }
]
const yawValues = [-90, -85, -60, -30, 0, 30, 60, 85, 90, 180]
const pitchValues = [-30, 0, 30]
const sha256 = async filePath => createHash('sha256').update(await readFile(filePath)).digest('hex')
const featureColors = {
  bird: ['#15120f', '#713118'],
  cat: ['#15120f', '#f6d3a4', '#4a251c', '#2c1b18']
}

const analyzeCapture = async (filePath, fixture) => {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const pixelCount = info.width * info.height
  const background = new Uint8Array(pixelCount)
  const exterior = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  let queueLength = 0
  const isMagenta = index => data[index * 4] === 255 && data[index * 4 + 1] === 0 && data[index * 4 + 2] === 255
  for (let index = 0; index < pixelCount; index += 1) background[index] = isMagenta(index) ? 1 : 0
  const enqueue = index => {
    if (background[index] === 0 || exterior[index] === 1) return
    exterior[index] = 1
    queue[queueLength++] = index
  }
  for (let x = 0; x < info.width; x += 1) {
    enqueue(x)
    enqueue((info.height - 1) * info.width + x)
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueue(y * info.width)
    enqueue(y * info.width + info.width - 1)
  }
  for (let cursor = 0; cursor < queueLength; cursor += 1) {
    const index = queue[cursor]
    const x = index % info.width
    const y = Math.floor(index / info.width)
    if (x > 0) enqueue(index - 1)
    if (x + 1 < info.width) enqueue(index + 1)
    if (y > 0) enqueue(index - info.width)
    if (y + 1 < info.height) enqueue(index + info.width)
  }
  let internalMagentaPixels = 0
  for (let index = 0; index < pixelCount; index += 1) {
    if (background[index] === 1 && exterior[index] === 0) internalMagentaPixels += 1
  }
  const exactFeaturePixels = Object.fromEntries(featureColors[fixture].map(color => [color, 0]))
  for (let index = 0; index < pixelCount; index += 1) {
    const color = `#${[data[index * 4], data[index * 4 + 1], data[index * 4 + 2]]
      .map(channel => channel.toString(16).padStart(2, '0')).join('')}`
    if (color in exactFeaturePixels) exactFeaturePixels[color] += 1
  }
  return { exactFeaturePixels, internalMagentaPixels }
}

const textSvg = (width, height, lines) => Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style>text{font-family:Inter,Arial,sans-serif;fill:#201d19}</style>
    ${lines.map(line => `<text x="${line.x}" y="${line.y}" font-size="${line.size}" font-weight="${line.weight ?? 500}" text-anchor="${line.anchor ?? 'start'}">${line.text}</text>`).join('')}
  </svg>
`)

const createFixtureSheet = async (captures, outputPath, title, diff = false) => {
  const width = 1490
  const height = 610
  const tile = 130
  const leftStart = 25
  const topStart = 72
  const columnStride = 144
  const rowStride = 174
  const composites = []
  const labels = [{ x: 24, y: 36, size: 24, weight: 800, text: title }]
  for (let row = 0; row < pitchValues.length; row += 1) {
    for (let column = 0; column < yawValues.length; column += 1) {
      const capture = captures.find(candidate => candidate.yaw === yawValues[column] && candidate.pitch === pitchValues[row])
      const left = leftStart + column * columnStride
      const top = topStart + row * rowStride
      composites.push({
        input: await sharp(diff ? capture.diffFile : capture.file).resize(tile, tile).png().toBuffer(),
        left,
        top
      })
      labels.push({
        x: left + tile / 2,
        y: top + tile + 16,
        size: 10,
        anchor: 'middle',
        text: `yaw ${yawValues[column]}° · pitch ${pitchValues[row]}°`
      })
    }
  }
  composites.push({ input: textSvg(width, height, labels), left: 0, top: 0 })
  await sharp({ create: { width, height, channels: 4, background: '#f5f2ec' } })
    .composite(composites)
    .png()
    .toFile(outputPath)
}

const comparePng = async (leftPath, rightPath, diffPath) => {
  const left = await sharp(leftPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const right = await sharp(rightPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (left.info.width !== right.info.width || left.info.height !== right.info.height) {
    throw new Error(`Mismatched capture sizes: ${leftPath} / ${rightPath}`)
  }
  const diff = Buffer.alloc(left.data.length)
  let maxChannelDelta = 0
  let mismatchPixels = 0
  let totalAbsoluteDelta = 0
  for (let pixel = 0; pixel < left.info.width * left.info.height; pixel += 1) {
    let pixelDelta = 0
    for (let channel = 0; channel < 4; channel += 1) {
      const index = pixel * 4 + channel
      const delta = Math.abs(left.data[index] - right.data[index])
      maxChannelDelta = Math.max(maxChannelDelta, delta)
      totalAbsoluteDelta += delta
      pixelDelta = Math.max(pixelDelta, delta)
    }
    if (pixelDelta > 0) mismatchPixels += 1
    diff[pixel * 4] = pixelDelta
    diff[pixel * 4 + 1] = pixelDelta
    diff[pixel * 4 + 2] = pixelDelta
    diff[pixel * 4 + 3] = 255
  }
  await sharp(diff, { raw: { channels: 4, height: left.info.height, width: left.info.width } }).png().toFile(diffPath)
  return {
    maxChannelDelta,
    mismatchPixels,
    mismatchRatio: mismatchPixels / (left.info.width * left.info.height),
    totalAbsoluteDelta
  }
}

await mkdir(OUTPUT, { recursive: true })
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})
const capturesByKey = new Map()
for (const quality of qualities) {
  for (const fixture of fixtures) {
    for (const engine of engines) {
      const directory = path.join(OUTPUT, 'captures', quality.id, fixture, engine)
      await mkdir(directory, { recursive: true })
      const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { height: 420, width: 420 } })
      await page.goto(`${BASE_URL}?capture=1&fixture=${fixture}&engine=${engine}${quality.query}`, { waitUntil: 'networkidle' })
      const stage = page.locator(`[data-compiled-svg-stage="${fixture}"]`)
      await stage.waitFor()
      const captures = []
      for (const pitch of pitchValues) {
        for (const yaw of yawValues) {
          await page.evaluate(({ pitch, yaw }) => window.__compiledSvgLab?.setPose({
            pitch: pitch * Math.PI / 180,
            roll: 0,
            yaw: yaw * Math.PI / 180
          }), { pitch, yaw })
          await page.waitForTimeout(34)
          const file = path.join(directory, `yaw-${yaw}-pitch-${pitch}.png`)
          await stage.screenshot({ path: file })
          captures.push({
            analysis: await analyzeCapture(file, fixture),
            file,
            metrics: await page.evaluate(() => window.__compiledSvgLab?.getMetrics() ?? null),
            pitch,
            sha256: await sha256(file),
            yaw
          })
        }
      }
      capturesByKey.set(`${quality.id}:${fixture}:${engine}`, captures)
      await page.close()
    }
  }
}
await browser.close()

const comparisons = {}
const sheets = {}
for (const quality of qualities) {
  for (const fixture of fixtures) {
    const baseline = capturesByKey.get(`${quality.id}:${fixture}:baseline`)
    const optimized = capturesByKey.get(`${quality.id}:${fixture}:optimized`)
    const paired = []
    for (let index = 0; index < baseline.length; index += 1) {
      const before = baseline[index]
      const after = optimized[index]
      const diffFile = path.join(OUTPUT, 'captures', quality.id, fixture, `diff-yaw-${before.yaw}-pitch-${before.pitch}.png`)
      const stats = await comparePng(before.file, after.file, diffFile)
      paired.push({ ...stats, diffFile, pitch: before.pitch, yaw: before.yaw })
    }
    comparisons[`${quality.id}:${fixture}`] = paired
    for (const engine of engines) {
      const outputPath = path.join(OUTPUT, `contact-sheet-${fixture}-${quality.id}-${engine}.png`)
      await createFixtureSheet(
        capturesByKey.get(`${quality.id}:${fixture}:${engine}`),
        outputPath,
        `${fixture.toUpperCase()} · ${quality.id} · ${engine.toUpperCase()}`
      )
      sheets[`${quality.id}:${fixture}:${engine}`] = outputPath
    }
    const diffSheet = path.join(OUTPUT, `contact-sheet-${fixture}-${quality.id}-diff.png`)
    await createFixtureSheet(paired, diffSheet, `${fixture.toUpperCase()} · ${quality.id} · PIXEL DIFF`, true)
    sheets[`${quality.id}:${fixture}:diff`] = diffSheet
  }
}

const overview = path.join(OUTPUT, 'overview-baseline-optimized-diff.png')
const overviewRows = [
  sheets['interactive:bird:baseline'], sheets['interactive:bird:optimized'], sheets['interactive:bird:diff'],
  sheets['interactive:cat:baseline'], sheets['interactive:cat:optimized'], sheets['interactive:cat:diff'],
  sheets['export32:bird:baseline'], sheets['export32:bird:optimized'], sheets['export32:bird:diff'],
  sheets['export32:cat:baseline'], sheets['export32:cat:optimized'], sheets['export32:cat:diff']
]
await sharp({ create: { width: 1490, height: 610 * overviewRows.length, channels: 4, background: '#f5f2ec' } })
  .composite(overviewRows.map((input, index) => ({ input, left: 0, top: index * 610 })))
  .png()
  .toFile(overview)

const lowHighComparisons = {}
for (const fixture of fixtures) {
  const low = capturesByKey.get(`interactive:${fixture}:optimized`)
  const high = capturesByKey.get(`export32:${fixture}:optimized`)
  lowHighComparisons[fixture] = []
  for (let index = 0; index < low.length; index += 1) {
    const diffFile = path.join(OUTPUT, 'captures', `quality-diff-${fixture}-yaw-${low[index].yaw}-pitch-${low[index].pitch}.png`)
    lowHighComparisons[fixture].push({
      ...(await comparePng(low[index].file, high[index].file, diffFile)),
      diffFile,
      pitch: low[index].pitch,
      yaw: low[index].yaw
    })
  }
}

const outputFiles = [...Object.values(sheets), overview]
const manifestPath = path.join(OUTPUT, 'manifest-optimization.json')
const manifest = {
  captures: Object.fromEntries(capturesByKey),
  comparisons,
  fixedProtocol: {
    devicePixelRatio: 1,
    engines,
    export: { compileResolution: 32, projectorRaster: [840, 840] },
    interactive: { compileResolution: { bird: 24, cat: 24 }, projectorRaster: [280, 280] },
    pitchValues,
    stage: [420, 420],
    yawValues
  },
  generatedAt: new Date().toISOString(),
  lowHighComparisons,
  outputHashes: Object.fromEntries(await Promise.all(outputFiles.map(async file => [file, await sha256(file)]))),
  overview,
  sheets,
  sourceHashes: {
    baseline: await sha256(path.join(ROOT, 'src/compiledAvatarMesh.ts')),
    component: await sha256(path.join(ROOT, 'src/CompiledSvgLab.tsx')),
    optimized: await sha256(path.join(ROOT, 'src/compiledAvatarMeshOptimized.ts'))
  }
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ manifestPath, overview, sheets }, null, 2))
