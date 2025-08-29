import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import type { AddressStakingV2, BridgeableToken } from '../../../typechain-types/index.js'
import { advanceBlocks, deployAddressStakingV2 } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.addStake', () => {
  const amount = ethers.parseUnits('1000', 18)

  const mintAndApprove = async (token: BridgeableToken, staker: HardhatEthersSigner, stakingContract: AddressStakingV2, amount: bigint) => {
    await token.mint(staker, amount)
    await token.connect(staker).approve(await stakingContract.getAddress(), amount)
  }

  describe('addStake', () => {
    it('should allow a staker to add a stake', async () => {
      const [_, staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await mintAndApprove(token, staker, staking, amount)
      const tx = await staking.connect(staker).addStake(staker, amount)
      await expect(tx).to.emit(staking, 'StakeAdded')
    })

    it('should revert if amount is zero', async () => {
      const [staker] = await ethers.getSigners()
      const { staking, token } = await loadFixture(deployAddressStakingV2)

      await token.mint(staker, amount)
      await token.connect(staker).approve(await staking.getAddress(), amount)

      await expect(
        staking.connect(staker).addStake(staker, 0),
      ).to.be.revertedWith('Staking: amount must be greater than 0')
    })
  })
})
