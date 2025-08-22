import { deployTestERC20 } from './deployTestERC20.js'
import { deployXyoChainRewards } from './deployXyoChainRewards.js'

export const deployStakedXyoChainV2 = async ({
  forkedChainId = ethers.ZeroAddress,
  forkedAtBlockNumber = 0n,
  forkedAtHash = 0n,
  minWithdrawalBlocks = 5n,
  rewardOverrides = {},
} = {}) => {
  const [owner] = await ethers.getSigners()

  // Deploy ERC20 Token
  const { token } = await deployTestERC20()

  // Deploy Rewards Contract
  const { rewards, config: rewardConfig } = await deployXyoChainRewards(rewardOverrides)

  // Deploy StakedXyoChainV2
  const Factory = await ethers.getContractFactory('StakedXyoChainV2')
  const chain = await Factory.deploy(
    forkedChainId,
    forkedAtBlockNumber,
    forkedAtHash,
    await rewards.getAddress(),
    minWithdrawalBlocks,
    await token.getAddress(),
  )

  return {
    chain,
    token,
    rewards,
    rewardConfig,
    forkedChainId,
    forkedAtBlockNumber,
    forkedAtHash,
    minWithdrawalBlocks,
    owner,
  }
}
