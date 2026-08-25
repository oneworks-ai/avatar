# Design an editable 3D avatar from a reference

Use this guide when a supplied photo, illustration, sketch, mascot, or character description calls for a distinct editable avatar rather than merely selecting an existing expression. Read it together with [editor-workflow.md](editor-workflow.md).

The deliverable is a real OneWorks 3D scene: editable geometry, actual part materials, surface-bound details, a restorable scene, and the normal export pipeline. It is not a traced screenshot, image-generated illustration, flat SVG redraw, or photorealistic portrait.

## Decide whether a new model is actually needed

- If the reference only communicates "happier," "more curious," "slightly lower," or "like this existing Siamese," use [preset-composition.md](preset-composition.md).
- If the image changes the recognizable silhouette, ear construction, body structure, marking placement, or part-specific material relationships, continue with this modeling workflow.
- Select the closest existing base entity when its real structure already matches the subject. Use custom or multipart geometry only when it materially improves the requested identity.
- Do not present an unsupported breed profile, Seed constraint, primitive, or public integration API as already implemented. Ask for a product implementation only if the user explicitly requests development beyond the existing editor.

## Extract the character's visual signature

Inspect the supplied reference and separate identity-critical features from incidental photographic details:

1. **Primary silhouette:** head proportions, cheek width, taper, body fullness, and overall shape language.
2. **Attachments:** ear count, ear angle, pointed versus floppy shape, attachment location, insertion depth, and left/right balance.
3. **Distinctive regions:** muzzle, eye mask, ear tips, forehead blaze, chest patch, stripes, or other recognizable markings.
4. **Material hierarchy:** dominant base color, secondary region color, highlight, shadow, and readable facial foreground.
5. **Expression:** eye size, orientation, asymmetry, distance, nose relevance, and whether a mouth contributes anything essential.
6. **Composition:** inward-facing pose, scale, portrait crop, background contrast, and how much of the character extends below the frame.
7. **Allowed variation:** which characteristics define the identity, which may change across Seeds, and which values the user explicitly fixed.

Ignore irrelevant camera noise, image compression, incidental scenery, and tiny textures that will disappear at avatar size. Preserve the recognizable idea without promising a photographic replica.

## Translate reference features into real geometry

Build the primary volume first, then add only the parts necessary to communicate the subject.

| Reference feature                 | Preferred existing construction                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Round or softly oval head         | Sphere or ellipse with deliberate local width, height, and depth.                   |
| Broad cheeks or a tapered head    | Ellipse, rounded trapezoid, or another supported softened primary volume.           |
| Pointed upright ears              | Rounded cone, half-cone, or supported tapered attachment with real local depth.     |
| Long upright ears                 | Capsule or tapered attachment positioned in the primary body's local space.         |
| Floppy dog ears                   | Teardrop, capsule, or softened tapered attachment using its actual local rotation.  |
| Rounded bear or panda ears        | Small ellipse or other supported rounded attachment with independent material.      |
| Centered muzzle or chest bib      | An existing procedural face patch where supported, or a real primary-surface decal. |
| Paired eye masks or cheek patches | Separate surface-projected decals anchored to the appropriate target part.          |
| Contrasting ears or ear tips      | Actual per-part materials or supported part-targeted decals.                        |
| Horns or short spikes             | Cone, frustum, or other supported tapered volume, not a screen-space triangle.      |
| Expressive eyes                   | Rounded rectangular face geometry with independent left/right size and tilt.        |

Use only shapes and controls genuinely available in the editor. If an exact form is unavailable, choose the closest supported editable construction and state the limitation instead of drawing a fake replacement over the scene.

## Construct parts in local 3D space

- Width, height, and depth belong to each part's local X, Y, and Z scale. Set believable depth before judging the silhouette.
- Apply each part's own rotation and placement before the whole entity's yaw, pitch, or roll. Ears, horns, rays, and other attachments must remain attached when the avatar turns.
- Let actual rotated depth and the existing renderer determine near/far ordering. Do not manually reorder visible SVG fragments to make one screenshot appear correct.
- Use face occlusion for pieces physically inserted into the main facial surface, such as ear roots. Do not hollow out broad pieces that should merge into one continuous silhouette.
- Keep mirrored attachment families coherent while allowing deliberate small asymmetry. Match the reference's attachment relationship rather than copying isolated screen coordinates.
- Preview both the requested pose and a nearby restrained yaw or pitch. A marking or attachment that floats, slides, or crosses an unintended silhouette needs a local-geometry or target-surface correction.

## Keep materials and markings anatomically coherent

- Treat base, highlight, shadow, and foreground as one coordinated material system. Facial marks must remain readable against the actual part beneath them.
- Start with a shared palette when the animal is mostly uniform. Use per-part materials for deliberate splits such as a cream face with dark ears or a white face with black ears.
- Preserve existing part-specific materials when refining a single feature; reapplying an entity-wide palette can erase the very relationship that defines the character.
- Anchor patches and markings to real model surfaces. A centered muzzle stays on the primary face; a paired cheek patch follows its cheek; an ear detail targets the ear.
- Rotate the avatar slightly and confirm each detail remains projected, clipped to the intended silhouette, and visually attached. Do not add a detached overlay that only aligns in one front-facing pose.
- Use the existing Cat procedural-coat and Cat-profile systems only for the Cat entity. Other animals can use their actual editable parts, materials, and supported surface decals; they do not currently gain custom breed profiles or procedural coats merely because a reference image suggests one.
- Preserve natural color relationships when realism is requested. Respect fantasy colors only when the user deliberately asks for them.

## Decide what is fixed and what may vary

Classify every important feature before enabling Seed:

- **Identity-fixed:** species, structural silhouette, distinguishing ear material, breed-defining color relationship, required patch anchor, and intentionally selected camera frame.
- **User-fixed:** any explicit expression, background, crop, size, or manual adjustment the user requested not to change.
- **Safely variable:** supported ear dimensions, a Cat profile's approved marking or patch-size domain, selected facial expressions, background, or the single bounded view-pose field when permitted.
- **Not currently supported:** a new species-specific breed selector, a new procedural coat family, or a custom public Seed domain that the existing editor does not expose.

For an existing Cat profile, remain inside its declared palette and field domains. For a custom animal, enable only controls the current editor actually supports; do not invent a profile contract to justify unrestricted randomization.

## Reference-driven construction examples

**Siamese reference.** Begin with the existing Siamese Cat profile when available. Keep the cream primary head, genuinely chocolate-colored ear parts, centered dark elliptical muzzle at its fixed vertical offset, and stripe-free face. Express variation through approved muzzle dimensions rather than moving its identifying mask.

**Panda-like reference.** Begin with Bear if its underlying head and ear arrangement fit. Keep a light primary face, independently dark rounded ear parts, and two actual surface-bound dark eye patches. Preserve face and ear contrast without claiming that a Panda breed button exists.

**Fox-like reference.** Choose an existing Cat-like structure or a custom multipart body according to the desired silhouette. Build a warm-orange tapered head, true pointed ear attachments, and a light muzzle anchored to the facial surface. Use actual per-part ear materials; do not invent a Fox profile or flatten the model into a logo.

**Floppy-eared dog reference.** Start with the existing Dog entity when possible. Shape its real ear attachments with supported softened geometry and local rotations, retain the requested fur colors through per-part materials, and add only genuinely supported model-bound patches. Do not advertise an unimplemented dog-breed or procedural dog-coat picker.

**Black-and-white cow-cat reference.** Use the existing Cow Cat profile when its true geometry matches. Keep the dark head and ears, continuous centered white facial mask, readable warm foreground, and stripe-free coat. Vary mask size only within the profile's supported domain.

## Verify the editable result

1. Confirm the silhouette reads correctly from the intended camera crop and that critical ears, eyes, and muzzle are recognizable.
2. Slightly adjust yaw or pitch and verify attachments, markings, and face projection continue to follow the underlying model.
3. Check front/back depth, per-part materials, foreground contrast, and the absence of accidental hollow overlaps or detached decals.
4. Test only the requested supported Seed fields; confirm fixed identity features and the manually chosen camera frame remain unchanged.
5. Reload the final editor URL and confirm it restores the same concrete scene, including the intended geometry and user-fixed settings.
6. If a file is requested, follow [export-verification.md](export-verification.md) and verify the real exported asset rather than repairing a screenshot afterward.
