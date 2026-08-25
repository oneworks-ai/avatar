# Editor workflow

Use this workflow for creating or refining a OneWorks 3D Avatar through the editor.

## Establish the scene

1. Decide the requested output before fine-tuning: static or animated, opaque or transparent, square/rounded/circle frame, and `128`, `256`, or `512` pixels. Default to `256` only when the user has no size preference.
2. Choose an entity before detailed edits. Built-in cloud, sun, cat, dog, bear, rabbit, and bun presets restore authored geometry, face, material, camera, pose, outline, and shadow, so selecting one late may replace existing work.
3. Use a custom body or multipart entity when the silhouette needs independent depths, rotations, tapered forms, hollows, or attachments. Available primitives include sphere, ellipse, square, rounded square, capsule, teardrop, diamond, rounded trapezoid, cone, frustum, and half-cone.

## Character identity and Cat profiles

- Keep **Avatar type**, optional **Cat type**, and **Saved looks** separate. The avatar type selects actual multipart geometry; a Cat type constrains identity and Seed variation; a saved look restores a complete concrete scene.
- Render avatar-type and Cat-type cards from their actual resolved geometry, materials, and procedural coat. Use consistent thumbnail sizing and translated accessible names rather than hand-drawn substitutes or visible duplicate labels.
- Selecting an already-active Cat type removes its profile constraint without discarding the current appearance. Preserve the Cat head size; derive ear changes from canonical Cat parts so repeated edits do not compound.
- Author the existing Cat profiles by their recognizable fixed identity and only vary their declared fields:
  - **Siamese:** cream head, chocolate ears, horizontally centered dark elliptical muzzle at a fixed vertical offset, and no stripes; vary muzzle length and width while keeping its position and palette fixed.
  - **British Shorthair:** warm golden-brown and beige materials, shorter ears, broad face mask, and restrained classic markings; vary marking density and mask size.
  - **Russian Blue:** coherent blue-gray materials with no procedural markings; vary ear width and height.
  - **Orange Tabby:** warm orange materials, paired natural stripes, and a pale face mask; vary approved stripe algorithm, layout, density, jitter, thickness, and mask size.
  - **Cow Cat:** near-black head and ears, a centered continuous white face mask, and readable amber facial features; vary mask length and width without changing its position or introducing stripes.
  - **Black Cat:** layered near-black materials, readable contrasting facial features, and no procedural markings; vary ear width and height.
- A dark Cat-type thumbnail may use a light preview-only background, but that choice must never modify the avatar's real camera background, palette, or exported appearance.

## Model in 3D

- Build the primary volume first, then add the fewest parts needed for identity.
- Width, height, and depth are local X/Y/Z scale. Local X/Y/Z rotation is applied before the assembled entity pose and projection. Do not fake a volume problem with screen-space stretching.
- Use Z and actual rotation for front/back relationships. Let the renderer sort by rotated depth, then visually verify near and far sides.
- Attach parts in the primary surface's local 3D space. Do not pin ears, rays, limbs, or other attachments to one screen position.
- Use face occlusion only for parts physically inserted into the primary facial surface, such as ear roots or sun rays. Broad pieces intended to fuse into one silhouette, such as cloud lobes, should remain filled rather than becoming hollow overlap rings.
- Preserve paired features through the normal target pose. Deliberate camera cropping is valid; accidental loss behind the body is a depth or pose problem.
- Judge a custom model in the target pose and at least one nearby yaw/pitch variation before moving on.

## Face and pose

- The face is projected onto the primary surface. Recheck eyes, nose, and mouth after changing the body, yaw, pitch, or scale.
- Prefer rounded-rectangle eyes for expressive character presets. Combine shared width, height, gap, and roundness with independent left/right width, height, and tilt to create tall eyes, horizontal lines, unequal rounded dots, side glances, or a vertical-plus-horizontal eye pair.
- Give the eyes enough visual weight to carry the expression; they may be deliberately larger for alert, curious, or surprised reactions. Enable a mouth only when the expression genuinely requires one, such as an explicit smile or laugh.
- Selecting a face preset replaces the entire previous face style. Optional asymmetric eye widths and heights must not leak into another expression or remain in its share URL.
- Eye highlights are surface-bound details. Keep them inside the projected eye at the final pose, including when the two eyes use different heights or rotation.
- Add a nose only when it carries identity or expression. Keep small parts large enough for the final export size.
- Rotate mode controls 3D yaw and pitch. Move mode controls whole-object X/Y; pinch or wheel controls scale. Roll controls composition around the view axis. Do not use Move to hide an incorrect 3D pose.
- The orientation control exposes red pitch and green yaw rings. Its blue and yellow affordances both manipulate the same roll state; do not describe them as separate model-roll and screen-roll values.
- Body and face must stay attached while rotating. A sliding face is a state or renderer problem, not something to compensate for in one pose.

## Materials, lighting, and effects

- A palette swatch is entity-wide. For an intentional multipart material split, preserve it and use per-part base, highlight, shadow, and foreground colors for targeted edits.
- A constrained Cat type owns its natural palette and part-specific color relationships. Seed variation must not turn a breed into an unrelated green or fantasy palette, but preserve an unconventional color when the user deliberately chooses it.
- Treat base, highlight, shadow, and foreground as one material system. Keep facial marks readable without making them look detached.
- Use surface decals for blush, badges, patches, and other model-bound color shapes. Target a specific multipart part when needed; a `Body` target means the primary facial body. Rotate the model and confirm the decal stays clipped to the target silhouette and does not paint across hollow cavities.
- Procedural coat density governs every dark marking, including forehead, eye-side, ear, and edge landmarks. `0%` removes all dark markings while preserving the independent contrasting coat patch.
- Adjust the coat patch through `face-mask`, `ellipse`, or `rounded` shape; centered length and width; and separate vertical position. Length and width currently span `60–200%`, vertical position spans `-50..50`, and each Cat profile may narrow those ranges.
- Generated coat markings and explicit user decals remain separate. Only an explicit conversion to editable decals should materialize generated markings and turn off the procedural pattern.
- Lighting shades the surface; it is not a visible mesh. Leave it off for a flat material. Near light increases contrast, greater distance attenuates it, and grid density changes shading resolution rather than silhouette quality.
- Face shadow, whole-avatar shadow, outline, and frame shadow are independent. Tune one at a time and avoid stacking all at high strength.
- A face shadow should hug the projected surface and attenuate near tangent views. Reduce distance, softness, or opacity if it looks detached.
- Use the outline to separate the projected silhouette from the background, not to repair contrast inside a multipart material.

## Seed and composition

- With no active fields or character constraints, generating a random Seed enables all currently applicable editor fields. For an active Cat profile with no enabled fields, start with its declared defaults; additional manually enabled supported fields may also vary, while profile-controlled palette, ear, and coat values stay within the profile's constrained domain.
- Generating a new random Seed for a Cat profile always adds `scene.view.pose` if it is absent. Manually entering a Seed only re-resolves fields that are already enabled; do not treat these two actions as equivalent.
- Manually editing one value freezes that field without clearing unrelated follow fields or silently removing the active character profile. A Cat profile must also prevent an older entity-follow binding from replacing Cat with another species.
- The camera frame is always a manual choice. Preserve its share-URL and definition values; its public field-path identifier remains for compatibility, but never include `scene.camera.frame` in active Seed randomization and ignore that legacy follow binding in older URLs.
- Treat `scene.view.pose` as one composition field rather than separate independent random controls. The current safe recipe keeps `positionY = 72`, `scale = 1.72`, and `roll = 0`; it varies horizontal position within `±120` and adds bounded center-facing yaw/pitch variation.
- Compose the avatar lower in the viewport with moderate scale and deliberate bottom cropping. Avoid full-circle spins, upside-down framing, uncontrolled tilt, teleporting, and compositions that float entirely inside the frame.
- A Seed-generated pose should interpolate smoothly for about `220 ms` while the final concrete view is immediately committed to the share URL and definition. Cancel stale movement on direct manipulation or playback and skip interpolation when reduced motion is preferred.

## Camera and transparency

- Camera mode alone defines export background and crop. The editing surface may show geometry beyond the nominal viewport, so only trust Camera view for edge clearance.
- Entering Camera mode, changing frame, or opening Animation should not move the character. Treat a shift as a state bug instead of manually repositioning per mode.
- Choose square, rounded-square, or circle based on the destination. Rounded and circle frames clip camera content at their outer corners regardless of camera background. Frame shadow remains in the public camera definition and appears in editor/framework on-screen previews, but is never included in exported assets or saved thumbnails.
- For a transparent asset, select `Transparent` under Style → Camera background and confirm the URL contains `cameraBg=transparent`. The checkerboard is only a UI preview and must not appear in exports.

## Animation

- Finish the static 3D composition first.
- Available built-ins include Idle, Blink, Wink, Listening, Nod, Thinking, Searching, Working, Happy, Curious, Surprised, Bored, Sad, Angry, Shocked, Petrified, Laughing, Playful, Excited, and Celebrate.
- Prefer Idle, Blink, Listening, Nod, Thinking, or Working for ambient product agents. Use broad reactions when explicitly requested.
- A keyframe carries whole-object X/Y, yaw/pitch, face expression, transition duration/easing, and optional transient color grade. It does not replace entity geometry or base material.
- Custom animation libraries may be stored on the definition or supplied separately to the renderer/editor. Keep reusable motion packs separate when several avatars share the same behavior.
- Playback re-anchors to the avatar's current X/Y and yaw/pitch when it starts. Put the stage in the desired pose and position before preview or GIF export.
- In Loop mode the first frame owns the final-to-first transition. In Once mode the selected first frame should appear immediately.
- Select and preview an animation before GIF export; the action remains disabled without one.
