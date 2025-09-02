import type { ContractFuture, IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

import {
  DEFAULT_MAX_STAKERS_PER_ADDRESS,
  DEFAULT_MIN_VOTING_STAKE,
  DEFAULT_MIN_WITHDRAWAL_BLOCKS,
  DEFAULT_NETWORK_STAKING_ADDRESS,
} from './ContractDefaults'

/**
 * Returns a function that builds the StakedXyoChainV2 contract with injected token and rewards.
 */
export const createStakedXyoChainV2Module
  = (
    rewardsContract: ContractFuture<'XyoChainRewards'>,
    token: string,
  ) =>
    (m: IgnitionModuleBuilder) => {
      const forkFromChainId = m.getParameter('forkFromChainId', '0x0000000000000000000000000000000000000000')
      const forkFromLastBlockNumber = m.getParameter('forkFromLastBlockNumber', 0n)
      const forkFromLastHash = m.getParameter('forkFromLastHash', 0n)
      const minWithdrawalBlocks = m.getParameter('minWithdrawalBlocks', DEFAULT_MIN_WITHDRAWAL_BLOCKS)
      const maxStakersPerAddress = m.getParameter('maxStakersPerAddress', DEFAULT_MAX_STAKERS_PER_ADDRESS)
      const unlimitedStakerAddress = m.getParameter('networkStakingAddress', DEFAULT_NETWORK_STAKING_ADDRESS)
      const minStake = m.getParameter('minStake', DEFAULT_MIN_VOTING_STAKE)

      const chain = m.contract('StakedXyoChainV2', [
        forkFromChainId,
        forkFromLastBlockNumber,
        forkFromLastHash,
        rewardsContract,
        minWithdrawalBlocks,
        token,
        maxStakersPerAddress,
        unlimitedStakerAddress,
        minStake,
      ])

      return { chain }
    }
