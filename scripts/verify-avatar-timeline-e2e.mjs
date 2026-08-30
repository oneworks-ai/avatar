import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { chromium } from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const viteEntry = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const port = Number(process.env.AVATAR_TIMELINE_E2E_PORT ?? 4187)
const externalBaseUrl = process.env.AVATAR_TIMELINE_E2E_BASE_URL
const baseUrl = externalBaseUrl ?? `http://127.0.0.1:${port}`
const timelineStorageKey = 'oneworks-avatar-animation-timeline-v1'
const chromeExecutablePath = process.env.AVATAR_TIMELINE_E2E_CHROME ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const presetClip = (instanceId, presetId, startMs, durationMs) => ({
  durationMs,
  instanceId,
  playbackRate: 1,
  source: {
    fallback: 'skip',
    presetId,
    presetVersion: 1,
    type: 'preset'
  },
  sourceOffsetMs: 0,
  startMs,
  weight: 1
})

const initialTimeline = {
  durationMs: 10_000,
  tracks: [
    {
      clips: [
        presetClip('clip-idle', 'idle', 0, 1000),
        presetClip('clip-nod', 'nod', 2000, 1000)
      ],
      name: 'Low track',
      trackId: 'track-low',
      weight: 1
    },
    {
      clips: [presetClip('clip-blink', 'blink', 0, 900)],
      name: 'Middle track',
      trackId: 'track-middle',
      weight: 1
    },
    {
      clips: [presetClip('clip-shocked', 'shocked', 0, 1000)],
      name: 'High track',
      trackId: 'track-high',
      weight: 1
    }
  ],
  version: 1
}

const waitForServer = async () => {
  const timeoutAt = Date.now() + 20_000
  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // The Vite process is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Timed out waiting for ${baseUrl}`)
}

const readTimeline = page => page.evaluate(storageKey => {
  const stored = window.localStorage.getItem(storageKey)
  return stored == null ? null : JSON.parse(stored)
}, timelineStorageKey)

const waitForTimeline = async (page, predicate, label) => {
  const timeoutAt = Date.now() + 5000
  let latest = null
  while (Date.now() < timeoutAt) {
    latest = await readTimeline(page)
    if (latest != null && predicate(latest)) return latest
    await page.waitForTimeout(25)
  }
  assert.fail(`${label}. Latest timeline: ${JSON.stringify(latest)}`)
}

const findClip = (timeline, instanceId) => {
  for (const track of timeline.tracks) {
    const clip = track.clips.find(candidate => candidate.instanceId === instanceId)
    if (clip != null) return { clip, track }
  }
  return null
}

const findPresetClip = (timeline, presetId) => {
  for (const track of timeline.tracks) {
    const clip = track.clips.find(candidate => (
      candidate.source.type === 'preset' && candidate.source.presetId === presetId
    ))
    if (clip != null) return { clip, track }
  }
  return null
}

const pressUndo = page => page.keyboard.press('Control+z')
const pressRedo = page => page.keyboard.press('Control+y')

const openExportMenu = async page => {
  const trigger = page.locator('.avatar-export-toolbar__trigger')
  if (!await trigger.isVisible()) {
    await page.locator('.avatar-controls__header-actions-toggle').click()
  }
  await trigger.click()
  await page.locator('.avatar-export-toolbar__menu').waitFor({ state: 'visible' })
}

const downloadExport = async (page, actionIndex, label, timeout = 30_000) => {
  await openExportMenu(page)
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout }),
    page.locator('.avatar-export-toolbar__menu-action').nth(actionIndex).click()
  ])
  const path = await download.path()
  assert(path != null, `${label} should create a real local download`)
  return {
    bytes: await readFile(path),
    filename: download.suggestedFilename()
  }
}

const dragPointer = async (page, source, target) => {
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  assert(sourceBox != null, 'Pointer-drag source must have layout bounds')
  assert(targetBox != null, 'Pointer-drag target must have layout bounds')
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x, targetBox.y, { steps: 12 })
  await page.mouse.up()
}

let server
let browser
const serverOutput = []

try {
  if (externalBaseUrl == null) {
    server = spawn(process.execPath, [
      viteEntry,
      '--host', '127.0.0.1',
      '--port', String(port),
      '--strictPort'
    ], {
      cwd: projectRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    server.stdout.on('data', chunk => serverOutput.push(chunk.toString()))
    server.stderr.on('data', chunk => serverOutput.push(chunk.toString()))
    server.once('exit', code => {
      if (code !== 0 && code != null) {
        process.stderr.write(serverOutput.join(''))
      }
    })
  }

  await waitForServer()
  browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: true })
  const context = await browser.newContext({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    viewport: { height: 900, width: 1440 }
  })
  await context.addInitScript(({ storageKey, timeline }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(timeline))
  }, { storageKey: timelineStorageKey, timeline: initialTimeline })
  const page = await context.newPage()
  page.setDefaultTimeout(5000)
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto(`${baseUrl}/?entity=bear&animationPanel=1&sidebar=1&seed=v1-timeline-e2e`, {
    waitUntil: 'networkidle'
  })
  await page.locator('.avatar-animation-panel').waitFor({ state: 'visible' })

  const loaded = await readTimeline(page)
  assert.equal(loaded.tracks.length, 3, 'App should restore all seeded Timeline tracks')

  await page.locator('#avatar-controls-left-tab-animation').click()
  const asset = page.locator('.avatar-animation-sidebar__asset[aria-label="Wink"]')
  const newTrackDrop = page.locator('.avatar-animation-panel__new-track')
  await asset.dragTo(newTrackDrop)
  const added = await waitForTimeline(
    page,
    timeline => timeline.tracks.length === 4 && findPresetClip(timeline, 'wink') != null,
    'Dragging an animation asset should add it on a new track'
  )
  const addedClipId = findPresetClip(added, 'wink').clip.instanceId

  await pressUndo(page)
  await waitForTimeline(
    page,
    timeline => timeline.tracks.length === 3 && findClip(timeline, addedClipId) == null,
    'Undo should remove the added clip and track'
  )
  await pressRedo(page)
  await waitForTimeline(
    page,
    timeline => timeline.tracks.length === 4 && findClip(timeline, addedClipId) != null,
    'Redo should restore the added clip and track'
  )

  const blinkArticle = page.locator('.avatar-animation-panel__clip[title="Blink"]')
  const clipLabels = await page.locator('.avatar-animation-panel__clip').evaluateAll(clips => (
    clips.map(clip => clip.getAttribute('title'))
  ))
  assert.equal(
    await blinkArticle.count(),
    1,
    `Expected one Blink clip before cross-track drag; rendered labels: ${JSON.stringify(clipLabels)}`
  )
  const highLane = page.locator('.avatar-animation-panel__lane[data-track-id="track-high"]')
  const highLaneBox = await highLane.boundingBox()
  assert(highLaneBox != null, 'High track lane must have layout bounds')
  await dragPointer(page, blinkArticle, {
    boundingBox: async () => ({
      height: 1,
      width: 1,
      x: highLaneBox.x + Math.min(380, highLaneBox.width - 40),
      y: highLaneBox.y + highLaneBox.height / 2
    })
  })
  const moved = await waitForTimeline(
    page,
    timeline => findClip(timeline, 'clip-blink')?.track.trackId === 'track-high',
    'Pointer dragging should move a clip across tracks'
  )
  const movedStartMs = findClip(moved, 'clip-blink').clip.startMs
  assert(movedStartMs > 0, 'Cross-track pointer drag should preserve the grabbed point at a later time')

  await pressUndo(page)
  await waitForTimeline(
    page,
    timeline => findClip(timeline, 'clip-blink')?.track.trackId === 'track-middle',
    'Undo should return a cross-track move to its source track'
  )
  await pressRedo(page)
  await waitForTimeline(
    page,
    timeline => findClip(timeline, 'clip-blink')?.track.trackId === 'track-high',
    'Redo should restore a cross-track move'
  )

  const beforeTrim = findClip(await readTimeline(page), 'clip-blink').clip.durationMs
  const trimEnd = blinkArticle.locator('.avatar-animation-panel__trim--end')
  const trimBox = await trimEnd.boundingBox()
  assert(trimBox != null, 'Trim handle must have layout bounds')
  await dragPointer(page, trimEnd, {
    boundingBox: async () => ({
      height: 1,
      width: 1,
      x: trimBox.x + trimBox.width / 2 + 56,
      y: trimBox.y + trimBox.height / 2
    })
  })
  const trimmed = await waitForTimeline(
    page,
    timeline => findClip(timeline, 'clip-blink')?.clip.durationMs > beforeTrim,
    'Pointer dragging the trim handle should extend the clip'
  )
  const trimmedDurationMs = findClip(trimmed, 'clip-blink').clip.durationMs

  await pressUndo(page)
  await waitForTimeline(
    page,
    timeline => findClip(timeline, 'clip-blink')?.clip.durationMs === beforeTrim,
    'Undo should restore the pre-trim duration'
  )
  await pressRedo(page)
  await waitForTimeline(
    page,
    timeline => findClip(timeline, 'clip-blink')?.clip.durationMs === trimmedDurationMs,
    'Redo should restore the trim duration'
  )

  const idleArticle = page.locator('.avatar-animation-panel__clip[title="Idle"]')
  const nodArticle = page.locator('.avatar-animation-panel__clip[title="Nod"]')
  const nodBox = await nodArticle.boundingBox()
  assert(nodBox != null, 'Neighbor clip must have layout bounds')
  await dragPointer(page, idleArticle, {
    boundingBox: async () => ({
      height: 1,
      width: 1,
      x: nodBox.x + nodBox.width * .8,
      y: nodBox.y + nodBox.height / 2
    })
  })
  await waitForTimeline(
    page,
    timeline => {
      const idle = findClip(timeline, 'clip-idle')?.clip
      const nod = findClip(timeline, 'clip-nod')?.clip
      return idle != null && nod != null && idle.startMs > nod.startMs
    },
    'Pointer dragging across a neighbor should reorder clips on one track'
  )

  await pressUndo(page)
  await waitForTimeline(
    page,
    timeline => findClip(timeline, 'clip-idle')?.clip.startMs === 0 &&
      findClip(timeline, 'clip-nod')?.clip.startMs === 2000,
    'Undo should restore the original same-track clip order'
  )
  await pressRedo(page)
  await waitForTimeline(
    page,
    timeline => findClip(timeline, 'clip-idle')?.clip.startMs >
      findClip(timeline, 'clip-nod')?.clip.startMs,
    'Redo should restore the same-track clip reorder'
  )

  const highHeader = page.locator('.avatar-animation-panel__track-header').filter({ hasText: 'High track' })
  const lowHeader = page.locator('.avatar-animation-panel__track-header').filter({ hasText: 'Low track' })
  await highHeader.dragTo(lowHeader)
  await waitForTimeline(
    page,
    timeline => timeline.tracks[0]?.trackId === 'track-high',
    'Dragging track headers should reorder Timeline tracks'
  )

  await pressUndo(page)
  await waitForTimeline(
    page,
    timeline => timeline.tracks[0]?.trackId === 'track-low',
    'Undo should restore the original track order'
  )
  await pressRedo(page)
  await waitForTimeline(
    page,
    timeline => timeline.tracks[0]?.trackId === 'track-high',
    'Redo should restore the reordered tracks'
  )

  await openExportMenu(page)
  await page.locator('#avatar-export-size').selectOption('128')
  const [svgDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    page.locator('.avatar-export-toolbar__menu-action').nth(1).click()
  ])
  const svgPath = await svgDownload.path()
  assert(svgPath != null, 'SVG export should create a real local download')
  const svgBytes = await readFile(svgPath)
  const svgSource = svgBytes.toString('utf8')
  assert.match(svgDownload.suggestedFilename(), /\.svg$/)
  assert(svgBytes.length > 1000, 'Timeline SVG export should contain rendered avatar geometry')
  assert.match(svgSource, /<svg[\s>]/)
  assert.match(svgSource, /viewBox=/)

  const png = await downloadExport(page, 2, 'Download PNG')
  assert.match(png.filename, /\.png$/)
  assert(png.bytes.length > 1000, 'Timeline PNG export should contain rendered avatar pixels')
  assert.equal(png.bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.bytes.readUInt32BE(16), 128)
  assert.equal(png.bytes.readUInt32BE(20), 128)

  await openExportMenu(page)
  const gifAction = page.locator('.avatar-export-toolbar__menu-action').nth(3)
  assert(await gifAction.isEnabled(), 'A valid Timeline should enable GIF export without legacy keyframes')
  const [gifDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 120_000 }),
    gifAction.click()
  ])
  const gifPath = await gifDownload.path()
  assert(gifPath != null, 'GIF export should create a real local download')
  const gifBytes = await readFile(gifPath)
  assert.match(gifDownload.suggestedFilename(), /\.gif$/)
  assert(gifBytes.length > 1000, 'Timeline GIF export should contain encoded animation frames')
  assert.match(gifBytes.subarray(0, 6).toString('ascii'), /^GIF8[79]a$/)
  assert.equal(gifBytes.readUInt16LE(6), 128)
  assert.equal(gifBytes.readUInt16LE(8), 128)

  assert.deepEqual(pageErrors, [], `Timeline E2E emitted page errors: ${pageErrors.join('\n')}`)
  await context.close()
  process.stdout.write('Timeline App E2E passed: editing, undo/redo, and real SVG/PNG/GIF downloads.\n')
} finally {
  await browser?.close()
  if (server != null && server.exitCode == null) {
    server.kill('SIGTERM')
  }
}
