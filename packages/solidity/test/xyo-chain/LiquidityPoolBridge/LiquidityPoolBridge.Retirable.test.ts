import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  deployLiquidityPoolBridge, deployTestERC20, expectBridgeFromSucceed, expectBridgeToSucceed, fundBridge, mintToOwner,
} from '../helpers/index.js'

const { ethers } = hre

describe('LiquidityPoolBridge.Retirable', () => {
  const amount = ethers.parseUnits('1000000', 18)
  describe('retire', () => {
    describe('when called by owner', () => {
      it('should pause the contract', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        // Act
        expect(await bridge.connect(owner).paused()).to.equal(false)
        await bridge.connect(owner).retire()

        // Assert
        expect(await bridge.connect(owner).paused()).to.equal(true)
      })
      it('should allow already paused contract', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).pause()
        expect(await bridge.connect(owner).paused()).to.equal(true)
        await bridge.connect(owner).retire()

        // Assert
        expect(await bridge.connect(owner).paused()).to.equal(true)
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

        // Act/Assert
        await expect(bridge.connect(other).retire())
          .to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
  describe('when retired', () => {
    it('should send remaining funds to payout address', async () => {
      // Arrange
      const [owner, payout] = await ethers.getSigners()
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, payout.address)
      const { bridge } = await loadFixture(fixture)
      await mintToOwner(token, owner, amount)
      await fundBridge(token, owner, bridge, amount)
      expect(await token.balanceOf(await bridge.getAddress())).to.equal(amount)
      expect(await token.balanceOf(payout.address)).to.equal(0n)

      // Act
      await bridge.connect(owner).retire()

      // Assert
      expect(await token.balanceOf(payout.address)).to.equal(amount)
    })
    it('should indicate retired', async () => {
      // Arrange
      const [owner, payout] = await ethers.getSigners()
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, payout.address)
      const { bridge } = await loadFixture(fixture)
      expect(await bridge.retired()).to.equal(false)

      // Act
      await bridge.connect(owner).retire()

      // Assert
      expect(await bridge.retired()).to.equal(true)
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
        await bridge.connect(owner).retire()

        // Assert
        await expect(expectBridgeToSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'ContractRetired')
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
        await bridge.connect(owner).retire()

        // Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
      it('setMaxBridgeAmount', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).retire()

        // Assert
        await expect(bridge.connect(owner).setMaxBridgeAmount(1n))
          .to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
      it('pause', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).retire()

        // Assert
        await expect(bridge.connect(owner).pause())
          .to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
      it('unpause', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).retire()

        // Assert
        await expect(bridge.connect(owner).unpause())
          .to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
      it('retire', async () => {
        // Arrange
        const [owner] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await bridge.connect(owner).pause()
        expect(await bridge.connect(owner).paused()).to.equal(true)
        await bridge.connect(owner).retire()

        // Act/Assert
        await expect(bridge.connect(owner).retire())
          .to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
    })
  })
})
