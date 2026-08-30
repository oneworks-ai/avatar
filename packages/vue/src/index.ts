import './style.css'

import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'

import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarAnimationTimeline,
  AvatarAnimationTimelinePresetResolver,
  AvatarDefinition
} from '@oneworks/avatar'
import {
  createAvatar,
  createAvatarAnimationPicker,
  createAvatarEditor,
  createAvatarPresetPicker
} from '@oneworks/avatar-web'
import type {
  AvatarAnimationPickerMountOptions,
  AvatarAnimationPickerOption,
  AvatarCaptureOptions,
  AvatarEditorMount,
  AvatarEditorMountOptions,
  AvatarMount,
  AvatarMountOptions,
  AvatarPlayOptions,
  AvatarPresetPickerMountOptions,
  AvatarPresetPickerOption,
  AvatarPickerMount,
  AvatarTimelineOptions,
  AvatarTrackInput,
  AvatarTrackUpdate,
  AvatarTheme
} from '@oneworks/avatar-web'

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
  AvatarAnimationPickerOption,
  AvatarCaptureOptions,
  AvatarDefinition,
  AvatarPlayOptions,
  AvatarPresetPickerOption,
  AvatarTimelineOptions,
  AvatarTrackInput,
  AvatarTrackUpdate,
  AvatarTheme
} from '@oneworks/avatar-web'

type AvatarAnimation = AvatarAnimationClip | AvatarAnimationRef | null

export interface OneWorksAvatarHandle {
  capture(options: AvatarCaptureOptions): ReturnType<AvatarMount['capture']>
  getDefinition(): AvatarDefinition
  pause(trackId?: string): void
  play(
    animation: Exclude<AvatarAnimation, null>,
    options?: AvatarPlayOptions
  ): ReturnType<AvatarMount['play']>
  removeTrack(trackId: string): void
  resume(trackId?: string): void
  seek(timeMs: number, trackId?: string): void
  setDefinition(definition: AvatarDefinition): void
  setTimeline(timeline: AvatarAnimationTimeline | null, options?: AvatarTimelineOptions): void
  setTracks(tracks: readonly AvatarTrackInput[]): ReturnType<AvatarMount['setTracks']>
  stop(options?: { readonly reset?: boolean; readonly trackId?: string }): void
  updateTrack(trackId: string, update: AvatarTrackUpdate): void
}

export interface OneWorksAvatarEditorHandle {
  focus(): void
  getDefinition(): AvatarDefinition
  setDefinition(definition: AvatarDefinition): void
}

const avatarProps = {
  animation: { default: null, type: Object as PropType<AvatarAnimation> },
  animationLibraries: { default: () => [], type: Array as PropType<readonly AvatarAnimationLibrary[]> },
  autoplay: { default: false, type: Boolean },
  definition: { default: undefined, type: Object as PropType<AvatarDefinition | undefined> },
  interactive: { default: false, type: Boolean },
  resolveTimelinePreset: { default: undefined, type: Function as PropType<AvatarAnimationTimelinePresetResolver | undefined> },
  theme: { default: 'system', type: String as PropType<AvatarTheme> },
  timeline: { default: null, type: Object as PropType<AvatarAnimationTimeline | null> },
  timelineLoop: { default: false, type: Boolean },
  timelineSpeed: { default: 1, type: Number },
  timelineTimeMs: { default: 0, type: Number }
}

const oneWorksAvatarComponent = defineComponent({
  emits: {
    'animation-end': () => true,
    'animation-loop': () => true,
    'animation-start': () => true,
    'definition-change': (_definition: AvatarDefinition) => true,
    error: (_error: Error) => true,
    ready: () => true
  },
  name: 'OneWorksAvatar',
  props: avatarProps,
  setup(props, { attrs, emit, expose }) {
    const host = ref<HTMLElement | null>(null)
    let mount: AvatarMount | null = null

    const options = (): AvatarMountOptions => ({
      animation: props.animation,
      animationLibraries: props.animationLibraries,
      autoplay: props.autoplay,
      definition: props.definition,
      interactive: props.interactive,
      resolveTimelinePreset: props.resolveTimelinePreset,
      theme: props.theme,
      timeline: props.timeline,
      timelineLoop: props.timelineLoop,
      timelineSpeed: props.timelineSpeed,
      timelineTimeMs: props.timelineTimeMs
    })

    onMounted(() => {
      if (host.value == null) return
      mount = createAvatar(host.value, options())
      host.value.addEventListener('animationend', () => emit('animation-end'))
      host.value.addEventListener('animationloop', () => emit('animation-loop'))
      host.value.addEventListener('animationstart', () => emit('animation-start'))
      host.value.addEventListener('avatarchange', event =>
        emit(
          'definition-change',
          (event as CustomEvent<{ definition: AvatarDefinition }>).detail.definition
        ))
      host.value.addEventListener('avatarerror', event =>
        emit(
          'error',
          (event as CustomEvent<{ error: Error }>).detail.error
        ))
      void mount.ready.then(() => emit('ready'))
    })
    watch(() => [
      props.animation,
      props.animationLibraries,
      props.autoplay,
      props.definition,
      props.interactive,
      props.resolveTimelinePreset,
      props.theme,
      props.timeline,
      props.timelineLoop,
      props.timelineSpeed,
      props.timelineTimeMs
    ], () => mount?.update(options()))
    onBeforeUnmount(() => mount?.destroy())

    expose({
      capture: (captureOptions: AvatarCaptureOptions) => mount!.capture(captureOptions),
      getDefinition: () => mount!.getDefinition(),
      pause: (trackId?: string) => mount!.pause(trackId),
      play: (animation: Exclude<AvatarAnimation, null>, playOptions?: AvatarPlayOptions) => (
        mount!.play(animation, playOptions)
      ),
      removeTrack: (trackId: string) => mount!.removeTrack(trackId),
      resume: (trackId?: string) => mount!.resume(trackId),
      seek: (timeMs: number, trackId?: string) => mount!.seek(timeMs, trackId),
      setDefinition: (definition: AvatarDefinition) => mount!.setDefinition(definition),
      setTimeline: (timeline: AvatarAnimationTimeline | null, options?: AvatarTimelineOptions) => (
        mount!.setTimeline(timeline, options)
      ),
      setTracks: (tracks: readonly AvatarTrackInput[]) => mount!.setTracks(tracks),
      stop: (options?: { readonly reset?: boolean; readonly trackId?: string }) => mount!.stop(options),
      updateTrack: (trackId: string, update: AvatarTrackUpdate) => mount!.updateTrack(trackId, update)
    })

    return () => h('div', { ...attrs, ref: host })
  }
})

export const OneWorksAvatar = oneWorksAvatarComponent as typeof oneWorksAvatarComponent & {
  new(): InstanceType<typeof oneWorksAvatarComponent> & OneWorksAvatarHandle
}

const editorProps = {
  animationLibraries: { default: () => [], type: Array as PropType<readonly AvatarAnimationLibrary[]> },
  definition: { default: undefined, type: Object as PropType<AvatarDefinition | undefined> },
  locale: { default: 'en', type: String as PropType<'en' | 'zh-Hans'> },
  theme: { default: 'system', type: String as PropType<AvatarTheme> }
}

const oneWorksAvatarEditorComponent = defineComponent({
  emits: {
    'definition-change': (_definition: AvatarDefinition) => true,
    ready: () => true
  },
  name: 'OneWorksAvatarEditor',
  props: editorProps,
  setup(props, { attrs, emit, expose }) {
    const host = ref<HTMLElement | null>(null)
    let mount: AvatarEditorMount | null = null
    const options = (): AvatarEditorMountOptions => ({
      animationLibraries: props.animationLibraries,
      definition: props.definition,
      locale: props.locale,
      theme: props.theme
    })

    onMounted(() => {
      if (host.value == null) return
      mount = createAvatarEditor(host.value, options())
      host.value.addEventListener('avatarchange', event =>
        emit(
          'definition-change',
          (event as CustomEvent<{ definition: AvatarDefinition }>).detail.definition
        ))
      void mount.ready.then(() => emit('ready'))
    })
    watch(() => [props.animationLibraries, props.definition, props.locale, props.theme], () => {
      mount?.update(options())
    })
    onBeforeUnmount(() => mount?.destroy())

    expose({
      focus: () => mount!.focus(),
      getDefinition: () => mount!.getDefinition(),
      setDefinition: (definition: AvatarDefinition) => mount!.setDefinition(definition)
    })

    return () => h('div', { ...attrs, ref: host })
  }
})

export const OneWorksAvatarEditor = oneWorksAvatarEditorComponent as typeof oneWorksAvatarEditorComponent & {
  new(): InstanceType<typeof oneWorksAvatarEditorComponent> & OneWorksAvatarEditorHandle
}

const animationPickerProps = {
  draggable: { default: false, type: Boolean },
  emptyLabel: { default: 'No animations found', type: String },
  options: { default: () => [], type: Array as PropType<readonly AvatarAnimationPickerOption[]> },
  placeholder: { default: 'Search animations', type: String },
  searchable: { default: true, type: Boolean },
  value: { default: null, type: String as PropType<string | null> }
}

export const OneWorksAvatarAnimationPicker = defineComponent({
  emits: {
    change: (_option: AvatarAnimationPickerOption) => true,
    'drag-start': (_option: AvatarAnimationPickerOption) => true
  },
  name: 'OneWorksAvatarAnimationPicker',
  props: animationPickerProps,
  setup(props, { attrs, emit }) {
    const host = ref<HTMLElement | null>(null)
    let mount: AvatarPickerMount<AvatarAnimationPickerMountOptions> | null = null
    const options = (): AvatarAnimationPickerMountOptions => ({
      draggable: props.draggable,
      emptyLabel: props.emptyLabel,
      options: props.options,
      placeholder: props.placeholder,
      searchable: props.searchable,
      value: props.value
    })
    const handleChange = (event: Event) => emit(
      'change',
      (event as CustomEvent<{ option: AvatarAnimationPickerOption }>).detail.option
    )
    const handleDragStart = (event: Event) => emit(
      'drag-start',
      (event as CustomEvent<{ option: AvatarAnimationPickerOption }>).detail.option
    )

    onMounted(() => {
      if (host.value == null) return
      host.value.addEventListener('animationchange', handleChange)
      host.value.addEventListener('animationdragstart', handleDragStart)
      mount = createAvatarAnimationPicker(host.value, options())
    })
    watch(() => [
      props.draggable,
      props.emptyLabel,
      props.options,
      props.placeholder,
      props.searchable,
      props.value
    ], () => mount?.update(options()))
    onBeforeUnmount(() => {
      host.value?.removeEventListener('animationchange', handleChange)
      host.value?.removeEventListener('animationdragstart', handleDragStart)
      mount?.destroy()
    })

    return () => h('div', { ...attrs, ref: host })
  }
})

const presetPickerProps = {
  emptyLabel: { default: 'No avatars found', type: String },
  options: { default: () => [], type: Array as PropType<readonly AvatarPresetPickerOption[]> },
  placeholder: { default: 'Search avatars', type: String },
  searchable: { default: false, type: Boolean },
  theme: { default: 'system', type: String as PropType<AvatarTheme> },
  value: { default: null, type: String as PropType<string | null> }
}

export const OneWorksAvatarPresetPicker = defineComponent({
  emits: {
    change: (_option: AvatarPresetPickerOption) => true
  },
  name: 'OneWorksAvatarPresetPicker',
  props: presetPickerProps,
  setup(props, { attrs, emit }) {
    const host = ref<HTMLElement | null>(null)
    let mount: AvatarPickerMount<AvatarPresetPickerMountOptions> | null = null
    const options = (): AvatarPresetPickerMountOptions => ({
      emptyLabel: props.emptyLabel,
      options: props.options,
      placeholder: props.placeholder,
      searchable: props.searchable,
      theme: props.theme,
      value: props.value
    })
    const handleChange = (event: Event) => emit(
      'change',
      (event as CustomEvent<{ option: AvatarPresetPickerOption }>).detail.option
    )

    onMounted(() => {
      if (host.value == null) return
      host.value.addEventListener('avatarpresetchange', handleChange)
      mount = createAvatarPresetPicker(host.value, options())
    })
    watch(() => [
      props.emptyLabel,
      props.options,
      props.placeholder,
      props.searchable,
      props.theme,
      props.value
    ], () => mount?.update(options()))
    onBeforeUnmount(() => {
      host.value?.removeEventListener('avatarpresetchange', handleChange)
      mount?.destroy()
    })

    return () => h('div', { ...attrs, ref: host })
  }
})
