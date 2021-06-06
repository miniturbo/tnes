import { pathsToModuleNameMapper } from 'ts-jest/utils'
// eslint-disable-next-line no-restricted-imports
import { compilerOptions } from './tsconfig.json'
import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    'spec/(.*)$': '<rootDir>/spec/$1',
  },
  preset: 'ts-jest',
  restoreMocks: true,
}

export default config
