import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('BridgeableToken', function () {
  describe('owner', function () {
    it('Should initially be set to the deployer', async function () {
      const [deployer] = await ethers.getSigners()
      const { token, owner } = await loadFixture(deployBridgeableToken)
      expect(owner).to.equal(deployer.address)
      expect(await token.owner()).to.equal(deployer.address)
    })
    it('Can be changed after deployment', async function () {
      const { token } = await loadFixture(deployBridgeableToken)
      const [_, newOwner] = await ethers.getSigners()
      await token.transferOwnership(newOwner.address)
      const owner = await token.owner()
      expect(owner).to.equal(newOwner.address)
    })
  })
  describe('mint', function () {
    const amount = ethers.parseUnits('1000000', 18)
    it('Should be callable by owner', async function () {
      const [_, receiver] = await ethers.getSigners()
      const { token } = await loadFixture(deployBridgeableToken)
      await token.mint(receiver.address, amount)
    })
    it('Should not be callable by other addresses', async function () {
      const [_, receiver, minter] = await ethers.getSigners()
      const { token } = await loadFixture(deployBridgeableToken)
      const contract = token.connect(minter)
      await expect(
        contract.mint(receiver.address, amount),
      ).to.be.reverted
    })
  })
})
