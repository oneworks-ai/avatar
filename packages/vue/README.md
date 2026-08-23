# @oneworks/avatar-vue

[English](README.md) | [简体中文](README.zh-Hans.md)

Vue renderer and embeddable full editor for OneWorks 3D Avatar.

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

See the [Avatar developer guide](https://oneworks.cloud/docs/en/usage/avatar#developer-integration).
