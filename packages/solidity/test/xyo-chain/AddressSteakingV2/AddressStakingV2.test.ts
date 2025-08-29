import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'

import { deployAddressStakingV2 } from '../helpers/index.js'

describe('AddressStakingV2', () => {
  describe('stakedAddresses', () => {
    it('should be 0 (stubbed)', async () => {
      const { staking } = await loadFixture(deployAddressStakingV2)
      const result = await staking.stakedAddressesWithMinStakeCount()
      expect(result).to.equal(0)
    })
  })

  describe('TransferStake', () => {
    describe('stakingTokenAddress', () => {
      it('should return staking token address', async () => {
        const { staking, token } = await loadFixture(deployAddressStakingV2)
        const tokenAddress = await token.getAddress()
        const stakingTokenAddress = await staking.stakingTokenAddress()
        expect(stakingTokenAddress).to.equal(tokenAddress)
      })
    })
  })
})
