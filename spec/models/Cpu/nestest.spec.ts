import { buildCpu, buildPpu, loadRom, readFixtureAsText } from 'spec/support/helpers'
import { NestestCpuDumper } from 'spec/support/lib/NestestCpuDumper'
import { NestestVideoRenderer } from 'spec/support/lib/NestestVideoRenderer'
import { Cpu, CpuBus } from '/@/models/Cpu'
import { InterruptController } from '/@/models/InterruptController'
import { Ppu, PpuBus } from '/@/models/Ppu'

describe('Cpu', () => {
  describe('nestest.nesの実行', () => {
    let cpu: Cpu
    let cpuBus: CpuBus
    let ppu: Ppu
    let ppuBus: PpuBus
    let nestestDumper: NestestCpuDumper

    const runCycle = () => {
      cpu.runCycle()
      ppu.runCycle()
      ppu.runCycle()
      ppu.runCycle()
    }
    const expectedLogs = readFixtureAsText('data/nestest.log').trim().split(/\n/)

    beforeEach(() => {
      const interruptController = new InterruptController()
      const ppus = buildPpu(interruptController)
      const cpus = buildCpu(ppus.ppu, interruptController)
      cpu = cpus.cpu
      ppu = ppus.ppu
      cpuBus = cpus.cpuBus
      ppuBus = ppus.ppuBus

      const rom = loadRom('nestest')
      cpuBus.rom = rom
      ppuBus.rom = rom

      const videoRenderer = new NestestVideoRenderer()
      ppu.videoRenderer = videoRenderer

      nestestDumper = new NestestCpuDumper()
      cpu.dumper = nestestDumper
      ppu.dumper = nestestDumper

      cpu.powerUp()
      cpu['registers'].programCounter = 0xc000
      cpu['registers'].status = 0x24

      // NOTE: 起動直後に必要なサイクルを進める
      while (cpu.isStall) runCycle()
    })

    it('nestest.nesが正常に実行されること', () => {
      for (let i = 0; i < expectedLogs.length; i++) {
        do runCycle()
        while (cpu.isStall)
      }

      expect(cpuBus.read(0x02)).toBe(0x0)
      expect(cpuBus.read(0x03)).toBe(0x0)
    })

    it('nestest.logの結果と一致すること', () => {
      const actualLogs = []

      for (let i = 0; i < expectedLogs.length; i++) {
        do runCycle()
        while (cpu.isStall)

        actualLogs.push(nestestDumper.dump())
      }

      expect(actualLogs).toMatchObject(expectedLogs)
    })
  })
})
