export const deploySingleAddressSubGovernor = async (parentGovernor) => {
  const [deployer] = await ethers.getSigners()

  const SubGovFactory = await ethers.getContractFactory('SingleAddressSubGovernor')
  const subGovernor = await SubGovFactory.deploy(await parentGovernor.getAddress())

  return {
    parentGovernor, subGovernor, deployer,
  }
}
