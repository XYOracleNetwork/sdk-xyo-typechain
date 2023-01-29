// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IMinimumBid {
    function minimumBidIncreasePercent() external pure returns (uint8);

    function minimumBid(uint256 id) external view returns (uint256);
}
