import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import { expect } from 'chai'

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
    await expectMintToSucceed(token, owner, owner, amount)
  }

  const expectBridgeToSucceed = async ({
    token, from, to, amount,
  }) => {
    const nextBridgeId = await token.nextBridgeId()
    const initialBalance = await token.balanceOf(from.address)

    const tx = await token.connect(from).bridge(amount, to.address)
    const receipt = await tx.wait()

    const record = await token.bridges(nextBridgeId)
    expect(record.from).to.equal(from.address)
    expect(record.destination).to.equal(to.address)
    expect(record.amount).to.equal(amount)
    expect(record.timepoint).to.equal(receipt.blockNumber)

    const event = receipt.logs.find(log => log.fragment.name === 'BridgeInitiated')
    expect(event.args.id).to.equal(nextBridgeId)
    expect(event.args.from).to.equal(from.address)
    expect(event.args.destination).to.equal(to.address)
    expect(event.args.amount).to.equal(amount)

    const finalBalance = await token.balanceOf(from.address)
    expect(finalBalance).to.equal(initialBalance - amount)

    return { record, event }
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
          token, from: owner, to: destination, amount,
        })
      })

      it('should increment bridge ID after each bridge', async () => {
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployBridgeableToken)

        const initialBridgeId = await token.nextBridgeId()
        const bridgeCount = 5
        await mintToOwner(token, owner, amount * BigInt(bridgeCount))
        for (let i = 0; i < bridgeCount; i++) {
          await expectBridgeToSucceed({
            token, from: owner, to: destination, amount,
          })
          expect(await token.nextBridgeId()).to.equal(initialBridgeId + BigInt(i + 1))
        }
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
