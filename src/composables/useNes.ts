import { InjectionKey } from 'vue'
import { Nes } from '@/models/Nes'
import { ControllerButton } from '@/types'

const CodeMap: { [key: string]: ControllerButton } = {
  Enter: ControllerButton.Start,
  Space: ControllerButton.Select,
  ArrowLeft: ControllerButton.Left,
  ArrowUp: ControllerButton.Up,
  ArrowRight: ControllerButton.Right,
  ArrowDown: ControllerButton.Down,
  KeyX: ControllerButton.A,
  KeyZ: ControllerButton.B,
} as const

const nes = new Nes()

window.nes = nes

document.addEventListener('keydown', (event) => {
  if (!CodeMap[event.code]) return
  nes.controller1.pressButton(CodeMap[event.code])
})

document.addEventListener('keyup', (event) => {
  if (!CodeMap[event.code]) return
  nes.controller1.releaseButton(CodeMap[event.code])
})

type NesType = {
  nes: Nes
}

export const useNes = (): NesType => {
  return { nes }
}

export const NesKey: InjectionKey<NesType> = Symbol('Nes')
