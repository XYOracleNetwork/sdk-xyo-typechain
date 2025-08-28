import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

const MIN_WITHDRAWAL_BLOCKS = 3
const MAX_SUPPLY = 1_000_000n * 10n ** 18n // 1,000,000 XYO
const DEFAULT_STAKING_REWARD_BPS = 10
const DEFAULT_NETWORK_STAKING_ADDRESS = '0x1969196919691969196919691969196919691969'

export const createAddressStakingV2Module = (m: IgnitionModuleBuilder) => {
  const minWithdrawalBlocks = m.getParameter('minWithdrawalBlocks', MIN_WITHDRAWAL_BLOCKS)
  const rewardBps = m.getParameter('stakingRewardBps', DEFAULT_STAKING_REWARD_BPS)
  const maxSupply = m.getParameter('maxSupply', MAX_SUPPLY)
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
