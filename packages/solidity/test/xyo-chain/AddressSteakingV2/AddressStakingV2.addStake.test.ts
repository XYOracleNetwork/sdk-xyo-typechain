import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2, mintAndApprove } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.addStake', () => {
  const amount = ethers.parseUnits('1000', 18)

  describe('with single staker', () => {
    it('should allow a staker to add a stake', async () => {
      const [_, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      const tx = await staking.connect(staker).addStake(staked, amount)
      await expect(tx).to.emit(staking, 'StakeAdded')
    })
    it('should revert if amount is zero', async () => {
      const [_, staked, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await token.mint(staker, amount)
      await token.connect(staker).approve(await staking.getAddress(), amount)

      await expect(
        staking.connect(staker).addStake(staked, 0),
      ).to.be.revertedWith('Staking: amount must be greater than 0')
    })
  })
  describe('with multiple stakers', () => {
    describe('less than the max number of stakers', () => {
      it('should allow multiple stakers to add a stake', async () => {
        const [_, staked, stakerA, stakerB, stakerC] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)
        const stakers = new Set([stakerA, stakerB, stakerC])
        let totalStaked: bigint = 0n
        for (const staker of stakers) {
          totalStaked += amount
          await mintAndApprove(token, staker, staking, amount)
          const tx = await staking.connect(staker).addStake(staked, amount)
          await expect(tx).to.emit(staking, 'StakeAdded')
          expect(await staking.activeByStaker(staker)).to.equal(amount)
        }
        expect(await staking.activeByAddressStaked(staked)).to.equal(totalStaked)
        expect(await staking.getStakeCountForAddress(staked)).to.equal(stakers.size)
      })
    })
    describe('more than the max number of stakers', () => {
      it('should allow more than the maximum number of stakers to add a stake', async () => {
        const [_, staked, stakerA, stakerB, stakerC, stakerD, stakerE, stakerF] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)
        const stakers = [stakerA, stakerB, stakerC, stakerD, stakerE, stakerF]
        const resultantStakers = new Set([stakerD, stakerE, stakerF])
        let resultantStake: bigint = 0n

        for (const [i, staker] of stakers.entries()) {
          const stakeAmount = amount * (BigInt(i) + 1n)
          if (resultantStakers.has(staker)) resultantStake += stakeAmount
          await mintAndApprove(token, staker, staking, stakeAmount)
          const tx = await staking.connect(staker).addStake(staked, stakeAmount)
          await expect(tx).to.emit(staking, 'StakeAdded')
          expect(await staking.activeByStaker(staker)).to.equal(stakeAmount)
        }
        expect(await staking.activeByAddressStaked(staked)).to.equal(resultantStake)
        expect(await staking.getStakeCountForAddress(staked)).to.equal(resultantStakers.size)
      })
    })
  })
})
