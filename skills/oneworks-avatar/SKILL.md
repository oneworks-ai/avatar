---
name: oneworks-avatar
description: Create, refine, debug, export, and integrate editable OneWorks 3D geometric avatars. Use for avatars, mascots, bot or agent portraits, multipart 3D characters, reference-image model design, cat breeds, character presets, expressive eyes, coat patterns, controlled Seed variation, avatar composition, OneWorks Avatar share URLs, transparent SVG or PNG, animated GIF, developer handoff, React or JavaScript integration, embed questions, @oneworks/avatar integration, or investigation of pose, projection, depth, camera, export, and animation issues. Do not use for photorealistic portraits or arbitrary raster illustration.
---

# OneWorks Avatar

Work with the official OneWorks 3D geometric avatar system. Treat the editor URL as editable scene state and its rendered SVG as the projection of that state; do not replace either with image generation, a screenshot, or a hand-drawn 2D approximation.

## Route the task

- To compose existing avatar types, character profiles, expressions, placement, or animation, read [references/editor-workflow.md](references/editor-workflow.md) and [references/preset-composition.md](references/preset-composition.md). Use this route when available models already support the requested identity, including reference images used only to communicate mood or composition.
- To design an original editable 3D character from a reference image, sketch, mascot, or new silhouette, read [references/editor-workflow.md](references/editor-workflow.md) and [references/reference-modeling.md](references/reference-modeling.md). Translate distinguishing features into actual supported geometry, materials, and model-bound details.
- For any requested exported file, also read [references/export-verification.md](references/export-verification.md).
- For developer integration, read [references/developer-integration.md](references/developer-integration.md). Read it before recommending npm, React, Vue, JavaScript, Web Components, iframe, embed, JSON, or runtime APIs so package and product boundaries stay accurate.
- For editor implementation or debugging, read [references/3d-debugging.md](references/3d-debugging.md). Also read the workflow or export reference when the bug touches those surfaces.
- For a request spanning routes, read each applicable reference once and keep one shared source of truth for the scene.

## Core contract

- Think in three spaces: part-local geometry, whole-entity 3D pose, and 2D camera composition. Fix a problem in the space where it originates.
- Keep the same scene state across editor preview, share URL, saved preset, animation, SVG, PNG, and GIF. A result that looks similar but comes from a different state is not equivalent.
- Separate the entity type, an optional constrained character profile, and saved complete looks. Profiles express which identity features stay fixed and which values may vary; the resolved concrete scene remains the rendering source of truth.
- Treat Seed as deterministic, field-specific authoring. Preserve the character's species, natural palette, camera frame, and manually fixed choices unless a supported applicable field explicitly follows Seed.
- Preserve true local X/Y/Z transforms, entity yaw/pitch/roll, projection, rotated-depth ordering, surface-projected face geometry, camera crop, lighting, and effects.
- Use the real editor and export pipeline. Do not rebuild the avatar from DOM fragments, rendered SVG paths, URL tuple internals, or a prompt-generated image.
- Treat a complete editor-generated URL as an opaque editable source. Do not promote its private query parameters to a public API or hand-author serialized `entityParts` or `animationData`.
- Correct state in the editor and export again when verification fails. Do not silently repair the downloaded asset with unrelated graphics tooling.

## Universal workflow

1. Parse the request for subject, personality, palette, 3D shape language, target pose, expression, background, frame, motion, identity features that must remain fixed, allowed variation, integration target, formats, and sizes.
2. If the user supplies a OneWorks Avatar URL, open and reload it before editing. Preserve every unspecified choice.
3. Inspect concise product context when it materially helps. Ask one compact round of questions only when a missing choice would change the result; otherwise choose sensible defaults and proceed.
4. Determine the available browser path before promising operated or exported output. Prefer an already-running local editor when the user is reviewing it; otherwise use `https://oneworks.cloud/avatar/`. If no interactive browser is available, explain the limitation instead of fabricating results.
5. Establish the delivery target before detailed composition: editable URL, static or animated asset, opaque or transparent background, frame, size, and developer integration method.
6. Perform the route-specific workflow and verification.
7. Reload the final URL and compare the restored scene with the pre-reload view before delivery.

Do not require a fixed three-direction or six-candidate process. Offer alternatives only when the brief is genuinely ambiguous. When the user authorizes direct execution, proceed without repeating already-settled choices.

## Current product boundaries

- `@oneworks/avatar` is the framework-neutral 3D definition, validation, serialization, animation, and deterministic-seed package. Do not look for or recommend the removed 2D pixel renderer.
- `@oneworks/avatar-react`, `@oneworks/avatar-vue`, and `@oneworks/avatar-web` render the same 3D scene. Each includes a renderer and the full editor; the web package also offers opt-in custom elements.
- Applications may carry custom animation libraries in a definition or pass libraries to a renderer/editor. Preserve the versioned definition instead of reverse-engineering editor URL tuples.
- There is no iframe/embed URL or `postMessage` controller contract. Use the framework editor component or web mount when an application needs embedded editing.
- The editor URL is not an image URL or a public definition schema. Store it separately from the versioned definition and exported asset URL.

## Delivery

For a creative or export task, report the final share URL and each exported file with format, dimensions, background mode, frame, and animation behavior. For a developer task, state which integration surface is current and which capabilities are unavailable or only proposed. For debugging, report the reproduced state, root cause, changed layer, and focused verification.

Keep the editor or in-app browser open when the user asks to inspect the result.
