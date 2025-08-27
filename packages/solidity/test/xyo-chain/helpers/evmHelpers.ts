import { network } from 'hardhat'

export const advanceBlocks = async (blocks: number | bigint) => {
  const { ethers } = await network.connect()
  for (let i = 0; i < Number(blocks); i++) {
    await ethers.provider.send('evm_mine', [])
  }
}
