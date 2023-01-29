// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/chains/IMinimumBidFeeAuction.sol";
import "./PercentConstants.sol";

library MinimumBid {
    using SafeMath for uint256;

    function _minimumBidIncrease(IMinimumBidFeeAuction auction, uint256 id)
        private
        view
        returns (uint256)
    {
        return
            auction.currentBid(id).mul(auction.minimumBidIncreasePercent()).div(
                PercentConstants.PERCENT_DIV
            );
    }

    function _minimumBid(IMinimumBidFeeAuction auction, uint256 id)
        internal
        view
        returns (uint256)
    {
        if (!auction.hasBid(id)) {
            return auction.startingBid(id);
        }
        uint256 minIncrease = _minimumBidIncrease(auction, id);
        return auction.currentBid(id).add(minIncrease);
    }
}
