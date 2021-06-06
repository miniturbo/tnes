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
import { computed, onActivated, onDeactivated, onMounted, ref } from 'vue'
import { NesKey } from '@/composables/useNes'
import { useVirtualList } from '@/composables/useVirtualList'
import { InstructionSet } from '@/models/Cpu'
import { CpuAddressingMode } from '@/types'
import type { CpuOperand } from '@/types'
import { bitFlag, combineIntoWord, injectStrict, maskAsWord, setBitFlag, toHex, uint8ToInt8 } from '@/utils'

type Row = {
  address: Uint16
  disassembly: string
  isCurrent: boolean
}

const { nes } = injectStrict(NesKey)
const { currentRow, maxRowsSize, setContainer, setBaseRow, setCurrentRow } = useVirtualList()

const codeDataLog = new Uint8Array(0xffff)

const container = ref<HTMLDivElement | null>(null)
const baseRow = ref<HTMLTableRowElement | null>(null)
const computedTimestamp = ref(performance.now())
const rows = computed(() => {
  // NOTE: re-compute at any time
  computedTimestamp.value

  const rows: Row[] = []

  let address = currentRow.value

  while (address < 0x10000) {
    let disassembly = ''
    let nextAddress = address + 1

    if (bitFlag(codeDataLog[address], 0)) {
      const opcode = nes.cpu.bus.read(address)
      const instruction = InstructionSet.findByOpcode(opcode)

      let operand: CpuOperand = 0

      switch (instruction.byte) {
        case 2: {
          operand = nes.cpu.bus.read(address + 1)
          break
        }
        case 3: {
          operand = combineIntoWord(nes.cpu.bus.read(address + 1), nes.cpu.bus.read(address + 2))
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
          disassembly += ` ${toHex(maskAsWord(address + 2 + uint8ToInt8(operand)), 4)}`
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

    rows.push({
      address,
      disassembly,
      isCurrent: address === nes.cpu.registers.programCounter,
    })

    if (rows.length >= maxRowsSize.value) break

    address = nextAddress
  }

  return rows
})

const updateComputedTimestamp = () => {
  computedTimestamp.value = performance.now()
}

const handleWheel = (event: WheelEvent) => {
  setCurrentRow(currentRow.value + Math.floor(event.deltaY * 0.5), 0xffff)
}

const handleNesFrame = () => {
  updateComputedTimestamp()
}

const handleNesStep = () => {
  setCurrentRow(nes.cpu.registers.programCounter - Math.floor(maxRowsSize.value / 2), 0xffff)
  updateComputedTimestamp()
}

const handleCpuResetOrAfterExecute = () => {
  const address = nes.cpu.registers.programCounter
  codeDataLog[address] = setBitFlag(codeDataLog[address], 0, true)
}

onMounted(() => {
  if (!container.value || !baseRow.value) return
  setContainer(container.value)
  setBaseRow(baseRow.value)
})

onActivated(() => {
  setCurrentRow(nes.cpu.registers.programCounter - Math.floor(maxRowsSize.value / 2), 0xffff)
  updateComputedTimestamp()

  nes.on('frame', handleNesFrame)
  nes.on('step', handleNesStep)
  nes.cpu.on('reset', handleCpuResetOrAfterExecute)
  nes.cpu.on('afterexecute', handleCpuResetOrAfterExecute)
})

onDeactivated(() => {
  nes.off('frame', handleNesFrame)
  nes.off('step', handleNesStep)
  nes.cpu.off('reset', handleCpuResetOrAfterExecute)
  nes.cpu.off('afterexecute', handleCpuResetOrAfterExecute)
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
