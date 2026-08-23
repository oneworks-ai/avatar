# @oneworks/avatar-vue

[English](README.md) | [简体中文](README.zh-Hans.md)

OneWorks 3D Avatar 的 Vue 渲染组件与可嵌入完整编辑器。

```vue
<script setup lang="ts">
import { OneWorksAvatar, OneWorksAvatarEditor } from '@oneworks/avatar-vue'
import '@oneworks/avatar-vue/style.css'
</script>

<template>
  <OneWorksAvatar :definition="avatar" :animation-libraries="[supportAnimations]" />
  <OneWorksAvatarEditor :definition="avatar" @definition-change="avatar = $event" />
</template>
```

完整说明见 [Avatar 开发者接入指南](https://oneworks.cloud/docs/usage/avatar#开发者接入)。
