import { readFile } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const root = process.cwd()
const presetSource = JSON.parse(await readFile(
  path.join(root, 'src/avatarEffectStylePresets.json'),
  'utf8'
))
const effectStyle = 'chunky-pixel'
const samples = presetSource[effectStyle]?.samples ?? []
const outputDirectory = path.join(root, 'src/avatarPresetSnapshots/pixel')
const baseUrl = process.env.AVATAR_PIXEL_SNAPSHOT_URL ?? 'http://127.0.0.1:5194/avatar/'

if (samples.length === 0) throw new Error(`No samples configured for ${effectStyle}`)

await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})

try {
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { height: 900, width: 1280 } })
  for (const entity of samples) {
    const url = new URL(baseUrl)
    url.searchParams.set('effectStyle', effectStyle)
    url.searchParams.set('seed', 'v1-0auditfixed000000000')
    url.searchParams.set('size', '256')
    url.searchParams.set('template', entity)
    url.hash = '/editor'

    await page.goto(url.href, { waitUntil: 'networkidle' })
    await page.waitForFunction(expectedEntity => {
      const params = new URL(window.location.href).searchParams
      return params.get('entity') === expectedEntity && params.get('pixel') === '1'
    }, entity)
    await page.locator('.interactive-avatar[data-pixel-ready="true"]').waitFor({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Export avatar' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('menuitem').filter({ hasText: /Download SVG|下载 SVG/ }).click()
    const download = await downloadPromise
    await download.saveAs(path.join(outputDirectory, `${entity}.svg`))
  }

  process.stdout.write(`${JSON.stringify({ count: samples.length, effectStyle, outputDirectory })}\n`)
} finally {
  await browser.close()
}
