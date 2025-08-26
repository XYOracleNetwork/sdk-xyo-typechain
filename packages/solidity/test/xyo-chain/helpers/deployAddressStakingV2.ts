import hre from 'hardhat'

import { deployTestERC20 } from './deployTestERC20.js'
import { NETWORK_STAKING_ADDRESS } from './networkStaking.js'
const { ethers } = hre

export const deployAddressStakingV2 = async (minWithdrawalBlocks = 3) => {
  const { token } = await deployTestERC20()
  const Staking = await ethers.getContractFactory('AddressStakingV2')
  const staking = await Staking.deploy(
    minWithdrawalBlocks,
    await token.getAddress(),
    10,
    NETWORK_STAKING_ADDRESS,
  )
  await staking.waitForDeployment()
  return {
    staking, token, minWithdrawalBlocks,
  }
}
