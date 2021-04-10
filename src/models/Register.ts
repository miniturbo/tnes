export default class Register {
  protected value: number

  constructor(value = 0x0) {
    this.value = this.mask(value)
  }

  read(): number {
    return this.value
  }

  readBit(index: number): number {
    return (this.value >> index) & 0x1
  }

  write(value: number): void {
    this.value = this.mask(value)
  }

  increment(): void {
    this.value = this.mask(this.value + 0x1)
  }

  decrement(): void {
    this.value = this.mask(this.value - 0x1)
  }

  shift(): void {
    this.value = this.mask(this.value << 0x1)
  }

  getBitFlag(index: number): boolean {
    return (this.value & (0x1 << index)) !== 0x0
  }

  setBitFlag(index: number, flag: boolean): void {
    const newValue = 0x1 << index
    this.value = this.mask(flag ? this.value | newValue : this.value & ~newValue)
  }

  protected mask(value: number): number {
    return value
  }
}
