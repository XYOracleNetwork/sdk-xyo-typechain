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

describe('BridgeableToken', () => {
  const amount = ethers.parseUnits('1000000', 18)

  describe('owner', () => {
    it('should initially be set to the deployer', async () => {
      const [deployer] = await ethers.getSigners()
      const { token, owner } = await loadFixture(deployBridgeableToken)
      expect(owner).to.equal(deployer.address)
      expect(await token.owner()).to.equal(deployer.address)
    })
    it('can be changed after deployment', async () => {
      const { token } = await loadFixture(deployBridgeableToken)
      const [_, newOwner] = await ethers.getSigners()
      await token.transferOwnership(newOwner.address)
      const owner = await token.owner()
      expect(owner).to.equal(newOwner.address)
    })
  })

  describe('mint', () => {
    describe('with original owner', () => {
      it('should allow owner to mint', async () => {
        const [_, receiver] = await ethers.getSigners()
        const { token, owner } = await loadFixture(deployBridgeableToken)
        await expectMintToSucceed(token, owner, receiver, amount)
      })

      it('should not allow other addresses to mint', async () => {
        const [_, receiver, minter] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)
        await expectMintToRevert(token, minter, receiver, amount)
      })
    })

    describe('after ownership transfer', () => {
      it('should allow the new owner to mint', async () => {
        const [_, newOwner, receiver] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)
        await token.transferOwnership(newOwner.address)
        await expectMintToSucceed(token, newOwner, receiver, amount)
      })

      it('should not allow the old owner to mint', async () => {
        const [_, newOwner, receiver] = await ethers.getSigners()
        const { token, owner: originalOwner } = await loadFixture(deployBridgeableToken)
        await token.transferOwnership(newOwner.address)
        await expectMintToRevert(token, originalOwner, receiver, amount)
      })
    })
  })

  describe('bridge', () => {
    it('should allow the owner to bridge tokens and emit event', async () => {
      const [owner, destination] = await ethers.getSigners()
      const { token } = await loadFixture(deployBridgeableToken)

      // Mint some tokens to owner first
      await token.mint(owner.address, amount)

      const tx = await token.bridge(amount, destination.address)
      const receipt = await tx.wait()

      // Expect event emitted
      const event = receipt.logs.find(log =>
        log.fragment.name === 'BridgeInitiated')

      expect(event.args.id).to.equal(0n)
      expect(event.args.from).to.equal(owner.address)
      expect(event.args.destination).to.equal(destination.address)
      expect(event.args.amount).to.equal(amount)

      // Expect bridge recorded
      const bridgeRecord = await token.bridges(0)
      expect(bridgeRecord.from).to.equal(owner.address)
      expect(bridgeRecord.destination).to.equal(destination.address)
      expect(bridgeRecord.amount).to.equal(amount)
      expect(bridgeRecord.timepoint).to.equal(receipt.blockNumber)

      // Token balance should now be 0
      expect(await token.balanceOf(owner.address)).to.equal(0)
    })

    it('should increment bridge ID after each bridge', async () => {
      const [owner, destination1, destination2] = await ethers.getSigners()
      const { token } = await loadFixture(deployBridgeableToken)

      await token.mint(owner.address, amount * 2n)

      await token.bridge(amount, destination1.address)
      await token.bridge(amount, destination2.address)

      const nextId = await token.nextBridgeId()
      expect(nextId).to.equal(2n)

      const record0 = await token.bridges(0)
      const record1 = await token.bridges(1)

      expect(record0.destination).to.equal(destination1.address)
      expect(record1.destination).to.equal(destination2.address)
    })

    it('should revert if called by non-owner', async () => {
      const [owner, attacker, destination] = await ethers.getSigners()
      const { token } = await loadFixture(deployBridgeableToken)

      // Mint to owner, but attempt bridge from attacker
      await token.mint(owner.address, amount)
      await expect(
        token.connect(attacker).bridge(amount, destination.address),
      ).to.be.reverted
    })

    it('should revert if trying to bridge more than balance', async () => {
      const [owner, destination] = await ethers.getSigners()
      const { token } = await loadFixture(deployBridgeableToken)

      // Mint less than we try to bridge
      await token.mint(owner.address, amount / 2n)

      await expect(
        token.bridge(amount, destination.address),
      ).to.be.reverted
    })
  })
})
