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

Custom elements are registered only when you call `registerAvatarElements()` from `@oneworks/avatar-web/elements`.

See the [Vanilla JavaScript and Web Component guide](https://oneworks.cloud/docs/en/usage/avatar-web).
