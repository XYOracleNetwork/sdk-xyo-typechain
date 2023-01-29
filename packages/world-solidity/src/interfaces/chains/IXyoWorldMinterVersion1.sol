// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../IRandomSlots.sol";
import "../IDutchAuction.sol";
import "./IGeotokenAuctionVersion1.sol";

interface IXyoWorldMinterVersion1 is
    IRandomSlots,
    IDutchAuction,
    IGeotokenAuctionVersion1
{
    event MinterStarted(address indexed by, uint256 initialStartingBid);
    event GeotokenMinted(address indexed by, uint256 indexed id);
    event TokensFlowed(
        uint256 indexed to,
        uint256 indexed from,
        uint256 amount
    );
    event TokensBurned(uint256 indexed from, uint256 amount);
    event AuctionStarted(
        uint256 indexed id,
        uint256 startingBid,
        uint32 length
    );
    event RefundedCurrentBid(
        address indexed to,
        uint256 indexed id,
        uint256 amount
    );
    event BidPlaced(address by, uint256 indexed id, uint256 amount);
}
