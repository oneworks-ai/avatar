# OneWorks Avatar

Pixel-rect avatar preview and export surface for `@oneworks/avatar`.

## Source

The avatar renderer, glyph geometry, palettes, presets, and seed helpers are maintained in `oneworks-ai/app` under `packages/avatar`.

This repository is mounted back into `oneworks-ai/app` as the `assets/avatar` submodule, but it builds independently from the app root pnpm workspace. Local development and GitHub Pages builds use an `app-source` checkout or symlink so the preview is tied to the app commit being tested without running the app root install.

## Development

From this repository:

```bash
pnpm install --no-frozen-lockfile
ln -s /path/to/oneworks-app app-source
ONEWORKS_APP_SOURCE_DIR=app-source pnpm dev
ONEWORKS_APP_SOURCE_DIR=app-source pnpm build:app-source
```

## Deployment

GitHub Pages is deployed by this repository's `deploy-avatar.yml` workflow. The app repository triggers that workflow from `.github/workflows/deploy-avatar.yml` only when avatar-specific inputs change:

- `assets/avatar/**`
- `packages/avatar/**`
- `.github/workflows/deploy-avatar.yml`

The Pages build checks out this repository, checks out `oneworks-ai/app` into `app-source`, installs this repository's dependencies, builds with `ONEWORKS_APP_SOURCE_DIR=app-source pnpm build:app-source`, and publishes `dist`.
