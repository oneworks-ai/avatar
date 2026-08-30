# @oneworks/avatar-vue

[English](README.md) | [简体中文](README.zh-Hans.md)

Vue renderer and embeddable full editor for OneWorks 3D Avatar.

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

The renderer accepts the editor's versioned multi-track timeline through Vue props:

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

The exposed component handle also provides `setTimeline`, while `seek`, `pause`, `resume`, and
`stop` control the configured timeline.

Use the exported selectors in a custom Vue editor:

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

Import them as `OneWorksAvatarAnimationPicker` and `OneWorksAvatarPresetPicker` from the package.

See the [Avatar Runtime guide](https://oneworks.cloud/docs/en/usage/avatar-runtime#vue).
