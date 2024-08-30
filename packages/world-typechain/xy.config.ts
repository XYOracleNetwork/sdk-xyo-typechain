import type { XyTsupConfig } from '@xylabs/ts-scripts-yarn3'
const config: XyTsupConfig = {
  compile: {
    browser: { src: {entry: ['src/**/*.ts']} },
    neutral: {  },
    node: { src: {entry: ['src/**/*.ts']} },
  },
}

export default config
