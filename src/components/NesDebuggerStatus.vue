<template>
  <div class="nes-debugger-status">
    <div class="content">
      <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth has-text-centered">
        <tr>
          <th :rowspan="2" class="is-vcentered">CPU</th>
          <th>PC</th>
          <th>SP</th>
          <th>A</th>
          <th>X</th>
          <th>Y</th>
          <th>P</th>
        </tr>
        <tr>
          <td>{{ toHex(cpuStatus.programCounter, 4) }}</td>
          <td>{{ toHex(cpuStatus.stackPointer, 2) }}</td>
          <td>{{ toHex(cpuStatus.accumulator, 2) }}</td>
          <td>{{ toHex(cpuStatus.indexX, 2) }}</td>
          <td>{{ toHex(cpuStatus.indexY, 2) }}</td>
          <td>{{ cpuStatus.status }}</td>
        </tr>
        <tr>
          <th :rowspan="2" class="is-vcentered">PPU</th>
          <th>Scanline</th>
          <th>Cycle</th>
          <th>V</th>
          <th>T</th>
          <th>X</th>
          <th>W</th>
        </tr>
        <tr>
          <td>{{ ppuStatus.scanline.toString().padStart(3, '0') }}</td>
          <td>{{ ppuStatus.cycle.toString().padStart(3, '0') }}</td>
          <td>{{ toHex(ppuStatus.currentVideoRamAddress, 4) }}</td>
          <td>{{ toHex(ppuStatus.temporaryVideoRamAddress, 4) }}</td>
          <td>{{ ppuStatus.fineX }}</td>
          <td>{{ ppuStatus.writeToggle }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'
import { injectStrict, toHex } from '/@/utils'
import { NesKey } from '/@/composables/useNes'

const { nes } = injectStrict(NesKey)

const cpuStatus = reactive({
  programCounter: 0x0000,
  stackPointer: 0x00,
  accumulator: 0x00,
  indexX: 0x00,
  indexY: 0x00,
  status: '--------',
})

const ppuStatus = reactive({
  scanline: 0,
  cycle: 0,
  currentVideoRamAddress: 0x0000,
  temporaryVideoRamAddress: 0x0000,
  fineX: 0,
  writeToggle: false,
})

const handleFrameOrStep = () => {
  cpuStatus.programCounter = nes.cpu.registers.programCounter
  cpuStatus.stackPointer = nes.cpu.registers.stackPointer
  cpuStatus.accumulator = nes.cpu.registers.accumulator
  cpuStatus.indexX = nes.cpu.registers.indexX
  cpuStatus.indexY = nes.cpu.registers.indexY
  cpuStatus.status = [
    nes.cpu.registers.negativeFlag ? 'N' : '-',
    nes.cpu.registers.overflowFlag ? 'V' : '-',
    nes.cpu.registers.reservedFlag ? 'R' : '-',
    nes.cpu.registers.breakCommandFlag ? 'B' : '-',
    nes.cpu.registers.decimalModeFlag ? 'D' : '-',
    nes.cpu.registers.interruptDisableFlag ? 'I' : '-',
    nes.cpu.registers.zeroFlag ? 'Z' : '-',
    nes.cpu.registers.carryFlag ? 'C' : '-',
  ].join('')

  ppuStatus.scanline = nes.ppu.scanline
  ppuStatus.cycle = nes.ppu.cycle
  ppuStatus.currentVideoRamAddress = nes.ppu.registers.currentVideoRamAddress
  ppuStatus.temporaryVideoRamAddress = nes.ppu.registers.temporaryVideoRamAddress
  ppuStatus.writeToggle = nes.ppu.registers.writeToggle
}

onMounted(() => {
  nes.addEventListener('frame', handleFrameOrStep)
  nes.addEventListener('step', handleFrameOrStep)
})

onUnmounted(() => {
  nes.removeEventListener('frame', handleFrameOrStep)
  nes.removeEventListener('step', handleFrameOrStep)
})
</script>

<style scoped>
.table {
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.table td {
  width: 5rem;
}
</style>
