import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const TOKEN_NAME = 'Token Name'
const TOKEN_SYMBOL = 'TOKN'

const createBridgeableTokenModule = (m: IgnitionModuleBuilder) => {
  const name = m.getParameter('tokenName', TOKEN_NAME)
  const symbol = m.getParameter('tokenSymbol', TOKEN_SYMBOL)

  const token = m.contract('BridgeableToken', [name, symbol])
  return { token }
}

export const BridgeableTokenModule = buildModule('BridgeableToken', createBridgeableTokenModule)

export default BridgeableTokenModule
