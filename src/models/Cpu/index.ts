import { CpuCycle, NesDumper } from '/@/types'
import { combineIntoWord, maskAsByte, maskAsWord } from '/@/utils'
import { Bus } from '/@/models/Cpu/Bus'
import { CodeDataLogger } from '/@/models/Cpu/CodeDataLogger'
import { Decoder } from '/@/models/Cpu/Decoder'
import { Executor } from '/@/models/Cpu/Executor'
import { Fetcher } from '/@/models/Cpu/Fetcher'
import { Instruction } from '/@/models/Cpu/Instruction'
import { InstructionSet } from '/@/models/Cpu/InstructionSet'
import { InterruptController } from '/@/models/InterruptController'
import { Operands } from '/@/models/Cpu/Operands'
import { Registers } from '/@/models/Cpu/Registers'

export {
  Bus as CpuBus,
  Instruction as CpuInstruction,
  InstructionSet as CpuInstructionSet,
  Operands as CpuOperands,
  Registers as CpuRegisters,
}

export class Cpu {
  dumper: NesDumper | null = null

  readonly registers = new Registers()
  readonly codeDataLogger = new CodeDataLogger(0xffff)

  private fetcher = new Fetcher(this.bus, this.registers)
  private decoder = new Decoder(this.bus, this.registers, this.codeDataLogger)
  private executor = new Executor(this.bus, this.registers, this.codeDataLogger)
  private stallCycle: CpuCycle = 0

  constructor(private bus: Bus, private interruptController: InterruptController) {}

  get isStall(): boolean {
    return this.stallCycle > 0
  }

  powerUp(): void {
    this.stallCycle = 0

    this.registers.programCounter = maskAsWord(0x0000)
    this.registers.stackPointer = maskAsByte(0x00)
    this.registers.accumulator = maskAsByte(0x00)
    this.registers.indexX = maskAsByte(0x00)
    this.registers.indexY = maskAsByte(0x00)
    this.registers.status = maskAsByte(0x00)
    this.registers.breakCommandFlag = true
    this.registers.reservedFlag = true

    this.bus.workRam.clear()

    this.codeDataLogger.clear()
  }

  reset(): void {
    this.registers.programCounter = combineIntoWord(this.bus.read(0xfffc), this.bus.read(0xfffd))
    this.registers.stackPointer = maskAsByte(this.registers.stackPointer - 3)
    this.registers.interruptDisableFlag = true

    this.codeDataLogger.logAsCode(this.registers.programCounter)

    this.stallCycle = 7

    if (this.dumper) {
      this.dumper.incrementCpuCycle(this.stallCycle)
    }
  }

  runCycle(): void {
    if (this.isStall) {
      this.stallCycle--
      return
    }

    if (this.interruptController.nmi) {
      this.interruptController.nmi = false
      this.executor.handleNmi()
    }

    const instruction = this.fetcher.fetch()
    const operands = this.decoder.decode(instruction.addressingMode)

    if (this.dumper) {
      this.dumper.cpuBus = this.bus
      this.dumper.cpuRegisters = this.registers
      this.dumper.cpuInstruction = instruction
      this.dumper.cpuOperands = operands
      this.dumper.save()
    }

    const additionalCycle = this.executor.execute(instruction, operands)

    this.stallCycle += instruction.cycle
    this.stallCycle += additionalCycle
    this.stallCycle--

    if (this.dumper) {
      this.dumper.incrementCpuCycle(this.stallCycle + 1)
    }
  }
}
