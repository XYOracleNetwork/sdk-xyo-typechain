import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

export const createXyoChainRewardsModule = (m: IgnitionModuleBuilder) => {
  const floorPlaces = m.getParameter('floorPlaces')
  const genesisReward = m.getParameter('genesisReward')
  const initialReward = m.getParameter('initialReward')
  const minRewardPerBlock = m.getParameter('minRewardPerBlock')
  const stepFactorDenominator = m.getParameter('stepFactorDenominator')
  const stepFactorNumerator = m.getParameter('stepFactorNumerator')
  const stepSize = m.getParameter('stepSize')

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
