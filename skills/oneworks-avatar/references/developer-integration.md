# Developer integration

Use this reference before recommending a OneWorks Avatar integration. All public adapters consume the same versioned 3D definition and renderer; do not reintroduce the removed pixel renderer or treat private editor URL tuples as an SDK.

## Choose the package

Before installing a prerelease, verify that the registry resolves the 3D release. Do not accept the removed 2D `@oneworks/avatar@1.0.0-rc.5`, and do not claim an adapter is installable while npm still returns `E404`:

```bash
npm view @oneworks/avatar@rc version
npm view @oneworks/avatar-react@rc version
npm view @oneworks/avatar-vue@rc version
npm view @oneworks/avatar-web@rc version
```

Require all four results to be `1.0.0-rc.6` or a later compatible release. Until then, consume the matching source workspace from the `oneworks-ai/avatar` repository rather than mixing released and unpublished packages. Once verified, install the framework-neutral package and only the adapters the application needs:

```bash
pnpm add @oneworks/avatar@rc
pnpm add @oneworks/avatar-react@rc # React
pnpm add @oneworks/avatar-vue@rc   # Vue
pnpm add @oneworks/avatar-web@rc   # Vanilla JS and opt-in elements
```

- `@oneworks/avatar`: versioned definitions, parsing, serialization, deterministic seeded definitions, animation libraries, validation, interpolation, and playback resolution.
- `@oneworks/avatar-react`: `Avatar`, full `AvatarEditor`, controller refs, callbacks, and capture.
- `@oneworks/avatar-vue`: `OneWorksAvatar`, full `OneWorksAvatarEditor`, exposed controllers, and emits.
- `@oneworks/avatar-web`: `createAvatar`, `createAvatarEditor`, DOM events, and explicitly registered `<oneworks-avatar>` / `<oneworks-avatar-editor>` elements.

React applications on SDK `1.0.0-rc.9` or later can use the independent `renderer` / `renderer.css` and `editor` / `editor.css` exports. Verify the installed version exposes these paths before recommending them. Vue, Web, and older React integrations retain the adapter's `style.css` export.

## Define a 3D avatar and animations

```ts
import {
  type AvatarAnimationLibrary,
  createSeededAvatarDefinition
} from '@oneworks/avatar'

const definition = createSeededAvatarDefinition({
  seed: 'agent:support',
  name: 'Support agent'
})

const supportAnimations = {
  id: 'support',
  label: 'Support',
  groups: {
    attention: {
      label: 'Attention',
      defaultClip: 'acknowledge',
      clips: {
        acknowledge: {
          anchor: 'relative',
          durationMs: 900,
          playback: 'once',
          keyframes: [
            { atMs: 0, patch: { view: { pitch: 0 } } },
            { atMs: 300, patch: { view: { pitch: .2 } } },
            { atMs: 900, patch: { view: { pitch: 0 } } }
          ]
        }
      }
    }
  }
} satisfies AvatarAnimationLibrary
```

A definition contains `scene` and may additionally carry a top-level `animations` library. Renderers and editors also accept `animationLibraries`, so products can keep reusable motion packs separate from saved avatar identity.

## React

```tsx
import { Avatar } from '@oneworks/avatar-react/renderer'
import '@oneworks/avatar-react/renderer.css'
import { AvatarEditor } from '@oneworks/avatar-react/editor'
import '@oneworks/avatar-react/editor.css'

<Avatar
  definition={definition}
  animationLibraries={[supportAnimations]}
  interactive
/>
<AvatarEditor
  definition={definition}
  animationLibraries={[supportAnimations]}
  locale='zh-Hans'
/>
```

When editing is optional, import only `renderer` and `renderer.css` initially. Load the editor and its CSS together at the interaction boundary:

```tsx
import { lazy, Suspense } from 'react'

const LazyAvatarEditor = lazy(async () => {
  const [module] = await Promise.all([
    import('@oneworks/avatar-react/editor'),
    import('@oneworks/avatar-react/editor.css')
  ])
  return { default: module.AvatarEditor }
})

// Mount this only when the user opens the editor.
<Suspense fallback={<span>Loading editor…</span>}>
  {editorOpen && <LazyAvatarEditor definition={definition} />}
</Suspense>
```

The root React export remains compatible, but imports from it or its full `style.css` can retain editor dependencies. `exports` selects an independent entry; the application's dynamic `import()` determines when it loads. Keep emitted chunks and image assets together at deployment and preserve their relative URLs. Validate the installed package with a production Vite build and browser requests; a small source entry alone does not prove deferred loading.

Use renderer refs for `play`, `pause`, `resume`, `seek`, `stop`, `capture`, `getDefinition`, and `setDefinition`. Use editor refs for `focus`, `getDefinition`, and `setDefinition`. React events are callback props.

## Vue

```vue
<script setup lang="ts">
import { OneWorksAvatar, OneWorksAvatarEditor } from '@oneworks/avatar-vue'
import '@oneworks/avatar-vue/style.css'
</script>

<template>
  <OneWorksAvatar
    :definition="definition"
    :animation-libraries="[supportAnimations]"
  />
  <OneWorksAvatarEditor
    :definition="definition"
    :animation-libraries="[supportAnimations]"
  />
</template>
```

Vue exposes renderer/editor controllers with `expose` and reports changes through emits.

## Vanilla JS and opt-in Web Components

```ts
import { createAvatar, createAvatarEditor } from '@oneworks/avatar-web'
import '@oneworks/avatar-web/style.css'

const avatar = createAvatar(document.querySelector('#avatar')!, {
  definition,
  animationLibraries: [supportAnimations]
})
const editor = createAvatarEditor(document.querySelector('#editor')!, {
  definition,
  animationLibraries: [supportAnimations]
})
```

Mounts expose controllers and emit DOM `CustomEvent`s from their hosts. Call `destroy()` when a mount is no longer needed.

Custom elements never register as an import side effect:

```ts
import { registerAvatarElements } from '@oneworks/avatar-web/elements'

registerAvatarElements()

const element = document.querySelector('oneworks-avatar')!
element.definition = definition
element.animationLibraries = [supportAnimations]
```

Use element properties for complex values. `<oneworks-avatar>` provides playback and capture methods; read/write its `definition` property rather than assuming mount-style getter/setter methods.

## Preserve authoring and delivery sources

Keep these values distinct:

```ts
interface AvatarAssetRecord {
  definition: AvatarDefinition
  editorUrl?: string
  assetUrl?: string
  format?: 'svg' | 'png' | 'gif'
}
```

- `definition` is the portable runtime/editor data source.
- `editorUrl` is the complete opaque URL produced by the hosted editor.
- `assetUrl` points to an exported SVG, PNG, or GIF file for `<img src>` or media delivery.

Do not hand-author or parse `entityParts`, `animationData`, or other editor query tuples. Do not inject several exported SVG strings into one document when ordinary `<img src>` files suffice.

## Current boundary

There is no public iframe/embed URL or `postMessage` protocol. Embed the full editor through the React, Vue, or web adapter. Never import private `InteractiveAvatar`, saved-preset, GIF-export, or application storage modules.

For complete API examples, use the bilingual public guides at `https://oneworks.cloud/docs/usage/avatar` and `https://oneworks.cloud/docs/en/usage/avatar`.
