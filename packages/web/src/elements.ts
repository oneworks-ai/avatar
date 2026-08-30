import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarAnimationTimeline,
  AvatarAnimationTimelinePresetResolver,
  AvatarDefinition
} from '@oneworks/avatar'

import { createAvatar, createAvatarEditor } from './index'
import type { AvatarEditorMount, AvatarEditorMountOptions, AvatarMount, AvatarMountOptions } from './index'

const readBooleanAttribute = (element: Element, name: string) => element.hasAttribute(name)
const HTMLElementBase = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement

export class OneWorksAvatarElement extends HTMLElementBase {
  static observedAttributes = ['autoplay', 'interactive', 'theme']

  #animation: AvatarAnimationClip | AvatarAnimationRef | null = null
  #animationLibraries: readonly AvatarAnimationLibrary[] = []
  #definition: AvatarDefinition = createDefaultAvatarDefinition()
  #mount: AvatarMount | null = null
  #resolveTimelinePreset: AvatarAnimationTimelinePresetResolver | undefined
  #timeline: AvatarAnimationTimeline | null = null
  #timelineLoop = false
  #timelineSpeed = 1
  #timelineTimeMs = 0

  get animation() {
    return this.#animation
  }
  set animation(value) {
    this.#animation = value
    this.#update()
  }

  get animationLibraries() {
    return this.#animationLibraries
  }
  set animationLibraries(value) {
    this.#animationLibraries = value
    this.#update()
  }

  get timeline() {
    return this.#timeline
  }
  set timeline(value) {
    this.#timeline = value
    this.#update()
  }

  get resolveTimelinePreset() {
    return this.#resolveTimelinePreset
  }
  set resolveTimelinePreset(value) {
    this.#resolveTimelinePreset = value
    this.#update()
  }

  get timelineLoop() {
    return this.#timelineLoop
  }
  set timelineLoop(value) {
    this.#timelineLoop = value
    this.#update()
  }

  get timelineSpeed() {
    return this.#timelineSpeed
  }
  set timelineSpeed(value) {
    this.#timelineSpeed = value
    this.#update()
  }

  get timelineTimeMs() {
    return this.#timelineTimeMs
  }
  set timelineTimeMs(value) {
    this.#timelineTimeMs = value
    this.#update()
  }

  get definition(): AvatarDefinition {
    return this.#mount?.getDefinition() ?? this.#definition
  }
  set definition(value: AvatarDefinition) {
    this.#definition = value
    if (this.#mount == null) this.#update()
    else this.#mount.setDefinition(value)
  }

  connectedCallback() {
    this.#update()
  }
  disconnectedCallback() {
    if (this.#mount != null) {
      this.#definition = this.#mount.getDefinition()
      this.#mount.destroy()
    }
    this.#mount = null
  }
  attributeChangedCallback() {
    this.#update()
  }

  capture(options: Parameters<AvatarMount['capture']>[0]) {
    return this.#requireMount().capture(options)
  }
  pause(trackId?: string) {
    this.#requireMount().pause(trackId)
  }
  play(animation: AvatarAnimationClip | AvatarAnimationRef, options?: Parameters<AvatarMount['play']>[1]) {
    return this.#requireMount().play(animation, options)
  }
  removeTrack(trackId: string) {
    this.#requireMount().removeTrack(trackId)
  }
  resume(trackId?: string) {
    this.#requireMount().resume(trackId)
  }
  seek(timeMs: number, trackId?: string) {
    this.#requireMount().seek(timeMs, trackId)
  }
  setTracks(tracks: Parameters<AvatarMount['setTracks']>[0]) {
    return this.#requireMount().setTracks(tracks)
  }
  setTimeline(
    timeline: Parameters<AvatarMount['setTimeline']>[0],
    options?: Parameters<AvatarMount['setTimeline']>[1]
  ) {
    this.#timeline = timeline
    if (options?.loop != null) this.#timelineLoop = options.loop
    if (options?.resolvePreset != null) this.#resolveTimelinePreset = options.resolvePreset
    if (options?.speed != null) this.#timelineSpeed = options.speed
    if (options?.timeMs != null) this.#timelineTimeMs = options.timeMs
    return this.#requireMount().setTimeline(timeline, options)
  }
  stop(options?: Parameters<AvatarMount['stop']>[0]) {
    this.#requireMount().stop(options)
  }
  updateTrack(trackId: string, update: Parameters<AvatarMount['updateTrack']>[1]) {
    this.#requireMount().updateTrack(trackId, update)
  }

  #options(): AvatarMountOptions {
    const theme = this.getAttribute('theme')
    return {
      animation: this.#animation,
      animationLibraries: this.#animationLibraries,
      autoplay: readBooleanAttribute(this, 'autoplay'),
      definition: this.#definition,
      interactive: readBooleanAttribute(this, 'interactive'),
      resolveTimelinePreset: this.#resolveTimelinePreset,
      theme: theme === 'dark' || theme === 'light' ? theme : 'system',
      timeline: this.#timeline,
      timelineLoop: this.#timelineLoop,
      timelineSpeed: this.#timelineSpeed,
      timelineTimeMs: this.#timelineTimeMs
    }
  }

  #requireMount() {
    if (this.#mount == null) throw new Error('OneWorks Avatar element is not connected')
    return this.#mount
  }

  #update() {
    if (!this.isConnected) return
    const options = this.#options()
    if (this.#mount == null) this.#mount = createAvatar(this, options)
    else this.#mount.update(options)
  }
}

export class OneWorksAvatarEditorElement extends HTMLElementBase {
  static observedAttributes = ['locale', 'theme']

  #animationLibraries: readonly AvatarAnimationLibrary[] = []
  #definition: AvatarDefinition = createDefaultAvatarDefinition()
  #mount: AvatarEditorMount | null = null

  get animationLibraries() {
    return this.#animationLibraries
  }
  set animationLibraries(value) {
    this.#animationLibraries = value
    this.#update()
  }

  get definition(): AvatarDefinition {
    return this.#mount?.getDefinition() ?? this.#definition
  }
  set definition(value: AvatarDefinition) {
    this.#definition = value
    if (this.#mount == null) this.#update()
    else this.#mount.setDefinition(value)
  }

  connectedCallback() {
    this.#update()
  }
  disconnectedCallback() {
    if (this.#mount != null) {
      this.#definition = this.#mount.getDefinition()
      this.#mount.destroy()
    }
    this.#mount = null
  }
  attributeChangedCallback() {
    this.#update()
  }
  focus(options?: FocusOptions) {
    super.focus(options)
    this.#mount?.focus()
  }

  #options(): AvatarEditorMountOptions {
    const locale = this.getAttribute('locale')
    const theme = this.getAttribute('theme')
    return {
      animationLibraries: this.#animationLibraries,
      definition: this.#definition,
      locale: locale === 'zh-Hans' ? locale : 'en',
      theme: theme === 'dark' || theme === 'light' ? theme : 'system'
    }
  }

  #update() {
    if (!this.isConnected) return
    const options = this.#options()
    if (this.#mount == null) this.#mount = createAvatarEditor(this, options)
    else this.#mount.update(options)
  }
}

export interface RegisterAvatarElementsOptions {
  readonly registry?: CustomElementRegistry
}

export const registerAvatarElements = (options: RegisterAvatarElementsOptions = {}) => {
  const registry = options.registry ?? globalThis.customElements
  if (registry == null) {
    throw new Error('Custom elements are not available in this environment')
  }
  if (registry.get('oneworks-avatar') == null) {
    registry.define('oneworks-avatar', OneWorksAvatarElement)
  }
  if (registry.get('oneworks-avatar-editor') == null) {
    registry.define('oneworks-avatar-editor', OneWorksAvatarEditorElement)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oneworks-avatar': OneWorksAvatarElement
    'oneworks-avatar-editor': OneWorksAvatarEditorElement
  }
}
