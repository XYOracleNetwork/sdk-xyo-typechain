/* eslint-disable max-statements */
import { readFileSync } from 'node:fs'
import path from 'node:path'

import hre from 'hardhat'

const actualPrefix = '[ Actual ]'
const expectedPrefix = '[Expected]'

const parseBigIntLiteral = (value: string): bigint => {
  if (!/^\d+n$/.test(value)) {
    throw new Error(`Invalid bigint literal format: "${value}"`)
  }
  return BigInt(value.slice(0, -1))
}

async function main() {
  // Get network info
  const networkName = hre.network.name
  const chainId = hre.network.config.chainId
  console.log(`Running on: ${networkName} (Chain ID: ${chainId})`)

  // Get deployment info
  const deploymentFile = path.join(__dirname, `../ignition/deployments/chain-${chainId}/deployed_addresses.json`)
  const deployments = JSON.parse(readFileSync(deploymentFile, 'utf8'))

  // Get deployment config
  const deploymentConfigFile = path.join(__dirname, `../ignition/params.${networkName}.json`)
  const deploymentConfig = JSON.parse(readFileSync(deploymentConfigFile, 'utf8'))

  // Get parameters for DeployXL1
  const {
    bridgeTreasuryAddress, bridgeTreasuryAmount, subGovernorCustodyAddress,
  } = deploymentConfig.DeployXL1

  // Display signers
  const [signer] = await hre.ethers.getSigners()
  console.log('Signer Address:', signer.address)

  // Display deployed contract addresses
  const xl1Governance = await hre.ethers.getContractAt('XL1Governance', deployments['XL1Governance#XL1Governance'], signer)
  const xl1GovernanceAddress = await xl1Governance.getAddress()
  console.log('XL1 Governance Address:', xl1GovernanceAddress)
  const stakedXyoChainV2 = await hre.ethers.getContractAt('StakedXyoChainV2', deployments['StakedXyoChainV2#StakedXyoChainV2'], signer)
  console.log('Staked XYO Chain V2 Address:', await stakedXyoChainV2.getAddress())
  const stakingTokenAddress = await stakedXyoChainV2.stakingTokenAddress()
  console.log('Staking Token Address:', stakingTokenAddress)
  const token = await hre.ethers.getContractAt('BridgeableToken', deployments['BridgeableToken#BridgeableToken'], signer)
  console.log('BridgeableToken Address:', await token.getAddress())
  const tokenOwner = await token.owner()

  // Verify subGovernorCustodyAddress is the owner of the Single Address SubGovernor
  const subGovernor = await hre.ethers.getContractAt('SingleAddressSubGovernor', deployments['SingleAddressSubGovernor#SingleAddressSubGovernor'], signer)
  const subGovernorOwner = await subGovernor.owner()
  console.log(expectedPrefix, 'SingleAddressSubGovernor Owner Address:', subGovernorCustodyAddress)
  console.log(actualPrefix, 'SingleAddressSubGovernor Owner Address:', subGovernorOwner)

  // Verify XL1 Governance is the owner of the BridgeableToken
  console.log(expectedPrefix, 'BridgeableToken Owner Address:', xl1GovernanceAddress)
  console.log(actualPrefix, 'BridgeableToken Owner Address:', tokenOwner)

  // Verify expected treasury amount
  const balance = await token.balanceOf(bridgeTreasuryAddress)
  const decimals = await token.decimals()
  const normalizedTreasuryBalance = hre.ethers.formatUnits(balance, decimals)
  const normalizedExpectedTreasuryAmount = hre.ethers.formatUnits(parseBigIntLiteral(bridgeTreasuryAmount), decimals)
  console.log(expectedPrefix, 'BridgeableToken Treasury Balance:', normalizedExpectedTreasuryAmount)
  console.log(actualPrefix, 'BridgeableToken Treasury Balance:', normalizedTreasuryBalance)

  // Verify expected total supply
  const totalSupply = await token.totalSupply()
  const normalizedTotalSupply = hre.ethers.formatUnits(totalSupply, decimals)
  console.log(expectedPrefix, 'BridgeableToken Total Supply:', normalizedExpectedTreasuryAmount)
  console.log(actualPrefix, 'BridgeableToken Total Supply:', normalizedTotalSupply)
}

main().catch(console.error)
