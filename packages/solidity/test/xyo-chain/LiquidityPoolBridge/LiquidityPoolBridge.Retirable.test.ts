import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  deployLiquidityPoolBridge, deployTestERC20, expectBridgeFromSucceed, expectBridgeToSucceed, fundHotWallet, mintToOwner,
} from '../helpers/index.js'

const { ethers } = hre

describe('LiquidityPoolBridge.Retirable', () => {
  const amount = ethers.parseUnits('1000000', 18)

  let owner: HardhatEthersSigner
  let destination: HardhatEthersSigner
  let hotWallet: HardhatEthersSigner

  beforeEach(async () => {
    [owner, destination, hotWallet] = await ethers.getSigners()
  })

  describe('retire', () => {
    describe('when called by owner', () => {
      it('should pause the contract', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)

        // Act
        expect(await bridge.connect(owner).paused()).to.equal(false)
        await bridge.connect(owner).retire()

        // Assert
        expect(await bridge.connect(owner).paused()).to.equal(true)
      })
      it('should allow already paused contract', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)

        // Act/Assert
        await expect(bridge.connect(destination).retire())
          .to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
  describe('when retired', () => {
    it('should indicate retired', async () => {
      // Arrange
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)
        await fundHotWallet(token, owner, hotWallet, amount)

        // Act
        await bridge.connect(owner).retire()

        // Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, to: destination, amount, token, hotWallet,
        })).to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
      it('setMaxBridgeAmount', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).retire()

        // Assert
        await expect(bridge.connect(owner).setMaxBridgeAmount(1n))
          .to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
      it('pause', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).retire()

        // Assert
        await expect(bridge.connect(owner).pause())
          .to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
      it('unpause', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)

        // Act
        await bridge.connect(owner).retire()

        // Assert
        await expect(bridge.connect(owner).unpause())
          .to.be.revertedWithCustomError(bridge, 'ContractRetired')
      })
      it('retire', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
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
