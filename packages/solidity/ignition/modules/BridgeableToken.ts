import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const TOKEN_NAME = 'Token Name'
const TOKEN_SYMBOL = 'TOKN'

export const BridgeableTokenModule = buildModule('BridgeableToken', (m) => {
  const name = m.getParameter('unlockTime', TOKEN_NAME)
  const symbol = m.getParameter('lockedAmount', TOKEN_SYMBOL)

  const token = m.contract('BridgeableToken', [name, symbol])

  return { token }
})

export default buildModule('BridgeableToken', (m) => {
  const name = m.getParameter('unlockTime', TOKEN_NAME)
  const symbol = m.getParameter('lockedAmount', TOKEN_SYMBOL)

  const token = m.contract('BridgeableToken', [name, symbol])

  return { token }
})
