import { CpuCycle, PpuCycle, PpuScanline } from '/@/types'
import { CpuBus, CpuInstruction, CpuOperands, CpuRegisters } from '/@/models/Cpu'

export const NesState = {
  powerOff: 'powerOff',
  run: 'Run',
  stop: 'Stop',
} as const

export type NesDumper = {
  cpuBus: CpuBus | null
  cpuRegisters: CpuRegisters | null
  cpuInstruction: CpuInstruction | null
  cpuOperands: CpuOperands | null
  ppuScanline: PpuScanline | null
  ppuCycle: PpuCycle | null
  incrementCpuCycle(cpuCycle: CpuCycle): void
  save(): void
  dump(): void
}

export type NesState = typeof NesState[keyof typeof NesState]
