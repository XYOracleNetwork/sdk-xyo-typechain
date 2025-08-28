import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const DEFAULT_TOKEN_NAME = 'Token Name'
const DEFAULT_TOKEN_SYMBOL = 'TOKN'

export default buildModule('BridgeableToken', (m) => {
  // const name = m.getParameter('unlockTime', DEFAULT_TOKEN_NAME)
  // const symbol = m.getParameter('lockedAmount', DEFAULT_TOKEN_SYMBOL)

  const token = m.contract('BridgeableToken', [DEFAULT_TOKEN_NAME, DEFAULT_TOKEN_SYMBOL])

  return { token }
})
