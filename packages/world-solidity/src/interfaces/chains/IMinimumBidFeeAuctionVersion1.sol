// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../IAuctionVersion1.sol";
import "../IMinimumBid.sol";
import "../IBidFee.sol";

interface IMinimumBidFeeAuctionVersion1 is
    IAuctionVersion1,
    IBidFee,
    IMinimumBid
{}
