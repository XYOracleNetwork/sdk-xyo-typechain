import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import chai from 'chai'
const { expect } = chai
import {
  advanceBlocks,
  deployXL1Governance, XL1GovernanceDefaultVotingDelay, XL1GovernanceDefaultVotingPeriod,
} from '../helpers/index.js'

describe('XL1Governance', () => {
  describe('clock', () => {
    it('should return the current block number as clock()', async () => {
      const { xl1Governance } = await loadFixture(deployXL1Governance)
      for (let index = 0; index < 5; index++) {
        const currentBlock = await ethers.provider.getBlockNumber()
        expect(await xl1Governance.clock()).to.equal(currentBlock)
        await advanceBlocks(1)
      }
    })
  })
  describe('CLOCK_MODE', () => {
    it('should return the clock mode', async () => {
      const { xl1Governance } = await loadFixture(deployXL1Governance)
      expect(await xl1Governance.CLOCK_MODE()).to.equal('mode=blocknumber&from=default')
    })
  })
  describe('quorum', () => {
    it('should have a quorum equal to the number of governors', async () => {
      const { xl1Governance } = await loadFixture(deployXL1Governance)
      expect(await xl1Governance.quorum(0)).to.equal(await xl1Governance.governorCount())
    })
  })
  describe('getVotes', () => {
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
  })

  describe('votingDelay', () => {
    it('should return voting delay', async () => {
      const { xl1Governance } = await loadFixture(deployXL1Governance)

      expect(await xl1Governance.votingDelay()).to.equal(XL1GovernanceDefaultVotingDelay)
    })
  })
  describe('votingPeriod', () => {
    it('should return voting period', async () => {
      const { xl1Governance } = await loadFixture(deployXL1Governance)

      expect(await xl1Governance.votingPeriod()).to.equal(XL1GovernanceDefaultVotingPeriod)
    })
  })
})
