// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingUnanimous} from "./GovernorCountingUnanimous.sol";
import {GovernorGroup} from "./GovernorGroup.sol";

abstract contract XL1Governance is GovernorCountingUnanimous, GovernorGroup {
    // ========== CONSTRUCTOR ==========

    constructor(
        IGovernor[] memory _governors // The addresses that are allowed to govern the contract
    ) GovernorGroup(_governors) {}
}
