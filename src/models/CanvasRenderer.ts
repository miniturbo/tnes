import { Rgb, VideoRenderer } from '@/types'
import { validateNonNullable } from '@/utils'

export class CanvasRenderer implements VideoRenderer {
  static readonly CANVAS_WIDTH: number = 256
  static readonly CANVAS_HEIGHT: number = 240

  private readonly canvasContext: CanvasRenderingContext2D
  private readonly imageData: ImageData

  constructor(private canvas: HTMLCanvasElement) {
    this.canvas.width = CanvasRenderer.CANVAS_WIDTH
    this.canvas.height = CanvasRenderer.CANVAS_HEIGHT

    const canvasContext = this.canvas.getContext('2d')

    validateNonNullable(canvasContext)

    this.canvasContext = canvasContext
    this.imageData = canvasContext.createImageData(this.canvas.width, this.canvas.height)
  }

  renderPixel(x: number, y: number, palette: Rgb): void {
    const baseIndex = (x + y * this.imageData.width) * 4

    this.imageData.data[baseIndex + 0] = palette[0] // Red
    this.imageData.data[baseIndex + 1] = palette[1] // Green
    this.imageData.data[baseIndex + 2] = palette[2] // Blue
    this.imageData.data[baseIndex + 3] = 0xff // Alpha
  }

  renderFrame(): void {
    this.canvasContext.putImageData(this.imageData, 0, 0)
  }
}
