import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('BridgeableToken', () => {
  const amount = ethers.parseUnits('1000000', 18)
  const expectMintToSucceed = async (token, caller, recipient, amount) => {
    const tx = await token.connect(caller).mint(recipient.address, amount)
    await tx.wait()
    const balance = await token.balanceOf(recipient.address)
    expect(balance).to.equal(amount)
  }

  const expectMintToRevert = async (token, caller, recipient, amount) => {
    await expect(token.connect(caller).mint(recipient.address, amount)).to.be.reverted
  }

  const mintToOwner = async (token, owner, amount) => {
    await token.connect(owner).mint(owner.address, amount)
  }

  const expectBridgeToSucceed = async ({
    token, id, from, to, amount,
  }) => {
    const tx = await token.connect(from).bridge(amount, to.address)
    const receipt = await tx.wait()

    const record = await token.bridges(id)
    expect(record.from).to.equal(from.address)
    expect(record.destination).to.equal(to.address)
    expect(record.amount).to.equal(amount)
    expect(record.timepoint).to.equal(receipt.blockNumber)

    const event = receipt.logs.find(log => log.fragment.name === 'BridgeInitiated')
    expect(event.args.id).to.equal(BigInt(id))
    expect(event.args.from).to.equal(from.address)
    expect(event.args.destination).to.equal(to.address)
    expect(event.args.amount).to.equal(amount)

    const balance = await token.balanceOf(from.address)
    expect(balance).to.equal(0n)
  }

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

      it('should not allow non-owner to mint', async () => {
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

      it('should not allow previous owner to mint', async () => {
        const [_, newOwner, receiver] = await ethers.getSigners()
        const { token, owner: originalOwner } = await loadFixture(deployBridgeableToken)
        await token.transferOwnership(newOwner.address)
        await expectMintToRevert(token, originalOwner, receiver, amount)
      })
    })
  })

  describe('bridge', () => {
    describe('when called by owner', () => {
      it('should bridge tokens and emit event', async () => {
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)

        await mintToOwner(token, owner, amount)
        await expectBridgeToSucceed({
          token, id: 0, from: owner, to: destination, amount,
        })
      })

      it('should increment bridge ID after each bridge', async () => {
        const [owner, destination1, destination2] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)

        await mintToOwner(token, owner, amount * 2n)
        await token.bridge(amount, destination1.address)
        await token.bridge(amount, destination2.address)

        expect(await token.nextBridgeId()).to.equal(2n)

        expect((await token.bridges(0)).destination).to.equal(destination1.address)
        expect((await token.bridges(1)).destination).to.equal(destination2.address)
      })

      it('should revert if trying to bridge more than balance', async () => {
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)

        await mintToOwner(token, owner, amount / 2n)

        await expect(token.bridge(amount, destination.address)).to.be.reverted
      })
    })

    describe('when called by non-owner', () => {
      it('should revert', async () => {
        const [owner, attacker, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)

        await mintToOwner(token, owner, amount)

        await expect(
          token.connect(attacker).bridge(amount, destination.address),
        ).to.be.reverted
      })
    })
  })
})
