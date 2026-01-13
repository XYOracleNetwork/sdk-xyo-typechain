import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { assertEx } from '@xylabs/assert'
import { expect } from 'chai'
import { ZeroAddress } from 'ethers'
import hre from 'hardhat'

import {
  approveHotWallet, deployLiquidityPoolBridge, deployTestERC20,
  expectBridgeFromSucceed, expectBridgeToSucceed, expectMintToSucceed,
  fundHotWallet, mintToOwner, mintToUser,
} from '../helpers/index.js'

const { ethers } = hre

describe('LiquidityPoolBridge', () => {
  const amount = ethers.parseUnits('1000000', 18)

  let owner: HardhatEthersSigner
  let destination: HardhatEthersSigner
  let hotWallet: HardhatEthersSigner
  let user: HardhatEthersSigner

  beforeEach(async () => {
    [owner, destination, hotWallet, user] = await ethers.getSigners()
  })

  describe('constructor', () => {
    it('should revert if remoteChain is 0', async () => {
      // Arrange
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address, ZeroAddress)

      // Act/Assert
      await expect(loadFixture(fixture))
        .to.be.revertedWith('remoteChain=0')
    })
    it('should revert if token is 0', async () => {
      // Arrange
      const fixture = () => deployLiquidityPoolBridge(ZeroAddress, hotWallet.address)

      // Act/Assert
      await expect(loadFixture(fixture))
        .to.be.revertedWith('token=0')
    })
    it('should revert if maxBridgeAmount is 0', async () => {
      // Arrange
      const { token } = await loadFixture(deployTestERC20)
      const tokenAddress = await token.getAddress()
      const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address, undefined, 0n)

      // Act/Assert
      await expect(loadFixture(fixture))
        .to.be.revertedWith('max=0')
    })
  })
  describe('bridgeTo', () => {
    describe('when called by owner', () => {
      it('should bridge tokens and emit event', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        await mintToOwner(token, owner, amount)

        // Act / Assert
        await expectBridgeToSucceed({
          bridge, from: owner, to: destination, amount, token,
        })
      })
      it('should increment bridge ID after each bridge', async () => {
        // Arrange
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        await mintToUser(token, owner, user, amount)

        // Act / Assert
        await expectBridgeToSucceed({
          bridge, from: user, to: destination, amount, token,
        })
      })
      it('should increment bridge ID after each bridge', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        await fundHotWallet(token, owner, hotWallet, amount)
        await approveHotWallet(token, hotWallet, await bridge.getAddress(), amount)

        // Act / Assert
        await expectBridgeFromSucceed({
          bridge, from: owner, hotWallet, to: destination, amount, token,
        })
      })
      it('should increment bridge ID after each bridge', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        const initialBridgeId = await bridge.nextBridgeFromId()
        const bridgeCount = 5
        const totalAmount = amount * BigInt(bridgeCount)
        await fundHotWallet(token, owner, hotWallet, totalAmount)

        // Act / Assert
        for (let i = 0; i < bridgeCount; i++) {
          await approveHotWallet(token, hotWallet, await bridge.getAddress(), amount)
          await expectBridgeFromSucceed({
            bridge, from: owner, hotWallet, to: destination, amount, token,
          })
          const nextBridgeFromId = await bridge.nextBridgeFromId()
          const expectedNextBridgeFromId = initialBridgeId + BigInt(i + 1)
          expect(nextBridgeFromId).to.equal(expectedNextBridgeFromId)
        }
      })
      it('should revert if trying to bridge more than balance', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        await fundHotWallet(token, owner, hotWallet, amount / 2n)
        await approveHotWallet(token, hotWallet, await bridge.getAddress(), amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, hotWallet, to: destination, amount, token,
        })).to.be.revertedWithCustomError(token, 'ERC20InsufficientBalance')
      })
      it('should revert if trying to bridge more than max bridge amount', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount() + 1n
        await fundHotWallet(token, owner, hotWallet, amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, hotWallet, to: destination, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountExceedsMax')
      })
      it('should revert if trying to bridge zero amount', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        const amount = await bridge.maxBridgeAmount()
        await fundHotWallet(token, owner, hotWallet, amount)
        await approveHotWallet(token, hotWallet, await bridge.getAddress(), amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, hotWallet, to: destination, amount: 0n, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAmountZero')
      })
      it('should revert if trying to bridge zero address', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        await fundHotWallet(token, owner, hotWallet, amount)
        await approveHotWallet(token, hotWallet, await bridge.getAddress(), amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: owner, hotWallet, to: ZeroAddress, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'BridgeAddressZero')
      })
    })
    describe('when called by non-owner', () => {
      it('should fail because non-owners cannot bridge from remote', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        await fundHotWallet(token, owner, hotWallet, amount)
        await approveHotWallet(token, hotWallet, await bridge.getAddress(), amount)

        // Act / Assert
        await expect(expectBridgeFromSucceed({
          bridge, from: user, hotWallet, to: destination, amount, token,
        })).to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
  describe('setMaxBridgeAmount', () => {
    describe('when called by owner', () => {
      it('should set max bridge amount and emit event', async () => {
        // Arrange
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
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
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress, hotWallet.address)
        const { bridge } = await loadFixture(fixture)
        const previousMax = await bridge.maxBridgeAmount()
        const expected = previousMax + 1n

        // Act/Assert
        await expect(bridge.connect(destination).setMaxBridgeAmount(expected))
          .to.be.revertedWithCustomError(bridge, 'OwnableUnauthorizedAccount')
      })
    })
  })
})
