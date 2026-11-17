import type { XyEsbuildConfig } from '@ariestools/toolchain'

const config: XyEsbuildConfig = {
  compile: {
    entryMode: 'all',
    neutral: true,
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
