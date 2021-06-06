import { Cpu } from '@/models/Cpu'
import { Ppu } from '@/models/Ppu'

export class DmaController {
  cpu: Cpu | null = null
  ppu: Ppu | null = null

  write(data: Uint8): void {
    if (!this.cpu || !this.ppu) return

    const sources = new Uint8Array(0x100)
    for (let i = 0x00; i < sources.length; i++) {
      sources[i] = this.cpu.bus.read((data << 8) + i)
    }

    this.ppu.copyOam(sources)

    this.cpu.stall(512)
  }
}
