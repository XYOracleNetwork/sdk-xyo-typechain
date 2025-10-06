import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { assertEx } from '@xylabs/assert'
import { expect } from 'chai'
import type { AddressLike } from 'ethers'

import type { BridgeableToken, LiquidityPoolBridge } from '../../../typechain-types'

export const fundBridge = async (token: BridgeableToken, owner: HardhatEthersSigner, bridge: LiquidityPoolBridge, amount: bigint) => {
  await token.connect(owner).approve(bridge.getAddress(), amount)
  const tx = await token.transfer(bridge.getAddress(), amount)
  await tx.wait()
  const balance = await token.balanceOf(bridge.getAddress())
  expect(balance).to.equal(amount)
}

export const expectBridgeFromSucceed = async ({
  bridge, from, to, amount, token,
}: {
  amount: bigint
  bridge: LiquidityPoolBridge
  from: HardhatEthersSigner
  to: AddressLike
  token: BridgeableToken
}) => {
  const nextBridgeId = await bridge.nextBridgeFromId()
  const initialBalance = await token.balanceOf(await bridge.getAddress())

  // Send tokens to bridge
  const tx = await bridge.connect(from).bridgeFromRemote(from.address, to, amount)
  const receipt = await tx.wait()
  expect(receipt).not.to.equal(null)

  // Get typed logs using the filter
  const logs = await bridge.queryFilter(bridge.filters.BridgedFromRemote())
  expect(logs.length > 0).to.equal(true)
  const log = logs.at(-1)
  expect(log).not.to.equal(undefined)
  const event = assertEx(log)
  expect(event?.args.id).to.equal(nextBridgeId)
  expect(event?.args.srcAddress).to.equal(from.address)
  expect(event?.args.destAddress).to.equal(to)
  expect(event?.args.amount).to.equal(amount)

  const finalBalance = await token.balanceOf(await bridge.getAddress())
  expect(finalBalance).to.equal(initialBalance - amount)

  return { event }
}

export const expectBridgeToSucceed = async ({
  bridge, from, to, amount, token,
}: {
  amount: bigint
  bridge: LiquidityPoolBridge
  from: HardhatEthersSigner
  to: AddressLike
  token: BridgeableToken
}) => {
  const nextBridgeId = await bridge.nextBridgeToId()
  const initialBalance = await token.balanceOf(from.address)

  // Approve the bridge to spend tokens
  await token.connect(from).approve(bridge.getAddress(), amount)

  // Send tokens to bridge
  const tx = await bridge.connect(from).bridgeToRemote(to, amount)
  const receipt = await tx.wait()
  expect(receipt).not.to.equal(null)

  // Get typed logs using the filter
  const logs = await bridge.queryFilter(bridge.filters.BridgedToRemote())
  expect(logs.length > 0).to.equal(true)
  const log = logs.at(-1)
  expect(log).not.to.equal(undefined)
  const event = assertEx(log)
  expect(event?.args.id).to.equal(nextBridgeId)
  expect(event?.args.from).to.equal(from.address)
  expect(event?.args.to).to.equal(to)
  expect(event?.args.amount).to.equal(amount)

  const finalBalance = await token.balanceOf(from.address)
  expect(finalBalance).to.equal(initialBalance - amount)

  return { event }
}
