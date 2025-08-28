import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

import { BridgeableTokenModule } from './BridgeableToken'
import { SingleAddressSubGovernorModule } from './SingleAddressSubGovernor'

export default buildModule('DeployXL1', (m) => {
  const { token } = m.useModule(BridgeableTokenModule)
  const { subGovernor } = m.useModule(SingleAddressSubGovernorModule('Name', 1, 1))
  return { subGovernor, token }
})
