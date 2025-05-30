// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

import "./IAddressStakingProperties.sol";
import "./IAddressStakingFunctions.sol";
import "./IAddressStakingEvents.sol";

interface IAddressStaking is
    IAddressStakingProperties,
    IAddressStakingFunctions,
    IAddressStakingEvents
{}
