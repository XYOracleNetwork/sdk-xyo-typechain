import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const DEFAULT_NAME = 'SingleAddressSubGovernor'
const DEFAULT_VOTING_DELAY = 1
const DEFAULT_VOTING_PERIOD = 5

const createSingleAddressSubGovernorModule = (m: IgnitionModuleBuilder) => {
  const name = m.getParameter('name', DEFAULT_NAME)
  const votingDelay = m.getParameter('votingDelay', DEFAULT_VOTING_DELAY)
  const votingPeriod = m.getParameter('votingPeriod', DEFAULT_VOTING_PERIOD)

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
