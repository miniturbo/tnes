<template>
  <div class="nes-debugger">
    <div class="tabs is-small is-boxed">
      <ul>
        <li v-for="(mode, label) in DebugMode" :key="mode" :class="{ 'is-active': mode === debugMode }">
          <a @click="setDebugMode(mode)">{{ formatLabel(label) }}</a>
        </li>
      </ul>
    </div>
    <KeepAlive>
      <Component :is="component(`NesDebugger${debugMode}`)" class="tab-content" />
    </KeepAlive>
    <NesDebuggerStatus class="status" />
  </div>
</template>

<script setup lang="ts">
import NesDebuggerCpuBus from '@/components/NesDebuggerCpuBus.vue'
import NesDebuggerDisassembly from '@/components/NesDebuggerDisassembly.vue'
import NesDebuggerNameTables from '@/components/NesDebuggerNameTables.vue'
import NesDebuggerPatternsAndPalettes from '@/components/NesDebuggerPatternsAndPalettes.vue'
import NesDebuggerPpuBus from '@/components/NesDebuggerPpuBus.vue'
import NesDebuggerStatus from '@/components/NesDebuggerStatus.vue'
import { DebugMode, NesDebugKey } from '@/composables/useNesDebug'
import { injectStrict } from '@/utils'

const { debugMode, setDebugMode } = injectStrict(NesDebugKey)

const formatLabel = (label: string): string => {
  return label
    .replace(/^./, (string) => string.toLowerCase())
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (string) => string.toUpperCase())
}

const Components = {
  NesDebuggerPatternsAndPalettes,
  NesDebuggerNameTables,
  NesDebuggerCpuBus,
  NesDebuggerPpuBus,
  NesDebuggerDisassembly,
} as const

const component = (name: string) => Components[name as keyof typeof Components]
</script>

<style scoped>
.nes-debugger {
  display: flex;
  flex-direction: column;
  width: 512px;
  margin-left: 1rem;
}

.tabs {
  margin-bottom: calc(0.75rem - 2px);
}

.tab-content {
  height: 480px;
}

.status {
  flex: 1;
  margin-top: 0.75rem;
}
</style>
