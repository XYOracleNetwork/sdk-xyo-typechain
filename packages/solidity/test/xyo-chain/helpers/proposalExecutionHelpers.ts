import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { expect } from 'chai'

import type { IGovernor } from '../../../typechain-types'
import { advanceBlocks } from './evmHelpers'
import { ProposalState } from './proposalHelpers'

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
