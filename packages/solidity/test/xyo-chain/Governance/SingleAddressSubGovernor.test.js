import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deploySingleAddressSubGovernor } from '../helpers/deploySingleAddressSubGovernor.js'
import chai from 'chai'
const { expect } = chai

describe('SingleAddressSubGovernor', () => {
  it('should initialize with correct owner and parent governor', async () => {
    const {
      subGovernor, mockGovernor, deployer,
    } = await loadFixture(deploySingleAddressSubGovernor)

    expect(await subGovernor.owner()).to.equal(deployer.address)
    expect(await subGovernor.parentGovernor()).to.equal(await mockGovernor.getAddress())
  })

  it('should return correct vote weight for owner', async () => {
    const { subGovernor, deployer } = await loadFixture(deploySingleAddressSubGovernor)

    expect(await subGovernor.getVotes(deployer.address, 0)).to.equal(1)
    expect(await subGovernor.getVotes(ethers.ZeroAddress, 0)).to.equal(0)
  })

  it('should return correct voting delay and period from parent', async () => {
    const { subGovernor } = await loadFixture(deploySingleAddressSubGovernor)

    expect(await subGovernor.votingDelay()).to.equal(1)
    expect(await subGovernor.votingPeriod()).to.equal(5)
  })

  it('should revert on propose', async () => {
    const { subGovernor } = await loadFixture(deploySingleAddressSubGovernor)

    await expect(
      subGovernor.propose([], [], [], 'Test'),
    ).to.be.revertedWith('Proposals are not allowed')
  })

  it('should revert on execute', async () => {
    const { subGovernor } = await loadFixture(deploySingleAddressSubGovernor)

    await expect(
      subGovernor.execute([], [], [], ethers.ZeroHash),
    ).to.be.revertedWith('Execution is not allowed')
  })

  it('should return correct clock mode and value', async () => {
    const { subGovernor } = await loadFixture(deploySingleAddressSubGovernor)

    const currentBlock = await ethers.provider.getBlockNumber()
    expect(await subGovernor.clock()).to.equal(currentBlock)
    expect(await subGovernor.CLOCK_MODE()).to.equal('mode=blocknumber&from=default')
  })
})
