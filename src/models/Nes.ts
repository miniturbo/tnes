import { Cycle, Logger, VideoRenderer } from '/@/types'
import Cpu from '/@/models/Cpu'
import CpuBus from '/@/models/CpuBus'
import Ppu from '/@/models/Ppu'
import PpuBus from '/@/models/PpuBus'
import Ram from '/@/models/Ram'
import Rom from '/@/models/Rom'

export default class Nes {
  static readonly CPU_CYCLES_PER_FRAME: Cycle = Math.ceil((341 * 262) / 3)
  static readonly CPU_CYCLES_PER_SCANLINE: Cycle = Math.ceil(341 / 3)

  private cpu: Cpu
  private cpuBus: CpuBus
  private ppu: Ppu
  private ppuBus: PpuBus
  private workRam: Ram
  private videoRam: Ram
  private paletteRam: Ram

  constructor() {
    this.workRam = new Ram(2048)
    this.videoRam = new Ram(2048)
    this.paletteRam = new Ram(32)

    this.ppuBus = new PpuBus(this.videoRam, this.paletteRam)
    this.ppu = new Ppu(this.ppuBus)

    this.cpuBus = new CpuBus(this.workRam, this.ppu)
    this.cpu = new Cpu(this.cpuBus)
  }

  setDebug(debug: boolean): void {
    this.cpu.setDebug(debug)
    this.cpuBus.setDebug(debug)
    this.ppu.setDebug(debug)
    this.ppuBus.setDebug(debug)
  }

  setLogger(logger: Logger): void {
    this.cpu.setLogger(logger)
    this.cpuBus.setLogger(logger)
    this.ppu.setLogger(logger)
    this.ppuBus.setLogger(logger)
  }

  setRom(rom: Rom): void {
    this.cpuBus.setRom(rom)
    this.ppuBus.setRom(rom)
  }

  setVideoRenderer(videoRenderer: VideoRenderer): void {
    this.ppu.setVideoRenderer(videoRenderer)
  }

  bootup(): void {
    this.cpu.bootup()
  }

  run(): void {
    this.runFrame()

    requestAnimationFrame(() => this.run())
  }

  runFrame(): void {
    for (let i = 0; i < Nes.CPU_CYCLES_PER_FRAME; i++) {
      this.runCycle()
    }
  }

  runScanline(): void {
    for (let i = 0; i < Nes.CPU_CYCLES_PER_SCANLINE; i++) {
      this.runCycle()
    }
  }

  runStep(): void {
    do {
      this.runCycle()
    } while (this.cpu.isStall)
  }

  runCycle(): void {
    this.cpu.runCycle()
    this.ppu.runCycle()
    this.ppu.runCycle()
    this.ppu.runCycle()
  }
}
