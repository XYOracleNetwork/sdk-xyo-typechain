import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  advanceBlocks,
  deploySingleAddressSubGovernor, deployXL1GovernanceWithSingleAddressSubGovernor, ProposalState, ProposalVote, proposeToCallSmartContract,
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
      proposalId, targets, values, calldatas, descriptionHash,
    } = await proposeToCallSmartContract(xl1Governance, 'addGovernor', [await newSubGovernor.getAddress()], subGovernor, proposer)

    // Move past voting delay
    await advanceBlocks(await xl1Governance.votingDelay())

    // Propose subGovernor call xl1Governance.castVote(parentId, ProposalVote.For) by proposer
    const {
      proposalId: subProposalId,
      targets: subProposalTargets,
      values: subProposalValues,
      calldatas: subProposalCalldatas,
      descriptionHash: subProposalDescriptionHash,
    } = await proposeToCallSmartContract(xl1Governance, 'castVote', [proposalId, ProposalVote.For], subGovernor, proposer)

    // Check the subGovernor proposal state
    expect(await subGovernor.state(subProposalId)).to.equal(ProposalState.Pending)

    // Move past voting delay
    await advanceBlocks((await subGovernor.votingDelay()) + 1n)

    // Check the subGovernor proposal state
    expect(await subGovernor.state(subProposalId)).to.equal(ProposalState.Active)

    // Vote on the subGovernor's proposal
    await subGovernor.castVote(subProposalId, ProposalVote.For)

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

    // Queue and execute the proposal
    await xl1Governance.execute(targets, values, calldatas, descriptionHash)

    // Ensure subGovernor is governor so they can vote on proposals
    expect(await xl1Governance.governorCount()).to.equal(2)
    expect(await xl1Governance.isGovernor(await newSubGovernor.getAddress())).to.equal(true)
  })
})
