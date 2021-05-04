import { InjectionKey, Ref, ref } from 'vue'

export const DebugMode = {
  PatternsAndPalettes: 'PatternsAndPalettes',
  NameTables: 'NameTables',
  CpuBus: 'CpuBus',
  PpuBus: 'PpuBus',
  Disassembly: 'Disassembly',
} as const

export type DebugMode = typeof DebugMode[keyof typeof DebugMode]

type NesDebugType = {
  debug: Ref<boolean>
  debugMode: Ref<DebugMode>
  setDebug: (value: boolean) => void
  setDebugMode: (value: DebugMode) => void
}

export const useNesDebug = (): NesDebugType => {
  const debug = ref(true)
  const debugMode = ref<DebugMode>(DebugMode.PatternsAndPalettes)

  const setDebug = (value: boolean) => {
    debug.value = value
  }

  const setDebugMode = (value: DebugMode) => {
    debugMode.value = value
  }

  return { debug, debugMode, setDebug, setDebugMode }
}

export const NesDebugKey: InjectionKey<NesDebugType> = Symbol('NesDebug')
