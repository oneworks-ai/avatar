import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type AvatarLocale = 'en' | 'zh-Hans'

export const AVATAR_LOCALES: readonly {
  readonly id: AvatarLocale
  readonly label: string
  readonly nativeLabel: string
}[] = [
  { id: 'zh-Hans', label: 'Simplified Chinese', nativeLabel: '简体中文' },
  { id: 'en', label: 'English', nativeLabel: 'English' }
]

const AVATAR_LOCALE_STORAGE_KEY = 'oneworks-avatar-locale'

const ZH_HANS_TRANSLATIONS: Readonly<Record<string, string>> = {
  'Angle': '角度',
  'Animation editor': '动画编辑器',
  'Animation group': '动画组',
  'Animation mode': '动画模式',
  'Animation name': '动画名称',
  'Add decal': '添加贴花',
  'Apply palette to all parts?': '将配色应用到所有部件？',
  'Apply to all': '全部应用',
  'Avatar type': '形象类型',
  'Avatar templates': '形象模板',
  'Avatar controls': '形象控制',
  'Avatar outline': '形象描边',
  'Avatar settings': '形象设置',
  'Avatar shadow': '形象阴影',
  'Background': '背景',
  'Big and small dots': '大小圆点',
  'Base': '基础色',
  'Back': '背面',
  'Body': '形状',
  'Bring your avatar to life': '让形象动起来',
  'Build': '构建',
  'Bun': '包子',
  'Camera background': '相机背景',
  'Camera frame': '相框',
  'Cat ear height': '猫耳高度',
  'Cat ear size': '猫耳尺寸',
  'Cat ear width': '猫耳宽度',
  'Cat types': '猫咪类型',
  'Cancel': '取消',
  'carousel': '轮播',
  'Cat': '小猫',
  'Bear': '小熊',
  'Capsule': '胶囊',
  'Circle': '圆形',
  'Close': '关闭',
  'Color': '颜色',
  'Cloud': '云',
  'Cone': '圆锥',
  'Cone roundness': '圆锥圆角',
  'Corner roundness': '圆角程度',
  'Copy SVG': '复制 SVG',
  'Create': '创建',
  'Curve': '曲线',
  'Current position': '当前位置',
  'Current avatar': '当前形象',
  'Curvature': '弧度',
  'Cut direction': '切面方向',
  'Default face': '默认表情',
  'Delete decal': '删除贴花',
  'Dark theme': '深色主题',
  'Diamond': '菱形',
  'Direction': '方向',
  'Distance': '距离',
  'Depth': '深度',
  'Ear height': '耳朵高度',
  'Ear width': '耳朵宽度',
  'Download SVG': '下载 SVG',
  'Download PNG': '下载 PNG',
  'Download GIF': '下载 GIF',
  'Dog': '小狗',
  'Dog ear height': '狗耳高度',
  'Dog ear size': '狗耳尺寸',
  'Dog ear width': '狗耳宽度',
  'Dog head height': '狗头高度',
  'Dog head size': '狗头尺寸',
  'Dog head width': '狗头宽度',
  'Dog types': '狗狗类型',
  'Shiba Inu': '柴犬',
  'Husky': '哈士奇',
  'Head height': '头部高度',
  'Head width': '头部宽度',
  'Corgi': '柯基',
  'Golden Retriever': '金毛',
  'Border Collie': '边牧',
  'Dalmatian': '斑点狗',
  'Duration': '时长',
  'Editing': '正在编辑',
  'Easing': '缓动',
  'Effects': '效果',
  'Entity parts': '实体部件',
  'Ellipse': '椭圆',
  'English': '英语',
  'Exporting GIF…': '正在导出 GIF…',
  'Enter camera mode': '进入拍照模式',
  'Exit animation group editing': '退出动画组编辑',
  'Eyes': '眼睛',
  'Eye highlights': '眼睛高光',
  'Eye highlight horizontal position': '眼睛高光横向位置',
  'Eye highlight opacity': '眼睛高光不透明度',
  'Eye highlight size': '眼睛高光大小',
  'Eye highlight vertical position': '眼睛高光纵向位置',
  'Face': '面部',
  'Flat lines': '双横线',
  'Face mask': '面部遮罩',
  'Alert': '警觉',
  'Bashful': '害羞',
  'Calm': '平静',
  'Cool': '酷',
  'Cute': '可爱',
  'Dizzy': '晕乎',
  'Face parts': '面部组件',
  'Face presets': '面部组合',
  'Face shadow': '面部阴影',
  'Follow Seed': '跟随 Seed',
  'Focused': '专注',
  'Far': '远',
  'Flat': '平直',
  'Frame shadow': '相框阴影',
  'Frame': '帧',
  'First frame': '首帧',
  'Fixed position': '固定位置',
  'Frustum': '圆台',
  'Frown': '皱眉',
  'Gap': '间距',
  'Gradient': '渐变',
  'Grid density': '网格密度',
  'Generate random Seed': '生成随机 Seed',
  'Height': '高度',
  'Happy': '开心',
  'Half cone': '半圆锥',
  'Highlight': '高光',
  'Highlight color': '高光颜色',
  'Highlight opacity': '高光透明度',
  'Highlight position X': '高光横向位置',
  'Highlight position Y': '高光纵向位置',
  'Highlight size': '高光大小',
  'Hide controls': '收起控制栏',
  'Hide controls sidebar': '收起控制侧栏',
  'High': '高',
  'Hollow': '空心',
  'Language': '语言',
  'Length': '长度',
  'Innocent': '无辜',
  'Light theme': '浅色主题',
  'Light coat patch': '浅色毛区',
  'Light coat patch shape': '浅色毛区形状',
  'Left tilt': '左眼倾斜',
  'Less': '收起',
  'Light source': '光源',
  'Low': '低',
  'Mouth': '嘴巴',
  'Mouth shape': '嘴巴形状',
  'Minimal': '极简',
  'Mixed signal': '竖横眼',
  'More': '更多',
  'More presets': '更多预设',
  'Name': '名称',
  'Near': '近',
  'Nose': '鼻子',
  'No presets found': '没有找到预设',
  'Opacity': '不透明度',
  'Off': '关闭',
  'Open animation editor': '打开动画编辑器',
  'Open Avatar on GitHub': '在 GitHub 打开 Avatar',
  'OneWorks Avatar home': 'OneWorks Avatar 首页',
  'Opening editor': '正在打开编辑器',
  'Palette': '配色',
  'Pixel color count': '像素色彩数量',
  'Pixel dithering': '像素抖动',
  'Pixel sampling': '像素采样',
  'Pixel size': '像素粒度',
  'Pixel style': '像素风',
  'Part': '部件',
  'Part material': '部件材质',
  'Playful': '俏皮',
  'Peek': '偷看',
  'Position Y': 'Y 位置',
  'Vertical position': '垂直位置',
  'View composition': '视图构图',
  'Position': '位置',
  'Position X': 'X 位置',
  'Position Z': 'Z 位置',
  'Rabbit': '小兔',
  'Radial pleats': '环形褶皱',
  'Playback': '播放',
  'Loop': '循环',
  'Once': '单次',
  'Reset default face': '恢复默认表情',
  'Right tilt': '右眼倾斜',
  'Retry GIF export': '重试导出 GIF',
  'Rotation': '旋转',
  'Rotation (overall)': '整体旋转',
  'Rotation X': 'X 轴旋转',
  'Rotation Y': 'Y 轴旋转',
  'Rotation Z': 'Z 轴旋转',
  'Rounded': '圆角',
  'Rounded triangle': '圆角三角形',
  'Side eye': '侧目',
  'Soft': '温柔',
  'Sparkle': '闪亮',
  'Squint': '眯眼',
  'Tiny': '小眼',
  'Rounded square': '圆角方形',
  'Rounded trapezoid': '圆角梯形',
  'Roundness': '圆角程度',
  'Save a look to build your history.': '保存一个造型后会显示在这里。',
  'Save current preset': '保存当前预设',
  'Saved presets': '已保存预设',
  'Saved preset': '已保存预设',
  'Saved looks': '已保存造型',
  'Seed': 'Seed',
  'Seed settings': 'Seed 设置',
  'Seeded fields': '跟随字段',
  'Search presets': '搜索预设',
  'Select avatar': '选择形象',
  'Select language': '选择语言',
  'Selected avatar': '当前形象',
  'Select an animation first': '请先选择一个动画',
  'Serious': '严肃',
  'Show mouth': '显示嘴巴',
  'Show nose': '显示鼻子',
  'Simplified Chinese': '简体中文',
  'Smile': '微笑',
  'Sleepy': '困倦',
  'Softness': '柔和度',
  'Solid': '纯色',
  'Sampling': '采样算法',
  'Shape': '形状',
  'Center': '中心点',
  'Dominant': '主色',
  'Median': '中值',
  'SLIC': 'SLIC 结构',
  'Colors': '色彩数量',
  'Dithering': '抖动',
  'Ordered': '有序抖动',
  'Sphere': '球形',
  'Square': '方形',
  'Start creating': '开始创造',
  'Surprise me': '随机一个',
  'Style': '样式',
  'Sun': '太阳',
  'Surprised': '惊讶',
  'Siamese': '暹罗猫',
  'British Shorthair': '英国短毛猫',
  'Russian Blue': '俄罗斯蓝猫',
  'Orange Tabby': '橘色虎斑',
  'Cow Cat': '奶牛猫',
  'Black Cat': '纯黑猫',
  'Teardrop': '水滴形',
  'This entity uses multiple materials. Applying this palette will replace all part colors.':
    '这个形象包含多种部件材质。应用此配色会覆盖所有部件颜色。',
  'Switch to dark theme': '切换到深色主题',
  'Switch to light theme': '切换到浅色主题',
  'Switch to': '切换到',
  'Transparent': '透明',
  'Surface grid density': '表面网格密度',
  'Surface decal': '曲面贴花',
  'Surface decal shape': '曲面贴花形状',
  'Tapered band': '渐细曲带',
  'Bend': '弯曲度',
  'Decal bend': '贴花弯曲度',
  'Surface decals': '曲面贴花',
  'Coat pattern': '毛色花纹',
  'Pattern algorithm': '花纹算法',
  'Pattern layout': '纹样布局',
  'Random': '随机',
  'Mackerel': '鱼骨纹',
  'Classic': '经典纹',
  'Broken': '断裂纹',
  'Spotted': '斑点纹',
  'Density': '密度',
  'Jitter': '抖动度',
  'Symmetry': '对称度',
  'Contrast': '对比度',
  'Breakup': '断裂度',
  'Convert to editable decals': '转为可编辑贴花',
  'Tabby pattern': '狸花纹',
  'Tabby coat patch': '狸花毛色色块',
  'Tabby spot': '狸花斑点',
  'Tabby stripe': '狸花条纹',
  'Surface side': '曲面朝向',
  'Face plane': '面部基准面',
  'Current Seed': '当前 Seed',
  'Decal height': '贴花高度',
  'Decal opacity': '贴花不透明度',
  'Decal position X': '贴花 X 位置',
  'Decal position Y': '贴花 Y 位置',
  'Decal rotation': '贴花旋转',
  'Decal width': '贴花宽度',
  'Target part': '目标部件',
  'Front': '正面',
  'Left': '左侧',
  'Right': '右侧',
  'SVG copied': '已复制 SVG',
  'Size': '尺寸',
  'Thickness': '粗细',
  'Triangle': '三角形',
  'Untitled animation': '未命名动画',
  'Width': '宽度'
}

export const normalizeAvatarLocale = (value: string | null | undefined): AvatarLocale | null => {
  if (value === 'en') return 'en'
  if (value === 'zh-Hans' || value === 'zh-CN' || value?.toLowerCase().startsWith('zh')) return 'zh-Hans'
  return null
}

export const translateAvatarText = (locale: AvatarLocale, text: string) => {
  return locale === 'zh-Hans' ? ZH_HANS_TRANSLATIONS[text] ?? text : text
}

const getInitialAvatarLocale = (): AvatarLocale => {
  if (typeof window === 'undefined') return 'en'
  return normalizeAvatarLocale(window.localStorage.getItem(AVATAR_LOCALE_STORAGE_KEY)) ??
    normalizeAvatarLocale(window.navigator.language) ??
    'en'
}

interface AvatarLocaleContextValue {
  readonly locale: AvatarLocale
  readonly setLocale: (locale: AvatarLocale) => void
  readonly t: (text: string) => string
}

const AvatarLocaleContext = createContext<AvatarLocaleContextValue | null>(null)

export function AvatarLocaleProvider({
  children,
  initialLocale,
  persist = true
}: {
  readonly children: ReactNode
  readonly initialLocale?: AvatarLocale
  readonly persist?: boolean
}) {
  const [locale, setLocale] = useState<AvatarLocale>(() => initialLocale ?? getInitialAvatarLocale())
  const t = useCallback((text: string) => translateAvatarText(locale, text), [locale])

  useEffect(() => {
    if (initialLocale != null) setLocale(initialLocale)
  }, [initialLocale])

  useEffect(() => {
    if (!persist) return
    document.documentElement.lang = locale
    window.localStorage.setItem(AVATAR_LOCALE_STORAGE_KEY, locale)
  }, [locale, persist])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t])

  return <AvatarLocaleContext.Provider value={value}>{children}</AvatarLocaleContext.Provider>
}

export const useAvatarLocale = () => {
  const context = useContext(AvatarLocaleContext)
  if (context == null) throw new Error('useAvatarLocale must be used within AvatarLocaleProvider')
  return context
}
