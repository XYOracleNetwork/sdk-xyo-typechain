import { readFileSync } from 'node:fs'
import path from 'node:path'

import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import hre from 'hardhat'

const producerAddress = '0x8a499c81cb6a8106933f66a6cfdd6ea6439575e3'
const networkStakingAddress = '0x1969196919691969196919691969196919691969'

const mintToStaker = async (staker: HardhatEthersSigner, amount: bigint, stakingTokenAddress: string) => {
  const [deployer] = await hre.ethers.getSigners()
  const erc20 = await hre.ethers.getContractAt('BridgeableToken', stakingTokenAddress, deployer)
  await erc20.mint(staker, amount)
}

const stakeAddress = async (staker: HardhatEthersSigner, staked: string, amount: bigint, stakingTokenAddress: string, stakedXyoChainV2Address: string) => {
  const stakedXyoChainV2 = await hre.ethers.getContractAt('StakedXyoChainV2', stakedXyoChainV2Address, staker)
  const stakeAmount = hre.ethers.parseUnits(amount.toString(), 18)
  await mintToStaker(staker, stakeAmount, stakingTokenAddress)
  const erc20 = await hre.ethers.getContractAt('BridgeableToken', stakingTokenAddress, staker)
  await erc20.approve(stakedXyoChainV2Address, stakeAmount)
  await stakedXyoChainV2.addStake(staked, stakeAmount)
  const active = await stakedXyoChainV2.activeByAddressStaked(staked)
  const stakeResult = await stakedXyoChainV2.getStake(staker, 0)
  console.log('Stake Address:', staker)
  console.log('Stake Amount:', stakeAmount)
  console.log('Active:', active)
  console.log('Stake:', stakeResult)
}

async function main() {
  const networkName = hre.network.name
  const chainId = hre.network.config.chainId
  console.log(`Running on: ${networkName} (Chain ID: ${chainId})`)

  const deploymentFile = path.join(__dirname, `../ignition/deployments/chain-${chainId}/deployed_addresses.json`)
  const deployments = JSON.parse(readFileSync(deploymentFile, 'utf8'))

  const [deployer, producerStaker, ...stakers] = await hre.ethers.getSigners()
  const address = deployer.address
  console.log('Signer Address:', address)

  const stakedXyoChainV2 = await hre.ethers.getContractAt('StakedXyoChainV2', deployments['StakedXyoChainV2#StakedXyoChainV2'], deployer)
  const stakedXyoChainV2Address = await stakedXyoChainV2.getAddress()
  const stakingTokenAddress = await stakedXyoChainV2.stakingTokenAddress()
  console.log('Staking Token Address:', stakingTokenAddress)

  // Stake producer
  await stakeAddress(producerStaker, producerAddress, 10_000n, stakingTokenAddress, stakedXyoChainV2Address)

  // Stake network address
  for (const [i, staker] of stakers.entries()) {
    const stake = 100 * (i + 100)
    await stakeAddress(staker, networkStakingAddress, BigInt(stake), stakingTokenAddress, stakedXyoChainV2Address)
  }
}

main().catch(console.error)
