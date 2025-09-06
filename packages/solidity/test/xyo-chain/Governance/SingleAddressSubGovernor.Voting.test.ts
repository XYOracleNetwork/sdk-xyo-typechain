import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  createRandomProposal, deploySingleAddressSubGovernor, ProposalState, voteOnProposal,
} from '../helpers/index.js'

const { ethers } = hre

describe.only('SingleAddressSubGovernor.castVote', () => {
  describe('should not require voting delay when all votes cast with status', () => {
    it('for', async () => {
      const { subGovernor, deployer } = await loadFixture(deploySingleAddressSubGovernor)
      const { proposalId } = await createRandomProposal(subGovernor)
      await voteOnProposal(subGovernor, proposalId, deployer, 'For')
      const finalState = await subGovernor.state(proposalId)
      expect(finalState).to.equal(ProposalState.Succeeded)
    })
  })
})
