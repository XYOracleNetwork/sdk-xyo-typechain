import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('BridgeableToken', function () {
  describe('owner', function () {
    it('Should initially be set to the deployer', async function () {
      const { token } = await loadFixture(deployBridgeableToken)
      const [deployer] = await ethers.getSigners()
      const owner = await token.owner()
      expect(owner).to.equal(deployer.address)
    })
    it('Can be changed after deployment', async function () {
      const { token } = await loadFixture(deployBridgeableToken)
      const [_, newOwner] = await ethers.getSigners()
      await token.transferOwnership(newOwner.address)
      const owner = await token.owner()
      expect(owner).to.equal(newOwner.address)
    })
  })
})
