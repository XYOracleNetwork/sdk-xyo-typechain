import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const createBridgeableTokenModule = (m: IgnitionModuleBuilder) => {
  const name = m.getParameter('tokenName')
  const symbol = m.getParameter('tokenSymbol')

  const token = m.contract('BridgeableToken', [name, symbol])
  return { token }
}

export const BridgeableTokenModule = buildModule('BridgeableToken', createBridgeableTokenModule)

export default BridgeableTokenModule
