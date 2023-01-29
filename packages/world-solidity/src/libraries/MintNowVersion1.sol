// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/chains/IGeotokenAuctionVersion1.sol";
import "../interfaces/chains/IXyoWorldGeotokens.sol";
import "./BidFeeVersion1.sol";

library MintNowVersion1 {
    using SafeMath for uint256;

    uint256 constant multiple = 4;
    uint256 constant ownerMultiple = 2;

    function _startedAndNotExpired(IGeotokenAuctionVersion1 auction, uint256 id)
        private
        view
        returns (bool)
    {
        if (auction.started(id) && !auction.expired(id)) {
            return true;
        }
        return false;
    }

    function _isOwner(IGeotokenAuctionVersion1 auction, uint256 id)
        private
        view
        returns (bool)
    {
        IGeotokenErc721 geotokens = auction.geotokens();
        uint256 parent = geotokens.parentOf(id);
        if (geotokens.exists(parent)) {
            if (geotokens.ownerOf(parent) == msg.sender) {
                return true;
            }
        }
        return false;
    }

    function _mintNowPrice(IGeotokenAuctionVersion1 auction, uint256 id)
        internal
        view
        returns (uint256)
    {
        if (_startedAndNotExpired(auction, id)) {
            if (_isOwner(auction, id)) {
                return auction.currentBid(id).mul(ownerMultiple);
            }
            return auction.currentBid(id).mul(multiple);
        }
        return 0;
    }

    function _mintNowFee(IGeotokenAuctionVersion1 auction, uint256 id)
        internal
        view
        returns (uint256)
    {
        uint256 price = _mintNowPrice(auction, id);
        uint256 fee = BidFeeVersion1._bidFee(auction, id, price);
        return fee;
    }

    function _mintNowPriceWithFee(IGeotokenAuctionVersion1 auction, uint256 id)
        internal
        view
        returns (uint256)
    {
        uint256 price = _mintNowPrice(auction, id);
        uint256 fee = _mintNowFee(auction, id);
        return price.add(fee);
    }
}
