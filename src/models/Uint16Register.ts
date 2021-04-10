import { toHex } from '/@/utils'
import Register from '/@/models/Register'

export default class Uint16Register extends Register {
  writeLowByte(value: number): void {
    this.value = this.mask(this.value | (value & 0xff))
  }

  inspect(): string | null {
    return toHex(this.value, 4)
  }

  protected mask(value: number): number {
    return value & 0xffff
  }
}
