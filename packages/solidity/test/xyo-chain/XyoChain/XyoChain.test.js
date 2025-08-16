// test/XyoChain.test.js
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployXyoChain } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('XyoChain', () => {
  it('should deploy with correct fork parameters', async () => {
    const { chain, forkParams } = await loadFixture(deployXyoChain)

    expect(await chain.chainId()).to.equal(await chain.getAddress())
    expect(await chain.forkedChainId()).to.equal(forkParams.forkedChainId)
    expect(await chain.forkedAtBlockNumber()).to.equal(forkParams.forkedAtBlockNumber)
    expect(await chain.forkedAtHash()).to.equal(forkParams.forkedAtHash)
  })

  it('should store and return rewards contract address', async () => {
    const { chain, rewards } = await loadFixture(deployXyoChain)
    expect(await chain.rewardsContract()).to.equal(await rewards.getAddress())
  })
})
