# 3D debugging

Use this reference for editor implementation, state-restoration, projection, camera, export, or animation bugs.

## Reproduce from exact state

1. Capture the full editor URL, viewport, theme, active panel, camera mode, frame, animation selection, and expected output.
2. Reload the exact URL before debugging. If reload changes the scene, investigate parse/serialize or default fallback before visual code.
3. Reproduce in the smallest relevant surface: stage, camera preview, saved preset, animation thumbnail, or downloaded file.
4. Preserve a known-good share URL and export for comparison.

## Diagnose by coordinate space

Check layers in this order:

1. Part-local geometry: primitive, scale X/Y/Z, local position, local rotation, roundness, taper, hollow, and cut settings.
2. Entity assembly: attachment offsets, primary face surface, near/far relationships, and rotated-depth ordering.
3. Entity pose: yaw, pitch, roll, whole-object X/Y, and scale.
4. Surface face: projection, tessellation, tangent occlusion, eye tilt, eye-highlight clipping, nose/mouth geometry, surface-decal target/clipping, and face-shadow attenuation.
5. Camera: mode, background, frame clip, edge clearance, and export size.
6. Effects: lighting, grid density, eye highlights, surface decals, face shadow, avatar shadow, outline, and frame shadow.
7. Animation: selected source, first frame, Once/Loop, re-anchor delta, keyframe timing, transient color grade, and sampled export frames.

Do not repair a lower-layer defect in a later layer. Examples: do not move an ear in screen space to hide a wrong Z offset; do not resize a face to hide a projection bug; do not alter camera position to hide animation snapping.

## High-value checks

- Rotate a custom multipart entity slightly on both yaw and pitch. Near-side attachments must remain in front and far-side parts must pass behind coherently.
- Confirm the face follows the same 3D pose as the primary body and disappears naturally behind tangent/back-facing regions.
- Move procedural markings or decals near a silhouette edge, then vary yaw and pitch. Clip `front`, `left`, `right`, and `back` surface geometry at the visible hemisphere so no isolated fragment floats away; keep `side: "face"` patches on the same face-plane projection as the facial features.
- Confirm multipart pieces intended to fuse remain solid; inappropriate overlap subtraction often presents as hollow rings.
- Push a highlight toward the eye edge and a decal toward the target-part edge, then rotate slightly. Neither may escape its projected clip, and a decal must not cover a hollow cavity.
- Enter and leave Camera and Animation without accepting geometry shifts.
- Compare stage, saved preset, animation preview, and export for the same entity/material state.
- Reload transparent and colored camera URLs and confirm the selected background mode survives.
- For an animation, compare the chosen first frame, stage anchor, Once/Loop behavior, and GIF beginning/end.
- If both live preview and GIF jump at the first frame, inspect selected start frame, playback re-anchor, and first-frame timing. If preview is correct and only GIF jumps, inspect the first generated sample and offscreen render state in `avatarGifExport.tsx`.

## Preserve the full authoring chain

- For an optional face dimension, update public ranges and strict validation, editor defaults, URL parsing/serialization, definition conversion, actual projected eye geometry, animation-patch validation/interpolation, face-transition dependencies, and all framework renderers. Old definitions without the field must stay valid and must not trigger spurious changes.
- Replace a selected face preset as a complete style rather than merging it over the previous one. Verify old optional left/right eye widths and heights disappear from concrete state and the share URL.
- Keep Cat-profile fixed values, allowed Seed fields, candidate palettes, per-field domains, real scene preview, URL restoration, and public definition aligned. A profile may narrow a public numeric range but must never generate values outside it.
- Exclude the camera frame from active Seed application and legacy Seed-field parsing while preserving its compatibility field-path identifier, manual control, concrete URL state, public definitions, and exports.
- For seeded view motion, persist the final view once, interpolate only transient rendering state, continue rapid rerolls from the currently visible state, cancel stale frames on direct manipulation or playback, and honor `prefers-reduced-motion`.
- Translate every newly exposed preset name, tooltip, and accessible label. Overflowing preset catalogs need an accessible entry to the complete list; dark-avatar preview backgrounds must never mutate real camera state.
- Keep procedural coat rendering in the shared public resolver. Preserve independently authored decals and materialize generated markings only through the explicit conversion action.

## Source map

When working in the `oneworks-ai/avatar` repository, start with the nearest relevant source rather than scanning broadly:

- `src/avatarGeometry.ts`: primitives, face geometry, projection, and tessellation.
- `src/InteractiveAvatar.tsx`: assembled rendering, materials, projection, highlight/decal clips, occlusion, and depth ordering.
- `src/avatarSurfaceDecals.ts`: decal schema, URL normalization, target-part semantics, and defaults.
- `src/avatarEntityPresets.ts`: built-in multipart geometry, materials, scene defaults, and serialization defaults.
- `src/avatarBreedTemplates.ts`: Cat-profile identity constraints, natural palette domains, permitted Seed variation, and preview-only backgrounds.
- `src/avatarFacePresets.ts`: authored rounded-eye expressions and complete face-style replacement defaults.
- `src/avatarSeed.ts`: supported Seed fields, deterministic candidate/range selection, legacy-field filtering, and constrained domains.
- `src/AvatarControls.tsx`: actual rendered preset previews, profile selection, Seed-follow toggles, and face/coat controls.
- `src/avatarDefinition.ts`: conversion between the public definition, concrete editor state, and complete share URL.
- `src/AvatarOrientationControl.tsx`: yaw, pitch, and shared roll controls.
- `src/App.tsx`: URL state, scene composition, preset restore, camera/export routing, and animation coordination.
- `src/savedAvatarPresets.ts`: SVG serialization, camera background/frame application, and PNG capture.
- `src/avatarGifExport.tsx`: animation resolution, sampling, offscreen rendering, transparency, and GIF encoding.
- `packages/avatar/src/index.ts`: public definition schema, shared range constants, strict parsing, animation application, and runtime resolution.
- `packages/avatar/src/catalog.ts`: entity-wide palette materials and optional part-specific/coat color descriptors.
- `src/avatarAnimations.ts`: presets, keyframes, timing, easing, start frame, Once/Loop, and persistence.

## Verification

- Run the focused tests covering the changed module.
- From the Avatar repository, run `pnpm typecheck` and `pnpm build`.
- When validating from the parent app workspace, run the Avatar Vitest project or focused `assets/avatar/__tests__` files rather than an unrelated full suite.
- Exercise the exact share URL in the real browser after rebuild. For a visual/export bug, produce a real download and inspect it independently.
- Preserve the IAB tab and development server when the user asks to inspect the result.
