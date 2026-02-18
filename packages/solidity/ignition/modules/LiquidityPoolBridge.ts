import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const createLiquidityPoolBridgeModule = (m: IgnitionModuleBuilder) => {
  // Retrieve parameters for the LiquidityPoolBridge deployment
  const remoteChain = m.getParameter('remoteChain')
  const token = m.getParameter('token')
  const maxBridgeAmount = m.getParameter('maxBridgeAmount')
  const liquiditySource = m.getParameter('liquiditySource')
  const owner = m.getParameter('owner')

  // Deploy the LiquidityPoolBridge contract with the specified parameters
  const liquidityPoolBridge = m.contract('LiquidityPoolBridge', [remoteChain, token, maxBridgeAmount, liquiditySource])

  // Transfer ownership to the specified owner, if provided
  m.call(liquidityPoolBridge, 'transferOwnership', [owner])

  // Return the deployed bridge contract as part of the module's output
  return { liquidityPoolBridge }
}

export const LiquidityPoolBridgeModule = buildModule('LiquidityPoolBridge', createLiquidityPoolBridgeModule)

export default LiquidityPoolBridgeModule
