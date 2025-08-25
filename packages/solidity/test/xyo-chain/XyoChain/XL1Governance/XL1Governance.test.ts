import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  advanceBlocks,
  deployTestERC20,
  deployXL1GovernanceWithSingleAddressSubGovernor,
  ProposalState,
  proposeToCallSmartContract,
  proposeToTransferTokens,
  XL1GovernanceDefaultVotingDelay,
  XL1GovernanceDefaultVotingPeriod,
} from '../../helpers/index.js'

const { ethers } = hre

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
  describe('GovernorCountingUnanimous', () => {
    it.only('should correctly count votes and reflect in proposalVotes and hasVoted', async () => {
      const [_, proposer, recipient] = await ethers.getSigners()
      const { xl1Governance, subGovernor } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
      const { token, owner } = await loadFixture(deployTestERC20)
      const amount = 1000n

      const {
        proposalId, targets, values, calldatas, descriptionHash,
      } = await proposeToTransferTokens(xl1Governance, token, owner, recipient, amount, proposer)

      // Move past voting delay
      await advanceBlocks(await xl1Governance.votingDelay())

      // Propose subGovernor call xl1Governance.castVote(parentId, 1) by proposer
      const {
        proposalId: subProposalId,
        targets: subProposalTargets,
        values: subProposalValues,
        calldatas: subProposalCalldatas,
        descriptionHash: subProposalDescriptionHash,
      } = await proposeToCallSmartContract(xl1Governance, 'castVote', [proposalId, 1n], subGovernor, proposer)

      // Check the subGovernor proposal state
      expect(await subGovernor.state(subProposalId)).to.equal(ProposalState.Pending)

      // Move past voting delay
      await advanceBlocks((await subGovernor.votingDelay()) + 1n)

      // Check the subGovernor proposal state
      expect(await subGovernor.state(subProposalId)).to.equal(ProposalState.Active)

      // Vote on the subGovernor's proposal
      await subGovernor.castVote(subProposalId, 1n) // 1 = For

      // Move past voting period
      await advanceBlocks(await subGovernor.votingPeriod() + 10n)

      // Check the subGovernor proposal state
      expect(await subGovernor.state(subProposalId)).to.equal(ProposalState.Succeeded)
      const [againstVotes, forVotes, abstainVotes] = await subGovernor.proposalVotes(subProposalId)
      expect(againstVotes).to.equal(0n)
      expect(forVotes).to.equal(1n)
      expect(abstainVotes).to.equal(0n)

      // Verify the subGovernor has not yet voted
      expect(await xl1Governance.hasVoted(proposalId, await subGovernor.getAddress())).to.equal(false)

      // Execute the proposal to vote on the xl1Governance
      await subGovernor.execute(subProposalTargets, subProposalValues, subProposalCalldatas, subProposalDescriptionHash)

      // Assert recipient has not received tokens yet
      expect(await token.balanceOf(await recipient.getAddress())).to.equal(0n)

      // Queue and execute the proposal
      await xl1Governance.execute(targets, values, calldatas, descriptionHash)

      // Check the recipient received the tokens
      expect(await token.balanceOf(await recipient.getAddress())).to.equal(amount)
    })

    it('should fail proposal if there is an against vote', async () => {
      const [_, proposer, recipient] = await ethers.getSigners()
      const { xl1Governance, deployer } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
      const { token, owner } = await loadFixture(deployTestERC20)

      const { proposalId } = await proposeToTransferTokens(xl1Governance, token, owner, recipient, 1000n, proposer)

      await advanceBlocks(await xl1Governance.votingDelay())

      // Cast AGAINST vote
      await xl1Governance.castVote(proposalId, 0)

      expect(await xl1Governance.hasVoted(proposalId, await deployer.getAddress())).to.equal(true)

      // expect(voteSucceeded).to.equal(false)
    })

    // it.skip('should succeed proposal if no against votes', async () => {
    //   const { xl1Governance, deployer } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

    //   const targets = [await deployer.getAddress()]
    //   const values = [0]
    //   const calldatas = [deployer.interface.encodeFunctionData('balanceOf', [await deployer.getAddress()])]
    //   const description = 'Unanimous proposal'

    //   const proposalId = await xl1Governance.propose(targets, values, calldatas, description)

    //   await advanceBlocks(await xl1Governance.votingDelay())

    //   // Cast FOR vote
    //   await xl1Governance.castVote(proposalId, 1)

    //   const voteSucceeded = await xl1Governance.callStatic._voteSucceeded(proposalId)
    //   expect(voteSucceeded).to.equal(true)
    // })

    // it.skip('should only reach quorum with enough FOR or ABSTAIN votes', async () => {
    //   const { xl1Governance, deployer } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

    //   const targets = [await deployer.getAddress()]
    //   const values = [0]
    //   const calldatas = [deployer.interface.encodeFunctionData('balanceOf', [await deployer.getAddress()])]
    //   const description = 'Quorum check'

    //   const proposalId = await xl1Governance.propose(targets, values, calldatas, description)

    //   await advanceBlocks(await xl1Governance.votingDelay())

    //   // Cast ABSTAIN vote
    //   await xl1Governance.castVote(proposalId, 2)

    //   const quorumReached = await xl1Governance.callStatic._quorumReached(proposalId)
    //   expect(quorumReached).to.equal(true)
    // })
  })
})
