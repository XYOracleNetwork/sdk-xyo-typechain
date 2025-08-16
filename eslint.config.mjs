import {
  typescriptConfig,
  unicornConfig,
  workspacesConfig,
  rulesConfig,
  importConfig
} from '@xylabs/eslint-config-flat'

export default [
  {
    ignores: ['**/*/truffle-config.cjs', '.yarn/**', '**/dist/**', 'dist', 'build/**', 'node_modules/**', 'public', '.storybook', 'storybook-static', 'eslint.config.mjs', '**/docs/**/*.js', '**/coverage'],
  },
  unicornConfig,
  workspacesConfig,
  rulesConfig,
  typescriptConfig,
  importConfig,
  {
    rules: {
      'unicorn/no-abusive-eslint-disable': ['off']
    }
  }
]
