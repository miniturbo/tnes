import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Controller } from '/@/models/Controller'
import { Cpu, CpuBus } from '/@/models/Cpu'
import { InterruptController } from '/@/models/InterruptController'
import { Ppu, PpuBus } from '/@/models/Ppu'
import { Ram } from '/@/models/Ram'
import { Rom } from '/@/models/Rom'

const fixturePath = resolve(__dirname, `../../support/fixtures`)

export function readFixtureAsText(path: string): string {
  return readFileSync(resolve(fixturePath, path), 'utf-8')
}

export function readFixtureAsBuffer(path: string): Buffer {
  return readFileSync(resolve(fixturePath, path))
}

export function loadRom(name: string): Rom {
  const file = readFixtureAsBuffer(`roms/${name}.nes`)
  return Rom.load(file.buffer)
}

export function buildPpu(interruptController: InterruptController): { ppu: Ppu; ppuBus: PpuBus } {
  const videoRam = new Ram(2048)
  const paletteRam = new Ram(32)
  const ppuBus = new PpuBus(videoRam, paletteRam)
  const ppu = new Ppu(ppuBus, interruptController)
  return { ppu, ppuBus }
}

export function buildCpu(ppu: Ppu, interruptController: InterruptController): { cpu: Cpu; cpuBus: CpuBus } {
  const controller1 = new Controller()
  const controller2 = new Controller()
  const workRam = new Ram(2048)
  const cpuBus = new CpuBus(workRam, ppu, controller1, controller2)
  const cpu = new Cpu(cpuBus, interruptController)
  return { cpu, cpuBus }
}
