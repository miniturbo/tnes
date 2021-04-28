import { CpuAddressingMode, CpuCycle, CpuInstructionType, CpuOpcode } from '/@/types'
import { UnknownOpcodeError } from '/@/errors'
import { Instruction } from '/@/models/Cpu/Instruction'

// see: http://obelisk.me.uk/6502/reference.html
// see: https://wiki.nesdev.com/w/index.php/Programming_with_unofficial_opcodes
// see: http://www.oxyron.de/html/opcodes02.html
const instructionArgs: [CpuOpcode, CpuInstructionType, CpuAddressingMode, CpuCycle, boolean][] = [
  [0x00, CpuInstructionType.brk, CpuAddressingMode.implicit, 7, true],
  [0x01, CpuInstructionType.ora, CpuAddressingMode.indexedIndirect, 6, true],
  // [0x02, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0x03, CpuInstructionType.slo, CpuAddressingMode.indexedIndirect, 8, false],
  [0x04, CpuInstructionType.nop, CpuAddressingMode.zeroPage, 3, false],
  [0x05, CpuInstructionType.ora, CpuAddressingMode.zeroPage, 3, true],
  [0x06, CpuInstructionType.asl, CpuAddressingMode.zeroPage, 5, true],
  [0x07, CpuInstructionType.slo, CpuAddressingMode.zeroPage, 5, false],
  [0x08, CpuInstructionType.php, CpuAddressingMode.implicit, 3, true],
  [0x09, CpuInstructionType.ora, CpuAddressingMode.immediate, 2, true],
  [0x0a, CpuInstructionType.asl, CpuAddressingMode.accumulator, 2, true],
  // [0x0b, InstructionType.anc, AddressingMode.immediate, 2, false],
  [0x0c, CpuInstructionType.nop, CpuAddressingMode.absolute, 4, false],
  [0x0d, CpuInstructionType.ora, CpuAddressingMode.absolute, 4, true],
  [0x0e, CpuInstructionType.asl, CpuAddressingMode.absolute, 6, true],
  [0x0f, CpuInstructionType.slo, CpuAddressingMode.absolute, 6, false],
  [0x10, CpuInstructionType.bpl, CpuAddressingMode.relative, 2, true],
  [0x11, CpuInstructionType.ora, CpuAddressingMode.indirectIndexed, 5, true],
  // [0x12, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0x13, CpuInstructionType.slo, CpuAddressingMode.indirectIndexed, 8, false],
  [0x14, CpuInstructionType.nop, CpuAddressingMode.zeroPageX, 4, false],
  [0x15, CpuInstructionType.ora, CpuAddressingMode.zeroPageX, 4, true],
  [0x16, CpuInstructionType.asl, CpuAddressingMode.zeroPageX, 6, true],
  [0x17, CpuInstructionType.slo, CpuAddressingMode.zeroPageX, 6, false],
  [0x18, CpuInstructionType.clc, CpuAddressingMode.implicit, 2, true],
  [0x19, CpuInstructionType.ora, CpuAddressingMode.absoluteY, 4, true],
  [0x1a, CpuInstructionType.nop, CpuAddressingMode.implicit, 2, false],
  [0x1b, CpuInstructionType.slo, CpuAddressingMode.absoluteY, 7, false],
  [0x1c, CpuInstructionType.nop, CpuAddressingMode.absoluteX, 4, false],
  [0x1d, CpuInstructionType.ora, CpuAddressingMode.absoluteX, 4, true],
  [0x1e, CpuInstructionType.asl, CpuAddressingMode.absoluteX, 7, true],
  [0x1f, CpuInstructionType.slo, CpuAddressingMode.absoluteX, 7, false],
  [0x20, CpuInstructionType.jsr, CpuAddressingMode.absolute, 6, true],
  [0x21, CpuInstructionType.and, CpuAddressingMode.indexedIndirect, 6, true],
  // [0x22, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0x23, CpuInstructionType.rla, CpuAddressingMode.indexedIndirect, 8, false],
  [0x24, CpuInstructionType.bit, CpuAddressingMode.zeroPage, 3, true],
  [0x25, CpuInstructionType.and, CpuAddressingMode.zeroPage, 3, true],
  [0x26, CpuInstructionType.rol, CpuAddressingMode.zeroPage, 5, true],
  [0x27, CpuInstructionType.rla, CpuAddressingMode.zeroPage, 5, false],
  [0x28, CpuInstructionType.plp, CpuAddressingMode.implicit, 4, true],
  [0x29, CpuInstructionType.and, CpuAddressingMode.immediate, 2, true],
  [0x2a, CpuInstructionType.rol, CpuAddressingMode.accumulator, 2, true],
  // [0x2b, InstructionType.anc, AddressingMode.immediate, 2, false],
  [0x2c, CpuInstructionType.bit, CpuAddressingMode.absolute, 4, true],
  [0x2d, CpuInstructionType.and, CpuAddressingMode.absolute, 4, true],
  [0x2e, CpuInstructionType.rol, CpuAddressingMode.absolute, 6, true],
  [0x2f, CpuInstructionType.rla, CpuAddressingMode.absolute, 6, false],
  [0x30, CpuInstructionType.bmi, CpuAddressingMode.relative, 2, true],
  [0x31, CpuInstructionType.and, CpuAddressingMode.indirectIndexed, 5, true],
  // [0x32, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0x33, CpuInstructionType.rla, CpuAddressingMode.indirectIndexed, 8, false],
  [0x34, CpuInstructionType.nop, CpuAddressingMode.zeroPageX, 4, false],
  [0x35, CpuInstructionType.and, CpuAddressingMode.zeroPageX, 4, true],
  [0x36, CpuInstructionType.rol, CpuAddressingMode.zeroPageX, 6, true],
  [0x37, CpuInstructionType.rla, CpuAddressingMode.zeroPageX, 6, false],
  [0x38, CpuInstructionType.sec, CpuAddressingMode.implicit, 2, true],
  [0x39, CpuInstructionType.and, CpuAddressingMode.absoluteY, 4, true],
  [0x3a, CpuInstructionType.nop, CpuAddressingMode.implicit, 2, false],
  [0x3b, CpuInstructionType.rla, CpuAddressingMode.absoluteY, 7, false],
  [0x3c, CpuInstructionType.nop, CpuAddressingMode.absoluteX, 4, false],
  [0x3d, CpuInstructionType.and, CpuAddressingMode.absoluteX, 4, true],
  [0x3e, CpuInstructionType.rol, CpuAddressingMode.absoluteX, 7, true],
  [0x3f, CpuInstructionType.rla, CpuAddressingMode.absoluteX, 7, false],
  [0x40, CpuInstructionType.rti, CpuAddressingMode.implicit, 6, true],
  [0x41, CpuInstructionType.eor, CpuAddressingMode.indexedIndirect, 6, true],
  // [0x42, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0x43, CpuInstructionType.sre, CpuAddressingMode.indexedIndirect, 8, false],
  [0x44, CpuInstructionType.nop, CpuAddressingMode.zeroPage, 3, false],
  [0x45, CpuInstructionType.eor, CpuAddressingMode.zeroPage, 3, true],
  [0x46, CpuInstructionType.lsr, CpuAddressingMode.zeroPage, 5, true],
  [0x47, CpuInstructionType.sre, CpuAddressingMode.zeroPage, 5, false],
  [0x48, CpuInstructionType.pha, CpuAddressingMode.implicit, 3, true],
  [0x49, CpuInstructionType.eor, CpuAddressingMode.immediate, 2, true],
  [0x4a, CpuInstructionType.lsr, CpuAddressingMode.accumulator, 2, true],
  // [0x4b, InstructionType.alr, AddressingMode.immediate, 2, false],
  [0x4c, CpuInstructionType.jmp, CpuAddressingMode.absolute, 3, true],
  [0x4d, CpuInstructionType.eor, CpuAddressingMode.absolute, 4, true],
  [0x4e, CpuInstructionType.lsr, CpuAddressingMode.absolute, 6, true],
  [0x4f, CpuInstructionType.sre, CpuAddressingMode.absolute, 6, false],
  [0x50, CpuInstructionType.bvc, CpuAddressingMode.relative, 2, true],
  [0x51, CpuInstructionType.eor, CpuAddressingMode.indirectIndexed, 5, true],
  // [0x52, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0x53, CpuInstructionType.sre, CpuAddressingMode.indirectIndexed, 8, false],
  [0x54, CpuInstructionType.nop, CpuAddressingMode.zeroPageX, 4, false],
  [0x55, CpuInstructionType.eor, CpuAddressingMode.zeroPageX, 4, true],
  [0x56, CpuInstructionType.lsr, CpuAddressingMode.zeroPageX, 6, true],
  [0x57, CpuInstructionType.sre, CpuAddressingMode.zeroPageX, 6, false],
  [0x58, CpuInstructionType.cli, CpuAddressingMode.implicit, 2, true],
  [0x59, CpuInstructionType.eor, CpuAddressingMode.absoluteY, 4, true],
  [0x5a, CpuInstructionType.nop, CpuAddressingMode.implicit, 2, false],
  [0x5b, CpuInstructionType.sre, CpuAddressingMode.absoluteY, 7, false],
  [0x5c, CpuInstructionType.nop, CpuAddressingMode.absoluteX, 4, false],
  [0x5d, CpuInstructionType.eor, CpuAddressingMode.absoluteX, 4, true],
  [0x5e, CpuInstructionType.lsr, CpuAddressingMode.absoluteX, 7, true],
  [0x5f, CpuInstructionType.sre, CpuAddressingMode.absoluteX, 7, false],
  [0x60, CpuInstructionType.rts, CpuAddressingMode.implicit, 6, true],
  [0x61, CpuInstructionType.adc, CpuAddressingMode.indexedIndirect, 6, true],
  // [0x62, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0x63, CpuInstructionType.rra, CpuAddressingMode.indexedIndirect, 8, false],
  [0x64, CpuInstructionType.nop, CpuAddressingMode.zeroPage, 3, false],
  [0x65, CpuInstructionType.adc, CpuAddressingMode.zeroPage, 3, true],
  [0x66, CpuInstructionType.ror, CpuAddressingMode.zeroPage, 5, true],
  [0x67, CpuInstructionType.rra, CpuAddressingMode.zeroPage, 5, false],
  [0x68, CpuInstructionType.pla, CpuAddressingMode.implicit, 4, true],
  [0x69, CpuInstructionType.adc, CpuAddressingMode.immediate, 2, true],
  [0x6a, CpuInstructionType.ror, CpuAddressingMode.accumulator, 2, true],
  // [0x6b, InstructionType.arr, AddressingMode.immediate, 2, false],
  [0x6c, CpuInstructionType.jmp, CpuAddressingMode.indirect, 5, true],
  [0x6d, CpuInstructionType.adc, CpuAddressingMode.absolute, 4, true],
  [0x6e, CpuInstructionType.ror, CpuAddressingMode.absolute, 6, true],
  [0x6f, CpuInstructionType.rra, CpuAddressingMode.absolute, 6, false],
  [0x70, CpuInstructionType.bvs, CpuAddressingMode.relative, 2, true],
  [0x71, CpuInstructionType.adc, CpuAddressingMode.indirectIndexed, 5, true],
  // [0x72, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0x73, CpuInstructionType.rra, CpuAddressingMode.indirectIndexed, 8, false],
  [0x74, CpuInstructionType.nop, CpuAddressingMode.zeroPageX, 4, false],
  [0x75, CpuInstructionType.adc, CpuAddressingMode.zeroPageX, 4, true],
  [0x76, CpuInstructionType.ror, CpuAddressingMode.zeroPageX, 6, true],
  [0x77, CpuInstructionType.rra, CpuAddressingMode.zeroPageX, 6, false],
  [0x78, CpuInstructionType.sei, CpuAddressingMode.implicit, 2, true],
  [0x79, CpuInstructionType.adc, CpuAddressingMode.absoluteY, 4, true],
  [0x7a, CpuInstructionType.nop, CpuAddressingMode.implicit, 2, false],
  [0x7b, CpuInstructionType.rra, CpuAddressingMode.absoluteY, 7, false],
  [0x7c, CpuInstructionType.nop, CpuAddressingMode.absoluteX, 4, false],
  [0x7d, CpuInstructionType.adc, CpuAddressingMode.absoluteX, 4, true],
  [0x7e, CpuInstructionType.ror, CpuAddressingMode.absoluteX, 7, true],
  [0x7f, CpuInstructionType.rra, CpuAddressingMode.absoluteX, 7, false],
  [0x80, CpuInstructionType.nop, CpuAddressingMode.immediate, 2, false],
  [0x81, CpuInstructionType.sta, CpuAddressingMode.indexedIndirect, 6, true],
  // [0x82, InstructionType.nop, AddressingMode.immediate, 2, false],
  [0x83, CpuInstructionType.sax, CpuAddressingMode.indexedIndirect, 6, false],
  [0x84, CpuInstructionType.sty, CpuAddressingMode.zeroPage, 3, true],
  [0x85, CpuInstructionType.sta, CpuAddressingMode.zeroPage, 3, true],
  [0x86, CpuInstructionType.stx, CpuAddressingMode.zeroPage, 3, true],
  [0x87, CpuInstructionType.sax, CpuAddressingMode.zeroPage, 3, false],
  [0x88, CpuInstructionType.dey, CpuAddressingMode.implicit, 2, true],
  // [0x89, InstructionType.nop, AddressingMode.immediate, 2, false],
  [0x8a, CpuInstructionType.txa, CpuAddressingMode.implicit, 2, true],
  // [0x8b, InstructionType.xaa, AddressingMode.immediate, 2, false],
  [0x8c, CpuInstructionType.sty, CpuAddressingMode.absolute, 4, true],
  [0x8d, CpuInstructionType.sta, CpuAddressingMode.absolute, 4, true],
  [0x8e, CpuInstructionType.stx, CpuAddressingMode.absolute, 4, true],
  [0x8f, CpuInstructionType.sax, CpuAddressingMode.absolute, 4, false],
  [0x90, CpuInstructionType.bcc, CpuAddressingMode.relative, 2, true],
  [0x91, CpuInstructionType.sta, CpuAddressingMode.indirectIndexed, 6, true],
  // [0x92, InstructionType.kil, AddressingMode.implicit, 0, false],
  // [0x93, InstructionType.ahx, AddressingMode.indirectIndexed, 6, false],
  [0x94, CpuInstructionType.sty, CpuAddressingMode.zeroPageX, 4, true],
  [0x95, CpuInstructionType.sta, CpuAddressingMode.zeroPageX, 4, true],
  [0x96, CpuInstructionType.stx, CpuAddressingMode.zeroPageY, 4, true],
  [0x97, CpuInstructionType.sax, CpuAddressingMode.zeroPageY, 4, false],
  [0x98, CpuInstructionType.tya, CpuAddressingMode.implicit, 2, true],
  [0x99, CpuInstructionType.sta, CpuAddressingMode.absoluteY, 5, true],
  [0x9a, CpuInstructionType.txs, CpuAddressingMode.implicit, 2, true],
  // [0x9b, InstructionType.tas, AddressingMode.absoluteY, 5, false],
  // [0x9c, InstructionType.shy, AddressingMode.absoluteX, 5, false],
  [0x9d, CpuInstructionType.sta, CpuAddressingMode.absoluteX, 5, true],
  // [0x9e, InstructionType.shx, AddressingMode.absoluteY, 5, false],
  // [0x9f, InstructionType.ahx, AddressingMode.absoluteY, 5, false],
  [0xa0, CpuInstructionType.ldy, CpuAddressingMode.immediate, 2, true],
  [0xa1, CpuInstructionType.lda, CpuAddressingMode.indexedIndirect, 6, true],
  [0xa2, CpuInstructionType.ldx, CpuAddressingMode.immediate, 2, true],
  [0xa3, CpuInstructionType.lax, CpuAddressingMode.indexedIndirect, 6, false],
  [0xa4, CpuInstructionType.ldy, CpuAddressingMode.zeroPage, 3, true],
  [0xa5, CpuInstructionType.lda, CpuAddressingMode.zeroPage, 3, true],
  [0xa6, CpuInstructionType.ldx, CpuAddressingMode.zeroPage, 3, true],
  [0xa7, CpuInstructionType.lax, CpuAddressingMode.zeroPage, 3, false],
  [0xa8, CpuInstructionType.tay, CpuAddressingMode.implicit, 2, true],
  [0xa9, CpuInstructionType.lda, CpuAddressingMode.immediate, 2, true],
  [0xaa, CpuInstructionType.tax, CpuAddressingMode.implicit, 2, true],
  // [0xab, InstructionType.lax, AddressingMode.immediate, 2, false],
  [0xac, CpuInstructionType.ldy, CpuAddressingMode.absolute, 4, true],
  [0xad, CpuInstructionType.lda, CpuAddressingMode.absolute, 4, true],
  [0xae, CpuInstructionType.ldx, CpuAddressingMode.absolute, 4, true],
  [0xaf, CpuInstructionType.lax, CpuAddressingMode.absolute, 4, false],
  [0xb0, CpuInstructionType.bcs, CpuAddressingMode.relative, 2, true],
  [0xb1, CpuInstructionType.lda, CpuAddressingMode.indirectIndexed, 5, true],
  // [0xb2, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0xb3, CpuInstructionType.lax, CpuAddressingMode.indirectIndexed, 5, false],
  [0xb4, CpuInstructionType.ldy, CpuAddressingMode.zeroPageX, 4, true],
  [0xb5, CpuInstructionType.lda, CpuAddressingMode.zeroPageX, 4, true],
  [0xb6, CpuInstructionType.ldx, CpuAddressingMode.zeroPageY, 4, true],
  [0xb7, CpuInstructionType.lax, CpuAddressingMode.zeroPageY, 4, false],
  [0xb8, CpuInstructionType.clv, CpuAddressingMode.implicit, 2, true],
  [0xb9, CpuInstructionType.lda, CpuAddressingMode.absoluteY, 4, true],
  [0xba, CpuInstructionType.tsx, CpuAddressingMode.implicit, 2, true],
  // [0xbb, InstructionType.las, AddressingMode.absoluteY, 4, false],
  [0xbc, CpuInstructionType.ldy, CpuAddressingMode.absoluteX, 4, true],
  [0xbd, CpuInstructionType.lda, CpuAddressingMode.absoluteX, 4, true],
  [0xbe, CpuInstructionType.ldx, CpuAddressingMode.absoluteY, 4, true],
  [0xbf, CpuInstructionType.lax, CpuAddressingMode.absoluteY, 4, false],
  [0xc0, CpuInstructionType.cpy, CpuAddressingMode.immediate, 2, true],
  [0xc1, CpuInstructionType.cmp, CpuAddressingMode.indexedIndirect, 6, true],
  // [0xc2, InstructionType.nop, AddressingMode.immediate, 2, false],
  [0xc3, CpuInstructionType.dcp, CpuAddressingMode.indexedIndirect, 8, false],
  [0xc4, CpuInstructionType.cpy, CpuAddressingMode.zeroPage, 3, true],
  [0xc5, CpuInstructionType.cmp, CpuAddressingMode.zeroPage, 3, true],
  [0xc6, CpuInstructionType.dec, CpuAddressingMode.zeroPage, 5, true],
  [0xc7, CpuInstructionType.dcp, CpuAddressingMode.zeroPage, 5, false],
  [0xc8, CpuInstructionType.iny, CpuAddressingMode.implicit, 2, true],
  [0xc9, CpuInstructionType.cmp, CpuAddressingMode.immediate, 2, true],
  [0xca, CpuInstructionType.dex, CpuAddressingMode.implicit, 2, true],
  // [0xcb, InstructionType.axs, AddressingMode.immediate, 2, false],
  [0xcc, CpuInstructionType.cpy, CpuAddressingMode.absolute, 4, true],
  [0xcd, CpuInstructionType.cmp, CpuAddressingMode.absolute, 4, true],
  [0xce, CpuInstructionType.dec, CpuAddressingMode.absolute, 6, true],
  [0xcf, CpuInstructionType.dcp, CpuAddressingMode.absolute, 6, false],
  [0xd0, CpuInstructionType.bne, CpuAddressingMode.relative, 2, true],
  [0xd1, CpuInstructionType.cmp, CpuAddressingMode.indirectIndexed, 5, true],
  // [0xd2, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0xd3, CpuInstructionType.dcp, CpuAddressingMode.indirectIndexed, 8, false],
  [0xd4, CpuInstructionType.nop, CpuAddressingMode.zeroPageX, 4, false],
  [0xd5, CpuInstructionType.cmp, CpuAddressingMode.zeroPageX, 4, true],
  [0xd6, CpuInstructionType.dec, CpuAddressingMode.zeroPageX, 6, true],
  [0xd7, CpuInstructionType.dcp, CpuAddressingMode.zeroPageX, 6, false],
  [0xd8, CpuInstructionType.cld, CpuAddressingMode.implicit, 2, true],
  [0xd9, CpuInstructionType.cmp, CpuAddressingMode.absoluteY, 4, true],
  [0xda, CpuInstructionType.nop, CpuAddressingMode.implicit, 2, false],
  [0xdb, CpuInstructionType.dcp, CpuAddressingMode.absoluteY, 7, false],
  [0xdc, CpuInstructionType.nop, CpuAddressingMode.absoluteX, 4, false],
  [0xdd, CpuInstructionType.cmp, CpuAddressingMode.absoluteX, 4, true],
  [0xde, CpuInstructionType.dec, CpuAddressingMode.absoluteX, 7, true],
  [0xdf, CpuInstructionType.dcp, CpuAddressingMode.absoluteX, 7, false],
  [0xe0, CpuInstructionType.cpx, CpuAddressingMode.immediate, 2, true],
  [0xe1, CpuInstructionType.sbc, CpuAddressingMode.indexedIndirect, 6, true],
  // [0xe2, InstructionType.nop, AddressingMode.immediate, 2, false],
  [0xe3, CpuInstructionType.isb, CpuAddressingMode.indexedIndirect, 8, false],
  [0xe4, CpuInstructionType.cpx, CpuAddressingMode.zeroPage, 3, true],
  [0xe5, CpuInstructionType.sbc, CpuAddressingMode.zeroPage, 3, true],
  [0xe6, CpuInstructionType.inc, CpuAddressingMode.zeroPage, 5, true],
  [0xe7, CpuInstructionType.isb, CpuAddressingMode.zeroPage, 5, false],
  [0xe8, CpuInstructionType.inx, CpuAddressingMode.implicit, 2, true],
  [0xe9, CpuInstructionType.sbc, CpuAddressingMode.immediate, 2, true],
  [0xea, CpuInstructionType.nop, CpuAddressingMode.implicit, 2, true],
  [0xeb, CpuInstructionType.sbc, CpuAddressingMode.immediate, 2, false],
  [0xec, CpuInstructionType.cpx, CpuAddressingMode.absolute, 4, true],
  [0xed, CpuInstructionType.sbc, CpuAddressingMode.absolute, 4, true],
  [0xee, CpuInstructionType.inc, CpuAddressingMode.absolute, 6, true],
  [0xef, CpuInstructionType.isb, CpuAddressingMode.absolute, 6, false],
  [0xf0, CpuInstructionType.beq, CpuAddressingMode.relative, 2, true],
  [0xf1, CpuInstructionType.sbc, CpuAddressingMode.indirectIndexed, 5, true],
  // [0xf2, InstructionType.kil, AddressingMode.implicit, 0, false],
  [0xf3, CpuInstructionType.isb, CpuAddressingMode.indirectIndexed, 8, false],
  [0xf4, CpuInstructionType.nop, CpuAddressingMode.zeroPageX, 4, false],
  [0xf5, CpuInstructionType.sbc, CpuAddressingMode.zeroPageX, 4, true],
  [0xf6, CpuInstructionType.inc, CpuAddressingMode.zeroPageX, 6, true],
  [0xf7, CpuInstructionType.isb, CpuAddressingMode.zeroPageX, 6, false],
  [0xf8, CpuInstructionType.sed, CpuAddressingMode.implicit, 2, true],
  [0xf9, CpuInstructionType.sbc, CpuAddressingMode.absoluteY, 4, true],
  [0xfa, CpuInstructionType.nop, CpuAddressingMode.implicit, 2, false],
  [0xfb, CpuInstructionType.isb, CpuAddressingMode.absoluteY, 7, false],
  [0xfc, CpuInstructionType.nop, CpuAddressingMode.absoluteX, 4, false],
  [0xfd, CpuInstructionType.sbc, CpuAddressingMode.absoluteX, 4, true],
  [0xfe, CpuInstructionType.inc, CpuAddressingMode.absoluteX, 7, true],
  [0xff, CpuInstructionType.isb, CpuAddressingMode.absoluteX, 7, false],
]

class InstructionSet {
  private instructions = instructionArgs.map((args) => new Instruction(...args))

  findByOpcode(opcode: Uint8): Instruction {
    const instruction = this.instructions.find((instruction) => instruction.opcode === opcode)

    if (!instruction) throw new UnknownOpcodeError(opcode)

    return instruction
  }
}

const instructionSet = new InstructionSet()

export { instructionSet as InstructionSet }
