/* eslint-disable import-x/no-internal-modules */
import '@nomicfoundation/hardhat-ignition'

import HardhatIgnitionEthersPlugin from '@nomicfoundation/hardhat-ignition-ethers'
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers'
import type { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers, HardhatIgnitionEthersPlugin],
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
  networks: {
    hardhatMainnet: {
      type: 'edr-simulated',
      chainType: 'l1',
    },
    hardhatOp: {
      type: 'edr-simulated',
      chainType: 'op',
    },
    // sepolia: {
    //   type: 'http',
    //   chainType: 'l1',
    //   url: configVariable('SEPOLIA_RPC_URL'),
    //   accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
    // },
  },
}

export default config
