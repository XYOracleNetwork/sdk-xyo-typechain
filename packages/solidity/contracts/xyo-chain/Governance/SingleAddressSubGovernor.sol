// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernor} from "@openzeppelin/contracts/governance/Governor.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {SubGovernor} from "./SubGovernor.sol";

contract SingleAddressSubGovernor is SubGovernor, Ownable {
    uint256 private constant _OWNER_VOTE_WEIGHT = 1;

    constructor(
        string memory _name,
        uint256 _votingDelay,
        uint256 _votingPeriod
    ) SubGovernor(_name, _votingDelay, _votingPeriod) Ownable(msg.sender) {}

    // ------------------------------------------------------------------------
    // Core Governor parameters
    // ------------------------------------------------------------------------

    function quorum(
        uint256 /* blockNumber */
    ) public pure override returns (uint256) {
        return _OWNER_VOTE_WEIGHT; // only owner’s vote needed
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
}
