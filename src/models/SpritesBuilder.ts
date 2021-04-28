import { Rom } from '/@/models/Rom'
import { Sprite } from '/@/models/Sprite'

export class SpritesBuilder {
  constructor(private rom: Rom) {}

  private get spritesNumber(): number {
    return this.rom.characterRomSize / Sprite.BYTE_SIZE
  }

  build(): Sprite[] {
    return Array.from({ length: this.spritesNumber }, (_v, i) => {
      return new Sprite(this.rom.characterRom.slice(Sprite.BYTE_SIZE * i, Sprite.BYTE_SIZE * i + Sprite.BYTE_SIZE - 1))
    })
  }
}
