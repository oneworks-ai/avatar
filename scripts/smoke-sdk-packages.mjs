import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'oneworks-avatar-sdk-'))
const tarballDirectory = path.join(temporaryRoot, 'tarballs')
const consumerDirectory = path.join(temporaryRoot, 'consumer')
const packages = [
  '@oneworks/avatar',
  '@oneworks/avatar-react',
  '@oneworks/avatar-web',
  '@oneworks/avatar-vue'
]
const packageDirectories = {
  '@oneworks/avatar': 'packages/avatar',
  '@oneworks/avatar-react': 'packages/react',
  '@oneworks/avatar-vue': 'packages/vue',
  '@oneworks/avatar-web': 'packages/web'
}

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  if (result.status !== 0) {
    process.stderr.write(result.stdout)
    process.stderr.write(result.stderr)
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`)
  }
  return result.stdout
}

try {
  await mkdir(tarballDirectory, { recursive: true })
  await mkdir(path.join(consumerDirectory, 'src'), { recursive: true })
  run('pnpm', ['build:sdk'], root)
  run('node', ['--input-type=module', '--eval', "await import('./packages/web/dist/elements.js')"], root)
  for (const packageName of packages) {
    run('pnpm', ['--filter', packageName, 'pack', '--pack-destination', tarballDirectory], root)
  }

  const tarballs = await readdir(tarballDirectory)
  const tarballPath = packageName => {
    const prefix = packageName.replace('@oneworks/', 'oneworks-')
    const tarball = tarballs.find(file => file.startsWith(prefix) && file.endsWith('.tgz'))
    if (tarball == null) throw new Error(`Missing tarball for ${packageName}`)
    return path.join(tarballDirectory, tarball)
  }
  const fileDependency = packageName => `file:${tarballPath(packageName)}`

  for (const packageName of packages) {
    const manifest = JSON.parse(run('tar', ['-xOf', tarballPath(packageName), 'package/package.json'], root))
    if (
      manifest.repository?.url !== 'https://github.com/oneworks-ai/avatar.git' ||
      manifest.repository?.directory !== packageDirectories[packageName]
    ) {
      throw new Error(`Invalid packed repository metadata for ${packageName}`)
    }
    for (const dependency of Object.values(manifest.dependencies ?? {})) {
      if (String(dependency).startsWith('link:') || String(dependency).startsWith('workspace:')) {
        throw new Error(`Unresolved packed dependency for ${packageName}: ${dependency}`)
      }
    }
  }

  await writeFile(
    path.join(consumerDirectory, 'package.json'),
    `${
      JSON.stringify(
        {
          dependencies: Object.fromEntries(packages.map(packageName => [packageName, fileDependency(packageName)])),
          devDependencies: {
            '@types/react': '18.3.31',
            '@types/react-dom': '18.3.7',
            react: '18.3.1',
            'react-dom': '18.3.1',
            typescript: '5.9.3',
            vite: '5.4.21',
            vue: '3.5.41'
          },
          name: 'oneworks-avatar-sdk-smoke',
          private: true,
          scripts: { build: 'tsc --noEmit && vite build' },
          type: 'module'
        },
        null,
        2
      )
    }\n`
  )
  await writeFile(
    path.join(consumerDirectory, 'pnpm-workspace.yaml'),
    [
      'packages:',
      "  - '.'",
      'overrides:',
      ...packages.map(packageName => `  '${packageName}': '${fileDependency(packageName)}'`),
      'allowBuilds:',
      '  esbuild: true',
      ''
    ].join('\n')
  )
  await writeFile(
    path.join(consumerDirectory, 'tsconfig.json'),
    `${
      JSON.stringify(
        {
          compilerOptions: {
            lib: ['ES2022', 'DOM'],
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            target: 'ES2022'
          },
          include: ['src']
        },
        null,
        2
      )
    }\n`
  )
  await writeFile(
    path.join(consumerDirectory, 'index.html'),
    [
      '<!doctype html>',
      '<html><body>',
      '<div id="react-avatar"></div><div id="web-avatar"></div><div id="vue-avatar"></div>',
      '<script type="module" src="/src/main.ts"></script>',
      '</body></html>',
      ''
    ].join('\n')
  )
  await writeFile(
    path.join(consumerDirectory, 'src/main.ts'),
    `
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp } from 'vue'
import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import type { AvatarAnimationLibrary } from '@oneworks/avatar'
import { Avatar, AvatarEditor } from '@oneworks/avatar-react'
import '@oneworks/avatar-react/style.css'
import { createAvatar, createAvatarEditor } from '@oneworks/avatar-web'
import { registerAvatarElements } from '@oneworks/avatar-web/elements'
import '@oneworks/avatar-web/style.css'
import { OneWorksAvatar, OneWorksAvatarEditor } from '@oneworks/avatar-vue'
import '@oneworks/avatar-vue/style.css'

const definition = createDefaultAvatarDefinition()
const animations: AvatarAnimationLibrary = {
  id: 'support',
  groups: {
    attention: {
      defaultClip: 'nod',
      clips: {
        nod: {
          anchor: 'relative',
          durationMs: 600,
          playback: 'once',
          keyframes: [
            { atMs: 0, patch: { view: { pitch: 0 } } },
            { atMs: 300, patch: { view: { pitch: .2 } } },
            { atMs: 600, patch: { view: { pitch: 0 } } }
          ]
        }
      }
    }
  }
}

createRoot(document.querySelector('#react-avatar')!).render(createElement(Avatar, {
  animationLibraries: [animations],
  definition
}))
void createElement(AvatarEditor, { animationLibraries: [animations], definition })
createAvatar(document.querySelector('#web-avatar')!, { animationLibraries: [animations], definition })
void createAvatarEditor(document.createElement('div'), { animationLibraries: [animations], definition })
createApp(OneWorksAvatar, { animationLibraries: [animations], definition })
  .mount(document.querySelector('#vue-avatar')!)
void OneWorksAvatarEditor
if (false) {
  const avatar = null! as InstanceType<typeof OneWorksAvatar>
  avatar.pause()
  avatar.seek(200)
  void avatar.capture({ format: 'png', size: 256 })
  const editor = null! as InstanceType<typeof OneWorksAvatarEditor>
  editor.focus()
  editor.setDefinition(editor.getDefinition())
}
registerAvatarElements()
const avatarElement = document.createElement('oneworks-avatar')
avatarElement.definition = definition
avatarElement.animationLibraries = [animations]
const editorElement = document.createElement('oneworks-avatar-editor')
editorElement.definition = definition
editorElement.animationLibraries = [animations]
`
  )

  run('pnpm', ['install'], consumerDirectory)
  run('pnpm', ['build'], consumerDirectory)
  process.stdout.write('OneWorks Avatar SDK package smoke passed.\n')
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
