import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs.js'
import chai from 'chai'
const { expect } = chai
import {
  advanceBlocks, deployXL1GovernanceWithSingleAddressSubGovernor, deployTestERC20,
} from '../../helpers/index.js'

describe('XL1Governance - ERC20 Transfer Proposal', () => {
  const proposeToCallSmartContract = async (contract, method, args, governor, proposer) => {
    // Encode call to contract from the governance contract
    const functionData = contract.interface.encodeFunctionData(method, args)
    const contractAddress = await contract.getAddress()
    const targets = [contractAddress]
    const values = [0]
    const calldatas = [functionData]
    // NOTE: JSON.stringify(args) not used as it throws here for some reason
    const description = `Proposal to call ${method} on ${contractAddress} with args ${args}`
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

    // Get the proposal ID
    const proposalId = await governor.getProposalId(
      targets,
      values,
      calldatas,
      descriptionHash,
    )
    // Submit the proposal
    await expect(governor.connect(proposer).propose(targets, values, calldatas, description))
      .to.emit(governor, 'ProposalCreated')
      .withArgs(
        proposalId,
        await proposer.getAddress(),
        targets,
        values,
        [anyValue],
        calldatas,
        anyValue, // voteStart
        anyValue, // voteEnd
        description,
      )
    const proposalState = await governor.state(proposalId)
    expect(proposalState).to.equal(0n) // ProposalState.Pending

    return {
      proposalId, targets, values, calldatas, description, descriptionHash,
    }
  }

  it('should execute an ERC20 transfer proposal and send tokens to the recipient', async () => {
    const [_, proposer, recipient] = await ethers.getSigners()
    const proposerAddress = await proposer.getAddress()
    const recipientAddress = await recipient.getAddress()
    const { xl1Governance, subGovernor } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
    const { token, owner } = await loadFixture(deployTestERC20)
    const xl1GovernanceAddress = await xl1Governance.getAddress()
    const subGovernorAddress = await subGovernor.getAddress()

    // Ensure subGovernor is governor so they can vote on proposals
    expect(await xl1Governance.governorCount()).to.equal(1)
    expect(await xl1Governance.isGovernor(subGovernorAddress)).to.equal(true)

    // Transfer tokens to the governance contract so it can execute
    // a proposal to transfer tokens if approved
    const amount = 1000n
    await token.mint(owner.address, amount)
    await token.transfer(xl1GovernanceAddress, amount)

    // Confirm that the governance contract holds the tokens
    expect(await token.balanceOf(xl1GovernanceAddress)).to.equal(amount)

    // Propose xl1Governance call token.transfer(recipientAddress, amount) by proposer
    const {
      proposalId, targets, values, calldatas, descriptionHash,
    } = await proposeToCallSmartContract(token, 'transfer', [recipientAddress, amount], xl1Governance, proposer)

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
    expect(await subGovernor.state(subProposalId)).to.equal(0n) // ProposalState.Pending

    // Move past voting delay
    await advanceBlocks((await subGovernor.votingDelay()) + 1n)

    // Check the subGovernor proposal state
    expect(await subGovernor.state(subProposalId)).to.equal(1n) // ProposalState.Active

    // Vote on the subGovernor's proposal
    await subGovernor.castVote(subProposalId, 1n) // 1 = For

    // Move past voting period
    await advanceBlocks(await subGovernor.votingPeriod() + 10n)

    // Check the subGovernor proposal state
    expect(await subGovernor.state(subProposalId)).to.equal(4n) // ProposalState.Succeeded
    const [againstVotes, forVotes, abstainVotes] = await subGovernor.proposalVotes(subProposalId)
    expect(againstVotes).to.equal(0n)
    expect(forVotes).to.equal(1n)
    expect(abstainVotes).to.equal(0n)

    // Execute the proposal to vote on the xl1Governance
    await subGovernor.execute(subProposalTargets, subProposalValues, subProposalCalldatas, subProposalDescriptionHash)

    // Assert recipient has not received tokens yet
    expect(await token.balanceOf(await recipient.getAddress())).to.equal(0n)

    // Queue and execute the proposal
    await xl1Governance.execute(targets, values, calldatas, descriptionHash)

    // Check the recipient received the tokens
    expect(await token.balanceOf(await recipient.getAddress())).to.equal(amount)
  })
})
