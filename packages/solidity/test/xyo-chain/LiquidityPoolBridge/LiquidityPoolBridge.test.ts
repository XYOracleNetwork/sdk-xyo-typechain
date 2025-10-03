import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { assertEx } from '@xylabs/assert'
import { expect } from 'chai'
import hre from 'hardhat'

import type { BridgeableToken, LiquidityPoolBridge } from '../../../typechain-types/index.js'
import { deployLiquidityPoolBridge, deployTestERC20 } from '../helpers/index.js'

const { ethers } = hre

describe.only('LiquidityPoolBridge', () => {
  const amount = ethers.parseUnits('1000000', 18)

  const expectMintToSucceed = async (token: BridgeableToken, caller: HardhatEthersSigner, recipient: HardhatEthersSigner, amount: bigint) => {
    const tx = await token.connect(caller).mint(recipient.address, amount)
    await tx.wait()
    const balance = await token.balanceOf(recipient.address)
    expect(balance).to.equal(amount)
  }

  const mintToOwner = async (token: BridgeableToken, owner: HardhatEthersSigner, amount: bigint) => {
    await expectMintToSucceed(token, owner, owner, amount)
  }

  const fundBridge = async (token: BridgeableToken, owner: HardhatEthersSigner, bridge: LiquidityPoolBridge, amount: bigint) => {
    await token.connect(owner).approve(bridge.getAddress(), amount)
    const tx = await token.transfer(bridge.getAddress(), amount)
    await tx.wait()
    const balance = await token.balanceOf(bridge.getAddress())
    expect(balance).to.equal(amount)
  }

  const expectBridgeFromSucceed = async ({
    bridge, from, to, amount, token,
  }: {
    amount: bigint
    bridge: LiquidityPoolBridge
    from: HardhatEthersSigner
    to: HardhatEthersSigner
    token: BridgeableToken
  }) => {
    const nextBridgeId = await bridge.nextBridgeFromId()
    const initialBalance = await token.balanceOf(await bridge.getAddress())

    // Send tokens to bridge
    const tx = await bridge.connect(from).bridgeFromRemote(from.address, to.address, amount)
    const receipt = await tx.wait()
    expect(receipt).not.to.equal(null)

    // const record = await bridge.toRemoteBridges(nextBridgeId)
    // expect(record.from).to.equal(from.address)
    // expect(record.to).to.equal(to.address)
    // expect(record.amount).to.equal(amount)

    // Get typed logs using the filter
    const logs = await bridge.queryFilter(bridge.filters.BridgedFromRemote())
    expect(logs.length > 0).to.equal(true)
    const log = logs.at(-1)
    expect(log).not.to.equal(undefined)
    const event = assertEx(log)
    expect(event?.args.id).to.equal(nextBridgeId)
    expect(event?.args.from).to.equal(from.address)
    expect(event?.args.to).to.equal(to.address)
    expect(event?.args.amount).to.equal(amount)

    const finalBalance = await token.balanceOf(await bridge.getAddress())
    expect(finalBalance).to.equal(initialBalance - amount)

    return { event }
  }

  const expectBridgeToSucceed = async ({
    bridge, from, to, amount, token,
  }: {
    amount: bigint
    bridge: LiquidityPoolBridge
    from: HardhatEthersSigner
    to: HardhatEthersSigner
    token: BridgeableToken
  }) => {
    const nextBridgeId = await bridge.nextBridgeToId()
    const initialBalance = await token.balanceOf(from.address)

    // Approve the bridge to spend tokens
    await token.connect(from).approve(bridge.getAddress(), amount)

    // Send tokens to bridge
    const tx = await bridge.connect(from).bridgeToRemote(to.address, amount)
    const receipt = await tx.wait()
    expect(receipt).not.to.equal(null)

    // const record = await bridge.toRemoteBridges(nextBridgeId)
    // expect(record.from).to.equal(from.address)
    // expect(record.to).to.equal(to.address)
    // expect(record.amount).to.equal(amount)

    // Get typed logs using the filter
    const logs = await bridge.queryFilter(bridge.filters.BridgedToRemote())
    expect(logs.length > 0).to.equal(true)
    const log = logs.at(-1)
    expect(log).not.to.equal(undefined)
    const event = assertEx(log)
    expect(event?.args.id).to.equal(nextBridgeId)
    expect(event?.args.from).to.equal(from.address)
    expect(event?.args.to).to.equal(to.address)
    expect(event?.args.amount).to.equal(amount)

    const finalBalance = await token.balanceOf(from.address)
    expect(finalBalance).to.equal(initialBalance - amount)

    return { event }
  }

  describe('bridgeTo', () => {
    describe('when called by owner', () => {
      it('should bridge tokens and emit event', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)

        // Act / Assert
        await expectBridgeToSucceed({
          bridge, from: owner, to: destination, amount, token,
        })
      })
      it('should increment bridge ID after each bridge', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const initialBridgeId = await bridge.nextBridgeToId()
        const bridgeCount = 5
        await mintToOwner(token, owner, amount * BigInt(bridgeCount))

        // Act / Assert
        for (let i = 0; i < bridgeCount; i++) {
          await expectBridgeToSucceed({
            bridge, from: owner, to: destination, amount, token,
          })
          const nextBridgeToId = await bridge.nextBridgeToId()
          const expectedNextBridgeToId = initialBridgeId + BigInt(i + 1)
          expect(nextBridgeToId).to.equal(expectedNextBridgeToId)
        }
      })
      it('should revert if trying to bridge more than balance', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount / 2n)

        // Act / Assert
        await expect(expectBridgeToSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWithCustomError(token, 'ERC20InsufficientBalance')
      })
      it('should revert if trying to bridge more than max bridge amount', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount() + 1n
        await mintToOwner(token, owner, amount)

        // Act / Assert
        await expect(expectBridgeToSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWith('amount > max')
      })
    })
    describe('when called by non-owner', () => {
      it('should bridge tokens and emit event', async () => {
        // Arrange
        const [owner, destination, user] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await expectMintToSucceed(token, owner, user, amount)

        // Act / Assert
        await expectBridgeToSucceed({
          bridge, from: user, to: destination, amount, token,
        })
      })
      it('should increment bridge ID after each bridge', async () => {
        // Arrange
        const [owner, destination, user] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const initialBridgeId = await bridge.nextBridgeToId()
        const bridgeCount = 5
        await expectMintToSucceed(token, owner, user, amount * BigInt(bridgeCount))

        // Act / Assert
        for (let i = 0; i < bridgeCount; i++) {
          await expectBridgeToSucceed({
            bridge, from: user, to: destination, amount, token,
          })
          const nextBridgeToId = await bridge.nextBridgeToId()
          const expectedNextBridgeToId = initialBridgeId + BigInt(i + 1)
          expect(nextBridgeToId).to.equal(expectedNextBridgeToId)
        }
      })
      it('should revert if trying to bridge more than balance', async () => {
        // Arrange
        const [owner, destination, user] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await expectMintToSucceed(token, owner, user, amount / 2n)

        // Act / Assert
        await expect(expectBridgeToSucceed({
          bridge, from: user, to: destination, amount, token,
        })).to.be.revertedWithCustomError(token, 'ERC20InsufficientBalance')
      })
      it('should revert if trying to bridge more than max bridge amount', async () => {
        // Arrange
        const [owner, destination, user] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount() + 1n
        await expectMintToSucceed(token, owner, user, amount)

        // Act / Assert
        await expect(expectBridgeToSucceed({
          bridge, from: user, to: destination, amount, token,
        })).to.be.revertedWith('amount > max')
      })
    })
  })
  describe.only('bridgeFrom', () => {
    describe('when called by owner', () => {
      it('should bridge tokens and emit event', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)
        await fundBridge(token, owner, bridge, amount)

        // Act / Assert
        await expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount, token,
        })
      })
      it('should increment bridge ID after each bridge', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const initialBridgeId = await bridge.nextBridgeFromId()
        const bridgeCount = 5
        const totalAmount = amount * BigInt(bridgeCount)
        await mintToOwner(token, owner, totalAmount)
        await fundBridge(token, owner, bridge, totalAmount)

        // Act / Assert
        for (let i = 0; i < bridgeCount; i++) {
          await expectBridgeFromSucceed({
            bridge, from: owner, to: destination, amount, token,
          })
          const nextBridgeFromId = await bridge.nextBridgeFromId()
          const expectedNextBridgeFromId = initialBridgeId + BigInt(i + 1)
          expect(nextBridgeFromId).to.equal(expectedNextBridgeFromId)
        }
      })

      it('should revert if trying to bridge more than balance', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount / 2n)
        await fundBridge(token, owner, bridge, amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWithCustomError(token, 'ERC20InsufficientBalance')
      })
      it('should revert if trying to bridge more than max bridge amount', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount() + 1n
        await mintToOwner(token, owner, amount)
        await fundBridge(token, owner, bridge, amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWith('amount > max')
      })
      it('should revert if trying to bridge more than bridge has', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)
        await fundBridge(token, owner, bridge, amount / 2n)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWith('insufficient pool')
      })
    })
    describe('when called by non-owner', () => {
      it('should fail because non-owners cannot bridge from remote', async () => {
        // Arrange
        const [owner, destination, user] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)
        await fundBridge(token, owner, bridge, amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: user, to: destination, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
})
