// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract SubGovernor is Governor, GovernorCountingSimple {
    IGovernor public immutable parentGovernor;

    // Map our proposalId -> parent proposalId (both are uint256)
    mapping(uint256 => uint256) public parentProposalOf;

    event SubGovernorVoted(uint256 indexed localId, uint8 support);

    constructor(IGovernor _parentGovernor) Governor("SubGovernor") {
        parentGovernor = _parentGovernor;
    }

    // ------------------------------------------------------------------------
    // Core Governor functions
    // ------------------------------------------------------------------------

    function votingDelay() public view override returns (uint256) {
        return parentGovernor.votingDelay();
    }

    function votingPeriod() public view override returns (uint256) {
        return parentGovernor.votingPeriod();
    }

    function propose(
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        string memory
    ) public pure override returns (uint256) {
        revert("Proposals are not allowed");
    }

    /**
     * @dev Is the proposal failure or not.
     */
    function _voteFailed(uint256 proposalId) internal view returns (bool) {
        if (!_quorumReached(proposalId)) {
            return false;
        }

        (
            uint256 againstVotes,
            uint256 forVotes,
            uint256 abstainVotes
        ) = proposalVotes(proposalId);

        return againstVotes > forVotes;
    }

    function relayVoteToParent(uint256 localProposalId) external {
        uint256 parentId = parentProposalOf[localProposalId];
        require(parentId != 0, "No parent proposal");

        if (_voteSucceeded(localProposalId)) {
            parentGovernor.castVote(parentId, 1);
            emit SubGovernorVoted(localProposalId, 1);
        } else if (_voteFailed(localProposalId)) {
            parentGovernor.castVote(parentId, 0);
            emit SubGovernorVoted(localProposalId, 0);
        }
    }

    // Attempts to execute the corresponding parent proposal.
    function execute(
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        bytes32
    ) public payable override returns (uint256) {
        revert("Execution is not allowed");
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
}
