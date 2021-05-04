<template>
  <div class="nes-container">
    <NesMain />
    <NesDebugger v-if="debug" />
  </div>
</template>

<script setup lang="ts">
import { injectStrict } from '/@/utils'
import NesMain from '/@/components/NesMain.vue'
import NesDebugger from '/@/components/NesDebugger.vue'
import { NesDebugKey } from '/@/composables/useNesDebug'

const { debug } = injectStrict(NesDebugKey)
</script>

<style scoped>
.nes-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
