import {
  buildModule, type ContractFuture, type IgnitionModuleBuilder,
} from '@nomicfoundation/ignition-core'

/**
 * Returns a function that builds the StakedXyoChainV2 contract with injected token and rewards.
 */
export const createStakedXyoChainV2Module
  = (
    rewardsContract: ContractFuture<'XyoChainRewards'>,
  ) => {
    return buildModule('StakedXyoChainV2', (m: IgnitionModuleBuilder) => {
      const forkFromChainId = m.getParameter('forkFromChainId')
      const forkFromLastBlockNumber = m.getParameter('forkFromLastBlockNumber')
      const forkFromLastHash = m.getParameter('forkFromLastHash')
      const maxStakersPerAddress = m.getParameter('maxStakersPerAddress')
      const minStake = m.getParameter('minStake')
      const minWithdrawalBlocks = m.getParameter('minWithdrawalBlocks')
      const stakingTokenAddress = m.getParameter('stakingTokenAddress')
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
