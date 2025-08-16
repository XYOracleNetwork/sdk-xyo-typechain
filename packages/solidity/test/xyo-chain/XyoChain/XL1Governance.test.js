import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import chai from 'chai'
const { expect } = chai
import {
  deployXL1Governance, DefaultVotingDelay, DefaultVotingPeriod,
} from '../helpers/index.js'

describe('XL1Governance', () => {
  it('should return the current block number as clock()', async () => {
    const { xl1Governance } = await loadFixture(deployXL1Governance)
    const currentBlock = await ethers.provider.getBlockNumber()

    expect(await xl1Governance.clock()).to.equal(currentBlock)
  })

  it('should return the correct CLOCK_MODE string', async () => {
    const { xl1Governance } = await loadFixture(deployXL1Governance)
    expect(await xl1Governance.CLOCK_MODE()).to.equal('mode=blocknumber&from=default')
  })

  it('should have a quorum equal to the number of governors', async () => {
    const { xl1Governance } = await loadFixture(deployXL1Governance)
    expect(await xl1Governance.quorum(0)).to.equal(await xl1Governance.governorCount())
  })

  it('should allow checking vote power based on governor membership', async () => {
    const { xl1Governance } = await loadFixture(deployXL1Governance)
    const [signerA] = await ethers.getSigners()

    const fakeGovernor = await (
      await ethers.getContractFactory('SingleAddressSubGovernor')
    ).deploy(xl1Governance)

    // Initially not a governor, should return 0
    expect(await xl1Governance.getVotes(await fakeGovernor.getAddress(), 0)).to.equal(0)

    // Add governor and expect vote weight to be 1
    await xl1Governance.addGovernor(fakeGovernor)
    expect(await xl1Governance.getVotes(await fakeGovernor.getAddress(), 0)).to.equal(1)
  })

  it('should return true for known interfaces', async () => {
    const { xl1Governance } = await loadFixture(deployXL1Governance)

    // Use a known interface from OpenZeppelin Governor
    const INTERFACE_ID_GOVERNOR = '0x4f851a7e' // IGovernor interface ID
    expect(await xl1Governance.supportsInterface(INTERFACE_ID_GOVERNOR)).to.equal(true)
  })

  describe('votingDelay', () => {
    it('should return voting delay', async () => {
      const { xl1Governance } = await loadFixture(deployXL1Governance)

      expect(await xl1Governance.votingDelay()).to.equal(DefaultVotingDelay)
    })
  })
  describe('votingPeriod', () => {
    it('should return voting period', async () => {
      const { xl1Governance } = await loadFixture(deployXL1Governance)

      expect(await xl1Governance.votingPeriod()).to.equal(DefaultVotingPeriod)
    })
  })
})
