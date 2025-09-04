import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2 } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.setMinStake', () => {
  describe('when called by owner', () => {
    it('should update min stake', async () => {
      // Arrange
      const [owner] = await ethers.getSigners()
      const { staking } = await loadFixture(deployAddressStakingV2)
      const original = await staking.minStake()

      // Act
      const updated = original + 1n
      await staking.connect(owner).setMinStake(updated)

      // Assert
      expect(await staking.minStake()).to.equal(updated)
    })
  })
  describe('when called by non-owner', () => {
    it('should revert', async () => {
      // Arrange
      const [_, nonOwner] = await ethers.getSigners()
      const { staking } = await loadFixture(deployAddressStakingV2)
      const original = await staking.minStake()

      // Act
      const updated = original + 1n
      await expect(
        staking.connect(nonOwner).setMinStake(updated),
      ).to.be.reverted

      // Assert
      expect(await staking.minStake()).to.equal(original)
    })
  })
})
