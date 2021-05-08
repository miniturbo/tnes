import { InjectionKey, Ref, ref } from 'vue'

export const NesCanvasScale = {
  x1: 'x1',
  x2: 'x2',
} as const

export type NesCanvasScale = typeof NesCanvasScale[keyof typeof NesCanvasScale]

type NesCanvasType = {
  canvasScale: Ref<NesCanvasScale>
  isCanvasRecording: Ref<boolean>
  setCanvas: (value: HTMLCanvasElement) => void
  setCanvasScale: (value: NesCanvasScale) => void
  recordCanvas: () => void
}

export const useNesCanvas = (): NesCanvasType => {
  const canvas = ref<HTMLCanvasElement | null>(null)
  const canvasScale = ref<NesCanvasScale>(NesCanvasScale.x2)
  const isCanvasRecording = ref<boolean>(false)

  const setCanvas = (value: HTMLCanvasElement) => {
    canvas.value = value
  }

  const setCanvasScale = (value: NesCanvasScale) => {
    canvasScale.value = value
  }

  let recorder: MediaRecorder

  const recordCanvas = () => {
    if (!canvas.value) return

    if (!isCanvasRecording.value) {
      const stream = canvas.value.captureStream()
      const chunks: Blob[] = []

      recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType })
        if (blob.size > 0) {
          window.open(window.URL.createObjectURL(blob))
        }
      }
      recorder.start(1000)
    } else {
      recorder.stop()
    }

    isCanvasRecording.value = !isCanvasRecording.value
  }

  return {
    canvasScale,
    isCanvasRecording,
    setCanvas,
    setCanvasScale,
    recordCanvas,
  }
}

export const NesCanvasKey: InjectionKey<NesCanvasType> = Symbol('NesCanvas')
