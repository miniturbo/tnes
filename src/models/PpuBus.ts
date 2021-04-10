import { Logger } from '/@/types'
import { BadAddressError } from '/@/errors'
import { toHex, validateNonNullable } from '/@/utils'
import Ram from '/@/models/Ram'
import Rom from '/@/models/Rom'

export default class PpuBus {
  private debug = false
  private logger: Logger | null = null
  private rom: Rom | null = null

  constructor(private videoRam: Ram, private paletteRam: Ram) {}

  setDebug(debug: boolean): void {
    this.debug = debug
  }

  setLogger(logger: Logger): void {
    this.logger = logger
  }

  setRom(rom: Rom): void {
    this.rom = rom
  }

  read(address: Uint16): Uint8 {
    if (this.debug && this.logger) {
      this.logger.log(`[Ppu Bus] read address: ${toHex(address, 4)}`)
    }

    if (address >= 0x0000 && address <= 0x1fff) {
      validateNonNullable(this.rom)
      return this.rom.readCharacterRom(address)
    } else if (address >= 0x2000 && address <= 0x2fff) {
      return this.videoRam.read(address & 0x1fff) || 0 // TODO: Implement mirroring
    } else if (address >= 0x3000 && address <= 0x3f1f) {
      return this.paletteRam.read(address & 0x1f)
    } else {
      throw new BadAddressError(address)
    }
  }

  write(address: Uint16, data: Uint8): void {
    if (this.debug && this.logger) {
      this.logger.log(`[Ppu Bus] write address: ${toHex(address, 4)}, data: ${toHex(data, 2)}`)
    }

    if (address >= 0x2000 && address <= 0x2fff) {
      this.videoRam.write(address & 0x1fff, data)
    } else if (address >= 0x3000 && address <= 0x3f1f) {
      this.paletteRam.write(address & 0x1f, data)
    } else {
      throw new BadAddressError(address)
    }
  }
}
