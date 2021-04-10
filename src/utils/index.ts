import { NullableError } from '/@/errors'

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null
}

export function toHex(number: number | null | undefined, length: number): string | null {
  return number !== null && number !== undefined ? '$' + number.toString(16).padStart(length, '0') : null
}

export function validateNonNullable<T>(value: T): asserts value is NonNullable<T> {
  if (value === null) throw new NullableError(value)
}
