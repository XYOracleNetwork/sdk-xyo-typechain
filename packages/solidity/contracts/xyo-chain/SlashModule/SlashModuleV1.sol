// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import {IAddressStaking} from "../AddressStakingV2/interfaces/IAddressStaking.sol";

/**
 * @title SlashModuleV1
 * @notice Executes slashes that a quorum of staked validators has certified, without any single
 *         party deciding when one happens.
 * @dev Owns the staking contract so it alone can call `slashStake`. Certificates are submitted,
 *      then executed by anyone after a delay: the delay is the window in which a guardian can
 *      cancel a bad certificate, and the guardian power expires at a block fixed at deployment so
 *      it cannot quietly become permanent.
 *
 *      Slashing here is burn-only. Any reward for the reporter is paid on XL1, not from this
 *      contract, so no value flows out of a slash into a party that might have caused it.
 */
contract SlashModuleV1 is EIP712 {
    /// @notice A certified slash, as attested by validators.
    struct Certificate {
        /// @notice Address whose stake is to be slashed.
        address accused;
        /// @notice Amount of stake to slash, in the staking token's smallest unit.
        uint256 amount;
        /// @notice Hash of the finalized report this slash rests on.
        bytes32 requestHash;
        /// @notice Hash of the finalized adjudication that confirmed the report.
        bytes32 adjudicationHash;
        /// @notice Offense class, indexed from one in the catalog's order.
        uint8 offenseCode;
        /// @notice XL1 height at which the adjudication was finalized.
        uint256 xl1Block;
        /// @notice Address credited as the reporter.
        address reporter;
    }

    /// @notice A submitted certificate and where it is in its lifecycle.
    struct PendingCertificate {
        Certificate cert;
        uint256 submittedAtBlock;
        bool cancelled;
        bool executed;
    }

    bytes32 private constant CERTIFICATE_TYPEHASH =
        keccak256(
            "Certificate(address accused,uint256 amount,bytes32 requestHash,bytes32 adjudicationHash,uint8 offenseCode,uint256 xl1Block,address reporter)"
        );

    /// @notice The staking contract this module slashes against.
    IAddressStaking public immutable staking;
    /// @notice Address allowed to cancel a pending certificate, until the sunset block.
    address public immutable guardian;
    /// @notice Block after which the guardian can no longer cancel anything.
    uint256 public immutable guardianSunsetBlock;
    /// @notice Blocks that must pass between submission and execution.
    uint256 public immutable executionDelayBlocks;
    /// @notice Distinct validator signatures a certificate needs.
    uint256 public immutable quorumCount;
    /// @notice Stake a signer must hold for its signature to count.
    uint256 public immutable minValidatorStake;

    /// @notice Slash fraction per offense code, in basis points.
    mapping(uint8 => uint16) public slashFractionBps;

    /// @notice Certificates by id.
    mapping(uint256 => PendingCertificate) public certificates;
    /// @notice Ids already used by a submitted certificate, keyed by adjudication hash.
    mapping(bytes32 => bool) public adjudicationSubmitted;

    uint256 private _nextCertificateId;

    /// @notice Emitted when a certificate is accepted into the queue.
    event CertificateSubmitted(uint256 indexed certId, address indexed accused, bytes32 requestHash);
    /// @notice Emitted when a certificate executes and stake is burned.
    event CertificateExecuted(uint256 indexed certId, uint256 burned);
    /// @notice Emitted when the guardian cancels a certificate before it executes.
    event CertificateCancelled(uint256 indexed certId);

    /**
     * @param staking_ Staking contract this module will own and slash against.
     * @param guardian_ Address allowed to cancel pending certificates.
     * @param guardianSunsetBlock_ Block after which cancellation stops working, forever.
     * @param executionDelayBlocks_ Blocks between submission and execution.
     * @param quorumCount_ Distinct qualifying signatures a certificate needs.
     * @param minValidatorStake_ Stake a signer must hold to count toward quorum.
     * @param offenseCodes_ Offense codes to configure fractions for.
     * @param fractionsBps_ Slash fraction for each offense code, in basis points.
     */
    constructor(
        IAddressStaking staking_,
        address guardian_,
        uint256 guardianSunsetBlock_,
        uint256 executionDelayBlocks_,
        uint256 quorumCount_,
        uint256 minValidatorStake_,
        uint8[] memory offenseCodes_,
        uint16[] memory fractionsBps_
    ) EIP712("XL1SlashModule", "1") {
        require(address(staking_) != address(0), "SlashModule: staking required");
        require(quorumCount_ > 0, "SlashModule: quorum required");
        require(offenseCodes_.length == fractionsBps_.length, "SlashModule: fraction length mismatch");
        staking = staking_;
        guardian = guardian_;
        guardianSunsetBlock = guardianSunsetBlock_;
        executionDelayBlocks = executionDelayBlocks_;
        quorumCount = quorumCount_;
        minValidatorStake = minValidatorStake_;
        for (uint256 i = 0; i < offenseCodes_.length; i++) {
            require(fractionsBps_[i] <= 10000, "SlashModule: fraction over 100%");
            slashFractionBps[offenseCodes_[i]] = fractionsBps_[i];
        }
    }

    /**
     * @notice Accepts a certificate signed by a quorum of staked validators.
     * @dev Signatures must arrive with strictly ascending signer addresses. That ordering is what
     *      makes "distinct signers" checkable in one pass without storing anything, so a caller
     *      cannot reach quorum by repeating one signature.
     *
     *      The amount ceiling is measured against active stake only, because stake that is
     *      removed but not yet withdrawn has no external per-address view. That under-counts an
     *      accused who is part-way out, which is the safe direction: the staking contract clamps
     *      any amount to what is really at risk, and the quorum attests the adjudicated figure.
     * @param cert The certified slash.
     * @param signatures Validator signatures over the certificate, ordered by signer address.
     * @return certId Id assigned to the queued certificate.
     */
    function submitCertificate(
        Certificate calldata cert,
        bytes[] calldata signatures
    ) external returns (uint256 certId) {
        require(cert.accused != address(0), "SlashModule: accused required");
        require(cert.amount > 0, "SlashModule: amount required");
        require(!adjudicationSubmitted[cert.adjudicationHash], "SlashModule: adjudication already submitted");
        require(signatures.length >= quorumCount, "SlashModule: quorum not met");

        uint16 fraction = slashFractionBps[cert.offenseCode];
        require(fraction > 0, "SlashModule: unknown offense code");
        uint256 ceiling = (staking.activeByAddressStaked(cert.accused) * fraction) / 10000;
        require(cert.amount <= ceiling, "SlashModule: amount over ceiling");

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    CERTIFICATE_TYPEHASH,
                    cert.accused,
                    cert.amount,
                    cert.requestHash,
                    cert.adjudicationHash,
                    cert.offenseCode,
                    cert.xl1Block,
                    cert.reporter
                )
            )
        );

        address previous = address(0);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ECDSA.recover(digest, signatures[i]);
            require(signer > previous, "SlashModule: signatures unordered or repeated");
            require(signer != cert.accused, "SlashModule: accused cannot sign");
            require(
                staking.activeByAddressStaked(signer) >= minValidatorStake,
                "SlashModule: signer below minimum stake"
            );
            previous = signer;
        }

        certId = _nextCertificateId++;
        certificates[certId] = PendingCertificate({
            cert: cert,
            submittedAtBlock: block.number,
            cancelled: false,
            executed: false
        });
        adjudicationSubmitted[cert.adjudicationHash] = true;
        emit CertificateSubmitted(certId, cert.accused, cert.requestHash);
    }

    /**
     * @notice Executes a queued certificate once its delay has passed.
     * @dev Permissionless by design: if execution needed a particular party, that party could
     *      withhold it, and the whole point is that no one can.
     * @param certId Id of the certificate to execute.
     * @return burned Stake actually burned, which may be under the requested amount.
     */
    function execute(uint256 certId) external returns (uint256 burned) {
        PendingCertificate storage pending = certificates[certId];
        require(pending.cert.accused != address(0), "SlashModule: unknown certificate");
        require(!pending.executed, "SlashModule: already executed");
        require(!pending.cancelled, "SlashModule: cancelled");
        require(
            block.number >= pending.submittedAtBlock + executionDelayBlocks,
            "SlashModule: still in delay"
        );

        pending.executed = true;
        burned = staking.slashStake(pending.cert.accused, pending.cert.amount);
        emit CertificateExecuted(certId, burned);
    }

    /**
     * @notice Cancels a queued certificate before it executes.
     * @dev Available only to the guardian, and only until the sunset block — after that this
     *      reverts for everyone, permanently, so the emergency brake cannot outlive its purpose.
     * @param certId Id of the certificate to cancel.
     */
    function cancel(uint256 certId) external {
        require(msg.sender == guardian, "SlashModule: guardian only");
        require(block.number <= guardianSunsetBlock, "SlashModule: guardian expired");
        PendingCertificate storage pending = certificates[certId];
        require(pending.cert.accused != address(0), "SlashModule: unknown certificate");
        require(!pending.executed, "SlashModule: already executed");
        require(!pending.cancelled, "SlashModule: already cancelled");

        pending.cancelled = true;
        emit CertificateCancelled(certId);
    }

    /// @notice Whether a certificate has passed its delay and can be executed now.
    function isExecutable(uint256 certId) external view returns (bool) {
        PendingCertificate storage pending = certificates[certId];
        return
            pending.cert.accused != address(0) &&
            !pending.executed &&
            !pending.cancelled &&
            block.number >= pending.submittedAtBlock + executionDelayBlocks;
    }
}
