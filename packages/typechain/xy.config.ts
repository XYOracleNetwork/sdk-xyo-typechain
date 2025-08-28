import type { XyTsupConfig } from '@xylabs/ts-scripts-yarn3'
const config: XyTsupConfig = {
  compile: {
    entryMode: 'all',
    browser: {},
    neutral: { src: true },
    node: {},
  },
}

export default config
