// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract MonoSubGovernor is Governor, GovernorCountingSimple, Ownable {
    uint256 private constant _OWNER_VOTE_WEIGHT = 1;

    IGovernor public immutable parentGovernor;

    // Map our proposalId -> parent proposalId (both are uint256)
    mapping(uint256 => uint256) public parentProposalOf;

    event ParentProposed(uint256 indexed localId, uint256 indexed parentId);
    event ParentVoted(uint256 indexed localId, uint8 support, string reason);
    event ParentExecuteAttempt(
        uint256 indexed localId,
        bool success,
        bytes data
    );

    constructor(
        IGovernor _parentGovernor
    ) Governor("MonoSubGovernor") Ownable(msg.sender) {
        parentGovernor = _parentGovernor;
    }

    // ------------------------------------------------------------------------
    // Core Governor parameters
    // ------------------------------------------------------------------------

    function votingDelay() public view override returns (uint256) {
        return parentGovernor.votingDelay();
    }

    function votingPeriod() public view override returns (uint256) {
        return parentGovernor.votingPeriod();
    }

    function quorum(
        uint256 /* blockNumber */
    ) public pure override returns (uint256) {
        return _OWNER_VOTE_WEIGHT; // only owner’s vote needed
    }

    function getVotes(
        address account,
        uint256 /* blockNumber */
    ) public view override returns (uint256) {
        return account == owner() ? _OWNER_VOTE_WEIGHT : 0;
    }

    // Only the owner can propose
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override onlyOwner returns (uint256 localId) {
        // Create the local proposal first
        localId = super.propose(targets, values, calldatas, description);

        // Mirror to parent governor: compute description hash and parent id
        bytes32 descHash = keccak256(bytes(description));
        uint256 parentId = parentGovernor.hashProposal(
            targets,
            values,
            calldatas,
            descHash
        );

        // If the parent proposal doesn't exist yet, try to create it.
        // Many Governor implementations allow reusing the same (targets,values,calldatas,desc)
        // exactly once; proposing twice will revert, so we wrap in try/catch.
        try
            parentGovernor.propose(targets, values, calldatas, description)
        returns (uint256) {
            // ok: parent proposal created
        } catch {
            // It might already exist (created earlier by someone else); continue
        }

        parentProposalOf[localId] = parentId;
        emit ParentProposed(localId, parentId);
    }

    // Cast this contract’s vote on the *parent* proposal that corresponds to a local one.
    // Note: Whether this vote "counts" depends on the parent governor’s getVotes() logic.

    function relayVoteToParent(
        uint256 localProposalId,
        uint8 support,
        string calldata reason
    ) external onlyOwner {
        uint256 parentId = parentProposalOf[localProposalId];
        require(parentId != 0, "No parent proposal");

        parentGovernor.castVoteWithReason(parentId, support, reason);

        emit ParentVoted(localProposalId, support, reason);
    }

    // Attempts to execute the corresponding parent proposal.
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override returns (uint256 localId) {
        uint256 parentId = parentProposalOf[localId];
        if (parentId != 0) {
            (bool ok, bytes memory ret) = address(parentGovernor).call{
                value: msg.value
            }(
                abi.encodeWithSelector(
                    parentGovernor.execute.selector,
                    targets,
                    values,
                    calldatas,
                    descriptionHash
                )
            );
            emit ParentExecuteAttempt(localId, ok, ret);
            require(ok, "Parent execute failed");
        }
    }

    // Restrict executor to owner
    function _executor() internal view override returns (address) {
        return owner();
    }

    function _getVotes(
        address account,
        uint256 /* blockNumber */,
        bytes memory /* params */
    ) internal view override returns (uint256) {
        return account == owner() ? _OWNER_VOTE_WEIGHT : 0;
    }

    // --- REQUIRED: ERC-6372 clock (Governor uses this abstraction) ---
    // Use block number as the governance clock
    function clock() public view override returns (uint48) {
        return SafeCast.toUint48(block.number);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        // Standard string for block-number mode per ERC-6372
        return "mode=blocknumber&from=default";
    }

    // Required override due to multiple inheritance
    function supportsInterface(
        bytes4 interfaceId
    ) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
