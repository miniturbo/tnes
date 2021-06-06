import { EventEmitter } from 'events'
import { Apu } from '@/models/Apu'
import { Controller } from '@/models/Controller'
import { Cpu } from '@/models/Cpu'
import { DmaController } from '@/models/DmaController'
import { InterruptController } from '@/models/InterruptController'
import { Ppu } from '@/models/Ppu'
import { Rom } from '@/models/Rom'
import { NesCycle, NesState, VideoRenderer } from '@/types'

export class Nes extends EventEmitter {
  readonly cpu = new Cpu()
  readonly ppu = new Ppu()
  readonly apu = new Apu()
  readonly controller1 = new Controller()
  readonly controller2 = new Controller()

  private dmaController = new DmaController()
  private interruptController = new InterruptController()

  private _state: NesState = NesState.PoweredOff
  private _fps = 0
  private requestId: number | null = null
  private fpsTimestamp = 0
  private fpsFrame = 0
  private ppuSyncCycle: NesCycle = 0

  constructor() {
    super()

    this.cpu.bus.ppu = this.ppu
    this.cpu.bus.apu = this.apu
    this.cpu.bus.controller1 = this.controller1
    this.cpu.bus.controller2 = this.controller2
    this.cpu.bus.dmaController = this.dmaController
    this.ppu.interruptController = this.interruptController
    this.dmaController.cpu = this.cpu
    this.dmaController.ppu = this.ppu
    this.interruptController.cpu = this.cpu
  }

  get state(): NesState {
    return this._state
  }

  get fps(): number {
    return this._fps
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
    this._state = NesState.PoweredOff
  }

  reset(): void {
    this._fps = 0
    this.fpsTimestamp = 0
    this.fpsFrame = 0
    this.ppuSyncCycle = 0

    this.cpu.reset()
    this.ppu.reset()
  }

  loadRom(buffer: ArrayBuffer): void {
    const rom = Rom.load(buffer)
    this.cpu.bus.rom = rom
    this.ppu.bus.rom = rom
  }

  run(): void {
    this._state = NesState.Running

    this.runFrame()
    this.measureFps()

    this.requestId = requestAnimationFrame(() => this.run())
  }

  runFrame(): void {
    do {
      this.runCycle()
    } while (this.ppu.scanline > 0 || this.ppu.cycle > 0)

    this.emit('frame')
  }

  runScanline(): void {
    const prevScanline = this.ppu.scanline

    do {
      this.runCycle()
    } while (!(this.ppu.scanline !== prevScanline && this.ppu.cycle === 0))

    this.emit('step')
  }

  runStep(): void {
    do {
      this.runCycle()
    } while (this.ppuSyncCycle > 0 || this.cpu.isStall)

    this.emit('step')
  }

  stop(): void {
    if (this.requestId) cancelAnimationFrame(this.requestId)
    this._state = NesState.Stopped
  }

  private runCycle(): void {
    if (this.ppuSyncCycle === 0) {
      this.cpu.runCycle()
      this.ppuSyncCycle = 3
    }

    this.ppu.runCycle()

    this.ppuSyncCycle--
  }

  private measureFps(): void {
    if (this.fpsFrame < 60) {
      this.fpsFrame++
      return
    }

    const timestamp = performance.now()

    if (this.fpsTimestamp > 0) {
      this._fps = Math.round(((1000 * 60) / (timestamp - this.fpsTimestamp)) * 100) / 100
      this.emit('fps')
    }

    this.fpsTimestamp = timestamp
    this.fpsFrame = 0
  }
}
