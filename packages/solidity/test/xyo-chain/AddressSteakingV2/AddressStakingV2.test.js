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
})
