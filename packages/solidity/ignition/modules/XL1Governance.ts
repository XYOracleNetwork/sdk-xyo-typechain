// modules/XL1GovernanceModule.ts
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { ContractFuture, IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const DEFAULT_NAME = 'XL1Governance'
const DEFAULT_VOTING_DELAY = 1
const DEFAULT_VOTING_PERIOD = 20

export const createXL1GovernanceModule = (
  subGovernor: ContractFuture<'SingleAddressSubGovernor'>,
) => {
  return buildModule('XL1Governance', (m: IgnitionModuleBuilder) => {
    const name = m.getParameter('name', DEFAULT_NAME)
    const votingDelay = m.getParameter('votingDelay', DEFAULT_VOTING_DELAY)
    const votingPeriod = m.getParameter('votingPeriod', DEFAULT_VOTING_PERIOD)

    const xl1Governance = m.contract('XL1Governance', [
      name,
      [subGovernor],
      votingDelay,
      votingPeriod,
    ])

    return { xl1Governance }
  })
}
