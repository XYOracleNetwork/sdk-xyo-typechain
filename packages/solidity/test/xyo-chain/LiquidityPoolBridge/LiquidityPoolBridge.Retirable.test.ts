import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { assertEx } from '@xylabs/assert'
import { expect } from 'chai'
import hre from 'hardhat'

import type { BridgeableToken, LiquidityPoolBridge } from '../../../typechain-types/index.js'
import {
  deployLiquidityPoolBridge, deployTestERC20, expectBridgeFromSucceed, expectBridgeToSucceed, expectMintToSucceed, fundBridge, mintToOwner,
} from '../helpers/index.js'

const { ethers } = hre

describe.only('LiquidityPoolBridge.Retirable', () => {
  const amount = ethers.parseUnits('1000000', 18)

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
