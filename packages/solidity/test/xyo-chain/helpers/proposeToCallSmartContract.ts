import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs.js'
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { expect } from 'chai'
import type { BaseContract } from 'ethers'
import hre from 'hardhat'

import type { XL1Governance } from '../../../typechain-types'

const { ethers } = hre

export const proposeToCallSmartContract = async (
  contract: BaseContract,
  method: string,
  args: ReadonlyArray<unknown>,
  governor: XL1Governance,
  proposer: HardhatEthersSigner,
) => {
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
