# Export verification

Use this reference whenever an Avatar file is requested.

## Export through the product

- Enter Camera mode before export so background and frame are applied.
- Select `128`, `256`, or `512` pixels. Use `256` only as the unspecified default.
- Use Copy SVG for markup or clipboard delivery. Use Download SVG, PNG, or GIF for files.
- SVG and PNG capture the current static scene. GIF requires a selected animation and captures its resolved frames.
- Never deliver a viewport screenshot as the Avatar asset.

## Verify state fidelity

- Compare the export with the reloaded final share URL, not merely the current unpersisted screen.
- Confirm entity, part materials, rotated depth order, pose, surface face, eye highlights, surface decals, lighting, avatar/face shadows, outline, background, and frame. The camera frame shadow is preview-only and must not appear in an export.
- Confirm highlights remain clipped to their eyes and decals remain clipped to the intended part without filling hollow cavities.
- For a custom multipart avatar, inspect the target pose and a small yaw/pitch variation before export.
- Confirm the exported dimensions match the selected size.

## SVG and PNG

- A transparent SVG may omit an opaque camera background or include a frame path with `fill="transparent"`. Reject an opaque camera fill, not the mere existence of a background path.
- Confirm the checkerboard preview is absent from both SVG and PNG.
- Confirm a transparent PNG has an alpha channel.
- For circle and rounded frames, outer corner pixels must be fully transparent even when the editor displays a camera frame shadow.
- For a square frame, inspect an exposed background region or the alpha histogram when transparent background is visible. Do not require a transparent corner if the avatar deliberately fills that corner.
- Reopen the file independently; a successful browser download event alone is insufficient.

## GIF

- Confirm there are multiple frames and at least two distinct frame images.
- Confirm the beginning matches the selected first-frame behavior.
- Confirm the ending and loop metadata match Once or Loop.
- Check that the entity, camera crop, background transparency, and composition remain stable while intended pose/face/color changes animate.
- Check that camera frame shadow is absent across SVG, PNG, and GIF and that the frame fills the export without an artificial shadow inset.
- Treat GIF transparency as a constrained indexed format; inspect antialiased avatar edges against the intended destination background when visual quality matters.

If any check fails, correct the editor state and export again. Do not post-process a mismatched file into apparent compliance.
