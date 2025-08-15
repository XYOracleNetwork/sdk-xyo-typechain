import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('BridgeableToken', function () {
  describe('owner', function () {
    it('should initially be set to the deployer', async function () {
      const [deployer] = await ethers.getSigners()
      const { token, owner } = await loadFixture(deployBridgeableToken)
      expect(owner).to.equal(deployer.address)
      expect(await token.owner()).to.equal(deployer.address)
    })
    it('can be changed after deployment', async function () {
      const { token } = await loadFixture(deployBridgeableToken)
      const [_, newOwner] = await ethers.getSigners()
      await token.transferOwnership(newOwner.address)
      const owner = await token.owner()
      expect(owner).to.equal(newOwner.address)
    })
  })
  describe('mint', function () {
    const amount = ethers.parseUnits('1000000', 18)
    describe('with original owner', function () {
      it('should allow owner to mint', async function () {
        const [_, receiver] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)
        await token.mint(receiver.address, amount)
      })
      it('should not allow other addresses to mint', async function () {
        const [_, receiver, minter] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)
        const contract = token.connect(minter)
        await expect(
          contract.mint(receiver.address, amount),
        ).to.be.reverted
      })
    })
    describe('after ownership transfer', function () {
      it('Should allow the new owner to mint', async function () {
        const [originalOwner, newOwner, receiver] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)

        // Transfer ownership
        await token.transferOwnership(newOwner.address)

        // Connect as new owner and mint
        await token.connect(newOwner).mint(receiver.address, amount)

        const balance = await token.balanceOf(receiver.address)
        expect(balance).to.equal(amount)
      })

      it('Should not allow the old owner to mint after ownership transfer', async function () {
        const [originalOwner, newOwner, receiver] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)

        // Transfer ownership
        await token.transferOwnership(newOwner.address)

        // Try to mint as the old owner
        await expect(
          token.connect(originalOwner).mint(receiver.address, amount),
        ).to.be.reverted
      })
    })
  })
})
