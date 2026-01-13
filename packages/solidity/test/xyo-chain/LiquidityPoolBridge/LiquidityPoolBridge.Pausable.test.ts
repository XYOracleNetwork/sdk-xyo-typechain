import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  deployLiquidityPoolBridge, deployTestERC20, expectBridgeFromSucceed, expectBridgeToSucceed, fundHotWallet, mintToOwner,
} from '../helpers/index.js'

const { ethers } = hre

describe('LiquidityPoolBridge.Pausable', () => {
  const amount = ethers.parseUnits('1000000', 18)

  let owner: HardhatEthersSigner
  let destination: HardhatEthersSigner
  let hotWallet: HardhatEthersSigner

  beforeEach(async () => {
    [owner, destination, hotWallet] = await ethers.getSigners()
  })

  describe('pause', () => {
    describe('when called by owner', () => {
      it('should pause', async () => {
      // Arrange
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        expect(await bridge.paused()).to.equal(false)

        // Act/Assert
        await expect(bridge.connect(destination).pause()).to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
  describe('unpause', () => {
    describe('when called by owner', () => {
      it('should unpause', async () => {
      // Arrange
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
        await bridge.connect(owner).pause()
        expect(await bridge.paused()).to.equal(true)

        // Act/Assert
        await expect(bridge.connect(destination).unpause()).to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
  describe('when paused', () => {
    it('should indicate paused', async () => {
      // Arrange
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)
        await fundHotWallet(token, owner, hotWallet, amount)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount, token, hotWallet,
        })).to.be.revertedWithCustomError(bridge, 'EnforcedPause')
      })
      it('pause', async () => {
        // Arrange
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        await bridge.connect(owner).setMaxBridgeAmount(1n)
      })
      it('unpause', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).pause()

        // Assert
        await bridge.connect(owner).unpause()
      })
    })
  })
})
