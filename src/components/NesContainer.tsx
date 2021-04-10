import React from 'react'
import styles from '/@/assets/stylesheets/components/NesContainer.module.css'
import NesCanvas from '/@/components/NesCanvas'
import NesConsole from '/@/components/NesConsole'
import Nes from '/@/models/Nes'
import Rom from '/@/models/Rom'

const NesContainer: React.FC = () => {
  const nes = new Nes()

  Rom.load('../tmp/roms/hello_world.nes').then((rom: Rom) => nes.setRom(rom))

  return (
    <div className={styles.nesContainer}>
      <NesCanvas nes={nes} />
      <NesConsole nes={nes} />
    </div>
  )
}

export default NesContainer
