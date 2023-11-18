// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "../interfaces/chains/IGeotokenAuction.sol";
import "../interfaces/chains/IXyoWorldGeotokens.sol";
import "./BidFee.sol";

library MintNow {
    uint256 constant multiple = 4;
    uint256 constant ownerMultiple = 2;

    function _startedAndNotExpired(
        IGeotokenAuction auction,
        uint256 id
    ) private view returns (bool) {
        if (auction.started(id) && !auction.expired(id)) {
            return true;
        }
        return false;
    }

    function _isOwner(
        IGeotokenAuction auction,
        uint256 id
    ) private view returns (bool) {
        IGeotokenErc721 geotokens = auction.geotokens();
        uint256 parent = geotokens.parentOf(id);
        if (geotokens.exists(parent)) {
            if (geotokens.ownerOf(parent) == msg.sender) {
                return true;
            }
        }
        return false;
    }

    function _mintNowPrice(
        IGeotokenAuction auction,
        uint256 id
    ) internal view returns (uint256) {
        if (_startedAndNotExpired(auction, id)) {
            if (_isOwner(auction, id)) {
                return auction.currentBid(id) * ownerMultiple;
            }
            return auction.currentBid(id) * multiple;
        }
        return 0;
    }

    function _mintNowFee(
        IGeotokenAuction auction,
        uint256 id
    ) internal view returns (uint256) {
        uint256 price = _mintNowPrice(auction, id);
        uint256 fee = BidFee._bidFee(auction, id, price);
        return fee;
    }

    function _mintNowPriceWithFee(
        IGeotokenAuction auction,
        uint256 id
    ) internal view returns (uint256) {
        uint256 price = _mintNowPrice(auction, id);
        uint256 fee = _mintNowFee(auction, id);
        return price + fee;
    }
}
