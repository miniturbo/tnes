import { readFileSync } from 'fs'
import { resolve } from 'path'

const fixturePath = resolve(__dirname, `../../support/fixtures`)

export function readFixtureAsText(path: string): string {
  return readFileSync(resolve(fixturePath, path), 'utf-8')
}

export function readFixtureAsBuffer(path: string): Buffer {
  return readFileSync(resolve(fixturePath, path))
}
