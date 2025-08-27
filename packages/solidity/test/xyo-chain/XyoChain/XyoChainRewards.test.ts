import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'

import { deployXyoChainRewards } from '../helpers/index.js'

describe('XyoChainRewards', () => {
  describe('calcBlockReward', () => {
    it('returns genesis reward for block 0', async () => {
      const { rewards, config } = await loadFixture(deployXyoChainRewards)
      const reward = await rewards.calcBlockReward(0)
      expect(reward).to.equal(config.genesisReward)
    })

    it('returns correct reward after 1 step', async () => {
      const { rewards, config } = await loadFixture(deployXyoChainRewards)
      const reward = await rewards.calcBlockReward(config.stepSize)
      const expected = config.initialReward * config.stepFactorNumerator / config.stepFactorDenominator
      const floored = expected - (expected % (10n ** config.floorPlaces))
      expect(reward).to.equal(floored)
    })

    it('floors the reward to configured decimal places', async () => {
      const config = {
        initialReward: 1234n,
        stepSize: 1n,
        stepFactorNumerator: 95n,
        stepFactorDenominator: 100n,
        minRewardPerBlock: 1n,
        genesisReward: 5000n,
        floorPlaces: 2n,
      }
      const fixture = () => deployXyoChainRewards(config)
      const { rewards } = await loadFixture(fixture)
      const reward = await rewards.calcBlockReward(1)
      const expected = 1100n // manually calculated: floor(1234 * 0.95) = 1172.3 -> 1172.00
      expect(reward).to.equal(expected)
    })

    it('does not go below minRewardPerBlock', async () => {
      const config = {
        initialReward: 5n,
        stepSize: 1n,
        stepFactorNumerator: 1n,
        stepFactorDenominator: 2n,
        minRewardPerBlock: 2n,
        genesisReward: 100n,
        floorPlaces: 0n,
      }
      const fixture = () => deployXyoChainRewards(config)
      const { rewards } = await loadFixture(fixture)
      const reward = await rewards.calcBlockReward(10)
      expect(reward).to.equal(config.minRewardPerBlock)
    })
  })

  describe('calcBlockRewardPure', () => {
    it('matches calcBlockReward', async () => {
      const { rewards, config } = await loadFixture(deployXyoChainRewards)
      const rewardA = await rewards.calcBlockReward(150)
      const rewardB = await rewards.calcBlockRewardPure(150n, config)
      expect(rewardB).to.equal(rewardA)
    })
  })
})
