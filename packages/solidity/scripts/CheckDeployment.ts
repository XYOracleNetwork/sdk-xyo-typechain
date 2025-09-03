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
  const xl1Governance = await hre.ethers.getContractAt('XL1Governance', deployments['XL1Governance#XL1Governance'], signer)
  const xl1GovernanceAddress = await xl1Governance.getAddress()
  console.log('XL1 Governance Address:', xl1GovernanceAddress)
  const token = await hre.ethers.getContractAt('BridgeableToken', deployments['BridgeableToken#BridgeableToken'], signer)
  const tokenOwner = await token.owner()
  console.log('Token Owner Address:', tokenOwner)
  const stakedXyoChainV2 = await hre.ethers.getContractAt('StakedXyoChainV2', deployments['StakedXyoChainV2#StakedXyoChainV2'], signer)
  const stakingTokenAddress = await stakedXyoChainV2.stakingTokenAddress()
  console.log('Staking Token Address:', stakingTokenAddress)

  const stakedAmount = await stakedXyoChainV2.connect(signer).getStake(signer, 0)
  console.log(`Staked Amount: ${stakedAmount}`)
}

main().catch(console.error)
