import { BadAddressError } from '@/errors'
import { Ram } from '@/models/Ram'
import { Rom } from '@/models/Rom'

export class PpuBus {
  rom: Rom | null = null
  videoRam: Ram | null = null
  paletteRam: Ram | null = null

  read(address: Uint16): Uint8 {
    if (address >= 0x0000 && address <= 0x1fff) {
      return this.rom?.readCharacterRom(address) ?? 0x00
    } else if (address >= 0x2000 && address <= 0x2fff) {
      // TODO: Implement mirroring
      return this.videoRam?.read(address & 0x0fff) ?? 0x00
    } else if (address >= 0x3000 && address <= 0x3eff) {
      return this.read(address - 0x1000)
    } else if (address >= 0x3f00 && address <= 0x3fff) {
      return this.paletteRam?.read(address & 0x1f) ?? 0x00
    } else {
      throw new BadAddressError(address)
    }
  }

  write(address: Uint16, data: Uint8): void {
    if (address >= 0x0000 && address <= 0x1fff) {
      // TODO
    } else if (address >= 0x2000 && address <= 0x2fff) {
      this.videoRam?.write(address & 0x1fff, data)
    } else if (address >= 0x3000 && address <= 0x3eff) {
      this.write(address - 0x1000, data)
    } else if (address >= 0x3f00 && address <= 0x3fff) {
      this.paletteRam?.write(address & 0x1f, data)
    } else {
      throw new BadAddressError(address)
    }
  }
}
