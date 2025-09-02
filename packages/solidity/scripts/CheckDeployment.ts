import { readFileSync } from 'node:fs'
import path from 'node:path'

import hre from 'hardhat'

async function main() {
  const networkName = hre.network.name
  const chainId = hre.network.config.chainId
  console.log(`Running on: ${networkName} (Chain ID: ${chainId})`)

  const deploymentFile = path.join(__dirname, `../ignition/deployments/chain-${chainId}/deployed_addresses.json`)
  const deployments = JSON.parse(readFileSync(deploymentFile, 'utf8'))

  const contract = await hre.ethers.getContractAt('SingleAddressSubGovernor', deployments['SingleAddressSubGovernor#SingleAddressSubGovernor'])
  const result = await contract.owner()
  console.log('Result:', result)
}

main().catch(console.error)
