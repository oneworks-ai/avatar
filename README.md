# OneWorks Agent Avatar

Pixel-rect agent avatar preview and export surface for `@oneworks/agent-avatar`.

## Source

The avatar renderer, glyph geometry, palettes, presets, and seed helpers are maintained in `oneworks-ai/app` under `packages/agent-avatar`.

This repository is mounted back into `oneworks-ai/app` as the `assets/agent-avatar` submodule. The preview app imports the package through the app workspace so local package changes can be previewed before publishing.

## Development

From `oneworks-ai/app` with this submodule checked out:

```bash
pnpm install
pnpm -C assets/agent-avatar dev
pnpm -C assets/agent-avatar build
```

## Deployment

GitHub Pages is deployed by this repository's `deploy-agent-avatar.yml` workflow. The app repository triggers that workflow from `.github/workflows/deploy-agent-avatar.yml` only when avatar-specific inputs change:

- `assets/agent-avatar/**`
- `packages/agent-avatar/**`
- `.github/workflows/deploy-agent-avatar.yml`

The Pages build checks out `oneworks-ai/app` at the triggering commit, initializes submodules, installs the workspace, builds `assets/agent-avatar`, and publishes `assets/agent-avatar/dist`.
