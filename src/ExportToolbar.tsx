import './ExportToolbar.scss'

export const EXPORT_SIZES = [128, 256, 512] as const
export type ExportSize = (typeof EXPORT_SIZES)[number]

interface ExportToolbarProps {
  readonly copyState: 'copied' | 'idle'
  readonly exportSize: ExportSize
  readonly onCopy: () => void
  readonly onDownload: () => void
  readonly onSizeChange: (size: ExportSize) => void
}

export function ExportToolbar({
  copyState,
  exportSize,
  onCopy,
  onDownload,
  onSizeChange
}: ExportToolbarProps) {
  return (
    <div className='avatar-export-toolbar' aria-label='Export avatar'>
      <select
        className='avatar-export-toolbar__size'
        aria-label='Export size'
        value={exportSize}
        onChange={event => onSizeChange(Number(event.target.value) as ExportSize)}
      >
        {EXPORT_SIZES.map(size => <option key={size} value={size}>{size}px</option>)}
      </select>
      <button
        className='avatar-export-toolbar__action'
        type='button'
        aria-label={copyState === 'copied' ? 'SVG copied' : 'Copy SVG'}
        title={copyState === 'copied' ? 'SVG copied' : 'Copy SVG'}
        data-copied={copyState === 'copied'}
        onClick={onCopy}
      >
        <svg className='avatar-export-toolbar__icon' viewBox='0 0 20 20' aria-hidden='true'>
          <rect x='6.5' y='4' width='9' height='11' rx='1.5' />
          <path d='M4.5 7H4A1.5 1.5 0 0 0 2.5 8.5v6A1.5 1.5 0 0 0 4 16h7.5' />
        </svg>
      </button>
      <button
        className='avatar-export-toolbar__action'
        type='button'
        aria-label='Download SVG'
        title='Download SVG'
        onClick={onDownload}
      >
        <svg className='avatar-export-toolbar__icon' viewBox='0 0 20 20' aria-hidden='true'>
          <path d='M10 3.5v9M6.8 9.5l3.2 3.2 3.2-3.2M4 16h12' />
        </svg>
      </button>
    </div>
  )
}
