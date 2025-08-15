import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployBridgeableToken } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('BridgeableToken', function () {
  describe('owner', function () {
    it('Should be from the correct address', async function () {
      const { sut, owner } = await loadFixture(deployBridgeableToken)
      const deploymentTx = await sut.deploymentTransaction()
      const deployerAddress = deploymentTx?.from
      expect(deployerAddress).to.equal(owner.address)
    })
  })
})
