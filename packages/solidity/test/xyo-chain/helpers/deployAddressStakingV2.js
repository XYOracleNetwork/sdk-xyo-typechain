import { deployTestERC20 } from '../helpers/index.js'

export const deployAddressStakingV2 = async (minWithdrawalBlocks = 3) => {
  const { token } = await deployTestERC20()
  const Staking = await ethers.getContractFactory('AddressStakingV2')
  const staking = await Staking.deploy(minWithdrawalBlocks, await token.getAddress())
  await staking.waitForDeployment()
  return {
    staking, token, minWithdrawalBlocks,
  }
}
