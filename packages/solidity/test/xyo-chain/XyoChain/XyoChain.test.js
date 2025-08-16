import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { deployXyoChain } from '../helpers/index.js'
import chai from 'chai'
const { expect } = chai

describe('XyoChain', () => {
  describe('chainId', () => {
    it('should return chain id', async () => {
      const { chain } = await loadFixture(deployXyoChain)
      expect(await chain.chainId()).to.equal(await chain.getAddress())
    })
  })
  describe('forkedChainId', () => {
    it('should return forked chain id', async () => {
      const { chain, forkParams } = await loadFixture(deployXyoChain)
      expect(await chain.forkedChainId()).to.equal(forkParams.forkedChainId)
    })
  })
  describe('forkedAtBlockNumber', () => {
    it('should return forked at block number', async () => {
      const { chain, forkParams } = await loadFixture(deployXyoChain)
      expect(await chain.forkedAtBlockNumber()).to.equal(forkParams.forkedAtBlockNumber)
    })
  })
  describe('forkedAtHash', () => {
    it('should return forked at hash', async () => {
      const { chain, forkParams } = await loadFixture(deployXyoChain)
      expect(await chain.forkedAtHash()).to.equal(forkParams.forkedAtHash)
    })
  })
  describe('rewardsContract', () => {
    it('should return rewards contract address', async () => {
      const { chain, rewards } = await loadFixture(deployXyoChain)
      expect(await chain.rewardsContract()).to.equal(await rewards.getAddress())
    })
  })
})
