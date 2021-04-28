import { Logger, NesDumper, PpuCycle, PpuScanline, Rgb, VideoRenderer } from '/@/types'
import { BadAddressError } from '/@/errors'
import {
  bitFlag,
  bitOf,
  combineLowByteToWord,
  maskAsByte,
  maskAsWord,
  shiftLeft,
  toHex,
  validateNonNullable,
} from '/@/utils'
import { Bus } from '/@/models/Ppu/Bus'
import { InterruptController } from '/@/models/InterruptController'
import { Latches } from '/@/models/Ppu/Latches'
import { Palettes } from '/@/models/Ppu/Palettes'
import { Registers } from '/@/models/Ppu/Registers'
import { ShiftRegisters } from '/@/models/Ppu/ShiftRegister'

export { Bus as PpuBus }

export class Ppu {
  debug = false
  logger: Logger | null = null
  dumper: NesDumper | null = null
  videoRenderer: VideoRenderer | null = null

  private scanline: PpuScanline = 0
  private cycle: PpuCycle = 0
  private palettes = new Palettes()
  private latches = new Latches()
  private registers = new Registers()
  private shiftRegisters = new ShiftRegisters()

  constructor(private bus: Bus, private interruptController: InterruptController) {}

  private get isBackgroundEnabled(): boolean {
    return this.registers.isBackgroundEnabled
  }

  private get onVisibleScanline(): boolean {
    return this.scanline >= 0 && this.scanline <= 239
  }

  private get onPreRenderScanline(): boolean {
    return this.scanline === 261
  }

  private get onVisibleCycle(): boolean {
    return this.cycle >= 1 && this.cycle <= 256
  }

  private get onPrefetchCycle(): boolean {
    return this.cycle >= 321 && this.cycle <= 336
  }

  private get onFetchCycle(): boolean {
    return this.onVisibleCycle || this.onPrefetchCycle
  }

  private get onXScrollCycle(): boolean {
    return (this.onVisibleCycle || this.onPrefetchCycle) && this.cycle % 8 === 0
  }

  private get onYScrollCycle(): boolean {
    return this.cycle === 256
  }

  private get onXCopyCycle(): boolean {
    return this.cycle === 257
  }

  private get onYCopyCycle(): boolean {
    return this.cycle >= 280 && this.cycle <= 304
  }

  private get onLoadCycle(): boolean {
    return ((this.cycle >= 9 && this.cycle <= 257) || (this.cycle >= 329 && this.cycle <= 337)) && this.cycle % 8 === 1
  }

  // see: http://wiki.nesdev.com/w/images/d/d1/Ntsc_timing.png
  runCycle(): void {
    if (this.onVisibleScanline || this.onPreRenderScanline) {
      if (this.onVisibleScanline && this.onVisibleCycle) this.renderPixel()
      if (this.onLoadCycle) this.loadBackground()
      if (this.onFetchCycle) this.shiftBackground()
      if (this.onFetchCycle) this.fetchBackground()
      if (this.onXScrollCycle) this.scrollX()
      if (this.onYScrollCycle) this.scrollY()
      if (this.onXCopyCycle) this.copyX()
      if (this.onPreRenderScanline && this.onYCopyCycle) this.copyY()
    }

    if (this.scanline === 241) {
      if (this.cycle === 1) {
        this.startVerticalBlank()
        this.renderScreen()
      }
    }

    if (this.onPreRenderScanline) {
      if (this.cycle === 1) {
        this.stopVerticalBlank()
      }
    }

    this.tick()

    if (this.dumper) {
      this.dumper.ppuScanline = this.scanline
      this.dumper.ppuCycle = this.cycle
    }

    if (this.debug && this.logger) {
      this.logger.log(`[Ppu] ${this.inspect()}`)
      this.logger.log(`[Ppu Latch] ${this.latches.inspect()}`)
      this.logger.log(`[Ppu Control Register] ${this.registers.inspectController()}`)
      this.logger.log(`[Ppu Mask Register] ${this.registers.inspectMask()}`)
      this.logger.log(`[Ppu Status Register] ${this.registers.inspectStatus()}`)
      this.logger.log(`[Ppu Shift Register] ${this.shiftRegisters.inspect()}`)
    }
  }

  readRegister(address: Uint16): Uint8 {
    switch (address) {
      case 0x2000: {
        return 0x00
      }
      case 0x2001: {
        return 0x00
      }
      case 0x2002: {
        return this.registers.status
      }
      default: {
        throw new BadAddressError(address)
      }
    }
  }

  writeRegister(address: Uint16, data: Uint8): void {
    switch (address) {
      case 0x2000: {
        this.registers.controller = data
        break
      }
      case 0x2001: {
        this.registers.mask = data
        break
      }
      case 0x2005: {
        this.registers.changeScrollPosition(data)
        break
      }
      case 0x2006: {
        this.registers.writeVideoRamAddress(data)
        break
      }
      case 0x2007: {
        this.bus.write(this.registers.currentVideoRamAddress, data)
        this.registers.currentVideoRamAddress += this.registers.videoRamAddressIncrement
        break
      }
      default: {
        throw new BadAddressError(address)
      }
    }
  }

  private renderPixel(): void {
    const x = this.cycle - 1
    const y = this.scanline
    const palette = this.registers.isBackgroundEnabled ? this.backgroundPalette() : this.defaultPalette()

    validateNonNullable(this.videoRenderer)

    this.videoRenderer.renderPixel(x, y, palette)
  }

  private renderScreen(): void {
    validateNonNullable(this.videoRenderer)
    this.videoRenderer.renderScreen()
  }

  private backgroundPalette(): Rgb {
    const index =
      (bitOf(this.shiftRegisters.attributeTableHigh, 15) << 3) |
      (bitOf(this.shiftRegisters.attributeTableLow, 15) << 2) |
      (bitOf(this.shiftRegisters.patternTableHigh, 15) << 1) |
      bitOf(this.shiftRegisters.patternTableLow, 15)

    return this.palettes.find(this.bus.read(0x3f00 + index))
  }

  private defaultPalette(): Rgb {
    return this.palettes.find(this.bus.read(0x3f00))
  }

  private loadBackground(): void {
    this.shiftRegisters.attributeTableLow = combineLowByteToWord(
      this.shiftRegisters.attributeTableLow,
      this.latches.attributeTableLow
    )
    this.shiftRegisters.attributeTableHigh = combineLowByteToWord(
      this.shiftRegisters.attributeTableHigh,
      this.latches.attributeTableHigh
    )
    this.shiftRegisters.patternTableLow = combineLowByteToWord(
      this.shiftRegisters.patternTableLow,
      this.latches.patternTableLow
    )
    this.shiftRegisters.patternTableHigh = combineLowByteToWord(
      this.shiftRegisters.patternTableHigh,
      this.latches.patternTableHigh
    )
  }

  private shiftBackground(): void {
    this.shiftRegisters.attributeTableLow = maskAsWord(shiftLeft(this.shiftRegisters.attributeTableLow))
    this.shiftRegisters.attributeTableHigh = maskAsWord(shiftLeft(this.shiftRegisters.attributeTableHigh))
    this.shiftRegisters.patternTableLow = maskAsWord(shiftLeft(this.shiftRegisters.patternTableLow))
    this.shiftRegisters.patternTableHigh = maskAsWord(shiftLeft(this.shiftRegisters.patternTableHigh))
  }

  private fetchBackground(): void {
    switch (this.cycle % 8) {
      case 2: {
        // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Tile_and_attribute_fetching
        const address = 0x2000 | (this.registers.currentVideoRamAddress & 0x0fff)
        this.latches.nameTable = maskAsByte(this.bus.read(address))
        break
      }
      case 4: {
        // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Tile_and_attribute_fetching
        // see: http://wiki.nesdev.com/w/index.php/PPU_attribute_tables
        const address =
          0x23c0 |
          (this.registers.currentVideoRamAddress & 0x0c00) |
          ((this.registers.currentVideoRamAddress >> 4) & 0x38) |
          ((this.registers.currentVideoRamAddress >> 2) & 0x07)
        const isRight = bitFlag(this.registers.currentVideoRamAddress, 2)
        const isBottom = bitFlag(this.registers.currentVideoRamAddress, 7)
        const position = ((isBottom ? 0x02 : 0x00) | (isRight ? 0x01 : 0x00)) << 0x01
        const data = (this.bus.read(address) >> position) & 0x03
        this.latches.attributeTableLow = bitFlag(data, 1) ? 0xff : 0x00
        this.latches.attributeTableHigh = bitFlag(data, 2) ? 0xff : 0x00
        break
      }
      case 6: {
        const fineY = (this.registers.currentVideoRamAddress >> 12) & 0x7
        const address = this.latches.nameTable * 16 + fineY
        this.latches.patternTableLow = maskAsByte(this.bus.read(address))
        break
      }
      case 0: {
        const fineY = (this.registers.currentVideoRamAddress >> 12) & 0x7
        const address = this.latches.nameTable * 16 + fineY + 8
        this.latches.patternTableHigh = maskAsByte(this.bus.read(address))
        break
      }
    }
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Between_dot_328_of_a_scanline.2C_and_256_of_the_next_scanline
  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Coarse_X_increment
  private scrollX(): void {
    if (!this.isBackgroundEnabled) return

    if ((this.registers.currentVideoRamAddress & 0x001f) == 31) {
      this.registers.currentVideoRamAddress &= ~0x001f
    } else {
      this.registers.currentVideoRamAddress++
    }
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#At_dot_256_of_each_scanline
  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Y_increment
  private scrollY(): void {
    if (!this.isBackgroundEnabled) return

    if ((this.registers.currentVideoRamAddress & 0x7000) !== 0x7000) {
      this.registers.currentVideoRamAddress += 0x1000
    } else {
      this.registers.currentVideoRamAddress &= ~0x7000

      let y = (this.registers.currentVideoRamAddress & 0x03e0) >> 5
      if (y === 31) {
        y = 0
      } else {
        y++
      }

      this.registers.currentVideoRamAddress = (this.registers.currentVideoRamAddress & ~0x03e0) | (y << 5)
    }
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#At_dot_257_of_each_scanline
  private copyX(): void {
    if (!this.isBackgroundEnabled) return

    this.registers.currentVideoRamAddress &= 0xfbe0
    this.registers.currentVideoRamAddress |= this.registers.temporaryVideoRamAddress & ~0xfbe0
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#During_dots_280_to_304_of_the_pre-render_scanline_.28end_of_vblank.29
  private copyY(): void {
    if (!this.isBackgroundEnabled) return

    this.registers.currentVideoRamAddress &= 0x7be0
    this.registers.currentVideoRamAddress = this.registers.temporaryVideoRamAddress & ~0x7be0
  }

  private startVerticalBlank(): void {
    this.registers.isVerticalBlankStarted = true
    this.interruptController.nmi = true
  }

  private stopVerticalBlank(): void {
    this.registers.isVerticalBlankStarted = false
  }

  private tick(): void {
    this.cycle++

    if (this.cycle > 340) {
      this.cycle = 0
      this.scanline++
    }

    if (this.scanline > 261) {
      this.scanline = 0
    }
  }

  private inspect(): string {
    return (
      `scanline: ${this.scanline}, cycle: ${this.cycle}, ` +
      `current VRAM address: ${toHex(this.registers.currentVideoRamAddress, 4)}, ` +
      `temporary VRAM address: ${toHex(this.registers.temporaryVideoRamAddress, 4)}`
    )
  }
}
