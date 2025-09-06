import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import { deploySingleAddressSubGovernor } from '../helpers/index.js'

const { ethers } = hre

describe('SingleAddressSubGovernor', () => {
  it('should return correct vote weight for owner', async () => {
    const { subGovernor, deployer } = await loadFixture(deploySingleAddressSubGovernor)

    expect(await subGovernor.getVotes(deployer.address, 0)).to.equal(1)
    expect(await subGovernor.getVotes(ethers.ZeroAddress, 0)).to.equal(0)
  })

  it('should return voting delay', async () => {
    const { subGovernor } = await loadFixture(deploySingleAddressSubGovernor)
    expect(await subGovernor.votingDelay()).to.be.greaterThan(0)
  })

  it('should return voting period', async () => {
    const { subGovernor } = await loadFixture(deploySingleAddressSubGovernor)
    expect(await subGovernor.votingPeriod()).to.be.greaterThan(0)
  })

  it('should return correct clock mode and value', async () => {
    const { subGovernor } = await loadFixture(deploySingleAddressSubGovernor)

    const currentBlock = await ethers.provider.getBlockNumber()
    expect(await subGovernor.clock()).to.equal(currentBlock)
    expect(await subGovernor.CLOCK_MODE()).to.equal('mode=blocknumber&from=default')
  })
})
