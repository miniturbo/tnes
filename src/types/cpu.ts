export const CpuAddressingMode = {
  Implicit: 'Implicit',
  Accumulator: 'Accumulator',
  Immediate: 'Immediate',
  ZeroPage: 'ZeroPage',
  ZeroPageX: 'ZeroPageX',
  ZeroPageY: 'ZeroPageY',
  Relative: 'Relative',
  Absolute: 'Absolute',
  AbsoluteX: 'AbsoluteX',
  AbsoluteY: 'AbsoluteY',
  Indirect: 'Indirect',
  IndexedIndirect: 'IndexedIndirect',
  IndirectIndexed: 'IndirectIndexed',
} as const

export type CpuAddressingMode = typeof CpuAddressingMode[keyof typeof CpuAddressingMode]

export type CpuBusReadEventDetail = {
  address: Uint16
  data: Uint8
}

export type CpuBusWriteEventDetail = {
  address: Uint16
  data: Uint8
}

export type CpuCycle = number

export const CpuInstructionType = {
  Adc: 'Adc',
  And: 'And',
  Asl: 'Asl',
  Bcc: 'Bcc',
  Bcs: 'Bcs',
  Beq: 'Beq',
  Bit: 'Bit',
  Bmi: 'Bmi',
  Bne: 'Bne',
  Bpl: 'Bpl',
  Brk: 'Brk',
  Bvc: 'Bvc',
  Bvs: 'Bvs',
  Clc: 'Clc',
  Cld: 'Cld',
  Cli: 'Cli',
  Clv: 'Clv',
  Cmp: 'Cmp',
  Cpx: 'Cpx',
  Cpy: 'Cpy',
  Dcp: 'Dcp',
  Dec: 'Dec',
  Dex: 'Dex',
  Dey: 'Dey',
  Eor: 'Eor',
  Inc: 'Inc',
  Inx: 'Inx',
  Iny: 'Iny',
  Isb: 'Isb',
  Jmp: 'Jmp',
  Jsr: 'Jsr',
  Lax: 'Lax',
  Lda: 'Lda',
  Ldx: 'Ldx',
  Ldy: 'Ldy',
  Lsr: 'Lsr',
  Nop: 'Nop',
  Ora: 'Ora',
  Pha: 'Pha',
  Php: 'Php',
  Pla: 'Pla',
  Plp: 'Plp',
  Rla: 'Rla',
  Rol: 'Rol',
  Ror: 'Ror',
  Rra: 'Rra',
  Rti: 'Rti',
  Rts: 'Rts',
  Sax: 'Sax',
  Sbc: 'Sbc',
  Sec: 'Sec',
  Sed: 'Sed',
  Sei: 'Sei',
  Slo: 'Slo',
  Sre: 'Sre',
  Sta: 'Sta',
  Stx: 'Stx',
  Sty: 'Sty',
  Tax: 'Tax',
  Tay: 'Tay',
  Tsx: 'Tsx',
  Txa: 'Txa',
  Txs: 'Txs',
  Tya: 'Tya',
} as const

export type CpuInstructionType = typeof CpuInstructionType[keyof typeof CpuInstructionType]

export type CpuOpcode = Uint8

export type CpuOperand = Uint8 | Uint16
