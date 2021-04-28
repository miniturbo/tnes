import type { Config } from '@jest/types'
import { pathsToModuleNameMapper } from 'ts-jest/utils'
import { compilerOptions } from './tsconfig.json'

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
