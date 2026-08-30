import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { createServer } from 'vite'

const root = path.resolve(import.meta.dirname, '..')
const outputDirectory = path.join(root, 'src/avatarAnimationPresetCovers')
const manifestPath = path.join(outputDirectory, 'manifest.json')
const checkOnly = process.argv.includes('--check')

const fingerprintSources = [
  'packages/avatar/src/index.ts',
  'src/InteractiveAvatar.tsx',
  'src/avatarAnimationPresetCoverRenderer.tsx',
  'src/avatarAnimations.ts',
  'src/avatarBreedTone.ts',
  'src/avatarDefinition.ts',
  'src/avatarEntityPresets.ts',
  'src/avatarGeometry.ts',
  'src/avatarHeadModelHelpers.ts',
  'src/avatarMammalHeadModels.ts',
  'src/avatarSurfaceDecals.ts'
]

const hash = value => createHash('sha256').update(value).digest('hex')

const createSourceFingerprint = async () => {
  const sources = await Promise.all(fingerprintSources.map(async source => ({
    content: await fs.readFile(path.join(root, source), 'utf8'),
    source
  })))
  return hash(sources.map(({ content, source }) => `${source}\0${content}`).join('\0'))
}

const server = await createServer({
  appType: 'custom',
  server: { middlewareMode: true },
  ssr: { noExternal: ['gifenc'] }
})

try {
  const renderer = await server.ssrLoadModule('/src/avatarAnimationPresetCoverRenderer.tsx')
  const covers = renderer.renderAvatarAnimationPresetCovers()
  const sourceFingerprint = await createSourceFingerprint()
  const entries = covers.map(cover => {
    const asset = `${cover.presetId}.svg`
    return {
      asset,
      assetHash: hash(cover.svg),
      frames: cover.timelineFrames.map((frame, index) => {
        const frameAsset = `${cover.presetId}.frame-${index}.svg`
        return {
          asset: frameAsset,
          assetHash: hash(frame.svg),
          progress: frame.progress
        }
      }),
      presetId: cover.presetId,
      progress: cover.progress,
      sourceFingerprint: hash(`${sourceFingerprint}\0${cover.presetId}\0${cover.progress}`)
    }
  })
  const manifest = `${JSON.stringify({
    entries,
    representativeEntity: renderer.AVATAR_ANIMATION_COVER_REPRESENTATIVE_ENTITY,
    sourceFingerprint,
    version: 1
  }, null, 2)}\n`

  if (checkOnly) {
    const failures = []
    const existingManifest = await fs.readFile(manifestPath, 'utf8').catch(() => null)
    if (existingManifest !== manifest) failures.push('manifest.json')
    await Promise.all(covers.map(async cover => {
      const asset = await fs.readFile(path.join(outputDirectory, `${cover.presetId}.svg`), 'utf8').catch(() => null)
      if (asset !== cover.svg) failures.push(`${cover.presetId}.svg`)
      await Promise.all(cover.timelineFrames.map(async (frame, index) => {
        const frameAsset = `${cover.presetId}.frame-${index}.svg`
        const existingFrame = await fs.readFile(path.join(outputDirectory, frameAsset), 'utf8').catch(() => null)
        if (existingFrame !== frame.svg) failures.push(frameAsset)
      }))
    }))
    const expectedAssets = new Set(entries.flatMap(entry => [entry.asset, ...entry.frames.map(frame => frame.asset)]))
    const existingAssets = await fs.readdir(outputDirectory).catch(() => [])
    existingAssets.filter(asset => asset.endsWith('.svg') && !expectedAssets.has(asset)).forEach(asset => failures.push(asset))
    if (failures.length > 0) {
      throw new Error(`Animation preset covers are stale or missing: ${[...new Set(failures)].sort().join(', ')}. Run pnpm animation-covers:generate.`)
    }
    console.log(`Checked ${covers.length} deterministic animation preset covers and ${entries.reduce((total, entry) => total + entry.frames.length, 0)} timeline frames.`)
  } else {
    await fs.mkdir(outputDirectory, { recursive: true })
    const expectedAssets = new Set(entries.flatMap(entry => [entry.asset, ...entry.frames.map(frame => frame.asset)]))
    const existingAssets = await fs.readdir(outputDirectory).catch(() => [])
    await Promise.all(existingAssets
      .filter(asset => asset.endsWith('.svg') && !expectedAssets.has(asset))
      .map(asset => fs.unlink(path.join(outputDirectory, asset))))
    await Promise.all(covers.flatMap(cover => [
      fs.writeFile(path.join(outputDirectory, `${cover.presetId}.svg`), cover.svg),
      ...cover.timelineFrames.map((frame, index) => (
        fs.writeFile(path.join(outputDirectory, `${cover.presetId}.frame-${index}.svg`), frame.svg)
      ))
    ]))
    await fs.writeFile(manifestPath, manifest)
    console.log(`Generated ${covers.length} deterministic animation preset covers and ${entries.reduce((total, entry) => total + entry.frames.length, 0)} timeline frames.`)
  }
} finally {
  await server.close()
}
