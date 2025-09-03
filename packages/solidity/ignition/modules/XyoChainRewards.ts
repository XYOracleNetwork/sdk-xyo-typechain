import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

export const createXyoChainRewardsModule = (m: IgnitionModuleBuilder) => {
  const initialReward = m.getParameter('initialReward')
  const stepSize = m.getParameter('stepSize')
  const stepFactorNumerator = m.getParameter('stepFactorNumerator')
  const stepFactorDenominator = m.getParameter('stepFactorDenominator')
  const minRewardPerBlock = m.getParameter('minRewardPerBlock')
  const genesisReward = m.getParameter('genesisReward')
  const floorPlaces = m.getParameter('floorPlaces')

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
