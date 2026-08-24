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

Seed 只参与指定参数，不需要把整份 Avatar 配置编码进 Seed。支持的绑定包括配色、背景样式、相机背景、猫耳尺寸、面部预设、毛纹控制，以及 `scene.view.pose`。由 Seed 控制视图时会使用统一的适中大小与下沉构图，只随机左右位置；yaw 与 pitch 会在朝向画面中心的基础上做小幅受限变化，roll 始终为零，因此重新随机不会让形象倒置或在画面平面里转圈：

```ts
import { resolveSeededAvatarView } from '@oneworks/avatar'

const view = resolveSeededAvatarView('v1-agent-42', definition.scene.view)
```

`scene.camera.frame` 仍会保存在 URL 中并可手动选择，但绝不会参与 Seed 生成。

程序化毛色花纹保存在 `scene.appearance.coatPattern`；模型自身的连续底毛材质会包住整个头部，并以一块连贯的 `face-mask` 浅毛区从面部接到下巴。可选字段 `lightPatchLength`、`lightPatchWidth`、`lightPatchShape` 与 `lightPatchOffsetY` 分别控制这块浅色毛区围绕中心双向伸缩的长度、60–200% 宽度、`face-mask` / `ellipse` / `rounded` 轮廓及上下位置；缺失字段仍以 100% 的 `face-mask` 与零偏移默认值解析，保持旧定义兼容。密度会按完整成对组逐步加入额头 M 纹、眼角线、耳纹以及正面、侧面和后脑深纹；设为 `0` 时只保留连续浅毛区。算法和粗细会统一作用于全部深色纹路，纹样抖动只移动可变纹，猫科识别纹的锚点保持稳定。由 Seed 跟随的毛色只会从内置自然狸花候选中选择，用户明确选择的幻想配色则保持不变。算法选择与纹样布局使用独立的 Seed 跟随，因此固定算法不会冻结布局变化。只有需要把生成结果物化为可编辑贴花时，才调用 `resolveAvatarCoatPatternDecals()`。

编辑器里的猫咪类型（暹罗猫、英国短毛猫、俄罗斯蓝猫、橘色虎斑、奶牛猫和纯黑猫）是带约束的 Seed 创作配置，不是整份场景快照。具体颜色、部件和毛纹值仍保存在 `scene`；可选的 `metadata.generation.profileId` 只用于恢复编辑器允许的候选与范围。更换 Seed 只会改变仍列在 `metadata.generation.fields` 里的字段，手动修改某个字段后，该具体值就会固化。各框架渲染器仍然只依赖 definition，无需内置猫咪类型目录。

完整说明见 [Avatar Runtime 指南](https://oneworks.cloud/docs/usage/avatar-runtime)。
