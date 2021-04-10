import Uint8Register from '/@/models/Uint8Register'
import Uint16Register from '/@/models/Uint16Register'
import CpuStatusRegister from '/@/models/CpuStatusRegister'

export function isNegative(value: number): boolean {
  return (value & 0x80) === 1
}

export function isZero(value: number): boolean {
  return (value & 0xff) === 0x0
}

export function uint8ToInt8(number: Uint8): Int8 {
  return number < 0x80 ? number : number - 0x100
}

// see: http://obelisk.me.uk/6502/registers.html
export default class CpuRegisters {
  readonly programCounter = new Uint16Register()
  readonly stackPointer = new Uint8Register()
  readonly accumulator = new Uint8Register()
  readonly indexX = new Uint8Register()
  readonly indexY = new Uint8Register()
  readonly status = new CpuStatusRegister()

  inspect(): string {
    return (
      `PC: ${this.programCounter.inspect()}, ` +
      `SP: ${this.stackPointer.inspect()}, ` +
      `A: ${this.accumulator.inspect()}, ` +
      `X: ${this.indexX.inspect()}, ` +
      `Y: ${this.indexY.inspect()}, ` +
      `Y: ${this.status.inspect()}`
    )
  }
}
