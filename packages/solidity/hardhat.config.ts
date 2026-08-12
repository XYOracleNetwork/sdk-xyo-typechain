/* eslint-disable import-x/no-internal-modules */
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers'
import type { HardhatUserConfig } from 'hardhat/config'
import { configVariable } from 'hardhat/config'

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: '0.8.26',
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
    hardhat: {
      type: 'edr-simulated',
      chainType: 'l1',
      chainId: 31337,
    },
    hardhatMainnet: {
      type: 'edr-simulated',
      chainType: 'l1',
      chainId: 31337,
    },
    local: {
      type: 'http',
      chainType: 'l1',
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    sepolia: {
      type: 'http',
      chainType: 'l1',
      chainId: 11155111,
      url: configVariable('SEPOLIA_RPC_URL'),
      accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
    },
    ethereum: {
      type: 'http',
      chainType: 'l1',
      chainId: 1,
      url: configVariable('ETHEREUM_RPC_URL'),
      accounts: [configVariable('ETHEREUM_PRIVATE_KEY')],
    },
  },
  paths: { sources: './contracts' },
  typechain: {
    outDir: 'typechain-types',
  },
}

export default config
