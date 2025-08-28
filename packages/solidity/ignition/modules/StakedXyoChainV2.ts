import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { ContractFuture, IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

import {
  DEFAULT_MAX_SUPPLY,
  DEFAULT_MIN_WITHDRAWAL_BLOCKS,
  DEFAULT_NETWORK_STAKING_ADDRESS,
  DEFAULT_STAKING_REWARD_BPS,
} from './ContractDefaults'

/**
 * Returns a function that builds the StakedXyoChainV2 contract with injected token and rewards.
 */
export const createStakedXyoChainV2Module
  = (
    token: ContractFuture<'BridgeableToken'>,
    rewards: ContractFuture<'XyoChainRewards'>,
  ) =>
    (m: IgnitionModuleBuilder) => {
      const forkedChainId = m.getParameter('forkedChainId', '0x0000000000000000000000000000000000000000')
      const forkedAtBlockNumber = m.getParameter('forkedAtBlockNumber', 0n)
      const forkedAtHash = m.getParameter('forkedAtHash', 0n)
      const minWithdrawalBlocks = m.getParameter('minWithdrawalBlocks', DEFAULT_MIN_WITHDRAWAL_BLOCKS)
      const rewardBps = m.getParameter('rewardBps', DEFAULT_STAKING_REWARD_BPS)
      const maxSupply = m.getParameter('maxSupply', DEFAULT_MAX_SUPPLY)
      const networkStakingAddress = m.getParameter('networkStakingAddress', DEFAULT_NETWORK_STAKING_ADDRESS)

      const chain = m.contract('StakedXyoChainV2', [
        forkedChainId,
        forkedAtBlockNumber,
        forkedAtHash,
        rewards,
        minWithdrawalBlocks,
        token,
        rewardBps,
        networkStakingAddress,
        maxSupply,
      ])

      return { chain }
    }
