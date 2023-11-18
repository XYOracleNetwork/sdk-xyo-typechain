// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/chains/IGeotokenAuction.sol";
import "./PercentConstants.sol";

library BidFee {
    using Math for uint256;

    function _bidFee(
        IGeotokenAuction auction,
        uint256 id,
        uint256 bid
    ) internal view returns (uint256) {
        //is there a previous bidder?
        if (auction.bidder(id) == address(0)) {
            return 0;
        }

        uint256 currentBid = auction.currentBid(id);

        //no increase
        if (bid <= currentBid) {
            return 0;
        }

        uint256 increase = bid - currentBid;
        return
            increase.mulDiv(
                auction.bidFeePercent(),
                PercentConstants.PERCENT_DIV
            );
    }
}
