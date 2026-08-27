import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import sharp from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs'

const ROOT = process.cwd()
const OUTPUT = path.join(ROOT, 'artifacts/compiled-svg-prototype-2026-08-26')
const COMPILED_DIRECTIONS = path.join(OUTPUT, 'compiled-svg-directions')
const ATTACHMENT_DIRECTIONS = path.join(OUTPUT, 'attachment-directions')
const BIRD_DIRECTIONS = path.join(OUTPUT, 'bird-directions')
const CAT_DIRECTIONS = path.join(OUTPUT, 'cat-directions')
const OLD_DIRECTIONS = path.join(ROOT, 'artifacts/two-sphere-renderer-baseline-2026-08-26')
const THREE_DIRECTIONS = '/Users/yijie/Documents/Codex/2026-08-26/threejs-two-sphere-intersection/outputs/threejs-sphere-intersection/captures-frustum-210/directions'
const BASE_URL = process.env.COMPILED_SVG_LAB_URL ?? 'http://127.0.0.1:5194/compiled-svg-lab.html'
const STAGE_SIZE = 420
const attachmentYawValues = [-90, -85, -60, -30, 0, 30, 60, 85, 90, 180]
const attachmentPitchValues = [-30, 0, 30]
const directions = [-1, 0, 1].flatMap(z =>
  [1, 0, -1].flatMap(y =>
    [-1, 0, 1].flatMap(x => x === 0 && y === 0 && z === 0 ? [] : [{ x, y, z }])
  )
)

const idForDirection = ({ x, y, z }) => (
  `dir-x${x < 0 ? 'm' : x > 0 ? 'p' : ''}${Math.abs(x)}`
  + `-y${y < 0 ? 'm' : y > 0 ? 'p' : ''}${Math.abs(y)}`
  + `-z${z < 0 ? 'm' : z > 0 ? 'p' : ''}${Math.abs(z)}`
)

const poseForDirection = ({ x, y, z }) => {
  const length = Math.hypot(x, y, z) || 1
  return { pitch: -Math.asin(y / length), yaw: Math.atan2(x / length, z / length) }
}

const threeName = ({ x, y, z }) => {
  const depth = z > 0 ? 'front' : z < 0 ? 'back' : 'middle'
  const horizontal = x < 0 ? 'left' : x > 0 ? 'right' : 'center'
  const vertical = y > 0 ? 'up' : y < 0 ? 'down' : 'center'
  return `${depth}-${horizontal}-${vertical}.png`
}

const sha256 = async filePath => createHash('sha256').update(await readFile(filePath)).digest('hex')

const pixelStats = async (filePath, palette) => {
  const { data, info } = await sharp(filePath).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const background = [255, 0, 255]
  const colors = [background, ...palette]
  const colorAt = index => [data[index * 3], data[index * 3 + 1], data[index * 3 + 2]]
  const distanceToSegment = (point, start, end) => {
    const direction = end.map((value, index) => value - start[index])
    const relative = point.map((value, index) => value - start[index])
    const denominator = direction.reduce((total, value) => total + value * value, 0) || 1
    const progress = Math.max(0, Math.min(1, relative.reduce((total, value, index) => total + value * direction[index], 0) / denominator))
    return Math.hypot(...point.map((value, index) => value - (start[index] + direction[index] * progress)))
  }
  const isBackground = point => Math.hypot(point[0] - 255, point[1], point[2] - 255) < 4
  const backgroundMask = new Uint8Array(info.width * info.height)
  const exteriorBackground = new Uint8Array(info.width * info.height)
  for (let index = 0; index < backgroundMask.length; index += 1) {
    backgroundMask[index] = isBackground(colorAt(index)) ? 1 : 0
  }
  const queue = []
  const enqueueExterior = index => {
    if (backgroundMask[index] === 0 || exteriorBackground[index] === 1) return
    exteriorBackground[index] = 1
    queue.push(index)
  }
  for (let x = 0; x < info.width; x += 1) {
    enqueueExterior(x)
    enqueueExterior((info.height - 1) * info.width + x)
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueueExterior(y * info.width)
    enqueueExterior(y * info.width + info.width - 1)
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor]
    const x = index % info.width
    const y = Math.floor(index / info.width)
    if (x > 0) enqueueExterior(index - 1)
    if (x + 1 < info.width) enqueueExterior(index + 1)
    if (y > 0) enqueueExterior(index - info.width)
    if (y + 1 < info.height) enqueueExterior(index + info.width)
    if (x > 0 && y > 0) enqueueExterior(index - info.width - 1)
    if (x + 1 < info.width && y > 0) enqueueExterior(index - info.width + 1)
    if (x > 0 && y + 1 < info.height) enqueueExterior(index + info.width - 1)
    if (x + 1 < info.width && y + 1 < info.height) enqueueExterior(index + info.width + 1)
  }
  let internalBackgroundCandidates = 0
  let thirdColorHardPixels = 0
  let coloredPixels = 0
  const palettePixelCounts = new Array(palette.length).fill(0)
  for (let y = 2; y < info.height - 2; y += 1) {
    for (let x = 2; x < info.width - 2; x += 1) {
      const index = y * info.width + x
      const point = colorAt(index)
      if (!isBackground(point)) coloredPixels += 1
      palette.forEach((color, paletteIndex) => {
        if (Math.hypot(...point.map((value, channel) => value - color[channel])) < 4) {
          palettePixelCounts[paletteIndex] += 1
        }
      })
      if (backgroundMask[index] === 1 && exteriorBackground[index] === 0) internalBackgroundCandidates += 1
      let distance = Number.POSITIVE_INFINITY
      for (let left = 0; left < colors.length; left += 1) {
        for (let right = left; right < colors.length; right += 1) {
          distance = Math.min(distance, distanceToSegment(point, colors[left], colors[right]))
        }
      }
      if (distance > 12) thirdColorHardPixels += 1
    }
  }
  return { coloredPixels, internalBackgroundCandidates, palettePixelCounts, thirdColorHardPixels }
}

const foregroundBounds = async filePath => {
  const { data, info } = await sharp(filePath).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * 3
      if (Math.hypot(data[index] - 255, data[index + 1], data[index + 2] - 255) < 4) continue
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  return { maxX, maxY, minX, minY }
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

const createLandscapeSheet = async ({ title, resolveSource, outputPath }) => {
  const width = 1490
  const height = 598
  const tile = 144
  const sectionLeft = [18, 511, 1004]
  const gridTop = 76
  const columnGap = 8
  const rowStride = 166
  const composites = []
  const labels = [{ x: 18, y: 34, size: 24, weight: 800, text: title }]
  for (let sectionIndex = 0; sectionIndex < 3; sectionIndex += 1) {
    const z = [1, 0, -1][sectionIndex]
    labels.push({ x: sectionLeft[sectionIndex], y: 62, size: 14, weight: 700, text: ['FRONT', 'MIDDLE', 'BACK'][sectionIndex] })
    for (let row = 0; row < 3; row += 1) {
      const y = [1, 0, -1][row]
      for (let column = 0; column < 3; column += 1) {
        const x = [-1, 0, 1][column]
        const left = sectionLeft[sectionIndex] + column * (tile + columnGap)
        const top = gridTop + row * rowStride
        if (x === 0 && y === 0 && z === 0) {
          const placeholder = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}"><rect width="100%" height="100%" rx="10" fill="#e5dfd5"/><text x="72" y="70" text-anchor="middle" font-family="Arial" font-size="14" fill="#82786d">excluded</text><text x="72" y="91" text-anchor="middle" font-family="Arial" font-size="12" fill="#a0988f">0, 0, 0</text></svg>`)
          composites.push({ input: placeholder, left, top })
        } else {
          const source = resolveSource({ x, y, z })
          const input = await sharp(source).resize(tile, tile, { fit: 'fill' }).png().toBuffer()
          composites.push({ input, left, top })
        }
        labels.push({ x: left + tile / 2, y: top + tile + 16, size: 10, anchor: 'middle', text: `${x},${y},${z}` })
      }
    }
  }
  composites.push({ input: textSvg(width, height, labels), left: 0, top: 0 })
  await sharp({ create: { width, height, channels: 4, background: '#f5f2ec' } })
    .composite(composites)
    .png()
    .toFile(outputPath)
}

const createFixtureSheet = async (captures, outputPath, title) => {
  const width = 1490
  const height = 610
  const tile = 130
  const leftStart = 25
  const topStart = 72
  const columnStride = 144
  const rowStride = 174
  const composites = []
  const labels = [{ x: 24, y: 36, size: 24, weight: 800, text: title }]
  for (let row = 0; row < attachmentPitchValues.length; row += 1) {
    for (let column = 0; column < attachmentYawValues.length; column += 1) {
      const capture = captures.find(candidate => candidate.yaw === attachmentYawValues[column] && candidate.pitch === attachmentPitchValues[row])
      const left = leftStart + column * columnStride
      const top = topStart + row * rowStride
      composites.push({ input: await sharp(capture.file).resize(tile, tile).png().toBuffer(), left, top })
      labels.push({ x: left + tile / 2, y: top + tile + 16, size: 10, anchor: 'middle', text: `yaw ${attachmentYawValues[column]}° · pitch ${attachmentPitchValues[row]}°` })
    }
  }
  composites.push({ input: textSvg(width, height, labels), left: 0, top: 0 })
  await sharp({ create: { width, height, channels: 4, background: '#f5f2ec' } })
    .composite(composites)
    .png()
    .toFile(outputPath)
}

await mkdir(COMPILED_DIRECTIONS, { recursive: true })
await mkdir(ATTACHMENT_DIRECTIONS, { recursive: true })
await mkdir(BIRD_DIRECTIONS, { recursive: true })
await mkdir(CAT_DIRECTIONS, { recursive: true })
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})
const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { height: STAGE_SIZE, width: STAGE_SIZE } })
const compiledCaptures = []
for (const direction of directions) {
  const pose = poseForDirection(direction)
  const id = idForDirection(direction)
  const file = path.join(COMPILED_DIRECTIONS, `${id}.png`)
  const url = `${BASE_URL}?capture=1&fixture=two-sphere&yaw=${pose.yaw}&pitch=${pose.pitch}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('[data-compiled-svg-stage="two-sphere"]').waitFor()
  await page.screenshot({ path: file })
  compiledCaptures.push({ direction, file, id, pose, projectMs: Number(await page.locator('main').getAttribute('data-project-ms')) })
}

const captureFixture = async (fixture, directory) => {
  const captures = []
  for (const pitch of attachmentPitchValues) {
    for (const yaw of attachmentYawValues) {
      const file = path.join(directory, `yaw-${yaw}-pitch-${pitch}.png`)
      const url = `${BASE_URL}?capture=1&fixture=${fixture}&yaw=${yaw * Math.PI / 180}&pitch=${pitch * Math.PI / 180}`
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.locator(`[data-compiled-svg-stage="${fixture}"]`).waitFor()
      await page.screenshot({ path: file })
      captures.push({ file, pitch, yaw, projectMs: Number(await page.locator('main').getAttribute('data-project-ms')) })
    }
  }
  return captures
}
const attachmentCaptures = await captureFixture('attachment', ATTACHMENT_DIRECTIONS)
const birdCaptures = await captureFixture('bird', BIRD_DIRECTIONS)
const catCaptures = await captureFixture('cat', CAT_DIRECTIONS)

const attachmentBaselines = []
for (const yaw of [-90, -85, 85, 90]) {
  const file = path.join(ATTACHMENT_DIRECTIONS, `baseline-no-muzzle-yaw-${yaw}.png`)
  const url = `${BASE_URL}?capture=1&fixture=attachment&muzzle=0&yaw=${yaw * Math.PI / 180}&pitch=0`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('[data-compiled-svg-stage="attachment"]').waitFor()
  await page.screenshot({ path: file })
  attachmentBaselines.push({ file, yaw })
}

await page.close()
const captureDragPerformance = async fixture => {
  const performancePage = await browser.newPage({ deviceScaleFactor: 1, viewport: { height: 900, width: 1200 } })
  await performancePage.goto(`${BASE_URL}?fixture=${fixture}`, { waitUntil: 'networkidle' })
  const dragStage = performancePage.locator(`[data-compiled-svg-stage="${fixture}"]`)
  await dragStage.waitFor()
  const dragBox = await dragStage.boundingBox()
  if (dragBox == null) throw new Error(`Compiled SVG ${fixture} drag stage has no bounding box`)
  const dragStart = { x: dragBox.x + dragBox.width * .65, y: dragBox.y + dragBox.height * .5 }
  const dragEnd = { x: dragBox.x + dragBox.width * .28, y: dragBox.y + dragBox.height * .62 }
  const runDrag = async () => {
    await performancePage.mouse.move(dragStart.x, dragStart.y)
    await performancePage.mouse.down()
    for (let step = 1; step <= 66; step += 1) {
      const progress = step / 66
      await performancePage.mouse.move(
        dragStart.x + (dragEnd.x - dragStart.x) * progress,
        dragStart.y + (dragEnd.y - dragStart.y) * progress
      )
      await performancePage.waitForTimeout(17)
    }
    await performancePage.mouse.up()
  }
  await runDrag()
  await performancePage.evaluate(() => window.__compiledSvgLab?.setPose({ pitch: 0, roll: 0, yaw: 0 }))
  await performancePage.waitForTimeout(150)
  await runDrag()
  await performancePage.waitForTimeout(250)
  const metrics = await performancePage.evaluate(() => window.__compiledSvgLab?.getMetrics() ?? null)
  await performancePage.close()
  return metrics
}
const dragPerformance = {
  attachment: await captureDragPerformance('attachment'),
  bird: await captureDragPerformance('bird'),
  cat: await captureDragPerformance('cat')
}
await browser.close()

const sheets = {
  attachment: path.join(OUTPUT, 'contact-sheet-attachment-marking.png'),
  bird: path.join(OUTPUT, 'contact-sheet-pointed-bird-beak.png'),
  cat: path.join(OUTPUT, 'contact-sheet-cat-double-muzzle.png'),
  compiled: path.join(OUTPUT, 'contact-sheet-compiled-svg-landscape.png'),
  old: path.join(OUTPUT, 'contact-sheet-old-avatar-landscape.png'),
  three: path.join(OUTPUT, 'contact-sheet-threejs-landscape.png')
}
await createLandscapeSheet({
  outputPath: sheets.old,
  resolveSource: direction => path.join(OLD_DIRECTIONS, `${idForDirection(direction)}.png`),
  title: 'Avatar production SVG · BEFORE'
})
await createLandscapeSheet({
  outputPath: sheets.compiled,
  resolveSource: direction => path.join(COMPILED_DIRECTIONS, `${idForDirection(direction)}.png`),
  title: 'Compiled mesh → SVG prototype'
})
await createLandscapeSheet({
  outputPath: sheets.three,
  resolveSource: direction => path.join(THREE_DIRECTIONS, threeName(direction)),
  title: 'Three.js reference · same projection'
})
await createFixtureSheet(attachmentCaptures, sheets.attachment, 'Compiled SVG · double ears + smooth-union convex muzzle')
await createFixtureSheet(birdCaptures, sheets.bird, 'Compiled SVG · pointed 3D bird beak · hard-clipped root')
await createFixtureSheet(catCaptures, sheets.cat, 'Compiled SVG · cat double muzzle · pair-wise smooth union')

const fixtureOverview = path.join(OUTPUT, 'overview-bird-cat-fixtures.png')
await sharp({ create: { width: 1490, height: 610 * 2, channels: 4, background: '#f5f2ec' } })
  .composite([
    { input: sheets.bird, left: 0, top: 0 },
    { input: sheets.cat, left: 0, top: 610 }
  ])
  .png()
  .toFile(fixtureOverview)

const comparison = path.join(OUTPUT, 'comparison-landscape.png')
await sharp({ create: { width: 1490, height: 598 * 3, channels: 4, background: '#f5f2ec' } })
  .composite([
    { input: sheets.three, left: 0, top: 0 },
    { input: sheets.old, left: 0, top: 598 },
    { input: sheets.compiled, left: 0, top: 1196 }
  ])
  .png()
  .toFile(comparison)

const allOutputs = [
  ...compiledCaptures.map(capture => capture.file),
  ...attachmentCaptures.map(capture => capture.file),
  ...birdCaptures.map(capture => capture.file),
  ...catCaptures.map(capture => capture.file),
  ...attachmentBaselines.map(capture => capture.file),
  ...Object.values(sheets),
  fixtureOverview,
  comparison
]
const oldInputHashes = Object.fromEntries(await Promise.all(directions.map(async direction => {
  const id = idForDirection(direction)
  return [id, await sha256(path.join(OLD_DIRECTIONS, `${id}.png`))]
})))
const threeInputHashes = Object.fromEntries(await Promise.all(directions.map(async direction => [
  idForDirection(direction),
  await sha256(path.join(THREE_DIRECTIONS, threeName(direction)))
])))
const muzzleSilhouette = await Promise.all([-90, -85, 85, 90].map(async yaw => {
  const withMuzzle = attachmentCaptures.find(capture => capture.yaw === yaw && capture.pitch === 0)
  const withoutMuzzle = attachmentBaselines.find(capture => capture.yaw === yaw)
  const withBounds = await foregroundBounds(withMuzzle.file)
  const withoutBounds = await foregroundBounds(withoutMuzzle.file)
  return {
    forwardProtrusionPixels: yaw < 0
      ? withoutBounds.minX - withBounds.minX
      : withBounds.maxX - withoutBounds.maxX,
    withBounds,
    withoutBounds,
    yaw
  }
}))
const manifest = {
  attachmentBaselines: await Promise.all(attachmentBaselines.map(async capture => ({
    ...capture,
    bounds: await foregroundBounds(capture.file),
    file: path.relative(OUTPUT, capture.file),
    sha256: await sha256(capture.file)
  }))),
  attachmentCaptures: await Promise.all(attachmentCaptures.map(async capture => ({
    ...capture,
    bounds: await foregroundBounds(capture.file),
    file: path.relative(OUTPUT, capture.file),
    pixelStats: await pixelStats(capture.file, [[186, 118, 71], [155, 93, 54], [255, 226, 174], [21, 18, 15], [59, 36, 25]]),
    sha256: await sha256(capture.file)
  }))),
  birdCaptures: await Promise.all(birdCaptures.map(async capture => ({
    ...capture,
    bounds: await foregroundBounds(capture.file),
    file: path.relative(OUTPUT, capture.file),
    pixelStats: await pixelStats(capture.file, [[230, 179, 79], [223, 107, 45], [21, 18, 15], [113, 49, 24]]),
    sha256: await sha256(capture.file)
  }))),
  catCaptures: await Promise.all(catCaptures.map(async capture => ({
    ...capture,
    bounds: await foregroundBounds(capture.file),
    file: path.relative(OUTPUT, capture.file),
    pixelStats: await pixelStats(capture.file, [[184, 111, 72], [143, 82, 51], [246, 211, 164], [21, 18, 15], [74, 37, 28], [44, 27, 24]]),
    sha256: await sha256(capture.file)
  }))),
  compiledCaptures: await Promise.all(compiledCaptures.map(async capture => ({
    ...capture,
    file: path.relative(OUTPUT, capture.file),
    pixelStats: await pixelStats(capture.file, [[0, 0, 0], [255, 255, 255]]),
    sha256: await sha256(capture.file)
  }))),
  fixedParameters: {
    background: '#ff00ff',
    compiledRaster: 280,
    devicePixelRatio: 1,
    orthographicStage: [420, 420],
    sphereCenters: [[-34, 0, -10], [34, 0, 10]],
    sphereRadius: 72,
    attachmentMuzzle: {
      height: 58,
      protrusion: 18,
      smoothUnionRadius: 7,
      verticalPosition: 44,
      width: 96
    },
    birdBeak: {
      height: 30,
      length: 72,
      rootRule: 'hard boolean union; embedded cone root removed during compile',
      verticalPosition: 38,
      width: 48
    },
    catDoubleMuzzle: {
      height: [54, 54],
      protrusion: [17, 17],
      smoothUnionPairs: [['head', 'muzzle-left'], ['head', 'muzzle-right']],
      smoothUnionRadius: 6,
      spacing: 54,
      verticalPosition: 46,
      width: [68, 68]
    }
  },
  dragPerformance,
  generatedAt: new Date().toISOString(),
  inputs: {
    oldAvatarDirectory: OLD_DIRECTIONS,
    oldAvatarSha256ByDirection: oldInputHashes,
    threeJsDirectory: THREE_DIRECTIONS,
    threeJsSha256ByDirection: threeInputHashes
  },
  muzzleSilhouette,
  outputs: Object.fromEntries(await Promise.all(allOutputs.map(async file => [path.relative(OUTPUT, file), await sha256(file)]))),
  sheets: Object.fromEntries(Object.entries({ ...sheets, comparison, fixtureOverview }).map(([key, file]) => [key, path.relative(OUTPUT, file)]))
}
await writeFile(path.join(OUTPUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ output: OUTPUT, sheets: manifest.sheets }, null, 2))
