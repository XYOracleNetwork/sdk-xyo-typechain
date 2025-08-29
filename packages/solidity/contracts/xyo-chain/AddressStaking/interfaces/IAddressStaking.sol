// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

import {IAddressStakingProperties} from "./IAddressStakingProperties.sol";
import {IAddressStakingFunctions} from "./IAddressStakingFunctions.sol";
import {IAddressStakingEvents} from "./IAddressStakingEvents.sol";

interface IAddressStaking is
    IAddressStakingProperties,
    IAddressStakingFunctions,
    IAddressStakingEvents
{}
