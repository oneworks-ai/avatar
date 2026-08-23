import './style.css'

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'

import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarDefinition
} from '@oneworks/avatar'
import { Avatar, AvatarEditor } from '@oneworks/avatar-react'
import type {
  AvatarCaptureOptions,
  AvatarEditorHandle,
  AvatarHandle,
  AvatarPlayOptions,
  AvatarTheme
} from '@oneworks/avatar-react'

export type {
  AvatarAnimationClip,
  AvatarAnimationGroup,
  AvatarAnimationKeyframe,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarDefinition
} from '@oneworks/avatar'
export type { AvatarCaptureOptions, AvatarPlayOptions, AvatarTheme } from '@oneworks/avatar-react'

export interface AvatarMountOptions {
  readonly animation?: AvatarAnimationClip | AvatarAnimationRef | null
  readonly animationLibraries?: readonly AvatarAnimationLibrary[]
  readonly autoplay?: boolean
  readonly definition?: AvatarDefinition
  readonly interactive?: boolean
  readonly theme?: AvatarTheme
}

export interface AvatarEditorMountOptions {
  readonly animationLibraries?: readonly AvatarAnimationLibrary[]
  readonly definition?: AvatarDefinition
  readonly locale?: 'en' | 'zh-Hans'
  readonly theme?: AvatarTheme
}

export interface AvatarMount extends AvatarHandle {
  readonly ready: Promise<void>
  destroy(): void
  update(options: Partial<AvatarMountOptions>): void
}

export interface AvatarEditorMount extends AvatarEditorHandle {
  readonly ready: Promise<void>
  destroy(): void
  update(options: Partial<AvatarEditorMountOptions>): void
}

const dispatch = <T>(element: HTMLElement, type: string, detail?: T) => {
  element.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }))
}

export const createAvatar = (
  element: HTMLElement,
  initialOptions: AvatarMountOptions = {}
): AvatarMount => {
  let options = initialOptions
  let handle: AvatarHandle | null = null
  let destroyed = false
  let resolveReady: () => void = () => {}
  const ready = new Promise<void>(resolve => {
    resolveReady = resolve
  })
  const root: Root = createRoot(element)

  const render = () => {
    if (destroyed) return
    root.render(createElement(Avatar, {
      ...options,
      ref: (next: AvatarHandle | null) => {
        if (handle == null && next != null) {
          resolveReady()
          dispatch(element, 'avatarready')
        }
        handle = next
      },
      onAnimationEnd: () => dispatch(element, 'animationend'),
      onAnimationLoop: () => dispatch(element, 'animationloop'),
      onAnimationStart: () => dispatch(element, 'animationstart'),
      onDefinitionChange: definition => dispatch(element, 'avatarchange', { definition }),
      onError: error => dispatch(element, 'avatarerror', { error })
    }))
  }
  const requireHandle = () => {
    if (destroyed) throw new Error('OneWorks Avatar mount has been destroyed')
    if (handle == null) throw new Error('OneWorks Avatar is not ready')
    return handle
  }

  render()
  return {
    capture: async captureOptions => {
      await ready
      return requireHandle().capture(captureOptions)
    },
    destroy: () => {
      if (destroyed) return
      destroyed = true
      resolveReady()
      handle = null
      root.unmount()
    },
    getDefinition: () => handle?.getDefinition() ?? options.definition ?? createDefaultAvatarDefinition(),
    pause: () => requireHandle().pause(),
    play: async (animation, playOptions) => {
      await ready
      return requireHandle().play(animation, playOptions)
    },
    ready,
    resume: () => requireHandle().resume(),
    seek: timeMs => requireHandle().seek(timeMs),
    setDefinition: definition => {
      options = { ...options, definition }
      if (handle == null) render()
      else handle.setDefinition(definition)
    },
    stop: stopOptions => requireHandle().stop(stopOptions),
    update: nextOptions => {
      options = { ...options, ...nextOptions }
      render()
    }
  }
}

export const createAvatarEditor = (
  element: HTMLElement,
  initialOptions: AvatarEditorMountOptions = {}
): AvatarEditorMount => {
  let options = initialOptions
  let handle: AvatarEditorHandle | null = null
  let destroyed = false
  let resolveReady: () => void = () => {}
  const ready = new Promise<void>(resolve => {
    resolveReady = resolve
  })
  const root = createRoot(element)

  const render = () => {
    if (destroyed) return
    root.render(createElement(AvatarEditor, {
      ...options,
      ref: (next: AvatarEditorHandle | null) => {
        if (handle == null && next != null) {
          resolveReady()
          dispatch(element, 'editoready')
        }
        handle = next
      },
      onDefinitionChange: definition => dispatch(element, 'avatarchange', { definition })
    }))
  }
  const requireHandle = () => {
    if (destroyed) throw new Error('OneWorks Avatar editor mount has been destroyed')
    if (handle == null) throw new Error('OneWorks Avatar editor is not ready')
    return handle
  }

  render()
  return {
    destroy: () => {
      if (destroyed) return
      destroyed = true
      resolveReady()
      handle = null
      root.unmount()
    },
    focus: () => requireHandle().focus(),
    getDefinition: () => handle?.getDefinition() ?? options.definition ?? createDefaultAvatarDefinition(),
    ready,
    setDefinition: definition => {
      options = { ...options, definition }
      if (handle == null) render()
      else handle.setDefinition(definition)
    },
    update: nextOptions => {
      options = { ...options, ...nextOptions }
      render()
    }
  }
}
