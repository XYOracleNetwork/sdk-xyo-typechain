import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { SingleAddressSubGovernorModule } from './SingleAddressSubGovernor'

export default buildModule('DeployXL1', (m) => {
  const { subGovernor } = m.useModule(SingleAddressSubGovernorModule("Name", 1, 1))
  return { subGovernor }
})
