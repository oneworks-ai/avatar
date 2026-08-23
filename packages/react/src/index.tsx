import './style.scss'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'

import {
  anchorAvatarAnimationClip,
  createDefaultAvatarDefinition,
  getAvatarPalette,
  mergeAvatarAnimationLibraries,
  parseAvatarAnimationClip,
  resolveAvatarAnimationClip,
  resolveAvatarAnimationFrame
} from '@oneworks/avatar'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarDefinition
} from '@oneworks/avatar'

import App from '../../../src/App'
import { InteractiveAvatar } from '../../../src/InteractiveAvatar'
import type { AvatarViewState } from '../../../src/InteractiveAvatar'
import { resolveAvatarFaceStyle } from '../../../src/avatarGeometry'
import { AvatarLocaleProvider } from '../../../src/avatarLocale'
import { renderAvatarPngBlob, serializeAvatarSvg } from '../../../src/savedAvatarPresets'

export type {
  AvatarAnimationClip,
  AvatarAnimationGroup,
  AvatarAnimationKeyframe,
  AvatarAnimationLibrary,
  AvatarAnimationRef,
  AvatarDefinition
} from '@oneworks/avatar'

export type AvatarTheme = 'dark' | 'light' | 'system'
export type AvatarLocale = 'en' | 'zh-Hans'
export type AvatarCaptureOptions = {
  readonly background?: string | 'transparent'
  readonly format: 'png' | 'svg'
  readonly frame?: 'circle' | 'rounded' | 'square'
  readonly size: 128 | 256 | 512
}

export interface AvatarPlayOptions {
  readonly playback?: 'loop' | 'once'
  readonly speed?: number
}

export interface AvatarHandle {
  capture(options: AvatarCaptureOptions): Promise<Blob>
  getDefinition(): AvatarDefinition
  pause(): void
  play(animation: AvatarAnimationClip | AvatarAnimationRef, options?: AvatarPlayOptions): Promise<void>
  resume(): void
  seek(timeMs: number): void
  setDefinition(definition: AvatarDefinition): void
  stop(options?: { readonly reset?: boolean }): void
}

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onError'> {
  readonly animation?: AvatarAnimationClip | AvatarAnimationRef | null
  readonly animationLibraries?: readonly AvatarAnimationLibrary[]
  readonly autoplay?: boolean
  readonly definition?: AvatarDefinition
  readonly interactive?: boolean
  readonly onAnimationEnd?: () => void
  readonly onAnimationLoop?: () => void
  readonly onAnimationStart?: () => void
  readonly onDefinitionChange?: (definition: AvatarDefinition) => void
  readonly onError?: (error: Error) => void
  readonly theme?: AvatarTheme
}

const resolveSystemTheme = () => (
  typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
)

const applyView = (definition: AvatarDefinition, view: AvatarViewState): AvatarDefinition => ({
  ...definition,
  scene: { ...definition.scene, view }
})

export const Avatar = forwardRef<AvatarHandle, AvatarProps>(function Avatar({
  animation = null,
  animationLibraries = [],
  autoplay = false,
  className,
  definition: definitionProp,
  interactive = false,
  onAnimationEnd,
  onAnimationLoop,
  onAnimationStart,
  onDefinitionChange,
  onError,
  style,
  theme = 'system',
  ...divProps
}, ref) {
  const defaultDefinitionRef = useRef<AvatarDefinition>()
  if (defaultDefinitionRef.current == null) defaultDefinitionRef.current = createDefaultAvatarDefinition()
  const definition = definitionProp ?? defaultDefinitionRef.current
  const [currentDefinition, setCurrentDefinition] = useState(definition)
  const [renderDefinition, setRenderDefinition] = useState(definition)
  const [systemTheme, setSystemTheme] = useState(resolveSystemTheme)
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>()
  const animationRef = useRef<
    {
      base: AvatarDefinition
      clip: AvatarAnimationClip
      elapsedBeforeStart: number
      lastLoop: number
      playing: boolean
      speed: number
      startedAt: number
    } | null
  >(null)
  const callbacksRef = useRef({ onAnimationEnd, onAnimationLoop, onAnimationStart, onError })
  callbacksRef.current = { onAnimationEnd, onAnimationLoop, onAnimationStart, onError }
  const libraries = useMemo(() =>
    mergeAvatarAnimationLibraries([
      ...(currentDefinition.animations == null ? [] : [currentDefinition.animations]),
      ...animationLibraries
    ]), [animationLibraries, currentDefinition.animations])

  useEffect(() => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    frameRef.current = undefined
    animationRef.current = null
    setCurrentDefinition(definition)
    setRenderDefinition(definition)
  }, [definition])

  useEffect(() => {
    if (
      theme !== 'system' ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemTheme(media.matches ? 'dark' : 'light')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  const commitDefinition = useCallback((next: AvatarDefinition) => {
    setCurrentDefinition(next)
    setRenderDefinition(next)
    onDefinitionChange?.(next)
  }, [onDefinitionChange])

  const stopFrame = useCallback(() => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    frameRef.current = undefined
  }, [])

  const tick = useCallback((now: number) => {
    const state = animationRef.current
    if (state == null || !state.playing) return
    const elapsed = state.elapsedBeforeStart + (now - state.startedAt) * state.speed
    const frame = resolveAvatarAnimationFrame(state.base, state.clip, elapsed)
    setRenderDefinition({ ...state.base, scene: frame.scene })
    const loop = state.clip.durationMs > 0 ? Math.floor(elapsed / state.clip.durationMs) : 0
    if (state.clip.playback === 'loop' && loop > state.lastLoop) {
      state.lastLoop = loop
      callbacksRef.current.onAnimationLoop?.()
    }
    if (frame.finished) {
      animationRef.current = null
      frameRef.current = undefined
      callbacksRef.current.onAnimationEnd?.()
      return
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [])

  const play = useCallback(async (
    requested: AvatarAnimationClip | AvatarAnimationRef,
    options: AvatarPlayOptions = {}
  ) => {
    const selected = 'clipId' in requested ? resolveAvatarAnimationClip(libraries, requested) : requested
    if (selected == null) {
      const error = new Error('Unknown OneWorks Avatar animation')
      callbacksRef.current.onError?.(error)
      throw error
    }
    stopFrame()
    const clip = anchorAvatarAnimationClip(
      currentDefinition,
      parseAvatarAnimationClip({
        ...selected,
        playback: options.playback ?? selected.playback
      })
    )
    animationRef.current = {
      base: currentDefinition,
      clip,
      elapsedBeforeStart: 0,
      lastLoop: 0,
      playing: true,
      speed: Math.max(options.speed ?? 1, .01),
      startedAt: performance.now()
    }
    callbacksRef.current.onAnimationStart?.()
    frameRef.current = requestAnimationFrame(tick)
  }, [currentDefinition, libraries, stopFrame, tick])
  const playRef = useRef(play)
  playRef.current = play

  const stop = useCallback((options: { readonly reset?: boolean } = {}) => {
    const state = animationRef.current
    stopFrame()
    animationRef.current = null
    if (options.reset !== false) setRenderDefinition(state?.base ?? currentDefinition)
  }, [currentDefinition, stopFrame])

  useImperativeHandle(ref, () => ({
    capture: async options => {
      const svg = containerRef.current?.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
      if (svg == null) throw new Error('Avatar is not ready to capture')
      const captureOptions = {
        background: options.background ?? renderDefinition.scene.camera.background,
        frame: options.frame ?? renderDefinition.scene.camera.frame,
        frameShadow: {
          ...renderDefinition.scene.camera.frameShadow,
          color: renderDefinition.scene.camera.frameShadow.color ?? getAvatarPalette(
            renderDefinition.scene.appearance.paletteId
          ).shadow
        },
        showFrameShadow: renderDefinition.scene.camera.showFrameShadow
      }
      if (options.format === 'png') return renderAvatarPngBlob(svg, options.size, captureOptions)
      return new Blob([serializeAvatarSvg(svg, options.size, captureOptions)], {
        type: 'image/svg+xml;charset=utf-8'
      })
    },
    getDefinition: () => currentDefinition,
    pause: () => {
      const state = animationRef.current
      if (state == null || !state.playing) return
      state.elapsedBeforeStart += (performance.now() - state.startedAt) * state.speed
      state.playing = false
      stopFrame()
    },
    play,
    resume: () => {
      const state = animationRef.current
      if (state == null || state.playing) return
      state.playing = true
      state.startedAt = performance.now()
      frameRef.current = requestAnimationFrame(tick)
    },
    seek: timeMs => {
      const state = animationRef.current
      if (state == null) return
      state.elapsedBeforeStart = Math.max(timeMs, 0)
      state.startedAt = performance.now()
      const frame = resolveAvatarAnimationFrame(state.base, state.clip, state.elapsedBeforeStart)
      setRenderDefinition({ ...state.base, scene: frame.scene })
    },
    setDefinition: commitDefinition,
    stop
  }), [commitDefinition, currentDefinition, play, renderDefinition, stop, stopFrame, tick])

  useEffect(() => () => stopFrame(), [stopFrame])
  useEffect(() => {
    if (autoplay && animation != null) void playRef.current(animation)
    return () => stopFrame()
  }, [animation, autoplay, stopFrame])

  const scene = renderDefinition.scene
  const palette = getAvatarPalette(scene.appearance.paletteId)
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const frameShadowDirection = scene.camera.frameShadow.direction * Math.PI / 180
  const frameShadow = scene.camera.showFrameShadow
    ? `${(Math.cos(frameShadowDirection) * scene.camera.frameShadow.distance).toFixed(2)}px ${
      (Math.sin(frameShadowDirection) * scene.camera.frameShadow.distance).toFixed(2)
    }px ${scene.camera.frameShadow.softness}px color-mix(in srgb, ${
      scene.camera.frameShadow.color ?? palette.shadow
    } ${scene.camera.frameShadow.opacity}%, transparent)`
    : 'none'
  const mergedStyle = {
    '--oneworks-avatar-background': scene.camera.background === 'transparent'
      ? 'transparent'
      : scene.camera.background,
    boxShadow: frameShadow,
    ...style
  } as CSSProperties

  return (
    <div
      {...divProps}
      ref={containerRef}
      className={`oneworks-avatar ${resolvedTheme === 'dark' ? 'dark' : ''}${className == null ? '' : ` ${className}`}`}
      data-frame={scene.camera.frame}
      data-theme={resolvedTheme}
      style={mergedStyle}
    >
      <InteractiveAvatar
        avatarOutlineStyle={scene.effects.outline}
        avatarShadowStyle={scene.effects.avatarShadow}
        backgroundStyle={scene.appearance.backgroundStyle}
        bodyShape={scene.appearance.bodyShape}
        colorGrade={scene.effects.colorGrade}
        entityParts={scene.entity.parts}
        entityPreset={scene.entity.preset}
        faceStyle={resolveAvatarFaceStyle(scene.face)}
        gridDensity={scene.lighting.gridDensity}
        interactive={interactive}
        interactionMode={scene.interactionMode}
        lightDistance={scene.lighting.distance}
        lightDirection={{ azimuth: scene.lighting.azimuth, elevation: scene.lighting.elevation }}
        onViewStateChange={view => {
          stop()
          commitDefinition(applyView(currentDefinition, view))
        }}
        palette={palette}
        shadowStyle={scene.effects.faceShadow}
        showAvatarShadow={scene.effects.showAvatarShadow}
        showLight={scene.lighting.enabled}
        showOutline={scene.effects.showOutline}
        showShadow={scene.effects.showFaceShadow}
        surfaceDecals={scene.decals}
        viewState={scene.view}
      />
    </div>
  )
})

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
