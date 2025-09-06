import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import type { BridgeableToken, IGovernor } from '../../../typechain-types'
import { deployTestERC20 } from './deployTestERC20.js'
import type { ProposalExecutionContext } from './proposalExecutionHelpers.js'
import { proposeToTransferTokens } from './proposalHelpers.js'

const { ethers } = hre

export interface CreateRandomProposalContext extends ProposalExecutionContext {
  amount: bigint
  proposer: HardhatEthersSigner
  recipient: HardhatEthersSigner
  token: BridgeableToken
}

export const createRandomProposal = async (governor: IGovernor): Promise<CreateRandomProposalContext> => {
  const [_, proposer, recipient] = await ethers.getSigners()
  const { token, owner } = await loadFixture(deployTestERC20)
  const amount = 1000n

  // Propose the transfer
  const ctx = await proposeToTransferTokens(
    governor,
    token,
    owner,
    recipient,
    amount,
    proposer,
  )
  return {
    amount, proposer, recipient, token, ...ctx,
  }
}

export const validateRandomProposalFailed = async (ctx: CreateRandomProposalContext) => {
  const { token, recipient } = ctx
  // Check the recipient did not receive the tokens
  expect(await token.balanceOf(await recipient.getAddress())).to.equal(0)
}

export const validateRandomProposalSucceeded = async (ctx: CreateRandomProposalContext) => {
  const {
    token, recipient, amount,
  } = ctx
  // Check the recipient received the tokens
  expect(await token.balanceOf(await recipient.getAddress())).to.equal(amount)
}
