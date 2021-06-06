export function bitFlag(value: number, index: number): boolean {
  return bitOf(value, index) === 0b1
}

export function bitOf(value: number, index: number): number {
  return (value >> index) & 0b1
}

export function combineIntoWord(lowByte: Uint8, highByte: Uint8): Uint16 {
  return maskAsByte(lowByte) | (maskAsWord(highByte) << 8)
}

export function combineLowByteToWord(word: Uint16, lowByte: Uint8): Uint16 {
  return (word & 0xff00) | maskAsByte(lowByte)
}

export function divideIntoBytes(word: Uint16): Uint8[] {
  const lowByte = maskAsByte(word)
  const highByte = maskAsByte(word >> 8)
  return [lowByte, highByte]
}

// see: http://www.6502.org/tutorials/vflag.html#2.4.1
export function isBorrow(value: number): boolean {
  return value >= 0x00
}

// see: http://www.6502.org/tutorials/vflag.html#2.4.1
export function isCarry(value: number): boolean {
  return value > 0xff
}

export function isNegative(value: number): boolean {
  return bitFlag(value, 7)
}

// V = C6 xor C7
// see: http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
export function isOverflow(m: number, n: number): boolean {
  const carryFromBit6 = (((m & 0x7f) + (n & 0x7f)) >> 7) & 0b1
  const carryFromBit7 = (((m & 0xff) + (n & 0xff)) >> 8) & 0b1
  return (carryFromBit6 ^ carryFromBit7) !== 0
}

export function isPageCrossed(m: Uint16, n: Uint16): boolean {
  return (m & 0xff00) !== (n & 0xff00)
}

export function isZero(value: number): boolean {
  return maskAsByte(value) === 0x0
}

export function maskAsByte(value: number): number {
  return value & 0xff
}

export function maskAsWord(value: number): number {
  return value & 0xffff
}

export function setBitFlag(value: number, index: number, flag: boolean): number {
  const mask = 0b1 << index
  return flag ? value | mask : value & ~mask
}

export function uint8ToInt8(number: Uint8): Int8 {
  return number < 0x80 ? number : number - 0x100
}
