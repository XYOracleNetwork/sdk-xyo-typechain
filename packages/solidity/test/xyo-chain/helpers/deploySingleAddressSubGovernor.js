export const deploySingleAddressSubGovernor = async () => {
  const [deployer] = await ethers.getSigners()

  const SubGovFactory = await ethers.getContractFactory('SingleAddressSubGovernor')
  const subGovernor = await SubGovFactory.deploy(await mockGovernor.getAddress())

  return {
    subGovernor, mockGovernor, deployer,
  }
}
