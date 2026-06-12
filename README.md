# OneWorks Avatar

Pixel-rect avatar preview and export surface for `@oneworks/avatar`.

## Source

The avatar renderer, glyph geometry, palettes, presets, and seed helpers are maintained in `oneworks-ai/app` under `packages/avatar`.

This repository is mounted back into `oneworks-ai/app` as the `assets/avatar` submodule. The preview app imports the package through the app workspace so local package changes can be previewed before publishing.

## Development

From `oneworks-ai/app` with this submodule checked out:

```bash
pnpm install
pnpm -C assets/avatar dev
pnpm -C assets/avatar build
```

## Deployment

GitHub Pages is deployed by this repository's `deploy-avatar.yml` workflow. The app repository triggers that workflow from `.github/workflows/deploy-avatar.yml` only when avatar-specific inputs change:

- `assets/avatar/**`
- `packages/avatar/**`
- `.github/workflows/deploy-avatar.yml`

The Pages build checks out `oneworks-ai/app` at the triggering commit, initializes submodules, installs the workspace, builds `assets/avatar`, and publishes `assets/avatar/dist`.
