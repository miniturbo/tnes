import { EventEmitter } from 'events'
import { UnknownAddressingModeError, UnknownInstructionTypeError } from '@/errors'
import { CpuBus } from '@/models/Cpu/CpuBus'
import { CpuRegisters } from '@/models/Cpu/CpuRegisters'
import { Instruction } from '@/models/Cpu/Instruction'
import { InstructionSet } from '@/models/Cpu/InstructionSet'
import { Operands } from '@/models/Cpu/Operands'
import { Ram } from '@/models/Ram'
import { CpuAddressingMode, CpuCycle, CpuInstructionType } from '@/types'
import {
  bitFlag,
  combineIntoWord,
  divideIntoBytes,
  isBorrow,
  isCarry,
  isNegative,
  isOverflow,
  isPageCrossed,
  isZero,
  maskAsByte,
  maskAsWord,
  setBitFlag,
  uint8ToInt8,
} from '@/utils'

export class Cpu extends EventEmitter {
  readonly bus = new CpuBus()
  readonly registers = new CpuRegisters()

  private workRam = new Ram(2048)
  private stallCycle: CpuCycle = 0

  constructor() {
    super()

    this.bus.workRam = this.workRam
  }

  get isStall(): boolean {
    return this.stallCycle > 0
  }

  powerUp(): void {
    this.stallCycle = 0

    this.registers.programCounter = 0x0000
    this.registers.stackPointer = 0x00
    this.registers.accumulator = 0x00
    this.registers.indexX = 0x00
    this.registers.indexY = 0x00
    this.registers.status = 0x00
    this.registers.breakCommandFlag = true
    this.registers.reservedFlag = true

    this.workRam.clear()
  }

  reset(): void {
    this.registers.programCounter = combineIntoWord(this.bus.read(0xfffc), this.bus.read(0xfffd))
    this.registers.stackPointer = maskAsByte(this.registers.stackPointer - 3)
    this.registers.interruptDisableFlag = true

    this.stallCycle = 7

    this.emit('reset', this.stallCycle)
  }

  runNmi(): void {
    this.pushWordToStack(this.registers.programCounter)
    this.pushByteToStack(this.registers.status)

    this.registers.programCounter = combineIntoWord(this.bus.read(0xfffa), this.bus.read(0xfffb))

    this.stallCycle += 7
  }

  runCycle(): void {
    if (this.isStall) {
      this.stallCycle--
      return
    }

    const instruction = this.fetch()
    const operands = this.decode(instruction.addressingMode)
    const cycle = this.execute(instruction, operands)

    this.stallCycle += cycle - 1
  }

  stall(cycle: CpuCycle): void {
    this.stallCycle += cycle
  }

  private fetch(): Instruction {
    this.emit('beforefetch')

    const opcode = this.fetchByte()
    const instruction = InstructionSet.findByOpcode(opcode)

    this.emit('afterfetch', instruction)

    return instruction
  }

  private decode(addressingMode: CpuAddressingMode): Operands {
    this.emit('beforedecode')

    let operands
    switch (addressingMode) {
      case CpuAddressingMode.Implicit: {
        operands = this.decodeByImplicit()
        break
      }
      case CpuAddressingMode.Accumulator: {
        operands = this.decodeByAccumulator()
        break
      }
      case CpuAddressingMode.Immediate: {
        operands = this.decodeByImmediate()
        break
      }
      case CpuAddressingMode.ZeroPage: {
        operands = this.decodeByZeroPage()
        break
      }
      case CpuAddressingMode.ZeroPageX: {
        operands = this.decodeByZeroPageX()
        break
      }
      case CpuAddressingMode.ZeroPageY: {
        operands = this.decodeByZeroPageY()
        break
      }
      case CpuAddressingMode.Relative: {
        operands = this.decodeByRelative()
        break
      }
      case CpuAddressingMode.Absolute: {
        operands = this.decodeByAbsolute()
        break
      }
      case CpuAddressingMode.AbsoluteX: {
        operands = this.decodeByAbsoluteX()
        break
      }
      case CpuAddressingMode.AbsoluteY: {
        operands = this.decodeByAbsoluteY()
        break
      }
      case CpuAddressingMode.Indirect: {
        operands = this.decodeByIndirect()
        break
      }
      case CpuAddressingMode.IndexedIndirect: {
        operands = this.decodeByIndexedIndirect()
        break
      }
      case CpuAddressingMode.IndirectIndexed: {
        operands = this.decodeByIndirectIndexed()
        break
      }
      default: {
        throw new UnknownAddressingModeError(addressingMode)
      }
    }

    this.emit('afterdecode', operands)

    return operands
  }

  private decodeByImplicit(): Operands {
    return new Operands([], false)
  }

  private decodeByAccumulator(): Operands {
    return new Operands([], false)
  }

  private decodeByImmediate(): Operands {
    return new Operands([this.fetchByte()], false)
  }

  private decodeByZeroPage(): Operands {
    return new Operands([this.fetchByte()], false)
  }

  private decodeByZeroPageX(): Operands {
    const operand1 = this.fetchByte()
    const operand2 = maskAsByte(operand1 + this.registers.indexX)
    return new Operands([operand1, operand2], false)
  }

  private decodeByZeroPageY(): Operands {
    const operand1 = this.fetchByte()
    const operand2 = maskAsByte(operand1 + this.registers.indexY)
    return new Operands([operand1, operand2], false)
  }

  private decodeByRelative(): Operands {
    const operand1 = this.fetchByte()
    const operand2 = maskAsWord(this.registers.programCounter + uint8ToInt8(operand1))
    return new Operands([operand1, operand2], isPageCrossed(this.registers.programCounter, operand2))
  }

  private decodeByAbsolute(): Operands {
    return new Operands([this.fetchWord()], false)
  }

  private decodeByAbsoluteX(): Operands {
    const operand1 = this.fetchWord()
    const operand2 = maskAsWord(operand1 + this.registers.indexX)
    return new Operands([operand1, operand2], isPageCrossed(operand1, operand2))
  }

  private decodeByAbsoluteY(): Operands {
    const operand1 = this.fetchWord()
    const operand2 = maskAsWord(operand1 + this.registers.indexY)
    return new Operands([operand1, operand2], isPageCrossed(operand1, operand2))
  }

  // see: http://www.6502.org/tutorials/6502opcodes.html#JMP
  private decodeByIndirect(): Operands {
    const operand1 = this.fetchWord()
    const lowByte = this.bus.read(operand1)
    const highByte = this.bus.read((operand1 & 0xff00) | ((operand1 + 0x1) & 0xff))
    const operand2 = combineIntoWord(lowByte, highByte)
    return new Operands([operand1, operand2], false)
  }

  private decodeByIndexedIndirect(): Operands {
    const operand1 = this.fetchByte()
    const operand2 = maskAsByte(operand1 + this.registers.indexX)
    const lowByte = this.bus.read(operand2)
    const highByte = this.bus.read(maskAsByte(operand2 + 0x1))
    const operand3 = combineIntoWord(lowByte, highByte)
    return new Operands([operand1, operand2, operand3], false)
  }

  private decodeByIndirectIndexed(): Operands {
    const operand1 = this.fetchByte()
    const lowByte = this.bus.read(maskAsByte(operand1))
    const highByte = this.bus.read(maskAsByte(operand1 + 0x1))
    const operand2 = combineIntoWord(lowByte, highByte)
    const operand3 = maskAsWord(operand2 + this.registers.indexY)
    return new Operands([operand1, operand2, operand3], isPageCrossed(operand2, operand3))
  }

  // see: http://obelisk.me.uk/6502/reference.html
  private execute(instruction: Instruction, operands: Operands): CpuCycle {
    this.emit('beforeexecute')

    let additionalCycle: CpuCycle
    switch (instruction.type) {
      case CpuInstructionType.Adc: {
        additionalCycle = this.executeAdc(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.And: {
        additionalCycle = this.executeAnd(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Asl: {
        additionalCycle = this.executeAsl(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Bcc: {
        additionalCycle = this.executeBcc(operands)
        break
      }
      case CpuInstructionType.Bcs: {
        additionalCycle = this.executeBcs(operands)
        break
      }
      case CpuInstructionType.Beq: {
        additionalCycle = this.executeBeq(operands)
        break
      }
      case CpuInstructionType.Bit: {
        additionalCycle = this.executeBit(operands)
        break
      }
      case CpuInstructionType.Bmi: {
        additionalCycle = this.executeBmi(operands)
        break
      }
      case CpuInstructionType.Bne: {
        additionalCycle = this.executeBne(operands)
        break
      }
      case CpuInstructionType.Bpl: {
        additionalCycle = this.executeBpl(operands)
        break
      }
      case CpuInstructionType.Brk: {
        additionalCycle = this.executeBrk()
        break
      }
      case CpuInstructionType.Bvc: {
        additionalCycle = this.executeBvc(operands)
        break
      }
      case CpuInstructionType.Bvs: {
        additionalCycle = this.executeBvs(operands)
        break
      }
      case CpuInstructionType.Clc: {
        additionalCycle = this.executeClc()
        break
      }
      case CpuInstructionType.Cld: {
        additionalCycle = this.executeCld()
        break
      }
      case CpuInstructionType.Cli: {
        additionalCycle = this.executeCli()
        break
      }
      case CpuInstructionType.Clv: {
        additionalCycle = this.executeClv()
        break
      }
      case CpuInstructionType.Cmp: {
        additionalCycle = this.executeCmp(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Cpx: {
        additionalCycle = this.executeCpx(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Cpy: {
        additionalCycle = this.executeCpy(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Dcp: {
        additionalCycle = this.executeDcp(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Dec: {
        additionalCycle = this.executeDec(operands)
        break
      }
      case CpuInstructionType.Dex: {
        additionalCycle = this.executeDex()
        break
      }
      case CpuInstructionType.Dey: {
        additionalCycle = this.executeDey()
        break
      }
      case CpuInstructionType.Eor: {
        additionalCycle = this.executeEor(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Inc: {
        additionalCycle = this.executeInc(operands)
        break
      }
      case CpuInstructionType.Inx: {
        additionalCycle = this.executeInx()
        break
      }
      case CpuInstructionType.Iny: {
        additionalCycle = this.executeIny()
        break
      }
      case CpuInstructionType.Isb: {
        additionalCycle = this.executeIsb(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Jmp: {
        additionalCycle = this.executeJmp(operands)
        break
      }
      case CpuInstructionType.Jsr: {
        additionalCycle = this.executeJsr(operands)
        break
      }
      case CpuInstructionType.Lax: {
        additionalCycle = this.executeLax(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Lda: {
        additionalCycle = this.executeLda(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Ldx: {
        additionalCycle = this.executeLdx(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Ldy: {
        additionalCycle = this.executeLdy(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Lsr: {
        additionalCycle = this.executeLsr(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Nop: {
        additionalCycle = this.executeNop(operands)
        break
      }
      case CpuInstructionType.Ora: {
        additionalCycle = this.executeOra(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Pha: {
        additionalCycle = this.executePha()
        break
      }
      case CpuInstructionType.Php: {
        additionalCycle = this.executePhp()
        break
      }
      case CpuInstructionType.Pla: {
        additionalCycle = this.executePla()
        break
      }
      case CpuInstructionType.Plp: {
        additionalCycle = this.executePlp()
        break
      }
      case CpuInstructionType.Rla: {
        additionalCycle = this.executeRla(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Rol: {
        additionalCycle = this.executeRol(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Ror: {
        additionalCycle = this.executeRor(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Rra: {
        additionalCycle = this.executeRra(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Rti: {
        additionalCycle = this.executeRti()
        break
      }
      case CpuInstructionType.Rts: {
        additionalCycle = this.executeRts()
        break
      }
      case CpuInstructionType.Sax: {
        additionalCycle = this.executeSax(operands)
        break
      }
      case CpuInstructionType.Sbc: {
        additionalCycle = this.executeSbc(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Sec: {
        additionalCycle = this.executeSec()
        break
      }
      case CpuInstructionType.Sed: {
        additionalCycle = this.executeSed()
        break
      }
      case CpuInstructionType.Sei: {
        additionalCycle = this.executeSei()
        break
      }
      case CpuInstructionType.Slo: {
        additionalCycle = this.executeSlo(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Sre: {
        additionalCycle = this.executeSre(operands, instruction.addressingMode)
        break
      }
      case CpuInstructionType.Sta: {
        additionalCycle = this.executeSta(operands)
        break
      }
      case CpuInstructionType.Stx: {
        additionalCycle = this.executeStx(operands)
        break
      }
      case CpuInstructionType.Sty: {
        additionalCycle = this.executeSty(operands)
        break
      }
      case CpuInstructionType.Tax: {
        additionalCycle = this.executeTax()
        break
      }
      case CpuInstructionType.Tay: {
        additionalCycle = this.executeTay()
        break
      }
      case CpuInstructionType.Tsx: {
        additionalCycle = this.executeTsx()
        break
      }
      case CpuInstructionType.Txa: {
        additionalCycle = this.executeTxa()
        break
      }
      case CpuInstructionType.Txs: {
        additionalCycle = this.executeTxs()
        break
      }
      case CpuInstructionType.Tya: {
        additionalCycle = this.executeTya()
        break
      }
      default: {
        throw new UnknownInstructionTypeError(instruction.type)
      }
    }

    const cycle = instruction.cycle + additionalCycle

    this.emit('afterexecute', cycle)

    return cycle
  }

  // see: http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
  private executeAdc(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator + operand + (this.registers.carryFlag ? 0x1 : 0x0)

    this.registers.carryFlag = isCarry(result)
    this.registers.zeroFlag = isZero(result)
    this.registers.overflowFlag = isOverflow(this.registers.accumulator, operand)
    this.registers.negativeFlag = isNegative(result)
    this.registers.accumulator = maskAsByte(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeAnd(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator & operand

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.accumulator = maskAsByte(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeAsl(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    if (addressingMode === CpuAddressingMode.Accumulator) {
      const operand = this.registers.accumulator
      const result = operand << 1

      this.registers.carryFlag = bitFlag(operand, 7)
      this.registers.zeroFlag = isZero(result)
      this.registers.negativeFlag = isNegative(result)
      this.registers.accumulator = maskAsByte(result)
    } else {
      const operand = this.bus.read(operands.operand)
      const result = operand << 1

      this.registers.carryFlag = bitFlag(operand, 7)
      this.registers.zeroFlag = isZero(result)
      this.registers.negativeFlag = isNegative(result)
      this.bus.write(operands.operand, maskAsByte(result))
    }

    return 0
  }

  private executeBcc(operands: Operands): CpuCycle {
    if (this.registers.carryFlag) return 0

    this.registers.programCounter = operands.operand

    return operands.isPageCrossed ? 2 : 1
  }

  private executeBcs(operands: Operands): CpuCycle {
    if (!this.registers.carryFlag) return 0

    this.registers.programCounter = operands.operand

    return operands.isPageCrossed ? 2 : 1
  }

  private executeBeq(operands: Operands): CpuCycle {
    if (!this.registers.zeroFlag) return 0

    this.registers.programCounter = operands.operand

    return operands.isPageCrossed ? 2 : 1
  }

  private executeBit(operands: Operands): CpuCycle {
    const operand = this.bus.read(operands.operand)

    this.registers.zeroFlag = isZero(this.registers.accumulator & operand)
    this.registers.overflowFlag = bitFlag(operand, 6)
    this.registers.negativeFlag = isNegative(operand)

    return 0
  }

  private executeBmi(operands: Operands): CpuCycle {
    if (!this.registers.negativeFlag) return 0

    this.registers.programCounter = operands.operand

    return operands.isPageCrossed ? 2 : 1
  }

  private executeBne(operands: Operands): CpuCycle {
    if (this.registers.zeroFlag) return 0

    this.registers.programCounter = operands.operand

    return operands.isPageCrossed ? 2 : 1
  }

  private executeBpl(operands: Operands): CpuCycle {
    if (this.registers.negativeFlag) return 0

    this.registers.programCounter = operands.operand

    return operands.isPageCrossed ? 2 : 1
  }

  private executeBrk(): CpuCycle {
    this.pushWordToStack(this.registers.programCounter + 0x1)
    this.pushByteToStack(this.registers.status)

    this.registers.programCounter = combineIntoWord(this.bus.read(0xfffe), this.bus.read(0xffff))
    this.registers.breakCommandFlag = true

    return 0
  }

  private executeBvc(operands: Operands): CpuCycle {
    if (this.registers.overflowFlag) return 0

    this.registers.programCounter = operands.operand

    return operands.isPageCrossed ? 2 : 1
  }

  private executeBvs(operands: Operands): CpuCycle {
    if (!this.registers.overflowFlag) return 0

    this.registers.programCounter = operands.operand

    return operands.isPageCrossed ? 2 : 1
  }

  private executeClc(): CpuCycle {
    this.registers.carryFlag = false
    return 0
  }

  private executeCld(): CpuCycle {
    this.registers.decimalModeFlag = false
    return 0
  }

  private executeCli(): CpuCycle {
    this.registers.interruptDisableFlag = false
    return 0
  }

  private executeClv(): CpuCycle {
    this.registers.overflowFlag = false
    return 0
  }

  private executeCmp(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator - operand

    this.registers.carryFlag = isBorrow(result)
    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeCpx(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.indexX - operand

    this.registers.carryFlag = isBorrow(result)
    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)

    return 0
  }

  private executeCpy(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.indexY - operand

    this.registers.carryFlag = isBorrow(result)
    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)

    return 0
  }

  private executeDcp(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    this.executeDec(operands)
    this.executeCmp(operands, addressingMode)
    return 0
  }

  private executeDec(operands: Operands): CpuCycle {
    const operand = this.bus.read(operands.operand)
    const result = operand - 0x1

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.bus.write(operands.operand, maskAsByte(result))

    return 0
  }

  private executeDex(): CpuCycle {
    const result = this.registers.indexX - 0x1

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.indexX = maskAsByte(result)

    return 0
  }

  private executeDey(): CpuCycle {
    const result = this.registers.indexY - 0x1

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.indexY = maskAsByte(result)

    return 0
  }

  private executeEor(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator ^ operand

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.accumulator = maskAsByte(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeInc(operands: Operands): CpuCycle {
    const operand = this.bus.read(operands.operand)
    const result = operand + 1

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.bus.write(operands.operand, maskAsByte(result))

    return 0
  }

  private executeInx(): CpuCycle {
    const result = this.registers.indexX + 0x1

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.indexX = maskAsByte(result)

    return 0
  }

  private executeIny(): CpuCycle {
    const result = this.registers.indexY + 0x1

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.indexY = maskAsByte(result)

    return 0
  }

  private executeIsb(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    this.executeInc(operands)
    this.executeSbc(operands, addressingMode)
    return 0
  }

  private executeJmp(operands: Operands): CpuCycle {
    this.registers.programCounter = operands.operand
    return 0
  }

  private executeJsr(operands: Operands): CpuCycle {
    this.pushWordToStack(this.registers.programCounter - 0x1)

    this.registers.programCounter = operands.operand

    return 0
  }

  private executeLax(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    this.executeLda(operands, addressingMode)
    this.executeTax()
    return operands.isPageCrossed ? 1 : 0
  }

  private executeLda(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)

    this.registers.zeroFlag = isZero(operand)
    this.registers.negativeFlag = isNegative(operand)
    this.registers.accumulator = maskAsByte(operand)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeLdx(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)

    this.registers.zeroFlag = isZero(operand)
    this.registers.negativeFlag = isNegative(operand)
    this.registers.indexX = maskAsByte(operand)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeLdy(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)

    this.registers.zeroFlag = isZero(operand)
    this.registers.negativeFlag = isNegative(operand)
    this.registers.indexY = maskAsByte(operand)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeLsr(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    if (addressingMode === CpuAddressingMode.Accumulator) {
      const operand = this.registers.accumulator
      const result = operand >> 1

      this.registers.carryFlag = bitFlag(operand, 0)
      this.registers.zeroFlag = isZero(result)
      this.registers.negativeFlag = isNegative(result)
      this.registers.accumulator = maskAsByte(result)
    } else {
      const operand = this.bus.read(operands.operand)
      const result = operand >> 1

      this.registers.carryFlag = bitFlag(operand, 0)
      this.registers.zeroFlag = isZero(result)
      this.registers.negativeFlag = isNegative(result)
      this.bus.write(operands.operand, maskAsByte(result))
    }

    return 0
  }

  private executeNop(operands: Operands): CpuCycle {
    return operands.isPageCrossed ? 1 : 0
  }

  private executeOra(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator | operand

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.accumulator = maskAsByte(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executePha(): CpuCycle {
    this.pushByteToStack(this.registers.accumulator)
    return 0
  }

  private executePhp(): CpuCycle {
    let result = this.registers.status
    result = setBitFlag(result, 4, true)
    result = setBitFlag(result, 5, true)

    this.pushByteToStack(result)

    return 0
  }

  private executePla(): CpuCycle {
    const result = this.popByteToStack()

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.accumulator = maskAsByte(result)

    return 0
  }

  private executePlp(): CpuCycle {
    let result = this.popByteToStack()
    result = setBitFlag(result, 4, false)
    result = setBitFlag(result, 5, true)

    this.registers.status = maskAsByte(result)

    return 0
  }

  private executeRla(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    this.executeRol(operands, addressingMode)
    this.executeAnd(operands, addressingMode)
    return 0
  }

  private executeRol(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    if (addressingMode === CpuAddressingMode.Accumulator) {
      const operand = this.registers.accumulator
      const result = (operand << 1) | (this.registers.carryFlag ? 0x1 : 0x0)

      this.registers.carryFlag = bitFlag(operand, 7)
      this.registers.zeroFlag = isZero(result)
      this.registers.negativeFlag = isNegative(result)
      this.registers.accumulator = maskAsByte(result)
    } else {
      const operand = this.bus.read(operands.operand)
      const result = (operand << 1) | (this.registers.carryFlag ? 0x1 : 0x0)

      this.registers.carryFlag = bitFlag(operand, 7)
      this.registers.zeroFlag = isZero(result)
      this.registers.negativeFlag = isNegative(result)
      this.bus.write(operands.operand, maskAsByte(result))
    }

    return 0
  }

  private executeRor(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    if (addressingMode === CpuAddressingMode.Accumulator) {
      const operand = this.registers.accumulator
      const result = (operand >> 1) | ((this.registers.carryFlag ? 0x1 : 0x0) << 7)

      this.registers.carryFlag = bitFlag(operand, 0)
      this.registers.zeroFlag = isZero(result)
      this.registers.negativeFlag = isNegative(result)
      this.registers.accumulator = maskAsByte(result)
    } else {
      const operand = this.bus.read(operands.operand)
      const result = (operand >> 1) | ((this.registers.carryFlag ? 0x1 : 0x0) << 7)

      this.registers.carryFlag = bitFlag(operand, 0)
      this.registers.zeroFlag = isZero(result)
      this.registers.negativeFlag = isNegative(result)
      this.bus.write(operands.operand, maskAsByte(result))
    }

    return 0
  }

  private executeRra(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    this.executeRor(operands, addressingMode)
    this.executeAdc(operands, addressingMode)
    return 0
  }

  private executeRti(): CpuCycle {
    let data = this.popByteToStack()
    data = setBitFlag(data, 4, false)
    data = setBitFlag(data, 5, true)

    this.registers.status = data
    this.registers.programCounter = this.popWordToStack()

    return 0
  }

  private executeRts(): CpuCycle {
    this.registers.programCounter = maskAsWord(this.popWordToStack() + 0x1)
    return 0
  }

  private executeSax(operands: Operands): CpuCycle {
    const address = operands.operand
    const result = this.registers.accumulator & this.registers.indexX

    this.bus.write(address, maskAsByte(result))

    return 0
  }

  // see: http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
  private executeSbc(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.Immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator + ~operand + (this.registers.carryFlag ? 0x1 : 0x0)

    this.registers.carryFlag = isBorrow(result)
    this.registers.zeroFlag = isZero(result)
    this.registers.overflowFlag = isOverflow(this.registers.accumulator, ~operand)
    this.registers.negativeFlag = isNegative(result)
    this.registers.accumulator = maskAsByte(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeSec(): CpuCycle {
    this.registers.carryFlag = true
    return 0
  }

  private executeSed(): CpuCycle {
    this.registers.decimalModeFlag = true
    return 0
  }

  private executeSei(): CpuCycle {
    this.registers.interruptDisableFlag = true
    return 0
  }

  private executeSlo(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    this.executeAsl(operands, addressingMode)
    this.executeOra(operands, addressingMode)
    return 0
  }

  private executeSre(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    this.executeLsr(operands, addressingMode)
    this.executeEor(operands, addressingMode)
    return 0
  }

  private executeSta(operands: Operands): CpuCycle {
    this.bus.write(operands.operand, this.registers.accumulator)
    return 0
  }

  private executeStx(operands: Operands): CpuCycle {
    this.bus.write(operands.operand, this.registers.indexX)
    return 0
  }

  private executeSty(operands: Operands): CpuCycle {
    this.bus.write(operands.operand, this.registers.indexY)
    return 0
  }

  private executeTax(): CpuCycle {
    this.registers.zeroFlag = isZero(this.registers.accumulator)
    this.registers.negativeFlag = isNegative(this.registers.accumulator)
    this.registers.indexX = maskAsByte(this.registers.accumulator)
    return 0
  }

  private executeTay(): CpuCycle {
    this.registers.zeroFlag = isZero(this.registers.accumulator)
    this.registers.negativeFlag = isNegative(this.registers.accumulator)
    this.registers.indexY = maskAsByte(this.registers.accumulator)
    return 0
  }

  private executeTsx(): CpuCycle {
    this.registers.zeroFlag = isZero(this.registers.stackPointer)
    this.registers.negativeFlag = isNegative(this.registers.stackPointer)
    this.registers.indexX = maskAsByte(this.registers.stackPointer)
    return 0
  }

  private executeTxa(): CpuCycle {
    this.registers.zeroFlag = isZero(this.registers.indexX)
    this.registers.negativeFlag = isNegative(this.registers.indexX)
    this.registers.accumulator = maskAsByte(this.registers.indexX)
    return 0
  }

  private executeTxs(): CpuCycle {
    this.registers.stackPointer = this.registers.indexX
    return 0
  }

  private executeTya(): CpuCycle {
    this.registers.zeroFlag = isZero(this.registers.indexY)
    this.registers.negativeFlag = isNegative(this.registers.indexY)
    this.registers.accumulator = maskAsByte(this.registers.indexY)
    return 0
  }

  private fetchByte(): Uint8 {
    const byte = this.bus.read(this.registers.programCounter)

    this.registers.advanceProgramCounter()

    return byte
  }

  private fetchWord(): Uint16 {
    const lowByte = this.bus.read(this.registers.programCounter)

    this.registers.advanceProgramCounter()

    const highByte = this.bus.read(this.registers.programCounter)

    this.registers.advanceProgramCounter()

    return combineIntoWord(lowByte, highByte)
  }

  private pushByteToStack(data: Uint8): void {
    this.bus.write(this.registers.stackPointer | 0x0100, data)
    this.registers.stackPointer = maskAsByte(this.registers.stackPointer - 1)
  }

  private pushWordToStack(data: Uint16): void {
    const [lowByte, highByte] = divideIntoBytes(data)
    this.pushByteToStack(highByte)
    this.pushByteToStack(lowByte)
  }

  private popByteToStack(): Uint8 {
    this.registers.stackPointer = maskAsByte(this.registers.stackPointer + 1)
    return this.bus.read(this.registers.stackPointer | 0x0100)
  }

  private popWordToStack(): Uint8 {
    const lowByte = this.popByteToStack()
    const highByte = this.popByteToStack()
    return combineIntoWord(lowByte, highByte)
  }
}
