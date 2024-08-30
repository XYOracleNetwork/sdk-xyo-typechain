import type { XyTsupConfig } from '@xylabs/ts-scripts-yarn3'
const config: XyTsupConfig = {
  compile: {
    browser: { src: true },
    neutral: {  },
    node: { src: true },
  },
}

export default config
