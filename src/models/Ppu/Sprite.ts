export class Sprite {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly pixel: Uint16,
    readonly isBehind: boolean,
    readonly isZero: boolean
  ) {}
}
