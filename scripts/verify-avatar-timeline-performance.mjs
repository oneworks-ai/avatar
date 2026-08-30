import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { chromium } from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const viteEntry = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const port = Number(process.env.AVATAR_TIMELINE_PERF_PORT ?? 4188)
const externalBaseUrl = process.env.AVATAR_TIMELINE_PERF_BASE_URL
const baseUrl = externalBaseUrl ?? `http://127.0.0.1:${port}`
const chromeExecutablePath = process.env.AVATAR_TIMELINE_PERF_CHROME ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const timelineStorageKey = 'oneworks-avatar-animation-timeline-v1'
const sampleDurationMs = Number(process.env.AVATAR_TIMELINE_PERF_SAMPLE_MS ?? 2000)
const activeClipCounts = [1, 4, 8, 16]

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

const createTimeline = activeClipCount => ({
  durationMs: 4000,
  tracks: Array.from({ length: activeClipCount }, (_, index) => ({
    clips: [{
      durationMs: 4000,
      instanceId: `perf-clip-${index + 1}`,
      playback: 'loop',
      playbackRate: 1,
      source: {
        fallback: 'skip',
        presetId: index % 2 === 0 ? 'idle' : 'listening',
        presetVersion: 1,
        type: 'preset'
      },
      sourceOffsetMs: index * 17,
      startMs: 0,
      weight: 1
    }],
    name: `Performance ${index + 1}`,
    trackId: `perf-track-${index + 1}`,
    weight: 1
  })),
  version: 1
})

const metric = (metrics, name) => metrics.find(candidate => candidate.name === name)?.value ?? 0

const measureActiveClips = async (browser, activeClipCount) => {
  const context = await browser.newContext({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
    viewport: { height: 900, width: 1440 }
  })
  await context.addInitScript(({ storageKey, timeline }) => {
    const originalRequestAnimationFrame = window.requestAnimationFrame.bind(window)
    const originalCancelAnimationFrame = window.cancelAnimationFrame.bind(window)
    const state = {
      canceledAnimationFrames: 0,
      executedAnimationFrames: 0,
      longTasks: [],
      rendererCommits: 0,
      scheduledAnimationFrames: 0
    }
    window.__avatarTimelinePerformance = state
    window.requestAnimationFrame = callback => {
      state.scheduledAnimationFrames += 1
      return originalRequestAnimationFrame(timestamp => {
        state.executedAnimationFrames += 1
        callback(timestamp)
      })
    }
    window.cancelAnimationFrame = handle => {
      state.canceledAnimationFrames += 1
      originalCancelAnimationFrame(handle)
    }
    if (typeof window.PerformanceObserver === 'function') {
      try {
        const observer = new window.PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            state.longTasks.push({ duration: entry.duration, startTime: entry.startTime })
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch {
        // Long Task observation is optional in browsers that omit the entry type.
      }
    }
    window.localStorage.setItem(storageKey, JSON.stringify(timeline))
  }, { storageKey: timelineStorageKey, timeline: createTimeline(activeClipCount) })

  const page = await context.newPage()
  page.setDefaultTimeout(10_000)
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto(`${baseUrl}/?entity=bear&animationPanel=1&sidebar=1&seed=v1-timeline-performance`, {
    waitUntil: 'networkidle'
  })
  await page.locator('.avatar-animation-panel').waitFor({ state: 'visible' })
  await page.locator('.avatar-app__preview-art--hero').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)

  await page.evaluate(() => {
    const state = window.__avatarTimelinePerformance
    const stage = document.querySelector('.avatar-app__preview-art--hero')
    if (state == null || stage == null) throw new Error('Timeline performance instrumentation target is missing')
    const observer = new MutationObserver(() => {
      state.rendererCommits += 1
    })
    observer.observe(stage, { attributes: true, childList: true, characterData: true, subtree: true })
    state.canceledAnimationFrames = 0
    state.executedAnimationFrames = 0
    state.longTasks = []
    state.rendererCommits = 0
    state.scheduledAnimationFrames = 0
    state.stageObserver = observer
  })

  const cdp = await context.newCDPSession(page)
  await cdp.send('Performance.enable')
  const beforeMetrics = await cdp.send('Performance.getMetrics')
  const startedAt = performance.now()
  await page.locator('.avatar-animation-panel__play').click()
  await page.waitForTimeout(sampleDurationMs)
  const elapsedMs = performance.now() - startedAt
  const afterMetrics = await cdp.send('Performance.getMetrics')
  const state = await page.evaluate(() => {
    const value = window.__avatarTimelinePerformance
    return {
      canceledAnimationFrames: value.canceledAnimationFrames,
      executedAnimationFrames: value.executedAnimationFrames,
      longTasks: value.longTasks,
      rendererCommits: value.rendererCommits,
      scheduledAnimationFrames: value.scheduledAnimationFrames
    }
  })
  if (await page.locator('.avatar-animation-panel__play[aria-label="Pause timeline"]').count()) {
    await page.locator('.avatar-animation-panel__play').click()
  }

  const elapsedSeconds = elapsedMs / 1000
  const taskDurationSeconds = metric(afterMetrics.metrics, 'TaskDuration') -
    metric(beforeMetrics.metrics, 'TaskDuration')
  const result = {
    activeClipCount,
    canceledRaf: state.canceledAnimationFrames,
    cpuRatio: taskDurationSeconds / elapsedSeconds,
    elapsedMs,
    executedRafHz: state.executedAnimationFrames / elapsedSeconds,
    longTaskCount: state.longTasks.length,
    maxLongTaskMs: Math.max(0, ...state.longTasks.map(task => task.duration)),
    rendererCommitHz: state.rendererCommits / elapsedSeconds,
    scheduledRafHz: state.scheduledAnimationFrames / elapsedSeconds
  }
  assert.deepEqual(pageErrors, [], `Performance run emitted page errors: ${pageErrors.join('\n')}`)
  await context.close()
  return result
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
      if (code !== 0 && code != null) process.stderr.write(serverOutput.join(''))
    })
  }

  await waitForServer()
  browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: true })
  const results = []
  for (const activeClipCount of activeClipCounts) {
    results.push(await measureActiveClips(browser, activeClipCount))
  }

  const baseline = results[0]
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
  for (const result of results) {
    assert(
      result.cpuRatio <= .9,
      `${result.activeClipCount} active clips exceeded the 90% main-thread CPU gate: ${result.cpuRatio}`
    )
    assert(
      result.executedRafHz >= 30 && result.executedRafHz <= 125,
      `${result.activeClipCount} active clips left the 30 Hz floor / two-loop page budget: ${result.executedRafHz} Hz`
    )
    assert(
      result.rendererCommitHz >= 30 && result.rendererCommitHz <= 72,
      `${result.activeClipCount} active clips left the 30–72 Hz renderer-commit gate: ${result.rendererCommitHz} Hz`
    )
    assert(
      result.longTaskCount <= 2 && result.maxLongTaskMs <= 120,
      `${result.activeClipCount} active clips exceeded the Long Task gate: ${JSON.stringify(result)}`
    )
    assert(
      result.executedRafHz <= baseline.executedRafHz + 8,
      `rAF frequency scaled with active clip count: ${JSON.stringify(results)}`
    )
    assert(
      result.rendererCommitHz <= baseline.rendererCommitHz + 8,
      `Renderer commits scaled with active clip count: ${JSON.stringify(results)}`
    )
  }

  process.stdout.write('Timeline performance gates passed for 1, 4, 8, and 16 active clips.\n')
} finally {
  await browser?.close()
  if (server != null && server.exitCode == null) server.kill('SIGTERM')
}
