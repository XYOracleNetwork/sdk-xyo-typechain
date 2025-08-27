import { expect } from 'chai'
import { network } from 'hardhat'

import { deployStakedXyoChainV2 } from './helpers/index.js'

describe('StakedXyoChainV2', () => {
  it('should deploy successfully and return correct initial values', async () => {
    const { networkHelpers } = await network.connect()
    const { loadFixture } = networkHelpers
    const {
      chain,
      forkedAtBlockNumber,
      forkedAtHash,
      forkedChainId,
      minWithdrawalBlocks,
      rewards,
      token,
    } = await loadFixture(deployStakedXyoChainV2)

    expect(await chain.forkedChainId()).to.equal(forkedChainId)
    expect(await chain.forkedAtBlockNumber()).to.equal(forkedAtBlockNumber)
    expect(await chain.forkedAtHash()).to.equal(forkedAtHash)
    expect(await chain.rewardsContract()).to.equal(await rewards.getAddress())
    expect(await chain.stakingTokenAddress()).to.equal(await token.getAddress())
    expect(await chain.minWithdrawalBlocks()).to.equal(minWithdrawalBlocks)
  })

  it('should initialize with reward config accessible via the rewards contract', async () => {
    const { networkHelpers } = await network.connect()
    const { loadFixture } = networkHelpers
    const {
      rewards,
      rewardConfig: {
        floorPlaces,
        genesisReward,
        initialReward,
        stepFactorDenominator,
        stepFactorNumerator,
        stepSize,
      },
    } = await loadFixture(deployStakedXyoChainV2)

    // Validate genesis reward (block 0)
    expect(await rewards.calcBlockReward(0)).to.equal(genesisReward)

    // Validate block reward after one step
    const expectedStep1 = ((initialReward * stepFactorNumerator) / stepFactorDenominator)
      - (((initialReward * stepFactorNumerator) / stepFactorDenominator)
        % 10n ** floorPlaces)

    expect(await rewards.calcBlockReward(stepSize)).to.equal(expectedStep1)
  })
})
