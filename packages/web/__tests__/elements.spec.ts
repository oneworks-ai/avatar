// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'

import {
  OneWorksAvatarEditorElement,
  OneWorksAvatarElement,
  registerAvatarElements
} from '../src/elements'

const mounted: Element[] = []

afterEach(() => {
  mounted.splice(0).forEach(element => element.remove())
})

describe('OneWorks Avatar custom elements', () => {
  it('does not register elements as an import side effect', () => {
    expect(customElements.get('oneworks-avatar')).toBeUndefined()
    expect(customElements.get('oneworks-avatar-editor')).toBeUndefined()
  })

  it('registers the public tags explicitly and idempotently', () => {
    registerAvatarElements()
    registerAvatarElements()
    expect(customElements.get('oneworks-avatar')).toBe(OneWorksAvatarElement)
    expect(customElements.get('oneworks-avatar-editor')).toBe(OneWorksAvatarEditorElement)
  })
})
