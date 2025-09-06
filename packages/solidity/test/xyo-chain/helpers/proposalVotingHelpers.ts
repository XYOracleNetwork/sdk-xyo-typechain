import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { expect } from 'chai'

import type { IGovernor } from '../../../typechain-types'
import { advanceBlocks } from './evmHelpers.js'
import type { Proposal } from './proposalHelpers.js'
import {
  ProposalState, ProposalVote, proposeToCallSmartContract,
} from './proposalHelpers.js'

export type VoteType = keyof typeof ProposalVote

export interface VoteThroughSubGovernorArgs {
  parentGovernor: IGovernor
  parentProposalId: bigint
  proposer: HardhatEthersSigner
  subGovernor: IGovernor
  voteType: VoteType
}

export const voteThroughSubGovernor = async (args: VoteThroughSubGovernorArgs) => {
  const {
    parentGovernor, parentProposalId, proposer, subGovernor, voteType,
  } = args
  const subVoteProposal = await proposeToCallSmartContract(
    parentGovernor,
    'castVote',
    [parentProposalId, ProposalVote[voteType]],
    subGovernor,
    proposer,
  )

  await advanceBlocks(await subGovernor.votingDelay() + 1n)
  await subGovernor.castVote(subVoteProposal.proposalId, ProposalVote.For)
  await advanceBlocks(await subGovernor.votingPeriod() + 1n)

  expect(await subGovernor.state(subVoteProposal.proposalId)).to.equal(ProposalState.Succeeded)

  await subGovernor.execute(
    subVoteProposal.targets,
    subVoteProposal.values,
    subVoteProposal.calldatas,
    subVoteProposal.descriptionHash,
  )
}

export interface VoteThroughSubGovernorsArgs {
  parentGovernor: IGovernor
  parentProposalId: bigint
  proposer: HardhatEthersSigner
  subGovernors: IGovernor[]
  voteType: VoteType
}

export const voteThroughSubGovernors = async ({
  parentGovernor,
  parentProposalId,
  proposer,
  subGovernors,
  voteType,
}: VoteThroughSubGovernorsArgs) => {
  const proposals: Proposal[] = []
  for (const subGovernor of subGovernors) {
    const subVoteProposal = await proposeToCallSmartContract(
      parentGovernor,
      'castVote',
      [parentProposalId, ProposalVote[voteType]],
      subGovernor,
      proposer,
    )
    proposals.push(subVoteProposal)
  }

  const votingDelay = await subGovernors.at(0)?.votingDelay() ?? 1n
  await advanceBlocks(votingDelay + 1n)
  for (const [i, subGovernor] of subGovernors.entries()) {
    const subVoteProposal = proposals[i]
    await subGovernor.castVote(subVoteProposal.proposalId, ProposalVote.For)
  }
  const votingPeriod = await subGovernors.at(0)?.votingPeriod() ?? 0n
  await advanceBlocks(votingPeriod + 1n)
  for (const [i, subGovernor] of subGovernors.entries()) {
    const subVoteProposal = proposals[i]
    expect(await subGovernor.state(subVoteProposal.proposalId)).to.equal(ProposalState.Succeeded)
    await subGovernor.execute(
      subVoteProposal.targets,
      subVoteProposal.values,
      subVoteProposal.calldatas,
      subVoteProposal.descriptionHash,
    )
  }
}

export const voteOnProposal = async (
  governor: IGovernor,
  proposalId: bigint,
  voter: HardhatEthersSigner,
  vote: VoteType,
) => {
  await advanceBlocks(await governor.votingDelay() + 1n)
  const voteValue = ProposalVote[vote]
  await governor.connect(voter).castVote(proposalId, voteValue)
}

export const voteAndFinalizeProposal = async (
  governor: IGovernor,
  proposalId: bigint,
  voter: HardhatEthersSigner,
  vote: VoteType,
) => {
  await advanceBlocks(await governor.votingDelay() + 1n)

  const voteValue = ProposalVote[vote]
  await governor.connect(voter).castVote(proposalId, voteValue)

  await advanceBlocks(await governor.votingPeriod() + 1n)
  const finalState = await governor.state(proposalId)

  return finalState
}
