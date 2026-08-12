import type { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  solidity: {
    // OpenZeppelin contracts@5.7 requires ^0.8.24
    version: '0.8.26',
  },
  paths: {
    sources: './src',
  },
}

export default config
