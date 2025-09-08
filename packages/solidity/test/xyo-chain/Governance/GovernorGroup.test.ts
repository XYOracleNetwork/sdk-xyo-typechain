import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import type { SingleAddressSubGovernor } from '../../../typechain-types/index.js'
import {
  advanceBlocks, deploySingleAddressSubGovernor, deployXL1Governance, deployXL1GovernanceWithSingleAddressSubGovernor,
  proposeToCallSmartContract, voteThroughSubGovernor,
  voteThroughSubGovernors,
} from '../helpers/index.js'

const { ethers } = hre

describe('GovernorGroup', () => {
  it('should allow adding governors', async () => {
    const [_, proposer] = await ethers.getSigners()
    const { xl1Governance, subGovernor } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
    const subGovernorAddress = await subGovernor.getAddress()

    // Ensure subGovernor is governor so they can vote on proposals
    expect(await xl1Governance.governorCount()).to.equal(1)
    expect(await xl1Governance.isGovernor(subGovernorAddress)).to.equal(true)

    // Create new subGovernor to add
    const fixture = () => deploySingleAddressSubGovernor('newSubGovernor')
    const { subGovernor: newSubGovernor } = await loadFixture(fixture)
    const newSubGovernorAddress = await newSubGovernor.getAddress()
    expect(newSubGovernorAddress).to.not.equal(subGovernorAddress)

    // Create proposal to add new subGovernor
    const {
      proposalId: parentProposalId, targets, values, calldatas, descriptionHash,
    } = await proposeToCallSmartContract(xl1Governance, 'addGovernor', [newSubGovernorAddress], xl1Governance, proposer)

    // Cast vote via subGovernor
    await voteThroughSubGovernor({
      parentGovernor: xl1Governance, subGovernor, parentProposalId, proposer, voteType: 'For',
    })

    // Verify subGovernor has voted on parent proposal
    expect(await xl1Governance.hasVoted(parentProposalId, await subGovernor.getAddress())).to.equal(true)

    // Move past voting period
    await advanceBlocks(await xl1Governance.votingPeriod() + 1n)

    // Execute the parent proposal
    await xl1Governance.execute(targets, values, calldatas, descriptionHash)

    // Ensure subGovernor is governor so they can vote on proposals
    expect(await xl1Governance.governorCount()).to.equal(2)
    expect(await xl1Governance.isGovernor(await newSubGovernor.getAddress())).to.equal(true)
  })
  it('should allow removing governors', async () => {
    const [_, proposer] = await ethers.getSigners()

    const governorCount = 3
    const governors: SingleAddressSubGovernor[] = []

    for (let i = 0; i < governorCount; i++) {
      const fixture = () => deploySingleAddressSubGovernor(`subGovernor${i}`)
      const { subGovernor: newSubGovernor } = await loadFixture(fixture)
      governors.push(newSubGovernor)
    }
    const fixture = () => deployXL1Governance(governors)
    const { xl1Governance } = await loadFixture(fixture)

    // Ensure subGovernors exist
    expect(await xl1Governance.governorCount()).to.equal(governorCount)
    for (const governor of governors) {
      expect(await xl1Governance.isGovernor(await governor.getAddress())).to.equal(true)
    }

    const governorToRemove = governors.at(-1)!
    const governorToRemoveAddress = await governorToRemove?.getAddress()

    // Create proposal to add new subGovernor
    const {
      proposalId: parentProposalId, targets, values, calldatas, descriptionHash,
    } = await proposeToCallSmartContract(xl1Governance, 'removeGovernor', [governorToRemoveAddress], xl1Governance, proposer)

    // Cast vote via subGovernor
    await voteThroughSubGovernors({
      parentGovernor: xl1Governance, subGovernors: governors, parentProposalId, proposer, voteType: 'For',
    })

    // Verify subGovernor has voted on parent proposal
    for (const subGovernor of governors) {
      expect(await xl1Governance.hasVoted(parentProposalId, await subGovernor.getAddress())).to.equal(true)
    }

    // Move past voting period
    await advanceBlocks(await xl1Governance.votingPeriod() + 1n)

    // Execute the parent proposal
    await xl1Governance.execute(targets, values, calldatas, descriptionHash)

    // Ensure subGovernor is governor so they can vote on proposals
    expect(await xl1Governance.governorCount()).to.equal(governors.length - 1)
    expect(await xl1Governance.isGovernor(await governorToRemove.getAddress())).to.equal(false)
  })
})
