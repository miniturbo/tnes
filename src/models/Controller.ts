import { ControllerButton } from '/@/types/controller'

export class Controller {
  private data: Uint8 = 0x00
  private index = 0
  private isStrobe = false

  pressButton(button: ControllerButton): void {
    this.data |= button
  }

  releaseButton(button: ControllerButton): void {
    this.data &= ~button & 0xff
  }

  read(): Uint8 {
    if (this.isStrobe) {
      return this.data & ControllerButton.A ? 0x01 : 0x00
    } else {
      return this.data & (0x80 >> this.index++) ? 0x01 : 0x00
    }
  }

  write(data: Uint8): void {
    if (data & 0x01) {
      this.isStrobe = true
    } else {
      this.isStrobe = false
      this.index = 0
    }
  }
}
