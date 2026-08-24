import { DEFAULT_AVATAR_FACE_STYLE } from './avatarGeometry'
import type { AvatarFaceStyle } from './avatarGeometry'

export interface AvatarFacePreset {
  readonly id: string
  readonly label: string
  readonly style: AvatarFaceStyle
}

export const DEFAULT_AVATAR_FACE_PRESET: AvatarFacePreset = {
  id: 'default',
  label: 'Default face',
  style: DEFAULT_AVATAR_FACE_STYLE
}

const createFacePreset = (
  id: string,
  label: string,
  style: Partial<AvatarFaceStyle>
): AvatarFacePreset => ({
  id,
  label,
  style: { ...DEFAULT_AVATAR_FACE_STYLE, ...style }
})

export const AVATAR_FACE_PRESETS: readonly AvatarFacePreset[] = [
  createFacePreset('cute', 'Cute', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 42,
    height: 44,
    leftEyeRotation: -4,
    mouthCurve: 55,
    mouthEnabled: false,
    mouthHeight: 7,
    mouthWidth: 28,
    mouthY: 46,
    noseEnabled: true,
    noseHeight: 11,
    noseShape: 'inverted-triangle',
    noseWidth: 14,
    noseY: 25,
    rightEyeRotation: 4,
    width: 22
  }),
  createFacePreset('happy', 'Happy', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 42,
    height: 34,
    leftEyeRotation: -8,
    mouthCurve: 82,
    mouthEnabled: true,
    mouthHeight: 7,
    mouthWidth: 44,
    mouthY: 43,
    noseEnabled: false,
    rightEyeRotation: 8,
    width: 26
  }),
  createFacePreset('calm', 'Calm', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 46,
    height: 38,
    leftEyeHeight: 42,
    mouthEnabled: false,
    mouthHeight: 6,
    mouthWidth: 26,
    mouthY: 48,
    noseEnabled: true,
    noseHeight: 8,
    noseShape: 'ellipse',
    noseWidth: 12,
    noseY: 27,
    rightEyeHeight: 34,
    width: 22
  }),
  createFacePreset('surprised', 'Surprised', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 44,
    height: 52,
    leftEyeHeight: 56,
    mouthEnabled: false,
    noseEnabled: false,
    rightEyeHeight: 48,
    width: 22
  }),
  createFacePreset('sleepy', 'Sleepy', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 38,
    height: 30,
    leftEyeRotation: 10,
    mouthCurve: -10,
    mouthEnabled: false,
    mouthHeight: 6,
    mouthWidth: 24,
    mouthY: 47,
    noseEnabled: false,
    rightEyeRotation: -10,
    width: 30
  }),
  createFacePreset('playful', 'Playful', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 44,
    height: 46,
    leftEyeHeight: 40,
    leftEyeRotation: -18,
    mouthCurve: 68,
    mouthEnabled: true,
    mouthHeight: 7,
    mouthRotation: -8,
    mouthWidth: 34,
    mouthY: 46,
    noseEnabled: true,
    noseHeight: 11,
    noseRotation: 12,
    noseShape: 'inverted-triangle',
    noseWidth: 15,
    noseY: 26,
    rightEyeRotation: 8,
    rightEyeHeight: 50,
    width: 22
  }),
  createFacePreset('serious', 'Serious', {
    eyeRoundness: 65,
    eyeShape: 'rounded',
    gap: 45,
    height: 42,
    leftEyeRotation: 12,
    mouthCurve: -28,
    mouthEnabled: false,
    mouthHeight: 6,
    mouthWidth: 29,
    mouthY: 48,
    noseEnabled: true,
    noseHeight: 10,
    noseShape: 'rounded',
    noseWidth: 15,
    noseY: 27,
    rightEyeRotation: -12,
    width: 22
  }),
  createFacePreset('innocent', 'Innocent', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 40,
    height: 54,
    leftEyeHeight: 50,
    mouthEnabled: false,
    noseEnabled: true,
    noseHeight: 8,
    noseShape: 'ellipse',
    noseWidth: 11,
    noseY: 31,
    rightEyeHeight: 58,
    width: 20
  }),
  createFacePreset('cool', 'Cool', {
    eyeRoundness: 42,
    eyeShape: 'rounded',
    gap: 34,
    height: 36,
    leftEyeRotation: 8,
    mouthCurve: 0,
    mouthEnabled: false,
    mouthHeight: 6,
    mouthWidth: 34,
    mouthY: 46,
    noseEnabled: false,
    rightEyeRotation: 8,
    rotation: -4,
    width: 31
  }),
  createFacePreset('minimal', 'Minimal', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 36,
    height: 40,
    mouthEnabled: false,
    noseEnabled: false,
    width: 14
  }),
  createFacePreset('sparkle', 'Sparkle', { eyeRoundness: 100, eyeShape: 'rounded', gap: 48, height: 64, leftEyeHeight: 58, leftEyeRotation: -6, mouthEnabled: false, noseEnabled: true, rightEyeHeight: 68, rightEyeRotation: 5, width: 18 }),
  createFacePreset('squint', 'Squint', { eyeRoundness: 100, eyeShape: 'rounded', gap: 46, height: 16, leftEyeRotation: 16, mouthEnabled: false, noseEnabled: false, rightEyeRotation: -16, width: 34 }),
  createFacePreset('side-eye', 'Side eye', { eyeRoundness: 100, eyeShape: 'rounded', gap: 54, height: 38, leftEyeHeight: 28, leftEyeRotation: 12, mouthEnabled: false, noseEnabled: true, rightEyeHeight: 48, rightEyeRotation: 12, width: 22 }),
  createFacePreset('dizzy', 'Dizzy', { eyeRoundness: 100, eyeShape: 'rounded', gap: 38, height: 46, leftEyeHeight: 58, leftEyeRotation: 28, mouthEnabled: false, noseEnabled: false, rightEyeHeight: 32, rightEyeRotation: 28, width: 20 }),
  createFacePreset('focused', 'Focused', { eyeRoundness: 72, eyeShape: 'rounded', gap: 50, height: 30, leftEyeRotation: -14, mouthEnabled: false, noseEnabled: true, rightEyeRotation: 14, width: 36 }),
  createFacePreset('bashful', 'Bashful', { eyeRoundness: 100, eyeShape: 'rounded', gap: 34, height: 50, leftEyeHeight: 42, leftEyeRotation: 8, mouthEnabled: false, noseEnabled: true, rightEyeHeight: 56, rightEyeRotation: -4, width: 18 }),
  createFacePreset('peek', 'Peek', { eyeRoundness: 100, eyeShape: 'rounded', gap: 58, height: 24, leftEyeHeight: 16, mouthEnabled: false, noseEnabled: false, rightEyeHeight: 38, rightEyeRotation: -12, width: 32 }),
  createFacePreset('soft', 'Soft', { eyeRoundness: 100, eyeShape: 'rounded', gap: 40, height: 44, leftEyeRotation: 6, mouthEnabled: false, noseEnabled: true, rightEyeRotation: 6, width: 24 }),
  createFacePreset('alert', 'Alert', { eyeRoundness: 100, eyeShape: 'rounded', gap: 52, height: 60, leftEyeHeight: 64, mouthEnabled: false, noseEnabled: false, rightEyeHeight: 54, width: 16 }),
  createFacePreset('tiny', 'Tiny', { eyeRoundness: 100, eyeShape: 'rounded', gap: 30, height: 18, leftEyeRotation: -8, mouthEnabled: false, noseEnabled: true, rightEyeRotation: 8, width: 14 }),
  createFacePreset('flat-lines', 'Flat lines', { eyeRoundness: 100, eyeShape: 'rounded', gap: 44, height: 10, mouthEnabled: false, noseEnabled: false, width: 34 }),
  createFacePreset('mixed-signal', 'Mixed signal', { eyeRoundness: 100, eyeShape: 'rounded', gap: 46, height: 38, leftEyeHeight: 56, leftEyeWidth: 18, mouthEnabled: false, noseEnabled: true, rightEyeHeight: 16, rightEyeWidth: 52, width: 20 }),
  createFacePreset('big-small-dots', 'Big and small dots', { eyeRoundness: 100, eyeShape: 'rounded', gap: 44, height: 30, leftEyeHeight: 42, leftEyeWidth: 34, mouthEnabled: false, noseEnabled: false, rightEyeHeight: 16, rightEyeWidth: 14, width: 20 })
]

export const isAvatarFacePresetSelected = (
  faceStyle: AvatarFaceStyle,
  preset: AvatarFacePreset
) => Object.entries(preset.style).every(([key, value]) => (
  faceStyle[key as keyof AvatarFaceStyle] === value
))
