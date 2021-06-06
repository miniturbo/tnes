import { BadAddressError } from '@/errors'
import { InterruptController } from '@/models/InterruptController'
import { Palettes } from '@/models/Ppu/Palettes'
import { PpuBus } from '@/models/Ppu/PpuBus'
import { PpuLatches } from '@/models/Ppu/PpuLatches'
import { PpuRegisters } from '@/models/Ppu/PpuRegisters'
import { PpuShiftRegisters } from '@/models/Ppu/PpuShiftRegister'
import { PpuSpriteRegisters } from '@/models/Ppu/PpuSpriteRegisters'
import { Sprite } from '@/models/Ppu/Sprite'
import { Ram } from '@/models/Ram'
import { PpuCycle, PpuScanline, PpuSpriteEvaluationState, VideoRenderer } from '@/types'
import { bitFlag, bitOf, combineLowByteToWord, maskAsByte, maskAsWord } from '@/utils'

export class Ppu {
  interruptController: InterruptController | null = null
  videoRenderer: VideoRenderer | null = null

  readonly bus = new PpuBus()
  readonly registers = new PpuRegisters()
  readonly palettes = new Palettes()

  private _scanline: PpuScanline = 0
  private _cycle: PpuCycle = 0

  private videoRam = new Ram(2048)
  private paletteRam = new Ram(32)
  private latches = new PpuLatches()
  private shiftRegisters = new PpuShiftRegisters()

  private oddFrame = true
  private spriteEvaluationIndex = 0x00
  private spriteEvaluationZero = false
  private spriteEvaluationState: PpuSpriteEvaluationState = PpuSpriteEvaluationState.YPositionCopying
  private spriteRegisters = new PpuSpriteRegisters()

  constructor() {
    this.bus.videoRam = this.videoRam
    this.bus.paletteRam = this.paletteRam
  }

  get scanline(): PpuScanline {
    return this._scanline
  }

  get cycle(): PpuCycle {
    return this._cycle
  }

  powerUp(): void {
    this.registers.controller = 0x00
    this.registers.mask = 0x00
    this.registers.status = 0x00
    this.registers.secondaryOam.fill(0xff)
    this.registers.currentVideoRamAddress = 0x0000
    this.registers.temporaryVideoRamAddress = 0x0000
    this.registers.writeToggle = false

    this.latches.nameTable = 0x00
    this.latches.attributeTableLow = 0x00
    this.latches.attributeTableHigh = 0x00
    this.latches.patternTableLow = 0x00
    this.latches.patternTableHigh = 0x00

    this.shiftRegisters.attributeTableLow = 0x0000
    this.shiftRegisters.attributeTableHigh = 0x0000
    this.shiftRegisters.patternTableLow = 0x0000
    this.shiftRegisters.patternTableHigh = 0x0000

    this.spriteRegisters.clear()

    this.videoRam.clear()
    this.paletteRam.fill(0x3f)

    this.oddFrame = true
  }

  reset(): void {
    this._scanline = 0
    this._cycle = 0

    this.registers.controller = maskAsByte(0x00)
    this.registers.mask = maskAsByte(0x00)
    this.registers.oamAddress = maskAsByte(0x00)
    this.registers.currentVideoRamAddress = maskAsWord(0x0000)
    this.registers.temporaryVideoRamAddress = maskAsWord(0x0000)
    this.registers.writeToggle = false
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
        const data = this.registers.status
        this.registers.isVerticalBlankStarted = false
        return data
      }
      case 0x2003: {
        return 0x00
      }
      case 0x2004: {
        return this.registers.readPrimaryOam()
      }
      case 0x2005: {
        return 0x00
      }
      case 0x2006: {
        return 0x00
      }
      case 0x2007: {
        // Todo: Implement Data
        return 0x00
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
      case 0x2002: {
        // noop
        break
      }
      case 0x2003: {
        this.registers.oamAddress = data
        break
      }
      case 0x2004: {
        this.registers.writePrimaryOam(data)
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

  copyOam(data: Uint8Array): void {
    this.registers.copyPrimaryOam(data)
  }

  // see: http://wiki.nesdev.com/w/images/d/d1/Ntsc_timing.png
  runCycle(): void {
    if (this.registers.isRenderingEnabled) {
      if (this.scanline >= 0 && this.scanline <= 239) {
        if (this.cycle >= 1 && this.cycle <= 256) {
          this.renderPixel()
        }

        if (this.cycle >= 1 && this.cycle <= 64) {
          this.clearSprite()
        }

        if (this.cycle >= 65 && this.cycle <= 256) {
          this.evaluateSprite()
        }
      }

      if ((this.scanline >= 0 && this.scanline <= 239) || this.scanline === 261) {
        if (this.cycle >= 257 && this.cycle <= 320 && this.cycle % 8 === 0) {
          this.fetchSprite()
        }

        if (
          ((this.cycle >= 9 && this.cycle <= 257) || (this.cycle >= 329 && this.cycle <= 337)) &&
          this.cycle % 8 === 1
        ) {
          this.reloadBackground()
        }

        if ((this.cycle >= 1 && this.cycle <= 256) || (this.cycle >= 321 && this.cycle <= 336)) {
          this.shiftBackground()
        }

        if ((this.cycle >= 1 && this.cycle <= 256) || (this.cycle >= 321 && this.cycle <= 340)) {
          this.fetchBackground()
        }

        if (
          ((this.cycle >= 1 && this.cycle <= 256) || (this.cycle >= 321 && this.cycle <= 336)) &&
          this.cycle % 8 === 0
        ) {
          this.scrollX()
        }

        if (this.cycle === 256) {
          this.scrollY()
        }

        if (this.cycle === 257) {
          this.copyX()
        }
      }

      if (this.scanline === 261 && this.cycle >= 280 && this.cycle <= 304) {
        this.copyY()
      }

      // see: http://wiki.nesdev.com/w/index.php/PPU_rendering#Pre-render_scanline_.28-1_or_261.29
      if (this.scanline === 261 && this.cycle === 340 && this.oddFrame) {
        this._cycle = this.cycle + 1
      }
    }

    if (this.scanline === 240 && this.cycle === 0) {
      this.renderFrame()
    }

    if (this.scanline === 241 && this.cycle === 1) {
      this.startVerticalBlank()
    }

    if (this.scanline === 261 && this.cycle === 1) {
      this.stopVerticalBlank()
    }

    this._cycle = this.cycle + 1

    if (this.cycle > 340) {
      this._cycle = 0
      this._scanline = this._scanline + 1
    }

    if (this.scanline > 261) {
      this._scanline = 0
      this.oddFrame = !this.oddFrame
    }
  }

  // see: https://wiki.nesdev.com/w/index.php/PPU_rendering#Preface
  private renderPixel(): void {
    const x = this.cycle - 1
    const y = this.scanline

    const backgroundPixel =
      (bitOf(this.shiftRegisters.attributeTableHigh, 15) << 3) |
      (bitOf(this.shiftRegisters.attributeTableLow, 15) << 2) |
      (bitOf(this.shiftRegisters.patternTableHigh, 15) << 1) |
      bitOf(this.shiftRegisters.patternTableLow, 15)
    const spritePixel = this.spriteRegisters.pixelOf(x)

    const isTransparentBackgroundPixel = !this.registers.isBackgroundEnabled || backgroundPixel % 4 === 0
    const isTransparentSpritePixel = !this.registers.isSpriteEnabled || spritePixel % 4 === 0

    let pixel
    if (isTransparentBackgroundPixel) {
      if (isTransparentSpritePixel) {
        pixel = 0x3f00
      } else {
        pixel = 0x3f10 + spritePixel
      }
    } else {
      if (isTransparentSpritePixel) {
        pixel = 0x3f00 + backgroundPixel
      } else {
        pixel = 0x3f10 + spritePixel
      }
    }

    const index = this.bus.read(pixel)
    const palette = this.palettes.find(index)

    this.videoRenderer?.renderPixel(x, y, palette)
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation#Details
  private clearSprite(): void {
    if (this.cycle % 2 !== 0) return

    this.registers.secondaryOam[this.cycle / 2 - 1] = 0xff
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation#Details
  private evaluateSprite(): void {
    if (this.cycle % 2 !== 0) return

    if (this.cycle === 66) {
      this.registers.oamAddress = 0x00
      this.spriteEvaluationIndex = 0x00
      this.spriteEvaluationZero = false
      this.spriteEvaluationState = PpuSpriteEvaluationState.YPositionCopying
    }

    switch (this.spriteEvaluationState) {
      case PpuSpriteEvaluationState.YPositionCopying: {
        const yPosition = this.registers.readPrimaryOam()

        if (this.scanline >= yPosition && this.scanline < yPosition + this.registers.spriteSize) {
          this.registers.secondaryOam[this.spriteEvaluationIndex] = yPosition
          this.registers.incrementOamAddress()
          this.spriteEvaluationState = PpuSpriteEvaluationState.TileIndexCopying
        } else {
          this.registers.oamAddress = maskAsByte(this.registers.oamAddress + 4)

          if (this.registers.oamAddress === 0) {
            this.spriteEvaluationState = PpuSpriteEvaluationState.Noop
          }
        }

        break
      }
      case PpuSpriteEvaluationState.TileIndexCopying: {
        this.registers.secondaryOam[this.spriteEvaluationIndex + 1] = this.registers.readPrimaryOam()
        this.registers.incrementOamAddress()
        this.spriteEvaluationState = PpuSpriteEvaluationState.AttributesCopying
        break
      }
      case PpuSpriteEvaluationState.AttributesCopying: {
        this.registers.secondaryOam[this.spriteEvaluationIndex + 2] = this.registers.readPrimaryOam()
        this.registers.incrementOamAddress()
        this.spriteEvaluationState = PpuSpriteEvaluationState.XPositionCopying
        break
      }
      case PpuSpriteEvaluationState.XPositionCopying: {
        this.registers.secondaryOam[this.spriteEvaluationIndex + 3] = this.registers.readPrimaryOam()
        this.registers.incrementOamAddress()
        this.spriteEvaluationIndex = (this.spriteEvaluationIndex + 4) & 0x1f
        this.spriteEvaluationZero = this.spriteEvaluationIndex === 0

        if (this.registers.oamAddress === 0) {
          this.spriteEvaluationState = PpuSpriteEvaluationState.Noop
        } else if (this.spriteEvaluationIndex === 0) {
          // TODO: Implement Sprite Overflow
          this.spriteEvaluationState = PpuSpriteEvaluationState.Noop
        } else {
          this.spriteEvaluationState = PpuSpriteEvaluationState.YPositionCopying
        }

        break
      }
      case PpuSpriteEvaluationState.Noop: {
        break
      }
    }
  }

  /*
    Sprite Byte 0:
      Y position of top of sprite

    Sprite Byte 1:
      Tile index number

      76543210
      ||||||||
      |||||||+- Bank ($0000 or $1000) of tiles
      +++++++-- Tile number of top of sprite (0 to 254; bottom half gets the next tile)

    Sprite Byte 2:
      Attributes

      76543210
      ||||||||
      ||||||++- Palette (4 to 7) of sprite
      |||+++--- Unimplemented
      ||+------ Priority (0: in front of background; 1: behind background)
      |+------- Flip sprite horizontally
      +-------- Flip sprite vertically

    Sprite Byte 3:
      X position of left side of sprite.

    see: https://wiki.nesdev.com/w/index.php/PPU_OAM
  */
  private fetchSprite(): void {
    if (this.cycle === 264) {
      this.spriteRegisters.clear()
    }

    const oamIndex = ((this.cycle - 1) >> 1) & 0x1c

    const yPosition = this.registers.secondaryOam[oamIndex]
    const tileIndex = this.registers.secondaryOam[oamIndex + 1]
    const attributes = this.registers.secondaryOam[oamIndex + 2]
    const xPosition = this.registers.secondaryOam[oamIndex + 3]

    const scanline = this.scanline - yPosition
    const isBehind = bitFlag(attributes, 5)
    const isFlipHorizontally = bitFlag(attributes, 6)
    const isFlipVertically = bitFlag(attributes, 7)

    // TODO: Support for 8x16 sprite
    const address =
      this.registers.spritePatternTableAddres | (tileIndex << 4) | ((scanline & 0x7) ^ (isFlipVertically ? 0x7 : 0x0))
    const tileLow = this.bus.read(address)
    const tileHigh = this.bus.read(address + 0x8)

    for (let i = 0; i < 8; i++) {
      const index = isFlipHorizontally ? i : 0x07 - i

      this.spriteRegisters.add(
        new Sprite(
          xPosition + i,
          yPosition,
          (bitOf(attributes, 1) << 3) |
            (bitOf(attributes, 0) << 2) |
            (bitOf(tileHigh, index) << 1) |
            bitOf(tileLow, index),
          isBehind,
          false
        )
      )
    }
  }

  private reloadBackground(): void {
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
    this.shiftRegisters.attributeTableLow = maskAsWord(this.shiftRegisters.attributeTableLow << 1)
    this.shiftRegisters.attributeTableHigh = maskAsWord(this.shiftRegisters.attributeTableHigh << 1)
    this.shiftRegisters.patternTableLow = maskAsWord(this.shiftRegisters.patternTableLow << 1)
    this.shiftRegisters.patternTableHigh = maskAsWord(this.shiftRegisters.patternTableHigh << 1)
  }

  private fetchBackground(): void {
    switch (this.cycle % 8) {
      case 2: {
        this.fetchNameTable()
        break
      }
      case 4: {
        this.fetchAttributeTable()
        break
      }
      case 6: {
        this.fetchPatternTableLow()
        break
      }
      case 0: {
        this.fetchPatternTableHigh()
        break
      }
    }
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Tile_and_attribute_fetching
  private fetchNameTable(): void {
    const address = 0x2000 | (this.registers.currentVideoRamAddress & 0x0fff)
    this.latches.nameTable = maskAsByte(this.bus.read(address))
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Tile_and_attribute_fetching
  // see: http://wiki.nesdev.com/w/index.php/PPU_attribute_tables
  private fetchAttributeTable(): void {
    const address =
      0x23c0 |
      (this.registers.currentVideoRamAddress & 0x0c00) |
      ((this.registers.currentVideoRamAddress >> 4) & 0x38) |
      ((this.registers.currentVideoRamAddress >> 2) & 0x07)
    const isRight = bitFlag(this.registers.currentVideoRamAddress, 2)
    const isBottom = bitFlag(this.registers.currentVideoRamAddress, 7)
    const position = ((isBottom ? 0x02 : 0x00) | (isRight ? 0x01 : 0x00)) << 0x01
    const data = (this.bus.read(address) >> position) & 0x03
    this.latches.attributeTableLow = bitFlag(data, 0) ? 0xff : 0x00
    this.latches.attributeTableHigh = bitFlag(data, 1) ? 0xff : 0x00
  }

  private fetchPatternTableLow(): void {
    const fineY = (this.registers.currentVideoRamAddress >> 12) & 0x7
    const address = this.registers.backgroundPatternTableAddres + this.latches.nameTable * 16 + fineY
    this.latches.patternTableLow = maskAsByte(this.bus.read(address))
  }

  private fetchPatternTableHigh(): void {
    const fineY = (this.registers.currentVideoRamAddress >> 12) & 0x7
    const address = this.registers.backgroundPatternTableAddres + this.latches.nameTable * 16 + fineY + 8
    this.latches.patternTableHigh = maskAsByte(this.bus.read(address))
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Between_dot_328_of_a_scanline.2C_and_256_of_the_next_scanline
  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Coarse_X_increment
  private scrollX(): void {
    if ((this.registers.currentVideoRamAddress & 0x001f) === 0x001f) {
      this.registers.currentVideoRamAddress &= ~0x001f
    } else {
      this.registers.currentVideoRamAddress++
    }
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#At_dot_256_of_each_scanline
  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#Y_increment
  private scrollY(): void {
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
    this.registers.currentVideoRamAddress &= 0xfbe0
    this.registers.currentVideoRamAddress |= this.registers.temporaryVideoRamAddress & ~0xfbe0
  }

  // see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#During_dots_280_to_304_of_the_pre-render_scanline_.28end_of_vblank.29
  private copyY(): void {
    this.registers.currentVideoRamAddress &= 0x7be0
    this.registers.currentVideoRamAddress = this.registers.temporaryVideoRamAddress & ~0x7be0
  }

  private renderFrame(): void {
    this.videoRenderer?.renderFrame()
  }

  private startVerticalBlank(): void {
    this.registers.isVerticalBlankStarted = true
    if (this.registers.isNmiEnabled) this.interruptController?.requestNmi()
  }

  private stopVerticalBlank(): void {
    this.registers.isVerticalBlankStarted = false
  }
}
