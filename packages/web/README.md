# @oneworks/avatar-web

[English](README.md) | [简体中文](README.zh-Hans.md)

Vanilla JavaScript mounts and opt-in Web Components for OneWorks 3D Avatar.

```ts
import { createAvatar, createAvatarEditor } from '@oneworks/avatar-web'
import '@oneworks/avatar-web/style.css'

const avatar = createAvatar(document.querySelector('#avatar')!, { definition })
const editor = createAvatarEditor(document.querySelector('#editor')!, {
  definition
})
```

Pass an editor timeline directly to the runtime mount:

```ts
const avatar = createAvatar(document.querySelector('#avatar')!, {
  autoplay: true,
  definition,
  resolveTimelinePreset,
  timeline,
  timelineLoop: true,
  timelineSpeed: 1
})

avatar.seek(1200)
avatar.setTimeline(nextTimeline, { loop: true, playing: true })
```

Mount the same compact animation and avatar selectors without React:

```ts
import { createAvatarAnimationPicker, createAvatarPresetPicker } from '@oneworks/avatar-web'

createAvatarAnimationPicker(document.querySelector('#animations')!, {
  draggable: true,
  options: animationOptions,
  value: selectedAnimationId
})
createAvatarPresetPicker(document.querySelector('#avatars')!, {
  options: avatarOptions,
  value: selectedAvatarId
})

document.querySelector('#animations')!.addEventListener('animationchange', event => {
  const { animation, option } = (event as CustomEvent).detail
})
document.querySelector('#avatars')!.addEventListener('avatarpresetchange', event => {
  const { definition, option } = (event as CustomEvent).detail
})
```

The animation mount also emits `animationdragstart` and writes the option identity to the drag
data transfer under `application/vnd.oneworks.avatar-animation+json`.

The `<oneworks-avatar>` custom element exposes the same `timeline`, `timelineLoop`,
`timelineSpeed`, `timelineTimeMs`, `resolveTimelinePreset`, and `setTimeline` JavaScript APIs.

Custom elements are registered only when you call `registerAvatarElements()` from `@oneworks/avatar-web/elements`.

See the [Vanilla JavaScript and Web Component guide](https://oneworks.cloud/docs/en/usage/avatar-web).
