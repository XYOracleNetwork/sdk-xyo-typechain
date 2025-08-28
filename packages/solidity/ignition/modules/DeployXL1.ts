import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('DeployXL1', (m) => {
  const name = m.getParameter('unlockTime', TOKEN_NAME)
  const symbol = m.getParameter('lockedAmount', TOKEN_SYMBOL)

  const token = m.contract('BridgeableToken', [name, symbol])

  return { token }
})
