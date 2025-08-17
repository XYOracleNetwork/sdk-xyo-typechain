import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import chai from 'chai'
const { expect } = chai
import {
  advanceBlocks,
  deployXL1GovernanceWithSingleAddressSubGovernor, XL1GovernanceDefaultVotingDelay, XL1GovernanceDefaultVotingPeriod,
} from '../../helpers/index.js'

describe('XL1Governance', () => {
  describe('clock', () => {
    it('should return the current block number as clock()', async () => {
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
      for (let index = 0; index < 5; index++) {
        const currentBlock = await ethers.provider.getBlockNumber()
        expect(await xl1Governance.clock()).to.equal(currentBlock)
        await advanceBlocks(1)
      }
    })
  })
  describe('CLOCK_MODE', () => {
    it('should return the clock mode', async () => {
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
      expect(await xl1Governance.CLOCK_MODE()).to.equal('mode=blocknumber&from=default')
    })
  })
  describe('quorum', () => {
    it('should have a quorum equal to the number of governors', async () => {
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
      expect(await xl1Governance.quorum(0)).to.equal(await xl1Governance.governorCount())
    })
  })
  describe.skip('getVotes', () => {
    it('should allow checking vote power based on governor membership', async () => {
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

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

  describe('supportsInterface', () => {
    it('should return check for interface support', async () => {
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      const NON_EXISTENT_INTERFACE = '0x12345678'
      expect(await xl1Governance.supportsInterface(NON_EXISTENT_INTERFACE)).to.equal(false)
    })
  })

  describe('votingDelay', () => {
    it('should return voting delay', async () => {
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      expect(await xl1Governance.votingDelay()).to.equal(XL1GovernanceDefaultVotingDelay)
    })
  })
  describe('votingPeriod', () => {
    it('should return voting period', async () => {
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      expect(await xl1Governance.votingPeriod()).to.equal(XL1GovernanceDefaultVotingPeriod)
    })
  })
  describe.skip('GovernorCountingUnanimous', () => {
    it('should correctly count votes and reflect in proposalVotes and hasVoted', async () => {
      const { xl1Governance, deployer } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      // Create a dummy proposal
      const targets = [await deployer.getAddress()]
      const values = [0]
      const calldatas = [deployer.interface.encodeFunctionData('balanceOf', [await deployer.getAddress()])]
      const description = 'Test unanimous proposal'

      const descriptionHash = ethers.id(description)

      const proposalId = await xl1Governance.propose(targets, values, calldatas, description)

      // Advance to voting start
      await advanceBlocks(await xl1Governance.votingDelay())

      // Vote FOR
      await xl1Governance.castVote(proposalId, 1)

      const [against, forVotes, abstain] = await xl1Governance.proposalVotes(proposalId)
      expect(against).to.equal(0)
      expect(forVotes).to.equal(1)
      expect(abstain).to.equal(0)

      expect(await xl1Governance.hasVoted(proposalId, await deployer.getAddress())).to.equal(true)
    })

    it('should fail proposal if there is an against vote', async () => {
      const { xl1Governance, deployer } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      const targets = [await deployer.getAddress()]
      const values = [0]
      const calldatas = [deployer.interface.encodeFunctionData('balanceOf', [await deployer.getAddress()])]
      const description = 'Proposal with opposition'
      const descriptionHash = ethers.id(description)

      const proposalId = await xl1Governance.propose(targets, values, calldatas, description)

      await advanceBlocks(await xl1Governance.votingDelay())

      // Cast AGAINST vote
      await xl1Governance.castVote(proposalId, 0)

      expect(await xl1Governance.hasVoted(proposalId, await deployer.getAddress())).to.equal(true)

      const voteSucceeded = await xl1Governance.callStatic._voteSucceeded(proposalId)
      expect(voteSucceeded).to.equal(false)
    })

    it('should succeed proposal if no against votes', async () => {
      const { xl1Governance, deployer } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      const targets = [await deployer.getAddress()]
      const values = [0]
      const calldatas = [deployer.interface.encodeFunctionData('balanceOf', [await deployer.getAddress()])]
      const description = 'Unanimous proposal'
      const descriptionHash = ethers.id(description)

      const proposalId = await xl1Governance.propose(targets, values, calldatas, description)

      await advanceBlocks(await xl1Governance.votingDelay())

      // Cast FOR vote
      await xl1Governance.castVote(proposalId, 1)

      const voteSucceeded = await xl1Governance.callStatic._voteSucceeded(proposalId)
      expect(voteSucceeded).to.equal(true)
    })

    it('should only reach quorum with enough FOR or ABSTAIN votes', async () => {
      const { xl1Governance, deployer } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      const targets = [await deployer.getAddress()]
      const values = [0]
      const calldatas = [deployer.interface.encodeFunctionData('balanceOf', [await deployer.getAddress()])]
      const description = 'Quorum check'
      const descriptionHash = ethers.id(description)

      const proposalId = await xl1Governance.propose(targets, values, calldatas, description)

      await advanceBlocks(await xl1Governance.votingDelay())

      // Cast ABSTAIN vote
      await xl1Governance.castVote(proposalId, 2)

      const quorumReached = await xl1Governance.callStatic._quorumReached(proposalId)
      expect(quorumReached).to.equal(true)
    })
  })
})
