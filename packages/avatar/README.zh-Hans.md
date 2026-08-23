# @oneworks/avatar

[English](README.md) | [简体中文](README.zh-Hans.md)

OneWorks 3D Avatar 的版本化、框架无关 definition 与动画工具。

```ts
import {
  createDefaultAvatarDefinition,
  serializeAvatarDefinition
} from '@oneworks/avatar'

const definition = createDefaultAvatarDefinition()
const json = serializeAvatarDefinition(definition)
```

完整说明见 [Avatar Runtime 指南](https://oneworks.cloud/docs/usage/avatar-runtime)。
