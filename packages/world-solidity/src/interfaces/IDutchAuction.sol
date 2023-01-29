// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IDutchAuction {
    function dutchAuctionActive(uint256 id) external view returns (bool);

    function dutchAuctionPrice(uint256 id) external view returns (uint256);

    function calcDutchAuctionPrice(uint256 basePrice, uint256 age)
        external
        pure
        returns (uint256);
}
