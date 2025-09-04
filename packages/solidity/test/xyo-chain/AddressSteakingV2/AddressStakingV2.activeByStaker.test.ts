import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2, mintAndApprove } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.activeByStaker', () => {
  describe('should show active staked', () => {
    it('with single staker', async () => {
      // Arrange
      const [_, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const minStake = await staking.minStake()
      const amount = minStake + 1n
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)

      // Act
      const active = await staking.activeByStaker(staker)

      // Assert
      expect(active).to.be.equal(amount)
    })
  })
  it('with multiple stakers', async () => {
    // Arrange
    const [_, staked, stakerA, stakerB] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)
    const stakers = new Set([stakerA, stakerB])
    const minStake = await staking.minStake()
    const amount = minStake + 1n
    for (const staker of stakers) {
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)
    }

    for (const staker of stakers) {
      // Act
      const active = await staking.activeByStaker(staker)

      // Assert
      expect(active).to.be.equal(amount)
    }
  })
  it('with removed stake', async () => {
    // Arrange
    const [_, staked, staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)
    const minStake = await staking.minStake()
    const amount = minStake * 2n * 2n
    await mintAndApprove(token, staker, staking, amount)
    await staking.connect(staker).addStake(staked, amount / 2n)
    await staking.connect(staker).addStake(staked, amount / 2n)
    await staking.connect(staker).removeStake(0)

    // Act
    const active = await staking.activeByStaker(staker)

    // Assert
    expect(active).to.be.equal(amount / 2n)
  })
  it('with slashed stake', async () => {
    // Arrange
    const [owner, staked, staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)
    const minStake = await staking.minStake()
    const amount = minStake * 2n
    await mintAndApprove(token, staker, staking, amount)
    await staking.connect(staker).addStake(staked, amount / 2n)
    await staking.connect(staker).addStake(staked, amount / 2n)
    await staking.connect(owner).slashStake(staked, amount / 2n)

    // Act
    const active = await staking.activeByStaker(staker)

    // Assert
    expect(active).to.be.equal(amount / 2n)
  })
})
