---
name: oneworks-avatar
description: Create, refine, debug, export, and integrate editable OneWorks 3D geometric avatars. Use for avatars, mascots, bot or agent portraits, multipart 3D characters, OneWorks Avatar share URLs, transparent SVG or PNG, animated GIF, developer handoff, React or JavaScript integration, embed questions, @oneworks/avatar integration, or investigation of pose, projection, depth, camera, export, and animation issues. Do not use for photorealistic portraits or arbitrary raster illustration.
---

# OneWorks Avatar

Work with the official OneWorks 3D geometric avatar system. Treat the editor URL as editable scene state and its rendered SVG as the projection of that state; do not replace either with image generation, a screenshot, or a hand-drawn 2D approximation.

## Route the task

- For creating, refining, or exporting an avatar, read [references/editor-workflow.md](references/editor-workflow.md). Also read [references/export-verification.md](references/export-verification.md) whenever files are requested.
- For developer integration, read [references/developer-integration.md](references/developer-integration.md). Read it before recommending npm, React, JavaScript, iframe, embed, JSON, or runtime APIs so planned capabilities are never presented as current ones.
- For editor implementation or debugging, read [references/3d-debugging.md](references/3d-debugging.md). Also read the workflow or export reference when the bug touches those surfaces.
- For a request spanning routes, read each applicable reference once and keep one shared source of truth for the scene.

## Core contract

- Think in three spaces: part-local geometry, whole-entity 3D pose, and 2D camera composition. Fix a problem in the space where it originates.
- Keep the same scene state across editor preview, share URL, saved preset, animation, SVG, PNG, and GIF. A result that looks similar but comes from a different state is not equivalent.
- Preserve true local X/Y/Z transforms, entity yaw/pitch/roll, projection, rotated-depth ordering, surface-projected face geometry, camera crop, lighting, and effects.
- Use the real editor and export pipeline. Do not rebuild the avatar from DOM fragments, rendered SVG paths, URL tuple internals, or a prompt-generated image.
- Treat a complete editor-generated URL as an opaque editable source. Do not promote its private query parameters to a public API or hand-author serialized `entityParts` or `animationData`.
- Correct state in the editor and export again when verification fails. Do not silently repair the downloaded asset with unrelated graphics tooling.

## Universal workflow

1. Parse the request for subject, personality, palette, 3D shape language, target pose, expression, background, frame, motion, integration target, formats, and sizes.
2. If the user supplies a OneWorks Avatar URL, open and reload it before editing. Preserve every unspecified choice.
3. Inspect concise product context when it materially helps. Ask one compact round of questions only when a missing choice would change the result; otherwise choose sensible defaults and proceed.
4. Determine the available browser path before promising operated or exported output. Prefer an already-running local editor when the user is reviewing it; otherwise use `https://oneworks.cloud/avatar/`. If no interactive browser is available, explain the limitation instead of fabricating results.
5. Establish the delivery target before detailed composition: editable URL, static or animated asset, opaque or transparent background, frame, size, and developer integration method.
6. Perform the route-specific workflow and verification.
7. Reload the final URL and compare the restored scene with the pre-reload view before delivery.

Do not require a fixed three-direction or six-candidate process. Offer alternatives only when the brief is genuinely ambiguous. When the user authorizes direct execution, proceed without repeating already-settled choices.

## Current product boundaries

- The current 3D product surface is the hosted editor, its generated share URL, and browser-exported SVG, PNG, and GIF assets.
- There is no public 3D React component, JavaScript renderer, versioned avatar JSON definition, iframe/embed mode, or `postMessage` controller contract yet.
- The public `@oneworks/avatar` npm package is a separate legacy 2D pixel-emoticon SVG renderer. It is useful for deterministic placeholders but does not render the 3D editor scene.
- The editor URL is not an image URL. Store the editable `editorUrl` separately from the exported `assetUrl` used by an application.

## Delivery

For a creative or export task, report the final share URL and each exported file with format, dimensions, background mode, frame, and animation behavior. For a developer task, state which integration surface is current and which capabilities are unavailable or only proposed. For debugging, report the reproduced state, root cause, changed layer, and focused verification.

Keep the editor or in-app browser open when the user asks to inspect the result.
