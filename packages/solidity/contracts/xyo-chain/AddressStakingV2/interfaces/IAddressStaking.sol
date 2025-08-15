// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {IAddressStakingProperties} from "./IAddressStakingProperties.sol";
import {IAddressStakingFunctions} from "./IAddressStakingFunctions.sol";
import {IAddressStakingEvents} from "./IAddressStakingEvents.sol";

interface IAddressStaking is
    IAddressStakingProperties,
    IAddressStakingFunctions,
    IAddressStakingEvents
{}
