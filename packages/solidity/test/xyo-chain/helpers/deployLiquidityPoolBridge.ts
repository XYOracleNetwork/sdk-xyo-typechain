import { isDefined, isUndefined } from '@ariestools/sdk'
import { getAddress } from 'ethers'
import hre from 'hardhat'

const { ethers } = hre

const DefaultMaxBridgeAmount = ethers.parseUnits('1000000000', 18)

/**
 * Deploys a LiquidityPoolBridge contract with the specified parameters, providing defaults for optional parameters.
 * @param token The address of the token to be bridged
 * @param liquiditySource The address of the liquidity source for the bridge; if not provided, a default non-deployer account will be used
 * @param remoteChain The address of the remote chain; if not provided, a dummy address will be used
 * @param maxBridgeAmount The maximum amount that can be bridged; defaults to a large value
 * @param owner The address of the owner; if provided, ownership will be transferred to this address
 * @returns An object containing the deployed bridge contract
 */
export const deployLiquidityPoolBridge = async (
  token: string,
  liquiditySource?: string,
  remoteChain?: string,
  maxBridgeAmount: bigint = DefaultMaxBridgeAmount,
  owner?: string,
) => {
  // If no remote chain is provided, use a dummy address
  if (isUndefined(remoteChain)) remoteChain = getAddress('0x0000000000000000000000000000000000000001')

  // If no liquidity source is provided
  if (isUndefined(liquiditySource)) {
    // Use a non-deployer account as the liquidity source to avoid issues
    // with the bridge being the owner of the liquidity source
    const [, _, defaultLiquiditySource] = await ethers.getSigners()
    liquiditySource = defaultLiquiditySource.address
  }

  // Deploy a LiquidityPoolBridge
  const LiquidityPoolBridgeFactory = await ethers.getContractFactory('LiquidityPoolBridge')
  const bridge = await LiquidityPoolBridgeFactory.deploy(remoteChain, token, maxBridgeAmount, liquiditySource)

  // Ensure deployment is finalized before any follow-up actions
  await bridge.waitForDeployment()

  // Transfer ownership from deployer to the specified owner, if provided
  if (isDefined(owner)) {
    const transferOwnershipTx = await bridge.transferOwnership(getAddress(owner))
    await transferOwnershipTx.wait()
  }

  return { bridge }
}
