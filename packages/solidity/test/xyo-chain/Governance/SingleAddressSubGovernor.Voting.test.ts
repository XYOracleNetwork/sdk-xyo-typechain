import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'

import {
  advanceBlocks, createRandomProposal, deploySingleAddressSubGovernor, validateRandomProposalSucceeded, voteOnProposal,
} from '../helpers/index.js'

describe('SingleAddressSubGovernor.castVote', () => {
  it('should not require waiting for voting delay when all votes cast with status for', async () => {
    // Arrange
    // NOTE: Set this to true to see test succeed when waiting entire voting delay
    const waitFullVotingDelay = false
    const { subGovernor, deployer } = await loadFixture(deploySingleAddressSubGovernor)
    const ctx = await createRandomProposal(subGovernor)
    const {
      proposalId, targets, values, calldatas, descriptionHash,
    } = ctx

    // Act
    await voteOnProposal(subGovernor, proposalId, deployer, 'For')
    // Verify subGovernor has voted on proposal
    expect(await subGovernor.hasVoted(proposalId, deployer)).to.equal(true)
    // // Advance required number of blocks
    if (waitFullVotingDelay) await advanceBlocks(await subGovernor.votingPeriod() + 1n)
    // Execute the proposal
    await subGovernor.execute(targets, values, calldatas, descriptionHash)

    // Assert
    await validateRandomProposalSucceeded(ctx)
  })
})
