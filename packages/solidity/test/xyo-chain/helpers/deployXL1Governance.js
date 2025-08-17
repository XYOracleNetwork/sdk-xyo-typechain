export const XL1GovernanceDefaultName = 'XL1Governance'
export const XL1GovernanceDefaultVotingDelay = 1
export const XL1GovernanceDefaultVotingPeriod = 5

export const deployXL1Governance = async (
  governors,
  name = XL1GovernanceDefaultName,
  votingDelay = XL1GovernanceDefaultVotingDelay,
  votingPeriod = XL1GovernanceDefaultVotingPeriod,
) => {
  const [deployer] = await ethers.getSigners()

  const XL1Governance = await ethers.getContractFactory('XL1Governance')
  const xl1Governance = await XL1Governance.deploy(name, governors, votingDelay, votingPeriod)

  return { xl1Governance, deployer }
}
