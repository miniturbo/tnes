import { Cpu } from '@/models/Cpu'
import { Instruction } from '@/models/Cpu/Instruction'
import { Operands } from '@/models/Cpu/Operands'
import { Ppu } from '@/models/Ppu'
import { CpuAddressingMode, CpuCycle, CpuInstructionType } from '@/types'
import { validateNonNullable } from '@/utils'

export class NestestDumper {
  private cpuInstruction: Instruction | null = null
  private cpuOperands: Operands | null = null
  private cpuCycle: CpuCycle = 0
  private dumped = ''

  constructor(private cpu: Cpu, private ppu: Ppu) {
    this.cpu.on('reset', this.handleReset.bind(this))
    this.cpu.on('afterfetch', this.handleAfterFetch.bind(this))
    this.cpu.on('afterdecode', this.handleAfterDecode.bind(this))
    this.cpu.on('beforeexecute', this.handleBeforeExecute.bind(this))
    this.cpu.on('afterexecute', this.handleAfterExecute.bind(this))
  }

  dump(): string {
    return this.dumped
  }

  private save(): void {
    this.dumped = [
      this.saveCpuProgramCounter(),
      this.saveCpuOpcodeAndOperand(),
      this.saveCpuInstructionType(),
      this.saveCpuInstructionAddressAndValue(),
      this.saveCpuRegisters(),
      this.savePpuScanlineAndCycle(),
      this.saveCpuCycle(),
    ].join(' ')
  }

  private saveCpuProgramCounter(): string {
    validateNonNullable(this.cpuOperands)
    return (
      this.formatToHex((this.cpu.registers.programCounter || 0x000) - 1 - this.cpuOperands.fetchedOperands.length, 4) +
      ' '
    )
  }

  private saveCpuOpcodeAndOperand(): string {
    validateNonNullable(this.cpuInstruction)
    validateNonNullable(this.cpuOperands)

    return [this.cpuInstruction.opcode, this.cpuOperands.fetchedOperands[0], this.cpuOperands.fetchedOperands[1]]
      .map((byte) => this.formatToHex(byte, 2))
      .join(' ')
  }

  private saveCpuInstructionType(): string {
    validateNonNullable(this.cpuInstruction)

    return (this.cpuInstruction.isOfficial ? ' ' : '*') + this.cpuInstruction.type.toUpperCase()
  }

  private saveCpuInstructionAddressAndValue(): string {
    validateNonNullable(this.cpuInstruction)

    switch (this.cpuInstruction.addressingMode) {
      case CpuAddressingMode.Implicit: {
        return '                           '
      }
      case CpuAddressingMode.Accumulator: {
        return 'A                          '
      }
      case CpuAddressingMode.Immediate: {
        validateNonNullable(this.cpuOperands)

        return `#$${this.formatToHex(this.cpuOperands.operand, 2)}                       `
      }
      case CpuAddressingMode.ZeroPage: {
        validateNonNullable(this.cpuOperands)

        return (
          `$${this.formatToHex(this.cpuOperands.operand, 2)} = ` +
          `${this.formatToHex(this.cpu.bus.read(this.cpuOperands.operand), 2)}                   `
        )
      }
      case CpuAddressingMode.ZeroPageX: {
        validateNonNullable(this.cpuOperands)

        return (
          `$${this.formatToHex(this.cpuOperands.intermediateOperands[0], 2)},X @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 2)} = ` +
          `${this.formatToHex(this.cpu.bus.read(this.cpuOperands.operand), 2)}            `
        )
      }
      case CpuAddressingMode.ZeroPageY: {
        validateNonNullable(this.cpuOperands)

        return (
          `$${this.formatToHex(this.cpuOperands.intermediateOperands[0], 2)},Y @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 2)} = ` +
          `${this.formatToHex(this.cpu.bus.read(this.cpuOperands.operand), 2)}            `
        )
      }
      case CpuAddressingMode.Relative: {
        validateNonNullable(this.cpuOperands)

        return `$${this.formatToHex(this.cpuOperands.operand, 4)}                      `
      }
      case CpuAddressingMode.Absolute: {
        validateNonNullable(this.cpuOperands)

        if (
          this.cpuInstruction.type === CpuInstructionType.Jmp ||
          this.cpuInstruction.type === CpuInstructionType.Jsr
        ) {
          return `$${this.formatToHex(this.cpuOperands.operand, 4)}                      `
        } else {
          return (
            `$${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
            `${this.formatToHex(this.cpu.bus.read(this.cpuOperands.operand), 2)}                 `
          )
        }
      }
      case CpuAddressingMode.AbsoluteX: {
        validateNonNullable(this.cpuOperands)

        return (
          `$${this.formatToHex(this.cpuOperands.intermediateOperands[0], 4)},X @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
          `${this.formatToHex(this.cpu.bus.read(this.cpuOperands.operand), 2)}        `
        )
      }
      case CpuAddressingMode.AbsoluteY: {
        validateNonNullable(this.cpuOperands)

        return (
          `$${this.formatToHex(this.cpuOperands.intermediateOperands[0], 4)},Y @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
          `${this.formatToHex(this.cpu.bus.read(this.cpuOperands.operand), 2)}        `
        )
      }
      case CpuAddressingMode.Indirect: {
        validateNonNullable(this.cpuOperands)

        return (
          `($${this.formatToHex(this.cpuOperands.intermediateOperands[0], 4)}) = ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)}             `
        )
      }
      case CpuAddressingMode.IndexedIndirect: {
        validateNonNullable(this.cpuOperands)

        return (
          `($${this.formatToHex(this.cpuOperands.intermediateOperands[0], 2)},X) @ ` +
          `${this.formatToHex(this.cpuOperands.intermediateOperands[1], 2)} = ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
          `${this.formatToHex(this.cpu.bus.read(this.cpuOperands.operand), 2)}   `
        )
      }
      case CpuAddressingMode.IndirectIndexed: {
        validateNonNullable(this.cpuOperands)

        return (
          `($${this.formatToHex(this.cpuOperands.intermediateOperands[0], 2)}),Y = ` +
          `${this.formatToHex(this.cpuOperands.intermediateOperands[1], 4)} @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
          `${this.formatToHex(this.cpu.bus.read(this.cpuOperands.operand), 2)} `
        )
      }
    }
  }

  private saveCpuRegisters(): string {
    return [
      `A:${this.formatToHex(this.cpu.registers.accumulator, 2)}`,
      `X:${this.formatToHex(this.cpu.registers.indexX, 2)}`,
      `Y:${this.formatToHex(this.cpu.registers.indexY, 2)}`,
      `P:${this.formatToHex(this.cpu.registers.status, 2)}`,
      `SP:${this.formatToHex(this.cpu.registers.stackPointer, 2)}`,
    ].join(' ')
  }

  private saveCpuCycle(): string {
    return `CYC:${this.cpuCycle}`
  }

  private savePpuScanlineAndCycle(): string {
    return `PPU:${this.formatToDecimal(this.ppu.scanline, 3)},${this.formatToDecimal(this.ppu.cycle, 3)}`
  }

  private formatToDecimal(number: number | null | undefined, length: number): string {
    return number !== null && number !== undefined ? number.toString(10).padStart(length, ' ') : ' '.repeat(length)
  }

  private formatToHex(number: number | null | undefined, length: number): string {
    return number !== null && number !== undefined
      ? number.toString(16).padStart(length, '0').toUpperCase()
      : ' '.repeat(length)
  }

  private handleReset(cycle: CpuCycle): void {
    this.cpuCycle += cycle
  }

  private handleAfterFetch(instruction: Instruction): void {
    this.cpuInstruction = instruction
  }

  private handleAfterDecode(operands: Operands): void {
    this.cpuOperands = operands
  }

  private handleBeforeExecute(): void {
    this.save()
  }

  private handleAfterExecute(cycle: CpuCycle): void {
    this.cpuCycle += cycle
  }
}
