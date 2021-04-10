import { toHex } from '/@/utils'
import Register from '/@/models/Register'

export default class Uint8Register extends Register {
  inspect(): string | null {
    return toHex(this.value, 2)
  }

  protected mask(value: number): number {
    return value & 0xff
  }
}
