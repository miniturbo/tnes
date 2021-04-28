import { CpuAddressingMode, CpuCycle, CpuInstructionType } from '/@/types'
import { UnknownInstructionTypeError } from '/@/errors'
import {
  bitFlag,
  combineIntoWord,
  divideIntoBytes,
  isBorrow,
  isCarry,
  isNegative,
  isOverflow,
  isZero,
  maskAsByte,
  maskAsWord,
  setBitFlag,
} from '/@/utils'
import { Bus } from '/@/models/Cpu/Bus'
import { Instruction } from '/@/models/Cpu/Instruction'
import { Operands } from '/@/models/Cpu/Operands'
import { Registers } from '/@/models/Cpu/Registers'

export class Executor {
  constructor(private bus: Bus, private registers: Registers) {}

  handleNmi(): void {
    this.pushWordToStack(this.registers.programCounter)
    this.pushByteToStack(this.registers.status)
    this.registers.programCounter = combineIntoWord(this.bus.read(0xfffa), this.bus.read(0xfffb))
  }

  // see: http://obelisk.me.uk/6502/reference.html
  execute(instruction: Instruction, operands: Operands): CpuCycle {
    switch (instruction.type) {
      case CpuInstructionType.adc: {
        return this.executeAdc(operands, instruction.addressingMode)
      }
      case CpuInstructionType.and: {
        return this.executeAnd(operands, instruction.addressingMode)
      }
      case CpuInstructionType.asl: {
        return this.executeAsl(operands, instruction.addressingMode)
      }
      case CpuInstructionType.bcc: {
        return this.executeBcc(operands)
      }
      case CpuInstructionType.bcs: {
        return this.executeBcs(operands)
      }
      case CpuInstructionType.beq: {
        return this.executeBeq(operands)
      }
      case CpuInstructionType.bit: {
        return this.executeBit(operands)
      }
      case CpuInstructionType.bmi: {
        return this.executeBmi(operands)
      }
      case CpuInstructionType.bne: {
        return this.executeBne(operands)
      }
      case CpuInstructionType.bpl: {
        return this.executeBpl(operands)
      }
      case CpuInstructionType.brk: {
        return this.executeBrk()
      }
      case CpuInstructionType.bvc: {
        return this.executeBvc(operands)
      }
      case CpuInstructionType.bvs: {
        return this.executeBvs(operands)
      }
      case CpuInstructionType.clc: {
        return this.executeClc()
      }
      case CpuInstructionType.cld: {
        return this.executeCld()
      }
      case CpuInstructionType.cli: {
        return this.executeCli()
      }
      case CpuInstructionType.clv: {
        return this.executeClv()
      }
      case CpuInstructionType.cmp: {
        return this.executeCmp(operands, instruction.addressingMode)
      }
      case CpuInstructionType.cpx: {
        return this.executeCpx(operands, instruction.addressingMode)
      }
      case CpuInstructionType.cpy: {
        return this.executeCpy(operands, instruction.addressingMode)
      }
      case CpuInstructionType.dcp: {
        return this.executeDcp(operands, instruction.addressingMode)
      }
      case CpuInstructionType.dec: {
        return this.executeDec(operands)
      }
      case CpuInstructionType.dex: {
        return this.executeDex()
      }
      case CpuInstructionType.dey: {
        return this.executeDey()
      }
      case CpuInstructionType.eor: {
        return this.executeEor(operands, instruction.addressingMode)
      }
      case CpuInstructionType.inc: {
        return this.executeInc(operands)
      }
      case CpuInstructionType.inx: {
        return this.executeInx()
      }
      case CpuInstructionType.iny: {
        return this.executeIny()
      }
      case CpuInstructionType.isb: {
        return this.executeIsb(operands, instruction.addressingMode)
      }
      case CpuInstructionType.jmp: {
        return this.executeJmp(operands)
      }
      case CpuInstructionType.jsr: {
        return this.executeJsr(operands)
      }
      case CpuInstructionType.lax: {
        return this.executeLax(operands, instruction.addressingMode)
      }
      case CpuInstructionType.lda: {
        return this.executeLda(operands, instruction.addressingMode)
      }
      case CpuInstructionType.ldx: {
        return this.executeLdx(operands, instruction.addressingMode)
      }
      case CpuInstructionType.ldy: {
        return this.executeLdy(operands, instruction.addressingMode)
      }
      case CpuInstructionType.lsr: {
        return this.executeLsr(operands, instruction.addressingMode)
      }
      case CpuInstructionType.nop: {
        return this.executeNop(operands)
      }
      case CpuInstructionType.ora: {
        return this.executeOra(operands, instruction.addressingMode)
      }
      case CpuInstructionType.pha: {
        return this.executePha()
      }
      case CpuInstructionType.php: {
        return this.executePhp()
      }
      case CpuInstructionType.pla: {
        return this.executePla()
      }
      case CpuInstructionType.plp: {
        return this.executePlp()
      }
      case CpuInstructionType.rla: {
        return this.executeRla(operands, instruction.addressingMode)
      }
      case CpuInstructionType.rol: {
        return this.executeRol(operands, instruction.addressingMode)
      }
      case CpuInstructionType.ror: {
        return this.executeRor(operands, instruction.addressingMode)
      }
      case CpuInstructionType.rra: {
        return this.executeRra(operands, instruction.addressingMode)
      }
      case CpuInstructionType.rti: {
        return this.executeRti()
      }
      case CpuInstructionType.rts: {
        return this.executeRts()
      }
      case CpuInstructionType.sax: {
        return this.executeSax(operands)
      }
      case CpuInstructionType.sbc: {
        return this.executeSbc(operands, instruction.addressingMode)
      }
      case CpuInstructionType.sec: {
        return this.executeSec()
      }
      case CpuInstructionType.sed: {
        return this.executeSed()
      }
      case CpuInstructionType.sei: {
        return this.executeSei()
      }
      case CpuInstructionType.slo: {
        return this.executeSlo(operands, instruction.addressingMode)
      }
      case CpuInstructionType.sre: {
        return this.executeSre(operands, instruction.addressingMode)
      }
      case CpuInstructionType.sta: {
        return this.executeSta(operands)
      }
      case CpuInstructionType.stx: {
        return this.executeStx(operands)
      }
      case CpuInstructionType.sty: {
        return this.executeSty(operands)
      }
      case CpuInstructionType.tax: {
        return this.executeTax()
      }
      case CpuInstructionType.tay: {
        return this.executeTay()
      }
      case CpuInstructionType.tsx: {
        return this.executeTsx()
      }
      case CpuInstructionType.txa: {
        return this.executeTxa()
      }
      case CpuInstructionType.txs: {
        return this.executeTxs()
      }
      case CpuInstructionType.tya: {
        return this.executeTya()
      }
      default: {
        throw new UnknownInstructionTypeError(instruction.type)
      }
    }
  }

  // see: http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
  private executeAdc(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator + operand + (this.registers.carryFlag ? 0x1 : 0x0)

    this.registers.carryFlag = isCarry(result)
    this.registers.zeroFlag = isZero(result)
    this.registers.overflowFlag = isOverflow(this.registers.accumulator, operand)
    this.registers.negativeFlag = isNegative(result)
    this.registers.accumulator = maskAsByte(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeAnd(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator & operand

    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)
    this.registers.accumulator = maskAsByte(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeAsl(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    if (addressingMode === CpuAddressingMode.accumulator) {
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
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.accumulator - operand

    this.registers.carryFlag = isBorrow(result)
    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeCpx(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)
    const result = this.registers.indexX - operand

    this.registers.carryFlag = isBorrow(result)
    this.registers.zeroFlag = isZero(result)
    this.registers.negativeFlag = isNegative(result)

    return 0
  }

  private executeCpy(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)
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
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)
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
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)

    this.registers.zeroFlag = isZero(operand)
    this.registers.negativeFlag = isNegative(operand)
    this.registers.accumulator = maskAsByte(operand)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeLdx(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)

    this.registers.zeroFlag = isZero(operand)
    this.registers.negativeFlag = isNegative(operand)
    this.registers.indexX = maskAsByte(operand)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeLdy(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)

    this.registers.zeroFlag = isZero(operand)
    this.registers.negativeFlag = isNegative(operand)
    this.registers.indexY = maskAsByte(operand)

    return operands.isPageCrossed ? 1 : 0
  }

  private executeLsr(operands: Operands, addressingMode: CpuAddressingMode): CpuCycle {
    if (addressingMode === CpuAddressingMode.accumulator) {
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
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)
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
    if (addressingMode === CpuAddressingMode.accumulator) {
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
    if (addressingMode === CpuAddressingMode.accumulator) {
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
    const operand = addressingMode === CpuAddressingMode.immediate ? operands.operand : this.bus.read(operands.operand)
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
