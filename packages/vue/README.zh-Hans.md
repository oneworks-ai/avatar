# @oneworks/avatar-vue

[English](README.md) | [简体中文](README.zh-Hans.md)

OneWorks 3D Avatar 的 Vue 渲染组件与可嵌入完整编辑器。

```vue
<script setup lang="ts">
import { OneWorksAvatar, OneWorksAvatarEditor } from '@oneworks/avatar-vue'
import '@oneworks/avatar-vue/style.css'
</script>

<template>
  <OneWorksAvatar
    :definition="avatar"
    :animation-libraries="[supportAnimations]"
  />
  <OneWorksAvatarEditor
    :definition="avatar"
    @definition-change="avatar = $event"
  />
</template>
```

运行时组件可通过 Vue props 直接接收编辑器的版本化多轨时间线：

```vue
<OneWorksAvatar
  :definition="avatar"
  :timeline="timeline"
  :timeline-loop="true"
  :timeline-speed="1"
  :resolve-timeline-preset="resolveTimelinePreset"
  autoplay
/>
```

组件暴露的 handle 还提供 `setTimeline`，已有的 `seek`、`pause`、`resume` 和 `stop`
会控制当前时间线。

自定义 Vue 编辑界面可以直接使用 SDK 暴露的选择器：

```vue
<OneWorksAvatarAnimationPicker
  :options="animationOptions"
  :value="selectedAnimationId"
  draggable
  @change="selectedAnimationId = $event.id"
  @drag-start="beginTimelineDrop($event.animation)"
/>
<OneWorksAvatarPresetPicker
  :options="avatarOptions"
  :value="selectedAvatarId"
  @change="avatar = $event.definition"
/>
```

组件名分别是 `OneWorksAvatarAnimationPicker` 和 `OneWorksAvatarPresetPicker`，均可直接从包中导入。

完整说明见 [Avatar Runtime 指南](https://oneworks.cloud/docs/usage/avatar-runtime#vue)。
