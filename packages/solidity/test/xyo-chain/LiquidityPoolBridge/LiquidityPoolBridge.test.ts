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

  const expectBridgeToSucceed = async ({
    bridge, from, to, amount, token,
  }: {
    amount: bigint
    bridge: LiquidityPoolBridge
    from: HardhatEthersSigner
    to: HardhatEthersSigner
    token: BridgeableToken
  }) => {
    const nextBridgeId = await bridge.nextOutboundBridgeId()
    const initialBalance = await token.balanceOf(from.address)

    // Approve the bridge to spend tokens
    await token.connect(from).approve(bridge.getAddress(), amount)

    // Send tokens to bridge
    const tx = await bridge.connect(from).bridgeTo(to.address, amount)
    const receipt = await tx.wait()
    expect(receipt).not.to.equal(null)

    const record = await bridge.outboundBridges(nextBridgeId)
    expect(record.from).to.equal(from.address)
    expect(record.to).to.equal(to.address)
    expect(record.amount).to.equal(amount)

    // Get typed logs using the filter
    const logs = await bridge.queryFilter(bridge.filters.BridgeTo())
    expect(logs.length).to.equal(1)
    const log = logs[0]
    expect(log).not.to.equal(undefined)
    const event = assertEx(log)
    expect(event?.args.id).to.equal(nextBridgeId)
    expect(event?.args.from).to.equal(from.address)
    expect(event?.args.to).to.equal(to.address)
    expect(event?.args.amount).to.equal(amount)

    const finalBalance = await token.balanceOf(from.address)
    expect(finalBalance).to.equal(initialBalance - amount)

    return { record, event }
  }

  describe('bridgeTo', () => {
    describe('when called by owner', () => {
      it('should bridge tokens and emit event', async () => {
        const [owner, destination] = await ethers.getSigners()
        const { token } = await loadFixture(deployTestERC20)
        const tokenAddress = await token.getAddress()
        const fixture = () => deployLiquidityPoolBridge(tokenAddress)
        const { bridge } = await loadFixture(fixture)

        await mintToOwner(token, owner, amount)
        await expectBridgeToSucceed({
          bridge, from: owner, to: destination, amount, token,
        })
      })

      // it('should increment bridge ID after each bridge', async () => {
      //   const [owner, destination] = await ethers.getSigners()
      //   const { token } = await loadFixture(deployLiquidityPoolBridge)

      //   const initialBridgeId = await token.nextBridgeId()
      //   const bridgeCount = 5
      //   await mintToOwner(token, owner, amount * BigInt(bridgeCount))
      //   for (let i = 0; i < bridgeCount; i++) {
      //     await expectBridgeToSucceed({
      //       bridge: token, from: owner, to: destination, amount,
      //     })
      //     expect(await token.nextBridgeId()).to.equal(initialBridgeId + BigInt(i + 1))
      //   }
      // })

      // it('should revert if trying to bridge more than balance', async () => {
      //   const [owner, destination] = await ethers.getSigners()
      //   const { token } = await loadFixture(deployLiquidityPoolBridge)

      //   await mintToOwner(token, owner, amount / 2n)

      //   await expect(token.bridge(amount, destination.address)).to.be.reverted
      // })
    })
  })
})
