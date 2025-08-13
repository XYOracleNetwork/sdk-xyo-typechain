// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {Governor, IGovernor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

abstract contract SenateGovernor is Governor, GovernorCountingSimple {
    IERC4626 private __staking;

    // ========== CONSTRUCTOR ==========

    constructor(
        IERC4626 staking // The stakers that are allowed to govern the contract
    ) {
        __staking = staking;
    }

    // ========== PUBLIC ==========

    //TODO: Build Senate Voting
}
