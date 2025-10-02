import hre from 'hardhat'

import type { Address } from '../../../typechain-types'

const { ethers } = hre

export const deployLiquidityPoolBridge = async (
  token: Address,
  remoteChain: Address,
  maxBridgeAmount: bigint = ethers.parseUnits('1000000000', 18),
) => {
  // Deploy a LiquidityPoolBridge
  const TokenFactory = await ethers.getContractFactory('LiquidityPoolBridge')
  const bridge = await TokenFactory.deploy(remoteChain, token, maxBridgeAmount)

  // Contracts are deployed using the first signer/account by default
  const [owner] = await ethers.getSigners()

  return { bridge, owner }
}
