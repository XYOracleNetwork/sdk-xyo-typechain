import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/types'
import { expect } from 'chai'
import { parseUnits } from 'ethers'
import { network } from 'hardhat'

import type { AddressStakingV2, BridgeableToken } from '../../../typechain-types/index.js'
import { advanceBlocks, deployAddressStakingV2 } from '../helpers/index.js'

describe('AddressStakingV2', () => {
  const amount = parseUnits('1000', 18)

  const mintAndApprove = async (token: BridgeableToken, staker: HardhatEthersSigner, stakingContract: AddressStakingV2, amount: bigint) => {
    await token.mint(staker.address, amount)
    await token.connect(staker).approve(await stakingContract.getAddress(), amount)
  }

  describe('addStake', () => {
    it('should allow a staker to add a stake', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      const tx = await staking.connect(staker).addStake(staker.address, amount)
      await expect(tx).to.emit(staking, 'StakeAdded')
    })

    it('should revert if amount is zero', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await token.mint(staker.address, amount)
      await token.connect(staker).approve(await staking.getAddress(), amount)

      await expect(
        staking.connect(staker).addStake(staker.address, 0),
      ).to.be.revertedWith('Staking: amount must be greater than 0')
    })
  })

  describe('removeStake', () => {
    it('should allow a staker to remove a stake', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)

      const tx = await staking.connect(staker).removeStake(0)
      await expect(tx).to.emit(staking, 'StakeRemoved')
    })

    it('should revert if the stake is already removed', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)
      await staking.connect(staker).removeStake(0)

      await expect(
        staking.connect(staker).removeStake(0),
      ).to.be.revertedWith('Staking: not removable')
    })

    it('should revert if non-existent stake is removed', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)

      await expect(
        staking.connect(staker).removeStake(1),
      ).to.be.reverted
    })
  })

  describe('withdrawStake', () => {
    it('should allow withdrawal after required blocks', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [staker] = await ethers.getSigners()
      const {
        staking, token, minWithdrawalBlocks,
      } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)
      await staking.connect(staker).removeStake(0)

      // Mine required number of blocks
      await advanceBlocks(minWithdrawalBlocks)

      const tx = await staking.connect(staker).withdrawStake(0)
      await expect(tx).to.emit(staking, 'StakeWithdrawn')
    })
    it('should revert if not enough blocks have passed', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)
      await staking.connect(staker).removeStake(0)

      await expect(
        staking.connect(staker).withdrawStake(0),
      ).to.be.revertedWith('Staking: not withdrawable')
    })
    it('should revert if non-existent stake is withdrawn', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [staker] = await ethers.getSigners()
      const {
        staking, token, minWithdrawalBlocks,
      } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)
      await staking.connect(staker).removeStake(0)

      await advanceBlocks(minWithdrawalBlocks)

      await expect(
        staking.connect(staker).withdrawStake(1),
      ).to.be.reverted
    })
  })

  describe('slashStake', () => {
    describe('when called by owner', () => {
      it('should allow slashing of stake', async () => {
        const { networkHelpers, ethers } = await network.connect()
        const { loadFixture } = networkHelpers
        const [owner, staker, staked] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked.address, amount)

        const tx = await staking.connect(owner).slashStake(staked.address, amount / 2n)
        await expect(tx).to.emit(staking, 'StakeSlashed')
      })
    })
    describe('when called by non-owner', () => {
      it('should revert', async () => {
        const { networkHelpers, ethers } = await network.connect()
        const { loadFixture } = networkHelpers
        const [_owner, staker, staked, other] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked.address, amount)

        await expect(
          staking.connect(other).slashStake(staked.address, amount / 2n),
        ).to.be.reverted
      })
    })
  })

  describe('stakedAddresses', () => {
    it('should be 0 (stubbed)', async () => {
      const { networkHelpers } = await network.connect()
      const { loadFixture } = networkHelpers
      const { staking } = await loadFixture(deployAddressStakingV2)
      const result = await staking.stakedAddressesWithMinStakeCount()
      expect(result).to.equal(0)
    })
  })

  describe('getStake', () => {
    it('should correctly record multiple stakes in unique slots', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      const stake1 = parseUnits('500', 18)
      const stake2 = parseUnits('250', 18)

      await mintAndApprove(token, staker, staking, stake1 + stake2)

      await staking.connect(staker).addStake(staker.address, stake1)
      await staking.connect(staker).addStake(staker.address, stake2)

      const s0 = await staking.getStake(staker.address, 0)
      const s1 = await staking.getStake(staker.address, 1)

      expect(s0.amount).to.equal(stake1)
      expect(s1.amount).to.equal(stake2)

      expect(s0.removeBlock).to.equal(0)
      expect(s1.removeBlock).to.equal(0)

      expect(s0.withdrawBlock).to.equal(0)
      expect(s1.withdrawBlock).to.equal(0)
    })

    it('should allow each slot to be removed independently', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      const stake1 = parseUnits('100', 18)
      const stake2 = parseUnits('200', 18)

      await mintAndApprove(token, staker, staking, stake1 + stake2)

      await staking.connect(staker).addStake(staker.address, stake1)
      await staking.connect(staker).addStake(staker.address, stake2)

      await staking.connect(staker).removeStake(1)

      const s1 = await staking.getStake(staker.address, 1)
      expect(s1.removeBlock).to.not.equal(0)

      const s0 = await staking.getStake(staker.address, 0)
      expect(s0.removeBlock).to.equal(0)
    })

    it('should track multiple stakers with separate slot indexes', async () => {
      const { networkHelpers, ethers } = await network.connect()
      const { loadFixture } = networkHelpers
      const [_, stakerA, stakerB] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      const smallAmount = parseUnits('123', 18)

      await mintAndApprove(token, stakerA, staking, smallAmount)
      await mintAndApprove(token, stakerB, staking, smallAmount)

      await staking.connect(stakerA).addStake(stakerA.address, smallAmount)
      await staking.connect(stakerB).addStake(stakerB.address, smallAmount)

      const sA = await staking.getStake(stakerA.address, 0)
      const sB = await staking.getStake(stakerB.address, 0)

      expect(sA.amount).to.equal(smallAmount)
      expect(sB.amount).to.equal(smallAmount)
      expect(sA.staked).to.equal(stakerA.address)
      expect(sB.staked).to.equal(stakerB.address)
    })

    it('should revert when accessing a nonexistent slot', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking } = await loadFixture(deployAddressStakingV2)

      await expect(
        staking.getStake(staker.address, 0),
      ).to.be.reverted
    })
  })

  describe('AddressStakingProperties', () => {
    const amount = parseUnits('1000', 18)

    describe('active', () => {
      it('should reflect correct amount after staking', async () => {
        const [_, staker, staked1, staked2] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1.address, amount / 2n)
        await staking.connect(staker).addStake(staked2.address, amount / 2n)

        const globalActive = await staking.active()

        expect(globalActive).to.equal(amount)
      })
      it('should reflect correct amount after removal', async () => {
        const [_, staker, staked1, staked2] = await ethers.getSigners()
        const { staking, token } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staked1.address, amount / 2n)
        await staking.connect(staker).addStake(staked2.address, amount / 2n)

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
        await staking.connect(staker).addStake(staked1.address, amount / 2n)
        await staking.connect(staker).addStake(staked2.address, amount / 2n)

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
          await staking.connect(staker).addStake(staked1.address, amount / 2n)
          await staking.connect(staker).addStake(staked2.address, amount / 2n)

          const activeForStaker = await staking.activeByStaker(staker.address)

          expect(activeForStaker).to.equal(amount)
        })
        it('should reflect correct amount after removal', async () => {
          const [_, staker, staked1, staked2] = await ethers.getSigners()
          const { staking, token } = await loadFixture(deployAddressStakingV2)

          await mintAndApprove(token, staker, staking, amount)
          await staking.connect(staker).addStake(staked1.address, amount / 2n)
          await staking.connect(staker).addStake(staked2.address, amount / 2n)
          await staking.connect(staker).removeStake(0)

          const activeForStaker = await staking.activeByStaker(staker.address)

          expect(activeForStaker).to.equal(amount / 2n)
        })
        it('should reflect correct amount after withdraw', async () => {
          const [_, staker, staked1, staked2] = await ethers.getSigners()
          const {
            staking, token, minWithdrawalBlocks,
          } = await loadFixture(deployAddressStakingV2)

          await mintAndApprove(token, staker, staking, amount)
          await staking.connect(staker).addStake(staked1.address, amount / 2n)
          await staking.connect(staker).addStake(staked2.address, amount / 2n)
          await staking.connect(staker).removeStake(0)
          await advanceBlocks(minWithdrawalBlocks)
          await staking.connect(staker).withdrawStake(0)

          const activeForStaker = await staking.activeByStaker(staker.address)

          expect(activeForStaker).to.equal(amount / 2n)
        })
      })
      describe('for non-staker address', () => {
        it('should be 0', async () => {
          const [_, staker, staked1, staked2, other] = await ethers.getSigners()
          const { staking, token } = await loadFixture(deployAddressStakingV2)

          await mintAndApprove(token, staker, staking, amount)
          await staking.connect(staker).addStake(staked1.address, amount / 2n)
          await staking.connect(staker).addStake(staked2.address, amount / 2n)

          const activeForStaker = await staking.activeByStaker(other.address)

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
          await staking.connect(staker).addStake(staked1.address, amount / 2n)
          await staking.connect(staker).addStake(staked2.address, amount / 2n)

          const activeForTarget = await staking.activeByAddressStaked(staked1.address)

          expect(activeForTarget).to.equal(amount / 2n)
        })
        it('should be 0 after removal', async () => {
          const [_, staker, staked1, staked2] = await ethers.getSigners()
          const { staking, token } = await loadFixture(deployAddressStakingV2)

          await mintAndApprove(token, staker, staking, amount)
          await staking.connect(staker).addStake(staked1.address, amount / 2n)
          await staking.connect(staker).addStake(staked2.address, amount / 2n)
          await staking.connect(staker).removeStake(0)

          const activeForTarget = await staking.activeByAddressStaked(staked1.address)

          expect(activeForTarget).to.equal(0n)
        })
        it('should be 0 after withdraw', async () => {
          const [_, staker, staked1, staked2] = await ethers.getSigners()
          const {
            staking, token, minWithdrawalBlocks,
          } = await loadFixture(deployAddressStakingV2)

          await mintAndApprove(token, staker, staking, amount)
          await staking.connect(staker).addStake(staked1.address, amount / 2n)
          await staking.connect(staker).addStake(staked2.address, amount / 2n)
          await staking.connect(staker).removeStake(0)
          await advanceBlocks(minWithdrawalBlocks)
          await staking.connect(staker).withdrawStake(0)

          const activeForTarget = await staking.activeByAddressStaked(staked1.address)

          expect(activeForTarget).to.equal(0n)
        })
      })
      describe('for non-staked address', () => {
        it('should be 0', async () => {
          const [_, staker, staked1, staked2, other] = await ethers.getSigners()
          const { staking, token } = await loadFixture(deployAddressStakingV2)

          await mintAndApprove(token, staker, staking, amount)
          await staking.connect(staker).addStake(staked1.address, amount / 2n)
          await staking.connect(staker).addStake(staked2.address, amount / 2n)

          const activeForTarget = await staking.activeByAddressStaked(other.address)

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
        await staking.connect(staker).addStake(staker.address, amount)
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
        await staking.connect(staker).addStake(staker.address, amount)
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
        await staking.connect(staker).addStake(staker.address, amount)
        await staking.connect(staker).removeStake(0)

        const pendingForStaker = await staking.pendingByStaker(staker.address)

        expect(pendingForStaker).to.equal(amount)
      })
      it('should be 0 after withdraw', async () => {
        const [_, staker] = await ethers.getSigners()
        const {
          staking, token, minWithdrawalBlocks,
        } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staker.address, amount)
        await staking.connect(staker).removeStake(0)
        await advanceBlocks(minWithdrawalBlocks)
        await staking.connect(staker).withdrawStake(0)

        const pendingForStaker = await staking.pendingByStaker(staker.address)

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
        await staking.connect(staker).addStake(staker.address, amount)
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
        await staking.connect(staker).addStake(staker.address, amount)
        await staking.connect(staker).removeStake(0)

        const withdrawnForStaker = await staking.withdrawnByStaker(staker.address)

        expect(withdrawnForStaker).to.equal(0n)
      })
      it('should reflect correct amount after withdrawal', async () => {
        const [_, staker] = await ethers.getSigners()
        const {
          staking, token, minWithdrawalBlocks,
        } = await loadFixture(deployAddressStakingV2)

        await mintAndApprove(token, staker, staking, amount)
        await staking.connect(staker).addStake(staker.address, amount)
        await staking.connect(staker).removeStake(0)
        await advanceBlocks(minWithdrawalBlocks)
        await staking.connect(staker).withdrawStake(0)

        const withdrawnForStaker = await staking.withdrawnByStaker(staker.address)

        expect(withdrawnForStaker).to.equal(amount)
      })
    })
  })

  describe('TransferStake', () => {
    describe('stakingTokenAddress', () => {
      it('should return staking token address', async () => {
        const { staking, token } = await loadFixture(deployAddressStakingV2)
        const tokenAddress = await token.getAddress()
        const stakingTokenAddress = await staking.stakingTokenAddress()
        await expect(stakingTokenAddress).to.equal(tokenAddress)
      })
    })
  })
})
