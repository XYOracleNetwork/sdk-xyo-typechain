import { isUndefined } from '@xylabs/typeof'
import { getAddress } from 'ethers'
import hre from 'hardhat'

const { ethers } = hre

export const deployLiquidityPoolBridge = async (
  token: string,
  remoteChain?: string,
  maxBridgeAmount: bigint = ethers.parseUnits('1000000000', 18),
) => {
  // If no remote chain is provided, use a dummy address
  if (isUndefined(remoteChain)) remoteChain = getAddress('0x0000000000000000000000000000000000000001')

  // Deploy a LiquidityPoolBridge
  const TokenFactory = await ethers.getContractFactory('LiquidityPoolBridge')
  const bridge = await TokenFactory.deploy(remoteChain, token, maxBridgeAmount)

  // Contracts are deployed using the first signer/account by default
  const [owner] = await ethers.getSigners()

  return { bridge, owner }
}
