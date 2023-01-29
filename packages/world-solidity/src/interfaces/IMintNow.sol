// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IMintNow {
    function mintNowPrice(uint256 id) external view returns (uint256);

    function mintNowFee(uint256 id) external view returns (uint256);
}
