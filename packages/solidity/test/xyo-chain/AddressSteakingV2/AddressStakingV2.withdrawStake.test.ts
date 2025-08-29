import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  advanceBlocks, deployAddressStakingV2, mintAndApprove,
} from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.withdrawStake', () => {
  const amount = ethers.parseUnits('1000', 18)

  it('should allow withdrawal after required blocks', async () => {
    const [staker] = await ethers.getSigners()
    const {
      staking, token, minWithdrawalBlocks,
    } = await loadFixture(deployAddressStakingV2)

    await mintAndApprove(token, staker, staking, amount)
    expect(await token.balanceOf(staker)).to.equal(amount)
    await staking.connect(staker).addStake(staker, amount)
    expect(await token.balanceOf(staker)).to.equal(0)
    await staking.connect(staker).removeStake(0)

    await advanceBlocks(minWithdrawalBlocks)

    const tx = await staking.connect(staker).withdrawStake(0)
    await expect(tx).to.emit(staking, 'StakeWithdrawn')
    expect(await token.balanceOf(staker)).to.equal(amount)
  })

  it('should revert if not enough blocks have passed', async () => {
    const [staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    await mintAndApprove(token, staker, staking, amount)
    expect(await token.balanceOf(staker)).to.equal(amount)
    await staking.connect(staker).addStake(staker, amount)
    expect(await token.balanceOf(staker)).to.equal(0)
    await staking.connect(staker).removeStake(0)
    expect(await token.balanceOf(staker)).to.equal(0)

    await expect(
      staking.connect(staker).withdrawStake(0),
    ).to.be.revertedWith('Staking: not withdrawable')
    expect(await token.balanceOf(staker)).to.equal(0)
  })

  it('should revert if non-existent stake is withdrawn', async () => {
    const [staker] = await ethers.getSigners()
    const {
      staking, token, minWithdrawalBlocks,
    } = await loadFixture(deployAddressStakingV2)

    await mintAndApprove(token, staker, staking, amount)
    expect(await token.balanceOf(staker)).to.equal(amount)
    await staking.connect(staker).addStake(staker, amount)
    expect(await token.balanceOf(staker)).to.equal(0)
    await staking.connect(staker).removeStake(0)
    expect(await token.balanceOf(staker)).to.equal(0)

    await advanceBlocks(minWithdrawalBlocks)

    await expect(
      staking.connect(staker).withdrawStake(1),
    ).to.be.reverted
    expect(await token.balanceOf(staker)).to.equal(0)
  })

  it('should revert if already withdrawn', async () => {
    const [staker] = await ethers.getSigners()
    const {
      staking, token, minWithdrawalBlocks,
    } = await loadFixture(deployAddressStakingV2)

    await mintAndApprove(token, staker, staking, amount)
    expect(await token.balanceOf(staker)).to.equal(amount)
    await staking.connect(staker).addStake(staker, amount)
    expect(await token.balanceOf(staker)).to.equal(0)
    await staking.connect(staker).removeStake(0)

    await advanceBlocks(minWithdrawalBlocks)

    const tx = await staking.connect(staker).withdrawStake(0)
    await expect(tx).to.emit(staking, 'StakeWithdrawn')
    expect(await token.balanceOf(staker)).to.equal(amount)
    await expect(staking.connect(staker).withdrawStake(0)).to.be.reverted
    expect(await token.balanceOf(staker)).to.equal(amount)
  })
})
