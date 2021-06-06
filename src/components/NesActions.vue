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
        <button class="button" title="Run Frame" :disabled="isPoweredOff || !isStopped" @click="handleRunFrameClick">
          <span class="icon">
            <font-awesome-icon icon="fast-forward" />
          </span>
        </button>
        <button
          class="button"
          title="Run Scanline"
          :disabled="isPoweredOff || !isStopped"
          @click="handleRunScanlineClick"
        >
          <span class="icon">
            <font-awesome-icon icon="step-forward" />
          </span>
        </button>
        <button class="button" title="Run Step" :disabled="isPoweredOff || !isStopped" @click="handleRunStepClick">
          <span class="icon">
            <font-awesome-icon icon="chevron-right" />
          </span>
        </button>
        <button
          :class="['button', { 'is-success': !isPoweredOff }]"
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
          :disabled="isPoweredOff"
          title="Record"
          @click="handleRecordClick"
        >
          <span class="icon">
            <font-awesome-icon icon="video" />
          </span>
        </button>
        <button :class="['button', { 'is-success': debug }]" title="Debug" @click="handleDebugClick">
          <span class="icon">
            <font-awesome-icon icon="tools" />
          </span>
        </button>
      </div>
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
    <div class="control">
      <span class="fps">FPS:{{ nesFps }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { NesKey } from '@/composables/useNes'
import { NesCanvasKey, NesCanvasScale } from '@/composables/useNesCanvas'
import { NesDebugKey } from '@/composables/useNesDebug'
import { buildEventListener, injectStrict } from '@/utils'

const { nes } = injectStrict(NesKey)
const { debug, setDebug } = injectStrict(NesDebugKey)
const { canvasScale, isCanvasRecording, recordCanvas, setCanvasScale } = injectStrict(NesCanvasKey)

const romLabel = ref('Choose a ROM…')
const isPoweredOff = ref(true)
const isStopped = ref(false)
const nesFps = ref('00.00')

const handleRomChange = buildEventListener<HTMLInputElement>((event) => {
  if (!event.currentTarget.files || event.currentTarget.files.length === 0) return

  event.currentTarget.blur()

  const file = event.currentTarget.files[0]

  const reader = new FileReader()
  reader.addEventListener('load', () => {
    if (!(reader.result instanceof ArrayBuffer)) return

    nes.powerDown()
    nes.loadRom(reader.result)
    nes.powerUp(!isStopped.value)

    isPoweredOff.value = false
  })
  reader.readAsArrayBuffer(file)

  romLabel.value = file.name
})

const handleRunOrStopClick = buildEventListener<HTMLButtonElement>((event) => {
  event.currentTarget.blur()

  if (isStopped.value) {
    nes.run()
  } else {
    nes.stop()
  }

  isStopped.value = !isStopped.value
})

const handleRunFrameClick = buildEventListener<HTMLButtonElement>((event) => {
  event.currentTarget.blur()
  nes.runFrame()
})

const handleRunScanlineClick = buildEventListener<HTMLButtonElement>((event) => {
  event.currentTarget.blur()
  nes.runScanline()
})

const handleRunStepClick = buildEventListener<HTMLButtonElement>((event) => {
  event.currentTarget.blur()
  nes.runStep()
})

const handlePowerUpOrDownClick = buildEventListener<HTMLButtonElement>((event) => {
  event.currentTarget.blur()

  if (isPoweredOff.value) {
    nes.powerUp(!isStopped.value)
  } else {
    nes.powerDown()
  }

  isPoweredOff.value = !isPoweredOff.value
})

const handleResetClick = buildEventListener<HTMLButtonElement>((event) => {
  event.currentTarget.blur()
  nes.reset()
})

const handleRecordClick = buildEventListener<HTMLButtonElement>((event) => {
  event.currentTarget.blur()
  recordCanvas()
})

const handleDebugClick = buildEventListener<HTMLButtonElement>((event) => {
  event.currentTarget.blur()
  setDebug(!debug.value)
})

const handleCanvasScaleChange = buildEventListener<HTMLSelectElement>((event) => {
  event.currentTarget.blur()
  setCanvasScale(event.currentTarget.value as NesCanvasScale)
})

const handleNesFps = () => {
  nesFps.value = nes.fps.toFixed(2).padStart(5, '0')
}

onMounted(() => {
  nes.on('fps', handleNesFps)
})

onUnmounted(() => {
  nes.off('fps', handleNesFps)
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
