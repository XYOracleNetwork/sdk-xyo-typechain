import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'
import { expect } from 'chai'

import type { AddressStakingV2, BridgeableToken } from '../../../typechain-types/index.js'

export const mintAndApprove = async (token: BridgeableToken, staker: HardhatEthersSigner, stakingContract: AddressStakingV2, amount: bigint) => {
  await token.mint(staker, amount)
  await token.connect(staker).approve(await stakingContract.getAddress(), amount)
}

export const expectMintToSucceed = async (token: BridgeableToken, caller: HardhatEthersSigner, recipient: HardhatEthersSigner, amount: bigint) => {
  const tx = await token.connect(caller).mint(recipient.address, amount)
  await tx.wait()
  const balance = await token.balanceOf(recipient.address)
  expect(balance).to.equal(amount)
}

export const mintToOwner = async (token: BridgeableToken, owner: HardhatEthersSigner, amount: bigint) => {
  await expectMintToSucceed(token, owner, owner, amount)
}
