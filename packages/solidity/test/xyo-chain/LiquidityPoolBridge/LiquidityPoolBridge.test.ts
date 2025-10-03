import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { assertEx } from '@xylabs/assert'
import { expect } from 'chai'
import { ZeroAddress } from 'ethers'
import hre from 'hardhat'

import {
  deployLiquidityPoolBridge, deployTestERC20, expectBridgeFromSucceed, expectBridgeToSucceed, expectMintToSucceed, fundBridge, mintToOwner,
} from '../helpers/index.js'

const { ethers } = hre

describe('LiquidityPoolBridge', () => {
  const amount = ethers.parseUnits('1000000', 18)

  describe('constructor', () => {
    it('should revert if remoteChain is 0', async () => {
      // Arrange
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, undefined, ZeroAddress)

      // Act/Assert
      await expect(loadFixture(fixture))
        .to.be.revertedWith('remoteChain=0')
    })
    it('should revert if token is 0', async () => {
      // Arrange
      const fixture = () => deployLiquidityPoolBridge(ZeroAddress)

      // Act/Assert
      await expect(loadFixture(fixture))
        .to.be.revertedWith('token=0')
    })
    it('should revert if maxBridgeAmount is 0', async () => {
      // Arrange
      const [owner] = await ethers.getSigners()
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, owner.address, owner.address, 0n)

      // Act/Assert
      await expect(loadFixture(fixture))
        .to.be.revertedWith('max=0')
    })
  })
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
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountExceedsMax')
      })
      it('should revert if trying to bridge zero amount', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount()
        await mintToOwner(token, owner, amount)

        // Act / Assert
        await expect(expectBridgeToSucceed({
          bridge, from: owner, to: destination, amount: 0n, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountZero')
      })
      it('should revert if trying to bridge to zero address', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount() + 1n
        await mintToOwner(token, owner, amount)

        // Act / Assert
        await expect(expectBridgeToSucceed({
          bridge, from: owner, to: ZeroAddress, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAddressZero')
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
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountExceedsMax')
      })
      it('should revert if trying to bridge zero amount', async () => {
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
          bridge, from: user, to: destination, amount: 0n, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountZero')
      })
      it('should revert if trying to bridge to zero address', async () => {
        // Arrange
        const [owner, user] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount() + 1n
        await expectMintToSucceed(token, owner, user, amount)

        // Act / Assert
        await expect(expectBridgeToSucceed({
          bridge, from: user, to: ZeroAddress, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAddressZero')
      })
    })
  })
  describe('bridgeFrom', () => {
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
        await mintToOwner(token, owner, amount)
        await fundBridge(token, owner, bridge, amount / 2n)

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
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountExceedsMax')
      })
      it('should revert if trying to bridge zero amount', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount()
        await mintToOwner(token, owner, amount)
        await fundBridge(token, owner, bridge, amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount: 0n, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountZero')
      })
      it('should revert if trying to bridge zero address', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount()
        await mintToOwner(token, owner, amount)
        await fundBridge(token, owner, bridge, amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: ZeroAddress, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountZero')
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
  describe('setMaxBridgeAmount', () => {
    describe('when called by owner', () => {
      it('should set max bridge amount and emit event', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const oldAmount = await bridge.maxBridgeAmount()
        const newAmount = oldAmount + 1n

        // Act
        await bridge.connect(owner).setMaxBridgeAmount(newAmount)

        // Assert
        expect(await bridge.maxBridgeAmount()).to.equal(newAmount)
        // Get typed logs using the filter
        const logs = await bridge.queryFilter(bridge.filters.MaxBridgeAmountUpdated())
        expect(logs.length > 0).to.equal(true)
        const log = logs.at(-1)
        expect(log).not.to.equal(undefined)
        const event = assertEx(log)
        expect(event?.args.oldAmount).to.equal(oldAmount)
        expect(event?.args.newAmount).to.equal(newAmount)
      })
      it('should revert if set to 0', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const newAmount = 0n

        // Act/Assert
        await expect(bridge.connect(owner).setMaxBridgeAmount(newAmount))
          .to.be.revertedWith('max=0')
      })
    })
    describe('when called by non-owner', () => {
      it('should revert', async () => {
        // Arrange
        const [_, other] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        const previousMax = await bridge.maxBridgeAmount()
        const expected = previousMax + 1n

        // Act/Assert
        await expect(bridge.connect(other).setMaxBridgeAmount(expected))
          .to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
})
