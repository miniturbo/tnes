import React, { useEffect, useRef, useState } from 'react'
import styles from '/@/assets/stylesheets/components/NesCanvas.module.css'
import { CanvasRenderer } from '/@/models/CanvasRenderer'
import { Nes } from '/@/models/Nes'

type Props = {
  nes: Nes
}

export const NesCanvas: React.FC<Props> = ({ nes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isRecording, setRecording] = useState(false)

  useEffect(() => {
    if (canvasRef.current) {
      const canvasRenderer = new CanvasRenderer(canvasRef.current)
      nes.videoRenderer = canvasRenderer
    }
  })

  const handleRecord = () => {
    if (canvasRef.current) {
      const stream = canvasRef.current.captureStream()
      const chunks: Blob[] = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType })
        const blobUrl = window.URL.createObjectURL(blob)
        setBlobUrl(blobUrl)
      }
      recorder.start(1000)

      setMediaRecorder(recorder)
      setRecording(true)
    }
  }

  const handleStop = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setRecording(false)
    }
  }

  return (
    <div className={styles.nesCanvas}>
      <canvas className={styles.nesCanvasCanvas} ref={canvasRef}></canvas>
      <div className="buttons are-small has-addons">
        <button className="button" onClick={handleRecord} disabled={isRecording}>
          Rec
        </button>
        <button className="button" onClick={handleStop} disabled={!isRecording}>
          Stop
        </button>
        {blobUrl ? (
          <a className="button" href={blobUrl} target="_blank" rel="noreferrer">
            Download
          </a>
        ) : null}
      </div>
    </div>
  )
}
