import { Nes } from '@/models/Nes'

declare global {
  type Int8 = number
  type Uint8 = number
  type Uint16 = number

  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream
  }

  interface Window {
    nes: Nes
  }
}
