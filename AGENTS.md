# Agent Avatar Assets Guide

This project is the preview/export surface for the OneWorks agent avatar visual system.

- `../../packages/agent-avatar/src/avatar.ts`: shared pure SVG generator, pixel glyph definitions, palettes, and presets.
- `src/App.tsx`: standalone preview/export surface.
- `src/App.scss`: page layout and interaction styling.
- `.github/workflows/deploy-agent-avatar.yml`: GitHub Pages deployment owned by the `oneworks-ai/agent-avatar` repository.

Avatar glyphs must remain SVG `rect` geometry. Do not replace the face characters with web fonts, canvas text, or raster images. Runtime renderer changes belong in `../../packages/agent-avatar`.

The app repository triggers this Pages deployment only when `assets/agent-avatar/**` or `packages/agent-avatar/**` changes. Do not broaden the trigger to all `packages/**`.
