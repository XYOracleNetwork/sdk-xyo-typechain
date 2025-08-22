import hre from 'hardhat'

import { deployXyoChainRewards } from './deployXyoChainRewards.js'

const { ethers } = hre

const defaultForkParams = {
  forkedChainId: '0x0000000000000000000000000000000000000001',
  forkedAtBlockNumber: 12_345n,
  forkedAtHash: 0xab_cd_efn,
}

export const deployXyoChain = async (forkParamsOverrides = {}, rewardsConfigOverrides = {}) => {
  const forkParams = { ...defaultForkParams, ...forkParamsOverrides }
  const { rewards, config } = await deployXyoChainRewards(rewardsConfigOverrides)

  const XyoChain = await ethers.getContractFactory('XyoChain')
  const chain = await XyoChain.deploy(
    forkParams.forkedChainId,
    forkParams.forkedAtBlockNumber,
    forkParams.forkedAtHash,
    await rewards.getAddress(),
  )
  return {
    chain, forkParams, rewards, rewardsConfig: config,
  }
}
