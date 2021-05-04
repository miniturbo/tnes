<template>
  <div ref="container" class="nes-debugger-disassembly" @wheel="handleWheel">
    <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth has-text-centered">
      <thead>
        <tr ref="baseRow">
          <th class="address">Address</th>
          <th class="has-text-left">Disassembly</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, m) in rows" :key="m">
          <td class="address">{{ row.isCurrent ? '>' : '&nbsp;' }}&nbsp;{{ toHex(row.address, 4) }}</td>
          <td class="has-text-left">{{ row.disassembly }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { CpuOperand } from '/@/types'
import { computed, onActivated, onDeactivated, onMounted, ref } from 'vue'
import { CpuAddressingMode } from '/@/types'
import { bitFlag, combineIntoWord, injectStrict, maskAsWord, toHex, uint8ToInt8 } from '/@/utils'
import { NesKey } from '/@/composables/useNes'
import { CpuInstructionSet } from '/@/models/Cpu'
import { Nes } from '/@/models/Nes'

type Row = {
  address: Uint16
  disassembly: string
  isCurrent: boolean
}

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

  if (next < 0x0000) {
    next = 0x0000
  }

  if (next > 0xffff) {
    next = 0xffff
  }

  currentRow.value = next
}

const handleFrame = (event: Event) => {
  if (!(event.currentTarget instanceof Nes)) return

  const newRows: Row[] = []

  let address = currentRow.value

  while (address < 0x10000) {
    let disassembly = ''
    let nextAddress = address + 1

    if (bitFlag(event.currentTarget.cpuBus.cdl[address], 0)) {
      const opcode = event.currentTarget.cpuBus.read(address)
      const instruction = CpuInstructionSet.findByOpcode(opcode)

      let operand: CpuOperand = 0
      switch (instruction.byte) {
        case 2: {
          operand = event.currentTarget.cpuBus.read(address + 1)
          break
        }
        case 3: {
          operand = combineIntoWord(
            event.currentTarget.cpuBus.read(address + 1),
            event.currentTarget.cpuBus.read(address + 2)
          )
          break
        }
      }

      disassembly = instruction.type.toUpperCase()

      switch (instruction.addressingMode) {
        case CpuAddressingMode.Immediate: {
          disassembly += ` #${toHex(operand, 2)}`
          break
        }
        case CpuAddressingMode.ZeroPage: {
          disassembly += ` ${toHex(operand, 2)}`
          break
        }
        case CpuAddressingMode.ZeroPageX: {
          disassembly += ` ${toHex(operand, 2)}, x`
          break
        }
        case CpuAddressingMode.ZeroPageY: {
          disassembly += ` ${toHex(operand, 2)}, y`
          break
        }
        case CpuAddressingMode.Relative: {
          disassembly += ` ${toHex(maskAsWord(address + uint8ToInt8(operand)), 4)}`
          break
        }
        case CpuAddressingMode.Absolute: {
          disassembly += ` ${toHex(operand, 4)}`
          break
        }
        case CpuAddressingMode.AbsoluteX: {
          disassembly += ` ${toHex(operand, 4)}, x`
          break
        }
        case CpuAddressingMode.AbsoluteY: {
          disassembly += ` ${toHex(operand, 4)}, y`
          break
        }
        case CpuAddressingMode.Indirect: {
          disassembly += ` (${toHex(operand, 4)})`
          break
        }
        case CpuAddressingMode.IndexedIndirect: {
          disassembly += ` (${toHex(operand, 4)}, x)`
          break
        }
        case CpuAddressingMode.IndirectIndexed: {
          disassembly += ` (${toHex(operand, 4)}, y)`
          break
        }
      }
      nextAddress = address + instruction.byte
    }

    newRows.push({
      address,
      disassembly,
      isCurrent: address === event.currentTarget.cpu.registers.programCounter,
    })

    if (newRows.length === maxRows.value) {
      break
    }

    address = nextAddress
  }

  rows.value = newRows
}

onMounted(() => {
  if (!container.value || !baseRow.value) return
  containerHeight.value = container.value.clientHeight
  baseRowHeight.value = baseRow.value.clientHeight
})

onActivated(() => {
  currentRow.value = nes.cpu.registers.programCounter

  nes.addEventListener('frame', handleFrame)
})

onDeactivated(() => {
  nes.removeEventListener('frame', handleFrame)
})
</script>

<style scoped>
.nes-debugger-disassembly {
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.address {
  width: 4rem;
}
</style>
