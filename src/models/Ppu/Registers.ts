import { bitFlag, maskAsByte, setBitFlag } from '/@/utils'

export class Registers {
  /*
    7  bit  0
    ---- ----
    VPHB SINN
    |||| ||||
    |||| ||++- Base nametable address
    |||| ||    (0 = $2000; 1 = $2400; 2 = $2800; 3 = $2C00)
    |||| |+--- VRAM address increment per CPU read/write of PPUDATA
    |||| |     (0: add 1, going across; 1: add 32, going down)
    |||| +---- Sprite pattern table address for 8x8 sprites
    ||||       (0: $0000; 1: $1000; ignored in 8x16 mode)
    |||+------ Background pattern table address (0: $0000; 1: $1000)
    ||+------- Sprite size (0: 8x8 pixels; 1: 8x16 pixels)
    |+-------- PPU master/slave select
    |          (0: read backdrop from EXT pins; 1: output color on EXT pins)
    +--------- Generate an NMI at the start of the
               vertical blanking interval (0: off; 1: on)
  */
  controller: Uint8 = 0x00
  /*
    7  bit  0
    ---- ----
    BGRs bMmG
    |||| ||||
    |||| |||+- Greyscale (0: normal color, 1: produce a greyscale display)
    |||| ||+-- 1: Show background in leftmost 8 pixels of screen, 0: Hide
    |||| |+--- 1: Show sprites in leftmost 8 pixels of screen, 0: Hide
    |||| +---- 1: Show background
    |||+------ 1: Show sprites
    ||+------- Emphasize red (green on PAL/Dendy)
    |+-------- Emphasize green (red on PAL/Dendy)
    +--------- Emphasize blue

    see: http://wiki.nesdev.com/w/index.php/PPU_registers#Mask_.28.242001.29_.3E_write
  */
  mask: Uint8 = 0x00
  /*
    7  bit  0
    ---- ----
    VSO. ....
    |||| ||||
    |||+-++++- Least significant bits previously written into a PPU register
    |||        (due to register not being updated for this address)
    ||+------- Sprite overflow. The intent was for this flag to be set
    ||         whenever more than eight sprites appear on a scanline, but a
    ||         hardware bug causes the actual behavior to be more complicated
    ||         and generate false positives as well as false negatives; see
    ||         PPU sprite evaluation. This flag is set during sprite
    ||         evaluation and cleared at dot 1 (the second dot) of the
    ||         pre-render line.
    |+-------- Sprite 0 Hit.  Set when a nonzero pixel of sprite 0 overlaps
    |          a nonzero background pixel; cleared at dot 1 of the pre-render
    |          line.  Used for raster timing.
    +--------- Vertical blank has started (0: not in vblank; 1: in vblank).
               Set at dot 1 of line 241 (the line *after* the post-render
               line); cleared after reading $2002 and at dot 1 of the
               pre-render line.
  */
  status: Uint8 = 0x00
  currentVideoRamAddress: Uint16 = 0x0000
  temporaryVideoRamAddress: Uint16 = 0x0000
  writeToggle = false

  get videoRamAddressIncrement(): number {
    return bitFlag(this.controller, 2) ? 32 : 1
  }

  get backgroundPatternTableAddres(): Uint16 {
    return bitFlag(this.controller, 4) ? 0x1000 : 0x0000
  }

  get isNmiEnabled(): boolean {
    return bitFlag(this.status, 7)
  }

  get isBackgroundEnabled(): boolean {
    return bitFlag(this.mask, 3)
  }

  get isVerticalBlankStarted(): boolean {
    return bitFlag(this.status, 7)
  }

  set isVerticalBlankStarted(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 7, flag))
  }

  /*
    $2005 first write (w is 0)
      t: ....... ...HGFED = d: HGFED...
      x:              CBA = d: .....CBA
      w:                  = 1

    $2005 second write (w is 1)
      t: CBA..HG FED..... = d: HGFEDCBA
      w:                  = 0

    see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#.242005_first_write_.28w_is_0.29
  */
  changeScrollPosition(data: Uint8): void {
    if (!this.writeToggle) {
      // first write
      this.temporaryVideoRamAddress &= 0xffe0
      this.temporaryVideoRamAddress |= data >> 3
    } else {
      // second write
      this.temporaryVideoRamAddress &= 0x8c1f
      this.temporaryVideoRamAddress |= (data & 0x7) << 12
      this.temporaryVideoRamAddress |= (data & 0xf8) << 2
    }

    this.writeToggle = !this.writeToggle
  }

  /*
    $2006 first write (w is 0)
      t: .FEDCBA ........ = d: ..FEDCBA
      t: X...... ........ = 0
      w:                  = 1

    $2006 second write (w is 1)
      t: ....... HGFEDCBA = d: HGFEDCBA
      v                   = t
      w:                  = 0

    see: http://wiki.nesdev.com/w/index.php/PPU_scrolling#.242006_first_write_.28w_is_0.29
  */
  writeVideoRamAddress(data: Uint8): void {
    if (!this.writeToggle) {
      // first write
      this.temporaryVideoRamAddress &= ~0xff00
      this.temporaryVideoRamAddress |= (data & 0x3f) << 8
    } else {
      // second write
      this.temporaryVideoRamAddress &= ~0xff
      this.temporaryVideoRamAddress |= data & 0xff
      this.currentVideoRamAddress = this.temporaryVideoRamAddress
    }

    this.writeToggle = !this.writeToggle
  }
}
