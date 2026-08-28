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
  resolveAvatarCoatPatternDecals,
  resolveAvatarAnimationFrame,
  resolveAvatarAnimationTracks,
  resolveAvatarPaletteFromEntityParts
} from '@oneworks/avatar'
import type {
  AvatarAnimationClip,
  AvatarAnimationLibrary,
  AvatarAnimationParameterValues,
  AvatarAnimationRef,
  AvatarDefinition
} from '@oneworks/avatar'

import App from '../../../src/App'
import { InteractiveAvatar } from '../../../src/InteractiveAvatar'
import type { AvatarViewState } from '../../../src/InteractiveAvatar'
import { resolveAvatarFaceStyle } from '../../../src/avatarGeometry'
import { AvatarLocaleProvider } from '../../../src/avatarLocale'
import { renderAvatarPngBlob, renderAvatarSvgSource } from '../../../src/savedAvatarPresets'

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
  readonly parameterValues?: AvatarAnimationParameterValues
  readonly playback?: 'loop' | 'once'
  readonly speed?: number
  readonly trackId?: string
  readonly weight?: number
}

export interface AvatarTrackInput {
  readonly animation: AvatarAnimationClip | AvatarAnimationRef
  readonly muted?: boolean
  readonly parameterValues?: AvatarAnimationParameterValues
  readonly solo?: boolean
  readonly speed?: number
  readonly timeMs?: number
  readonly trackId: string
  readonly weight?: number
}

export interface AvatarTrackUpdate {
  readonly muted?: boolean
  readonly parameterValues?: AvatarAnimationParameterValues
  readonly solo?: boolean
  readonly speed?: number
  readonly weight?: number
}

interface AvatarRuntimeTrack {
  readonly clip: AvatarAnimationClip
  elapsedBeforeStart: number
  lastLoop: number
  muted: boolean
  parameterValues?: AvatarAnimationParameterValues
  playing: boolean
  solo: boolean
  speed: number
  startedAt: number
  readonly trackId: string
  weight: number
}

export interface AvatarHandle {
  capture(options: AvatarCaptureOptions): Promise<Blob>
  getDefinition(): AvatarDefinition
  pause(trackId?: string): void
  play(animation: AvatarAnimationClip | AvatarAnimationRef, options?: AvatarPlayOptions): Promise<void>
  removeTrack(trackId: string): void
  resume(trackId?: string): void
  seek(timeMs: number, trackId?: string): void
  setDefinition(definition: AvatarDefinition): void
  setTracks(tracks: readonly AvatarTrackInput[]): Promise<void>
  stop(options?: { readonly reset?: boolean; readonly trackId?: string }): void
  updateTrack(trackId: string, update: AvatarTrackUpdate): void
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
  const [renderFrame, setRenderFrame] = useState<{
    readonly auxiliaryParts?: ReturnType<typeof resolveAvatarAnimationFrame>['auxiliaryParts']
    readonly auxiliaryShapes?: ReturnType<typeof resolveAvatarAnimationFrame>['auxiliaryShapes']
    readonly definition: AvatarDefinition
    readonly partShapeMorphs?: ReturnType<typeof resolveAvatarAnimationFrame>['partShapeMorphs']
    readonly partTransforms?: ReturnType<typeof resolveAvatarAnimationFrame>['partTransforms']
  }>({ definition })
  const [systemTheme, setSystemTheme] = useState(resolveSystemTheme)
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>()
  const animationTracksRef = useRef<AvatarRuntimeTrack[]>([])
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
    animationTracksRef.current = []
    setCurrentDefinition(definition)
    setRenderFrame({ definition })
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
    setRenderFrame({ definition: next })
    onDefinitionChange?.(next)
  }, [onDefinitionChange])

  const stopFrame = useCallback(() => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    frameRef.current = undefined
  }, [])

  const resolveRequestedClip = useCallback((requested: AvatarAnimationClip | AvatarAnimationRef) => {
    const selected = 'clipId' in requested ? resolveAvatarAnimationClip(libraries, requested) : requested
    if (selected == null) throw new Error('Unknown OneWorks Avatar animation')
    return anchorAvatarAnimationClip(currentDefinition, parseAvatarAnimationClip(selected))
  }, [currentDefinition, libraries])

  const resolveTrackElapsed = (track: AvatarRuntimeTrack, now: number) => (
    track.elapsedBeforeStart + (track.playing ? (now - track.startedAt) * track.speed : 0)
  )

  const composeAndCommit = useCallback((now: number) => {
    const frame = resolveAvatarAnimationTracks(
      currentDefinition,
      animationTracksRef.current.map(track => ({
        clip: track.clip,
        elapsedMs: resolveTrackElapsed(track, now),
        muted: track.muted,
        parameterValues: track.parameterValues,
        preserveAuxiliaryPartIds: track.trackId === 'legacy',
        solo: track.solo,
        trackId: track.trackId,
        weight: track.weight
      }))
    )
    setRenderFrame({
      auxiliaryParts: frame.auxiliaryParts,
      auxiliaryShapes: frame.auxiliaryShapes,
      definition: { ...currentDefinition, scene: frame.scene },
      partShapeMorphs: frame.partShapeMorphs,
      partTransforms: frame.partTransforms
    })
    return frame
  }, [currentDefinition])

  const tick = useCallback((now: number) => {
    const tracks = animationTracksRef.current
    if (!tracks.some(track => track.playing)) {
      frameRef.current = undefined
      return
    }
    tracks.forEach(track => {
      if (!track.playing) return
      const elapsed = resolveTrackElapsed(track, now)
      const loop = track.clip.durationMs > 0 ? Math.floor(elapsed / track.clip.durationMs) : 0
      if (track.clip.playback === 'loop' && loop > track.lastLoop) {
        track.lastLoop = loop
        callbacksRef.current.onAnimationLoop?.()
      }
      if (track.clip.playback === 'once' && elapsed >= track.clip.durationMs) {
        track.elapsedBeforeStart = track.clip.durationMs
        track.playing = false
        callbacksRef.current.onAnimationEnd?.()
      }
    })
    composeAndCommit(now)
    if (tracks.some(track => track.playing)) frameRef.current = requestAnimationFrame(tick)
    else frameRef.current = undefined
  }, [composeAndCommit])

  const ensureFrame = useCallback(() => {
    if (frameRef.current == null && animationTracksRef.current.some(track => track.playing)) {
      frameRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  const setTracks = useCallback(async (inputs: readonly AvatarTrackInput[]) => {
    const now = performance.now()
    const previous = new Map(animationTracksRef.current.map(track => [track.trackId, track]))
    const resolved = inputs.map(input => {
      const clip = resolveRequestedClip(input.animation)
      const existing = previous.get(input.trackId)
      const sameClip = existing != null && JSON.stringify(existing.clip) === JSON.stringify(clip)
      return {
        clip,
        elapsedBeforeStart: sameClip ? resolveTrackElapsed(existing, now) : Math.max(input.timeMs ?? 0, 0),
        lastLoop: sameClip ? existing.lastLoop : 0,
        muted: input.muted ?? existing?.muted ?? false,
        parameterValues: input.parameterValues ?? existing?.parameterValues,
        playing: sameClip ? existing.playing : true,
        solo: input.solo ?? existing?.solo ?? false,
        speed: input.speed ?? existing?.speed ?? 1,
        startedAt: now,
        trackId: input.trackId,
        weight: input.weight ?? existing?.weight ?? 1
      } satisfies AvatarRuntimeTrack
    })
    resolveAvatarAnimationTracks(currentDefinition, resolved.map(track => ({
      clip: track.clip,
      elapsedMs: track.elapsedBeforeStart,
      muted: track.muted,
      parameterValues: track.parameterValues,
      solo: track.solo,
      trackId: track.trackId,
      weight: track.weight
    })))
    animationTracksRef.current = resolved
    composeAndCommit(now)
    ensureFrame()
  }, [composeAndCommit, currentDefinition, ensureFrame, resolveRequestedClip])

  const play = useCallback(async (
    requested: AvatarAnimationClip | AvatarAnimationRef,
    options: AvatarPlayOptions = {}
  ) => {
    try {
      const selected = resolveRequestedClip(requested)
      const clip = parseAvatarAnimationClip({
        ...selected,
        playback: options.playback ?? selected.playback
      })
      const trackId = options.trackId ?? 'legacy'
      const reducedMotion = typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const now = performance.now()
      const nextTrack: AvatarRuntimeTrack = {
        clip,
        elapsedBeforeStart: reducedMotion
          ? clip.playback === 'once' ? clip.durationMs : clip.durationMs / 2
          : 0,
        lastLoop: 0,
        muted: false,
        parameterValues: options.parameterValues,
        playing: !reducedMotion,
        solo: false,
        speed: options.speed ?? 1,
        startedAt: now,
        trackId,
        weight: options.weight ?? 1
      }
      animationTracksRef.current = options.trackId == null
        ? [nextTrack]
        : [...animationTracksRef.current.filter(track => track.trackId !== trackId), nextTrack]
      composeAndCommit(now)
      callbacksRef.current.onAnimationStart?.()
      if (reducedMotion) callbacksRef.current.onAnimationEnd?.()
      else ensureFrame()
    } catch (error) {
      const resolved = error instanceof Error ? error : new Error('Unable to play OneWorks Avatar animation')
      callbacksRef.current.onError?.(resolved)
      throw resolved
    }
  }, [composeAndCommit, ensureFrame, resolveRequestedClip])
  const playRef = useRef(play)
  playRef.current = play

  const removeTrack = useCallback((trackId: string) => {
    const now = performance.now()
    animationTracksRef.current = animationTracksRef.current.filter(track => track.trackId !== trackId)
    composeAndCommit(now)
    if (!animationTracksRef.current.some(track => track.playing)) stopFrame()
  }, [composeAndCommit, stopFrame])

  const stop = useCallback((options: { readonly reset?: boolean; readonly trackId?: string } = {}) => {
    const now = performance.now()
    if (options.trackId != null) {
      animationTracksRef.current = animationTracksRef.current.filter(track => track.trackId !== options.trackId)
      composeAndCommit(now)
      if (!animationTracksRef.current.some(track => track.playing)) stopFrame()
      return
    }
    stopFrame()
    animationTracksRef.current = []
    if (options.reset !== false) setRenderFrame({ definition: currentDefinition })
  }, [composeAndCommit, currentDefinition, stopFrame])

  useImperativeHandle(ref, () => ({
    capture: async options => {
      const svg = containerRef.current?.querySelector<SVGSVGElement>('svg.interactive-avatar__canvas')
      if (svg == null) throw new Error('Avatar is not ready to capture')
      const captureOptions = {
        background: options.background ?? renderFrame.definition.scene.camera.background,
        frame: options.frame ?? renderFrame.definition.scene.camera.frame,
        frameShadow: {
          ...renderFrame.definition.scene.camera.frameShadow,
          color: renderFrame.definition.scene.camera.frameShadow.color ?? getAvatarPalette(
            renderFrame.definition.scene.appearance.paletteId
          ).shadow
        },
        pixelEffect: renderFrame.definition.scene.effects.pixelate,
        showFrameShadow: renderFrame.definition.scene.camera.showFrameShadow
      }
      if (options.format === 'png') return renderAvatarPngBlob(svg, options.size, captureOptions)
      return new Blob([await renderAvatarSvgSource(svg, options.size, captureOptions)], {
        type: 'image/svg+xml;charset=utf-8'
      })
    },
    getDefinition: () => currentDefinition,
    pause: trackId => {
      const now = performance.now()
      animationTracksRef.current.forEach(track => {
        if (!track.playing || trackId != null && track.trackId !== trackId) return
        track.elapsedBeforeStart = resolveTrackElapsed(track, now)
        track.playing = false
      })
      composeAndCommit(now)
      if (!animationTracksRef.current.some(track => track.playing)) stopFrame()
    },
    play,
    removeTrack,
    resume: trackId => {
      const now = performance.now()
      animationTracksRef.current.forEach(track => {
        if (track.playing || trackId != null && track.trackId !== trackId) return
        track.playing = true
        track.startedAt = now
      })
      ensureFrame()
    },
    seek: (timeMs, trackId) => {
      const now = performance.now()
      animationTracksRef.current.forEach(track => {
        if (trackId != null && track.trackId !== trackId) return
        track.elapsedBeforeStart = Math.max(timeMs, 0)
        track.startedAt = now
      })
      composeAndCommit(now)
    },
    setDefinition: commitDefinition,
    setTracks,
    stop,
    updateTrack: (trackId, update) => {
      const now = performance.now()
      const track = animationTracksRef.current.find(candidate => candidate.trackId === trackId)
      if (track == null) return
      track.elapsedBeforeStart = resolveTrackElapsed(track, now)
      track.startedAt = now
      if (update.muted != null) track.muted = update.muted
      if (update.parameterValues != null) track.parameterValues = update.parameterValues
      if (update.solo != null) track.solo = update.solo
      if (update.speed != null) track.speed = update.speed
      if (update.weight != null) track.weight = update.weight
      composeAndCommit(now)
    }
  }), [
    commitDefinition,
    composeAndCommit,
    currentDefinition,
    ensureFrame,
    play,
    removeTrack,
    renderFrame.definition,
    setTracks,
    stop,
    stopFrame
  ])

  useEffect(() => () => stopFrame(), [stopFrame])
  useEffect(() => {
    if (autoplay && animation != null) void playRef.current(animation)
    return () => stopFrame()
  }, [animation, autoplay, stopFrame])

  const scene = renderFrame.definition.scene
  const renderEntityParts = renderFrame.partTransforms == null
    ? scene.entity.parts
    : currentDefinition.scene.entity.parts
  const palette = useMemo(
    () => resolveAvatarPaletteFromEntityParts(
      getAvatarPalette(scene.appearance.paletteId),
      renderEntityParts
    ),
    [renderEntityParts, scene.appearance.paletteId]
  )
  const generatedCoatDecals = scene.appearance.coatPattern?.enabled
    ? resolveAvatarCoatPatternDecals({
      entityParts: renderEntityParts,
      entityPreset: scene.entity.preset,
      palette,
      paletteId: scene.appearance.paletteId,
      pattern: scene.appearance.coatPattern
    })
    : []
  const explicitDecalIds = new Set(scene.decals.map(decal => decal.id))
  const surfaceDecals = [
    ...generatedCoatDecals.filter(decal => !explicitDecalIds.has(decal.id)),
    ...scene.decals
  ]
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
        auxiliaryParts={renderFrame.auxiliaryParts}
        auxiliaryShapes={renderFrame.auxiliaryShapes}
        avatarOutlineStyle={scene.effects.outline}
        avatarShadowStyle={scene.effects.avatarShadow}
        backgroundStyle={scene.appearance.backgroundStyle}
        bodyShape={scene.appearance.bodyShape}
        bottomTaper={scene.appearance.bottomTaper}
        colorGrade={scene.effects.colorGrade}
        entityParts={renderEntityParts}
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
        partShapeMorphs={renderFrame.partShapeMorphs}
        partTransforms={renderFrame.partTransforms}
        pixelEffect={scene.effects.pixelate}
        shadowStyle={scene.effects.faceShadow}
        showAvatarShadow={scene.effects.showAvatarShadow}
        showLight={scene.lighting.enabled}
        showOutline={scene.effects.showOutline}
        showShadow={scene.effects.showFaceShadow}
        surfaceDecals={surfaceDecals}
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
