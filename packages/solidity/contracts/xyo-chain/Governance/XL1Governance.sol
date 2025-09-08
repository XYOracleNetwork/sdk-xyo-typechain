// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingUnanimous} from "./GovernorCountingUnanimous.sol";
import {GovernorGroup} from "./GovernorGroup.sol";

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract XL1Governance is GovernorCountingUnanimous, GovernorGroup {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 private __votingDelay;
    uint256 private __votingPeriod;

    // ========== CONSTRUCTOR ==========

    constructor(
        string memory _name,
        address[] memory _governors,
        uint256 _votingDelay,
        uint256 _votingPeriod
    ) GovernorGroup(_name, _governors) {
        __votingDelay = _votingDelay;
        __votingPeriod = _votingPeriod;
    }

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
        return __governors.contains(account) ? 1 : 0;
    }

    function votingDelay() public view override returns (uint256) {
        return __votingDelay;
    }

    function votingPeriod() public view override returns (uint256) {
        return __votingPeriod;
    }

    function quorum(
        uint256 /* blockNumber */
    ) public view override returns (uint256) {
        return governorCount();
    }

    // function state(
    //     uint256 proposalId
    // ) public view override returns (ProposalState) {
    //     if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
    //         return ProposalState.Succeeded;
    //     }
    //     return super.state(proposalId);
    // }
}
