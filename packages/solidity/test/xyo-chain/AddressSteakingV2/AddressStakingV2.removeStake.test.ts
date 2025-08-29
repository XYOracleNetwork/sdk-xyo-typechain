import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2, mintAndApprove } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.removeStake', () => {
  const amount = ethers.parseUnits('1000', 18)

  it.only('should allow a staker to remove a stake', async () => {
    const [_, staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    await mintAndApprove(token, staker, staking, amount)
    expect(await token.balanceOf(staker)).to.equal(amount)
    await staking.connect(staker).addStake(staker, amount)
    expect(await token.balanceOf(staker)).to.equal(0)

    const tx = await staking.connect(staker).removeStake(0)
    await expect(tx).to.emit(staking, 'StakeRemoved')
  })

  it('should revert if the stake is already removed', async () => {
    const [staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    await mintAndApprove(token, staker, staking, amount)
    expect(await token.balanceOf(staker)).to.equal(amount)
    await staking.connect(staker).addStake(staker, amount)
    expect(await token.balanceOf(staker)).to.equal(0)
    await staking.connect(staker).removeStake(0)

    await expect(
      staking.connect(staker).removeStake(0),
    ).to.be.revertedWith('Staking: not removable')
  })

  it('should revert if non-existent stake is removed', async () => {
    const [staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    await mintAndApprove(token, staker, staking, amount)
    expect(await token.balanceOf(staker)).to.equal(amount)
    await staking.connect(staker).addStake(staker, amount)
    expect(await token.balanceOf(staker)).to.equal(0)

    await expect(
      staking.connect(staker).removeStake(1),
    ).to.be.reverted
    describe('removeStake', () => {})
  })
})
