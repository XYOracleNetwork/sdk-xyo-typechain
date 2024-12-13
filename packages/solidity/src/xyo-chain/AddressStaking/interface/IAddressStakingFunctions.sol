// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IAddressStakingFunctions {
    function addStake(address staked, uint256 amount) external returns (bool);

    function removeStake(uint256 slot) external returns (bool);

    function withdrawStake(uint256 slot) external returns (bool);
}
