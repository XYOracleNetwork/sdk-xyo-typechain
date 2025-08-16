// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {Governor, IGovernor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {IAddressStaking} from "../AddressStaking/interfaces/IAddressStaking.sol";
import {SubGovernor} from "./SubGovernor.sol";

abstract contract SenateGovernor is SubGovernor {
    IAddressStaking private __staking;
    uint256 private __minStake;

    // ========== CONSTRUCTOR ==========

    constructor(
        IAddressStaking staking, // The stakers that are allowed to govern the contract
        uint256 minStake // The minimum a staker must have to be able to vote
    ) {
        __minStake = minStake;
        __staking = staking;
    }

    // ========== PUBLIC ==========

    function quorum(
        uint256 /* blockNumber */
    ) public view override returns (uint256) {
        return __staking.stakedAddresses(__minStake); // only owner’s vote needed
    }
}
