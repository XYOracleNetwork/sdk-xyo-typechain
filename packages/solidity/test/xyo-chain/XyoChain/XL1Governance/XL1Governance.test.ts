import { expect } from 'chai'
import { network } from 'hardhat'

import type { VoteType } from '../../helpers/index.js'
import {
  advanceBlocks,
  createRandomProposal,
  deployXL1GovernanceWithSingleAddressSubGovernor,
  validateRandomProposalFailed,
  validateRandomProposalSucceeded,
  voteThroughSubGovernor,
  XL1GovernanceDefaultVotingDelay,
  XL1GovernanceDefaultVotingPeriod,
} from '../../helpers/index.js'

describe('XL1Governance', () => {
  describe('clock', () => {
    it('should return the current block number as clock()', async () => {
      const { ethers, networkHelpers } = await network.connect()
      const { loadFixture } = networkHelpers
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
      const { networkHelpers } = await network.connect()
      const { loadFixture } = networkHelpers
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
      expect(await xl1Governance.CLOCK_MODE()).to.equal('mode=blocknumber&from=default')
    })
  })
  describe('quorum', () => {
    it('should have a quorum equal to the number of governors', async () => {
      const { networkHelpers } = await network.connect()
      const { loadFixture } = networkHelpers
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
      expect(await xl1Governance.quorum(0)).to.equal(await xl1Governance.governorCount())
    })
  })
  // describe.skip('getVotes', () => {
  //   it('should allow checking vote power based on governor membership', async () => {
  //     const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

  //     const fakeGovernor = await (
  //       await ethers.getContractFactory('SingleAddressSubGovernor')
  //     ).deploy(xl1Governance)

  //     // Initially not a governor, should return 0
  //     expect(await xl1Governance.getVotes(await fakeGovernor.getAddress(), 0)).to.equal(0)

  //     // Add governor and expect vote weight to be 1
  //     await xl1Governance.addGovernor(fakeGovernor)
  //     expect(await xl1Governance.getVotes(await fakeGovernor.getAddress(), 0)).to.equal(1)
  //   })
  // })

  describe('supportsInterface', () => {
    it('should return check for interface support', async () => {
      const { networkHelpers } = await network.connect()
      const { loadFixture } = networkHelpers
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      const NON_EXISTENT_INTERFACE = '0x12345678'
      expect(await xl1Governance.supportsInterface(NON_EXISTENT_INTERFACE)).to.equal(false)
    })
  })

  describe('votingDelay', () => {
    it('should return voting delay', async () => {
      const { networkHelpers } = await network.connect()
      const { loadFixture } = networkHelpers
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      expect(await xl1Governance.votingDelay()).to.equal(XL1GovernanceDefaultVotingDelay)
    })
  })
  describe('votingPeriod', () => {
    it('should return voting period', async () => {
      const { networkHelpers } = await network.connect()
      const { loadFixture } = networkHelpers
      const { xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)

      expect(await xl1Governance.votingPeriod()).to.equal(XL1GovernanceDefaultVotingPeriod)
    })
  })
  describe('GovernorCountingUnanimous', () => {
    describe('with single subGovernor', () => {
      it('should pass if subGovernor votes For', async () => {
        const { networkHelpers } = await network.connect()
        const { loadFixture } = networkHelpers
        const voteType: VoteType = 'For'
        const { xl1Governance, subGovernor } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
        const ctx = await createRandomProposal(xl1Governance)
        const {
          proposalId: parentProposalId, targets, values, calldatas, descriptionHash, proposer,
        } = ctx

        // Cast vote via subGovernor
        await voteThroughSubGovernor({
          parentGovernor: xl1Governance, subGovernor, parentProposalId, proposer, voteType,
        })

        // Move past voting period
        await advanceBlocks(await subGovernor.votingPeriod() + 10n)

        // Verify subGovernor has voted on parent proposal
        expect(await xl1Governance.hasVoted(parentProposalId, await subGovernor.getAddress())).to.equal(true)

        // Execute the parent proposal
        await xl1Governance.execute(targets, values, calldatas, descriptionHash)

        // Validate proposal succeeded
        await validateRandomProposalSucceeded(ctx)
      })

      it('should not pass if subGovernor votes Against', async () => {
        const { networkHelpers } = await network.connect()
        const { loadFixture } = networkHelpers
        const voteType: VoteType = 'Against'
        const { xl1Governance, subGovernor } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
        const ctx = await createRandomProposal(xl1Governance)
        const {
          proposalId: parentProposalId, targets, values, calldatas, descriptionHash, proposer,
        } = ctx

        // Cast vote via subGovernor
        await voteThroughSubGovernor({
          parentGovernor: xl1Governance, subGovernor, parentProposalId, proposer, voteType,
        })

        // Move past voting period
        await advanceBlocks(await subGovernor.votingPeriod() + 10n)

        // Verify subGovernor has voted on parent proposal
        expect(await xl1Governance.hasVoted(parentProposalId, await subGovernor.getAddress())).to.equal(true)

        // Execute the parent proposal
        await expect(
          xl1Governance.execute(targets, values, calldatas, descriptionHash),
        ).to.be.reverted

        // Validate proposal succeeded
        await validateRandomProposalFailed(ctx)
      })
    })
    describe.skip('with multiple subGovernors', () => {
      it.skip('should succeed proposal if no against votes', async () => {
        await Promise.reject(new Error('Not implemented'))
      })
      it.skip('should only reach quorum with enough FOR or ABSTAIN votes', async () => {
        await Promise.reject(new Error('Not implemented'))
      })
    })
  })
})
