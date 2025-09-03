// modules/XL1GovernanceModule.ts
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { ContractFuture, IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

export const createXL1GovernanceModule = (
  subGovernor: ContractFuture<'SingleAddressSubGovernor'>,
) => {
  return buildModule('XL1Governance', (m: IgnitionModuleBuilder) => {
    const name = m.getParameter('name')
    const votingDelay = m.getParameter('votingDelay')
    const votingPeriod = m.getParameter('votingPeriod')

    const xl1Governance = m.contract('XL1Governance', [
      name,
      [subGovernor],
      votingDelay,
      votingPeriod,
    ])

    return { xl1Governance }
  })
}
