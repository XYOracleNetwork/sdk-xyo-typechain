import hre from 'hardhat'

import { deployTestERC20 } from './index.js'
const { ethers } = hre

export const deployAddressStakingV2 = async (minWithdrawalBlocks = 3) => {
  const { token } = await deployTestERC20()
  const Staking = await ethers.getContractFactory('AddressStakingV2')
  const staking = await Staking.deploy(
    minWithdrawalBlocks,
    await token.getAddress(),
    10,
    ethers.getAddress('0x1969196919691969196919691969196919691969'),
  )
  await staking.waitForDeployment()
  return {
    staking, token, minWithdrawalBlocks,
  }
}
