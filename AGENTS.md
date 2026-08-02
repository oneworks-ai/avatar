# Avatar Assets Guide

This project is the preview/export surface for the OneWorks avatar visual system.

- `../../packages/avatar/src/avatar.ts`: shared pure SVG generator, pixel glyph definitions, palettes, and presets.
- `src/App.tsx`: standalone preview/export surface.
- `src/App.scss`: page layout and interaction styling.
- `.github/workflows/deploy-avatar.yml`: GitHub Pages deployment owned by the `oneworks-ai/avatar` repository.

Avatar glyphs must remain SVG `rect` geometry. Do not replace the face characters with web fonts, canvas text, or raster images. Runtime renderer changes belong in `oneworks-ai/app` under `packages/avatar`.

The app repository triggers this Pages deployment only when `assets/avatar/**` or `packages/avatar/**` changes. Do not broaden the trigger to all `packages/**`.

This repository builds independently from the app monorepo. It must not depend on the app root pnpm workspace or on `workspace:*` package specifiers. The deploy workflow checks out the app repository as `app-source` only to read source files for the triggering commit, installs this repository's own toolchain, and builds with `ONEWORKS_APP_SOURCE_DIR=app-source pnpm build:app-source`.
