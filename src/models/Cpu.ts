import { AddressingMode, Cycle, InstructionType, Logger, Opcode, Operand } from '/@/types'
import { UnknownAddressingModeError, UnknownInstructionTypeError } from '/@/errors'
import { toHex, validateNonNullable } from '/@/utils'
import CpuBus from '/@/models/CpuBus'
import CpuRegisters, { isNegative, isZero, uint8ToInt8 } from '/@/models/CpuRegister'
import Instruction from '/@/models/Instruction'
import InstructionSet from '/@/models/InstructionSet'

export default class Cpu {
  private debug = false
  private logger: Logger | null = null
  private registers = new CpuRegisters()
  private stallCycleCount: Cycle = 0

  constructor(private bus: CpuBus) {}

  get isStall(): boolean {
    return this.stallCycleCount > 0
  }

  setDebug(debug: boolean): void {
    this.debug = debug
  }

  setLogger(logger: Logger): void {
    this.logger = logger
  }

  bootup(): void {
    this.registers.programCounter.write(0x0034)
    this.registers.accumulator.write(0)
    this.registers.indexX.write(0)
    this.registers.indexY.write(0)
    this.registers.stackPointer.write(0xfd)

    this.reset()
  }

  reset(): void {
    this.registers.programCounter.write(this.readWord(0xfffc, 0xfffd))
  }

  runCycle(): void {
    if (this.isStall) {
      this.stallCycleCount--
      return
    }

    const opcode = this.fetch()
    const { instruction, operand } = this.decode(opcode)
    this.execute(instruction, operand)

    this.stallCycleCount = instruction.cycle - 1

    if (this.debug && this.logger) {
      this.logger.log(
        '[Cpu] ' +
          `opcode: ${toHex(instruction.opcode, 2)}, ` +
          `operand: ${toHex(operand, 4)}, ` +
          `instruction type: ${instruction.type}, ` +
          `addressing mode: ${instruction.addressingMode}, ` +
          `cycle: ${instruction.cycle}`
      )
      this.logger.log(`[Cpu Register] ${this.registers.inspect()}`)
    }
  }

  private fetch(times: 1 | 2 = 1): Uint8 | Uint16 {
    if (times === 1) {
      const byte = this.readByte(this.registers.programCounter.read())

      this.registers.programCounter.increment()

      return byte
    } else {
      const lowByte = this.readByte(this.registers.programCounter.read())

      this.registers.programCounter.increment()

      const highByte = this.readByte(this.registers.programCounter.read())

      this.registers.programCounter.increment()

      return lowByte | (highByte << 8)
    }
  }

  private decode(opcode: Opcode): { instruction: Instruction; operand: Operand | null } {
    const instruction = InstructionSet.findByOpcode(opcode)
    const operand = this.readOperand(instruction.addressingMode)

    return { instruction, operand }
  }

  // see: http://obelisk.me.uk/6502/addressing.html
  private readOperand(addressingMode: AddressingMode): Operand | null {
    switch (addressingMode) {
      case AddressingMode.implicit: {
        return this.readOperandByImplicit()
      }
      case AddressingMode.immediate: {
        return this.readOperandByImmediate()
      }
      case AddressingMode.relative: {
        return this.readOperandByRelative()
      }
      case AddressingMode.absolute: {
        return this.readOperandByAbsolute()
      }
      case AddressingMode.absoluteX: {
        return this.readOperandByAbsoluteX()
      }
      case AddressingMode.indirectIndexed: {
        return this.readOperandByIndirectIndexed()
      }
      default: {
        throw new UnknownAddressingModeError(addressingMode)
      }
    }
  }

  private readOperandByImplicit(): null {
    return null
  }

  private readOperandByImmediate(): Operand {
    return this.fetch()
  }

  private readOperandByRelative(): Operand {
    const offset = this.fetch()
    return this.registers.programCounter.read() + uint8ToInt8(offset)
  }

  private readOperandByAbsolute(): Operand {
    return this.fetch(2)
  }

  private readOperandByAbsoluteX(): Operand {
    return this.fetch(2) + this.registers.indexX.read()
  }

  private readOperandByIndirectIndexed(): Operand {
    const baseAddress = this.fetch()
    return this.readWord(baseAddress, baseAddress + 1) + this.registers.indexY.read()
  }

  // see: http://obelisk.me.uk/6502/reference.html
  private execute(instruction: Instruction, operand: Operand | null): void {
    switch (instruction.type) {
      case InstructionType.bpl: {
        this.executeBpl(this.resolveAddress(operand))
        break
      }
      case InstructionType.bne: {
        this.executeBne(this.resolveAddress(operand))
        break
      }
      case InstructionType.dey: {
        this.executeDey()
        break
      }
      case InstructionType.eor: {
        this.executeEor(this.resolveData(operand, instruction.addressingMode))
        break
      }
      case InstructionType.inx: {
        this.executeInx()
        break
      }
      case InstructionType.jmp: {
        this.executeJmp(this.resolveAddress(operand))
        break
      }
      case InstructionType.lda: {
        this.executeLda(this.resolveData(operand, instruction.addressingMode))
        break
      }
      case InstructionType.ldx: {
        this.executeLdx(this.resolveData(operand, instruction.addressingMode))
        break
      }
      case InstructionType.ldy: {
        this.executeLdy(this.resolveData(operand, instruction.addressingMode))
        break
      }
      case InstructionType.nop: {
        this.executeNop()
        break
      }
      case InstructionType.ora: {
        this.executeOra(this.resolveData(operand, instruction.addressingMode))
        break
      }
      case InstructionType.sei: {
        this.executeSei()
        break
      }
      case InstructionType.sta: {
        this.executeSta(this.resolveAddress(operand))
        break
      }
      case InstructionType.txs: {
        this.executeTxs()
        break
      }
      default: {
        throw new UnknownInstructionTypeError(instruction.type)
      }
    }
  }

  private executeBpl(address: Uint16): void {
    if (this.registers.status.negativeFlag) return
    this.registers.programCounter.write(address)
  }

  private executeBne(address: Uint16): void {
    if (this.registers.status.zeroFlag) return
    this.registers.programCounter.write(address)
  }

  private executeDey(): void {
    this.registers.indexY.decrement()
    this.registers.status.zeroFlag = isZero(this.registers.indexY.read())
    this.registers.status.negativeFlag = isNegative(this.registers.indexY.read())
  }

  private executeEor(data: Uint8): void {
    this.registers.accumulator.write(this.registers.accumulator.read() ^ data)
    this.registers.status.zeroFlag = isZero(this.registers.accumulator.read())
    this.registers.status.negativeFlag = isNegative(this.registers.accumulator.read())
  }

  private executeInx(): void {
    this.registers.indexX.increment()
    this.registers.status.zeroFlag = isZero(this.registers.indexX.read())
    this.registers.status.negativeFlag = isNegative(this.registers.indexX.read())
  }

  private executeJmp(address: Uint16): void {
    this.registers.programCounter.write(address)
  }

  private executeLda(data: Uint8): void {
    this.registers.accumulator.write(data)
    this.registers.status.zeroFlag = isZero(this.registers.accumulator.read())
    this.registers.status.negativeFlag = isNegative(this.registers.accumulator.read())
  }

  private executeLdx(data: Uint8): void {
    this.registers.indexX.write(data)
    this.registers.status.zeroFlag = isZero(this.registers.indexX.read())
    this.registers.status.negativeFlag = isNegative(this.registers.indexX.read())
  }

  private executeLdy(data: Uint8): void {
    this.registers.indexY.write(data)
    this.registers.status.zeroFlag = isZero(this.registers.indexY.read())
    this.registers.status.negativeFlag = isNegative(this.registers.indexY.read())
  }

  private executeNop(): void {
    // noop
  }

  private executeOra(data: Uint8): void {
    this.registers.accumulator.write(this.registers.accumulator.read() | data)
    this.registers.status.zeroFlag = isZero(this.registers.accumulator.read())
    this.registers.status.negativeFlag = isNegative(this.registers.accumulator.read())
  }

  private executeSei(): void {
    this.registers.status.interruptDisableFlag = true
  }

  private executeSta(address: Uint16): void {
    this.write(address, this.registers.accumulator.read())
  }

  private executeTxs(): void {
    this.registers.stackPointer.write(this.registers.indexX.read())
  }

  private resolveAddress(address: Uint16 | null): Uint16 {
    validateNonNullable(address)
    return address
  }

  private resolveData(operand: Operand | null, addressingMode: AddressingMode): Uint8 {
    validateNonNullable(operand)
    return addressingMode === AddressingMode.immediate ? operand : this.readByte(operand)
  }

  private readByte(address: Uint16): Uint8 {
    return this.bus.read(address)
  }

  private readWord(lowAddress: Uint16, highAddress: Uint16): Uint16 {
    return this.readByte(lowAddress) | (this.readByte(highAddress) << 8)
  }

  private write(address: Uint16, data: Uint8): void {
    this.bus.write(address, data)
  }
}
