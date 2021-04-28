import { toHex } from '/@/utils'

export class ShiftRegisters {
  attributeTableLow: Uint16 = 0x0000
  attributeTableHigh: Uint16 = 0x0000
  patternTableLow: Uint16 = 0x0000
  patternTableHigh: Uint16 = 0x0000

  inspect(): string {
    return (
      `AT Low: ${toHex(this.attributeTableLow, 2)}, ` +
      `AT High: ${toHex(this.attributeTableHigh, 2)}, ` +
      `PT Low: ${toHex(this.patternTableLow, 2)}, ` +
      `PT High: ${toHex(this.patternTableHigh, 2)}`
    )
  }
}
