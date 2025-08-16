import { deployXyoChainRewards } from './XyoChainRewards.test.js'

export const deployXyoChain = async (forkParamsOverrides = {}, rewardsConfigOverrides = {}) => {
  const forkParams = { ...defaultForkParams, ...forkParamsOverrides }
  const { rewards, config } = await deployXyoChainRewards(rewardsConfigOverrides)

  const XyoChain = await ethers.getContractFactory('XyoChain')
  const chain = await XyoChain.deploy(
    forkParams.forkedChainId,
    forkParams.forkedAtBlockNumber,
    forkParams.forkedAtHash,
    await rewards.getAddress(),
  )
  return {
    chain, forkParams, rewards, rewardsConfig: config,
  }
}
