export const deployMockGovernor = async () => {
  const MockGovernor = await ethers.getContractFactory('MockGovernor') // TODO: Create this or use an existing implementation
  const mockGovernor = await MockGovernor.deploy()
  return { mockGovernor }
}

export const deploySingleAddressSubGovernor = async () => {
  const [deployer] = await ethers.getSigners()
  const { mockGovernor } = await deployMockGovernor()

  const SubGovFactory = await ethers.getContractFactory('SingleAddressSubGovernor')
  const subGovernor = await SubGovFactory.deploy(await mockGovernor.getAddress())

  return {
    subGovernor, mockGovernor, deployer,
  }
}
