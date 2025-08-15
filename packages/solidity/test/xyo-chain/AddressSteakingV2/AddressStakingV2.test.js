import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployAddressStakingV2 } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('AddressStakingV2', function () {
  const stakeAmount = ethers.parseUnits('1000', 18)

  async function mintAndApprove(token, staker, stakingContract, amount) {
    await token.mint(staker.address, amount)
    await token.connect(staker).approve(await stakingContract.getAddress(), amount)
  }

  describe('addStake()', function () {
    it('should allow a staker to add a stake', async function () {
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, stakeAmount)
      const tx = await staking.connect(staker).addStake(staker.address, stakeAmount)
      await expect(tx).to.emit(staking, 'StakeAdded')
    })

    it('should revert if amount is zero', async function () {
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await token.mint(staker.address, stakeAmount)
      await token.connect(staker).approve(await staking.getAddress(), stakeAmount)

      await expect(
        staking.connect(staker).addStake(staker.address, 0),
      ).to.be.revertedWith('Staking: amount must be greater than 0')
    })
  })
})
