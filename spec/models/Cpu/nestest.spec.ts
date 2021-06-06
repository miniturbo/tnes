import { Nes } from '@/models/Nes'
import { readFixtureAsBuffer, readFixtureAsText } from 'spec/support/helpers'
import { NestestDumper } from 'spec/support/lib/NestestDumper'

describe('Cpu', () => {
  describe('nestest.nesの実行', () => {
    let nes: Nes
    let nestestDumper: NestestDumper

    const expectedLogs = readFixtureAsText('data/nestest.log').trim().split(/\n/)

    beforeEach(() => {
      nes = new Nes()
      nestestDumper = new NestestDumper(nes.cpu, nes.ppu)

      nes.loadRom(readFixtureAsBuffer('roms/nestest.nes').buffer)
      nes.powerUp(false)

      // NOTE: 起動直後のCPUのストールを解消する
      nes.runStep()

      // NOTE: nestest向けに初期値を設定する
      nes.cpu.registers.programCounter = 0xc000
      nes.cpu.registers.status = 0x24
    })

    it('nestest.nesが正常に実行されること', () => {
      for (let i = 0; i < expectedLogs.length; i++) {
        nes.runStep()
      }

      expect(nes.cpu.bus.read(0x02)).toBe(0x0)
      expect(nes.cpu.bus.read(0x03)).toBe(0x0)
    })

    it('nestest.logの結果と一致すること', () => {
      const actualLogs = []

      for (let i = 0; i < expectedLogs.length; i++) {
        nes.runStep()

        actualLogs.push(nestestDumper.dump())
      }

      expect(actualLogs).toMatchObject(expectedLogs)
    })
  })
})
