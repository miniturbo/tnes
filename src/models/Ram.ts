export class Ram {
  private view: Uint8Array

  constructor(size: number) {
    this.view = new Uint8Array(size)
  }

  read(address: Uint16): Uint8 {
    return this.view[address]
  }

  write(address: Uint16, data: Uint8): void {
    this.view[address] = data
  }

  reset(): void {
    this.view.fill(0)
  }
}
