import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { advanceBlocks, deployAddressStakingV2 } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('AddressStakingV2', () => {
  const amount = ethers.parseUnits('1000', 18)

  const mintAndApprove = async (token, staker, stakingContract, amount) => {
    await token.mint(staker.address, amount)
    await token.connect(staker).approve(await stakingContract.getAddress(), amount)
  }

  describe('stakingTokenAddress', () => {
    it('should return staking token address', async () => {
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const tokenAddress = await token.getAddress()
      const stakingTokenAddress = await staking.stakingTokenAddress()
      await expect(stakingTokenAddress).to.equal(tokenAddress)
    })
  })
  describe('AddressStakingProperties', () => {
    const amount = ethers.parseUnits('1000', 18)

    it('should return correct minWithdrawalBlocks', async () => {
      const { staking, minWithdrawalBlocks } = await loadFixture(deployAddressStakingV2)
      const result = await staking.minWithdrawalBlocks()
      expect(result).to.equal(minWithdrawalBlocks)
    })

    it('should reflect correct activeByStaker and activeByAddressStaked after staking', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)

      const activeForStaker = await staking.activeByStaker(staker.address)
      const activeForTarget = await staking.activeByAddressStaked(staker.address)
      const globalActive = await staking.active()

      expect(activeForStaker).to.equal(amount)
      expect(activeForTarget).to.equal(amount)
      expect(globalActive).to.equal(amount)
    })

    it('should reflect pendingByStaker and pending after stake removal', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)
      await staking.connect(staker).removeStake(0)

      const pendingForStaker = await staking.pendingByStaker(staker.address)
      const globalPending = await staking.pending()

      expect(pendingForStaker).to.equal(amount)
      expect(globalPending).to.equal(amount)
    })

    it('should reflect withdrawnByStaker and withdrawn after withdrawal', async () => {
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
      const globalWithdrawn = await staking.withdrawn()

      expect(withdrawnForStaker).to.equal(amount)
      expect(globalWithdrawn).to.equal(amount)
    })
  })

  describe('addStake', () => {
    it('should allow a staker to add a stake', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      const tx = await staking.connect(staker).addStake(staker.address, amount)
      await expect(tx).to.emit(staking, 'StakeAdded')
    })

    it('should revert if amount is zero', async () => {
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
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)

      const tx = await staking.connect(staker).removeStake(0)
      await expect(tx).to.emit(staking, 'StakeRemoved')
    })

    it('should revert if the stake is already removed', async () => {
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)
      await staking.connect(staker).removeStake(0)

      await expect(
        staking.connect(staker).removeStake(0),
      ).to.be.revertedWith('Staking: not removable')
    })
  })

  describe('withdrawStake', () => {
    it('should revert if not enough blocks have passed', async () => {
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      await staking.connect(staker).addStake(staker.address, amount)
      await staking.connect(staker).removeStake(0)

      await expect(
        staking.connect(staker).withdrawStake(0),
      ).to.be.revertedWith('Staking: not withdrawable')
    })

    it('should allow withdrawal after required blocks', async () => {
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
  })

  describe('slashStake', () => {
    describe('when called by owner', () => {
      it('should allow slashing of stake', async () => {
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
    it('should return 0 (stubbed)', async () => {
      const { staking } = await loadFixture(deployAddressStakingV2)
      const result = await staking.stakedAddresses(1000)
      expect(result).to.equal(0)
    })
  })

  describe('getStake', () => {
    it('should correctly record multiple stakes in unique slots', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      const stake1 = ethers.parseUnits('500', 18)
      const stake2 = ethers.parseUnits('250', 18)

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
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      const stake1 = ethers.parseUnits('100', 18)
      const stake2 = ethers.parseUnits('200', 18)

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
      const [_, stakerA, stakerB] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      const smallAmount = ethers.parseUnits('123', 18)

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
})
