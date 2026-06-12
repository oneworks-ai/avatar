import './App.scss'

import { useEffect, useMemo, useState } from 'react'

import {
  AVATAR_EYES,
  AVATAR_MOUTHS,
  AVATAR_PALETTES,
  AVATAR_PRESETS,
  createAvatarDataUri,
  createAvatarSvg,
  getAvatarPalette,
  isSupportedAvatarEmoticon
} from '@oneworks/avatar'
import type { AvatarBackgroundStyle, AvatarPart, AvatarSlot } from '@oneworks/avatar'

const EXPORT_SIZES = [128, 256, 512] as const
const INITIAL_EMOTICON = AVATAR_PRESETS[0]?.emoticon ?? '0w0'
const INITIAL_PARTS = Array.from(INITIAL_EMOTICON)
const COMMON_AVATAR_PRESETS = AVATAR_PRESETS.slice(0, 18)
const DEFAULT_PALETTE_COUNT = 16
const DEFAULT_PALETTE_ID = AVATAR_PALETTES[0]?.id ?? ''
const DEFAULT_BACKGROUND_STYLE: AvatarBackgroundStyle = 'solid'
const DEFAULT_EXPORT_SIZE: (typeof EXPORT_SIZES)[number] = 256

interface AvatarQueryConfig {
  readonly backgroundStyle: AvatarBackgroundStyle
  readonly exportSize: (typeof EXPORT_SIZES)[number]
  readonly linkEyes: boolean
  readonly leftEye: string
  readonly mouth: string
  readonly rightEye: string
  readonly selectedPaletteId: string
  readonly selectedPresetId: string
  readonly showShadow: boolean
}

const isAvatarBackgroundStyle = (value: string | null): value is AvatarBackgroundStyle => {
  return value === 'solid' || value === 'gradient'
}

const parseExportSize = (value: string | null): (typeof EXPORT_SIZES)[number] => {
  const parsed = Number(value)
  return EXPORT_SIZES.includes(parsed as (typeof EXPORT_SIZES)[number])
    ? (parsed as (typeof EXPORT_SIZES)[number])
    : DEFAULT_EXPORT_SIZE
}

const parseShadow = (value: string | null) => value === '1' || value === 'true'

const parseLinkEyes = (value: string | null, leftEye: string, rightEye: string) => {
  if (value === '1' || value === 'true' || value === 'same') return true
  if (value === '0' || value === 'false' || value === 'split') return false
  return leftEye === rightEye
}

const getPresetIdForConfig = (emoticon: string, paletteId: string) => {
  return AVATAR_PRESETS.find(preset => preset.emoticon === emoticon && preset.paletteId === paletteId)?.id ?? ''
}

const getInitialQueryConfig = (): AvatarQueryConfig => {
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
  const queryFace = params.get('face') ?? ''
  const emoticon = isSupportedAvatarEmoticon(queryFace) ? queryFace : INITIAL_EMOTICON
  const parts = Array.from(emoticon)
  const queryPaletteId = params.get('palette') ?? ''
  const selectedPaletteId = AVATAR_PALETTES.some(palette => palette.id === queryPaletteId)
    ? queryPaletteId
    : DEFAULT_PALETTE_ID
  const queryBackgroundStyle = params.get('bg')
  const backgroundStyle = isAvatarBackgroundStyle(queryBackgroundStyle)
    ? queryBackgroundStyle
    : DEFAULT_BACKGROUND_STYLE
  const leftEye = parts[0] ?? INITIAL_PARTS[0] ?? '0'
  const mouth = parts[1] ?? INITIAL_PARTS[1] ?? 'w'
  const queryRightEye = parts[2] ?? INITIAL_PARTS[2] ?? '0'
  const linkEyes = parseLinkEyes(params.get('eyes'), leftEye, queryRightEye)
  const rightEye = linkEyes ? leftEye : queryRightEye
  const normalizedEmoticon = `${leftEye}${mouth}${rightEye}`

  return {
    backgroundStyle,
    exportSize: parseExportSize(params.get('size')),
    leftEye,
    linkEyes,
    mouth,
    rightEye,
    selectedPaletteId,
    selectedPresetId: getPresetIdForConfig(normalizedEmoticon, selectedPaletteId),
    showShadow: parseShadow(params.get('shadow'))
  }
}

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

interface PartPickerProps {
  readonly label: string
  readonly options: readonly AvatarPart[]
  readonly previewForGlyph: (glyph: string) => PartPreview
  readonly value: string
  readonly onChange: (glyph: string) => void
}

interface PartPreview {
  readonly emoticon: string
  readonly uri: string
}

function PartPicker({ label, onChange, options, previewForGlyph, value }: PartPickerProps) {
  return (
    <div className='avatar-app__part-row'>
      <span className='avatar-app__part-row-label'>{label}</span>
      <div className='avatar-app__part-options'>
        {options.map((part) => {
          const preview = previewForGlyph(part.glyph)
          return (
            <button
              key={part.id}
              className='avatar-app__part-option'
              type='button'
              aria-label={`${label} ${part.label}: ${preview.emoticon}`}
              aria-pressed={part.glyph === value}
              onClick={() => onChange(part.glyph)}
            >
              <img src={preview.uri} alt='' aria-hidden='true' />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function App() {
  const [initialConfig] = useState(getInitialQueryConfig)
  const [selectedPresetId, setSelectedPresetId] = useState(initialConfig.selectedPresetId)
  const [leftEye, setLeftEye] = useState(initialConfig.leftEye)
  const [mouth, setMouth] = useState(initialConfig.mouth)
  const [rightEye, setRightEye] = useState(initialConfig.rightEye)
  const [linkEyes, setLinkEyes] = useState(initialConfig.linkEyes)
  const [selectedPaletteId, setSelectedPaletteId] = useState(initialConfig.selectedPaletteId)
  const [showMorePalettes, setShowMorePalettes] = useState(() => {
    return AVATAR_PALETTES.findIndex(palette => palette.id === initialConfig.selectedPaletteId) >=
      DEFAULT_PALETTE_COUNT
  })
  const [backgroundStyle, setBackgroundStyle] = useState<AvatarBackgroundStyle>(initialConfig.backgroundStyle)
  const [showShadow, setShowShadow] = useState(initialConfig.showShadow)
  const [exportSize, setExportSize] = useState<(typeof EXPORT_SIZES)[number]>(initialConfig.exportSize)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const selectedPalette = getAvatarPalette(selectedPaletteId)
  const previewEmoticon = `${leftEye}${mouth}${rightEye}`
  const previewSvg = useMemo(() => {
    return createAvatarSvg({
      backgroundStyle,
      emoticon: previewEmoticon,
      palette: selectedPalette,
      showShadow,
      size: exportSize,
      title: `OneWorks ${previewEmoticon} avatar`
    })
  }, [backgroundStyle, exportSize, previewEmoticon, selectedPalette, showShadow])
  const visiblePalettes = useMemo(() => {
    return showMorePalettes ? AVATAR_PALETTES : AVATAR_PALETTES.slice(0, DEFAULT_PALETTE_COUNT)
  }, [showMorePalettes])
  const hiddenPaletteCount = Math.max(AVATAR_PALETTES.length - DEFAULT_PALETTE_COUNT, 0)

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('face', previewEmoticon)
    params.set('palette', selectedPalette.id)
    params.set('bg', backgroundStyle)
    params.set('eyes', linkEyes ? '1' : '0')
    params.set('shadow', showShadow ? '1' : '0')
    params.set('size', String(exportSize))

    const nextSearch = `?${params.toString()}`
    if (window.location.search === nextSearch) return

    const nextUrl = new URL(window.location.href)
    nextUrl.search = params.toString()
    window.history.replaceState(null, '', nextUrl)
  }, [backgroundStyle, exportSize, linkEyes, previewEmoticon, selectedPalette.id, showShadow])
  const previewUri = useMemo(() => {
    return createAvatarDataUri({
      backgroundStyle,
      emoticon: previewEmoticon,
      palette: selectedPalette,
      showShadow,
      size: exportSize,
      title: `OneWorks ${previewEmoticon} avatar`
    })
  }, [backgroundStyle, exportSize, previewEmoticon, selectedPalette, showShadow])

  const updatePart = (slot: AvatarSlot, glyph: string) => {
    const nextLeftEye = slot === 'left' || (slot === 'right' && linkEyes) ? glyph : leftEye
    const nextMouth = slot === 'mouth' ? glyph : mouth
    const nextRightEye = slot === 'right' || (slot === 'left' && linkEyes) ? glyph : rightEye
    setLeftEye(nextLeftEye)
    setMouth(nextMouth)
    setRightEye(nextRightEye)
    setSelectedPresetId('')
    setCopyState('idle')
  }

  const handlePresetSelect = (presetId: string) => {
    const preset = AVATAR_PRESETS.find(item => item.id === presetId)
    if (preset == null) return
    const parts = Array.from(preset.emoticon)
    setSelectedPresetId(preset.id)
    setLeftEye(parts[0] ?? '0')
    setMouth(parts[1] ?? 'w')
    setRightEye(parts[2] ?? '0')
    setLinkEyes((parts[0] ?? '0') === (parts[2] ?? '0'))
    setSelectedPaletteId(preset.paletteId)
    setCopyState('idle')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(previewSvg)
    setCopyState('copied')
    window.setTimeout(() => setCopyState('idle'), 1400)
  }

  const handleDownload = () => {
    downloadTextFile(`oneworks-agent-${previewEmoticon}-${exportSize}.svg`, previewSvg)
  }

  const getPartPreviewEmoticon = (slot: AvatarSlot, glyph: string) => {
    const nextLeftEye = slot === 'left' || (slot === 'right' && linkEyes) ? glyph : leftEye
    const nextMouth = slot === 'mouth' ? glyph : mouth
    const nextRightEye = slot === 'right' || (slot === 'left' && linkEyes) ? glyph : rightEye
    return `${nextLeftEye}${nextMouth}${nextRightEye}`
  }

  const getPartPreview = (
    slot: AvatarSlot,
    glyph: string,
    highlightSlot: AvatarSlot | readonly AvatarSlot[] = slot
  ): PartPreview => {
    const emoticon = getPartPreviewEmoticon(slot, glyph)
    return {
      emoticon,
      uri: createAvatarDataUri({
        backgroundStyle,
        dimInactiveGlyphs: true,
        emoticon,
        highlightSlot,
        palette: selectedPalette,
        showShadow,
        size: 128,
        title: `OneWorks ${emoticon} avatar`
      })
    }
  }

  return (
    <main className='avatar-app'>
      <section className='avatar-app__workspace'>
        <section className='avatar-app__stage' aria-label='Selected avatar'>
          <div className='avatar-app__stage-preview'>
            <div className='avatar-app__preview-art avatar-app__preview-art--hero'>
              <img src={previewUri} alt={`${previewEmoticon} avatar preview`} />
            </div>
          </div>

          <section className='avatar-app__common' aria-label='Common avatars'>
            <div className='avatar-app__common-list'>
              {COMMON_AVATAR_PRESETS.map((preset) => {
                const palette = getAvatarPalette(preset.paletteId)
                const uri = createAvatarDataUri({
                  backgroundStyle,
                  emoticon: preset.emoticon,
                  palette,
                  showShadow,
                  size: 256,
                  title: `OneWorks ${preset.emoticon} avatar`
                })
                return (
                  <button
                    key={preset.id}
                    className='avatar-app__common-card'
                    type='button'
                    aria-label={`Use ${preset.emoticon}`}
                    aria-pressed={preset.id === selectedPresetId}
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    <img src={uri} alt={`${preset.emoticon} avatar`} />
                  </button>
                )
              })}
            </div>
          </section>
        </section>

        <aside className='avatar-app__controls' aria-label='Avatar controls'>
          <div className='avatar-app__field-group'>
            <span className='avatar-app__label'>Build</span>
            <div className='avatar-app__toggle-row'>
              <span className='avatar-app__toggle-label'>Match eyes</span>
              <button
                className='avatar-app__switch'
                type='button'
                role='switch'
                aria-label='Match eyes'
                aria-checked={linkEyes}
                onClick={() => {
                  setLinkEyes((value) => {
                    const nextValue = !value
                    if (nextValue) {
                      setRightEye(leftEye)
                      setSelectedPresetId('')
                    }
                    return nextValue
                  })
                  setCopyState('idle')
                }}
              >
                <span />
              </button>
            </div>
            <div className='avatar-app__part-builder'>
              {linkEyes
                ? (
                  <PartPicker
                    label='Eyes'
                    options={AVATAR_EYES}
                    previewForGlyph={glyph => getPartPreview('left', glyph, ['left', 'right'])}
                    value={leftEye}
                    onChange={glyph => updatePart('left', glyph)}
                  />
                )
                : (
                  <div className='avatar-app__eye-grid'>
                    <PartPicker
                      label='Left eye'
                      options={AVATAR_EYES}
                      previewForGlyph={glyph => getPartPreview('left', glyph)}
                      value={leftEye}
                      onChange={glyph => updatePart('left', glyph)}
                    />
                    <PartPicker
                      label='Right eye'
                      options={AVATAR_EYES}
                      previewForGlyph={glyph => getPartPreview('right', glyph)}
                      value={rightEye}
                      onChange={glyph => updatePart('right', glyph)}
                    />
                  </div>
                )}
              <PartPicker
                label='Mouth / Nose'
                options={AVATAR_MOUTHS}
                previewForGlyph={glyph => getPartPreview('mouth', glyph)}
                value={mouth}
                onChange={glyph => updatePart('mouth', glyph)}
              />
            </div>
          </div>

          <div className='avatar-app__field-group'>
            <span className='avatar-app__label'>Palette</span>
            <div className='avatar-app__swatches'>
              {visiblePalettes.map((palette) => (
                <button
                  key={palette.id}
                  className='avatar-app__swatch'
                  type='button'
                  aria-label={palette.name}
                  aria-pressed={palette.id === selectedPalette.id}
                  style={{
                    '--avatar-bg': palette.background,
                    '--avatar-bg-end': palette.gradient[1],
                    '--avatar-fg': palette.foreground
                  } as React.CSSProperties}
                  onClick={() => {
                    setSelectedPaletteId(palette.id)
                    setCopyState('idle')
                  }}
                >
                  <span />
                </button>
              ))}
            </div>
            {hiddenPaletteCount > 0
              ? (
                <button
                  className='avatar-app__palette-more'
                  type='button'
                  aria-expanded={showMorePalettes}
                  onClick={() => setShowMorePalettes(value => !value)}
                >
                  {showMorePalettes ? 'Less' : `More ${hiddenPaletteCount}`}
                </button>
              )
              : null}
          </div>

          <div className='avatar-app__field-group'>
            <span className='avatar-app__label'>Background</span>
            <div className='avatar-app__segments' style={{ '--segment-count': 2 } as React.CSSProperties}>
              {(['solid', 'gradient'] satisfies AvatarBackgroundStyle[]).map(style => (
                <button
                  key={style}
                  className='avatar-app__segment'
                  type='button'
                  aria-pressed={style === backgroundStyle}
                  onClick={() => {
                    setBackgroundStyle(style)
                    setCopyState('idle')
                  }}
                >
                  {style === 'solid' ? 'Solid' : 'Gradient'}
                </button>
              ))}
            </div>
          </div>

          <div className='avatar-app__field-group'>
            <span className='avatar-app__label'>Effects</span>
            <div className='avatar-app__toggle-row'>
              <span className='avatar-app__toggle-label'>Pixel shadow</span>
              <button
                className='avatar-app__switch'
                type='button'
                role='switch'
                aria-label='Pixel shadow'
                aria-checked={showShadow}
                onClick={() => {
                  setShowShadow(value => !value)
                  setCopyState('idle')
                }}
              >
                <span />
              </button>
            </div>
          </div>

          <div className='avatar-app__field-group'>
            <span className='avatar-app__label'>Export</span>
            <div className='avatar-app__segments'>
              {EXPORT_SIZES.map(size => (
                <button
                  key={size}
                  className='avatar-app__segment'
                  type='button'
                  aria-pressed={size === exportSize}
                  onClick={() => setExportSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className='avatar-app__commands'>
            <button
              className='avatar-app__command'
              type='button'
              onClick={handleCopy}
            >
              <span className='avatar-app__copy-icon' aria-hidden='true' />
              {copyState === 'copied' ? 'Copied' : 'Copy SVG'}
            </button>
            <button
              className='avatar-app__command'
              type='button'
              onClick={handleDownload}
            >
              <span className='avatar-app__download-icon' aria-hidden='true' />
              Download
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
