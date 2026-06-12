# Avatar Assets Guide

This project is the preview/export surface for the OneWorks avatar visual system.

- `../../packages/avatar/src/avatar.ts`: shared pure SVG generator, pixel glyph definitions, palettes, and presets.
- `src/App.tsx`: standalone preview/export surface.
- `src/App.scss`: page layout and interaction styling.
- `.github/workflows/deploy-avatar.yml`: GitHub Pages deployment owned by the `oneworks-ai/avatar` repository.

Avatar glyphs must remain SVG `rect` geometry. Do not replace the face characters with web fonts, canvas text, or raster images. Runtime renderer changes belong in `../../packages/avatar`.

The app repository triggers this Pages deployment only when `assets/avatar/**` or `packages/avatar/**` changes. Do not broaden the trigger to all `packages/**`.
