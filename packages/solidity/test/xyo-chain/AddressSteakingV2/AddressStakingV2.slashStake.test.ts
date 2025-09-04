import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2, mintAndApprove } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.slashStake', () => {
  const amount = ethers.parseUnits('1000', 18)

  describe('with amount', () => {
    it('less than amount staked should allow slashing', async () => {
      // Arrange
      const [owner, staker, staked] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)
      expect(await staking.active()).to.equal(amount)
      expect(await staking.activeByAddressStaked(staked)).to.equal(amount)
      expect(await staking.activeByStaker(staker)).to.equal(amount)
      expect(await staking.slashed()).to.equal(0n)

      // Act
      const tx = await staking.connect(owner).slashStake(staked, amount / 2n)

      // Assert
      await expect(tx).to.emit(staking, 'StakeSlashed')
      expect(await staking.active()).to.equal(amount / 2n)
      expect(await staking.activeByAddressStaked(staked)).to.equal(amount / 2n)
      expect(await staking.activeByStaker(staker)).to.equal(amount / 2n)
      expect(await staking.slashed()).to.equal(amount / 2n)
    })
    it('equal to amount staked should allow slashing', async () => {
      // Arrange
      const [owner, staker, staked] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)
      expect(await staking.active()).to.equal(amount)
      expect(await staking.activeByAddressStaked(staked)).to.equal(amount)
      expect(await staking.activeByStaker(staker)).to.equal(amount)
      expect(await staking.slashed()).to.equal(0n)

      // Act
      const tx = await staking.connect(owner).slashStake(staked, amount)

      // Assert
      await expect(tx).to.emit(staking, 'StakeSlashed')
      expect(await staking.active()).to.equal(0n)
      expect(await staking.activeByAddressStaked(staked)).to.equal(0n)
      expect(await staking.activeByStaker(staker)).to.equal(0n)
      expect(await staking.slashed()).to.equal(amount)
    })
    it('more than amount staked should slash all available', async () => {
      // Arrange
      const [owner, staker, staked] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)
      expect(await staking.active()).to.equal(amount)
      expect(await staking.activeByStaker(staker)).to.equal(amount)
      expect(await staking.activeByAddressStaked(staked)).to.equal(amount)
      expect(await staking.slashed()).to.equal(0n)

      // Act
      const tx = await staking.connect(owner).slashStake(staked, amount * 2n)

      // Assert
      await expect(tx).to.emit(staking, 'StakeSlashed')
      expect(await staking.active()).to.equal(0n)
      expect(await staking.activeByAddressStaked(staked)).to.equal(0n)
      expect(await staking.activeByStaker(staker)).to.equal(0n)
      expect(await staking.slashed()).to.equal(amount)
    })
    it('should revert for non-staker', async () => {
      const [owner, staker, staked, other] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)
      expect(await staking.active()).to.equal(amount)
      expect(await staking.activeByAddressStaked(staked)).to.equal(amount)
      expect(await staking.activeByStaker(staker)).to.equal(amount)
      expect(await staking.slashed()).to.equal(0n)

      await expect(
        staking.connect(owner).slashStake(other, amount / 2n),
      ).to.be.reverted
      expect(await staking.active()).to.equal(amount)
      expect(await staking.activeByAddressStaked(other)).to.equal(0n)
      expect(await staking.activeByAddressStaked(staked)).to.equal(amount)
      expect(await staking.activeByStaker(other)).to.equal(0n)
      expect(await staking.activeByStaker(staker)).to.equal(amount)
      expect(await staking.slashed()).to.equal(0n)
    })
  })
  describe('should update totals', () => {
    describe('with only active stake', () => {
      it('should be reduced by amount', async () => {
        // Arrange
        const [owner, staker, staked] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)
        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked, amount)
        expect(await staking.active()).to.equal(amount)
        expect(await staking.activeByAddressStaked(staked)).to.equal(amount)
        expect(await staking.activeByStaker(staker)).to.equal(amount)
        expect(await staking.slashed()).to.equal(0n)

        // Act
        await staking.connect(owner).slashStake(staked, amount / 2n)

        // Assert
        expect(await staking.active()).to.equal(amount / 2n)
        expect(await staking.activeByStaker(staker)).to.equal(amount / 2n)
        expect(await staking.activeByAddressStaked(staked)).to.equal(amount / 2n)
        expect(await staking.slashed()).to.equal(amount / 2n)
      })
    })
    describe('with only pending stake', () => {
      it('should be reduced by amount', async () => {
        // Arrange
        const [owner, staker, staked] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)
        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked, amount)
        await staking.connect(staker).removeStake(0)
        expect(await staking.active()).to.equal(0)
        expect(await staking.activeByAddressStaked(staked)).to.equal(0n)
        expect(await staking.activeByStaker(staker)).to.equal(0n)
        expect(await staking.pending()).to.equal(amount)
        expect(await staking.slashed()).to.equal(0n)

        // Act
        await staking.connect(owner).slashStake(staked, amount / 2n)

        // Assert
        expect(await staking.active()).to.equal(0n)
        expect(await staking.activeByAddressStaked(staked)).to.equal(0n)
        expect(await staking.activeByStaker(staker)).to.equal(0n)
        expect(await staking.pending()).to.equal(amount / 2n)
        expect(await staking.slashed()).to.equal(amount / 2n)
      })
    })
    describe('with active and pending stake', () => {
      describe('when equal', () => {
        it('should be reduced equivalently', async () => {
          // Arrange
          const [owner, staker, staked] = await ethers.getSigners()
          const { staking, token } = await loadFixture(deployAddressStakingV2)
          await mintAndApprove(token, staker, staking, amount)
          await staking.connect(staker).addStake(staked, amount / 2n)
          await staking.connect(staker).addStake(staked, amount / 2n)
          await staking.connect(staker).removeStake(0)
          expect(await staking.active()).to.equal(amount / 2n)
          expect(await staking.activeByAddressStaked(staked)).to.equal(amount / 2n)
          expect(await staking.activeByStaker(staker)).to.equal(amount / 2n)
          expect(await staking.pending()).to.equal(amount / 2n)

          // Act
          const slashAmount = amount / 2n
          await staking.connect(owner).slashStake(staked, slashAmount)

          // Assert
          const activeAmount = slashAmount / 2n
          const pendingAmount = slashAmount / 2n
          expect(await staking.active()).to.equal(activeAmount)
          expect(await staking.activeByAddressStaked(staked)).to.equal(activeAmount)
          expect(await staking.activeByStaker(staker)).to.equal(activeAmount)
          expect(await staking.pending()).to.equal(pendingAmount)
          expect(await staking.slashed()).to.equal(slashAmount)
        })
      })
    })
  })
  it('when called by non-owner should revert', async () => {
    const [_owner, staker, staked, other] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    await mintAndApprove(token, staker, staking, amount)
    await staking.connect(staker).addStake(staked, amount)

    await expect(
      staking.connect(other).slashStake(staked, amount / 2n),
    ).to.be.reverted
    expect(await staking.slashed()).to.equal(0n)
  })
})
