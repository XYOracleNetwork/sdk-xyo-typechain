import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  deployLiquidityPoolBridge, deployTestERC20, expectBridgeFromSucceed, expectBridgeToSucceed, fundBridge, mintToOwner,
} from '../helpers/index.js'

const { ethers } = hre

describe.only('LiquidityPoolBridge.Retirable', () => {
  const amount = ethers.parseUnits('1000000', 18)

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
    })
  })
})
