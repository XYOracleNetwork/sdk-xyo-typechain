import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

import { BridgeableTokenModule } from './BridgeableToken'
import { SingleAddressSubGovernorModule } from './SingleAddressSubGovernor'
import { createXL1GovernanceModule } from './XL1Governance'

export default buildModule('DeployXL1', (m) => {
  const { token } = m.useModule(BridgeableTokenModule)
  const { subGovernor } = m.useModule(SingleAddressSubGovernorModule)
  const { xl1Governance } = m.useModule(createXL1GovernanceModule(subGovernor))
  return {
    subGovernor, token, xl1Governance,
  }
})
