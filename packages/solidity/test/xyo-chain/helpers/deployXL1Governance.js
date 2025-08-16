export const XL1GovernanceDefaultVotingDelay = 1
export const XL1GovernanceDefaultVotingPeriod = 5

export const deployXL1Governance = async (votingDelay = XL1GovernanceDefaultVotingDelay, votingPeriod = XL1GovernanceDefaultVotingPeriod) => {
  const [deployer] = await ethers.getSigners()

  const XL1Governance = await ethers.getContractFactory('XL1Governance')
  const xl1Governance = await XL1Governance.deploy(votingDelay, votingPeriod)

  return { xl1Governance, deployer }
}
