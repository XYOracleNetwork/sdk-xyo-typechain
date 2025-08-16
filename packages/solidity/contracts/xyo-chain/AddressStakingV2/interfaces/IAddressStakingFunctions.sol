// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {AddressStakingLibrary} from "../Library.sol";

interface IAddressStakingFunctions {
    function addStake(address staked, uint256 amount) external returns (bool);

    function removeStake(uint256 slot) external returns (bool);

    function withdrawStake(uint256 slot) external returns (bool);

    function slashStake(
        address stakedAddress,
        uint256 amount
    ) external returns (uint256);

    function getStake(
        address staker,
        uint256 slot
    ) external view returns (AddressStakingLibrary.Stake memory);

    function stakedAddresses(
        uint256 minStake
    ) external view returns (address[] memory);
}
