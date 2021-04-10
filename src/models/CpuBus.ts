import { Logger } from '/@/types'
import { toHex, validateNonNullable } from '/@/utils'
import Ppu from '/@/models/Ppu'
import Ram from '/@/models/Ram'
import Rom from '/@/models/Rom'

export default class CpuBus {
  private debug = false
  private logger: Logger | null = null
  private rom: Rom | null = null

  constructor(private workRam: Ram, private ppu: Ppu) {}

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
      this.logger.log(`[Cpu Bus] read address: ${toHex(address, 4)}`)
    }

    if (address >= 0x0000 && address <= 0x1fff) {
      return this.workRam.read(address & 0x07ff)
    } else if (address >= 0x8000 && address <= 0xffff) {
      validateNonNullable(this.rom)
      return this.rom.readProgramRom(address)
    }

    return 0
  }

  write(address: Uint16, data: Uint8): void {
    if (this.debug && this.logger) {
      this.logger.log(`[Cpu Bus] write address: ${toHex(address, 4)}, data: ${toHex(data, 2)}`)
    }

    if (address >= 0x2000 && address <= 0x3fff) {
      return this.ppu.writeRegister(address & 0x2007, data)
    }
  }
}
