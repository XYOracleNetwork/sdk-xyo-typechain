import type { XyTsupConfig } from '@ariestools/toolchain'

const config: XyTsupConfig = {
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
