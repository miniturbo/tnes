export const AddressingMode = {
  implicit: 'Implicit',
  accumulator: 'Accumulator',
  immediate: 'Immediate',
  zeroPage: 'Zero Page',
  zeroPageX: 'Zero Page,X',
  zeroPageY: 'Zero Page,Y',
  relative: 'Relative',
  absolute: 'Absolute',
  absoluteX: 'Absolute,X',
  absoluteY: 'Absolute,Y',
  indirect: 'Indirect',
  indexedIndirect: 'Indexed Indirect',
  indirectIndexed: 'Indirect Indexed',
} as const

export type AddressingMode = typeof AddressingMode[keyof typeof AddressingMode]

export type Cycle = number

export const InstructionType = {
  adc: 'Add with Carry',
  and: 'Logical AND',
  asl: 'Arithmetic Shift Left',
  bcc: 'Branch if Carry Clear',
  bcs: 'Branch if Carry Set',
  beq: 'Branch if Equal',
  bit: 'Bit Test',
  bmi: 'Branch if Minus',
  bne: 'Branch if Not Equal',
  bpl: 'Branch if Positive',
  brk: 'Force Interrupt',
  bvc: 'Branch if Overflow Clear',
  bvs: 'Branch if Overflow Set',
  clc: 'Clear Carry Flag',
  cld: 'Clear Decimal Mode',
  cli: 'Clear Interrupt Disable',
  clv: 'Clear Overflow Flag',
  cmp: 'Compare',
  cpx: 'Compare X Register',
  cpy: 'Compare Y Register',
  dec: 'Decrement Memory',
  dex: 'Decrement X Register',
  dey: 'Decrement Y Register',
  eor: 'Exclusive OR',
  inc: 'Increment Memory',
  inx: 'Increment X Register',
  iny: 'Increment Y Register',
  jmp: 'Jump',
  jsr: 'Jump to Subroutine',
  lda: 'Load Accumulator',
  ldx: 'Load X Register',
  ldy: 'Load Y Register',
  lsr: 'Logical Shift Right',
  nop: 'No Operation',
  ora: 'Logical Inclusive OR',
  pha: 'Push Accumulator',
  php: 'Push Processor Status',
  pla: 'Pull Accumulator',
  plp: 'Pull Processor Status',
  rol: 'Rotate Left',
  ror: 'Rotate Right',
  rti: 'Return from Interrupt',
  rts: 'Return from Subroutine',
  sbc: 'Subtract with Carry',
  sec: 'Set Carry Flag',
  sed: 'Set Decimal Flag',
  sei: 'Set Interrupt Disable',
  sta: 'Store Accumulator',
  stx: 'Store X Register',
  sty: 'Store Y Register',
  tax: 'Transfer Accumulator to X',
  tay: 'Transfer Accumulator to Y',
  tsx: 'Transfer Stack Pointer to X',
  txa: 'Transfer X to Accumulator',
  txs: 'Transfer X to Stack Pointer',
  tya: 'Transfer Y to Accumulator',
} as const

export type InstructionType = typeof InstructionType[keyof typeof InstructionType]

export type Logger = {
  log(message: string): void
}

export type Opcode = Uint8

export type Operand = Uint8 | Uint16

export type Rgb = [Uint8, Uint8, Uint8]

export type Scanline = number

export type VideoRenderer = {
  renderPixel(x: number, y: number, palette: Rgb): void
  renderScreen(): void
}
