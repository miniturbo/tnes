<template>
  <div class="nes-canvas">
    <canvas ref="canvas" :class="['canvas', `is-${canvasScale}`]" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { injectStrict } from '/@/utils'
import { NesKey } from '/@/composables/useNes'
import { NesCanvasKey } from '/@/composables/useNesCanvas'
import { CanvasRenderer } from '/@/models/CanvasRenderer'

const { nes } = injectStrict(NesKey)
const { canvasScale, setCanvas } = injectStrict(NesCanvasKey)

const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!canvas.value) return

  nes.videoRenderer = new CanvasRenderer(canvas.value)

  setCanvas(canvas.value)
})
</script>

<style scoped>
.canvas {
  display: block;
  margin-bottom: 0.75rem;
  background-color: #f5f5f5;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.canvas.is-x1 {
  width: 256px;
  height: 240px;
}

.canvas.is-x2 {
  width: 512px;
  height: 480px;
}
</style>
