import { inject, InjectionKey } from 'vue'
import { validateNonNullable } from '/@/utils'

export function injectStrict<T>(injectionKey: InjectionKey<T>): T {
  const value = inject(injectionKey)
  validateNonNullable(value)
  return value
}
