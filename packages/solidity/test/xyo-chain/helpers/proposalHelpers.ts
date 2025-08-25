import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs.js'
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { expect } from 'chai'
import type { BaseContract } from 'ethers'
import hre from 'hardhat'

import type {
  BridgeableToken, IGovernor, XL1Governance,
} from '../../../typechain-types/index.js'

const { ethers } = hre

export const ProposalState = {
  Pending: 0n,
  Active: 1n,
  Canceled: 2n,
  Defeated: 3n,
  Succeeded: 4n,
  Queued: 5n,
  Expired: 6n,
  Executed: 7n,
} satisfies Readonly<Record<string, bigint>>

export const ProposalVote = {
  Against: 0n,
  For: 1n,
  Abstain: 2n,
} satisfies Readonly<Record<string, bigint>>

export const proposeToCallSmartContract = async (
  contract: BaseContract,
  method: string,
  args: ReadonlyArray<unknown>,
  governor: IGovernor,
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
  expect(proposalState).to.equal(ProposalState.Pending)

  return {
    proposalId, targets, values, calldatas, description, descriptionHash,
  }
}

export const proposeToTransferTokens = async (
  xl1Governance: XL1Governance,
  token: BridgeableToken,
  owner: HardhatEthersSigner,
  recipient: HardhatEthersSigner,
  amount: bigint,
  proposer: HardhatEthersSigner,
) => {
  const xl1GovernanceAddress = await xl1Governance.getAddress()
  const recipientAddress = await recipient.getAddress()

  // Transfer tokens to the governance contract so it can execute
  // a proposal to transfer tokens if approved

  await token.mint(owner.address, amount)
  await token.transfer(xl1GovernanceAddress, amount)

  // Confirm that the governance contract holds the tokens
  expect(await token.balanceOf(xl1GovernanceAddress)).to.equal(amount)

  // Propose xl1Governance call token.transfer(recipientAddress, amount) by proposer
  return await proposeToCallSmartContract(token, 'transfer', [recipientAddress, amount], xl1Governance, proposer)
}
