import type { AddressLike } from 'ethers'
import { network } from 'hardhat'

import { deploySingleAddressSubGovernor } from './deploySingleAddressSubGovernor.js'

export const XL1GovernanceDefaultName = 'XL1Governance'
export const XL1GovernanceDefaultVotingDelay = 1
export const XL1GovernanceDefaultVotingPeriod = 20

export const deployXL1Governance = async (
  governors: AddressLike[],
  name = XL1GovernanceDefaultName,
  votingDelay = XL1GovernanceDefaultVotingDelay,
  votingPeriod = XL1GovernanceDefaultVotingPeriod,
) => {
  const { ethers } = await network.connect()
  const [deployer] = await ethers.getSigners()

  const XL1Governance = await ethers.getContractFactory('XL1Governance')
  const xl1Governance = await XL1Governance.deploy(name, governors, votingDelay, votingPeriod)

  return { xl1Governance, deployer }
}

export const deployXL1GovernanceWithSingleAddressSubGovernor = async (
  name = XL1GovernanceDefaultName,
  votingDelay = XL1GovernanceDefaultVotingDelay,
  votingPeriod = XL1GovernanceDefaultVotingPeriod,
) => {
  const { subGovernor } = await deploySingleAddressSubGovernor()
  const subGovernorAddress = await subGovernor.getAddress()
  const { xl1Governance, deployer } = await deployXL1Governance([subGovernorAddress], name, votingDelay, votingPeriod)
  return {
    xl1Governance, subGovernor, deployer,
  }
}
