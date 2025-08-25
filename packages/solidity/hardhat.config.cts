import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-verify'
import '@typechain/hardhat'
import 'solidity-coverage'

// eslint-disable-next-line import-x/no-internal-modules
import type { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      evmVersion: 'cancun',
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: { sources: './contracts' },
  typechain: {
    target: 'ethers-v6', // generate Ethers v6 bindings
    outDir: 'typechain-types', // where types go
    // alwaysGenerateOverloads: true, // optional
  },
}

export default config
