import hre from 'hardhat'

import { deployTestERC20 } from './deployTestERC20.js'
import { NETWORK_STAKING_ADDRESS } from './networkStaking.js'
const { ethers } = hre

export const deployAddressStakingV2 = async (minWithdrawalBlocks = 3, maxStakersPerAddress = 3) => {
  const { token } = await deployTestERC20()
  const Staking = await ethers.getContractFactory('AddressStakingV2')
  const staking = await Staking.deploy(
    minWithdrawalBlocks,
    await token.getAddress(),
    maxStakersPerAddress,
    NETWORK_STAKING_ADDRESS,
    1_000_000n * 10n ** 18n, /// 1,000,000 XYO
  )
  await staking.waitForDeployment()
  return {
    staking, token, minWithdrawalBlocks,
  }
}
