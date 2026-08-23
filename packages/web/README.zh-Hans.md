# @oneworks/avatar-web

[English](README.md) | [简体中文](README.zh-Hans.md)

OneWorks 3D Avatar 的原生 JavaScript 挂载 API 与可选 Web Component。

```ts
import { createAvatar, createAvatarEditor } from '@oneworks/avatar-web'
import '@oneworks/avatar-web/style.css'

const avatar = createAvatar(document.querySelector('#avatar')!, { definition })
const editor = createAvatarEditor(document.querySelector('#editor')!, {
  definition
})
```

Web Component 不会自动注册；只有调用 `@oneworks/avatar-web/elements` 的 `registerAvatarElements()` 后才会写入全局注册表。

完整说明见 [原生 JavaScript 与 Web Component 指南](https://oneworks.cloud/docs/usage/avatar-web)。
