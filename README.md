# OneWorks Avatar

[English](README.md) | [简体中文](README.zh-Hans.md)

OneWorks Avatar is a browser-based 3D geometric avatar editor with editable share URLs and native SVG, PNG, and animated GIF export.

Open the hosted editor at [oneworks.cloud/avatar](https://oneworks.cloud/avatar/).

## Agent Skill

This repository includes the `oneworks-avatar` Agent Skill for creating, debugging, exporting, and integrating avatars:

```bash
npx skills@latest add oneworks-ai/avatar
```

The Skill uses the real editor and its 3D scene model. It does not redraw the result through an image generator.

## Current 3D integration

The current integration model separates the editable source from the application asset:

```ts
interface AvatarAssetRecord {
  editorUrl: string
  assetUrl: string
  format: 'svg' | 'png' | 'gif'
  size: 128 | 256 | 512
}
```

- `editorUrl` is the complete URL produced by the editor. Store it as an opaque value so the avatar can be reopened and changed later.
- `assetUrl` points to an exported file uploaded to your own static asset host or media storage.
- The editor URL is not an image URL and should not be used as `<img src>`.

Embed an exported asset like any other image:

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

SVG and PNG are static projections of the current 3D scene. GIF contains the selected animation. Export sizes are 128, 256, and 512 pixels. Camera background can be a color or transparent, and the camera frame can be square, rounded, or circular.

Prefer `<img src>` or independent image files over injecting several exported SVG strings into one document. Internal SVG definition IDs are not a public multi-inline contract.

Treat the generated share URL as opaque editor state. Its query tuples are not a versioned public API; do not hand-author or parse `entityParts`, `animationData`, or other internal parameters.

## Runtime boundary

The 3D editor does not currently expose a public React component, JavaScript/DOM renderer, versioned avatar JSON definition, iframe/embed mode, or `postMessage` controller. Do not import private editor modules as an SDK.

The public [`@oneworks/avatar`](https://github.com/oneworks-ai/app/blob/main/packages/avatar/README.md) package is a separate legacy 2D pixel-emoticon SVG renderer for deterministic application placeholders. It does not consume or render the 3D editor scene.

## Source

The legacy pixel renderer, glyph geometry, palettes, presets, and seed helpers live in `oneworks-ai/app` under `packages/avatar`. The 3D editor and export pipeline live in this repository.

This repository is mounted into `oneworks-ai/app` as the `assets/avatar` submodule. It builds independently from the app root workspace while using an `app-source` checkout or symlink for shared package source.

## Development

From this repository:

```bash
pnpm install --no-frozen-lockfile
ln -s /path/to/oneworks-app app-source
ONEWORKS_APP_SOURCE_DIR=app-source pnpm dev
ONEWORKS_APP_SOURCE_DIR=app-source pnpm build:app-source
```

## Deployment

GitHub Pages is deployed by this repository's `deploy-avatar.yml` workflow. The app repository triggers that workflow when avatar-specific inputs change:

- `assets/avatar/**`
- `packages/avatar/**`
- `.github/workflows/deploy-avatar.yml`

The Pages build checks out both repositories, builds with the requested app source revision, and publishes `dist`.
