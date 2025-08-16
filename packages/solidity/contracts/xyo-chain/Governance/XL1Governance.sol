// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingUnanimous} from "./GovernorCountingUnanimous.sol";
import {GovernorGroup} from "./GovernorGroup.sol";

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract XL1Governance is GovernorCountingUnanimous, GovernorGroup {
    // ========== CONSTRUCTOR ==========

    constructor() GovernorGroup() {}

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

    // Restrict executor to owner
    function _executor() internal view override returns (address) {
        return address(this);
    }

    function _getVotes(
        address account,
        uint256 /* blockNumber */,
        bytes memory /* params */
    ) internal view override returns (uint256) {
        return 1;
    }

    function votingDelay() public view override returns (uint256) {
        return 1;
    }

    function votingPeriod() public view override returns (uint256) {
        return 20000;
    }

    function quorum(
        uint256 /* blockNumber */
    ) public pure override returns (uint256) {
        return 1; // only owner’s vote needed
    }
}
