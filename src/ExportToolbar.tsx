import './ExportToolbar.scss'

import { useEffect, useRef, useState } from 'react'

import { useAvatarLocale } from './avatarLocale'

export const EXPORT_SIZES = [128, 256, 512] as const
export type ExportSize = (typeof EXPORT_SIZES)[number]

interface ExportToolbarProps {
  readonly copyState: 'copied' | 'idle'
  readonly exportSize: ExportSize
  readonly gifAvailable: boolean
  readonly gifExportState: 'error' | 'exporting' | 'idle'
  readonly onCopy: () => void
  readonly onDownload: () => void
  readonly onDownloadGif: () => Promise<boolean>
  readonly onDownloadPng: () => Promise<boolean>
  readonly onSizeChange: (size: ExportSize) => void
}

export function ExportToolbar({
  copyState,
  exportSize,
  gifAvailable,
  gifExportState,
  onCopy,
  onDownload,
  onDownloadGif,
  onDownloadPng,
  onSizeChange
}: ExportToolbarProps) {
  const { t } = useAvatarLocale()
  const [open, setOpen] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (toolbarRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={toolbarRef} className='avatar-export-toolbar'>
      <button
        className='avatar-export-toolbar__trigger'
        type='button'
        aria-label='Export avatar'
        aria-haspopup='menu'
        aria-expanded={open}
        title='Export avatar'
        onClick={() => setOpen(value => !value)}
      >
        <svg className='avatar-export-toolbar__icon' viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M10 3v9M6.8 6.2 10 3l3.2 3.2M4 10.5v5h12v-5' />
        </svg>
      </button>
      {open
        ? (
          <div className='avatar-export-toolbar__menu' role='menu' aria-label='Export options'>
            <div className='avatar-export-toolbar__size-row' role='none'>
              <label htmlFor='avatar-export-size'>{t('Size')}</label>
              <div className='avatar-export-toolbar__size-control'>
                <select
                  id='avatar-export-size'
                  className='avatar-export-toolbar__size'
                  aria-label='Export size'
                  value={exportSize}
                  onChange={event => onSizeChange(Number(event.target.value) as ExportSize)}
                >
                  {EXPORT_SIZES.map(size => <option key={size} value={size}>{size}px</option>)}
                </select>
                <svg viewBox='0 0 20 20' aria-hidden='true'>
                  <path d='m6 8 4 4 4-4' />
                </svg>
              </div>
            </div>
            <button
              className='avatar-export-toolbar__menu-action'
              type='button'
              role='menuitem'
              data-copied={copyState === 'copied'}
              onClick={() => {
                onCopy()
                setOpen(false)
              }}
            >
              <svg className='avatar-export-toolbar__icon' viewBox='0 0 20 20' aria-hidden='true'>
                <rect x='6.5' y='4' width='9' height='11' rx='1.5' />
                <path d='M4.5 7H4A1.5 1.5 0 0 0 2.5 8.5v6A1.5 1.5 0 0 0 4 16h7.5' />
              </svg>
              <span>{t(copyState === 'copied' ? 'SVG copied' : 'Copy SVG')}</span>
            </button>
            <button
              className='avatar-export-toolbar__menu-action'
              type='button'
              role='menuitem'
              onClick={() => {
                onDownload()
                setOpen(false)
              }}
            >
              <svg className='avatar-export-toolbar__icon' viewBox='0 0 20 20' aria-hidden='true'>
                <path d='M10 3.5v9M6.8 9.5l3.2 3.2 3.2-3.2M4 16h12' />
              </svg>
              <span>{t('Download SVG')}</span>
            </button>
            <button
              className='avatar-export-toolbar__menu-action'
              type='button'
              role='menuitem'
              onClick={() => {
                void onDownloadPng().then(succeeded => {
                  if (succeeded) setOpen(false)
                })
              }}
            >
              <svg className='avatar-export-toolbar__icon' viewBox='0 0 20 20' aria-hidden='true'>
                <rect x='3' y='4' width='14' height='12' rx='1.5' />
                <path d='m5.5 13 2.5-2.5 2 2 1.5-1.5 3 3M6.5 7.5h.01' />
              </svg>
              <span>{t('Download PNG')}</span>
            </button>
            <button
              className='avatar-export-toolbar__menu-action'
              type='button'
              role='menuitem'
              aria-label={!gifAvailable
                ? `${t('Download GIF')}. ${t('Select an animation first')}`
                : undefined}
              disabled={!gifAvailable || gifExportState === 'exporting'}
              title={!gifAvailable ? t('Select an animation first') : undefined}
              onClick={() => {
                void onDownloadGif().then(succeeded => {
                  if (succeeded) setOpen(false)
                })
              }}
            >
              <svg className='avatar-export-toolbar__icon' viewBox='0 0 20 20' aria-hidden='true'>
                <rect x='3' y='4' width='14' height='12' rx='1.5' />
                <path d='M6 7.5h3v5H6zM12 7.5h2.5M12 10h2M12 12.5h2.5' />
              </svg>
              <span aria-live='polite'>{t(
                gifExportState === 'exporting'
                  ? 'Exporting GIF…'
                  : gifExportState === 'error'
                  ? 'Retry GIF export'
                  : 'Download GIF'
              )}</span>
            </button>
          </div>
        )
        : null}
    </div>
  )
}
