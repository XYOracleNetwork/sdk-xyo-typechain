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
  const token = await hre.ethers.getContractAt('BridgeableToken', deployments['BridgeableToken#BridgeableToken'], signer)
  const tokenOwner = await token.owner()
  console.log('Token Owner Address:', tokenOwner)
  const address = signer.address
  console.log('Signer Address:', address)
  await token.mint(signer.address, 1000n)
  const balance = await token.balanceOf(signer.address)
  console.log('Token Balance:', balance.toString())
  // const subGovernor = await hre.ethers.getContractAt('SingleAddressSubGovernor', deployments['SingleAddressSubGovernor#SingleAddressSubGovernor'])
}

main().catch(console.error)
