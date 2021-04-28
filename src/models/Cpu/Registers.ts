import { bitFlag, maskAsByte, maskAsWord, setBitFlag, toHex } from '/@/utils'

/*
  7  bit  0
  ---- ----
  NVss DIZC
  |||| ||||
  |||| |||+- Carry
  |||| ||+-- Zero
  |||| |+--- Interrupt Disable
  |||| +---- Decimal
  ||++------ No CPU effect, see: the B flag
  |+-------- Overflow
  +--------- Negative

  see: http://wiki.nesdev.com/w/index.php/Status_flags
  see: http://obelisk.me.uk/6502/registers.html
*/
export class Registers {
  programCounter: Uint16 = 0x0000
  stackPointer: Uint8 = 0x00
  accumulator: Uint8 = 0x00
  indexX: Uint8 = 0x00
  indexY: Uint8 = 0x00
  status: Uint8 = 0x00

  get carryFlag(): boolean {
    return bitFlag(this.status, 0)
  }

  set carryFlag(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 0, flag))
  }

  get zeroFlag(): boolean {
    return bitFlag(this.status, 1)
  }

  set zeroFlag(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 1, flag))
  }

  get interruptDisableFlag(): boolean {
    return bitFlag(this.status, 2)
  }

  set interruptDisableFlag(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 2, flag))
  }

  get decimalModeFlag(): boolean {
    return bitFlag(this.status, 3)
  }

  set decimalModeFlag(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 3, flag))
  }

  get breakCommandFlag(): boolean {
    return bitFlag(this.status, 4)
  }

  set breakCommandFlag(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 4, flag))
  }

  get reservedFlag(): boolean {
    return bitFlag(this.status, 5)
  }

  set reservedFlag(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 5, flag))
  }

  get overflowFlag(): boolean {
    return bitFlag(this.status, 6)
  }

  set overflowFlag(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 6, flag))
  }

  get negativeFlag(): boolean {
    return bitFlag(this.status, 7)
  }

  set negativeFlag(flag: boolean) {
    this.status = maskAsByte(setBitFlag(this.status, 7, flag))
  }

  advanceProgramCounter(): void {
    this.programCounter = maskAsWord(this.programCounter + 0x1)
  }

  inspect(): string {
    return (
      `PC: ${toHex(this.programCounter, 4)}, ` +
      `SP: ${toHex(this.stackPointer, 2)}, ` +
      `A: ${toHex(this.accumulator, 2)}, ` +
      `X: ${toHex(this.indexX, 2)}, ` +
      `Y: ${toHex(this.indexY, 2)}, ` +
      `C: ${this.carryFlag}, ` +
      `Z: ${this.zeroFlag}, ` +
      `I: ${this.interruptDisableFlag}, ` +
      `D: ${this.decimalModeFlag}, ` +
      `B: ${this.breakCommandFlag}, ` +
      `R: ${this.reservedFlag}, ` +
      `V: ${this.overflowFlag}, ` +
      `N: ${this.negativeFlag}`
    )
  }
}
