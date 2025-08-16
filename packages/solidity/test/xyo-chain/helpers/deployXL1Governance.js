export const DefaultVotingDelay = 1
export const DefaultVotingPeriod = 5

export const deployXL1Governance = async (votingDelay = DefaultVotingDelay, votingPeriod = DefaultVotingPeriod) => {
  const [deployer] = await ethers.getSigners()

  const XL1Governance = await ethers.getContractFactory('XL1Governance')
  const xl1Governance = await XL1Governance.deploy(votingDelay, votingPeriod)

  return { xl1Governance, deployer }
}
