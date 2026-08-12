import type { HardhatUserConfig } from 'hardhat/config'

/** Compile Uniswap v4 periphery (several files pin solc 0.8.26). */
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.26',
  },
  paths: {
    sources: './contracts/v4-periphery',
    artifacts: './artifacts/v4-periphery',
    cache: './cache/v4-periphery',
  },
}

export default config
