import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import sharp from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs'

const ROOT = process.cwd()
const OUTPUT = path.join(ROOT, 'artifacts/continuous-contour-stage-2026-08-26')
const BEFORE = path.join(ROOT, 'artifacts/two-sphere-renderer-baseline-2026-08-26')
const AFTER_DIRECTIONS = path.join(OUTPUT, 'two-sphere-after')
const DIFF_DIRECTIONS = path.join(OUTPUT, 'two-sphere-diff')
const LAB_URL = process.env.COMPILED_SVG_LAB_URL ?? 'http://127.0.0.1:5194/compiled-svg-lab.html'
const APP_URL = process.env.AVATAR_APP_URL ?? 'http://127.0.0.1:5194/avatar/'
const STAGE_SIZE = 420
const directions = [-1, 0, 1].flatMap(z =>
  [1, 0, -1].flatMap(y =>
    [-1, 0, 1].flatMap(x => x === 0 && y === 0 && z === 0 ? [] : [{ x, y, z }])
  )
)
const sourceFiles = [
  'src/InteractiveAvatar.tsx',
  'src/avatarCompiledRenderer.ts',
  'src/compiledAvatarMesh.ts',
  'src/compiledAvatarMeshOptimized.ts'
]

const idForDirection = ({ x, y, z }) => (
  `dir-x${x < 0 ? 'm' : x > 0 ? 'p' : ''}${Math.abs(x)}`
  + `-y${y < 0 ? 'm' : y > 0 ? 'p' : ''}${Math.abs(y)}`
  + `-z${z < 0 ? 'm' : z > 0 ? 'p' : ''}${Math.abs(z)}`
)
const poseForDirection = ({ x, y, z }) => {
  const length = Math.hypot(x, y, z) || 1
  return { pitch: -Math.asin(y / length), yaw: Math.atan2(x / length, z / length) }
}
const sha256 = async file => createHash('sha256').update(await readFile(file)).digest('hex')
const percentile = (values, ratio) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))]
}
const escapeXml = value => String(value).replace(/[<>&'\"]/g, character => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
})[character])
const textSvg = (width, height, lines) => Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style>text{font-family:Inter,Arial,sans-serif;fill:#201d19}</style>
    ${lines.map(line => `<text x="${line.x}" y="${line.y}" font-size="${line.size}" font-weight="${line.weight ?? 500}" text-anchor="${line.anchor ?? 'start'}">${escapeXml(line.text)}</text>`).join('')}
  </svg>
`)
const landscape = async (title, resolveSource, output) => {
  const width = 1490
  const height = 598
  const tile = 144
  const sectionLeft = [18, 511, 1004]
  const gridTop = 76
  const composites = []
  const labels = [{ x: 18, y: 34, size: 24, weight: 800, text: title }]
  for (let section = 0; section < 3; section += 1) {
    const z = [1, 0, -1][section]
    labels.push({ x: sectionLeft[section], y: 62, size: 14, weight: 700, text: ['FRONT', 'MIDDLE', 'BACK'][section] })
    for (let row = 0; row < 3; row += 1) {
      const y = [1, 0, -1][row]
      for (let column = 0; column < 3; column += 1) {
        const x = [-1, 0, 1][column]
        const left = sectionLeft[section] + column * 152
        const top = gridTop + row * 166
        if (x === 0 && y === 0 && z === 0) {
          composites.push({
            input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144"><rect width="144" height="144" rx="10" fill="#e5dfd5"/><text x="72" y="72" text-anchor="middle" font-family="Arial" font-size="14" fill="#82786d">excluded</text></svg>`),
            left,
            top
          })
        } else {
          composites.push({ input: await sharp(resolveSource({ x, y, z })).resize(tile, tile).png().toBuffer(), left, top })
        }
        labels.push({ x: left + 72, y: top + 160, size: 10, anchor: 'middle', text: `${x},${y},${z}` })
      }
    }
  }
  composites.push({ input: textSvg(width, height, labels), left: 0, top: 0 })
  await sharp({ create: { width, height, channels: 4, background: '#f5f2ec' } })
    .composite(composites)
    .png()
    .toFile(output)
}
const diffImage = async (before, after, output, width = STAGE_SIZE, height = STAGE_SIZE) => {
  const left = await sharp(before).resize(width, height).removeAlpha().raw().toBuffer()
  const right = await sharp(after).resize(width, height).removeAlpha().raw().toBuffer()
  const diff = Buffer.alloc(left.length)
  for (let index = 0; index < left.length; index += 1) diff[index] = Math.abs(left[index] - right[index])
  await sharp(diff, { raw: { channels: 3, height, width } }).png().toFile(output)
}
const twoSpherePixelStats = async file => {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const pixels = info.width * info.height
  const magenta = new Uint8Array(pixels)
  const exterior = new Uint8Array(pixels)
  for (let index = 0; index < pixels; index += 1) {
    const offset = index * 3
    magenta[index] = data[offset] > 250 && data[offset + 1] < 5 && data[offset + 2] > 250 ? 1 : 0
  }
  const queue = []
  const enqueue = index => {
    if (magenta[index] === 0 || exterior[index] === 1) return
    exterior[index] = 1
    queue.push(index)
  }
  for (let x = 0; x < info.width; x += 1) {
    enqueue(x)
    enqueue((info.height - 1) * info.width + x)
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueue(y * info.width)
    enqueue(y * info.width + info.width - 1)
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor]
    const x = index % info.width
    const y = Math.floor(index / info.width)
    if (x > 0) enqueue(index - 1)
    if (x + 1 < info.width) enqueue(index + 1)
    if (y > 0) enqueue(index - info.width)
    if (y + 1 < info.height) enqueue(index + info.width)
  }
  let internalMagenta = 0
  let sharedBoundaryBackgroundMix = 0
  for (let y = 2; y < info.height - 2; y += 1) {
    for (let x = 2; x < info.width - 2; x += 1) {
      const index = y * info.width + x
      if (magenta[index] === 1 && exterior[index] === 0) internalMagenta += 1
      let hasBlack = false
      let hasWhite = false
      for (let oy = -2; oy <= 2; oy += 1) {
        for (let ox = -2; ox <= 2; ox += 1) {
          const neighbor = ((y + oy) * info.width + x + ox) * 3
          const value = (data[neighbor] + data[neighbor + 1] + data[neighbor + 2]) / 3
          hasBlack ||= value < 16
          hasWhite ||= value > 239 && Math.max(data[neighbor], data[neighbor + 1], data[neighbor + 2]) - Math.min(data[neighbor], data[neighbor + 1], data[neighbor + 2]) < 8
        }
      }
      if (!hasBlack || !hasWhite) continue
      const offset = index * 3
      const spread = Math.max(data[offset], data[offset + 1], data[offset + 2]) - Math.min(data[offset], data[offset + 1], data[offset + 2])
      if (spread > 18) sharedBoundaryBackgroundMix += 1
    }
  }
  return { internalMagenta, sharedBoundaryBackgroundMix }
}

await mkdir(AFTER_DIRECTIONS, { recursive: true })
await mkdir(DIFF_DIRECTIONS, { recursive: true })
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
let page = await browser.newPage({ colorScheme: 'light', deviceScaleFactor: 1, viewport: { height: 720, width: 1280 } })
const captures = []
for (const direction of directions) {
  const id = idForDirection(direction)
  const pose = poseForDirection(direction)
  const after = path.join(AFTER_DIRECTIONS, `${id}.png`)
  const before = path.join(BEFORE, `${id}.png`)
  const diff = path.join(DIFF_DIRECTIONS, `${id}.png`)
  await page.goto(`${LAB_URL}?capture=1&fixture=two-sphere&engine=optimized&yaw=${pose.yaw}&pitch=${pose.pitch}`, { waitUntil: 'networkidle' })
  const stage = page.locator('[data-compiled-svg-stage="two-sphere"]')
  await stage.waitFor()
  await stage.screenshot({ path: after })
  await diffImage(before, after, diff)
  captures.push({
    after,
    before,
    contourSegments: Number(await page.locator('main').getAttribute('data-contour-segments')),
    crispEdges: await stage.locator('[shape-rendering="crispEdges"]').count(),
    diff,
    direction,
    id,
    pathCharacters: await stage.locator('path').evaluateAll(nodes => nodes.reduce((total, node) => total + (node.getAttribute('d')?.length ?? 0), 0)),
    pathCount: await stage.locator('path').count(),
    pixelStats: await twoSpherePixelStats(after),
    pose,
    projectMs: Number(await page.locator('main').getAttribute('data-project-ms'))
  })
}

const beforeSheet = path.join(OUTPUT, 'two-sphere-before-landscape.png')
const afterSheet = path.join(OUTPUT, 'two-sphere-after-landscape.png')
const diffSheet = path.join(OUTPUT, 'two-sphere-diff-landscape.png')
await landscape('Avatar BEFORE · pixel-run owner masks', direction => path.join(BEFORE, `${idForDirection(direction)}.png`), beforeSheet)
await landscape('Avatar AFTER · shared continuous owner contour', direction => path.join(AFTER_DIRECTIONS, `${idForDirection(direction)}.png`), afterSheet)
await landscape('Absolute pixel diff · BEFORE vs AFTER', direction => path.join(DIFF_DIRECTIONS, `${idForDirection(direction)}.png`), diffSheet)

const beaverUrl = `${APP_URL}?entity=beaver&breed=north-american-beaver&seed=v1-0auditfixed000000000&mode=rotate&yaw=-0.2394&pitch=-0.1095&roll=0&positionX=15.8916&positionY=-2.1656&scale=1.4512&camera=1&cameraBg=%23ff00ff&outline=0#/editor`
await page.close()
page = await browser.newPage({ colorScheme: 'light', deviceScaleFactor: 1, viewport: { height: 720, width: 1280 } })
await page.goto(beaverUrl, { waitUntil: 'networkidle' })
const cameraFrame = page.locator('#avatar-camera-frame')
await cameraFrame.waitFor()
await page.locator('#avatar-camera-frame [data-avatar-fragment-composition="compiled-owner-partition"]').waitFor()
await page.waitForTimeout(800)
const beaverAfterFull = path.join(OUTPUT, 'beaver-after-failure-angle.png')
const beaverAfterStage = path.join(OUTPUT, 'beaver-after-failure-angle-stage.png')
await page.screenshot({ path: beaverAfterFull })
await cameraFrame.screenshot({ path: beaverAfterStage })
const beforeFull = path.join(ROOT, 'artifacts/beaver-shared-owner-stage1/before-failure-angle.png')
const beaverFullDiff = path.join(OUTPUT, 'beaver-failure-angle-diff.png')
await diffImage(beforeFull, beaverAfterFull, beaverFullDiff, 1280, 720)
const beaverComparison = path.join(OUTPUT, 'beaver-before-after-diff.png')
const beaverTiles = await Promise.all([beforeFull, beaverAfterFull, beaverFullDiff].map(file => (
  sharp(file).resize(620, 349).png().toBuffer()
)))
await sharp({ create: { width: 1900, height: 410, channels: 4, background: '#f5f2ec' } })
  .composite([
    ...beaverTiles.map((input, index) => ({ input, left: 10 + index * 630, top: 48 })),
    { input: textSvg(1900, 410, [
      { x: 10, y: 32, size: 22, weight: 800, text: 'BEFORE' },
      { x: 640, y: 32, size: 22, weight: 800, text: 'AFTER · continuous owner contour' },
      { x: 1270, y: 32, size: 22, weight: 800, text: 'ABSOLUTE DIFF' }
    ]), left: 0, top: 0 }
  ])
  .png()
  .toFile(beaverComparison)
const beaverDom = await cameraFrame.evaluate(frame => {
  const root = frame.querySelector('[data-avatar-entity-fragment-root]')
  const bases = [...frame.querySelectorAll('[data-avatar-compiled-base]')]
  return {
    basePathCount: bases.length,
    contourSegments: Number(root?.getAttribute('data-avatar-fragment-contour-segments') ?? 0),
    crispEdges: frame.querySelectorAll('[shape-rendering="crispEdges"]').length,
    nullOwnerPixels: Number(root?.getAttribute('data-avatar-fragment-null-owner-pixels') ?? -1),
    outerPartClips: [...frame.querySelectorAll('[data-avatar-entity-part]')].filter(node => node.hasAttribute('clip-path')).length,
    pathCharacters: Number(root?.getAttribute('data-avatar-fragment-path-characters') ?? 0),
    pixelRunPaths: bases.filter(node => /[hv]/i.test(node.getAttribute('d') ?? '')).length,
    surfaceOwnerClips: frame.querySelectorAll('[data-avatar-compiled-surface-layer][clip-path]').length
  }
})

await page.evaluate(() => {
  window.__continuousContourRaf = []
  window.__continuousContourRunning = true
  let previous = performance.now()
  const step = now => {
    if (!window.__continuousContourRunning) return
    window.__continuousContourRaf.push(now - previous)
    previous = now
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
})
const box = await cameraFrame.boundingBox()
const start = { x: box.x + box.width * .58, y: box.y + box.height * .52 }
const end = { x: box.x + box.width * .32, y: box.y + box.height * .46 }
const dragSamples = []
await page.mouse.move(start.x, start.y)
await page.mouse.down()
for (let step = 1; step <= 66; step += 1) {
  await page.mouse.move(start.x + (end.x - start.x) * step / 66, start.y + (end.y - start.y) * step / 66)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))
  dragSamples.push(await cameraFrame.evaluate(frame => {
    const root = frame.querySelector('[data-avatar-entity-fragment-root]')
    const bases = [...frame.querySelectorAll('[data-avatar-compiled-base]')]
    const hash = bases.reduce((value, node) => {
      const path = node.getAttribute('d') ?? ''
      for (let index = 0; index < path.length; index += 1) value = Math.imul(value ^ path.charCodeAt(index), 16777619) >>> 0
      return value
    }, 2166136261)
    return {
      buildMs: Number(root?.getAttribute('data-avatar-fragment-build-ms') ?? 0),
      hash,
      nullOwners: Number(root?.getAttribute('data-avatar-fragment-null-owner-pixels') ?? -1),
      quality: root?.getAttribute('data-avatar-fragment-quality'),
      revision: root?.getAttribute('data-avatar-fragment-revision')
    }
  }))
}
const beforeRelease = dragSamples.at(-1)
await page.mouse.up()
const release = []
for (const delay of [0, 50, 200, 800]) {
  if (delay > 0) await page.waitForTimeout(delay - (release.at(-1)?.delay ?? 0))
  release.push({
    delay,
    ...(await cameraFrame.evaluate(frame => {
      const root = frame.querySelector('[data-avatar-entity-fragment-root]')
      const bases = [...frame.querySelectorAll('[data-avatar-compiled-base]')]
      const hash = bases.reduce((value, node) => {
        const path = node.getAttribute('d') ?? ''
        for (let index = 0; index < path.length; index += 1) value = Math.imul(value ^ path.charCodeAt(index), 16777619) >>> 0
        return value
      }, 2166136261)
      return {
        buildMs: Number(root?.getAttribute('data-avatar-fragment-build-ms') ?? 0),
        hash,
        nullOwners: Number(root?.getAttribute('data-avatar-fragment-null-owner-pixels') ?? -1),
        quality: root?.getAttribute('data-avatar-fragment-quality'),
        revision: root?.getAttribute('data-avatar-fragment-revision')
      }
    }))
  })
}
const raf = await page.evaluate(() => {
  window.__continuousContourRunning = false
  return window.__continuousContourRaf
})
const performance = {
  dragBuildMaxMs: Math.max(...dragSamples.map(sample => sample.buildMs)),
  dragBuildP50Ms: percentile(dragSamples.map(sample => sample.buildMs), .5),
  dragBuildP95Ms: percentile(dragSamples.map(sample => sample.buildMs), .95),
  longRafFrames: raf.filter(value => value > 50).length,
  nullOwnerFrames: dragSamples.filter(sample => sample.nullOwners !== 0).length,
  rafMaxMs: Math.max(...raf),
  rafP50Ms: percentile(raf, .5),
  rafP95Ms: percentile(raf, .95),
  release,
  releaseBoundaryStable: release.every(sample => sample.hash === beforeRelease.hash),
  uniqueDragRevisions: new Set(dragSamples.map(sample => sample.revision)).size
}

await browser.close()
const sourceSha256 = Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, await sha256(path.join(ROOT, file))])))
const manifest = {
  afterSheet,
  beforeSheet,
  beaver: {
    afterFull: beaverAfterFull,
    afterStage: beaverAfterStage,
    beforeFull,
    comparison: beaverComparison,
    diff: beaverFullDiff,
    dom: beaverDom,
    performance,
    url: beaverUrl
  },
  captures: await Promise.all(captures.map(async capture => ({
    ...capture,
    after: path.relative(OUTPUT, capture.after),
    afterSha256: await sha256(capture.after),
    before: path.relative(OUTPUT, capture.before),
    beforeSha256: await sha256(capture.before),
    diff: path.relative(OUTPUT, capture.diff),
    diffSha256: await sha256(capture.diff)
  }))),
  diffSheet,
  fixedParameters: {
    background: '#ff00ff',
    blackCenter: [-34, 0, -10],
    dpr: 1,
    orthographicStage: [420, 420],
    sphereRadius: 72,
    whiteCenter: [34, 0, 10]
  },
  sourceFingerprint: createHash('sha256').update(JSON.stringify(sourceSha256)).digest('hex'),
  sourceSha256,
  status: 'CONTINUOUS_CONTOUR_STAGE_CANDIDATE'
}
await writeFile(path.join(OUTPUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ manifest: path.join(OUTPUT, 'manifest.json'), ...manifest }, null, 2))
