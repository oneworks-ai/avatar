import './App.scss'

import { useEffect, useMemo, useState } from 'react'

import {
  AGENT_AVATAR_EYES,
  AGENT_AVATAR_MOUTHS,
  AGENT_AVATAR_PALETTES,
  AGENT_AVATAR_PRESETS,
  createAgentAvatarDataUri,
  createAgentAvatarSvg,
  getAgentAvatarPalette,
  isSupportedAgentAvatarEmoticon
} from '@oneworks/agent-avatar'
import type { AgentAvatarBackgroundStyle, AgentAvatarPart, AgentAvatarSlot } from '@oneworks/agent-avatar'

const EXPORT_SIZES = [128, 256, 512] as const
const INITIAL_EMOTICON = AGENT_AVATAR_PRESETS[0]?.emoticon ?? '0w0'
const INITIAL_PARTS = Array.from(INITIAL_EMOTICON)
const COMMON_AVATAR_PRESETS = AGENT_AVATAR_PRESETS.slice(0, 18)
const DEFAULT_PALETTE_COUNT = 16
const DEFAULT_PALETTE_ID = AGENT_AVATAR_PALETTES[0]?.id ?? ''
const DEFAULT_BACKGROUND_STYLE: AgentAvatarBackgroundStyle = 'solid'
const DEFAULT_EXPORT_SIZE: (typeof EXPORT_SIZES)[number] = 256

interface AgentAvatarQueryConfig {
  readonly backgroundStyle: AgentAvatarBackgroundStyle
  readonly exportSize: (typeof EXPORT_SIZES)[number]
  readonly linkEyes: boolean
  readonly leftEye: string
  readonly mouth: string
  readonly rightEye: string
  readonly selectedPaletteId: string
  readonly selectedPresetId: string
  readonly showShadow: boolean
}

const isAgentAvatarBackgroundStyle = (value: string | null): value is AgentAvatarBackgroundStyle => {
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
  return AGENT_AVATAR_PRESETS.find(preset => preset.emoticon === emoticon && preset.paletteId === paletteId)?.id ?? ''
}

const getInitialQueryConfig = (): AgentAvatarQueryConfig => {
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
  const queryFace = params.get('face') ?? ''
  const emoticon = isSupportedAgentAvatarEmoticon(queryFace) ? queryFace : INITIAL_EMOTICON
  const parts = Array.from(emoticon)
  const queryPaletteId = params.get('palette') ?? ''
  const selectedPaletteId = AGENT_AVATAR_PALETTES.some(palette => palette.id === queryPaletteId)
    ? queryPaletteId
    : DEFAULT_PALETTE_ID
  const queryBackgroundStyle = params.get('bg')
  const backgroundStyle = isAgentAvatarBackgroundStyle(queryBackgroundStyle)
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
  readonly options: readonly AgentAvatarPart[]
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
    <div className='agent-avatar-app__part-row'>
      <span className='agent-avatar-app__part-row-label'>{label}</span>
      <div className='agent-avatar-app__part-options'>
        {options.map((part) => {
          const preview = previewForGlyph(part.glyph)
          return (
            <button
              key={part.id}
              className='agent-avatar-app__part-option'
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
    return AGENT_AVATAR_PALETTES.findIndex(palette => palette.id === initialConfig.selectedPaletteId) >=
      DEFAULT_PALETTE_COUNT
  })
  const [backgroundStyle, setBackgroundStyle] = useState<AgentAvatarBackgroundStyle>(initialConfig.backgroundStyle)
  const [showShadow, setShowShadow] = useState(initialConfig.showShadow)
  const [exportSize, setExportSize] = useState<(typeof EXPORT_SIZES)[number]>(initialConfig.exportSize)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const selectedPalette = getAgentAvatarPalette(selectedPaletteId)
  const previewEmoticon = `${leftEye}${mouth}${rightEye}`
  const previewSvg = useMemo(() => {
    return createAgentAvatarSvg({
      backgroundStyle,
      emoticon: previewEmoticon,
      palette: selectedPalette,
      showShadow,
      size: exportSize,
      title: `OneWorks ${previewEmoticon} agent avatar`
    })
  }, [backgroundStyle, exportSize, previewEmoticon, selectedPalette, showShadow])
  const visiblePalettes = useMemo(() => {
    return showMorePalettes ? AGENT_AVATAR_PALETTES : AGENT_AVATAR_PALETTES.slice(0, DEFAULT_PALETTE_COUNT)
  }, [showMorePalettes])
  const hiddenPaletteCount = Math.max(AGENT_AVATAR_PALETTES.length - DEFAULT_PALETTE_COUNT, 0)

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
    return createAgentAvatarDataUri({
      backgroundStyle,
      emoticon: previewEmoticon,
      palette: selectedPalette,
      showShadow,
      size: exportSize,
      title: `OneWorks ${previewEmoticon} agent avatar`
    })
  }, [backgroundStyle, exportSize, previewEmoticon, selectedPalette, showShadow])

  const updatePart = (slot: AgentAvatarSlot, glyph: string) => {
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
    const preset = AGENT_AVATAR_PRESETS.find(item => item.id === presetId)
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

  const getPartPreviewEmoticon = (slot: AgentAvatarSlot, glyph: string) => {
    const nextLeftEye = slot === 'left' || (slot === 'right' && linkEyes) ? glyph : leftEye
    const nextMouth = slot === 'mouth' ? glyph : mouth
    const nextRightEye = slot === 'right' || (slot === 'left' && linkEyes) ? glyph : rightEye
    return `${nextLeftEye}${nextMouth}${nextRightEye}`
  }

  const getPartPreview = (
    slot: AgentAvatarSlot,
    glyph: string,
    highlightSlot: AgentAvatarSlot | readonly AgentAvatarSlot[] = slot
  ): PartPreview => {
    const emoticon = getPartPreviewEmoticon(slot, glyph)
    return {
      emoticon,
      uri: createAgentAvatarDataUri({
        backgroundStyle,
        dimInactiveGlyphs: true,
        emoticon,
        highlightSlot,
        palette: selectedPalette,
        showShadow,
        size: 128,
        title: `OneWorks ${emoticon} agent avatar`
      })
    }
  }

  return (
    <main className='agent-avatar-app'>
      <section className='agent-avatar-app__workspace'>
        <section className='agent-avatar-app__stage' aria-label='Selected avatar'>
          <div className='agent-avatar-app__stage-preview'>
            <div className='agent-avatar-app__preview-art agent-avatar-app__preview-art--hero'>
              <img src={previewUri} alt={`${previewEmoticon} avatar preview`} />
            </div>
          </div>

          <section className='agent-avatar-app__common' aria-label='Common avatars'>
            <div className='agent-avatar-app__common-list'>
              {COMMON_AVATAR_PRESETS.map((preset) => {
                const palette = getAgentAvatarPalette(preset.paletteId)
                const uri = createAgentAvatarDataUri({
                  backgroundStyle,
                  emoticon: preset.emoticon,
                  palette,
                  showShadow,
                  size: 256,
                  title: `OneWorks ${preset.emoticon} agent avatar`
                })
                return (
                  <button
                    key={preset.id}
                    className='agent-avatar-app__common-card'
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

        <aside className='agent-avatar-app__controls' aria-label='Avatar controls'>
          <div className='agent-avatar-app__field-group'>
            <span className='agent-avatar-app__label'>Build</span>
            <div className='agent-avatar-app__toggle-row'>
              <span className='agent-avatar-app__toggle-label'>Match eyes</span>
              <button
                className='agent-avatar-app__switch'
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
            <div className='agent-avatar-app__part-builder'>
              {linkEyes
                ? (
                  <PartPicker
                    label='Eyes'
                    options={AGENT_AVATAR_EYES}
                    previewForGlyph={glyph => getPartPreview('left', glyph, ['left', 'right'])}
                    value={leftEye}
                    onChange={glyph => updatePart('left', glyph)}
                  />
                )
                : (
                  <div className='agent-avatar-app__eye-grid'>
                    <PartPicker
                      label='Left eye'
                      options={AGENT_AVATAR_EYES}
                      previewForGlyph={glyph => getPartPreview('left', glyph)}
                      value={leftEye}
                      onChange={glyph => updatePart('left', glyph)}
                    />
                    <PartPicker
                      label='Right eye'
                      options={AGENT_AVATAR_EYES}
                      previewForGlyph={glyph => getPartPreview('right', glyph)}
                      value={rightEye}
                      onChange={glyph => updatePart('right', glyph)}
                    />
                  </div>
                )}
              <PartPicker
                label='Mouth / Nose'
                options={AGENT_AVATAR_MOUTHS}
                previewForGlyph={glyph => getPartPreview('mouth', glyph)}
                value={mouth}
                onChange={glyph => updatePart('mouth', glyph)}
              />
            </div>
          </div>

          <div className='agent-avatar-app__field-group'>
            <span className='agent-avatar-app__label'>Palette</span>
            <div className='agent-avatar-app__swatches'>
              {visiblePalettes.map((palette) => (
                <button
                  key={palette.id}
                  className='agent-avatar-app__swatch'
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
                  className='agent-avatar-app__palette-more'
                  type='button'
                  aria-expanded={showMorePalettes}
                  onClick={() => setShowMorePalettes(value => !value)}
                >
                  {showMorePalettes ? 'Less' : `More ${hiddenPaletteCount}`}
                </button>
              )
              : null}
          </div>

          <div className='agent-avatar-app__field-group'>
            <span className='agent-avatar-app__label'>Background</span>
            <div className='agent-avatar-app__segments' style={{ '--segment-count': 2 } as React.CSSProperties}>
              {(['solid', 'gradient'] satisfies AgentAvatarBackgroundStyle[]).map(style => (
                <button
                  key={style}
                  className='agent-avatar-app__segment'
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

          <div className='agent-avatar-app__field-group'>
            <span className='agent-avatar-app__label'>Effects</span>
            <div className='agent-avatar-app__toggle-row'>
              <span className='agent-avatar-app__toggle-label'>Pixel shadow</span>
              <button
                className='agent-avatar-app__switch'
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

          <div className='agent-avatar-app__field-group'>
            <span className='agent-avatar-app__label'>Export</span>
            <div className='agent-avatar-app__segments'>
              {EXPORT_SIZES.map(size => (
                <button
                  key={size}
                  className='agent-avatar-app__segment'
                  type='button'
                  aria-pressed={size === exportSize}
                  onClick={() => setExportSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className='agent-avatar-app__commands'>
            <button
              className='agent-avatar-app__command'
              type='button'
              onClick={handleCopy}
            >
              <span className='agent-avatar-app__copy-icon' aria-hidden='true' />
              {copyState === 'copied' ? 'Copied' : 'Copy SVG'}
            </button>
            <button
              className='agent-avatar-app__command'
              type='button'
              onClick={handleDownload}
            >
              <span className='agent-avatar-app__download-icon' aria-hidden='true' />
              Download
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
