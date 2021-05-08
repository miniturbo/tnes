import { CpuAddressingMode } from '/@/types'
import { UnknownAddressingModeError } from '/@/errors'
import { combineIntoWord, isPageCrossed, maskAsByte, maskAsWord, uint8ToInt8 } from '/@/utils'
import { Bus } from '/@/models/Cpu/Bus'
import { CodeDataLogger } from '/@/models/Cpu/CodeDataLogger'
import { Operands } from '/@/models/Cpu/Operands'
import { Registers } from '/@/models/Cpu/Registers'

export class Decoder {
  constructor(private bus: Bus, private registers: Registers, private codeDataLogger: CodeDataLogger) {}

  decode(addressingMode: CpuAddressingMode): Operands {
    switch (addressingMode) {
      case CpuAddressingMode.Implicit: {
        return this.fetchAndDecodeByImplicit()
      }
      case CpuAddressingMode.Accumulator: {
        return this.fetchAndDecodeByAccumulator()
      }
      case CpuAddressingMode.Immediate: {
        return this.fetchAndDecodeByImmediate()
      }
      case CpuAddressingMode.ZeroPage: {
        return this.fetchAndDecodeByZeroPage()
      }
      case CpuAddressingMode.ZeroPageX: {
        return this.fetchAndDecodeByZeroPageX()
      }
      case CpuAddressingMode.ZeroPageY: {
        return this.fetchAndDecodeByZeroPageY()
      }
      case CpuAddressingMode.Relative: {
        return this.fetchAndDecodeByRelative()
      }
      case CpuAddressingMode.Absolute: {
        return this.fetchAndDecodeByAbsolute()
      }
      case CpuAddressingMode.AbsoluteX: {
        return this.fetchAndDecodeByAbsoluteX()
      }
      case CpuAddressingMode.AbsoluteY: {
        return this.fetchAndDecodeByAbsoluteY()
      }
      case CpuAddressingMode.Indirect: {
        return this.fetchAndDecodeByIndirect()
      }
      case CpuAddressingMode.IndexedIndirect: {
        return this.fetchAndDecodeByIndexedIndirect()
      }
      case CpuAddressingMode.IndirectIndexed: {
        return this.fetchAndDecodeByIndirectIndexed()
      }
      default: {
        throw new UnknownAddressingModeError(addressingMode)
      }
    }
  }

  private fetchAndDecodeByImplicit(): Operands {
    return new Operands([], false)
  }

  private fetchAndDecodeByAccumulator(): Operands {
    return new Operands([], false)
  }

  private fetchAndDecodeByImmediate(): Operands {
    return new Operands([this.fetchByte()], false)
  }

  private fetchAndDecodeByZeroPage(): Operands {
    return new Operands([this.fetchByte()], false)
  }

  private fetchAndDecodeByZeroPageX(): Operands {
    const operand1 = this.fetchByte()
    const operand2 = maskAsByte(operand1 + this.registers.indexX)
    return new Operands([operand1, operand2], false)
  }

  private fetchAndDecodeByZeroPageY(): Operands {
    const operand1 = this.fetchByte()
    const operand2 = maskAsByte(operand1 + this.registers.indexY)
    return new Operands([operand1, operand2], false)
  }

  private fetchAndDecodeByRelative(): Operands {
    const operand1 = this.fetchByte()
    const operand2 = maskAsWord(this.registers.programCounter + uint8ToInt8(operand1))
    return new Operands([operand1, operand2], isPageCrossed(this.registers.programCounter, operand2))
  }

  private fetchAndDecodeByAbsolute(): Operands {
    return new Operands([this.fetchWord()], false)
  }

  private fetchAndDecodeByAbsoluteX(): Operands {
    const operand1 = this.fetchWord()
    const operand2 = maskAsWord(operand1 + this.registers.indexX)
    return new Operands([operand1, operand2], isPageCrossed(operand1, operand2))
  }

  private fetchAndDecodeByAbsoluteY(): Operands {
    const operand1 = this.fetchWord()
    const operand2 = maskAsWord(operand1 + this.registers.indexY)
    return new Operands([operand1, operand2], isPageCrossed(operand1, operand2))
  }

  // see: http://www.6502.org/tutorials/6502opcodes.html#JMP
  private fetchAndDecodeByIndirect(): Operands {
    const operand1 = this.fetchWord()
    const lowByte = this.bus.read(operand1)
    const highByte = this.bus.read((operand1 & 0xff00) | ((operand1 + 0x1) & 0xff))
    const operand2 = combineIntoWord(lowByte, highByte)
    return new Operands([operand1, operand2], false)
  }

  private fetchAndDecodeByIndexedIndirect(): Operands {
    const operand1 = this.fetchByte()
    const operand2 = maskAsByte(operand1 + this.registers.indexX)
    const lowByte = this.bus.read(operand2)
    const highByte = this.bus.read(maskAsByte(operand2 + 0x1))
    const operand3 = combineIntoWord(lowByte, highByte)
    return new Operands([operand1, operand2, operand3], false)
  }

  private fetchAndDecodeByIndirectIndexed(): Operands {
    const operand1 = this.fetchByte()
    const lowByte = this.bus.read(maskAsByte(operand1))
    const highByte = this.bus.read(maskAsByte(operand1 + 0x1))
    const operand2 = combineIntoWord(lowByte, highByte)
    const operand3 = maskAsWord(operand2 + this.registers.indexY)
    return new Operands([operand1, operand2, operand3], isPageCrossed(operand2, operand3))
  }

  private fetchByte(): Uint8 {
    const byte = this.bus.read(this.registers.programCounter)

    this.codeDataLogger.logAsData(this.registers.programCounter)
    this.registers.advanceProgramCounter()

    return byte
  }

  private fetchWord(): Uint16 {
    const lowByte = this.bus.read(this.registers.programCounter)

    this.codeDataLogger.logAsData(this.registers.programCounter)
    this.registers.advanceProgramCounter()

    const highByte = this.bus.read(this.registers.programCounter)

    this.codeDataLogger.logAsData(this.registers.programCounter)
    this.registers.advanceProgramCounter()

    return combineIntoWord(lowByte, highByte)
  }
}
