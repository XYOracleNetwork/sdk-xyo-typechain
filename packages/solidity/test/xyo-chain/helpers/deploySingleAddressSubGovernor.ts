export const SingleAddressSubGovernorDefaultName = 'SingleAddressSubGovernor'
export const SingleAddressSubGovernorDefaultVotingDelay = 1
export const SingleAddressSubGovernorDefaultVotingPeriod = 5

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
