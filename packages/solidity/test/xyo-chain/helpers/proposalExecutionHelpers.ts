import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { expect } from 'chai'
import type { BaseContract } from 'ethers'
import hre from 'hardhat'

import type { IGovernor } from '../../../typechain-types'
import { advanceBlocks } from './evmHelpers.js'
import { ProposalState } from './proposalHelpers.js'

const { ethers } = hre

export interface PassAndExecuteProposalArgs {
  calldatas: string[]
  descriptionHash: string
  governor: IGovernor
  proposalId: bigint
  proposer: HardhatEthersSigner
  targets: string[]
  values: bigint[]
}

export const passAndExecuteProposal = async (args: PassAndExecuteProposalArgs) => {
  const {
    calldatas, descriptionHash, governor, proposalId, proposer, targets, values,
  } = args

  // Voting Delay
  await advanceBlocks(await governor.votingDelay())

  // Cast Vote
  await governor.connect(proposer).castVote(proposalId, 1n) // For

  // Voting Period
  await advanceBlocks(await governor.votingPeriod() + 1n)

  // Confirm Succeeded
  const state = await governor.state(proposalId)
  expect(state).to.equal(ProposalState.Succeeded)

  // Execute
  await governor.execute(targets, values, calldatas, descriptionHash)

  // Final Check
  expect(await governor.state(proposalId)).to.equal(ProposalState.Executed)
}

export interface ProposalExecutionContext {
  calldatas: string[]
  description: string
  descriptionHash: string
  proposalId: bigint
  targets: string[]
  values: bigint[]
}

export const assertProposalExecuted = async (
  governor: IGovernor,
  ctx: ProposalExecutionContext,
) => {
  const state = await governor.state(ctx.proposalId)
  expect(state).to.equal(ProposalState.Succeeded)

  await governor.execute(ctx.targets, ctx.values, ctx.calldatas, ctx.descriptionHash)

  const finalState = await governor.state(ctx.proposalId)
  expect(finalState).to.equal(ProposalState.Executed)
}

export const assertProposalDefeated = async (
  governor: IGovernor,
  ctx: ProposalExecutionContext,
) => {
  const state = await governor.state(ctx.proposalId)
  expect(state).to.equal(ProposalState.Defeated)
}

export const createProposalToCallContract = async (
  contract: BaseContract,
  method: string,
  args: unknown[],
  governor: IGovernor,
  proposer: HardhatEthersSigner,
): Promise<ProposalExecutionContext> => {
  const functionData = contract.interface.encodeFunctionData(method, args)
  const contractAddress = await contract.getAddress()
  const targets = [contractAddress]
  const values = [0n]
  const calldatas = [functionData]
  const description = `Proposal to call ${method} on ${contractAddress} with args ${args}`
  const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))

  const proposalId = await governor.getProposalId(targets, values, calldatas, descriptionHash)

  await expect(governor.connect(proposer).propose(targets, values, calldatas, description))
    .to.emit(governor, 'ProposalCreated')

  return {
    proposalId, targets, values, calldatas, description, descriptionHash,
  }
}
