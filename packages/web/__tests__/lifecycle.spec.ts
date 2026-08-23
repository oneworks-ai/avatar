// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import { createDefaultAvatarDefinition } from '@oneworks/avatar'

import { createAvatar, createAvatarEditor } from '../src'

describe('OneWorks Avatar vanilla mount lifecycle', () => {
  it('settles renderer work when destroyed before the first React commit', async () => {
    const mount = createAvatar(document.createElement('div'))
    const capture = mount.capture({ format: 'png' })
    mount.destroy()

    await expect(mount.ready).resolves.toBeUndefined()
    await expect(capture).rejects.toThrow('has been destroyed')
  })

  it('settles editor readiness when destroyed before the first React commit', async () => {
    const mount = createAvatarEditor(document.createElement('div'), {
      definition: createDefaultAvatarDefinition()
    })
    mount.destroy()

    await expect(mount.ready).resolves.toBeUndefined()
  })
})
