import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

import { BridgeableTokenModule } from './BridgeableToken'
import { SingleAddressSubGovernorModule } from './SingleAddressSubGovernor'
import { createStakedXyoChainV2Module } from './StakedXyoChainV2'
import { createXL1GovernanceModule } from './XL1Governance'
import { createXyoChainRewardsModule } from './XyoChainRewards'

export default buildModule('DeployXL1', (m) => {
  const { token } = m.useModule(BridgeableTokenModule)
  const { subGovernor } = m.useModule(SingleAddressSubGovernorModule)
  const { xl1Governance } = m.useModule(createXL1GovernanceModule(subGovernor))
  const { rewards } = createXyoChainRewardsModule(m)
  const stakingTokenAddress = process.env.STAKING_TOKEN_ADDRESS ?? ''
  const { chain } = createStakedXyoChainV2Module(rewards, stakingTokenAddress)(m)
  m.call(token, 'transferOwnership', [xl1Governance])
  return {
    chain, subGovernor, token, xl1Governance,
  }
})
