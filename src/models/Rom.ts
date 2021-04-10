import { Memoize } from 'typescript-memoize'

export default class Rom {
  static readonly HEADER_SIZE: number = 0x0010
  static readonly PROGRAM_ROM_UNIT: number = 0x4000
  static readonly CHARACTER_ROM_UNIT: number = 0x2000

  static async load(uri: string): Promise<Rom> {
    const response = await fetch(uri)
    const buffer = await response.arrayBuffer()
    const view = new Uint8Array(buffer)
    return new this(view)
  }

  constructor(private view: Uint8Array) {}

  @Memoize()
  get programRom(): Uint8Array {
    return this.view.slice(Rom.HEADER_SIZE, Rom.HEADER_SIZE + this.programRomSize - 1)
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
  get characterRom(): Uint8Array {
    return this.view.slice(
      Rom.HEADER_SIZE + this.programRomSize,
      Rom.HEADER_SIZE + this.programRomSize + this.characterRomSize - 1
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
    return this.programRom[address - 0x8000]
  }

  readCharacterRom(address: Uint16): Uint8 {
    return this.characterRom[address]
  }
}
