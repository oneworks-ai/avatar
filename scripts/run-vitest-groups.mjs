import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const testDirectories = [
  '__tests__',
  'packages/avatar/__tests__',
  'packages/react/__tests__',
  'packages/web/__tests__'
]

const memoryIntensiveTests = new Set([
  '__tests__/AppSeed.spec.ts',
  '__tests__/AvatarControls.spec.ts',
  '__tests__/avatarCompiledRenderer.spec.ts',
  '__tests__/avatarFragmentRenderGraph.spec.ts',
  '__tests__/compiledAvatarMesh.spec.ts',
  'packages/react/__tests__/rendering.spec.tsx'
])

const testFiles = testDirectories
  .flatMap(directory => readdirSync(directory)
    .filter(file => /\.spec\.tsx?$/.test(file))
    .map(file => `${directory}/${file}`))
  .sort()

const regularTests = testFiles.filter(file => !memoryIntensiveTests.has(file))
const groups = [
  ...[...memoryIntensiveTests]
    .filter(file => testFiles.includes(file))
    .map(file => [file])
]

for (let index = 0; index < regularTests.length; index += 6) {
  groups.push(regularTests.slice(index, index + 6))
}

const vitestEntry = fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url))

for (const [index, group] of groups.entries()) {
  process.stdout.write(`\n[vitest ${index + 1}/${groups.length}] ${group.join(' ')}\n`)
  const pool = group.length === 1 && group[0] === '__tests__/AvatarControls.spec.ts'
    ? 'threads'
    : 'forks'
  const result = spawnSync(process.execPath, [
    vitestEntry,
    'run',
    `--pool=${pool}`,
    '--maxWorkers=1',
    '--no-file-parallelism',
    ...group
  ], {
    env: process.env,
    stdio: 'inherit'
  })

  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

process.stdout.write(`\nAll ${testFiles.length} test files passed in ${groups.length} isolated groups.\n`)
