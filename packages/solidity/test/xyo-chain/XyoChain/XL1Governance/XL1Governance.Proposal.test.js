/* eslint-disable max-statements */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs.js'
import chai from 'chai'
const { expect } = chai
import {
  advanceBlocks, deployXL1Governance, deploySingleAddressSubGovernor, deployTestERC20,
} from '../../helpers/index.js'

describe.only('XL1Governance - ERC20 Transfer Proposal', () => {
  it('should execute an ERC20 transfer proposal and send tokens to the recipient', async () => {
    const [_, proposer, recipient] = await ethers.getSigners()
    const proposerAddress = await proposer.getAddress()
    const recipientAddress = await recipient.getAddress()
    const { xl1Governance } = await loadFixture(deployXL1Governance)
    const subGovernorFixture = () => deploySingleAddressSubGovernor(xl1Governance)
    const { subGovernor } = await loadFixture(subGovernorFixture)
    const { token, owner } = await loadFixture(deployTestERC20)

    // Add subGovernor as governor so they can vote on proposals
    const subGovernorAddress = await subGovernor.getAddress()
    expect(await xl1Governance.governorCount()).to.equal(0)
    await xl1Governance.addFirstGovernor(subGovernorAddress)
    expect(await xl1Governance.governorCount()).to.equal(1)
    expect(await xl1Governance.isGovernor(subGovernorAddress)).to.equal(true)

    // Transfer tokens to the governance contract so it can execute
    // a proposal to transfer tokens if approved
    const amount = 1000n
    await token.mint(owner.address, amount)
    await token.transfer(await xl1Governance.getAddress(), amount)

    // Confirm that the governance contract holds the tokens
    expect(await token.balanceOf(await xl1Governance.getAddress())).to.equal(amount)

    // Encode call to transfer tokens from the governance contract to the recipient
    const transferCalldata = token.interface.encodeFunctionData('transfer', [recipientAddress, amount])
    const targets = [await token.getAddress()]
    const values = [amount]
    const calldatas = [transferCalldata]
    const description = `Proposal to transfer ${amount} tokens to ${recipientAddress}`
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

    // Get the proposal ID
    const proposalId = await xl1Governance.getProposalId(
      targets,
      values,
      calldatas,
      descriptionHash,
    )
    // Submit the proposal
    await expect(xl1Governance.connect(proposer).propose(targets, values, calldatas, description))
      .to.emit(xl1Governance, 'ProposalCreated')
      .withArgs(
        proposalId,
        proposerAddress,
        targets,
        values,
        [anyValue],
        calldatas,
        anyValue, // voteStart
        anyValue, // voteEnd
        description,
      )
    const proposalState = await xl1Governance.state(proposalId)
    expect(proposalState).to.equal(0n) // ProposalState.Pending

    // Move past voting delay
    await advanceBlocks(await xl1Governance.votingDelay())

    // Submit the proposal to sub-governor
    await expect(subGovernor.connect(proposer).propose(targets, values, calldatas, description))
      .to.emit(subGovernor, 'ProposalCreated')
      .withArgs(
        proposalId,
        proposerAddress,
        targets,
        values,
        [anyValue],
        calldatas,
        anyValue, // voteStart
        anyValue, // voteEnd
        description,
      )
    const proposalStateSubGovernor = await subGovernor.state(proposalId)
    expect(proposalStateSubGovernor).to.equal(0n) // ProposalState.Pending

    // Vote in favor
    await subGovernor.castVote(proposalId, 1n) // 1 = FOR

    // Move past voting period
    await advanceBlocks(await xl1Governance.votingPeriod())

    // Queue and execute the proposal
    await xl1Governance.execute(targets, values, calldatas, ethers.id(description))

    // Check the recipient received the tokens
    expect(await token.balanceOf(await recipient.getAddress())).to.equal(amount)
  })
})
