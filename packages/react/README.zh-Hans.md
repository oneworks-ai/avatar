# @oneworks/avatar-react

[English](README.md) | [简体中文](README.zh-Hans.md)

OneWorks 3D Avatar 的 React 渲染组件与可嵌入完整编辑器。

```tsx
import { Avatar, AvatarEditor } from '@oneworks/avatar-react'
import '@oneworks/avatar-react/style.css'

<Avatar definition={avatar} animationLibraries={[supportAnimations]} />
<AvatarEditor definition={avatar} animationLibraries={[supportAnimations]} />
```

渲染组件可直接接收编辑器使用的同版本多轨时间线：

```tsx
<Avatar
  definition={avatar}
  timeline={timeline}
  timelineTimeMs={0}
  timelineSpeed={1}
  timelineLoop
  autoplay
  resolveTimelinePreset={(source, instance) => resolvePreset(source, instance)}
/>
```

同时传入时，`timeline` 优先于旧的 `animation` 属性。不启用 `autoplay` 时可用
`timelineTimeMs` 渲染指定帧，也可以通过 ref 调用 `setTimeline(...)`、`seek`、`pause`、
`resume` 和 `stop`。内联片段无需 resolver；preset 片段由 `resolveTimelinePreset` 解析，
解析不到时遵循其 `fallback: 'skip'` 配置。

SDK 还提供紧凑的受控选择器，方便组合自己的编辑界面：

```tsx
import { AvatarAnimationPicker, AvatarPresetPicker } from '@oneworks/avatar-react'

<AvatarAnimationPicker
  draggable
  options={animationOptions}
  value={selectedAnimationId}
  onChange={option => setSelectedAnimationId(option.id)}
  onOptionDragStart={(option, event) => beginTimelineDrop(option.animation, event)}
/>
<AvatarPresetPicker
  options={avatarOptions}
  value={selectedAvatarId}
  onChange={option => setAvatar(option.definition)}
/>
```

两个选择器都使用 32px 预览格，支持受控选中状态和业务方提供的预览图。动画选择器
支持搜索与拖入时间线，但不会持有或改写源动画数据。

完整说明见 [Avatar Runtime 指南](https://oneworks.cloud/docs/usage/avatar-runtime#react)。
