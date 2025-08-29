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

    function getStakeCountForAddress(
        address account
    ) external view returns (uint256);

    function getAccountStakeBySlot(
        address account,
        uint256 slot
    ) external view returns (uint256);

    function getStakeById(
        uint256 id
    ) external view returns (AddressStakingLibrary.Stake memory);

    function stakedAddressesWithMinStake()
        external
        view
        returns (address[] memory);

    function stakedAddressesWithMinStakeCount() external view returns (uint256);
}
