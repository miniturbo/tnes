import { Cpu } from '@/models/Cpu'

export class InterruptController {
  cpu: Cpu | null = null

  requestNmi(): void {
    this.cpu?.runNmi()
  }
}
