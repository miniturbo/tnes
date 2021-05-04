import { BadAddressError } from '/@/errors'
import { Ram } from '/@/models/Ram'
import { Rom } from '/@/models/Rom'

export class Bus {
  rom: Rom | null = null

  constructor(private videoRam: Ram, private paletteRam: Ram) {}

  read(address: Uint16): Uint8 {
    if (address >= 0x0000 && address <= 0x1fff) {
      return this.rom ? this.rom.readCharacterRom(address) : 0x00
    } else if (address >= 0x2000 && address <= 0x2fff) {
      // TODO: Implement mirroring
      return this.videoRam.read(address & 0x0fff) || 0
    } else if (address >= 0x3000 && address <= 0x3fff) {
      return this.paletteRam.read(address & 0x1f)
    } else {
      throw new BadAddressError(address)
    }
  }

  write(address: Uint16, data: Uint8): void {
    if (address >= 0x0000 && address <= 0x1fff) {
      // TODO
    } else if (address >= 0x2000 && address <= 0x2fff) {
      this.videoRam.write(address & 0x1fff, data)
    } else if (address >= 0x3000 && address <= 0x3f1f) {
      this.paletteRam.write(address & 0x1f, data)
    } else {
      throw new BadAddressError(address)
    }
  }
}
