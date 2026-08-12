import type { XyTsupConfig } from '@ariestools/toolchain'

const config: XyTsupConfig = {
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
