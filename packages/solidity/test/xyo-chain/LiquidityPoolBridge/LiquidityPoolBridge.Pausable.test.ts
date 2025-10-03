import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  deployLiquidityPoolBridge, deployTestERC20, expectBridgeFromSucceed, expectBridgeToSucceed, fundBridge, mintToOwner,
} from '../helpers/index.js'

const { ethers } = hre

describe('LiquidityPoolBridge.Pausable', () => {
  const amount = ethers.parseUnits('1000000', 18)
  describe('pause', () => {
    describe('when called by owner', () => {
      it('should pause', async () => {
      // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        expect(await bridge.paused()).to.equal(false)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        expect(await bridge.paused()).to.equal(true)
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
        expect(await bridge.paused()).to.equal(false)

        // Act/Assert
        await expect(bridge.connect(other).pause()).to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
  describe('unpause', () => {
    describe('when called by owner', () => {
      it('should unpause', async () => {
      // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await bridge.connect(owner).pause()
        expect(await bridge.paused()).to.equal(true)

        // Act
        await bridge.connect(owner).unpause()

        // Assert
        expect(await bridge.paused()).to.equal(false)
      })
    })
    describe('when called by non-owner', () => {
      it('should revert', async () => {
      // Arrange
        const [owner, other] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await bridge.connect(owner).pause()
        expect(await bridge.paused()).to.equal(true)

        // Act/Assert
        await expect(bridge.connect(other).unpause()).to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
  describe('when paused', () => {
    it('should indicate paused', async () => {
      // Arrange
      const [owner, payout] = await ethers.getSigners()
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, payout.address)
      const { bridge } = await loadFixture(fixture)
      expect(await bridge.paused()).to.equal(false)

      // Act
      await bridge.connect(owner).pause()

      // Assert
      expect(await bridge.paused()).to.equal(true)
    })
    describe('should prevent calls to', () => {
      it('bridgeTo', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        await expect(expectBridgeToSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'EnforcedPause')
      })
      it('bridgeFrom', async () => {
        // Arrange
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)
        await fundBridge(token, owner, bridge, amount)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'EnforcedPause')
      })
      it('pause', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        await expect(bridge.connect(owner).pause())
          .to.be.revertedWithCustomError(bridge, 'EnforcedPause')
      })
    })
    describe('should allow calls to', () => {
      it('setMaxBridgeAmount', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        await bridge.connect(owner).setMaxBridgeAmount(1n)
      })
      it('unpause', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        await bridge.connect(owner).unpause()
      })
    })
  })
})
