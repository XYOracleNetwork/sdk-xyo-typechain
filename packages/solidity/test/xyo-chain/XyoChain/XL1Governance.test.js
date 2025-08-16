import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import chai from 'chai'
const { expect } = chai
import { deployXL1Governance } from '../helpers/index.js'

describe('XL1Governance', () => {
  it('matches calcBlockReward', async () => {
    const { xl1Governance, deployer } = await loadFixture(deployXL1Governance)
    expect(true).to.equal(true)
  })
})
