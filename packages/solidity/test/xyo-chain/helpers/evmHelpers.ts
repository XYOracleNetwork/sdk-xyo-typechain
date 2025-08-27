import hre from 'hardhat'

const { ethers } = hre

export const advanceBlocks = async (blocks: number | bigint) => {
  for (let i = 0; i < Number(blocks); i++) {
    await ethers.provider.send('evm_mine', [])
  }
}
