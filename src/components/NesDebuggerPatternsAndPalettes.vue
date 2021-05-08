<template>
  <div class="nes-debugger-patterns-and-palettes">
    <canvas ref="canvas" class="canvas" />
  </div>
</template>

<script setup lang="ts">
import { onActivated, onDeactivated, onMounted, ref } from 'vue'
import { bitOf, injectStrict } from '/@/utils'
import { NesKey } from '/@/composables/useNes'

const { nes } = injectStrict(NesKey)

const canvas = ref<HTMLCanvasElement | null>(null)
const context = ref<CanvasRenderingContext2D | null>(null)

const renderPatterns = (context: CanvasRenderingContext2D): void => {
  const imageData = context.createImageData(context.canvas.width, context.canvas.height)

  // left table
  for (let m = 0; m < 16; m++) {
    for (let n = 0; n < 16; n++) {
      renderPattern(imageData, m, n, 0, 0)
    }
  }

  // right table
  for (let m = 0; m < 16; m++) {
    for (let n = 0; n < 16; n++) {
      renderPattern(imageData, m, n, 256, 128)
    }
  }

  context.putImageData(imageData, 0, 0)
}

const renderPattern = (
  imageData: ImageData,
  coarseX: number,
  coarseY: number,
  nameTableOffset: number,
  imageDataBaseX: number
) => {
  const attributeTableLow = 0x00
  const attributeTableHigh = 0x00

  for (let fineY = 0; fineY < 8; fineY++) {
    const nameTable = nameTableOffset + coarseY * 16 + coarseX
    const patternTableLow = nes.ppuBus.read(nameTable * 16 + fineY)
    const patternTableHigh = nes.ppuBus.read(nameTable * 16 + fineY + 8)

    for (let fineX = 0; fineX < 8; fineX++) {
      const address =
        0x3f00 |
        (bitOf(attributeTableHigh, 7 - fineX) << 3) |
        (bitOf(attributeTableLow, 7 - fineX) << 2) |
        (bitOf(patternTableHigh, 7 - fineX) << 1) |
        bitOf(patternTableLow, 7 - fineX)
      const palette = nes.ppu.palettes.find(nes.ppuBus.read(address))
      const baseIndex = ((coarseY * 8 + fineY) * imageData.width + (imageDataBaseX + coarseX * 8 + fineX)) * 4

      imageData.data[baseIndex + 0] = palette[0] // Red
      imageData.data[baseIndex + 1] = palette[1] // Green
      imageData.data[baseIndex + 2] = palette[2] // Blue
      imageData.data[baseIndex + 3] = 0xff // Alpha
    }
  }
}

const renderPalettes = (context: CanvasRenderingContext2D): void => {
  for (let i = 0x00; i < 0x10; i++) {
    const backgroundPalette = nes.ppu.palettes.find(nes.ppuBus.read(0x3f00 + i))
    context.fillStyle = `rgba(${backgroundPalette[0]}, ${backgroundPalette[1]}, ${backgroundPalette[2]}, 1)`
    context.fillRect(i * 16, 128, 16, 16)

    const spritePalette = nes.ppu.palettes.find(nes.ppuBus.read(0x3f10 + i))
    context.fillStyle = `rgba(${spritePalette[0]}, ${spritePalette[1]}, ${spritePalette[2]}, 1)`
    context.fillRect(i * 16, 144, 16, 16)
  }
}

const render = () => {
  if (!context.value) return
  renderPatterns(context.value)
  renderPalettes(context.value)
}

const handleFrameOrStep = () => {
  render()
}

onMounted(() => {
  if (!canvas.value) return
  canvas.value.width = 256
  canvas.value.height = 160
  context.value = canvas.value.getContext('2d')
})

onActivated(() => {
  render()

  nes.addEventListener('frame', handleFrameOrStep)
  nes.addEventListener('step', handleFrameOrStep)
})

onDeactivated(() => {
  nes.removeEventListener('frame', handleFrameOrStep)
  nes.removeEventListener('step', handleFrameOrStep)
})
</script>

<style scoped>
.canvas {
  display: block;
  width: 512px;
  height: 320px;
  background-color: #f5f5f5;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
