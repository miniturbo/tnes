import Uint8Register from '/@/models/Uint8Register'

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
export default class PpuMaskRegister extends Uint8Register {
  constructor() {
    super()
  }

  get isBackgroundEnabled(): boolean {
    return this.getBitFlag(3)
  }

  inspect(): string {
    return (
      `B: ${false}, ` +
      `G: ${false}, ` +
      `R: ${false}, ` +
      `s: ${false}, ` +
      `b: ${this.isBackgroundEnabled}, ` +
      `M: ${false}, ` +
      `m: ${false}, ` +
      `G: ${false}`
    )
  }
}
