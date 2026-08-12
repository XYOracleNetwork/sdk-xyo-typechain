import { buildModule, type IgnitionModuleBuilder } from '@nomicfoundation/ignition-core'

/**
 * Deploys SlashModuleV1 against an already-deployed staking contract.
 *
 * Deploying does not arm anything: the module can only slash once it owns the staking contract,
 * and that ownership transfer is deliberately left as a separate, deliberate act rather than a
 * side effect of deployment. Until then this is inert on-chain code, which is what makes it safe
 * to put on a testnet early and leave it there while it is reviewed.
 */
export const SlashModuleV1Module = buildModule('SlashModuleV1', (m: IgnitionModuleBuilder) => {
  const stakingAddress = m.getParameter('stakingAddress')
  const guardian = m.getParameter('guardian')
  const guardianSunsetBlock = m.getParameter('guardianSunsetBlock')
  const executionDelayBlocks = m.getParameter('executionDelayBlocks')
  const quorumCount = m.getParameter('quorumCount')
  const minValidatorStake = m.getParameter('minValidatorStake')
  const offenseCodes = m.getParameter('offenseCodes')
  const fractionsBps = m.getParameter('fractionsBps')

  const slashModule = m.contract('SlashModuleV1', [
    stakingAddress,
    guardian,
    guardianSunsetBlock,
    executionDelayBlocks,
    quorumCount,
    minValidatorStake,
    offenseCodes,
    fractionsBps,
  ])

  return { slashModule }
})

export default SlashModuleV1Module
