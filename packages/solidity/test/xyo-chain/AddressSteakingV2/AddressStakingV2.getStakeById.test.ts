import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployAddressStakingV2, mintAndApprove } from '../helpers/index.js'

const { ethers } = hre

describe('AddressStakingV2.getStakeById', () => {
  it('should correctly record multiple stakes in unique stake IDs', async () => {
    const [_, staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    const stake1 = ethers.parseUnits('500', 18)
    const stake2 = ethers.parseUnits('250', 18)

    await mintAndApprove(token, staker, staking, stake1 + stake2)

    await staking.connect(staker).addStake(staker, stake1)
    await staking.connect(staker).addStake(staker, stake2)

    const s0 = await staking.getStakeById(0)
    const s1 = await staking.getStakeById(1)

    expect(s0.amount).to.equal(stake1)
    expect(s1.amount).to.equal(stake2)

    expect(s0.removeBlock).to.equal(0)
    expect(s1.removeBlock).to.equal(0)

    expect(s0.withdrawBlock).to.equal(0)
    expect(s1.withdrawBlock).to.equal(0)
  })

  it('should allow accessing stake IDs after removal', async () => {
    const [_, staker] = await ethers.getSigners()
    const { staking, token } = await loadFixture(deployAddressStakingV2)

    const stake1 = ethers.parseUnits('100', 18)
    const stake2 = ethers.parseUnits('200', 18)

    await mintAndApprove(token, staker, staking, stake1 + stake2)

    await staking.connect(staker).addStake(staker, stake1)
    await staking.connect(staker).addStake(staker, stake2)

    await staking.connect(staker).removeStake(1)

    const s1 = await staking.getStakeById(1)
    expect(s1.removeBlock).to.not.equal(0)

    const s0 = await staking.getStakeById(0)
    expect(s0.removeBlock).to.equal(0)
  })

  it('should revert when accessing a nonexistent stake ID', async () => {
    const { staking } = await loadFixture(deployAddressStakingV2)

    await expect(
      staking.getStakeById(0),
    ).to.be.reverted
  })
})
