import { Logger } from '/@/types'
import { BadAddressError } from '/@/errors'
import { toHex, validateNonNullable } from '/@/utils'
import { Controller } from '/@/models/Controller'
import { Ppu } from '/@/models/Ppu'
import { Ram } from '/@/models/Ram'
import { Rom } from '/@/models/Rom'

export class Bus {
  debug = false
  logger: Logger | null = null
  rom: Rom | null = null

  constructor(
    private workRam: Ram,
    private ppu: Ppu,
    private controller1: Controller,
    private controller2: Controller
  ) {}

  read(address: Uint16): Uint8 {
    if (this.debug && this.logger) {
      this.logger.log(`[Cpu Bus] read address: ${toHex(address, 4)}`)
    }

    if (address >= 0x0000 && address <= 0x1fff) {
      return this.workRam.read(address & 0x07ff)
    } else if (address >= 0x2000 && address <= 0x3fff) {
      return this.ppu.readRegister(address & 0x2007)
    } else if (address >= 0x4000 && address <= 0x4015) {
      // TODO: Implement APU
      return 0xff
    } else if (address === 0x4016) {
      return this.controller1.read()
    } else if (address === 0x4017) {
      return this.controller2.read()
    } else if (address >= 0x8000 && address <= 0xffff) {
      validateNonNullable(this.rom)
      return this.rom.readProgramRom(address)
    } else {
      throw new BadAddressError(address)
    }
  }

  write(address: Uint16, data: Uint8): void {
    if (this.debug && this.logger) {
      this.logger.log(`[Cpu Bus] write address: ${toHex(address, 4)}, data: ${toHex(data, 2)}`)
    }

    if (address >= 0x0000 && address <= 0x1fff) {
      this.workRam.write(address, data)
    } else if (address >= 0x2000 && address <= 0x3fff) {
      this.ppu.writeRegister(address & 0x2007, data)
    } else if (address >= 0x4000 && address <= 0x4015) {
      // TODO: Implement APU
    } else if (address === 0x4016) {
      this.controller1.write(data)
      this.controller2.write(data)
    } else if (address === 0x4017) {
      // TODO: Implement APU
    } else {
      throw new BadAddressError(address)
    }
  }
}
