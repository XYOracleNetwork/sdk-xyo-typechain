import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js'
import { expect } from 'chai'
import hre from 'hardhat'

import {
  advanceBlocks,
  deploySlashModuleV1,
  mintAndApprove,
  OFFENSE_EQUIVOCATION,
  OFFENSE_INVALID_BLOCK,
  signCertificate,
} from '../helpers/index.js'

const { ethers } = hre

const REQUEST_HASH = ethers.id('request')
const ADJUDICATION_HASH = ethers.id('adjudication')

describe('SlashModuleV1', () => {
  /** Stakes `amount` on `staked` from `staker`, so the address has stake to measure or lose. */
  const stakeOn = async (
    fixture: Awaited<ReturnType<typeof deploySlashModuleV1>>,
    staker: { address: string },
    staked: string,
    amount: bigint,
  ) => {
    const signer = await ethers.getSigner(staker.address)
    await mintAndApprove(fixture.token, signer, fixture.staking, amount)
    await fixture.staking.connect(signer).addStake(staked, amount)
  }

  const certificateFor = (accused: string, reporter: string, amount: bigint) => ({
    accused,
    adjudicationHash: ADJUDICATION_HASH,
    amount,
    offenseCode: OFFENSE_EQUIVOCATION,
    reporter,
    requestHash: REQUEST_HASH,
    xl1Block: 1234n,
  })

  describe('deployment', () => {
    it('owns the staking contract so it alone can slash', async () => {
      const { slashModule, staking } = await loadFixture(deploySlashModuleV1)
      expect(await staking.owner()).to.equal(await slashModule.getAddress())
    })

    it('records the configured slash fractions', async () => {
      const { slashModule } = await loadFixture(deploySlashModuleV1)
      expect(await slashModule.slashFractionBps(OFFENSE_EQUIVOCATION)).to.equal(1500)
      expect(await slashModule.slashFractionBps(OFFENSE_INVALID_BLOCK)).to.equal(500)
    })
  })

  describe('submitCertificate', () => {
    it('queues a certificate signed by a quorum of staked validators', async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, v2, reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)
      await stakeOn(fixture, v2, v2.address, stake)

      const cert = certificateFor(accused.address, reporter.address, stake / 100n)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1, v2])

      await expect(fixture.slashModule.submitCertificate(cert, signatures))
        .to.emit(fixture.slashModule, 'CertificateSubmitted')
    })

    it('rejects a quorum short of the required count', async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, , reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)

      const cert = certificateFor(accused.address, reporter.address, stake / 100n)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1])

      await expect(fixture.slashModule.submitCertificate(cert, signatures))
        .to.be.revertedWith('SlashModule: quorum not met')
    })

    it('refuses a signer below the minimum stake', async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, v2, reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)
      // v2 stakes below the validator minimum, so its signature must not count
      await stakeOn(fixture, v2, v2.address, ethers.parseUnits('1', 18))

      const cert = certificateFor(accused.address, reporter.address, stake / 100n)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1, v2])

      await expect(fixture.slashModule.submitCertificate(cert, signatures))
        .to.be.revertedWith('SlashModule: signer below minimum stake')
    })

    it('refuses a signature from the accused', async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, , reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)

      const cert = certificateFor(accused.address, reporter.address, stake / 100n)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1, accused])

      await expect(fixture.slashModule.submitCertificate(cert, signatures))
        .to.be.revertedWith('SlashModule: accused cannot sign')
    })

    it('cannot reach quorum by repeating one signature', async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, , reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)

      const cert = certificateFor(accused.address, reporter.address, stake / 100n)
      const [signature] = await signCertificate(fixture.slashModule, cert, [v1])

      await expect(fixture.slashModule.submitCertificate(cert, [signature, signature]))
        .to.be.revertedWith('SlashModule: signatures unordered or repeated')
    })

    it('refuses an amount above the offense ceiling', async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, v2, reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)
      await stakeOn(fixture, v2, v2.address, stake)

      // equivocation is 15%; ask for half the stake
      const cert = certificateFor(accused.address, reporter.address, stake / 2n)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1, v2])

      await expect(fixture.slashModule.submitCertificate(cert, signatures))
        .to.be.revertedWith('SlashModule: amount over ceiling')
    })

    it('refuses a second certificate for the same adjudication', async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, v2, reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)
      await stakeOn(fixture, v2, v2.address, stake)

      const cert = certificateFor(accused.address, reporter.address, stake / 100n)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1, v2])
      await fixture.slashModule.submitCertificate(cert, signatures)

      await expect(fixture.slashModule.submitCertificate(cert, signatures))
        .to.be.revertedWith('SlashModule: adjudication already submitted')
    })
  })

  describe('execute', () => {
    const queueCertificate = async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, v2, reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)
      await stakeOn(fixture, v2, v2.address, stake)

      const amount = stake / 100n
      const cert = certificateFor(accused.address, reporter.address, amount)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1, v2])
      await fixture.slashModule.submitCertificate(cert, signatures)
      return {
        ...fixture, accused, amount, stake,
      }
    }

    it('will not execute before the delay has passed', async () => {
      const { slashModule } = await queueCertificate()
      expect(await slashModule.isExecutable(0)).to.equal(false)
      await expect(slashModule.execute(0)).to.be.revertedWith('SlashModule: still in delay')
    })

    it('burns stake once the delay has passed', async () => {
      const {
        accused, amount, executionDelayBlocks, slashModule, staking,
      } = await queueCertificate()
      const before = await staking.activeByAddressStaked(accused.address)

      await advanceBlocks(executionDelayBlocks)
      expect(await slashModule.isExecutable(0)).to.equal(true)
      await expect(slashModule.execute(0)).to.emit(slashModule, 'CertificateExecuted')

      const after = await staking.activeByAddressStaked(accused.address)
      expect(after).to.be.lessThan(before)
      expect(before - after).to.be.closeTo(amount, amount / 100n)
    })

    it('can be executed by anyone, not only the submitter', async () => {
      const { executionDelayBlocks, slashModule } = await queueCertificate()
      const [, , , , , , stranger] = await ethers.getSigners()

      await advanceBlocks(executionDelayBlocks)
      await expect(slashModule.connect(stranger).execute(0)).to.emit(slashModule, 'CertificateExecuted')
    })

    it('will not execute twice', async () => {
      const { executionDelayBlocks, slashModule } = await queueCertificate()
      await advanceBlocks(executionDelayBlocks)
      await slashModule.execute(0)
      await expect(slashModule.execute(0)).to.be.revertedWith('SlashModule: already executed')
    })

    it('rejects an unknown certificate', async () => {
      const { slashModule } = await queueCertificate()
      await expect(slashModule.execute(99)).to.be.revertedWith('SlashModule: unknown certificate')
    })
  })

  describe('cancel', () => {
    const queueCertificate = async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, v2, reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)
      await stakeOn(fixture, v2, v2.address, stake)

      const cert = certificateFor(accused.address, reporter.address, stake / 100n)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1, v2])
      await fixture.slashModule.submitCertificate(cert, signatures)
      return fixture
    }

    it('lets the guardian stop a queued certificate', async () => {
      const { guardian, slashModule, executionDelayBlocks } = await queueCertificate()

      await expect(slashModule.connect(guardian).cancel(0)).to.emit(slashModule, 'CertificateCancelled')
      await advanceBlocks(executionDelayBlocks)
      await expect(slashModule.execute(0)).to.be.revertedWith('SlashModule: cancelled')
    })

    it('is closed to everyone but the guardian', async () => {
      const { slashModule } = await queueCertificate()
      const [, , , , , , stranger] = await ethers.getSigners()
      await expect(slashModule.connect(stranger).cancel(0)).to.be.revertedWith('SlashModule: guardian only')
    })

    it('stops working after the sunset block, permanently', async () => {
      const fixture = await loadFixture(deploySlashModuleV1)
      const [, , accused, v1, v2, reporter] = await ethers.getSigners()
      const stake = ethers.parseUnits('1000', 18)

      await stakeOn(fixture, accused, accused.address, stake)
      await stakeOn(fixture, v1, v1.address, stake)
      await stakeOn(fixture, v2, v2.address, stake)

      const cert = certificateFor(accused.address, reporter.address, stake / 100n)
      const signatures = await signCertificate(fixture.slashModule, cert, [v1, v2])
      await fixture.slashModule.submitCertificate(cert, signatures)

      const sunset = await fixture.slashModule.guardianSunsetBlock()
      const now = BigInt(await ethers.provider.getBlockNumber())
      await advanceBlocks(Number(sunset - now) + 1)

      await expect(fixture.slashModule.connect(fixture.guardian).cancel(0))
        .to.be.revertedWith('SlashModule: guardian expired')
    })
  })
})
