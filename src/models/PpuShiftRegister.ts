import Uint16Register from '/@/models/Uint16Register'

export default class PpuShiftRegisters {
  readonly attributeTableLow = new Uint16Register()
  readonly attributeTableHigh = new Uint16Register()
  readonly patternTableLow = new Uint16Register()
  readonly patternTableHigh = new Uint16Register()

  inspect(): string {
    return (
      `AT Low: ${this.attributeTableLow.inspect()}, ` +
      `AT High: ${this.attributeTableHigh.inspect()}, ` +
      `PT Low: ${this.patternTableLow.inspect()}, ` +
      `PT High: ${this.patternTableHigh.inspect()}`
    )
  }
}
