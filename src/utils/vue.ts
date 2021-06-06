import { inject, InjectionKey } from 'vue'
import { validateNonNullable } from '@/utils'

export function buildEventListener<T>(handler: (event: Event & { currentTarget: T }) => void): (event: Event) => void {
  return (event: Event) => {
    handler(event as Event & { currentTarget: T })
  }
}

export function injectStrict<T>(injectionKey: InjectionKey<T>): T {
  const value = inject(injectionKey)
  validateNonNullable(value)
  return value
}
