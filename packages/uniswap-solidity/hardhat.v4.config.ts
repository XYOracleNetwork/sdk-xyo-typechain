import type { HardhatUserConfig } from 'hardhat/config'

/**
 * Compile Uniswap v4 sources.
 * PoolManager pins `pragma solidity 0.8.26`; other files accept ^0.8.0 / ^0.8.24.
 */
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: '0.8.24' },
      { version: '0.8.26' },
    ],
  },
  paths: {
    sources: './contracts/v4',
    artifacts: './artifacts/v4',
    cache: './cache/v4',
  },
}

export default config
