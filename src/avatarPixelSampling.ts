import type { AvatarPixelSampling } from '@oneworks/avatar'

const ALPHA_THRESHOLD = 128
const SOLID_COVERAGE_THRESHOLD = .35
const SLIC_COMPACTNESS = 12
const SLIC_ITERATIONS = 3

interface CellBounds {
  readonly endX: number
  readonly endY: number
  readonly startX: number
  readonly startY: number
}

interface SlicCenter {
  a: number
  b: number
  l: number
  x: number
  y: number
}

interface SlicModel {
  readonly labels: Int32Array
  readonly representatives: Int32Array
}

const createImageData = (data: Uint8ClampedArray, width: number, height: number) => (
  typeof ImageData === 'undefined'
    ? { data, height, width } as ImageData
    : new ImageData(Uint8ClampedArray.from(data), width, height)
)

const getOffset = (width: number, x: number, y: number) => (y * width + x) * 4
const isSolid = (data: Uint8ClampedArray, offset: number) => (data[offset + 3] ?? 0) >= ALPHA_THRESHOLD
const normalizeBlockSize = (value: number) => Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1

const getCellBounds = (
  gridX: number,
  gridY: number,
  blockSize: number,
  width: number,
  height: number
): CellBounds => ({
  endX: Math.min(width, (gridX + 1) * blockSize),
  endY: Math.min(height, (gridY + 1) * blockSize),
  startX: gridX * blockSize,
  startY: gridY * blockSize
})

const writePixel = (
  output: Uint8ClampedArray,
  outputOffset: number,
  source: Uint8ClampedArray,
  sourceOffset: number
) => {
  output[outputOffset] = source[sourceOffset] ?? 0
  output[outputOffset + 1] = source[sourceOffset + 1] ?? 0
  output[outputOffset + 2] = source[sourceOffset + 2] ?? 0
  output[outputOffset + 3] = isSolid(source, sourceOffset) ? 255 : 0
}

const writeTransparentPixel = (output: Uint8ClampedArray, offset: number) => {
  output[offset] = 0
  output[offset + 1] = 0
  output[offset + 2] = 0
  output[offset + 3] = 0
}

const collectSolidOffsets = (source: ImageData, bounds: CellBounds) => {
  const offsets: number[] = []
  for (let y = bounds.startY; y < bounds.endY; y += 1) {
    for (let x = bounds.startX; x < bounds.endX; x += 1) {
      const offset = getOffset(source.width, x, y)
      if (isSolid(source.data, offset)) offsets.push(offset)
    }
  }
  return offsets
}

const hasEnoughCoverage = (bounds: CellBounds, solidCount: number) => {
  const area = (bounds.endX - bounds.startX) * (bounds.endY - bounds.startY)
  return area > 0 && solidCount / area >= SOLID_COVERAGE_THRESHOLD
}

const resolveCenterOffset = (source: ImageData, bounds: CellBounds) => getOffset(
  source.width,
  Math.floor((bounds.startX + bounds.endX - 1) / 2),
  Math.floor((bounds.startY + bounds.endY - 1) / 2)
)

const resolveDominantOffset = (source: ImageData, bounds: CellBounds) => {
  const offsets = collectSolidOffsets(source, bounds)
  if (!hasEnoughCoverage(bounds, offsets.length)) return -1
  const buckets = new Map<number, { count: number, red: number, green: number, blue: number }>()
  for (const offset of offsets) {
    const red = source.data[offset] ?? 0
    const green = source.data[offset + 1] ?? 0
    const blue = source.data[offset + 2] ?? 0
    const key = (red >> 4) << 8 | (green >> 4) << 4 | blue >> 4
    const bucket = buckets.get(key) ?? { blue: 0, count: 0, green: 0, red: 0 }
    bucket.count += 1
    bucket.red += red
    bucket.green += green
    bucket.blue += blue
    buckets.set(key, bucket)
  }
  let winningKey = -1
  let winningCount = -1
  for (const [key, bucket] of buckets) {
    if (bucket.count > winningCount) {
      winningCount = bucket.count
      winningKey = key
    }
  }
  const winner = buckets.get(winningKey)
  if (winner == null) return -1
  const targetRed = winner.red / winner.count
  const targetGreen = winner.green / winner.count
  const targetBlue = winner.blue / winner.count
  let bestOffset = -1
  let bestDistance = Number.POSITIVE_INFINITY
  for (const offset of offsets) {
    const red = source.data[offset] ?? 0
    const green = source.data[offset + 1] ?? 0
    const blue = source.data[offset + 2] ?? 0
    const key = (red >> 4) << 8 | (green >> 4) << 4 | blue >> 4
    if (key !== winningKey) continue
    const distance = (red - targetRed) ** 2 + (green - targetGreen) ** 2 + (blue - targetBlue) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      bestOffset = offset
    }
  }
  return bestOffset
}

const resolveMedianOffset = (source: ImageData, bounds: CellBounds) => {
  const offsets = collectSolidOffsets(source, bounds)
  if (!hasEnoughCoverage(bounds, offsets.length)) return -1
  const red = offsets.map(offset => source.data[offset] ?? 0).sort((left, right) => left - right)
  const green = offsets.map(offset => source.data[offset + 1] ?? 0).sort((left, right) => left - right)
  const blue = offsets.map(offset => source.data[offset + 2] ?? 0).sort((left, right) => left - right)
  const middle = Math.floor(offsets.length / 2)
  const targetRed = red[middle] ?? 0
  const targetGreen = green[middle] ?? 0
  const targetBlue = blue[middle] ?? 0
  let bestOffset = offsets[0] ?? -1
  let bestDistance = Number.POSITIVE_INFINITY
  for (const offset of offsets) {
    const distance = ((source.data[offset] ?? 0) - targetRed) ** 2 +
      ((source.data[offset + 1] ?? 0) - targetGreen) ** 2 +
      ((source.data[offset + 2] ?? 0) - targetBlue) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      bestOffset = offset
    }
  }
  return bestOffset
}

const srgbToLinear = (value: number) => {
  const channel = value / 255
  return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
}

const writeOklab = (source: Uint8ClampedArray, offset: number, target: Float32Array, index: number) => {
  const red = srgbToLinear(source[offset] ?? 0)
  const green = srgbToLinear(source[offset + 1] ?? 0)
  const blue = srgbToLinear(source[offset + 2] ?? 0)
  const l = Math.cbrt(.4122214708 * red + .5363325363 * green + .0514459929 * blue)
  const m = Math.cbrt(.2119034982 * red + .6806995451 * green + .1073969566 * blue)
  const s = Math.cbrt(.0883024619 * red + .2817188376 * green + .6299787005 * blue)
  target[index] = (.2104542553 * l + .793617785 * m - .0040720468 * s) * 100
  target[index + 1] = (1.9779984951 * l - 2.428592205 * m + .4505937099 * s) * 100
  target[index + 2] = (.0259040371 * l + .7827717662 * m - .808675766 * s) * 100
}

const resolveLocalCenter = (
  source: ImageData,
  lab: Float32Array,
  initialX: number,
  initialY: number,
  radius: number
) => {
  let bestX = initialX
  let bestY = initialY
  let bestGradient = Number.POSITIVE_INFINITY
  for (let y = Math.max(0, initialY - radius); y <= Math.min(source.height - 1, initialY + radius); y += 1) {
    for (let x = Math.max(0, initialX - radius); x <= Math.min(source.width - 1, initialX + radius); x += 1) {
      const pixel = y * source.width + x
      const offset = pixel * 4
      if (!isSolid(source.data, offset)) continue
      const rightPixel = y * source.width + Math.min(source.width - 1, x + 1)
      const bottomPixel = Math.min(source.height - 1, y + 1) * source.width + x
      const labOffset = pixel * 3
      const rightOffset = rightPixel * 3
      const bottomOffset = bottomPixel * 3
      const gradient = (lab[labOffset] - lab[rightOffset]) ** 2 +
        (lab[labOffset + 1] - lab[rightOffset + 1]) ** 2 +
        (lab[labOffset + 2] - lab[rightOffset + 2]) ** 2 +
        (lab[labOffset] - lab[bottomOffset]) ** 2 +
        (lab[labOffset + 1] - lab[bottomOffset + 1]) ** 2 +
        (lab[labOffset + 2] - lab[bottomOffset + 2]) ** 2
      if (gradient < bestGradient) {
        bestGradient = gradient
        bestX = x
        bestY = y
      }
    }
  }
  return bestGradient === Number.POSITIVE_INFINITY ? null : { x: bestX, y: bestY }
}

const createSlicModel = (source: ImageData, blockSize: number): SlicModel => {
  const pixelCount = source.width * source.height
  const lab = new Float32Array(pixelCount * 3)
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4
    if (isSolid(source.data, offset)) writeOklab(source.data, offset, lab, pixel * 3)
  }
  const step = Math.max(4, blockSize * 2)
  const centers: SlicCenter[] = []
  for (let y = Math.floor(step / 2); y < source.height; y += step) {
    for (let x = Math.floor(step / 2); x < source.width; x += step) {
      const position = resolveLocalCenter(source, lab, x, y, Math.max(1, Math.floor(step / 2)))
      if (position == null) continue
      const labOffset = (position.y * source.width + position.x) * 3
      centers.push({
        a: lab[labOffset + 1] ?? 0,
        b: lab[labOffset + 2] ?? 0,
        l: lab[labOffset] ?? 0,
        x: position.x,
        y: position.y
      })
    }
  }
  const labels = new Int32Array(pixelCount)
  const distances = new Float32Array(pixelCount)
  const spatialWeight = SLIC_COMPACTNESS ** 2 / step ** 2
  for (let iteration = 0; iteration < SLIC_ITERATIONS; iteration += 1) {
    labels.fill(-1)
    distances.fill(Number.POSITIVE_INFINITY)
    centers.forEach((center, centerIndex) => {
      for (let y = Math.max(0, Math.floor(center.y - step)); y <= Math.min(source.height - 1, Math.ceil(center.y + step)); y += 1) {
        for (let x = Math.max(0, Math.floor(center.x - step)); x <= Math.min(source.width - 1, Math.ceil(center.x + step)); x += 1) {
          const pixel = y * source.width + x
          if (!isSolid(source.data, pixel * 4)) continue
          const labOffset = pixel * 3
          const distance = (center.l - (lab[labOffset] ?? 0)) ** 2 +
            (center.a - (lab[labOffset + 1] ?? 0)) ** 2 +
            (center.b - (lab[labOffset + 2] ?? 0)) ** 2 +
            spatialWeight * ((center.x - x) ** 2 + (center.y - y) ** 2)
          if (distance < (distances[pixel] ?? Number.POSITIVE_INFINITY)) {
            distances[pixel] = distance
            labels[pixel] = centerIndex
          }
        }
      }
    })
    const totals = centers.map(() => ({ a: 0, b: 0, count: 0, l: 0, x: 0, y: 0 }))
    for (let pixel = 0; pixel < pixelCount; pixel += 1) {
      const centerIndex = labels[pixel] ?? -1
      const total = totals[centerIndex]
      if (centerIndex < 0 || total == null) continue
      const labOffset = pixel * 3
      total.l += lab[labOffset] ?? 0
      total.a += lab[labOffset + 1] ?? 0
      total.b += lab[labOffset + 2] ?? 0
      total.x += pixel % source.width
      total.y += Math.floor(pixel / source.width)
      total.count += 1
    }
    totals.forEach((total, index) => {
      if (total.count === 0) return
      const center = centers[index]
      if (center == null) return
      center.l = total.l / total.count
      center.a = total.a / total.count
      center.b = total.b / total.count
      center.x = total.x / total.count
      center.y = total.y / total.count
    })
  }
  const representatives = new Int32Array(centers.length)
  representatives.fill(-1)
  const representativeDistances = new Float32Array(centers.length)
  representativeDistances.fill(Number.POSITIVE_INFINITY)
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const centerIndex = labels[pixel] ?? -1
    const center = centers[centerIndex]
    if (centerIndex < 0 || center == null) continue
    const x = pixel % source.width
    const y = Math.floor(pixel / source.width)
    const labOffset = pixel * 3
    const distance = (center.l - (lab[labOffset] ?? 0)) ** 2 +
      (center.a - (lab[labOffset + 1] ?? 0)) ** 2 +
      (center.b - (lab[labOffset + 2] ?? 0)) ** 2 +
      spatialWeight * ((center.x - x) ** 2 + (center.y - y) ** 2)
    if (distance < (representativeDistances[centerIndex] ?? Number.POSITIVE_INFINITY)) {
      representativeDistances[centerIndex] = distance
      representatives[centerIndex] = pixel * 4
    }
  }
  return { labels, representatives }
}

const resolveSlicOffset = (source: ImageData, bounds: CellBounds, model: SlicModel) => {
  const offsets = collectSolidOffsets(source, bounds)
  if (!hasEnoughCoverage(bounds, offsets.length)) return -1
  const counts = new Map<number, number>()
  for (const offset of offsets) {
    const label = model.labels[offset / 4] ?? -1
    if (label >= 0) counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  let winningLabel = -1
  let winningCount = -1
  for (const [label, count] of counts) {
    if (count > winningCount) {
      winningCount = count
      winningLabel = label
    }
  }
  const representative = model.representatives[winningLabel]
  return representative != null && representative >= 0
    ? representative
    : resolveDominantOffset(source, bounds)
}

export const sampleAvatarPixelGrid = (
  source: ImageData,
  blockSize: number,
  sampling: AvatarPixelSampling
) => {
  const normalizedBlockSize = normalizeBlockSize(blockSize)
  const width = Math.ceil(source.width / normalizedBlockSize)
  const height = Math.ceil(source.height / normalizedBlockSize)
  const output = new Uint8ClampedArray(width * height * 4)
  const slicModel = sampling === 'slic' ? createSlicModel(source, normalizedBlockSize) : null
  for (let gridY = 0; gridY < height; gridY += 1) {
    for (let gridX = 0; gridX < width; gridX += 1) {
      const bounds = getCellBounds(gridX, gridY, normalizedBlockSize, source.width, source.height)
      const outputOffset = getOffset(width, gridX, gridY)
      const sourceOffset = sampling === 'center'
        ? resolveCenterOffset(source, bounds)
        : sampling === 'median'
          ? resolveMedianOffset(source, bounds)
          : sampling === 'slic' && slicModel != null
            ? resolveSlicOffset(source, bounds, slicModel)
            : resolveDominantOffset(source, bounds)
      if (sourceOffset < 0) writeTransparentPixel(output, outputOffset)
      else writePixel(output, outputOffset, source.data, sourceOffset)
    }
  }
  return createImageData(output, width, height)
}

export const expandAvatarPixelGrid = (
  grid: ImageData,
  width: number,
  height: number,
  blockSize: number
) => {
  const normalizedBlockSize = normalizeBlockSize(blockSize)
  const output = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceOffset = getOffset(
        grid.width,
        Math.floor(x / normalizedBlockSize),
        Math.floor(y / normalizedBlockSize)
      )
      const outputOffset = getOffset(width, x, y)
      output[outputOffset] = grid.data[sourceOffset] ?? 0
      output[outputOffset + 1] = grid.data[sourceOffset + 1] ?? 0
      output[outputOffset + 2] = grid.data[sourceOffset + 2] ?? 0
      output[outputOffset + 3] = grid.data[sourceOffset + 3] ?? 0
    }
  }
  return createImageData(output, width, height)
}
