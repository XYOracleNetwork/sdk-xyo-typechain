import type { XyTsupConfig } from '@xylabs/ts-scripts-yarn3'
const config: XyTsupConfig = {
  compile: {
    browser: {},
    neutral: { src: { entry: ['src/**/*.ts'] } },
    node: {},
  },
}

export default config
