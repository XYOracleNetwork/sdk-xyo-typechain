import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

import { BridgeableTokenModule } from './BridgeableToken'
import { SingleAddressSubGovernorModule } from './SingleAddressSubGovernor'
import { createStakedXyoChainV2Module } from './StakedXyoChainV2'
import { createXL1GovernanceModule } from './XL1Governance'
import { XyoChainRewardsModule } from './XyoChainRewards'

export default buildModule('DeployXL1', (m) => {
  // Deploy all the contracts
  const { token } = m.useModule(BridgeableTokenModule)
  const { subGovernor } = m.useModule(SingleAddressSubGovernorModule)
  const { xl1Governance } = m.useModule(createXL1GovernanceModule(subGovernor))
  const { rewards } = m.useModule(XyoChainRewardsModule)
  const { chain } = m.useModule(createStakedXyoChainV2Module(rewards))

  // Setup Bridgeable Token Treasury
  // const bridgeTreasuryAddress = m.getParameter('bridgeTreasuryAddress')
  // const bridgeTreasuryAmount = m.getParameter('bridgeTreasuryAmount')
  m.call(token, 'mint', ['0x1969196919691969196919691969196919691969', 7_000_000_000_000_000_000_000_000_000n])

  // Transfer Bridgeable Token ownership to xl1Governance
  m.call(token, 'transferOwnership', [xl1Governance])

  return {
    chain, subGovernor, token, xl1Governance,
  }
})
