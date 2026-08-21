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
  'Avatar controls': '形象控制',
  'Avatar outline': '形象描边',
  'Avatar settings': '形象设置',
  'Avatar shadow': '形象阴影',
  'Background': '背景',
  'Body': '形状',
  'Build': '构建',
  'Camera background': '相机背景',
  'Camera frame': '相框',
  'Capsule': '胶囊',
  'Circle': '圆形',
  'Color': '颜色',
  'Copy SVG': '复制 SVG',
  'Create': '创建',
  'Current position': '当前位置',
  'Curvature': '弧度',
  'Default face': '默认表情',
  'Dark theme': '深色主题',
  'Diamond': '菱形',
  'Direction': '方向',
  'Distance': '距离',
  'Download SVG': '下载 SVG',
  'Duration': '时长',
  'Editing': '正在编辑',
  'Easing': '缓动',
  'Effects': '效果',
  'Ellipse': '椭圆',
  'English': '英语',
  'Enter camera mode': '进入拍照模式',
  'Eyes': '眼睛',
  'Face': '面部',
  'Face parts': '面部组件',
  'Face shadow': '面部阴影',
  'Far': '远',
  'Flat': '平直',
  'Frame shadow': '相框阴影',
  'Frame': '帧',
  'First frame': '首帧',
  'Fixed position': '固定位置',
  'Frown': '皱眉',
  'Gap': '间距',
  'Gradient': '渐变',
  'Grid density': '网格密度',
  'Height': '高度',
  'Hide controls': '收起控制栏',
  'Hide controls sidebar': '收起控制侧栏',
  'High': '高',
  'Language': '语言',
  'Light theme': '浅色主题',
  'Left tilt': '左眼倾斜',
  'Less': '收起',
  'Light source': '光源',
  'Low': '低',
  'Mouth': '嘴巴',
  'More': '更多',
  'Name': '名称',
  'Near': '近',
  'Nose': '鼻子',
  'Opacity': '不透明度',
  'Open animation editor': '打开动画编辑器',
  'Open Avatar on GitHub': '在 GitHub 打开 Avatar',
  'Palette': '配色',
  'Position Y': '垂直位置',
  'Position': '位置',
  'Playback': '播放',
  'Loop': '循环',
  'Once': '单次',
  'Reset default face': '恢复默认表情',
  'Right tilt': '右眼倾斜',
  'Rotation': '旋转',
  'Rotation (overall)': '整体旋转',
  'Rounded': '圆角',
  'Rounded square': '圆角方形',
  'Roundness': '圆角程度',
  'Save a look to build your history.': '保存一个造型后会显示在这里。',
  'Save current preset': '保存当前预设',
  'Saved presets': '已保存预设',
  'Select language': '选择语言',
  'Selected avatar': '当前形象',
  'Show mouth': '显示嘴巴',
  'Show nose': '显示鼻子',
  'Simplified Chinese': '简体中文',
  'Smile': '微笑',
  'Softness': '柔和度',
  'Solid': '纯色',
  'Sphere': '球形',
  'Square': '方形',
  'Style': '样式',
  'Switch to dark theme': '切换到深色主题',
  'Switch to light theme': '切换到浅色主题',
  'Surface grid density': '表面网格密度',
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

export function AvatarLocaleProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocale] = useState<AvatarLocale>(getInitialAvatarLocale)
  const t = useCallback((text: string) => translateAvatarText(locale, text), [locale])

  useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem(AVATAR_LOCALE_STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t])

  return <AvatarLocaleContext.Provider value={value}>{children}</AvatarLocaleContext.Provider>
}

export const useAvatarLocale = () => {
  const context = useContext(AvatarLocaleContext)
  if (context == null) throw new Error('useAvatarLocale must be used within AvatarLocaleProvider')
  return context
}
