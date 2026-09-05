import './pickers.scss'

import { useMemo, useState } from 'react'
import type { DragEvent, HTMLAttributes } from 'react'
import type { AvatarAnimationClip, AvatarAnimationRef, AvatarDefinition } from '@oneworks/avatar'
import { Avatar } from './renderer'
import type { AvatarTheme } from './renderer'

export interface AvatarAnimationPickerOption {
  readonly animation: AvatarAnimationClip | AvatarAnimationRef
  readonly description?: string
  readonly disabled?: boolean
  readonly id: string
  readonly keywords?: readonly string[]
  readonly label: string
  readonly previewUrl?: string
}

export interface AvatarAnimationPickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'onDragStart'
> {
  readonly draggable?: boolean
  readonly emptyLabel?: string
  readonly onChange?: (option: AvatarAnimationPickerOption) => void
  readonly onOptionDragStart?: (
    option: AvatarAnimationPickerOption,
    event: DragEvent<HTMLButtonElement>
  ) => void
  readonly options: readonly AvatarAnimationPickerOption[]
  readonly placeholder?: string
  readonly searchable?: boolean
  readonly value?: string | null
}

export interface AvatarPresetPickerOption {
  readonly definition: AvatarDefinition
  readonly disabled?: boolean
  readonly id: string
  readonly keywords?: readonly string[]
  readonly label: string
  readonly previewUrl?: string
}

export interface AvatarPresetPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  readonly emptyLabel?: string
  readonly onChange?: (option: AvatarPresetPickerOption) => void
  readonly options: readonly AvatarPresetPickerOption[]
  readonly placeholder?: string
  readonly searchable?: boolean
  readonly theme?: AvatarTheme
  readonly value?: string | null
}

const matchesPickerQuery = (
  option: Pick<AvatarAnimationPickerOption, 'description' | 'id' | 'keywords' | 'label'>,
  query: string
) => {
  const normalized = query.trim().toLocaleLowerCase()
  return normalized === '' || [
    option.id,
    option.label,
    option.description ?? '',
    ...(option.keywords ?? [])
  ].some(value => value.toLocaleLowerCase().includes(normalized))
}

export function AvatarAnimationPicker({
  className,
  draggable = false,
  emptyLabel = 'No animations found',
  onChange,
  onOptionDragStart,
  options,
  placeholder = 'Search animations',
  searchable = true,
  value,
  ...divProps
}: AvatarAnimationPickerProps) {
  const [query, setQuery] = useState('')
  const visibleOptions = useMemo(
    () => options.filter(option => matchesPickerQuery(option, query)),
    [options, query]
  )
  return (
    <div
      {...divProps}
      className={`oneworks-avatar-picker oneworks-avatar-animation-picker${className == null ? '' : ` ${className}`}`}
    >
      {searchable
        ? <input
            aria-label={placeholder}
            className='oneworks-avatar-picker__search'
            onChange={event => setQuery(event.currentTarget.value)}
            placeholder={placeholder}
            type='search'
            value={query}
          />
        : null}
      <div className='oneworks-avatar-picker__grid' role='listbox' aria-label='Animations'>
        {visibleOptions.map(option => (
          <button
            aria-label={option.label}
            aria-selected={option.id === value}
            className='oneworks-avatar-picker__option'
            data-selected={option.id === value}
            disabled={option.disabled}
            draggable={draggable && !option.disabled}
            key={option.id}
            onClick={() => onChange?.(option)}
            onDragStart={event => onOptionDragStart?.(option, event)}
            role='option'
            title={option.description ?? option.label}
            type='button'
          >
            {option.previewUrl == null
              ? <span className='oneworks-avatar-picker__fallback' aria-hidden='true'>▶</span>
              : <img alt='' aria-hidden='true' draggable={false} src={option.previewUrl} />}
          </button>
        ))}
        {visibleOptions.length === 0
          ? <span className='oneworks-avatar-picker__empty' role='status'>{emptyLabel}</span>
          : null}
      </div>
    </div>
  )
}

export function AvatarPresetPicker({
  className,
  emptyLabel = 'No avatars found',
  onChange,
  options,
  placeholder = 'Search avatars',
  searchable = false,
  theme = 'system',
  value,
  ...divProps
}: AvatarPresetPickerProps) {
  const [query, setQuery] = useState('')
  const visibleOptions = useMemo(
    () => options.filter(option => matchesPickerQuery(option, query)),
    [options, query]
  )
  return (
    <div
      {...divProps}
      className={`oneworks-avatar-picker oneworks-avatar-preset-picker${className == null ? '' : ` ${className}`}`}
    >
      {searchable
        ? <input
            aria-label={placeholder}
            className='oneworks-avatar-picker__search'
            onChange={event => setQuery(event.currentTarget.value)}
            placeholder={placeholder}
            type='search'
            value={query}
          />
        : null}
      <div className='oneworks-avatar-picker__grid' role='listbox' aria-label='Avatars'>
        {visibleOptions.map(option => (
          <button
            aria-label={option.label}
            aria-selected={option.id === value}
            className='oneworks-avatar-picker__option'
            data-selected={option.id === value}
            disabled={option.disabled}
            key={option.id}
            onClick={() => onChange?.(option)}
            role='option'
            title={option.label}
            type='button'
          >
            {option.previewUrl == null
              ? <Avatar
                  aria-hidden='true'
                  className='oneworks-avatar-picker__avatar-preview'
                  definition={option.definition}
                  interactive={false}
                  theme={theme}
                />
              : <img alt='' aria-hidden='true' draggable={false} src={option.previewUrl} />}
          </button>
        ))}
        {visibleOptions.length === 0
          ? <span className='oneworks-avatar-picker__empty' role='status'>{emptyLabel}</span>
          : null}
      </div>
    </div>
  )
}
