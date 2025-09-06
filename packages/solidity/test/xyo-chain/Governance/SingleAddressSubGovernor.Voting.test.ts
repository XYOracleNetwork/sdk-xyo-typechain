import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deploySingleAddressSubGovernor } from '../helpers/index.js'

const { ethers } = hre

describe('SingleAddressSubGovernor.castVote', () => {
  it('should return correct vote weight for owner', async () => {
    const { subGovernor, deployer } = await loadFixture(deploySingleAddressSubGovernor)

    expect(await subGovernor.getVotes(deployer.address, 0)).to.equal(1)
    expect(await subGovernor.getVotes(ethers.ZeroAddress, 0)).to.equal(0)
  })
})
