import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import chai from 'chai'

const { expect } = chai

describe('AddressStaking', function () {
  async function deployOneYearAddressStakingFixture() {
    // Deploy a BridgeableToken token to use as the staking token
    const { token } = await deployBridgeableToken()

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()

    const AddressStaking = await ethers.getContractFactory('AddressStaking')
    const sut = await AddressStaking.deploy(1, token.target)

    return {
      sut, owner, otherAccount, token,
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
