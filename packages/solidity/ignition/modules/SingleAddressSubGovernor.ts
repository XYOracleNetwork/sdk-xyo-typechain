import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const createSingleAddressSubGovernorModule = (m: IgnitionModuleBuilder) => {
  const name = m.getParameter('name')
  const votingDelay = m.getParameter('votingDelay')
  const votingPeriod = m.getParameter('votingPeriod')

  const subGovernor = m.contract('SingleAddressSubGovernor', [
    name,
    votingDelay,
    votingPeriod,
  ])

  return { subGovernor }
}

export const SingleAddressSubGovernorModule = buildModule(
  'SingleAddressSubGovernor',
  createSingleAddressSubGovernorModule,
)

export default SingleAddressSubGovernorModule
