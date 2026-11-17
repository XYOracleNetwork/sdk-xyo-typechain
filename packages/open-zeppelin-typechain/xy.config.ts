import type { XyEsbuildConfig } from '@ariestools/toolchain'

const config: XyEsbuildConfig = {
  compile: {
    entryMode: 'all',
    neutral: true,
  },
  commands: {
    // These packages intentionally export only the package root + ./common;
    // individual compiled entries are internal implementation details.
    publint: {
      rules: {
        'pub.platform': 'warn',
        'pub.compileTargets': 'warn',
      },
    },
  },
}

export default config
