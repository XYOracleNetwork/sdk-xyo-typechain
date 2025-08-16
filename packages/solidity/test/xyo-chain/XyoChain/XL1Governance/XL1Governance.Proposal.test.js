import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import chai from 'chai'
const { expect } = chai
import {
  advanceBlocks, deployXL1Governance, deploySingleAddressSubGovernor, deployTestERC20,
} from '../../helpers/index.js'

describe.only('XL1Governance - ERC20 Transfer Proposal', () => {
  it('should execute an ERC20 transfer proposal and send tokens to the recipient', async () => {
    const { xl1Governance } = await loadFixture(deployXL1Governance)
    const subGovernorFixture = () => deploySingleAddressSubGovernor(xl1Governance)
    const { subGovernor } = await loadFixture(subGovernorFixture)
    const { token, owner } = await loadFixture(deployTestERC20)

    const [_, recipient] = await ethers.getSigners()
    const amount = 1000n

    // Transfer tokens to the governance contract so it can transfer them out
    await token.mint(owner.address, amount)
    await token.transfer(await xl1Governance.getAddress(), amount)

    // Confirm that the governance contract holds the tokens
    expect(await token.balanceOf(await xl1Governance.getAddress())).to.equal(amount)

    // Encode call to transfer ERC-20 tokens
    const transferCalldata = token.interface.encodeFunctionData('transfer', [
      await recipient.getAddress(),
      amount,
    ])

    const targets = [await token.getAddress()]
    const values = [amount]
    const calldatas = [transferCalldata]
    const description = 'Proposal to transfer tokens to recipient'

    // Add deployer as governor so they can vote and propose
    await xl1Governance.addFirstGovernor(await subGovernor.getAddress())

    const proposalId = await xl1Governance.propose(targets, values, calldatas, description)

    // Move past voting delay
    await advanceBlocks(await xl1Governance.votingDelay())

    // Vote in favor
    await xl1Governance.castVote(proposalId, 1n) // 1 = FOR

    // Move past voting period
    await advanceBlocks(await xl1Governance.votingPeriod())

    // Queue and execute the proposal
    await xl1Governance.execute(targets, values, calldatas, ethers.id(description))

    // Check the recipient received the tokens
    expect(await token.balanceOf(await recipient.getAddress())).to.equal(amount)
  })
})
