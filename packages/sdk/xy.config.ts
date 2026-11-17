import type { XyEsbuildConfig } from '@ariestools/toolchain'

const config: XyEsbuildConfig = {
  compile: {
    entryMode: 'all',
    browser: true,
    node: true,
  },
  commands: {
    publint: {
      rules: {
        'pub.platform': 'warn',
        'pub.compileTargets': 'warn',
      },
    },
  },
}

export default config
