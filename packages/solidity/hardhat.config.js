/* eslint-disable import-x/no-internal-modules */
const hardhatToolboxMochaEthers = require('@nomicfoundation/hardhat-toolbox-mocha-ethers')

const config = {
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
