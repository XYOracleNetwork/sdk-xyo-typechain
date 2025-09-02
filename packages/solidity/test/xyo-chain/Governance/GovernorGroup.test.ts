import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  deploySingleAddressSubGovernor, deployXL1GovernanceWithSingleAddressSubGovernor, proposeToCallSmartContract,
} from '../helpers/index.js'

const { ethers } = hre

describe.only('GovernorGroup', () => {
  it('should allow adding governors', async () => {
    const [signer] = await ethers.getSigners()
    const { subGovernor, xl1Governance } = await loadFixture(deployXL1GovernanceWithSingleAddressSubGovernor)
    const { subGovernor: newSubGovernor } = await loadFixture(deploySingleAddressSubGovernor)
    const initialGovernors = await xl1Governance.governors()
    expect(initialGovernors.length).to.equal(1)
    expect(initialGovernors[0]).to.equal(await subGovernor.getAddress())
    expect(await xl1Governance.isGovernor(await subGovernor.getAddress())).to.equal(true)
    const proposal = await proposeToCallSmartContract(xl1Governance, 'addGovernor', [await newSubGovernor.getAddress()], subGovernor, signer)
  })
})
