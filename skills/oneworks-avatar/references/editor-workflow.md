# Editor workflow

Use this workflow for creating or refining a OneWorks 3D Avatar through the editor.

## Establish the scene

1. Decide the requested output before fine-tuning: static or animated, opaque or transparent, square/rounded/circle frame, and `128`, `256`, or `512` pixels. Default to `256` only when the user has no size preference.
2. Choose an entity before detailed edits. Built-in cloud, sun, cat, dog, bear, and rabbit presets restore authored geometry, face, material, camera, pose, outline, and shadow, so selecting one late may replace existing work.
3. Use a custom body or multipart entity when the silhouette needs independent depths, rotations, tapered forms, hollows, or attachments. Available primitives include sphere, ellipse, square, rounded square, capsule, teardrop, diamond, rounded trapezoid, cone, frustum, and half-cone.

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
- Tune rounded or elliptical eyes through width, height, gap, roundness, shared rotation, and independent left/right tilt. Near tangent angles, correct foreshortening or disappearance is expected.
- Eye highlights are surface-bound details. Keep them inside the projected eye at the final pose, including when the two eyes use different heights or rotation.
- Add a nose or mouth only when it carries identity or expression. Keep small parts large enough for the final export size.
- Rotate mode controls 3D yaw and pitch. Move mode controls whole-object X/Y; pinch or wheel controls scale. Roll controls composition around the view axis. Do not use Move to hide an incorrect 3D pose.
- The orientation control exposes red pitch and green yaw rings. Its blue and yellow affordances both manipulate the same roll state; do not describe them as separate model-roll and screen-roll values.
- Body and face must stay attached while rotating. A sliding face is a state or renderer problem, not something to compensate for in one pose.

## Materials, lighting, and effects

- A palette swatch is entity-wide. For an intentional multipart material split, preserve it and use per-part base, highlight, shadow, and foreground colors for targeted edits.
- Treat base, highlight, shadow, and foreground as one material system. Keep facial marks readable without making them look detached.
- Use surface decals for blush, badges, patches, and other model-bound color shapes. Target a specific multipart part when needed; a `Body` target means the primary facial body. Rotate the model and confirm the decal stays clipped to the target silhouette and does not paint across hollow cavities.
- Lighting shades the surface; it is not a visible mesh. Leave it off for a flat material. Near light increases contrast, greater distance attenuates it, and grid density changes shading resolution rather than silhouette quality.
- Face shadow, whole-avatar shadow, outline, and frame shadow are independent. Tune one at a time and avoid stacking all at high strength.
- A face shadow should hug the projected surface and attenuate near tangent views. Reduce distance, softness, or opacity if it looks detached.
- Use the outline to separate the projected silhouette from the background, not to repair contrast inside a multipart material.

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
