// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {Governor, IGovernor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {IAddressStaking} from "../AddressStaking/interfaces/IAddressStaking.sol";

abstract contract SenateGovernor is Governor, GovernorCountingSimple {
    IAddressStaking private __staking;

    // ========== CONSTRUCTOR ==========

    constructor(
        IAddressStaking staking // The stakers that are allowed to govern the contract
    ) {
        __staking = staking;
    }

    // ========== PUBLIC ==========

    //TODO: Build Senate Voting - This is one vote per staked address
}
