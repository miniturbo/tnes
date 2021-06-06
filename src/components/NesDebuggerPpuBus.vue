<template>
  <div ref="container" class="nes-debugger-ppu-bus" @wheel="handleWheel">
    <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth has-text-centered">
      <thead>
        <tr ref="baseRow">
          <th>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
          <th>+0</th>
          <th>+1</th>
          <th>+2</th>
          <th>+3</th>
          <th>+4</th>
          <th>+5</th>
          <th>+6</th>
          <th>+7</th>
          <th>+8</th>
          <th>+9</th>
          <th>+a</th>
          <th>+b</th>
          <th>+c</th>
          <th>+d</th>
          <th>+e</th>
          <th>+f</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, m) in rows" :key="m">
          <template v-for="(data, n) in row" :key="n">
            <th v-if="n === 0">{{ toHex(data, 4) }}</th>
            <td v-else :class="{ 'is-zero': data === 0 }">{{ toHex(data, 2, '') }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref } from 'vue'
import { NesKey } from '@/composables/useNes'
import { useVirtualList } from '@/composables/useVirtualList'
import { injectStrict, toHex } from '@/utils'

type Row = (Uint8 | Uint16)[]

const { nes } = injectStrict(NesKey)
const { currentRow, maxRowsSize, setContainer, setBaseRow, setCurrentRow } = useVirtualList()

const container = ref<HTMLDivElement | null>(null)
const baseRow = ref<HTMLTrackElement | null>(null)
const computedTimestamp = ref(performance.now())
const rows = computed(() => {
  // NOTE: re-compute at any time
  computedTimestamp.value

  const rows: Row[] = []

  for (let i = currentRow.value; i < currentRow.value + maxRowsSize.value; i++) {
    const row = [i * 16]

    for (let j = 0; j < 16; j++) {
      row.push(nes.ppu.bus.read(i * 16 + j))
    }

    rows.push(row)
  }

  return rows
})

const updateComputedTimestamp = () => {
  computedTimestamp.value = performance.now()
}

const handleWheel = (event: WheelEvent) => {
  setCurrentRow(currentRow.value + Math.floor(event.deltaY * 0.5), 0x400 - maxRowsSize.value)
}

const handleNesFrameOrStep = () => {
  updateComputedTimestamp()
}

onMounted(() => {
  if (!container.value || !baseRow.value) return
  setContainer(container.value)
  setBaseRow(baseRow.value)
})

onActivated(() => {
  updateComputedTimestamp()

  nes.on('frame', handleNesFrameOrStep)
  nes.on('step', handleNesFrameOrStep)
})

onDeactivated(() => {
  nes.off('frame', handleNesFrameOrStep)
  nes.off('step', handleNesFrameOrStep)
})
</script>

<style scoped>
.nes-debugger-ppu-bus {
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.is-zero {
  color: #dbdbdb;
}
</style>
