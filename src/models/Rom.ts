import { Memoize } from 'typescript-memoize'

export class Rom {
  static readonly HEADER_SIZE: number = 0x10
  static readonly PROGRAM_ROM_UNIT: number = 0x4000
  static readonly CHARACTER_ROM_UNIT: number = 0x2000

  static load(buffer: ArrayBuffer): Rom {
    return new this(new Uint8Array(buffer))
  }

  constructor(private view: Uint8Array) {}

  @Memoize()
  get programRom(): Uint8Array {
    return this.view.slice(Rom.HEADER_SIZE, Rom.HEADER_SIZE + this.programRomSize - 0x0001)
  }

  @Memoize()
  get programRomPages(): number {
    return this.view[4]
  }

  @Memoize()
  get programRomSize(): number {
    return Rom.PROGRAM_ROM_UNIT * this.programRomPages
  }

  @Memoize()
  get programRomMirrored(): boolean {
    return this.programRomPages === 1
  }

  @Memoize()
  get characterRom(): Uint8Array {
    return this.view.slice(
      Rom.HEADER_SIZE + this.programRomSize,
      Rom.HEADER_SIZE + this.programRomSize + this.characterRomSize - 0x0001
    )
  }

  @Memoize()
  get characterRomPages(): number {
    return this.view[5]
  }

  @Memoize()
  get characterRomSize(): number {
    return Rom.CHARACTER_ROM_UNIT * this.characterRomPages
  }

  readProgramRom(address: Uint16): Uint8 {
    return this.programRom[(this.programRomMirrored ? address & 0xbfff : address) - 0x8000]
  }

  readCharacterRom(address: Uint16): Uint8 {
    return this.characterRom[address]
  }
}
