# @oneworks/avatar

[English](README.md) | [简体中文](README.zh-Hans.md)

Versioned, framework-neutral definitions and animation helpers for OneWorks 3D Avatar.

```ts
import {
  createDefaultAvatarDefinition,
  serializeAvatarDefinition
} from '@oneworks/avatar'

const definition = createDefaultAvatarDefinition()
const json = serializeAvatarDefinition(definition)
```

Seed individual parameters without encoding the whole Avatar in the Seed. Supported bindings include palette, background style, camera background, cat- and dog-ear dimensions, dog-head dimensions, face preset, coat-pattern controls, and `scene.view.pose`. A Seeded view uses one consistent moderate scale and lower composition, moves horizontally, and keeps its yaw and pitch close to the frame center with a small bounded variation. Roll remains zero, so rerolling never turns the Avatar upside down or around the screen plane:

```ts
import { resolveSeededAvatarView } from '@oneworks/avatar'

const view = resolveSeededAvatarView('v1-agent-42', definition.scene.view)
```

`scene.camera.frame` remains URL-persistent and manually selectable, but it never participates in Seed generation.

Procedural coat patterns are stored in `scene.appearance.coatPattern`; the model's continuous base material wraps the whole head, with one joined `face-mask` light region from the face to the chin. The optional `lightPatchLength`, `lightPatchWidth`, `lightPatchShape`, and `lightPatchOffsetY` fields respectively control that region's center-preserving two-way length, 60–200% width, `face-mask` / `ellipse` / `rounded` silhouette, and vertical position. Omitted fields retain the 100% `face-mask` and zero-offset defaults for backward compatibility. Density adds complete paired groups from the forehead M, eye lines, ear marks, front, flanks, and rear; at `0` only the continuous light region remains. Algorithm and thickness style every dark marking together, while layout jitter moves only variable markings and keeps feline landmark anchors recognizable. A Seed-following coat palette uses the built-in natural tabby candidates, while an explicitly selected fantasy palette remains untouched. Algorithm selection and pattern layout use independent Seed bindings, so fixing the algorithm does not freeze layout variation. Use `resolveAvatarCoatPatternDecals()` only when you need to materialize the generated result as editable decals.

The editor's Cat types (Siamese, British Shorthair, Russian Blue, Orange Tabby, Cow Cat, and Black Cat) are constrained Seed authoring profiles, not full-scene snapshots. Their concrete colors, parts, and coat values remain in `scene`; optional `metadata.generation.profileId` only restores the editor's allowed candidates and ranges. Changing the Seed affects only fields still listed in `metadata.generation.fields`, while a manual field edit freezes that concrete value. Framework renderers therefore stay definition-driven and do not need the Cat type catalog.

Dog types (Shiba Inu, Husky, Corgi, Golden Retriever, Border Collie, and Dalmatian) use the same definition-driven profile model: natural materials, actual 3D head and ear geometry, and surface-projected muzzle, blaze, mask, or deterministic spot markings stay in the scene while Seed may vary only the explicitly allowed natural fields. Each breed keeps independently editable head width and height within its own natural Seed range.

See the [Avatar Runtime guide](https://oneworks.cloud/docs/en/usage/avatar-runtime).
