/* eslint-disable import-x/no-internal-modules */
import type { HardhatUserConfig } from 'hardhat/config'

import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers"

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: '0.8.24',
    settings: {
      viaIR: true,
      evmVersion: 'cancun',
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
}

export default config
