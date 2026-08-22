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
    height: 30,
    leftEyeRotation: -4,
    mouthCurve: 55,
    mouthEnabled: true,
    mouthHeight: 7,
    mouthWidth: 28,
    mouthY: 46,
    noseEnabled: true,
    noseHeight: 11,
    noseShape: 'inverted-triangle',
    noseWidth: 14,
    noseY: 25,
    rightEyeRotation: 4,
    width: 16
  }),
  createFacePreset('happy', 'Happy', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 42,
    height: 20,
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
    eyeShape: 'ellipse',
    gap: 46,
    height: 24,
    mouthCurve: 12,
    mouthEnabled: true,
    mouthHeight: 6,
    mouthWidth: 26,
    mouthY: 48,
    noseEnabled: true,
    noseHeight: 8,
    noseShape: 'ellipse',
    noseWidth: 12,
    noseY: 27,
    width: 20
  }),
  createFacePreset('surprised', 'Surprised', {
    eyeShape: 'ellipse',
    gap: 44,
    height: 38,
    mouthEnabled: true,
    mouthHeight: 22,
    mouthShape: 'ellipse',
    mouthWidth: 18,
    mouthY: 49,
    noseEnabled: false,
    width: 24
  }),
  createFacePreset('sleepy', 'Sleepy', {
    eyeRoundness: 100,
    eyeShape: 'rounded',
    gap: 38,
    height: 20,
    leftEyeRotation: 10,
    mouthCurve: -10,
    mouthEnabled: true,
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
    height: 30,
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
    width: 18
  }),
  createFacePreset('serious', 'Serious', {
    eyeRoundness: 65,
    eyeShape: 'rounded',
    gap: 45,
    height: 27,
    leftEyeRotation: 12,
    mouthCurve: -28,
    mouthEnabled: true,
    mouthHeight: 6,
    mouthWidth: 29,
    mouthY: 48,
    noseEnabled: true,
    noseHeight: 10,
    noseShape: 'rounded',
    noseWidth: 15,
    noseY: 27,
    rightEyeRotation: -12,
    width: 18
  }),
  createFacePreset('innocent', 'Innocent', {
    eyeShape: 'ellipse',
    gap: 40,
    height: 42,
    mouthEnabled: false,
    noseEnabled: true,
    noseHeight: 8,
    noseShape: 'ellipse',
    noseWidth: 11,
    noseY: 31,
    width: 18
  }),
  createFacePreset('cool', 'Cool', {
    eyeRoundness: 42,
    eyeShape: 'rounded',
    gap: 34,
    height: 20,
    leftEyeRotation: 8,
    mouthCurve: 0,
    mouthEnabled: true,
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
    height: 24,
    mouthEnabled: false,
    noseEnabled: false,
    width: 14
  })
]

export const isAvatarFacePresetSelected = (
  faceStyle: AvatarFaceStyle,
  preset: AvatarFacePreset
) => Object.entries(preset.style).every(([key, value]) => (
  faceStyle[key as keyof AvatarFaceStyle] === value
))
