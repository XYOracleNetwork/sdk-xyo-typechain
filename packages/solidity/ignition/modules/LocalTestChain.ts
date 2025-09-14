import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { type ContractFuture, type IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

import { BridgeableTokenModule } from './BridgeableToken'
import { SingleAddressSubGovernorModule } from './SingleAddressSubGovernor'
import { createXL1GovernanceModule } from './XL1Governance'
import { XyoChainRewardsModule } from './XyoChainRewards'

/**
 * Returns a function that builds the StakedXyoChainV2 contract with injected rewards
 * contract & staking token address.
 */
export const createTestStakedXyoChainV2Module
  = (
    rewardsContract: ContractFuture<'XyoChainRewards'>,
    stakingToken: ContractFuture<'BridgeableToken'>,
  ) => {
    return buildModule('StakedXyoChainV2', (m: IgnitionModuleBuilder) => {
      const forkFromChainId = m.getParameter('forkFromChainId')
      const forkFromLastBlockNumber = m.getParameter('forkFromLastBlockNumber')
      const forkFromLastHash = m.getParameter('forkFromLastHash')
      const maxStakersPerAddress = m.getParameter('maxStakersPerAddress')
      const minStake = m.getParameter('minStake')
      const minWithdrawalBlocks = m.getParameter('minWithdrawalBlocks')
      const stakingTokenAddress = stakingToken
      const unlimitedStakerAddress = m.getParameter('networkStakingAddress')

      const chain = m.contract('StakedXyoChainV2', [
        forkFromChainId,
        forkFromLastBlockNumber,
        forkFromLastHash,
        rewardsContract,
        minWithdrawalBlocks,
        stakingTokenAddress,
        maxStakersPerAddress,
        unlimitedStakerAddress,
        minStake,
      ])

      return { chain }
    })
  }

export default buildModule('LocalTestChain', (m) => {
  // Deploy all the contracts
  const { token } = m.useModule(BridgeableTokenModule)
  const { subGovernor } = m.useModule(SingleAddressSubGovernorModule)
  const { xl1Governance } = m.useModule(createXL1GovernanceModule(subGovernor))
  const { rewards } = m.useModule(XyoChainRewardsModule)
  const { chain } = m.useModule(createTestStakedXyoChainV2Module(rewards, token))

  return {
    chain, subGovernor, token, xl1Governance,
  }
})
