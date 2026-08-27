import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '/Users/yijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const root = process.cwd()
const outputDirectory = path.join(root, 'src/avatarPresetSnapshots')
const breedOutputDirectory = path.join(outputDirectory, 'breeds')
const baseUrl = process.env.AVATAR_PRESET_SNAPSHOT_URL ?? (
  'http://127.0.0.1:5194/avatar/?seed=v1-0auditfixed000000000' +
  '&lightAz=-35&lightEl=40#/editor'
)

const readSnapshotSvg = async (page, source) => {
  if (source.startsWith('data:image/svg+xml')) {
    const comma = source.indexOf(',')
    return decodeURIComponent(source.slice(comma + 1))
  }
  return page.evaluate(async url => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to load snapshot ${url}: ${response.status}`)
    return response.text()
  }, source)
}

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})
try {
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { height: 900, width: 1280 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.locator('button[aria-label="More presets"], button[aria-label="更多预设"]').first().click()
  await page.waitForSelector('.avatar-controls__preset-browser-grid')
  await page.waitForFunction(() => {
    const grid = document.querySelector('.avatar-controls__preset-browser-grid')
    if (grid == null) return false
    const presets = grid.querySelectorAll('[data-entity-preset]')
    return presets.length > 0 && [...presets].every(preset => (
      preset.querySelector('[data-preview-static="true"] > img') != null
    ))
  }, undefined, { timeout: 30_000 })

  const snapshots = await page.evaluate(() => (
    [...document.querySelectorAll('.avatar-controls__preset-browser-grid [data-entity-preset]')]
      .map(button => ({
        preset: button.getAttribute('data-entity-preset'),
        source: button.querySelector('[data-preview-static="true"] > img')?.getAttribute('src')
      }))
      .filter(snapshot => snapshot.preset != null && snapshot.source != null)
  ))

  await mkdir(outputDirectory, { recursive: true })
  for (const { preset, source } of snapshots) {
    const svg = await readSnapshotSvg(page, source)
    await writeFile(path.join(outputDirectory, `${preset}.svg`), `${svg}\n`)
  }

  const breedSnapshots = []
  for (const { preset } of snapshots) {
    const browserIsOpen = await page.locator('.avatar-controls__preset-browser-grid').count() > 0
    if (!browserIsOpen) {
      await page.locator('button[aria-label="More presets"], button[aria-label="更多预设"]').first().click()
      await page.waitForSelector('.avatar-controls__preset-browser-grid')
    }
    await page.locator(`.avatar-controls__preset-browser-grid [data-entity-preset="${preset}"]`).click()
    await page.waitForFunction(entity => (
      new URL(window.location.href).searchParams.get('entity') === entity
    ), preset)

    const breedSelector = [
      '[data-cat-breed]',
      '[data-dog-breed]',
      '[data-rabbit-breed]',
      '[data-bear-breed]',
      '[data-animal-breed]'
    ].join(',')
    const breedCount = await page.locator(breedSelector).count()
    if (breedCount === 0) continue

    await page.waitForFunction(selector => {
      const buttons = [...document.querySelectorAll(selector)]
      return buttons.length > 0 && buttons.every(button => (
        button.querySelector('[data-preview-static="true"] > img') != null
      ))
    }, breedSelector, { timeout: 60_000 })

    const entries = await page.evaluate(({ selector, species }) => (
      [...document.querySelectorAll(selector)].map(button => ({
        id: button.getAttribute('data-cat-breed') ??
          button.getAttribute('data-dog-breed') ??
          button.getAttribute('data-rabbit-breed') ??
          button.getAttribute('data-bear-breed') ??
          button.getAttribute('data-animal-breed'),
        source: button.querySelector('[data-preview-static="true"] > img')?.getAttribute('src'),
        species
      })).filter(entry => entry.id != null && entry.source != null)
    ), { selector: breedSelector, species: preset })
    breedSnapshots.push(...entries)
  }

  await mkdir(breedOutputDirectory, { recursive: true })
  for (const { id, source, species } of breedSnapshots) {
    const svg = await readSnapshotSvg(page, source)
    await writeFile(path.join(breedOutputDirectory, `${species}--${id}.svg`), `${svg}\n`)
  }
  process.stdout.write(`${JSON.stringify({
    breedCount: breedSnapshots.length,
    breedOutputDirectory,
    count: snapshots.length,
    outputDirectory
  })}\n`)
} finally {
  await browser.close()
}
