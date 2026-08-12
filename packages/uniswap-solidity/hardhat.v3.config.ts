import type { HardhatUserConfig } from 'hardhat/config'

/**
 * Compile Uniswap v3 interfaces only.
 * Many v3 libraries use `pragma solidity >=0.5.0 <0.8.0` and cannot be
 * compiled with modern solc; Truffle historically compiled only interfaces.
 */
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.23',
  },
  paths: {
    sources: './contracts/v3/interfaces',
    artifacts: './artifacts/v3',
    cache: './cache/v3',
  },
}

export default config
