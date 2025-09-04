import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2, mintAndApprove } from '../helpers/index.js'

const { ethers } = hre

describe.only('AddressStakingV2.stakedAddressWithMinStake', () => {
  describe('with single staker', () => {
    it('should show when a single staker has staked enough', async () => {
      // Arrange
      const [_, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const minStake = await staking.minStake()
      const amount = minStake + 1n
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)

      // Act
      const addresses = await staking.stakedAddressesWithMinStake()

      // Assert
      expect(addresses.length).to.equal(1)
      expect(addresses[0]).to.equal(staked.address)
    })
    it('should not show when a single staker has not staked enough', async () => {
      // Arrange
      // Arrange
      const [_, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const minStake = await staking.minStake()
      const amount = minStake - 1n
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)

      // Act
      const addresses = await staking.stakedAddressesWithMinStake()

      // Assert
      expect(addresses.length).to.equal(0)
    })
  })
  describe('with multiple stakers', () => {
    it('should allow multiple stakers to add a stake', async () => {
      // Arrange
      const [_, staked, stakerA, stakerB] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const stakers = new Set([stakerA, stakerB])
      const minStake = await staking.minStake()
      for (const staker of stakers) {
        const amount = (minStake / 2n) + 1n
        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked, amount)
      }

      // Act
      const addresses = await staking.stakedAddressesWithMinStake()

      // Assert
      expect(addresses.length).to.equal(1)
      expect(addresses[0]).to.equal(staked.address)
    })
  })
})
