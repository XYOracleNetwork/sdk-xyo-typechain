import { isUndefined } from '@xylabs/typeof'
import { getAddress } from 'ethers'
import hre from 'hardhat'

const { ethers } = hre

const DefaultMaxBridgeAmount = ethers.parseUnits('1000000000', 18)

export const deployLiquidityPoolBridge = async (
  token: string,
  liquiditySource?: string,
  remoteChain?: string,
  maxBridgeAmount: bigint = DefaultMaxBridgeAmount,
) => {
  // Contracts are deployed using the first signer/account by default
  const [, _, hotWallet] = await ethers.getSigners()

  // If no remote chain is provided, use a dummy address
  if (isUndefined(remoteChain)) remoteChain = getAddress('0x0000000000000000000000000000000000000001')

  // If no liquidity source is provided, use the owner's address
  if (isUndefined(liquiditySource)) liquiditySource = hotWallet.address

  // Deploy a LiquidityPoolBridge
  const LiquidityPoolBridgeFactory = await ethers.getContractFactory('LiquidityPoolBridge')
  const bridge = await LiquidityPoolBridgeFactory.deploy(remoteChain, token, maxBridgeAmount, liquiditySource)

  return { bridge }
}
