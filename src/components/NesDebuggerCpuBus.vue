<template>
  <div ref="container" class="nes-debugger-cpu-bus" @wheel="handleWheel">
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
import { injectStrict, toHex } from '/@/utils'
import { NesKey } from '/@/composables/useNes'
import { Nes } from '/@/models/Nes'

type Row = (Uint8 | Uint16)[]

const { nes } = injectStrict(NesKey)

const container = ref<HTMLDivElement | null>(null)
const baseRow = ref<HTMLTrackElement | null>(null)
const containerHeight = ref(0)
const baseRowHeight = ref(0)
const maxRows = computed(() => Math.floor((containerHeight.value - baseRowHeight.value) / baseRowHeight.value))
const currentRow = ref(0)
const rows = ref<Row[]>([])

const handleWheel = (event: WheelEvent) => {
  let next = currentRow.value + Math.floor(event.deltaY * 0.5)

  if (next < 0x000) {
    next = 0x000
  } else if (next > 0x1000 - maxRows.value) {
    next = 0x1000 - maxRows.value
  }

  currentRow.value = next
}

const handleFrame = (event: Event) => {
  if (!(event.currentTarget instanceof Nes)) return

  const newRows: Row[] = []

  for (let i = currentRow.value; i < currentRow.value + maxRows.value; i++) {
    const row = [i * 16]

    for (let j = 0; j < 16; j++) {
      row.push(event.currentTarget.cpuBus.read(i * 16 + j))
    }

    newRows.push(row)
  }

  rows.value = newRows
}

onMounted(() => {
  if (!container.value || !baseRow.value) return
  containerHeight.value = container.value.clientHeight
  baseRowHeight.value = baseRow.value.clientHeight
})

onActivated(() => {
  nes.addEventListener('frame', handleFrame)
})

onDeactivated(() => {
  nes.removeEventListener('frame', handleFrame)
})
</script>

<style scoped>
.nes-debugger-cpu-bus {
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.is-zero {
  color: #dbdbdb;
}
</style>
