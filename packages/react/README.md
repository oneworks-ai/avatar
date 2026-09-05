# @oneworks/avatar-react

[English](README.md) | [简体中文](README.zh-Hans.md)

React renderer and embeddable full editor for OneWorks 3D Avatar.

Display-only applications can select the renderer and its complete stylesheet:

```tsx
import { Avatar } from '@oneworks/avatar-react/renderer'
import type { AvatarHandle } from '@oneworks/avatar-react/renderer'
import '@oneworks/avatar-react/renderer.css'
```

The renderer entry includes animation playback and capture, without importing the
editor, preset thumbnails, or editor styles. To load the editor only when its UI
is opened, keep the module and its stylesheet behind the same dynamic boundary:

```tsx
import { lazy, Suspense } from 'react'

const LazyEditor = lazy(async () => {
  const [editor] = await Promise.all([
    import('@oneworks/avatar-react/editor'),
    import('@oneworks/avatar-react/editor.css')
  ])
  return { default: editor.AvatarEditor }
})

// Mount this boundary only while the editor is open.
<Suspense fallback={<span>Loading editor…</span>}>
  <LazyEditor definition={avatar} />
</Suspense>
```

`editor.css` includes the full editor and renderer styles. Vite can bundle these
package subpaths into an application's own chunks. The package ships preview
images as relative, hashed asset files; deploy the complete consuming build so
those URLs remain available. Merely importing the editor module does not fetch
every preview image. Subpath exports select modules; dynamic imports determine
when they are loaded.

The existing root entry, selectors, public types, and `style.css` remain supported:

```tsx
import { Avatar, AvatarEditor } from '@oneworks/avatar-react'
import '@oneworks/avatar-react/style.css'

<Avatar definition={avatar} animationLibraries={[supportAnimations]} />
<AvatarEditor definition={avatar} animationLibraries={[supportAnimations]} />
```

The renderer accepts the same versioned multi-track timeline used by the editor:

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

`timeline` takes precedence over the legacy `animation` prop. Use `timelineTimeMs` without
`autoplay` to render a specific frame, or call `ref.current.setTimeline(...)`, `seek`, `pause`,
`resume`, and `stop` for imperative playback. Inline timeline sources need no resolver; preset
sources use `resolveTimelinePreset` and follow their configured `fallback: 'skip'` behavior.

The package also exposes compact, controlled selectors for assembling custom editor surfaces:

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

Both selectors use 32 px preview cells, support controlled selection, and accept caller-owned
preview URLs. The animation selector can be searched and dragged into a timeline without owning
or mutating the source animation.

See the [Avatar Runtime guide](https://oneworks.cloud/docs/en/usage/avatar-runtime#react).
