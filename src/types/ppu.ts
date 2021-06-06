export type PpuCycle = number

export type PpuScanline = number

export const PpuSpriteEvaluationState = {
  YPositionCopying: 'YPositionCopying',
  TileIndexCopying: 'TileIndexCopying',
  AttributesCopying: 'AttributesCopying',
  XPositionCopying: 'XPositionCopying',
  Noop: 'Noop',
} as const

export type PpuSpriteEvaluationState = typeof PpuSpriteEvaluationState[keyof typeof PpuSpriteEvaluationState]
