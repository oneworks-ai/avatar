# OneWorks Avatar

[English](README.md) | [简体中文](README.zh-Hans.md)

OneWorks Avatar 是一个浏览器端 3D 几何头像编辑器，支持可继续编辑的分享链接，以及原生 SVG、PNG 和动画 GIF 导出。

在线编辑器：[oneworks.cloud/avatar](https://oneworks.cloud/avatar/)。

## Agent Skill

本仓库包含 `oneworks-avatar` Agent Skill，用于创建、调试、导出和接入头像：

```bash
npx skills@latest add oneworks-ai/avatar
```

这个 Skill 使用真实编辑器及其 3D 场景模型，不会通过图像生成器重新绘制结果。

## 当前可用的 3D 接入

当前接入方式将可编辑源与应用实际使用的资源分开保存：

```ts
interface AvatarAssetRecord {
  editorUrl: string
  assetUrl: string
  format: 'svg' | 'png' | 'gif'
  size: 128 | 256 | 512
}
```

- `editorUrl` 是编辑器生成的完整链接。应将其作为不可拆解的整体保存，以便日后重新打开和修改头像。
- `assetUrl` 指向上传到你自己的静态资源服务或媒体存储的导出文件。
- 编辑器链接不是图片直链，不能直接用于 `<img src>`。

导出的资源可以像普通图片一样接入：

```tsx
export function SupportAgentAvatar() {
  return (
    <img
      src='/avatars/support-agent.svg'
      width={96}
      height={96}
      alt='Support agent'
    />
  )
}
```

SVG 和 PNG 是当前 3D 场景的静态投影，GIF 包含所选动画。可导出 128、256、512 像素；相机背景可使用颜色或透明，相框可选方形、圆角或圆形。

优先通过 `<img src>` 或独立图片文件接入，不要把多个导出 SVG 字符串直接注入同一个文档。内部 SVG definition ID 不是面向多份 inline SVG 的公开契约。

编辑器生成的分享链接应视为不透明状态。其 query tuple 不是带版本的公开 API；不要手写或解析 `entityParts`、`animationData` 等内部参数。

## Runtime 边界

当前 3D 编辑器尚未提供公开的 React 组件、JavaScript/DOM renderer、带版本的 Avatar JSON definition、iframe/embed 模式或 `postMessage` 控制器。不要把编辑器内部模块当作 SDK 导入。

公开的 [`@oneworks/avatar`](https://github.com/oneworks-ai/app/blob/main/packages/avatar/README.zh-Hans.md) 是另一套 legacy 2D 像素表情 SVG renderer，适合生成确定性的应用占位头像；它不能读取或渲染 3D 编辑器场景。

## 源码关系

Legacy 像素 renderer、glyph geometry、palette、preset 和 seed helper 位于 `oneworks-ai/app` 的 `packages/avatar`。3D 编辑器与导出链路位于本仓库。

本仓库作为 `assets/avatar` submodule 挂载回 `oneworks-ai/app`。它独立于 app 根 workspace 构建，并通过 `app-source` checkout 或软链接使用共享包源码。

## 本地开发

在本仓库执行：

```bash
pnpm install --no-frozen-lockfile
ln -s /path/to/oneworks-app app-source
ONEWORKS_APP_SOURCE_DIR=app-source pnpm dev
ONEWORKS_APP_SOURCE_DIR=app-source pnpm build:app-source
```

## 部署

GitHub Pages 由本仓库的 `deploy-avatar.yml` workflow 发布。app 仓库在以下 Avatar 输入发生变化时触发它：

- `assets/avatar/**`
- `packages/avatar/**`
- `.github/workflows/deploy-avatar.yml`

Pages build 会检出两个仓库，按指定 app source revision 构建并发布 `dist`。
