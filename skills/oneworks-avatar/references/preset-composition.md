# Compose an avatar from existing models

Use this guide when the user wants a recognizable existing character, a particular emotion, a clean avatar composition, or a finished animation without designing a new model. Read it together with [editor-workflow.md](editor-workflow.md).

## Translate the request into an editing brief

Identify five concrete decisions before touching the editor:

1. **Identity:** existing avatar type, optional supported character profile, natural palette, and recognizable features.
2. **Expression:** the intended feeling, whether a nose matters, and whether a mouth is genuinely necessary.
3. **Composition:** front-facing or gently turned, horizontal placement, lower-edge crop, size, and available headroom.
4. **Variation:** which values should follow Seed and which authored features must stay fixed.
5. **Delivery:** editable link, static image, animated asset, background, frame, and output dimensions.

Treat a supplied editor link as the starting scene. Preserve every choice the user did not ask to change. A mood board or example screenshot may communicate expression or framing without requiring a newly modeled character.

## Choose the closest supported identity

- Select the base avatar type first: cloud, sun, cat, dog, bear, rabbit, or bun. Changing the entity later can replace authored shape, face, materials, pose, and camera settings.
- Keep **Avatar type**, **Cat type**, and **Saved looks** distinct. A saved look restores an entire scene; a Cat type constrains one recognizable character within the Cat entity.
- Cat currently supports Siamese, British Shorthair, Russian Blue, Orange Tabby, Cow Cat, and Black Cat. Pick the closest profile before adjusting its expression.
- Dog, bear, rabbit, and the other existing entities do not currently expose an equivalent breed-profile or procedural-coat selector. Use their actual existing models and editable materials; do not promise a Husky, Corgi, panda, or rabbit breed button that does not exist.
- If an available model is structurally right but needs a different expression, material, or framing, stay in this composition workflow. Move to [reference-modeling.md](reference-modeling.md) only when the requested identity needs genuinely different editable geometry or model-bound features.
- Selecting an already-active Cat type removes its profile constraint while preserving the concrete appearance. Do not confuse removing that constraint with deleting the avatar.

## Build expression primarily with the eyes

Start from the closest face preset, then adjust its real rounded-rectangle eye geometry. If the compact preset row does not show enough options, open its **More** control instead of assuming the expression is unavailable.

| Intended feeling         | Eye construction                                                                                    | Mouth guidance                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Angry or determined      | Narrow rounded bars, inward opposing tilts, slightly tighter spacing.                               | Leave off unless the user asks for an overt snarl.                |
| Happy or friendly        | Open, generous rounded eyes with relaxed or gently opposing tilts.                                  | Add a smile only when an explicit smile is part of the request.   |
| Sleepy or unimpressed    | Two short, thin, almost horizontal rounded bars.                                                    | Leave off; the eyes should carry the mood.                        |
| Surprised or alert       | Larger open rounded rectangles or an intentionally unequal pair.                                    | Leave off unless the requested reaction clearly needs it.         |
| Curious or skeptical     | Different left/right heights or widths, a slight directional tilt, and thoughtful spacing.          | Leave off; use asymmetry rather than a generic grin.              |
| Playful or winking       | One open eye and one near-horizontal rounded bar.                                                   | Optional only when the brief explicitly asks for a playful smile. |
| Focused or side-glancing | Slim rounded eyes sharing a direction or subtle matching tilt.                                      | Usually leave off.                                                |
| Mixed or quirky          | One taller vertical rounded eye and one wider horizontal rounded eye, using independent dimensions. | Usually leave off.                                                |
| Large-and-small dots     | Independently sized, highly rounded left and right eyes.                                            | Leave off unless necessary.                                       |

Keep eyes large enough to remain legible at the final export size. Use real independent left/right width, height, and tilt rather than faking a shape with unrelated overlays. Selecting a face preset replaces the complete previous face style; old asymmetric settings should not leak into the next expression.

A nose is optional: keep it when it supports the animal's identity, and remove it when the simpler face reads better. A mouth is an accent, not the default mechanism for every emotion.

## Compose the avatar as a portrait

- Establish composition in **Camera** mode, because the editing canvas can show geometry outside the actual exported frame.
- Start with a moderately sized character placed lower in the viewport. Let the lower edge crop a little of the body while leaving useful breathing room above the ears.
- For a centered portrait, keep the face readable and use only a restrained yaw or pitch. For a left- or right-peeking portrait, offset horizontally while keeping the face oriented toward the center.
- Preserve ear tips, eyes, and other key identity features unless the user deliberately asks for a tighter crop.
- Avoid a character floating entirely inside the frame, extreme face-filling scale, uncontrolled tilt, upside-down composition, or full-circle spins unless the user explicitly requests them.
- Distinguish actual camera background from a light preview-only background used to make a dark breed thumbnail visible. Thumbnail contrast must not silently change the scene.
- Choose a background with enough separation from dark fur, white fur, or dark facial marks. Keep a user-selected square, rounded, or circular frame unchanged.

## Apply meaningful controlled variation

- Randomness should vary only features appropriate to the character and the user's request. Manually authored identity, species, breed-defining color relationships, and fixed markings remain stable.
- Siamese may vary the size of its centered dark muzzle while preserving cream fur, chocolate ears, muzzle position, and the absence of stripes.
- British Shorthair may vary restrained marking density and mask size; Russian Blue and Black Cat may vary ear dimensions without introducing procedural markings.
- Orange Tabby may vary its approved warm-natural stripe pattern and face-mask size; Cow Cat may vary its centered white-mask size without losing its black-and-white identity.
- With no active fields or profile constraints, generating a random Seed activates the applicable editor fields. A selected Cat profile instead limits variation to its supported defaults and any additional permitted fields the user enables.
- Manual edits freeze only the changed field. Preserve other enabled follow fields and the active character profile.
- The camera frame is always manually selected and never participates in Seed randomization. View pose is one supported follow field with bounded, composed movement; it must not become uncontrolled spinning.

## Pick motion after the static scene works

- Use Idle, Blink, Listening, Thinking, Working, or Nod for an ambient assistant.
- Use Wink or Playful for a lighthearted reaction; use Happy, Angry, Surprised, Excited, or Celebrate when the user explicitly requests that mood.
- Confirm animation keeps the chosen body, palette, profile identity, face readability, and composition. Set Once or Loop according to the intended product behavior.
- Preview the actual selected animation before GIF export. Do not substitute a still image or fabricate motion from screenshots.

## Practical examples

**"An angry orange cat for a support agent."** Select Cat, then Orange Tabby. Choose inward-tilted narrow rounded eyes, omit the mouth, preserve warm fur and paired tabby stripes, compose the head low in the camera, and enable only approved pattern variation.

**"A happy Siamese avatar that stays recognizable when randomized."** Select Cat, then Siamese. Keep the cream head, chocolate ears, centered dark elliptical muzzle, fixed muzzle position, and stripe-free face. Use open friendly rounded eyes; vary muzzle size and permitted framing without changing its breed palette.

**"A thoughtful dog looking in from the right."** Select the existing Dog entity. Use gently asymmetric focused eyes and an optional Listening or Thinking animation, place the character toward the right while facing inward, and preserve its authored ear geometry. Do not claim a dog-breed selector or unsupported procedural dog coat.

Deliver the final editable URL and, when requested, the verified export described in [export-verification.md](export-verification.md).
