import hre from 'hardhat'

import { deployAddressStakingV2 } from './deployAddressStakingV2.js'

const { ethers } = hre

/** Offense codes, indexed from one in the catalog's order. */
export const OFFENSE_EQUIVOCATION = 1
export const OFFENSE_INVALID_BLOCK = 2

/**
 * Deploys a slash module owning a fresh staking contract.
 *
 * Ownership is transferred here because `slashStake` is owner-only: without it the module could
 * queue certificates but never execute one.
 */
export const deploySlashModuleV1 = async (
  executionDelayBlocks = 5,
  quorumCount = 2,
  guardianSunsetBlocks = 1000,
) => {
  const { staking, token, maxStakersPerAddress } = await deployAddressStakingV2(3, 10)
  const [owner, guardian] = await ethers.getSigners()
  const minValidatorStake = ethers.parseUnits('100', 18)
  const sunsetBlock = BigInt(await ethers.provider.getBlockNumber()) + BigInt(guardianSunsetBlocks)

  const Module = await ethers.getContractFactory('SlashModuleV1')
  const slashModule = await Module.deploy(
    await staking.getAddress(),
    guardian.address,
    sunsetBlock,
    executionDelayBlocks,
    quorumCount,
    minValidatorStake,
    [OFFENSE_EQUIVOCATION, OFFENSE_INVALID_BLOCK],
    [1500, 500],
  )
  await slashModule.waitForDeployment()
  await staking.transferOwnership(await slashModule.getAddress())

  return {
    executionDelayBlocks,
    guardian,
    maxStakersPerAddress,
    minValidatorStake,
    owner,
    quorumCount,
    slashModule,
    staking,
    sunsetBlock,
    token,
  }
}

/** Builds the EIP-712 signing payload for a certificate. */
export const certificateTypedData = async (
  slashModule: { getAddress: () => Promise<string> },
  cert: Record<string, unknown>,
) => ({
  domain: {
    chainId: (await ethers.provider.getNetwork()).chainId,
    name: 'XL1SlashModule',
    verifyingContract: await slashModule.getAddress(),
    version: '1',
  },
  message: cert,
  types: {
    Certificate: [
      { name: 'accused', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'requestHash', type: 'bytes32' },
      { name: 'adjudicationHash', type: 'bytes32' },
      { name: 'offenseCode', type: 'uint8' },
      { name: 'xl1Block', type: 'uint256' },
      { name: 'reporter', type: 'address' },
    ],
  },
})

/**
 * Signs a certificate with each signer and returns the signatures ordered by signer address,
 * which is the order the module requires so it can check distinctness in one pass.
 */
export const signCertificate = async (
  slashModule: { getAddress: () => Promise<string> },
  cert: Record<string, unknown>,
  signers: { address: string; signTypedData: (d: object, t: object, m: object) => Promise<string> }[],
) => {
  const { domain, types, message } = await certificateTypedData(slashModule, cert)
  const signed = await Promise.all(signers.map(async signer => ({
    address: signer.address.toLowerCase(),
    signature: await signer.signTypedData(domain, types, message),
  })))
  return signed
    .sort((a, b) => a.address < b.address ? -1 : 1)
    .map(entry => entry.signature)
}
