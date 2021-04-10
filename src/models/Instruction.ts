import { AddressingMode, Cycle, InstructionType, Opcode } from '/@/types'

export default class Instruction {
  constructor(
    readonly opcode: Opcode,
    readonly type: InstructionType,
    readonly addressingMode: AddressingMode,
    readonly cycle: Cycle,
    readonly _: boolean
  ) {}
}
