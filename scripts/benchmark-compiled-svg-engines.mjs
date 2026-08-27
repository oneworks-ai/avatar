import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const ROOT = process.cwd()
const OUTPUT = path.join(ROOT, 'artifacts/compiled-svg-optimization-2026-08-26')
const BASE_URL = process.env.COMPILED_SVG_LAB_URL ?? 'http://127.0.0.1:5194/compiled-svg-lab.html'
const highQuality = process.argv.includes('--high-quality')
const engines = process.argv.includes('--prechange-baseline') ? ['baseline'] : ['baseline', 'optimized']
const fixtures = highQuality ? ['bird', 'cat'] : ['two-sphere', 'bird', 'cat']
const formalRunCount = 5
const warmupRunCount = 2

const percentile = (samples, ratio) => {
  if (samples.length === 0) return 0
  const ordered = [...samples].sort((left, right) => left - right)
  return ordered[Math.min(Math.floor((ordered.length - 1) * ratio), ordered.length - 1)]
}

const median = samples => percentile(samples, .5)
const sha256 = async filePath => createHash('sha256').update(await readFile(filePath)).digest('hex')
const sourceFiles = [
  'src/compiledAvatarMesh.ts',
  'src/compiledAvatarMeshOptimized.ts',
  'src/CompiledSvgLab.tsx'
]
const sourceFingerprint = async () => {
  const hash = createHash('sha256')
  for (const file of sourceFiles) hash.update(await readFile(path.join(ROOT, file)))
  return hash.digest('hex')
}

const summarize = runs => ({
  binCullP50Ms: median(runs.map(run => Number(run.metrics.binCullP50Ms ?? 0))),
  binCullP95Ms: median(runs.map(run => Number(run.metrics.binCullP95Ms ?? 0))),
  candidateTestsAfter: median(runs.map(run => Number(run.metrics.candidateTestsAfter ?? 0))),
  candidateTestsBefore: median(runs.map(run => Number(run.metrics.candidateTestsBefore ?? 0))),
  compileCount: median(runs.map(run => run.metrics.compileCount)),
  compileMs: median(runs.map(run => run.metrics.compileMs)),
  contourP50Ms: median(runs.map(run => Number(run.metrics.contourP50Ms ?? 0))),
  contourP95Ms: median(runs.map(run => Number(run.metrics.contourP95Ms ?? 0))),
  depthOwnerP50Ms: median(runs.map(run => Number(run.metrics.depthOwnerP50Ms ?? 0))),
  depthOwnerP95Ms: median(runs.map(run => Number(run.metrics.depthOwnerP95Ms ?? 0))),
  domMutationMs: median(runs.map(run => Number(run.metrics.domMutationMs ?? 0))),
  domMutationP95Ms: median(runs.map(run => Number(run.metrics.domMutationP95Ms ?? 0))),
  droppedPoses: median(runs.map(run => Number(run.metrics.droppedPoses ?? 0))),
  longTaskCount: median(runs.map(run => run.metrics.longTaskCount)),
  pathCharacterCount: median(runs.map(run => run.metrics.pathCharacterCount)),
  pathCount: median(runs.map(run => run.metrics.pathCount)),
  pathSerializationP50Ms: median(runs.map(run => Number(run.metrics.pathSerializationP50Ms ?? 0))),
  pathSerializationP95Ms: median(runs.map(run => Number(run.metrics.pathSerializationP95Ms ?? 0))),
  projectCount: median(runs.map(run => run.metrics.projectCount)),
  projectMs: median(runs.map(run => run.metrics.projectMs)),
  projectP50Ms: median(runs.map(run => Number(run.metrics.projectP50Ms ?? 0))),
  projectP95Ms: median(runs.map(run => Number(run.metrics.projectP95Ms ?? 0))),
  rafMaxMs: median(runs.map(run => run.raf.max)),
  rafP50Ms: median(runs.map(run => run.raf.p50)),
  rafP95Ms: median(runs.map(run => run.raf.p95)),
  releaseSettleMs: median(runs.map(run => Number(run.metrics.releaseSettleMs ?? 0))),
  renderedPoses: median(runs.map(run => Number(run.metrics.renderedPoses ?? run.metrics.projectCount))),
  stalePoses: median(runs.map(run => Number(run.metrics.stalePoses ?? 0))),
  transformP50Ms: median(runs.map(run => Number(run.metrics.transformP50Ms ?? 0))),
  transformP95Ms: median(runs.map(run => Number(run.metrics.transformP95Ms ?? 0))),
  triangleCount: median(runs.map(run => run.metrics.triangleCount)),
  uniqueInputPoses: 66,
  vertexCount: median(runs.map(run => run.metrics.vertexCount))
})

const runDrag = async (browser, engine, fixture, runIndex, warmup) => {
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { height: 900, width: 1200 } })
  await page.goto(`${BASE_URL}?engine=${engine}&fixture=${fixture}${highQuality ? '&quality=high' : ''}`, { waitUntil: 'networkidle' })
  const stage = page.locator(`[data-compiled-svg-stage="${fixture}"]`)
  await stage.waitFor()
  const box = await stage.boundingBox()
  if (box == null) throw new Error(`Missing stage bounds for ${engine}/${fixture}`)
  await page.evaluate(() => {
    const state = { active: true, frames: [], last: null }
    window.__benchmarkRaf = state
    const tick = now => {
      if (!state.active) return
      if (state.last != null) state.frames.push(now - state.last)
      state.last = now
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  const start = { x: box.x + box.width * .72, y: box.y + box.height * .48 }
  const end = { x: box.x + box.width * .28, y: box.y + box.height * .63 }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  for (let index = 0; index < 66; index += 1) {
    const progress = index / 65
    await page.mouse.move(
      start.x + (end.x - start.x) * progress,
      start.y + (end.y - start.y) * progress
    )
    await page.waitForTimeout(17)
  }
  await page.mouse.up()
  await page.waitForTimeout(250)
  const { frames, metrics } = await page.evaluate(() => {
    window.__benchmarkRaf.active = false
    return {
      frames: window.__benchmarkRaf.frames,
      metrics: window.__compiledSvgLab?.getMetrics() ?? null
    }
  })
  await page.close()
  if (metrics == null) throw new Error(`Missing metrics for ${engine}/${fixture}`)
  return {
    engine,
    fixture,
    metrics,
    raf: {
      max: Math.max(0, ...frames),
      p50: percentile(frames, .5),
      p95: percentile(frames, .95),
      samples: frames.length
    },
    runIndex,
    warmup
  }
}

await mkdir(OUTPUT, { recursive: true })
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})
const runs = []
for (const fixture of fixtures) {
  const schedule = engines.length === 1
    ? Array.from({ length: warmupRunCount + formalRunCount }, () => engines[0])
    : [
        'baseline', 'optimized', 'optimized', 'baseline',
        'baseline', 'optimized', 'optimized', 'baseline',
        'optimized', 'baseline', 'baseline', 'optimized',
        'baseline', 'optimized'
      ]
  for (let index = 0; index < schedule.length; index += 1) {
    const engine = schedule[index]
    const engineSeen = schedule.slice(0, index + 1).filter(candidate => candidate === engine).length
    runs.push(await runDrag(browser, engine, fixture, engineSeen - 1, engineSeen <= warmupRunCount))
  }
}
await browser.close()

const formalRuns = runs.filter(run => !run.warmup)
const summary = Object.fromEntries(fixtures.flatMap(fixture => engines.map(engine => [
  `${fixture}:${engine}`,
  summarize(formalRuns.filter(run => run.fixture === fixture && run.engine === engine))
])))
const outputName = engines.length === 1
  ? 'prechange-baseline.json'
  : highQuality ? 'performance-abba-export32.json' : 'performance-abba.json'
const report = {
  fixedProtocol: {
    devicePixelRatio: 1,
    formalRunCount,
    inputPoseCount: 66,
    stage: [420, 420],
    quality: highQuality ? 'export-32-840' : 'interactive-native-280',
    warmupRunCount
  },
  generatedAt: new Date().toISOString(),
  runs,
  sourceFingerprint: await sourceFingerprint(),
  sourceHashes: Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, await sha256(path.join(ROOT, file))]))),
  summary
}
await writeFile(path.join(OUTPUT, outputName), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ output: path.join(OUTPUT, outputName), summary }, null, 2))
