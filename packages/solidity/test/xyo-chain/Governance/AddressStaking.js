import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import chai from 'chai'

const { expect } = chai

describe('AddressStaking', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearAddressStakingFixture() {
    // Deploy a BridgeableToken token to use as staking token
    // const initialSupply = ethers.parseUnits('1000000', 18)
    const TokenFactory = await ethers.getContractFactory('BridgeableToken')
    const stakingToken = await TokenFactory.deploy('Test Token', 'TEST')

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()

    const AddressStaking = await ethers.getContractFactory('AddressStaking')
    const sut = await AddressStaking.deploy(1, stakingToken.target)

    return {
      sut, owner, otherAccount, stakingToken,
    }
  }

  describe('deploymentTransaction', function () {
    it('Should be from the correct address', async function () {
      const { sut, owner } = await loadFixture(deployOneYearAddressStakingFixture)
      const deploymentTx = await sut.deploymentTransaction()
      const deployerAddress = deploymentTx?.from
      expect(deployerAddress).to.equal(owner.address)
    })
  })
})
