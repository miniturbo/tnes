import { bitFlag, setBitFlag } from '/@/utils'

export class CodeDataLogger {
  private view: Uint8Array

  constructor(size: number) {
    this.view = new Uint8Array(size)
  }

  logAsCode(address: Uint16): void {
    this.view[address] = setBitFlag(this.view[address], 0, true)
  }

  logAsData(address: Uint16): void {
    this.view[address] = setBitFlag(this.view[address], 1, true)
  }

  clear(): void {
    this.view.fill(0)
  }

  isCode(address: Uint16): boolean {
    return bitFlag(this.view[address], 0)
  }
}
