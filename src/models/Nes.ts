import { NesCycle, NesState, VideoRenderer } from '/@/types'
import { Controller } from '/@/models/Controller'
import { Cpu, CpuBus } from '/@/models/Cpu'
import { Ppu, PpuBus } from '/@/models/Ppu'
import { Ram } from '/@/models/Ram'
import { Rom } from '/@/models/Rom'
import { InterruptController } from './InterruptController'

export class Nes extends EventTarget {
  readonly cpu: Cpu
  readonly cpuBus: CpuBus
  readonly ppu: Ppu
  readonly ppuBus: PpuBus
  readonly controller1: Controller
  readonly controller2: Controller

  private _state: NesState = NesState.PoweredOff
  private _fps = 0

  private requestId: number | null = null
  private fpsTimestamp = 0
  private fpsFrame = 0
  private ppuSyncCycle: NesCycle = 0

  constructor() {
    super()

    const interruptController = new InterruptController()
    const workRam = new Ram(2048)
    const videoRam = new Ram(2048)
    const paletteRam = new Ram(32)

    this.controller1 = new Controller()
    this.controller2 = new Controller()

    this.ppuBus = new PpuBus(videoRam, paletteRam)
    this.ppu = new Ppu(this.ppuBus, interruptController)

    this.cpuBus = new CpuBus(workRam, this.ppu, this.controller1, this.controller2)
    this.cpu = new Cpu(this.cpuBus, interruptController)
  }

  get state(): NesState {
    return this._state
  }

  get fps(): number {
    return this._fps
  }

  get isPoweredOff(): boolean {
    return this.state === NesState.PoweredOff
  }

  get isRunning(): boolean {
    return this.state === NesState.Running
  }

  get isStopped(): boolean {
    return this.state === NesState.Stopped
  }

  set rom(rom: Rom) {
    this.cpuBus.rom = rom
    this.ppuBus.rom = rom
  }

  set videoRenderer(videoRenderer: VideoRenderer) {
    this.ppu.videoRenderer = videoRenderer
  }

  powerUp(autorun = true): void {
    this.cpu.powerUp()
    this.ppu.powerUp()
    this.reset()

    if (autorun) {
      this.run()
    } else {
      this.stop()
    }
  }

  powerDown(): void {
    this.stop()
    this.changeState(NesState.PoweredOff)
  }

  reset(): void {
    this._fps = 0
    this.fpsTimestamp = 0
    this.fpsFrame = 0
    this.ppuSyncCycle = 0

    this.cpu.reset()
    this.ppu.reset()
  }

  run(): void {
    if (!this.isRunning) this.changeState(NesState.Running)

    this.runFrame()
    this.measureFps()

    this.requestId = requestAnimationFrame(() => this.run())
  }

  runFrame(): void {
    do {
      this.runCycle()
    } while (this.ppu.scanline > 0 || this.ppu.cycle > 0)

    this.dispatchEvent(new CustomEvent('frame'))
  }

  runScanline(): void {
    const prevScanline = this.ppu.scanline

    do {
      this.runCycle()
    } while (!(this.ppu.scanline !== prevScanline && this.ppu.cycle === 0))

    this.dispatchEvent(new CustomEvent('step'))
  }

  runStep(): void {
    do {
      this.runCycle()
    } while (this.ppuSyncCycle > 0 || this.cpu.isStall)

    this.dispatchEvent(new CustomEvent('step'))
  }

  stop(): void {
    if (this.requestId) cancelAnimationFrame(this.requestId)
    this.changeState(NesState.Stopped)
  }

  private runCycle(): void {
    if (this.ppuSyncCycle === 0) {
      this.cpu.runCycle()
      this.ppuSyncCycle = 3
    }

    this.ppu.runCycle()

    this.ppuSyncCycle--
  }

  private changeState(state: NesState): void {
    this._state = state
    this.dispatchEvent(new CustomEvent('statechange'))
  }

  private measureFps(): void {
    if (this.fpsFrame < 60) {
      this.fpsFrame++
      return
    }

    const timestamp = performance.now()

    if (this.fpsTimestamp > 0) {
      this._fps = Math.round(((1000 * 60) / (timestamp - this.fpsTimestamp)) * 100) / 100
      this.dispatchEvent(new CustomEvent('fps'))
    }

    this.fpsTimestamp = timestamp
    this.fpsFrame = 0
  }
}
