import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

import {
  DEFAULT_MAX_SUPPLY, DEFAULT_MIN_WITHDRAWAL_BLOCKS, DEFAULT_NETWORK_STAKING_ADDRESS, DEFAULT_STAKING_REWARD_BPS,
} from './ContractDefaults'

export const createAddressStakingV2Module = (m: IgnitionModuleBuilder) => {
  const minWithdrawalBlocks = m.getParameter('minWithdrawalBlocks', DEFAULT_MIN_WITHDRAWAL_BLOCKS)
  const rewardBps = m.getParameter('stakingRewardBps', DEFAULT_STAKING_REWARD_BPS)
  const maxSupply = m.getParameter('maxSupply', DEFAULT_MAX_SUPPLY)
  const networkStakingAddress = m.getParameter('networkStakingAddress', DEFAULT_NETWORK_STAKING_ADDRESS)

  const token = m.contract('TestERC20', [])
  const staking = m.contract('AddressStakingV2', [
    minWithdrawalBlocks,
    token,
    rewardBps,
    networkStakingAddress,
    maxSupply,
  ])

  return { staking, token }
}

export const AddressStakingV2Module = buildModule('AddressStakingV2', createAddressStakingV2Module)

export default AddressStakingV2Module
