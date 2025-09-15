import hre from 'hardhat'

/**
 * The number of blocks to mine.
 */
const blocksToMine = 10

/**
 * The amount of time to increase the EVM time by, in seconds.
 */
const timeToIncrease = 60 * 60 // Increase time by 1 hour

/**
 * This script advances the blockchain by a specified number of blocks and increases the EVM time.
 */
async function main() {
  await hre.network.provider.send('hardhat_mine', [hre.ethers.toBeHex(blocksToMine)])
  await hre.network.provider.send('evm_increaseTime', [timeToIncrease])
  await hre.network.provider.send('evm_mine')
}

main().catch(console.error)
