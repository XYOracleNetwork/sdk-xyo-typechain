import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import type { AddressStakingV2, BridgeableToken } from '../../../typechain-types/index.js'
import { deployAddressStakingV2 } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.slashStake', () => {
  const amount = ethers.parseUnits('1000', 18)

  const mintAndApprove = async (token: BridgeableToken, staker: HardhatEthersSigner, stakingContract: AddressStakingV2, amount: bigint) => {
    await token.mint(staker, amount)
    await token.connect(staker).approve(await stakingContract.getAddress(), amount)
  }

  describe('with amount', () => {
    it('less than amount staked should allow slashing', async () => {
      // Arrange
      const [owner, staker, staked] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)

      // Act
      const tx = await staking.connect(owner).slashStake(staked, amount / 2n)

      // Assert
      await expect(tx).to.emit(staking, 'StakeSlashed')
      expect(await staking.slashed()).to.equal(amount / 2n)
      expect(await staking.activeByStaker(staker)).to.equal(amount / 2n)
      expect(await staking.activeByAddressStaked(staked)).to.equal(amount / 2n)
    })
    it('equal to amount staked should allow slashing', async () => {
      // Arrange
      const [owner, staker, staked] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)

      // Act
      const tx = await staking.connect(owner).slashStake(staked, amount)

      // Assert
      await expect(tx).to.emit(staking, 'StakeSlashed')
      expect(await staking.slashed()).to.equal(amount)
      expect(await staking.activeByStaker(staker)).to.equal(0n)
      expect(await staking.activeByAddressStaked(staked)).to.equal(0n)
    })
    it('more than amount staked should slash all available', async () => {
      // Arrange
      const [owner, staker, staked] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)
      expect(await staking.activeByStaker(staker)).to.equal(amount)
      expect(await staking.activeByAddressStaked(staked)).to.equal(amount)

      // Act
      const tx = await staking.connect(owner).slashStake(staked, amount * 2n)

      // Assert
      await expect(tx).to.emit(staking, 'StakeSlashed')
      expect(await staking.slashed()).to.equal(amount)
      expect(await staking.activeByStaker(staker)).to.equal(0n)
      expect(await staking.activeByAddressStaked(staked)).to.equal(0n)
    })
    it('should revert for non-staker', async () => {
      const [owner, staker, staked, other] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked, amount)

      await expect(
        staking.connect(owner).slashStake(other, amount / 2n),
      ).to.be.reverted
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
        expect(await staking.activeByStaker(staker)).to.equal(amount)
        expect(await staking.activeByAddressStaked(staked)).to.equal(amount)

        // Act
        await staking.connect(owner).slashStake(staked, amount / 2n)

        // Assert
        expect(await staking.active()).to.equal(amount / 2n)
        expect(await staking.activeByStaker(staker)).to.equal(amount / 2n)
        expect(await staking.activeByAddressStaked(staked)).to.equal(amount / 2n)
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
        expect(await staking.pending()).to.equal(amount)
        expect(await staking.activeByStaker(staker)).to.equal(0n)
        expect(await staking.activeByAddressStaked(staked)).to.equal(0n)

        // Act
        await staking.connect(owner).slashStake(staked, amount / 2n)

        // Assert
        expect(await staking.active()).to.equal(0n)
        expect(await staking.pending()).to.equal(amount / 2n)
        expect(await staking.activeByStaker(staker)).to.equal(0n)
        expect(await staking.activeByAddressStaked(staked)).to.equal(0n)
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
          expect(await staking.pending()).to.equal(amount / 2n)
          expect(await staking.activeByStaker(staker)).to.equal(amount / 2n)
          expect(await staking.activeByAddressStaked(staked)).to.equal(amount / 2n)

          // Act
          await staking.connect(owner).slashStake(staked, amount / 2n)

          // Assert
          expect(await staking.active()).to.equal(amount / 2n / 2n)
          expect(await staking.pending()).to.equal(amount / 2n / 2n)
          expect(await staking.activeByStaker(staker)).to.equal(amount / 2n / 2n)
          expect(await staking.activeByAddressStaked(staked)).to.equal(amount / 2n / 2n)
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
  })
})
