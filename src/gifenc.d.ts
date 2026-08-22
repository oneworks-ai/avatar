declare module 'gifenc' {
  type GifPalette = readonly (readonly number[])[]

  interface GifEncoderOptions {
    readonly auto?: boolean
    readonly initialCapacity?: number
  }

  interface GifFrameOptions {
    readonly delay?: number
    readonly dispose?: number
    readonly palette?: GifPalette | null
    readonly repeat?: number
    readonly transparent?: boolean
    readonly transparentIndex?: number
  }

  interface GifEncoderInstance {
    readonly bytes: () => Uint8Array
    readonly finish: () => void
    readonly writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      options?: GifFrameOptions
    ) => void
  }

  interface QuantizeOptions {
    readonly clearAlpha?: boolean
    readonly clearAlphaThreshold?: number
    readonly format?: 'rgb444' | 'rgb565' | 'rgba4444'
    readonly oneBitAlpha?: boolean | number
  }

  export const GIFEncoder: (options?: GifEncoderOptions) => GifEncoderInstance
  export const applyPalette: (
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: 'rgb444' | 'rgb565' | 'rgba4444'
  ) => Uint8Array
  export const quantize: (
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions
  ) => number[][]
}
