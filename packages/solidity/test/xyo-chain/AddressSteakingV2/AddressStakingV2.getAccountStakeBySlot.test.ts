import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2, mintAndApprove } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.getAccountStakeBySlot', () => {
  it('should correctly return multiple stakes in unique slots', async () => {
    const [_, staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    const stake1 = ethers.parseUnits('500', 18)
    const stake2 = ethers.parseUnits('250', 18)

    await mintAndApprove(token, staker, staking, stake1 + stake2)

    await staking.connect(staker).addStake(staker, stake1)
    await staking.connect(staker).addStake(staker, stake2)

    const s0 = await staking.getAccountStakeBySlot(staker, 0)
    const s1 = await staking.getAccountStakeBySlot(staker, 1)

    expect(s0).to.equal(stake1)
    expect(s1).to.equal(stake2)
  })

  it('should show staked amount even after removal', async () => {
    const [_, staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    const stake1 = ethers.parseUnits('100', 18)
    const stake2 = ethers.parseUnits('200', 18)

    await mintAndApprove(token, staker, staking, stake1 + stake2)

    await staking.connect(staker).addStake(staker, stake1)
    await staking.connect(staker).addStake(staker, stake2)

    await staking.connect(staker).removeStake(1)

    const s1 = await staking.getAccountStakeBySlot(staker, 1)
    expect(s1).to.equal(stake2)

    const s0 = await staking.getAccountStakeBySlot(staker, 0)
    expect(s0).to.equal(stake1)
  })

  it('should track multiple stakers with separate slot indexes', async () => {
    const [_, stakerA, stakerB] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    const smallAmount = ethers.parseUnits('123', 18)

    await mintAndApprove(token, stakerA, staking, smallAmount)
    await mintAndApprove(token, stakerB, staking, smallAmount)

    await staking.connect(stakerA).addStake(stakerA, smallAmount)
    await staking.connect(stakerB).addStake(stakerB, smallAmount)

    const sA = await staking.getAccountStakeBySlot(stakerA, 0)
    const sB = await staking.getAccountStakeBySlot(stakerB, 0)

    expect(sA).to.equal(smallAmount)
    expect(sB).to.equal(smallAmount)
  })

  it('should revert when accessing a nonexistent slot', async () => {
    const [_, staker] = await ethers.getSigners()
    const { staking } = await loadFixture(deployAddressStakingV2)

    await expect(
      staking.getAccountStakeBySlot(staker, 0),
    ).to.be.reverted
  })
})
