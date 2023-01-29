// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IAuction.sol";

abstract contract Auction is IAuction {
    using SafeMath for uint256;

    struct AuctionData {
        uint32 startTime; //informational
        uint32 endTime; // if this is in the future, it is a live auction
        uint256 startingBid; // informational
        uint256 bid; // current bid on the geotoken
        address bidder; // if bidder is 0, then the bid price is the initial/current price
    }

    mapping(uint256 => AuctionData) internal _auctions;

    function bidder(uint256 id) public view virtual override returns (address) {
        return _auctions[id].bidder;
    }

    function currentBid(uint256 id)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _auctions[id].bid;
    }

    function startingBid(uint256 id)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _auctions[id].startingBid;
    }

    function startTime(uint256 id)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _auctions[id].startTime;
    }

    function endTime(uint256 id)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _auctions[id].endTime;
    }

    function started(uint256 id) public view virtual override returns (bool) {
        return _auctions[id].endTime > 0;
    }

    function getNow() public view returns (uint256) {
        return block.timestamp;
    }

    function expired(uint256 id) public view virtual override returns (bool) {
        return started(id) && _auctions[id].endTime < block.timestamp;
    }

    function hasBid(uint256 id) public view virtual override returns (bool) {
        return _auctions[id].bidder != address(0);
    }

    function _startAuction(
        uint256 id,
        uint256 initialStartingBid,
        uint32 auctionLength
    ) internal virtual returns (bool) {
        require(!started(id), "Already started");
        _auctions[id].startTime = uint32(block.timestamp);
        _auctions[id].endTime = uint32(block.timestamp) + auctionLength;
        _auctions[id].startingBid = initialStartingBid;
        _auctions[id].bid = initialStartingBid;
        _auctions[id].bidder = address(0);
        return true;
    }

    function _startAuctionWithState(
        uint256 id,
        uint256 bid,
        address highBidder,
        uint32 auctionLength
    ) internal virtual returns (bool) {
        //require(!started(id), 'Already started');
        _auctions[id].startTime = uint32(block.timestamp);
        _auctions[id].endTime = uint32(block.timestamp) + auctionLength;
        if (bid != 0) {
            _auctions[id].startingBid = bid;
            _auctions[id].bid = bid;
        }
        if (highBidder != address(0x0)) {
            _auctions[id].bidder = highBidder;
        }
        return true;
    }
}
