import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  advanceBlocks, deployTestERC20, deployXL1GovernanceWithSingleAddressSubGovernor, ProposalState, ProposalVote, proposeToCallSmartContract,
  proposeToTransferTokens,
} from '../../helpers/index.js'

const { ethers } = hre

describe('XL1Governance - ERC20 Transfer Proposal', () => {
  it('should execute an ERC20 transfer proposal and send tokens to the recipient', async () => {
    const [_, proposer, recipient] = await ethers.getSigners()
    const { xl1Governance, subGovernor } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
    const { token, owner } = await loadFixture(deployTestERC20)
    const subGovernorAddress = await subGovernor.getAddress()
    const amount = 1000n

    // Ensure subGovernor is governor so they can vote on proposals
    expect(await xl1Governance.governorCount()).to.equal(1)
    expect(await xl1Governance.isGovernor(subGovernorAddress)).to.equal(true)

    // Propose xl1Governance call token.transfer(recipientAddress, amount) by proposer
    const {
      proposalId, targets, values, calldatas, descriptionHash,
    } = await proposeToTransferTokens(xl1Governance, token, owner, recipient, amount, proposer)

    // Move past voting delay
    await advanceBlocks(await xl1Governance.votingDelay() + 1n)

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

    // Move past voting period of subGovernor
    await advanceBlocks(await subGovernor.votingPeriod() + 1n)

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

    // Move past voting period of xl1Governance
    await advanceBlocks(await xl1Governance.votingPeriod() + 1n)

    // Assert recipient has not received tokens yet
    expect(await token.balanceOf(await recipient.getAddress())).to.equal(0n)

    // Queue and execute the proposal
    await xl1Governance.execute(targets, values, calldatas, descriptionHash)

    // Check the recipient received the tokens
    expect(await token.balanceOf(await recipient.getAddress())).to.equal(amount)
  })
})
