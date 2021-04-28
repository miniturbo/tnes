import { toHex } from '/@/utils'

export class Latches {
  nameTable: Uint8 = 0x00
  attributeTableLow: Uint8 = 0x00
  attributeTableHigh: Uint8 = 0x00
  patternTableLow: Uint8 = 0x00
  patternTableHigh: Uint8 = 0x00

  inspect(): string {
    return (
      `NT: ${toHex(this.nameTable, 2)}, ` +
      `AT Low: ${toHex(this.attributeTableLow, 2)}, ` +
      `AT High: ${toHex(this.attributeTableHigh, 2)}, ` +
      `PT Low: ${toHex(this.patternTableLow, 2)}, ` +
      `PT High: ${toHex(this.patternTableHigh, 2)}`
    )
  }
}
