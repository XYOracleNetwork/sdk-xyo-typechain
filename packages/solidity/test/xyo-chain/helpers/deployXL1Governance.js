export const deployXL1Governance = async (votingDelay = 1, votingPeriod = 5) => {
  const [deployer] = await ethers.getSigners()

  const XL1Governance = await ethers.getContractFactory('XL1Governance')
  const xl1Governance = await XL1Governance.deploy(votingDelay, votingPeriod)

  return { xl1Governance, deployer }
}
