import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { createDefaultAvatarDefinition } from '@oneworks/avatar'
import type { AvatarAnimationLibrary, AvatarDefinition } from '@oneworks/avatar'
import { Avatar, AvatarEditor } from '@oneworks/avatar-react'
import type { AvatarHandle } from '@oneworks/avatar-react'
import '@oneworks/avatar-react/style.css'

import './style.css'

const animations: AvatarAnimationLibrary = {
  groups: {
    support: {
      clips: {
        acknowledge: {
          anchor: 'relative',
          durationMs: 900,
          keyframes: [
            { atMs: 0, patch: { view: { pitch: 0, yaw: 0 } } },
            { atMs: 250, easing: 'ease-in-out', patch: { view: { pitch: .22, yaw: -.08 } } },
            { atMs: 600, easing: 'ease-out', patch: { view: { pitch: -.06, yaw: .04 } } },
            { atMs: 900, easing: 'ease-in-out', patch: { view: { pitch: 0, yaw: 0 } } }
          ],
          label: 'Acknowledge',
          playback: 'once'
        }
      },
      defaultClip: 'acknowledge',
      label: 'Support'
    }
  },
  id: 'sdk-demo',
  label: 'SDK demo animations'
}

function Demo() {
  const avatarRef = useRef<AvatarHandle>(null)
  const [definition, setDefinition] = useState<AvatarDefinition>(createDefaultAvatarDefinition)

  return (
    <main className='sdk-demo'>
      <section className='sdk-demo__preview'>
        <div>
          <p className='sdk-demo__eyebrow'>Public SDK fixture</p>
          <h1>One scene, every adapter</h1>
          <p>The preview and editor share a versioned definition and custom animation library.</p>
        </div>
        <Avatar
          ref={avatarRef}
          animationLibraries={[animations]}
          definition={definition}
          interactive
          onDefinitionChange={setDefinition}
          theme='dark'
        />
        <button
          onClick={() =>
            avatarRef.current?.play({
              clipId: 'acknowledge',
              groupId: 'support',
              libraryId: 'sdk-demo'
            })}
          type='button'
        >
          Play custom animation
        </button>
      </section>
      <AvatarEditor
        animationLibraries={[animations]}
        definition={definition}
        locale='en'
        onDefinitionChange={setDefinition}
        theme='dark'
      />
    </main>
  )
}

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>
)
