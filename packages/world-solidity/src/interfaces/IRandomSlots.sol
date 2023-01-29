// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IRandomSlots {
    function randomSlotCount() external view returns (uint8);

    function randomSlotOdds(uint256 slot) external view returns (uint8);

    function randomSlotWeight(uint256 slot) external view returns (int16);
}
