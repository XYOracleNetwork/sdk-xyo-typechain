import { readFileSync } from 'node:fs'
import path from 'node:path'

import hre from 'hardhat'

async function main() {
  const networkName = hre.network.name
  const chainId = hre.network.config.chainId
  console.log(`Running on: ${networkName} (Chain ID: ${chainId})`)

  const deploymentFile = path.join(__dirname, `../ignition/deployments/chain-${chainId}/deployed_addresses.json`)
  const deployments = JSON.parse(readFileSync(deploymentFile, 'utf8'))

  const [signer] = await hre.ethers.getSigners()
  const address = signer.address
  console.log('Signer Address:', address)

  const stakedXyoChainV2 = await hre.ethers.getContractAt('StakedXyoChainV2', deployments['StakedXyoChainV2#StakedXyoChainV2'], signer)
  const stakingTokenAddress = await stakedXyoChainV2.stakingTokenAddress()
  console.log('Staking Token Address:', stakingTokenAddress)
  const stakeAmount = hre.ethers.parseUnits('4', 18)

  const erc20 = await hre.ethers.getContractAt('IERC20', stakingTokenAddress, signer)
  await erc20.approve(await stakedXyoChainV2.getAddress(), stakeAmount)

  const balance = await erc20.balanceOf(signer.address)
  const allowance = await erc20.allowance(signer.address, await stakedXyoChainV2.getAddress())
  console.log('Token Balance:', balance.toString())
  console.log('Allowance:', allowance.toString())

  await stakedXyoChainV2.addStake(signer.address, stakeAmount)
}

main().catch(console.error)
