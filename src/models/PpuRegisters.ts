import PpuMaskRegister from '/@/models/PpuMaskRegister'

export default class PpuRegisters {
  ppuMask = new PpuMaskRegister()

  currentVideoRamAddress: Uint16 = 0
  temporaryVideoRamAddress: Uint16 = 0
  writeToggle = false

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

  inspect(): string {
    return this.ppuMask.inspect()
  }
}
