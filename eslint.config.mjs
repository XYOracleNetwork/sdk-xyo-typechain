// eslint.config.mjs

import { config as xylabsConfig, rulesConfig } from '@xylabs/eslint-config-flat'

export default [
  {
    ignores: ['.yarn/**', 'jest.config.cjs', '**/dist/**', 'dist', 'build/**', 'node_modules/**', '**/src/**', '**/types.d.ts'],
  },
  ...xylabsConfig,
  {
    rules: {},
  },
]
