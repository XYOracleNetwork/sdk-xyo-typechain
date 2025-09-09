import { readFileSync } from 'node:fs'
import path from 'node:path'

import hre from 'hardhat'

async function main() {
  const networkName = hre.network.name
  const chainId = hre.network.config.chainId
  console.log(`Running on: ${networkName} (Chain ID: ${chainId})`)

  const deploymentFile = path.join(__dirname, `../ignition/deployments/chain-${chainId}/deployed_addresses.json`)
  const deployments = JSON.parse(readFileSync(deploymentFile, 'utf8'))

  const deploymentConfigFile = path.join(__dirname, `../ignition/params.${networkName}.json`)
  const deploymentConfig = JSON.parse(readFileSync(deploymentConfigFile, 'utf8'))
  const { bridgeTreasuryAddress, bridgeTreasuryAmount } = deploymentConfig.DeployXL1

  const [signer] = await hre.ethers.getSigners()
  console.log('Signer Address:', signer.address)
  const xl1Governance = await hre.ethers.getContractAt('XL1Governance', deployments['XL1Governance#XL1Governance'], signer)
  console.log('XL1 Governance Address:', await xl1Governance.getAddress())
  const stakedXyoChainV2 = await hre.ethers.getContractAt('StakedXyoChainV2', deployments['StakedXyoChainV2#StakedXyoChainV2'], signer)
  console.log('Staked XYO Chain V2 Address:', await stakedXyoChainV2.getAddress())
  const stakingTokenAddress = await stakedXyoChainV2.stakingTokenAddress()
  console.log('Staking Token Address:', stakingTokenAddress)
  const token = await hre.ethers.getContractAt('BridgeableToken', deployments['BridgeableToken#BridgeableToken'], signer)
  console.log('BridgeableToken Address:', await token.getAddress())
  const tokenOwner = await token.owner()
  console.log('Expected BridgeableToken Owner Address:', bridgeTreasuryAddress)
  console.log('Actual BridgeableToken Owner Address:', tokenOwner)
  const balance = await token.balanceOf(bridgeTreasuryAddress)
  const decimals = await token.decimals()
  const normalizedBalance = hre.ethers.formatUnits(balance, decimals)
  console.log('Expected BridgeableToken Treasury Balance:', bridgeTreasuryAmount)
  console.log('Actual BridgeableToken Treasury Balance:', normalizedBalance)
  const totalSupply = await token.totalSupply()
  const normalizedTotalSupply = hre.ethers.formatUnits(totalSupply, decimals)
  console.log('BridgeableToken Total Supply:', normalizedTotalSupply)
}

main().catch(console.error)
