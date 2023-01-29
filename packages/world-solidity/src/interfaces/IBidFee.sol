// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IBidFee {
    function bidFeePercent() external pure returns (uint8);

    function bidFee(uint256 id, uint256 bid) external view returns (uint256);
}
