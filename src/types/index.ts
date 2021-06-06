export * from '@/types/controller'
export * from '@/types/cpu'
export * from '@/types/nes'
export * from '@/types/ppu'

export type Logger = {
  log(message: string): void
}

export type Rgb = [Uint8, Uint8, Uint8]

export type VideoRenderer = {
  renderPixel(x: number, y: number, palette: Rgb): void
  renderFrame(): void
}
