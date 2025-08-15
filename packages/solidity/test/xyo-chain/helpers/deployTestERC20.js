export const deployTestERC20 = async (name = 'Test Token', symbol = 'TEST') => {
  const [deployer] = await ethers.getSigners()
  const Token = await ethers.getContractFactory('ERC20')
  const token = await Token.deploy(name, symbol)
  await token.waitForDeployment()
  return { token, deployer }
}
