import './style.css'

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'

import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarAnimationTimeline,
  AvatarAnimationTimelinePresetResolver,
  AvatarDefinition
} from '@oneworks/avatar'
import {
  Avatar,
  AvatarAnimationPicker,
  AvatarEditor,
  AvatarPresetPicker
} from '@oneworks/avatar-react'
import type {
  AvatarAnimationPickerOption,
  AvatarCaptureOptions,
  AvatarEditorHandle,
  AvatarHandle,
  AvatarPlayOptions,
  AvatarPresetPickerOption,
  AvatarTimelineOptions,
  AvatarTrackInput,
  AvatarTrackUpdate,
  AvatarTheme
} from '@oneworks/avatar-react'

export type {
  AvatarAnimationClip,
  AvatarAnimationGroup,
  AvatarAnimationKeyframe,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarAnimationTimeline,
  AvatarAnimationTimelineClipInstance,
  AvatarAnimationTimelinePresetResolver,
  AvatarAnimationTimelineTrack,
  AvatarDefinition
} from '@oneworks/avatar'
export type {
  AvatarCaptureOptions,
  AvatarAnimationPickerOption,
  AvatarPlayOptions,
  AvatarPresetPickerOption,
  AvatarTimelineOptions,
  AvatarTheme,
  AvatarTrackInput,
  AvatarTrackUpdate
} from '@oneworks/avatar-react'

export interface AvatarMountOptions {
  readonly animation?: AvatarAnimationClip | AvatarAnimationRef | null
  readonly animationLibraries?: readonly AvatarAnimationLibrary[]
  readonly autoplay?: boolean
  readonly definition?: AvatarDefinition
  readonly interactive?: boolean
  readonly resolveTimelinePreset?: AvatarAnimationTimelinePresetResolver
  readonly theme?: AvatarTheme
  readonly timeline?: AvatarAnimationTimeline | null
  readonly timelineLoop?: boolean
  readonly timelineSpeed?: number
  readonly timelineTimeMs?: number
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

export interface AvatarAnimationPickerMountOptions {
  readonly draggable?: boolean
  readonly emptyLabel?: string
  readonly options: readonly AvatarAnimationPickerOption[]
  readonly placeholder?: string
  readonly searchable?: boolean
  readonly value?: string | null
}

export interface AvatarPresetPickerMountOptions {
  readonly emptyLabel?: string
  readonly options: readonly AvatarPresetPickerOption[]
  readonly placeholder?: string
  readonly searchable?: boolean
  readonly theme?: AvatarTheme
  readonly value?: string | null
}

export interface AvatarPickerMount<TOptions> {
  destroy(): void
  update(options: Partial<TOptions>): void
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
    pause: trackId => requireHandle().pause(trackId),
    play: async (animation, playOptions) => {
      await ready
      return requireHandle().play(animation, playOptions)
    },
    ready,
    removeTrack: trackId => requireHandle().removeTrack(trackId),
    resume: trackId => requireHandle().resume(trackId),
    seek: (timeMs, trackId) => requireHandle().seek(timeMs, trackId),
    setDefinition: definition => {
      options = { ...options, definition }
      if (handle == null) render()
      else handle.setDefinition(definition)
    },
    setTimeline: (timeline, timelineOptions) => requireHandle().setTimeline(timeline, timelineOptions),
    setTracks: async tracks => {
      await ready
      return requireHandle().setTracks(tracks)
    },
    stop: stopOptions => requireHandle().stop(stopOptions),
    update: nextOptions => {
      options = { ...options, ...nextOptions }
      render()
    },
    updateTrack: (trackId, update) => requireHandle().updateTrack(trackId, update)
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

export const createAvatarAnimationPicker = (
  element: HTMLElement,
  initialOptions: AvatarAnimationPickerMountOptions
): AvatarPickerMount<AvatarAnimationPickerMountOptions> => {
  let options = initialOptions
  let destroyed = false
  const root = createRoot(element)
  const render = () => {
    if (destroyed) return
    root.render(createElement(AvatarAnimationPicker, {
      ...options,
      onChange: option => dispatch(element, 'animationchange', {
        animation: option.animation,
        option
      }),
      onOptionDragStart: (option, event) => {
        event.dataTransfer.setData(
          'application/vnd.oneworks.avatar-animation+json',
          JSON.stringify({ id: option.id, label: option.label })
        )
        dispatch(element, 'animationdragstart', { option })
      }
    }))
  }
  render()
  return {
    destroy: () => {
      if (destroyed) return
      destroyed = true
      root.unmount()
    },
    update: nextOptions => {
      options = { ...options, ...nextOptions }
      render()
    }
  }
}

export const createAvatarPresetPicker = (
  element: HTMLElement,
  initialOptions: AvatarPresetPickerMountOptions
): AvatarPickerMount<AvatarPresetPickerMountOptions> => {
  let options = initialOptions
  let destroyed = false
  const root = createRoot(element)
  const render = () => {
    if (destroyed) return
    root.render(createElement(AvatarPresetPicker, {
      ...options,
      onChange: option => dispatch(element, 'avatarpresetchange', {
        definition: option.definition,
        option
      })
    }))
  }
  render()
  return {
    destroy: () => {
      if (destroyed) return
      destroyed = true
      root.unmount()
    },
    update: nextOptions => {
      options = { ...options, ...nextOptions }
      render()
    }
  }
}
