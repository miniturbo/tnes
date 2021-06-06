import { Sprite } from '@/models/Ppu/Sprite'

export class PpuSpriteRegisters {
  private sprites = new Map<number, Sprite>()

  pixelOf(x: number): number {
    return this.spriteOf(x)?.pixel ?? 0x0
  }

  add(sprite: Sprite): void {
    this.sprites.set(sprite.x, sprite)
  }

  clear(): void {
    this.sprites.clear()
  }

  private spriteOf(x: number): Sprite | null {
    return this.sprites.get(x) ?? null
  }
}
