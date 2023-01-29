// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../IRandomSlots.sol";
import "../IDutchAuction.sol";
import "./IGeotokenAuction.sol";

interface IXyoWorldMinter is IRandomSlots, IDutchAuction, IGeotokenAuction {
    event MinterStarted(address indexed by, uint256 initialStartingBid);
    event GeotokenMinted(address indexed by, uint256 indexed id);
    event TokensFlowed(
        uint256 indexed to,
        uint256 indexed from,
        uint256 amount
    );
    event TokensBurned(uint256 indexed from, uint256 amount);
    event AuctionStarted(
        address indexed by,
        uint256 indexed id,
        uint256 startingBid,
        uint32 length
    );
    event RefundedCurrentBid(
        address indexed to,
        uint256 indexed id,
        uint256 amount
    );
    event BidPlaced(address indexed by, uint256 indexed id, uint256 amount);
    event MintingFeeSent(
        address indexed to,
        uint256 indexed id,
        uint256 amount
    );
}
