import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('BridgeableToken', function () {
  describe('owner', function () {
    it('Should be from the correct address', async function () {
      const { token, owner } = await loadFixture(deployBridgeableToken)
      const tokenOwner = await token.owner()
      expect(tokenOwner).to.equal(owner.address)
    })
  })
})
