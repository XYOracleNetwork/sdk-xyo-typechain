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
