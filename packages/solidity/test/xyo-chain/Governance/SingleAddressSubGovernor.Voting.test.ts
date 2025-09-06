import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  advanceBlocks, createRandomProposal, deploySingleAddressSubGovernor, validateRandomProposalSucceeded, voteOnProposal,
} from '../helpers/index.js'

const { ethers } = hre

describe('SingleAddressSubGovernor.castVote', () => {
  it('should not require waiting for voting delay when all votes cast with status for', async () => {
    // Arrange
    const { subGovernor, deployer } = await loadFixture(deploySingleAddressSubGovernor)
    const ctx = await createRandomProposal(subGovernor)
    const {
      proposalId, targets, values, calldatas, descriptionHash,
    } = ctx

    // Act
    await voteOnProposal(subGovernor, proposalId, deployer, 'For')
    // Verify subGovernor has voted on proposal
    expect(await subGovernor.hasVoted(proposalId, deployer)).to.equal(true)
    // Advance required number of blocks
    await advanceBlocks(await subGovernor.votingPeriod() + 1n)
    // Execute the proposal
    await subGovernor.execute(targets, values, calldatas, descriptionHash)

    // Assert
    await validateRandomProposalSucceeded(ctx)
  })
})
