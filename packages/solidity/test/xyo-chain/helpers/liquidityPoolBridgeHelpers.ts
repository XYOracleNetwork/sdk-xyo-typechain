import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { assertEx } from '@xylabs/assert'
import { expect } from 'chai'
import { type AddressLike, ethers } from 'ethers'

import type { BridgeableToken, LiquidityPoolBridge } from '../../../typechain-types'

export const approveHotWallet = async (token: BridgeableToken, hotWallet: HardhatEthersSigner, bridgeAddress: string, amount: bigint) => {
  await token.connect(hotWallet).approve(bridgeAddress, amount)
}

export const fundHotWallet = async (
  token: BridgeableToken,
  owner: HardhatEthersSigner,
  hotWallet: HardhatEthersSigner,
  amount: bigint,
) => {
  const tx = await token.connect(owner).mint(hotWallet.address, amount)
  await tx.wait()
  const balance = await token.balanceOf(hotWallet.address)
  expect(balance).to.equal(amount)
}

export const expectBridgeFromSucceed = async ({
  bridge, from, to, amount, token, hotWallet, nonce,
}: {
  amount: bigint
  bridge: LiquidityPoolBridge
  from: HardhatEthersSigner
  hotWallet: HardhatEthersSigner
  nonce?: string
  to: AddressLike
  token: BridgeableToken
}) => {
  const nextBridgeFromId = await bridge.nextBridgeFromId()
  const initialBalance = await token.balanceOf(hotWallet.address)

  // random sha256 hash for nonce
  nonce = ethers.sha256(ethers.randomBytes(32))

  // Send tokens to bridge
  const tx = await bridge.connect(from).bridgeFromRemote(from.address, to, amount, nonce)
  const receipt = await tx.wait()
  expect(receipt).not.to.equal(null)

  // Get typed logs using the filter
  const logs = await bridge.queryFilter(bridge.filters.BridgedFromRemote())
  expect(logs.length > 0).to.equal(true)
  const log = logs.at(-1)
  expect(log).not.to.equal(undefined)
  const event = assertEx(log)

  // test counter increment
  expect(await bridge.nextBridgeFromId()).to.equal(nextBridgeFromId + 1n)

  // test event args match expected values
  expect(event?.args.id).to.equal(nonce)
  expect(event?.args.srcAddress).to.equal(from.address)
  expect(event?.args.destAddress).to.equal(to)
  expect(event?.args.amount).to.equal(amount)

  // test mapping entry matches expected values
  const newMapEntry = await bridge.bridgesFromRemote(nonce)
  expect(newMapEntry.srcAddress).to.equal(from.address)
  expect(newMapEntry.destAddress).to.equal(to)
  expect(newMapEntry.amount).to.equal(amount)
  expect(newMapEntry.destToken).to.equal(await token.getAddress())

  const finalBalance = await token.balanceOf(hotWallet.address)
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

  // test counter increment
  expect(await bridge.nextBridgeToId()).to.equal(nextBridgeId + 1n)

  // test event args match expected values
  expect(event?.args.id).to.equal(nextBridgeId)
  expect(event?.args.srcAddress).to.equal(from.address)
  expect(event?.args.destAddress).to.equal(to)
  expect(event?.args.amount).to.equal(amount)
  expect(event?.args.destToken).to.equal(await bridge.remoteChain())

  // test mapping entry matches expected values
  const newMapEntry = await bridge.bridgesToRemote(nextBridgeId)
  expect(newMapEntry.srcAddress).to.equal(from.address)
  expect(newMapEntry.destAddress).to.equal(to)
  expect(newMapEntry.amount).to.equal(amount)
  expect(newMapEntry.destToken).to.equal(await token.getAddress())

  const finalBalance = await token.balanceOf(from.address)
  expect(finalBalance).to.equal(initialBalance - amount)

  return { event }
}
