import Uint8Register from '/@/models/Uint8Register'

// see: http://obelisk.me.uk/6502/registers.html
export default class CpuStatusRegister extends Uint8Register {
  constructor() {
    super()
    this.reservedFlag = true
  }

  get carryFlag(): boolean {
    return this.getBitFlag(0)
  }

  set carryFlag(flag: boolean) {
    this.setBitFlag(0, flag)
  }

  get zeroFlag(): boolean {
    return this.getBitFlag(1)
  }

  set zeroFlag(flag: boolean) {
    this.setBitFlag(1, flag)
  }

  get interruptDisableFlag(): boolean {
    return this.getBitFlag(2)
  }

  set interruptDisableFlag(flag: boolean) {
    this.setBitFlag(2, flag)
  }

  get decimalModeFlag(): boolean {
    return this.getBitFlag(3)
  }

  set decimalModeFlag(flag: boolean) {
    this.setBitFlag(3, flag)
  }

  get breakCommandFlag(): boolean {
    return this.getBitFlag(4)
  }

  set breakCommandFlag(flag: boolean) {
    this.setBitFlag(4, flag)
  }

  get reservedFlag(): boolean {
    return this.getBitFlag(5)
  }

  set reservedFlag(flag: boolean) {
    this.setBitFlag(5, flag)
  }

  get overflowFlag(): boolean {
    return this.getBitFlag(6)
  }

  set overflowFlag(flag: boolean) {
    this.setBitFlag(6, flag)
  }

  get negativeFlag(): boolean {
    return this.getBitFlag(7)
  }

  set negativeFlag(flag: boolean) {
    this.setBitFlag(7, flag)
  }

  inspect(): string {
    return (
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
