import React, { useCallback, useEffect } from 'react'
import { ControllerButton } from '../types/controller'
import styles from '/@/assets/stylesheets/components/NesContainer.module.css'
import { NesCanvas } from '/@/components/NesCanvas'
import { NesConsole } from '/@/components/NesConsole'
import { Nes } from '/@/models/Nes'

export const NesContainer: React.FC = () => {
  const nes = new Nes()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'Enter': {
        nes.controller1.pressButton(ControllerButton.Start)
        break
      }
      case 'Space': {
        nes.controller1.pressButton(ControllerButton.Select)
        break
      }
      case 'ArrowLeft': {
        nes.controller1.pressButton(ControllerButton.Left)
        break
      }
      case 'ArrowUp': {
        nes.controller1.pressButton(ControllerButton.Up)
        break
      }
      case 'ArrowRight': {
        nes.controller1.pressButton(ControllerButton.Right)
        break
      }
      case 'ArrowDown': {
        nes.controller1.pressButton(ControllerButton.Down)
        break
      }
      case 'KeyX': {
        nes.controller1.pressButton(ControllerButton.A)
        break
      }
      case 'KeyZ': {
        nes.controller1.pressButton(ControllerButton.B)
        break
      }
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'Enter': {
        nes.controller1.releaseButton(ControllerButton.Start)
        break
      }
      case 'Space': {
        nes.controller1.releaseButton(ControllerButton.Select)
        break
      }
      case 'ArrowLeft': {
        nes.controller1.releaseButton(ControllerButton.Left)
        break
      }
      case 'ArrowUp': {
        nes.controller1.releaseButton(ControllerButton.Up)
        break
      }
      case 'ArrowRight': {
        nes.controller1.releaseButton(ControllerButton.Right)
        break
      }
      case 'ArrowDown': {
        nes.controller1.releaseButton(ControllerButton.Down)
        break
      }
      case 'KeyX': {
        nes.controller1.releaseButton(ControllerButton.A)
        break
      }
      case 'KeyZ': {
        nes.controller1.releaseButton(ControllerButton.B)
        break
      }
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
  }, [])

  return (
    <div className={styles.nesContainer}>
      <NesCanvas nes={nes} />
      <NesConsole nes={nes} />
    </div>
  )
}
