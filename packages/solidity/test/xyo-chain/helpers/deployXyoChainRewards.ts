import hre from 'hardhat'

const { ethers } = hre

const defaultConfig = {
  initialReward: 1000n,
  stepSize: 100n,
  stepFactorNumerator: 9n,
  stepFactorDenominator: 10n,
  minRewardPerBlock: 100n,
  genesisReward: 5000n,
  floorPlaces: 1n,
}

export const deployXyoChainRewards = async (configOverrides = {}) => {
  const config = { ...defaultConfig, ...configOverrides }
  const Rewards = await ethers.getContractFactory('XyoChainRewards')
  const rewards = await Rewards.deploy(
    config.initialReward,
    config.stepSize,
    config.stepFactorNumerator,
    config.stepFactorDenominator,
    config.minRewardPerBlock,
    config.genesisReward,
    config.floorPlaces,
  )
  return { rewards, config }
}
