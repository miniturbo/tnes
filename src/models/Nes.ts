import { CpuCycle, Logger, NesState, VideoRenderer } from '/@/types'
import { Controller } from '/@/models/Controller'
import { Cpu, CpuBus } from '/@/models/Cpu'
import { Ppu, PpuBus } from '/@/models/Ppu'
import { Ram } from '/@/models/Ram'
import { Rom } from '/@/models/Rom'
import { InterruptController } from './InterruptController'

export class Nes {
  static readonly CPU_CYCLES_PER_FRAME: CpuCycle = Math.ceil((341 * 262) / 3)
  static readonly CPU_CYCLES_PER_SCANLINE: CpuCycle = Math.ceil(341 / 3)

  readonly controller1: Controller
  readonly controller2: Controller

  private state: NesState = NesState.powerOff
  private cpu: Cpu
  private cpuBus: CpuBus
  private ppu: Ppu
  private ppuBus: PpuBus

  constructor() {
    this.controller1 = new Controller()
    this.controller2 = new Controller()

    const videoRam = new Ram(2048)
    const paletteRam = new Ram(32)
    const workRam = new Ram(2048)
    const interruptController = new InterruptController()

    this.ppuBus = new PpuBus(videoRam, paletteRam)
    this.ppu = new Ppu(this.ppuBus, interruptController)

    this.cpuBus = new CpuBus(workRam, this.ppu, this.controller1, this.controller2)
    this.cpu = new Cpu(this.cpuBus, interruptController)
  }

  get isRun(): boolean {
    return this.state === NesState.run
  }

  set debug(debug: boolean) {
    this.cpu.debug = debug
    this.cpuBus.debug = debug
    this.ppu.debug = debug
    this.ppuBus.debug = debug
  }

  set logger(logger: Logger) {
    this.cpu.logger = logger
    this.cpuBus.logger = logger
    this.ppu.logger = logger
    this.ppuBus.logger = logger
  }

  set rom(rom: Rom) {
    this.cpuBus.rom = rom
    this.ppuBus.rom = rom
  }

  set videoRenderer(videoRenderer: VideoRenderer) {
    this.ppu.videoRenderer = videoRenderer
  }

  bootup(): void {
    this.state = NesState.run
    this.cpu.bootup()
  }

  run(): void {
    if (!this.isRun) return

    for (let i = 0; i < Nes.CPU_CYCLES_PER_FRAME; i++) {
      this.runCycle()
    }

    requestAnimationFrame(() => this.run())
  }

  runFrame(): void {
    if (this.isRun) return

    for (let i = 0; i < Nes.CPU_CYCLES_PER_FRAME; i++) {
      this.runCycle()
    }
  }

  runScanline(): void {
    if (this.isRun) return

    for (let i = 0; i < Nes.CPU_CYCLES_PER_SCANLINE; i++) {
      this.runCycle()
    }
  }

  runStep(): void {
    if (this.isRun) return

    do {
      this.runCycle()
    } while (this.cpu.isStall)
  }

  stop(): void {
    this.state = NesState.stop
  }

  resume(): void {
    this.state = NesState.run
    this.run()
  }

  private runCycle(): void {
    this.cpu.runCycle()
    this.ppu.runCycle()
    this.ppu.runCycle()
    this.ppu.runCycle()
  }
}
