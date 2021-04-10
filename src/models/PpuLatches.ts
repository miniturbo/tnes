import Uint8Register from '/@/models/Uint8Register'

export default class PpuLatches {
  readonly nameTable = new Uint8Register()
  readonly attributeTableLow = new Uint8Register()
  readonly attributeTableHigh = new Uint8Register()
  readonly patternTableLow = new Uint8Register()
  readonly patternTableHigh = new Uint8Register()

  inspect(): string {
    return (
      `NT: ${this.nameTable.inspect()}, ` +
      `AT Low: ${this.attributeTableLow.inspect()}, ` +
      `AT High: ${this.attributeTableHigh.inspect()}, ` +
      `PT Low: ${this.patternTableLow.inspect()}, ` +
      `PT High: ${this.patternTableHigh.inspect()}`
    )
  }
}
