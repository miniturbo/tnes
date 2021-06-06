import { NullableError } from '@/errors'

export * from '@/utils/integer'
export * from '@/utils/vue'

export function capitalize(value: string): string {
  return value[0].toUpperCase() + value.slice(1)
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null
}

export function toHex(number: number | null | undefined, length: number, prefix = '$'): string | null {
  return number !== null && number !== undefined ? prefix + number.toString(16).padStart(length, '0') : null
}

export function validateNonNullable<T>(value: T): asserts value is NonNullable<T> {
  if (value === null) throw new NullableError(value)
}
