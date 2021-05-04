import { Bus } from '/@/models/Cpu/Bus'
import { Instruction } from '/@/models/Cpu/Instruction'
import { InstructionSet } from '/@/models/Cpu/InstructionSet'
import { Registers } from '/@/models/Cpu/Registers'

export class Fetcher {
  constructor(private bus: Bus, private registers: Registers) {}

  fetch(): Instruction {
    const opcode = this.bus.read(this.registers.programCounter, { isOpcode: true })

    this.registers.advanceProgramCounter()

    return InstructionSet.findByOpcode(opcode)
  }
}
