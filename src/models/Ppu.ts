import { Cycle, Logger, Rgb, Scanline, VideoRenderer } from '/@/types'
import { toHex, validateNonNullable } from '/@/utils'
import Palettes from '/@/models/Palettes'
import PpuBus from '/@/models/PpuBus'
import PpuLatches from '/@/models/PpuLatches'
import PpuRegisters from '/@/models/PpuRegisters'
import PpuShiftRegisters from '/@/models/PpuShiftRegister'

export default class Ppu {
  private debug = false
  private logger: Logger | null = null
  private videoRenderer: VideoRenderer | null = null
  private scanline: Scanline = 0
  private cycle: Cycle = 0
  private palettes = new Palettes()
  private latches = new PpuLatches()
  private registers = new PpuRegisters()
  private shiftRegisters = new PpuShiftRegisters()

  constructor(private bus: PpuBus) {}

  get isBackgroundEnabled(): boolean {
    return this.registers.ppuMask.isBackgroundEnabled
  }

  get onVisibleScanline(): boolean {
    return this.scanline >= 0 && this.scanline <= 239
  }

  get onPreRenderScanline(): boolean {
    return this.scanline === 261
  }

  get onVisibleCycle(): boolean {
    return this.cycle >= 1 && this.cycle <= 256
  }

  get onPrefetchCycle(): boolean {
    return this.cycle >= 321 && this.cycle <= 336
  }

  get onFetchCycle(): boolean {
    return this.onVisibleCycle || this.onPrefetchCycle
  }

  get onXScrollCycle(): boolean {
    return (this.onVisibleCycle || this.onPrefetchCycle) && this.cycle % 8 === 0
  }

  get onYScrollCycle(): boolean {
    return this.cycle === 256
  }

  get onXCopyCycle(): boolean {
    return this.cycle === 257
  }

  get onYCopyCycle(): boolean {
    return this.cycle >= 280 && this.cycle <= 304
  }

  get onLoadCycle(): boolean {
    return ((this.cycle >= 9 && this.cycle <= 257) || (this.cycle >= 329 && this.cycle <= 337)) && this.cycle % 8 === 1
  }

  setDebug(debug: boolean): void {
    this.debug = debug
  }

  setLogger(logger: Logger): void {
    this.logger = logger
  }

  setVideoRenderer(videoRenderer: VideoRenderer): void {
    this.videoRenderer = videoRenderer
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
        this.renderScreen()
      }
    }

    this.tick()

    if (this.debug && this.logger) {
      this.logger.log(
        '[Ppu] ' +
          `cycle: ${this.cycle}, scanline: ${this.scanline}, ` +
          `current VRAM address: ${toHex(this.registers.currentVideoRamAddress, 4)}, ` +
          `temporary VRAM address: ${toHex(this.registers.temporaryVideoRamAddress, 4)}`
      )
      this.logger.log(`[Ppu Latch] ${this.latches.inspect()}`)
      this.logger.log(`[Ppu Register] ${this.registers.inspect()}`)
      this.logger.log(`[Ppu Shift Register] ${this.shiftRegisters.inspect()}`)
    }
  }

  writeRegister(address: Uint16, data: Uint8): void {
    switch (address) {
      case 0x2001: {
        this.registers.ppuMask.write(data)
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
        this.registers.currentVideoRamAddress++
        break
      }
    }
  }

  private renderPixel(): void {
    const x = this.cycle - 1
    const y = this.scanline
    const palette = this.registers.ppuMask.isBackgroundEnabled ? this.backgroundPalette() : this.defaultPalette()

    validateNonNullable(this.videoRenderer)

    this.videoRenderer.renderPixel(x, y, palette)
  }

  private renderScreen(): void {
    validateNonNullable(this.videoRenderer)
    this.videoRenderer.renderScreen()
  }

  private backgroundPalette(): Rgb {
    const index =
      (this.shiftRegisters.attributeTableHigh.readBit(15) << 3) |
      (this.shiftRegisters.attributeTableLow.readBit(15) << 2) |
      (this.shiftRegisters.patternTableHigh.readBit(15) << 1) |
      this.shiftRegisters.patternTableLow.readBit(15)

    return this.palettes.find(this.bus.read(0x3f00 + index))
  }

  private defaultPalette(): Rgb {
    return this.palettes.find(this.bus.read(0x3f00))
  }

  private loadBackground(): void {
    this.shiftRegisters.attributeTableLow.writeLowByte(this.latches.attributeTableLow.read())
    this.shiftRegisters.attributeTableHigh.writeLowByte(this.latches.attributeTableHigh.read())
    this.shiftRegisters.patternTableLow.writeLowByte(this.latches.patternTableLow.read())
    this.shiftRegisters.patternTableHigh.writeLowByte(this.latches.patternTableHigh.read())
  }

  private shiftBackground(): void {
    this.shiftRegisters.attributeTableLow.shift()
    this.shiftRegisters.attributeTableHigh.shift()
    this.shiftRegisters.patternTableLow.shift()
    this.shiftRegisters.patternTableHigh.shift()
  }

  private fetchBackground(): void {
    switch (this.cycle % 8) {
      case 2: {
        // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Tile_and_attribute_fetching
        const address = 0x2000 | (this.registers.currentVideoRamAddress & 0x0fff)
        this.latches.nameTable.write(this.bus.read(address))
        break
      }
      case 4: {
        // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Tile_and_attribute_fetching
        this.latches.attributeTableLow.write(0)
        this.latches.attributeTableHigh.write(0)
        break
      }
      case 6: {
        const fineY = (this.registers.currentVideoRamAddress >> 12) & 0x7
        const address = this.latches.nameTable.read() * 16 + fineY
        this.latches.patternTableLow.write(this.bus.read(address))
        break
      }
      case 0: {
        const fineY = (this.registers.currentVideoRamAddress >> 12) & 0x7
        const address = this.latches.nameTable.read() * 16 + fineY + 8
        this.latches.patternTableHigh.write(this.bus.read(address))
        break
      }
    }
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Between_dot_328_of_a_scanline.2C_and_256_of_the_next_scanline
  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Coarse_X_increment
  scrollX(): void {
    if (!this.isBackgroundEnabled) return

    if ((this.registers.currentVideoRamAddress & 0x001f) == 31) {
      this.registers.currentVideoRamAddress &= ~0x001f
    } else {
      this.registers.currentVideoRamAddress++
    }
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#At_dot_256_of_each_scanline
  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Y_increment
  scrollY(): void {
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
  copyX(): void {
    if (!this.isBackgroundEnabled) return

    this.registers.currentVideoRamAddress &= 0xfbe0
    this.registers.currentVideoRamAddress |= this.registers.temporaryVideoRamAddress & ~0xfbe0
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#During_dots_280_to_304_of_the_pre-render_scanline_.28end_of_vblank.29
  copyY(): void {
    if (!this.isBackgroundEnabled) return

    this.registers.currentVideoRamAddress &= 0x7be0
    this.registers.currentVideoRamAddress = this.registers.temporaryVideoRamAddress & ~0x7be0
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
}
