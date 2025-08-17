// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract SubGovernor is Governor, GovernorCountingSimple {
    uint256 private __votingDelay;
    uint256 private __votingPeriod;

    event SubGovernorVoted(uint256 indexed localId, uint8 support);

    // ========== CONSTRUCTOR ==========

    constructor(
        string memory _name,
        uint256 _votingDelay,
        uint256 _votingPeriod
    ) Governor(_name) {
        __votingDelay = _votingDelay;
        __votingPeriod = _votingPeriod;
    }

    // ------------------------------------------------------------------------
    // Core Governor functions
    // ------------------------------------------------------------------------

    function votingDelay() public view override returns (uint256) {
        return __votingDelay;
    }

    function votingPeriod() public view override returns (uint256) {
        return __votingPeriod;
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
