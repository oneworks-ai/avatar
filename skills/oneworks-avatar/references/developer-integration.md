# Developer integration

Use this reference before recommending a OneWorks Avatar integration. Distinguish current 3D surfaces from the separate legacy npm renderer and from future architecture ideas.

## Choose the current integration

### Editable 3D source plus exported asset

Use the hosted editor at `https://oneworks.cloud/avatar/`, save its complete generated URL as an opaque editable source, and export an SVG, PNG, or GIF for the application.

Store the two concerns separately:

```ts
interface AvatarAssetRecord {
  editorUrl: string
  assetUrl: string
  format: 'svg' | 'png' | 'gif'
  size: 128 | 256 | 512
}
```

The `editorUrl` restores authoring state; it is not an image URL. The `assetUrl` points to a file uploaded to the application's own static asset host or media storage.

Prefer normal file embedding:

```tsx
export function SupportAgentAvatar() {
  return (
    <img
      src='/avatars/support-agent.svg'
      width={96}
      height={96}
      alt='Support agent'
    />
  )
}
```

Keep editing and display actions explicit in product UI:

```tsx
export function AvatarAsset({ avatar }: { avatar: AvatarAssetRecord }) {
  return (
    <figure>
      <img src={avatar.assetUrl} width={96} height={96} alt='Support agent' />
      <a href={avatar.editorUrl} target='_blank' rel='noreferrer'>Edit avatar</a>
    </figure>
  )
}
```

SVG and PNG are static. GIF carries the selected animation. Prefer `<img src>` or independent files over injecting several exported SVG strings into one document, because internal SVG definition IDs are not a public multi-inline contract.

Do not hand-author or parse `entityParts`, `animationData`, or other query tuples. The URL parser is editor persistence, not a semver-versioned public schema.

### Deterministic legacy 2D placeholders

Use `@oneworks/avatar` when an application needs deterministic pixel-emoticon SVG placeholders rather than the 3D editor scene:

```bash
pnpm add @oneworks/avatar
```

React can use the generated data URI:

```tsx
import { useMemo } from 'react'
import { createSeededAvatarDataUri } from '@oneworks/avatar'

export function AgentAvatar({ id, name }: { id: string; name: string }) {
  const src = useMemo(() => createSeededAvatarDataUri({
    seed: `agent:${id}`,
    size: 128,
    title: `${name} avatar`
  }), [id, name])

  return <img src={src} width={64} height={64} alt={`${name} avatar`} />
}
```

Node or server-side TypeScript can write SVG without a DOM:

```ts
import { writeFile } from 'node:fs/promises'
import {
  createAvatarSvg,
  getAvatarPalette,
  isSupportedAvatarEmoticon
} from '@oneworks/avatar'

const emoticon = '0w0'
if (!isSupportedAvatarEmoticon(emoticon)) throw new Error('Unsupported avatar')

await writeFile('avatar.svg', createAvatarSvg({
  emoticon,
  palette: getAvatarPalette('signal'),
  backgroundStyle: 'gradient',
  showShadow: true,
  size: 256,
  title: 'Codex avatar'
}), 'utf8')
```

This package is a legacy 2D pixel renderer. It does not accept a 3D editor URL, entity parts, camera settings, animations, PNG, or GIF.

Seed mapping is deterministic within a package version but may change if preset ordering changes. Pin the package version for cross-version identity, or resolve once and persist the explicit emoticon and palette ID.

## Do not promise these yet

The current product does not expose:

- a public 3D React component or JavaScript/DOM renderer;
- a versioned `.oneworks-avatar.json` definition;
- iframe/embed mode or a `postMessage` controller;
- `play`, `pause`, `stop`, `setExpression`, or capture APIs;
- public imports from `InteractiveAvatar`, `savedAvatarPresets`, or `avatarGifExport`.

Do not recommend importing private editor source or treating the private Avatar app package as an SDK.

## Future runtime direction

When the user asks to design or implement a 3D runtime, treat it as a new product/code task rather than existing integration. A sound direction is:

1. Define a versioned, validated 3D scene format covering entity parts/local transforms, face, whole-entity pose, camera, lighting/effects, and animations.
2. Extract a pure core with no React, DOM, or storage dependency for validation, geometry, projection, depth ordering, and frame sampling.
3. Build React and framework-free web adapters on the same core and semantic animation keys.
4. Keep full editor project state distinct from the compact runtime definition and from share URLs.
5. Add real package smoke tests: pack tarballs, install them into clean non-workspace consumers, then typecheck and build React and vanilla examples.
6. Add an embed surface only with an explicit origin, sizing, lifecycle, and `postMessage` contract.

These are architecture recommendations, not current APIs.
