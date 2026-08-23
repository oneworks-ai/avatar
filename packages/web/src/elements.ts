import { createDefaultAvatarDefinition } from '@oneworks/avatar-core'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarDefinition
} from '@oneworks/avatar-core'

import { createAvatar, createAvatarEditor } from './index'
import type {
  AvatarEditorMount,
  AvatarEditorMountOptions,
  AvatarMount,
  AvatarMountOptions
} from './index'

const readBooleanAttribute = (element: Element, name: string) => element.hasAttribute(name)

export class OneWorksAvatarElement extends HTMLElement {
  static observedAttributes = ['autoplay', 'interactive', 'theme']

  #animation: AvatarAnimationClip | AvatarAnimationRef | null = null
  #animationLibraries: readonly AvatarAnimationLibrary[] = []
  #definition: AvatarDefinition = createDefaultAvatarDefinition()
  #mount: AvatarMount | null = null

  get animation() { return this.#animation }
  set animation(value) {
    this.#animation = value
    this.#update()
  }

  get animationLibraries() { return this.#animationLibraries }
  set animationLibraries(value) {
    this.#animationLibraries = value
    this.#update()
  }

  get definition() { return this.#mount?.getDefinition() ?? this.#definition }
  set definition(value) {
    this.#definition = value
    if (this.#mount == null) this.#update()
    else this.#mount.setDefinition(value)
  }

  connectedCallback() { this.#update() }
  disconnectedCallback() {
    this.#mount?.destroy()
    this.#mount = null
  }
  attributeChangedCallback() { this.#update() }

  capture(options: Parameters<AvatarMount['capture']>[0]) { return this.#requireMount().capture(options) }
  pause() { this.#requireMount().pause() }
  play(animation: AvatarAnimationClip | AvatarAnimationRef, options?: Parameters<AvatarMount['play']>[1]) {
    return this.#requireMount().play(animation, options)
  }
  resume() { this.#requireMount().resume() }
  seek(timeMs: number) { this.#requireMount().seek(timeMs) }
  stop(options?: Parameters<AvatarMount['stop']>[0]) { this.#requireMount().stop(options) }

  #options(): AvatarMountOptions {
    const theme = this.getAttribute('theme')
    return {
      animation: this.#animation,
      animationLibraries: this.#animationLibraries,
      autoplay: readBooleanAttribute(this, 'autoplay'),
      definition: this.#definition,
      interactive: readBooleanAttribute(this, 'interactive'),
      theme: theme === 'dark' || theme === 'light' ? theme : 'system'
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

export class OneWorksAvatarEditorElement extends HTMLElement {
  static observedAttributes = ['locale', 'theme']

  #animationLibraries: readonly AvatarAnimationLibrary[] = []
  #definition: AvatarDefinition = createDefaultAvatarDefinition()
  #mount: AvatarEditorMount | null = null

  get animationLibraries() { return this.#animationLibraries }
  set animationLibraries(value) {
    this.#animationLibraries = value
    this.#update()
  }

  get definition() { return this.#mount?.getDefinition() ?? this.#definition }
  set definition(value) {
    this.#definition = value
    if (this.#mount == null) this.#update()
    else this.#mount.setDefinition(value)
  }

  connectedCallback() { this.#update() }
  disconnectedCallback() {
    this.#mount?.destroy()
    this.#mount = null
  }
  attributeChangedCallback() { this.#update() }
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

export const registerAvatarElements = ({
  registry = customElements
}: RegisterAvatarElementsOptions = {}) => {
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
