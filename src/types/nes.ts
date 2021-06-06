export type NesCycle = number

export const NesState = {
  PoweredOff: 'PoweredOff',
  Running: 'Running',
  Stopped: 'Stopped',
} as const

export type NesState = typeof NesState[keyof typeof NesState]
