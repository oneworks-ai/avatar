export interface AvatarColorGrade {
  readonly brightness: number
  readonly saturation: number
  readonly tintAmount: number
  readonly tintB: number
  readonly tintG: number
  readonly tintR: number
}

export const DEFAULT_AVATAR_COLOR_GRADE: AvatarColorGrade = {
  brightness: 1,
  saturation: 1,
  tintAmount: 0,
  tintB: 0,
  tintG: 0,
  tintR: 0
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress

export const resolveAvatarColorGrade = (
  grade?: Partial<AvatarColorGrade> | null
): AvatarColorGrade => ({
  brightness: clamp(grade?.brightness ?? 1, .35, 1.8),
  saturation: clamp(grade?.saturation ?? 1, 0, 2),
  tintAmount: clamp(grade?.tintAmount ?? 0, 0, 1),
  tintB: clamp(grade?.tintB ?? 0, 0, 255),
  tintG: clamp(grade?.tintG ?? 0, 0, 255),
  tintR: clamp(grade?.tintR ?? 0, 0, 255)
})

export const interpolateAvatarColorGrade = (
  from: Partial<AvatarColorGrade> | null | undefined,
  to: Partial<AvatarColorGrade> | null | undefined,
  progress: number
): AvatarColorGrade => {
  const resolvedFrom = resolveAvatarColorGrade(from)
  const resolvedTo = resolveAvatarColorGrade(to)
  return {
    brightness: interpolate(resolvedFrom.brightness, resolvedTo.brightness, progress),
    saturation: interpolate(resolvedFrom.saturation, resolvedTo.saturation, progress),
    tintAmount: interpolate(resolvedFrom.tintAmount, resolvedTo.tintAmount, progress),
    tintB: interpolate(resolvedFrom.tintB, resolvedTo.tintB, progress),
    tintG: interpolate(resolvedFrom.tintG, resolvedTo.tintG, progress),
    tintR: interpolate(resolvedFrom.tintR, resolvedTo.tintR, progress)
  }
}

const toHexChannel = (value: number) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')

export const applyAvatarColorGrade = (
  color: string,
  grade?: Partial<AvatarColorGrade> | null
) => {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color)
  if (match == null) return color
  const resolved = resolveAvatarColorGrade(grade)
  const source = [
    Number.parseInt(match[1]!, 16),
    Number.parseInt(match[2]!, 16),
    Number.parseInt(match[3]!, 16)
  ]
  const tint = [resolved.tintR, resolved.tintG, resolved.tintB]
  const mixed = source.map((channel, index) => interpolate(channel, tint[index]!, resolved.tintAmount))
  const luminance = mixed[0]! * .2126 + mixed[1]! * .7152 + mixed[2]! * .0722
  const graded = mixed.map(channel => (
    luminance + (channel - luminance) * resolved.saturation
  ) * resolved.brightness)
  return `#${graded.map(toHexChannel).join('')}`
}
