<template>
  <div class="nes-buttons field is-grouped">
    <div class="control">
      <div class="file is-small">
        <label class="file-label">
          <input class="file-input" type="file" accept=".nes" @change="handleRomChange" />
          <span class="file-cta">
            <span class="file-label">
              <span class="file-label-truncated">{{ romLabel }}</span>
            </span>
          </span>
        </label>
      </div>
    </div>
    <div class="control">
      <div class="buttons are-small has-addons">
        <button class="button" :title="isStopped ? 'Run' : 'Stop'" @click="handleRunOrStopClick">
          <span class="icon">
            <font-awesome-icon v-if="isStopped" icon="play" />
            <font-awesome-icon v-else icon="stop" />
          </span>
        </button>
        <button
          class="button"
          title="Run Frame"
          :disabled="nesStatus.isPoweredOff || !isStopped"
          @click="handleRunFrameClick"
        >
          <span class="icon">
            <font-awesome-icon icon="fast-forward" />
          </span>
        </button>
        <button
          class="button"
          title="Run Scanline"
          :disabled="nesStatus.isPoweredOff || !isStopped"
          @click="handleRunScanlineClick"
        >
          <span class="icon">
            <font-awesome-icon icon="step-forward" />
          </span>
        </button>
        <button
          class="button"
          title="Run Step"
          :disabled="nesStatus.isPoweredOff || !isStopped"
          @click="handleRunStepClick"
        >
          <span class="icon">
            <font-awesome-icon icon="chevron-right" />
          </span>
        </button>
        <button
          :class="['button', { 'is-success': !nesStatus.isPoweredOff }]"
          title="Power Up/Down"
          @click="handlePowerUpOrDownClick"
        >
          <span class="icon">
            <font-awesome-icon icon="power-off" />
          </span>
        </button>
        <button class="button" title="Reset" @click="handleResetClick">
          <span class="icon">
            <font-awesome-icon icon="redo-alt" />
          </span>
        </button>
        <button
          :class="['button', { 'is-danger': isCanvasRecording }]"
          :disabled="nesStatus.isPoweredOff"
          title="Record"
          @click="handleRecordClick"
        >
          <span class="icon">
            <font-awesome-icon icon="video" />
          </span>
        </button>
        <button
          :class="['button', { 'is-success': debug }]"
          :disabled="nesStatus.isPoweredOff"
          title="Debug"
          @click="handleDebugClick"
        >
          <span class="icon">
            <font-awesome-icon icon="tools" />
          </span>
        </button>
      </div>
    </div>
    <div class="control">
      <span class="fps">FPS:{{ nesFps }}</span>
    </div>
    <div class="control">
      <div class="select is-small">
        <select @change="handleCanvasScaleChange">
          <option
            v-for="(scale, label) in NesCanvasScale"
            :key="scale"
            :value="scale"
            :selected="scale === canvasScale"
          >
            {{ label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { injectStrict } from '/@/utils'
import { NesKey } from '/@/composables/useNes'
import { NesCanvasKey, NesCanvasScale } from '/@/composables/useNesCanvas'
import { NesDebugKey } from '/@/composables/useNesDebug'
import { Nes } from '/@/models/Nes'
import { Rom } from '/@/models/Rom'

const { nes } = injectStrict(NesKey)
const { debug, setDebug } = injectStrict(NesDebugKey)
const { canvasScale, isCanvasRecording, recordCanvas, setCanvasScale } = injectStrict(NesCanvasKey)

const isStopped = ref(false)
const nesStatus = reactive({
  isPoweredOff: nes.isPoweredOff,
  isRunning: nes.isRunning,
  isStopped: nes.isStopped,
})
const nesFps = ref('00.00')
const romLabel = ref('Choose a ROM…')

const handleRomChange = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  if (!event.currentTarget.files || event.currentTarget.files.length === 0) return

  event.currentTarget.blur()

  const file = event.currentTarget.files[0]
  const reader = new FileReader()
  reader.addEventListener('load', () => {
    if (!(reader.result instanceof ArrayBuffer)) return

    nes.rom = Rom.load(reader.result)
    nes.powerDown()
    nes.powerUp(!isStopped.value)
  })
  reader.readAsArrayBuffer(file)

  romLabel.value = file.name
}

const handleRunOrStopClick = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return

  event.currentTarget.blur()

  if (isStopped.value) {
    isStopped.value = false
    nes.run()
  } else {
    isStopped.value = true
    nes.stop()
  }
}

const handleRunFrameClick = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return

  event.currentTarget.blur()

  nes.runFrame()
}

const handleRunScanlineClick = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return

  event.currentTarget.blur()

  nes.runScanline()
}

const handleRunStepClick = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return

  event.currentTarget.blur()

  nes.runStep()
}

const handlePowerUpOrDownClick = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return

  event.currentTarget.blur()

  if (nes.isPoweredOff) {
    nes.powerUp(!isStopped.value)
  } else {
    nes.powerDown()
  }
}

const handleResetClick = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return

  event.currentTarget.blur()

  nes.reset()
}

const handleRecordClick = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return

  event.currentTarget.blur()

  recordCanvas()
}

const handleDebugClick = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return

  event.currentTarget.blur()

  setDebug(!debug.value)
}

const handleCanvasScaleChange = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLSelectElement)) return

  event.currentTarget.blur()

  setCanvasScale(event.currentTarget.value as NesCanvasScale)
}

const handleNesStateChange = (event: Event) => {
  if (!(event.currentTarget instanceof Nes)) return

  nesStatus.isPoweredOff = event.currentTarget.isPoweredOff
  nesStatus.isRunning = event.currentTarget.isRunning
  nesStatus.isStopped = event.currentTarget.isStopped
}

const handleNesFps = (event: Event) => {
  if (!(event.currentTarget instanceof Nes)) return

  nesFps.value = event.currentTarget.fps.toFixed(2).padStart(5, '0')
}

onMounted(() => {
  nes.addEventListener('statechange', handleNesStateChange)
  nes.addEventListener('fps', handleNesFps)
})

onUnmounted(() => {
  nes.removeEventListener('statechange', handleNesStateChange)
  nes.removeEventListener('fps', handleNesFps)
})
</script>

<style scoped>
.file-cta {
  width: 120px;
}

.file-label-truncated {
  overflow: hidden;
  text-overflow: ellipsis;
}

.buttons .button {
  margin-bottom: 0;
}

.fps {
  display: inline-block;
  padding: 0.5em 0;
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
