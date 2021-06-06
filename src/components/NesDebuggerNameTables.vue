<template>
  <div class="nes-debugger-name-tables">
    <canvas ref="canvas" class="canvas" />
  </div>
</template>

<script setup lang="ts">
import { onActivated, onDeactivated, onMounted, ref } from 'vue'
import { NesKey } from '@/composables/useNes'
import { bitFlag, bitOf, injectStrict } from '@/utils'

const { nes } = injectStrict(NesKey)

const canvas = ref<HTMLCanvasElement | null>(null)
const context = ref<CanvasRenderingContext2D | null>(null)

const renderNametable = (
  imageData: ImageData,
  offsetAddress: number,
  imageDataBaseX: number,
  imageDataBaseY: number
): void => {
  for (let coarseX = 0; coarseX < 32; coarseX++) {
    for (let coarseY = 0; coarseY < 30; coarseY++) {
      const nameTable =
        nes.ppu.bus.read(0x2000 | offsetAddress | (coarseY << 5) | coarseX) +
        nes.ppu.registers.backgroundPatternTableAddres / 16

      const address = 0x23c0 | offsetAddress | ((coarseY & 0x1c) << 1) | ((coarseX & 0x1c) >> 2)
      const isBottom = (coarseY & 0x2) > 0
      const isRight = (coarseX & 0x2) > 0
      const position = ((isBottom ? 0x02 : 0x00) | (isRight ? 0x01 : 0x00)) << 0x01
      const data = (nes.ppu.bus.read(address) >> position) & 0x03
      const attributeTableLow = bitFlag(data, 0) ? 0xff : 0x00
      const attributeTableHigh = bitFlag(data, 1) ? 0xff : 0x00

      for (let fineY = 0; fineY < 8; fineY++) {
        const patternTableLow = nes.ppu.bus.read(nameTable * 16 + fineY)
        const patternTableHigh = nes.ppu.bus.read(nameTable * 16 + fineY + 8)

        for (let fineX = 0; fineX < 8; fineX++) {
          const address =
            0x3f00 |
            (bitOf(attributeTableHigh, 7 - fineX) << 3) |
            (bitOf(attributeTableLow, 7 - fineX) << 2) |
            (bitOf(patternTableHigh, 7 - fineX) << 1) |
            bitOf(patternTableLow, 7 - fineX)
          const palette = nes.ppu.palettes.find(nes.ppu.bus.read(address))
          const baseIndex =
            ((imageDataBaseY + coarseY * 8 + fineY) * imageData.width + (imageDataBaseX + coarseX * 8 + fineX)) * 4

          imageData.data[baseIndex + 0] = palette[0] // Red
          imageData.data[baseIndex + 1] = palette[1] // Green
          imageData.data[baseIndex + 2] = palette[2] // Blue
          imageData.data[baseIndex + 3] = 0xff // Alpha
        }
      }
    }
  }
}

const renderNameTables = (context: CanvasRenderingContext2D): void => {
  const imageData = context.createImageData(context.canvas.width, context.canvas.height)

  renderNametable(imageData, 0x0000, 0, 0)
  renderNametable(imageData, 0x0400, 256, 0)
  renderNametable(imageData, 0x0800, 0, 240)
  renderNametable(imageData, 0x0c00, 256, 240)

  context.putImageData(imageData, 0, 0)
}

const render = () => {
  if (!context.value) return
  renderNameTables(context.value)
}

const handleNesFrameOrStep = () => {
  render()
}

onMounted(() => {
  if (!canvas.value) return
  canvas.value.width = 512
  canvas.value.height = 480
  context.value = canvas.value.getContext('2d')
})

onActivated(() => {
  render()

  nes.on('frame', handleNesFrameOrStep)
  nes.on('step', handleNesFrameOrStep)
})

onDeactivated(() => {
  nes.off('frame', handleNesFrameOrStep)
  nes.off('step', handleNesFrameOrStep)
})
</script>

<style scoped>
.canvas {
  display: block;
  width: 512px;
  height: 480px;
  background-color: #f5f5f5;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
