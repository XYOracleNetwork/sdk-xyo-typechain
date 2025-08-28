import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

import { DEFAULT_XYO_REWARD_CONFIG } from './ContractDefaults'

export const createXyoChainRewardsModule = (m: IgnitionModuleBuilder) => {
  const initialReward = m.getParameter('initialReward', DEFAULT_XYO_REWARD_CONFIG.initialReward)
  const stepSize = m.getParameter('stepSize', DEFAULT_XYO_REWARD_CONFIG.stepSize)
  const stepFactorNumerator = m.getParameter('stepFactorNumerator', DEFAULT_XYO_REWARD_CONFIG.stepFactorNumerator)
  const stepFactorDenominator = m.getParameter('stepFactorDenominator', DEFAULT_XYO_REWARD_CONFIG.stepFactorDenominator)
  const minRewardPerBlock = m.getParameter('minRewardPerBlock', DEFAULT_XYO_REWARD_CONFIG.minRewardPerBlock)
  const genesisReward = m.getParameter('genesisReward', DEFAULT_XYO_REWARD_CONFIG.genesisReward)
  const floorPlaces = m.getParameter('floorPlaces', DEFAULT_XYO_REWARD_CONFIG.floorPlaces)

  const rewards = m.contract('XyoChainRewards', [
    initialReward,
    stepSize,
    stepFactorNumerator,
    stepFactorDenominator,
    minRewardPerBlock,
    genesisReward,
    floorPlaces,
  ])

  return { rewards }
}

export const XyoChainRewardsModule = buildModule('XyoChainRewards', createXyoChainRewardsModule)

export default XyoChainRewardsModule
