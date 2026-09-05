import './editor.scss'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { HTMLAttributes } from 'react'
import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import type { AvatarAnimationLibrary, AvatarDefinition } from '@oneworks/avatar'
import App from '../../../src/App'
import { AvatarLocaleProvider } from '../../../src/avatarLocale'
import type { AvatarLocale, AvatarTheme } from './renderer'

export * from './pickers'
export type { AvatarLocale, AvatarTheme } from './renderer'

export interface AvatarEditorHandle {
  focus(): void
  getDefinition(): AvatarDefinition
  setDefinition(definition: AvatarDefinition): void
}

export interface AvatarEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  readonly animationLibraries?: readonly AvatarAnimationLibrary[]
  readonly defaultDefinition?: AvatarDefinition
  readonly definition?: AvatarDefinition
  readonly locale?: AvatarLocale
  readonly onDefinitionChange?: (definition: AvatarDefinition) => void
  readonly theme?: AvatarTheme
}

export const AvatarEditor = forwardRef<AvatarEditorHandle, AvatarEditorProps>(function AvatarEditor({
  animationLibraries = [],
  className,
  defaultDefinition: defaultDefinitionProp,
  definition,
  locale = 'en',
  onDefinitionChange,
  theme = 'system',
  ...divProps
}, ref) {
  const defaultDefinitionRef = useRef<AvatarDefinition>()
  if (defaultDefinitionRef.current == null) {
    defaultDefinitionRef.current = defaultDefinitionProp ?? createDefaultAvatarDefinition()
  }
  const defaultDefinition = defaultDefinitionProp ?? defaultDefinitionRef.current
  const containerRef = useRef<HTMLDivElement>(null)
  const emittedRef = useRef<AvatarDefinition>()
  const [internalDefinition, setInternalDefinition] = useState(definition ?? defaultDefinition)
  const [revision, setRevision] = useState(0)
  const value = internalDefinition

  useEffect(() => {
    if (definition == null || definition === emittedRef.current) return
    emittedRef.current = undefined
    setInternalDefinition(definition)
    setRevision(current => current + 1)
  }, [definition])

  const handleChange = useCallback((next: AvatarDefinition) => {
    emittedRef.current = next
    setInternalDefinition(next)
    onDefinitionChange?.(next)
  }, [onDefinitionChange])

  useImperativeHandle(ref, () => ({
    focus: () => containerRef.current?.focus(),
    getDefinition: () => emittedRef.current ?? value,
    setDefinition: next => {
      emittedRef.current = undefined
      setInternalDefinition(next)
      setRevision(current => current + 1)
      onDefinitionChange?.(next)
    }
  }), [onDefinitionChange, value])

  return (
    <div
      {...divProps}
      ref={containerRef}
      className={`oneworks-avatar-editor${className == null ? '' : ` ${className}`}`}
      tabIndex={-1}
    >
      <AvatarLocaleProvider initialLocale={locale} persist={false}>
        <App
          key={revision}
          animationLibraries={animationLibraries}
          definition={value}
          embedded
          onDefinitionChange={handleChange}
          theme={theme}
        />
      </AvatarLocaleProvider>
    </div>
  )
})
