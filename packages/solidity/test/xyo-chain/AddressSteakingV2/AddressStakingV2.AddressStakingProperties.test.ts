import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import type { AddressStakingV2, BridgeableToken } from '../../../typechain-types/index.js'
import { advanceBlocks, deployAddressStakingV2 } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.AddressStakingProperties', () => {
  const mintAndApprove = async (token: BridgeableToken, staker: HardhatEthersSigner, stakingContract: AddressStakingV2, amount: bigint) => {
    await token.mint(staker, amount)
    await token.connect(staker).approve(await stakingContract.getAddress(), amount)
  }

  const amount = ethers.parseUnits('1000', 18)

  describe('active', () => {
    it('should reflect correct amount after staking', async () => {
      const [_, staker, staked1, staked2] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked1, amount / 2n)
      await staking.connect(staker).addStake(staked2, amount / 2n)

      const globalActive = await staking.active()

      expect(globalActive).to.equal(amount)
    })
    it('should reflect correct amount after removal', async () => {
      const [_, staker, staked1, staked2] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked1, amount / 2n)
      await staking.connect(staker).addStake(staked2, amount / 2n)

      await staking.connect(staker).removeStake(0)

      const globalActive = await staking.active()

      expect(globalActive).to.equal(amount / 2n)
    })
    it('should reflect correct amount after withdraw', async () => {
      const [_, staker, staked1, staked2] = await ethers.getSigners()
      const {
        staking, token, minWithdrawalBlocks,
      } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staked1, amount / 2n)
      await staking.connect(staker).addStake(staked2, amount / 2n)

      await staking.connect(staker).removeStake(0)
      await advanceBlocks(minWithdrawalBlocks)
      await staking.connect(staker).withdrawStake(0)

      const globalActive = await staking.active()

      expect(globalActive).to.equal(amount / 2n)
    })
  })

  describe('activeByStaker', () => {
    describe('for staker address', () => {
      it('should reflect correct amount after staking', async () => {
        const [_, staker, staked1, staked2] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1, amount / 2n)
        await staking.connect(staker).addStake(staked2, amount / 2n)

        const activeForStaker = await staking.activeByStaker(staker)

        expect(activeForStaker).to.equal(amount)
      })
      it('should reflect correct amount after removal', async () => {
        const [_, staker, staked1, staked2] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1, amount / 2n)
        await staking.connect(staker).addStake(staked2, amount / 2n)
        await staking.connect(staker).removeStake(0)

        const activeForStaker = await staking.activeByStaker(staker)

        expect(activeForStaker).to.equal(amount / 2n)
      })
      it('should reflect correct amount after withdraw', async () => {
        const [_, staker, staked1, staked2] = await ethers.getSigners()
        const {
          staking, token, minWithdrawalBlocks,
        } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1, amount / 2n)
        await staking.connect(staker).addStake(staked2, amount / 2n)
        await staking.connect(staker).removeStake(0)
        await advanceBlocks(minWithdrawalBlocks)
        await staking.connect(staker).withdrawStake(0)

        const activeForStaker = await staking.activeByStaker(staker)

        expect(activeForStaker).to.equal(amount / 2n)
      })
    })
    describe('for non-staker address', () => {
      it('should be 0', async () => {
        const [_, staker, staked1, staked2, other] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1, amount / 2n)
        await staking.connect(staker).addStake(staked2, amount / 2n)

        const activeForStaker = await staking.activeByStaker(other)

        expect(activeForStaker).to.equal(0)
      })
    })
  })

  describe('activeByAddressStaked', () => {
    describe('for staked address', () => {
      it('should reflect correct amount after staking', async () => {
        const [_, staker, staked1, staked2] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1, amount / 2n)
        await staking.connect(staker).addStake(staked2, amount / 2n)

        const activeForTarget = await staking.activeByAddressStaked(staked1)

        expect(activeForTarget).to.equal(amount / 2n)
      })
      it('should be 0 after removal', async () => {
        const [_, staker, staked1, staked2] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1, amount / 2n)
        await staking.connect(staker).addStake(staked2, amount / 2n)
        await staking.connect(staker).removeStake(0)

        const activeForTarget = await staking.activeByAddressStaked(staked1)

        expect(activeForTarget).to.equal(0n)
      })
      it('should be 0 after withdraw', async () => {
        const [_, staker, staked1, staked2] = await ethers.getSigners()
        const {
          staking, token, minWithdrawalBlocks,
        } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1, amount / 2n)
        await staking.connect(staker).addStake(staked2, amount / 2n)
        await staking.connect(staker).removeStake(0)
        await advanceBlocks(minWithdrawalBlocks)
        await staking.connect(staker).withdrawStake(0)

        const activeForTarget = await staking.activeByAddressStaked(staked1)

        expect(activeForTarget).to.equal(0n)
      })
    })
    describe('for non-staked address', () => {
      it('should be 0', async () => {
        const [_, staker, staked1, staked2, other] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1, amount / 2n)
        await staking.connect(staker).addStake(staked2, amount / 2n)

        const activeForTarget = await staking.activeByAddressStaked(other)

        expect(activeForTarget).to.equal(0)
      })
    })
  })

  describe('minWithdrawalBlocks', () => {
    it('should return correct minWithdrawalBlocks', async () => {
      const { staking, minWithdrawalBlocks } = await loadFixture(deployAddressStakingV2)
      const result = await staking.minWithdrawalBlocks()
      expect(result).to.equal(minWithdrawalBlocks)
    })
  })

  describe('pending', () => {
    it('should reflect correct amount after removal', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker, amount)
      await staking.connect(staker).removeStake(0)

      const globalPending = await staking.pending()

      expect(globalPending).to.equal(amount)
    })
    it('should be 0 after withdraw', async () => {
      const [_, staker] = await ethers.getSigners()
      const {
        staking, token, minWithdrawalBlocks,
      } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker, amount)
      await staking.connect(staker).removeStake(0)
      await advanceBlocks(minWithdrawalBlocks)
      await staking.connect(staker).withdrawStake(0)

      const globalPending = await staking.pending()

      expect(globalPending).to.equal(0n)
    })
  })

  describe('pendingByStaker', () => {
    it('should reflect correct amount after removal', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker, amount)
      await staking.connect(staker).removeStake(0)

      const pendingForStaker = await staking.pendingByStaker(staker)

      expect(pendingForStaker).to.equal(amount)
    })
    it('should be 0 after withdraw', async () => {
      const [_, staker] = await ethers.getSigners()
      const {
        staking, token, minWithdrawalBlocks,
      } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker, amount)
      await staking.connect(staker).removeStake(0)
      await advanceBlocks(minWithdrawalBlocks)
      await staking.connect(staker).withdrawStake(0)

      const pendingForStaker = await staking.pendingByStaker(staker)

      expect(pendingForStaker).to.equal(0n)
    })
  })

  describe('withdrawn', () => {
    it('should reflect correct amount after withdrawal', async () => {
      const [_, staker] = await ethers.getSigners()
      const {
        staking, token, minWithdrawalBlocks,
      } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker, amount)
      await staking.connect(staker).removeStake(0)
      await advanceBlocks(minWithdrawalBlocks)
      await staking.connect(staker).withdrawStake(0)

      const globalWithdrawn = await staking.withdrawn()

      expect(globalWithdrawn).to.equal(amount)
    })
  })

  describe('withdrawnByStaker', () => {
    it('should be 0 before withdrawal', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker, amount)
      await staking.connect(staker).removeStake(0)

      const withdrawnForStaker = await staking.withdrawnByStaker(staker)

      expect(withdrawnForStaker).to.equal(0n)
    })
    it('should reflect correct amount after withdrawal', async () => {
      const [_, staker] = await ethers.getSigners()
      const {
        staking, token, minWithdrawalBlocks,
      } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker, amount)
      await staking.connect(staker).removeStake(0)
      await advanceBlocks(minWithdrawalBlocks)
      await staking.connect(staker).withdrawStake(0)

      const withdrawnForStaker = await staking.withdrawnByStaker(staker)

      expect(withdrawnForStaker).to.equal(amount)
    })
  })
})
