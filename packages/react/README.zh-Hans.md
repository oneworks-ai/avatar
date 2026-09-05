# @oneworks/avatar-react

[English](README.md) | [简体中文](README.zh-Hans.md)

OneWorks 3D Avatar 的 React 渲染组件与可嵌入完整编辑器。

只展示头像时，使用独立的渲染入口及其完整样式：

```tsx
import { Avatar } from '@oneworks/avatar-react/renderer'
import type { AvatarHandle } from '@oneworks/avatar-react/renderer'
import '@oneworks/avatar-react/renderer.css'
```

渲染入口保留动画播放和 capture 能力，不引用编辑器、预设缩略图或编辑器样式。
需要编辑器时，把组件和样式放在同一个动态加载边界：

```tsx
import { lazy, Suspense } from 'react'

const LazyEditor = lazy(async () => {
  const [editor] = await Promise.all([
    import('@oneworks/avatar-react/editor'),
    import('@oneworks/avatar-react/editor.css')
  ])
  return { default: editor.AvatarEditor }
})

// 仅在编辑器打开期间挂载。
<Suspense fallback={<span>正在加载编辑器…</span>}>
  <LazyEditor definition={avatar} />
</Suspense>
```

`editor.css` 包含完整编辑器及渲染样式。Vite 可以把这些包入口编译成业务应用自己的
chunks。包内预览图片使用带内容 hash 的独立文件与相对 URL；部署时保留消费端的完整
构建产物。单独导入编辑器模块不会请求全部预览图片。`exports` 定义入口，动态 import
决定加载时机。

原有根入口、选择器、公开类型与 `style.css` 保持兼容：

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
