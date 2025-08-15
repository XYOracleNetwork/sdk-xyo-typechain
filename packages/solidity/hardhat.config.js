import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import '@typechain/hardhat'
import '@nomicfoundation/hardhat-verify'

const config = {
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
    target: 'ethers-v6', // <-- generate Ethers v6 bindings
    outDir: 'typechain-types', // where types go
    // alwaysGenerateOverloads: true, // optional
  },
}

export default config
