import { computed, ComputedRef, InjectionKey, Ref, ref } from 'vue'

type VirtualListType = {
  currentRow: Ref<number>
  maxRowsSize: ComputedRef<number>
  setContainer: (value: HTMLElement) => void
  setBaseRow: (value: HTMLElement) => void
  setCurrentRow: (value: number, limit?: number) => void
}

export const useVirtualList = (): VirtualListType => {
  const container = ref<HTMLElement | null>(null)
  const containerHeight = ref(0)
  const baseRow = ref<HTMLElement | null>(null)
  const baseRowHeight = ref(0)
  const currentRow = ref(0)
  const maxRowsSize = computed(() => {
    const size = (containerHeight.value - baseRowHeight.value) / baseRowHeight.value
    return isNaN(size) ? 0 : Math.floor(size)
  })

  const setContainer = (value: HTMLElement) => {
    container.value = value
    containerHeight.value = value.clientHeight
  }

  const setBaseRow = (value: HTMLElement) => {
    baseRow.value = value
    baseRowHeight.value = value.clientHeight
  }

  const setCurrentRow = (value: number, limit?: number) => {
    if (value < 0x0000) value = 0x0000
    if (limit && value > limit) value = limit

    currentRow.value = value
  }

  return { currentRow, maxRowsSize, setContainer, setBaseRow, setCurrentRow }
}

export const VirtualListKey: InjectionKey<VirtualListType> = Symbol('VirtualList')
