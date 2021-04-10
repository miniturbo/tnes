import Sprite from '/@/models/Sprite'

export default class SpriteRenderer {
  static readonly CANVAS_MAX_WIDTH: number = 640

  constructor(private sprites: Sprite[], private canvas: HTMLCanvasElement, private pixelRatio = 1) {}

  private get context(): CanvasRenderingContext2D | null {
    return this.canvas.getContext('2d')
  }

  private get spriteNumberPerRow(): number {
    return Math.floor(SpriteRenderer.CANVAS_MAX_WIDTH / (Sprite.WIDTH * this.pixelRatio))
  }

  private get spriteRowNumber(): number {
    return Math.ceil(this.sprites.length / this.spriteNumberPerRow)
  }

  private get canvasWidth(): number {
    return SpriteRenderer.CANVAS_MAX_WIDTH - (SpriteRenderer.CANVAS_MAX_WIDTH % this.spriteNumberPerRow)
  }

  private get canvasHeight(): number {
    return Sprite.HEIGHT * this.pixelRatio * this.spriteRowNumber
  }

  render(): void {
    this.initializeCanvas()
    this.renderSprites()
  }

  private initializeCanvas(): void {
    if (!this.context) throw 'error!'

    this.canvas.width = this.canvasWidth
    this.canvas.height = this.canvasHeight
    this.context.fillStyle = 'rgb(0, 0, 0)'
    this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
  }

  private renderSprites(): void {
    this.sprites.forEach((sprite, i) => {
      sprite.data.forEach((_, m) => {
        sprite.data.forEach((_, n) => {
          if (!this.context) throw 'error!'

          const r = 85 * sprite.data[m][n]
          const g = 85 * sprite.data[m][n]
          const b = 85 * sprite.data[m][n]
          this.context.fillStyle = `rgb(${r}, ${g}, ${b})`

          const x = ((i % this.spriteNumberPerRow) * Sprite.WIDTH + n) * this.pixelRatio
          const y = (Math.floor(i / this.spriteNumberPerRow) * Sprite.HEIGHT + m) * this.pixelRatio
          this.context.fillRect(x, y, this.pixelRatio, this.pixelRatio)
        })
      })
    })
  }
}
