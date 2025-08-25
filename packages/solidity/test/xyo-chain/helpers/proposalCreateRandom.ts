import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import hre from 'hardhat'

import type { XL1Governance } from '../../../typechain-types'
import { deployTestERC20 } from './deployTestERC20.js'
import { createProposalToCallContract } from './proposalExecutionHelpers.js'

const { ethers } = hre

export const createRandomProposal = async (xl1Governance: XL1Governance) => {
  const [_, proposer] = await ethers.getSigners()
  const { token, owner } = await loadFixture(deployTestERC20)

  const amount = 1000n
  await token.mint(owner.address, amount)
  await token.transfer(await xl1Governance.getAddress(), amount)

  const ctx = await createProposalToCallContract(
    token,
    'transfer',
    [proposer.address, amount],
    xl1Governance,
    proposer,
  )
  return ctx
}
