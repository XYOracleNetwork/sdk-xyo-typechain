// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "../interfaces/chains/IMinimumBidFeeAuction.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./PercentConstants.sol";

library MinimumBid {
    using Math for uint256;

    function _minimumBidIncrease(
        IMinimumBidFeeAuction auction,
        uint256 id
    ) private view returns (uint256) {
        return
            auction.currentBid(id).mulDiv(
                auction.minimumBidIncreasePercent(),
                PercentConstants.PERCENT_DIV
            );
    }

    function _minimumBid(
        IMinimumBidFeeAuction auction,
        uint256 id
    ) internal view returns (uint256) {
        if (!auction.hasBid(id)) {
            return auction.startingBid(id);
        }
        uint256 minIncrease = _minimumBidIncrease(auction, id);
        return auction.currentBid(id) + minIncrease;
    }
}
