// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "../Library.sol";

interface IAddressStakingFunctions {
    function addStake(address staked, uint256 amount) external returns (bool);

    function removeStake(uint256 slot) external returns (bool);

    function withdrawStake(uint256 slot) external returns (bool);

    function getStake(
        uint256 slot
    ) external view returns (AddressStakingLibrary.Stake memory);
}
