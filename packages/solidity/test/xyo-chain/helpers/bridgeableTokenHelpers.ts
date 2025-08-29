import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js'

import type { AddressStakingV2, BridgeableToken } from '../../../typechain-types/index.js'

export const mintAndApprove = async (token: BridgeableToken, staker: HardhatEthersSigner, stakingContract: AddressStakingV2, amount: bigint) => {
  await token.mint(staker, amount)
  await token.connect(staker).approve(await stakingContract.getAddress(), amount)
}
