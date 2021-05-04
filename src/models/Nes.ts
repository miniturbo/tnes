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
  private workRam = new Ram(2048)
  private videoRam = new Ram(2048)
  private paletteRam = new Ram(32)
  private requestId: number | null = null
  private cpuStallCycle: NesCycle = 0
  private fpsTimestamp = 0
  private fpsFrame = 0

  constructor() {
    super()

    const interruptController = new InterruptController()

    this.controller1 = new Controller()
    this.controller2 = new Controller()

    this.ppuBus = new PpuBus(this.videoRam, this.paletteRam)
    this.ppu = new Ppu(this.ppuBus, interruptController)

    this.cpuBus = new CpuBus(this.workRam, this.ppu, this.controller1, this.controller2)
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

  get isPaused(): boolean {
    return this.state === NesState.Paused
  }

  set rom(rom: Rom) {
    this.cpuBus.rom = rom
    this.ppuBus.rom = rom
  }

  set videoRenderer(videoRenderer: VideoRenderer) {
    this.ppu.videoRenderer = videoRenderer
  }

  powerUp(): void {
    this.cpu.powerUp()
    this.changeState(NesState.Running)
    this.run()
  }

  reset(): void {
    this.cpu.reset()
    this.workRam.reset()
    this.videoRam.reset()
    this.paletteRam.reset()
  }

  run(): void {
    this.runFrame()

    this.requestId = requestAnimationFrame(() => this.run())
  }

  runFrame(): void {
    do {
      this.runCycle()
    } while (this.ppu.scanline > 0 || this.ppu.cycle > 0)

    this.measureFps()
    this.dispatchEvent(new CustomEvent('frame'))
  }

  pause(): void {
    switch (this.state) {
      case NesState.Running: {
        this.changeState(NesState.Paused)

        if (this.requestId) {
          cancelAnimationFrame(this.requestId)
        }

        break
      }
      case NesState.Paused: {
        this.changeState(NesState.Running)
        this.run()
        break
      }
    }
  }

  private runCycle(): void {
    if (this.cpuStallCycle === 0) {
      this.cpu.runCycle()
      this.cpuStallCycle = 3
    }

    this.ppu.runCycle()

    this.cpuStallCycle--
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
