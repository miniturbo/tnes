export default class Sprite {
  static readonly WIDTH: number = 8
  static readonly HEIGHT: number = 8
  static readonly BYTE_SIZE: number = 16

  readonly data: number[][]

  constructor(private view: Uint8Array) {
    this.data = this.buildData()
  }

  private buildData(): number[][] {
    const data = Array.from({ length: 8 }, () => new Array<number>(8).fill(0))

    for (let m = 0; m < Sprite.BYTE_SIZE; m++) {
      for (let n = 0; n < 8; n++) {
        if (this.view[m] & (0b10000000 >> n)) {
          data[m % 8][n] += 0b1 << (m / 8)
        }
      }
    }

    return data
  }
}
