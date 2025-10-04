import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const createLiquidityPoolBridgeModule = (m: IgnitionModuleBuilder) => {
  const name = m.getParameter('tokenName')
  const symbol = m.getParameter('tokenSymbol')
  const token = m.contract('LiquidityPoolBridge', [name, symbol])
  return { token }
}

export const LiquidityPoolBridgeModule = buildModule('LiquidityPoolBridge', createLiquidityPoolBridgeModule)

export default LiquidityPoolBridgeModule
