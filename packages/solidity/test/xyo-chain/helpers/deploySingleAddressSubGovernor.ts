import hre from 'hardhat'

const { ethers } = hre

const SingleAddressSubGovernorDefaultName = 'SingleAddressSubGovernor'
const SingleAddressSubGovernorDefaultVotingDelay = 10
const SingleAddressSubGovernorDefaultVotingPeriod = 500

export const deploySingleAddressSubGovernor = async (
  name = SingleAddressSubGovernorDefaultName,
  votingDelay = SingleAddressSubGovernorDefaultVotingDelay,
  votingPeriod = SingleAddressSubGovernorDefaultVotingPeriod,
) => {
  const [deployer] = await ethers.getSigners()

  const SingleAddressSubGovernor = await ethers.getContractFactory('SingleAddressSubGovernor')
  const subGovernor = await SingleAddressSubGovernor.deploy(name, votingDelay, votingPeriod)

  return { subGovernor, deployer }
}
