import React, { useEffect, useRef } from 'react'
import styles from '/@/assets/stylesheets/components/NesCanvas.module.css'
import CanvasRenderer from '/@/models/CanvasRenderer'
import Nes from '/@/models/Nes'

type Props = {
  nes: Nes
}

const NesCanvas: React.FC<Props> = ({ nes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const canvasRenderer = new CanvasRenderer(canvasRef.current)
      nes.setVideoRenderer(canvasRenderer)
    }
  })

  return (
    <div className={styles.nesCanvas}>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default NesCanvas
