import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs.js'
import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import chai from 'chai'

const { expect } = chai

describe('XL1Governance', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearXL1GovernanceFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60
    const ONE_GWEI = 1_000_000_000

    const lockedAmount = ONE_GWEI
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()

    const XL1Governance = await ethers.getContractFactory('XL1Governance')
    const lock = await XL1Governance.deploy(unlockTime, { value: lockedAmount })

    return {
      lock, unlockTime, lockedAmount, owner, otherAccount,
    }
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { lock, owner } = await loadFixture(deployOneYearXL1GovernanceFixture)

      expect(await lock.owner()).to.equal(owner.address)
    })
  })
})
