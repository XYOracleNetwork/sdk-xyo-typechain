import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'

import { deployAddressStakingV2 } from '../helpers/index.js'

describe('AddressStakingV2.TransferStake', () => {
  describe('stakingTokenAddress', () => {
    it('should return staking token address', async () => {
      const { staking, token } = await loadFixture(deployAddressStakingV2)
      const tokenAddress = await token.getAddress()
      const stakingTokenAddress = await staking.stakingTokenAddress()
      expect(stakingTokenAddress).to.equal(tokenAddress)
    })
  })
})
