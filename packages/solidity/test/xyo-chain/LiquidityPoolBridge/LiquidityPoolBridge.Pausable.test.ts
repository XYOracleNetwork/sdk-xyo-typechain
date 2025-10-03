import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  deployLiquidityPoolBridge, deployTestERC20, expectBridgeFromSucceed, expectBridgeToSucceed, fundBridge, mintToOwner,
} from '../helpers/index.js'

const { ethers } = hre

describe.only('LiquidityPoolBridge.Pausable', () => {
  const amount = ethers.parseUnits('1000000', 18)

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
        })).to.be.revertedWithCustomError(bridge, 'Paused')
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
        })).to.be.revertedWithCustomError(bridge, 'Paused')
      })
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
        await expect(bridge.connect(owner).setMaxBridgeAmount(1n))
          .to.be.revertedWithCustomError(bridge, 'Paused')
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
          .to.be.revertedWithCustomError(bridge, 'Paused')
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
        await expect(bridge.connect(owner).unpause())
          .to.be.revertedWithCustomError(bridge, 'Paused')
      })
    })
  })
})
