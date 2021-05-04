import { CpuAddressingMode, CpuCycle, CpuInstructionType, NesDumper, PpuCycle, PpuScanline } from '/@/types'
import { validateNonNullable } from '/@/utils'
import { CpuBus, CpuInstruction, CpuOperands, CpuRegisters } from '/@/models/Cpu'

type NestestDumperResult = {
  cpuProgramCounter: string
  cpuOpcodeAndOperand: string
  cpuInstructionType: string
  cpuInstructionAddressAndValue: string
  cpuRegisters: string
  cpuCycle: string
  ppuScanlineAndCycle: string
}

export class NestestCpuDumper implements NesDumper {
  cpuBus: CpuBus | null = null
  cpuInstruction: CpuInstruction | null = null
  cpuOperands: CpuOperands | null = null
  ppuScanline: PpuScanline | null = null
  ppuCycle: PpuCycle | null = null

  private result: NestestDumperResult = {
    cpuProgramCounter: '',
    cpuOpcodeAndOperand: '',
    cpuInstructionType: '',
    cpuInstructionAddressAndValue: '',
    cpuRegisters: '',
    cpuCycle: '',
    ppuScanlineAndCycle: '',
  }
  private cpuProgramCounterRegister: Uint16 | null = null
  private cpuStackPointerRegister: Uint8 | null = null
  private cpuAccumulatorRegister: Uint8 | null = null
  private cpuIndexXRegister: Uint8 | null = null
  private cpuIndexYRegister: Uint8 | null = null
  private cpuStatusRegister: Uint8 | null = null
  private cpuCycle: CpuCycle = 0

  set cpuRegisters(cpuRegisters: CpuRegisters) {
    this.cpuProgramCounterRegister = cpuRegisters.programCounter
    this.cpuStackPointerRegister = cpuRegisters.stackPointer
    this.cpuAccumulatorRegister = cpuRegisters.accumulator
    this.cpuIndexXRegister = cpuRegisters.indexX
    this.cpuIndexYRegister = cpuRegisters.indexY
    this.cpuStatusRegister = cpuRegisters.status
  }

  incrementCpuCycle(cpuCycle: CpuCycle): void {
    this.cpuCycle += cpuCycle
  }

  save(): void {
    this.result.cpuProgramCounter = this.saveCpuProgramCounter()
    this.result.cpuOpcodeAndOperand = this.saveCpuOpcodeAndOperand()
    this.result.cpuInstructionType = this.saveCpuInstructionType()
    this.result.cpuInstructionAddressAndValue = this.saveCpuInstructionAddressAndValue()
    this.result.cpuRegisters = this.saveCpuRegisters()
    this.result.ppuScanlineAndCycle = this.savePpuScanlineAndCycle()
    this.result.cpuCycle = this.saveCpuCycle()
  }

  dump(): string {
    return [
      this.result.cpuProgramCounter,
      this.result.cpuOpcodeAndOperand,
      this.result.cpuInstructionType,
      this.result.cpuInstructionAddressAndValue,
      this.result.cpuRegisters,
      this.result.ppuScanlineAndCycle,
      this.result.cpuCycle,
    ].join(' ')
  }

  private saveCpuProgramCounter(): string {
    validateNonNullable(this.cpuOperands)
    return (
      this.formatToHex((this.cpuProgramCounterRegister || 0x000) - 1 - this.cpuOperands.fetchedOperands.length, 4) + ' '
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
        validateNonNullable(this.cpuBus)

        return (
          `$${this.formatToHex(this.cpuOperands.operand, 2)} = ` +
          `${this.formatToHex(this.cpuBus.read(this.cpuOperands.operand), 2)}                   `
        )
      }
      case CpuAddressingMode.ZeroPageX: {
        validateNonNullable(this.cpuOperands)
        validateNonNullable(this.cpuBus)

        return (
          `$${this.formatToHex(this.cpuOperands.intermediateOperands[0], 2)},X @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 2)} = ` +
          `${this.formatToHex(this.cpuBus.read(this.cpuOperands.operand), 2)}            `
        )
      }
      case CpuAddressingMode.ZeroPageY: {
        validateNonNullable(this.cpuOperands)
        validateNonNullable(this.cpuBus)

        return (
          `$${this.formatToHex(this.cpuOperands.intermediateOperands[0], 2)},Y @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 2)} = ` +
          `${this.formatToHex(this.cpuBus.read(this.cpuOperands.operand), 2)}            `
        )
      }
      case CpuAddressingMode.Relative: {
        validateNonNullable(this.cpuOperands)

        return `$${this.formatToHex(this.cpuOperands.operand, 4)}                      `
      }
      case CpuAddressingMode.Absolute: {
        validateNonNullable(this.cpuOperands)
        validateNonNullable(this.cpuBus)

        if (
          this.cpuInstruction.type === CpuInstructionType.Jmp ||
          this.cpuInstruction.type === CpuInstructionType.Jsr
        ) {
          return `$${this.formatToHex(this.cpuOperands.operand, 4)}                      `
        } else {
          return (
            `$${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
            `${this.formatToHex(this.cpuBus.read(this.cpuOperands.operand), 2)}                 `
          )
        }
      }
      case CpuAddressingMode.AbsoluteX: {
        validateNonNullable(this.cpuOperands)
        validateNonNullable(this.cpuBus)

        return (
          `$${this.formatToHex(this.cpuOperands.intermediateOperands[0], 4)},X @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
          `${this.formatToHex(this.cpuBus.read(this.cpuOperands.operand), 2)}        `
        )
      }
      case CpuAddressingMode.AbsoluteY: {
        validateNonNullable(this.cpuOperands)
        validateNonNullable(this.cpuBus)

        return (
          `$${this.formatToHex(this.cpuOperands.intermediateOperands[0], 4)},Y @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
          `${this.formatToHex(this.cpuBus.read(this.cpuOperands.operand), 2)}        `
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
        validateNonNullable(this.cpuBus)

        return (
          `($${this.formatToHex(this.cpuOperands.intermediateOperands[0], 2)},X) @ ` +
          `${this.formatToHex(this.cpuOperands.intermediateOperands[1], 2)} = ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
          `${this.formatToHex(this.cpuBus.read(this.cpuOperands.operand), 2)}   `
        )
      }
      case CpuAddressingMode.IndirectIndexed: {
        validateNonNullable(this.cpuOperands)
        validateNonNullable(this.cpuBus)

        return (
          `($${this.formatToHex(this.cpuOperands.intermediateOperands[0], 2)}),Y = ` +
          `${this.formatToHex(this.cpuOperands.intermediateOperands[1], 4)} @ ` +
          `${this.formatToHex(this.cpuOperands.operand, 4)} = ` +
          `${this.formatToHex(this.cpuBus.read(this.cpuOperands.operand), 2)} `
        )
      }
    }
  }

  private saveCpuRegisters(): string {
    return [
      `A:${this.formatToHex(this.cpuAccumulatorRegister, 2)}`,
      `X:${this.formatToHex(this.cpuIndexXRegister, 2)}`,
      `Y:${this.formatToHex(this.cpuIndexYRegister, 2)}`,
      `P:${this.formatToHex(this.cpuStatusRegister, 2)}`,
      `SP:${this.formatToHex(this.cpuStackPointerRegister, 2)}`,
    ].join(' ')
  }

  private saveCpuCycle(): string {
    return `CYC:${this.cpuCycle}`
  }

  private savePpuScanlineAndCycle(): string {
    validateNonNullable(this.ppuScanline)
    validateNonNullable(this.ppuCycle)
    return `PPU:${this.formatToDecimal(this.ppuScanline, 3)},${this.formatToDecimal(this.ppuCycle, 3)}`
  }

  private formatToDecimal(number: number | null | undefined, length: number): string {
    return number !== null && number !== undefined ? number.toString(10).padStart(length, ' ') : ' '.repeat(length)
  }

  private formatToHex(number: number | null | undefined, length: number): string {
    return number !== null && number !== undefined
      ? number.toString(16).padStart(length, '0').toUpperCase()
      : ' '.repeat(length)
  }
}
