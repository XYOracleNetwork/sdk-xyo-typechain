export const deployXL1Governance = async () => {
  const [deployer] = await ethers.getSigners()

  const XL1Governance = await ethers.getContractFactory('XL1Governance')
  const xl1Governance = await XL1Governance.deploy()

  return { xl1Governance, deployer }
}
