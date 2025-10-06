import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const createLiquidityPoolBridgeModule = (m: IgnitionModuleBuilder) => {
  const remoteChain = m.getParameter('remoteChain')
  const token = m.getParameter('token')
  const maxBridgeAmount = m.getParameter('maxBridgeAmount')
  const payout = m.getParameter('payout')
  const liquidityPoolBridge = m.contract('LiquidityPoolBridge', [remoteChain, token, maxBridgeAmount, payout])
  return { liquidityPoolBridge }
}

export const LiquidityPoolBridgeModule = buildModule('LiquidityPoolBridge', createLiquidityPoolBridgeModule)

export default LiquidityPoolBridgeModule
