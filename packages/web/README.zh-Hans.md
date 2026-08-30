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

编辑器时间线可以直接配置给运行时组件：

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

不使用 React 也可以挂载同样的动画与形象选择器：

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

动画选择器还会派发 `animationdragstart`，并通过
`application/vnd.oneworks.avatar-animation+json` 写入拖拽项标识，便于接入轨道编辑器。

`<oneworks-avatar>` Web Component 同样提供 `timeline`、`timelineLoop`、
`timelineSpeed`、`timelineTimeMs`、`resolveTimelinePreset` 和 `setTimeline` JavaScript API。

Web Component 不会自动注册；只有调用 `@oneworks/avatar-web/elements` 的 `registerAvatarElements()` 后才会写入全局注册表。

完整说明见 [原生 JavaScript 与 Web Component 指南](https://oneworks.cloud/docs/usage/avatar-web)。
