import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-verify'
import '@typechain/hardhat'
import 'solidity-coverage'

import dotenv from 'dotenv'

dotenv.config({ quiet:true })

// eslint-disable-next-line import-x/no-internal-modules
import type { HardhatUserConfig } from 'hardhat/config'

const sepolia =
  process.env.SEPOLIA_PRIVATE_KEY && process.env.SEPOLIA_RPC_URL
    ? {
        accounts: [process.env.SEPOLIA_PRIVATE_KEY],
        chainId: 1115511,
        url: process.env.SEPOLIA_RPC_URL,
      }
    : undefined;

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks:{
    local: {
      url: 'http://127.0.0.1:8545',
      // chainId: 1337,
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    },
  },
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
  paths: { sources: './contracts' },
  typechain: {
    target: 'ethers-v6', // generate Ethers v6 bindings
    outDir: 'typechain-types', // where types go
    // alwaysGenerateOverloads: true, // optional
  },
}

if (sepolia && config.networks) config.networks.sepolia = sepolia

export default config
