import hre from 'hardhat'

const { ethers } = hre

export const deployTestERC20 = async (name = 'Test Token', symbol = 'TEST') => {
  const TokenFactory = await ethers.getContractFactory('BridgeableToken')
  const token = await TokenFactory.deploy(name, symbol)

  // Contracts are deployed using the first signer/account by default
  const [owner] = await ethers.getSigners()

  return { token, owner }
}
