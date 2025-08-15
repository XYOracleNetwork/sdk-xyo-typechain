import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

async function expectMintToSucceed(token, caller, recipient, amount) {
  const tx = await token.connect(caller).mint(recipient.address, amount)
  await tx.wait()

  const balance = await token.balanceOf(recipient.address)
  expect(balance).to.equal(amount)
}

async function expectMintToRevert(token, caller, recipient, amount) {
  await expect(
    token.connect(caller).mint(recipient.address, amount),
  ).to.be.reverted
}

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
        const { token, owner } = await loadFixture(deployBridgeableToken)
        await expectMintToSucceed(token, owner, receiver, amount)
      })

      it('should not allow other addresses to mint', async function () {
        const [_, receiver, minter] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)
        await expectMintToRevert(token, minter, receiver, amount)
      })
    })

    describe('after ownership transfer', function () {
      it('should allow the new owner to mint', async function () {
        const [_, newOwner, receiver] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)
        await token.transferOwnership(newOwner.address)
        await expectMintToSucceed(token, newOwner, receiver, amount)
      })

      it('should not allow the old owner to mint', async function () {
        const [_, newOwner, receiver] = await ethers.getSigners()
        const { token, owner: originalOwner } = await loadFixture(deployBridgeableToken)
        await token.transferOwnership(newOwner.address)
        await expectMintToRevert(token, originalOwner, receiver, amount)
      })
    })
  })
})
