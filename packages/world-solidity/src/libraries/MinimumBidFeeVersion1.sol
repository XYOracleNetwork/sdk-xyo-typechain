// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/chains/IMinimumBidFeeAuctionVersion1.sol";
import "./PercentConstants.sol";

library MinimumBidFeeVersion1 {
    using SafeMath for uint256;

    function _minimumBidWithFee(
        IMinimumBidFeeAuctionVersion1 auction,
        uint256 id
    ) internal view returns (uint256) {
        uint256 minimumBid = auction.minimumBid(id);
        uint256 fee = auction.bidFee(id, minimumBid);
        return minimumBid.add(fee);
    }
}
