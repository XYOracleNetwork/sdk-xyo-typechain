import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  advanceBlocks,
  deploySingleAddressSubGovernor, deployXL1GovernanceWithSingleAddressSubGovernor, ProposalState, ProposalVote, proposeToCallSmartContract,
  voteThroughSubGovernor,
} from '../helpers/index.js'

const { ethers } = hre

describe.only('GovernorGroup', () => {
  it('should allow adding governors', async () => {
    const [_, proposer] = await ethers.getSigners()
    const { xl1Governance, subGovernor } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
    const subGovernorAddress = await subGovernor.getAddress()

    // Ensure subGovernor is governor so they can vote on proposals
    expect(await xl1Governance.governorCount()).to.equal(1)
    expect(await xl1Governance.isGovernor(subGovernorAddress)).to.equal(true)

    // Create new subGovernor to add
    const { subGovernor: newSubGovernor } = await loadFixture(deploySingleAddressSubGovernor)
    expect(await xl1Governance.isGovernor(await subGovernor.getAddress())).to.equal(true)

    // Create proposal to add new subGovernor
    const {
      proposalId: parentProposalId, targets, values, calldatas, descriptionHash,
    } = await proposeToCallSmartContract(xl1Governance, 'addGovernor', [await newSubGovernor.getAddress()], subGovernor, proposer)

    // Cast vote via subGovernor
    await voteThroughSubGovernor({
      parentGovernor: xl1Governance, subGovernor, parentProposalId, proposer, voteType: 'For',
    })

    // Move past voting period
    await advanceBlocks(await subGovernor.votingPeriod() + 10n)

    // Verify subGovernor has voted on parent proposal
    expect(await xl1Governance.hasVoted(parentProposalId, await subGovernor.getAddress())).to.equal(true)

    // Execute the parent proposal
    await xl1Governance.execute(targets, values, calldatas, descriptionHash)

    // Ensure subGovernor is governor so they can vote on proposals
    expect(await xl1Governance.governorCount()).to.equal(2)
    expect(await xl1Governance.isGovernor(await newSubGovernor.getAddress())).to.equal(true)
  })
})
