import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2, mintAndApprove } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.stakedAddressWithMinStake', () => {
  describe('with single staker', () => {
    it('should show address when address has enough staked', async () => {
      // Arrange
      const [_, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const minStake = await staking.minStake()
      const amount = minStake + 1n
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)

      // Act
      const addresses = await staking.stakedAddressesWithMinStake()
      const count = await staking.stakedAddressesWithMinStakeCount()

      // Assert
      const active = await staking.activeByAddressStaked(staked)
      expect(active).to.be.greaterThanOrEqual(minStake)
      expect(addresses.length).to.equal(1)
      expect(count).to.equal(1)
      expect(addresses[0]).to.equal(staked.address)
    })
    it('should not show address when address does not have enough staked', async () => {
      // Arrange
      const [_, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const minStake = await staking.minStake()
      const amount = minStake - 1n
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)

      // Act
      const addresses = await staking.stakedAddressesWithMinStake()
      const count = await staking.stakedAddressesWithMinStakeCount()

      // Assert
      const active = await staking.activeByAddressStaked(staked)
      expect(active).to.be.lessThan(minStake)
      expect(addresses.length).to.equal(0)
      expect(count).to.equal(0)
    })
  })
  describe('with multiple stakers', () => {
    it('should show address when address has enough staked', async () => {
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
      const count = await staking.stakedAddressesWithMinStakeCount()

      // Assert
      const active = await staking.activeByAddressStaked(staked)
      expect(active).to.be.greaterThanOrEqual(minStake)
      expect(addresses.length).to.equal(1)
      expect(count).to.equal(1)
      expect(addresses[0]).to.equal(staked.address)
    })
    it('should not show address when address does not have enough staked', async () => {
      // Arrange
      const [_, staked, stakerA, stakerB] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const stakers = new Set([stakerA, stakerB])
      const minStake = await staking.minStake()
      for (const staker of stakers) {
        const amount = (minStake / 2n) - 1n
        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked, amount)
      }

      // Act
      const addresses = await staking.stakedAddressesWithMinStake()
      const count = await staking.stakedAddressesWithMinStakeCount()

      // Assert
      const active = await staking.activeByAddressStaked(staked)
      expect(active).to.be.lessThan(minStake)
      expect(addresses.length).to.equal(0)
      expect(count).to.equal(0)
    })
  })
  describe('with removed stake', () => {
    it('should show address when address has enough staked', async () => {
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
      const addresses = await staking.stakedAddressesWithMinStake()
      const count = await staking.stakedAddressesWithMinStakeCount()

      // Assert
      const active = await staking.activeByAddressStaked(staked)
      expect(active).to.be.greaterThanOrEqual(minStake)
      expect(addresses.length).to.equal(1)
      expect(count).to.equal(1)
      expect(addresses[0]).to.equal(staked.address)
    })
    it('should not show address when address does not have enough staked', async () => {
      // Arrange
      const [_, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const minStake = await staking.minStake()
      const amount = minStake * 2n * 2n
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount / 2n)
      await staking.connect(staker).addStake(staked, amount / 2n)
      await staking.connect(staker).removeStake(0)
      await staking.connect(staker).removeStake(1)

      // Act
      const addresses = await staking.stakedAddressesWithMinStake()
      const count = await staking.stakedAddressesWithMinStakeCount()

      // Assert
      const active = await staking.activeByAddressStaked(staked)
      expect(active).to.be.lessThan(minStake)
      expect(addresses.length).to.equal(0)
      expect(count).to.equal(0)
    })
  })
  describe('with slashed stake', () => {
    it('should show address when address has enough staked', async () => {
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
      const addresses = await staking.stakedAddressesWithMinStake()
      const count = await staking.stakedAddressesWithMinStakeCount()

      // Assert
      const active = await staking.activeByAddressStaked(staked)
      expect(active).to.be.greaterThanOrEqual(minStake)
      expect(addresses.length).to.equal(1)
      expect(count).to.equal(1)
      expect(addresses[0]).to.equal(staked.address)
    })
    it('should not show address when address does not have enough staked', async () => {
      // Arrange
      const [owner, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const minStake = await staking.minStake()
      const amount = minStake * 2n
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount / 2n)
      await staking.connect(staker).addStake(staked, amount / 2n)
      await staking.connect(owner).slashStake(staked, amount / 2n)
      await staking.connect(owner).slashStake(staked, amount / 2n)

      // Act
      const addresses = await staking.stakedAddressesWithMinStake()
      const count = await staking.stakedAddressesWithMinStakeCount()

      // Assert
      const active = await staking.activeByAddressStaked(staked)
      expect(active).to.be.equal(0n)
      expect(addresses.length).to.equal(0)
      expect(count).to.equal(0)
    })
  })
})
