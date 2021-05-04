import { CpuAddressingMode, CpuCycle, CpuInstructionType, CpuOpcode } from '/@/types'

export class Instruction {
  constructor(
    readonly opcode: CpuOpcode,
    readonly type: CpuInstructionType,
    readonly addressingMode: CpuAddressingMode,
    readonly cycle: CpuCycle,
    readonly byte: number,
    readonly isOfficial: boolean
  ) {}
}
