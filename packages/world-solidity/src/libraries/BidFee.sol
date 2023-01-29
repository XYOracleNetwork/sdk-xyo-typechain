// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/chains/IGeotokenAuction.sol";
import "./PercentConstants.sol";

library BidFee {
    using SafeMath for uint256;

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

        uint256 increase = bid.sub(currentBid);
        return
            increase.mul(auction.bidFeePercent()).div(
                PercentConstants.PERCENT_DIV
            );
    }
}
